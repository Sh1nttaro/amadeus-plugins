// Living 3D desktop companion: a VRM character in a full-work-area transparent overlay.
// Body (three-vrm) + procedural poses blended with optional VRMA / Mixamo clips,
// desktop physics (floor = taskbar, window top edges = ledges), a small "brain"
// (needs, moods, autonomous actions) and the agent link (bubble, thinking, lip-sync).
import * as THREE from 'three';
import { GLTFLoader } from './three/loaders/GLTFLoader.js';
import { FBXLoader } from './three/loaders/FBXLoader.js';
import { VRMLoaderPlugin, VRMUtils } from './vendor/three-vrm.module.min.js';
import { VRMAnimationLoaderPlugin, createVRMAnimationClip } from './vendor/three-vrm-animation.module.min.js';

const api = window.amadeus;
const log = (...a) => { try { api.log(a.join(' ')); } catch {} };
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const damp = (k, dt) => 1 - Math.exp(-k * dt);
const pick = (list) => list[Math.floor(Math.random() * list.length)];

// ------------------------------------------------------------------ renderer
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: 'low-power' });
renderer.setClearColor(0x000000, 0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -3000, 3000);
camera.position.set(0, 0, 1000);
// MToon looks right with one key light + flat ambient (extra lights tint the dark cloth)
const sun = new THREE.DirectionalLight(0xffffff, 2.4);
sun.position.set(0.4, 1, 1.2);
scene.add(sun, new THREE.AmbientLight(0xffffff, 0.75));
let W = 1, H = 1, dpr = 1;
let pxPerM = 200;   // pixels per meter (= pet.scale once a model is loaded)
const QUALITY = { normal: 1, high: 1.5, ultra: 2 };   // render scale on top of the screen's pixel ratio
let qualityKey = 'high';
function resize() {
  W = window.innerWidth; H = window.innerHeight;
  const q = QUALITY[qualityKey] || 1.5;
  dpr = Math.min((window.devicePixelRatio || 1) * q, 3);
  renderer.setPixelRatio(dpr);
  renderer.setSize(W, H, false);
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  fitCamera();
}
// World units are meters (real VRM size, so spring-bone physics behaves); screen logic is in
// pixels; pet.scale converts (px per meter). The orthographic camera maps meters to pixels.
function fitCamera() {
  const k = pxPerM;
  camera.left = 0; camera.right = W / k; camera.top = H / k; camera.bottom = 0;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ------------------------------------------------------------------ state
const settings = { height: 340, behaviors: { walk: true, climb: true, sleep: true, cursor: true, physics: true }, speechBubble: { enabled: true, mode: 'bubble', hideAfter: 10 }, animations: [] };
const root = new THREE.Group();          // feet origin, pixel units
scene.add(root);
const lookTarget = new THREE.Object3D();
scene.add(lookTarget);

const pet = {
  vrm: null, id: '', mixer: null,
  scale: 1, heightPx: 340, hipsPx: 170, shoulderPx: 50,
  x: 0, y: 0, vx: 0, vy: 0, speed: 0, yaw: 0, yawTarget: 0, tilt: 0, squash: 1,
  state: 'none', stateT: 0, stateDur: 0, next: null,
  surface: { kind: 'floor' }, walkTo: null, jumpTo: null,
  energy: 1, boredom: 0, joy: 0.5, lastTouch: 0, lastSeenUser: performance.now(),
  sleeping: false, talking: false, phase: 'idle',
  gesture: null, manual: new Map(), emotion: {}, emotionUntil: 0,
};
const cursor = { x: -1, y: -1, t: 0, moved: 0, over: false, overBubble: false };
const world = { windows: [], ledges: [], idle: 0, ready: false };

// ------------------------------------------------------------------ helpers: coordinates
const toWorldY = (screenY) => H - screenY;
function headWorld() {
  const head = bone('head');
  if (!head) return new THREE.Vector3(pet.x, pet.y + pet.heightPx * 0.9, 0);
  return head.getWorldPosition(new THREE.Vector3()).multiplyScalar(pet.scale);
}

// ------------------------------------------------------------------ model loading
const loader = new GLTFLoader();
loader.register((parser) => new VRMLoaderPlugin(parser));
const animLoader = new GLTFLoader();
animLoader.register((parser) => new VRMAnimationLoaderPlugin(parser));
const fbxLoader = new FBXLoader();

function bone(name) { return pet.vrm && pet.vrm.humanoid ? pet.vrm.humanoid.getNormalizedBoneNode(name) : null; }
function hasExpr(name) { return !!(pet.vrm && pet.vrm.expressionManager && pet.vrm.expressionManager.getExpression(name)); }
function setExpr(name, v) { if (hasExpr(name)) pet.vrm.expressionManager.setValue(name, clamp(v, 0, 1)); }

let loadToken = 0;
async function loadModel(url, id) {
  const token = ++loadToken;
  const gltf = await loader.loadAsync(url);
  if (token !== loadToken) { VRMUtils.deepDispose(gltf.scene); return { ok: true, superseded: true }; }   // a newer load won
  unloadModel();
  const vrm = gltf.userData.vrm;
  if (!vrm) throw new Error('Файл не содержит VRM-модели.');
  VRMUtils.removeUnnecessaryVertices(gltf.scene);
  if (VRMUtils.combineSkeletons) VRMUtils.combineSkeletons(gltf.scene); else if (VRMUtils.removeUnnecessaryJoints) VRMUtils.removeUnnecessaryJoints(gltf.scene);
  VRMUtils.rotateVRM0(vrm);
  const aniso = renderer.capabilities.getMaxAnisotropy();
  vrm.scene.traverse((o) => {
    o.frustumCulled = false;
    if (!o.isMesh) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      for (const key of ['map', 'shadeMultiplyTexture', 'normalMap', 'emissiveMap', 'matcapTexture', 'rimMultiplyTexture']) {
        const tex = m && m[key];
        if (tex && tex.isTexture) { tex.anisotropy = aniso; tex.needsUpdate = true; }
      }
    }
  });
  applyShadeTint(vrm);                         // pet.vrm is not set yet here
  applyRim(vrm);
  if (vrm.lookAt) vrm.lookAt.target = lookTarget;
  pet.vrm = vrm; pet.id = id || '';
  vrm.update(0);                 // measured detached from the scene: model space, not screen space
  // measure in model units (bind-pose geometry, not the skinned/sprung pose), then scale to the on-screen height
  const box = new THREE.Box3();
  vrm.scene.updateMatrixWorld(true);
  vrm.scene.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld));
  });
  const headBone = bone('head');
  const headY = headBone ? headBone.getWorldPosition(new THREE.Vector3()).y : 1.4;
  let heightM = box.isEmpty() ? headY * 1.12 : box.max.y - Math.min(0, box.min.y);
  if (!(heightM > headY * 0.9 && heightM < headY * 1.6)) heightM = headY * 1.12;   // hats / props / odd bounds
  heightM = Math.max(0.3, heightM);
  const hips = bone('hips');
  const hipsM = hips ? hips.getWorldPosition(new THREE.Vector3()).y : heightM * 0.5;
  const ls = bone('leftUpperArm'), rs = bone('rightUpperArm');
  const shoulderM = ls && rs ? ls.getWorldPosition(new THREE.Vector3()).distanceTo(rs.getWorldPosition(new THREE.Vector3())) : heightM * 0.2;
  pet.base = { heightM, hipsM, shoulderM };
  measureArms();
  measureBody(vrm);
  { const rest = measureRest(vrm).nodes; pet.restHand = { left: rest.leftHand && rest.leftHand.q, right: rest.rightHand && rest.rightHand.q }; pet.restHead = rest.head && rest.head.q; }
  root.add(vrm.scene);
  applyScale();
  pet.mixer = new THREE.AnimationMixer(vrm.scene);
  clips.byRole = {}; clips.loaded = new Set();
  await loadClips();
  if (pet.state === 'none') { pet.x = W * 0.78; pet.y = 0; setState('idle'); }
  pet.resetSprings = true;
  if (settings.behaviors.physics && pet.y > 0) setState('fall');
  window.__petReady = true;
  return { ok: true, expressions: listExpressions(), bones: vrm.humanoid ? Object.keys(vrm.humanoid.humanBones).length : 0, version: vrm.meta && vrm.meta.metaVersion };
}
function applyScale() {
  if (!pet.base) return;
  pet.heightPx = settings.height;
  pet.scale = pet.heightPx / pet.base.heightM;
  pet.hipsPx = pet.base.hipsM * pet.scale;
  pet.shoulderPx = pet.base.shoulderM * pet.scale;
  pxPerM = pet.scale;
  fitCamera();
}
function unloadModel() {
  if (!pet.vrm) return;
  root.remove(pet.vrm.scene);
  VRMUtils.deepDispose(pet.vrm.scene);
  pet.vrm = null; pet.mixer = null; pet.base = null;
  clips.current = null;
}
function listExpressions() {
  const m = pet.vrm && pet.vrm.expressionManager;
  return m ? m.expressions.map((e) => e.expressionName) : [];
}

// ------------------------------------------------------------------ animation clips (optional)
// Files from companion/animations with a role (idle, walk, sit, sleep, wave, …). VRMA plays
// natively; Mixamo FBX is retargeted onto the VRM humanoid. Root motion is removed.
const clips = { byRole: {}, loaded: new Set(), current: null, currentRole: '' };
const MIXAMO = {
  mixamorigHips: 'hips', mixamorigSpine: 'spine', mixamorigSpine1: 'chest', mixamorigSpine2: 'upperChest', mixamorigNeck: 'neck', mixamorigHead: 'head',
  mixamorigLeftShoulder: 'leftShoulder', mixamorigLeftArm: 'leftUpperArm', mixamorigLeftForeArm: 'leftLowerArm', mixamorigLeftHand: 'leftHand',
  mixamorigRightShoulder: 'rightShoulder', mixamorigRightArm: 'rightUpperArm', mixamorigRightForeArm: 'rightLowerArm', mixamorigRightHand: 'rightHand',
  mixamorigLeftUpLeg: 'leftUpperLeg', mixamorigLeftLeg: 'leftLowerLeg', mixamorigLeftFoot: 'leftFoot', mixamorigLeftToeBase: 'leftToes',
  mixamorigRightUpLeg: 'rightUpperLeg', mixamorigRightLeg: 'rightLowerLeg', mixamorigRightFoot: 'rightFoot', mixamorigRightToeBase: 'rightToes',
};
async function loadMixamo(url, vrm) {
  const asset = await fbxLoader.loadAsync(url);
  const clip = THREE.AnimationClip.findByName(asset.animations, 'mixamo.com') || asset.animations[0];
  if (!clip) throw new Error('В FBX нет анимации.');
  const tracks = [];
  const restInv = new THREE.Quaternion(), parentRest = new THREE.Quaternion(), q = new THREE.Quaternion(), v = new THREE.Vector3();
  const hipsSrc = asset.getObjectByName('mixamorigHips');
  const hipsHeight = vrm.humanoid.getNormalizedAbsolutePose().hips.position[1];
  const scale = hipsSrc ? hipsHeight / hipsSrc.position.y : 0.01;
  for (const track of clip.tracks) {
    const [rigName, prop] = track.name.split('.');
    const vrmBone = MIXAMO[rigName];
    const node = vrmBone && vrm.humanoid.getNormalizedBoneNode(vrmBone);
    const src = asset.getObjectByName(rigName);
    if (!node || !src) continue;
    src.getWorldQuaternion(restInv).invert();
    src.parent.getWorldQuaternion(parentRest);
    if (track instanceof THREE.QuaternionKeyframeTrack) {
      const values = track.values.slice();
      for (let i = 0; i < values.length; i += 4) {
        q.fromArray(values, i).premultiply(parentRest).multiply(restInv).toArray(values, i);
      }
      const isV0 = vrm.meta && vrm.meta.metaVersion === '0';
      tracks.push(new THREE.QuaternionKeyframeTrack(node.name + '.quaternion', track.times, values.map((x, i) => (isV0 && i % 2 === 0 ? -x : x))));
    } else if (track instanceof THREE.VectorKeyframeTrack && prop === 'position' && vrmBone === 'hips') {
      const values = track.values.map((x, i) => (vrm.meta && vrm.meta.metaVersion === '0' && i % 3 !== 1 ? -x : x) * scale);
      tracks.push(new THREE.VectorKeyframeTrack(node.name + '.position', track.times, values));
    }
  }
  return new THREE.AnimationClip('mixamo', clip.duration, tracks);
}

// Generic humanoid retargeting for glTF/FBX animation packs with their own skeleton
// (Unreal-style names: pelvis, spine_01, upperarm_l … — e.g. Quaternius UAL, KayKit-like rigs).
// The reference T-pose comes from a "TPose" clip when the pack has one (A-pose bind
// poses otherwise put the arms 45° off); the facing/up of the source rig is detected and
// rotated onto the VRM frame, so packs facing -Z or Z-up still map correctly.
const UE_MAP = {
  pelvis: 'hips', spine_01: 'spine', spine_02: 'chest', spine_03: 'upperChest', neck_01: 'neck', head: 'head',
  clavicle_l: 'leftShoulder', upperarm_l: 'leftUpperArm', lowerarm_l: 'leftLowerArm', hand_l: 'leftHand',
  clavicle_r: 'rightShoulder', upperarm_r: 'rightUpperArm', lowerarm_r: 'rightLowerArm', hand_r: 'rightHand',
  thigh_l: 'leftUpperLeg', calf_l: 'leftLowerLeg', foot_l: 'leftFoot', ball_l: 'leftToes',
  thigh_r: 'rightUpperLeg', calf_r: 'rightLowerLeg', foot_r: 'rightFoot', ball_r: 'rightToes',
};
for (const sd of ['l', 'r']) {
  const side = sd === 'l' ? 'left' : 'right';
  for (const [src, dst] of [['index', 'Index'], ['middle', 'Middle'], ['ring', 'Ring'], ['pinky', 'Little']]) {
    UE_MAP[src + '_01_' + sd] = side + dst + 'Proximal'; UE_MAP[src + '_02_' + sd] = side + dst + 'Intermediate'; UE_MAP[src + '_03_' + sd] = side + dst + 'Distal';
  }
  UE_MAP['thumb_01_' + sd] = side + 'ThumbMetacarpal'; UE_MAP['thumb_02_' + sd] = side + 'ThumbProximal'; UE_MAP['thumb_03_' + sd] = side + 'ThumbDistal';
}
const packCache = new Map();
async function loadPack(url) {
  if (packCache.has(url)) return packCache.get(url);
  const asset = /\.fbx$/i.test(url.split('?')[0]) ? await fbxLoader.loadAsync(url) : await plainLoader.loadAsync(url);
  const sceneObj = asset.scene || asset;
  const animations = asset.animations || [];
  const pack = { scene: sceneObj, animations };
  packCache.set(url, pack);
  return pack;
}
const plainLoader = new GLTFLoader();
/** Retarget one clip of a pack (glTF/FBX with its own skeleton) onto the current VRM. */
function retargetPackClip(pack, clipName, vrm) {
  const clip = clipName == null ? pack.animations[0] : pack.animations.find((c) => c.name === clipName);
  if (!clip) throw new Error(clipName == null ? 'В файле нет анимации.' : 'В наборе нет клипа ' + clipName);
  const sc = pack.scene;
  // reference pose: the pack's T-pose clip at t=0 when present, else the bind pose
  const mixer = new THREE.AnimationMixer(sc);
  const tpose = pack.animations.find((c) => /t[-_ ]?pose/i.test(c.name));
  if (tpose) { mixer.clipAction(tpose).play(); mixer.update(0); }
  sc.updateMatrixWorld(true);
  // source bones → VRM humanoid names (bones first: meshes are sometimes called "Head" too)
  const byVrm = {}, vrmOf = new Map(), byTrack = {};
  const visit = (o, bonesOnly) => {
    if (!o.name || (bonesOnly && !o.isBone)) return;
    const key = THREE.PropertyBinding.sanitizeNodeName(o.name).toLowerCase();
    if (!byTrack[key]) byTrack[key] = o;
    const v = humanoidName(o.name);
    if (v && !byVrm[v]) { byVrm[v] = o; vrmOf.set(o, v); }
  };
  sc.traverse((o) => visit(o, true));
  sc.traverse((o) => visit(o, false));
  if (!byVrm.hips) throw new Error('Скелет анимации не распознан (нет кости бёдер).');
  const ref = {};
  for (const v in byVrm) {
    const b = byVrm[v];
    ref[v] = { world: b.getWorldQuaternion(new THREE.Quaternion()), parent: b.parent.getWorldQuaternion(new THREE.Quaternion()), pos: b.getWorldPosition(new V3()) };
  }
  // source frame → VRM frame (VRM: up +Y, the character's left +X, faces +Z)
  const P = (n) => (ref[n] ? ref[n].pos.clone() : null);
  const up = P('head') ? P('head').sub(P('hips')).normalize() : new V3(0, 1, 0);
  const left = P('leftUpperArm') && P('rightUpperArm') ? P('leftUpperArm').sub(P('rightUpperArm')) : new V3(1, 0, 0);
  left.sub(up.clone().multiplyScalar(left.dot(up))).normalize();
  const fwd = new V3().crossVectors(left, up).normalize();
  const R = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(left, up, fwd)).invert();   // source → VRM
  const Rinv = R.clone().invert();
  const isV0 = vrm.meta && vrm.meta.metaVersion === '0';
  // rest-pose correction (A-pose sources): rotation from the VRM rest direction of a bone to
  // the source's rest direction; local = C(parent)⁻¹ · L · C(bone)
  const { nodes: N } = measureRest(vrm);
  const C = {};
  for (const v in byVrm) {
    const c = REST_CHILD[v];
    if (!N[v] || !N[v].dir || !c || !ref[c]) continue;
    const ds = ref[c].pos.clone().sub(ref[v].pos).applyQuaternion(R).normalize();
    if (ds.lengthSq() > 0.5) C[v] = new THREE.Quaternion().setFromUnitVectors(N[v].dir, ds);
  }
  for (const v in byVrm) if (!C[v] && /Distal$/.test(v)) { const prev = v.replace(/Distal$/, /Thumb/.test(v) ? 'Proximal' : 'Intermediate'); if (C[prev]) C[v] = C[prev]; }
  const hipsSrc = byVrm.hips;
  const srcHipsH = ref.hips.pos.clone().applyQuaternion(R).y || 1;
  const vrmHipsH = vrm.humanoid.getNormalizedAbsolutePose().hips.position[1];
  const scale = vrmHipsH / srcHipsH;
  mixer.stopAllAction(); mixer.uncacheRoot(sc);
  const tracks = [];
  const q = new THREE.Quaternion(), cInv = new THREE.Quaternion();
  for (const track of clip.tracks) {
    const dot = track.name.lastIndexOf('.');
    const nodeKey = track.name.slice(0, dot).toLowerCase().replace(/^.*[/|]/, '');
    const prop = track.name.slice(dot + 1);
    const obj = byTrack[nodeKey];
    const vrmName = obj && vrmOf.get(obj);
    const node = vrmName && vrm.humanoid.getNormalizedBoneNode(vrmName);
    if (!node) continue;
    if (prop === 'quaternion') {
      const r = ref[vrmName];
      const restInv = r.world.clone().invert();
      const cb = C[vrmName], par = N[vrmName] && N[vrmName].parent;
      if (par && C[par]) cInv.copy(C[par]).invert(); else cInv.identity();
      const values = new Float32Array(track.values.length);
      for (let i = 0; i < values.length; i += 4) {
        q.fromArray(track.values, i).premultiply(r.parent).multiply(restInv);   // world-space delta from the reference pose
        q.premultiply(R).multiply(Rinv);                                          // into the VRM frame
        q.premultiply(cInv); if (cb) q.multiply(cb);                              // rest-pose correction
        if (isV0) { q.x = -q.x; q.z = -q.z; }
        q.toArray(values, i);
      }
      tracks.push(new THREE.QuaternionKeyframeTrack(node.name + '.quaternion', track.times, values));
    } else if (prop === 'position' && vrmName === 'hips') {
      const parentM = hipsSrc.parent.matrixWorld;
      const v = new V3();
      const values = new Float32Array(track.values.length);
      for (let i = 0; i < values.length; i += 3) {
        v.fromArray(track.values, i).applyMatrix4(parentM).applyQuaternion(R).multiplyScalar(scale);
        if (isV0) { v.x = -v.x; v.z = -v.z; }
        v.toArray(values, i);
      }
      tracks.push(new THREE.VectorKeyframeTrack(node.name + '.position', track.times, values));
    }
  }
  if (tracks.length < 5) throw new Error('Скелет анимации не распознан (совпало костей: ' + tracks.length + ').');
  return new THREE.AnimationClip(clip.name || 'clip', clip.duration, tracks);
}

// ------------------------------------------------------------------ bone names of other rigs
// Maps a source bone name to a VRM humanoid bone: Unreal-style (UE_MAP), VRoid FBX exports
// (J_Bip_L_UpperArm…), Mixamo (mixamorig:LeftForeArm…) and plain names (LeftUpperArm, Hips…).
const SIDE_PART = [
  [/^(shoulder|clavicle|collar)$/, 'Shoulder'], [/^(upperarm|arm)$/, 'UpperArm'], [/^(lowerarm|forearm|elbow)$/, 'LowerArm'], [/^(hand|wrist)$/, 'Hand'],
  [/^(upperleg|upleg|thigh)$/, 'UpperLeg'], [/^(lowerleg|leg|calf|shin|knee)$/, 'LowerLeg'], [/^(foot|ankle)$/, 'Foot'], [/^(toebase|toes|toe)$/, 'Toes'],
];
const CENTER_PART = { hips: 'hips', pelvis: 'hips', spine: 'spine', spine1: 'chest', spine2: 'upperChest', chest: 'chest', upperchest: 'upperChest', neck: 'neck', head: 'head' };
const FINGER_SEG = { thumb: ['ThumbMetacarpal', 'ThumbProximal', 'ThumbDistal'], index: ['IndexProximal', 'IndexIntermediate', 'IndexDistal'], middle: ['MiddleProximal', 'MiddleIntermediate', 'MiddleDistal'], ring: ['RingProximal', 'RingIntermediate', 'RingDistal'], little: ['LittleProximal', 'LittleIntermediate', 'LittleDistal'], pinky: ['LittleProximal', 'LittleIntermediate', 'LittleDistal'] };
function humanoidName(raw) {
  let n = String(raw).toLowerCase().replace(/^.*[|:/]/, '').replace(/^mixamorig\d*/, '');
  if (UE_MAP[n]) return UE_MAP[n];
  let side = '';
  let m;
  if ((m = n.match(/^j_?bip_?([lrc])_(.+)$/))) { side = m[1] === 'l' ? 'left' : m[1] === 'r' ? 'right' : ''; n = m[2]; }
  else if ((m = n.match(/^(left|right)[_.\s-]?(.+)$/))) { side = m[1]; n = m[2]; }
  else if ((m = n.match(/^(.+?)[_.\s-](l|r|left|right)$/))) { side = m[2][0] === 'l' ? 'left' : 'right'; n = m[1]; }
  else if ((m = n.match(/^(l|r)[_.\s-](.+)$/))) { side = m[1] === 'l' ? 'left' : 'right'; n = m[2]; }
  n = n.replace(/[\s_.-]/g, '');
  if (!side && CENTER_PART[n]) return CENTER_PART[n];
  if (!side && (m = n.match(/^(.+)(l|r)$/))) { side = m[2] === 'l' ? 'left' : 'right'; n = m[1]; }   // "upperarm.l" after glTF strips the dot
  if (!side) return null;
  n = n.replace(/^hand(?=thumb|index|middle|ring|pinky|little)/, '');
  for (const [re, part] of SIDE_PART) if (re.test(n)) return side + part;
  if ((m = n.match(/^(thumb|index|middle|ring|little|pinky)(\d|metacarpal|proximal|intermediate|distal)$/))) {
    const segs = FINGER_SEG[m[1]];
    const i = /\d/.test(m[2]) ? Number(m[2]) - 1 : m[2] === 'metacarpal' ? 0 : m[2] === 'proximal' ? (m[1] === 'thumb' ? 1 : 0) : m[2] === 'intermediate' ? 1 : 2;
    return segs[i] ? side + segs[i] : null;
  }
  return null;
}

// ------------------------------------------------------------------ rest pose of the VRM rig
// World rest rotation/position of every normalized bone with the root reset (model faces +Z,
// +X = the model's left). Used to turn world-space motion into local bone rotations, and to
// correct for source rigs whose rest pose differs (A-pose MMD/VRoid arms).
const REST_CHILD = {};
for (const side of ['left', 'right']) {
  Object.assign(REST_CHILD, {
    [side + 'Shoulder']: side + 'UpperArm', [side + 'UpperArm']: side + 'LowerArm', [side + 'LowerArm']: side + 'Hand', [side + 'Hand']: side + 'MiddleProximal',
    [side + 'UpperLeg']: side + 'LowerLeg', [side + 'LowerLeg']: side + 'Foot', [side + 'Foot']: side + 'Toes',
    [side + 'ThumbMetacarpal']: side + 'ThumbProximal', [side + 'ThumbProximal']: side + 'ThumbDistal',
  });
  for (const f of ['Index', 'Middle', 'Ring', 'Little']) { REST_CHILD[side + f + 'Proximal'] = side + f + 'Intermediate'; REST_CHILD[side + f + 'Intermediate'] = side + f + 'Distal'; }
}
const ALL_HUMAN = ['hips', 'spine', 'chest', 'upperChest', 'neck', 'head'];
for (const side of ['left', 'right']) {
  ALL_HUMAN.push(side + 'Shoulder', side + 'UpperArm', side + 'LowerArm', side + 'Hand');
  for (const f of ['Thumb']) ALL_HUMAN.push(side + f + 'Metacarpal', side + f + 'Proximal', side + f + 'Distal');
  for (const f of ['Index', 'Middle', 'Ring', 'Little']) ALL_HUMAN.push(side + f + 'Proximal', side + f + 'Intermediate', side + f + 'Distal');
}
for (const side of ['left', 'right']) ALL_HUMAN.push(side + 'UpperLeg', side + 'LowerLeg', side + 'Foot', side + 'Toes');
function measureRest(vrm) {
  const h = vrm.humanoid;
  const saved = [];
  for (const name of ALL_HUMAN) { const n = h.getNormalizedBoneNode(name); if (n) saved.push([n, n.quaternion.clone(), n.position.clone()]); }
  const rp = root.position.clone(), rq = root.quaternion.clone();
  root.position.set(0, 0, 0); root.quaternion.identity();
  h.resetNormalizedPose();
  root.updateMatrixWorld(true);
  const nodes = {};
  for (const name of ALL_HUMAN) {
    const node = h.getNormalizedBoneNode(name);
    if (!node) continue;
    nodes[name] = { node, q: node.getWorldQuaternion(new THREE.Quaternion()), p: node.getWorldPosition(new V3()), pq: node.parent.getWorldQuaternion(new THREE.Quaternion()) };
  }
  for (const name in nodes) {
    const par = nodes[name].node.parent;
    nodes[name].parent = Object.keys(nodes).find((k) => nodes[k].node === par) || null;
    const ch = REST_CHILD[name] && nodes[REST_CHILD[name]];
    if (ch) nodes[name].dir = ch.p.clone().sub(nodes[name].p).normalize();
  }
  const hipsParentInv = nodes.hips ? nodes.hips.node.parent.matrixWorld.clone().invert() : new THREE.Matrix4();
  for (const [n, q, p] of saved) { n.quaternion.copy(q); n.position.copy(p); }
  root.position.copy(rp); root.quaternion.copy(rq);
  root.updateMatrixWorld(true);
  return { nodes, hipsParentInv };
}

// ------------------------------------------------------------------ MMD motion (.vmd)
// MMD dances from Booth / Nico: binary keyframes on Japanese bone names, left-handed axes,
// A-pose arms, legs driven by foot IK. Baked at 30 fps onto the VRM rig: the body chain is
// composed in world space (rest = identity in MMD), arms get the A-pose → T-pose correction,
// legs are solved as two-bone IK towards the MMD foot-IK targets scaled to the model's legs.
// Facial morphs are ignored: the face stays with our own blink/emotion system.
const VMD_FPS = 30;
const MMD_ARM_DOWN = 37 * Math.PI / 180;      // standard MMD models hold their arms ~37° below horizontal
const MMD_SHOULDER_DOWN = 12 * Math.PI / 180;
const MMD_LEG_LEN = 9.2;                      // hip joint → ankle of a standard MMD model, MMD units
const toHalf = (s) => s.replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
function parseVMD(buffer) {
  const u8 = new Uint8Array(buffer);
  const dv = new DataView(buffer);
  const sjis = new TextDecoder('shift_jis');
  const str = (o, len) => { let e = o; while (e < o + len && u8[e] !== 0) e++; return sjis.decode(u8.subarray(o, e)); };
  const sig = str(0, 30);
  if (!/^Vocaloid Motion Data/.test(sig)) throw new Error('Это не файл VMD.');
  let o = 30 + (/0002/.test(sig) ? 20 : 10);
  const count = dv.getUint32(o, true); o += 4;
  if (o + count * 111 > u8.length) throw new Error('VMD обрезан.');
  const bones = {};
  let last = 0;
  for (let i = 0; i < count; i++, o += 111) {
    const name = toHalf(str(o, 15)).trim();
    const f = dv.getUint32(o + 15, true);
    const p = [dv.getFloat32(o + 19, true), dv.getFloat32(o + 23, true), -dv.getFloat32(o + 27, true)];          // left → right handed
    const q = new THREE.Quaternion(-dv.getFloat32(o + 31, true), -dv.getFloat32(o + 35, true), dv.getFloat32(o + 39, true), dv.getFloat32(o + 43, true)).normalize();
    const ip = u8.slice(o + 47, o + 63);
    (bones[name] = bones[name] || []).push({ f, p, q, ip });
    if (f > last) last = f;
  }
  for (const k in bones) bones[k].sort((a, b) => a.f - b.f);
  return { bones, last };
}
function bezierY(x, x1, y1, x2, y2) {
  if (x1 === y1 && x2 === y2) return x;
  let lo = 0, hi = 1, t = x;
  for (let i = 0; i < 16; i++) {
    const u = 1 - t, bx = 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t;
    if (bx < x) lo = t; else hi = t;
    t = (lo + hi) / 2;
  }
  const u = 1 - t;
  return 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t;
}
const vmdCurve = (ip, ch, x) => bezierY(x, ip[ch] / 127, ip[ch + 4] / 127, ip[ch + 8] / 127, ip[ch + 12] / 127);
function vmdSample(keys, f, outP, outQ) {
  outP.set(0, 0, 0); outQ.identity();
  if (!keys || !keys.length) return;
  let lo = 0, hi = keys.length - 1;
  if (f <= keys[0].f || hi === 0) { outP.fromArray(keys[0].p); outQ.copy(keys[0].q); return; }
  if (f >= keys[hi].f) { outP.fromArray(keys[hi].p); outQ.copy(keys[hi].q); return; }
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (keys[m].f <= f) lo = m; else hi = m; }
  const a = keys[lo], b = keys[hi], x = (f - a.f) / (b.f - a.f);
  outP.set(a.p[0] + (b.p[0] - a.p[0]) * vmdCurve(b.ip, 0, x), a.p[1] + (b.p[1] - a.p[1]) * vmdCurve(b.ip, 1, x), a.p[2] + (b.p[2] - a.p[2]) * vmdCurve(b.ip, 2, x));
  outQ.slerpQuaternions(a.q, b.q, vmdCurve(b.ip, 3, x));
}
// MMD standard skeleton (parent links); twist bones sit inside the arm chain
const MMD_PARENT = { 'センター': '全ての親', 'グルーブ': 'センター', '腰': 'グルーブ', '上半身': '腰', '上半身2': '上半身', '首': '上半身2', '頭': '首', '下半身': '腰' };
const VMD_TO = { hips: '下半身', spine: '上半身', chest: '上半身2', upperChest: '上半身2', neck: '首', head: '頭' };
for (const [side, s] of [['left', '左'], ['right', '右']]) {
  Object.assign(MMD_PARENT, {
    [s + '肩P']: '上半身2', [s + '肩']: s + '肩P', [s + '腕']: s + '肩', [s + '腕捩']: s + '腕', [s + 'ひじ']: s + '腕捩', [s + '手捩']: s + 'ひじ', [s + '手首']: s + '手捩',
    [s + '親指0']: s + '手首', [s + '親指1']: s + '親指0', [s + '親指2']: s + '親指1',
    [s + '足']: '下半身', [s + 'ひざ']: s + '足', [s + '足首']: s + 'ひざ', [s + 'つま先']: s + '足首', [s + '足IK親']: '全ての親', [s + '足IK']: s + '足IK親',
  });
  for (const fg of ['人指', '中指', '薬指', '小指']) Object.assign(MMD_PARENT, { [s + fg + '1']: s + '手首', [s + fg + '2']: s + fg + '1', [s + fg + '3']: s + fg + '2' });
  Object.assign(VMD_TO, {
    [side + 'Shoulder']: s + '肩', [side + 'UpperArm']: s + '腕捩', [side + 'LowerArm']: s + '手捩', [side + 'Hand']: s + '手首',
    [side + 'ThumbMetacarpal']: s + '親指0', [side + 'ThumbProximal']: s + '親指1', [side + 'ThumbDistal']: s + '親指2',
    [side + 'UpperLeg']: s + '足', [side + 'LowerLeg']: s + 'ひざ', [side + 'Foot']: s + '足首', [side + 'Toes']: s + 'つま先',
  });
  [['Index', '人指'], ['Middle', '中指'], ['Ring', '薬指'], ['Little', '小指']].forEach(([f, j]) => Object.assign(VMD_TO, { [side + f + 'Proximal']: s + j + '1', [side + f + 'Intermediate']: s + j + '2', [side + f + 'Distal']: s + j + '3' }));
}
const MMD_ORDER = ['全ての親', ...Object.keys(MMD_PARENT)];
const vmdCache = new Map();
async function loadVMD(url) {
  if (!vmdCache.has(url)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('VMD не найден');
    vmdCache.set(url, parseVMD(await res.arrayBuffer()));
  }
  return vmdCache.get(url);
}
function bakeVMD(vmd, vrm, name = 'vmd') {
  const { nodes: N, hipsParentInv } = measureRest(vrm);
  if (!N.hips) throw new Error('У модели нет костей гуманоида.');
  const B = vmd.bones;
  const has = (n) => !!(B[n] && B[n].some((k) => k.p.some((v) => Math.abs(v) > 1e-4) || Math.abs(k.q.w) < 0.99999));
  const frames = Math.max(2, vmd.last + 1);
  const names = ALL_HUMAN.filter((n) => N[n]);
  // A-pose → T-pose: rotation from the VRM rest direction of a bone to the MMD rest direction
  const C = {};
  for (const side of ['left', 'right']) {
    const sx = side === 'left' ? 1 : -1;
    const want = { Shoulder: new V3(sx * Math.cos(MMD_SHOULDER_DOWN), -Math.sin(MMD_SHOULDER_DOWN), 0), UpperArm: new V3(sx * Math.cos(MMD_ARM_DOWN), -Math.sin(MMD_ARM_DOWN), 0) };
    want.LowerArm = want.UpperArm; want.Hand = want.UpperArm;
    for (const part in want) { const n = N[side + part]; if (n && n.dir) C[side + part] = new THREE.Quaternion().setFromUnitVectors(n.dir, want[part]); }
    for (const n of names) if (n.startsWith(side) && /Thumb|Index|Middle|Ring|Little/.test(n) && C[side + 'Hand']) C[n] = C[side + 'Hand'];
  }
  const ik = { left: has('左足IK') || !has('左足'), right: has('右足IK') || !has('右足') };
  const legLen = N.leftUpperLeg && N.leftFoot ? N.leftUpperLeg.p.y - N.leftFoot.p.y : 0.8;
  const k = legLen / MMD_LEG_LEN;                 // world units per MMD unit
  const P = new V3(), Q = new THREE.Quaternion();
  // pass 1: hip translation per frame, then its slow drift (travel across the stage) is removed
  // from hips and feet alike, so she dances in place but keeps her sway and steps
  const hipT = new Float32Array(frames * 3);
  const P0 = new V3(), Q0 = new THREE.Quaternion(), tmp = new V3();
  for (let f = 0; f < frames; f++) {
    vmdSample(B['全ての親'], f, P0, Q0);
    tmp.set(0, 0, 0);
    for (const b of ['センター', 'グルーブ', '腰']) { vmdSample(B[b], f, P, Q); tmp.add(P); }
    tmp.applyQuaternion(Q0).add(P0).toArray(hipT, f * 3);
  }
  const travel = new Float32Array(frames * 2);
  const win = 24;
  for (let f = 0; f < frames; f++) {
    let sx = 0, sz = 0, n = 0;
    for (let j = Math.max(0, f - win); j <= Math.min(frames - 1, f + win); j++) { sx += hipT[j * 3]; sz += hipT[j * 3 + 2]; n++; }
    travel[f * 2] = sx / n; travel[f * 2 + 1] = sz / n;
  }
  // pass 2: pose per frame
  const out = {};
  for (const n of names) out[n] = new Float32Array(frames * 4);
  const hipsPos = new Float32Array(frames * 3);
  const D = {}, W = {}, Pw = {};
  for (const b of MMD_ORDER) D[b] = new THREE.Quaternion();
  const lq = new THREE.Quaternion(), inv = new THREE.Quaternion(), delta = new THREE.Quaternion();
  const ikP = new V3(), ikQ = new THREE.Quaternion();
  const deltaOf = (n) => delta.copy(W[n]).multiply(inv.copy(N[n].q).invert());
  const posOf = (n) => {                                   // world position from the parent chain
    if (Pw[n]) return Pw[n];
    const par = N[n].parent;
    const pp = posOf(par);
    Pw[n] = N[n].p.clone().sub(N[par].p).applyQuaternion(deltaOf(par)).add(pp);
    return Pw[n];
  };
  for (let f = 0; f < frames; f++) {
    for (const b of MMD_ORDER) {                      // world rotation of each MMD bone (rest = identity)
      vmdSample(B[b], f, P, Q);
      const par = MMD_PARENT[b];
      if (par) D[b].copy(D[par]).multiply(Q); else D[b].copy(Q);
    }
    for (const n of names) {
      const src = VMD_TO[n];
      W[n] = (W[n] || new THREE.Quaternion()).copy(D[src] || D['上半身2']);
      if (C[n]) W[n].multiply(C[n]);
      W[n].multiply(N[n].q);
    }
    for (const key in Pw) delete Pw[key];
    Pw.hips = N.hips.p.clone().add(new V3(hipT[f * 3] - travel[f * 2], hipT[f * 3 + 1], hipT[f * 3 + 2] - travel[f * 2 + 1]).multiplyScalar(k));
    for (const [side, s] of [['left', '左'], ['right', '右']]) {
      const ul = side + 'UpperLeg', ll = side + 'LowerLeg', ft = side + 'Foot', to = side + 'Toes';
      if (!ik[side] || !N[ul] || !N[ll] || !N[ft]) continue;
      // IK target: 全ての親 → 足IK親 (when the model has it) → 足IK, translations chained
      vmdSample(B['全ての親'], f, P0, Q0);
      const target = P0.clone();
      const chainQ = Q0.clone();
      for (const b of [s + '足IK親', s + '足IK']) {
        vmdSample(B[b], f, ikP, ikQ);
        target.add(ikP.applyQuaternion(chainQ));
        chainQ.multiply(ikQ);
      }
      target.x -= travel[f * 2]; target.z -= travel[f * 2 + 1];
      const T = N[ft].p.clone().addScaledVector(target, k);
      const footQ = chainQ;                             // foot orientation = IK bone orientation
      // two-bone solve: hip S, knee E, ankle at T; the knee bends towards the feet's / hips' front
      const S = posOf(ul);
      const L1 = N[ul].p.distanceTo(N[ll].p), L2 = N[ll].p.distanceTo(N[ft].p);
      const toT = T.clone().sub(S);
      const d = clamp(toT.length(), 1e-4, (L1 + L2) * 0.9995);
      const dir = toT.normalize();
      const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d);
      const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
      const pole = new V3(0, 0, 1).applyQuaternion(footQ).add(new V3(0, 0, 1).applyQuaternion(D['下半身']));
      pole.sub(dir.clone().multiplyScalar(pole.dot(dir)));
      if (pole.lengthSq() < 1e-8) pole.set(0, 0, 1);
      pole.normalize();
      const E = S.clone().addScaledVector(dir, a).addScaledVector(pole, h);
      const hipD = deltaOf(N[ul].parent).clone();
      const restU = N[ll].p.clone().sub(N[ul].p).normalize().applyQuaternion(hipD);
      W[ul].copy(new THREE.Quaternion().setFromUnitVectors(restU, E.clone().sub(S).normalize()).multiply(hipD).multiply(N[ul].q));
      const uD = deltaOf(ul).clone();
      const restL = N[ft].p.clone().sub(N[ll].p).normalize().applyQuaternion(uD);
      const ankle = S.clone().addScaledVector(dir, d);
      W[ll].copy(new THREE.Quaternion().setFromUnitVectors(restL, ankle.sub(E).normalize()).multiply(uD).multiply(N[ll].q));
      W[ft].copy(footQ).multiply(N[ft].q);
      if (N[to]) W[to].copy(footQ).multiply(N[to].q);
    }
    for (const n of names) {
      const par = N[n].parent;
      lq.copy(par ? W[par] : N[n].pq).invert().multiply(W[n]);
      lq.toArray(out[n], f * 4);
    }
    Pw.hips.clone().applyMatrix4(hipsParentInv).toArray(hipsPos, f * 3);
  }
  const times = new Float32Array(frames);
  for (let f = 0; f < frames; f++) times[f] = f / VMD_FPS;
  const tracks = names.map((n) => new THREE.QuaternionKeyframeTrack(N[n].node.name + '.quaternion', times, out[n]));
  tracks.push(new THREE.VectorKeyframeTrack(N.hips.node.name + '.position', times, hipsPos));
  const clip = new THREE.AnimationClip(name, (frames - 1) / VMD_FPS, tracks);
  clip.keepRoot = true;                                  // drift already removed, sway kept
  return clip;
}


// ------------------------------------------------------------------ Unity humanoid muscles
// Unity .anim humanoid clips (Booth pose packs …) store muscle values instead of rotations.
// angle = value × limit (Unity's default limits, degrees), measured from Unity's "muscle zero"
// pose; the T-pose sits at REF (arms 0.4 up / 0.3 back, straight elbows, knees, fingers).
// Axes are in the VRM frame (+X = model's left, +Y up, +Z forward) for the left side; the
// right side mirrors them. A positive value moves towards the second word (Front-Back → back,
// Down-Up → up, Stretch → straight). RootQ is the orientation of the *body* (hips → shoulders
// line, Unity's centre-of-mass frame), not of the pelvis: the pelvis is solved from it below.
const MUSCLE = {
  'Spine Front-Back': ['spine', [-40, 40], [-1, 0, 0]], 'Spine Left-Right': ['spine', [-40, 40], [0, 0, 1]], 'Spine Twist Left-Right': ['spine', [-40, 40], [0, -1, 0]],
  'Chest Front-Back': ['chest', [-40, 40], [-1, 0, 0]], 'Chest Left-Right': ['chest', [-40, 40], [0, 0, 1]], 'Chest Twist Left-Right': ['chest', [-40, 40], [0, -1, 0]],
  'UpperChest Front-Back': ['upperChest', [-20, 20], [-1, 0, 0]], 'UpperChest Left-Right': ['upperChest', [-20, 20], [0, 0, 1]], 'UpperChest Twist Left-Right': ['upperChest', [-20, 20], [0, -1, 0]],
  'Neck Nod Down-Up': ['neck', [-40, 40], [-1, 0, 0]], 'Neck Tilt Left-Right': ['neck', [-40, 40], [0, 0, 1]], 'Neck Turn Left-Right': ['neck', [-40, 40], [0, -1, 0]],
  'Head Nod Down-Up': ['head', [-40, 40], [-1, 0, 0]], 'Head Tilt Left-Right': ['head', [-40, 40], [0, 0, 1]], 'Head Turn Left-Right': ['head', [-40, 40], [0, -1, 0]],
};
const SIDE_MUSCLE = {
  'Shoulder Down-Up': ['Shoulder', [-15, 30], [0, 0, 1]], 'Shoulder Front-Back': ['Shoulder', [-15, 15], [0, 1, 0]],
  'Arm Down-Up': ['UpperArm', [-60, 100], [0, 0, 1]], 'Arm Front-Back': ['UpperArm', [-100, 100], [0, 1, 0]], 'Arm Twist In-Out': ['UpperArm', [-90, 90], [-1, 0, 0]],
  'Forearm Stretch': ['LowerArm', [-80, 80], [0, 1, 0]], 'Forearm Twist In-Out': ['LowerArm', [-90, 90], [-1, 0, 0]],
  'Hand Down-Up': ['Hand', [-80, 80], [0, 0, 1]], 'Hand In-Out': ['Hand', [-40, 40], [0, 1, 0]],
  'Upper Leg Front-Back': ['UpperLeg', [-90, 50], [1, 0, 0]], 'Upper Leg In-Out': ['UpperLeg', [-60, 60], [0, 0, 1]], 'Upper Leg Twist In-Out': ['UpperLeg', [-60, 60], [0, 1, 0]],
  'Lower Leg Stretch': ['LowerLeg', [-80, 80], [-1, 0, 0]], 'Lower Leg Twist In-Out': ['LowerLeg', [-90, 90], [0, 1, 0]],
  'Foot Up-Down': ['Foot', [-50, 50], [-1, 0, 0]], 'Foot Twist In-Out': ['Foot', [-30, 30], [0, 1, 0]], 'Toes Up-Down': ['Toes', [-50, 50], [-1, 0, 0]],
};
const FINGER_MUSCLE = { Thumb: [[-20, 20], [-40, 35], [-40, 35], [-25, 25]], Index: [[-50, 50], [-45, 45], [-45, 45], [-20, 20]], Middle: [[-50, 50], [-45, 45], [-45, 45], [-7.5, 7.5]], Ring: [[-50, 50], [-45, 45], [-45, 45], [-7.5, 7.5]], Little: [[-50, 50], [-45, 45], [-45, 45], [-20, 20]] };
const FINGER_SEGS = { Thumb: ['ThumbMetacarpal', 'ThumbProximal', 'ThumbDistal'], Index: ['IndexProximal', 'IndexIntermediate', 'IndexDistal'], Middle: ['MiddleProximal', 'MiddleIntermediate', 'MiddleDistal'], Ring: ['RingProximal', 'RingIntermediate', 'RingDistal'], Little: ['LittleProximal', 'LittleIntermediate', 'LittleDistal'] };
const SPREAD_AXIS = { Thumb: [0, -1, 0], Index: [0, -1, 0], Middle: [0, -1, 0], Ring: [0, 1, 0], Little: [0, 1, 0] };
const MUSCLE_REF = { 'Arm Down-Up': 0.4, 'Arm Front-Back': 0.3, 'Forearm Stretch': 1, 'Upper Leg Front-Back': 0.6, 'Lower Leg Stretch': 1 };
const muscleDeg = (v, [lo, hi]) => (v >= 0 ? v * hi : -v * lo);
/** Every muscle as { bone, limits, axis (VRM frame), ref }, keyed by the Unity attribute name. */
const MUSCLE_TABLE = (() => {
  const t = {};
  for (const [k, [bone, lim, axis]] of Object.entries(MUSCLE)) t[k] = { bone, lim, axis, ref: 0 };
  for (const [side, S] of [['left', 'Left'], ['right', 'Right']]) {
    const mir = (a) => (side === 'left' ? a : [a[0], -a[1], -a[2]]);
    for (const [k, [part, lim, axis]] of Object.entries(SIDE_MUSCLE)) t[S + ' ' + k] = { bone: side + part, lim, axis: mir(axis), ref: MUSCLE_REF[k] || 0 };
    for (const [f, lims] of Object.entries(FINGER_MUSCLE)) {
      for (let i = 0; i < 3; i++) t[S + 'Hand.' + f + '.' + (i + 1) + ' Stretched'] = { bone: side + FINGER_SEGS[f][i], lim: lims[i], axis: mir([0, 0, 1]), ref: 1 };
      t[S + 'Hand.' + f + '.Spread'] = { bone: side + FINGER_SEGS[f][0], lim: lims[3], axis: mir(SPREAD_AXIS[f]), ref: 0 };
    }
  }
  return t;
})();
const MUSCLE_ORDER = ['hips', 'spine', 'chest', 'upperChest', 'neck', 'head'];
for (const side of ['left', 'right']) {
  MUSCLE_ORDER.push(side + 'Shoulder', side + 'UpperArm', side + 'LowerArm', side + 'Hand');
  for (const f of Object.values(FINGER_SEGS)) MUSCLE_ORDER.push(...f.map((s) => side + s));
  MUSCLE_ORDER.push(side + 'UpperLeg', side + 'LowerLeg', side + 'Foot', side + 'Toes');
}
function sampleCurve(keys, t) {
  if (t <= keys[0][0] || keys.length === 1) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1] = keys[i]; return v0 + (v1 - v0) * ((t - t0) / (t1 - t0 || 1)); }
  return keys[keys.length - 1][1];
}
const muscleCache = new Map();
async function loadMuscles(url) {
  if (!muscleCache.has(url)) { const r = await fetch(url); if (!r.ok) throw new Error('Поза не найдена'); muscleCache.set(url, await r.json()); }
  return muscleCache.get(url);
}
function muscleClip(data, vrm, name) {
  const { nodes: N, hipsParentInv } = measureRest(vrm);
  if (!N.hips) throw new Error('У модели нет костей гуманоида.');
  const isV0 = vrm.meta && vrm.meta.metaVersion === '0';
  const static_ = !(data.duration > 0.05);
  const times = static_ ? [0, 1] : [];
  if (!static_) for (let t = 0; t <= data.duration + 1e-6; t += 1 / 30) times.push(t);
  const names = MUSCLE_ORDER.filter((n) => N[n]);
  const out = {};
  for (const n of names) out[n] = new Float32Array(times.length * 4);
  const hipsPos = new Float32Array(times.length * 3);
  const L = {}, R = {}, P = {};
  const axis = new V3(), dq = new THREE.Quaternion();
  const C = data.curves;
  times.forEach((t, fi) => {
    for (const n of names) (L[n] = L[n] || new THREE.Quaternion()).identity();
    // muscles → local rotations; twist first, then front-back, then down-up (applied left to right as listed)
    for (const [attr, keys] of Object.entries(C)) {
      const m = MUSCLE_TABLE[attr];
      if (!m || !L[m.bone]) continue;
      const deg = muscleDeg(sampleCurve(keys, t), m.lim) - muscleDeg(m.ref, m.lim);
      if (Math.abs(deg) < 1e-3) continue;
      dq.setFromAxisAngle(axis.fromArray(m.axis), deg * Math.PI / 180);
      L[m.bone].premultiply(dq);
    }
    // body orientation (Unity left-handed → VRM: mirror X). The body frame follows the line from
    // the hips to the neck, so the pelvis = RootQ · (rotation that brings the bent spine's
    // hips→neck line back to its rest direction).
    if (C['RootQ.w']) {
      const q = new THREE.Quaternion(sampleCurve(C['RootQ.x'], t), -sampleCurve(C['RootQ.y'], t), -sampleCurve(C['RootQ.z'], t), sampleCurve(C['RootQ.w'], t)).normalize();
      const top = N.neck ? 'neck' : N.upperChest ? 'upperChest' : 'chest';
      let rot = new THREE.Quaternion(), pos = N.hips.p.clone(), prev = 'hips';
      for (const b of ['spine', 'chest', 'upperChest', 'neck']) {
        if (!N[b]) continue;
        pos = N[b].p.clone().sub(N[prev].p).applyQuaternion(rot).add(pos);
        if (b === top) break;
        rot = rot.clone().multiply(L[b]);
        prev = b;
      }
      const bent = pos.sub(N.hips.p).normalize();
      const rest = N[top].p.clone().sub(N.hips.p).normalize();
      L.hips.copy(q).multiply(new THREE.Quaternion().setFromUnitVectors(bent, rest));
    }
    // forward kinematics (model frame) to keep the lowest point of the legs on the floor
    for (const n of names) {
      const par = N[n].parent;
      R[n] = (R[n] || new THREE.Quaternion()).copy(par && R[par] ? R[par] : new THREE.Quaternion()).multiply(L[n]);
      P[n] = par && P[par] ? N[n].p.clone().sub(N[par].p).applyQuaternion(R[par]).add(P[par]) : N[n].p.clone();
    }
    let low = Infinity, restLow = Infinity;
    for (const n of ['leftLowerLeg', 'rightLowerLeg', 'leftFoot', 'rightFoot', 'leftToes', 'rightToes']) if (P[n]) { low = Math.min(low, P[n].y); restLow = Math.min(restLow, N[n].p.y); }
    const drop = isFinite(low) ? restLow - low : 0;
    for (const n of names) {
      const q = L[n].clone();
      if (isV0) { q.x = -q.x; q.z = -q.z; }
      q.toArray(out[n], fi * 4);
    }
    N.hips.p.clone().add(new V3(0, drop, 0)).applyMatrix4(hipsParentInv).toArray(hipsPos, fi * 3);
  });
  const tt = Float32Array.from(times);
  // a held pose: nudge the last key imperceptibly so the value changes every frame and the
  // mixer keeps re-writing the bones (it skips unchanged values, and layers would then drift)
  if (static_) for (const n of names) { out[n][7] += 1e-5; }
  const tracks = names.map((n) => new THREE.QuaternionKeyframeTrack(N[n].node.name + '.quaternion', tt, out[n]));
  tracks.push(new THREE.VectorKeyframeTrack(N.hips.node.name + '.position', tt, hipsPos));
  const clip = new THREE.AnimationClip(name || data.name, times[times.length - 1], tracks);
  clip.keepRoot = true;
  clip.isPose = static_;                                 // a single frame: held by the "pose" gesture
  return clip;
}

function stripRootMotion(clip) {
  const hips = bone('hips');
  if (!hips) return clip;
  for (const t of clip.tracks) {
    if (t.name === hips.name + '.position') {
      const x0 = t.values[0], z0 = t.values[2];
      for (let i = 0; i < t.values.length; i += 3) { t.values[i] = x0; t.values[i + 2] = z0; }
    }
  }
  return clip;
}
async function loadClips() {
  if (!pet.vrm) return;
  const wanted = (settings.animations || []).filter((a) => a.role && a.role !== 'extra');
  const keys = new Set(wanted.map((a) => a.file + '#' + (a.clip || '') + ':' + a.role));
  const stale = [...clips.loaded].some((k) => !keys.has(k));
  if (stale) {                                    // a role changed or a file was removed: rebuild
    for (const list of Object.values(clips.byRole)) for (const act of list) act.stop();
    clips.byRole = {}; clips.loaded = new Set(); clips.current = null; clips.currentRole = '';
  }
  for (const a of wanted) {
    const key = a.file + '#' + (a.clip || '') + ':' + a.role;
    if (clips.loaded.has(key)) continue;
    clips.loaded.add(key);
    try {
      const url = 'amadeus-3d://_anim/' + encodeURIComponent(a.file);
      let clip;
      if (/\.vrma$/i.test(a.file)) {
        const gltf = await animLoader.loadAsync(url);
        const anim = gltf.userData.vrmAnimations && gltf.userData.vrmAnimations[0];
        if (!anim) continue;
        clip = createVRMAnimationClip(anim, pet.vrm);
      } else if (/\.uanim\.json$/i.test(a.file)) {
        clip = muscleClip(await loadMuscles(url), pet.vrm, a.file);       // Unity humanoid pose / clip
      } else if (/\.vmd$/i.test(a.file)) {
        clip = bakeVMD(await loadVMD(url), pet.vrm, a.file);               // MMD motion
      } else if (a.clip) {
        clip = retargetPackClip(await loadPack(url), a.clip, pet.vrm);     // multi-clip pack (Unreal-style rig)
      } else {
        // FBX: Mixamo, VRoid (J_Bip) or a generic humanoid. All go through the generic retarget:
        // it carries the fingers and corrects for the source rest pose (hands, A-pose arms).
        clip = retargetPackClip(await loadPack(url), null, pet.vrm);
      }
      if (!clip.keepRoot) stripRootMotion(clip);
      const action = pet.mixer.clipAction(clip);
      action.userData = { role: a.role, name: a.clip || a.file, file: a.file, clip: a.clip || '' };
      (clips.byRole[a.role] = clips.byRole[a.role] || []).push(action);
    } catch (e) { log('clip failed', a.file, a.clip || '', e && e.message); }
  }
  if (pet.state === 'idle') syncIdleClip(true);
}
/** Idle picks its clip by context: talking → "talk", thinking/working → procedural pose. */
function syncIdleClip(force) {
  if (pet.frozen || pet.state !== 'idle' || (pet.gesture && pet.gesture.clip)) return;
  const busy = pet.phase === 'thinking' || pet.phase === 'tool';
  const want = busy || portrait.on ? '' : pet.talking && clips.byRole.talk ? 'talk' : clips.byRole.idle ? 'idle' : '';   // in the bubble: calm procedural stance facing the viewer
  if (!force && want === clips.currentRole) return;
  if (want) playRole(want, { once: false, fade: 0.5 }); else stopClip(0.5);
}
const ONE_SHOT = new Set(['pose', 'wave', 'dance', 'stretch', 'happy', 'sad', 'angry', 'surprised', 'land', 'jump']);
/** Play the clip for a role (crossfade). Returns false when there is none (procedural fallback). */
function playRole(role, { once = ONE_SHOT.has(role), fade = 0.35 } = {}) {
  const list = clips.byRole[role];
  if (!list || !list.length || !pet.mixer) { stopClip(fade); return false; }
  if (clips.currentRole === role && clips.current && clips.current.isRunning()) return true;
  const calm = agentControl() && (role === 'idle' || role === 'talk') ? list.filter((x) => !/look|watch|point|lean|argu/i.test((x.userData && x.userData.name) || '')) : list;
  const action = pick(calm.length ? calm : list);
  action.reset();
  action.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
  action.clampWhenFinished = once;
  action.enabled = true;
  action.setEffectiveWeight(1);
  if (clips.current && clips.current !== action) { action.crossFadeFrom(clips.current, fade, false); }
  else action.fadeIn(fade);
  action.play();
  clips.current = action; clips.currentRole = role;
  return true;
}
function stopClip(fade = 0.35) {
  if (clips.current) { clips.current.fadeOut(fade); clips.current = null; clips.currentRole = ''; }
}
function clipActive() {
  return !!(clips.current && clips.current.isRunning() && clips.current.getEffectiveWeight() > 0.05);
}

// ------------------------------------------------------------------ procedural animation
// Euler angles (rad) on normalized VRM bones; rest = T-pose, model faces +Z.
// Life comes from: eased layers instead of switches, a gait driven by distance (no
// foot sliding), per-bone follow speeds (overlapping action), smooth noise for
// micro-motion, breathing that reaches the shoulders, and relaxed curled fingers.
const ease = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const easeInOut = (x) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(x, 0, 1));
/** 0→1→0 over a gesture: eased attack and release. */
const envelope = (t, dur, a = 0.45, r = 0.55) => easeInOut(t / a) * easeInOut((dur - t) / r);
/** Smooth pseudo-noise in [-1, 1] (sum of incommensurate sines). */
const noise = (t, seed) => Math.sin(t * 0.731 + seed) * 0.5 + Math.sin(t * 1.317 + seed * 2.13) * 0.3 + Math.sin(t * 2.171 + seed * 3.71) * 0.2;
function add(v, x, y, z) { v = v || [0, 0, 0]; return [v[0] + x, v[1] + y, v[2] + z]; }

// motion state shared by the layers
const mo = { gait: 0, phase: 0, speed: 0, bob: 0, breath: 0, curlL: 0.3, curlR: 0.3, swing: 0, swingV: 0, ik: { left: null, right: null } };
const STANDING = new Set(['idle', 'walk', 'talk', 'think', 'typing', 'react']);

function base(state, t) {
  const p = {};
  const set = (b, x = 0, y = 0, z = 0) => { p[b] = [x, y, z]; };
  const asleep = state === 'sleep' || state === 'sleep_sit';
  // breathing reaches chest, shoulders and arms; slower when asleep or sad
  const br = Math.sin(mo.breathPhase || 0);
  const brUp = (br + 1) * 0.5;
  // relaxed arms with a little life in them
  const armSway = noise(t * 0.6, 4.1) * 0.03;
  set('leftShoulder', 0, 0, brUp * 0.02); set('rightShoulder', 0, 0, -brUp * 0.02);
  set('leftUpperArm', 0.06 + armSway, 0.05, -1.24 - brUp * 0.02); set('rightUpperArm', 0.06 - armSway, -0.05, 1.24 + brUp * 0.02);
  set('leftLowerArm', 0, -0.32 + noise(t * 0.5, 7) * 0.05, 0); set('rightLowerArm', 0, 0.32 + noise(t * 0.5, 9) * 0.05, 0);
  set('leftHand', 0.05, 0, -0.12); set('rightHand', 0.05, 0, 0.12);
  set('spine', br * 0.012, 0, 0); set('chest', br * 0.022, 0, 0); set('upperChest', br * 0.012, 0, 0);
  mo.curlL = mo.curlR = 0.32;
  if (STANDING.has(state)) {
    // slow weight shift from foot to foot + micro sway
    const shift = (Math.sin(t * 0.32) * 0.04 + noise(t * 0.25, 1.3) * 0.015) * (1 - mo.gait);
    set('hips', 0, noise(t * 0.2, 2) * 0.03, shift);
    set('spine', br * 0.012 + noise(t * 0.3, 5) * 0.01, noise(t * 0.27, 6) * 0.02, -shift * 0.8);
    set('neck', noise(t * 0.35, 8) * 0.015, 0, shift * 0.3);
    set('leftUpperLeg', 0, 0, -shift * 0.6); set('rightUpperLeg', 0, 0, -shift * 0.6);
    set('leftLowerLeg', Math.max(0, shift) * 0.9, 0, 0); set('rightLowerLeg', Math.max(0, -shift) * 0.9, 0, 0);
    set('leftFoot', -Math.max(0, shift) * 0.4, 0, shift * 0.5); set('rightFoot', -Math.max(0, -shift) * 0.4, 0, shift * 0.5);
  }
  if (state === 'think') {
    // knuckles under the chin, the other hand holds that elbow, head tilted
    set('neck', 0.05, 0, 0.08); set('head', 0.04, 0.06, 0.1 + Math.sin(t * 0.7) * 0.03);
    set('rightHand', 0.5, 0, 0.2); set('spine', 0.04, 0, 0);
    reachFor('right', { at: ['head', [-0.01, 0.0, 0.1]], pole: [-0.35, -1, 0.5], reach: 0.55, curl: 0.95, w: 1 });
    reachFor('left', { at: ['rightLowerArm', [0, -0.03, 0.035]], pole: [0.6, -1, 0.3], reach: 0.65, curl: 0.45, w: 1 });
  }
  if (state === 'typing') {
    const k = noise(t * 9, 1) * 0.012, k2 = noise(t * 8, 3) * 0.012;
    set('chest', 0.08 + br * 0.02, 0, 0); set('head', 0.14, 0, 0);
    set('leftHand', 0.3, 0, -0.1); set('rightHand', 0.3, 0, 0.1);
    reachFor('left', { at: ['chest', [0.12 + k, -0.2, 0.3 + k2]], pole: [1, -1, -0.4], reach: 0.8, curl: 0.45, w: 1 });
    reachFor('right', { at: ['chest', [-0.12 + k2, -0.2, 0.3 + k]], pole: [-1, -1, -0.4], reach: 0.8, curl: 0.45, w: 1 });
  }
  if (state === 'sit_edge' || state === 'sleep_sit') {
    // legs dangle with a lazy, slightly out-of-phase swing
    const swing = state === 'sit_edge' ? 1 : 0.15;
    const sl = (Math.sin(t * 1.9) * 0.2 + noise(t * 0.7, 2) * 0.06) * swing;
    const sr = (Math.sin(t * 1.9 + 1.1) * 0.2 + noise(t * 0.7, 5) * 0.06) * swing;
    set('leftUpperLeg', -1.5, 0.06, 0.06); set('rightUpperLeg', -1.5, -0.06, -0.06);
    set('leftLowerLeg', 1.4 + sl, 0, 0); set('rightLowerLeg', 1.4 + sr, 0, 0);
    set('leftFoot', 0.25 + sl * 0.4, 0, 0); set('rightFoot', 0.25 + sr * 0.4, 0, 0);
    set('leftUpperArm', 0.38, 0.05, -1.3); set('rightUpperArm', 0.38, -0.05, 1.3);
    set('leftLowerArm', 0, -0.2, 0); set('rightLowerArm', 0, 0.2, 0);
    set('leftHand', -0.35, 0, -0.15); set('rightHand', -0.35, 0, 0.15);
    set('spine', -0.04 + br * 0.012 + noise(t * 0.3, 3) * 0.02, noise(t * 0.22, 4) * 0.04, 0);
    mo.curlL = mo.curlR = 0.18;
    if (state === 'sleep_sit') { set('neck', 0.32, 0, 0.12); set('head', 0.32, 0, 0.16); set('spine', 0.18 + br * 0.008, 0, 0); mo.curlL = mo.curlR = 0.4; }
  }
  if (state === 'sit_floor' || state === 'sit_down' || state === 'stand_up') floorSit(state, p, br);
  if (state === 'sleep') {   // lying on the back in profile (root is yawed + rolled), knees up
    set('leftUpperLeg', -0.95, 0, 0.04); set('rightUpperLeg', -0.7, 0, -0.04);
    set('leftLowerLeg', 1.75, 0, 0); set('rightLowerLeg', 1.35, 0, 0);
    set('leftUpperArm', -0.05, 0, -1.4); set('rightUpperArm', -0.08, 0, 1.38);
    set('leftLowerArm', 0, -0.4, 0); set('rightLowerArm', 0, 0.45, 0);
    set('leftHand', 0, 0, -0.3); set('rightHand', 0, 0, 0.3);
    set('spine', -0.05 + br * 0.03, 0, 0); set('chest', br * 0.03, 0, 0); set('neck', -0.05, -0.3, 0); set('head', 0.05, -0.65, 0);
    mo.curlL = mo.curlR = 0.45;
  }
  if (state === 'held') {
    // dangling: limbs hang and swing behind the motion (pendulum driven by the drag)
    const sw = mo.swing || 0;
    set('leftUpperArm', 0.12, 0, -1.18 + sw * 0.9); set('rightUpperArm', 0.12, 0, 1.18 + sw * 0.9);
    set('leftLowerArm', 0, -0.45 + Math.abs(sw) * 0.3, 0); set('rightLowerArm', 0, 0.45 + Math.abs(sw) * 0.3, 0);
    set('leftHand', 0, 0, -0.25); set('rightHand', 0, 0, 0.25);
    set('leftUpperLeg', -0.12, 0, sw * 0.7 - 0.04); set('rightUpperLeg', -0.05, 0, sw * 0.7 + 0.04);
    const kick = mem.wary > 0.5 || mood.name === 'pout' ? 1 : 0;                       // protesting: kicking legs
    set('leftLowerLeg', 0.35 + Math.sin(t * 2.3) * 0.08 + kick * Math.max(0, Math.sin(t * 9)) * 0.9, 0, 0); set('rightLowerLeg', 0.2 + Math.sin(t * 2.3 + 1) * 0.08 + kick * Math.max(0, Math.sin(t * 9 + 2)) * 0.9, 0, 0);
    set('leftFoot', 0.55, 0, 0); set('rightFoot', 0.5, 0, 0);
    set('spine', 0.04, 0, sw * 0.25); set('chest', 0, 0, sw * 0.15);
    set('neck', 0, 0, -sw * 0.3); set('head', -0.05, 0, -sw * 0.25);
    mo.curlL = mo.curlR = 0.35;
  }
  if (state === 'fall' || state === 'jump') {
    if (state === 'fall') {
      const f = Math.sin(t * 9) * 0.22, sw = mo.swing || 0;
      set('leftUpperArm', -0.3, 0, 0.35 + f + sw * 0.5); set('rightUpperArm', -0.3, 0, -0.35 - f + sw * 0.5);
      set('leftLowerArm', 0, -0.7, 0); set('rightLowerArm', 0, 0.7, 0);
      set('leftUpperLeg', -0.55, 0, 0.06 + sw * 0.4); set('rightUpperLeg', -0.2, 0, -0.06 + sw * 0.4);
      set('leftLowerLeg', 1.05, 0, 0); set('rightLowerLeg', 0.55, 0, 0);
      set('spine', -0.08, 0, sw * 0.2);
      mo.curlL = mo.curlR = 0.15;
    } else {
      // rising: arms swing back, legs tucked; descending: legs reach for the edge
      const rising = pet.vy > 0;
      set('leftUpperArm', rising ? 0.55 : -0.2, 0, rising ? -0.95 : -0.7); set('rightUpperArm', rising ? 0.55 : -0.2, 0, rising ? 0.95 : 0.7);
      set('leftUpperLeg', rising ? -0.9 : -0.35, 0, 0); set('rightUpperLeg', rising ? -0.6 : -0.15, 0, 0);
      set('leftLowerLeg', rising ? 1.3 : 0.5, 0, 0); set('rightLowerLeg', rising ? 1.0 : 0.35, 0, 0);
      set('spine', rising ? 0.15 : -0.05, 0, 0);
    }
  }
  if (state === 'crouch' || state === 'land') {
    set('leftUpperLeg', -0.95, 0, 0.06); set('rightUpperLeg', -0.95, 0, -0.06);
    set('leftLowerLeg', 1.65, 0, 0); set('rightLowerLeg', 1.65, 0, 0);
    set('leftFoot', -0.62, 0, 0); set('rightFoot', -0.62, 0, 0);
    set('spine', 0.35, 0, 0); set('chest', 0.1, 0, 0);
    set('leftUpperArm', -0.55, 0, -1.05); set('rightUpperArm', -0.55, 0, 1.05);
    set('leftLowerArm', 0, -0.5, 0); set('rightLowerArm', 0, 0.5, 0);
  }
  // gait on top of the standing pose, scaled by mo.gait (0..1) so starts and stops blend
  const g = STANDING.has(state) ? mo.gait : 0;
  mo.bob = 0;
  if (g > 0.001) {
    const ph = mo.phase * Math.PI * 2;
    const s = Math.sin(ph), c = Math.cos(ph);
    const kneeL = Math.max(0, Math.sin(ph + 0.9)), kneeR = Math.max(0, Math.sin(ph + Math.PI + 0.9));
    p.leftUpperLeg = add(p.leftUpperLeg, -0.42 * s * g, 0, 0); p.rightUpperLeg = add(p.rightUpperLeg, 0.42 * s * g, 0, 0);
    p.leftLowerLeg = add(p.leftLowerLeg, (0.12 + 0.85 * kneeL) * g, 0, 0); p.rightLowerLeg = add(p.rightLowerLeg, (0.12 + 0.85 * kneeR) * g, 0, 0);
    p.leftFoot = add(p.leftFoot, 0.25 * Math.sin(ph - 0.6) * g, 0, 0); p.rightFoot = add(p.rightFoot, -0.25 * Math.sin(ph - 0.6) * g, 0, 0);
    const as = Math.sin(ph - 0.25);
    p.leftUpperArm = add(p.leftUpperArm, 0.32 * as * g, 0, 0.04 * g); p.rightUpperArm = add(p.rightUpperArm, -0.32 * as * g, 0, -0.04 * g);
    p.leftLowerArm = add(p.leftLowerArm, 0, -0.22 * Math.max(0, -as) * g, 0); p.rightLowerArm = add(p.rightLowerArm, 0, 0.22 * Math.max(0, as) * g, 0);
    p.hips = add(p.hips, 0, 0.1 * s * g, 0.035 * c * g);
    p.spine = add(p.spine, 0.06 * g, -0.08 * s * g, 0);
    p.chest = add(p.chest, 0, -0.04 * s * g, 0);
    p.head = add(p.head, -0.03 * g, 0.05 * s * g, 0);
    mo.bob = (Math.abs(c) - 0.6) * 0.022 * g;         // up on the passing pose, down on contact
  }
  return p;
}
/** How much lower the hips sit in poses that bend the legs (fraction of hips height). */
function crouchDrop(state) { return state === 'crouch' || state === 'land' ? 0.32 : 0; }

// one-shot gestures (procedural fallback when no clip). k = eased envelope 0..1, t = seconds.
const GESTURES = {
  wave: { dur: 2.6, a: 0.5, r: 0.6, ik(k, t) { const w = Math.sin(t * 7.5) * ease((t - 0.35) / 0.3); reachFor('right', { at: ['head', [-0.27 + w * 0.05, 0.1, 0.06]], pole: [-0.4, -1, -0.3], reach: 1, curl: 0.06, w: k }); }, f(p, k, t) {
    const w = Math.sin(t * 7.5) * ease((t - 0.35) / 0.3);
    p.rightUpperArm = mix(p.rightUpperArm, [-0.25, -0.15, -0.35], k); p.rightLowerArm = mix(p.rightLowerArm, [0, 0.55 + w * 0.42, 0], k);
    p.rightHand = mix(p.rightHand, [0, 0, w * 0.25], k); p.head = add(p.head, 0, -0.06 * k, 0.1 * k); p.spine = add(p.spine, 0, 0, -0.04 * k);
    mo.curlR = 0.08 * k + mo.curlR * (1 - k);
  }, face: (k) => ({ happy: 0.7 * k }) },
  nod: { dur: 1.5, a: 0.15, r: 0.3, head(p, k, t) { p.head = add(p.head, Math.max(0, Math.sin(t * 7)) * 0.22 * Math.exp(-t * 0.9) * k, 0, 0); }, f(p, k, t) { p.head = add(p.head, Math.max(0, Math.sin(t * 7)) * 0.22 * Math.exp(-t * 0.9) * k, 0, 0); p.neck = add(p.neck, Math.max(0, Math.sin(t * 7 - 0.3)) * 0.08 * k, 0, 0); } },
  shake: { dur: 1.5, a: 0.15, r: 0.3, head(p, k, t) { p.head = add(p.head, 0, Math.sin(t * 9) * 0.3 * Math.exp(-t * 1.2) * k, 0); }, f(p, k, t) { p.head = add(p.head, 0, Math.sin(t * 9) * 0.3 * Math.exp(-t * 1.2) * k, 0); p.neck = add(p.neck, 0, Math.sin(t * 9 - 0.4) * 0.08 * k, 0); } },
  stretch: { dur: 3.4, a: 1.0, r: 0.9, ik(k, t) { const h = Math.sin(t * 2) * 0.01; reachFor('left', { at: ['head', [0.03, 0.42 + h, -0.01]], pole: [1, 0.2, -0.4], reach: 0.75, curl: 0.45, w: k }); reachFor('right', { at: ['head', [-0.03, 0.42 + h, -0.01]], pole: [-1, 0.2, -0.4], reach: 0.75, curl: 0.45, w: k }); }, f(p, k, t) {
    const hold = Math.sin(t * 2) * 0.05;
    p.leftUpperArm = mix(p.leftUpperArm, [-0.15, 0, 1.05 + hold], k); p.rightUpperArm = mix(p.rightUpperArm, [-0.15, 0, -1.05 - hold], k);
    p.leftLowerArm = mix(p.leftLowerArm, [0, -0.5, 0], k); p.rightLowerArm = mix(p.rightLowerArm, [0, 0.5, 0], k);
    p.spine = add(p.spine, -0.18 * k, 0, 0); p.chest = add(p.chest, -0.1 * k, 0, 0); p.head = add(p.head, -0.25 * k, 0, 0);
    p.leftFoot = add(p.leftFoot, 0.3 * k, 0, 0); p.rightFoot = add(p.rightFoot, 0.3 * k, 0, 0);
  }, face: (k) => ({ relaxed: 0.6 * k, blink: 0.75 * k }) },
  yawn: { dur: 3.2, a: 0.8, r: 0.9, ik(k, t) { reachFor('right', { at: ['head', [0.0, 0.045, 0.115]], pole: [-0.6, -1, 0.3], reach: 0.7, curl: 0.3, w: k }); }, f(p, k) {
    p.rightUpperArm = mix(p.rightUpperArm, [-0.95, 0.2, 1.0], k); p.rightLowerArm = mix(p.rightLowerArm, [0, 2.1, 0.1], k); p.rightHand = mix(p.rightHand, [0.3, 0, 0.2], k);
    p.head = add(p.head, -0.22 * k, 0, 0.05 * k); p.chest = add(p.chest, -0.05 * k, 0, 0);
  }, face: (k) => ({ aa: 0.75 * k, blink: 0.65 * k, relaxed: 0.3 * k }) },
  dance: { dur: 6.5, a: 0.6, r: 0.8, f(p, k, t) {
    const beat = t * Math.PI * 2 * 1.05;           // ~126 bpm groove
    const s = Math.sin(beat), b = Math.abs(Math.sin(beat));
    p.hips = add(p.hips, 0, s * 0.22 * k, Math.sin(beat * 2) * 0.05 * k);
    p.spine = add(p.spine, 0, -s * 0.1 * k, s * 0.06 * k);
    p.leftUpperArm = mix(p.leftUpperArm, [-0.35, 0, -0.55 + s * 0.45], k); p.rightUpperArm = mix(p.rightUpperArm, [-0.35, 0, 0.55 + s * 0.45], k);
    p.leftLowerArm = mix(p.leftLowerArm, [0, -1.25 + b * 0.3, 0], k); p.rightLowerArm = mix(p.rightLowerArm, [0, 1.25 - b * 0.3, 0], k);
    p.head = add(p.head, b * 0.06 * k, 0, s * 0.14 * k);
    p.leftLowerLeg = add(p.leftLowerLeg, Math.max(0, s) * 0.5 * k, 0, 0); p.rightLowerLeg = add(p.rightLowerLeg, Math.max(0, -s) * 0.5 * k, 0, 0);
    p.leftUpperLeg = add(p.leftUpperLeg, -Math.max(0, s) * 0.25 * k, 0, 0); p.rightUpperLeg = add(p.rightUpperLeg, -Math.max(0, -s) * 0.25 * k, 0, 0);
    mo.bob += (b - 0.5) * 0.03 * k;
  }, face: (k) => ({ happy: 0.8 * k }) },
  bow: { dur: 2.4, a: 0.7, r: 0.8, ik(k, t) { reachFor('left', { at: ['hips', [0.04, -0.12, 0.12]], pole: [1, -1, 0.3], reach: 0.8, curl: 0.3, w: k * 0.9 }); reachFor('right', { at: ['hips', [-0.04, -0.12, 0.12]], pole: [-1, -1, 0.3], reach: 0.8, curl: 0.3, w: k * 0.9 }); }, f(p, k) { p.spine = add(p.spine, 0.42 * k, 0, 0); p.chest = add(p.chest, 0.18 * k, 0, 0); p.head = add(p.head, 0.2 * k, 0, 0); p.leftUpperArm = mix(p.leftUpperArm, [-0.2, 0.3, -1.3], k); p.rightUpperArm = mix(p.rightUpperArm, [-0.2, -0.3, 1.3], k); } , face: (k) => ({ relaxed: 0.5 * k }) },
  look_around: { dur: 3.8, a: 0.6, r: 0.8, f(p, k, t) { const y = Math.sin(t * 1.5) * 0.55; p.head = add(p.head, 0.04 * k, y * k, 0); p.neck = add(p.neck, 0, y * 0.25 * k, 0); p.spine = add(p.spine, 0, y * 0.1 * k, 0); } },
  shrug: { dur: 2.0, a: 0.4, r: 0.6, ik(k, t) { reachFor('left', { at: ['hips', [0.34, 0.1, 0.18]], pole: [1, -0.3, -0.7], reach: 0.9, curl: 0.08, w: k }); reachFor('right', { at: ['hips', [-0.34, 0.1, 0.18]], pole: [-1, -0.3, -0.7], reach: 0.9, curl: 0.08, w: k }); }, f(p, k) {
    p.leftShoulder = add(p.leftShoulder, 0, 0, 0.22 * k); p.rightShoulder = add(p.rightShoulder, 0, 0, -0.22 * k);
    p.leftUpperArm = mix(p.leftUpperArm, [-0.25, 0.15, -1.05], k); p.rightUpperArm = mix(p.rightUpperArm, [-0.25, -0.15, 1.05], k);
    p.leftLowerArm = mix(p.leftLowerArm, [-1.2, -1.1, 0], k); p.rightLowerArm = mix(p.rightLowerArm, [-1.2, 1.1, 0], k);
    p.head = add(p.head, 0, 0, 0.13 * k);
    mo.curlL = mo.curlR = 0.1;
  }, face: (k) => ({ relaxed: 0.4 * k }) },
  clap: { dur: 2.4, a: 0.4, r: 0.5, ik(k, t) { const c = Math.pow((Math.sin(t * 13) + 1) * 0.5, 2); const x = 0.015 + 0.08 * c; reachFor('left', { at: ['chest', [x, 0.08, 0.32]], pole: [1, -1, -0.2], reach: 1, curl: 0.05, w: k }); reachFor('right', { at: ['chest', [-x, 0.08, 0.32]], pole: [-1, -1, -0.2], reach: 1, curl: 0.05, w: k }); }, f(p, k, t) {
    const c = Math.pow((Math.sin(t * 13) + 1) * 0.5, 2);
    p.leftUpperArm = mix(p.leftUpperArm, [-0.95, 0.25 + 0.2 * c, -1.0], k); p.rightUpperArm = mix(p.rightUpperArm, [-0.95, -0.25 - 0.2 * c, 1.0], k);
    p.leftLowerArm = mix(p.leftLowerArm, [0, -1.35, 0], k); p.rightLowerArm = mix(p.rightLowerArm, [0, 1.35, 0], k);
    mo.curlL = mo.curlR = 0.1;
  }, face: (k) => ({ happy: 0.9 * k }) },
  thumbs_up: { dur: 2.2, a: 0.5, r: 0.6, ik(k, t) { reachFor('right', { at: ['chest', [-0.14, 0.02, 0.33]], pole: [-1, -1, -0.2], reach: 0.6, curl: 1.1, w: k }); }, f(p, k) { p.rightUpperArm = mix(p.rightUpperArm, [-0.9, 0, 1.0], k); p.rightLowerArm = mix(p.rightLowerArm, [0, 1.2, 0], k); p.rightHand = mix(p.rightHand, [0, 0, -0.6], k); mo.curlR = 1.1 * k + mo.curlR * (1 - k); mo.thumbUp = k; }, face: (k) => ({ happy: 0.6 * k }) },
  point: { dur: 2.2, a: 0.5, r: 0.6, ik(k, t) { reachFor('right', { at: ['chest', [-0.28, 0.12, 0.68]], pole: [-0.6, -1, 0], reach: 1, curl: 1.0, w: k }); }, f(p, k) { p.rightUpperArm = mix(p.rightUpperArm, [-1.1, 0, 0.35], k); p.rightLowerArm = mix(p.rightLowerArm, [0, 0.12, 0], k); mo.curlR = 1.0 * k + mo.curlR * (1 - k); mo.pointR = k; } },
  salute: { dur: 2.9, a: 0.5, r: 0.6, ik(k, t) { reachFor('right', { at: ['head', [-0.075, 0.13, 0.095]], pole: [-1, -0.25, 0.35], reach: 1, curl: 0.02, w: k }); }, f(p, k) { p.rightUpperArm = mix(p.rightUpperArm, [-0.4, 0, -0.3], k); p.rightLowerArm = mix(p.rightLowerArm, [0, 2.2, 0], k); mo.curlR = 0.05; } },
  shift: { dur: 3.2, a: 0.8, r: 0.9, f(p, k, t) {
    // lean the weight onto one leg, the other knee relaxes forward
    p.hips = add(p.hips, 0, 0.04 * k, 0.09 * k); p.spine = add(p.spine, 0, 0, -0.08 * k); p.chest = add(p.chest, 0, 0, -0.03 * k);
    p.leftUpperLeg = add(p.leftUpperLeg, -0.12 * k, 0.1 * k, -0.08 * k); p.leftLowerLeg = add(p.leftLowerLeg, 0.38 * k, 0, 0); p.leftFoot = add(p.leftFoot, -0.15 * k, 0, 0.06 * k);
    p.rightUpperLeg = add(p.rightUpperLeg, 0, 0, -0.06 * k); p.head = add(p.head, 0, 0, 0.06 * k);
  } },
  tap_foot: { dur: 2.6, a: 0.4, r: 0.5, f(p, k, t) {
    const tap = Math.max(0, Math.sin(t * 9)) * k;
    p.rightUpperLeg = add(p.rightUpperLeg, -0.12 * k, -0.08 * k, 0); p.rightLowerLeg = add(p.rightLowerLeg, 0.18 * k, 0, 0); p.rightFoot = add(p.rightFoot, -0.35 * tap, 0, 0);
    p.hips = add(p.hips, 0, 0, -0.03 * k);
  } },
  rock: { dur: 3.4, a: 0.6, r: 0.8, f(p, k, t) {
    const r = Math.sin(t * 3.2) * k;
    p.leftFoot = add(p.leftFoot, 0.18 * Math.max(0, r), 0, 0); p.rightFoot = add(p.rightFoot, 0.18 * Math.max(0, r), 0, 0);
    p.leftUpperLeg = add(p.leftUpperLeg, -0.05 * r, 0, 0); p.rightUpperLeg = add(p.rightUpperLeg, -0.05 * r, 0, 0);
    p.spine = add(p.spine, 0.03 * r, 0, 0);
    mo.bob += Math.max(0, r) * 0.012;
  }, ik(k) {
    reachFor('left', { at: ['hips', [0.05, -0.02, -0.17]], pole: [1, -1, 0.4], reach: 0.75, curl: 0.4, w: k * 0.85 });
    reachFor('right', { at: ['hips', [-0.05, -0.02, -0.17]], pole: [-1, -1, 0.4], reach: 0.75, curl: 0.4, w: k * 0.85 });
  } },
  swat: { dur: 1.1, a: 0.12, r: 0.45, ik(k, t) { const s = ease(t / 0.35) - ease((t - 0.45) / 0.3); reachFor('right', { at: ['chest', [-0.12 - s * 0.22, 0.06 + s * 0.06, 0.18 + s * 0.12]], pole: [-1, -0.4, 0.2], reach: 1, curl: 0.15, w: k, palm: [-0.3, 0, 1] }); }, f(p, k) { p.spine = add(p.spine, -0.06 * k, -0.12 * k, 0); p.head = add(p.head, 0.05 * k, 0.1 * k, 0); }, face: (k) => ({ angry: 0.9 * k }) },
  giggle: { dur: 2.5, a: 0.25, r: 0.55, ik(k, t) { const s = Math.sin(t * 16) * 0.006; reachFor('right', { at: ['head', [-0.005, 0.035 + s, 0.115]], pole: [-0.4, -1, 0.25], reach: 0.8, curl: 0.55, w: k }); }, f(p, k, t) { const s = Math.sin(t * 16) * 0.025 * k; p.leftShoulder = add(p.leftShoulder, 0, 0, s); p.rightShoulder = add(p.rightShoulder, 0, 0, -s); p.head = add(p.head, 0.06 * k, 0, 0.1 * k); p.rightUpperArm = mix(p.rightUpperArm, [-0.95, 0.2, 1.0], k * 0.8); p.rightLowerArm = mix(p.rightLowerArm, [0, 2.0, 0], k * 0.8); }, face: (k) => ({ happy: 1 * k, blink: 0.55 * k }) },
};
function mix(a, b, k) { a = a || [0, 0, 0]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; }

// emotion body language, driven by the smoothed facial emotion weights (so body and face agree)
// ------------------------------------------------------------------ moods (emotions with a body)
// A mood is more than a face: posture, arms, gaze, eyelids, mouth, a rhythm and a short entrance
// reaction. Only the five VRM face presets (+ blink and mouth shapes) exist on every model, so the
// richer moods are mixes of them. Everything fades in and out with the mood weight k.
// Conventions: p.<bone> = [x, y, z] radians (x: bend forward / nod down, y: turn to the model's
// left, z: tilt); IK targets in metres for a 1.6 m body, +x = model's left (mirrored for the
// right hand by `both`); look = [down, left] in radians for the head and eyes.
const startle = (t, rate = 3.5) => Math.exp(-t * rate) * Math.min(1, t * 12);
const MOODS = {
  dizzy: {
    label: 'Головокружение', face: { relaxed: 0.45, sad: 0.25, surprised: 0.2 }, blink: () => 0.3,
    look: (t) => [Math.sin(t * 2.6) * 0.12, Math.cos(t * 2.6) * 0.25],
    body(p, t, k) {
      const a = t * 2.6, w = Math.exp(-t * 0.25);
      p.head = add(p.head, Math.sin(a) * 0.1 * k * w, 0, Math.cos(a) * 0.14 * k * w);
      p.spine = add(p.spine, Math.sin(a + 0.5) * 0.05 * k * w, 0, Math.cos(a + 0.5) * 0.07 * k * w);
      p.hips = add(p.hips, 0, 0, Math.cos(a + 1) * 0.04 * k * w);
      p.leftUpperArm = add(p.leftUpperArm, 0, 0, 0.35 * k); p.rightUpperArm = add(p.rightUpperArm, 0, 0, -0.35 * k);   // arms out for balance
    },
  },
  happy: {
    label: 'Радость', face: { happy: 1 }, look: () => [-0.06, 0],
    body(p, t, k) {
      p.spine = add(p.spine, -0.05 * k, 0, 0); p.chest = add(p.chest, -0.04 * k, 0, 0);
      p.head = add(p.head, -0.05 * k, 0, Math.sin(t * 2.2) * 0.08 * k);
      p.hips = add(p.hips, 0, Math.sin(t * 2.2) * 0.04 * k, 0);
      mo.bob += Math.max(0, Math.sin(t * 4.4)) * 0.007 * k;
    },
    arms(t, k, both) { both(['head', [0.03, -0.075, 0.12]], [0.8, -1, 0.1], 0.35, 0.45, k * 0.95, [0, 0.95, -0.3], [-0.75, 0.3, -0.6]); },   // chin on the hands
  },
  excited: {
    label: 'Восторг', face: { happy: 1, surprised: 0.25 }, mouth: { aa: 0.45 }, look: () => [-0.1, 0],
    body(p, t, k) {
      const b = Math.abs(Math.sin(t * 6.2));
      mo.bob += b * 0.012 * k;
      p.spine = add(p.spine, -0.06 * k, 0, 0); p.chest = add(p.chest, -0.05 * k, 0, 0);
      p.head = add(p.head, -0.08 * k, 0, Math.sin(t * 3.1) * 0.07 * k);
      p.hips = add(p.hips, 0, Math.sin(t * 3.1) * 0.05 * k, 0);
    },
    arms(t, k, both) { const pump = Math.sin(t * 6.2) * 0.025; both(['chest', [0.1, 0.05 + pump, 0.17]], [1, -1, 0], 0.3, 1.2, k, [-1, 0, 0.1]); },   // fists pumping
  },
  love: {
    label: 'Нежность', face: { happy: 0.75, relaxed: 0.45 }, blink: (t) => 0.15 + Math.max(0, Math.sin(t * 0.9)) * 0.35, look: () => [0.02, 0],
    body(p, t, k) {
      p.head = add(p.head, 0.03 * k, 0, 0.16 * k + Math.sin(t * 0.9) * 0.03 * k);
      p.hips = add(p.hips, 0, Math.sin(t * 0.9) * 0.05 * k, Math.sin(t * 0.9) * 0.015 * k);
      p.spine = add(p.spine, 0.02 * k, 0, -0.03 * k);
    },
    arms(t, k, both) { both(['chest', [0.03, 0.07, 0.15]], [1, -1, -0.2], 0.5, 0.5, k * 0.95, [-0.35, 0, -0.95], [-0.5, 0.85, 0]); },   // hands together at the heart
  },
  proud: {
    label: 'Гордость', face: { happy: 0.55, relaxed: 0.25 }, look: () => [-0.14, 0.05],
    body(p, t, k) {
      p.spine = add(p.spine, -0.08 * k, 0, 0); p.chest = add(p.chest, -0.06 * k, 0, 0);
      p.head = add(p.head, -0.12 * k, 0.12 * k, 0.04 * k);
      p.leftUpperLeg = add(p.leftUpperLeg, 0, 0, 0.05 * k); p.rightUpperLeg = add(p.rightUpperLeg, 0, 0, -0.05 * k);
      p.hips = add(p.hips, 0, Math.sin(t * 0.7) * 0.03 * k, 0);
    },
    arms(t, k, both) { both(['hips', [0.16, 0.07, 0.0]], [1, 0.1, -0.9], 0.55, 0.35, k, [-0.9, 0, -0.35]); },   // open hands on the hips
  },
  relaxed: {
    label: 'Спокойствие', face: { relaxed: 0.85 }, blink: () => 0.2, look: () => [0.02, 0],
    body(p, t, k) {
      p.head = add(p.head, 0.02 * k, 0, 0.07 * k + Math.sin(t * 0.6) * 0.03 * k);
      p.spine = add(p.spine, -0.02 * k, 0, 0.03 * k);
      p.hips = add(p.hips, 0, Math.sin(t * 0.6) * 0.05 * k, Math.sin(t * 0.6) * 0.012 * k);
    },
  },
  thinking: {
    label: 'Задумчивость', face: { relaxed: 0.25 }, mouth: { ou: 0.12 }, look: (t) => [-0.22, -0.3 + Math.sin(t * 0.5) * 0.08],
    body(p, t, k) {
      p.head = add(p.head, -0.06 * k, -0.12 * k, -0.12 * k);
      p.hips = add(p.hips, 0, Math.sin(t * 0.5) * 0.03 * k, 0);
    },
    arms(t, k, both, busy) {
      if (!busy('right')) reachFor('right', { at: ['head', [-0.005, -0.075, 0.1]], pole: [-0.5, -1, 0.3], reach: 0.8, curl: 0.75, w: k });                                   // fingers at the chin
      if (!busy('left')) reachFor('left', { at: ['chest', [-0.06, -0.19, 0.13]], pole: [1, -0.6, 0.3], reach: 0.6, curl: 0.45, w: k * 0.9, palm: [0, 1, 0] });                 // supporting the elbow
    },
  },
  surprised: {
    label: 'Удивление', face: { surprised: 1 }, mouth: { oh: 0.45 }, look: () => [-0.04, 0], intro: 1,
    body(p, t, k) {
      const s = startle(t);
      p.spine = add(p.spine, -(0.08 + 0.14 * s) * k, 0, 0); p.head = add(p.head, -(0.06 + 0.1 * s) * k, 0, 0);
      p.leftShoulder = add(p.leftShoulder, 0, 0, 0.1 * s * k); p.rightShoulder = add(p.rightShoulder, 0, 0, -0.1 * s * k);
      mo.bob += s * 0.01 * k;
    },
    arms(t, k, both) { both(['chest', [0.06, 0.04, 0.14]], [1, -1, 0], 0.9, 0.12, k * 0.9, [0, 0, -1], [-0.45, 0.89, 0]); },   // palms flat on the chest
  },
  scared: {
    label: 'Испуг', face: { surprised: 0.65, sad: 0.55 }, mouth: { oh: 0.25 }, look: (t) => [0.02, noise(t * 1.5, 7) * 0.35], intro: 1,
    body(p, t, k) {
      const s = startle(t, 3), tr = noise(t * 22, 5) * 0.018 * k;
      p.spine = add(p.spine, -(0.05 + 0.12 * s) * k, 0, 0); p.chest = add(p.chest, 0.04 * k, 0, 0);
      p.leftShoulder = add(p.leftShoulder, 0, -0.06 * k, 0.13 * k); p.rightShoulder = add(p.rightShoulder, 0, 0.06 * k, -0.13 * k);   // shrinking in
      p.head = add(p.head, 0.08 * k + tr, 0, tr);
      p.neck = add(p.neck, 0.05 * k, 0, 0);
    },
    arms(t, k, both) { both(['head', [0.035, -0.06, 0.12]], [1, -1, 0.1], 0.55, 0.5, k, [-0.25, 0, -0.95]); },   // hands up to the mouth
  },
  shy: {
    label: 'Смущение', face: { happy: 0.45, relaxed: 0.35 }, mouth: { ou: 0.15 }, blink: () => 0.12,
    look: (t) => (Math.sin(t * 0.85) > 0.75 ? [0.05, 0.08] : [0.28, 0.42]),                   // looks away, now and then a quick glance
    body(p, t, k) {
      p.spine = add(p.spine, 0.06 * k, 0, 0);
      p.leftShoulder = add(p.leftShoulder, 0, -0.08 * k, 0.07 * k); p.rightShoulder = add(p.rightShoulder, 0, 0.08 * k, -0.07 * k);
      p.head = add(p.head, 0.12 * k, 0, 0.12 * k);
      p.hips = add(p.hips, 0, Math.sin(t * 1.3) * 0.06 * k, 0);
      p.leftUpperLeg = add(p.leftUpperLeg, 0, 0, -0.04 * k); p.rightUpperLeg = add(p.rightUpperLeg, 0, 0, 0.04 * k);   // knees in
    },
    arms(t, k, both) { both(['hips', [0.03, -0.04, 0.17]], [0.7, -1, 0.3], 0.75, 0.3 + Math.sin(t * 5) * 0.15, k * 0.9, [-1, 0.2, 0.1]); },   // fiddling fingers in front
  },
  sad: {
    label: 'Грусть', face: { sad: 0.9 }, look: () => [0.12, 0],
    body(p, t, k) {
      p.spine = add(p.spine, 0.14 * k, 0, 0); p.chest = add(p.chest, 0.08 * k, 0, 0);
      p.neck = add(p.neck, 0.06 * k, 0, 0); p.head = add(p.head, 0.1 * k, 0, 0.06 * k);
      p.leftShoulder = add(p.leftShoulder, 0, -0.12 * k, -0.06 * k); p.rightShoulder = add(p.rightShoulder, 0, 0.12 * k, 0.06 * k);
      p.hips = add(p.hips, 0, 0, Math.sin(t * 0.8) * 0.02 * k);
    },
    arms(t, k, both) { both(['hips', [0.035, -0.06, 0.17]], [0.7, -1, 0.3], 0.8, 0.5, k * 0.85, [-1, 0.25, 0]); },   // hands clasped low
  },
  pout: {
    label: 'Обида', face: { angry: 0.45, sad: 0.3 }, mouth: { ou: 0.45 }, look: (t) => (Math.sin(t * 0.7) > 0.85 ? [-0.05, 0.15] : [-0.08, 0.6]),
    body(p, t, k) {
      p.head = add(p.head, -0.1 * k, 0.35 * k, 0.06 * k);
      p.chest = add(p.chest, 0, 0.1 * k, 0);
      p.hips = add(p.hips, 0, -0.08 * k, 0);
    },
    arms(t, k, both, busy) {                                                                    // arms crossed
      if (!busy('left')) reachFor('left', { at: ['chest', [-0.085, -0.04, 0.13]], pole: [1, -0.2, 0.4], reach: 0.55, curl: 0.5, w: k, palm: [-0.2, 0, -1] });
      if (!busy('right')) reachFor('right', { at: ['chest', [0.095, -0.08, 0.12]], pole: [-1, -0.2, 0.4], reach: 0.55, curl: 0.5, w: k, palm: [0.2, 0, -1] });
    },
  },
  angry: {
    label: 'Злость', face: { angry: 0.95 }, look: () => [0.08, 0],
    body(p, t, k) {
      const tr = noise(t * 18, 3) * 0.012 * k;
      p.spine = add(p.spine, 0.06 * k, 0, 0); p.chest = add(p.chest, -0.04 * k, 0, 0);
      p.head = add(p.head, 0.1 * k + tr, 0, 0);
      p.leftUpperLeg = add(p.leftUpperLeg, 0, 0, 0.06 * k); p.rightUpperLeg = add(p.rightUpperLeg, 0, 0, -0.06 * k);   // wide stance
    },
    arms(t, k, both) { both(['hips', [0.17, 0.06, -0.02]], [1, 0.1, -0.9], 0.5, 1.15, k, [-0.35, -0.25, -0.9]); },   // fists on the hips
  },
  sleepy: {
    label: 'Сонливость', face: { relaxed: 0.6 },
    blink: (t) => 0.5 + 0.45 * sleepyDroop(t),
    look: () => [0.05, 0],
    body(p, t, k) {
      const d = sleepyDroop(t);
      p.head = add(p.head, 0.2 * d * k, 0, 0.1 * d * k); p.neck = add(p.neck, 0.06 * d * k, 0, 0);
      p.spine = add(p.spine, 0.08 * k, 0, 0);
      p.leftShoulder = add(p.leftShoulder, 0, 0, -0.05 * k); p.rightShoulder = add(p.rightShoulder, 0, 0, 0.05 * k);
      p.hips = add(p.hips, 0, 0, Math.sin(t * 0.5) * 0.02 * k);
    },
  },
};
/** Sleepy head: slowly droops for ~4 s, then jerks back up. */
function sleepyDroop(t) { const d = (t % 4.6) / 4.6; return d < 0.86 ? ease(d / 0.86) : 1 - ease((d - 0.86) / 0.14); }
const PRESETS = ['happy', 'angry', 'sad', 'relaxed', 'surprised'];
const mood = { name: '', k: 0, t0: 0 };
function setMood(name, seconds = 7, w = 1) {
  if (!MOODS[name]) return false;
  pet.mood = { name, until: performance.now() + seconds * 1000, w: clamp(w, 0, 1) };
  if (mood.name === name) return true;                    // same mood: just extend it
  if (mood.k < 0.05) { mood.name = name; mood.t0 = clock.t; }
  return true;
}
/** Weight of the current mood: eases in, out, and crossfades through zero to a new one. */
function moodUpdate(dt) {
  const active = pet.mood && performance.now() < pet.mood.until;
  let want = active ? pet.mood.w : 0;
  if (active && pet.mood.name !== mood.name) {
    if (mood.k < 0.05) { mood.name = pet.mood.name; mood.t0 = clock.t; } else want = 0;
  }
  if (pet.sleeping) want = 0;
  mood.k += (want - mood.k) * damp(want > mood.k ? 5 : 2.6, dt);
  if (!active && mood.k < 0.01) { mood.k = 0; mood.name = ''; pet.mood = null; }
}
const moodDef = () => (mood.name && mood.k > 0.005 ? MOODS[mood.name] : null);
const moodT = () => clock.t - mood.t0;
function moodBody(p) { const m = moodDef(); if (m && m.body) m.body(p, moodT(), mood.k); }
function moodArms() {
  const m = moodDef();
  if (!m || !m.arms || !STANDING.has(pet.state) || mo.gait > 0.3 || pet.phase !== 'idle') return;
  const busy = (side) => mo.ik[side] && mo.ik[side].w > 0.05;
  const mir = (v) => v && [-v[0], v[1], v[2]];
  const both = (at, pole, reach, curl, w, palm, fingers) => {
    if (w < 0.02) return;
    if (!busy('left')) reachFor('left', { at: [at[0], [at[1][0], at[1][1], at[1][2]]], pole: [pole[0], pole[1], pole[2]], reach, curl, w, palm, fingers });
    if (!busy('right')) reachFor('right', { at: [at[0], [-at[1][0], at[1][1], at[1][2]]], pole: [-pole[0], pole[1], pole[2]], reach, curl, w, palm: mir(palm), fingers: mir(fingers) });
  };
  m.arms(moodT(), mood.k, both, busy);
}

// fingers: relaxed curl that follows the mood/pose (palms face down in the T-pose)
const FINGERS = ['Index', 'Middle', 'Ring', 'Little'];
const SEGMENTS = ['Proximal', 'Intermediate', 'Distal'];
function fingers(p) {
  for (const side of ['left', 'right']) {
    const curl = side === 'left' ? mo.curlL : mo.curlR;
    const sign = side === 'left' ? -1 : 1;
    FINGERS.forEach((f, i) => {
      const spread = (i - 1.5) * 0.05 * (1.2 - Math.min(1, curl));
      const c = f === 'Index' && side === 'right' && mo.pointR ? curl * (1 - mo.pointR) : curl * (0.9 + i * 0.08);
      SEGMENTS.forEach((s, j) => {
        p[side + f + s] = [0, j === 0 ? sign * spread : 0, sign * c * (j === 0 ? 0.8 : j === 1 ? 1.1 : 0.8)];
      });
    });
    const th = side === 'right' && mo.thumbUp ? 0.1 : Math.min(0.9, curl);
    p[side + 'ThumbProximal'] = [0, -sign * 0.25 * th, sign * 0.15 * th];
    p[side + 'ThumbDistal'] = [0, -sign * 0.35 * th, 0];
  }
  mo.pointR = 0; mo.thumbUp = 0;
}

const poseCur = new Map();     // bone -> Quaternion (smoothed)
const layerClip = new Map(), layerOut = new Map();   // head/neck: clip value and what we wrote on top of it
const tmpE = new THREE.Euler(), tmpQ = new THREE.Quaternion();
const BODY = ['hips', 'spine', 'chest', 'upperChest', 'neck', 'head', 'leftShoulder', 'rightShoulder', 'leftUpperArm', 'rightUpperArm', 'leftLowerArm', 'rightLowerArm', 'leftHand', 'rightHand', 'leftUpperLeg', 'rightUpperLeg', 'leftLowerLeg', 'rightLowerLeg', 'leftFoot', 'rightFoot'];
const FINGER_BONES = [];
for (const side of ['left', 'right']) {
  for (const f of FINGERS) for (const s of SEGMENTS) FINGER_BONES.push(side + f + s);
  FINGER_BONES.push(side + 'ThumbProximal', side + 'ThumbDistal');
}
const BONES = BODY.concat(FINGER_BONES);
// follow speed per bone: torso and head trail the limbs a little (overlapping action)
const RATE = { hips: 7, spine: 6, chest: 5.5, upperChest: 5.5, neck: 5, head: 4.2, leftShoulder: 6, rightShoulder: 6, leftUpperArm: 7.5, rightUpperArm: 7.5, leftLowerArm: 6.5, rightLowerArm: 6.5, leftHand: 5.5, rightHand: 5.5, leftUpperLeg: 11, rightUpperLeg: 11, leftLowerLeg: 11, rightLowerLeg: 11, leftFoot: 11, rightFoot: 11 };



// ------------------------------------------------------------------ floor sitting: variants + transitions
// Several ways to sit on the floor, each a mix of FK (spine, head, arms) and leg IK (a foot target
// and a knee direction, relative to the hips; metres for a 1.6 m body, +x = model's left). Sitting
// down passes through a crouch, standing up too; the body is lowered onto whatever touches the
// floor first (seat, knees or feet), so every variant and every in-between frame is grounded.
const SIT_VARIANTS = {
  knees: {                                                       // knees up, hands resting on them
    fk: { leftUpperLeg: [-1.5, 0.12, 0.12], rightUpperLeg: [-1.5, -0.12, -0.12], leftLowerLeg: [0.45, 0, 0], rightLowerLeg: [0.5, 0, 0],
      leftUpperArm: [-0.4, 0, -1.25], rightUpperArm: [-0.4, 0, 1.25], leftLowerArm: [0, -0.6, 0], rightLowerArm: [0, 0.6, 0], spine: [0.12, 0, 0] },
  },
  cross: {                                                       // cross-legged, hands on the knees
    fk: { spine: [0.08, 0, 0], head: [0.04, 0, 0.05], leftFoot: [0.3, 0, 0.4], rightFoot: [0.3, 0, -0.4] },
    legs: { left: { at: [-0.1, -0.06, 0.22], pole: [1, 0.6, 0.5] }, right: { at: [0.1, -0.06, 0.16], pole: [-1, 0.6, 0.5] } },
    arms: { left: { at: ['hips', [0.2, 0.02, 0.2]], pole: [1, -0.4, 0], reach: 0.6, curl: 0.4, palm: [0, -1, 0] }, right: { at: ['hips', [-0.2, 0.02, 0.2]], pole: [-1, -0.4, 0], reach: 0.6, curl: 0.4, palm: [0, -1, 0] } },
  },
  hug: {                                                         // hugging the knees, chin on them
    fk: { spine: [0.32, 0, 0], chest: [0.12, 0, 0], neck: [0.03, 0, 0], head: [-0.06, 0, 0.12], leftFoot: [-0.3, 0, 0], rightFoot: [-0.3, 0, 0] },
    legs: { left: { at: [0.07, -0.07, 0.2], pole: [0.15, 1, 0.7] }, right: { at: [-0.07, -0.07, 0.2], pole: [-0.15, 1, 0.7] } },
    arms: { left: { at: ['rightLowerLeg', [0.04, -0.06, 0.07]], pole: [1, -0.3, 0.3], reach: 0.7, curl: 0.6, palm: [-1, 0, -0.3] }, right: { at: ['leftLowerLeg', [-0.04, -0.1, 0.07]], pole: [-1, -0.3, 0.3], reach: 0.7, curl: 0.6, palm: [1, 0, -0.3] } },
  },
  side: {                                                        // legs folded to one side, leaning on a hand
    fk: { spine: [0.04, 0.1, -0.12], head: [0, -0.1, 0.12], hips: [0, 0.25, 0], leftFoot: [0.4, 0, 0], rightFoot: [0.4, 0, 0] },
    legs: { left: { at: [-0.2, -0.08, 0.1], pole: [0.2, 0.3, 1] }, right: { at: [-0.3, -0.08, -0.05], pole: [-0.1, 0.3, 1] } },
    arms: { left: { at: ['hips', [0.24, -0.09, 0.02]], pole: [1, 0.2, -0.5], reach: 0.2, curl: 0.15, palm: [0, -1, 0] }, right: { at: ['hips', [-0.08, 0.0, 0.22]], pole: [-1, -0.4, 0.2], reach: 0.6, curl: 0.45, palm: [0, -1, 0] } },
  },
  kneel: {                                                       // seiza: on the knees, hands on the thighs
    fk: { spine: [-0.02, 0, 0], leftFoot: [0.9, 0, 0], rightFoot: [0.9, 0, 0] },
    legs: { left: { at: [0.08, -0.2, -0.04], pole: [0, -0.2, 1] }, right: { at: [-0.08, -0.2, -0.04], pole: [0, -0.2, 1] } },
    arms: { left: { at: ['hips', [0.08, 0.02, 0.22]], pole: [1, -0.6, 0], reach: 0.5, curl: 0.35, palm: [0, -1, 0] }, right: { at: ['hips', [-0.08, 0.02, 0.22]], pole: [-1, -0.6, 0], reach: 0.5, curl: 0.35, palm: [0, -1, 0] } },
  },
};
const CROUCH = { leftUpperLeg: [-1.05, 0, 0.1], rightUpperLeg: [-1.05, 0, -0.1], leftLowerLeg: [1.95, 0, 0], rightLowerLeg: [1.95, 0, 0], leftFoot: [-0.6, 0, 0], rightFoot: [-0.6, 0, 0],
  spine: [0.35, 0, 0], chest: [0.1, 0, 0], head: [-0.22, 0, 0], leftUpperArm: [-0.7, 0, -1.0], rightUpperArm: [-0.7, 0, 1.0], leftLowerArm: [0, -0.35, 0], rightLowerArm: [0, 0.35, 0] };
function pickSitVariant() {
  const w = { clip: clips.byRole.sit ? 2 : 0, knees: 2, cross: 2.2, hug: 1 + (mood.name === 'sad' || pet.energy < 0.4 ? 2.5 : 0), side: 1.6, kneel: 1 + (mood.name === 'proud' || mood.name === 'relaxed' ? 1.5 : 0) };
  let total = 0; for (const k in w) total += w[k];
  let r = Math.random() * total;
  for (const k in w) if ((r -= w[k]) <= 0) return k;
  return 'knees';
}
/** Pose for floor sitting, sitting down (crouch → sit) and standing up (sit → crouch → stand). */
function floorSit(state, p, br) {
  if (pet.sitVariant === 'clip' && state === 'sit_floor') return;              // the clip sits for us
  const v = SIT_VARIANTS[pet.sitVariant] || SIT_VARIANTS.knees;
  const u = pet.stateT;
  let kSit = 1, kCrouch = 0;
  if (state === 'sit_down') { kCrouch = ease(u / 0.55) * (1 - ease((u - 0.55) / 0.7)); kSit = ease((u - 0.55) / 0.7); }
  if (state === 'stand_up') { kSit = 1 - ease(u / 0.5); kCrouch = ease(u / 0.3) * (1 - ease((u - 0.5) / 0.45)); }
  for (const b in CROUCH) p[b] = mix(p[b], CROUCH[b], kCrouch);
  for (const b in v.fk) p[b] = mix(p[b], v.fk[b], kSit);
  p.spine = add(p.spine, br * 0.015 * kSit, 0, 0);
  if (v.legs) for (const side of ['left', 'right']) legReach(side, { ...v.legs[side], w: kSit });
  if (v.arms && kSit > 0.02) for (const side of ['left', 'right']) reachFor(side, { ...v.arms[side], w: kSit });
}
// leg IK requests (one per leg per frame)
const legIK = { left: null, right: null };
function legReach(side, req) { if (!legIK[side] || req.w > legIK[side].w) legIK[side] = req; }
function twoBone(ua, la, end, T, pole) {
  const S = ua.getWorldPosition(new V3()), E0 = la.getWorldPosition(new V3()), H0 = end.getWorldPosition(new V3());
  const L1 = S.distanceTo(E0), L2 = E0.distanceTo(H0);
  const toT = T.clone().sub(S);
  const d = clamp(toT.length(), 1e-4, (L1 + L2) * 0.999);
  const dir = toT.normalize();
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const pn = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir)));
  if (pn.lengthSq() < 1e-8) pn.set(0, 0, 1);
  pn.normalize();
  const Ew = S.clone().addScaledVector(dir, a).addScaledVector(pn, h);
  rotateBoneTo(ua, E0.clone().sub(S).normalize(), Ew.sub(S).normalize());
  const E2 = la.getWorldPosition(new V3()), H2 = end.getWorldPosition(new V3());
  rotateBoneTo(la, H2.sub(E2).normalize(), S.clone().addScaledVector(dir, d).sub(E2).normalize());
}
function solveLegs() {
  root.updateMatrixWorld(true);
  for (const side of ['left', 'right']) {
    const r = legIK[side];
    legIK[side] = null;
    if (!r || r.w < 0.01) continue;
    const ul = bone(side + 'UpperLeg'), ll = bone(side + 'LowerLeg'), ft = bone(side + 'Foot');
    const T = bodyPoint('hips', r.at);
    if (!ul || !ll || !ft || !T) continue;
    const fkU = ul.quaternion.clone(), fkL = ll.quaternion.clone();
    twoBone(ul, ll, ft, T, bodyDir(r.pole));
    ul.quaternion.copy(fkU.slerp(ul.quaternion, clamp(r.w, 0, 1)));
    ll.quaternion.copy(fkL.slerp(ll.quaternion, clamp(r.w, 0, 1)));
    ul.updateMatrixWorld(true);
  }
}
/** Lowest point that rests on the floor (seat, knees, feet), height above the root in px. */
function supportLow(hipsNow) {
  const ry = root.getWorldPosition(new V3()).y;
  let low = hipsNow - pet.heightPx * 0.07;
  for (const n of ['leftFoot', 'rightFoot', 'leftToes', 'rightToes', 'leftLowerLeg', 'rightLowerLeg']) {
    const b = bone(n);
    if (!b) continue;
    const y = (b.getWorldPosition(new V3()).y - ry) * pet.scale - (n.endsWith('LowerLeg') ? pet.heightPx * 0.03 : 0);
    if (y < low) low = y;
  }
  return low;
}

// ------------------------------------------------------------------ arm IK
// Two-bone IK: the hand reaches a real point on the body (brow, mouth, chin, chest, hips,
// the other elbow), so gestures fit any model's proportions. Requests are declared per
// frame ({ at: [bone, [x,y,z]], pole, reach, curl, w }), blended in and out smoothly.
// Offsets are in the bone's rest frame (model axes: +x = model's left, +y up, +z forward),
// in meters for a 1.6 m tall character (scaled to the model).
const V3 = THREE.Vector3;
const armLen = { left: null, right: null };
const ikState = { left: { w: 0, t: new V3(), req: null, has: false }, right: { w: 0, t: new V3(), req: null, has: false } };
function measureArms() {
  for (const side of ['left', 'right']) {
    const ua = bone(side + 'UpperArm'), la = bone(side + 'LowerArm'), hd = bone(side + 'Hand');
    if (!ua || !la || !hd) { armLen[side] = null; continue; }
    const S = ua.getWorldPosition(new V3()), E = la.getWorldPosition(new V3()), H = hd.getWorldPosition(new V3());
    const tip = bone(side + 'MiddleDistal') || bone(side + 'MiddleIntermediate');
    const hand = tip ? tip.getWorldPosition(new V3()).distanceTo(H) * 1.15 : S.distanceTo(E) * 0.6;
    armLen[side] = { upper: S.distanceTo(E), lower: E.distanceTo(H), hand };
  }
}
function bodyPoint(boneName, off) {
  const b = bone(boneName);
  if (!b || !pet.base) return null;
  const k = pet.base.heightM / 1.6;
  return b.localToWorld(new V3(off[0] * k, off[1] * k, off[2] * k));
}
const qA = new THREE.Quaternion(), qB = new THREE.Quaternion(), qC = new THREE.Quaternion();
function rotateBoneTo(node, from, to) {
  qA.setFromUnitVectors(from, to);
  node.getWorldQuaternion(qB).premultiply(qA);
  node.parent.getWorldQuaternion(qC).invert();
  node.quaternion.copy(qC.multiply(qB));
  node.updateMatrixWorld(true);
}
function solveArm(side, T, pole, reach) {
  const L = armLen[side];
  const ua = bone(side + 'UpperArm'), la = bone(side + 'LowerArm'), hd = bone(side + 'Hand');
  if (!L || !ua || !la || !hd) return;
  const L1 = L.upper, L2 = L.lower + L.hand * reach;
  const S = ua.getWorldPosition(new V3());
  const toT = T.clone().sub(S);
  const d = clamp(toT.length(), 1e-4, (L1 + L2) * 0.995);
  const dir = toT.normalize();
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const pn = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir)));
  if (pn.lengthSq() < 1e-8) pn.set(0, -1, 0);
  pn.normalize();
  const Ew = S.clone().addScaledVector(dir, a).addScaledVector(pn, h);
  const E = la.getWorldPosition(new V3());
  rotateBoneTo(ua, E.sub(S).normalize(), Ew.sub(S).normalize());
  const E2 = la.getWorldPosition(new V3()), Hc = hd.getWorldPosition(new V3());
  const Tw = S.clone().addScaledVector(dir, d);
  rotateBoneTo(la, Hc.sub(E2).normalize(), Tw.sub(E2).normalize());
}
/** Ask for an arm target this frame (weight w 0..1; the strongest request per arm wins). */
function reachFor(side, req) {
  const cur = mo.ik[side];
  if (!cur || (req.w || 0) > (cur.w || 0)) mo.ik[side] = req;
}
function bodyDir(v) { return new V3(v[0], v[1], v[2]).applyQuaternion(root.quaternion).normalize(); }
// ------------------------------------------------------------------ body collision (capsules)
// Motions are recorded on other bodies, so limbs can sink into this model's torso, jacket or
// thighs. The body is approximated by capsules measured from the model's own mesh (clothes
// included): elliptical for the torso (wide, thin front-to-back), round for head and legs.
// Every frame, after the clip / IK, the elbow, forearm, wrist and finger tips are pushed out to
// the surface by the smallest swing of shoulder, elbow or wrist; knees do not cross.
const CAPS = [
  { id: 'hips', a: 'hips', b: 'spine', bones: ['hips'] },
  { id: 'waist', a: 'spine', b: 'chest', bones: ['spine'] },
  { id: 'chest', a: 'chest', b: 'neck', bones: ['chest', 'upperChest'] },
  { id: 'head', a: 'head', b: null, bones: ['head'], head: true },
  { id: 'lThigh', a: 'leftUpperLeg', b: 'leftLowerLeg', bones: ['leftUpperLeg'], round: true },
  { id: 'rThigh', a: 'rightUpperLeg', b: 'rightLowerLeg', bones: ['rightUpperLeg'], round: true },
  { id: 'lShin', a: 'leftLowerLeg', b: 'leftFoot', bones: ['leftLowerLeg'], round: true },
  { id: 'rShin', a: 'rightLowerLeg', b: 'rightFoot', bones: ['rightLowerLeg'], round: true },
];
const body = { caps: null, sw0: 1 };
function shoulderWidth() {
  const l = bone('leftUpperArm'), r = bone('rightUpperArm');
  return l && r ? l.getWorldPosition(new V3()).distanceTo(r.getWorldPosition(new V3())) : 0;
}
function capEnds(c, sw) {
  const A = bone(c.a) && bone(c.a).getWorldPosition(new V3());
  if (!A) return null;
  let B = c.b && bone(c.b) ? bone(c.b).getWorldPosition(new V3()) : null;
  if (c.head) B = new V3(0, 1, 0).applyQuaternion(bone(c.a).getWorldQuaternion(new THREE.Quaternion())).multiplyScalar(sw * 0.45).add(A);
  return B ? { A, B } : null;
}
const pctl = (arr, p) => { if (!arr.length) return 0; const s = arr.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
/** Measure capsule radii from the skinned vertices, at rest (called right after loading). */
function measureBody(vrm) {
  body.caps = null;
  root.updateMatrixWorld(true);
  const sw = shoulderWidth();
  if (!sw) return;
  const rawToName = new Map();
  for (const c of CAPS) for (const n of c.bones) { const r = vrm.humanoid.getRawBoneNode(n); if (r) rawToName.set(r, n); }
  const nameToCap = {};
  for (const c of CAPS) for (const n of c.bones) nameToCap[n] = c;
  const ends = {}, qInv = {};
  for (const c of CAPS) { ends[c.id] = capEnds(c, sw); if (bone(c.a)) qInv[c.id] = bone(c.a).getWorldQuaternion(new THREE.Quaternion()).invert(); }
  const samples = {};
  for (const c of CAPS) samples[c.id] = { x: [], z: [], r: [] };
  const v = new V3(), ab = new V3(), d = new V3();
  vrm.scene.traverse((o) => {
    if (!o.isSkinnedMesh || !o.geometry.attributes.skinIndex) return;
    const pos = o.geometry.attributes.position, si = o.geometry.attributes.skinIndex, sw4 = o.geometry.attributes.skinWeight;
    const step = Math.max(1, Math.floor(pos.count / 6000));
    for (let i = 0; i < pos.count; i += step) {
      let best = -1, bw = 0;
      for (let k = 0; k < 4; k++) { const w = sw4.getComponent(i, k); if (w > bw) { bw = w; best = si.getComponent(i, k); } }
      const raw = o.skeleton.bones[best];
      const name = raw && rawToName.get(raw);
      const c = name && nameToCap[name];
      if (!c || !ends[c.id] || bw < 0.5) continue;                 // hair, skirt and cape (spring bones) are soft: not part of the body
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      const { A, B } = ends[c.id];
      ab.subVectors(B, A);
      const t = clamp(d.subVectors(v, A).dot(ab) / Math.max(1e-8, ab.lengthSq()), 0, 1);
      if (t <= 0 || t >= 1) continue;                                // only the side wall decides the radius
      d.subVectors(v, A).addScaledVector(ab, -t).applyQuaternion(qInv[c.id]);
      const s = samples[c.id];
      s.x.push(Math.abs(d.x)); s.z.push(Math.abs(d.z)); s.r.push(Math.hypot(d.x, d.z));
    }
  });
  const caps = [];
  for (const c of CAPS) {
    const s = samples[c.id];
    if (s.r.length < 20) continue;
    if (c.round) { const r = pctl(s.r, 0.68); caps.push({ ...c, rx: r / sw, rz: r / sw }); }   // the shorts / skirt hem flare out: measure the leg itself
    else if (c.head) { const r = pctl(s.r, 0.55); caps.push({ ...c, rx: r / sw, rz: r / sw }); }   // smaller: hands may touch the face, the cap brim is not the head
    else { const p = c.id === 'hips' ? 0.7 : 0.82; caps.push({ ...c, rx: pctl(s.x, p) / sw, rz: pctl(s.z, p) / sw }); }   // a jacket hem flares wide at the hips
  }
  body.caps = caps;
  body.sw0 = sw;
}
/** Penetration of point p into capsule c: e < 1 inside; `out` = nearest surface point (+margin). */
function capDepth(c, p, sw, out) {
  const ends = capEnds(c, sw);
  if (!ends) return 9;
  const { A, B } = ends;
  const ab = B.clone().sub(A);
  const t = clamp(p.clone().sub(A).dot(ab) / Math.max(1e-8, ab.lengthSq()), 0, 1);
  const cpt = A.clone().addScaledVector(ab, t);
  const d = p.clone().sub(cpt);
  const q = bone(c.a).getWorldQuaternion(new THREE.Quaternion());
  const dl = d.clone().applyQuaternion(q.clone().invert());
  const rx = c.rx * sw, rz = c.rz * sw, ry = Math.min(rx, rz);
  const capped = t <= 0 || t >= 1;
  let e = Math.sqrt((dl.x / rx) ** 2 + (dl.z / rz) ** 2 + (capped ? (dl.y / ry) ** 2 : 0));
  if (e < 1e-4) { dl.set(1e-3, 0, 0); e = 1e-3 / rx; }
  if (out) out.copy(dl.multiplyScalar(0.98 / e).applyQuaternion(q)).add(cpt);   // just onto the surface (touching is fine)
  return e;
}
/** Deepest capsule (of `ids`) containing p; returns { e, target } or null. */
function deepest(p, ids, sw) {
  let best = null;
  const tgt = new V3();
  for (const c of body.caps) {
    if (!ids.includes(c.id)) continue;
    const e = capDepth(c, p, sw, tgt);
    if (e < 0.9 && (!best || e < best.e)) best = { e, target: tgt.clone() };   // light contact is allowed: hands on hips, palms on the chest
  }
  return best;
}
const collideCorr = {};
/** Swing `node` (about its own joint) so that point P moves to T; smoothed per key. */
function swingTo(key, node, P, T, dt, limit = 0.9) {
  const J = node.getWorldPosition(new V3());
  let want = new THREE.Quaternion();
  if (P && T) {
    const from = P.clone().sub(J).normalize(), to = T.clone().sub(J).normalize();
    want.setFromUnitVectors(from, to);
    const ang = 2 * Math.acos(clamp(Math.abs(want.w), 0, 1));
    if (ang > limit) want.slerp(new THREE.Quaternion(), 1 - limit / ang);
  }
  const cur = collideCorr[key] || (collideCorr[key] = new THREE.Quaternion());
  const rising = P && T;
  cur.slerp(want, damp(rising ? 22 : 7, dt));
  if (Math.abs(cur.w) > 0.99999) return;
  const world = node.getWorldQuaternion(new THREE.Quaternion()).premultiply(cur);
  node.quaternion.copy(node.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world));
  node.updateMatrixWorld(true);
}
const TORSO = ['hips', 'waist', 'chest'];
function bodyCollide(dt) {
  if (body.off || !body.caps || !body.caps.length || !pet.vrm) return;
  root.updateMatrixWorld(true);
  const sw = shoulderWidth();
  if (!sw) return;
  const P = (n) => (bone(n) ? bone(n).getWorldPosition(new V3()) : null);
  const mid = (a, b, t = 0.5) => (a && b ? a.clone().lerp(b, t) : null);
  for (const side of ['left', 'right']) {
    const other = side === 'left' ? 'r' : 'l', own = side === 'left' ? 'l' : 'r';
    const seated = /^sit|^sleep|stand_up/.test(pet.state);                       // hugging knees, hands on the knees: touching the legs is the pose
    const legs = seated ? [] : [other + 'Thigh', own + 'Thigh', other + 'Shin', own + 'Shin'];
    const ua = bone(side + 'UpperArm'), la = bone(side + 'LowerArm'), hd = bone(side + 'Hand');
    if (!ua || !la || !hd) continue;
    // 1. elbow out of the torso: swing the shoulder
    let E = P(side + 'LowerArm');
    let hit = deepest(E, TORSO, sw);
    swingTo(side + 'U', ua, hit && E, hit && hit.target, dt, 0.45);
    // 2. forearm and wrist out of torso, thighs and head: bend at the elbow
    E = P(side + 'LowerArm');
    const W = P(side + 'Hand');
    let worst = null, worstP = null;
    for (const [pt, ids] of [[mid(E, W, 0.5), TORSO.concat(legs, ['head'])], [W, TORSO.concat(legs)]]) {
      const h = pt && deepest(pt, ids, sw);
      if (h && (!worst || h.e < worst.e)) { worst = h; worstP = pt; }
    }
    swingTo(side + 'L', la, worst && worstP, worst && worst.target, dt, 0.8);
    // 3. still inside (the elbow cannot bend that way): help from the shoulder
    const W2 = P(side + 'Hand');
    hit = W2 && deepest(W2, TORSO.concat(legs), sw);
    swingTo(side + 'U2', ua, hit && W2, hit && hit.target, dt, 0.25);
    // 4. finger tips: turn the hand at the wrist
    const tipBone = bone(side + 'MiddleDistal') || bone(side + 'MiddleIntermediate');
    const tip = tipBone && tipBone.getWorldPosition(new V3());
    hit = tip && deepest(tip, TORSO.concat(legs), sw);
    swingTo(side + 'H', hd, hit && tip, hit && hit.target, dt, 0.6);
  }
  // legs: a knee or an ankle does not pass through the other leg (crossed legs on the floor are meant to)
  if (/^sit_floor|^sit_down|^stand_up/.test(pet.state)) return;
  for (const [side, o] of [['left', 'r'], ['right', 'l']]) {
    const ul = bone(side + 'UpperLeg');
    if (!ul) continue;
    const K = P(side + 'LowerLeg'), A = P(side + 'Foot');
    let hit = K && deepest(K, [o + 'Thigh', o + 'Shin'], sw), pt = K;
    const hA = A && deepest(A, [o + 'Shin'], sw);
    if (hA && (!hit || hA.e < hit.e)) { hit = hA; pt = A; }
    swingTo(side + 'Leg', ul, hit && pt, hit && hit.target, dt, 0.35);
  }
}

// Clips are recorded on slimmer bodies: a hand at the hip would sink into a jacket or a skirt.
// A free hand (no IK request) inside the torso volume swings its arm outwards just enough to stay
// outside. Sizes are relative to the shoulder width, so any model works.
const keepOut = { left: 0, right: 0 }, keepFwd = { left: 0, right: 0 };
function keepHandsOut(dt) {
  const hips = bone('hips'), chest = bone('upperChest') || bone('chest');
  if (!hips || !chest) return;
  root.updateMatrixWorld(true);
  const rqi = root.getWorldQuaternion(new THREE.Quaternion()).invert();
  const H0 = hips.getWorldPosition(new V3());
  const model = (v) => v.sub(H0).applyQuaternion(rqi);
  const la = bone('leftUpperArm'), ra = bone('rightUpperArm');
  if (!la || !ra) return;
  const SW = la.getWorldPosition(new V3()).distanceTo(ra.getWorldPosition(new V3()));
  const chestY = model(chest.getWorldPosition(new V3())).y;
  for (const side of ['left', 'right']) {
    const sx = side === 'left' ? 1 : -1;
    const ua = bone(side + 'UpperArm'), hd = bone(side + 'Hand');
    let want = 0, fwd = 0;
    const busy = ikState[side].w > 0.05;
    if (ua && hd && !busy) {
      const S = model(ua.getWorldPosition(new V3()));
      const tipBone = bone(side + 'MiddleDistal') || bone(side + 'MiddleIntermediate');
      // the wrist and the finger tips both stay out: waist (jacket) above the hips, thighs with
      // shorts / skirt / cape below them
      for (const pt of [hd, tipBone]) {
        if (!pt) continue;
        const h = model(pt.getWorldPosition(new V3()));
        if (!(h.y < chestY && h.y > -SW * 1.5 && Math.abs(h.z) < SW * 0.45)) continue;
        const rMin = SW * (h.y < -SW * 0.1 ? 0.6 : 0.5);
        const gap = rMin - sx * h.x;
        const len = Math.max(1e-4, S.distanceTo(h));
        if (gap > 0 && !(body.caps && body.caps.length)) want = Math.max(want, Math.asin(clamp(gap / len, 0, 0.6)));   // fallback when no capsules
        // hanging along the side (where capes, coat tails and skirts hang): bring it slightly forward
        if (sx * h.x > SW * 0.35 && h.y < -SW * 0.05) {
          const zMin = SW * 0.32;
          if (h.z < zMin) fwd = Math.max(fwd, Math.asin(clamp((zMin - h.z) / len, 0, 0.45)));
        }
      }
    }
    keepOut[side] += (want - keepOut[side]) * damp(want > keepOut[side] ? 14 : 6, dt);
    keepFwd[side] += (fwd - keepFwd[side]) * damp(fwd > keepFwd[side] ? 10 : 5, dt);
    if ((keepOut[side] < 1e-3 && keepFwd[side] < 1e-3) || !ua) continue;
    // swing outwards about the body's forward axis and forwards about its left-right axis
    const rq = root.getWorldQuaternion(new THREE.Quaternion());
    const swing = new THREE.Quaternion().setFromAxisAngle(new V3(0, 0, 1).applyQuaternion(rq), sx * keepOut[side])
      .multiply(new THREE.Quaternion().setFromAxisAngle(new V3(1, 0, 0).applyQuaternion(rq), -keepFwd[side]));
    const world = ua.getWorldQuaternion(new THREE.Quaternion()).premultiply(swing);
    ua.quaternion.copy(ua.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world));
    ua.updateMatrixWorld(true);
  }
}
function solveIK(dt) {
  root.updateMatrixWorld(true);
  for (const side of ['right', 'left']) {          // right first: the left hand may hold the right elbow
    const st = ikState[side];
    const req = mo.ik[side];
    const want = req ? clamp(req.w, 0, 1) : 0;
    st.w += (want - st.w) * damp(want > st.w ? 7 : 5, dt);
    if (req) st.req = req;
    if (st.w < 0.002 || !st.req) { st.has = false; continue; }
    const r = st.req;
    const T = bodyPoint(r.at[0], r.at[1]);
    if (!T) continue;
    if (!st.has) { st.t.copy(T); st.has = true; } else st.t.lerp(T, damp(16, dt));
    const ua = bone(side + 'UpperArm'), la = bone(side + 'LowerArm');
    if (!ua || !la) continue;
    const fkU = ua.quaternion.clone(), fkL = la.quaternion.clone();
    solveArm(side, st.t, bodyDir(r.pole || [side === 'left' ? 1 : -1, -1, 0]), r.reach == null ? 1 : r.reach);
    ua.quaternion.copy(fkU.slerp(ua.quaternion, st.w));
    la.quaternion.copy(fkL.slerp(la.quaternion, st.w));
    ua.updateMatrixWorld(true);
    if (r.palm) orientHand(side, r.palm, r.fingers, st.w);
  }
}
/**
 * Turn the hand so the palm faces `palm` (model frame: +x = model's left, +y up, +z forward).
 * Fingers point along `fingers`, or keep following the forearm (a straight wrist).
 * Rest hands: fingers along ±X, palm down (-Y).
 */
function orientHand(side, palm, fingersDir, w) {
  const hd = bone(side + 'Hand'), la = bone(side + 'LowerArm');
  const restQ = pet.restHand && pet.restHand[side];
  if (!hd || !la || !restQ) return;
  const rq = root.getWorldQuaternion(new THREE.Quaternion());
  const rqi = rq.clone().invert();
  const f = fingersDir ? new V3().fromArray(fingersDir).normalize()
    : hd.getWorldPosition(new V3()).sub(la.getWorldPosition(new V3())).applyQuaternion(rqi).normalize();
  const n = new V3().fromArray(palm);
  n.sub(f.clone().multiplyScalar(n.dot(f)));
  if (n.lengthSq() < 1e-6) return;
  n.normalize();
  const X = side === 'left' ? f.clone() : f.clone().negate();
  const Y = n.clone().negate();
  const Z = new V3().crossVectors(X, Y);
  const delta = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z));
  const want = rq.multiply(delta).multiply(restQ);
  const local = hd.parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(want);
  hd.quaternion.slerp(local, clamp(w, 0, 1));
  hd.updateMatrixWorld(true);
}
const sideSign = (side) => (side === 'left' ? 1 : -1);    // model's left is +x

/** Procedural body: base pose + gait + gesture + emotion + look + fingers, smoothed per bone. */
function applyPose(dt, t, useClip, opts = {}) {
  mo.ik = { left: null, right: null };
  if (useClip) { mo.curlL = mo.curlR = 0.32; mo.bob = 0; }
  const p = useClip ? {} : base(poseState(), t);
  // gesture layer
  pet.gestureFace = null;
  if (pet.gesture && !opts.still) {
    const g = GESTURES[pet.gesture.name];
    const gt = t - pet.gesture.t0;
    if (gt > (pet.gesture.dur || (g ? g.dur : 0))) pet.gesture = null;
    else if (g && (!pet.gesture.clip || g.ik) && gt <= g.dur) {
      const k = envelope(gt, g.dur, g.a, g.r);
      if (!useClip) g.f(p, k, gt);
      else if (g.head) g.head(p, k, gt);
      if (g.ik) g.ik(k, gt);
      if (g.face) pet.gestureFace = g.face(k);
    }
  }
  if (!useClip) moodBody(p);
  moodArms();
  if (mic.rec) { p.head = add(p.head, 0.02, 0, 0.13); p.neck = add(p.neck, 0, 0, 0.04); }   // listening: head tilted towards the user
  if (petting.active) {                                                     // leans into the hand, eyes closed
    const hx = headWorld().x, side = clamp((cursor.x - hx) / (pet.heightPx * 0.15), -1, 1);
    p.head = add(p.head, 0.07, 0, -side * 0.14); p.neck = add(p.neck, 0.04, 0, -side * 0.05);
  }
  // talking: soft nods and sways, a hand that sometimes "explains"
  if (pet.talking && !pet.sleeping && !opts.still) {
    p.head = add(p.head, noise(t * 3.1, 1) * 0.045, noise(t * 1.7, 2) * 0.06, noise(t * 1.3, 3) * 0.03);
    p.chest = add(p.chest, 0, noise(t * 1.1, 4) * 0.03, 0);
    if (STANDING.has(pet.state) && !pet.gesture) {
      const ex = Math.max(0, noise(t * 0.45, 9));
      p.rightUpperArm = mix(p.rightUpperArm, [-0.55, -0.1, 1.05], ex * 0.8);
      p.rightLowerArm = mix(p.rightLowerArm, [0, 1.2 + noise(t * 2.3, 5) * 0.15, 0], ex * 0.8);
      p.rightHand = mix(p.rightHand, [-0.6, 0, 0.3], ex * 0.8);
      mo.curlR = mo.curlR * (1 - ex) + 0.12 * ex;
    }
  }
  // head / neck look (additive, also on top of clips)
  const look = opts.still ? { x: 0, y: 0 } : headLook(dt);
  for (const side of ['left', 'right']) {          // hand shape follows the reach request
    const r = mo.ik[side];
    if (r && r.curl != null) { const key = side === 'left' ? 'curlL' : 'curlR'; mo[key] += (r.curl - mo[key]) * clamp(r.w, 0, 1); }
  }
  fingers(p);
  const fast = pet.state === 'held' || pet.state === 'fall' || pet.state === 'jump' ? 1.8 : 1;
  for (const name of BONES) {
    const node = bone(name);
    if (!node) continue;
    let v = p[name];
    if (name === 'head') v = add(v, look.x * 0.65, look.y * 0.65, 0);
    if (name === 'neck') v = add(v, look.x * 0.35, look.y * 0.35, 0);
    if (pet.manual.has(name)) v = pet.manual.get(name);
    if (useClip) {
      // a hand that is busy with our gesture (IK) takes our hand pose and fingers over the clip's
      const side = name.startsWith('left') ? 'left' : name.startsWith('right') ? 'right' : '';
      const req = side && mo.ik[side];
      if (req && req.w > 0.01 && (name === side + 'Hand' || FINGER_BONES.includes(name))) {
        tmpQ.setFromEuler(tmpE.set(v ? v[0] : 0, v ? v[1] : 0, v ? v[2] : 0));
        node.quaternion.slerp(tmpQ, clamp(req.w, 0, 1));
        continue;
      }
      // clip owns the body: only layer look/manual onto head & neck. The mixer skips writing a
      // bone whose clip value did not change (a held pose), so layer onto the remembered clip
      // value, never onto last frame's result (that would spin the head further every frame).
      if (name !== 'head' && name !== 'neck' && !pet.manual.has(name)) continue;
      tmpQ.setFromEuler(tmpE.set(v ? v[0] : 0, v ? v[1] : 0, v ? v[2] : 0));
      const out = layerOut.get(name);
      let base = layerClip.get(name);
      if (!base || !out || !node.quaternion.equals(out)) { base = node.quaternion.clone(); layerClip.set(name, base); }   // the mixer wrote a new value
      node.quaternion.copy(base).multiply(tmpQ);
      layerOut.set(name, node.quaternion.clone());
      continue;
    }
    tmpQ.setFromEuler(tmpE.set(v ? v[0] : 0, v ? v[1] : 0, v ? v[2] : 0));
    let cur = poseCur.get(name);
    if (!cur) { cur = node.quaternion.clone(); poseCur.set(name, cur); }
    if (opts.snap) cur.copy(tmpQ);
    else cur.slerp(tmpQ, damp((RATE[name] || 6) * fast, dt));
    node.quaternion.copy(cur);
  }
  if (!opts.still) solveLegs();
  if (!opts.still) solveIK(dt);
  if (!opts.still) keepHandsOut(dt);
  if (!opts.still) bodyCollide(dt);
}
function poseState() {
  if (pet.phase === 'thinking' && canStand()) return 'think';
  if (pet.phase === 'tool' && canStand()) return 'typing';
  return pet.state;
}
const canStand = () => pet.state === 'idle' || pet.state === 'talk' || pet.state === 'react';

const lookCur = { x: 0, y: 0 };
let lookIdle = { x: 0, y: 0, until: 0 };
const saccade = { x: 0, y: 0, cx: 0, cy: 0, next: 0 };
function headLook(dt) {
  let tx = 0, ty = 0;
  const now = performance.now();
  const hs = headScreen(), head = { x: hs.x, y: H - hs.y };
  // in the bubble she is "on camera": the cursor counts only near the ring, distances are in ring sizes
  const reach = portrait.on ? portrait.r * 2.5 : pet.heightPx * 3.5;
  const near = cursor.x >= 0 && Math.hypot(cursor.x - head.x, toWorldY(cursor.y) - head.y) < reach;
  const fresh = now - cursor.t < 6000;
  const followCursor = settings.behaviors.cursor && near && fresh && pet.phase === 'idle' && !pet.talking;
  if (pet.sleeping || pet.state === 'sleep') { tx = 0; ty = 0; }
  else if (pet.talking || pet.phase !== 'idle') { tx = -0.04; ty = 0; }     // look at the user
  else if (followCursor) {
    const dx = cursor.x - head.x, dy = toWorldY(cursor.y) - head.y;
    const dist = portrait.on ? portrait.r * 3 : pet.heightPx * 2.2;
    ty = clamp(Math.atan2(dx, dist), -0.7, 0.7) - pet.yaw * 0.6;
    tx = clamp(-Math.atan2(dy, dist), -0.45, 0.4);
  } else if (portrait.on) {
    // in the bubble: mostly looking at the viewer, now and then a short glance away
    if (now > lookIdle.until) lookIdle = Math.random() < 0.2 ? { x: rand(-0.05, 0.1), y: rand(-0.3, 0.3), until: now + rand(900, 1800) } : { x: rand(-0.05, 0.02), y: rand(-0.05, 0.05), until: now + rand(3000, 7000) };
    tx = lookIdle.x; ty = lookIdle.y;
  } else {
    if (now > lookIdle.until) lookIdle = { x: rand(-0.1, 0.14), y: rand(-0.35, 0.35), until: now + rand(1800, 6000) };
    tx = lookIdle.x; ty = lookIdle.y;
  }
  // a mood has its own gaze: looking away when shy, up when thinking, down when sad
  const md = moodDef();
  if (md && md.look && !pet.talking && pet.phase === 'idle' && !pet.sleeping) { const L = md.look(moodT()); tx += (L[0] - tx) * mood.k; ty += (L[1] - ty) * mood.k; }
  // the head leads a turn of the body
  ty += clamp((pet.yawTarget - pet.yaw) * 0.45, -0.5, 0.5);
  // a held photo pose sets the head itself: only a hint of gaze on top
  if (clips.currentRole === 'pose') { tx *= 0.2; ty *= 0.2; }
  // ease-in/out head motion: a critically damped follow with a gentle rate
  lookCur.x += (tx - lookCur.x) * damp(3.2, dt);
  lookCur.y += (ty - lookCur.y) * damp(3.2, dt);
  // eyes: fast small saccades around the gaze point (the head follows slowly)
  if (now > saccade.next) {
    const amp = pet.talking ? 0.025 : 0.05;
    saccade.x = rand(-amp, amp) * pet.heightPx; saccade.y = rand(-amp, amp) * 0.6 * pet.heightPx;
    saccade.next = now + rand(350, 1800);
    if (Math.random() < 0.18) face.forceBlink = true;          // blinks often come with a gaze shift
  }
  saccade.cx += (saccade.x - saccade.cx) * damp(28, dt);
  saccade.cy += (saccade.y - saccade.cy) * damp(28, dt);
  if (pet.vrm) {
    const ahead = pet.heightPx * 3;
    if (portrait.on) {                                                       // the head in world pixels, the gaze by angle
      const hw = headWorld(), k = 0.4;
      lookTarget.position.set(hw.x + Math.sin(lookCur.y) * ahead + saccade.cx * k, hw.y - Math.sin(lookCur.x) * ahead + saccade.cy * k, ahead);
    } else if (followCursor) lookTarget.position.set(cursor.x + saccade.cx * 0.3, toWorldY(cursor.y) + saccade.cy * 0.3, ahead);
    else lookTarget.position.set(head.x + Math.sin(lookCur.y) * ahead + saccade.cx, head.y - Math.sin(lookCur.x) * ahead + saccade.cy, ahead);
    lookTarget.position.divideScalar(pet.scale);
  }
  return lookCur;
}

// ------------------------------------------------------------------ face
const face = { blink: 0, nextBlink: 0, blinkT: -1, doubleBlink: false, forceBlink: false, mouth: { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 }, speech: '', spoken: 0, charT: 0, open: 1, emoBlend: {} };
const VOWELS = { а: 'aa', я: 'aa', a: 'aa', о: 'oh', ё: 'oh', o: 'oh', у: 'ou', ю: 'ou', u: 'ou', и: 'ih', ы: 'ih', i: 'ih', y: 'ih', э: 'ee', е: 'ee', e: 'ee' };
/** How long a character "takes" when spoken (punctuation = pauses, the mouth closes). */
function charDur(ch) {
  if (VOWELS[ch]) return 0.085;
  if (/[.!?…]/.test(ch)) return 0.32;
  if (/[,;:—–-]/.test(ch)) return 0.16;
  if (/\s/.test(ch)) return 0.05;
  if (/[a-zа-яё]/i.test(ch)) return 0.055;
  return 0.02;
}
function updateFace(dt, now) {
  if (!pet.vrm) return;
  moodUpdate(dt);
  const md = moodDef();
  const gf = pet.gestureFace || {};
  // blink: fast close (70 ms), short hold, slower open (130 ms); sometimes a double blink
  const asleep = pet.sleeping || pet.state === 'sleep' || pet.state === 'sleep_sit';
  if (asleep) face.blink += (1 - face.blink) * damp(4, dt);
  else {
    if (face.blinkT < 0 && (now > face.nextBlink || face.forceBlink)) {
      face.blinkT = 0; face.forceBlink = false;
      face.doubleBlink = Math.random() < 0.15;
      face.nextBlink = now + rand(2200, 6000) * (pet.energy < 0.3 ? 0.6 : 1);
    }
    if (face.blinkT >= 0) {
      face.blinkT += dt;
      const t = face.blinkT;
      face.blink = t < 0.07 ? easeInOut(t / 0.07) : t < 0.1 ? 1 : t < 0.23 ? 1 - easeInOut((t - 0.1) / 0.13) : 0;
      if (t >= 0.23) { face.blinkT = -1; face.blink = 0; if (face.doubleBlink) { face.doubleBlink = false; face.forceBlink = true; } }
    } else face.blink += (0 - face.blink) * damp(20, dt);
  }
  // emotions: quick attack, slow release, a hint of a smile when content
  const target = { happy: 0, angry: 0, sad: 0, relaxed: 0, surprised: 0 };
  if (now < pet.emotionUntil) Object.assign(target, pet.emotion);
  else pet.emotion = {};
  if (md) for (const [k2, v] of Object.entries(md.face || {})) target[k2] = Math.max(target[k2] || 0, v * mood.k);
  if (pet.state === 'held') target.surprised = Math.max(target.surprised, 0.45);
  if (asleep) target.relaxed = 0.6;
  if (petting.active) target.happy = Math.max(target.happy, 0.95);
  if (!asleep && pet.joy > 0.6 && !target.sad && !target.angry) target.happy = Math.max(target.happy, (pet.joy - 0.6) * 0.6);
  if (pet.talking && pet.joy > 0.45) target.happy = Math.max(target.happy, 0.15);
  for (const k of Object.keys(target)) {
    const want = Math.max(target[k], gf[k] || 0);
    const cur = face.emoBlend[k] || 0;
    face.emoBlend[k] = cur + (want - cur) * damp(want > cur ? 4.5 : 1.8, dt);
    setExpr(k, face.emoBlend[k]);
  }
  const happyEyes = Math.max(petting.active ? 0.85 : 0, gf.blink || 0);
  const lids = md && md.blink ? md.blink(moodT()) * mood.k : 0;                      // mood eyelids: sleepy, soft, shy
  setExpr('blink', clamp(Math.max(face.blink, happyEyes, lids), 0, 1) * (1 - (face.emoBlend.surprised || 0) * 0.85));
  // mouth: speak the text at a natural pace with pauses; neighbouring sounds blend
  const m = { aa: 0, ih: 0, ou: 0, ee: 0, oh: 0 };
  if (audioMouth(m)) { /* Kokoro audio drives the mouth */ }
  else if (face.spoken < face.speech.length && !asleep) {
    face.charT += dt;
    let ch = (face.speech[face.spoken] || ' ').toLowerCase();
    while (face.charT >= charDur(ch) && face.spoken < face.speech.length && face.spoken < voice.limit) {   // with a voice: not ahead of the spoken word
      face.charT -= charDur(ch); face.spoken++;
      ch = (face.speech[face.spoken] || ' ').toLowerCase();
      if (VOWELS[ch]) face.open = rand(0.6, 1);          // each syllable opens a bit differently
    }
    const vis = face.spoken >= voice.limit ? null : VOWELS[ch];          // between words the mouth rests
    if (vis) m[vis] = 0.85 * face.open;
    else if (/[a-zа-яё]/i.test(ch)) { m.ih = 0.12; m.ou = /[мбпвф]|[mbpvf]/.test(ch) ? 0 : 0.05; }
    pet.talking = true;
  } else if (pet.talking && face.spoken >= face.speech.length && !voice.speaking) {
    pet.talking = false;
  }
  for (const k of Object.keys(m)) {
    const want = Math.max(m[k], gf[k] || 0, md && md.mouth && !pet.talking ? (md.mouth[k] || 0) * mood.k : 0);
    face.mouth[k] += (want - face.mouth[k]) * damp(want > face.mouth[k] ? 26 : 16, dt);
    setExpr(k, face.mouth[k]);
  }
}
function setEmotion(vec, seconds = 5) {
  const next = {};
  let best = '', bw = 0;
  for (const [k, v] of Object.entries(vec || {})) {
    const w = clamp(Number(v) || 0, 0, 1);
    if (PRESETS.includes(k)) next[k] = w;
    if (MOODS[k] && w > bw) { best = k; bw = w; }
  }
  pet.emotion = next;
  pet.emotionUntil = performance.now() + seconds * 1000;
  if (best && bw >= 0.5) setMood(best, seconds, bw);       // strong enough to show in the body too
}
function emotionFromText(text) {
  const s = text.toLowerCase();
  if (/🥰|❤|💕|люблю|обожаю|милый|милая|нежн|love you|❤️/.test(s)) return { love: 0.8 };
  if (/🤩|🎉|ура+!|восторг|потрясающ|невероятн|awesome|amazing|yay/.test(s)) return { excited: 0.85 };
  if (/😂|🤣|😄|😊|😁|рад|отлично|супер|спасибо|класс|здорово|haha|great|thanks|glad/.test(s)) return { happy: 0.85 };
  if (/😳|☺|смущ|стесня|ой,? ну|blush|embarrass/.test(s)) return { shy: 0.8 };
  if (/😨|😱|страшн|боюсь|испуг|опасн|scary|afraid/.test(s)) return { scared: 0.75 };
  if (/😢|😭|☹|к сожалению|жаль|грустн|печаль|sorry|unfortunately/.test(s)) return { sad: 0.7 };
  if (/😤|😒|обидн|хмф|hmph|не буду/.test(s)) return { pout: 0.7 };
  if (/😠|😡|бесит|злит|angry/.test(s)) return { angry: 0.7 };
  if (/😎|горжусь|легко|проще простого|конечно же я|proud|easy/.test(s)) return { proud: 0.7 };
  if (/🤔|хм+|дума[юе]|интересн|предполож|hmm|let me think/.test(s)) return { thinking: 0.6 };
  if (/😴|🥱|устал|сонн|спать хочу|sleepy|tired/.test(s)) return { sleepy: 0.7 };
  if (/😮|😲|ого|вау|неужели|wow|whoa|!{2,}/.test(s)) return { surprised: 0.75 };
  return { relaxed: 0.35 };
}

// ------------------------------------------------------------------ world: floor + window ledges
function rebuildLedges() {
  const ws = world.windows;
  const ledges = [];
  const minTop = pet.heightPx * 0.55;            // room above the edge for the body
  ws.forEach((w, i) => {
    if (w.max || w.y < minTop || w.y > H - 30) return;
    if (/^Amadeus( 3D)?$|^Amadeus — /.test(w.title || '')) return;   // our own transparent companion windows
    let segs = [[Math.max(0, w.x + 14), Math.min(W, w.x + w.w - 14)]];
    for (let j = 0; j < i; j++) {               // windows above in z-order hide parts of the edge
      const o = ws[j];
      if (o.y <= w.y && o.y + o.h > w.y) segs = segs.flatMap(([a, b]) => cut(a, b, o.x, o.x + o.w));
    }
    for (const [a, b] of segs) if (b - a > pet.shoulderPx * 1.6) ledges.push({ id: w.id, title: w.title, x0: a, x1: b, y: toWorldY(w.y) });
  });
  world.ledges = ledges;
}
function cut(a, b, c, d) {
  if (d <= a || c >= b) return [[a, b]];
  const out = [];
  if (c > a) out.push([a, c]);
  if (d < b) out.push([d, b]);
  return out;
}
function surfaceY() {
  if (pet.surface.kind === 'window') {
    const l = world.ledges.find((x) => x.id === pet.surface.id && pet.x >= x.x0 && pet.x <= x.x1);
    return l ? l.y : null;
  }
  return 0;
}
function surfaceSpan() {
  if (pet.surface.kind === 'window') {
    const l = world.ledges.find((x) => x.id === pet.surface.id && pet.x >= x.x0 - 2 && pet.x <= x.x1 + 2);
    return l ? [l.x0 + pet.shoulderPx * 0.6, l.x1 - pet.shoulderPx * 0.6] : null;
  }
  return [pet.shoulderPx, W - pet.shoulderPx];
}
function onWorld(d) {
  const prev = new Map(world.windows.map((w) => [w.id, w]));
  world.windows = d.windows || [];
  world.idle = d.idle || 0;
  world.full = !!d.full;
  world.fg = d.fg;                                                     // a fullscreen app is in front (bubble mode can take over)
  world.ready = true;
  rebuildLedges();
  // ride the window we stand on; fall if it is gone / covered
  if (pet.surface.kind === 'window' && isGrounded()) {
    const before = prev.get(pet.surface.id);
    const now = world.windows.find((w) => w.id === pet.surface.id);
    if (before && now && (before.x !== now.x || before.y !== now.y)) {
      pet.x += now.x - before.x; pet.y = toWorldY(now.y);
      if (Math.abs(now.x - before.x) + Math.abs(now.y - before.y) > 80) pet.resetSprings = true;
    }
    if (surfaceY() === null) { pet.surface = { kind: 'floor' }; setState(settings.behaviors.physics ? 'fall' : 'idle'); }
  }
}
const isGrounded = () => !['held', 'fall', 'jump'].includes(pet.state);

// ------------------------------------------------------------------ state machine
function setState(s, dur) {
  if (pet.state === s && s !== 'react') return;
  if ((pet.state === 'sit_floor' || pet.state === 'sit_down') && (s === 'idle' || s === 'walk' || s === 'talk')) { pet.afterStand = s; s = 'stand_up'; }   // get up first
  if (pet.state === 'stand_up' && (s === 'idle' || s === 'walk' || s === 'talk')) { pet.afterStand = s; return; }
  const prev = pet.state;
  pet.state = s; pet.stateT = 0; pet.stateDur = dur || 0;
  pet.sleeping = s === 'sleep' || s === 'sleep_sit';
  if (s === 'held' || s === 'fall' || s === 'land' || s.startsWith('sit') || s.startsWith('sleep')) pet.yawTarget = 0;   // face the user
  // clips for the new state (falls back to procedural when the role has no clip)
  const role = { idle: 'idle', talk: 'talk', walk: 'walk', sit_edge: 'sit_edge', sit_floor: 'sit', sleep: 'sleep', sleep_sit: 'sleep', held: 'held', fall: 'fall', jump: 'jump', land: 'land', react: 'idle' }[s];
  if (s === 'sit_edge' && !clips.byRole.sit_edge && clips.byRole.sit) playRole('sit');
  else if (s === 'sit_floor' && pet.sitVariant !== 'clip') stopClip();          // our own sitting variants (an imported "sit" clip is one of them)
  else if (role) playRole(role, { once: s === 'land' || s === 'jump' });
  else stopClip();
  if (prev === 'sleep' && s !== 'sleep') pet.tilt = 0;
}

function decide(now) {
  if (pet.frozen) return;
  if (pet.gesture && pet.gesture.clip && pet.phase === 'idle' && !pet.talking) return;   // let a pose / dance / greeting clip finish
  // agent activity has priority: stand still and face the user
  if (pet.phase !== 'idle' || pet.talking) {
    if (pet.sleeping) wake(true);
    if (pet.state === 'walk') setState('idle');
    pet.yawTarget = 0;
    return;
  }
  if (pet.state === 'sleep' || pet.state === 'sleep_sit') {
    const userBack = world.idle < 2 && cursorNear(2.5) && now - cursor.t < 1500;
    if (userBack && Math.random() < 0.02) wake();
    if (pet.stateT > 1800 && Math.random() < 0.001) wake();
    return;
  }
  if (pet.next && now < pet.next) return;
  if (agentControl()) { pet.next = now + 4000; return; }                      // the agent decides what she does
  const b = settings.behaviors;
  // sleepy when the user is away for a while or energy is low
  if (b.sleep && (world.idle > 240 || pet.energy < 0.15)) { goSleep(); return; }
  const onLedge = pet.surface.kind === 'window';
  if (portrait.on && agentControl()) { pet.next = now + 4000; return; }
  if (portrait.on) {                                                         // in the bubble: calm, and in tune with what is on screen
    const kind = scene_.kind, r2 = Math.random();
    if (kind === 'game') { if (r2 < 0.3) setMood(pick(['excited', 'surprised', 'happy']), 3, 0.7); }
    else if (kind === 'video') { if (r2 < 0.35) setMood(pick(['relaxed', 'happy', 'surprised']), 5, 0.7); }
    else if (kind === 'music') { if (r2 < 0.4) setMood('relaxed', 6, 0.8); }
    else if (kind === 'code') { if (r2 < 0.3) setMood('thinking', 4, 0.6); }
    else if (r2 < 0.12) gesture(pet.energy < 0.4 ? 'yawn' : 'stretch');
    else if (r2 < 0.22) gesture(pick(['nod', 'giggle']));
    pet.next = now + rand(9000, 20000);
    return;
  }
  const kind = scene_.kind;
  const busyUser = kind === 'video' || kind === 'game';                     // watching / playing: stay calm, do not wander across
  const options = [
    ['look', 2], ['stand', 2], ['fidget', 2.5],
    ['walk', b.walk ? (3 + pet.boredom * 3) * (busyUser ? 0.25 : 1) : 0],
    ['think', kind === 'code' ? 1.5 : 0],
    ['vibe', kind === 'music' ? 2.5 : 0],
    ['watch', kind === 'video' ? 3 : 0],
    ['climb', b.climb && world.ledges.length ? 2 + pet.boredom * 2 : 0],
    ['sit', 2.5 + (1 - pet.energy) * 4 + (onLedge ? 2 : 0)],
    ['stretch', pet.energy < 0.6 ? 1.2 : 0.4],
    ['dance', pet.joy > 0.75 ? 0.6 : 0.1],
    ['pose', clips.byRole.pose ? (pet.joy > 0.6 ? 0.35 : 0.12) : 0],
    ['visit', b.walk && cursorNear(6) && now - cursor.t < 4000 ? 1.2 : 0],
  ];
  let total = options.reduce((s, o) => s + o[1], 0), r = Math.random() * total, choice = 'stand';
  for (const [name, w] of options) { if ((r -= w) <= 0) { choice = name; break; } }
  const sitting = pet.state === 'sit_edge' || pet.state === 'sit_floor';
  if (sitting && choice !== 'sit' && Math.random() < 0.6) { pet.next = now + rand(6000, 15000); return; }  // sitting is cosy
  switch (choice) {
    case 'look': gesture('look_around'); break;
    case 'think': setMood('thinking', 5, 0.6); break;
    case 'vibe': if (Math.random() < 0.4 && clips.byRole.dance) gesture('dance'); else { setMood('relaxed', 6, 0.8); gesture('rock'); } break;
    case 'watch': if (Math.random() < 0.6) sit(); setMood(pick(['relaxed', 'happy']), 6, 0.7); break;
    case 'fidget': gesture(pick(pet.energy < 0.5 ? ['shift', 'rock'] : ['shift', 'tap_foot', 'rock'])); break;
    case 'stretch': gesture(pet.energy < 0.4 ? 'yawn' : 'stretch'); break;
    case 'dance': gesture('dance'); break;
    case 'pose': gesture('pose'); break;
    case 'sit': sit(); break;
    case 'walk': { const span = surfaceSpan(); if (span) walkTo(rand(span[0], span[1])); break; }
    case 'visit': walkTo(clamp(cursor.x, pet.shoulderPx, W - pet.shoulderPx)); break;
    case 'climb': climbSomewhere(); break;
    default: if (sitting) setState('idle');
  }
  pet.boredom = Math.max(0, pet.boredom - 0.25);
  pet.next = now + rand(5000, 13000) * (0.6 + pet.energy * 0.6);
}
function cursorNear(k) { return cursor.x >= 0 && Math.hypot(cursor.x - pet.x, toWorldY(cursor.y) - (pet.y + pet.heightPx / 2)) < pet.heightPx * k; }
function gesture(name) {
  if (!GESTURES[name] && !clips.byRole[name]) return false;
  if (pet.state !== 'idle' && pet.state !== 'talk' && name !== 'wave' && name !== 'nod' && name !== 'shake') setState('idle');
  const clip = clips.byRole[name] ? playRole(name, { once: name !== 'pose' }) : false;   // a held pose loops its single frame
  const len = clip && clips.current ? clips.current.getClip().duration : 0;
  const still = clip && clips.current && clips.current.getClip().isPose;
  const hold = !clip ? 0 : still ? 4.5 + Math.random() * 2 : clamp(len - 0.3, 1.5, name === 'dance' ? 240 : name === 'pose' ? 14 : 10);   // single-frame poses are held
  if (name === 'pose') pet.yawTarget = 0;                       // pose for the user, not sideways
  pet.gesture = { name, t0: clock.t, clip, dur: clip ? hold : 0 };
  if (clip) {
    const action = clips.current;
    setTimeout(() => { if (clips.current === action && clips.currentRole === name) { setState('idle'); playRole('idle'); } }, hold * 1000);
  }
  return true;
}
function sit() {
  if (pet.surface.kind === 'window') setState('sit_edge');
  else if (pet.state !== 'sit_floor' && pet.state !== 'sit_down') { pet.sitVariant = pickSitVariant(); setState('sit_down'); }
  pet.yawTarget = 0;
}
function goSleep() {
  if (portrait.on) { setMood('sleepy', 3600); return; }                     // dozing in the bubble
  if (pet.surface.kind === 'window') setState('sleep_sit');
  else setState('sleep');
  pet.yawTarget = 0;
}
function wake(quick) {
  if (!pet.sleeping) return;
  setState('idle');
  pet.energy = Math.max(pet.energy, 0.5);
  if (!quick) setTimeout(() => gesture(Math.random() < 0.5 ? 'stretch' : 'yawn'), 400);
}
function walkTo(x) {
  const span = surfaceSpan();
  if (!span) return;
  pet.walkTo = clamp(x, span[0], span[1]);
  if (Math.abs(pet.walkTo - pet.x) < 8) return;
  setState('walk');
}
function climbSomewhere() {
  const head = pet.y;
  const reach = pet.heightPx * 1.7;
  const cands = world.ledges.filter((l) => !(pet.surface.kind === 'window' && l.id === pet.surface.id) && l.y - head < reach && l.y - head > -H);
  if (!cands.length) { const span = surfaceSpan(); if (span) walkTo(rand(span[0], span[1])); return; }
  const l = pick(cands);
  const tx = rand(l.x0 + pet.shoulderPx, Math.max(l.x0 + pet.shoulderPx, l.x1 - pet.shoulderPx));
  // walk under the ledge first when it is far away
  if (Math.abs(tx - pet.x) > pet.heightPx * 1.4) { pet.after = () => jumpTo(l, tx); walkTo(tx + (tx > pet.x ? -1 : 1) * pet.heightPx * 0.5); }
  else jumpTo(l, tx);
}
const G = () => 2600 * (settings.height / 340);
function jumpTo(ledge, tx) {
  setState('crouch', 0.28);
  pet.jumpTo = { ledge, tx };
}
function launchJump() {
  const { ledge, tx } = pet.jumpTo;
  const dy = ledge.y - pet.y;
  const apex = Math.max(dy, 0) + pet.heightPx * 0.35;
  const g = G();
  const vy = Math.sqrt(2 * g * apex);
  const tUp = vy / g, tDown = Math.sqrt(2 * Math.max(1, apex - dy) / g);
  pet.vx = (tx - pet.x) / (tUp + tDown);
  pet.vy = vy;
  pet.surface = { kind: 'air' };
  pet.target = ledge;
  setState('jump');
}

// ------------------------------------------------------------------ physics
function physics(dt) {
  const g = G();
  if (pet.state === 'fall' || pet.state === 'jump') {
    const prevY = pet.y;
    pet.vy -= g * dt;
    pet.x += pet.vx * dt; pet.y += pet.vy * dt;
    pet.vx *= Math.pow(0.6, dt);
    if (pet.x < pet.shoulderPx) { pet.x = pet.shoulderPx; pet.vx = Math.abs(pet.vx) * 0.45; }
    if (pet.x > W - pet.shoulderPx) { pet.x = W - pet.shoulderPx; pet.vx = -Math.abs(pet.vx) * 0.45; }
    if (pet.y > H - pet.heightPx * 0.4 && pet.vy > 0) { pet.vy = -pet.vy * 0.3; }
    if (pet.vy <= 0) {
      for (const l of world.ledges) {            // land on window edges when coming from above
        if (l.id === pet.dropFrom) continue;    // just stepped off this one
        if (pet.x >= l.x0 + 4 && pet.x <= l.x1 - 4 && prevY >= l.y - 1 && pet.y <= l.y) { land({ kind: 'window', id: l.id }, l.y); return; }
      }
      if (pet.y <= 0) { land({ kind: 'floor' }, 0); return; }
    }
    pet.tilt = clamp(-pet.vx * 0.0006, -0.6, 0.6);
  }
}
function land(surface, y) {
  const hard = pet.vy < -G() * 0.55;
  const lift = (pet.vy * pet.vy) / (2 * G());                              // how far she fell
  pet.surface = surface; pet.y = y; pet.vx = 0; pet.vy = 0; pet.tilt = 0; pet.dropFrom = null;
  pet.squash = hard ? 0.82 : 0.92;
  setState('land', hard ? 0.55 : 0.3);
  if (hard) setEmotion({ surprised: 0.6, sad: 0.3 }, 1.8);
  pet.target = null;
  onLanded(hard, lift);
}

// ------------------------------------------------------------------ interaction
const drag = { down: false, grabbed: false, sx: 0, sy: 0, ox: 0, oy: 0, hist: [] };
const inputLog = []; const logIn = (t, e) => { inputLog.push([Math.round(performance.now()), t, e ? Math.round(e.clientX) : -1, e ? Math.round(e.clientY) : -1, cursor.over ? 1 : 0, interactive ? 1 : 0, drag.down ? 1 : 0]); if (inputLog.length > 60) inputLog.shift(); };
const petting = { active: false, until: 0, lastX: 0, dir: 0, flips: [] };
canvas.addEventListener('mousemove', (e) => {
  const moved = Math.hypot(e.clientX - cursor.x, e.clientY - cursor.y);
  const nowM = performance.now(), dtM = nowM - (cursor.tMove || nowM);
  cursor.tMove = nowM;
  if (drag.grabbed) trackDrag(e.clientX - cursor.x, e.clientY - cursor.y, dtM);
  flinchCheck(e, moved, dtM);
  cursor.x = e.clientX; cursor.y = e.clientY;
  if (moved > 2) { cursor.t = performance.now(); pet.lastSeenUser = cursor.t; }
  if (portrait.drag) {
    if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 4) portrait.drag.moved = true;
    if (portrait.drag.moved) { portrait.cx = clamp(e.clientX + portrait.drag.ox, portrait.r + 4, W - portrait.r - 4); portrait.cy = clamp(e.clientY + portrait.drag.oy, portrait.r + 4, H - portrait.r - 4); }
  } else if (drag.down && !drag.grabbed && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6 && settings.behaviors.physics !== false) grab();
  if (drag.grabbed) { drag.hist.push([performance.now(), e.clientX, e.clientY]); if (drag.hist.length > 6) drag.hist.shift(); }
  // petting: back-and-forth strokes over the head
  if (cursor.over && !drag.down) {
    const head = headWorld(), wp = screenToWorldPx(e.clientX, e.clientY);
    if (Math.abs(wp.y - head.y) < pet.heightPx * 0.14 && Math.abs(wp.x - head.x) < pet.heightPx * 0.16) {
      const dir = Math.sign(e.clientX - petting.lastX);
      if (dir && dir !== petting.dir) { petting.flips.push(performance.now()); petting.dir = dir; }
      petting.flips = petting.flips.filter((t) => performance.now() - t < 1400);
      if (petting.flips.length >= 4) {
        if (!petting.active && performance.now() - touch.lastPat > 6000) {           // a new petting session
          touch.lastPat = performance.now(); bondUp(0.02);
          if (mem.bond > 0.7) { setMood('love', 3.5, 0.8); line('patLove'); } else line('pat');
        }
        petting.active = true; petting.until = performance.now() + 1500; pet.joy = Math.min(1, pet.joy + 0.01); if (pet.sleeping) wake(true);
      }
    }
    petting.lastX = e.clientX;
  }
});
canvas.addEventListener('mousedown', (e) => {
  logIn('down', e);
  if (!cursor.over || overButtons(e.clientX, e.clientY)) return;
  if (e.button === 2) { api.menu({ sleeping: pet.sleeping, recording: !!mic.rec }); return; }
  if (e.button !== 0) return;
  drag.down = true; drag.sx = e.clientX; drag.sy = e.clientY;
  if (portrait.on) portrait.drag = { ox: portrait.cx - e.clientX, oy: portrait.cy - e.clientY, moved: false };
  drag.ox = pet.x - e.clientX; drag.oy = pet.y - toWorldY(e.clientY);
});
window.addEventListener('mouseup', (e) => {
  logIn('up', e);
  if (portrait.drag) { const moved = portrait.drag.moved; portrait.drag = null; drag.down = false; if (moved) portraitSave(); else onTouch(e); return; }
  if (drag.grabbed) release();
  else if (drag.down) onTouch(e);
  drag.down = false;
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('mousedown', (e) => { if (e.target !== canvas) logIn('down@' + (e.target.id || e.target.tagName), e); }, true);
// Over the mic / speaker buttons the canvas gets no mousemove, so the cursor froze at its last
// canvas position and the window could stay click-through: the click fell to the desktop until the
// 250 ms poll caught up. Track the cursor over any element and make the window clickable at once.
document.addEventListener('mousemove', (e) => {
  if (e.target === canvas) return;
  cursor.x = e.clientX; cursor.y = e.clientY;
  if (!interactive && overButtons(e.clientX, e.clientY)) hitTest();
}, true);
function grab() {
  drag.grabbed = true; drag.hist = [];
  if (pet.sleeping) setEmotion({ surprised: 0.9 }, 2);
  pet.surface = { kind: 'air' };
  pet.walkTo = null; pet.after = null; pet.jumpTo = null;
  setState('held');
  pet.lastTouch = performance.now();
  onGrab();
}
function release() {
  drag.grabbed = false;
  onRelease();
  const h = drag.hist;
  if (h.length >= 2) {
    const a = h[0], b = h[h.length - 1];
    const dt = Math.max(0.016, (b[0] - a[0]) / 1000);
    pet.vx = clamp((b[1] - a[1]) / dt, -3000, 3000);
    pet.vy = clamp(-(b[2] - a[2]) / dt, -3000, 3000);
  }
  if (settings.behaviors.physics) setState('fall');
  else { pet.vx = pet.vy = 0; pet.surface = { kind: 'floor' }; pet.y = 0; setState('idle'); }
  if (Math.hypot(pet.vx, pet.vy) > 1500) setEmotion({ surprised: 0.9 }, 2.5); else setEmotion({ happy: 0.4 }, 1.5);
}
// hit test: interactive only over the character's pixels (or the bubble)
const pixel = new Uint8Array(4);
let interactive = false;
function hitTest() {
  if (cursor.x < 0) return;
  let over = false;
  if (portrait.on) over = inPortrait(cursor.x, cursor.y) || overButtons(cursor.x, cursor.y);   // bubble mode: pure geometry, no GPU read
  else if (pet.vrm) {
    const gx = Math.floor(cursor.x * dpr), gy = Math.floor((H - cursor.y) * dpr);
    if (gx >= 0 && gy >= 0 && gx < canvas.width && gy < canvas.height) {
      const gl = renderer.getContext();
      gl.readPixels(gx, gy, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      over = pixel[3] > 24 && !(contactShadow.visible && toWorldY(cursor.y) < pet.y + 3);   // the floor shadow is not her: clicks pass through
    }
  }
  cursor.over = over;
  // the bubble iframe cannot see the mouse while the window is click-through: test its box here
  if (bubble.visible) {
    const r = bubbleFrame.getBoundingClientRect();
    cursor.overBubble = cursor.x >= r.left + 10 && cursor.x <= r.right - 10 && cursor.y >= r.top + 10 && cursor.y <= r.bottom - 40;
  } else cursor.overBubble = false;
  const want = over || drag.down || drag.grabbed || cursor.overBubble;
  if (want !== interactive) { logIn(want ? 'int+' : 'int-', null); interactive = want; api.setInteractive(want); bubbleFrame.style.pointerEvents = cursor.overBubble ? 'auto' : 'none'; }
  canvas.style.cursor = drag.grabbed ? 'grabbing' : over ? 'grab' : 'default';
}
// cursor outside of our forwarded events (e.g. over the taskbar): poll occasionally
setInterval(async () => {
  try {
    const p = await api.cursor();
    if (Math.hypot(p.x - cursor.x, p.y - cursor.y) > 2) { cursor.x = p.x; cursor.y = p.y; cursor.t = performance.now(); }
  } catch {}
}, 250);

// ------------------------------------------------------------------ speech bubble (iframe with the live2D bubble)
const bubbleFrame = document.getElementById('bubble');
const bubble = { visible: false, ready: false, last: null, w: 330, h: 300 };
window.addEventListener('message', (e) => {
  const d = e.data;
  if (!d || d.source !== 'pet-bubble') return;
  if (d.ready) { bubble.ready = true; if (bubble.last) postBubble(bubble.last); }
  if (d.hidden) { bubble.visible = false; bubbleFrame.style.display = 'none'; }
  if (d.hover !== undefined) cursor.overBubble = !!d.hover && bubble.visible;
});
function postBubble(speech) {
  bubble.last = speech;
  if (!bubble.ready) return;
  bubbleFrame.contentWindow.postMessage({ source: 'pet-bubble', side: placeBubble(), speech }, '*');
}
function bubbleStyle() {
  const s = settings.speechBubble || {};
  return { fontFamily: 'Segoe UI', fontSize: s.fontSize || 14, fontColor: s.fontColor || '#f5f3fa', backgroundColor: s.backgroundColor || '#211e2a', opacity: s.opacity || 0.94, mode: s.mode || 'bubble', hideAfter: typeof s.hideAfter === 'number' ? s.hideAfter : 10, orb: s.orb || {} };
}
function placeBubble() {
  const orb = (settings.speechBubble || {}).mode === 'orb';
  bubble.w = orb ? 200 : 330; bubble.h = orb ? 200 : 300;
  const head = headWorld();
  let hx = head.x, hy = H - head.y;
  if (portrait.on) { hx = portrait.cx - portrait.r * 0.6; hy = portrait.cy - portrait.r * 0.4; }
  let side = 'right';
  let left = hx - bubble.w - pet.heightPx * 0.08;
  if (left < 8) { left = hx + pet.heightPx * 0.08; side = 'left'; }
  const top = clamp(hy - bubble.h * 0.25, 8, H - bubble.h - 8);
  bubbleFrame.style.width = bubble.w + 'px'; bubbleFrame.style.height = bubble.h + 'px';
  bubbleFrame.style.left = Math.round(left) + 'px'; bubbleFrame.style.top = Math.round(top) + 'px';
  return side;
}
function onSpeech(args) {
  const text = String(args.text || '');
  const final = args.final !== false;
  const phase = String(args.phase || 'answer');
  const status = String(args.status || '');
  pet.phase = phase === 'answer' ? (final ? 'idle' : 'answer') : phase === 'idle' ? 'idle' : phase;
  if (phase === 'answer' || phase === 'idle') { /* keep pose */ }
  const voiceOn = !!(settings.voice && settings.voice.enabled);
  // the voice is not cut when she goes on to think / use a tool: the sentence already said plays to the end
  if (phase === 'answer' && text && voiceOn) speakStream(text, final);
  // lip-sync: speak the new part of the answer (with a voice: the mouth waits for the voice)
  if (phase === 'answer' && text && !voiceOn) {
    if (!text.startsWith(face.speech.slice(0, 30))) { face.speech = ''; face.spoken = 0; }
    face.speech = text;
  }
  if (phase === 'answer' && final && text) {
    const cap = captionText(text);
    setEmotion(emotionFromText(text), 6); playStage(cap.acts);
  }
  if (phase === 'thinking') pet.lastTouch = performance.now();
  if (phase === 'idle') { if (!pet.talking) face.speech = ''; }
  const sb = settings.speechBubble || {};
  if (!sb.enabled || !pet.vrm) return;
  if (subtitlesOn()) {                                                       // Kyndred-style captions instead of the bubble
    bubbleFrame.style.display = 'none'; bubble.visible = false;
    if (phase === 'thinking' || phase === 'tool') { subsReset(); subs.lastText = ''; subsStatus(phase, status); }
    else if (phase === 'answer') {
      if (!text.startsWith((subs.lastText || '').slice(0, 30))) subsReset();
      subs.lastText = text;
      subsStatus(final ? 'idle' : 'answer');
      if (!voiceOn) subsFeed(text, final);
    } else if (phase === 'idle') subsStatus('idle');
    return;
  }
  if (phase === 'idle') { if (bubble.lastPhase !== 'answer') { bubbleFrame.style.display = 'none'; bubble.visible = false; } return; }
  if (!text && !status) return;
  bubble.lastPhase = phase;
  bubble.visible = true;
  bubbleFrame.style.display = 'block';
  postBubble({ text, final, phase, status, style: bubbleStyle() });
}


// ------------------------------------------------------------------ voice (same as live2D: Kokoro-ru)
// The answer is cut into sentences; each is synthesised by the local Kokoro server (the one the
// live2D companion uses) while the previous one plays, so speech starts quickly and has no gaps.
// The mouth opens with the real loudness of the audio, its shape follows the letters of the
// sentence at the playback position. Only the chosen engine plays (no switching to another voice).
const voice = { speaking: false, limit: Infinity, audio: null, queue: [], pump: -1 };
const aud = { ctx: null, gain: null, analyser: null, buf: null, source: null, gen: 0, sink: null, peak: 0.05 };
function audioOut() {
  if (!aud.ctx) {
    aud.ctx = new AudioContext();
    aud.gain = aud.ctx.createGain();
    aud.analyser = aud.ctx.createAnalyser(); aud.analyser.fftSize = 1024;
    aud.buf = new Float32Array(aud.analyser.fftSize);
    aud.analyser.connect(aud.gain); aud.gain.connect(aud.ctx.destination);        // measure before the volume: the mouth does not depend on it
  }
  const dev = settings.voiceDevices || {};
  aud.gain.gain.value = settings.voice && settings.voice.muted ? 0 : (dev.outputVolume == null ? 70 : dev.outputVolume) / 100;
  const sink = dev.outputDeviceId || '';
  if (sink !== aud.sink && aud.ctx.setSinkId) { aud.sink = sink; aud.ctx.setSinkId(sink).catch(() => {}); }
  if (aud.ctx.state === 'suspended') aud.ctx.resume().catch(() => {});
  return aud.ctx;
}
function audioLevel() {
  if (!aud.analyser) return 0;
  aud.analyser.getFloatTimeDomainData(aud.buf);
  let sum = 0;
  for (let i = 0; i < aud.buf.length; i++) sum += aud.buf[i] * aud.buf[i];
  return Math.sqrt(sum / aud.buf.length);
}
/** True when the answer carries something meant for the eyes (a genui widget, a table, JSON, code). */
const VISUAL_RE = /```|^\s*\|.*\|\s*$/m;
/**
 * Text without what is only for the screen: genui widgets (```schemaJson …```) and JSON are silent,
 * other code is "фрагмент кода", markdown tables are dropped. A block still being streamed (its
 * closing ``` not there yet) is cut too — before, its JSON was read aloud while the answer streamed.
 */
function unblock(text) {
  return String(text || '')
    .replace(/```([\w-]*)[^\n]*\n?[\s\S]*?```/g, (m, lang) => (/^(schemajson|json|jsonc|genui|ui|yaml|xml|html|svg|csv|mermaid)$/i.test(lang || '') ? ' ' : ' (фрагмент кода) '))
    .replace(/```[\s\S]*$/, ' ')
    .replace(/^\s*\|.*$/gm, ' ')                                                      // table rows (and a row still streaming)
    .replace(/^\s*("[^"\n]{1,60}"\s*:.*|[{}[\]],?)\s*$/gm, ' ');                      // bare JSON lines outside a block
}
function speakable(text) {
  return unblock(text)
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ссылка ')
    .replace(/[*_#>|~]+/g, ' ')
    .replace(/\p{Extended_Pictographic}/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
/** Sentences of at most ~220 characters (short ones merged). */
function speechParts(text) {
  const out = [];
  for (const piece of text.split(/(?<=[.!?…])\s+/)) {
    let rest = piece.trim();
    while (rest.length > 240) { const cut = Math.max(rest.lastIndexOf(', ', 220), rest.lastIndexOf(' ', 220), 120); out.push(rest.slice(0, cut + 1).trim()); rest = rest.slice(cut + 1).trim(); }
    if (!rest) continue;
    if (out.length && out[out.length - 1].length + rest.length < 90) out[out.length - 1] += ' ' + rest; else out.push(rest);
  }
  return out;
}
/** Speak a whole text now (reactions, test phrase): interrupts what she was saying. */
function speak(text) {
  const say = speakable(text).slice(0, 2500);
  if (!say || !api.synthesize) return false;
  stopVoice();
  voiceEnqueue(speechParts(say));
  return true;
}
// Streaming: while the agent is still writing, every finished sentence goes to the voice queue at
// once, so she starts speaking after the first sentence instead of after the whole answer.
const vstream = { raw: '', done: 0, said: false, lastFinal: '', lastAt: 0 };
function speakStream(text, final) {
  const now = performance.now();
  if (vstream.lastFinal && now - vstream.lastAt < 5000 && vstream.lastFinal.startsWith(text)) return;   // a repeat / late update of the answer just finished
  if (final) { vstream.lastFinal = text; vstream.lastAt = now; }
  if (vstream.stopped) {                                                   // after "стоп": not this answer again
    if (vstream.stopped === '\u0000' ? now - (vstream.stoppedAt || 0) < 4000 : text.startsWith(vstream.stopped)) return;
    vstream.stopped = '';
  }
  const clean = captionText(text).text;
  if (!vstream.raw || !text.startsWith(vstream.raw.slice(0, 30))) { vstream.done = 0; vstream.said = false; }   // a new answer / step: queued after what is still playing
  vstream.raw = text;
  if (vstream.done > clean.length) vstream.done = clean.length;
  const rest = clean.slice(vstream.done);
  let upto = rest.length;
  if (!final) {
    // up to the last sentence end followed by more text (the last piece may still grow)
    upto = 0;
    const re = /[.!?…:]+["»)]?\s+/g; let m;                          // ":" too — "Вот список:" before a table / list
    while ((m = re.exec(rest))) upto = m.index + m[0].length;
    // the very first piece: do not wait for a long sentence to end, cut at a comma
    if (!upto && vstream.done === 0 && rest.length > 90) { const c = rest.lastIndexOf(', ', 140); if (c > 30) upto = c + 2; }
    if (upto && upto < 12 && rest.length < 40) upto = 0;               // "1. " / "Да. " alone: wait a little for more
  }
  const piece = rest.slice(0, upto).trim();
  vstream.done += upto;
  if (piece) { voiceEnqueue(speechParts(piece)); vstream.said = true; }
  // only a table / widget and no words: a short line instead of silence
  if (final && !vstream.said && VISUAL_RE.test(text)) voiceEnqueue(['Готово, смотри на экране.']);
  if (final) { vstream.raw = ''; vstream.said = false; }
}
function voiceEnqueue(parts) {
  if (!parts.length || !api.synthesize) return;
  voice.queue.push(...parts);
  voice.speaking = true;
  if (voice.pump !== aud.gen) voicePump(aud.gen);
}
function synthOne(t, engine) {
  const v = settings.voice || {};
  return (engine === 'edge'
    ? api.synthesize({ engine: 'edge', text: t, voice: v.edgeVoice || 'ru-RU-SvetlanaNeural', rate: v.edgeRate == null ? 10 : v.edgeRate, pitch: v.edgePitch == null ? 15 : v.edgePitch })
    : engine === 'silero'
      ? api.synthesize({ engine: 'silero', text: t, voice: v.sileroVoice || 'xenia', speed: v.sileroSpeed || 1 })
      : api.synthesize({ text: t, voice: v.kokoroVoice || 'sveta', speed: v.speed || 1 })).catch((e) => ({ ok: false, error: String(e) }));
}
/** Only the chosen engine, never another voice: one retry, then the sentence is skipped. */
async function synthWithFallback(t) {
  const engine = ['edge', 'kokoro'].includes((settings.voice || {}).engine) ? settings.voice.engine : 'silero';   // Silero by default
  let r = await synthOne(t, engine);
  if (r && r.ok) return r;
  log('voice ' + engine + ': ' + (r && r.error));
  r = await synthOne(t, engine);
  if (!r || !r.ok) log('voice ' + engine + ' retry: ' + (r && r.error));
  return r;
}
/** Plays the queue in order; the next sentence is synthesised while the current one plays. */
async function voicePump(gen) {
  voice.pump = gen;
  const ahead = [];                                                  // [{ t, p }] in flight, in order
  const fill = () => { while (ahead.length < 2 && voice.queue.length) { const t = voice.queue.shift(); ahead.push({ t, p: synthWithFallback(t) }); } };
  while (gen === aud.gen) {
    fill();
    if (!ahead.length) break;
    const { t, p } = ahead.shift();
    const r = await p;
    if (gen !== aud.gen) return;
    fill();
    if (!r || !r.ok) continue;
    try {
      const ctx = audioOut();
      const buffer = await ctx.decodeAudioData(r.audio);
      if (gen !== aud.gen) return;
      await new Promise((resolve) => {
        const src = ctx.createBufferSource();
        src.buffer = buffer; src.connect(aud.analyser);
        src.onended = resolve;
        aud.source = src;
        face.speech = t; face.spoken = 0; face.charT = 0;
        voice.audio = { t0: ctx.currentTime, dur: buffer.duration };
        src.start();
      });
    } catch (e) { log('voice play: ' + (e && e.message)); }
    voice.audio = null;
  }
  if (gen !== aud.gen) return;
  voice.pump = -1;
  voice.speaking = false;
  face.spoken = face.speech.length;
}
function stopVoice() {
  aud.gen++;
  voice.queue = [];
  try { if (aud.source) aud.source.stop(); } catch {}
  aud.source = null; voice.audio = null;
  voice.speaking = false; voice.limit = Infinity;
}
/** Mouth while an audio sentence plays: letters at the playback position, opening = loudness. */
function audioMouth(m) {
  const a = voice.audio;
  if (!a || !aud.ctx) return false;
  const p = clamp((aud.ctx.currentTime - a.t0) / Math.max(0.05, a.dur), 0, 1);
  face.spoken = Math.min(face.speech.length, Math.floor(p * face.speech.length));
  const ch = (face.speech[face.spoken] || ' ').toLowerCase();
  const lvl = audioLevel();
  aud.peak = Math.max(lvl, aud.peak * 0.997, 0.02);                          // loudness relative to the recent peak
  const open = clamp((lvl / aud.peak - 0.12) / 0.6, 0, 1);
  const vis = VOWELS[ch] || (open > 0.25 ? 'aa' : null);
  if (vis) m[vis] = Math.max(m[vis] || 0, 0.9 * open);
  else m.ih = Math.max(m.ih || 0, 0.25 * open);
  pet.talking = true;
  return true;
}

// ------------------------------------------------------------------ microphone (menu: talk to the agent)
// Same as live2D: record from the chosen microphone, then Whisper turns it into text that goes
// into the DSH message box. While she listens she tilts her head and looks at the user.
const mic = { rec: null };
async function micToggle() {
  if (mic.rec) return micStop(true);
  stopVoice();
  const dev = settings.voiceDevices || {};
  let stream;
  try {
    const audio = { channelCount: 1, echoCancellation: true, noiseSuppression: true };
    if (dev.inputDeviceId) audio.deviceId = { ideal: dev.inputDeviceId };
    stream = await navigator.mediaDevices.getUserMedia({ audio });
  } catch (e) { line2('Не слышу микрофон: ' + ((e && e.name) || 'ошибка')); return; }
  const ctx = new AudioContext();
  const src = ctx.createMediaStreamSource(stream);
  const gain = ctx.createGain(); gain.gain.value = (dev.inputVolume == null ? 100 : dev.inputVolume) / 100;
  const proc = ctx.createScriptProcessor(4096, 1, 1);
  const chunks = [];
  proc.onaudioprocess = (e) => {
    const d = e.inputBuffer.getChannelData(0);
    chunks.push(new Float32Array(d));
    if (chunks.length * 4096 > 60 * ctx.sampleRate) micStop(true);           // one minute at most
  };
  src.connect(gain); gain.connect(proc); proc.connect(ctx.destination);
  mic.rec = { stream, ctx, proc, chunks, rate: ctx.sampleRate };
  line2('🎙 Слушаю… (ещё раз «Микрофон» в меню — отправить)');
}
async function micStop(send) {
  const r = mic.rec;
  if (!r) return;
  mic.rec = null;
  try { r.proc.disconnect(); r.stream.getTracks().forEach((t) => t.stop()); r.ctx.close(); } catch {}
  if (!send) return;
  const total = r.chunks.reduce((n, c) => n + c.length, 0);
  if (total < r.rate * 0.4) { line2('Слишком коротко — скажите ещё раз.'); return; }
  line2('Распознаю…');
  const res = await api.voiceTurn(wav16k(r.chunks, total, r.rate)).catch((e) => ({ ok: false, error: String(e) }));
  line2(res && res.ok && res.text ? '«' + res.text + '»' : 'Не получилось: ' + ((res && res.error) || 'ошибка'));
}
/** Mono 16 kHz 16-bit WAV from float chunks. */
function wav16k(chunks, total, rate) {
  const joined = new Float32Array(total);
  let o = 0; for (const c of chunks) { joined.set(c, o); o += c.length; }
  const ratio = rate / 16000, n = Math.floor(total / ratio);
  const buf = new ArrayBuffer(44 + n * 2), dv = new DataView(buf);
  const w = (off, str) => { for (let i = 0; i < str.length; i++) dv.setUint8(off + i, str.charCodeAt(i)); };
  w(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, 16000, true); dv.setUint32(28, 32000, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const a = Math.floor(i * ratio), b = Math.min(total, Math.floor((i + 1) * ratio));
    let sum = 0; for (let j = a; j < b; j++) sum += joined[j];
    dv.setInt16(44 + i * 2, clamp(sum / Math.max(1, b - a), -1, 1) * 0x7fff, true);
  }
  return buf;
}
/** A status line in the bubble (microphone state), regardless of the touch-lines setting. */
function line2(text) {
  const sb = settings.speechBubble || {};
  if (!sb.enabled || !pet.vrm) return;
  if (subtitlesOn()) { subsSay(text, mic.rec ? 60 : 4); return; }
  bubble.visible = true; bubble.lastPhase = 'reaction';
  bubbleFrame.style.display = 'block';
  postBubble({ text, final: true, phase: 'answer', status: '', style: { ...bubbleStyle(), hideAfter: mic.rec ? 0 : 4 } });
}
if (api.onVoiceToggle) api.onVoiceToggle(() => micToggle());

// ------------------------------------------------------------------ hands-free listening ("Алиса, …")
// Always on when enabled: a simple voice-activity detector cuts the microphone into phrases. Each
// phrase goes to the companion process, which recognises it and sends it to the agent only when it
// names her (or right after she answered). Silent while she speaks, so she does not hear herself.
const ear = { on: false, stream: null, ctx: null, proc: null, pre: [], buf: [], speaking: false, voiced: 0, silent: 0, total: 0, floor: 0.004, rate: 48000, busy: false, waiting: [], nameUntil: 0, barge: false, devId: '', followUntil: 0, wasSpeaking: false, quietUntil: 0 };
async function earStart() {
  if (ear.on) return;
  ear.on = true;
  const dev = settings.voiceDevices || {};
  try {
    const audio = { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true };
    if (dev.inputDeviceId) audio.deviceId = { ideal: dev.inputDeviceId };
    ear.stream = await navigator.mediaDevices.getUserMedia({ audio });
  } catch (e) { ear.on = false; line2('Не слышу микрофон: ' + ((e && e.name) || 'ошибка')); return; }
  if (!ear.on) { ear.stream.getTracks().forEach((t) => t.stop()); return; }
  ear.devId = dev.inputDeviceId || '';
  ear.ctx = new AudioContext();
  ear.rate = ear.ctx.sampleRate;
  const src = ear.ctx.createMediaStreamSource(ear.stream);
  ear.proc = ear.ctx.createScriptProcessor(2048, 1, 1);
  ear.proc.onaudioprocess = (e) => earChunk(new Float32Array(e.inputBuffer.getChannelData(0)));
  src.connect(ear.proc); ear.proc.connect(ear.ctx.destination);
}
function earStop() {
  ear.on = false;
  try { if (ear.proc) ear.proc.disconnect(); if (ear.stream) ear.stream.getTracks().forEach((t) => t.stop()); if (ear.ctx) ear.ctx.close(); } catch {}
  ear.proc = ear.stream = ear.ctx = null;
  earReset();
}
function earReset() { ear.buf = []; ear.speaking = false; ear.voiced = 0; ear.silent = 0; ear.total = 0; }
function earChunk(d) {
  const now = performance.now();
  if (mic.rec) { earReset(); ear.pre = []; return; }                                   // push-to-talk has the microphone
  // While she speaks the microphone only waits for "стоп": a short, loud phrase (her own voice
  // leaking from the speakers is quieter and long, so it is dropped before any recognition).
  const barge = voice.speaking || !!voice.audio || now < ear.quietUntil;
  if (barge !== ear.barge) { earReset(); ear.pre = []; ear.barge = barge; }
  let sum = 0; for (let i = 0; i < d.length; i++) sum += d[i] * d[i];
  const rms = Math.sqrt(sum / d.length);
  if (!ear.speaking && !barge) ear.floor = clamp(ear.floor * 0.995 + rms * 0.005, 0.0015, 0.05);
  const thr = barge ? Math.max(0.035, ear.floor * 8) : Math.max(0.012, ear.floor * 3.2);
  const n = d.length;
  if (!ear.speaking) {
    ear.pre.push(d); while (ear.pre.length * n > 0.45 * ear.rate) ear.pre.shift();          // a little before the onset
    if (rms > thr) ear.voiced += n; else ear.voiced = Math.max(0, ear.voiced - n);
    if (ear.voiced > 0.16 * ear.rate) {
      ear.speaking = true; ear.buf = ear.pre.slice(); ear.total = ear.buf.length * n; ear.pre = []; ear.silent = 0;
      if (!barge && api.voiceOnset) api.voiceOnset();                       // the companion reads the screen while the user speaks
    }
    return;
  }
  ear.buf.push(d); ear.total += n;
  if (rms > thr * 0.8) ear.silent = 0; else ear.silent += n;
  if (barge) {
    if (ear.total > 3 * ear.rate) { earReset(); return; }                    // too long for "Алиса, стоп": her own speech
    if (ear.silent > 0.4 * ear.rate) earPhrase(true);
    return;
  }
  if (ear.silent > 0.6 * ear.rate || ear.total > 15 * ear.rate) earPhrase();   // 0.6 s of silence ends the phrase
}
/** "Стоп" was heard: her voice stops at once, the agent's run is cancelled by the DSH client. */
function onStopCommand() {
  stopVoice();
  vstream.stopped = vstream.raw ? vstream.raw.slice(0, 30) : '\u0000';   // the rest of this answer stays silent
  vstream.stoppedAt = performance.now();
  vstream.raw = ''; vstream.done = 0; vstream.said = false;
  ear.followUntil = 0; ear.nameUntil = 0;
  setMood('surprised', 1.2, 0.4);
  line2('🎙 Остановила.');
}
async function earPhrase(onlyStop) {
  const chunks = ear.buf, total = ear.total;
  earReset();
  if (total < (onlyStop ? 0.35 : 0.6) * ear.rate) return;
  // a phrase said while the previous one is still being recognised waits its turn (not dropped)
  ear.waiting = ear.waiting || [];
  const item = { wav: wav16k(chunks, total, ear.rate), onlyStop: !!onlyStop };
  if (ear.busy) { if (ear.waiting.length < 2) ear.waiting.push(item); return; }
  ear.busy = true;
  let cur = item;
  while (cur) {
    const follow = performance.now() < ear.nameUntil || (settings.listen && settings.listen.follow !== false && performance.now() < ear.followUntil);
    try {
      const res = await api.voiceListen(cur.wav, follow, cur.onlyStop);
      if (res && res.stop) onStopCommand();
      else if (res && res.sent) {
        ear.followUntil = 0; ear.nameUntil = 0; ear.sentAt = performance.now();
        pet.lastSeenUser = performance.now(); if (pet.sleeping) wake(true);
        setMood('thinking', 4, 0.6);
        if (!subtitlesOn() || !pet.talking) line2('🎙 «' + res.phrase + '»');
      } else if (res && res.named) {                                       // just her name: the next phrase is for her
        ear.nameUntil = performance.now() + 7000;
        pet.lastSeenUser = performance.now(); if (pet.sleeping) wake(true);
        setMood('surprised', 1.5, 0.4);
        line2('🎙 Слушаю…');
      } else if (res && !res.ok && res.error) {
        console.warn('listen: ' + res.error);
        if (performance.now() - (ear.errAt || -1e9) > 30000) { ear.errAt = performance.now(); line2('🎙 Не могу распознать: ' + res.error); }   // otherwise the mic looks on but nothing happens
      }
    } catch (e) { console.warn('listen: ' + e); }
    cur = ear.waiting.shift();
  }
  ear.busy = false;
}
function earTick(now) {
  const want = !!(settings.listen && settings.listen.enabled) && !settings.hidden;
  if (want && ear.on && (settings.voiceDevices || {}).inputDeviceId !== undefined && ((settings.voiceDevices || {}).inputDeviceId || '') !== ear.devId) earStop();   // the microphone changed
  if (want && !ear.on) earStart();
  else if (!want && ear.on) earStop();
  const talking = voice.speaking || !!voice.audio;
  if (ear.wasSpeaking && !talking) { ear.followUntil = now + 8000; ear.quietUntil = now + 350; }   // a reply without her name for a few seconds after she spoke
  ear.wasSpeaking = talking;
}



// ------------------------------------------------------------------ subtitles (Kyndred-style output)
// Instead of the bubble: one or two lines in a small dark pill at the character. Words appear in
// sync with the voice (Kokoro / Windows) or, without a voice, at a reading pace sentence by
// sentence; while the agent thinks or works, a tiny status pill with dots. Stage directions
// (*laughs*, (вздыхает)) are taken out of the text and played as gestures.
const subsEl = document.getElementById('subs');
const subs = { queue: [], cur: '', start: 0, doneAt: 0, fed: 0, html: '', words: 0, hideAt: 0, status: '', sayUntil: 0, phase: 'idle' };
// in the bubble (round portrait) the text always runs as captions above the ring, word by word with the voice
const subtitlesOn = () => { const sb = settings.speechBubble || {}; return sb.enabled !== false && (sb.mode === 'subtitles' || portrait.on); };
const STAGE = [
  [/смеётся|смеется|смех|хохочет|laughs?|laughing/i, () => gesture('giggle')],
  [/хихика|giggles?/i, () => gesture('giggle')],
  [/вздыха|sighs?/i, () => setEmotion({ sad: 0.45, relaxed: 0.3 }, 2)],
  [/зева|yawns?/i, () => gesture('yawn')],
  [/улыба|smiles?/i, () => setEmotion({ happy: 0.7 }, 2.5)],
  [/кива|nods?/i, () => gesture('nod')],
  [/маш|waves?/i, () => gesture('wave')],
  [/подмиг|winks?/i, () => { face.forceBlink = true; setEmotion({ happy: 0.6 }, 1.5); }],
  [/краснеет|смущ|blush/i, () => setMood('shy', 3)],
];
const STAGE_RE = /\*([^*\n]{2,40})\*|\(([^()\n]{3,30})\)|\[([^\[\]\n]{3,30})\]/g;
/** Text for captions/voice without markdown and stage directions; the directions are returned too. */
function captionText(text) {
  const acts = [];
  const clean = unblock(text).replace(STAGE_RE, (m, a, b, c) => {               // no stage directions picked out of JSON / tables
    const w = (a || b || c || '').trim();
    if (STAGE.some(([re]) => re.test(w))) { acts.push(w); return ' '; }
    return a ? w : m;                                   // *emphasis* that is not an action stays as a word
  });
  return { text: speakable(clean), acts };
}
function playStage(acts) { for (const w of acts) { const hit = STAGE.find(([re]) => re.test(w)); if (hit) { hit[1](); break; } } }
function sentencesOf(text) { return text.split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean); }
/** Agent answer streaming in: queue each finished sentence once. */
function subsFeed(text, final) {
  const { text: clean } = captionText(text);
  const parts = sentencesOf(clean);
  const ready = final ? parts.length : Math.max(0, parts.length - 1);     // the last piece may still grow
  for (let i = subs.fed; i < ready; i++) subs.queue.push(parts[i]);
  subs.fed = Math.max(subs.fed, ready);
}
function subsReset() { subs.queue = []; subs.cur = ''; subs.fed = 0; subs.words = 0; subs.html = ''; }
/** A short line (touch reaction, microphone state) shown right away. */
function subsSay(text, seconds = 3) { subsReset(); subs.cur = String(text); subs.start = performance.now() - 1e6; subs.doneAt = performance.now(); subs.sayUntil = performance.now() + seconds * 1000; }
function subsStatus(phase, status) { subs.phase = phase; subs.status = status || ''; }
const escHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function subsRender(visible, isStatus) {
  const html = isStatus ? visible : visible.map((w, i) => (i >= subs.words ? `<span class="w">${escHtml(w)}</span>` : escHtml(w))).join(' ');
  if (html !== subs.html) { subsEl.innerHTML = html; subs.html = html; if (!isStatus) subs.words = visible.length; }
  subsEl.classList.toggle('status', !!isStatus);
}
function subsTick() {
  if (!subtitlesOn() || !pet.vrm || settings.hidden) { if (subsEl.style.display !== 'none') { subsEl.style.display = 'none'; subsEl.classList.remove('on'); } return; }
  const now = performance.now();
  const sb = settings.speechBubble || {};
  let words = null, statusHtml = '';
  if (voice.speaking && face.speech) {
    // follow the voice: the words of the sentence being spoken, up to the current position
    const upto = face.speech.slice(0, face.spoken + 1);
    const cut = upto.length >= face.speech.length ? face.speech : upto.replace(/\S+$/, '');
    words = cut.split(/\s+/).filter(Boolean);
    if (face.speech !== subs.cur) { subs.cur = face.speech; subs.words = 0; subs.html = ''; }
  } else {
    if (!subs.cur && subs.queue.length) { subs.cur = subs.queue.shift(); subs.start = now; subs.words = 0; subs.html = ''; subs.doneAt = 0; }
    if (subs.cur) {
      const all = subs.cur.split(/\s+/).filter(Boolean);
      let chars = (now - subs.start) / 42, n = 0;                       // ~24 characters a second
      while (n < all.length && chars >= all[n].length + 1) { chars -= all[n].length + 1; n++; }
      words = all.slice(0, Math.max(1, n));
      if (n >= all.length && !subs.doneAt) subs.doneAt = now;
      const dwell = subs.sayUntil > now ? subs.sayUntil - subs.doneAt : clamp(subs.cur.length * 38, 1400, 4200);
      if (subs.doneAt && now - subs.doneAt > dwell) { subs.cur = ''; subs.words = 0; subs.html = ''; words = null; }
    }
  }
  if (!words || !words.length) {
    if (subs.phase === 'thinking' || subs.phase === 'tool' || subs.phase === 'answer') {
      const label = subs.phase === 'tool' ? (subs.status || 'работает') : subs.phase === 'answer' ? '' : 'думает';
      statusHtml = `<span class="dots"><i></i><i></i><i></i></span>${label ? `<span class="lbl">${escHtml(label.slice(0, 40))}</span>` : ''}`;
    }
  }
  const show = !!(words && words.length) || !!statusHtml;
  if (!show) { subsEl.classList.remove('on'); if (subs.hideAt === 0) subs.hideAt = now; if (now - subs.hideAt > 300) subsEl.style.display = 'none'; return; }
  subs.hideAt = 0;
  if (words) {
    let w = words;
    let len = w.join(' ').length;
    while (len > 110 && w.length > 3) { w = w.slice(1); len = w.join(' ').length; }   // long sentence: keep the newest words (two lines)
    if (w.length < words.length) subs.words = Math.max(0, subs.words - (words.length - w.length));
    subsRender(w.length < words.length ? ['…'].concat(w) : w, false);
  } else subsRender(statusHtml, true);
  subsEl.style.background = hexA(sb.backgroundColor || '#18151c', sb.opacity == null ? 0.88 : sb.opacity);
  subsEl.style.color = sb.fontColor || '#f7f5fb';
  subsEl.style.fontSize = (sb.fontSize || 14) + 'px';
  if (subsEl.style.display !== 'block') subsEl.style.display = 'block';
  subsEl.classList.add('on');
  // above the head; below the feet when there is no room up there
  const head = headWorld(), r = pet.heightPx * 0.085;
  const wEl = subsEl.offsetWidth, hEl = subsEl.offsetHeight;
  let top = (H - head.y) - r * 2.1 - hEl, cx = head.x;
  if (portrait.on) { cx = portrait.cx; top = portrait.cy - portrait.r - hEl - 10; if (top < 8) top = portrait.cy + portrait.r + 10; }
  else if (top < 8) top = (H - pet.y) + 8;
  const left = clamp(cx - wEl / 2, 8, W - wEl - 8);
  subsEl.style.left = Math.round(left) + 'px'; subsEl.style.top = Math.round(Math.min(top, H - hEl - 8)) + 'px';
}
function hexA(hex, a) { const n = parseInt(String(hex).slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }

// ------------------------------------------------------------------ emotion symbols at the head
// Little symbols pop around the head while a mood is on: sparkles (joy), hearts (tenderness),
// a sweat drop (shy, scared, sad), an anger mark (angry, sulky), ?, Zz, a dizzy swirl, ♪.
const fxEl = document.getElementById('fx');
const SYM = {
  sparkle: '<svg viewBox="-12 -12 24 24"><path d="M0-11 2.4-2.4 11 0 2.4 2.4 0 11-2.4 2.4-11 0-2.4-2.4Z" fill="#ffe14d" stroke="#fff6b8" stroke-width=".8"/></svg>',
  heart: '<svg viewBox="-12 -12 24 24"><path d="M0 9C-9 3-10-3-6.5-6.5-4-9 0-7 0-4.5 0-7 4-9 6.5-6.5 10-3 9 3 0 9Z" fill="#ff6fa5" stroke="#ffd0e2" stroke-width=".8"/></svg>',
  sweat: '<svg viewBox="-12 -12 24 24"><path d="M0-10C3-4 6 0 6 4A6 6 0 0 1-6 4C-6 0-3-4 0-10Z" fill="#8fd3ff" stroke="#e6f6ff" stroke-width="1"/><ellipse cx="-2" cy="3" rx="1.4" ry="2.2" fill="#fff" opacity=".8"/></svg>',
  anger: '<svg viewBox="-12 -12 24 24" fill="none" stroke="#ff4b4b" stroke-width="2.6" stroke-linecap="round"><path d="M-2-9C-2-4-4-2-9-2M2-9C2-4 4-2 9-2M-2 9C-2 4-4 2-9 2M2 9C2 4 4 2 9 2"/></svg>',
  question: '<svg viewBox="-12 -12 24 24"><text x="0" y="8" text-anchor="middle" font-size="22" font-weight="700" font-family="Segoe UI" fill="#b9a6ff" stroke="#fff" stroke-width=".6">?</text></svg>',
  exclaim: '<svg viewBox="-12 -12 24 24"><text x="0" y="8" text-anchor="middle" font-size="22" font-weight="800" font-family="Segoe UI" fill="#ffcf3f" stroke="#fff" stroke-width=".6">!</text></svg>',
  zz: '<svg viewBox="-12 -12 24 24"><text x="-3" y="6" text-anchor="middle" font-size="15" font-weight="700" font-family="Segoe UI" fill="#a9c8ff">Z</text><text x="6" y="-3" text-anchor="middle" font-size="10" font-weight="700" font-family="Segoe UI" fill="#a9c8ff">z</text></svg>',
  swirl: '<svg viewBox="-12 -12 24 24" fill="none" stroke="#c9a6ff" stroke-width="2" stroke-linecap="round"><path d="M0 0C2 0 2 3 0 3-3 3-4-1-1-3 3-5 7-1 5 3 3 8-5 8-7 3-9-3-4-9 2-9"/></svg>',
  note: '<svg viewBox="-12 -12 24 24"><path d="M3-9V4A3 3 0 1 1 1 1V-6L8-8V-4L3-2.6" fill="#7fd6b8" stroke="#7fd6b8" stroke-width="1.4" stroke-linejoin="round"/></svg>',
};
const MOOD_SYMS = {
  happy: ['sparkle'], excited: ['sparkle', 'exclaim'], love: ['heart'], proud: ['sparkle'], relaxed: ['note'],
  thinking: ['question'], surprised: ['exclaim'], scared: ['sweat', 'exclaim'], shy: ['sweat', 'heart'], sad: ['sweat'],
  pout: ['anger'], angry: ['anger'], sleepy: ['zz'], dizzy: ['swirl'],
};
const fx = { next: 0, last: '' };
function spawnSym(kind, burst) {
  const head = headWorld(), r = pet.heightPx * 0.085;
  const side = Math.random() < 0.5 ? -1 : 1;
  const pinned = kind === 'anger';
  const el = document.createElement('div');
  el.className = 'sym' + (pinned ? ' pulse' : '');
  el.innerHTML = SYM[kind];
  const sz = Math.round(clamp(pet.heightPx * (pinned ? 0.075 : 0.06), 14, 40) * (burst ? 1.15 : 1));
  el.style.width = el.style.height = sz + 'px'; el.style.margin = `${-sz / 2}px 0 0 ${-sz / 2}px`;
  const ang = (pinned ? 0.55 : rand(0.25, 1.1)) * side;
  if (portrait.on) {
    el.style.left = Math.round(portrait.cx + Math.sin(ang) * portrait.r * 0.98) + 'px';
    el.style.top = Math.round(portrait.cy - Math.cos(ang) * portrait.r * 0.98) + 'px';
  } else {
    el.style.left = Math.round(head.x + Math.sin(ang) * r * 1.5) + 'px';
    el.style.top = Math.round((H - head.y) - r * 0.9 - Math.cos(ang) * r * 1.3) + 'px';
  }
  el.style.setProperty('--r', (kind === 'zz' || kind === 'note' ? side * 12 : 0) + 'deg');
  el.style.setProperty('--rise', (kind === 'zz' ? -34 : kind === 'sweat' ? 10 : -22) + 'px');
  fxEl.appendChild(el);
  setTimeout(() => el.remove(), 1600);
}
function fxTick(now) {
  const on = (!settings.look || settings.look.symbols !== false) && pet.vrm && !settings.hidden;
  const name = pet.sleeping ? 'sleepy' : mood.name;
  if (!on || !name || (!pet.sleeping && mood.k < 0.5)) { fx.last = ''; return; }
  const list = MOOD_SYMS[name];
  if (!list) return;
  if (name !== fx.last) { fx.last = name; fx.next = 0; spawnSym(list[0], true); if (list[1]) setTimeout(() => spawnSym(list[1]), 180); fx.next = now + 1400; return; }
  if (now < fx.next) return;
  spawnSym(pick(list));
  fx.next = now + rand(1300, name === 'sleepy' ? 2600 : 2100);
}


// ------------------------------------------------------------------ bubble (portrait) mode
// Head and shoulders in a round window with a white ring, in a corner of the screen, like
// Kyndred's "watch & play": the camera zooms onto her head every frame and the canvas is clipped
// to the circle, so a game or a video stays visible around her. She stays put (no walking,
// climbing or falling); drag the ring to move it, Ctrl+wheel (or wheel) over it to resize.
// Turned on by the setting, the menu, or automatically while a fullscreen app is in front.
const ringEl = document.getElementById('ring');
const portrait = { on: false, cx: 0, cy: 0, r: 110, s: 1, F: null, drag: null, saveT: 0 };
function portraitWanted() {
  const p = settings.portrait || {};
  return !!pet.vrm && !settings.hidden && (!!p.enabled || (p.auto !== false && settings.behaviors.hideFullscreen !== false && !!world.full));
}
function portraitPlace() {
  const p = settings.portrait || {};
  if (portrait.drag) return;
  portrait.r = clamp((p.size || 220) / 2, 60, 260);
  portrait.cx = p.x >= 0 ? p.x : W - portrait.r - 36;
  portrait.cy = p.y >= 0 ? p.y : H - portrait.r - 64;
  portrait.cx = clamp(portrait.cx, portrait.r + 4, W - portrait.r - 4);
  portrait.cy = clamp(portrait.cy, portrait.r + 4, H - portrait.r - 4);
}
function enterPortrait(on) {
  portrait.on = on;
  if (on) {
    pet.walkTo = null; pet.after = null; pet.jumpTo = null; pet.yawTarget = 0;
    if (!['idle', 'talk', 'think', 'typing'].includes(pet.state)) { pet.state = 'idle'; pet.stateT = 0; }
    if (pet.sleeping) { pet.sleeping = false; pet.state = 'idle'; setMood('sleepy', 3600); }
    portrait.F = null;
    ringEl.style.display = 'block';
  } else {
    canvas.style.clipPath = '';
    ringEl.style.display = 'none';
    fitCamera();
  }
}
/** Frame the head every frame (after the pose is applied, before rendering). */
function portraitTick(dt) {
  const want = portraitWanted();
  if (want !== portrait.on) enterPortrait(want);
  if (!portrait.on || !pet.vrm || !pet.base) return;
  portraitPlace();
  const head = bone('head');
  if (!head) return;
  const hm = pet.base.heightM;
  const target = head.getWorldPosition(new V3()).add(new V3(0, -0.012 * hm, 0));   // face a bit above the centre, shoulders below
  if (!portrait.F) portrait.F = target.clone(); else portrait.F.lerp(target, damp(5, dt));
  const s = (2 * portrait.r) / (0.36 * hm);                                     // px per metre: head + shoulders fill the circle
  portrait.s = s;
  const F = portrait.F;
  camera.left = F.x - portrait.cx / s; camera.right = camera.left + W / s;
  camera.bottom = F.y - (H - portrait.cy) / s; camera.top = camera.bottom + H / s;
  camera.updateProjectionMatrix();
  const r = portrait.r;
  canvas.style.clipPath = `circle(${r - 1}px at ${portrait.cx}px ${portrait.cy}px)`;
  ringEl.style.left = Math.round(portrait.cx - r) + 'px'; ringEl.style.top = Math.round(portrait.cy - r) + 'px';
  ringEl.style.width = ringEl.style.height = Math.round(2 * r) + 'px';
}

// ------------------------------------------------------------------ bubble buttons: microphone and speaker
const btnMic = document.getElementById('bMic'), btnSpk = document.getElementById('bSpk');
const voiceOn = () => !!(settings.voice && settings.voice.enabled);
const voiceMuted = () => !voiceOn() || !!settings.voice.muted;
btnMic.addEventListener('click', (e) => {
  e.stopPropagation();
  const on = !(settings.listen && settings.listen.enabled);
  settings.listen = { ...(settings.listen || {}), enabled: on };
  if (api.patch) api.patch({ listen: { enabled: on } });
  line2(on ? '🎙 Слушаю. Скажите «' + ((settings.listen.wake || 'алиса').replace(/^./, (c) => c.toUpperCase())) + ', …»' : 'Микрофон выключен');
});
btnSpk.addEventListener('click', (e) => {
  e.stopPropagation();
  const p = voiceMuted() ? { enabled: true, muted: false } : { muted: true };
  settings.voice = { ...(settings.voice || {}), ...p };
  applyMute();
  if (api.patch) api.patch({ voice: p });
});
/** The speaker button mutes her at once, even in the middle of a sentence (the mouth keeps moving). */
function applyMute() {
  const dev = settings.voiceDevices || {};
  const vol = settings.voice && settings.voice.muted ? 0 : (dev.outputVolume == null ? 70 : dev.outputVolume) / 100;
  if (aud.gain) aud.gain.gain.value = vol;
}
let lastSent = 0;
function placeButtons() {
  const show = portrait.on && !settings.hidden;
  btnMic.style.display = btnSpk.style.display = show ? 'block' : 'none';
  if (!show) return;
  const r = portrait.r + 4;
  const put = (el, deg) => { const a = deg * Math.PI / 180; el.style.left = Math.round(portrait.cx + Math.sin(a) * r) + 'px'; el.style.top = Math.round(portrait.cy + Math.cos(a) * r) + 'px'; };
  put(btnMic, -38); put(btnSpk, 38);                                         // bottom-left and bottom-right of the ring
  const lst = !!(settings.listen && settings.listen.enabled);
  btnMic.classList.toggle('off', !lst);
  btnMic.classList.toggle('hear', lst && (ear.speaking || !!ear.simHear));
  btnMic.classList.toggle('busy', lst && (ear.busy || !!ear.simBusy));
  if (ear.sentAt && ear.sentAt !== lastSent) { lastSent = ear.sentAt; btnMic.classList.remove('sent'); void btnMic.offsetWidth; btnMic.classList.add('sent'); }
  btnSpk.classList.toggle('off', voiceMuted());
  btnSpk.classList.toggle('talk', !voiceMuted() && (voice.speaking || !!voice.audio));
}
function overButtons(x, y) {
  if (!portrait.on) return false;
  for (const el of [btnMic, btnSpk]) { const b = el.getBoundingClientRect(); if (x >= b.left - 3 && x <= b.right + 3 && y >= b.top - 3 && y <= b.bottom + 3) return true; }
  return false;
}
/** Screen point → "world pixels" (the space headWorld() and the touch zones use). */
function screenToWorldPx(cx, cy) {
  if (!portrait.on) return { x: cx, y: H - cy };
  const s = portrait.s;
  return { x: (cx / s + camera.left) * pet.scale, y: ((H - cy) / s + camera.bottom) * pet.scale };
}
/** Where the head is on screen (x, y from the top). */
function headScreen() {
  if (portrait.on) return { x: portrait.cx, y: portrait.cy - portrait.r * 0.25 };
  const h = headWorld();
  return { x: h.x, y: H - h.y };
}
const inPortrait = (x, y) => portrait.on && Math.hypot(x - portrait.cx, y - portrait.cy) < portrait.r;
function portraitSave() { if (api.patch) api.patch({ portrait: { x: Math.round(portrait.cx), y: Math.round(portrait.cy), size: Math.round(portrait.r * 2) } }); }
canvas.addEventListener('wheel', (e) => {
  if (!inPortrait(e.clientX, e.clientY)) return;
  e.preventDefault();
  portrait.r = clamp(portrait.r * (e.deltaY > 0 ? 0.92 : 1.08), 60, 260);
  settings.portrait = { ...(settings.portrait || {}), size: Math.round(portrait.r * 2) };
  clearTimeout(portrait.saveT); portrait.saveT = setTimeout(portraitSave, 400);
}, { passive: false });

// ------------------------------------------------------------------ clips by name, lines from the agent
/** Play one imported clip (pose / dance / any role) right now, then back to idle. */
function playAction(act) {
  const role = act.userData.role;
  if (pet.sleeping) wake(true);
  if (pet.state !== 'idle') setState('idle');
  const c = act.getClip();
  const loop = c.isPose || ['idle', 'talk', 'walk', 'sit', 'sit_edge', 'sleep', 'typing', 'think', 'fall', 'held'].includes(role);
  act.reset(); act.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity); act.clampWhenFinished = true; act.enabled = true; act.setEffectiveWeight(1);
  if (clips.current && clips.current !== act) act.crossFadeFrom(clips.current, 0.35, false); else act.fadeIn(0.35);
  act.play();
  clips.current = act; clips.currentRole = role === 'pose' ? 'pose' : 'play';
  const hold = c.isPose ? 6 : clamp(loop ? Math.max(c.duration, 5) : c.duration - 0.3, 1.5, 240);
  pet.gesture = { name: 'play', t0: clock.t, clip: true, dur: hold };
  pet.yawTarget = 0;
  setTimeout(() => { if (clips.current === act) { pet.gesture = null; setState('idle'); playRole('idle'); } }, hold * 1000);
  return { ok: true, role, duration: c.duration };
}
/** An imported clip by (part of) its name; a role name ("dance", "pose") picks one of that role. */
function findAction(name) {
  const q = name.toLowerCase().replace(/[_\s.-]+/g, ' ').trim();
  if (clips.byRole[q] && clips.byRole[q].length) return pick(clips.byRole[q]);
  let best = null;
  for (const list of Object.values(clips.byRole)) for (const x of list) {
    const n = String((x.userData && x.userData.name) || '').toLowerCase().replace(/\.(uanim\.json|vrma|vmd|fbx|glb)$/i, '').replace(/[_\s.-]+/g, ' ');
    if (n === q) return x;
    if (!best && (n.includes(q) || q.includes(n))) best = x;
  }
  return best;
}
/** A line from the agent: caption or bubble, spoken when the voice is on. */
function sayLine(text) {
  const sb = settings.speechBubble || {};
  if (subtitlesOn()) subsSay(text, 3.5);
  else if (sb.enabled && pet.vrm) {
    bubble.visible = true; bubble.lastPhase = 'reaction';
    bubbleFrame.style.display = 'block';
    postBubble({ text, final: true, phase: 'answer', status: '', style: { ...bubbleStyle(), hideAfter: 4 } });
  }
  if (settings.voice && settings.voice.enabled) speak(text);
}

// ------------------------------------------------------------------ what is on the screen
// Without looking at pixels: the foreground window tells what the user is doing (code, a video,
// music, a chat, a game). Her idle life follows it, and she reacts when the activity changes.
const scene_ = { kind: 'desk', since: 0, reactedAt: 0, pending: '', pendingAt: 0 };
const agentControl = () => (settings.control || 'agent') === 'agent';
function screenKind() {
  const fg = world.windows.find((w) => w.id === world.fg);
  const t = ((fg && fg.title) || '').toLowerCase();
  if (world.full && !/youtube|twitch|netflix|кинопоиск|vlc|видео|video|movie|фильм/.test(t)) return 'game';
  if (/youtube|twitch|netflix|кинопоиск|rutube|vlc|mpc-hc|видео|video|аниме|anime|movie|фильм|сериал/.test(t)) return 'video';
  if (/spotify|яндекс музык|yandex music|soundcloud|aimp|winamp|music|музык/.test(t)) return 'music';
  if (/visual studio|vs ?code|cursor|intellij|pycharm|webstorm|rider|android studio|sublime|notepad\+\+|terminal|powershell|cmd\.exe|git|deepseek harness|\.py\b|\.js\b|\.ts\b/.test(t)) return 'code';
  if (/discord|telegram|whatsapp|slack|teams|вконтакте|vk\.com|messenger/.test(t)) return 'chat';
  if (/steam|epic games|battle\.net|riot client/.test(t)) return 'game';
  return 'desk';
}
function sceneTick(now) {
  const k = screenKind();
  if (k !== scene_.pending) { scene_.pending = k; scene_.pendingAt = now; }
  if (k === scene_.kind || now - scene_.pendingAt < 3000) return;              // settle for 3 s (alt-tab flicker)
  scene_.kind = k; scene_.since = now;
  if (agentControl()) return;                                                 // only her own life reacts to the screen
  if (pet.phase !== 'idle' || pet.talking || pet.sleeping || drag.grabbed || now - scene_.reactedAt < 20000) return;
  scene_.reactedAt = now;
  if (k === 'video') { setMood('relaxed', 8, 0.8); if (!portrait.on && Math.random() < 0.5) sit(); }
  else if (k === 'music') { setMood('relaxed', 8, 0.8); if (Math.random() < 0.5) gesture('rock'); }
  else if (k === 'game') setMood('excited', 4, 0.7);
  else if (k === 'code') setMood('thinking', 4, 0.6);
  else if (k === 'chat') { gesture('look_around'); }
}

// ------------------------------------------------------------------ touch: reactions + memory
// Pat the head, boop the face, poke the body or the legs, grab, spin, shake, drop. Each has a
// reaction (body + face + a little line in the bubble, spoken when the voice is on). She remembers
// how she is treated: bond grows with gentle touches, wariness with drops, spins and pestering and
// fades with a 10-minute half-life. Wariness makes her flinch and protest; bond makes her lean in.
const LINES = {
  pat: ['Мур…', 'Хе-хе~', 'Ещё…', 'Приятно', '♪'],
  patLove: ['Обожаю, когда ты так делаешь', 'Мм… ещё чуть-чуть', 'Не останавливайся~'],
  boop: ['Ой!', 'Бип!', 'Хи-хи', 'Эй, нос!'],
  boopShy: ['Ну хватит…', 'Смущаешь…', 'Ну-у…'],
  poke: ['М?', 'Что такое?', 'Я тут', 'Ага?'],
  legs: ['Эй!', 'Щекотно!', 'Ай, ноги!'],
  swat: ['Хватит!', 'Ну всё, хватит тыкать!', 'Эй! Перестань!'],
  dizzy: ['Голова кружится…', 'Всё плывёт…', 'Уф… мир кружится'],
  drop: ['Ай! Ну зачем…', 'Больно же!', 'Эй, аккуратнее!'],
  dropSoft: ['Оп!', 'Приземлилась!'],
  grabHappy: ['Ух ты!', 'Летим!', 'Хи-хи'],
  grabWary: ['Пусти!', 'Опять?!', 'Не надо…'],
  greet: ['О, ты вернулся!', 'Привет!', 'Я скучала'],
  flinch: ['Ой…', 'Не пугай…'],
};
const touch = { hits: [], lastLine: 0, lastPat: 0, lastFlinch: 0, wasPetting: false, drag: { ang: 0, flips: 0, lastV: null, lastSign: 0, t0: 0 }, dizzyAfterLand: false, wasIdleLong: false };
const mem = { bond: 0.35, wary: 0, dirty: false, id: '' };
function memKey() { return 'amadeus3d-mem-' + (pet.id || 'default'); }
function loadMem() {
  mem.id = pet.id || 'default';
  try { const d = JSON.parse(localStorage.getItem(memKey()) || '{}'); mem.bond = clamp(+d.bond || 0.35, 0, 1); mem.wary = clamp(+d.wary || 0, 0, 1); } catch { mem.bond = 0.35; mem.wary = 0; }
}
function saveMem() { if (!mem.dirty) return; mem.dirty = false; try { localStorage.setItem(memKey(), JSON.stringify({ bond: +mem.bond.toFixed(3), wary: +mem.wary.toFixed(3) })); } catch {} }
setInterval(saveMem, 10000);
function bondUp(x) { mem.bond = clamp(mem.bond + x, 0, 1); mem.dirty = true; }
function waryUp(x) { mem.wary = clamp(mem.wary + x, 0, 1); mem.bond = clamp(mem.bond - x * 0.12, 0, 1); mem.dirty = true; }
function memTick(dt) {
  if ((pet.id || 'default') !== mem.id) loadMem();
  const w = mem.wary * Math.pow(0.5, dt / 600);
  if (Math.abs(w - mem.wary) > 1e-5) { mem.wary = w; mem.dirty = true; }
  // the user is back after a while: a warm greeting when she likes them
  if (world.idle > 120) touch.wasIdleLong = true;
  else if (touch.wasIdleLong && world.idle < 2) {
    touch.wasIdleLong = false;
    if (mem.bond > 0.5 && !pet.sleeping && pet.phase === 'idle' && isGrounded()) { gesture('wave'); setEmotion({ happy: 0.8 }, 3); line('greet'); }
  }
}
function line(kind, force) {
  const t = settings.touch || {};
  const now = performance.now();
  if (t.lines === false || (!force && now - touch.lastLine < 2200)) return;
  if (pet.phase !== 'idle' || pet.talking) return;                       // never over the agent's answer
  touch.lastLine = now;
  const text = pick(LINES[kind] || [kind]);
  const sb = settings.speechBubble || {};
  if (subtitlesOn()) subsSay(text, 2.6);
  else if (sb.enabled && pet.vrm) {
    bubble.visible = true; bubble.lastPhase = 'reaction';
    bubbleFrame.style.display = 'block';
    postBubble({ text, final: true, phase: 'answer', status: '', style: { ...bubbleStyle(), hideAfter: 3 } });
  }
  const v = settings.voice || {};
  if (v.enabled && v.reactions !== false) speak(text);
}
function boneScreen(name) { const b = bone(name); return b ? b.getWorldPosition(new V3()).multiplyScalar(pet.scale) : null; }
/** Where the click landed: 'face', 'head', 'legs' or 'body'. */
function touchZone(x, yWorld) {
  const h = boneScreen('head'), hips = boneScreen('hips');
  if (!h || !hips) return 'body';
  const r = pet.heightPx * 0.085;
  const hc = h.clone().add(new V3(0, r * 0.6, 0));                       // head bone sits at the jaw: the head centre is above it
  if (Math.hypot(x - hc.x, yWorld - hc.y) < r * 1.35) return yWorld < hc.y - r * 0.05 ? 'face' : 'head';
  if (yWorld < hips.y - pet.heightPx * 0.04) return 'legs';
  return 'body';
}
function pester(now) {
  touch.hits = touch.hits.filter((t) => now - t < 6000);
  touch.hits.push(now);
  return touch.hits.length >= (mem.wary > 0.5 ? 3 : 5);
}
function onTouch(e) {
  const now = performance.now();
  pet.lastTouch = now;
  if (pet.sleeping) { wake(); setEmotion({ surprised: 0.45 }, 1.5); line('poke', true); return; }
  if (settings.touch && settings.touch.enabled === false) { gesture('wave'); return; }
  const wp = screenToWorldPx(e.clientX, e.clientY);
  const zone = touchZone(wp.x, wp.y);
  pet.yawTarget = 0;
  if (pester(now)) {                                                      // too much: swat the hand away
    touch.hits = [];
    waryUp(0.18);
    gesture('swat'); setMood('angry', 3.5, 0.9); line('swat', true);
    return;
  }
  if (zone === 'face') {
    bondUp(0.004);
    face.forceBlink = true;
    if (touch.hits.length >= 3) { setMood('shy', 4); line('boopShy'); }
    else { gesture('giggle'); setEmotion({ happy: 0.45, surprised: 0.3 }, 1.4); line('boop'); }
  } else if (zone === 'head') {
    bondUp(0.008); setEmotion({ happy: 0.45 }, 2); gesture('nod'); line('pat');
  } else if (zone === 'legs') {
    setEmotion({ surprised: 0.45 }, 1.2); gesture('tap_foot'); line('legs');
  } else {
    setEmotion({ surprised: 0.4 }, 1.2); gesture(mem.bond > 0.6 ? 'wave' : 'shrug'); line('poke');
  }
}
/** Drag analysis: turning (spin) and back-and-forth (shake) while she is held. */
function trackDrag(dx, dy, dtMs) {
  const d = touch.drag, now = performance.now();
  if (now - d.t0 > 2500) { d.ang = 0; d.flips = 0; d.t0 = now; }
  const v = Math.hypot(dx, dy);
  if (v < 3) return;
  const dir = Math.atan2(dy, dx);
  if (d.lastV != null) { let a = dir - d.lastV; a = Math.atan2(Math.sin(a), Math.cos(a)); d.ang += a; }
  d.lastV = dir;
  const speed = v / Math.max(1, dtMs) * 1000;
  const sign = Math.sign(dx);
  if (speed > 1400 && sign && sign !== d.lastSign) { d.flips++; d.lastSign = sign; }
}
function onGrab() {
  const d = touch.drag; d.ang = 0; d.flips = 0; d.lastV = null; d.t0 = performance.now();
  if (mem.wary > 0.5) { setMood('pout', 4, 0.8); line('grabWary'); }
  else if (Math.random() < 0.3) line('grabHappy');
}
function onRelease() {
  const d = touch.drag;
  const spun = Math.abs(d.ang) > Math.PI * 3, shaken = d.flips >= 6;
  if (spun || shaken) { waryUp(0.12); touch.dizzyAfterLand = true; }
}
function onLanded(hard, lift) {
  if (touch.dizzyAfterLand) { touch.dizzyAfterLand = false; setMood('dizzy', 4.5); line('dizzy', true); return; }
  if (hard && lift > pet.heightPx * 0.9) { waryUp(0.1); setMood('pout', 3, 0.7); line('drop', true); }
  else if (Math.random() < 0.3) line('dropSoft');
}
/** A wary companion flinches when the cursor rushes at her. */
function flinchCheck(e, moved, dtMs) {
  if (mem.wary < 0.55 || drag.down || pet.sleeping) return;
  const now = performance.now();
  if (now - touch.lastFlinch < 4000) return;
  const speed = moved / Math.max(1, dtMs) * 1000;
  if (speed > 2600 && cursorNear(1.2)) { touch.lastFlinch = now; setEmotion({ surprised: 0.45, sad: 0.3 }, 1); if (Math.random() < 0.4) line('flinch'); }
}

// ------------------------------------------------------------------ preview
function renderPreview(full) {
  if (!pet.vrm) return null;
  const size = 512;
  const rt = new THREE.WebGLRenderTarget(size, size, { colorSpace: THREE.SRGBColorSpace });
  const box = new THREE.Box3();
  for (const name of ['head', 'hips', 'leftFoot', 'rightFoot', 'leftHand', 'rightHand', 'leftLowerLeg', 'rightLowerLeg']) {
    const b = bone(name);
    if (b) box.expandByPoint(b.getWorldPosition(new THREE.Vector3()));
  }
  box.expandByScalar(pet.base.heightM * 0.12);
  box.max.y += pet.base.heightM * 0.06;
  const c = box.getCenter(new THREE.Vector3());
  const h = (box.max.y - box.min.y) * (full ? 1.15 : 0.62);
  const w = Math.max(h, box.max.x - box.min.x);
  const cam = full
    ? new THREE.OrthographicCamera(c.x - w / 2, c.x + w / 2, c.y + w / 2, c.y - w / 2, -3000, 3000)
    : new THREE.OrthographicCamera(c.x - h / 2, c.x + h / 2, box.max.y + h * 0.04, box.max.y - h * 0.96, -3000, 3000);
  cam.position.set(0, 0, 1000);
  const prevYaw = root.rotation.y;
  if (!full) root.rotation.y = 0;
  renderer.setRenderTarget(rt);
  renderer.setClearColor(0x000000, 0);
  renderer.clear();
  renderer.render(scene, cam);
  const buf = new Uint8Array(size * size * 4);
  renderer.readRenderTargetPixels(rt, 0, 0, size, size, buf);
  renderer.setRenderTarget(null);
  root.rotation.y = prevYaw;
  rt.dispose();
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) img.data.set(buf.subarray((size - 1 - y) * size * 4, (size - y) * size * 4), y * size * 4);
  ctx.putImageData(img, 0, 0);
  return cv.toDataURL('image/png').split(',')[1];
}

// ------------------------------------------------------------------ main loop
const clock = { t: 0, last: performance.now(), acc: 0 };
let lastHit = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(0.05, (now - clock.last) / 1000);
  // ~30 fps while sleeping / sitting still, 60 otherwise
  const lazy = (pet.sleeping || pet.state === 'sit_floor') && !drag.grabbed && !pet.talking;
  clock.acc += dt;
  if (lazy && clock.acc < 1 / 30) return;
  dt = clock.acc; clock.acc = 0;
  clock.last = now; clock.t += dt;
  if (!pet.vrm) { renderer.clear(); return; }
  update(dt, now);
  portraitTick(dt);
  placeButtons();
  renderer.render(scene, camera);
  if (now - lastHit > 33) { lastHit = now; hitTest(); }
  if (bubble.visible) placeBubbleThrottled(now);
}
let lastPlace = 0;
function placeBubbleThrottled(now) { if (now - lastPlace > 50) { lastPlace = now; const side = placeBubble(); if (side !== bubble.side) { bubble.side = side; if (bubble.ready) bubbleFrame.contentWindow.postMessage({ source: 'pet-bubble', side }, '*'); } } }

const rootQ = new THREE.Quaternion(), tmpRootE = new THREE.Euler();
function update(dt, now) {
  pet.stateT += dt;
  memTick(dt);
  sceneTick(now);
  earTick(now);
  updateShadow(dt);
  subsTick();
  fxTick(now);
  if (pet.state === 'sit_down' && pet.stateT > 1.3) setState('sit_floor');
  if (pet.state === 'stand_up' && pet.stateT > 0.95) { const next = pet.afterStand || 'idle'; pet.afterStand = null; pet.state = 'stand_up_done'; setState(next); }
  // needs
  pet.energy = clamp(pet.energy + (pet.sleeping ? dt / 400 : -dt / 2400), 0, 1);
  pet.boredom = clamp(pet.boredom + dt / 300, 0, 1);
  pet.joy += (0.5 - pet.joy) * dt / 600;
  if (petting.active && now > petting.until) petting.active = false;

  // state transitions with durations
  switch (pet.state) {
    case 'held': {
      const tx = cursor.x + drag.ox, ty = toWorldY(cursor.y) + drag.oy;
      pet.vx = (tx - pet.x) / Math.max(dt, 0.001);
      pet.x = tx; pet.y = ty;
      pet.tilt += (clamp(-pet.vx * 0.0005, -0.5, 0.5) - pet.tilt) * damp(8, dt);
      break;
    }
    case 'walk': {
      const span = surfaceSpan();
      const dist = pet.walkTo - pet.x;
      const dir = Math.sign(dist) || 1;
      const vmax = pet.heightPx * 0.4;
      pet.yawTarget = dir * 1.2;
      const aligned = Math.abs(pet.yaw - pet.yawTarget) < 0.7;
      const want = aligned ? Math.min(vmax, Math.abs(dist) * 2.4 + vmax * 0.12) : vmax * 0.1;
      pet.speed += (want - pet.speed) * damp(3.2, dt);
      pet.x += dir * pet.speed * dt;
      if (span) pet.x = clamp(pet.x, span[0], span[1]);
      if (Math.abs(dist) < 3 || !span) {
        pet.walkTo = null;
        pet.yawTarget = 0;
        setState('idle');
        if (pet.after) { const f = pet.after; pet.after = null; setTimeout(f, 300); }
      }
      break;
    }
    case 'crouch':
      if (pet.stateT > pet.stateDur && pet.jumpTo) { launchJump(); pet.jumpTo = null; }
      break;
    case 'land':
      if (pet.stateT > pet.stateDur) {
        setState('idle'); pet.next = now + rand(1500, 4000);
        if (pet.after) { const f = pet.after; pet.after = null; f(); }
      }
      break;
    default: break;
  }
  if (pet.state === 'fall' || pet.state === 'jump') physics(dt);
  if (isGrounded() && pet.state !== 'walk' && pet.surface.kind === 'window') {
    const y = surfaceY();
    if (y === null && settings.behaviors.physics) { pet.surface = { kind: 'floor' }; setState('fall'); }
    else if (y !== null) pet.y = y;
  }
  if (isGrounded() && pet.surface.kind === 'floor') pet.y = 0;
  if (pet.state === 'idle' || pet.state === 'sit_edge' || pet.state === 'sit_floor' || pet.state === 'sleep' || pet.state === 'sleep_sit') decide(now);
  syncIdleClip(false);
  if (clips.current && clips.currentRole === 'walk') clips.current.timeScale = clamp((pet.speed / pet.scale) / 1.15, 0.35, 1.6);   // feet match the ground speed

  // limb pendulum: hanging arms and legs lag behind sideways acceleration
  {
    const vxNow = pet.state === 'held' || pet.state === 'fall' || pet.state === 'jump' ? pet.vx : 0;
    const ax = clamp((vxNow - (mo.lastVx || 0)) / Math.max(dt, 0.001), -40000, 40000);
    mo.lastVx = vxNow;
    const kx = 0.000045 * (340 / Math.max(160, pet.heightPx));
    mo.swingV += (-28 * mo.swing - 4.2 * mo.swingV - ax * kx) * dt;
    mo.swing = clamp(mo.swing + mo.swingV * dt, -0.9, 0.9);
  }
  // body: gait, breathing and turning are integrated so every change is gradual
  if (pet.state !== 'walk') pet.speed += (0 - pet.speed) * damp(6, dt);
  const gaitWant = pet.state === 'walk' ? clamp(pet.speed / (pet.heightPx * 0.22), 0, 1) : 0;
  mo.gait += (gaitWant - mo.gait) * damp(gaitWant > mo.gait ? 5 : 4, dt);
  mo.phase += (pet.speed * dt) / (pet.heightPx * 0.8);     // one stride cycle per ~0.8 body heights
  const asleepNow = pet.state === 'sleep' || pet.state === 'sleep_sit';
  const breathRate = asleepNow ? 0.85 : 1.5 + (face.emoBlend.angry || 0) * 0.8 + (face.emoBlend.surprised || 0) * 0.6 - (face.emoBlend.sad || 0) * 0.4 + (pet.state === 'walk' ? 0.4 : 0);
  mo.breathPhase = (mo.breathPhase || 0) + dt * breathRate;
  pet.yaw += (pet.yawTarget - pet.yaw) * damp(4.2, dt);
  pet.squash += (1 - pet.squash) * damp(7, dt);
  if (pet.mixer) pet.mixer.update(dt);
  const useClip = clipActive();
  applyPose(dt, clock.t, useClip);
  updateFace(dt, now);
  pet.vrm.update(dt);

  // place the root (feet) on screen; seated/lying poses put the hips on the surface
  const s = pet.state;
  let offY = 0, offX = 0;
  // seated: put the hips (as posed right now — a clip may already lower them) on the surface
  const hipsNow = bone('hips') ? bone('hips').position.y * pet.scale : pet.hipsPx;
  if (s === 'sit_edge' || s === 'sleep_sit') offY = -hipsNow + pet.heightPx * 0.03;
  else if (s === 'sit_floor' || s === 'sit_down' || s === 'stand_up') offY = -supportLow(hipsNow);   // whatever touches the floor first
  else if (s === 'sleep') { offY = pet.heightPx * 0.075; offX = pet.heightPx * 0.42; }
  offY -= crouchDrop(s) * pet.hipsPx;
  offY += mo.bob * pet.heightPx;
  const snappy = s === 'held' || s === 'fall' || s === 'jump';
  const ko = damp(snappy ? 20 : 6.5, dt);
  pet.offY = (pet.offY === undefined ? offY : pet.offY + (offY - pet.offY) * ko);
  pet.offX = (pet.offX === undefined ? offX : pet.offX + (offX - pet.offX) * ko);
  root.position.set((pet.x + pet.offX) / pet.scale, (pet.y + pet.offY) / pet.scale, 0);
  if (s === 'sleep') rootQ.setFromEuler(tmpRootE.set(0, Math.PI / 2, Math.PI / 2, 'ZYX'));   // profile, lying face up
  else rootQ.setFromEuler(tmpRootE.set(0, pet.yaw, pet.tilt, 'XYZ'));
  root.quaternion.slerp(rootQ, damp(snappy ? 14 : 4.5, dt));
  root.scale.set(1 + (1 - pet.squash) * 0.6, pet.squash, 1);
  if (pet.resetSprings && pet.vrm.springBoneManager) { root.updateMatrixWorld(true); pet.vrm.springBoneManager.reset(); pet.resetSprings = false; }
}
requestAnimationFrame(frame);

// ------------------------------------------------------------------ commands
const ACTIONS = {
  sleep: () => goSleep(),
  wake: () => wake(),
  sit: () => sit(),
  stand: () => { if (pet.sleeping) wake(true); setState('idle'); },
  wave: () => gesture('wave'),
  dance: () => gesture('dance'),
  pose: () => gesture('pose'),
  stretch: () => gesture('stretch'),
  nod: () => gesture('nod'),
  shake: () => gesture('shake'),
  bow: () => gesture('bow'),
  look_around: () => gesture('look_around'),
  come: () => {
    if (pet.sleeping) wake(true);
    const go = () => walkTo(cursor.x >= 0 ? cursor.x : W / 2);
    if (pet.surface.kind === 'window') {          // hop down from the window first
      pet.dropFrom = pet.surface.id; pet.surface = { kind: 'air' };
      pet.vx = (cursor.x > pet.x ? 1 : -1) * pet.heightPx * 0.8; pet.vy = pet.heightPx * 1.6;
      setState('jump'); pet.after = go;
    } else go();
  },
  jump: () => climbSomewhere(),
};
async function handle(name, a) {
  switch (name) {
    case 'load_model': return loadModel(a.url, a.id);
    case 'unload': unloadModel(); return { ok: true };
    case 'render_preview': {
      // portrait in a calm standing pose, whatever the character is doing right now
      const keep = { state: pet.state, sleeping: pet.sleeping, yaw: pet.yaw, gesture: pet.gesture, emotion: pet.emotion, until: pet.emotionUntil };
      pet.state = 'idle'; pet.sleeping = false; pet.gesture = null; pet.emotion = { happy: 0.35 }; pet.emotionUntil = performance.now() + 5000;
      const keepTalk = pet.talking; pet.talking = false; mo.gait = 0;
      root.rotation.set(0, 0, 0, 'XYZ'); root.position.set(pet.x / pet.scale, pet.y / pet.scale, 0); root.scale.set(1, 1, 1);
      for (let i = 0; i < 20; i++) applyPose(1 / 30, 0, false, { still: true, snap: true });
      const head = headWorld();
      lookTarget.position.set(head.x / pet.scale, head.y / pet.scale, pet.heightPx * 3 / pet.scale);   // straight at the camera
      root.updateMatrixWorld(true);
      pet.vrm.update(0);
      if (pet.vrm.springBoneManager) pet.vrm.springBoneManager.reset();
      for (let i = 0; i < 90; i++) { applyPose(1 / 30, 0, false, { still: true, snap: true }); pet.vrm.update(1 / 30); }   // let hair and cloth settle
      for (const k of ['blink', 'aa', 'ih', 'ou', 'ee', 'oh', 'angry', 'sad', 'surprised']) setExpr(k, 0);
      setExpr('happy', 0.3); setExpr('relaxed', 0);
      pet.vrm.update(0);
      const png = renderPreview(false);
      pet.talking = keepTalk; pet.resetSprings = true;
      Object.assign(pet, { state: keep.state, sleeping: keep.sleeping, yaw: keep.yaw, gesture: keep.gesture, emotion: keep.emotion, emotionUntil: keep.until });
      return { ok: true, png };
    }
    case 'mat_info': {
      const re = new RegExp(a.match || '^$', 'i'); const out = [];
      pet.vrm && pet.vrm.scene.traverse((o) => { if (!o.isMesh) return; for (const m of [].concat(o.material)) if (m && re.test(m.name)) out.push({ name: m.name, type: m.type, color: m.color && m.color.toArray().map((x) => +x.toFixed(3)), shade: m.shadeColorFactor && m.shadeColorFactor.toArray().map((x) => +x.toFixed(3)), orig: m.userData.origShade && m.userData.origShade.toArray().map((x) => +x.toFixed(3)), side: m.side, shift: m.shadingShiftFactor, toony: m.shadingToonyFactor, gi: m.giEqualizationFactor, lit: m.uniforms && m.uniforms.litFactor && m.uniforms.litFactor.value.toArray() }); });
      return { ok: true, out, tint: settings.shadeTint };
    }
    case 'mat_tint': {                                // debug: paint materials whose name matches, to find a part
      const re = new RegExp(a.match || '^$', 'i'); const hit = [];
      pet.vrm && pet.vrm.scene.traverse((o) => { if (!o.isMesh) return; for (const m of [].concat(o.material)) { if (!m) continue; if (!m.userData.origColor && m.color) m.userData.origColor = m.color.clone(); if (!m.userData.dbgShade && m.shadeColorFactor) m.userData.dbgShade = m.shadeColorFactor.clone(); if (re.test(m.name)) { (a.shade ? m.shadeColorFactor : m.color).set(a.color || '#00ff00'); hit.push(m.name); } else { if (m.userData.origColor) m.color.copy(m.userData.origColor); if (m.userData.dbgShade) m.shadeColorFactor.copy(m.userData.dbgShade); } } });
      return { ok: true, hit };
    }
    case 'penetration': {                            // debug: deepest limb point inside the body (e < 1 = inside)
      root.updateMatrixWorld(true);
      const sw = shoulderWidth(); let worst = { e: 9 };
      for (const side of ['left', 'right']) for (const n of ['LowerArm', 'Hand', 'MiddleDistal']) {
        const b = bone(side + n); if (!b || !body.caps) continue;
        const own = side === 'left' ? 'lThigh' : 'rThigh', o2 = side === 'left' ? 'rThigh' : 'lThigh';
        const h = deepest(b.getWorldPosition(new V3()), ['hips', 'waist', 'chest', own, o2], sw);
        if (h && h.e < worst.e) worst = { e: +h.e.toFixed(2), at: side + n };
      }
      return { ok: true, worst };
    }
    case 'collide': body.off = a.on === false; return { ok: true, on: !body.off };
    case 'capsules': return { ok: true, caps: (body.caps || []).map((c) => ({ id: c.id, rx: +c.rx.toFixed(3), rz: +c.rz.toFixed(3) })), sw: body.sw0 };
    case 'probe': {                                   // debug: torso / face directions in the model frame (degrees)
      root.updateMatrixWorld(true);
      const rqi = root.getWorldQuaternion(new THREE.Quaternion()).invert();
      const P = (n) => (bone(n) ? bone(n).getWorldPosition(new V3()) : null);
      const torso = P('neck').sub(P('hips')).applyQuaternion(rqi).normalize();
      const headQ = bone('head').getWorldQuaternion(new THREE.Quaternion());
      const rest = (pet.restHead || new THREE.Quaternion());
      const face = new V3(0, 0, 1).applyQuaternion(rest.clone().invert()).applyQuaternion(headQ).applyQuaternion(rqi).normalize();
      const deg = (v) => Math.round(THREE.MathUtils.radToDeg(v));
      const eul = (n) => { const b = bone(n); if (!b) return null; const e = new THREE.Euler().setFromQuaternion(b.quaternion, 'YXZ'); return [deg(e.x), deg(e.y), deg(e.z)]; };
      const fromClip = {};
      if (clips.current) for (const tr of clips.current.getClip().tracks) for (const n of ['neck', 'head', 'chest', 'spine', 'hips']) if (bone(n) && tr.name === bone(n).name + '.quaternion') { const q = new THREE.Quaternion().fromArray(tr.values, 0); const e = new THREE.Euler().setFromQuaternion(q, 'YXZ'); fromClip[n] = [deg(e.x), deg(e.y), deg(e.z)]; }
      const H0 = P('hips'); const SW = P('leftUpperArm').distanceTo(P('rightUpperArm'));
      const rel = (n) => { const v = P(n); if (!v) return null; v.sub(H0).applyQuaternion(rqi).divideScalar(SW); return [+v.x.toFixed(2), +v.y.toFixed(2), +v.z.toFixed(2)]; };
      const hands = { lHand: rel('leftHand'), lTip: rel('leftMiddleDistal'), rHand: rel('rightHand'), rTip: rel('rightMiddleDistal'), keepOut: [+keepOut.left.toFixed(2), +keepOut.right.toFixed(2)], keepFwd: [+keepFwd.left.toFixed(2), +keepFwd.right.toFixed(2)] };
      return { ok: true, hands, local: { neck: eul('neck'), head: eul('head') }, fromClip, torsoPitchFwd: deg(Math.atan2(torso.z, torso.y)), torsoRoll: deg(Math.atan2(-torso.x, torso.y)), facePitchDown: deg(Math.asin(-face.y)), faceYaw: deg(Math.atan2(face.x, face.z)) };
    }
    case 'play_clip': {                               // one specific imported clip, from the character card
      let act = null;
      for (const list of Object.values(clips.byRole)) for (const x of list) if (x.userData && x.userData.file === a.file && (x.userData.clip || '') === (a.clip || '')) act = x;
      if (!act) return { ok: false, error: 'Клип ещё не загружен (или у него роль «без роли»).' };
      return playAction(act);
    }
    case 'react': {                                   // the agent directs her: emotion, gesture or clip, a short line
      const out = { ok: true };
      const e = String(a.emotion || '').toLowerCase().trim();
      if (e && MOODS[e]) { setMood(e, a.seconds || 8); out.emotion = e; }
      else if (e && PRESETS.includes(e)) { setEmotion({ [e]: 1 }, a.seconds || 8); out.emotion = e; }
      if (a.clip) {
        const act = findAction(String(a.clip));
        if (act) { playAction(act); out.clip = act.userData.name; } else out.clipMissing = String(a.clip);
      }
      if (a.gesture && !out.clip) {
        const g = String(a.gesture).toLowerCase().trim();
        out.gesture = gesture(g) || (ACTIONS[g] && (ACTIONS[g](), true)) ? g : undefined;
      }
      if (a.action) {
        const act = String(a.action).toLowerCase().trim();
        if (act === 'bubble' || act === 'bubble_on') { if (api.patch) api.patch({ portrait: { enabled: true } }); out.action = act; }
        else if (act === 'bubble_off' || act === 'full') { if (api.patch) api.patch({ portrait: { enabled: false } }); out.action = act; }
        else if (ACTIONS[act]) { ACTIONS[act](); out.action = act; }
        else out.actionMissing = act;
      }
      if (a.say) { sayLine(String(a.say).slice(0, 140)); out.said = true; }
      return out;
    }
    case 'try_clip': {
      let clip;
      if (/\.vmd$/i.test(a.url)) clip = bakeVMD(await loadVMD(a.url), pet.vrm, 'try');
      else if (/\.uanim\.json$/i.test(a.url)) clip = muscleClip(await loadMuscles(a.url), pet.vrm, 'try');
      else {
        const pack = await loadPack(a.url);
        if (a.list) return { ok: true, clips: pack.animations.map((c) => c.name) };
        clip = stripRootMotion(retargetPackClip(pack, a.clip == null ? null : a.clip, pet.vrm));
      }
      pet.frozen = !a.live;
      if (a.state) setState(a.state);
      const action = pet.mixer.clipAction(clip);
      if (clips.current && clips.current !== action) clips.current.stop();
      action.reset(); action.setLoop(THREE.LoopRepeat, Infinity); action.setEffectiveWeight(1); action.play();
      if (a.at != null) { action.time = a.at; }
      action.timeScale = a.pause ? 1e-6 : 1;          // "paused" but still counted as a running clip
      clips.current = action; clips.currentRole = a.role || 'try:' + a.clip;
      if (a.live) pet.gesture = { name: a.role || 'pose', t0: clock.t, clip: true, dur: 60 };
      return { ok: true, tracks: clip.tracks.length, duration: clip.duration };
    }
    case 'stop_clip': stopClip(0.01); if (clips.current) clips.current.stop(); clips.current = null; clips.currentRole = ''; return { ok: true };
    case 'snapshot': return { ok: true, png: renderPreview(!a.close), root: root.position.toArray(), scale: +pet.scale.toFixed(1) };
    case 'force_state': pet.frozen = a.state !== 'auto'; if (a.state !== 'auto') { setState(a.state); pet.sleeping = /sleep/.test(a.state); } if (a.phase) pet.phase = a.phase; return { ok: true };
    case 'speech': onSpeech(a); return { ok: true };
    case 'action': { const f = ACTIONS[a.action]; if (!f) return { ok: false, error: 'Неизвестное действие: ' + a.action }; f(); return { ok: true, state: pet.state }; }
    case 'gesture': { const ok = gesture(a.name) || (ACTIONS[a.name] && (ACTIONS[a.name](), true)); return ok ? { ok: true } : { ok: false, error: 'Нет такого жеста.' }; }
    case 'set_emotion': setEmotion(a.emotions || {}, a.seconds || 8); return { ok: true };
    case 'mood': return setMood(String(a.name || ''), a.seconds || 8, a.weight == null ? 1 : a.weight) ? { ok: true } : { ok: false, error: 'Нет такой эмоции.' };
    case 'say': return { ok: speak(String(a.text || 'Привет! Так звучит мой голос.')) };
    case 'mic': if (a.on === false) micStop(a.send !== false); else micToggle(); return { ok: true, recording: !!mic.rec };
    case 'stop_voice': stopVoice(); return { ok: true };
    case 'memory': if (a.reset) { mem.bond = 0.35; mem.wary = 0; mem.dirty = true; saveMem(); } return { ok: true, bond: +mem.bond.toFixed(2), wary: +mem.wary.toFixed(2) };
    case 'touch_test': {                                                   // debug: simulate a touch on a zone
      const h = boneScreen(a.zone === 'legs' ? 'leftLowerLeg' : a.zone === 'body' ? 'chest' : 'head') || new V3(pet.x, pet.y, 0);
      const y = a.zone === 'face' ? h.y + pet.heightPx * 0.03 : a.zone === 'head' ? h.y + pet.heightPx * 0.11 : h.y;
      onTouch({ clientX: h.x, clientY: H - y }); return { ok: true, zone: touchZone(h.x, y), bond: mem.bond, wary: mem.wary };
    }
    case 'sit_variant': if (SIT_VARIANTS[a.name]) pet.sitVariant = a.name; return { ok: true, variant: pet.sitVariant };
    case 'drag_test': {                               // debug: synthetic press-drag-release over the canvas
      const ev = (type, x, y) => (type === 'mouseup' ? window : canvas).dispatchEvent(new MouseEvent(type, { clientX: x, clientY: y, button: 0, bubbles: true }));
      const steps = [];
      ev('mousemove', a.x1, a.y1); ev('mousemove', a.x1 + 1, a.y1); hitTest(); steps.push({ over: cursor.over });
      ev('mousedown', a.x1 + 1, a.y1); steps.push({ down: drag.down, pdrag: !!portrait.drag });
      for (let i = 1; i <= 10; i++) { ev('mousemove', a.x1 + (a.x2 - a.x1) * i / 10, a.y1 + (a.y2 - a.y1) * i / 10); await new Promise((r) => setTimeout(r, 20)); }
      steps.push({ grabbed: drag.grabbed, moved: portrait.drag && portrait.drag.moved, cx: portrait.cx, cy: portrait.cy, petx: pet.x, pety: pet.y, state: pet.state });
      ev('mouseup', a.x2, a.y2);
      return { ok: true, steps };
    }
    case 'ear_sim': ear.simHear = !!a.hear; ear.simBusy = !!a.busy; return { ok: true };   // debug: show the button states
    case 'listen_state': return { ok: true, on: ear.on, speaking: ear.speaking, busy: ear.busy, floor: +ear.floor.toFixed(4), follow: Math.max(0, Math.round(ear.followUntil - performance.now())) };
    case 'input_log': return { ok: true, log: inputLog.slice(-40) };
    case 'mouse': { let cur = null; try { cur = await api.cursor(); } catch (e) { cur = String(e); } return { cur, ok: true, x: cursor.x, y: cursor.y, over: cursor.over, interactive, down: drag.down, grabbed: drag.grabbed, pdrag: portrait.drag, overBubble: cursor.overBubble, W, H }; }
    case 'head_rect': { if (portrait.on) return { ok: true, portrait: true, cx: Math.round(portrait.cx), cy: Math.round(portrait.cy), r: Math.round(portrait.r) }; const h = headWorld(); return { ok: true, x: Math.round(h.x), y: Math.round(H - h.y), feetY: Math.round(H - pet.y), h: Math.round(pet.heightPx) }; }
    case 'list_moods': return { ok: true, moods: Object.entries(MOODS).map(([id, m]) => ({ id, label: m.label })) };
    case 'set_expression': setEmotion(a.name ? { [a.name]: 1 } : {}, a.seconds || 8); return { ok: true };
    case 'list_expressions': return { ok: true, expressions: listExpressions() };
    case 'sleep': (a.on === false ? wake() : goSleep()); return { ok: true };
    case 'talk': if (a.on === false) { face.speech = ''; face.spoken = 0; } else { face.speech = String(a.text || 'а о у э'); face.spoken = 0; } return { ok: true };
    case 'list_bones': return { ok: true, bones: pet.vrm ? Object.keys(pet.vrm.humanoid.humanBones) : [] };
    case 'set_pose': pet.manual.set(a.bone, [a.x || 0, a.y || 0, a.z || 0]); return { ok: true };
    case 'reset_pose': pet.manual.clear(); return { ok: true };
    case 'status': return { ok: true, screen: scene_.kind, speaking: voice.speaking, audio: !!voice.audio, mouth: +Math.max(...Object.values(face.mouth)).toFixed(2), bond: +mem.bond.toFixed(2), wary: +mem.wary.toFixed(2), mood: mood.name, clip: clips.currentRole || '', clipName: clips.current && clips.current.userData ? clips.current.userData.name : '', phase: pet.phase, state: pet.state, sleeping: pet.sleeping, energy: +pet.energy.toFixed(2), joy: +pet.joy.toFixed(2), surface: pet.surface.kind === 'window' ? (world.ledges.find((l) => l.id === pet.surface.id) || {}).title || 'window' : pet.surface.kind, x: Math.round(pet.x), y: Math.round(pet.y) };
    default: return { ok: false, error: 'Неизвестная команда: ' + name };
  }
}
api.onCommand(async (id, command) => {
  let result;
  try { result = await handle(command.name, command.args || {}); }
  catch (e) { result = { ok: false, error: e && e.message ? e.message : String(e) }; log('command failed', command.name, result.error); }
  api.answer(id, result);
});
api.onWorld(onWorld);
// VRoid clothes use a lilac shade colour (0.62, 0.67, 0.93): turned-away surfaces such as the
// inside of a cape glow lilac on a dark desktop. "neutral" keeps the shade's brightness but makes
// it grey (and as dark as the cloth) for clothes and accessories; skin, face, eyes and hair keep
// the author's colours.
function applyShadeTint(vrm = pet.vrm) {
  if (!vrm) return;
  const neutral = settings.shadeTint !== 'author';
  vrm.scene.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (!m || !m.shadeColorFactor || !m.shadeColorFactor.isColor) continue;
      if (!m.userData.origShade) m.userData.origShade = m.shadeColorFactor.clone();
      const c = m.userData.origShade;
      if (neutral && !/SKIN|FACE|EYE|HAIR|MOUTH/i.test(m.name || '')) {
        // grey of the same brightness, times the base colour: some VRoid parts are a light lilac
        // texture tinted black by baseColor (0.01); MToon's shade ignores that tint, so dark cloth
        // would show the bright lilac texture wherever it is in shadow
        const l = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
        const base = m.color && m.color.isColor ? m.color : new THREE.Color(1, 1, 1);
        m.shadeColorFactor.setRGB(l * base.r, l * base.g, l * base.b);
      } else m.shadeColorFactor.copy(c);
    }
  });
}
// ------------------------------------------------------------------ look: contact shadow + rim light
// The camera looks straight at her, so a floor shadow is drawn as a soft flat ellipse just behind
// the feet at floor level: it reads as the shadow on the floor (or on a window ledge) below her.
const contactShadow = (() => {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(0,0,0,0.5)'); gr.addColorStop(0.45, 'rgba(0,0,0,0.26)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 }));
  m.renderOrder = -1; m.visible = false;
  scene.add(m);
  return m;
})();
function updateShadow(dt) {
  const on = settings.look && settings.look.shadow !== false && pet.vrm && !settings.hidden;
  const grounded = isGrounded() && pet.surface && pet.surface.kind !== 'air';
  const want = on && grounded && !portrait.on ? 1 : 0;
  const m = contactShadow.material;
  m.opacity += (want * 0.9 - m.opacity) * damp(want ? 6 : 12, dt);
  contactShadow.visible = m.opacity > 0.01;
  if (!contactShadow.visible || !pet.vrm) return;
  const hips = bone('hips'), lf = bone('leftFoot'), rf = bone('rightFoot');
  const hx = hips ? hips.getWorldPosition(new V3()).x : pet.x / pet.scale;
  const spread = lf && rf ? Math.abs(lf.getWorldPosition(new V3()).x - rf.getWorldPosition(new V3()).x) : 0;
  const hm = pet.base ? pet.base.heightM : 1.6;
  const lying = pet.state === 'sleep';
  const w = Math.max(hm * (lying ? 1.05 : 0.42), spread + hm * 0.22);
  contactShadow.scale.set(w, hm * 0.075, 1);
  contactShadow.position.set(lying ? root.position.x : hx, pet.y / pet.scale - hm * 0.022, -hm * 0.6);   // mostly below the feet line
}
/** Soft rim light on the MToon materials (kept subtle; restores the author's values when off). */
function applyRim(vrm = pet.vrm) {
  if (!vrm) return;
  const on = !settings.look || settings.look.rim !== false;
  vrm.scene.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of [].concat(o.material)) {
      if (!m || !m.parametricRimColorFactor || !m.parametricRimColorFactor.isColor) continue;
      const u = m.userData;
      if (!u.origRim) u.origRim = { c: m.parametricRimColorFactor.clone(), p: m.parametricRimFresnelPowerFactor, l: m.parametricRimLiftFactor, mix: m.rimLightingMixFactor };
      if (on && u.origRim.c.r + u.origRim.c.g + u.origRim.c.b < 0.4) {       // only where the author left the rim (almost) off
        m.parametricRimColorFactor.setRGB(0.3, 0.3, 0.34); m.parametricRimFresnelPowerFactor = 4.5; m.parametricRimLiftFactor = 0; m.rimLightingMixFactor = 1;
      } else { m.parametricRimColorFactor.copy(u.origRim.c); m.parametricRimFresnelPowerFactor = u.origRim.p; m.parametricRimLiftFactor = u.origRim.l; m.rimLightingMixFactor = u.origRim.mix; }
    }
  });
}
function applySettings(s) {
  if (!s) return;
  const tintChanged = s.shadeTint && s.shadeTint !== settings.shadeTint;
  const heightChanged = s.height && s.height !== settings.height;
  const qualityChanged = s.quality && s.quality !== settings.quality;
  Object.assign(settings, s);
  if (s.quality && QUALITY[s.quality]) qualityKey = s.quality;
  if (qualityChanged) resize();
  if (heightChanged) { applyScale(); rebuildLedges(); }
  if (tintChanged) applyShadeTint();
  if (s.look) applyRim();
  if (s.voice || s.voiceDevices) applyMute();
  if (pet.vrm) loadClips();
}
api.onSettings(applySettings);
api.settings().then(applySettings).catch(() => {});
window.__petReady = true;
