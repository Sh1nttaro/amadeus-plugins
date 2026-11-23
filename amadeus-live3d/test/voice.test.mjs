// node --test amadeus-live3d/test/
// The renderer and the companion are not modules: the functions under test are cut out of their source.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const pet = src('companion/renderer/pet.js'), main = src('companion/main.js'), lib = src('lib/index.js');
const between = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); assert.ok(i >= 0 && j > i, 'not found: ' + a); return s.slice(i, j); };

/** The speech part of the renderer with a fake player: say() drains what she would say, in order. */
function renderer() {
  const code = 'const STAGE = [];' + between(pet, 'const STAGE_RE', 'function playStage')
    + between(pet, 'const VISUAL_RE', '/** Speak a text right now') + between(pet, '/** A short line', 'function synthOne(')
    + `return { feedStream, newTurn, endStream, stepStream, hushAll, speakLine, nextPhrase, speakable, speechParts, safeCut, floorId: () => floor && floor.id,
        drain(n = 99) { const o = []; for (let t; n-- > 0 && (t = nextPhrase()); ) o.push(t); return o; } };`;
  const state = { stops: 0 };
  const api = new Function('voice', 'aud', 'api', 'stopVoice', 'voicePump', 'setInterval', 'performance', code)(
    { lines: [], pump: 0 }, { gen: 0 }, { synthesize: true }, () => { state.stops++; }, () => {}, () => {}, { now: () => state.now || 1000 });
  return { ...api, state };
}
/** Feed a text the way it is streamed, n characters at a time. */
const stream = (r, id, text, n = 1, final = true) => { for (let i = n; i < text.length; i += n) r.feedStream(id, text.slice(0, i), false); r.feedStream(id, text, final); };

test('two sessions at once: nothing is repeated or mixed', () => {
  const r = renderer(), A = 'Первый агент пишет ответ. Вторая фраза первого. Третья фраза.', B = 'Другой агент тоже отвечает. Ещё одно предложение.';
  for (let n = 5; n < 70; n += 5) { r.feedStream('a', A.slice(0, n), n >= A.length); r.feedStream('b', B.slice(0, n), n >= B.length); }
  const said = r.drain();
  assert.equal(said.join(' '), A + ' ' + B);
});
test('any way of streaming gives the same speech', () => {
  const text = '## Итоги\nВот что нашла:\n1. **Prism Rondo** — 8.44 балла\n2. Второй пункт\n\nЗапусти `a.py. b` сейчас. Потом [открой. файл](http://x.y/z) и т. д. Это было в 2024 г. Он ушёл (см. раздел). Конец!';
  const whole = (n) => { const r = renderer(); stream(r, 's', text, n); return r.drain().join(' '); };
  const expect = whole(10000);
  for (const n of [1, 2, 3, 7, 20]) assert.equal(whole(n), expect, 'chunk ' + n);
  assert.match(expect, /a\.py\. b сейчас/);
  assert.match(expect, /и так далее\. Это было в 2024 года\. Он ушёл/);
  assert.doesNotMatch(expect, /(^|\s)1\.|\*\*|##/);
});
test('speech starts before the answer is complete', () => {
  const r = renderer();
  r.feedStream('s', 'Готово, я посмотрела. Теперь', false);
  assert.deepEqual(r.drain(), ['Готово, я посмотрела.']);
});
test('tables, JSON and code blocks stay silent, also while they stream', () => {
  const r = renderer();
  stream(r, 's', 'Вот топ:\n\n```schemaJson\n{"a": "Секрет. Да.", "b": [1]}\n```\n\n| № | Имя. Да |\n|---|---|\n| 1 | Нет. Вот |\n\nХочешь ещё?', 1);
  assert.equal(r.drain().join(' '), 'Вот топ: Хочешь ещё?');
  const t = renderer(); stream(t, 's', '```json\n{"a":1}\n```', 1);
  assert.deepEqual(t.drain(), ['Готово, смотри на экране.']);
});
test('a short line does not lose the rest of the answer', () => {
  const r = renderer();
  stream(r, 's', 'Первое длинное предложение этого ответа, достаточно длинное, чтобы идти отдельно от других. Второе предложение тоже сделано длинным, чтобы его не склеили с первым.');
  const first = r.nextPhrase();
  r.speakLine('Ура!');
  const rest = r.drain();
  assert.equal(rest[0], 'Ура!');
  assert.match(first + rest.slice(1).join(' '), /Первое.*Второе/);
  assert.equal(r.state.stops, 0);
});
test('a new question stops the old answer, other chats keep theirs', () => {
  const r = renderer();
  stream(r, 'a', 'Старый ответ первый. Старый ответ второй.'); stream(r, 'b', 'Другой чат.');
  r.nextPhrase(); r.newTurn('a');
  assert.equal(r.state.stops, 1);
  assert.deepEqual(r.drain(), ['Другой чат.']);
  stream(r, 'a', 'Новый ответ.'); assert.deepEqual(r.drain(), ['Новый ответ.']);
});
test('steps of one turn are all read, a repeated final is not', () => {
  const r = renderer();
  stream(r, 's', 'Сейчас посмотрю.'); r.feedStream('s', 'Сейчас посмотрю.', true); r.stepStream('s'); stream(r, 's', 'Сейчас посмотрю. Нашла ошибку.'); r.endStream('s');
  assert.equal(r.drain().join(' '), 'Сейчас посмотрю. Сейчас посмотрю. Нашла ошибку.');
});
test('a cancelled answer is not read to the end, a finished one is', () => {
  const r = renderer();
  r.feedStream('s', 'Первая фраза готова. Вторая фраза ещё', false); r.endStream('s'); assert.deepEqual(r.drain(), []);
  stream(r, 's', 'Полный ответ.'); r.endStream('s'); assert.deepEqual(r.drain(), ['Полный ответ.']);
});
test('after "стоп" the answer stays silent, the next turn speaks', () => {
  const r = renderer();
  r.feedStream('s', 'Первая фраза готова. Вторая', false); r.hushAll();
  r.feedStream('s', 'Первая фраза готова. Вторая фраза. Третья фраза.', true); assert.deepEqual(r.drain(), []);
  r.newTurn('s'); stream(r, 's', 'Новый ответ.'); assert.deepEqual(r.drain(), ['Новый ответ.']);
});
test('a stream that went quiet gives the floor up', () => {
  const r = renderer(); r.state.now = 1000;
  r.feedStream('a', 'Первая фраза. Вторая', false); r.drain(1); r.feedStream('b', 'Второй чат. Да', false);
  assert.deepEqual(r.drain(), []); r.state.now = 40000; assert.deepEqual(r.drain(), ['Второй чат.']);
});

function companion(wake = 'алиса') {
  const code = between(main, 'function wakeNames()', 'const PRIVATE_WINDOW') + between(main, 'const pendingChat = []', '// ---------------------------------------------------------------- hands-free')
    + 'return { addressed, isStop, pushChat, nextChat, pendingChat };';
  const clock = { t: 1000 };
  return { clock, ...new Function('settings', 'Date', code)({ listen: { wake } }, { now: () => clock.t }) };
}
test('only "<name> стоп" stops', () => {
  const c = companion();
  for (const s of ['Алиса, стоп.', 'Алиса стоп!', 'алиса… Стоп', 'Алиса, stop.']) assert.equal(c.isStop(s), true, s);
  for (const s of ['Стоп.', 'Тихо.', 'Отмена', 'Хватит уже', 'Алиса, хватит', 'Алиса, замолчи', 'Алиса, стоп пожалуйста', 'Алиса, стоп-кран', 'Стоп, Алиса', 'Скажи Алиса стоп', 'Алиса', '']) assert.equal(c.isStop(s), false, s);
  assert.equal(companion('моя капитан').isStop('Моя капитан, стоп'), true);
  assert.equal(companion('капитан').isStop('Алиса, стоп'), false);
});
test('the name is taken out of the phrase', () => {
  assert.equal(companion().addressed('Алиса, открой файл.'), 'открой файл.');
  assert.equal(companion('моя капитан').addressed('Моя капитан, привет'), 'привет');
  assert.equal(companion().addressed('просто разговор'), null);
});
test('stale messages are not delivered', () => {
  const c = companion(); c.pushChat({ stop: true }); c.pushChat({ text: 'привет', send: true }); c.clock.t += 6000;
  assert.equal(c.nextChat().text, 'привет'); c.pushChat({ text: 'x' }); c.clock.t += 200000; assert.equal(c.nextChat(), null);
});
test('"." and ".." are not model ids', () => {
  const re = new Function(between(main, 'const MODEL_ID', ';') + '; return MODEL_ID;')();
  for (const x of ['.', '..', '...', '', 'a/b']) assert.equal(re.test(x), false, x);
  for (const x of ['captain', 'a.b', 'vrm-1_2']) assert.equal(re.test(x), true, x);
});
test('no server is built in for recognition', () => {
  assert.doesNotMatch(main, /duckdns|litellm\.[a-z]+\./i);
});
test('what "стоп" cancels', () => {
  const t = (running, own, voiced) => new Function('readChat', between(lib, 'const runningSessions', 'function trackAgentSpeech') + 'return (r, v) => { for (const [k, at] of r) runningSessions.set(k, at); return stopTargets(v); };')(() => ({ sessions: own }))(running, voiced);
  const now = Date.now();
  assert.deepEqual(t([['work', now], ['her', now - 5]], { m: 'her' }, 'work'), ['work']);
  assert.deepEqual(t([['work', now]], {}, 'finished'), []);
  assert.deepEqual(t([['work', now], ['her', now - 5]], { m: 'her' }, ''), ['her']);
  assert.deepEqual(t([['old', now - 900], ['work', now]], {}, ''), ['work']);
});
