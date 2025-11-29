import { getCategoryBySlug, getAppsByCategorySlug } from '../api.js';
import { renderShell } from './layout.js';
import { createCard, statusPill } from './components.js';
import { createSearchInput } from './search.js';
import { navigateTo } from '../router.js';

export async function renderCategoryAppsPage(slug) {
  await renderShell(async main => {
    const header = document.createElement('div');
    header.className = 'space-y-1';
    const title = document.createElement('h2');
    title.id = 'category-title';
    title.className = 'text-2xl font-semibold text-white';
    const desc = document.createElement('p');
    desc.id = 'category-description';
    desc.className = 'text-sm text-slate-400';
    header.appendChild(title);
    header.appendChild(desc);
    main.appendChild(header);

    const searchWrap = document.createElement('div');
    searchWrap.className = 'mt-4';
    main.appendChild(searchWrap);

    const grid = document.createElement('div');
    grid.id = 'apps-grid';
    grid.className = 'grid gap-4 md:grid-cols-3';
    main.appendChild(grid);

    const { data: category } = await getCategoryBySlug(slug);
    title.textContent = category?.name || 'Applications';
    desc.textContent = category?.description || '';

    const { data: apps, error } = await getAppsByCategorySlug(slug);
    let allApps = apps || [];
    if (error) {
      grid.innerHTML = '<p class="text-red-500 text-sm">Failed to load applications.</p>';
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
        grid.innerHTML = '<p class="text-slate-400 text-sm">No applications in this category yet.</p>';
        return;
      }
      list.forEach(app => {
        const card = createCard();
        card.innerHTML = `
          <div class="flex items-start gap-3">
            <div class="h-10 w-10 rounded-xl bg-slate-800 overflow-hidden flex items-center justify-center">${
              app.image
                ? `<img src="${app.image}" alt="${app.name} icon" class="h-10 w-10 object-cover" />`
                : `<span class="text-sm text-slate-300 font-semibold">${(app.name || '?')[0]}</span>`
            }</div>
            <div class="flex-1">
              <h3 class="text-sm font-semibold text-white">${app.name}</h3>
              <p class="text-xs text-slate-400 mt-1 line-clamp-3">${app.description || ''}</p>
            </div>
          </div>
          <div class="flex items-center justify-between pt-2">
            ${statusPill(app.status || 'Available').outerHTML}
            <div class="flex gap-2">
              <button class="text-xs px-2 py-1 rounded-md bg-sky-500/90 hover:bg-sky-400 text-white font-medium">Install</button>
              <button data-app-id="${app.id}" class="btn-details text-xs px-2 py-1 rounded-md border border-slate-700 text-slate-200 hover:bg-slate-800">Details</button>
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
  });
}
