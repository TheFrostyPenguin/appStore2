import { renderPublicShell } from './layout.js';
import { handleLogin } from '../auth.js';

export async function renderLoginPage() {
  await renderPublicShell(async card => {
    const title = document.createElement('div');
    title.innerHTML = '<p class="app-subtext">Welcome back</p><h1 class="app-section-title">Sign in</h1>';
    card.appendChild(title);

    const form = document.createElement('form');
    form.className = 'app-stack';
    form.innerHTML = `
      <div>
        <label class="app-label" for="login-email">Email</label>
        <input id="login-email" type="email" class="app-input" required />
      </div>
      <div>
        <label class="app-label" for="login-password">Password</label>
        <input id="login-password" type="password" class="app-input" required />
      </div>
      <button type="submit" class="app-btn-primary">Sign in</button>
      <p class="app-subtext">No account? <a href="#/signup">Create one</a></p>
      <div id="login-error" class="app-note" style="color:#f87171"></div>
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
  }, { currentRoute: '#/login' });
}
