(() => {
'use strict';
// Demo basket persisted in localStorage (technical storage only; no personal data).
const KEY = 'nr-basket';
const MAX_QTY = 99;
function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(v)
      ? v.filter(i => i && typeof i.id === 'string' && Number.isInteger(i.qty) && i.qty > 0)
        .map(i => ({ ...i, qty: Math.min(i.qty, MAX_QTY) }))
      : [];
  }
  catch { return []; }
}
function write(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage unavailable: basket lasts this visit only */ }
  document.dispatchEvent(new CustomEvent('basket:change'));
}
function add(id) {
  const items = read(), found = items.find(i => i.id === id);
  if (found) found.qty = Math.min(found.qty + 1, MAX_QTY);
  else items.push({ id, qty: 1 });
  write(items);
}
function setQty(id, qty) {
  write(read().map(i => (i.id === id ? { ...i, qty: Math.min(qty, MAX_QTY) } : i)).filter(i => i.qty > 0));
}
window.NR = window.NR || {};
window.NR.cart = { read, add, setQty };
})();
