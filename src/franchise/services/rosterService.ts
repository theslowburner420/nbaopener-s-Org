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

export function calculateAwards(state: FranchiseState) {
  const userTeam = state.teams[state.userTeamId];
  const awards: any = state.awards[state.season] || {
    mvp: '',
    dpoy: '',
    roy: '',
    mip: '',
    allNba: []
  };
  state.awards[state.season] = awards;
  const seasonalStats = state.stats.seasonal;

  // Finalize Standings calculate for award eligibility (MVP)
  // Ensure standings use up-to-date wins/losses
  const standings = Object.values(state.teams).map(t => ({
    id: t.teamId,
    winPct: (t.wins || 0) / ((t.wins || 0) + (t.losses || 0) || 1),
    wins: t.wins || 0,
    losses: t.losses || 0
  })).sort((a,b) => b.winPct - a.winPct);

  // LEAGUE AWARDS CALCULATION
  const leagueStats = Object.keys(seasonalStats).map(id => {
    const s = seasonalStats[id];
    const games = s.gamesPlayed || 1;
    const teamId = Object.values(state.teams).find(t => t.roster.includes(id))?.teamId;
    const team = teamId ? state.teams[teamId] : null;
    const isStarter = team && (Object.values(team.lineup).slice(0, 5) as any[]).includes(id);

    return {
      id,
      stats: s,
      games,
      ppg: s.points / games,
      rpg: s.rebounds / games,
      apg: s.assists / games,
      spg: (s.steals || 0) / games,
      bpg: (s.blocks || 0) / games,
      teamStandings: standings.find(st => st.id === teamId),
      isStarter,
      mvpScore: (s.points / games) + (s.assists / games) * 0.9 + (s.rebounds / games) * 0.7 + ((standings.find(st => st.id === teamId)?.wins || 0) / 2),
      dpoyScore: ((s.steals || 0) / games) * 2.5 + ((s.blocks || 0) / games) * 3 + ((s.rebounds || 0) / games) * 0.5,
      royScore: (s.points / games) + (s.rebounds / games) + (s.assists / games)
    };
  }).filter(p => p.games >= 20);

  // Fallback if no stats
  let finalCandidates = leagueStats;
  if (leagueStats.length === 0) {
    const userRosterByOvr = [...userTeam.roster].sort((a,b) => {
        const ovrA = state.playerProgress[a]?.ovr || 0;
        const ovrB = state.playerProgress[b]?.ovr || 0;
        return ovrB - ovrA;
    });
    // This is a minimal fallback to avoid errors
    if (userRosterByOvr.length > 0) {
        awards.mvp = userRosterByOvr[0];
        awards.dpoy = userRosterByOvr[0];
        awards.roy = userRosterByOvr.find(id => state.playerProgress[id]?.age < 23);
        awards.allNba = userRosterByOvr.slice(0, 5);
        return;
    }
  }

  // MVP: Score + Winning Record + Starter
  const mvpCandidates = [...leagueStats]
    .filter(p => p.teamStandings && p.teamStandings.winPct > 0.5 && p.isStarter)
    .sort((a,b) => b.mvpScore - a.mvpScore);
  
  if (mvpCandidates.length > 0) {
    awards.mvp = mvpCandidates[0].id;
  } else {
    // If no winning starters, pick absolute best mvpScore
    awards.mvp = [...leagueStats].sort((a,b) => b.mvpScore - a.mvpScore)[0]?.id;
  }

  // DPOY: dpoyScore
  awards.dpoy = [...leagueStats].sort((a,b) => b.dpoyScore - a.dpoyScore)[0]?.id;

  // ROY: age < 23 or draft player
  const royCandidates = leagueStats.filter(p => {
    const progress = state.playerProgress[p.id];
    return progress && (progress.age < 23 || p.id.includes('draft'));
  }).sort((a,b) => b.royScore - a.royScore);
  if (royCandidates.length > 0) awards.roy = royCandidates[0].id;

  // MIP: OVR Improvement
  const mipCandidates = leagueStats.map(p => {
    const progress = state.playerProgress[p.id];
    const improvement = (progress?.ovr || 0) - (progress?.ovrAtSeasonStart || progress?.ovr || 0);
    return { id: p.id, improvement };
  }).sort((a,b) => b.improvement - a.improvement);
  if (mipCandidates.length > 0 && mipCandidates[0].improvement > 0) {
    awards.mip = mipCandidates[0].id;
  }

  // All-NBA First Team: PG, SG, SF, PF, C
  const allNbaPositions = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
  const allNbaSelection: string[] = [];
  
  allNbaPositions.forEach(pos => {
    const candidates = leagueStats.filter(p => {
        const card = ALL_CARDS.find(c => c.id === p.id) || state.customCards?.find(c => c.id === p.id) || state.draftPool?.find(c => c.id === p.id);
        return card?.position === pos;
    }).sort((a,b) => (b.ppg + b.rpg + b.apg) - (a.ppg + a.rpg + a.apg));

    if (candidates.length > 0) {
        allNbaSelection.push(candidates[0].id);
    } else {
        // Fallback to highest OVR in User Team at that position
        const userBestAtPos = userTeam.roster.filter(id => {
            const card = ALL_CARDS.find(c => c.id === id) || state.customCards?.find(c => c.id === id);
            return card?.position === pos;
        }).sort((a,b) => (state.playerProgress[b]?.ovr || 0) - (state.playerProgress[a]?.ovr || 0))[0];
        if (userBestAtPos) allNbaSelection.push(userBestAtPos);
    }
  });
  awards.allNba = allNbaSelection.slice(0, 5);

  // Add trophies to trophyCase if user team players won
  const userTeamPlayers = new Set(userTeam.roster);
  const awardExists = (type: any, pid: any) => state.trophyCase.some(t => t.type === type && t.season === state.season && t.playerId === pid);

  if (awards.mvp && userTeamPlayers.has(awards.mvp) && !awardExists('MVP', awards.mvp)) {
      state.trophyCase.push({ type: 'MVP', season: state.season, playerId: awards.mvp, label: 'League MVP' });
  }
  if (awards.dpoy && userTeamPlayers.has(awards.dpoy) && !awardExists('DPOY', awards.dpoy)) {
      state.trophyCase.push({ type: 'DPOY', season: state.season, playerId: awards.dpoy, label: 'Defensive Player of the Year' });
  }
  if (awards.roy && userTeamPlayers.has(awards.roy) && !awardExists('ROY', awards.roy)) {
      state.trophyCase.push({ type: 'ROY', season: state.season, playerId: awards.roy, label: 'Rookie of the Year' });
  }
  if (awards.mip && userTeamPlayers.has(awards.mip) && !awardExists('RECORD', awards.mip)) {
      state.trophyCase.push({ type: 'RECORD', season: state.season, playerId: awards.mip, label: 'Most Improved Player' });
  }
  if (awards.allNba) {
      awards.allNba.forEach((id: string) => {
          if (userTeamPlayers.has(id) && !awardExists('ALL_NBA', id)) {
              state.trophyCase.push({ type: 'ALL_NBA', season: state.season, playerId: id, label: 'All-NBA First Team' });
          }
      });
  }
}

export function generateDraftPool(year: number): Card[] {
  const pool: Card[] = [];
  const collegues = [
    'Kentucky', 'Duke', 'Kansas', 'North Carolina', 'Villanova', 
    'UCLA', 'Arizona', 'Indiana', 'Michigan State', 'Gonzaga'
  ];

  for (let i = 0; i < 70; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const name = `${firstName} ${lastName}`;
    const college = collegues[Math.floor(Math.random() * collegues.length)];
    const pos = (['PG', 'SG', 'SF', 'PF', 'C'] as const)[Math.floor(Math.random() * 5)];

    const baseOvr = 68 + Math.floor(Math.random() * 20);

    const newCard: Card = {
      id: `draft_${year}_${i}`,
      number: Math.floor(Math.random() * 99),
      name,
      team: '',
      teamAbbr: 'DRFT',
      teamColor: '#6366F1',
      position: pos,
      rarity: baseOvr >= 85 ? 'franchise' : baseOvr >= 80 ? 'allstar' : baseOvr >= 72 ? 'starter' : 'bench',
      category: 'Rookie',
      subtitle: `${college}`,
      isHistorical: false,
      pts: 0,
      reb: 0,
      ast: 0,
      age: 19 + Math.floor(Math.random() * 3),
      nbaId: 0,
      stats: {
        points: Number((baseOvr * 0.22).toFixed(1)),
        rebounds: Number((baseOvr * 0.12).toFixed(1)),
        assists: Number((baseOvr * 0.1).toFixed(1)),
        ovr: baseOvr,
        potential: baseOvr + 10
      },
      description: `A promising young ${pos} from ${college}.`,
      quote: "Ready to work.",
      imageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}${year}${i}`,
      teamLogoUrl: 'https://cdn.nba.com/logos/nba/stats/main.svg'
    };
    pool.push(newCard);
  }
  return pool;
}

export function applyProgression(state: FranchiseState) {
  // Update ALL players in the league
  const allTeamPlayers = Object.values(state.teams).flatMap(t => t.roster);
  const allCardIds = new Set([...allTeamPlayers, ...state.freeAgentPool]);

  const retiredPlayers: string[] = [];
  const awards: any = state.awards[state.season] || {};

  allCardIds.forEach(id => {
    const card = ALL_CARDS.find(c => c.id === id) || 
                 state.customCards?.find(c => c.id === id) || 
                 state.draftPool?.find(c => c.id === id);
                 
    const progress = state.playerProgress[id];
    
    if (card && progress) {
      // 1. Increment Age
      progress.age += 1;
      const age = progress.age;
      const currentOvr = progress.ovr || card.stats.ovr;
      
      // Save current OVR as starting OVR for next season's MIP calculation
      progress.ovrAtSeasonStart = currentOvr;

      let delta = 0;
      const potential = (card.stats as any).draftPotential || (progress.potential > currentOvr ? 'starter' : 'rotation');
      
      // 2. OVR Progression/Regression Logic
      if (age < 25) {
        if (potential === 'bust') {
          delta = Math.floor(Math.random() * 2); // 0 or 1
        } else {
          delta = Math.floor(Math.random() * 4) + 1; // 1 to 4
          if (potential === 'star' || potential === 'franchise') delta = Math.max(delta, 2);
        }
      } else if (age >= 25 && age <= 30) {
        delta = Math.floor(Math.random() * 3) - 1; // -1 to 1
      } else if (age > 30 && age <= 35) {
        delta = Math.floor(Math.random() * 3) - 2; // -2 to 0
      } else if (age > 35) {
        delta = Math.floor(Math.random() * 4) - 4; // -4 to -1
      }

      // Bonus for Awards
      if (awards.mvp === id || awards.dpoy === id) {
          delta = Math.max(delta, 1);
      }

      // Cap increase at +4
      if (delta > 4) delta = 4;

      // Apply the change
      const newOvr = Math.min(99, Math.max(60, currentOvr + delta));
      progress.ovr = newOvr;

      // 4. Retirement Logic
      if (age > 37) {
        let retirementProb = 0.30;
        if (card.rarity === 'franchise') retirementProb = 0.15;
        if (age > 40) retirementProb = 0.80;

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
      // 3 — HALL OF FAME
      if (team.isHuman) {
          const stats = state.stats.career[pid] || { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, plusMinus: 0, gamesPlayed: 0, fgPct: 0 };
          const awardsWon = state.trophyCase.filter(t => t.playerId === pid).map(t => t.type);
          const seasonsPlayed = Object.values(state.awards).filter(a => a.mvp === pid || a.roy === pid || (a.allNba || []).includes(pid)).length; // Simplified check
          
          state.hallOfFame.push({
             id: pid,
             name: card?.name || 'Retired Legend',
             card: card,
             stats: stats as any,
             seasonsPlayed: seasonsPlayed + 1,
             awards: awardsWon,
             lastTeam: team.name
          });
      }

      team.roster = team.roster.filter(id => id !== pid);
      delete team.contracts[pid];
      (['PG', 'SG', 'SF', 'PF', 'C'] as const).forEach(pos => {
        if (team.lineup[pos] === pid) team.lineup[pos] = null;
      });
      team.lineup.bench = team.lineup.bench.filter(rid => rid !== pid);
    }
    
    state.freeAgentPool = state.freeAgentPool.filter(id => id !== pid);
    
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

export function runCPUOffseasonLogic(state: FranchiseState) {
  const CP_SALARY_CAP = 160000000;
  
  Object.values(state.teams).forEach(team => {
    if (team.isHuman) return;

    // 1. RENEWALS (50% probability for players with 0 years left)
    const expiredIds = team.roster.filter(pid => {
      const contract = team.contracts[pid];
      return !contract || contract.yearsRemaining <= 0;
    });

    expiredIds.forEach(id => {
      const card = ALL_CARDS.find(c => c.id === id) || state.customCards?.find(c => c.id === id) || state.draftPool?.find(c => c.id === id);
      if (!card) return;

      const ovr = state.playerProgress[id]?.ovr || card.stats.ovr;
      // 50% fixed probability as requested
      if (Math.random() < 0.50) {
        const seasons = team.contracts[id]?.seasonsWithTeam || 0;
        const newContract = generateContract(id, ovr, seasons + 1);
        team.contracts[id] = newContract;
        
        state.notifications.unshift({
          id: `renew-off-${team.teamId}-${id}-${Date.now()}`,
          type: 'NEWS',
          message: `${card.name} signs with ${team.abbreviation} on a ${newContract.yearsRemaining}-year deal.`,
          week: state.week,
          season: state.season,
          read: false
        });
      } else {
        // Goes to Free Agency
        team.roster = team.roster.filter(rid => rid !== id);
        delete team.contracts[id];
        state.freeAgentPool.push(id);
        (['PG', 'SG', 'SF', 'PF', 'C'] as const).forEach(pos => {
          if (team.lineup[pos] === id) team.lineup[pos] = null;
        });
        team.lineup.bench = team.lineup.bench.filter(rid => rid !== id);
      }
    });

    // 2. FILL ROSTER IF BELOW 10 PLAYERS (Up to 12)
    // Prioritizing high OVR from free agency
    if (team.roster.length < 10) {
      const availableFA = state.freeAgentPool
        .map(id => {
          const card = ALL_CARDS.find(c => c.id === id) || state.draftPool?.find(c => c.id === id);
          return { id, ovr: state.playerProgress[id]?.ovr || card?.stats.ovr || 0, card };
        })
        .sort((a, b) => b.ovr - a.ovr);

      for (const fa of availableFA) {
        if (team.roster.length >= 12) break;
        if (!fa.card) continue;

        const salary = getInitialSalary(fa.ovr, getContractType(fa.ovr));
        const currentPayroll = Object.values(team.contracts).reduce((sum, c) => sum + c.salary, 0);

        if (currentPayroll + salary < CP_SALARY_CAP) {
          team.roster.push(fa.id);
          const newContract = generateContract(fa.id, fa.ovr, 0);
          team.contracts[fa.id] = newContract;
          state.freeAgentPool = state.freeAgentPool.filter(id => id !== fa.id);
          
          state.notifications.unshift({
            id: `fa-sign-${team.teamId}-${fa.id}-${Date.now()}`,
            type: 'NEWS',
            message: `${fa.card.name} signs with ${team.abbreviation} on a ${newContract.yearsRemaining}-year deal.`,
            week: state.week,
            season: state.season,
            read: false
          });
        }
      }
    }

    team.payroll = Object.values(team.contracts).reduce((s, c) => s + c.salary, 0);
  });
}

export function advanceSeason(state: FranchiseState): FranchiseState {
  const newState = { ...state };
  console.log(`[FRANCHISE] Finishing Season ${state.season}. Advancing to ${state.season + 1}`);
  
  const userTeam = newState.teams[newState.userTeamId];
  
  // 3 — HISTORIAL DE CAMPEONES Y TROFEOS
  const awards = (state.awards[state.season] || {}) as any;
  
  // Get playoff result for user
  let playoffResult = 'Missed Playoffs';
  const userSeries = (state.playoffSeries || []).filter(s => s.team1Id === state.userTeamId || s.team2Id === state.userTeamId);
  if (userSeries.length > 0) {
      const maxRound = Math.max(...userSeries.map(s => s.round));
      const latestSeries = userSeries.find(s => s.round === maxRound);
      const isWinner = latestSeries?.winnerId === state.userTeamId;
      
      if (maxRound === 1) playoffResult = isWinner ? 'Conference Semifinals' : 'First Round';
      if (maxRound === 2) playoffResult = isWinner ? 'Conference Finals' : 'Conference Semifinals';
      if (maxRound === 3) playoffResult = isWinner ? '🏆 CHAMPION' : 'Runner-Up';
      if (maxRound === 0) playoffResult = isWinner ? 'First Round' : 'Play-In Loss';
  }

  if (!newState.seasonHistory) newState.seasonHistory = [];
  newState.seasonHistory.push({
    seasonYear: state.season,
    wins: userTeam.wins,
    losses: userTeam.losses,
    playoffResult,
    champion: state.championId ? (state.teams[state.championId]?.name || 'N/A') : 'N/A',
    mvp: awards.mvp,
    dpoy: awards.dpoy,
    roy: awards.roy,
    mip: awards.mip,
    allNba: awards.allNba || [],
    finalsMvp: awards.finalsMvp
  });

  // 2. APPLY PROGRESSION & AGING
  applyProgression(newState);

  // 3. STATS ARCHIVING
  if (!newState.stats.career) newState.stats.career = {};
  Object.entries(newState.stats.seasonal || {}).forEach(([pid, s]) => {
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
  if (newState.stats.playoffs) newState.stats.playoffs = {};
  newState.seasonHighs = {};

  // 4. CONTRACT MANAGEMENT (yearsLeft --)
  Object.values(newState.teams).forEach(team => {
    Object.keys(team.contracts).forEach(pid => {
      const contract = team.contracts[pid];
      contract.yearsRemaining -= 1;
      contract.canExtend = contract.yearsRemaining <= 2;

      if (contract.yearsRemaining <= 0) {
        if (!newState.freeAgentPool.includes(pid)) newState.freeAgentPool.push(pid);
        delete team.contracts[pid];
        team.roster = team.roster.filter(id => id !== pid);
        (['PG', 'SG', 'SF', 'PF', 'C'] as const).forEach(pos => {
           if (team.lineup[pos] === pid) team.lineup[pos] = null;
        });
        team.lineup.bench = team.lineup.bench.filter(id => id !== pid);
      }
    });
  });

  // 5. RESET RECORDS & STANDINGS
  Object.values(newState.teams).forEach(team => {
    team.wins = 0;
    team.losses = 0;
  });
  newState.currentGameIndex = 0;

  // 6. SEASON INCREMENT
  const previousPhase = newState.phase;
  newState.season += 1;
  newState.week = 1;
  newState.phase = 'regular_season';
  
  console.log('[FRANCHISE PHASE CHANGE]', { 
    from: previousPhase, 
    to: newState.phase, 
    newSeason: newState.season, 
    timestamp: new Date().toISOString() 
  });

  newState.championId = undefined;
  newState.playoffSeries = [];
  newState.standings = null;
  newState.lotteryPicks = [];

  // 7. GENERATE NEW SCHEDULE
  newState.schedule = scheduleService.generateSchedule(newState.teams);

  // 5. Run CPU Offseason Logic (Trades, Signings, Releases)
  runCPUOffseasonLogic(newState);

  newState.notifications.unshift({
    id: `new-season-${newState.season}-${Date.now()}`,
    type: 'NEWS',
    message: `🏀 Welcome to Season ${newState.season}! The regular season has officially begun.`,
    week: 1,
    season: newState.season,
    read: false
  });

  return newState;
}

export function initializeFranchiseState(userTeamId: string): FranchiseState {
  const { teams, freeAgents } = buildAllTeamRosters();
  
  if (teams[userTeamId]) teams[userTeamId].isHuman = true;

  const playerProgress: Record<string, { age: number; potential: number; form: number, ovrAtSeasonStart?: number }> = {};
  ALL_CARDS.forEach(c => {
    playerProgress[c.id] = {
      age: c.age || Math.floor(Math.random() * 8) + 22,
      potential: c.stats.ovr + Math.floor(Math.random() * 10),
      form: 1.0,
      ovrAtSeasonStart: c.stats.ovr
    };
  });

  const schedule = scheduleService.generateSchedule(teams);

  return {
    version: "2.0",
    season: 2025,
    week: 1,
    phase: "regular_season",
    userTeamId,
    teams,
    freeAgentPool: freeAgents,
    schedule,
    playoffSeries: [],
    playerProgress,
    currentGameIndex: 0,
    stats: {
      seasonal: {},
      career: {}
    },
    draftHistory: [],
    tradeHistory: [],
    awards: {},
    trophyCase: [],
    seasonHighs: {},
    seasonHistory: [],
    hallOfFame: [],
    negotiations: {},
    notifications: []
  };
}
