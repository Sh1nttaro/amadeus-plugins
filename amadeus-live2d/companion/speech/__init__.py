"""Kokoro-ru text-to-speech for the Amadeus companion (self-contained port).

Synthesis runs on the CPU via onnxruntime; the model, its espeak data and the
RUAccent stress frontend live in the runtime folder (models/speech). Recognition is
not included here. The package has no dependency on the reference app's core.
"""
from __future__ import annotations

import io
import os
import threading
import wave
from importlib.util import find_spec
from pathlib import Path


def _models_root() -> Path:
    """kokoro-ru/ and ruaccent/ live in the shared runtime folder (W:/amadeus-runtime/models/speech),
    not in the plugin: AMADEUS_SPEECH_MODELS, else <AMADEUS_RUNTIME or W:/amadeus-runtime>/models/speech."""
    configured = os.environ.get("AMADEUS_SPEECH_MODELS")
    if configured:
        return Path(configured)
    return Path(os.environ.get("AMADEUS_RUNTIME") or "W:/amadeus-runtime") / "models" / "speech"


MODELS_ROOT = _models_root()
# One model run at a time: the model is large and uses every CPU core anyway.
LOCK = threading.Lock()


class SpeechError(RuntimeError):
    """A readable failure for the user."""


def package_available(name: str) -> bool:
    try:
        return find_spec(name) is not None
    except (ImportError, ValueError, AttributeError):
        return False


def unavailable() -> str | None:
    """Why synthesis cannot run (a missing package), or None."""
    for package in ("onnxruntime", "numpy", "ruaccent", "misaki", "phonemizer", "espeakng_loader"):
        if not package_available(package):
            return "Голос не установлен: нужны пакеты speech (onnxruntime, phonemizer, ruaccent, misaki)."
    return None


def quiet_downloads() -> None:
    """The models are local; there is nothing to download."""


def read_wav(data: bytes) -> tuple[object, int]:
    """16-bit PCM WAV -> (mono float32 samples in [-1, 1], sample rate)."""
    import numpy as np

    try:
        with wave.open(io.BytesIO(data), "rb") as file:
            channels, width, rate = file.getnchannels(), file.getsampwidth(), file.getframerate()
            frames = file.readframes(file.getnframes())
    except (wave.Error, EOFError) as error:
        raise SpeechError("Запись не похожа на WAV.") from error
    if width != 2 or channels not in (1, 2):
        raise SpeechError("Нужна запись WAV 16 бит, моно или стерео.")
    samples = np.frombuffer(frames, dtype="<i2").astype(np.float32) / 32768
    if channels == 2:
        samples = samples.reshape(-1, 2).mean(axis=1)
    return samples, rate


def write_wav(samples, rate: int) -> bytes:
    """Mono float32 samples -> 16-bit PCM WAV."""
    import numpy as np

    pcm = (np.clip(samples, -1, 1) * 32767).astype("<i2")
    output = io.BytesIO()
    with wave.open(output, "wb") as file:
        file.setnchannels(1)
        file.setsampwidth(2)
        file.setframerate(rate)
        file.writeframes(pcm.tobytes())
    return output.getvalue()
