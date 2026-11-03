# NEEDLE & REWIND (fictional demo shop)

Static, responsive website for an invented independent second-hand music and film shop in Islington, London.
HTML5, CSS3 (custom properties, Grid, Flexbox) and vanilla JavaScript (classic scripts). No frameworks, no backend, no cookies. The only third-party request is Google Fonts.
All shop details are fictional. Visual inspiration only: independent record shops such as Flashback Records and Fopp; no brand assets are used.

## Run locally
Just double-click `index.html`. No server is needed: scripts are classic (non-module) and the catalogue is a plain script (`data/data.js`).
A local server also works, e.g. `python3 -m http.server 8000`.

## Structure
    index.html  music.html  film.html  product.html  about.html  visit.html  privacidad.html
    css/variables.css   design tokens (colours, fonts, sizes)
    css/main.css        base, layout and components
    js/*.js             classic scripts, loaded with defer; they share data through window.NR
    js/main.js          menu, basket dialog, newsletter demo, home carousels
    js/catalogue.js     search, filters and sorting (music.html, film.html)
    js/product.js       product detail from ?id=
    js/products.js      catalogue validation, shared UI helpers, product cards and SVG covers
    js/cart.js          basket in localStorage
    data/data.js        the catalogue (24 items)
    robots.txt  sitemap.xml

## Edit or add products
Edit `data/data.js` (keep the commas and quotes valid). Each product needs: `id` (unique), `title`, `artist` (director for films), `format` (Vinyl, CD, DVD or Blu-ray),
`genre`, `year`, `condition` (Near Mint, Very Good, Good, Acceptable), `price` (GBP), `added` (YYYY-MM-DD), `badge` ("", "New arrival", "Staff pick" or "Rare find"),
`description`, `palette` (0-4) and `motif` (rings, sun, stripes, tri, dots). The catalogue validates required fields, unique IDs and supported values before rendering. Music covers are square (1:1), film covers are vertical (9:16). The product page, catalogue filters and cover art update automatically. When adding or removing products, update the corresponding `product.html?id=...` URLs in `sitemap.xml` too.

## Colours and typography
Colours and sizes live in `css/variables.css`. Fonts (Space Grotesk and DM Sans) are loaded from Google Fonts by the three `<link>` tags in each page's `<head>`; to change fonts, edit those links and `--font-display` / `--font-body`. Without a connection, system fonts are used.
Privacy note: Google receives the visitor's IP address when fonts load. For a real EU business, ask for consent first or self-host the fonts.

## If the catalogue does not load
A visible notice appears at the top of the page. It names the first problem found in `data/data.js` (missing file, syntax error, or a product with a missing field). Details are also in the browser console (F12).

## Header, footer and basket dialog
They are repeated in each HTML file (no build step). When you change the menu, update every page.

## Deploy
- GitHub Pages: push to a repository, then Settings > Pages > deploy from the main branch (root).
- Netlify / Cloudflare Pages: connect the repository, no build command, publish directory `/`.
Afterwards replace `YOUR-USERNAME.github.io/needle-and-rewind` in `robots.txt` and `sitemap.xml` with the real address.

## Privacy and legal (Spain)
The site sets no cookies. The only third-party request is Google Fonts (see `privacidad.html`). The basket uses localStorage only as technical storage. The newsletter form is not connected.
`privacidad.html` is a template, not legal advice. For a real business, add the owner's details (LSSI-CE art. 10) and review the texts with a professional.

## Known limitations
- Basket only: no checkout or payments. The newsletter is a visual demo.
- Product pages are built in the browser from `?id=`, so each product has the same page title in the HTML source.
- No real photography: covers and the map are original SVG illustrations.

## Quality checks still to run in a browser
axe DevTools, Lighthouse (targets: performance 90+, accessibility 95+, best practices 95+, SEO 90+), keyboard-only walkthrough, and widths 320, 375, 430, 768, 1024, 1440 and 1920 px.
