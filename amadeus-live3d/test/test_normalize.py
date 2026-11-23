"""python -m unittest discover amadeus-live3d/test"""
import os
import sys
import unittest

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'companion'))
from ru_normalize import normalize  # noqa: E402

CASES = {
    'Опыт 3 года, через 2 года.': 'Опыт три года, через два года.',
    'Топ 2026 года': 'Топ две тысячи двадцать шестого года',
    'в 2024 году': 'в две тысячи двадцать четвёртом году',
    'осень 2026': 'осень две тысячи двадцать шестого',
    'Займёт 10–15 минут': 'Займёт десять-пятнадцать минут',
    'Займёт 3–5 минут': 'Займёт три-пять минут',
    'рост 15%': 'рост пятнадцать процентов',
    '8.44 балла': 'восемь целых сорок четыре сотых балла',
    'версия 5.6.1': 'версия пять точка шесть точка один',
    '1 000 000 зрителей': 'один миллион зрителей',
    'В 2024 100 человек': 'В две тысячи двадцать четыре сто человек',
    'минус -5': 'минус минус пять',
    'код 007': 'код ноль ноль семь',
    'в 12:30': 'в двенадцать тридцать',
    '3-х серий': 'трёх серий',
    '1-е место': 'первое место',
    'открой Python': 'открой пайтон',
}


class Normalize(unittest.TestCase):
    def test_cases(self):
        for text, want in CASES.items():
            with self.subTest(text):
                self.assertEqual(normalize(text), want)

    def test_no_digits_or_latin_left(self):
        for text in ('v2.10.3-beta', '12345678901234567890', '50-60%', '$5.99', '0.5', '1,5–2,5 ГБ', '24/7', '#1', '007–009'):
            self.assertNotRegex(normalize(text), r'[0-9A-Za-z]', text)


if __name__ == '__main__':
    unittest.main()
