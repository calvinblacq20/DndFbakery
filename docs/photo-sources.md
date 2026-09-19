# Photo sources

Every photo in the app is Dough n Frost's own work, taken from their public Instagram ([@dough_n_frost](https://www.instagram.com/dough_n_frost/)) and WhatsApp Business profile on 19 Sept 2026, with Calvin's go-ahead. Replace or add photos the same way (steps in the README).

| Web photo | Instagram post | What it shows | Used for |
|---|---|---|---|
| `wedding-emerald` | [C3FAPrfi4Ik](https://www.instagram.com/p/C3FAPrfi4Ik/) (7 Feb 2024), slide 1 | Three-tier emerald and marble wedding cake, Nick and Leticia | Hero, Wedding cake |
| `wedding-emerald-detail` | same post, slide 2 | Close-up under purple lights | Wedding occasion, How it works |
| `wedding-emerald-stage` | same post, slide 3 | Cake on the stage table | Spare |
| `wedding-adinkra` | [DG2lmyZCUQi](https://www.instagram.com/p/DG2lmyZCUQi/) (6 Mar 2025), slide 1 | Four-tier Adinkra wedding cake with Gye Nyame | Hero |
| `wedding-adinkra-side` | same post, slide 3 | Same cake, side view | Anniversary occasion |
| `wedding-gold-roses` | [DdQ1dwxqkEd](https://www.instagram.com/reel/DdQ1dwxqkEd/) (14 Sept 2026), reel cover | Fondant-free white-chocolate ganache cake, first destination wedding | Hero, Fondant-free wedding cake, closing section |
| `wedding-red-roses` | [DcLKnghKOD6](https://www.instagram.com/reel/DcLKnghKOD6/) (18 Aug 2026), reel cover | Two-tier white cake, red roses, Mr and Mrs topper | Hero, Two-tier cake, Bridal shower occasion |
| `wedding-reception` | [DCGlh8uigHe](https://www.instagram.com/reel/DCGlh8uigHe/) (8 Nov 2024), reel cover | Cake and cupcake tower at a reception | Home side card, How it works |
| `birthday-wafer-bloom` | [DaAH-3EqpuS](https://www.instagram.com/reel/DaAH-3EqpuS/) (25 Jun 2026), reel cover | Wafer-paper flower birthday cake | Hero, Celebration cake, Christening occasion |
| `birthday-blue-black` | [DdBWz0cKM-2](https://www.instagram.com/reel/DdBWz0cKM-2/) (8 Sept 2026), reel cover | Blue-black birthday cake with fruit and gold | Statement birthday cake, Birthday occasion |
| `kids-frozen` | [DcyACJOqgkA](https://www.instagram.com/reel/DcyACJOqgkA/) (2 Sept 2026), reel cover | Elsa and Anna Frozen cakes | Hero, Character cake, Kids' party occasion |
| `fudge-loaf` | [CzlKDT4CqOf](https://www.instagram.com/reel/CzlKDT4CqOf/) (13 Nov 2023), reel cover | Chocolate fudge cake loaf (GH₵ 150 in the caption) | Fudge loaf, Just because occasion |
| `quiche` | [DcLLr7zqYM1](https://www.instagram.com/reel/DcLLr7zqYM1/) (18 Aug 2026), reel cover | Savoury quiche | Savoury quiche |
| `anniversary-cake` | [DVdbt6UCj_T](https://www.instagram.com/reel/DVdbt6UCj_T/) (4 Mar 2026), reel cover | Church-building showpiece cake for a 30th anniversary | Showpiece & logo cake, Office & events occasion |
| `small-chops` | WhatsApp Business cover photo (from `brand/source-video/IMG_3100.MP4`) | Boxed samosas, spring rolls and sausage rolls | Corporate snack box, bento card |

## Edits made

`scripts/prepare_photos.py` crops each download before the web build:

- Reel covers had Instagram's burnt-in captions ("Moist chocolate fudge cake", "Most satisfying 18 seconds of your day"); those photos are cropped below the caption.
- `birthday-blue-black` is cropped above the client's name board, and its "Team black" caption is painted out. The retouch shows at large sizes, so this photo is kept off the hero gallery.
- `kids-frozen` is cropped to the photo inside the reel's frame; `anniversary-cake` drops a blue band at the bottom.

Reel covers are only 360 px wide without logging in to Instagram, so they are AI-upscaled to about 1,440 px with Real-ESRGAN before `scripts/build_photos.py` makes the three web sizes. The two carousel posts were downloaded at their full 1080 and 1440 px.

## Menu items without a photo yet

Party sheet cake, Christening & naming cake, Bridal shower cake, Cupcakes, Doughnuts, Rock cakes, Small chops platter and Meat pies show the pastel tile with the doughnut mark. Their Instagram highlights (Cupcakes, Themed cakes, 2 tier cakes) need a login to download; ask the owner for originals.
