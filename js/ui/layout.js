import { handleLogout, getSessionAccount } from '../auth.js';
import { createButton } from './components.js';

export async function renderShell(viewContentFn) {
  const root = document.getElementById('app-root');
  root.innerHTML = '';

  const account = (await getSessionAccount()).data;

  const page = document.createElement('div');
  page.className = 'min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100';

  const header = document.createElement('header');
  header.className = 'border-b border-slate-800 bg-slate-900/70 sticky top-0 z-10';
  header.innerHTML = `
    <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 rounded-xl bg-sky-500/20 border border-sky-500/50 flex items-center justify-center text-sky-300 font-bold">EA</div>
        <div>
          <p class="text-sm text-slate-400">Enterprise App Store</p>
          <h1 class="text-lg font-semibold text-white">Workspace</h1>
        </div>
      </div>
      <div class="flex items-center gap-3">
        ${account ? `<span class="text-sm text-slate-300">${account.full_name || account.email || ''}</span>` : ''}
        <button id="logout-btn" class="text-sm text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800">Logout</button>
      </div>
    </div>
  `;

  const main = document.createElement('main');
  main.className = 'max-w-6xl mx-auto px-6 py-8 space-y-6';

  page.appendChild(header);
  page.appendChild(main);
  root.appendChild(page);

  const logoutBtn = header.querySelector('#logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  await viewContentFn(main);
}

export async function renderAuthShell(viewContentFn) {
  const root = document.getElementById('app-root');
  root.innerHTML = '';

  const main = document.createElement('main');
  main.className = 'min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-4';

  const card = document.createElement('div');
  card.className = 'w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl space-y-4';

  await viewContentFn(card);
  main.appendChild(card);
  root.appendChild(main);
}
