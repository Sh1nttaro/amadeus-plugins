// Generates lib/client.js for amadeus-live2d and amadeus-live3d by extracting the
// amadeus-v2 CharactersSection / Models3DSection components + their CSS verbatim and
// wrapping them with a fetch-based bridge (window.amadeusCharacters / window.amadeus3d).
'use strict';
const fs = require('fs');
const path = require('path');

const SRC = 'W:/amadeus-v2/amadeus/node_modules/@amadeus/amadeus-client-ui-amadeus/lib/client.js';
const src = fs.readFileSync(SRC, 'utf8');

function lineValue(prefix) {
  const line = src.split(/\r?\n/).find((l) => l.trimStart().startsWith(prefix));
  if (!line) throw new Error('not found: ' + prefix);
  const i = line.indexOf('"');
  if (i < 0) throw new Error('no quote in: ' + prefix);
  return line.slice(i + 1, line.length - 2); // strip trailing ";
}

const CSS = lineValue('var CSS = ');
const ACTIONS = (() => {
  const line = src.split(/\r?\n/).find((l) => l.includes('tag.textContent = CSS + VOICE_CSS + '));
  const i = line.indexOf('tag.textContent = CSS + VOICE_CSS + "') + 'tag.textContent = CSS + VOICE_CSS + "'.length;
  return line.slice(i, line.length - 2); // strip trailing ";
})();

const PANEL_CSS = '.amadeus-panel-page{box-sizing:border-box;height:100%;overflow:auto;padding:24px clamp(20px,4vw,40px) 48px;color:var(--dsw-alias-label-primary)}.amadeus-panel-page-head{max-width:1200px;margin:0 auto 16px}.amadeus-panel-page-title{margin:0;font-size:20px;font-weight:600;line-height:28px}.amadeus-panel-page-sub{color:var(--dsw-alias-label-secondary);font-size:13px;line-height:20px;margin:4px 0 0}.amadeus-panel-page .amadeus-characters-section,.amadeus-panel-page .amadeus-models3d-section{max-width:1200px;margin:0 auto}';

// Light visual polish: hover lift + shadow + rounded preview (safe, additive).
const POLISH_CSS = '.amadeus-character-card{transition:transform .15s ease,box-shadow .15s ease}.amadeus-character-card:hover{transform:translateY(-2px);box-shadow:0 8px 18px rgba(0,0,0,.14)}.amadeus-character-preview{border-radius:10px;overflow:hidden}.amadeus-character-action{transition:transform .12s ease}.amadeus-character-action:hover{transform:translateY(-1px)}';

// The character-settings toggle bar (hide / wander / perch / cursor + voice replies) shown above the search.
const SETTINGS_BAR_CSS = '.amadeus-character-settings{display:flex;flex-direction:column;gap:10px;margin:0 0 14px;padding:14px 16px;border:1px solid var(--dsw-alias-border-l3);border-radius:12px;background:var(--dsw-alias-bg-base)}.amadeus-cs-head{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px}.amadeus-cs-title{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--dsw-alias-label-caption)}.amadeus-cs-row{display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center}.amadeus-cs-sep{width:1px;height:20px;background:var(--dsw-alias-border-l3);flex:none}.amadeus-cs-toggle{display:inline-flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;user-select:none;white-space:nowrap;color:var(--dsw-alias-label-primary)}.amadeus-cs-toggle input{position:absolute;opacity:0;width:0;height:0}.amadeus-cs-switch{width:38px;height:22px;border-radius:999px;background:var(--dsw-alias-border-l3);transition:background .18s ease;position:relative;flex:none}.amadeus-cs-switch::after{content:"";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-bg-base);transition:transform .18s ease;box-shadow:0 1px 3px rgba(0,0,0,.35)}.amadeus-cs-toggle input:checked + .amadeus-cs-switch{background:var(--dsw-alias-state-business-primary)}.amadeus-cs-toggle input:checked + .amadeus-cs-switch::after{transform:translateX(16px)}.amadeus-cs-toggle input:disabled + .amadeus-cs-switch{opacity:.5}.amadeus-cs-select{appearance:none;padding:5px 26px 5px 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:12px;cursor:pointer}.amadeus-cs-select:disabled{opacity:.5;cursor:default}.amadeus-cs-note{margin-left:auto;font-size:12px;color:var(--dsw-alias-label-caption)}.amadeus-cs-note-error{color:#f38f9c}.amadeus-cs-tool{display:inline-flex;flex-wrap:wrap;align-items:center;gap:10px 14px}.amadeus-cs-color{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--dsw-alias-label-primary)}.amadeus-cs-color input[type=color]{width:30px;height:22px;padding:0;border:1px solid var(--dsw-alias-border-l3);border-radius:6px;background:transparent;cursor:pointer}.amadeus-cs-range{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--dsw-alias-label-primary)}.amadeus-cs-range input[type=range]{width:110px;accent-color:var(--dsw-alias-state-business-primary)}';

const AUDIO_CSS = '.amadeus-audio{display:flex;flex-direction:column;gap:10px;margin:0 0 14px;padding:14px 16px;border:1px solid var(--dsw-alias-border-l3);border-radius:12px;background:var(--dsw-alias-bg-base)}.amadeus-audio-row{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center}.amadeus-audio-title{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--dsw-alias-label-caption)}.amadeus-audio-label{font-size:12px;color:var(--dsw-alias-label-caption);min-width:64px}.amadeus-audio-scale{flex:1;min-width:120px;accent-color:var(--dsw-alias-state-business-primary)}.amadeus-audio-val{font-size:12px;color:var(--dsw-alias-label-primary);min-width:42px;text-align:right}.amadeus-audio-btn{padding:6px 12px;border-radius:8px;border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:12px;cursor:pointer}.amadeus-audio-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}.amadeus-audio-btn.recording{background:#f43146;color:#fff;border-color:transparent}.amadeus-audio-level{flex:1;min-width:100px;height:6px;border-radius:999px;background:var(--dsw-alias-border-l3);overflow:hidden}.amadeus-audio-level i{display:block;height:100%;width:0;background:var(--dsw-alias-state-business-primary);transition:width .08s linear}.amadeus-audio-file{display:none}.amadeus-audio-note{font-size:12px;color:var(--dsw-alias-label-caption)}.amadeus-audio-note-error{color:#f38f9c}.amadeus-ptt{min-width:140px;padding:12px 18px;border-radius:999px;border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;cursor:pointer;user-select:none;touch-action:none}.amadeus-ptt:active,.amadeus-ptt.recording{background:var(--dsw-alias-state-business-primary);color:#fff}';

const startIdx = src.indexOf('function plural(count, forms) {');
const endIdx = src.indexOf('var TOOL_STATES');
if (startIdx < 0 || endIdx < 0 || endIdx <= startIdx) throw new Error('component block not found');
const COMPONENTS = src.slice(startIdx, endIdx).trimEnd()
  // Optimistic select: mark the card active instantly + show a loading note,
  // instead of waiting for the (slow) model load to resolve.
  .replace(/setBusy\(true\);(\s*)api\.select\(id\)\.then/g, 'setBusy(true);$1setActiveId(id);$1setNote({ text: "Загружаю модель…" });$1api.select(id).then')
  // Surface load failures (was a silent catch) + clear the optimistic active.
  .replace(/\.catch\(function \(\) \{\}\)/g, '.catch(function () { setActiveId(""); setNote({ text: "Не удалось загрузить модель.", error: true }); })')
  // Clear the loading note on success.
  .replace(/(setActiveId\(typeof next === "string" \? next : id\);)/g, '$1 setNote(null);');

function makeApi(base) {
  return `function makeApi(base) {
  function req(p, opts) {
    return fetch(base + p, opts).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }
  function post(p, body) {
    return req(p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) });
  }
  return {
    list: function () { return req('/list').then(function (r) { return r.models || []; }); },
    active: function () { return req('/active').then(function (r) { return r.active || ''; }); },
    select: function (id) { return post('/select', { id: id }).then(function (r) { return r.id || id; }); },
    remove: function (id) { return post('/remove', { id: id }); },
    action: function (payload) { return post('/command', payload); },
    import: function () { return Promise.resolve({ ok: false, error: 'Импорт через диалог недоступен в DSH: положите модель в папку companion/models/ вручную.' }); },
    importFolder: function () { return Promise.resolve({ ok: false, error: 'Импорт через диалог недоступен в DSH: положите модель в папку companion/models/ вручную.' }); },
  };
}`;
}

function settingsBarSource(base) {
  return `function CharacterSettingsBar() {
  var cfgState = react.useState({ hidden: false, behaviors: {}, voiceReplies: {}, voices: ["sveta", "masha", "dima"], speechBubble: { enabled: true, mode: "bubble", backgroundColor: "#211e2a", opacity: 0.94, fontColor: "#f5f3fa", fontSize: 14 } });
  var cfg = cfgState[0], setCfg = cfgState[1];
  var noteState = react.useState(null);
  var note = noteState[0], setNote = noteState[1];
  var busyState = react.useState(false);
  var busy = busyState[0], setBusy = busyState[1];
  react.useEffect(function () {
    var alive = true;
    fetch("${base}/settings").then(function (r) { return r.json(); }).then(function (d) {
      if (alive && d && d.ok) setCfg({ hidden: d.hidden, behaviors: d.behaviors || {}, voiceReplies: d.voiceReplies || {}, voices: d.voices || ["sveta", "masha", "dima"], speechBubble: d.speechBubble || { enabled: true, mode: "bubble", backgroundColor: "#211e2a", opacity: 0.94, fontColor: "#f5f3fa", fontSize: 14 } });
    }).catch(function () {});
    return function () { alive = false; };
  }, []);
  var applyPatch = function (patch) {
    if (busy) return;
    setBusy(true); setNote(null);
    fetch("${base}/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.ok) setCfg({ hidden: d.hidden, behaviors: d.behaviors || {}, voiceReplies: d.voiceReplies || {}, voices: d.voices || ["sveta", "masha", "dima"], speechBubble: d.speechBubble || { enabled: true, mode: "bubble", backgroundColor: "#211e2a", opacity: 0.94, fontColor: "#f5f3fa", fontSize: 14 } });
        else setNote({ text: (d && d.error) || "Не удалось применить.", error: true });
      })
      .catch(function (e) { setNote({ text: (e && e.message) || "Ошибка.", error: true }); })
      .finally(function () { setBusy(false); });
  };
  var b = cfg.behaviors || {};
  var vr = cfg.voiceReplies || {};
  var sb = cfg.speechBubble || { enabled: true, mode: "bubble", backgroundColor: "#211e2a", opacity: 0.94, fontColor: "#f5f3fa", fontSize: 14 };
  var voices = cfg.voices || ["sveta", "masha", "dima"];
  var mkSwitch = function (label, on, patch) {
    return jsx("label", { className: "amadeus-cs-toggle", children: [
      jsx("input", { type: "checkbox", checked: on, disabled: busy, onChange: function () { applyPatch(patch); } }),
      jsx("span", { className: "amadeus-cs-switch" }),
      jsx("span", { children: label })
    ] });
  };
  return jsx("div", { className: "amadeus-character-settings", children: [
    jsx("div", { className: "amadeus-cs-head", children: [
      jsx("span", { className: "amadeus-cs-title", children: "Настройки" }),
      jsx("span", { className: "amadeus-cs-sep" }),
      mkSwitch("Озвучивать ответы", !!vr.enabled, { voiceReplies: { enabled: !vr.enabled } }),
      jsx("select", { className: "amadeus-cs-select", disabled: busy || !vr.enabled, value: vr.voice || "sveta", onChange: function (e) { applyPatch({ voiceReplies: { voice: e.target.value } }); }, children: voices.map(function (v) { return jsx("option", { key: v, value: v, children: v }); }) }),
      jsx("select", { className: "amadeus-cs-select", disabled: busy || !vr.enabled, value: String(vr.speed != null ? vr.speed : 1), onChange: function (e) { applyPatch({ voiceReplies: { speed: Number(e.target.value) } }); }, children: ["0.75", "1", "1.25", "1.5"].map(function (v) { return jsx("option", { key: v, value: v, children: v + "×" }); }) }),
      note ? jsx("span", { className: "amadeus-cs-note" + (note.error ? " amadeus-cs-note-error" : ""), children: note.text }) : null
    ] }),
    jsx("div", { className: "amadeus-cs-row", children: [
      mkSwitch("Скрыть персонажа", !!cfg.hidden, { hidden: !cfg.hidden }),
      mkSwitch("Движения по экрану", b.wander !== false, { behaviors: { wander: b.wander === false } }),
      mkSwitch("Садиться на окна", b.perch !== false, { behaviors: { perch: b.perch === false } }),
      mkSwitch("Реагировать на курсор", b.cursor !== false, { behaviors: { cursor: b.cursor === false } })
    ] }),
    jsx("div", { className: "amadeus-cs-row", children: [
      jsx("span", { className: "amadeus-cs-title", children: "Показ ответов" }),
      mkSwitch("Показывать", sb.enabled !== false, { speechBubble: { enabled: sb.enabled === false } }),
      sb.enabled !== false ? jsx("select", { className: "amadeus-cs-select", value: sb.mode === "orb" ? "orb" : "bubble", onChange: function (e) { applyPatch({ speechBubble: { mode: e.target.value } }); }, children: [
        jsx("option", { value: "bubble", children: "Пузырь (прямоугольник)" }),
        jsx("option", { value: "orb", children: "Orb + dots" })
      ] }) : null,
      sb.enabled !== false && sb.mode !== "orb" ? jsx("span", { className: "amadeus-cs-tool", children: [
        jsx("label", { className: "amadeus-cs-color", children: [
          jsx("span", { children: "Фон" }),
          jsx("input", { type: "color", value: sb.backgroundColor || "#211e2a", disabled: busy, onChange: function (e) { applyPatch({ speechBubble: { backgroundColor: e.target.value } }); } })
        ] }),
        jsx("label", { className: "amadeus-cs-color", children: [
          jsx("span", { children: "Текст" }),
          jsx("input", { type: "color", value: sb.fontColor || "#f5f3fa", disabled: busy, onChange: function (e) { applyPatch({ speechBubble: { fontColor: e.target.value } }); } })
        ] }),
        jsx("label", { className: "amadeus-cs-range", children: [
          jsx("span", { children: "Прозрачность " + Math.round((sb.opacity != null ? sb.opacity : 0.94) * 100) + "%" }),
          jsx("input", { type: "range", min: "30", max: "100", step: "5", value: String(Math.round((sb.opacity != null ? sb.opacity : 0.94) * 100)), disabled: busy, onChange: function (e) { applyPatch({ speechBubble: { opacity: Number(e.target.value) / 100 } }); } })
        ] }),
        jsx("label", { className: "amadeus-cs-range", children: [
          jsx("span", { children: "Шрифт " + (sb.fontSize || 14) + "px" }),
          jsx("input", { type: "range", min: "10", max: "32", step: "1", value: String(sb.fontSize || 14), disabled: busy, onChange: function (e) { applyPatch({ speechBubble: { fontSize: Number(e.target.value) } }); } })
        ] })
      ] }) : null
    ] })
  ] });
}
function Live2DPage() {
  return jsx("div", { children: [ jsx(CharacterSettingsBar, {}), jsx(AudioControlsSection, {}), jsx(CharactersSection, {}) ] });
}`;
}

function audioControlsSource(base) {
  return `function AudioControlsSection() {
  var cfgState = react.useState({ modelScale: 1, radioEnabled: false, voiceDevices: {}, voices: ["sveta", "masha", "dima"] });
  var cfg = cfgState[0], setCfg = cfgState[1];
  var devState = react.useState({ inputs: [], outputs: [] });
  var dev = devState[0], setDev = devState[1];
  var noteState = react.useState(null);
  var note = noteState[0], setNote = noteState[1];
  var busyState = react.useState(false);
  var busy = busyState[0], setBusy = busyState[1];
  var levelState = react.useState(0);
  var level = levelState[0], setLevel = levelState[1];
  var recState = react.useState(false);
  var recording = recState[0], setRecording = recState[1];
  var refs = react.useRef({ stream: null, audioCtx: null, analyser: null, raf: 0, recorder: null, chunks: [], fileInput: null, micOn: false });

  var loadCfg = function () {
    fetch("${base}/settings").then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.ok) setCfg({ modelScale: d.modelScale != null ? d.modelScale : 1, radioEnabled: !!(d.hotkeys && d.hotkeys.radioEnabled), voiceDevices: d.voiceDevices || {}, voices: d.voices || ["sveta", "masha", "dima"] });
    }).catch(function () {});
  };
  var loadDevices = function () {
    if (navigator.mediaDevices && typeof navigator.mediaDevices.enumerateDevices === "function") {
      navigator.mediaDevices.enumerateDevices().then(function (list) {
        setDev({ inputs: list.filter(function (d) { return d.kind === "audioinput"; }), outputs: list.filter(function (d) { return d.kind === "audiooutput"; }) });
      }).catch(function () {});
    }
  };
  react.useEffect(function () {
    loadCfg(); loadDevices();
    if (navigator.mediaDevices && typeof navigator.mediaDevices.addEventListener === "function") {
      navigator.mediaDevices.addEventListener("devicechange", loadDevices);
    }
    return function () {
      var r = refs.current;
      if (r.stream) r.stream.getTracks().forEach(function (t) { t.stop(); });
      if (r.audioCtx) r.audioCtx.close();
      if (r.raf) cancelAnimationFrame(r.raf);
    };
  }, []);

  var applyPatch = function (patch) {
    if (busy) return;
    setBusy(true); setNote(null);
    fetch("${base}/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.ok) setCfg({ modelScale: d.modelScale != null ? d.modelScale : 1, radioEnabled: !!(d.hotkeys && d.hotkeys.radioEnabled), voiceDevices: d.voiceDevices || {}, voices: d.voices || cfg.voices });
        else setNote({ text: (d && d.error) || "Ошибка", error: true });
      })
      .catch(function (e) { setNote({ text: (e && e.message) || "Ошибка", error: true }); })
      .finally(function () { setBusy(false); });
  };

  var stopMic = function () {
    var r = refs.current;
    r.micOn = false;
    if (r.raf) { cancelAnimationFrame(r.raf); r.raf = 0; }
    if (r.stream) { r.stream.getTracks().forEach(function (t) { t.stop(); }); r.stream = null; }
    if (r.audioCtx) { r.audioCtx.close(); r.audioCtx = null; }
    r.analyser = null;
    setLevel(0);
  };
  var startMic = function () {
    var inputId = cfg.voiceDevices && cfg.voiceDevices.inputDeviceId;
    navigator.mediaDevices.getUserMedia({ audio: inputId ? { deviceId: { exact: inputId } } : true }).then(function (stream) {
      var r = refs.current;
      r.stream = stream;
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      r.audioCtx = new AudioCtx();
      var src = r.audioCtx.createMediaStreamSource(stream);
      r.analyser = r.audioCtx.createAnalyser();
      r.analyser.fftSize = 512;
      src.connect(r.analyser);
      r.micOn = true;
      var data = new Uint8Array(r.analyser.frequencyBinCount);
      var loop = function () {
        if (!r.analyser || !r.micOn) return;
        r.analyser.getByteFrequencyData(data);
        var sum = 0; for (var i = 0; i < data.length; i++) sum += data[i];
        setLevel(Math.min(1, (sum / data.length) / 128));
        r.raf = requestAnimationFrame(loop);
      };
      loop();
    }).catch(function (e) { setNote({ text: "Нет доступа к микрофону: " + (e && e.name), error: true }); });
  };
  var toggleMicTest = function () { if (refs.current.micOn) stopMic(); else startMic(); };

  var startRecording = function () {
    var inputId = cfg.voiceDevices && cfg.voiceDevices.inputDeviceId;
    navigator.mediaDevices.getUserMedia({ audio: inputId ? { deviceId: { exact: inputId } } : true }).then(function (stream) {
      var r = refs.current;
      r.stream = stream;
      if (typeof MediaRecorder === "undefined") { setNote({ text: "MediaRecorder недоступен.", error: true }); return; }
      var mime = "audio/webm";
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) mime = "audio/webm;codecs=opus";
      var rec = new MediaRecorder(stream, { mimeType: mime });
      r.recorder = rec; r.chunks = [];
      rec.ondataavailable = function (e) { if (e.data && e.data.size) r.chunks.push(e.data); };
      rec.onstop = function () {
        var blob = new Blob(r.chunks, { type: mime });
        var fr = new FileReader();
        fr.onload = function () {
          var dataUrl = String(fr.result || "");
          var b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
          fetch("${base}/transcribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ data: b64, type: mime.split(";")[0], filename: "audio.webm" }) })
            .then(function (x) { return x.json(); })
            .then(function (d) {
              if (d && d.ok && d.text) { setNote({ text: "Распознано: " + d.text }); injectChat(d.text); }
              else setNote({ text: (d && d.error) || "Не удалось распознать.", error: true });
            })
            .catch(function () { setNote({ text: "Ошибка распознавания.", error: true }); })
            .finally(function () { stopMic(); setRecording(false); });
        };
        fr.readAsDataURL(blob);
      };
      rec.start();
      setRecording(true);
      setNote({ text: "Говорите… (отпустите, чтобы отправить)" });
    }).catch(function (e) { setNote({ text: "Нет доступа к микрофону: " + (e && e.name), error: true }); });
  };
  var stopRecording = function () { var r = refs.current; if (r.recorder && r.recorder.state !== "inactive") r.recorder.stop(); };

  var importVoice = function (file) {
    if (!file) return;
    if (!/\\.bin$/i.test(file.name)) { setNote({ text: "Нужен файл .bin (стиль голоса Kokoro).", error: true }); return; }
    var name = file.name.replace(/\\.bin$/i, "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
    var fr = new FileReader();
    fr.onload = function () {
      var dataUrl = String(fr.result || "");
      var b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
      setNote({ text: "Загружаю голос \\"" + name + "\\"…" });
      fetch("${base}/voice-import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: name, data: b64 }) })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && d.ok) { setNote({ text: "Голос добавлен: " + d.name }); loadCfg(); }
          else setNote({ text: (d && d.error) || "Не удалось добавить голос.", error: true });
        })
        .catch(function () { setNote({ text: "Ошибка загрузки голоса.", error: true }); });
    };
    fr.readAsDataURL(file);
  };

  var scalePct = Math.round((cfg.modelScale != null ? cfg.modelScale : 1) * 100);
  return jsx("div", { className: "amadeus-audio", children: [
    jsx("div", { className: "amadeus-audio-row", children: [ jsx("span", { className: "amadeus-audio-title", children: "Персонаж и голос" }) ] }),
    jsx("div", { className: "amadeus-audio-row", children: [
      jsx("span", { className: "amadeus-audio-label", children: "Масштаб" }),
      jsx("input", { className: "amadeus-audio-scale", type: "range", min: 50, max: 200, step: 5, value: scalePct, disabled: busy, onChange: function (e) { applyPatch({ scale: Number(e.target.value) / 100 }); } }),
      jsx("span", { className: "amadeus-audio-val", children: scalePct + "%" })
    ] }),
    jsx("div", { className: "amadeus-audio-row", children: [
      jsx("label", { className: "amadeus-cs-toggle", children: [
        jsx("input", { type: "checkbox", checked: !!cfg.radioEnabled, disabled: busy, onChange: function () { applyPatch({ radioEnabled: !cfg.radioEnabled }); } }),
        jsx("span", { className: "amadeus-cs-switch" }),
        jsx("span", { children: "Режим рации (hold-to-talk)" })
      ] })
    ] }),
    jsx("div", { className: "amadeus-audio-row", children: [
      jsx("span", { className: "amadeus-audio-label", children: "Микрофон" }),
      jsx("select", { className: "amadeus-cs-select", value: (cfg.voiceDevices && cfg.voiceDevices.inputDeviceId) || "", onChange: function (e) { applyPatch({ voiceDevices: { inputDeviceId: e.target.value } }); }, children: [
        jsx("option", { value: "", children: "По умолчанию" })
      ].concat(dev.inputs.map(function (d) { return jsx("option", { key: d.deviceId, value: d.deviceId, children: d.label || ("Микрофон " + d.deviceId.slice(0, 6)) }); })) }),
      jsx("span", { className: "amadeus-audio-label", children: "Динамик" }),
      jsx("select", { className: "amadeus-cs-select", value: (cfg.voiceDevices && cfg.voiceDevices.outputDeviceId) || "", onChange: function (e) { applyPatch({ voiceDevices: { outputDeviceId: e.target.value } }); }, children: [
        jsx("option", { value: "", children: "По умолчанию" })
      ].concat(dev.outputs.map(function (d) { return jsx("option", { key: d.deviceId, value: d.deviceId, children: d.label || ("Динамик " + d.deviceId.slice(0, 6)) }); })) })
    ] }),
    jsx("div", { className: "amadeus-audio-row", children: [
      jsx("button", { className: "amadeus-audio-btn" + (refs.current.micOn ? " recording" : ""), type: "button", onClick: toggleMicTest, children: refs.current.micOn ? "Стоп" : "Проверить микрофон" }),
      jsx("div", { className: "amadeus-audio-level", children: jsx("i", { style: { width: Math.round(level * 100) + "%" } }) }),
      jsx("button", { className: "amadeus-ptt" + (recording ? " recording" : ""), type: "button",
        onPointerDown: function (e) { e.preventDefault(); if (cfg.radioEnabled) startRecording(); },
        onPointerUp: function () { if (cfg.radioEnabled) stopRecording(); },
        onPointerLeave: function () { if (cfg.radioEnabled && recording) stopRecording(); },
        children: recording ? "Говорю…" : "Нажмите и говорите" })
    ] }),
    jsx("div", { className: "amadeus-audio-row", children: [
      jsx("button", { className: "amadeus-audio-btn", type: "button", onClick: function () { refs.current.fileInput && refs.current.fileInput.click(); }, children: "Загрузить голос (.bin)" }),
      jsx("input", { className: "amadeus-audio-file", type: "file", accept: ".bin", ref: function (el) { refs.current.fileInput = el; }, onChange: function (e) { importVoice(e.target.files && e.target.files[0]); e.target.value = ""; } }),
      note ? jsx("span", { className: "amadeus-audio-note" + (note.error ? " amadeus-audio-note-error" : ""), children: note.text }) : null
    ] })
  ] });
}
function injectChat(text) {
  if (!text) return;
  var el = document.querySelector("textarea") || document.querySelector("[contenteditable=\\"true\\"]") || document.querySelector("[role=\\"textbox\\"]");
  if (!el) return;
  el.focus();
  if (el.tagName === "TEXTAREA") { el.value = text; el.dispatchEvent(new Event("input", { bubbles: true })); }
  else { el.textContent = text; el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text })); }
}`;
}

function speechBridgeSource(base) {
  return `function pollChatMessage() {
  setInterval(function () {
    fetch("${base}/chat-message").then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.ok && d.text && typeof injectChat === "function") injectChat(d.text);
    }).catch(function () {});
  }, 1500);
}
function wireSpeech(ctx) {
  var uiSession = ctx && ctx.uiSession;
  var uiConversation = ctx && ctx.uiConversation;
  if (!uiSession || !uiSession.sessionStatus) return;
  var status = uiSession.sessionStatus;
  var lastPartial = '';
  var lastSentFinal = '';
  var wasRunning = false;
  var trajectorySnapshot = function () {
    try {
      if (!uiConversation || typeof uiConversation.binding !== "function") return null;
      var binding = uiSession.current && uiSession.current.value;
      var sessionId = (binding && binding.props && binding.props.sessionId) || (binding && binding.key);
      if (!sessionId) return null;
      var target = uiConversation.binding(sessionId).target("trajectory");
      if (!target || typeof target.getSnapshot !== "function") return null;
      return target.getSnapshot();
    } catch (e) { return null; }
  };
  var textBlocks = function (blocks) {
    if (!Array.isArray(blocks)) return "";
    var parts = [];
    blocks.forEach(function (b) { if (b && b.kind === "text" && typeof b.text === "string" && b.text !== "") parts.push(b.text); });
    return parts.length ? parts.join("\\n\\n") : "";
  };
  var readPartial = function () {
    var snap = trajectorySnapshot();
    if (!snap || !snap.partial) return "";
    return textBlocks(snap.partial.blocks);
  };
  var readFinal = function () {
    var snap = trajectorySnapshot();
    if (!snap || !Array.isArray(snap.eventNodes)) return "";
    for (var i = snap.eventNodes.length - 1; i >= 0; i--) {
      var node = snap.eventNodes[i];
      if (!node || node.kind !== "assistant") continue;
      var t = textBlocks(node.blocks);
      if (t) return t;
    }
    return "";
  };
  var tick = function () {
    var running = false;
    try {
      var snap = status.getSnapshot();
      if (snap && typeof snap.forEach === "function") {
        snap.forEach(function (row) { if (row && row.running === true) running = true; });
      }
    } catch (e) {}
    var streaming = readPartial();
    if (streaming) {
      if (streaming !== lastPartial) {
        lastPartial = streaming;
        fetch("${base}/speak", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: streaming, final: false }) }).catch(function () {});
      }
    }
    if (!running && wasRunning) {
      var done = lastPartial || readFinal();
      if (done && done !== lastSentFinal) {
        lastSentFinal = done;
        fetch("${base}/speak", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: done, final: true }) }).catch(function () {});
      }
      lastPartial = "";
    }
    wasRunning = running;
  };
  try { if (typeof status.subscribe === "function") status.subscribe(tick); } catch (e) {}
  tick();
  setInterval(tick, 800);
}`;
}

function build(id, sectionId, sectionLabel, order, apiVar, apiBase, panel) {
  const isLive2d = sectionId === 'live2d';
  const component = isLive2d ? 'Live2DPage' : 'Models3DSection';
  const barSource = isLive2d ? settingsBarSource(apiBase) : '';
  const audioSource = isLive2d ? audioControlsSource(apiBase) : '';
  const speechSource = isLive2d ? speechBridgeSource(apiBase) : '';
  const injectList = isLive2d ? '["slots"]' : '["slots"]';
  const speechCall = isLive2d ? '      var __speechRun = function () { pollChatMessage(); };\n      if (typeof document !== "undefined" && document.readyState === "loading") { document.addEventListener("DOMContentLoaded", __speechRun); } else { __speechRun(); }' : '';
  const panelBlock = panel ? `
    function ${panel.iconName}(props) {
      var size = props && props.size ? props.size : 18;
      return jsx("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", children: jsx("path", { d: ${JSON.stringify(panel.svgD)} }) });
    }
    function ${panel.pageName}() {
      return jsx("div", { className: "amadeus-panel-page", children: [
        jsx("div", { className: "amadeus-panel-page-head", children: [
          jsx("h2", { className: "amadeus-panel-page-title", children: ${JSON.stringify(panel.title)} }),
          jsx("p", { className: "amadeus-panel-page-sub", children: ${JSON.stringify(panel.subtitle)} })
        ] }),
        jsx(${component}, {})
      ] });
    }
` : '';
  const panelApply = panel ? `
      ctx.slots.inject("main", function () {
        return ctx.slots.register({ name: "main", key: "${panel.id}" }, ${panel.pageName});
      });
      ctx.slots.inject("sidebar.panellist", function () {
        return ctx.slots.register({ name: "sidebar.panellist", id: "${panel.id}", order: ${panel.order}, label: ${JSON.stringify(panel.label)} }, ${panel.iconName});
      });` : '';

  return `window.__ModuleLoader__.load({
  id: "${id}",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    var react = require("react");
    var jsx = react.createElement;

    var CSS = ${JSON.stringify(CSS)};
    var ACTIONS_CSS = ${JSON.stringify(ACTIONS)};

${COMPONENTS}

${barSource}
${audioSource}
${speechSource}
${makeApi(apiBase)}
${panelBlock}
    var inject = ${injectList};
    function apply(ctx) {
      window.${apiVar} = makeApi("${apiBase}");
${speechCall}
      if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=\\"${id}\\"]") === null) {
        var tag = document.createElement("style");
        tag.dataset.pluginCss = "${id}";
        tag.textContent = CSS + ACTIONS_CSS + ${JSON.stringify(POLISH_CSS + SETTINGS_BAR_CSS + AUDIO_CSS)};
        document.head.appendChild(tag);
      }
      ctx.slots.inject("settings.section", function () {
        return ctx.slots.register({ name: "settings.section", id: "${sectionId}", order: ${order}, label: function () { return ${JSON.stringify(sectionLabel)}; } }, ${component});
      });${panelApply}
    }
    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
`;
}

const outLive2d = build('amadeus-live2d', 'live2d', 'live2D', 88, 'amadeusCharacters', '/amadeus-live2d', null);
const outLive3d = build('amadeus-live3d', 'models3d', 'live3D', 92, 'amadeus3d', '/amadeus-live3d', null);

fs.writeFileSync(path.join(__dirname, 'amadeus-live2d', 'lib', 'client.js'), outLive2d);
fs.writeFileSync(path.join(__dirname, 'amadeus-live3d', 'lib', 'client.js'), outLive3d);
console.log('wrote amadeus-live2d/lib/client.js (' + outLive2d.length + ' bytes)');
console.log('wrote amadeus-live3d/lib/client.js (' + outLive3d.length + ' bytes)');
