/**
 * ============================================================================
 * SCREAM EDITION (HALLOWEEN) - CENTRAL CONFIGURATION
 * ============================================================================
 * 
 * Adjust START_DATE and END_DATE here. The Scream Edition collection, packs,
 * and SBC challenges will automatically appear and disappear for normal users
 * based on their local device time during this window.
 * 
 * NOTE: Premium / Ad-Free purchase does NOT activate Halloween cards.
 * Halloween cards are strictly active during the event dates or via the
 * developer override code ('camatxo').
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
const SCREAM_DEV_OVERRIDE_KEY = 'hoops_scream_dev_unlocked';

/**
 * Check if the developer override is active (set specifically by admin code 'camatxo')
 */
export function isScreamDevOverrideActive(): boolean {
  try {
    return localStorage.getItem(SCREAM_DEV_OVERRIDE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Set the developer override for Scream Edition (used by 'camatxo' code / dev resets)
 */
export function setScreamDevOverride(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(SCREAM_DEV_OVERRIDE_KEY, 'true');
    } else {
      localStorage.removeItem(SCREAM_DEV_OVERRIDE_KEY);
      localStorage.removeItem(SCREAM_FILTER_STORAGE_KEY);
    }
  } catch {
    // safe fallback
  }
}

/**
 * Returns true if Scream Edition should be visible and accessible.
 * Active if:
 * 1. Current local device time is within [START_DATE, END_DATE], OR
 * 2. Developer override is active (via 'camatxo' code).
 * 
 * IMPORTANT: Ad-Free / Premium purchase does NOT activate the Halloween event.
 */
export function isScreamEditionActive(): boolean {
  // Check developer override first
  if (isScreamDevOverrideActive()) {
    return true;
  }

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
 * Visible if:
 * 1. The event is currently active, OR
 * 2. The user has already owned at least one Scream card, OR
 * 3. It was unlocked during an active event in this storage.
 */
export function isScreamFilterPermanentlyAvailable(hasOwnedCards: boolean = false): boolean {
  if (isScreamEditionActive()) {
    try {
      localStorage.setItem(SCREAM_FILTER_STORAGE_KEY, 'true');
    } catch {
      // safe fallback
    }
    return true;
  }

  if (hasOwnedCards) {
    return true;
  }

  try {
    return localStorage.getItem(SCREAM_FILTER_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

