import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { GameState, ViewType, Card, User } from '../types';
import { supabase } from '../lib/supabase';

interface GameContextType extends GameState {
  setCoins: (coins: number) => void;
  addToCollection: (cardIds: string[]) => void;
  addCustomCard: (card: Card) => void;
  setCurrentView: (view: ViewType) => void;
  unlockAchievement: (id: string) => void;
  claimReward: (day: number, amount: number) => void;
  addPackToInventory: (pack: { id: string; type: string; name: string }) => void;
  removePackFromInventory: (packId: string) => void;
  setPremium: (status: boolean) => void;
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

  // Auth and Profile sync
  useEffect(() => {
    if (!supabase) return;

    const syncProfile = async (user: any) => {
      if (!user) {
        setState(prev => ({ ...prev, user: null }));
        return;
      }

      const userData: User = {
        id: user.id,
        email: user.email,
        username: user.user_metadata?.full_name || user.email?.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url,
      };

      // Fetch profile from Supabase
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const newProfile = {
          id: user.id,
          coins: state.coins,
          cards: state.collection,
          ads_disabled: state.isPremium,
        };
        await supabase.from('profiles').insert([newProfile]);
        setState(prev => ({ ...prev, user: userData }));
      } else if (profile) {
        // Profile exists, sync state
        setState(prev => ({
          ...prev,
          user: userData,
          coins: profile.coins,
          collection: profile.cards || [],
          isPremium: profile.ads_disabled || false,
        }));
      }
    };

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      syncProfile(session?.user || null);
    });

    // Initial check
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncProfile(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Persist to Supabase if logged in
  useEffect(() => {
    if (state.user && supabase) {
      supabase.from('profiles').update({
        coins: state.coins,
        cards: state.collection,
        ads_disabled: state.isPremium,
      }).eq('id', state.user.id).then(({ error }) => {
        if (error) console.error('Failed to sync to Supabase', error);
      });
    }
  }, [state.coins, state.collection, state.user, state.isPremium]);

  useEffect(() => {
    localStorage.setItem('nba-opener-state', JSON.stringify(state));
  }, [state]);

  const login = async () => {
    if (!supabase) {
      console.error('Supabase not configured');
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) console.error('Login error', error);
  };

  const logout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  const setCoins = (coins: number) => setState(prev => ({ ...prev, coins }));
  const addToCollection = (cardIds: string[]) => setState(prev => ({ 
    ...prev, 
    collection: [...prev.collection, ...cardIds] 
  }));
  const addCustomCard = (card: Card) => setState(prev => ({
    ...prev,
    customCards: [...prev.customCards, card]
  }));
  const setCurrentView = (currentView: ViewType) => setState(prev => ({ ...prev, currentView }));
  const unlockAchievement = (id: string) => setState(prev => ({
    ...prev,
    unlockedAchievements: [...prev.unlockedAchievements, id]
  }));
  const claimReward = (day: number, amount: number) => setState(prev => ({
    ...prev,
    coins: prev.coins + amount,
    claimedDays: [...prev.claimedDays, day],
    lastClaimedDate: new Date().toISOString().split('T')[0]
  }));

  const addPackToInventory = (pack: { id: string; type: string; name: string }) => setState(prev => {
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
  });

  const removePackFromInventory = (packId: string) => setState(prev => {
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
  });

  const setPremium = (isPremium: boolean) => setState(prev => ({ ...prev, isPremium }));

  return (
    <GameContext.Provider value={{ ...state, setCoins, addToCollection, addCustomCard, setCurrentView, unlockAchievement, claimReward, addPackToInventory, removePackFromInventory, setPremium, login, logout }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};
