// amadeus-live3d companion — standalone Electron sidecar hosting the 3D VRM/glTF
// character window. The DeepSeek Harness plugin spawns this app, reads the control
// port from stdout, then drives it over HTTP (robust; Electron main does not reliably
// receive stdin).
//   stdout:  { "type": "ready", "port": <N> }
//   POST /command      { name, args }            -> { ok, result } | { ok:false, error }
//   POST /load_model   { path }                  -> { ok, result } | { ok:false, error }
//   POST /wait_ready   { timeoutMs }             -> { ok, result } | { ok:false, error }
//   GET  /ping                                   -> { ok:true, pong:true }
//   POST /shutdown                               -> { ok:true }
'use strict';

const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');

const RENDERER_DIR = path.join(__dirname, 'renderer');
const MODELS_DIR = path.join(__dirname, 'models');
const SCHEME = 'amadeus-3d';

// must be called before app is ready (synchronous, top-level)
protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true, bypassCSP: true } },
]);

let win = null;
const pending = new Map(); // commandId -> { resolve, reject, t }

function modelFileResponse(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mime = {
      '.vrm': 'model/vrm',
      '.glb': 'model/gltf-binary',
      '.gltf': 'model/gltf+json',
      '.obj': 'text/plain',
      '.fbx': 'application/octet-stream',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.bin': 'application/octet-stream',
    }[ext] || 'application/octet-stream';
    return new Response(data, {
      headers: { 'Content-Type': mime, 'Access-Control-Allow-Origin': '*' },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}

function sendCommand(command, timeoutMs) {
  return new Promise((resolve, reject) => {
    if (!win || win.isDestroyed()) return reject(new Error('3D window is not running'));
    const id = randomUUID();
    const t = setTimeout(() => { pending.delete(id); reject(new Error('command timeout')); }, timeoutMs);
    pending.set(id, { resolve, reject, t });
    win.webContents.send('link:command', id, command);
  });
}

function waitReady(timeoutMs) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    (function poll() {
      if (!win || win.isDestroyed()) return reject(new Error('3D window is not running'));
      win.webContents.executeJavaScript('!!(window.__amadeus3d && window.amadeus && typeof window.amadeus.answer === "function")', true)
        .then((ok) => {
          if (ok) return resolve(true);
          if (Date.now() - started > timeoutMs) return reject(new Error('3D window not loaded in time'));
          setTimeout(poll, 200);
        })
        .catch(() => {
          if (Date.now() - started > timeoutMs) return reject(new Error('3D window not loaded in time'));
          setTimeout(poll, 200);
        });
    })();
  });
}

function loadModel(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!['.vrm', '.glb', '.gltf', '.obj', '.fbx'].includes(ext)) {
    return Promise.reject(new Error('Unsupported 3D format: ' + ext + ' (vrm/glb/gltf/obj/fbx)'));
  }
  const name = path.basename(filePath, ext).replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'model';
  const targetDir = path.join(MODELS_DIR, name);
  fs.mkdirSync(targetDir, { recursive: true });
  const srcDir = path.dirname(filePath);
  let siblings = [];
  try { siblings = fs.readdirSync(srcDir); } catch {}
  let mainFile = path.basename(filePath);
  for (const s of siblings) {
    if (s.startsWith('.')) continue;
    const src = path.join(srcDir, s);
    if (!fs.statSync(src).isFile()) continue;
    if (s.toLowerCase() === mainFile.toLowerCase()) mainFile = s;
    fs.copyFileSync(src, path.join(targetDir, s));
  }
  const url = SCHEME + '://' + name + '/' + encodeURIComponent(mainFile);
  return sendCommand({ name: 'load_model', args: { url } }, 30000);
}

function createWindow() {
  win = new BrowserWindow({
    width: 480,
    height: 640,
    transparent: true,
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    focusable: false,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.setIgnoreMouseEvents(true, { forward: true });
  win.webContents.on('console-message', (_e, level, message) => {
    process.stderr.write('[3d:' + level + '] ' + message + '\n');
  });
  win.loadFile(path.join(RENDERER_DIR, '3d.html'));
  win.once('ready-to-show', () => { if (win && !win.isDestroyed()) win.showInactive(); });
  return win;
}

ipcMain.on('link:answer', (_e, id, result) => {
  const p = pending.get(id);
  if (p) { clearTimeout(p.t); pending.delete(id); p.resolve(result); }
});

// --- HTTP control server ---
function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}
function readBody(req) {
  return new Promise((resolve) => {
    let d = '';
    req.on('data', (c) => { d += c; });
    req.on('end', () => { try { resolve(JSON.parse(d || '{}')); } catch { resolve({}); } });
  });
}

const server = http.createServer(async (req, res) => {
  const route = req.url.split('?')[0];
  const body = await readBody(req);
  if (req.method === 'POST' && route === '/command') {
    try { const result = await sendCommand({ name: body.name, args: body.args || {} }, 15000); json(res, 200, { ok: true, result }); }
    catch (e) { json(res, 200, { ok: false, error: String((e && e.message) || e) }); }
  } else if (req.method === 'POST' && route === '/load_model') {
    try { const result = await loadModel(body.path); json(res, 200, { ok: true, result }); }
    catch (e) { json(res, 200, { ok: false, error: String((e && e.message) || e) }); }
  } else if (req.method === 'POST' && route === '/wait_ready') {
    try { const result = await waitReady(body.timeoutMs || 20000); json(res, 200, { ok: true, result }); }
    catch (e) { json(res, 200, { ok: false, error: String((e && e.message) || e) }); }
  } else if (req.method === 'GET' && route === '/ping') {
    json(res, 200, { ok: true, pong: true });
  } else if (req.method === 'POST' && route === '/shutdown') {
    json(res, 200, { ok: true });
    setTimeout(() => app.quit(), 150);
  } else {
    json(res, 404, { ok: false, error: 'not found: ' + req.method + ' ' + route });
  }
});

app.whenReady().then(() => {
  protocol.handle(SCHEME, (req) => {
    try {
      const u = new URL(req.url);
      const name = u.hostname;
      const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '');
      const base = path.join(MODELS_DIR, name);
      const file = path.join(base, path.normalize(rel));
      if (!file.startsWith(base + path.sep) && file !== base) return new Response('Forbidden', { status: 403 });
      return modelFileResponse(file);
    } catch {
      return new Response('Bad request', { status: 400 });
    }
  });
  createWindow();
  server.listen(0, '127.0.0.1', () => {
    const port = server.address().port;
    process.stdout.write(JSON.stringify({ type: 'ready', port }) + '\n');
  });
});
