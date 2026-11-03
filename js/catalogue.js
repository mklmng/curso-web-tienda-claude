(() => {
'use strict';
// Catalogue pages: search, format/genre filters and sorting, all client-side.
const { loadProducts, createCard, addToBasket, showDataError } = window.NR.ui;
const basket = window.NR.cart;

const $ = s => document.querySelector(s);
const formats = document.body.dataset.formats.split(',').map(format => format.trim());
const grid = $('#grid');
const count = $('#count');
const form = $('#filters');
const searchInput = $('#q');
const categoryFilter = $('#category');
const genreFilter = $('#genre');
const sortControl = $('#sort');
const status = $('#status');
const SORTS = {
  new: (a, b) => b.added.localeCompare(a.added),
  low: (a, b) => a.price - b.price,
  high: (a, b) => b.price - a.price
};
let products = [];

const option = (value, label) => Object.assign(document.createElement('option'), { value, textContent: label });

function render() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const matchingProducts = products
    .filter(product => (categoryFilter.value === 'all' || product.format === categoryFilter.value)
      && (genreFilter.value === 'all' || product.genre === genreFilter.value)
      && (!searchTerm || `${product.title} ${product.artist} ${product.genre}`.toLowerCase().includes(searchTerm)))
    .sort(SORTS[sortControl.value]);
  grid.replaceChildren(...matchingProducts.map(product => createCard(product, add)));
  if (!matchingProducts.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    const msg = document.createElement('p');
    msg.textContent = 'No copies match your search. Try a different word or clear the filters.';
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'btn'; btn.textContent = 'Clear filters';
    btn.addEventListener('click', () => { form.reset(); render(); searchInput.focus(); });
    li.append(msg, btn);
    grid.append(li);
  }
  count.textContent = `${matchingProducts.length} ${matchingProducts.length === 1 ? 'item' : 'items'} found`;
}

function add(product) { addToBasket(product, basket, status); }

loadProducts().then(data => {
  products = data.filter(product => formats.includes(product.format));
  categoryFilter.append(option('all', 'All formats'), ...formats.map(format => option(format, format)));
  genreFilter.append(option('all', 'All genres'), ...[...new Set(products.map(product => product.genre))].sort().map(value => option(value, value)));
  const wanted = new URLSearchParams(location.search).get('format');
  if (formats.includes(wanted)) categoryFilter.value = wanted;
  render();
}).catch(err => { showDataError(err); count.textContent = ''; });

form.addEventListener('submit', e => e.preventDefault());
form.addEventListener('input', render);

})();
