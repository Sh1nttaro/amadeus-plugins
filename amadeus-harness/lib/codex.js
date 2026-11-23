// OpenAI Codex through `codex exec --json`. Its home (CODEX_HOME) is a folder of this plugin, apart from the
// user's own ~/.codex. The model is the user's connection, declared to Codex as a provider of the run; the key
// reaches Codex only as an environment variable it is told to read.
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { CodexMapper } from './events.js';
import { codexRuntime } from './runtime.js';

const SANDBOX = { read: 'read-only', edits: 'workspace-write', full: 'danger-full-access' };
const toml = (v) => JSON.stringify(String(v));            // a TOML basic string is a JSON string for our values

/** The OpenAI-style API root Codex appends /responses to. */
export function openaiBase(baseURL) {
  const b = String(baseURL || '').trim().replace(/\/+$/, '');
  return /\/v1$/i.test(b) ? b : b + '/v1';
}

/** DSH's reasoning level of the chat -> Codex's `model_reasoning_effort` (nothing when the chat does not say). */
export function codexEffort(level) {
  const l = String(level || '').toLowerCase();
  if (!l) return null;
  if (/^(off|none|minimal)$/.test(l)) return 'minimal';
  if (l === 'low') return 'low';
  if (l === 'medium') return 'medium';
  return 'high';                                           // high, max, xhigh, …
}

export function codexArgs({ model, baseURL, permission, resume, noTools, effort }) {
  const sandbox = noTools ? SANDBOX.read : (SANDBOX[permission] || SANDBOX.edits);
  const args = ['exec'];
  if (resume) args.push('resume');
  args.push('--json', '--skip-git-repo-check', '--ignore-user-config', '-m', model);
  const set = (k, v) => args.push('-c', `${k}=${v}`);
  set('model_provider', toml('amadeus'));
  set('model_providers.amadeus.name', toml('Amadeus'));
  set('model_providers.amadeus.base_url', toml(openaiBase(baseURL)));
  set('model_providers.amadeus.env_key', toml('AMADEUS_MODEL_KEY'));
  set('model_providers.amadeus.wire_api', toml('responses'));
  set('sandbox_mode', toml(sandbox));
  set('approval_policy', toml('never'));
  if (effort) set('model_reasoning_effort', toml(effort));
  if (resume) args.push(resume);
  args.push('-');                                          // the prompt comes on stdin
  return args;
}

function killTree(child) {
  if (!child || child.exitCode !== null) return;
  try {
    if (process.platform === 'win32') spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
    else child.kill('SIGTERM');
  } catch { /* gone already */ }
}

/**
 * Run one prompt to completion and yield neutral events (see events.js).
 * @param {{ prompt: string, cwd: string, model: string, baseURL: string, apiKey: string, permission?: string,
 *           resume?: string, noTools?: boolean, signal?: AbortSignal, home: string }} o
 */
export async function* runCodex(o) {
  const rt = codexRuntime();
  if (!rt.ok) throw new Error(rt.reason);
  mkdirSync(o.home, { recursive: true });
  const env = { ...process.env, CODEX_HOME: o.home, AMADEUS_MODEL_KEY: o.apiKey };
  delete env.OPENAI_API_KEY; delete env.ELECTRON_RUN_AS_NODE;
  if (rt.pathDir) env.PATH = rt.pathDir + path.delimiter + (env.PATH || '');
  const child = spawn(rt.exe, codexArgs(o), { cwd: o.cwd, env, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  const mapper = new CodexMapper();
  const stderrTail = [];
  let spawnError = null;
  child.on('error', (e) => { spawnError = e; });
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (d) => { for (const l of String(d).split(/\r?\n/)) if (l.trim()) { stderrTail.push(l.trim()); if (stderrTail.length > 8) stderrTail.shift(); } });
  const onAbort = () => killTree(child);
  if (o.signal) { if (o.signal.aborted) onAbort(); else o.signal.addEventListener('abort', onAbort, { once: true }); }
  child.stdin.on('error', () => { /* the process may exit before reading */ });
  child.stdin.end(o.prompt);

  const exited = new Promise((resolve) => child.on('close', (code) => resolve(code)));
  child.stdout.setEncoding('utf8');
  let buffer = '';
  let ended = false;
  try {
    for await (const chunk of child.stdout) {
      buffer += chunk;
      let nl;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line.startsWith('{')) continue;
        let json; try { json = JSON.parse(line); } catch { continue; }
        for (const ev of mapper.feed(json)) { if (ev.t === 'done' || ev.t === 'error') ended = true; yield ev; }
      }
    }
  } finally {
    if (o.signal) o.signal.removeEventListener('abort', onAbort);
    if (child.exitCode === null) killTree(child);
  }
  const code = await exited;
  if (o.signal && o.signal.aborted) return;
  if (spawnError) throw new Error(`Не удалось запустить Codex: ${spawnError.message}`);
  if (!ended) {
    const why = mapper.lastError || stderrTail.slice(-3).join(' | ');
    throw new Error(`Codex завершился (код ${code}) без результата${why ? ': ' + why.slice(0, 400) : '.'}`);
  }
}
