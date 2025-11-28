// admin-auth.js
import { supabase } from './supabase-client.js';

async function ensureAdmin() {
  const adminSection = document.getElementById('admin-section');
  const notAdmin = document.getElementById('not-admin-message');

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    window.location.href = 'enterprise_app_store_login_1.html';
    return null;
  }

  const { data: account, error: accError } = await supabase
    .from('accounts')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (accError || !account || account.role !== 'admin') {
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
