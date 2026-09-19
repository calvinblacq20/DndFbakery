"""Write the Dough n Frost favicon, SVG mark and PNG app icons from one set of shapes.

The geometry matches MARK in src/components/Brand.tsx: a frosted doughnut cut by the frosting's
drip line, the hole and five sprinkles. PNGs are drawn at 4x and scaled down for clean edges.

Usage:  python scripts/make_icons.py
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"

INK = "#2b1f1d"
BERRY = "#ff9ccb"

RING = (50, 50, 46)
HOLE = (50, 50, 15)
DRIP = [
    ((0, 62), (8, 62), (10, 74), (16, 74)),
    ((16, 74), (22, 74), (22, 66), (28, 66)),
    ((28, 66), (34, 66), (34, 82), (41, 82)),
    ((41, 82), (48, 82), (47, 70), (53, 70)),
    ((53, 70), (59, 70), (59, 78), (65, 78)),
    ((65, 78), (71, 78), (71, 65), (77, 65)),
    ((77, 65), (83, 65), (84, 74), (90, 74)),
    ((90, 74), (95, 74), (96, 66), (100, 64)),
]
SPRINKLES = [(29, 27, -35), (50, 15, 10), (71, 26, 50), (21, 47, 80), (79, 45, -15)]
GAP = 5


def drip_path() -> str:
    first = DRIP[0][0]
    parts = [f"M{first[0]} {first[1]}"]
    for _, c1, c2, end in DRIP:
        parts.append(f"C{c1[0]} {c1[1]} {c2[0]} {c2[1]} {end[0]} {end[1]}")
    return " ".join(parts)


def mark_svg(fill: str, mask_id: str) -> str:
    sprinkles = "".join(
        f'<line x1="{x - 5}" y1="{y}" x2="{x + 5}" y2="{y}" stroke="#000" stroke-width="{GAP}" stroke-linecap="round" transform="rotate({a} {x} {y})"/>'
        for x, y, a in SPRINKLES
    )
    return (
        f'<defs><mask id="{mask_id}" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">'
        f'<rect width="100" height="100" fill="#fff"/><circle cx="{HOLE[0]}" cy="{HOLE[1]}" r="{HOLE[2]}" fill="#000"/>'
        f'<path d="{drip_path()}" fill="none" stroke="#000" stroke-width="{GAP}"/>{sprinkles}</mask></defs>'
        f'<circle cx="{RING[0]}" cy="{RING[1]}" r="{RING[2]}" fill="{fill}" mask="url(#{mask_id})"/>'
    )


def bezier(p0, p1, p2, p3, steps=40):
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        yield (
            u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
            u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1],
        )


def mark_mask(px: int) -> Image.Image:
    """White where the mark is, black elsewhere, px × px."""
    s = px / 100
    img = Image.new("L", (px, px), 0)
    d = ImageDraw.Draw(img)
    cx, cy, r = RING
    d.ellipse([(cx - r) * s, (cy - r) * s, (cx + r) * s, (cy + r) * s], fill=255)
    hx, hy, hr = HOLE
    d.ellipse([(hx - hr) * s, (hy - hr) * s, (hx + hr) * s, (hy + hr) * s], fill=0)
    half = GAP / 2 * s
    for segment in DRIP:
        for x, y in bezier(*segment):
            d.ellipse([x * s - half, y * s - half, x * s + half, y * s + half], fill=0)
    for x, y, a in SPRINKLES:
        dx, dy = 5 * math.cos(math.radians(a)), 5 * math.sin(math.radians(a))
        d.line([(x - dx) * s, (y - dy) * s, (x + dx) * s, (y + dy) * s], fill=0, width=round(GAP * s))
        for ex, ey in ((x - dx, y - dy), (x + dx, y + dy)):
            d.ellipse([ex * s - half, ey * s - half, ex * s + half, ey * s + half], fill=0)
    return img


def app_icon(size: int, path: Path) -> None:
    big = size * 4
    icon = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    ImageDraw.Draw(icon).rounded_rectangle([0, 0, big - 1, big - 1], radius=round(big * 0.22), fill=INK)
    inner = round(big * 0.64)
    offset = (big - inner) // 2
    color = Image.new("RGBA", (inner, inner), BERRY)
    icon.paste(color, (offset, offset), mark_mask(inner))
    icon.resize((size, size), Image.LANCZOS).save(path)
    print(f"wrote {path.relative_to(ROOT)}")


def main() -> None:
    brand = PUBLIC / "brand"
    brand.mkdir(parents=True, exist_ok=True)
    favicon = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-18 -18 136 136">'
        f'<rect x="-18" y="-18" width="136" height="136" rx="30" fill="{INK}"/>{mark_svg(BERRY, "m")}</svg>\n'
    )
    (PUBLIC / "favicon.svg").write_text(favicon, encoding="utf-8")
    (brand / "dnf-mark.svg").write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">{mark_svg(INK, "m")}</svg>\n', encoding="utf-8")
    print("wrote public/favicon.svg, public/brand/dnf-mark.svg")
    app_icon(180, brand / "dnf-app-icon-180.png")
    app_icon(512, brand / "dnf-app-icon-512.png")


if __name__ == "__main__":
    main()
