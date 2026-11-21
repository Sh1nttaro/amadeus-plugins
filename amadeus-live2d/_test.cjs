const { spawn } = require('child_process');
const electron = 'W:\\amadeus-v2\\electron\\electron.exe';
const dir = 'W:\\plugins-dsh\\amadeus-live2d\\companion';

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;
const child = spawn(electron, [dir], { env, stdio: ['ignore', 'pipe', 'pipe'] });
let port = 0;
let buf = '';
child.stdout.on('data', (c) => {
  buf += c.toString();
  const m = buf.match(/\{"type":"ready","port":(\d+)\}/);
  if (m && !port) { port = Number(m[1]); run(); }
});
child.stderr.on('data', (c) => process.stderr.write(c));

async function post(path, body) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return res.json();
}

async function run() {
  try {
    console.log('READY port=' + port);
    console.log('wait_ready:', JSON.stringify(await post('/wait_ready', { timeoutMs: 20000 })));
    console.log('list_models:', JSON.stringify(await post('/list_models')));
    console.log('load_model:', JSON.stringify(await post('/load_model', { id: 'march_7th' })));
    const actions = await post('/list_actions');
    console.log('list_actions:', JSON.stringify(actions.result && actions.result.motions ? { motions: actions.result.motions.length, expressions: actions.result.expressions.length } : actions));
    const grp = (actions.result && actions.result.motions && actions.result.motions[0]);
    const exp = (actions.result && actions.result.expressions && actions.result.expressions[0]);
    if (grp && grp.items && grp.items.length) {
      console.log('play_motion:', JSON.stringify(await post('/command', { name: 'play_motion', args: { group: grp.key, index: 0 } })));
    }
    if (exp) {
      console.log('set_expression:', JSON.stringify(await post('/command', { name: 'set_expression', args: { name: exp.key } })));
    }
    console.log('return_to_idle:', JSON.stringify(await post('/command', { name: 'return_to_idle', args: {} })));
    console.log('speak:', JSON.stringify(await post('/speak', { text: 'Привет! Я Live2D-компаньон.' })));
  } catch (e) {
    console.error('TEST ERROR:', e && e.message ? e.message : e);
  } finally {
    setTimeout(async () => { try { await post('/shutdown'); } catch {} setTimeout(() => process.exit(0), 500); }, 1500);
  }
}

setTimeout(() => { console.error('TIMEOUT: no ready'); process.exit(1); }, 40000);
