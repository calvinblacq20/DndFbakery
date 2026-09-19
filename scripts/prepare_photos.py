"""Turn the raw Instagram downloads into named, cropped originals for the site.

Reads brand/photos-instagram/ and writes brand/photos-original/<name>.jpg. Crops remove the
caption text Instagram burns into reel covers and a client's name board; one caption on a cake
is painted out. Run it after scripts/fetch_photos.py and before scripts/upscale_photos.py.

Usage:  python scripts/prepare_photos.py
"""

from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "brand" / "photos-instagram"
OUT = ROOT / "brand" / "photos-original"

# name: (raw file stem, crop box as x0, y0, x1, y1 in raw pixels or None for the whole photo)
PHOTOS: dict[str, tuple[str, tuple[int, int, int, int] | None]] = {
    "wedding-adinkra": ("ig-adinkra-1", None),
    "wedding-adinkra-side": ("ig-adinkra-3", None),
    "wedding-emerald": ("ig-nick-leticia-1", None),
    "wedding-emerald-detail": ("ig-nick-leticia-2", None),
    "wedding-emerald-stage": ("ig-nick-leticia-3", None),
    "wedding-gold-roses": ("ig-reel-mock-ganache", None),
    "wedding-red-roses": ("ig-reel-little-moments", None),
    "wedding-reception": ("ig-reel-wedding-2024", None),
    "birthday-wafer-bloom": ("ig-reel-wafer-bloom", None),
    # Drops the client's name board at the bottom.
    "birthday-blue-black": ("ig-reel-blue-black", (0, 72, 360, 452)),
    "kids-frozen": ("ig-reel-frozen", (26, 160, 334, 462)),
    # Below the "Moist chocolate fudge cake" caption.
    "fudge-loaf": ("ig-reel-fudge-loaf", (0, 232, 360, 640)),
    # Below the "Most satisfying 18 seconds" caption.
    "quiche": ("ig-reel-quiche", (0, 128, 348, 640)),
    "anniversary-cake": ("ig-reel-hgt-reveal", (0, 0, 361, 540)),
    # The WhatsApp Business cover: trays of samosas, spring rolls and sausage rolls, left of the profile photo.
    "small-chops": ("wa-cover", (2, 0, 104, 150)),
}

# Caption text painted out of a photo: (name, box) of near-white pixels to inpaint.
PAINT_OUT: dict[str, tuple[int, int, int, int]] = {
    # "Team black" caption over the blue-black cake, in cropped coordinates.
    "birthday-blue-black": (98, 116, 236, 152),
}


def read(stem: str) -> np.ndarray:
    for path in RAW.glob(f"{stem}.*"):
        img = cv2.imread(str(path), cv2.IMREAD_COLOR)
        if img is not None:
            return img
    raise SystemExit(f"missing raw photo {stem} in {RAW}")


def paint_out(img: np.ndarray, box: tuple[int, int, int, int]) -> np.ndarray:
    x0, y0, x1, y1 = box
    mask = np.zeros(img.shape[:2], np.uint8)
    region = img[y0:y1, x0:x1]
    # Caption letters are near-white with a soft shadow; grow the mask to take the shadow too.
    letters = (cv2.cvtColor(region, cv2.COLOR_BGR2GRAY) > 200).astype(np.uint8) * 255
    mask[y0:y1, x0:x1] = cv2.dilate(letters, np.ones((5, 5), np.uint8), iterations=2)
    return cv2.inpaint(img, mask, 5, cv2.INPAINT_TELEA)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, (stem, box) in PHOTOS.items():
        img = read(stem)
        if box:
            x0, y0, x1, y1 = box
            img = img[y0:y1, x0:x1]
        if name in PAINT_OUT:
            img = paint_out(img, PAINT_OUT[name])
        cv2.imwrite(str(OUT / f"{name}.jpg"), img, [cv2.IMWRITE_JPEG_QUALITY, 97])
        print(f"{name:24s} {img.shape[1]}x{img.shape[0]}")


if __name__ == "__main__":
    main()
