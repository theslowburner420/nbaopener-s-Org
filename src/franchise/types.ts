import { Rarity } from '../types';

export type FranchisePhase = "Preseason" | "Regular" | "PlayIn" | "Playoffs" | "Draft" | "FreeAgency";

export interface ContractObject {
  playerId: string;
  salary: number;
  yearsRemaining: number;
  type: "Max" | "MidLevel" | "Veteran" | "Rookie" | "TwoWay";
  noTradeClause: boolean;
  injuryStatus: "Healthy" | "Day-to-Day" | "Out" | "Season-Ending";
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

export interface TeamObject {
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
  }>;
  stats: {
    seasonal: Record<string, PlayerStats>;
    career: Record<string, PlayerStats>;
  };
  draftHistory: any[];
  tradeHistory: any[];
  awards: Record<number, any>;
  negotiations: Record<string, {
    rounds: number;
    lastOfferSalary: number;
    lastOfferYears: number;
    status: "Active" | "Rejected" | "Accepted";
  }>;
  customCards?: any[]; 
  draftPool?: any[]; 
}
