// admin-auth.js
import { getCurrentAccount, isCurrentUserAdmin } from './js/auth.js';

async function ensureAdmin() {
  const adminSection = document.getElementById('admin-section');
  const notAdmin = document.getElementById('not-admin-message');

  const { user, error } = await getCurrentAccount();

  if (error || !user) {
    window.location.hash = '#/login';
    return null;
  }

  const admin = await isCurrentUserAdmin();
  if (!admin) {
    if (adminSection) adminSection.classList.add('hidden');
    if (notAdmin) notAdmin.classList.remove('hidden');
    return null;
  }

  if (adminSection) adminSection.classList.remove('hidden');
  if (notAdmin) notAdmin.classList.add('hidden');

  return user;
}

export async function protectAdminPage(initAdminPage) {
  const user = await ensureAdmin();
  if (!user) return;
  if (typeof initAdminPage === 'function') {
    await initAdminPage(user);
  }
}
