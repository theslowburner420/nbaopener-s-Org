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
  Pause
} from 'lucide-react';
import { getTeamLogo } from '../../data/nbaTeams';
import CardItem from '../../components/CardItem';
import { FranchiseState, TeamObject, FranchisePhase } from '../../franchise/types';
import { marketService } from '../../franchise/services/marketService';
import { generateDraftPool } from '../../franchise/services/rosterService';

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
  const [scoutingPoints, setScoutingPoints] = useState(10);
  const [scoutedProspects, setScoutedProspects] = useState<Set<string>>(new Set());

  // Initialize draft order if empty
  useEffect(() => {
    if (draftState.order.length === 0 && state.teams) {
       // Combine lottery picks with remaining teams ordered by wins
       let lotteryOrder = state.lotteryPicks || []; // Already contains teamIds in order 1-14
       const teamsArray = Object.values(state.teams as Record<string, TeamObject>);
       const nonLotteryTeams = teamsArray
         .filter(t => !lotteryOrder.includes(t.teamId))
         .sort((a, b) => a.wins - b.wins)
         .map(t => t.teamId);
       
       const fullOrder = [...lotteryOrder, ...nonLotteryTeams];
       // Two rounds
       const twoRounds = [...fullOrder, ...[...fullOrder].reverse()];
       setDraftState(prev => ({ ...prev, order: twoRounds }));
    }
  }, [state, draftState.order]);

  const handleUserDraftChoice = useCallback((player: any) => {
    if (!state) return;
    const currentTeamId = draftState.order[draftState.pick - 1];
    
    // Execute draft in state
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

  // CPU Picking Logic
  useEffect(() => {
    if (!draftState.isPaused && draftState.pick <= 60 && draftState.order.length > 0) {
      const currentTeamId = draftState.order[draftState.pick - 1];
      const isUser = currentTeamId === state.userTeamId;

      if (!isUser) {
        const timer = setTimeout(() => {
          const available = state.draftPool?.filter(p => !draftState.history.some(h => h.player.id === p.id));
          if (available && available.length > 0) {
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
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        // User timer logic
        if (draftState.timer > 0) {
           const t = setTimeout(() => setDraftState(prev => ({ ...prev, timer: prev.timer - 1 })), 1000);
           return () => clearTimeout(t);
        } else {
           // Auto-pick best for user
           const available = state.draftPool?.filter(p => !draftState.history.some(h => h.player.id === p.id));
           if (available && available.length > 0) {
             const sorted = [...available].sort((a,b) => b.stats.ovr - a.stats.ovr);
             handleUserDraftChoice(sorted[0]);
           }
        }
      }
    } else if (draftState.pick > 60) {
       // Draft Finished - automated transition could happen here but we wait for user in summary
    }
  }, [draftState, state, handleUserDraftChoice, setState]);

  const handleScout = (id: string) => {
    if (scoutingPoints > 0 && !scoutedProspects.has(id)) {
      setScoutingPoints(scoutingPoints - 1);
      const newSet = new Set(scoutedProspects);
      newSet.add(id);
      setScoutedProspects(newSet);
    }
  };

  const currentTeamId = draftState.order[draftState.pick - 1];
  const isUserTurn = currentTeamId === state.userTeamId;
  const userPicks = draftState.history.filter(h => h.teamId === state.userTeamId);

  if (draftState.pick > 60) {
    return (
      <div className="flex-1 bg-black flex items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
            <Trophy size={40} className="text-black" />
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black italic uppercase text-white">Draft Complete</h2>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">You have selected {userPicks.length} new prospects.</p>
          </div>
          <button 
            onClick={onComplete}
            className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-amber-500 transition-all"
          >
            Continue to Free Agency
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-black">
      {/* Draft Header */}
      <div className="p-4 md:p-8 flex items-center justify-between border-b border-white/5 bg-zinc-950/50">
        <div className="flex items-center gap-3 md:gap-6">
          <div className="w-10 h-10 md:w-16 md:h-16 bg-zinc-900 rounded-xl md:rounded-2xl flex items-center justify-center border border-white/10 shrink-0">
             <Sparkles className="text-amber-500" size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl md:text-3xl font-black italic uppercase text-white truncate leading-none mb-1">Draft Room</h2>
            <div className="flex items-center gap-2 md:gap-3">
              <span className="text-[8px] md:text-[10px] font-black text-amber-500 uppercase tracking-widest whitespace-nowrap">Pick {draftState.pick}/60</span>
              <div className="w-0.5 h-0.5 bg-zinc-800 rounded-full" />
              <span className="text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">S{state.season}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
           {isUserTurn && (
             <div className="text-right">
                <p className="text-[8px] md:text-[10px] font-black text-amber-500 uppercase tracking-widest animate-pulse whitespace-nowrap">Your Turn</p>
                <p className="text-lg md:text-3xl font-black italic tabular-nums text-white">: {draftState.timer}</p>
             </div>
           )}
           <button 
             onClick={() => setDraftState(prev => ({ ...prev, isPaused: !prev.isPaused }))}
             className="p-3 md:px-8 md:py-4 bg-zinc-900 border border-white/10 rounded-xl md:rounded-2xl flex items-center gap-2 hover:bg-white hover:text-black transition-all"
           >
              {draftState.isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
              <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest hidden md:inline">{draftState.isPaused ? 'Resume' : 'Pause'}</span>
           </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Prospect List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 no-scrollbar pb-32">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <h3 className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.3em] italic">Available Prospects</h3>
             <div className="flex items-center gap-3 bg-zinc-900/50 px-4 py-2 rounded-xl border border-white/5 w-fit">
                <Search size={12} className="text-zinc-600" />
                <span className="text-[9px] font-black uppercase text-white">{scoutingPoints} Scouting Points</span>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {state.draftPool?.map(player => {
              const isSelected = draftState.history.some(h => h.player.id === player.id);
              const isScouted = scoutedProspects.has(player.id);

              return (
                <div 
                  key={player.id} 
                  className={`bg-zinc-900/40 border border-white/5 rounded-2xl md:rounded-3xl p-3 md:p-4 flex gap-4 md:gap-6 group transition-all ${isSelected ? 'opacity-20 pointer-events-none' : 'hover:bg-white/[0.03] hover:border-white/10'}`}
                >
                  <div className="w-16 md:w-24 shrink-0 shadow-2xl">
                    <CardItem card={player} mode="mini" isOwned={false} />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                    <div className="space-y-1">
                       <div className="flex items-center justify-between">
                          <span className="text-[8px] md:text-[10px] font-black text-amber-500 italic uppercase">{player.position}</span>
                          <div className="flex items-baseline gap-1">
                             <span className="text-sm md:text-xl font-black text-white italic">{player.stats.ovr}</span>
                             <span className="text-[7px] md:text-[8px] font-black text-zinc-700">OVR</span>
                          </div>
                       </div>
                       <h4 className="text-sm md:text-lg font-black text-white italic uppercase tracking-tighter truncate">{player.name}</h4>
                       <p className="text-[8px] md:text-[10px] font-bold text-zinc-500 uppercase truncate">{player.subtitle}</p>
                    </div>

                    <div className="flex gap-2">
                       {isUserTurn ? (
                         <button 
                           onClick={() => handleUserDraftChoice(player)}
                           className="flex-1 py-2 md:py-3 bg-amber-500 text-black text-[8px] md:text-[9px] font-black uppercase rounded-lg md:rounded-xl hover:scale-105 transition-transform"
                         >
                           Draft
                         </button>
                       ) : (
                         <button 
                           onClick={() => handleScout(player.id)}
                           disabled={isScouted || scoutingPoints === 0}
                           className="flex-1 py-2 md:py-3 bg-zinc-800 text-zinc-500 text-[8px] md:text-[9px] font-black uppercase rounded-lg md:rounded-xl hover:bg-white hover:text-black transition-all disabled:opacity-50"
                         >
                           {isScouted ? 'Scouted' : 'Scout'}
                         </button>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Order & History - HIDDEN ON MOBILE */}
        <div className="hidden lg:flex w-80 border-l border-white/5 bg-zinc-950/30 flex-col overflow-hidden">
           <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest italic">Draft Board</h3>
              <div className="text-[8px] font-black text-amber-500 uppercase px-2 py-1 bg-amber-500/10 rounded">Live</div>
           </div>
           
           <div className="flex-1 overflow-y-auto p-4 no-scrollbar space-y-3">
              {Array.from({ length: 15 }).map((_, i) => {
                 const pickNum = draftState.pick + i;
                 if (pickNum > 60) return null;
                 const teamId = draftState.order[pickNum - 1];
                 const team = state.teams[teamId];
                 const isActive = pickNum === draftState.pick;

                 return (
                   <div 
                     key={`next-${pickNum}`}
                     className={`p-3 rounded-2xl border flex items-center gap-4 transition-all ${isActive ? 'bg-white text-black border-transparent shadow-2xl scale-105' : 'bg-zinc-900/50 border-white/5 opacity-40'}`}
                   >
                      <span className="text-[10px] font-black italic">#{pickNum}</span>
                      <div className={`w-8 h-8 rounded-lg p-1.5 ${isActive ? 'bg-zinc-100' : 'bg-black'}`}>
                         <img src={getTeamLogo(teamId)} className="w-full h-full object-contain" />
                      </div>
                      <span className="text-[11px] font-black uppercase italic truncate">{team?.name}</span>
                   </div>
                 );
              })}
           </div>

           <div className="p-6 border-t border-white/5 bg-black/40">
              <h4 className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-4 text-center">Recent Picks</h4>
              <div className="space-y-2">
                 {[...draftState.history].reverse().slice(0, 3).map((h, i) => (
                    <div key={`hist-${h.pick}`} className="p-3 bg-zinc-900 border border-white/5 rounded-2xl flex items-center gap-3">
                        <div className="w-10 h-10 bg-black rounded-xl p-2 shrink-0">
                           <img src={getTeamLogo(h.teamId)} className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0">
                           <p className="text-[10px] font-black text-white truncate">{h.player.name}</p>
                           <p className="text-[8px] font-bold text-zinc-600 uppercase">#{h.pick} • {h.player.stats.ovr} OVR</p>
                        </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(DraftTab);
