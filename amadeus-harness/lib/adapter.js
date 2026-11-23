// A turn of a DSH chat carried out by a harness. DSH's agent loop asks for a model call; for a chat that has a
// harness selected, the call is answered here instead: Claude Code or Codex works with its own tools in the
// chat's folder, on the chat's own model (through the connection of the chat's provider), under the chat's
// permission preset, and the answer goes back as the stream of chunks the loop expects.
// The harness's session id is kept per DSH chat, so the next turn resumes it.
import { ChunkWriter, buildPrompt } from './events.js';
import { codexEffort } from './codex.js';

export const HARNESSES = ['claude-code', 'codex'];
export const HARNESS_NAMES = { 'claude-code': 'Claude Code', codex: 'Codex' };

/** DSH permission preset -> what the harness may do. */
export function permissionFor(preset) {
  switch (preset) {
    case 'read-only': return 'read';
    case 'danger-full-access': return 'full';
    default: return 'edits';                                          // workspace-write, auto-review, anything newer
  }
}

/**
 * @param {object} deps
 * @param {(provider: string) => ({ baseURL: string, apiKeyEnv?: string }|undefined)} deps.connection  the chat provider's address and key name
 * @param {(ref: string) => Promise<string>} deps.resolveKey
 * @param {{ get(key: string): string|undefined, set(key: string, id: string): void }} deps.sessions
 * @param {(sessionId: string|undefined) => string} deps.cwdFor      the chat's folder
 * @param {(harness: string) => string} deps.homeFor
 * @param {Record<string, (o: object) => AsyncIterable<object>>} deps.runners
 * @returns {(options: object, selection: { harness: string, permission?: string }) => AsyncGenerator<object>}
 */
export function createHarnessStream(deps) {
  return async function* harnessStream(options, selection) {
    const writer = new ChunkWriter();
    const harness = selection.harness;
    const name = HARNESS_NAMES[harness] || harness;
    const fail = (message) => writer.finish({ kind: 'error', message });
    const runner = deps.runners[harness];
    if (!runner) { yield* fail(`Харнес «${name}» не поддерживается.`); return; }

    const conn = deps.connection(options.provider);
    if (!conn || !conn.baseURL) {
      yield* fail(`Харнес «${name}» работает через подключение провайдера чата, а у «${options.provider}» адреса нет. Выберите в чате модель из своего подключения (страница «Провайдеры») или верните исполнителя «DSH».`);
      return;
    }
    const apiKey = conn.apiKeyEnv ? await deps.resolveKey(conn.apiKeyEnv) : '';
    if (conn.apiKeyEnv && !apiKey) { yield* fail(`Ключ ${conn.apiKeyEnv} не найден в хранилище DSH.`); return; }

    const key = `${options.sessionId}|${harness}`;
    const keep = !!options.sessionId;                                  // only a real chat has a session to come back to
    const resume = keep ? deps.sessions.get(key) : undefined;
    const prompt = buildPrompt(options.messages, { resuming: !!resume });
    if (!prompt) { yield* fail('Пустое сообщение: харнесу нечего выполнять.'); return; }

    const events = runner({
      prompt, model: options.model, baseURL: conn.baseURL, apiKey, permission: selection.permission || 'edits',
      cwd: deps.cwdFor(options.sessionId), home: deps.homeFor(harness), resume, noTools: !!options.noTools, signal: options.signal,
      effort: harness === 'codex' ? codexEffort(options.reasoningEffort) : undefined,
      reasoningEffort: harness === 'claude-code' ? options.reasoningEffort : undefined,
    });
    let failure = null;
    try {
      for await (const ev of events) {
        if (ev.t === 'session' && keep) deps.sessions.set(key, ev.id);
        if (ev.t === 'error') { failure = ev.message; continue; }
        yield* writer.event(ev);
      }
    } catch (e) {
      failure = e && e.message ? e.message : String(e);
    }
    if (options.signal && options.signal.aborted) { yield* writer.finish({ kind: 'aborted', message: 'Остановлено пользователем.' }); return; }
    if (failure) {
      // a resumed session that no longer exists would fail every turn: forget it, the next turn starts afresh
      if (resume && keep && /session|resume|conversation|thread/i.test(failure)) deps.sessions.set(key, '');
      yield* writer.finish({ kind: 'error', message: failure });
      return;
    }
    yield* writer.finish({ kind: 'stop' });
  };
}
