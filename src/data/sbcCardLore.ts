export interface SBCCardLore {
  englishContext: string;
  achievements: string[];
}

export const SBC_CARD_LORE: Record<string, SBCCardLore> = {
  // ROOKIE SERIES
  'LeBron James': {
    englishContext: 'Selected #1 overall by Cleveland in 2003, 18-year-old LeBron announced his arrival with 25 PTS, 9 AST, and 6 REB in his legendary debut against Sacramento.',
    achievements: ['2004 Rookie of the Year', '20.9 PPG • 5.5 RPG • 5.9 APG', '1st Team All-Rookie Selection'],
  },
  'Stephen Curry': {
    englishContext: 'Drafted 7th overall in 2009, Curry dazzled with unprecedented long-range shooting, posting 36 PTS and 13 AST in his rookie season finale.',
    achievements: ['17.5 PPG • 4.5 RPG • 5.9 APG', '166 Rookie 3-Pointers Made', 'NBA All-Rookie First Team'],
  },
  'Kobe Bryant': {
    englishContext: 'Drafted straight out of high school at age 18, Kobe showcased fearless athleticism and explosive perimeter talent during his 1996-97 debut season.',
    achievements: ['1997 Slam Dunk Champion', 'Youngest Starter in NBA History', 'NBA All-Rookie Second Team'],
  },
  'Kevin Durant': {
    englishContext: 'Selected 2nd overall by Seattle, Durant dominated as a 19-year-old scoring marvel, leading all rookies with 20.3 PPG.',
    achievements: ['2008 Rookie of the Year', '20.3 PPG • 4.4 RPG • 2.4 APG', '5x Rookie of the Month'],
  },
  'Luka Doncic': {
    englishContext: 'Arriving from EuroLeague as an 19-year-old MVP, Luka took the NBA by storm with step-back daggers and 8 rookie triple-doubles.',
    achievements: ['2019 Rookie of the Year', '21.2 PPG • 7.8 RPG • 6.0 APG', '8 Rookie Triple-Doubles'],
  },
  'Victor Wembanyama': {
    englishContext: 'The most anticipated prospect since LeBron, Wemby delivered a historic rookie campaign filled with 10-block triple-doubles and gravity-defying plays.',
    achievements: ['Unanimous ROTY (2024)', '21.4 PPG • 10.6 RPG • 3.6 BPG', 'NBA All-Defensive First Team'],
  },
  'Allen Iverson': {
    englishContext: 'The #1 pick in 1996 electrified Philadelphia with his crossover on Michael Jordan and five consecutive 40-point rookie games.',
    achievements: ['1997 Rookie of the Year', '23.5 PPG • 4.1 RPG • 7.5 APG', '5 Consecutive 40+ PT Games'],
  },
  'Michael Jordan': {
    englishContext: 'Drafted 3rd overall by Chicago, Jordan captivated global basketball with his gravity-defying verticality and 28.2 PPG rookie scoring average.',
    achievements: ['1985 Rookie of the Year', '28.2 PPG • 6.5 RPG • 5.9 APG', 'All-NBA Second Team as Rookie'],
  },
  'Magic Johnson': {
    englishContext: 'Magic led the Lakers to the 1980 NBA Championship as a rookie, starting at Center in Game 6 of the Finals with 42 PTS, 15 REB, and 7 AST.',
    achievements: ['NBA Champion & Finals MVP', '18.0 PPG • 7.7 RPG • 7.3 APG', 'Finals Game 6 Legend (42 PTS)'],
  },
  "Shaquille O'Neal": {
    englishContext: 'Shaq shattered backboards and opponents during his 1992-93 Orlando debut, taking the league by storm with unmatched strength and agility.',
    achievements: ['1993 Rookie of the Year', '23.4 PPG • 13.9 RPG • 3.5 BPG', 'All-Star Starter as Rookie'],
  },

  // FAN FAVOURITES
  'Isaiah Thomas': {
    englishContext: 'The 5\'9" guard ignited TD Garden in 2017 with legendary 4th quarter scoring bursts, finishing 5th in MVP voting with 28.9 PPG.',
    achievements: ['2017 All-NBA Second Team', '53-Point Playoff Performance', '2x NBA All-Star Selection'],
  },
  'Alex Caruso': {
    englishContext: 'From undrafted G-League grinding to defensive anchor for the 2020 Champion Lakers, Caruso earned universal fan adoration through pure hustle.',
    achievements: ['2020 NBA Champion', '2x All-Defensive Team', 'Fan Favorite Cult Icon'],
  },
  'Derrick Rose': {
    englishContext: 'The youngest MVP in NBA history captured the hearts of fans worldwide through resilient comeback performances and an unforgettable 50-point explosion.',
    achievements: ['2011 Regular Season MVP', '50-Point Career High Game', '3x NBA All-Star Selection'],
  },
  'Lance Stephenson': {
    englishContext: 'Celebrated for his unpredictable energy, triple-double versatility, and legendary playoff showdowns in Indiana.',
    achievements: ['2014 NBA Assists Leader', '5 Triple-Doubles in 2013-14', 'Pacers Fan Legend'],
  },
  'Boban Marjanovic': {
    englishContext: 'Standing 7\'4" with unmatched efficiency per minute, Boban became basketball\'s most beloved personality and locker room treasure.',
    achievements: ['Per-36 Efficiency Record', 'PER Leader in 2018-19', 'Global Fan Favorite'],
  },
  'Manu Ginobili': {
    englishContext: 'The Argentine maestro popularized the Eurostep and sacrificed starting roles to orchestrate 4 Championship runs for San Antonio.',
    achievements: ['4x NBA Champion', '2008 Sixth Man of the Year', 'Hall of Fame Class of 2022'],
  },
  'Udonis Haslem': {
    englishContext: 'Undrafted out of Florida, Haslem spent 20 seasons as the heart, soul, and vocal leader of the Miami Heat franchise.',
    achievements: ['3x NBA Champion', 'Heat All-Time Rebound Leader', '20-Year Miami Heat Captain'],
  },
  'Patrick Beverley': {
    englishContext: 'A relentless perimeter defender who fought his way from European leagues into an All-Defensive enforcer in the NBA.',
    achievements: ['3x All-Defensive Selection', '2017 Hustle Award Winner', 'Defensive Intensity Leader'],
  },
  'Jamal Crawford': {
    englishContext: 'One of the most creative ball-handlers in basketball history, famous for streetball crossovers and bench scoring brilliance.',
    achievements: ['3x Sixth Man of the Year', '51-Point Game at Age 39', '4x Four-Point Play Leader'],
  },
  'Jeremy Lin': {
    englishContext: 'In February 2012, an undrafted guard out of Harvard mesmerized the world with an unmatched 2-week scoring streak at Madison Square Garden.',
    achievements: ['Linsanity MSG Legend', '38 PTS vs Lakers at MSG', '2019 NBA Champion'],
  },

  // HOF LEGENDS
  'Kareem Abdul-Jabbar': {
    englishContext: 'Unstoppable for two decades, Kareem mastered the skyhook—the most unblockable shot in basketball history—to claim 6 MVPs and 6 Championships.',
    achievements: ['6x NBA Champion • 6x MVP', '38,387 Career Points', '19x NBA All-Star Selection'],
  },
  'Larry Bird': {
    englishContext: 'The legendary Celtics forward dominated the 1980s with supreme court vision, lethal clutch shooting, and three consecutive MVP trophies.',
    achievements: ['3x Consecutive MVP (1984-86)', '3x NBA Champion • 2x Finals MVP', '12x NBA All-Star Selection'],
  },
  'Hakeem Olajuwon': {
    englishContext: 'Possessing footwork perfected in soccer and basketball, Hakeem anchored Houston to back-to-back championships with the Dream Shake.',
    achievements: ['2x NBA Champion & Finals MVP', '1994 NBA MVP & DPOY', 'NBA All-Time Blocks Leader'],
  },
  'Tim Duncan': {
    englishContext: 'The cornerstone of Spurs basketball for 19 seasons, Duncan quietly amassed 5 titles through flawless post play and elite rim protection.',
    achievements: ['5x NBA Champion • 3x Finals MVP', '2x Regular Season MVP', '15x All-NBA & All-Defensive'],
  },
  'Wilt Chamberlain': {
    englishContext: 'The most statistically dominant athlete in sports history, Wilt once averaged 50.4 PPG in a season and scored 100 points in a single game.',
    achievements: ['100-Point Single Game Record', '50.4 PPG Season Average', '2x NBA Champion • 4x MVP'],
  },
  'Bill Russell': {
    englishContext: 'The ultimate winner in team sports, Russell led the Boston Celtics to 11 NBA Championships in 13 seasons through defensive leadership.',
    achievements: ['11x NBA Champion in 13 Years', '5x Regular Season MVP', 'Finals MVP Trophy Named After Him'],
  },

  // FRANCHISE ICONS
  'Dirk Nowitzki': {
    englishContext: 'Dirk led one of the most heroic championship runs in NBA history, defeating the Big 3 Heat with his iconic one-legged fadeaway jumper.',
    achievements: ['2011 NBA Champion & Finals MVP', '2007 NBA MVP (31,560 Pts)', '14x NBA All-Star Selection'],
  },
  'Dwyane Wade': {
    englishContext: 'Wade carried Miami to its first NBA title in 2006 with a legendary Finals performance, averaging 34.7 PPG against Dallas.',
    achievements: ['3x NBA Champion • 2006 Finals MVP', '2009 NBA Scoring Leader', 'Miami Heat All-Time Scorer'],
  },
  'Giannis Antetokounmpo': {
    englishContext: 'Rising from Greek third division to NBA Finals MVP, Giannis delivered 50 points in Game 6 to bring Milwaukee its first ring in 50 years.',
    achievements: ['2021 NBA Champion & Finals MVP', '2x Regular Season MVP', '2020 Defensive Player of Year'],
  },
  'Nikola Jokic': {
    englishContext: 'Drafted during a commercial break, Jokic transformed into the most uniquely dominant offensive center in history, leading Denver to a title.',
    achievements: ['2023 NBA Champion & Finals MVP', '3x Regular Season MVP', 'Playoff Triple-Double Record'],
  },
  'Damian Lillard': {
    englishContext: 'The heart of Portland for a decade, Dame sank two series-ending buzzer-beaters and set franchise scoring marks with ice in his veins.',
    achievements: ['2x Series-Ending Buzzer Beaters', '71-Point Single Game High', '7x All-NBA Selection'],
  },
  'Reggie Miller': {
    englishContext: 'The cold-blooded perimeter assassin who broke Knicks hearts and held the all-time 3-pointers record for over a decade.',
    achievements: ['8 Points in 9 Seconds Hero', '2,560 Career 3-Pointers', 'Hall of Fame Class of 2012'],
  },
  'Patrick Ewing': {
    englishContext: 'The heart and anchor of New York Knicks basketball throughout the 1990s, renowned for fierce interior defense and baseline jumpers.',
    achievements: ['11x NBA All-Star Selection', 'Knicks All-Time Scoring Leader', '1986 Rookie of the Year'],
  },
  'Paul Pierce': {
    englishContext: 'A fearless perimeter scorer who captured 2008 Finals MVP honors after leading Boston to a championship over the arch-rival Lakers.',
    achievements: ['2008 NBA Champion & Finals MVP', '10x NBA All-Star Selection', '24,000+ Career Points'],
  },

  // HIDDEN GEMS
  'Ben Wallace': {
    englishContext: 'Undrafted in 1996 out of Virginia Union, Big Ben anchored Detroit’s 2004 championship defense and became a 4-time NBA Defensive Player of the Year.',
    achievements: ['4x NBA Defensive Player of Year', '2004 NBA Champion', 'Hall of Fame Class of 2021'],
  },
  'Fred VanVleet': {
    englishContext: 'Betting on himself after going undrafted in 2016, FVV climbed to NBA Champion with Toronto, an All-Star nod, and an undrafted record 54 points.',
    achievements: ['2019 NBA Champion', '2022 NBA All-Star Selection', '54-Point Undrafted Record'],
  },
  'Austin Reaves': {
    englishContext: 'Going undrafted by design in 2021 to join the Lakers, Reaves quickly established himself as a high-IQ playmaker and fearless 4th-quarter clutch performer.',
    achievements: ['2023 In-Season Tournament Champion', '2023 Team USA World Cup', 'Breakout Playoff Playmaker'],
  },
  'Draymond Green': {
    englishContext: 'Selected 35th overall in the 2nd round, Draymond became the vocal leader, defensive maestro, and 4-time champion anchor of the Golden State dynasty.',
    achievements: ['4x NBA Champion', '2017 Defensive Player of Year', '8x NBA All-Defensive Selection'],
  },
  'Marc Gasol': {
    englishContext: 'Drafted 48th overall, Marc transformed into the Grit & Grind defensive anchor, 2013 DPOY, 3-time All-Star, and 2019 NBA Champion with Toronto.',
    achievements: ['2013 Defensive Player of Year', '2019 NBA Champion', '3x NBA All-Star Selection'],
  },
  'Dennis Rodman': {
    englishContext: 'Overlooked in high school and drafted in the 2nd round, The Worm became the fiercest rebounder and lockdown defensive forward in NBA history.',
    achievements: ['5x NBA Champion', '2x Defensive Player of Year', '7x NBA Rebound Champion'],
  },

  // CLUTCH MOMENTS
  'Ray Allen': {
    englishContext: 'Down 3 with 5.2 seconds left in Game 6 of the 2013 Finals, Ray Allen hit the most clutch corner 3-pointer in NBA history to save Miami.',
    achievements: ['Game 6 Series-Saving 3-Pointer', '2x NBA Champion', 'Former All-Time 3PT Leader'],
  },
  'Kyrie Irving': {
    englishContext: 'Tied 89-89 with 53 seconds remaining in Game 7 of the 2016 Finals, Kyrie drained a step-back 3-pointer over Curry to complete the 3-1 comeback.',
    achievements: ['2016 NBA Champion', 'Game 7 Championship Winner', '8x NBA All-Star Selection'],
  },
  'Kawhi Leonard': {
    englishContext: 'In Game 7 of the 2019 ECSF against Philly, Kawhi hit the first series-ending buzzer-beater in Game 7 history with four rim bounces.',
    achievements: ['Game 7 Quadruple Bounce Winner', '2x NBA Champion & Finals MVP', '2x Defensive Player of Year'],
  },
  'Tracy McGrady': {
    englishContext: 'On December 9, 2004, T-Mac performed an impossible miracle against San Antonio, scoring 13 points in 33 seconds with four 3-pointers.',
    achievements: ['13 Points in 33 Seconds', '2x NBA Scoring Champion', '7x All-NBA Selection'],
  },
  'Klay Thompson': {
    englishContext: 'On January 23, 2015, Klay delivered the greatest single-quarter scoring explosion in NBA history, going 13-of-13 for 37 PTS in 12 minutes.',
    achievements: ['37-Point Single Quarter Record', '4x NBA Champion', '14 3-Pointers in Single Game'],
  },
  'Vince Carter': {
    englishContext: 'Vince Carter shut down Oakland at the 2000 Dunk Contest, executing the elbow hang and 360 windmill dunks that changed dunking forever.',
    achievements: ['2000 Dunk Contest Champion', '8x NBA All-Star Selection', '25,000+ Career Points'],
  },
  'Robert Horry': {
    englishContext: 'With 7 Championship rings across 3 different teams, Horry earned his title as the greatest role-player clutch shooter in league history.',
    achievements: ['7x NBA Champion', 'Game 4 Finals Winner vs Kings', '16 Playoff Game-Winners'],
  },
};

export const getLoreForPlayer = (playerName: string): SBCCardLore => {
  if (SBC_CARD_LORE[playerName]) {
    return SBC_CARD_LORE[playerName];
  }
  return {
    englishContext: `Special edition SBC collectible card honoring ${playerName}'s memorable achievements and legacy in the NBA.`,
    achievements: [`SBC Special Edition`, `NBA Superstar`, `Authentic Collectible`],
  };
};
