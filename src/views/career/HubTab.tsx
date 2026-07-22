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
  simulateMultiple?: (count: number, onProgress?: (completedCount: number) => void) => Promise<void>;
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
  simulateMultiple,
  leagueLeaders, 
  setActiveTab,
  setState,
  renderPlayoffs,
  triggerLottery
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);

  const handleSimulateBatch = async (count: number) => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimProgress(0);
    
    if (simulateMultiple) {
      await simulateMultiple(count, (completed) => {
        setSimProgress(Math.round((completed / count) * 100));
      });
    }
    
    setIsSimulating(false);
    setSimProgress(0);
  };

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
      className="w-full space-y-4 md:space-y-12 pb-24 px-4 md:px-8 overflow-x-hidden"
    >
      {state.phase === 'playoffs' ? (
        renderPlayoffs?.()
      ) : (
        <>
          {/* OFfSEASON LOTTERY ANNOUNCEMENT */}
          {state.phase === 'offseason_start' && (
            <div className="bg-gradient-to-br from-indigo-500/20 to-zinc-950 border border-indigo-500/30 rounded-3xl p-6 md:p-8 text-center space-y-6 shadow-[0_25px_60px_rgba(99,102,241,0.15)] relative overflow-hidden backdrop-blur-xl">
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
            <div className="bg-gradient-to-br from-amber-500/20 to-zinc-950 border border-amber-500/30 rounded-3xl p-6 md:p-8 text-center space-y-6 shadow-[0_25px_60px_rgba(245,158,11,0.15)] backdrop-blur-xl">
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
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-4 sm:p-6 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-12 group">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-white/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 w-full lg:w-auto relative z-10 text-center md:text-left">
              <div className="relative group/logo">
                <div className="absolute inset-0 bg-amber-500/20 rounded-[2.5rem] blur-2xl group-hover/logo:blur-3xl transition-all duration-300" />
                <div className="w-20 h-20 md:w-36 md:h-36 bg-zinc-950/80 border border-white/20 rounded-[2rem] md:rounded-[2.5rem] p-3 md:p-4 flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.6)] animate-pulse transition-transform duration-500 hover:rotate-3">
                  <img src={getTeamLogo(state.userTeamId)} className="w-[85%] h-[85%] object-contain" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3">
                    <span className="text-[9px] md:text-[10px] font-black tracking-widest bg-amber-500 text-black px-2 py-0.5 rounded-sm uppercase italic">
                      SYSTEM GM HUB
                    </span>
                    <span className="text-[9px] md:text-[10px] h-5 font-bold tracking-wider bg-white/10 text-zinc-300 px-2 py-0.5 rounded-full uppercase">
                      Season {state.season}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-5xl font-black italic tracking-tighter uppercase text-white leading-tight">
                    {userTeam?.name}
                  </h2>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 max-w-lg">
                  <div className="bg-black/40 border border-white/5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl">
                    <p className="text-[8px] sm:text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Record</p>
                    <p className="text-base sm:text-lg font-black italic text-zinc-100">{userTeam?.wins} - {userTeam?.losses}</p>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl">
                    <p className="text-[8px] sm:text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Conf Rank</p>
                    <p className="text-base sm:text-lg font-black italic text-amber-500">#{standingsPos} in {userTeam?.conference}</p>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl">
                    <p className="text-[8px] sm:text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Starters OVR</p>
                    <p className="text-base sm:text-lg font-black italic text-white">{startersOvr}</p>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl">
                    <p className="text-[8px] sm:text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-0.5">Rotation OVR</p>
                    <p className="text-base sm:text-lg font-black italic text-emerald-400">{calculatedTeamOvr}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Regular Season Progress bar */}
            <div className="w-full lg:w-80 space-y-3 bg-black/40 border border-white/5 p-4 sm:p-5 md:p-6 rounded-[2rem] relative z-10 shrink-0">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Season Progression</p>
                  <p className="text-sm sm:text-base font-black italic text-white uppercase tracking-tight">{gamesPlayed} / 82 Games</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Streak</p>
                  <p className={`text-sm sm:text-base font-black italic font-mono uppercase ${userTeam?.streak?.startsWith?.('W') ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {userTeam?.streak || 'W1'}
                  </p>
                </div>
              </div>
              <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                />
              </div>
              <div className="flex justify-between text-[7px] sm:text-[8px] font-bold tracking-widest text-zinc-600 uppercase">
                <span>Kick Off</span>
                <span>Playoffs Bound</span>
              </div>
            </div>
          </div>

          {/* 2. MATCHDAY CARD - Spectacle Giant Stadium Screen with neon pulse color auras */}
          {nextUserGame && nextMatchupDetails && (
            (() => {
              const uColors = NBA_TEAMS.find(t => t.id === state.userTeamId);
              const oId = nextUserGame.homeTeamId === state.userTeamId ? nextUserGame.awayTeamId : nextUserGame.homeTeamId;
              const oColors = NBA_TEAMS.find(t => t.id === oId);
              
              const pColor = uColors?.primaryColor || '#fbbf24';
              const oColor = oColors?.primaryColor || '#ffffff';

              return (
                <div 
                  className="bg-gradient-to-b from-zinc-950 to-zinc-900 border-2 rounded-[2rem] md:rounded-[2.5rem] p-4 sm:p-6 md:p-10 flex flex-col items-center justify-between gap-4 sm:gap-10 relative overflow-hidden group shadow-2xl select-none"
                  style={{
                    borderColor: `${pColor}40`,
                    boxShadow: `0 0 50px ${pColor}0d, inset 0 0 30px rgba(0,0,0,0.8)`
                  }}
                >
                  {/* Slow low-frequency glowing neon background aura */}
                  <div 
                    className="absolute -top-40 left-1/2 -translate-x-1/2 w-[550px] h-[550px] rounded-full blur-[160px] pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity duration-1000 animate-pulse"
                    style={{
                      background: `radial-gradient(circle, ${pColor}40 0%, ${oColor}15 50%, transparent 100%)`
                    }}
                  />

                  {/* High-Tech Grid Overlays */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-45" />
                  
                  <div className="space-y-1.5 md:space-y-3 relative z-10 text-center w-full">
                    <p className="text-[8px] md:text-xs font-black uppercase tracking-[0.4em] duration-1000 filter drop-shadow-sm animate-pulse" style={{ color: pColor }}>
                      GAMECENTER ARENA LIVE
                    </p>
                    <h3 className="text-3xl md:text-7xl font-sans font-black italic uppercase tracking-tighter text-white leading-none">
                      Matchday {nextUserGame.gameNumber}
                    </h3>
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      <div className="px-2 py-0.5 md:px-3 md:py-1 bg-zinc-950 border border-zinc-800 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest text-zinc-400">
                        BROADCAST PREVIEW
                      </div>
                      <div 
                        className="px-2 py-0.5 md:px-3 md:py-1 bg-zinc-950 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest"
                        style={{ color: pColor, border: `1px solid ${pColor}40` }}
                      >
                        {nextUserGame.homeTeamId === state.userTeamId ? 'Defending Home Court' : 'On the Road Arena'}
                      </div>
                    </div>
                  </div>

                  {/* COMPACT MOBILE MATCHDAY DISPLAY */}
                  <div className="flex sm:hidden items-center justify-between w-full relative z-10 py-1 border-t border-b border-white/5 my-1">
                    {/* User Team */}
                    <div className="flex flex-col items-center gap-1 w-[30%] text-center">
                      <div className="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-xl p-2 flex items-center justify-center shadow-lg">
                        <img src={getTeamLogo(state.userTeamId)} className="w-full h-full object-contain" />
                      </div>
                      <p className="text-[10px] font-black uppercase italic text-white truncate max-w-full leading-none mt-0.5">{uColors?.name.split(' ').pop()}</p>
                      <span className="text-[8px] font-mono text-zinc-400 font-bold px-1.5 py-0.5 bg-white/5 rounded">OVR {startersOvr}</span>
                    </div>

                    {/* Simulation Engine and VS */}
                    <div className="flex-1 flex flex-col items-center justify-center px-1">
                      <span className="text-base font-black italic tracking-widest text-zinc-600 leading-none mb-1.5">VS</span>
                      
                      {isSimulating && simProgress > 0 ? (
                        <div className="w-full space-y-1 select-none text-center px-2">
                          <div className="flex justify-between text-[7px] font-black uppercase text-zinc-400">
                            <span>Simulating...</span>
                            <span className="font-mono text-amber-500">{simProgress}%</span>
                          </div>
                          <div className="h-1 w-full bg-zinc-950 border border-zinc-850 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500" style={{ width: `${simProgress}%` }} />
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={handleSimulateWithSpinner}
                          disabled={isSimulating}
                          className="w-full max-w-[110px] h-8 bg-zinc-950 border text-white rounded-lg font-black uppercase italic tracking-tighter text-[9px] flex items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-75 cursor-pointer shadow-md hover:bg-zinc-900"
                          style={{ borderColor: `${pColor}60` }}
                        >
                          <Zap size={9} className="text-amber-500 shrink-0 animate-pulse" />
                          <span>SIM G_{nextUserGame.gameNumber}</span>
                        </button>
                      )}
                    </div>

                    {/* Opponent Team */}
                    <div className="flex flex-col items-center gap-1 w-[30%] text-center">
                      <div className="w-12 h-12 bg-zinc-950 border border-zinc-850 rounded-xl p-2 flex items-center justify-center shadow-lg">
                        <img src={getTeamLogo(nextMatchupDetails.opponent.id)} className="w-full h-full object-contain" />
                      </div>
                      <p className="text-[10px] font-black uppercase italic text-white truncate max-w-full leading-none mt-0.5">{oColors?.name.split(' ').pop()}</p>
                      <span className="text-[8px] font-mono text-zinc-400 font-bold px-1.5 py-0.5 bg-white/5 rounded">OVR {nextMatchupDetails.opponentOvr}</span>
                    </div>
                  </div>

                  {/* Mobile Batch Sim Controls */}
                  {!isSimulating && (
                    <div className="flex sm:hidden items-center justify-center gap-2 w-full shrink-0 relative z-10">
                      <button 
                        onClick={() => handleSimulateBatch(4)}
                        disabled={isSimulating}
                        className="flex-1 h-8 bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 text-zinc-350 hover:text-white rounded-lg font-black uppercase italic tracking-tighter text-[8px] flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                      >
                        <Activity size={8} className="text-emerald-400 shrink-0" />
                        <span className="font-mono">Sim Week</span>
                      </button>
                      <button 
                        onClick={() => handleSimulateBatch(16)}
                        disabled={isSimulating}
                        className="flex-1 h-8 bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 text-zinc-350 hover:text-white rounded-lg font-black uppercase italic tracking-tighter text-[8px] flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                      >
                        <Award size={8} className="text-indigo-400 shrink-0" />
                        <span className="font-mono">Sim Month</span>
                      </button>
                    </div>
                  )}

                  {/* VS Display and comparative details with team colors - Desktop & Tablet */}
                  <div className="hidden sm:grid grid-cols-1 lg:grid-cols-3 items-center gap-8 relative z-10 w-full">
                    
                    {/* User Team detail */}
                    <div className="flex flex-col items-center lg:items-end gap-3 text-center lg:text-right">
                      <div className="flex items-center gap-4">
                        <div className="hidden lg:block leading-tight">
                          <p className="text-[8px] font-semibold text-zinc-500 uppercase tracking-widest">FRANCHISE</p>
                          <p className="text-xl uppercase italic font-black text-white">{uColors?.name.split(' ').pop()}</p>
                        </div>
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          className="w-20 h-20 bg-zinc-950 border border-zinc-800 rounded-2xl p-3 shadow-2xl flex items-center justify-center transition-all duration-300 ring-2"
                          style={{ borderColor: `${pColor}50`, ringColor: `${pColor}20` }}
                        >
                          <img src={getTeamLogo(state.userTeamId)} className="w-[85%] h-[85%] object-contain" />
                        </motion.div>
                      </div>

                      {/* Power comparison gauges */}
                      <div className="w-full max-w-xs space-y-1.5 mt-2 bg-black/60 p-3 border border-zinc-800/80 rounded-xl shadow-lg">
                        <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-zinc-400">
                          <span>OFF: <span style={{ color: pColor }} className="font-mono font-black italic">{nextMatchupDetails.userOff}</span></span>
                          <span className="text-zinc-550 font-bold">Roster Core</span>
                          <span>DEF: <span className="font-mono font-black italic text-blue-400">{nextMatchupDetails.userDef}</span></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 flex-1 bg-zinc-950 rounded-full overflow-hidden flex justify-end">
                            <div className="h-full rounded-full transition-all duration-500 shadow-[0_0_8px_#f59e0b]" style={{ width: `${nextMatchupDetails.userOff}%`, backgroundColor: pColor }} />
                          </div>
                          <div className="h-1.5 flex-1 bg-zinc-950 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-blue-500 transition-all duration-500 shadow-[0_0_8px_#3b82f6]" style={{ width: `${nextMatchupDetails.userDef}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sim Action with Sweep Metal effect */}
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="text-5xl md:text-6xl font-black italic uppercase tracking-[0.2em] text-zinc-800 relative animate-pulse duration-[2500ms]">
                        VS
                        <span className="absolute inset-0 text-white/5 animate-pulse blur-[5px]" />
                      </div>
                      <div className="h-[2px] w-16 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                      
                      {/* Premium simulation controls with batch features */}
                      {isSimulating && simProgress > 0 ? (
                        <div className="w-48 space-y-2 mt-2 select-none text-center">
                          <div className="flex justify-between text-[8px] font-black uppercase text-zinc-450 tracking-wider">
                            <span>Processing Sim...</span>
                            <span className="font-mono text-amber-500">{simProgress}%</span>
                          </div>
                          <div className="h-2 w-full bg-zinc-950 border border-zinc-850 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-500"
                              style={{ width: `${simProgress}%` }}
                              animate={{ width: `${simProgress}%` }}
                              transition={{ duration: 0.1 }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 w-full max-w-xs mt-2 select-none">
                          <button 
                            onClick={handleSimulateWithSpinner}
                            disabled={isSimulating}
                            className="relative overflow-hidden group/btn text-center h-12 px-6 bg-zinc-950 border-2 text-white rounded-xl font-black uppercase italic tracking-tighter text-[11.5px] flex items-center justify-center gap-2 transition-all outline-none duration-300 active:scale-95 disabled:opacity-75 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.1)] hover:bg-zinc-900"
                            style={{ borderColor: `${pColor}50` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-out" />
                            {isSimulating ? (
                              <>
                                <Activity size={12} className="text-amber-500 animate-spin" />
                                <span className="text-zinc-400 font-mono text-[9px]">RUNNING_SIM_ENG...</span>
                              </>
                            ) : (
                              <>
                                <Zap size={12} className="text-amber-500 group-hover/btn:scale-125 transition-transform" />
                                <span>SIMULATE G_{nextUserGame.gameNumber}</span>
                              </>
                            )}
                          </button>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <button 
                              onClick={() => handleSimulateBatch(4)}
                              disabled={isSimulating}
                              className="relative overflow-hidden group/btn text-center h-10 px-4 bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900 text-zinc-350 hover:text-white rounded-xl font-black uppercase italic tracking-tighter text-[9.5px] flex items-center justify-center gap-1.5 transition-all outline-none duration-350 active:scale-95 disabled:opacity-75 cursor-pointer"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-out" />
                              <Activity size={10} className="text-emerald-400" />
                              <span className="font-mono">Sim Week</span>
                            </button>
                            <button 
                              onClick={() => handleSimulateBatch(16)}
                              disabled={isSimulating}
                              className="relative overflow-hidden group/btn text-center h-10 px-4 bg-zinc-950 border border-zinc-800 hover:border-indigo-500/50 hover:bg-zinc-900 text-zinc-350 hover:text-white rounded-xl font-black uppercase italic tracking-tighter text-[9.5px] flex items-center justify-center gap-1.5 transition-all outline-none duration-355 active:scale-95 disabled:opacity-75 cursor-pointer"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-out" />
                              <Award size={10} className="text-indigo-400" />
                              <span className="font-mono">Sim Month</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Opponent detailed card */}
                    <div className="flex flex-col items-center lg:items-start gap-3 text-center lg:text-left">
                      <div className="flex items-center gap-4">
                        <motion.div 
                          whileHover={{ scale: 1.05 }}
                          className="w-20 h-20 bg-zinc-950 border border-zinc-800 rounded-2xl p-3 shadow-2xl flex items-center justify-center transition-all duration-300 ring-2"
                          style={{ borderColor: `${oColor}40`, ringColor: `${oColor}10` }}
                        >
                          <img src={getTeamLogo(nextMatchupDetails.opponent.id)} className="w-[85%] h-[85%] object-contain" />
                        </motion.div>
                        <div className="leading-tight">
                          <p className="text-[8px] font-semibold text-zinc-500 uppercase tracking-widest">OPPONENT</p>
                          <p className="text-xl uppercase italic font-black text-white">{oColors?.name.split(' ').pop()}</p>
                        </div>
                      </div>

                      {/* Opponent attributes comparison */}
                      <div className="w-full max-w-xs space-y-1.5 mt-2 bg-black/60 p-3 border border-zinc-800/80 rounded-xl shadow-lg">
                        <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-zinc-400">
                          <span>OFF: <span style={{ color: pColor }} className="font-mono font-black italic">{nextMatchupDetails.oppOff}</span></span>
                          <span className="text-zinc-550 font-bold">Roster Core</span>
                          <span>DEF: <span className="font-mono font-black italic text-blue-400">{nextMatchupDetails.oppDef}</span></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-1.5 flex-1 bg-zinc-950 rounded-full overflow-hidden flex justify-end">
                            <div className="h-full rounded-full transition-all duration-500 shadow-[0_0_8px_#f59e0b]" style={{ width: `${nextMatchupDetails.oppOff}%`, backgroundColor: pColor }} />
                          </div>
                          <div className="h-1.5 flex-1 bg-zinc-950 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-blue-500 transition-all duration-500 shadow-[0_0_8px_#3b82f6]" style={{ width: `${nextMatchupDetails.oppDef}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })()
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* NEXT 5 MATCHES GRID LIST - Spectacular timeline chronological display */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6 shrink-0 min-w-0">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm md:text-lg font-black uppercase italic tracking-wider text-zinc-400 flex items-center gap-2">
                    <Calendar size={16} className="text-amber-500" /> Season Timeline
                </h3>
              </div>
              <div className="space-y-3 relative before:absolute before:inset-y-2 before:left-[1.75rem] md:before:left-[2.75rem] before:w-[1px] before:bg-white/5">
                {(state.schedule || [])
                  .filter((m: any) => (m.homeTeamId === state.userTeamId || m.awayTeamId === state.userTeamId) && !m.played)
                  .slice(0, 5)
                  .map((match: any) => {
                    const isHome = match.homeTeamId === state.userTeamId;
                    const opponentId = isHome ? match.awayTeamId : match.homeTeamId;
                    const opponent = NBA_TEAMS.find(t => t.id === opponentId);
                    
                    return (
                      <div key={match.id} className="bg-zinc-950 border border-white/5 rounded-2xl p-4 md:p-5 flex items-center justify-between group hover:bg-zinc-900/60 hover:border-white/10 transition-all duration-300 relative z-10 select-none">
                        <div className="flex items-center gap-4 md:gap-6">
                          <div className="text-center w-6 md:w-12 flex flex-col items-center justify-center shrink-0">
                            <p className="text-[7px] md:text-[8px] font-black text-zinc-550 uppercase tracking-widest leading-none mb-0.5">WK</p>
                            <span className="w-5 h-5 md:w-8 md:h-8 bg-zinc-900 rounded-full border border-white/5 text-[10px] md:text-xs font-black italic flex items-center justify-center text-white leading-none">
                              {match.gameNumber}
                            </span>
                          </div>
                          <div className="flex items-center gap-3.5 md:gap-5">
                            <div className="w-10 h-10 md:w-14 md:h-14 bg-zinc-900 rounded-xl p-2 border border-white/5 group-hover:border-white/12 shadow-xl flex items-center justify-center shrink-0">
                                <img src={getTeamLogo(opponentId)} className="w-full h-full object-contain" />
                            </div>
                            <div className="space-y-0.5 leading-tight">
                              <p className="text-[7.5px] font-black text-zinc-500 uppercase tracking-[0.25em]">{isHome ? 'HOSTING AT HOME' : 'VISITING ROAD ARENA'}</p>
                              <p className="text-sm md:text-lg font-black text-white uppercase italic tracking-tight leading-none">{opponent?.name || opponentId}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="hidden md:flex flex-col items-end leading-none">
                              <span className="text-[7.5px] font-mono font-bold text-zinc-500 uppercase tracking-widest">STATUS</span>
                              <span className="text-[9px] font-black text-amber-500/80 uppercase tracking-widest mt-1">LOCKED ON DECK</span>
                          </div>
                          <div className="w-8 h-8 rounded-full border border-white/5 flex items-center justify-center text-zinc-650 group-hover:text-amber-500 group-hover:border-amber-500/30 transition-all">
                            <ChevronRight size={14} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 3. ESPN-STYLE TICKER Y TABLÓN DE NOTICIAS CON ALERTAS SEMÁNTICAS */}
            <div className="space-y-6 animate-fade-in">
                {/* ESPN style Ticker */}
                <div className="bg-zinc-950/90 rounded-[2rem] border border-red-950/40 overflow-hidden shadow-[0_25px_60px_rgba(239,68,68,0.06)]">
                    {/* Header Banner representing "ESPN LIVE TICKER" with italicized retro-sports font and a pulsing red circular light badge */}
                    <div className="bg-red-650 px-5 py-3.5 flex items-center justify-between select-none border-b border-red-750">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-white italic font-sans flex items-center gap-1.5 leading-none">
                          <Newspaper size={13} className="text-white animate-pulse" /> ESPN Live Ticker
                        </h3>
                      </div>
                      <button 
                        onClick={() => { state.notifications = []; setState({...state}); }} 
                        className="text-[8px] font-black text-white/70 hover:text-white uppercase tracking-widest transition-colors leading-none"
                      >
                        Clear Desk
                      </button>
                    </div>

                    <div className="p-4 space-y-3 max-h-[300px] md:max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                      {(!state.notifications || state.notifications.length === 0) ? (
                        <div className="py-14 text-center space-y-2">
                          <Activity size={20} className="text-zinc-800 mx-auto" />
                          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Quiet in the League Feed</p>
                        </div>
                      ) : (
                        state.notifications.slice(0, 10).map((n: any) => {
                          const messageLower = (n.message || '').toLowerCase();
                          
                          // Semantic classification of notice
                          let alertStyle = 'border-l-blue-500 bg-blue-950/20 text-blue-400';
                          let alertIcon = <TrendingUp size={11} className="text-blue-400 shrink-0" />;
                          
                          if (messageLower.includes('injur') || messageLower.includes('out for') || messageLower.includes('injured')) {
                            alertStyle = 'border-l-rose-500 bg-rose-950/20 text-rose-400';
                            alertIcon = <AlertCircle size={11} className="text-rose-400 shrink-0" />;
                          } else if (messageLower.includes('win') || messageLower.includes('won') || messageLower.includes('award') || messageLower.includes('mvp') || messageLower.includes('streak')) {
                            alertStyle = 'border-l-emerald-500 bg-emerald-950/20 text-emerald-400';
                            alertIcon = <Trophy size={11} className="text-emerald-400 shrink-0 animate-bounce" />;
                          }

                          return (
                            <div 
                              key={n.id} 
                              className={`p-3 rounded-xl border border-white/5 border-l-4 ${alertStyle} space-y-1 relative group hover:bg-white/[0.04] transition-colors`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  {alertIcon}
                                  <span className="text-[8px] font-black uppercase tracking-wider">{n.type}</span>
                                </div>
                                <span className="text-[8px] font-black text-zinc-500 font-mono">WK_{n.week || 0}</span>
                              </div>
                              <p className="text-[10px] font-medium text-zinc-200 leading-snug">{n.message}</p>
                            </div>
                          );
                        })
                      )}
                    </div>
                </div>

                {/* SEASON LEADERS PANEL with circular headset images */}
                <div className="bg-zinc-900/40 rounded-[2rem] p-6 border border-white/5 space-y-4 select-none">
                    <h3 className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-500 italic text-center">LEAGUE STAT LEADERS</h3>
                    <div className="space-y-2.5">
                        {(leagueLeaders || []).map((leader: any) => (
                          <div key={leader.cat} className="flex items-center justify-between bg-zinc-950/80 p-3 rounded-2xl border border-white/5 hover:border-white/10 transition-colors gap-3">
                              <div className="flex items-center gap-3 shrink-0 min-w-0">
                                <div className="w-10 h-10 bg-zinc-900 rounded-xl border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                                  {leader.card?.nbaId ? (
                                    <img 
                                      src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${leader.card.nbaId}.png`} 
                                      className="w-full h-full object-contain scale-120 origin-bottom" 
                                      alt={leader.card?.name}
                                    />
                                  ) : (
                                    <span className="text-[10px] font-black text-zinc-500 uppercase">{leader.cat.substring(0,2)}</span>
                                  )}
                                </div>
                                <div className="leading-tight truncate shrink-0 min-w-0">
                                  <p className="text-[7.5px] font-black text-zinc-500 uppercase tracking-widest leading-none">{leader.cat}</p>
                                  <p className="text-xs font-black text-white italic uppercase truncate w-24 mt-0.5">{leader.card?.name || 'N/A'}</p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-base font-black text-amber-500 italic font-mono tabular-nums leading-none">{leader.value.toFixed(1)}</p>
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
