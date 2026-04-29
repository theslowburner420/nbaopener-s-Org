import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Trophy, 
  ChevronRight, 
  ArrowRight, 
  Activity,
  Plus,
  Play,
  Settings as SettingsIcon,
  Search,
  DollarSign,
  TrendingUp,
  History,
  ShoppingCart
} from 'lucide-react';
import { NBA_TEAMS, getTeamLogo } from '../data/nbaTeams';
import { ALL_CARDS } from '../data/cards';
import { useFranchise } from '../franchise/hooks/useFranchise';
import { stateService } from '../franchise/services/stateService';
import { gameService } from '../franchise/services/gameService';
import { FranchisePhase, TeamObject, FranchiseMatch } from '../franchise/types';
import { marketService } from '../franchise/services/marketService';
import { tradeEngine } from '../franchise/services/tradeEngine';
import CardItem from '../components/CardItem';
import { X as CloseIcon, AlertTriangle } from 'lucide-react';

type FranchiseTab = 'hub' | 'lineup' | 'market' | 'league' | 'stats' | 'trades' | 'settings';

const CareerView: React.FC = () => {
  const { state, isLoading, startNewFranchise, advanceWeek, resetFranchise, setState } = useFranchise();

  const [activeTab, setActiveTab] = useState<FranchiseTab>('hub');
  const [selectedConf, setSelectedConf] = useState<'East' | 'West'>('East');
  const [lineupModalPos, setLineupModalPos] = useState<string | null>(null);
  const [tradeTargetTeamId, setTradeTargetTeamId] = useState<string | null>(null);
  const [userOfferedIds, setUserOfferedIds] = useState<string[]>([]);
  const [cpuRequestedIds, setCpuRequestedIds] = useState<string[]>([]);
  const [lastGameResult, setLastGameResult] = useState<{ result: any; match: FranchiseMatch } | null>(null);

  const handleSignPlayer = (cardId: string) => {
    if (!state) return;
    const result = marketService.signFreeAgent(state, cardId);
    if (result.success) {
      alert(result.reason);
      setState({ ...state }); // Trigger re-render
    } else {
      alert(result.reason);
    }
  };

  const handleExecuteTrade = () => {
    if (!state || !tradeTargetTeamId) return;
    const offer = {
      fromTeamId: state.userTeamId,
      toTeamId: tradeTargetTeamId,
      offeredPlayerIds: userOfferedIds,
      requestedPlayerIds: cpuRequestedIds
    };
    
    const result = tradeEngine.evaluateUserTrade(state, offer);
    if (result.accepted) {
      tradeEngine.executeTrade(state, offer);
      alert("Trade Accepted!");
      setUserOfferedIds([]);
      setCpuRequestedIds([]);
      setTradeTargetTeamId(null);
      setState({ ...state });
    } else {
      alert(result.reason);
    }
  };

  const handleUpdateLineup = (playerId: string) => {
    if (!state || !lineupModalPos) return;
    const userTeam = state.teams[state.userTeamId];
    
    // If player is already in another position, swap them or clear them
    const positions = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
    positions.forEach(pos => {
      if (userTeam.lineup[pos] === playerId) {
        userTeam.lineup[pos] = null;
      }
    });

    // Check if player was in bench
    userTeam.lineup.bench = userTeam.lineup.bench.filter(id => id !== playerId);

    if (lineupModalPos === 'bench') {
       userTeam.lineup.bench.push(playerId);
    } else {
       const prevStarter = userTeam.lineup[lineupModalPos as keyof typeof userTeam.lineup] as string;
       if (prevStarter) userTeam.lineup.bench.push(prevStarter);
       userTeam.lineup[lineupModalPos as keyof typeof userTeam.lineup] = playerId;
    }

    setLineupModalPos(null);
    setState({ ...state });
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-black flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
          <Activity className="text-white opacity-20" size={40} />
        </motion.div>
      </div>
    );
  }

  // TEAM SELECTION SCREEN
  if (!state) {
    return (
      <div className="flex-1 bg-black text-white p-6 md:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter">Franchise Mode</h1>
            <p className="text-zinc-500 max-w-2xl font-medium">Select your franchise to begin your journey as a General Manager. Build a dynasty starting from the 2025 Regular Season.</p>
          </div>

          <div className="flex gap-4 border-b border-white/5 pb-4">
            {['East', 'West'].map((conf) => (
              <button 
                key={conf}
                onClick={() => setSelectedConf(conf as any)}
                className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${selectedConf === conf ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'}`}
              >
                {conf} Conference
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {NBA_TEAMS.filter(t => t.conference === selectedConf).map((team) => (
              <motion.div 
                key={team.id}
                whileHover={{ y: -5 }}
                onClick={() => startNewFranchise(team.id)}
                className="group cursor-pointer bg-zinc-900 border border-white/5 rounded-[2rem] p-8 space-y-6 hover:bg-zinc-800/50 hover:border-white/20 transition-all"
              >
                <div className="w-20 h-20 mx-auto transition-transform group-hover:scale-110 duration-500">
                  <img src={getTeamLogo(team.id)} alt={team.name} className="w-full h-full object-contain" />
                </div>
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-black uppercase italic tracking-tight">{team.name}</h3>
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">{team.division}</p>
                </div>
                <button className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:text-black">
                  Select Team
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }


  const simulateGame = () => {
    if (!state) return;
    const res = gameService.simulateNextUserGame(state);
    if (res) {
      setLastGameResult(res);
      setState({ ...state });
    }
  };

  if (!state) return null;

  const userTeam = state.teams[state.userTeamId];
  const nextUserGame = state.schedule.find(m => 
    !m.played && (m.homeTeamId === state.userTeamId || m.awayTeamId === state.userTeamId)
  );

  const pendingUserGamesThisCycle = state.schedule.filter(m => 
    !m.played && (m.homeTeamId === state.userTeamId || m.awayTeamId === state.userTeamId) && m.gameNumber < state.week + 4
  );

  return (
    <div className="bg-black flex flex-col relative w-full">
      {/* HEADER */}
      <div className="bg-zinc-950 border-b border-white/5 px-6 py-6 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-zinc-900 rounded-[1.5rem] p-3 border border-white/5 shadow-2xl">
            <img src={getTeamLogo(userTeam.teamId)} className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">{userTeam.name}</h2>
              <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black text-zinc-500 tracking-widest">{userTeam.abbreviation}</span>
            </div>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">{userTeam.wins}W - {userTeam.losses}L</span>
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Regular Season</span>
              </div>
              <div className="w-px h-3 bg-zinc-800" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-500">${(userTeam.payroll/1000000).toFixed(1)}M</span>
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Payroll</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           {pendingUserGamesThisCycle.length > 0 ? (
             <button 
              onClick={simulateGame}
              className="flex items-center gap-3 bg-amber-500 text-black px-8 py-4 rounded-2xl font-black uppercase italic tracking-tighter text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(245,158,11,0.2)]"
             >
               <Play size={16} fill="currentColor" />
               Jugar Partido
             </button>
           ) : (
             <button 
              onClick={advanceWeek}
              className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black uppercase italic tracking-tighter text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
             >
               <TrendingUp size={16} />
               Avanzar Semana {Math.floor(state.week / 4) + 1}
             </button>
           )}
           <button 
             onClick={resetFranchise}
             className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
           >
             <SettingsIcon size={20} />
           </button>
        </div>
      </div>

      {/* NAVIGATION */}
      <div className="bg-zinc-950 flex px-6 md:px-12 overflow-x-auto no-scrollbar gap-2 py-2">
        {[
          { id: 'hub', label: 'HUB', icon: LayoutDashboard },
          { id: 'lineup', label: 'ROSTER', icon: Users },
          { id: 'market', label: 'MARKET', icon: ShoppingCart },
          { id: 'trades', label: 'TRADES', icon: History },
          { id: 'league', label: 'LEAGUE', icon: Building },
          { id: 'stats', label: 'STATS', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white/5 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <tab.icon size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="p-6 md:p-12 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'hub' && (
            <motion.div 
              key="hub"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto space-y-12 pb-20"
            >
              {/* TOP FEATURE: NEXT MATCH */}
              {nextUserGame && (
                <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="space-y-6 relative z-10 text-center md:text-left">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em]">Next Appointment</p>
                      <h3 className="text-5xl font-black italic uppercase tracking-tighter text-white">Gameday</h3>
                    </div>
                    <div className="flex items-center gap-4 justify-center md:justify-start">
                      <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        Match {nextUserGame.gameNumber}
                      </div>
                      <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        {nextUserGame.homeTeamId === state.userTeamId ? 'Home' : 'Away'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-12 relative z-10">
                     <div className="text-center space-y-3">
                        <div className="w-24 h-24 bg-zinc-950 rounded-[2rem] p-5 border border-white/5 shadow-2xl group-hover:scale-110 transition-all duration-500">
                          <img src={getTeamLogo(state.userTeamId)} className="w-full h-full object-contain" />
                        </div>
                        <p className="text-xs font-black text-white italic whitespace-nowrap">{state.teams[state.userTeamId].abbreviation}</p>
                     </div>
                     <div className="text-3xl font-black italic text-zinc-800">VS</div>
                     <div className="text-center space-y-3">
                        <div className="w-24 h-24 bg-zinc-950 rounded-[2rem] p-5 border border-white/5 shadow-2xl group-hover:scale-110 transition-all duration-500">
                          <img src={getTeamLogo(nextUserGame.homeTeamId === state.userTeamId ? nextUserGame.awayTeamId : nextUserGame.homeTeamId)} className="w-full h-full object-contain" />
                        </div>
                        <p className="text-xs font-black text-white italic whitespace-nowrap">{state.teams[nextUserGame.homeTeamId === state.userTeamId ? nextUserGame.awayTeamId : nextUserGame.homeTeamId].abbreviation}</p>
                     </div>
                  </div>

                  <button 
                    onClick={simulateGame}
                    className="relative z-10 w-full md:w-auto h-20 px-12 bg-white text-black rounded-[2rem] font-black uppercase italic tracking-tighter text-xl hover:bg-amber-500 transition-all active:scale-95 shadow-2xl"
                  >
                    Play Match
                  </button>
                </div>
              )}

              {/* NEXT MATCHES */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter">Upcoming Schedule</h3>
                    <button className="text-[8px] font-black uppercase tracking-widest text-zinc-500 hover:text-white">Full View</button>
                  </div>
                  <div className="space-y-3">
                    {state.schedule
                      .filter(m => (m.homeTeamId === state.userTeamId || m.awayTeamId === state.userTeamId) && !m.played)
                      .slice(0, 5)
                      .map((match, i) => {
                        const isHome = match.homeTeamId === state.userTeamId;
                        const opponentId = isHome ? match.awayTeamId : match.homeTeamId;
                        const opponent = NBA_TEAMS.find(t => t.id === opponentId);
                        
                        return (
                          <div key={match.id} className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:bg-zinc-900 transition-all">
                            <div className="flex items-center gap-6">
                              <div className="text-center w-12">
                                <p className="text-[8px] font-black text-zinc-600 uppercase">WK</p>
                                <p className="text-lg font-black text-white italic">{match.gameNumber}</p>
                              </div>
                              <div className="w-px h-8 bg-zinc-800" />
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-zinc-900 rounded-2xl p-2 border border-white/10">
                                  <img src={getTeamLogo(opponentId)} className="w-full h-full object-contain" />
                                </div>
                                <div>
                                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{isHome ? 'VS' : '@'} OPPONENT</p>
                                  <p className="text-sm font-black text-white uppercase italic">{opponent?.name || opponentId}</p>
                                </div>
                              </div>
                            </div>
                            <button className="w-10 h-10 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500 group-hover:bg-white group-hover:text-black transition-all">
                              <ChevronRight size={18} />
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* SIDEBAR HUB */}
                <div className="space-y-8">
                   <div className="bg-zinc-900 rounded-[2.5rem] p-8 border border-white/5 space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-[0.4em] text-zinc-600 italic text-center">League Leaders</h3>
                      <div className="space-y-4">
                         {/* Placeholder Leaders */}
                         {[
                           { cat: 'Points', val: '32.4', p: 'L. Doncic' },
                           { cat: 'Rebounds', val: '14.2', p: 'N. Jokic' },
                           { cat: 'Assists', val: '11.8', p: 'Tyrese Haliburton' }
                         ].map((l, i) => (
                           <div key={i} className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                              <div>
                                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{l.cat}</p>
                                <p className="text-xs font-black text-white italic uppercase">{l.p}</p>
                              </div>
                              <p className="text-lg font-black text-zinc-400 italic">{l.val}</p>
                           </div>
                         ))}
                      </div>
                      <button className="w-full py-4 text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">
                        View Standings
                      </button>
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'market' && (
            <motion.div 
              key="market"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto space-y-12 pb-20"
            >
              <div className="flex items-center justify-between">
                 <div className="space-y-1">
                   <h2 className="text-4xl font-black uppercase italic tracking-tighter">Free Agency</h2>
                   <p className="text-zinc-500 text-sm font-medium">Browse available cards to strengthen your roster.</p>
                 </div>
                 <div className="bg-zinc-900 border border-white/5 px-6 py-4 rounded-2xl flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[8px] font-black text-zinc-500 uppercase">Available Pool</p>
                      <p className="text-sm font-black text-white italic">{state.freeAgentPool.length} PLAYERS</p>
                    </div>
                 </div>
              </div>

              {state.season === 2025 ? (
                <div className="bg-zinc-900 border border-white/5 rounded-[3rem] p-12 text-center space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-500/10 blur-[80px] rounded-full" />
                  <div className="relative z-10 space-y-6">
                    <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center justify-center text-amber-500 mx-auto">
                       <AlertTriangle size={40} />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-3xl font-black uppercase italic tracking-tighter">Market Locked</h3>
                      <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed font-medium">
                        El mercado de agentes libres se abre al finalizar tu primera temporada. 
                        Completa los 82 partidos para desbloquear el Draft y la Free Agency.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                  {state.freeAgentPool.slice(0, 24).map((id) => {
                    const card = ALL_CARDS.find(c => c.id === id);
                    if (!card) return null;
                    return (
                      <motion.div key={id} className="space-y-4">
                        <CardItem card={card} isOwned={true} mode="mini" />
                        <button 
                          onClick={() => handleSignPlayer(id)}
                          className="w-full py-3 bg-white/5 border border-white/5 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                        >
                          Sign Player
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'trades' && (
             <motion.div 
              key="trades"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto space-y-12"
            >
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  {/* USER SIDE */}
                  <div className="space-y-6">
                     <h3 className="text-xl font-black uppercase italic tracking-tighter">Your Assets</h3>
                     <div className="bg-zinc-900 rounded-[2rem] p-6 border border-white/5 space-y-4 max-h-[500px] overflow-y-auto">
                        {userTeam.roster.map(id => {
                           const card = ALL_CARDS.find(c => c.id === id);
                           const isSelected = userOfferedIds.includes(id);
                           return (
                              <div 
                                key={id} 
                                onClick={() => setUserOfferedIds(prev => isSelected ? prev.filter(x => x !== id) : [...prev, id])}
                                className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${isSelected ? 'bg-amber-500/20 border border-amber-500/50' : 'bg-black/40 border border-white/5 hover:bg-white/5'}`}
                              >
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-800">
                                       <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card?.nbaId}.png`} className="w-full h-full object-contain" />
                                    </div>
                                    <span className="text-[10px] font-black text-white uppercase italic">{card?.name}</span>
                                 </div>
                                 <span className="text-xs font-black text-zinc-500 italic">{card?.stats.ovr}</span>
                              </div>
                           );
                        })}
                     </div>
                  </div>

                  {/* CPU SIDE */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <h3 className="text-xl font-black uppercase italic tracking-tighter">Target Team</h3>
                       <select 
                         onChange={(e) => {
                           setTradeTargetTeamId(e.target.value);
                           setCpuRequestedIds([]);
                         }}
                         className="bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest border border-white/10 px-4 py-2 rounded-xl outline-none"
                       >
                         <option value="">Select Team</option>
                         {NBA_TEAMS.filter(t => t.id !== state.userTeamId).map(t => (
                           <option key={t.id} value={t.id}>{t.name}</option>
                         ))}
                       </select>
                    </div>
                    
                    <div className="bg-zinc-900 rounded-[2rem] p-6 border border-white/5 space-y-4 min-h-[400px] flex flex-col items-center justify-center">
                       {!tradeTargetTeamId ? (
                         <div className="text-center space-y-4 opacity-20">
                            <History size={48} className="mx-auto" />
                            <p className="text-xs font-black uppercase tracking-widest">Select a team to view their roster</p>
                         </div>
                       ) : (
                         <div className="w-full space-y-4 max-h-[500px] overflow-y-auto">
                            {state.teams[tradeTargetTeamId].roster.map(id => {
                               const card = ALL_CARDS.find(c => c.id === id);
                               const isSelected = cpuRequestedIds.includes(id);
                               return (
                                  <div 
                                    key={id} 
                                    onClick={() => setCpuRequestedIds(prev => isSelected ? prev.filter(x => x !== id) : [...prev, id])}
                                    className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${isSelected ? 'bg-amber-500/20 border border-amber-500/50' : 'bg-black/40 border border-white/5 hover:bg-white/5'}`}
                                  >
                                     <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-800">
                                           <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card?.nbaId}.png`} className="w-full h-full object-contain" />
                                        </div>
                                        <span className="text-[10px] font-black text-white uppercase italic">{card?.name}</span>
                                     </div>
                                     <span className="text-xs font-black text-zinc-500 italic">{card?.stats.ovr}</span>
                                  </div>
                               );
                            })}
                         </div>
                       )}
                    </div>
                  </div>

                  {/* EVALUATION */}
                  <div className="space-y-6">
                     <h3 className="text-xl font-black uppercase italic tracking-tighter">Trade Summary</h3>
                     <div className="bg-zinc-900 rounded-[2.5rem] p-8 border border-white/5 space-y-8">
                        <div className="space-y-4">
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">You Send</span>
                              <span className="text-sm font-black text-white italic">{userOfferedIds.length} Players</span>
                           </div>
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">You Receive</span>
                              <span className="text-sm font-black text-white italic">{cpuRequestedIds.length} Players</span>
                           </div>
                           <div className="w-full h-px bg-white/5" />
                           <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-white italic uppercase">Value Balance</span>
                              <span className={`text-sm font-black italic ${userOfferedIds.length > 0 && cpuRequestedIds.length > 0 ? 'text-amber-500' : 'text-zinc-700'}`}>
                                 {Math.round(userOfferedIds.reduce((sum, id) => sum + (ALL_CARDS.find(c => c.id === id)?.stats.ovr || 0), 0))} vs {Math.round(cpuRequestedIds.reduce((sum, id) => sum + (ALL_CARDS.find(c => c.id === id)?.stats.ovr || 0), 0))}
                              </span>
                           </div>
                        </div>

                        <button 
                          disabled={!tradeTargetTeamId || userOfferedIds.length === 0 || cpuRequestedIds.length === 0}
                          onClick={handleExecuteTrade}
                          className="w-full py-6 bg-white text-black rounded-3xl font-black uppercase italic tracking-tighter disabled:opacity-30 disabled:grayscale transition-all hover:scale-105 active:scale-95 shadow-2xl"
                        >
                           Propose Trade
                        </button>
                     </div>
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'league' && (
             <motion.div 
              key="league"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto space-y-12"
            >
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* CONFERENCE STANDINGS */}
                  {['East', 'West'].map(conf => (
                    <div key={conf} className="space-y-6">
                       <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                         {conf}ern Conference
                         <Trophy className="text-zinc-800" size={24} />
                       </h3>
                       <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] overflow-hidden">
                          <table className="w-full text-left">
                             <thead className="bg-white/5 border-b border-white/5">
                                <tr className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                                   <th className="px-6 py-4">TEAM</th>
                                   <th className="px-6 py-4 text-center">W-L</th>
                                   <th className="px-6 py-4 text-center">PCT</th>
                                </tr>
                             </thead>
                             <tbody>
                                {(Object.values(state.teams) as TeamObject[])
                                  .filter(t => t.conference === conf)
                                  .sort((a, b) => b.wins - a.wins || a.losses - b.losses)
                                  .map((team, i) => (
                                    <tr key={team.teamId} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${team.isHuman ? 'bg-amber-500/5' : ''}`}>
                                       <td className="px-6 py-4">
                                          <div className="flex items-center gap-4">
                                             <span className="text-[10px] font-black text-zinc-700 w-4">{i + 1}</span>
                                             <img src={getTeamLogo(team.teamId)} className="w-6 h-6 object-contain" />
                                             <span className="text-xs font-black text-white italic uppercase">{team.name}</span>
                                          </div>
                                       </td>
                                       <td className="px-6 py-4 text-center text-xs font-black text-zinc-400">{team.wins} - {team.losses}</td>
                                       <td className="px-6 py-4 text-center text-xs font-bold text-zinc-600">
                                          {(team.wins / (team.wins + team.losses || 1)).toFixed(3)}
                                       </td>
                                    </tr>
                                  ))}
                             </tbody>
                          </table>
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}

          {activeTab === 'lineup' && (
            <motion.div 
              key="lineup"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto space-y-12 pb-20"
            >
              <div className="flex flex-col lg:flex-row gap-12">
                {/* STARTING FIVE */}
                <div className="flex-1 space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">Starting Five</h3>
                    <div className="px-4 py-2 bg-amber-500 rounded-xl text-[10px] font-black text-black uppercase tracking-widest">
                      Team OVR: {Math.round(Object.values(userTeam.lineup).filter(v => typeof v === 'string').reduce((acc, id) => acc + (ALL_CARDS.find(c => c.id === id)?.stats.ovr || 70), 0) / 5)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {(['PG', 'SG', 'SF', 'PF', 'C'] as const).map((pos) => {
                      const cardId = userTeam.lineup[pos];
                      const card = ALL_CARDS.find(c => c.id === cardId);
                      return (
                        <div key={pos} className="space-y-3">
                          <p className="text-center text-[10px] font-black text-zinc-600 uppercase tracking-widest">{pos}</p>
                          <div 
                            onClick={() => setLineupModalPos(pos)}
                            className="aspect-[2/3] cursor-pointer hover:scale-105 transition-all"
                          >
                            {card ? (
                              <CardItem card={card} isOwned={true} mode="mini" />
                            ) : (
                              <div className="w-full h-full bg-zinc-900 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center">
                                <Plus className="text-zinc-800" size={24} />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* BENCH & RESERVES */}
                <div className="w-full lg:w-96 space-y-6">
                   <h3 className="text-xl font-black uppercase italic tracking-tighter">Bench</h3>
                   <div className="grid grid-cols-3 gap-3">
                     {userTeam.lineup.bench.map((id, i) => {
                       const card = ALL_CARDS.find(c => c.id === id);
                       if (!card) return null;
                       return (
                         <div key={id} className="space-y-2">
                           <div onClick={() => setLineupModalPos('bench')} className="cursor-pointer hover:scale-105 transition-all">
                              <CardItem card={card} isOwned={true} mode="mini" />
                           </div>
                         </div>
                       );
                     })}
                   </div>
                </div>
              </div>

              {/* MODAL / SELECTOR */}
              <AnimatePresence>
                {lineupModalPos && (
                  <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setLineupModalPos(null)}
                      className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
                    />
                    <motion.div 
                      initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                      className="relative w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-[3rem] p-8 md:p-12 space-y-8 max-h-[80vh] overflow-hidden flex flex-col"
                    >
                      <div className="flex items-center justify-between shrink-0">
                        <div className="space-y-1">
                          <h3 className="text-3xl font-black uppercase italic tracking-tighter">Select Player</h3>
                          <p className="text-zinc-500 text-xs font-black uppercase tracking-widest italic">{lineupModalPos} Position Slot</p>
                        </div>
                        <button onClick={() => setLineupModalPos(null)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                          <CloseIcon size={24} />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto pr-4 space-y-4">
                        {userTeam.roster.map(id => {
                          const card = ALL_CARDS.find(c => c.id === id);
                          if (!card) return null;
                          const isAssigned = Object.values(userTeam.lineup).flat().includes(id);
                          return (
                            <div 
                              key={id}
                              onClick={() => handleUpdateLineup(id)}
                              className={`group flex items-center justify-between p-6 rounded-3xl cursor-pointer transition-all ${isAssigned ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-black/40 border border-white/5 hover:bg-white/5'}`}
                            >
                              <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-800">
                                   <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card.nbaId}.png`} className="w-full h-full object-contain" />
                                </div>
                                <div>
                                  <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">{card.name}</h4>
                                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{card.position} • {card.rarity.toUpperCase()}</p>
                                </div>
                              </div>
                              <div className="text-right flex items-center gap-8">
                                <div>
                                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">OVR</p>
                                  <p className="text-2xl font-black text-amber-500 italic">{card.stats.ovr}</p>
                                </div>
                                <ArrowRight className="text-zinc-800 group-hover:text-white group-hover:translate-x-2 transition-all" size={24} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {/* ROSTER LIST & MANAGEMENT */}
              <div className="space-y-6 pt-12 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-black uppercase italic tracking-tighter">Complete Roster ({userTeam.roster.length}/15)</h3>
                  <div className="flex items-center gap-4 text-xs font-black text-zinc-500 uppercase tracking-widest">
                    <span>CAP SPACE: <span className="text-amber-500">${((136000000 - userTeam.payroll)/1000000).toFixed(1)}M</span></span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userTeam.roster.map(id => {
                    const card = ALL_CARDS.find(c => c.id === id);
                    const contract = userTeam.contracts[id];
                    if (!card) return null;
                    return (
                      <div key={id} className="bg-zinc-900 border border-white/5 rounded-3xl p-6 flex items-center justify-between group hover:border-white/20 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-800">
                             <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card.nbaId}.png`} className="w-full h-full object-contain" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-white italic uppercase">{card.name}</p>
                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">${((contract?.salary || 0) / 1000000).toFixed(1)}M • {contract?.type}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                             const res = marketService.releasePlayer(state, id);
                             if (res.success) setState({ ...state });
                             else alert(res.reason);
                          }}
                          className="px-4 py-2 border border-red-500/20 text-red-500 text-[8px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                        >
                          Release
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div 
              key="stats"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto space-y-8"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-4xl font-black uppercase italic tracking-tighter">League Stats</h2>
                <div className="flex gap-2">
                   {['Points', 'Rebounds', 'Assists'].map(cat => (
                     <button key={cat} className="px-6 py-2 bg-zinc-900 border border-white/5 rounded-xl text-[8px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">{cat}</button>
                   ))}
                </div>
              </div>

              <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-white/5 border-b border-white/5">
                    <tr className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                      <th className="px-8 py-6">Player</th>
                      <th className="px-8 py-6">Team</th>
                      <th className="px-8 py-6 text-center">GP</th>
                      <th className="px-8 py-6 text-center">PPG</th>
                      <th className="px-8 py-6 text-center">RPG</th>
                      <th className="px-8 py-6 text-center">APG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.entries(state.stats.seasonal) as [string, any][])
                      .sort(([, a], [, b]) => (b.points / b.gamesPlayed) - (a.points / a.gamesPlayed))
                      .slice(0, 20)
                      .map(([playerId, stats]) => {
                        const card = ALL_CARDS.find(c => c.id === playerId);
                        const team = (Object.values(state.teams) as TeamObject[]).find(t => 
                          [t.lineup.PG, t.lineup.SG, t.lineup.SF, t.lineup.PF, t.lineup.C, ...t.lineup.bench].includes(playerId)
                        );
                        if (!card) return null;
                        return (
                          <tr key={playerId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="px-8 py-4">
                               <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-zinc-800 rounded-xl overflow-hidden p-1">
                                    <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card.nbaId}.png`} className="w-full h-full object-contain" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-black text-white italic uppercase">{card.name}</p>
                                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{card.position}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-4">
                              {team ? (
                                <div className="flex items-center gap-2">
                                  <img src={getTeamLogo(team.teamId)} className="w-5 h-5 object-contain" />
                                  <span className="text-[10px] font-bold text-zinc-400 uppercase">{team.abbreviation}</span>
                                </div>
                              ) : <span className="text-[10px] font-bold text-zinc-600">FA</span>}
                            </td>
                            <td className="px-8 py-4 text-center text-xs font-black text-zinc-400">{stats.gamesPlayed}</td>
                            <td className="px-8 py-4 text-center text-sm font-black text-white italic">{(stats.points / stats.gamesPlayed).toFixed(1)}</td>
                            <td className="px-8 py-4 text-center text-sm font-black text-zinc-400">{(stats.rebounds / stats.gamesPlayed).toFixed(1)}</td>
                            <td className="px-8 py-4 text-center text-sm font-black text-zinc-400">{(stats.assists / stats.gamesPlayed).toFixed(1)}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MATCH RESULT MODAL */}
        <AnimatePresence>
          {lastGameResult && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
              
              <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[3rem] p-10 overflow-hidden relative shadow-[0_0_100px_rgba(0,0,0,0.5)]"
              >
                <button 
                  onClick={() => setLastGameResult(null)}
                  className="absolute top-10 right-10 text-zinc-500 hover:text-white transition-colors"
                >
                  <CloseIcon size={24} />
                </button>

                <div className="space-y-12">
                  <div className="text-center space-y-3">
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.6em] animate-pulse">Session Terminated</p>
                    <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white">Match Decided</h2>
                  </div>

                  {/* Score Board */}
                  <div className="flex items-center justify-between gap-8 bg-zinc-900/50 p-10 rounded-[2.5rem] border border-white/5 relative group">
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />
                    
                    <div className="flex-1 text-center space-y-6 relative z-10">
                      <div className="w-24 h-24 mx-auto bg-black rounded-3xl p-4 border border-white/5 shadow-2xl">
                        <img src={getTeamLogo(lastGameResult.match.homeTeamId)} className="w-full h-full object-contain" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-zinc-500 uppercase tracking-widest">{state.teams[lastGameResult.match.homeTeamId].abbreviation}</p>
                        <p className="text-xl font-black uppercase italic tracking-tighter text-white truncate px-2">{state.teams[lastGameResult.match.homeTeamId].name}</p>
                      </div>
                      <p className={`text-7xl font-black italic ${lastGameResult.result.score.home > lastGameResult.result.score.away ? 'text-white' : 'text-zinc-600'}`}>
                        {lastGameResult.result.score.home}
                      </p>
                    </div>

                    <div className="text-2xl font-black italic text-zinc-800 rotate-12">VS</div>

                    <div className="flex-1 text-center space-y-6 relative z-10">
                      <div className="w-24 h-24 mx-auto bg-black rounded-3xl p-4 border border-white/5 shadow-2xl">
                        <img src={getTeamLogo(lastGameResult.match.awayTeamId)} className="w-full h-full object-contain" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-zinc-500 uppercase tracking-widest">{state.teams[lastGameResult.match.awayTeamId].abbreviation}</p>
                        <p className="text-xl font-black uppercase italic tracking-tighter text-white truncate px-2">{state.teams[lastGameResult.match.awayTeamId].name}</p>
                      </div>
                      <p className={`text-7xl font-black italic ${lastGameResult.result.score.away > lastGameResult.result.score.home ? 'text-white' : 'text-zinc-600'}`}>
                        {lastGameResult.result.score.away}
                      </p>
                    </div>
                  </div>

                  {/* TOP TIERS */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">Critical Data Points</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[lastGameResult.result.boxScore.home[0], lastGameResult.result.boxScore.away[0]].map((p, i) => {
                        const card = ALL_CARDS.find(c => c.id === p.playerId);
                        return (
                          <div key={i} className="bg-white/5 p-5 rounded-3xl flex items-center gap-5 border border-white/5 hover:border-amber-500/20 transition-all group">
                             <div className="w-14 h-14 bg-zinc-900 rounded-2xl overflow-hidden p-1 group-hover:scale-105 transition-all">
                               <img src={card?.imageUrl} className="w-full h-full object-cover" />
                             </div>
                             <div className="flex-1">
                                <p className="text-xs font-black text-white uppercase italic truncate">{card?.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-black text-amber-500">{p.points} <span className="text-[7px] text-zinc-600">PTS</span></span>
                                  <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                                  <span className="text-[10px] font-black text-zinc-400">{p.rebounds} <span className="text-[7px] text-zinc-600">REB</span></span>
                                  <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                                  <span className="text-[10px] font-black text-zinc-400">{p.assists} <span className="text-[7px] text-zinc-600">AST</span></span>
                                </div>
                             </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button 
                    onClick={() => setLastGameResult(null)}
                    className="w-full py-6 bg-white text-black rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-amber-400 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)] active:scale-95"
                  >
                    Confirm & Proceed
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CareerView;
