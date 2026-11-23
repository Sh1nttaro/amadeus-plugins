// node --test amadeus-live2d/test/
// speech-text.js is a module; the rest is cut out of the source (Electron and the bundled renderer are not).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = (f) => fs.readFileSync(path.join(root, f), 'utf8').replace(/\r\n/g, '\n');
const main = src('companion/main.js'), lib = src('lib/index.js'), client = src('lib/client.js'), page = src('companion/renderer/assets/index-Cjt11Ao8.js');
const between = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); assert.ok(i >= 0 && j > i, 'not found: ' + a); return s.slice(i, j); };
const { Speech, captionText } = createRequire(import.meta.url)('../companion/speech-text.js');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const drain = (s) => { const o = []; for (let t; (t = s.next());) o.push(t); return o; };
const stream = (s, id, text, n, final = true) => { for (let i = n; i < text.length; i += n) s.feed(id, text.slice(0, i), false); s.feed(id, text, final); };

// ---------------------------------------------------------------- what is read
test('markdown, JSON, tables and code stay silent, however the text is streamed', () => {
  const text = '## Итоги\nВот **топ**:\n\n```json\n{"a": "Секрет. Да."}\n```\n\n| № | Имя. Да |\n|---|---|\n| 1 | Нет. Вот |\n\n1. Первый пункт\n2. [Второй](https://x.y/z)\n\n*улыбается* Всё *очень* просто и т.д. Он ушёл. Конец';
  const whole = (n) => { const s = new Speech(); stream(s, 'a', text, n); return drain(s).join(' '); };
  const expect = whole(10000);
  for (const n of [1, 2, 5, 17]) assert.equal(whole(n), expect, 'chunk ' + n);
  assert.doesNotMatch(expect, /Секрет|Имя|Нет|\*|#|`|https|улыбается|\d\./);
  assert.match(expect, /Второй/);
  assert.match(expect, /очень просто и так далее\./);
});
test('speech starts before the answer is complete, and nothing is cut off at 3000 characters', () => {
  const s = new Speech();
  s.feed('a', 'Готово, я посмотрела. Теперь', false);
  assert.deepEqual(drain(s), ['Готово, я посмотрела.']);
  const long = 'Это ещё одно предложение ответа, в котором есть слова. '.repeat(120).trim();
  const l = new Speech(); l.feed('a', long, true);
  assert.equal(drain(l).join(' '), long);
});
test('two chats do not mix; a new question stops its own answer only', () => {
  const stops = [], s = new Speech({ onStop: (e) => stops.push(e) });
  const A = 'Первый агент пишет ответ, и он довольно длинный, чтобы идти отдельной фразой. Вторая фраза первого агента тоже длинная.', B = 'Другой агент тоже отвечает.';
  for (let n = 5; n < 140; n += 5) { s.feed('a', A.slice(0, n), n >= A.length); s.feed('b', B.slice(0, n), n >= B.length); }
  assert.match(s.next(), /^Первый/);
  s.turn('b');
  assert.equal(stops.length, 0);
  s.turn('a');
  assert.deepEqual(stops, [1]);
  assert.deepEqual(drain(s), []);
});
test('a cancelled answer is not read on; a silenced one stays silent', () => {
  const s = new Speech();
  s.feed('a', 'Одно предложение. Другое пред', false); s.end('a');
  assert.deepEqual(drain(s), []);
  s.turn('a'); s.feed('a', 'Начало ответа. Дальше', false); s.hush(); s.feed('a', 'Начало ответа. Дальше больше. Ещё.', true);
  assert.deepEqual(drain(s), []);
  s.turn('a'); s.feed('a', 'Новый ответ.', true);
  assert.deepEqual(drain(s), ['Новый ответ.']);
});
test('an answer written while the voice was off is not read from its beginning later', () => {
  const s = new Speech();
  s.feed('a', 'Первая фраза. Вторая', false, true);
  s.feed('a', 'Первая фраза. Вторая фраза. Третья.', true);
  assert.doesNotMatch(drain(s).join(' '), /Первая/);
});
test('an answer of only a table gets a short line', () => {
  const s = new Speech(); s.feed('a', '| a | b |\n|---|---|\n| 1 | 2 |', true);
  assert.deepEqual(drain(s), ['Готово, смотри на экране.']);
  assert.equal(captionText('```js\nx\n```').includes('x'), false);
});

// ---------------------------------------------------------------- the player
function player(speech, { synth = 20, play = 60 } = {}) {
  const played = [];
  class Ctx {
    constructor() { this.destination = {}; this.state = 'running'; }
    async decodeAudioData(a) { return { text: a, duration: 1, sampleRate: 1000, getChannelData: () => new Float32Array(100).fill(0.2) }; }
    createGain() { return { gain: {}, connect() {} }; }
    createBufferSource() { const s = { connect() {}, start() { played.push(s.buffer.text); s.t = setTimeout(() => s.onended(), play); }, stop() { clearTimeout(s.t); s.onended(); } }; return s; }
    resume() { return Promise.resolve(); } suspend() { return Promise.resolve(); }
  }
  const shape = between(page, 'const SPEECH_RMS', 'async function withSink'), body = between(page, '  /** There is more to say.', "  // --- The core's audio requests");
  const V = new Function('AudioContext', 'withSink', 'window', 'console', `${shape}; return class { constructor(api, onState) { this.api = api; this.onState = onState; this.epoch = 0; this.pumping = -1; this.fill = null; this.player = null; this.playerIdle = 0; this.source = null; this.lostAt = -Infinity; } devicesSetting() { return {}; }\n${body} }`)(Ctx, async () => {}, { setTimeout: (f, t) => setTimeout(f, t).unref() }, { error() {} });
  const notes = [];
  const v = new V({
    nextSpeech: async (epoch) => {
      if (epoch !== speech.epoch) return null;
      const text = speech.next();
      if (!text) return null;
      await sleep(synth);
      return /сбой/.test(text) ? { ok: false, text, error: 'x' } : { ok: true, text, audio: text };
    },
    hushSpeech: () => speech.hush(),
  }, (st, note) => notes.push(note));
  speech.onKick = (e) => setTimeout(() => v.kick(e), 1); speech.onStop = (e) => setTimeout(() => v.silence(e), 1);
  return { v, played, notes };
}
const LONG = (w) => `${w} предложение этого ответа, которое достаточно длинное, чтобы прозвучать отдельной фразой от соседних.`;
test('an answer that interrupts another one is spoken', async () => {
  const s = new Speech(), { played } = player(s, { play: 400 });
  s.feed('a', 'Первый ответ.', true); await sleep(150);
  s.turn('a'); s.feed('a', 'Второй ответ.', true); await sleep(700);
  assert.deepEqual(played, ['Первый ответ.', 'Второй ответ.']);
});
test('sentences follow in order, also the ones written while another is spoken', async () => {
  const s = new Speech(), { played } = player(s);
  s.feed('a', LONG('Первое') + ' Д', false); await sleep(60);
  s.feed('a', LONG('Первое') + ' ' + LONG('Другое') + ' Т', false); await sleep(400);
  s.feed('a', LONG('Первое') + ' ' + LONG('Другое') + ' ' + LONG('Третье'), true); await sleep(800);
  assert.deepEqual(played, [LONG('Первое'), LONG('Другое'), LONG('Третье')]);
});
test('a sentence that fails is skipped with a note, the rest is said', async () => {
  const s = new Speech(), { played, notes } = player(s);
  s.feed('a', LONG('Первое сбой') + ' ' + LONG('Второе'), true); await sleep(500);
  assert.deepEqual(played, [LONG('Второе')]);
  assert.equal(notes.length, 1);
});
test('the microphone silences her at once and the next answer is spoken', async () => {
  const s = new Speech(), { v, played } = player(s, { play: 2000 });
  s.feed('a', LONG('Первое') + ' ' + LONG('Второе'), true); await sleep(100);
  v.stopSpeaking(); await sleep(50);
  s.turn('a'); s.feed('a', 'Новый ответ.', true); await sleep(150);
  assert.deepEqual(played, [LONG('Первое'), 'Новый ответ.']);
  v.stopSpeaking();
});

// ---------------------------------------------------------------- local security
test('the companion answers only to the plugin that started it', () => {
  const env = { AMADEUS_TOKEN: 'secret' };
  const allowed = new Function('process', 'randomBytes', 'timingSafeEqual', between(main, 'const TOKEN =', 'const server =') + '; return allowed;')({ env }, null, (a, b) => Buffer.compare(a, b) === 0);
  assert.equal(allowed({ headers: { 'x-amadeus-token': 'secret' } }), true);
  assert.equal(allowed({ headers: {} }), false);
  assert.equal(allowed({ headers: { 'x-amadeus-token': 'secreT' } }), false);
  assert.equal(allowed({ headers: { 'x-amadeus-token': 'secret', origin: 'https://evil.example' } }), false);
  assert.equal(env.AMADEUS_TOKEN, undefined);
});
test('"." and ".." are not model ids', () => {
  const re = new Function(between(main, 'const MODEL_ID', ';') + '; return MODEL_ID;')();
  for (const id of ['.', '..', '...', 'a/b', '']) assert.equal(re.test(id), false, id);
  for (const id of ['1', 'model-5f16134f56', 'a.b']) assert.equal(re.test(id), true, id);
});
test('other sites and plain-text POSTs do not reach the settings routes', async () => {
  const code = between(lib, '    const webServer = {', "    webServer.register({\n      kind: 'exact',\n      path: '/amadeus-live2d/list'");
  const routes = [];
  const web = new Function('host', 'sendJson', code + '; return webServer;')({ register: (r) => routes.push(r) }, (res, c) => { res.code = c; });
  web.register({ path: '/x', handler: async (q, r) => { r.code = 200; } });
  web.register({ path: '/up', raw: true, handler: async (q, r) => { r.code = 200; } });
  web.register({ path: '/bad', handler: async () => { throw new Error('boom'); } });
  const go = async (i, method, headers) => { const res = {}; await routes[i].handler({ method, headers, resume() {} }, res); return res.code; };
  assert.equal(await go(0, 'POST', { 'content-type': 'application/json' }), 200);
  assert.equal(await go(0, 'POST', { 'content-type': 'text/plain' }), 403);
  assert.equal(await go(0, 'GET', { 'sec-fetch-site': 'cross-site' }), 403);
  assert.equal(await go(1, 'POST', { 'content-type': 'application/zip' }), 200);
  assert.equal(await go(1, 'POST', { 'content-type': 'application/zip', 'sec-fetch-site': 'cross-site' }), 403);
  assert.equal(await go(2, 'GET', {}), 200);
  assert.doesNotMatch(lib, /access-control-allow-origin/);
});
test('no recognition server is built in, and the voice servers do not get the key', () => {
  assert.doesNotMatch(main, /litellm\.|duckdns/);
  const env = new Function('process', 'RUNTIME', between(main, 'const childEnv', '\n') + '; return childEnv();')({ env: { LITELLM_API_KEY: 'k', AMADEUS_TOKEN: 't', X: '1' } }, 'R');
  assert.deepEqual(env, { X: '1', AMADEUS_RUNTIME: 'R' });
  assert.equal((main.match(/= spawn\(/g) || []).length, (main.match(/env: childEnv\(\)/g) || []).length);
});

// ---------------------------------------------------------------- one feed of the agent's answers
test('the page does not feed the companion; the host does, in order, per chat', async () => {
  assert.doesNotMatch(client, /amadeus-live2d\/speak|wireSpeech/);
  const handlers = {}, got = [];
  const http = async (p, m) => { await sleep(m.final ? 1 : 15); got.push(m); };
  new Function('companion', 'port', 'http', 'logSpeak', between(lib, 'function trackAgentSpeech', 'const looseOutput') + '; return trackAgentSpeech;')({}, 1, http, () => {})({ on: (n, f) => { handlers[n] = f; } });
  const ag = (id) => ({ session: { id } }), chunk = (id, c) => handlers['agent/assistant-stream']({ agent: ag(id), frame: { type: 'chunk', chunk: c } });
  for (const id of ['a', 'b']) handlers['agent/assistant-stream']({ agent: ag(id), frame: { type: 'start' } });
  chunk('a', { type: 'text-delta', text: 'Ответ А.' }); chunk('b', { type: 'text-delta', text: 'Ответ Б.' });
  for (const id of ['a', 'b']) { chunk(id, { type: 'finish' }); handlers['agent/status']({ agent: ag(id), status: 'idle' }); }
  await sleep(150);
  for (const [id, t] of [['a', 'Ответ А.'], ['b', 'Ответ Б.']]) {
    const m = got.filter((x) => x.session === id);
    assert.equal(m[0].turn, true);
    assert.equal(m.at(-1).phase, 'end');
    assert.ok(m.some((x) => x.phase === 'answer' && x.final && x.text === t));
  }
});
test('an answer only goes to the chosen engine', () => {
  const body = between(main, 'async function synthesize(', '/** Everything that is on screen');
  const run = async (engine, fail) => {
    const calls = [];
    const f = new Function('voiceReplies', 'edgeSynthesize', 'kokoroSynthesize', 'process', 'let voiceError = null;' + body + '; return synthesize;')(
      { engine }, async () => { calls.push('edge'); if (fail) throw new Error('down'); return 'E'; }, async () => { calls.push('kokoro'); if (fail) throw new Error('down'); return 'K'; }, { stderr: { write() {} } });
    return { r: await f('Текст.'), calls };
  };
  return (async () => {
    assert.deepEqual(await run('edge', true), { r: { ok: false, text: 'Текст.', error: 'down' }, calls: ['edge'] });
    assert.deepEqual((await run('kokoro', true)).calls, ['kokoro', 'kokoro']);
    assert.equal((await run('edge', false)).r.audio, 'E');
  })();
});

// ---------------------------------------------------------------- rendering
test('software rendering only when asked for, or after two failures on the GPU', () => {
  const want = new Function(between(main, 'const GPU_RETRY_MS', ';') + ';' + between(main, 'function wantSoftware', 'let gpu =') + '; return wantSoftware;')();
  const now = 1e12, day = 24 * 3600 * 1000;
  assert.equal(want(undefined, { fails: 0, at: 0 }, now), false);
  assert.equal(want(undefined, { fails: 1, at: now }, now), false);
  assert.equal(want(undefined, { fails: 2, at: now - day }, now), true);
  assert.equal(want(undefined, { fails: 5, at: now - 8 * day }, now), false);
  assert.equal(want('1', { fails: 0, at: 0 }, now), true);
  assert.equal(want('0', { fails: 9, at: now }, now), false);
});

// ---------------------------------------------------------------- the menu
test('every call of the preload has a handler in the main process', () => {
  const preload = src('companion/preload/index.js');
  for (const [, ch] of preload.matchAll(/ipcRenderer\.(?:send|invoke)\("([^"]+)"/g)) {
    if (ch === 'audio:answer') continue;                          // answers link:audio, which nothing sends here
    assert.ok(main.includes(`ipcMain.handle('${ch}'`) || main.includes(`ipcMain.on('${ch}'`), ch);
  }
  for (const [, name] of src('companion/renderer/menu.html').matchAll(/\bapi\.(\w+)/g)) assert.match(preload, new RegExp('^  ' + name + ':', 'm'));
});
