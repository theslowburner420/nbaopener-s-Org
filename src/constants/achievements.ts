import { Trophy, Star, Zap, Shield, Crown, Gem, Flame, Target, Users, Coins, Calendar, History, Package, Award, Globe, TrendingUp, Wallet, Gift, Map, Crosshair, Activity, Layers, Eye } from 'lucide-react';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  category: 'packs' | 'collection' | 'specials';
  level: 'bronze' | 'silver' | 'gold' | 'diamond';
  requirement: (state: any, allCards: any[]) => boolean;
  getProgress: (state: any, allCards: any[]) => { current: number; total: number };
  reward: number;
  packReward?: {
    id: string;
    type: string;
    name: string;
  };
}

const TEAMS = [
  'Atlanta Hawks', 'Boston Celtics', 'Brooklyn Nets', 'Charlotte Hornets', 'Chicago Bulls',
  'Cleveland Cavaliers', 'Dallas Mavericks', 'Denver Nuggets', 'Detroit Pistons', 'Golden State Warriors',
  'Houston Rockets', 'Indiana Pacers', 'LA Clippers', 'Los Angeles Lakers', 'Memphis Grizzlies',
  'Miami Heat', 'Milwaukee Bucks', 'Minnesota Timberwolves', 'New Orleans Pelicans', 'New York Knicks',
  'Oklahoma City Thunder', 'Orlando Magic', 'Philadelphia 76ers', 'Phoenix Suns', 'Portland Trail Blazers',
  'Sacramento Kings', 'San Antonio Spurs', 'Toronto Raptors', 'Utah Jazz', 'Washington Wizards'
];

const PLAYERS = [
  'Michael Jordan', 'Kobe Bryant', 'LeBron James', 'Stephen Curry', 'Shaquille O\'Neal',
  'Magic Johnson', 'Larry Bird', 'Kareem Abdul-Jabbar', 'Wilt Chamberlain', 'Bill Russell',
  'Tim Duncan', 'Kevin Garnett', 'Dirk Nowitzki', 'Dwyane Wade', 'Allen Iverson',
  'Kevin Durant', 'Giannis Antetokounmpo', 'Nikola Jokic', 'Luka Doncic', 'Victor Wembanyama'
];

const getLevel = (reward: number): 'bronze' | 'silver' | 'gold' | 'diamond' => {
  if (reward >= 100000) return 'diamond';
  if (reward >= 25000) return 'gold';
  if (reward >= 5000) return 'silver';
  return 'bronze';
};

export const ACHIEVEMENTS: Achievement[] = [
  // --- OPENING MILESTONES (20) ---
  { 
    id: 'pack-1', title: 'First Step', description: 'Open your first pack.', icon: Package, category: 'packs', level: 'bronze',
    requirement: (state) => state.collection.length >= 5, 
    getProgress: (state) => ({ current: Math.min(state.collection.length, 5), total: 5 }),
    reward: 1000 
  },
  { 
    id: 'pack-5', title: 'Rookie Opener', description: 'Open 5 packs.', icon: Package, category: 'packs', level: 'bronze',
    requirement: (state) => state.collection.length >= 25, 
    getProgress: (state) => ({ current: Math.min(state.collection.length, 25), total: 25 }),
    reward: 2500 
  },
  { 
    id: 'pack-10', title: 'Regular Opener', description: 'Open 10 packs.', icon: Package, category: 'packs', level: 'silver',
    requirement: (state) => state.collection.length >= 50, 
    getProgress: (state) => ({ current: Math.min(state.collection.length, 50), total: 50 }),
    reward: 5000, packReward: { id: 'rookie-pack', type: 'rookie', name: 'Rookie Pack' } 
  },
  { 
    id: 'pack-25', title: 'Dedicated Opener', description: 'Open 25 packs.', icon: Package, category: 'packs', level: 'silver',
    requirement: (state) => state.collection.length >= 125, 
    getProgress: (state) => ({ current: Math.min(state.collection.length, 125), total: 125 }),
    reward: 10000 
  },
  { 
    id: 'pack-50', title: 'Pack Enthusiast', description: 'Open 50 packs.', icon: Package, category: 'packs', level: 'gold',
    requirement: (state) => state.collection.length >= 250, 
    getProgress: (state) => ({ current: Math.min(state.collection.length, 250), total: 250 }),
    reward: 25000, packReward: { id: 'allstar-pack', type: 'allstar', name: 'All-Star Pack' } 
  },
  { 
    id: 'pack-100', title: 'Pack Addict', description: 'Open 100 packs.', icon: Package, category: 'packs', level: 'gold',
    requirement: (state) => state.collection.length >= 500, 
    getProgress: (state) => ({ current: Math.min(state.collection.length, 500), total: 500 }),
    reward: 50000, packReward: { id: 'mvp-pack', type: 'mvp', name: 'MVP Pack' } 
  },
  { 
    id: 'pack-200', title: 'Bulk Buyer', description: 'Open 200 packs.', icon: Package, category: 'packs', level: 'gold',
    requirement: (state) => state.collection.length >= 1000, 
    getProgress: (state) => ({ current: Math.min(state.collection.length, 1000), total: 1000 }),
    reward: 100000 
  },
  { 
    id: 'pack-300', title: 'Crate Collector', description: 'Open 300 packs.', icon: Package, category: 'packs', level: 'diamond',
    requirement: (state) => state.collection.length >= 1500, 
    getProgress: (state) => ({ current: Math.min(state.collection.length, 1500), total: 1500 }),
    reward: 150000 
  },
  { 
    id: 'pack-400', title: 'Warehouse Manager', description: 'Open 400 packs.', icon: Package, category: 'packs', level: 'diamond',
    requirement: (state) => state.collection.length >= 2000, 
    getProgress: (state) => ({ current: Math.min(state.collection.length, 2000), total: 2000 }),
    reward: 200000 
  },
  { 
    id: 'pack-500', title: 'Halfway to a Thousand', description: 'Open 500 packs.', icon: Package, category: 'packs', level: 'diamond',
    requirement: (state) => state.collection.length >= 2500, 
    getProgress: (state) => ({ current: Math.min(state.collection.length, 2500), total: 2500 }),
    reward: 250000, packReward: { id: 'hof-pack', type: 'hof', name: 'HOF Pack' } 
  },
  { 
    id: 'pack-750', title: 'Three Quarters', description: 'Open 750 packs.', icon: Package, category: 'packs', level: 'diamond',
    requirement: (state) => state.collection.length >= 3750, 
    getProgress: (state) => ({ current: Math.min(state.collection.length, 3750), total: 3750 }),
    reward: 350000 
  },
  { 
    id: 'pack-1000', title: 'Millennial Opener', description: 'Open 1000 packs.', icon: Package, category: 'packs', level: 'diamond',
    requirement: (state) => state.collection.length >= 5000, 
    getProgress: (state) => ({ current: Math.min(state.collection.length, 5000), total: 5000 }),
    reward: 500000, packReward: { id: 'hof-pack', type: 'hof', name: 'HOF Pack' } 
  },
  { 
    id: 'pack-1500', title: 'Pack Veteran', description: 'Open 1500 packs.', icon: Package, category: 'packs', level: 'diamond',
    requirement: (state) => state.collection.length >= 7500, 
    getProgress: (state) => ({ current: Math.min(state.collection.length, 7500), total: 7500 }),
    reward: 750000 
  },
  { 
    id: 'pack-2000', title: 'Double Millennial', description: 'Open 2000 packs.', icon: Package, category: 'packs', level: 'diamond',
    requirement: (state) => state.collection.length >= 10000, 
    getProgress: (state) => ({ current: Math.min(state.collection.length, 10000), total: 10000 }),
    reward: 1000000 
  },
  { 
    id: 'pack-2500', title: 'Pack Legend', description: 'Open 2500 packs.', icon: Package, category: 'packs', level: 'diamond',
    requirement: (state) => state.collection.length >= 12500, 
    getProgress: (state) => ({ current: Math.min(state.collection.length, 12500), total: 12500 }),
    reward: 1250000 
  },
  { 
    id: 'pack-3000', title: 'Triple Millennial', description: 'Open 3000 packs.', icon: Package, category: 'packs', level: 'diamond',
    requirement: (state) => state.collection.length >= 15000, 
    getProgress: (state) => ({ current: Math.min(state.collection.length, 15000), total: 15000 }),
    reward: 1500000 
  },
  { 
    id: 'pack-3500', title: 'Pack Master', description: 'Open 3500 packs.', icon: Package, category: 'packs', level: 'diamond',
    requirement: (state) => state.collection.length >= 17500, 
    getProgress: (state) => ({ current: Math.min(state.collection.length, 17500), total: 17500 }),
    reward: 1750000 
  },
  { 
    id: 'pack-4000', title: 'Quadruple Millennial', description: 'Open 4000 packs.', icon: Package, category: 'packs', level: 'diamond',
    requirement: (state) => state.collection.length >= 20000, 
    getProgress: (state) => ({ current: Math.min(state.collection.length, 20000), total: 20000 }),
    reward: 2000000 
  },
  { 
    id: 'pack-4500', title: 'Pack God', description: 'Open 4500 packs.', icon: Package, category: 'packs', level: 'diamond',
    requirement: (state) => state.collection.length >= 22500, 
    getProgress: (state) => ({ current: Math.min(state.collection.length, 22500), total: 22500 }),
    reward: 2250000 
  },
  { 
    id: 'pack-5000', title: 'Ultimate Opener', description: 'Open 5000 packs.', icon: Package, category: 'packs', level: 'diamond',
    requirement: (state) => state.collection.length >= 25000, 
    getProgress: (state) => ({ current: Math.min(state.collection.length, 25000), total: 25000 }),
    reward: 5000000, packReward: { id: 'hof-pack', type: 'hof', name: 'HOF Pack' } 
  },

  // --- FRANCHISES (30) ---
  ...TEAMS.map(team => ({
    id: `team-master-static-${team.toLowerCase().replace(/ /g, '-')}`,
    title: `${team} Master`,
    description: `Complete the ${team} roster.`,
    icon: Users,
    category: 'collection' as const,
    level: 'silver' as const,
    requirement: (state: any, allCards: any[]) => {
      const ownedIds = new Set(state.collection);
      const teamCards = allCards.filter(c => c.team === team);
      return teamCards.length > 0 && teamCards.every(c => ownedIds.has(c.id));
    },
    getProgress: (state: any, allCards: any[]) => {
      const ownedIds = new Set(state.collection);
      const teamCards = allCards.filter(c => c.team === team);
      const owned = teamCards.filter(c => ownedIds.has(c.id)).length;
      return { current: owned, total: teamCards.length || 1 };
    },
    reward: 5000,
    packReward: { id: 'mvp-pack', type: 'mvp', name: 'MVP Pack' }
  })),

  // --- RARITIES (50) ---
  ...[10, 50, 100, 200, 300, 400, 500, 600, 800, 1000].map(count => ({
    id: `rarity-bench-${count}`, title: `Bench Warmer ${count}`, description: `Collect ${count} Bench rarity cards.`, icon: Shield,
    category: 'collection' as const,
    level: getLevel(count * 2),
    requirement: (state: any, allCards: any[]) => {
      const ownedIds = new Set(state.collection);
      return allCards.filter(c => c.rarity === 'bench' && ownedIds.has(c.id)).length >= count;
    },
    getProgress: (state: any, allCards: any[]) => {
      const ownedIds = new Set(state.collection);
      const countOwned = allCards.filter(c => c.rarity === 'bench' && ownedIds.has(c.id)).length;
      return { current: Math.min(countOwned, count), total: count };
    },
    reward: count * 10
  })),
  ...[10, 50, 100, 150, 200, 250, 300, 350, 400, 500].map(count => ({
    id: `rarity-starter-${count}`, title: `Starter Squad ${count}`, description: `Collect ${count} Starter rarity cards.`, icon: Target,
    category: 'collection' as const,
    level: getLevel(count * 5),
    requirement: (state: any, allCards: any[]) => {
      const ownedIds = new Set(state.collection);
      return allCards.filter(c => c.rarity === 'starter' && ownedIds.has(c.id)).length >= count;
    },
    getProgress: (state: any, allCards: any[]) => {
      const ownedIds = new Set(state.collection);
      const countOwned = allCards.filter(c => c.rarity === 'starter' && ownedIds.has(c.id)).length;
      return { current: Math.min(countOwned, count), total: count };
    },
    reward: count * 25
  })),
  ...[5, 10, 15, 20, 25, 30, 40, 50, 75, 100].map(count => ({
    id: `rarity-allstar-${count}`, title: `All-Star Elite ${count}`, description: `Collect ${count} All-Star rarity cards.`, icon: Star,
    category: 'collection' as const,
    level: getLevel(count * 20),
    requirement: (state: any, allCards: any[]) => {
      const ownedIds = new Set(state.collection);
      return allCards.filter(c => c.rarity === 'allstar' && ownedIds.has(c.id)).length >= count;
    },
    getProgress: (state: any, allCards: any[]) => {
      const ownedIds = new Set(state.collection);
      const countOwned = allCards.filter(c => c.rarity === 'allstar' && ownedIds.has(c.id)).length;
      return { current: Math.min(countOwned, count), total: count };
    },
    reward: count * 100
  })),
  ...[1, 2, 3, 4, 5, 10, 15, 20, 25, 50].map(count => ({
    id: `rarity-franchise-${count}`, title: `Franchise Face ${count}`, description: `Collect ${count} Franchise rarity cards.`, icon: Flame,
    category: 'collection' as const,
    level: getLevel(count * 100),
    requirement: (state: any, allCards: any[]) => {
      const ownedIds = new Set(state.collection);
      return allCards.filter(c => c.rarity === 'franchise' && ownedIds.has(c.id)).length >= count;
    },
    getProgress: (state: any, allCards: any[]) => {
      const ownedIds = new Set(state.collection);
      const countOwned = allCards.filter(c => c.rarity === 'franchise' && ownedIds.has(c.id)).length;
      return { current: Math.min(countOwned, count), total: count };
    },
    reward: count * 500
  })),
  ...[1, 2, 3, 4, 5, 10, 15, 20, 25, 30].map(count => ({
    id: `rarity-legend-${count}`, title: `Legendary Status ${count}`, description: `Collect ${count} Legend rarity cards.`, icon: Crown,
    category: 'collection' as const,
    level: getLevel(count * 500),
    requirement: (state: any, allCards: any[]) => {
      const ownedIds = new Set(state.collection);
      return allCards.filter(c => c.rarity === 'legend' && ownedIds.has(c.id)).length >= count;
    },
    getProgress: (state: any, allCards: any[]) => {
      const ownedIds = new Set(state.collection);
      const countOwned = allCards.filter(c => c.rarity === 'legend' && ownedIds.has(c.id)).length;
      return { current: Math.min(countOwned, count), total: count };
    },
    reward: count * 2500
  })),

  // --- HISTORICAL MOMENTS / PLAYERS (100) ---
  ...PLAYERS.flatMap(player => [
    {
      id: `player-${player.toLowerCase().replace(/ /g, '-')}-1`,
      title: `${player} Fan`,
      description: `Get your first ${player} card.`,
      icon: Target,
      category: 'specials' as const,
      level: 'bronze' as const,
      requirement: (state: any, allCards: any[]) => {
        const ownedIds = new Set(state.collection);
        return allCards.some(c => c.name.includes(player) && ownedIds.has(c.id));
      },
      getProgress: (state: any, allCards: any[]) => {
        const ownedIds = new Set(state.collection);
        const has = allCards.some(c => c.name.includes(player) && ownedIds.has(c.id));
        return { current: has ? 1 : 0, total: 1 };
      },
      reward: 2500
    },
    {
      id: `player-${player.toLowerCase().replace(/ /g, '-')}-2`,
      title: `${player} Collector`,
      description: `Get 3 different versions of ${player}.`,
      icon: Trophy,
      category: 'specials' as const,
      level: 'silver' as const,
      requirement: (state: any, allCards: any[]) => {
        const ownedIds = new Set(state.collection);
        return allCards.filter(c => c.name.includes(player) && ownedIds.has(c.id)).length >= 3;
      },
      getProgress: (state: any, allCards: any[]) => {
        const ownedIds = new Set(state.collection);
        const count = allCards.filter(c => c.name.includes(player) && ownedIds.has(c.id)).length;
        return { current: Math.min(count, 3), total: 3 };
      },
      reward: 7500
    },
    {
      id: `player-${player.toLowerCase().replace(/ /g, '-')}-3`,
      title: `${player} Legend`,
      description: `Get 5 different versions of ${player}.`,
      icon: Crown,
      category: 'specials' as const,
      level: 'gold' as const,
      requirement: (state: any, allCards: any[]) => {
        const ownedIds = new Set(state.collection);
        return allCards.filter(c => c.name.includes(player) && ownedIds.has(c.id)).length >= 5;
      },
      getProgress: (state: any, allCards: any[]) => {
        const ownedIds = new Set(state.collection);
        const count = allCards.filter(c => c.name.includes(player) && ownedIds.has(c.id)).length;
        return { current: Math.min(count, 5), total: 5 };
      },
      reward: 25000
    },
    {
      id: `player-${player.toLowerCase().replace(/ /g, '-')}-4`,
      title: `${player} Dynasty`,
      description: `Get a Dynasty card of ${player}.`,
      icon: Flame,
      category: 'specials' as const,
      level: 'gold' as const,
      requirement: (state: any, allCards: any[]) => {
        const ownedIds = new Set(state.collection);
        return allCards.some(c => c.name.includes(player) && c.category === 'Dynasty' && ownedIds.has(c.id));
      },
      getProgress: (state: any, allCards: any[]) => {
        const ownedIds = new Set(state.collection);
        const has = allCards.some(c => c.name.includes(player) && c.category === 'Dynasty' && ownedIds.has(c.id));
        return { current: has ? 1 : 0, total: 1 };
      },
      reward: 15000
    },
    {
      id: `player-${player.toLowerCase().replace(/ /g, '-')}-5`,
      title: `${player} MVP`,
      description: `Get an MVP card of ${player}.`,
      icon: Award,
      category: 'specials' as const,
      level: 'gold' as const,
      requirement: (state: any, allCards: any[]) => {
        const ownedIds = new Set(state.collection);
        return allCards.some(c => c.name.includes(player) && (c.category === 'Finals MVP' || c.category === 'All-Star MVP') && ownedIds.has(c.id));
      },
      getProgress: (state: any, allCards: any[]) => {
        const ownedIds = new Set(state.collection);
        const has = allCards.some(c => c.name.includes(player) && (c.category === 'Finals MVP' || c.category === 'All-Star MVP') && ownedIds.has(c.id));
        return { current: has ? 1 : 0, total: 1 };
      },
      reward: 12500
    }
  ])
];
