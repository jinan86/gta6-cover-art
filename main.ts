// Vice Cover Studio — the entry program (Node 22, standard library only).
//
// It hands the app in: it copies this repository's app/ (the offline cover
// maker: index.html, its modules, the OFL fonts and the sample photos) and
// screenshots/ (the cover and the editor, shot by the maker) into /output,
// then writes /output/dossier.json, the summary the judge reads, with the
// vendored make.fun library. Nothing here needs the network, and running it
// twice writes the same bytes twice.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The scorer's own caps (kit reference/gate.json): only text_max_bytes shapes
// the dossier text; the other limits refuse an entry the scorer would refuse.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

const repoRoot = resolve(fileURLToPath(new URL('.', import.meta.url)));
const outputDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

function fail(message) {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

function requireDir(path, what) {
  if (!existsSync(path) || !statSync(path).isDirectory()) fail(`missing ${what} directory: ${path}`);
}

// A fresh output tree every run, so a stale file from an earlier build can
// never leak into the entry.
function freshDir(path) {
  rmSync(path, { recursive: true, force: true });
  mkdirSync(path, { recursive: true });
}

// Copy in sorted order so the tree walk (and the dossier built from it) is
// stable no matter what order the filesystem hands entries back in.
function copySorted(from, to) {
  const names = readdirSync(from).sort();
  mkdirSync(to, { recursive: true });
  for (const name of names) {
    const src = join(from, name);
    const dst = join(to, name);
    if (statSync(src).isDirectory()) copySorted(src, dst);
    else cpSync(src, dst);
  }
}

const appDir = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');
requireDir(appDir, 'app');
requireDir(shotsDir, 'screenshots');

freshDir(outputDir);
copySorted(appDir, join(outputDir, 'app'));
copySorted(shotsDir, join(outputDir, 'screenshots'));

const dossier = buildDossier(outputDir, DOSSIER_LIMITS);
writeFileSync(join(outputDir, 'dossier.json'), dossier);

const appFiles = readdirSync(join(outputDir, 'app')).length;
console.log(`wrote ${outputDir} (${appFiles} app entries, dossier ${dossier.length} bytes)`);
