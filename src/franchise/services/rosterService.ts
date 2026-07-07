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
    sixthMan: '',
    allNba: [],
    allNba1st: [],
    allNba2nd: [],
    allNba3rd: [],
    allDefensive1st: [],
    allDefensive2nd: [],
    allDefensive3rd: [],
    allRookie1st: [],
    allRookie2nd: [],
    allRookie3rd: []
  };
  state.awards[state.season] = awards;
  const seasonalStats = state.stats.seasonal;

  // Finalize Standings calculate for award eligibility
  const standings = Object.values(state.teams).map(t => ({
    id: t.teamId,
    winPct: (t.wins || 0) / ((t.wins || 0) + (t.losses || 0) || 1),
    wins: t.wins || 0,
    losses: t.losses || 0
  })).sort((a,b) => b.winPct - a.winPct);

  // Helper to get Points Allowed per game for team
  const getTeamPointsAllowed = (teamId: string): number => {
    const matches = state.schedule || [];
    let totalAllowed = 0;
    let playedGames = 0;

    matches.forEach((m: any) => {
      if (m.played && m.score) {
        if (m.homeTeamId === teamId) {
          totalAllowed += m.score.away;
          playedGames++;
        } else if (m.awayTeamId === teamId) {
          totalAllowed += m.score.home;
          playedGames++;
        }
      }
    });

    if (playedGames === 0) return 108; // Standard fallback
    return totalAllowed / playedGames;
  };

  const positionalWeights: Record<string, { pts: number; trb: number; ast: number; stl: number; blk: number; tov: number }> = {
    PG: { pts: 0.35, trb: 0.15, ast: 0.45, stl: 0.25, blk: 0.05, tov: -0.25 },
    SG: { pts: 0.40, trb: 0.20, ast: 0.30, stl: 0.25, blk: 0.10, tov: -0.20 },
    SF: { pts: 0.38, trb: 0.30, ast: 0.25, stl: 0.25, blk: 0.15, tov: -0.15 },
    PF: { pts: 0.35, trb: 0.40, ast: 0.15, stl: 0.15, blk: 0.30, tov: -0.15 },
    C:  { pts: 0.30, trb: 0.45, ast: 0.10, stl: 0.10, blk: 0.45, tov: -0.15 }
  };

  // Build metrics for all players in league
  const candidateStats = Object.keys(seasonalStats).map(id => {
    const s = seasonalStats[id];
    const card = findAnyCard(id, state);
    const progress = state.playerProgress[id];
    
    const GP = s.gamesPlayed || 1;
    const teamId = Object.values(state.teams).find(t => t.roster.includes(id))?.teamId;
    const team = teamId ? state.teams[teamId] : null;
    const isStarter = team && (Object.values(team.lineup).slice(0, 5) as any[]).includes(id);

    // GS Definition
    const GS = isStarter ? GP : 0;

    // Categorize card position
    const cardPos = card?.position || 'SF';
    let cleanPos: 'PG' | 'SG' | 'SF' | 'PF' | 'C' = 'SF';
    if (cardPos.includes('PG')) cleanPos = 'PG';
    else if (cardPos.includes('SG')) cleanPos = 'SG';
    else if (cardPos.includes('SF')) cleanPos = 'SF';
    else if (cardPos.includes('PF')) cleanPos = 'PF';
    else if (cardPos.includes('C')) cleanPos = 'C';
    else if (cardPos.includes('G')) cleanPos = 'PG';
    else if (cardPos.includes('F')) cleanPos = 'SF';

    // Per-game stats
    const ppg = s.points / GP;
    const rpg = s.rebounds / GP;
    const apg = s.assists / GP;
    const spg = (s.steals || 0) / GP;
    const bpg = (s.blocks || 0) / GP;
    const estimatedTov = (apg * 0.3) + (ppg * 0.07) + 0.4;

    // Team information
    const teamStandings = standings.find(st => st.id === teamId);
    const wins = teamStandings?.wins || 0;

    // 1. Puntuación de Impacto (PI)
    const weights = positionalWeights[cleanPos] || positionalWeights['SF'];
    const metricSum = (ppg * weights.pts) + 
                      (rpg * weights.trb) + 
                      (apg * weights.ast) + 
                      (spg * weights.stl) + 
                      (bpg * weights.blk) + 
                      (estimatedTov * weights.tov);
    const PI = metricSum + ((wins / 82) * 12);

    // Rookie status
    const isRookie = card?.category === 'Rookie' || card?.id?.includes('draft') || (progress && progress.age <= 21) || (card as any)?.isRookie === true;

    // MIP Base Ovr
    const initialOvr = progress?.ovrAtSeasonStart !== undefined ? progress.ovrAtSeasonStart : (card?.stats.ovr || 70);

    // Historical metrics for MIP (baseline performance of the card)
    const histPts = card?.stats.points || ppg;
    const histReb = card?.stats.rebounds || rpg;
    const histAst = card?.stats.assists || apg;
    const histStl = 0.8;
    const histBlk = cleanPos === 'C' ? 1.5 : cleanPos === 'PF' ? 1.0 : 0.4;
    const histTov = (histAst * 0.3) + (histPts * 0.07) + 0.4;
    const metricSumHist = (histPts * weights.pts) + 
                          (histReb * weights.trb) + 
                          (histAst * weights.ast) + 
                          (histStl * weights.stl) + 
                          (histBlk * weights.blk) + 
                          (histTov * weights.tov);
    // Historical team wins baseline is standard .500 (41 wins)
    const PI_histórico = metricSumHist + ((41 / 82) * 12);

    // 2. Award Scores
    // MVP: Score_MVP = PI * (1.0 + (Victorias / 82))^2
    const scoreMVP = PI * Math.pow(1.0 + (wins / 82), 2);

    // DPOY: Score_DPOY = ((STL * 2.2) + (BLK * 2.4) + TRB_def) * (105 / Puntos Permitidos del Equipo)
    const oppPPG = getTeamPointsAllowed(teamId || '');
    const trbDef = rpg * 0.75;
    const scoreDPOY = ((spg * 2.2) + (bpg * 2.4) + trbDef) * (105 / oppPPG);

    // MIP: Score_MIP = ((PI_actual - PI_histórico) / PI_histórico) * 100
    const scoreMIP = PI_histórico > 0 ? ((PI - PI_histórico) / PI_histórico) * 100 : 0;

    return {
      id,
      gamesPlayed: GP,
      GS,
      PI,
      scoreMVP,
      scoreDPOY,
      scoreMIP,
      isStarter,
      isRookie,
      cleanPos,
      initialOvr
    };
  });

  // Fallback if no stats
  if (candidateStats.length === 0) {
    const userRosterByOvr = [...userTeam.roster].sort((a,b) => {
        const ovrA = state.playerProgress[a]?.ovr || 0;
        const ovrB = state.playerProgress[b]?.ovr || 0;
        return ovrB - ovrA;
    });
    if (userRosterByOvr.length > 0) {
        awards.mvp = userRosterByOvr[0];
        awards.dpoy = userRosterByOvr[0];
        awards.roy = userRosterByOvr.find(id => state.playerProgress[id]?.age < 23) || userRosterByOvr[0];
        awards.mip = userRosterByOvr[0];
        awards.sixthMan = userRosterByOvr[1] || userRosterByOvr[0];
        awards.allNba = userRosterByOvr.slice(0, 5);
        awards.allNba1st = userRosterByOvr.slice(0, 5);
        awards.allNba2nd = userRosterByOvr.slice(1, 6);
        awards.allNba3rd = userRosterByOvr.slice(2, 7);
        awards.allDefensive1st = userRosterByOvr.slice(0, 5);
        awards.allDefensive2nd = userRosterByOvr.slice(1, 6);
        awards.allDefensive3rd = userRosterByOvr.slice(2, 7);
        awards.allRookie1st = userRosterByOvr.slice(0, 5);
        awards.allRookie2nd = userRosterByOvr.slice(1, 6);
        awards.allRookie3rd = userRosterByOvr.slice(2, 7);
        return;
    }
  }

  // MVP: Score_MVP = PI * (1.0 + (Victorias / 82))^2 (Elegibilidad: mínimo 66 partidos jugados)
  const mvpEligible = candidateStats.filter(p => p.gamesPlayed >= 66);
  const mvpPool = mvpEligible.length > 0 ? mvpEligible : candidateStats;
  const sortedMvp = [...mvpPool].sort((a, b) => b.scoreMVP - a.scoreMVP);
  if (sortedMvp.length > 0) {
    awards.mvp = sortedMvp[0].id;
  }

  // DPOY: Score_DPOY = ((STL * 2.2) + (BLK * 2.4) + TRB_def) * (105 / Puntos Permitidos del Equipo) (Elegibilidad: mínimo 60 partidos)
  const dpoyEligible = candidateStats.filter(p => p.gamesPlayed >= 60);
  const dpoyPool = dpoyEligible.length > 0 ? dpoyEligible : candidateStats;
  const sortedDpoy = [...dpoyPool].sort((a, b) => b.scoreDPOY - a.scoreDPOY);
  if (sortedDpoy.length > 0) {
    awards.dpoy = sortedDpoy[0].id;
  }

  // 6th Man: Ordenar por PI a los suplentes en al menos el 65% de sus partidos (GS / GP <= 0.35)
  const sixthManPool = candidateStats.filter(p => p.gamesPlayed >= 20 && (p.GS / p.gamesPlayed <= 0.35));
  const sortedSixthMan = [...(sixthManPool.length > 0 ? sixthManPool : candidateStats)].sort((a, b) => b.PI - a.PI);
  if (sortedSixthMan.length > 0) {
    awards.sixthMan = sortedSixthMan[0].id;
  }

  // MIP: Score_MIP = ((PI_actual - PI_histórico) / PI_histórico) * 100 (Exclusión: novatos y OVR inicial > 82)
  const mipPool = candidateStats.filter(p => !p.isRookie && p.initialOvr <= 82 && p.gamesPlayed >= 20);
  const sortedMip = [...(mipPool.length > 0 ? mipPool : candidateStats)].sort((a, b) => b.scoreMIP - a.scoreMIP);
  if (sortedMip.length > 0 && sortedMip[0].scoreMIP > 0) {
    awards.mip = sortedMip[0].id;
  } else {
    awards.mip = sortedMip[0]?.id;
  }

  // ROY: Ordenar por PI a los jugadores que tengan isRookie === true
  const royPool = candidateStats.filter(p => p.isRookie);
  const sortedRoy = [...(royPool.length > 0 ? royPool : candidateStats)].sort((a, b) => b.PI - a.PI);
  if (sortedRoy.length > 0) {
    awards.roy = sortedRoy[0].id;
  }

  // Helper to build Classic strict 2 Guards, 2 Forwards, 1 Center squads hierarchically
  const buildClasicSquad = (pool: typeof candidateStats, rankingMetric: 'PI' | 'scoreDPOY', excludes: Set<string>): string[] => {
    const subset = pool.filter(p => !excludes.has(p.id));
    const sorted = [...subset].sort((a, b) => b[rankingMetric] - a[rankingMetric]);
    
    const guards = sorted.filter(p => p.cleanPos === 'PG' || p.cleanPos === 'SG');
    const forwards = sorted.filter(p => p.cleanPos === 'SF' || p.cleanPos === 'PF');
    const centers = sorted.filter(p => p.cleanPos === 'C');

    // Safe fallback if not enough positions remain
    if (guards.length < 2 || forwards.length < 2 || centers.length < 1) {
      const topSelected = sorted.slice(0, 5).map(p => p.id);
      topSelected.forEach(id => excludes.add(id));
      return topSelected;
    }

    const selectedIds = [
      guards[0].id,
      guards[1].id,
      forwards[0].id,
      forwards[1].id,
      centers[0].id
    ];

    selectedIds.forEach(id => excludes.add(id));
    return selectedIds;
  };

  // Quintetos Ideales
  // - All-NBA
  const allNbaExcludes = new Set<string>();
  awards.allNba1st = buildClasicSquad(candidateStats, 'PI', allNbaExcludes);
  awards.allNba = awards.allNba1st; // Keep original property updated too for compatibility
  awards.allNba2nd = buildClasicSquad(candidateStats, 'PI', allNbaExcludes);
  awards.allNba3rd = buildClasicSquad(candidateStats, 'PI', allNbaExcludes);

  // - All-Defensive
  const allDefExcludes = new Set<string>();
  awards.allDefensive1st = buildClasicSquad(candidateStats, 'scoreDPOY', allDefExcludes);
  awards.allDefensive2nd = buildClasicSquad(candidateStats, 'scoreDPOY', allDefExcludes);
  awards.allDefensive3rd = buildClasicSquad(candidateStats, 'scoreDPOY', allDefExcludes);

  // - All-Rookie
  const rookieCandidates = candidateStats.filter(p => p.isRookie);
  const allRookieExcludes = new Set<string>();
  awards.allRookie1st = buildClasicSquad(rookieCandidates.length > 0 ? rookieCandidates : candidateStats, 'PI', allRookieExcludes);
  awards.allRookie2nd = buildClasicSquad(rookieCandidates.length > 0 ? rookieCandidates : candidateStats, 'PI', allRookieExcludes);
  awards.allRookie3rd = buildClasicSquad(rookieCandidates.length > 0 ? rookieCandidates : candidateStats, 'PI', allRookieExcludes);

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
  if (awards.sixthMan && userTeamPlayers.has(awards.sixthMan) && !awardExists('SIXTH_MAN', awards.sixthMan)) {
      state.trophyCase.push({ type: 'SIXTH_MAN', season: state.season, playerId: awards.sixthMan, label: 'Sixth Man of the Year' });
  }
  if (awards.allNba1st) {
      awards.allNba1st.forEach((id: string) => {
          if (userTeamPlayers.has(id) && !awardExists('ALL_NBA', id)) {
              state.trophyCase.push({ type: 'ALL_NBA', season: state.season, playerId: id, label: 'All-NBA First Team' });
          }
      });
  }
}

export function randomGaussian(mean: number, sd: number): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return num * sd + mean;
}

function clampVal(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

export function generateDraftPool(year: number): Card[] {
  const pool: Card[] = [];
  const collegues = [
    'Kentucky', 'Duke', 'Kansas', 'North Carolina', 'Villanova', 
    'UCLA', 'Arizona', 'Indiana', 'Michigan State', 'Gonzaga'
  ];

  for (let i = 0; i < 60; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const name = `${firstName} ${lastName}`;
    const college = collegues[Math.floor(Math.random() * collegues.length)];
    const pos = (['PG', 'SG', 'SF', 'PF', 'C'] as const)[Math.floor(Math.random() * 5)];

    const pPick = i + 1;
    const N1 = randomGaussian(0, 2.5);
    const ovrInicialValue = 84 - (6.5 * Math.log(pPick)) + N1;
    const baseOvrClamped = clampVal(ovrInicialValue, 55, 84);
    const cleanOvr = Math.round(baseOvrClamped);

    const N2 = randomGaussian(0, 4.0);
    const potInicialValue = baseOvrClamped + ((100 - pPick) / 5) + N2;
    const cleanPot = Math.round(clampVal(potInicialValue, baseOvrClamped, 99));

    const rarity = cleanOvr >= 90 ? 'franchise' : cleanOvr >= 83 ? 'allstar' : cleanOvr >= 75 ? 'starter' : 'bench';

    const newCard: Card = {
      id: `draft_${year}_${i}`,
      number: Math.floor(Math.random() * 99),
      name,
      team: '',
      teamAbbr: 'DRFT',
      teamColor: '#6366F1',
      position: pos,
      rarity: rarity,
      category: 'Rookie',
      subtitle: `${college}`,
      isHistorical: false,
      pts: 0,
      reb: 0,
      ast: 0,
      age: 19 + Math.floor(Math.random() * 3),
      nbaId: 0,
      stats: {
        points: Number((cleanOvr * 0.22).toFixed(1)),
        rebounds: Number((cleanOvr * 0.12).toFixed(1)),
        assists: Number((cleanOvr * 0.1).toFixed(1)),
        ovr: cleanOvr,
        potential: cleanPot
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

  // Build metrics for all players in league in order to track PI
  const seasonalStats = state.stats.seasonal || {};
  const standings = Object.values(state.teams).map(t => ({
    id: t.teamId,
    wins: t.wins || 0,
    losses: t.losses || 0,
    winPct: (t.wins || 0) / (((t.wins || 0) + (t.losses || 0)) || 1)
  }));

  const positionalWeights: Record<string, { pts: number; trb: number; ast: number; stl: number; blk: number; tov: number }> = {
    PG: { pts: 0.35, trb: 0.15, ast: 0.45, stl: 0.25, blk: 0.05, tov: -0.25 },
    SG: { pts: 0.40, trb: 0.20, ast: 0.30, stl: 0.25, blk: 0.10, tov: -0.20 },
    SF: { pts: 0.38, trb: 0.30, ast: 0.25, stl: 0.25, blk: 0.15, tov: -0.15 },
    PF: { pts: 0.35, trb: 0.40, ast: 0.15, stl: 0.15, blk: 0.30, tov: -0.15 },
    C:  { pts: 0.30, trb: 0.45, ast: 0.10, stl: 0.10, blk: 0.45, tov: -0.15 }
  };

  const playerPIs: Array<{ id: string; cleanPos: string; PI: number }> = [];

  Object.keys(seasonalStats).forEach(id => {
    const s = seasonalStats[id];
    const GP = s.gamesPlayed || 1;
    const card = findAnyCard(id, state);
    const teamId = Object.values(state.teams).find(t => t.roster.includes(id))?.teamId;
    const teamStandings = standings.find(st => st.id === teamId);
    const wins = teamStandings?.wins || 0;

    const cardPos = card?.position || 'SF';
    let cleanPos: 'PG' | 'SG' | 'SF' | 'PF' | 'C' = 'SF';
    if (cardPos.includes('PG')) cleanPos = 'PG';
    else if (cardPos.includes('SG')) cleanPos = 'SG';
    else if (cardPos.includes('SF')) cleanPos = 'SF';
    else if (cardPos.includes('PF')) cleanPos = 'PF';
    else if (cardPos.includes('C')) cleanPos = 'C';
    else if (cardPos.includes('G')) cleanPos = 'PG';
    else if (cardPos.includes('F')) cleanPos = 'SF';

    const ppg = s.points / GP;
    const rpg = s.rebounds / GP;
    const apg = s.assists / GP;
    const spg = (s.steals || 0) / GP;
    const bpg = (s.blocks || 0) / GP;
    const estimatedTov = (apg * 0.3) + (ppg * 0.07) + 0.4;

    const weights = positionalWeights[cleanPos] || positionalWeights['SF'];
    const metricSum = (ppg * weights.pts) + 
                      (rpg * weights.trb) + 
                      (apg * weights.ast) + 
                      (spg * weights.stl) + 
                      (bpg * weights.blk) + 
                      (estimatedTov * weights.tov);
    const PI = metricSum + ((wins / 82) * 12);
    playerPIs.push({ id, cleanPos, PI });
  });

  // Top 20% by position
  const top20PercentPlayers = new Set<string>();
  ['PG', 'SG', 'SF', 'PF', 'C'].forEach(pos => {
    const sortedPos = playerPIs.filter(p => p.cleanPos === pos).sort((a, b) => b.PI - a.PI);
    const cutCount = Math.ceil(sortedPos.length * 0.2);
    sortedPos.slice(0, cutCount).forEach(p => top20PercentPlayers.add(p.id));
  });

  const RARITY_COLORS: Record<string, string> = {
    'bench': '#94A3B8',
    'starter': '#10B981',
    'allstar': '#3B82F6',
    'franchise': '#A855F7',
    'legend': '#F59E0B'
  };

  const findAndCloneCard = (id: string): any => {
    let card = state.draftPool?.find(c => c.id === id);
    if (card) return card;
    card = state.customCards?.find(c => c.id === id);
    if (card) return card;
    const staticCard = ALL_CARDS.find(c => c.id === id);
    if (staticCard) {
      const cloned = JSON.parse(JSON.stringify(staticCard));
      if (!state.customCards) state.customCards = [];
      state.customCards.push(cloned);
      return cloned;
    }
    return null;
  };

  allCardIds.forEach(id => {
    const card = findAnyCard(id, state);
    const progress = state.playerProgress[id];
    
    if (card && progress) {
      // 1. Increment Age
      progress.age += 1;
      const age = progress.age;
      const currentOvr = progress.ovr || card.stats.ovr;
      
      // Save current OVR as starting OVR for next season's MIP calculation
      progress.ovrAtSeasonStart = currentOvr;

      let delta = 0;
      
      // 2. Refactored age progression logic
      if (age < 26) {
        // Crecimiento (Edad < 26): Acelerado convergiendo al potencial
        const maxPotential = progress.potential || card.stats.potential || currentOvr;
        const gap = maxPotential - currentOvr;
        if (gap > 0) {
          const factor = 0.25 + Math.random() * 0.15;
          delta = Math.ceil(gap * factor);
          if (Math.random() > 0.70) delta += 1;
        } else {
          delta = Math.random() < 0.15 ? 1 : 0;
        }

        // Aplica un bono del +15% en delta si estuvo en el top 20% de su posición en PI
        if (top20PercentPlayers.has(id)) {
          delta = Math.round(delta * 1.15);
        }
      } else if (age >= 26 && age <= 29) {
        // Meseta (Edad 26-29): Variaciones sutiles de -1 a +2
        const possibleDeltas = [-1, 0, 1, 2];
        delta = possibleDeltas[Math.floor(Math.random() * possibleDeltas.length)];

        // Condicionadas negativamente si sufrió lesiones graves
        const hasSeriousInjury = progress.injurySeverity === 'Season-Ending' || 
                                 (progress.injury && progress.injury.severity === 'Season-Ending') || 
                                 (progress.injuryWeeks && progress.injuryWeeks > 15);
        if (hasSeriousInjury) {
          delta = Math.min(delta, 0) - (Math.random() < 0.5 ? 1 : 0);
        }
      } else {
        // Declive (Edad >= 30): Reducción física acelerada usando la fórmula
        const durability = progress.attributes?.durability || (card as any).attributes?.durability || 75;
        delta = -Math.round((age - 29) * 0.55 * (1.5 - durability / 100));
        delta = Math.min(0, delta);
      }

      // Bonus for Awards
      if (awards.mvp === id || awards.dpoy === id) {
          delta = Math.max(delta, 1);
      }

      // Apply the change and keep synced OVR/potential
      const newOvr = Math.min(99, Math.max(55, currentOvr + delta));
      progress.ovr = newOvr;
      if (progress.potential < newOvr) {
        progress.potential = newOvr;
      }

      // Synchronize changes on our cloned/mutable card
      const updatedCard = findAndCloneCard(id);
      if (updatedCard) {
        updatedCard.stats.ovr = newOvr;
        updatedCard.stats.points = Number((newOvr * 0.22).toFixed(1));
        updatedCard.stats.rebounds = Number((newOvr * 0.12).toFixed(1));
        updatedCard.stats.assists = Number((newOvr * 0.1).toFixed(1));
      }

      // Retirement Logic
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

  // Mapeo Automático de Calidad and simulated SQLite Transaction
  console.log("-----------------------------------------");
  console.log("SQL TRANSACTION START: Mapeo Automático de Calidad");
  console.log("BEGIN TRANSACTION;");

  allCardIds.forEach(id => {
    const progress = state.playerProgress[id];
    if (progress) {
      const updatedCard = findAndCloneCard(id);
      if (updatedCard) {
        // Remove isRookie
        if (updatedCard.category === 'Rookie') {
          updatedCard.category = '';
        }
        (updatedCard as any).isRookie = false;

        const cleanOvr = progress.ovr || updatedCard.stats.ovr;
        
        // Mapeo automático de calidad ('franchise' si rating >= 90, 'all star' (allstar) >= 83, 'starter' >= 75, 'bench' < 75)
        const newRarity = cleanOvr >= 90 ? 'franchise' : cleanOvr >= 83 ? 'allstar' : cleanOvr >= 75 ? 'starter' : 'bench';
        updatedCard.rarity = newRarity;
        
        // Asocia sus temas visuales correspondientes
        updatedCard.teamColor = RARITY_COLORS[newRarity];

        console.log(`UPDATE cards SET rarity = '${newRarity}', isRookie = 0, teamColor = '${RARITY_COLORS[newRarity]}' WHERE id = '${id}'; -- OVR: ${cleanOvr}`);
      }
    }
  });
  console.log("COMMIT;");
  console.log("SQL TRANSACTION END: Mapeo Automático de Calidad");
  console.log("-----------------------------------------");

  // Handle Retirements
  retiredPlayers.forEach(pid => {
    const card = findAnyCard(pid, state);
    const team = Object.values(state.teams).find(t => t.roster.includes(pid));
    
    if (team) {
      // HALL OF FAME
      if (team.isHuman) {
          const stats = state.stats.career[pid] || { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, plusMinus: 0, gamesPlayed: 0, fgPct: 0 };
          const awardsWon = state.trophyCase.filter(t => t.playerId === pid).map(t => t.type);
          const seasonsPlayed = Object.values(state.awards).filter(a => a.mvp === pid || a.roy === pid || (a.allNba || []).includes(pid)).length; // Simplified check
          
          state.hallOfFame.push({
             id: pid,
             name: card?.name || 'Retired Legend',
             card: card as Card,
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

  // Auto-fill and optimize lineups for ALL teams to prevent any empty/null slots in simulation
  Object.values(newState.teams).forEach(team => {
    autoFillLineupForTeam(team, newState);
  });

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

export function findAnyCard(id: string, state: FranchiseState) {
  return ALL_CARDS.find(c => c.id === id) || 
         state.customCards?.find(c => c.id === id) || 
         state.draftPool?.find(c => c.id === id);
}

export function autoFillLineupForTeam(team: TeamObject, state: FranchiseState) {
  // Map player IDs to cards and calculate current OVRs
  const teamPlayers = team.roster.map(id => {
    const card = findAnyCard(id, state);
    const ovr = state.playerProgress[id]?.ovr || card?.stats.ovr || 60;
    return { id, card, ovr };
  }).filter(p => p.card !== undefined);

  const availableForLineup = [...teamPlayers].sort((a, b) => b.ovr - a.ovr);
  const usedIds = new Set<string>();

  const findBestForPos = (posFilter: string) => {
    // Try matching specific positional filter in the card position string
    let best = availableForLineup.find(p => !usedIds.has(p.id) && p.card!.position.includes(posFilter));
    if (best) {
      usedIds.add(best.id);
      return best.id;
    }
    // Fallback to absolute highest OVR player remaining
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
