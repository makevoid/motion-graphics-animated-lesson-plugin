#!/usr/bin/env python3
"""Track a small feature (e.g. a hair clip) through a video by template matching.

usage: track_template.py video.mp4 X Y SIZE [SEARCH] [FROM]
  X Y   centre of the feature in frame FROM (default 0, full-res pixels), SIZE its box side, SEARCH the max
        move per frame in px (default SIZE). Frames before FROM (e.g. earlier shots) repeat the seed with score 0.
prints JSON: {"fps", "width", "height", "points": [[x, y, score], ...]} — one point per frame, full-res,
lightly smoothed. score is the normalized cross-correlation (1 = identical to the frame-FROM patch).
Luminance NCC, computed with FFTs at half resolution; the template is the frame-FROM patch.
"""
import json
import subprocess
import sys

import numpy as np

SCALE = 2  # work at 1/SCALE resolution


def probe(video):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height,r_frame_rate", "-of", "json", video],
                         capture_output=True, check=True, text=True).stdout
    s = json.loads(out)["streams"][0]
    num, den = s["r_frame_rate"].split("/")
    return s["width"], s["height"], float(num) / float(den)


def frames(video, w, h):
    proc = subprocess.Popen(["ffmpeg", "-v", "error", "-i", video, "-vf", f"scale={w}:{h}",
                             "-f", "rawvideo", "-pix_fmt", "gray", "-"], stdout=subprocess.PIPE)
    size = w * h
    while chunk := proc.stdout.read(size):
        if len(chunk) < size:
            break
        yield np.frombuffer(chunk, np.uint8).reshape(h, w).astype(np.float64)
    proc.wait()


def box_sum(a, k):
    """Sum over every k×k window (valid positions) via an integral image."""
    c = np.pad(a, ((1, 0), (1, 0))).cumsum(0).cumsum(1)
    return c[k:, k:] - c[:-k, k:] - c[k:, :-k] + c[:-k, :-k]


def ncc(window, tmpl):
    k = tmpl.shape[0]
    t = tmpl - tmpl.mean()
    shape = [window.shape[0] + k - 1, window.shape[1] + k - 1]
    corr = np.fft.irfft2(np.fft.rfft2(window, shape) * np.fft.rfft2(t[::-1, ::-1], shape), shape)
    corr = corr[k - 1:window.shape[0], k - 1:window.shape[1]]
    n = k * k
    var = box_sum(window ** 2, k) - box_sum(window, k) ** 2 / n
    return corr / (np.sqrt(np.maximum(var, 1e-6)) * np.sqrt((t ** 2).sum()))


def main():
    video, x, y, size = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), int(sys.argv[4])
    search = int(sys.argv[5]) if len(sys.argv) > 5 else size
    start = int(sys.argv[6]) if len(sys.argv) > 6 else 0
    W, H, fps = probe(video)
    w, h = W // SCALE, H // SCALE
    k, r = size // SCALE, search // SCALE
    cx, cy = x / SCALE, y / SCALE
    tmpl, raw = None, []
    for n, img in enumerate(frames(video, w, h)):
        if n < start:
            raw.append([x, y, 0.0])
            continue
        if tmpl is None:
            x0, y0 = int(round(cx - k / 2)), int(round(cy - k / 2))
            tmpl = img[y0:y0 + k, x0:x0 + k]
        x0 = int(max(0, min(w - k, round(cx - k / 2 - r))))
        y0 = int(max(0, min(h - k, round(cy - k / 2 - r))))
        win = img[y0:min(h, y0 + k + 2 * r), x0:min(w, x0 + k + 2 * r)]
        score = ncc(win, tmpl)
        iy, ix = np.unravel_index(np.argmax(score), score.shape)
        cx, cy = x0 + ix + k / 2, y0 + iy + k / 2
        raw.append([cx * SCALE, cy * SCALE, float(score[iy, ix])])

    pts = np.array(raw)
    smooth = pts.copy()
    for i in range(start, len(pts)):  # 3-frame centred moving average on x, y (within the tracked range)
        lo, hi = max(start, i - 1), min(len(pts), i + 2)
        smooth[i, :2] = pts[lo:hi, :2].mean(0)
    print(json.dumps({"fps": fps, "width": W, "height": H,
                      "points": [[round(a, 1), round(b, 1), round(c, 3)] for a, b, c in smooth]}))


if __name__ == "__main__":
    main()
