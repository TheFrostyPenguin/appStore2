export function createButton(label, variant = 'primary') {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.className = variant === 'secondary'
    ? 'inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-200 border border-slate-700 rounded-lg hover:bg-slate-800'
    : 'inline-flex items-center justify-center px-3 py-2 text-sm font-semibold text-white rounded-lg bg-sky-500 hover:bg-sky-400';
  return btn;
}

export function createCard() {
  const card = document.createElement('article');
  card.className = 'rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-sm';
  return card;
}

export function statusPill(text) {
  const span = document.createElement('span');
  span.textContent = text || 'Available';
  span.className = 'text-xs px-2 py-0.5 rounded-full border border-slate-700 text-slate-200';
  return span;
}

export function ratingStars(value) {
  const div = document.createElement('div');
  const rounded = Math.round(value || 0);
  div.textContent = '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
  div.className = 'text-yellow-400 text-sm';
  return div;
}
