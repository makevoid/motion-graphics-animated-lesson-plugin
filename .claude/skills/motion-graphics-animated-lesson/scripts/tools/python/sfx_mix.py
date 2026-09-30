#!/usr/bin/env python3
"""Mix sound-effect cues over a music track (Media::Sfx, rake sfx:mix).

usage: sfx_mix.py music.wav cues.json out.wav [--floor-db -30] [--peak-db -6] [--max-gain-db 18]

cues.json: [{ "at": s, "wav": path, "sound": name, "rel_db": dB, "rate": 1.0, "len": s|null, "fade": s }, ...]

Each sound is decoded to 48 kHz stereo float, its leading silence trimmed (so it hits on the cue), optionally sped up / pitched by
`rate` and cut to `len` with a fade-out. Its level is set so that its loudness (RMS over its audible part, high-passed at 150 Hz as
a rough stand-in for perceived loudness) sits `rel_db` from the music's loudness in the same window, with the music floored at
`--floor-db` so a cue in a quiet passage stays audible, capped so the cue peaks at most at `--peak-db` and is never boosted by more
than `--max-gain-db`. The music is not changed; the sum goes through a peak limiter (-1 dBFS).
Prints a JSON report per cue: music dB, sfx gain, the cue's peak after gain and the limiter's deepest cut in its window.
"""
import argparse
import json
import subprocess

import numpy as np

SR = 48000


def decode(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


def loudness_db(x, fc=150.0):
    """RMS in dB of the mono sum with everything under fc removed (FFT), a rough stand-in for perceived loudness."""
    if len(x) < 64:
        return -120.0
    m = x.mean(axis=1)
    spec = np.fft.rfft(m)
    spec[np.fft.rfftfreq(len(m), 1 / SR) < fc] = 0
    h = np.fft.irfft(spec, len(m))
    return 20 * np.log10(np.sqrt(np.mean(h ** 2)) + 1e-12)


def trim_lead(x, thresh_db=-40.0):
    env = np.abs(x).max(axis=1)
    peak = env.max() + 1e-12
    on = np.nonzero(env > peak * 10 ** (thresh_db / 20))[0]
    if len(on) == 0:
        return x
    start = max(0, on[0] - int(0.003 * SR))
    end = on[-1] + int(0.02 * SR)
    return x[start:end]


def active(x, thresh_db=-30.0):
    """The part of a sound above thresh (relative to its peak), for measuring its loudness."""
    env = np.abs(x).max(axis=1)
    peak = env.max() + 1e-12
    blk = int(0.01 * SR)
    n = len(env) // blk
    if n == 0:
        return x
    b = env[: n * blk].reshape(n, blk).max(axis=1)
    keep = np.repeat(b > peak * 10 ** (thresh_db / 20), blk)
    return x[: n * blk][keep]


def resample(x, rate):
    if abs(rate - 1.0) < 1e-6:
        return x
    n = int(len(x) / rate)
    src = np.arange(n) * rate
    idx = np.arange(len(x))
    return np.stack([np.interp(src, idx, x[:, c]) for c in range(2)], axis=1)


def limit(x, ceiling_db=-1.0, release=0.08):
    ceil = 10 ** (ceiling_db / 20)
    blk = int(0.0025 * SR)
    n = -(-len(x) // blk)
    pad = np.zeros((n * blk - len(x), 2))
    env = np.abs(np.vstack([x, pad])).max(axis=1).reshape(n, blk).max(axis=1)
    g = np.minimum(1.0, ceil / (env + 1e-12))
    # look ahead one block, then release smoothly (gain recovers at most by the release rate)
    g = np.minimum(g, np.concatenate([g[1:], [1.0]]))
    rel = np.exp(-blk / (release * SR))
    out = np.empty_like(g)
    cur = 1.0
    for i, gi in enumerate(g):
        cur = gi if gi < cur else gi + (cur - gi) * rel
        out[i] = cur
    gs = np.repeat(out, blk)[: len(x)]
    y = x * gs[:, None]
    return np.clip(y, -ceil, ceil), gs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("music")
    ap.add_argument("cues")
    ap.add_argument("out")
    ap.add_argument("--floor-db", type=float, default=-30.0)
    ap.add_argument("--peak-db", type=float, default=-6.0)
    ap.add_argument("--max-gain-db", type=float, default=18.0)
    a = ap.parse_args()

    music = decode(a.music)
    fx = np.zeros_like(music)
    cache = {}
    report = []
    for cue in json.load(open(a.cues)):
        if cue["wav"] not in cache:
            cache[cue["wav"]] = trim_lead(decode(cue["wav"]))
        s = resample(cache[cue["wav"]], cue.get("rate") or 1.0)
        if cue.get("len"):
            s = s[: int(cue["len"] * SR)].copy()
        fade = int((cue.get("fade") or 0.05) * SR)
        if fade and len(s) > fade:
            s[-fade:] *= np.linspace(1, 0, fade)[:, None]
        i0 = int(round(cue["at"] * SR))
        if i0 >= len(music):
            continue
        s = s[: len(music) - i0]
        m_db = max(loudness_db(music[i0: i0 + len(s)]), a.floor_db)
        s_db = loudness_db(active(s))
        # loudness match, but never past the peak cap (the song is mastered near 0 dBFS, so hot transients would make the limiter
        # duck the music) or past max_gain (a near-silent generation would only bring its noise up)
        peak_raw = 20 * np.log10(np.abs(s).max() + 1e-12)
        gain_db = min(m_db + cue["rel_db"] - s_db, a.peak_db - peak_raw, a.max_gain_db)
        fx[i0: i0 + len(s)] += s * 10 ** (gain_db / 20)
        report.append({"at": cue["at"], "sound": cue.get("sound"), "music_db": round(m_db, 1), "gain_db": round(gain_db, 1),
                       "peak_db": round(20 * np.log10(np.abs(s).max() + 1e-12) + gain_db, 1), "n": len(s)})

    mix, gs = limit(music + fx)
    for r in report:
        i0 = int(r["at"] * SR)
        w = gs[i0: i0 + r.pop("n")]
        r["limiter_db"] = round(20 * np.log10(w.min()), 1) if len(w) else 0.0
    pcm = (mix * 32767).astype(np.int16).tobytes()
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "s16le", "-ar", str(SR), "-ac", "2", "-i", "-", a.out], input=pcm, check=True)
    print(json.dumps({"cues": report, "limiter_db": round(20 * np.log10(gs.min()), 1)}))


if __name__ == "__main__":
    main()
