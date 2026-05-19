import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Users, 
  Sparkles,
  Search,
  ChevronRight,
  GraduationCap,
  Clock,
  CheckCircle2,
  Trophy,
  ArrowRight,
  Pause,
  AlertTriangle,
  Zap,
  Eye,
  Radar
} from 'lucide-react';
import { getTeamLogo } from '../../data/nbaTeams';
import CardItem from '../../components/CardItem';
import { FranchiseState, TeamObject, FranchisePhase } from '../../franchise/types';
import { marketService } from '../../franchise/services/marketService';

interface DraftTabProps {
  state: FranchiseState;
  setState: (state: FranchiseState) => void;
  onComplete: () => void;
}

const DraftTab: React.FC<DraftTabProps> = ({ state, setState, onComplete }) => {
  const [draftState, setDraftState] = useState({
    pick: 1,
    history: [] as { teamId: string, player: any, pick: number }[],
    isPaused: true,
    timer: 30,
    order: [] as string[]
  });

  const [viewingProspectId, setViewingProspectId] = useState<string | null>(null);
  const [scoutingPoints, setScoutingPoints] = useState(12); // Slightly increased to give user ample options
  const [scoutedProspects, setScoutedProspects] = useState<Set<string>>(new Set());
  const [showMobileFlowDrawer, setShowMobileFlowDrawer] = useState(false);

  // Helper mapping of teamIds to objects
  const teamsMap = state.teams as Record<string, TeamObject>;

  // Initialize draft order if empty
  useEffect(() => {
    if (draftState.order.length === 0 && state.teams) {
       let lotteryOrder = state.lotteryPicks || []; 
       const teamsArray = Object.values(state.teams as Record<string, TeamObject>);
       const nonLotteryTeams = teamsArray
         .filter(t => !lotteryOrder.includes(t.teamId))
         .sort((a, b) => a.wins - b.wins)
         .map(t => t.teamId);
       
       const fullOrder = [...lotteryOrder, ...nonLotteryTeams];
       // Two rounds standard draft
       const twoRounds = [...fullOrder, ...[...fullOrder].reverse()];
       setDraftState(prev => ({ ...prev, order: twoRounds }));
    }
  }, [state, draftState.order]);

  const handleUserDraftChoice = useCallback((player: any) => {
    if (!state) return;
    const currentTeamId = draftState.order[draftState.pick - 1];
    
    // Execute draft inside franchise state service
    marketService.draftPlayer(state, player, currentTeamId);
    
    const newHistory = [...draftState.history, { teamId: currentTeamId, player, pick: draftState.pick }];
    setDraftState(prev => ({
      ...prev,
      history: newHistory,
      pick: prev.pick + 1,
      timer: 30
    }));

    setState({ ...state });
  }, [state, draftState, setState]);

  // CPU Automated Draft Actions
  useEffect(() => {
    if (!draftState.isPaused && draftState.pick <= 60 && draftState.order.length > 0) {
      const currentTeamId = draftState.order[draftState.pick - 1];
      const isUser = currentTeamId === state.userTeamId;

      if (!isUser) {
        const timer = setTimeout(() => {
          const available = state.draftPool?.filter(p => !draftState.history.some(h => h.player.id === p.id));
          if (available && available.length > 0) {
            // CPU sorts by true OVR
            const sorted = [...available].sort((a,b) => b.stats.ovr - a.stats.ovr);
            const chosen = sorted[0];
            
            marketService.draftPlayer(state, chosen, currentTeamId);
            
            setDraftState(prev => ({
              ...prev,
              history: [...prev.history, { teamId: currentTeamId, player: chosen, pick: prev.pick }],
              pick: prev.pick + 1,
              timer: 30
            }));
            setState({...state});
          }
        }, 850);
        return () => clearTimeout(timer);
      } else {
        // User countdown clock
        if (draftState.timer > 0) {
           const t = setTimeout(() => setDraftState(prev => ({ ...prev, timer: prev.timer - 1 })), 1000);
           return () => clearTimeout(t);
        } else {
           // Auto-draw best remaining for user when clock hits zero
           const available = state.draftPool?.filter(p => !draftState.history.some(h => h.player.id === p.id));
           if (available && available.length > 0) {
             const sorted = [...available].sort((a,b) => b.stats.ovr - a.stats.ovr);
             handleUserDraftChoice(sorted[0]);
           }
        }
      }
    }
  }, [draftState, state, handleUserDraftChoice, setState]);

  // Scouting logic
  const handleScout = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (scoutingPoints > 0 && !scoutedProspects.has(id)) {
      setScoutingPoints(prev => prev - 1);
      const newSet = new Set(scoutedProspects);
      newSet.add(id);
      setScoutedProspects(newSet);
    }
  };

  // Convert exact numeric potential to standard Draft grade scale letter
  const getPotentialLetter = (potentialVal: number) => {
    const val = potentialVal || 75;
    if (val >= 93) return 'A+';
    if (val >= 88) return 'A';
    if (val >= 83) return 'B+';
    if (val >= 78) return 'B';
    if (val >= 73) return 'C+';
    if (val >= 68) return 'C';
    return 'D-';
  };

  const currentTeamId = draftState.order[draftState.pick - 1];
  const isUserTurn = currentTeamId === state.userTeamId;
  const userPicks = draftState.history.filter(h => h.teamId === state.userTeamId);

  // Completed State View
  if (draftState.pick > 60) {
    return (
      <div className="flex-1 bg-black flex items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="w-20 h-20 bg-amber-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-bounce">
            <Trophy size={40} className="text-black" />
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black italic uppercase text-white tracking-tighter">Draft Completed</h2>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">You secured {userPicks.length} franchise additions.</p>
          </div>
          
          <div className="bg-zinc-900/60 p-5 rounded-3xl border border-white/5 space-y-3 text-left">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Selected Picks Summary</p>
            {userPicks.map(p => (
              <div key={p.pick} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
                <span className="text-xs font-black text-white uppercase italic">#{p.pick} {p.player.name}</span>
                <span className="text-xs font-mono text-amber-500 font-bold">{p.player.stats.ovr} OVR</span>
              </div>
            ))}
          </div>

          <button 
            onClick={onComplete}
            className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-500 transition-all duration-200"
          >
            Advance to Free Agency
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-black text-white font-sans selection:bg-amber-500/20">
      
      {/* 1. ON THE CLOCK PULSING BANNER DISPLAY */}
      <div className="w-full">
        {isUserTurn ? (
          <div className="w-full bg-rose-950/70 border-b-2 border-red-500 py-3.5 px-6 flex items-center justify-between animate-pulse shadow-[0_4px_30px_rgba(239,68,68,0.25)] relative overflow-hidden shrink-0 z-50">
            <div className="absolute inset-y-0 left-0 w-2 h-full bg-red-500" />
            <div className="flex items-center gap-4 min-w-0">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <div className="leading-tight shrink-0 min-w-0">
                <h3 className="text-red-500 font-black font-mono text-xs uppercase tracking-[0.2em] leading-none mb-1">Status: ON THE CLOCK</h3>
                <p className="text-zinc-300 font-bold text-[9px] uppercase tracking-wider truncate">YOUR TURN • CHOOSE A STRATEGIC PROSPECT CORNERSTONE</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase tracking-wider text-red-500 font-mono hidden md:inline">SECONDS FOR INTENT:</span>
              <span className="text-2xl md:text-3.5xl font-mono font-black text-red-500 leading-none bg-red-955/50 border border-red-500/20 px-4 py-1.5 rounded-xl block tracking-tighter">: {draftState.timer}</span>
            </div>
          </div>
        ) : (
          <div className="w-full bg-zinc-900 border-b border-white/10 py-3 px-6 flex items-center justify-between z-40 relative shrink-0">
            <div className="flex items-center gap-3 shrink-0 min-w-0">
              <Radar size={14} className="text-amber-500 animate-spin" />
              <p className="text-zinc-400 font-extrabold font-mono text-[9px] uppercase tracking-[0.15em] truncate">
                ON THE CLOCK: <strong className="text-amber-500 italic uppercase font-black">{teamsMap[currentTeamId]?.name || 'CPU Franchise'}</strong> SECURING SELECTION...
              </p>
            </div>
            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest font-mono">CPU Thinking</span>
          </div>
        )}
      </div>

      {/* Historial superior deslizante en móviles */}
      <div className="flex lg:hidden bg-zinc-950/80 border-b border-white/5 p-2 overflow-x-auto gap-2 scrollbar-none shrink-0">
        {draftState.history.length === 0 ? (
          <div className="text-[9px] font-black uppercase text-zinc-650 italic px-2 py-1">No selections logged yet</div>
        ) : (
          [...draftState.history].reverse().map((h) => (
            <div key={`hist-mob-${h.pick}`} className="flex items-center gap-2 bg-zinc-900 border border-white/10 px-3 py-1.5 rounded-xl shrink-0">
              <img src={getTeamLogo(h.teamId)} className="w-4.5 h-4.5 object-contain" />
              <span className="text-[10px] font-black text-white italic truncate max-w-[95px]">#{h.pick} {h.player.name}</span>
              <span className="text-[8.5px] font-mono font-black text-amber-500">{h.player.stats.ovr}</span>
            </div>
          ))
        )}
      </div>

      {/* Main Draft Room Header controls */}
      <div className="p-4 md:p-6 flex items-center justify-between border-b border-white/5 bg-zinc-950/70 shrink-0">
        <div className="flex items-center gap-3 md:gap-4 min-w-0">
          <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
             <Sparkles className="text-amber-500" size={18} />
          </div>
          <div className="min-w-0 leading-none">
            <h2 className="text-lg md:text-2xl font-black italic uppercase text-white tracking-tighter">Draft War Room</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[8px] font-black tracking-widest text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded leading-none">PICK {draftState.pick} / 60</span>
              <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none">Draft Board Live</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <button 
             onClick={() => setDraftState(prev => ({ ...prev, isPaused: !prev.isPaused }))}
             className={`px-5 py-2.5 rounded-xl border flex items-center gap-2 transition-all text-[9px] font-black uppercase tracking-widest ${draftState.isPaused ? 'bg-amber-500 border-transparent text-black shadow-lg shadow-amber-500/20' : 'bg-zinc-900 border-white/10 text-white'}`}
           >
              {draftState.isPaused ? <Play size={12} fill="currentColor" /> : <Pause size={12} fill="currentColor" />}
              <span>{draftState.isPaused ? 'Resume Draft' : 'Pause CPU'}</span>
           </button>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Aspect: Available Prospects */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 no-scrollbar pb-24">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
             <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] italic">PROSPECTS SEEDS ROOM</h3>
             
             {/* Scouting Points Meter widget */}
             <div className="flex items-center gap-2 bg-gradient-to-r from-zinc-900 to-black px-4.5 py-2 rounded-xl border border-white/15 w-fit">
                <Radar size={13} className="text-indigo-400" />
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-indigo-300">
                  {scoutingPoints} Scouting Points Available
                </span>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {state.draftPool?.map(player => {
              const isSelected = draftState.history.some(h => h.player.id === player.id);
              const isScouted = scoutedProspects.has(player.id);
              
              // Scouting calculations
              // estimated OVR range (e.g., 72-80), true potential letter graded A+ to D-
              const baseOvrVal = player.stats.ovr || 72;
              const minEstimate = Math.max(60, baseOvrVal - Math.floor(baseOvrVal * 0.06));
              const maxEstimate = Math.min(99, baseOvrVal + Math.floor(baseOvrVal * 0.06));
              const potentialGrade = getPotentialLetter(player.potential || player.stats.pot || baseOvrVal + 5);

              return (
                <div 
                  key={player.id} 
                  className={`bg-zinc-900/40 border border-white/5 rounded-2xl p-4 flex gap-4 pr-5 transition-all relative group ${isSelected ? 'opacity-20 pointer-events-none' : 'hover:bg-white/[0.03] hover:border-white/10'}`}
                >
                  {/* Holographic glowing borders for scouted candidates */}
                  {isScouted && (
                    <div className="absolute inset-0 border border-indigo-500/25 rounded-2xl pointer-events-none" />
                  )}

                  <div className="w-16 md:w-20 shrink-0">
                    <CardItem card={player} mode="mini" isOwned={false} />
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                    <div className="space-y-1">
                       <div className="flex items-center justify-between leading-none">
                          <span className="text-[8px] md:text-[9px] font-black text-amber-500 uppercase italic tracking-wider leading-none">{player.position}</span>
                          
                          {/* Scouting exact metric logic */}
                          <div className="flex items-center gap-1.5 leading-none">
                             {isScouted ? (
                               <div className="flex items-baseline gap-1.5 leading-none">
                                 <span className="text-sm md:text-xl font-black text-white italic leading-none">{player.stats.ovr}</span>
                                 <span className="text-[7.5px] font-bold text-emerald-400 uppercase leading-none">SCOUTED</span>
                               </div>
                             ) : (
                               <div className="text-right leading-none">
                                 <span className="text-xs md:text-md font-black font-mono text-zinc-500 block leading-none">{minEstimate}-{maxEstimate}</span>
                                 <span className="text-[7px] font-extrabold text-zinc-650 uppercase block tracking-widest mt-0.5 leading-none">ESTIMATE</span>
                               </div>
                             )}
                          </div>
                       </div>
                       
                       <h4 className="text-xs md:text-base font-black text-white italic truncate uppercase mt-0.5">{player.name}</h4>
                       
                       <div className="flex items-center gap-3">
                         <span className="text-[8px] font-black text-zinc-550 uppercase truncate leading-none">{player.subtitle}</span>
                         <span className="w-1 h-1 bg-zinc-800 rounded-full" />
                         
                         {/* Potential Reveal Indicator */}
                         <div className="flex items-center gap-0.5">
                           <span className="text-[8px] font-bold text-zinc-650 uppercase tracking-widest mr-1">POTENTIAL:</span>
                           {isScouted ? (
                             <span className={`text-[10px] font-mono font-black italic leading-none ${potentialGrade.startsWith('A') ? 'text-emerald-400' : potentialGrade.startsWith('B') ? 'text-amber-500' : 'text-zinc-400'}`}>
                               {potentialGrade}
                             </span>
                           ) : (
                             <span className="text-[10px] text-zinc-700 animate-pulse font-bold leading-none">?</span>
                           )}
                         </div>
                       </div>
                    </div>

                    {/* Scouting and Drafting action trigger controls */}
                    <div className="flex gap-2.5 mt-2">
                       {isUserTurn ? (
                         <button 
                           onClick={() => handleUserDraftChoice(player)}
                           className="flex-1 py-1 px-4 bg-amber-500 hover:bg-amber-400 text-black text-[9px] font-black uppercase rounded-lg italic tracking-wider shadow-lg duration-150 active:scale-95"
                         >
                           Select Prospect
                         </button>
                       ) : (
                         <button 
                           onClick={(e) => handleScout(player.id, e)}
                           disabled={isScouted || scoutingPoints === 0}
                           className={`flex-1 py-1.5 px-4 rounded-lg text-[8.5px] font-black uppercase flex items-center justify-center gap-1 bg-zinc-855 border duration-150 ${isScouted ? 'bg-indigo-950/20 text-indigo-400 border-indigo-500/25 pointer-events-none' : 'bg-zinc-800 hover:bg-white hover:text-black border-white/5 text-zinc-400 disabled:opacity-40 disabled:hover:bg-zinc-800 disabled:hover:text-zinc-400'}`}
                         >
                           {isScouted ? (
                             <>
                               <CheckCircle2 size={10} />
                               <span>Detailed Scouted</span>
                             </>
                           ) : (
                             <>
                               <Eye size={10} />
                               <span>Scout (1 Point)</span>
                             </>
                           )}
                         </button>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Aspect: Board Order List & History */}
        <div className="hidden lg:flex w-80 border-l border-white/5 bg-zinc-950/40 flex-col overflow-hidden">
           <div className="p-5.5 border-b border-white/5 flex items-center justify-between shrink-0">
               <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest italic">Draft Board Flow</h3>
               <div className="text-[8px] font-bold text-amber-500 uppercase px-2 py-0.5 bg-amber-500/10 border border-amber-500/15 rounded">Live</div>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 no-scrollbar space-y-2.5">
              {Array.from({ length: 15 }).map((_, i) => {
                 const pickNum = draftState.pick + i;
                 if (pickNum > 60) return null;
                 const teamId = draftState.order[pickNum - 1];
                 const team = teamsMap[teamId];
                 const isActive = pickNum === draftState.pick;

                 return (
                   <div 
                     key={`next-${pickNum}`}
                     className={`p-3 rounded-2xl border flex items-center gap-3.5 transition-all duration-300 ${isActive ? 'bg-white text-black border-transparent shadow-[0_10px_25px_rgba(255,255,255,0.08)] scale-102 font-black' : 'bg-zinc-90 w/25 border-white/5 bg-black/10 opacity-40'}`}
                   >
                      <span className="text-[10px] font-black italic">#{pickNum}</span>
                      <div className={`w-8 h-8 rounded-lg p-1 flex items-center justify-center shrink-0 ${isActive ? 'bg-zinc-100' : 'bg-zinc-950'}`}>
                         <img src={getTeamLogo(teamId)} className="w-[85%] h-[85%] object-contain" />
                      </div>
                      <span className="text-[10px] font-black uppercase italic truncate max-w-[130px]">{team?.name || 'Prospect'}</span>
                   </div>
                 );
              })}
           </div>

           {/* Recents list overlay */}
           <div className="p-5.5 border-t border-white/5 bg-black/60 shrink-0">
              <h4 className="text-[9px] font-black text-zinc-550 uppercase tracking-[0.2em] mb-3 text-center">HISTORICAL RECENT CHOICES</h4>
              <div className="space-y-2 max-h-[175px] overflow-y-auto no-scrollbar">
                 {[...draftState.history].reverse().slice(0, 3).map((h) => (
                    <div key={`hist-${h.pick}`} className="p-3 bg-zinc-900/80 border border-white/5 rounded-2xl flex items-center gap-3">
                        <div className="w-8 h-8 bg-black rounded-lg p-1.5 shrink-0 flex items-center justify-center border border-white/5">
                           <img src={getTeamLogo(h.teamId)} className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0 flex-1 leading-none">
                           <p className="text-[10px] font-black text-white truncate uppercase italic">{h.player.name}</p>
                           <p className="text-[8px] font-bold text-zinc-650 uppercase tracking-wider mt-1 font-mono">
                             #{h.pick} PICK • {h.player.stats.ovr} OVR
                           </p>
                        </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
      {/* Floating trigger button on mobile to review Draft Flow drawer */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40 animate-bounce">
        <button 
          onClick={() => setShowMobileFlowDrawer(true)}
          className="bg-amber-500 hover:bg-amber-400 text-black px-5 py-3.5 rounded-full font-black text-[10px] uppercase tracking-wider shadow-[0_4px_25px_rgba(245,158,11,0.4)] flex items-center gap-2"
        >
          <Users size={14} />
          <span>Flow Order ({60 - draftState.pick + 1} remaining)</span>
        </button>
      </div>

      {/* Slide-Up Mobile Draft Order Drawer */}
      <AnimatePresence>
        {showMobileFlowDrawer && (
          <>
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileFlowDrawer(false)}
              className="lg:hidden fixed inset-0 bg-black z-50 cursor-pointer pointer-events-auto"
            />
            {/* Slide-Up Sheet content */}
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 220 }}
              className="lg:hidden fixed inset-x-0 bottom-0 max-h-[75vh] bg-zinc-950 border-t border-white/10 rounded-t-[2.5rem] z-50 flex flex-col pointer-events-auto"
            >
              {/* Grab handle bar */}
              <div className="w-12 h-1 bg-zinc-800 rounded-full mx-auto my-3" />
              
              <div className="px-6 pb-4 flex items-center justify-between border-b border-white/5">
                 <h3 className="text-sm font-black uppercase text-amber-500 tracking-widest italic">Live Draft Board Flow</h3>
                 <button 
                   onClick={() => setShowMobileFlowDrawer(false)}
                   className="text-[10px] text-zinc-400 uppercase font-black px-2.5 py-1.5 bg-zinc-900 border border-white/5 rounded-lg"
                 >
                   Close
                 </button>
              </div>
              
              {/* Order List within Drawer */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar pb-16">
                 {Array.from({ length: Math.min(25, 60 - draftState.pick + 1) }).map((_, i) => {
                    const pickNum = draftState.pick + i;
                    const teamId = draftState.order[pickNum - 1];
                    const team = teamsMap[teamId];
                    const isActive = pickNum === draftState.pick;

                    return (
                      <div 
                        key={`drawer-${pickNum}`}
                        className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all duration-300 ${isActive ? 'bg-white text-black border-transparent shadow-[0_10px_25px_rgba(255,255,255,0.08)] scale-102 font-black' : 'bg-zinc-900/40 border-white/5 bg-black/10 opacity-70'}`}
                      >
                        <div className="flex items-center gap-3">
                           <span className="text-[10px] font-black italic">#{pickNum}</span>
                           <div className={`w-8 h-8 rounded-lg p-1 flex items-center justify-center shrink-0 ${isActive ? 'bg-zinc-100' : 'bg-zinc-900'}`}>
                              <img src={getTeamLogo(teamId)} className="w-[85%] h-[85%] object-contain" />
                           </div>
                           <span className="text-[11px] font-black uppercase italic truncate max-w-[150px]">{team?.name || 'Prospect'}</span>
                        </div>
                        {isActive && <span className="text-[8px] font-black uppercase bg-amber-500 text-black px-2 py-0.5 rounded italic">ON THE CLOCK</span>}
                      </div>
                    );
                 })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(DraftTab);
