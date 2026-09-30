#!/usr/bin/env python3
"""Split a green-screen video of characters standing in a row into one video per character (gen4-anim17's dancers).

usage: split_row.py SOURCE OUT_PREFIX X1 X2 ... [--band 90]
  X1 X2 …  the nominal x of each gap between neighbours (source pixels, left to right): N gaps -> N + 1 videos
  --band   how far (px) a seam may wander from its gap's x
For every frame and every gap it finds the vertical seam (top to bottom, moving at most 1 px sideways per row) that crosses the
fewest character pixels within the band, so dancers whose raised hands touch or overlap are still cut apart along the cleanest line.
Writes OUT_PREFIX_0.mp4 … : the same frames with everything outside that character's strip painted flat chroma green (#00B140),
ready for Clips `source:` items with `key: green` (and a box around the strip).
"""
import argparse
import subprocess

import numpy as np

GREEN = np.array([0, 177, 64], np.uint8)


def seam(cost):
    """Min-cost top-to-bottom path through cost (rows x cols), 8-connected; returns the column per row."""
    h, w = cost.shape
    acc = cost.astype(np.float64).copy()
    for y in range(1, h):
        prev = acc[y - 1]
        left = np.r_[np.inf, prev[:-1]]
        right = np.r_[prev[1:], np.inf]
        acc[y] += np.minimum(np.minimum(left, right) + 0.05, prev)
    path = np.empty(h, int)
    path[-1] = int(np.argmin(acc[-1]))
    for y in range(h - 2, -1, -1):
        x = path[y + 1]
        lo, hi = max(0, x - 1), min(w, x + 2)
        path[y] = lo + int(np.argmin(acc[y, lo:hi]))
    return path


def main():
    p = argparse.ArgumentParser()
    p.add_argument("source"); p.add_argument("out_prefix"); p.add_argument("gaps", type=int, nargs="+")
    p.add_argument("--band", type=int, default=90)
    o = p.parse_args()
    probe = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height",
                            "-of", "csv=p=0", o.source], capture_output=True, check=True, text=True).stdout
    w, h = map(int, probe.strip().split(",")[:2])
    reader = subprocess.Popen(["ffmpeg", "-v", "error", "-i", o.source, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    n = len(o.gaps) + 1
    writers = [subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{w}x{h}", "-r", "24",
                                 "-i", "-", "-c:v", "libx264", "-crf", "12", "-pix_fmt", "yuv444p", f"{o.out_prefix}_{i}.mp4"],
                                stdin=subprocess.PIPE) for i in range(n)]
    xs = np.arange(w)
    frames = 0
    while (buf := reader.stdout.read(w * h * 3)) and len(buf) == w * h * 3:
        img = np.frombuffer(buf, np.uint8).reshape(h, w, 3)
        a = img.astype(np.int16)
        fg = (a[..., 1] - np.maximum(a[..., 0], a[..., 2])) < 25
        cuts = []
        for g in o.gaps:
            lo, hi = max(0, g - o.band), min(w, g + o.band)
            # cost: character pixels, plus a gentle pull toward the nominal gap so empty rows don't wander
            cost = fg[:, lo:hi] * 10.0 + np.abs(np.arange(lo, hi) - g)[None, :] * 0.002
            cuts.append(lo + seam(cost))
        edges = [np.zeros(h, int)] + cuts + [np.full(h, w)]
        for i in range(n):
            inside = (xs[None, :] >= edges[i][:, None]) & (xs[None, :] < edges[i + 1][:, None])
            out = np.where(inside[..., None], img, GREEN)
            writers[i].stdin.write(out.astype(np.uint8).tobytes())
        frames += 1
    for wr in writers:
        wr.stdin.close(); wr.wait()
    reader.wait()
    print(f"{frames} frames -> {n} videos {o.out_prefix}_0..{n - 1}.mp4")


if __name__ == "__main__":
    main()
