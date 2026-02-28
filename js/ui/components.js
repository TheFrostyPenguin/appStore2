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


export function confirmDanger({ title, message, confirmText = 'Delete', cancelText = 'Cancel' }) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 z-50 bg-black/60 p-4 flex items-center justify-center';

    const card = document.createElement('div');
    card.className = 'w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl space-y-4';
    card.innerHTML = `
      <div>
        <h3 class="text-lg font-semibold text-white">${title || 'Are you sure?'}</h3>
        <p class="text-sm text-slate-300 mt-2">${message || 'This cannot be undone.'}</p>
      </div>
      <div class="flex justify-end gap-2">
        <button type="button" class="confirm-cancel app-btn-secondary">${cancelText}</button>
        <button type="button" class="confirm-delete px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold">${confirmText}</button>
      </div>
    `;

    const close = value => {
      document.removeEventListener('keydown', onEsc);
      overlay.remove();
      resolve(value);
    };

    const onEsc = event => {
      if (event.key === 'Escape') close(false);
    };

    overlay.addEventListener('click', event => {
      if (event.target === overlay) close(false);
    });

    card.querySelector('.confirm-cancel')?.addEventListener('click', () => close(false));
    card.querySelector('.confirm-delete')?.addEventListener('click', () => close(true));

    document.addEventListener('keydown', onEsc);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  });
}
