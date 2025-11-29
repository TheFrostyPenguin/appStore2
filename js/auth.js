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
    navigateTo('#/marketplaces');
    return null;
  }
  return handler();
}

export async function getSessionAccount() {
  return getCurrentAccount();
}
