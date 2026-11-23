'use strict';
// Archive extraction for animation/model imports (Booth ships motions as .zip, sometimes .rar/.7z).
// Zip names packed on Japanese Windows lack the UTF-8 flag, so names are decoded by trying
// UTF-8, Shift_JIS, GBK and Big5 and keeping the first that decodes every entry.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execFile } = require('child_process');

const ARCHIVE_EXT = new Set(['.zip', '.rar', '.7z']);

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

function chooseNameEncoding(buf, entries) {
  if (entries.every((e) => e.utf8Flag)) return 'utf-8';
  for (const enc of NAME_ENCODINGS) {
    if (entries.every((e) => (e.utf8Flag ? decodeName(e.nameBytes, 'utf-8') : decodeName(e.nameBytes, enc)) !== null)) return enc;
  }
  return 'latin1';
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

module.exports = { ARCHIVE_EXT, extractArchive, walkFiles };
