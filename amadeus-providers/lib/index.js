// amadeus-providers — DSH plugin: model providers you connect yourself.
// The settings page (client.js) edits the `llm-pi-ai` provider routes through DSH's own settings and
// credential APIs; this host half does what a browser page cannot: ask a provider which models it
// serves (with the stored key, which never reaches the page) and keep what it learned.
import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { probeModels } from './probe.js';

const name = 'amadeus-providers';
const inject = [];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'data.json');
const GUARD_HEADER = 'x-amadeus-providers';

// ---------------------------------------------------------------- what was learned (per provider)
//   { providers: { <id>: { checkedAt, via, models: { <modelId>: normalized }, cost: { <modelId>: { input, output } } } } }
function readStore() {
  try { const s = JSON.parse(readFileSync(DATA_FILE, 'utf8')); if (s && typeof s === 'object' && s.providers) return s; } catch { /* first run */ }
  return { providers: {} };
}
function writeStore(store) {
  mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tmp = DATA_FILE + '.tmp';
  writeFileSync(tmp, JSON.stringify(store, null, 2));
  renameSync(tmp, DATA_FILE);
}
const isId = (s) => typeof s === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(s);
const isRef = (s) => typeof s === 'string' && /^[A-Z][A-Z0-9_]{2,63}$/.test(s);

/** Merge one update into a provider's record. */
function updateProvider(store, id, set) {
  const rec = store.providers[id] || { models: {}, cost: {} };
  if (Array.isArray(set.known)) {
    rec.models = {};
    for (const m of set.known) if (m && typeof m.id === 'string') rec.models[m.id] = m;
    rec.checkedAt = Date.now();
    rec.via = typeof set.via === 'string' ? set.via : rec.via;
  }
  if (set.cost && typeof set.cost === 'object') {
    for (const [model, c] of Object.entries(set.cost)) {
      if (c === null) delete rec.cost[model];
      else if (c && typeof c === 'object') {
        const out = {};
        for (const k of ['input', 'output', 'cacheRead']) { const n = Number(c[k]); if (Number.isFinite(n) && n >= 0) out[k] = n; }
        if (Object.keys(out).length) rec.cost[model] = out; else delete rec.cost[model];
      }
    }
  }
  store.providers[id] = rec;
}

// ---------------------------------------------------------------- http helpers
function sendJson(res, status, obj) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function readJson(req) {
  return new Promise((resolve) => {
    let buf = '';
    req.on('data', (c) => { buf += c; if (buf.length > 4_000_000) req.destroy(); });
    req.on('end', () => { try { resolve(buf ? JSON.parse(buf) : {}); } catch { resolve({}); } });
  });
}
/**
 * The routes can send a stored key to an address, so a web page the user happens to visit must not
 * be able to call them: a cross-origin request cannot set the custom header without a preflight the
 * server never grants, and the Host check stops DNS-rebinding.
 */
function guarded(req, res) {
  const host = String(req.headers.host || '');
  const okHost = /^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/i.test(host);
  if (!okHost || req.headers[GUARD_HEADER] !== '1' || (req.method === 'POST' && !/application\/json/i.test(String(req.headers['content-type'] || '')))) {
    sendJson(res, 403, { ok: false, error: 'forbidden' });
    return false;
  }
  return true;
}

// ---------------------------------------------------------------- plugin
function apply(ctx) {
  let credentials = null;
  ctx.inject(['credentials'], (c) => { credentials = c.credentials; });

  async function resolveKey(ref) {
    if (!isRef(ref) || !credentials) return '';
    try { const hit = await credentials.resolve(ref); return hit && typeof hit.value === 'string' ? hit.value : ''; } catch { return ''; }
  }

  ctx.inject(['webServer'], (hostCtx) => {
    const webServer = hostCtx.webServer;
    if (!webServer || typeof webServer.register !== 'function') return;
    // One registration per path (a second one for the same path is refused); the methods share it.
    const route = (p, handlers) => webServer.register({
      kind: 'exact', path: p,
      handler: async (req, res) => {
        const handler = handlers[req.method];
        if (!handler) { res.writeHead(405, { allow: Object.keys(handlers).join(', ') }); res.end(); return; }
        if (!guarded(req, res)) return;
        try { sendJson(res, 200, await handler(req.method === 'POST' ? await readJson(req) : null)); }
        catch (e) { sendJson(res, 200, { ok: false, error: e && e.message ? e.message : String(e) }); }
      },
    });

    // Ask a provider which models it serves. The key is the typed one, else the stored credential.
    route('/amadeus-providers/probe', { POST: async (b) => {
      const apiKey = (typeof b.apiKey === 'string' && b.apiKey.trim()) || await resolveKey(b.apiKeyEnv);
      const headers = {};
      if (b.headers && typeof b.headers === 'object') for (const [k, v] of Object.entries(b.headers)) if (typeof v === 'string') headers[k] = v;
      const r = await probeModels({ baseURL: b.baseURL, api: b.api, apiKey, headers });
      if (r.ok && isId(b.provider)) { const store = readStore(); updateProvider(store, b.provider, { known: r.models, via: r.via }); writeStore(store); }
      return { ...r, keyUsed: !!apiKey };
    } });

    // GET: everything learned. POST: { provider, set?: { known?, via?, cost? }, remove?: true }
    route('/amadeus-providers/meta', {
      GET: async () => ({ ok: true, ...readStore() }),
      POST: async (b) => {
        if (!isId(b.provider)) return { ok: false, error: 'bad provider id' };
        const store = readStore();
        if (b.remove) delete store.providers[b.provider];
        else updateProvider(store, b.provider, b.set || {});
        writeStore(store);
        return { ok: true, record: store.providers[b.provider] || null };
      },
    });

    // The page logs what it did, so the host half can show it while the page cannot be inspected.
    route('/amadeus-providers/log', {
      POST: async (b) => { if (b && b.msg) { LOG.push(new Date().toISOString().slice(11, 19) + ' ' + String(b.msg).slice(0, 800)); if (LOG.length > 60) LOG.shift(); } return { ok: true }; },
      GET: async () => ({ ok: true, log: LOG }),
    });
  });
}
const LOG = [];

export { apply, inject, name };
export const _test = { updateProvider, guarded };
