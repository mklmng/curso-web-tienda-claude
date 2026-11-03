(() => {
'use strict';
const {
  loadProducts,
  createCard,
  isMusic,
  addToBasket,
  money,
  showDataError
} = window.NR.ui;
const basket = window.NR.cart;

const $ = (s, r = document) => r.querySelector(s);
let products = [];
const status = $('#status');

/* Mobile navigation: hidden only when JS runs, so the menu always works without it. */
const nav = $('#site-nav'), menuBtn = $('#menu-btn');
const setNav = open => { menuBtn.setAttribute('aria-expanded', String(open)); nav.hidden = !open; };
setNav(false);
menuBtn.addEventListener('click', () => setNav(menuBtn.getAttribute('aria-expanded') !== 'true'));
nav.addEventListener('click', e => { if (e.target.closest('a')) setNav(false); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && menuBtn.getAttribute('aria-expanded') === 'true') { setNav(false); menuBtn.focus(); }
});

/* Home: two rows of new arrivals, one per cover proportion (square music, vertical film) */
const rowMusic = $('#row-music'), rowFilm = $('#row-film');
/* Carousel: arrows scroll one "page" (the visible columns) at a time; swipe, keyboard and the scrollbar still work. */
function initCarousel(root) {
  const scroller = root.querySelector('.row-scroll'), list = root.querySelector('.row');
  const prev = root.querySelector('.arrow--prev'), next = root.querySelector('.arrow--next');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const update = () => {
    const max = scroller.scrollWidth - scroller.clientWidth;
    prev.hidden = next.hidden = max <= 1;
    prev.setAttribute('aria-disabled', String(scroller.scrollLeft <= 1));
    next.setAttribute('aria-disabled', String(scroller.scrollLeft >= max - 1));
  };
  const go = dir => {
    const items = list.children;
    if (items.length < 2) return;
    const cols = parseInt(getComputedStyle(root).getPropertyValue('--cols'), 10) || 2;
    const step = (items[1].offsetLeft - items[0].offsetLeft) * cols;
    scroller.scrollBy({ left: dir * step, behavior: reduce.matches ? 'auto' : 'smooth' });
  };
  [[prev, -1], [next, 1]].forEach(([btn, dir]) => btn.addEventListener('click', () => {
    if (btn.getAttribute('aria-disabled') !== 'true') go(dir); // aria-disabled keeps keyboard focus on the button
  }));
  scroller.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
}

function renderRows() {
  const latest = music => products
    .filter(product => isMusic(product) === music)
    .sort((a, b) => b.added.localeCompare(a.added))
    .slice(0, 12);
  rowMusic.replaceChildren(...latest(true).map(p => createCard(p, add)));
  rowFilm.replaceChildren(...latest(false).map(p => createCard(p, add)));
  document.querySelectorAll('.carousel').forEach(initCarousel);
}
function add(product) { addToBasket(product, basket, status); }

/* Basket dialog */
const basketDialog = $('#basket');
const basketList = $('#basket-list');
const basketSubtotal = $('#basket-subtotal');
const basketCount = $('#basket-count');
function createQuantityButton(product, quantity, label, delta) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.setAttribute('aria-label', `${delta < 0 ? 'Remove one' : 'Add one'} ${product.title}`);
  button.dataset.id = product.id;
  button.dataset.delta = delta;
  button.addEventListener('click', () => {
    basket.setQty(product.id, quantity + delta);
    renderBasket({ id: product.id, delta });
  });
  return button;
}

function createBasketLine({ product, quantity }) {
  const item = document.createElement('li');
  const name = document.createElement('span');
  name.textContent = `${product.title} (${money.format(product.price)})`;

  const controls = document.createElement('div');
  controls.className = 'qty';
  const quantityLabel = document.createElement('span');
  quantityLabel.textContent = quantity;
  quantityLabel.setAttribute('aria-label', `Quantity ${quantity}`);
  controls.append(
    createQuantityButton(product, quantity, '−', -1),
    quantityLabel,
    createQuantityButton(product, quantity, '+', 1)
  );
  item.append(name, controls);
  return item;
}

function renderBasket(focusTarget) {
  const lines = basket.read()
    .map(item => ({
      product: products.find(product => product.id === item.id),
      quantity: item.qty
    }))
    .filter(line => line.product);
  const itemCount = lines.reduce((total, line) => total + line.quantity, 0);
  const total = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);

  basketCount.textContent = itemCount;
  basketList.replaceChildren(...lines.map(createBasketLine));
  basketSubtotal.textContent = lines.length
    ? `Subtotal: ${money.format(total)}`
    : 'Your basket is empty. Add something from the crates.';

  if (focusTarget) {
    const button = [...basketList.querySelectorAll('button')].find(candidate =>
      candidate.dataset.id === focusTarget.id
      && candidate.dataset.delta === String(focusTarget.delta)
    );
    (button || $('#basket-close')).focus();
  }
}
$('#basket-open').hidden = false;
$('#basket-open').addEventListener('click', () => { renderBasket(); basketDialog.showModal(); });
$('#basket-close').addEventListener('click', () => basketDialog.close());
document.addEventListener('basket:change', () => renderBasket());

/* Newsletter: client-side validation only, nothing is sent */
const form = $('#newsletter'), email = $('#email'), msg = $('#newsletter-msg');
form?.addEventListener('submit', e => {
  e.preventDefault();
  const ok = email.value.trim() !== '' && email.validity.valid;
  email.setAttribute('aria-invalid', String(!ok));
  msg.textContent = ok
    ? 'Demo only: nothing was sent or stored. This form is not connected to any mailing list.'
    : 'Enter a valid email address, for example name@example.com.';
});

loadProducts()
  .then(data => {
    products = data;
    if (rowMusic) renderRows();
    renderBasket();
  })
  .catch(showDataError);

})();
