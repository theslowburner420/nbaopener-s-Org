import { ALL_CARDS } from '../../data/cards';
import { NBA_TEAMS } from '../../data/nbaTeams';
import { Card } from '../../types';
import { 
  TeamObject, 
  ContractObject, 
  FranchiseState, 
  TeamLineup
} from '../types';
import { scheduleService } from './scheduleService';

const VALID_RARITIES = ['bench', 'starter', 'allstar', 'franchise'];

export function getInitialSalary(card: Card): number {
  const ovr = card.stats.ovr;
  const rarity = card.rarity;
  
  if (rarity === 'franchise') return 35000000 + (ovr - 90) * 1500000;
  if (rarity === 'allstar') return 20000000 + (ovr - 85) * 1200000;
  if (rarity === 'starter') return 5000000 + (ovr - 78) * 800000;
  if (rarity === 'bench') return 1200000 + (ovr - 70) * 300000;
  
  return 1100000; // Minimum
}

export function buildAllTeamRosters(): { teams: Record<string, TeamObject>, freeAgents: string[] } {
  const NBA_TEAMS_30 = NBA_TEAMS.map(t => t.name);

  // 1. Identify valid base cards for Franchise Mode
  const baseCards = ALL_CARDS.filter(c => 
    VALID_RARITIES.includes(c.rarity) && 
    !c.isHistorical &&
    c.team !== '' &&
    (NBA_TEAMS_30.includes(c.team) || 
     NBA_TEAMS.some(t => t.id === c.teamAbbr || t.name === c.team || t.city === c.team))
  );
  
  const teams: Record<string, TeamObject> = {};
  const assignedPlayerIds = new Set<string>();

  // Helper to normalize team names for better matching
  const normalizeTeamName = (name: string) => name.toLowerCase()
    .replace(/\s/g, '')
    .replace('losangeles', 'la')
    .replace('pelicans', '')
    .replace('timberwolves', '')
    .replace('magic', '')
    .replace('hawks', '')
    .replace('thunder', '')
    .replace('okc', 'oklahomacity')
    .trim();

  // 2. Initial assignment by Team ID or Name matching
  NBA_TEAMS.forEach(teamDef => {
    const teamPlayers = baseCards
      .filter(c => {
        if (c.teamAbbr === teamDef.id) return true;
        
        const cTeam = normalizeTeamName(c.team);
        const tName = normalizeTeamName(teamDef.name);
        return cTeam === tName || cTeam.includes(tName) || tName.includes(cTeam);
      })
      .sort((a, b) => b.stats.ovr - a.stats.ovr);

    const rosterIds = teamPlayers.map(p => {
      assignedPlayerIds.add(p.id);
      return p.id;
    });

    teams[teamDef.id] = {
      teamId: teamDef.id,
      name: teamDef.name,
      abbreviation: teamDef.id,
      conference: teamDef.conference as 'East' | 'West',
      division: teamDef.division,
      roster: rosterIds,
      lineup: { PG: null, SG: null, SF: null, PF: null, C: null, bench: [] },
      contracts: {},
      draftPicks: [
        { originalOwnerId: teamDef.id, year: 2026, round: 1, isProtected: false },
        { originalOwnerId: teamDef.id, year: 2026, round: 2, isProtected: false },
      ],
      wins: 0,
      losses: 0,
      isHuman: false,
      payroll: 0
    };
  });

  // 3. Fill missing rosters (Problem 2 - Atlanta/Hawks fix)
  // Any team with less than 8 players gets priority of available base cards
  const availableBase = baseCards
    .filter(c => !assignedPlayerIds.has(c.id))
    .sort((a, b) => b.stats.ovr - a.stats.ovr);

  NBA_TEAMS.forEach(teamDef => {
    const team = teams[teamDef.id];
    while (team.roster.length < 8 && availableBase.length > 0) {
      const bestAvailable = availableBase.shift()!;
      team.roster.push(bestAvailable.id);
      assignedPlayerIds.add(bestAvailable.id);
    }
  });

  // 4. Finalize Lineups and Contracts for all teams
  Object.values(teams).forEach(team => {
    const teamPlayers = team.roster.map(id => ALL_CARDS.find(c => c.id === id)!);
    
    let payroll = 0;
    teamPlayers.forEach(p => {
      const salary = getInitialSalary(p);
      payroll += salary;
      team.contracts[p.id] = {
        playerId: p.id,
        salary,
        yearsRemaining: Math.floor(Math.random() * 3) + 1,
        type: p.rarity === 'franchise' ? 'Max' : p.rarity === 'starter' ? 'MidLevel' : 'Veteran',
        noTradeClause: p.stats.ovr >= 95,
        injuryStatus: 'Healthy'
      };
    });
    team.payroll = payroll;

    // Lineup Logic
    const availableForLineup = [...teamPlayers].sort((a, b) => b.stats.ovr - a.stats.ovr);
    const usedIds = new Set<string>();

    const findBestForPos = (posFilter: string) => {
      const best = availableForLineup.find(p => !usedIds.has(p.id) && p.position.includes(posFilter));
      if (best) {
        usedIds.add(best.id);
        return best.id;
      }
      const fallback = availableForLineup.find(p => !usedIds.has(p.id));
      if (fallback) {
        usedIds.add(fallback.id);
        return fallback.id;
      }
      return null;
    };

    team.lineup = {
      PG: findBestForPos('G'),
      SG: findBestForPos('G'),
      SF: findBestForPos('F'),
      PF: findBestForPos('F'),
      C: findBestForPos('C'),
      bench: team.roster.filter(id => !usedIds.has(id))
    };
  });

  const freeAgents = availableBase.map(c => c.id);

  return { teams, freeAgents };
}

export function initializeFranchiseState(userTeamId: string): FranchiseState {
  const { teams, freeAgents } = buildAllTeamRosters();
  
  if (teams[userTeamId]) teams[userTeamId].isHuman = true;

  const playerProgress: Record<string, { age: number; potential: number; form: number }> = {};
  ALL_CARDS.forEach(c => {
    playerProgress[c.id] = {
      age: (c as any).age || Math.floor(Math.random() * 12) + 19,
      potential: c.stats.ovr + Math.floor(Math.random() * 10),
      form: 1.0
    };
  });

  const schedule = scheduleService.generateSchedule(teams);

  return {
    version: "2.0",
    season: 2025,
    week: 1,
    phase: "Regular",
    userTeamId,
    teams,
    freeAgentPool: freeAgents,
    schedule,
    playerProgress,
    stats: {
      seasonal: {},
      career: {}
    },
    draftHistory: [],
    tradeHistory: [],
    awards: {}
  };
}
