import { Trophy, Users, Star, Crown, Flame, Zap, Target, Award } from 'lucide-react';

export interface AchievementReward {
  type: 'coins' | 'pack';
  amount?: number;
  packType?: string;
  packName?: string;
}

export interface Achievement {
  id: string;
  category: 'drafting' | 'tournaments' | 'matches';
  title: string;
  description: string;
  rewardText: string;
  rewards: AchievementReward[];
  icon: any;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Category A: Drafting
  {
    id: 'trust_the_process',
    category: 'drafting',
    title: 'Trust the Process',
    description: 'Completa tu primer HoopsDraft.',
    rewardText: '2.000 Coins',
    rewards: [{ type: 'coins', amount: 2000 }],
    icon: Users
  },
  {
    id: 'superteam',
    category: 'drafting',
    title: 'Superteam',
    description: 'Consigue armar un equipo con un OVR final de 92 o superior.',
    rewardText: '1 Pack MVP',
    rewards: [{ type: 'pack', packType: 'mvp', packName: 'Finals MVP Pack' }],
    icon: Star
  },
  {
    id: 'bench_mob',
    category: 'drafting',
    title: 'Bench Mob',
    description: 'Consigue que la media de tu banquillo sea de 85 OVR o superior.',
    rewardText: '5.000 Coins',
    rewards: [{ type: 'coins', amount: 5000 }],
    icon: Zap
  },
  {
    id: 'generational_talent',
    category: 'drafting',
    title: 'Generational Talent',
    description: 'Selecciona a un Capitán con 97+ de OVR.',
    rewardText: '1 Pack de Oro',
    rewards: [{ type: 'pack', packType: 'gold', packName: 'Gold Pack' }],
    icon: Crown
  },

  // Category B: Tournaments
  {
    id: 'summer_mvp',
    category: 'tournaments',
    title: 'Summer MVP',
    description: "Gana el torneo 'Summer League' por primera vez.",
    rewardText: '10.000 Coins',
    rewards: [{ type: 'coins', amount: 10000 }],
    icon: Trophy
  },
  {
    id: 'cup_champion',
    category: 'tournaments',
    title: 'Cup Champion',
    description: "Gana el torneo 'NBA Cup'.",
    rewardText: '1 Pack Leyenda',
    rewards: [{ type: 'pack', packType: 'legend', packName: 'Legend Pack' }],
    icon: Award
  },
  {
    id: 'ring_chaser',
    category: 'tournaments',
    title: 'Ring Chaser',
    description: "Gana el torneo 'NBA Playoffs'.",
    rewardText: '2 Packs Leyenda y 25.000 Coins',
    rewards: [
      { type: 'pack', packType: 'legend', packName: 'Legend Pack', amount: 2 },
      { type: 'coins', amount: 25000 }
    ],
    icon: Flame
  },
  {
    id: 'david_vs_goliath',
    category: 'tournaments',
    title: 'David vs Goliath',
    description: "Gana un partido en el torneo 'NBA Playoffs' usando un equipo con menos de 88 de OVR.",
    rewardText: 'Título Exclusivo y 15.000 Coins',
    rewards: [{ type: 'coins', amount: 15000 }], // Título is visual, we'll just give coins for now as requested
    icon: Target
  },

  // Category C: In-Match Feats
  {
    id: 'the_carry',
    category: 'matches',
    title: 'The Carry',
    description: 'Un jugador de tu equipo anota 40 o más puntos en un solo partido de simulación.',
    rewardText: '1 Pack MVP',
    rewards: [{ type: 'pack', packType: 'mvp', packName: 'Finals MVP Pack' }],
    icon: Flame
  },
  {
    id: 'floor_general',
    category: 'matches',
    title: 'Floor General',
    description: 'Un jugador de tu equipo reparte 15 o más asistencias en un partido.',
    rewardText: '5.000 Coins',
    rewards: [{ type: 'coins', amount: 5000 }],
    icon: Zap
  },
  {
    id: 'blowout',
    category: 'matches',
    title: 'Blowout',
    description: 'Gana cualquier partido de simulación por una diferencia de 20 puntos o más.',
    rewardText: '1 Pack de Oro',
    rewards: [{ type: 'pack', packType: 'gold', packName: 'Gold Pack' }],
    icon: Trophy
  },
  {
    id: 'clutch_time',
    category: 'matches',
    title: 'Clutch Time',
    description: 'Gana un partido por solo 1 o 2 puntos de diferencia.',
    rewardText: '3.000 Coins',
    rewards: [{ type: 'coins', amount: 3000 }],
    icon: Zap
  }
];
