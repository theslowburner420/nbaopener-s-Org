import { Card, SbcRequirement, Rarity, SbcGroup } from '../types';
import { NBA_TEAMS } from '../data/nbaTeams';
import { getLoreForPlayer } from '../data/sbcCardLore';

const RARITY_ORDER: Record<string, number> = {
  'bench': 0,
  'starter': 1,
  'allstar': 2,
  'legend': 3,
  'franchise': 4,
  'invincible': 5,
  'galaxy': 6,
  'legend_sbc': 7,
  'icon_sbc': 8,
  'moments_sbc': 9,
  'future_star': 10
};

interface PlayerStatMeta {
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C';
  team: string;
  teamAbbr: string;
  imageUrl: string;
  pts: number;
  reb: number;
  ast: number;
  subtitle?: string;
}

const PLAYER_SIGNATURE_STATS: Record<string, Array<{ label: string; value: string | number; color?: string }>> = {
  'Stephen Curry': [{ label: '3PT', value: '99', color: 'bg-amber-400' }, { label: 'MVPS', value: '2x', color: 'bg-amber-300' }, { label: 'RINGS', value: '4', color: 'bg-yellow-400' }],
  'Michael Jordan': [{ label: 'FINALS', value: '6-0', color: 'bg-red-500' }, { label: 'PPG', value: '33.4', color: 'bg-red-400' }, { label: 'FMVP', value: '6x', color: 'bg-amber-400' }],
  'Kobe Bryant': [{ label: 'MAMBA', value: '99', color: 'bg-purple-500' }, { label: 'PTS', value: '81', color: 'bg-amber-400' }, { label: 'RINGS', value: '5', color: 'bg-yellow-400' }],
  'LeBron James': [{ label: 'CHOSEN', value: '99', color: 'bg-amber-500' }, { label: 'ROTY', value: "'04", color: 'bg-red-500' }, { label: 'FMVP', value: '4x', color: 'bg-yellow-400' }],
  'Magic Johnson': [{ label: 'SHOWTIME', value: '99', color: 'bg-purple-500' }, { label: 'AST/G', value: '11.2', color: 'bg-blue-400' }, { label: 'RINGS', value: '5', color: 'bg-yellow-400' }],
  "Shaquille O'Neal": [{ label: 'DOMINANCE', value: '99', color: 'bg-blue-500' }, { label: 'DUNK', value: '99', color: 'bg-amber-400' }, { label: 'RINGS', value: '4', color: 'bg-yellow-400' }],
  'Kareem Abdul-Jabbar': [{ label: 'SKYHOOK', value: '99', color: 'bg-yellow-500' }, { label: 'MVPS', value: '6x', color: 'bg-amber-400' }, { label: 'RINGS', value: '6', color: 'bg-yellow-400' }],
  'Larry Bird': [{ label: 'CLUTCH', value: '99', color: 'bg-emerald-500' }, { label: 'MVPS', value: '3x', color: 'bg-amber-400' }, { label: 'RINGS', value: '3', color: 'bg-yellow-400' }],
  'Hakeem Olajuwon': [{ label: 'DREAM', value: '99', color: 'bg-red-500' }, { label: 'DPOY', value: '2x', color: 'bg-blue-500' }, { label: 'RINGS', value: '2', color: 'bg-yellow-400' }],
  'Tim Duncan': [{ label: 'FUNDAMENTAL', value: '99', color: 'bg-zinc-400' }, { label: 'FMVP', value: '3x', color: 'bg-amber-400' }, { label: 'RINGS', value: '5', color: 'bg-yellow-400' }],
  'Wilt Chamberlain': [{ label: '100-PTS', value: '99', color: 'bg-blue-500' }, { label: 'REB/G', value: '22.9', color: 'bg-zinc-300' }, { label: 'TITLES', value: '2', color: 'bg-yellow-400' }],
  'Bill Russell': [{ label: 'RINGS', value: '11', color: 'bg-emerald-500' }, { label: 'DEFENSE', value: '99', color: 'bg-emerald-400' }, { label: 'MVPS', value: '5x', color: 'bg-amber-400' }],
  'Dirk Nowitzki': [{ label: 'FADEAWAY', value: '99', color: 'bg-blue-500' }, { label: 'CHAMP', value: "'11", color: 'bg-amber-400' }, { label: 'FMVP', value: '1x', color: 'bg-yellow-400' }],
  'Dwyane Wade': [{ label: 'FLASH', value: '99', color: 'bg-red-500' }, { label: 'FMVP', value: "'06", color: 'bg-amber-400' }, { label: 'RINGS', value: '3', color: 'bg-yellow-400' }],
  'Giannis Antetokounmpo': [{ label: 'FREAK', value: '99', color: 'bg-emerald-500' }, { label: 'MVP', value: '2x', color: 'bg-amber-400' }, { label: 'DPOY', value: '1x', color: 'bg-blue-400' }],
  'Nikola Jokic': [{ label: 'TRIPLE-D', value: '99', color: 'bg-cyan-500' }, { label: 'MVP', value: '3x', color: 'bg-amber-400' }, { label: 'FMVP', value: '1x', color: 'bg-yellow-400' }],
  'Damian Lillard': [{ label: 'DAME-TIME', value: '99', color: 'bg-red-500' }, { label: 'CLUTCH', value: '99', color: 'bg-amber-400' }, { label: '3PT/G', value: '4.2', color: 'bg-blue-400' }],
  'Reggie Miller': [{ label: '8 IN 9s', value: '99', color: 'bg-yellow-500' }, { label: '3PT', value: '2560', color: 'bg-amber-400' }, { label: 'CLUTCH', value: '99', color: 'bg-red-400' }],
  'Patrick Ewing': [{ label: 'MSG-KING', value: '99', color: 'bg-orange-500' }, { label: 'DEF', value: '95', color: 'bg-blue-400' }, { label: 'ALL-NBA', value: '7x', color: 'bg-amber-400' }],
  'Paul Pierce': [{ label: 'THE TRUTH', value: '99', color: 'bg-emerald-500' }, { label: 'FMVP', value: "'08", color: 'bg-amber-400' }, { label: 'CLUTCH', value: '96', color: 'bg-yellow-400' }],
  'Ray Allen': [{ label: 'GAME 6', value: '99', color: 'bg-red-500' }, { label: '3PT', value: '2973', color: 'bg-amber-400' }, { label: 'RINGS', value: '2', color: 'bg-yellow-400' }],
  'Kyrie Irving': [{ label: 'GAME 7', value: '99', color: 'bg-red-500' }, { label: 'HANDLES', value: '99', color: 'bg-amber-400' }, { label: 'CHAMP', value: "'16", color: 'bg-yellow-400' }],
  'Kawhi Leonard': [{ label: 'THE BOUNCE', value: '99', color: 'bg-red-500' }, { label: 'FMVP', value: '2x', color: 'bg-amber-400' }, { label: 'DPOY', value: '2x', color: 'bg-blue-400' }],
  'Tracy McGrady': [{ label: '13 IN 33s', value: '99', color: 'bg-red-500' }, { label: 'SCORING', value: '2x', color: 'bg-amber-400' }, { label: 'CLUTCH', value: '98', color: 'bg-yellow-400' }],
  'Klay Thompson': [{ label: '37-PT QTR', value: '99', color: 'bg-amber-400' }, { label: '3PT/GAME', value: '14', color: 'bg-blue-400' }, { label: 'RINGS', value: '4', color: 'bg-yellow-400' }],
  'Vince Carter': [{ label: 'VINSANITY', value: '99', color: 'bg-purple-500' }, { label: 'DUNK', value: '2000', color: 'bg-amber-400' }, { label: 'YEARS', value: '22', color: 'bg-emerald-400' }],
  'Robert Horry': [{ label: 'BIG SHOT', value: '99', color: 'bg-yellow-500' }, { label: 'CLUTCH', value: '99', color: 'bg-amber-400' }, { label: 'RINGS', value: '7', color: 'bg-yellow-400' }],
  'Kevin Durant': [{ label: 'SLIM REAPER', value: '99', color: 'bg-emerald-500' }, { label: 'ROTY', value: "'08", color: 'bg-amber-400' }, { label: 'MVP', value: '1x', color: 'bg-yellow-400' }],
  'Luka Doncic': [{ label: 'MAGIC', value: '98', color: 'bg-blue-500' }, { label: 'ROTY', value: "'19", color: 'bg-amber-400' }, { label: 'TRIPLE-D', value: '77', color: 'bg-cyan-400' }],
  'Victor Wembanyama': [{ label: 'ALIEN', value: '99', color: 'bg-zinc-400' }, { label: 'HEIGHT', value: "7'4\"", color: 'bg-blue-400' }, { label: 'BLOCKS', value: '3.6', color: 'bg-emerald-400' }],
  'Allen Iverson': [{ label: 'CROSSOVER', value: '99', color: 'bg-blue-500' }, { label: 'ROTY', value: "'97", color: 'bg-red-400' }, { label: 'MVP', value: "'01", color: 'bg-amber-400' }],
  'Jeremy Lin': [{ label: 'LINSANITY', value: '99', color: 'bg-orange-500' }, { label: 'MSG PTS', value: '38', color: 'bg-blue-400' }, { label: 'CLUTCH', value: '95', color: 'bg-amber-400' }],
  'Derrick Rose': [{ label: 'SPEED', value: '99', color: 'bg-red-500' }, { label: 'YOUNG MVP', value: "'11", color: 'bg-amber-400' }, { label: '50-PT GAME', value: '99', color: 'bg-blue-400' }],
  'Alex Caruso': [{ label: 'AC FRESH', value: '99', color: 'bg-yellow-500' }, { label: 'DEFENSE', value: '94', color: 'bg-purple-500' }, { label: 'RING', value: "'20", color: 'bg-yellow-400' }],
  'Lance Stephenson': [{ label: 'AIR BLOW', value: '99', color: 'bg-yellow-500' }, { label: 'ENERGY', value: '95', color: 'bg-blue-500' }, { label: 'TRIPLE-D', value: '5x', color: 'bg-amber-400' }],
  'Boban Marjanovic': [{ label: 'HEIGHT', value: "7'4\"", color: 'bg-blue-500' }, { label: 'HEART', value: '99', color: 'bg-rose-500' }, { label: 'EFFICIENCY', value: '99', color: 'bg-amber-400' }],
  'Manu Ginobili': [{ label: 'EUROSTEP', value: '99', color: 'bg-zinc-400' }, { label: '6TH MAN', value: "'08", color: 'bg-amber-400' }, { label: 'RINGS', value: '4', color: 'bg-yellow-400' }],
  'Udonis Haslem': [{ label: 'CULTURE', value: '99', color: 'bg-red-600' }, { label: 'LOYALTY', value: '20y', color: 'bg-amber-400' }, { label: 'RINGS', value: '3', color: 'bg-yellow-400' }],
  'Patrick Beverley': [{ label: 'BEV-LOCK', value: '99', color: 'bg-blue-600' }, { label: 'ENERGY', value: '99', color: 'bg-red-500' }, { label: 'DEF-TEAM', value: '3x', color: 'bg-amber-400' }],
  'Jamal Crawford': [{ label: 'HANDLES', value: '99', color: 'bg-blue-500' }, { label: '6MOTY', value: '3x', color: 'bg-amber-400' }, { label: '50-PT 4 TMS', value: '99', color: 'bg-yellow-400' }],
  'Isaiah Thomas': [{ label: '4TH QTR', value: '99', color: 'bg-emerald-500' }, { label: '53-PTS', value: '99', color: 'bg-amber-400' }, { label: 'HEART', value: '99', color: 'bg-red-400' }],
  // Dynasty special stat lines
  '90s Chicago Bulls Dynasty': [{ label: 'RECORD', value: '72-10', color: 'bg-red-600' }, { label: 'RINGS', value: '6', color: 'bg-amber-400' }, { label: '3-PEAT', value: '2x', color: 'bg-yellow-400' }],
  'Golden State Warriors Dynasty': [{ label: 'RECORD', value: '73-9', color: 'bg-blue-600' }, { label: 'RINGS', value: '4', color: 'bg-amber-400' }, { label: 'SPLASH', value: '99', color: 'bg-yellow-400' }],
  'Showtime Lakers Dynasty': [{ label: 'SHOWTIME', value: '99', color: 'bg-purple-600' }, { label: 'RINGS', value: '5', color: 'bg-amber-400' }, { label: 'FASTBREAK', value: '99', color: 'bg-yellow-400' }],
  'Lakers Three-Peat Dynasty': [{ label: '3-PEAT', value: '3x', color: 'bg-purple-600' }, { label: '15-1 PO', value: '99', color: 'bg-amber-400' }, { label: 'DOMINANCE', value: '99', color: 'bg-yellow-400' }],
  'San Antonio Spurs Dynasty': [{ label: 'RINGS', value: '5', color: 'bg-zinc-500' }, { label: 'WIN %', value: '70%', color: 'bg-amber-400' }, { label: 'ERA', value: '3 DEC', color: 'bg-yellow-400' }],
  'Miami Heat Big Three Dynasty': [{ label: 'STREAK', value: '27W', color: 'bg-red-600' }, { label: 'RINGS', value: '2', color: 'bg-amber-400' }, { label: 'BIG 3', value: '99', color: 'bg-yellow-400' }],
  'Bad Boys Pistons Dynasty': [{ label: 'DEFENSE', value: '99', color: 'bg-blue-700' }, { label: 'RINGS', value: '2', color: 'bg-amber-400' }, { label: 'JORDAN RULES', value: '99', color: 'bg-red-600' }]
};

export const getPlayerSignatureStats = (name: string, playerId?: string) => {
  if (PLAYER_SIGNATURE_STATS[name]) return PLAYER_SIGNATURE_STATS[name];
  // Check substrings or dynasty names
  for (const [key, stats] of Object.entries(PLAYER_SIGNATURE_STATS)) {
    if (name.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(name.toLowerCase())) {
      return stats;
    }
  }
  return null;
};

const PLAYER_BASE_DATA: Record<string, any> = {
  'LeBron James': { position: 'SF', team: 'Cleveland Cavaliers', teamAbbr: 'CLE', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png', pts: 27.2, reb: 7.5, ast: 7.3, subtitle: '2003 ROOKIE PHENOM' },
  'Stephen Curry': { position: 'PG', team: 'Golden State Warriors', teamAbbr: 'GSW', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201939.png', pts: 30.1, reb: 5.4, ast: 6.7, subtitle: 'SPLASH BROTHER' },
  'Kobe Bryant': { position: 'SG', team: 'Los Angeles Lakers', teamAbbr: 'LAL', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/977.png', pts: 35.4, reb: 5.3, ast: 4.5, subtitle: 'BLACK MAMBA' },
  'Kevin Durant': { position: 'SF', team: 'Seattle SuperSonics', teamAbbr: 'SEA', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201142.png', pts: 32.0, reb: 7.4, ast: 5.5, subtitle: 'SLIM REAPER' },
  'Luka Doncic': { position: 'PG', team: 'Dallas Mavericks', teamAbbr: 'DAL', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1629029.png', pts: 33.9, reb: 9.2, ast: 9.8, subtitle: 'MAGIC MAGICIAN' },
  'Victor Wembanyama': { position: 'C', team: 'San Antonio Spurs', teamAbbr: 'SAS', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641705.png', pts: 21.4, reb: 10.6, ast: 3.9, subtitle: 'ALIEN PROSPECT' },
  'Allen Iverson': { position: 'PG', team: 'Philadelphia 76ers', teamAbbr: 'PHI', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/947.png', pts: 31.1, reb: 3.8, ast: 6.2, subtitle: 'THE ANSWER' },
  'Michael Jordan': { position: 'SG', team: 'Chicago Bulls', teamAbbr: 'CHI', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/893.png', pts: 35.0, reb: 5.5, ast: 5.9, subtitle: 'AIR JORDAN' },
  'Magic Johnson': { position: 'PG', team: 'Los Angeles Lakers', teamAbbr: 'LAL', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/77142.png', pts: 19.5, reb: 7.2, ast: 11.2, subtitle: 'SHOWTIME' },
  "Shaquille O'Neal": { position: 'C', team: 'Orlando Magic', teamAbbr: 'ORL', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/406.png', pts: 29.7, reb: 13.6, ast: 3.8, subtitle: 'MOST DOMINANT' },
  'Isaiah Thomas': { position: 'PG', team: 'Boston Celtics', teamAbbr: 'BOS', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202738.png', pts: 28.9, reb: 2.7, ast: 5.9, subtitle: 'KING IN THE 4TH' },
  'Alex Caruso': { position: 'PG', team: 'Los Angeles Lakers', teamAbbr: 'LAL', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1627936.png', pts: 12.5, reb: 3.8, ast: 4.2, subtitle: 'BALD MAMBA' },
  'Derrick Rose': { position: 'PG', team: 'Chicago Bulls', teamAbbr: 'CHI', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201565.png', pts: 25.0, reb: 4.1, ast: 7.7, subtitle: 'MVP REDEMPTION' },
  'Lance Stephenson': { position: 'SG', team: 'Indiana Pacers', teamAbbr: 'IND', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202362.png', pts: 13.8, reb: 7.2, ast: 4.6, subtitle: 'BORN READY' },
  'Boban Marjanovic': { position: 'C', team: 'Dallas Mavericks', teamAbbr: 'DAL', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1626246.png', pts: 12.8, reb: 8.2, ast: 1.8, subtitle: 'GENTLE GIANT' },
  'Manu Ginobili': { position: 'SG', team: 'San Antonio Spurs', teamAbbr: 'SAS', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1938.png', pts: 19.5, reb: 4.8, ast: 4.9, subtitle: '6TH MAN LEGEND' },
  'Udonis Haslem': { position: 'PF', team: 'Miami Heat', teamAbbr: 'MIA', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2617.png', pts: 12.0, reb: 9.0, ast: 1.4, subtitle: 'HEAT CULTURE' },
  'Patrick Beverley': { position: 'PG', team: 'LA Clippers', teamAbbr: 'LAC', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201976.png', pts: 12.2, reb: 5.9, ast: 4.2, subtitle: 'DEFENSIVE LOCK' },
  'Jamal Crawford': { position: 'SG', team: 'LA Clippers', teamAbbr: 'LAC', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2037.png', pts: 20.6, reb: 2.6, ast: 5.0, subtitle: 'SHAKE N BAKE' },
  'Jeremy Lin': { position: 'PG', team: 'New York Knicks', teamAbbr: 'NYK', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202391.png', pts: 22.5, reb: 3.8, ast: 8.7, subtitle: 'LINSANITY 2012' },
  'Kareem Abdul-Jabbar': { position: 'C', team: 'Los Angeles Lakers', teamAbbr: 'LAL', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76003.png', pts: 30.4, reb: 14.5, ast: 4.1, subtitle: 'SKYHOOK TITAN' },
  'Larry Bird': { position: 'SF', team: 'Boston Celtics', teamAbbr: 'BOS', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1449.png', pts: 28.1, reb: 9.2, ast: 7.6, subtitle: '3X MVP LEGEND' },
  'Hakeem Olajuwon': { position: 'C', team: 'Houston Rockets', teamAbbr: 'HOU', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/165.png', pts: 27.3, reb: 11.9, ast: 3.6, subtitle: 'DREAM SHAKE' },
  'Tim Duncan': { position: 'PF', team: 'San Antonio Spurs', teamAbbr: 'SAS', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1495.png', pts: 22.9, reb: 12.9, ast: 3.9, subtitle: 'BIG FUNDAMENTAL' },
  'Wilt Chamberlain': { position: 'C', team: 'Philadelphia 76ers', teamAbbr: 'PHI', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76375.png', pts: 50.4, reb: 25.7, ast: 2.4, subtitle: '100-POINT TITAN' },
  'Bill Russell': { position: 'C', team: 'Boston Celtics', teamAbbr: 'BOS', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/78049.png', pts: 18.9, reb: 23.6, ast: 4.5, subtitle: '11 RINGS CHAMPION' },
  'Dirk Nowitzki': { position: 'PF', team: 'Dallas Mavericks', teamAbbr: 'DAL', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1717.png', pts: 26.6, reb: 9.0, ast: 2.8, subtitle: '2011 CHAMPION' },
  'Dwyane Wade': { position: 'SG', team: 'Miami Heat', teamAbbr: 'MIA', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2548.png', pts: 30.2, reb: 5.0, ast: 7.5, subtitle: 'FLASH ICON' },
  'Giannis Antetokounmpo': { position: 'PF', team: 'Milwaukee Bucks', teamAbbr: 'MIL', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203507.png', pts: 31.1, reb: 11.8, ast: 5.7, subtitle: 'GREEK FREAK' },
  'Nikola Jokic': { position: 'C', team: 'Denver Nuggets', teamAbbr: 'DEN', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203999.png', pts: 26.4, reb: 12.4, ast: 9.0, subtitle: 'THE JOKER' },
  'Damian Lillard': { position: 'PG', team: 'Portland Trail Blazers', teamAbbr: 'POR', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203081.png', pts: 32.2, reb: 4.8, ast: 7.3, subtitle: 'DAME TIME' },
  'Reggie Miller': { position: 'SG', team: 'Indiana Pacers', teamAbbr: 'IND', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/397.png', pts: 24.6, reb: 3.6, ast: 3.8, subtitle: 'SHARPSHOOTER' },
  'Patrick Ewing': { position: 'C', team: 'New York Knicks', teamAbbr: 'NYK', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/121.png', pts: 28.6, reb: 10.9, ast: 2.2, subtitle: 'MSG WARRIOR' },
  'Paul Pierce': { position: 'SF', team: 'Boston Celtics', teamAbbr: 'BOS', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1718.png', pts: 26.8, reb: 6.9, ast: 4.8, subtitle: 'THE TRUTH' },
  'Ray Allen': { position: 'SG', team: 'Miami Heat', teamAbbr: 'MIA', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/951.png', pts: 26.4, reb: 4.5, ast: 4.1, subtitle: 'GAME 6 MIRACLE' },
  'Kyrie Irving': { position: 'PG', team: 'Cleveland Cavaliers', teamAbbr: 'CLE', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202681.png', pts: 25.2, reb: 3.2, ast: 5.8, subtitle: 'GAME 7 DAGGER' },
  'Kawhi Leonard': { position: 'SF', team: 'Toronto Raptors', teamAbbr: 'TOR', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202695.png', pts: 26.6, reb: 7.3, ast: 3.3, subtitle: 'GAME 7 BOUNCE' },
  'Tracy McGrady': { position: 'SG', team: 'Houston Rockets', teamAbbr: 'HOU', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1503.png', pts: 28.1, reb: 6.4, ast: 5.5, subtitle: '13 IN 33 SECONDS' },
  'Klay Thompson': { position: 'SG', team: 'Golden State Warriors', teamAbbr: 'GSW', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202691.png', pts: 22.3, reb: 3.8, ast: 2.3, subtitle: '37-PT QUARTER' },
  'Vince Carter': { position: 'SF', team: 'Toronto Raptors', teamAbbr: 'TOR', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1713.png', pts: 27.6, reb: 5.5, ast: 3.9, subtitle: 'VINSANITY 2000' },
  'Robert Horry': { position: 'PF', team: 'Los Angeles Lakers', teamAbbr: 'LAL', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/109.png', pts: 12.0, reb: 5.8, ast: 3.4, subtitle: 'BIG SHOT BOB' },
};

export const sbcService = {
  getDuplicates: (collection: Record<string, number>, allCards: Card[]) => {
    return allCards
      .filter(card => collection[card.id] > 1)
      .map(card => ({
        ...card,
        quantity: collection[card.id] - 1
      }));
  },

  isGroupCompleted: (group: SbcGroup, completedSbcs: string[] = []): boolean => {
    if (completedSbcs.includes(group.id)) return true;
    if (!group.segments || group.segments.length === 0) return false;
    return group.segments.every(seg => completedSbcs.includes(seg.id));
  },

  isSegmentCompleted: (segmentId: string, completedSbcs: string[] = [], groupId?: string): boolean => {
    if (completedSbcs.includes(segmentId)) return true;
    if (groupId && completedSbcs.includes(groupId)) return true;
    return false;
  },

  getGroupProgress: (group: SbcGroup, completedSbcs: string[] = []) => {
    const totalCount = group.segments?.length || 0;
    if (totalCount === 0) return { completedCount: 0, totalCount: 0, percentage: 0, isFinished: false };
    if (completedSbcs.includes(group.id)) {
      return { completedCount: totalCount, totalCount, percentage: 100, isFinished: true };
    }
    const completedCount = group.segments.filter(seg => completedSbcs.includes(seg.id)).length;
    const percentage = Math.round((completedCount / totalCount) * 100);
    const isFinished = completedCount === totalCount;
    return { completedCount, totalCount, percentage, isFinished };
  },

  checkRequirements: (cards: Card[], requirements: SbcRequirement[]) => {
    // Helper to get conference
    const getConf = (teamAbbr: string) => {
      const match = NBA_TEAMS.find(t => t.id === teamAbbr);
      return match ? match.conference : 'West';
    };

    const results = requirements.map(req => {
      let fulfilled = false;
      switch (req.type) {
        case 'TOTAL_CARDS':
          fulfilled = cards.length === req.value;
          break;
        case 'MIN_RARITY':
          fulfilled = cards.length > 0 && cards.every(c => (RARITY_ORDER[c.rarity] || 0) >= (RARITY_ORDER[req.value as string] || 0));
          break;
        case 'EXACT_RARITY': {
          const count = cards.filter(c => c.rarity === req.value).length;
          const targetCount = req.count !== undefined ? req.count : 1;
          fulfilled = count >= targetCount;
          break;
        }
        case 'POSITION': {
          const posCards = cards.filter(c => c.position === req.value && (req.minOvr ? c.stats.ovr >= req.minOvr : true));
          const targetCount = req.count !== undefined ? req.count : 1;
          fulfilled = posCards.length >= targetCount;
          break;
        }
        case 'MIN_OVR':
          fulfilled = cards.length > 0 && cards.every(c => c.stats.ovr >= req.value);
          break;
        case 'MAX_OVR': {
          const count = cards.filter(c => c.stats.ovr <= req.value).length;
          const targetCount = req.count !== undefined ? req.count : 1;
          fulfilled = count >= targetCount;
          break;
        }
        case 'UNIQUE_PLAYERS': {
          const names = new Set(cards.map(c => c.name));
          fulfilled = names.size === cards.length;
          break;
        }
        case 'TEAM_OVR_MIN': {
          const totalReq = requirements.find(r => r.type === 'TOTAL_CARDS');
          const totalSlots = totalReq ? totalReq.value : 5;
          const sumOvr = cards.reduce((sum, c) => sum + c.stats.ovr, 0);
          const avgOvr = cards.length > 0 ? sumOvr / totalSlots : 0;
          fulfilled = avgOvr >= req.value;
          break;
        }
        case 'SAME_TEAM_MIN': {
          if (cards.length === 0) {
            fulfilled = false;
          } else {
            const teamCounts: Record<string, number> = {};
            cards.forEach(c => {
              teamCounts[c.teamAbbr] = (teamCounts[c.teamAbbr] || 0) + 1;
            });
            const maxSameTeam = Math.max(0, ...Object.values(teamCounts));
            fulfilled = maxSameTeam >= req.value;
          }
          break;
        }
        case 'SAME_CONF_MIN': {
          if (cards.length === 0) {
            fulfilled = false;
          } else {
            const confCounts = { 'East': 0, 'West': 0 };
            cards.forEach(c => {
              const conf = getConf(c.teamAbbr);
              if (conf === 'East' || conf === 'West') {
                confCounts[conf]++;
              }
            });
            fulfilled = confCounts.East >= req.value || confCounts.West >= req.value;
          }
          break;
        }
        case 'MAX_TEAMS': {
          if (cards.length === 0) {
            fulfilled = true; // when empty, it represents 0 teams, which is <= req.value
          } else {
            const uniqueTeams = new Set(cards.map(c => c.teamAbbr));
            fulfilled = uniqueTeams.size <= req.value;
          }
          break;
        }
        case 'SPECIFIC_PLAYER_NAME': {
          const count = cards.filter(c => {
            let nameMatch = false;
            if (req.playersList && req.playersList.length > 0) {
              nameMatch = req.playersList.some(p => c.name.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(c.name.toLowerCase()));
            } else {
              const targetName = String(req.value).toLowerCase();
              nameMatch = c.name.toLowerCase().includes(targetName) || targetName.includes(c.name.toLowerCase());
            }
            if (!nameMatch) return false;
            if (req.minOvr && c.stats.ovr < req.minOvr) return false;
            
            if (req.edition) {
              const ed = req.edition.toLowerCase();
              const fullCardText = `${c.category || ''} ${c.subtitle || ''} ${c.description || ''} ${c.rarity || ''} ${c.name || ''} ${c.quote || ''}`.toLowerCase();
              if (ed.includes('finals mvp') || ed.includes('fmvp')) {
                const hasFmvp = c.category === 'Finals MVP' || fullCardText.includes('finals mvp') || fullCardText.includes('fmvp') || fullCardText.includes('finals');
                if (!hasFmvp) return false;
              } else if (ed.includes('mvp')) {
                const hasMvp = c.category === 'MVP' || c.category === 'All-Star MVP' || c.category === 'Finals MVP' || fullCardText.includes('mvp');
                if (!hasMvp) return false;
              }
            }
            return true;
          }).length;
          const targetCount = req.count !== undefined ? req.count : 1;
          fulfilled = count >= targetCount;
          break;
        }
        case 'SPECIFIC_TEAM': {
          const count = cards.filter(c => {
            let teamMatch = false;
            if (req.teamsList && req.teamsList.length > 0) {
              teamMatch = req.teamsList.some(t => c.teamAbbr?.toUpperCase() === t.toUpperCase() || c.team?.toLowerCase().includes(t.toLowerCase()));
            } else {
              const targetTeam = String(req.value).toUpperCase();
              teamMatch = c.teamAbbr?.toUpperCase() === targetTeam || c.team?.toLowerCase().includes(String(req.value).toLowerCase());
            }
            if (!teamMatch) return false;
            
            if (req.era) {
              const era = req.era.toLowerCase();
              const fullCardText = `${c.category || ''} ${c.subtitle || ''} ${c.description || ''} ${c.name || ''}`.toLowerCase();
              const parsedYear = c.year ? parseInt(String(c.year), 10) : NaN;
              if (era.includes('90')) {
                const is90s = (!isNaN(parsedYear) && parsedYear >= 1990 && parsedYear <= 1999) || c.isHistorical || fullCardText.includes('90') || fullCardText.includes('199');
                if (!is90s) return false;
              } else if (era.includes('2010') || era.includes('2020')) {
                const isModern = (!isNaN(parsedYear) && parsedYear >= 2010) || !c.isHistorical || fullCardText.includes('201') || fullCardText.includes('202') || fullCardText.includes('splash');
                if (!isModern) return false;
              } else if (era.includes('60')) {
                const is60s = (!isNaN(parsedYear) && parsedYear >= 1955 && parsedYear <= 1970) || c.isHistorical || fullCardText.includes('60') || fullCardText.includes('196');
                if (!is60s) return false;
              }
            }
            return true;
          }).length;
          const targetCount = req.count !== undefined ? req.count : (cards.length > 0 ? cards.length : 1);
          fulfilled = count >= targetCount;
          break;
        }
        case 'SPECIAL_CARDS_MIN': {
          const specialRarities = ['allstar', 'legend', 'franchise', 'award', 'fmvp', 'mvp', 'dpoy', 'roty', 'invincible', 'galaxy', 'legend_sbc', 'icon_sbc', 'moments_sbc', 'future_star', 'scoring_champ', 'hof', 'allnba_1st'];
          const count = cards.filter(c => {
            const isSpecial = specialRarities.includes(c.rarity) || c.category === 'Award' || c.category === 'Moment' || c.category === 'Duo' || c.category === 'X-Factor' || c.category === 'All-Star MVP' || c.category === 'Finals MVP';
            if (req.minOvr) {
              return c.stats.ovr >= req.minOvr;
            }
            return isSpecial;
          }).length;
          const targetCount = req.count !== undefined ? req.count : (req.value ?? 1);
          fulfilled = count >= targetCount;
          break;
        }
        case 'CATEGORY': {
          const targetCat = String(req.value).toLowerCase();
          const count = cards.filter(c => c.category?.toLowerCase() === targetCat || c.series?.toLowerCase().includes(targetCat)).length;
          const targetCount = req.count !== undefined ? req.count : 1;
          fulfilled = count >= targetCount;
          break;
        }
      }
      return { type: req.type, fulfilled };
    });

    return {
      allFulfilled: results.every(r => r.fulfilled),
      details: results
    };
  },

  generateRewardCard: (playerName: string, rarity: Rarity, targetOvr: number, allCards: Card[], customImageUrl?: string, playerId?: string): Card => {
    // Search in allCards first by playerId or by name
    const baseCard = (playerId ? allCards.find(c => c.id === playerId) : null) || allCards.find(c => c.name.toLowerCase() === playerName.toLowerCase());
    const meta = PLAYER_BASE_DATA[playerName];

    const finalPosition = meta?.position || baseCard?.position || 'SF';
    const finalTeam = meta?.team || baseCard?.team || 'NBA Stars';
    const finalTeamAbbr = meta?.teamAbbr || baseCard?.teamAbbr || 'NBA';
    const finalImg = customImageUrl || meta?.imageUrl || baseCard?.imageUrl || 'https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png';

    const finalOvr = Math.min(99, Math.max(80, targetOvr));
    
    // Position-appropriate realistic stat fallbacks if player not in meta or baseCard
    let finalPts = meta?.pts ?? baseCard?.pts;
    let finalReb = meta?.reb ?? baseCard?.reb;
    let finalAst = meta?.ast ?? baseCard?.ast;

    if (finalPts === undefined || (finalPts > 40 && finalPts !== 50.4)) {
      if (finalPosition === 'PG' || finalPosition === 'SG') {
        finalPts = 26.5; finalReb = 4.8; finalAst = 7.2;
      } else if (finalPosition === 'SF' || finalPosition === 'PF') {
        finalPts = 24.8; finalReb = 8.2; finalAst = 4.5;
      } else {
        finalPts = 21.4; finalReb = 11.6; finalAst = 2.8;
      }
    }

    const subtitleText = meta?.subtitle || baseCard?.subtitle || 'SBC REWARD SPECIAL';
    const lore = getLoreForPlayer(playerName);
    const signatureStats = getPlayerSignatureStats(playerName, playerId) || [
      { label: 'OVR', value: finalOvr, color: 'bg-amber-400' },
      { label: 'PTS', value: typeof finalPts === 'number' ? finalPts.toFixed(1) : finalPts, color: 'bg-amber-300' },
      { label: 'AST', value: typeof finalAst === 'number' ? finalAst.toFixed(1) : finalAst, color: 'bg-yellow-400' }
    ];

    let finalCategory = baseCard?.category || 'Base';
    const fanFavPlayers = ['Isaiah Thomas', 'Manu Ginobili', 'Jeremy Lin', 'Jamal Crawford', 'Alex Caruso', 'Lance Stephenson', 'Boban Marjanovic', 'Udonis Haslem', 'Patrick Beverley'];
    const clutchPlayers = ['Ray Allen', 'Kyrie Irving', 'Kawhi Leonard', 'Vince Carter', 'Derrick Rose', 'Robert Horry', 'Reggie Miller', 'Tracy McGrady', 'Klay Thompson'];
    const rookiePlayers = ['Victor Wembanyama', 'Luka Doncic', 'Kevin Durant'];

    if (playerName.toLowerCase().includes('dynasty') || (rarity === 'legend_sbc' && (playerName.includes('Bulls') || playerName.includes('Warriors') || playerName.includes('Lakers') || playerName.includes('Celtics') || playerName.includes('Spurs') || playerName.includes('Heat')))) {
      finalCategory = 'Dynasty';
    } else if (clutchPlayers.some(cp => playerName.toLowerCase().includes(cp.toLowerCase())) || rarity === 'moments_sbc') {
      finalCategory = 'Moment';
    } else if (fanFavPlayers.some(fp => playerName.toLowerCase().includes(fp.toLowerCase()))) {
      finalCategory = 'X-Factor';
    } else if (rarity === 'future_star' || rookiePlayers.some(rp => playerName.toLowerCase().includes(rp.toLowerCase()))) {
      finalCategory = 'ROY';
    } else if (rarity === 'legend_sbc' || ['Bill Russell', 'Wilt Chamberlain', 'Kareem Abdul-Jabbar', "Shaquille O'Neal", 'Hakeem Olajuwon', 'Larry Bird', 'Magic Johnson'].some(h => playerName.toLowerCase().includes(h.toLowerCase()))) {
      finalCategory = 'Hall of Fame';
    } else if (rarity === 'icon_sbc') {
      finalCategory = 'Base';
    }

    const rewardCard: Card = {
      ...(baseCard || {}),
      id: playerId || baseCard?.id || `sbc-${rarity}-${playerName.toLowerCase().replace(/\s+/g, '-')}-${finalOvr}`,
      number: baseCard?.number || 23,
      name: baseCard?.name || playerName,
      team: finalTeam,
      teamAbbr: finalTeamAbbr,
      teamColor: baseCard?.teamColor || '#F59E0B',
      position: finalPosition,
      rarity: rarity,
      category: finalCategory,
      subtitle: subtitleText,
      isHistorical: true,
      pts: finalPts,
      reb: finalReb,
      ast: finalAst,
      nbaId: baseCard?.nbaId || 2544,
      description: baseCard?.description || lore.englishContext,
      englishContext: baseCard?.englishContext || lore.englishContext,
      achievements: baseCard?.achievements || lore.achievements,
      quote: baseCard?.quote || lore.achievements[0] || 'SBC Challenge Champion',
      imageUrl: finalImg,
      isSpecialSBC: true,
      signatureStats,
      stats: {
        ovr: finalOvr,
        points: finalPts,
        rebounds: finalReb,
        assists: finalAst,
      }
    };

    if (finalCategory !== 'Moment') {
      delete rewardCard.momentTitle;
      delete rewardCard.momentDate;
    }

    return rewardCard;
  }
};
