// Vice Cover Studio — the cover renderer. Pure canvas drawing, no network:
// given the photos and the editor state it paints one poster at any size.
// Layouts, grades and lettering are all original; no Rockstar art, logo or font.

export const SIZES = {
  '1080x1080': { w: 1080, h: 1080, label: '1080 × 1080' },
  '1080x1350': { w: 1080, h: 1350, label: '1080 × 1350' },
  '1920x1080': { w: 1920, h: 1080, label: '1920 × 1080' },
};

export const LAYOUTS = {
  full: { name: 'Full bleed', panels: 1 },
  split: { name: 'Split · 2', panels: 2 },
  hero: { name: 'Hero + 2', panels: 3 },
  grid: { name: 'Grid · 4', panels: 4 },
};

// Panel rectangles as fractions of the cover [x, y, w, h], before gutters.
export function layoutRects(layout, w, h) {
  const wide = w >= h;
  if (layout === 'full') return [[0, 0, 1, 1]];
  if (layout === 'split') {
    return wide ? [[0, 0, 0.5, 1], [0.5, 0, 0.5, 1]] : [[0, 0, 1, 0.5], [0, 0.5, 1, 0.5]];
  }
  if (layout === 'hero') {
    return wide
      ? [[0, 0, 0.62, 1], [0.62, 0, 0.38, 0.5], [0.62, 0.5, 0.38, 0.5]]
      : [[0, 0, 1, 0.62], [0, 0.62, 0.5, 0.38], [0.5, 0.62, 0.5, 0.38]];
  }
  // grid: 2 x 2
  return [[0, 0, 0.5, 0.5], [0.5, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]];
}

export const GRADES = {
  sunset: {
    name: 'Sunset',
    wash: [[0, '#ff2e88'], [0.55, '#ff7a3d'], [1, '#ffd23d']],
    washAlpha: 0.34,
    tint: '#ff8a3d',
    tintAlpha: 0.16,
  },
  neon: {
    name: 'Neon',
    wash: [[0, '#ff2e88'], [0.5, '#7a2eff'], [1, '#2ee6c8']],
    washAlpha: 0.38,
    tint: '#b537f2',
    tintAlpha: 0.14,
  },
  vice: {
    name: 'Vice pink',
    wash: [[0, '#ff7ad9'], [0.55, '#ff2e88'], [1, '#ff9a3d']],
    washAlpha: 0.36,
    tint: '#ff2e88',
    tintAlpha: 0.15,
  },
  noir: {
    name: 'Noir',
    wash: [[0, '#ffffff'], [1, '#0a0a0a']],
    washAlpha: 0.12,
    tint: '#888888',
    tintAlpha: 0.1,
  },
};

export const TITLE_STYLES = {
  sunset: { fill: ['#ffffff', '#ffd23d', '#ff7a3d'], stroke: '#1a0b2e' },
  neon: { fill: ['#ffffff', '#ff7ad9', '#ff2e88'], stroke: '#12041f' },
  white: { fill: ['#ffffff', '#ffffff', '#f4eefc'], stroke: '#111111' },
};

function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Draws one photo to cover a rectangle, with the panel's zoom and pan offsets.
// ox/oy are fractions of the rectangle; zoom is a multiplier (1 = fit exactly).
function drawPhotoCover(ctx, img, rx, ry, rw, rh, zoom, ox, oy, noir) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(rw / iw, rh / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = rx + (rw - dw) / 2 + ox * rw;
  const dy = ry + (rh - dh) / 2 + oy * rh;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rx, ry, rw, rh);
  ctx.clip();
  if (noir) ctx.filter = 'grayscale(1) contrast(1.12) brightness(1.04)';
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startPx, family, weight = '') {
  let px = startPx;
  ctx.font = `${weight} ${px}px ${family}`;
  while (px > 24 && ctx.measureText(text).width > maxWidth) {
    px = Math.floor(px * 0.92);
    ctx.font = `${weight} ${px}px ${family}`;
  }
  return px;
}

function drawTitleBlock(ctx, state, w, h) {
  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();
  const atTop = state.titlePos === 'top';
  const bandH = h * 0.2;
  const bandY = atTop ? 0 : h - bandH;

  // Scrim so the lettering reads over any photo.
  const scrim = ctx.createLinearGradient(0, bandY, 0, atTop ? bandY + bandH : bandY + bandH);
  if (atTop) {
    scrim.addColorStop(0, 'rgba(5,2,12,0.82)');
    scrim.addColorStop(1, 'rgba(5,2,12,0)');
  } else {
    scrim.addColorStop(0, 'rgba(5,2,12,0)');
    scrim.addColorStop(1, 'rgba(5,2,12,0.82)');
  }
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandY, w, bandH);

  const margin = w * 0.045;
  const maxW = w - margin * 2;
  const style = TITLE_STYLES[state.titleStyle] || TITLE_STYLES.sunset;
  const centerY = atTop ? bandY + bandH * 0.52 : bandY + bandH * 0.46;

  if (title) {
    const px = fitFont(ctx, title, maxW, Math.round(h * 0.115), '"Bebas Neue", sans-serif');
    const grad = ctx.createLinearGradient(0, centerY - px * 0.55, 0, centerY + px * 0.45);
    grad.addColorStop(0, style.fill[0]);
    grad.addColorStop(0.55, style.fill[1]);
    grad.addColorStop(1, style.fill[2]);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(2, px * 0.07);
    ctx.strokeStyle = style.stroke;
    ctx.strokeText(title, w / 2, centerY);
    ctx.fillStyle = grad;
    ctx.fillText(title, w / 2, centerY);
  }

  if (subtitle) {
    const subPx = fitFont(ctx, subtitle, maxW, Math.round(h * 0.038), '"Pacifico", cursive');
    const subY = atTop ? centerY + h * 0.075 : centerY + h * 0.075;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${subPx}px "Pacifico", cursive`;
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = Math.round(h * 0.012);
    ctx.fillStyle = '#ffd7ef';
    ctx.fillText(subtitle, w / 2, subY);
    ctx.shadowBlur = 0;
  }
}

function drawGrain(ctx, w, h, seedText) {
  const rand = mulberry32(hashSeed(seedText));
  const dots = Math.floor((w * h) / 2600);
  ctx.save();
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < dots; i++) {
    const v = rand() > 0.5 ? 255 : 0;
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(rand() * w, rand() * h, 1.4, 1.4);
  }
  ctx.restore();
}

function drawVignette(ctx, w, h) {
  const r = Math.hypot(w, h) / 2;
  const g = ctx.createRadialGradient(w / 2, h / 2, r * 0.45, w / 2, h / 2, r);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(5,2,12,0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

// Paints the whole cover. `photos` is an array of images (or null) aligned with
// the layout's panels; `state` carries layout, grade, title, subtitle and flags.
export function drawCover(ctx, photos, state, w, h) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#05030a';
  ctx.fillRect(0, 0, w, h);

  const grade = GRADES[state.grade] || GRADES.sunset;
  const noir = state.grade === 'noir';
  const rects = layoutRects(state.layout, w, h);
  const gutter = Math.max(3, Math.round(Math.min(w, h) * 0.007));

  rects.forEach(([fx, fy, fw, fh], i) => {
    const rx = fx * w + (fx > 0 ? gutter / 2 : 0);
    const ry = fy * h + (fy > 0 ? gutter / 2 : 0);
    const rw = fw * w - (fx > 0 ? gutter / 2 : 0) - (fx + fw < 1 ? gutter / 2 : 0);
    const rh = fh * h - (fy > 0 ? gutter / 2 : 0) - (fy + fh < 1 ? gutter / 2 : 0);
    const panel = state.panels[i] || { zoom: 1, ox: 0, oy: 0 };
    const img = photos[i];
    if (img) {
      drawPhotoCover(ctx, img, rx, ry, rw, rh, panel.zoom, panel.ox, panel.oy, noir);
    } else {
      // Empty panel: a dark placeholder with a thin neon frame.
      ctx.fillStyle = '#120a1e';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeStyle = 'rgba(255,46,136,0.5)';
      ctx.lineWidth = Math.max(1, gutter / 2);
      ctx.strokeRect(rx + 1, ry + 1, rw - 2, rh - 2);
    }
  });

  // Sunset / neon colour grade over the whole poster.
  const wash = ctx.createLinearGradient(0, 0, w * 0.25, h);
  grade.wash.forEach(([stop, color]) => wash.addColorStop(stop, color));
  ctx.save();
  ctx.globalAlpha = grade.washAlpha;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = grade.tintAlpha;
  ctx.fillStyle = grade.tint;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  drawTitleBlock(ctx, state, w, h);
  if (state.grain) drawGrain(ctx, w, h, `${state.title}|${state.layout}|${state.grade}`);
  if (state.vignette) drawVignette(ctx, w, h);
}

// Renders the cover at an export size onto a fresh canvas and returns it.
export function renderCoverCanvas(photos, state, sizeKey) {
  const size = SIZES[sizeKey] || SIZES['1080x1080'];
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas.getContext('2d'), photos, state, size.w, size.h);
  return canvas;
}
