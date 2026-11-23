// Live2D model importer for the companion: turns a downloaded archive (.zip/.rar/.7z)
// or folder into models/<id>/ with character.json + catalog.json.
//  - finds every Cubism 3+ model (.model3.json + .moc3 + textures), also inside nested archives
//  - repairs file names from zips made on Japanese/Chinese systems (Shift_JIS / GBK / Big5)
//  - wires loose motions/expressions the model3.json does not reference
//  - takes readable names from VTube Studio hotkeys and translates common ones
//  - explains what is wrong with Cubism 2 models, editor projects (.cmo3) and PSD-only packs
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const os = require('os');
const { execFile } = require('child_process');

const ARCHIVE_EXT = new Set(['.zip', '.rar', '.7z']);
const MAX_NESTED = 2;

// ---------------------------------------------------------------- zip reader
// Own reader (no dependencies) so we can choose how file names are decoded:
// archives from Booth are often packed on Japanese Windows without the UTF-8 flag.
const NAME_ENCODINGS = ['utf-8', 'shift_jis', 'gbk', 'big5'];

function readZipEntries(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('Архив повреждён или это не zip.');
  let count = buf.readUInt16LE(eocd + 10);
  let cdOffset = buf.readUInt32LE(eocd + 16);
  if (cdOffset === 0xffffffff || count === 0xffff) {
    const loc = eocd - 20;
    if (loc >= 0 && buf.readUInt32LE(loc) === 0x07064b50) {
      const z64 = Number(buf.readBigUInt64LE(loc + 8));
      if (buf.readUInt32LE(z64) === 0x06064b50) {
        count = Number(buf.readBigUInt64LE(z64 + 32));
        cdOffset = Number(buf.readBigUInt64LE(z64 + 48));
      }
    }
  }
  const entries = [];
  let p = cdOffset;
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('Архив повреждён (центральный каталог).');
    const flags = buf.readUInt16LE(p + 8);
    const method = buf.readUInt16LE(p + 10);
    let compSize = buf.readUInt32LE(p + 20);
    let size = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    let localOffset = buf.readUInt32LE(p + 42);
    const nameBytes = buf.subarray(p + 46, p + 46 + nameLen);
    // zip64 extra field (0x0001): only the fields that overflowed are present, in order
    let e = p + 46 + nameLen;
    const extraEnd = e + extraLen;
    while (e + 4 <= extraEnd) {
      const id = buf.readUInt16LE(e);
      const len = buf.readUInt16LE(e + 2);
      if (id === 0x0001) {
        let q = e + 4;
        if (size === 0xffffffff) { size = Number(buf.readBigUInt64LE(q)); q += 8; }
        if (compSize === 0xffffffff) { compSize = Number(buf.readBigUInt64LE(q)); q += 8; }
        if (localOffset === 0xffffffff) { localOffset = Number(buf.readBigUInt64LE(q)); }
      }
      e += 4 + len;
    }
    entries.push({ flags, method, compSize, size, localOffset, nameBytes, utf8Flag: (flags & 0x800) !== 0, encrypted: (flags & 1) !== 0 });
    p = extraEnd + commentLen;
  }
  return entries;
}

function zipEntryData(buf, entry) {
  const p = entry.localOffset;
  if (buf.readUInt32LE(p) !== 0x04034b50) throw new Error('Архив повреждён (локальный заголовок).');
  const start = p + 30 + buf.readUInt16LE(p + 26) + buf.readUInt16LE(p + 28);
  const raw = buf.subarray(start, start + entry.compSize);
  if (entry.method === 0) return raw;
  if (entry.method === 8) return zlib.inflateRawSync(raw);
  throw new Error('Неподдерживаемое сжатие в zip (метод ' + entry.method + '). Распакуйте архив вручную и импортируйте папку.');
}

function decodeName(bytes, encoding) {
  try { return new TextDecoder(encoding, { fatal: true }).decode(bytes); } catch { return null; }
}

/** Pick the name encoding under which the files referenced by the model3.json files exist. */
function chooseNameEncoding(buf, entries) {
  if (entries.every((e) => e.utf8Flag)) return 'utf-8';
  const decoded = {};
  for (const enc of NAME_ENCODINGS) {
    const names = entries.map((e) => (e.utf8Flag ? decodeName(e.nameBytes, 'utf-8') : decodeName(e.nameBytes, enc)));
    if (names.every((n) => n !== null)) decoded[enc] = names;
  }
  const candidates = Object.keys(decoded);
  if (!candidates.length) return 'latin1';
  if (candidates.length === 1) return candidates[0];
  // model3.json content is UTF-8 regardless of how the archiver encoded the names
  const refs = [];
  entries.forEach((entry, i) => {
    const any = decoded[candidates[0]][i];
    if (!/\.model3\.json$/i.test(any) || entry.encrypted) return;
    try {
      const json = JSON.parse(zipEntryData(buf, entry).toString('utf8').replace(/^\uFEFF/, ''));
      const dir = any.replace(/\\/g, '/').split('/').slice(0, -1);
      for (const rel of model3References(json)) refs.push({ i, dir, rel });
    } catch { /* not decisive */ }
  });
  let best = candidates[0];
  let bestScore = -1;
  for (const enc of candidates) {
    const set = new Set(decoded[enc].map((n) => n.replace(/\\/g, '/').toLowerCase()));
    let score = 0;
    for (const r of refs) {
      const base = decoded[enc][r.i].replace(/\\/g, '/').split('/').slice(0, -1);
      if (set.has(path.posix.normalize([...base, r.rel].join('/')).toLowerCase())) score++;
    }
    if (score > bestScore) { best = enc; bestScore = score; }
  }
  return best;
}

function extractZip(file, dest) {
  const buf = fs.readFileSync(file);
  const entries = readZipEntries(buf);
  if (entries.some((e) => e.encrypted)) {
    throw new Error('Архив защищён паролем. Распакуйте его вручную (пароль обычно указан на странице товара) и импортируйте папку.');
  }
  const encoding = chooseNameEncoding(buf, entries);
  for (const entry of entries) {
    const name = (entry.utf8Flag ? decodeName(entry.nameBytes, 'utf-8') : decodeName(entry.nameBytes, encoding)) || entry.nameBytes.toString('latin1');
    const clean = name.replace(/\\/g, '/');
    if (clean.startsWith('/') || /^[a-z]:/i.test(clean) || clean.split('/').includes('..')) continue;
    if (clean.endsWith('/')) continue;
    const target = path.join(dest, ...clean.split('/'));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, zipEntryData(buf, entry));
  }
}

/** .rar / .7z through the bsdtar (libarchive) that ships with Windows 10+. */
function extractWithTar(file, dest) {
  const tar = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'tar.exe');
  if (!fs.existsSync(tar)) return Promise.reject(new Error('Для .rar/.7z нужен tar.exe из Windows 10 или новее.'));
  return new Promise((resolve, reject) => {
    execFile(tar, ['-xf', file, '-C', dest], { windowsHide: true, maxBuffer: 16 * 1024 * 1024 }, (error, _stdout, stderr) => {
      if (!error) return resolve();
      const detail = String(stderr || error.message || '').trim();
      if (/passphrase|encrypt|password/i.test(detail)) return reject(new Error('Архив защищён паролем. Распакуйте его вручную и импортируйте папку.'));
      // bsdtar exits non-zero for entries it cannot name (e.g. folder records in old RARs)
      // while the files themselves are extracted: carry on if anything came out.
      if (walkFiles(dest).length) return resolve();
      reject(new Error('Не удалось распаковать архив. ' + detail.split('\n')[0].trim().slice(0, 200)));
    });
  });
}

async function extractArchive(file, dest) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.zip') extractZip(file, dest);
  else await extractWithTar(file, dest);
}

// ---------------------------------------------------------------- model discovery
function walkFiles(dir, out = [], depth = 0) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === '__MACOSX') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { if (depth < 12) walkFiles(full, out, depth + 1); }
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}

function model3References(model) {
  const refs = model && model.FileReferences ? model.FileReferences : {};
  const out = [];
  if (typeof refs.Moc === 'string') out.push(refs.Moc);
  for (const t of Array.isArray(refs.Textures) ? refs.Textures : []) if (typeof t === 'string') out.push(t);
  return out.map((r) => r.replace(/\\/g, '/'));
}

/** Expand archives found inside the staged tree (Booth packs often nest the model zip). */
async function expandNested(stage, depth) {
  if (depth >= MAX_NESTED) return;
  const nested = walkFiles(stage).filter((f) => ARCHIVE_EXT.has(path.extname(f).toLowerCase()));
  for (const file of nested) {
    const dest = file + '.__x';
    try {
      fs.mkdirSync(dest, { recursive: true });
      await extractArchive(file, dest);
      await expandNested(dest, depth + 1);
    } catch { /* a broken inner archive is not fatal if another one has the model */ }
  }
}

/** Why there is no usable model in a folder, in plain words. */
function explainMissing(files) {
  const names = files.map((f) => path.basename(f).toLowerCase());
  if (names.some((n) => n.endsWith('.moc')) || names.some((n) => n === 'model.json' || n.endsWith('.model.json'))) {
    return 'Это модель Cubism 2 (.moc / model.json) — плагин поддерживает только Cubism 3 и новее (.model3.json + .moc3). Поищите у автора версию для Cubism 3/4 или VTube Studio.';
  }
  if (names.some((n) => n.endsWith('.cmo3') || n.endsWith('.can3'))) {
    return 'В архиве только проект Cubism Editor (.cmo3/.can3). Его нужно экспортировать в редакторе: File → Export For Runtime → moc3.';
  }
  if (names.some((n) => n.endsWith('.psd'))) {
    return 'В архиве только PSD-исходник — это ещё не готовая модель Live2D, её нужно собрать в Cubism Editor.';
  }
  if (names.some((n) => n.endsWith('.moc3'))) {
    return 'Найден .moc3, но нет файла .model3.json, который его описывает. Архив неполный.';
  }
  return 'Не найдена модель Live2D: нужны .model3.json, .moc3 и текстуры.';
}

function findCaseInsensitive(dir, rel) {
  const parts = rel.split('/').filter(Boolean);
  let current = dir;
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') { current = path.dirname(current); continue; }
    let entries;
    try { entries = fs.readdirSync(current); } catch { return null; }
    const hit = entries.find((e) => e === part) || entries.find((e) => e.toLowerCase() === part.toLowerCase());
    if (!hit) return null;
    current = path.join(current, hit);
  }
  return current;
}

// ---------------------------------------------------------------- labels
// Common expression/motion words (en / ja / zh) → Russian. Matched as substrings.
const LABELS = [
  [/blush|照れ|赤面|頬染|脸红|臉紅|红晕|紅暈/i, 'Румянец'],
  [/heart.?eye|ハート目|爱心眼|愛心眼|心眼/i, 'Глаза-сердечки'],
  [/star.?eye|星目|星星眼/i, 'Глаза-звёзды'],
  [/(?<![a-z])(cry|crying|tears?)(?![a-z])|泣|涙|哭|泪|淚/i, 'Плачет'],
  [/angry|anger|怒|生气|生氣|气|ムカ/i, 'Злится'],
  [/dark.?face|black.?face|黑脸|黒顔|黑臉|陰/i, 'Тёмное лицо'],
  [/sweat|汗/i, 'Пот'],
  [/smile|happy|joy|笑|嬉|开心|開心|高兴/i, 'Улыбка'],
  [/(?<![a-z])sad|悲|难过|難過|伤心/i, 'Грусть'],
  [/surpris|驚|惊|吃惊/i, 'Удивление'],
  [/shy|恥ずかし|害羞|羞/i, 'Смущение'],
  [/pout|ぷく|嘟嘴|鼓腮/i, 'Надулась'],
  [/wink|ウインク|眨眼/i, 'Подмигивает'],
  [/sleep|眠|睡/i, 'Сонная'],
  [/dizzy|目が回|晕|暈|ぐるぐる/i, 'Головокружение'],
  [/highlight|(?<![a-z])shine|ハイライト|高光/i, 'Блик в глазах'],
  [/no.?highlight|ハイライト.?(消|なし|オフ)|高光消失|无高光/i, 'Без блика в глазах'],
  [/drool|よだれ|口水/i, 'Слюни'],
  [/tongue|舌|吐舌/i, 'Язык'],
  [/cat.?ear|猫耳|猫咪耳/i, 'Кошачьи ушки'],
  [/(?<![a-z])(cat|kitty)(?![a-z])|猫/i, 'Котик'],
  [/glasses|眼鏡|眼镜|メガネ/i, 'Очки'],
  [/(?<![a-z])(hat|cap)(?![a-z])|帽/i, 'Шляпа'],
  [/hood|フード|兜帽/i, 'Капюшон'],
  [/mask|マスク|口罩|面具/i, 'Маска'],
  [/headphone|ヘッドホン|耳机|耳機/i, 'Наушники'],
  [/microphone|(?<![a-z])mic(?![a-z])|マイク|麦克风|話筒/i, 'Микрофон'],
  [/(?<![a-z])pen(?![a-z])|ペン|笔|筆/i, 'Ручка'],
  [/apron|エプロン|围裙|圍裙/i, 'Фартук'],
  [/shadow|影|阴影/i, 'Тень'],
  [/white.?eye|白目|白眼/i, 'Белые глаза'],
  [/close.?eye|閉じ|闭眼|閉眼/i, 'Закрытые глаза'],
  [/idle|wait|待機|待机|default|通常/i, 'Ожидание'],
  [/(?<![a-z])tap|touch|タップ|点击|點擊|点一下/i, 'Касание'],
  [/shake|揺|摇头|搖頭/i, 'Качает головой'],
  [/(?<![a-z])nod(?![e])|頷|点头|點頭/i, 'Кивок'],
  [/(?<![a-z])wave|手を振|挥手|揮手/i, 'Машет рукой'],
  [/greet|hello|挨拶|打招呼/i, 'Приветствие'],
  [/shock|ショック|震惊|震驚/i, 'Шок'],
  [/confus|困惑|疑惑|迷茫/i, 'Растерянность'],
  [/yandere|ヤンデレ|病娇|病嬌/i, 'Яндере'],
  [/dance|ダンス|跳舞/i, 'Танец'],
  [/jump|ジャンプ|跳/i, 'Прыжок'],
  [/walk|歩|走/i, 'Ходьба'],
  [/chibi|ちび|q版/i, 'Чиби'],
  [/(?<![a-z])brb(?![a-z])|afk|離席|离开/i, 'Отошла'],
  [/curious|好奇|興味/i, 'Любопытство'],
  [/excit|兴奋|興奮|ワクワク/i, 'Восторг'],
  [/menac|威圧|ゴゴゴ/i, 'Угрожающе'],
  [/pant|喘|ハァハァ/i, 'Запыхалась'],
  [/aura|オーラ|光环/i, 'Аура'],
  [/think|考え|思考|思考中/i, 'Задумалась'],
  [/love|好き|喜欢|喜歡/i, 'Влюблённость'],
  [/scar(ed|y)|fear|怖|害怕/i, 'Испуг'],
  [/photo|camera|拍照|照相|写真|カメラ/i, 'Фото'],
  [/wing|翅膀|羽|翼/i, 'Крылья'],
  [/eye.?patch|眼罩|眼帯/i, 'Повязка на глаз'],
  [/coat|jacket|外套|上着|ジャケット/i, 'Куртка'],
  [/collar|choker|项圈|項圈|首輪|チョーカー/i, 'Ошейник'],
  [/neck|脖子|首/i, 'Шея'],
  [/(?<![a-z])hands?(?![a-z])|手/i, 'Руки'], // last: 手 is part of many words
];
const EXACT = {
  daiji: 'Ожидание', huishou: 'Машет рукой', ku: 'Плачет', han: 'Пот', yy: 'Головокружение', yun: 'Головокружение',
  mmy: 'Прищур', mimiyan: 'Прищур', d: 'Дрожь', dou: 'Дрожь', lks: 'Слюни', liukoushui: 'Слюни', lianhong: 'Румянец',
  hl: 'Тёмное лицо', heilian: 'Тёмное лицо', axy: 'Глаза-сердечки', aixinyan: 'Глаза-сердечки', xxy: 'Глаза-звёзды',
  xingxingyan: 'Глаза-звёзды', sq: 'Злится', shengqi: 'Злится', kx: 'Улыбка', kaixin: 'Улыбка', xiao: 'Улыбка',
  hx: 'Смущение', haixiu: 'Смущение', jy: 'Удивление', jingya: 'Удивление', sj: 'Сонная', shuijiao: 'Сонная',
  zy: 'Подмигивает', zhayan: 'Подмигивает', tt: 'Язык', tushe: 'Язык', wx: 'Улыбка', weixiao: 'Улыбка',
  meiyan: 'Подмигивает', diantou: 'Кивок', yaotou: 'Качает головой', zhaiyan: 'Подмигивает',
  zhaoxiang: 'Фото', paizhao: 'Фото', chibang: 'Крылья', waitao: 'Куртка', yanzhao: 'Повязка на глаз',
};
function translateLabel(name) {
  const raw = String(name || '').replace(/\.(exp3|motion3)\.json$/i, '').replace(/[_-]?(exp|ani|anim|animation|motion|mtn)$/i, '').trim();
  const exact = EXACT[raw.toLowerCase().replace(/[\s_-]+/g, '')];
  if (exact) return exact;
  const no = LABELS.find(([re, ru]) => /^Без блика/.test(ru) && re.test(raw));
  if (no) return no[1];
  for (const [re, ru] of LABELS) if (re.test(raw)) return ru;
  return raw.replace(/[_-]+/g, ' ').trim() || 'Без названия';
}

/** VTube Studio hotkeys name expressions/animations far better than their file names. */
function vtsNames(dir) {
  const names = new Map();
  const vts = fs.readdirSync(dir).find((f) => f.toLowerCase().endsWith('.vtube.json'));
  if (!vts) return names;
  try {
    const data = readJson(path.join(dir, vts));
    for (const h of Array.isArray(data.Hotkeys) ? data.Hotkeys : []) {
      if (!h || typeof h.File !== 'string' || typeof h.Name !== 'string' || !h.Name.trim()) continue;
      if (h.Action === 'ToggleExpression' || h.Action === 'TriggerAnimation' || h.Action === 'ChangeIdleAnimation') {
        names.set(path.basename(h.File).toLowerCase(), h.Name.trim());
      }
    }
  } catch { /* optional */ }
  return names;
}

function labelFor(file, names) {
  const base = path.basename(String(file)).toLowerCase();
  const hint = names.get(base);
  const label = translateLabel(hint || path.basename(String(file)));
  const original = (hint || path.basename(String(file))).replace(/\.(exp3|motion3)\.json$/i, '');
  return { label, original };
}

// ---------------------------------------------------------------- install
function idPart(value) {
  const s = String(value).normalize('NFKD').replace(/[^\x00-\x7f]/g, '').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^[._-]+|[._-]+$/g, '').slice(0, 40);
  return s.length >= 2 ? s : 'model-' + crypto.createHash('sha256').update(String(value), 'utf8').digest('hex').slice(0, 10);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === '__MACOSX' || entry.name.endsWith('.__x')) continue;
    const a = path.join(src, entry.name);
    const b = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(a, b);
    else if (entry.isFile()) fs.copyFileSync(a, b);
  }
}

function existingHashes(modelsDir) {
  const out = new Map();
  let dirs = [];
  try { dirs = fs.readdirSync(modelsDir, { withFileTypes: true }).filter((e) => e.isDirectory()); } catch {}
  for (const d of dirs) {
    try {
      const c = readJson(path.join(modelsDir, d.name, 'character.json'));
      // models added before the importer recorded the hash (e.g. by amadeus-v2): hash their .moc3 now
      const hash = (c && c.source && c.source.mocHash) || legacyMocHash(path.join(modelsDir, d.name), c);
      if (hash) out.set(hash, { id: d.name, name: c.displayName || d.name });
    } catch {}
  }
  return out;
}

function sha1(file) { return crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex'); }

const legacyHashCache = new Map();
function legacyMocHash(dir, character) {
  try {
    const model3 = path.join(dir, character.live2d.model);
    const moc = findCaseInsensitive(dir, String(readJson(model3).FileReferences.Moc).replace(/\\/g, '/'));
    if (!moc) return null;
    const key = moc + ':' + fs.statSync(moc).mtimeMs;
    if (!legacyHashCache.has(key)) legacyHashCache.set(key, sha1(moc));
    return legacyHashCache.get(key);
  } catch { return null; }
}

/** Wire loose .motion3.json / .exp3.json files into the model and repair broken references. */
function completeReferences(dir, model3Name, model) {
  const refs = model.FileReferences || (model.FileReferences = {});
  const files = walkFiles(dir).map((f) => path.relative(dir, f).split(path.sep).join('/'));
  const motions = files.filter((f) => /\.motion3\.json$/i.test(f));
  const exps = files.filter((f) => /\.exp3\.json$/i.test(f));
  const fix = (entry, pool) => {
    if (!entry || typeof entry.File !== 'string') return false;
    entry.File = entry.File.replace(/\\/g, '/');
    if (findCaseInsensitive(dir, entry.File)) return true;
    const want = path.posix.basename(entry.File).toLowerCase();
    const found = pool.find((f) => path.posix.basename(f).toLowerCase() === want);
    if (found) { entry.File = found; return true; }
    return false;
  };
  let groups = refs.Motions && typeof refs.Motions === 'object' ? refs.Motions : {};
  for (const key of Object.keys(groups)) {
    groups[key] = (Array.isArray(groups[key]) ? groups[key] : []).filter((m) => fix(m, motions));
    if (!groups[key].length) delete groups[key];
  }
  const referenced = new Set(Object.values(groups).flat().map((m) => m.File.toLowerCase()));
  const loose = motions.filter((f) => !referenced.has(f.toLowerCase()));
  if (loose.length) groups[Object.keys(groups).length ? 'Extra' : 'Imported'] = loose.map((File) => ({ File }));
  refs.Motions = groups;
  let expressions = (Array.isArray(refs.Expressions) ? refs.Expressions : []).filter((e) => fix(e, exps));
  const usedExp = new Set(expressions.map((e) => e.File.toLowerCase()));
  for (const f of exps) {
    if (usedExp.has(f.toLowerCase())) continue;
    expressions.push({ Name: path.posix.basename(f).replace(/\.exp3\.json$/i, ''), File: f });
  }
  const seen = new Set();
  expressions = expressions.filter((e) => { const k = String(e.Name || e.File); if (seen.has(k)) return false; seen.add(k); return true; });
  refs.Expressions = expressions;
  return model;
}

const IDLE = /idle|stand|wait|default|normal|daiji|待機|待机|默认|デフォルト|通常|アイドル|ожид/i;

function buildDescriptor(model3Name, model, id, displayName, names, source) {
  const refs = model.FileReferences || {};
  const groups = refs.Motions || {};
  const expressions = refs.Expressions || [];
  const idleGroup = Object.keys(groups).find((g) => IDLE.test(g) || groups[g].some((m) => IDLE.test(path.posix.basename(m.File)))) || '';
  const groupLabel = (key) => {
    if (!key || key === 'Imported') return 'Движения';
    if (key === 'Extra') return 'Другие движения';
    const t = translateLabel(key);
    return t === key ? key : t;
  };
  const descriptor = {
    characterManifestVersion: 2,
    id,
    displayName,
    description: 'Импортированная Live2D модель',
    version: '1.0.0',
    license: 'Условия использования принадлежат автору модели.',
    renderer: 'live2d',
    source,
    live2d: {
      model: model3Name,
      scale: 1,
      translate: { x: 0, y: 0 },
      motions: idleGroup ? Object.fromEntries(['idle', 'thinking', 'waiting', 'tool', 'done', 'failed'].map((phase) => [phase, idleGroup])) : {},
      expressions: {},
      expressionSlots: expressions.length ? [{
        id: 'expressions', label: 'Эмоции', none: 'Нет',
        options: expressions.map((e) => ({ label: labelFor(e.File, names).label, expressions: [String(e.Name || e.File)] })),
      }] : [],
      fidgetSlots: [],
    },
  };
  const catalog = {
    motions: Object.entries(groups).map(([key, items]) => ({
      key,
      label: groupLabel(key),
      items: items.map((m) => { const l = labelFor(m.File, names); return { label: l.label, original: l.original }; }),
    })),
    expressions: expressions.map((e) => { const l = labelFor(e.File, names); return { key: String(e.Name || e.File), label: l.label, original: l.original, category: 'emotion' }; }),
  };
  // the same translated word twice ("Румянец", "Румянец") → keep them apart
  const dedupe = (list) => {
    const count = new Map();
    for (const x of list) count.set(x.label, (count.get(x.label) || 0) + 1);
    for (const x of list) if (count.get(x.label) > 1 && x.original && x.original !== x.label) x.label = x.label + ' (' + x.original + ')';
  };
  dedupe(catalog.expressions);
  for (const g of catalog.motions) dedupe(g.items);
  return { descriptor, catalog };
}

/** "_FREE無料__live2dモデルlive2d_mode神宫白子Kamiyahakuko (1)" → "神宫白子 Kamiyahakuko". */
function cleanName(raw) {
  let s = String(raw)
    .replace(/\(\d+\)/g, ' ')
    .replace(/[_]+/g, ' ')
    .replace(/(?<![a-z])(free|vts|vtube ?studio|live ?2d|model|mode|ver(sion)?|v?\d+(\.\d+)+)(?![a-z])/gi, ' ')
    .replace(/無料|免费|免費|フリー|モデル|模型|配布|挂件|掛件/g, ' ')
    .replace(/[【】\[\]「」『』()（）]+/g, ' ')
    .replace(/(^|\s)[-·.+]+(?=\s|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\s+\d{1,2}$/, '') // "… Design 2" from a re-download
    .replace(/^[-_.·\s]+|[-_.·\s]+$/g, '');
  // CJK glued to Latin: "神宫白子Kamiyahakuko" → "神宫白子 Kamiyahakuko"
  s = s.replace(/([\u3040-\u30ff\u3400-\u9fff])([A-Za-z])/g, '$1 $2').replace(/([A-Za-z])([\u3040-\u30ff\u3400-\u9fff])/g, '$1 $2');
  return s;
}

function installFromTree(root, sourceName, modelsDir) {
  const files = walkFiles(root);
  const model3s = files.filter((f) => f.toLowerCase().endsWith('.model3.json'));
  const imported = [];
  const skipped = [];
  const problems = [];
  if (!model3s.length) return { imported, skipped, problems: [explainMissing(files)] };
  const hashes = existingHashes(modelsDir);
  const used = new Set(fs.existsSync(modelsDir) ? fs.readdirSync(modelsDir) : []);
  const stem = cleanName(path.basename(sourceName).replace(/\.(zip|rar|7z)$/i, ''));
  for (const model3File of model3s) {
    const dir = path.dirname(model3File);
    const label = path.basename(model3File);
    let model;
    try { model = readJson(model3File); } catch { problems.push(`${label}: файл повреждён.`); continue; }
    const refs = model && model.FileReferences;
    if (!refs || typeof refs.Moc !== 'string' || !Array.isArray(refs.Textures) || !refs.Textures.length) { problems.push(`${label}: нет ссылки на .moc3 или текстуры.`); continue; }
    const missing = model3References(model).filter((rel) => !findCaseInsensitive(dir, rel));
    if (missing.length) { problems.push(`${label}: не хватает файлов — ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '…' : ''}. Возможно, архив неполный.`); continue; }
    const mocHash = sha1(findCaseInsensitive(dir, refs.Moc.replace(/\\/g, '/')));
    if (hashes.has(mocHash)) {
      const known = hashes.get(mocHash);
      if (!skipped.some((k) => k.id === known.id)) skipped.push(known);
      continue;
    }
    const modelStem = label.replace(/\.model3\.json$/i, '');
    const displayName = ((model3s.length === 1 ? stem : `${stem} · ${modelStem}`).replace(/\s+/g, ' ').trim() || cleanName(modelStem) || modelStem).slice(0, 60);
    const base = idPart(model3s.length === 1 ? stem : `${stem}-${modelStem}`);
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    const target = path.join(modelsDir, id);
    copyDir(dir, target);
    const names = vtsNames(target);
    const targetModel3 = path.join(target, path.basename(model3File));
    const completed = completeReferences(target, path.basename(model3File), readJson(targetModel3));
    fs.writeFileSync(targetModel3, JSON.stringify(completed, null, 2));
    const { descriptor, catalog } = buildDescriptor(path.basename(model3File), completed, id, displayName, names, { archive: path.basename(sourceName), mocHash, importedAt: new Date().toISOString() });
    fs.writeFileSync(path.join(target, 'character.json'), JSON.stringify(descriptor, null, 2));
    fs.writeFileSync(path.join(target, 'catalog.json'), JSON.stringify(catalog, null, 2));
    hashes.set(mocHash, { id, name: displayName });
    imported.push({ id, name: displayName, motions: catalog.motions.reduce((n, g) => n + g.items.length, 0), expressions: catalog.expressions.length });
  }
  return { imported, skipped: skipped.filter((k) => !imported.some((m) => m.id === k.id)), problems };
}

/** Import archives and/or folders. Never throws: every source gets a result line. */
async function importPaths(paths, modelsDir) {
  fs.mkdirSync(modelsDir, { recursive: true });
  const results = [];
  for (const source of paths) {
    const name = path.basename(source);
    const result = { source: name, imported: [], skipped: [], problems: [] };
    let stage = null;
    try {
      const stat = fs.statSync(source);
      let root = source;
      if (!stat.isDirectory()) {
        if (!ARCHIVE_EXT.has(path.extname(source).toLowerCase())) throw new Error('Поддерживаются архивы .zip, .rar, .7z и папки.');
        stage = fs.mkdtempSync(path.join(os.tmpdir(), 'amadeus-import-'));
        await extractArchive(source, stage);
        root = stage;
      } else {
        stage = fs.mkdtempSync(path.join(os.tmpdir(), 'amadeus-import-'));
        copyDir(source, stage);
        root = stage;
      }
      await expandNested(root, 0);
      Object.assign(result, installFromTree(root, name, modelsDir));
    } catch (e) {
      result.problems.push(e && e.message ? e.message : String(e));
    } finally {
      if (stage) { try { fs.rmSync(stage, { recursive: true, force: true }); } catch {} }
    }
    results.push(result);
  }
  return results;
}

/**
 * Re-derive readable labels for an already installed model (e.g. one added by amadeus-v2
 * with raw file names). Labels the user changed by hand are kept.
 */
function relabel(dir) {
  const character = readJson(path.join(dir, 'character.json'));
  const model = readJson(path.join(dir, character.live2d.model));
  const fresh = buildDescriptor(character.live2d.model, model, character.id, character.displayName, vtsNames(dir), character.source).catalog;
  let old = { motions: [], expressions: [] };
  try { old = readJson(path.join(dir, 'catalog.json')); } catch {}
  const untouched = (label, ...raws) => !label || String(label).includes(' / ') || raws.some((r) => r && String(label).trim() === String(r).trim());
  let changed = 0;
  for (const e of fresh.expressions) {
    const prev = (old.expressions || []).find((x) => x.key === e.key);
    if (prev && !untouched(prev.label, prev.key, e.original, e.key.replace(/\.exp3\.json$/i, ''))) e.label = prev.label;
    else if (!prev || prev.label !== e.label) changed++;
  }
  for (const g of fresh.motions) {
    const prevGroup = (old.motions || []).find((x) => x.key === g.key);
    g.items.forEach((item, i) => {
      const prev = prevGroup && prevGroup.items && prevGroup.items[i];
      if (prev && !untouched(prev.label, item.original)) item.label = prev.label;
      else if (!prev || prev.label !== item.label) changed++;
    });
  }
  fs.writeFileSync(path.join(dir, 'catalog.json'), JSON.stringify(fresh, null, 2));
  return { changed };
}

/** Unpack an archive with the archives inside it. */
async function extractAll(file, dest) { await extractArchive(file, dest); await expandNested(dest, 0); }

module.exports = { importPaths, relabel, translateLabel, ARCHIVE_EXT, extractAll, walkFiles };
