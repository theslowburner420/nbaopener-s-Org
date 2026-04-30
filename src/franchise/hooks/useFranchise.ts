import { useState, useEffect, useCallback } from 'react';
import { FranchiseState } from '../types';
import { stateService } from '../services/stateService';
import { initializeFranchiseState } from '../services/rosterService';
import { gameService } from '../services/gameService';

export function useFranchise() {
  const [state, setState] = useState<FranchiseState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      if (!savedState.teamHistory) savedState.teamHistory = [];
      if (!savedState.seasonHighs) savedState.seasonHighs = {};
      if (!savedState.freeAgentPool) savedState.freeAgentPool = [];
      if (!savedState.notifications) savedState.notifications = [];
      
      setState(savedState);
    }
    setIsLoading(false);
  }, []);

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
    startNewFranchise,
    advanceWeek,
    resetFranchise
  };
}
