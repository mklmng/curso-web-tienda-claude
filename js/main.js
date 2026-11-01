(() => {
'use strict';
const { loadProducts, createCard, money, showDataError } = window.NR.ui;
const basket = window.NR.cart;

const $ = (s, r = document) => r.querySelector(s);
let products = [];
const status = $('#status');
const announce = msg => { status.textContent = ''; setTimeout(() => (status.textContent = msg), 50); };

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
const MUSIC = ['Vinyl', 'CD'];
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
  const latest = isMusic => products
    .filter(p => MUSIC.includes(p.format) === isMusic)
    .sort((a, b) => b.added.localeCompare(a.added))
    .slice(0, 12);
  rowMusic.replaceChildren(...latest(true).map(p => createCard(p, add)));
  rowFilm.replaceChildren(...latest(false).map(p => createCard(p, add)));
  document.querySelectorAll('.carousel').forEach(initCarousel);
}
function add(p) { basket.add(p.id); announce(`${p.title} added to your demo basket.`); }

/* Basket dialog */
const dlg = $('#basket'), list = $('#basket-list'), subtotal = $('#basket-subtotal'), badge = $('#basket-count');
function renderBasket(focus) {
  const lines = basket.read().map(i => ({ ...i, p: products.find(p => p.id === i.id) })).filter(l => l.p);
  badge.textContent = lines.reduce((n, l) => n + l.qty, 0);
  list.replaceChildren(...lines.map(({ p, qty }) => {
    const li = document.createElement('li');
    const name = document.createElement('span'); name.textContent = `${p.title} (${money.format(p.price)})`;
    const q = document.createElement('div'); q.className = 'qty';
    const mk = (label, aria, delta) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.setAttribute('aria-label', `${aria} ${p.title}`); b.dataset.id = p.id; b.dataset.d = delta; b.addEventListener('click', () => { basket.setQty(p.id, qty + delta); renderBasket({ id: p.id, d: delta }); }); return b; };
    const n = document.createElement('span'); n.textContent = qty; n.setAttribute('aria-label', `Quantity ${qty}`);
    q.append(mk('−', 'Remove one', -1), n, mk('+', 'Add one', 1));
    li.append(name, q);
    return li;
  }));
  subtotal.textContent = lines.length ? `Subtotal: ${money.format(lines.reduce((s, l) => s + l.p.price * l.qty, 0))}` : 'Your basket is empty. Add something from the crates.';
  if (focus) (list.querySelector(`[data-id="${focus.id}"][data-d="${focus.d}"]`) || $('#basket-close')).focus();
}
$('#basket-open').hidden = false;
$('#basket-open').addEventListener('click', () => { renderBasket(); dlg.showModal(); });
$('#basket-close').addEventListener('click', () => dlg.close());
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

loadProducts().then(data => { products = data; if (rowMusic) renderRows(); renderBasket(); })
  
  .catch(err => showDataError(err));

})();
