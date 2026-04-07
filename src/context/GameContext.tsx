import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameState, ViewType, Card, User } from '../types';
import { ACHIEVEMENTS } from '../constants/achievements';
import { supabase } from '../lib/supabase';

interface GameContextType extends GameState {
  isAuthLoading: boolean;
  isInitialSyncDone: boolean;
  isOffline: boolean;
  setCoins: (coins: number | ((prev: number) => number)) => void;
  addCoins: (amount: number, sync?: boolean) => Promise<void>;
  spendCoins: (amount: number, sync?: boolean) => Promise<boolean>;
  addToCollection: (cardIds: string[], sync?: boolean) => Promise<void>;
  addCustomCard: (card: Card, sync?: boolean) => Promise<void>;
  unlockAchievement: (id: string, sync?: boolean) => Promise<any>;
  claimAchievementReward: (id: string, sync?: boolean) => Promise<void>;
  claimReward: (day: number, amount: number, pack?: { id: string; type: string; name: string }, sync?: boolean) => Promise<void>;
  addPackToInventory: (pack: { id: string; type: string; name: string }, sync?: boolean) => Promise<void>;
  removePackFromInventory: (packId: string, sync?: boolean) => Promise<void>;
  setPremium: (status: boolean, sync?: boolean) => Promise<void>;
  resetGame: (sync?: boolean) => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateGameState: (updates: Partial<GameState>) => void;
  updateGameStateAsync: (updates: Partial<GameState>) => Promise<void>;
  forceSync: () => Promise<void>;
  isSaving: boolean;
  isBackgroundSaving: boolean;
  removeNotification: (id: string) => void;
  showWelcomeGift: boolean;
  setShowWelcomeGift: (show: boolean) => void;
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
      claimedAchievements: initialGuestState?.claimedAchievements ?? [],
      lastClaimedDate: initialGuestState?.lastClaimedDate ?? null,
      claimedDays: initialGuestState?.claimedDays ?? [],
      inventoryPacks: initialGuestState?.inventoryPacks ?? [],
      isPremium: initialGuestState?.isPremium ?? false,
    };
  });

  const authProcessed = React.useRef(false);
  const isSyncingRef = useRef(false);
  const isBackgroundSyncingRef = useRef(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isInitialSyncDone, setIsInitialSyncDone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBackgroundSaving, setIsBackgroundSaving] = useState(false);
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
        claimedAchievements: state.claimedAchievements,
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
      claimedAchievements: Array.from(new Set([...liveState.claimedAchievements, ...(guestData?.claimedAchievements || [])])),
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
          claimed_achievements: Array.isArray(cloudProfile.claimed_achievements) ? cloudProfile.claimed_achievements : [],
          inventory_packs: Array.isArray(cloudProfile.inventory_packs) ? cloudProfile.inventory_packs : [],
          ads_disabled: !!cloudProfile.ads_disabled,
        };

        // Update the last received cloud state to prevent loops
        lastReceivedCloudStateRef.current = JSON.stringify({
          coins: parsedCloud.coins,
          collection: parsedCloud.cards,
          inventoryPacks: parsedCloud.inventory_packs,
          unlockedAchievements: parsedCloud.unlocked_achievements,
          claimedAchievements: parsedCloud.claimed_achievements,
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
            claimedAchievements: mergeArrays(parsedCloud.claimed_achievements, localData.claimedAchievements),
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
              claimedAchievements: updated.claimed_achievements || prev.claimedAchievements,
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
  const forceSyncToSupabase = useCallback(async (newState: GameState, retries = 5, silent = false) => {
    if (isBackgroundSyncingRef.current && silent) return;
    
    try {
      if (!newState.user || !supabase) return;

      // Validation of UUID
      if (!newState.user?.id) return;

      const payload = {
        username: newState.user.username,
        avatar_url: newState.user.avatar_url,
        coins: Number(newState.coins) || 0,
        cards: Array.isArray(newState.collection) ? newState.collection : [],
        unlocked_achievements: Array.isArray(newState.unlockedAchievements) ? newState.unlockedAchievements : [],
        claimed_achievements: Array.isArray(newState.claimedAchievements) ? newState.claimedAchievements : [],
        inventory_packs: Array.isArray(newState.inventoryPacks) ? newState.inventoryPacks : [],
        ads_disabled: !!newState.isPremium,
        updated_at: new Date().toISOString(),
      };

      const stateString = JSON.stringify({
        coins: payload.coins,
        collection: payload.cards,
        unlockedAchievements: payload.unlocked_achievements,
        claimedAchievements: payload.claimed_achievements,
        inventoryPacks: payload.inventory_packs,
        isPremium: payload.ads_disabled,
      });

      if (stateString === lastSyncedStateRef.current) {
        return true;
      }

      if (silent) {
        setIsBackgroundSaving(true);
        isBackgroundSyncingRef.current = true;
      } else {
        setIsSaving(true);
      }

      const performSave = async (attempt: number): Promise<boolean> => {
        try {
          const { error } = await supabase!
            .from('profiles')
            .update(payload)
            .eq('id', newState.user!.id);
          
          if (error) {
            if (error.code === 'PGRST116' || error.message.includes('0 rows')) {
              const { error: upsertError } = await supabase!.from('profiles').upsert({
                id: newState.user!.id,
                ...payload
              });
              return !upsertError;
            }
            return false;
          }
          
          lastSyncedStateRef.current = stateString;
          localStorage.removeItem('GUEST_PROGRESS');
          return true;
        } catch (err) {
          return false;
        }
      };

      let success = await performSave(1);
      let currentAttempt = 1;

      while (!success && currentAttempt < retries) {
        currentAttempt++;
        const delay = 1000 * Math.pow(2, currentAttempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        success = await performSave(currentAttempt);
      }

      if (!success) {
        setIsOffline(true);
      } else {
        setIsOffline(false);
      }
      
      if (silent) {
        setIsBackgroundSaving(false);
        isBackgroundSyncingRef.current = false;
      } else {
        setTimeout(() => setIsSaving(false), 800);
      }
      return success;
    } catch (criticalErr) {
      setIsSaving(false);
      setIsBackgroundSaving(false);
      isBackgroundSyncingRef.current = false;
      return false;
    }
  }, []);

  // Debounced sync effect to handle rapid state changes (proactive saving)
  useEffect(() => {
    if (!state.user || !isInitialSyncDone) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      forceSyncToSupabase(state, 3, true);
    }, 3000); // 3 second debounce for silent background sync

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

  const updateGameStateAsync = useCallback(async (updates: Partial<GameState>) => {
    const newState = { ...stateRef.current, ...updates };
    
    if (newState.user) {
      setIsSaving(true);
      const success = await forceSyncToSupabase(newState);
      if (!success) {
        setIsSaving(false);
        throw new Error('Sync failed. Action aborted to ensure data integrity.');
      }
      setIsSaving(false);
    }
    
    setState(prev => ({ ...prev, ...updates }));
  }, [forceSyncToSupabase]);

  const setCoins = useCallback((coins: number | ((prev: number) => number)) => {
    setState(prev => {
      const newCoins = typeof coins === 'function' ? coins(prev.coins) : coins;
      return { ...prev, coins: newCoins };
    });
  }, []);

  const addCoins = useCallback(async (amount: number, sync: boolean = true) => {
    const newCoins = stateRef.current.coins + amount;
    if (sync) {
      await updateGameStateAsync({ coins: newCoins });
    } else {
      updateGameState({ coins: newCoins });
    }
  }, [updateGameStateAsync, updateGameState]);

  const spendCoins = useCallback(async (amount: number, sync: boolean = true) => {
    if (stateRef.current.coins >= amount) {
      const newCoins = stateRef.current.coins - amount;
      if (sync) {
        await updateGameStateAsync({ coins: newCoins });
      } else {
        updateGameState({ coins: newCoins });
      }
      return true;
    }
    return false;
  }, [updateGameStateAsync, updateGameState]);

  const addToCollection = useCallback(async (cardIds: string[], sync: boolean = true) => {
    const newCollection = [...stateRef.current.collection, ...cardIds];
    if (sync) {
      await updateGameStateAsync({ collection: newCollection });
    } else {
      updateGameState({ collection: newCollection });
    }
  }, [updateGameStateAsync, updateGameState]);

  const addCustomCard = useCallback(async (card: Card, sync: boolean = true) => {
    const newCustomCards = [...stateRef.current.customCards, card];
    if (sync) {
      await updateGameStateAsync({ customCards: newCustomCards });
    } else {
      updateGameState({ customCards: newCustomCards });
    }
  }, [updateGameStateAsync, updateGameState]);

  const setCurrentView = useCallback((currentView: ViewType) => {
    setState(prev => ({ ...prev, currentView }));
  }, []);

  const unlockAchievement = useCallback(async (id: string, sync: boolean = true) => {
    const achievement = ACHIEVEMENTS.find((a: any) => a.id === id);
    if (!achievement) return null;

    if (stateRef.current.unlockedAchievements.includes(id)) return null;
    
    if (sync) {
      await updateGameStateAsync({ 
        unlockedAchievements: [...stateRef.current.unlockedAchievements, id]
      });
    } else {
      updateGameState({ 
        unlockedAchievements: [...stateRef.current.unlockedAchievements, id]
      });
    }
    return achievement;
  }, [updateGameStateAsync, updateGameState]);

  const claimAchievementReward = useCallback(async (id: string, sync: boolean = true) => {
    const achievement = ACHIEVEMENTS.find((a: any) => a.id === id);
    if (!achievement) return;

    if (stateRef.current.claimedAchievements.includes(id)) return;
    
    // Grant rewards
    let newCoins = stateRef.current.coins + (achievement.rewardCoins || 0);
    let newPacks = [...stateRef.current.inventoryPacks];

    if (achievement.rewardPacks) {
      achievement.rewardPacks.forEach((r: any) => {
        const existing = newPacks.find(p => p.id === r.type);
        if (existing) {
          newPacks = newPacks.map(p => p.id === r.type ? { ...p, count: p.count + (r.count || 1) } : p);
        } else {
          newPacks.push({ id: r.type, type: r.type, name: r.name, count: r.count || 1 });
        }
      });
    }

    if (sync) {
      await updateGameStateAsync({ 
        claimedAchievements: [...stateRef.current.claimedAchievements, id],
        coins: newCoins,
        inventoryPacks: newPacks
      });
    } else {
      updateGameState({ 
        claimedAchievements: [...stateRef.current.claimedAchievements, id],
        coins: newCoins,
        inventoryPacks: newPacks
      });
    }
  }, [updateGameStateAsync, updateGameState]);

  const removeNotification = useCallback((id: string) => {
    // No-op since we're using NotificationContext
  }, []);

  const claimReward = useCallback(async (day: number, amount: number, pack?: { id: string; type: string; name: string }, sync: boolean = true) => {
    let newPacks = [...stateRef.current.inventoryPacks];
    if (pack) {
      const existing = newPacks.find(p => p.id === pack.id);
      if (existing) {
        newPacks = newPacks.map(p => p.id === pack.id ? { ...p, count: p.count + 1 } : p);
      } else {
        newPacks.push({ ...pack, count: 1 });
      }
    }

    const updates = {
      coins: stateRef.current.coins + amount,
      inventoryPacks: newPacks,
      claimedDays: [...stateRef.current.claimedDays, day],
      lastClaimedDate: new Date().toISOString().split('T')[0]
    };

    if (sync) {
      await updateGameStateAsync(updates);
    } else {
      updateGameState(updates);
    }
  }, [updateGameStateAsync, updateGameState]);

  const addPackToInventory = useCallback(async (pack: { id: string; type: string; name: string }, sync: boolean = true) => {
    const existing = stateRef.current.inventoryPacks.find(p => p.id === pack.id);
    let newPacks;
    if (existing) {
      newPacks = stateRef.current.inventoryPacks.map(p => p.id === pack.id ? { ...p, count: p.count + 1 } : p);
    } else {
      newPacks = [...stateRef.current.inventoryPacks, { ...pack, count: 1 }];
    }

    if (sync) {
      await updateGameStateAsync({ inventoryPacks: newPacks });
    } else {
      updateGameState({ inventoryPacks: newPacks });
    }
  }, [updateGameStateAsync, updateGameState]);

  const removePackFromInventory = useCallback(async (packId: string, sync: boolean = true) => {
    const existing = stateRef.current.inventoryPacks.find(p => p.id === packId);
    if (!existing) return;
    
    let newPacks;
    if (existing.count > 1) {
      newPacks = stateRef.current.inventoryPacks.map(p => p.id === packId ? { ...p, count: p.count - 1 } : p);
    } else {
      newPacks = stateRef.current.inventoryPacks.filter(p => p.id !== packId);
    }

    if (sync) {
      await updateGameStateAsync({ inventoryPacks: newPacks });
    } else {
      updateGameState({ inventoryPacks: newPacks });
    }
  }, [updateGameStateAsync, updateGameState]);

  const setPremium = useCallback(async (isPremium: boolean, sync: boolean = true) => {
    if (sync) {
      await updateGameStateAsync({ isPremium });
    } else {
      updateGameState({ isPremium });
    }
  }, [updateGameStateAsync, updateGameState]);

  const resetGame = useCallback(async (sync: boolean = true) => {
    const newState = {
      ...stateRef.current,
      coins: 500,
      collection: [],
      customCards: [],
      unlockedAchievements: [],
      claimedAchievements: [],
      lastClaimedDate: null,
      claimedDays: [],
      inventoryPacks: [],
      isPremium: false,
    };

    setState(newState);

    if (sync && newState.user) {
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
    claimAchievementReward,
    claimReward,
    addPackToInventory,
    removePackFromInventory,
    setPremium,
    resetGame,
    updateGameState,
    updateGameStateAsync,
    forceSync,
    isSaving,
    isBackgroundSaving,
    removeNotification,
    isInitialSyncDone,
    isOffline,
    showWelcomeGift,
    setShowWelcomeGift,
    login,
    logout
  }), [state, isAuthLoading, isInitialSyncDone, isOffline, showWelcomeGift, setCoins, addCoins, spendCoins, addToCollection, addCustomCard, setCurrentView, unlockAchievement, claimReward, addPackToInventory, removePackFromInventory, setPremium, resetGame, updateGameState, forceSync, isSaving, isBackgroundSaving, login, logout]);

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
