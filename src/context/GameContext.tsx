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
    const saved = localStorage.getItem('nba-opener-state');
    const defaultState: GameState = {
      user: null,
      coins: 1000,
      collection: [],
      customCards: [],
      currentView: 'open',
      unlockedAchievements: [],
      lastClaimedDate: null,
      claimedDays: [],
      inventoryPacks: [],
      isPremium: false,
    };
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultState, ...parsed };
      } catch (e) {
        console.error('Failed to parse saved state', e);
        return defaultState;
      }
    }
    return defaultState;
  });

  const authProcessed = React.useRef(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isInitialSyncDone, setIsInitialSyncDone] = useState(false);
  const stateRef = useRef(state);
  const profileSubscriptionRef = useRef<any>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const syncProfile = useCallback(async (user: any) => {
    console.log('Syncing profile for user:', user?.id);
    
    if (!user) {
      console.log('No user detected, clearing user state');
      setState(prev => ({ 
        ...prev, 
        user: null,
      }));
      setIsInitialSyncDone(false);
      setIsAuthLoading(false);
      if (profileSubscriptionRef.current) {
        supabase?.removeChannel(profileSubscriptionRef.current);
        profileSubscriptionRef.current = null;
      }
      return;
    }

    // If already synced for this user, don't do it again
    if (stateRef.current.user?.id === user.id && isInitialSyncDone) {
      setIsAuthLoading(false);
      return;
    }

    // Set basic user info immediately to update UI quickly (Header will show this)
    const userData: User = {
      id: user.id,
      email: user.email,
      username: user.user_metadata?.full_name || user.email?.split('@')[0],
      avatar_url: user.user_metadata?.avatar_url,
    };

    setState(prev => ({ ...prev, user: userData }));

    // Set up real-time subscription
    if (!profileSubscriptionRef.current && supabase) {
      console.log('Setting up real-time subscription for user:', user.id);
      profileSubscriptionRef.current = supabase
        .channel(`public:profiles:id=eq.${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Real-time profile update received:', payload.new);
            const newProfile = payload.new;
            setState(prev => ({
              ...prev,
              user: prev.user ? {
                ...prev.user,
                username: newProfile.username || prev.user.username,
                avatar_url: newProfile.avatar_url || prev.user.avatar_url,
              } : null,
              coins: newProfile.coins ?? prev.coins,
              collection: newProfile.cards || prev.collection,
              customCards: newProfile.custom_cards || prev.customCards,
              unlockedAchievements: newProfile.unlocked_achievements || prev.unlockedAchievements,
              lastClaimedDate: newProfile.last_claimed_date || prev.lastClaimedDate,
              claimedDays: newProfile.claimed_days || prev.claimedDays,
              inventoryPacks: newProfile.inventory_packs || prev.inventoryPacks,
              isPremium: newProfile.ads_disabled || prev.isPremium,
            }));
          }
        )
        .subscribe();
    }

    try {
      console.log('Fetching profile from Supabase for user:', user.id);
      const { data: profile, error } = await supabase!
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        console.log('Profile not found, creating new profile with current guest progress...');
        const currentState = stateRef.current;
        const newProfile = {
          id: user.id,
          username: userData.username,
          avatar_url: userData.avatar_url,
          coins: currentState.coins,
          cards: currentState.collection,
          custom_cards: currentState.customCards,
          unlocked_achievements: currentState.unlockedAchievements,
          last_claimed_date: currentState.lastClaimedDate,
          claimed_days: currentState.claimedDays,
          inventory_packs: currentState.inventoryPacks,
          ads_disabled: currentState.isPremium,
        };
        
        const { error: insertError } = await supabase!.from('profiles').insert([newProfile]);
        if (insertError) {
          console.error('Error creating profile:', insertError);
        } else {
          console.log('New profile created successfully');
        }
        setIsInitialSyncDone(true);
      } else if (profile) {
        console.log('Profile loaded successfully for user:', profile.id);
        setState(prev => ({
          ...prev,
          user: {
            ...userData,
            username: profile.username || userData.username,
            avatar_url: profile.avatar_url || userData.avatar_url,
          },
          coins: profile.coins ?? 1000,
          collection: profile.cards || [],
          customCards: profile.custom_cards || [],
          unlockedAchievements: profile.unlocked_achievements || [],
          lastClaimedDate: profile.last_claimed_date || null,
          claimedDays: profile.claimed_days || [],
          inventoryPacks: profile.inventory_packs || [],
          isPremium: profile.ads_disabled || false,
        }));
        setIsInitialSyncDone(true);
      } else if (error) {
        console.error('Error fetching profile:', error);
        setIsInitialSyncDone(true);
      }
    } catch (err) {
      console.error('Unexpected error in syncProfile:', err);
      setIsInitialSyncDone(true);
    } finally {
      setIsAuthLoading(false);
    }
  }, [isInitialSyncDone]);

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

  // Persist to Supabase if logged in and initial sync is complete
  useEffect(() => {
    if (state.user && supabase && isInitialSyncDone) {
      const saveData = async () => {
        const { error } = await supabase.from('profiles').update({
          coins: state.coins,
          cards: state.collection,
          custom_cards: state.customCards,
          unlocked_achievements: state.unlockedAchievements,
          last_claimed_date: state.lastClaimedDate,
          claimed_days: state.claimedDays,
          inventory_packs: state.inventoryPacks,
          ads_disabled: state.isPremium,
        }).eq('id', state.user?.id);
        
        if (error) {
          console.error('Failed to sync to Supabase:', error.message);
        }
      };
      
      saveData();
    }
  }, [
    state.coins, 
    state.collection, 
    state.customCards,
    state.user, 
    state.isPremium, 
    state.unlockedAchievements, 
    state.inventoryPacks,
    state.lastClaimedDate,
    state.claimedDays,
    isInitialSyncDone
  ]);

  useEffect(() => {
    localStorage.setItem('nba-opener-state', JSON.stringify(state));
  }, [state]);

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

  const setCoins = useCallback((coins: number | ((prev: number) => number)) => setState(prev => ({ 
    ...prev, 
    coins: typeof coins === 'function' ? coins(prev.coins) : coins 
  })), []);

  const addCoins = useCallback((amount: number) => setState(prev => ({
    ...prev,
    coins: prev.coins + amount
  })), []);

  const spendCoins = useCallback((amount: number) => {
    if (state.coins >= amount) {
      setState(prev => ({ ...prev, coins: prev.coins - amount }));
      return true;
    }
    return false;
  }, [state.coins]);

  const addToCollection = useCallback((cardIds: string[]) => setState(prev => ({ 
    ...prev, 
    collection: [...prev.collection, ...cardIds] 
  })), []);

  const addCustomCard = useCallback((card: Card) => setState(prev => ({
    ...prev,
    customCards: [...prev.customCards, card]
  })), []);

  const setCurrentView = useCallback((currentView: ViewType) => setState(prev => ({ ...prev, currentView })), []);

  const unlockAchievement = useCallback((id: string) => setState(prev => ({
    ...prev,
    unlockedAchievements: [...prev.unlockedAchievements, id]
  })), []);

  const claimReward = useCallback((day: number, amount: number) => setState(prev => ({
    ...prev,
    coins: prev.coins + amount,
    claimedDays: [...prev.claimedDays, day],
    lastClaimedDate: new Date().toISOString().split('T')[0]
  })), []);

  const addPackToInventory = useCallback((pack: { id: string; type: string; name: string }) => setState(prev => {
    const existing = prev.inventoryPacks.find(p => p.id === pack.id);
    if (existing) {
      return {
        ...prev,
        inventoryPacks: prev.inventoryPacks.map(p => p.id === pack.id ? { ...p, count: p.count + 1 } : p)
      };
    }
    return {
      ...prev,
      inventoryPacks: [...prev.inventoryPacks, { ...pack, count: 1 }]
    };
  }), []);

  const removePackFromInventory = useCallback((packId: string) => setState(prev => {
    const existing = prev.inventoryPacks.find(p => p.id === packId);
    if (!existing) return prev;
    if (existing.count > 1) {
      return {
        ...prev,
        inventoryPacks: prev.inventoryPacks.map(p => p.id === packId ? { ...p, count: p.count - 1 } : p)
      };
    }
    return {
      ...prev,
      inventoryPacks: prev.inventoryPacks.filter(p => p.id !== packId)
    };
  }), []);

  const setPremium = useCallback((isPremium: boolean) => setState(prev => ({ ...prev, isPremium })), []);

  const resetGame = useCallback(async () => {
    const confirmReset = window.confirm("Are you sure you want to reset all progress? This cannot be undone.");
    if (!confirmReset) return;

    setState(prev => ({
      ...prev,
      coins: 1000,
      collection: [],
      customCards: [],
      unlockedAchievements: [],
      lastClaimedDate: null,
      claimedDays: [],
      inventoryPacks: [],
      isPremium: false,
    }));

    // If logged in, the persistence useEffect will handle the sync to Supabase
    // but we can also force a save here if needed.
  }, []);

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
