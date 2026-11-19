// Fixed scenes for screenshots: ?shot=cover shows the exported cover alone,
// ?shot=editor shows the editor with a sample photo loaded. The scenes are the
// app's own drawing at the size the shot asks for — never an edited image.
// window.__shotReady is set once the scene has painted.
import { SIZES, drawCover } from './render.js';

function paintWhenReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}

function photoByName(library, name) {
  const found = library.findIndex((entry) => entry.name.toLowerCase() === name.toLowerCase());
  return found >= 0 ? found : 0;
}

export async function runShot(shot, query, api) {
  const { state, library, redraw } = api;

  if (query.get('title')) state.title = query.get('title');
  if (query.get('subtitle')) state.subtitle = query.get('subtitle');
  if (query.get('layout')) state.layout = query.get('layout');
  if (query.get('grade')) state.grade = query.get('grade');
  if (query.get('titlepos')) state.titlePos = query.get('titlepos');
  if (query.get('titlestyle')) state.titleStyle = query.get('titlestyle');

  // Panel photos: `photos=boulevard,pier,boulevard,pier` by sample name.
  const photos = (query.get('photos') || '').split(',').filter(Boolean);
  photos.forEach((name, i) => {
    if (state.panels[i]) state.panels[i].photo = photoByName(library, name);
  });

  if (shot === 'cover') {
    const sizeKey = query.get('size') || '1920x1080';
    const size = SIZES[sizeKey];
    document.body.classList.add('shot-cover');
    const canvas = document.getElementById('cover');
    canvas.width = size.w;
    canvas.height = size.h;
    const imgs = state.panels.map((p) => (library[p.photo] ? library[p.photo].img : null));
    drawCover(canvas.getContext('2d'), imgs, state, size.w, size.h);
    paintWhenReady();
    return;
  }

  // editor: the normal page, with the requested scene already loaded.
  redraw();
  paintWhenReady();
}
