#!/usr/bin/env python3
"""Slice a generated prop/icon sheet on flat chroma green into one transparent PNG per prop.

usage: split_sheet.py SHEET OUT_DIR [--min-area 0.002] [--merge 18] [--pad 12] [--names a,b,c]
Keys the green (same alpha + despill as cutout.py), finds connected blobs on a 1/4-scale mask dilated by `merge` px (so a
prop's detached bits such as sparkles or steam stay with it), drops blobs smaller than min-area (share of the sheet), and
crops each blob from the full-resolution RGBA with `pad` px. Blobs are ordered in reading order (rows top to bottom, then
left to right); --names renames them in that order. Writes OUT_DIR/<name>.png, OUT_DIR/index.json and OUT_DIR/board.png
(every crop labelled on grey, for review). Prints the index JSON.
"""
import argparse
import json
import os
from collections import deque

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from cutout import despill, green_alpha


def components(mask):
    h, w = mask.shape
    seen = np.zeros_like(mask, bool)
    out = []
    for y0, x0 in zip(*np.nonzero(mask)):
        if seen[y0, x0]:
            continue
        q = deque([(y0, x0)]); seen[y0, x0] = True
        ys, xs, n = [y0, y0], [x0, x0], 0
        while q:
            y, x = q.popleft(); n += 1
            ys[0] = min(ys[0], y); ys[1] = max(ys[1], y); xs[0] = min(xs[0], x); xs[1] = max(xs[1], x)
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; q.append((ny, nx))
        out.append({"x0": xs[0], "y0": ys[0], "x1": xs[1], "y1": ys[1], "n": n})
    return out


def main():
    p = argparse.ArgumentParser()
    p.add_argument("sheet"); p.add_argument("out")
    p.add_argument("--min-area", type=float, default=0.002); p.add_argument("--merge", type=int, default=18)
    p.add_argument("--pad", type=int, default=12); p.add_argument("--names", default="")
    o = p.parse_args()
    os.makedirs(o.out, exist_ok=True)
    img = Image.open(o.sheet).convert("RGB")
    alpha = green_alpha(img)
    rgba = despill(img).convert("RGBA"); rgba.putalpha(alpha)
    k = 4
    small = alpha.resize((img.width // k, img.height // k), Image.BILINEAR)
    grow = max(3, (o.merge // k) * 2 + 1)
    mask = np.asarray(small.point(lambda v: 255 if v > 96 else 0).filter(ImageFilter.MaxFilter(grow))) > 0
    blobs = [b for b in components(mask) if b["n"] >= o.min_area * mask.size]
    # reading order: group into rows by vertical centre (row height = median blob height)
    if blobs:
        med = float(np.median([b["y1"] - b["y0"] for b in blobs])) or 1
        blobs.sort(key=lambda b: (round(((b["y0"] + b["y1"]) / 2) / med), b["x0"]))
    names = [n for n in o.names.split(",") if n]
    index = []
    for i, b in enumerate(blobs):
        r = (grow // 2)
        x0 = max(0, (b["x0"] + r) * k - o.pad); y0 = max(0, (b["y0"] + r) * k - o.pad)
        x1 = min(img.width, (b["x1"] - r + 1) * k + o.pad); y1 = min(img.height, (b["y1"] - r + 1) * k + o.pad)
        crop = rgba.crop((x0, y0, x1, y1))
        bbox = crop.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
        if bbox:
            crop = crop.crop((max(0, bbox[0] - o.pad), max(0, bbox[1] - o.pad), min(crop.width, bbox[2] + o.pad), min(crop.height, bbox[3] + o.pad)))
            x0, y0 = x0 + max(0, bbox[0] - o.pad), y0 + max(0, bbox[1] - o.pad)
        name = names[i] if i < len(names) else f"prop_{i:02d}"
        path = os.path.join(o.out, f"{name}.png")
        crop.save(path)
        index.append({"name": name, "path": path, "box": [int(x0), int(y0), int(crop.width), int(crop.height)]})
    # review board
    cell = 360
    cols = max(1, min(6, len(index)))
    rows = (len(index) + cols - 1) // cols or 1
    board = Image.new("RGB", (cols * cell, rows * (cell + 28)), (128, 128, 128))
    draw = ImageDraw.Draw(board)
    for i, it in enumerate(index):
        im = Image.open(it["path"]); im.thumbnail((cell - 16, cell - 16))
        cx, cy = (i % cols) * cell, (i // cols) * (cell + 28)
        board.paste(im, (cx + (cell - im.width) // 2, cy + (cell - im.height) // 2), im)
        draw.text((cx + 8, cy + cell + 6), it["name"], fill=(255, 255, 255))
    board.save(os.path.join(o.out, "board.png"))
    json.dump(index, open(os.path.join(o.out, "index.json"), "w"), indent=2)
    print(json.dumps({"count": len(index), "board": os.path.join(o.out, "board.png"), "props": index}))


if __name__ == "__main__":
    main()
