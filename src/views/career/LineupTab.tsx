import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Users, Sparkles, Award, Zap, Heart, TrendingUp, X, Activity } from 'lucide-react';
import CardItem from '../../components/CardItem';
import { TeamObject } from '../../franchise/types';
import { NBA_TEAMS } from '../../data/nbaTeams';

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
  
  // Responsive layout state
  const [isMobile, setIsMobile] = React.useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [sortMode, setSortMode] = React.useState<'OVR' | 'POS'>('OVR');
  
  // Immersive player inspection state
  const [selectedPlayerForProgress, setSelectedPlayerForProgress] = React.useState<{ id: string; card: any } | null>(null);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const rosterSorted = React.useMemo(() => {
    return [...((userTeam?.roster || []) as string[])].sort((a, b) => {
      const cardA = findCard(a);
      const cardB = findCard(b);
      if (sortMode === 'OVR') {
        const progA = state?.playerProgress?.[a]?.ovr || cardA?.stats.ovr || 0;
        const progB = state?.playerProgress?.[b]?.ovr || cardB?.stats.ovr || 0;
        return progB - progA;
      } else {
        const order = { 'PG': 1, 'SG': 2, 'SF': 3, 'PF': 4, 'C': 5 };
        const posA = cardA?.position.split('/')[0] || '';
        const posB = cardB?.position.split('/')[0] || '';
        return (order[posA as keyof typeof order] || 9) - (order[posB as keyof typeof order] || 9);
      }
    });
  }, [userTeam.roster, sortMode, findCard, state?.playerProgress]);

  const teamOvr = React.useMemo(() => {
    const starters = positions.map(p => {
      const id = userTeam?.lineup?.[p];
      return state?.playerProgress?.[id]?.ovr || findCard(id)?.stats.ovr || 0;
    }).filter(Boolean);
    const bench = ((userTeam?.lineup?.bench || []) as string[]).map(id => {
      return state?.playerProgress?.[id]?.ovr || findCard(id)?.stats.ovr || 0;
    }).filter(Boolean);
    
    const all = [...starters, ...bench];
    if (all.length === 0) return 0;
    return Math.round(all.reduce((a, b) => a + b, 0) / all.length);
  }, [userTeam.lineup, findCard, state?.playerProgress]);

  // Lookup player team colors
  const teamColors = React.useMemo(() => {
    return NBA_TEAMS.find(t => t.id === state?.userTeamId) || { primaryColor: '#fbbf24', secondaryColor: '#000000' };
  }, [state?.userTeamId]);

  return (
    <motion.div 
      key="lineup"
      initial={{ opacity: 0, scale: 0.99 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.99 }}
      className="max-w-[1400px] mx-auto space-y-6 md:space-y-12 pb-32 px-4 md:px-8 select-none"
    >
        {/* TEAM HEADER SUMMARY */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-4 md:pb-6">
           <div className="space-y-1">
              <div className="flex items-center gap-3">
                 <h3 className="text-xl md:text-5xl font-black uppercase italic text-white tracking-tighter leading-none">Roster Management</h3>
                 <div 
                   className="text-black px-2.5 py-1 rounded-lg font-extrabold text-xs md:text-lg italic tracking-tighter shadow-2xl"
                   style={{ 
                     backgroundColor: teamColors.primaryColor,
                     boxShadow: `0 0 25px ${teamColors.primaryColor}40`
                   }}
                 >
                    {teamOvr} OVR
                 </div>
              </div>
              <p className="text-[9px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest italic truncate max-w-sm">Optimize rotation settings and individual progress pathways</p>
           </div>
           
           <div className="flex items-center gap-6 justify-between md:justify-end border-t border-white/5 pt-3 md:border-none md:pt-0">
              <div className="text-left md:text-right">
                 <p className="text-[8px] font-black text-zinc-550 uppercase tracking-widest leading-none mb-1">Active Roster</p>
                 <p className="text-base md:text-2xl font-black text-white italic">{userTeam.roster.length} / 15</p>
              </div>
              <div className="text-right">
                 <p className="text-[8px] font-black text-zinc-550 uppercase tracking-widest leading-none mb-1">Salary Cap</p>
                 <p className={`text-base md:text-2xl font-black italic duration-300 ${userTeam.payroll > 180000000 ? 'text-red-500' : 'text-emerald-400'}`}>
                    ${(userTeam.payroll / 1000000).toFixed(1)}M
                 </p>
              </div>
           </div>
        </div>

        {/* COURT VIEW (STARTING 5) */}
        <div className="space-y-4 md:space-y-8">
           <h4 className="text-xs md:text-base font-black text-zinc-400 uppercase tracking-[0.2em] italic flex items-center gap-2">
              <div className="w-6 h-[1px]" style={{ backgroundColor: teamColors.primaryColor }} />
              Starting Five Tactician
           </h4>
           
           {/* DESKTOP COURT VIEW (hidden on mobile) */}
           <div className="hidden md:flex relative w-full aspect-[16/9] bg-gradient-to-br from-[#02050c] to-[#040916] rounded-[2rem] border border-zinc-850 overflow-hidden shadow-2xl items-center justify-center p-4 pb-8">
              {/* HOLOGRAPHIC DIGITAL MESH GRID & SCANLINES */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-50" />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1.5px,transparent_1.5px)] bg-[size:100%_4px] pointer-events-none opacity-40 animate-pulse" />
              
              {/* Ambient Hologram Spotlight Glow */}
              <div 
                className="absolute inset-[10%] rounded-full blur-[180px] opacity-15 pointer-events-none transition-all duration-1000 animate-pulse"
                style={{
                  background: `radial-gradient(circle, ${teamColors.primaryColor} 0%, transparent 70%)`
                }}
              />
              
              {/* HIGH-TECH COURT MARKS SCIFI SVGs */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                <svg className="w-full h-full" viewBox="0 0 800 450" fill="none">
                  {/* Court Rim border */}
                  <rect x="25" y="25" width="750" height="400" rx="30" stroke={teamColors.primaryColor} strokeWidth="1.5" strokeDasharray="10,5" />
                  {/* Center Court Ring glow with active spinning radar visual overlay */}
                  <circle cx="400" cy="225" r="75" stroke="#10b981" strokeWidth="1" strokeDasharray="8,4" />
                  <circle cx="400" cy="225" r="10" fill="#10b981" opacity="0.1" />
                  <circle cx="400" cy="225" r="6" fill="#10b981" />
                  
                  {/* Tactical Coordinate Crosshairs */}
                  <path d="M400 20v40M400 390v40M20 225h60M720 225h60" stroke="#10b981" strokeWidth="1" strokeLinecap="round" />
                  {/* 3-point lines */}
                  <path d="M 25 80 A 145 145 0 0 1 25 370 M 775 80 A 145 145 0 0 0 775 370" stroke={teamColors.primaryColor} strokeWidth="1.2" strokeDasharray="6,4" />
                </svg>
              </div>

              <div className="relative w-full h-full">
                 {positions.map(pos => {
                    const id = userTeam.lineup[pos];
                    const card = findCard(id);
                    const coords = {
                      'PG': { top: '22%', left: '50%' },
                      'SG': { top: '48%', left: '24%' },
                      'SF': { top: '48%', left: '76%' },
                      'PF': { top: '74%', left: '36%' },
                      'C': { top: '74%', left: '64%' }
                    }[pos];

                    return (
                       <motion.div 
                          key={pos}
                          style={{ top: coords.top, left: coords.left }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 w-[13%] min-w-[125px] max-w-[200px] z-20 group"
                          whileHover={{ scale: 1.05, zIndex: 50 }}
                       >
                          {/* Holographic Glowing Spotlight Base */} <div className="absolute top-[85%] left-1/2 -translate-x-1/2 w-16 h-4 bg-[#10b981]/15 blur-sm rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-300" /> <div className="absolute top-[88%] left-1/2 -translate-x-1/2 w-12 h-1 opacity-40 blur-[2px] rounded-full pointer-events-none" style={{ backgroundColor: teamColors.primaryColor, boxShadow: `0 0 15px 4px ${teamColors.primaryColor}` }} /> <div className="relative">
                             {card ? (
                                <div className="relative group/slot">
                                   <div className="transition-all duration-350 group-hover/slot:drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]">
                                     <CardItem card={card} isOwned={true} mode="mini" />
                                   </div>

                                   <div className="absolute inset-0 bg-black/85 backdrop-blur-md opacity-0 group-hover/slot:opacity-100 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 rounded-[1.25rem] p-2 text-center border border-white/10">
                                      <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider leading-none">{pos}</p>
                                      <p className="text-[8px] font-extrabold text-white truncate max-w-full leading-none mb-1.5">{card.name}</p>
                                      
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedPlayerForProgress({ id, card });
                                        }}
                                        className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-[8px] font-black uppercase tracking-wider rounded-lg border border-white/5 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                                      >
                                        Inspect
                                      </button>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setLineupModalPos(pos);
                                        }}
                                        className="w-full py-1.5 text-black text-[8px] font-black uppercase tracking-wider rounded-lg transition-transform hover:scale-103 cursor-pointer"
                                        style={{ backgroundColor: teamColors.primaryColor }}
                                      >
                                        Swap
                                      </button>
                                   </div>

                                   <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 bg-black border border-white/10 whitespace-nowrap px-3 py-1 rounded-full shadow-2xl transform transition-transform group-hover/slot:scale-110 flex items-center gap-1">
                                      <span className="text-[9px] font-black text-white italic uppercase">{pos}</span>
                                      <span className="w-1 h-1 rounded-full bg-zinc-500" />
                                      <span className="text-[9px] font-extrabold text-amber-500">{(state?.playerProgress?.[id]?.ovr || card.stats?.ovr || 0)}</span>
                                   </div>
                                </div>
                             ) : (
                                <div 
                                  onClick={() => setLineupModalPos(pos)} 
                                  className="aspect-[1/1.4] bg-zinc-950/40 rounded-2xl border-2 border-dashed border-zinc-900 flex flex-col items-center justify-center gap-3 hover:bg-zinc-900/40 w-full hover:border-amber-500/25 transition-all cursor-pointer shadow-inner relative group/wireframe"
                                >
                                   <Plus className="text-zinc-650 w-5 h-5 group-hover/wireframe:text-amber-500 group-hover/wireframe:scale-110 transition-transform duration-300" />
                                   <span className="text-[9px] font-black text-zinc-500 group-hover/wireframe:text-amber-500/85 uppercase tracking-widest italic leading-none">{pos} POSITION</span>
                                </div>
                             )}
                          </div>
                       </motion.div>
                    );
                 })}
              </div>
           </div>

           {/* MOBILE STARTING 5: Highly optimized vertical checklist with large touch targets */}
           <div className="block md:hidden space-y-2">
              {positions.map(pos => {
                 const id = userTeam.lineup[pos];
                 const card = findCard(id);
                 return (
                    <div key={pos} className="bg-zinc-950/70 rounded-xl border border-white/5 p-3 flex items-center justify-between gap-3">
                       <div className="flex items-center gap-3 min-w-0">
                          <div className="flex-shrink-0 w-10 h-10 bg-zinc-90 w-10 h-10 border border-white/5 rounded-lg flex items-center justify-center text-[10px] font-black text-amber-500 italic">
                             {pos}
                          </div>
                          
                          {card ? (
                             <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded bg-zinc-900 border border-white/10 shrink-0 pointer-events-none p-0.5 overflow-hidden">
                                   <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card.nbaId}.png`} className="w-full h-full object-contain origin-bottom scale-110" />
                                </div>
                                <div className="truncate min-w-0 leading-tight">
                                   <h5 className="text-[13px] font-black text-white italic truncate">{card.name}</h5>
                                   <p className="text-[8px] text-zinc-505 uppercase mt-0.5">
                                      OVR: <span className="text-amber-500 font-mono font-black">{(state?.playerProgress?.[id]?.ovr || card.stats?.ovr || 0)}</span>
                                   </p>
                                </div>
                             </div>
                          ) : (
                             <span className="text-xs font-black text-zinc-650 uppercase italic tracking-wider">Position Unassigned</span>
                          )}
                       </div>

                       <div className="flex items-center gap-1.5 shrink-0">
                          {card && (
                             <button
                               onClick={() => setSelectedPlayerForProgress({ id, card })}
                               className="h-11 px-3 bg-zinc-900 border border-white/5 rounded-lg text-[9px] font-black uppercase tracking-wider text-zinc-400 active:scale-95 transition-all"
                             >
                               Inspect
                             </button>
                          )}
                          <button
                            onClick={() => setLineupModalPos(pos)}
                            className="h-11 px-4 rounded-lg font-black text-[9px] text-black uppercase tracking-wider active:scale-95 transition-all flex items-center justify-center"
                            style={{ backgroundColor: teamColors.primaryColor }}
                          >
                            Swap
                          </button>
                       </div>
                    </div>
                 );
              })}
           </div>
        </div>

       {/* BENCH SECTION */}
       <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
             <div className="flex items-center gap-3">
                <h3 className="text-sm md:text-2xl font-black uppercase italic text-white tracking-tighter">Reserves Rotation</h3>
                <span className="text-[8px] md:text-[10px] font-black bg-zinc-900 text-zinc-405 px-2.5 py-1 rounded-full uppercase tracking-wider border border-white/5">
                   {(userTeam?.lineup?.bench || []).length} Active
                </span>
             </div>
             <button 
                onClick={() => setLineupModalPos('bench')}
                className="flex items-center gap-1 bg-zinc-900 border border-white/10 text-white h-11 px-4 rounded-xl text-[9px] font-black uppercase tracking-wider hover:scale-102 active:scale-98 transition-all cursor-pointer"
             >
                <Plus size={12} className="text-amber-500" /> Add Reserve
             </button>
          </div>
          
          {/* Fluid Horizontal Scroll Snap list */}
          <div className="flex gap-3 md:gap-6 overflow-x-auto pb-4 pt-1 snap-x no-scrollbar">
             {((userTeam?.lineup?.bench || []) as string[]).map((id) => {
                const card = findCard(id);
                if (!card) return null;
                return (
                   <motion.div 
                      key={id} 
                      className="group cursor-pointer relative shrink-0 w-28 md:w-36 snap-start"
                      whileHover={{ y: -6 }}
                   >
                      <CardItem card={card} isOwned={true} mode="mini" />
                      
                      {/* Interactive reserve menu */}
                      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1.5 transition-all duration-250 rounded-[1.2rem] p-3 text-center border border-white/10">
                         <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">RESERVE</p>
                         <p className="text-[8.5px] font-black text-white truncate w-full mb-1">{card.name.split(' ').pop()}</p>
                         
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             setSelectedPlayerForProgress({ id, card });
                           }}
                           className="w-full py-1.5 bg-white/5 hover:bg-white/15 text-[8px] font-black uppercase rounded cursor-pointer text-zinc-300"
                         >
                           Inspect
                         </button>
                         <button 
                           onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Remove ${card.name} from bench?`)) {
                                 userTeam.lineup.bench = userTeam.lineup.bench.filter((bid: string) => bid !== id);
                                 setState({ ...state });
                              }
                           }}
                           className="w-full py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/20 text-rose-400 hover:text-white text-[8px] font-black uppercase rounded cursor-pointer"
                         >
                           Remove
                         </button>
                      </div>
                   </motion.div>
                );
             })}
             {((userTeam?.lineup?.bench || []) as string[]).length === 0 && (
                <div className="w-full py-12 flex flex-col items-center justify-center border border-dashed border-white/5 bg-zinc-950/40 rounded-[1.5rem] md:rounded-[2rem] gap-2">
                   <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center">
                      <Users className="text-zinc-650 animate-pulse" size={20} />
                   </div>
                   <div className="text-center p-3">
                      <p className="text-xs font-black text-zinc-500 uppercase italic">Bench Empty</p>
                      <p className="text-[7.5px] font-extrabold text-[#71717a] uppercase tracking-widest mt-0.5">Appoint secondary reserves to balance fatigue</p>
                   </div>
                </div>
             )}
          </div>
       </div>

        {/* PLAYER INSPECT DETAIL MODAL (Adaptive Desk Center OR Bottom Sheet on Mobile) */}
        <AnimatePresence>
          {selectedPlayerForProgress && (
            <div className="fixed inset-0 z-[11000] flex items-end md:items-center justify-center p-0 md:p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setSelectedPlayerForProgress(null)}
                className="absolute inset-0 bg-black/95 backdrop-blur-2xl" 
              />

              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] blur-[120px] opacity-15 pointer-events-none rounded-full"
                style={{ backgroundColor: teamColors.primaryColor }}
              />

              <motion.div 
                initial={isMobile ? { y: '100%' } : { scale: 0.94, opacity: 0, y: 30 }} 
                animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1, y: 0 }} 
                exit={isMobile ? { y: '100%' } : { scale: 0.94, opacity: 0, y: 30 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className={isMobile 
                  ? "fixed bottom-0 left-0 right-0 max-h-[85vh] rounded-t-[2.5rem] bg-zinc-950 border-t border-white/10 p-5 flex flex-col gap-5 overflow-y-auto z-20 shadow-3xl pb-safe"
                  : "relative w-full max-w-4xl bg-zinc-950/95 border border-white/10 rounded-[2rem] p-6 md:p-10 flex flex-col md:flex-row gap-8 overflow-hidden z-20 shadow-3xl"
                }
              >
                {/* Tactile pull handle for mobile bottom sheets */}
                {isMobile && (
                  <div className="w-12 h-1 bg-zinc-750 rounded-full mx-auto mb-1 shrink-0 opacity-80" />
                )}

                {/* Close button */}
                <button 
                  onClick={() => setSelectedPlayerForProgress(null)} 
                  className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-full text-zinc-405 hover:text-white transition-colors z-50 cursor-pointer"
                >
                  <X size={16} />
                </button>

                {/* Left Half: Card display with custom presentation (Holographic Pedestal) */}
                <div className="flex flex-col items-center justify-center shrink-0 w-full md:w-80 bg-zinc-950/80 border border-white/5 rounded-[2rem] p-6 relative overflow-hidden group shadow-2xl min-h-[380px]">
                  {/* Glowing Spotlight Pedestal */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.02)_0%,transparent_70%)] pointer-events-none" />
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 h-6 bg-amber-500/5 blur-xl rounded-full pointer-events-none group-hover:bg-amber-500/10 transition-all duration-1000" />
                  <div 
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 w-36 h-1.5 opacity-40 blur-[2px] rounded-full pointer-events-none"
                    style={{
                      backgroundColor: teamColors.primaryColor,
                      boxShadow: `0 0 25px 6px ${teamColors.primaryColor}`
                    }}
                  />
                  <div className="scale-100 md:scale-105 select-none drop-shadow-[0_20px_50px_rgba(0,0,0,0.85)] relative z-10 transition-transform duration-500 hover:scale-110">
                    <CardItem card={selectedPlayerForProgress.card} isOwned={true} mode="premium" />
                  </div>
                </div>

                {/* Right Half: Dynamic statistics, level tracks, injury flags */}
                {(() => {
                  const id = selectedPlayerForProgress.id;
                  const card = selectedPlayerForProgress.card;
                  const progressDetails = state?.playerProgress?.[id] || { age: 24, potential: 82, form: 50 };
                  
                  // Stats computation
                  const sNode = state?.stats?.seasonal?.[id];
                  let gp = sNode?.gamesPlayed || 0;
                  let ppg = gp > 0 ? (sNode.points / gp).toFixed(1) : '0.0';
                  let rpg = gp > 0 ? (sNode.rebounds / gp).toFixed(1) : '0.0';
                  let apg = gp > 0 ? (sNode.assists / gp).toFixed(1) : '0.0';

                  const currOvr = progressDetails.ovr || card.stats.ovr || 72;
                  const pOvr = progressDetails.potential || card.stats.potential || 85;
                  const progressPercent = Math.min(100, Math.max(0, ((currOvr - 60) / (pOvr - 60)) * 100));

                  const isInjured = progressDetails.injuryWeeks && progressDetails.injuryWeeks > 0;

                  return (
                    <div className="flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-1.5 leading-tight">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider">ATHLETE FILE</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                            <span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest"># {card.nbaId || 'ACTIVE'}</span>
                          </div>
                          <h2 className="text-xl md:text-5xl font-black uppercase italic tracking-tighter text-white">
                            {card.name}
                          </h2>
                          <p className="text-zinc-500 font-extrabold text-[10px] md:text-sm uppercase tracking-widest">{card.position} | Tier {card.tier?.toUpperCase() || 'COMMON'}</p>
                        </div>

                        {/* Health & Status Badge row */}
                        <div className="flex flex-wrap gap-1.5">
                          {isInjured ? (
                            <div className="px-2.5 py-1 bg-red-950/80 border border-red-500/20 text-red-00 font-black text-[8px] uppercase tracking-wider rounded-lg flex items-center gap-1 leading-none">
                              <Activity size={10} className="animate-pulse" />
                              INJURED: {progressDetails.injuryType || 'Sprained Ankle'} ({progressDetails.injuryWeeks}w left)
                            </div>
                          ) : (
                            <div className="px-2.5 py-1 bg-emerald-950/85 border border-emerald-500/20 text-emerald-400 font-black text-[8px] uppercase tracking-wider rounded-lg flex items-center gap-1 leading-none">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              FULLY FIT & ACTIVE
                            </div>
                          )}

                          <div className="px-2.5 py-1 bg-zinc-900 border border-white/5 text-zinc-400 font-black text-[8px] uppercase tracking-wider rounded-lg leading-none">
                            FORM: {progressDetails.form ?? 50}%
                          </div>
                        </div>

                        {/* OVERALL AND PROGRESS TRACKER */}
                        <div className="bg-[#090d16] border border-white/10 p-5 rounded-[1.5rem] space-y-4 shadow-inner relative overflow-hidden backdrop-blur-md">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-transparent blur-xl pointer-events-none" />
                          
                          <div className="flex justify-between items-end">
                            <div className="leading-none">
                              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">CURRENT OVR</p>
                              <h4 className="text-2xl font-black italic uppercase text-white mt-1.5 flex items-center gap-2">
                                {currOvr} 
                                <span className="text-[10px] font-normal tracking-wide not-italic px-1.5 py-0.5 bg-white/5 border border-white/15 rounded text-zinc-400">ACTIVE OVR</span>
                              </h4>
                            </div>
                            <div className="text-right leading-none">
                              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">POTENTIAL LIMIT</p>
                              <h4 className="text-xl font-black italic uppercase text-zinc-300 mt-1.5 flex items-center justify-end gap-2">
                                <span className="text-[10px] font-normal tracking-wide not-italic px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400">CAP LIMIT</span>
                                {pOvr}
                              </h4>
                            </div>
                          </div>

                          {/* Dual Line progress visualizer track */}
                          <div className="space-y-2 pt-1">
                            <div className="relative h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5 shadow-inner">
                              {/* Glowing flow background track of potential */}
                              <div className="absolute inset-0 bg-white/[0.02] pointer-events-none" />
                              
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progressPercent}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="h-full rounded-full relative"
                                style={{ 
                                  background: `linear-gradient(90deg, ${teamColors.primaryColor}df 0%, ${teamColors.primaryColor}ff 100%)`,
                                  boxShadow: `0 0 12px ${teamColors.primaryColor}`
                                }}
                              >
                                {/* Glowing light sweep on active indicator */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                              </motion.div>
                            </div>
                            <div className="flex justify-between text-[8px] font-black tracking-widest text-zinc-500 uppercase">
                              <span>BASE (60)</span>
                              <span className="text-amber-500 animate-pulse">DEVELOPING PATHWAY: {Math.round(progressPercent)}%</span>
                              <span>CEILING ({pOvr})</span>
                            </div>
                          </div>
                        </div>

                        {/* CURRENT SEASON AVERAGES FEED */}
                        <div className="space-y-1.5">
                          <p className="text-[8.5px] font-black text-zinc-550 uppercase tracking-widest">SEASON SIMULATION AVERAGES</p>
                          <div className="grid grid-cols-4 gap-2">
                            <div className="bg-zinc-900/40 border border-white/5 p-2 rounded-xl text-center">
                              <p className="text-[7.5px] font-bold text-zinc-550 uppercase mb-0.5">Games</p>
                              <p className="text-base font-black italic font-mono text-zinc-100">{gp}</p>
                            </div>
                            <div className="bg-zinc-900/40 border border-white/5 p-2 rounded-xl text-center">
                              <p className="text-[7.5px] font-bold text-zinc-550 uppercase mb-0.5">Points</p>
                              <p className="text-base font-black italic font-mono text-emerald-400">{ppg}</p>
                            </div>
                            <div className="bg-zinc-900/40 border border-white/5 p-2 rounded-xl text-center">
                              <p className="text-[7.5px] font-bold text-zinc-550 uppercase mb-0.5">Rebounds</p>
                              <p className="text-base font-black italic font-mono text-indigo-400">{rpg}</p>
                            </div>
                            <div className="bg-zinc-900/40 border border-white/5 p-2 rounded-xl text-center">
                              <p className="text-[7.5px] font-bold text-zinc-550 uppercase mb-0.5">Assists</p>
                              <p className="text-base font-black italic font-mono text-amber-500">{apg}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Profile Footer */}
                      <div className="border-t border-white/5 pt-3.5 flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: teamColors.primaryColor }} />
                          <span className="text-[7.5px] font-mono font-bold text-zinc-500 uppercase tracking-widest truncate max-w-[130px]">Dynamic Contract Guard</span>
                        </div>
                        <button 
                          onClick={() => setSelectedPlayerForProgress(null)}
                          className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white border border-white/5 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

         {/* MODAL REDESIGN - Choose best fit roster modal */}
         <AnimatePresence>
          {lineupModalPos && (
            <div className="fixed inset-0 z-[10000] flex items-end md:items-center justify-center p-0 md:p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setLineupModalPos(null)}
                className="absolute inset-0 bg-black/98 backdrop-blur-2xl" 
              />
              <motion.div 
                initial={isMobile ? { y: '100%' } : { scale: 0.9, y: 40, opacity: 0 }} 
                animate={isMobile ? { y: 0 } : { scale: 1, y: 0, opacity: 1 }} 
                exit={isMobile ? { y: '100%' } : { scale: 0.9, y: 40, opacity: 0 }}
                className={isMobile 
                  ? "fixed bottom-0 left-0 right-0 max-h-[85vh] rounded-t-[2.5rem] bg-zinc-950 border-t border-white/10 p-5 flex flex-col gap-4 overflow-y-auto z-20 shadow-3xl pb-safe"
                  : "relative w-full max-w-7xl bg-zinc-950/80 border border-white/10 rounded-[2.5rem] md:rounded-[4rem] p-6 lg:p-12 space-y-8 max-h-[90vh] overflow-hidden flex flex-col shadow-2xl z-20"
                }
              >
                {/* Tactile pull handle for mobile bottom sheets md:hidden */}
                {isMobile && (
                  <div className="w-12 h-1 bg-zinc-750 rounded-full mx-auto mb-1 shrink-0 opacity-80" />
                )}

                <div className="flex flex-col md:flex-row md:items-end justify-between shrink-0 gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg md:text-5xl font-black uppercase italic tracking-tighter text-white leading-none">Assignment Desk</h3>
                      <div 
                        className="text-black px-2 py-0.5 rounded text-[10px] md:text-base font-black italic tracking-tighter skew-x-[-10deg] shrink-0"
                        style={{ backgroundColor: teamColors.primaryColor }}
                      >
                        Slot {lineupModalPos}
                      </div>
                    </div>
                    <p className="text-zinc-500 text-[8px] md:text-xs font-bold uppercase tracking-widest italic flex items-center gap-1.5">
                       <Sparkles size={11} className="text-amber-500 shrink-0" /> SELECT FROM YOUR ACTIVE ROSTER TO ASSIGN
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0">
                     <div className="flex bg-zinc-90 w-fit border border-white/5 p-0.5 rounded-lg">
                        <button 
                          onClick={() => setSortMode('OVR')}
                          className={`px-3 py-1.5 rounded-md text-[8px] md:text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${sortMode === 'OVR' ? 'bg-white text-black font-extrabold' : 'text-zinc-500 hover:text-white'}`}
                        >
                          By OVR
                        </button>
                        <button 
                          onClick={() => setSortMode('POS')}
                          className={`px-3 py-1.5 rounded-md text-[8px] md:text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer ${sortMode === 'POS' ? 'bg-white text-black font-extrabold' : 'text-zinc-500 hover:text-white'}`}
                        >
                          By POS
                        </button>
                     </div>
                     <button onClick={() => setLineupModalPos(null)} className="w-9 h-9 md:w-14 md:h-14 flex items-center justify-center bg-zinc-900 hover:bg-zinc-805 rounded-full transition-colors border border-white/5 cursor-pointer text-zinc-400">
                       <Plus size={20} className="rotate-45" />
                     </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-1 no-scrollbar">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-6 pb-12">
                     {rosterSorted.map(id => {
                        const card = findCard(id);
                        if (!card) return null;
                        
                        const isPositionMatch = lineupModalPos !== 'bench' && card.position.includes(lineupModalPos!.charAt(0));
                        const isAssigned = lineupModalPos !== 'bench' 
                          ? (userTeam.lineup[lineupModalPos as keyof TeamObject['lineup']] === id)
                          : (userTeam.lineup.bench as string[]).includes(id);

                        const isAssignedElsewhere = lineupModalPos !== 'bench' 
                          ? Object.values(userTeam?.lineup || {}).some((v, idx) => v === id && positions[idx] !== lineupModalPos) || ((userTeam?.lineup?.bench || []) as string[]).includes(id)
                          : Object.values(userTeam?.lineup || {}).slice(0, 5).some(v => v === id);

                        return (
                           <motion.div 
                              key={id}
                              whileHover={isAssigned ? {} : { y: -8 }}
                              whileTap={isAssigned ? {} : { scale: 0.97 }}
                              className={`relative h-full flex flex-col group ${isAssigned ? 'cursor-default' : 'cursor-pointer'}`}
                              onClick={() => {
                                 if (isAssigned) return;
                                 handleUpdateLineup(id);
                                 setLineupModalPos(null);
                              }}
                           >
                              <div className={`h-full transition-all duration-400 ${isAssigned ? 'opacity-25 grayscale blur-[0.5px]' : 'group-hover:drop-shadow-[0_0_20px_rgba(245,158,11,0.25)]'}`}>
                                 <CardItem card={card} isOwned={true} mode="mini" />
                              </div>
                              
                              {isAssigned && (
                                 <div className="absolute inset-x-0 bottom-8 z-55 flex items-center justify-center p-2">
                                    <div className="bg-amber-500 text-black px-2.5 py-1 rounded font-black text-[8px] uppercase italic skew-x-[-10deg]">
                                       Slot occupied
                                    </div>
                                 </div>
                              )}

                              {!isAssigned && isAssignedElsewhere && (
                                 <div className="absolute top-2 right-2 z-[60] bg-zinc-900 border border-white/10 text-zinc-500 text-[6.5px] font-black px-1.5 py-0.5 rounded uppercase italic">
                                    Elsewhere
                                 </div>
                              )}

                              {!isAssigned && isPositionMatch && (
                                 <div className="absolute top-2 left-2 z-[60] bg-emerald-950/90 text-emerald-400 text-[7.5px] font-black px-1.5 py-0.5 rounded border border-emerald-500/20 italic tracking-tighter">
                                    POSITION FIT
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
