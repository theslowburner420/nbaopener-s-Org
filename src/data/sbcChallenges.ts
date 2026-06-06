import { SbcChallenge } from '../types';

export const SBC_CHALLENGES: SbcChallenge[] = [
  {
    id: 'rookie-grind',
    name: 'ROOKIE GRIND',
    description: 'Exchange any 5 cards for a Future Star prospect.',
    difficulty: 'bronze',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 }
    ],
    reward: {
      playerName: 'Random Young Star',
      rarity: 'future_star',
      ovr: 78
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'bronze-pack-method',
    name: 'BRONZE PACK METHOD',
    description: 'Turn your commons into a defining moment.',
    difficulty: 'bronze',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 8 },
      { type: 'EXACT_RARITY', value: 'bench', count: 8 }
    ],
    reward: {
      playerName: 'Random Player',
      rarity: 'moments_sbc',
      ovr: 78
    },
    isActive: true,
    cardsRequired: 8
  },
  {
    id: 'backcourt-builders',
    name: 'BACKCOURT BUILDERS',
    description: 'Build a solid guard rotation.',
    difficulty: 'silver',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 4 },
      { type: 'POSITION', value: 'PG', count: 2 },
      { type: 'POSITION', value: 'SG', count: 2 },
      { type: 'MIN_RARITY', value: 'starter' },
      { type: 'MIN_OVR', value: 75 }
    ],
    reward: {
      playerName: 'Elite Guard',
      rarity: 'moments_sbc',
      ovr: 82
    },
    isActive: true,
    cardsRequired: 4
  },
  {
    id: 'frontcourt-force',
    name: 'FRONTCOURT FORCE',
    description: 'Power up your paint presence.',
    difficulty: 'silver',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 4 },
      { type: 'POSITION', value: 'PF', count: 2 },
      { type: 'POSITION', value: 'C', count: 2 },
      { type: 'MIN_RARITY', value: 'starter' },
      { type: 'MIN_OVR', value: 75 }
    ],
    reward: {
      playerName: 'Elite Big',
      rarity: 'moments_sbc',
      ovr: 82
    },
    isActive: true,
    cardsRequired: 4
  },
  {
    id: 'star-power',
    name: 'STAR POWER',
    description: 'Exchange All-Stars for an Iconic performance.',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 6 },
      { type: 'MIN_RARITY', value: 'allstar' },
      { type: 'UNIQUE_PLAYERS', value: true },
      { type: 'MIN_OVR', value: 80 }
    ],
    reward: {
      playerName: 'All-Star Icon',
      rarity: 'icon_sbc',
      ovr: 87
    },
    isActive: true,
    cardsRequired: 6
  },
  {
    id: 'elite-squad',
    name: 'ELITE SQUAD',
    description: 'The best of the best.',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 8 },
      { type: 'MIN_RARITY', value: 'franchise' },
      { type: 'UNIQUE_PLAYERS', value: true },
      { type: 'MIN_OVR', value: 82 }
    ],
    reward: {
      playerName: 'Superstar Icon',
      rarity: 'icon_sbc',
      ovr: 89
    },
    isActive: true,
    cardsRequired: 8
  },
  {
    id: 'franchise-collector',
    name: 'FRANCHISE COLLECTOR',
    description: 'Build a legendary team identity.',
    difficulty: 'elite',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'EXACT_RARITY', value: 'franchise', count: 5 },
      { type: 'UNIQUE_PLAYERS', value: true }
    ],
    reward: {
      playerName: 'Franchise Legend',
      rarity: 'legend_sbc',
      ovr: 92
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'legend-builder',
    name: 'LEGEND BUILDER',
    description: 'The path to immortality.',
    difficulty: 'elite',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 10 },
      { type: 'MIN_RARITY', value: 'allstar' },
      { type: 'UNIQUE_PLAYERS', value: true },
      { type: 'MIN_OVR', value: 85 }
    ],
    reward: {
      playerName: 'All-Time Legend',
      rarity: 'legend_sbc',
      ovr: 93
    },
    isActive: true,
    cardsRequired: 10
  },
  {
    id: 'galaxy-quest',
    name: 'GALAXY QUEST',
    description: 'Beyond the stars.',
    difficulty: 'legendary',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 8 },
      { type: 'EXACT_RARITY', value: 'franchise', count: 8 },
      { type: 'UNIQUE_PLAYERS', value: true },
      { type: 'MIN_OVR', value: 88 }
    ],
    reward: {
      playerName: 'Galaxy Opal Star',
      rarity: 'galaxy',
      ovr: 96
    },
    isActive: true,
    cardsRequired: 8
  },
  {
    id: 'the-invincible',
    name: 'THE INVINCIBLE',
    description: 'The ultimate challenge. Create the unguardable.',
    difficulty: 'legendary',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 10 },
      { type: 'EXACT_RARITY', value: 'franchise', count: 10 },
      { type: 'UNIQUE_PLAYERS', value: true },
      { type: 'MIN_OVR', value: 90 }
    ],
    reward: {
      playerName: 'Max OVR Invincible',
      rarity: 'invincible',
      ovr: 99
    },
    isActive: true,
    cardsRequired: 10
  },
  {
    id: 'mamba-mentality-sbc',
    name: 'MAMBA MENTALITY',
    description: 'Rinde homenaje a la leyenda de LA. Requiere jugadores estrella de la conferencia Oeste.',
    difficulty: 'legendary',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'TEAM_OVR_MIN', value: 85 },
      { type: 'SAME_TEAM_MIN', value: 2 },
      { type: 'SAME_CONF_MIN', value: 5 }
    ],
    reward: {
      playerName: 'Kobe Bryant',
      rarity: 'invincible',
      ovr: 96
    },
    isActive: true,
    cardsRequired: 5,
    slotPositions: ['PG', 'SG', 'SF', 'PF', 'C']
  },
  {
    id: 'splash-brothers-sbc',
    name: 'SPLASH BROS LEGACY',
    description: 'Une a los mejores tiradores del perímetro. Requiere una retaguardia potente.',
    difficulty: 'elite',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 3 },
      { type: 'TEAM_OVR_MIN', value: 83 },
      { type: 'POSITION', value: 'SG', count: 2 },
      { type: 'POSITION', value: 'PG', count: 1 }
    ],
    reward: {
      playerName: 'Stephen Curry',
      rarity: 'galaxy',
      ovr: 95
    },
    isActive: true,
    cardsRequired: 3,
    slotPositions: ['PG', 'SG', 'SG']
  },
  {
    id: 'showtime-lakers-sbc',
    name: 'SHOWTIME ERA',
    description: 'Construye un quinteto coordinado con jugadores únicos de conferencias distintas.',
    difficulty: 'legendary',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'TEAM_OVR_MIN', value: 86 },
      { type: 'MAX_TEAMS', value: 5 },
      { type: 'UNIQUE_PLAYERS', value: true }
    ],
    reward: {
      playerName: 'Magic Johnson',
      rarity: 'legend_sbc',
      ovr: 94
    },
    isActive: true,
    cardsRequired: 5,
    slotPositions: ['PG', 'SG', 'SF', 'PF', 'C']
  }
];
