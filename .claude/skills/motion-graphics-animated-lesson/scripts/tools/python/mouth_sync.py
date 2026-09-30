#!/usr/bin/env python3
"""Measure a lip-synced sprite clip against a vocal stem.

    python3 scripts/mouth_sync.py <clip_dir> <vocals.wav> <song_start_s> X Y W H [--pauses 55.79-56.04,57.88-58.21]

<clip_dir> holds the cut-out frames 0000.png… (sprite frame i shows song time song_start_s + i/24). X Y W H is a box around the
mouth in sprite pixels. Per frame: openness = share of dark pixels in the box (an open mouth shows its dark inside) and the vocal's
level at that frame. Prints the correlation at lags -6..+6 frames (positive = the mouth comes late), the mouth's movement inside each
pause, and a per-frame table. The JSON summary goes to stdout's last line.
"""
import glob
import json
import sys
import wave

import numpy as np
from PIL import Image


def vocal_db(path, start, n, fps=24):
    w = wave.open(path)
    sr, ch, sw = w.getframerate(), w.getnchannels(), w.getsampwidth()
    dtype = {2: np.int16, 4: np.int32}[sw]
    x = np.frombuffer(w.readframes(w.getnframes()), dtype=dtype).reshape(-1, ch).mean(1) / float(2 ** (8 * sw - 1))
    out = []
    for i in range(n):
        a, b = int((start + i / fps) * sr), int((start + (i + 1) / fps) * sr)
        seg = x[a:b]
        out.append(20 * np.log10(np.sqrt((seg ** 2).mean()) + 1e-9) if len(seg) else -120.0)
    return np.array(out)


def openness(clip_dir, n, box):
    x, y, w, h = box
    vals = []
    for i in range(n):
        im = np.asarray(Image.open(f"{clip_dir}/{i:04d}.png").convert("RGBA")).astype(float)[y:y + h, x:x + w]
        rgb, a = im[..., :3], im[..., 3]
        lum = rgb @ [0.299, 0.587, 0.114]
        dark = (lum < 95) & (a > 128)
        vals.append(dark.mean())
    return np.array(vals)


def main():
    args = sys.argv[1:]
    pauses = []
    if "--pauses" in args:
        k = args.index("--pauses")
        pauses = [tuple(map(float, p.split("-"))) for p in args[k + 1].split(",")]
        del args[k:k + 2]
    clip_dir, wav, start = args[0], args[1], float(args[2])
    box = tuple(int(v) for v in args[3:7])
    n = len(glob.glob(f"{clip_dir}/*.png"))
    mouth = openness(clip_dir, n, box)
    voc = vocal_db(wav, start, n)
    voiced = (voc > -36).astype(float)
    m = (mouth - mouth.mean()) / (mouth.std() + 1e-9)
    v = (np.clip(voc, -60, 0) - np.clip(voc, -60, 0).mean()) / (np.clip(voc, -60, 0).std() + 1e-9)
    corr = {}
    for lag in range(-6, 7):   # mouth[i + lag] vs voice[i]
        a = m[max(0, lag):n + min(0, lag)]
        b = v[max(0, -lag):n - max(0, lag)]
        corr[lag] = float(np.corrcoef(a, b)[0, 1])
    best = max(corr, key=corr.get)
    print("lag (frames, + = mouth late):  " + "  ".join(f"{k:+d}:{c:+.2f}" for k, c in corr.items()))
    print(f"best lag {best:+d} frames (r = {corr[best]:+.2f})")
    talk = mouth[voiced > 0]
    rep = {"best_lag": best, "r": round(corr[best], 3), "mouth_voiced": round(float(talk.mean()), 4) if len(talk) else None,
           "pauses": []}
    for a, b in pauses:
        idx = [i for i in range(n) if a <= start + i / 24 < b]
        if not idx:
            continue
        seg = mouth[idx]
        info = {"pause": [a, b], "mean": round(float(seg.mean()), 4), "range": round(float(seg.max() - seg.min()), 4)}
        rep["pauses"].append(info)
        print(f"pause {a:.2f}-{b:.2f}: mouth mean {seg.mean():.4f} (voiced mean {talk.mean():.4f}), movement {seg.max() - seg.min():.4f}")
    for i in range(n):
        s = start + i / 24
        print(f"{i:3d} {s:6.2f}  voice {voc[i]:6.1f} {'#' * max(0, int((voc[i] + 50) / 2)):<25s} mouth {mouth[i]:.3f} {'*' * int(mouth[i] * 150)}")
    print(json.dumps(rep))


if __name__ == "__main__":
    main()
