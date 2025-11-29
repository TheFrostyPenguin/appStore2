import {
  getAllAppsForAnalytics,
  getRatingsForAnalytics,
  getCategoriesMap
} from '../api.js';
import { renderAppShell } from './layout.js';
import { createCard } from './components.js';

function renderBarChart(canvasId, labels, data, title, color = '#38bdf8') {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === 'undefined') return;
  const ctx = canvas.getContext('2d');
  // eslint-disable-next-line no-new
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: title,
          data,
          backgroundColor: color,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: title, color: '#e5e7eb', font: { size: 14 } }
      },
      scales: {
        x: { ticks: { color: '#cbd5e1' }, grid: { color: '#1e293b' } },
        y: { ticks: { color: '#cbd5e1' }, grid: { color: '#1e293b' } }
      }
    }
  });
}

function buildTopList(apps, key, limit = 5) {
  return [...(apps || [])]
    .sort((a, b) => (b[key] || 0) - (a[key] || 0))
    .slice(0, limit)
    .filter(a => (a[key] || 0) > 0);
}

export async function renderAdminAnalytics() {
  await renderAppShell(async main => {
    main.innerHTML = '';

    const heading = document.createElement('div');
    heading.className = 'app-stack';
    heading.innerHTML = `
      <div>
        <p class="app-subtext">Insights</p>
        <h2 class="app-section-title">Analytics Dashboard</h2>
        <p class="app-section-subtitle">Overview of app performance and category activity.</p>
      </div>
    `;
    main.appendChild(heading);

    const errorBox = document.createElement('div');
    main.appendChild(errorBox);

    const grid = document.createElement('div');
    grid.className = 'grid gap-6 lg:grid-cols-2';
    main.appendChild(grid);

    const newestCard = createCard();
    newestCard.classList.add('lg:col-span-2');
    newestCard.innerHTML = `
      <div class="app-card-header">
        <div>
          <p class="app-subtext">Latest releases</p>
          <h3 class="app-card-title">Newest Apps</h3>
        </div>
      </div>
      <div id="newest-apps" class="app-stack"></div>
    `;
    main.appendChild(newestCard);

    const [appsResult, ratingsResult, categoriesResult] = await Promise.all([
      getAllAppsForAnalytics(),
      getRatingsForAnalytics(),
      getCategoriesMap()
    ]);

    if (appsResult.error || ratingsResult.error || categoriesResult.error) {
      errorBox.innerHTML =
        '<div class="app-card" style="color:#f87171;">Failed to load analytics data. Please try again later.</div>';
      return;
    }

    const apps = appsResult.data || [];
    const ratings = ratingsResult.data || [];
    const categoriesMap = categoriesResult.map || {};

    const topDownloaded = buildTopList(apps, 'download_count');
    const topLiked = buildTopList(apps, 'like_count');

    // Average rating per app
    const ratingAgg = ratings.reduce((acc, r) => {
      if (!r.app_id) return acc;
      acc[r.app_id] = acc[r.app_id] || { total: 0, count: 0 };
      acc[r.app_id].total += r.rating || 0;
      acc[r.app_id].count += 1;
      return acc;
    }, {});

    const ratedApps = apps
      .map(a => {
        const agg = ratingAgg[a.id];
        const average = agg ? agg.total / agg.count : 0;
        return { ...a, averageRating: average, ratingCount: agg ? agg.count : 0 };
      })
      .filter(a => a.ratingCount > 0)
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(0, 5);

    // Downloads per category
    const categoryDownloads = apps.reduce((acc, app) => {
      const key = app.category_slug || 'uncategorized';
      acc[key] = (acc[key] || 0) + (app.download_count || 0);
      return acc;
    }, {});

    // Newest apps
    const newest = [...apps]
      .sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0))
      .slice(0, 8);

    const panels = [
      { id: 'chart-most-downloaded', title: 'Most Downloaded Apps', data: topDownloaded, key: 'download_count' },
      { id: 'chart-most-liked', title: 'Most Liked Apps', data: topLiked, key: 'like_count', color: '#f472b6' },
      { id: 'chart-highest-rated', title: 'Highest Rated Apps', data: ratedApps, key: 'averageRating', color: '#a5b4fc' }
    ];

    panels.forEach(panel => {
      const card = createCard();
      card.innerHTML = `
        <div class="app-card-header">
          <div>
            <p class="app-subtext">Top performers</p>
            <h3 class="app-card-title">${panel.title}</h3>
          </div>
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
        placeholder.className = 'app-subtext';
        placeholder.textContent = 'No data available yet.';
        card.appendChild(placeholder);
      }
    });

    // Activity by category
    const categoryCard = createCard();
    categoryCard.innerHTML = `
      <div class="app-card-header">
        <div>
          <p class="app-subtext">Category breakdown</p>
          <h3 class="app-card-title">Activity by Category</h3>
        </div>
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
      placeholder.className = 'app-subtext';
      placeholder.textContent = 'No category activity yet.';
      categoryCard.appendChild(placeholder);
    }

    // Newest list
    const newestList = newestCard.querySelector('#newest-apps');
    newestList.innerHTML = '';
    if (!newest.length) {
      newestList.innerHTML = '<p class="app-subtext">No apps available yet.</p>';
    } else {
      newest.forEach(app => {
        const row = document.createElement('div');
        row.className = 'flex items-center justify-between border border-slate-800 rounded-xl px-3 py-2';
        const left = document.createElement('div');
        left.innerHTML = `
          <div class="font-medium text-slate-100">${app.name}</div>
          <div class="app-subtext">${categoriesMap[app.category_slug] || app.category_slug || 'Uncategorized'}</div>
        `;
        const right = document.createElement('div');
        right.className = 'app-subtext';
        const date = app.created_at ? new Date(app.created_at).toLocaleDateString() : '';
        right.textContent = `${date} · ${app.download_count || 0} downloads`;
        row.appendChild(left);
        row.appendChild(right);
        newestList.appendChild(row);
      });
    }
  }, { currentRoute: '#/analytics' });
}
