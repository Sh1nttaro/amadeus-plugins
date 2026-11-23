// node --test amadeus-live2d/test/
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { similarity, applySimilarity, findLandmarks, project, dragDelta, padding, frameAt } from '../companion/renderer/props.mjs';

const { PropStore, groupFrames, faceHole, fitPlace, groupImages, roleOf, guess, cleanPlace, sniff, alphaBox } = createRequire(import.meta.url)('../companion/props.js');
const near = (a, b, e = 1e-3) => assert.ok(Math.abs(a - b) <= e, a + ' vs ' + b);

// ---------------------------------------------------------------- geometry
test('a head that moves, turns and grows is followed', () => {
  const rest = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], a = 0.3, k = 1.1;
  const now = rest.map((p) => ({ x: 2 + k * (p.x * Math.cos(a) - p.y * Math.sin(a)), y: -1 + k * (p.x * Math.sin(a) + p.y * Math.cos(a)) }));
  const t = similarity(rest, now); near(t.angle, a); near(t.scale, k);
  const p = applySimilarity(t, { x: 3, y: 5 }); near(p.x, 2 + k * (3 * Math.cos(a) - 5 * Math.sin(a))); near(p.y, -1 + k * (3 * Math.sin(a) + 5 * Math.cos(a)));
  assert.equal(similarity([{ x: 0, y: 0 }], [{ x: 0, y: 0 }]), null);
});
/** A toy model: body, face and two eyes; which parameters it has and whether the head turns by itself is up to the test. */
function toy({ lids = true, irises = true, turn = true } = {}) {
  const grid = (x0, x1, y0, y1, n = 6) => { const v = []; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) v.push(x0 + (x1 - x0) * i / (n - 1), y0 + (y1 - y0) * j / (n - 1)); return Float32Array.from(v); };
  const parts = [grid(-0.2, 0.2, -1, 0.7), grid(-0.12, 0.12, 0.72, 0.98), grid(-0.06, -0.04, 0.84, 0.86), grid(0.04, 0.06, 0.84, 0.86)];
  const shift = (v, dx, dy) => v.map((c, i) => c + (i % 2 ? dy : dx));
  return (map) => {
    let p = parts.map((v) => Float32Array.from(v));
    for (const k of Object.keys(map)) {
      if (k === 'ParamEyeLOpen' && lids) p[3] = shift(p[3], 0, -0.02);
      else if (k === 'ParamEyeROpen' && lids) p[2] = shift(p[2], 0, -0.02);
      else if (k === 'ParamEyeBallX' && irises) { p[2] = shift(p[2], 0.01, 0); p[3] = shift(p[3], 0.01, 0); }
      else if (/Angle/.test(k) && turn) { if (!/Body/.test(k)) for (const i of [1, 2, 3]) p[i] = shift(p[i], 0.03, 0); else p = p.map((v) => shift(v, 0.02, 0)); }
    }
    return { vertices: p, visible: p.map(() => true) };
  };
}
const FIG = { minX: -0.2, maxX: 0.2, minY: -1, maxY: 0.98 };
test('the face is found by the eyelids, by the irises, or guessed', () => {
  const a = findLandmarks(toy(), FIG); assert.equal(a.source, 'eyelids'); near(a.eyes.x, 0); near(a.eyes.y, 0.85); near(a.unit, 0.1); assert.ok(a.head.length >= 8);
  const b = findLandmarks(toy({ lids: false }), FIG); assert.equal(b.source, 'irises'); near(b.unit, 0.1);
  const c = findLandmarks(toy({ lids: false, irises: false }), FIG); assert.equal(c.source, 'guess'); assert.ok(c.eyes.y > 0.6); const d = findLandmarks(toy({ lids: false, irises: false, turn: false }), FIG); assert.equal(d.head, null);
});
test('a model that turns the head only through physics is followed too', () => {
  const l = findLandmarks(toy({ turn: false }), FIG); assert.ok(l.head && l.head.length >= 8);
});
const VIEW = { W: 300, H: 400, s: 1, facing: 1, centerX: 0, feetOffset: 0 };
test('placing: units of the face, mirrored with her, dragging is the inverse', () => {
  const lm = findLandmarks(toy(), FIG), place = { anchor: 'head', x: 1, y: 2, size: 3, rot: 10, flip: false };
  const p = project(place, lm, {}, VIEW); near(p.x, 150 + 0.1 * 200, 0.1); near(p.y, 200 - 1.05 * 200, 0.2); near(p.width, 60, 0.1); near(p.turn, 10);
  const m = project(place, lm, {}, { ...VIEW, facing: -1 }); near(m.x, 150 - 0.1 * 200, 0.1); near(m.turn, -10); assert.equal(m.mirror, -1);
  for (const facing of [1, -1]) {
    const v = { ...VIEW, facing }, d = dragDelta(17, -9, place, lm, v), q = project({ ...place, x: place.x + d.x, y: place.y + d.y }, lm, {}, v), q0 = project(place, lm, {}, v);
    near(q.x - q0.x, 17, 0.01); near(q.y - q0.y, -9, 0.01);
  }
});
test('room around the canvas: none when nothing sticks out, never endless', () => {
  assert.deepEqual(padding([], VIEW), { x: 0, top: 0 });
  assert.deepEqual(padding([{ x: 150, y: 200, width: 40, aspect: 1 }], VIEW), { x: 0, top: 0 });
  const p = padding([{ x: 290, y: 10, width: 100, aspect: 1 }], VIEW); assert.ok(p.x >= 64 && p.top >= 64);
  assert.deepEqual(padding([{ x: 1e6, y: -1e6, width: 1e6, aspect: 1 }], VIEW), { x: 480, top: 400 });
});

// ---------------------------------------------------------------- import
test('front + back and straight + left + right are one thing, other pictures are not', () => {
  const g = groupImages(['p/Front.PNG', 'p/Back.PNG']); assert.deepEqual(g.map((x) => x.images.map((i) => i.role)), [['front', 'back']]);
  const h = groupImages(['h/oni_horns.png', 'h/oni_horns_left.png', 'h/oni_horns_right.png']); assert.deepEqual(h.map((x) => x.images.map((i) => i.role)), [['main', 'left', 'right']]);
  assert.equal(groupImages(['a/good.png', 'a/bad.png', 'a/hand_left.png']).length, 3);
  assert.equal(groupImages(['a/cup.png', 'b/cup_back.png']).length, 2);
  assert.equal(roleOf('feedback.png').role, 'main');
});
test('the first guess', () => {
  assert.equal(guess('0627GoodIllust').kind, 'gesture'); assert.equal(guess('heart_arm_siku').kind, 'gesture'); assert.equal(guess('デコピン素材').anim, 'flick'); assert.equal(guess('0418secretIllust').place.anchor, 'mouth');
  for (const n of ['oni_horns', 'cat ears', 'halo']) { assert.equal(guess(n).kind, 'accessory'); assert.equal(guess(n).place.anchor, 'head'); }
  assert.equal(guess('CINNAMONROLL VTUBER BLANKET').place.anchor, 'body');
});
test('pictures are known by their bytes; placements are limited', () => {
  assert.equal(sniff(Buffer.from('<svg onload=alert(1)>aaaaaa')), ''); assert.equal(sniff(Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.alloc(20)])), 'png');
  assert.deepEqual(cleanPlace({ anchor: 'evil', x: NaN, y: 1e9, size: -1, layer: 'x', __proto__: { a: 1 }, flip: 'no' }), { y: 20, size: 0.02 });
  const d = Buffer.alloc(4 * 4 * 4); d[(1 * 4 + 2) * 4 + 3] = 255; assert.deepEqual(alphaBox(d, 4, 4), { x: 2, y: 1, width: 1, height: 1 }); assert.equal(alphaBox(Buffer.alloc(64), 4, 4), null);
});
function store(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'props-test-')), src = path.join(dir, 'src'); fs.mkdirSync(src);
  for (const [n, b] of Object.entries(files)) fs.writeFileSync(path.join(src, n), b);
  const deps = { decode: () => null, extract: async () => {}, walk: (d) => fs.readdirSync(d).map((f) => path.join(d, f)) };
  return { dir, src, open: () => new PropStore(path.join(dir, 'props'), deps) };
}
const gif = (n) => Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(30, n)]);
test('import, per-model placement, sharing, events, restart, removal', async () => {
  const t = store({ 'horns.gif': gif(1), 'hand.gif': gif(2), 'x.cmo3': 'x', 'fake.png': '<svg>aaaaaaaaaaaaaaaaaaaa' });
  let s = t.open();
  const r = await s.import([path.join(t.src, 'horns.gif'), path.join(t.src, 'hand.gif'), path.join(t.src, 'fake.png'), path.join(t.src, 'x.cmo3'), path.join(t.src, 'none.zip')]);
  assert.deepEqual(r.added, ['horns', 'hand']); assert.equal(r.problems.length, 3);
  const [hand, horns] = s.list(); assert.equal(hand.kind, 'gesture');
  s.wear('m1', horns.id, true); s.place('m1', horns.id, { x: 0.5 }); s.event('done', hand.id);
  s = t.open();
  const of = (m) => s.view(m).items.find((p) => p.id === horns.id);
  assert.equal(of('m1').on, true); assert.equal(of('m1').place.x, 0.5); assert.equal(of('m2').on, false); assert.equal(of('m2').place.x, 0); assert.equal(s.view('m1').events.done, hand.id);
  s.share('m1', horns.id); assert.equal(of('m2').place.x, 0.5);
  s.place('m1', horns.id, { anchor: 'body' }); assert.ok(of('m1').place.size < 1, 'other units get a sane size'); s.reset('m1', horns.id); assert.equal(of('m1').place.anchor, 'head');
  assert.equal((await s.import([path.join(t.src, 'horns.gif')])).added.length, 1); assert.equal(s.list().length, 2);
  assert.throws(() => s.remove('..')); assert.throws(() => s.event('hack', hand.id)); assert.equal(s.imageFile('..', 0), null); assert.equal(s.imageFile(horns.id, '../prop.json'), null); assert.ok(s.imageFile(horns.id, 0));
  s.remove(hand.id); assert.equal(s.view('m1').events.done, undefined); assert.equal(s.list().length, 1);
  fs.rmSync(t.dir, { recursive: true, force: true });
});
test('gestures of a turn: once each, "done" not after a cancelled or failed one', () => {
  const main = fs.readFileSync(new URL('../companion/main.js', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  const a = main.indexOf('function turnGesture('), b = main.indexOf('function speakMessage(');
  const got = [], state = { front: {} };
  const run = new Function('state', 'gestureEvent', main.slice(a, b).replace(/\bfront\b/g, 'state.front') + '; return turnGesture;')(state, (e) => got.push(e));
  const turn = (list) => { state.front = {}; got.length = 0; for (const [p, f, t, st] of list) run(!!st, p, f, t || ''); return got.join(); };
  assert.equal(turn([['connecting', false, '', true], ['thinking'], ['thinking'], ['tool'], ['tool'], ['answer', false, 'a'], ['answer', true, 'ab'], ['end', true]]), 'start,thinking,tool,done');
  assert.equal(turn([['connecting', false, '', true], ['answer', false, 'a'], ['end', true]]), 'start');
  assert.equal(turn([['connecting', false, '', true], ['answer', true, 'a'], ['error'], ['end', true]]), 'start,error');
  assert.equal(turn([['connecting', false, '', true], ['answer', true, 'a'], ['tool'], ['end', true]]), 'start,tool');
});

// ---------------------------------------------------------------- what the real BOOTH files need
const picture = (w, h, at) => { const data = Buffer.alloc(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (at(x, y)) data[(y * w + x) * 4 + 3] = 255; return { w, h, data }; };
const whole = (p) => ({ x: 0, y: 0, width: p.w, height: p.h });
test('a hood is worn with its opening on the face', () => {
  const hood = picture(200, 240, (x, y) => Math.hypot(x - 100, y - 120) < 100 && Math.hypot(x - 100, (y - 80) * 1.2) > 40);
  const hole = faceHole(hood.data, 200, 240, whole(hood)); near(hole.x, 0.5, 0.03); near(hole.y, 1 / 3, 0.04); near(hole.w, 0.4, 0.05);
  const g = fitPlace(guess('Front'), hood, whole(hood)); assert.equal(g.place.anchor, 'head'); near(g.place.size, 8, 1); assert.ok(g.place.y < -1);
  const solid = picture(100, 100, (x, y) => Math.hypot(x - 50, y - 50) < 45); assert.equal(faceHole(solid.data, 100, 100, whole(solid)), null);
  const open = picture(100, 100, (x, y) => x < 20 || x > 80 || y > 80); assert.equal(faceHole(open.data, 100, 100, whole(open)), null, 'open to the outside: not a hole');
  assert.equal(fitPlace(guess('cup'), solid, whole(solid)).place.anchor, 'body');
});
test('a raised fingertip goes to the lips, hands keep one height, a tall horn stands on the hair', () => {
  const arm = picture(100, 200, (x, y) => Math.abs(x - (70 - y * 0.2)) < 8), g = fitPlace(guess('0418secretIllust'), arm, whole(arm));
  const tipX = g.place.x + (0.7 - 0.5) * g.place.size, tipY = g.place.y + g.place.size * 2 / 2; near(tipX, 0, 0.05); near(tipY, 0.15, 0.02);
  for (const [w, h] of [[50, 200], [200, 200], [300, 100]]) { const p = picture(w, h, () => true), q = fitPlace(guess('goodhand'), p, whole(p)).place.size; near(Math.max(q, q * h / w), 0.34, 0.002); }
  const horn = picture(20, 200, () => true), k = fitPlace(guess('oni_horns'), horn, whole(horn)).place; near(k.size * 10, 2.2, 0.01); near(k.y, 1.4 + 1.1, 0.01);
});
test('numbered pictures of a movement are frames, numbered variants are not', () => {
  const dir = 'a/', list = (names) => groupFrames(groupImages(names.map((n) => dir + n)));
  const d = list(['1024DekopinSelf(1).png', '1024DekopinSelf.png', '1024DekopinViwer(2).png', '1024DekopinViwer.png', '1024DekopinViwer(1).png']);
  assert.deepEqual(d.map((g) => g.images.map((i) => path.basename(i.file, '.png'))).sort((a, b) => a.length - b.length), [['1024DekopinSelf', '1024DekopinSelf(1)'], ['1024DekopinViwer', '1024DekopinViwer(1)', '1024DekopinViwer(2)']]);
  assert.ok(d.every((g) => g.images.every((i) => i.role === 'frame')));
  assert.equal(list(['0627Good.png', '0627Good(1).png', '0627Good(2).png']).length, 3);
  assert.deepEqual([0, 0.29, 0.31, 0.45, 0.5, 1].map((t) => frameAt(t, [0, 3, 1, 2])), [0, 0, 3, 1, 2, 2]);
  assert.equal(frameAt(0.9, [0]), 0); assert.deepEqual([0.1, 0.49, 0.6].map((t) => frameAt(t, [1, 0])), [1, 1, 0]);
});
test('a Live2D item is taken whole, its texture is not a picture, nothing outside its folder', async () => {
  const t = store({ 'horn.moc3': 'MOC', 'heart.exp3.json': '{}' }); fs.mkdirSync(path.join(t.src, 'tex')); fs.writeFileSync(path.join(t.src, 'tex', 'texture_00.png'), gif(3)); fs.writeFileSync(path.join(t.dir, 'secret.txt'), 'x');
  const put = (extra) => fs.writeFileSync(path.join(t.src, 'horn.model3.json'), JSON.stringify({ Version: 3, FileReferences: { Moc: 'horn.moc3', Textures: ['tex/texture_00.png'], Physics: '../secret.txt', ...extra } }));
  put(); const walk = (d) => fs.readdirSync(d, { recursive: true }).map((f) => path.join(d, f)).filter((f) => fs.statSync(f).isFile());
  const s = t.open(); s.walk = walk;
  let r = await s.import([t.src]); assert.equal(r.added.length, 1); assert.deepEqual(r.problems, []);
  const [p] = s.list(); assert.deepEqual(p.images, []); assert.deepEqual(p.expressions, ['heart']); const kept = walk(path.join(s.dir, p.id)).map((f) => path.basename(f)).sort(); assert.deepEqual(kept, ['heart.exp3.json', 'horn.moc3', 'item.model3.json', 'prop.json', 'texture_00.png']);
  assert.ok(s.modelFile(p.id)); assert.equal(s.modelFile('..'), null);
  assert.equal(s.shown(p.id, Buffer.from('<svg>aaaaaaaaaaaaaaaaaaa'), 1, true), undefined);
  assert.equal(s.shown(p.id, Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.alloc(20)]), 8, true), true);
  const q = s.get(p.id); assert.equal(q.expression, 'heart'); assert.ok(q.place.size < 0.3 && q.images[0].h === 800);
  s.update(p.id, { expression: 'evil', order: [5, 0, 'x'] }); assert.equal(s.get(p.id).expression, 'heart'); s.update(p.id, { expression: '' }); assert.equal(s.get(p.id).expression, '');
  put({ Textures: ['../../x.png'] }); const t2 = t.open(); t2.walk = walk; t2.remove(p.id); r = await t2.import([t.src]); assert.equal(t2.list().filter((x) => x.model).length, 0); assert.match(r.problems.join(), /не хватает файла/);
  fs.rmSync(t.dir, { recursive: true, force: true });
});
