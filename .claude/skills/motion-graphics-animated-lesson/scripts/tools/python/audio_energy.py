#!/usr/bin/env python3
"""Loudness + vocal-band presence per window of a mono 16-bit wav.

usage: audio_energy.py file.wav [window_seconds]
prints JSON: {duration, rate, windows: [{t, rms_db, vocal_ratio}], silence_tail_s}
vocal_ratio = energy share in 300-3400 Hz (rough proxy for sung vocals).
"""
import json
import sys
import wave

import numpy as np


def main():
    path = sys.argv[1]
    win_s = float(sys.argv[2]) if len(sys.argv) > 2 else 0.5
    with wave.open(path, "rb") as w:
        rate = w.getframerate()
        if w.getsampwidth() != 2:
            raise ValueError("audio_energy requires 16-bit PCM WAV")
        data = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32).reshape(-1, w.getnchannels()).mean(axis=1) / 32768.0
    n = int(rate * win_s)
    freqs = np.fft.rfftfreq(n, 1.0 / rate)
    band = (freqs >= 300) & (freqs <= 3400)
    windows = []
    for i in range(0, max(len(data) - n + 1, 1), n):
        chunk = data[i:i + n]
        if len(chunk) < n:
            chunk = np.pad(chunk, (0, n - len(chunk)))
        rms = float(np.sqrt(np.mean(chunk ** 2)) + 1e-9)
        spec = np.abs(np.fft.rfft(chunk * np.hanning(n))) ** 2
        ratio = float(spec[band].sum() / (spec.sum() + 1e-12))
        windows.append({"t": round(i / rate, 2), "rms_db": round(20 * np.log10(rms), 1), "vocal_ratio": round(ratio, 3)})
    tail = 0.0
    for wdw in reversed(windows):
        if wdw["rms_db"] < -45:
            tail += win_s
        else:
            break
    print(json.dumps({"duration": round(len(data) / rate, 3), "rate": rate, "windows": windows, "silence_tail_s": tail}))


if __name__ == "__main__":
    main()
