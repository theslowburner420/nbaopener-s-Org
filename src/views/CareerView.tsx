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
import { FranchisePhase, TeamObject, FranchiseMatch, PlayoffSeries } from '../franchise/types';
import { marketService } from '../franchise/services/marketService';
import { tradeEngine } from '../franchise/services/tradeEngine';
import { playoffService } from '../franchise/services/playoffService';
import CardItem from '../components/CardItem';
import { X as CloseIcon, AlertTriangle, Sparkles } from 'lucide-react';

type FranchiseTab = 'hub' | 'lineup' | 'market' | 'league' | 'stats' | 'trades' | 'settings' | 'draft' | 'office';

const CareerView: React.FC = () => {
  const { state, isLoading, startNewFranchise, advanceWeek, resetFranchise, setState } = useFranchise();

  const [activeTab, setActiveTab] = useState<FranchiseTab>('hub');
  const [activeStatsCat, setActiveStatsCat] = useState<'Points' | 'Rebounds' | 'Assists'>('Points');
  const [selectedConf, setSelectedConf] = useState<'East' | 'West'>('East');
  const [lineupModalPos, setLineupModalPos] = useState<string | null>(null);
  const [tradeTargetTeamId, setTradeTargetTeamId] = useState<string | null>(null);
  const [userOfferedIds, setUserOfferedIds] = useState<string[]>([]);
  const [cpuRequestedIds, setCpuRequestedIds] = useState<string[]>([]);
  const [userOfferedPickIds, setUserOfferedPickIds] = useState<string[]>([]);
  const [cpuRequestedPickIds, setCpuRequestedPickIds] = useState<string[]>([]);
  const [lastGameResult, setLastGameResult] = useState<{ result: any; match: FranchiseMatch } | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

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
      requestedPlayerIds: cpuRequestedIds,
      offeredPickIds: userOfferedPickIds,
      requestedPickIds: cpuRequestedPickIds
    };
    
    const result = tradeEngine.evaluateUserTrade(state, offer);
    if (result.accepted) {
      tradeEngine.executeTrade(state, offer);
      alert("Trade Accepted!");
      setUserOfferedIds([]);
      setCpuRequestedIds([]);
      setUserOfferedPickIds([]);
      setCpuRequestedPickIds([]);
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
        <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter">Franchise</h1>
            <p className="text-zinc-500 max-w-2xl font-medium text-sm md:text-base">Select your team to begin. Build a dynasty starting from the 2025 Season.</p>
          </div>

          <div className="flex gap-2 md:gap-4 border-b border-white/5 pb-4 overflow-x-auto no-scrollbar">
            {['East', 'West'].map((conf) => (
              <button 
                key={conf}
                onClick={() => setSelectedConf(conf as any)}
                className={`px-6 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedConf === conf ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'}`}
              >
                {conf}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
            {NBA_TEAMS.filter(t => t.conference === selectedConf).map((team) => (
              <motion.div 
                key={team.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => startNewFranchise(team.id)}
                className="group cursor-pointer bg-zinc-900 border border-white/5 rounded-2xl md:rounded-[2rem] p-3 md:p-8 flex flex-col items-center justify-center gap-2 md:gap-4 hover:bg-zinc-800 transition-all aspect-square sm:aspect-auto"
              >
                <div className="w-10 h-10 md:w-20 md:h-20 transition-transform group-hover:rotate-6 duration-500">
                  <img src={getTeamLogo(team.id)} alt={team.name} className="w-full h-full object-contain" />
                </div>
                <div className="text-center">
                  <p className="text-[9px] md:text-sm font-black text-white italic uppercase truncate w-full">{team.id}</p>
                  <p className="hidden md:block text-[8px] font-black text-zinc-600 uppercase tracking-widest">{team.name}</p>
                </div>
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

  const PlayoffSeriesCard: React.FC<{ series: PlayoffSeries; teams: Record<string, TeamObject> }> = ({ series, teams }) => {
    const t1 = teams[series.team1Id];
    const t2 = teams[series.team2Id];
    const isUserInvolved = t1.isHuman || t2.isHuman;

    return (
      <div className={`bg-zinc-900/50 border ${isUserInvolved ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'border-white/5'} rounded-2xl p-4 space-y-3`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={getTeamLogo(t1.teamId)} className="w-6 h-6 object-contain" />
            <span className={`text-[10px] font-black uppercase italic ${series.winnerId === t1.teamId ? 'text-white' : 'text-zinc-500'}`}>{t1.abbreviation}</span>
          </div>
          <span className="text-sm font-black italic text-white">{series.wins1}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={getTeamLogo(t2.teamId)} className="w-6 h-6 object-contain" />
            <span className={`text-[10px] font-black uppercase italic ${series.winnerId === t2.teamId ? 'text-white' : 'text-zinc-500'}`}>{t2.abbreviation}</span>
          </div>
          <span className="text-sm font-black italic text-white">{series.wins2}</span>
        </div>
        {series.winnerId && (
          <div className="pt-2 border-t border-white/5 text-center">
            <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">{teams[series.winnerId].abbreviation} ADVANCES</span>
          </div>
        )}
      </div>
    );
  };

  const renderPlayoffs = () => {
    if (!state) return null;
    const playinSeries = state.playoffSeries.filter(s => s.round === 0);
    const round1Series = state.playoffSeries.filter(s => s.round === 1);
    const round2Series = state.playoffSeries.filter(s => s.round === 2);
    const round3Series = state.playoffSeries.filter(s => s.round === 3);
    const finalsSeries = state.playoffSeries.filter(s => s.round === 4);

    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto space-y-12"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white">NBA Playoffs</h2>
            <p className="text-zinc-500 text-[10px] md:text-sm font-medium uppercase tracking-widest">{state.season} Season Road to the Championship</p>
          </div>
          <div className="flex items-center gap-4">
             {state.playoffSeries.every(s => s.winnerId) ? (
               <button 
                 onClick={advanceWeek}
                 className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:scale-105 transition-all"
               >
                 Advance to Offseason
               </button>
             ) : (
                <button 
                  onClick={simulateGame}
                  className="px-8 py-4 bg-amber-500 text-black rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-[0_0_40px_rgba(245,158,11,0.3)] hover:scale-105 transition-all flex items-center gap-2"
                >
                  <Play size={16} fill="currentColor" />
                  Play Next Game
                </button>
             )}
          </div>
        </div>

        <div className="flex gap-8 overflow-x-auto pb-12 no-scrollbar min-h-[600px] items-center">
          {/* Play-In */}
          {playinSeries.length > 0 && (
            <div className="flex flex-col gap-8 shrink-0 w-48">
              <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center">Play-In</h3>
              {playinSeries.map(s => <PlayoffSeriesCard key={s.id} series={s} teams={state.teams} />)}
            </div>
          )}

          {/* Round 1 */}
          <div className="flex flex-col gap-8 shrink-0 w-48">
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center">First Round</h3>
            {round1Series.map(s => <PlayoffSeriesCard key={s.id} series={s} teams={state.teams} />)}
          </div>

          {/* Conference Semis */}
          <div className="flex flex-col gap-12 shrink-0 w-48 justify-around">
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center">Conf. Semifinals</h3>
            {round2Series.length > 0 ? round2Series.map(s => <PlayoffSeriesCard key={s.id} series={s} teams={state.teams} />) : <div className="h-40 border border-dashed border-white/5 rounded-2xl" />}
          </div>

          {/* Conference Finals */}
          <div className="flex flex-col gap-16 shrink-0 w-48 justify-around">
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center">Conf. Finals</h3>
            {round3Series.length > 0 ? round3Series.map(s => <PlayoffSeriesCard key={s.id} series={s} teams={state.teams} />) : <div className="h-40 border border-dashed border-white/5 rounded-2xl" />}
          </div>

          {/* NBA Finals */}
          <div className="flex flex-col items-center shrink-0 w-64 justify-center">
             <div className="w-full bg-gradient-to-br from-zinc-900 to-black border border-amber-500/20 rounded-[3rem] p-8 space-y-6 text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-500/10 blur-[80px] rounded-full" />
                <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center text-black mx-auto shadow-[0_0_40px_rgba(245,158,11,0.4)]">
                   <Trophy size={32} />
                </div>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">NBA Finals</h3>
                {finalsSeries.length > 0 ? (
                  <PlayoffSeriesCard series={finalsSeries[0]} teams={state.teams} />
                ) : (
                  <div className="p-8 border border-dashed border-white/10 rounded-2xl text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                    Waiting for Champions
                  </div>
                )}
             </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const userTeam = state.teams[state.userTeamId];
  const nextUserGame = state.schedule.find(m => 
    !m.played && (m.homeTeamId === state.userTeamId || m.awayTeamId === state.userTeamId)
  );

  const pendingUserGamesThisCycle = state.schedule.filter(m => 
    !m.played && (m.homeTeamId === state.userTeamId || m.awayTeamId === state.userTeamId) && m.gameNumber < state.week + 4
  );

  return (
    <div className="bg-black flex flex-col relative w-full min-h-full">
      {/* COMPACT HEADER */}
      <div className="bg-zinc-950 border-b border-white/5 px-4 h-[56px] md:h-auto md:px-12 md:py-6 flex items-center justify-between gap-4 md:gap-6 sticky top-0 z-50">
        <div className="flex items-center gap-3 md:gap-6 h-full overflow-hidden">
          <div className="w-8 h-8 md:w-16 md:h-16 bg-zinc-900 rounded-lg md:rounded-[1.5rem] p-1.5 md:p-3 border border-white/5 shadow-2xl shrink-0">
            <img src={getTeamLogo(userTeam.teamId)} className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col md:block overflow-hidden">
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <h2 className="text-[10px] md:text-2xl font-black uppercase italic tracking-tighter text-white truncate">
                <span className="md:hidden">{userTeam.abbreviation} • {userTeam.wins}-{userTeam.losses} • {state.season}</span>
                <span className="hidden md:inline">{userTeam.name}</span>
              </h2>
              <div className="hidden md:flex items-center gap-1 text-[8px] md:text-sm font-black text-zinc-400">
                <span>{userTeam.wins} - {userTeam.losses}</span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-4 mt-1">
              <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{state.phase === 'Regular' ? 'Regular Season' : state.phase}</span>
              <div className="w-px h-3 bg-zinc-800" />
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-amber-500">${(userTeam.payroll/1000000).toFixed(1)}M</span>
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Payroll</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
           <button 
             onClick={() => setShowExitConfirm(true)}
             className="px-3 py-2 md:px-6 md:py-3 bg-zinc-900 border border-white/5 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all"
           >
             Exit
           </button>

           <div className="hidden md:flex items-center gap-3">
             {pendingUserGamesThisCycle.length > 0 ? (
               <button 
                onClick={simulateGame}
                className="flex items-center gap-3 bg-amber-500 text-black px-8 py-4 rounded-2xl font-black uppercase italic tracking-tighter text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(245,158,11,0.2)]"
               >
                 <Play size={16} fill="currentColor" />
                 Play Game
               </button>
             ) : (
               <button 
                onClick={advanceWeek}
                className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black uppercase italic tracking-tighter text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
               >
                 <TrendingUp size={16} />
                 Advance
               </button>
             )}
           </div>

           <button 
             onClick={resetFranchise}
             className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
           >
             <SettingsIcon size={14} className="md:hidden" />
             <SettingsIcon size={20} className="hidden md:block" />
           </button>
        </div>
      </div>

      {/* CHAMPION MODAL */}
      <AnimatePresence>
        {state.championId && (
          <div className="fixed inset-0 z-[20000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
             <motion.div 
               initial={{ scale: 0.5, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="text-center space-y-12 max-w-2xl w-full"
             >
                <motion.div 
                  animate={{ 
                    rotate: [0, -5, 5, -5, 5, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="relative"
                >
                   <div className="absolute inset-0 bg-amber-500/20 blur-[120px] rounded-full animate-pulse" />
                   <div className="w-40 h-40 md:w-64 md:h-64 bg-gradient-to-br from-amber-200 via-amber-500 to-amber-700 rounded-[3rem] md:rounded-[4rem] flex items-center justify-center text-black mx-auto shadow-[0_0_100px_rgba(245,158,11,0.5)] relative z-10 p-8">
                      <Trophy size={160} className="w-full h-full" />
                   </div>
                </motion.div>

                <div className="space-y-4">
                   <h2 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.8em]">NBA Season {state.season}</h2>
                   <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter text-white">World Champions</h1>
                   <div className="flex items-center justify-center gap-6 mt-8">
                      <img src={getTeamLogo(state.championId)} className="w-16 h-16 md:w-24 md:h-24 object-contain" />
                      <div className="text-left border-l border-white/20 pl-6">
                        <h3 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-white">{state.teams[state.championId].name}</h3>
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Title Secured</p>
                      </div>
                   </div>
                </div>

                <div className="pt-8">
                  <button 
                    onClick={() => {
                        // Advance to off-season logic or Draft
                        // For now we just reset championId and advance phase?
                        // Or set phase to Draft
                        const newState = { ...state, championId: undefined, phase: 'Draft' as const, season: state.season + 1, week: 0 };
                        // We also need to clear schedule and playoffSeries for new season
                        newState.schedule = []; 
                        newState.playoffSeries = [];
                        // In a real game we would generate new schedule here
                        // But let's follow the user's "Offseason/Draft" instruction
                        setState(newState);
                        stateService.save(newState);
                    }}
                    className="group relative px-12 py-5 bg-white text-black rounded-2xl font-black uppercase italic tracking-tight text-xl hover:bg-amber-500 transition-all active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.2)]"
                  >
                    Proceed to Draft
                    <Sparkles className="absolute -top-2 -right-2 text-white group-hover:animate-spin" size={24} />
                  </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EXIT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-zinc-900 border border-white/5 p-10 rounded-[3rem] max-w-sm w-full text-center space-y-8"
            >
              <div className="space-y-4">
                <h3 className="text-3xl font-black uppercase italic tracking-tighter">Exit Franchise?</h3>
                <p className="text-zinc-500 text-sm font-medium">Are you sure you want to exit? Your progress is saved automatically.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setShowExitConfirm(false)}
                  className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px]"
                >
                  Stay
                </button>
                <button 
                  onClick={() => {
                    // We don't actually have a prop to "close" it, but we can reset the state to null to go back to selection or simulate home transition
                    // Actually useFranchise returns startNewFranchise but not a "leave" function.
                    // We can just set the state to something that signifies "not in franchise" but that might be tricky globally.
                    // For now, let's just use window.location.reload() or navigate if we had routing.
                    // The request says "vuelve a la vista principal del juego (HomeView)".
                    // In this SPA, HomeView is shown when franchise state is null OR a different view is active.
                    // I will clear the state in the current view's local state or reset the whole thing if that's what's meant.
                    // "Su progreso no se borra, solo se sale de la vista."
                    // This implies we need a way to "suspend" the franchise mode view.
                    // Let's assume the parent handles the switching.
                    window.location.href = '/'; 
                  }}
                  className="w-full py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-black uppercase tracking-widest text-[8px]"
                >
                  Confirm Exit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NAVIGATION */}
      <div className="bg-zinc-950 flex px-6 md:px-12 overflow-x-auto no-scrollbar gap-2 py-2">
        {[
          { id: 'hub', label: 'HUB', icon: LayoutDashboard },
          { id: 'lineup', label: 'ROSTER', icon: Users },
          { id: 'market', label: 'MARKET', icon: ShoppingCart },
          { id: 'trades', label: 'TRADES', icon: History },
          { id: 'office', label: 'OFFICE', icon: Building },
          { id: 'league', label: 'LEAGUE', icon: BarChart3 },
          { id: 'stats', label: 'STATS', icon: BarChart3 },
          ...(state.phase === 'Draft' ? [{ id: 'draft', label: 'DRAFT', icon: Sparkles }] : [])
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
      <div className="p-4 md:p-12 relative overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'hub' && (
            <motion.div 
              key="hub"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto space-y-12 pb-20"
            >
              {state.phase === 'Draft' && (
                <div className="bg-gradient-to-br from-amber-500/20 to-zinc-900 border border-amber-500/30 rounded-3xl p-8 text-center space-y-6">
                   <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-black mx-auto">
                      <Sparkles size={32} />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Draft is Active!</h3>
                      <p className="text-zinc-500 text-sm font-medium">Head to the Draft tab to select your rookies for the upcoming season.</p>
                   </div>
                   <button 
                     onClick={() => setActiveTab('draft')}
                     className="px-8 py-3 bg-white text-black rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 transition-all"
                   >
                     Go to Draft
                   </button>
                </div>
              )}

              {state.phase === 'Regular' ? (
                <>
                  {/* TOP FEATURE: NEXT MATCH */}
                  {nextUserGame && (
                <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-3xl md:rounded-[3rem] p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="space-y-4 md:space-y-6 relative z-10 text-center md:text-left w-full md:w-auto">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em]">Next Appointment</p>
                      <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white">Gameday</h3>
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

                  <div className="flex items-center gap-6 md:gap-12 relative z-10">
                     <div className="text-center space-y-2 md:space-y-3">
                        <div className="w-16 h-16 md:w-24 md:h-24 bg-zinc-950 rounded-2xl md:rounded-[2rem] p-3 md:p-5 border border-white/5 shadow-2xl group-hover:scale-110 transition-all duration-500">
                          <img src={getTeamLogo(state.userTeamId)} className="w-full h-full object-contain" />
                        </div>
                        <p className="text-[10px] md:text-xs font-black text-white italic whitespace-nowrap">{state.teams[state.userTeamId].abbreviation}</p>
                     </div>
                     <div className="text-xl md:text-3xl font-black italic text-zinc-800">VS</div>
                     <div className="text-center space-y-2 md:space-y-3">
                        <div className="w-16 h-16 md:w-24 md:h-24 bg-zinc-950 rounded-2xl md:rounded-[2rem] p-3 md:p-5 border border-white/5 shadow-2xl group-hover:scale-110 transition-all duration-500">
                          <img src={getTeamLogo(nextUserGame.homeTeamId === state.userTeamId ? nextUserGame.awayTeamId : nextUserGame.homeTeamId)} className="w-full h-full object-contain" />
                        </div>
                        <p className="text-[10px] md:text-xs font-black text-white italic whitespace-nowrap">{state.teams[nextUserGame.homeTeamId === state.userTeamId ? nextUserGame.awayTeamId : nextUserGame.homeTeamId].abbreviation}</p>
                     </div>
                  </div>

                  <button 
                    onClick={simulateGame}
                    className="relative z-10 w-full md:w-auto h-16 md:h-20 px-8 md:px-12 bg-white text-black rounded-2xl md:rounded-[2rem] font-black uppercase italic tracking-tighter text-lg md:text-xl hover:bg-amber-500 transition-all active:scale-95 shadow-2xl"
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
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    {state.schedule
                      .filter(m => (m.homeTeamId === state.userTeamId || m.awayTeamId === state.userTeamId) && !m.played)
                      .slice(0, 5)
                      .map((match, i) => {
                        const isHome = match.homeTeamId === state.userTeamId;
                        const opponentId = isHome ? match.awayTeamId : match.homeTeamId;
                        const opponent = NBA_TEAMS.find(t => t.id === opponentId);
                        
                        return (
                          <div key={match.id} className="bg-zinc-900/50 border border-white/5 rounded-3xl p-4 md:p-6 flex items-center justify-between group hover:bg-zinc-900 transition-all">
                            <div className="flex items-center gap-3 md:gap-6">
                              <div className="text-center w-8 md:w-12">
                                <p className="text-[8px] font-black text-zinc-600 uppercase">WK</p>
                                <p className="text-sm md:text-lg font-black text-white italic">{match.gameNumber}</p>
                              </div>
                              <div className="w-px h-8 bg-zinc-800" />
                              <div className="flex items-center gap-3 md:gap-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-zinc-900 rounded-2xl p-2 border border-white/10">
                                  <img src={getTeamLogo(opponentId)} className="w-full h-full object-contain" />
                                </div>
                                <div className="max-w-[120px] md:max-w-none">
                                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{isHome ? 'VS' : '@'} OPPONENT</p>
                                  <p className="text-xs md:text-sm font-black text-white uppercase italic truncate">{opponent?.name || opponentId}</p>
                                </div>
                              </div>
                            </div>
                            <button className="md:px-6 py-2 border border-white/5 rounded-xl text-[8px] font-black text-zinc-600 uppercase tracking-widest group-hover:border-amber-500/50 group-hover:text-amber-500 transition-all hidden md:block">
                              Details
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
                         {(['Points', 'Rebounds', 'Assists'] as const).map((cat) => {
                           const leader = (Object.entries(state.stats?.seasonal || {}) as [string, any][])
                             .sort(([, a], [, b]) => {
                               const valA = cat === 'Points' ? a.points : cat === 'Rebounds' ? a.rebounds : a.assists;
                               const valB = cat === 'Points' ? b.points : cat === 'Rebounds' ? b.rebounds : b.assists;
                               return (valB / (b.gamesPlayed || 1)) - (valA / (a.gamesPlayed || 1));
                             })[0];
                           
                           if (!leader) return null;
                           const [playerId, stats] = leader;
                           const card = ALL_CARDS.find(c => c.id === playerId);
                           const value = (cat === 'Points' ? stats.points : cat === 'Rebounds' ? stats.rebounds : stats.assists) / (stats.gamesPlayed || 1);

                           return (
                             <div key={cat} className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                                <div>
                                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{cat}</p>
                                  <p className="text-xs font-black text-white italic uppercase truncate max-w-[100px]">{card?.name.split(' ').pop() || 'N/A'}</p>
                                </div>
                                <p className="text-lg font-black text-amber-500 italic">{value.toFixed(1)}</p>
                             </div>
                           );
                         })}
                      </div>
                      <button 
                        onClick={() => setActiveTab('hub')} // Or just stay here
                        className="w-full py-4 text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors"
                      >
                        Season Statistics
                      </button>
                   </div>
                </div>
              </div>
            </>
            ) : (
              renderPlayoffs()
            )}
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
                        The free agent market opens after finishing your first season. 
                        Complete all 82 games to unlock the Draft and Free Agency.
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
              className="max-w-6xl mx-auto space-y-6 pb-24"
            >
               <div className="flex items-center justify-between mb-2">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">Trade Negotiations</h3>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Select players to swap</p>
                  </div>
                  <select 
                    value={tradeTargetTeamId || ""}
                    onChange={(e) => {
                      setTradeTargetTeamId(e.target.value);
                      setCpuRequestedIds([]);
                    }}
                    className="bg-zinc-900 text-[11px] font-black uppercase tracking-widest text-white border border-white/10 px-4 py-2 rounded-xl outline-none"
                  >
                    <option value="">Select Team</option>
                    {NBA_TEAMS.filter(t => t.id !== state.userTeamId).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  {/* USER SIDE */}
                  <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[500px]">
                     <div className="p-3 border-b border-white/5 bg-white/2 flex items-center justify-between">
                        <span className="text-[10px] font-black text-white italic">YOUR ASSETS</span>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase">{userOfferedIds.length + userOfferedPickIds.length} Selected</span>
                     </div>
                     <div className="flex-1 overflow-y-auto divide-y divide-white/5 no-scrollbar">
                        {userTeam.roster.map(id => {
                           const card = ALL_CARDS.find(c => c.id === id);
                           const isSelected = userOfferedIds.includes(id);
                           return (
                              <div key={id} onClick={() => setUserOfferedIds(prev => isSelected ? prev.filter(x => x !== id) : [...prev, id])} className="p-3 flex items-center justify-between hover:bg-white/5 cursor-pointer">
                                 <div className="flex items-center gap-2">
                                    <input type="checkbox" checked={isSelected} readOnly className="accent-amber-500 w-3 h-3" />
                                    <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card?.nbaId}.png`} className="w-8 h-8 rounded-full bg-zinc-800 object-contain" />
                                    <span className="text-[11px] font-bold uppercase italic text-white truncate max-w-[80px]">{card?.name.split(' ').pop()}</span>
                                 </div>
                                 <span className="text-[10px] font-black text-amber-500 italic">{card?.stats.ovr}</span>
                              </div>
                           );
                        })}
                     </div>
                     <div className="p-3 bg-black/40 border-t border-white/5 max-h-[120px] overflow-y-auto no-scrollbar">
                        <p className="text-[8px] font-black text-zinc-600 uppercase mb-2">Draft Picks</p>
                        <div className="flex flex-wrap gap-1.5">
                           {userTeam.draftPicks.map(pick => {
                              const isSelected = userOfferedPickIds.includes(pick.id);
                              return (
                                 <button 
                                   key={pick.id}
                                   onClick={() => setUserOfferedPickIds(prev => isSelected ? prev.filter(x => x !== pick.id) : [...prev, pick.id])}
                                   className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase transition-all ${isSelected ? 'bg-amber-500 border-amber-500 text-black' : 'bg-zinc-800 border-white/10 text-zinc-500 hover:text-white'}`}
                                 >
                                    {pick.year} R{pick.round}
                                 </button>
                              );
                           })}
                        </div>
                     </div>
                  </div>

                  {/* RIVAL SIDE */}
                  <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[500px]">
                     <div className="p-3 border-b border-white/5 bg-white/2 flex items-center justify-between">
                        <span className="text-[10px] font-black text-white italic">RIVAL ASSETS</span>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase">{cpuRequestedIds.length + cpuRequestedPickIds.length} Selected</span>
                     </div>
                     <div className="flex-1 overflow-y-auto divide-y divide-white/5 no-scrollbar">
                        {tradeTargetTeamId ? state.teams[tradeTargetTeamId].roster.map(id => {
                           const card = ALL_CARDS.find(c => c.id === id);
                           const isSelected = cpuRequestedIds.includes(id);
                           return (
                              <div key={id} onClick={() => setCpuRequestedIds(prev => isSelected ? prev.filter(x => x !== id) : [...prev, id])} className="p-3 flex items-center justify-between hover:bg-white/5 cursor-pointer">
                                 <div className="flex items-center gap-2">
                                    <input type="checkbox" checked={isSelected} readOnly className="accent-amber-500 w-3 h-3" />
                                    <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card?.nbaId}.png`} className="w-8 h-8 rounded-full bg-zinc-800 object-contain" />
                                    <span className="text-[11px] font-bold uppercase italic text-white truncate max-w-[80px]">{card?.name.split(' ').pop()}</span>
                                 </div>
                                 <span className="text-[10px] font-black text-amber-500 italic">{card?.stats.ovr}</span>
                              </div>
                           );
                        }) : (
                           <div className="h-full flex items-center justify-center p-8 text-center bg-black/20">
                              <p className="text-[9px] font-black text-zinc-700 uppercase leading-relaxed italic">Select a team above to view their assets.</p>
                           </div>
                        )}
                     </div>

                     {tradeTargetTeamId && (
                       <div className="p-3 bg-black/40 border-t border-white/5 max-h-[120px] overflow-y-auto no-scrollbar">
                          <p className="text-[8px] font-black text-zinc-600 uppercase mb-2">Draft Picks</p>
                          <div className="flex flex-wrap gap-1.5">
                             {state.teams[tradeTargetTeamId].draftPicks.map(pick => {
                                const isSelected = cpuRequestedPickIds.includes(pick.id);
                                return (
                                   <button 
                                     key={pick.id}
                                     onClick={() => setCpuRequestedPickIds(prev => isSelected ? prev.filter(x => x !== pick.id) : [...prev, pick.id])}
                                     className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase transition-all ${isSelected ? 'bg-amber-500 border-amber-500 text-black' : 'bg-zinc-800 border-white/10 text-zinc-500 hover:text-white'}`}
                                   >
                                      {pick.year} R{pick.round}
                                   </button>
                                );
                             })}
                          </div>
                       </div>
                     )}
                  </div>
               </div>

               {/* FIXED BOTTOM ACTION BAR */}
               <div className="fixed bottom-0 left-0 right-0 h-24 bg-black/80 backdrop-blur-xl border-t border-white/10 z-[5000] flex items-center justify-center px-6">
                  <div className="max-w-4xl w-full flex items-center justify-between gap-6">
                     <div className="flex gap-4">
                        <div className="space-y-1">
                           <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em]">Giving</p>
                           <p className="text-sm font-black italic text-white">{userOfferedIds.length} Plyr, {userOfferedPickIds.length} Pks</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="space-y-1">
                           <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em]">Receiving</p>
                           <p className="text-sm font-black italic text-white">{cpuRequestedIds.length} Plyr, {cpuRequestedPickIds.length} Pks</p>
                        </div>
                     </div>
                     
                     <button 
                       onClick={handleExecuteTrade}
                       disabled={userOfferedIds.length === 0 || cpuRequestedIds.length === 0}
                       className="px-12 py-4 bg-white text-black rounded-2xl font-black uppercase italic tracking-tighter disabled:opacity-20 hover:bg-amber-500 transition-all active:scale-95"
                     >
                        Propose Trade
                     </button>
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'office' && (
            <motion.div 
              key="office"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-8 pb-20 px-4 md:px-0"
            >
               {/* TROPHY CASE */}
               <div className="bg-gradient-to-br from-zinc-900 to-black border border-amber-500/10 rounded-[2.5rem] p-8 md:p-12 space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="flex flex-col md:flex-row items-center gap-4 relative z-10 text-center md:text-left">
                     <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-black shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                        <Trophy size={24} />
                     </div>
                     <div className="space-y-1">
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Trophy Case</h3>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Franchise Achievements</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                     {[
                       { label: 'Championships', count: Object.values(state.awards || {}).filter((a: any) => a?.type === 'CHAMP').length, color: 'text-amber-500' },
                       { label: 'NBA MVP', count: Object.values(state.awards || {}).filter((a: any) => a?.type === 'MVP').length, color: 'text-white' },
                       { label: 'DPOY', count: Object.values(state.awards || {}).filter((a: any) => a?.type === 'DPOY').length, color: 'text-white' },
                       { label: 'Best Record', count: Object.values(state.awards || {}).filter((a: any) => a?.type === 'RECORD').length, color: 'text-white' }
                     ].map((t) => (
                       <div key={t.label} className="bg-black/40 border border-white/5 rounded-3xl p-6 text-center space-y-2 group hover:border-amber-500/30 transition-all">
                          <p className={`text-3xl font-black italic transition-all group-hover:scale-110 ${t.color}`}>{t.count}</p>
                          <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest leading-none">{t.label}</p>
                       </div>
                     ))}
                  </div>

                  {Object.keys(state.awards).length === 0 && (
                    <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-8 text-center">
                       <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] leading-relaxed">No trophies yet. Every legacy starts with a single victory. Build your dynasty.</p>
                    </div>
                  )}
               </div>

               {/* FINANCE & ASSETS */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 space-y-6">
                     <div className="space-y-1">
                       <h3 className="text-lg font-black uppercase text-white tracking-widest italic">Salary Cap</h3>
                       <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest tracking-[0.4em]">Season {state.season}</p>
                     </div>
                     <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase font-mono italic">
                           <span className="text-zinc-500">Payroll: ${(userTeam.payroll / 1000000).toFixed(1)}M</span>
                           <span className="text-amber-500">Soft Cap: $136.0M</span>
                        </div>
                        <div className="h-2.5 bg-black rounded-full overflow-hidden border border-white/5 p-0.5">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${Math.min((userTeam.payroll / 136000000) * 100, 100)}%` }}
                             className={`h-full rounded-full ${userTeam.payroll > 136000000 ? 'bg-red-500' : 'bg-amber-500'}`}
                           />
                        </div>
                     </div>
                  </div>

                  <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 space-y-6">
                     <div className="space-y-1">
                       <h3 className="text-lg font-black uppercase text-white tracking-widest italic">Future Picks</h3>
                       <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest tracking-[0.4em]">Draft Control</p>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {userTeam.draftPicks.slice(0, 6).map((p) => (
                           <div key={p.id} className="px-3 py-1.5 bg-black rounded-lg border border-white/5 text-[9px] font-bold text-zinc-400">
                              {p.year} R{p.round} ({p.originalOwnerId})
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               {/* CONTRACTS */}
               <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden divide-y divide-white/5">
                  <div className="p-6 bg-white/2">
                    <h3 className="text-[12px] font-black uppercase italic text-white tracking-widest">Roster Contracts & Negotiations</h3>
                  </div>
                  {userTeam.roster.map(id => {
                     const card = ALL_CARDS.find(c => c.id === id);
                     const contract = userTeam.contracts[id];
                     if (!card || !contract) return null;
                     const isExpiring = contract.yearsRemaining === 1;
                     const neg = state.negotiations?.[id];
                     const demand = marketService.calculateExtensionCost(id);

                     return (
                        <div key={id} className="p-6 space-y-4 hover:bg-white/5 transition-colors group">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                               <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card.nbaId}.png`} className="w-12 h-12 rounded-full bg-black border border-white/5 object-contain" />
                               <div className="flex flex-col">
                                  <span className="text-sm font-black text-white uppercase italic leading-none">{card.name}</span>
                                  <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-1">{card.position} • {contract.type}</span>
                               </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-sm font-black text-white italic leading-none">${(contract.salary/1000000).toFixed(1)}M</p>
                                 <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isExpiring ? 'text-amber-500 underline underline-offset-4 decoration-amber-500/50' : 'text-zinc-700'}`}>{contract.yearsRemaining}Y LEFT</p>
                              </div>
                           </div>

                           {isExpiring && (!neg || neg.status === 'Active') && (
                             <div className="bg-black/60 border border-white/5 rounded-2xl p-4 md:p-6 space-y-5">
                                <div className="flex items-center justify-between">
                                  <div className="space-y-1">
                                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Contract Demand</p>
                                    <p className="text-lg font-black text-white italic">${(demand/1000000).toFixed(1)}M <span className="text-[10px] text-zinc-500 font-bold uppercase not-italic">/ 3 Years</span></p>
                                  </div>
                                  {neg && (
                                    <div className="px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
                                      <p className="text-[10px] font-black text-amber-500 uppercase">Round {neg.rounds}/3</p>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                   <button 
                                     onClick={() => {
                                       const res = marketService.negotiateContract(state, id, demand, 3);
                                       alert(res.message);
                                       setState({...state});
                                     }}
                                     className="py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 transition-all shadow-xl active:scale-95"
                                   >
                                      Accept Demand
                                   </button>
                                   <button 
                                     onClick={() => {
                                       const offer = Math.round(demand * 0.9);
                                       const res = marketService.negotiateContract(state, id, offer, 3);
                                       alert(res.message);
                                       setState({...state});
                                     }}
                                     className="py-4 bg-zinc-900 text-white border border-white/10 rounded-xl font-black uppercase tracking-widest text-[10px] hover:border-white/30 transition-all active:scale-95"
                                   >
                                      Counter (-10%)
                                   </button>
                                </div>
                             </div>
                           )}

                           {neg?.status === 'Accepted' && (
                             <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center gap-3">
                                <Sparkles size={14} className="text-green-500" />
                                <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Extension Signed Successfully</p>
                             </div>
                           )}

                           {neg?.status === 'Rejected' && (
                             <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center gap-3">
                                <AlertTriangle size={14} className="text-red-500" />
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Negotiations Collapsed</p>
                             </div>
                           )}
                        </div>
                     );
                  })}
               </div>
            </motion.div>
          )}


          {activeTab === 'league' && (
             <motion.div 
              key="league"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-12"
            >
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* CONFERENCE STANDINGS */}
                  {['East', 'West'].map(conf => (
                    <div key={conf} className="space-y-4">
                       <h3 className="text-sm font-black uppercase italic text-white flex items-center justify-between">
                         <span>{conf}ern Conference</span>
                         <span className="text-[10px] text-zinc-500">Regular Season</span>
                       </h3>
                        <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
                           <table className="w-full text-left border-collapse">
                              <thead className="bg-white/5 border-b border-white/5 font-mono">
                                 <tr className="text-[10px] font-black text-zinc-500 uppercase">
                                    <th className="px-4 py-2">TEAM</th>
                                    <th className="px-2 py-2 text-center">W</th>
                                    <th className="px-2 py-2 text-center">L</th>
                                    <th className="px-2 py-2 text-center">PCT</th>
                                    <th className="px-3 py-2 text-center">GB</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {(Object.values(state.teams) as TeamObject[])
                                   .filter(t => t.conference === conf)
                                   .sort((a, b) => b.wins - a.wins || a.losses - b.losses)
                                   .map((team, i) => {
                                      const topWins = (Object.values(state.teams) as TeamObject[]).filter(t => t.conference === conf).sort((a,b)=>b.wins-a.wins)[0].wins;
                                      const gb = i === 0 ? '-' : (topWins - team.wins);
                                      return (
                                        <tr key={team.teamId} className={`h-[40px] border-b border-white/5 hover:bg-white/5 transition-colors ${team.isHuman ? 'bg-amber-500/5' : ''}`}>
                                           <td className="px-4 py-1">
                                              <div className="flex items-center gap-3">
                                                 <span className="text-[10px] font-bold text-zinc-600 w-3">{i+1}</span>
                                                 <img src={getTeamLogo(team.teamId)} className="w-5 h-5 object-contain" />
                                                 <span className="text-[12px] font-bold text-white uppercase italic truncate max-w-[80px]">{team.abbreviation}</span>
                                              </div>
                                           </td>
                                           <td className="px-2 py-1 text-center text-[12px] font-black text-white">{team.wins}</td>
                                           <td className="px-2 py-1 text-center text-[12px] font-bold text-zinc-500">{team.losses}</td>
                                           <td className="px-2 py-1 text-center text-[11px] font-mono text-zinc-400">.{(team.wins / Math.max(1, (team.wins+team.losses)) * 1000).toFixed(0).padStart(3, '0')}</td>
                                           <td className="px-3 py-1 text-center text-[11px] font-bold text-zinc-600">{gb}</td>
                                        </tr>
                                      );
                                   })}
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
              className="max-w-4xl mx-auto space-y-6 pb-20"
            >
               <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-white/5 flex items-center justify-between">
                     <h3 className="text-sm font-black uppercase italic text-white">Depth Chart</h3>
                     <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Starting 5 + Bench</span>
                  </div>
                  <div className="divide-y divide-white/5">
                     {(['PG', 'SG', 'SF', 'PF', 'C'] as const).map(pos => {
                        const id = userTeam.lineup[pos];
                        const card = ALL_CARDS.find(c => c.id === id);
                        return (
                           <div key={pos} onClick={() => setLineupModalPos(pos)} className="flex items-center justify-between h-[56px] px-4 hover:bg-white/5 cursor-pointer transition-colors group">
                              <div className="flex items-center gap-4">
                                 <div className="w-8 text-[10px] font-black text-zinc-600 uppercase">{pos}</div>
                                 {card ? (
                                    <div className="flex items-center gap-3">
                                       <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card.nbaId}.png`} className="w-8 h-8 rounded-full bg-zinc-800 object-contain" />
                                       <span className="text-[13px] font-bold text-white uppercase italic">{card.name}</span>
                                    </div>
                                 ) : (
                                    <span className="text-[11px] font-black text-zinc-700 uppercase italic">Empty Slot</span>
                                 )}
                              </div>
                              <div className="flex items-center gap-4">
                                 {card && <span className="text-sm font-black text-amber-500 italic">{card.stats.ovr}</span>}
                                 <Plus className="text-zinc-700 group-hover:text-amber-500" size={16} />
                              </div>
                           </div>
                        );
                     })}
                     {userTeam.lineup.bench.map((id, index) => {
                        const card = ALL_CARDS.find(c => c.id === id);
                        if (!card) return null;
                        return (
                           <div key={id} onClick={() => setLineupModalPos('bench')} className="flex items-center justify-between h-[56px] px-4 hover:bg-white/5 cursor-pointer transition-colors group">
                              <div className="flex items-center gap-4">
                                 <div className="w-8 text-[10px] font-black text-zinc-600 uppercase">BN</div>
                                 <div className="flex items-center gap-3">
                                    <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card.nbaId}.png`} className="w-8 h-8 rounded-full bg-zinc-800 object-contain" />
                                    <span className="text-[13px] font-bold text-white uppercase italic">{card.name}</span>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4">
                                 <span className="text-sm font-black text-amber-500 italic">{card.stats.ovr}</span>
                                 <Plus className="text-zinc-700 group-hover:text-amber-500" size={16} />
                              </div>
                           </div>
                        );
                     })}
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

               <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-white/5">
                     <h3 className="text-sm font-black uppercase italic text-white">Full Roster</h3>
                  </div>
                  <div className="divide-y divide-white/5">
                     {userTeam.roster.map(id => {
                        const card = ALL_CARDS.find(c => c.id === id);
                        if (!card) return null;
                        const isStarter = Object.values(userTeam.lineup).includes(id);
                        return (
                           <div key={id} className="flex items-center justify-between h-[48px] px-4 hover:bg-white/5 transition-colors group">
                              <div className="flex items-center gap-4">
                                 <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card.nbaId}.png`} className="w-8 h-8 rounded-full bg-zinc-800 object-contain" />
                                 <div className="flex flex-col">
                                    <span className="text-[12px] font-bold text-white uppercase italic">{card.name}</span>
                                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{card.position} {isStarter && '• STARTER'}</span>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4">
                                 <span className="text-[12px] font-black text-amber-500 italic">{card.stats.ovr}</span>
                              </div>
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
                     <button 
                       key={cat} 
                       onClick={() => setActiveStatsCat(cat as any)}
                       className={`px-6 py-2 border rounded-xl text-[8px] font-black uppercase tracking-widest transition-colors ${activeStatsCat === cat ? 'bg-white text-black border-white' : 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white'}`}
                     >
                       {cat}
                     </button>
                   ))}
                </div>
              </div>

              <div className="bg-zinc-900 border border-white/5 rounded-3xl md:rounded-[2.5rem] overflow-hidden">
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left min-w-[600px] md:min-w-0">
                  <thead className="bg-white/5 border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
                    <tr className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                      <th className="px-6 md:px-8 py-5 md:py-6">Player</th>
                      <th className="px-4 md:px-8 py-5 md:py-6">Team</th>
                      <th className="px-4 md:px-8 py-5 md:py-6 text-center">GP</th>
                      <th className={`px-4 md:px-8 py-5 md:py-6 text-center ${activeStatsCat === 'Points' ? 'text-amber-500' : ''}`}>PPG</th>
                      <th className={`px-4 md:px-8 py-5 md:py-6 text-center ${activeStatsCat === 'Rebounds' ? 'text-amber-500' : ''}`}>RPG</th>
                      <th className={`px-4 md:px-8 py-5 md:py-6 text-center ${activeStatsCat === 'Assists' ? 'text-amber-500' : ''}`}>APG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.entries(state.stats.seasonal) as [string, any][])
                      .sort(([, a], [, b]) => {
                        const valA = activeStatsCat === 'Points' ? a.points : activeStatsCat === 'Rebounds' ? a.rebounds : a.assists;
                        const valB = activeStatsCat === 'Points' ? b.points : activeStatsCat === 'Rebounds' ? b.rebounds : b.assists;
                        return (valB / (b.gamesPlayed || 1)) - (valA / (a.gamesPlayed || 1));
                      })
                      .slice(0, 20)
                      .map(([playerId, stats]) => {
                        const card = ALL_CARDS.find(c => c.id === playerId);
                        const team = (Object.values(state.teams) as TeamObject[]).find(t => 
                          [t.lineup.PG, t.lineup.SG, t.lineup.SF, t.lineup.PF, t.lineup.C, ...t.lineup.bench].includes(playerId)
                        );
                        if (!card) return null;
                        return (
                          <tr key={playerId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="px-6 md:px-8 py-4">
                               <div className="flex items-center gap-3 md:gap-4">
                                  <div className="w-8 h-8 md:w-10 md:h-10 bg-zinc-800 rounded-xl overflow-hidden p-1 shrink-0">
                                    <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card.nbaId}.png`} className="w-full h-full object-contain" />
                                  </div>
                                  <div className="truncate max-w-[100px] md:max-w-none">
                                    <p className="text-xs font-black text-white italic uppercase truncate">{card.name}</p>
                                    <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{card.position}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-4 md:px-8 py-4">
                              {team ? (
                                <div className="flex items-center gap-2">
                                  <img src={getTeamLogo(team.teamId)} className="w-5 h-5 object-contain" />
                                  <span className="text-[10px] font-bold text-zinc-400 uppercase">{team.abbreviation}</span>
                                </div>
                              ) : <span className="text-[10px] font-bold text-zinc-600">FA</span>}
                            </td>
                            <td className="px-4 md:px-8 py-4 text-center text-xs font-black text-zinc-400">{stats.gamesPlayed}</td>
                            <td className={`px-4 md:px-8 py-4 text-center text-sm font-black italic ${activeStatsCat === 'Points' ? 'text-white' : 'text-zinc-400'}`}>{(stats.points / (stats.gamesPlayed || 1)).toFixed(1)}</td>
                            <td className={`px-4 md:px-8 py-4 text-center text-sm font-black italic ${activeStatsCat === 'Rebounds' ? 'text-white' : 'text-zinc-400'}`}>{(stats.rebounds / (stats.gamesPlayed || 1)).toFixed(1)}</td>
                            <td className={`px-4 md:px-8 py-4 text-center text-sm font-black italic ${activeStatsCat === 'Assists' ? 'text-white' : 'text-zinc-400'}`}>{(stats.assists / (stats.gamesPlayed || 1)).toFixed(1)}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'draft' && (
            <motion.div 
              key="draft"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto space-y-12 pb-20"
            >
               <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">NBA Draft {state.season}</h2>
                    <p className="text-zinc-500 text-sm font-medium">Select the next generation of superstars.</p>
                  </div>
                  <div className="bg-zinc-900 border border-white/5 px-6 py-4 rounded-3xl text-right">
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Phase</p>
                    <p className="text-sm font-black text-white italic">OFFSEASON</p>
                  </div>
               </div>

               <div className="bg-zinc-900 border border-white/5 rounded-[3rem] p-8 md:p-12 text-center space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-500/10 blur-[80px] rounded-full" />
                  <div className="relative z-10 space-y-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-amber-500 rounded-3xl flex items-center justify-center text-black mx-auto shadow-[0_0_40px_rgba(245,158,11,0.3)]">
                       <Sparkles size={40} />
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-white">Draft picks Available</h3>
                      <p className="text-zinc-500 text-[10px] md:text-sm max-w-md mx-auto leading-relaxed font-medium">
                        The draft pool has been generated. You have your first pick!
                        Selecting a player will add them to your roster for the upcoming season.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-8">
                       {ALL_CARDS.slice(Math.floor(Math.random() * 50), 53).slice(0, 3).map((card) => (
                         <div key={card.id} className="bg-black/40 border border-white/5 rounded-3xl p-6 space-y-6 group hover:border-amber-500/50 transition-all flex flex-col items-center">
                            <div className="w-full aspect-[2/3] relative">
                               <CardItem card={card} isOwned={false} mode="standard" />
                            </div>
                            <button 
                              onClick={() => {
                                 const res = marketService.draftPlayer(state, card.id);
                                 if (res.success) {
                                    // Move to next season / regular phase
                                    // Generate new schedule for new season
                                    const newState = { ...state, phase: 'Regular' as const, week: 1 };
                                    // In a full implementation we'd call scheduleService.generateSchedule(newState) here
                                    setState(newState);
                                    stateService.save(newState);
                                    setActiveTab('hub');
                                 } else {
                                    alert(res.reason);
                                 }
                              }}
                              className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] group-hover:bg-amber-500 transition-all shadow-xl active:scale-95"
                            >
                               Draft Player
                            </button>
                         </div>
                       ))}
                    </div>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MATCH RESULT MODAL */}
        <AnimatePresence>
          {lastGameResult && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-6"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
              
              <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                className="w-full max-w-4xl bg-zinc-950 border border-white/10 rounded-[2rem] md:rounded-[3rem] overflow-hidden relative flex flex-col max-h-[90dvh] shadow-2xl"
              >
                {/* Header */}
                <div className="p-4 md:p-10 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/40">
                  <div className="space-y-1">
                    <p className="text-[8px] md:text-[10px] font-black text-amber-500 uppercase tracking-[0.6em]">Match Finalized</p>
                    <h2 className="text-2xl md:text-5xl font-black italic uppercase tracking-tighter text-white">Full Box Score</h2>
                  </div>
                  <button 
                    onClick={() => setLastGameResult(null)}
                    className="p-2 md:p-3 bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors"
                  >
                    <CloseIcon size={24} />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-10 space-y-8 md:space-y-12">
                  
                  {/* Score Board */}
                  <div className="bg-zinc-900/50 p-6 md:p-10 rounded-[2rem] border border-white/5 relative group">
                    <div className="flex items-center justify-between gap-4 md:gap-8 relative z-10">
                      {/* Away Team (Visitor) */}
                      <div className="flex-1 flex flex-col items-center gap-2 md:gap-4 order-1">
                        <div className="w-12 h-12 md:w-24 md:h-24 bg-black rounded-2xl md:rounded-3xl p-2 md:p-4 border border-white/5 shadow-2xl">
                          <img src={getTeamLogo(lastGameResult.match.awayTeamId)} className="w-full h-full object-contain" />
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] md:text-sm font-black text-zinc-500 uppercase tracking-widest">{state.teams[lastGameResult.match.awayTeamId].abbreviation}</p>
                          <p className="hidden md:block text-xl font-black uppercase italic tracking-tighter text-white truncate px-2">{state.teams[lastGameResult.match.awayTeamId].name}</p>
                        </div>
                      </div>

                      {/* Score Center */}
                      <div className="flex items-center gap-2 md:gap-8 order-2 shrink-0">
                        <p className={`text-3xl md:text-7xl font-black italic ${lastGameResult.result.score.away > lastGameResult.result.score.home ? 'text-white' : 'text-zinc-600'}`}>
                          {lastGameResult.result.score.away}
                        </p>
                        <div className="text-xs md:text-2xl font-black italic text-zinc-800 rotate-0 md:rotate-12 shrink-0">VS</div>
                        <p className={`text-3xl md:text-7xl font-black italic ${lastGameResult.result.score.home > lastGameResult.result.score.away ? 'text-white' : 'text-zinc-600'}`}>
                          {lastGameResult.result.score.home}
                        </p>
                      </div>

                      {/* Home Team (Local) */}
                      <div className="flex-1 flex flex-col items-center gap-2 md:gap-4 order-3">
                        <div className="w-12 h-12 md:w-24 md:h-24 bg-black rounded-2xl md:rounded-3xl p-2 md:p-4 border border-white/5 shadow-2xl">
                          <img src={getTeamLogo(lastGameResult.match.homeTeamId)} className="w-full h-full object-contain" />
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] md:text-sm font-black text-zinc-500 uppercase tracking-widest">{state.teams[lastGameResult.match.homeTeamId].abbreviation}</p>
                          <p className="hidden md:block text-xl font-black uppercase italic tracking-tighter text-white truncate px-2">{state.teams[lastGameResult.match.homeTeamId].name}</p>
                        </div>
                      </div>
                    </div>

                    {/* Compact Quarters for Mobile */}
                    {lastGameResult.result.periods && (
                      <div className="mt-6 md:hidden flex justify-center gap-2 overflow-x-auto no-scrollbar">
                        {lastGameResult.result.periods.home.map((_, i) => (
                          <div key={`period-compact-${i}`} className="flex flex-col items-center bg-black/40 border border-white/5 rounded-lg p-2 min-w-[50px]">
                            <p className="text-[8px] font-black text-zinc-600 uppercase">Q{i+1}</p>
                            <div className="flex gap-2 text-[10px] font-bold text-white italic">
                              <span>{lastGameResult.result.periods.away[i]}</span>
                              <span className="text-zinc-700">-</span>
                              <span>{lastGameResult.result.periods.home[i]}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Period Scores */}
                  {lastGameResult.result.periods && (
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">Quarter Breakdown</h4>
                      <div className="bg-white/5 rounded-2xl md:rounded-3xl border border-white/5 overflow-x-auto">
                        <table className="w-full text-center text-xs font-black uppercase italic min-w-[300px]">
                          <thead>
                            <tr className="border-b border-white/5 text-zinc-500">
                              <th className="py-4 px-4 text-left">Team</th>
                              {lastGameResult.result.periods.home.map((_, i) => (
                                <th key={`period-th-${i}`} className="py-4 px-2">Q{i + 1}</th>
                              ))}
                              <th className="py-4 px-4 text-white">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-white/5">
                              <td className="py-4 px-4 text-left text-zinc-400">{state.teams[lastGameResult.match.homeTeamId].abbreviation}</td>
                              {lastGameResult.result.periods.home.map((val: number, i: number) => (
                                <td key={`period-home-val-${i}`} className="py-4 px-2 text-zinc-500">{val}</td>
                              ))}
                              <td className="py-4 px-4 text-xl">{lastGameResult.result.score.home}</td>
                            </tr>
                            <tr>
                              <td className="py-4 px-4 text-left text-zinc-400">{state.teams[lastGameResult.match.awayTeamId].abbreviation}</td>
                              {lastGameResult.result.periods.away.map((val: number, i: number) => (
                                <td key={`period-away-val-${i}`} className="py-4 px-2 text-zinc-500">{val}</td>
                              ))}
                              <td className="py-4 px-4 text-xl">{lastGameResult.result.score.away}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Complete Box Scores */}
                  {['home', 'away'].map((side) => (
                    <div key={side} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <img src={getTeamLogo(lastGameResult.match[side === 'home' ? 'homeTeamId' : 'awayTeamId'])} className="w-6 h-6 object-contain" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">
                          {state.teams[lastGameResult.match[side === 'home' ? 'homeTeamId' : 'awayTeamId']].name} Box Score
                        </h4>
                      </div>
                      <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-x-auto no-scrollbar">
                        <table className="w-full text-left min-w-[350px] border-collapse">
                          <thead className="bg-white/5 border-b border-white/5">
                            <tr className="text-[10px] font-black text-zinc-500 uppercase">
                              <th className="px-3 py-2">PLAYER</th>
                              <th className="px-2 py-2 text-center">MIN</th>
                              <th className="px-2 py-2 text-center text-white">PTS</th>
                              <th className="px-2 py-2 text-center">REB</th>
                              <th className="px-2 py-2 text-center">AST</th>
                              <th className="px-2 py-2 text-center">STL</th>
                              <th className="px-2 py-2 text-center">BLK</th>
                              <th className="px-2 py-2 text-center">FG%</th>
                              <th className="px-2 py-2 text-center">+/-</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(lastGameResult.result.boxScore[side as keyof typeof lastGameResult.result.boxScore] as any[]).map((p) => {
                               const card = ALL_CARDS.find(c => c.id === p.playerId);
                               // FG% mock or calculated if fields available (assuming pts/shots relationship or simple mock)
                               const fgp = card ? (40 + (card.stats.ovr / 5) + (Math.random() * 5)).toFixed(1) : "45.0";
                               return (
                                <tr key={p.playerId} className="border-b border-white/5 hover:bg-white/5 h-[36px]">
                                  <td className="px-3 py-1 font-bold text-[12px] truncate max-w-[120px]">{p.name.split(' ').pop()}</td>
                                  <td className="px-2 py-1 text-center text-[11px] text-zinc-500">{(p.minutes || 0).toFixed(0)}</td>
                                  <td className="px-2 py-1 text-center text-[12px] font-black text-white">{p.points}</td>
                                  <td className="px-2 py-1 text-center text-[11px] text-zinc-400">{p.rebounds}</td>
                                  <td className="px-2 py-1 text-center text-[11px] text-zinc-400">{p.assists}</td>
                                  <td className="px-2 py-1 text-center text-[11px] text-zinc-400">{p.steals || 0}</td>
                                  <td className="px-2 py-1 text-center text-[11px] text-zinc-400">{p.blocks || 0}</td>
                                  <td className="px-2 py-1 text-center text-[11px] text-zinc-600 font-mono">{fgp}%</td>
                                  <td className={`px-2 py-1 text-center text-[11px] font-bold ${p.plusMinus > 0 ? 'text-green-500' : p.plusMinus < 0 ? 'text-red-500' : 'text-zinc-600'}`}>{p.plusMinus > 0 ? `+${p.plusMinus}` : p.plusMinus}</td>
                                </tr>
                               );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 md:p-10 border-t border-white/5 bg-black/40 shrink-0">
                  <button 
                    onClick={() => setLastGameResult(null)}
                    className="w-full py-6 bg-white text-black rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-amber-400 transition-all shadow-2xl active:scale-95"
                  >
                    Close & Return to Hub
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
