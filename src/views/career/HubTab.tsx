import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  ChevronRight, 
  Sparkles, 
  Trophy, 
  Flame, 
  Activity, 
  Shield, 
  TrendingUp, 
  AlertCircle, 
  Newspaper,
  Calendar,
  Award,
  Zap
} from 'lucide-react';
import { getTeamLogo } from '../../data/nbaTeams';
import { ALL_CARDS } from '../../data/cards';
import { NBA_TEAMS } from '../../data/nbaTeams';

interface HubTabProps {
  state: any;
  nextUserGame: any;
  userTeam: any;
  simulateGame: () => void;
  leagueLeaders: any[];
  setActiveTab: (tab: any) => void;
  setState: (state: any) => void;
  renderPlayoffs: () => React.ReactNode;
  triggerLottery: () => void;
}

const HubTab: React.FC<HubTabProps> = React.memo(({ 
  state, 
  nextUserGame, 
  userTeam,
  simulateGame, 
  leagueLeaders, 
  setActiveTab,
  setState,
  renderPlayoffs,
  triggerLottery
}) => {
  const [isSimulating, setIsSimulating] = useState(false);

  // 1. Core Card Lookup Helper
  const getCardOvr = (id: string) => {
    if (!id) return 0;
    const baseCard = ALL_CARDS.find(c => c.id === id) || 
                     state?.customCards?.find((c: any) => c.id === id) || 
                     state?.draftPool?.find((c: any) => c.id === id);
    if (!baseCard) return 0;
    const progress = state?.playerProgress?.[id];
    return progress?.ovr || baseCard.stats.ovr || 0;
  };

  // Starters and Bench OVR computations
  const startersOvr = useMemo(() => {
    const positions = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
    const values = positions.map(pos => getCardOvr(userTeam?.lineup?.[pos])).filter(Boolean);
    if (values.length === 0) return 0;
    return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
  }, [userTeam?.lineup, state?.playerProgress]);

  const benchOvr = useMemo(() => {
    const list = (userTeam?.lineup?.bench || []) as string[];
    const values = list.map(id => getCardOvr(id)).filter(Boolean);
    if (values.length === 0) return 0;
    return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
  }, [userTeam?.lineup?.bench, state?.playerProgress]);

  // Overall Team Rating (Weighting Starters heavily)
  const calculatedTeamOvr = useMemo(() => {
    if (!startersOvr) return 0;
    if (!benchOvr) return startersOvr;
    return Math.round(startersOvr * 0.7 + benchOvr * 0.3);
  }, [startersOvr, benchOvr]);

  // Standing calculation
  const standingsPos = useMemo(() => {
    if (!state?.teams || !userTeam) return 1;
    const listInConf = Object.values(state.teams).filter((t: any) => t.conference === userTeam.conference);
    const sorted = [...listInConf].sort((a: any, b: any) => b.wins - a.wins);
    const index = sorted.findIndex((t: any) => t.id === userTeam.id);
    return index !== -1 ? index + 1 : 1;
  }, [state?.teams, userTeam]);

  // Season Progression
  const gamesPlayed = useMemo(() => {
    if (!state?.schedule) return 0;
    return state.schedule.filter((m: any) => 
      (m.homeTeamId === state.userTeamId || m.awayTeamId === state.userTeamId) && m.played
    ).length;
  }, [state?.schedule, state?.userTeamId]);

  const progressPct = useMemo(() => {
    return Math.min(100, (gamesPlayed / 82) * 100);
  }, [gamesPlayed]);

  // Simulate Trigger Handler with visual loader
  const handleSimulateWithSpinner = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setTimeout(() => {
      simulateGame();
      setIsSimulating(false);
    }, 600);
  };

  // Predict matchday metrics helper
  const nextMatchupDetails = useMemo(() => {
    if (!nextUserGame) return null;
    const opponentId = nextUserGame.homeTeamId === state.userTeamId ? nextUserGame.awayTeamId : nextUserGame.homeTeamId;
    const opponent = state.teams[opponentId];
    if (!opponent) return null;

    // Calculate Opponent stats
    const positions = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
    const oppStarters = positions.map(pos => getCardOvr(opponent.lineup?.[pos])).filter(Boolean);
    const oppStartersOvr = oppStarters.length > 0 
      ? Math.round(oppStarters.reduce((a, b) => a + b, 0) / oppStarters.length)
      : 75;

    return {
      opponent,
      opponentOvr: oppStartersOvr,
      userOff: Math.min(99, Math.round(startersOvr + 2)),
      userDef: Math.min(99, Math.round(startersOvr - 1)),
      oppOff: Math.min(99, Math.round(oppStartersOvr + 3)),
      oppDef: Math.min(99, Math.round(oppStartersOvr - 2)),
    };
  }, [nextUserGame, state?.teams, startersOvr]);

  return (
    <motion.div 
      key="hub"
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      transition={{ type: "spring", stiffness: 260, damping: 25 }}
      className="max-w-7xl mx-auto space-y-6 md:space-y-12 pb-24 px-4 overflow-x-hidden"
    >
      {state.phase === 'playoffs' ? (
        renderPlayoffs?.()
      ) : (
        <>
          {/* OFfSEASON LOTTERY ANNOUNCEMENT */}
          {state.phase === 'offseason_start' && (
            <div className="bg-gradient-to-br from-indigo-500/20 to-zinc-950 border border-indigo-500/30 rounded-3xl p-8 text-center space-y-6 shadow-[0_25px_60px_rgba(99,102,241,0.15)] relative overflow-hidden backdrop-blur-xl">
               <div className="absolute -top-12 -left-12 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl" />
               <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-indigo-400 mx-auto animate-bounce">
                  <Trophy size={32} />
               </div>
               <div className="space-y-2">
                  <h3 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-white">Offseason Begun</h3>
                  <p className="text-zinc-500 text-xs md:text-sm font-medium max-w-md mx-auto">The rosters have been reset. It's time to determine the order of selection for the upcoming Draft.</p>
               </div>
               <button 
                 onClick={triggerLottery}
                 className="px-8 py-4 bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_rgba(99,102,241,0.3)] duration-200"
               >
                 Execute Draft Lottery
               </button>
            </div>
          )}

          {state.phase === 'draft' && (
            <div className="bg-gradient-to-br from-amber-500/20 to-zinc-950 border border-amber-500/30 rounded-3xl p-8 text-center space-y-6 shadow-[0_25px_60px_rgba(245,158,11,0.15)] backdrop-blur-xl">
               <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-500 mx-auto animate-pulse">
                  <Sparkles size={32} />
               </div>
               <div className="space-y-2">
                  <h3 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-white">Draft is Active!</h3>
                  <p className="text-zinc-400 text-xs md:text-sm font-medium max-w-md mx-auto">The league selection process has begun. Proceed to the Draft Room to select your next superstars.</p>
               </div>
               <button 
                 onClick={() => setActiveTab('draft')}
                 className="px-8 py-4 bg-amber-500 text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_rgba(245,158,11,0.3)] duration-200"
               >
                 Enter Draft Room
               </button>
            </div>
          )}

          {/* 1. FRANCHISE OVERVIEW CARD - Glassmorphism, resplendent glow and exact ratings */}
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12 group">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-white/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 w-full lg:w-auto relative z-10 text-center md:text-left">
              <div className="relative group/logo">
                <div className="absolute inset-0 bg-amber-500/20 rounded-[2.5rem] blur-2xl group-hover/logo:blur-3xl transition-all duration-300" />
                <div className="w-24 h-24 md:w-36 md:h-36 bg-zinc-950/80 border border-white/20 rounded-[2.5rem] p-4 flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.6)] animate-pulse transition-transform duration-500 hover:rotate-3">
                  <img src={getTeamLogo(state.userTeamId)} className="w-[85%] h-[85%] object-contain" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <span className="text-[10px] font-black tracking-widest bg-amber-500 text-black px-2.5 py-0.5 rounded-sm uppercase italic">
                      SYSTEM GM HUB
                    </span>
                    <span className="text-[10px] h-5 font-bold tracking-wider bg-white/10 text-zinc-300 px-2.5 py-0.5 rounded-full uppercase">
                      Season {state.season}
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase text-white leading-tight">
                    {userTeam?.name}
                  </h2>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-lg">
                  <div className="bg-black/40 border border-white/5 p-3 rounded-2xl">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Record</p>
                    <p className="text-lg font-black italic text-zinc-100">{userTeam?.wins} - {userTeam?.losses}</p>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-3 rounded-2xl">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Conf Rank</p>
                    <p className="text-lg font-black italic text-amber-500">#{standingsPos} in {userTeam?.conference}</p>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-3 rounded-2xl">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Starters OVR</p>
                    <p className="text-lg font-black italic text-white">{startersOvr}</p>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-3 rounded-2xl">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Rotation OVR</p>
                    <p className="text-lg font-black italic text-emerald-400">{calculatedTeamOvr}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Regular Season Progress bar */}
            <div className="w-full lg:w-80 space-y-3 bg-black/40 border border-white/5 p-5 md:p-6 rounded-[2rem] relative z-10 shrink-0">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Season Progression</p>
                  <p className="text-base font-black italic text-white uppercase tracking-tight">{gamesPlayed} / 82 Games</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Streak</p>
                  <p className={`text-base font-black italic font-mono uppercase ${userTeam?.streak?.startsWith?.('W') ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {userTeam?.streak || 'W1'}
                  </p>
                </div>
              </div>
              <div className="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                />
              </div>
              <div className="flex justify-between text-[8px] font-bold tracking-widest text-zinc-600 uppercase">
                <span>Kick Off</span>
                <span>Playoffs Bound</span>
              </div>
            </div>
          </div>

          {/* 2. MATCHDAY CARD - Off vs Def metrics indicators and simulate loader */}
          {nextUserGame && nextMatchupDetails && (
            <div className="bg-gradient-to-br from-zinc-950 via-zinc-900/90 to-black border border-white/10 rounded-3xl md:rounded-[3.5rem] p-6 md:p-10 flex flex-col items-center justify-between gap-8 md:gap-12 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              
              <div className="space-y-3 relative z-10 text-center w-full">
                <p className="text-[10px] md:text-sm font-black text-amber-500 uppercase tracking-[0.4em]">GAMECENTER LIVE</p>
                <h3 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-none">Matchday {nextUserGame.gameNumber}</h3>
                <div className="flex items-center justify-center gap-2">
                  <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-zinc-400">
                      Regular Season Game
                  </div>
                  <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[9px] font-black uppercase tracking-widest text-amber-400">
                    {nextUserGame.homeTeamId === state.userTeamId ? 'Home Court Advantage' : 'On the Road'}
                  </div>
                </div>
              </div>

              {/* VS Display and HSL comparisons */}
              <div className="grid grid-cols-1 lg:grid-cols-3 items-center gap-8 relative z-10 w-full">
                {/* User Team Card */}
                <div className="flex flex-col items-center lg:items-end gap-3 text-center lg:text-right">
                  <div className="flex items-center gap-4">
                    <div className="hidden lg:block">
                      <p className="text-[10px] font-black text-zinc-500">USER TEAM</p>
                      <p className="text-xl font-black text-white italic truncate max-w-[120px]">{userTeam?.name}</p>
                    </div>
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="w-20 h-20 bg-zinc-950 rounded-2xl border border-white/10 p-3 shadow-2xl flex items-center justify-center"
                    >
                      <img src={getTeamLogo(state.userTeamId)} className="w-[85%] h-[85%] object-contain" />
                    </motion.div>
                  </div>

                  {/* Rating comparison sliders */}
                  <div className="w-full max-w-xs space-y-2 mt-2">
                    <div className="space-y-1 text-left lg:text-right">
                      <div className="flex justify-between text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider">
                        <span>Offensive Rated</span>
                        <span className="text-amber-500 italic">{nextMatchupDetails.userOff} OVR</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden flex justify-end">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${nextMatchupDetails.userOff}%` }} />
                      </div>
                    </div>
                    <div className="space-y-1 text-left lg:text-right">
                      <div className="flex justify-between text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider">
                        <span>Defensive Stance</span>
                        <span className="text-indigo-400 italic">{nextMatchupDetails.userDef} OVR</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden flex justify-end">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${nextMatchupDetails.userDef}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated center separation or VS */}
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="text-3xl md:text-5xl font-black italic text-zinc-800 uppercase tracking-widest select-none">VS</div>
                  <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  
                  {/* Simulate button with micro interactions */}
                  <button 
                    onClick={handleSimulateWithSpinner}
                    disabled={isSimulating}
                    className="mt-2 text-center h-14 px-10 bg-white hover:bg-amber-500 border border-white/10 text-black rounded-full font-black uppercase italic tracking-tighter text-sm flex items-center gap-3 transition-all active:scale-95 shadow-2 shadow-white/5 overflow-hidden disabled:opacity-75 disabled:cursor-not-allowed group/btn"
                  >
                    {isSimulating ? (
                      <>
                        <Activity size={16} className="text-black animate-spin" />
                        <span>Simulating Match...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={16} className="text-black group-hover/btn:animate-bounce" />
                        <span>Simulate Match</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Opponent Team Card */}
                <div className="flex flex-col items-center lg:items-start gap-3 text-center lg:text-left">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="w-20 h-20 bg-zinc-950 rounded-2xl border border-white/10 p-3 shadow-2xl flex items-center justify-center"
                    >
                      <img src={getTeamLogo(nextMatchupDetails.opponent.id)} className="w-[85%] h-[85%] object-contain" />
                    </motion.div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-500">OPPONENT</p>
                      <p className="text-xl font-black text-white italic truncate max-w-[120px]">{nextMatchupDetails.opponent.name}</p>
                    </div>
                  </div>

                  {/* Opponent metrics */}
                  <div className="w-full max-w-xs space-y-2 mt-2">
                    <div className="space-y-1 text-left">
                      <div className="flex justify-between text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider">
                        <span>Offensive Rated</span>
                        <span className="text-amber-500 italic">{nextMatchupDetails.oppOff} OVR</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full animate-pulse" style={{ width: `${nextMatchupDetails.oppOff}%` }} />
                      </div>
                    </div>
                    <div className="space-y-1 text-left">
                      <div className="flex justify-between text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider">
                        <span>Defensive Stance</span>
                        <span className="text-indigo-400 italic">{nextMatchupDetails.oppDef} OVR</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full animate-pulse" style={{ width: `${nextMatchupDetails.oppDef}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* NEXT 5 MATCHES GRID LIST */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6 shrink-0 min-w-0">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm md:text-xl font-black uppercase italic tracking-tighter text-zinc-400 flex items-center gap-2">
                    <Calendar size={18} className="text-amber-500" /> Upcoming Matchups
                </h3>
              </div>
              <div className="space-y-3">
                {(state.schedule || [])
                  .filter((m: any) => (m.homeTeamId === state.userTeamId || m.awayTeamId === state.userTeamId) && !m.played)
                  .slice(0, 5)
                  .map((match: any) => {
                    const isHome = match.homeTeamId === state.userTeamId;
                    const opponentId = isHome ? match.awayTeamId : match.homeTeamId;
                    const opponent = NBA_TEAMS.find(t => t.id === opponentId);
                    
                    return (
                      <div key={match.id} className="bg-zinc-900/30 border border-white/5 rounded-2xl md:rounded-[2rem] p-4 md:p-6 flex items-center justify-between group hover:bg-white/[0.04] hover:border-white/15 transition-all duration-300">
                        <div className="flex items-center gap-4 md:gap-8">
                          <div className="text-center w-10 md:w-16">
                            <p className="text-[8px] md:text-[10px] font-black text-zinc-650 uppercase tracking-widest leading-none mb-1">WK</p>
                            <p className="text-lg md:text-3xl font-black text-white italic leading-none">{match.gameNumber}</p>
                          </div>
                          <div className="w-px h-8 md:h-12 bg-white/10" />
                          <div className="flex items-center gap-4 md:gap-6">
                            <div className="w-10 h-10 md:w-16 md:h-16 bg-zinc-950 rounded-xl md:rounded-[1.5rem] p-2 border border-white/5 shadow-xl flex items-center justify-center">
                                <img src={getTeamLogo(opponentId)} className="w-full h-full object-contain" />
                            </div>
                            <div className="space-y-1">
                              <p className="text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{isHome ? 'HOSTING AT HOME' : 'VISITING ON ROAD'}</p>
                              <p className="text-sm md:text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{opponent?.name || opponentId}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="hidden md:flex flex-col items-end">
                              <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">Status</p>
                              <p className="text-xs font-black text-zinc-400 uppercase italic">Scheduled</p>
                          </div>
                          <div className="w-8 h-8 md:w-12 md:h-12 rounded-full border border-white/5 flex items-center justify-center text-zinc-600 group-hover:text-amber-500 group-hover:border-amber-500/30 transition-all">
                            <ChevronRight size={14} className="md:w-6 md:h-6" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 3. ESPN-STYLE TICKER Y TABLÓN DE NOTICIAS CON ALERTAS SEMÁNTICAS */}
            <div className="space-y-6">
                {/* ESPN style Ticker */}
                <div className="bg-zinc-950 rounded-[2rem] p-5 md:p-6 border border-white/10 space-y-4 shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-red-650 rounded-full animate-ping" />
                        <h3 className="text-xs md:text-sm font-black uppercase tracking-wider text-red-550 italic font-mono flex items-center gap-1.5">
                          <Newspaper size={16} /> ESPN Live Ticker
                        </h3>
                      </div>
                      <button 
                        onClick={() => { state.notifications = []; setState({...state}); }} 
                        className="text-[8px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest transition-colors"
                      >
                        Clear News
                      </button>
                    </div>

                    <div className="space-y-3 max-h-[280px] md:max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
                      {(!state.notifications || state.notifications.length === 0) ? (
                        <div className="py-12 text-center space-y-2">
                          <Activity size={24} className="text-zinc-700 mx-auto" />
                          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Quiet in the League</p>
                        </div>
                      ) : (
                        state.notifications.slice(0, 10).map((n: any) => {
                          const messageLower = (n.message || '').toLowerCase();
                          
                          // Semantic classification of notice
                          let alertStyle = 'border-l-blue-500 bg-blue-950/20 text-blue-400';
                          let alertIcon = <TrendingUp size={12} className="text-blue-400" />;
                          
                          if (messageLower.includes('injur') || messageLower.includes('out for') || messageLower.includes('injured')) {
                            alertStyle = 'border-l-rose-500 bg-rose-950/20 text-rose-400';
                            alertIcon = <AlertCircle size={12} className="text-rose-400" />;
                          } else if (messageLower.includes('win') || messageLower.includes('won') || messageLower.includes('award') || messageLower.includes('mvp') || messageLower.includes('streak')) {
                            alertStyle = 'border-l-emerald-500 bg-emerald-950/20 text-emerald-400';
                            alertIcon = <Flame size={12} className="text-emerald-400" />;
                          }

                          return (
                            <div 
                              key={n.id} 
                              className={`p-3.5 rounded-xl border border-white/5 border-l-4 ${alertStyle} space-y-1 relative group hover:bg-white/[0.02] transition-colors`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {alertIcon}
                                  <span className="text-[8px] font-black uppercase tracking-tighter">{n.type}</span>
                                </div>
                                <span className="text-[8px] font-black text-zinc-500">Week {n.week}</span>
                              </div>
                              <p className="text-[10px] font-medium text-zinc-200 leading-snug">{n.message}</p>
                            </div>
                          );
                        })
                      )}
                    </div>
                </div>

                {/* SEASON LEADERS PANEL */}
                <div className="bg-zinc-900/40 rounded-[2rem] p-6 border border-white/5 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 italic text-center">LEAGUE STAT LEADERS</h3>
                    <div className="space-y-3">
                        {(leagueLeaders || []).map((leader: any) => (
                          <div key={leader.cat} className="flex items-center justify-between bg-black/40 p-3.5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                              <div>
                                <p className="text-[7px] md:text-[8px] font-black text-zinc-500 uppercase tracking-widest">{leader.cat}</p>
                                <p className="text-xs font-extrabold text-white italic uppercase truncate max-w-[120px]">{leader.card?.name || 'N/A'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-black text-amber-500 italic font-mono tabular-nums">{leader.value.toFixed(1)}</p>
                              </div>
                          </div>
                        ))}
                    </div>
                    <button 
                      onClick={() => setActiveTab('stats')} 
                      className="w-full py-2.5 bg-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white hover:bg-white/10 transition-all uppercase"
                    >
                      Browse All Statistics
                    </button>
                </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
});

export default HubTab;
