window.__ModuleLoader__.load({
  id: "amadeus-harness",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    var react = require("react");
    var jsx = react.createElement;
    var reactDom = null;
    try { reactDom = require("react-dom"); } catch (e) { reactDom = null; }

    var AUI_CSS = __AUI_CSS__;
    var HX_CSS = ".hx-card{display:flex;flex-direction:column;border:1px solid var(--aui-line);border-radius:14px;overflow:hidden;background:color-mix(in srgb,var(--aui-text) 2.5%,transparent)}"
      + ".hx-head{display:flex;align-items:center;flex-wrap:wrap;gap:8px 10px;padding:14px 16px 6px}"
      + ".hx-title{font-size:15px;font-weight:600;line-height:22px}"
      + ".hx-badge{display:inline-flex;align-items:center;height:20px;padding:0 8px;border-radius:6px;border:1px solid var(--aui-line);font-size:11.5px;color:var(--aui-muted)}"
      + ".hx-badge-ok{color:#3ccf8e;border-color:color-mix(in srgb,#3ccf8e 40%,transparent)}.hx-badge-new{color:#f1b76b;border-color:color-mix(in srgb,#f1b76b 45%,transparent)}"
      + ".hx-foot{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px;padding:6px 16px 14px}"
      + ".hx-status{flex:1 1 240px;display:flex;align-items:center;gap:8px;min-width:0;font-size:13px;line-height:18px;color:var(--aui-muted)}"
      + ".hx-status-ok{color:#3ccf8e}.hx-status-new{color:#f1b76b}.hx-status-err{color:#f38f9c}"
      + ".hx-btns{display:flex;flex-wrap:wrap;gap:8px;margin-left:auto}"
      + ".hx-log{margin:0 16px 14px;padding:8px 10px;border-radius:10px;background:var(--aui-hover);font:12px/17px ui-monospace,Consolas,monospace;color:var(--aui-muted);max-height:120px;overflow:auto;white-space:pre-wrap}"
      + ".hx-spin{width:14px;height:14px;border-radius:50%;border:2px solid var(--aui-line);border-top-color:var(--aui-accent);animation:aui-spin .8s linear infinite;flex:none}"
      + ".hx-how{margin:0;padding:0 0 0 18px;font-size:13px;line-height:20px;color:var(--aui-muted)}.hx-how b{color:var(--aui-text)}"
      // the picker in the composer (it sits in DSH's own tool row, so it follows DSH's tokens)
      + ".hxp-btn{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l3,rgba(255,255,255,.16));background:transparent;color:var(--dsw-alias-label-secondary,#cfd3d6);font:inherit;font-size:13px;line-height:1;cursor:pointer;white-space:nowrap;outline:none}"
      + ".hxp-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08));color:var(--dsw-alias-label-primary,#f9fafb)}.hxp-btn:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#7aaaff);outline-offset:1px}.hxp-btn:disabled{opacity:.5;cursor:default}"
      + ".hxp-on{color:var(--dsw-alias-state-business-primary,#7aaaff);border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary,#7aaaff) 55%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#7aaaff) 12%,transparent)}"
      + ".hxp-ico{width:14px;height:14px;flex:none}.hxp-chev{width:10px;height:10px;flex:none;opacity:.7}"
      + ".hxp-menu{position:fixed;z-index:2147483000;min-width:150px;padding:4px;border-radius:10px;border:1px solid var(--dsw-alias-border-l3,rgba(255,255,255,.16));background:var(--dsw-alias-bg-base,#1b1b1d);box-shadow:0 12px 32px rgba(0,0,0,.45);color:var(--dsw-alias-label-primary,#f9fafb);font-size:13px}"
      + ".hxp-item{display:flex;align-items:center;gap:12px;width:100%;padding:6px 10px;border:0;border-radius:8px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}"
      + ".hxp-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08))}"
      + ".hxp-item{justify-content:space-between}"
      + ".hxp-check{margin-left:auto;width:14px;height:14px;color:var(--dsw-alias-state-business-primary,#7aaaff)}"

    function auiRow(key, label, hint, control, disabled) {
      return jsx("div", { key: key, className: "aui-row" + (disabled ? " aui-row-disabled" : ""), children: [
        jsx("div", { key: "t", className: "aui-row-text", children: [
          jsx("div", { key: "l", className: "aui-row-label", children: label }),
          hint ? jsx("div", { key: "h", className: "aui-row-hint", children: hint }) : null
        ] }),
        jsx("div", { key: "c", className: "aui-row-control", children: control })
      ] });
    }

    // ---- host half (guarded: custom header + JSON) ----
    function host(method, url, body) {
      var init = { method: method, headers: { "x-amadeus-harness": "1" } };
      if (method === "POST") { init.headers["content-type"] = "application/json"; init.body = JSON.stringify(body || {}); }
      return fetch(url, init).then(function (r) { return r.json(); });
    }
    function clog(msg) { try { host("POST", "/amadeus-harness/log", { msg: String(msg) }).catch(function () {}); } catch (e) {} }

    var api = { remote: null, listeners: [], synced: false };
    function remoteReady() { return !!(api.remote && api.remote.settings); }
    function notifyRemote() { api.listeners.slice().forEach(function (f) { try { f(); } catch (e) {} }); }

    // The addresses of the provider connections (llm-pi-ai) go to the host: it needs them to reach the
    // chat's model when a harness carries a turn. Keys never leave DSH's store; only their names do.
    var NS = "llm-pi-ai";
    function syncConnections() {
      if (!remoteReady()) return Promise.resolve();
      return api.remote.settings.describe().then(function (d) {
        if (!d || !d.ok) return;
        var ns = (d.value.namespaces || []).filter(function (n) { return n.ns === NS; })[0];
        var provs = (ns && ns.value && ns.value.providers) || {}, table = {};
        Object.keys(provs).forEach(function (id) { var p = provs[id]; if (p.baseURL) table[id] = { baseURL: p.baseURL, apiKeyEnv: p.apiKeyEnv || "", api: p.api || "" }; });
        return host("POST", "/amadeus-harness/connections", { providers: table }).then(function (r) { if (!api.synced) { api.synced = true; clog("connections synced: " + (r && r.count)); } });
      }).catch(function (e) { clog("connections: " + (e && e.message || e)); });
    }

    // ================================================================= the Harnesses page
    function HarnessCard(p) {
      var h = p.harness;
      var s = react.useState({ phase: "idle", check: null, error: "", log: [] });
      var f = s[0], setF = s[1];
      var upd = function (patch) { setF(function (prev) { return Object.assign({}, prev, patch); }); };
      var timer = react.useRef(null);
      react.useEffect(function () { return function () { if (timer.current) clearInterval(timer.current); }; }, []);

      var check = function () {
        upd({ phase: "checking", error: "", check: null });
        host("POST", "/amadeus-harness/check", { id: h.id }).then(function (r) {
          if (!r.ok) { upd({ phase: "idle", error: r.error || "Не удалось проверить." }); return; }
          upd({ phase: "idle", check: r });
        }).catch(function (e) { upd({ phase: "idle", error: "Нет связи с реестром: " + (e && e.message || e) }); });
      };
      var poll = function () {
        host("GET", "/amadeus-harness/install").then(function (r) {
          var job = r && r.jobs && r.jobs[h.id];
          if (!job) return;
          if (job.running) { upd({ log: job.log || [] }); return; }
          clearInterval(timer.current); timer.current = null;
          if (job.error) upd({ phase: "idle", error: job.error, log: [] });
          else { upd({ phase: "idle", check: { ok: true, installed: job.version, latest: job.version, updateAvailable: false, justInstalled: true }, log: [] }); p.onChanged(); }
        }).catch(function () {});
      };
      var install = function () {
        upd({ phase: "installing", error: "", log: [] });
        host("POST", "/amadeus-harness/install", { id: h.id }).then(function (r) {
          if (!r.ok) { upd({ phase: "idle", error: r.error || "Не удалось начать установку." }); return; }
          if (timer.current) clearInterval(timer.current);
          timer.current = setInterval(poll, 1500); poll();
        }).catch(function (e) { upd({ phase: "idle", error: String(e && e.message || e) }); });
      };

      var c = f.check, busy = f.phase !== "idle";
      var status = "", tone = "";
      if (f.error) { status = f.error; tone = "err"; }
      else if (f.phase === "installing") status = "Устанавливаю… это может занять несколько минут: программа весит сотни мегабайт.";
      else if (f.phase === "checking") status = "Проверяю реестр npm…";
      else if (c && c.justInstalled) { status = "Установлена версия " + c.installed + ". Новые запуски пойдут на ней."; tone = "ok"; }
      else if (c && c.updateAvailable) { status = "Доступна версия " + c.latest + " (сейчас " + c.installed + ")."; tone = "new"; }
      else if (c) { status = "Это последняя версия."; tone = "ok"; }
      else if (!h.installed) status = "Не установлен. Плагин скачает его сам (npm) в свою папку.";

      var buttons = [];
      if (!h.installed) buttons.push(jsx("button", { key: "i", type: "button", className: "aui-btn aui-btn-primary", disabled: busy, onClick: install, children: "Установить" }));
      else {
        if (c && c.updateAvailable) buttons.push(jsx("button", { key: "i", type: "button", className: "aui-btn aui-btn-primary", disabled: busy, onClick: install, children: "Установить " + c.latest }));
        buttons.push(jsx("button", { key: "c", type: "button", className: "aui-btn", disabled: busy, onClick: check, children: "Проверить обновления" }));
      }

      return jsx("section", { className: "hx-card", children: [
        jsx("div", { key: "h", className: "hx-head", children: [
          jsx("span", { key: "n", className: "hx-title" }, h.name),
          h.installed ? jsx("span", { key: "v", className: "hx-badge hx-badge-ok" }, h.version ? "версия " + h.version : "версия неизвестна") : jsx("span", { key: "v", className: "hx-badge" }, "не установлен"),
          c && c.updateAvailable ? jsx("span", { key: "u", className: "hx-badge hx-badge-new" }, "есть обновление " + c.latest) : null
        ] }),
        jsx("div", { key: "f", className: "hx-foot", children: [
          jsx("span", { key: "s", className: "hx-status" + (tone ? " hx-status-" + tone : "") }, f.phase === "installing" ? [jsx("span", { key: "sp", className: "hx-spin" }), jsx("span", { key: "t" }, status)] : status),
          jsx("span", { key: "b", className: "hx-btns" }, buttons)
        ] }),
        f.phase === "installing" && f.log.length ? jsx("pre", { key: "l", className: "hx-log" }, f.log.join("\n")) : null
      ].filter(Boolean) });
    }

    function HarnessPage() {
      var st = react.useState({ loaded: false, error: "", harnesses: [] });
      var state = st[0], setState = st[1];
      var load = function () {
        host("GET", "/amadeus-harness/state").then(function (r) {
          if (!r.ok) throw new Error(r.error || "нет ответа");
          setState({ loaded: true, error: "", harnesses: r.harnesses });
        }).catch(function (e) { setState({ loaded: true, error: "Не удалось связаться с плагином: " + (e && e.message || e), harnesses: [] }); });
      };
      react.useEffect(function () { load(); }, []);
      var installed = state.harnesses.filter(function (h) { return h.installed; });
      var sub = !state.loaded ? "Читаю состояние…" : state.error ? state.error : installed.length ? "Установлено: " + installed.map(function (h) { return h.name + (h.version ? " " + h.version : ""); }).join(" · ") : "Харнесы ещё не установлены";
      return jsx("div", { className: "aui-page", children: [
        jsx("div", { key: "hero", className: "aui-hero", children: [
          jsx("div", { key: "i", className: "aui-hero-icon" }, "AI"),
          jsx("div", { key: "t", className: "aui-hero-text", children: [
            jsx("div", { key: "a", className: "aui-hero-title" }, "Харнесы агента"),
            jsx("div", { key: "b", className: "aui-hero-sub", title: sub }, sub)
          ] })
        ] }),
        jsx("section", { key: "how", className: "aui-card", children: [
          jsx("header", { key: "h", className: "aui-card-head" }, jsx("div", null, [jsx("h3", { key: "a" }, "Как пользоваться"), jsx("p", { key: "b" }, "Исполнителя выбирают в самом чате, настроек тут больше нет.")])),
          jsx("div", { key: "b", className: "aui-card-body", style: { padding: "0 18px 16px" } }, jsx("ol", { className: "hx-how" }, [
            jsx("li", { key: 1 }, "Установите нужные харнесы ниже (нужны Node.js и npm)."),
            jsx("li", { key: 2 }, ["В поле ввода слева от модели нажмите ", jsx("b", { key: "b" }, "«DSH»"), " и выберите харнес."]),
            jsx("li", { key: 3 }, "Работает та модель, что выбрана в чате (через её подключение), в папке чата и с правами, которые стоят в чате («Workspace Write» и т. п.).")
          ]))
        ] }),
        state.loaded && state.error ? jsx("div", { key: "err", className: "aui-note aui-note-error", style: { margin: 0 } }, state.error) : null,
        state.harnesses.map(function (h) { return jsx(HarnessCard, { key: h.id, harness: h, onChanged: load }); })
      ].filter(Boolean) });
    }

    // ================================================================= the picker in the composer
    function Icon(p) {
      return jsx("svg", { className: p.className, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, p.children);
    }
    var ICON_CHIP = jsx(Icon, { className: "hxp-ico" }, [jsx("rect", { key: "a", x: "3.5", y: "3.5", width: "9", height: "9", rx: "2" }), jsx("path", { key: "b", d: "M6 1.5v2M10 1.5v2M6 12.5v2M10 12.5v2M1.5 6h2M1.5 10h2M12.5 6h2M12.5 10h2" })]);
    var ICON_CHEV = jsx(Icon, { className: "hxp-chev" }, jsx("path", { d: "M4 10l4-4 4 4" }));
    var ICON_CHECK = jsx(Icon, { className: "hxp-check" }, jsx("path", { d: "M3.5 8.5l3 3 6-7" }));

    function HarnessPicker(props) {
      var sid = props.sessionId, locked = !!props.locked;
      var s = react.useState({ harness: "", list: [], ready: false });
      var state = s[0], setState = s[1];
      var openState = react.useState(false); var open = openState[0], setOpen = openState[1];
      var btn = react.useRef(null);
      var rectState = react.useState(null); var rect = rectState[0], setRect = rectState[1];
      // the chat's own permission preset ("workspace-write" …) is what the harness is held to
      var perm = typeof props.useProjection === "function" ? props.useProjection("permissions") : null;
      var preset = perm && perm.currentValue ? perm.currentValue : "";

      react.useEffect(function () {
        if (!sid) return;
        var dead = false;
        if (!api.propsLogged) { api.propsLogged = true; clog("picker mounted; props: " + Object.keys(props).join(",") + "; permission=" + preset); }
        Promise.all([host("POST", "/amadeus-harness/session", { sessionId: sid }), host("GET", "/amadeus-harness/state")]).then(function (r) {
          if (dead) return;
          var list = (r[1] && r[1].harnesses || []).filter(function (h) { return h.installed; });
          setState({ harness: (r[0] && r[0].harness) || "", list: list, ready: true });
        }).catch(function () {});
        syncConnections();
        return function () { dead = true; };
      }, [sid]);
      react.useEffect(function () {
        if (sid && state.harness && preset) host("POST", "/amadeus-harness/session", { sessionId: sid, permission: preset }).catch(function () {});
      }, [sid, state.harness, preset]);
      react.useEffect(function () {
        if (!open) return;
        var close = function (e) { if (e.type === "keydown" ? e.key === "Escape" : !(e.target && e.target.closest && e.target.closest(".hxp-menu, .hxp-btn"))) setOpen(false); };
        document.addEventListener("mousedown", close); document.addEventListener("keydown", close); window.addEventListener("resize", close);
        return function () { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); window.removeEventListener("resize", close); };
      }, [open]);

      if (!sid || !state.ready || !state.list.length) return null;
      var current = state.list.filter(function (h) { return h.id === state.harness; })[0];
      var choose = function (id) {
        setOpen(false);
        setState(function (prev) { return Object.assign({}, prev, { harness: id }); });
        host("POST", "/amadeus-harness/session", { sessionId: sid, harness: id, permission: preset || undefined }).catch(function () {});
      };
      var toggle = function () {
        if (locked) return;
        if (!open && btn.current) { var r = btn.current.getBoundingClientRect(); setRect({ left: r.left, bottom: window.innerHeight - r.top + 6 }); }
        setOpen(!open);
      };
      var item = function (id, label) {
        return jsx("button", { key: id || "dsh", type: "button", role: "menuitemradio", "aria-checked": state.harness === id, className: "hxp-item", onClick: function () { choose(id); }, children: [
          jsx("span", { key: "t" }, label),
          state.harness === id ? ICON_CHECK : null
        ] });
      };
      var menu = open && rect ? jsx("div", { className: "hxp-menu", style: { left: Math.max(8, rect.left), bottom: rect.bottom }, role: "menu", children: [item("", "DSH")].concat(state.list.map(function (h) { return item(h.id, h.name); })) }) : null;
      var portal = menu && reactDom && reactDom.createPortal ? reactDom.createPortal(menu, document.body) : menu;
      return jsx(react.Fragment, null, [
        jsx("button", { key: "b", ref: btn, type: "button", className: "hxp-btn" + (current ? " hxp-on" : ""), disabled: locked, "aria-haspopup": "menu", "aria-expanded": open, title: locked ? "Исполнитель нельзя менять, пока агент работает" : "Исполнитель чата. Модель, папка и права берутся из этого чата.", onClick: toggle, children: [jsx("span", { key: "l" }, current ? current.name : "DSH"), ICON_CHEV] }),
        portal
      ]);
    }

    // ---- registration ----
    var inject = ["slots"];
    function apply(ctx) {
      if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=\"amadeus-harness\"]") === null) {
        var tag = document.createElement("style");
        tag.dataset.pluginCss = "amadeus-harness";
        tag.textContent = AUI_CSS + HX_CSS;
        document.head.appendChild(tag);
      }
      try {
        ctx.inject(["remote", "remote.settings"], function (c) {
          api.remote = c.remote; notifyRemote();
          syncConnections();
          if (!api.timer) api.timer = setInterval(syncConnections, 60000);
        });
      } catch (e) { clog("inject remote: " + e); }
      ctx.slots.inject("settings.section", function () {
        return ctx.slots.register({ name: "settings.section", id: "harness", order: 87, label: function () { return "Харнесы"; } }, HarnessPage);
      });
      ctx.slots.inject("conversation.input.left", function () {
        return ctx.slots.register({ name: "conversation.input.left", id: "amadeus-harness", order: 40, inject: function (sessionId) { return { sessionId: sessionId }; } }, HarnessPicker);
      });
    }
    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
