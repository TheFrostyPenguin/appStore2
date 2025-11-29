<<<<<<< HEAD
import { getAppById, getRatingsForApp, addRating, getVersionsForApp, getAppDownloadUrl } from '../api.js';
import { renderShell } from './layout.js';
import { initTabs } from './tabs.js';
import { ratingStars, statusPill, createCard, createButton } from './components.js';
=======
import { getAppById, getRatingsForApp, addRating, getVersionsForApp } from '../api.js';
import { renderShell } from './layout.js';
import { initTabs } from './tabs.js';
import { ratingStars, statusPill, createCard } from './components.js';
>>>>>>> origin/main

export async function renderAppDetailsPage(appId) {
  await renderShell(async main => {
    const { data: app, error } = await getAppById(appId);
    if (error || !app) {
      main.innerHTML = '<p class="text-red-500 text-sm">Application not found.</p>';
      return;
    }

    const header = createCard();
<<<<<<< HEAD
    header.classList.add('flex', 'gap-4', 'items-start');
=======
    header.classList.add('flex', 'gap-4');
>>>>>>> origin/main
    header.innerHTML = `
      <div class="h-14 w-14 rounded-2xl bg-slate-800 overflow-hidden flex items-center justify-center">
        ${app.image ? `<img src="${app.image}" alt="${app.name} icon" class="h-14 w-14 object-cover" />` : `<span class="text-lg text-slate-200 font-semibold">${(app.name || '?')[0]}</span>`}
      </div>
      <div class="flex-1">
        <p class="text-sm text-slate-400">Application</p>
        <h1 id="app-title" class="text-2xl font-semibold text-white">${app.name}</h1>
        <p id="app-subtitle" class="text-sm text-slate-400 mt-1">${app.description || ''}</p>
        <div class="mt-2 flex items-center gap-2">${statusPill(app.status || 'Available').outerHTML}</div>
        ${app.system_requirements ? `<p class="text-xs text-slate-400 mt-2">Requirements: ${app.system_requirements}</p>` : ''}
      </div>
    `;
<<<<<<< HEAD

    const actions = document.createElement('div');
    actions.className = 'flex items-start gap-2';
    if (app.file_path) {
      const downloadBtn = createButton('Download');
      downloadBtn.addEventListener('click', async () => {
        const { url, error } = await getAppDownloadUrl(app);
        if (error || !url) {
          alert('Could not create download link.');
          return;
        }
        window.location.href = url;
      });
      actions.appendChild(downloadBtn);
    }
    if (actions.children.length) {
      header.appendChild(actions);
    }
=======
>>>>>>> origin/main
    main.appendChild(header);

    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'space-y-4';
    tabsContainer.innerHTML = `
      <div class="flex gap-2 mt-4" role="tablist">
        <button class="px-3 py-1.5 rounded-full border border-slate-800 text-sm text-slate-200" data-tab="overview" role="tab">Overview</button>
        <button class="px-3 py-1.5 rounded-full border border-slate-800 text-sm text-slate-200" data-tab="reviews" role="tab">Reviews</button>
        <button class="px-3 py-1.5 rounded-full border border-slate-800 text-sm text-slate-200" data-tab="versions" role="tab">Version History</button>
      </div>
      <div class="space-y-4">
        <div data-tab-panel="overview" role="tabpanel" class="space-y-2">
          <h3 class="text-lg font-semibold text-white">Overview</h3>
          <p class="text-sm text-slate-300 whitespace-pre-line">${app.description || 'No description provided.'}</p>
          ${app.system_requirements ? `<div class="text-sm text-slate-200"><span class="font-semibold">System requirements:</span> ${app.system_requirements}</div>` : ''}
        </div>
        <div data-tab-panel="reviews" role="tabpanel" class="space-y-3 hidden">
          <div id="reviews-summary" class="text-sm text-slate-200"></div>
          <form id="review-form" class="space-y-2">
            <div>
              <label class="block text-xs text-slate-400 mb-1">Your rating</label>
              <div id="review-stars" class="flex gap-1 text-xl cursor-pointer"></div>
            </div>
            <div>
              <label class="block text-xs text-slate-400 mb-1" for="review-comment">Your review</label>
              <textarea id="review-comment" rows="3" class="w-full rounded-lg bg-slate-900/60 border border-slate-800 text-sm text-white p-2" placeholder="Share your experience..."></textarea>
            </div>
            <button type="submit" class="px-3 py-1.5 rounded-md bg-sky-500 text-xs font-medium text-white hover:bg-sky-400">Submit review</button>
          </form>
          <div id="reviews-list" class="space-y-3 text-sm"></div>
        </div>
        <div data-tab-panel="versions" role="tabpanel" class="space-y-2 hidden">
          <h3 class="text-lg font-semibold text-white">Version History</h3>
          <div id="version-history" class="space-y-2 text-sm text-slate-200"></div>
        </div>
      </div>
    `;
    main.appendChild(tabsContainer);

    initTabs(tabsContainer, 'overview');

    await initReviews(appId);
    await loadVersionHistory(appId);
  });
}

async function initReviews(appId) {
  const summaryEl = document.getElementById('reviews-summary');
  const listEl = document.getElementById('reviews-list');
  const form = document.getElementById('review-form');
  const starsContainer = document.getElementById('review-stars');
  const commentInput = document.getElementById('review-comment');
  let currentRating = 0;

  function renderStars(rating) {
    starsContainer.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
      const span = document.createElement('span');
      span.textContent = i <= rating ? '★' : '☆';
      span.className = 'text-yellow-400';
      span.dataset.value = i;
      span.style.cursor = 'pointer';
      span.addEventListener('click', () => {
        currentRating = i;
        renderStars(currentRating);
      });
      starsContainer.appendChild(span);
    }
  }

  async function loadReviews() {
    const { data: reviews, error } = await getRatingsForApp(appId);
    if (error) {
      summaryEl.textContent = 'Failed to load reviews.';
      return;
    }
    if (!reviews || reviews.length === 0) {
      summaryEl.textContent = 'No reviews yet.';
      listEl.innerHTML = '';
      return;
    }
    const avg = reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length;
    summaryEl.innerHTML = `
      <div class="flex items-center gap-2">
        <div class="text-lg">${'★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg))}</div>
        <div class="text-xs text-slate-400">${avg.toFixed(1)} / 5.0 · ${reviews.length} review${reviews.length === 1 ? '' : 's'}</div>
      </div>
    `;
    listEl.innerHTML = reviews
      .map(r => {
        const stars = '★'.repeat(r.rating || 0) + '☆'.repeat(5 - (r.rating || 0));
        const date = r.created_at ? new Date(r.created_at).toLocaleDateString() : '';
        return `
          <article class="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
            <div class="flex items-center justify-between mb-1">
              <div class="text-yellow-400 text-sm">${stars}</div>
              <div class="text-xs text-slate-500">${date}</div>
            </div>
            <p class="text-sm text-slate-100 whitespace-pre-wrap">${(r.comment || '').replace(/</g, '&lt;')}</p>
          </article>
        `;
      })
      .join('');
  }

  renderStars(currentRating);
  await loadReviews();

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!currentRating) {
      alert('Please select a rating.');
      return;
    }
    const comment = commentInput.value.trim();
    const { error } = await addRating(appId, currentRating, comment);
    if (error) {
      alert('Failed to submit review');
      return;
    }
    currentRating = 0;
    renderStars(currentRating);
    commentInput.value = '';
    await loadReviews();
  });
}

async function loadVersionHistory(appId) {
  const historyEl = document.getElementById('version-history');
  if (!historyEl) return;
  const { data: versions, error } = await getVersionsForApp(appId);
  if (error) {
    historyEl.textContent = 'Failed to load version history.';
    return;
  }
  if (!versions || versions.length === 0) {
    historyEl.textContent = 'No version history available yet.';
    return;
  }
  historyEl.innerHTML = versions
    .map(v => {
      const date = v.created_at ? new Date(v.created_at).toLocaleDateString() : '';
      const notes = (v.release_notes || '').replace(/</g, '&lt;');
      return `
        <article class="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
          <div class="flex items-center justify-between mb-1">
            <div class="font-semibold">Version ${v.version}</div>
            <div class="text-xs text-slate-500">${date}</div>
          </div>
          <p class="text-xs text-slate-200 whitespace-pre-wrap">${notes}</p>
        </article>
      `;
    })
    .join('');
}
