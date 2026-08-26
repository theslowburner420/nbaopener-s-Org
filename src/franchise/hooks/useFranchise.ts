import { useState, useEffect, useCallback } from 'react';
import { FranchiseState } from '../types';
import { stateService } from '../services/stateService';
import { initializeFranchiseState } from '../services/rosterService';
import { gameService } from '../services/gameService';
import { useGame } from '../../context/GameContext';

export function useFranchise() {
  const { franchise: cloudFranchise, user } = useGame();
  const [state, setState] = useState<FranchiseState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const savedState = stateService.load();
    if (savedState) {
      // Data Migration / Healing
      if (!savedState.negotiations) savedState.negotiations = {};
      if (!savedState.stats) {
        savedState.stats = { seasonal: {}, career: {} };
      } else {
        if (!savedState.stats.seasonal) savedState.stats.seasonal = {};
        if (!savedState.stats.career) savedState.stats.career = {};
      }
      if (!savedState.draftHistory) savedState.draftHistory = [];
      if (!savedState.tradeHistory) savedState.tradeHistory = [];
      if (!savedState.awards) savedState.awards = {};
      if (!savedState.trophyCase) savedState.trophyCase = [];
      if (!savedState.playoffSeries) savedState.playoffSeries = [];
      if (!savedState.notifications) savedState.notifications = [];
      
      setState(savedState as FranchiseState);
    }
    setIsLoading(false);
  }, []);

  // Sync Logic
  useEffect(() => {
    if (user && cloudFranchise && state) {
      const cloudPhase = (cloudFranchise as any).phase;
      if (cloudPhase && cloudPhase !== state.phase) {
        setIsSyncing(true);
        console.log(`[FRANCHISE] Syncing Phase Discrepancy: ${state.phase} (local) vs ${cloudPhase} (Firestore). Firestore priority.`);
        
        const newState = { ...state, phase: cloudPhase };
        setState(newState);
        stateService.save(newState);
        
        const timer = setTimeout(() => setIsSyncing(false), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, cloudFranchise, state?.phase]);

  const startNewFranchise = useCallback((teamId: string) => {
    const newState = initializeFranchiseState(teamId);
    stateService.save(newState);
    setState(newState);
  }, []);

  const advanceWeek = useCallback(() => {
    if (!state) return;
    const newState = gameService.advanceWeek(state);
    setState(newState);
  }, [state]);

  const resetFranchise = useCallback(() => {
    stateService.clear();
    setState(null);
  }, []);

  return {
    state,
    setState,
    isLoading,
    isSyncing,
    startNewFranchise,
    advanceWeek,
    resetFranchise
  };
}
