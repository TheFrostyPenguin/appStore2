import { renderPublicShell } from './layout.js';
import { handleSignup } from '../auth.js';

export async function renderSignupPage() {
  await renderPublicShell(async card => {
    const title = document.createElement('div');
    title.innerHTML = '<p class="app-subtext">Create account</p><h1 class="app-section-title">Sign up</h1>';
    card.appendChild(title);

    const form = document.createElement('form');
    form.className = 'app-stack';
    form.innerHTML = `
      <div>
        <label class="app-label" for="signup-name">Full name</label>
        <input id="signup-name" type="text" class="app-input" />
      </div>
      <div>
        <label class="app-label" for="signup-email">Email</label>
        <input id="signup-email" type="email" class="app-input" required />
      </div>
      <div>
        <label class="app-label" for="signup-password">Password</label>
        <input id="signup-password" type="password" class="app-input" required />
      </div>
      <button type="submit" class="app-btn-primary">Create account</button>
      <p class="app-subtext">Already have an account? <a href="#/login">Sign in</a></p>
      <div id="signup-error" class="app-note" style="color:#f87171"></div>
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
  }, { currentRoute: '#/signup' });
}
