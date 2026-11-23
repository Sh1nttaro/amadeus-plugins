"""Text normalization for Russian TTS engines that only read Cyrillic (Silero drops digits and Latin).

normalize("В 2025 году рост 15%, открой Python") ->
    "В две тысячи двадцать пять году рост пятнадцать процентов, открой пайтон"

Numbers are said in the nominative case (agreement with the next word is a separate, harder
problem); Latin words go through a small dictionary of common tech words, then letter-by-letter
transliteration; abbreviations in capitals are spelled out (VS -> вэ эс).
"""
import re

_UNITS = ['', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять']
_UNITS_F = ['', 'одна', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять']
_TEENS = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать',
          'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать']
_TENS = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто']
_HUNDREDS = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот']
# (one, few, many, feminine)
_SCALES = [('тысяча', 'тысячи', 'тысяч', True), ('миллион', 'миллиона', 'миллионов', False),
           ('миллиард', 'миллиарда', 'миллиардов', False), ('триллион', 'триллиона', 'триллионов', False)]


def _plural(n, one, few, many):
    if 11 <= n % 100 <= 14:
        return many
    return one if n % 10 == 1 else few if 2 <= n % 10 <= 4 else many


def _triple(n, feminine=False):
    words = [_HUNDREDS[n // 100]]
    rest = n % 100
    if 10 <= rest <= 19:
        words.append(_TEENS[rest - 10])
    else:
        words += [_TENS[rest // 10], (_UNITS_F if feminine else _UNITS)[rest % 10]]
    return [w for w in words if w]


def number_words(n: int) -> str:
    if n == 0:
        return 'ноль'
    if n < 0:
        return 'минус ' + number_words(-n)
    words, scale = [], -1
    while n:
        n, part = divmod(n, 1000)
        if part:
            if scale < 0:
                chunk = _triple(part)
            else:
                one, few, many, fem = _SCALES[scale]
                chunk = _triple(part, fem) + [_plural(part, one, few, many)]
            words = chunk + words
        scale += 1
        if scale >= len(_SCALES):
            break
    if words[:2] == ['одна', 'тысяча']:                           # "тысяча девятьсот", not "одна тысяча"
        words = words[1:]
    return ' '.join(words)


# ---- ordinals: "2026 года" -> "две тысячи двадцать шестого года", "3-м" -> "третьем"
_ORD_UNITS = ['', 'перв', 'втор', 'трет', 'четвёрт', 'пят', 'шест', 'седьм', 'восьм', 'девят']
_ORD_TEENS = ['десят', 'одиннадцат', 'двенадцат', 'тринадцат', 'четырнадцат', 'пятнадцат',
              'шестнадцат', 'семнадцат', 'восемнадцат', 'девятнадцат']
_ORD_TENS = ['', '', 'двадцат', 'тридцат', 'сороков', 'пятидесят', 'шестидесят', 'семидесят', 'восьмидесят', 'девяност']
_ORD_HUNDREDS = ['', 'сот', 'двухсот', 'трёхсот', 'четырёхсот', 'пятисот', 'шестисот', 'семисот', 'восьмисот', 'девятисот']
_ORD_THOUSANDS = ['тысячн', 'тысячн', 'двухтысячн', 'трёхтысячн', 'четырёхтысячн', 'пятитысячн']
_STRESSED = {'втор', 'шест', 'седьм', 'восьм', 'сороков'}            # -ой, not -ый
# case -> ending for a regular stem; "трет" takes the soft ending
_END = {'nom': 'ый', 'fem': 'ая', 'neut': 'ое', 'gen': 'ого', 'dat': 'ому', 'prep': 'ом', 'ins': 'ым', 'pl': 'ых', 'acc_f': 'ую'}
_END_SOFT = {'nom': 'ий', 'fem': 'ья', 'neut': 'ье', 'gen': 'ьего', 'dat': 'ьему', 'prep': 'ьем', 'ins': 'ьим', 'pl': 'ьих', 'acc_f': 'ью'}


def ordinal_words(n: int, case: str = 'nom') -> str:
    """Ordinal in the given case (nom / fem / neut / gen / dat / prep / ins / pl / acc_f)."""
    if n <= 0:
        return number_words(n)
    tail = n % 100
    if tail:
        head, stem = n - tail, (_ORD_TEENS[tail - 10] if 10 <= tail <= 19 else _ORD_UNITS[tail % 10] or _ORD_TENS[tail // 10])
        if tail > 19 and tail % 10:                                   # 26 -> двадцать шест-
            head, stem = n - tail % 10, _ORD_UNITS[tail % 10]
    elif n % 1000:
        head, stem = n - n % 1000, _ORD_HUNDREDS[(n % 1000) // 100]
    elif n % 1000000 == 0 or n // 1000 >= len(_ORD_THOUSANDS):
        return number_words(n)                                        # rare: millions as ordinals
    else:
        head, stem = 0, _ORD_THOUSANDS[n // 1000]
    if stem == 'трет':
        end = _END_SOFT[case]
    elif case == 'nom' and stem in _STRESSED:
        end = 'ой'
    else:
        end = _END[case]
    return ((number_words(head) + ' ') if head else '') + stem + end


_YEAR_CASE = {'год': 'nom', 'года': 'gen', 'году': 'prep', 'годом': 'ins', 'годах': 'pl', 'годов': 'pl'}
_SUFFIX_CASE = {'й': 'nom', 'ый': 'nom', 'ой': 'nom', 'ий': 'nom', 'я': 'fem', 'ая': 'fem', 'е': 'neut', 'ое': 'neut',
                'го': 'gen', 'ого': 'gen', 'его': 'gen', 'му': 'dat', 'ому': 'dat', 'м': 'prep', 'ом': 'prep',
                'ем': 'prep', 'ым': 'ins', 'х': 'pl', 'ых': 'pl', 'ю': 'acc_f', 'ую': 'acc_f'}


# "3-х", "5-ти", "7-ми" are cardinals in the genitive: трёх, пяти, семи
_CARD_GEN = {1: 'одного', 2: 'двух', 3: 'трёх', 4: 'четырёх', 5: 'пяти', 6: 'шести', 7: 'семи', 8: 'восьми',
             9: 'девяти', 10: 'десяти', 20: 'двадцати', 30: 'тридцати', 40: 'сорока', 50: 'пятидесяти', 100: 'ста'}


def _card_gen(m):
    n = int(m.group(1))
    if n in _CARD_GEN:
        return _CARD_GEN[n]
    if n < 100 and n % 10 and n // 10 * 10 in _CARD_GEN:
        return _CARD_GEN[n // 10 * 10] + ' ' + _CARD_GEN[n % 10]
    return number_words(n)


# a year with no "год" after a season / month / "конец", "начало": "осень 2026" -> "осень … шестого"
_DATE_WORDS = (r'(?:зим[аыуе]|весн[аыуе]|лет[оау]|осен[ьи]|январ[ьяе]|феврал[ьяе]|март[ае]?|апрел[ьяе]|ма[йяе]|'
               r'июн[ьяе]|июл[ьяе]|август[ае]?|сентябр[ьяе]|октябр[ьяе]|ноябр[ьяе]|декабр[ьяе]|'
               r'конц[ае]|конец|начал[оае]|середин[аыеу]|сезон[ае]?)')


def _year(m):
    return ordinal_words(int(m.group(1)), _YEAR_CASE[m.group(2).lower()]) + ' ' + m.group(2)


def _suffixed(m):
    return ordinal_words(int(m.group(1)), _SUFFIX_CASE[m.group(2).lower()])


def _integer(m):
    """A code (leading zeros) or a very long number is read digit by digit."""
    d = m.group(0)
    if len(d) > 15 or (len(d) > 1 and d[0] == '0'):
        return ' '.join(number_words(int(c)) for c in d)
    return number_words(int(d))


def _decimal(m):
    whole, frac = m.group(1), m.group(2)[:3]
    w = int(whole)
    return (f"{number_words(w)} {_plural(w, 'целая', 'целых', 'целых')} "
            f"{number_words(int(frac))} {['десятых', 'сотых', 'тысячных'][len(frac) - 1]}")


# common words that come up in answers, said the way people say them
_LATIN_WORDS = {
    'python': 'пайтон', 'code': 'код', 'vs': 'вэ эс', 'javascript': 'джаваскрипт', 'java': 'джава',
    'typescript': 'тайпскрипт', 'react': 'риэкт', 'node': 'ноуд', 'git': 'гит', 'github': 'гитхаб',
    'windows': 'виндоус', 'linux': 'линукс', 'google': 'гугл', 'chrome': 'хром', 'youtube': 'ютуб',
    'api': 'апи', 'json': 'джейсон', 'html': 'эйч ти эм эль', 'css': 'си эс эс', 'sql': 'эс кью эль',
    'ok': 'окей', 'okay': 'окей', 'wifi': 'вайфай', 'email': 'имейл', 'web': 'веб', 'app': 'эпп',
    'deepseek': 'дипсик', 'claude': 'клод', 'gpt': 'джи пи ти', 'ai': 'эй ай', 'ui': 'ю ай',
    'anime': 'аниме', 'live': 'лайв', 'discord': 'дискорд', 'telegram': 'телеграм', 'steam': 'стим',
    'docker': 'докер', 'server': 'сервер', 'file': 'файл', 'online': 'онлайн', 'offline': 'офлайн',
    'my': 'май', 'list': 'лист', 'new': 'нью', 'game': 'гейм', 'store': 'стор', 'chat': 'чат',
    'the': 'зе', 'and': 'энд', 'of': 'оф', 'to': 'ту', 'is': 'из', 'in': 'ин', 'on': 'он',
}
_LETTER_NAMES = {'a': 'эй', 'b': 'би', 'c': 'си', 'd': 'ди', 'e': 'и', 'f': 'эф', 'g': 'джи', 'h': 'эйч',
                 'i': 'ай', 'j': 'джей', 'k': 'кей', 'l': 'эль', 'm': 'эм', 'n': 'эн', 'o': 'оу', 'p': 'пи',
                 'q': 'кью', 'r': 'ар', 's': 'эс', 't': 'ти', 'u': 'ю', 'v': 'ви', 'w': 'дабл ю', 'x': 'экс',
                 'y': 'уай', 'z': 'зед'}
_DIGRAPHS = [('sch', 'ш'), ('tch', 'ч'), ('sh', 'ш'), ('ch', 'ч'), ('th', 'т'), ('ph', 'ф'), ('ck', 'к'),
             ('qu', 'кв'), ('oo', 'у'), ('ee', 'и'), ('ea', 'и'), ('ou', 'ау'), ('ai', 'эй'), ('ay', 'эй'),
             ('oa', 'оу'), ('ow', 'оу'), ('kh', 'х'), ('zh', 'ж'), ('ts', 'ц'), ('ya', 'я'), ('yu', 'ю'),
             ('yo', 'ё')]
_LETTERS = {'a': 'а', 'b': 'б', 'c': 'к', 'd': 'д', 'e': 'е', 'f': 'ф', 'g': 'г', 'h': 'х', 'i': 'и',
            'j': 'дж', 'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н', 'o': 'о', 'p': 'п', 'q': 'к', 'r': 'р',
            's': 'с', 't': 'т', 'u': 'у', 'v': 'в', 'w': 'в', 'x': 'кс', 'y': 'и', 'z': 'з'}


def _latin_word(m):
    word = m.group(0)
    low = word.lower()
    if low in _LATIN_WORDS:
        return _LATIN_WORDS[low]
    if word.isupper() and len(word) <= 5:                      # an abbreviation: spelled out
        return ' '.join(_LETTER_NAMES.get(c, '') for c in low)
    out, i = [], 0
    while i < len(low):
        for a, b in _DIGRAPHS:
            if low.startswith(a, i):
                out.append(b); i += len(a); break
        else:
            out.append(_LETTERS.get(low[i], '')); i += 1
    if low.endswith('e') and len(low) > 3:                     # silent final e (code, file, time)
        out[-1] = ''
    return ''.join(out)


_SYMBOLS = [
    (re.compile(r'(\d)\s*%'), r'\1 процентов'), (re.compile(r'%'), ' процентов'),
    (re.compile(r'\b(\d{1,2}):(\d{2})\b'), r'\1 \2'),
    (re.compile(r'(?<![\d.,–—-])(\d+(?:[.,]\d+)?)\s*[–—]\s*(\d+(?:[.,]\d+)?)(?![\d–—-])'), r'\1-\2'),
    (re.compile(r'№\s*'), 'номер '), (re.compile(r'\s&\s'), ' и '), (re.compile(r'\+'), ' плюс '),
    (re.compile(r'(\d)\s*°C?'), r'\1 градусов'), (re.compile(r'(\d)\s*₽'), r'\1 рублей'),
    (re.compile(r'\$\s*(\d[\d.,]*)'), r'\1 долларов'), (re.compile(r'(\d)\s*\$'), r'\1 долларов'),
    (re.compile(r'\s(→|->|=>)\s'), ', '), (re.compile(r'\s=\s'), ' равно '),
    (re.compile(r'\.\.\.|…'), '.'), (re.compile(r'\s[—–]\s'), ', '),
    (re.compile(r'[*_#`~|<>\[\]{}\\^]'), ' '),
]


def normalize(text: str) -> str:
    for pattern, repl in _SYMBOLS:
        text = pattern.sub(repl, text)
    text = re.sub(r'(?<![\d.,])\d{1,3}(?:[ \u00a0\u202f]\d{3})+(?!\d)', lambda m: re.sub(r'\D', '', m.group(0)), text)   # 1 000 000 -> 1000000
    text = re.sub(r'(?<![\w.,)])[-−](?=\d)', 'минус ', text)                                     # -5
    text = re.sub(r'(?<![\d.])\d+(?:\.\d+){2,}(?![\d.]*\d)', lambda m: m.group(0).replace('.', ' точка '), text)   # 5.6.1, 192.168.0.1
    text = re.sub(r'\b((?:1\d|20|21)\d\d)\s*(год|года|году|годом|годах|годов)\b', _year, text, flags=re.I)   # calendar years only: "3 года" is a count
    text = re.sub(r'(?i)\b(' + _DATE_WORDS + r')\s+((?:19|20)\d\d)\b(?!\s*г)', lambda m: m.group(1) + ' ' + ordinal_words(int(m.group(2)), 'gen'), text)
    text = re.sub(r'\b(\d{1,3})-(х|ти|ми|и)\b', _card_gen, text)
    text = re.sub(r'\b(\d{1,4})-(ый|ой|ий|ая|ое|ого|его|ому|ом|ем|ым|ых|ую|й|я|е|го|му|м|ю)\b', _suffixed, text)
    text = re.sub(r'(?<![\d.,])(\d{1,15})[.,](\d{1,3})(?!\d)(?![.,]\d)', _decimal, text)
    text = re.sub(r'\d+', _integer, text)
    text = re.sub(r'\b(один|два)\s+(тысяч\w*)', lambda m: ('одна' if m.group(1) == 'один' else 'две') + ' ' + m.group(2), text)
    text = re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', text)                # MyAnimeList -> My Anime List
    text = re.sub(r"[A-Za-z][A-Za-z']*", _latin_word, text)
    return re.sub(r'\s+', ' ', text).strip()


if __name__ == '__main__':
    import sys
    print(normalize(' '.join(sys.argv[1:])))
