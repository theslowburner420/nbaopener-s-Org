import { isScreamEditionActive, SCREAM_EDITION_CONFIG } from './screamEdition';
import { PackType } from '../hooks/useEngine';

export interface GameEventConfig {
  id: string;
  name: string;
  shortName: string;
  tag: string;
  icon: string;
  packId: PackType;
  packName: string;
  packPrice: number;
  packCardsCount: number;
  packImage: string;
  packDescription: string;
  oddsDescription: string;
  oddsBreakdown: {
    eventCardRate: string;
    specialsRate: string;
    baseRate: string;
  };
  sbcCategoryId?: string;
  tournamentId?: string;
  theme: {
    accentColor: string;
    borderGlow: string;
    bgGradient: string;
    badgeBg: string;
    badgeText: string;
    textColor: string;
    buttonGradient: string;
  };
  isActive: (isPremium?: boolean) => boolean;
}

/**
 * Global Registry of Game Events.
 * Any new event (Halloween, Winter Holiday, All-Star, Spring Playoffs, etc.)
 * is registered here and automatically propagates to the Store, SBCs, and Tournaments.
 */
export const GAME_EVENTS: GameEventConfig[] = [
  {
    id: 'scream_edition',
    name: 'Halloween Scream Edition',
    shortName: 'Scream Event',
    tag: '🎃 LIMITED-TIME EVENT',
    icon: '🎃',
    packId: SCREAM_EDITION_CONFIG.PACK_ID as PackType,
    packName: SCREAM_EDITION_CONFIG.PACK_NAME,
    packPrice: SCREAM_EDITION_CONFIG.PACK_PRICE,
    packCardsCount: SCREAM_EDITION_CONFIG.PACK_CARDS_COUNT,
    packImage: SCREAM_EDITION_CONFIG.PACK_IMAGE,
    packDescription: 'Limited-time Halloween drop featuring eerie boosted stats, supernatural card arts, and haunted icons.',
    oddsDescription: '10% Scream • 10% Specials • 80% Base',
    oddsBreakdown: {
      eventCardRate: '10% Scream Card',
      specialsRate: '10% Other Specials (Award/All-NBA/HOF)',
      baseRate: '80% Base Cards (All-Star/Starter/Bench)'
    },
    sbcCategoryId: 'scream',
    tournamentId: 'halloween_scream',
    theme: {
      accentColor: 'orange',
      borderGlow: 'border-orange-500/80 shadow-[0_0_25px_rgba(249,115,22,0.35)]',
      bgGradient: 'from-orange-950/70 via-purple-950/40 to-black',
      badgeBg: 'bg-gradient-to-r from-orange-500 to-amber-500',
      badgeText: 'text-black',
      textColor: 'text-orange-400',
      buttonGradient: 'from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black'
    },
    isActive: (isPremium?: boolean) => isScreamEditionActive(isPremium)
  }
];

/**
 * Returns all currently active game events.
 */
export function getActiveEvents(isPremium?: boolean): GameEventConfig[] {
  return GAME_EVENTS.filter(event => event.isActive(isPremium));
}

/**
 * Returns the primary active featured event (if any).
 */
export function getPrimaryActiveEvent(isPremium?: boolean): GameEventConfig | null {
  const active = getActiveEvents(isPremium);
  return active.length > 0 ? active[0] : null;
}
