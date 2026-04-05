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
  updateGameState: (updates: Partial<GameState>) => void;
  forceSync: () => Promise<void>;
  isSaving: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(() => {
    // Try to load guest progress if it exists
    const saved = localStorage.getItem('GUEST_PROGRESS');
    const initialGuestState = saved ? JSON.parse(saved) : null;

    return {
      user: null,
      coins: initialGuestState?.coins ?? 500,
      collection: initialGuestState?.collection ?? [],
      customCards: initialGuestState?.customCards ?? [],
      currentView: 'open',
      unlockedAchievements: initialGuestState?.unlockedAchievements ?? [],
      lastClaimedDate: initialGuestState?.lastClaimedDate ?? null,
      claimedDays: initialGuestState?.claimedDays ?? [],
      inventoryPacks: initialGuestState?.inventoryPacks ?? [],
      isPremium: initialGuestState?.isPremium ?? false,
    };
  });

  const authProcessed = React.useRef(false);
  const isSyncingRef = useRef(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isInitialSyncDone, setIsInitialSyncDone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const stateRef = useRef(state);
  const profileSubscriptionRef = useRef<any>(null);

  useEffect(() => {
    stateRef.current = state;
    // Save guest progress to localStorage ONLY if not logged in
    if (!state.user) {
      const guestData = {
        coins: state.coins,
        collection: state.collection,
        customCards: state.customCards,
        unlockedAchievements: state.unlockedAchievements,
        lastClaimedDate: state.lastClaimedDate,
        claimedDays: state.claimedDays,
        inventoryPacks: state.inventoryPacks,
        isPremium: state.isPremium,
      };
      localStorage.setItem('GUEST_PROGRESS', JSON.stringify(guestData));
    }
  }, [state]);

  const syncProfile = useCallback(async (user: any) => {
    if (isSyncingRef.current) return;
    
    if (!user) {
      console.log('👤 No user detected, keeping guest state');
      setState(prev => ({ ...prev, user: null }));
      setIsInitialSyncDone(true);
      setIsAuthLoading(false);
      return;
    }

    isSyncingRef.current = true;
    console.log('🔄 STARTING DEFINITIVE SYNC for user:', user.id);
    
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

      // 2. Load Local Data for merging (prefer live state over localStorage)
      const liveState = stateRef.current;
      const savedGuest = localStorage.getItem('GUEST_PROGRESS');
      const guestData = savedGuest ? JSON.parse(savedGuest) : null;
      
      // Use the most advanced data available (live state or guest storage)
      const localData = {
        coins: Math.max(liveState.coins, guestData?.coins ?? 0),
        collection: Array.from(new Set([...liveState.collection, ...(guestData?.collection || [])])),
        customCards: Array.from(new Set([...liveState.customCards, ...(guestData?.customCards || [])])),
        unlockedAchievements: Array.from(new Set([...liveState.unlockedAchievements, ...(guestData?.unlockedAchievements || [])])),
        inventoryPacks: liveState.inventoryPacks.length > 0 ? liveState.inventoryPacks : (guestData?.inventoryPacks || []),
        claimedDays: Array.from(new Set([...liveState.claimedDays, ...(guestData?.claimedDays || [])])),
        lastClaimedDate: liveState.lastClaimedDate || guestData?.lastClaimedDate,
        isPremium: liveState.isPremium || guestData?.isPremium || false,
      };

      let finalState: Partial<GameState>;

      if (!cloudProfile) {
        console.log('🚀 PROFILE GUARANTEE: Creating new profile for user:', user.id);
        finalState = localData;
      } else {
        console.log('📥 CLOUD SYNC: Prioritizing cloud data');
        
        // If cloud profile exists, we use it as the definitive state.
        // We only merge local guest progress if it's the VERY FIRST time the user logs in
        // and they have significant progress locally (e.g. more coins or cards).
        // If they are a returning user, cloud is the source of truth.
        
        const isFreshGuest = localData.coins === 500 && localData.collection.length === 0;
        
        if (isFreshGuest) {
          // Returning user with no new guest progress, just use cloud.
          finalState = {
            coins: cloudProfile.coins ?? 0,
            collection: cloudProfile.cards || [],
            customCards: cloudProfile.custom_cards || [],
            unlockedAchievements: cloudProfile.unlocked_achievements || [],
            lastClaimedDate: cloudProfile.last_claimed_date,
            claimedDays: cloudProfile.claimed_days || [],
            inventoryPacks: cloudProfile.inventory_packs || [],
            isPremium: cloudProfile.ads_disabled || false,
          };
        } else {
          // User played as guest before logging in, merge local progress into cloud.
          const mergeArrays = (arr1: any[], arr2: any[]) => {
            const set = new Set([...(arr1 || []), ...(arr2 || [])]);
            return Array.from(set);
          };

          const mergePacks = (packs1: any[], packs2: any[]) => {
            const map = new Map();
            [...(packs1 || []), ...(packs2 || [])].forEach(p => {
              if (map.has(p.id)) {
                map.get(p.id).count = Math.max(map.get(p.id).count, p.count || 1);
              } else {
                map.set(p.id, { ...p, count: p.count || 1 });
              }
            });
            return Array.from(map.values());
          };

          finalState = {
            coins: Math.max(cloudProfile.coins ?? 0, localData.coins),
            collection: mergeArrays(cloudProfile.cards, localData.collection),
            customCards: mergeArrays(cloudProfile.custom_cards, localData.customCards),
            unlockedAchievements: mergeArrays(cloudProfile.unlocked_achievements, localData.unlockedAchievements),
            lastClaimedDate: cloudProfile.last_claimed_date || localData.lastClaimedDate,
            claimedDays: mergeArrays(cloudProfile.claimed_days, localData.claimedDays),
            inventoryPacks: mergePacks(cloudProfile.inventory_packs, localData.inventoryPacks),
            isPremium: cloudProfile.ads_disabled || localData.isPremium || false,
          };
        }
      }

      // 3. Push the definitive state to Supabase (UPSERT)
      const { error: upsertError } = await supabase!.from('profiles').upsert({
        id: user.id,
        username: userData.username,
        avatar_url: userData.avatar_url,
        coins: finalState.coins,
        cards: finalState.collection,
        custom_cards: finalState.customCards,
        unlocked_achievements: finalState.unlockedAchievements,
        last_claimed_date: finalState.lastClaimedDate,
        claimed_days: finalState.claimedDays,
        inventory_packs: finalState.inventoryPacks,
        ads_disabled: finalState.isPremium,
        updated_at: new Date().toISOString(),
      });

      if (upsertError) {
        console.error('❌ SYNC ERROR: Failed to push definitive state:', upsertError.message);
      } else {
        console.log('✅ SYNC SUCCESS: Cloud is now source of truth. Clearing guest data.');
        localStorage.removeItem('GUEST_PROGRESS');
      }

      // 4. Update Local State
      setState({
        ...stateRef.current,
        ...finalState,
        user: userData,
      } as GameState);

      setIsInitialSyncDone(true);

      // 5. Real-time Subscription
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
    if (newState.user && supabase) {
      setIsSaving(true);
      console.log('💾 CLOUD SAVE: Initiating immediate sync for user:', newState.user.id);
      
      const performSave = async (attempt: number): Promise<boolean> => {
        try {
          const { data, error } = await supabase.from('profiles').upsert({
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
          }).select().single();
          
          if (error) {
            console.error(`❌ CLOUD SAVE ERROR (Attempt ${attempt}):`, error.message);
            return false;
          }
          
          return true;
        } catch (err) {
          console.error(`❌ UNEXPECTED SYNC ERROR (Attempt ${attempt}):`, err);
          return false;
        }
      };

      let success = await performSave(1);
      let currentAttempt = 1;

      while (!success && currentAttempt < retries) {
        currentAttempt++;
        const delay = 1000 * Math.pow(2, currentAttempt - 1);
        console.log(`🔄 SYNC RETRY: Attempt ${currentAttempt}/${retries} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        success = await performSave(currentAttempt);
      }

      if (!success) {
        console.error('🚨 CRITICAL SYNC FAILURE: Could not persist progress to cloud after multiple attempts.');
      }
      
      // Artificial delay to ensure the user sees the "Saving" indicator if it's too fast
      setTimeout(() => setIsSaving(false), 800);
    }
  }, []);

  // Optimized batch update to prevent redundant network calls
  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      forceSyncToSupabase(newState);
      return newState;
    });
  }, [forceSyncToSupabase]);

  const setCoins = useCallback((coins: number | ((prev: number) => number)) => {
    setState(prev => {
      const newCoins = typeof coins === 'function' ? coins(prev.coins) : coins;
      const newState = { ...prev, coins: newCoins };
      forceSyncToSupabase(newState);
      return newState;
    });
  }, [forceSyncToSupabase]);

  const addCoins = useCallback((amount: number) => {
    setState(prev => {
      const newState = { ...prev, coins: prev.coins + amount };
      forceSyncToSupabase(newState);
      return newState;
    });
  }, [forceSyncToSupabase]);

  const spendCoins = useCallback((amount: number) => {
    let success = false;
    setState(prev => {
      if (prev.coins >= amount) {
        success = true;
        const newState = { ...prev, coins: prev.coins - amount };
        forceSyncToSupabase(newState);
        return newState;
      }
      return prev;
    });
    return success;
  }, [forceSyncToSupabase]);

  const addToCollection = useCallback((cardIds: string[]) => {
    setState(prev => {
      const newState = { ...prev, collection: [...prev.collection, ...cardIds] };
      forceSyncToSupabase(newState);
      return newState;
    });
  }, [forceSyncToSupabase]);

  const addCustomCard = useCallback((card: Card) => {
    setState(prev => {
      const newState = { ...prev, customCards: [...prev.customCards, card] };
      forceSyncToSupabase(newState);
      return newState;
    });
  }, [forceSyncToSupabase]);

  const setCurrentView = useCallback((currentView: ViewType) => {
    setState(prev => ({ ...prev, currentView }));
  }, []);

  const unlockAchievement = useCallback((id: string) => {
    setState(prev => {
      if (prev.unlockedAchievements.includes(id)) return prev;
      const newState = { ...prev, unlockedAchievements: [...prev.unlockedAchievements, id] };
      forceSyncToSupabase(newState);
      return newState;
    });
  }, [forceSyncToSupabase]);

  const claimReward = useCallback((day: number, amount: number) => {
    setState(prev => {
      const newState = {
        ...prev,
        coins: prev.coins + amount,
        claimedDays: [...prev.claimedDays, day],
        lastClaimedDate: new Date().toISOString().split('T')[0]
      };
      forceSyncToSupabase(newState);
      return newState;
    });
  }, [forceSyncToSupabase]);

  const addPackToInventory = useCallback((pack: { id: string; type: string; name: string }) => {
    setState(prev => {
      const existing = prev.inventoryPacks.find(p => p.id === pack.id);
      let newState;
      if (existing) {
        newState = {
          ...prev,
          inventoryPacks: prev.inventoryPacks.map(p => p.id === pack.id ? { ...p, count: p.count + 1 } : p)
        };
      } else {
        newState = {
          ...prev,
          inventoryPacks: [...prev.inventoryPacks, { ...pack, count: 1 }]
        };
      }
      forceSyncToSupabase(newState);
      return newState;
    });
  }, [forceSyncToSupabase]);

  const removePackFromInventory = useCallback((packId: string) => {
    setState(prev => {
      const existing = prev.inventoryPacks.find(p => p.id === packId);
      if (!existing) return prev;
      
      let newState;
      if (existing.count > 1) {
        newState = {
          ...prev,
          inventoryPacks: prev.inventoryPacks.map(p => p.id === packId ? { ...p, count: p.count - 1 } : p)
        };
      } else {
        newState = {
          ...prev,
          inventoryPacks: prev.inventoryPacks.filter(p => p.id !== packId)
        };
      }
      forceSyncToSupabase(newState);
      return newState;
    });
  }, [forceSyncToSupabase]);

  const setPremium = useCallback((isPremium: boolean) => {
    setState(prev => {
      const newState = { ...prev, isPremium };
      forceSyncToSupabase(newState);
      return newState;
    });
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

  const forceSync = useCallback(async () => {
    if (stateRef.current.user) {
      await forceSyncToSupabase(stateRef.current);
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
    updateGameState,
    forceSync,
    isSaving,
    login,
    logout
  }), [state, isAuthLoading, setCoins, addCoins, spendCoins, addToCollection, addCustomCard, setCurrentView, unlockAchievement, claimReward, addPackToInventory, removePackFromInventory, setPremium, resetGame, updateGameState, forceSync, isSaving, login, logout]);

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
