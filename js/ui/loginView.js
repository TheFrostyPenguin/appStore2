import { supabase } from '../../supabase-client.js';

export function renderLoginView(root) {
  if (!root) return;
  root.className = '';
  root.innerHTML = `
    <div class="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-10">
      <div class="w-full max-w-md space-y-8">
        <div class="flex flex-col items-center text-center space-y-2">
          <div class="inline-flex items-center gap-3 rounded-full bg-slate-900/70 border border-slate-800 px-4 py-2 shadow-lg">
            <span class="material-symbols-outlined text-sky-400 text-2xl">widgets</span>
            <span class="text-sm font-semibold text-slate-200">Enterprise</span>
          </div>
          <div class="space-y-2">
            <h1 class="text-3xl sm:text-4xl font-semibold tracking-tight text-white">Sign in</h1>
            <p class="text-sm text-slate-400">Welcome back! Please enter your details.</p>
          </div>
        </div>

        <div class="bg-slate-900/70 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur">
          <form id="login-form" class="space-y-6">
            <div class="space-y-2">
              <label for="login-email" class="text-sm font-medium text-slate-200">Email address</label>
              <input
                id="login-email"
                type="email"
                class="w-full rounded-xl bg-slate-900/60 border border-slate-700 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="you@example.com"
              />
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label for="login-password" class="text-sm font-medium text-slate-200">Password</label>
                <button type="button" class="text-xs text-slate-400 hover:text-sky-400">Forgot password?</button>
              </div>
              <div class="relative">
                <input
                  id="login-password"
                  type="password"
                  class="w-full rounded-xl bg-slate-900/60 border border-slate-700 px-4 py-3 pr-12 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  id="togglePassword"
                  aria-label="Toggle password visibility"
                  class="absolute inset-y-0 right-2 my-1 flex items-center rounded-full px-3 text-slate-400 hover:text-sky-300 hover:bg-slate-800"
                >
                  <span class="material-symbols-outlined text-lg">visibility</span>
                </button>
              </div>
            </div>

            <div id="login-error" class="hidden rounded-lg border border-red-800 bg-red-950/30 p-3 text-sm text-red-300"></div>

            <button
              type="submit"
              class="w-full rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/20 hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              Login
            </button>
          </form>
          <div class="mt-6 text-center text-sm text-slate-300">
            Don't have an account?
            <a id="go-to-signup" class="font-semibold text-sky-400 hover:text-sky-300" href="javascript:void(0)">Sign up</a>
          </div>
        </div>
        <p class="text-center text-xs text-slate-500">© 2024 Enterprise Corp. All rights reserved.</p>
      </div>
    </div>
  `;

  const form = root.querySelector('#login-form');
  const emailInput = root.querySelector('#login-email');
  const passwordInput = root.querySelector('#login-password');
  const togglePassword = root.querySelector('#togglePassword');
  const errorBox = root.querySelector('#login-error');
  const goToSignup = root.querySelector('#go-to-signup');

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      const icon = togglePassword.querySelector('span');
      if (icon) {
        icon.textContent = isPassword ? 'visibility_off' : 'visibility';
      } else {
        togglePassword.textContent = isPassword ? 'visibility_off' : 'visibility';
      }
    });
  }

  if (goToSignup) {
    goToSignup.addEventListener('click', e => {
      e.preventDefault();
      window.location.hash = '#/signup';
    });
  }

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (errorBox) {
        errorBox.textContent = '';
        errorBox.classList.add('hidden');
      }
      const email = emailInput?.value.trim();
      const password = passwordInput?.value || '';

      if (!email || !password) {
        if (errorBox) {
          errorBox.textContent = 'Please enter both email and password.';
          errorBox.classList.remove('hidden');
        }
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error(error);
        if (errorBox) {
          errorBox.textContent = error.message || 'Login failed. Please check your credentials.';
          errorBox.classList.remove('hidden');
        }
        return;
      }

      window.location.hash = '#/marketplaces';
    });
  }
}
