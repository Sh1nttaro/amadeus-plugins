"""Silero v5 Russian voices for the 3D companion: local, CPU only, light (~0.2 s per sentence).

    python tts_silero_server.py <port> <path to v5_ru.pt>

GET  /health      -> {"ok": true, "ready": bool, "voices": [...]}
POST /synthesize  {"text", "voice", "speed"} -> audio/wav (48 kHz mono) or JSON error

Uses the PyTorch of the Edge environment (<runtime>/python/tts); scipy is replaced by scipy_shim.
Runs at below-normal priority with a few threads so it never slows the rest of the desktop.
"""
import io
import json
import os
import re
import sys
import threading
import wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import scipy_shim  # noqa: E402
from ru_normalize import normalize  # noqa: E402

scipy_shim.install()

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 58324
MODEL = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.environ.get('AMADEUS_RUNTIME') or 'W:/amadeus-runtime', 'models', 'silero', 'v5_6_ru.pt')
RATE = 48000
VOICES = ['xenia', 'baya', 'aidar', 'eugene']                       # kseniya left out: sounds bad
state = {'model': None, 'error': None}
lock = threading.Lock()


def below_normal_priority():
    try:
        import ctypes
        k32 = ctypes.windll.kernel32
        k32.GetCurrentProcess.restype = ctypes.c_void_p              # a 64-bit pseudo handle, not an int
        k32.SetPriorityClass.argtypes = [ctypes.c_void_p, ctypes.c_uint32]
        k32.SetPriorityClass(k32.GetCurrentProcess(), 0x4000)        # BELOW_NORMAL_PRIORITY_CLASS
    except Exception:  # noqa: BLE001
        pass


def load():
    try:
        import torch
        torch.set_num_threads(4)
        model = torch.package.PackageImporter(MODEL).load_pickle('tts_models', 'model')
        model.to(torch.device('cpu'))
        model.apply_tts(text='Привет.', speaker='xenia', sample_rate=RATE)    # warm-up
        state['model'] = model
    except Exception as e:  # noqa: BLE001
        state['error'] = str(e)[:300]


def _rate_word(speed):
    return 'x-slow' if speed < 0.8 else 'slow' if speed < 0.95 else 'medium' if speed < 1.08 else 'fast' if speed < 1.3 else 'x-fast'


def _xml(t):
    return t.replace('&', ' и ').replace('<', ' ').replace('>', ' ')


def synthesize(text, voice, speed):
    import numpy as np
    said = normalize(text)
    if not re.search('[а-яё]', said, re.I):
        raise ValueError('Нечего произнести.')
    model = state['model']
    with lock:
        if abs(speed - 1) < 0.05:
            audio = model.apply_tts(text=said, speaker=voice, sample_rate=RATE)
        else:
            ssml = f'<speak><prosody rate="{_rate_word(speed)}">{_xml(said)}</prosody></speak>'
            audio = model.apply_tts(ssml_text=ssml, speaker=voice, sample_rate=RATE)
    a = audio.numpy().astype(np.float32)
    peak = float(np.abs(a).max()) if len(a) else 0
    if peak > 1e-4:
        a *= min(0.84 / peak, 4.0)                                  # same loudness as Kokoro / Edge
    n = min(len(a) // 4, int(RATE * 0.008))                         # no click at the start / end
    if n > 1:
        ramp = np.linspace(0, 1, n, dtype=np.float32)
        a[:n] *= ramp; a[-n:] *= ramp[::-1]
    a = np.concatenate([a, np.zeros(int(RATE * 0.12), dtype=np.float32)])   # a breath between sentences
    out = io.BytesIO()
    with wave.open(out, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
        w.writeframes((np.clip(a, -1, 1) * 32767).astype('<i2').tobytes())
    return out.getvalue()


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
            body = {'ok': True, 'ready': state['model'] is not None, 'error': state['error'], 'voices': VOICES}
            self.send(200, json.dumps(body).encode('utf-8'), 'application/json')
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
            if state['model'] is None:
                return self.err(503, state['error'] or 'Голос Silero ещё загружается.')
            voice = p.get('voice') if p.get('voice') in VOICES else 'xenia'
            speed = max(0.5, min(2.0, float(p.get('speed') or 1)))
            self.send(200, synthesize(text, voice, speed), 'audio/wav')
        except ValueError as e:
            self.err(400, str(e))
        except Exception as e:  # noqa: BLE001
            self.err(500, str(e)[:300])


if __name__ == '__main__':
    below_normal_priority()
    threading.Thread(target=load, daemon=True).start()
    ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()
