export type Rarity = 'bench' | 'starter' | 'allstar' | 'franchise' | 'legend' | 'coach' | 'dpoy' | 'roty' | 'record' | 'rookie';

export type CardCategory = 'Base' | 'Award' | 'Moment' | 'Duo' | 'Coach' | 'Dynasty' | 'X-Factor' | 'NBA Record' | 'Rookie' | 'All-Star MVP' | 'Finals MVP';

export type RoleTier = 'S' | 'A' | 'B' | 'C' | 'D';

export type AwardType = 'MVP' | 'DPOY' | '6MAN' | 'ROTY' | 'CLUTCH';

export interface Card {
  id: string;
  number: number;
  name: string;
  team: string;
  teamAbbr: string;
  teamColor: string;
  position: string;
  rarity: Rarity;
  category: CardCategory;
  subtitle: string;
  series?: string;
  isHistorical: boolean;
  pts: number;
  reb: number;
  ast: number;
  nbaId: number;
  stats: {
    points: number;
    rebounds: number;
    assists: number;
    ovr: number;
  };
  description: string;
  momentTitle?: string;
  momentDate?: string;
  quote: string;
  imageUrl: string;
  isNew?: boolean;
  coach?: string;
  player2Id?: number;
  teamLogoUrl?: string;
}

export type ViewType = 'collection' | 'open' | 'packs' | 'rewards' | 'shop' | 'profile' | 'home' | 'draft' | 'trading';

export interface Achievement {
  id: string;
  category: 'drafting' | 'tournaments' | 'matches';
  title: string;
  description: string;
  rewardText: string;
  rewards: Array<{
    type: 'coins' | 'pack';
    amount?: number;
    packType?: string;
    packName?: string;
  }>;
  icon: any;
}

export interface InventoryPack {
  id: string;
  type: string;
  name: string;
  count: number;
}

export interface User {
  id: string;
  email?: string;
  username?: string;
  avatar_url?: string;
}

export interface GameState {
  user: User | null;
  coins: number;
  collection: Record<string, number>; // Map of card ID to quantity
  customCards: Card[];
  currentView: ViewType;
  unlockedAchievements: string[];
  claimedAchievements: string[];
  lastClaimedDate: string | null;
  claimedDays: number[]; // Array of day indices (1-7)
  inventoryPacks: InventoryPack[];
  isPremium: boolean;
}
