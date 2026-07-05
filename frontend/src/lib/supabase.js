import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function isSupabaseConfigured() {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      !supabaseUrl.includes('YOUR_PROJECT') &&
      supabaseAnonKey !== 'your_anon_key_here'
  );
}

let client;

export function getSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env');
  }
  if (!client) {
    client = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return client;
}

export function throwIfError(error) {
  if (error) throw new Error(error.message);
}
