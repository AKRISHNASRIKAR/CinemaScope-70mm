// Supabase client singleton.
// Import this everywhere instead of calling createClient() directly so that
// only one WebSocket connection and one session cache exist in the app.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // handles OAuth redirect callback automatically
  },
});

// Edge Function base URL — all TMDB and user data requests go here.
// The anon key is safe to include in the frontend; RLS enforces access control.
export const FUNCTIONS_URL = `${supabaseUrl}/functions/v1`;
