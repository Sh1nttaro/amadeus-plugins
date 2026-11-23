import test from 'node:test';
import assert from 'node:assert/strict';
import { ClaudeMapper, CodexMapper, ChunkWriter, buildPrompt, toolLabel, toolDetail } from '../lib/events.js';

const run = (writer, events, outcome = { kind: 'stop' }) => {
  const chunks = [];
  for (const ev of events) chunks.push(...writer.event(ev));
  chunks.push(...writer.finish(outcome));
  return chunks;
};

test('tool labels and details', () => {
  assert.equal(toolLabel('mcp__playwright__click'), 'playwright:click');
  assert.equal(toolLabel('Edit'), 'Edit');
  assert.equal(toolDetail('Read', { file_path: 'C:\\proj\\src\\app.js' }), 'src/app.js');
  assert.equal(toolDetail('Bash', { command: 'npm   test\n  --silent' }), 'npm test --silent');
  assert.equal(toolDetail('TodoWrite', { todos: [1, 2, 3] }), '3 шагов');
});

test('Claude: partial deltas stream the answer once, tools become steps', () => {
  const m = new ClaudeMapper();
  const events = [
    ...m.feed({ type: 'system', subtype: 'init', session_id: 's1' }),
    ...m.feed({ type: 'stream_event', session_id: 's1', parent_tool_use_id: null, event: { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Смотрю ' } } }),
    ...m.feed({ type: 'stream_event', session_id: 's1', parent_tool_use_id: null, event: { type: 'content_block_delta', delta: { type: 'text_delta', text: 'файл.' } } }),
    ...m.feed({ type: 'assistant', session_id: 's1', parent_tool_use_id: null, message: { content: [{ type: 'text', text: 'Смотрю файл.' }, { type: 'tool_use', name: 'Read', input: { file_path: '/a/b/c.js' } }] } }),
    ...m.feed({ type: 'stream_event', session_id: 's1', parent_tool_use_id: 'x', event: { type: 'content_block_delta', delta: { type: 'text_delta', text: 'ЧУЖОЕ' } } }),
    ...m.feed({ type: 'result', session_id: 's1', subtype: 'success', is_error: false, usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 3 }, total_cost_usd: 0.01 }),
  ];
  assert.deepEqual(events.filter((e) => e.t === 'session'), [{ t: 'session', id: 's1' }]);
  assert.equal(events.filter((e) => e.t === 'text').map((e) => e.text).join(''), 'Смотрю файл.', 'the whole text is not repeated after the deltas');
  assert.ok(!JSON.stringify(events).includes('ЧУЖОЕ'));
  assert.deepEqual(events.find((e) => e.t === 'tool'), { t: 'tool', name: 'Read', detail: 'b/c.js' });
  assert.equal(events.at(-1).t, 'done');
  assert.equal(events.find((e) => e.t === 'usage').cacheReadTokens, 3);
});

test('Claude: without partial messages the whole text is taken; an error result is an error', () => {
  const m = new ClaudeMapper();
  const a = m.feed({ type: 'assistant', parent_tool_use_id: null, message: { content: [{ type: 'text', text: 'Готово' }] } });
  assert.deepEqual(a, [{ t: 'text', text: 'Готово' }]);
  const r = m.feed({ type: 'result', subtype: 'error_max_turns', is_error: true, usage: {}, result: 'лимит ходов' });
  assert.equal(r.at(-1).t, 'error');
  assert.match(r.at(-1).message, /лимит/);
});

test('Codex: messages, steps, usage, done', () => {
  const m = new CodexMapper();
  const events = [
    { type: 'thread.started', thread_id: 't-1' },
    { type: 'item.completed', item: { type: 'command_execution', command: 'dir', status: 'completed', exit_code: 0 } },
    { type: 'item.completed', item: { type: 'file_change', changes: [{ path: 'C:\\p\\x.js' }] } },
    { type: 'item.completed', item: { type: 'agent_message', text: 'Сделано.' } },
    { type: 'turn.completed', usage: { input_tokens: 100, cached_input_tokens: 40, output_tokens: 7 } },
  ].flatMap((e) => m.feed(e));
  assert.equal(events[0].id, 't-1');
  assert.deepEqual(events.filter((e) => e.t === 'tool').map((e) => e.name), ['shell', 'edit']);
  assert.equal(events.find((e) => e.t === 'text').text, 'Сделано.');
  assert.equal(events.find((e) => e.t === 'usage').cacheReadTokens, 40);
  assert.equal(events.at(-1).t, 'done');
});

test('Codex: a failed turn reports the error; a transient error line alone is not fatal', () => {
  const m = new CodexMapper();
  assert.deepEqual(m.feed({ type: 'error', message: 'Reconnecting 1/5' }), []);
  const r = m.feed({ type: 'turn.failed', error: { message: 'сеть недоступна' } });
  assert.deepEqual(r, [{ t: 'error', message: 'сеть недоступна' }]);
});

test('chunks: text, then a tool step, then text again are three blocks with matching ends', () => {
  const chunks = run(new ChunkWriter(), [
    { t: 'text', text: 'Смотрю.' },
    { t: 'tool', name: 'Read', detail: 'a.js' },
    { t: 'text', text: 'Нашёл.' },
    { t: 'usage', inputTokens: 5, outputTokens: 2, cacheReadTokens: 1 },
  ]);
  const types = chunks.map((c) => c.type + (c.blockType ? ':' + c.blockType : ''));
  assert.deepEqual(types, ['block-start:text', 'text-delta', 'block-end', 'block-start:reasoning', 'reasoning-delta', 'block-end', 'block-start:text', 'text-delta', 'block-end', 'usage', 'finish']);
  assert.deepEqual(chunks.filter((c) => c.type === 'block-end').map((c) => c.index), [0, 1, 2]);
  assert.equal(chunks[5].block.text, '▸ Read · a.js\n');
  assert.equal(chunks.find((c) => c.type === 'usage').usage.totalTokens, 7);
  assert.deepEqual(chunks.at(-1), { type: 'finish', reason: { kind: 'stop' } });
});

test('chunks: an empty run still answers, an error and an abort end with their reason', () => {
  const empty = run(new ChunkWriter(), []);
  assert.match(empty.find((c) => c.type === 'text-delta').text, /без текстового ответа/);
  const err = run(new ChunkWriter(), [{ t: 'text', text: 'часть' }], { kind: 'error', message: 'упал' });
  assert.equal(err.at(-1).reason.kind, 'error');
  assert.equal(err.at(-1).reason.failure.message, 'упал');
  assert.ok(err.some((c) => c.type === 'block-end'), 'the open block is closed before the error');
  const stopped = run(new ChunkWriter(), [], { kind: 'aborted', message: 'остановлено' });
  assert.equal(stopped.at(-1).reason.failure.code, 'ABORTED');
  assert.ok(!stopped.some((c) => c.type === 'text-delta'), 'an abort adds no filler text');
});

test('prompt: resuming sends only the newest user message', () => {
  const msgs = [{ role: 'user', content: [{ type: 'text', text: 'привет' }] }, { role: 'assistant', content: [{ type: 'text', text: 'здравствуй' }] }, { role: 'user', content: [{ type: 'text', text: 'почини баг' }] }];
  assert.equal(buildPrompt(msgs, { resuming: true }), 'почини баг');
});

test('prompt: first call in an old chat carries the history', () => {
  const msgs = [{ role: 'user', content: [{ type: 'text', text: 'привет' }] }, { role: 'assistant', content: [{ type: 'text', text: 'здравствуй' }] }, { role: 'user', content: 'почини баг' }];
  const p = buildPrompt(msgs, { resuming: false });
  assert.match(p, /Пользователь: привет/);
  assert.match(p, /Ассистент: здравствуй/);
  assert.match(p, /Новое сообщение пользователя:\nпочини баг$/);
  assert.equal(buildPrompt([{ role: 'user', content: 'один' }], { resuming: false }), 'один');
});

test('prompt: DSH context messages are not taken for the request', () => {
  const ctxMsg = (kind, text) => ({ role: 'user', source: { kind }, content: [{ type: 'text', text }] });
  const msgs = [
    ctxMsg('runtime-context', 'дата, ОС'), ctxMsg('working-directory', 'C:/work'),
    { role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: 'почини баг' }] },
    ctxMsg('plan-mode', 'режим плана'),
  ];
  assert.equal(buildPrompt(msgs, { resuming: false }), 'почини баг');
  const skill = [...msgs.slice(0, 3), { role: 'assistant', content: [{ type: 'text', text: 'ок' }] }, { role: 'user', source: { kind: 'skill-invocation', name: 'review' }, content: [{ type: 'text', text: 'Сделай ревью' }] }];
  const p = buildPrompt(skill, { resuming: false });
  assert.ok(p.endsWith('Новое сообщение пользователя:\nСделай ревью'), 'the request comes last');
  assert.ok(!p.includes('дата, ОС'), 'context stays out of the history');
});
