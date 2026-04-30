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

export function generateDraftPool(year: number): Card[] {
  const pool: Card[] = [];
  // Round 1: 30 players, OVR 72-85
  // Round 2: 30 players, OVR 62-74
  for (let i = 0; i < 60; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const name = `${firstName} ${lastName}`;
    
    // Position weighted: Balanced distribution
    const positions = ['PG', 'SG', 'SF', 'PF', 'C'];
    const position = positions[Math.floor(Math.random() * positions.length)];

    const isRound1 = i < 30;
    const ovr = isRound1 
      ? Math.floor(Math.random() * 14) + 72 // 72 to 85
      : Math.floor(Math.random() * 13) + 62; // 62 to 74

    // Stats coherent with position and OVR (formula rounded to 1 decimal)
    const getStats = (pos: string, ovr: number) => {
      let p = 0, r = 0, a = 0;
      if (pos === 'PG') {
        p = ovr * 0.22; a = ovr * 0.14; r = ovr * 0.05;
      } else if (pos === 'SG') {
        p = ovr * 0.24; a = ovr * 0.08; r = ovr * 0.06;
      } else if (pos === 'SF') {
        p = ovr * 0.20; a = ovr * 0.07; r = ovr * 0.09;
      } else if (pos === 'PF') {
        p = ovr * 0.18; a = ovr * 0.05; r = ovr * 0.12;
      } else { // C
        p = ovr * 0.16; a = ovr * 0.04; r = ovr * 0.15;
      }
      return { 
        points: Number(p.toFixed(1)), 
        rebounds: Number(r.toFixed(1)), 
        assists: Number(a.toFixed(1)) 
      };
    };

    const s = getStats(position, ovr);

    const newCard: Card = {
      id: `draft_${year}_${i}`,
      number: Math.floor(Math.random() * 99),
      name,
      team: '',
      teamAbbr: 'DRFT',
      teamColor: '#6366F1',
      position,
      rarity: ovr >= 85 ? 'franchise' : ovr >= 80 ? 'allstar' : ovr >= 72 ? 'starter' : 'bench',
      category: 'Rookie',
      subtitle: `${year} Draft Prospect`,
      isHistorical: false,
      pts: 0,
      reb: 0,
      ast: 0,
      nbaId: 0,
      stats: {
        points: s.points,
        rebounds: s.rebounds,
        assists: s.assists,
        ovr
      },
      description: `A promising young ${position} from the ${year} draft class.`,
      quote: "I'm just here to work hard and help the team win.",
      imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/0.png',
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
      const potential = progress.potential;
      const age = progress.age;
      let delta = 0;

      if (age < 24) {
        // High growth for young potential stars
        if (potential > currentOvr) {
          delta = Math.floor(Math.random() * 4) + 1; // +1 to +4
        } else {
          delta = Math.floor(Math.random() * 3) - 1; // -1 to +1
        }
      } else if (age < 30) {
        // Prime years: stable or small growth
        delta = Math.floor(Math.random() * 3) - 1; // -1 to +1
      } else if (age >= 30 && age < 34) {
        // Slight decline starting
        delta = Math.floor(Math.random() * 3) - 2; // -2 to 0
      } else {
        // Veterans decline
        delta = Math.floor(Math.random() * 3) - 3; // -3 to -1
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
        injuryStatus: 'Healthy',
        canExtend: true,
        canTrade: true
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
  
  // Archive History before incrementing season
  const userTeam = state.teams[state.userTeamId];
  const userStats = state.stats.seasonal;
  const teamSeasonalStats = Object.keys(userStats)
    .filter(id => userTeam.roster.includes(id))
    .map(id => userStats[id]);
  
  const totalPoints = teamSeasonalStats.reduce((acc, s) => acc + s.points, 0);
  const totalGames = userTeam.wins + userTeam.losses;
  const ppgResult = totalGames > 0 ? totalPoints / totalGames : 0;

  newState.teamHistory.push({
    season: state.season,
    record: `${userTeam.wins}-${userTeam.losses}`,
    ppg: parseFloat(ppgResult.toFixed(1)),
    awards: state.trophyCase.filter(t => t.season === state.season).map(t => t.type),
    champion: state.championId && state.teams[state.championId] ? state.teams[state.championId].name : 'N/A'
  });

  newState.season += 1;
  newState.week = 1;
  newState.phase = 'Regular';
  newState.championId = undefined; // Reset champion

  // Reset Regular Season Wins/Losses
  Object.values(newState.teams).forEach(team => {
    team.wins = 0;
    team.losses = 0;
  });

  // Reset Seasonal Stats
  newState.stats.seasonal = {};
  newState.seasonHighs = {}; // Reset season highs for new season
  
  // Apply Progression
  applyProgression(newState);

    // Update Contracts
    Object.values(newState.teams).forEach(team => {
      if (team.isHuman) {
        // Human team logic: just expire and move to FA (manual management)
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
        expiredIds.forEach(id => {
          team.roster = team.roster.filter(rid => rid !== id);
          delete team.contracts[id];
          newState.freeAgentPool.push(id);
          (['PG', 'SG', 'SF', 'PF', 'C'] as const).forEach(pos => {
            if (team.lineup[pos] === id) team.lineup[pos] = null;
          });
          team.lineup.bench = team.lineup.bench.filter(rid => rid !== id);
        });
        team.payroll = newPayroll;
      } else {
        // CPU team logic: 85% renew, 15% FA
        const expiredIds: string[] = [];
        team.roster.forEach(playerId => {
          let contract = team.contracts[playerId];
          if (contract) {
            contract.yearsRemaining -= 1;
          }

          if (!contract || contract.yearsRemaining <= 0) {
            const chance = Math.random();
            if (chance <= 0.85) {
              // CPU Renew
              const card = ALL_CARDS.find(c => c.id === playerId) || newState.customCards?.find(c => c.id === playerId);
              if (card) {
                const salary = getInitialSalary(card);
                team.contracts[playerId] = {
                  playerId,
                  salary,
                  yearsRemaining: Math.floor(Math.random() * 3) + 1,
                  type: card.rarity === 'franchise' ? 'Max' : card.rarity === 'starter' ? 'MidLevel' : 'Veteran',
                  noTradeClause: false,
                  injuryStatus: 'Healthy',
                  canExtend: true,
                  canTrade: true
                };
              } else {
                expiredIds.push(playerId);
              }
            } else {
              expiredIds.push(playerId);
            }
          }
        });

        expiredIds.forEach(id => {
          team.roster = team.roster.filter(rid => rid !== id);
          delete team.contracts[id];
          newState.freeAgentPool.push(id);
          (['PG', 'SG', 'SF', 'PF', 'C'] as const).forEach(pos => {
            if (team.lineup[pos] === id) team.lineup[pos] = null;
          });
          team.lineup.bench = team.lineup.bench.filter(rid => rid !== id);
        });
        
        team.payroll = Object.values(team.contracts).reduce((total, c) => total + c.salary, 0);
      }
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
    trophyCase: [],
    seasonHighs: {},
    teamHistory: [],
    negotiations: {},
    notifications: []
  };
}
