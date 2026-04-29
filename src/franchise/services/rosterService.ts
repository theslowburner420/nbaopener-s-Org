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
import { FIRST_NAMES, LAST_NAMES } from '../../data/names';

const VALID_RARITIES = ['bench', 'starter', 'allstar', 'franchise'];

export function generateDraftPool(year: number, count: number): Card[] {
  const pool: Card[] = [];
  for (let i = 0; i < count; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const name = `${firstName} ${lastName}`;
    
    // Position weighted: Guards are more common
    const randPos = Math.random();
    let position = 'G';
    if (randPos > 0.85) position = 'C';
    else if (randPos > 0.6) position = 'F';
    else if (randPos > 0.3) position = 'G-F';
    else position = 'G';

    // OVR depends on pick potentially, but here we just generate a range for the pool
    // In DraftView we will sort them or assign them
    const ovr = Math.floor(Math.random() * 15) + 68; // 68 to 82

    const newCard: Card = {
      id: `draft_${year}_${i}`,
      number: Math.floor(Math.random() * 99),
      name,
      team: '',
      teamAbbr: 'DRFT',
      teamColor: '#6366F1',
      position,
      rarity: ovr >= 80 ? 'allstar' : ovr >= 75 ? 'starter' : 'bench',
      category: 'Draft 2026',
      subtitle: `${year} Draft Prospect`,
      isHistorical: false,
      pts: 0,
      reb: 0,
      ast: 0,
      nbaId: 0, // Generated players don't have NBA IDs for headshots
      stats: {
        points: (ovr * 0.2) + (Math.random() * 5),
        rebounds: (ovr * 0.1) + (Math.random() * 3),
        assists: (ovr * 0.1) + (Math.random() * 3),
        ovr
      },
      description: `A promising young ${position} from the ${year} draft class.`,
      quote: "I'm just here to work hard and help the team win.",
      imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/0.png', // Default silhouette
      teamLogoUrl: 'https://cdn.nba.com/logos/nba/stats/main.svg'
    };
    pool.push(newCard);
  }
  return pool;
}

export function applyProgression(state: FranchiseState) {
  // Update ALL players in the league
  const allCardIds = new Set<string>();
  Object.values(state.teams).forEach(t => t.roster.forEach(id => allCardIds.add(id)));
  state.freeAgentPool.forEach(id => allCardIds.add(id));

  allCardIds.forEach(id => {
    const card = ALL_CARDS.find(c => c.id === id) || state.customCards?.find(c => c.id === id);
    const progress = state.playerProgress[id];
    
    if (card && progress) {
      const currentOvr = progress.ovr || card.stats.ovr;
      let delta = 0;

      if (currentOvr < 75) {
        delta = Math.floor(Math.random() * 3) + 1;
      } else if (currentOvr <= 85) {
        delta = Math.floor(Math.random() * 4) - 1;
      } else {
        delta = Math.floor(Math.random() * 3) - 2;
      }

      const newOvr = Math.min(99, Math.max(60, currentOvr + delta));
      
      progress.ovr = newOvr;
      progress.age += 1;
    }
  });
}

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
        { id: `pk-${teamDef.id}-2026-1`, originalOwnerId: teamDef.id, year: 2026, round: 1, isProtected: false },
        { id: `pk-${teamDef.id}-2026-2`, originalOwnerId: teamDef.id, year: 2026, round: 2, isProtected: false },
        { id: `pk-${teamDef.id}-2027-1`, originalOwnerId: teamDef.id, year: 2027, round: 1, isProtected: false },
        { id: `pk-${teamDef.id}-2027-2`, originalOwnerId: teamDef.id, year: 2027, round: 2, isProtected: false },
        { id: `pk-${teamDef.id}-2028-1`, originalOwnerId: teamDef.id, year: 2028, round: 1, isProtected: false },
        { id: `pk-${teamDef.id}-2028-2`, originalOwnerId: teamDef.id, year: 2028, round: 2, isProtected: false },
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

export function advanceSeason(state: FranchiseState): FranchiseState {
  const newState = { ...state };
  newState.season += 1;
  newState.week = 1;
  newState.phase = 'Regular';
  
  // Apply Progression
  applyProgression(newState);

  // Update Contracts
  Object.values(newState.teams).forEach(team => {
    let newPayroll = 0;
    const expiredIds: string[] = [];
    
    Object.keys(team.contracts).forEach(playerId => {
      const contract = team.contracts[playerId];
      contract.yearsRemaining -= 1;
      
      if (contract.yearsRemaining <= 0) {
        expiredIds.push(playerId);
      } else {
        newPayroll += contract.salary;
      }
    });

    // Move expired to Free Agency
    expiredIds.forEach(id => {
      team.roster = team.roster.filter(rid => rid !== id);
      delete team.contracts[id];
      newState.freeAgentPool.push(id);
      
      // Clean lineup
      (['PG', 'SG', 'SF', 'PF', 'C'] as const).forEach(pos => {
        if (team.lineup[pos] === id) team.lineup[pos] = null;
      });
      team.lineup.bench = team.lineup.bench.filter(rid => rid !== id);
    });

    team.payroll = newPayroll;
    team.wins = 0;
    team.losses = 0;
  });

  // Archive Season Stats??
  // The user says: "individual stats of previous season are archived in leagueHistory"
  // leagueHistory is in FranchiseState (v2.0 uses stats.seasonal and stats.career)
  // I will move seasonal to career total if not already there, then clear seasonal.
  Object.entries(newState.stats.seasonal).forEach(([pid, s]) => {
     if (!newState.stats.career[pid]) {
        newState.stats.career[pid] = { ...s };
     } else {
        const c = newState.stats.career[pid];
        c.points += s.points;
        c.rebounds += s.rebounds;
        c.assists += s.assists;
        c.gamesPlayed += s.gamesPlayed;
        // Pct and other averages would need more complex math but this is the core
     }
  });
  newState.stats.seasonal = {};

  // Regenerate Schedule
  newState.schedule = scheduleService.generateSchedule(newState.teams);
  
  return newState;
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
    playoffSeries: [],
    playerProgress,
    stats: {
      seasonal: {},
      career: {}
    },
    draftHistory: [],
    tradeHistory: [],
    awards: {},
    negotiations: {}
  };
}
