# BUILD NOTES — Vice Cover Studio (gta6-cover-art-01)

Built 19 Nov 2026 in the recorded builder session (recording
01a1f36f-50ea-75d7-942b-ae9bcd51febe, started ~10:53 UTC). No commit, no push,
no submit, no signing, no spend — build only, handed back to the coordinator.

## What was built

Offline cover art maker "Vice Cover Studio": upload your own photos (or use
the two kit samples), pick a multi-panel layout (full bleed / split 2 /
hero + 2 / grid 4), drag to pan and scroll to zoom each panel's photo, edit
the title (Bebas Neue, sunset/neon/white fill) and neon script tagline
(Pacifico), pick a Sunset / Neon / Vice pink / Noir grade (+ grain,
vignette), live preview, one-click PNG export at 1080×1080, 1080×1350,
1920×1080.

## Files written in this session (all from scratch)

- `app/index.html` (7,113 B) — editor layout, controls, shot-mode hooks.
- `app/style.css` (8,626 B) — dark neon editor chrome; `@font-face` for the
  two vendored OFL fonts; `.shot-cover` full-viewport mode for cover shots.
- `app/src/render.js` (8,595 B) — the cover painter: layouts, grades,
  cover-fit photo draw with zoom/pan, gradient lettering, grain, vignette.
- `app/src/editor.js` (10,785 B) — state, photo library + uploads, panel
  selection, drag/wheel crop, controls, export downloads, boot + shot mode.
- `app/src/shots.js` (1,965 B) — fixed `?shot=cover|editor` scenes.
- `main.ts` (2,788 B) — entry program, written from scratch: fresh output
  dir, sorted copy of app/ + screenshots/, `buildDossier` from vendor.
- `serve.ts` (2,155 B) — tiny local static server for trying the app.
- `README.md` (3,804 B) — from scratch, live make.fun badges only.
- `screenshots/1-cover.jpg` (140,534 B, 1280×720) — best exported cover
  (hero layout, sunset, "VICE NIGHTS"), first by name.
- `screenshots/2-editor.jpg` (164,288 B, 1280×1000) — editor with photos
  loaded.
- `screenshots/3-cover-portrait.jpg` (136,849 B, 768×960) — exported
  1080×1350 cover (grid, neon, "NEON TIDE").
- `screenshots/4-cover-square.jpg` (84,048 B, 720×720) — exported
  1080×1080 cover (split, vice pink, "PIER PRESSURE").

Copied, not written (allowed assets): `app/samples/boulevard.jpg` +
`pier.jpg` from the kit starter; `app/fonts/BebasNeue-Regular.ttf` +
`Pacifico-Regular.ttf` (OFL 1.1, `app/fonts/OFL.txt`) downloaded from
google/fonts on GitHub. `vendor/makefun-app.ts` untouched (sha256
14e650adbd6aff7fb760e9bcd7be00dfbe86fb4819afe88dfe23dd0e087e770e).

Screenshot driver (not part of the entry): `../shots.mjs` — Playwright
(playwright-core from the radar-bundle install) + `serve.ts`, JPEG q82.

## Test results (19 Nov 2026 ~11:00 UTC)

1. **Determinism** — `MAKEFUN_OUTPUT_DIR=out node main.ts` run twice into
   two dirs: `diff -r` clean, byte-identical; dossier 740,724 B.
2. **Offline + no console errors** — served via `serve.ts`, loaded in
   headless Chromium: 0 page errors, 0 console errors, 0 non-localhost
   requests across all 4 shots + the editor page.
3. **Export PNG** — clicked each size button in the editor; downloads are
   real PNGs at exactly 1080×1080 (2,291,448 B), 1080×1350 (2,681,243 B),
   1920×1080 (3,746,775 B).
4. **Caps** — app/ 550,799 B total (≤48 MiB), 10 files (≤993);
   index.html 7,113 B (≤1 MiB); dossier 740,724 B (≤1.5 MiB).
5. **Screenshots** — all ≤256 KiB, long side ≤1280, short side ≥480
   (1280×720, 1280×1000, 768×960, 720×720). All four visually inspected:
   covers show multi-panel art + bold lettering + grade; editor shows the
   loaded photos, layout/grade/caption controls and the 4-step flow.

## Not done by this builder (coordinator's steps)

- Kit `check` (needs a commit), commit + push, sealing the recording,
  submit. Recording left running (pid 4274) as instructed.
