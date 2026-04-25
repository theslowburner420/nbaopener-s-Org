import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GameState, ViewType, Card, User, FranchiseState, CareerMatch as SeasonMatch } from '../types';
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
  startFranchise: (team: string, initialRoster?: string[]) => Promise<void>;
  updateFranchise: (updates: Partial<FranchiseState>) => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateGameState: (updates: Partial<GameState>) => void;
  updateGameStateAsync: (updates: Partial<GameState>) => Promise<void>;
  forceSync: () => Promise<void>;
  refreshFromCloud: () => Promise<void>;
  isSaving: boolean;
  isBackgroundSaving: boolean;
  syncError: string | null;
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
      collection: initialGuestState?.collection ?? {},
      customCards: initialGuestState?.customCards ?? [],
      currentView: 'home',
      unlockedAchievements: initialGuestState?.unlockedAchievements ?? [],
      claimedAchievements: initialGuestState?.claimedAchievements ?? [],
      lastClaimedDate: initialGuestState?.lastClaimedDate ?? null,
      claimedDays: initialGuestState?.claimedDays ?? [],
      inventoryPacks: initialGuestState?.inventoryPacks ?? [],
      isPremium: initialGuestState?.isPremium ?? false,
      franchise: initialGuestState?.franchise ?? undefined,
    };
  });

  const authProcessed = React.useRef(false);
  const isSyncingRef = useRef(false);
  const isBackgroundSyncingRef = useRef(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true); // Re-blocking for session stability
  const [isInitialSyncDone, setIsInitialSyncDone] = useState(false); // Re-blocking
  const [isSaving, setIsSaving] = useState(false);
  const [isBackgroundSaving, setIsBackgroundSaving] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showWelcomeGift, setShowWelcomeGift] = useState(false);
  const stateRef = useRef(state);
  const isInitialSyncDoneRef = useRef(isInitialSyncDone);
  const lastSyncedStateRef = useRef<string>('');
  const lastReceivedCloudStateRef = useRef<string>('');
  const profileSubscriptionRef = useRef<any>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    stateRef.current = state;
    isInitialSyncDoneRef.current = isInitialSyncDone;
    
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
        franchise: state.franchise,
      };
      localStorage.setItem('GUEST_PROGRESS', JSON.stringify(guestData));
    } else {
      // Emergency Mirror for logged in users (prevents loss if cloud fetch fails)
      const mirrorData = {
        coins: state.coins,
        collection: state.collection,
        inventoryPacks: state.inventoryPacks,
        isPremium: state.isPremium
      };
      localStorage.setItem(`BACKUP_${state.user.id}`, JSON.stringify(mirrorData));
    }
  }, [state]);

  // Function to force immediate sync to Supabase with retries (IRON RULE: Write Confirmation)
  const forceSyncToSupabase = useCallback(async (newState: GameState, retries = 5, silent = false, isInitSync = false) => {
    if (!newState.user || !supabase) return false;
    
    // CRITICAL GUARD: Never allow an auto-sync or manual sync to overwrite cloud data 
    // unless the initial hydration from cloud has successfully completed.
    if (!isInitialSyncDoneRef.current && !isInitSync) {
      console.warn('🛡️ Data Guard: Blocking sync until initial hydration is complete');
      return false;
    }
    
    try {
      // Flatten collection to array for Supabase legacy support (text[] column)
      // If collection is already array, use it, else flatten map {id: count} -> [id, id, id]
      const flattenedCards = Array.isArray(newState.collection) 
        ? newState.collection 
        : Object.entries(newState.collection).flatMap(([id, count]) => Array(Number(count) || 0).fill(id));

      const payload = {
        id: newState.user.id,
        username: newState.user.username,
        avatar_url: newState.user.avatar_url,
        coins: Number(newState.coins) || 0,
        cards: flattenedCards,
        unlocked_achievements: Array.isArray(newState.unlockedAchievements) ? newState.unlockedAchievements : [],
        claimed_achievements: Array.isArray(newState.claimedAchievements) ? newState.claimedAchievements : [],
        inventory_packs: Array.isArray(newState.inventoryPacks) ? newState.inventoryPacks : [],
        ads_disabled: !!newState.isPremium,
        franchise_state: newState.franchise ? JSON.stringify(newState.franchise) : null,
        last_claimed_date: newState.lastClaimedDate,
        claimed_days: newState.claimedDays,
        updated_at: new Date().toISOString(),
      };

      const stateString = JSON.stringify({
        coins: payload.coins,
        collection: payload.cards,
        unlockedAchievements: payload.unlocked_achievements,
        claimedAchievements: payload.claimed_achievements,
        inventoryPacks: payload.inventory_packs,
        isPremium: payload.ads_disabled,
        last_claimed_date: payload.last_claimed_date,
        claimed_days: payload.claimed_days,
        userId: newState.user.id
      });

      // Avoid redundant sync if state hasn't changed since last success
      if (stateString === lastSyncedStateRef.current) {
        return true;
      }

      if (!silent) {
        setIsSaving(true);
      }

      const performSave = async (attempt: number, omitFields: string[] = []): Promise<boolean> => {
        try {
          console.log(`📡 Cloud Sync Attempt ${attempt} for user ${newState.user!.id} (${silent ? 'Silent' : 'Forced'})`);
          
          const currentPayload = { ...payload };
          omitFields.forEach(field => {
            delete (currentPayload as any)[field];
          });

          const { error, status } = await supabase!
            .from('profiles')
            .upsert(currentPayload, { onConflict: 'id' });
          
          if (error) {
            console.error(`❌ Supabase Error ${status} (Attempt ${attempt}):`, error);
            
            // Detect missing column errors and retry without them
            const missingColumnMatch = error.message?.match(/column "(.+)" of relation "profiles" does not exist/);
            if (missingColumnMatch && missingColumnMatch[1]) {
              const missingField = missingColumnMatch[1];
              if (!omitFields.includes(missingField)) {
                console.warn(`⚠️ Detected missing column [${missingField}]. Retrying without it...`);
                return performSave(attempt, [...omitFields, missingField]);
              }
            }

            if (error.message?.includes('franchise_state') || error.hint?.includes('franchise_state')) {
              if (!omitFields.includes('franchise_state')) {
                return performSave(attempt, [...omitFields, 'franchise_state']);
              }
            }

            // Critical: If it's a Bad Request (400) or Format error (22P02), DO NOT RETRY
            // This prevents flooding the network with known-bad payloads
            if (status === 400 || error.code === '22P02') {
              console.error('🚫 Format error detected. Aborting retries to prevent stack overflow.');
              setSyncError(`Sync failed: Data format error (${error.message})`);
              return false;
            }
            return false;
          }
          
          if (silent) console.log('✅ Silent save successful');
          lastSyncedStateRef.current = stateString;
          setSyncError(null);
          localStorage.removeItem('GUEST_PROGRESS');
          return true;
        } catch (err) {
          console.error(`Sync exception ${attempt}:`, err);
          return false;
        }
      };

      let success = false;
      for (let i = 1; i <= retries; i++) {
        success = await performSave(i);
        if (success) break;
        // Exponential backoff
        const delay = Math.pow(2, i) * 500;
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      return success;
    } catch (err) {
      console.error('CRITICAL SYNC ERROR:', err);
      return false;
    } finally {
      if (!silent) {
        setIsSaving(false);
      }
    }
  }, [supabase, setSyncError]);

  const syncProfile = useCallback(async (user: any) => {
    // Reverting background hydration to fix session loss on refresh
    // We must wait for auth verification before unblocking UI

    // If signing out, we must ALWAYS proceed to clear state and reset refs
    if (!user) {
      console.log('👤 Logout detected: Clearing state');
      isSyncingRef.current = false;
      lastSyncedStateRef.current = '';
      lastReceivedCloudStateRef.current = '';
      
      setState(prev => ({ 
        ...prev, 
        user: null,
        // Reset coins and collection to default guest values on logout
        coins: 500,
        collection: {},
        customCards: [],
        inventoryPacks: [],
        unlockedAchievements: [],
        claimedAchievements: [],
        claimedDays: [],
        lastClaimedDate: null,
      }));
      
      setIsInitialSyncDone(true);
      setIsAuthLoading(false);
      return;
    }

    if (isSyncingRef.current) {
      console.log('⏳ Sync already in progress, skipping redundant trigger');
      return;
    }

    isSyncingRef.current = true;
    console.log('🔄 STARTING SYNC for user:', user.id);
    
    const userData: User = {
      id: user.id,
      email: user.email,
      username: user.user_metadata?.full_name || user.email?.split('@')[0],
      avatar_url: user.user_metadata?.avatar_url,
    };

    // --- OPTIMISTIC HYDRATION (Local -> Merge -> Cloud) ---
    try {
      const currentLiveState = stateRef.current;
      const savedGuest = localStorage.getItem('GUEST_PROGRESS');
      const savedBackup = localStorage.getItem(`BACKUP_${user.id}`);
      
      let guestData = null;
      let backupData = null;
      
      try {
        guestData = savedGuest ? JSON.parse(savedGuest) : null;
        backupData = savedBackup ? JSON.parse(savedBackup) : null;
      } catch (e) {
        console.error('Local data corrupt', e);
      }
      
      const localProgress = {
        coins: Math.max(currentLiveState.coins, guestData?.coins ?? 0, backupData?.coins ?? 0),
        collection: (() => {
          let merged: Record<string, number> = {};
          
          // Merge Backup (Most reliable local source for this user)
          if (backupData?.collection) {
            Object.entries(backupData.collection).forEach(([id, count]) => {
              merged[id] = Math.max(merged[id] || 0, count as number);
            });
          }

          // Handle currentLiveState (cloud/guest)
          const liveColl = currentLiveState.collection;
          if (Array.isArray(liveColl)) {
            liveColl.forEach((id: string) => merged[id] = Math.max(merged[id] || 0, 1));
          } else if (liveColl && typeof liveColl === 'object') {
            Object.entries(liveColl).forEach(([id, count]) => {
              merged[id] = Math.max(merged[id] || 0, count as number);
            });
          }

          const guestColl = guestData?.collection;
          if (guestColl) {
            if (Array.isArray(guestColl)) {
              // Migrate guest array collection
              guestColl.forEach((id: string) => merged[id] = Math.max(merged[id] || 0, 1));
            } else if (typeof guestColl === 'object') {
              // Merge guest object collection
              Object.entries(guestColl).forEach(([id, count]) => {
                merged[id] = Math.max(merged[id] || 0, count as number);
              });
            }
          }
          return merged;
        })(),
        unlockedAchievements: Array.from(new Set([...currentLiveState.unlockedAchievements, ...(guestData?.unlockedAchievements || [])])),
        claimedAchievements: Array.from(new Set([...currentLiveState.claimedAchievements, ...(guestData?.claimedAchievements || [])])),
        inventoryPacks: currentLiveState.inventoryPacks.length > 0 ? currentLiveState.inventoryPacks : (guestData?.inventoryPacks || []),
        isPremium: currentLiveState.isPremium || guestData?.isPremium || false,
        franchise: currentLiveState.franchise || guestData?.franchise || backupData?.franchise,
      };

      // 1. Fetch Cloud Data
      const { data: cloudProfile, error: fetchError } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }
      
      setSyncError(null);
      setIsOffline(false);

      let finalMergedData: Partial<GameState>;

      if (!cloudProfile) {
        console.log('✨ NEW USER: First sync - Awarding Welcome Pack');
        finalMergedData = {
          ...localProgress,
          coins: Math.max(localProgress.coins, 100000), // Increased Welcome bonus: 100k
          inventoryPacks: [
            ...localProgress.inventoryPacks,
            { id: `welcome-mega-${Date.now()}`, type: 'premium', name: 'Welcome Mega Pack', count: 5 },
            { id: `gift-${Date.now()}`, type: 'mvp', name: 'Finals MVP Pack', count: 3 }
          ]
        };
        setShowWelcomeGift(true);
      } else {
        console.log('🧬 MERGING CLOUD DATA');
        
        const pc = {
          coins: Number(cloudProfile.coins) || 0,
          cards: (() => {
            const raw = cloudProfile.cards;
            if (Array.isArray(raw)) {
              // Migrate cloud legacy array
              const migrated: Record<string, number> = {};
              raw.forEach((id: string) => migrated[id] = (migrated[id] || 0) + 1);
              return migrated;
            }
            return (raw && typeof raw === 'object') ? raw : {};
          })(),
          unlocked_achievements: Array.isArray(cloudProfile.unlocked_achievements) ? cloudProfile.unlocked_achievements : [],
          claimed_achievements: Array.isArray(cloudProfile.claimed_achievements) ? cloudProfile.claimed_achievements : [],
          inventory_packs: Array.isArray(cloudProfile.inventory_packs) ? cloudProfile.inventory_packs : [],
          ads_disabled: !!cloudProfile.ads_disabled,
          franchise: cloudProfile.franchise_state ? JSON.parse(cloudProfile.franchise_state) : localProgress.franchise,
        };

        const mergeArrays = (a: any[], b: any[]) => Array.from(new Set([...(a || []), ...(b || [])]));
        
        finalMergedData = {
          // If we haven't finished our very first sync ever, we merge guest + cloud cautiously (additive)
          // Once the app is running (isInitialSyncDoneRef), we TRUST the cloud as the master for logged-in sessions
          coins: isInitialSyncDoneRef.current ? pc.coins : Math.max(pc.coins, localProgress.coins),
          collection: (() => {
            if (isInitialSyncDoneRef.current) return pc.cards; // Trust cloud master during active session
            
            const merged = { ...pc.cards };
            Object.entries(localProgress.collection).forEach(([id, count]) => {
              merged[id] = Math.max(merged[id] || 0, count);
            });
            return merged;
          })(),
          unlockedAchievements: isInitialSyncDoneRef.current ? pc.unlocked_achievements : mergeArrays(pc.unlocked_achievements, localProgress.unlockedAchievements),
          claimedAchievements: isInitialSyncDoneRef.current ? pc.claimed_achievements : mergeArrays(pc.claimed_achievements, localProgress.claimedAchievements),
          inventoryPacks: isInitialSyncDoneRef.current ? pc.inventory_packs : (pc.inventory_packs.length > localProgress.inventoryPacks.length ? pc.inventory_packs : localProgress.inventoryPacks),
          isPremium: pc.ads_disabled || localProgress.isPremium,
          franchise: isInitialSyncDoneRef.current ? pc.franchise : (pc.franchise || localProgress.franchise),
        };
      }

      const mergedState: GameState = {
        ...currentLiveState,
        ...finalMergedData,
        user: userData,
        currentView: currentLiveState.currentView // Keep what user is doing
      };

      // Update state once
      setState(mergedState);

      // Reset sync ref so it's not blocking the immediate save
      lastSyncedStateRef.current = ''; 
      await forceSyncToSupabase(mergedState, 3, true, true);

      // Setup/Refresh Real-time
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
            console.log('🔔 Remote update received via Realtime');
            
            // CRITICAL: Transform remote cards array to local collection map
            let migratedCollection = stateRef.current.collection;
            if (updated.cards && Array.isArray(updated.cards)) {
              const newMap: Record<string, number> = {};
              updated.cards.forEach((id: string) => {
                newMap[id] = (newMap[id] || 0) + 1;
              });
              migratedCollection = newMap;
            }

            setState(prev => ({
              ...prev,
              coins: updated.coins !== undefined ? Number(updated.coins) : prev.coins,
              collection: migratedCollection,
              inventoryPacks: updated.inventory_packs || prev.inventoryPacks,
              isPremium: updated.ads_disabled !== undefined ? !!updated.ads_disabled : prev.isPremium,
              franchise: updated.franchise_state ? JSON.parse(updated.franchise_state) : prev.franchise,
            }));
            
            // Sync the ref too to prevent immediate bounce-back save
            lastSyncedStateRef.current = ''; 
          }).subscribe();
      }

      setIsInitialSyncDone(true);
      setIsAuthLoading(false);
      setIsBackgroundSaving(false);
    } catch (err: any) {
      console.error('❌ CRITICAL SYNC ERROR:', err);
      setSyncError(`Data Sync Failed: ${err.message || 'Network error'}`);
      setIsAuthLoading(false);
      // NEVER set isInitialSyncDone(true) here, or auto-save will nuke the cloud data with empty state
      setIsBackgroundSaving(false);
    } finally {
      isSyncingRef.current = false;
    }
  }, [forceSyncToSupabase]);

  // Auth and Profile sync setup
  useEffect(() => {
    if (!supabase) {
      setIsAuthLoading(false);
      setIsInitialSyncDone(true);
      return;
    }

    let mounted = true;

    // 1. Initial Session Check (Fast path)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        console.log('Session found on mount:', session.user.id);
        syncProfile(session.user);
      } else {
        console.log('No session found on mount');
        setIsAuthLoading(false);
        setIsInitialSyncDone(true);
      }
    });

    // 2. Auth Listener - Subscribed once
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      console.log(`🔐 AUTH EVENT: ${event}`);
      
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        // Only trigger sync if user changed or session is fresh
        if (session?.user && stateRef.current.user?.id !== session.user.id) {
          await syncProfile(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        await syncProfile(null);
      }
    });

    const safetyTimeout = setTimeout(() => {
      // Extended safety unblock to 10s
      if (!isInitialSyncDoneRef.current) {
        console.warn('⚠️ Safety unblock triggered after 10s');
        setIsAuthLoading(false);
        setIsInitialSyncDone(true);
      }
    }, 10000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []); // Strictly empty array to prevent listener re-runs

  // Debounced sync effect - Optimized to avoid redundant triggers from UI changes (like currentView)
  const syncRelevantData = useMemo(() => ({
    coins: state.coins,
    collection: state.collection,
    customCards: state.customCards,
    unlockedAchievements: state.unlockedAchievements,
    claimedAchievements: state.claimedAchievements,
    inventoryPacks: state.inventoryPacks,
    isPremium: state.isPremium,
    franchise: state.franchise,
    user: state.user?.id
  }), [state.coins, state.collection, state.customCards, state.unlockedAchievements, state.claimedAchievements, state.inventoryPacks, state.isPremium, state.franchise, state.user?.id]);

  // Periodic Save (Debounced) - Silent Background Auto-Save
  useEffect(() => {
    // Only proceed if a user is logged in and the initial data hydration is complete
    if (!state.user || !isInitialSyncDone) return;

    // RULE 1: Guard against the loop created by the initial data injection (syncProfile)
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    // RULE 2: Tab closure protection
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Attempt a synchronous-like last effort (or just warn if sync fails)
      // Note: Browsers are strict with async in beforeunload, so this is "best effort"
      forceSyncToSupabase(stateRef.current, 1, true);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // RULE 3: IMPLEMENT DEBOUNCE (Anti-Spam)
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(() => {
      console.log('☁️ Auto-save: Consolidating progress to Supabase');
      forceSyncToSupabase(stateRef.current, 1, true); 
    }, 3000); // 3 second grace period (reduced from 5s for better responsiveness)


    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [syncRelevantData, isInitialSyncDone, forceSyncToSupabase]);

  const login = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  }, []);

  const logout = useCallback(async () => {
    if (!supabase) return;
    console.log('Logging out...');
    // Manual state trigger for instant feedback
    await syncProfile(null);
    await supabase.auth.signOut();
  }, [syncProfile]);

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
    const newCollection = { ...stateRef.current.collection };
    cardIds.forEach(id => {
      newCollection[id] = (newCollection[id] || 0) + 1;
    });

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
        const existing = newPacks.find(p => p.type === r.type);
        if (existing) {
          newPacks = newPacks.map(p => p.type === r.type ? { ...p, count: p.count + (r.count || 1) } : p);
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
      const existing = newPacks.find(p => p.type === pack.type);
      if (existing) {
        newPacks = newPacks.map(p => p.type === pack.type ? { ...p, count: p.count + 1 } : p);
      } else {
        newPacks.push({ ...pack, id: pack.type, count: 1 });
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
    const existing = stateRef.current.inventoryPacks.find(p => p.type === pack.type);
    let newPacks;
    if (existing) {
      newPacks = stateRef.current.inventoryPacks.map(p => p.type === pack.type ? { ...p, count: p.count + 1 } : p);
    } else {
      newPacks = [...stateRef.current.inventoryPacks, { ...pack, id: pack.type, count: 1 }];
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
      collection: {},
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

  const startFranchise = useCallback(async (team: string, initialRoster: string[] = [], fullInitialState?: Partial<FranchiseState>) => {
    const freshFranchise: FranchiseState = {
      isActive: true,
      team,
      level: 1,
      xp: 0,
      budget: 1000000,
      season: 2025,
      wins: 0,
      losses: 0,
      schedule: [],
      upgrades: {
        coaching: 1,
        scouting: 1,
        training: 1,
        facilities: 1,
      },
      roster: initialRoster,
      contracts: [],
      currentDate: '2025-10-22',
      marketPhase: 'regular_season',
      playerSeasonStats: [],
      lineup: {
        PG: null,
        SG: null,
        SF: null,
        PF: null,
        C: null
      },
      currentMatchIndex: 0,
      gameLogs: [],
      activeEvents: [],
      milestones: [],
      salaryCap: 140.5, // 140.5M default
      payroll: 0,
      conferenceStandings: [],
      ...fullInitialState
    };
    await updateGameStateAsync({ franchise: freshFranchise });
  }, [updateGameStateAsync]);

  const updateFranchise = useCallback(async (updates: Partial<FranchiseState>) => {
    if (!stateRef.current.franchise) return;
    const newFranchise = { ...stateRef.current.franchise, ...updates };
    await updateGameStateAsync({ franchise: newFranchise });
  }, [updateGameStateAsync]);

  const forceSync = useCallback(async () => {
    if (stateRef.current.user) {
      lastSyncedStateRef.current = '';
      await forceSyncToSupabase(stateRef.current);
    }
  }, [forceSyncToSupabase]);

  const refreshFromCloud = useCallback(async () => {
    if (stateRef.current.user) {
      console.log('🔄 Manually refreshing state from cloud...');
      isSyncingRef.current = false; // Reset to allow syncProfile to run
      await syncProfile(stateRef.current.user);
    }
  }, [syncProfile]);

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
    refreshFromCloud,
    isSaving,
    isBackgroundSaving,
    syncError,
    removeNotification,
    isInitialSyncDone,
    isOffline,
    showWelcomeGift,
    setShowWelcomeGift,
    login,
    logout,
    startFranchise,
    updateFranchise
  }), [state, isAuthLoading, isInitialSyncDone, isOffline, syncError, showWelcomeGift, setCoins, addCoins, spendCoins, addToCollection, addCustomCard, setCurrentView, unlockAchievement, claimReward, addPackToInventory, removePackFromInventory, setPremium, resetGame, updateGameState, forceSync, isSaving, isBackgroundSaving, login, logout, startFranchise, updateFranchise]);

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
