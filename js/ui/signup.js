import { renderAuthShell } from './layout.js';
import { handleSignup } from '../auth.js';

export async function renderSignupPage() {
  await renderAuthShell(async card => {
    const title = document.createElement('div');
    title.innerHTML = '<p class="text-sm text-slate-400">Create account</p><h1 class="text-xl font-semibold text-white">Sign up</h1>';
    card.appendChild(title);

    const form = document.createElement('form');
    form.className = 'space-y-3';
    form.innerHTML = `
      <div class="space-y-1">
        <label class="text-sm text-slate-300" for="signup-name">Full name</label>
        <input id="signup-name" type="text" class="w-full rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-white" />
      </div>
      <div class="space-y-1">
        <label class="text-sm text-slate-300" for="signup-email">Email</label>
        <input id="signup-email" type="email" class="w-full rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-white" required />
      </div>
      <div class="space-y-1">
        <label class="text-sm text-slate-300" for="signup-password">Password</label>
        <input id="signup-password" type="password" class="w-full rounded-lg bg-slate-900/60 border border-slate-800 px-3 py-2 text-sm text-white" required />
      </div>
      <button type="submit" class="w-full px-3 py-2 rounded-lg bg-sky-500 text-white font-semibold">Create account</button>
      <p class="text-sm text-slate-400">Already have an account? <a href="#/login" class="text-sky-400 hover:underline">Sign in</a></p>
      <div id="signup-error" class="text-sm text-red-400"></div>
    `;
    card.appendChild(form);

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const fullName = form.querySelector('#signup-name').value.trim();
      const email = form.querySelector('#signup-email').value.trim();
      const password = form.querySelector('#signup-password').value;
      const errorBox = form.querySelector('#signup-error');
      errorBox.textContent = '';
      const { error } = await handleSignup(email, password, fullName);
      if (error) errorBox.textContent = error.message || 'Sign up failed';
    });
  });
}
