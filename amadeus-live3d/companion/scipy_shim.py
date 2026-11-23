"""A tiny stand-in for scipy.signal.firwin, the one scipy function the Silero v5 package uses.

Silero builds its QMF filter with `sig.firwin(taps + 1, cutoff, window=('kaiser', beta))` once at
load time. Pulling the whole scipy (~37 MB) for that is not worth it: this is the same math as
scipy's firwin for a low-pass filter (windowed sinc, Kaiser window, unit gain at DC).
"""
import sys
import types

import numpy as np


def firwin(numtaps, cutoff, window=('kaiser', 8.6), pass_zero=True, scale=True, fs=None, **_):
    if fs is not None:
        cutoff = cutoff / (0.5 * fs)
    if not pass_zero or np.ndim(cutoff) != 0:
        raise NotImplementedError('scipy_shim.firwin: low-pass only')
    if isinstance(window, tuple) and window[0] == 'kaiser':
        win = np.kaiser(numtaps, window[1])
    elif window in ('hamming', ('hamming',)):
        win = np.hamming(numtaps)
    else:
        raise NotImplementedError(f'scipy_shim.firwin: window {window!r}')
    m = np.arange(numtaps) - 0.5 * (numtaps - 1)
    h = cutoff * np.sinc(cutoff * m) * win
    if scale:
        h /= h.sum()
    return h


def install():
    """Register the shim as scipy / scipy.signal when the real scipy is not installed."""
    try:
        import scipy.signal  # noqa: F401
        return False
    except ImportError:
        pass
    scipy = types.ModuleType('scipy')
    signal = types.ModuleType('scipy.signal')
    signal.firwin = firwin
    scipy.signal = signal
    sys.modules['scipy'] = scipy
    sys.modules['scipy.signal'] = signal
    return True
