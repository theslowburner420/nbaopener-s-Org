/**
 * ============================================================================
 * SCREAM EDITION (HALLOWEEN) - CENTRAL CONFIGURATION
 * ============================================================================
 * 
 * Adjust START_DATE and END_DATE here. The Scream Edition collection, packs,
 * and SBC challenges will automatically appear and disappear for normal users
 * based on their local device time during this window.
 * 
 * When the admin code 'camatxo' is active (isPremium === true), all Scream Edition
 * cards, packs, and SBCs are immediately available and visible at any time.
 */

export const SCREAM_EDITION_CONFIG = {
  /**
   * Start date of the Halloween event (Local device time)
   * Format: YYYY-MM-DDTHH:mm:ss
   */
  START_DATE: '2026-10-25T00:00:00',

  /**
   * End date of the Halloween event (Local device time)
   * Format: YYYY-MM-DDTHH:mm:ss
   */
  END_DATE: '2026-11-04T23:59:59',

  // Pack Shop Metadata
  PACK_ID: 'scream_edition' as const,
  PACK_NAME: 'Scream Edition Pack',
  PACK_PRICE: 160000,
  PACK_CARDS_COUNT: 5,
  PACK_IMAGE: 'https://i.postimg.cc/SntfDrBP/Calabaza-de-terror-con-balon-brillante.png',

  // Series Information
  SERIES_NAME: 'Scream Edition',
  CATEGORY_NAME: 'Scream Edition',
};

const SCREAM_FILTER_STORAGE_KEY = 'hoops_scream_filter_unlocked';

/**
 * Returns true if Scream Edition should be visible and accessible.
 * Active if:
 * 1. Current local device time is within [START_DATE, END_DATE], OR
 * 2. User has unlocked content via 'camatxo' code (isUnlockedOrPremium is true).
 */
export function isScreamEditionActive(isUnlockedOrPremium: boolean = false): boolean {
  if (isUnlockedOrPremium) return true;

  try {
    const now = new Date();
    const start = new Date(SCREAM_EDITION_CONFIG.START_DATE);
    const end = new Date(SCREAM_EDITION_CONFIG.END_DATE);
    return now >= start && now <= end;
  } catch {
    return false;
  }
}

/**
 * Returns true if the Scream Edition filter in Collection should be shown.
 * Once activated (during event window or via code), it is saved to localStorage
 * so that it permanently stays available in the collection filters as requested.
 */
export function isScreamFilterPermanentlyAvailable(isUnlockedOrPremium: boolean = false): boolean {
  if (isScreamEditionActive(isUnlockedOrPremium)) {
    try {
      localStorage.setItem(SCREAM_FILTER_STORAGE_KEY, 'true');
    } catch {
      // safe fallback
    }
    return true;
  }

  try {
    return localStorage.getItem(SCREAM_FILTER_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}
