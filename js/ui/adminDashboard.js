import { getAllCategories, getAllApps } from '../api.js';
import { renderShell } from './layout.js';
import { createCard, createButton } from './components.js';
import { navigateTo } from '../router.js';

export async function renderAdminDashboardPage() {
  await renderShell(async main => {
    const heading = document.createElement('div');
    heading.innerHTML = `<p class="text-sm text-slate-400">Admin</p><h2 class="text-2xl font-semibold text-white">Control Panel</h2>`;
    main.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'grid gap-4 md:grid-cols-3';
    main.appendChild(grid);

    const [categories, apps] = await Promise.all([getAllCategories(), getAllApps()]);

    const cards = [
      {
        title: 'Marketplaces',
        count: categories.data?.length ?? 0,
        onAdd: () => navigateTo('#/admin/marketplaces/new'),
        onView: () => navigateTo('#/admin/marketplaces')
      },
      {
        title: 'Applications',
        count: apps.data?.length ?? 0,
        onAdd: () => navigateTo('#/admin/apps/new'),
        onView: () => navigateTo('#/admin/apps')
      }
    ];

    cards.forEach(cardInfo => {
      const card = createCard();
      card.innerHTML = `
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-slate-400">${cardInfo.title}</p>
            <h3 class="text-3xl font-bold text-white">${cardInfo.count}</h3>
          </div>
        </div>
        <div class="flex items-center gap-2 pt-4">
          <button class="px-3 py-1.5 rounded-lg border border-slate-700 text-sm text-slate-200 hover:bg-slate-800">View All</button>
          <button class="px-3 py-1.5 rounded-lg bg-sky-500 text-sm font-semibold text-white hover:bg-sky-400">Add New</button>
        </div>
      `;
      const [viewBtn, addBtn] = card.querySelectorAll('button');
      viewBtn.addEventListener('click', cardInfo.onView);
      addBtn.addEventListener('click', cardInfo.onAdd);
      grid.appendChild(card);
    });
  });
}
