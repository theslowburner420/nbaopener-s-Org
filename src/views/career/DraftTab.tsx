import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Users, 
  Sparkles,
  Search,
  ChevronRight,
  ShieldAlert,
  GraduationCap,
  Clock,
  CheckCircle2,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { getTeamLogo } from '../../data/nbaTeams';
import CardItem from '../../components/CardItem';
import { TeamObject } from '../../franchise/types';

interface DraftTabProps {
  state: any;
  draftState: {
    pick: number;
    history: any[];
    isPaused: boolean;
    order: string[];
    timer: number;
  };
  setDraftState: React.Dispatch<React.SetStateAction<any>>;
  viewingProspectId: string | null;
  setViewingProspectId: (id: string | null) => void;
  handleUserDraftChoice: (player: any) => void;
  advanceSeason: (state: any) => any;
  setState: (state: any) => void;
  setActiveTab: (tab: any) => void;
  notifySuccess: (msg: string) => void;
  scoutingPoints: number;
  setScoutingPoints: (val: number) => void;
  scoutedProspects: Set<string>;
  setScoutedProspects: (val: Set<string>) => void;
}

const DraftTab: React.FC<DraftTabProps> = ({
  state,
  draftState,
  setDraftState,
  viewingProspectId,
  setViewingProspectId,
  handleUserDraftChoice,
  advanceSeason,
  setState,
  setActiveTab,
  notifySuccess,
  scoutingPoints,
  setScoutingPoints,
  scoutedProspects,
  setScoutedProspects
}) => {
  const [showSummary, setShowSummary] = useState(false);
  const userPicks = draftState.history.filter(h => h.teamId === state.userTeamId);

  const handleScout = (id: string) => {
    if (scoutingPoints > 0 && !scoutedProspects.has(id)) {
      setScoutingPoints(scoutingPoints - 1);
      const newSet = new Set(scoutedProspects);
      newSet.add(id);
      setScoutedProspects(newSet);
    }
  };

  const getPickInRound = (pick: number) => ((pick - 1) % 30) + 1;
  const currentTeamId = draftState.order[getPickInRound(draftState.pick) - 1];
  const isUserTurn = currentTeamId === state.userTeamId;

  useEffect(() => {
    if (draftState.pick > 60) {
      setShowSummary(true);
    }
  }, [draftState.pick]);

  if (showSummary) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto space-y-8 pb-24"
      >
        <div className="bg-zinc-900 border border-white/5 rounded-[3rem] p-12 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 blur-[100px] rounded-full" />
          <div className="relative z-10 space-y-4">
            <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
              <CheckCircle2 size={40} className="text-black" />
            </div>
            <h2 className="text-5xl font-black italic uppercase italic tracking-tighter text-white leading-none">Draft Class Secured</h2>
            <p className="text-zinc-500 font-bold uppercase tracking-[0.4em] text-xs">Review your new additions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10 text-left">
            {userPicks.map((pick, i) => (
              <div key={pick.player.id} className="bg-black/40 border border-white/5 rounded-3xl p-6 flex items-center gap-6">
                 <div className="w-24 shrink-0">
                    <CardItem card={pick.player} mode="mini" isOwned={true} />
                 </div>
                 <div className="space-y-2">
                    <div className="flex items-center gap-2">
                       <span className="px-2 py-0.5 bg-amber-500 text-black text-[8px] font-black rounded uppercase">Pick #{pick.pick}</span>
                       <span className={`px-2 py-0.5 bg-zinc-800 text-[8px] font-black rounded uppercase tracking-widest ${
                         pick.player.stats.draftPotential === 'star' ? 'text-amber-400' : 
                         pick.player.stats.draftPotential === 'starter' ? 'text-blue-400' :
                         pick.player.stats.draftPotential === 'rotation' ? 'text-emerald-400' : 'text-zinc-500'
                       }`}>
                         {pick.player.stats.draftPotential?.toUpperCase()}
                       </span>
                    </div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tight">{pick.player.name}</h3>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">{pick.player.subtitle} • {pick.player.position}</p>
                 </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => {
              const newState = advanceSeason(state);
              setState(newState);
              setActiveTab('hub');
              notifySuccess("Season advanced! Good luck in the Regular Season.");
            }}
            className="relative z-10 w-full py-6 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-amber-500 transition-all active:scale-95 shadow-2xl"
          >
            Enter New Season
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="max-w-[1600px] mx-auto space-y-6 pb-24 px-3 md:px-0"
    >
      {/* ON THE CLOCK BANNER */}
      {isUserTurn && !draftState.isPaused && (
        <motion.div 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="bg-amber-500 py-3 text-black overflow-hidden relative rounded-2xl mb-4"
        >
          <div className="flex whitespace-nowrap animate-marquee font-black uppercase italic text-[10px] md:text-sm tracking-tighter items-center gap-8">
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} className="flex items-center gap-4">
                <Clock size={16} /> YOU ARE ON THE CLOCK <ArrowRight size={16} /> PICK #{draftState.pick}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* HEADER SECTION */}
      <div className="bg-zinc-950 border border-white/5 rounded-3xl p-5 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4 md:gap-6 relative z-10 w-full">
          <div className="w-12 h-12 md:w-20 md:h-20 bg-zinc-900 rounded-xl md:rounded-2xl p-3 md:p-4 border border-white/5 flex items-center justify-center shrink-0">
            <Sparkles className="text-amber-500 md:w-8 md:h-8" size={24} />
          </div>
          <div className="space-y-0.5 md:space-y-1">
            <h2 className="text-xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-none">Draft Room</h2>
            <div className="flex items-center gap-2 md:gap-3">
              <span className="text-[8px] md:text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">Season {state.season}</span>
              <div className="w-1 h-1 rounded-full bg-zinc-700" />
              <span className="text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">Pick {draftState.pick}/60</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4 relative z-10 w-full md:w-auto">
          <div className="flex-1 md:w-48 bg-black/40 border border-white/5 p-3 md:p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-[7px] md:text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none">Points</p>
              <p className="text-sm md:text-xl font-black text-white italic leading-none mt-1">{scoutingPoints}</p>
            </div>
            <Search className="text-zinc-700 md:w-5 md:h-5" size={16} />
          </div>

          {draftState.isPaused ? (
            <button 
              onClick={() => setDraftState((prev: any) => ({ ...prev, isPaused: false }))}
              className="px-6 md:px-10 py-3 md:py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest text-[9px] md:text-[10px] hover:bg-amber-500 transition-all flex items-center gap-2"
            >
              <Play size={12} fill="currentColor" /> Resume
            </button>
          ) : (
             <div className="flex flex-col items-end gap-1 px-2 md:px-4 shrink-0">
               <span className="text-[7px] md:text-[8px] font-black text-amber-500 animate-pulse tracking-widest uppercase">Live</span>
               <div className="w-20 md:w-32 h-1 bg-zinc-900 rounded-full overflow-hidden">
                 <motion.div animate={{ x: [-128, 128] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-32 h-full bg-amber-500" />
               </div>
             </div>
          )}
        </div>
      </div>

      <div className="flex flex-col landscape:grid landscape:grid-cols-12 xl:grid xl:grid-cols-12 gap-6 items-start">
        {/* PROSPECT GRID */}
        <div className="landscape:col-span-8 xl:col-span-8 space-y-4 w-full">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[9px] md:text-xs font-black uppercase tracking-[0.3em] text-zinc-600 italic">Available Prospects</h3>
            <div className="flex gap-2">
               <div className="px-2 py-1 md:px-3 md:py-1.5 bg-zinc-900 rounded-lg text-[8px] md:text-[9px] font-black text-white border border-white/5 uppercase">Round {draftState.pick <= 30 ? 1 : 2}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[500px] md:h-[700px] overflow-y-auto pr-2 no-scrollbar scroll-smooth">
            {state.draftPool?.map((player: any) => {
              const hist = draftState.history.find(h => h.player.id === player.id);
              const isPicked = !!hist;
              const isScouted = scoutedProspects.has(player.id);

              return (
                <motion.div 
                  key={player.id}
                  layout
                  className={`bg-zinc-900 border border-white/5 rounded-3xl p-4 flex gap-5 relative group transition-all ${isPicked ? 'opacity-20 translate-y-1' : 'hover:border-zinc-700 hover:bg-zinc-800/40'}`}
                >
                  <div className="w-24 shrink-0 shadow-2xl relative">
                    <CardItem card={player} mode="mini" isOwned={false} />
                    {isPicked && (
                       <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center">
                          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/40 border border-white/10">
                             <img src={getTeamLogo(hist.teamId)} className="w-4 h-4 object-contain grayscale" />
                          </div>
                       </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <span className="px-1.5 py-0.5 bg-black text-[7px] font-black rounded uppercase text-zinc-500 border border-white/5">{player.position}</span>
                           <div className="flex items-center gap-1">
                              <GraduationCap size={10} className="text-zinc-700" />
                              <span className="text-[7px] font-bold text-zinc-600 uppercase truncate max-w-[80px]">{player.subtitle}</span>
                           </div>
                         </div>
                         <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-white italic">{player.stats.ovr}</span>
                            <span className="text-[7px] font-black text-zinc-700">OVR</span>
                         </div>
                      </div>
                      <h4 className="text-lg font-black text-white italic uppercase tracking-tight truncate">{player.name}</h4>
                    </div>

                    <div className="grid grid-cols-3 gap-2 border-y border-white/5 py-2 my-2">
                       <div className="text-center">
                          <p className="text-[7px] font-black text-zinc-700 uppercase">PTS</p>
                          <p className="text-[11px] font-black text-zinc-400 italic">{isScouted ? player.stats.points.toFixed(1) : '??'}</p>
                       </div>
                       <div className="text-center">
                          <p className="text-[7px] font-black text-zinc-700 uppercase">REB</p>
                          <p className="text-[11px] font-black text-zinc-400 italic">{isScouted ? player.stats.rebounds.toFixed(1) : '??'}</p>
                       </div>
                       <div className="text-center">
                          <p className="text-[7px] font-black text-zinc-700 uppercase">AST</p>
                          <p className="text-[11px] font-black text-zinc-400 italic">{isScouted ? player.stats.assists.toFixed(1) : '??'}</p>
                       </div>
                    </div>

                    <div className="flex gap-2">
                       {isUserTurn && !isPicked ? (
                         <button 
                           onClick={() => handleUserDraftChoice(player)}
                           className="flex-1 py-3 bg-amber-500 text-black text-[9px] font-black uppercase rounded-xl shadow-lg hover:scale-105 transition-all shadow-amber-500/10 active:scale-95"
                         >
                           Draft Player
                         </button>
                       ) : (
                         <div className="flex-1 h-3" />
                       )}
                       {!isPicked && (
                         <button 
                           onClick={() => handleScout(player.id)}
                           disabled={isScouted || scoutingPoints === 0}
                           className={`w-12 h-10 rounded-xl flex items-center justify-center transition-all ${isScouted ? 'bg-emerald-500/10 text-emerald-500' : scoutingPoints > 0 ? 'bg-zinc-800 text-zinc-500 hover:bg-white hover:text-black' : 'bg-zinc-950 text-zinc-800 opacity-50 cursor-not-allowed'}`}
                         >
                           {isScouted ? <CheckCircle2 size={16} /> : <Search size={16} />}
                         </button>
                       )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ORDER PANEL */}
        <div className="landscape:col-span-4 xl:col-span-4 space-y-6 landscape:sticky landscape:top-24 w-full">
          <div className="bg-zinc-950 border border-white/5 rounded-[2.5rem] p-6 md:p-8 space-y-4 md:space-y-6">
             <div className="flex items-center justify-between">
                <h3 className="text-[9px] md:text-xs font-black uppercase tracking-[0.3em] text-zinc-500 italic">Order</h3>
                <div className="flex gap-1">
                   <div className="w-1 h-1 bg-amber-500 rounded-full" />
                </div>
             </div>

             <div className="space-y-2 md:space-y-3 max-h-[300px] md:max-h-[450px] overflow-y-auto no-scrollbar">
                {Array.from({ length: 15 }).map((_, i) => {
                  const pickNum = draftState.history.length + i + 1;
                  if (pickNum > 60) return null;
                  const teamId = draftState.order[getPickInRound(pickNum) - 1];
                  const team = state.teams[teamId];
                  const isActive = pickNum === draftState.pick;
                  const isUser = teamId === state.userTeamId;

                  return (
                    <div key={`pick-${pickNum}`} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isActive ? 'bg-white text-black border-transparent shadow-[0_20px_50px_rgba(255,255,255,0.1)] scale-105' : isUser ? 'bg-amber-500/10 border-amber-500/20' : 'bg-zinc-900/50 border-white/5 opacity-40'}`}>
                       <div className="flex items-center gap-4">
                          <span className={`text-[10px] font-black italic ${isActive ? 'text-black' : 'text-zinc-800'}`}>#{pickNum}</span>
                          <div className={`w-10 h-10 rounded-xl p-2 border ${isActive ? 'bg-zinc-100 border-black/5' : 'bg-black border-white/5'}`}>
                             <img src={getTeamLogo(teamId)} className="w-full h-full object-contain" />
                          </div>
                          <p className={`text-[11px] font-black uppercase italic ${isActive ? 'text-black' : isUser ? 'text-amber-500' : 'text-white'}`}>{team?.name}</p>
                       </div>
                       {isActive && (
                          <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                       )}
                    </div>
                  );
                })}
             </div>

             <div className="space-y-4 pt-6 border-t border-white/5">
                <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest text-center">Recent Selections</p>
                <div className="space-y-2">
                  {[...draftState.history].reverse().slice(0, 3).map((h: any) => (
                    <div key={`log-${h.pick}`} className="flex items-center gap-3 p-3 bg-black/40 rounded-xl border border-dashed border-white/5">
                        <div className="w-8 h-8 rounded-lg p-1.5 bg-zinc-900 grayscale">
                          <img src={getTeamLogo(h.teamId)} className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-white italic uppercase tracking-tight leading-none">{h.player.name}</p>
                          <p className="text-[8px] font-bold text-zinc-600 uppercase mt-1">Pick #{h.pick} • {h.player.stats.ovr} OVR</p>
                        </div>
                    </div>
                  ))}
                </div>
             </div>
          </div>

          {/* TEAM NEEDS / ROSTER SUMMARY PREVIEW */}
          <div className="bg-zinc-950 border border-white/5 rounded-[2.5rem] p-8">
             <div className="flex items-center gap-3 mb-6">
                <Trophy size={16} className="text-zinc-700" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Your Picks</h3>
             </div>
             <div className="space-y-3">
                {userPicks.length === 0 ? (
                  <div className="py-8 text-center space-y-2 border border-dashed border-white/5 rounded-2xl opacity-20">
                     <Users size={24} className="mx-auto" />
                     <p className="text-[8px] font-black uppercase tracking-widest">No players selected yet</p>
                  </div>
                ) : (
                  userPicks.map((p: any) => (
                    <div key={`mine-${p.pick}`} className="flex items-center justify-between p-4 bg-amber-500 rounded-2xl text-black">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-black/10 rounded-lg flex items-center justify-center font-black">#{p.pick}</div>
                          <p className="text-xs font-black uppercase italic">{p.player.name}</p>
                       </div>
                       <span className="text-[10px] font-black">{p.player.stats.ovr}</span>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default React.memo(DraftTab);
