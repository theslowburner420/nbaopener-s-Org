import { createClient } from '@supabase/supabase-js';

// Sanitize Supabase URL to guarantee https:// protocol and prevent insecure ws:// fallbacks in WebKit/Safari
function sanitizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return '';
  let cleaned = rawUrl.trim();
  if (cleaned.startsWith('http://')) {
    cleaned = cleaned.replace(/^http:\/\//i, 'https://');
  } else if (!cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned.replace(/\/+$/, '');
}

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseUrl = sanitizeSupabaseUrl(rawSupabaseUrl);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'nba-opener-auth'
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
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
