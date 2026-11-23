// What is read aloud: cleans an answer (markdown, JSON, tables, code stay silent), cuts it into sentences
// while it is still being written, and keeps the answers of different chats apart. No Electron here, so it
// can be tested on its own (test/live2d.test.mjs). The same rules as amadeus-live3d/companion/renderer/pet.js.
'use strict';

/** True when the answer carries something meant for the eyes (a genui widget, a table, JSON, code). */
const VISUAL_RE = /```|^\s*\|.*\|\s*$/m;
/**
 * Text without what is only for the screen: genui widgets (```schemaJson …```) and JSON are silent,
 * other code is "фрагмент кода", markdown tables are dropped. A block still being streamed (its
 * closing ``` not there yet) is cut too — before, its JSON was read aloud while the answer streamed.
 */
function unblock(text) {
  return String(text || '')
    .replace(/```([\w-]*)[^\n]*\n?[\s\S]*?```/g, (m, lang) => (/^(schemajson|json|jsonc|genui|ui|yaml|xml|html|svg|csv|mermaid)$/i.test(lang || '') ? ' ' : ' (фрагмент кода) '))
    .replace(/```[\s\S]*$/, ' ')
    .replace(/^\s*\|.*$/gm, ' ')                                                      // table rows (and a row still streaming)
    .replace(/^\s*("[^"\n]{1,60}"\s*:.*|[{}[\]],?)\s*$/gm, ' ');                      // bare JSON lines outside a block
}
// Abbreviations said in full. Done here, before the text is cut into sentences: otherwise the dot
// of "см." or "т.е." ends a sentence in the middle of a phrase.
const NOT_LETTER = '(?<![А-Яа-яЁёA-Za-z])';
const ABBREVIATIONS = [
  [/и\s?т\.\s?д\.(?=\s+[А-ЯЁA-Z])/g, 'и так далее.'], [/и\s?т\.\s?п\.(?=\s+[А-ЯЁA-Z])/g, 'и тому подобное.'], [/и\s?др\.(?=\s+[А-ЯЁA-Z])/g, 'и другие.'],   // it also ends the sentence
  [/и\s?т\.\s?д\./gi, 'и так далее'], [/и\s?т\.\s?п\./gi, 'и тому подобное'], [/т\.\s?е\./gi, 'то есть'],
  [/т\.\s?к\./gi, 'так как'], [/т\.\s?н\./gi, 'так называемый'], [/и\s?др\./gi, 'и другие'],
  [/напр\./gi, 'например'], [/см\.\s*(?=ссылк)/gi, 'смотри '], [/см\./gi, 'смотри'], [/стр\./gi, 'страница'],
  [/(\d)\s*тыс\./gi, '$1 тысяч'], [/(\d)\s*млн\.?/gi, '$1 миллионов'], [/(\d)\s*млрд\.?/gi, '$1 миллиардов'],
  [/(\d)\s*руб\./gi, '$1 рублей'], [/(\d)\s*мин\./gi, '$1 минут'], [/(\d)\s*сек\./gi, '$1 секунд'],
  [/(\d{4})\s*гг?\.(?=\s+[А-ЯЁA-Z])/g, '$1 года.'], [/(\d{4})\s*гг?\.(?=\s|$)/g, '$1 года'],
].map(([re, to]) => [new RegExp(NOT_LETTER + re.source, re.flags), to]);
/**
 * One line of an answer → one phrase: headings, list items and lines without punctuation get their
 * own full stop, list markers and item numbers are not read ("1. Prism" was "один. призм").
 */
function speakableLine(line) {
  let l = line.trim();
  if (!l) return '';
  l = l.replace(/^#{1,6}\s+/, '')                                            // heading
    .replace(/^>\s*/, '')                                                    // quote
    .replace(/^(?:[-*+•–—]|\d{1,3}[.)]|[a-zа-я]\))\s+/i, '')                  // list marker / item number
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, 'ссылка')
    .replace(/[*_#>|~]+/g, ' ')
    .replace(/\p{Extended_Pictographic}/gu, ' ')
    .replace(/\s+/g, ' ')
    .replace(/ (?=[,.!?;:…])/g, '')                                          // "**word** ," after the marks are gone
    .trim();
  for (const [re, to] of ABBREVIATIONS) l = l.replace(re, to);
  l = l.replace(/(?<![А-Яа-яЁё])(смотри|открой|по|на|в)\s+ссылка/gi, (m, w) => w + (/^(по|на|в)$/i.test(w) ? ' ссылке' : ' ссылку'));
  if (!/[\p{L}\p{N}]/u.test(l)) return '';
  return /[.!?…:;,]["»)]?$/.test(l) ? l : l + '.';
}
function speakable(text) {
  const lines = unblock(text).split(/\n/);
  return lines.map(speakableLine).filter(Boolean).join(' ').trim();
}
/** Sentences of at most ~220 characters (short ones merged). */
function speechParts(text) {
  const out = [];
  for (const piece of text.split(/(?<=[.!?…])\s+/)) {
    let rest = piece.trim();
    while (rest.length > 240) { const comma = rest.lastIndexOf(', ', 220), cut = comma > 100 ? comma : Math.max(rest.lastIndexOf(' ', 220), 120); out.push(rest.slice(0, cut + 1).trim()); rest = rest.slice(cut + 1).trim(); }
    if (!rest) continue;
    if (out.length && out[out.length - 1].length + rest.length < 90) out[out.length - 1] += ' ' + rest; else out.push(rest);
  }
  return out;
}
/** Stage directions ("*smiles*") are not read; *emphasis* stays as a word. */
const STAGE_RE = /(?<!\*)\*([^*\n]{2,40})\*(?!\*)/g;
const STAGE = /^(?:улыба|хихик|смеё|смее|кива|маш|подмиг|краснеет|смущ|вздыха|обнима|smil|nod|wav|wink|blush|sigh|laugh|hug)/i;
function captionText(text) {
  return speakable(unblock(text).replace(STAGE_RE, (m, w) => (STAGE.test(w.trim()) ? ' ' : w)));
}
const ABBREV_END = /(?:^|[^а-яёa-z])(?:гг|см|др|напр|стр|тыс|млн|млрд|руб|мин|сек|им|ул|ср|рис|[a-zа-яё])\.\s+$/i;
/** End of the last complete sentence in an unfinished line (0 = none): not inside `code`, (), [], ** or after "т." */
function sentenceCut(line) {
  const re = /[.!?…]+["»”)]*\s+/g;
  let cut = 0, m;
  while ((m = re.exec(line))) {
    const head = line.slice(0, m.index + m[0].length), body = head.replace(/^\s*(?:[-*+•–—]|\d{1,3}[.)])\s+/, '');
    const count = (c) => body.split(c).length - 1;
    if (!body.trim() || count('`') % 2 || count('*') % 2 || count('(') > count(')') || count('[') > count(']') || ABBREV_END.test(body)) continue;
    cut = head.length;
  }
  return cut;
}
/** How far the raw text can be taken now: whole lines (not inside a ``` block) and whole sentences of the last one. */
function safeCut(raw, from) {
  let cut = from, pos = from, fence = false;
  for (;;) {
    const nl = raw.indexOf('\n', pos);
    const line = raw.slice(pos, nl < 0 ? raw.length : nl);
    const marks = line.split('```').length - 1;
    if (nl < 0) {
      if (!fence && !marks && !/^\s*[|{}[\]"]/.test(line)) {
        const c = sentenceCut(line);
        if (c) cut = pos + c;
        else if (from === 0 && cut === 0 && line.length > 200) {              // a very long first sentence: up to a comma
          const k = line.lastIndexOf(', ', 180);
          if (k > 60 && sentenceCut(line.slice(0, k) + '. ') === k + 2) cut = pos + k + 2;
        }
      }
      return cut;
    }
    if (marks % 2) fence = !fence;
    pos = nl + 1;
    if (!fence) cut = pos;
  }
}
/**
 * The queue of sentences. Every chat (session) has its own stream, so two agents writing at once do not
 * mix: one has the floor and is read aloud, the next one follows when it is done. A stream remembers how
 * much of the agent's RAW text was already taken. `epoch` changes whenever what is being said must stop.
 */
class Speech {
  constructor({ onStop = () => {}, onKick = () => {}, now = () => Date.now() } = {}) {
    this.streams = new Map();                    // session -> { id, raw, done, said, final, muted, queue, at }
    this.floor = null;                           // the stream being read aloud
    this.lines = [];                             // short lines, said before the rest
    this.epoch = 0;
    this.onStop = onStop; this.onKick = onKick; this.now = now;
  }
  stream(id) {
    let st = this.streams.get(id);
    if (!st) {
      if (this.streams.size > 24) for (const [k, x] of this.streams) if (x !== this.floor && !x.queue.length) { this.streams.delete(k); break; }
      st = { id, raw: '', done: 0, said: false, final: false, muted: false, queue: [], at: 0 };
      this.streams.set(id, st);
    }
    return st;
  }
  stop() { this.epoch++; this.onStop(this.epoch); }
  kick() { if (this.has()) this.onKick(this.epoch); }
  /** The answer so far (all of it). silent: taken note of, but not read aloud. */
  feed(id, text, final, silent = false) {
    const st = this.stream(id);
    if (st.raw && !text.startsWith(st.raw)) {
      if (!final && st.raw.startsWith(text)) return;                     // an update that arrived late
      st.raw = ''; st.done = 0; st.said = false; st.final = false;       // the next step of the turn: a new text
    } else if (st.final && text === st.raw) return;                      // the same answer once more
    st.raw = text; st.at = this.now(); st.final = !!final;
    if (st.muted || silent) { st.done = text.length; return; }
    const cut = final ? text.length : safeCut(text, st.done);
    if (cut > st.done) {
      const parts = speechParts(captionText(text.slice(st.done, cut)));
      st.done = cut;
      if (parts.length) { st.queue.push(...parts); st.said = true; }
    }
    // only a table / widget and no words: a short line instead of silence
    if (final && !st.said && VISUAL_RE.test(text)) { st.queue.push('Готово, смотри на экране.'); st.said = true; }
    this.kick();
  }
  /** Thinking / a tool: a finished text is over, the next one starts from its beginning. */
  step(id) { const st = this.streams.get(id); if (st && st.final) { st.raw = ''; st.done = 0; st.said = false; st.final = false; } }
  /** The user asked something new in this chat: its previous answer is not read any further. */
  turn(id) {
    const st = this.stream(id), was = this.floor === st;
    Object.assign(st, { raw: '', done: 0, said: false, final: false, muted: false, queue: [] });
    if (was) { this.floor = null; this.stop(); this.kick(); }
  }
  /** The turn is over; an answer that never got its end was cancelled. */
  end(id) {
    const st = this.streams.get(id);
    if (!st) return;
    if (st.raw && !st.final) st.queue = [];
    Object.assign(st, { final: true, muted: false, raw: '', done: 0, said: false });
    this.kick();
  }
  /** Silence everything: what is queued is dropped and unfinished answers stay silent to their end. */
  hush() {
    for (const st of this.streams.values()) { st.queue = []; if (!st.final) st.muted = true; }
    this.lines = []; this.floor = null;
    this.stop();
  }
  /** A short line (live2d_speak). */
  line(text) { this.lines.push(...speechParts(captionText(String(text).slice(0, 3000)))); this.kick(); }
  /** The next sentence to say, or null. */
  next() {
    if (this.lines.length) return this.lines.shift();
    if (this.floor && !this.floor.queue.length && (this.floor.final || this.now() - this.floor.at > 20000)) this.floor = null;
    if (!this.floor) for (const st of this.streams.values()) if (st.queue.length) { this.floor = st; break; }
    return this.floor && this.floor.queue.length ? this.floor.queue.shift() : null;
  }
  has() { return this.lines.length > 0 || [...this.streams.values()].some((st) => st.queue.length > 0); }
}

module.exports = { Speech, speakable, speechParts, captionText, safeCut };
