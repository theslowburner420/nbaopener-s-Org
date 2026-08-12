import { Card, SbcRequirement, Rarity } from '../types';
import { NBA_TEAMS } from '../data/nbaTeams';

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

const PLAYER_META: Record<string, { position: 'PG' | 'SG' | 'SF' | 'PF' | 'C'; team: string; teamAbbr: string; imageUrl: string }> = {
  'LeBron James': { position: 'SF', team: 'Cleveland Cavaliers', teamAbbr: 'CLE', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png' },
  'Stephen Curry': { position: 'PG', team: 'Golden State Warriors', teamAbbr: 'GSW', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201939.png' },
  'Kobe Bryant': { position: 'SG', team: 'Los Angeles Lakers', teamAbbr: 'LAL', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/977.png' },
  'Kevin Durant': { position: 'SF', team: 'Seattle SuperSonics', teamAbbr: 'SEA', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201142.png' },
  'Luka Doncic': { position: 'PG', team: 'Dallas Mavericks', teamAbbr: 'DAL', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1629029.png' },
  'Victor Wembanyama': { position: 'C', team: 'San Antonio Spurs', teamAbbr: 'SAS', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1641705.png' },
  'Allen Iverson': { position: 'PG', team: 'Philadelphia 76ers', teamAbbr: 'PHI', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/947.png' },
  'Michael Jordan': { position: 'SG', team: 'Chicago Bulls', teamAbbr: 'CHI', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/893.png' },
  'Magic Johnson': { position: 'PG', team: 'Los Angeles Lakers', teamAbbr: 'LAL', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/77142.png' },
  "Shaquille O'Neal": { position: 'C', team: 'Orlando Magic', teamAbbr: 'ORL', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/406.png' },
  'Isaiah Thomas': { position: 'PG', team: 'Boston Celtics', teamAbbr: 'BOS', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202738.png' },
  'Alex Caruso': { position: 'PG', team: 'Los Angeles Lakers', teamAbbr: 'LAL', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1627936.png' },
  'Derrick Rose': { position: 'PG', team: 'Chicago Bulls', teamAbbr: 'CHI', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201565.png' },
  'Lance Stephenson': { position: 'SG', team: 'Indiana Pacers', teamAbbr: 'IND', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202362.png' },
  'Boban Marjanovic': { position: 'C', team: 'Dallas Mavericks', teamAbbr: 'DAL', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1626246.png' },
  'Manu Ginobili': { position: 'SG', team: 'San Antonio Spurs', teamAbbr: 'SAS', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1938.png' },
  'Udonis Haslem': { position: 'PF', team: 'Miami Heat', teamAbbr: 'MIA', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2617.png' },
  'Patrick Beverley': { position: 'PG', team: 'LA Clippers', teamAbbr: 'LAC', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201976.png' },
  'Jamal Crawford': { position: 'SG', team: 'LA Clippers', teamAbbr: 'LAC', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2037.png' },
  'Jeremy Lin': { position: 'PG', team: 'New York Knicks', teamAbbr: 'NYK', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202391.png' },
  'Kareem Abdul-Jabbar': { position: 'C', team: 'Los Angeles Lakers', teamAbbr: 'LAL', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76003.png' },
  'Larry Bird': { position: 'SF', team: 'Boston Celtics', teamAbbr: 'BOS', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1449.png' },
  'Hakeem Olajuwon': { position: 'C', team: 'Houston Rockets', teamAbbr: 'HOU', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/165.png' },
  'Tim Duncan': { position: 'PF', team: 'San Antonio Spurs', teamAbbr: 'SAS', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1495.png' },
  'Wilt Chamberlain': { position: 'C', team: 'Philadelphia 76ers', teamAbbr: 'PHI', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/76375.png' },
  'Bill Russell': { position: 'C', team: 'Boston Celtics', teamAbbr: 'BOS', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/78049.png' },
  'Dirk Nowitzki': { position: 'PF', team: 'Dallas Mavericks', teamAbbr: 'DAL', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1717.png' },
  'Dwyane Wade': { position: 'SG', team: 'Miami Heat', teamAbbr: 'MIA', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2548.png' },
  'Giannis Antetokounmpo': { position: 'PF', team: 'Milwaukee Bucks', teamAbbr: 'MIL', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203507.png' },
  'Nikola Jokic': { position: 'C', team: 'Denver Nuggets', teamAbbr: 'DEN', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203999.png' },
  'Damian Lillard': { position: 'PG', team: 'Portland Trail Blazers', teamAbbr: 'POR', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/203081.png' },
  'Reggie Miller': { position: 'SG', team: 'Indiana Pacers', teamAbbr: 'IND', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/397.png' },
  'Patrick Ewing': { position: 'C', team: 'New York Knicks', teamAbbr: 'NYK', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/121.png' },
  'Paul Pierce': { position: 'SF', team: 'Boston Celtics', teamAbbr: 'BOS', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1718.png' },
  'Ray Allen': { position: 'SG', team: 'Miami Heat', teamAbbr: 'MIA', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/951.png' },
  'Kyrie Irving': { position: 'PG', team: 'Cleveland Cavaliers', teamAbbr: 'CLE', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202681.png' },
  'Kawhi Leonard': { position: 'SF', team: 'Toronto Raptors', teamAbbr: 'TOR', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202695.png' },
  'Tracy McGrady': { position: 'SG', team: 'Houston Rockets', teamAbbr: 'HOU', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1503.png' },
  'Klay Thompson': { position: 'SG', team: 'Golden State Warriors', teamAbbr: 'GSW', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/202691.png' },
  'Vince Carter': { position: 'SF', team: 'Toronto Raptors', teamAbbr: 'TOR', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1713.png' },
  'Robert Horry': { position: 'PF', team: 'Los Angeles Lakers', teamAbbr: 'LAL', imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/109.png' },
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
          const posCount = cards.filter(c => c.position === req.value).length;
          const targetCount = req.count !== undefined ? req.count : 1;
          fulfilled = posCount >= targetCount;
          break;
        }
        case 'MIN_OVR':
          fulfilled = cards.length > 0 && cards.every(c => c.stats.ovr >= req.value);
          break;
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
      }
      return { type: req.type, fulfilled };
    });

    return {
      allFulfilled: results.every(r => r.fulfilled),
      details: results
    };
  },

  generateRewardCard: (playerName: string, rarity: Rarity, targetOvr: number, allCards: Card[]): Card => {
    // Search in allCards first
    const baseCard = allCards.find(c => c.name.toLowerCase() === playerName.toLowerCase());
    const meta = PLAYER_META[playerName];

    const finalPosition = meta?.position || baseCard?.position || 'SF';
    const finalTeam = meta?.team || baseCard?.team || 'NBA Stars';
    const finalTeamAbbr = meta?.teamAbbr || baseCard?.teamAbbr || 'NBA';
    const finalImg = meta?.imageUrl || baseCard?.imageUrl || 'https://cdn.nba.com/headshots/nba/latest/1040x760/logoman.png';

    const finalOvr = Math.min(99, Math.max(80, targetOvr));
    const baseStat = Math.round(finalOvr * 0.94);

    return {
      ...(baseCard || {}),
      id: `sbc-${rarity}-${playerName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      number: baseCard?.number || 0,
      name: playerName,
      team: finalTeam,
      teamAbbr: finalTeamAbbr,
      teamColor: baseCard?.teamColor || '#F59E0B',
      position: finalPosition,
      rarity: rarity,
      category: 'Moment',
      subtitle: 'SBC Reward',
      isHistorical: true,
      pts: Math.min(99, baseStat + 3),
      reb: Math.min(99, baseStat),
      ast: Math.min(99, baseStat + 1),
      nbaId: baseCard?.nbaId || 2544,
      description: `Special SBC reward card for ${playerName}`,
      quote: 'SBC Challenge Winner',
      imageUrl: finalImg,
      isSpecialSBC: true,
      stats: {
        ovr: finalOvr,
        points: Math.min(99, baseStat + 3),
        rebounds: Math.min(99, baseStat),
        assists: Math.min(99, baseStat + 1),
      }
    };
  }
};
