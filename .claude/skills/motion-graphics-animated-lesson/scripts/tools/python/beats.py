#!/usr/bin/env python3
"""Beat grid + onsets of a song (numpy only), for placing VFX on the music.

usage: beats.py song.wav [fps]
prints JSON: {duration, fps, bpm, period, phase, beats: [{t, f, n, bar_pos, strength, low}],
              onsets: [{t, f, strength, low}], loudness: [{t, db}] (per 0.25s)}
strength/low = spectral flux (full band / < 150 Hz kick band) at the beat, normalised to the song's 95th percentile.
bar_pos = beat index within a 4/4 bar (0 = downbeat, picked as the phase with the most low-band energy).
"""
import json
import sys
import wave

import numpy as np

HOP = 256
N_FFT = 2048


def read_mono(path):
    with wave.open(path, "rb") as w:
        rate, ch, width = w.getframerate(), w.getnchannels(), w.getsampwidth()
        raw = w.readframes(w.getnframes())
    if width != 2:
        raise SystemExit("need 16-bit wav")
    data = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    return data.reshape(-1, ch).mean(axis=1), rate


def flux(mag, lo, hi):
    band = np.log1p(100 * mag[lo:hi])
    d = np.diff(band, axis=1, prepend=band[:, :1])
    return np.maximum(d, 0).sum(axis=0)


def norm(x):
    x = x - np.median(x)
    return np.clip(x / (np.percentile(x, 95) + 1e-9), 0, None)


def main():
    path = sys.argv[1]
    fps = float(sys.argv[2]) if len(sys.argv) > 2 else 24.0
    y, rate = read_mono(path)
    win = np.hanning(N_FFT).astype(np.float32)
    n = 1 + (len(y) - N_FFT) // HOP
    frames = np.lib.stride_tricks.as_strided(y, shape=(n, N_FFT), strides=(y.strides[0] * HOP, y.strides[0]))
    mag = np.abs(np.fft.rfft(frames * win, axis=1)).T
    freqs = np.fft.rfftfreq(N_FFT, 1.0 / rate)
    t = (np.arange(n) * HOP + N_FFT / 2) / rate

    full = norm(flux(mag, 1, len(freqs)))
    low = norm(flux(mag, 1, int(np.searchsorted(freqs, 150))))
    env = full + low

    # Tempo + phase: the comb (period, offset) over the whole song that lands on the most onset energy, 80–180 BPM,
    # coarse then fine. (Autocorrelation was ~0.4% off, a beat and a half of drift over a 140s song.)
    frame_rate = rate / HOP

    def comb(period, ph):
        idx = np.round((np.arange(ph, t[-1], period) - t[0]) * frame_rate).astype(int)
        idx = idx[(idx >= 0) & (idx < len(env))]
        return env[idx].mean()

    def best(bpms, n_phase):
        cands = []
        for bpm in bpms:
            p = 60 / bpm
            phs = np.linspace(0, p, n_phase, endpoint=False)
            scores = [comb(p, ph) for ph in phs]
            k = int(np.argmax(scores))
            cands.append((scores[k], p, phs[k]))
        return max(cands)

    _, period, _ = best(np.arange(80, 180, 0.25), 48)
    _, period, phase = best(np.arange(60 / period - 0.3, 60 / period + 0.3, 0.02), 128)
    grid = np.arange(phase, t[-1], period)

    # Snap every grid beat to the strongest onset within ±40 ms (small tempo drift).
    beats = []
    for i, bt in enumerate(grid):
        k = int(round((bt - t[0]) * frame_rate))
        lo_k, hi_k = max(k - 6, 0), min(k + 7, len(env))
        if lo_k >= hi_k:
            continue
        j = lo_k + int(np.argmax(env[lo_k:hi_k]))
        beats.append({"t": round(float(t[j]), 3), "n": i, "strength": round(float(full[j]), 2), "low": round(float(low[j]), 2)})

    # Downbeat: the phase of 4 with the most kick energy.
    bar = int(np.argmax([sum(b["low"] for b in beats if b["n"] % 4 == p) for p in range(4)]))
    for b in beats:
        b["bar_pos"] = (b["n"] - bar) % 4
        b["f"] = int(round(b["t"] * fps))

    # Onsets: local maxima of the envelope above threshold, ≥ 90 ms apart.
    onsets = []
    thr = 1.2
    last = -1.0
    for j in range(1, len(env) - 1):
        if env[j] >= thr and env[j] >= env[j - 1] and env[j] > env[j + 1] and t[j] - last >= 0.09:
            onsets.append({"t": round(float(t[j]), 3), "f": int(round(t[j] * fps)),
                           "strength": round(float(full[j]), 2), "low": round(float(low[j]), 2)})
            last = t[j]

    step = int(0.25 * rate)
    loud = []
    for i in range(0, len(y) - step + 1, step):
        rms = float(np.sqrt(np.mean(y[i:i + step] ** 2)) + 1e-9)
        loud.append({"t": round(i / rate, 2), "db": round(20 * np.log10(rms), 1)})

    print(json.dumps({"duration": round(len(y) / rate, 3), "fps": fps, "bpm": round(60 / period, 2),
                      "period": round(period, 4), "phase": round(float(phase), 4),
                      "beats": beats, "onsets": onsets, "loudness": loud}))


if __name__ == "__main__":
    main()
