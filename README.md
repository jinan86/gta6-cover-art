# Vice Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/jinan86/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/jinan86/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline cover art maker for the [Make GTA 6 Cover Art bounty](https://make.fun/bounty/gta6-cover-art-01) on [make.fun](https://make.fun/r/95rs49se). Turn your own photos into a multi-panel poster in the style of a GTA 6 cover — sunset grades, bold lettering, neon tagline — and export it as a PNG ready to post.

## What it does

- **Any photo** — upload photos from your machine (or start with the two included samples). Nothing is uploaded anywhere; the photos never leave your browser.
- **Multi-panel layouts** — full bleed, split in two, hero + two, or a four-panel grid. One photo can fill every panel, or each panel can hold a different photo.
- **Crop and position per panel** — drag a panel to pan its photo, scroll over it (or use the zoom slider) to zoom, click a panel to select it, reset it, or fill all panels with one photo.
- **Caption with bold lettering** — an editable title in Bebas Neue with a sunset-gradient, neon-pink or solid-white fill, plus a neon script tagline in Pacifico. Top or bottom placement.
- **Vice City grades** — Sunset, Neon, Vice pink and Noir colour grades, with optional film grain and vignette, painted over the whole poster.
- **Fast export** — one click exports a PNG at 1080 × 1080, 1080 × 1350 or 1920 × 1080. Live preview the whole time.

## Run it

```bash
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. No build step, no network requests: every script, font and sample photo is a file under `app/`.

## How to make a cover

1. **Photos** — click a sample, or **Upload photo** to add your own. Click **Use** on any photo to put it in the selected panel.
2. **Panels** — pick a layout, then drag and scroll on the preview to crop each photo into place.
3. **Words** — type the title and tagline, choose the grade and title style.
4. **Export** — pick a size and hit **Export PNG**.

## Originality

Everything here is original work. No Rockstar Games logo, wordmark, official artwork, character or font is used. The lettering fonts are **Bebas Neue** and **Pacifico**, both under the SIL Open Font License 1.1 — the font files and licence live in `app/fonts/` (see `app/fonts/OFL.txt`). The two sample photos (`app/samples/boulevard.jpg`, `app/samples/pier.jpg`) were made with an image model for make.fun and are free to use.

## Files

- `main.ts` — the entry program (Node 22, standard library only): copies `app/` and `screenshots/` to `/output` and writes `dossier.json` with the vendored make.fun library.
- `app/` — the whole app as static files: `index.html`, `style.css`, `src/render.js` (the cover painter), `src/editor.js` (state and controls), `src/shots.js` (fixed screenshot scenes), `fonts/`, `samples/`.
- `screenshots/` — 3–4 screenshots taken from the app itself; the first by name is the best exported cover.
- `vendor/makefun-app.ts` — the kit's library, unchanged.
- `serve.ts` — a tiny local static server for trying the app.

## Handing it in

```bash
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Run it twice: both runs write the same bytes. `out/dossier.json` is what the judge reads.

## License

MIT — see [LICENSE](LICENSE).
