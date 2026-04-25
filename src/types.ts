export type Rarity = 'bench' | 'starter' | 'allstar' | 'franchise' | 'legend' | 'coach' | 'dpoy' | 'roty' | 'record' | 'rookie' | 'logo' | 'arena' | 'draft2026' | 'scoring_champ' | 'hof' | 'coy';

export type CardCategory = 'Base' | 'Award' | 'Moment' | 'Duo' | 'Coach' | 'Dynasty' | 'X-Factor' | 'NBA Record' | 'Rookie' | 'All-Star MVP' | 'Finals MVP' | 'Logo' | 'Arena' | 'Draft 2026' | 'Scoring Champion' | 'Hall of Fame' | 'Coach of the Year';

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

export type ViewType = 'collection' | 'open' | 'packs' | 'rewards' | 'shop' | 'profile' | 'home' | 'draft' | 'trading' | 'career';

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

export interface CareerMatch {
  id: string;
  opponentTeam: string;
  opponentAbbr?: string;
  opponentOVR?: number;
  played: boolean;
  result?: 'W' | 'L';
  score?: [number, number];
  quarters?: [number, number, number, number];
  oppQuarters?: [number, number, number, number];
  mvp?: string;
  narrative?: string;
  homeGame?: boolean;
  stats?: {
    pts: number;
    reb: number;
    ast: number;
  };
  date: string;
}

export interface GameLog {
  matchId: string;
  week: number;
  opponent: string;
  result: 'W' | 'L';
  score: [number, number];
  narrative: string;
  mvp: string;
  xpGained: number;
  budgetGained: number;
}

export interface GameEvent {
  id: string;
  type: 'hot_streak' | 'cold_streak' | 'injury' | 'mvp_buzz';
  cardId: string;
  playerName: string;
  description: string;
  matchesLeft: number;
  ovrDelta: number;
}

export interface Milestone {
  id: string;
  type: 'short' | 'medium' | 'season';
  description: string;
  current: number;
  target: number;
  reward: { type: 'coins' | 'pack'; value: number };
  completed: boolean;
}

export interface PlayerContract {
  cardId: string;
  yearsLeft: number; // 1-5
  salary: number; // millions $
  type: 'rookie' | 'veteran' | 'max' | 'mid-level' | 'minimum';
  canExtend: boolean;
  canTrade: boolean;
}

export interface BoxScorePlayer {
  cardId: string;
  name: string;
  position: string;
  minutes: number;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
  fg: string; // "8/17"
  threePt: string; // "3/7"
  ft: string; // "5/6"
  plusMinus: number;
}

export interface PlayerSeasonStats {
  cardId: string;
  playerName: string;
  teamAbbr: string;
  gamesPlayed: number;
  totalPts: number;
  totalReb: number;
  totalAst: number;
  totalStl: number;
  totalBlk: number;
  avgPts: number;
  avgReb: number;
  avgAst: number;
  avgStl: number;
  avgBlk: number;
}

export type MarketPhase = 'regular_season' | 'trade_deadline' | 'free_agency' | 'draft';

export interface TeamStanding {
  teamId: string;
  teamName: string;
  teamAbbr: string;
  conference: 'East' | 'West';
  division?: string;
  wins: number;
  losses: number;
  pct: number;
  gb: number;
  homeRecord?: string;
  awayRecord?: string;
  last10?: string;
  streak: string;
  pointsFor?: number;
  pointsAgainst?: number;
  isUser: boolean;
  clinched?: 'division' | 'playoffs' | 'playin';
}

export interface FranchiseState {
  isActive: boolean;
  team: string | null;
  level: number;
  xp: number;
  budget: number;
  season: number;
  wins: number;
  losses: number;
  schedule: CareerMatch[];
  upgrades: {
    coaching: number;
    scouting: number;
    training: number;
    facilities: number;
  };
  roster: string[]; // List of card IDs
  leagueRosters?: Record<string, string[]>;
  contracts: PlayerContract[];
  currentDate: string;
  marketPhase: MarketPhase;
  playerSeasonStats: PlayerSeasonStats[];
  standings?: Record<string, { wins: number; losses: number }>;
  lineup: {
    PG: string | null;
    SG: string | null;
    SF: string | null;
    PF: string | null;
    C: string | null;
  };
  currentMatchIndex?: number;
  gameLogs?: GameLog[];
  activeEvents?: GameEvent[];
  milestones?: Milestone[];
  salaryCap?: number;
  payroll?: number;
  conferenceStandings: TeamStanding[];
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
  franchise?: FranchiseState;
}
