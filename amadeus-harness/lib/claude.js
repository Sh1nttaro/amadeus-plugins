// Claude Code through the official Claude Agent SDK. Its home (CLAUDE_CONFIG_DIR) is a folder of this plugin,
// so the user's own Claude settings and logins are not touched. The model is the user's connection over the
// Anthropic Messages API (Anthropic itself, or a gateway such as LiteLLM that also serves /v1/messages).
import { pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';
import { ClaudeMapper } from './events.js';
import { claudeRuntime, gitBashPath } from './runtime.js';

const MODES = {
  // Reads and plans, never writes.
  read: { permissionMode: 'plan' },
  // Edits files without asking; shell commands are refused (nobody is there to approve them).
  edits: { permissionMode: 'acceptEdits', deny: new Set(['Bash', 'BashOutput', 'KillShell', 'PowerShell']) },
  // Everything allowed.
  full: { permissionMode: 'bypassPermissions', skip: true },
};

/** The Anthropic API root: the SDK adds /v1/messages itself. */
export function anthropicBase(baseURL) { return String(baseURL || '').trim().replace(/\/+$/, '').replace(/\/v1$/i, ''); }

/** DSH's reasoning level of the chat -> Claude Code's options: `off` switches thinking off, the rest is its `effort` (nothing when the chat does not say). */
export function claudeEffort(level) {
  const l = String(level || '').toLowerCase();
  if (!l) return {};
  if (/^(off|none)$/.test(l)) return { thinking: { type: 'disabled' } };
  if (l === 'minimal') return { effort: 'low' };
  if (['low', 'medium', 'high', 'xhigh', 'max'].includes(l)) return { effort: l };
  return {};
}

export function claudeOptions({ cwd, model, baseURL, apiKey, permission, resume, noTools, home, rt, abort, stderr, reasoningEffort }) {
  const mode = MODES[permission] || MODES.edits;
  const env = { ...process.env };
  for (const k of ['CLAUDECODE', 'CLAUDE_CODE_ENTRYPOINT', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_API_KEY', 'ELECTRON_RUN_AS_NODE']) delete env[k];
  Object.assign(env, {
    CLAUDE_CONFIG_DIR: home, ANTHROPIC_BASE_URL: anthropicBase(baseURL), ANTHROPIC_API_KEY: apiKey,
    DISABLE_TELEMETRY: '1', DISABLE_ERROR_REPORTING: '1', CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1', CLAUDE_CODE_DISABLE_AUTO_MEMORY: '1',
  });
  const bash = gitBashPath();
  if (bash) env.CLAUDE_CODE_GIT_BASH_PATH = bash;
  const options = {
    pathToClaudeCodeExecutable: rt.exe, cwd, model, env,
    permissionMode: mode.permissionMode, includePartialMessages: true, settingSources: [], abortController: abort,
  };
  if (mode.skip) options.allowDangerouslySkipPermissions = true;
  if (mode.deny) options.canUseTool = async (name, input) => (mode.deny.has(name)
    ? { behavior: 'deny', message: 'Команды оболочки отключены в режиме «Правки». Включите «Полный доступ» в настройках харнесов.' }
    : { behavior: 'allow', updatedInput: input });
  Object.assign(options, claudeEffort(reasoningEffort));
  if (resume) options.resume = resume;
  if (noTools) { options.tools = []; options.maxTurns = 1; }
  if (stderr) options.stderr = stderr;
  return options;
}

/**
 * Run one prompt to completion and yield neutral events (see events.js).
 * @param {{ prompt: string, cwd: string, model: string, baseURL: string, apiKey: string, permission?: string,
 *           resume?: string, noTools?: boolean, signal?: AbortSignal, home: string }} o
 */
export async function* runClaude(o) {
  const rt = claudeRuntime();
  if (!rt.ok) throw new Error(rt.reason);
  mkdirSync(o.home, { recursive: true });
  const { query } = await import(pathToFileURL(rt.sdk).href);
  const abort = new AbortController();
  if (o.signal) { if (o.signal.aborted) abort.abort(); else o.signal.addEventListener('abort', () => abort.abort(), { once: true }); }
  const tail = [];
  const stream = query({ prompt: o.prompt, options: claudeOptions({ ...o, rt, abort, stderr: (line) => { tail.push(String(line)); if (tail.length > 8) tail.shift(); } }) });
  const mapper = new ClaudeMapper();
  let ended = false;
  try {
    for await (const message of stream) {
      for (const ev of mapper.feed(message)) { if (ev.t === 'done' || ev.t === 'error') ended = true; yield ev; }
    }
  } catch (e) {
    if (abort.signal.aborted) return;
    const detail = tail.length ? ` (${tail.slice(-3).join(' | ').slice(0, 400)})` : '';
    throw new Error(`Claude Code остановился: ${e && e.message ? e.message : e}${detail}`);
  } finally {
    try { stream.close && stream.close(); } catch { /* already closed */ }
  }
  if (!ended && !abort.signal.aborted) throw new Error('Claude закрыл поток до получения результата.');
}
