"""Text to speech: Kokoro-ru (zaakirio/kokoro-ru), its 8-bit ONNX export on the CPU.

The model is language-blind (phonemes in, 24 kHz audio out); stress, ё and homographs come from
the vendored ru_g2p frontend (RUAccent, espeak-ng). It takes at most 510 phonemes per run, so an
answer is said sentence by sentence, without markdown, code and links.
"""
from __future__ import annotations

import json
import re

from . import LOCK, MODELS_ROOT, SpeechError, unavailable, write_wav

REPO = "zaakirio/kokoro-ru"
REVISION = "d649c57b239b18c4c384378127cbf01dba039bc1"
RATE = 24000
# Voice -> its ONNX model (Sveta and Masha share one checkpoint).
BUILTIN_VOICES = {"sveta": "onnx/model_quantized.onnx", "masha": "onnx/model_quantized.onnx",
                  "dima": "onnx/model_dima_quantized.onnx"}
DEFAULT_VOICE = "sveta"
DEFAULT_MODEL = "onnx/model_quantized.onnx"


def _custom_voices_file():
    return MODELS_ROOT / "kokoro-ru" / "voices" / "custom.json"


def _read_custom_voices() -> dict:
    """User-imported voices: {name: onnx-model} persisted next to the style vectors."""
    custom: dict = {}
    path = _custom_voices_file()
    if path.exists():
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            if isinstance(data, dict):
                for name, model in data.items():
                    if isinstance(name, str) and isinstance(model, str):
                        custom[name] = model
        except Exception:
            pass
    return custom


VOICES = dict(BUILTIN_VOICES)
VOICES.update(_read_custom_voices())


def register_voice(name, model=DEFAULT_MODEL) -> str:
    """Register a user voice whose <name>.bin style vector already sits in voices/.

    Returns the normalized name; the caller must have copied the .bin file first.
    """
    clean = (name or "").strip().lower()
    if not re.match(r"^[a-z0-9_-]{1,40}$", clean):
        raise SpeechError("Недопустимое имя голоса.")
    if clean in BUILTIN_VOICES:
        raise SpeechError("Такое имя голоса уже занято.")
    folder = MODELS_ROOT / "kokoro-ru"
    style_path = folder / "voices" / f"{clean}.bin"
    if not style_path.exists():
        raise SpeechError("Файл стиля голоса не найден.")
    VOICES[clean] = model
    custom = _read_custom_voices()
    custom[clean] = model
    try:
        path = _custom_voices_file()
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(custom, ensure_ascii=False, indent=2), encoding="utf-8")
    except Exception:
        pass
    if _state and "styles" in _state:
        import numpy as np
        _state["styles"][clean] = np.fromfile(style_path, dtype=np.float32).reshape(-1, 256)
    return clean
FILES = ["config.json", "kokoro-config.json", "onnx/model_quantized.onnx", "onnx/model_dima_quantized.onnx",
         "voices/*.bin", "espeak-data/*", "espeak-data/**"]
# Output rates a window may ask for (its device's own rate), resampled from 24 kHz.
RATES = {16000, 22050, 24000, 32000, 44100, 48000}
MAX_PHONEMES = 500
MAX_TEXT = 4000
PAUSE_SECONDS = 0.18
_state: dict = {}


def speakable(text: str) -> str:
    """What of a chat answer is worth saying aloud."""
    text = re.sub(r"```.*?(```|$)", " ", text, flags=re.S)
    text = re.sub(r"`([^`]*)`", r"\1", text)
    text = re.sub(r"!?\[([^\]]*)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"https?://\S+", " ", text)
    text = re.sub(r"^\s{0,3}(#{1,6}|>|[-*+]|\d+[.)])\s+", "", text, flags=re.M)
    text = re.sub(r"[*_~|#]+", " ", text)
    # Emoji and pictographs have no sound.
    text = re.sub(r"[\U0001F000-\U0001FAFF☀-➿️]", " ", text)
    return re.sub(r"\s+", " ", _say_symbols(text)).strip()


# Symbols espeak drops or reads badly, said as words (digits it reads by itself).
_SYMBOLS = [
    (re.compile(r"(\d)\s*%"), r"\1 процентов"), (re.compile(r"%"), " процентов"),
    (re.compile(r"\b(\d{1,2}):(\d{2})\b"), r"\1 \2"),            # 12:30 -> 12 30
    (re.compile(r"(\d)\s*[–—]\s*(\d)"), r"от \1 до \2"),          # 3–5 -> от 3 до 5
    (re.compile(r"№\s*"), "номер "), (re.compile(r"\s&\s"), " и "),
    (re.compile(r"(\d)\s*°C?"), r"\1 градусов"), (re.compile(r"(\d)\s*₽"), r"\1 рублей"),
    (re.compile(r"\$\s*(\d[\d.,]*)"), r"\1 долларов"),
    (re.compile(r"\s(→|->|=>)\s"), ", "), (re.compile(r"\s=\s"), " равно "),
    (re.compile(r"\.\.\.|…"), ". "),                               # an ellipsis is a pause
    (re.compile(r"\s[—–]\s"), ", "),                               # a dash between words: a short pause
]


def _say_symbols(text: str) -> str:
    for pattern, repl in _SYMBOLS:
        text = pattern.sub(repl, text)
    return text


def _polish(chunk, np):
    """Soft 8 ms fade in and out of one model run: no clicks where the phrases meet."""
    n = min(len(chunk) // 4, int(RATE * 0.008))
    if n > 1:
        ramp = np.linspace(0.0, 1.0, n, dtype=np.float32)
        chunk[:n] *= ramp
        chunk[-n:] *= ramp[::-1]
    return chunk


def _loudness(samples, np):
    """Kokoro speaks ~25 dB below full scale: quiet next to Edge, and its noise got turned up with
    the volume. Bring the peak to about -1.5 dBFS (at most x6)."""
    peak = float(np.abs(samples).max()) if len(samples) else 0.0
    if peak < 1e-4:
        return samples
    return samples * min(0.84 / peak, 6.0)


def sentences(text: str) -> list[str]:
    return [part.strip() for part in re.split(r"(?<=[.!?…])\s+|\n+", text) if part.strip()]


def parts(text: str, size: int = 280) -> list[str]:
    """An answer cut for playback: the first sentence alone (the voice starts soon), then groups of
    sentences up to `size` characters, synthesized while the previous one plays."""
    found: list[str] = []
    for sentence in sentences(speakable(text)[:MAX_TEXT]):
        if len(found) > 1 and len(found[-1]) + len(sentence) < size:
            found[-1] += " " + sentence
        else:
            found.append(sentence)
    return found


def _load():
    if not _state:
        import numpy as np
        import onnxruntime

        from .ru_g2p import RuG2P

        folder = MODELS_ROOT / "kokoro-ru"
        accent = MODELS_ROOT / "ruaccent"
        accent.mkdir(parents=True, exist_ok=True)
        if not (folder / "config.json").exists():
            raise SpeechError("Модели голоса не найдены (kokoro-ru).")
        try:
            g2p = RuG2P(espeak_data=folder / "espeak-data", vocab_path=folder / "kokoro-config.json",
                        accent_workdir=accent)
        except Exception as error:
            raise SpeechError(f"Не удалось загрузить модель голоса: {str(error)[:200]}") from error
        styles = {}
        for voice in VOICES:
            style_path = folder / "voices" / f"{voice}.bin"
            if style_path.exists():
                styles[voice] = np.fromfile(style_path, dtype=np.float32).reshape(-1, 256)
        _state.update(
            folder=folder, g2p=g2p, sessions={},
            vocab=json.loads((folder / "config.json").read_text(encoding="utf-8"))["vocab"],
            styles=styles,
            onnxruntime=onnxruntime)
    return _state


def _best_model(folder, path: str) -> str:
    """The full-precision export next to an 8-bit one when it is there (model.onnx for
    model_quantized.onnx): about the same speed on a desktop CPU, cleaner timbre, no int8 hiss."""
    if path.endswith("_quantized.onnx"):
        full = path[: -len("_quantized.onnx")] + ".onnx"
        if (folder / full).exists():
            return full
    return path


def _session(state: dict, voice: str):
    path = _best_model(state["folder"], VOICES[voice])
    if path not in state["sessions"]:
        state["sessions"][path] = state["onnxruntime"].InferenceSession(
            str(state["folder"] / path), providers=["CPUExecutionProvider"])
    return state["sessions"][path]


def _phrases(state: dict, text: str) -> list[list[int]]:
    """Phoneme ids of each piece of text short enough for one model run."""
    found = []
    for sentence in sentences(text):
        pieces = [sentence]
        while pieces:
            piece = pieces.pop(0)
            phonemes, _unknown = state["g2p"](piece)
            ids = [state["vocab"][symbol] for symbol in phonemes if symbol in state["vocab"]]
            if len(ids) <= MAX_PHONEMES:
                if ids:
                    found.append(ids)
                continue
            # Too long: split at a comma, else at the middle word.
            parts = re.split(r"(?<=[,;:—])\s+", piece)
            if len(parts) == 1:
                words = piece.split()
                if len(words) < 2:
                    found.append(ids[:MAX_PHONEMES])
                    continue
                parts = [" ".join(words[:len(words) // 2]), " ".join(words[len(words) // 2:])]
            else:
                middle = len(parts) // 2
                parts = [" ".join(parts[:middle]), " ".join(parts[middle:])]
            pieces[:0] = parts
    return found


def synthesize(text: str, voice: str = DEFAULT_VOICE, speed: float = 1.0, rate: int = RATE) -> bytes:
    """WAV (mono, 24 kHz or the rate asked) of the text said by the voice; SpeechError when there
    is nothing to say."""
    import numpy as np

    if reason := unavailable():
        raise SpeechError(reason)
    if voice not in VOICES:
        raise SpeechError("Такого голоса нет.")
    if rate not in RATES:
        raise SpeechError(f"Частота {rate} Гц не поддерживается.")
    said = speakable(text)[:MAX_TEXT]
    if not said:
        raise SpeechError("В ответе нечего произнести.")
    with LOCK:
        state = _load()
        session = _session(state, voice)
        if voice not in state["styles"]:
            raise SpeechError("У этого голоса нет файла стиля.")
        style = state["styles"][voice]
        pause = np.zeros(int(RATE * PAUSE_SECONDS), dtype=np.float32)
        audio = []
        for ids in _phrases(state, said):
            output = session.run(None, {"input_ids": np.array([[0, *ids, 0]], dtype=np.int64),
                                        "style": style[min(len(ids), len(style)) - 1][None],
                                        "speed": np.array([speed], dtype=np.float32)})[0]
            audio += [_polish(np.array(output, dtype=np.float32).reshape(-1), np), pause]
    if not audio:
        raise SpeechError("В ответе нечего произнести.")
    samples = _loudness(np.concatenate(audio), np)
    if rate != RATE:
        samples = np.interp(np.arange(0, len(samples) * rate // RATE) * (RATE / rate), np.arange(len(samples)), samples)
    return write_wav(samples, rate)
