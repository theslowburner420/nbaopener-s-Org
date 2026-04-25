import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'nba-opener-auth'
      }
    }) 
  : null;

export interface Profile {
  id: string;
  coins: number;
  cards: string[];
  custom_cards?: any[];
  unlocked_achievements: string[];
  last_claimed_date?: string | null;
  claimed_days?: number[];
  inventory_packs: any[];
  username?: string;
  avatar_url?: string;
  updated_at?: string;
  ads_disabled?: boolean;
  franchise_state?: string | null;
}
