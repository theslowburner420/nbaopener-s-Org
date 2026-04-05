import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameState, ViewType, Card, User } from '../types';
import { supabase } from '../lib/supabase';

interface GameContextType extends GameState {
  isAuthLoading: boolean;
  setCoins: (coins: number | ((prev: number) => number)) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addToCollection: (cardIds: string[]) => void;
  addCustomCard: (card: Card) => void;
  setCurrentView: (view: ViewType) => void;
  unlockAchievement: (id: string) => void;
  claimReward: (day: number, amount: number) => void;
  addPackToInventory: (pack: { id: string; type: string; name: string }) => void;
  removePackFromInventory: (packId: string) => void;
  setPremium: (status: boolean) => void;
  resetGame: () => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(() => {
    return {
      user: null,
      coins: 500,
      collection: [],
      customCards: [],
      currentView: 'open',
      unlockedAchievements: [],
      lastClaimedDate: null,
      claimedDays: [],
      inventoryPacks: [],
      isPremium: false,
    };
  });

  const authProcessed = React.useRef(false);
  const isSyncingRef = useRef(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isInitialSyncDone, setIsInitialSyncDone] = useState(false);
  const stateRef = useRef(state);
  const profileSubscriptionRef = useRef<any>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const syncProfile = useCallback(async (user: any) => {
    if (isSyncingRef.current) return;
    
    if (!user) {
      console.log('👤 No user detected, clearing user state');
      setState(prev => ({ ...prev, user: null }));
      setIsInitialSyncDone(true);
      setIsAuthLoading(false);
      if (profileSubscriptionRef.current) {
        supabase?.removeChannel(profileSubscriptionRef.current);
        profileSubscriptionRef.current = null;
      }
      return;
    }

    isSyncingRef.current = true;
    console.log('🔄 STARTING IRON SYNC for user:', user.id);
    
    // Basic user info for UI
    const userData: User = {
      id: user.id,
      email: user.email,
      username: user.user_metadata?.full_name || user.email?.split('@')[0],
      avatar_url: user.user_metadata?.avatar_url,
    };

    try {
      // 1. Fetch Cloud Data
      const { data: cloudProfile, error } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // 2. Second Net Logic: Create profile if it doesn't exist
      if (!cloudProfile) {
        console.log('🚀 SECOND NET: Creating new profile for user:', user.id);
        const newProfile = {
          id: user.id,
          username: userData.username,
          avatar_url: userData.avatar_url,
          coins: 500,
          cards: [],
          custom_cards: [],
          unlocked_achievements: [],
          last_claimed_date: null,
          claimed_days: [],
          inventory_packs: [],
          ads_disabled: false,
          updated_at: new Date().toISOString(),
        };

        const { error: upsertError } = await supabase!.from('profiles').upsert(newProfile);
        
        if (upsertError) {
          console.error('❌ SECOND NET: Failed to create profile:', upsertError.message);
        }

        setState({
          ...newProfile,
          user: userData,
          collection: [],
          customCards: [],
          unlockedAchievements: [],
          lastClaimedDate: null,
          claimedDays: [],
          inventoryPacks: [],
          isPremium: false,
          currentView: stateRef.current.currentView
        });
      } 
      // 3. Cloud is Source of Truth: Load from Cloud
      else {
        console.log('📥 CLOUD SYNC: Loading profile from Supabase');
        setState({
          user: {
            ...userData,
            username: cloudProfile.username || userData.username,
            avatar_url: cloudProfile.avatar_url || userData.avatar_url,
          },
          coins: cloudProfile.coins ?? 500,
          collection: cloudProfile.cards || [],
          customCards: cloudProfile.custom_cards || [],
          unlockedAchievements: cloudProfile.unlocked_achievements || [],
          lastClaimedDate: cloudProfile.last_claimed_date || null,
          claimedDays: cloudProfile.claimed_days || [],
          inventoryPacks: cloudProfile.inventory_packs || [],
          isPremium: cloudProfile.ads_disabled || false,
          currentView: stateRef.current.currentView
        });
      }

      setIsInitialSyncDone(true);

      // 6. Real-time Subscription (Only for updates)
      if (!profileSubscriptionRef.current && supabase) {
        profileSubscriptionRef.current = supabase
          .channel(`profile_realtime_${user.id}`)
          .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'profiles', 
            filter: `id=eq.${user.id}` 
          }, (payload) => {
            console.log('🔔 Cloud update received via Real-time');
            const updated = payload.new as any;
            setState(prev => ({
              ...prev,
              coins: updated.coins ?? prev.coins,
              collection: updated.cards || prev.collection,
              inventoryPacks: updated.inventory_packs || prev.inventoryPacks,
              unlockedAchievements: updated.unlocked_achievements || prev.unlockedAchievements,
              isPremium: updated.ads_disabled || prev.isPremium,
            }));
          }).subscribe();
      }

    } catch (err) {
      console.error('❌ Unexpected error in syncProfile:', err);
      setIsInitialSyncDone(true);
    } finally {
      isSyncingRef.current = false;
      setIsAuthLoading(false);
    }
  }, []);

  // Auth and Profile sync setup
  useEffect(() => {
    if (!supabase) return;

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event, 'User:', session?.user?.id);
      // Always sync profile when auth state changes
      syncProfile(session?.user || null);
      
      // Clean URL if we have auth params (PKCE or Implicit)
      if (window.location.search.includes('code=') || window.location.hash.includes('access_token=')) {
        const url = new URL(window.location.href);
        url.search = '';
        url.hash = '';
        window.history.replaceState({}, document.title, url.toString());
      }
    });

    // Initial check for session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        console.log('Session found on mount:', session.user.id);
        syncProfile(session.user);
      } else {
        console.log('No session found on mount');
        setIsAuthLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (profileSubscriptionRef.current) {
        supabase.removeChannel(profileSubscriptionRef.current);
      }
    };
  }, [syncProfile]);

  // Handle Auth Callback (PKCE) - Simplified to just error handling since detectSessionInUrl is true
  useEffect(() => {
    if (!supabase) return;

    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    if (error || errorDescription) {
      console.error('Auth error detected in URL:', error, errorDescription);
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      url.searchParams.delete('error_description');
      window.history.replaceState({}, document.title, url.toString());
    }
  }, []);

  // Remove background sync and localStorage persistence to ensure Supabase is the only source of truth
  // and all updates are immediate via forceSyncToSupabase.
  
  const login = async () => {
    if (!supabase) {
      console.error('Supabase not configured');
      return;
    }
    const redirectTo = window.location.origin;
    console.log('Initiating Google Login, redirecting to:', redirectTo);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo
      }
    });
    if (error) console.error('Login error', error);
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  // Function to force immediate sync to Supabase with retries (IRON RULE: Write Confirmation)
  const forceSyncToSupabase = useCallback(async (newState: GameState, retries = 5) => {
    if (newState.user && supabase && isInitialSyncDone) {
      console.log('💾 IRON RULE: Executing IMMEDIATE cloud save with confirmation...');
      
      const performSave = async (attempt: number): Promise<boolean> => {
        try {
          const { error } = await supabase.from('profiles').upsert({
            id: newState.user!.id,
            coins: newState.coins,
            cards: newState.collection,
            custom_cards: newState.customCards,
            unlocked_achievements: newState.unlockedAchievements,
            last_claimed_date: newState.lastClaimedDate,
            claimed_days: newState.claimedDays,
            inventory_packs: newState.inventoryPacks,
            ads_disabled: newState.isPremium,
            updated_at: new Date().toISOString(),
          });
          
          if (error) {
            console.error(`❌ Cloud save attempt ${attempt} failed:`, error.message);
            return false;
          }
          
          console.log('✅ IRON RULE: Cloud save CONFIRMED (OK)');
          return true;
        } catch (err) {
          console.error(`❌ Unexpected error in cloud save attempt ${attempt}:`, err);
          return false;
        }
      };

      let success = await performSave(1);
      let currentAttempt = 1;

      while (!success && currentAttempt < retries) {
        currentAttempt++;
        const delay = 1000 * Math.pow(2, currentAttempt - 1); // Exponential backoff
        console.log(`🔄 IRON RULE: Retrying cloud save in ${delay}ms (Attempt ${currentAttempt}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        success = await performSave(currentAttempt);
      }

      if (!success) {
        console.error('🚨 CRITICAL: ALL cloud save attempts failed. Data is NOT secure in cloud.');
      }
    }
  }, [isInitialSyncDone]);

  const setCoins = useCallback((coins: number | ((prev: number) => number)) => {
    setState(prev => {
      const newCoins = typeof coins === 'function' ? coins(prev.coins) : coins;
      const newState = { ...prev, coins: newCoins };
      forceSyncToSupabase(newState);
      return newState;
    });
  }, [forceSyncToSupabase]);

  const addCoins = useCallback((amount: number) => {
    const newState = { ...stateRef.current, coins: stateRef.current.coins + amount };
    setState(newState);
    forceSyncToSupabase(newState);
  }, [forceSyncToSupabase]);

  const spendCoins = useCallback((amount: number) => {
    if (stateRef.current.coins >= amount) {
      const newState = { ...stateRef.current, coins: stateRef.current.coins - amount };
      setState(newState);
      forceSyncToSupabase(newState);
      return true;
    }
    return false;
  }, [forceSyncToSupabase]);

  const addToCollection = useCallback((cardIds: string[]) => {
    const newState = { ...stateRef.current, collection: [...stateRef.current.collection, ...cardIds] };
    setState(newState);
    forceSyncToSupabase(newState);
  }, [forceSyncToSupabase]);

  const addCustomCard = useCallback((card: Card) => {
    const newState = { ...stateRef.current, customCards: [...stateRef.current.customCards, card] };
    setState(newState);
    forceSyncToSupabase(newState);
  }, [forceSyncToSupabase]);

  const setCurrentView = useCallback((currentView: ViewType) => {
    const newState = { ...stateRef.current, currentView };
    setState(newState);
  }, []);

  const unlockAchievement = useCallback((id: string) => {
    if (stateRef.current.unlockedAchievements.includes(id)) return;
    const newState = { ...stateRef.current, unlockedAchievements: [...stateRef.current.unlockedAchievements, id] };
    setState(newState);
    forceSyncToSupabase(newState);
  }, [forceSyncToSupabase]);

  const claimReward = useCallback((day: number, amount: number) => {
    const newState = {
      ...stateRef.current,
      coins: stateRef.current.coins + amount,
      claimedDays: [...stateRef.current.claimedDays, day],
      lastClaimedDate: new Date().toISOString().split('T')[0]
    };
    setState(newState);
    forceSyncToSupabase(newState);
  }, [forceSyncToSupabase]);

  const addPackToInventory = useCallback((pack: { id: string; type: string; name: string }) => {
    const existing = stateRef.current.inventoryPacks.find(p => p.id === pack.id);
    let newState;
    if (existing) {
      newState = {
        ...stateRef.current,
        inventoryPacks: stateRef.current.inventoryPacks.map(p => p.id === pack.id ? { ...p, count: p.count + 1 } : p)
      };
    } else {
      newState = {
        ...stateRef.current,
        inventoryPacks: [...stateRef.current.inventoryPacks, { ...pack, count: 1 }]
      };
    }
    setState(newState);
    forceSyncToSupabase(newState);
  }, [forceSyncToSupabase]);

  const removePackFromInventory = useCallback((packId: string) => {
    const existing = stateRef.current.inventoryPacks.find(p => p.id === packId);
    if (!existing) return;
    
    let newState;
    if (existing.count > 1) {
      newState = {
        ...stateRef.current,
        inventoryPacks: stateRef.current.inventoryPacks.map(p => p.id === packId ? { ...p, count: p.count - 1 } : p)
      };
    } else {
      newState = {
        ...stateRef.current,
        inventoryPacks: stateRef.current.inventoryPacks.filter(p => p.id !== packId)
      };
    }
    setState(newState);
    forceSyncToSupabase(newState);
  }, [forceSyncToSupabase]);

  const setPremium = useCallback((isPremium: boolean) => {
    const newState = { ...stateRef.current, isPremium };
    setState(newState);
    forceSyncToSupabase(newState);
  }, [forceSyncToSupabase]);

  const resetGame = useCallback(async () => {
    const confirmReset = window.confirm("Are you sure you want to reset all progress? This cannot be undone.");
    if (!confirmReset) return;

    const newState = {
      ...stateRef.current,
      coins: 500,
      collection: [],
      customCards: [],
      unlockedAchievements: [],
      lastClaimedDate: null,
      claimedDays: [],
      inventoryPacks: [],
      isPremium: false,
    };

    setState(newState);

    // If logged in, force immediate sync
    if (newState.user) {
      forceSyncToSupabase(newState);
    }
  }, [forceSyncToSupabase]);

  const contextValue = useMemo(() => ({
    ...state,
    isAuthLoading,
    setCoins,
    addCoins,
    spendCoins,
    addToCollection,
    addCustomCard,
    setCurrentView,
    unlockAchievement,
    claimReward,
    addPackToInventory,
    removePackFromInventory,
    setPremium,
    resetGame,
    login,
    logout
  }), [state, isAuthLoading, setCoins, addCoins, spendCoins, addToCollection, addCustomCard, setCurrentView, unlockAchievement, claimReward, addPackToInventory, removePackFromInventory, setPremium, resetGame, login, logout]);

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};
