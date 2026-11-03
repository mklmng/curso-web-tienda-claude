(() => {
'use strict';
// Loads product data and builds cards and original SVG covers with safe DOM APIs (no innerHTML).
const NS = 'http://www.w3.org/2000/svg';
const money = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });

const REQUIRED_FIELDS = {
  id: 'string',
  title: 'string',
  artist: 'string',
  format: 'string',
  genre: 'string',
  condition: 'string',
  description: 'string',
  added: 'string',
  badge: 'string',
  motif: 'string',
  price: 'number',
  year: 'number',
  palette: 'number'
};
const FILM_FORMATS = new Set(['DVD', 'Blu-ray']);
const MUSIC_FORMATS = new Set(['Vinyl', 'CD']);
const CONDITIONS = new Set(['Near Mint', 'Very Good', 'Good', 'Acceptable']);
const BADGES = new Set(['', 'New arrival', 'Staff pick', 'Rare find']);
const MOTIFS = new Set(['rings', 'sun', 'stripes', 'tri', 'dots']);
const pendingAnnouncements = new WeakMap();

function isFilm(product) {
  return FILM_FORMATS.has(product.format);
}

function isMusic(product) {
  return MUSIC_FORMATS.has(product.format);
}

function createTextElement(tag, className = '', content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) element.textContent = content;
  return element;
}

function announceStatus(element, message) {
  const pending = pendingAnnouncements.get(element);
  if (pending) clearTimeout(pending);

  element.textContent = '';
  const timer = setTimeout(() => {
    element.textContent = message;
    pendingAnnouncements.delete(element);
  }, 50);
  pendingAnnouncements.set(element, timer);
}

function addToBasket(product, basket, status) {
  basket.add(product.id);
  announceStatus(status, `${product.title} added to your demo basket.`);
}

function validationError(product, index, seenIds) {
  const label = `Product #${index + 1} (${(product && product.id) || 'no id'})`;

  for (const [field, type] of Object.entries(REQUIRED_FIELDS)) {
    if (typeof (product && product[field]) !== type) {
      return new Error(`${label}: "${field}" is missing or has the wrong type.`);
    }
  }

  if (!product.id.trim() || seenIds.has(product.id)) {
    return new Error(`${label}: "id" must be non-empty and unique.`);
  }
  if (!product.title.trim() || !product.artist.trim() || !product.genre.trim() || !product.description.trim()) {
    return new Error(`${label}: title, artist, genre and description must not be empty.`);
  }
  if (!MUSIC_FORMATS.has(product.format) && !FILM_FORMATS.has(product.format)) {
    return new Error(`${label}: "${product.format}" is not a supported format.`);
  }
  if (!CONDITIONS.has(product.condition)) {
    return new Error(`${label}: "${product.condition}" is not a supported condition.`);
  }
  if (!BADGES.has(product.badge)) {
    return new Error(`${label}: "${product.badge}" is not a supported badge.`);
  }
  if (!MOTIFS.has(product.motif)) {
    return new Error(`${label}: "${product.motif}" is not a supported cover motif.`);
  }
  if (!Number.isFinite(product.price) || product.price < 0) {
    return new Error(`${label}: "price" must be a non-negative number.`);
  }
  if (!Number.isInteger(product.year) || product.year < 1) {
    return new Error(`${label}: "year" must be a positive integer.`);
  }
  if (!Number.isInteger(product.palette) || product.palette < 0 || product.palette >= PALETTES.length) {
    return new Error(`${label}: "palette" must be an integer from 0 to ${PALETTES.length - 1}.`);
  }

  const addedDate = new Date(`${product.added}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(product.added)
    || Number.isNaN(addedDate.getTime())
    || addedDate.toISOString().slice(0, 10) !== product.added) {
    return new Error(`${label}: "added" must be a valid date in YYYY-MM-DD format.`);
  }

  seenIds.add(product.id);
  return null;
}

// Validates the catalogue before anything is drawn, so invalid data gets a clear error.
function loadProducts() {
  const list = window.NR && window.NR.products;
  if (!Array.isArray(list) || !list.length) {
    return Promise.reject(new Error('No product data found. Check that data/data.js is present and has no syntax errors.'));
  }

  const seenIds = new Set();
  for (const [index, product] of list.entries()) {
    const error = validationError(product, index, seenIds);
    if (error) return Promise.reject(error);
  }

  return Promise.resolve(list.slice());
}

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
  const element = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
  if (parent) parent.append(element);
  return element;
};
const fill = color => `fill:var(${color})`;

function createCover(product) {
  // Music covers are square (like sleeves and jewel cases); film covers are vertical 9:16.
  const film = isFilm(product);
  const width = film ? 180 : 200;
  const height = film ? 320 : 200;
  const svg = svgEl('svg', { viewBox: `0 0 ${width} ${height}`, 'aria-hidden': 'true', focusable: 'false' });
  const [background, foreground, accent] = PALETTES[product.palette];
  svgEl('rect', { width, height, style: fill(background) }, svg);

  if (product.motif === 'rings') {
    for (let index = 5; index > 0; index--) {
      svgEl('circle', {
        cx: width / 2,
        cy: height / 2,
        r: index * 17,
        style: fill(index % 2 ? foreground : accent)
      }, svg);
    }
  } else if (product.motif === 'sun') {
    const centerY = height * 0.42;
    const radius = Math.min(56, height * 0.31);
    svgEl('circle', { cx: width / 2, cy: centerY, r: radius, style: fill(foreground) }, svg);
    for (let index = 0; index < 5; index++) {
      svgEl('rect', {
        x: 0,
        y: centerY + 8 + index * 12,
        width,
        height: 4 + index * 2,
        style: fill(background)
      }, svg);
    }
    svgEl('rect', { x: 0, y: height - 30, width, height: 30, style: fill(accent) }, svg);
  } else if (product.motif === 'stripes') {
    for (let index = 0; index < 8; index++) {
      svgEl('rect', {
        x: index * (width / 8),
        width: width / 16,
        height,
        style: fill(index % 2 ? foreground : accent)
      }, svg);
    }
  } else if (product.motif === 'tri') {
    svgEl('polygon', {
      points: `${width / 2},${height * 0.12} ${width * 0.85},${height - 20} ${width * 0.15},${height - 20}`,
      style: fill(foreground)
    }, svg);
    svgEl('polygon', {
      points: `${width / 2},${height * 0.4} ${width * 0.65},${height - 20} ${width * 0.35},${height - 20}`,
      style: fill(accent)
    }, svg);
  } else {
    const columns = film ? 3 : 4;
    const pitch = width / columns;
    const rows = Math.floor(height / pitch);
    const firstCenterY = (height - rows * pitch) / 2 + pitch / 2;
    for (let column = 0; column < columns; column++) {
      for (let row = 0; row < rows; row++) {
        const alternate = (column + row) % 2;
        svgEl('circle', {
          cx: pitch / 2 + column * pitch,
          cy: firstCenterY + row * pitch,
          r: alternate ? pitch * 0.16 : pitch * 0.4,
          style: fill(alternate ? accent : foreground)
        }, svg);
      }
    }
  }
  return svg;
}

function createProductLink(product) {
  const heading = document.createElement('h3');
  heading.className = 'card__title';
  const a = document.createElement('a');
  a.href = `product.html?id=${encodeURIComponent(product.id)}`;
  a.textContent = product.title;
  heading.append(a);
  return heading;
}

function createCard(product, onAdd) {
  const film = isFilm(product);
  const li = document.createElement('li');
  const card = document.createElement('article');
  card.className = 'card';
  const cover = document.createElement('div');
  cover.className = 'card__cover';
  cover.append(createCover(product));
  const body = document.createElement('div');
  body.className = 'card__body';
  if (product.badge) cover.append(createTextElement('p', 'badge badge--overlay', product.badge));
  cover.append(createTextElement('p', 'chip chip--overlay', `Condition: ${product.condition}`));
  body.append(
    createProductLink(product),
    createTextElement('p', 'card__meta', `${film ? 'Directed by' : 'By'} ${product.artist}`),
    createTextElement('p', 'card__meta', `${product.format}, ${product.genre}, ${product.year}`)
  );
  const foot = document.createElement('div');
  foot.className = 'card__foot';
  const btn = createTextElement('button', 'btn', 'Add to basket');
  btn.type = 'button';
  btn.setAttribute('aria-label', `Add ${product.title} to basket`);
  btn.addEventListener('click', () => onAdd(product));
  foot.append(createTextElement('span', 'price', money.format(product.price)), btn);
  body.append(foot);
  card.append(cover, body);
  li.append(card);
  return li;
}
window.NR = window.NR || {};
window.NR.ui = {
  money,
  loadProducts,
  createCover,
  createCard,
  createTextElement,
  isFilm,
  isMusic,
  announceStatus,
  addToBasket,
  showDataError
};
})();
