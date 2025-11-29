import { supabase } from '../supabase-client.js';

// Auth helpers
export async function getCurrentUser() {
  return supabase.auth.getUser();
}

export async function getCurrentAccount() {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError || !user) return { data: null, error: userError || new Error('No user') };

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  return { data, error };
}

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email, password, fullName) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName || null }
    }
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function isAdmin() {
  const { data, error } = await getCurrentAccount();
  if (error || !data) return false;
  return data.role === 'admin';
}

// Categories
export async function getAllCategories() {
  return supabase
    .from('categories')
    .select('id, name, slug, description')
    .order('name', { ascending: true });
}

export async function getCategoryBySlug(slug) {
  return supabase
    .from('categories')
    .select('id, name, slug, description')
    .eq('slug', slug)
    .maybeSingle();
}

export async function createCategory(payload) {
  return supabase.from('categories').insert(payload);
}

export async function updateCategory(id, payload) {
  return supabase.from('categories').update(payload).eq('id', id);
}

// Apps
export async function getAppsByCategorySlug(slug) {
  return supabase
    .from('apps')
    .select('id, name, description, image, status, category_slug, version, developer, system_requirements')
    .eq('category_slug', slug)
    .order('name', { ascending: true });
}

export async function getAllApps() {
  return supabase
    .from('apps')
    .select('id, name, description, image, status, category_slug, version, developer, system_requirements')
    .order('name', { ascending: true });
}

export async function getAppById(id) {
  return supabase
    .from('apps')
    .select('*')
    .eq('id', id)
    .maybeSingle();
}

export async function createApp(payload) {
  return supabase.from('apps').insert(payload);
}

export async function updateApp(id, payload) {
  return supabase.from('apps').update(payload).eq('id', id);
}

export async function searchAppsInCategory(slug, query) {
  const { data, error } = await getAppsByCategorySlug(slug);
  if (error || !data) return { data, error };
  const lower = (query || '').toLowerCase();
  const filtered = data.filter(app => {
    const hay = `${app.name || ''} ${app.description || ''}`.toLowerCase();
    return hay.includes(lower);
  });
  return { data: filtered, error: null };
}

// App versions
export async function getVersionsForApp(appId) {
  return supabase
    .from('app_versions')
    .select('id, version, release_notes, created_at')
    .eq('app_id', appId)
    .order('created_at', { ascending: false });
}

export async function addVersion(appId, version, releaseNotes) {
  return supabase.from('app_versions').insert({ app_id: appId, version, release_notes: releaseNotes });
}

// Ratings
export async function getRatingsForApp(appId) {
  return supabase
    .from('ratings')
    .select('id, rating, comment, created_at')
    .eq('app_id', appId)
    .order('created_at', { ascending: false });
}

export async function addRating(appId, rating, comment) {
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) return { data: null, error: error || new Error('Not authenticated') };

  return supabase.from('ratings').insert({ app_id: appId, user_id: user.id, rating, comment });
}
