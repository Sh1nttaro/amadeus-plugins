"""Microsoft Edge neural voices for the companions (edge-tts, online).

    python tts_edge_server.py <port>

GET  /health      -> {"ok": true}
POST /synthesize  {"text", "voice", "rate", "pitch"} -> audio/mpeg bytes or JSON error
     rate: percent (-50..50), pitch: Hz (-50..50)
"""
import asyncio
import json
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import edge_tts

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 58323
VOICES = {'ru-RU-SvetlanaNeural', 'ru-RU-DmitryNeural', 'en-US-AvaMultilingualNeural', 'en-US-EmmaMultilingualNeural',
          'fr-FR-VivienneMultilingualNeural', 'pt-BR-ThalitaMultilingualNeural'}


# Seconds: until the first sound / between two pieces of sound / one whole text / all the tries that
# brought no sound. The service is often slower than real time, so a text that is being delivered is
# never cut off just for being long; only silence counts as a failure.
FIRST_S, GAP_S, TOTAL_S, NO_AUDIO_S = 10, 8, 90, 25


class Cut(Exception):
    """The sound stopped in the middle: a retry would cost as much again, so report it."""


async def synth_once(text, voice, rate, pitch, first_s=FIRST_S, end=None):
    out = bytearray()
    end = time.monotonic() + TOTAL_S if end is None else end
    wait_until = min(end, time.monotonic() + first_s)
    stream = edge_tts.Communicate(text, voice, rate=f'{rate:+d}%', pitch=f'{pitch:+d}Hz').stream()
    try:
        while True:
            try:
                chunk = await asyncio.wait_for(stream.__anext__(), max(0.05, wait_until - time.monotonic()))
            except StopAsyncIteration:
                return bytes(out)
            if chunk['type'] == 'audio' and chunk['data']:
                out += chunk['data']
                wait_until = min(end, time.monotonic() + GAP_S)
    except Exception as e:  # noqa: BLE001
        if out:
            raise Cut('Edge прервал звук на середине.') from e
        raise
    finally:
        await stream.aclose()


async def synth(text, voice, rate, pitch):
    """The service now and then answers without audio: try again, then without the pitch shift."""
    last = None
    start = time.monotonic()
    for r, p in ((rate, pitch), (rate, pitch), (rate, 0)):
        left = NO_AUDIO_S - (time.monotonic() - start)
        if left < 1:
            break
        try:
            audio = await synth_once(text, voice, r, p, min(FIRST_S, left), start + TOTAL_S)
            if audio:
                return audio
        except Cut:
            raise
        except Exception as e:  # noqa: BLE001
            last = e
    if last:
        raise last if str(last) else RuntimeError('Edge не ответил вовремя.')
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

    def from_page(self):
        """Requests of web pages carry an Origin (or say where they come from); only the companion talks to us."""
        if self.headers.get('Origin') or self.headers.get('Sec-Fetch-Site') in ('cross-site', 'same-site'):
            self.err(403, 'forbidden')
            return True
        return False

    def do_GET(self):
        if self.from_page():
            return None
        if self.path.startswith('/health'):
            self.send(200, b'{"ok": true}', 'application/json')
        else:
            self.err(404, 'not found')

    def do_POST(self):
        if self.from_page():
            return None
        if not self.path.startswith('/synthesize'):
            return self.err(404, 'not found')
        try:
            n = int(self.headers.get('content-length') or 0)
            p = json.loads(self.rfile.read(n) or b'{}')
            text = str(p.get('text') or '').strip()[:3000]
            if not text:
                return self.err(400, 'Пустой текст.')
            voice = p.get('voice') if p.get('voice') in VOICES else 'en-US-AvaMultilingualNeural'
            rate = max(-50, min(50, int(round(float(p.get('rate') or 0)))))
            pitch = max(-50, min(50, int(round(float(p.get('pitch') or 0)))))
            audio = asyncio.run(synth(text, voice, rate, pitch))
            if not audio:
                return self.err(502, 'Edge не вернул звук.')
            self.send(200, audio, 'audio/mpeg')
        except Exception as e:  # noqa: BLE001
            self.err(502, str(e))


class Server(ThreadingHTTPServer):
    allow_reuse_address = False                                      # Windows would let two servers share the port


if __name__ == '__main__':
    Server(('127.0.0.1', PORT), H).serve_forever()
