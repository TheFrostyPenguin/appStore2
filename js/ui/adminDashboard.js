import { getAllCategories, getAllApps } from '../api.js';
import { renderAppShell } from './layout.js';
import { createCard } from './components.js';
import { navigateTo } from '../router.js';

export async function renderAdminDashboardPage() {
  await renderAppShell(async main => {
    const heading = document.createElement('div');
    const title = document.createElement('h2');
    title.className = 'app-section-title';
    title.textContent = 'Admin Control Panel';
    const subtitle = document.createElement('p');
    subtitle.className = 'app-section-subtitle';
    subtitle.textContent = 'Manage marketplaces, applications, and releases.';
    heading.appendChild(title);
    heading.appendChild(subtitle);
    main.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'app-grid';
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
        <div class="app-card-header">
          <p class="app-subtext">${cardInfo.title}</p>
          <h3 class="app-card-title" style="font-size:1.8rem;">${cardInfo.count}</h3>
        </div>
        <div class="app-flex-between" style="padding-top:8px;">
          <button class="app-btn-secondary">View All</button>
          <button class="app-btn-primary">Add New</button>
        </div>
      `;
      const [viewBtn, addBtn] = card.querySelectorAll('button');
      viewBtn.addEventListener('click', cardInfo.onView);
      addBtn.addEventListener('click', cardInfo.onAdd);
      grid.appendChild(card);
    });
  }, { currentRoute: '#/admin' });
}
