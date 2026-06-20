import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://sjrjqbssvzeuqfzlcmfs.supabase.co';
// Allows the user to paste their key directly below OR use the environment variable
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Lj38Kx7v8AEDZSDRzogCXw_NCtd0j08';

export const isSupabaseConfigured = () => {
  return (
    supabaseAnonKey &&
    supabaseAnonKey !== 'YOUR_CURRENT_SUPABASE_ANON_KEY' &&
    supabaseAnonKey !== 'your_anon_key_here' &&
    supabaseAnonKey.length > 25
  );
};

export const supabase = createClient(supabaseUrl, isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-key');
