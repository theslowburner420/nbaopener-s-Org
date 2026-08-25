import { SbcGroup, SbcChallenge } from '../types';

export const SBC_GROUPS: SbcGroup[] = [
  {
    id: 'sbc-group-dynasty-bulls-90s',
    name: 'Chicago Bulls 90s Dynasty',
    description: 'Complete all 3 squad challenges to unlock the legendary 99 OVR 90s Chicago Bulls Dynasty card.',
    category: 'dynasty',
    difficulty: 'legendary',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: '90s Chicago Bulls Dynasty',
      playerId: 'dynasty-chicago-bulls-90s',
      rarity: 'legend_sbc',
      ovr: 99,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbwj-hgQKWkuaeUfver4JjXddqzh0xuiwDY8EHeOi8gJR3q0as9ce16iBj&s=10'
    },
    segments: [
      {
        id: 'dynasty-bulls-seg-1',
        name: '90s Bulls Foundation',
        description: 'Submit 5 cards (PG, SG, SF, PF, C): Team OVR >= 85, min 5 Chicago Bulls 90s era cards.',
        cardsRequired: 5,
        slotPositions: ['PG', 'SG', 'SF', 'PF', 'C'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 5 },
          { type: 'TEAM_OVR_MIN', value: 85 },
          { type: 'SPECIFIC_TEAM', value: 'CHI', count: 5, era: '90s' }
        ],
        segmentReward: {
          type: 'both',
          coins: 3500,
          packType: 'duo_xfactor',
          packName: 'Dynamic Duo Pack',
          description: '3,500 Monedes + 1x Duo Pack'
        }
      },
      {
        id: 'dynasty-bulls-seg-2',
        name: 'Michael Jordan 1998 Finals MVP',
        description: 'Submit 1 card: Michael Jordan (Finals MVP 1998).',
        cardsRequired: 1,
        slotPositions: ['SG'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 1 },
          { type: 'SPECIFIC_PLAYER_NAME', value: 'Michael Jordan', edition: 'Finals MVP 1998', count: 1 }
        ],
        segmentReward: {
          type: 'both',
          coins: 7500,
          packType: 'allstar',
          packName: 'All-Star Pack',
          description: '7,500 Monedes + 1x All-Star Pack'
        }
      },
      {
        id: 'dynasty-bulls-seg-3',
        name: 'Championship Supporting Cast',
        description: 'Submit 3 cards (SF, PF, PG): Team OVR >= 88, min 2 of Pippen or Rodman (CHI).',
        cardsRequired: 3,
        slotPositions: ['SF', 'PF', 'PG'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 3 },
          { type: 'TEAM_OVR_MIN', value: 88 },
          { 
            type: 'SPECIFIC_PLAYER_NAME', 
            value: 'Scottie Pippen or Dennis Rodman', 
            count: 2, 
            playersList: ['Scottie Pippen', 'Dennis Rodman'] 
          },
          { type: 'SPECIFIC_TEAM', value: 'CHI', count: 2 }
        ],
        segmentReward: {
          type: 'both',
          coins: 12000,
          packType: 'mvp',
          packName: 'Finals MVP Pack',
          description: '12,000 Monedes + 1x Finals MVP Pack'
        }
      }
    ]
  },
  {
    id: 'sbc-group-dynasty-warriors-2015-2022',
    name: 'Warriors Dynasty 2015–2022',
    description: 'Complete all 3 squad challenges to unlock the 98 OVR Warriors Dynasty card.',
    category: 'dynasty',
    difficulty: 'legendary',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Warriors Dynasty 2015–2022',
      playerId: 'dynasty-warriors-2015-2022',
      rarity: 'legend_sbc',
      ovr: 98,
      imageUrl: 'https://a.espncdn.com/photo/2018/0608/r382973_608x342_16-9.jpg'
    },
    segments: [
      {
        id: 'dynasty-warriors-seg-1',
        name: 'Splash Era',
        description: 'Submit 5 cards (PG, SG, SF, PF, C): Team OVR >= 85, min 5 Golden State Warriors 2010s/2020s cards.',
        cardsRequired: 5,
        slotPositions: ['PG', 'SG', 'SF', 'PF', 'C'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 5 },
          { type: 'TEAM_OVR_MIN', value: 85 },
          { type: 'SPECIFIC_TEAM', value: 'GSW', count: 5, era: '2010s/2020s' }
        ],
        segmentReward: {
          type: 'both',
          coins: 3500,
          packType: 'allstar',
          packName: 'All-Star Pack',
          description: '3,500 Monedes + 1x All-Star Pack'
        }
      },
      {
        id: 'dynasty-warriors-seg-2',
        name: 'Stephen Curry Finals MVP 2022',
        description: 'Submit 1 card (PG): Stephen Curry (Finals MVP 2022).',
        cardsRequired: 1,
        slotPositions: ['PG'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 1 },
          { type: 'SPECIFIC_PLAYER_NAME', value: 'Stephen Curry', edition: 'Finals MVP 2022', count: 1 }
        ],
        segmentReward: {
          type: 'both',
          coins: 7500,
          packType: 'allstar',
          packName: 'All-Star Pack',
          description: '7,500 Monedes + 1x All-Star Pack'
        }
      },
      {
        id: 'dynasty-warriors-seg-3',
        name: 'Golden State Core',
        description: 'Submit 4 cards (SG, PF, SF, PG): Team OVR >= 87, min 4 GSW cards with Klay Thompson, Draymond Green or Andre Iguodala.',
        cardsRequired: 4,
        slotPositions: ['SG', 'PF', 'SF', 'PG'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 4 },
          { type: 'TEAM_OVR_MIN', value: 87 },
          { 
            type: 'SPECIFIC_PLAYER_NAME', 
            value: 'Klay Thompson, Draymond Green or Andre Iguodala', 
            count: 3, 
            playersList: ['Klay Thompson', 'Draymond Green', 'Andre Iguodala'] 
          },
          { type: 'SPECIFIC_TEAM', value: 'GSW', count: 4 }
        ],
        segmentReward: {
          type: 'both',
          coins: 10000,
          packType: 'mvp',
          packName: 'Finals MVP Pack',
          description: '10,000 Monedes + 1x Finals MVP Pack'
        }
      }
    ]
  },
  {
    id: 'sbc-group-hof-michael-jordan-1996',
    name: 'Michael Jordan 1996 Champion',
    description: 'Complete all 3 squad challenges to unlock 98 OVR Legend SBC Michael Jordan.',
    category: 'hof_legends',
    difficulty: 'legendary',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Michael Jordan',
      rarity: 'legend_sbc',
      ovr: 98,
      imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/893.png'
    },
    segments: [
      {
        id: 'hof-jordan-seg-1',
        name: 'Michael Jordan',
        description: 'Submit 1 card: Michael Jordan.',
        cardsRequired: 1,
        slotPositions: ['SG'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 1 },
          { type: 'SPECIFIC_PLAYER_NAME', value: 'Michael Jordan', count: 1 }
        ],
        segmentReward: {
          type: 'both',
          coins: 4000,
          packType: 'allstar',
          packName: 'All-Star Pack',
          description: '4,000 Monedes + 1x All-Star Pack'
        }
      },
      {
        id: 'hof-jordan-seg-2',
        name: 'Michael Jordan Finals MVP 1996',
        description: 'Submit 1 card: Michael Jordan (Finals MVP 1996).',
        cardsRequired: 1,
        slotPositions: ['SG'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 1 },
          { type: 'SPECIFIC_PLAYER_NAME', value: 'Michael Jordan', edition: 'Finals MVP 1996', count: 1 }
        ],
        segmentReward: {
          type: 'both',
          coins: 8000,
          packType: 'allstar',
          packName: 'All-Star Pack',
          description: '8,000 Monedes + 1x All-Star Pack'
        }
      },
      {
        id: 'hof-jordan-seg-3',
        name: 'Plantilla Chicago Bulls',
        description: 'Submit 3 cards (SG, SF, PF): Team OVR >= 86, min 3 Chicago Bulls cards.',
        cardsRequired: 3,
        slotPositions: ['SG', 'SF', 'PF'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 3 },
          { type: 'TEAM_OVR_MIN', value: 86 },
          { type: 'SPECIFIC_TEAM', value: 'CHI', count: 3 }
        ],
        segmentReward: {
          type: 'both',
          coins: 15000,
          packType: 'mvp',
          packName: 'Finals MVP & Awards Pack',
          description: '15,000 Monedes + 1x Finals MVP Pack'
        }
      }
    ]
  },
  {
    id: 'sbc-group-hof-kobe-bryant-81pts',
    name: 'Kobe Bryant 81-Point Master',
    description: 'Complete all 3 squad challenges to unlock 97 OVR Legend SBC Kobe Bryant.',
    category: 'hof_legends',
    difficulty: 'legendary',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Kobe Bryant',
      rarity: 'legend_sbc',
      ovr: 97,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS2j9T_I8bFC3KvEn7km58G51B0h5dhsroc7vbGgFO8og&s=10'
    },
    segments: [
      {
        id: 'hof-kobe-seg-1',
        name: 'Kobe Bryant',
        description: 'Submit 1 card: Kobe Bryant.',
        cardsRequired: 1,
        slotPositions: ['SG'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 1 },
          { type: 'SPECIFIC_PLAYER_NAME', value: 'Kobe Bryant', count: 1 }
        ],
        segmentReward: {
          type: 'both',
          coins: 4000,
          packType: 'allstar',
          packName: 'All-Star Pack',
          description: '4,000 Monedes + 1x All-Star Pack'
        }
      },
      {
        id: 'hof-kobe-seg-2',
        name: 'Kobe Bryant MVP',
        description: 'Submit 1 card: Kobe Bryant MVP.',
        cardsRequired: 1,
        slotPositions: ['SG'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 1 },
          { type: 'SPECIFIC_PLAYER_NAME', value: 'Kobe Bryant', edition: 'MVP', count: 1 }
        ],
        segmentReward: {
          type: 'both',
          coins: 8000,
          packType: 'allstar',
          packName: 'All-Star Pack',
          description: '8,000 Monedes + 1x All-Star Pack'
        }
      },
      {
        id: 'hof-kobe-seg-3',
        name: 'Plantilla Los Angeles Lakers',
        description: 'Submit 3 cards (SG, SF, C): Team OVR >= 85, min 3 Los Angeles Lakers cards.',
        cardsRequired: 3,
        slotPositions: ['SG', 'SF', 'C'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 3 },
          { type: 'TEAM_OVR_MIN', value: 85 },
          { type: 'SPECIFIC_TEAM', value: 'LAL', count: 3 }
        ],
        segmentReward: {
          type: 'both',
          coins: 15000,
          packType: 'mvp',
          packName: 'Finals MVP & Awards Pack',
          description: '15,000 Monedes + 1x Finals MVP Pack'
        }
      }
    ]
  },
  {
    id: 'sbc-group-hof-kareem-skyhook',
    name: 'Kareem Skyhook Titan',
    description: 'Complete all 3 squad challenges to unlock 97 OVR Legend SBC Kareem Abdul-Jabbar.',
    category: 'hof_legends',
    difficulty: 'legendary',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Kareem Abdul-Jabbar',
      rarity: 'legend_sbc',
      ovr: 97,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRID8uPzWcjh7zfvj9k4qLQdqVuUpgfP4wnYnCtwU5TVQ&s=10'
    },
    segments: [
      {
        id: 'hof-kareem-seg-1',
        name: 'Kareem Abdul-Jabbar',
        description: 'Submit 1 card: Kareem Abdul-Jabbar.',
        cardsRequired: 1,
        slotPositions: ['C'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 1 },
          { type: 'SPECIFIC_PLAYER_NAME', value: 'Kareem Abdul-Jabbar', count: 1 }
        ],
        segmentReward: {
          type: 'both',
          coins: 4000,
          packType: 'allstar',
          packName: 'All-Star Pack',
          description: '4,000 Monedes + 1x All-Star Pack'
        }
      },
      {
        id: 'hof-kareem-seg-2',
        name: 'Kareem Finals MVP',
        description: 'Submit 1 card: Kareem Abdul-Jabbar (Finals MVP).',
        cardsRequired: 1,
        slotPositions: ['C'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 1 },
          { type: 'SPECIFIC_PLAYER_NAME', value: 'Kareem Abdul-Jabbar', edition: 'Finals MVP', count: 1 }
        ],
        segmentReward: {
          type: 'both',
          coins: 8000,
          packType: 'allstar',
          packName: 'All-Star Pack',
          description: '8,000 Monedes + 1x All-Star Pack'
        }
      },
      {
        id: 'hof-kareem-seg-3',
        name: 'Plantilla Lakers / Bucks',
        description: 'Submit 3 cards (C, PG, PF): Team OVR >= 86, min 3 Los Angeles Lakers or Milwaukee Bucks cards.',
        cardsRequired: 3,
        slotPositions: ['C', 'PG', 'PF'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 3 },
          { type: 'TEAM_OVR_MIN', value: 86 },
          { 
            type: 'SPECIFIC_TEAM', 
            value: 'LAL or MIL', 
            count: 3, 
            teamsList: ['LAL', 'MIL'] 
          }
        ],
        segmentReward: {
          type: 'both',
          coins: 15000,
          packType: 'mvp',
          packName: 'Finals MVP & Awards Pack',
          description: '15,000 Monedes + 1x Finals MVP Pack'
        }
      }
    ]
  },
  {
    id: 'sbc-group-hof-larry-bird',
    name: 'Larry Bird 3x MVP Legend',
    description: 'Complete both squad challenges to unlock 96 OVR Legend SBC Larry Bird.',
    category: 'hof_legends',
    difficulty: 'legendary',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Larry Bird',
      rarity: 'legend_sbc',
      ovr: 96,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ0THNsE9tWM1-Bcm-g8mE1on9kuhUxX6Is-AtDFmSPPA&s=10'
    },
    segments: [
      {
        id: 'hof-bird-seg-1',
        name: 'Larry Bird',
        description: 'Submit 1 card: Larry Bird.',
        cardsRequired: 1,
        slotPositions: ['SF'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 1 },
          { type: 'SPECIFIC_PLAYER_NAME', value: 'Larry Bird', count: 1 }
        ],
        segmentReward: {
          type: 'both',
          coins: 4000,
          packType: 'allstar',
          packName: 'All-Star Pack',
          description: '4,000 Monedes + 1x All-Star Pack'
        }
      },
      {
        id: 'hof-bird-seg-2',
        name: 'Plantilla Boston Celtics',
        description: 'Submit 3 cards (SF, PF, PG): Team OVR >= 85, min 3 Boston Celtics cards.',
        cardsRequired: 3,
        slotPositions: ['SF', 'PF', 'PG'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 3 },
          { type: 'TEAM_OVR_MIN', value: 85 },
          { type: 'SPECIFIC_TEAM', value: 'BOS', count: 3 }
        ],
        segmentReward: {
          type: 'both',
          coins: 12000,
          packType: 'mvp',
          packName: 'Finals MVP & Awards Pack',
          description: '12,000 Monedes + 1x Finals MVP Pack'
        }
      }
    ]
  },
  {
    id: 'sbc-group-hof-magic-johnson',
    name: 'Magic Johnson Showtime Titan',
    description: 'Complete both squad challenges to unlock 96 OVR Legend SBC Magic Johnson.',
    category: 'hof_legends',
    difficulty: 'legendary',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Magic Johnson',
      rarity: 'legend_sbc',
      ovr: 96,
      imageUrl: 'https://wallpapers.com/images/hd/magic-johnson-golden-art-2gfb0a8ly81nbgp2.jpg'
    },
    segments: [
      {
        id: 'hof-magic-seg-1',
        name: 'Magic Johnson',
        description: 'Submit 1 card: Magic Johnson.',
        cardsRequired: 1,
        slotPositions: ['PG'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 1 },
          { type: 'SPECIFIC_PLAYER_NAME', value: 'Magic Johnson', count: 1 }
        ],
        segmentReward: {
          type: 'both',
          coins: 4000,
          packType: 'allstar',
          packName: 'All-Star Pack',
          description: '4,000 Monedes + 1x All-Star Pack'
        }
      },
      {
        id: 'hof-magic-seg-2',
        name: 'Showtime Lakers',
        description: 'Submit 3 cards (PG, SG, C): Team OVR >= 85, min 3 Los Angeles Lakers cards.',
        cardsRequired: 3,
        slotPositions: ['PG', 'SG', 'C'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 3 },
          { type: 'TEAM_OVR_MIN', value: 85 },
          { type: 'SPECIFIC_TEAM', value: 'LAL', count: 3 }
        ],
        segmentReward: {
          type: 'both',
          coins: 12000,
          packType: 'mvp',
          packName: 'Finals MVP & Awards Pack',
          description: '12,000 Monedes + 1x Finals MVP Pack'
        }
      }
    ]
  },
  {
    id: 'sbc-group-hof-hakeem-olajuwon',
    name: 'Hakeem Olajuwon Dream Shake',
    description: 'Complete both squad challenges to unlock 96 OVR Legend SBC Hakeem Olajuwon.',
    category: 'hof_legends',
    difficulty: 'legendary',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Hakeem Olajuwon',
      rarity: 'legend_sbc',
      ovr: 96,
      imageUrl: 'https://wp.theringer.com/wp-content/uploads/2024/10/DreamShakeExcerpt_Getty_Ringer.jpg'
    },
    segments: [
      {
        id: 'hof-hakeem-seg-1',
        name: 'Hakeem Olajuwon',
        description: 'Submit 1 card: Hakeem Olajuwon.',
        cardsRequired: 1,
        slotPositions: ['C'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 1 },
          { type: 'SPECIFIC_PLAYER_NAME', value: 'Hakeem Olajuwon', count: 1 }
        ],
        segmentReward: {
          type: 'both',
          coins: 4000,
          packType: 'allstar',
          packName: 'All-Star Pack',
          description: '4,000 Monedes + 1x All-Star Pack'
        }
      },
      {
        id: 'hof-hakeem-seg-2',
        name: 'Houston Rockets Championship Squad',
        description: 'Submit 3 cards (C, SG, SF): Team OVR >= 85, min 3 Houston Rockets cards.',
        cardsRequired: 3,
        slotPositions: ['C', 'SG', 'SF'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 3 },
          { type: 'TEAM_OVR_MIN', value: 85 },
          { type: 'SPECIFIC_TEAM', value: 'HOU', count: 3 }
        ],
        segmentReward: {
          type: 'both',
          coins: 12000,
          packType: 'mvp',
          packName: 'Finals MVP & Awards Pack',
          description: '12,000 Monedes + 1x Finals MVP Pack'
        }
      }
    ]
  },
  {
    id: 'sbc-group-hof-tim-duncan',
    name: 'Tim Duncan Big Fundamental',
    description: 'Complete both squad challenges to unlock 96 OVR Legend SBC Tim Duncan.',
    category: 'hof_legends',
    difficulty: 'legendary',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Tim Duncan',
      rarity: 'legend_sbc',
      ovr: 96,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKhOZuO6XB33_azKlUkW7ujNttsi0mTwnPaWqMgOtG4A&s=10'
    },
    segments: [
      {
        id: 'hof-duncan-seg-1',
        name: 'Tim Duncan',
        description: 'Submit 1 card: Tim Duncan.',
        cardsRequired: 1,
        slotPositions: ['PF'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 1 },
          { type: 'SPECIFIC_PLAYER_NAME', value: 'Tim Duncan', count: 1 }
        ],
        segmentReward: {
          type: 'both',
          coins: 4000,
          packType: 'allstar',
          packName: 'All-Star Pack',
          description: '4,000 Monedes + 1x All-Star Pack'
        }
      },
      {
        id: 'hof-duncan-seg-2',
        name: 'San Antonio Spurs Dynasty',
        description: 'Submit 3 cards (PF, PG, SG): Team OVR >= 85, min 3 San Antonio Spurs cards.',
        cardsRequired: 3,
        slotPositions: ['PF', 'PG', 'SG'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 3 },
          { type: 'TEAM_OVR_MIN', value: 85 },
          { type: 'SPECIFIC_TEAM', value: 'SAS', count: 3 }
        ],
        segmentReward: {
          type: 'both',
          coins: 12000,
          packType: 'mvp',
          packName: 'Finals MVP & Awards Pack',
          description: '12,000 Monedes + 1x Finals MVP Pack'
        }
      }
    ]
  },
  {
    id: 'sbc-group-hof-wilt-chamberlain',
    name: 'Wilt Chamberlain 100-Point Titan',
    description: 'Complete all 3 squad challenges to unlock 97 OVR Legend SBC Wilt Chamberlain.',
    category: 'hof_legends',
    difficulty: 'legendary',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Wilt Chamberlain',
      rarity: 'legend_sbc',
      ovr: 97,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRt7dAV8LiDmKQYTcxSF3HyWABv39TxUOMMLFCnuBolUw&s=10'
    },
    segments: [
      {
        id: 'hof-wilt-seg-1',
        name: 'Wilt Chamberlain',
        description: 'Submit 1 card: Wilt Chamberlain.',
        cardsRequired: 1,
        slotPositions: ['C'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 1 },
          { type: 'SPECIFIC_PLAYER_NAME', value: 'Wilt Chamberlain', count: 1 }
        ],
        segmentReward: {
          type: 'both',
          coins: 4000,
          packType: 'allstar',
          packName: 'All-Star Pack',
          description: '4,000 Monedes + 1x All-Star Pack'
        }
      },
      {
        id: 'hof-wilt-seg-2',
        name: 'Wilt Chamberlain MVP',
        description: 'Submit 1 card: Wilt Chamberlain MVP.',
        cardsRequired: 1,
        slotPositions: ['C'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 1 },
          { type: 'SPECIFIC_PLAYER_NAME', value: 'Wilt Chamberlain', edition: 'MVP', count: 1 }
        ],
        segmentReward: {
          type: 'both',
          coins: 8000,
          packType: 'allstar',
          packName: 'All-Star Pack',
          description: '8,000 Monedes + 1x All-Star Pack'
        }
      },
      {
        id: 'hof-wilt-seg-3',
        name: 'Historic Dominance',
        description: 'Submit 3 cards (C, PG, SF): Team OVR >= 91.',
        cardsRequired: 3,
        slotPositions: ['C', 'PG', 'SF'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 3 },
          { type: 'TEAM_OVR_MIN', value: 91 }
        ],
        segmentReward: {
          type: 'both',
          coins: 15000,
          packType: 'mvp',
          packName: 'Finals MVP & Awards Pack',
          description: '15,000 Monedes + 1x Finals MVP Pack'
        }
      }
    ]
  },
  {
    id: 'sbc-group-hof-bill-russell',
    name: 'Bill Russell 11 Rings Champion',
    description: 'Complete both squad challenges to unlock 96 OVR Legend SBC Bill Russell.',
    category: 'hof_legends',
    difficulty: 'legendary',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Bill Russell',
      rarity: 'legend_sbc',
      ovr: 96,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQMOqmF3NP4rkAiGi0UDJ_aZolCevZo3EAD8cs3Mar5bQ&s=10'
    },
    segments: [
      {
        id: 'hof-russell-seg-1',
        name: 'Bill Russell',
        description: 'Submit 1 card: Bill Russell.',
        cardsRequired: 1,
        slotPositions: ['C'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 1 },
          { type: 'SPECIFIC_PLAYER_NAME', value: 'Bill Russell', count: 1 }
        ],
        segmentReward: {
          type: 'both',
          coins: 4000,
          packType: 'allstar',
          packName: 'All-Star Pack',
          description: '4,000 Monedes + 1x All-Star Pack'
        }
      },
      {
        id: 'hof-russell-seg-2',
        name: '60s Celtics Dynasty',
        description: 'Submit 3 cards (C, PG, SG): Team OVR >= 85, min 3 Boston Celtics cards.',
        cardsRequired: 3,
        slotPositions: ['C', 'PG', 'SG'],
        requirements: [
          { type: 'TOTAL_CARDS', value: 3 },
          { type: 'TEAM_OVR_MIN', value: 85 },
          { type: 'SPECIFIC_TEAM', value: 'BOS', count: 3 }
        ],
        segmentReward: {
          type: 'both',
          coins: 12000,
          packType: 'mvp',
          packName: 'Finals MVP & Awards Pack',
          description: '12,000 Monedes + 1x Finals MVP Pack'
        }
      }
    ]
  },
  {
    id: 'sbc-group-icon-dirk-nowitzki',
    name: 'Dirk Nowitzki Mavs Icon',
    description: 'Complete both squad challenges to unlock 95 OVR Icon SBC Dirk Nowitzki.',
    category: 'franchise_icons',
    difficulty: 'elite',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Dirk Nowitzki',
      rarity: 'icon_sbc',
      ovr: 95,
      imageUrl: 'https://i.pinimg.com/originals/c3/bf/32/c3bf3247294ab7aa8c3d7bdee0f34c36.jpg'
    },
    segments: [
{
            id: 'icon-dirk-seg-1',
            name: 'Dirk Nowitzki',
            description: 'Submit 1 card: Dirk Nowitzki.',
            cardsRequired: 1,
            slotPositions: [
                  'PF'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Dirk Nowitzki',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 3000,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '3,000 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'icon-dirk-seg-2',
            name: 'Dirk Nowitzki Finals MVP 2011',
            description: 'Submit 1 card: Dirk Nowitzki — Finals MVP 2011.',
            cardsRequired: 1,
            slotPositions: [
                  'PF'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Dirk Nowitzki',
                        edition: 'Finals MVP 2011',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 6000,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '6,000 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'icon-dirk-seg-3',
            name: 'Dallas Mavericks Core',
            description: 'Submit 3 cards: Min 2 Dallas Mavericks cards, Team OVR >= 87.',
            cardsRequired: 3,
            slotPositions: [
                  'PF',
                  'PG',
                  'SG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'DAL',
                        count: 2
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 87
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 10000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '10,000 Coins + 1x Finals MVP Pack'
            }
      }
    ]
  },
  {
    id: 'sbc-group-icon-dwyane-wade',
    name: 'Dwyane Wade Flash Icon',
    description: 'Complete both squad challenges to unlock 95 OVR Icon SBC Dwyane Wade.',
    category: 'franchise_icons',
    difficulty: 'elite',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Dwyane Wade',
      rarity: 'icon_sbc',
      ovr: 95,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRE84GmqJR-ytQYvuiCGaF2MERo_v4XKdQ4BPpJCYbfWA&s=10'
    },
    segments: [
{
            id: 'icon-wade-seg-1',
            name: 'Dwyane Wade',
            description: 'Submit 1 card: Dwyane Wade.',
            cardsRequired: 1,
            slotPositions: [
                  'SG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Dwyane Wade',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 3000,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '3,000 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'icon-wade-seg-2',
            name: 'Dwyane Wade Finals MVP 2006',
            description: 'Submit 1 card: Dwyane Wade — Finals MVP 2006.',
            cardsRequired: 1,
            slotPositions: [
                  'SG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Dwyane Wade',
                        edition: 'Finals MVP 2006',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 6000,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '6,000 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'icon-wade-seg-3',
            name: 'Miami Heat Core',
            description: 'Submit 3 cards: Min 2 Miami Heat cards, Team OVR >= 87.',
            cardsRequired: 3,
            slotPositions: [
                  'SG',
                  'SF',
                  'C'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'MIA',
                        count: 2
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 87
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 10000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '10,000 Coins + 1x Finals MVP Pack'
            }
      }
    ]
  },
  {
    id: 'sbc-group-icon-giannis-antetokounmpo',
    name: 'Giannis Antetokounmpo Greek Freak Icon',
    description: 'Complete both squad challenges to unlock 96 OVR Icon SBC Giannis Antetokounmpo.',
    category: 'franchise_icons',
    difficulty: 'elite',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Giannis Antetokounmpo',
      rarity: 'icon_sbc',
      ovr: 96,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRSzzcfb2YbI2I29tO2BCWd99e8nsuw0wl9D28XnxxmZQ&s=10'
    },
    segments: [
{
            id: 'icon-giannis-seg-1',
            name: 'Giannis Antetokounmpo',
            description: 'Submit 1 card: Giannis Antetokounmpo.',
            cardsRequired: 1,
            slotPositions: [
                  'PF'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Giannis Antetokounmpo',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 3500,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '3,500 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'icon-giannis-seg-2',
            name: 'Giannis Antetokounmpo Finals MVP 2021',
            description: 'Submit 1 card: Giannis Antetokounmpo — Finals MVP 2021.',
            cardsRequired: 1,
            slotPositions: [
                  'PF'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Giannis Antetokounmpo',
                        edition: 'Finals MVP 2021',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 7000,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '7,000 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'icon-giannis-seg-3',
            name: 'Milwaukee Bucks Core',
            description: 'Submit 3 cards: Min 2 Milwaukee Bucks cards, Team OVR >= 88.',
            cardsRequired: 3,
            slotPositions: [
                  'PF',
                  'PG',
                  'C'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'MIL',
                        count: 2
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 88
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 11000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '11,000 Coins + 1x Finals MVP Pack'
            }
      }
    ]
  },
  {
    id: 'sbc-group-icon-stephen-curry',
    name: 'Stephen Curry Golden State Icon',
    description: 'Complete all squad challenges to unlock 96 OVR Icon SBC Stephen Curry.',
    category: 'franchise_icons',
    difficulty: 'elite',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Stephen Curry',
      rarity: 'icon_sbc',
      ovr: 96,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTEF65UKaP2n5N4gUA6rCZkFAA19L80Qr3HyUDGEJKMvA&s=10'
    },
    segments: [
{
            id: 'icon-curry-seg-1',
            name: 'Stephen Curry',
            description: 'Submit 1 card: Stephen Curry.',
            cardsRequired: 1,
            slotPositions: [
                  'PG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Stephen Curry',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 3500,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '3,500 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'icon-curry-seg-2',
            name: 'Stephen Curry All-Star MVP',
            description: 'Submit 1 card: Stephen Curry — All-Star MVP (2022 or 2025).',
            cardsRequired: 1,
            slotPositions: [
                  'PG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Stephen Curry',
                        edition: 'All-Star MVP (2022, 2025)',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 7000,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '7,000 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'icon-curry-seg-3',
            name: 'Golden State Warriors Core',
            description: 'Submit 3 cards: Min 2 Golden State Warriors cards, Team OVR >= 89.',
            cardsRequired: 3,
            slotPositions: [
                  'PG',
                  'SG',
                  'PF'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'GSW',
                        count: 2
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 89
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 10000,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '10,000 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'icon-curry-seg-4',
            name: 'Stephen Curry Finals MVP 2022',
            description: 'Submit 1 card: Stephen Curry — Finals MVP 2022.',
            cardsRequired: 1,
            slotPositions: [
                  'PG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Stephen Curry',
                        edition: 'Finals MVP 2022',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 14000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '14,000 Coins + 1x Finals MVP Pack'
            }
      }
    ]
  },
  {
    id: 'sbc-group-icon-nikola-jokic',
    name: 'Nikola Jokic Denver Joker Icon',
    description: 'Complete both squad challenges to unlock 96 OVR Icon SBC Nikola Jokic.',
    category: 'franchise_icons',
    difficulty: 'elite',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Nikola Jokic',
      rarity: 'icon_sbc',
      ovr: 96,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTwGrDwE_xz4J7l_fm0ctX2odEqvJylah2ePi-XHcGiQg&s=10'
    },
    segments: [
{
            id: 'icon-jokic-seg-1',
            name: 'Nikola Jokic',
            description: 'Submit 1 card: Nikola Jokic.',
            cardsRequired: 1,
            slotPositions: [
                  'C'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Nikola Jokic',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 3500,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '3,500 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'icon-jokic-seg-2',
            name: 'Nikola Jokic Finals MVP 2023',
            description: 'Submit 1 card: Nikola Jokic — Finals MVP 2023.',
            cardsRequired: 1,
            slotPositions: [
                  'C'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Nikola Jokic',
                        edition: 'Finals MVP 2023',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 7000,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '7,000 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'icon-jokic-seg-3',
            name: 'Denver Nuggets Core',
            description: 'Submit 3 cards: Min 2 Denver Nuggets cards, Team OVR >= 88.',
            cardsRequired: 3,
            slotPositions: [
                  'C',
                  'PG',
                  'PF'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'DEN',
                        count: 2
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 88
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 11000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '11,000 Coins + 1x Finals MVP Pack'
            }
      }
    ]
  },
  {
    id: 'sbc-group-icon-allen-iverson',
    name: 'Allen Iverson The Answer Icon',
    description: 'Complete both squad challenges to unlock 94 OVR Icon SBC Allen Iverson.',
    category: 'franchise_icons',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Allen Iverson',
      rarity: 'icon_sbc',
      ovr: 94,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRJPXR4fWcOD8ozB82QNzCgRjzG5Vv39XTfwG14dpg-Xw&s=10'
    },
    segments: [
{
            id: 'icon-ai-seg-1',
            name: 'Allen Iverson',
            description: 'Submit 1 card: Allen Iverson.',
            cardsRequired: 1,
            slotPositions: [
                  'PG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Allen Iverson',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 3000,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '3,000 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'icon-ai-seg-2',
            name: 'Allen Iverson All-Star MVP',
            description: 'Submit 1 card: Allen Iverson — All-Star MVP (2001 or 2005).',
            cardsRequired: 1,
            slotPositions: [
                  'PG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Allen Iverson',
                        edition: 'All-Star MVP (2001, 2005)',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 6000,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '6,000 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'icon-ai-seg-3',
            name: 'Philadelphia 76ers Core',
            description: 'Submit 3 cards: Min 2 Philadelphia 76ers cards, Team OVR >= 86.',
            cardsRequired: 3,
            slotPositions: [
                  'PG',
                  'SG',
                  'C'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'PHI',
                        count: 2
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 86
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 10000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '10,000 Coins + 1x Finals MVP Pack'
            }
      }
    ]
  },
  {
    id: 'sbc-group-icon-damian-lillard',
    name: 'Damian Lillard Rip City Icon',
    description: 'Complete both squad challenges to unlock 93 OVR Icon SBC Damian Lillard.',
    category: 'franchise_icons',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Damian Lillard',
      rarity: 'icon_sbc',
      ovr: 93,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRlDuweYsMwgbqILOt6cT-cbgLBk5XEB8qmL2kGZfvNLg&s=10'
    },
    segments: [
{
            id: 'icon-dame-seg-1',
            name: 'Damian Lillard',
            description: 'Submit 1 card: Damian Lillard.',
            cardsRequired: 1,
            slotPositions: [
                  'PG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Damian Lillard',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 2500,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '2,500 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'icon-dame-seg-2',
            name: 'Damian Lillard All-Star MVP 2024',
            description: 'Submit 1 card: Damian Lillard — All-Star MVP 2024.',
            cardsRequired: 1,
            slotPositions: [
                  'PG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Damian Lillard',
                        edition: 'All-Star MVP 2024',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 5500,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '5,500 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'icon-dame-seg-3',
            name: 'Blazers / Bucks Core',
            description: 'Submit 3 cards: Min 2 Portland Trail Blazers or Milwaukee Bucks cards, Team OVR >= 85.',
            cardsRequired: 3,
            slotPositions: [
                  'PG',
                  'SG',
                  'C'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'POR or MIL',
                        count: 2,
                        teamsList: [
                              'POR',
                              'MIL'
                        ]
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 85
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 9000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '9,000 Coins + 1x Finals MVP Pack'
            }
      }
    ]
  },
  {
    id: 'sbc-group-icon-reggie-miller',
    name: 'Reggie Miller Pacers Icon',
    description: 'Complete both squad challenges to unlock 92 OVR Icon SBC Reggie Miller.',
    category: 'franchise_icons',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Reggie Miller',
      rarity: 'icon_sbc',
      ovr: 92,
      imageUrl: 'https://i.ytimg.com/vi/9cSjsKmiCF8/hq720.jpg?sqp=-oaymwEhCK4FEIIDSFryq4qpAxMIARUAAAAAGAElAADIQj0AgKJD&rs=AOn4CLCKax0NQmU9cIOPh4AUn0-wyY5bPA'
    },
    segments: [
{
            id: 'icon-reggie-seg-1',
            name: 'Reggie Miller',
            description: 'Submit 1 card: Reggie Miller.',
            cardsRequired: 1,
            slotPositions: [
                  'SG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Reggie Miller',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 2500,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '2,500 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'icon-reggie-seg-2',
            name: 'Indiana Pacers Core',
            description: 'Submit 3 cards: Min 2 Indiana Pacers cards, Team OVR >= 84.',
            cardsRequired: 3,
            slotPositions: [
                  'SG',
                  'PG',
                  'PF'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'IND',
                        count: 2
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 84
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 7000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '7,000 Coins + 1x Finals MVP Pack'
            }
      }
    ]
  },
  {
    id: 'sbc-group-icon-patrick-ewing',
    name: 'Patrick Ewing Knicks Icon',
    description: 'Complete both squad challenges to unlock 92 OVR Icon SBC Patrick Ewing.',
    category: 'franchise_icons',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Patrick Ewing',
      rarity: 'icon_sbc',
      ovr: 92,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQb2i0xhFgmAMNpHkXT5mEzdiPGkZwmXLcmhtJnRbbdlg&s=10'
    },
    segments: [
{
            id: 'icon-ewing-seg-1',
            name: 'Patrick Ewing',
            description: 'Submit 1 card: Patrick Ewing.',
            cardsRequired: 1,
            slotPositions: [
                  'C'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Patrick Ewing',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 2500,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '2,500 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'icon-ewing-seg-2',
            name: 'New York Knicks Core',
            description: 'Submit 3 cards: Min 2 New York Knicks cards, Team OVR >= 84.',
            cardsRequired: 3,
            slotPositions: [
                  'C',
                  'PF',
                  'SG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'NYK',
                        count: 2
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 84
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 7000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '7,000 Coins + 1x Finals MVP Pack'
            }
      }
    ]
  },
  {
    id: 'sbc-group-icon-paul-pierce',
    name: 'Paul Pierce The Truth Icon',
    description: 'Complete both squad challenges to unlock 93 OVR Icon SBC Paul Pierce.',
    category: 'franchise_icons',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Paul Pierce',
      rarity: 'icon_sbc',
      ovr: 93,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR4hegMjO3MduppMFt5KdHOvDUmzs1Q6BZWORqT1hzZYg&s=10'
    },
    segments: [
{
            id: 'icon-pierce-seg-1',
            name: 'Paul Pierce',
            description: 'Submit 1 card: Paul Pierce.',
            cardsRequired: 1,
            slotPositions: [
                  'SF'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Paul Pierce',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 2500,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '2,500 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'icon-pierce-seg-2',
            name: 'Paul Pierce Finals MVP 2008',
            description: 'Submit 1 card: Paul Pierce — Finals MVP 2008.',
            cardsRequired: 1,
            slotPositions: [
                  'SF'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Paul Pierce',
                        edition: 'Finals MVP 2008',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 5500,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '5,500 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'icon-pierce-seg-3',
            name: 'Boston Celtics Core',
            description: 'Submit 3 cards: Min 2 Boston Celtics cards, Team OVR >= 85.',
            cardsRequired: 3,
            slotPositions: [
                  'SF',
                  'PF',
                  'PG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'BOS',
                        count: 2
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 85
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 9000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '9,000 Coins + 1x Finals MVP Pack'
            }
      }
    ]
  },
  {
    id: 'sbc-group-fan-isaiah-thomas',
    name: 'Isaiah Thomas Boston King',
    description: 'Complete both squad challenges to unlock 89 OVR Fan Favourite Isaiah Thomas.',
    category: 'fan_favourites',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Isaiah Thomas',
      rarity: 'icon_sbc',
      ovr: 89,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4Y44vOWfEjM7YO0obA9_zxcAhON0D7TQNkGxq3KZiaA&s=10'
    },
    segments: [
{
            id: 'fan-it-seg-1',
            name: 'Isaiah Thomas',
            description: 'Submit 1 card: Isaiah Thomas.',
            cardsRequired: 1,
            slotPositions: [
                  'PG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Isaiah Thomas',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 1500,
                  packType: 'duo_xfactor',
                  packName: 'Dynamic Duo Pack',
                  description: '1,500 Coins + 1x Duo Pack'
            }
      },
      {
            id: 'fan-it-seg-2',
            name: 'Boston Celtics Squad',
            description: 'Submit 3 cards: Min 1 Boston Celtics card, Team OVR >= 77.',
            cardsRequired: 3,
            slotPositions: [
                  'PG',
                  'SG',
                  'SF'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'BOS',
                        count: 1
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 77
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 3500,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '3,500 Coins + 1x All-Star Pack'
            }
      }
    ]
  },
  {
    id: 'sbc-group-fan-manu-ginobili',
    name: 'Manu Ginobili 6th Man Legend',
    description: 'Complete both squad challenges to unlock 89 OVR Fan Favourite Manu Ginobili.',
    category: 'fan_favourites',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Manu Ginobili',
      rarity: 'icon_sbc',
      ovr: 89,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzzFHddJ7N-sbb5T3rPHCTWKFszRc6q3-MAvEXbYFFWZjC9dvpHR27Kzk&s=10'
    },
    segments: [
{
            id: 'fan-manu-seg-1',
            name: 'Manu Ginobili',
            description: 'Submit 1 card: Manu Ginobili.',
            cardsRequired: 1,
            slotPositions: [
                  'SG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Manu Ginobili',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 1500,
                  packType: 'duo_xfactor',
                  packName: 'Dynamic Duo Pack',
                  description: '1,500 Coins + 1x Duo Pack'
            }
      },
      {
            id: 'fan-manu-seg-2',
            name: 'San Antonio Spurs Squad',
            description: 'Submit 3 cards: Min 1 San Antonio Spurs card, Team OVR >= 77.',
            cardsRequired: 3,
            slotPositions: [
                  'SG',
                  'PF',
                  'C'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'SAS',
                        count: 1
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 77
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 3500,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '3,500 Coins + 1x All-Star Pack'
            }
      }
    ]
  },
  {
    id: 'sbc-group-fan-jeremy-lin',
    name: 'Jeremy Lin Linsanity 2012',
    description: 'Complete both squad challenges to unlock 88 OVR Fan Favourite Jeremy Lin.',
    category: 'fan_favourites',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Jeremy Lin',
      rarity: 'icon_sbc',
      ovr: 88,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLFK2KLr0TtkFBSCFVt63UN8RNEHLd90nNqRKM5ZFtsA&s=10'
    },
    segments: [
{
            id: 'fan-lin-seg-1',
            name: 'Jeremy Lin',
            description: 'Submit 1 card: Jeremy Lin.',
            cardsRequired: 1,
            slotPositions: [
                  'PG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Jeremy Lin',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 1500,
                  packType: 'duo_xfactor',
                  packName: 'Dynamic Duo Pack',
                  description: '1,500 Coins + 1x Duo Pack'
            }
      },
      {
            id: 'fan-lin-seg-2',
            name: 'New York Knicks Squad',
            description: 'Submit 3 cards: Min 1 New York Knicks card, Team OVR >= 76.',
            cardsRequired: 3,
            slotPositions: [
                  'PG',
                  'SG',
                  'PF'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'NYK',
                        count: 1
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 76
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 3500,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '3,500 Coins + 1x All-Star Pack'
            }
      }
    ]
  },
  {
    id: 'sbc-group-fan-jamal-crawford',
    name: 'Jamal Crawford Shake N Bake',
    description: 'Complete both squad challenges to unlock 87 OVR Fan Favourite Jamal Crawford.',
    category: 'fan_favourites',
    difficulty: 'silver',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Jamal Crawford',
      rarity: 'icon_sbc',
      ovr: 87,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTq4-OQZMc8ZTj_MDstkfEs91dQ-nFn_mclE94gLYG1VQ&s=10'
    },
    segments: [
{
            id: 'fan-crawford-seg-1',
            name: 'Jamal Crawford',
            description: 'Submit 1 card: Jamal Crawford.',
            cardsRequired: 1,
            slotPositions: [
                  'SG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Jamal Crawford',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 1500,
                  packType: 'duo_xfactor',
                  packName: 'Dynamic Duo Pack',
                  description: '1,500 Coins + 1x Duo Pack'
            }
      },
      {
            id: 'fan-crawford-seg-2',
            name: 'Role Player Chemistry Squad',
            description: 'Submit 3 cards: Team OVR >= 75, including at least 1 card with OVR <= 75.',
            cardsRequired: 3,
            slotPositions: [
                  'SG',
                  'SF',
                  'C'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 75
                  },
                  {
                        type: 'MAX_OVR',
                        value: 75,
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 3500,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '3,500 Coins + 1x All-Star Pack'
            }
      }
    ]
  },
  {
    id: 'sbc-group-fan-alex-caruso',
    name: 'Alex Caruso Lakeshow Hero',
    description: 'Complete both squad challenges to unlock 85 OVR Fan Favourite Alex Caruso.',
    category: 'fan_favourites',
    difficulty: 'bronze',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Alex Caruso',
      rarity: 'icon_sbc',
      ovr: 85,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTylOXr2AqL_yKpPwX7t27FGkEITy8jrwhoNQi5_qGHGA&s=10'
    },
    segments: [
{
            id: 'fan-caruso-seg-1',
            name: 'Alex Caruso',
            description: 'Submit 1 card: Alex Caruso.',
            cardsRequired: 1,
            slotPositions: [
                  'PG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Alex Caruso',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 1500,
                  packType: 'duo_xfactor',
                  packName: 'Dynamic Duo Pack',
                  description: '1,500 Coins + 1x Duo Pack'
            }
      },
      {
            id: 'fan-caruso-seg-2',
            name: 'Lakers / Bulls Squad',
            description: 'Submit 3 cards: Min 1 Los Angeles Lakers or Chicago Bulls card, Team OVR >= 73.',
            cardsRequired: 3,
            slotPositions: [
                  'PG',
                  'SG',
                  'PF'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'LAL or CHI',
                        count: 1,
                        teamsList: [
                              'LAL',
                              'CHI'
                        ]
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 73
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 3500,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '3,500 Coins + 1x All-Star Pack'
            }
      }
    ]
  },
  {
    id: 'sbc-group-rookie-lebron-2003',
    name: 'LeBron James 2003 Rookie',
    description: 'Complete both squad challenges to unlock 88 OVR Future Star LeBron James.',
    category: 'rookie_series',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'LeBron James',
      rarity: 'future_star',
      ovr: 88,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRVLB5gUMePndVUTfs1Caetc8Ym79WBe10pKRBngG_j1g&s=10'
    },
    segments: [
{
            id: 'rookie-lebron-seg-1',
            name: 'LeBron James',
            description: 'Submit 1 card: LeBron James.',
            cardsRequired: 1,
            slotPositions: [
                  'SF'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'LeBron James',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 1500,
                  packType: 'duo_xfactor',
                  packName: 'Dynamic Duo Pack',
                  description: '1,500 Coins + 1x Duo Pack'
            }
      },
      {
            id: 'rookie-lebron-seg-2',
            name: 'Cleveland Cavaliers Squad',
            description: 'Submit 3 cards: Team OVR >= 74, min 1 Cleveland Cavaliers card.',
            cardsRequired: 3,
            slotPositions: [
                  'SF',
                  'PG',
                  'C'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 74
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'CLE',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 3500,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '3,500 Coins + 1x All-Star Pack'
            }
      }
    ]
  },
  {
    id: 'sbc-group-rookie-curry-2009',
    name: 'Stephen Curry 2009 Rookie',
    description: 'Complete both squad challenges to unlock 86 OVR Future Star Stephen Curry.',
    category: 'rookie_series',
    difficulty: 'silver',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Stephen Curry',
      rarity: 'future_star',
      ovr: 86,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR5M2HRbuI-gHSxlY74KqX2Rjn_i4nHiOKLRp4LlaCgOg&s=10'
    },
    segments: [
{
            id: 'rookie-curry-seg-1',
            name: 'Stephen Curry',
            description: 'Submit 1 card: Stephen Curry.',
            cardsRequired: 1,
            slotPositions: [
                  'PG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Stephen Curry',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 1500,
                  packType: 'duo_xfactor',
                  packName: 'Dynamic Duo Pack',
                  description: '1,500 Coins + 1x Duo Pack'
            }
      },
      {
            id: 'rookie-curry-seg-2',
            name: 'Golden State Warriors Squad',
            description: 'Submit 3 cards: Team OVR >= 72, min 1 Golden State Warriors card.',
            cardsRequired: 3,
            slotPositions: [
                  'PG',
                  'SG',
                  'PF'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 72
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'GSW',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 3500,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '3,500 Coins + 1x All-Star Pack'
            }
      }
    ]
  },
  {
    id: 'sbc-group-rookie-kobe-1996',
    name: 'Kobe Bryant 1996 Rookie',
    description: 'Complete both squad challenges to unlock 87 OVR Future Star Kobe Bryant.',
    category: 'rookie_series',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Kobe Bryant',
      rarity: 'future_star',
      ovr: 87,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTrFT8KIxk7FGubiz5l9vkxXv9O5gHfyT9lv06yJZpZhQ&s=10'
    },
    segments: [
{
            id: 'rookie-kobe-seg-1',
            name: 'Kobe Bryant',
            description: 'Submit 1 card: Kobe Bryant.',
            cardsRequired: 1,
            slotPositions: [
                  'SG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Kobe Bryant',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 1500,
                  packType: 'duo_xfactor',
                  packName: 'Dynamic Duo Pack',
                  description: '1,500 Coins + 1x Duo Pack'
            }
      },
      {
            id: 'rookie-kobe-seg-2',
            name: 'Los Angeles Lakers Squad',
            description: 'Submit 3 cards: Team OVR >= 73, min 1 Los Angeles Lakers card.',
            cardsRequired: 3,
            slotPositions: [
                  'SG',
                  'SF',
                  'C'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 73
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'LAL',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 3500,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '3,500 Coins + 1x All-Star Pack'
            }
      }
    ]
  },
  {
    id: 'sbc-group-rookie-wemby-2023',
    name: 'Victor Wembanyama 2023 Rookie',
    description: 'Complete both squad challenges to unlock 89 OVR Future Star Victor Wembanyama.',
    category: 'rookie_series',
    difficulty: 'elite',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Victor Wembanyama',
      rarity: 'future_star',
      ovr: 89,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuP-kZN3Oc0zVlVokDLGp6G-lDCCIiE-rgEQvXhwkd1g&s=10'
    },
    segments: [
{
            id: 'rookie-wemby-seg-1',
            name: 'Victor Wembanyama',
            description: 'Submit 1 card: Victor Wembanyama.',
            cardsRequired: 1,
            slotPositions: [
                  'C'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Victor Wembanyama',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 1500,
                  packType: 'duo_xfactor',
                  packName: 'Dynamic Duo Pack',
                  description: '1,500 Coins + 1x Duo Pack'
            }
      },
      {
            id: 'rookie-wemby-seg-2',
            name: 'San Antonio Spurs Squad',
            description: 'Submit 3 cards: Team OVR >= 75, min 1 San Antonio Spurs card.',
            cardsRequired: 3,
            slotPositions: [
                  'C',
                  'PF',
                  'PG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 75
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'SAS',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 3500,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '3,500 Coins + 1x All-Star Pack'
            }
      }
    ]
  },
  {
    id: 'sbc-group-rookie-jordan-1984',
    name: 'Michael Jordan 1984 Rookie',
    description: 'Complete both squad challenges to unlock 90 OVR Future Star Michael Jordan.',
    category: 'rookie_series',
    difficulty: 'elite',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Michael Jordan',
      rarity: 'future_star',
      ovr: 90,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR_ZvHGHtxHR_KxoyW5b9l4XHwIgKqZuyi8EjY3AGS98Q&s=10'
    },
    segments: [
{
            id: 'rookie-jordan-seg-1',
            name: 'Michael Jordan',
            description: 'Submit 1 card: Michael Jordan.',
            cardsRequired: 1,
            slotPositions: [
                  'SG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Michael Jordan',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 1500,
                  packType: 'duo_xfactor',
                  packName: 'Dynamic Duo Pack',
                  description: '1,500 Coins + 1x Duo Pack'
            }
      },
      {
            id: 'rookie-jordan-seg-2',
            name: 'Chicago Bulls Squad',
            description: 'Submit 3 cards: Team OVR >= 76, min 1 Chicago Bulls card.',
            cardsRequired: 3,
            slotPositions: [
                  'SG',
                  'SF',
                  'PF'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 76
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'CHI',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 3500,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '3,500 Coins + 1x All-Star Pack'
            }
      }
    ]
  },
  {
    id: 'sbc-group-clutch-ray-allen',
    name: 'Ray Allen Game 6 Miracle',
    description: 'Complete both squad challenges to unlock 93 OVR Moments SBC Ray Allen.',
    category: 'clutch_moments',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Ray Allen',
      rarity: 'moments_sbc',
      ovr: 93,
      imageUrl: 'https://media.tenor.com/RNzYmnPTe1YAAAAM/nba-basketball.gif'
    },
    segments: [
{
            id: 'clutch-ray-allen-seg-1',
            name: 'Ray Allen',
            description: 'Submit 1 card: Ray Allen.',
            cardsRequired: 1,
            slotPositions: [
                  'SG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Ray Allen',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 2500,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '2,500 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'clutch-ray-allen-seg-2',
            name: 'Game 6 Miracle 3 Moment',
            description: 'Submit 1 card: Ray Allen — Moment \'Game 6 Miracle 3\' (2013).',
            cardsRequired: 1,
            slotPositions: [
                  'SG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Ray Allen',
                        edition: 'Moment \'Game 6 Miracle 3\' (2013)',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 5500,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '5,500 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'clutch-ray-allen-seg-3',
            name: 'Heat / Celtics Squad',
            description: 'Submit 3 cards: Min 1 Miami Heat or Boston Celtics card, Team OVR >= 85.',
            cardsRequired: 3,
            slotPositions: [
                  'SG',
                  'SF',
                  'PG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'MIA or BOS',
                        count: 1,
                        teamsList: [
                              'MIA',
                              'BOS'
                        ]
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 85
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 9000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '9,000 Coins + 1x Finals MVP Pack'
            }
      }
    ]
  },
  {
    id: 'sbc-group-clutch-kyrie-irving',
    name: 'Kyrie Irving 2016 Game 7 Dagger',
    description: 'Complete both squad challenges to unlock 94 OVR Moments SBC Kyrie Irving.',
    category: 'clutch_moments',
    difficulty: 'elite',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Kyrie Irving',
      rarity: 'moments_sbc',
      ovr: 94,
      imageUrl: 'https://i.makeagif.com/media/7-12-2017/D_v9Rj.gif'
    },
    segments: [
{
            id: 'clutch-kyrie-seg-1',
            name: 'Kyrie Irving',
            description: 'Submit 1 card: Kyrie Irving.',
            cardsRequired: 1,
            slotPositions: [
                  'PG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Kyrie Irving',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 2500,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '2,500 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'clutch-kyrie-seg-2',
            name: '2016 Game 7 Dagger Moment',
            description: 'Submit 1 card: Kyrie Irving — Moment \'2016 Game 7 Dagger\'.',
            cardsRequired: 1,
            slotPositions: [
                  'PG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Kyrie Irving',
                        edition: 'Moment \'2016 Game 7 Dagger\'',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 6000,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '6,000 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'clutch-kyrie-seg-3',
            name: 'Cleveland Cavaliers Championship Squad',
            description: 'Submit 3 cards: Min 1 Cleveland Cavaliers card, Team OVR >= 86.',
            cardsRequired: 3,
            slotPositions: [
                  'PG',
                  'SF',
                  'PF'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'CLE',
                        count: 1
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 86
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 10000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '10,000 Coins + 1x Finals MVP Pack'
            }
      }
    ]
  },
  {
    id: 'sbc-group-clutch-kawhi-leonard',
    name: 'Kawhi Leonard Game 7 Bounce',
    description: 'Complete both squad challenges to unlock 95 OVR Moments SBC Kawhi Leonard.',
    category: 'clutch_moments',
    difficulty: 'elite',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Kawhi Leonard',
      rarity: 'moments_sbc',
      ovr: 95,
      imageUrl: 'https://64.media.tumblr.com/d256967e1db88d8e283e90a860fac2e4/tumblr_prfdwhgPhn1sqpy32o2_400.gifv'
    },
    segments: [
{
            id: 'clutch-kawhi-seg-1',
            name: 'Kawhi Leonard',
            description: 'Submit 1 card: Kawhi Leonard.',
            cardsRequired: 1,
            slotPositions: [
                  'SF'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Kawhi Leonard',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 3000,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '3,000 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'clutch-kawhi-seg-2',
            name: 'Kawhi Leonard Finals MVP 2019',
            description: 'Submit 1 card: Kawhi Leonard — Finals MVP 2019.',
            cardsRequired: 1,
            slotPositions: [
                  'SF'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Kawhi Leonard',
                        edition: 'Finals MVP 2019',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 6500,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '6,500 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'clutch-kawhi-seg-3',
            name: 'Spurs / Raptors Squad',
            description: 'Submit 3 cards: Min 1 San Antonio Spurs or Toronto Raptors card, Team OVR >= 87.',
            cardsRequired: 3,
            slotPositions: [
                  'SF',
                  'PF',
                  'PG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'SAS or TOR',
                        count: 1,
                        teamsList: [
                              'SAS',
                              'TOR'
                        ]
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 87
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 10000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '10,000 Coins + 1x Finals MVP Pack'
            }
      }
    ]
  },
  {
    id: 'sbc-group-clutch-vince-carter',
    name: 'Vince Carter 2000 Dunk Contest',
    description: 'Complete both squad challenges to unlock 94 OVR Moments SBC Vince Carter.',
    category: 'clutch_moments',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Vince Carter',
      rarity: 'moments_sbc',
      ovr: 94,
      imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/1713.png'
    },
    segments: [
{
            id: 'clutch-vince-seg-1',
            name: 'Vince Carter',
            description: 'Submit 1 card: Vince Carter.',
            cardsRequired: 1,
            slotPositions: [
                  'SF'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Vince Carter',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 8000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '8,000 Coins + 1x Finals MVP Pack'
            }
      }
    ]
  },
  {
    id: 'sbc-group-clutch-derrick-rose',
    name: 'Derrick Rose 50-Pt Redemption',
    description: 'Complete both squad challenges to unlock 92 OVR Moments SBC Derrick Rose.',
    category: 'clutch_moments',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Derrick Rose',
      rarity: 'moments_sbc',
      ovr: 92,
      imageUrl: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201565.png'
    },
    segments: [
{
            id: 'clutch-drose-seg-1',
            name: 'Derrick Rose',
            description: 'Submit 1 card: Derrick Rose.',
            cardsRequired: 1,
            slotPositions: [
                  'PG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Derrick Rose',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 2500,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '2,500 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'clutch-drose-seg-2',
            name: 'Chicago Bulls Core',
            description: 'Submit 3 cards: Min 2 Chicago Bulls cards, Team OVR >= 84.',
            cardsRequired: 3,
            slotPositions: [
                  'PG',
                  'SG',
                  'C'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'CHI',
                        count: 2
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 84
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 7000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '7,000 Coins + 1x Finals MVP Pack'
            }
      }
    ]
  },
  // ==========================================
  // SCREAM EDITION HALLOWEEN SPECIAL SBCS
  // ==========================================
  {
    id: 'sbc-group-scream-kobe',
    name: 'Scream Master: Kobe Bryant',
    description: 'Complete all 3 Halloween squad challenges to unlock the 98 OVR Scream Edition Black Mamba.',
    category: 'scream',
    difficulty: 'legendary',
    type: 'limited',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Kobe Bryant',
      playerId: 'scream-kobe-bryant-sbc',
      rarity: 'legend_sbc',
      ovr: 98,
      imageUrl: 'https://i.postimg.cc/zV9bVh5w/chat5.png'
    },
    segments: [
      {
        id: 'scream-kobe-seg-1',
        name: 'Nightmare on Figueroa',
        description: 'Submit 5 cards: Team OVR >= 85, min 2 Los Angeles Lakers cards.',
        cardsRequired: 5,
        slotPositions: ['PG', 'SG', 'SF', 'PF', 'C'],
        requirements: [
          {
            type: 'TOTAL_CARDS',
            value: 5
          },
          {
            type: 'TEAM_OVR_MIN',
            value: 85
          },
          {
            type: 'SPECIFIC_TEAM',
            value: 'LAL',
            count: 2
          }
        ],
        segmentReward: {
          type: 'both',
          coins: 6000,
          packType: 'allstar',
          packName: 'All-Star Pack',
          description: '6,000 Coins + 1x All-Star Pack'
        }
      },
      {
        id: 'scream-kobe-seg-2',
        name: 'Midnight Mamba Venom',
        description: 'Submit 3 cards: Min 1 SG, Team OVR >= 87.',
        cardsRequired: 3,
        slotPositions: ['PG', 'SG', 'SF'],
        requirements: [
          {
            type: 'TOTAL_CARDS',
            value: 3
          },
          {
            type: 'TEAM_OVR_MIN',
            value: 87
          }
        ],
        segmentReward: {
          type: 'both',
          coins: 10000,
          packType: 'mvp',
          packName: 'Finals MVP Pack',
          description: '10,000 Coins + 1x Finals MVP Pack'
        }
      },
      {
        id: 'scream-kobe-seg-3',
        name: '81-Point Terror',
        description: 'Submit 5 cards: Team OVR >= 88, min 2 Special/All-Star cards.',
        cardsRequired: 5,
        slotPositions: ['PG', 'SG', 'SF', 'PF', 'C'],
        requirements: [
          {
            type: 'TOTAL_CARDS',
            value: 5
          },
          {
            type: 'TEAM_OVR_MIN',
            value: 88
          },
          {
            type: 'SPECIAL_CARDS_MIN',
            value: 2
          }
        ],
        segmentReward: {
          type: 'both',
          coins: 15000,
          packType: 'scream_edition',
          packName: 'Scream Edition Pack',
          description: '15,000 Coins + 1x Scream Edition Pack'
        }
      }
    ]
  },
  {
    id: 'sbc-group-scream-garnett',
    name: 'Scream Master: Kevin Garnett',
    description: 'Complete all 3 Halloween squad challenges to unlock the 97 OVR Scream Edition Big Ticket.',
    category: 'scream',
    difficulty: 'legendary',
    type: 'limited',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Kevin Garnett',
      playerId: 'scream-kevin-garnett-sbc',
      rarity: 'legend_sbc',
      ovr: 97,
      imageUrl: 'https://i.postimg.cc/YhJGhFkX/chat4.png'
    },
    segments: [
      {
        id: 'scream-garnett-seg-1',
        name: 'Howl of the Timberwolf',
        description: 'Submit 5 cards: Team OVR >= 84, min 2 Minnesota Timberwolves / Boston Celtics cards.',
        cardsRequired: 5,
        slotPositions: ['PG', 'SG', 'SF', 'PF', 'C'],
        requirements: [
          {
            type: 'TOTAL_CARDS',
            value: 5
          },
          {
            type: 'TEAM_OVR_MIN',
            value: 84
          },
          {
            type: 'SPECIFIC_TEAM',
            value: 'MIN',
            count: 1
          }
        ],
        segmentReward: {
          type: 'both',
          coins: 5000,
          packType: 'allstar',
          packName: 'All-Star Pack',
          description: '5,000 Coins + 1x All-Star Pack'
        }
      },
      {
        id: 'scream-garnett-seg-2',
        name: 'Paint of Terror',
        description: 'Submit 3 cards: Min 2 Big Men (PF or C), Team OVR >= 86.',
        cardsRequired: 3,
        slotPositions: ['SF', 'PF', 'C'],
        requirements: [
          {
            type: 'TOTAL_CARDS',
            value: 3
          },
          {
            type: 'TEAM_OVR_MIN',
            value: 86
          }
        ],
        segmentReward: {
          type: 'both',
          coins: 9000,
          packType: 'duo_xfactor',
          packName: 'Dynamic Duo & X-Factor Pack',
          description: '9,000 Coins + 1x Dynamic Duo Pack'
        }
      },
      {
        id: 'scream-garnett-seg-3',
        name: 'Haunted Intensity',
        description: 'Submit 5 cards: Team OVR >= 88, min 2 Special/All-Star cards.',
        cardsRequired: 5,
        slotPositions: ['PG', 'SG', 'SF', 'PF', 'C'],
        requirements: [
          {
            type: 'TOTAL_CARDS',
            value: 5
          },
          {
            type: 'TEAM_OVR_MIN',
            value: 88
          },
          {
            type: 'SPECIAL_CARDS_MIN',
            value: 2
          }
        ],
        segmentReward: {
          type: 'both',
          coins: 14000,
          packType: 'scream_edition',
          packName: 'Scream Edition Pack',
          description: '14,000 Coins + 1x Scream Edition Pack'
        }
      }
    ]
  }
];

// Flat export of legacy single challenges mapped from segments for any backwards compatibility
export const SBC_CHALLENGES: SbcChallenge[] = SBC_GROUPS.map(g => ({
  id: g.id,
  name: g.name,
  description: g.description,
  category: g.category,
  difficulty: g.difficulty,
  type: g.type,
  expiresAt: g.expiresAt,
  requirements: g.segments[0]?.requirements || [],
  reward: g.reward,
  isActive: g.isActive,
  cardsRequired: g.segments[0]?.cardsRequired || 5,
  slotPositions: g.segments[0]?.slotPositions
}));
