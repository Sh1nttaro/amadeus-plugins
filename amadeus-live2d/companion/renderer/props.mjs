// Accessories and gestures drawn around the Live2D figure: plain <img> layers under and over the canvas.
// Where the head, the eyes and the mouth are is found by moving the model's standard parameters and looking
// which vertices move, so no layer names are needed and any model works. (Pure maths first, the DOM after it.)

/** Points (as [x, y, x0, y0, distance]) that differ between two poses of the model by more than eps. */
export function movedPoints(rest, pose, eps) {
  const out = [];
  for (let d = 0; d < rest.vertices.length; d++) {
    if (!rest.visible[d]) continue;
    const a = rest.vertices[d], b = pose.vertices[d];
    for (let i = 0; i + 1 < a.length; i += 2) {
      const dist = Math.hypot(b[i] - a[i], b[i + 1] - a[i + 1]);
      if (dist > eps) out.push({ d, i, x: a[i], y: a[i + 1], dist });
    }
  }
  return out;
}
export function centroid(points) {
  let sx = 0, sy = 0, sw = 0;
  for (const p of points) { const w = p.dist || 1; sx += p.x * w; sy += p.y * w; sw += w; }
  return sw ? { x: sx / sw, y: sy / sw } : null;
}
/** The similarity (move, turn, scale) that takes the rest points to the current ones best. */
export function similarity(rest, now) {
  const n = rest.length;
  if (n < 2) return null;
  let cx0 = 0, cy0 = 0, cx = 0, cy = 0;
  for (let i = 0; i < n; i++) { cx0 += rest[i].x; cy0 += rest[i].y; cx += now[i].x; cy += now[i].y; }
  cx0 /= n; cy0 /= n; cx /= n; cy /= n;
  let a = 0, b = 0, m = 0;
  for (let i = 0; i < n; i++) {
    const x0 = rest[i].x - cx0, y0 = rest[i].y - cy0, x = now[i].x - cx, y = now[i].y - cy;
    a += x0 * x + y0 * y; b += x0 * y - y0 * x; m += x0 * x0 + y0 * y0;
  }
  if (!(m > 0)) return null;
  a /= m; b /= m;
  return { a, b, cx0, cy0, cx, cy, scale: Math.hypot(a, b), angle: Math.atan2(b, a) };
}
export function applySimilarity(t, p) {
  if (!t) return { x: p.x, y: p.y };
  const x = p.x - t.cx0, y = p.y - t.cy0;
  return { x: t.cx + t.a * x - t.b * y, y: t.cy + t.b * x + t.a * y };
}
const thin = (points, max) => { if (points.length <= max) return points; const step = points.length / max; return Array.from({ length: max }, (_, i) => points[Math.floor(i * step)]); };
/**
 * probe({ ParamX: 'far' | 'max' }) -> { vertices: [Float32Array per drawable], visible: [bool] } or null when the model has no such parameter.
 * figure: { minX, maxX, minY, maxY }.  Result: eyes (middle), unit (distance between the eyes), mouth, body, tracked points.
 */
export function findLandmarks(probe, figure) {
  const H = figure.maxY - figure.minY, eps = H * 0.003;
  const rest = probe({});
  const at = (map) => { const p = probe(map); return p ? movedPoints(rest, p, eps) : []; };
  const left = at({ ParamEyeLOpen: 'far' }), right = at({ ParamEyeROpen: 'far' });
  let l = centroid(left), r = centroid(right), source = 'eyelids';
  const usable = () => { if (!l || !r) return false; const dx = Math.abs(l.x - r.x), dy = Math.abs(l.y - r.y); return dx > H * 0.012 && dx < H * 0.4 && dy < dx; };
  let irises = [];
  if (!usable()) {
    irises = at({ ParamEyeBallX: 'max' });
    const xs = irises.map((p) => p.x).sort((x, y) => x - y), mid = xs.length ? (xs[0] + xs[xs.length - 1]) / 2 : 0;
    l = centroid(irises.filter((p) => p.x < mid)); r = centroid(irises.filter((p) => p.x >= mid)); source = 'irises';
  }
  let eyes, unit;
  if (usable()) { eyes = { x: (l.x + r.x) / 2, y: (l.y + r.y) / 2 }; unit = Math.hypot(l.x - r.x, l.y - r.y); }
  else { eyes = { x: (figure.minX + figure.maxX) / 2, y: figure.maxY - H * 0.14 }; unit = H * 0.07; source = 'guess'; }
  const lips = at({ ParamMouthOpenY: 'max' }), m = centroid(lips);
  const mouth = m && Math.abs(m.x - eyes.x) < unit && m.y < eyes.y - unit * 0.25 && m.y > eyes.y - unit * 2.2 ? m : { x: eyes.x, y: eyes.y - unit };
  // what follows the head: the face around the eyes, without what blinks or speaks
  const key = (p) => p.d + ':' + p.i, skip = new Set([...left, ...right, ...irises, ...lips].map(key));
  const turn = [...at({ ParamAngleX: 'max' }), ...at({ ParamAngleZ: 'max' })];
  const near = (p, k) => Math.hypot(p.x - eyes.x, p.y - eyes.y) < unit * k;
  const pick = (points, ok, max) => { const seen = new Set(), out = []; for (const p of points) { const k = key(p); if (!seen.has(k) && !skip.has(k) && ok(p)) { seen.add(k); out.push(p); } } return out.length >= 8 ? thin(out, max) : null; };
  // Some models turn the head only through their physics, which a probe does not run: then simply what is there.
  const all = () => movedPoints(rest, { vertices: rest.vertices.map((v) => new Float32Array(v.length).fill(1e6)) }, 0);
  const head = pick(turn, (p) => near(p, 1.7), 160) || (source === 'guess' ? null : pick(all(), (p) => near(p, 1.3), 160));
  const sway = [...at({ ParamBodyAngleX: 'max' }), ...at({ ParamBodyAngleZ: 'max' })];
  const lo = figure.minY + H * 0.4, hi = Math.min(eyes.y - unit * 1.8, figure.minY + H * 0.85);
  const trunk = (k) => (p) => p.y > lo && p.y < hi && Math.abs(p.x - eyes.x) < unit * k;
  const torso = pick(sway, trunk(2.5), 160) || (source === 'guess' ? null : pick(all(), trunk(1.5), 160));
  return { eyes, unit, mouth, body: { x: (figure.minX + figure.maxX) / 2, y: source === 'guess' ? figure.minY + H * 0.55 : Math.max(figure.minY, Math.min(figure.minY + H * 0.55, eyes.y - unit * 2.8)) }, center: { x: (figure.minX + figure.maxX) / 2, y: figure.minY + H * 0.55 }, H, head, torso, source };
}
const originOf = (lm, anchor) => (anchor === 'head' ? lm.eyes : anchor === 'mouth' ? lm.mouth : anchor === 'body' ? lm.body : lm.center);
const unitOf = (lm, anchor) => (anchor === 'head' || anchor === 'mouth' ? lm.unit : lm.H);
/** Place -> screen: centre (px in the canvas), width (px), turn (degrees, clockwise). view: { W, H, s, facing, centerX, feetOffset } */
export function project(place, lm, pose, view) {
  const o = originOf(lm, place.anchor), u = unitOf(lm, place.anchor);
  const t = place.anchor === 'head' || place.anchor === 'mouth' ? pose.head : place.anchor === 'body' ? pose.torso : null;
  const p = applySimilarity(t, { x: o.x + place.x * u, y: o.y + place.y * u });
  const k = t ? Math.min(1.25, Math.max(0.8, t.scale)) : 1, half = view.H / 2;
  const turn = (place.rot || 0) - (t ? t.angle * 180 / Math.PI : 0);
  return { x: view.W / 2 + view.s * view.facing * (p.x - view.centerX) * half, y: half - (view.s * p.y + view.feetOffset) * half, width: place.size * u * view.s * k * half, turn: turn * view.facing, mirror: view.facing * (place.flip ? -1 : 1) };
}
/** Screen movement (px) -> change of place.x / place.y. */
export function dragDelta(dx, dy, place, lm, view) {
  const k = unitOf(lm, place.anchor) * view.s * view.H / 2;
  return { x: dx * view.facing / k, y: -dy / k };
}
/** Room the pictures need around the canvas, the same on both sides (she turns around). */
export function padding(boxes, view) {
  let x = 0, top = 0;
  for (const b of boxes) {
    const r = Math.hypot(b.width, b.width * (b.aspect || 1)) / 2 * 1.12;
    x = Math.max(x, Math.abs(b.x - view.W / 2) + r - view.W / 2);
    top = Math.max(top, r - b.y);
  }
  const step = (v, max) => Math.min(max, Math.ceil(Math.max(0, v) / 16) * 16);
  return { x: step(x, 480), top: step(top, 400) };
}

const ANIM = {
  pop: [{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'scale(1.12)', offset: 0.12 }, { opacity: 1, transform: 'scale(1)', offset: 0.18 }, { opacity: 1, transform: 'scale(1)', offset: 0.9 }, { opacity: 0, transform: 'scale(.7)' }],
  slide: [{ opacity: 0, transform: 'translateY(45%)' }, { opacity: 1, transform: 'translateY(0)', offset: 0.16 }, { opacity: 1, transform: 'translateY(-2%)', offset: 0.5 }, { opacity: 1, transform: 'translateY(0)', offset: 0.86 }, { opacity: 0, transform: 'translateY(45%)' }],
  swing: [{ opacity: 0, transform: 'rotate(-14deg)' }, { opacity: 1, transform: 'rotate(10deg)', offset: 0.15 }, { transform: 'rotate(-10deg)', offset: 0.35 }, { transform: 'rotate(10deg)', offset: 0.55 }, { transform: 'rotate(-6deg)', offset: 0.75 }, { opacity: 1, transform: 'rotate(0)', offset: 0.9 }, { opacity: 0, transform: 'rotate(0)' }],
  flick: [{ opacity: 0, transform: 'scale(.8)' }, { opacity: 1, transform: 'scale(.92)', offset: 0.2 }, { transform: 'scale(.86)', offset: 0.42 }, { transform: 'scale(1.28)', offset: 0.5 }, { transform: 'scale(1.1)', offset: 0.62 }, { opacity: 1, transform: 'scale(1.05)', offset: 0.88 }, { opacity: 0, transform: 'scale(1)' }],
  fade: [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }],
};

const ITEM_ROOM = 1.5;                                           // a Live2D item moves: its canvas is larger than its figure
/** A Live2D accessory in a small canvas of its own. */
class Item {
  constructor(p, canvas, onReady) {
    this.id = p.id; this.canvas = canvas; this.character = null; this.expression = null; this.closed = false; this.aspect = 0;
    const options = { alpha: true, premultipliedAlpha: true, antialias: true, preserveDrawingBuffer: true };
    this.gl = canvas.getContext('webgl2', options) || canvas.getContext('webgl', options);
    this.ready = this.load(p).then(() => { if (!this.closed) onReady(this); }, (error) => console.error('[props] item ' + p.id + ':', error && error.message || error));
  }
  async load(p) {
    const c = await window.AmadeusLive2D.load(this.gl, p.modelUrl, 256, 256);
    if (this.closed) { c.dispose(); return; }
    this.needsExpression = c.empty();
    const name = p.expression || (this.needsExpression || p.kind === 'gesture' ? (p.expressions || [])[0] : '');
    if (name) { c.setExpression(name); for (let i = 0; i < 90; i++) c.updateAs(c, 1 / 30); this.expression = name; }
    c.figure = c.measureFigure();
    this.aspect = 1 / c.aspect;
    c.fit(2 / ITEM_ROOM, -1 / ITEM_ROOM);
    this.character = c;
  }
  /** One frame: width is the figure's, in px of the page. */
  draw(host, seconds, width) {
    const c = this.character, gl = this.gl;
    if (!c || gl.isContextLost()) return;
    const ratio = window.devicePixelRatio || 1, w = Math.max(8, Math.min(2048, Math.round(width * ITEM_ROOM * ratio))), h = Math.max(8, Math.min(2048, Math.round(width * ITEM_ROOM * this.aspect * ratio)));
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; c.resizeView(w, h); }
    c.updateAs(host, seconds);
    gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    c.draw(w, h);
  }
  express(name) { if (this.character && name && this.expression !== name) { this.character.setExpression(name); this.expression = name; } }
  close() { this.closed = true; if (this.character) this.character.dispose(); this.character = null; const x = this.gl && this.gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); }
}
/** Which frame of a gesture is shown at part t (0…1) of its time: the first waits, the last one is the point of it. */
export function frameAt(t, order) {
  const n = order.length;
  if (n < 2 || t < 0.3) return order[0];
  if (t >= 0.5) return order[n - 1];
  return order[Math.min(n - 2, 1 + Math.floor((t - 0.3) / 0.2 * Math.max(1, n - 2)))];
}

/** The layers of one character window. */
export class Props {
  constructor(canvas, api) {
    this.canvas = canvas; this.api = api;
    this.items = []; this.elements = new Map(); this.shown = null; this.adjusting = ''; this.drag = null;
    this.landmarks = null; this.character = null; this.side = 0; this.seconds = 3; this.events = {};
    this.pad = { x: 0, top: 0 };
    const layer = (z) => { const el = document.createElement('div'); el.style.cssText = `position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:${z}`; document.body.appendChild(el); return el; };
    this.back = layer(0); this.front = layer(2);
    canvas.style.position = 'absolute'; canvas.style.zIndex = '1';
  }
  dispose() { this.back.remove(); this.front.remove(); this.elements.clear(); }
  /** A new model: find its face once. */
  setCharacter(character) {
    this.character = character; this.landmarks = null;
    if (!character) { this.refresh(); return; }
    try { this.landmarks = findLandmarks((map) => character.probe(map), character.figure); } catch (error) { console.error('[props] landmarks:', error); }
    character.probeDone();
    this.refresh();
  }
  set(view) {
    this.items = (view && view.items) || []; this.seconds = (view && view.seconds) || 3; this.events = (view && view.events) || {};
    if (this.adjusting && !this.items.some((p) => p.id === this.adjusting)) this.adjusting = '';
    this.refresh();
  }
  item(id) { return this.items.find((p) => p.id === id); }
  /** What is drawn now: what she wears, the gesture being shown, the thing being moved. */
  active() { return this.landmarks ? this.items.filter((p) => p.on || (this.shown && this.shown.id === p.id) || p.id === this.adjusting) : []; }
  refresh() {
    const live = new Set();
    for (const p of this.active()) {
      live.add(p.id);
      let el = this.elements.get(p.id);
      const signature = p.modelUrl ? p.modelUrl + '|' + (p.expression || '') + p.kind : p.images.map((i) => i.url).join('|');
      if (!el || el.signature !== signature) { if (el) el.remove(); el = this.build(p, signature); this.elements.set(p.id, el); }
      el.arrange(p, p.id === this.adjusting);
    }
    for (const [id, el] of this.elements) if (!live.has(id)) { el.remove(); this.elements.delete(id); }
  }
  build(p, signature) {
    const parts = p.modelUrl ? [this.buildItem(p)] : p.images.map((im) => {
      const box = document.createElement('div'), img = document.createElement('img');
      box.style.cssText = 'position:absolute;left:0;top:0;will-change:transform;display:none';
      img.style.cssText = 'display:block;width:100%;height:auto;-webkit-user-drag:none'; img.draggable = false; img.src = im.url;
      box.appendChild(img);
      return { role: im.role, box, img, aspect: im.w && im.h ? im.h / im.w : 0 };
    });
    const el = {
      signature, parts,
      aspect: () => { const x = parts[0]; return x.aspect || x.item && x.item.aspect || (x.img.naturalWidth ? (x.aspect = x.img.naturalHeight / x.img.naturalWidth) : 1); },
      remove: () => parts.forEach((x) => { x.box.remove(); if (x.item) x.item.close(); }),
      arrange: (prop, adjusting) => parts.forEach((x) => {
        const home = !adjusting && (x.role === 'back' || (prop.place.layer === 'back' && x.role !== 'front')) ? this.back : this.front;
        if (x.box.parentNode !== home) home.appendChild(x.box);
        x.box.style.pointerEvents = adjusting ? 'auto' : 'none';
        x.box.style.outline = adjusting ? '2px dashed #8b7cf6' : '';
        x.box.style.cursor = adjusting ? 'move' : '';
      }),
    };
    for (const x of parts) {
      x.box.addEventListener('pointerdown', (e) => { if (p.id !== this.adjusting) return; e.preventDefault(); x.box.setPointerCapture(e.pointerId); this.drag = { x: e.screenX, y: e.screenY }; });
      x.box.addEventListener('pointermove', (e) => { if (!this.drag) return; this.nudge(p.id, e.screenX - this.drag.x, e.screenY - this.drag.y); this.drag = { x: e.screenX, y: e.screenY }; });
      x.box.addEventListener('pointerup', () => { if (this.drag) { this.drag = null; this.store(p.id); } });
      x.box.addEventListener('wheel', (e) => { if (p.id !== this.adjusting) return; e.preventDefault(); this.zoom(p.id, e.deltaY || e.deltaX, e.shiftKey || e.altKey); }, { passive: false });
    }
    return el;
  }
  buildItem(p) {
    const box = document.createElement('div'), img = document.createElement('canvas');
    box.style.cssText = 'position:absolute;left:0;top:0;will-change:transform;display:none';
    img.style.cssText = 'display:block;width:100%;height:100%';
    box.appendChild(img);
    const part = { role: 'main', box, img, aspect: 0 };
    part.item = new Item(p, img, (item) => {
      part.aspect = item.aspect;
      if (this.onRoom) this.onRoom();
      if (!p.images.length) requestAnimationFrame(() => setTimeout(() => { if (item.closed) return; item.draw(item.character, 0.03, 160); setTimeout(() => { if (item.closed) return; item.draw(item.character, 0.03, 160); img.toBlob(async (b) => { if (b && !item.closed) this.api.propShown(p.id, await b.arrayBuffer(), item.aspect, item.needsExpression); }); }, 400); }, 200));
    });
    return part;
  }
  nudge(id, dx, dy) { const p = this.item(id); if (!p || !this.view) return; const d = dragDelta(dx, dy, p.place, this.landmarks, this.view); p.place = { ...p.place, x: p.place.x + d.x, y: p.place.y + d.y }; }
  zoom(id, delta, turn) {
    const p = this.item(id); if (!p) return;
    if (turn) p.place = { ...p.place, rot: ((p.place.rot || 0) + (delta > 0 ? 3 : -3) + 540) % 360 - 180 };
    else p.place = { ...p.place, size: Math.min(40, Math.max(0.02, p.place.size * (delta > 0 ? 0.95 : 1.05))) };
    clearTimeout(this.storeTimer); this.storeTimer = setTimeout(() => this.store(id), 300);
  }
  store(id) { const p = this.item(id); if (p) { this.api.propPlaced(id, p.place); this.onRoom && this.onRoom(); } }
  adjust(id) { this.adjusting = id && this.item(id) ? id : ''; this.drag = null; this.refresh(); return this.adjusting; }
  /** Is the cursor (px in the window) over the thing being moved? */
  over(x, y) {
    if (!this.adjusting) return false;
    if (this.drag) return true;
    const el = this.elements.get(this.adjusting);
    return !!el && el.parts.some((p) => { if (p.box.style.display === 'none') return false; const r = p.box.getBoundingClientRect(); return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom; });
  }
  /** Show a gesture for a moment. */
  show(id, seconds) {
    const p = this.item(id);
    if (!p || !this.landmarks) return { ok: false, error: p ? 'Персонаж ещё не готов.' : 'Такого жеста нет.' };
    clearTimeout(this.shownTimer);
    const ms = Math.min(15, Math.max(0.5, seconds || this.seconds)) * 1000;
    this.shown = { id, at: performance.now(), ms };
    this.refresh();
    const el = this.elements.get(id);
    const express = p.modelUrl && (p.expression || (p.expressions || [])[0]);
    if (express) el.parts[0].item.ready.then(() => el.parts[0].item.express(express));
    const run = () => el.parts.forEach((x) => { x.img.getAnimations().forEach((a) => a.cancel()); x.img.animate(ANIM[p.anim] || ANIM.pop, { duration: ms, easing: 'ease-in-out', fill: 'both' }); });
    run();
    this.shownTimer = setTimeout(() => { if (this.shown && this.shown.id === id) { this.shown = null; el.parts.forEach((x) => x.img.getAnimations().forEach((a) => a.cancel())); this.refresh(); this.onRoom && this.onRoom(); } }, ms);
    this.onRoom && this.onRoom();
    return { ok: true, label: p.name };
  }
  event(name) { const id = this.events[name]; if (id) this.show(id); }
  viewOf(size) { const c = this.character; return { W: size.width, H: size.height, s: c.scaleToView, facing: c.facing, centerX: c.centerX, feetOffset: c.feetOffset }; }
  /** The room needed around the canvas with everything that can appear on this model. */
  room(size) {
    if (!this.landmarks || !this.character) return { x: 0, top: 0 };
    const view = { ...this.viewOf(size), facing: 1 }, assigned = new Set(Object.values(this.events));
    const boxes = this.items.filter((p) => p.on || assigned.has(p.id) || p.id === this.adjusting || (this.shown && this.shown.id === p.id))
      .map((p) => { const im = p.images[0]; return { ...project(p.place, this.landmarks, {}, view), aspect: im && im.w && im.h ? im.h / im.w : 1.2 }; });
    const pad = padding(boxes, view);
    return this.adjusting ? { x: Math.max(pad.x, 160), top: Math.max(pad.top, 160) } : pad;   // somewhere to drag it to
  }
  /** Every drawn frame: put the pictures where the head / body is now. */
  frame(size, seconds = 1 / 30) {
    if (!this.character || !this.landmarks || !this.elements.size) return;
    const view = (this.view = this.viewOf(size)), lm = this.landmarks, c = this.character;
    const track = (points) => (points ? similarity(points, c.pointsNow(points)) : null);
    const need = (a) => this.items.some((p) => this.elements.has(p.id) && (p.place.anchor === a || (a === 'head' && p.place.anchor === 'mouth')));
    const pose = { head: need('head') ? track(lm.head) : null, torso: need('body') ? track(lm.torso) : null };
    const yaw = c.yaw();
    this.side = Math.abs(yaw) > 12 ? Math.sign(yaw) : Math.abs(yaw) < 8 ? 0 : this.side;
    for (const [id, el] of this.elements) {
      const p = this.item(id);
      if (!p) continue;
      const at = project(p.place, lm, pose, view), h = at.width * el.aspect();
      const order = p.order && p.order.length ? p.order : el.parts.map((_x, i) => i), framed = el.parts.some((x) => x.role === 'frame');
      const now = framed ? frameAt(this.shown && this.shown.id === id ? (performance.now() - this.shown.at) / this.shown.ms : 0, order) : -1;
      const want = this.side < 0 ? 'left' : this.side > 0 ? 'right' : 'main', sided = el.parts.some((x) => x.role === 'left' || x.role === 'right');
      for (const x of el.parts) {
        const on = framed ? x === el.parts[now] : !sided || x.role === (el.parts.some((y) => y.role === want) ? want : 'main');
        x.box.style.display = on ? 'block' : 'none';
        if (!on) continue;
        const grow = x.item ? ITEM_ROOM : 1, w = at.width * grow, tall = h * grow;
        if (x.item) { x.box.style.height = tall.toFixed(1) + 'px'; x.item.draw(c, seconds, at.width); }
        x.box.style.width = w.toFixed(1) + 'px';
        x.box.style.transform = `translate(${(this.pad.x + at.x - w / 2).toFixed(1)}px, ${(this.pad.top + at.y - tall / 2).toFixed(1)}px) rotate(${at.turn.toFixed(2)}deg) scaleX(${at.mirror})`;
        x.box.style.transformOrigin = '50% 50%';
      }
    }
  }
}
if (typeof window !== 'undefined') window.AmadeusProps = Props;
