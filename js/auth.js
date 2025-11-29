import {
  signIn,
  signUp,
  signOut,
  getCurrentUser,
  getCurrentAccount,
  isAdmin
} from './api.js';
import { navigateTo } from './router.js';

export async function handleLogin(email, password) {
  const { error } = await signIn(email, password);
  if (error) return { error };

  const { data: account } = await getCurrentAccount();
  if (account && account.role === 'admin') {
    navigateTo('#/admin');
  } else {
    navigateTo('#/marketplaces');
  }
  return { error: null };
}

export async function handleSignup(email, password, fullName) {
  const { data, error } = await signUp(email, password, fullName);
  if (error) return { error };

  // Optionally ensure account row exists; assume trigger handles it
  navigateTo('#/login');
  return { data, error: null };
}

export async function handleLogout() {
  await signOut();
  navigateTo('#/login');
}

export async function requireAuth(handler) {
  const { data, error } = await getCurrentUser();
  if (error || !data?.user) {
    navigateTo('#/login');
    return null;
  }
  return handler(data.user);
}

export async function requireAdmin(handler) {
  const userCheck = await requireAuth(async () => true);
  if (!userCheck) return null;

  const admin = await isAdmin();
  if (!admin) {
    const root = document.getElementById('app-root');
    if (root) {
      root.innerHTML =
        '<div class="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 px-4"><div class="max-w-md text-center space-y-3">' +
        '<h1 class="text-2xl font-semibold text-white">Access denied</h1>' +
        '<p class="text-slate-400 text-sm">You do not have permission to view this page.</p>' +
        '<a href="#/marketplaces" class="text-sky-400 hover:underline text-sm">Return to marketplaces</a>' +
        '</div></div>';
    }
    return null;
  }
  return handler();
}

export async function getSessionAccount() {
  return getCurrentAccount();
}
