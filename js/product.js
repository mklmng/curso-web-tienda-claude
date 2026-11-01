(() => {
'use strict';
// Product detail page: reads ?id= from the URL and renders the matching product safely.
const { loadProducts, createCover, createCard, money, showDataError } = window.NR.ui;
const basket = window.NR.cart;

const root = document.querySelector('#product');
const status = document.querySelector('#status');
const NOTES = {
  'Near Mint': 'Looks and plays like new, with barely any signs of handling.',
  'Very Good': 'Light signs of use. Plays well with minimal surface noise or marks.',
  'Good': 'Visible wear and some noise or marks, but fully playable and complete.',
  'Acceptable': 'Heavy wear. Playable, but best for completists and bargain hunters.'
};
const el = (tag, cls, content) => { const n = document.createElement(tag); if (cls) n.className = cls; if (content !== undefined) n.textContent = content; return n; };
const isFilm = p => p.format === 'DVD' || p.format === 'Blu-ray';

function breadcrumb(p) {
  const nav = el('nav'); nav.setAttribute('aria-label', 'Breadcrumb');
  const ol = el('ol', 'crumbs');
  const items = [['index.html', 'Home'], [isFilm(p) ? 'film.html' : 'music.html', isFilm(p) ? 'Film' : 'Music'], [null, p.title]];
  items.forEach(([href, label]) => {
    const li = el('li');
    if (href) { const a = el('a', '', label); a.href = href; li.append(a); }
    else { li.textContent = label; li.setAttribute('aria-current', 'page'); }
    ol.append(li);
  });
  nav.append(ol);
  return nav;
}

function details(p) {
  const dl = el('dl', 'facts');
  [['Format', p.format], ['Genre', p.genre], ['Year', p.year], [isFilm(p) ? 'Director' : 'Artist', p.artist]].forEach(([k, v]) => {
    const row = el('div'); row.append(el('dt', '', k), el('dd', '', v)); dl.append(row);
  });
  return dl;
}

function render(p, all) {
  document.title = `${p.title} | NEEDLE & REWIND`;
  const wrap = el('div', 'detail');
  const cover = el('div', isFilm(p) ? 'detail__cover detail__cover--film' : 'detail__cover'); cover.append(createCover(p));
  const info = el('div', 'detail__info');
  if (p.badge) info.append(el('p', 'badge', p.badge));
  const h1 = el('h1', 'page-title', p.title);
  const cond = el('div', 'condition');
  cond.append(el('p', '', `Condition: ${p.condition}`), el('p', '', NOTES[p.condition]));
  cond.firstChild.className = 'condition__grade';
  const price = el('p', 'price price--big', money.format(p.price));
  const btn = el('button', 'btn', 'Add to basket'); btn.type = 'button';
  btn.addEventListener('click', () => {
    basket.add(p.id);
    status.textContent = ''; setTimeout(() => (status.textContent = `${p.title} added to your demo basket.`), 50);
  });
  info.append(h1, details(p), cond, el('p', '', p.description), price, btn);
  wrap.append(cover, info);

  const related = all.filter(r => r.id !== p.id)
    .map(r => ({ r, score: (r.format === p.format ? 2 : 0) + (r.genre === p.genre ? 1 : 0) }))
    .sort((a, b) => b.score - a.score || b.r.added.localeCompare(a.r.added)).slice(0, 4).map(x => x.r);
  const sec = el('section', 'related'); sec.setAttribute('aria-labelledby', 'related-title');
  const h2 = el('h2', '', 'You might also dig'); h2.id = 'related-title';
  const ul = el('ul', isFilm(p) ? 'grid grid--film' : 'grid'); ul.append(...related.map(r => createCard(r, q => { basket.add(q.id); status.textContent = ''; setTimeout(() => (status.textContent = `${q.title} added to your demo basket.`), 50); })));
  sec.append(h2, ul);
  root.replaceChildren(breadcrumb(p), wrap, sec);
}

function notFound() {
  document.title = 'Product not found | NEEDLE & REWIND';
  const h1 = el('h1', 'page-title', 'We could not find that copy');
  const p = el('p', '', 'It may have been sold, or the link is wrong. Have a look at what is on the shelf now.');
  const actions = el('p');
  const m = el('a', 'btn', 'Browse music'); m.href = 'music.html';
  const f = el('a', 'btn btn--ghost', 'Browse film'); f.href = 'film.html';
  actions.append(m, ' ', f);
  root.replaceChildren(h1, p, actions);
}

loadProducts().then(all => {
  const id = new URLSearchParams(location.search).get('id');
  const p = all.find(x => x.id === id);
  p ? render(p, all) : notFound();
}).catch(err => { showDataError(err); root.replaceChildren(); });

})();
