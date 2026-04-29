import { FranchiseState } from '../types';

const STORAGE_KEY = "franchiseState";

export const stateService = {
  save(state: FranchiseState): void {
    try {
      const serializedState = JSON.stringify(state);
      localStorage.setItem(STORAGE_KEY, serializedState);
    } catch (error) {
      console.error("Failed to save franchise state", error);
    }
  },

  load(): FranchiseState | null {
    try {
      const serializedState = localStorage.getItem(STORAGE_KEY);
      if (!serializedState) return null;
      return JSON.parse(serializedState) as FranchiseState;
    } catch (error) {
      console.error("Failed to load franchise state", error);
      return null;
    }
  },

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  },

  exists(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }
};
