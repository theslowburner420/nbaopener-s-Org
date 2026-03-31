import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { GameState, ViewType, Card, User } from '../types';
import { supabase } from '../lib/supabase';

interface GameContextType extends GameState {
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

  // Auth and Profile sync
  useEffect(() => {
    if (!supabase) {
      console.warn('Supabase client not initialized');
      return;
    }

    const syncProfile = async (user: any) => {
      console.log('Syncing profile for user:', user?.id);
      if (!user) {
        console.log('No user detected, clearing user state');
        setState(prev => ({ ...prev, user: null }));
        return;
      }

      const userData: User = {
        id: user.id,
        email: user.email,
        username: user.user_metadata?.full_name || user.email?.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url,
      };

      try {
        console.log('Fetching profile from Supabase...');
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          console.log('Profile not found, creating new profile...');
          const newProfile = {
            id: user.id,
            coins: 1000,
            cards: [],
            unlocked_achievements: [],
            inventory_packs: [],
            ads_disabled: false,
          };
          const { error: insertError } = await supabase.from('profiles').insert([newProfile]);
          if (insertError) {
            console.error('Error creating profile:', insertError);
            return;
          }
          console.log('New profile created successfully');
          setState(prev => ({ 
            ...prev, 
            user: userData,
            coins: 1000,
            collection: [],
            unlockedAchievements: [],
            inventoryPacks: [],
            isPremium: false
          }));
        } else if (profile) {
          console.log('Profile loaded successfully:', profile.id);
          setState(prev => ({
            ...prev,
            user: userData,
            coins: profile.coins,
            collection: profile.cards || [],
            unlockedAchievements: profile.unlocked_achievements || [],
            inventoryPacks: profile.inventory_packs || [],
            isPremium: profile.ads_disabled || false,
          }));
        } else if (error) {
          console.error('Error fetching profile:', error);
        }
      } catch (err) {
        console.error('Unexpected error in syncProfile:', err);
      }
    };

    // Listen for auth changes
    console.log('Setting up auth state change listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      syncProfile(session?.user || null);
    });

    // Initial check for session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting initial session:', error);
      }
      console.log('Initial session check:', session?.user?.id);
      if (session) {
        syncProfile(session.user);
      }
    });

    return () => {
      console.log('Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  // Handle Auth Callback (PKCE)
  useEffect(() => {
    if (!supabase || authProcessed.current) return;

    const handleAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');
      const errorDescription = params.get('error_description');

      if (error || errorDescription) {
        authProcessed.current = true;
        console.error('Auth error detected in URL:', error, errorDescription);
        // Clean URL to prevent repeated error processing
        const url = new URL(window.location.href);
        url.searchParams.delete('error');
        url.searchParams.delete('error_description');
        window.history.replaceState({}, document.title, url.toString());
        return;
      }
      
      if (code) {
        authProcessed.current = true;
        console.log('Auth code detected in URL, exchanging for session...');
        try {
          // Use exchangeCodeForSession to manually handle the PKCE flow
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('Error exchanging code for session:', exchangeError.message);
          } else if (data.session) {
            console.log('Code exchanged successfully for session:', data.session.user.id);
          }
        } catch (err) {
          console.error('Unexpected error during code exchange:', err);
        } finally {
          // Clean URL regardless of outcome to avoid re-processing the same code
          const url = new URL(window.location.href);
          url.searchParams.delete('code');
          url.searchParams.delete('state');
          window.history.replaceState({}, document.title, url.toString());
        }
      }
    };

    handleAuthCallback();
  }, []);

  // Persist to Supabase if logged in
  useEffect(() => {
    if (state.user && supabase) {
      supabase.from('profiles').update({
        coins: state.coins,
        cards: state.collection,
        unlocked_achievements: state.unlockedAchievements,
        inventory_packs: state.inventoryPacks,
        ads_disabled: state.isPremium,
      }).eq('id', state.user.id).then(({ error }) => {
        if (error) console.error('Failed to sync to Supabase', error);
      });
    }
  }, [state.coins, state.collection, state.user, state.isPremium, state.unlockedAchievements, state.inventoryPacks]);

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

  const resetGame = useCallback(() => {
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
  }, []);

  const contextValue = useMemo(() => ({
    ...state,
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
  }), [state, setCoins, addCoins, spendCoins, addToCollection, addCustomCard, setCurrentView, unlockAchievement, claimReward, addPackToInventory, removePackFromInventory, setPremium, resetGame, login, logout]);

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
