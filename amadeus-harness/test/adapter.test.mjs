import test from 'node:test';
import assert from 'node:assert/strict';
import { createHarnessStream, permissionFor } from '../lib/adapter.js';

const msg = (text) => ({ role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text }] });

function make({ conn = { baseURL: 'https://gw/v1', apiKeyEnv: 'LITELLM_API_KEY' }, events = [], throws = null, keys = { LITELLM_API_KEY: 'sk-1' } } = {}) {
  const calls = [];
  const sessions = new Map();
  const stream = createHarnessStream({
    connection: (p) => (p === 'litellm' ? conn : undefined),
    resolveKey: async (ref) => keys[ref] || '',
    sessions: { get: (k) => sessions.get(k) || undefined, set: (k, v) => sessions.set(k, v) },
    cwdFor: (sid) => `C:/work/${sid}`, homeFor: (h) => `C:/home/${h}`,
    runners: { 'claude-code': async function* (o) { calls.push(o); if (throws) throw new Error(throws); yield* events; } },
  });
  return { stream, calls, sessions };
}
const collect = async (iter) => { const out = []; for await (const c of iter) out.push(c); return out; };
const base = { provider: 'litellm', model: 'deepseek-v4-pro', sessionId: 'session-A' };

test('permission presets map to harness modes', () => {
  assert.equal(permissionFor('read-only'), 'read');
  assert.equal(permissionFor('workspace-write'), 'edits');
  assert.equal(permissionFor('danger-full-access'), 'full');
  assert.equal(permissionFor('something-new'), 'edits');
});

test('the harness runs on the chat\'s own model, connection, folder and permission', async () => {
  const { stream, calls } = make({ events: [{ t: 'session', id: 'native-1' }, { t: 'text', text: 'Привет!' }, { t: 'usage', inputTokens: 3, outputTokens: 2 }, { t: 'done' }] });
  const chunks = await collect(stream({ ...base, messages: [msg('привет')] }, { harness: 'claude-code', permission: 'read' }));
  assert.equal(chunks.find((c) => c.type === 'text-delta').text, 'Привет!');
  assert.deepEqual(chunks.at(-1), { type: 'finish', reason: { kind: 'stop' } });
  assert.equal(calls[0].model, 'deepseek-v4-pro');
  assert.equal(calls[0].baseURL, 'https://gw/v1');
  assert.equal(calls[0].apiKey, 'sk-1');
  assert.equal(calls[0].cwd, 'C:/work/session-A');
  assert.equal(calls[0].permission, 'read');
});

test('the harness session is kept per chat and resumed on the next turn', async () => {
  const { stream, calls, sessions } = make({ events: [{ t: 'session', id: 'native-1' }, { t: 'text', text: 'ок' }, { t: 'done' }] });
  await collect(stream({ ...base, messages: [msg('привет')] }, { harness: 'claude-code' }));
  assert.equal(sessions.get('session-A|claude-code'), 'native-1');
  await collect(stream({ ...base, messages: [msg('привет'), { role: 'assistant', content: [{ type: 'text', text: 'ок' }] }, msg('дальше')] }, { harness: 'claude-code' }));
  assert.equal(calls[1].resume, 'native-1');
  assert.equal(calls[1].prompt, 'дальше', 'only the new message goes when resuming');
  await collect(stream({ ...base, sessionId: 'session-B', messages: [msg('другой чат')] }, { harness: 'claude-code' }));
  assert.equal(calls[2].resume, undefined, 'another chat does not resume that session');
});

test('a provider without an address, a missing key and an empty prompt say why and run nothing', async () => {
  const a = make();
  const c1 = await collect(a.stream({ ...base, provider: 'deepseek-official', messages: [msg('x')] }, { harness: 'claude-code' }));
  assert.match(c1.at(-1).reason.failure.message, /нет адреса|адреса нет/);
  const b = make({ keys: {} });
  const c2 = await collect(b.stream({ ...base, messages: [msg('x')] }, { harness: 'claude-code' }));
  assert.match(c2.at(-1).reason.failure.message, /LITELLM_API_KEY/);
  const c3 = await collect(a.stream({ ...base, messages: [] }, { harness: 'claude-code' }));
  assert.match(c3.at(-1).reason.failure.message, /Пустое сообщение/);
  const c4 = await collect(a.stream({ ...base, messages: [msg('x')] }, { harness: 'nope' }));
  assert.match(c4.at(-1).reason.failure.message, /не поддерживается/);
  assert.equal(a.calls.length + b.calls.length, 0);
});

test('errors become a finish with a failure', async () => {
  const { stream } = make({ throws: 'Claude Code остановился: нет сети' });
  const c = await collect(stream({ ...base, messages: [msg('x')] }, { harness: 'claude-code' }));
  assert.equal(c.at(-1).reason.kind, 'error');
  assert.match(c.at(-1).reason.failure.message, /нет сети/);
});

test('a stop requested by the user ends as aborted, not as an error', async () => {
  const ac = new AbortController();
  const { stream } = make({ events: [{ t: 'text', text: 'часть' }] });
  const out = [];
  for await (const c of stream({ ...base, signal: ac.signal, messages: [msg('x')] }, { harness: 'claude-code' })) { out.push(c); if (c.type === 'text-delta') ac.abort(); }
  assert.equal(out.at(-1).reason.kind, 'aborted');
});

test('a failure on a resumed session forgets it so the next turn starts afresh', async () => {
  const { stream, sessions } = make({ throws: 'No conversation found with session ID' });
  sessions.set('session-A|claude-code', 'stale');
  const c = await collect(stream({ ...base, messages: [msg('a'), { role: 'assistant', content: 'b' }, msg('c')] }, { harness: 'claude-code' }));
  assert.equal(c.at(-1).reason.kind, 'error');
  assert.equal(sessions.get('session-A|claude-code') || '', '');
});

test('the chat\'s reasoning level reaches the harness that understands it', async () => {
  const { stream, calls } = make({ events: [{ t: 'text', text: 'ок' }, { t: 'done' }] });
  await collect(stream({ ...base, reasoningEffort: 'high', messages: [msg('x')] }, { harness: 'claude-code' }));
  assert.equal(calls[0].reasoningEffort, 'high');
});
