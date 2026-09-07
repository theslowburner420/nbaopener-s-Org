import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Users, Sparkles, Award, Zap, Heart, TrendingUp, X, Activity, ChevronUp } from 'lucide-react';
import CardItem from '../../components/CardItem';
import { TeamObject } from '../../franchise/types';
import { NBA_TEAMS } from '../../data/nbaTeams';
import { PlayerHeadshot } from '../../components/PlayerHeadshot';

interface LineupTabProps {
  state: any;
  userTeam: any;
  findCard: (id: string, season?: number) => any;
  lineupModalPos: string | null;
  setLineupModalPos: (pos: string | null) => void;
  handleUpdateLineup: (playerId: string) => void;
  setState: (state: any) => void;
}

// Visual Slot Component mapped from DraftView style
interface SlotProps {
  card: any;
  label: string;
  position: string | null;
  mini?: boolean;
  onClick: () => void;
  onInspect: () => void;
  onSwap: () => void;
  disabled?: boolean;
  isSelected?: boolean;
  teamColor?: string;
}

const Slot: React.FC<SlotProps> = React.memo(({ 
  card, 
  label, 
  position, 
  mini, 
  onClick, 
  onInspect, 
  onSwap, 
  disabled, 
  isSelected,
  teamColor
}) => {
  const [screenSize, setScreenSize] = React.useState(() => {
    if (typeof window === 'undefined') return 'desktop';
    const w = window.innerWidth;
    if (w < 640) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  });

  React.useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 640) setScreenSize('mobile');
      else if (w < 1024) setScreenSize('tablet');
      else setScreenSize('desktop');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cardWidth = React.useMemo(() => {
    if (mini) {
      if (screenSize === 'mobile') return 68;
      if (screenSize === 'tablet') return 95;
      return 105;
    } else {
      if (screenSize === 'mobile') return 78;
      if (screenSize === 'tablet') return 130;
      return 175;
    }
  }, [mini, screenSize]);

  return (
    <div 
      className={`relative group transition-all duration-500 w-full h-full aspect-[2.5/3.5] ${disabled ? 'opacity-40 pointer-events-none grayscale-[0.5]' : ''} ${isSelected ? 'scale-110 z-50' : ''}`}
    >
      {card ? (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: isSelected ? 1.05 : 1, 
            opacity: 1,
            boxShadow: isSelected ? [
              "0 0 20px rgba(245,158,11,0.4)",
              "0 0 40px rgba(245,158,11,0.8)",
              "0 0 20px rgba(245,158,11,0.4)"
            ] : "0 10px 25px rgba(0,0,0,0.5)"
          }}
          whileTap={{ scale: 0.95 }}
          className="h-full w-full cursor-pointer relative"
          onClick={onClick}
        >
          <CardItem 
            card={card} 
            isOwned={true} 
            width={cardWidth} 
            mode={mini ? 'mini' : 'large'}
          />

          {/* Desktop Hover Action overlay (hidden on real touch but perfect fallback) */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-all duration-300 rounded-[1.25rem] p-2 text-center border border-white/10 z-30">
             <p className="text-[10px] font-black uppercase text-zinc-400 tracking-wider leading-none">{label}</p>
             <p className="text-[8px] font-extrabold text-white truncate max-w-full leading-none mb-1.5">{card.name}</p>
             
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 onInspect();
               }}
               className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-[8px] font-black uppercase tracking-wider rounded-lg border border-white/5 text-zinc-300 hover:text-white transition-colors cursor-pointer"
             >
               Inspect
             </button>
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 onSwap();
               }}
               className="w-full py-1.5 text-black text-[8px] font-black uppercase tracking-wider rounded-lg transition-transform hover:scale-105 cursor-pointer"
               style={{ backgroundColor: teamColor || '#fbbf24' }}
             >
               Swap
             </button>
          </div>

          {/* Small Position Marker Badge */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-zinc-950 border border-white/10 px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1 z-20 group-hover:scale-110 duration-200">
             <span className="text-[8px] font-black text-white italic">{label}</span>
          </div>
        </motion.div>
      ) : (
        <button 
          onClick={onClick}
          disabled={disabled}
          className="h-full w-full bg-zinc-900/30 border-2 border-dashed border-zinc-800/50 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-amber-500/50 hover:bg-zinc-900/60 transition-all relative overflow-hidden text-left"
        >
          {/* Ghost Card Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/10 to-transparent opacity-50" />
          
          <div className={`rounded-full bg-zinc-900/80 flex items-center justify-center text-zinc-650 group-hover:text-amber-500 group-hover:scale-110 transition-all shadow-inner mx-auto ${mini ? 'w-6 h-6' : 'w-10 h-10'}`}>
            <Zap size={mini ? 12 : 20} className={mini ? '' : 'fill-current opacity-20'} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`font-black text-white/10 ${mini ? 'text-xs' : 'text-xl'}`}>+</span>
            </div>
          </div>
          
          <span className={`font-black uppercase tracking-[0.2em] text-zinc-650 group-hover:text-amber-500/50 transition-colors text-center w-full block ${mini ? 'text-[7px]' : 'text-[10px]'}`}>
            {position || label}
          </span>

          {/* Decorative Corner Accents */}
          <div className="absolute top-1 left-1 w-1 h-1 border-t border-l border-zinc-800" />
          <div className="absolute top-1 right-1 w-1 h-1 border-t border-r border-zinc-800" />
          <div className="absolute bottom-1 left-1 w-1 h-1 border-b border-l border-zinc-800" />
          <div className="absolute bottom-1 right-1 w-1 h-1 border-b border-r border-zinc-800" />
        </button>
      )}
      
      {!card && !disabled && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center shadow-lg animate-bounce z-10 pointer-events-none">
          <span className="text-black font-black text-[10px]">+</span>
        </div>
      )}
    </div>
  );
});

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
  
  // States matching DraftView and original LineupTab
  const [isMobile, setIsMobile] = React.useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [sortMode, setSortMode] = React.useState<'OVR' | 'POS'>('OVR');
  const [selectedPlayerForProgress, setSelectedPlayerForProgress] = React.useState<{ id: string; card: any } | null>(null);
  const [isBenchOpen, setIsBenchOpen] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute roster sorted by OVR or position
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
  }, [userTeam?.roster, sortMode, findCard, state?.playerProgress]);

  // Compute dynamic Team Rating OVR
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
  }, [userTeam?.lineup, findCard, state?.playerProgress]);

  // Lookup active franchise team branding colors
  const teamColors = React.useMemo(() => {
    return NBA_TEAMS.find(t => t.id === state?.userTeamId) || { primaryColor: '#fbbf24', secondaryColor: '#000000' };
  }, [state?.userTeamId]);

  // Map user's reserves / bench to slots
  const benchSlots = React.useMemo(() => {
    const activeBench = (userTeam?.lineup?.bench || []) as string[];
    // Offer at least 7 slots, expanding dynamically if roster exceeds 7 reserves
    const count = Math.max(7, activeBench.length);
    return Array.from({ length: count }).map((_, idx) => {
      const playerId = activeBench[idx];
      const card = playerId ? findCard(playerId) : null;
      return {
        id: `bench-${idx}`,
        playerId,
        card,
        label: idx < 5 ? 'BN' : 'RES',
        position: 'bench'
      };
    });
  }, [userTeam?.lineup?.bench, findCard]);

  return (
    <motion.div 
      key="lineup"
      initial={{ opacity: 0, scale: 0.99 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 0.99 }}
      className="w-full space-y-4 md:space-y-12 pb-16 md:pb-32 px-4 md:px-8 select-none"
    >
        {/* TOP LEVEL TEAM SUMMARY DETAILS */}
        <div className="flex flex-row md:items-end justify-between gap-2 border-b border-white/5 pb-3 md:pb-6">
           <div className="space-y-0.5 md:space-y-1 min-w-0">
              <div className="flex items-center gap-2 md:gap-3">
                 <h3 className="text-sm sm:text-lg md:text-5xl font-black uppercase italic text-white tracking-tighter leading-none truncate">
                   {isMobile ? 'Roster' : 'Roster Management'}
                 </h3>
                 <div 
                   className="text-black px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg font-extrabold text-[9px] sm:text-xs md:text-lg italic tracking-tighter shadow-2xl shrink-0"
                   style={{ 
                     backgroundColor: teamColors.primaryColor,
                     boxShadow: `0 0 25px ${teamColors.primaryColor}40`
                   }}
                 >
                    {teamOvr} OVR
                 </div>
              </div>
              <p className="hidden sm:block text-[9px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest italic truncate max-w-sm">Optimize rotation settings and individual progress pathways</p>
           </div>
           
           <div className="flex items-center gap-3 sm:gap-6 justify-end shrink-0">
              <div className="text-right leading-tight">
                 <p className="text-[6.5px] sm:text-[8px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-0.5 sm:mb-1">Active</p>
                 <p className="text-xs sm:text-base md:text-2xl font-black text-white italic">{(userTeam?.roster || []).length}/15</p>
              </div>
              <div className="text-right leading-tight">
                 <p className="text-[6.5px] sm:text-[8px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-0.5 sm:mb-1">Salary Cap</p>
                 <p className={`text-xs sm:text-base md:text-2xl font-black italic duration-300 ${userTeam?.payroll > 180000000 ? 'text-red-500' : 'text-emerald-400'}`}>
                    ${((userTeam?.payroll || 0) / 1000000).toFixed(1)}M
                 </p>
              </div>
           </div>
        </div>

        {/* INTERACTIVE BASKETBALL ARENA (STARTING FIVE COURT VIEW) */}
        <div className="space-y-2 md:space-y-6">
           <h4 className="text-[10px] md:text-base font-black text-zinc-400 uppercase tracking-[0.2em] italic flex items-center gap-1.5">
              <div className="w-4 h-[1px]" style={{ backgroundColor: teamColors.primaryColor }} />
              Starting Five Tactician
           </h4>
           
           {/* RESPONSIVE COURT CANVAS CONTAINER */}
           <div className="relative w-full aspect-[1.22/1] sm:aspect-[1.4/1] md:aspect-[16/9] min-h-[350px] sm:min-h-[440px] md:min-h-[580px] bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-[2rem] border border-zinc-850 overflow-hidden shadow-2xl z-10 flex flex-col justify-between">
              
              {/* Basketball Half-Court Line Art Overlay (from DraftView) */}
              <div className="absolute inset-0 opacity-[0.12] pointer-events-none z-0">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Outer boundary */}
                  <rect x="0" y="0" width="100" height="100" fill="none" stroke="white" strokeWidth="0.5" />
                  {/* Midcourt line at the top (y=0) */}
                  <line x1="0" y1="0" x2="100" y2="0" stroke="white" strokeWidth="1" />
                  {/* Center Circle at the top (y=0) */}
                  <path d="M 35 0 A 15 15 0 0 0 65 0" fill="none" stroke="white" strokeWidth="0.5" />
                  {/* The Paint / Key at the bottom (x: 34 to 66, y: 64 to 100) */}
                  <rect x="34" y="64" width="32" height="36" fill="none" stroke="white" strokeWidth="0.5" />
                  {/* Free throw circle at top of paint (y=64) */}
                  <path d="M 34 64 A 16 16 0 0 1 66 64" fill="none" stroke="white" strokeWidth="0.5" />
                  {/* Three-Point Arc (basket is at x=50, y=92) */}
                  <line x1="10" y1="100" x2="10" y2="86" stroke="white" strokeWidth="0.5" />
                  <line x1="90" y1="100" x2="90" y2="86" stroke="white" strokeWidth="0.5" />
                  <path d="M 10 86 A 42 42 0 0 1 90 86" fill="none" stroke="white" strokeWidth="0.5" />
                  {/* Backboard: line at y=92, from x=44 to 56 */}
                  <line x1="44" y1="92" x2="56" y2="92" stroke="white" strokeWidth="0.8" />
                  {/* Rim: circle centered at x=50, y=92, with radius 2 */}
                  <circle cx="50" cy="90.5" r="2.5" fill="none" stroke="white" strokeWidth="0.5" />
                </svg>
              </div>

              {/* Dynamic Hologram Team Spotlight Glow */}
              <div 
                className="absolute inset-[15%] rounded-full blur-[160px] opacity-15 pointer-events-none transition-all duration-1000 animate-pulse z-0"
                style={{
                  background: `radial-gradient(circle, ${teamColors.primaryColor} 0%, transparent 70%)`
                }}
              />

              {/* Scifi Holographic Digital Mesh & Coordinate Crosshairs */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.008)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.008)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40 z-0" />
              
              {/* Tactical Starters Coordinates Overlay */}
              <div className="relative z-10 w-full h-full overflow-visible">
                 {[
                    { pos: 'PG', style: { top: '18%', left: '50%' } },
                    { pos: 'SG', style: { top: '38%', left: '78%' } },
                    { pos: 'SF', style: { top: '38%', left: '22%' } },
                    { pos: 'PF', style: { top: '68%', left: '24%' } },
                    { pos: 'C', style: { top: '68%', left: '76%' } }
                 ].map(({ pos, style }) => {
                    const id = userTeam?.lineup?.[pos];
                    const card = findCard(id);
                    return (
                       <div 
                          key={pos} 
                          style={style} 
                          className="absolute w-[22%] sm:w-[18%] md:w-[15%] lg:w-[13%] aspect-[2.5/3.5] -translate-x-1/2 -translate-y-1/2 z-10 hover:z-30 transition-all duration-300"
                       >
                          <Slot 
                             card={card}
                             label={pos}
                             position={pos}
                             onClick={() => {
                               if (card) {
                                 // Clicking opens Inspect dialog
                                 setSelectedPlayerForProgress({ id, card });
                               } else {
                                 setLineupModalPos(pos);
                               }
                             }}
                             onInspect={() => setSelectedPlayerForProgress({ id, card })}
                             onSwap={() => setLineupModalPos(pos)}
                             isSelected={lineupModalPos === pos}
                             teamColor={teamColors.primaryColor}
                          />
                       </div>
                    );
                 })}
              </div>

              {/* FLOATING TEAM RATING BRAND BADGE ON DESKTOP */}
              <div className="hidden lg:flex absolute left-6 top-6 w-44 flex-col gap-3 z-20 bg-zinc-950/85 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-4 shadow-2xl">
                <div className="text-center">
                  <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Active Rating</p>
                  <p className="text-2xl font-black italic mt-1" style={{ color: teamColors.primaryColor }}>
                    {teamOvr} OVR
                  </p>
                </div>
                <div className="w-full h-px bg-white/5" />
                <div className="text-center">
                  <p className="text-[9px] font-black uppercase tracking-tighter text-white italic">TACTICAL BOARD</p>
                  <p className="text-[7px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                    Starting 5 Active
                  </p>
                </div>
                <div className="w-full h-px bg-white/5" />
                <div className="flex flex-col gap-1 text-center">
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Reserves Rotation</p>
                  <p className="text-xs font-bold text-zinc-400">
                    {(userTeam?.lineup?.bench || []).length} / 7 slots
                  </p>
                </div>
              </div>

              {/* UNIFIED BOTTOM SHEET FOR BENCH & RESERVES DRAWER (from DraftView) */}
              <AnimatePresence>
                {isBenchOpen ? (
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                    className="absolute bottom-0 inset-x-0 bg-zinc-950/98 backdrop-blur-xl border-t border-zinc-900/60 rounded-t-3xl shadow-[0_-15px_40px_rgba(0,0,0,0.9)] z-40 flex flex-col px-3 pt-1 pb-2 w-full h-[195px] sm:h-[245px] md:h-[305px] overflow-hidden"
                  >
                    {/* Drawer drag handle */}
                    <div 
                      className="w-10 h-1 bg-zinc-800 hover:bg-zinc-700 rounded-full mx-auto mb-1 cursor-pointer transition-colors shrink-0" 
                      onClick={() => setIsBenchOpen(false)} 
                    />
                    
                    {/* Header inside drawer */}
                    <div className="flex items-center justify-between mb-1.5 shrink-0 px-2 h-3.5 sm:h-5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[6px] sm:text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500">
                          BENCH ROTATION ({(userTeam?.lineup?.bench || []).length}/7 ACTIVE)
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setLineupModalPos('bench')}
                          className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-amber-500 rounded text-[5px] sm:text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer h-4 sm:h-5"
                        >
                          + ADD PLAYER
                        </button>
                        <button
                          onClick={() => setIsBenchOpen(false)}
                          className="px-2 py-0.5 bg-zinc-900 border border-zinc-800/60 hover:bg-zinc-800 text-zinc-550 hover:text-white rounded text-[5px] sm:text-[8px] font-black uppercase tracking-widest transition-colors h-4 sm:h-5"
                        >
                          CLOSE
                        </button>
                      </div>
                    </div>

                    {/* Horizontal scroll track of bench cards */}
                    <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                      <div className="flex items-center gap-3 sm:gap-4 h-full py-0.5 px-1 min-w-max">
                        {benchSlots.map((slot, index) => {
                          const isReserve = index >= 5;
                          return (
                            <div 
                              key={slot.id} 
                              className="flex flex-col items-center shrink-0 w-[85px] sm:w-[110px] md:w-[130px]"
                            >
                              {/* Overlay tag for card label */}
                              <div className="flex items-center justify-center -mb-2 relative z-20 select-none pointer-events-none">
                                <span className={`text-[5px] md:text-[7px] font-black uppercase px-1.5 py-0.5 rounded bg-zinc-950/95 border border-zinc-900/50 tracking-wider leading-none shadow-md ${isReserve ? 'text-zinc-550' : 'text-amber-500/90'}`}>
                                  {isReserve ? `R${index - 4}` : `B${index + 1}`}
                                </span>
                              </div>
                              
                              <div className="w-full aspect-[2.5/3.5]">
                                <Slot 
                                  card={slot.card}
                                  label={isReserve ? `R${index - 4}` : `B${index + 1}`}
                                  position="bench"
                                  onClick={() => {
                                    if (slot.card) {
                                      setSelectedPlayerForProgress({ id: slot.playerId, card: slot.card });
                                    } else {
                                      setLineupModalPos('bench');
                                    }
                                  }}
                                  onInspect={() => setSelectedPlayerForProgress({ id: slot.playerId, card: slot.card })}
                                  onSwap={() => setLineupModalPos('bench')}
                                  isSelected={lineupModalPos === 'bench'}
                                  teamColor={teamColors.primaryColor}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="absolute bottom-0 inset-x-0 z-30 flex justify-center">
                    <motion.button
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      onClick={() => setIsBenchOpen(true)}
                      className="flex items-center justify-center gap-1.5 bg-zinc-950 border-t border-x border-zinc-900 text-zinc-400 hover:text-white px-6 h-8 rounded-t-xl shadow-[0_-4px_12px_rgba(0,0,0,0.5)] font-bold uppercase tracking-widest text-[8px] transition-colors pointer-events-auto active:bg-zinc-900 cursor-pointer"
                    >
                      <ChevronUp size={10} className="animate-bounce text-amber-500" />
                      <span>▲ BENCH & RESERVES ({(userTeam?.lineup?.bench || []).length}/7)</span>
                    </motion.button>
                  </div>
                )}
              </AnimatePresence>
           </div>
        </div>

        {/* DETAILED PLAYER PROGRESS INSPECT MODAL (from DraftView) */}
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

              {/* Dynamic light emission behind card pedestal */}
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] blur-[120px] opacity-20 pointer-events-none rounded-full"
                style={{ backgroundColor: teamColors.primaryColor }}
              />

              <motion.div 
                initial={isMobile ? { y: '100%' } : { scale: 0.94, opacity: 0, y: 30 }} 
                animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1, y: 0 }} 
                exit={isMobile ? { y: '100%' } : { scale: 0.94, opacity: 0, y: 30 }}
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
                className={isMobile 
                  ? "fixed bottom-0 left-0 right-0 max-h-[90vh] rounded-t-[2.5rem] bg-zinc-950 border-t border-white/10 p-5 flex flex-col gap-5 overflow-y-auto z-20 shadow-3xl pb-safe"
                  : "relative w-full max-w-4xl bg-zinc-950/95 border border-white/10 rounded-[2rem] p-6 md:p-10 flex flex-col md:flex-row gap-8 overflow-hidden z-20 shadow-3xl"
                }
              >
                {/* Pull handle for mobile */}
                {isMobile && (
                  <div className="w-12 h-1 bg-zinc-750 rounded-full mx-auto mb-1 shrink-0 opacity-80" />
                )}

                {/* Close Button */}
                <button 
                  onClick={() => setSelectedPlayerForProgress(null)} 
                  className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-full text-zinc-400 hover:text-white transition-colors z-50 cursor-pointer"
                >
                  <X size={16} />
                </button>

                {/* Left side: Premium Card pedestal */}
                <div className="flex flex-col items-center justify-center shrink-0 w-full md:w-80 bg-zinc-950/80 border border-white/5 rounded-[2rem] p-6 relative overflow-hidden group shadow-2xl min-h-[380px]">
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
                    <CardItem card={selectedPlayerForProgress.card} isOwned={true} mode="large" />
                  </div>
                </div>

                {/* Right side: Dynamic Athlete Profile stats and Progress tracker */}
                {(() => {
                  const id = selectedPlayerForProgress.id;
                  const card = selectedPlayerForProgress.card;
                  const progressDetails = state?.playerProgress?.[id] || { age: 24, potential: 82, form: 50 };
                  
                  // Stats Calculations
                  const sNode = state?.stats?.seasonal?.[id];
                  let gp = sNode?.gamesPlayed || 0;
                  let ppg = gp > 0 ? (sNode.points / gp).toFixed(1) : '0.0';
                  let rpg = gp > 0 ? (sNode.rebounds / gp).toFixed(1) : '0.0';
                  let apg = gp > 0 ? (sNode.assists / gp).toFixed(1) : '0.0';

                  const currOvr = progressDetails.ovr || card?.stats?.ovr || 72;
                  const pOvr = progressDetails.potential || card?.stats?.potential || 85;
                  const progressPercent = Math.min(100, Math.max(0, ((currOvr - 60) / (pOvr - 60)) * 100));
                  const isInjured = progressDetails.injuryWeeks && progressDetails.injuryWeeks > 0;
                  const isBenchPlayer = (userTeam?.lineup?.bench || []).includes(id);
                  
                  // Figure out visual label
                  let slotLabel = 'ROSTER';
                  if (isBenchPlayer) {
                    slotLabel = 'BENCH';
                  } else {
                    const starterPos = positions.find(p => userTeam?.lineup?.[p] === id);
                    if (starterPos) slotLabel = starterPos;
                  }

                  return (
                    <div className="flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-1.5 leading-tight">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black uppercase tracking-wider text-amber-500">ATHLETE REPORT</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-700" />
                            <span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest"># {card.nbaId || 'ACTIVE'}</span>
                          </div>
                          <h2 className="text-xl md:text-5xl font-black uppercase italic tracking-tighter text-white">
                            {card.name}
                          </h2>
                          <p className="text-zinc-500 font-extrabold text-[10px] md:text-sm uppercase tracking-widest">
                            {card.position} | Tier {card.tier?.toUpperCase() || card.rarity?.toUpperCase() || 'COMMON'}
                          </p>
                        </div>

                        {/* Health Status Badges */}
                        <div className="flex flex-wrap gap-1.5">
                          {isInjured ? (
                            <div className="px-2.5 py-1 bg-red-950/80 border border-red-500/20 text-red-400 font-black text-[8px] uppercase tracking-wider rounded-lg flex items-center gap-1 leading-none">
                              <Activity size={10} className="animate-pulse" />
                              INJURED: {progressDetails.injuryType || 'Sprained Ankle'} ({progressDetails.injuryWeeks}w left)
                            </div>
                          ) : (
                            <div className="px-2.5 py-1 bg-emerald-950/85 border border-emerald-500/20 text-emerald-400 font-black text-[8px] uppercase tracking-wider rounded-lg flex items-center gap-1 leading-none">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              FULLY FIT & ELIGIBLE
                            </div>
                          )}

                          <div className="px-2.5 py-1 bg-zinc-900 border border-white/5 text-zinc-400 font-black text-[8px] uppercase tracking-wider rounded-lg leading-none">
                            FORM: {progressDetails.form ?? 50}%
                          </div>
                        </div>

                        {/* SHIMMER-SWEEPING DEVELOPMENT PATHWAY TRAIL */}
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
                                <span className="text-[10px] font-normal tracking-wide not-italic px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400">CEILING</span>
                                {pOvr}
                              </h4>
                            </div>
                          </div>

                          {/* Sweeping bar tracker */}
                          <div className="space-y-2 pt-1">
                            <div className="relative h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5 shadow-inner">
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
                                {/* Light sweep shimmer animation */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                              </motion.div>
                            </div>
                            <div className="flex justify-between text-[8px] font-black tracking-widest text-zinc-500 uppercase">
                              <span>BASE (60)</span>
                              <span className="text-amber-500 animate-pulse">DEVELOPING PATHWAY: {Math.round(progressPercent)}%</span>
                              <span>CEILING ({pOvr})</span>
                            </div>
                          </div>
                        </div>

                        {/* STATS AVERAGES FEED */}
                        <div className="space-y-1.5">
                          <p className="text-[8.5px] font-black text-zinc-500 uppercase tracking-widest">SEASON SIMULATION AVERAGES</p>
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

                      {/* Profile Footer (Close and quick Swap) */}
                      <div className="border-t border-white/5 pt-3.5 flex justify-between items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: teamColors.primaryColor }} />
                          <span className="text-[7.5px] font-mono font-bold text-zinc-500 uppercase tracking-widest truncate max-w-[130px]">Dynamic Contract Guard</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isBenchPlayer && (
                            <button 
                              onClick={() => {
                                setSelectedPlayerForProgress(null);
                                userTeam.lineup.bench = userTeam.lineup.bench.filter((bid: string) => bid !== id);
                                setState({ ...state });
                              }}
                              className="px-4 py-2.5 bg-rose-950/80 hover:bg-rose-900 text-rose-400 border border-rose-500/20 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                            >
                              Remove
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setSelectedPlayerForProgress(null);
                              setLineupModalPos(isBenchPlayer ? 'bench' : slotLabel);
                            }}
                            className="px-4 py-2.5 text-black text-[9px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                            style={{ backgroundColor: teamColors.primaryColor }}
                          >
                            Swap Player
                          </button>
                          <button 
                            onClick={() => setSelectedPlayerForProgress(null)}
                            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white border border-white/5 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* GLOWING HIGH-TECH ASSIGNMENT DESKTOP MODAL */}
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
                {/* Mobile drag bar */}
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
                    <p className="text-zinc-550 text-[8px] md:text-xs font-bold uppercase tracking-widest italic flex items-center gap-1.5">
                       <Sparkles size={11} className="text-amber-500 shrink-0" /> SELECT FROM YOUR ACTIVE ROSTER TO ASSIGN
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0">
                     <div className="flex bg-zinc-900 w-fit border border-white/5 p-0.5 rounded-lg">
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
                     <button onClick={() => setLineupModalPos(null)} className="w-9 h-9 md:w-14 md:h-14 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 rounded-full transition-colors border border-white/5 cursor-pointer text-zinc-400">
                       <Plus size={20} className="rotate-45" />
                     </button>
                  </div>
                </div>

                {/* Cards list in Assignment grid */}
                <div className="flex-1 overflow-y-auto pr-1 no-scrollbar">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3 md:gap-6 pb-12">
                     {rosterSorted.map(id => {
                        const card = findCard(id);
                        if (!card) return null;
                        
                        const isPositionMatch = lineupModalPos !== 'bench' && card.position.includes(lineupModalPos!.charAt(0));
                        const isAssigned = lineupModalPos !== 'bench' 
                          ? (userTeam?.lineup?.[lineupModalPos!] === id)
                          : (userTeam?.lineup?.bench || []).includes(id);

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
