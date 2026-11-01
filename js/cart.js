(() => {
'use strict';
// Demo basket persisted in localStorage (technical storage only; no personal data).
const KEY = 'nr-basket';
function read() {
  try { const v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v.filter(i => i && typeof i.id === 'string' && Number.isInteger(i.qty) && i.qty > 0 && i.qty < 100) : []; }
  catch { return []; }
}
function write(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage unavailable: basket lasts this visit only */ }
  document.dispatchEvent(new CustomEvent('basket:change'));
}
function add(id) {
  const items = read(), found = items.find(i => i.id === id);
  found ? found.qty++ : items.push({ id, qty: 1 });
  write(items);
}
function setQty(id, qty) {
  write(read().map(i => (i.id === id ? { ...i, qty } : i)).filter(i => i.qty > 0));
}
window.NR = window.NR || {};
window.NR.cart = { read, add, setQty };
})();
