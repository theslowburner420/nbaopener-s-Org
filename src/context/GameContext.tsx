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
  syncError: string | null;
  removeNotification: (id: string) => void;
  showWelcomeGift: boolean;
  setShowWelcomeGift: (show: boolean) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GameState>(() => {
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

  const isSyncingRef = useRef(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isInitialSyncDone, setIsInitialSyncDone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBackgroundSaving, setIsBackgroundSaving] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showWelcomeGift, setShowWelcomeGift] = useState(false);
  
  const stateRef = useRef(state);
  const lastSyncedStateRef = useRef<string>('');
  const profileSubscriptionRef = useRef<any>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Actualización del estado local (Ref) y LocalStorage para invitados
  useEffect(() => {
    stateRef.current = state;
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

  // Función principal de guardado en la base de datos
  const forceSyncToSupabase = useCallback(async (newState: GameState, retries = 3, silent = false) => {
    if (!newState.user || !supabase) return false;
    
    try {
      const payload = {
        id: newState.user.id,
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
        userId: newState.user.id
      });

      // Si no ha cambiado nada importante, no malgastamos peticiones
      if (stateString === lastSyncedStateRef.current) {
        return true;
      }

      if (!silent) setIsSaving(true);

      const performSave = async (attempt: number): Promise<boolean> => {
        try {
          console.log(`📡 Sincronizando con Supabase... (Intento ${attempt}, ${silent ? 'Silencioso' : 'Forzado'})`);
          
          const { error } = await supabase!
            .from('profiles')
            .upsert(payload, { onConflict: 'id' });
          
          if (error) {
            console.error(`❌ Error en Supabase (Intento ${attempt}):`, error);
            return false;
          }
          
          if (silent) console.log('✅ Guardado silencioso completado');
          lastSyncedStateRef.current = stateString; // Actualizamos la referencia del último guardado
          localStorage.removeItem('GUEST_PROGRESS');
          return true;
        } catch (err) {
          console.error(`Sync exception ${attempt}:`, err);
          return false;
        }
      };

      let success = await performSave(1);
      let attempt = 1;
      while (!success && attempt < retries) {
        attempt++;
        const delay = attempt * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        success = await performSave(attempt);
      }

      return success;
    } catch (err) {
      console.error('CRITICAL SYNC ERROR:', err);
      return false;
    } finally {
      if (!silent) setIsSaving(false);
    }
  }, []);

  const syncProfile = useCallback(async (user: any) => {
    if (!user) {
      console.log('👤 Logout detectado: Limpiando estado');
      isSyncingRef.current = false;
      lastSyncedStateRef.current = '';
      
      setState(prev => ({ 
        ...prev, 
        user: null,
        coins: 500,
        collection: [],
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

    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    
    const userData: User = {
      id: user.id,
      email: user.email,
      username: user.user_metadata?.full_name || user.email?.split('@')[0],
      avatar_url: user.user_metadata?.avatar_url,
    };

    try {
      const currentLiveState = stateRef.current;
      const savedGuest = localStorage.getItem('GUEST_PROGRESS');
      let guestData = savedGuest ? JSON.parse(savedGuest) : null;
      
      const localProgress = {
        coins: Math.max(currentLiveState.coins, guestData?.coins ?? 0),
        collection: Array.from(new Set([...currentLiveState.collection, ...(guestData?.collection || [])])),
        unlockedAchievements: Array.from(new Set([...currentLiveState.unlockedAchievements, ...(guestData?.unlockedAchievements || [])])),
        claimedAchievements: Array.from(new Set([...currentLiveState.claimedAchievements, ...(guestData?.claimedAchievements || [])])),
        inventoryPacks: currentLiveState.inventoryPacks.length > 0 ? currentLiveState.inventoryPacks : (guestData?.inventoryPacks || []),
        isPremium: currentLiveState.isPremium || guestData?.isPremium || false,
      };

      const { data: cloudProfile, error: fetchError } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      
      let finalMergedData: Partial<GameState>;

      if (!cloudProfile) {
        finalMergedData = {
          ...localProgress,
          coins: Math.max(localProgress.coins, 50000), // Welcome bonus
          inventoryPacks: [
            ...localProgress.inventoryPacks,
            { id: `gift-${Date.now()}`, type: 'mvp', name: 'Finals MVP Pack', count: 3 }
          ]
        };
        setShowWelcomeGift(true);
      } else {
        const pc = {
          coins: Number(cloudProfile.coins) || 0,
          cards: Array.isArray(cloudProfile.cards) ? cloudProfile.cards : [],
          unlocked_achievements: Array.isArray(cloudProfile.unlocked_achievements) ? cloudProfile.unlocked_achievements : [],
          claimed_achievements: Array.isArray(cloudProfile.claimed_achievements) ? cloudProfile.claimed_achievements : [],
          inventory_packs: Array.isArray(cloudProfile.inventory_packs) ? cloudProfile.inventory_packs : [],
          ads_disabled: !!cloudProfile.ads_disabled,
        };

        const mergeArrays = (a: any[], b: any[]) => Array.from(new Set([...(a || []), ...(b || [])]));
        
        finalMergedData = {
          coins: Math.max(pc.coins, localProgress.coins),
          collection: mergeArrays(pc.cards, localProgress.collection),
          unlockedAchievements: mergeArrays(pc.unlocked_achievements, localProgress.unlockedAchievements),
          claimedAchievements: mergeArrays(pc.claimed_achievements, localProgress.claimedAchievements),
          inventoryPacks: pc.inventory_packs.length > localProgress.inventoryPacks.length ? pc.inventory_packs : localProgress.inventoryPacks,
          isPremium: pc.ads_disabled || localProgress.isPremium,
        };
      }

      const mergedState: GameState = {
        ...currentLiveState,
        ...finalMergedData,
        user: userData,
        currentView: currentLiveState.currentView
      };

      setState(mergedState);

      // Guardamos la referencia de lo que acabamos de descargar para que el Debounce no lo resuba inmediatamente
      lastSyncedStateRef.current = JSON.stringify({
        coins: mergedState.coins,
        collection: mergedState.collection,
        unlockedAchievements: mergedState.unlockedAchievements,
        claimedAchievements: mergedState.claimedAchievements,
        inventoryPacks: mergedState.inventoryPacks,
        isPremium: mergedState.isPremium,
        userId: userData.id
      });

      // Configuración en tiempo real (Realtime updates)
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
            setState(prev => ({
              ...prev,
              coins: updated.coins ?? prev.coins,
              collection: updated.cards || prev.collection,
              inventoryPacks: updated.inventory_packs || prev.inventoryPacks,
              isPremium: updated.ads_disabled || prev.isPremium,
            }));
          }).subscribe();
      }

      setIsInitialSyncDone(true);
      setIsAuthLoading(false);
    } catch (err) {
      console.error('❌ ERROR AL CARGAR DATOS INICIALES:', err);
      setIsAuthLoading(false);
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  // 1. Inicialización de Autenticación
  useEffect(() => {
    if (!supabase) {
      setIsAuthLoading(false);
      setIsInitialSyncDone(true);
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        syncProfile(session.user);
      } else {
        setIsAuthLoading(false);
        setIsInitialSyncDone(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        if (session?.user && stateRef.current.user?.id !== session.user.id) {
          await syncProfile(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        await syncProfile(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Array vacío para no re-suscribirse

  // =========================================================================
  // EL MOTOR DE GUARDADO EN SEGUNDO PLANO (DEBOUNCE DEFINITIVO)
  // =========================================================================
  useEffect(() => {
    if (!state.user || !isInitialSyncDone) return;

    // Calculamos el string del estado actual
    const currentStateString = JSON.stringify({
      coins: state.coins,
      collection: state.collection,
      unlockedAchievements: state.unlockedAchievements,
      claimedAchievements: state.claimedAchievements,
      inventoryPacks: state.inventoryPacks,
      isPremium: state.isPremium,
      userId: state.user.id
    });

    // Si el estado es idéntico a lo último guardado, no hacemos nada (evita bucles)
    if (currentStateString === lastSyncedStateRef.current) {
      return;
    }

    // Si hay un temporizador activo, lo cancelamos (esto es el Debounce)
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Iniciamos un nuevo temporizador de 2 segundos
    syncTimeoutRef.current = setTimeout(() => {
      forceSyncToSupabase(stateRef.current, 3, true); 
    }, 2000);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [
    state.coins, 
    state.collection, 
    state.unlockedAchievements, 
    state.claimedAchievements, 
    state.inventoryPacks, 
    state.isPremium,
    isInitialSyncDone
  ]);
  // =========================================================================

  const login = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin }});
  }, []);

  const logout = useCallback(async () => {
    if (!supabase) return;
    await syncProfile(null);
    await supabase.auth.signOut();
  }, [syncProfile]);

  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateGameStateAsync = useCallback(async (updates: Partial<GameState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setCoins = useCallback((coins: number | ((prev: number) => number)) => {
    setState(prev => ({ ...prev, coins: typeof coins === 'function' ? coins(prev.coins) : coins }));
  }, []);

  // NOTA IMPORTANTE: Ahora sync por defecto es FALSE, para que use el motor silencioso.
  const addCoins = useCallback(async (amount: number, sync: boolean = false) => {
    updateGameState({ coins: stateRef.current.coins + amount });
  }, [updateGameState]);

  const spendCoins = useCallback(async (amount: number, sync: boolean = false) => {
    if (stateRef.current.coins >= amount) {
      updateGameState({ coins: stateRef.current.coins - amount });
      return true;
    }
    return false;
  }, [updateGameState]);

  const addToCollection = useCallback(async (cardIds: string[], sync: boolean = false) => {
    updateGameState({ collection: [...stateRef.current.collection, ...cardIds] });
  }, [updateGameState]);

  const addCustomCard = useCallback(async (card: Card, sync: boolean = false) => {
    updateGameState({ customCards: [...stateRef.current.customCards, card] });
  }, [updateGameState]);

  const setCurrentView = useCallback((currentView: ViewType) => {
    setState(prev => ({ ...prev, currentView }));
  }, []);

  const unlockAchievement = useCallback(async (id: string, sync: boolean = false) => {
    if (stateRef.current.unlockedAchievements.includes(id)) return null;
    updateGameState({ unlockedAchievements: [...stateRef.current.unlockedAchievements, id] });
    return ACHIEVEMENTS.find((a: any) => a.id === id) || null;
  }, [updateGameState]);

  const claimAchievementReward = useCallback(async (id: string, sync: boolean = false) => {
    if (stateRef.current.claimedAchievements.includes(id)) return;
    const achievement = ACHIEVEMENTS.find((a: any) => a.id === id);
    if (!achievement) return;

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

    updateGameState({ claimedAchievements: [...stateRef.current.claimedAchievements, id], coins: newCoins, inventoryPacks: newPacks });
  }, [updateGameState]);

  const removeNotification = useCallback((id: string) => {}, []);

  const claimReward = useCallback(async (day: number, amount: number, pack?: { id: string; type: string; name: string }, sync: boolean = false) => {
    let newPacks = [...stateRef.current.inventoryPacks];
    if (pack) {
      const existing = newPacks.find(p => p.type === pack.type);
      if (existing) newPacks = newPacks.map(p => p.type === pack.type ? { ...p, count: p.count + 1 } : p);
      else newPacks.push({ ...pack, id: pack.type, count: 1 });
    }
    updateGameState({ coins: stateRef.current.coins + amount, inventoryPacks: newPacks, claimedDays: [...stateRef.current.claimedDays, day], lastClaimedDate: new Date().toISOString().split('T')[0] });
  }, [updateGameState]);

  const addPackToInventory = useCallback(async (pack: { id: string; type: string; name: string }, sync: boolean = false) => {
    const existing = stateRef.current.inventoryPacks.find(p => p.type === pack.type);
    let newPacks = existing ? stateRef.current.inventoryPacks.map(p => p.type === pack.type ? { ...p, count: p.count + 1 } : p) : [...stateRef.current.inventoryPacks, { ...pack, id: pack.type, count: 1 }];
    updateGameState({ inventoryPacks: newPacks });
  }, [updateGameState]);

  const removePackFromInventory = useCallback(async (packId: string, sync: boolean = false) => {
    const existing = stateRef.current.inventoryPacks.find(p => p.id === packId);
    if (!existing) return;
    let newPacks = existing.count > 1 ? stateRef.current.inventoryPacks.map(p => p.id === packId ? { ...p, count: p.count - 1 } : p) : stateRef.current.inventoryPacks.filter(p => p.id !== packId);
    updateGameState({ inventoryPacks: newPacks });
  }, [updateGameState]);

  const setPremium = useCallback(async (isPremium: boolean, sync: boolean = false) => {
    updateGameState({ isPremium });
  }, [updateGameState]);

  const resetGame = useCallback(async (sync: boolean = false) => {
    setState(prev => ({ ...prev, coins: 500, collection: [], customCards: [], unlockedAchievements: [], claimedAchievements: [], lastClaimedDate: null, claimedDays: [], inventoryPacks: [], isPremium: false }));
  }, []);

  const forceSync = useCallback(async () => {
    if (stateRef.current.user) await forceSyncToSupabase(stateRef.current, 1, false);
  }, [forceSyncToSupabase]);

  const contextValue = useMemo(() => ({
    ...state, isAuthLoading, setCoins, addCoins, spendCoins, addToCollection, addCustomCard, setCurrentView, unlockAchievement, claimAchievementReward, claimReward, addPackToInventory, removePackFromInventory, setPremium, resetGame, updateGameState, updateGameStateAsync, forceSync, isSaving, isBackgroundSaving, syncError, removeNotification, isInitialSyncDone, isOffline, showWelcomeGift, setShowWelcomeGift, login, logout
  }), [state, isAuthLoading, isInitialSyncDone, isOffline, syncError, showWelcomeGift, setCoins, addCoins, spendCoins, addToCollection, addCustomCard, setCurrentView, unlockAchievement, claimReward, addPackToInventory, removePackFromInventory, setPremium, resetGame, updateGameState, forceSync, isSaving, isBackgroundSaving, login, logout]);

  return <GameContext.Provider value={contextValue}>{children}</GameContext.Provider>;
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};
