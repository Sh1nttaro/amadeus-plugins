'use strict';
// Unity humanoid animation import: .unitypackage (tar.gz of <guid>/asset + <guid>/pathname)
// and .anim (YAML AnimationClip). Humanoid clips store "muscle" curves (Left Arm Down-Up …,
// values about -1..1) instead of bone rotations; they are saved as JSON and turned into VRM
// bone rotations in the renderer (pet.js, muscleClip).
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

/** .anim files inside a .unitypackage: [{ name, text }]. */
function unityPackageAnims(file) {
  const tar = zlib.gunzipSync(fs.readFileSync(file));
  const byGuid = {};
  for (let o = 0; o + 512 <= tar.length;) {
    const head = tar.subarray(o, o + 512);
    if (head.every((b) => b === 0)) break;
    const field = (a, n) => head.subarray(a, a + n).toString('utf8').replace(/\0.*$/s, '');
    let name = field(0, 100);
    const prefix = field(345, 155);
    if (prefix) name = prefix + '/' + name;
    const size = parseInt(field(124, 12).trim() || '0', 8) || 0;
    const type = String.fromCharCode(head[156] || 48);
    const body = tar.subarray(o + 512, o + 512 + size);
    o += 512 + Math.ceil(size / 512) * 512;
    if (type !== '0' && type !== '\0') continue;
    const m = name.replace(/^\.\//, '').match(/^([^/]+)\/(asset|pathname)$/);
    if (m) (byGuid[m[1]] = byGuid[m[1]] || {})[m[2]] = body;
  }
  const out = [];
  for (const g of Object.values(byGuid)) {
    if (!g.asset || !g.pathname) continue;
    const p = g.pathname.toString('utf8').split('\n')[0].trim();
    if (/\.anim$/i.test(p)) out.push({ name: path.basename(p), text: g.asset.toString('utf8') });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

/** Muscle/root curves of a Unity .anim: { name, duration, curves: { attribute: [[t, v], …] } } or null. */
function parseAnim(text) {
  if (!/AnimationClip:/.test(text)) return null;
  const name = (text.match(/^\s*m_Name: (.*)$/m) || [])[1] || 'anim';
  const fc = text.split(/\n\s*m_FloatCurves:/)[1];
  if (!fc) return null;
  const section = fc.split(/\n\s*m_PPtrCurves:/)[0];
  const curves = {};
  for (const blk of section.split(/\n  - serializedVersion: \d+\n/).slice(1)) {
    const attr = (blk.match(/\n\s*attribute: (.+)/) || [])[1];
    const cls = (blk.match(/\n\s*classID: (\d+)/) || [])[1];
    if (!attr || cls !== '95') continue;                          // Animator (humanoid) curves only
    const keys = [];
    const re = /time: (-?[\d.eE+-]+)\s*\n\s*value: (-?[\d.eE+-]+)/g;
    let m;
    while ((m = re.exec(blk))) keys.push([Number(m[1]), Number(m[2])]);
    if (keys.length) curves[attr.trim()] = keys;
  }
  if (!Object.keys(curves).some((k) => /Arm Down-Up|Spine Front-Back|Upper Leg/.test(k))) return null;
  let duration = 0;
  for (const k of Object.values(curves)) duration = Math.max(duration, k[k.length - 1][0]);
  // a pose saved as several identical keys is still a pose
  if (Object.values(curves).every((k) => k.every(([, v]) => Math.abs(v - k[0][1]) < 1e-4))) {
    for (const a of Object.keys(curves)) curves[a] = [curves[a][0]];
    duration = 0;
  }
  return { name: name.trim(), duration, curves };
}

module.exports = { unityPackageAnims, parseAnim };
