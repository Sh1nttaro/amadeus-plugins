"""Microsoft Edge neural voices for the 3D companion (edge-tts, online).

    python tts_edge_server.py <port>

GET  /health      -> {"ok": true}
POST /synthesize  {"text", "voice", "rate", "pitch"} -> audio/mpeg bytes or JSON error
     rate: percent (-50..50), pitch: Hz (-50..50)
"""
import asyncio
import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import edge_tts

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 58323
VOICES = {'ru-RU-SvetlanaNeural', 'ru-RU-DmitryNeural', 'en-US-AvaMultilingualNeural', 'en-US-EmmaMultilingualNeural',
          'fr-FR-VivienneMultilingualNeural', 'pt-BR-ThalitaMultilingualNeural'}


async def synth_once(text, voice, rate, pitch):
    out = bytearray()
    com = edge_tts.Communicate(text, voice, rate=f'{rate:+d}%', pitch=f'{pitch:+d}Hz')
    async for chunk in com.stream():
        if chunk['type'] == 'audio':
            out += chunk['data']
    return bytes(out)


async def synth(text, voice, rate, pitch):
    """The service now and then answers without audio, mostly when the pitch is shifted: try once
    more as asked, then without the pitch shift, then without the rate change too."""
    last = None
    plans = [(rate, pitch), (rate, pitch), (rate, 0), (0, 0)]
    seen = set()
    for attempt, (r, p) in enumerate(plans):
        if (r, p) in seen and attempt > 1:
            continue
        seen.add((r, p))
        try:
            audio = await synth_once(text, voice, r, p)
            if audio:
                return audio
        except Exception as e:  # noqa: BLE001
            last = e
        await asyncio.sleep(0.15 * (attempt + 1))
    if last:
        raise last
    return b''


class H(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def send(self, code, body, ctype):
        self.send_response(code)
        self.send_header('content-type', ctype)
        self.send_header('content-length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def err(self, code, msg):
        self.send(code, json.dumps({'ok': False, 'error': msg}, ensure_ascii=False).encode('utf-8'), 'application/json; charset=utf-8')

    def do_GET(self):
        if self.path.startswith('/health'):
            self.send(200, b'{"ok": true}', 'application/json')
        else:
            self.err(404, 'not found')

    def do_POST(self):
        if not self.path.startswith('/synthesize'):
            return self.err(404, 'not found')
        try:
            n = int(self.headers.get('content-length') or 0)
            p = json.loads(self.rfile.read(n) or b'{}')
            text = str(p.get('text') or '').strip()[:3000]
            if not text:
                return self.err(400, 'Пустой текст.')
            voice = p.get('voice') if p.get('voice') in VOICES else 'ru-RU-SvetlanaNeural'
            rate = max(-50, min(50, int(round(float(p.get('rate') or 0)))))
            pitch = max(-50, min(50, int(round(float(p.get('pitch') or 0)))))
            audio = asyncio.run(synth(text, voice, rate, pitch))
            if not audio:
                return self.err(502, 'Edge не вернул звук.')
            self.send(200, audio, 'audio/mpeg')
        except Exception as e:  # noqa: BLE001
            self.err(502, str(e))


if __name__ == '__main__':
    ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()
