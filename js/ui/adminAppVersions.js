import { renderShell } from './layout.js';
import { createCard } from './components.js';
import { getAppById, getVersionsForApp, addVersion, updateApp } from '../api.js';

export async function renderAdminAppVersionsPage(appId) {
  await renderShell(async main => {
    const { data: app, error } = await getAppById(appId);
    if (error || !app) {
      main.innerHTML = '<p class="text-red-500 text-sm">App not found.</p>';
      return;
    }

    const heading = document.createElement('div');
    heading.className = 'space-y-1';
    heading.innerHTML = `<p class="text-sm text-slate-400">Manage Versions</p><h2 class="text-2xl font-semibold text-white">${app.name}</h2>`;
    main.appendChild(heading);

    const listCard = createCard();
    listCard.innerHTML = '<h3 class="text-lg font-semibold text-white mb-2">Existing Versions</h3><div id="versions-list" class="space-y-2"></div>';
    main.appendChild(listCard);

    const formCard = createCard();
    formCard.innerHTML = `
      <h3 class="text-lg font-semibold text-white mb-2">Add Version</h3>
      <form id="version-form" class="space-y-2">
        <div class="flex flex-col gap-1">
          <label class="text-sm text-slate-300" for="version-name">Version</label>
          <input id="version-name" type="text" class="rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-white" />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-sm text-slate-300" for="version-notes">Release Notes</label>
          <textarea id="version-notes" rows="3" class="rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-white"></textarea>
        </div>
        <button type="submit" class="px-3 py-2 rounded-lg bg-sky-500 text-white font-semibold">Add Version</button>
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
            <article class="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <div class="flex items-center justify-between">
                <div class="font-semibold">Version ${v.version}</div>
                <div class="text-xs text-slate-500">${date}</div>
              </div>
              <p class="text-xs text-slate-200 mt-1 whitespace-pre-wrap">${(v.release_notes || '').replace(/</g, '&lt;')}</p>
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
  });
}
