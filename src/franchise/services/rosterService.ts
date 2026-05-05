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

export function getInitialSalary(card: Card): number {
  if (card.stats.ovr >= 95) return 45000000;
  if (card.stats.ovr >= 90) return 38000000;
  if (card.stats.ovr >= 85) return 28000000;
  if (card.stats.ovr >= 80) return 15000000;
  if (card.stats.ovr >= 75) return 8000000;
  if (card.stats.ovr >= 70) return 3500000;
  return 1500000;
}

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
        ovr,
        potential: Math.min(99, ovr + Math.floor(Math.random() * 15) + 2) // NEW: Scouting potential
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
    const card = ALL_CARDS.find(c => c.id === id) || 
                 state.customCards?.find(c => c.id === id) || 
                 state.draftPool?.find(c => c.id === id);
    const progress = state.playerProgress[id];
    const seasonalStats = state.stats.seasonal[id];
    
    if (card && progress) {
      const currentOvr = progress.ovr || card.stats.ovr;
      const potential = progress.potential;
      const age = progress.age;
      let delta = 0;

      // 1. BASE AGE-BASED PROGRESSION
      if (age < 23) {
        // High Potential Growth Years
        delta = Math.floor(Math.random() * 4) + 1; // +1 to +4
      } else if (age < 27) {
        // Peak Growth Years
        delta = Math.floor(Math.random() * 3); // 0 to +2
      } else if (age < 31) {
        // Athletic Peak / Maintenance
        delta = Math.floor(Math.random() * 3) - 1; // -1 to +1
      } else if (age < 35) {
        // Slight Decline
        delta = Math.floor(Math.random() * 3) - 3; // -3 to -1
      } else {
        // Steep Aging Decline
        delta = Math.floor(Math.random() * 4) - 5; // -5 to -2
      }

      // 2. PERFORMANCE ADJUSTMENT (In-Season impact)
      if (seasonalStats && seasonalStats.gamesPlayed > 20) {
        const ppg = seasonalStats.points / seasonalStats.gamesPlayed;
        const rpg = seasonalStats.rebounds / seasonalStats.gamesPlayed;
        const apg = seasonalStats.assists / seasonalStats.gamesPlayed;
        const per = ppg + rpg + apg;

        // Breakout Season Bonus
        if (per > 35) delta += 1;
        if (per > 48) delta += 1;
        
        // Poor Performance Decline (mostly for younger players who hit a wall or veterans failing)
        if (per < 12) delta -= 1;
      }

      // 3. POTENTIAL CAP LOGIC
      if (currentOvr >= potential && delta > 0) {
        // Extremely rare to blow past potential
        delta = Math.random() > 0.92 ? 1 : 0; 
      }

      // 4. RANDOM OUTLIER EVENTS (Breakouts / Unexpected Slumps)
      const luck = Math.random();
      if (luck > 0.98 && age < 28) delta += 2; // Elite Jump
      if (luck < 0.02 && age > 30) delta -= 2; // Sharp Injury/Wear decline

      const newOvr = Math.min(99, Math.max(60, currentOvr + delta));
      
      progress.ovr = newOvr;
      progress.age += 1;
    }
  });
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

  // 3. Fill missing rosters
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

  // 4. Finalize Lineups and Contracts
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
  
  // 1. ARCHIVE AWARDS & CHAMPION
  const userTeam = state.teams[state.userTeamId];

  // LEAGUE AWARDS CALCULATION
  const leagueStats = Object.keys(state.stats.seasonal).map(id => {
    const s = state.stats.seasonal[id];
    const games = s.gamesPlayed || 1;
    return {
      id,
      stats: s,
      games,
      ppg: s.points / games,
      rpg: s.rebounds / games,
      apg: s.assists / games,
      spg: s.steals / games,
      bpg: s.blocks / games,
      score: (s.points * 1.0 + s.rebounds * 0.8 + s.assists * 0.8 + s.steals * 2 + s.blocks * 2) / games
    };
  }).filter(p => p.games > 50); // Qualification

  if (!newState.awards[state.season]) {
    newState.awards[state.season] = { allNba: [] };
  }
  const awards = newState.awards[state.season];

  // MVP
  const mvpCand = [...leagueStats].sort((a,b) => b.score - a.score)[0];
  if (mvpCand) {
    awards.mvp = mvpCand.id;
    if (userTeam.roster.includes(mvpCand.id)) {
      newState.trophyCase.push({ type: 'MVP', season: state.season, playerId: mvpCand.id, label: 'League MVP' });
    }
  }

  // DPOY
  const dpoyCand = [...leagueStats].sort((a,b) => (b.spg + b.bpg) - (a.spg + a.bpg))[0];
  if (dpoyCand) {
    awards.dpoy = dpoyCand.id;
    if (userTeam.roster.includes(dpoyCand.id)) {
      newState.trophyCase.push({ type: 'DPOY', season: state.season, playerId: dpoyCand.id, label: 'DPOY' });
    }
  }

  // ROY
  const rookies = leagueStats.filter(p => {
    const card = ALL_CARDS.find(c => c.id === p.id) || 
                 state.customCards?.find(c => c.id === p.id) || 
                 state.draftPool?.find(c => c.id === p.id);
    return card?.category === 'Rookie' || p.id.includes('draft');
  });
  const royCand = [...rookies].sort((a,b) => b.score - a.score)[0];
  if (royCand) {
    awards.roy = royCand.id;
    if (userTeam.roster.includes(royCand.id)) {
      newState.trophyCase.push({ type: 'ROY', season: state.season, playerId: royCand.id, label: 'Rookie of the Year' });
    }
  }

  // All-NBA (Top 5 scores)
  awards.allNba = leagueStats.sort((a,b) => b.score - a.score).slice(0, 5).map(p => p.id);

  // Finals MVP (Look at finals games in playoffSeries)
  const finals = state.playoffSeries.find(s => s.round === 4);
  if (finals && finals.winnerId && finals.matches.length > 0) {
    const champRoster = state.teams[finals.winnerId].roster;
    const finalBoxScores = finals.matches.flatMap(m => 
       m.winner === finals.team1Id ? (m.boxScore?.home || []) : (m.boxScore?.away || [])
    ).filter(be => champRoster.includes(be.playerId));
    
    const performance: Record<string, number> = {};
    finalBoxScores.forEach(be => {
      performance[be.playerId] = (performance[be.playerId] || 0) + (be.points + be.rebounds + be.assists + be.steals + be.blocks);
    });
    
    const fmvpId = Object.keys(performance).sort((a,b) => performance[b] - performance[a])[0];
    if (fmvpId) {
      awards.finalsMvp = fmvpId;
      if (userTeam.roster.includes(fmvpId)) {
        newState.trophyCase.push({ type: 'FMVP', season: state.season, playerId: fmvpId, label: 'Finals MVP' });
      }
    }
  }

  // 2. ARCHIVE TEAM HISTORY
  const totalPoints = Object.keys(state.stats.seasonal)
    .filter(id => userTeam.roster.includes(id))
    .reduce((acc, id) => acc + state.stats.seasonal[id].points, 0);
  const totalGames = userTeam.wins + userTeam.losses;
  const ppgResult = totalGames > 0 ? totalPoints / totalGames : 0;

  newState.teamHistory.push({
    season: state.season,
    record: `${userTeam.wins}-${userTeam.losses}`,
    ppg: parseFloat(ppgResult.toFixed(1)),
    awards: state.trophyCase.filter(t => t.season === state.season).map(t => t.type),
    champion: state.championId ? state.teams[state.championId]?.name || 'N/A' : 'N/A'
  });

  // 3. SEASON INCREMENT
  newState.season += 1;
  newState.week = 1;
  newState.phase = 'Draft';
  newState.championId = undefined;

  // 4. RESET RECORDS
  Object.values(newState.teams).forEach(team => {
    team.wins = 0;
    team.losses = 0;
  });

  // 5. UPDATE CAREER STATS & CLEAR SEASONAL
  Object.entries(newState.stats.seasonal).forEach(([pid, s]) => {
     if (!newState.stats.career[pid]) {
        newState.stats.career[pid] = { ...s };
     } else {
        const c = newState.stats.career[pid];
        c.points += s.points;
        c.rebounds += s.rebounds;
        c.assists += s.assists;
        c.steals = (c.steals || 0) + (s.steals || 0);
        c.blocks = (c.blocks || 0) + (s.blocks || 0);
        c.gamesPlayed += s.gamesPlayed;
     }
  });
  newState.stats.seasonal = {};
  newState.seasonHighs = {};
  
  // 6. APPLY PROGRESSION
  applyProgression(newState);

  // 7. UPDATE CONTRACTS
  // (Remaining contract logic stays roughly same)
  Object.values(newState.teams).forEach(team => {
      // ... logic for CPU/Human ...
      const expiredIds: string[] = [];
      team.roster.forEach(playerId => {
        let contract = team.contracts[playerId];
        if (contract) {
          contract.yearsRemaining -= 1;
          if (contract.yearsRemaining <= 0) expiredIds.push(playerId);
        } else {
          expiredIds.push(playerId);
        }
      });

      if (!team.isHuman) {
        // CPU Renewal
        expiredIds.forEach((id, idx) => {
          if (Math.random() < 0.8) {
            const card = ALL_CARDS.find(c => c.id === id) || newState.customCards?.find(c => c.id === id) || newState.draftPool?.find(c => c.id === id);
            if (card) {
               const salary = getInitialSalary(card);
               team.contracts[id] = {
                  playerId: id, salary, yearsRemaining: 2, type: 'Veteran', noTradeClause: false, injuryStatus: 'Healthy'
               };
               // Remove from expired so it stays in roster
               expiredIds.splice(idx, 1);
            }
          }
        });
      }

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
  });

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
