(() => {
'use strict';
// Product detail page: reads ?id= from the URL and renders the matching product safely.
const {
  loadProducts,
  createCover,
  createCard,
  createTextElement,
  isFilm,
  addToBasket,
  money,
  showDataError
} = window.NR.ui;
const basket = window.NR.cart;

const root = document.querySelector('#product');
const status = document.querySelector('#status');
const NOTES = {
  'Near Mint': 'Looks and plays like new, with barely any signs of handling.',
  'Very Good': 'Light signs of use. Plays well with minimal surface noise or marks.',
  'Good': 'Visible wear and some noise or marks, but fully playable and complete.',
  'Acceptable': 'Heavy wear. Playable, but best for completists and bargain hunters.'
};

function breadcrumb(product) {
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', 'Breadcrumb');

  const list = createTextElement('ol', 'crumbs');
  const categoryLink = isFilm(product) ? 'film.html' : 'music.html';
  const categoryName = isFilm(product) ? 'Film' : 'Music';
  const items = [['index.html', 'Home'], [categoryLink, categoryName], [null, product.title]];

  items.forEach(([href, label]) => {
    const item = document.createElement('li');
    if (href) {
      const link = createTextElement('a', '', label);
      link.href = href;
      item.append(link);
    } else {
      item.textContent = label;
      item.setAttribute('aria-current', 'page');
    }
    list.append(item);
  });

  nav.append(list);
  return nav;
}

function details(product) {
  const list = createTextElement('dl', 'facts');
  const rows = [
    ['Format', product.format],
    ['Genre', product.genre],
    ['Year', product.year],
    [isFilm(product) ? 'Director' : 'Artist', product.artist]
  ];

  rows.forEach(([label, value]) => {
    const row = document.createElement('div');
    row.append(
      createTextElement('dt', '', label),
      createTextElement('dd', '', value)
    );
    list.append(row);
  });
  return list;
}

function createCondition(product) {
  const condition = createTextElement('div', 'condition');
  condition.append(
    createTextElement('p', 'condition__grade', `Condition: ${product.condition}`),
    createTextElement('p', '', NOTES[product.condition])
  );
  return condition;
}

function addProduct(product) {
  addToBasket(product, basket, status);
}

function relatedProducts(product, allProducts) {
  return allProducts
    .filter(candidate => candidate.id !== product.id)
    .map(candidate => ({
      product: candidate,
      score: (candidate.format === product.format ? 2 : 0)
        + (candidate.genre === product.genre ? 1 : 0)
    }))
    .sort((a, b) => b.score - a.score || b.product.added.localeCompare(a.product.added))
    .slice(0, 4)
    .map(item => item.product);
}

function renderRelated(product, allProducts) {
  const section = document.createElement('section');
  section.className = 'related';
  section.setAttribute('aria-labelledby', 'related-title');

  const heading = createTextElement('h2', '', 'You might also dig');
  heading.id = 'related-title';

  const list = createTextElement('ul', isFilm(product) ? 'grid grid--film' : 'grid');
  list.append(...relatedProducts(product, allProducts).map(item => createCard(item, addProduct)));
  section.append(heading, list);
  return section;
}

function render(product, allProducts) {
  document.title = `${product.title} | NEEDLE & REWIND`;

  const detail = createTextElement('div', 'detail');
  const coverClass = isFilm(product) ? 'detail__cover detail__cover--film' : 'detail__cover';
  const cover = createTextElement('div', coverClass);
  cover.append(createCover(product));

  const info = createTextElement('div', 'detail__info');
  if (product.badge) info.append(createTextElement('p', 'badge', product.badge));
  info.append(
    createTextElement('h1', 'page-title', product.title),
    details(product),
    createCondition(product),
    createTextElement('p', '', product.description),
    createTextElement('p', 'price price--big', money.format(product.price))
  );

  const addButton = createTextElement('button', 'btn', 'Add to basket');
  addButton.type = 'button';
  addButton.addEventListener('click', () => addProduct(product));
  info.append(addButton);

  detail.append(cover, info);
  root.replaceChildren(breadcrumb(product), detail, renderRelated(product, allProducts));
}

function notFound() {
  document.title = 'Product not found | NEEDLE & REWIND';

  const heading = createTextElement('h1', 'page-title', 'We could not find that copy');
  const message = createTextElement('p', '', 'It may have been sold, or the link is wrong. Have a look at what is on the shelf now.');
  const actions = document.createElement('p');

  const musicLink = createTextElement('a', 'btn', 'Browse music');
  musicLink.href = 'music.html';
  const filmLink = createTextElement('a', 'btn btn--ghost', 'Browse film');
  filmLink.href = 'film.html';

  actions.append(musicLink, ' ', filmLink);
  root.replaceChildren(heading, message, actions);
}

loadProducts().then(allProducts => {
  const id = new URLSearchParams(location.search).get('id');
  const product = allProducts.find(item => item.id === id);
  if (product) render(product, allProducts);
  else notFound();
}).catch(err => {
  showDataError(err);
  root.replaceChildren();
});

})();
