import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export interface Profile {
  id: string;
  coins: number;
  cards: string[];
  username?: string;
  avatar_url?: string;
  updated_at?: string;
  ads_disabled?: boolean;
}
