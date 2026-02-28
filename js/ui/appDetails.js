import {
  getAppById,
  getRatingsForApp,
  addRating,
  getVersionsForApp,
  getAppDownloadUrl,
  incrementAppDownloadCount
} from '../api.js';
import { renderAppShell } from './layout.js';
import { initTabs } from './tabs.js';
import { statusPill, createCard, createButton } from './components.js';

export async function renderAppDetailsPage(appId) {
  await renderAppShell(async main => {
    const { data: app, error } = await getAppById(appId);
    if (error || !app) {
      main.innerHTML = '<p class="app-note" style="color:#f87171">Application not found.</p>';
      return;
    }

    const header = createCard();
    header.innerHTML = `
      <div style="display:flex; gap:14px; align-items:flex-start;">
        <div class="app-avatar" style="width:56px; height:56px; border-radius:16px;">
          ${
            app.image
              ? `<img src="${app.image}" alt="${app.name} icon" style="width:56px;height:56px;border-radius:16px;object-fit:cover;" />`
              : `${(app.name || '?')[0]}`
          }
        </div>
        <div style="flex:1;">
          <p class="app-subtext">Application</p>
          <h1 id="app-title" class="app-section-title" style="margin:4px 0;">${app.name}</h1>
          <p id="app-subtitle" class="app-subtext">${app.description || ''}</p>
          <div style="margin-top:8px; display:flex; gap:8px; align-items:center;">${statusPill(app.status || 'Available').outerHTML}</div>
          ${app.system_requirements ? `<p class="app-note" style="margin-top:8px;">Requirements: ${app.system_requirements}</p>` : ''}
        </div>
      </div>
    `;

    const actions = document.createElement('div');
    actions.style.marginTop = '12px';

    if (app.file_path) {
      const downloadBtn = createButton('Install');
      downloadBtn.addEventListener('click', async () => {
        downloadBtn.disabled = true;
        const { url, error: downloadError } = await getAppDownloadUrl(app);
        if (downloadError || !url) {
          alert('Could not prepare download for this app.');
          console.error(downloadError);
          downloadBtn.disabled = false;
          return;
        }

        try {
          await incrementAppDownloadCount(app.id);
        } catch (err) {
          console.error('Failed to increment download count', err);
        }

        window.location.href = url;
        downloadBtn.disabled = false;
      });
      actions.appendChild(downloadBtn);
    } else {
      const noFile = document.createElement('p');
      noFile.className = 'app-note';
      noFile.textContent = 'No installable file is available for this app yet.';
      actions.appendChild(noFile);
    }
    header.appendChild(actions);
    main.appendChild(header);

    const tabsContainer = document.createElement('div');
    tabsContainer.className = 'app-card';
    tabsContainer.innerHTML = `
      <div class="app-tabs" role="tablist">
        <button class="app-tab" data-tab="overview" role="tab">Overview</button>
        <button class="app-tab" data-tab="reviews" role="tab">Reviews</button>
        <button class="app-tab" data-tab="versions" role="tab">Version History</button>
      </div>
      <div class="app-stack">
        <div data-tab-panel="overview" role="tabpanel" class="app-stack">
          <h3 class="app-card-title">Overview</h3>
          <p class="app-subtext" style="white-space:pre-line;">${app.description || 'No description provided.'}</p>
          ${app.system_requirements ? `<div class="app-note"><strong>System requirements:</strong> ${app.system_requirements}</div>` : ''}
        </div>
        <div data-tab-panel="reviews" role="tabpanel" class="app-stack hidden">
          <div id="reviews-summary" class="app-subtext"></div>
          <form id="review-form" class="app-stack">
            <div>
              <label class="app-label" for="review-comment">Your rating</label>
              <div id="review-stars" class="app-stars" style="display:flex; gap:6px; cursor:pointer;"></div>
            </div>
            <div>
              <label class="app-label" for="review-comment">Your review</label>
              <textarea id="review-comment" rows="3" class="app-textarea" placeholder="Share your experience..."></textarea>
            </div>
            <button type="submit" class="app-btn-primary" style="width:fit-content;">Submit review</button>
          </form>
          <div id="reviews-list" class="app-stack" style="margin-top:4px;"></div>
        </div>
        <div data-tab-panel="versions" role="tabpanel" class="app-stack hidden">
          <h3 class="app-card-title">Version History</h3>
          <div id="version-history" class="app-stack"></div>
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
      span.className = 'app-stars';
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
      <div style="display:flex; align-items:center; gap:8px;">
        <div class="app-stars">${'★'.repeat(Math.round(avg)) + '☆'.repeat(5 - Math.round(avg))}</div>
        <div class="app-note">${avg.toFixed(1)} / 5.0 · ${reviews.length} review${reviews.length === 1 ? '' : 's'}</div>
      </div>
    `;
    listEl.innerHTML = reviews
      .map(r => {
        const stars = '★'.repeat(r.rating || 0) + '☆'.repeat(5 - (r.rating || 0));
        const date = r.created_at ? new Date(r.created_at).toLocaleDateString() : '';
        return `
          <article class="app-card">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
              <div class="app-stars">${stars}</div>
              <div class="app-note">${date}</div>
            </div>
            <p class="app-subtext" style="white-space:pre-wrap;">${(r.comment || '').replace(/</g, '&lt;')}</p>
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
        <article class="app-card">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
            <div class="app-card-title" style="margin:0;">Version ${v.version}</div>
            <div class="app-note">${date}</div>
          </div>
          <p class="app-subtext" style="white-space:pre-wrap;">${notes}</p>
        </article>
      `;
    })
    .join('');
}
