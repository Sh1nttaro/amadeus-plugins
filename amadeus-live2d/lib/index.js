import { spawn } from 'node:child_process';
import { readdirSync, existsSync, readFileSync, writeFileSync, mkdirSync, createReadStream, createWriteStream, mkdtempSync, rmSync, statSync, openSync, readSync, closeSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative, basename, extname, sep } from 'node:path';
import { defineTool } from '@deepseek-ai/dsh-tools';

const name = 'amadeus-live2d';
const inject = ['tools'];

const COMPANION_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'companion');

let port = 0;
let companion = null;
let activeModelId = '';
let speakLog = [];
function logSpeak(entry) { speakLog.push(entry); if (speakLog.length > 100) speakLog.shift(); }

function electronBinary() {
  // The DSH host child runs in Node mode; spawning process.execPath (the DSH app
  // itself) re-triggers its single-instance/cache lock and exits immediately.
  // Prefer a standalone Electron binary from the shared runtime folder (setup/install-runtime.ps1
  // puts it there), falling back to process.execPath.
  const runtime = process.env.AMADEUS_RUNTIME || 'W:\\amadeus-runtime';
  const cand = process.env.AMADEUS_COMPANION_ELECTRON || join(runtime, 'electron', 'electron.exe');
  return (cand && existsSync(cand)) ? cand : process.execPath;
}

let starting = null;
let failedAt = 0;
const RETRY_AFTER_MS = 10000;
process.once('exit', () => { try { companion?.kill(); } catch {} });

function ensureCompanion() {
  if (companion && port > 0) return Promise.resolve();
  if (starting) return starting;
  if (Date.now() - failedAt < RETRY_AFTER_MS) return Promise.reject(new Error('Компаньон Live2D недоступен, повторю попытку чуть позже.'));
  starting = new Promise((resolve, reject) => {
    const env = { ...process.env, AMADEUS_PARENT_PID: String(process.pid) };
    if (providerKey && !env.LITELLM_API_KEY) env.LITELLM_API_KEY = providerKey;
    delete env.ELECTRON_RUN_AS_NODE;
    const child = spawn(electronBinary(), [COMPANION_DIR], { stdio: ['ignore', 'pipe', 'pipe'], env, windowsHide: true });
    companion = child;
    const fail = (e) => {
      clearTimeout(timer);
      failedAt = Date.now();
      try { child.kill(); } catch {}
      reject(e);
    };
    const timer = setTimeout(() => fail(new Error('Компаньон Live2D не запустился (таймаут).')), 30000);
    let buf = '';
    const onData = (chunk) => {
      buf = (buf + chunk.toString()).slice(-4096);
      const m = buf.match(/\{"type":"ready","port":(\d+)\}/);
      if (m) {
        port = Number(m[1]);
        clearTimeout(timer);
        child.stdout.off('data', onData);
        child.stdout.resume();
        resolve();
      }
    };
    child.stdout.on('data', onData);
    child.stderr.resume();
    child.on('error', fail);
    child.on('exit', () => { if (companion === child) { companion = null; port = 0; } });
  }).finally(() => { starting = null; });
  return starting;
}

async function http(path, body, timeoutMs = 30000) {
  await ensureCompanion();
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? {} : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ac.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (data.ok === false) throw new Error(data.error || 'Ошибка компаньона Live2D.');
    return data;
  } finally {
    clearTimeout(t);
  }
}

// The web client (lib/client.js wireSpeech) also streams the reply via
// /amadeus-live2d/speak. While it is streaming answer text the host bridge stays
// quiet so the bubble does not get two interleaved feeds.
let lastClientSpeakAt = 0;
const CLIENT_SPEAK_GRACE_MS = 5000;

// Host-side agent speech bridge — mirrors amadeus-v2's trackDefaultLoop
// (amadeus-client-ui-harness/lib/index.js): subscribe to the agent's streamed
// chunks, track the phase (thinking/tool/answer) for the orb + dots, accumulate
// the text and forward both to the companion's /speak.
function trackAgentSpeech(ctx) {
  if (typeof ctx.on !== 'function') return;
  const trackers = new Map();
  const forAgent = (agent) => {
    const id = (agent && agent.session && agent.session.id) || (agent && agent.id) || 'default';
    let t = trackers.get(id);
    if (!t) { t = { speech: '', phase: 'idle', status: '', lastAt: 0 }; trackers.set(id, t); }
    return t;
  };
  const send = (t, final, force) => {
    const now = Date.now();
    if (!force && !final && now - t.lastAt < 200) return;
    t.lastAt = now;
    const skip = now - lastClientSpeakAt < CLIENT_SPEAK_GRACE_MS;
    logSpeak({ t: now, src: skip ? 'host-skip' : 'host', phase: t.phase, text: t.speech.slice(0, 160), final });
    if (skip) return;
    const body = { text: t.speech, final, phase: t.phase, status: t.status };
    http('/speak', body).catch(() => {});
  };
  const setPhase = (t, phase, status, final) => {
    if (t.phase === phase && t.status === status) return;
    t.phase = phase;
    t.status = status;
    send(t, final, true);
  };
  ctx.on('agent/assistant-stream', (payload) => {
    const frame = payload && payload.frame;
    if (!frame) return;
    const t = forAgent(payload && payload.agent);
    if (frame.type === 'start') { t.speech = ''; setPhase(t, 'connecting', 'Подключаюсь…', false); return; }
    if (frame.type === 'end') return;
    const chunk = frame.chunk;
    if (!chunk) return;
    switch (chunk.type) {
      case 'reasoning-delta':
        setPhase(t, 'thinking', 'Думаю…', false);
        return;
      case 'tool-call-delta':
        setPhase(t, 'tool', chunk.name || 'Инструмент', false);
        return;
      case 'text-delta':
        if (typeof chunk.text === 'string') t.speech += chunk.text;
        t.phase = 'answer';
        t.status = '';
        send(t, false, false);
        return;
      case 'finish':
        if (t.speech) send(t, true, true);
        t.speech = '';
        return;
    }
  });
  ctx.on('agent/status', (payload) => {
    if (!payload || payload.status !== 'idle') return;
    const t = forAgent(payload.agent);
    t.speech = '';
    // After an answer the bubble shows it and hides itself; only clear a bubble
    // stuck in thinking/tool (turn stopped without an answer).
    if (t.phase === 'answer' || t.phase === 'error') { t.phase = 'idle'; t.status = ''; return; }
    setPhase(t, 'idle', '', true);
  });
  ctx.on('agent/error', (payload) => {
    const t = forAgent(payload && payload.agent);
    const error = payload && payload.error;
    setPhase(t, 'error', String((error && error.message) || error || 'Ошибка').slice(0, 240), false);
  });
}

const looseOutput = {
  schema: { type: 'object', additionalProperties: true },
  render: (_args, value) => [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }],
};

const MODELS_DIR = join(COMPANION_DIR, 'models');
const RENDERER_DIR = join(COMPANION_DIR, 'renderer');

// bubble.html with a stand-in for the Electron preload: speech and tail side come
// from the parent settings tab via postMessage.
const BUBBLE_PREVIEW_SHIM = `<base href="/amadeus-live2d/bubble-preview/">
<script>
(function () {
  var speech = [], side = [];
  window.amadeus = {
    onSpeech: function (f) { speech.push(f); return function () {}; },
    onBubbleSide: function (f) { side.push(f); return function () {}; },
    speak: function () {},
    bubbleInteractive: function () {}
  };
  window.addEventListener("message", function (e) {
    var d = e.data;
    if (!d || d.source !== "amadeus-bubble-preview") return;
    if (d.side) side.forEach(function (f) { f(d.side); });
    if (d.speech) speech.forEach(function (f) { f(d.speech); });
  });
})();
</script>`;
let bubblePreviewCache = null;
function bubblePreviewHtml() {
  if (bubblePreviewCache) return bubblePreviewCache;
  const html = readFileSync(join(RENDERER_DIR, 'bubble.html'), 'utf8');
  bubblePreviewCache = html
    .replace('<head>', '<head>\n' + BUBBLE_PREVIEW_SHIM)
    .replace('</body>', '<script type="module">window.parent.postMessage({ source: "amadeus-bubble-preview", ready: true }, "*");</script>\n</body>');
  return bubblePreviewCache;
}

// The card preview: the first icon/portrait image in the model folder, or null.
// Mirrors amadeus-v2 live2dFindPreviewIcon (texture atlases are never a preview).
const previewCache = new Map();
function findPreviewHost(modelDir) {
  if (!previewCache.has(modelDir)) previewCache.set(modelDir, scanPreview(modelDir));
  return previewCache.get(modelDir);
}
function scanPreview(modelDir) {
  try {
    const files = [];
    const walk = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.')) continue;
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.isFile() && /\.(png|jpe?g|webp)$/i.test(entry.name)) files.push(relative(modelDir, full));
      }
    };
    walk(modelDir);
    const rank = (name) => {
      const stem = basename(name, extname(name)).toLowerCase();
      if (/^(icon|preview|thumbnail|portrait|avatar)$/.test(stem)) return 0;
      if (/icon|avatar|preview|thumb|portrait|头像|ico/.test(stem)) return 1;
      return 2;
    };
    const candidates = files.filter((name) => !/texture/.test(basename(name, extname(name)).toLowerCase()));
    candidates.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
    return candidates.length ? candidates[0].split(sep).join('/') : null;
  } catch {
    return null;
  }
}

// Build the full catalog in the HOST (no companion spawn) so the Settings tab lists instantly.
function fullModelHost(id) {
  try {
    const char = JSON.parse(readFileSync(join(MODELS_DIR, id, 'character.json'), 'utf8'));
    const cat = JSON.parse(readFileSync(join(MODELS_DIR, id, 'catalog.json'), 'utf8'));
    const motions = (cat.motions || []).map((g) => ({
      key: g.key,
      label: g.label || g.key,
      items: (g.items || []).map((it, i) => ({ index: i, label: it.label, original: it.original || '' })),
    }));
    const expressions = (cat.expressions || []).map((e) => ({ name: e.key, label: e.label || e.key, original: e.original || '' }));
    return {
      id,
      name: char.displayName || id,
      description: char.description || 'Live2D модель',
      motions: motions.reduce((n, g) => n + g.items.length, 0),
      expressions: expressions.length,
      actions: { motions, expressions },
      preview: findPreviewHost(join(MODELS_DIR, id)) ? '/amadeus-live2d/preview/' + id : '',
    };
  } catch {
    return { id, name: id, description: 'Live2D модель', motions: 0, expressions: 0, actions: { motions: [], expressions: [] }, preview: '' };
  }
}

function listModelsHost() {
  previewCache.clear(); // the list is the "refresh": pick up added/removed models
  try {
    return readdirSync(MODELS_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory() && existsSync(join(MODELS_DIR, e.name, 'character.json')))
      .map((e) => fullModelHost(e.name));
  } catch {
    return [];
  }
}

const UPLOAD_LIMIT = 2 * 1024 * 1024 * 1024;
const DOWNLOADS_DIR = join(homedir(), 'Downloads');

const peekCache = new Map();
/** What a zip holds, from its central directory only: 'live2d' | 'cubism2' | 'none' | 'unknown' (rar/7z). */
function peekArchive(file) {
  if (!/\.zip$/i.test(file)) return 'unknown';
  let st;
  try { st = statSync(file); } catch { return 'unknown'; }
  const key = file + ':' + st.size + ':' + st.mtimeMs;
  if (peekCache.has(key)) return peekCache.get(key);
  let kind = 'unknown';
  let fd = -1;
  try {
    fd = openSync(file, 'r');
    const tail = Math.min(st.size, 65557);
    const buf = Buffer.alloc(tail);
    readSync(fd, buf, 0, tail, st.size - tail);
    let eocd = -1;
    for (let i = tail - 22; i >= 0; i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
    if (eocd >= 0) {
      const cdSize = buf.readUInt32LE(eocd + 12);
      const cdOffset = buf.readUInt32LE(eocd + 16);
      if (cdSize > 0 && cdSize < 64 * 1024 * 1024 && cdOffset !== 0xffffffff) {
        const cd = Buffer.alloc(cdSize);
        readSync(fd, cd, 0, cdSize, cdOffset);
        const names = cd.toString('latin1').toLowerCase();
        kind = names.includes('.model3.json') || names.includes('.moc3') ? 'live2d'
          : /\.moc(?![a-z0-9])|model\.json/.test(names) ? 'cubism2'
          : /\.(zip|rar|7z)(?![a-z0-9])/.test(names) ? 'unknown' : 'none';
      }
    }
  } catch { kind = 'unknown'; }
  finally { if (fd >= 0) try { closeSync(fd); } catch {} }
  peekCache.set(key, kind);
  return kind;
}

/** Archives downloaded in the last 60 days, newest first; "imported" when a model came from it. */
function recentArchives() {
  const importedFrom = new Set();
  try {
    for (const e of readdirSync(MODELS_DIR, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      try {
        const c = JSON.parse(readFileSync(join(MODELS_DIR, e.name, 'character.json'), 'utf8'));
        if (c.source && c.source.archive) importedFrom.add(String(c.source.archive).toLowerCase());
      } catch {}
    }
  } catch {}
  const since = Date.now() - 60 * 24 * 3600 * 1000;
  try {
    return readdirSync(DOWNLOADS_DIR, { withFileTypes: true })
      .filter((e) => e.isFile() && /\.(zip|rar|7z)$/i.test(e.name))
      .map((e) => { const st = statSync(join(DOWNLOADS_DIR, e.name)); return { name: e.name, size: st.size, mtime: st.mtimeMs }; })
      .filter((f) => f.mtime >= since)
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 30)
      .map((f) => ({ ...f, imported: importedFrom.has(f.name.toLowerCase()), kind: peekArchive(join(DOWNLOADS_DIR, f.name)) }));
  } catch {
    return [];
  }
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' });
  res.end(body);
}

function readJson(req) {
  return new Promise((resolve) => {
    let buf = '';
    req.on('data', (c) => { buf += c; });
    req.on('end', () => { try { resolve(buf ? JSON.parse(buf) : {}); } catch { resolve({}); } });
  });
}

// ---------------------------------------------------------------- the DSH provider key (speech recognition)
// Whisper runs on the same LiteLLM the user connected in DSH: the key is read from the DSH credential
// store (never written anywhere) and handed to the companion through its environment / a local route.
let providerKey = '';
function watchProviderKey(ctx) {
  if (typeof ctx.inject !== 'function') return;
  try {
    ctx.inject(['credentials'], async (c) => {
      try {
        const hit = await c.credentials.resolve('LITELLM_API_KEY');
        if (hit && typeof hit.value === 'string' && hit.value) {
          providerKey = hit.value;
          if (companion && port) http('/provider', { key: providerKey }, 5000).catch(() => {});
        }
      } catch {}
    });
  } catch {}
}


// ---------------------------------------------------------------- the companion's own chat
// A DSH Workspace "live2D" (a folder next to the default workspace) with one chat per character,
// titled with the character's name. Voice messages and the menu's text box go there.
const CHAT_FILE = join(COMPANION_DIR, 'chat.json');
const clientLog = [];
function companionChatDir() {
  let base = join(homedir(), 'Documents', 'deepseek-harness');
  try {
    const reg = JSON.parse(readFileSync(join(homedir(), '.dsh', 'storages', 'workspace.json'), 'utf8'));
    const def = reg.tables.workspaces[reg.global.defaultWorkspaceId];
    if (def && def.path) base = dirname(def.path);
  } catch {}
  const dir = join(base, 'live2D');
  try { mkdirSync(dir, { recursive: true }); } catch {}
  return dir;
}
function readChat() { try { return JSON.parse(readFileSync(CHAT_FILE, 'utf8')); } catch { return { sessions: {} }; } }

function apply(ctx) {
  watchProviderKey(ctx);
  // Pre-boot the Live2D companion (Electron sidecar) in the background so the
  // first card click does not wait for the ~10s companion boot.
  ensureCompanion().catch(() => {});
  // Stream the agent's reply text into the companion's bubble/orb.
  trackAgentSpeech(ctx);

  ctx.tools.register(defineTool({
    name: 'list_live2d_characters',
    description: 'List the Live2D characters available in the companion (each has a stable id).',
    parameters: {},
    output: looseOutput,
    async execute() { const r = await http('/list_models'); return r.models; },
  }));

  ctx.tools.register(defineTool({
    name: 'load_live2d_model',
    description: 'Show a Live2D character on screen by its id (from list_live2d_characters).',
    parameters: { id: { type: 'string', required: true, description: 'Character id.' } },
    output: looseOutput,
    async execute(args) { const r = await http('/load_model', { id: args.id }); if (r.ok && r.result && r.result.ok) activeModelId = args.id; return r; },
  }));

  ctx.tools.register(defineTool({
    name: 'play_live2d_motion',
    description: 'Play a motion clip on the active Live2D character (group + index from list_live2d_actions).',
    parameters: {
      group: { type: 'string', required: true, description: 'Motion group key.' },
      index: { type: 'integer', required: true, description: 'Motion index within the group.' },
    },
    output: looseOutput,
    async execute(args) { return http('/command', { name: 'play_motion', args: { group: args.group, index: args.index } }); },
  }));

  ctx.tools.register(defineTool({
    name: 'set_live2d_expression',
    description: 'Set an expression/emotion on the active Live2D character (name from list_live2d_actions).',
    parameters: { name: { type: 'string', required: true, description: 'Expression name.' } },
    output: looseOutput,
    async execute(args) { return http('/command', { name: 'set_expression', args: { name: args.name } }); },
  }));

  ctx.tools.register(defineTool({
    name: 'live2d_return_to_idle',
    description: 'Return the active Live2D character to its idle state.',
    parameters: {},
    output: looseOutput,
    async execute() { return http('/command', { name: 'return_to_idle', args: {} }); },
  }));

  ctx.tools.register(defineTool({
    name: 'list_live2d_actions',
    description: 'List motions and expressions available for the active Live2D character.',
    parameters: {},
    output: looseOutput,
    async execute() { const r = await http('/list_actions'); return r.result; },
  }));

  ctx.tools.register(defineTool({
    name: 'live2d_speak',
    description: 'Show text in the Live2D character speech bubble.',
    parameters: { text: { type: 'string', required: true, description: 'Text to display.' } },
    output: looseOutput,
    async execute(args) { return http('/speak', { text: args.text }); },
  }));

  // Same-origin HTTP routes for the Settings UI (client half).
  ctx.inject(['webServer'], (hostCtx) => {
    const webServer = hostCtx.webServer;
    if (!webServer || typeof webServer.register !== 'function') return;

    webServer.register({
      kind: 'exact',
      path: '/amadeus-live2d/list',
      handler: async (req, res) => {
        if (req.method !== 'GET') { res.writeHead(405, { allow: 'GET' }); res.end(); return; }
        try { sendJson(res, 200, { models: listModelsHost() }); }
        catch (e) { sendJson(res, 200, { models: [], error: e.message }); }
      },
    });

    webServer.register({
      kind: 'exact',
      path: '/amadeus-live2d/active',
      handler: async (req, res) => {
        if (req.method !== 'GET') { res.writeHead(405, { allow: 'GET' }); res.end(); return; }
        if (!activeModelId && companion && port > 0) {
          try { const r = await http('/active', undefined, 3000); if (typeof r.active === 'string') activeModelId = r.active; } catch {}
        }
        sendJson(res, 200, { active: activeModelId });
      },
    });

    webServer.register({
      kind: 'exact',
      path: '/amadeus-live2d/select',
      handler: async (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405, { allow: 'POST' }); res.end(); return; }
        const body = await readJson(req);
        try { const r = await http('/select', { id: body.id }); if (r.ok) activeModelId = body.id; sendJson(res, 200, r); }
        catch (e) { sendJson(res, 200, { ok: false, error: e.message }); }
      },
    });

    webServer.register({
      kind: 'exact',
      path: '/amadeus-live2d/remove',
      handler: async (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405, { allow: 'POST' }); res.end(); return; }
        const body = await readJson(req);
        try { const r = await http('/remove', { id: body.id }); if (r.ok && activeModelId === body.id) activeModelId = ''; sendJson(res, 200, r); }
        catch (e) { sendJson(res, 200, { ok: false, error: e.message }); }
      },
    });

    webServer.register({
      kind: 'exact',
      path: '/amadeus-live2d/load',
      handler: async (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405, { allow: 'POST' }); res.end(); return; }
        const body = await readJson(req);
        try { const r = await http('/load_model', { id: body.id }); if (r.ok) activeModelId = body.id; sendJson(res, 200, r); }
        catch (e) { sendJson(res, 500, { ok: false, error: e.message }); }
      },
    });

    webServer.register({
      kind: 'exact',
      path: '/amadeus-live2d/command',
      handler: async (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405, { allow: 'POST' }); res.end(); return; }
        const body = await readJson(req);
        try { const r = await http('/command', body); sendJson(res, 200, r.result || r); }
        catch (e) { sendJson(res, 500, { ok: false, error: e.message }); }
      },
    });

    webServer.register({
      kind: 'exact',
      path: '/amadeus-live2d/settings',
      handler: async (req, res) => {
        if (req.method === 'GET') {
          try { const r = await http('/settings'); sendJson(res, 200, r); }
          catch (e) { sendJson(res, 200, { ok: false, error: e.message }); }
          return;
        }
        if (req.method === 'POST') {
          const body = await readJson(req);
          try { const r = await http('/settings', body); sendJson(res, 200, r); }
          catch (e) { sendJson(res, 200, { ok: false, error: e.message }); }
          return;
        }
        res.writeHead(405, { allow: 'GET,POST' }); res.end();
      },
    });

    webServer.register({
      kind: 'exact',
      path: '/amadeus-live2d/speak',
      handler: async (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405, { allow: 'POST' }); res.end(); return; }
        const body = await readJson(req);
        if (body && body.text) lastClientSpeakAt = Date.now();
        logSpeak({ t: Date.now(), src: 'client', phase: body && body.phase, text: String(body && body.text || '').slice(0, 160), final: !!(body && body.final), ...(body && body.diag ? { diag: body.diag } : {}) });
        if (body && body.diag) { sendJson(res, 200, { ok: true }); return; }
        try { const r = await http('/speak', body); sendJson(res, 200, r); }
        catch (e) { sendJson(res, 200, { ok: false, error: e.message }); }
      },
    });

    webServer.register({
      kind: 'exact',
      path: '/amadeus-live2d/speak-log',
      handler: (req, res) => {
        sendJson(res, 200, { log: speakLog, now: Date.now() });
      },
    });

    webServer.register({
      kind: 'exact',
      path: '/amadeus-live2d/voice-import',
      handler: async (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405, { allow: 'POST' }); res.end(); return; }
        const body = await readJson(req);
        try { const r = await http('/voice-import', body); sendJson(res, 200, r); }
        catch (e) { sendJson(res, 200, { ok: false, error: e.message }); }
      },
    });

    webServer.register({
      kind: 'exact',
      path: '/amadeus-live2d/transcribe',
      handler: async (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405, { allow: 'POST' }); res.end(); return; }
        const body = await readJson(req);
        try { const r = await http('/transcribe', body); sendJson(res, 200, r); }
        catch (e) { sendJson(res, 200, { ok: false, error: e.message }); }
      },
    });

    webServer.register({
      kind: 'exact',
      path: '/amadeus-live2d/companion-chat',
      handler: async (req, res) => {
        try {
          const st = readChat();
          if (req.method === 'POST') {                          // remember the Workspace / a character's chat
            const b = await readJson(req);
            if (typeof b.workspaceId === 'string') st.workspaceId = b.workspaceId;
            if (typeof b.modelId === 'string') { st.sessions = st.sessions || {}; if (typeof b.sessionId === 'string' && b.sessionId) st.sessions[b.modelId] = b.sessionId; else delete st.sessions[b.modelId]; }
            writeFileSync(CHAT_FILE, JSON.stringify(st, null, 2));
            sendJson(res, 200, { ok: true });
            return;
          }
          if (!activeModelId && companion && port > 0) {
            try { const r = await http('/active', undefined, 3000); if (typeof r.active === 'string') activeModelId = r.active; } catch {}
          }
          let model = null;
          if (activeModelId) { const m = listModelsHost().find((x) => x.id === activeModelId); model = { id: activeModelId, name: (m && m.name) || activeModelId }; }
          sendJson(res, 200, { ok: true, path: companionChatDir(), workspaceId: st.workspaceId || '', sessions: st.sessions || {}, model });
        } catch (e) { sendJson(res, 200, { ok: false, error: e.message }); }
      },
    });

    webServer.register({
      kind: 'exact',
      path: '/amadeus-live2d/client-log',
      handler: async (req, res) => {
        if (req.method === 'POST') { const b = await readJson(req); if (b && b.msg) { clientLog.push(new Date().toISOString().slice(11, 19) + ' ' + String(b.msg).slice(0, 600)); if (clientLog.length > 40) clientLog.shift(); } }
        sendJson(res, 200, { ok: true, log: clientLog });
      },
    });

    webServer.register({
      kind: 'exact',
      path: '/amadeus-live2d/chat-message',
      handler: async (req, res) => {
        if (req.method !== 'GET') { res.writeHead(405, { allow: 'GET' }); res.end(); return; }
        try { const r = await http('/chat-message'); sendJson(res, 200, r); }
        catch (e) { sendJson(res, 200, { ok: false, error: e.message }); }
      },
    });

    // ---- Import: native dialog, drag-and-drop upload, recent archives in Downloads ----
    const IMPORT_TIMEOUT = 10 * 60 * 1000;
    webServer.register({
      kind: 'exact',
      path: '/amadeus-live2d/import-dialog',
      handler: async (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405, { allow: 'POST' }); res.end(); return; }
        const body = await readJson(req);
        try { sendJson(res, 200, await http('/import_dialog', { kind: body.kind === 'folder' ? 'folder' : 'archive' }, IMPORT_TIMEOUT)); }
        catch (e) { sendJson(res, 200, { ok: false, error: e.message }); }
      },
    });

    webServer.register({
      kind: 'exact',
      path: '/amadeus-live2d/import-upload',
      handler: async (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405, { allow: 'POST' }); res.end(); return; }
        const name = basename(String(new URL(req.url, 'http://x').searchParams.get('name') || ''));
        if (!/\.(zip|rar|7z)$/i.test(name)) { sendJson(res, 200, { ok: false, error: 'Перетащите архив .zip, .rar или .7z (папку — через кнопку «Папка…»).' }); req.resume(); return; }
        const dir = mkdtempSync(join(tmpdir(), 'amadeus-upload-'));
        const file = join(dir, name);
        try {
          await new Promise((resolve, reject) => {
            let size = 0;
            const out = createWriteStream(file);
            req.on('data', (chunk) => {
              size += chunk.length;
              if (size > UPLOAD_LIMIT) { req.destroy(); out.destroy(); reject(new Error('Архив больше 2 ГБ.')); }
            });
            req.pipe(out);
            out.on('finish', resolve);
            out.on('error', reject);
            req.on('error', reject);
          });
          sendJson(res, 200, await http('/import', { paths: [file] }, IMPORT_TIMEOUT));
        } catch (e) {
          sendJson(res, 200, { ok: false, error: e.message });
        } finally {
          rmSync(dir, { recursive: true, force: true });
        }
      },
    });

    webServer.register({
      kind: 'exact',
      path: '/amadeus-live2d/downloads',
      handler: async (req, res) => {
        if (req.method !== 'GET') { res.writeHead(405, { allow: 'GET' }); res.end(); return; }
        sendJson(res, 200, { dir: DOWNLOADS_DIR, files: recentArchives() });
      },
    });

    webServer.register({
      kind: 'exact',
      path: '/amadeus-live2d/import-downloads',
      handler: async (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405, { allow: 'POST' }); res.end(); return; }
        const body = await readJson(req);
        const name = basename(String(body.name || ''));
        const file = join(DOWNLOADS_DIR, name);
        if (!/\.(zip|rar|7z)$/i.test(name) || !existsSync(file)) { sendJson(res, 200, { ok: false, error: 'Файл не найден в папке «Загрузки».' }); return; }
        try { sendJson(res, 200, await http('/import', { paths: [file] }, IMPORT_TIMEOUT)); }
        catch (e) { sendJson(res, 200, { ok: false, error: e.message }); }
      },
    });

    webServer.register({
      kind: 'exact',
      path: '/amadeus-live2d/rename',
      handler: async (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405, { allow: 'POST' }); res.end(); return; }
        const body = await readJson(req);
        try { sendJson(res, 200, await http('/rename', body)); }
        catch (e) { sendJson(res, 200, { ok: false, error: e.message }); }
      },
    });

    // The real companion bubble (bubble.html + its assets) for the live preview in
    // the settings tab. The page talks to the settings tab over postMessage instead
    // of the Electron preload, so it renders exactly what the desktop bubble shows.
    webServer.register({
      kind: 'prefix',
      path: '/amadeus-live2d/bubble-preview',
      handler: (req, res) => {
        try {
          const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/amadeus-live2d\/bubble-preview\/?/, '');
          if (rel === '' || rel === 'index.html') {
            res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
            res.end(bubblePreviewHtml());
            return;
          }
          if (!/^assets\/bubble-[A-Za-z0-9_-]+\.(js|css)$/.test(rel)) { res.writeHead(404); res.end(); return; }
          const file = join(RENDERER_DIR, rel);
          if (!existsSync(file)) { res.writeHead(404); res.end(); return; }
          res.writeHead(200, { 'content-type': rel.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'text/css; charset=utf-8', 'cache-control': 'no-cache' });
          createReadStream(file).pipe(res);
        } catch { res.writeHead(500); res.end(); }
      },
    });

    webServer.register({
      kind: 'prefix',
      path: '/amadeus-live2d/preview',
      handler: (req, res) => {
        try {
          const id = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/amadeus-live2d\/preview\/?/, '');
          if (!/^[A-Za-z0-9._-]+$/.test(id)) { res.writeHead(400); res.end(); return; }
          const rel = findPreviewHost(join(MODELS_DIR, id));
          if (!rel) { res.writeHead(404); res.end(); return; }
          const file = join(MODELS_DIR, id, rel);
          if (!existsSync(file)) { res.writeHead(404); res.end(); return; }
          const type = /\.jpe?g$/i.test(rel) ? 'image/jpeg' : /\.webp$/i.test(rel) ? 'image/webp' : 'image/png';
          res.writeHead(200, { 'content-type': type, 'cache-control': 'max-age=300' });
          createReadStream(file).pipe(res);
        } catch { res.writeHead(500); res.end(); }
      },
    });
  });
}

export { apply, inject, name };
