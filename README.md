# Dough n Frost: Bakery App (demo)

Ordering and kitchen app for Dough n Frost ("Cakes by Em"), a home bakery at 25 Agyemang Avenue, Adenta. Clients browse the menu, build a cake from the bakery's own price list, pick a pickup time or delivery window, pay with Mobile Money or card, track the order and keep official receipts. The owner runs the kitchen from `#/admin`: today's kitchen list, orders (list and board), walk-in and WhatsApp orders, clients with allergies, dates to remember and a private notebook, pickups and tastings, payments and receipts, reports, reviews, the menu and price list, and settings.

- Business facts, scope and open questions: `docs/PRD.md`
- Photos: `docs/photo-sources.md`
- Look and structure (shared with the Franz Qlodin build): `docs/design-reference.md`, `docs/structure-reference.md`, `docs/admin-ui-guidelines.md`

## Run it

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173 (client) or http://localhost:5173/#/admin (owner).

```bash
npm test
```

```bash
npm run typecheck
```

```bash
npm run build
```

## Screen sizes

| Width | Layout |
|---|---|
| Under 810px (phones) | App layout: bottom tab bar, bottom sheets, sticky bottom action bars |
| 810–1023px (tablets) | Floating top nav and footer, wider grids, dialogs instead of bottom sheets |
| 1024px and up (desktop) | Two-column pages with sticky side cards on the bakery page, order flow and order page |

## Demo notes

- All data is sample data kept in the browser (`localStorage`). **Profile → Reset demo data** (client) or **Settings → Reset demo data** (admin) restores it.
- Cake prices come from the bakery's WhatsApp price list; other prices are samples. The owner can edit both in **Menu & prices**, and fees and hours in **Settings**. Past orders keep the price they were quoted.
- Orders placed with less than the item's notice (3 working days for most cakes) are late orders and pay the GH₵ 50 late fee. Sundays are closed.
- Paying in full online books a price-list cake straight away. Custom designs, tiered cakes and design sessions stay a request until the owner sends the quote.
- The owner side has no login in the demo. The bakery's order book is simulated over five months from fixed seeds (`src/data/studio-seed.ts`), dated relative to today, so there's always something in the oven, something to decorate and something ready.
- WhatsApp updates and birthday reminders open WhatsApp with the message filled in; nothing is sent automatically.
- You start without an account and can order without one. To see order history, dates to remember and allergies, log in from **Profile** with the sample account `024 555 0142`.
- Paystack payments and WhatsApp login codes are simulated. The code shows up as a notification at the top of the screen, and no money moves.
- Going live needs a server to verify Paystack payments; see "Going live with Paystack" in `docs/PRD.md`.

## Photos

Every photo is the bakery's own, from their Instagram ([@dough_n_frost](https://www.instagram.com/dough_n_frost/)) and WhatsApp Business cover; `docs/photo-sources.md` lists which post each came from.

The pipeline, in order:

```bash
python scripts/fetch_photos.py list.json
```

Downloads the images in a JSON list (`[{"name", "url"}]`) into `brand/photos-instagram/`.

```bash
python scripts/prepare_photos.py
```

Crops out Instagram's burnt-in captions and writes named originals to `brand/photos-original/`.

```bash
python scripts/upscale_photos.py --model path/to/real_esrgan_x4plus.onnx --below 1080
```

Upscales small reel covers with Real-ESRGAN x4plus ([qualcomm/Real-ESRGAN-x4plus](https://huggingface.co/qualcomm/Real-ESRGAN-x4plus), BSD-3-Clause) on the CPU. Needs `pip install onnxruntime opencv-python numpy`. Output goes to `brand/photos-upscaled/`, which git ignores.

```bash
python scripts/build_photos.py
```

Writes three WebP sizes per photo to `public/photos/` (480, 1080 and up to 2160px) and `src/data/photo-manifest.json`, so the browser picks the right size.

To add a photo for a menu item, put the JPG in `brand/photos-original/`, run the last script, and set `photo: "/photos/name.webp"` on the item in `src/data/catalog.ts`. Items without a photo show a pastel tile with the doughnut mark.

## Brand files

There's no logo on the bakery's profiles yet, so the mark is a frosted doughnut drawn in code (`src/components/Brand.tsx`). `python scripts/make_icons.py` writes the favicon (`public/favicon.svg`), `public/brand/dnf-mark.svg` and the app icons from the same shapes. Swap in their real logo when they send one.
