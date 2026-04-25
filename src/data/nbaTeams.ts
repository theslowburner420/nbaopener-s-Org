import { Card, CareerMatch } from '../types';

export interface NBATeamDef {
  id: string;
  name: string;
  city: string;
  conference: 'East' | 'West';
  division: string;
  primaryColor: string;
  secondaryColor: string;
  tier: 'elite' | 'good' | 'average' | 'rebuild';
  dataAbbr?: string;
  logoUrl?: string;
}

export function getTeamLogo(teamId: string): string {
  const team = NBA_TEAMS.find(t => t.id === teamId || t.name === teamId);
  // Using official NBA CDN for logos
  const idMap: Record<string, string> = {
    'ATL': '1610612737', 'BOS': '1610612738', 'CLE': '1610612739', 'NOP': '1610612740',
    'CHI': '1610612741', 'DAL': '1610612742', 'DEN': '1610612743', 'GSW': '1610612744',
    'HOU': '1610612745', 'LAC': '1610612746', 'LAL': '1610612747', 'MIA': '1610612748',
    'MIL': '1610612749', 'MIN': '1610612750', 'BKN': '1610612751', 'NYK': '1610612752',
    'ORL': '1610612753', 'IND': '1610612754', 'PHI': '1610612755', 'PHX': '1610612756',
    'POR': '1610612757', 'SAC': '1610612758', 'SAS': '1610612759', 'OKC': '1610612760',
    'TOR': '1610612761', 'UTA': '1610612762', 'WAS': '1610612763', 'DET': '1610612765',
    'CHA': '1610612766', 'MEM': '1610612763' // Memphis fix usually 1610612763 is used for both MEM/WAS in some APIs but let's be careful
  };
  const nbaId = idMap[team?.id || 'LAL'] || '1610612747';
  return `https://cdn.nba.com/logos/nba/${nbaId}/primary/L/logo.svg`;
}

export const NBA_TEAMS: NBATeamDef[] = [
  // East Atlantic
  { id: 'BOS', name: 'Boston Celtics', city: 'Boston', conference: 'East', division: 'Atlantic', primaryColor: '#007A33', secondaryColor: '#BA9653', tier: 'elite', dataAbbr: 'BOS' },
  { id: 'NYK', name: 'New York Knicks', city: 'New York', conference: 'East', division: 'Atlantic', primaryColor: '#006BB6', secondaryColor: '#F58426', tier: 'good', dataAbbr: 'NYK' },
  { id: 'PHI', name: 'Philadelphia 76ers', city: 'Philadelphia', conference: 'East', division: 'Atlantic', primaryColor: '#006BB6', secondaryColor: '#ED174C', tier: 'average', dataAbbr: 'PHI' },
  { id: 'TOR', name: 'Toronto Raptors', city: 'Toronto', conference: 'East', division: 'Atlantic', primaryColor: '#CE1141', secondaryColor: '#000000', tier: 'rebuild', dataAbbr: 'TOR' },
  { id: 'BKN', name: 'Brooklyn Nets', city: 'Brooklyn', conference: 'East', division: 'Atlantic', primaryColor: '#000000', secondaryColor: '#FFFFFF', tier: 'rebuild', dataAbbr: 'BKN' },
  
  // East Central
  { id: 'CHI', name: 'Chicago Bulls', city: 'Chicago', conference: 'East', division: 'Central', primaryColor: '#CE1141', secondaryColor: '#000000', tier: 'average', dataAbbr: 'CHI' },
  { id: 'CLE', name: 'Cleveland Cavaliers', city: 'Cleveland', conference: 'East', division: 'Central', primaryColor: '#860038', secondaryColor: '#FDBB30', tier: 'elite', dataAbbr: 'CLE' },
  { id: 'DET', name: 'Detroit Pistons', city: 'Detroit', conference: 'East', division: 'Central', primaryColor: '#C8102E', secondaryColor: '#006BB6', tier: 'good', dataAbbr: 'DET' },
  { id: 'IND', name: 'Indiana Pacers', city: 'Indiana', conference: 'East', division: 'Central', primaryColor: '#002D62', secondaryColor: '#FDBB30', tier: 'good', dataAbbr: 'IND' },
  { id: 'MIL', name: 'Milwaukee Bucks', city: 'Milwaukee', conference: 'East', division: 'Central', primaryColor: '#00471B', secondaryColor: '#EEE1C6', tier: 'average', dataAbbr: 'MIL' },
  
  // East Southeast
  { id: 'ATL', name: 'Atlanta Hawks', city: 'Atlanta', conference: 'East', division: 'Southeast', primaryColor: '#E03A3E', secondaryColor: '#C1D32F', tier: 'average', dataAbbr: 'ATL' },
  { id: 'CHA', name: 'Charlotte Hornets', city: 'Charlotte', conference: 'East', division: 'Southeast', primaryColor: '#1D1160', secondaryColor: '#00788C', tier: 'rebuild', dataAbbr: 'CHA' },
  { id: 'MIA', name: 'Miami Heat', city: 'Miami', conference: 'East', division: 'Southeast', primaryColor: '#98002E', secondaryColor: '#F9A01B', tier: 'good', dataAbbr: 'MIA' },
  { id: 'ORL', name: 'Orlando Magic', city: 'Orlando', conference: 'East', division: 'Southeast', primaryColor: '#0077C0', secondaryColor: '#C4CED4', tier: 'good', dataAbbr: 'ORL' },
  { id: 'WAS', name: 'Washington Wizards', city: 'Washington', conference: 'East', division: 'Southeast', primaryColor: '#002B5C', secondaryColor: '#E31837', tier: 'rebuild', dataAbbr: 'WAS' },
  
  // West Northwest
  { id: 'DEN', name: 'Denver Nuggets', city: 'Denver', conference: 'West', division: 'Northwest', primaryColor: '#0E2240', secondaryColor: '#FEC524', tier: 'elite', dataAbbr: 'DEN' },
  { id: 'MIN', name: 'Minnesota Timberwolves', city: 'Minnesota', conference: 'West', division: 'Northwest', primaryColor: '#0C2340', secondaryColor: '#236192', tier: 'elite', dataAbbr: 'MIN' },
  { id: 'OKC', name: 'Oklahoma City Thunder', city: 'Oklahoma City', conference: 'West', division: 'Northwest', primaryColor: '#007AC1', secondaryColor: '#EF3B24', tier: 'elite', dataAbbr: 'OKC' },
  { id: 'POR', name: 'Portland Trail Blazers', city: 'Portland', conference: 'West', division: 'Northwest', primaryColor: '#E03A3E', secondaryColor: '#000000', tier: 'rebuild', dataAbbr: 'POR' },
  { id: 'UTA', name: 'Utah Jazz', city: 'Utah', conference: 'West', division: 'Northwest', primaryColor: '#002B5C', secondaryColor: '#00471B', tier: 'rebuild', dataAbbr: 'UTA' },
  
  // West Pacific
  { id: 'GSW', name: 'Golden State Warriors', city: 'Golden State', conference: 'West', division: 'Pacific', primaryColor: '#1D428A', secondaryColor: '#FFC72C', tier: 'good', dataAbbr: 'GSW' },
  { id: 'LAC', name: 'LA Clippers', city: 'Los Angeles', conference: 'West', division: 'Pacific', primaryColor: '#C8102E', secondaryColor: '#1D428A', tier: 'average', dataAbbr: 'LAC' },
  { id: 'LAL', name: 'Los Angeles Lakers', city: 'Los Angeles', conference: 'West', division: 'Pacific', primaryColor: '#552583', secondaryColor: '#FDB927', tier: 'elite', dataAbbr: 'LAL' },
  { id: 'PHX', name: 'Phoenix Suns', city: 'Phoenix', conference: 'West', division: 'Pacific', primaryColor: '#1D1160', secondaryColor: '#E56020', tier: 'average', dataAbbr: 'PHX' },
  { id: 'SAC', name: 'Sacramento Kings', city: 'Sacramento', conference: 'West', division: 'Pacific', primaryColor: '#5A2D81', secondaryColor: '#63727A', tier: 'average', dataAbbr: 'SAC' },
  
  // West Southwest
  { id: 'DAL', name: 'Dallas Mavericks', city: 'Dallas', conference: 'West', division: 'Southwest', primaryColor: '#00538C', secondaryColor: '#002B5E', tier: 'average', dataAbbr: 'DAL' },
  { id: 'HOU', name: 'Houston Rockets', city: 'Houston', conference: 'West', division: 'Southwest', primaryColor: '#CE1141', secondaryColor: '#000000', tier: 'good', dataAbbr: 'HOU' },
  { id: 'MEM', name: 'Memphis Grizzlies', city: 'Memphis', conference: 'West', division: 'Southwest', primaryColor: '#5D76A9', secondaryColor: '#12173F', tier: 'good', dataAbbr: 'MEM' },
  { id: 'NOP', name: 'New Orleans Pelicans', city: 'New Orleans', conference: 'West', division: 'Southwest', primaryColor: '#0C2340', secondaryColor: '#C8102E', tier: 'average', dataAbbr: 'NOP' },
  { id: 'SAS', name: 'San Antonio Spurs', city: 'San Antonio', conference: 'West', division: 'Southwest', primaryColor: '#C4CED4', secondaryColor: '#000000', tier: 'average', dataAbbr: 'SAS' },
];

export function getCPUTeamOVR(teamId: string, allCards: Card[], rosterOverride?: string[]): number {
  const team = NBA_TEAMS.find(t => t.id === teamId);
  if (!team) return 75;
  
  let cards: Card[] = [];
  if (rosterOverride && rosterOverride.length > 0) {
    cards = rosterOverride.map(id => allCards.find(c => c.id === id)).filter(Boolean) as Card[];
  } else if (team.dataAbbr) {
    cards = allCards.filter(c => 
      c.teamAbbr === team.dataAbbr && !c.isHistorical
    );
  }

  if (cards.length > 0) {
    const sorted = [...cards].sort((a,b) => b.stats.ovr - a.stats.ovr);
    const starters = sorted.slice(0, 5);
    const bench    = sorted.slice(5, 10);
    const sOVR = starters.reduce((s,c) => s + c.stats.ovr, 0) / starters.length;
    const bOVR = bench.length ? bench.reduce((s,c) => s + c.stats.ovr, 0) / bench.length : sOVR - 8;
    return Math.round(sOVR * 0.7 + bOVR * 0.3);
  }
  
  // Base OVR by tier if no specific cards found
  const base = { elite: 84, good: 80, average: 76, rebuild: 71 };
  return base[team.tier as keyof typeof base] || 75;
}

export function generateInitialStandings(): any[] {
  return NBA_TEAMS.map(team => ({
    teamId: team.id,
    teamName: team.name,
    conference: team.conference,
    division: team.division,
    wins: 0,
    losses: 0,
    pct: 0,
    streak: '-',
    isUser: false
  }));
}

export function generateSchedule(userTeamId: string, allCards: Card[]): CareerMatch[] {
  const schedule: CareerMatch[] = [];
  // Support both ID and Name lookups for robustness
  const userTeam = NBA_TEAMS.find(t => t.id === userTeamId || t.name === userTeamId) || NBA_TEAMS[0];
  
  const intraDivision = NBA_TEAMS.filter(t => t.id !== userTeam.id && t.division === userTeam.division);
  const intraConference = NBA_TEAMS.filter(t => t.conference === userTeam.conference && t.division !== userTeam.division);
  const interConference = NBA_TEAMS.filter(t => t.conference !== userTeam.conference);

  // 1. Intra-division (4 games each, 4 * 4 = 16)
  intraDivision.forEach(team => {
    for (let i = 0; i < 4; i++) {
      schedule.push(createMatch(team, i < 2, allCards, schedule.length));
    }
  });

  // 2. Intra-conference (3-4 games each, total ~36)
  intraConference.forEach((team, idx) => {
    const count = idx % 2 === 0 ? 4 : 3;
    for (let i = 0; i < count; i++) {
        schedule.push(createMatch(team, i % 2 === 0, allCards, schedule.length));
    }
  });

  // 3. Inter-conference (2 games each, 15 * 2 = 30)
  interConference.forEach(team => {
    for (let i = 0; i < 2; i++) {
        schedule.push(createMatch(team, i === 0, allCards, schedule.length));
    }
  });

  // Trim to 82 exactly if slightly off due to rounding
  const finalSchedule = schedule.slice(0, 82);

  // Shuffle home/away pattern slightly to avoid long stretches
  return finalSchedule.sort(() => Math.random() - 0.5).map((m, i) => ({
    ...m,
    date: `Game ${i + 1}`,
    id: `game-${i + 1}`
  }));
}

function createMatch(opponent: NBATeamDef, home: boolean, allCards: Card[], index: number): CareerMatch {
  return {
    id: `temp-${index}`,
    opponentTeam: opponent.name,
    opponentAbbr: opponent.id,
    opponentOVR: getCPUTeamOVR(opponent.id, allCards),
    played: false,
    homeGame: home,
    date: `Game ${index + 1}`
  };
}
