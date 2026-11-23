import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { probeModels } from '../lib/probe.js';

function serve(routes) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const route = routes[req.url.split('?')[0]];
      if (!route) { res.writeHead(404); return res.end('{}'); }
      const r = typeof route === 'function' ? route(req) : route;
      res.writeHead(r.status || 200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(r.body));
    });
    server.listen(0, '127.0.0.1', () => resolve({ url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() }));
  });
}

test('plain OpenAI list: ids only, chat vs embedding', async () => {
  const s = await serve({ '/v1/models': { body: { data: [{ id: 'gpt-x' }, { id: 'text-embedding-3-small' }] } } });
  const r = await probeModels({ baseURL: s.url + '/v1', apiKey: 'k' });
  s.close();
  assert.equal(r.ok, true);
  assert.equal(r.via, 'openai');
  const byId = Object.fromEntries(r.models.map((m) => [m.id, m]));
  assert.equal(byId['gpt-x'].kind, 'chat');
  assert.equal(byId['text-embedding-3-small'].kind, 'embedding');
  assert.deepEqual(byId['gpt-x'].input, ['text']);
  assert.equal(r.models[0].id, 'gpt-x', 'chat models come first');
});

test('base URL without /v1 falls back to /v1/models', async () => {
  const s = await serve({ '/v1/models': { body: { data: [{ id: 'm1' }] } } });
  const r = await probeModels({ baseURL: s.url, apiKey: 'k' });
  s.close();
  assert.equal(r.ok, true);
  assert.equal(r.models.length, 1);
});

test('LiteLLM: /model/info adds context, prices and capabilities', async () => {
  const s = await serve({
    '/models': { body: { data: [{ id: 'deepseek-v4-pro' }, { id: 'embed-1' }] } },
    '/model/info': (req) => (req.headers.authorization === 'Bearer sk-test'
      ? { body: { data: [
        { model_name: 'deepseek-v4-pro', model_info: { max_input_tokens: 1000000, max_output_tokens: 128000, input_cost_per_token: 0.00000174, output_cost_per_token: 0.00000348, cache_read_input_token_cost: 1.45e-8, supports_vision: true, supports_function_calling: true, supports_reasoning: true, mode: 'chat' } },
        { model_name: 'embed-1', model_info: { max_input_tokens: 8192, mode: 'embedding' } },
        { model_name: 'only-in-info', model_info: { max_input_tokens: 64000, mode: 'chat', supports_vision: false } },
      ] } }
      : { status: 401, body: {} }),
  });
  const r = await probeModels({ baseURL: s.url, apiKey: 'sk-test' });
  s.close();
  assert.equal(r.ok, true);
  assert.equal(r.via, 'litellm');
  const byId = Object.fromEntries(r.models.map((m) => [m.id, m]));
  const pro = byId['deepseek-v4-pro'];
  assert.equal(pro.contextWindow, 1000000);
  assert.equal(pro.maxTokens, 128000);
  assert.deepEqual(pro.input, ['text', 'image']);
  assert.equal(pro.tools, true);
  assert.equal(pro.reasoning, true);
  assert.equal(pro.cost.input, 1.74);
  assert.equal(pro.cost.output, 3.48);
  assert.equal(pro.cost.cacheRead, 0.0145);
  assert.equal(byId['embed-1'].kind, 'embedding');
  assert.ok(byId['only-in-info'], 'a model only /model/info knows is listed too');
});

test('OpenRouter-style entries carry pricing, context and modalities', async () => {
  const s = await serve({ '/api/v1/models': { body: { data: [
    { id: 'vendor/model-a', name: 'Model A', context_length: 200000, architecture: { input_modalities: ['text', 'image', 'file'] }, pricing: { prompt: '0.000003', completion: '0.000015' }, supported_parameters: ['tools', 'reasoning'], top_provider: { max_completion_tokens: 64000 } },
  ] } } });
  const r = await probeModels({ baseURL: s.url + '/api/v1', apiKey: 'k' });
  s.close();
  const m = r.models[0];
  assert.equal(m.name, 'Model A');
  assert.equal(m.contextWindow, 200000);
  assert.equal(m.maxTokens, 64000);
  assert.deepEqual(m.input, ['text', 'image']);
  assert.equal(m.cost.input, 3);
  assert.equal(m.cost.output, 15);
  assert.equal(m.tools, true);
  assert.equal(m.reasoning, true);
});

test('Anthropic list with limits', async () => {
  const s = await serve({ '/v1/models': (req) => (req.headers['x-api-key'] === 'ak'
    ? { body: { data: [{ id: 'claude-x', display_name: 'Claude X', max_input_tokens: 200000, max_tokens: 64000, capabilities: { image_input: { supported: true }, thinking: { supported: true } } }] } }
    : { status: 401, body: {} }) });
  const r = await probeModels({ baseURL: s.url + '/v1', api: 'anthropic-messages', apiKey: 'ak' });
  s.close();
  assert.equal(r.ok, true);
  assert.equal(r.via, 'anthropic');
  assert.equal(r.models[0].name, 'Claude X');
  assert.equal(r.models[0].contextWindow, 200000);
  assert.equal(r.models[0].reasoning, true);
});

test('Gemini list skips models that cannot generate content', async () => {
  const s = await serve({ '/v1beta/models': { body: { models: [
    { name: 'models/gemini-x', displayName: 'Gemini X', inputTokenLimit: 1048576, outputTokenLimit: 65536, supportedGenerationMethods: ['generateContent'] },
    { name: 'models/embedding-1', supportedGenerationMethods: ['embedContent'] },
  ] } } });
  const r = await probeModels({ baseURL: s.url + '/v1beta', api: 'google-generative-ai', apiKey: 'gk' });
  s.close();
  assert.equal(r.models.length, 1);
  assert.equal(r.models[0].id, 'gemini-x');
  assert.equal(r.models[0].contextWindow, 1048576);
});

test('a wrong key is reported in words', async () => {
  const s = await serve({ '/v1/models': { status: 401, body: { error: 'bad key' } } });
  const r = await probeModels({ baseURL: s.url + '/v1', apiKey: 'nope' });
  s.close();
  assert.equal(r.ok, false);
  assert.match(r.error, /Ключ не подошёл/);
});

test('no base URL', async () => {
  const r = await probeModels({ baseURL: '' });
  assert.equal(r.ok, false);
  assert.match(r.error, /базовый URL/);
});

test('an unreachable host', async () => {
  const r = await probeModels({ baseURL: 'http://127.0.0.1:1/v1' });
  assert.equal(r.ok, false);
  assert.match(r.error, /Нет связи/);
});
