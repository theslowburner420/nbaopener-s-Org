import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Users, Sparkles } from 'lucide-react';
import CardItem from '../../components/CardItem';
import { TeamObject } from '../../franchise/types';

interface LineupTabProps {
  state: any;
  userTeam: any;
  findCard: (id: string, season?: number) => any;
  lineupModalPos: string | null;
  setLineupModalPos: (pos: string | null) => void;
  handleUpdateLineup: (playerId: string) => void;
  setState: (state: any) => void;
}

const LineupTab: React.FC<LineupTabProps> = React.memo(({ 
  state, 
  userTeam,
  findCard,
  lineupModalPos,
  setLineupModalPos,
  handleUpdateLineup,
  setState
}) => {
  const positions = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
  
  // Layout positions for court visualization (percent-based)
  // Adjusted for standard half-court perspective
  const courtLayout: Record<string, { top: string, left: string, label: string }> = {
    'PG': { top: '20%', left: '50%', label: 'Point Guard' },
    'SG': { top: '45%', left: '25%', label: 'Shooting Guard' },
    'SF': { top: '45%', left: '75%', label: 'Small Forward' },
    'PF': { top: '75%', left: '35%', label: 'Power Forward' },
    'C': { top: '75%', left: '65%', label: 'Center' }
  };

  const [sortMode, setSortMode] = React.useState<'OVR' | 'POS'>('OVR');

  const rosterSorted = React.useMemo(() => {
    return [...(userTeam.roster as string[])].sort((a, b) => {
      const cardA = findCard(a);
      const cardB = findCard(b);
      if (sortMode === 'OVR') {
        return (cardB?.stats.ovr || 0) - (cardA?.stats.ovr || 0);
      } else {
        const order = { 'PG': 1, 'SG': 2, 'SF': 3, 'PF': 4, 'C': 5 };
        const posA = cardA?.position.split('/')[0] || '';
        const posB = cardB?.position.split('/')[0] || '';
        return (order[posA as keyof typeof order] || 9) - (order[posB as keyof typeof order] || 9);
      }
    });
  }, [userTeam.roster, sortMode, findCard]);

  const teamOvr = React.useMemo(() => {
    const starters = positions.map(p => findCard(userTeam.lineup[p])?.stats.ovr || 0);
    const bench = (userTeam.lineup.bench as string[]).map(id => findCard(id)?.stats.ovr || 0);
    const all = [...starters, ...bench];
    if (all.length === 0) return 0;
    return Math.round(all.reduce((a, b) => a + b, 0) / all.length);
  }, [userTeam.lineup, findCard]);

  return (
    <motion.div 
      key="lineup"
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.98 }}
      className="max-w-[1400px] mx-auto space-y-6 md:space-y-10 pb-32 px-4 md:px-8"
    >
        {/* TEAM HEADER SUMMARY */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
           <div className="space-y-1">
              <div className="flex items-center gap-3">
                 <h3 className="text-2xl md:text-5xl font-black uppercase italic text-white tracking-tighter leading-none">Roster Management</h3>
                 <div className="bg-amber-500 text-black px-3 py-1 rounded-sm font-black text-xs md:text-lg italic tracking-tighter shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                    {teamOvr} OVR
                 </div>
              </div>
              <p className="text-[10px] md:text-sm font-bold text-zinc-500 uppercase tracking-[0.3em] italic">Optimize your rotation for the championship hunt</p>
           </div>
           <div className="flex items-center gap-6">
              <div className="text-right">
                 <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Active Roster</p>
                 <p className="text-lg font-black text-white italic">{userTeam.roster.length} / 15</p>
              </div>
              <div className="text-right">
                 <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Cap Status</p>
                 <p className={`text-lg font-black italic ${userTeam.payroll > 180000000 ? 'text-red-500' : 'text-green-500'}`}>
                    ${(userTeam.payroll / 1000000).toFixed(1)}M
                 </p>
              </div>
           </div>
        </div>

        {/* COURT VIEW (STARTING 5) */}
        <div className="space-y-4 md:space-y-8">
           <h4 className="text-sm md:text-base font-black text-zinc-400 uppercase tracking-[0.2em] italic flex items-center gap-2">
              <div className="w-8 h-[1px] bg-amber-500/50" />
              Starting Five
           </h4>
           
           <div className="relative w-full aspect-[3/4] md:aspect-[16/10] bg-zinc-950 rounded-[2rem] md:rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl flex items-center justify-center p-4">
              {/* COURT DECORATIONS */}
              <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
                 {/* Outer boundary */}
                  <div className="absolute inset-4 border-2 border-white rounded-[2rem]" />
                  {/* Three-point line (simplified) */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] aspect-square rounded-full border-4 border-white -translate-y-1/2" />
                 {/* Key/Paint area */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[30%] h-[40%] bg-white/5 border-2 border-white" />
                 {/* Free throw circle */}
                  <div className="absolute top-[40%] left-1/2 -translate-x-1/2 w-[15%] aspect-square rounded-full border-2 border-white -translate-y-1/2" />
                 {/* Center court circle */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[20%] aspect-square rounded-full border-2 border-white translate-y-1/2" />
              </div>

              {/* POSITIONS GRID */}
              <div className="relative w-full h-full">
                 {positions.map(pos => {
                    const card = findCard(userTeam.lineup[pos]);
                    const layout = courtLayout[pos];
                    return (
                       <motion.div 
                          key={pos}
                          style={{ top: layout.top, left: layout.left }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 w-[22%] md:w-[12%] min-w-[70px] md:min-w-[110px] max-w-[200px] z-20 group"
                          whileHover={{ scale: 1.05, zIndex: 50 }}
                       >
                          <div onClick={() => setLineupModalPos(pos)} className="cursor-pointer relative">
                             {card ? (
                                <>
                                   <div className="md:block hidden">
                                      <CardItem card={card} isOwned={true} mode="mini" />
                                   </div>
                                   <div className="md:hidden block">
                                      {/* Compact card for mobile court view */}
                                      <div className="aspect-[1/1.4] bg-zinc-900 rounded-lg border border-white/10 overflow-hidden relative shadow-2xl">
                                         <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card.nbaId}.png`} className="w-full h-full object-contain" />
                                         <div className="absolute top-1 right-1 bg-white rounded-sm px-1 flex items-center justify-center">
                                            <span className="text-[6px] font-black text-black italic">{card.stats.ovr}</span>
                                         </div>
                                      </div>
                                   </div>
                                   <div className="absolute -bottom-3 md:-bottom-4 left-1/2 -translate-x-1/2 bg-white md:bg-black border border-black/10 md:border-white/20 whitespace-nowrap px-1.5 md:px-3 py-0.5 md:py-1 rounded shadow-2xl transform transition-transform group-hover:scale-110">
                                      <span className="text-[6px] md:text-[10px] font-black text-black md:text-white italic tracking-tighter uppercase">{pos}</span>
                                   </div>
                                </>
                             ) : (
                                <div className="aspect-[1/1.4] bg-white/5 rounded-xl md:rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-2 md:gap-3 hover:bg-white/10 transition-all">
                                   <Plus className="text-zinc-600 scale-75 md:scale-100" />
                                   <span className="text-[8px] md:text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">{pos}</span>
                                </div>
                             )}
                          </div>
                       </motion.div>
                    );
                 })}
              </div>


           </div>
        </div>

       {/* BENCH SECTION */}
       <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
             <div className="flex items-center gap-4">
                <h3 className="text-xl md:text-3xl font-black uppercase italic text-white tracking-tighter">Second Unit & Bench</h3>
                <span className="text-[10px] font-black bg-zinc-800 text-zinc-400 px-2.5 py-1 rounded-full uppercase tracking-widest border border-white/5">
                   {userTeam.lineup.bench.length} Active Reserves
                </span>
             </div>
             <button 
                onClick={() => setLineupModalPos('bench')}
                className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/5"
             >
                <Plus size={16} /> Add Reserve
             </button>
          </div>
          
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 md:gap-6">
             {(userTeam.lineup.bench as string[]).map((id) => {
                const card = findCard(id);
                if (!card) return null;
                return (
                   <motion.div 
                      key={id} 
                      className="group cursor-pointer relative"
                      whileHover={{ y: -8 }}
                      onClick={() => {
                         if (confirm(`Remove ${card.name} from bench?`)) {
                            userTeam.lineup.bench = userTeam.lineup.bench.filter((bid: string) => bid !== id);
                            setState({ ...state });
                         }
                      }}
                   >
                      <CardItem card={card} isOwned={true} mode="mini" />
                      <div className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                        <span className="text-[8px] font-black text-white uppercase italic">Remove</span>
                      </div>
                   </motion.div>
                );
             })}
             {userTeam.lineup.bench.length === 0 && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-white/5 bg-white/[0.01] rounded-[2rem] gap-4">
                   <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center">
                      <Users className="text-zinc-700" size={32} />
                   </div>
                   <div className="text-center space-y-1">
                      <p className="text-lg font-black text-zinc-500 uppercase italic">Empty Bench</p>
                      <p className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest italic">Add players to stabilize your second rotation</p>
                   </div>
                </div>
             )}
          </div>
       </div>

       {/* MODAL REDESIGN */}
       <AnimatePresence>
        {lineupModalPos && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setLineupModalPos(null)}
              className="absolute inset-0 bg-black/98 backdrop-blur-2xl" 
            />
            <motion.div 
              initial={{ scale: 0.9, y: 40, opacity: 0 }} 
              animate={{ scale: 1, y: 0, opacity: 1 }} 
              exit={{ scale: 0.9, y: 40, opacity: 0 }}
              className="relative w-full max-w-7xl bg-zinc-900/50 border border-white/10 rounded-[2rem] md:rounded-[4rem] p-6 md:p-14 space-y-8 md:space-y-12 max-h-[95vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between shrink-0 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <h3 className="text-3xl md:text-6xl font-black uppercase italic tracking-tighter text-white leading-none">Assignment</h3>
                    <div className="bg-amber-500 text-black px-4 py-1 rounded text-sm md:text-xl font-black italic tracking-tighter">
                      {lineupModalPos}
                    </div>
                  </div>
                  <p className="text-zinc-500 text-[10px] md:text-sm font-bold uppercase tracking-[0.3em] italic flex items-center gap-2">
                     <Sparkles size={14} className="text-amber-500" /> Choose the best fit for your team strategy
                  </p>
                </div>
                
                <div className="flex items-center gap-4">
                   <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                      <button 
                        onClick={() => setSortMode('OVR')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${sortMode === 'OVR' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
                      >
                        By OVR
                      </button>
                      <button 
                        onClick={() => setSortMode('POS')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${sortMode === 'POS' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
                      >
                        By POS
                      </button>
                   </div>
                   <button onClick={() => setLineupModalPos(null)} className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-white/5 rounded-full hover:bg-white/10 transition-colors border border-white/5">
                     <Plus size={32} className="rotate-45" />
                   </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 md:pr-6 custom-scrollbar">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-4 md:gap-8 pb-12">
                   {rosterSorted.map(id => {
                      const card = findCard(id);
                      if (!card) return null;
                      
                      const isPositionMatch = lineupModalPos !== 'bench' && card.position.includes(lineupModalPos!.charAt(0));
                      const isAssigned = lineupModalPos !== 'bench' 
                        ? (userTeam.lineup[lineupModalPos as keyof TeamObject['lineup']] === id)
                        : (userTeam.lineup.bench as string[]).includes(id);

                      // Also check if they are already assigned SOMEWHERE else (only allow moving if swap logic is clear)
                      const isAssignedElsewhere = lineupModalPos !== 'bench' 
                        ? Object.values(userTeam.lineup).some((v, idx) => v === id && positions[idx] !== lineupModalPos) || (userTeam.lineup.bench as string[]).includes(id)
                        : Object.values(userTeam.lineup).slice(0, 5).some(v => v === id);

                      return (
                         <motion.div 
                            key={id}
                            whileHover={isAssigned ? {} : { y: -10 }}
                            whileTap={isAssigned ? {} : { scale: 0.95 }}
                            className={`relative h-full flex flex-col group ${isAssigned ? 'cursor-default' : 'cursor-pointer'}`}
                            onClick={() => {
                               if (isAssigned) return;
                               handleUpdateLineup(id);
                               setLineupModalPos(null);
                            }}
                         >
                            <div className={`h-full transition-all duration-500 ${isAssigned ? 'opacity-30 grayscale blur-[1px]' : 'group-hover:drop-shadow-[0_0_25px_rgba(245,158,11,0.3)]'}`}>
                               <CardItem card={card} isOwned={true} mode="mini" />
                            </div>
                            
                            {isAssigned && (
                               <div className="absolute inset-x-0 bottom-8 z-50 flex items-center justify-center p-2">
                                  <div className="bg-amber-500 text-black px-3 py-1 rounded font-black text-[8px] md:text-[10px] uppercase italic skew-x-[-10deg] shadow-xl shadow-amber-500/20">
                                     Assigned {lineupModalPos === 'bench' ? 'Reserve' : lineupModalPos}
                                  </div>
                               </div>
                            )}

                            {!isAssigned && isAssignedElsewhere && (
                               <div className="absolute top-2 right-2 z-[60] bg-zinc-800 text-zinc-400 text-[6px] md:text-[8px] font-black px-1.5 py-0.5 rounded border border-white/10 uppercase italic">
                                  In Use
                               </div>
                            )}

                            {!isAssigned && isPositionMatch && (
                               <div className="absolute top-2 left-2 z-[60] bg-green-500/90 text-white text-[8px] md:text-[10px] font-black px-2 py-0.5 rounded shadow-lg border border-white/20 italic tracking-tighter">
                                  PERFECT FIT
                               </div>
                            )}
                         </motion.div>
                      );
                   })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default LineupTab;
