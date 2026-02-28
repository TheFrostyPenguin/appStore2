import { signIn, signUp, signOut as apiSignOut } from './api.js';
import { supabase } from '../supabase-client.js';
import { navigateTo } from './router.js';

export async function getCurrentAccount() {
  const {
    data: sessionData,
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError) {
    return { account: null, user: null, error: sessionError };
  }

  const user = sessionData?.session?.user || null;
  if (!user) {
    return { account: null, user: null, error: null };
  }

  const { data: account, error } = await supabase
    .from('accounts')
    .select('id,email,full_name,role,created_at')
    .eq('id', user.id)
    .maybeSingle();

  if (!account && !error) {
    console.warn('No accounts row for this auth user. Creating default member row...');
    const upsertRes = await supabase
      .from('accounts')
      .upsert(
        {
          id: user.id,
          email: user.email ?? null,
          full_name: user.user_metadata?.full_name || null,
          role: 'member'
        },
        { onConflict: 'id' }
      )
      .select('id,email,full_name,role,created_at')
      .maybeSingle();

    return {
      account: upsertRes.data ?? null,
      user,
      error: upsertRes.error ?? null
    };
  }

  return { account: account ?? null, user, error };
}

export async function isCurrentUserAdmin() {
  const { account } = await getCurrentAccount();
  return account?.role === 'admin';
}

export async function handleLogin(email, password) {
  const { error } = await signIn(email, password);
  if (error) return { error };

  const { account } = await getCurrentAccount();
  if (account?.role === 'admin') {
    navigateTo('#/admin');
  } else {
    navigateTo('#/marketplaces');
  }
  return { error: null };
}

export async function handleSignup(email, password, fullName) {
  const { data, error } = await signUp(email, password, fullName);
  if (error) return { error };

  navigateTo('#/login');
  return { data, error: null };
}

export async function signOutAndRedirect() {
  try {
    await apiSignOut();
  } finally {
    window.__accountCache = null;
    try {
      localStorage.removeItem('account');
    } catch (storageError) {
      console.warn('Unable to clear local account cache', storageError);
    }
    window.location.hash = '#/login';
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }
}

export async function signOut() {
  await signOutAndRedirect();
}

export async function handleLogout() {
  await signOutAndRedirect();
}

export async function requireAuth(handler) {
  const result = await getCurrentAccount();
  if (result.error || !result.user) {
    navigateTo('#/login');
    return null;
  }
  return handler ? handler({ user: result.user, account: result.account }) : result;
}

export async function requireAdmin(handler) {
  const authResult = await requireAuth();
  if (!authResult?.user) return null;

  if (authResult.account?.role !== 'admin') {
    navigateTo('#/marketplaces');
    return null;
  }

  return handler ? handler({ user: authResult.user, account: authResult.account }) : authResult;
}

export async function getSessionAccount() {
  return getCurrentAccount();
}
