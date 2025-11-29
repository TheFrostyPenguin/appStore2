import { getMarketplaces } from '../api.js';
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

    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '8px';
    controls.style.alignItems = 'center';
    controls.style.marginBottom = '12px';

    const sortBy = document.createElement('select');
    sortBy.className = 'app-select';
    sortBy.innerHTML = `
      <option value="name">Name</option>
      <option value="updated_at">Last Updated</option>
    `;

    const direction = document.createElement('select');
    direction.className = 'app-select';
    direction.innerHTML = `
      <option value="asc">A → Z / Oldest</option>
      <option value="desc">Z → A / Newest</option>
    `;

    controls.appendChild(sortBy);
    controls.appendChild(direction);
    main.appendChild(controls);

    const grid = document.createElement('div');
    grid.className = 'app-grid';
    main.appendChild(grid);

    let currentSortBy = 'name';
    let currentDirection = 'asc';

    async function loadAndRender() {
      const { data: categories, error } = await getMarketplaces({ sortBy: currentSortBy, direction: currentDirection });
      if (error) {
        grid.innerHTML = '<p class="app-note" style="color:#f87171">Failed to load categories.</p>';
        return;
      }
      if (!categories || categories.length === 0) {
        grid.innerHTML = '<p class="app-note">No marketplaces yet.</p>';
        return;
      }

      grid.innerHTML = '';
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
    }

    sortBy.addEventListener('change', async () => {
      currentSortBy = sortBy.value;
      await loadAndRender();
    });
    direction.addEventListener('change', async () => {
      currentDirection = direction.value;
      await loadAndRender();
    });

    await loadAndRender();
  }, { currentRoute: '#/marketplaces' });
}
