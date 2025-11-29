export function createButton(label, variant = 'primary') {
  const btn = document.createElement('button');
  btn.textContent = label;
  if (variant === 'secondary') {
    btn.className = 'app-btn-secondary';
  } else if (variant === 'ghost') {
    btn.className = 'app-btn-ghost';
  } else {
    btn.className = 'app-btn-primary';
  }
  return btn;
}

export function createCard() {
  const card = document.createElement('article');
  card.className = 'app-card';
  return card;
}

export function statusPill(text) {
  const span = document.createElement('span');
  span.textContent = text || 'Available';
  span.className = 'app-pill';
  return span;
}

export function ratingStars(value) {
  const div = document.createElement('div');
  const rounded = Math.round(value || 0);
  div.textContent = '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
  div.className = 'app-stars';
  return div;
}
