import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const resolvedUrl = window.SUPABASE_URL || window.env?.SUPABASE_URL || localStorage.getItem('SUPABASE_URL');
const resolvedKey = window.SUPABASE_ANON_KEY || window.env?.SUPABASE_ANON_KEY || localStorage.getItem('SUPABASE_ANON_KEY');

const supabaseUrl = resolvedUrl || 'https://lleehmgwruvxcfkjnfvn.supabase.co';
const supabaseKey = resolvedKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsZWVobWd3cnV2eGNma2puZnZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNTE3NzgsImV4cCI6MjA3OTgyNzc3OH0.-R-r5IPyE_lW_YS0gGlW5TEq6x1pAgsh560FxnGttNU';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials missing. Set SUPABASE_URL and SUPABASE_ANON_KEY on window or localStorage.');
}

const supabase = window.supabaseClient || createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: true }
});

window.supabaseClient = supabase;
export { supabase };
export const supabaseConfig = { supabaseUrl, supabaseKey };
