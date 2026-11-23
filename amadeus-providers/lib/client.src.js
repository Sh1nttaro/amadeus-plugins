window.__ModuleLoader__.load({
  id: "amadeus-providers",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    var react = require("react");
    var jsx = react.createElement;
    var reactDom = null;
    try { reactDom = require("react-dom"); } catch (e) { reactDom = null; }

    var AUI_CSS = __AUI_CSS__;
    var PROV_CSS = ".apv-card{display:flex;flex-direction:column;border:1px solid var(--aui-line);border-radius:14px;overflow:hidden;background:color-mix(in srgb,var(--aui-text) 2.5%,transparent)}"
      + ".apv-head{display:flex;align-items:center;flex-wrap:wrap;gap:8px 10px;padding:12px 14px;cursor:pointer;user-select:none}"
      + ".apv-head:hover{background:var(--aui-hover)}"
      + ".apv-chev{flex:none;width:16px;height:16px;color:var(--aui-muted);transition:transform .15s}.apv-open>.apv-head .apv-chev{transform:rotate(90deg)}"
      + ".apv-name{font-size:15px;font-weight:600;line-height:22px}"
      + ".apv-id{font-size:12px;color:var(--aui-muted)}"
      + ".apv-badge{display:inline-flex;align-items:center;height:20px;padding:0 8px;border-radius:6px;border:1px solid var(--aui-line);font-size:11.5px;color:var(--aui-muted)}"
      + ".apv-dot{flex:none;width:8px;height:8px;border-radius:50%;background:#3ccf8e;box-shadow:0 0 0 3px color-mix(in srgb,#3ccf8e 22%,transparent)}.apv-dot-off{background:#f43f5e;box-shadow:0 0 0 3px color-mix(in srgb,#f43f5e 22%,transparent)}.apv-dot-warn{background:#f1b76b;box-shadow:0 0 0 3px color-mix(in srgb,#f1b76b 22%,transparent)}"
      + ".apv-count{display:inline-flex;align-items:center;height:20px;padding:0 8px;border-radius:6px;background:var(--aui-hover);font-size:11.5px;color:var(--aui-muted)}"
      + ".apv-actions{display:flex;gap:8px;margin-left:auto}"
      + ".apv-body{border-top:1px solid var(--aui-line)}"
      + ".apv-note{margin:10px 14px 0}"
      + ".apv-meta{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:10px 14px;font-size:12px;color:var(--aui-muted)}"
      + ".apv-tools{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:10px 14px 4px}.apv-tools .aui-search{height:30px;font-size:13px;min-width:180px;flex:1}"
      + ".apv-model{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:4px 12px;padding:9px 14px;border-top:1px solid color-mix(in srgb,var(--aui-line) 65%,transparent)}"
      + ".apv-model>.apv-chips{grid-column:2/4;justify-content:flex-start}"
      + ".apv-model>.apv-cost{justify-self:end}"
      + ".apv-model-off .apv-mname b{color:var(--aui-muted)}"
      + ".apv-mname{min-width:0}.apv-mname b{display:block;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.apv-mname span{display:block;font-size:11.5px;color:var(--aui-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"
      + ".apv-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end}"
      + ".apv-chip{display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 9px;border-radius:7px;border:1px solid var(--aui-line);background:transparent;color:var(--aui-muted);font:inherit;font-size:11.5px;white-space:nowrap}"
      + ".apv-chip b{font-weight:600;color:var(--aui-text)}"
      + ".apv-chip-on{color:var(--aui-text);border-color:color-mix(in srgb,var(--aui-accent) 40%,var(--aui-line));background:color-mix(in srgb,var(--aui-accent) 10%,transparent)}"
      + ".apv-chip-ok{color:#3ccf8e;border-color:color-mix(in srgb,#3ccf8e 35%,transparent)}"
      + ".apv-chip-dim{opacity:.6}"
      + ".apv-chip-warn{color:#f1b76b;border-color:color-mix(in srgb,#f1b76b 45%,transparent);background:color-mix(in srgb,#f1b76b 10%,transparent)}"
      + "button.apv-chip{cursor:pointer}button.apv-chip:hover{border-color:var(--aui-accent);color:var(--aui-text)}"
      + ".apv-edit-cost{grid-column:1/-1;display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;background:var(--aui-hover);font-size:12.5px}"
      + ".apv-num{width:84px;height:28px;padding:0 8px;box-sizing:border-box;border-radius:8px;border:1px solid var(--aui-line);background:var(--aui-bg);color:var(--aui-text);font:inherit;font-size:13px}.apv-num:focus{outline:none;border-color:var(--aui-accent)}"
      + ".apv-form{display:flex;flex-direction:column;gap:12px;padding:14px}"
      + ".apv-field{display:flex;flex-direction:column;gap:4px}.apv-field label{font-size:12px;color:var(--aui-muted)}"
      + ".apv-input{height:34px;padding:0 12px;box-sizing:border-box;border-radius:9px;border:1px solid var(--aui-line);background:var(--aui-bg);color:var(--aui-text);font:inherit;font-size:13px;width:100%}.apv-input:focus{outline:none;border-color:var(--aui-accent)}"
      + ".apv-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}@media (max-width:640px){.apv-grid{grid-template-columns:1fr}}"
      + ".apv-hint{font-size:12px;color:var(--aui-muted);line-height:16px}"
      + ".apv-row-btns{display:flex;flex-wrap:wrap;gap:8px;align-items:center}"
      + ".apv-empty{padding:18px 14px;text-align:center;font-size:13px;color:var(--aui-muted)}"
      + ".ms-btn{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 8px;border-radius:8px;border:0;background:transparent;color:var(--dsw-alias-label-primary,#f9fafb);font:inherit;font-size:13px;line-height:1;cursor:pointer;white-space:nowrap;outline:none;max-width:260px}"
      + ".ms-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08))}.ms-btn:focus-visible{outline:2px solid #9b82f5;outline-offset:1px}.ms-btn:disabled{opacity:.6;cursor:default}"
      + ".ms-name{overflow:hidden;text-overflow:ellipsis}.ms-eff{color:var(--dsw-alias-label-caption,#adb2b8)}.ms-chev{width:10px;height:10px;flex:none;opacity:.6}"
      + ".ms-pop{position:fixed;z-index:2147483000;width:250px;padding:12px;border-radius:14px;border:1px solid var(--dsw-alias-border-l3,rgba(255,255,255,.16));background:var(--dsw-alias-bg-base,#1b1b1d);box-shadow:0 14px 36px rgba(0,0,0,.5);color:var(--dsw-alias-label-primary,#f9fafb);font-size:13px;user-select:none}"
      + ".ms-head{text-align:center;margin-bottom:10px}.ms-title{font-size:14px;font-weight:600;color:#a78bfa;line-height:18px}"
      + ".ms-model{display:inline-flex;align-items:center;gap:3px;max-width:100%;padding:1px 6px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-caption,#adb2b8);font:inherit;font-size:12.5px;line-height:18px;cursor:pointer}.ms-model:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08));color:var(--dsw-alias-label-primary,#f9fafb)}"
      + ".ms-model span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}"
      + ".ms-track{position:relative;height:26px;border-radius:999px;background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08));cursor:pointer;touch-action:none;outline:none}"
      + ".ms-track:focus-visible{box-shadow:0 0 0 2px #9b82f5}"
      + ".ms-fill{position:absolute;left:0;top:0;bottom:0;border-radius:999px;background:#9b82f5;transition:width .12s ease}"
      + ".ms-dot{position:absolute;top:50%;width:4px;height:4px;margin:-2px 0 0 -2px;border-radius:50%;background:rgba(255,255,255,.35)}.ms-dot-on{background:rgba(255,255,255,.7)}"
      + ".ms-knob{position:absolute;top:50%;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.4);transition:left .12s ease}"
      + ".ms-track.ms-drag .ms-knob,.ms-track.ms-drag .ms-fill{transition:none}.ms-track-off{opacity:.55;pointer-events:none}"
      + ".ms-opts{margin-top:10px}"
      + ".ms-lh{padding:2px 4px 8px;font-size:12px;color:var(--dsw-alias-label-caption,#adb2b8)}"
      + ".ms-search{width:100%;box-sizing:border-box;height:28px;margin-bottom:6px;padding:0 8px;border-radius:8px;border:1px solid var(--dsw-alias-border-l3,rgba(255,255,255,.16));background:transparent;color:inherit;font:inherit;font-size:12.5px;outline:none}.ms-search:focus{border-color:#9b82f5}"
      + ".ms-list{max-height:280px;overflow:auto;margin:0 -4px;padding:0 4px}"
      + ".ms-grp{padding:8px 6px 3px;font-size:11px;letter-spacing:.03em;color:var(--dsw-alias-label-caption,#adb2b8)}"
      + ".ms-item{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;padding:6px 8px;border:0;border-radius:8px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}.ms-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08))}"
      + ".ms-check{width:13px;height:13px;flex:none;color:#a78bfa}"
      + ".apv-spin{width:14px;height:14px;border-radius:50%;border:2px solid var(--aui-line);border-top-color:var(--aui-accent);animation:aui-spin .8s linear infinite;flex:none}";

    // ---- shared settings layout (same "aui" look as live2D / live3D) ----
    function auiSwitch(on, onChange, disabled) {
      return jsx("label", { className: "aui-switch", children: [
        jsx("input", { key: "i", type: "checkbox", checked: !!on, disabled: !!disabled, onChange: onChange }),
        jsx("span", { key: "t", className: "aui-switch-track" })
      ] });
    }
    function auiNote(note) {
      return note ? jsx("div", { className: "aui-note apv-note" + (note.error ? " aui-note-error" : ""), children: note.text }) : null;
    }

    // ---- host half (guarded: custom header + JSON) ----
    function host(method, url, body) {
      var init = { method: method, headers: { "x-amadeus-providers": "1" } };
      if (method === "POST") { init.headers["content-type"] = "application/json"; init.body = JSON.stringify(body || {}); }
      return fetch(url, init).then(function (r) { return r.json(); });
    }
    function clog(msg) { try { host("POST", "/amadeus-providers/log", { msg: String(msg) }).catch(function () {}); } catch (e) {} }

    // ---- DSH remote services (injected in apply) ----
    var api = { remote: null, listeners: [], releaseSeat: null };
    function remoteReady() { var r = api.remote; return !!(r && r.settings && r.credentials); }
    function notifyRemote() { api.listeners.slice().forEach(function (f) { try { f(); } catch (e) {} }); }

    var NS = "llm-pi-ai";
    var DEFAULT_EFFORTS = { off: null, low: "low", medium: "medium", high: "high" };   // what DSH offers by default
    var LEVELS = ["off", "minimal", "low", "medium", "high", "xhigh", "max"];
    var LEVEL_RU = { off: "выкл", minimal: "минимум", low: "низкая", medium: "средняя", high: "высокая", xhigh: "очень высокая", max: "максимум" };
    var PROTOCOLS = [["openai-completions", "OpenAI Chat Completions"], ["openai-responses", "OpenAI Responses"], ["anthropic-messages", "Anthropic Messages"], ["google-generative-ai", "Google Gemini"]];
    var VIA = { litellm: "LiteLLM /model/info", openai: "/models", anthropic: "Anthropic /v1/models", gemini: "Gemini /models" };

    // ---- formatting ----
    function fmtTokens(n) {
      if (!n) return "—";
      if (n >= 1000000) { if (n % 1048576 === 0) return n / 1048576 + "M"; return (Math.round(n / 1e5) / 10) + "M"; }
      if (n >= 1024 && n % 1024 === 0) return n / 1024 + "K";
      if (n >= 1000) return Math.round(n / 1000) + "K";
      return String(n);
    }
    function fmtPrice(n) {
      var s = n >= 10 ? n.toFixed(0) : n >= 1 ? n.toFixed(2) : n.toFixed(4);
      if (s.indexOf(".") >= 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
      return "$" + s;
    }
    function fmtAgo(ms) {
      var min = Math.round((Date.now() - ms) / 60000);
      if (min < 1) return "только что";
      if (min < 60) return min + " мин назад";
      var h = Math.round(min / 60);
      return h < 24 ? h + " ч назад" : Math.round(h / 24) + " дн назад";
    }
    function plural(n, one, few, many) {
      var m = n % 100, d = n % 10;
      if (m > 10 && m < 20) return many;
      if (d === 1) return one;
      if (d >= 2 && d <= 4) return few;
      return many;
    }
    function slug(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40); }
    function refFor(id) { return String(id).toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") + "_API_KEY"; }

    /** The rows of one provider: what is enabled (in the settings) plus what the last check found. */
    function modelRows(prof, rec) {
      var list = Array.isArray(prof.models) ? prof.models : [];
      var enabled = {}; list.forEach(function (m) { enabled[m.id] = m; });
      var known = (rec && rec.models) || {}; var manual = (rec && rec.cost) || {};
      var ids = list.map(function (m) { return m.id; });
      Object.keys(known).sort().forEach(function (id) { if (!enabled[id]) ids.push(id); });
      return ids.map(function (id) {
        var cfg = enabled[id], k = known[id] || {};
        var cost = Object.assign({}, k.cost || {}, manual[id] || {});
        return {
          id: id, enabled: !!cfg, kind: k.kind || "chat",
          name: (cfg && cfg.name) || k.name || id,
          contextWindow: (cfg && cfg.contextWindow) || k.contextWindow,
          contextDefault: !((cfg && cfg.contextWindow) || k.contextWindow),
          maxTokens: (cfg && cfg.maxTokens) || k.maxTokens,
          input: (cfg && cfg.input) || k.input || ["text"],
          tools: k.tools, reasoning: cfg && cfg.reasoningEfforts !== undefined ? !!cfg.reasoningEfforts : k.reasoning, cache: k.cache,
          efforts: cfg ? cfg.reasoningEfforts : undefined,
          cost: Object.keys(cost).length ? cost : null, costManual: !!manual[id]
        };
      });
    }
    function entryFor(row) {
      var e = { id: row.id };
      if (row.name && row.name !== row.id) e.name = row.name;
      if (row.contextWindow) e.contextWindow = row.contextWindow;
      if (row.maxTokens) e.maxTokens = row.maxTokens;
      if (row.input && row.input.length) e.input = row.input;
      if (row.reasoning === true && row.efforts === undefined) e.reasoningEfforts = Object.assign({}, DEFAULT_EFFORTS);
      return e;
    }

    // ================================================================= store (settings + credentials + what was learned)
    function useStore() {
      var st = react.useState({ loaded: false, error: "", writable: true, revision: undefined, providers: {}, creds: {}, meta: {} });
      var state = st[0], setState = st[1];
      var ref = react.useRef(state); ref.current = state;
      var tickState = react.useState(0); var setTick = tickState[1];

      var applyView = function (view) {
        var providers = (view && view.value && view.value.providers) || {};
        setState(function (p) { return Object.assign({}, p, { providers: providers, revision: view.revision }); });
      };
      var reload = function () {
        if (!remoteReady()) return Promise.resolve();
        var remote = api.remote;
        return remote.settings.describe().then(function (d) {
          if (!d.ok) throw new Error(d.error && d.error.message || "не удалось прочитать настройки");
          var view = d.value;
          var ns = (view.namespaces || []).filter(function (n) { return n.ns === NS; })[0];
          if (!ns) { setState(function (p) { return Object.assign({}, p, { loaded: true, error: "Адаптер llm-pi-ai не подключён к этому профилю — провайдеры настраивать негде." }); }); return null; }
          var providers = (ns.value && ns.value.providers) || {};
          var refs = []; Object.keys(providers).forEach(function (id) { var r = providers[id].apiKeyEnv; if (r && refs.indexOf(r) < 0) refs.push(r); });
          return Promise.all([
            refs.length ? remote.credentials.describe(refs) : Promise.resolve({ ok: true, value: {} }),
            host("GET", "/amadeus-providers/meta").catch(function () { return { providers: {} }; })
          ]).then(function (r) {
            setState({ loaded: true, error: "", writable: view.writable !== false, revision: ns.revision, providers: providers, creds: (r[0] && r[0].ok && r[0].value) || {}, meta: (r[1] && r[1].providers) || {} });
          });
        }).catch(function (e) { clog("reload: " + (e && e.message || e)); setState(function (p) { return Object.assign({}, p, { loaded: true, error: String(e && e.message || e) }); }); });
      };
      var reloadMeta = function () {
        return host("GET", "/amadeus-providers/meta").then(function (m) { setState(function (p) { return Object.assign({}, p, { meta: (m && m.providers) || {} }); }); }).catch(function () {});
      };
      /** One write against llm-pi-ai; a stale revision reloads and says so. */
      var write = function (ops) {
        var remote = api.remote;
        return remote.settings.mutate(NS, ops, ref.current.revision).then(function (r) {
          if (r.ok) { applyView(r.value); return { ok: true }; }
          var code = r.error && r.error.code, message = (r.error && r.error.message) || "запись отклонена";
          if (code === "settings/conflict") { return reload().then(function () { return { ok: false, error: "Настройки изменились в другом месте — обновил, повторите." }; }); }
          return { ok: false, error: message };
        }).catch(function (e) { return { ok: false, error: String(e && e.message || e) }; });
      };
      react.useEffect(function () {
        var f = function () { setTick(function (t) { return t + 1; }); };
        api.listeners.push(f);
        if (remoteReady()) reload();
        return function () { api.listeners = api.listeners.filter(function (x) { return x !== f; }); };
      }, []);
      react.useEffect(function () { if (remoteReady() && !ref.current.loaded) reload(); });
      return { state: state, reload: reload, reloadMeta: reloadMeta, write: write };
    }

    // ================================================================= one provider
    function ProviderCard(p) {
      var pid = p.pid, prof = p.prof, store = p.store, rec = p.rec || {};
      var openState = react.useState(false); var open = openState[0], setOpen = openState[1];
      var busyState = react.useState(false); var busy = busyState[0], setBusy = busyState[1];
      var noteState = react.useState(null); var note = noteState[0], setNote = noteState[1];
      var qState = react.useState(""); var q = qState[0], setQ = qState[1];
      var onlyState = react.useState(false); var onlyOn = onlyState[0], setOnlyOn = onlyState[1];
      var costState = react.useState(null); var costEdit = costState[0], setCostEdit = costState[1];
      var effState = react.useState(null); var effEdit = effState[0], setEffEdit = effState[1];
      var editState = react.useState(false); var editing = editState[0], setEditing = editState[1];

      var cred = prof.apiKeyEnv ? store.state.creds[prof.apiKeyEnv] : null;
      var keyOk = !prof.apiKeyEnv ? null : !!(cred && cred.configured);
      var rows = modelRows(prof, rec);
      var enabledCount = rows.filter(function (r) { return r.enabled; }).length;
      var custom = !!(prof.api && prof.baseURL);
      var needle = q.trim().toLowerCase();
      var shown = rows.filter(function (r) { return (!onlyOn || r.enabled) && (!needle || (r.id + " " + r.name).toLowerCase().indexOf(needle) >= 0); });
      var title = prof.displayName || pid;

      var check = function () {
        setBusy(true); setNote(null);
        var done = function (msg) { setBusy(false); setNote(msg); };
        if (!prof.baseURL) { done({ text: "У этого провайдера нет своего адреса — модели берутся из каталога pi-ai.", error: false }); return; }
        host("POST", "/amadeus-providers/probe", { provider: pid, baseURL: prof.baseURL, api: prof.api, apiKeyEnv: prof.apiKeyEnv }).then(function (r) {
          if (!r.ok) { done({ text: r.error || "Не удалось проверить.", error: true }); return; }
          return store.reloadMeta().then(function () {
            var n = r.models.length, enabledNow = (prof.models || []).length;
            done({ text: "Найдено " + n + " " + plural(n, "модель", "модели", "моделей") + " · " + (VIA[r.via] || r.via) + (r.keyUsed ? " · ключ подошёл" : " · без ключа") + ". Включено в чате: " + enabledNow + "." });
            setOpen(true);
          });
        }).catch(function (e) { done({ text: "Ошибка: " + (e && e.message || e), error: true }); });
      };

      var writeModels = function (list) {
        setBusy(true);
        return store.write([{ op: "set", path: ["providers", pid, "models"], value: list }]).then(function (r) {
          setBusy(false);
          if (!r.ok) setNote({ text: r.error, error: true }); else setNote(null);
          return r;
        });
      };
      var toggle = function (row, on) {
        var cur = Array.isArray(prof.models) ? prof.models.slice() : [];
        if (on) {
          if (cur.some(function (m) { return m.id === row.id; })) return;
          cur.push(entryFor(row));
        } else {
          if (custom && cur.length <= 1) { setNote({ text: "У подключения должна остаться хотя бы одна модель. Включите другую и выключите эту.", error: true }); return; }
          cur = cur.filter(function (m) { return m.id !== row.id; });
        }
        writeModels(cur);
      };
      var enableAll = function () {
        var cur = Array.isArray(prof.models) ? prof.models.slice() : [];
        var have = {}; cur.forEach(function (m) { have[m.id] = 1; });
        rows.forEach(function (r) { if (!have[r.id] && r.kind === "chat") cur.push(entryFor(r)); });
        writeModels(cur);
      };
      // reasoningEfforts of one model: an object of levels (value = wire spelling, null for "off"), false (does not reason) or absent
      var saveEfforts = function (id, mode) {
        var cur = (Array.isArray(prof.models) ? prof.models : []).map(function (m) {
          if (m.id !== id) return m;
          var n = Object.assign({}, m);
          var old = (m.reasoningEfforts && typeof m.reasoningEfforts === "object") ? m.reasoningEfforts : {};
          if (mode === "reset") delete n.reasoningEfforts;
          else if (mode === "none") n.reasoningEfforts = false;
          else {
            var out = {};
            LEVELS.forEach(function (l) { if (effEdit && effEdit.levels[l]) out[l] = l === "off" ? null : (typeof old[l] === "string" ? old[l] : l); });
            if (!Object.keys(out).length) delete n.reasoningEfforts; else n.reasoningEfforts = out;
          }
          return n;
        });
        writeModels(cur).then(function (r) { if (r && r.ok) setEffEdit(null); });
      };
      var openEfforts = function (r) {
        var levels = {};
        if (r.efforts && typeof r.efforts === "object") Object.keys(r.efforts).forEach(function (l) { levels[l] = true; });
        setEffEdit(effEdit && effEdit.id === r.id ? null : { id: r.id, levels: levels });
      };
      var needLevels = rows.filter(function (r) { return r.enabled && r.reasoning === true && r.efforts === undefined; });
      var addLevels = function () {
        var ids = {}; needLevels.forEach(function (r) { ids[r.id] = 1; });
        writeModels((Array.isArray(prof.models) ? prof.models : []).map(function (m) { return ids[m.id] ? Object.assign({}, m, { reasoningEfforts: Object.assign({}, DEFAULT_EFFORTS) }) : m; }));
      };
      var saveCost = function () {
        var c = costEdit; if (!c) return;
        var payload = {}; payload[c.id] = (c.input === "" && c.output === "") ? null : { input: c.input === "" ? undefined : Number(c.input), output: c.output === "" ? undefined : Number(c.output) };
        host("POST", "/amadeus-providers/meta", { provider: pid, set: { cost: payload } }).then(function () { setCostEdit(null); store.reloadMeta(); });
      };
      var resetCost = function (id) {
        var payload = {}; payload[id] = null;
        host("POST", "/amadeus-providers/meta", { provider: pid, set: { cost: payload } }).then(function () { setCostEdit(null); store.reloadMeta(); });
      };
      var remove = function () {
        if (!window.confirm("Удалить подключение «" + title + "»? Его модели пропадут из выбора.")) return;
        setBusy(true);
        store.write([{ op: "unset", path: ["providers", pid] }]).then(function (r) {
          if (!r.ok) { setBusy(false); setNote({ text: r.error, error: true }); return; }
          host("POST", "/amadeus-providers/meta", { provider: pid, remove: true });
          if (prof.apiKeyEnv && prof.apiKeyEnv === refFor(pid) && api.remote.credentials.unset) api.remote.credentials.unset(prof.apiKeyEnv);
          store.reload();
        });
      };

      var chip = function (key, text, cls, title) { return jsx("span", { key: key, className: "apv-chip" + (cls ? " " + cls : ""), title: title || null, children: text }); };
      var modelRow = function (r) {
        var caps = [];
        // Only what helps to choose a model. Everyone takes text and (almost) everyone calls tools, so those are
        // not shown; the output cap and prompt caching live in the tooltips of the chips they belong to.
        var ctxTitle = r.contextDefault ? "Провайдер не сообщает контекст: DSH считает его по умолчанию" : "Окно контекста" + (r.maxTokens ? ". Ответ до " + fmtTokens(r.maxTokens) + " токенов" : "");
        caps.push(chip("c", [jsx("b", { key: "b" }, (r.contextDefault ? "~" : "") + fmtTokens(r.contextWindow || prof.defaultContextWindow || 1000000)), " контекст"], r.contextDefault ? "apv-chip-dim" : "", ctxTitle));
        if (r.input.indexOf("image") >= 0) caps.push(chip("i", "картинки", "apv-chip-on", "Принимает изображения"));
        if (r.enabled) {
          var lv = r.efforts && typeof r.efforts === "object" ? Object.keys(r.efforts) : null;
          var label = lv ? "рассуждения: " + lv.map(function (l) { return LEVEL_RU[l] || l; }).join(" · ") : r.efforts === false ? "без рассуждений" : r.reasoning === true ? "рассуждения: настроить" : null;
          if (label) caps.push(jsx("button", { key: "r", type: "button", className: "apv-chip" + (lv ? " apv-chip-ok" : " apv-chip-dim"), title: lv ? "Уровни рассуждения в выборе чата. Нажмите, чтобы изменить." : r.efforts === false ? "Модель заявлена без рассуждений. Нажмите, чтобы изменить." : "Модель умеет рассуждать, но выбор уровня в чате не настроен. Нажмите, чтобы настроить.", onClick: function () { openEfforts(r); }, children: label }));
          else caps.push(jsx("button", { key: "r", type: "button", className: "apv-chip apv-chip-dim", title: "Задать уровни рассуждения для выбора в чате", onClick: function () { openEfforts(r); }, children: "+ рассуждения" }));
        } else if (r.reasoning === true) caps.push(chip("r", "рассуждения", "apv-chip-ok", "Умеет думать перед ответом. Включите модель, чтобы настроить уровни."));
        if (r.tools === false) caps.push(chip("t", "без инструментов", "apv-chip-warn", "Не умеет вызывать инструменты: агентом в DSH работать не сможет"));
        if (r.kind !== "chat") caps.push(chip("kind", { embedding: "эмбеддинги", image: "картинки (генерация)", audio: "аудио", other: "не чат" }[r.kind] || "не чат", "apv-chip-dim", "Не чат-модель: в выборе модели не нужна"));
        var cost = r.cost && (r.cost.input !== undefined || r.cost.output !== undefined) ? r.cost : null;
        var costTitle = cost ? "Цена за 1 млн токенов: вход " + (cost.input !== undefined ? fmtPrice(cost.input) : "?") + ", выход " + (cost.output !== undefined ? fmtPrice(cost.output) : "?") + (cost.cacheRead !== undefined ? ", из кэша " + fmtPrice(cost.cacheRead) : "") + (r.cache === true ? ". Кэш промпта поддерживается: повторяющийся контекст дешевле" : "") + (r.costManual ? " (задана вами)" : " (по данным провайдера)") + ". Нажмите, чтобы изменить." : "Цена неизвестна. Нажмите, чтобы указать.";
        var costBtn = (jsx("button", { key: "$", type: "button", className: "apv-chip apv-cost" + (cost ? " apv-chip-on" : " apv-chip-dim"), title: costTitle, onClick: function () { setCostEdit(costEdit && costEdit.id === r.id ? null : { id: r.id, input: cost && cost.input !== undefined ? String(cost.input) : "", output: cost && cost.output !== undefined ? String(cost.output) : "" }); }, children: cost ? [jsx("b", { key: "a" }, (cost.input !== undefined ? fmtPrice(cost.input) : "?") + " / " + (cost.output !== undefined ? fmtPrice(cost.output) : "?")), " за 1M"] : "цена —" }));
        return jsx("div", { key: r.id, className: "apv-model" + (r.enabled ? "" : " apv-model-off"), children: [
          jsx("div", { key: "s" }, auiSwitch(r.enabled, function (e) { toggle(r, e.target.checked); }, busy || !store.state.writable || (r.kind !== "chat" && !r.enabled))),
          jsx("div", { key: "n", className: "apv-mname", children: [jsx("b", { key: "a", title: r.name }, r.name), r.name !== r.id ? jsx("span", { key: "b" }, r.id) : null] }),
          costBtn,
          jsx("div", { key: "c", className: "apv-chips", children: caps }),
          effEdit && effEdit.id === r.id ? jsx("div", { key: "ef", className: "apv-edit-cost", children: [
            jsx("span", { key: "l" }, "Уровни рассуждения в чате:"),
            jsx("span", { key: "c", style: { display: "inline-flex", flexWrap: "wrap", gap: 6 }, children: LEVELS.map(function (l) {
              var on = !!effEdit.levels[l];
              return jsx("button", { key: l, type: "button", className: "apv-chip" + (on ? " apv-chip-on" : ""), onClick: function () { var lv = Object.assign({}, effEdit.levels); if (on) delete lv[l]; else lv[l] = true; setEffEdit({ id: effEdit.id, levels: lv }); }, children: (on ? "✓ " : "") + (LEVEL_RU[l] || l) });
            }) }),
            jsx("button", { key: "p", type: "button", className: "aui-btn", title: "выкл, низкая, средняя, высокая", onClick: function () { setEffEdit({ id: effEdit.id, levels: { off: true, low: true, medium: true, high: true } }); }, children: "Стандарт" }),
            jsx("button", { key: "s", type: "button", className: "aui-btn aui-btn-primary", disabled: busy, onClick: function () { saveEfforts(r.id, "levels"); }, children: "Сохранить" }),
            jsx("button", { key: "n", type: "button", className: "aui-btn", disabled: busy, onClick: function () { saveEfforts(r.id, "none"); }, children: "Не рассуждает" }),
            r.efforts !== undefined ? jsx("button", { key: "r", type: "button", className: "aui-btn", disabled: busy, onClick: function () { saveEfforts(r.id, "reset"); }, children: "Сбросить" }) : null,
            jsx("button", { key: "x", type: "button", className: "aui-btn", onClick: function () { setEffEdit(null); }, children: "Отмена" })
          ] }) : null,
          costEdit && costEdit.id === r.id ? jsx("div", { key: "e", className: "apv-edit-cost", children: [
            jsx("span", { key: "l" }, "Цена за 1M токенов, $:"),
            jsx("label", { key: "i" }, ["вход ", jsx("input", { key: "x", className: "apv-num", type: "number", min: "0", step: "any", value: costEdit.input, onChange: function (e) { setCostEdit(Object.assign({}, costEdit, { input: e.target.value })); } })]),
            jsx("label", { key: "o" }, ["выход ", jsx("input", { key: "x", className: "apv-num", type: "number", min: "0", step: "any", value: costEdit.output, onChange: function (e) { setCostEdit(Object.assign({}, costEdit, { output: e.target.value })); } })]),
            jsx("button", { key: "s", type: "button", className: "aui-btn aui-btn-primary", onClick: saveCost, children: "Сохранить" }),
            r.costManual ? jsx("button", { key: "r", type: "button", className: "aui-btn", onClick: function () { resetCost(r.id); }, children: "К данным провайдера" }) : null,
            jsx("button", { key: "c", type: "button", className: "aui-btn", onClick: function () { setCostEdit(null); }, children: "Отмена" })
          ] }) : null
        ] });
      };

      var statusDot = jsx("span", { key: "d", className: "apv-dot" + (keyOk === false ? " apv-dot-off" : keyOk === null && !custom ? " apv-dot-warn" : ""), title: keyOk === false ? "Ключ не задан" : keyOk ? "Ключ сохранён" : "Ключ не требуется или берётся из окружения" });
      var head = jsx("div", { key: "h", className: "apv-head", onClick: function () { setOpen(!open); }, children: [
        jsx("svg", { key: "v", className: "apv-chev", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }, jsx("path", { d: "M6 3.5 10.5 8 6 12.5" })),
        jsx("span", { key: "n", className: "apv-name" }, title),
        title !== pid ? jsx("span", { key: "i", className: "apv-id" }, pid) : null,
        jsx("span", { key: "b", className: "apv-badge" }, custom ? "Свой" : "Каталог"),
        statusDot,
        jsx("span", { key: "c", className: "apv-count" }, enabledCount + " " + plural(enabledCount, "модель включена", "модели включены", "моделей включено") + (rows.length > enabledCount ? " из " + rows.length : "")),
        jsx("span", { key: "a", className: "apv-actions", onClick: function (e) { e.stopPropagation(); }, children: [
          jsx("button", { key: "k", type: "button", className: "aui-btn", disabled: busy, onClick: check, children: busy ? jsx("span", { className: "apv-spin" }) : "Проверить" }),
          jsx("button", { key: "e", type: "button", className: "aui-btn", disabled: busy || !store.state.writable, onClick: function () { setEditing(!editing); setOpen(true); }, children: "Изменить" }),
          jsx("button", { key: "d", type: "button", className: "aui-btn", style: { color: "#f38f9c" }, disabled: busy || !store.state.writable, onClick: remove, children: "Удалить" })
        ] })
      ] });

      var body = null;
      if (open) {
        var tools = rows.length > 6 ? jsx("div", { key: "t", className: "apv-tools", children: [
          jsx("input", { key: "q", className: "aui-search", type: "search", placeholder: "Найти модель…", value: q, onChange: function (e) { setQ(e.target.value); } }),
          jsx("button", { key: "o", type: "button", className: "aui-btn", onClick: function () { setOnlyOn(!onlyOn); }, children: onlyOn ? "Показать все" : "Только включённые" }),
          jsx("button", { key: "a", type: "button", className: "aui-btn", disabled: busy || !store.state.writable, onClick: enableAll, children: "Включить все чат-модели" })
        ] }) : null;
        body = jsx("div", { key: "b", className: "apv-body", children: [
          auiNote(note),
          rec.checkedAt ? jsx("div", { key: "m", className: "apv-meta", children: [
            jsx("span", { key: "a" }, "Проверено " + fmtAgo(rec.checkedAt) + (rec.via ? " · " + (VIA[rec.via] || rec.via) : "")),
            prof.baseURL ? jsx("span", { key: "u", title: prof.baseURL }, prof.baseURL) : null
          ] }) : jsx("div", { key: "m", className: "apv-meta" }, prof.baseURL ? prof.baseURL + " · нажмите «Проверить», чтобы увидеть все модели провайдера" : "Модели этого провайдера берутся из каталога pi-ai."),
          needLevels.length ? jsx("div", { key: "lv", className: "apv-meta", children: [
            jsx("span", { key: "t" }, needLevels.length + " " + plural(needLevels.length, "модель рассуждает", "модели рассуждают", "моделей рассуждают") + ", но выбора уровня в чате нет."),
            jsx("button", { key: "b", type: "button", className: "aui-btn", disabled: busy || !store.state.writable, onClick: addLevels, children: "Включить уровни" })
          ] }) : null,
          editing ? jsx(ProviderForm, { key: "f", mode: "edit", store: store, pid: pid, prof: prof, onDone: function (msg) { setEditing(false); if (msg) setNote(msg); }, onCancel: function () { setEditing(false); } }) : null,
          tools,
          shown.length ? shown.map(modelRow) : jsx("div", { key: "e", className: "apv-empty" }, rows.length ? "Ничего не нашлось." : "Моделей пока нет. Нажмите «Проверить».")
        ] });
      }
      return jsx("section", { className: "apv-card" + (open ? " apv-open" : "") }, [head, body]);
    }

    // ================================================================= add / edit form
    function ProviderForm(p) {
      var mode = p.mode, store = p.store, prof = p.prof || {};
      var edit = mode === "edit";
      var s = react.useState({
        name: edit ? (prof.displayName || p.pid) : "", baseURL: prof.baseURL || "", api: prof.api || "openai-completions", key: "",
        manual: "", probe: null, picked: {}, busy: false, error: ""
      });
      var f = s[0], setF = s[1];
      var set = function (patch) { setF(function (prev) { return Object.assign({}, prev, patch); }); };
      var id = edit ? p.pid : slug(f.name);
      var ref = edit ? prof.apiKeyEnv : refFor(id || "provider");

      var check = function () {
        set({ busy: true, error: "", probe: null });
        host("POST", "/amadeus-providers/probe", { baseURL: f.baseURL, api: f.api, apiKey: f.key, apiKeyEnv: edit ? prof.apiKeyEnv : undefined }).then(function (r) {
          if (!r.ok) { set({ busy: false, error: r.error || "Не удалось проверить." }); return; }
          var picked = {}; r.models.filter(function (m) { return m.kind === "chat"; }).slice(0, 40).forEach(function (m) { picked[m.id] = true; });
          set({ busy: false, probe: r, picked: picked });
        }).catch(function (e) { set({ busy: false, error: String(e && e.message || e) }); });
      };
      var addManual = function () {
        var m = f.manual.trim(); if (!m) return;
        var probe = f.probe || { ok: true, via: "manual", models: [] };
        if (probe.models.some(function (x) { return x.id === m; })) { set({ manual: "" }); return; }
        var picked = Object.assign({}, f.picked); picked[m] = true;
        set({ probe: Object.assign({}, probe, { models: probe.models.concat([{ id: m, name: m, kind: "chat", input: ["text"] }]) }), picked: picked, manual: "" });
      };

      var save = function () {
        if (!edit) {
          if (!id) { set({ error: "Дайте подключению имя." }); return; }
          if (store.state.providers[id]) { set({ error: "Подключение «" + id + "» уже есть." }); return; }
        }
        if (!/^https?:\/\//i.test(f.baseURL.trim())) { set({ error: "Укажите базовый URL, например https://api.example.com/v1." }); return; }
        var models = (f.probe ? f.probe.models : []).filter(function (m) { return f.picked[m.id]; }).map(function (m) { return entryFor({ id: m.id, name: m.name, contextWindow: m.contextWindow, maxTokens: m.maxTokens, input: m.input, reasoning: m.reasoning }); });
        if (!edit && !models.length) { set({ error: "Отметьте хотя бы одну модель: сначала нажмите «Проверить» или впишите id модели вручную." }); return; }
        set({ busy: true, error: "" });
        var remote = api.remote;
        var storeKey = f.key.trim() ? remote.credentials.set(ref, f.key.trim()) : Promise.resolve({ ok: true });
        storeKey.then(function (kr) {
          if (kr && kr.ok === false) throw new Error(kr.error && kr.error.message || "ключ не сохранён");
          var ops;
          if (edit) {
            ops = [];
            ops.push(f.name.trim() ? { op: "set", path: ["providers", id, "displayName"], value: f.name.trim() } : { op: "unset", path: ["providers", id, "displayName"] });
            ops.push({ op: "set", path: ["providers", id, "baseURL"], value: f.baseURL.trim() });
            ops.push({ op: "set", path: ["providers", id, "api"], value: f.api });
            if (f.key.trim() && prof.apiKeyEnv !== ref) ops.push({ op: "set", path: ["providers", id, "apiKeyEnv"], value: ref });
          } else {
            var value = { displayName: f.name.trim(), api: f.api, baseURL: f.baseURL.trim(), models: models };
            if (f.key.trim()) value.apiKeyEnv = ref;
            ops = [{ op: "set", path: ["providers", id], value: value }];
          }
          return store.write(ops);
        }).then(function (r) {
          if (!r.ok) { set({ busy: false, error: r.error }); return; }
          if (!edit && f.probe && f.probe.models.length) host("POST", "/amadeus-providers/meta", { provider: id, set: { known: f.probe.models, via: f.probe.via } }).then(function () { store.reloadMeta(); });
          set({ busy: false });
          p.onDone({ text: edit ? "Сохранено." : "Подключение добавлено." });
        }).catch(function (e) { set({ busy: false, error: String(e && e.message || e) }); });
      };

      var field = function (key, label, control, hint) {
        return jsx("div", { key: key, className: "apv-field", children: [jsx("label", { key: "l" }, label), control, hint ? jsx("div", { key: "h", className: "apv-hint" }, hint) : null] });
      };
      var keyHint = edit ? (prof.apiKeyEnv ? "Оставьте пустым, чтобы сохранить текущий ключ. Новый заменит его." : "Ключ не задан. Введите, чтобы сохранить.") : "Хранится в защищённом хранилище DSH под именем " + ref + ", в настройки не попадает.";
      var probeModels = f.probe ? f.probe.models : [];
      var pickedCount = probeModels.filter(function (m) { return f.picked[m.id]; }).length;
      return jsx("div", { className: "apv-form", children: [
        jsx("div", { key: "g", className: "apv-grid", children: [
          field("n", "Название", jsx("input", { className: "apv-input", value: f.name, placeholder: "Например, My Gateway", onChange: function (e) { set({ name: e.target.value }); } }), edit ? null : (id ? "Идентификатор: " + id : null)),
          field("p", "Протокол", jsx("select", { className: "aui-select", style: { width: "100%" }, value: f.api, onChange: function (e) { set({ api: e.target.value }); } }, PROTOCOLS.map(function (x) { return jsx("option", { key: x[0], value: x[0] }, x[1]); })))
        ] }),
        field("u", "Базовый URL", jsx("input", { className: "apv-input", value: f.baseURL, placeholder: "https://api.example.com/v1", onChange: function (e) { set({ baseURL: e.target.value }); } })),
        field("k", "API-ключ", jsx("input", { className: "apv-input", type: "password", autoComplete: "new-password", value: f.key, placeholder: edit && prof.apiKeyEnv ? "•••••••• (сохранён)" : "sk-…", onChange: function (e) { set({ key: e.target.value }); } }), keyHint),
        jsx("div", { key: "bt", className: "apv-row-btns", children: [
          jsx("button", { key: "c", type: "button", className: "aui-btn", disabled: f.busy || !f.baseURL.trim(), onClick: check, children: f.busy ? jsx("span", { className: "apv-spin" }) : "Проверить" }),
          f.probe ? jsx("span", { key: "r", className: "apv-hint" }, "Найдено " + probeModels.length + " " + plural(probeModels.length, "модель", "модели", "моделей") + " · " + (VIA[f.probe.via] || f.probe.via)) : null
        ] }),
        f.probe || !edit ? jsx("div", { key: "pm", className: "apv-body", style: { border: "1px solid var(--aui-line)", borderRadius: 12 }, children: [
          probeModels.length ? probeModels.map(function (m) {
            return jsx("div", { key: m.id, className: "apv-model" + (f.picked[m.id] ? "" : " apv-model-off"), children: [
              jsx("div", { key: "s" }, auiSwitch(!!f.picked[m.id], function (e) { var pk = Object.assign({}, f.picked); if (e.target.checked) pk[m.id] = true; else delete pk[m.id]; set({ picked: pk }); }, m.kind !== "chat")),
              jsx("div", { key: "n", className: "apv-mname", children: [jsx("b", { key: "a" }, m.name), m.name !== m.id ? jsx("span", { key: "b" }, m.id) : null] }),
              jsx("div", { key: "c", className: "apv-chips", children: [
                m.contextWindow ? jsx("span", { key: "c", className: "apv-chip" }, ["контекст ", jsx("b", { key: "b" }, fmtTokens(m.contextWindow))]) : null,
                m.input && m.input.indexOf("image") >= 0 ? jsx("span", { key: "i", className: "apv-chip apv-chip-on" }, "картинки") : null,
                m.cost && m.cost.input !== undefined ? jsx("span", { key: "$", className: "apv-chip apv-chip-on" }, fmtPrice(m.cost.input) + " / " + (m.cost.output !== undefined ? fmtPrice(m.cost.output) : "?")) : null,
                m.kind !== "chat" ? jsx("span", { key: "k", className: "apv-chip apv-chip-dim" }, "не чат") : null
              ] })
            ] });
          }) : jsx("div", { key: "e", className: "apv-empty" }, "Нажмите «Проверить» — модели появятся здесь. Или впишите id модели вручную ниже."),
          jsx("div", { key: "man", className: "apv-tools", children: [
            jsx("input", { key: "i", className: "aui-search", placeholder: "Добавить модель вручную: id", value: f.manual, onChange: function (e) { set({ manual: e.target.value }); }, onKeyDown: function (e) { if (e.key === "Enter") addManual(); } }),
            jsx("button", { key: "b", type: "button", className: "aui-btn", onClick: addManual, children: "Добавить" })
          ] })
        ] }) : null,
        f.error ? jsx("div", { key: "er", className: "aui-note aui-note-error", style: { margin: 0 } }, f.error) : null,
        jsx("div", { key: "act", className: "apv-row-btns", children: [
          jsx("button", { key: "s", type: "button", className: "aui-btn aui-btn-primary", disabled: f.busy, onClick: save, children: edit ? "Сохранить" : "Добавить подключение" + (pickedCount ? " (" + pickedCount + ")" : "") }),
          jsx("button", { key: "c", type: "button", className: "aui-btn", disabled: f.busy, onClick: p.onCancel, children: "Отмена" })
        ] })
      ] });
    }

    // ================================================================= page
    function ProvidersPage() {
      var store = useStore();
      var st = store.state;
      var addState = react.useState(false); var adding = addState[0], setAdding = addState[1];
      var noteState = react.useState(null); var note = noteState[0], setNote = noteState[1];
      var ids = Object.keys(st.providers);
      var totalEnabled = 0; ids.forEach(function (id) { totalEnabled += (st.providers[id].models || []).length; });
      var sub = !remoteReady() ? "Подключаюсь к DSH…" : !st.loaded ? "Читаю настройки…" : st.error ? st.error
        : ids.length + " " + plural(ids.length, "подключение", "подключения", "подключений") + " · " + totalEnabled + " " + plural(totalEnabled, "модель включена", "модели включены", "моделей включено") + " в выборе";
      return jsx("div", { className: "aui-page", children: [
        jsx("div", { key: "hero", className: "aui-hero", children: [
          jsx("div", { key: "i", className: "aui-hero-icon" }, "API"),
          jsx("div", { key: "t", className: "aui-hero-text", children: [
            jsx("div", { key: "a", className: "aui-hero-title" }, "Провайдеры моделей"),
            jsx("div", { key: "b", className: "aui-hero-sub" }, sub)
          ] }),
          jsx("div", { key: "act", style: { marginLeft: "auto", display: "flex", gap: 8 }, children: [
            jsx("button", { key: "r", type: "button", className: "aui-btn", onClick: function () { store.reload(); }, children: "Обновить" }),
            jsx("button", { key: "a", type: "button", className: "aui-btn aui-btn-primary", disabled: !st.loaded || !!st.error || !st.writable, onClick: function () { setAdding(!adding); }, children: adding ? "Закрыть" : "Добавить подключение" })
          ] })
        ] }),
        auiNote(note),
        adding ? jsx("section", { key: "add", className: "apv-card apv-open", children: [
          jsx("header", { key: "h", className: "aui-card-head" }, jsx("div", null, [jsx("h3", { key: "a" }, "Новое подключение"), jsx("p", { key: "b" }, "Любой OpenAI-, Anthropic- или Gemini-совместимый адрес: свой сервер, шлюз LiteLLM, OpenRouter. «Проверить» покажет, какие модели там есть.")])),
          jsx(ProviderForm, { key: "f", mode: "new", store: store, onDone: function (msg) { setAdding(false); setNote(msg); setTimeout(function () { setNote(null); }, 4000); }, onCancel: function () { setAdding(false); } })
        ] }) : null,
        st.loaded && !st.error && !ids.length && !adding ? jsx("div", { key: "empty", className: "aui-empty" }, "Своих подключений пока нет. Нажмите «Добавить подключение»: укажите адрес и ключ, проверьте и включите нужные модели.") : null,
        ids.map(function (id) { return jsx(ProviderCard, { key: id, pid: id, prof: st.providers[id], rec: st.meta[id], store: store }); })
      ].filter(Boolean) });
    }

    /** Read-only: what the page will see, written to the host log so a broken Remote shows up without opening the page. */
    function selfCheck() {
      if (!remoteReady()) { clog("selfcheck: remote not ready (settings=" + !!(api.remote && api.remote.settings) + ", credentials=" + !!(api.remote && api.remote.credentials) + ", llm=" + !!(api.remote && api.remote.llm) + ")"); return; }
      api.remote.settings.describe().then(function (d) {
        if (!d.ok) { clog("selfcheck: describe failed: " + (d.error && d.error.message)); return; }
        var ns = (d.value.namespaces || []).filter(function (n) { return n.ns === NS; })[0];
        if (!ns) { clog("selfcheck: namespace " + NS + " missing; have: " + (d.value.namespaces || []).map(function (n) { return n.ns; }).join(",")); return; }
        var provs = (ns.value && ns.value.providers) || {};
        clog("selfcheck: writable=" + d.value.writable + " revision=" + ns.revision + " providers=" + Object.keys(provs).map(function (id) { return id + "(" + (provs[id].models || []).length + (provs[id].apiKeyEnv ? "," + provs[id].apiKeyEnv : "") + ")"; }).join(" "));
        var refs = Object.keys(provs).map(function (id) { return provs[id].apiKeyEnv; }).filter(Boolean);
        if (api.remote.session && api.remote.session.modelCatalog) api.remote.session.modelCatalog().then(function (cat) {
          if (!cat.ok) return;
          var g = (cat.value.groups || []).filter(function (x) { return x.id === "litellm"; })[0];
          clog("selfcheck: litellm models " + JSON.stringify(g ? (g.models || []).slice(0, 3).map(function (m) { return { id: m.id, keys: Object.keys(m), reasoning: m.reasoning || m.efforts || m.reasoningEfforts || null }; }) : null).slice(0, 900));
        }).catch(function () {});
        return api.remote.credentials.describe(refs).then(function (c) { clog("selfcheck: credentials ok=" + c.ok + " " + JSON.stringify(c.ok ? Object.keys(c.value).map(function (k) { return k + "=" + c.value[k].configured; }) : c.error)); });
      }).catch(function (e) { clog("selfcheck error: " + (e && e.message || e)); });
    }

    // ================================================================= the model seat of the composer
    // Replaces DSH's own seat (it takes the single slot with a lower rank): one button "model + level",
    // a slider popup for the level, and the model list one click away. The Team switch DSH adds to the
    // model menu is kept (its slot is rendered under the slider).
    var EFFORT_RU = { off: "Выкл", minimal: "Минимум", low: "Низкое", medium: "Среднее", high: "Высокое", xhigh: "Очень высокое", max: "Максимум" };
    function effortName(e) { return EFFORT_RU[e.id] || e.name || e.id; }
    var catalog = { at: 0, value: null, pending: null };
    /** DSH's own model catalog: providers, models and the levels each model offers. */
    function loadCatalog(force) {
      if (!api.remote || !api.remote.session || !api.remote.session.modelCatalog) return Promise.resolve(null);
      if (!force && catalog.value && Date.now() - catalog.at < 20000) return Promise.resolve(catalog.value);
      if (catalog.pending) return catalog.pending;
      catalog.pending = api.remote.session.modelCatalog().then(function (c) { catalog.pending = null; if (c && c.ok) { catalog.value = c.value; catalog.at = Date.now(); } return catalog.value; }).catch(function () { catalog.pending = null; return catalog.value; });
      return catalog.pending;
    }
    var CHEV = jsx("svg", { className: "ms-chev", viewBox: "0 0 12 12", fill: "none", stroke: "currentColor", strokeWidth: "1.6", strokeLinecap: "round", strokeLinejoin: "round" }, jsx("path", { d: "M3 7.5 6 4.5l3 3" }));
    var CHECK = jsx("svg", { className: "ms-check", viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round" }, jsx("path", { d: "M3.5 8.5l3 3 6-7" }));

    /** If the seat ever fails to draw, it hands the slot back to DSH's own seat instead of leaving the composer without a model picker. */
    var SeatGuard = (function () {
      function G(props) { react.Component.call(this, props); this.state = { failed: false }; }
      G.prototype = Object.create(react.Component.prototype); G.prototype.constructor = G;
      G.getDerivedStateFromError = function () { return { failed: true }; };
      G.prototype.componentDidCatch = function (e) { clog("model seat failed, DSH's own seat is back: " + (e && e.message || e)); api.releaseSeat && api.releaseSeat(); };
      G.prototype.render = function () { return this.state.failed ? null : this.props.children; };
      return G;
    })();

    function ModelSeat(props) {
      return jsx(SeatGuard, null, jsx(ModelSeatInner, props));
    }

    function ModelSeatInner(props) {
      var sid = props.sessionId, locked = !!props.locked;
      var proj = typeof props.useProjection === "function" ? props.useProjection("modelSelection") : undefined;
      var sel = proj ? (proj.next || proj.lastUsed) : null;
      var catState = react.useState(catalog.value); var cat = catState[0], setCat = catState[1];
      var openState = react.useState(false); var open = openState[0], setOpen = openState[1];
      var paneState = react.useState("main"); var pane = paneState[0], setPane = paneState[1];
      var qState = react.useState(""); var q = qState[0], setQ = qState[1];
      var rectState = react.useState(null); var rect = rectState[0], setRect = rectState[1];
      var dragState = react.useState(null); var drag = dragState[0], setDrag = dragState[1];
      var busyState = react.useState(false); var busy = busyState[0], setBusy = busyState[1];
      var btn = react.useRef(null), track = react.useRef(null), held = react.useRef(null);
      var key = sel ? sel.provider + "/" + sel.model : "";
      react.useEffect(function () { if (!api.seatLogged) { api.seatLogged = true; clog("model seat mounted; props: " + Object.keys(props).join(",") + "; selection=" + JSON.stringify(sel)); } }, []);

      react.useEffect(function () {
        var dead = false;
        var f = function () { loadCatalog(false).then(function (c) { if (!dead && c) setCat(c); }); };
        f();
        api.listeners.push(f);
        return function () { dead = true; api.listeners = api.listeners.filter(function (x) { return x !== f; }); };
      }, [key]);
      react.useEffect(function () {
        if (!open) return;
        var close = function (e) {
          if (e.type === "keydown") { if (e.key === "Escape") { if (pane === "models") setPane("main"); else setOpen(false); } return; }
          if (!(e.target && e.target.closest && e.target.closest(".ms-pop, .ms-btn"))) setOpen(false);
        };
        document.addEventListener("mousedown", close); document.addEventListener("keydown", close); window.addEventListener("resize", close);
        return function () { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); window.removeEventListener("resize", close); };
      }, [open, pane]);

      var groups = cat && cat.groups ? cat.groups.filter(function (g) { return (g.models || []).length; }) : [];
      var group = sel ? groups.filter(function (g) { return g.id === sel.provider; })[0] : null;
      var model = group ? (group.models || []).filter(function (m) { return m.id === sel.model; })[0] : null;
      var efforts = model && model.reasoning && Array.isArray(model.reasoning.efforts) ? model.reasoning.efforts : [];
      var hasLevels = efforts.length >= 2;
      var curId = sel ? (sel.reasoningEffort || (model && model.reasoning && model.reasoning.defaultEffort) || "") : "";
      var curIdx = efforts.findIndex(function (e) { return e.id === curId; });
      var auto = !sel || !sel.reasoningEffort;
      var shown = drag !== null ? drag : curIdx;
      var pad = 11;
      var pct = function (i) { return efforts.length > 1 ? i / (efforts.length - 1) : 0; };
      var at = function (i) { return "calc(" + pad + "px + " + pct(i) + " * (100% - " + 2 * pad + "px))"; };

      var select = function (provider, modelId, effortId) {
        var call = api.remote && api.remote.session && api.remote.session.selectModel;
        if (!call || !sid) return Promise.resolve(false);
        setBusy(true);
        var req = { sessionId: sid, provider: provider, model: modelId };
        if (effortId) req.reasoningEffort = effortId;
        return api.remote.session.selectModel(req).then(function (res) { if (!res || !res.ok) { clog("selectModel failed: " + (res && res.error && res.error.message)); return false; } return true; }).catch(function (e) { clog("selectModel: " + (e && e.message || e)); return false; }).finally(function () { setBusy(false); });
      };
      var applyLevel = function (idx) {
        if (!sel || (idx === curIdx && !auto)) return;
        select(sel.provider, sel.model, idx >= 0 ? efforts[idx].id : "");
      };
      var chooseModel = function (g, m) {
        // keep the level when the new model offers it, else its own default (what DSH's own menu does)
        var offered = m.reasoning && Array.isArray(m.reasoning.efforts) ? m.reasoning.efforts : [];
        var effort = offered.some(function (e) { return e.id === (sel && sel.reasoningEffort); }) ? sel.reasoningEffort : (m.reasoning && m.reasoning.defaultEffort) || "";
        select(g.id, m.id, effort).then(function (ok) { if (!ok) return; setQ(""); setPane(offered.length >= 2 ? "main" : "closed"); if (!(offered.length >= 2)) setOpen(false); });
      };
      var indexAt = function (clientX) {
        var r = track.current.getBoundingClientRect();
        var t = Math.min(1, Math.max(0, (clientX - r.left - pad) / Math.max(1, r.width - 2 * pad)));
        return Math.round(t * (efforts.length - 1));
      };
      var onDown = function (e) {
        if (locked || busy) return;
        try { track.current.setPointerCapture(e.pointerId); } catch (x) {}
        held.current = indexAt(e.clientX); setDrag(held.current);
      };
      var onMove = function (e) { if (held.current !== null) { held.current = indexAt(e.clientX); setDrag(held.current); } };
      var onUp = function (e) { if (held.current === null) return; var i = indexAt(e.clientX); held.current = null; setDrag(null); applyLevel(i); };
      var onKey = function (e) {
        if (locked || busy) return;
        var base = curIdx >= 0 ? curIdx : 0;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); applyLevel(Math.min(efforts.length - 1, base + 1)); }
        else if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); applyLevel(Math.max(0, base - 1)); }
      };
      var toggle = function () {
        if (locked) return;
        if (!open && btn.current) { var r = btn.current.getBoundingClientRect(); setRect({ left: Math.max(8, Math.min(r.right - 250, window.innerWidth - 258)), bottom: window.innerHeight - r.top + 8 }); }
        setPane(hasLevels ? "main" : "models"); setQ("");
        setOpen(!open);
      };

      if (!sid) return null;
      var effLabel = hasLevels && shown >= 0 ? effortName(efforts[shown]) : hasLevels ? "Авто" : "";
      var name = model ? model.name || model.id : sel ? sel.model : "Выбрать модель";
      var trigger = jsx("button", { key: "b", ref: btn, type: "button", className: "ms-btn", disabled: locked, "aria-haspopup": "dialog", "aria-expanded": open, title: "Модель и уровень рассуждения", onClick: toggle, children: [
        jsx("span", { key: "n", className: "ms-name" }, name),
        effLabel ? jsx("span", { key: "e", className: "ms-eff" }, effLabel) : null,
        CHEV
      ] });

      var body = null;
      if (open && rect) {
        if (pane === "models") {
          var needle = q.trim().toLowerCase();
          var total = groups.reduce(function (n, g) { return n + g.models.length; }, 0);
          body = [
            jsx("div", { key: "h", className: "ms-lh" }, "Выбрать модель"),
            total > 4 ? jsx("input", { key: "s", className: "ms-search", placeholder: "Найти модель…", autoFocus: true, value: q, onChange: function (e) { setQ(e.target.value); } }) : null,
            jsx("div", { key: "l", className: "ms-list" }, groups.map(function (g) {
              var ms = g.models.filter(function (m) { return !needle || ((m.name || m.id) + " " + m.id).toLowerCase().indexOf(needle) >= 0; });
              if (!ms.length) return null;
              return jsx("div", { key: g.id }, [
                groups.length > 1 ? jsx("div", { key: "g", className: "ms-grp" }, g.name || g.id) : null
              ].concat(ms.map(function (m) {
                var on = sel && sel.provider === g.id && sel.model === m.id;
                return jsx("button", { key: m.id, type: "button", className: "ms-item", disabled: busy, onClick: function () { chooseModel(g, m); }, children: [jsx("span", { key: "t" }, m.name || m.id), on ? CHECK : null] });
              })));
            }))
          ];
        } else {
          body = [
            jsx("div", { key: "h", className: "ms-head", children: [
              jsx("div", { key: "t", className: "ms-title" }, effLabel || "Уровень не задан"),
              jsx("button", { key: "m", type: "button", className: "ms-model", title: "Выбрать другую модель", onClick: function () { setPane("models"); }, children: [jsx("span", { key: "n" }, name), "›"] })
            ] }),
            hasLevels ? jsx("div", { key: "tr", ref: track, className: "ms-track" + (drag !== null ? " ms-drag" : "") + (locked ? " ms-track-off" : ""), role: "slider", tabIndex: 0, "aria-valuemin": 0, "aria-valuemax": efforts.length - 1, "aria-valuenow": Math.max(0, shown), "aria-valuetext": effLabel, onPointerDown: onDown, onPointerMove: onMove, onPointerUp: onUp, onPointerCancel: function () { held.current = null; setDrag(null); }, onKeyDown: onKey, children: [
              jsx("div", { key: "f", className: "ms-fill", style: { width: shown >= 0 ? at(shown) : "0" } })
            ].concat(efforts.map(function (e, i) { return jsx("span", { key: "d" + i, className: "ms-dot" + (shown >= 0 && i <= shown ? " ms-dot-on" : ""), style: { left: at(i) } }); })).concat([
              shown >= 0 ? jsx("div", { key: "k", className: "ms-knob", style: { left: at(shown) } }) : null
            ]) }) : null,
            typeof props.renderSlot === "function" ? jsx("div", { key: "o", className: "ms-opts" }, props.renderSlot("conversation.input.model.options", { locked: locked || busy, dismiss: function () { setOpen(false); }, reportFailure: function (m) { clog("model options: " + m); } })) : null
          ];
        }
      }
      var pop = body ? jsx("div", { className: "ms-pop", style: { left: rect.left, bottom: rect.bottom }, role: "dialog", "aria-label": "Модель и уровень рассуждения", children: body }) : null;
      return jsx(react.Fragment, null, [trigger, reactDom && reactDom.createPortal && pop ? reactDom.createPortal(pop, document.body) : pop]);
    }

    // ---- registration ----
    var inject = ["slots"];
    function apply(ctx) {
      if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=\"amadeus-providers\"]") === null) {
        var tag = document.createElement("style");
        tag.dataset.pluginCss = "amadeus-providers";
        tag.textContent = AUI_CSS + PROV_CSS;
        document.head.appendChild(tag);
      }
      try { ctx.inject(["remote", "remote.settings", "remote.credentials", "remote.llm", "remote.session"], function (c) { api.remote = c.remote; notifyRemote(); selfCheck(); }); } catch (e) { clog("inject remote: " + e); }
      ctx.slots.inject("conversation.input.model", function () {
        // rank -10 shadows DSH's own seat (rank 0); the same child slots keep the Team switch in the menu
        var reg;
        try {
          reg = ctx.slots.register({
            name: "conversation.input.model", priority: -10,
            children: { "conversation.input.model.label": { kind: "single", scope: "session", inline: true }, "conversation.input.model.options": { kind: "list", scope: "session" } },
            inject: function (sessionId) { return { sessionId: sessionId }; }
          }, ModelSeat);
        } catch (e) { clog("model seat not registered, DSH's own seat stays: " + (e && e.message || e)); return function () {}; }
        api.releaseSeat = function () { try { reg(); } catch (e) {} api.releaseSeat = null; };
        return reg;
      });
      ctx.slots.inject("settings.section", function () {
        return ctx.slots.register({ name: "settings.section", id: "providers", order: 86, label: function () { return "Провайдеры"; } }, ProvidersPage);
      });
    }
    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
