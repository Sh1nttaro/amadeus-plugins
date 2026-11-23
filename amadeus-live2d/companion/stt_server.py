"""Local speech-to-text for the companions (faster-whisper, CPU int8).

    python stt_server.py <port> <models_dir>

GET  /health      -> {"ok": true, "ready": bool}
POST /transcribe  (body: WAV, or any recording PyAV can read: webm, ogg, mp4) -> {"ok": true, "text": "..."}

The model loads in the background on start, so the first phrase does not wait for it.
"""
import io
import json
import os
import sys
import threading
import wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import numpy as np

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 58322
MODELS = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models')
MODEL_NAME = os.environ.get('AMADEUS_STT_MODEL', 'small')
WAKE_HINT = os.environ.get('AMADEUS_STT_HINT', 'Разговор с Алисой.')

state = {'model': None, 'error': None}
lock = threading.Lock()


def load():
    try:
        from faster_whisper import WhisperModel
        state['model'] = WhisperModel(MODEL_NAME, device='cpu', compute_type='int8', download_root=MODELS)
    except Exception as e:  # noqa: BLE001
        state['error'] = str(e)


def decode(data):
    """16 kHz mono float samples of a recording."""
    if data[:4] != b'RIFF':
        import av                                                    # not decode_audio(): it does not fit every PyAV
        out = []
        with av.open(io.BytesIO(data)) as box:
            to16k = av.AudioResampler(format='s16', layout='mono', rate=16000)
            for frame in box.decode(audio=0):
                out += [f.to_ndarray().reshape(-1) for f in to16k.resample(frame)]
            out += [f.to_ndarray().reshape(-1) for f in to16k.resample(None)]
        if not out:
            raise ValueError('В записи нет звука.')
        return np.concatenate(out).astype(np.float32) / 32768.0
    with wave.open(io.BytesIO(data)) as w:
        rate, n, ch = w.getframerate(), w.getnframes(), w.getnchannels()
        pcm = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768.0
    if ch > 1:
        pcm = pcm.reshape(-1, ch).mean(axis=1)
    if rate != 16000:
        idx = np.linspace(0, len(pcm) - 1, int(len(pcm) * 16000 / rate))
        pcm = np.interp(idx, np.arange(len(pcm)), pcm).astype(np.float32)
    return pcm


def transcribe(data, hint):
    pcm = decode(data)
    with lock:
        segs, _ = state['model'].transcribe(pcm, language='ru', beam_size=1, vad_filter=True,
                                            initial_prompt=hint or None, condition_on_previous_text=False)
        return ' '.join(s.text.strip() for s in segs).strip()


class H(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def send(self, code, obj):
        b = json.dumps(obj, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('content-type', 'application/json; charset=utf-8')
        self.send_header('content-length', str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def from_page(self):
        """Requests of web pages carry an Origin (or say where they come from); only the companion talks to us."""
        if self.headers.get('Origin') or self.headers.get('Sec-Fetch-Site') in ('cross-site', 'same-site'):
            self.send(403, {'ok': False})
            return True
        return False

    def do_GET(self):
        if self.from_page():
            return None
        if self.path.startswith('/health'):
            self.send(200, {'ok': True, 'ready': state['model'] is not None, 'error': state['error'], 'model': MODEL_NAME})
        else:
            self.send(404, {'ok': False})

    def do_POST(self):
        if self.from_page():
            return None
        if not self.path.startswith('/transcribe'):
            return self.send(404, {'ok': False})
        n = int(self.headers.get('content-length') or 0)
        body = self.rfile.read(n) if n else b''
        if state['model'] is None:
            return self.send(503, {'ok': False, 'error': state['error'] or 'Модель распознавания ещё загружается.'})
        try:
            hint = self.headers.get('x-hint')
            hint = bytes.fromhex(hint).decode('utf-8') if hint else WAKE_HINT
            self.send(200, {'ok': True, 'text': transcribe(body, hint)})
        except Exception as e:  # noqa: BLE001
            self.send(500, {'ok': False, 'error': str(e)})


if __name__ == '__main__':
    threading.Thread(target=load, daemon=True).start()
    ThreadingHTTPServer.allow_reuse_address = False              # Windows would let two servers share the port
    ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()
