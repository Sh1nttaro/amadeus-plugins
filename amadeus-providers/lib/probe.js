// Asks a model provider what it serves and normalizes the answer: context window, output cap,
// input types, capabilities and price per 1M tokens. Understands the plain OpenAI `GET /models`,
// LiteLLM (`/model/info` carries limits, prices and capability flags), OpenRouter-style enriched
// entries, Anthropic's `GET /v1/models` and Gemini's `GET /models`.
//
// A normalized model:
//   { id, name, kind: 'chat'|'embedding'|'image'|'audio'|'other',
//     contextWindow?, maxTokens?, input: ['text'|'image'...],
//     tools?, reasoning?, cache?, cost?: { input?, output?, cacheRead? } }   // USD per 1M tokens

const TIMEOUT_MS = 20000;
const NON_CHAT = /(^|[-_/])(embed|embedding|whisper|tts|dall-e|moderation|rerank|stable-diffusion|sdxl|flux|image|imagen|veo|sora)([-_/]|$)|text-embedding|omni-moderation/i;

const num = (v) => {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : undefined;
};
const perMillion = (perToken) => {
  const n = num(perToken);
  return n === undefined ? undefined : Math.round(n * 1e6 * 1e6) / 1e6;     // keep sub-cent precision
};

function kindOf(id, mode) {
  if (mode) {
    if (mode === 'chat' || mode === 'completion' || mode === 'responses') return 'chat';
    if (mode === 'embedding') return 'embedding';
    if (/image/.test(mode)) return 'image';
    if (/audio|speech|transcription/.test(mode)) return 'audio';
    return 'other';
  }
  if (!NON_CHAT.test(id)) return 'chat';
  return /embed/i.test(id) ? 'embedding' : /image|dall-e|flux|sdxl|stable-diffusion|imagen|veo|sora/i.test(id) ? 'image' : /whisper|tts/i.test(id) ? 'audio' : 'other';
}

function cleanCost(c) {
  if (!c) return undefined;
  const out = {};
  if (c.input !== undefined) out.input = c.input;
  if (c.output !== undefined) out.output = c.output;
  if (c.cacheRead !== undefined) out.cacheRead = c.cacheRead;
  return Object.keys(out).length ? out : undefined;
}

/** Drop undefined fields so a merge never overwrites known facts with gaps. */
function compact(model) {
  const out = {};
  for (const [k, v] of Object.entries(model)) if (v !== undefined) out[k] = v;
  return out;
}

async function getJson(url, headers) {
  const res = await fetch(url, { headers: { accept: 'application/json', ...headers }, signal: AbortSignal.timeout(TIMEOUT_MS), redirect: 'follow' });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* not JSON */ }
  return { status: res.status, ok: res.ok, json, text };
}

function httpError(status, where) {
  if (status === 401 || status === 403) return `Ключ не подошёл (HTTP ${status}).`;
  if (status === 404) return `Адрес не найден (404): ${where}. Проверьте базовый URL и протокол.`;
  if (status === 429) return 'Провайдер ограничил запросы (429), попробуйте позже.';
  return `Провайдер ответил ошибкой HTTP ${status}.`;
}

const trimSlash = (s) => String(s || '').trim().replace(/\/+$/, '');
const stripV1 = (s) => s.replace(/\/v1$/i, '');

// ---------------------------------------------------------------- entry parsers
/** An entry of an OpenAI-style list, including the extras OpenRouter / vLLM / LM Studio add. */
function fromOpenAiEntry(e) {
  const id = String(e.id ?? e.name ?? '');
  const mods = e.architecture?.input_modalities ?? e.input_modalities ?? e.modalities?.input ?? (Array.isArray(e.modalities) ? e.modalities : undefined);
  const params = Array.isArray(e.supported_parameters) ? e.supported_parameters : undefined;
  return compact({
    id,
    name: typeof e.name === 'string' && e.name !== id ? e.name : (typeof e.display_name === 'string' ? e.display_name : undefined),
    kind: kindOf(id),
    contextWindow: num(e.context_length ?? e.context_window ?? e.max_context_length ?? e.max_model_len ?? e.max_input_tokens ?? e.top_provider?.context_length),
    maxTokens: num(e.top_provider?.max_completion_tokens ?? e.max_output_tokens ?? e.max_completion_tokens),
    input: Array.isArray(mods) ? mods.filter((m) => m === 'text' || m === 'image').filter((m, i, a) => a.indexOf(m) === i) : undefined,
    tools: params ? params.includes('tools') : undefined,
    reasoning: params ? params.includes('reasoning') || params.includes('include_reasoning') : undefined,
    cost: cleanCost({ input: perMillion(e.pricing?.prompt), output: perMillion(e.pricing?.completion), cacheRead: perMillion(e.pricing?.input_cache_read) }),
  });
}

function fromAnthropicEntry(e) {
  const caps = e.capabilities || {};
  return compact({
    id: String(e.id),
    name: typeof e.display_name === 'string' ? e.display_name : undefined,
    kind: 'chat',
    contextWindow: num(e.max_input_tokens),
    maxTokens: num(e.max_tokens),
    input: caps.image_input?.supported === false ? ['text'] : ['text', 'image'],
    reasoning: caps.thinking ? !!caps.thinking.supported : undefined,
  });
}

function fromGeminiEntry(e) {
  const id = String(e.name || '').replace(/^models\//, '');
  const methods = Array.isArray(e.supportedGenerationMethods) ? e.supportedGenerationMethods : null;
  if (methods && !methods.includes('generateContent')) return null;
  return compact({
    id,
    name: typeof e.displayName === 'string' ? e.displayName : undefined,
    kind: kindOf(id),
    contextWindow: num(e.inputTokenLimit),
    maxTokens: num(e.outputTokenLimit),
    input: ['text', 'image'],
    reasoning: typeof e.thinking === 'boolean' ? e.thinking : undefined,
  });
}

/** LiteLLM `/model/info`: one entry per deployment, facts under `model_info`. */
function fromLiteLlmEntry(e) {
  const info = e.model_info || {};
  const id = String(e.model_name ?? info.id ?? '');
  const input = ['text'];
  if (info.supports_vision) input.push('image');
  return compact({
    id,
    kind: kindOf(id, info.mode),
    contextWindow: num(info.max_input_tokens ?? info.max_tokens),
    maxTokens: num(info.max_output_tokens),
    input: (info.supports_vision !== undefined || info.mode) ? input : undefined,
    tools: typeof info.supports_function_calling === 'boolean' ? info.supports_function_calling : undefined,
    reasoning: typeof info.supports_reasoning === 'boolean' ? info.supports_reasoning : undefined,
    cache: typeof info.supports_prompt_caching === 'boolean' ? info.supports_prompt_caching : undefined,
    cost: cleanCost({ input: perMillion(info.input_cost_per_token), output: perMillion(info.output_cost_per_token), cacheRead: perMillion(info.cache_read_input_token_cost) }),
  });
}

/** Facts from `b` fill the gaps of `a`; `a` wins where both know. */
function mergeModel(a, b) {
  const out = { ...b, ...a };
  for (const [k, v] of Object.entries(a)) if (v === undefined) out[k] = b[k];
  if (a.cost || b.cost) out.cost = { ...(b.cost || {}), ...(a.cost || {}) };
  if (a.input && b.input) out.input = [...new Set([...a.input, ...b.input])];
  return compact(out);
}

function mergeLists(primary, extra) {
  const byId = new Map(primary.map((m) => [m.id, m]));
  for (const m of extra) {
    if (!m.id) continue;
    byId.set(m.id, byId.has(m.id) ? mergeModel(byId.get(m.id), m) : m);
  }
  return [...byId.values()];
}

// ---------------------------------------------------------------- protocols
async function probeOpenAi(base, key, headers) {
  const auth = key ? { authorization: `Bearer ${key}` } : {};
  const urls = [`${base}/models`];
  if (!/\/v1$/i.test(base)) urls.push(`${base}/v1/models`);
  let last = null;
  for (const url of urls) {
    let r;
    try { r = await getJson(url, { ...auth, ...headers }); }
    catch (e) { return { error: `Нет связи с ${url}: ${e && e.message ? e.message : e}` }; }
    if (r.ok && r.json) {
      const list = Array.isArray(r.json.data) ? r.json.data : Array.isArray(r.json.models) ? r.json.models : Array.isArray(r.json) ? r.json : null;
      if (list) return { models: list.map(fromOpenAiEntry).filter((m) => m.id), via: 'openai' };
    }
    last = r;
    if (r.status === 401 || r.status === 403) break;
  }
  return { error: last ? httpError(last.status, urls[urls.length - 1]) : 'Пустой ответ провайдера.', status: last && last.status };
}

async function probeLiteLlm(root, key, headers) {
  const auth = key ? { authorization: `Bearer ${key}` } : {};
  for (const url of [`${root}/model/info`, `${root}/v1/model/info`]) {
    try {
      const r = await getJson(url, { ...auth, ...headers });
      if (r.ok && r.json && Array.isArray(r.json.data) && r.json.data.some((e) => e && e.model_info)) {
        return r.json.data.filter((e) => e && e.model_name).map(fromLiteLlmEntry);
      }
    } catch { /* not LiteLLM */ }
  }
  return null;
}

async function probeAnthropic(base, key, headers) {
  const root = stripV1(base);
  const url = `${root}/v1/models?limit=1000`;
  let r;
  try { r = await getJson(url, { 'x-api-key': key || '', 'anthropic-version': '2023-06-01', ...headers }); }
  catch (e) { return { error: `Нет связи с ${url}: ${e && e.message ? e.message : e}` }; }
  if (r.ok && r.json && Array.isArray(r.json.data)) return { models: r.json.data.map(fromAnthropicEntry), via: 'anthropic' };
  return { error: httpError(r.status, url), status: r.status };
}

async function probeGemini(base, key, headers) {
  const url = `${base}/models?pageSize=1000`;
  let r;
  try { r = await getJson(url, { 'x-goog-api-key': key || '', ...headers }); }
  catch (e) { return { error: `Нет связи с ${url}: ${e && e.message ? e.message : e}` }; }
  if (r.ok && r.json && Array.isArray(r.json.models)) return { models: r.json.models.map(fromGeminiEntry).filter(Boolean), via: 'gemini' };
  return { error: httpError(r.status, url), status: r.status };
}

/**
 * Ask a provider which models it serves.
 * @param {{ baseURL: string, api?: string, apiKey?: string, headers?: Record<string,string> }} request
 * @returns {Promise<{ ok: boolean, via?: string, models?: object[], error?: string }>}
 */
export async function probeModels(request) {
  const base = trimSlash(request && request.baseURL);
  if (!/^https?:\/\//i.test(base)) return { ok: false, error: 'Укажите базовый URL, например https://api.example.com/v1.' };
  const api = (request && request.api) || 'openai-completions';
  const key = request && request.apiKey ? String(request.apiKey) : '';
  const headers = (request && request.headers) || {};
  let res;
  if (api === 'anthropic-messages') res = await probeAnthropic(base, key, headers);
  else if (api === 'google-generative-ai') res = await probeGemini(base, key, headers);
  else {
    res = await probeOpenAi(base, key, headers);
    // A LiteLLM proxy adds limits, prices and capability flags, and may list more than /models does.
    const lite = await probeLiteLlm(stripV1(base), key, headers);
    if (lite && lite.length) {
      if (res.error) res = { models: lite, via: 'litellm' };
      else res = { models: mergeLists(lite, res.models), via: 'litellm' };
    }
  }
  if (res.error) return { ok: false, error: res.error, status: res.status };
  const models = res.models.map((m) => ({ ...m, name: m.name || m.id, input: m.input && m.input.length ? m.input : ['text'] }));
  models.sort((a, b) => (a.kind === 'chat' ? 0 : 1) - (b.kind === 'chat' ? 0 : 1) || a.id.localeCompare(b.id));
  return { ok: true, via: res.via, models };
}

export const _test = { fromOpenAiEntry, fromLiteLlmEntry, fromAnthropicEntry, fromGeminiEntry, mergeLists, perMillion, kindOf };
