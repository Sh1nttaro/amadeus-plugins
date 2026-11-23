// What Claude Code and Codex report while they work, as one small vocabulary, and how that becomes
// the stream chunks DSH's agent loop reads from a model call.
//
// Neutral events:
//   { t: 'session', id }                      the harness's own session id (kept to resume the chat)
//   { t: 'text', text }                       answer text (delta or whole message)
//   { t: 'reasoning', text }                  thinking
//   { t: 'tool', name, detail?, failed? }     one tool step the harness took on its own
//   { t: 'usage', inputTokens, outputTokens, cacheReadTokens?, cacheWriteTokens?, costUsd? }
//   { t: 'done' } | { t: 'error', message }

const short = (s, n = 110) => {
  const one = String(s ?? '').replace(/\s+/g, ' ').trim();
  return one.length > n ? one.slice(0, n - 1) + '…' : one;
};
const baseName = (p) => String(p || '').split(/[\\/]/).filter(Boolean).slice(-2).join('/');

/** `mcp__server__tool` -> `server:tool`; built-in tool names stay as they are. */
export function toolLabel(name) {
  const n = String(name || 'tool');
  if (n.startsWith('mcp__')) {
    const [, server = '', ...rest] = n.split('__');
    return `${server}:${rest.join('__')}`;
  }
  return n;
}

/** The one fact worth showing about a tool call. */
export function toolDetail(name, input) {
  const i = input && typeof input === 'object' ? input : {};
  switch (name) {
    case 'Read': case 'Write': case 'Edit': case 'MultiEdit': case 'NotebookEdit': return baseName(i.file_path || i.notebook_path);
    case 'Bash': return short(i.command);
    case 'Grep': return short(i.pattern);
    case 'Glob': return short(i.pattern);
    case 'WebFetch': return short(i.url);
    case 'WebSearch': return short(i.query);
    case 'Task': case 'Agent': return short(i.description || i.prompt);
    case 'TodoWrite': return Array.isArray(i.todos) ? `${i.todos.length} шагов` : '';
    default: return short(i.description || i.path || i.file_path || i.command || i.query || '');
  }
}

// ---------------------------------------------------------------- Claude Code (Agent SDK messages)
export class ClaudeMapper {
  constructor() { this.session = ''; this.sawDelta = false; }

  feed(m) {
    const out = [];
    if (!m || typeof m !== 'object') return out;
    if (m.session_id && m.session_id !== this.session) { this.session = m.session_id; out.push({ t: 'session', id: m.session_id }); }
    if (m.type === 'stream_event') {
      if (m.parent_tool_use_id) return out;                                   // a subagent's stream stays out of the answer
      const e = m.event || {};
      if (e.type === 'content_block_delta') {
        const d = e.delta || {};
        if (d.type === 'text_delta' && d.text) { this.sawDelta = true; out.push({ t: 'text', text: d.text }); }
        else if (d.type === 'thinking_delta' && d.thinking) out.push({ t: 'reasoning', text: d.thinking });
      }
    } else if (m.type === 'assistant') {
      if (m.parent_tool_use_id) return out;
      for (const b of (m.message && m.message.content) || []) {
        if (b.type === 'tool_use') out.push({ t: 'tool', name: toolLabel(b.name), detail: toolDetail(b.name, b.input) });
        else if (b.type === 'text' && b.text && !this.sawDelta) out.push({ t: 'text', text: b.text });   // no partial stream: take the whole text
      }
      this.sawDelta = false;
    } else if (m.type === 'result') {
      const u = m.usage || {};
      out.push({
        t: 'usage', inputTokens: u.input_tokens || 0, outputTokens: u.output_tokens || 0,
        cacheReadTokens: u.cache_read_input_tokens || 0, cacheWriteTokens: u.cache_creation_input_tokens || 0,
        costUsd: typeof m.total_cost_usd === 'number' ? m.total_cost_usd : undefined,
      });
      if (m.is_error || (m.subtype && m.subtype !== 'success')) out.push({ t: 'error', message: short(m.result || m.subtype || 'ошибка', 600) });
      else out.push({ t: 'done' });
    }
    return out;
  }
}

// ---------------------------------------------------------------- Codex (`codex exec --json` lines)
export class CodexMapper {
  constructor() { this.session = ''; this.finished = false; this.lastError = ''; }

  feed(ev) {
    const out = [];
    if (!ev || typeof ev !== 'object') return out;
    switch (ev.type) {
      case 'thread.started':
        if (ev.thread_id && ev.thread_id !== this.session) { this.session = ev.thread_id; out.push({ t: 'session', id: ev.thread_id }); }
        break;
      case 'item.completed': {
        const it = ev.item || {};
        if (it.type === 'agent_message' && it.text) out.push({ t: 'text', text: it.text });
        else if (it.type === 'reasoning' && it.text) out.push({ t: 'reasoning', text: it.text });
        else if (it.type === 'command_execution') out.push({ t: 'tool', name: 'shell', detail: short(it.command), failed: it.status === 'failed' || (typeof it.exit_code === 'number' && it.exit_code !== 0) });
        else if (it.type === 'file_change') out.push({ t: 'tool', name: 'edit', detail: short((it.changes || []).map((c) => baseName(c.path)).join(', ')) });
        else if (it.type === 'mcp_tool_call') out.push({ t: 'tool', name: `${it.server || 'mcp'}:${it.tool || 'tool'}`, failed: it.status === 'failed' });
        else if (it.type === 'web_search') out.push({ t: 'tool', name: 'search', detail: short(it.query) });
        else if (it.type === 'error' && it.message) this.lastError = short(it.message, 400);
        break;
      }
      case 'turn.completed': {
        this.finished = true;
        const u = ev.usage || {};
        out.push({ t: 'usage', inputTokens: u.input_tokens || 0, outputTokens: u.output_tokens || 0, cacheReadTokens: u.cached_input_tokens || 0 });
        out.push({ t: 'done' });
        break;
      }
      case 'turn.failed':
        this.finished = true;
        out.push({ t: 'error', message: short((ev.error && ev.error.message) || this.lastError || 'Codex остановился с ошибкой', 600) });
        break;
      case 'error':
        this.lastError = short(ev.message, 400);                                // may be a transient reconnect notice
        break;
      default: break;
    }
    return out;
  }
}

// ---------------------------------------------------------------- DSH stream chunks
/**
 * Turns neutral events into `StreamChunk`s: text and thinking are blocks (a change of kind closes one
 * and opens the next); the harness's own tool steps are shown as lines of the thinking block.
 */
export class ChunkWriter {
  constructor() { this.index = -1; this.open = null; this.hadText = false; this.usage = null; this.session = ''; }

  *#close() {
    if (!this.open) return;
    yield { type: 'block-end', index: this.index, block: { type: this.open.type, text: this.open.text } };
    this.open = null;
  }
  *#ensure(type) {
    if (this.open && this.open.type === type) return;
    yield* this.#close();
    this.index += 1;
    this.open = { type, text: '' };
    yield { type: 'block-start', index: this.index, blockType: type };
  }

  /** @returns {Generator<object>} the chunks one event produces */
  *event(ev) {
    if (ev.t === 'session') { this.session = ev.id; return; }
    if (ev.t === 'usage') {
      this.usage = ev;
      return;
    }
    if (ev.t === 'text' && ev.text) {
      yield* this.#ensure('text');
      this.open.text += ev.text; this.hadText = true;
      yield { type: 'text-delta', index: this.index, text: ev.text };
    } else if (ev.t === 'reasoning' && ev.text) {
      yield* this.#ensure('reasoning');
      this.open.text += ev.text;
      yield { type: 'reasoning-delta', index: this.index, text: ev.text };
    } else if (ev.t === 'tool') {
      yield* this.#ensure('reasoning');
      const line = `${ev.failed ? '✗' : '▸'} ${ev.name}${ev.detail ? ' · ' + ev.detail : ''}\n`;
      this.open.text += line;
      yield { type: 'reasoning-delta', index: this.index, text: line };
    }
  }

  /** The tail of a call: open block, usage, and how it ended. */
  *finish(outcome) {
    if (outcome.kind === 'stop' && !this.hadText) {
      yield* this.event({ t: 'text', text: '(Харнес закончил работу без текстового ответа.)' });
    }
    yield* this.#close();
    if (this.usage) {
      const u = this.usage;
      yield { type: 'usage', usage: { inputTokens: u.inputTokens, outputTokens: u.outputTokens, totalTokens: u.inputTokens + u.outputTokens, cacheReadTokens: u.cacheReadTokens, cacheWriteTokens: u.cacheWriteTokens } };
    }
    if (outcome.kind === 'stop') yield { type: 'finish', reason: { kind: 'stop' } };
    else yield { type: 'finish', reason: { kind: outcome.kind, failure: { message: outcome.message || 'Ошибка харнеса', code: outcome.kind === 'aborted' ? 'ABORTED' : 'HARNESS_ERROR' } } };
  }
}

// ---------------------------------------------------------------- the prompt from DSH's messages
// Messages DSH adds around the user's request (environment, folder, tool list, mode notices): the harness has its own.
const CONTEXT_KINDS = new Set(['system-prompt', 'model-selection', 'tool-registry', 'action-cards', 'runtime-context', 'working-directory', 'user-approval', 'ptc-mode', 'plan-mode', 'compact-checkpoint', 'cordis-host-runner']);
const isRequest = (m) => m && m.role === 'user' && !(m.source && CONTEXT_KINDS.has(m.source.kind));

const textOf = (content) => {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.filter((b) => b && b.type === 'text' && typeof b.text === 'string').map((b) => b.text).join('\n');
};

/**
 * The message to send to a harness. With a session to resume only the newest user message goes; for
 * the first call in a chat that already has history, the earlier turns come as a short transcript.
 */
export function buildPrompt(messages, { resuming }) {
  const list = Array.isArray(messages) ? messages : [];
  let last = -1;
  for (let i = list.length - 1; i >= 0; i--) if (isRequest(list[i])) { last = i; break; }
  const current = last >= 0 ? textOf(list[last].content).trim() : '';
  if (resuming || last <= 0) return current;
  const lines = [];
  let budget = 20000;
  for (let i = last - 1; i >= 0 && budget > 0; i--) {
    const m = list[i];
    if (!m || (m.role !== 'assistant' && !isRequest(m))) continue;
    const text = textOf(m.content).trim();
    if (!text) continue;
    const clipped = text.length > 3000 ? text.slice(0, 3000) + '…' : text;
    lines.unshift(`${m.role === 'user' ? 'Пользователь' : 'Ассистент'}: ${clipped}`);
    budget -= clipped.length;
  }
  if (!lines.length) return current;
  return `Предыстория этого диалога (с другим исполнителем):\n${lines.join('\n\n')}\n\nНовое сообщение пользователя:\n${current}`;
}
