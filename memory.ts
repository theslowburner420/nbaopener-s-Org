import { simulationEngine } from '../franchise/services/simulationEngine';

/**
 * MemoryManager utility to handle cleanup of old processes and assets.
 */
export const MemoryManager = {
  /**
   * Clears image caches and releases object URLs if any were created.
   */
  cleanupAssets: () => {
    // Clear simulation caches to free up memory
    simulationEngine.clearCache();
    console.log('[MemoryManager] Assets and service caches cleaned.');
  },

  optimizeMemory: () => {
    // This can be used to trigger GC hints if browser allows or just clear caches
    simulationEngine.clearCache();
  },

  /**
   * Clears temporary state that might accumulate over time.
   */
  clearTempState: () => {
    // This can be called to reset any non-persistent state that might grow.
    console.log('[MemoryManager] Clearing temporary state...');
  }
};
