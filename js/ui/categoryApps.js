import { getCategoryBySlug, getAppsByCategorySlug, getAppDownloadUrl } from '../api.js';
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

    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.gap = '8px';
    controls.style.alignItems = 'center';
    controls.style.margin = '12px 0';
    main.appendChild(controls);

    const grid = document.createElement('div');
    grid.id = 'apps-grid';
    grid.className = 'app-grid';
    main.appendChild(grid);

    const { data: category } = await getCategoryBySlug(slug);
    title.textContent = category?.name || 'Applications';
    desc.textContent = category?.description || '';

    let currentSortBy = 'name';
    let currentDirection = 'asc';

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

    const searchInput = createSearchInput('Search applications…', value => {
      const q = (value || '').toLowerCase();
      const filtered = allApps.filter(app => `${app.name} ${app.description || ''}`.toLowerCase().includes(q));
      renderApps(filtered);
    });

    controls.appendChild(sortBy);
    controls.appendChild(direction);
    controls.appendChild(searchInput);

    let allApps = [];

    async function loadApps() {
      grid.innerHTML = '<p class="app-note">Loading applications…</p>';
      const { data: apps, error } = await getAppsByCategorySlug(slug, { sortBy: currentSortBy, direction: currentDirection });
      if (error) {
        grid.innerHTML = '<p class="app-note" style="color:#f87171">Failed to load applications.</p>';
        return;
      }
      allApps = apps || [];
      renderApps(allApps);
    }

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
              <button data-app-id="${app.id}" class="btn-install app-btn-secondary" style="padding:8px 12px; font-size:0.85rem;">Install</button>
              <button data-app-id="${app.id}" class="btn-details app-btn-primary" style="padding:8px 12px; font-size:0.85rem;">Details</button>
            </div>
          </div>
        `;
        grid.appendChild(card);
      });
      wireActions();
    }

    function wireActions() {
      grid.querySelectorAll('.btn-details').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.appId;
          if (id) navigateTo(`#/app/${encodeURIComponent(id)}`);
        });
      });
      grid.querySelectorAll('.btn-install').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.appId;
          const app = allApps.find(a => a.id === id);
          const { url, error } = await getAppDownloadUrl(app);
          if (error || !url) {
            alert('No downloadable file is available for this app.');
            return;
          }
          window.location.href = url;
        });
      });
    }

    sortBy.addEventListener('change', async () => {
      currentSortBy = sortBy.value;
      await loadApps();
    });
    direction.addEventListener('change', async () => {
      currentDirection = direction.value;
      await loadApps();
    });

    await loadApps();
  }, { currentRoute: '#/category' });
}
