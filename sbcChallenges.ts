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
            description: 'Submit 5 cards: Team OVR >= 85, min 3 Chicago Bulls 90s era cards.',
            cardsRequired: 5,
            slotPositions: [
                  'PG',
                  'SG',
                  'SF',
                  'PF',
                  'C'
            ],
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
                        value: 'CHI',
                        count: 3,
                        era: '90s'
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 3500,
                  packType: 'duo_xfactor',
                  packName: 'Dynamic Duo & X-Factor',
                  description: '3,500 Coins + 1x Dynamic Duo Pack'
            }
      },
      {
            id: 'dynasty-bulls-seg-2',
            name: 'Michael Jordan 1998 Finals MVP',
            description: 'Submit 1 card: Michael Jordan — Finals MVP 1998 (any copy).',
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
                        edition: 'Finals MVP 1998',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 7500,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '7,500 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'dynasty-bulls-seg-3',
            name: 'Championship Supporting Cast',
            description: 'Submit 3 cards: Min 2 of Pippen, Rodman, Kerr (Chicago Bulls), Team OVR >= 88.',
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
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Scottie Pippen, Dennis Rodman or Steve Kerr',
                        count: 2,
                        playersList: [
                              'Scottie Pippen',
                              'Dennis Rodman',
                              'Steve Kerr'
                        ]
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'CHI',
                        count: 3
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 88
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
            id: 'dynasty-bulls-seg-4',
            name: 'The Last Shot 1998 Moment',
            description: 'Submit 1 card: Michael Jordan — Moment \'The Last Shot\' (1998).',
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
                        edition: 'Moment \'The Last Shot\' (1998)',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 15000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '15,000 Coins + 1x Finals MVP Pack'
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
            name: 'Dub Nation Foundation',
            description: 'Submit 5 cards: Team OVR >= 84, min 3 Golden State Warriors cards.',
            cardsRequired: 5,
            slotPositions: [
                  'PG',
                  'SG',
                  'SF',
                  'PF',
                  'C'
            ],
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
                        value: 'GSW',
                        count: 3
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 3500,
                  packType: 'duo_xfactor',
                  packName: 'Dynamic Duo & X-Factor',
                  description: '3,500 Coins + 1x Dynamic Duo Pack'
            }
      },
      {
            id: 'dynasty-warriors-seg-2',
            name: 'Original Big Three',
            description: 'Submit 3 cards: Stephen Curry + Klay Thompson + Draymond Green (all GSW), Team OVR >= 87.',
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
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Stephen Curry',
                        count: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Klay Thompson',
                        count: 1
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Draymond Green',
                        count: 1
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'GSW',
                        count: 3
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 87
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
            id: 'dynasty-warriors-seg-3',
            name: 'Bang Bang 2015 Moment',
            description: 'Submit 1 card: Stephen Curry — Moment \'Bang Bang\' (2015).',
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
                        edition: 'Moment \'Bang Bang\' (2015)',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 9000,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '9,000 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'dynasty-warriors-seg-4',
            name: 'Hampton 5 & KD Era',
            description: 'Submit 3 cards: Min 1 Kevin Durant (GSW) + 2 GSW cards, Team OVR >= 90.',
            cardsRequired: 3,
            slotPositions: [
                  'SF',
                  'PG',
                  'SG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'SPECIFIC_PLAYER_NAME',
                        value: 'Kevin Durant',
                        count: 1
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'GSW',
                        count: 3
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 90
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 12500,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '12,500 Coins + 1x Finals MVP Pack'
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
            name: 'Michael Jordan 90+ OVR',
            description: 'Submit 1 card: Michael Jordan (any edition, OVR >= 90).',
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
                        minOvr: 90,
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 4000,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '4,000 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'hof-jordan-seg-2',
            name: 'Chicago Bulls Elite Unit',
            description: 'Submit 3 cards: Min 2 Chicago Bulls cards, Team OVR >= 89.',
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
                        type: 'SPECIFIC_TEAM',
                        value: 'CHI',
                        count: 2
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 89
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 8000,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '8,000 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'hof-jordan-seg-3',
            name: 'Michael Jordan All-Star MVP',
            description: 'Submit 1 card: Michael Jordan — All-Star MVP 1996 or 1998.',
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
                        edition: 'All-Star MVP 1996 or 1998',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 12000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '12,000 Coins + 1x Finals MVP Pack'
            }
      },
      {
            id: 'hof-jordan-seg-4',
            name: 'Apex Hall of Fame Squad',
            description: 'Submit 5 cards: Team OVR >= 92, min 1 card with 96+ OVR.',
            cardsRequired: 5,
            slotPositions: [
                  'PG',
                  'SG',
                  'SF',
                  'PF',
                  'C'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 5
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 92
                  },
                  {
                        type: 'SPECIAL_CARDS_MIN',
                        value: 1,
                        minOvr: 96
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 20000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '20,000 Coins + 1x Finals MVP Pack'
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
            name: 'Kobe Bryant 88+ OVR',
            description: 'Submit 1 card: Kobe Bryant (any edition, OVR >= 88).',
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
                        minOvr: 88,
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 4000,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '4,000 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'hof-kobe-seg-2',
            name: 'Kobe Bryant All-Star MVP',
            description: 'Submit 1 card: Kobe Bryant — All-Star MVP (2002, 2007, 2009 or 2011).',
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
                        edition: 'All-Star MVP (2002, 2007, 2009, 2011)',
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 8000,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '8,000 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'hof-kobe-seg-3',
            name: 'Lakers Showtime Spirit',
            description: 'Submit 3 cards: Min 2 Los Angeles Lakers cards, Team OVR >= 90.',
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
                        value: 'LAL',
                        count: 2
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 90
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 15000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '15,000 Coins + 1x Finals MVP Pack'
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
            name: 'Kareem Abdul-Jabbar 87+ OVR',
            description: 'Submit 1 card: Kareem Abdul-Jabbar (OVR >= 87).',
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
                        value: 'Kareem Abdul-Jabbar',
                        minOvr: 87,
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 4000,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '4,000 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'hof-kareem-seg-2',
            name: 'Lakers / Bucks Dominance',
            description: 'Submit 3 cards: Min 2 Los Angeles Lakers or Milwaukee Bucks cards, Team OVR >= 90.',
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
                        type: 'SPECIFIC_TEAM',
                        value: 'LAL or MIL',
                        count: 2,
                        teamsList: [
                              'LAL',
                              'MIL'
                        ]
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 90
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 12000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '12,000 Coins + 1x Finals MVP Pack'
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
            name: 'Larry Bird 86+ OVR',
            description: 'Submit 1 card: Larry Bird (OVR >= 86).',
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
                        value: 'Larry Bird',
                        minOvr: 86,
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
            id: 'hof-bird-seg-2',
            name: 'Larry Bird All-Star MVP 1982',
            description: 'Submit 1 card: Larry Bird — All-Star MVP 1982.',
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
                        value: 'Larry Bird',
                        edition: 'All-Star MVP 1982',
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
            id: 'hof-bird-seg-3',
            name: 'Boston Celtics Pride',
            description: 'Submit 3 cards: Min 2 Boston Celtics cards, Team OVR >= 89.',
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
                        value: 89
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 12000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '12,000 Coins + 1x Finals MVP Pack'
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
            name: 'Magic Johnson 86+ OVR',
            description: 'Submit 1 card: Magic Johnson (OVR >= 86).',
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
                        value: 'Magic Johnson',
                        minOvr: 86,
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
            id: 'hof-magic-seg-2',
            name: 'Magic Johnson Finals MVP',
            description: 'Submit 1 card: Magic Johnson — Finals MVP (1980, 1982 or 1987).',
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
                        value: 'Magic Johnson',
                        edition: 'Finals MVP (1980, 1982, 1987)',
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
            id: 'hof-magic-seg-3',
            name: 'Showtime Lakers Unit',
            description: 'Submit 3 cards: Min 2 Los Angeles Lakers cards, Team OVR >= 89.',
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
                        value: 'LAL',
                        count: 2
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 89
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 12000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '12,000 Coins + 1x Finals MVP Pack'
            }
      }
    ]
  },
  {
    id: 'sbc-group-hof-shaquille-oneal',
    name: "Shaquille O\'Neal Most Dominant",
    description: "Complete all 3 squad challenges to unlock 97 OVR Legend SBC Shaquille O\'Neal.",
    category: 'hof_legends',
    difficulty: 'legendary',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: "Shaquille O\'Neal",
      rarity: 'legend_sbc',
      ovr: 97,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSgp_YZyi0CaUNKaw2gpDE4DRJJdCHO2g4v6V4hFgaoyOfwjhdgVDUxMtvz&s=10'
    },
    segments: [
{
            id: 'hof-shaq-seg-1',
            name: 'Shaquille O\'Neal 87+ OVR',
            description: 'Submit 1 card: Shaquille O\'Neal (OVR >= 87).',
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
                        value: 'Shaquille O\'Neal',
                        minOvr: 87,
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 4000,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '4,000 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'hof-shaq-seg-2',
            name: 'Lakers / Magic Dominance',
            description: 'Submit 3 cards: Min 2 Los Angeles Lakers or Orlando Magic cards, Team OVR >= 89.',
            cardsRequired: 3,
            slotPositions: [
                  'C',
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
                        value: 'LAL or ORL',
                        count: 2,
                        teamsList: [
                              'LAL',
                              'ORL'
                        ]
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 89
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 12000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '12,000 Coins + 1x Finals MVP Pack'
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
            name: 'Hakeem Olajuwon 86+ OVR',
            description: 'Submit 1 card: Hakeem Olajuwon (OVR >= 86).',
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
                        value: 'Hakeem Olajuwon',
                        minOvr: 86,
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
            id: 'hof-hakeem-seg-2',
            name: 'Houston Rockets Dominance',
            description: 'Submit 3 cards: Min 2 Houston Rockets cards, Team OVR >= 89.',
            cardsRequired: 3,
            slotPositions: [
                  'C',
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
                        value: 'HOU',
                        count: 2
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 89
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 12000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '12,000 Coins + 1x Finals MVP Pack'
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
            name: 'Tim Duncan 86+ OVR',
            description: 'Submit 1 card: Tim Duncan (OVR >= 86).',
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
                        value: 'Tim Duncan',
                        minOvr: 86,
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
            id: 'hof-duncan-seg-2',
            name: 'Tim Duncan Finals MVP',
            description: 'Submit 1 card: Tim Duncan — Finals MVP.',
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
                        value: 'Tim Duncan',
                        edition: 'Finals MVP',
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
            id: 'hof-duncan-seg-3',
            name: 'San Antonio Spurs Pride',
            description: 'Submit 3 cards: Min 2 San Antonio Spurs cards, Team OVR >= 89.',
            cardsRequired: 3,
            slotPositions: [
                  'PF',
                  'SG',
                  'PG'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'SPECIFIC_TEAM',
                        value: 'SAS',
                        count: 2
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 89
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 12000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '12,000 Coins + 1x Finals MVP Pack'
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
            name: 'Wilt Chamberlain 87+ OVR',
            description: 'Submit 1 card: Wilt Chamberlain (OVR >= 87).',
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
                        value: 'Wilt Chamberlain',
                        minOvr: 87,
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 4000,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '4,000 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'hof-wilt-seg-2',
            name: 'Dominant Centers Squad',
            description: 'Submit 5 cards: Team OVR >= 88, min 1 Center with 92+ OVR.',
            cardsRequired: 5,
            slotPositions: [
                  'PG',
                  'SG',
                  'SF',
                  'PF',
                  'C'
            ],
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
                        type: 'POSITION',
                        value: 'C',
                        minOvr: 92,
                        count: 1
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 8000,
                  packType: 'allstar',
                  packName: 'All-Star Pack',
                  description: '8,000 Coins + 1x All-Star Pack'
            }
      },
      {
            id: 'hof-wilt-seg-3',
            name: '100-Point Legend Unit',
            description: 'Submit 3 cards: Team OVR >= 92, min 1 card with 95+ OVR.',
            cardsRequired: 3,
            slotPositions: [
                  'C',
                  'PF',
                  'SF'
            ],
            requirements: [
                  {
                        type: 'TOTAL_CARDS',
                        value: 3
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 92
                  },
                  {
                        type: 'SPECIAL_CARDS_MIN',
                        value: 1,
                        minOvr: 95
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 15000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '15,000 Coins + 1x Finals MVP Pack'
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
            name: 'Bill Russell 86+ OVR',
            description: 'Submit 1 card: Bill Russell (OVR >= 86).',
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
                        value: 'Bill Russell',
                        minOvr: 86,
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
            id: 'hof-russell-seg-2',
            name: 'Bill Russell Finals MVP',
            description: 'Submit 1 card: Bill Russell — Finals MVP.',
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
                        value: 'Bill Russell',
                        edition: 'Finals MVP',
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
            id: 'hof-russell-seg-3',
            name: 'Boston Celtics Dynasty',
            description: 'Submit 3 cards: Min 2 Boston Celtics cards, Team OVR >= 89.',
            cardsRequired: 3,
            slotPositions: [
                  'C',
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
                        value: 'BOS',
                        count: 2
                  },
                  {
                        type: 'TEAM_OVR_MIN',
                        value: 89
                  }
            ],
            segmentReward: {
                  type: 'both',
                  coins: 12000,
                  packType: 'mvp',
                  packName: 'Finals MVP & Awards Pack',
                  description: '12,000 Coins + 1x Finals MVP Pack'
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
            name: 'Dirk Nowitzki 84+ OVR',
            description: 'Submit 1 card: Dirk Nowitzki (OVR >= 84).',
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
                        minOvr: 84,
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
            name: 'Dwyane Wade 84+ OVR',
            description: 'Submit 1 card: Dwyane Wade (OVR >= 84).',
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
                        minOvr: 84,
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
            name: 'Giannis Antetokounmpo 85+ OVR',
            description: 'Submit 1 card: Giannis Antetokounmpo (OVR >= 85).',
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
                        minOvr: 85,
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
            name: 'Stephen Curry 85+ OVR',
            description: 'Submit 1 card: Stephen Curry (OVR >= 85).',
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
                        minOvr: 85,
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
            name: 'Nikola Jokic 85+ OVR',
            description: 'Submit 1 card: Nikola Jokic (OVR >= 85).',
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
                        minOvr: 85,
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
            name: 'Allen Iverson 83+ OVR',
            description: 'Submit 1 card: Allen Iverson (OVR >= 83).',
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
                        minOvr: 83,
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
            name: 'Damian Lillard 82+ OVR',
            description: 'Submit 1 card: Damian Lillard (OVR >= 82).',
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
                        minOvr: 82,
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
            name: 'Reggie Miller 81+ OVR',
            description: 'Submit 1 card: Reggie Miller (OVR >= 81).',
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
                        minOvr: 81,
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
            name: 'Patrick Ewing 81+ OVR',
            description: 'Submit 1 card: Patrick Ewing (OVR >= 81).',
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
                        minOvr: 81,
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
            name: 'Paul Pierce 82+ OVR',
            description: 'Submit 1 card: Paul Pierce (OVR >= 82).',
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
                        minOvr: 82,
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
    description: 'Complete both squad challenges to unlock 89 OVR Moments SBC Isaiah Thomas.',
    category: 'fan_favourites',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Isaiah Thomas',
      rarity: 'moments_sbc',
      ovr: 89,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4Y44vOWfEjM7YO0obA9_zxcAhON0D7TQNkGxq3KZiaA&s=10'
    },
    segments: [
{
            id: 'fan-it-seg-1',
            name: 'Isaiah Thomas 73+ OVR',
            description: 'Submit 1 card: Isaiah Thomas (OVR >= 73).',
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
                        minOvr: 73,
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
    description: 'Complete both squad challenges to unlock 89 OVR Moments SBC Manu Ginobili.',
    category: 'fan_favourites',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Manu Ginobili',
      rarity: 'moments_sbc',
      ovr: 89,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQzzFHddJ7N-sbb5T3rPHCTWKFszRc6q3-MAvEXbYFFWZjC9dvpHR27Kzk&s=10'
    },
    segments: [
{
            id: 'fan-manu-seg-1',
            name: 'Manu Ginobili 73+ OVR',
            description: 'Submit 1 card: Manu Ginobili (OVR >= 73).',
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
                        minOvr: 73,
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
    description: 'Complete both squad challenges to unlock 88 OVR Moments SBC Jeremy Lin.',
    category: 'fan_favourites',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Jeremy Lin',
      rarity: 'moments_sbc',
      ovr: 88,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQLFK2KLr0TtkFBSCFVt63UN8RNEHLd90nNqRKM5ZFtsA&s=10'
    },
    segments: [
{
            id: 'fan-lin-seg-1',
            name: 'Jeremy Lin 72+ OVR',
            description: 'Submit 1 card: Jeremy Lin (OVR >= 72).',
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
                        minOvr: 72,
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
    description: 'Complete both squad challenges to unlock 87 OVR Moments SBC Jamal Crawford.',
    category: 'fan_favourites',
    difficulty: 'silver',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Jamal Crawford',
      rarity: 'moments_sbc',
      ovr: 87,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTq4-OQZMc8ZTj_MDstkfEs91dQ-nFn_mclE94gLYG1VQ&s=10'
    },
    segments: [
{
            id: 'fan-crawford-seg-1',
            name: 'Jamal Crawford 71+ OVR',
            description: 'Submit 1 card: Jamal Crawford (OVR >= 71).',
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
                        minOvr: 71,
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
    description: 'Complete both squad challenges to unlock 85 OVR Moments SBC Alex Caruso.',
    category: 'fan_favourites',
    difficulty: 'bronze',
    type: 'permanent',
    expiresAt: null,
    isActive: true,
    reward: {
      playerName: 'Alex Caruso',
      rarity: 'moments_sbc',
      ovr: 85,
      imageUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTylOXr2AqL_yKpPwX7t27FGkEITy8jrwhoNQi5_qGHGA&s=10'
    },
    segments: [
{
            id: 'fan-caruso-seg-1',
            name: 'Alex Caruso 70+ OVR',
            description: 'Submit 1 card: Alex Caruso (OVR >= 70).',
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
                        minOvr: 70,
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
            name: 'LeBron James (Any edition 70+ OVR)',
            description: 'Submit 1 card: LeBron James (any edition, OVR >= 70).',
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
                        minOvr: 70,
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
            name: 'Stephen Curry (Any edition 68+ OVR)',
            description: 'Submit 1 card: Stephen Curry (any edition, OVR >= 68).',
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
                        minOvr: 68,
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
            name: 'Kobe Bryant (Any edition 69+ OVR)',
            description: 'Submit 1 card: Kobe Bryant (any edition, OVR >= 69).',
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
                        minOvr: 69,
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
            name: 'Victor Wembanyama (Any edition 71+ OVR)',
            description: 'Submit 1 card: Victor Wembanyama (any edition, OVR >= 71).',
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
                        minOvr: 71,
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
            name: 'Michael Jordan (Any edition 72+ OVR)',
            description: 'Submit 1 card: Michael Jordan (any edition, OVR >= 72).',
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
                        minOvr: 72,
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
            name: 'Ray Allen 82+ OVR',
            description: 'Submit 1 card: Ray Allen (OVR >= 82).',
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
                        minOvr: 82,
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
            name: 'Kyrie Irving 83+ OVR',
            description: 'Submit 1 card: Kyrie Irving (OVR >= 83).',
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
                        minOvr: 83,
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
            name: 'Kawhi Leonard 84+ OVR',
            description: 'Submit 1 card: Kawhi Leonard (OVR >= 84).',
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
                        minOvr: 84,
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
            name: 'Vince Carter 83+ OVR',
            description: 'Submit 1 card: Vince Carter (OVR >= 83).',
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
                        minOvr: 83,
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
            name: 'Derrick Rose 81+ OVR',
            description: 'Submit 1 card: Derrick Rose (OVR >= 81).',
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
                        minOvr: 81,
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
