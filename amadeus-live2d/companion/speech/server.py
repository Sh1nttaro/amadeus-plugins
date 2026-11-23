"""Tiny localhost HTTP server for Kokoro-ru synthesis, run by the desktop shell.

One long-lived process keeps the model in memory: the first synthesis loads it
(up to a minute), later ones are fast. The shell talks JSON over 127.0.0.1 only.

Endpoints:
  GET  /health     -> {"ok": true}
  GET  /voices     -> {"voices": [...], "default": "...", "unavailable": null|str}
  POST /synthesize -> body {"text", "voice", "speed"} -> audio/wav bytes or JSON error
"""
from __future__ import annotations

import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from . import SpeechError, unavailable
from . import synthesis

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 58321


class Handler(BaseHTTPRequestHandler):
    server_version = "amadeus-tts/1"

    def log_message(self, *args):
        pass

    def _send(self, status: int, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _json(self, status: int, obj) -> None:
        self._send(status, json.dumps(obj, ensure_ascii=False).encode("utf-8"), "application/json; charset=utf-8")

    def _from_page(self) -> bool:
        """Requests of web pages carry an Origin (or say where they come from); only the companion talks to us."""
        if self.headers.get("Origin") or self.headers.get("Sec-Fetch-Site") in ("cross-site", "same-site"):
            self._json(403, {"error": "forbidden"})
            return True
        return False

    def do_GET(self) -> None:
        if self._from_page():
            return
        if self.path == "/health":
            self._json(200, {"ok": True})
            return
        if self.path == "/voices":
            self._json(200, {
                "voices": list(synthesis.VOICES),
                "default": synthesis.DEFAULT_VOICE,
                "unavailable": unavailable(),
            })
            return
        self._json(404, {"error": "not found"})

    def do_POST(self) -> None:
        if self._from_page():
            return
        if self.path == "/voices":
            # Register a user voice: body {"name", "model"}. The .bin must already be copied.
            try:
                length = int(self.headers.get("Content-Length", "0") or 0)
                payload = json.loads((self.rfile.read(length) or b"{}").decode("utf-8") or "{}")
                name = str(payload.get("name") or "")
                model = str(payload.get("model") or synthesis.DEFAULT_MODEL)
                synthesis.register_voice(name, model)
                self._json(200, {"ok": True, "voices": list(synthesis.VOICES), "default": synthesis.DEFAULT_VOICE})
            except SpeechError as error:
                self._json(400, {"error": str(error)})
            except Exception as error:
                self._json(500, {"error": str(error)[:300]})
            return
        if self.path != "/synthesize":
            self._json(404, {"error": "not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0") or 0)
            payload = json.loads((self.rfile.read(length) or b"{}").decode("utf-8") or "{}")
            text = str(payload.get("text") or "")
            voice = str(payload.get("voice") or synthesis.DEFAULT_VOICE)
            speed = float(payload.get("speed") or 1.0)
            wav = synthesis.synthesize(text, voice=voice, speed=speed)
            self._send(200, wav, "audio/wav")
        except SpeechError as error:
            self._json(400, {"error": str(error)})
        except Exception as error:
            self._json(500, {"error": str(error)[:300]})


def main() -> None:
    print(f"[tts] kokoro server on 127.0.0.1:{PORT}", flush=True)
    reason = unavailable()
    if reason:
        print(f"[tts] unavailable: {reason}", flush=True)
    ThreadingHTTPServer.allow_reuse_address = False              # Windows would let two servers share the port
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
