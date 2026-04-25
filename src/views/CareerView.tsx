import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../context/GameContext';
import { ALL_CARDS } from '../data/cards';
import { 
  Card, 
  CareerMatch, 
  FranchiseState, 
  TeamStanding, 
  GameEvent, 
  GameLog,
  MarketPhase,
  PlayerContract,
  BoxScorePlayer
} from '../types';
import { 
  NBA_TEAMS, 
  getCPUTeamOVR, 
  generateSchedule, 
  generateInitialStandings 
} from '../data/nbaTeams';
import { 
  Building, 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  ShoppingCart, 
  Settings, 
  Zap, 
  Calendar, 
  Star, 
  Trophy, 
  ChevronRight, 
  Search, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle, 
  TrendingUp, 
  Activity,
  User,
  Briefcase,
  Target,
  Medal,
  Clock,
  DollarSign,
  PieChart
} from 'lucide-react';
import CardItem from '../components/CardItem';

type FranchiseTab = 'hub' | 'lineup' | 'market' | 'standings' | 'stats' | 'mgmt';

const normalizePosition = (pos: string): 'PG' | 'SG' | 'SF' | 'PF' | 'C' => {
  if (pos.includes('PG')) return 'PG';
  if (pos.includes('SG')) return 'SG';
  if (pos.includes('SF')) return 'SF';
  if (pos.includes('PF')) return 'PF';
  if (pos.includes('C')) return 'C';
  return 'SF';
};

const simulateBoxScore = (lineup: Record<string, string | null>, roster: string[], isUser: boolean): BoxScorePlayer[] => {
  const boxScore: BoxScorePlayer[] = [];
  const starterIds = Object.values(lineup).filter(Boolean) as string[];
  const benchIds = roster.filter(id => !starterIds.includes(id)).slice(0, 5); // Take top 5 bench
  
  const allPlayers = [...starterIds, ...benchIds];
  
  allPlayers.forEach(id => {
    const card = ALL_CARDS.find(c => c.id === id);
    if (!card) return;

    const isStarter = starterIds.includes(id);
    const mins = isStarter ? 28 + Math.floor(Math.random() * 10) : 10 + Math.floor(Math.random() * 10);
    
    // Performance based on OVR + Random
    const stats = card.stats || { ovr: 75, points: 15, rebounds: 5, assists: 5 };
    const perfFactor = (stats.ovr / 80) * (0.8 + Math.random() * 0.4);
    
    const pts = Math.round((stats.points || (stats.ovr * 0.2)) * (mins / 30) * perfFactor);
    const reb = Math.round((stats.rebounds || (stats.ovr * 0.1)) * (mins / 30) * perfFactor);
    const ast = Math.round((stats.assists || (stats.ovr * 0.1)) * (mins / 30) * perfFactor);
    
    const fgMade = Math.round(pts / 2.2);
    const fgAtt = Math.round(fgMade / (0.35 + Math.random() * 0.25));
    
    boxScore.push({
      cardId: id,
      name: card.name,
      position: card.position,
      minutes: mins,
      pts,
      reb,
      ast,
      stl: Math.floor(Math.random() * 3),
      blk: Math.floor(Math.random() * 2),
      to: Math.floor(Math.random() * 4),
      fg: `${fgMade}/${fgAtt}`,
      threePt: `${Math.floor(fgMade * 0.3)}/${Math.floor(fgAtt * 0.35)}`,
      ft: `${Math.floor(pts * 0.15)}/${Math.floor(pts * 0.2)}`,
      plusMinus: Math.floor(Math.random() * 20 - 10)
    });
  });

  return boxScore;
};

const FRANCHISE_CARDS = ALL_CARDS.filter(c => 
  ['bench','starter','allstar','franchise'].includes(c.rarity) && !c.isHistorical
);

const getMarketPhase = (gamesPlayed: number): MarketPhase => {
  if (gamesPlayed < 30) return 'regular_season';
  if (gamesPlayed >= 30 && gamesPlayed <= 32) return 'trade_deadline';
  if (gamesPlayed < 82) return 'regular_season';
  return 'free_agency';
};

const generateInitialContracts = (roster: Card[]): PlayerContract[] => {
  return roster.map(card => {
    let yearsLeft = 1;
    let type: PlayerContract['type'] = 'minimum';
    
    if (card.rarity === 'franchise') {
      yearsLeft = 4 + Math.floor(Math.random() * 2);
      type = 'max';
    } else if (card.rarity === 'allstar') {
      yearsLeft = 3 + Math.floor(Math.random() * 2);
      type = 'max';
    } else if (card.rarity === 'starter') {
      yearsLeft = 2 + Math.floor(Math.random() * 2);
      type = 'veteran';
    } else {
      yearsLeft = 1 + Math.floor(Math.random() * 2);
      type = 'minimum';
    }

    return {
      cardId: card.id,
      yearsLeft,
      salary: card.stats.ovr > 85 ? (card.stats.ovr - 60) * 0.8 + 15 : (card.stats.ovr - 60) * 0.4 + 2,
      type,
      canExtend: yearsLeft <= 1,
      canTrade: true
    };
  });
};

const buildTeamRoster = (teamAbbr: string) => {
  const cards = FRANCHISE_CARDS.filter(c => c.teamAbbr === teamAbbr);
  const lineup: Record<string, string | null> = { PG: null, SG: null, SF: null, PF: null, C: null };
  const roster: string[] = cards.map(c => c.id);

  (['PG', 'SG', 'SF', 'PF', 'C'] as const).forEach(pos => {
    const posCards = cards.filter(c => normalizePosition(c.position) === pos);
    if (posCards.length > 0) {
      const best = posCards.reduce((prev, curr) => (curr.stats.ovr > prev.stats.ovr ? curr : prev));
      lineup[pos] = best.id;
    }
  });

  // Fill empty slots with best available bench
  Object.keys(lineup).forEach(pos => {
    if (!lineup[pos]) {
      const available = cards.filter(c => !Object.values(lineup).includes(c.id));
      if (available.length > 0) {
        const best = available.reduce((prev, curr) => (curr.stats.ovr > prev.stats.ovr ? curr : prev));
        lineup[pos] = best.id;
      }
    }
  });

  return { lineup, roster };
};

const buildAllTeamRosters = (): Record<string, string[]> => {
  return NBA_TEAMS.reduce((acc, team) => {
    if (team.dataAbbr) {
      acc[team.id] = FRANCHISE_CARDS
        .filter(c => c.teamAbbr === team.dataAbbr)
        .map(c => c.id);
    } else {
      acc[team.id] = [];
    }
    return acc;
  }, {} as Record<string, string[]>);
};

const CareerView: React.FC = () => {
  const { franchise, startFranchise, updateFranchise, addCoins, collection } = useGame();
  const [activeTab, setActiveTab] = useState<FranchiseTab>('hub');
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [matchResult, setMatchResult] = useState<any>(null);
  const [showPicker, setShowPicker] = useState<{ pos: string } | null>(null);
  const [marketSearch, setMarketSearch] = useState('');

  // 1. Initialization
  useEffect(() => {
    if (franchise?.isActive && (!franchise.conferenceStandings || (franchise.conferenceStandings as any).length === 0)) {
      const standings = NBA_TEAMS.map(team => ({
        teamId: team.id,
        teamName: team.name,
        teamAbbr: team.id,
        conference: team.conference as 'East' | 'West',
        division: team.division,
        wins: 0,
        losses: 0,
        pct: 0,
        gb: 0,
        streak: '-',
        isUser: team.id === franchise.team,
        homeRecord: '0-0',
        awayRecord: '0-0',
        last10: '0-0',
        pointsFor: 0,
        pointsAgainst: 0
      })) as TeamStanding[];

      updateFranchise({
        conferenceStandings: standings,
        schedule: generateSchedule(franchise.team || 'LAL', FRANCHISE_CARDS) as CareerMatch[]
      });
    }
  }, [franchise?.isActive, franchise?.conferenceStandings, updateFranchise, franchise?.team]);

  // 2. Calculations
  const teamOVR = useMemo(() => {
    if (!franchise?.lineup) return 0;
    
    // Starters OVR
    const starterIds = Object.values(franchise.lineup).filter(Boolean) as string[];
    const starters = starterIds.map(id => ALL_CARDS.find(c => c.id === id)).filter(Boolean) as Card[];
    
    if (starters.length === 0) return 60;
    
    const sOVR = starters.reduce((acc, c) => acc + c.stats.ovr, 0) / starters.length;
    
    // Bench OVR (from roster excluding starters)
    const benchIds = franchise.roster.filter(id => !starterIds.includes(id));
    const bench = benchIds.map(id => ALL_CARDS.find(c => c.id === id)).filter(Boolean) as Card[];
    const bOVR = bench.length > 0 
      ? bench.reduce((acc, c) => acc + c.stats.ovr, 0) / bench.length 
      : sOVR - 10;

    const base = sOVR * 0.7 + bOVR * 0.3;
    
    // Upgrades
    const coachingBonus = (franchise.upgrades.coaching - 1) * 0.8;
    const trainingBonus = (franchise.upgrades.training - 1) * 0.5;
    
    return Math.round(base + coachingBonus + trainingBonus);
  }, [franchise?.lineup, franchise?.roster, franchise?.upgrades]);

  const payroll = useMemo(() => {
    return franchise?.roster.reduce((total, id) => {
      const card = ALL_CARDS.find(c => c.id === id);
      if (!card) return total;
      // Simple mock salary based on OVR
      return total + (card.stats.ovr - 60) * 0.5 + 2; 
    }, 0) || 0;
  }, [franchise?.roster]);

  // 3. Simulation Engine
  const simulateMatch = async () => {
    if (!franchise || isSimulating) return;
    
    const nextGame = franchise.schedule?.find(m => !m.played);
    if (!nextGame) return;

    setIsSimulating(true);
    await new Promise(r => setTimeout(r, 1200));

    // 1. Simulate User's Game
    const userLineup = franchise.lineup;
    const userRoster = franchise.roster;
    
    const userBoxScore = simulateBoxScore(userLineup, userRoster, true);
    const userScore = userBoxScore.reduce((acc, p) => acc + p.pts, 0);
    
    // Opponent logic (Simplified OVR based)
    const oppOVR = nextGame.opponentOVR || 75;
    const oppScore = Math.round(userScore * (0.8 + Math.random() * 0.4) * (oppOVR / teamOVR));
    
    const isWin = userScore > oppScore;

    // 2. Accumulate Season Stats for User Players
    const updatedUserSeasonStats = [...(franchise.playerSeasonStats || [])];
    userBoxScore.forEach(box => {
      const existing = updatedUserSeasonStats.find(s => s.cardId === box.cardId);
      if (existing) {
        existing.gamesPlayed += 1;
        existing.totalPts += box.pts;
        existing.totalReb += box.reb;
        existing.totalAst += box.ast;
        existing.totalStl += box.stl;
        existing.totalBlk += box.blk;
        existing.avgPts = existing.totalPts / existing.gamesPlayed;
        existing.avgReb = existing.totalReb / existing.gamesPlayed;
        existing.avgAst = existing.totalAst / existing.gamesPlayed;
        existing.avgStl = existing.totalStl / existing.gamesPlayed;
        existing.avgBlk = existing.totalBlk / existing.gamesPlayed;
      } else {
        updatedUserSeasonStats.push({
          cardId: box.cardId,
          playerName: box.name,
          teamAbbr: franchise.team || 'USER',
          gamesPlayed: 1,
          totalPts: box.pts,
          totalReb: box.reb,
          totalAst: box.ast,
          totalStl: box.stl,
          totalBlk: box.blk,
          avgPts: box.pts,
          avgReb: box.reb,
          avgAst: box.ast,
          avgStl: box.stl,
          avgBlk: box.blk
        });
      }
    });

    const matchStats: CareerMatch = {
      ...nextGame,
      played: true,
      result: isWin ? 'W' : 'L',
      score: [userScore, oppScore],
      boxScore: userBoxScore,
      mvp: userBoxScore.sort((a, b) => b.pts - a.pts)[0]?.name,
      narrative: isWin ? "Dominant team performance." : "Close battle, tough result.",
    };

    const newSchedule = franchise.schedule.map(m => m.id === nextGame.id ? matchStats : m);
    
    // 3. Update League Standings
    const newStandings = (franchise.conferenceStandings || []).map(s => {
      if (s.teamId === franchise.team) {
        const w = s.wins + (isWin ? 1 : 0);
        const l = s.losses + (isWin ? 0 : 1);
        return {
          ...s,
          wins: w,
          losses: l,
          pct: w / (w + l),
          pointsFor: (s.pointsFor || 0) + userScore,
          pointsAgainst: (s.pointsAgainst || 0) + oppScore
        };
      }
      
      // Sim CPU Game Results
      const cpuWin = Math.random() > 0.45; // Slightly more wins for some teams
      const ptsFor = 95 + Math.floor(Math.random() * 30);
      const ptsAg = 95 + Math.floor(Math.random() * 30);
      
      const w = s.wins + (cpuWin ? 1 : 0);
      const l = s.losses + (cpuWin ? 0 : 1);
      
      return {
        ...s,
        wins: w,
        losses: l,
        pct: w / (w + l),
        pointsFor: (s.pointsFor || 0) + ptsFor,
        pointsAgainst: (s.pointsAgainst || 0) + ptsAg
      };
    }).sort((a, b) => b.pct - a.pct);

    updateFranchise({
      schedule: newSchedule,
      wins: franchise.wins + (isWin ? 1 : 0),
      losses: franchise.losses + (isWin ? 0 : 1),
      xp: franchise.xp + (isWin ? 600 : 250),
      budget: franchise.budget + (isWin ? 60000 : 25000),
      conferenceStandings: newStandings as TeamStanding[],
      playerSeasonStats: updatedUserSeasonStats,
      currentDate: new Date(new Date(franchise.currentDate || '2025-10-22').getTime() + 86400000).toISOString().split('T')[0],
      marketPhase: getMarketPhase(franchise.wins + franchise.losses + 1)
    });

    setMatchResult(matchStats);
    setIsSimulating(false);
  };

  // 4. Render Helpers
  const handleStartFranchise = (teamId: string) => {
    const teamDef = NBA_TEAMS.find(t => t.id === teamId);
    if (!teamDef?.dataAbbr) return;

    const { lineup, roster } = buildTeamRoster(teamDef.dataAbbr);
    const rosterCards = roster.map(id => FRANCHISE_CARDS.find(c => c.id === id)).filter(Boolean) as Card[];
    const contracts = generateInitialContracts(rosterCards);
    const leagueRosters = buildAllTeamRosters();

    const initialState: Partial<FranchiseState> = {
      budget: 1000000,
      season: 2025,
      wins: 0,
      losses: 0,
      roster,
      lineup: lineup as FranchiseState['lineup'],
      leagueRosters,
      contracts,
      currentDate: '2025-10-22',
      marketPhase: 'regular_season',
      playerSeasonStats: [],
      upgrades: {
        coaching: 1,
        scouting: 1,
        training: 1,
        facilities: 1
      },
      conferenceStandings: []
    };

    startFranchise(teamId, roster, initialState);
  };

  if (!franchise?.isActive) {
    return (
      <div className="h-full w-full bg-zinc-950 flex flex-col items-center overflow-y-auto pt-32 pb-20 px-6 font-sans">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="text-center space-y-6 mb-12">
          <div className="w-24 h-24 bg-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl">
            <Building size={48} className="text-white" />
          </div>
          <h1 className="text-5xl font-black uppercase italic tracking-tighter text-white leading-tight">Franchise<br/>Overhaul</h1>
          <p className="text-zinc-500 text-sm font-medium tracking-wide max-w-sm mx-auto">Select your organization and lead them to championship glory in this RPG management mode.</p>
        </motion.div>

        <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {NBA_TEAMS.map(team => (
            <motion.div
              key={team.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedTeam(team.id)}
              className={`p-4 rounded-2xl cursor-pointer border transition-all ${
                selectedTeam === team.id ? 'bg-emerald-600 border-emerald-400' : 'bg-zinc-900/50 border-zinc-800'
              }`}
            >
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-black/30 flex items-center justify-center font-black italic text-lg text-white">
                    {team.id.charAt(0)}
                 </div>
                 <h3 className="text-xs font-black uppercase italic tracking-tight text-white">{team.name}</h3>
              </div>
            </motion.div>
          ))}
        </div>

        {selectedTeam && (
          <motion.button 
            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            onClick={() => handleStartFranchise(selectedTeam)}
            className="fixed bottom-10 py-5 px-12 bg-white text-black rounded-3xl font-black uppercase tracking-[0.3em] text-xs shadow-2xl hover:scale-105 transition-all"
          >
            Draft Front Office
          </motion.button>
        )}
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-zinc-950 flex flex-col overflow-hidden text-white font-sans">
      {/* Dynamic Nav */}
      <div className="flex items-center justify-between px-6 pt-24 pb-6 bg-zinc-950/80 backdrop-blur-3xl border-b border-zinc-900 sticky top-0 z-[100]">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center font-black italic text-xl shadow-lg">
               {franchise.team?.charAt(0)}
            </div>
            <div>
               <h2 className="text-xl font-black uppercase italic tracking-tighter leading-none">{franchise.team}</h2>
               <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                  {franchise.currentDate || '2025-10-22'} · {(franchise.marketPhase ?? 'regular_season').replace('_', ' ')}
               </p>
            </div>
         </div>
         <div className="flex gap-1 overflow-x-auto no-scrollbar max-w-[60%] px-2">
            {(['hub', 'lineup', 'stats', 'market', 'standings', 'mgmt'] as FranchiseTab[]).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeTab === tab ? 'bg-emerald-600 text-white' : 'text-zinc-500 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
         </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-7xl mx-auto space-y-8"
          >
            {activeTab === 'hub' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* Main Play Block */}
                 <div className="lg:col-span-2 space-y-8">
                    <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-[3rem] p-10 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-10 opacity-10 text-emerald-500"><Zap size={200} /></div>
                       <div className="relative z-10 space-y-8">
                          <div className="flex items-center gap-3">
                             <Calendar size={20} className="text-zinc-500" />
                             <h3 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">Next Opponent</h3>
                          </div>
                          
                          <div className="flex items-center justify-around py-4">
                             <div className="text-center group">
                                <div className="w-24 h-24 bg-zinc-800 rounded-3xl flex items-center justify-center text-5xl font-black italic shadow-2xl group-hover:scale-110 transition-transform">
                                   {franchise.team?.charAt(0)}
                                </div>
                                <p className="mt-4 text-xs font-black uppercase tracking-widest">{franchise.team}</p>
                             </div>
                             <div className="text-5xl font-black italic text-zinc-800">VS</div>
                             <div className="text-center group">
                                <div className="w-24 h-24 bg-zinc-800/40 border border-dashed border-zinc-700 rounded-3xl flex items-center justify-center text-5xl font-black italic text-zinc-700 group-hover:scale-110 transition-transform">
                                   {franchise.schedule?.find(m => !m.played)?.opponentAbbr?.charAt(0) ?? '?'}
                                </div>
                                <p className="mt-4 text-xs font-black uppercase tracking-widest text-zinc-600">
                                   {franchise.schedule?.find(m => !m.played)?.opponentAbbr ?? 'TBD'}
                                </p>
                             </div>
                          </div>

                          <button 
                            onClick={simulateMatch}
                            disabled={isSimulating}
                            className="w-full py-6 bg-white text-black rounded-[2rem] font-black uppercase tracking-[0.4em] text-xs shadow-2xl hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                          >
                             {isSimulating ? <RefreshCw className="animate-spin" /> : <Zap fill="currentColor" />}
                             <span>{isSimulating ? 'Simulating Series...' : 'Advance Schedule'}</span>
                          </button>
                       </div>
                    </div>

                    <div className="space-y-4">
                       <h3 className="text-xl font-black uppercase italic tracking-tight flex items-center gap-3">
                          <Activity size={20} className="text-emerald-500"/> Recent Activity
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {franchise.schedule.filter(m => m.played).slice(-4).reverse().map(m => (
                            <div key={m.id} className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl flex items-center justify-between">
                               <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black italic ${m.result === 'W' ? 'bg-emerald-500/10 text-emerald-500':'bg-red-500/10 text-red-500'}`}>
                                     {m.result}
                                  </div>
                                  <div>
                                     <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{m.opponentTeam}</p>
                                     <p className="text-lg font-black italic">{m.score?.[0]}-{m.score?.[1]}</p>
                                  </div>
                               </div>
                               <ChevronRight size={16} className="text-zinc-700" />
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 {/* Sidebar Management */}
                 <div className="space-y-8">
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6">
                       <div className="flex items-center justify-between">
                          <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">Global OVR</h3>
                          <span className="text-3xl font-black italic text-emerald-500">{teamOVR}</span>
                       </div>
                       <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${teamOVR}%` }} className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-black/40 rounded-2xl border border-zinc-800">
                             <p className="text-[9px] font-black text-zinc-600 uppercase mb-1">Payroll</p>
                             <p className="text-lg font-black text-white italic">${payroll.toFixed(1)}M</p>
                          </div>
                          <div className="p-4 bg-black/40 rounded-2xl border border-zinc-800">
                             <p className="text-[9px] font-black text-zinc-600 uppercase mb-1">Budget</p>
                             <p className="text-lg font-black text-amber-500 italic">${(franchise.budget/1000).toFixed(0)}K</p>
                          </div>
                       </div>
                    </div>

                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6">
                       <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                          <Star size={16} className="text-amber-500" /> Organization Status
                       </h3>
                       <div className="space-y-4">
                          {['coaching', 'scouting', 'training', 'facilities'].map(u => (
                            <div key={u} className="space-y-1">
                               <div className="flex justify-between text-[10px] font-black uppercase">
                                  <span className="text-zinc-500">{u}</span>
                                  <span className="text-white">Lv. {franchise.upgrades[u as keyof typeof franchise.upgrades]}</span>
                               </div>
                               <div className="h-1 w-full bg-zinc-800 rounded-full">
                                  <div className="h-full bg-zinc-400 rounded-full" style={{ width: `${(franchise.upgrades[u as keyof typeof franchise.upgrades] / 10) * 100}%` }} />
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'lineup' && (
              <div className="space-y-8">
                 <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter">Lineup Management</h2>
                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                       ${payroll.toFixed(1)}M / $120.0M Cap
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {(['PG', 'SG', 'SF', 'PF', 'C'] as const).map(pos => {
                      const cardId = franchise.lineup?.[pos];
                      const card = cardId ? ALL_CARDS.find(c => c.id === cardId) : null;
                      return (
                        <div key={pos} className="space-y-3">
                           <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 text-center">{pos}</p>
                           <div 
                             onClick={() => setShowPicker({ pos })}
                             className={`aspect-[4/6] rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center p-2 cursor-pointer transition-all ${
                               card ? 'border-transparent' : 'border-zinc-800 bg-zinc-900/20 hover:bg-zinc-800/40 hover:border-zinc-700'
                             }`}
                           >
                              {card ? (
                                <CardItem card={card} isOwned={true} mode={activeTab === 'lineup' ? 'mini' : 'mini'} />
                              ) : (
                                <div className="text-center space-y-2">
                                   <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center mx-auto"><Zap size={18} className="text-zinc-600" /></div>
                                   <p className="text-[9px] font-bold text-zinc-600 uppercase">Select {pos}</p>
                                </div>
                              )}
                           </div>
                           {card && (
                             <button 
                               onClick={() => updateFranchise({ lineup: { ...franchise.lineup, [pos]: null } })}
                               className="w-full py-2 bg-red-500/10 text-red-500 rounded-xl text-[8px] font-black uppercase hover:bg-red-500 hover:text-white transition-all"
                             >
                               Remove
                             </button>
                           )}
                        </div>
                      );
                    })}
                 </div>

                 <div className="space-y-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500">Bench & Reserved</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                       {franchise.roster.filter(id => !Object.values(franchise.lineup || {}).includes(id)).map(id => {
                         const card = ALL_CARDS.find(c => c.id === id);
                         if (!card) return null;
                         const contract = franchise.contracts?.find(ct => ct.cardId === id);
                         return (
                           <div key={id} className="relative group">
                              <CardItem card={card} isOwned={true} mode="mini" />
                              {contract && (
                                  <div className="absolute top-2 right-2 px-2 py-1 bg-black/80 rounded-lg text-[7px] font-black italic border border-zinc-700 pointer-events-none">
                                     {contract.yearsLeft}Y / ${contract.salary.toFixed(1)}M
                                  </div>
                              )}
                              <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-3 rounded-[1.5rem] transition-opacity">
                                 <button 
                                   onClick={() => {
                                      const pos = normalizePosition(card.position);
                                      updateFranchise({ lineup: { ...franchise.lineup, [pos]: id } });
                                   }}
                                   className="w-full py-2 bg-emerald-500 text-white rounded-lg text-[8px] font-black uppercase"
                                 >
                                    Assign to {normalizePosition(card.position)}
                                 </button>
                                 <button 
                                   onClick={() => updateFranchise({ 
                                     roster: franchise.roster.filter(rid => rid !== id),
                                     contracts: franchise.contracts.filter(c => c.cardId !== id)
                                   })}
                                   className="w-full mt-2 py-2 bg-zinc-800 text-zinc-400 rounded-lg text-[8px] font-black uppercase hover:bg-red-500 hover:text-white"
                                 >
                                    Release
                                 </button>
                              </div>
                           </div>
                         );
                       })}
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'market' && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 p-4 rounded-3xl sticky top-[160px] z-50">
                  <Search className="text-zinc-500" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search Free Agents (Luka, LeBron, Jokic...)"
                    value={marketSearch}
                    onChange={(e) => setMarketSearch(e.target.value)}
                    className="bg-transparent border-none outline-none text-sm font-bold uppercase tracking-widest text-white placeholder:text-zinc-700 w-full"
                  />
                  <div className="flex gap-2">
                     <span className="px-3 py-1 bg-black/40 rounded-lg text-[9px] font-black text-amber-500">${(franchise.budget/1000).toFixed(0)}K</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                   {ALL_CARDS.filter(c => !franchise.roster.includes(c.id))
                     .filter(c => c.name.toLowerCase().includes(marketSearch.toLowerCase()))
                     .slice(0, 36)
                     .map(card => {
                        const salary = (card.stats.ovr - 60) * 0.5 + 2;
                        const canAffordCap = payroll + salary <= 120;
                        const signFee = Math.floor(card.stats.ovr * 1500);
                        const canAffordFee = franchise.budget >= signFee;

                        return (
                          <div key={card.id} className="relative group">
                            <CardItem card={card} isOwned={true} mode="mini" />
                            <div className="absolute inset-0 bg-black/95 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center p-4 rounded-[1.5rem] transition-opacity text-center space-y-3">
                               <div>
                                  <p className="text-[8px] font-black text-zinc-500 uppercase">Salary</p>
                                  <p className={`text-sm font-black italic ${canAffordCap ? 'text-white' : 'text-red-500'}`}>${salary.toFixed(1)}M</p>
                               </div>
                               <div>
                                  <p className="text-[8px] font-black text-zinc-500 uppercase">Signing Fee</p>
                                  <p className={`text-sm font-black italic ${canAffordFee ? 'text-amber-500' : 'text-red-500'}`}>${(signFee/1000).toFixed(0)}K</p>
                               </div>
                               <button 
                                 disabled={!canAffordCap || !canAffordFee || franchise.roster.length >= 15}
                                 onClick={() => {
                                    const newContract: PlayerContract = {
                                      cardId: card.id,
                                      yearsLeft: 2,
                                      salary: salary,
                                      type: card.stats.ovr > 85 ? 'max' : 'mid-level',
                                      canExtend: false,
                                      canTrade: true
                                    };
                                    updateFranchise({
                                      budget: franchise.budget - signFee,
                                      roster: [...franchise.roster, card.id],
                                      contracts: [...franchise.contracts, newContract]
                                    });
                                 }}
                                 className="w-full py-3 bg-white text-black rounded-xl font-black uppercase text-[9px] hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-30"
                               >
                                  Sign Player
                               </button>
                            </div>
                          </div>
                        );
                   })}
                </div>
              </div>
            )}

            {activeTab === 'standings' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* East Conference */}
                <div className="space-y-6">
                  <h3 className="text-xl font-black italic uppercase text-blue-500 border-l-4 border-blue-500 pl-4">Eastern Conference</h3>
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
                    <div className="grid grid-cols-10 p-5 border-b border-zinc-800 bg-black/60 text-[9px] font-black uppercase text-zinc-500 tracking-widest">
                       <div className="col-span-1">#</div>
                       <div className="col-span-4">Team</div>
                       <div className="col-span-1 text-center">W</div>
                       <div className="col-span-1 text-center">L</div>
                       <div className="col-span-1 text-center">GB</div>
                       <div className="col-span-2 text-right">PCT</div>
                    </div>
                    <div className="divide-y divide-zinc-800/20">
                      {franchise.conferenceStandings?.filter(s => s.conference === 'East').sort((a,b) => b.pct - a.pct).map((s, idx) => (
                        <div key={s.teamId} className={`grid grid-cols-10 p-4 items-center ${s.teamId === franchise.team ? 'bg-emerald-500/10 border-l-[4px] border-emerald-500' : ''}`}>
                           <div className="col-span-1 text-[10px] font-black text-zinc-600 italic">{idx + 1}</div>
                           <div className="col-span-4 flex items-center gap-3">
                              <span className="text-[10px] font-black uppercase italic truncate">{s.teamName}</span>
                           </div>
                           <div className="col-span-1 text-center text-xs font-black">{s.wins}</div>
                           <div className="col-span-1 text-center text-xs font-bold text-zinc-600">{s.losses}</div>
                           <div className="col-span-1 text-center text-[10px] font-bold text-zinc-500">{(idx === 0 ? '-' : (franchise.conferenceStandings?.filter(cs => cs.conference === 'East')[0].wins - s.wins))}</div>
                           <div className="col-span-2 text-right text-[10px] font-bold text-zinc-500">.{Math.round(s.pct * 1000).toString().padStart(3, '0')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* West Conference */}
                <div className="space-y-6">
                  <h3 className="text-xl font-black italic uppercase text-red-500 border-l-4 border-red-500 pl-4">Western Conference</h3>
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-[2.5rem] overflow-hidden">
                    <div className="grid grid-cols-10 p-5 border-b border-zinc-800 bg-black/60 text-[9px] font-black uppercase text-zinc-500 tracking-widest">
                       <div className="col-span-1">#</div>
                       <div className="col-span-4">Team</div>
                       <div className="col-span-1 text-center">W</div>
                       <div className="col-span-1 text-center">L</div>
                       <div className="col-span-1 text-center">GB</div>
                       <div className="col-span-2 text-right">PCT</div>
                    </div>
                    <div className="divide-y divide-zinc-800/20">
                      {franchise.conferenceStandings?.filter(s => s.conference === 'West').sort((a,b) => b.pct - a.pct).map((s, idx) => (
                        <div key={s.teamId} className={`grid grid-cols-10 p-4 items-center ${s.teamId === franchise.team ? 'bg-emerald-500/10 border-l-[4px] border-emerald-500' : ''}`}>
                           <div className="col-span-1 text-[10px] font-black text-zinc-600 italic">{idx + 1}</div>
                           <div className="col-span-4 flex items-center gap-3">
                              <span className="text-[10px] font-black uppercase italic truncate">{s.teamName}</span>
                           </div>
                           <div className="col-span-1 text-center text-xs font-black">{s.wins}</div>
                           <div className="col-span-1 text-center text-xs font-bold text-zinc-600">{s.losses}</div>
                           <div className="col-span-1 text-center text-[10px] font-bold text-zinc-500">{(idx === 0 ? '-' : (franchise.conferenceStandings?.filter(cs => cs.conference === 'West')[0].wins - s.wins))}</div>
                           <div className="col-span-2 text-right text-[10px] font-bold text-zinc-500">.{Math.round(s.pct * 1000).toString().padStart(3, '0')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-8">
                 <h2 className="text-2xl font-black uppercase italic tracking-tighter">Season Leaders</h2>
                 <div className="bg-zinc-900/40 border border-zinc-800 rounded-[3rem] overflow-hidden">
                    <div className="grid grid-cols-12 p-6 border-b border-zinc-800 bg-black/60 text-[9px] font-black uppercase text-zinc-500 tracking-widest italic">
                       <div className="col-span-5">Player / Team</div>
                       <div className="col-span-1 text-center">GP</div>
                       <div className="col-span-2 text-center">PPG</div>
                       <div className="col-span-2 text-center">RPG</div>
                       <div className="col-span-2 text-center">APG</div>
                    </div>
                    <div className="divide-y divide-zinc-800/20 max-h-[600px] overflow-y-auto no-scrollbar">
                       {(franchise.playerSeasonStats || []).sort((a,b) => b.avgPts - a.avgPts).map((stat, idx) => (
                         <div key={stat.cardId} className="grid grid-cols-12 p-5 items-center hover:bg-zinc-800/30 transition-all">
                            <div className="col-span-5 flex items-center gap-4">
                               <span className="text-[10px] font-black text-zinc-700 italic">{idx + 1}</span>
                               <div>
                                  <p className="text-xs font-black uppercase tracking-tight italic">{stat.playerName}</p>
                                  <p className="text-[9px] font-bold text-zinc-600 uppercase">{stat.teamAbbr}</p>
                               </div>
                            </div>
                            <div className="col-span-1 text-center text-xs font-bold">{stat.gamesPlayed}</div>
                            <div className="col-span-2 text-center text-xs font-black text-white">{stat.avgPts.toFixed(1)}</div>
                            <div className="col-span-2 text-center text-xs font-black text-zinc-400">{stat.avgReb.toFixed(1)}</div>
                            <div className="col-span-2 text-center text-xs font-black text-zinc-400">{stat.avgAst.toFixed(1)}</div>
                         </div>
                       ))}
                       {(!franchise.playerSeasonStats || franchise.playerSeasonStats.length === 0) && (
                         <div className="py-32 text-center">
                            <p className="text-zinc-600 font-black uppercase tracking-widest text-[10px]">No stats recorded yet. Play a game to start simulation.</p>
                         </div>
                       )}
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'mgmt' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {[
                   { id: 'coaching', label: 'Offensive Strategies', icon: Target, val: franchise.upgrades.coaching, color: 'text-orange-500', desc: 'Boost team offensive flow and playbook complexity.' },
                   { id: 'scouting', label: 'Global Scouting Network', icon: Search, val: franchise.upgrades.scouting, color: 'text-blue-500', desc: 'Improve free agent identification and talent reports.' },
                   { id: 'training', label: 'Performance Center', icon: Activity, val: franchise.upgrades.training, color: 'text-purple-500', desc: 'Accelerate player progression and recovery.' },
                   { id: 'facilities', label: 'Modern Arena Facilities', icon: Building, val: franchise.upgrades.facilities, color: 'text-emerald-500', desc: 'Increases revenue per home game and fan loyalty.' },
                 ].map(u => (
                   <div key={u.id} className="p-8 bg-zinc-900/40 border border-zinc-800 rounded-[3rem] space-y-6 hover:border-zinc-600 transition-all">
                      <div className="flex items-center gap-4">
                         <div className={`w-14 h-14 rounded-2xl bg-black/40 flex items-center justify-center ${u.color}`}><u.icon size={28} /></div>
                         <div>
                            <h4 className="text-lg font-black uppercase italic tracking-tight">{u.label}</h4>
                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Upgrade Organization</p>
                         </div>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed">{u.desc}</p>
                      <div className="space-y-4">
                         <div className="flex gap-1.5">
                            {[...Array(10)].map((_, i) => (
                              <div key={i} className={`flex-1 h-2 rounded-full ${i < u.val ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-zinc-800'}`} />
                            ))}
                         </div>
                         <button 
                           onClick={() => {
                              const cost = u.val * 100000;
                              if (franchise.budget >= cost && u.val < 10) {
                                 updateFranchise({
                                    budget: franchise.budget - cost,
                                    upgrades: { ...franchise.upgrades, [u.id]: u.val + 1 }
                                 });
                              }
                           }}
                           disabled={franchise.budget < u.val * 100000 || u.val >= 10}
                           className="w-full py-4 bg-zinc-800/50 hover:bg-zinc-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-30 border border-zinc-700/50"
                         >
                            Enhance — ${(u.val * 100).toFixed(0)}K
                         </button>
                      </div>
                   </div>
                 ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Roster Picker Overlay */}
      <AnimatePresence>
        {showPicker && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex flex-col pt-24 px-6 pb-12">
             <div className="max-w-6xl mx-auto w-full space-y-6">
                <div className="flex items-center justify-between">
                   <h2 className="text-2xl font-black uppercase italic tracking-tighter">Assign Starter: {showPicker.pos}</h2>
                   <button onClick={() => setShowPicker(null)} className="p-3 bg-zinc-900 rounded-full hover:bg-zinc-800"><Zap size={20} /></button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 overflow-y-auto max-h-[70vh] no-scrollbar">
                   {franchise.roster.map(id => {
                      const card = ALL_CARDS.find(c => c.id === id);
                      if (!card) return null;
                      return (
                        <div key={id} onClick={() => {
                          updateFranchise({ lineup: { ...franchise.lineup, [showPicker.pos]: id } });
                          setShowPicker(null);
                        }} className="cursor-pointer hover:scale-105 transition-transform">
                          <CardItem card={card} isOwned={true} mode="mini" />
                        </div>
                      );
                   })}
                   {franchise.roster.length === 0 && <p className="col-span-full text-center py-20 text-zinc-600 font-black uppercase">No players in roster. Sign some from the market!</p>}
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Modal */}
      <AnimatePresence>
        {matchResult && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 z-[300] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-6">
             <motion.div initial={{ scale:0.9, y:20 }} animate={{ scale:1, y:0 }} className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-[3rem] overflow-hidden flex flex-col max-h-[90vh]">
                <div className={`p-10 text-center space-y-4 ${matchResult.result === 'W' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                   <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-2xl ${matchResult.result === 'W' ? 'bg-emerald-500':'bg-red-500'}`}>
                      <h2 className="text-5xl font-black text-white italic">{matchResult.result}</h2>
                   </div>
                   <div>
                      <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">{matchResult.result === 'W' ? 'VICTORY' : 'DEFEAT'}</h3>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-2">{matchResult.opponentTeam} · {matchResult.score?.[0]}-{matchResult.score?.[1]}</p>
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 italic">Game MVP</h4>
                         <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Player of the Game</span>
                      </div>
                      <div className="p-4 bg-zinc-900 rounded-2xl flex items-center justify-between border border-emerald-500/20">
                         <span className="font-black italic uppercase text-white">{matchResult.mvp}</span>
                         <Star size={16} className="text-amber-500" fill="currentColor" />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 italic">Team Box Score</h4>
                      <div className="rounded-2xl border border-zinc-800 overflow-hidden">
                         <div className="grid grid-cols-12 p-3 bg-zinc-900 text-[8px] font-black uppercase text-zinc-600 tracking-tighter">
                            <div className="col-span-5">Player</div>
                            <div className="col-span-2 text-center">MIN</div>
                            <div className="col-span-2 text-center">PTS</div>
                            <div className="col-span-1 text-center">REB</div>
                            <div className="col-span-1 text-center">AST</div>
                            <div className="col-span-1 text-center">+/-</div>
                         </div>
                         <div className="divide-y divide-zinc-800">
                            {matchResult.boxScore?.map((p: BoxScorePlayer) => (
                              <div key={p.cardId} className="grid grid-cols-12 p-3 items-center text-[9px] font-bold">
                                 <div className="col-span-5 text-white italic uppercase truncate">{p.name}</div>
                                 <div className="col-span-2 text-center text-zinc-500">{p.minutes}</div>
                                 <div className="col-span-2 text-center font-black">{p.pts}</div>
                                 <div className="col-span-1 text-center">{p.reb}</div>
                                 <div className="col-span-1 text-center">{p.ast}</div>
                                 <div className={`col-span-1 text-center font-black ${p.plusMinus > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {p.plusMinus > 0 ? '+' : ''}{p.plusMinus}
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>

                <div className="p-8 bg-zinc-950 border-t border-zinc-900">
                   <button onClick={() => setMatchResult(null)} className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl active:scale-95 transition-all">Advance Schedule</button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CareerView;
