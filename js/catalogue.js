(() => {
'use strict';
// Catalogue pages: search, format/genre filters and sorting, all client-side.
const { loadProducts, createCard, showDataError } = window.NR.ui;
const basket = window.NR.cart;

const $ = s => document.querySelector(s);
const formats = document.body.dataset.formats.split(',');
const [grid, count, form, q, cat, genre, sort, status] = ['#grid', '#count', '#filters', '#q', '#category', '#genre', '#sort', '#status'].map($);
const SORTS = {
  new: (a, b) => b.added.localeCompare(a.added),
  low: (a, b) => a.price - b.price,
  high: (a, b) => b.price - a.price
};
let all = [];

const option = (value, label) => Object.assign(document.createElement('option'), { value, textContent: label });

function render() {
  const term = q.value.trim().toLowerCase();
  const list = all
    .filter(p => (cat.value === 'all' || p.format === cat.value)
      && (genre.value === 'all' || p.genre === genre.value)
      && (!term || `${p.title} ${p.artist} ${p.genre}`.toLowerCase().includes(term)))
    .sort(SORTS[sort.value]);
  grid.replaceChildren(...list.map(p => createCard(p, add)));
  if (!list.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    const msg = document.createElement('p');
    msg.textContent = 'No copies match your search. Try a different word or clear the filters.';
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'btn'; btn.textContent = 'Clear filters';
    btn.addEventListener('click', () => { form.reset(); render(); q.focus(); });
    li.append(msg, btn);
    grid.append(li);
  }
  count.textContent = `${list.length} ${list.length === 1 ? 'item' : 'items'} found`;
}

function add(p) {
  basket.add(p.id);
  status.textContent = '';
  setTimeout(() => (status.textContent = `${p.title} added to your demo basket.`), 50);
}

loadProducts().then(data => {
  all = data.filter(p => formats.includes(p.format));
  cat.append(option('all', 'All formats'), ...formats.map(f => option(f, f)));
  genre.append(option('all', 'All genres'), ...[...new Set(all.map(p => p.genre))].sort().map(g => option(g, g)));
  const wanted = new URLSearchParams(location.search).get('format');
  if (formats.includes(wanted)) cat.value = wanted;
  render();
}).catch(err => { showDataError(err); count.textContent = ''; });

form.addEventListener('submit', e => e.preventDefault());
form.addEventListener('input', render);

})();
