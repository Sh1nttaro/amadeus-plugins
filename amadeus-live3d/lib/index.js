// amadeus-live3d — DSH plugin: a "living" 3D VRM desktop companion.
// Spawns the bundled Electron sidecar (companion/), registers agent tools, streams the
// agent's replies into the character (speech bubble, thinking/typing poses, lip-sync,
// emotions) and serves the live3D settings tab.
import { defineTool } from '@deepseek-ai/dsh-tools';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readdirSync, existsSync, readFileSync, writeFileSync, mkdirSync, createReadStream, createWriteStream, mkdtempSync, rmSync, statSync, openSync, readSync, closeSync } from 'node:fs';
import { tmpdir, homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const name = 'live3d';
const inject = ['tools'];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMPANION_DIR = path.join(__dirname, '..', 'companion');
const MODELS_DIR = path.join(COMPANION_DIR, 'models');
const DOWNLOADS_DIR = path.join(homedir(), 'Downloads');
const UPLOAD_LIMIT = 1024 * 1024 * 1024;

// ---------------------------------------------------------------- companion process
let companion = null;
let port = 0;
let starting = null;
let failedAt = 0;
process.once('exit', () => { try { companion?.kill(); } catch {} });
// The companion only listens to us: a random token in its environment, sent with every request.
const TOKEN = randomBytes(24).toString('hex');

function electronBinary() {
  // A standalone Electron from the shared runtime folder (setup/install-runtime.ps1 puts it there):
  // the DSH binary itself cannot be used — its single-instance lock makes it exit at once.
  const runtime = process.env.AMADEUS_RUNTIME || 'W:\\amadeus-runtime';
  const cand = process.env.AMADEUS_COMPANION_ELECTRON || path.join(runtime, 'electron', 'electron.exe');
  if (!existsSync(cand)) throw new Error('Не найден Electron (' + cand + '). Установите runtime: amadeus-live3d\\setup\\install-runtime.ps1');
  return cand;
}

function ensureCompanion() {
  if (companion && port > 0) return Promise.resolve();
  if (starting) return starting;
  if (Date.now() - failedAt < 10000) return Promise.reject(new Error('3D-компаньон недоступен, повторю попытку чуть позже.'));
  starting = new Promise((resolve, reject) => {
    const env = { ...process.env, AMADEUS_PARENT_PID: String(process.pid), AMADEUS_TOKEN: TOKEN };
    if (providerKey && !env.LITELLM_API_KEY) env.LITELLM_API_KEY = providerKey;
    delete env.ELECTRON_RUN_AS_NODE;
    const child = spawn(electronBinary(), [COMPANION_DIR], { stdio: ['ignore', 'pipe', 'pipe'], env, windowsHide: true });
    companion = child;
    const fail = (e) => { clearTimeout(timer); failedAt = Date.now(); try { child.kill(); } catch {} reject(e); };
    const timer = setTimeout(() => fail(new Error('3D-компаньон не запустился (таймаут).')), 40000);
    let buf = '';
    const onData = (chunk) => {
      buf = (buf + chunk.toString()).slice(-4096);
      const m = buf.match(/\{"type":"ready","port":(\d+)\}/);
      if (m) { port = Number(m[1]); clearTimeout(timer); child.stdout.off('data', onData); child.stdout.resume(); resolve(); }
    };
    child.stdout.on('data', onData);
    child.stderr.resume();
    child.on('error', fail);
    child.on('exit', () => { if (companion === child) { companion = null; port = 0; } });
  }).catch((e) => { failedAt = Date.now(); throw e; }).finally(() => { starting = null; });
  return starting;
}

async function http(route, body, timeoutMs = 30000, signal = null) {
  await ensureCompanion();
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  if (signal) { if (signal.aborted) ac.abort(); else signal.addEventListener('abort', () => ac.abort(), { once: true }); }
  try {
    const res = await fetch(`http://127.0.0.1:${port}${route}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'x-amadeus-token': TOKEN, ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ac.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (data.ok === false) throw new Error(data.error || 'Ошибка 3D-компаньона.');
    return data;
  } finally { clearTimeout(t); }
}
async function command(cmdName, args) {
  const r = await http('/command', { name: cmdName, args: args || {} });
  const res = r.result;
  if (res && res.ok === false) throw new Error(res.error || 'Команда не выполнена.');
  return res;
}

/** The last shown model comes back after a restart: start the companion only if there is one. */
function savedActiveModel() {
  try { return JSON.parse(readFileSync(path.join(COMPANION_DIR, 'settings.json'), 'utf8')).activeModelId || ''; } catch { return ''; }
}

// ---------------------------------------------------------------- agent speech bridge
// Same stream as amadeus-live2d: phases (connecting/thinking/tool/answer) + streamed text.
// Sessions whose agent is running now: "Алиса, стоп" cancels one of them (the DSH client does the cancel).
const runningSessions = new Map();                       // session id -> last activity (ms)
/** What "Алиса, стоп" cancels: the session she is reading aloud; otherwise her own chat, else the latest active one. */
function stopTargets(voiced) {
  const now = Date.now();
  for (const [id, at] of runningSessions) if (now - at > 30 * 60 * 1000) runningSessions.delete(id);
  if (voiced) return runningSessions.has(voiced) ? [voiced] : [];       // its answer is complete: only her voice stops
  const own = Object.values(readChat().sessions || {}).filter((id) => runningSessions.has(id));
  if (own.length) return own.slice(0, 1);
  const latest = [...runningSessions].sort((a, b) => b[1] - a[1])[0];
  return latest ? [latest[0]] : [];
}
function trackAgentSpeech(ctx) {
  if (typeof ctx.on !== 'function') return;
  const trackers = new Map();
  const sessionOf = (agent) => (agent && agent.session && agent.session.id) || '';
  const forAgent = (agent) => {
    const id = (agent && agent.session && agent.session.id) || (agent && agent.id) || 'default';
    let t = trackers.get(id);
    if (!t) { t = { id, speech: '', phase: 'idle', status: '', lastAt: 0, fresh: true, out: [], sending: false }; trackers.set(id, t); }
    return t;
  };
  const send = (t, final, force, extra) => {
    if (!companion || !port) return;            // only when the 3D companion is running
    const now = Date.now();
    if (!force && !final && now - t.lastAt < 200) return;
    t.lastAt = now;
    post(t, { session: t.id, text: t.speech, final, phase: t.phase, status: t.status, ...extra });
  };
  // One message at a time per session: the end of an answer must never overtake its text. While one is
  // on its way, newer text replaces the unsent older one.
  const post = (t, m) => {
    const last = t.out[t.out.length - 1];
    if (last && last.phase === 'answer' && !last.final && m.phase === 'answer') t.out[t.out.length - 1] = m; else t.out.push(m);
    if (!t.sending) pump(t);
  };
  const pump = async (t) => {
    t.sending = true;
    while (t.out.length) { try { await http('/speak', t.out.shift(), 5000); } catch {} }
    t.sending = false;
  };
  const setPhase = (t, phase, status, final) => {
    if (t.phase === phase && t.status === status) return;
    t.phase = phase; t.status = status;
    send(t, final, true);
  };
  ctx.on('agent/assistant-stream', (payload) => {
    const frame = payload && payload.frame;
    if (!frame) return;
    const t = forAgent(payload && payload.agent);
    const sid = sessionOf(payload && payload.agent);
    if (sid) runningSessions.set(sid, Date.now());
    if (frame.type === 'start') {
      t.speech = '';
      if (t.fresh) {                                     // the first step of a new turn: the previous answer is not read any further
        t.fresh = false; t.phase = 'connecting'; t.status = 'Подключаюсь…';
        send(t, false, true, { turn: true });
      } else setPhase(t, 'connecting', 'Подключаюсь…', false);
      return;
    }
    if (frame.type === 'end') return;
    const chunk = frame.chunk;
    if (!chunk) return;
    switch (chunk.type) {
      case 'reasoning-delta': setPhase(t, 'thinking', 'Думаю…', false); return;
      case 'tool-call-delta': setPhase(t, 'tool', chunk.name || 'Инструмент', false); return;
      case 'text-delta':
        if (typeof chunk.text === 'string') t.speech += chunk.text;
        t.phase = 'answer'; t.status = '';
        send(t, false, false);
        return;
      case 'finish':
        if (t.speech) send(t, true, true);
        t.speech = '';
        return;
    }
  });
  ctx.on('agent/status', (payload) => {
    if (!payload) return;
    const sid = sessionOf(payload.agent);
    if (sid) { if (payload.status === 'idle') runningSessions.delete(sid); else runningSessions.set(sid, Date.now()); }
    if (payload.status !== 'idle') return;
    const t = forAgent(payload.agent);
    t.speech = ''; t.fresh = true;
    if (t.phase === 'answer' || t.phase === 'error') { t.phase = 'idle'; t.status = ''; }
    else setPhase(t, 'idle', '', true);
    if (companion && port) post(t, { session: t.id, phase: 'end', text: '', final: true });   // the turn is over (or was cancelled)
    if (trackers.size > 50) for (const [id, x] of trackers) if (x !== t && x.fresh) { trackers.delete(id); break; }
  });
  ctx.on('agent/error', (payload) => {
    const t = forAgent(payload && payload.agent);
    const error = payload && payload.error;
    setPhase(t, 'error', String((error && error.message) || error || 'Ошибка').slice(0, 240), false);
  });
}

// ---------------------------------------------------------------- helpers
const looseOut = {
  schema: { type: 'object', additionalProperties: true },
  render: (_args, value) => [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }],
};
function sendJson(res, status, obj) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}
function readJson(req) {
  return new Promise((resolve) => {
    let buf = '';
    req.on('data', (c) => { buf += c; });
    req.on('end', () => { try { resolve(buf ? JSON.parse(buf) : {}); } catch { resolve({}); } });
  });
}
/** A zip in Downloads is listed when its central directory names a model or motion file. */
function zipHasMotion(file) {
  let fd;
  try {
    const size = statSync(file).size;
    const len = Math.min(size, 2 * 1024 * 1024);
    const buf = Buffer.alloc(len);
    fd = openSync(file, 'r');
    readSync(fd, buf, 0, len, size - len);
    return /\.(vmd|vrma|vrm|fbx|unitypackage)/i.test(buf.toString('latin1'));
  } catch { return false; } finally { if (fd !== undefined) try { closeSync(fd); } catch {} }
}
function recentFiles() {
  const since = Date.now() - 60 * 24 * 3600 * 1000;
  const known = new Set();
  try {
    for (const e of readdirSync(MODELS_DIR, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      try { const c = JSON.parse(readFileSync(path.join(MODELS_DIR, e.name, 'character.json'), 'utf8')); if (c.source) known.add(String(c.source).toLowerCase()); } catch {}
    }
  } catch {}
  try {
    return readdirSync(DOWNLOADS_DIR, { withFileTypes: true })
      .filter((e) => e.isFile() && (/\.(vrm|vrma|vmd|fbx|glb|unitypackage)$/i.test(e.name) || (/\.zip$/i.test(e.name) && zipHasMotion(path.join(DOWNLOADS_DIR, e.name)))))
      .map((e) => { const st = statSync(path.join(DOWNLOADS_DIR, e.name)); return { name: e.name, size: st.size, mtime: st.mtimeMs }; })
      .filter((f) => f.mtime >= since)
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, 30)
      .map((f) => ({ ...f, kind: /\.zip$/i.test(f.name) ? 'archive' : /\.(vrma|vmd|fbx|unitypackage)$/i.test(f.name) ? 'animation' : 'model', imported: known.has(f.name.toLowerCase()) }));
  } catch { return []; }
}

const GESTURES = ['wave', 'nod', 'shake', 'bow', 'stretch', 'clap', 'thumbs_up', 'salute', 'dance', 'shrug', 'look_around', 'point', 'yawn', 'pose'];
const ACTIONS = ['sleep', 'wake', 'sit', 'stand', 'come', 'jump', 'wave', 'dance', 'stretch', 'nod', 'shake', 'bow', 'look_around'];

// ---------------------------------------------------------------- the agent directs the companion
// A short, stable block in the system prompt tells the agent it has a companion on the desktop and
// what it can do (emotions, gestures, the user's imported clips). The agent then reacts by itself
// through companion_react_3d. The block only changes when the clip catalogue changes, so the host
// does not append a new context snapshot on every step.
const MOODS = ['happy', 'excited', 'love', 'proud', 'relaxed', 'thinking', 'surprised', 'shy', 'scared', 'sad', 'pout', 'angry', 'sleepy', 'dizzy'];
const catalog = { clips: [], at: 0 };
async function refreshCatalog() {
  if (!companion || !port) return;
  try {
    const st = await http('/settings', undefined, 5000);
    const names = [];
    for (const a of st.animations || []) {
      if (!a.role || a.role === 'extra') continue;
      const n = String(a.clip || a.file).replace(/\.(uanim\.json|vrma|vmd|fbx|glb)$/i, '').replace(/^Mew_Pose_Ver\.0 - /, 'pose ');
      if (!names.includes(n)) names.push(n + (a.role === 'pose' || a.role === 'dance' || a.role === 'wave' ? ' (' + a.role + ')' : ''));
    }
    catalog.clips = names.slice(0, 40);
    catalog.at = Date.now();
  } catch {}
}
function companionPrompt() {
  const clips = catalog.clips.length ? '\nImported clips (play by name with clip): ' + catalog.clips.join(', ') + '.' : '';
  return [
    'You have a 3D companion character on the user\'s desktop (the amadeus-live3d plugin). She reads your answers aloud or shows them as captions, and her body shows your feelings.',
    'You are in charge of her: she does nothing on her own between your turns. Direct her with companion_react_3d whenever the conversation has an emotional beat: greet, celebrate a fix, sympathise with a bug, think through a hard question, tease, apologise.',
    'Besides emotions and gestures you can move her with action: sit, stand, come (to the cursor), jump (onto a window), sleep, wake, bubble (shrink into a round portrait in the corner, e.g. while the user plays or watches), bubble_off.',
    'Pick what fits the moment: emotion (' + MOODS.join(', ') + '), optionally a gesture (' + GESTURES.join(', ') + '), a clip, and a short line (under 60 characters, in the user\'s language).',
    'A user message ending with a note like [🎙 голосом через компаньона · на экране: …] was spoken to her by voice; the note is the title and text of the window the user is looking at. Answer such messages briefly and conversationally (it is read aloud), react with companion_react_3d, and use the screen note when it helps.',
    'Usually one call per reply is enough, made together with your other tool calls or right before answering. Do not mention these calls in the answer and do not use them for purely technical steps.' + clips,
  ].join('\n');
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
// A DSH Workspace named after the plugin (a folder "live3D" next to the default workspace) with one
// chat per character, titled with the character's name. Voice phrases ("Алиса, …") go there.
const CHAT_FILE = path.join(COMPANION_DIR, 'chat.json');
const clientLog = [];
function companionChatDir() {
  let base = path.join(homedir(), 'Documents', 'deepseek-harness');
  try {
    const reg = JSON.parse(readFileSync(path.join(homedir(), '.dsh', 'storages', 'workspace.json'), 'utf8'));
    const def = reg.tables.workspaces[reg.global.defaultWorkspaceId];
    if (def && def.path) base = path.dirname(def.path);
  } catch {}
  const dir = path.join(base, 'live3D');
  try { mkdirSync(dir, { recursive: true }); } catch {}
  return dir;
}
function readChat() { try { return JSON.parse(readFileSync(CHAT_FILE, 'utf8')); } catch { return { sessions: {} }; } }

function apply(ctx) {
  if (savedActiveModel()) ensureCompanion().catch(() => {});
  watchProviderKey(ctx);
  trackAgentSpeech(ctx);
  const timers = [setInterval(refreshCatalog, 60000), setTimeout(refreshCatalog, 8000)];
  if (typeof ctx.on === 'function') ctx.on('dispose', () => { for (const x of timers) clearTimeout(x); });
  if (typeof ctx.on === 'function') {
    ctx.on('system-prompt/assemble', async (assembly, _hostCtx, next) => {
      try {
        if (companion && port && assembly && Array.isArray(assembly.contexts)) {
          assembly.contexts.push({ name: 'amadeus-live3d:companion', text: companionPrompt().replace(/\{\{/g, '{ {') });
        }
      } catch {}
      return next();
    });
  }
  ctx.tools.register(defineTool({
    name: 'companion_react_3d',
    description: 'Make the 3D desktop companion react to the conversation: show an emotion with her whole body, play a gesture or one of the user\'s imported clips (dances, poses), and say a short line in a bubble/caption (spoken if her voice is on). Use it on emotional beats of the conversation, about once per reply.',
    parameters: {
      emotion: { type: 'string', description: 'One of: ' + MOODS.join(', ') + '.' },
      gesture: { type: 'string', description: 'Optional gesture: ' + GESTURES.join(', ') + '.' },
      clip: { type: 'string', description: 'Optional imported clip to play, by (part of) its name, e.g. a dance or a pose.' },
      say: { type: 'string', description: 'Optional short line (under 60 characters) she says, in the user\'s language.' },
      action: { type: 'string', description: 'Optional: sit, stand, come, jump, sleep, wake, bubble, bubble_off.' },
      seconds: { type: 'number', description: 'How long the emotion lasts (default 8).' },
    },
    output: looseOut,
    async execute(args) { return command('react', { emotion: args.emotion, gesture: args.gesture, clip: args.clip, say: args.say, action: args.action, seconds: args.seconds }); },
  }));

  ctx.tools.register(defineTool({
    name: 'list_3d_models',
    description: 'List the 3D (VRM) companion characters available on this computer.',
    parameters: {},
    output: looseOut,
    async execute() { const r = await http('/list'); return { active: r.active, models: r.models.map((m) => ({ id: m.id, name: m.name, author: m.author })) }; },
  }));
  ctx.tools.register(defineTool({
    name: 'load_3d_model',
    description: 'Show a 3D VRM companion on the desktop: by id (from list_3d_models) or by a path to a .vrm/.glb file (it is imported first).',
    parameters: {
      id: { type: 'string', description: 'Model id from list_3d_models.' },
      path: { type: 'string', description: 'Absolute path to a .vrm / .glb file.' },
    },
    output: looseOut,
    async execute(args) {
      if (args.id) return http('/select', { id: args.id }, 90000);
      if (args.path) return http('/load_model', { path: args.path }, 90000);
      throw new Error('Укажите id или path.');
    },
  }));
  ctx.tools.register(defineTool({
    name: 'companion_action_3d',
    description: 'Make the 3D desktop companion do something: ' + ACTIONS.join(', ') + '. "come" walks to the mouse cursor, "jump" climbs onto a window.',
    parameters: { action: { type: 'string', required: true, description: 'One of: ' + ACTIONS.join(', ') } },
    output: looseOut,
    async execute(args) { return command('action', { action: args.action }); },
  }));
  ctx.tools.register(defineTool({
    name: 'gesture_3d',
    description: 'Play a gesture on the 3D companion: ' + GESTURES.join(', ') + ' (or any imported animation role).',
    parameters: { name: { type: 'string', required: true, description: 'Gesture name.' } },
    output: looseOut,
    async execute(args) { return command('gesture', { name: args.name }); },
  }));
  ctx.tools.register(defineTool({
    name: 'set_emotion_3d',
    description: 'Show an emotion on the 3D companion: face, posture, arms and gaze. Pass one named emotion with weight 1, e.g. {"shy":1}, or a face mix of the presets, e.g. {"happy":0.8,"surprised":0.3}. Emotions: happy, excited, love, proud, relaxed, thinking, surprised, shy, scared, sad, pout (sulky, arms crossed), angry, sleepy. Weights below 0.5 change only the face.',
    parameters: {
      emotions: { type: 'object', required: true, additionalProperties: true, description: 'Map of emotion -> weight 0..1, e.g. {"shy":1} or {"happy":0.8}.' },
      seconds: { type: 'number', description: 'How long to hold it (default 8).' },
    },
    output: looseOut,
    async execute(args) { return command('set_emotion', { emotions: args.emotions, seconds: args.seconds }); },
  }));
  ctx.tools.register(defineTool({
    name: 'set_expression_3d',
    description: 'Set one named expression of the 3D companion (see list_expressions_3d).',
    parameters: { name: { type: 'string', required: true, description: 'Expression name.' } },
    output: looseOut,
    async execute(args) { return command('set_expression', { name: args.name }); },
  }));
  ctx.tools.register(defineTool({
    name: 'list_expressions_3d',
    description: 'List the expressions of the current 3D companion model.',
    parameters: {},
    output: looseOut,
    async execute() { return command('list_expressions'); },
  }));
  ctx.tools.register(defineTool({
    name: 'companion_status_3d',
    description: 'What the 3D companion is doing now (state, sleeping, energy, mood, where it stands).',
    parameters: {},
    output: looseOut,
    async execute() { return command('status'); },
  }));
  ctx.tools.register(defineTool({
    name: 'sleep_3d',
    description: 'Put the 3D companion to sleep (on=true) or wake it up (on=false).',
    parameters: { on: { type: 'boolean', required: true, description: 'true = sleep, false = wake.' } },
    output: looseOut,
    async execute(args) { return command('sleep', { on: args.on }); },
  }));
  ctx.tools.register(defineTool({
    name: 'talk_3d',
    description: 'Lip-sync the 3D companion to a text (on=true) or stop (on=false).',
    parameters: { on: { type: 'boolean', required: true, description: 'Start or stop.' }, text: { type: 'string', description: 'Text to mouth.' } },
    output: looseOut,
    async execute(args) { return command('talk', { on: args.on, text: args.text }); },
  }));
  ctx.tools.register(defineTool({
    name: 'set_pose_3d',
    description: 'Override one humanoid bone rotation (radians) of the 3D companion; reset_pose_3d clears overrides.',
    parameters: {
      bone: { type: 'string', required: true, description: 'Humanoid bone, e.g. rightUpperArm, head.' },
      x: { type: 'number', description: 'X rotation, radians (default 0).' },
      y: { type: 'number', description: 'Y rotation, radians (default 0).' },
      z: { type: 'number', description: 'Z rotation, radians (default 0).' },
    },
    output: looseOut,
    async execute(args) { return command('set_pose', args); },
  }));
  ctx.tools.register(defineTool({
    name: 'reset_pose_3d',
    description: 'Clear manual bone overrides of the 3D companion.',
    parameters: {},
    output: looseOut,
    async execute() { return command('reset_pose'); },
  }));

  // ---- settings tab routes
  ctx.inject(['webServer'], (hostCtx) => {
    const webServer = hostCtx.webServer;
    if (!webServer || typeof webServer.register !== 'function') return;
    // Another site open in the browser must not reach these routes: its requests are marked cross-site,
    // and it cannot send JSON without a preflight that nobody answers.
    const foreign = (req) => String(req.headers['sec-fetch-site'] || '') === 'cross-site';
    const route = (p, method, handler) => webServer.register({
      kind: 'exact', path: p,
      handler: async (req, res) => {
        if (method !== 'ANY' && req.method !== method) { res.writeHead(405, { allow: method }); res.end(); return; }
        if (foreign(req) || (req.method === 'POST' && !/^application\/json\b/i.test(String(req.headers['content-type'] || '')))) { req.resume(); sendJson(res, 403, { ok: false, error: 'forbidden' }); return; }
        try { const out = await handler(req.method === 'POST' ? await readJson(req) : null, req, res); if (!res.destroyed) sendJson(res, 200, out); }
        catch (e) { sendJson(res, 200, { ok: false, error: e.message }); }
      },
    });
    const IMPORT_TIMEOUT = 10 * 60 * 1000;
    route('/amadeus-live3d/list', 'GET', async () => {
      const r = await http('/list');
      return { ok: true, active: r.active, models: r.models };
    });
    route('/amadeus-live3d/active', 'GET', async () => ({ active: companion && port ? (await http('/active')).active : savedActiveModel() }));
    route('/amadeus-live3d/select', 'POST', (b) => http('/select', { id: b.id }, 90000));
    route('/amadeus-live3d/remove', 'POST', (b) => http('/remove', { id: b.id }));
    route('/amadeus-live3d/settings', 'ANY', (b) => (b ? http('/settings', b) : http('/settings')));
    route('/amadeus-live3d/command', 'POST', async (b) => ({ ok: true, result: await command(b.name, b.args) }));
    route('/amadeus-live3d/import-dialog', 'POST', (b) => http('/import_dialog', { kind: b.kind === 'animation' ? 'animation' : 'model' }, IMPORT_TIMEOUT));
    route('/amadeus-live3d/downloads', 'GET', () => ({ dir: DOWNLOADS_DIR, files: recentFiles() }));
    route('/amadeus-live3d/import-downloads', 'POST', (b) => {
      const n = path.basename(String(b.name || ''));
      const file = path.join(DOWNLOADS_DIR, n);
      if (!/\.(vrm|vrma|vmd|fbx|glb|unitypackage|anim|zip|rar|7z)$/i.test(n) || !existsSync(file)) throw new Error('Файл не найден в папке «Загрузки».');
      return http('/import', { paths: [file] }, IMPORT_TIMEOUT);
    });
    route('/amadeus-live3d/animations/assign', 'POST', (b) => http('/animations/assign', b));
    // voice like live2D: recognised speech for the DSH message box, Whisper, Kokoro voices
    route('/amadeus-live3d/client-log', 'ANY', async (b) => { if (b && b.msg) { clientLog.push(new Date().toISOString().slice(11, 19) + ' ' + String(b.msg).slice(0, 600)); if (clientLog.length > 40) clientLog.shift(); } return { ok: true, log: clientLog }; });
    route('/amadeus-live3d/companion-chat', 'ANY', async (b) => {
      const st = readChat();
      if (b && typeof b === 'object') {                       // remember the Workspace / a character's chat
        if (typeof b.workspaceId === 'string') st.workspaceId = b.workspaceId;
        if (typeof b.modelId === 'string') { st.sessions = st.sessions || {}; if (typeof b.sessionId === 'string' && b.sessionId) st.sessions[b.modelId] = b.sessionId; else delete st.sessions[b.modelId]; }
        writeFileSync(CHAT_FILE, JSON.stringify(st, null, 2));
        return { ok: true };
      }
      let model = null;
      try { const r = await http('/list', undefined, 5000); const m = (r.models || []).find((x) => x.id === r.active); if (m) model = { id: m.id, name: m.name || m.id }; } catch {}
      if (!model && savedActiveModel()) model = { id: savedActiveModel(), name: savedActiveModel() };
      return { ok: true, path: companionChatDir(), workspaceId: st.workspaceId || '', sessions: st.sessions || {}, model };
    });
    // long poll: the companion answers as soon as a phrase is recognised (or empty after ~15 s)
    route('/amadeus-live3d/chat-message', 'GET', async (_b, req, res) => {
      const wait = /[?&]wait=1/.test(String(req && req.url || '')) ? 15000 : 0;
      if (!port) { if (wait) await new Promise((r) => setTimeout(r, 1500)); return { ok: true, text: '' }; }
      // the page was closed or reloaded: stop waiting, or the next phrase would go to nobody
      const gone = new AbortController();
      res.on('close', () => { if (!res.writableEnded) gone.abort(); });
      const r = await http('/chat-message' + (wait ? '?wait=' + wait : ''), undefined, wait + 5000, gone.signal).catch(() => ({ ok: true, text: '' }));
      if (res.destroyed && (r.text || r.stop)) { http('/chat-requeue', r, 5000).catch(() => {}); return r; }
      if (r && r.stop) r.sessions = stopTargets(r.session);          // "Алиса, стоп": what to cancel
      return r;
    });
    route('/amadeus-live3d/transcribe', 'POST', (b) => http('/transcribe', b, 90000));
    route('/amadeus-live3d/voice-import', 'POST', (b) => http('/voice-import', b, 60000));
    route('/amadeus-live3d/voices', 'GET', () => http('/voices'));
    webServer.register({
      kind: 'exact', path: '/amadeus-live3d/import-upload',
      handler: async (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405, { allow: 'POST' }); res.end(); return; }
        if (foreign(req)) { req.resume(); sendJson(res, 403, { ok: false, error: 'forbidden' }); return; }
        const n = path.basename(String(new URL(req.url, 'http://x').searchParams.get('name') || ''));
        if (!/\.(vrm|vrma|vmd|fbx|glb|unitypackage|anim|zip|rar|7z)$/i.test(n)) { req.resume(); sendJson(res, 200, { ok: false, error: 'Перетащите .vrm (модель), анимацию .vrma / .vmd / .fbx или архив с ними.' }); return; }
        const dir = mkdtempSync(path.join(tmpdir(), 'amadeus3d-upload-'));
        const file = path.join(dir, n);
        try {
          await new Promise((resolve, reject) => {
            let size = 0;
            const out = createWriteStream(file);
            req.on('data', (c) => { size += c.length; if (size > UPLOAD_LIMIT) { req.destroy(); out.destroy(); reject(new Error('Файл больше 1 ГБ.')); } });
            req.pipe(out);
            out.on('finish', resolve); out.on('error', reject); req.on('error', reject);
          });
          sendJson(res, 200, await http('/import', { paths: [file] }, IMPORT_TIMEOUT));
        } catch (e) { sendJson(res, 200, { ok: false, error: e.message }); }
        finally { rmSync(dir, { recursive: true, force: true }); }
      },
    });
    webServer.register({
      kind: 'prefix', path: '/amadeus-live3d/preview',
      handler: (req, res) => {
        const id = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/amadeus-live3d\/preview\/?/, '');
        const file = path.join(MODELS_DIR, id, 'preview.png');
        if (!/^(?!\.+$)[A-Za-z0-9._-]+$/.test(id) || !existsSync(file)) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'no-cache' });
        createReadStream(file).pipe(res);
      },
    });
  });
}

export { apply, inject, name };
