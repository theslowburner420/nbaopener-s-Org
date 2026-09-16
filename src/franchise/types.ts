import { Rarity } from '../types';

// ============================================================================
// ENUMS (NUEVA ESPECIFICACIÓN)
// ============================================================================

export enum LeaguePhase {
  REGULAR_SEASON = 'regular_season',
  SEASON_AWARDS = 'season_awards',
  PLAYOFFS = 'playoffs',
  OFFSEASON_START = 'offseason_start',
  DRAFT_LOTTERY = 'draft_lottery',
  DRAFT = 'draft',
  FREE_AGENCY = 'free_agency',
  NEW_SEASON = 'new_season'
}

export enum ContractType {
  MAX = 'max',
  SUPERMAX = 'supermax',
  MID = 'mid',
  MINIMUM = 'minimum',
  ROOKIE = 'rookie',
  TWO_WAY = 'two-way'
}

export enum InjurySeverityStatus {
  HEALTHY = 'Healthy',
  DAY_TO_DAY = 'Day-to-Day',
  OUT = 'Out',
  SEASON_ENDING = 'Season-Ending'
}

export enum AwardType {
  MVP = 'MVP',
  DPOY = 'DPOY',
  ROY = 'ROY',
  MIP = 'MIP',
  FMVP = 'FMVP',
  COY = 'COY',
  ALL_NBA = 'ALL_NBA'
}

export enum NotificationType {
  TRADE = 'TRADE',
  NEWS = 'NEWS',
  INJURY = 'INJURY',
  TRADE_PROPOSAL = 'TRADE_PROPOSAL',
  MILESTONE = 'MILESTONE',
  STREAK = 'STREAK',
  RUMOR = 'RUMOR'
}

export enum Conference {
  EAST = 'East',
  WEST = 'West'
}

export enum TrophyType {
  CHAMP = 'CHAMP',
  MVP = 'MVP',
  FMVP = 'FMVP',
  DPOY = 'DPOY',
  ROY = 'ROY',
  RECORD = 'RECORD',
  ALL_NBA = 'ALL_NBA'
}

// ============================================================================
// COMPATIBILITY PHASES AND TYPES
// ============================================================================

export type FranchisePhase = 
  "regular_season" | 
  "season_awards" | 
  "playoffs" | 
  "offseason_start" | 
  "draft_lottery" | 
  "draft" | 
  "free_agency" | 
  "new_season";

// ============================================================================
// SUB-ESTRUCTURAS BÁSICAS
// ============================================================================

export interface PlayerAttributes {
  spd: number;        // Speed
  jmp: number;        // Jump / Vertical
  endu: number;       // Endurance
  durability: number; // Durability / Injury resistance
  ins: number;        // Inside scoring
  mid: number;        // Midrange shot
  out: number;        // Outside / Three-point shot
  def: number;        // Defense
  reb: number;        // Rebounding
  ast: number;        // Passing / Assists
  stl: number;        // Steals
  blk: number;        // Blocks
  ft: number;         // Free Throw
  handle: number;     // Ball handling
  iq: number;         // Basketball IQ
  [key: string]: number | undefined;
}

export interface Injury {
  type: string;
  severity: 'mild' | 'moderate' | 'severe' | 'season-ending' | string;
  gamesRemaining: number;
}

export interface HistoricalStats {
  season: number;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  gamesPlayed: number;
  fgPct: number;
  ovr: number;
}

export interface PlayerStats {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  plusMinus: number;
  gamesPlayed: number;
  fgPct: number;
}

export interface ContractObject {
  playerId: string;
  salary: number;
  yearsRemaining: number;
  contractType: 'max' | 'supermax' | 'mid' | 'minimum' | 'rookie' | 'two-way';
  seasonsWithTeam: number;
  optionType: 'none' | 'team' | 'player';
  noTradeClause: boolean;
  injuryStatus: "Healthy" | "Day-to-Day" | "Out" | "Season-Ending";
  canExtend?: boolean;
  canTrade?: boolean;
}

export interface DraftPickObject {
  id: string;
  originalOwnerId: string;
  year: number;
  round: number;
  isProtected: boolean;
  protectionRange?: number[]; 
}

export interface TeamLineup {
  PG: string | null;
  SG: string | null;
  SF: string | null;
  PF: string | null;
  C: string | null;
  bench: string[]; 
}

export interface BoxScoreEntry {
  playerId: string;
  name: string;
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
  blocks: number;
  plusMinus: number;
  minutes: number;
}

export interface MatchResult {
  winnerId: string;
  score: { home: number; away: number };
  periods: { home: number[]; away: number[] };
  boxScore: {
    home: BoxScoreEntry[];
    away: BoxScoreEntry[];
  };
}

export interface FranchiseMatch {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  gameNumber: number;
  played: boolean;
  score?: { home: number; away: number };
  periods?: { home: number[]; away: number[] };
  winner?: string;
  boxScore?: {
    home: BoxScoreEntry[];
    away: BoxScoreEntry[];
  };
}

export interface PlayoffSeries {
  id: string;
  team1Id: string;
  team2Id: string;
  wins1: number;
  wins2: number;
  winnerId?: string;
  matches: FranchiseMatch[];
  round: number; // 0 for Play-In, 1 for R1, 2 for Semis, 3 for Finals
  conference: 'East' | 'West' | 'Finals';
  seed1?: number;
  seed2?: number;
}

export interface FranchiseNotification {
  id: string;
  type: 'TRADE' | 'NEWS' | 'INJURY' | 'TRADE_PROPOSAL' | 'MILESTONE' | 'STREAK' | 'RUMOR';
  category?: 'TRADE' | 'INJURY' | 'MILESTONE' | 'STREAK' | 'RUMOR' | 'PERFORMANCE' | 'CPU';
  message: string;
  week: number;
  season: number;
  read: boolean;
  data?: any;
}

export interface SeasonHistoryItem {
  seasonYear: number;
  wins: number;
  losses: number;
  playoffResult: string;
  champion: string;
  mvp?: string;
  dpoy?: string;
  roy?: string;
  mip?: string;
  allNba: string[];
  finalsMvp?: string;
}

export interface RetiredPlayer {
  id: string;
  name: string;
  card: any;
  stats: PlayerStats;
  seasonsPlayed: number;
  awards: string[];
  lastTeam: string;
}

// ============================================================================
// NUEVAS ESTRUCTURAS ACTUALIZADAS (PLAYER, TEAM, TRADEOFFER, AWARD, DRAFTCLASS, MATCHUPNODE, LEAGUESTATE)
// ============================================================================

export interface Player {
  id: string;
  name: string;
  age: number;
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C' | string;
  ovr: number;
  potential: number;
  attributes: PlayerAttributes;
  contract: ContractObject;
  injury?: Injury;
  stats: PlayerStats;
  historicalStats: HistoricalStats[];
  draftYear?: number;
  draftPick?: number;
  experience: number;
  rarity: Rarity;
}

export interface Team {
  teamId: string;
  name: string;
  abbreviation: string;
  conference: 'East' | 'West';
  division: string;
  roster: string[]; 
  lineup: TeamLineup;
  contracts: Record<string, ContractObject>;
  draftPicks: DraftPickObject[];
  wins: number;
  losses: number;
  isHuman: boolean;
  payroll: number;
  salaryCap?: number;
  chemistry?: number;
  fanSupport?: number;
  budget?: number;
}

export interface TeamObject extends Team {}

export interface TradeOffer {
  id: string;
  fromTeamId: string;
  toTeamId: string;
  offeredPlayerIds: string[];
  requestedPlayerIds: string[];
  offeredPickIds?: string[];
  requestedPickIds?: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | string;
  expirationWeek: number;
  fairnessValue?: number;
}

export interface Award {
  id: string;
  type: 'MVP' | 'DPOY' | 'ROY' | 'MIP' | 'FMVP' | 'COY' | 'ALL_NBA' | string;
  playerId: string;
  playerName: string;
  teamId: string;
  season: number;
  value?: number;
}

export interface DraftClass {
  year: number;
  players: Player[];
  isScouted: boolean;
}

export interface MatchupNode {
  id: string;
  round: number; // 0 for Play-In, 1 for Conf Semis, etc.
  conference: 'East' | 'West' | 'Finals';
  team1Id?: string;
  team2Id?: string;
  seed1?: number;
  seed2?: number;
  wins1: number;
  wins2: number;
  winnerId?: string;
  childNodeId?: string; 
  parent1NodeId?: string; 
  parent2NodeId?: string;
}

export interface LeagueState {
  version: string;
  season: number;
  week: number;
  phase: FranchisePhase;
  userTeamId: string;
  teams: Record<string, Team>;
  freeAgentPool: string[]; 
  schedule: FranchiseMatch[];
  playoffSeries: PlayoffSeries[];
  draftClass?: DraftClass;
  draftPool?: Player[];
  awards: Record<number, Award[]>;
  notifications: FranchiseNotification[];
  tradeOffers: TradeOffer[];
  history: SeasonHistoryItem[];
  trophyCase: {
    type: 'CHAMP' | 'MVP' | 'FMVP' | 'DPOY' | 'ROY' | 'RECORD' | 'ALL_NBA' | string;
    season: number;
    playerId?: string;
    label?: string;
  }[];
}

// ============================================================================
// ESTADO COMPLETO DE LA FRANQUISIA (FRANCHISESTATE CON SOPORTE COMPLETO)
// ============================================================================

export interface FranchiseState {
  version: "2.0";
  season: number;
  week: number;
  phase: FranchisePhase;
  userTeamId: string;
  teams: Record<string, TeamObject>;
  freeAgentPool: string[];
  schedule: FranchiseMatch[];
  playoffSeries: PlayoffSeries[];
  championId?: string;
  playerProgress: Record<string, {
    age: number;
    potential: number;
    form: number;
    ovr?: number;
    ovrAtSeasonStart?: number;
    injuryWeeks?: number;
    injuryType?: string;
    injurySeverity?: string;
    attributes?: PlayerAttributes;
    injury?: Injury;
    attributeModifiers?: {
      spd: number;
      jmp: number;
      endu: number;
      stre?: number;
      dnk?: number;
      [key: string]: number | undefined;
    };
  }>;
  stats: {
    seasonal: Record<string, PlayerStats>;
    career: Record<string, PlayerStats>;
    playoffs?: Record<string, PlayerStats>;
  };
  currentGameIndex?: number;
  standings?: any;
  lotteryPicks?: any[];
  finalsMvp?: any;
  draftHistory: any[];
  tradeHistory: any[];
  draftOrder?: any[];
  draftOrder2?: any[];
  awards: Record<number, {
    championId?: string;
    mvp?: string;
    finalsMvp?: string;
    eastFinalsMvp?: string;
    westFinalsMvp?: string;
    dpoy?: string;
    roy?: string;
    mip?: string;
    sixthMan?: string;
    allNba: string[];
    allNba1st?: string[];
    allNba2nd?: string[];
    allNba3rd?: string[];
    allDefensive1st?: string[];
    allDefensive2nd?: string[];
    allDefensive3rd?: string[];
    allRookie1st?: string[];
    allRookie2nd?: string[];
    allRookie3rd?: string[];
  }>;
  trophyCase: {
    type: 'CHAMP' | 'MVP' | 'FMVP' | 'DPOY' | 'ROY' | 'RECORD' | 'ALL_NBA' | string;
    season: number;
    playerId?: string;
    label?: string;
  }[];
  seasonHighs: Record<string, {
    points: { value: number; rival: string; date: string };
    rebounds: { value: number; rival: string; date: string };
    assists: { value: number; rival: string; date: string };
    steals: { value: number; rival: string; date: string };
    blocks: { value: number; rival: string; date: string };
  }>;
  seasonHistory: SeasonHistoryItem[];
  hallOfFame: RetiredPlayer[];
  negotiations: Record<string, {
    rounds: number;
    lastOfferSalary: number;
    lastOfferYears: number;
    status: "Active" | "Rejected" | "Accepted";
  }>;
  notifications: FranchiseNotification[];
  customCards?: any[]; 
  draftPool?: any[]; 
}
