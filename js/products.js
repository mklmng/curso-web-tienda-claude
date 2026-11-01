(() => {
'use strict';
// Loads product data and builds cards and original SVG covers with safe DOM APIs (no innerHTML).
const NS = 'http://www.w3.org/2000/svg';
const money = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

const REQUIRED = { id: 'string', title: 'string', artist: 'string', format: 'string', genre: 'string', condition: 'string', description: 'string', added: 'string', motif: 'string', price: 'number', year: 'number', palette: 'number' };

// Validates data/data.js before anything is drawn, so a typo shows a clear message instead of a blank page.
function loadProducts() {
  const list = window.NR && window.NR.products;
  if (!Array.isArray(list) || !list.length) {
    return Promise.reject(new Error('No product data found. Check that data/data.js is present and has no syntax errors.'));
  }
  for (const [i, p] of list.entries()) {
    for (const key in REQUIRED) {
      if (typeof (p && p[key]) !== REQUIRED[key]) {
        return Promise.reject(new Error(`Product #${i + 1} (${(p && p.id) || 'no id'}): "${key}" is missing or has the wrong type.`));
      }
    }
  }
  return Promise.resolve(list.slice());
}

// Visible, screen-reader-announced notice at the top of the page when the catalogue cannot load.
function showDataError(err) {
  console.error(err);
  if (document.querySelector('.data-error')) return;
  const box = document.createElement('div');
  box.className = 'data-error';
  box.setAttribute('role', 'alert');
  const title = document.createElement('p');
  const strong = document.createElement('strong');
  strong.textContent = 'Sorry, the shop catalogue could not be loaded.';
  title.append(strong);
  const detail = document.createElement('p');
  detail.textContent = err && err.message ? err.message : 'Unknown error.';
  box.append(title, detail);
  (document.querySelector('main') || document.body).prepend(box);
}

const PALETTES = [
  ['--color-orange', '--color-cream', '--color-charcoal'],
  ['--color-blue', '--color-charcoal', '--color-white'],
  ['--color-olive', '--color-cream', '--color-charcoal'],
  ['--color-charcoal', '--color-orange', '--color-cream'],
  ['--color-cream', '--color-orange', '--color-blue']
];
const svgEl = (name, attrs, parent) => {
  const n = document.createElementNS(NS, name);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.append(n);
  return n;
};
const f = v => `fill:var(${v})`;

function createCover(p) {
  // Music covers are square (like sleeves and jewel cases); film covers are vertical 9:16.
  const film = p.format === 'DVD' || p.format === 'Blu-ray';
  const W = film ? 180 : 200, H = film ? 320 : 200;
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, 'aria-hidden': 'true', focusable: 'false' });
  const [bg, a, b] = PALETTES[p.palette % PALETTES.length];
  svgEl('rect', { width: W, height: H, style: f(bg) }, svg);
  if (p.motif === 'rings') {
    for (let i = 5; i > 0; i--) svgEl('circle', { cx: W / 2, cy: H / 2, r: i * 17, style: f(i % 2 ? a : b) }, svg);
  } else if (p.motif === 'sun') {
    const cy = H * 0.42, r = Math.min(56, H * 0.31);
    svgEl('circle', { cx: W / 2, cy, r, style: f(a) }, svg);
    for (let i = 0; i < 5; i++) svgEl('rect', { x: 0, y: cy + 8 + i * 12, width: W, height: 4 + i * 2, style: f(bg) }, svg);
    svgEl('rect', { x: 0, y: H - 30, width: W, height: 30, style: f(b) }, svg);
  } else if (p.motif === 'stripes') {
    for (let i = 0; i < 8; i++) svgEl('rect', { x: i * (W / 8), width: W / 16, height: H, style: f(i % 2 ? a : b) }, svg);
  } else if (p.motif === 'tri') {
    svgEl('polygon', { points: `${W / 2},${H * 0.12} ${W * 0.85},${H - 20} ${W * 0.15},${H - 20}`, style: f(a) }, svg);
    svgEl('polygon', { points: `${W / 2},${H * 0.4} ${W * 0.65},${H - 20} ${W * 0.35},${H - 20}`, style: f(b) }, svg);
  } else {
    const cols = film ? 3 : 4, pitch = W / cols, rows = Math.floor(H / pitch), y0 = (H - rows * pitch) / 2 + pitch / 2;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++)
      svgEl('circle', { cx: pitch / 2 + i * pitch, cy: y0 + j * pitch, r: (i + j) % 2 ? pitch * 0.16 : pitch * 0.4, style: f((i + j) % 2 ? b : a) }, svg);
  }
  return svg;
}

const text = (tag, cls, content) => { const n = document.createElement(tag); if (cls) n.className = cls; n.textContent = content; return n; };

function link(p) {
  const h = document.createElement('h3');
  h.className = 'card__title';
  const a = document.createElement('a');
  a.href = `product.html?id=${encodeURIComponent(p.id)}`;
  a.textContent = p.title;
  h.append(a);
  return h;
}

function createCard(p, onAdd) {
  const isFilm = p.format === 'DVD' || p.format === 'Blu-ray';
  const li = document.createElement('li');
  const card = document.createElement('article');
  card.className = 'card';
  const cover = document.createElement('div');
  cover.className = 'card__cover';
  cover.append(createCover(p));
  const body = document.createElement('div');
  body.className = 'card__body';
  if (p.badge) cover.append(text('p', 'badge badge--overlay', p.badge));
  cover.append(text('p', 'chip chip--overlay', `Condition: ${p.condition}`)); // text label, not colour alone // status is text, never colour alone
  body.append(
    link(p),
    text('p', 'card__meta', `${isFilm ? 'Directed by' : 'By'} ${p.artist}`),
    text('p', 'card__meta', `${p.format}, ${p.genre}, ${p.year}`)
  );
  const foot = document.createElement('div');
  foot.className = 'card__foot';
  const btn = text('button', 'btn', 'Add to basket');
  btn.type = 'button';
  btn.setAttribute('aria-label', `Add ${p.title} to basket`);
  btn.addEventListener('click', () => onAdd(p));
  foot.append(text('span', 'price', money.format(p.price)), btn);
  body.append(foot);
  card.append(cover, body);
  li.append(card);
  return li;
}
window.NR = window.NR || {};
window.NR.ui = { money, loadProducts, createCover, createCard, showDataError };
})();
