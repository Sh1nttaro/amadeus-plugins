// amadeus-live2d companion — standalone Electron sidecar hosting the Live2D character
// window (plus speech-bubble + right-click menu). The DeepSeek Harness plugin spawns this
// app, reads the control port from stdout, then drives it over HTTP.
//   stdout:  { "type": "ready", "port": <N> }
//   POST /command      { name, args }   -> { ok, result } | { ok:false, error }
//   POST /load_model   { id }           -> { ok, result } | { ok:false, error }
//   GET  /list_models                   -> { ok, models:[...] }
//   POST /speak        { session, text, phase, final, turn } -> { ok }
//   POST /wait_ready   { timeoutMs }    -> { ok, result }
//   GET  /ping                          -> { ok:true, pong:true }
//   POST /shutdown                      -> { ok:true }
// Every request carries the token of the plugin that started us (AMADEUS_TOKEN), see allowed().
'use strict';

const { app, BrowserWindow, ipcMain, protocol, screen, dialog } = require('electron');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { randomUUID, randomBytes, timingSafeEqual } = require('crypto');
const { pathToFileURL } = require('url');
const { spawn } = require('child_process');
const importer = require('./importer');
const { Speech } = require('./speech-text');

const RENDERER_DIR = path.join(__dirname, 'renderer');
const MODELS_DIR = path.join(__dirname, 'models');
const PRELOAD = path.join(__dirname, 'preload', 'index.js');
const SCHEME = 'amadeus-model';
const MODEL_ID = /^(?!\.+$)[A-Za-z0-9._-]+$/;                 // not "." / "..": those are the folder itself and its parent
const LIVE2D_BUBBLE_SIZE = { width: 330, height: 300 };
// How far the bubble reaches into the character window (the figure is narrower than its window).
const LIVE2D_BUBBLE_OVERLAP = 0.2;
const LIVE2D_ORB_SIZE = { width: 200, height: 200 };
let lastBubblePhase = '';

// must be called before app is ready (synchronous, top-level)
protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true, bypassCSP: true } },
]);
// Rendering: the GPU, and the software renderer (SwiftShader: works everywhere, but costs two CPU cores)
// when the GPU has let us down twice. AMADEUS_LIVE2D_SWIFTSHADER=1 forces software, =0 forces the GPU.
const GPU_FILE = path.join(__dirname, 'gpu.json');
const GPU_RETRY_MS = 7 * 24 * 3600 * 1000;                        // a driver update may have helped: one more try a week
const EXIT_SOFTWARE = 75;                                        // tells the plugin: start me again, now in software
function readGpu() {
  try { const g = JSON.parse(fs.readFileSync(GPU_FILE, 'utf8')); return { fails: Number(g.fails) || 0, at: Number(g.at) || 0, loading: g.loading === true }; } catch { return { fails: 0, at: 0, loading: false }; }
}
function writeGpu(g) { try { fs.writeFileSync(GPU_FILE, JSON.stringify(g)); } catch {} }
/** The software renderer is needed: asked for, or two failures on the GPU lately. */
function wantSoftware(env, g, now) {
  if (env === '1') return true;
  if (env === '0') return false;
  return g.fails >= 2 && now - g.at < GPU_RETRY_MS;
}
let gpu = readGpu();
if (gpu.loading) { gpu = { fails: gpu.fails + 1, at: Date.now(), loading: false }; writeGpu(gpu); }   // the last start died while a model was loading
const software = wantSoftware(process.env.AMADEUS_LIVE2D_SWIFTSHADER, gpu, Date.now());
if (software) {
  app.commandLine.appendSwitch('enable-unsafe-swiftshader');
  app.disableHardwareAcceleration();
} else {
  app.commandLine.appendSwitch('ignore-gpu-blocklist');
}
function gpuLoading(on, ok) {
  if (software || (gpu.loading === on && !ok)) return;
  gpu = ok ? { fails: 0, at: 0, loading: false } : { ...gpu, loading: on };
  writeGpu(gpu);
}
/** The GPU froze or kept losing the picture: leave, and the plugin starts us again in software. */
function gpuFailed(reason) {
  if (software || process.env.AMADEUS_LIVE2D_SWIFTSHADER === '0') return;
  process.stderr.write(`[live2d] GPU rendering failed (${reason}), switching to software\n`);
  gpu = { fails: Math.max(2, gpu.fails + 1), at: Date.now(), loading: false };
  writeGpu(gpu);
  stopServers();
  app.exit(EXIT_SOFTWARE);
}

let character = null;
let bubble = null;
let menu = null;
let activeModelId = '';
let behaviors = { wander: true, perch: true, cursor: true };
let hidden = false;
let voiceReplies = { enabled: false, voice: 'sveta', speed: 1, engine: 'edge', edgeVoice: 'en-US-AvaMultilingualNeural', edgeRate: 10, edgePitch: 15 };
function voiceExtras(src, dst) {                                // engine and the Edge voice settings
  if (src.engine === 'edge' || src.engine === 'kokoro') dst.engine = src.engine;
  if (typeof src.edgeVoice === 'string' && /^[a-z]{2}-[A-Z]{2}-[A-Za-z]+Neural$/.test(src.edgeVoice)) dst.edgeVoice = src.edgeVoice;
  for (const k of ['edgeRate', 'edgePitch']) if (typeof src[k] === 'number' && isFinite(src[k])) dst[k] = Math.min(50, Math.max(-50, Math.round(src[k])));
}
const BUILTIN_VOICES = ['sveta', 'masha', 'dima'];
const VOICE_NAME = /^[a-z0-9_-]{1,40}$/;
let sttUrl = '';                                                 // the user's own OpenAI-compatible Whisper server ('' = recognise here)
const STT_URL = /^https?:\/\/[^\s]{3,300}$/;
let modelScale = 1.0;
let hotkeys = { microphoneToggle: 'CTRL+ALT+M', curtainToggle: 'CTRL+ALT+H', radioEnabled: false, pushToTalk: 'MOUSE4' };
let voiceDevices = { inputDeviceId: '', outputDeviceId: '', inputVolume: 100, outputVolume: 70 };
// How the LLM answer is displayed next to the character: 'bubble' = rectangular speech
// bubble with text, 'orb' = just the animated orb+dots (no text).
// hideAfter: seconds the finished answer stays on screen (0 = until the next answer).
let speechBubble = { enabled: true, mode: 'bubble', backgroundColor: '#211e2a', opacity: 0.94, fontColor: '#f5f3fa', fontSize: 14, hideAfter: 10, orb: {} };
function clampHideAfter(v) { return Math.min(600, Math.max(0, Math.round(v))); }
// Per-agent-state orb look shared with the Orbs settings tab:
// { [state]: { color?: '#rrggbb', display?: 'both' | 'orb' | 'dots', shape?: string } }.
const ORB_LOOK_STATES = ['idle', 'connecting', 'thinking', 'tool', 'tool_done', 'speaking', 'done', 'error', 'disabled'];
function sanitizeOrbLook(value) {
  const out = {};
  if (!value || typeof value !== 'object') return out;
  for (const key of ORB_LOOK_STATES) {
    const v = value[key];
    if (!v || typeof v !== 'object') continue;
    const entry = {};
    if (typeof v.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(v.color)) entry.color = v.color;
    if (v.display === 'orb' || v.display === 'dots' || v.display === 'both') entry.display = v.display;
    if (typeof v.shape === 'string' && /^[a-z-]{1,24}$/.test(v.shape)) entry.shape = v.shape;
    if (Object.keys(entry).length) out[key] = entry;
  }
  return out;
}
let menuOffset = null; // DIP offset from the character window's top-left, recorded at menu-open time.
const pendingChat = [];                                          // { at, text } for the DSH web app's chat
const PHRASE_TTL = 120000;                                       // a phrase nobody fetched in time is not sent later
function pushChat(text) { pendingChat.push({ at: Date.now(), text }); }
function nextChat() {
  for (;;) {
    const m = pendingChat.shift();
    if (!m) return '';
    if (Date.now() - m.at < PHRASE_TTL) return m.text;
  }
}
const SETTINGS_FILE = path.join(__dirname, 'settings.json');
function loadPersisted() {
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, 'utf8');
    const data = JSON.parse(raw);
    if (data && typeof data === 'object') {
      // The last shown character comes back after a restart (see restoreActiveModel).
      if (typeof data.activeModelId === 'string' && MODEL_ID.test(data.activeModelId)) activeModelId = data.activeModelId;
      if (typeof data.hidden === 'boolean') hidden = data.hidden;
      if (data.behaviors && typeof data.behaviors === 'object') {
        for (const k of ['wander', 'perch', 'cursor']) if (typeof data.behaviors[k] === 'boolean') behaviors[k] = data.behaviors[k];
      }
      if (data.voiceReplies && typeof data.voiceReplies === 'object') {
        if (typeof data.voiceReplies.enabled === 'boolean') voiceReplies.enabled = data.voiceReplies.enabled;
        if (typeof data.voiceReplies.voice === 'string' && VOICE_NAME.test(data.voiceReplies.voice)) voiceReplies.voice = data.voiceReplies.voice;
        if (typeof data.voiceReplies.speed === 'number' && isFinite(data.voiceReplies.speed)) voiceReplies.speed = data.voiceReplies.speed;
        voiceExtras(data.voiceReplies, voiceReplies);
      }
      if (typeof data.sttUrl === 'string' && STT_URL.test(data.sttUrl)) sttUrl = data.sttUrl;
      if (typeof data.modelScale === 'number' && isFinite(data.modelScale) && data.modelScale >= 0.2 && data.modelScale <= 3) modelScale = data.modelScale;
      if (data.hotkeys && typeof data.hotkeys === 'object') {
        if (typeof data.hotkeys.radioEnabled === 'boolean') hotkeys.radioEnabled = data.hotkeys.radioEnabled;
      }
      if (data.voiceDevices && typeof data.voiceDevices === 'object') {
        if (typeof data.voiceDevices.inputDeviceId === 'string') voiceDevices.inputDeviceId = data.voiceDevices.inputDeviceId;
        if (typeof data.voiceDevices.outputDeviceId === 'string') voiceDevices.outputDeviceId = data.voiceDevices.outputDeviceId;
      }
      if (data.speechBubble && typeof data.speechBubble === 'object') {
        if (typeof data.speechBubble.enabled === 'boolean') speechBubble.enabled = data.speechBubble.enabled;
        if (data.speechBubble.mode === 'orb' || data.speechBubble.mode === 'bubble') speechBubble.mode = data.speechBubble.mode;
        if (typeof data.speechBubble.backgroundColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(data.speechBubble.backgroundColor)) speechBubble.backgroundColor = data.speechBubble.backgroundColor;
        if (typeof data.speechBubble.fontColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(data.speechBubble.fontColor)) speechBubble.fontColor = data.speechBubble.fontColor;
        if (typeof data.speechBubble.opacity === 'number' && isFinite(data.speechBubble.opacity)) speechBubble.opacity = Math.min(1, Math.max(0.3, data.speechBubble.opacity));
        if (data.speechBubble.orb !== undefined) speechBubble.orb = sanitizeOrbLook(data.speechBubble.orb);
        if (typeof data.speechBubble.hideAfter === 'number' && isFinite(data.speechBubble.hideAfter)) speechBubble.hideAfter = clampHideAfter(data.speechBubble.hideAfter);
        if (typeof data.speechBubble.fontSize === 'number' && isFinite(data.speechBubble.fontSize)) speechBubble.fontSize = Math.min(32, Math.max(10, data.speechBubble.fontSize));
      }
    }
  } catch {}
}
function persist() {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify({ activeModelId, hidden, behaviors, voiceReplies, modelScale, hotkeys, voiceDevices, speechBubble, sttUrl }, null, 2));
  } catch {}
}
loadPersisted();
// The plugin carries all of its code (companion/speech is the Kokoro server); the heavy runtime —
// Electron, Python environments and voice models — is in one shared folder, W:\amadeus-runtime
// (AMADEUS_RUNTIME), filled by setup/install-runtime.ps1.
const RUNTIME = process.env.AMADEUS_RUNTIME || 'W:\\amadeus-runtime';
const runtimePath = (...p) => path.join(RUNTIME, ...p);
function runtimePython(name) {
  const py = runtimePath('python', name, 'Scripts', 'python.exe');
  return fs.existsSync(py) ? py : null;
}
/** Environment of the local voice / recognition servers: they never need the user's API key or our token. */
const childEnv = () => { const e = { ...process.env, AMADEUS_RUNTIME: RUNTIME }; delete e.LITELLM_API_KEY; delete e.AMADEUS_TOKEN; return e; };

// ---- Kokoro-ru (companion/speech): shared with live3D on port 58321, reused when it is already running
const KOKORO_PORT = 58321;
let kokoroProcess = null;
function kokoroPython() { return runtimePython('kokoro') || 'python.exe'; }
const kokoroVoicesDir = () => runtimePath('models', 'speech', 'kokoro-ru', 'voices');   // the style .bin files the server reads
function kokoroVoices() {
  const out = [...BUILTIN_VOICES];
  try {
    for (const f of fs.readdirSync(kokoroVoicesDir())) {
      const n = f.replace(/\.bin$/i, '');
      if (/\.bin$/i.test(f) && !out.includes(n)) out.push(n);
    }
  } catch {}
  return out;
}
async function kokoroHealthy() {
  try { const r = await fetch(`http://127.0.0.1:${KOKORO_PORT}/health`, { signal: AbortSignal.timeout(800) }); return r.ok; } catch { return false; }
}
let kokoroStarting = null;
async function kokoroEnsure() {
  if (await kokoroHealthy()) return KOKORO_PORT;
  if (!kokoroStarting) {
    kokoroStarting = (async () => {
      if (!kokoroProcess || kokoroProcess.exitCode !== null) {
        kokoroProcess = spawn(kokoroPython(), ['-m', 'speech.server', String(KOKORO_PORT)], { cwd: __dirname, env: childEnv(), stdio: 'ignore', windowsHide: true });
        kokoroProcess.on('error', () => {});
      }
      const deadline = Date.now() + 25000;
      while (Date.now() < deadline) {
        if (await kokoroHealthy()) return true;
        await new Promise((r) => setTimeout(r, 300));
      }
      return false;
    })().finally(() => { kokoroStarting = null; });
  }
  if (!(await kokoroStarting)) throw new Error('Kokoro не запустился');
  return KOKORO_PORT;
}
// ---- Edge neural voices (online): the same small edge-tts server as live3D (shared port)
const EDGE_PORT = 58323;
const EDGE_VOICES = ['ru-RU-SvetlanaNeural', 'ru-RU-DmitryNeural', 'en-US-AvaMultilingualNeural', 'en-US-EmmaMultilingualNeural', 'fr-FR-VivienneMultilingualNeural', 'pt-BR-ThalitaMultilingualNeural'];
let edgeProcess = null;
function edgePython() { return runtimePython('tts'); }
async function edgeHealthy() {
  try { const r = await fetch(`http://127.0.0.1:${EDGE_PORT}/health`, { signal: AbortSignal.timeout(800) }); return r.ok; } catch { return false; }
}
let edgeStarting = null;
async function edgeEnsure() {
  if (await edgeHealthy()) return true;
  if (!edgeStarting) {
    edgeStarting = (async () => {
      if (!edgeProcess || edgeProcess.exitCode !== null) {
        const py = edgePython();
        if (!py) return false;
        edgeProcess = spawn(py, [path.join(__dirname, 'tts_edge_server.py'), String(EDGE_PORT)], { env: childEnv(), stdio: 'ignore', windowsHide: true });
        edgeProcess.on('error', () => {});
      }
      const deadline = Date.now() + 15000;
      while (Date.now() < deadline) { if (await edgeHealthy()) return true; await new Promise((r) => setTimeout(r, 250)); }
      return false;
    })().finally(() => { edgeStarting = null; });
  }
  return edgeStarting;
}
function stopServers() {
  for (const p of [kokoroProcess, edgeProcess, sttProcess]) { try { if (p && p.exitCode === null) p.kill(); } catch {} }
}
app.on('will-quit', () => { stopServers(); gpuLoading(false); });
async function edgeSynthesize(text) {
  if (!(await edgeEnsure())) throw new Error(`Edge-голоса недоступны (нет окружения ${runtimePath('python', 'tts')}; запустите setup\\install-runtime.ps1).`);
  const lim = (v, d) => Math.min(50, Math.max(-50, Math.round(Number.isFinite(Number(v)) ? Number(v) : d)));
  const res = await fetch(`http://127.0.0.1:${EDGE_PORT}/synthesize`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, voice: EDGE_VOICES.includes(voiceReplies.edgeVoice) ? voiceReplies.edgeVoice : EDGE_VOICES[0], rate: lim(voiceReplies.edgeRate, 10), pitch: lim(voiceReplies.edgePitch, 15) }),
    signal: AbortSignal.timeout(100000),
  });
  if (res.ok) return await res.arrayBuffer();
  const error = await res.json().catch(() => ({}));
  throw new Error(error.error || `edge http ${res.status}`);
}
async function kokoroSynthesize(text, voice, speed) {
  const wanted = kokoroVoices().includes(voice) ? voice : 'sveta';
  const rate = Math.min(2, Math.max(0.5, Number(speed) || 1));
  const port = await kokoroEnsure();
  const res = await fetch(`http://127.0.0.1:${port}/synthesize`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, voice: wanted, speed: rate }),
    signal: AbortSignal.timeout(120000),
  });
  if (res.ok) return await res.arrayBuffer();
  const error = await res.json().catch(() => ({}));
  throw new Error(error.error || `tts http ${res.status}`);
}
const pending = new Map(); // commandId -> { resolve, t }
function dlog(_s) {}
// ---- what she says: the sentences wait here, the character window asks for the next one when it is ready.
const toCharacter = (...a) => { if (character && !character.isDestroyed() && !character.webContents.isDestroyed()) character.webContents.send(...a); };
const speech = new Speech({ onStop: (epoch) => toCharacter('voice:stop', epoch), onKick: (epoch) => toCharacter('voice:kick', epoch) });
const aloud = () => voiceReplies.enabled && !hidden;              // a hidden live2D must not read answers on top of the 3D companion
let voiceError = null;                                           // { engine, error, at }: the last sentence that could not be said
/** Only the chosen engine, never another voice; a sentence that fails is skipped. */
async function synthesize(text) {
  const engine = voiceReplies.engine === 'kokoro' ? 'kokoro' : 'edge';
  try {
    let audio;
    if (engine === 'edge') audio = await edgeSynthesize(text);   // the server retries by itself
    else {
      try { audio = await kokoroSynthesize(text, voiceReplies.voice, voiceReplies.speed); }
      catch { audio = await kokoroSynthesize(text, voiceReplies.voice, voiceReplies.speed); }
    }
    voiceError = null;
    return { ok: true, text, audio };
  } catch (error) {
    voiceError = { engine, error: String((error && error.message) || error).slice(0, 240), at: Date.now() };
    process.stderr.write(`[live2d] voice ${engine}: ${voiceError.error}\n`);
    return { ok: false, text, error: voiceError.error };
  }
}
/** Everything that is on screen or being said goes away with the character. */
function quiet() {
  speech.hush();
  if (bubble && !bubble.isDestroyed()) bubble.hide();
  if (menu && !menu.isDestroyed()) menu.hide();
}
function settings() {
  const models = {};
  for (const id of listModels()) models[id] = true;
  return {
    activeModelId,
    hidden,
    modelScale,
    voiceReplies: { ...voiceReplies },
    catalogState: { models },
    speechBubble: { ...speechBubble },
    behaviors: { ...behaviors },
    hotkeys: { ...hotkeys },
    voiceDevices: { ...voiceDevices },
  };
}

/** The settings page's view. */
function publicSettings() {
  return { ok: true, behaviors: { ...behaviors }, hidden, voiceReplies: { ...voiceReplies }, voices: kokoroVoices(), modelScale, hotkeys: { ...hotkeys }, voiceDevices: { ...voiceDevices }, speechBubble: { ...speechBubble }, sttUrl, voiceError, rendering: software ? 'cpu' : 'gpu' };
}
// Apply a partial settings patch { hidden?, behaviors?: { wander?, perch?, cursor? } }.
// Returns the new state; forwards behaviors to the renderer via link:settings.
function applySettingsPatch(patch) {
  if (!patch || typeof patch !== 'object') return publicSettings();
  let changed = false;
  if (typeof patch.hidden === 'boolean' && patch.hidden !== hidden) {
    hidden = patch.hidden;
    if (character && !character.isDestroyed()) {
      if (hidden) { character.hide(); quiet(); }
      else if (!character.isVisible()) character.showInactive();
    }
    changed = true;
  }
  if (patch.behaviors && typeof patch.behaviors === 'object') {
    for (const k of ['wander', 'perch', 'cursor']) {
      if (typeof patch.behaviors[k] === 'boolean' && patch.behaviors[k] !== behaviors[k]) {
        behaviors[k] = patch.behaviors[k];
        changed = true;
      }
    }
  }
  if (patch.voiceReplies && typeof patch.voiceReplies === 'object') {
    if (typeof patch.voiceReplies.enabled === 'boolean' && patch.voiceReplies.enabled !== voiceReplies.enabled) {
      voiceReplies.enabled = patch.voiceReplies.enabled;
      if (!voiceReplies.enabled) speech.hush();
      changed = true;
    }
    if (typeof patch.voiceReplies.voice === 'string' && kokoroVoices().includes(patch.voiceReplies.voice) && patch.voiceReplies.voice !== voiceReplies.voice) {
      voiceReplies.voice = patch.voiceReplies.voice;
      changed = true;
    }
    if (typeof patch.voiceReplies.speed === 'number' && isFinite(patch.voiceReplies.speed) && patch.voiceReplies.speed > 0 && patch.voiceReplies.speed !== voiceReplies.speed) {
      voiceReplies.speed = patch.voiceReplies.speed;
      changed = true;
    }
    const before = JSON.stringify(voiceReplies);
    voiceExtras(patch.voiceReplies, voiceReplies);
    if (JSON.stringify(voiceReplies) !== before) changed = true;
  }
  if (typeof patch.sttUrl === 'string' && (patch.sttUrl === '' || STT_URL.test(patch.sttUrl)) && patch.sttUrl.replace(/\/+$/, '') !== sttUrl) {
    sttUrl = patch.sttUrl.replace(/\/+$/, '');
    changed = true;
  }
  if (typeof patch.scale === 'number' && isFinite(patch.scale) && patch.scale >= 0.2 && patch.scale <= 3 && Math.abs(patch.scale - modelScale) > 0.0001) {
    modelScale = patch.scale;
    changed = true;
  }
  if (typeof patch.radioEnabled === 'boolean' && patch.radioEnabled !== hotkeys.radioEnabled) {
    hotkeys.radioEnabled = patch.radioEnabled;
    changed = true;
  }
  if (patch.voiceDevices && typeof patch.voiceDevices === 'object') {
    for (const k of ['inputDeviceId', 'outputDeviceId']) {
      if (typeof patch.voiceDevices[k] === 'string' && patch.voiceDevices[k] !== voiceDevices[k]) {
        voiceDevices[k] = patch.voiceDevices[k];
        changed = true;
      }
    }
  }
  if (patch.speechBubble && typeof patch.speechBubble === 'object') {
    if (typeof patch.speechBubble.enabled === 'boolean' && patch.speechBubble.enabled !== speechBubble.enabled) {
      speechBubble.enabled = patch.speechBubble.enabled;
      if (!speechBubble.enabled && bubble && !bubble.isDestroyed()) bubble.hide();
      changed = true;
    }
    if ((patch.speechBubble.mode === 'orb' || patch.speechBubble.mode === 'bubble') && patch.speechBubble.mode !== speechBubble.mode) {
      speechBubble.mode = patch.speechBubble.mode;
      changed = true;
    }
    for (const k of ['backgroundColor', 'fontColor']) {
      if (typeof patch.speechBubble[k] === 'string' && /^#[0-9a-fA-F]{6}$/.test(patch.speechBubble[k]) && patch.speechBubble[k] !== speechBubble[k]) {
        speechBubble[k] = patch.speechBubble[k];
        changed = true;
      }
    }
    if (typeof patch.speechBubble.opacity === 'number' && isFinite(patch.speechBubble.opacity)) {
      const o = Math.min(1, Math.max(0.3, patch.speechBubble.opacity));
      if (Math.abs(o - speechBubble.opacity) > 0.001) { speechBubble.opacity = o; changed = true; }
    }
    if (typeof patch.speechBubble.fontSize === 'number' && isFinite(patch.speechBubble.fontSize)) {
      const s = Math.min(32, Math.max(10, Math.round(patch.speechBubble.fontSize)));
      if (s !== speechBubble.fontSize) { speechBubble.fontSize = s; changed = true; }
    }
    if (typeof patch.speechBubble.hideAfter === 'number' && isFinite(patch.speechBubble.hideAfter)) {
      const h = clampHideAfter(patch.speechBubble.hideAfter);
      if (h !== speechBubble.hideAfter) { speechBubble.hideAfter = h; changed = true; }
    }
    if (patch.speechBubble.orb !== undefined) {
      const orb = sanitizeOrbLook(patch.speechBubble.orb);
      if (JSON.stringify(orb) !== JSON.stringify(speechBubble.orb)) { speechBubble.orb = orb; changed = true; }
    }
  }
  if (changed) {
    persist();
    toCharacter('link:settings', settings());
  }
  return publicSettings();
}

async function importVoice(body) {
  const name = String((body && body.name) || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
  if (!name || typeof body.data !== 'string') return { ok: false, error: 'Нужны имя и файл .bin.' };
  if (BUILTIN_VOICES.includes(name)) return { ok: false, error: 'Имя «' + name + '» занято встроенным голосом — переименуйте файл.' };
  const buf = Buffer.from(body.data, 'base64');
  if (buf.length < 1024 * 64 || buf.length % 1024) return { ok: false, error: 'Это не стиль голоса Kokoro (.bin из строк по 256 чисел float32).' };
  const voicesDir = kokoroVoicesDir();
  fs.mkdirSync(voicesDir, { recursive: true });
  fs.writeFileSync(path.join(voicesDir, name + '.bin'), buf);
  try {
    if (await kokoroHealthy()) await fetch(`http://127.0.0.1:${KOKORO_PORT}/voices`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name }), signal: AbortSignal.timeout(30000) });
  } catch {}
  return { ok: true, name, voices: kokoroVoices() };
}

// ---- recognition: the user's own Whisper server when its address is set, the local faster-whisper otherwise.
// The recording and the key go to that address and nowhere else.
const STT_PORT = 58322;
const STT_HINT = 'Сообщение агенту.';
let sttProcess = null;
async function sttState() {
  try { const r = await fetch(`http://127.0.0.1:${STT_PORT}/health`, { signal: AbortSignal.timeout(800) }); const j = await r.json(); return j.ready ? 'ready' : j.error ? 'error' : 'loading'; } catch { return ''; }
}
async function sttEnsure(waitMs = 60000) {
  let st = await sttState();
  if (st === 'ready') return true;
  if (!st && (!sttProcess || sttProcess.exitCode !== null)) {
    const py = runtimePython('stt');
    if (!py) return false;
    sttProcess = spawn(py, [path.join(__dirname, 'stt_server.py'), String(STT_PORT), runtimePath('models', 'whisper')], { env: childEnv(), stdio: 'ignore', windowsHide: true });
    sttProcess.on('error', () => {});
  }
  const deadline = Date.now() + waitMs;
  while (Date.now() < deadline) {
    st = await sttState();
    if (st === 'ready') return true;
    if (st === 'error' || (!st && sttProcess && sttProcess.exitCode !== null)) return false;
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}
async function transcribeLocal(buf, mime) {
  if (!(await sttEnsure())) return { ok: false, error: `Локальное распознавание недоступно (нет окружения ${runtimePath('python', 'stt')}; запустите setup\\install-runtime.ps1).` };
  const r = await fetch(`http://127.0.0.1:${STT_PORT}/transcribe`, { method: 'POST', headers: { 'content-type': mime, 'x-hint': Buffer.from(STT_HINT).toString('hex') }, body: buf, signal: AbortSignal.timeout(60000) });
  const j = await r.json().catch(() => ({}));
  return { ok: !!j.ok, text: String(j.text || '').trim(), error: j.error };
}
const providerUrl = () => String(sttUrl || process.env.LITELLM_BASE_URL || '').replace(/\/+$/, '');
async function transcribe(dataB64, type, filename) {
  if (typeof dataB64 !== 'string' || !dataB64) return { ok: false, error: 'Нет аудиоданных.' };
  const buf = Buffer.from(dataB64, 'base64');
  if (buf.length < 1000) return { ok: false, error: 'Аудио слишком короткое.' };
  const mime = typeof type === 'string' && /^audio\/[\w.+-]+$/.test(type) ? type : 'audio/wav';
  const baseUrl = providerUrl();
  if (!baseUrl) return transcribeLocal(buf, mime);
  const fname = typeof filename === 'string' && filename ? filename : (mime.includes('webm') ? 'audio.webm' : 'audio.wav');
  const fd = new FormData();
  fd.append('model', 'groq/whisper-large-v3-turbo');
  fd.append('file', new Blob([buf], { type: mime }), fname);
  const headers = {};
  if (process.env.LITELLM_API_KEY) headers.authorization = `Bearer ${process.env.LITELLM_API_KEY}`;
  const res = await fetch(`${baseUrl}/audio/transcriptions`, { method: 'POST', headers, body: fd, signal: AbortSignal.timeout(60000) });
  if (!res.ok) return { ok: false, error: `Сервер распознавания ответил ошибкой ${res.status}.` };
  const j = await res.json().catch(() => ({}));
  return { ok: true, text: String(j.text || '').trim() };
}

async function modelFileResponse(filePath) {
  try {
    // Match amadeus-v2's live2dModelFileResponse exactly: buffered read (no streaming),
    // content-type detected by magic bytes, no content-length header.
    const data = await fs.promises.readFile(filePath);
    let type = 'application/octet-stream';
    if (filePath.toLowerCase().endsWith('.json')) type = 'application/json';
    else if (data.length >= 8 && data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47) type = 'image/png';
    else if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) type = 'image/jpeg';
    else if (data.length >= 12 && data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46 && data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 && data[11] === 0x50) type = 'image/webp';
    return new Response(new Uint8Array(data), { headers: { 'content-type': type, 'access-control-allow-origin': '*' } });   // our own scheme, only reachable from the companion's windows
  } catch (e) {
    dlog('serve: ERROR ' + path.basename(filePath) + ' ' + (e && e.message));
    return new Response('Not found', { status: 404 });
  }
}

function modelUrl(modelId) {
  if (typeof modelId !== 'string' || !MODEL_ID.test(modelId)) return null;
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(MODELS_DIR, modelId, 'character.json'), 'utf8'));
    const model = manifest.live2d && manifest.live2d.model;
    if (typeof model !== 'string' || !model) return null;
    // file:// avoids the custom-protocol Response back-pressure that blocks the main-process
    // event loop while the renderer does its synchronous WebGL model/texture upload.
    return pathToFileURL(path.join(MODELS_DIR, modelId, model)).toString();
  } catch {
    return null;
  }
}

function listActions() {
  try {
    const catalog = JSON.parse(fs.readFileSync(path.join(MODELS_DIR, activeModelId, 'catalog.json'), 'utf8'));
    return { character: activeModelId, motions: catalog.motions || [], expressions: catalog.expressions || [] };
  } catch {
    return { character: activeModelId, motions: [], expressions: [] };
  }
}

function listModels() {
  try {
    return fs.readdirSync(MODELS_DIR, { withFileTypes: true })
      .filter((e) => e.isDirectory() && fs.existsSync(path.join(MODELS_DIR, e.name, 'character.json')))
      .map((e) => e.name);
  } catch {
    return [];
  }
}

function fullModel(id) {
  try {
    const char = JSON.parse(fs.readFileSync(path.join(MODELS_DIR, id, 'character.json'), 'utf8'));
    const cat = JSON.parse(fs.readFileSync(path.join(MODELS_DIR, id, 'catalog.json'), 'utf8'));
    const motions = (cat.motions || []).map((g) => ({
      key: g.key,
      label: g.label || g.key,
      items: (g.items || []).map((it, i) => ({ index: i, label: it.label })),
    }));
    const expressions = (cat.expressions || []).map((e) => ({ name: e.key, label: e.label || e.key }));
    const previewFile = path.join(MODELS_DIR, id, 'preview.png');
    return {
      id,
      name: char.displayName || id,
      description: char.description || 'Live2D модель',
      motions: motions.reduce((n, g) => n + g.items.length, 0),
      expressions: expressions.length,
      actions: { motions, expressions },
      preview: fs.existsSync(previewFile) ? '/amadeus-live2d/preview/' + id : '',
    };
  } catch {
    return { id, name: id, description: 'Live2D модель', motions: 0, expressions: 0, actions: { motions: [], expressions: [] }, preview: '' };
  }
}

function listModelsFull() {
  return listModels().map(fullModel);
}

function hasPreview(id) {
  const dir = path.join(MODELS_DIR, id);
  try { return fs.readdirSync(dir).some((f) => /^(preview|icon|thumbnail|portrait|avatar)\.(png|jpe?g|webp)$/i.test(f) || /^ico_.*\.(png|jpe?g)$/i.test(f)); } catch { return false; }
}

let importing = Promise.resolve();
/** Import archives/folders, then render card previews for models that ship none. One import at a time. */
function runImport(paths) {
  const job = importing.then(async () => {
    const results = await importer.importPaths(paths, MODELS_DIR);
    const ids = results.flatMap((r) => r.imported.map((m) => m.id));
    if (ids.length) toCharacter('link:settings', settings());
    if (ids.length && (await waitReady(20000))) {
      for (const r of results) {
        for (const m of r.imported) {
          if (hasPreview(m.id)) { m.preview = true; continue; }
          const res = await commandResult({ name: 'render_preview', modelId: m.id }, 20000).catch(() => null);
          m.preview = Boolean(res && res.ok);
        }
      }
    }
    return { ok: true, results };
  });
  importing = job.catch(() => {});
  return job;
}

/** Rename a model or the label of one of its expressions / motions (catalog.json + character.json). */
function renameLabels(body) {
  const id = body.id;
  if (typeof id !== 'string' || !MODEL_ID.test(id)) throw new Error('Некорректный id модели.');
  const dir = path.join(MODELS_DIR, id);
  const label = String(body.label || '').trim().slice(0, 60);
  if (!label) throw new Error('Пустое название.');
  if (body.kind === 'model') {
    const file = path.join(dir, 'character.json');
    const c = JSON.parse(fs.readFileSync(file, 'utf8'));
    c.displayName = label;
    fs.writeFileSync(file, JSON.stringify(c, null, 2));
    return { ok: true };
  }
  const file = path.join(dir, 'catalog.json');
  const cat = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (body.kind === 'expression') {
    const e = (cat.expressions || []).find((x) => x.key === body.key);
    if (!e) throw new Error('Эмоция не найдена.');
    e.label = label;
  } else if (body.kind === 'motion') {
    const g = (cat.motions || []).find((x) => x.key === body.group);
    const item = g && g.items && g.items[Number(body.index)];
    if (!item) throw new Error('Движение не найдено.');
    item.label = label;
  } else throw new Error('Неизвестный тип.');
  fs.writeFileSync(file, JSON.stringify(cat, null, 2));
  return { ok: true };
}

function sendCommand(command) {
  if (!character || character.webContents.isLoading()) { dlog('sendCommand: null (isLoading=' + Boolean(character && character.webContents.isLoading()) + ')'); return null; }
  const id = randomUUID();
  character.webContents.send('link:command', id, { modelId: activeModelId, ...command });
  return id;
}

function commandResult(command, timeoutMs = 10000) {
  const id = sendCommand(command);
  if (id === null) return Promise.resolve({ ok: false, error: 'Окно персонажа не готово.' });
  return new Promise((resolve) => {
    const t = setTimeout(() => { pending.delete(id); process.stderr.write('cmd timeout ' + command.name + '\n'); dlog('cmd timeout ' + command.name); resolve({ ok: false, error: 'Окно персонажа не ответило вовремя.' }); }, timeoutMs);
    pending.set(id, { resolve, t });
  });
}

function waitReady(timeoutMs = 20000) {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;
    const poll = async () => {
      try {
        if (!character || character.webContents.isDestroyed()) return resolve(false);
        const ready = await character.webContents.executeJavaScript("!!(window.amadeus && typeof window.amadeus.answer === 'function')", true);
        if (ready === true) return resolve(true);
      } catch { /* page still loading */ }
      if (Date.now() >= deadline) return resolve(false);
      setTimeout(poll, 200);
    };
    poll();
  });
}

async function loadModel(id) {
  if (typeof id !== 'string' || !MODEL_ID.test(id)) throw new Error('Некорректный id модели.');
  if (!fs.existsSync(path.join(MODELS_DIR, id, 'character.json'))) throw new Error(`Модель "${id}" не найдена.`);
  const previous = activeModelId;
  activeModelId = id;
  gpuLoading(true);
  toCharacter('link:settings', settings());
  const deadline = Date.now() + 30000;
  let error = 'Модель не загрузилась за отведённое время.';
  while (Date.now() < deadline && activeModelId === id) {
    const result = await commandResult({ name: 'sync_character', args: {} }, 5000);   // answers once the model is loaded, or why it is not
    if (result && result.ok) { gpuLoading(false, true); persist(); return { ok: true, id }; }
    if (result && result.failed) { error = result.error || error; break; }
    await new Promise((res) => setTimeout(res, 200));
  }
  if (activeModelId !== id) return { ok: false, error: 'Выбрана другая модель.' };
  if (!(await rendererAlive())) gpuFailed('the window froze while loading a model');
  gpuLoading(false);
  if (previous !== id) { activeModelId = previous; toCharacter('link:settings', settings()); }   // the character that was there comes back
  return { ok: false, error };
}
function rendererAlive(timeoutMs = 4000) {
  return new Promise((resolve) => {
    const t = setTimeout(() => resolve(false), timeoutMs);
    if (!character || character.isDestroyed()) { clearTimeout(t); resolve(false); return; }
    character.webContents.executeJavaScript('1').then(() => { clearTimeout(t); resolve(true); }, () => { clearTimeout(t); resolve(false); });
  });
}

/** Anchor the speech bubble beside the character's head (tail points at it). */
function bubbleSize() {
  return speechBubble.mode === 'orb' ? LIVE2D_ORB_SIZE : LIVE2D_BUBBLE_SIZE;
}

/** The style object bubble.js render() expects on every speech (mirrors the renderer's DEFAULT_STYLE). */
function bubbleStyle() {
  return {
    fontFamily: 'Segoe UI',
    fontSize: speechBubble.fontSize,
    fontColor: speechBubble.fontColor,
    backgroundColor: speechBubble.backgroundColor,
    opacity: speechBubble.opacity,
    mode: speechBubble.mode,
    hideAfter: speechBubble.hideAfter,
    orb: speechBubble.orb,
  };
}

function placeBubble() {
  if (!character || !bubble || character.isDestroyed() || bubble.isDestroyed()) return;
  const size = bubbleSize();
  const bounds = character.getBounds();
  const work = screen.getDisplayMatching(bounds).workArea;
  const overlap = Math.round(bounds.width * LIVE2D_BUBBLE_OVERLAP);
  const top = Math.max(work.y + 8, bounds.y + Math.round(bounds.height * 0.05));
  const left = bounds.x - size.width + overlap;
  const fits = left >= work.x + 8;
  const x = fits ? left : Math.min(bounds.x + bounds.width - overlap, work.x + work.width - size.width - 8);
  bubble.setBounds({ x: Math.round(x), y: Math.round(Math.min(top, work.y + work.height - size.height)), ...size });
  bubble.webContents.send('bubble:side', fits ? 'right' : 'left');
}

/** Anchor the right-click quick menu to the character (near the right-click point). */
function placeMenu() {
  if (!menu || !character || character.isDestroyed() || menu.isDestroyed()) return;
  const bounds = character.getBounds();
  const work = screen.getDisplayMatching(bounds).workArea;
  const [w, h] = menu.getSize();
  let px, py;
  if (menuOffset) {
    px = bounds.x + menuOffset.dx;
    py = bounds.y + menuOffset.dy;
  } else {
    px = bounds.x - w - 14;
    py = bounds.y + Math.round((bounds.height - h) / 2);
  }
  menu.setPosition(
    Math.max(work.x + 4, Math.min(px, work.x + work.width - w - 4)),
    Math.max(work.y + 4, Math.min(py, work.y + work.height - h - 4)),
  );
}

let recording = false;                                           // the character window is listening to the microphone
function showMenu(x, y) {
  if (!menu) return;
  if (character && !character.isDestroyed()) {
    const bounds = character.getBounds();
    const cursor = { x: Math.round(Number(x) || 0), y: Math.round(Number(y) || 0) };
    const [w, h] = menu.getSize();
    menuOffset = { dx: cursor.x - w - 12 - bounds.x, dy: cursor.y - Math.round(h / 2) - bounds.y };
  }
  placeMenu();
  menu.webContents.send('menu:opened', { recording });
  menu.show();
  menu.focus();
}

function createCharacterWindow() {
  const work = screen.getPrimaryDisplay().workArea;
  character = new BrowserWindow({
    width: 360, height: 560,
    x: work.x + work.width - 400, y: work.y + work.height - 560,
    transparent: true, frame: false, resizable: false, hasShadow: false,
    alwaysOnTop: true, skipTaskbar: true, focusable: false, show: false,
    backgroundColor: '#00000000',
    webPreferences: { preload: PRELOAD, contextIsolation: true, nodeIntegration: false, webSecurity: false, backgroundThrottling: false },
  });
  character.setIgnoreMouseEvents(true, { forward: true });
  character.loadFile(path.join(RENDERER_DIR, 'index.html'));
  character.once('ready-to-show', () => { if (!character.isDestroyed() && !hidden) character.showInactive(); });
  character.webContents.on('console-message', (event) => {
    process.stderr.write(`[live2d:${event.level}] ${event.message}\n`);
    dlog('renderer: [' + event.level + '] ' + event.message);
  });
  // A crashed window, or one whose WebGL context the driver took away, is loaded again (3 times in
  // 5 minutes: the GPU is not to be trusted here).
  character.webContents.on('render-process-gone', (_event, d) => { if (d.reason !== 'clean-exit') reviveCharacter('renderer ' + d.reason); });
  character.webContents.on('did-fail-load', (_event, code, description) => {
    process.stderr.write(`[live2d] load failed ${code}: ${description}\n`);
  });
}

let revived = [];
function reviveCharacter(reason) {
  process.stderr.write(`[live2d] ${reason}: reloading the character window\n`);
  revived = [...revived.filter((t) => Date.now() - t < 5 * 60 * 1000), Date.now()];
  if (revived.length >= 3) { gpuFailed(reason); if (revived.length > 5) return; }
  recording = false;
  setTimeout(() => { if (character && !character.isDestroyed()) character.webContents.reload(); }, 1000);
}

function createBubbleWindow() {
  const work = screen.getPrimaryDisplay().workArea;
  bubble = new BrowserWindow({
    ...LIVE2D_BUBBLE_SIZE,
    x: work.x + work.width - LIVE2D_BUBBLE_SIZE.width, y: work.y + work.height - LIVE2D_BUBBLE_SIZE.height,
    transparent: true, frame: false, resizable: false, hasShadow: false,
    alwaysOnTop: true, skipTaskbar: true, focusable: false, show: false,
    backgroundColor: '#00000000',
    webPreferences: { preload: PRELOAD },
  });
  bubble.setIgnoreMouseEvents(true, { forward: true });
  // A hidden bubble never gets mouseleave, so drop back to click-through here.
  bubble.on('hide', () => { if (!bubble.isDestroyed()) bubble.setIgnoreMouseEvents(true, { forward: true }); });
  bubble.loadFile(path.join(RENDERER_DIR, 'bubble.html'));
}

function createMenuWindow() {
  menu = new BrowserWindow({
    width: 240, height: 240,
    x: 0, y: 0,
    transparent: true, frame: false, resizable: false, hasShadow: false,
    alwaysOnTop: true, skipTaskbar: true, focusable: true, show: false,
    backgroundColor: '#00000000',
    webPreferences: { preload: PRELOAD },
  });
  menu.loadFile(path.join(RENDERER_DIR, 'menu.html'));
}

// ---- IPC (mirrors the amadeus-v2 Live2D main-process surface the renderer expects) ----
function registerIpc() {
  ipcMain.handle('model:url', (_e, id) => modelUrl(id));
  ipcMain.handle('link:settings-get', () => settings());
  ipcMain.handle('screen:displays', () => screen.getAllDisplays().map((d) => ({ id: d.id, bounds: d.bounds, workArea: d.workArea })));
  ipcMain.handle('screen:cursor', () => screen.getCursorScreenPoint());
  ipcMain.handle('window:bounds', () => (character ? character.getBounds() : null));
  ipcMain.on('window:move', (_e, x, y) => {
    if (!character || !Number.isFinite(x) || !Number.isFinite(y)) return;
    const b = character.getBounds();
    character.setBounds({ x: Math.round(x), y: Math.round(y), width: b.width, height: b.height });
    if (menu && !menu.isDestroyed() && menu.isVisible()) placeMenu();
    if (bubble && !bubble.isDestroyed() && bubble.isVisible()) placeBubble();
  });
  ipcMain.on('window:resize', (_e, w, h) => {
    if (character && Number.isFinite(w) && Number.isFinite(h)) {
      const b = character.getBounds();
      character.setBounds({ ...b, width: Math.round(w), height: Math.round(h) });
      if (menu && !menu.isDestroyed() && menu.isVisible()) placeMenu();
      if (bubble && !bubble.isDestroyed() && bubble.isVisible()) placeBubble();
    }
  });
  ipcMain.on('window:interactive', (_e, interactive) => {
    // Grab: when the cursor is over the figure, make the window accept mouse events
    // (drag); otherwise keep it click-through. Mouse moves still reach the page via forward.
    if (character && !character.isDestroyed()) character.setIgnoreMouseEvents(!interactive, { forward: true });
  });
  ipcMain.on('window:visible', (_e, visible) => { dlog('window:visible ' + visible + ' (window already shown)'); });
  ipcMain.on('link:answer', (_e, id, result) => {
    const p = pending.get(id);
    if (p) { pending.delete(id); clearTimeout(p.t); p.resolve(result); }
  });
  ipcMain.on('menu:open', (_e, x, y) => { showMenu(x, y); });
  ipcMain.on('menu:action', (_e, action) => {
    if (action === 'microphone') {
      if (character && !character.webContents.isDestroyed()) character.webContents.send('voice:toggle');
    } else if (action === 'close') {
      if (menu) menu.hide();
    }
  });
  ipcMain.handle('menu:send', (_e, text) => {
    const t = String(text || '').trim();
    if (t) pushChat(t);
    return { ok: true, sent: Boolean(t) };
  });
  // The bubble is click-through except while hovered, so long answers can be wheel-scrolled.
  ipcMain.on('bubble:interactive', (_e, interactive) => {
    if (bubble && !bubble.isDestroyed()) bubble.setIgnoreMouseEvents(!interactive, { forward: true });
  });
  ipcMain.on('bubble:speak', () => { if (bubble && !bubble.isDestroyed()) bubble.hide(); });   // the bubble's own timer, or no model
  // The sentence after the one being said; null = nothing to say (a kick follows when there is).
  ipcMain.handle('voice:next', async (_e, epoch) => {
    if (epoch !== speech.epoch || !aloud()) return null;
    const text = speech.next();
    return text ? await synthesize(text) : null;
  });
  ipcMain.on('voice:hush', () => speech.hush());
  ipcMain.on('voice:recording', (_e, on) => {
    recording = on === true;
    if (menu && !menu.isDestroyed()) menu.webContents.send('menu:recording', recording);
  });
  ipcMain.on('voice:level', (_e, level) => {
    if (menu && !menu.isDestroyed() && menu.isVisible()) menu.webContents.send('menu:level', Number(level) || 0);
  });
  ipcMain.on('gpu:lost', () => reviveCharacter('WebGL context lost'));
  ipcMain.handle('voice:turn', async (_e, wav) => {
    const buf = Buffer.isBuffer(wav) ? wav
      : wav instanceof ArrayBuffer ? Buffer.from(wav)
      : ArrayBuffer.isView(wav) ? Buffer.from(wav.buffer, wav.byteOffset, wav.byteLength)
      : null;
    if (!buf || buf.length < 1000) return { ok: false, error: 'Пустая запись.' };
    try {
      const r = await transcribe(buf.toString('base64'), 'audio/wav', 'audio.wav');
      if (r.ok && r.text) pushChat(r.text);
      return { ok: r.ok, text: r.text || '', error: r.error };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  });
  ipcMain.handle('desktop:windows', () => []);
  ipcMain.handle('desktop:windowBounds', () => null);
  ipcMain.handle('desktop:perch', () => ({ ok: false, error: 'Недоступно.' }));
  // Card previews rendered by the character window (render_preview / ensurePreview).
  ipcMain.handle('preview:exists', (_e, id) => typeof id === 'string' && MODEL_ID.test(id) && hasPreview(id));
  ipcMain.handle('preview:upload', (_e, id, png) => {
    if (typeof id !== 'string' || !MODEL_ID.test(id)) return { ok: false, error: 'Некорректный id модели.' };
    const dir = path.join(MODELS_DIR, id);
    const buffer = Buffer.isBuffer(png) ? png : png instanceof ArrayBuffer ? Buffer.from(png) : ArrayBuffer.isView(png) ? Buffer.from(png.buffer, png.byteOffset, png.byteLength) : null;
    if (!buffer || !buffer.length || !fs.existsSync(dir)) return { ok: false, error: 'Нет данных превью.' };
    fs.writeFileSync(path.join(dir, 'preview.png'), buffer);
    return { ok: true };
  });
}

// ---- the agent's answers: bubble and voice ----
let front = null;                                                // the chat shown in the bubble: { id, done, at }
function speakMessage(body) {
  const session = typeof body.session === 'string' ? body.session.slice(0, 200) : '';   // '' = the live2d_speak tool
  const text = String(body.text || ''), final = body.final !== false;
  // phase: connecting | thinking | tool | answer | error | idle (drives the orb + dots), end = the turn is over
  const phase = typeof body.phase === 'string' && body.phase ? body.phase : 'answer';
  const status = typeof body.status === 'string' ? body.status : '';
  if (session) {
    if (body.turn === true) speech.turn(session);
    if (phase === 'end') speech.end(session);
    else if (phase === 'answer') speech.feed(session, text, final, !aloud());
    else speech.step(session);
  } else if (text && aloud()) speech.line(text);
  if (!bubble || bubble.isDestroyed()) return;
  if (session) {                                                 // two agents at once: the bubble stays with the one asked last
    const now = Date.now();
    if (body.turn === true || !front || front.done || front.id === session || now - front.at > 60000) front = { id: session, done: phase === 'end', at: now };
    else return;
  }
  if (phase === 'end' || phase === 'idle') {
    // Turn ended: keep a shown answer (bubble.js hides it on its own timer), clear one stuck in thinking/tool.
    if (lastBubblePhase !== 'answer' && lastBubblePhase !== 'error') bubble.hide();
  } else if (speechBubble.enabled && (text || status) && character && character.isVisible()) {
    lastBubblePhase = phase;
    placeBubble();
    bubble.webContents.send('bubble:speech', { text, final, phase, status, style: bubbleStyle() });
    if (!bubble.isVisible()) bubble.showInactive();
  } else {
    bubble.hide();
  }
}

// ---- HTTP control server ----
// Only the plugin that started this process may drive it: it passes a random token in the environment.
// Web pages cannot send the header (and any request with an Origin is refused).
const TOKEN = process.env.AMADEUS_TOKEN || randomBytes(24).toString('hex');
delete process.env.AMADEUS_TOKEN;
function allowed(req) {
  const got = Buffer.from(String(req.headers['x-amadeus-token'] || '')), want = Buffer.from(TOKEN);
  return !req.headers.origin && got.length === want.length && timingSafeEqual(got, want);
}
const server = http.createServer((req, res) => {
  const json = (code, obj) => { if (res.headersSent || res.destroyed) return; res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(obj)); };
  if (!allowed(req)) { req.resume(); json(403, { ok: false, error: 'forbidden' }); return; }
  const readBody = () => new Promise((resolve) => {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', (c) => { raw += c; if (raw.length > 32 * 1024 * 1024) req.destroy(); });
    req.on('end', () => { try { const v = raw ? JSON.parse(raw) : {}; resolve(v && typeof v === 'object' ? v : {}); } catch { resolve({}); } });
    req.on('close', () => resolve({}));
  });
  const route = String(req.url || '/').split('?')[0];
  (async () => {
    const body = await readBody();
    if (req.method === 'POST' && route === '/command') {
      try {
        // Accept two shapes: {name,args} (agent tools) and {action,...} (client card buttons).
        // NOTE: check `action` FIRST — the emotion card button sends {action:"set_expression",
        // name:"捂脸"} where `name` is the EXPRESSION name (not the command name), so
        // `body.name || body.action` would wrongly pick the expression name as the command.
        const name = body.action || body.name;
        let args = body.args || {};
        if (body.action) { args = {}; for (const k in body) if (k !== 'action') args[k] = body[k]; }
        const result = await commandResult({ name, args }, 15000);
        json(200, { ok: true, result });
      }
      catch (e) { json(200, { ok: false, error: String((e && e.message) || e) }); }
    } else if (req.method === 'POST' && route === '/load_model') {
      try { const result = await loadModel(body.id); json(200, { ok: true, result }); }
      catch (e) { json(200, { ok: false, error: String((e && e.message) || e) }); }
    } else if (req.method === 'GET' && route === '/list_models') {
      json(200, { ok: true, models: listModelsFull() });
    } else if (req.method === 'GET' && route === '/list_actions') {
      json(200, { ok: true, result: listActions() });
    } else if (req.method === 'GET' && route === '/active') {
      json(200, { ok: true, active: activeModelId });
    } else if (req.method === 'POST' && route === '/select') {
      try { const result = await loadModel(body.id); json(200, { ok: result.ok, id: result.ok ? body.id : '', error: result.error }); }
      catch (e) { json(200, { ok: false, error: String((e && e.message) || e) }); }
    } else if (req.method === 'POST' && route === '/remove') {
      try {
        const id = body.id;
        if (typeof id !== 'string' || !MODEL_ID.test(id)) throw new Error('Некорректный id модели.');
        fs.rmSync(path.join(MODELS_DIR, id), { recursive: true, force: true });
        if (activeModelId === id) { activeModelId = ''; persist(); quiet(); toCharacter('link:settings', settings()); }   // she leaves the screen too
        json(200, { ok: true });
      } catch (e) { json(200, { ok: false, error: String((e && e.message) || e) }); }
    } else if (req.method === 'POST' && route === '/speak') {
      speakMessage(body);
      json(200, { ok: true });
    } else if (req.method === 'POST' && route === '/wait_ready') {
      try { const result = await waitReady(body.timeoutMs || 20000); json(200, { ok: true, result }); }
      catch (e) { json(200, { ok: false, error: String((e && e.message) || e) }); }
    } else if (req.method === 'GET' && route === '/settings') {
      json(200, publicSettings());
    } else if (req.method === 'POST' && route === '/settings') {
      try { json(200, applySettingsPatch(body)); }
      catch (e) { json(200, { ok: false, error: String((e && e.message) || e) }); }
    } else if (req.method === 'POST' && route === '/voice-import') {
      try { json(200, await importVoice(body)); }
      catch (e) { json(200, { ok: false, error: String((e && e.message) || e) }); }
    } else if (req.method === 'POST' && route === '/provider') {
      if (typeof body.key === 'string' && body.key) process.env.LITELLM_API_KEY = body.key;
      json(200, { ok: true });
    } else if (req.method === 'POST' && route === '/transcribe') {
      try { json(200, await transcribe(body.data, body.type, body.filename)); }
      catch (e) { json(200, { ok: false, error: String((e && e.message) || e) }); }
    } else if (req.method === 'POST' && route === '/import') {
      const paths = Array.isArray(body.paths) ? body.paths.filter((p) => typeof p === 'string' && p) : [];
      if (!paths.length) json(200, { ok: false, error: 'Нечего импортировать.' });
      else json(200, await runImport(paths));
    } else if (req.method === 'POST' && route === '/import_dialog') {
      const folder = body.kind === 'folder';
      const picked = await dialog.showOpenDialog({
        title: folder ? 'Папка с моделью Live2D' : 'Архив с моделью Live2D',
        defaultPath: app.getPath('downloads'),
        properties: folder ? ['openDirectory', 'multiSelections'] : ['openFile', 'multiSelections'],
        filters: folder ? [] : [{ name: 'Архивы с моделями', extensions: ['zip', 'rar', '7z'] }],
      });
      if (picked.canceled || !picked.filePaths.length) json(200, { ok: true, canceled: true, results: [] });
      else json(200, await runImport(picked.filePaths));
    } else if (req.method === 'POST' && route === '/relabel') {
      try {
        if (typeof body.id !== 'string' || !MODEL_ID.test(body.id)) throw new Error('Некорректный id модели.');
        json(200, { ok: true, ...importer.relabel(path.join(MODELS_DIR, body.id)) });
      } catch (e) { json(200, { ok: false, error: String((e && e.message) || e) }); }
    } else if (req.method === 'POST' && route === '/rename') {
      try { json(200, renameLabels(body)); }
      catch (e) { json(200, { ok: false, error: String((e && e.message) || e) }); }
    } else if (req.method === 'GET' && route === '/ping') {
      json(200, { ok: true, pong: true });
    } else if (req.method === 'GET' && route === '/chat-message') {
      json(200, { ok: true, text: nextChat() });
    } else if (req.method === 'POST' && route === '/shutdown') {
      json(200, { ok: true });
      setTimeout(() => app.quit(), 150);
    } else {
      json(404, { ok: false, error: 'not found: ' + req.method + ' ' + route });
    }
  })().catch((e) => json(200, { ok: false, error: String((e && e.message) || e) }));
});

app.whenReady().then(() => {
  protocol.handle(SCHEME, async (req) => {
    try {
      const u = new URL(req.url);
      // Chromium parses all-numeric standard-scheme hostnames as IPv4 dotted-quads
      // (e.g. "11" -> "0.0.0.11"), so map those back to the numeric model id.
      const numeric = /^0\.0\.0\.(\d+)$/.exec(u.hostname);
      const id = numeric ? numeric[1] : u.hostname;
      const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '');
      const base = path.join(MODELS_DIR, id);
      const file = path.join(base, path.normalize(rel));
      if (!file.startsWith(base + path.sep) && file !== base) return new Response('Forbidden', { status: 403 });
      return await modelFileResponse(file);
    } catch (e) {
      process.stderr.write(`[live2d:proto] ERROR ${e && e.message}\n`);
      return new Response('Bad request', { status: 400 });
    }
  });
  registerIpc();
  createCharacterWindow();
  createBubbleWindow();
  createMenuWindow();
  server.listen(0, '127.0.0.1', () => {
    const port = server.address().port;
    process.stdout.write(JSON.stringify({ type: 'ready', port }) + '\n');
  });
  restoreActiveModel();
  watchParent();
});

/** Show the character that was on screen before the restart. */
async function restoreActiveModel() {
  const id = activeModelId;
  if (!id || !fs.existsSync(path.join(MODELS_DIR, id, 'character.json'))) { activeModelId = ''; return; }
  if (!(await waitReady(30000))) return;
  try { await loadModel(id); } catch (e) { process.stderr.write(`[live2d] restore failed: ${e && e.message}\n`); }
}

/** Quit together with the DSH host that spawned us (otherwise the windows outlive it). */
function watchParent() {
  const parent = Number(process.env.AMADEUS_PARENT_PID);
  if (!Number.isInteger(parent) || parent <= 0) return;
  setInterval(() => {
    try { process.kill(parent, 0); } catch { app.quit(); }
  }, 5000).unref();
}
