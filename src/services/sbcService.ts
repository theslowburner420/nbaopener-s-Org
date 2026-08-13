import { Card, SbcRequirement, Rarity } from '../types';
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

const PLAYER_META: Record<string, PlayerStatMeta> = {
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

  generateRewardCard: (playerName: string, rarity: Rarity, targetOvr: number, allCards: Card[], customImageUrl?: string): Card => {
    // Search in allCards first
    const baseCard = allCards.find(c => c.name.toLowerCase() === playerName.toLowerCase());
    const meta = PLAYER_META[playerName];

    const finalPosition = meta?.position || baseCard?.position || 'SF';
    const finalTeam = meta?.team || baseCard?.team || 'NBA Stars';
    const finalTeamAbbr = meta?.teamAbbr || baseCard?.teamAbbr || 'NBA';
    const finalImg = customImageUrl || meta?.imageUrl || baseCard?.imageUrl || 'https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png';

    const finalOvr = Math.min(99, Math.max(80, targetOvr));
    
    // Position-appropriate realistic stat fallbacks if player not in meta or baseCard
    let finalPts = meta?.pts ?? baseCard?.pts;
    let finalReb = meta?.reb ?? baseCard?.reb;
    let finalAst = meta?.ast ?? baseCard?.ast;

    if (finalPts === undefined || finalPts > 40 && finalPts !== 50.4) {
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

    return {
      ...(baseCard || {}),
      id: `sbc-${rarity}-${playerName.toLowerCase().replace(/\s+/g, '-')}-${finalOvr}`,
      number: baseCard?.number || 23,
      name: playerName,
      team: finalTeam,
      teamAbbr: finalTeamAbbr,
      teamColor: baseCard?.teamColor || '#F59E0B',
      position: finalPosition,
      rarity: rarity,
      category: 'Moment',
      subtitle: subtitleText,
      isHistorical: true,
      pts: finalPts,
      reb: finalReb,
      ast: finalAst,
      nbaId: baseCard?.nbaId || 2544,
      description: lore.englishContext,
      englishContext: lore.englishContext,
      achievements: lore.achievements,
      quote: lore.achievements[0] || 'SBC Challenge Champion',
      imageUrl: finalImg,
      isSpecialSBC: true,
      stats: {
        ovr: finalOvr,
        points: finalPts,
        rebounds: finalReb,
        assists: finalAst,
      }
    };
  }
};
