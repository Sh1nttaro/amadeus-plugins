// Builds lib/client.js by inlining the agent-visuals.js orb renderer.
// Run: node build.cjs
const fs = require('fs');
const path = require('path');

const libDir = __dirname;
const source = fs.readFileSync(path.join(libDir, 'lib', 'agent-visuals.js'), 'utf8');
const orbSourceJson = JSON.stringify(source);
// Shared settings-page styles (same look as the live2D / live3D tabs).
const auiCssJson = JSON.stringify(fs.readFileSync(path.join(libDir, 'lib', 'aui.css'), 'utf8'));

const client = `window.__ModuleLoader__.load({
	id: "amadeus-orb",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		var react = require("react");
		var jsx = require("react/jsx-runtime").jsx;

		var ORB_SOURCE = ${orbSourceJson};

		function ensureOrb() {
			if (window.AmadeusAgentVisuals) return true;
			if (!ORB_SOURCE) return false;
			try {
				var s = document.createElement("script");
				s.textContent = ORB_SOURCE;
				document.head.appendChild(s);
				return !!window.AmadeusAgentVisuals;
			} catch (e) { return false; }
		}

		function mountOrb() {
			if (window.__amadeusOrbSet) return true;
			if (!ensureOrb()) return false;
			var visual = window.AmadeusAgentVisuals;
			if (!visual || typeof visual.mount !== "function") return false;

			if (!document.getElementById("amadeus-orb-css")) {
				var style = document.createElement("style");
				style.id = "amadeus-orb-css";
				style.textContent = ".agent-visual{position:relative;display:inline-block;flex-shrink:0;vertical-align:middle}.agent-visual-badge{position:absolute;right:-2px;bottom:-2px;display:block;overflow:hidden;border:1px solid color-mix(in srgb,var(--agent-state-color) 45%,transparent);border-radius:50%;background:var(--surface,#1a1a1e)}.agent-visual-badge{transition:transform .3s ease,background-color .3s,border-color .3s}[data-display=orb] .agent-visual-badge{visibility:hidden}[data-display=dots] .agent-visual>:not(.agent-visual-badge){visibility:hidden}[data-display=dots] .agent-visual-badge{border-color:transparent;background-color:transparent;transform:translate(-66%,-66%) scale(2.2);filter:brightness(1.7) saturate(1.2)}";
				document.head.appendChild(style);
			}

			var SIZE = 112;
			var host = document.createElement("div");
			host.id = "amadeus-web-orb";
			host.style.cssText = "position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:1;pointer-events:none;width:112px;height:112px;display:none;align-items:center;justify-content:center";
			document.body.appendChild(host);

			var controller = visual.mount(host, { state: "idle", size: SIZE });

			var current = "idle";
			var displayLook = {};
			window.__amadeusOrbSet = function (state) {
				current = state || "idle";
				host.dataset.display = lookDisplay(displayLook, current);
				try { controller.set({ state: current }); } catch (e) {}
				try { reposition(); } catch (e) {}
			};
			window.__amadeusOrbSetColors = function (colors, palette) {
				try { controller.set({ colors: colors, palette: palette }); } catch (e) {}
			};
			window.__amadeusOrbSetStyle = function (styleMap) {
				try {
					var states = visual.states;
					if (!states) return;
					if (!window.__amadeusOrbOriginalStyle) {
						window.__amadeusOrbOriginalStyle = {};
						Object.keys(states).forEach(function (k) {
							window.__amadeusOrbOriginalStyle[k] = { shape: states[k].shape, orb: states[k].orb };
						});
					}
					Object.keys(states).forEach(function (k) {
						var o = styleMap && styleMap[k];
						states[k].shape = (o && o.shape) || window.__amadeusOrbOriginalStyle[k].shape;
						states[k].orb = (o && o.orb) || window.__amadeusOrbOriginalStyle[k].orb;
					});
					controller.set({});
				} catch (e) {}
			};
			window.amadeusOrb = {
				set: window.__amadeusOrbSet,
				setColors: window.__amadeusOrbSetColors,
				setStyle: window.__amadeusOrbSetStyle,
				// Per-state "both" | "orb" | "dots" (from the saved look).
				setDisplay: function (look) {
					displayLook = look || {};
					host.dataset.display = lookDisplay(displayLook, current);
				}
			};
			applyLook(loadLook());

			// Position the orb in the conversation header (smooth tracking, no layout hacks).
			var observedHeader = null;
			var resizeObserver = null;
			var mutationObserver = null;
			function observeHeader(h) {
				if (h === observedHeader) return;
				if (resizeObserver && observedHeader) { try { resizeObserver.unobserve(observedHeader); } catch (e) {} }
				if (mutationObserver && observedHeader) { try { mutationObserver.disconnect(); } catch (e) {} }
				observedHeader = h;
				if (h) {
					try {
						if (!resizeObserver) resizeObserver = new ResizeObserver(function () { reposition(); });
						resizeObserver.observe(h);
					} catch (e) {}
					try {
						if (!mutationObserver) mutationObserver = new MutationObserver(function () { reposition(); });
						mutationObserver.observe(h, { attributes: true, attributeFilter: ["style", "class"] });
					} catch (e) {}
				}
			}
			function reposition() {
				var corner = document.querySelector("[data-conversation-header-corner]");
				var header = corner ? corner.closest("header") : null;
				observeHeader(header);
				if (!header) { host.style.display = "none"; return; }
				// Reserve left+height space in the header so the orb fits without overlapping
				// (mirrors amadeus-v2 WEB_ORB_BOOTSTRAP).
				if (header.style.minHeight !== "140px") header.style.minHeight = "140px";
				if (header.style.paddingLeft !== "140px") header.style.paddingLeft = "140px";
				var r = header.getBoundingClientRect();
				if (r.width < 2) { host.style.display = "none"; return; }
				host.style.width = SIZE + "px";
				host.style.height = SIZE + "px";
				host.style.transform = "none";
				host.style.left = Math.round(r.left + 8) + "px";
				var top = Math.round(r.top + r.height / 2 - SIZE / 2);
				host.style.top = (top < 0 ? 0 : top) + "px";
				host.style.display = "flex";
			}
			reposition();
			window.addEventListener("resize", reposition);
			setInterval(reposition, 400);

			return true;
		}

		// Drive the orb from the DSH uiSession "running" status.
		// snapshot = Map<sessionId, { running, pendingInteraction, completionUnread }>.
		// When running, refine via the ACTIVE session's trajectory snapshot:
		//   runningCalls.length > 0  -> "tool"
		//   partial != null          -> "speaking"
		//   else                     -> "thinking"
		function driveFromSession(ctx) {
			var uiSession = ctx && ctx.uiSession;
			var uiConversation = ctx && ctx.uiConversation;
			if (!uiSession || !uiSession.sessionStatus) return;
			var status = uiSession.sessionStatus;

			var readTrajectory = function () {
				try {
					if (!uiConversation || typeof uiConversation.binding !== "function") return null;
					var binding = uiSession.current && uiSession.current.value;
					var sessionId = (binding && binding.props && binding.props.sessionId) || (binding && binding.key);
					if (!sessionId) return null;
					var target = uiConversation.binding(sessionId).target("trajectory");
					if (!target || typeof target.getSnapshot !== "function") return null;
					return target.getSnapshot() || null;
				} catch (e) { return null; }
			};

			var applySnapshot = function (snapshot) {
				var running = false;
				if (snapshot && typeof snapshot.forEach === "function") {
					snapshot.forEach(function (row) {
						if (row && row.running === true) running = true;
					});
				}
				var state = running ? "thinking" : "idle";
				if (running) {
					var traj = readTrajectory();
					if (traj) {
						var calls = traj.runningCalls;
						if (calls && calls.length > 0) state = "tool";
						else if (traj.partial != null) state = "speaking";
					}
				}
				if (window.__amadeusOrbSet) window.__amadeusOrbSet(state);
			};
			if (typeof status.getSnapshot === "function") applySnapshot(status.getSnapshot());
			if (typeof status.subscribe === "function") {
				status.subscribe(function () {
					applySnapshot(status.getSnapshot());
				});
			}
		}

		// ---- Orbs settings section (colors + dots shapes per agent state) ----
		var ORB_STATES = [["idle","Покой"],["connecting","Подключение"],["thinking","Думает"],["tool","Инструмент"],["tool_done","Проверяет"],["speaking","Говорит"],["done","Готово"],["error","Ошибка"],["disabled","Отключён"]];
		var ORB_DEFAULT_COLORS = { idle: "#b5a3f5", connecting: "#b5a3f5", thinking: "#f1b76b", tool: "#6cdbf3", tool_done: "#6cdbf3", speaking: "#bf9bff", done: "#bf9bff", error: "#f38f9c", disabled: "#85818e" };
		var DOTS_SHAPES = [["", "По состоянию (авто)"], ["orb", "Орб"], ["loader", "Загрузка"], ["thought-bubble", "Мысль"], ["atom", "Атом"], ["check", "Галочка"], ["equalizer", "Эквалайзер"], ["bolt", "Молния"], ["pause", "Пауза"], ["cloud", "Облако"], ["halo", "Ореол"], ["helix", "Спираль"], ["infinity", "Бесконечность"], ["flower", "Цветок"], ["moon", "Луна"], ["heart", "Сердце"], ["wave", "Волна"], ["grid", "Сетка"], ["spark", "Искра"], ["globe", "Глобус"], ["arrow", "Стрелка"]];
		var ORB_VARIANTS = [["", "По состоянию (авто)"], ["idle", "Покой"], ["connecting", "Подключение"], ["thinking", "Размышление"], ["speaking", "Речь"], ["error", "Ошибка"], ["disabled", "Отключён"]];

		function lighter(hex) {
			try {
				var n = parseInt(hex.slice(1), 16);
				var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
				r = Math.round(r + (255 - r) * 0.25); g = Math.round(g + (255 - g) * 0.25); b = Math.round(b + (255 - b) * 0.25);
				return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
			} catch (e) { return hex; }
		}

		function buildOrbColors(colors) {
			var out = {};
			for (var i = 0; i < ORB_STATES.length; i++) {
				var k = ORB_STATES[i][0];
				var c = (colors && colors[k]) ? colors[k][0] : (ORB_DEFAULT_COLORS[k] || "#b5a3f5");
				out[k] = [c, lighter(c)];
			}
			return out;
		}

		function OrbPreview(props) {
			var hostRef = react.useRef(null);
			var controllerRef = react.useRef(null);
			react.useEffect(function () {
				var host = hostRef.current;
				if (!host || !window.AmadeusAgentVisuals) return;
				var palette = buildOrbColors(props.colors);
				var controller = window.AmadeusAgentVisuals.mount(host, { state: props.state, size: 128, colors: palette, palette: palette.idle });
				controllerRef.current = controller;
				return function () { if (controllerRef.current) { try { controllerRef.current.dispose(); } catch (e) {} controllerRef.current = null; } };
			}, []);
			react.useEffect(function () {
				var controller = controllerRef.current;
				if (!controller) return;
				var palette = buildOrbColors(props.colors);
				controller.set({ state: props.state, colors: palette, palette: palette.idle });
			}, [props.state, props.colors]);
			return jsx("div", { ref: hostRef });
		}


		// ---- Saved per-state look: { [state]: { color?, display?, shape?, orb? } } ----
		// Kept in localStorage (survives restarts) and mirrored to the live2D bubble.
		var LOOK_KEY = "amadeus-orb-look";
		var DISPLAY_MODES = [["both", "Орб + точки"], ["orb", "Только орб"], ["dots", "Только точки"]];
		function loadLook() {
			try {
				var v = JSON.parse(window.localStorage.getItem(LOOK_KEY) || "null");
				return v && typeof v === "object" ? v : {};
			} catch (e) { return {}; }
		}
		var syncTimer = 0;
		function saveLook(look) {
			try { window.localStorage.setItem(LOOK_KEY, JSON.stringify(look)); } catch (e) {}
			// The live2D / live3D bubbles draw the same orb + dots: send them colors/mode/shape too.
			clearTimeout(syncTimer);
			syncTimer = setTimeout(function () {
				var out = {};
				Object.keys(look).forEach(function (k) {
					var v = look[k] || {}, e = {};
					if (v.color) e.color = v.color;
					if (v.display) e.display = v.display;
					if (v.shape) e.shape = v.shape;
					if (Object.keys(e).length) out[k] = e;
				});
				["/amadeus-live2d/settings", "/amadeus-live3d/settings"].forEach(function (url) {
					fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ speechBubble: { orb: out } }) }).catch(function () {});
				});
			}, 300);
		}
		function lookColors(look) {
			var map = {};
			Object.keys(look).forEach(function (k) { if (look[k] && look[k].color) map[k] = [look[k].color, lighter(look[k].color)]; });
			return buildOrbColors(map);
		}
		function lookDisplay(look, state) { return (look[state] && look[state].display) || "both"; }
		function applyLook(look) {
			var api = window.amadeusOrb;
			if (!api) return;
			var palette = lookColors(look);
			var style = {};
			ORB_STATES.forEach(function (p) { var v = look[p[0]] || {}; style[p[0]] = { shape: v.shape || "", orb: v.orb || "" }; });
			try { api.setColors(palette, palette.idle); api.setStyle(style); api.setDisplay(look); } catch (e) {}
		}

		function OrbsSection() {
			var lookState = react.useState(loadLook); var look = lookState[0], setLook = lookState[1];
			var previewStateState = react.useState("idle"); var previewState = previewStateState[0], setPreviewState = previewStateState[1];
			var entry = function (key) { return look[key] || {}; };
			function colorOf(key) { return entry(key).color || ORB_DEFAULT_COLORS[key] || "#b5a3f5"; }
			function shapeOf(key) { return entry(key).shape || ""; }
			function orbOf(key) { return entry(key).orb || ""; }
			function update(key, field, val) {
				var next = Object.assign({}, look);
				next[key] = Object.assign({}, next[key]);
				if (val) next[key][field] = val; else delete next[key][field];
				if (!Object.keys(next[key]).length) delete next[key];
				setLook(next);
				saveLook(next);
				applyLook(next);
			}
			function reset() {
				setLook({});
				saveLook({});
				applyLook({});
			}
			var labelOf = function (key) { for (var i = 0; i < ORB_STATES.length; i++) { if (ORB_STATES[i][0] === key) return ORB_STATES[i][1]; } return key; };
			var display = lookDisplay(look, previewState);
			var row = function (key, label, hint, control) {
				return jsx("div", { className: "aui-row", children: [
					jsx("div", { className: "aui-row-text", children: [
						jsx("div", { className: "aui-row-label", children: label }),
						hint ? jsx("div", { className: "aui-row-hint", children: hint }) : null
					] }),
					jsx("div", { className: "aui-row-control", children: control })
				] }, key);
			};
			var modeTag = function (key) {
				var d = lookDisplay(look, key);
				return d === "orb" ? " · орб" : d === "dots" ? " · точки" : "";
			};
			return jsx("div", { className: "aui-page", children: [
				jsx("div", { className: "aui-hero aui-orb-hero", children: [
					jsx("div", { className: "aui-orb-stage", "data-display": display, children: jsx(OrbPreview, { state: previewState, colors: lookColors(look) }) }),
					jsx("div", { className: "aui-hero-text", children: [
						jsx("div", { className: "aui-hero-title", children: ["Орб агента", jsx("span", { className: "aui-pill", children: labelOf(previewState) })] }),
						jsx("div", { className: "aui-hero-sub", children: "Сфера из частиц и значок из точек — в шапке чата и в пузыре live2D. Для каждого состояния агента можно выбрать, что показывать, и свой цвет." }),
						jsx("div", { className: "aui-chips", children: ORB_STATES.map(function (pair) {
							var key = pair[0];
							return jsx("button", { type: "button", className: "aui-chip" + (previewState === key ? " aui-chip-active" : ""), onClick: function () { setPreviewState(key); }, children: [
								jsx("span", { className: "aui-chip-dot", style: { background: colorOf(key) } }),
								pair[1] + modeTag(key)
							] }, key);
						}) })
					] })
				] }),
				jsx("section", { className: "aui-card", children: [
					jsx("header", { className: "aui-card-head aui-card-head-row", children: [
						jsx("div", { children: [
							jsx("h3", { children: "Состояние «" + labelOf(previewState) + "»" }),
							jsx("p", { children: "Изменения сразу видны в предпросмотре, в шапке чата и в пузыре персонажа." })
						] }),
						jsx("button", { className: "aui-btn", type: "button", onClick: reset, children: "Сбросить всё" })
					] }),
					jsx("div", { className: "aui-card-body", children: [
						row("display", "Показывать", "Орб, значок из точек или оба вместе.", jsx("div", { className: "aui-seg", children: DISPLAY_MODES.map(function (m) {
							return jsx("button", { type: "button", className: "aui-seg-btn" + (display === m[0] ? " aui-seg-btn-active" : ""), onClick: function () { update(previewState, "display", m[0] === "both" ? "" : m[0]); }, children: m[1] }, m[0]);
						}) })),
						row("color", "Цвет", "Основной цвет; второй оттенок подбирается автоматически.", jsx("div", { className: "aui-inline", children: [
							jsx("div", { className: "aui-gradient", children: [
								jsx("span", { style: { background: colorOf(previewState) } }),
								jsx("span", { style: { background: lighter(colorOf(previewState)) } })
							] }),
							jsx("input", { className: "aui-color", type: "color", value: colorOf(previewState), onChange: function (event) { update(previewState, "color", event.target.value); } })
						] })),
						display !== "orb" ? row("shape", "Форма точек", "Фигура, в которую складываются точки.", jsx("select", { className: "aui-select", value: shapeOf(previewState), onChange: function (e) { update(previewState, "shape", e.target.value); }, children: DOTS_SHAPES.map(function (p) { return jsx("option", { value: p[0], children: p[1] }, p[0] || "auto"); }) })) : null,
						display !== "dots" ? row("orb", "Вариант орба", "Анимация сферы (в шапке чата).", jsx("select", { className: "aui-select", value: orbOf(previewState), onChange: function (e) { update(previewState, "orb", e.target.value); }, children: ORB_VARIANTS.map(function (p) { return jsx("option", { value: p[0], children: p[1] }, p[0] || "auto"); }) })) : null
					] })
				] })
			] });
		}

		function registerSection(ctx) {
			if (!ctx || !ctx.slots) return;
			ctx.slots.inject("settings.section", function () {
				return ctx.slots.register({ name: "settings.section", id: "orb", order: 91, label: function () { return "Orbs"; } }, OrbsSection);
			});
		}

		var inject = ["slots", "uiSession", "uiConversation"];
		function apply(ctx) {
			if (!document.getElementById("amadeus-orb-settings-css")) {
				var style = document.createElement("style");
				style.id = "amadeus-orb-settings-css";
				style.textContent = ${auiCssJson};
				document.head.appendChild(style);
			}
			registerSection(ctx);
			var run = function () { mountOrb(); driveFromSession(ctx); };
			if (document.readyState === "loading") {
				document.addEventListener("DOMContentLoaded", run);
			} else {
				run();
			}
		}
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
`;

fs.writeFileSync(path.join(libDir, 'lib', 'client.js'), client, 'utf8');
console.log('built lib/client.js (' + client.length + ' bytes)');
