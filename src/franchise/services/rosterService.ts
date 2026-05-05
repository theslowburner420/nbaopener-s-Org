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

export function getContractType(ovr: number, seasons: number = 0): 'max' | 'supermax' | 'mid' | 'minimum' | 'rookie' | 'two-way' {
  if (ovr >= 94 && seasons >= 5) return 'supermax';
  if (ovr >= 90) return 'max';
  if (ovr >= 80) return 'mid';
  if (ovr >= 74) return 'minimum';
  return 'two-way';
}

export function getInitialSalary(ovr: number, type: string): number {
  switch (type) {
    case 'supermax': return 62000000;
    case 'max': return 48000000;
    case 'mid': return 15000000 + (ovr - 80) * 2000000;
    case 'minimum': return 3500000;
    case 'rookie': return 8000000; 
    case 'two-way': return 1200000;
    default: return 2500000;
  }
}

export function generateContract(playerId: string, ovr: number, seasons: number = 0, isRookie: boolean = false): ContractObject {
  let type = isRookie ? 'rookie' : getContractType(ovr, seasons);
  let salary = getInitialSalary(ovr, type);
  let years = Math.floor(Math.random() * 3) + 2; 

  if (type === 'max' || type === 'supermax') years = 4 + Math.floor(Math.random() * 2);
  if (type === 'rookie') years = 4; 
  if (type === 'two-way') years = 1;

  const optionRoll = Math.random();
  let optionType: 'none' | 'team' | 'player' = 'none';
  if (type === 'max' && optionRoll < 0.3) optionType = 'player';
  if (type === 'rookie') optionType = 'team'; 

  return {
    playerId,
    salary,
    yearsRemaining: years,
    contractType: type,
    seasonsWithTeam: seasons,
    optionType,
    noTradeClause: (type === 'supermax' || (type === 'max' && ovr >= 95)),
    injuryStatus: 'Healthy',
    canExtend: years <= 2,
    canTrade: true
  };
}

export function generateDraftPool(year: number): Card[] {
  const pool: Card[] = [];
  const collegues = [
    'Kentucky', 'Duke', 'Kansas', 'North Carolina', 'Villanova', 
    'UCLA', 'Arizona', 'Indiana', 'Michigan State', 'Gonzaga',
    'LSU', 'Texas', 'Florida State', 'Virginia', 'Auburn',
    'Real Madrid (Spain)', 'Barcelona (Spain)', 'Metropolitans 92 (France)', 'Mega Leks (Serbia)'
  ];

  for (let i = 0; i < 60; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const name = `${firstName} ${lastName}`;
    const college = collegues[Math.floor(Math.random() * collegues.length)];
    
    const positions = ['PG', 'SG', 'SF', 'PF', 'C'];
    const position = positions[Math.floor(Math.random() * positions.length)];

    let ovr = 60;
    let potential: 'star' | 'starter' | 'rotation' | 'bust' = 'rotation';

    if (i < 5) { // Picks 1-5
      ovr = Math.floor(Math.random() * 7) + 82; // 82-88
      const roll = Math.random();
      potential = roll < 0.6 ? 'star' : roll < 0.9 ? 'starter' : 'bust';
    } else if (i < 14) { // Picks 6-14
      ovr = Math.floor(Math.random() * 8) + 76; // 76-83
      const roll = Math.random();
      potential = roll < 0.3 ? 'star' : roll < 0.8 ? 'starter' : 'rotation';
    } else if (i < 30) { // Picks 15-30
      ovr = Math.floor(Math.random() * 8) + 70; // 70-77
      const roll = Math.random();
      potential = roll < 0.1 ? 'star' : roll < 0.5 ? 'starter' : roll < 0.9 ? 'rotation' : 'bust';
    } else { // Picks 31-60
      ovr = Math.floor(Math.random() * 11) + 62; // 62-72
      const roll = Math.random();
      potential = roll < 0.05 ? 'starter' : roll < 0.6 ? 'rotation' : 'bust';
    }

    const getStats = (pos: string, ovr: number) => {
      let p = 0, r = 0, a = 0;
      // Add one elite stat based on OVR or rank
      const isElite = ovr >= 82;
      const multiplier = isElite ? 1.2 : 1.0;

      if (pos === 'PG') {
        p = ovr * 0.22 * multiplier; a = ovr * 0.16 * multiplier; r = ovr * 0.05;
      } else if (pos === 'SG') {
        p = ovr * 0.25 * multiplier; a = ovr * 0.08; r = ovr * 0.06;
      } else if (pos === 'SF') {
        p = ovr * 0.21 * multiplier; a = ovr * 0.07; r = ovr * 0.10;
      } else if (pos === 'PF') {
        p = ovr * 0.18; a = ovr * 0.05; r = ovr * 0.13 * multiplier;
      } else { // C
        p = ovr * 0.16; a = ovr * 0.04; r = ovr * 0.16 * multiplier;
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
      subtitle: `${college}`,
      isHistorical: false,
      pts: 0,
      reb: 0,
      ast: 0,
      age: Math.floor(Math.random() * 3) + 19,
      nbaId: 0,
      stats: {
        points: s.points,
        rebounds: s.rebounds,
        assists: s.assists,
        ovr,
        potential: ovr + 10, // Legacy fallback
        draftPotential: potential // New specific hidden potential
      },
      description: `A promising young ${position} from ${college}.`,
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

  const retiredPlayers: string[] = [];

  allCardIds.forEach(id => {
    const card = ALL_CARDS.find(c => c.id === id) || 
                 state.customCards?.find(c => c.id === id) || 
                 state.draftPool?.find(c => c.id === id) ||
                 state.draftHistory?.find(h => h.player.id === id)?.player;
                 
    const progress = state.playerProgress[id];
    
    if (card && progress) {
      // 1. Increment Age
      progress.age += 1;
      const age = progress.age;
      const currentOvr = progress.ovr || card.stats.ovr;
      let delta = 0;

      const draftPotential = (card.stats as any).draftPotential as 'star' | 'starter' | 'rotation' | 'bust' | undefined;
      
      // 2. OVR Progression/Regression Logic
      if (age < 25) {
        if (draftPotential === 'bust') {
          delta = 0; // Busts < 25 don't improve
        } else {
          // Up to +3 per season normally, but we have a max increase rule of +4
          delta = Math.floor(Math.random() * 4); // 0 to 3
          if (draftPotential === 'star') delta += 1; // Stars can reach +4
        }
      } else if (age >= 25 && age <= 30) {
        delta = 0; // Stable
      } else if (age > 30 && age <= 33) {
        if (Math.random() < 0.4) delta = -1;
      } else if (age > 33) {
        if (Math.random() < 0.7) delta = -1;
      }

      // 3. Special Exceptions
      if (card.rarity === 'franchise' && age > 30 && delta < 0) {
        // Franchise rarity > 30 with stable/improved OVR have a 50% chance of no regression
        if (Math.random() < 0.5) delta = 0;
      }

      // Apply the change
      const newOvr = Math.min(99, Math.max(60, currentOvr + delta));
      progress.ovr = newOvr;

      // 4. Retirement Logic
      if (age > 37) {
        let retirementProb = 0.20;

        // Franchise rarity > 37 have 10% retirement probability
        if (card.rarity === 'franchise') {
          retirementProb = 0.10;
        }

        // Check if won MVP/DPOY in last 2 seasons
        const wonRecently = [state.season, state.season - 1].some(s => {
          const award = state.awards[s];
          return award && (award.mvp === id || award.dpoy === id);
        });

        if (wonRecently && age > 33) {
          retirementProb /= 2;
        }

        if (Math.random() < retirementProb) {
          retiredPlayers.push(id);
        }
      }
    }
  });

  // Handle Retirements
  retiredPlayers.forEach(pid => {
    const card = ALL_CARDS.find(c => c.id === pid) || state.customCards?.find(c => c.id === pid);
    const team = Object.values(state.teams).find(t => t.roster.includes(pid));
    
    if (team) {
      team.roster = team.roster.filter(id => id !== pid);
      delete team.contracts[pid];
      // Clear from lineup
      (['PG', 'SG', 'SF', 'PF', 'C'] as const).forEach(pos => {
        if (team.lineup[pos] === pid) team.lineup[pos] = null;
      });
      team.lineup.bench = team.lineup.bench.filter(id => id !== pid);
    }
    
    state.freeAgentPool = state.freeAgentPool.filter(id => id !== pid);
    
    // Add retirement news
    state.notifications.push({
      id: `retire-${pid}-${state.season}`,
      type: 'NEWS',
      message: `${card?.name || 'A player'} has officially announced their retirement at age ${state.playerProgress[pid].age}.`,
      week: 1,
      season: state.season,
      read: false
    });
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
      const contract = generateContract(p.id, p.stats.ovr, Math.floor(Math.random() * 5));
      team.contracts[p.id] = contract;
      payroll += contract.salary;
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

export function runCPUMidSeasonLogic(state: FranchiseState) {
  const CP_SALARY_CAP = 180000000; // Increased cap for more realistic management
  
  Object.values(state.teams).forEach(team => {
    if (team.isHuman) return;

    // 1. EVALUATE RENEWALS - Prioritize by OVR
    const allContracts = Object.values(team.contracts);
    const playersToConsider = allContracts
      .map(c => {
        const card = ALL_CARDS.find(card => card.id === c.playerId) || state.draftPool?.find(card => card.id === c.playerId);
        return { contract: c, ovr: card?.stats.ovr || 0, card };
      })
      .sort((a, b) => b.ovr - a.ovr);

    playersToConsider.forEach(({ contract, ovr, card }) => {
      if (!card) return;
      
      // Renewal conditions: Expiring soon OR Star player that needs locked in
      const isExpiringSoon = contract.yearsRemaining <= 1;
      const isStar = ovr >= 88;
      const canRenew = isExpiringSoon || (isStar && contract.yearsRemaining <= 2);

      if (canRenew) {
        const renewalProb = ovr >= 94 ? 0.98 : ovr >= 90 ? 0.92 : ovr >= 85 ? 0.80 : ovr >= 80 ? 0.60 : 0.25;

        if (Math.random() < renewalProb) {
          const nextContract = generateContract(card.id, ovr, contract.seasonsWithTeam + 1);
          
          // Budget safety check
          if (team.payroll - contract.salary + nextContract.salary < CP_SALARY_CAP * 1.1) {
            team.contracts[card.id] = { 
              ...nextContract, 
              yearsRemaining: nextContract.yearsRemaining + (isExpiringSoon ? 0 : contract.yearsRemaining) 
            };
            
            state.notifications.unshift({
              id: `renew-${team.teamId}-${card.id}`,
              type: 'NEWS',
              message: `${team.abbreviation} has extended ${card.name.split(' ').pop()} for ${nextContract.yearsRemaining} years.`,
              week: state.week,
              season: state.season,
              read: false
            });
          }
        }
      }
    });

    // 2. FILL ROSTER IF BELOW MIN (12 core players)
    let currentPayroll = Object.values(team.contracts).reduce((s, c) => s + c.salary, 0);
    if (team.roster.length < 12) {
      const faPool = state.freeAgentPool
        .map(id => {
          const card = ALL_CARDS.find(c => c.id === id) || state.draftPool?.find(c => c.id === id);
          return { id, card, ovr: card?.stats.ovr || 0 };
        })
        .sort((a, b) => b.ovr - a.ovr);

      for (const fa of faPool) {
        if (!fa.card) continue;
        const newSalary = getInitialSalary(fa.ovr, getContractType(fa.ovr));
        if (currentPayroll + newSalary <= CP_SALARY_CAP && team.roster.length < 15) {
          team.roster.push(fa.id);
          team.contracts[fa.id] = generateContract(fa.id, fa.ovr, 0);
          state.freeAgentPool = state.freeAgentPool.filter(id => id !== fa.id);
          currentPayroll += newSalary;
          if (team.roster.length >= 14) break;
        }
      }
    }

    team.payroll = Object.values(team.contracts).reduce((s, c) => s + c.salary, 0);
  });
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
      Object.values(newState.teams).forEach(team => {
          const expiredIds: string[] = [];
          team.roster.forEach(playerId => {
            let contract = team.contracts[playerId];
            if (contract) {
              contract.yearsRemaining -= 1;
              contract.seasonsWithTeam += 1;
              contract.canExtend = contract.yearsRemaining <= 2;
              if (contract.yearsRemaining <= 0) expiredIds.push(playerId);
            } else {
              expiredIds.push(playerId);
            }
          });
    
          if (!team.isHuman) {
            // CPU Renewal (End of Season)
            expiredIds.forEach((id, idx) => {
              const card = ALL_CARDS.find(c => c.id === id) || newState.customCards?.find(c => c.id === id) || newState.draftPool?.find(c => c.id === id);
              if (card) {
                 const currentContract = team.contracts[id];
                 const seasons = (currentContract?.seasonsWithTeam || 0);
                 const ovr = newState.playerProgress[id]?.ovr || card.stats.ovr;
                 const renewalProb = ovr >= 90 ? 0.90 : ovr >= 85 ? 0.80 : ovr >= 78 ? 0.60 : 0.20;

                 if (Math.random() < renewalProb) {
                    const newContract = generateContract(id, ovr, seasons);
                    team.contracts[id] = newContract;
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
      age: c.age || Math.floor(Math.random() * 8) + 22,
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
