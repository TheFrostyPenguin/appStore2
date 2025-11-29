import { renderAuthShell } from './layout.js';
import { handleLogin } from '../auth.js';

export async function renderLoginPage() {
  await renderAuthShell(async card => {
    const title = document.createElement('div');
    title.innerHTML = '<p class="text-sm text-slate-400">Welcome back</p><h1 class="text-xl font-semibold text-white">Sign in</h1>';
    card.appendChild(title);

    const form = document.createElement('form');
    form.className = 'space-y-3';
    form.innerHTML = `
      <div class="space-y-1">
        <label class="text-sm text-slate-300" for="login-email">Email</label>
        <input id="login-email" type="email" class="w-full rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-white" required />
      </div>
      <div class="space-y-1">
        <label class="text-sm text-slate-300" for="login-password">Password</label>
        <input id="login-password" type="password" class="w-full rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-white" required />
      </div>
      <button type="submit" class="w-full px-3 py-2 rounded-lg bg-sky-500 text-white font-semibold">Sign in</button>
      <p class="text-sm text-slate-400">No account? <a href="#/signup" class="text-sky-400 hover:underline">Create one</a></p>
      <div id="login-error" class="text-sm text-red-400"></div>
    `;
    card.appendChild(form);

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const email = form.querySelector('#login-email').value.trim();
      const password = form.querySelector('#login-password').value;
      const errorBox = form.querySelector('#login-error');
      errorBox.textContent = '';
      const { error } = await handleLogin(email, password);
      if (error) errorBox.textContent = error.message || 'Login failed';
    });
  });
}
