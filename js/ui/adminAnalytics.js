import {
  getAllAppsForAnalytics,
  getRatingsForAnalytics,
  getCategoriesMap,
  getAverageRatingsMap
} from '../api.js';
import { renderAppShell } from './layout.js';

const chartInstances = [];

function destroyCharts() {
  while (chartInstances.length) {
    const chart = chartInstances.pop();
    if (chart && typeof chart.destroy === 'function') {
      chart.destroy();
    }
  }
}

function formatDate(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString();
}

function createPanel(title) {
  const card = document.createElement('section');
  card.className = 'bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg space-y-3';
  card.innerHTML = `<h3 class="text-sm font-semibold text-slate-200 uppercase tracking-wide">${title}</h3>`;
  return card;
}

function createEmptyState(message) {
  const empty = document.createElement('p');
  empty.className = 'text-sm text-slate-400';
  empty.textContent = message;
  return empty;
}

function renderBarChart(canvas, labels, values, label, color) {
  if (!canvas || typeof window.Chart === 'undefined') {
    return;
  }

  const chart = new window.Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label,
          data: values,
          backgroundColor: color,
          borderRadius: 8,
          maxBarThickness: 48
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
          labels: { color: '#e5e7eb' }
        }
      },
      scales: {
        x: {
          ticks: { color: '#e5e7eb' },
          grid: { color: 'rgba(148, 163, 184, 0.12)' }
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#e5e7eb' },
          grid: { color: 'rgba(148, 163, 184, 0.12)' }
        }
      }
    }
  });

  chartInstances.push(chart);
}

function addChartPanel(parent, title, rows, valueKey, color, emptyMessage) {
  const panel = createPanel(title);
  if (!rows.length) {
    panel.appendChild(createEmptyState(emptyMessage));
    parent.appendChild(panel);
    return;
  }

  const chartWrap = document.createElement('div');
  chartWrap.className = 'h-64';
  const canvas = document.createElement('canvas');
  chartWrap.appendChild(canvas);
  panel.appendChild(chartWrap);
  parent.appendChild(panel);

  renderBarChart(
    canvas,
    rows.map(row => row.name),
    rows.map(row => row[valueKey] ?? 0),
    title,
    color
  );
}

function buildExplorerFilters(categoriesMap) {
  const wrapper = document.createElement('section');
  wrapper.className = 'bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg';

  const grid = document.createElement('div');
  grid.className = 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4';

  function buildSelect(label, options) {
    const group = document.createElement('label');
    group.className = 'space-y-1';

    const title = document.createElement('span');
    title.className = 'block text-xs uppercase tracking-wide text-slate-400';
    title.textContent = label;

    const select = document.createElement('select');
    select.className =
      'w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500';

    options.forEach(option => {
      const opt = document.createElement('option');
      opt.value = option.value;
      opt.textContent = option.label;
      select.appendChild(opt);
    });

    group.appendChild(title);
    group.appendChild(select);
    grid.appendChild(group);
    return select;
  }

  const category = buildSelect('Marketplace', [
    { value: 'all', label: 'All Marketplaces' },
    ...Object.entries(categoriesMap).map(([slug, name]) => ({ value: slug, label: name }))
  ]);

  const minRating = buildSelect('Minimum Rating', [
    { value: '0', label: 'All' },
    { value: '1', label: '1+' },
    { value: '2', label: '2+' },
    { value: '3', label: '3+' },
    { value: '4', label: '4+' }
  ]);

  const minDownloads = buildSelect('Minimum Downloads', [
    { value: '0', label: 'All' },
    { value: '10', label: '10+' },
    { value: '100', label: '100+' },
    { value: '1000', label: '1000+' }
  ]);

  const sort = buildSelect('Sort', [
    { value: 'name-asc', label: 'Name A→Z' },
    { value: 'name-desc', label: 'Name Z→A' },
    { value: 'downloads-desc', label: 'Downloads High→Low' },
    { value: 'downloads-asc', label: 'Downloads Low→High' },
    { value: 'rating-desc', label: 'Rating High→Low' },
    { value: 'rating-asc', label: 'Rating Low→High' },
    { value: 'newest', label: 'Newest' },
    { value: 'oldest', label: 'Oldest' }
  ]);

  wrapper.appendChild(grid);

  return { wrapper, controls: { category, minRating, minDownloads, sort } };
}

function renderExplorerTable(host, rows) {
  host.innerHTML = '';
  const card = document.createElement('section');
  card.className = 'bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg';

  const scroll = document.createElement('div');
  scroll.className = 'overflow-x-auto';

  const table = document.createElement('table');
  table.className = 'min-w-full text-sm';
  table.innerHTML = `
    <thead class="text-xs uppercase tracking-wide text-slate-400 border-b border-slate-800">
      <tr>
        <th class="px-3 py-2 text-left">App</th>
        <th class="px-3 py-2 text-left">Category</th>
        <th class="px-3 py-2 text-left">Downloads</th>
        <th class="px-3 py-2 text-left">Avg. Rating</th>
        <th class="px-3 py-2 text-left">Created</th>
        <th class="px-3 py-2 text-left">Updated</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-800"></tbody>
  `;

  const body = table.querySelector('tbody');

  if (!rows.length) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="6" class="px-3 py-6 text-center text-slate-400">No apps match the selected filters.</td>';
    body.appendChild(row);
  } else {
    rows.forEach(app => {
      const row = document.createElement('tr');
      row.className = 'hover:bg-slate-800/60';
      row.innerHTML = `
        <td class="px-3 py-3">
          <div class="flex items-center gap-3">
            <div class="h-9 w-9 rounded-xl bg-slate-800 overflow-hidden flex items-center justify-center text-xs font-semibold text-slate-200">
              ${app.image ? `<img src="${app.image}" alt="${app.name} icon" class="h-full w-full object-cover" />` : (app.name || '?')[0]}
            </div>
            <div>
              <div class="font-medium text-slate-100">${app.name || 'Untitled app'}</div>
              <div class="text-xs text-slate-500">${app.id}</div>
            </div>
          </div>
        </td>
        <td class="px-3 py-3 text-slate-300">${app.categoryName}</td>
        <td class="px-3 py-3 text-slate-200">${app.downloadCount}</td>
        <td class="px-3 py-3 text-slate-200">★ ${app.avgRating.toFixed(1)} <span class="text-slate-500">(${app.ratingCount})</span></td>
        <td class="px-3 py-3 text-slate-400">${formatDate(app.createdAt)}</td>
        <td class="px-3 py-3 text-slate-400">${formatDate(app.updatedAt)}</td>
      `;
      body.appendChild(row);
    });
  }

  scroll.appendChild(table);
  card.appendChild(scroll);
  host.appendChild(card);
}

function computeExplorerRows(apps, categoriesMap, ratingsMap) {
  return apps.map(app => {
    const rating = ratingsMap[app.id] || { avgRating: 0, count: 0 };
    return {
      id: app.id,
      name: app.name || 'Untitled app',
      image: app.image || null,
      categorySlug: app.category_slug || 'uncategorized',
      categoryName: categoriesMap[app.category_slug] || app.category_slug || 'Uncategorized',
      downloadCount: Number(app.download_count || 0),
      avgRating: Number(rating.avgRating || 0),
      ratingCount: Number(rating.count || 0),
      createdAt: app.created_at || null,
      updatedAt: app.updated_at || null
    };
  });
}

function applyExplorerFilters(rows, controls) {
  const category = controls.category.value;
  const minRating = Number(controls.minRating.value || 0);
  const minDownloads = Number(controls.minDownloads.value || 0);
  const sort = controls.sort.value;

  const filtered = rows.filter(row => {
    const categoryMatch = category === 'all' ? true : row.categorySlug === category;
    const ratingMatch = row.avgRating >= minRating;
    const downloadsMatch = row.downloadCount >= minDownloads;
    return categoryMatch && ratingMatch && downloadsMatch;
  });

  filtered.sort((a, b) => {
    switch (sort) {
      case 'name-desc':
        return b.name.localeCompare(a.name);
      case 'downloads-desc':
        return b.downloadCount - a.downloadCount;
      case 'downloads-asc':
        return a.downloadCount - b.downloadCount;
      case 'rating-desc':
        return b.avgRating - a.avgRating;
      case 'rating-asc':
        return a.avgRating - b.avgRating;
      case 'newest':
        return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
      case 'oldest':
        return new Date(a.updatedAt || a.createdAt || 0) - new Date(b.updatedAt || b.createdAt || 0);
      case 'name-asc':
      default:
        return a.name.localeCompare(b.name);
    }
  });

  return filtered;
}

export async function renderAdminAnalytics(root, options = {}) {
  const render = async main => {
    destroyCharts();
    main.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className =
      'min-h-[calc(100vh-5rem)] px-4 py-6 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100';

    const container = document.createElement('div');
    container.className = 'max-w-6xl mx-auto space-y-6';
    container.innerHTML = `
      <header class="space-y-2">
        <h2 class="text-3xl font-semibold tracking-tight">Analytics</h2>
        <p class="text-slate-400">Monitor app performance and marketplace activity.</p>
      </header>
    `;

    const tabBar = document.createElement('div');
    tabBar.className = 'bg-slate-900/80 border border-slate-800 rounded-2xl p-2 flex gap-2 shadow-lg';

    const dashboardSection = document.createElement('section');
    dashboardSection.className = 'space-y-6';
    const explorerSection = document.createElement('section');
    explorerSection.className = 'space-y-6 hidden';

    const tabs = [
      { key: 'dashboard', label: 'Dashboard', section: dashboardSection },
      { key: 'explorer', label: 'Explorer', section: explorerSection }
    ];

    const tabButtons = [];
    const setActiveTab = key => {
      tabs.forEach(tab => {
        const isActive = tab.key === key;
        tab.section.classList.toggle('hidden', !isActive);
      });
      tabButtons.forEach(({ key: buttonKey, element }) => {
        const isActive = buttonKey === key;
        element.className = isActive
          ? 'px-4 py-2 rounded-full text-sm font-medium transition bg-sky-500 text-slate-900 shadow'
          : 'px-4 py-2 rounded-full text-sm font-medium transition text-slate-200 hover:bg-slate-800';
      });
    };

    tabs.forEach(tab => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = tab.label;
      button.addEventListener('click', () => setActiveTab(tab.key));
      tabButtons.push({ key: tab.key, element: button });
      tabBar.appendChild(button);
    });

    container.appendChild(tabBar);

    const [appsRes, ratingsRes, categoriesRes, avgRes] = await Promise.all([
      getAllAppsForAnalytics(),
      getRatingsForAnalytics(),
      getCategoriesMap(),
      getAverageRatingsMap()
    ]);

    const apps = Array.isArray(appsRes.data) ? appsRes.data : [];

    if (appsRes.error || ratingsRes.error || categoriesRes.error || avgRes.error) {
      const errorCard = document.createElement('div');
      errorCard.className = 'bg-red-950/30 border border-red-800 rounded-2xl p-4 text-sm text-red-200';
      errorCard.textContent = appsRes.analyticsColumnsMissing
        ? 'Analytics columns missing in database. See README.'
        : 'Failed to load analytics data. Please try again.';
      container.appendChild(errorCard);
    } else if (!apps.length) {
      const errorCard = document.createElement('div');
      errorCard.className = 'bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-sm text-slate-300';
      errorCard.textContent = 'No analytics data yet. Add apps to populate dashboard charts.';
      container.appendChild(errorCard);
    } else if (typeof window.Chart !== 'function') {
      const errorCard = document.createElement('div');
      errorCard.className = 'bg-amber-950/30 border border-amber-800 rounded-2xl p-4 text-sm text-amber-200';
      errorCard.textContent = 'Chart.js is unavailable. Analytics charts cannot be rendered.';
      container.appendChild(errorCard);
    } else {
      const categoriesMap = categoriesRes.map || {};
      const ratingsMap = avgRes.map || {};

      const topDownloaded = [...apps]
        .sort((a, b) => Number(b.download_count || 0) - Number(a.download_count || 0))
        .slice(0, 5);
      const highestRated = [...apps]
        .map(app => {
          const rating = ratingsMap[app.id] || { avgRating: 0, count: 0 };
          return { ...app, avgRating: rating.avgRating || 0, ratingCount: rating.count || 0 };
        })
        .filter(app => app.ratingCount >= 1)
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 5);

      const newestApps = [...apps]
        .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))
        .slice(0, 8);

      const dashboardGrid = document.createElement('div');
      dashboardGrid.className = 'grid gap-6 lg:grid-cols-2';

      const kpiGrid = document.createElement('div');
      kpiGrid.className = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4';
      const kpis = [
        { label: 'Total Apps', value: apps.length },
        {
          label: 'Total Downloads',
          value: apps.reduce((sum, app) => sum + Number(app.download_count || 0), 0)
        },
      ];
      kpis.forEach(kpi => {
        const card = createPanel(kpi.label);
        card.innerHTML += `<p class="text-2xl font-semibold text-white">${kpi.value.toLocaleString()}</p>`;
        kpiGrid.appendChild(card);
      });

      addChartPanel(
        dashboardGrid,
        'Most Downloaded Apps',
        topDownloaded.map(app => ({ name: app.name, value: app.download_count || 0 })),
        'value',
        '#38bdf8',
        'No downloads recorded yet. Downloads increase when users click Install.'
      );

      addChartPanel(
        dashboardGrid,
        'Highest Rated Apps',
        highestRated.map(app => ({ name: app.name, value: Number((app.avgRating || 0).toFixed(2)) })),
        'value',
        '#a78bfa',
        'Need at least 1 rating per app to rank.'
      );

      const newestCard = createPanel('Newest Apps');
      if (!newestApps.length) {
        newestCard.appendChild(createEmptyState('No app activity yet.'));
      } else {
        const list = document.createElement('div');
        list.className = 'space-y-2';
        newestApps.forEach(app => {
          const row = document.createElement('div');
          row.className = 'flex items-center justify-between border border-slate-800 rounded-xl bg-slate-900/70 px-3 py-2';
          row.innerHTML = `
            <div>
              <p class="font-medium text-slate-100">${app.name || 'Untitled app'}</p>
              <p class="text-xs text-slate-500">${categoriesMap[app.category_slug] || app.category_slug || 'Uncategorized'}</p>
            </div>
            <div class="text-xs text-slate-400 text-right">
              <div>Updated ${formatDate(app.updated_at || app.created_at)}</div>
              <div>${Number(app.download_count || 0).toLocaleString()} downloads</div>
            </div>
          `;
          list.appendChild(row);
        });
        newestCard.appendChild(list);
      }

      dashboardSection.appendChild(kpiGrid);
      dashboardSection.appendChild(dashboardGrid);
      dashboardSection.appendChild(newestCard);

      const explorerRows = computeExplorerRows(apps, categoriesMap, ratingsMap);
      const { wrapper: filtersCard, controls } = buildExplorerFilters(categoriesMap);
      const tableMount = document.createElement('div');

      const refreshExplorer = () => {
        const filtered = applyExplorerFilters(explorerRows, controls);
        renderExplorerTable(tableMount, filtered);
      };

      controls.category.addEventListener('change', refreshExplorer);
      controls.minRating.addEventListener('change', refreshExplorer);
      controls.minDownloads.addEventListener('change', refreshExplorer);
      controls.sort.addEventListener('change', refreshExplorer);

      explorerSection.appendChild(filtersCard);
      explorerSection.appendChild(tableMount);
      refreshExplorer();
    }

    container.appendChild(dashboardSection);
    container.appendChild(explorerSection);
    wrapper.appendChild(container);
    main.appendChild(wrapper);

    setActiveTab(options.defaultTab === 'explorer' ? 'explorer' : 'dashboard');
  };

  if (root) {
    await render(root);
    return;
  }

  await renderAppShell(render, { currentRoute: '#/analytics' });
}
