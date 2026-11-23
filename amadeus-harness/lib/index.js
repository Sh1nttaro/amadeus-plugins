// amadeus-harness — DSH plugin: run a chat on Claude Code or Codex instead of DSH's own agent loop.
// A picker in the composer (left of the model) chooses the executor of a chat. For a chat with a harness the
// model call of DSH's loop is answered by the harness: on the chat's own model (through the connection of the
// chat's provider), in the chat's folder, under the chat's permission preset.
import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHarnessStream, HARNESSES, HARNESS_NAMES, permissionFor } from './adapter.js';
import { runClaude } from './claude.js';
import { runCodex } from './codex.js';
import { runtimeOf } from './runtime.js';
import { installedVersion, latestVersion, compareVersions, startInstall, installJob } from './versions.js';

const name = 'amadeus-harness';
const inject = ['llm'];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const CHATS_FILE = path.join(DATA_DIR, 'chats.json');             // { <sessionId>: { harness, permission } }
const CONNECTIONS_FILE = path.join(DATA_DIR, 'connections.json'); // { <provider>: { baseURL, apiKeyEnv, api } }
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');       // { "<sessionId>|<harness>": <harness's own session id> }
const GUARD_HEADER = 'x-amadeus-harness';

// ---------------------------------------------------------------- small stores
function readJsonFile(file, fallback) { try { const v = JSON.parse(readFileSync(file, 'utf8')); return v && typeof v === 'object' ? v : fallback; } catch { return fallback; } }
function writeJsonFile(file, value) {
  mkdirSync(path.dirname(file), { recursive: true });
  const tmp = file + '.tmp';
  writeFileSync(tmp, JSON.stringify(value, null, 2));
  renameSync(tmp, file);
}
const isSessionId = (s) => typeof s === 'string' && /^[A-Za-z0-9_-]{4,120}$/.test(s);
const PRESETS = new Set(['read-only', 'workspace-write', 'danger-full-access']);

/** The chat's choice; permission is stored as the DSH preset the chat shows. */
export function sanitizeSelection(input) {
  const c = input && typeof input === 'object' ? input : {};
  const harness = HARNESSES.includes(c.harness) ? c.harness : '';
  const permission = typeof c.permission === 'string' && PRESETS.has(c.permission) ? c.permission : 'workspace-write';
  return { harness, permission };
}
/** { provider: { baseURL, apiKeyEnv, api } } as the settings page sends it; only usable entries stay. */
export function sanitizeConnections(input) {
  const out = {};
  const src = input && typeof input === 'object' ? input : {};
  for (const [id, c] of Object.entries(src)) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(id) || !c || typeof c !== 'object') continue;
    const baseURL = typeof c.baseURL === 'string' ? c.baseURL.trim().replace(/\/+$/, '') : '';
    if (!/^https?:\/\//i.test(baseURL)) continue;
    const apiKeyEnv = typeof c.apiKeyEnv === 'string' && /^[A-Z][A-Z0-9_]{2,63}$/.test(c.apiKeyEnv) ? c.apiKeyEnv : '';
    out[id] = { baseURL, apiKeyEnv, api: typeof c.api === 'string' ? c.api.slice(0, 40) : '' };
  }
  return out;
}

// ---------------------------------------------------------------- http helpers
function sendJson(res, status, obj) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function readJson(req) {
  return new Promise((resolve) => {
    let buf = '';
    req.on('data', (c) => { buf += c; if (buf.length > 2_000_000) req.destroy(); });
    req.on('end', () => { try { resolve(buf ? JSON.parse(buf) : {}); } catch { resolve({}); } });
  });
}
/** The routes choose what runs on this computer: only the plugin's own pages may call them. */
function guarded(req, res) {
  const host = String(req.headers.host || '');
  const okHost = /^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/i.test(host);
  if (!okHost || req.headers[GUARD_HEADER] !== '1' || (req.method === 'POST' && !/application\/json/i.test(String(req.headers['content-type'] || '')))) {
    sendJson(res, 403, { ok: false, error: 'forbidden' });
    return false;
  }
  return true;
}

// ---------------------------------------------------------------- plugin
const LOG = [];

function apply(ctx) {
  let credentials = null;
  ctx.inject(['credentials'], (c) => { credentials = c.credentials; });
  let agents = null;
  ctx.inject(['agents'], (c) => { agents = c.agents; });
  let sessionsSvc = null;
  ctx.inject(['sessions'], (c) => { sessionsSvc = c.sessions; });

  const sessions = {
    get: (k) => readJsonFile(SESSIONS_FILE, {})[k] || undefined,
    set: (k, v) => { const all = readJsonFile(SESSIONS_FILE, {}); if (v) all[k] = v; else delete all[k]; writeJsonFile(SESSIONS_FILE, all); },
  };
  const resolveKey = async (ref) => {
    if (!credentials) return '';
    try { const hit = await credentials.resolve(ref); return hit && typeof hit.value === 'string' ? hit.value : ''; } catch { return ''; }
  };

  /** The folder of a DSH chat: from the live session, else from the record DSH keeps, else the home folder. */
  const cwdInfo = (sessionId) => {
    if (!isSessionId(sessionId)) return { cwd: homedir(), from: 'home' };
    try {
      const s = sessionsSvc && sessionsSvc.get(sessionId);
      const c = s && s.header && (s.header.cwd || (s.header.meta && s.header.meta.cwd));
      if (typeof c === 'string' && existsSync(c)) return { cwd: c, from: 'session' };
    } catch { /* fall through */ }
    const file = path.join(homedir(), '.dsh', 'storages', 'session_projcache', 'sessions', `${sessionId}.json`);
    const c = readJsonFile(file, {}).record?.identity?.cwd;
    if (typeof c === 'string' && existsSync(c)) return { cwd: c, from: 'record' };
    return { cwd: homedir(), from: 'home' };
  };

  const stream = createHarnessStream({
    connection: (provider) => readJsonFile(CONNECTIONS_FILE, {})[provider],
    resolveKey, sessions,
    cwdFor: (sessionId) => cwdInfo(sessionId).cwd,
    homeFor: (harness) => path.join(DATA_DIR, harness === 'codex' ? 'codex-home' : 'claude-home'),
    runners: { 'claude-code': runClaude, codex: runCodex },
  });

  // The loop's model call, for a chat that has a harness, goes to the harness. Auxiliary requests (titles,
  // summaries) carry a purpose and stay on the chat's own model.
  ctx.on('llm/stream', (options, next) => {
    if (!options.sessionId || options.purpose) return next();
    const chosen = readJsonFile(CHATS_FILE, {})[options.sessionId];
    if (!chosen || !HARNESSES.includes(chosen.harness)) return next();
    return stream(options, { harness: chosen.harness, permission: permissionFor(chosen.permission) });
  });

  ctx.inject(['webServer'], (hostCtx) => {
    const webServer = hostCtx.webServer;
    if (!webServer || typeof webServer.register !== 'function') return;
    const route = (p, handlers) => webServer.register({
      kind: 'exact', path: p,
      handler: async (req, res) => {
        const handler = handlers[req.method];
        if (!handler) { res.writeHead(405, { allow: Object.keys(handlers).join(', ') }); res.end(); return; }
        if (!guarded(req, res)) return;
        try { sendJson(res, 200, await handler(req.method === 'POST' ? await readJson(req) : null)); }
        catch (e) { sendJson(res, 200, { ok: false, error: e && e.message ? e.message : String(e) }); }
      },
    });
    const known = (id) => HARNESSES.includes(id);

    // Which harnesses are installed, and their versions.
    route('/amadeus-harness/state', { GET: async () => ({
      ok: true,
      harnesses: await Promise.all(HARNESSES.map(async (id) => {
        const rt = runtimeOf(id);
        return { id, name: HARNESS_NAMES[id], installed: rt.ok, reason: rt.ok ? null : rt.reason, version: rt.ok ? await installedVersion(id) : null };
      })),
    }) });

    // { id } — is there a newer release?
    route('/amadeus-harness/check', { POST: async (b) => {
      if (!known(b.id)) return { ok: false, error: 'Неизвестный харнес.' };
      const [installed, latest] = await Promise.all([installedVersion(b.id), latestVersion(b.id)]);
      return { ok: true, installed, latest: latest.version, updateAvailable: !!installed && compareVersions(latest.version, installed) > 0 };
    } });

    // POST { id } — start installing the newest release; GET — progress of the running installs
    route('/amadeus-harness/install', {
      POST: async (b) => {
        if (!known(b.id)) return { ok: false, error: 'Неизвестный харнес.' };
        const job = await startInstall(b.id);
        return { ok: true, running: job.running };
      },
      GET: async () => ({ ok: true, jobs: Object.fromEntries(HARNESSES.map((id) => [id, installJob(id)]).filter(([, j]) => j)) }),
    });

    // { sessionId, harness?, permission? } — read or set the choice of one chat ("" returns the chat to DSH)
    route('/amadeus-harness/session', { POST: async (b) => {
      if (!isSessionId(b.sessionId)) return { ok: false, error: 'bad session id' };
      const all = readJsonFile(CHATS_FILE, {});
      const cur = all[b.sessionId] || { harness: '', permission: 'workspace-write' };
      if (typeof b.harness === 'string' || typeof b.permission === 'string') {
        const next = sanitizeSelection({ harness: typeof b.harness === 'string' ? b.harness : cur.harness, permission: typeof b.permission === 'string' ? b.permission : cur.permission });
        if (next.harness) all[b.sessionId] = next; else delete all[b.sessionId];
        writeJsonFile(CHATS_FILE, all);
        return { ok: true, ...next };
      }
      return { ok: true, harness: cur.harness, permission: cur.permission };
    } });

    // { providers } — the addresses and key names of the provider connections, kept for the model calls
    route('/amadeus-harness/connections', { POST: async (b) => {
      const providers = sanitizeConnections(b.providers);
      writeJsonFile(CONNECTIONS_FILE, providers);
      return { ok: true, count: Object.keys(providers).length };
    } });

    // { harness, provider, model, via? } — a real, tiny run; via "agent" goes through a throw-away DSH chat
    route('/amadeus-harness/test', { POST: async (b) => {
      if (!known(b.harness)) return { ok: false, error: 'Неизвестный харнес.' };
      if (typeof b.provider !== 'string' || typeof b.model !== 'string') return { ok: false, error: 'Нужны provider и model.' };
      const started = Date.now();
      const ask = 'Ответь одним словом: «готово».';
      if (b.via === 'agent') return runAgentTest(b.harness, b.provider, b.model, ask, started);
      let text = '', failure = '', usage = null;
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 150000);
      try {
        for await (const c of stream({ provider: b.provider, model: b.model, reasoningEffort: typeof b.effort === 'string' ? b.effort : undefined, noTools: true, signal: ac.signal, messages: [{ role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: ask }] }] }, { harness: b.harness, permission: 'read' })) {
          if (c.type === 'text-delta') text += c.text;
          else if (c.type === 'usage') usage = c.usage;
          else if (c.type === 'finish' && c.reason.kind !== 'stop') failure = c.reason.failure ? c.reason.failure.message : c.reason.kind;
        }
      } finally { clearTimeout(timer); }
      return failure ? { ok: false, error: failure, ms: Date.now() - started } : { ok: true, text: text.trim().slice(0, 300), usage, ms: Date.now() - started };
    } });

    /** A whole turn through DSH's agent loop in a throw-away chat that has the harness selected (removed afterwards). */
    async function runAgentTest(harness, provider, model, ask, started) {
      if (!agents) return { ok: false, error: 'Сервис агентов DSH недоступен.' };
      const sessionId = `harness-test-${randomUUID()}`;
      const chats = readJsonFile(CHATS_FILE, {});
      chats[sessionId] = { harness, permission: 'read-only' };
      writeJsonFile(CHATS_FILE, chats);
      const handle = await agents.create({ sessionId, agentOptions: { provider, model } });
      try {
        handle.agent.followup({ id: randomUUID(), role: 'user', content: [{ type: 'text', text: ask }], source: { kind: 'user' } });
        const deadline = Date.now() + 150000;
        for (;;) {
          await new Promise((r) => setTimeout(r, 400));
          const done = handle.agent.session.deriveMessages().some((m) => m.role === 'assistant');
          if (handle.agent.status === 'idle' && done) break;
          if (Date.now() > deadline) return { ok: false, error: 'Агент не ответил за 150 секунд.', ms: Date.now() - started };
        }
        const messages = handle.agent.session.deriveMessages();
        const answer = [...messages].reverse().find((m) => m.role === 'assistant');
        const text = answer ? (answer.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('').trim() : '';
        const header = sessionsSvc && sessionsSvc.get(sessionId) && sessionsSvc.get(sessionId).header;
        return { ok: true, via: 'agent', text: text.slice(0, 300), shape: messages.map((m) => `${m.role}:${(m.content || []).map((c) => c.type).join('+')}`), cwd: cwdInfo(sessionId), headerKeys: header ? Object.keys(header) : null, ms: Date.now() - started };
      } finally {
        try { await handle.dispose(); } catch { /* already gone */ }
        const after = readJsonFile(CHATS_FILE, {}); delete after[sessionId]; writeJsonFile(CHATS_FILE, after);
        sessions.set(`${sessionId}|${harness}`, '');
      }
    }

    // { provider, model, effort? } — one call through DSH's own llm service, to see what a reasoning level does
    route('/amadeus-harness/llm-test', { POST: async (b) => {
      if (typeof b.provider !== 'string' || typeof b.model !== 'string') return { ok: false, error: 'Нужны provider и model.' };
      const started = Date.now();
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), 120000);
      const out = { reasoningChunks: 0, reasoningChars: 0, text: '', usage: null, finish: null };
      try {
        for await (const c of ctx.llm.stream({ provider: b.provider, model: b.model, reasoningEffort: b.effort || undefined, signal: ac.signal, messages: [{ role: 'user', content: [{ type: 'text', text: 'Сколько будет 17 умножить на 23? Ответь числом.' }] }] })) {
          if (c.type === 'reasoning-delta') { out.reasoningChunks++; out.reasoningChars += c.text.length; }
          else if (c.type === 'text-delta') out.text += c.text;
          else if (c.type === 'usage') out.usage = c.usage;
          else if (c.type === 'finish') out.finish = c.reason.kind + (c.reason.failure ? ': ' + c.reason.failure.message : '');
        }
      } finally { clearTimeout(timer); }
      return { ok: out.finish === 'stop', ...out, text: out.text.trim().slice(0, 200), ms: Date.now() - started };
    } });

    route('/amadeus-harness/log', {
      POST: async (b) => { if (b && b.msg) { LOG.push(new Date().toISOString().slice(11, 19) + ' ' + String(b.msg).slice(0, 800)); if (LOG.length > 80) LOG.shift(); } return { ok: true }; },
      GET: async () => ({ ok: true, log: LOG }),
    });
  });
}

export { apply, inject, name };
