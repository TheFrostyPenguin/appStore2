import { getAllCategories } from '../api.js';
import { renderShell } from './layout.js';
import { createCard } from './components.js';
import { navigateTo } from '../router.js';

export async function renderMarketplacesPage() {
  await renderShell(async main => {
    const heading = document.createElement('div');
    heading.innerHTML = `<p class="text-sm text-slate-400">Marketplaces</p><h2 class="text-2xl font-semibold text-white">Browse catalogs</h2>`;
    main.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'grid gap-4 md:grid-cols-3';
    main.appendChild(grid);

    const { data: categories, error } = await getAllCategories();
    if (error) {
      grid.innerHTML = '<p class="text-red-500 text-sm">Failed to load categories.</p>';
      return;
    }
    if (!categories || categories.length === 0) {
      grid.innerHTML = '<p class="text-slate-400 text-sm">No marketplaces yet.</p>';
      return;
    }

    categories.forEach(cat => {
      const card = createCard();
      card.classList.add('cursor-pointer', 'hover:border-sky-500/60');
      card.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-300 font-semibold">${(cat.name || '?')[0]}</div>
          <div>
            <h3 class="text-lg font-semibold text-white">${cat.name}</h3>
            <p class="text-sm text-slate-400">${cat.description || ''}</p>
          </div>
        </div>
      `;
      card.addEventListener('click', () => navigateTo(`#/category/${encodeURIComponent(cat.slug)}`));
      grid.appendChild(card);
    });
  });
}
