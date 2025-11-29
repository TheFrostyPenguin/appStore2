import { getCategoryBySlug, getAppsByCategorySlug } from '../api.js';
import { renderAppShell } from './layout.js';
import { createCard, statusPill } from './components.js';
import { createSearchInput } from './search.js';
import { navigateTo } from '../router.js';

export async function renderCategoryAppsPage(slug) {
  await renderAppShell(async main => {
    const header = document.createElement('div');
    const title = document.createElement('h2');
    title.id = 'category-title';
    title.className = 'app-section-title';
    const desc = document.createElement('p');
    desc.id = 'category-description';
    desc.className = 'app-section-subtitle';
    header.appendChild(title);
    header.appendChild(desc);
    main.appendChild(header);

    const searchWrap = document.createElement('div');
    main.appendChild(searchWrap);

    const grid = document.createElement('div');
    grid.id = 'apps-grid';
    grid.className = 'app-grid';
    main.appendChild(grid);

    const { data: category } = await getCategoryBySlug(slug);
    title.textContent = category?.name || 'Applications';
    desc.textContent = category?.description || '';

    const { data: apps, error } = await getAppsByCategorySlug(slug);
    let allApps = apps || [];
    if (error) {
      grid.innerHTML = '<p class="app-note" style="color:#f87171">Failed to load applications.</p>';
      return;
    }

    const searchInput = createSearchInput('Search applications…', value => {
      const q = (value || '').toLowerCase();
      const filtered = allApps.filter(app => `${app.name} ${app.description || ''}`.toLowerCase().includes(q));
      renderApps(filtered);
    });
    searchWrap.appendChild(searchInput);

    function renderApps(list) {
      grid.innerHTML = '';
      if (!list || list.length === 0) {
        grid.innerHTML = '<p class="app-note">No applications in this category yet.</p>';
        return;
      }
      list.forEach(app => {
        const card = createCard();
        card.innerHTML = `
          <div style="display:flex; gap:12px; align-items:flex-start;">
            <div class="app-avatar" style="width:44px;height:44px;border-radius:12px;">${
              app.image
                ? `<img src="${app.image}" alt="${app.name} icon" style="width:44px;height:44px;border-radius:12px;object-fit:cover;" />`
                : `${(app.name || '?')[0]}`
            }</div>
            <div style="flex:1;">
              <h3 class="app-card-title">${app.name}</h3>
              <p class="app-subtext">${app.description || ''}</p>
            </div>
          </div>
          <div class="app-flex-between" style="padding-top:8px;">
            ${statusPill(app.status || 'Available').outerHTML}
            <div style="display:flex; gap:8px;">
              <button class="app-btn-secondary" style="padding:8px 12px; font-size:0.85rem;">Install</button>
              <button data-app-id="${app.id}" class="btn-details app-btn-primary" style="padding:8px 12px; font-size:0.85rem;">Details</button>
            </div>
          </div>
        `;
        grid.appendChild(card);
      });
      wireDetails();
    }

    function wireDetails() {
      grid.querySelectorAll('.btn-details').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.appId;
          if (id) navigateTo(`#/app/${encodeURIComponent(id)}`);
        });
      });
    }

    renderApps(allApps);
  }, { currentRoute: '#/category' });
}
