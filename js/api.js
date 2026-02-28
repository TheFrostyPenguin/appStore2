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

  if (error) {
    return { data, error };
  }

  if (!data) {
    console.warn('No accounts row for this auth user. Creating default member row...');
    const { data: created, error: createError } = await supabase
      .from('accounts')
      .upsert(
        {
          id: user.id,
          email: user.email || null,
          role: 'member',
          full_name: user.user_metadata?.full_name || null
        },
        { onConflict: 'id' }
      )
      .select('*')
      .maybeSingle();

    if (createError) {
      return { data: null, error: createError };
    }

    return { data: created, error: null };
  }

  return { data, error: null };
}

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName || null }
    }
  });

  if (error || !data?.user) {
    return { data, error };
  }

  const { error: accountError } = await supabase.from('accounts').upsert(
    {
      id: data.user.id,
      email: data.user.email || email,
      role: 'member',
      full_name: fullName || data.user.user_metadata?.full_name || null
    },
    { onConflict: 'id' }
  );

  if (accountError) {
    return { data, error: accountError };
  }

  return { data, error: null };
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
export async function getMarketplaces(options = {}) {
  const { sortBy = 'name', direction = 'asc' } = options;

  let query = supabase.from('categories').select('id, name, slug, description, updated_at');

  if (sortBy === 'updated_at') {
    query = query.order('updated_at', { ascending: direction === 'asc' });
  } else {
    query = query.order('name', { ascending: direction === 'asc' });
  }

  const { data, error } = await query;
  if (error) {
    console.error('Failed to load marketplaces', error);
  }
  return { data, error };
}

export async function getAllCategories(options = {}) {
  // Backward compatibility shim to use the new, sortable marketplace loader
  return getMarketplaces(options);
}

export async function getCategoryBySlug(slug) {
  return supabase
    .from('categories')
    .select('id, name, slug, description')
    .eq('slug', slug)
    .maybeSingle();
}

export async function getCategoryById(id) {
  return supabase
    .from('categories')
    .select('id, name, slug, description')
    .eq('id', id)
    .maybeSingle();
}

export async function createCategory(payload) {
  return supabase.from('categories').insert(payload);
}

export async function updateCategory(id, payload) {
  return supabase.from('categories').update(payload).eq('id', id);
}

export async function deleteMarketplace(marketplaceId) {
  const { error } = await supabase.from('categories').delete().eq('id', marketplaceId);
  if (error) console.error('deleteMarketplace failed', error);
  return { error };
}

// Apps
export async function getAppsByCategorySlug(slug, options = {}) {
  const { sortBy = 'name', direction = 'asc' } = options;

  let query = supabase
    .from('apps')
    .select(
      'id, name, description, image, status, category_slug, version, developer, system_requirements, file_path, file_name, updated_at'
    )
    .eq('category_slug', slug);

  if (sortBy === 'updated_at') {
    query = query.order('updated_at', { ascending: direction === 'asc' });
  } else {
    query = query.order('name', { ascending: direction === 'asc' });
  }

  const { data, error } = await query;
  if (error) {
    console.error('Failed to load apps for category', error);
  }
  return { data, error };
}

export async function getAllApps() {
  return supabase
    .from('apps')
    .select('id, name, description, image, status, category_slug, version, developer, system_requirements, file_path, file_name, updated_at')
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
  return supabase.from('apps').insert(payload).select('*').maybeSingle();
}

export async function updateApp(id, payload) {
  return supabase.from('apps').update(payload).eq('id', id);
}

export async function deleteApp(appId) {
  const { error } = await supabase.from('apps').delete().eq('id', appId);
  if (error) console.error('deleteApp failed', error);
  return { error };
}

export async function uploadAppFile(appId, file) {
  if (!file) return { data: null, error: null };

  const originalName = file.name || '';
  const ext = originalName.includes('.') ? originalName.split('.').pop() : 'bin';
  const timestamp = Date.now();
  const filePath = `apps/${appId}/${timestamp}.${ext}`;

  const { data: uploadData, error: uploadError } = await supabase.storage.from('app-files').upload(filePath, file, {
    cacheControl: '3600',
    upsert: true
  });

  if (uploadError) {
    console.error('Failed to upload app file', uploadError);
    return { data: null, error: uploadError };
  }

  const { data: appData, error: updateError } = await supabase
    .from('apps')
    .update({
      file_path: filePath,
      file_name: originalName,
      file_size: file.size,
      file_type: file.type || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', appId)
    .select('id, file_path, file_name, file_size, file_type')
    .maybeSingle();

  if (updateError) {
    console.error('Failed to update app with file info', updateError);
    return { data: null, error: updateError };
  }

  return { data: appData, error: null };
}

export async function getAppDownloadUrl(app) {
  if (!app || !app.file_path) {
    return { url: null, error: null };
  }

  const { data, error } = await supabase.storage.from('app-files').createSignedUrl(app.file_path, 60);

  // For public buckets we would call getPublicUrl, but this bucket is private so we always sign.
  // If bucket ever becomes public:
  // const { data: pub } = supabase.storage.from('app-files').getPublicUrl(app.file_path);
  // return { url: pub?.publicUrl || null, error: null };
  if (error) {
    console.error('Failed to create signed download URL', error);
    return { url: null, error };
  }

  return { url: data?.signedUrl || null, error: null };
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

// Analytics helpers
export async function getAllAppsForAnalytics() {
  const { data, error } = await supabase
    .from('apps')
    .select('id, name, image, category_slug, download_count, created_at, updated_at');

  if (error) {
    const missingColumns = error.code === '42703' || error.status === 400;
    if (missingColumns) {
      console.error('Missing analytics columns in apps table. Run migrations.', error);
      return { data: null, error, analyticsColumnsMissing: true };
    }

    console.error('Failed to load apps for analytics', error);
  }

  return { data, error, analyticsColumnsMissing: false };
}

export async function getRatingsForAnalytics() {
  const { data, error } = await supabase.from('ratings').select('app_id, rating');

  if (error) {
    console.error('Failed to load ratings for analytics', error);
  }

  return { data, error };
}

export async function getAverageRatingsMap() {
  const { data, error } = await getRatingsForAnalytics();
  if (error) {
    return { map: {}, error };
  }

  const map = {};
  (data || []).forEach(row => {
    if (!row.app_id) return;
    map[row.app_id] = map[row.app_id] || { total: 0, count: 0 };
    map[row.app_id].total += row.rating || 0;
    map[row.app_id].count += 1;
  });

  const averaged = {};
  Object.entries(map).forEach(([appId, agg]) => {
    averaged[appId] = {
      avgRating: agg.count ? agg.total / agg.count : 0,
      count: agg.count
    };
  });

  return { map: averaged, error: null };
}

export async function getCategoriesMap() {
  const { data, error } = await supabase.from('categories').select('id, name, slug');

  if (error) {
    console.error('Failed to load categories map', error);
    return { map: {}, error };
  }

  const map = {};
  (data || []).forEach(cat => {
    map[cat.slug] = cat.name;
  });

  return { map, error: null };
}

// SQL (run in Supabase):
// create or replace function public.increment_app_download(p_app_id uuid)
// returns void as $$
// begin
//   update public.apps
//   set download_count = coalesce(download_count, 0) + 1,
//       updated_at = now()
//   where id = p_app_id;
// end;
// $$ language plpgsql;
export async function incrementAppDownloadCount(appId) {
  const { data, error } = await supabase.rpc('increment_app_download', { p_app_id: appId });
  if (!error) {
    return { data, error: null };
  }

  console.error('incrementAppDownloadCount failed', error);

  // Fallback (not perfectly atomic): read current count then write count + 1.
  const { data: appRow, error: readError } = await supabase
    .from('apps')
    .select('download_count')
    .eq('id', appId)
    .maybeSingle();

  if (readError) {
    console.error('incrementAppDownloadCount fallback read failed', readError);
    return { data: null, error: readError };
  }

  const nextCount = Number(appRow?.download_count || 0) + 1;
  const { data: updated, error: updateError } = await supabase
    .from('apps')
    .update({ download_count: nextCount })
    .eq('id', appId)
    .select('id, download_count')
    .maybeSingle();

  if (updateError) {
    console.error('incrementAppDownloadCount fallback update failed', updateError);
    return { data: null, error: updateError };
  }

  return { data: updated, error: null };
}
