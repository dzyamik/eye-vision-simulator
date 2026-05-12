#!/usr/bin/env python3
# Regenerates public/samples/astigmatism-dial.png — a 12-line clinical
# astigmatism dial used to verify directional blur in the AstigmatismPipeline.
# Run from repo root: `python3 scripts/generate-astigmatism-dial.py`.
# Requires Pillow (`pip install pillow`).
import math
from pathlib import Path
from PIL import Image, ImageDraw

SIZE = 1024
CENTER = SIZE // 2
INNER = 80
OUTER = 460
LINE_W = 10
OUT_PATH = Path(__file__).resolve().parent.parent / "public" / "samples" / "astigmatism-dial.png"

img = Image.new("RGB", (SIZE, SIZE), "white")
draw = ImageDraw.Draw(img)

# 12 radii at 30° intervals (clinical clock-dial spacing). Math convention:
# angle counterclockwise from +x; screen y is flipped so we negate sin.
for i in range(12):
    angle = math.radians(i * 30)
    dx, dy = math.cos(angle), -math.sin(angle)
    draw.line(
        [(CENTER + dx * INNER, CENTER + dy * INNER),
         (CENTER + dx * OUTER, CENTER + dy * OUTER)],
        fill="black",
        width=LINE_W,
    )
draw.ellipse(
    [(CENTER - 8, CENTER - 8), (CENTER + 8, CENTER + 8)],
    fill="black",
)
OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
img.save(OUT_PATH, optimize=True)
print(f"wrote {OUT_PATH}")
