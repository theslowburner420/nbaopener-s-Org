import { SbcChallenge } from '../types';

export const SBC_CHALLENGES: SbcChallenge[] = [
  // ==========================================
  // 1. ROOKIE SERIES (10 Challenges)
  // ==========================================
  {
    id: 'rookie-lebron-2003',
    name: 'LEBRON 2003 ROOKIE',
    description: 'Submit 4 rookie/starter cards + 1 LeBron card for Young King LeBron.',
    category: 'rookie_series',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'SF', count: 1 },
      { type: 'MIN_OVR', value: 75 }
    ],
    reward: {
      playerName: 'LeBron James',
      rarity: 'future_star',
      ovr: 88
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'rookie-curry-2009',
    name: 'CURRY 2009 ROOKIE',
    description: 'Submit 4 guard cards + 1 Curry card for Young Chef Curry.',
    category: 'rookie_series',
    difficulty: 'silver',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'PG', count: 2 },
      { type: 'MIN_OVR', value: 75 }
    ],
    reward: {
      playerName: 'Stephen Curry',
      rarity: 'future_star',
      ovr: 86
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'rookie-kobe-1996',
    name: 'KOBE 1996 ROOKIE',
    description: 'Exchange 4 starter cards + 1 Kobe card for Fledgling Mamba.',
    category: 'rookie_series',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'SG', count: 2 },
      { type: 'MIN_OVR', value: 76 }
    ],
    reward: {
      playerName: 'Kobe Bryant',
      rarity: 'future_star',
      ovr: 87
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'rookie-durant-2007',
    name: 'DURANT 2007 ROOKIE',
    description: 'Submit 4 forward cards + 1 Durant card for Seattle Slim Reaper.',
    category: 'rookie_series',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'SF', count: 2 },
      { type: 'MIN_OVR', value: 76 }
    ],
    reward: {
      playerName: 'Kevin Durant',
      rarity: 'future_star',
      ovr: 87
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'rookie-doncic-2018',
    name: 'DONCIC 2018 ROOKIE',
    description: 'Exchange 4 cards + 1 Luka card for Wonderboy Luka.',
    category: 'rookie_series',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'PG', count: 1 },
      { type: 'MIN_OVR', value: 76 }
    ],
    reward: {
      playerName: 'Luka Doncic',
      rarity: 'future_star',
      ovr: 88
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'rookie-wemby-2023',
    name: 'WEMBY 2023 ROOKIE',
    description: 'Submit 4 center/forward cards + 1 Wemby card for Alien Prospect.',
    category: 'rookie_series',
    difficulty: 'elite',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'C', count: 2 },
      { type: 'MIN_OVR', value: 78 }
    ],
    reward: {
      playerName: 'Victor Wembanyama',
      rarity: 'future_star',
      ovr: 89
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'rookie-iverson-1996',
    name: 'IVERSON 1996 ROOKIE',
    description: 'Submit 4 guard cards + 1 Sixers/Guard for The Answer Rookie.',
    category: 'rookie_series',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'PG', count: 2 },
      { type: 'MIN_OVR', value: 76 }
    ],
    reward: {
      playerName: 'Allen Iverson',
      rarity: 'future_star',
      ovr: 88
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'rookie-jordan-1984',
    name: 'JORDAN 1984 ROOKIE',
    description: 'Exchange 4 guard cards + 1 Jordan card for Air Jordan Rookie.',
    category: 'rookie_series',
    difficulty: 'elite',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'SG', count: 2 },
      { type: 'MIN_OVR', value: 80 }
    ],
    reward: {
      playerName: 'Michael Jordan',
      rarity: 'future_star',
      ovr: 90
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'rookie-magic-1979',
    name: 'MAGIC 1979 ROOKIE',
    description: 'Submit 4 PG cards + 1 Magic card for Finals MVP Rookie Magic.',
    category: 'rookie_series',
    difficulty: 'elite',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'PG', count: 2 },
      { type: 'MIN_OVR', value: 78 }
    ],
    reward: {
      playerName: 'Magic Johnson',
      rarity: 'future_star',
      ovr: 89
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'rookie-shaq-1992',
    name: 'SHAQ 1992 ROOKIE',
    description: 'Submit 4 center cards + 1 Shaq card for Orlando Rim Shatterer Shaq.',
    category: 'rookie_series',
    difficulty: 'elite',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'C', count: 2 },
      { type: 'MIN_OVR', value: 78 }
    ],
    reward: {
      playerName: "Shaquille O'Neal",
      rarity: 'future_star',
      ovr: 89
    },
    isActive: true,
    cardsRequired: 5
  },

  // ==========================================
  // 2. FAN FAVOURITES (10 Challenges)
  // ==========================================
  {
    id: 'fan-isaiah-thomas-celtics',
    name: 'ISAIAH THOMAS BOSTON KING',
    description: 'Submit 5 Celtics cards for 2017 King in the Fourth IT4.',
    category: 'fan_favourites',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'SAME_TEAM_MIN', value: 3 },
      { type: 'MIN_OVR', value: 76 }
    ],
    reward: {
      playerName: 'Isaiah Thomas',
      rarity: 'moments_sbc',
      ovr: 89
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'fan-alex-caruso-lakeshow',
    name: 'CARUSO LAKESHOW HERO',
    description: 'Submit 4 guard cards + 1 Lakers player for Bald Mamba Caruso.',
    category: 'fan_favourites',
    difficulty: 'bronze',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'PG', count: 2 },
      { type: 'MIN_OVR', value: 72 }
    ],
    reward: {
      playerName: 'Alex Caruso',
      rarity: 'moments_sbc',
      ovr: 85
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'fan-derrick-rose-mvp',
    name: 'D-ROSE 2011 MVP',
    description: 'Submit 4 Bulls cards + 1 PG card for Youngest MVP Rose.',
    category: 'fan_favourites',
    difficulty: 'elite',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'PG', count: 2 },
      { type: 'MIN_OVR', value: 80 }
    ],
    reward: {
      playerName: 'Derrick Rose',
      rarity: 'moments_sbc',
      ovr: 91
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'fan-lance-stephenson',
    name: 'LANCE BORN READY',
    description: 'Submit 4 Pacers cards + 1 SG for Born Ready Stephenson.',
    category: 'fan_favourites',
    difficulty: 'silver',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'SG', count: 2 },
      { type: 'MIN_OVR', value: 74 }
    ],
    reward: {
      playerName: 'Lance Stephenson',
      rarity: 'moments_sbc',
      ovr: 84
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'fan-boban-marjanovic',
    name: 'BOBAN GENTLE GIANT',
    description: 'Submit 4 center cards for Fan-Favorite Boban.',
    category: 'fan_favourites',
    difficulty: 'bronze',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'C', count: 2 },
      { type: 'MIN_OVR', value: 72 }
    ],
    reward: {
      playerName: 'Boban Marjanovic',
      rarity: 'moments_sbc',
      ovr: 83
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'fan-manu-ginobili-6thman',
    name: 'GINOBILI 6TH MAN LEGEND',
    description: 'Submit 4 Spurs cards + 1 SG for Legendary 6th Man Ginobili.',
    category: 'fan_favourites',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'SG', count: 2 },
      { type: 'MIN_OVR', value: 78 }
    ],
    reward: {
      playerName: 'Manu Ginobili',
      rarity: 'moments_sbc',
      ovr: 89
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'fan-udonis-haslem',
    name: 'HASLEM HEAT CULTURE',
    description: 'Submit 5 Miami Heat cards for Captain Haslem.',
    category: 'fan_favourites',
    difficulty: 'bronze',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'SAME_TEAM_MIN', value: 3 },
      { type: 'MIN_OVR', value: 72 }
    ],
    reward: {
      playerName: 'Udonis Haslem',
      rarity: 'moments_sbc',
      ovr: 82
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'fan-patrick-beverley',
    name: 'PAT BEV DEFENSIVE LOCK',
    description: 'Submit 4 guard cards for All-Defensive Pat Bev.',
    category: 'fan_favourites',
    difficulty: 'silver',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'PG', count: 2 },
      { type: 'MIN_OVR', value: 75 }
    ],
    reward: {
      playerName: 'Patrick Beverley',
      rarity: 'moments_sbc',
      ovr: 84
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'fan-jamal-crawford',
    name: 'JAMAL CRAWFORD SHAKE N BAKE',
    description: 'Submit 4 guard cards for 3x 6th Man Crawford.',
    category: 'fan_favourites',
    difficulty: 'silver',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'SG', count: 2 },
      { type: 'MIN_OVR', value: 76 }
    ],
    reward: {
      playerName: 'Jamal Crawford',
      rarity: 'moments_sbc',
      ovr: 87
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'fan-jeremy-lin-linsanity',
    name: 'LINSANITY 2012',
    description: 'Submit 4 Knicks/Guard cards for MSG Legend Jeremy Lin.',
    category: 'fan_favourites',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'PG', count: 2 },
      { type: 'MIN_OVR', value: 76 }
    ],
    reward: {
      playerName: 'Jeremy Lin',
      rarity: 'moments_sbc',
      ovr: 88
    },
    isActive: true,
    cardsRequired: 5
  },

  // ==========================================
  // 3. HALL OF FAME LEGENDS (10 Challenges)
  // ==========================================
  {
    id: 'hof-michael-jordan-1996',
    name: 'MJ 1996 CHAMPION',
    description: 'Submit 5 All-Star level guards (82+ OVR) for HOF Jordan.',
    category: 'hof_legends',
    difficulty: 'legendary',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'MIN_RARITY', value: 'allstar' },
      { type: 'TEAM_OVR_MIN', value: 82 }
    ],
    reward: {
      playerName: 'Michael Jordan',
      rarity: 'legend_sbc',
      ovr: 98
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'hof-kobe-bryant-81pts',
    name: 'KOBE 81-POINT MASTER',
    description: 'Submit 5 West All-Star cards for 81-Point Kobe.',
    category: 'hof_legends',
    difficulty: 'legendary',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'MIN_RARITY', value: 'allstar' },
      { type: 'MIN_OVR', value: 80 }
    ],
    reward: {
      playerName: 'Kobe Bryant',
      rarity: 'legend_sbc',
      ovr: 97
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'hof-kareem-skyhook',
    name: 'KAREEM SKYHOOK TITAN',
    description: 'Submit 5 center cards (80+ OVR) for All-Time Scorer Kareem.',
    category: 'hof_legends',
    difficulty: 'legendary',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'C', count: 2 },
      { type: 'MIN_OVR', value: 80 }
    ],
    reward: {
      playerName: 'Kareem Abdul-Jabbar',
      rarity: 'legend_sbc',
      ovr: 97
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'hof-larry-bird',
    name: 'LARRY BIRD LEGEND',
    description: 'Submit 5 East All-Star cards for 3x MVP Larry Bird.',
    category: 'hof_legends',
    difficulty: 'legendary',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'SAME_CONF_MIN', value: 3 },
      { type: 'MIN_OVR', value: 80 }
    ],
    reward: {
      playerName: 'Larry Bird',
      rarity: 'legend_sbc',
      ovr: 96
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'hof-magic-johnson',
    name: 'MAGIC SHOWTIME TITAN',
    description: 'Submit 5 point guard/forward cards (80+ OVR) for Showtime Magic.',
    category: 'hof_legends',
    difficulty: 'legendary',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'PG', count: 2 },
      { type: 'MIN_OVR', value: 80 }
    ],
    reward: {
      playerName: 'Magic Johnson',
      rarity: 'legend_sbc',
      ovr: 96
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'hof-shaquille-oneal',
    name: 'SHAQ MOST DOMINANT',
    description: 'Submit 5 center/power forward cards (82+ OVR) for Prime Shaq.',
    category: 'hof_legends',
    difficulty: 'legendary',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'C', count: 2 },
      { type: 'TEAM_OVR_MIN', value: 82 }
    ],
    reward: {
      playerName: "Shaquille O'Neal",
      rarity: 'legend_sbc',
      ovr: 97
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'hof-hakeem-olajuwon',
    name: 'HAKEEM DREAM SHAKE',
    description: 'Submit 5 big man cards for Defensive Master Hakeem.',
    category: 'hof_legends',
    difficulty: 'legendary',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'C', count: 2 },
      { type: 'MIN_OVR', value: 80 }
    ],
    reward: {
      playerName: 'Hakeem Olajuwon',
      rarity: 'legend_sbc',
      ovr: 96
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'hof-tim-duncan',
    name: 'TIM DUNCAN FUNDAMENTAL',
    description: 'Submit 5 power forward/center cards for 5x Champ Duncan.',
    category: 'hof_legends',
    difficulty: 'legendary',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'PF', count: 2 },
      { type: 'MIN_OVR', value: 80 }
    ],
    reward: {
      playerName: 'Tim Duncan',
      rarity: 'legend_sbc',
      ovr: 96
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'hof-wilt-chamberlain',
    name: 'WILT 100-POINT TITAN',
    description: 'Submit 5 high OVR center cards for 100-Point Wilt.',
    category: 'hof_legends',
    difficulty: 'legendary',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'C', count: 2 },
      { type: 'TEAM_OVR_MIN', value: 82 }
    ],
    reward: {
      playerName: 'Wilt Chamberlain',
      rarity: 'legend_sbc',
      ovr: 97
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'hof-bill-russell',
    name: 'BILL RUSSELL 11 RINGS',
    description: 'Submit 5 defensive center/forward cards for 11x Champ Russell.',
    category: 'hof_legends',
    difficulty: 'legendary',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'C', count: 2 },
      { type: 'MIN_OVR', value: 80 }
    ],
    reward: {
      playerName: 'Bill Russell',
      rarity: 'legend_sbc',
      ovr: 96
    },
    isActive: true,
    cardsRequired: 5
  },

  // ==========================================
  // 4. FRANCHISE ICONS (10 Challenges)
  // ==========================================
  {
    id: 'icon-dirk-nowitzki',
    name: 'DIRK NOWITZKI MAVS ICON',
    description: 'Submit 5 Mavericks/Western cards for 2011 Champ Dirk.',
    category: 'franchise_icons',
    difficulty: 'elite',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'PF', count: 2 },
      { type: 'MIN_OVR', value: 78 }
    ],
    reward: {
      playerName: 'Dirk Nowitzki',
      rarity: 'icon_sbc',
      ovr: 95
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'icon-dwyane-wade',
    name: 'DWYANE WADE FLASH ICON',
    description: 'Submit 5 Heat/Eastern cards for 2006 Finals MVP Wade.',
    category: 'franchise_icons',
    difficulty: 'elite',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'SG', count: 2 },
      { type: 'MIN_OVR', value: 78 }
    ],
    reward: {
      playerName: 'Dwyane Wade',
      rarity: 'icon_sbc',
      ovr: 95
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'icon-giannis-antetokounmpo',
    name: 'GIANNIS GREEK FREAK ICON',
    description: 'Submit 5 Bucks cards for 50-Point Finals Giannis.',
    category: 'franchise_icons',
    difficulty: 'elite',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'PF', count: 2 },
      { type: 'MIN_OVR', value: 80 }
    ],
    reward: {
      playerName: 'Giannis Antetokounmpo',
      rarity: 'icon_sbc',
      ovr: 96
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'icon-stephen-curry',
    name: 'CURRY GOLDEN STATE ICON',
    description: 'Submit 5 Warriors cards for 4x Champ Curry.',
    category: 'franchise_icons',
    difficulty: 'elite',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'PG', count: 2 },
      { type: 'MIN_OVR', value: 80 }
    ],
    reward: {
      playerName: 'Stephen Curry',
      rarity: 'icon_sbc',
      ovr: 96
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'icon-nikola-jokic',
    name: 'JOKIC DENVER JOKER ICON',
    description: 'Submit 5 Nuggets cards for Triple-Double King Jokic.',
    category: 'franchise_icons',
    difficulty: 'elite',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'C', count: 2 },
      { type: 'MIN_OVR', value: 80 }
    ],
    reward: {
      playerName: 'Nikola Jokic',
      rarity: 'icon_sbc',
      ovr: 96
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'icon-allen-iverson',
    name: 'IVERSON THE ANSWER ICON',
    description: 'Submit 5 Sixers/Guard cards for 2001 MVP Iverson.',
    category: 'franchise_icons',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'SG', count: 2 },
      { type: 'MIN_OVR', value: 78 }
    ],
    reward: {
      playerName: 'Allen Iverson',
      rarity: 'icon_sbc',
      ovr: 94
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'icon-damian-lillard',
    name: 'LILLARD RIP CITY ICON',
    description: 'Submit 5 Blazers/Guard cards for Portland Legend Dame.',
    category: 'franchise_icons',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'PG', count: 2 },
      { type: 'MIN_OVR', value: 78 }
    ],
    reward: {
      playerName: 'Damian Lillard',
      rarity: 'icon_sbc',
      ovr: 93
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'icon-reggie-miller',
    name: 'REGGIE MILLER PACERS ICON',
    description: 'Submit 5 Pacers cards for 3pt Sharpshooter Reggie.',
    category: 'franchise_icons',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'SG', count: 2 },
      { type: 'MIN_OVR', value: 78 }
    ],
    reward: {
      playerName: 'Reggie Miller',
      rarity: 'icon_sbc',
      ovr: 92
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'icon-patrick-ewing',
    name: 'PATRICK EWING KNICKS ICON',
    description: 'Submit 5 Knicks cards for MSG Warrior Ewing.',
    category: 'franchise_icons',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'C', count: 2 },
      { type: 'MIN_OVR', value: 78 }
    ],
    reward: {
      playerName: 'Patrick Ewing',
      rarity: 'icon_sbc',
      ovr: 92
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'icon-paul-pierce',
    name: 'PAUL PIERCE THE TRUTH ICON',
    description: 'Submit 5 Celtics cards for 2008 Finals MVP Pierce.',
    category: 'franchise_icons',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'SF', count: 2 },
      { type: 'MIN_OVR', value: 78 }
    ],
    reward: {
      playerName: 'Paul Pierce',
      rarity: 'icon_sbc',
      ovr: 93
    },
    isActive: true,
    cardsRequired: 5
  },

  // ==========================================
  // 5. CLUTCH MOMENTS (10 Challenges)
  // ==========================================
  {
    id: 'clutch-ray-allen-game6',
    name: 'RAY ALLEN GAME 6 MIRACLE',
    description: 'Submit 4 Heat/Celtics cards + 1 SG for Corner 3 Miracle Allen.',
    category: 'clutch_moments',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'SG', count: 2 },
      { type: 'MIN_OVR', value: 78 }
    ],
    reward: {
      playerName: 'Ray Allen',
      rarity: 'moments_sbc',
      ovr: 93
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'clutch-kyrie-irving-2016',
    name: 'KYRIE 2016 GAME 7 DAGGER',
    description: 'Submit 4 guard cards (80+ OVR) for Championship Shot Kyrie.',
    category: 'clutch_moments',
    difficulty: 'elite',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'PG', count: 2 },
      { type: 'MIN_OVR', value: 80 }
    ],
    reward: {
      playerName: 'Kyrie Irving',
      rarity: 'moments_sbc',
      ovr: 94
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'clutch-kawhi-leonard-bounce',
    name: 'KAWHI GAME 7 BOUNCE',
    description: 'Submit 4 forward cards for Game 7 Winner Kawhi.',
    category: 'clutch_moments',
    difficulty: 'elite',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'SF', count: 2 },
      { type: 'MIN_OVR', value: 80 }
    ],
    reward: {
      playerName: 'Kawhi Leonard',
      rarity: 'moments_sbc',
      ovr: 95
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'clutch-tracy-mcgrady-13in33',
    name: 'T-MAC 13 IN 33 SECONDS',
    description: 'Submit 4 SG cards for Impossible Comeback T-Mac.',
    category: 'clutch_moments',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'SG', count: 2 },
      { type: 'MIN_OVR', value: 78 }
    ],
    reward: {
      playerName: 'Tracy McGrady',
      rarity: 'moments_sbc',
      ovr: 93
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'clutch-klay-thompson-37pts',
    name: 'KLAY 37-POINT QUARTER',
    description: 'Submit 4 Warriors/SG cards for Perfect Quarter Klay.',
    category: 'clutch_moments',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'SG', count: 2 },
      { type: 'MIN_OVR', value: 78 }
    ],
    reward: {
      playerName: 'Klay Thompson',
      rarity: 'moments_sbc',
      ovr: 93
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'clutch-vince-carter-2000',
    name: 'VINCE 2000 DUNK CONTEST',
    description: 'Submit 4 high vertical wing cards for Vinsanity 2000.',
    category: 'clutch_moments',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'SF', count: 2 },
      { type: 'MIN_OVR', value: 78 }
    ],
    reward: {
      playerName: 'Vince Carter',
      rarity: 'moments_sbc',
      ovr: 94
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'clutch-robert-horry',
    name: 'ROBERT HORRY BIG SHOT BOB',
    description: 'Submit 4 clutch forward cards for 7x Champ Horry.',
    category: 'clutch_moments',
    difficulty: 'silver',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'PF', count: 2 },
      { type: 'MIN_OVR', value: 75 }
    ],
    reward: {
      playerName: 'Robert Horry',
      rarity: 'moments_sbc',
      ovr: 88
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'clutch-damian-lillard-wave',
    name: 'DAME TIME WAVE GOODBYE',
    description: 'Submit 4 PG cards for Series-Ending Buzzer Beater Dame.',
    category: 'clutch_moments',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'PG', count: 2 },
      { type: 'MIN_OVR', value: 78 }
    ],
    reward: {
      playerName: 'Damian Lillard',
      rarity: 'moments_sbc',
      ovr: 92
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'clutch-reggie-miller-8in9',
    name: 'REGGIE 8 PTS IN 9 SECS',
    description: 'Submit 4 Pacers/Guard cards for MSG Stunner Reggie.',
    category: 'clutch_moments',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'SG', count: 2 },
      { type: 'MIN_OVR', value: 78 }
    ],
    reward: {
      playerName: 'Reggie Miller',
      rarity: 'moments_sbc',
      ovr: 91
    },
    isActive: true,
    cardsRequired: 5
  },
  {
    id: 'clutch-derrick-rose-50pt',
    name: 'D-ROSE 50-PT REDEMPTION',
    description: 'Submit 4 Guard cards for Tearful 50-Point Rose.',
    category: 'clutch_moments',
    difficulty: 'gold',
    type: 'permanent',
    expiresAt: null,
    requirements: [
      { type: 'TOTAL_CARDS', value: 5 },
      { type: 'POSITION', value: 'PG', count: 2 },
      { type: 'MIN_OVR', value: 78 }
    ],
    reward: {
      playerName: 'Derrick Rose',
      rarity: 'moments_sbc',
      ovr: 92
    },
    isActive: true,
    cardsRequired: 5
  }
];
