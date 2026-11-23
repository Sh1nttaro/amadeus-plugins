// Accessories and gestures: pictures (PNG / WebP / GIF / JPEG) the user imports and puts on any model.
//   companion/props/<id>/prop.json   { id, name, kind, images: [{ file, role, w, h }], place, anim, order?, model?, expressions? }
//   companion/props/<id>/model/      a Live2D item (.model3.json and its files) instead of pictures
//   companion/props/state.json       { worn: { <model>: { <prop>: { on, place } } }, events: { <event>: <prop> }, seconds }
// The pictures stay on this computer: the folder is not part of the repository.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const PROP_ID = /^[a-z0-9][a-z0-9-]{0,60}$/;
const IMAGE_EXT = /\.(png|jpe?g|webp|gif)$/i;
const MAX_IMAGE = 40 * 1024 * 1024, MAX_IMAGES = 60, MIN_SIDE = 24;
const ANCHORS = ['head', 'mouth', 'body', 'figure'];
const ANIMS = ['pop', 'slide', 'swing', 'flick', 'fade'];
const EVENTS = ['start', 'thinking', 'tool', 'done', 'error', 'click'];
const num = (v, lo, hi) => (typeof v === 'number' && isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v * 1000) / 1000)) : undefined);

/** Where a picture sits. head / mouth: in units of the distance between the eyes; body / figure: in figure heights. */
function cleanPlace(p) {
  const out = {};
  if (!p || typeof p !== 'object') return out;
  if (ANCHORS.includes(p.anchor)) out.anchor = p.anchor;
  if (p.layer === 'front' || p.layer === 'back') out.layer = p.layer;
  if (typeof p.flip === 'boolean') out.flip = p.flip;
  for (const [k, lo, hi] of [['x', -20, 20], ['y', -20, 20], ['size', 0.02, 40], ['rot', -180, 180]]) { const v = num(p[k], lo, hi); if (v !== undefined) out[k] = v; }
  return out;
}

const GESTURE_WORDS = /(hand|arm|finger|thumb|like|good|bad(?!ge)|heart|gesture|point|secret|dekopin|flick|clap|peace|hello|wave)|[手指腕]|おてて|デコピン|손|하트/i;
const MOUTH_WORDS = /secret|shh|しーっ|人差し指/i;
const FACE_WORDS = /glass|mask|eye|blush|monocle|眼鏡|メガネ|マスク|안경/i;
const HEAD_WORDS = /horn|ear|hat|cap|halo|crown|ribbon|hair|tiara|antenna|head|角|耳|帽|冠|輪|リボン|髪|뿔|귀|모자/i;
const TOP_OF_HEAD = 1.9;
/** A first guess, the same for every model: the user corrects it once. */
function guess(text) {
  if (GESTURE_WORDS.test(text) && !/ear(?!t)|horn/i.test(text)) {
    return MOUTH_WORDS.test(text)
      ? { kind: 'gesture', anim: 'slide', place: { anchor: 'mouth', x: 0.1, y: -0.9, size: 2.2, rot: 0, flip: false, layer: 'front' } }
      : { kind: 'gesture', anim: /flick|dekopin|デコピン/i.test(text) ? 'flick' : 'pop', place: { anchor: 'figure', x: 0.17, y: 0.02, size: 0.26, rot: 0, flip: false, layer: 'front' } };
  }
  if (FACE_WORDS.test(text)) return { kind: 'accessory', anim: 'pop', place: { anchor: 'head', x: 0, y: 0, size: 2.1, rot: 0, flip: false, layer: 'front' } };
  if (HEAD_WORDS.test(text)) return { kind: 'accessory', anim: 'pop', place: { anchor: 'head', x: 0, y: TOP_OF_HEAD, size: 2.8, rot: 0, flip: false, layer: 'front' } };
  return { kind: 'accessory', anim: 'pop', place: { anchor: 'body', x: 0, y: -0.1, size: 0.6, rot: 0, flip: false, layer: 'front' } };
}

const ROLE_WORDS = [['back', /(?:^|[^a-z])back(?:[^a-z]|$)|後ろ|裏|うしろ/i], ['front', /(?:^|[^a-z])front(?:[^a-z]|$)|前|表/i], ['left', /(?:^|[^a-z])left(?:[^a-z]|$)|左/i], ['right', /(?:^|[^a-z])right(?:[^a-z]|$)|右/i]];
/** "horns_left.png" -> { role: 'left', stem: 'horns' } */
function roleOf(file) {
  const base = path.basename(file).replace(/\.[^.]+$/, '');
  for (const [role, re] of ROLE_WORDS) {
    if (!re.test(base)) continue;
    return { role, stem: base.replace(re, ' ').replace(/[\s_.-]+/g, ' ').trim().toLowerCase() };
  }
  return { role: 'main', stem: base.replace(/[\s_.-]+/g, ' ').trim().toLowerCase() };
}
/** Pictures that are one thing: front + back, or straight + left + right. Everything else is on its own. */
function groupImages(files) {
  const rest = files.map((file) => ({ file, dir: path.dirname(file), ...roleOf(file) })), out = [];
  const take = (wanted) => rest.splice(rest.indexOf(wanted), 1)[0];
  for (const b of rest.filter((x) => x.role === 'back')) {
    const f = rest.find((x) => x.dir === b.dir && x.stem === b.stem && x.role === 'front') || (b.stem && rest.find((x) => x.dir === b.dir && x.stem === b.stem && x.role === 'main'));
    if (f) { take(b); take(f); out.push({ images: [{ file: f.file, role: 'front' }, { file: b.file, role: 'back' }], stem: b.stem }); }
  }
  for (const m of rest.filter((x) => x.role === 'main' || x.role === 'front')) {
    const sides = ['left', 'right'].map((r) => rest.find((x) => x.dir === m.dir && x.stem === m.stem && x.role === r));
    if (!sides[0] || !sides[1]) continue;
    take(m); sides.forEach(take);
    out.push({ images: [{ file: m.file, role: 'main' }, { file: sides[0].file, role: 'left' }, { file: sides[1].file, role: 'right' }], stem: m.stem });
  }
  for (const x of rest) out.push({ images: [{ file: x.file, role: 'main' }], stem: path.basename(x.file).replace(/\.[^.]+$/, '') });
  return out;
}
/** Frames of one movement: "Dekopin.png", "Dekopin(1).png", … Only for names that mean a movement: "Good(1)" is another picture. */
const SEQUENCE_WORDS = /dekopin|デコピン|flick|secret|しーっ|frame|anim|sequence/i;
function frameOf(file) {
  const base = path.basename(file).replace(/\.[^.]+$/, ''), m = base.match(/^(.*?)\s*(?:\((\d{1,2})\)|[_-](\d{1,2}))$/);
  return m ? { stem: m[1], n: Number(m[2] || m[3]) } : { stem: base, n: 0 };
}
function groupFrames(groups) {
  const out = [], sets = new Map();
  for (const g of groups) {
    const file = g.images[0].file, f = frameOf(file);
    if (g.images.length > 1 || !SEQUENCE_WORDS.test(f.stem)) { out.push(g); continue; }
    const key = path.dirname(file) + '|' + f.stem;
    if (!sets.has(key)) { const set = { stem: f.stem, images: [] }; sets.set(key, set); out.push(set); }
    sets.get(key).images.push({ file, role: 'main', n: f.n });
  }
  for (const set of sets.values()) if (set.images.length > 1) { set.images.sort((a, b) => a.n - b.n); set.images.forEach((im) => { im.role = 'frame'; }); }
  return out;
}
/** The real type of a picture, by its first bytes (a name proves nothing). */
function sniff(buf) {
  if (buf.length < 16) return '';
  if (buf.readUInt32BE(0) === 0x89504e47) return 'png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.toString('latin1', 0, 4) === 'GIF8') return 'gif';
  if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'webp';
  return '';
}
const animatedPng = (buf) => buf.subarray(0, 4096).includes('acTL');
/** The part of a picture that is not transparent (BGRA pixels), or null when there is nothing. */
function alphaBox(data, w, h) {
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0, i = y * w * 4 + 3; x < w; x++, i += 4) {
    if (data[i] <= 8) continue;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return x1 < 0 ? null : { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
}
/**
 * A hole in the middle of a picture (the face opening of a hood): its box in parts of the picture, or null.
 * Looked for on a small grid: transparent cells that the transparent outside does not reach.
 */
function faceHole(data, w, h, box) {
  const N = 96, cols = box.width >= box.height ? N : Math.max(8, Math.round(N * box.width / box.height)), rows = box.width >= box.height ? Math.max(8, Math.round(N * box.height / box.width)) : N;
  const open = new Uint8Array(cols * rows);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = box.x + Math.min(box.width - 1, Math.floor((c + 0.5) * box.width / cols)), y = box.y + Math.min(box.height - 1, Math.floor((r + 0.5) * box.height / rows));
    open[r * cols + c] = data[(y * w + x) * 4 + 3] < 60 ? 1 : 0;
  }
  const fill = (start, mark) => { const stack = [start], cells = []; open[start] = mark; while (stack.length) { const i = stack.pop(), c = i % cols, r = (i - c) / cols; cells.push(i); for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const x = c + dc, y = r + dr, j = y * cols + x; if (x >= 0 && y >= 0 && x < cols && y < rows && open[j] === 1) { open[j] = mark; stack.push(j); } } } return cells; };
  for (let c = 0; c < cols; c++) for (const r of [0, rows - 1]) if (open[r * cols + c] === 1) fill(r * cols + c, 2);
  for (let r = 0; r < rows; r++) for (const c of [0, cols - 1]) if (open[r * cols + c] === 1) fill(r * cols + c, 2);
  let best = null;
  for (let i = 0; i < open.length; i++) if (open[i] === 1) { const cells = fill(i, 3); if (!best || cells.length > best.length) best = cells; }
  if (!best || best.length < open.length * 0.02) return null;
  let x0 = cols, x1 = 0, y0 = rows, y1 = 0;
  for (const i of best) { const c = i % cols, r = (i - c) / cols; x0 = Math.min(x0, c); x1 = Math.max(x1, c + 1); y0 = Math.min(y0, r); y1 = Math.max(y1, r + 1); }
  return { x: (x0 + x1) / 2 / cols, y: (y0 + y1) / 2 / rows, w: (x1 - x0) / cols, h: (y1 - y0) / rows };
}
/** Where the topmost point of a picture is, from left (0) to right (1): a raised fingertip. */
function topPoint(data, w, box) {
  const rows = Math.max(1, Math.round(box.height * 0.02)); let sum = 0, n = 0;
  for (let y = box.y; y < box.y + rows; y++) for (let x = box.x; x < box.x + box.width; x++) if (data[(y * w + x) * 4 + 3] > 60) { sum += x - box.x; n++; }
  return n ? sum / n / box.width : 0.5;
}
/** Things on top of the head stand on the hair line, whatever their shape: not higher than 2.2 eye distances. */
function onHead(place, k) {
  if (place.anchor !== 'head' || place.y !== TOP_OF_HEAD) return place;
  const size = Math.min(place.size, 2.2 / k);
  return { ...place, size: r3(size), y: r3(1.4 + size * k / 2) };
}
const r3 = (v) => Math.round(v * 1000) / 1000;
/** The guess, fitted to the picture: a hood around the face, a fingertip on the lips, hands of one height. */
function fitPlace(g, pic, box) {
  if (!pic || !box) return g;
  const k = box.height / box.width;
  if (g.kind === 'accessory') {
    const hole = faceHole(pic.data, pic.w, pic.h, box);
    if (hole && hole.w > 0.15 && hole.y < 0.6) { const size = 3.2 / hole.w; return { ...g, place: { ...g.place, anchor: 'head', size: r3(size), x: r3((0.5 - hole.x) * size), y: r3(-0.3 - (0.5 - hole.y) * size * k) } }; }
    return { ...g, place: onHead(g.place, k) };
  }
  if (g.place.anchor === 'mouth') { const size = g.place.size * Math.min(1, 1 / k) * 1.2; return { ...g, place: { ...g.place, size: r3(size), x: r3((0.5 - topPoint(pic.data, pic.w, box)) * size), y: r3(0.15 - size * k / 2) } }; }
  if (g.place.anchor === 'figure') return { ...g, place: { ...g.place, size: r3(0.34 * Math.min(1, 1 / k)) } };
  return g;
}
const union = (a, b) => { const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y); return { x, y, width: Math.max(a.x + a.width, b.x + b.width) - x, height: Math.max(a.y + a.height, b.y + b.height) - y }; };

class PropStore {
  /** decode(buffer) -> { w, h, data (BGRA), crop(box, maxSide) -> { buf, w, h } } or null; extract(file, dest) unpacks an archive. */
  constructor(dir, { decode, extract, walk }) {
    this.dir = dir; this.decode = decode; this.extract = extract; this.walk = walk;
    this.cache = null;
    this.state = { worn: {}, events: {}, seconds: 3 };
    try {
      const s = JSON.parse(fs.readFileSync(path.join(dir, 'state.json'), 'utf8'));
      for (const [model, set] of Object.entries(s.worn || {})) {
        if (!set || typeof set !== 'object') continue;
        for (const [id, w] of Object.entries(set)) if (PROP_ID.test(id) && w && typeof w === 'object') (this.state.worn[model] = this.state.worn[model] || {})[id] = { on: w.on === true, place: cleanPlace(w.place) };
      }
      for (const e of EVENTS) if (s.events && typeof s.events[e] === 'string' && PROP_ID.test(s.events[e])) this.state.events[e] = s.events[e];
      this.state.seconds = num(s.seconds, 1, 10) || 3;
    } catch {}
  }
  save() { fs.mkdirSync(this.dir, { recursive: true }); fs.writeFileSync(path.join(this.dir, 'state.json'), JSON.stringify(this.state, null, 2)); }
  list() {
    if (this.cache) return this.cache;
    const out = [];
    try {
      for (const e of fs.readdirSync(this.dir, { withFileTypes: true })) {
        if (!e.isDirectory() || !PROP_ID.test(e.name)) continue;
        try { const p = JSON.parse(fs.readFileSync(path.join(this.dir, e.name, 'prop.json'), 'utf8')); if (Array.isArray(p.images) && (p.images.length || typeof p.model === 'string')) out.push({ ...p, id: e.name }); } catch {}
      }
    } catch {}
    return (this.cache = out.sort((a, b) => String(a.name).localeCompare(String(b.name))));
  }
  get(id) { const p = this.list().find((x) => x.id === id); if (!p) throw new Error('Такого предмета нет.'); return p; }
  byName(name) {
    const n = String(name || '').trim().toLowerCase();
    return this.list().find((p) => p.id === n) || this.list().find((p) => p.name.toLowerCase() === n) || (n && this.list().find((p) => p.name.toLowerCase().includes(n))) || null;
  }
  writeProp(p) { fs.writeFileSync(path.join(this.dir, p.id, 'prop.json'), JSON.stringify(p, null, 2)); this.cache = null; }
  imageFile(id, index) {
    if (!PROP_ID.test(String(id))) return null;
    const p = this.list().find((x) => x.id === id), im = p && p.images[Number(index)];
    return im && /^image\d+\.(png|jpg|webp|gif)$/.test(im.file) ? path.join(this.dir, id, im.file) : null;
  }
  /** What the character window needs for a model: its own placement over the picture's default one. */
  view(model) {
    const worn = this.state.worn[model] || {};
    return {
      seconds: this.state.seconds, events: { ...this.state.events },
      items: this.list().map((p) => ({ id: p.id, name: p.name, kind: p.kind, anim: p.anim, images: p.images, order: p.order, model: p.model, expressions: p.expressions, expression: p.expression, on: p.kind === 'accessory' && !!(worn[p.id] && worn[p.id].on), place: { ...p.place, ...((worn[p.id] && worn[p.id].place) || {}) } })),
    };
  }
  update(id, patch) {
    const p = { ...this.get(id) };
    if (typeof patch.name === 'string' && patch.name.trim()) p.name = patch.name.trim().slice(0, 60);
    if (patch.kind === 'accessory' || patch.kind === 'gesture') p.kind = patch.kind;
    if (ANIMS.includes(patch.anim)) p.anim = patch.anim;
    if (Array.isArray(patch.order)) { const n = p.images.length, order = patch.order.map(Number).filter((i) => Number.isInteger(i) && i >= 0 && i < n); if (order.length) p.order = order.slice(0, 40); }
    if (typeof patch.expression === 'string' && (patch.expression === '' || (p.expressions || []).includes(patch.expression))) p.expression = patch.expression;
    this.writeProp(p);
  }
  own(model, id) { this.get(id); const set = (this.state.worn[model] = this.state.worn[model] || {}); return (set[id] = set[id] || { on: false, place: {} }); }
  wear(model, id, on) { this.own(model, id).on = on === true; this.save(); }
  place(model, id, place) {
    const w = this.own(model, id), c = cleanPlace(place);
    const face = (a) => a === 'head' || a === 'mouth';
    if (c.anchor && !('size' in c) && face(c.anchor) !== face({ ...this.get(id).place, ...w.place }.anchor)) {   // other units: start from that anchor's usual place
      Object.assign(w.place, face(c.anchor) ? { x: 0, y: 0, size: 2.2 } : { x: 0, y: 0, size: 0.3 });
    }
    Object.assign(w.place, c);
    this.save();
  }
  reset(model, id) { this.own(model, id).place = {}; this.save(); }
  /** This model's placement becomes the one every other model starts from. */
  share(model, id) { const p = { ...this.get(id) }, w = this.own(model, id); p.place = { ...p.place, ...w.place }; w.place = {}; this.writeProp(p); this.save(); }
  event(name, id) {
    if (!EVENTS.includes(name)) throw new Error('Неизвестное событие.');
    if (id) { this.get(id); this.state.events[name] = id; } else delete this.state.events[name];
    this.save();
  }
  remove(id) {
    this.get(id);                                                // the id comes from the list, so it is a folder of ours
    fs.rmSync(path.join(this.dir, id), { recursive: true, force: true });
    for (const set of Object.values(this.state.worn)) delete set[id];
    for (const e of Object.keys(this.state.events)) if (this.state.events[e] === id) delete this.state.events[e];
    this.cache = null;
    this.save();
  }
  /** Pictures, folders or archives. -> { added: [names], problems: [text] } */
  async import(paths) {
    const added = [], problems = [];
    for (const source of paths) {
      const label = path.basename(source);
      let stage = null;
      try {
        let files = [];
        const st = fs.statSync(source);
        if (st.isDirectory()) files = this.walk(source);
        else if (/\.(zip|rar|7z)$/i.test(source)) {
          stage = fs.mkdtempSync(path.join(os.tmpdir(), 'amadeus-props-'));
          await this.extract(source, stage);
          files = this.walk(stage);
        } else files = [source];
        const models = files.filter((f) => /\.model3\.json$/i.test(f)), owned = new Set();
        for (const m of models) {
          try { const name = this.addModel(m, models.length === 1 ? label.replace(/\.(zip|rar|7z)$/i, '') : path.basename(m).replace(/\.model3\.json$/i, ''), label, owned); if (name) added.push(name); }
          catch (e) { problems.push(path.basename(m) + ': ' + String((e && e.message) || e)); }
        }
        const images = files.filter((f) => IMAGE_EXT.test(f) && !owned.has(path.resolve(f).toLowerCase()) && !models.some((m) => f.startsWith(path.dirname(m) + path.sep) && /[\\/]texture_\d+\.png$/i.test(f)));
        if (models.length && !images.length) continue;
        if (!images.length) { problems.push(label + ': ' + whyNone(files)); continue; }
        if (images.length > MAX_IMAGES) problems.push(label + `: картинок больше ${MAX_IMAGES}, взяты первые.`);
        const groups = groupFrames(groupImages(images.slice(0, MAX_IMAGES).sort()));
        let n = 0;
        for (const g of groups) {
          const name = this.add(g, groups.length === 1 ? label.replace(/\.(zip|rar|7z|png|jpe?g|webp|gif)$/i, '') : g.stem, label);
          if (name) { added.push(name); n++; }
        }
        if (!n) problems.push(label + ': картинки не читаются или слишком маленькие.');
      } catch (e) {
        problems.push(label + ': ' + String((e && e.message) || e));
      } finally {
        if (stage) fs.rmSync(stage, { recursive: true, force: true });
      }
    }
    return { added, problems };
  }
  add(group, title, source) {
    const loaded = [];
    for (const { file, role } of group.images) {
      if (fs.statSync(file).size > MAX_IMAGE) continue;
      const buf = fs.readFileSync(file), type = sniff(buf);
      if (!type) continue;
      const pic = (type === 'png' && !animatedPng(buf)) || type === 'jpg' ? this.decode(buf) : null;
      if (pic && Math.max(pic.w, pic.h) < MIN_SIDE) continue;
      loaded.push({ role, buf, type, pic });
    }
    if (!loaded.length) return null;
    if (!loaded.some((x) => ['main', 'front', 'frame'].includes(x.role))) loaded[0].role = 'main';
    // Transparent margins go; pictures of one size (front + back) keep their common frame, so they still match.
    const still = loaded.filter((x) => x.pic), boxes = still.map((x) => alphaBox(x.pic.data, x.pic.w, x.pic.h));
    const same = still.length > 1 && still.every((x) => x.pic.w === still[0].pic.w && x.pic.h === still[0].pic.h);
    const common = same ? boxes.filter(Boolean).reduce((a, b) => (a ? union(a, b) : b), null) : null;
    const hash = crypto.createHash('sha1'); loaded.forEach((x) => hash.update(x.buf));
    const digest = hash.digest('hex').slice(0, 10);
    const slug = title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '');
    const id = (slug || 'prop') + '-' + digest;
    const dir = path.join(this.dir, id);
    if (fs.existsSync(path.join(dir, 'prop.json'))) return this.get(id).name + ' (уже есть)';
    fs.mkdirSync(dir, { recursive: true });
    const images = [];
    loaded.forEach((x, i) => {
      let out = { buf: x.buf, w: x.pic ? x.pic.w : 0, h: x.pic ? x.pic.h : 0 }, ext = x.type;
      if (x.pic && x.type === 'png') {
        const box = common || boxes[still.indexOf(x)];
        if (box) { out = x.pic.crop(box, 1024); ext = 'png'; }
      }
      const file = `image${i}.${ext}`;
      fs.writeFileSync(path.join(dir, file), out.buf);
      images.push({ file, role: x.role, w: out.w, h: out.h });
    });
    const name = title.replace(/[_]+/g, ' ').trim().slice(0, 60) || 'Предмет';
    const first = loaded[0], g = guess(title + ' ' + source + ' ' + group.stem);
    this.writeProp({ id, name, images, source, ...(first.pic ? fitPlace(g, first.pic, common || boxes[still.indexOf(first)]) : g) });
    return name;
  }
  /** A Live2D item: its model3.json with the files it names, copied into our own folder. */
  addModel(file, title, source, owned) {
    const from = path.dirname(file), json = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '')), ref = json.FileReferences || {};
    const named = [ref.Moc, ref.Physics, ref.Pose, ref.DisplayInfo, ...(Array.isArray(ref.Textures) ? ref.Textures : []), ...(Array.isArray(ref.Expressions) ? ref.Expressions.map((e) => e && e.File) : []), ...Object.values(ref.Motions || {}).flat().map((m) => m && m.File)].filter((f) => typeof f === 'string' && f);
    const take = [];
    for (const rel of named) {
      const abs = path.resolve(from, rel.replace(/\\/g, '/'));
      if (!abs.startsWith(path.resolve(from) + path.sep) || !fs.existsSync(abs)) { if (rel === ref.Moc || (ref.Textures || []).includes(rel)) throw new Error('не хватает файла ' + rel + '.'); continue; }
      take.push({ rel: path.relative(from, abs), abs });
      owned.add(abs.toLowerCase());
    }
    if (!ref.Moc || !(ref.Textures || []).length) throw new Error('в предмете нет модели или текстур.');
    if (take.reduce((n, f) => n + fs.statSync(f.abs).size, 0) > 200 * 1024 * 1024) throw new Error('предмет больше 200 МБ.');
    // expressions lying next to it (VTube Studio hotkeys) belong to it too
    const exps = (Array.isArray(ref.Expressions) ? ref.Expressions : []).filter((e) => e && typeof e.Name === 'string' && typeof e.File === 'string');
    for (const f of fs.readdirSync(from)) if (/\.exp3\.json$/i.test(f) && !exps.some((e) => e.File === f)) { exps.push({ Name: f.replace(/\.exp3\.json$/i, ''), File: f }); take.push({ rel: f, abs: path.join(from, f) }); }
    const digest = crypto.createHash('sha1').update(fs.readFileSync(path.resolve(from, ref.Moc))).digest('hex').slice(0, 10);
    const slug = title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '');
    const id = (slug || 'item') + '-' + digest, dir = path.join(this.dir, id);
    if (fs.existsSync(path.join(dir, 'prop.json'))) return this.get(id).name + ' (уже есть)';
    for (const f of take) { const to = path.join(dir, 'model', f.rel); fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(f.abs, to); }
    fs.writeFileSync(path.join(dir, 'model', 'item.model3.json'), JSON.stringify({ ...json, FileReferences: { ...ref, Expressions: exps } }));
    const name = title.replace(/[_]+/g, ' ').trim().slice(0, 60) || 'Предмет';
    this.writeProp({ id, name, images: [], model: 'item.model3.json', expressions: exps.map((e) => e.Name), source, ...guess(title + ' ' + source + ' ' + path.basename(file)) });
    return name;
  }
  modelFile(id) { const p = PROP_ID.test(String(id)) && this.list().find((x) => x.id === id); return p && p.model === 'item.model3.json' ? path.join(this.dir, id, 'model', 'item.model3.json') : null; }
  /** The picture of a Live2D item for the settings page, drawn by the character window; its shape and whether it is empty without an expression. */
  shown(id, png, aspect, needsExpression) {
    const p = { ...this.get(id) };
    if (!p.model || p.images.length) return;
    const buf = Buffer.from(png);
    if (sniff(buf) !== 'png' || buf.length > MAX_IMAGE) return;
    fs.writeFileSync(path.join(this.dir, p.id, 'image0.png'), buf);
    p.images = [{ file: 'image0.png', role: 'main', w: 100, h: Math.max(1, Math.round(100 * (num(aspect, 0.05, 20) || 1))) }];
    if (needsExpression === true && p.expression === undefined && (p.expressions || []).length) p.expression = p.expressions[0];
    if (p.kind === 'gesture' && p.place.anchor === 'figure') p.place = { ...p.place, size: r3(0.34 * Math.min(1, p.images[0].w / p.images[0].h)) };
    p.place = onHead(p.place, p.images[0].h / p.images[0].w);
    this.writeProp(p);
    return true;
  }
}

function whyNone(files) {
  const has = (re) => files.some((f) => re.test(f));
  if (has(/\.moc3$/i)) return 'есть .moc3, но нет файла .model3.json, который его описывает.';
  if (has(/\.(cmo3|can3|psd|clip|ai)$/i)) return 'внутри только исходники (.cmo3 / .psd) — их нужно сначала сохранить в PNG.';
  if (has(/\.(vrm|fbx|glb|blend|unitypackage)$/i)) return 'это 3D-ассет, для live2D он не подходит.';
  return 'нет картинок (PNG, WebP, GIF, JPEG).';
}

module.exports = { PropStore, groupFrames, faceHole, fitPlace, PROP_ID, EVENTS, ANIMS, ANCHORS, cleanPlace, guess, groupImages, roleOf, sniff, alphaBox };
