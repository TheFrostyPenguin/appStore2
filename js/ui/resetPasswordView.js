import { updatePassword } from '../auth.js';

export function renderResetPasswordView(root) {
  if (!root) return;
  root.className = '';
  root.innerHTML = `
    <div class="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 py-10">
      <div class="w-full max-w-md space-y-6">
        <div class="bg-slate-900/70 border border-slate-800 rounded-2xl shadow-2xl p-8 backdrop-blur">
          <h1 class="text-2xl font-semibold tracking-tight text-white mb-2">Set a new password</h1>
          <p class="text-sm text-slate-400 mb-6">Enter your new password below.</p>

          <form id="reset-password-form" class="space-y-4">
            <div class="space-y-2">
              <label for="new-password" class="text-sm font-medium text-slate-200">New password</label>
              <input
                id="new-password"
                type="password"
                class="w-full rounded-xl bg-slate-900/60 border border-slate-700 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="At least 8 characters"
              />
            </div>

            <div class="space-y-2">
              <label for="confirm-password" class="text-sm font-medium text-slate-200">Confirm password</label>
              <input
                id="confirm-password"
                type="password"
                class="w-full rounded-xl bg-slate-900/60 border border-slate-700 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="Re-enter password"
              />
            </div>

            <div id="reset-password-error" class="hidden rounded-lg border border-red-800 bg-red-950/30 p-3 text-sm text-red-300"></div>
            <div id="reset-password-success" class="hidden rounded-lg border border-emerald-700 bg-emerald-950/30 p-3 text-sm text-emerald-300"></div>

            <button
              type="submit"
              class="w-full rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/20 hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              Update password
            </button>
          </form>

          <p class="mt-4 text-sm text-slate-400 text-center">
            <a href="#/login" class="text-sky-400 hover:text-sky-300">Back to login</a>
          </p>
        </div>
      </div>
    </div>
  `;

  const form = root.querySelector('#reset-password-form');
  const newPasswordInput = root.querySelector('#new-password');
  const confirmPasswordInput = root.querySelector('#confirm-password');
  const errorBox = root.querySelector('#reset-password-error');
  const successBox = root.querySelector('#reset-password-success');

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    if (errorBox) {
      errorBox.textContent = '';
      errorBox.classList.add('hidden');
    }
    if (successBox) {
      successBox.textContent = '';
      successBox.classList.add('hidden');
    }

    const newPassword = newPasswordInput?.value || '';
    const confirmPassword = confirmPasswordInput?.value || '';

    if (newPassword.length < 8) {
      errorBox.textContent = 'Password must be at least 8 characters long.';
      errorBox.classList.remove('hidden');
      return;
    }

    if (newPassword !== confirmPassword) {
      errorBox.textContent = 'Passwords do not match.';
      errorBox.classList.remove('hidden');
      return;
    }

    const { error } = await updatePassword(newPassword);
    if (error) {
      console.error(error);
      errorBox.textContent =
        'Your reset link is invalid or expired. Please request a new one.';
      errorBox.classList.remove('hidden');
      return;
    }

    successBox.textContent = 'Password updated successfully. Redirecting to login...';
    successBox.classList.remove('hidden');

    setTimeout(() => {
      window.location.hash = '#/login';
    }, 1500);
  });
}
