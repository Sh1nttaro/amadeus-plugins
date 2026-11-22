// amadeus-live3d companion — a "living" 3D VRM desktop companion (Electron sidecar).
// One transparent click-through overlay covers the work area of the primary display;
// the character walks, jumps, sits on window edges, can be grabbed and thrown, sleeps,
// and talks (speech bubble) — see renderer/pet.js. The DSH plugin spawns this app,
// reads the control port from stdout and drives it over HTTP:
//   stdout:  { "type": "ready", "port": <N> }
//   POST /command { name, args }       renderer command (gesture, emotion, action, …)
//   GET  /list | /active | /settings   POST /select | /remove | /settings | /speak
//   POST /import { paths } | /import_dialog { kind } | /animations/assign { file, role }
'use strict';

const { app, BrowserWindow, ipcMain, protocol, screen, dialog, Menu, powerMonitor } = require('electron');
const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { spawn } = require('child_process');
const os = require('os');
const { ARCHIVE_EXT, extractArchive, walkFiles } = require('./archive');
const { unityPackageAnims, parseAnim } = require('./unity');

const RENDERER_DIR = path.join(__dirname, 'renderer');
const MODELS_DIR = path.join(__dirname, 'models');
const ANIM_DIR = path.join(__dirname, 'animations');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');
const SCHEME = 'amadeus-3d';
const MODEL_ID = /^[A-Za-z0-9._-]+$/;
const ANIM_ROLES = ['idle', 'walk', 'sit', 'sit_edge', 'sleep', 'wave', 'dance', 'stretch', 'think', 'happy', 'sad', 'angry', 'surprised', 'jump', 'fall', 'land', 'held', 'talk', 'typing', 'pose', 'extra'];

protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true, bypassCSP: true } },
]);
// Ignore GPU blocklists: the overlay is WebGL and must run even on "unsupported" drivers.
app.commandLine.appendSwitch('ignore-gpu-blocklist');

// ---------------------------------------------------------------- settings
const settings = {
  activeModelId: '',
  hidden: false,
  control: 'agent',                  // who decides what she does: 'agent' (the DSH agent, via tools) | 'self' (her own idle life)
  height: 340,                       // character height on screen, px
  quality: 'high',                   // render scale: normal | high | ultra
  shadeTint: 'neutral',              // shade colour of clothes: neutral (grey) | author (VRoid lilac)
  behaviors: { walk: true, climb: true, sleep: true, cursor: true, hideFullscreen: true, physics: true },
  speechBubble: { enabled: true, mode: 'bubble', hideAfter: 10, backgroundColor: '#211e2a', fontColor: '#f5f3fa', opacity: 0.94, fontSize: 14, orb: {} },
  clipRoles: {},                     // animation file -> role
  // voice like live2D: Kokoro-ru neural voices (sveta / masha / dima / imported .bin), Windows voices as a fallback
  voice: { enabled: false, muted: false, edgeVoice: 'ru-RU-SvetlanaNeural', edgeRate: 10, edgePitch: 15, engine: 'kokoro', kokoroVoice: 'sveta', speed: 1, voice: '', rate: 1, pitch: 1.05, volume: 0.9, reactions: true },
  voiceDevices: { inputDeviceId: '', outputDeviceId: '', inputVolume: 100, outputVolume: 70 },
  radio: false,                                                // push-to-talk button in the settings
  // bubble (portrait) mode: head and shoulders in a round frame in a corner, like Kyndred's watch & play
  portrait: { enabled: false, auto: true, size: 220, x: -1, y: -1 },
  // hands-free: always listening, phrases with her name go to the agent with a note on the screen
  listen: { enabled: false, wake: 'алиса', screen: true, follow: true },
  touch: { enabled: true, lines: true },                       // pat / boop / poke reactions and their little phrases
  look: { shadow: true, rim: true, symbols: true },             // contact shadow under the feet, soft rim light, emotion symbols
};
function sanitizeVoice(p) {
  const out = {};
  for (const k of ['enabled', 'reactions', 'muted']) if (typeof p[k] === 'boolean') out[k] = p[k];
  if (typeof p.voice === 'string') out.voice = p.voice.slice(0, 200);
  if (p.engine === 'kokoro' || p.engine === 'windows' || p.engine === 'edge') out.engine = p.engine;
  if (typeof p.edgeVoice === 'string' && /^[a-z]{2}-[A-Z]{2}-[A-Za-z]+Neural$/.test(p.edgeVoice)) out.edgeVoice = p.edgeVoice;
  if (typeof p.edgeRate === 'number' && isFinite(p.edgeRate)) out.edgeRate = clamp(Math.round(p.edgeRate), -50, 50);
  if (typeof p.edgePitch === 'number' && isFinite(p.edgePitch)) out.edgePitch = clamp(Math.round(p.edgePitch), -50, 50);
  if (typeof p.kokoroVoice === 'string' && /^[a-z0-9_-]{1,40}$/i.test(p.kokoroVoice)) out.kokoroVoice = p.kokoroVoice;
  if (typeof p.speed === 'number' && isFinite(p.speed)) out.speed = clamp(p.speed, 0.5, 2);
  if (typeof p.rate === 'number' && isFinite(p.rate)) out.rate = clamp(p.rate, 0.5, 2);
  if (typeof p.pitch === 'number' && isFinite(p.pitch)) out.pitch = clamp(p.pitch, 0.5, 2);
  if (typeof p.volume === 'number' && isFinite(p.volume)) out.volume = clamp(p.volume, 0, 1);
  return out;
}
function sanitizeDevices(p) {
  const out = {};
  for (const k of ['inputDeviceId', 'outputDeviceId']) if (typeof p[k] === 'string') out[k] = p[k].slice(0, 300);
  for (const k of ['inputVolume', 'outputVolume']) if (typeof p[k] === 'number' && isFinite(p[k])) out[k] = clamp(Math.round(p[k]), 0, 100);
  return out;
}
function sanitizeListen(p) {
  const out = pickBools(p, ['enabled', 'screen', 'follow']);
  if (typeof p.wake === 'string') { const w = p.wake.toLowerCase().replace(/[^a-zа-яё ]/gi, '').trim().slice(0, 24); if (w.length >= 3) out.wake = w; }
  return out;
}
function sanitizePortrait(p) {
  const out = pickBools(p, ['enabled', 'auto']);
  if (typeof p.size === 'number' && isFinite(p.size)) out.size = clamp(Math.round(p.size), 120, 520);
  for (const k of ['x', 'y']) if (typeof p[k] === 'number' && isFinite(p[k])) out[k] = Math.round(p[k]);
  return out;
}
const pickBools = (p, keys) => { const out = {}; for (const k of keys) if (p && typeof p[k] === 'boolean') out[k] = p[k]; return out; };
function loadSettings() {
  try {
    const d = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
    if (typeof d.activeModelId === 'string' && MODEL_ID.test(d.activeModelId)) settings.activeModelId = d.activeModelId;
    if (typeof d.hidden === 'boolean') settings.hidden = d.hidden;
    if (d.control === 'agent' || d.control === 'self') settings.control = d.control;
    if (typeof d.height === 'number' && isFinite(d.height)) settings.height = clamp(d.height, 160, 900);
    if (['normal', 'high', 'ultra'].includes(d.quality)) settings.quality = d.quality;
    if (['neutral', 'author'].includes(d.shadeTint)) settings.shadeTint = d.shadeTint;
    if (d.behaviors && typeof d.behaviors === 'object') for (const k of Object.keys(settings.behaviors)) if (typeof d.behaviors[k] === 'boolean') settings.behaviors[k] = d.behaviors[k];
    if (d.speechBubble && typeof d.speechBubble === 'object') Object.assign(settings.speechBubble, sanitizeBubble(d.speechBubble));
    if (d.clipRoles && typeof d.clipRoles === 'object') for (const [f, r] of Object.entries(d.clipRoles)) if (ANIM_ROLES.includes(r)) settings.clipRoles[f] = r;
    if (d.voice && typeof d.voice === 'object') Object.assign(settings.voice, sanitizeVoice(d.voice));
    Object.assign(settings.touch, pickBools(d.touch, ['enabled', 'lines']));
    Object.assign(settings.look, pickBools(d.look, ['shadow', 'rim', 'symbols']));
    if (d.voiceDevices && typeof d.voiceDevices === 'object') Object.assign(settings.voiceDevices, sanitizeDevices(d.voiceDevices));
    if (typeof d.radio === 'boolean') settings.radio = d.radio;
    if (d.portrait && typeof d.portrait === 'object') Object.assign(settings.portrait, sanitizePortrait(d.portrait));
    if (d.listen && typeof d.listen === 'object') Object.assign(settings.listen, sanitizeListen(d.listen));
  } catch {}
}
function saveSettings() {
  try { fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2)); } catch {}
}
function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
function sanitizeBubble(p) {
  const out = {};
  if (typeof p.enabled === 'boolean') out.enabled = p.enabled;
  if (p.mode === 'orb' || p.mode === 'bubble' || p.mode === 'subtitles') out.mode = p.mode;
  if (typeof p.hideAfter === 'number' && isFinite(p.hideAfter)) out.hideAfter = clamp(Math.round(p.hideAfter), 0, 600);
  for (const k of ['backgroundColor', 'fontColor']) if (typeof p[k] === 'string' && /^#[0-9a-fA-F]{6}$/.test(p[k])) out[k] = p[k];
  if (typeof p.opacity === 'number' && isFinite(p.opacity)) out.opacity = clamp(p.opacity, 0.3, 1);
  if (typeof p.fontSize === 'number' && isFinite(p.fontSize)) out.fontSize = clamp(Math.round(p.fontSize), 10, 32);
  if (p.orb && typeof p.orb === 'object') out.orb = p.orb;
  return out;
}
function publicSettings() {
  return { ok: true, ...JSON.parse(JSON.stringify(settings)), roles: ANIM_ROLES, voices: kokoroVoices() };
}
function applySettingsPatch(p) {
  if (!p || typeof p !== 'object') return publicSettings();
  if (typeof p.hidden === 'boolean') settings.hidden = p.hidden;
  if (p.control === 'agent' || p.control === 'self') settings.control = p.control;
  if (typeof p.height === 'number' && isFinite(p.height)) settings.height = clamp(Math.round(p.height), 160, 900);
  if (['normal', 'high', 'ultra'].includes(p.quality)) settings.quality = p.quality;
  if (['neutral', 'author'].includes(p.shadeTint)) settings.shadeTint = p.shadeTint;
  if (p.behaviors && typeof p.behaviors === 'object') for (const k of Object.keys(settings.behaviors)) if (typeof p.behaviors[k] === 'boolean') settings.behaviors[k] = p.behaviors[k];
  if (p.speechBubble && typeof p.speechBubble === 'object') Object.assign(settings.speechBubble, sanitizeBubble(p.speechBubble));
  if (p.voice && typeof p.voice === 'object') { Object.assign(settings.voice, sanitizeVoice(p.voice)); kokoroWarm(); }
  Object.assign(settings.touch, pickBools(p.touch, ['enabled', 'lines']));
  Object.assign(settings.look, pickBools(p.look, ['shadow', 'rim', 'symbols']));
  if (p.voiceDevices && typeof p.voiceDevices === 'object') Object.assign(settings.voiceDevices, sanitizeDevices(p.voiceDevices));
  if (typeof p.radio === 'boolean') settings.radio = p.radio;
  if (p.portrait && typeof p.portrait === 'object') Object.assign(settings.portrait, sanitizePortrait(p.portrait));
  if (p.listen && typeof p.listen === 'object') { Object.assign(settings.listen, sanitizeListen(p.listen)); if (settings.listen.enabled && !process.env.LITELLM_API_KEY) sttEnsure(1).catch(() => {}); }
  saveSettings();
  pushSettings();
  return publicSettings();
}
function pushSettings() {
  if (win && !win.isDestroyed()) win.webContents.send('pet:settings', { ...settings, animations: listAnimations() });
  if (win && !win.isDestroyed()) { if (settings.hidden) win.hide(); else if (!win.isVisible()) win.showInactive(); }
}

// ---------------------------------------------------------------- voice (same pipeline as live2D)
// TTS: Kokoro-ru, a local Python server (W:\amadeus-v2\live2d\speech) shared with the live2D
// companion on port 58321 — reused when live2D already started it. STT: Whisper via LiteLLM.
const KOKORO_PORT = 58321;
let kokoroProcess = null;
function kokoroRoot() { return process.env.AMADEUS_SPEECH_ROOT || 'W:\\amadeus-v2\\live2d'; }
function kokoroPython() {
  for (const c of [process.env.AMADEUS_PYTHON, 'W:\\live2D-character\\.venv\\Scripts\\python.exe']) if (c && fs.existsSync(c)) return c;
  return 'python.exe';
}
function kokoroVoices() {
  const out = ['sveta', 'masha', 'dima'];
  try {
    for (const f of fs.readdirSync(path.join(kokoroRoot(), 'speech', 'voices'))) {
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
        kokoroProcess = spawn(kokoroPython(), ['-m', 'speech.server', String(KOKORO_PORT)], { cwd: kokoroRoot(), stdio: 'ignore', windowsHide: true });
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
async function kokoroSynthesize(text, voice, speed) {
  const port = await kokoroEnsure();
  const res = await fetch(`http://127.0.0.1:${port}/synthesize`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, voice: kokoroVoices().includes(voice) ? voice : 'sveta', speed: clamp(Number(speed) || 1, 0.5, 2) }),
    signal: AbortSignal.timeout(120000),
  });
  if (res.ok) return await res.arrayBuffer();
  const error = await res.json().catch(() => ({}));
  throw new Error(error.error || `tts http ${res.status}`);
}
// ---------------------------------------------------------------- Edge neural voices (online)
// Microsoft's voices through edge-tts in a small local Python server: lively intonation, tempo and
// pitch adjustable. Russian: Svetlana, Dmitry; multilingual Ava and Emma speak Russian too.
const EDGE_PORT = 58323;
const EDGE_VOICES = ['ru-RU-SvetlanaNeural', 'ru-RU-DmitryNeural', 'en-US-AvaMultilingualNeural', 'en-US-EmmaMultilingualNeural'];
let edgeProcess = null;
function edgePython() {
  for (const c of [process.env.AMADEUS_TTS_PYTHON, 'W:\\amadeus-v2\\tts\\.venv\\Scripts\\python.exe']) if (c && fs.existsSync(c)) return c;
  return null;
}
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
        edgeProcess = spawn(py, [path.join(__dirname, 'tts_edge_server.py'), String(EDGE_PORT)], { stdio: 'ignore', windowsHide: true });
        edgeProcess.on('error', () => {});
      }
      const deadline = Date.now() + 15000;
      while (Date.now() < deadline) { if (await edgeHealthy()) return true; await new Promise((r) => setTimeout(r, 250)); }
      return false;
    })().finally(() => { edgeStarting = null; });
  }
  return edgeStarting;
}
async function edgeSynthesize(text, voice, rate, pitch) {
  if (!(await edgeEnsure())) throw new Error('Edge-голоса недоступны (нет окружения W:\\amadeus-v2\\tts).');
  const res = await fetch(`http://127.0.0.1:${EDGE_PORT}/synthesize`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, voice: EDGE_VOICES.includes(voice) ? voice : EDGE_VOICES[0], rate: clamp(Number(rate) || 0, -50, 50), pitch: clamp(Number(pitch) || 0, -50, 50) }),
    signal: AbortSignal.timeout(30000),
  });
  if (res.ok) return await res.arrayBuffer();
  const error = await res.json().catch(() => ({}));
  throw new Error(error.error || `edge http ${res.status}`);
}
async function transcribe(dataB64, type, filename) {
  if (typeof dataB64 !== 'string' || !dataB64) return { ok: false, error: 'Нет аудиоданных.' };
  const baseUrl = (process.env.LITELLM_BASE_URL || 'https://litellm.sdvor.duckdns.org/v1').replace(/\/+$/, '');
  const apiKey = process.env.LITELLM_API_KEY || '';
  const buf = Buffer.from(dataB64, 'base64');
  if (buf.length < 1000) return { ok: false, error: 'Аудио слишком короткое.' };
  const mime = typeof type === 'string' && type ? type : 'audio/wav';
  const fd = new FormData();
  fd.append('model', 'groq/whisper-large-v3-turbo');
  fd.append('file', new Blob([buf], { type: mime }), typeof filename === 'string' && filename ? filename : (mime.includes('webm') ? 'audio.webm' : 'audio.wav'));
  const headers = {};
  if (apiKey) headers.authorization = `Bearer ${apiKey}`;
  const res = await fetch(`${baseUrl}/audio/transcriptions`, { method: 'POST', headers, body: fd, signal: AbortSignal.timeout(60000) });
  if (!res.ok) return { ok: false, error: `stt http ${res.status}` };
  const j = await res.json().catch(() => ({}));
  return { ok: true, text: String(j.text || '').trim() };
}
async function importVoice(body) {
  const name = String((body && body.name) || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 40);
  if (!name || typeof body.data !== 'string') return { ok: false, error: 'Нужны имя и данные .bin.' };
  const buf = Buffer.from(body.data, 'base64');
  if (buf.length < 1000) return { ok: false, error: 'Файл голоса пустой.' };
  const dir = path.join(kokoroRoot(), 'speech', 'voices');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name + '.bin'), buf);
  try {
    if (await kokoroHealthy()) await fetch(`http://127.0.0.1:${KOKORO_PORT}/voices`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name }) });
  } catch {}
  return { ok: true, name, voices: kokoroVoices() };
}
const pendingChat = [];                                         // recognised speech for the DSH composer: { text, send }
// ---------------------------------------------------------------- hands-free: "Алиса, …" goes to the agent
// The renderer listens all the time (voice activity detection) and sends each phrase here. A phrase
// that names her ("Алиса, глянь…") — or any phrase right after she answered — is recognised, gets a
// short note with what is in the foreground window, and is sent to the DSH chat by itself.
const STT_PORT = 58322;
let sttProcess = null;
function sttPython() {
  for (const c of [process.env.AMADEUS_STT_PYTHON, 'W:\\amadeus-v2\\stt\\.venv\\Scripts\\python.exe']) if (c && fs.existsSync(c)) return c;
  return null;
}
async function sttState() {
  try { const r = await fetch(`http://127.0.0.1:${STT_PORT}/health`, { signal: AbortSignal.timeout(800) }); const j = await r.json(); return j.ready ? 'ready' : 'loading'; } catch { return ''; }
}
async function sttEnsure(waitMs = 60000) {
  let st = await sttState();
  if (st === 'ready') return true;
  if (!st && (!sttProcess || sttProcess.exitCode !== null)) {
    const py = sttPython();
    if (!py) return false;
    sttProcess = spawn(py, [path.join(__dirname, 'stt_server.py'), String(STT_PORT), path.resolve(py, '..', '..', '..', 'models')], { stdio: 'ignore', windowsHide: true });
    sttProcess.on('error', () => {});
  }
  const deadline = Date.now() + waitMs;
  while (Date.now() < deadline) { if ((await sttState()) === 'ready') return true; await new Promise((r) => setTimeout(r, 400)); }
  return false;
}
const STT_HINT = 'Разговор с Алисой.';
async function transcribeLocal(buf) {
  if (!(await sttEnsure())) return { ok: false, error: 'Локальное распознавание недоступно.' };
  const r = await fetch(`http://127.0.0.1:${STT_PORT}/transcribe`, { method: 'POST', headers: { 'content-type': 'audio/wav', 'x-hint': Buffer.from(STT_HINT).toString('hex') }, body: buf, signal: AbortSignal.timeout(30000) });
  const j = await r.json().catch(() => ({}));
  return { ok: !!j.ok, text: String(j.text || '').trim(), error: j.error, via: 'local' };
}
/** The DSH provider (LiteLLM Whisper) when its key is there, the local faster-whisper otherwise. */
async function transcribeAny(buf) {
  if (process.env.LITELLM_API_KEY) {
    try { const r = await transcribe(buf.toString('base64'), 'audio/wav', 'audio.wav'); if (r.ok) return { ...r, via: 'provider' }; } catch {}
  }
  return transcribeLocal(buf);
}
function wakeNames() {
  const w = String(settings.listen.wake || 'алиса').toLowerCase().trim();
  const extra = w === 'алиса' ? ['алис', 'alice', 'элис', 'олис'] : [];
  return [w, ...extra].filter(Boolean);
}
/** The phrase without her name, or null when she was not addressed. */
function addressed(text) {
  const t = String(text || '').trim();
  const words = t.split(/\s+/);
  const names = wakeNames();
  for (let i = 0; i < words.length; i++) {
    const w = words[i].toLowerCase().replace(/[^a-zа-яё]/gi, '');
    if (w.length >= 3 && names.some((n) => w.startsWith(n.slice(0, Math.max(4, n.length - 1))))) {
      words.splice(i, 1);
      return words.join(' ').replace(/^[\s,.!?;:—-]+/, '').replace(/\s+([,.!?])/g, '$1').trim();
    }
  }
  return null;
}
const PRIVATE_WINDOW = /пароль|password|bitwarden|1password|keepass|lastpass|банк|bank|сбер|тинькофф|tinkoff|альфа|vtb|втб|инкогнито|incognito|inprivate|private browsing|приватн/i;
let lastWorld = null;
function windowText(hwnd) {
  return new Promise((resolve) => {
    let out = '';
    const ps = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'window-text.ps1'), String(hwnd)], { windowsHide: true, stdio: ['ignore', 'pipe', 'ignore'] });
    const t = setTimeout(() => { try { ps.kill(); } catch {} resolve(null); }, 4000);
    ps.stdout.setEncoding('utf8');
    ps.stdout.on('data', (d) => { out += d; });
    ps.on('exit', () => { clearTimeout(t); try { resolve(JSON.parse(out.trim())); } catch { resolve(null); } });
    ps.on('error', () => { clearTimeout(t); resolve(null); });
  });
}
/** A short note on what the user is looking at: the foreground window title and its text. */
async function screenNote() {
  if (!settings.listen.screen || !lastWorld) return '';
  const fg = (lastWorld.windows || []).find((w) => w.id === lastWorld.fg);
  if (!fg || /deepseek harness/i.test(fg.title)) return '';
  if (PRIVATE_WINDOW.test(fg.title)) return 'на экране: личное окно (не читаю)';
  const info = await windowText(fg.id);
  let text = info && info.text ? String(info.text) : '';
  if (PRIVATE_WINDOW.test(text.slice(0, 400))) text = '';
  text = text.replace(/[￼�​]/g, ' ').replace(/(Закладки|Сохраненные группы вкладок|Bookmarks|Saved tab groups)/g, ' ').replace(/(\s*\|\s*)+/g, ' | ').replace(/\s+/g, ' ').replace(/^[\s|]+|[\s|]+$/g, '').trim().slice(0, 1500);
  return 'на экране: «' + fg.title.slice(0, 140) + '»' + (info && info.app ? ' (' + info.app + ')' : '') + (text ? ' — ' + text : '');
}
async function listenPhrase(buf, follow) {
  if (!buf || buf.length < 8000) return { ok: true, heard: '', sent: false };
  const notePromise = settings.listen.screen ? screenNote().catch(() => '') : Promise.resolve('');
  const r = await transcribeAny(buf);
  if (!r.ok) return { ok: false, error: r.error || 'не распознано' };
  const heard = r.text;
  if (!heard || heard.replace(/[^a-zа-яё]/gi, '').length < 2) return { ok: true, heard: '', sent: false };
  let phrase = addressed(heard);
  if (phrase === null && follow) phrase = heard;
  if (phrase === null || phrase.replace(/[^a-zа-яё]/gi, '').length < 2) return { ok: true, heard, sent: false, via: r.via };
  const note = await notePromise;
  const text = phrase + '\n\n[🎙 голосом через компаньона' + (note ? ' · ' + note : '') + ']';
  pendingChat.push({ text, send: true });
  return { ok: true, heard, phrase, sent: true, via: r.via };
}

/** The first synthesis loads the model (~30 s): do it in the background as soon as the voice is on. */
let kokoroWarmed = false;
function kokoroWarm() {
  if (kokoroWarmed || !settings.voice.enabled || settings.voice.engine === 'windows') return;
  kokoroWarmed = true;
  kokoroSynthesize('Привет.', settings.voice.kokoroVoice, 1).catch(() => { kokoroWarmed = false; });
}

// ---------------------------------------------------------------- models
function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, '')); }
function modelInfo(id) {
  const dir = path.join(MODELS_DIR, id);
  let meta = {};
  try { meta = readJson(path.join(dir, 'character.json')); } catch {}
  let file = meta.file;
  if (!file || !fs.existsSync(path.join(dir, file))) {
    try { file = fs.readdirSync(dir).find((f) => /\.(vrm|glb|gltf)$/i.test(f)); } catch { file = null; }
  }
  if (!file) return null;
  return {
    id,
    name: meta.displayName || id,
    file,
    author: meta.author || '',
    version: meta.vrmVersion || '',
    license: meta.license || '',
    expressions: meta.expressions || [],
    preview: fs.existsSync(path.join(dir, 'preview.png')) ? '/amadeus-live3d/preview/' + id : '',
  };
}
function listModels() {
  try {
    return fs.readdirSync(MODELS_DIR, { withFileTypes: true }).filter((e) => e.isDirectory() && MODEL_ID.test(e.name)).map((e) => modelInfo(e.name)).filter(Boolean);
  } catch { return []; }
}
function idPart(value) {
  const s = String(value).normalize('NFKD').replace(/[^\x00-\x7f]/g, '').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^[._-]+|[._-]+$/g, '').slice(0, 40);
  return s.length >= 2 ? s : 'vrm-' + crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 10);
}

/** Read the glTF JSON chunk of a .vrm/.glb to get the name, author, license and expressions. */
function vrmMeta(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const head = Buffer.alloc(20);
    fs.readSync(fd, head, 0, 20, 0);
    if (head.toString('latin1', 0, 4) !== 'glTF') throw new Error('Это не VRM/GLB файл.');
    const len = head.readUInt32LE(12);
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, 20);
    const json = JSON.parse(buf.toString('utf8'));
    const ext = json.extensions || {};
    if (ext.VRMC_vrm) {
      const m = ext.VRMC_vrm.meta || {};
      const ex = ext.VRMC_vrm.expressions || {};
      return { vrmVersion: '1.0', name: m.name, author: (m.authors || []).join(', '), license: [m.avatarPermission, m.commercialUsage, m.allowRedistribution === false ? 'no-redistribution' : ''].filter(Boolean).join(' · '), expressions: [...Object.keys(ex.preset || {}), ...Object.keys(ex.custom || {})] };
    }
    if (ext.VRM) {
      const m = ext.VRM.meta || {};
      const groups = (ext.VRM.blendShapeMaster || {}).blendShapeGroups || [];
      return { vrmVersion: '0.x', name: m.title, author: m.author, license: [m.allowedUserName, m.commercialUssageName, m.licenseName].filter(Boolean).join(' · '), expressions: groups.map((g) => g.presetName && g.presetName !== 'unknown' ? g.presetName : g.name).filter(Boolean) };
    }
    return { vrmVersion: '', name: '', author: '', license: '', expressions: [] };
  } finally { fs.closeSync(fd); }
}

function sha1(file) { return crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex'); }

/** VMD header check: { bones, morphs, camera } key counts, or null when it is not a VMD. */
function vmdInfo(file) {
  try {
    const buf = fs.readFileSync(file);
    const sig = buf.toString('latin1', 0, 30);
    if (!/^Vocaloid Motion Data/.test(sig)) return null;
    let o = 30 + (/0002/.test(sig) ? 20 : 10);
    const bones = buf.readUInt32LE(o); o += 4 + bones * 111;
    const morphs = o + 4 <= buf.length ? buf.readUInt32LE(o) : 0; o += 4 + morphs * 23;
    const camera = o + 4 <= buf.length ? buf.readUInt32LE(o) : 0;
    return { bones, morphs, camera };
  } catch { return null; }
}
const IMPORT_EXT = /\.(vrm|vrma|vmd|fbx|glb|unitypackage|anim)$/i;

/** Import models (.vrm/.glb), animations (.vrma/.vmd/.fbx/.glb packs) and archives with them. */
async function importFiles(paths) {
  const results = [];
  const plain = [];
  for (const src of paths) {
    if (!ARCHIVE_EXT.has(path.extname(src).toLowerCase())) { plain.push(src); continue; }
    const r = { source: path.basename(src), imported: [], skipped: [], problems: [], animations: [] };
    const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'amadeus3d-'));
    try {
      await extractArchive(src, stage);
      const files = walkFiles(stage).filter((f) => IMPORT_EXT.test(f));
      if (!files.length) r.problems.push('В архиве нет .vrm / .vrma / .vmd / .fbx.');
      const cams = files.filter((f) => /\.vmd$/i.test(f) && (vmdInfo(f) || {}).bones === 0);
      let skipped = 0;
      const base = (f) => path.basename(f).replace(/\.[^.]+$/, '').toLowerCase();
      const glbs = new Set(files.filter((f) => /\.glb$/i.test(f)).map(base));
      const pick = files
        .filter((f) => !cams.includes(f) && !(/\.fbx$/i.test(f) && glbs.has(base(f))))
        .sort((a, b) => (/large/i.test(a) - /large/i.test(b)) || a.localeCompare(b));
      for (const sub of importPlain(pick, { seen: new Set(), quiet: true })) {
        r.imported.push(...sub.imported); r.skipped.push(...sub.skipped); r.animations.push(...sub.animations);
        r.problems.push(...sub.problems.map((m) => sub.source + ': ' + m));
        skipped += sub.skippedClips || 0;
      }
      if (skipped) r.notes = ['Без подходящей роли пропущено клипов: ' + skipped + ' (бой, инструменты, плавание…). Нужный файл можно импортировать отдельно.'];
      if (cams.length) r.problems.push('Пропущено файлов камеры/мимики без движений тела: ' + cams.length + '.');
    } catch (e) { r.problems.push(e && e.message ? e.message : String(e)); }
    finally { fs.rmSync(stage, { recursive: true, force: true }); }
    results.push(r);
  }
  results.push(...importPlain(plain));
  saveSettings();
  pushSettings();
  return results;
}

function importPlain(paths, opt = {}) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
  fs.mkdirSync(ANIM_DIR, { recursive: true });
  const results = [];
  const known = new Map();
  for (const m of listModels()) {
    try { const meta = readJson(path.join(MODELS_DIR, m.id, 'character.json')); if (meta.hash) known.set(meta.hash, m); } catch {}
  }
  for (const src of paths) {
    const name = path.basename(src);
    const r = { source: name, imported: [], skipped: [], problems: [], animations: [] };
    try {
      const ext = path.extname(src).toLowerCase();
      if (ext === '.unitypackage' || ext === '.anim') {
        // Unity humanoid clips (poses from Booth etc.): muscle curves saved as JSON for the renderer
        const anims = ext === '.anim' ? [{ name, text: fs.readFileSync(src, 'utf8') }] : unityPackageAnims(src);
        const pkg = ext === '.anim' ? '' : path.basename(src, ext).replace(/[^\w.\- ()Ѐ-ӿ぀-ヿ㐀-鿿]+/g, '_') + ' - ';
        let n = 0;
        for (const a of anims) {
          const data = parseAnim(a.text);
          if (!data) continue;
          const file = (pkg + path.basename(a.name, '.anim')).replace(/[^\w.\- ()Ѐ-ӿ぀-ヿ㐀-鿿]+/g, '_') + '.uanim.json';
          fs.writeFileSync(path.join(ANIM_DIR, file), JSON.stringify(data));
          const role = guessRole(data.name, data.duration <= 0.05 ? 'pose' : 'extra');
          settings.clipRoles[file] = role;
          r.animations.push({ file, role });
          n++;
        }
        if (!n) r.problems.push('В пакете нет гуманоидных анимаций Unity (.anim).');
      } else if (ext === '.vmd') {
        const info = vmdInfo(src);
        if (!info) throw new Error('Файл повреждён или это не VMD.');
        if (!info.bones) throw new Error('В этом VMD нет движений тела (только камера или мимика).');
        const target = path.join(ANIM_DIR, name.replace(/[^\w.\- ()Ѐ-ӿ぀-ヿ㐀-鿿]+/g, '_'));
        fs.copyFileSync(src, target);
        const role = guessRole(name, 'dance');
        settings.clipRoles[path.basename(target)] = role;
        r.animations.push({ file: path.basename(target), role });
      } else if ((ext === '.vrma' || ext === '.fbx') && opt.quiet && guessRole(name) === 'extra') {
        r.skippedClips = 1;                                     // archive: combat, swimming… are left out
      } else if (ext === '.vrma' || ext === '.fbx') {
        const target = path.join(ANIM_DIR, name.replace(/[^\w.\- ()Ѐ-ӿ぀-ヿ㐀-鿿]+/g, '_'));
        fs.copyFileSync(src, target);
        const role = guessRole(name);
        settings.clipRoles[path.basename(target)] = role;
        r.animations.push({ file: path.basename(target), role });
      } else if (ext === '.glb' && !isVrmFile(src)) {
        const clips = glbClips(src);
        if (!clips.length) { if (!opt.quiet) r.problems.push('Это не VRM-модель и в файле нет анимаций.'); results.push(r); continue; }
        const fresh = opt.seen ? clips.filter((c) => !opt.seen.has(c.toLowerCase())) : clips;
        if (!fresh.length || (opt.quiet && !fresh.some((c) => guessRole(c) !== 'extra'))) { r.skippedClips = clips.length; results.push(r); continue; }
        const target = path.join(ANIM_DIR, name.replace(/[^\w.\- ()]+/g, '_'));
        fs.copyFileSync(src, target);
        for (const clip of glbClips(target)) {
          const dup = opt.seen && opt.seen.has(clip.toLowerCase());
          if (opt.seen) opt.seen.add(clip.toLowerCase());
          const role = dup ? 'extra' : guessRole(clip);
          settings.clipRoles[path.basename(target) + '#' + clip] = role;
          if (role !== 'extra') r.animations.push({ file: path.basename(target), clip, role });
        }
        if (!r.animations.length && !opt.quiet) r.problems.push('В наборе нет подходящих клипов (idle, walk, sit, dance…). Роли можно назначить вручную.');
      } else if (ext === '.vrm' || ext === '.glb') {
        const meta = vrmMeta(src);
        const hash = sha1(src);
        if (known.has(hash)) { r.skipped.push({ id: known.get(hash).id, name: known.get(hash).name }); results.push(r); continue; }
        const display = (meta.name || path.basename(src, ext)).trim().slice(0, 60) || 'VRM';
        let id = idPart(meta.name && /[a-z]/i.test(meta.name) ? meta.name : path.basename(src, ext));
        for (let n = 2; fs.existsSync(path.join(MODELS_DIR, id)); n++) id = idPart(display) + '-' + n;
        const dir = path.join(MODELS_DIR, id);
        fs.mkdirSync(dir, { recursive: true });
        fs.copyFileSync(src, path.join(dir, 'model' + ext));
        fs.writeFileSync(path.join(dir, 'character.json'), JSON.stringify({ displayName: display, file: 'model' + ext, author: meta.author, license: meta.license, vrmVersion: meta.vrmVersion, expressions: meta.expressions, source: name, hash, importedAt: new Date().toISOString() }, null, 2));
        known.set(hash, { id, name: display });
        r.imported.push({ id, name: display, author: meta.author, version: meta.vrmVersion, expressions: meta.expressions.length });
      } else {
        r.problems.push('Поддерживаются .vrm и .glb (модели), .vrma, .vmd и .fbx (анимации), архивы .zip/.rar/.7z.');
      }
    } catch (e) { r.problems.push(e && e.message ? e.message : String(e)); }
    results.push(r);
  }
  return results;
}

/** glTF JSON chunk of a .glb (or null). */
function glbJson(file) {
  try {
    const fd = fs.openSync(file, 'r');
    try {
      const head = Buffer.alloc(20);
      fs.readSync(fd, head, 0, 20, 0);
      if (head.toString('latin1', 0, 4) !== 'glTF') return null;
      const buf = Buffer.alloc(head.readUInt32LE(12));
      fs.readSync(fd, buf, 0, buf.length, 20);
      return JSON.parse(buf.toString('utf8'));
    } finally { fs.closeSync(fd); }
  } catch { return null; }
}
const clipCache = new Map();
function glbClips(file) {
  let st;
  try { st = fs.statSync(file); } catch { return []; }
  const key = file + ':' + st.mtimeMs;
  if (!clipCache.has(key)) {
    const j = glbJson(file);
    clipCache.set(key, j ? (j.animations || []).map((a) => a.name).filter((n) => n && !/t[-_ ]?pose/i.test(n)) : []);
  }
  return clipCache.get(key);
}
function isVrmFile(file) {
  const j = glbJson(file);
  return !!(j && j.extensions && (j.extensions.VRMC_vrm || j.extensions.VRM));
}

const VROID_PACK = { 1: 'pose', 2: 'wave', 3: 'pose', 4: 'extra', 5: 'dance', 6: 'pose', 7: 'extra' };   // full body, greeting, peace, shoot, spin, model pose, squat
function guessRole(file, fallback = 'extra') {
  const n = file.toLowerCase();
  const vp = n.match(/^vrma_0?([1-7])\.vrma$/);
  if (vp) return VROID_PACK[vp[1]];
  // clips that do not fit a desktop companion (combat, swimming, vehicles…)
  if (/pistol|sword|spell|swim|driv|push|death|hit_|punch|roll|sprint|jog|interact|pickup|fixing|torch|crouch|formal|_enter|_exit|aim|reload|shoot|attack|sitting_talk|jump_start|melee|ranged|bow_|magic|skeleton|fishing|lockpick|pickax|hammer|chop|dig|saw|holding_|kick|block|dodge|sneak|backward|stairs|corpse|door|button|lean|point|sit_?ups|_down|standup|stand_up|getup|get_up|transform|spawn|_pose\b/.test(n)) return 'extra';
  const rules = [
    ['talk', /talking|talk_|speak|explain|chat|conversation|argu|話/], ['sit_edge', /sitting_idle|sitting idle/],
    ['land', /jump_land|landing|impact/], ['fall', /jump_loop|jump_idle|falling|fall_loop|mid_air/],
    ['sleep', /sleep|lying|lie_|lay|nap|睡|寝/], ['sit_edge', /sit.*(edge|ledge|dangl|swing)|ledge/], ['sit', /sit|seat|座/],
    ['walk', /walk|stroll|歩|走/], ['wave', /wave|waving|greet|hello|bye|挨拶|招手/], ['dance', /dance|ダンス|舞/],
    ['stretch', /stretch|yawn|伸/], ['think', /think|ponder|考/], ['happy', /happy|joy|cheer|laugh|喜|笑/],
    ['sad', /sad|cry|悲|哭/], ['angry', /angry|stomp|怒/], ['surprised', /surpris|shock|驚/], ['jump', /jump|跳/],
    ['fall', /fall|落/], ['land', /land|着地/], ['held', /hang|held|dangle|lifted|carried/], ['talk', /talk|speak|explain|話/],
    ['typing', /typ|keyboard|computer/], ['idle', /idle|stand|breath|wait|待/], ['pose', /pose|ポーズ|peace|photo/],
  ];
  for (const [role, re] of rules) if (re.test(n)) return role;
  return fallback;
}

function listAnimations() {
  try {
    const out = [];
    for (const f of fs.readdirSync(ANIM_DIR)) {
      if (/\.(vrma|fbx)$/i.test(f)) out.push({ file: f, role: settings.clipRoles[f] || guessRole(f) });
      else if (/\.vmd$/i.test(f)) out.push({ file: f, role: settings.clipRoles[f] || guessRole(f, 'dance') });
      else if (/\.uanim\.json$/i.test(f)) out.push({ file: f, role: settings.clipRoles[f] || 'pose' });
      else if (/\.glb$/i.test(f)) for (const clip of glbClips(path.join(ANIM_DIR, f))) out.push({ file: f, clip, role: settings.clipRoles[f + '#' + clip] || guessRole(clip) });
    }
    return out;
  } catch { return []; }
}

// ---------------------------------------------------------------- desktop world
let helper = null;
let helperBuf = '';
let helperWaiting = null;
function startHelper() {
  if (helper) return;
  helper = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'desktop-helper.ps1')], { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] });
  helper.stdout.setEncoding('utf8');
  helper.stdout.on('data', (d) => {
    helperBuf += d;
    let nl;
    while ((nl = helperBuf.indexOf('\n')) >= 0) {
      const line = helperBuf.slice(0, nl).trim();
      helperBuf = helperBuf.slice(nl + 1);
      if (!line || line.startsWith('{"ready"')) continue;
      const cb = helperWaiting; helperWaiting = null;
      if (cb) { try { cb(JSON.parse(line)); } catch { cb(null); } }
    }
  });
  helper.on('exit', () => { helper = null; const cb = helperWaiting; helperWaiting = null; if (cb) cb(null); });
}
function queryWorld() {
  return new Promise((resolve) => {
    if (!helper) startHelper();
    if (!helper || helperWaiting) return resolve(null);
    const t = setTimeout(() => { if (helperWaiting) { helperWaiting = null; resolve(null); } }, 1500);
    helperWaiting = (d) => { clearTimeout(t); resolve(d); };
    try { helper.stdin.write('w ' + process.pid + '\n'); } catch { helperWaiting = null; clearTimeout(t); resolve(null); }
  });
}
let worldTimer = null;
function startWorldLoop() {
  const tick = async () => {
    if (win && !win.isDestroyed() && !settings.hidden) {
      const d = await queryWorld();
      if (d) lastWorld = d;
      if (d && win && !win.isDestroyed()) {
        const area = overlayArea();
        const windows = (d.windows || []).map((w) => ({ id: w.id, x: w.x - area.x, y: w.y - area.y, w: w.w, h: w.h, max: w.max, title: w.title }));
        win.webContents.send('pet:world', { windows, fg: d.fg, full: !!d.full, idle: powerMonitor.getSystemIdleTime() });
        if (settings.behaviors.hideFullscreen) {
          const hide = !!d.full && !settings.portrait.auto && !windows.some((w) => w.id === d.fg && /amadeus/i.test(w.title));
          win.setOpacity(hide ? 0 : 1);
        } else win.setOpacity(1);
      }
    }
    worldTimer = setTimeout(tick, 450);
  };
  tick();
}

// ---------------------------------------------------------------- overlay window
let win = null;
const pending = new Map();
function overlayArea() { return screen.getPrimaryDisplay().workArea; }

function createWindow() {
  const area = overlayArea();
  win = new BrowserWindow({
    x: area.x, y: area.y, width: area.width, height: area.height,
    transparent: true, frame: false, resizable: false, movable: false, hasShadow: false,
    alwaysOnTop: true, skipTaskbar: true, focusable: false, show: false,
    backgroundColor: '#00000000', title: 'Amadeus 3D',
    webPreferences: { preload: path.join(__dirname, 'preload', 'index.js'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false },
  });
  win.setAlwaysOnTop(true, 'floating');
  win.setIgnoreMouseEvents(true, { forward: true });
  win.webContents.on('console-message', (_e, level, message) => { if (level >= 2) process.stderr.write('[pet] ' + message + '\n'); });
  win.loadFile(path.join(RENDERER_DIR, 'pet.html'));
  win.once('ready-to-show', () => { if (!settings.hidden) win.showInactive(); });
  const refit = () => { if (win && !win.isDestroyed()) { const a = overlayArea(); win.setBounds({ x: a.x, y: a.y, width: a.width, height: a.height }); } };
  screen.on('display-metrics-changed', refit);
  screen.on('display-added', refit);
  screen.on('display-removed', refit);
}

function sendCommand(command, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    if (!win || win.isDestroyed()) return reject(new Error('Окно 3D не запущено.'));
    const id = crypto.randomUUID();
    const t = setTimeout(() => { pending.delete(id); reject(new Error('Окно 3D не ответило вовремя.')); }, timeoutMs);
    pending.set(id, { resolve, t });
    win.webContents.send('link:command', id, command);
  });
}

function waitReady(timeoutMs = 20000) {
  const started = Date.now();
  return new Promise((resolve) => {
    (function poll() {
      if (!win || win.isDestroyed()) return resolve(false);
      win.webContents.executeJavaScript('!!window.__petReady', true).then((ok) => {
        if (ok) return resolve(true);
        if (Date.now() - started > timeoutMs) return resolve(false);
        setTimeout(poll, 200);
      }).catch(() => { if (Date.now() - started > timeoutMs) resolve(false); else setTimeout(poll, 200); });
    })();
  });
}

async function selectModel(id) {
  const info = id && MODEL_ID.test(id) ? modelInfo(id) : null;
  if (!info) throw new Error('Модель не найдена.');
  if (!(await waitReady())) throw new Error('Окно 3D не готово.');
  const result = await sendCommand({ name: 'load_model', args: { url: SCHEME + '://' + id + '/' + encodeURIComponent(info.file), id } }, 60000);
  if (!result || !result.ok) throw new Error((result && result.error) || 'Не удалось загрузить модель.');
  settings.activeModelId = id;
  saveSettings();
  if (!fs.existsSync(path.join(MODELS_DIR, id, 'preview.png'))) {
    // after the first second the character stands in its idle pose (not the T-pose)
    new Promise((r) => setTimeout(r, 1200)).then(() => sendCommand({ name: 'render_preview', args: {} }, 20000)).then((r) => {
      if (r && r.png) { fs.writeFileSync(path.join(MODELS_DIR, id, 'preview.png'), Buffer.from(r.png, 'base64')); }
    }).catch(() => {});
  }
  return result;
}

function registerIpc() {
  ipcMain.on('link:answer', (_e, id, result) => {
    const p = pending.get(id);
    if (p) { clearTimeout(p.t); pending.delete(id); p.resolve(result); }
  });
  ipcMain.on('pet:interactive', (_e, on) => { if (win && !win.isDestroyed()) win.setIgnoreMouseEvents(!on, { forward: true }); });
  ipcMain.handle('pet:settings', () => ({ ...settings, animations: listAnimations() }));
  ipcMain.handle('pet:cursor', () => { const p = screen.getCursorScreenPoint(); const a = overlayArea(); return { x: p.x - a.x, y: p.y - a.y }; });
  ipcMain.on('pet:menu', (_e, state) => {
    const menu = Menu.buildFromTemplate([
      { label: state && state.sleeping ? 'Разбудить' : 'Уснуть', click: () => cmd(state && state.sleeping ? 'wake' : 'sleep') },
      { label: 'Сесть', click: () => cmd('sit') },
      { label: 'Помахать', click: () => cmd('wave') },
      { label: 'Потанцевать', click: () => cmd('dance') },
      { label: 'Ко мне', click: () => cmd('come') },
      { label: 'Режим пузыря', type: 'checkbox', checked: !!settings.portrait.enabled, click: (i) => applySettingsPatch({ portrait: { enabled: i.checked } }) },
      { type: 'separator' },
      { label: 'Слушать «' + (settings.listen.wake || 'алиса').replace(/^./, (c) => c.toUpperCase()) + '»', type: 'checkbox', checked: !!settings.listen.enabled, click: (i) => applySettingsPatch({ listen: { enabled: i.checked } }) },
      { label: state && state.recording ? '■ Отправить голосовое' : '🎙 Микрофон: сказать агенту', click: () => { if (win && !win.isDestroyed()) win.webContents.send('voice:toggle'); } },
      { type: 'separator' },
      { label: 'Гулять сам(а)', type: 'checkbox', checked: settings.behaviors.walk, click: (i) => applySettingsPatch({ behaviors: { walk: i.checked } }) },
      { label: 'Залезать на окна', type: 'checkbox', checked: settings.behaviors.climb, click: (i) => applySettingsPatch({ behaviors: { climb: i.checked } }) },
      { type: 'separator' },
      { label: 'Спрятать', click: () => applySettingsPatch({ hidden: true }) },
    ]);
    menu.popup({ window: win });
  });
  ipcMain.on('pet:log', (_e, msg) => process.stderr.write('[pet] ' + msg + '\n'));
  ipcMain.on('pet:patch', (_e, patch) => {
    if (!patch || typeof patch !== 'object') return;
    const p = {};
    for (const k of ['portrait', 'listen', 'voice']) if (patch[k] && typeof patch[k] === 'object') p[k] = patch[k];
    if (Object.keys(p).length) applySettingsPatch(p);
  });
  ipcMain.handle('voice:synthesize', async (_e, req) => {
    const text = typeof req?.text === 'string' ? req.text.trim() : '';
    if (!text) return { ok: false, error: 'Пустой текст.' };
    try {
      if (req.engine === 'edge') return { ok: true, audio: await edgeSynthesize(text, req.voice, req.rate, req.pitch) };
      return { ok: true, audio: await kokoroSynthesize(text, req.voice, req.speed) };
    }
    catch (error) { return { ok: false, error: error instanceof Error ? error.message : String(error) }; }
  });
  ipcMain.handle('voice:listen', async (_e, wav, follow) => {
    const buf = Buffer.isBuffer(wav) ? wav : wav instanceof ArrayBuffer ? Buffer.from(wav) : ArrayBuffer.isView(wav) ? Buffer.from(wav.buffer, wav.byteOffset, wav.byteLength) : null;
    try { return await listenPhrase(buf, !!follow); } catch (error) { return { ok: false, error: error instanceof Error ? error.message : String(error) }; }
  });
  ipcMain.handle('voice:turn', async (_e, wav) => {
    const buf = Buffer.isBuffer(wav) ? wav : wav instanceof ArrayBuffer ? Buffer.from(wav) : ArrayBuffer.isView(wav) ? Buffer.from(wav.buffer, wav.byteOffset, wav.byteLength) : null;
    if (!buf || buf.length < 1000) return { ok: false, error: 'Пустая запись.' };
    try { const r = await transcribeAny(buf); if (r.ok && r.text) pendingChat.push({ text: r.text, send: false }); return { ok: r.ok, text: r.text || '', error: r.error }; }
    catch (error) { return { ok: false, error: error instanceof Error ? error.message : String(error) }; }
  });
}
function cmd(action) { sendCommand({ name: 'action', args: { action } }).catch(() => {}); }

// ---------------------------------------------------------------- HTTP control
function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
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
  try {
    if (req.method === 'POST' && route === '/command') {
      json(res, 200, { ok: true, result: await sendCommand({ name: body.name, args: body.args || {} }) });
    } else if (req.method === 'GET' && route === '/list') {
      json(res, 200, { ok: true, models: listModels(), active: settings.activeModelId });
    } else if (req.method === 'GET' && route === '/active') {
      json(res, 200, { ok: true, active: settings.activeModelId });
    } else if (req.method === 'POST' && route === '/select') {
      const result = await selectModel(body.id);
      json(res, 200, { ok: true, id: body.id, result });
    } else if (req.method === 'POST' && route === '/load_model') {
      // compatibility: load by path = import (if needed) + select
      const p = String(body.path || '');
      let id = null;
      const results = await importFiles([p]);
      const r = results[0];
      id = (r.imported[0] || r.skipped[0] || {}).id;
      if (!id) throw new Error(r.problems[0] || 'Не удалось загрузить модель.');
      json(res, 200, { ok: true, result: await selectModel(id) });
    } else if (req.method === 'POST' && route === '/remove') {
      if (typeof body.id !== 'string' || !MODEL_ID.test(body.id)) throw new Error('Некорректный id.');
      fs.rmSync(path.join(MODELS_DIR, body.id), { recursive: true, force: true });
      if (settings.activeModelId === body.id) { settings.activeModelId = ''; saveSettings(); sendCommand({ name: 'unload', args: {} }).catch(() => {}); }
      json(res, 200, { ok: true });
    } else if (req.method === 'GET' && route === '/settings') {
      json(res, 200, { ...publicSettings(), animations: listAnimations() });
    } else if (req.method === 'POST' && route === '/settings') {
      json(res, 200, { ...applySettingsPatch(body), animations: listAnimations() });
    } else if (req.method === 'POST' && route === '/speak') {
      json(res, 200, { ok: true, result: await sendCommand({ name: 'speech', args: body }, 5000).catch(() => null) });
    } else if (req.method === 'POST' && route === '/import') {
      const paths = Array.isArray(body.paths) ? body.paths.filter((p) => typeof p === 'string') : [];
      json(res, 200, { ok: true, results: await importFiles(paths) });
    } else if (req.method === 'POST' && route === '/import_dialog') {
      const anim = body.kind === 'animation';
      const picked = await dialog.showOpenDialog({
        title: anim ? 'Анимации (.vrma / .vmd / .fbx / архив)' : 'Модель VRM',
        defaultPath: app.getPath('downloads'),
        properties: ['openFile', 'multiSelections'],
        filters: anim ? [{ name: 'Анимации', extensions: ['vrma', 'vmd', 'fbx', 'glb', 'unitypackage', 'anim', 'zip', 'rar', '7z'] }] : [{ name: 'Модели VRM', extensions: ['vrm', 'glb'] }],
      });
      json(res, 200, picked.canceled ? { ok: true, canceled: true, results: [] } : { ok: true, results: await importFiles(picked.filePaths) });
    } else if (req.method === 'POST' && route === '/animations/assign') {
      const file = path.basename(String(body.file || ''));
      if (!fs.existsSync(path.join(ANIM_DIR, file))) throw new Error('Анимация не найдена.');
      const key = body.clip ? file + '#' + String(body.clip) : file;
      if (body.remove) {
        fs.rmSync(path.join(ANIM_DIR, file), { force: true });
        for (const k of Object.keys(settings.clipRoles)) if (k === file || k.startsWith(file + '#')) delete settings.clipRoles[k];
      } else if (ANIM_ROLES.includes(body.role)) settings.clipRoles[key] = body.role;
      saveSettings(); pushSettings();
      json(res, 200, { ok: true, animations: listAnimations() });
    } else if (req.method === 'POST' && route === '/capture') {        // debug: a region of the overlay as PNG (DOM overlays included)
      const r = { x: Math.max(0, Math.round(body.x || 0)), y: Math.max(0, Math.round(body.y || 0)), width: Math.round(body.w || 400), height: Math.round(body.h || 400) };
      const img = await win.webContents.capturePage(r);
      json(res, 200, { ok: true, png: img.toPNG().toString('base64') });
    } else if (req.method === 'GET' && route === '/chat-message') {
      const m = pendingChat.shift();
      json(res, 200, { ok: true, text: m ? m.text : '', send: !!(m && m.send) });
    } else if (req.method === 'POST' && route === '/listen-test') {   // debug: a phrase as if it came from the microphone
      try { json(res, 200, await listenPhrase(Buffer.from(String(body.data || ''), 'base64'), !!body.follow)); }
      catch (e) { json(res, 200, { ok: false, error: String((e && e.message) || e) }); }
    } else if (req.method === 'POST' && route === '/provider') {
      if (typeof body.key === 'string' && body.key) process.env.LITELLM_API_KEY = body.key;
      if (typeof body.baseUrl === 'string' && /^https?:\/\//.test(body.baseUrl)) process.env.LITELLM_BASE_URL = body.baseUrl;
      json(res, 200, { ok: true });
    } else if (req.method === 'POST' && route === '/transcribe') {
      json(res, 200, await transcribe(body.data, body.type, body.filename));
    } else if (req.method === 'POST' && route === '/voice-import') {
      json(res, 200, await importVoice(body));
    } else if (req.method === 'GET' && route === '/voices') {
      json(res, 200, { ok: true, voices: kokoroVoices(), ready: await kokoroHealthy() });
    } else if (req.method === 'GET' && route === '/ping') {
      json(res, 200, { ok: true, pong: true });
    } else if (req.method === 'POST' && route === '/shutdown') {
      json(res, 200, { ok: true });
      setTimeout(() => app.quit(), 150);
    } else {
      json(res, 404, { ok: false, error: 'not found: ' + req.method + ' ' + route });
    }
  } catch (e) {
    json(res, 200, { ok: false, error: String((e && e.message) || e) });
  }
});

function watchParent() {
  const parent = Number(process.env.AMADEUS_PARENT_PID);
  if (!Number.isInteger(parent) || parent <= 0) return;
  setInterval(() => { try { process.kill(parent, 0); } catch { app.quit(); } }, 5000).unref();
}

app.on('window-all-closed', () => app.quit());
app.on('will-quit', () => { try { helper && helper.kill(); } catch {} try { if (kokoroProcess && kokoroProcess.exitCode === null) kokoroProcess.kill(); } catch {} try { if (sttProcess && sttProcess.exitCode === null) sttProcess.kill(); } catch {} try { if (edgeProcess && edgeProcess.exitCode === null) edgeProcess.kill(); } catch {} });

app.whenReady().then(async () => {
  loadSettings();
  setTimeout(kokoroWarm, 4000);                                  // voice on: load Kokoro before the first answer
  protocol.handle(SCHEME, (req) => {
    try {
      const u = new URL(req.url);
      const host = u.hostname;
      const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '');
      const base = host === '_anim' ? ANIM_DIR : path.join(MODELS_DIR, host);
      const file = path.join(base, path.normalize(rel));
      if (!file.startsWith(base + path.sep)) return new Response('Forbidden', { status: 403 });
      return new Response(fs.readFileSync(file), { headers: { 'Content-Type': 'application/octet-stream', 'Access-Control-Allow-Origin': '*' } });
    } catch { return new Response('Not found', { status: 404 }); }
  });
  registerIpc();
  createWindow();
  startHelper();
  startWorldLoop();
  watchParent();
  server.listen(0, '127.0.0.1', () => {
    process.stdout.write(JSON.stringify({ type: 'ready', port: server.address().port }) + '\n');
  });
  if (settings.activeModelId && modelInfo(settings.activeModelId)) selectModel(settings.activeModelId).catch((e) => process.stderr.write('[pet] restore failed: ' + e.message + '\n'));
});
