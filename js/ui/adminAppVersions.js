import { renderAppShell } from './layout.js';
import { createCard } from './components.js';
import { getAppById, getVersionsForApp, addVersion, updateApp } from '../api.js';

export async function renderAdminAppVersionsPage(appId) {
  await renderAppShell(async main => {
    const { data: app, error } = await getAppById(appId);
    if (error || !app) {
      main.innerHTML = '<p class="app-note" style="color:#f87171">App not found.</p>';
      return;
    }

    const heading = document.createElement('div');
    heading.innerHTML = `<p class="app-subtext">Manage Versions</p><h2 class="app-section-title">${app.name}</h2>`;
    main.appendChild(heading);

    const listCard = createCard();
    listCard.innerHTML = '<h3 class="app-card-title">Existing Versions</h3><div id="versions-list" class="app-stack"></div>';
    main.appendChild(listCard);

    const formCard = createCard();
    formCard.innerHTML = `
      <h3 class="app-card-title">Add Version</h3>
      <form id="version-form" class="app-stack">
        <div>
          <label class="app-label" for="version-name">Version</label>
          <input id="version-name" type="text" class="app-input" />
        </div>
        <div>
          <label class="app-label" for="version-notes">Release Notes</label>
          <textarea id="version-notes" rows="3" class="app-textarea"></textarea>
        </div>
        <button type="submit" class="app-btn-primary" style="width:fit-content;">Add Version</button>
      </form>
    `;
    main.appendChild(formCard);

    const listEl = listCard.querySelector('#versions-list');
    const form = formCard.querySelector('#version-form');
    const versionInput = form.querySelector('#version-name');
    const notesInput = form.querySelector('#version-notes');

    async function loadVersions() {
      const { data: versions, error: versionsError } = await getVersionsForApp(appId);
      if (versionsError) {
        listEl.textContent = 'Failed to load versions.';
        return;
      }
      if (!versions || versions.length === 0) {
        listEl.textContent = 'No versions added yet.';
        return;
      }
      listEl.innerHTML = versions
        .map(v => {
          const date = v.created_at ? new Date(v.created_at).toLocaleDateString() : '';
          return `
            <article class="app-card">
              <div class="app-flex-between">
                <div class="app-card-title" style="margin:0;">Version ${v.version}</div>
                <div class="app-note">${date}</div>
              </div>
              <p class="app-subtext" style="white-space:pre-wrap; margin-top:4px;">${(v.release_notes || '').replace(/</g, '&lt;')}</p>
            </article>
          `;
        })
        .join('');
    }

    await loadVersions();

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const version = versionInput.value.trim();
      const notes = notesInput.value.trim();
      if (!version) {
        alert('Version is required');
        return;
      }
      const { error: insertError } = await addVersion(appId, version, notes || null);
      if (insertError) {
        alert('Failed to add version');
        return;
      }
      await updateApp(appId, { version });
      versionInput.value = '';
      notesInput.value = '';
      await loadVersions();
    });
  }, { currentRoute: '#/admin/apps' });
}
