// Vice Cover Studio — editor wiring: photos, panels, caption, grade and export.
// The drawing itself lives in render.js; this file only owns the state and the
// controls. Photos are read on the user's machine and never leave it.
import { SIZES, LAYOUTS, GRADES, layoutRects, drawCover, renderCoverCanvas } from './render.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const ctx = canvas.getContext('2d');

const SAMPLES = [
  { name: 'Boulevard', url: 'samples/boulevard.jpg' },
  { name: 'Pier', url: 'samples/pier.jpg' },
];

// The photo library: samples first, then anything the user uploads.
const library = [];
// One slot per panel the widest layout needs; a layout only shows its own.
const state = {
  layout: 'hero',
  grade: 'sunset',
  size: '1080x1080',
  title: 'VICE NIGHTS',
  subtitle: 'a story in four panels',
  titlePos: 'bottom',
  titleStyle: 'sunset',
  grain: true,
  vignette: true,
  selected: 0,
  panels: [
    { photo: 0, zoom: 1, ox: 0, oy: 0 },
    { photo: 1, zoom: 1, ox: 0, oy: 0 },
    { photo: 0, zoom: 1, ox: 0, oy: 0 },
    { photo: 1, zoom: 1, ox: 0, oy: 0 },
  ],
};

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

async function addToLibrary(name, url) {
  const img = await loadImage(url);
  library.push({ name, url, img });
  return library.length - 1;
}

function panelPhotos() {
  return state.panels.map((p) => (library[p.photo] ? library[p.photo].img : null));
}

function activePanelCount() {
  return LAYOUTS[state.layout].panels;
}

function redraw() {
  const size = SIZES[state.size];
  if (canvas.width !== size.w || canvas.height !== size.h) {
    canvas.width = size.w;
    canvas.height = size.h;
  }
  drawCover(ctx, panelPhotos(), state, size.w, size.h);
}

// ---- photo slots list -------------------------------------------------------

function refreshSlots() {
  const list = $('photo-slots');
  list.innerHTML = '';
  library.forEach((entry, i) => {
    const row = document.createElement('div');
    row.className = 'slot';
    const thumb = document.createElement('img');
    thumb.src = entry.url;
    thumb.alt = '';
    const name = document.createElement('span');
    name.className = 'slot-name';
    name.textContent = entry.name;
    const use = document.createElement('button');
    use.type = 'button';
    use.textContent = 'Use';
    use.title = `Put ${entry.name} in the selected panel`;
    use.addEventListener('click', () => {
      state.panels[state.selected].photo = i;
      refreshPanelControls();
      redraw();
    });
    row.append(thumb, name, use);
    if (i > 1) {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.title = `Remove ${entry.name}`;
      remove.addEventListener('click', () => {
        library.splice(i, 1);
        state.panels.forEach((p) => {
          if (p.photo === i) p.photo = 0;
          else if (p.photo > i) p.photo -= 1;
        });
        refreshSlots();
        refreshPanelControls();
        redraw();
      });
      row.append(remove);
    }
    list.append(row);
  });
  $('photo-count').textContent = `(${library.length} loaded)`;
}

// ---- selected-panel controls ----------------------------------------------

function refreshPanelControls() {
  const select = $('panel-photo');
  select.innerHTML = '';
  library.forEach((entry, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = entry.name;
    select.append(opt);
  });
  const panel = state.panels[state.selected];
  select.value = String(panel.photo);
  $('zoom').value = String(Math.round(panel.zoom * 100));
  $('zoom-out').textContent = `${Math.round(panel.zoom * 100)}%`;
  $('panel-name').textContent = `— panel ${state.selected + 1} of ${activePanelCount()}`;
}

function selectPanel(i) {
  state.selected = Math.min(i, activePanelCount() - 1);
  refreshPanelControls();
}

// ---- canvas pointer: drag to pan, wheel to zoom, click to select -----------

function panelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * canvas.width;
  const y = ((clientY - rect.top) / rect.height) * canvas.height;
  const rects = layoutRects(state.layout, canvas.width, canvas.height);
  for (let i = 0; i < rects.length; i++) {
    const [fx, fy, fw, fh] = rects[i];
    if (x >= fx * canvas.width && x < (fx + fw) * canvas.width &&
        y >= fy * canvas.height && y < (fy + fh) * canvas.height) {
      return { index: i, x, y, rect: [fx * canvas.width, fy * canvas.height, fw * canvas.width, fh * canvas.height] };
    }
  }
  return null;
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const hit = panelAt(e.clientX, e.clientY);
  if (!hit) return;
  selectPanel(hit.index);
  drag = { panel: hit.index, startX: e.clientX, startY: e.clientY, ox: state.panels[hit.index].ox, oy: state.panels[hit.index].oy, moved: false };
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const dx = (e.clientX - drag.startX) / rect.width;
  const dy = (e.clientY - drag.startY) / rect.height;
  if (Math.abs(dx) + Math.abs(dy) > 0.002) drag.moved = true;
  const panel = state.panels[drag.panel];
  const [, , rw, rh] = layoutRects(state.layout, canvas.width, canvas.height)[drag.panel];
  panel.ox = Math.max(-1, Math.min(1, drag.ox + (dx * canvas.width) / rw));
  panel.oy = Math.max(-1, Math.min(1, drag.oy + (dy * canvas.height) / rh));
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = state.panels[state.selected];
  panel.zoom = Math.max(1, Math.min(3, panel.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
  refreshPanelControls();
  redraw();
}, { passive: false });

// ---- controls --------------------------------------------------------------

document.querySelectorAll('.layout-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.layout = btn.dataset.layout;
    document.querySelectorAll('.layout-btn').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    selectPanel(state.selected);
    redraw();
  });
});

document.querySelectorAll('.grade-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.grade = btn.dataset.grade;
    document.querySelectorAll('.grade-btn').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    redraw();
  });
});

document.querySelectorAll('.sample-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const idx = library.findIndex((entry) => entry.url === btn.dataset.sample);
    if (idx >= 0) {
      state.panels[state.selected].photo = idx;
      refreshPanelControls();
      redraw();
    }
  });
});

$('upload').addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    try {
      const url = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const idx = await addToLibrary(file.name, url);
      state.panels[state.selected].photo = idx;
    } catch {
      $('status').textContent = `Could not read ${file.name}.`;
    }
  }
  e.target.value = '';
  refreshSlots();
  refreshPanelControls();
  redraw();
});

$('panel-photo').addEventListener('change', (e) => {
  state.panels[state.selected].photo = Number(e.target.value);
  redraw();
});

$('zoom').addEventListener('input', (e) => {
  state.panels[state.selected].zoom = Number(e.target.value) / 100;
  $('zoom-out').textContent = `${e.target.value}%`;
  redraw();
});

$('pan-reset').addEventListener('click', () => {
  const panel = state.panels[state.selected];
  panel.ox = 0;
  panel.oy = 0;
  panel.zoom = 1;
  refreshPanelControls();
  redraw();
});

$('fill-all').addEventListener('click', () => {
  const photo = state.panels[state.selected].photo;
  state.panels.forEach((p) => { p.photo = photo; });
  refreshPanelControls();
  redraw();
});

$('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
$('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
$('title-pos').addEventListener('change', (e) => { state.titlePos = e.target.value; redraw(); });
$('title-style').addEventListener('change', (e) => { state.titleStyle = e.target.value; redraw(); });
$('grain').addEventListener('change', (e) => { state.grain = e.target.checked; redraw(); });
$('vignette').addEventListener('change', (e) => { state.vignette = e.target.checked; redraw(); });

$('size').addEventListener('change', (e) => {
  state.size = e.target.value;
  redraw();
});

// ---- export ----------------------------------------------------------------

function downloadPNG(sizeKey) {
  const size = SIZES[sizeKey];
  const out = renderCoverCanvas(panelPhotos(), state, sizeKey);
  out.toBlob((blob) => {
    if (!blob) {
      $('status').textContent = 'Export failed in this browser.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    $('status').textContent = `Saved vice-cover-${size.w}x${size.h}.png`;
  }, 'image/png');
}

$('export').addEventListener('click', () => downloadPNG(state.size));
document.querySelectorAll('.export-size').forEach((btn) => {
  btn.addEventListener('click', () => downloadPNG(btn.dataset.export));
});

// ---- boot ------------------------------------------------------------------

const params = new URLSearchParams(location.search);
const shot = params.get('shot');

async function boot() {
  for (const sample of SAMPLES) {
    try { await addToLibrary(sample.name, sample.url); } catch { /* sample missing: keep going */ }
  }
  // Lettering fonts must be ready before the first paint, or the title falls
  // back to a system font.
  try {
    await Promise.all([
      document.fonts.load('100px "Bebas Neue"'),
      document.fonts.load('40px "Pacifico"'),
    ]);
  } catch { /* fonts are local files; a failure still leaves a working app */ }
  refreshSlots();
  refreshPanelControls();
  if (shot) {
    await runShot(shot, params, { state, library, redraw, downloadPNG });
  } else {
    redraw();
  }
}

boot();
