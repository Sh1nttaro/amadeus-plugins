// amadeus-live3d — DSH plugin: 3D VRM/glTF desktop companion character.
// Spawns the bundled Electron sidecar (companion/) and registers agent tools that
// drive it over a local HTTP control server.
import { defineTool } from '@deepseek-ai/dsh-tools';
import { spawn } from 'node:child_process';
import { readdirSync, existsSync, rmSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const name = 'live3d';
const inject = ['tools'];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COMPANION_DIR = path.join(__dirname, '..', 'companion');

// ---- companion process management ----
let state = { child: null, port: null, ready: null, starting: null };

function electronBinary() {
  const cand = process.env.AMADEUS_COMPANION_ELECTRON || 'W:\\amadeus-v2\\electron\\electron.exe';
  return (cand && existsSync(cand)) ? cand : process.execPath;
}

function startCompanion() {
  if (state.ready) return state.ready;
  if (state.starting) return state.starting;
  state.starting = new Promise((resolve, reject) => {
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE; // must DELETE (empty string still triggers Node mode)
    const child = spawn(electronBinary(), [COMPANION_DIR], { stdio: ['ignore', 'pipe', 'pipe'], env });
    state.child = child;
    let buf = '';
    const to = setTimeout(() => reject(new Error('live3d companion start timeout')), 40000);
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (d) => {
      buf += d;
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        try {
          const m = JSON.parse(line);
          if (m.type === 'ready' && m.port) {
            clearTimeout(to);
            state.port = m.port;
            state.ready = Promise.resolve(m.port);
            state.starting = null;
            resolve(m.port);
          }
        } catch {}
      }
    });
    child.stderr.on('data', (d) => process.stderr.write('[live3d] ' + d));
    child.on('exit', () => {
      state = { child: null, port: null, ready: null, starting: null };
    });
  });
  return state.starting;
}

function post(route, body) {
  return startCompanion().then((port) => new Promise((resolve, reject) => {
    const data = JSON.stringify(body || {});
    const req = http.request({
      host: '127.0.0.1', port, path: route, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch { reject(new Error('live3d: bad companion response')); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  }));
}

// send a renderer command, unwrap to {ok:true,result} or throw
async function command(name_, args_) {
  const r = await post('/command', { name: name_, args: args_ || {} });
  if (r && r.ok) return r.result;
  throw new Error((r && r.error) || ('live3d command failed: ' + name_));
}

const looseOut = {
  schema: { type: 'object', additionalProperties: true },
  render: (_args, value) => [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }],
};

const GESTURES = ['wave', 'nod', 'shake', 'point', 'bow', 'stretch', 'clap', 'thumbs_up', 'salute', 'dance', 'shrug', 'look_around'];

const MODELS_DIR = path.join(COMPANION_DIR, 'models');
const MODEL_EXTS = new Set(['.vrm', '.glb', '.gltf', '.fbx', '.obj']);
let active3dId = '';

function list3dModels() {
  const models = [];
  if (!existsSync(MODELS_DIR)) return models;
  for (const d of readdirSync(MODELS_DIR, { withFileTypes: true })) {
    if (!d.isDirectory()) continue;
    const dir = path.join(MODELS_DIR, d.name);
    let file = null;
    try {
      for (const f of readdirSync(dir)) {
        if (MODEL_EXTS.has(path.extname(f).toLowerCase())) { file = f; break; }
      }
    } catch {}
    models.push({ id: d.name, name: d.name, description: '3D модель', motions: 0, expressions: 0, actions: { motions: [], expressions: [] }, preview: '', file });
  }
  return models;
}

function sendJson(res, status, obj) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' });
  res.end(JSON.stringify(obj));
}

function readJson(req) {
  return new Promise((resolve) => {
    let buf = '';
    req.on('data', (c) => { buf += c; });
    req.on('end', () => { try { resolve(buf ? JSON.parse(buf) : {}); } catch { resolve({}); } });
  });
}

function apply(ctx) {
  // warm the companion (lazy; tools await it on first use)
  startCompanion().catch(() => {});

  ctx.tools.register(defineTool({
    name: 'load_3d_model',
    description: 'Load a 3D model (VRM/GLB/GLTF/FBX/OBJ) by absolute file path into the floating desktop character window. VRM 1.0 and glTF humanoid rigs expose their bones for set_pose_3d.',
    parameters: {
      path: { type: 'string', required: true, description: 'Absolute path to the .vrm/.glb/.gltf/.fbx/.obj file.' },
    },
    output: looseOut,
    async execute(args) {
      const r = await post('/load_model', { path: args.path });
      if (r && r.ok) return r.result;
      throw new Error((r && r.error) || 'load_3d_model failed');
    },
  }));

  ctx.tools.register(defineTool({
    name: 'list_bones_3d',
    description: 'List the bone names of the currently loaded 3D model (usable with set_pose_3d).',
    parameters: {},
    output: looseOut,
    execute: () => command('list_bones', {}),
  }));

  ctx.tools.register(defineTool({
    name: 'set_pose_3d',
    description: 'Rotate a bone of the 3D character (in radians, relative to its bind pose). Use list_bones_3d to get valid bone names.',
    parameters: {
      bone: { type: 'string', required: true, description: 'Bone name (e.g. J_Bip_R_UpperArm, upper_armR, head).' },
      x: { type: 'number', description: 'X rotation radians (default 0).' },
      y: { type: 'number', description: 'Y rotation radians (default 0).' },
      z: { type: 'number', description: 'Z rotation radians (default 0).' },
    },
    output: looseOut,
    execute: (args) => command('set_bone', { bone: args.bone, x: args.x || 0, y: args.y || 0, z: args.z || 0 }),
  }));

  ctx.tools.register(defineTool({
    name: 'reset_pose_3d',
    description: 'Reset the 3D character to its natural bind pose (clears any manual bone rotations and gestures).',
    parameters: {},
    output: looseOut,
    execute: () => command('reset_pose', {}),
  }));

  ctx.tools.register(defineTool({
    name: 'gesture_3d',
    description: 'Play a one-shot gesture on the 3D character. One of: ' + GESTURES.join(', ') + '.',
    parameters: {
      gesture: { type: 'string', required: true, description: 'Gesture name (' + GESTURES.join('/') + ').' },
    },
    output: looseOut,
    execute: (args) => command('gesture', { gesture: args.gesture }),
  }));

  ctx.tools.register(defineTool({
    name: 'set_emotion_3d',
    description: 'Blend continuous emotion weights on the 3D face/body. Keys are expression names from list_expressions_3d (e.g. happy, sad, angry, surprised); values 0..1. The dominant emotion may auto-trigger a matching gesture.',
    parameters: {
      emotions: { type: 'object', required: true, additionalProperties: true, description: 'Map of expression name -> weight (0..1), e.g. {"happy":0.8,"surprised":0.4}.' },
    },
    output: looseOut,
    execute: (args) => command('set_emotion', { emotions: args.emotions || {} }),
  }));

  ctx.tools.register(defineTool({
    name: 'set_expression_3d',
    description: 'Set a single expression (morph) on the 3D character face. Use list_expressions_3d for valid names.',
    parameters: {
      name: { type: 'string', required: true, description: 'Expression name (e.g. happy, sad, surprised, blink).' },
    },
    output: looseOut,
    execute: (args) => command('set_expression', { name: args.name }),
  }));

  ctx.tools.register(defineTool({
    name: 'list_expressions_3d',
    description: 'List the expression/morph names available on the loaded 3D model (for set_expression_3d / set_emotion_3d).',
    parameters: {},
    output: looseOut,
    execute: () => command('list_expressions', {}),
  }));

  ctx.tools.register(defineTool({
    name: 'sleep_3d',
    description: 'Put the 3D character to sleep (arms down, eyes closed) or wake it. It auto-sleeps after ~8s idle and auto-wakes on interaction.',
    parameters: {
      on: { type: 'boolean', required: true, description: 'true to sleep, false to wake.' },
    },
    output: looseOut,
    execute: (args) => command('sleep', { on: args.on !== false }),
  }));

  ctx.tools.register(defineTool({
    name: 'talk_3d',
    description: 'Toggle talking state on the 3D character (drives viseme lip-sync + head motion). Pass text for the phoneme sequence.',
    parameters: {
      on: { type: 'boolean', required: true, description: 'true to start talking, false to stop.' },
      text: { type: 'string', description: 'Optional utterance text for phoneme lip-sync.' },
    },
    output: looseOut,
    execute: (args) => command('talk', { on: args.on !== false, text: typeof args.text === 'string' ? args.text : '' }),
  }));

  // Same-origin HTTP routes for the Settings UI (client half).
  ctx.inject(['webServer'], (hostCtx) => {
    const webServer = hostCtx.webServer;
    if (!webServer || typeof webServer.register !== 'function') return;

    webServer.register({
      kind: 'exact',
      path: '/amadeus-live3d/list',
      handler: (req, res) => {
        if (req.method !== 'GET') { res.writeHead(405, { allow: 'GET' }); res.end(); return; }
        sendJson(res, 200, { models: list3dModels() });
      },
    });

    webServer.register({
      kind: 'exact',
      path: '/amadeus-live3d/active',
      handler: (req, res) => {
        if (req.method !== 'GET') { res.writeHead(405, { allow: 'GET' }); res.end(); return; }
        sendJson(res, 200, { active: active3dId });
      },
    });

    webServer.register({
      kind: 'exact',
      path: '/amadeus-live3d/select',
      handler: async (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405, { allow: 'POST' }); res.end(); return; }
        const body = await readJson(req);
        try {
          const m = list3dModels().find((x) => x.id === body.id);
          if (!m || !m.file) { sendJson(res, 200, { ok: false, error: 'Модель не найдена.' }); return; }
          const r = await post('/load_model', { path: path.join(MODELS_DIR, m.id, m.file) });
          if (r && r.ok) { active3dId = m.id; sendJson(res, 200, { ok: true, id: m.id }); }
          else sendJson(res, 200, { ok: false, error: (r && r.error) || 'Ошибка загрузки 3D модели.' });
        } catch (e) { sendJson(res, 500, { ok: false, error: e.message }); }
      },
    });

    webServer.register({
      kind: 'exact',
      path: '/amadeus-live3d/remove',
      handler: async (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405, { allow: 'POST' }); res.end(); return; }
        const body = await readJson(req);
        try {
          const target = path.join(MODELS_DIR, String(body.id || ''));
          if (!target.startsWith(MODELS_DIR + path.sep)) { sendJson(res, 400, { ok: false, error: 'Некорректный id.' }); return; }
          rmSync(target, { recursive: true, force: true });
          if (active3dId === body.id) active3dId = '';
          sendJson(res, 200, { ok: true });
        } catch (e) { sendJson(res, 500, { ok: false, error: e.message }); }
      },
    });

    webServer.register({
      kind: 'exact',
      path: '/amadeus-live3d/load',
      handler: async (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405, { allow: 'POST' }); res.end(); return; }
        const body = await readJson(req);
        try {
          const target = body.path
            ? body.path
            : (body.id ? (() => { const m = list3dModels().find((x) => x.id === body.id); return m && m.file ? path.join(MODELS_DIR, m.id, m.file) : null; })() : null);
          if (!target) { sendJson(res, 400, { ok: false, error: 'Укажите path или id модели.' }); return; }
          const r = await post('/load_model', { path: target });
          sendJson(res, 200, r && r.ok ? r : { ok: false, error: (r && r.error) || 'Ошибка загрузки 3D модели.' });
        } catch (e) { sendJson(res, 500, { ok: false, error: e.message }); }
      },
    });

    webServer.register({
      kind: 'exact',
      path: '/amadeus-live3d/command',
      handler: async (req, res) => {
        if (req.method !== 'POST') { res.writeHead(405, { allow: 'POST' }); res.end(); return; }
        const body = await readJson(req);
        try { sendJson(res, 200, await post('/command', { name: body.name, args: body.args || {} })); }
        catch (e) { sendJson(res, 500, { ok: false, error: e.message }); }
      },
    });
  });
}

export { apply, inject, name };
