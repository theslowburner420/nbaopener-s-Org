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
