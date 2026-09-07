import sys

raw_data = """MVP,1979-80,Kareem Abdul-Jabbar,Los Angeles Lakers
MVP,1980-81,Julius Erving,Philadelphia 76ers
MVP,1981-82,Moses Malone,Houston Rockets
MVP,1982-83,Moses Malone,Philadelphia 76ers
MVP,1983-84,Larry Bird,Boston Celtics
MVP,1984-85,Larry Bird,Boston Celtics
MVP,1985-86,Larry Bird,Boston Celtics
MVP,1986-87,Magic Johnson,Los Angeles Lakers
MVP,1987-88,Michael Jordan,Chicago Bulls
MVP,1988-89,Magic Johnson,Los Angeles Lakers
MVP,1989-90,Magic Johnson,Los Angeles Lakers
MVP,1990-91,Michael Jordan,Chicago Bulls
MVP,1991-92,Michael Jordan,Chicago Bulls
MVP,1992-93,Charles Barkley,Phoenix Suns
MVP,1993-94,Hakeem Olajuwon,Houston Rockets
MVP,1994-95,David Robinson,San Antonio Spurs
MVP,1995-96,Michael Jordan,Chicago Bulls
MVP,1996-97,Karl Malone,Utah Jazz
MVP,1997-98,Michael Jordan,Chicago Bulls
MVP,1998-99,Karl Malone,Utah Jazz
MVP,1999-00,Shaquille O'Neal,Los Angeles Lakers
MVP,2000-01,Allen Iverson,Philadelphia 76ers
MVP,2001-02,Tim Duncan,San Antonio Spurs
MVP,2002-03,Tim Duncan,San Antonio Spurs
MVP,2003-04,Kevin Garnett,Minnesota Timberwolves
MVP,2004-05,Steve Nash,Phoenix Suns
MVP,2005-06,Steve Nash,Phoenix Suns
MVP,2006-07,Dirk Nowitzki,Dallas Mavericks
MVP,2007-08,Kobe Bryant,Los Angeles Lakers
MVP,2008-09,LeBron James,Cleveland Cavaliers
MVP,2009-10,LeBron James,Cleveland Cavaliers
MVP,2010-11,Derrick Rose,Chicago Bulls
MVP,2011-12,LeBron James,Miami Heat
MVP,2012-13,LeBron James,Miami Heat
MVP,2013-14,Kevin Durant,Oklahoma City Thunder
MVP,2014-15,Stephen Curry,Golden State Warriors
MVP,2015-16,Stephen Curry,Golden State Warriors
MVP,2016-17,Russell Westbrook,Oklahoma City Thunder
MVP,2017-18,James Harden,Houston Rockets
MVP,2018-19,Giannis Antetokounmpo,Milwaukee Bucks
MVP,2019-20,Giannis Antetokounmpo,Milwaukee Bucks
MVP,2020-21,Nikola Jokic,Denver Nuggets
MVP,2021-22,Nikola Jokic,Denver Nuggets
MVP,2022-23,Joel Embiid,Philadelphia 76ers
MVP,2023-24,Nikola Jokic,Denver Nuggets
MVP,2024-25,Shai Gilgeous-Alexander,Oklahoma City Thunder
MVP,2025-26,Shai Gilgeous-Alexander,Oklahoma City Thunder
Finals_MVP,1980,Magic Johnson,Los Angeles Lakers
Finals_MVP,1981,Cedric Maxwell,Boston Celtics
Finals_MVP,1982,Magic Johnson,Los Angeles Lakers
Finals_MVP,1983,Moses Malone,Philadelphia 76ers
Finals_MVP,1984,Larry Bird,Boston Celtics
Finals_MVP,1985,Kareem Abdul-Jabbar,Los Angeles Lakers
Finals_MVP,1986,Larry Bird,Boston Celtics
Finals_MVP,1987,Magic Johnson,Los Angeles Lakers
Finals_MVP,1988,James Worthy,Los Angeles Lakers
Finals_MVP,1989,Joe Dumars,Detroit Pistons
Finals_MVP,1990,Isiah Thomas,Detroit Pistons
Finals_MVP,1991,Michael Jordan,Chicago Bulls
Finals_MVP,1992,Michael Jordan,Chicago Bulls
Finals_MVP,1993,Michael Jordan,Chicago Bulls
Finals_MVP,1994,Hakeem Olajuwon,Houston Rockets
Finals_MVP,1995,Hakeem Olajuwon,Houston Rockets
Finals_MVP,1996,Michael Jordan,Chicago Bulls
Finals_MVP,1997,Michael Jordan,Chicago Bulls
Finals_MVP,1998,Michael Jordan,Chicago Bulls
Finals_MVP,1999,Tim Duncan,San Antonio Spurs
Finals_MVP,2000,Shaquille O'Neal,Los Angeles Lakers
Finals_MVP,2001,Shaquille O'Neal,Los Angeles Lakers
Finals_MVP,2002,Shaquille O'Neal,Los Angeles Lakers
Finals_MVP,2003,Tim Duncan,San Antonio Spurs
Finals_MVP,2004,Chauncey Billups,Detroit Pistons
Finals_MVP,2005,Tim Duncan,San Antonio Spurs
Finals_MVP,2006,Dwyane Wade,Miami Heat
Finals_MVP,2007,Tony Parker,San Antonio Spurs
Finals_MVP,2008,Paul Pierce,Boston Celtics
Finals_MVP,2009,Kobe Bryant,Los Angeles Lakers
Finals_MVP,2010,Kobe Bryant,Los Angeles Lakers
Finals_MVP,2011,Dirk Nowitzki,Dallas Mavericks
Finals_MVP,2012,LeBron James,Miami Heat
Finals_MVP,2013,LeBron James,Miami Heat
Finals_MVP,2014,Kawhi Leonard,San Antonio Spurs
Finals_MVP,2015,Andre Iguodala,Golden State Warriors
Finals_MVP,2016,LeBron James,Cleveland Cavaliers
Finals_MVP,2017,Kevin Durant,Golden State Warriors
Finals_MVP,2018,Kevin Durant,Golden State Warriors
Finals_MVP,2019,Kawhi Leonard,Toronto Raptors
Finals_MVP,2020,LeBron James,Los Angeles Lakers
Finals_MVP,2021,Giannis Antetokounmpo,Milwaukee Bucks
Finals_MVP,2022,Stephen Curry,Golden State Warriors
Finals_MVP,2023,Nikola Jokic,Denver Nuggets
Finals_MVP,2024,Jaylen Brown,Boston Celtics
Finals_MVP,2025,Shai Gilgeous-Alexander,Oklahoma City Thunder
DPOY,1982-83,Sidney Moncrief,Milwaukee Bucks
DPOY,1983-84,Sidney Moncrief,Milwaukee Bucks
DPOY,1984-85,Mark Eaton,Utah Jazz
DPOY,1985-86,Alvin Robertson,San Antonio Spurs
DPOY,1986-87,Michael Cooper,Los Angeles Lakers
DPOY,1987-88,Michael Jordan,Chicago Bulls
DPOY,1988-89,Mark Eaton,Utah Jazz
DPOY,1989-90,Dennis Rodman,Detroit Pistons
DPOY,1990-91,Dennis Rodman,Detroit Pistons
DPOY,1991-92,David Robinson,San Antonio Spurs
DPOY,1992-93,Hakeem Olajuwon,Houston Rockets
DPOY,1993-94,Hakeem Olajuwon,Houston Rockets
DPOY,1994-95,Dikembe Mutombo,Denver Nuggets
DPOY,1995-96,Gary Payton,Seattle SuperSonics
DPOY,1996-97,Dikembe Mutombo,Atlanta Hawks
DPOY,1997-98,Dikembe Mutombo,Atlanta Hawks
DPOY,1998-99,Alonzo Mourning,Miami Heat
DPOY,1999-00,Alonzo Mourning,Miami Heat
DPOY,2000-01,Dikembe Mutombo,Philadelphia 76ers
DPOY,2001-02,Ben Wallace,Detroit Pistons
DPOY,2002-03,Ben Wallace,Detroit Pistons
DPOY,2003-04,Ron Artest,Indiana Pacers
DPOY,2004-05,Ben Wallace,Detroit Pistons
DPOY,2005-06,Ben Wallace,Detroit Pistons
DPOY,2006-07,Marcus Camby,Denver Nuggets
DPOY,2007-08,Kevin Garnett,Boston Celtics
DPOY,2008-09,Dwight Howard,Orlando Magic
DPOY,2009-10,Dwight Howard,Orlando Magic
DPOY,2010-11,Dwight Howard,Orlando Magic
DPOY,2011-12,Tyson Chandler,New York Knicks
DPOY,2012-13,Marc Gasol,Memphis Grizzlies
DPOY,2013-14,Joakim Noah,Chicago Bulls
DPOY,2014-15,Kawhi Leonard,San Antonio Spurs
DPOY,2015-16,Kawhi Leonard,San Antonio Spurs
DPOY,2016-17,Draymond Green,Golden State Warriors
DPOY,2017-18,Rudy Gobert,Utah Jazz
DPOY,2018-19,Rudy Gobert,Utah Jazz
DPOY,2019-20,Giannis Antetokounmpo,Milwaukee Bucks
DPOY,2020-21,Rudy Gobert,Utah Jazz
DPOY,2021-22,Marcus Smart,Boston Celtics
DPOY,2022-23,Jaren Jackson Jr.,Memphis Grizzlies
DPOY,2023-24,Rudy Gobert,Minnesota Timberwolves
DPOY,2024-25,Evan Mobley,Cleveland Cavaliers
DPOY,2025-26,Victor Wembanyama,San Antonio Spurs
ROY,1979-80,Larry Bird,Boston Celtics
ROY,1980-81,Darrell Griffith,Utah Jazz
ROY,1981-82,Buck Williams,New Jersey Nets
ROY,1982-83,Terry Cummings,San Diego Clippers
ROY,1983-84,Ralph Sampson,Houston Rockets
ROY,1984-85,Michael Jordan,Chicago Bulls
ROY,1985-86,Patrick Ewing,New York Knicks
ROY,1986-87,Chuck Person,Indiana Pacers
ROY,1987-88,Mark Jackson,New York Knicks
ROY,1988-89,Mitch Richmond,Golden State Warriors
ROY,1989-90,David Robinson,San Antonio Spurs
ROY,1990-91,Derrick Coleman,New Jersey Nets
ROY,1991-92,Larry Johnson,Charlotte Hornets
ROY,1992-93,Shaquille O'Neal,Orlando Magic
ROY,1993-94,Chris Webber,Golden State Warriors
ROY,1994-95,Grant Hill / Jason Kidd,Detroit Pistons / Dallas Mavericks
ROY,1995-96,Damon Stoudamire,Toronto Raptors
ROY,1996-97,Allen Iverson,Philadelphia 76ers
ROY,1997-98,Tim Duncan,San Antonio Spurs
ROY,1998-99,Vince Carter,Toronto Raptors
ROY,1999-00,Elton Brand / Steve Francis,Chicago Bulls / Houston Rockets
ROY,2000-01,Mike Miller,Orlando Magic
ROY,2001-02,Pau Gasol,Memphis Grizzlies
ROY,2002-03,Amare Stoudemire,Phoenix Suns
ROY,2003-04,LeBron James,Cleveland Cavaliers
ROY,2004-05,Emeka Okafor,Charlotte Bobcats
ROY,2005-06,Chris Paul,New Orleans/OKC Hornets
ROY,2006-07,Brandon Roy,Portland Trail Blazers
ROY,2007-08,Kevin Durant,Seattle SuperSonics
ROY,2008-09,Derrick Rose,Chicago Bulls
ROY,2009-10,Tyreke Evans,Sacramento Kings
ROY,2010-11,Blake Griffin,Los Angeles Clippers
ROY,2011-12,Kyrie Irving,Cleveland Cavaliers
ROY,2012-13,Damian Lillard,Portland Trail Blazers
ROY,2013-14,Michael Carter-Williams,Philadelphia 76ers
ROY,2014-15,Andrew Wiggins,Minnesota Timberwolves
ROY,2015-16,Karl-Anthony Towns,Minnesota Timberwolves
ROY,2016-17,Malcolm Brogdon,Milwaukee Bucks
ROY,2017-18,Ben Simmons,Philadelphia 76ers
ROY,2018-19,Luka Doncic,Dallas Mavericks
ROY,2019-20,Ja Morant,Memphis Grizzlies
ROY,2020-21,LaMelo Ball,Charlotte Hornets
ROY,2021-22,Scottie Barnes,Toronto Raptors
ROY,2022-23,Paolo Banchero,Orlando Magic
ROY,2023-24,Victor Wembanyama,San Antonio Spurs
ROY,2024-25,Stephon Castle,San Antonio Spurs
ROY,2025-26,Cooper Flagg,Dallas Mavericks
6MOTY,1982-83,Bobby Jones,Philadelphia 76ers
6MOTY,1983-84,Kevin McHale,Boston Celtics
6MOTY,1984-85,Kevin McHale,Boston Celtics
6MOTY,1985-86,Bill Walton,Boston Celtics
6MOTY,1986-87,Ricky Pierce,Milwaukee Bucks
6MOTY,1987-88,Roy Tarpley,Dallas Mavericks
6MOTY,1988-89,Eddie Johnson,Phoenix Suns
6MOTY,1989-90,Ricky Pierce,Milwaukee Bucks
6MOTY,1990-91,Detlef Schrempf,Indiana Pacers
6MOTY,1991-92,Detlef Schrempf,Indiana Pacers
6MOTY,1992-93,Clifford Robinson,Portland Trail Blazers
6MOTY,1993-94,Dell Curry,Charlotte Hornets
6MOTY,1994-95,Anthony Mason,New York Knicks
6MOTY,1995-96,Toni Kukoc,Chicago Bulls
6MOTY,1996-97,John Starks,New York Knicks
6MOTY,1997-98,Danny Manning,Phoenix Suns
6MOTY,1998-99,Darrell Armstrong,Orlando Magic
6MOTY,1999-00,Rodney Rogers,Phoenix Suns
6MOTY,2000-01,Aaron McKie,Philadelphia 76ers
6MOTY,2001-02,Corliss Williamson,Detroit Pistons
6MOTY,2002-03,Bobby Jackson,Sacramento Kings
6MOTY,2003-04,Antawn Jamison,Dallas Mavericks
6MOTY,2004-05,Ben Gordon,Chicago Bulls
6MOTY,2005-06,Mike Miller,Memphis Grizzlies
6MOTY,2006-07,Leandro Barbosa,Phoenix Suns
6MOTY,2007-08,Manu Ginobili,San Antonio Spurs
6MOTY,2008-09,Jason Terry,Dallas Mavericks
6MOTY,2009-10,Jamal Crawford,Atlanta Hawks
6MOTY,2010-11,Lamar Odom,Los Angeles Lakers
6MOTY,2011-12,James Harden,Oklahoma City Thunder
6MOTY,2012-13,J.R. Smith,New York Knicks
6MOTY,2013-14,Jamal Crawford,Los Angeles Clippers
6MOTY,2014-15,Lou Williams,Toronto Raptors
6MOTY,2015-16,Jamal Crawford,Los Angeles Clippers
6MOTY,2016-17,Eric Gordon,Houston Rockets
6MOTY,2017-18,Lou Williams,Los Angeles Clippers
6MOTY,2018-19,Lou Williams,Los Angeles Clippers
6MOTY,2019-20,Montrezl Harrell,Los Angeles Clippers
6MOTY,2020-21,Jordan Clarkson,Utah Jazz
6MOTY,2021-22,Tyler Herro,Miami Heat
6MOTY,2022-23,Malcolm Brogdon,Boston Celtics
6MOTY,2023-24,Naz Reid,Minnesota Timberwolves
6MOTY,2024-25,Payton Pritchard,Boston Celtics
6MOTY,2025-26,Keldon Johnson,San Antonio Spurs
MIP,1985-86,Alvin Robertson,San Antonio Spurs
MIP,1986-87,Dale Ellis,Seattle SuperSonics
MIP,1987-88,Kevin Duckworth,Portland Trail Blazers
MIP,1988-89,Kevin Johnson,Phoenix Suns
MIP,1989-90,Rony Seikaly,Miami Heat
MIP,1990-91,Scott Skiles,Orlando Magic
MIP,1991-92,Pervis Ellison,Washington Bullets
MIP,1992-93,Chris Jackson,Denver Nuggets
MIP,1993-94,Don MacLean,Washington Bullets
MIP,1994-95,Dana Barros,Philadelphia 76ers
MIP,1995-96,Gheorghe Muresan,Washington Bullets
MIP,1996-97,Isaac Austin,Miami Heat
MIP,1997-98,Alan Henderson,Atlanta Hawks
MIP,1998-99,Darrell Armstrong,Orlando Magic
MIP,1999-00,Jalen Rose,Indiana Pacers
MIP,2000-01,Tracy McGrady,Orlando Magic
MIP,2001-02,Jermaine O'Neal,Indiana Pacers
MIP,2002-03,Gilbert Arenas,Golden State Warriors
MIP,2003-04,Zach Randolph,Portland Trail Blazers
MIP,2004-05,Bobby Simmons,Los Angeles Clippers
MIP,2005-06,Boris Diaw,Phoenix Suns
MIP,2006-07,Monta Ellis,Golden State Warriors
MIP,2007-08,Hedo Turkoglu,Orlando Magic
MIP,2008-09,Danny Granger,Indiana Pacers
MIP,2009-10,Aaron Brooks,Houston Rockets
MIP,2010-11,Kevin Love,Minnesota Timberwolves
MIP,2011-12,Ryan Anderson,Orlando Magic
MIP,2012-13,Paul George,Indiana Pacers
MIP,2013-14,Goran Dragic,Phoenix Suns
MIP,2014-15,Jimmy Butler,Chicago Bulls
MIP,2015-16,CJ McCollum,Portland Trail Blazers
MIP,2016-17,Giannis Antetokounmpo,Milwaukee Bucks
MIP,2017-18,Victor Oladipo,Indiana Pacers
MIP,2018-19,Pascal Siakam,Toronto Raptors
MIP,2019-20,Brandon Ingram,New Orleans Pelicans
MIP,2020-21,Julius Randle,New York Knicks
MIP,2021-22,Ja Morant,Memphis Grizzlies
MIP,2022-23,Lauri Markkanen,Utah Jazz
MIP,2023-24,Tyrese Maxey,Philadelphia 76ers
MIP,2024-25,Dyson Daniels,Atlanta Hawks
MIP,2025-26,Nickeil Alexander-Walker,Atlanta Hawks"""

teams_map = {
  'Los Angeles Lakers': ('LAL', 78),
  'Philadelphia 76ers': ('PHI', 80),
  'Houston Rockets': ('HOU', 82),
  'Boston Celtics': ('BOS', 79),
  'Chicago Bulls': ('CHI', 81),
  'Phoenix Suns': ('PHX', 83),
  'San Antonio Spurs': ('SAS', 84),
  'Utah Jazz': ('UTA', 85),
  'Minnesota Timberwolves': ('MIN', 86),
  'Dallas Mavericks': ('DAL', 87),
  'Cleveland Cavaliers': ('CLE', 88),
  'Miami Heat': ('MIA', 89),
  'Oklahoma City Thunder': ('OKC', 90),
  'Golden State Warriors': ('GSW', 91),
  'Milwaukee Bucks': ('MIL', 92),
  'Denver Nuggets': ('DEN', 93),
  'Detroit Pistons': ('DET', 94),
  'Toronto Raptors': ('TOR', 95),
  'New Jersey Nets': ('BKN', 96),
  'Brooklyn Nets': ('BKN', 96),
  'San Diego Clippers': ('LAC', 97),
  'Los Angeles Clippers': ('LAC', 97),
  'LA Clippers': ('LAC', 97),
  'New York Knicks': ('NYK', 98),
  'Indiana Pacers': ('IND', 99),
  'Charlotte Hornets': ('CHA', 100),
  'Charlotte Bobcats': ('CHA', 100),
  'New Orleans/OKC Hornets': ('NOP', 101),
  'New Orleans Pelicans': ('NOP', 101),
  'Sacramento Kings': ('SAC', 102),
  'Atlanta Hawks': ('ATL', 103),
  'Washington Bullets': ('WAS', 104),
  'Washington Wizards': ('WAS', 104),
  'Seattle SuperSonics': ('OKC', 105),
  'Orlando Magic': ('ORL', 106),
  'Portland Trail Blazers': ('POR', 107),
  'Memphis Grizzlies': ('MEM', 108),
}

nba_ids = {
  "Kareem Abdul-Jabbar": 76003, "Julius Erving": 76681, "Moses Malone": 77449,
  "Larry Bird": 1449, "Magic Johnson": 77142, "Michael Jordan": 893,
  "Charles Barkley": 787, "Hakeem Olajuwon": 341, "David Robinson": 50,
  "Karl Malone": 252, "Shaquille O'Neal": 406, "Allen Iverson": 947,
  "Tim Duncan": 1495, "Kevin Garnett": 708, "Steve Nash": 959,
  "Dirk Nowitzki": 1717, "Kobe Bryant": 977, "LeBron James": 2544,
  "Derrick Rose": 201565, "Kevin Durant": 201142, "Stephen Curry": 201939,
  "Russell Westbrook": 201566, "James Harden": 201935, "Giannis Antetokounmpo": 203507,
  "Nikola Jokic": 203999, "Joel Embiid": 203954, "Shai Gilgeous-Alexander": 1628983,
  "Cedric Maxwell": 77484, "James Worthy": 78600, "Joe Dumars": 422,
  "Isiah Thomas": 78318, "Chauncey Billups": 1497, "Dwyane Wade": 2548,
  "Tony Parker": 2225, "Paul Pierce": 1718, "Kawhi Leonard": 202695,
  "Andre Iguodala": 2738, "Jaylen Brown": 1627759, "Sidney Moncrief": 77626,
  "Mark Eaton": 76635, "Alvin Robertson": 78000, "Michael Cooper": 76442,
  "Dennis Rodman": 23, "Dikembe Mutombo": 87, "Gary Payton": 56,
  "Alonzo Mourning": 297, "Ben Wallace": 1112, "Ron Artest": 1897,
  "Marcus Camby": 952, "Dwight Howard": 2730, "Tyson Chandler": 2199,
  "Marc Gasol": 201188, "Joakim Noah": 201149, "Draymond Green": 203110,
  "Rudy Gobert": 203497, "Marcus Smart": 203935, "Jaren Jackson Jr.": 1628991,
  "Evan Mobley": 1630596, "Victor Wembanyama": 1641705, "Darrell Griffith": 76882,
  "Buck Williams": 78536, "Terry Cummings": 76490, "Ralph Sampson": 78048,
  "Patrick Ewing": 333, "Chuck Person": 77839, "Mark Jackson": 396,
  "Mitch Richmond": 222, "Derrick Coleman": 276, "Larry Johnson": 240,
  "Chris Webber": 185, "Grant Hill": 255, "Jason Kidd": 467,
  "Damon Stoudamire": 711, "Vince Carter": 1713, "Elton Brand": 1882,
  "Steve Francis": 1883, "Mike Miller": 2034, "Pau Gasol": 2200,
  "Amare Stoudemire": 2405, "Emeka Okafor": 2731, "Chris Paul": 101108,
  "Brandon Roy": 200750, "Tyreke Evans": 201936, "Blake Griffin": 201933,
  "Kyrie Irving": 202681, "Damian Lillard": 203081, "Michael Carter-Williams": 203487,
  "Andrew Wiggins": 203952, "Karl-Anthony Towns": 1626157, "Malcolm Brogdon": 1627763,
  "Ben Simmons": 1627732, "Luka Doncic": 1629029, "Ja Morant": 1629630,
  "LaMelo Ball": 1630163, "Scottie Barnes": 1630567, "Paolo Banchero": 1631094,
  "Stephon Castle": 1642264, "Cooper Flagg": 1642260, "Bobby Jones": 77170,
  "Kevin McHale": 77519, "Bill Walton": 78453, "Ricky Pierce": 77852,
  "Roy Tarpley": 78285, "Eddie Johnson": 361, "Detlef Schrempf": 224,
  "Clifford Robinson": 210, "Dell Curry": 382, "Anthony Mason": 393,
  "Toni Kukoc": 1431, "John Starks": 242, "Danny Manning": 384,
  "Darrell Armstrong": 353, "Rodney Rogers": 212, "Aaron McKie": 243,
  "Corliss Williamson": 703, "Bobby Jackson": 1715, "Antawn Jamison": 1712,
  "Ben Gordon": 2732, "Leandro Barbosa": 2571, "Manu Ginobili": 1938,
  "Jason Terry": 1891, "Jamal Crawford": 2037, "Lamar Odom": 1885,
  "J.R. Smith": 2747, "Lou Williams": 101150, "Eric Gordon": 201569,
  "Montrezl Harrell": 1626149, "Jordan Clarkson": 203903, "Tyler Herro": 1629639,
  "Naz Reid": 1629675, "Payton Pritchard": 1630202, "Keldon Johnson": 1629640,
  "Dale Ellis": 389, "Kevin Duckworth": 108, "Kevin Johnson": 422,
  "Rony Seikaly": 284, "Scott Skiles": 147, "Pervis Ellison": 388,
  "Chris Jackson": 685, "Don MacLean": 686, "Dana Barros": 241,
  "Gheorghe Muresan": 172, "Isaac Austin": 689, "Alan Henderson": 689,
  "Jalen Rose": 247, "Tracy McGrady": 1503, "Jermaine O'Neal": 979,
  "Gilbert Arenas": 2240, "Zach Randolph": 2216, "Bobby Simmons": 2223,
  "Boris Diaw": 2564, "Monta Ellis": 101145, "Hedo Turkoglu": 2045,
  "Danny Granger": 101122, "Aaron Brooks": 201166, "Kevin Love": 201567,
  "Ryan Anderson": 201583, "Paul George": 202331, "Goran Dragic": 201609,
  "Jimmy Butler": 202710, "CJ McCollum": 203468, "Victor Oladipo": 203506,
  "Pascal Siakam": 1627783, "Brandon Ingram": 1627742, "Julius Randle": 203944,
  "Lauri Markkanen": 1628374, "Tyrese Maxey": 1630178, "Dyson Daniels": 1630713,
  "Nickeil Alexander-Walker": 1629638
}

positions = {
  "C": ["Abdul-Jabbar", "Malone", "Olajuwon", "Robinson", "O'Neal", "Eaton", "Mutombo", "Mourning", "Wallace", "Camby", "Howard", "Chandler", "Gasol", "Noah", "Gobert", "Wembanyama", "Ewing", "Sampson", "Walton", "Muresan", "Seikaly", "Reid", "Towns"],
  "G": ["Johnson", "Jordan", "Iverson", "Nash", "Bryant", "Rose", "Curry", "Westbrook", "Harden", "Gilgeous-Alexander", "Dumars", "Thomas", "Billups", "Wade", "Parker", "Iguodala", "Smart", "Moncrief", "Robertson", "Cooper", "Payton", "Smart", "Jackson", "Richmond", "Stoudamire", "Kidd", "Carter", "Francis", "Paul", "Roy", "Evans", "Irving", "Lillard", "Carter-Williams", "Brogdon", "Simmons", "Doncic", "Morant", "Ball", "Castle", "Pierce", "Curry", "Starks", "Armstrong", "McKie", "Jackson", "Barbosa", "Ginobili", "Terry", "Crawford", "Smith", "Williams", "Gordon", "Clarkson", "Herro", "Pritchard", "Skiles", "Jackson", "Barros", "Rose", "Arenas", "Ellis", "Brooks", "Dragic", "Butler", "McCollum", "Oladipo", "Maxey", "Daniels", "Alexander-Walker"]
}

def get_pos(name):
  last = name.split()[-1]
  for p, names in positions.items():
    if last in names:
      return p
  return "F"

entries = []
count = 0

for line in raw_data.strip().split('\n'):
  if not line or line.startswith('Category'):
    continue
  parts = [p.strip() for p in line.split(',')]
  if len(parts) < 4:
    continue
  cat, yr, name_raw, team_raw = parts[0], parts[1], parts[2], parts[3]
  
  # Handle dual ROY entries like "Grant Hill / Jason Kidd", "Detroit Pistons / Dallas Mavericks"
  names = [n.strip() for n in name_raw.split('/')]
  teams = [t.strip() for t in team_raw.split('/')]
  
  for idx in range(len(names)):
    pname = names[idx]
    pteam = teams[idx] if idx < len(teams) else teams[0]
    
    t_abbr, _ = teams_map.get(pteam, ('NBA', 100))
    nba_id = nba_ids.get(pname, 0)
    pos = get_pos(pname)
    
    cat_code = cat.lower().replace('_', '')
    p_slug = pname.lower().replace("'", "").replace(" ", "-").replace(".", "")
    yr_slug = yr.lower().replace("-", "")
    card_id = f"award-{cat_code}-{yr_slug}-{p_slug}"
    
    category_title = cat
    if cat == 'MVP':
      category_title = 'MVP'
      rarity = 'mvp'
      pts, reb, ast = 28.5, 9.5, 6.5
    elif cat == 'Finals_MVP':
      category_title = 'Finals MVP'
      rarity = 'fmvp'
      pts, reb, ast = 27.5, 8.5, 6.0
    elif cat == 'DPOY':
      category_title = 'DPOY'
      rarity = 'dpoy'
      pts, reb, ast = 18.0, 11.5, 2.5
    elif cat == 'ROY':
      category_title = 'ROY'
      rarity = 'roty'
      pts, reb, ast = 20.5, 6.5, 4.5
    elif cat == '6MOTY':
      category_title = '6MOTY'
      rarity = '6moy'
      pts, reb, ast = 17.5, 4.5, 3.5
    elif cat == 'MIP':
      category_title = 'MIP'
      rarity = 'mip'
      pts, reb, ast = 21.0, 5.5, 4.5
    else:
      category_title = 'Award'
      rarity = 'legend'
      pts, reb, ast = 20.0, 5.0, 5.0
      
    img_url = f"https://cdn.nba.com/headshots/nba/latest/1040x760/{nba_id}.png" if nba_id else "https://cdn.nba.com/headshots/nba/latest/1040x760/fallback.png"
    
    entries.append(f"""  {{
    id: "{card_id}",
    name: "{pname}",
    team: "{pteam}",
    teamAbbr: "{t_abbr}",
    position: "{pos}",
    rarity: "{rarity}" as const,
    category: "{category_title}" as const,
    subtitle: "{yr} {category_title.upper()}",
    series: "{category_title} Award Series",
    year: "{yr}",
    isHistorical: true,
    pts: {pts},
    reb: {reb},
    ast: {ast},
    age: 27,
    nbaId: {nba_id},
    imageUrl: "{img_url}",
    quote: "{yr} {category_title} winner for {pteam}."
  }}""")
    count += 1

print(f"Generated {count} cards!")

file_content = """import { Card } from '../types';

export const AWARD_CARDS: Card[] = [
""" + ",\n".join(entries) + """
].map((card, index) => {
  const teamColor = '#333';
  let ovr = 90;
  if (card.category === 'MVP' || card.category === 'Finals MVP') ovr = 96 + (index % 4);
  else if (card.category === 'DPOY') ovr = 92 + (index % 3);
  else if (card.category === 'ROY') ovr = 88 + (index % 3);
  else if (card.category === '6MOTY') ovr = 84 + (index % 3);
  else if (card.category === 'MIP') ovr = 87 + (index % 4);

  return {
    ...card,
    number: 1000 + index + 1,
    teamColor,
    stats: {
      points: card.pts,
      rebounds: card.reb,
      assists: card.ast,
      ovr,
    },
    description: card.quote
  };
});
"""

with open("src/data/awardCards.ts", "w") as f:
  f.write(file_content)

