import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameState, ViewType, Card, User } from '../types';
import { supabase } from '../lib/supabase';

interface GameContextType extends GameState {
  isAuthLoading: boolean;
  isInitialSyncDone: boolean;
  isOffline: boolean;
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
      currentView: 'home',
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
  const [isOffline, setIsOffline] = useState(false);
  const [showWelcomeGift, setShowWelcomeGift] = useState(false);
  const stateRef = useRef(state);
  const lastSyncedStateRef = useRef<string>('');
  const lastReceivedCloudStateRef = useRef<string>('');
  const profileSubscriptionRef = useRef<any>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    console.log('🔄 STARTING SYNC PIPELINE for user:', user.id);
    
    const userData: User = {
      id: user.id,
      email: user.email,
      username: user.user_metadata?.full_name || user.email?.split('@')[0],
      avatar_url: user.user_metadata?.avatar_url,
    };

    // --- OPTIMISTIC HYDRATION ---
    // Load local data immediately to unblock the UI
    const liveState = stateRef.current;
    const savedGuest = localStorage.getItem('GUEST_PROGRESS');
    let guestData = null;
    try {
      guestData = savedGuest ? JSON.parse(savedGuest) : null;
    } catch (e) {
      console.error('Failed to parse guest progress', e);
    }
    
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

    // Set initial state from local data immediately
    setState(prev => ({
      ...prev,
      ...localData,
      user: userData,
    }));

    // Unblock UI immediately (Optimistic UI)
    setIsInitialSyncDone(true);
    setIsAuthLoading(false);

    // --- BACKGROUND CLOUD SYNC ---
    try {
      const { data: cloudProfile, error: fetchError } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ CLOUD FETCH ERROR:', fetchError);
        setIsOffline(true);
      } else {
        setIsOffline(false);
      }

      let finalState: Partial<GameState>;

      if (!cloudProfile) {
        console.log('🚀 NEW USER REGISTRATION: Granting welcome gift');
        // Grant 50,000 coins and 3 MVP Packs
        finalState = {
          ...localData,
          coins: 50000,
          inventoryPacks: [
            ...localData.inventoryPacks,
            { id: `gift-${Date.now()}`, type: 'mvp', name: 'Finals MVP Pack', count: 3 }
          ]
        };
        setShowWelcomeGift(true);
      } else {
        console.log('📥 CLOUD DATA FOUND: Merging with local progress');
        
        const parsedCloud = {
          coins: Number(cloudProfile.coins) || 0,
          cards: Array.isArray(cloudProfile.cards) ? cloudProfile.cards : [],
          unlocked_achievements: Array.isArray(cloudProfile.unlocked_achievements) ? cloudProfile.unlocked_achievements : [],
          inventory_packs: Array.isArray(cloudProfile.inventory_packs) ? cloudProfile.inventory_packs : [],
          ads_disabled: !!cloudProfile.ads_disabled,
        };

        // Update the last received cloud state to prevent loops
        lastReceivedCloudStateRef.current = JSON.stringify({
          coins: parsedCloud.coins,
          collection: parsedCloud.cards,
          inventoryPacks: parsedCloud.inventory_packs,
          unlockedAchievements: parsedCloud.unlocked_achievements,
          isPremium: parsedCloud.ads_disabled,
        });

        const isFreshGuest = localData.coins === 500 && localData.collection.length === 0;
        
        if (isFreshGuest) {
          finalState = {
            coins: parsedCloud.coins,
            collection: parsedCloud.cards,
            unlockedAchievements: parsedCloud.unlocked_achievements,
            inventoryPacks: parsedCloud.inventory_packs,
            isPremium: parsedCloud.ads_disabled,
          };
        } else {
          const mergeArrays = (arr1: any[], arr2: any[]) => {
            const set = new Set([...(arr1 || []), ...(arr2 || [])]);
            return Array.from(set);
          };

          const mergePacks = (packs1: any[], packs2: any[]) => {
            const map = new Map();
            [...(packs1 || []), ...(packs2 || [])].forEach(p => {
              if (p && p.id) {
                if (map.has(p.id)) {
                  map.get(p.id).count = Math.max(map.get(p.id).count, p.count || 1);
                } else {
                  map.set(p.id, { ...p, count: p.count || 1 });
                }
              }
            });
            return Array.from(map.values());
          };

          finalState = {
            coins: Math.max(parsedCloud.coins, localData.coins),
            collection: mergeArrays(parsedCloud.cards, localData.collection),
            unlockedAchievements: mergeArrays(parsedCloud.unlocked_achievements, localData.unlockedAchievements),
            inventoryPacks: mergePacks(parsedCloud.inventory_packs, localData.inventoryPacks),
            isPremium: parsedCloud.ads_disabled || localData.isPremium || false,
          };
        }
      }

      // Sync definitive state back to cloud
      await forceSyncToSupabase({
        ...stateRef.current,
        ...finalState,
        user: userData,
      } as GameState);

      // Update local state with merged data
      setState(prev => ({
        ...prev,
        ...finalState,
        user: userData,
      }));

      // Setup Real-time Subscription
      if (!profileSubscriptionRef.current && supabase) {
        profileSubscriptionRef.current = supabase
          .channel(`profile_realtime_${user.id}`)
          .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'profiles', 
            filter: `id=eq.${user.id}` 
          }, (payload) => {
            const updated = payload.new as any;
            const receivedString = JSON.stringify({
              coins: updated.coins,
              collection: updated.cards,
              inventoryPacks: updated.inventory_packs,
              unlockedAchievements: updated.unlocked_achievements,
              isPremium: updated.ads_disabled,
            });

            if (receivedString === lastSyncedStateRef.current || receivedString === lastReceivedCloudStateRef.current) {
              return;
            }

            console.log('🔔 CLOUD UPDATE: Received via Real-time');
            lastReceivedCloudStateRef.current = receivedString;
            
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
      console.error('❌ BACKGROUND SYNC ERROR:', err);
      setIsOffline(true);
    } finally {
      isSyncingRef.current = false;
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
    try {
      if (!newState.user || !supabase) return;

      // Validation of UUID
      console.log('🔍 VALIDATING UUID:', newState.user?.id);
      if (!newState.user?.id) {
        console.error('❌ UUID VALIDATION FAILED: user.id is null or undefined');
        return;
      }

      // Payload Cleanup & Data Mapping Validation
      // We only include columns that exist in the CSV/Table to avoid 400 errors
      const payload = {
        username: newState.user.username,
        avatar_url: newState.user.avatar_url,
        coins: Number(newState.coins) || 0,
        // Serialización Estricta: Ensure arrays are sent as arrays (JSONB)
        cards: Array.isArray(newState.collection) ? newState.collection : [],
        unlocked_achievements: Array.isArray(newState.unlockedAchievements) ? newState.unlockedAchievements : [],
        inventory_packs: Array.isArray(newState.inventoryPacks) ? newState.inventoryPacks : [],
        ads_disabled: !!newState.isPremium,
        updated_at: new Date().toISOString(),
      };

      const stateString = JSON.stringify({
        coins: payload.coins,
        collection: payload.cards,
        unlockedAchievements: payload.unlocked_achievements,
        inventoryPacks: payload.inventory_packs,
        isPremium: payload.ads_disabled,
      });

      if (stateString === lastSyncedStateRef.current) {
        return;
      }

      setIsSaving(true);
      console.log('📤 CLOUD SYNC: Attempting to save state...', payload);
      
      const performSave = async (attempt: number): Promise<boolean> => {
        try {
          // Use .update().eq() for existing profiles
          const { error } = await supabase!
            .from('profiles')
            .update(payload)
            .eq('id', newState.user!.id);
          
          if (error) {
            console.error(`❌ CLOUD SAVE ERROR (Attempt ${attempt}):`, error.message, error.details, error.hint);
            // If update fails because record doesn't exist, try upsert
            if (error.code === 'PGRST116' || error.message.includes('0 rows')) {
              console.log('ℹ️ Profile not found, attempting upsert...');
              const { error: upsertError } = await supabase!.from('profiles').upsert({
                id: newState.user!.id,
                ...payload
              });
              if (upsertError) {
                console.error('❌ UPSERT FAILED:', upsertError.message);
                return false;
              }
              return true;
            }
            return false;
          }
          
          lastSyncedStateRef.current = stateString;
          localStorage.removeItem('GUEST_PROGRESS');
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
        console.error('🚨 CRITICAL SYNC FAILURE: Could not persist progress to cloud.');
        setIsOffline(true);
      } else {
        setIsOffline(false);
      }
      
      setTimeout(() => setIsSaving(false), 800);
    } catch (criticalErr) {
      console.error('🚨 CRITICAL SYNC ENGINE ERROR (Anti-Crash Protection):', criticalErr);
      setIsSaving(false);
    }
  }, []);

  // Debounced sync effect to handle rapid state changes (proactive saving)
  useEffect(() => {
    if (!state.user || !isInitialSyncDone) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      forceSyncToSupabase(state);
    }, 2000); // 2 second debounce for automatic sync

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [state, isInitialSyncDone, forceSyncToSupabase]);

  // Optimized batch update to prevent redundant network calls
  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setCoins = useCallback((coins: number | ((prev: number) => number)) => {
    setState(prev => {
      const newCoins = typeof coins === 'function' ? coins(prev.coins) : coins;
      return { ...prev, coins: newCoins };
    });
  }, []);

  const addCoins = useCallback((amount: number) => {
    setState(prev => ({ ...prev, coins: prev.coins + amount }));
  }, []);

  const spendCoins = useCallback((amount: number) => {
    let success = false;
    setState(prev => {
      if (prev.coins >= amount) {
        success = true;
        return { ...prev, coins: prev.coins - amount };
      }
      return prev;
    });
    return success;
  }, []);

  const addToCollection = useCallback((cardIds: string[]) => {
    setState(prev => ({ ...prev, collection: [...prev.collection, ...cardIds] }));
  }, []);

  const addCustomCard = useCallback((card: Card) => {
    setState(prev => ({ ...prev, customCards: [...prev.customCards, card] }));
  }, []);

  const setCurrentView = useCallback((currentView: ViewType) => {
    setState(prev => ({ ...prev, currentView }));
  }, []);

  const unlockAchievement = useCallback((id: string) => {
    setState(prev => {
      if (prev.unlockedAchievements.includes(id)) return prev;
      return { ...prev, unlockedAchievements: [...prev.unlockedAchievements, id] };
    });
  }, []);

  const claimReward = useCallback((day: number, amount: number) => {
    setState(prev => ({
      ...prev,
      coins: prev.coins + amount,
      claimedDays: [...prev.claimedDays, day],
      lastClaimedDate: new Date().toISOString().split('T')[0]
    }));
  }, []);

  const addPackToInventory = useCallback((pack: { id: string; type: string; name: string }) => {
    setState(prev => {
      const existing = prev.inventoryPacks.find(p => p.id === pack.id);
      if (existing) {
        return {
          ...prev,
          inventoryPacks: prev.inventoryPacks.map(p => p.id === pack.id ? { ...p, count: p.count + 1 } : p)
        };
      } else {
        return {
          ...prev,
          inventoryPacks: [...prev.inventoryPacks, { ...pack, count: 1 }]
        };
      }
    });
  }, []);

  const removePackFromInventory = useCallback((packId: string) => {
    setState(prev => {
      const existing = prev.inventoryPacks.find(p => p.id === packId);
      if (!existing) return prev;
      
      if (existing.count > 1) {
        return {
          ...prev,
          inventoryPacks: prev.inventoryPacks.map(p => p.id === packId ? { ...p, count: p.count - 1 } : p)
        };
      } else {
        return {
          ...prev,
          inventoryPacks: prev.inventoryPacks.filter(p => p.id !== packId)
        };
      }
    });
  }, []);

  const setPremium = useCallback((isPremium: boolean) => {
    setState(prev => ({ ...prev, isPremium }));
  }, []);

  const resetGame = useCallback(async () => {
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

    if (newState.user) {
      await forceSyncToSupabase(newState);
    }
  }, [forceSyncToSupabase]);

  const forceSync = useCallback(async () => {
    if (stateRef.current.user) {
      lastSyncedStateRef.current = '';
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
    isInitialSyncDone,
    isOffline,
    showWelcomeGift,
    setShowWelcomeGift,
    login,
    logout
  }), [state, isAuthLoading, isInitialSyncDone, isOffline, showWelcomeGift, setCoins, addCoins, spendCoins, addToCollection, addCustomCard, setCurrentView, unlockAchievement, claimReward, addPackToInventory, removePackFromInventory, setPremium, resetGame, updateGameState, forceSync, isSaving, login, logout]);

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
