// Versions of the installed harnesses, the newest ones in the npm registry, and installing an update into the
// plugin's own folder (data/runtime), which takes precedence over the copy shipped with the Amadeus app.
import { execFile, spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { RUNTIME_DIR, runtimeOf } from './runtime.js';

const REGISTRY = 'https://registry.npmjs.org';
const PACKAGES = { 'claude-code': '@anthropic-ai/claude-agent-sdk', codex: '@openai/codex' };

/** 2.1.310 from "2.1.310 (Claude Code)" or "codex-cli 0.163.0". */
export function parseVersion(text) {
  const m = /(\d+)\.(\d+)\.(\d+)/.exec(String(text || ''));
  return m ? `${m[1]}.${m[2]}.${m[3]}` : null;
}
/** > 0 when a is newer than b (a pre-release is older than its release: 1.0.0-rc.1 < 1.0.0). */
export function compareVersions(a, b) {
  const split = (v) => { const [core, ...pre] = String(v).split('-'); return { core: core.split('.').map((n) => parseInt(n, 10) || 0), pre: pre.join('-') }; };
  const x = split(a), y = split(b);
  for (let i = 0; i < 3; i++) { const d = (x.core[i] || 0) - (y.core[i] || 0); if (d) return d; }
  if (x.pre === y.pre) return 0;
  if (!x.pre) return 1;
  if (!y.pre) return -1;
  const px = x.pre.split('.'), py = y.pre.split('.');
  for (let i = 0; i < Math.max(px.length, py.length); i++) {
    if (px[i] === undefined) return -1;
    if (py[i] === undefined) return 1;
    const nx = /^\d+$/.test(px[i]), ny = /^\d+$/.test(py[i]);
    if (nx && ny) { const d = Number(px[i]) - Number(py[i]); if (d) return d; }
    else if (px[i] !== py[i]) return px[i] < py[i] ? -1 : 1;
  }
  return 0;
}

const cache = new Map();                       // exe -> { at, version }
/** What the installed program says when asked for its version. */
export function installedVersion(id) {
  const rt = runtimeOf(id);
  if (!rt.ok) return Promise.resolve(null);
  const hit = cache.get(rt.exe);
  if (hit && Date.now() - hit.at < 5 * 60 * 1000) return Promise.resolve(hit.version);
  return new Promise((resolve) => {
    execFile(rt.exe, ['--version'], { timeout: 15000, windowsHide: true }, (err, stdout) => {
      const version = err ? null : parseVersion(stdout);
      if (version) cache.set(rt.exe, { at: Date.now(), version });
      resolve(version);
    });
  });
}

async function registryJson(url) {
  const res = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`реестр npm ответил ${res.status}`);
  return res.json();
}

/**
 * The newest release.
 * @returns {Promise<{ version: string, spec: string }>} the harness's own version and the package to install
 */
export async function latestVersion(id) {
  const pkg = PACKAGES[id];
  if (!pkg) throw new Error('неизвестный харнес');
  const latest = await registryJson(`${REGISTRY}/${pkg.replace('/', '%2f')}/latest`);
  // The Agent SDK is versioned on its own; the Claude Code release it brings is named in `claudeCodeVersion`.
  const version = id === 'claude-code' ? parseVersion(latest.claudeCodeVersion) || latest.version : latest.version;
  return { version, spec: `${pkg}@${latest.version}` };
}

// ---------------------------------------------------------------- install
const jobs = new Map();                        // id -> { running, log, error, version, startedAt }
export function installJob(id) { return jobs.get(id) || null; }

function npmCommand() {
  if (process.platform !== 'win32') return 'npm';
  for (const p of ['C:\\Program Files\\nodejs\\npm.cmd', 'C:\\Program Files (x86)\\nodejs\\npm.cmd']) if (existsSync(p)) return p;
  return 'npm.cmd';
}

/** Install a package into the plugin's runtime folder with npm; `lines` gets npm's output as it comes. */
export function npmInstall(spec, lines, prefix = RUNTIME_DIR) {
  mkdirSync(prefix, { recursive: true });
  const pj = path.join(prefix, 'package.json');
  if (!existsSync(pj)) writeFileSync(pj, JSON.stringify({ name: 'amadeus-harness-runtime', private: true }, null, 2));
  return new Promise((resolve) => {
    if (!/^[@\w./~^-]+$/.test(spec)) { resolve({ ok: false, error: 'недопустимое имя пакета' }); return; }
    const cmd = npmCommand();
    const args = ['install', '--prefix', prefix, '--no-audit', '--no-fund', '--loglevel=error', '--save-exact', spec];
    // a .cmd file needs a shell on Windows: one command line, every part quoted
    const child = process.platform === 'win32'
      ? spawn(`"${cmd}" ${args.map((a) => `"${a}"`).join(' ')}`, { shell: true, windowsHide: true, env: { ...process.env } })
      : spawn(cmd, args, { windowsHide: true, env: { ...process.env } });
    const timer = setTimeout(() => { try { child.kill(); } catch { /* gone */ } }, 15 * 60 * 1000);
    const take = (d) => { for (const l of String(d).split(/\r?\n/)) if (l.trim()) lines.push(l.trim().slice(0, 300)); if (lines.length > 40) lines.splice(0, lines.length - 40); };
    child.stdout.on('data', take); child.stderr.on('data', take);
    child.on('error', (e) => { clearTimeout(timer); resolve({ ok: false, error: `npm не запустился: ${e.message}` }); });
    child.on('close', (code) => { clearTimeout(timer); resolve(code === 0 ? { ok: true } : { ok: false, error: `npm завершился с кодом ${code}: ${lines.slice(-3).join(' | ')}` }); });
  });
}

/** Start installing the newest version of a harness; poll `installJob(id)` for progress. */
export async function startInstall(id) {
  const running = jobs.get(id);
  if (running && running.running) return running;
  const job = { running: true, log: [], error: '', version: '', startedAt: Date.now(), target: '' };
  jobs.set(id, job);
  (async () => {
    try {
      const latest = await latestVersion(id);
      job.target = latest.version;
      job.log.push(`Устанавливаю ${latest.spec}…`);
      const r = await npmInstall(latest.spec, job.log);
      if (!r.ok) { job.error = r.error; return; }
      cache.clear();
      const now = await installedVersion(id);
      if (!now) { job.error = 'Установка завершилась, но программа не запускается. Прежняя версия остаётся в работе.'; return; }
      job.version = now;
    } catch (e) {
      job.error = e && e.message ? e.message : String(e);
    } finally { job.running = false; }
  })();
  return job;
}
