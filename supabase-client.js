import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const resolvedUrl = window.SUPABASE_URL || window.env?.SUPABASE_URL || localStorage.getItem('SUPABASE_URL');
const resolvedKey = window.SUPABASE_ANON_KEY || window.env?.SUPABASE_ANON_KEY || localStorage.getItem('SUPABASE_ANON_KEY');

const supabaseUrl = resolvedUrl || 'https://your-supabase-project-url.supabase.co';
const supabaseKey = resolvedKey || 'your-public-anon-key';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials missing. Set SUPABASE_URL and SUPABASE_ANON_KEY on window or localStorage.');
}

const supabase = window.supabaseClient || createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: true }
});

window.supabaseClient = supabase;
export { supabase };
export const supabaseConfig = { supabaseUrl, supabaseKey };
