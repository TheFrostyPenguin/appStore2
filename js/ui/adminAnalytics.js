import {
  getAllAppsForAnalytics,
  getRatingsForAnalytics,
  getCategoriesMap,
  getAverageRatingsMap
} from '../api.js';
import { renderAppShell } from './layout.js';
import { createCard } from './components.js';

const chartInstances = [];

function destroyCharts() {
  while (chartInstances.length) {
    const chart = chartInstances.pop();
    if (chart && typeof chart.destroy === 'function') chart.destroy();
  }
}

function renderBarChart(canvasId, labels, data, title, color = '#38bdf8') {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return;
  const ctx = canvas.getContext('2d');
  const chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: title,
          data,
          backgroundColor: color,
          borderRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: false }
      },
      scales: {
        x: { ticks: { color: '#e2e8f0' }, grid: { color: '#1f2937' } },
        y: { ticks: { color: '#e2e8f0' }, grid: { color: '#1f2937' } }
      }
    }
  });

  chartInstances.push(chart);
}

function buildTopList(apps, key, limit = 5) {
  return [...(apps || [])]
    .sort((a, b) => (b[key] || 0) - (a[key] || 0))
    .slice(0, limit)
    .filter(a => (a[key] || 0) > 0);
}

function formatDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString();
  } catch (e) {
    return value;
  }
}

function buildFilters(categoriesMap) {
  const container = document.createElement('div');
  container.className = 'bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg space-y-3';

  const title = document.createElement('div');
  title.className = 'text-sm font-semibold text-slate-200 uppercase tracking-wide';
  title.textContent = 'Filters';
  container.appendChild(title);

  const row = document.createElement('div');
  row.className = 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4';

  const category = document.createElement('select');
  category.className = 'bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500';
  category.innerHTML = '<option value="all">All Marketplaces</option>';
  Object.entries(categoriesMap).forEach(([slug, name]) => {
    const opt = document.createElement('option');
    opt.value = slug;
    opt.textContent = name;
    category.appendChild(opt);
  });

  const sort = document.createElement('select');
  sort.className = category.className;
  sort.innerHTML = `
    <option value="name-asc">Name (A–Z)</option>
    <option value="name-desc">Name (Z–A)</option>
    <option value="downloads-desc">Downloads (High → Low)</option>
    <option value="downloads-asc">Downloads (Low → High)</option>
    <option value="rating-desc">Rating (High → Low)</option>
    <option value="rating-asc">Rating (Low → High)</option>
    <option value="newest">Newest</option>
    <option value="oldest">Oldest</option>
  `;

  const minRating = document.createElement('select');
  minRating.className = category.className;
  minRating.innerHTML = `
    <option value="0">All ratings</option>
    <option value="1">1+ stars</option>
    <option value="2">2+ stars</option>
    <option value="3">3+ stars</option>
    <option value="4">4+ stars</option>
  `;

  const minDownloads = document.createElement('select');
  minDownloads.className = category.className;
  minDownloads.innerHTML = `
    <option value="0">All downloads</option>
    <option value="10">10+</option>
    <option value="100">100+</option>
    <option value="1000">1000+</option>
  `;

  const inputs = [
    { label: 'Marketplace', el: category },
    { label: 'Sort by', el: sort },
    { label: 'Min rating', el: minRating },
    { label: 'Min downloads', el: minDownloads }
  ];

  inputs.forEach(block => {
    const wrapper = document.createElement('label');
    wrapper.className = 'space-y-1 text-sm text-slate-300';
    wrapper.innerHTML = `<div class="text-slate-400">${block.label}</div>`;
    wrapper.appendChild(block.el);
    row.appendChild(wrapper);
  });

  container.appendChild(row);

  return { container, controls: { category, sort, minRating, minDownloads } };
}

function renderExplorerTable(container, apps) {
  container.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg';

  const table = document.createElement('table');
  table.className = 'min-w-full text-sm text-slate-200';
  table.innerHTML = `
    <thead class="text-xs uppercase text-slate-400">
      <tr>
        <th class="px-3 py-2 text-left">App</th>
        <th class="px-3 py-2 text-left">Category</th>
        <th class="px-3 py-2 text-left">Downloads</th>
        <th class="px-3 py-2 text-left">Avg. Rating</th>
        <th class="px-3 py-2 text-left">Ratings</th>
        <th class="px-3 py-2 text-left">Created</th>
        <th class="px-3 py-2 text-left">Updated</th>
      </tr>
    </thead>
    <tbody id="analytics-table-body" class="divide-y divide-slate-800"></tbody>
  `;

  card.appendChild(table);
  container.appendChild(card);

  const body = table.querySelector('#analytics-table-body');
  if (!apps || !apps.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 7;
    cell.className = 'px-3 py-4 text-slate-400';
    cell.textContent = 'No applications match the current filters.';
    row.appendChild(cell);
    body.appendChild(row);
    return;
  }

  apps.forEach(app => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-slate-800/60 transition-colors';
    row.innerHTML = `
      <td class="px-3 py-3">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-sm font-semibold text-slate-200">
            ${app.image ? `<img src="${app.image}" alt="${app.name} icon" class="h-10 w-10 rounded-xl object-cover" />` :
              (app.name || '?')[0]}
          </div>
          <div>
            <div class="font-medium text-slate-100">${app.name}</div>
            <div class="text-xs text-slate-500">Version ${app.version || '—'}</div>
          </div>
        </div>
      </td>
      <td class="px-3 py-3 text-slate-300">${app.categoryName || 'Uncategorized'}</td>
      <td class="px-3 py-3">${app.downloadCount ?? 0}</td>
      <td class="px-3 py-3">${(app.avgRating || 0).toFixed(1)}</td>
      <td class="px-3 py-3 text-slate-400">${app.ratingCount || 0}</td>
      <td class="px-3 py-3 text-slate-400">${formatDate(app.createdAt)}</td>
      <td class="px-3 py-3 text-slate-400">${formatDate(app.updatedAt)}</td>
    `;
    body.appendChild(row);
  });
}

export async function renderAdminAnalytics() {
  await renderAppShell(async main => {
    destroyCharts();
    main.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className =
      'min-h-[calc(100vh-5rem)] px-4 py-6 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 space-y-6';

    const header = document.createElement('div');
    header.className = 'space-y-2';
    header.innerHTML = `
      <p class="text-slate-400 text-sm">Insights</p>
      <h2 class="text-3xl font-semibold tracking-tight">Analytics</h2>
      <p class="text-slate-400">Monitor app performance and marketplace activity.</p>
    `;
    wrapper.appendChild(header);

    const tabBar = document.createElement('div');
    tabBar.className = 'bg-slate-900/80 border border-slate-800 rounded-2xl p-2 flex gap-2 w-full shadow-lg';
    const tabs = [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'explorer', label: 'Explorer' }
    ];
    let currentTab = 'dashboard';

    const content = document.createElement('div');
    content.className = 'space-y-6';

    tabs.forEach(tab => {
      const btn = document.createElement('button');
      btn.className =
        'px-4 py-2 rounded-full text-sm font-medium transition hover:bg-slate-800 text-slate-200';
      btn.textContent = tab.label;
      const setActive = () => {
        btn.classList.toggle('bg-sky-500', currentTab === tab.id);
        btn.classList.toggle('text-slate-900', currentTab === tab.id);
        btn.classList.toggle('shadow-lg', currentTab === tab.id);
      };
      btn.addEventListener('click', () => {
        currentTab = tab.id;
        tabsContainer.querySelectorAll('button').forEach(b => b.classList.remove('bg-sky-500', 'text-slate-900', 'shadow-lg'));
        setActive();
        renderTab();
      });
      tabBar.appendChild(btn);
      btn.dataset.tabId = tab.id;
    });

    const tabsContainer = tabBar;
    wrapper.appendChild(tabBar);
    wrapper.appendChild(content);
    main.appendChild(wrapper);

    const [appsResult, ratingsResult, categoriesResult, ratingsMapResult] = await Promise.all([
      getAllAppsForAnalytics(),
      getRatingsForAnalytics(),
      getCategoriesMap(),
      getAverageRatingsMap()
    ]);

    if (appsResult.error || ratingsResult.error || categoriesResult.error || ratingsMapResult.error) {
      const err = document.createElement('div');
      err.className = 'app-card text-red-300 bg-red-950/30 border border-red-800';
      err.textContent = 'Failed to load analytics data. Please try again later.';
      content.appendChild(err);
      return;
    }

    const apps = appsResult.data || [];
    const ratings = ratingsResult.data || [];
    const categoriesMap = categoriesResult.map || {};
    const averageRatings = ratingsMapResult.map || {};

    const ratingAgg = ratings.reduce((acc, r) => {
      if (!r.app_id) return acc;
      acc[r.app_id] = acc[r.app_id] || { total: 0, count: 0 };
      acc[r.app_id].total += r.rating || 0;
      acc[r.app_id].count += 1;
      return acc;
    }, {});

    const newestApps = [...apps]
      .sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0))
      .slice(0, 8);

    const categoryDownloads = apps.reduce((acc, app) => {
      const key = app.category_slug || 'uncategorized';
      acc[key] = (acc[key] || 0) + (app.download_count || 0);
      return acc;
    }, {});

    function renderDashboard() {
      destroyCharts();
      content.innerHTML = '';

      const grid = document.createElement('div');
      grid.className = 'grid gap-6 lg:grid-cols-2';

      const topDownloaded = buildTopList(apps, 'download_count');
      const topLiked = buildTopList(apps, 'like_count');
      const ratedApps = apps
        .map(a => {
          const agg = ratingAgg[a.id];
          const average = agg ? agg.total / agg.count : 0;
          return { ...a, averageRating: average, ratingCount: agg ? agg.count : 0 };
        })
        .filter(a => a.ratingCount >= 1)
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 5);

      const panels = [
        { id: 'chart-most-downloaded', title: 'Most Downloaded Apps', data: topDownloaded, key: 'download_count', color: '#38bdf8' },
        { id: 'chart-most-liked', title: 'Most Liked Apps', data: topLiked, key: 'like_count', color: '#f472b6' },
        { id: 'chart-highest-rated', title: 'Highest Rated Apps', data: ratedApps, key: 'averageRating', color: '#a5b4fc' }
      ];

      panels.forEach(panel => {
        const card = createCard();
        card.classList.add('space-y-3');
        card.innerHTML = `
          <div>
            <p class="text-xs uppercase tracking-wide text-slate-400">Top performers</p>
            <h3 class="text-sm font-semibold text-slate-200">${panel.title}</h3>
          </div>
          <canvas id="${panel.id}" height="260"></canvas>
        `;
        grid.appendChild(card);

        const labels = panel.data.map(a => a.name);
        const values = panel.data.map(a => a[panel.key] || 0);
        if (labels.length) {
          renderBarChart(panel.id, labels, values, panel.title, panel.color);
        } else {
          const placeholder = document.createElement('p');
          placeholder.className = 'text-slate-400 text-sm';
          placeholder.textContent = 'No data available yet.';
          card.appendChild(placeholder);
        }
      });

      const categoryCard = createCard();
      categoryCard.classList.add('space-y-3');
      categoryCard.innerHTML = `
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-400">Category breakdown</p>
          <h3 class="text-sm font-semibold text-slate-200">Activity by Category</h3>
        </div>
        <canvas id="chart-category-activity" height="260"></canvas>
      `;
      grid.appendChild(categoryCard);

      const categoryLabels = Object.keys(categoryDownloads).map(slug => categoriesMap[slug] || slug);
      const categoryValues = Object.values(categoryDownloads);
      if (categoryLabels.length) {
        renderBarChart('chart-category-activity', categoryLabels, categoryValues, 'Activity by Category', '#34d399');
      } else {
        const placeholder = document.createElement('p');
        placeholder.className = 'text-slate-400 text-sm';
        placeholder.textContent = 'No category activity yet.';
        categoryCard.appendChild(placeholder);
      }

      content.appendChild(grid);

      const newestCard = createCard();
      newestCard.classList.add('space-y-3');
      newestCard.innerHTML = `
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-400">Latest releases</p>
          <h3 class="text-sm font-semibold text-slate-200">Newest Apps</h3>
        </div>
        <div id="newest-apps" class="space-y-2"></div>
      `;
      const newestContainer = newestCard.querySelector('#newest-apps');
      if (!newestApps.length) {
        newestContainer.innerHTML = '<p class="text-slate-400 text-sm">No apps available yet.</p>';
      } else {
        newestApps.forEach(app => {
          const row = document.createElement('div');
          row.className = 'flex items-center justify-between border border-slate-800 rounded-xl px-3 py-2 bg-slate-900/60';
          row.innerHTML = `
            <div>
              <div class="font-medium text-slate-100">${app.name}</div>
              <div class="text-xs text-slate-500">${categoriesMap[app.category_slug] || app.category_slug || 'Uncategorized'}</div>
            </div>
            <div class="text-xs text-slate-400">${formatDate(app.created_at)} · ${app.download_count || 0} downloads</div>
          `;
          newestContainer.appendChild(row);
        });
      }

      content.appendChild(newestCard);
    }

    function renderExplorer() {
      destroyCharts();
      content.innerHTML = '';

      const { container: filterCard, controls } = buildFilters(categoriesMap);
      content.appendChild(filterCard);

      const tableMount = document.createElement('div');
      content.appendChild(tableMount);

      const decoratedApps = (apps || []).map(app => {
        const ratingInfo = averageRatings[app.id] || { avgRating: 0, count: 0 };
        return {
          id: app.id,
          name: app.name,
          image: app.image,
          categorySlug: app.category_slug,
          categoryName: categoriesMap[app.category_slug] || app.category_slug || 'Uncategorized',
          downloadCount: app.download_count || 0,
          likeCount: app.like_count || 0,
          avgRating: ratingInfo.avgRating || 0,
          ratingCount: ratingInfo.count || 0,
          createdAt: app.created_at,
          updatedAt: app.updated_at,
          version: app.version
        };
      });

      function applyFilters() {
        let list = [...decoratedApps];
        const categoryValue = controls.category.value;
        const minRating = Number(controls.minRating.value || 0);
        const minDownloads = Number(controls.minDownloads.value || 0);
        const sortMode = controls.sort.value;

        if (categoryValue !== 'all') {
          list = list.filter(app => app.categorySlug === categoryValue);
        }
        if (minRating > 0) {
          list = list.filter(app => app.avgRating >= minRating);
        }
        if (minDownloads > 0) {
          list = list.filter(app => app.downloadCount >= minDownloads);
        }

        list.sort((a, b) => {
          switch (sortMode) {
            case 'name-desc':
              return (b.name || '').localeCompare(a.name || '');
            case 'downloads-desc':
              return (b.downloadCount || 0) - (a.downloadCount || 0);
            case 'downloads-asc':
              return (a.downloadCount || 0) - (b.downloadCount || 0);
            case 'rating-desc':
              return (b.avgRating || 0) - (a.avgRating || 0);
            case 'rating-asc':
              return (a.avgRating || 0) - (b.avgRating || 0);
            case 'newest':
              return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
            case 'oldest':
              return new Date(a.updatedAt || a.createdAt || 0) - new Date(b.updatedAt || b.createdAt || 0);
            case 'name-asc':
            default:
              return (a.name || '').localeCompare(b.name || '');
          }
        });

        renderExplorerTable(tableMount, list);
      }

      ['change', 'input'].forEach(evt => {
        controls.category.addEventListener(evt, applyFilters);
        controls.sort.addEventListener(evt, applyFilters);
        controls.minRating.addEventListener(evt, applyFilters);
        controls.minDownloads.addEventListener(evt, applyFilters);
      });

      applyFilters();
    }

    function renderTab() {
      if (currentTab === 'dashboard') {
        renderDashboard();
      } else {
        renderExplorer();
      }
    }

    // Initialize tab state styling
    tabsContainer.querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('bg-sky-500', btn.dataset.tabId === currentTab);
      btn.classList.toggle('text-slate-900', btn.dataset.tabId === currentTab);
      btn.classList.toggle('shadow-lg', btn.dataset.tabId === currentTab);
    });

    renderTab();
  }, { currentRoute: '#/analytics' });
}
