import { Trophy, Star, Zap, Shield, Crown, Gem, Flame, Target, Users, Coins, Calendar, History, Package } from 'lucide-react';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  requirement: (state: any, allCards: any[]) => boolean;
  reward: number;
  packReward?: {
    id: string;
    type: string;
    name: string;
  };
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-pick',
    title: 'First Pick',
    description: 'Abrir tu primer sobre.',
    icon: Zap,
    requirement: (state) => state.collection.length > 30, // 30 are coaches given at start
    reward: 100
  },
  {
    id: 'roster-builder',
    title: 'Roster Builder',
    description: 'Conseguir 15 jugadores de un mismo equipo.',
    icon: Users,
    requirement: (state, allCards) => {
      const ownedIds = new Set(state.collection);
      const teamCounts: Record<string, number> = {};
      allCards.forEach(c => {
        if (ownedIds.has(c.id) && c.category !== 'Coach') {
          teamCounts[c.team] = (teamCounts[c.team] || 0) + 1;
        }
      });
      return Object.values(teamCounts).some(count => count >= 15);
    },
    reward: 500,
    packReward: { id: 'allstar-pack', type: 'allstar', name: 'Silver Team Pack' }
  },
  {
    id: 'full-squad',
    title: 'The Full Squad',
    description: 'Completar una franquicia entera (Jugadores + Coach).',
    icon: Star,
    requirement: (state, allCards) => {
      const ownedIds = new Set(state.collection);
      const teams = Array.from(new Set(allCards.map(c => c.team)));
      return teams.some(team => {
        const teamCards = allCards.filter(c => c.team === team);
        return teamCards.every(c => ownedIds.has(c.id));
      });
    },
    reward: 1000,
    packReward: { id: 'mvp-pack', type: 'mvp', name: 'Special Edition Pack' }
  },
  {
    id: 'vintage-collector',
    title: 'Vintage Collector',
    description: 'Conseguir 5 cartas de "Historical Duos".',
    icon: History,
    requirement: (state, allCards) => {
      const ownedIds = new Set(state.collection);
      const historicalDuos = allCards.filter(c => c.category === 'Duo' && c.isHistorical && ownedIds.has(c.id));
      return historicalDuos.length >= 5;
    },
    reward: 1500
  },
  {
    id: 'dynasty-hunter',
    title: 'Dynasty Hunter',
    description: 'Desbloquear tu primera carta de Dinastía.',
    icon: Crown,
    requirement: (state, allCards) => {
      const ownedIds = new Set(state.collection);
      return allCards.some(c => c.category === 'Dynasty' && ownedIds.has(c.id));
    },
    reward: 2000
  },
  {
    id: 'pack-master',
    title: 'Pack Master',
    description: 'Completar 5 logros anteriores.',
    icon: Package,
    requirement: (state) => state.unlockedAchievements.length >= 5,
    reward: 0,
    packReward: { id: 'hof-pack', type: 'hof', name: 'Free HOF Pack' }
  },
  {
    id: 'collector-50',
    title: 'Rising Collector',
    description: 'Collect 50 unique cards',
    icon: Users,
    requirement: (state) => state.collection.length >= 50,
    reward: 500,
    packReward: { id: 'rookie-pack', type: 'rookie', name: 'Rookie Pack' }
  },
  {
    id: 'collector-100',
    title: 'Elite Scout',
    description: 'Collect 100 unique cards',
    icon: Target,
    requirement: (state) => state.collection.length >= 100,
    reward: 1000,
    packReward: { id: 'allstar-pack', type: 'allstar', name: 'All-Star Pack' }
  },
  {
    id: 'lucky-legend',
    title: 'Legendary Find',
    description: 'Find your first Legend rarity card',
    icon: Crown,
    requirement: (state, allCards) => {
      const ownedIds = new Set(state.collection);
      return allCards.some(c => c.rarity === 'legend' && ownedIds.has(c.id));
    },
    reward: 2000,
    packReward: { id: 'mvp-pack', type: 'mvp', name: 'MVP Pack' }
  },
  {
    id: 'all-star-squad',
    title: 'All-Star Squad',
    description: 'Collect 5 All-Star rarity cards',
    icon: Star,
    requirement: (state, allCards) => {
      const ownedIds = new Set(state.collection);
      const allStars = allCards.filter(c => c.rarity === 'allstar' && ownedIds.has(c.id));
      return allStars.length >= 5;
    },
    reward: 750
  },
  {
    id: 'dpoy-wall',
    title: 'The Wall',
    description: 'Find a Defensive Player of the Year card',
    icon: Shield,
    requirement: (state, allCards) => {
      const ownedIds = new Set(state.collection);
      return allCards.some(c => c.rarity === 'dpoy' && ownedIds.has(c.id));
    },
    reward: 1500
  },
  {
    id: 'coin-hoarder',
    title: 'Coin Hoarder',
    description: 'Accumulate 5,000 coins',
    icon: Coins,
    requirement: (state) => state.coins >= 5000,
    reward: 1000
  },
  {
    id: 'loyal-player',
    title: 'Perfect Week',
    description: 'Claim all 7 daily rewards',
    icon: Calendar,
    requirement: (state) => state.claimedDays.length >= 7,
    reward: 2500
  },
  {
    id: 'mythic-pull',
    title: 'Mythic Pull',
    description: 'Find a Franchise Player card',
    icon: Flame,
    requirement: (state, allCards) => {
      const ownedIds = new Set(state.collection);
      return allCards.some(c => c.rarity === 'franchise' && ownedIds.has(c.id));
    },
    reward: 3000,
    packReward: { id: 'mvp-pack', type: 'mvp', name: 'MVP Pack' }
  },
  {
    id: 'high-roller',
    title: 'High Roller',
    description: 'Accumulate 10,000 coins',
    icon: Coins,
    requirement: (state: any) => state.coins >= 10000,
    reward: 5000,
    packReward: { id: 'hof-pack', type: 'hof', name: 'HOF Pack' }
  },
  {
    id: 'roty-collector',
    title: 'Rookie Watch',
    description: 'Collect 5 Rookie of the Year cards',
    icon: Star,
    requirement: (state: any, allCards: any[]) => {
      const ownedIds = new Set(state.collection);
      const rotys = allCards.filter(c => c.rarity === 'roty' && ownedIds.has(c.id));
      return rotys.length >= 5;
    },
    reward: 2000,
    packReward: { id: 'rookie-pack', type: 'rookie', name: 'Rookie Pack' }
  },
  {
    id: 'dpoy-collector',
    title: 'Defensive Anchor',
    description: 'Collect 5 Defensive Player of the Year cards',
    icon: Shield,
    requirement: (state: any, allCards: any[]) => {
      const ownedIds = new Set(state.collection);
      const dpoys = allCards.filter(c => c.rarity === 'dpoy' && ownedIds.has(c.id));
      return dpoys.length >= 5;
    },
    reward: 2500,
    packReward: { id: 'mvp-pack', type: 'mvp', name: 'MVP Pack' }
  },
  {
    id: 'coach-collector',
    title: 'Mastermind Collector',
    description: 'Collect 15 Coach cards',
    icon: Users,
    requirement: (state: any, allCards: any[]) => {
      const ownedIds = new Set(state.collection);
      const coaches = allCards.filter(c => c.rarity === 'coach' && ownedIds.has(c.id));
      return coaches.length >= 15;
    },
    reward: 1000,
    packReward: { id: 'allstar-pack', type: 'allstar', name: 'All-Star Pack' }
  },
  {
    id: 'franchise-collector',
    title: 'Franchise Foundation',
    description: 'Collect 10 Franchise rarity cards',
    icon: Flame,
    requirement: (state: any, allCards: any[]) => {
      const ownedIds = new Set(state.collection);
      const franchise = allCards.filter(c => c.rarity === 'franchise' && ownedIds.has(c.id));
      return franchise.length >= 10;
    },
    reward: 3000,
    packReward: { id: 'hof-pack', type: 'hof', name: 'HOF Pack' }
  },
  {
    id: 'duo-collector',
    title: 'Dynamic Duo',
    description: 'Collect your first Duo card',
    icon: Users,
    requirement: (state: any, allCards: any[]) => {
      const ownedIds = new Set(state.collection);
      return allCards.some(c => c.category === 'Duo' && ownedIds.has(c.id));
    },
    reward: 1000,
    packReward: { id: 'allstar-pack', type: 'allstar', name: 'All-Star Pack' }
  },
  {
    id: 'duo-dynasty',
    title: 'Duo Dynasty',
    description: 'Collect 5 Duo cards',
    icon: Crown,
    requirement: (state: any, allCards: any[]) => {
      const ownedIds = new Set(state.collection);
      const duos = allCards.filter(c => c.category === 'Duo' && ownedIds.has(c.id));
      return duos.length >= 5;
    },
    reward: 2500,
    packReward: { id: 'mvp-pack', type: 'mvp', name: 'MVP Pack' }
  },
  {
    id: 'record-breaker',
    title: 'Record Breaker',
    description: 'Conseguir 5 cartas de "Season Record".',
    icon: Target,
    requirement: (state: any, allCards: any[]) => {
      const ownedIds = new Set(state.collection);
      const records = allCards.filter(c => c.id.startsWith('record-') && ownedIds.has(c.id));
      return records.length >= 5;
    },
    reward: 2500,
    packReward: { id: 'hof-pack', type: 'hof', name: 'HOF Pack' }
  }
];
