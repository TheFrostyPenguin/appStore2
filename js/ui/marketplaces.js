import { getAllCategories } from '../api.js';
import { renderAppShell } from './layout.js';
import { createCard } from './components.js';
import { navigateTo } from '../router.js';

export async function renderMarketplacesPage() {
  await renderAppShell(async main => {
    const heading = document.createElement('div');
    const title = document.createElement('h2');
    title.className = 'app-section-title';
    title.textContent = 'Marketplaces';
    const subtitle = document.createElement('p');
    subtitle.className = 'app-section-subtitle';
    subtitle.textContent = 'Browse available catalogs and launch experiences.';
    heading.appendChild(title);
    heading.appendChild(subtitle);
    main.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'app-grid';
    main.appendChild(grid);

    const { data: categories, error } = await getAllCategories();
    if (error) {
      grid.innerHTML = '<p class="app-note" style="color:#f87171">Failed to load categories.</p>';
      return;
    }
    if (!categories || categories.length === 0) {
      grid.innerHTML = '<p class="app-note">No marketplaces yet.</p>';
      return;
    }

    categories.forEach(cat => {
      const card = createCard();
      card.classList.add('app-card');
      card.innerHTML = `
        <div class="app-card-header">
          <div class="app-avatar">${(cat.name || '?')[0]}</div>
        </div>
        <h3 class="app-card-title">${cat.name}</h3>
        <p class="app-card-subtitle">${cat.description || ''}</p>
      `;
      card.addEventListener('click', () => navigateTo(`#/category/${encodeURIComponent(cat.slug)}`));
      grid.appendChild(card);
    });
  }, { currentRoute: '#/marketplaces' });
}
