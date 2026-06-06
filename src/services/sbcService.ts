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

  generateRewardCard: (playerName: string, rarity: Rarity, baseOvr: number, allCards: Card[]): Card => {
    // Try to find a base card for the player to copy visuals/team
    const baseCard = allCards.find(c => c.name === playerName) || allCards[0];
    
    const boostMap: Record<string, number> = {
      'future_star': 3,
      'moments_sbc': 5,
      'icon_sbc': 7,
      'legend_sbc': 10,
      'galaxy': 12,
      'invincible': 15
    };

    const boost = boostMap[rarity] || 0;
    const finalOvr = Math.min(99, baseOvr + boost);

    return {
      ...baseCard,
      id: `sbc-${rarity}-${baseCard.id}-${Date.now()}`,
      name: baseCard.name,
      rarity: rarity,
      isSpecialSBC: true,
      stats: {
        ...baseCard.stats,
        ovr: finalOvr,
        points: Math.min(99, baseCard.stats.points + boost),
        rebounds: Math.min(99, baseCard.stats.rebounds + boost),
        assists: Math.min(99, baseCard.stats.assists + boost),
      }
    };
  }
};
