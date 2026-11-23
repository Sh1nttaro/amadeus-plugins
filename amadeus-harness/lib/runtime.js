// Where the harness programs are: the plugin's own folder `data/runtime`, where the page's "Install" button puts
// them (npm). Nothing outside the plugin is used, so the plugin works on any computer that has Node and npm.
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const RUNTIME_DIR = path.join(__dirname, '..', 'data', 'runtime');
const RUNTIME_MODULES = path.join(RUNTIME_DIR, 'node_modules');

const TRIPLES = {
  'win32-x64': 'x86_64-pc-windows-msvc', 'win32-arm64': 'aarch64-pc-windows-msvc',
  'linux-x64': 'x86_64-unknown-linux-musl', 'linux-arm64': 'aarch64-unknown-linux-musl',
  'darwin-x64': 'x86_64-apple-darwin', 'darwin-arm64': 'aarch64-apple-darwin',
};
const platformKey = `${process.platform}-${process.arch}`;
const exeName = (n) => (process.platform === 'win32' ? `${n}.exe` : n);

function claudeIn(root) {
  const sdk = path.join(root, '@anthropic-ai', 'claude-agent-sdk', 'sdk.mjs');
  const exe = path.join(root, '@anthropic-ai', `claude-agent-sdk-${platformKey}`, exeName('claude'));
  return existsSync(sdk) && existsSync(exe) ? { ok: true, sdk, exe } : null;
}
function codexIn(root) {
  const triple = TRIPLES[platformKey];
  if (!triple) return null;
  const vendors = [
    path.join(root, '@openai', `codex-${platformKey}`, 'vendor'),
    path.join(root, '@openai', 'codex', 'node_modules', '@openai', `codex-${platformKey}`, 'vendor'),
    path.join(root, '@openai', 'codex', 'vendor'),
  ];
  for (const vendor of vendors) {
    const exe = path.join(vendor, triple, 'bin', exeName('codex'));
    if (existsSync(exe)) {
      const pathDir = path.join(vendor, triple, 'codex-path');
      return { ok: true, exe, pathDir: existsSync(pathDir) ? pathDir : null };
    }
  }
  return null;
}

/** The Agent SDK entry and the Claude Code executable of its platform package. */
export function claudeRuntime() {
  return claudeIn(RUNTIME_MODULES) || { ok: false, reason: 'Claude Code не установлен: откройте «Настройки → Харнесы» и нажмите «Установить».' };
}

/** The Codex executable and the folder of its helper tools. */
export function codexRuntime() {
  if (!TRIPLES[platformKey]) return { ok: false, reason: `Codex не поддерживает платформу ${platformKey}` };
  return codexIn(RUNTIME_MODULES) || { ok: false, reason: 'Codex не установлен: откройте «Настройки → Харнесы» и нажмите «Установить».' };
}

export function runtimeOf(id) { return id === 'codex' ? codexRuntime() : claudeRuntime(); }

/** Claude Code on Windows runs shell commands through Git Bash. */
export function gitBashPath() {
  if (process.platform !== 'win32') return null;
  for (const p of [process.env.CLAUDE_CODE_GIT_BASH_PATH, 'C:\\Program Files\\Git\\bin\\bash.exe', 'C:\\Program Files (x86)\\Git\\bin\\bash.exe']) {
    if (p && existsSync(p)) return p;
  }
  return null;
}
