import React from 'react';
import { motion } from 'motion/react';
import { Lock, Search, Sparkles } from 'lucide-react';
import { marketService } from '../../franchise/services/marketService';

interface MarketTabProps {
  state: any;
  onSignPlayer: (playerId: string) => void;
  findCard: (id: string, season?: number) => any;
  onFinalizeMarket?: () => void;
}

const MarketTab: React.FC<MarketTabProps> = React.memo(({ 
  state, 
  onSignPlayer,
  findCard,
  onFinalizeMarket
}) => {
  const userTeam = state.teams[state.userTeamId];
  const capSpace = 136000000 - userTeam.payroll;

  return (
    <motion.div 
      key="market"
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -15 }}
      className="w-full space-y-4 md:space-y-10 pb-20 px-4 md:px-8 select-none"
    >
      {/* MARKET HEADER */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-zinc-950 border border-white/5 p-4 rounded-xl md:rounded-2xl flex flex-col justify-center">
            <p className="text-[7.5px] font-bold text-zinc-500 uppercase tracking-widest mb-1 leading-none">Market Environment</p>
            <h3 className="text-xs md:text-xl font-black text-white italic uppercase tracking-tighter leading-none mt-1">
              {state.phase === 'free_agency' ? 'OFFSEASON CONTRACTS' : `WEEK ${state.week} MARKET`}
            </h3>
          </div>
          
          <div className="bg-zinc-950 border border-white/5 p-4 rounded-xl md:rounded-2xl flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-2xl rounded-full" />
            <p className="text-[7.5px] font-bold text-zinc-500 uppercase tracking-widest mb-1 leading-none">Cap Space Room</p>
            <div className="flex items-baseline gap-1.5 leading-none mt-1">
               <h3 className={`text-sm md:text-2xl font-black italic tracking-tighter leading-none ${capSpace > 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                  ${(capSpace / 1000000).toFixed(1)}M
               </h3>
               <span className="text-[6.5px] md:text-[7.5px] font-black text-zinc-650 uppercase hidden sm:inline">Limit $136M</span>
            </div>
          </div>

          <div className="bg-zinc-950 border border-white/5 p-4 rounded-xl md:rounded-2xl flex flex-col justify-center">
            <p className="text-[7.5px] font-bold text-zinc-500 uppercase tracking-widest mb-1 leading-none">Available Pool</p>
            <h3 className="text-xs md:text-xl font-black text-white italic uppercase tracking-tighter leading-none mt-1">
              {(state.freeAgentPool || []).length} Agents Listed
            </h3>
          </div>

          {state.phase === 'free_agency' && (
             <div className="flex flex-col justify-center">
                <button 
                  onClick={() => onFinalizeMarket?.()}
                  className="w-full h-11 md:h-full bg-white text-black rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-xs hover:bg-amber-500 transition-all duration-300 shadow-2xl active:scale-97 cursor-pointer"
                >
                  Lock FA Roster
                </button>
             </div>
          )}
      </div>

      {state.season === 2025 && state.week < 5 ? (
        <div className="bg-zinc-950 border border-white/5 rounded-[1.5rem] md:rounded-[2rem] p-10 md:p-24 text-center space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-zinc-500/5 blur-[80px] rounded-full animate-pulse" />
            <div className="relative z-10 space-y-4">
              <div className="w-10 h-10 bg-zinc-900 border border-white/10 rounded-xl flex items-center justify-center text-zinc-500 mx-auto">
                  <Lock size={16} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm md:text-2xl font-black uppercase italic tracking-tighter text-white">Market Cooling Off</h3>
                <p className="text-zinc-500 text-[8px] md:text-xs max-w-sm mx-auto uppercase tracking-wider leading-relaxed">
                  The executive free agent market opens globally after completion of Week 5
                </p>
              </div>
            </div>
        </div>
      ) : (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[9px] md:text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 italic">OFFSHORE FREE AGENT REGISTRY</h3>
              <p className="text-[8px] md:text-[8.5px] font-black text-zinc-650 uppercase">TOP PROSPECTS ON DECK</p>
            </div>

            {/* HIGH-FIDELITY COMPACT TABLE VIEW WITH CARD CONVERSION FOR MOBILE */}
            <div className="bg-zinc-950 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
              {/* Desktop view */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-zinc-950 text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                      <th className="py-4 px-6 md:px-8">Athlete Profile</th>
                      <th className="py-4 px-4 text-center">OVR</th>
                      <th className="py-4 px-4 min-w-[70px]">Position</th>
                      <th className="py-4 px-4">Age</th>
                      <th className="py-4 px-4 text-right">Requested Wage</th>
                      <th className="py-4 px-6 md:px-8 text-right">Action Desk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(state.freeAgentPool || []).slice(0, 50).map((id: string, i: number) => {
                      const card = findCard(id);
                      if (!card) return null;
                      const demand = marketService.calculateMarketDemand(state, id);
                      
                      const isSuperstar = card.stats.ovr >= 85 || card.tier?.toLowerCase() === 'legend' || card.tier?.toLowerCase() === 'superstar';

                      return (
                        <tr 
                          key={id} 
                          className={`border-b border-white/5 group hover:bg-white/[0.02] transition-colors duration-200 relative ${
                            isSuperstar 
                              ? 'bg-amber-500/[0.015] border-l-2 border-l-amber-500 shadow-[inset_1px_0_0_rgba(245,158,11,0.05)]' 
                              : ''
                          }`}
                        >
                          {/* Profile */}
                          <td className="py-3 px-6 md:px-8 flex items-center gap-4">
                            <div className="relative shrink-0 w-11 h-11 pointer-events-none">
                              <div className="w-full h-full rounded-xl bg-zinc-900 overflow-hidden border border-white/10 group-hover:border-white/20 transition-all">
                                <img 
                                  src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card.nbaId}.png`} 
                                  className="w-full h-full object-contain scale-110 origin-bottom" 
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            </div>
                            <div className="leading-tight shrink-0 min-w-0">
                              <span className="text-[6.5px] font-bold px-1.5 py-0.2 bg-zinc-900 text-zinc-400 rounded-sm uppercase tracking-widest">
                                {card.tier?.toUpperCase() || 'COMMON'}
                              </span>
                              <h4 className="text-sm font-black text-white italic uppercase truncate w-36 md:w-56 mt-1 group-hover:text-amber-400 transition-colors">
                                {card.name}
                              </h4>
                            </div>
                          </td>

                          {/* OVR */}
                          <td className="py-3 px-4 text-center">
                            <span className={`inline-flex items-center justify-center font-mono font-black text-xs md:text-sm italic rounded-lg w-8 h-8 ${
                              isSuperstar ? 'text-amber-500 bg-amber-500/10' : 'text-zinc-200 bg-zinc-900 border border-white/5'
                            }`}>
                              {card.stats.ovr}
                            </span>
                          </td>

                          {/* Position */}
                          <td className="py-3 px-4">
                            <span className="text-[8px] md:text-[9px] font-black text-zinc-100 bg-zinc-900 border border-white/5 px-2.5 py-1 rounded-md uppercase italic skew-x-[-8deg]">
                              {card.position}
                            </span>
                          </td>

                          {/* Age */}
                          <td className="py-3 px-4">
                            <span className="text-xs font-bold text-zinc-400 font-mono italic">
                              {card.age} Yrs
                            </span>
                          </td>

                          {/* Requested Wage */}
                          <td className="py-3 px-4 text-right">
                            <div className="leading-none text-right">
                              <span className="text-sm font-black text-white font-mono italic">
                                ${(demand.salary/1e6).toFixed(1)}M
                              </span>
                              <p className="text-[7px] text-zinc-550 uppercase tracking-widest mt-1 font-bold">PER SEASON</p>
                            </div>
                          </td>

                          {/* Action sign */}
                          <td className="py-3 px-6 md:px-8 text-right">
                            <button 
                              onClick={() => {
                                onSignPlayer(id);
                              }}
                              className="px-5 py-2.5 bg-white text-black hover:bg-amber-500 hover:text-black hover:shadow-[0_4px_15px_rgba(245,158,11,0.25)] text-[9px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 active:scale-95 cursor-pointer"
                            >
                              Sign Offer
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Free Agent Cards List */}
              <div className="block md:hidden divide-y divide-white/5 max-h-[75vh] overflow-y-auto no-scrollbar">
                {(state.freeAgentPool || []).slice(0, 50).map((id: string, i: number) => {
                  const card = findCard(id);
                  if (!card) return null;
                  const demand = marketService.calculateMarketDemand(state, id);
                  
                  const isSuperstar = card.stats.ovr >= 85 || card.tier?.toLowerCase() === 'legend' || card.tier?.toLowerCase() === 'superstar';

                  return (
                    <div 
                      key={id} 
                      className={`p-4 flex flex-col gap-3.5 transition-colors ${
                        isSuperstar ? 'bg-amber-500/10' : 'bg-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative shrink-0 w-10 h-10 pointer-events-none">
                            <div className="w-full h-full rounded-xl bg-zinc-900 border border-white/10 overflow-hidden relative p-0.5">
                              <img 
                                src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card.nbaId}.png`} 
                                className="w-full h-full object-contain scale-110 origin-bottom" 
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            </div>
                          </div>
                          <div className="truncate min-w-0 leading-tight">
                            <span className="text-[6.5px] font-bold px-1 py-0.2 bg-zinc-900 text-zinc-400 rounded-sm uppercase tracking-widest leading-none">
                              {card.tier?.toUpperCase() || 'COMMON'}
                            </span>
                            <h4 className="text-xs font-black text-white italic truncate uppercase mt-1 leading-none">
                              {card.name}
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`inline-flex items-center justify-center font-mono font-black text-xs italic rounded-lg w-8 h-8 ${
                            isSuperstar ? 'text-amber-450 bg-amber-505/10' : 'text-zinc-200 bg-zinc-950 border border-white/5'
                          }`}>
                            {card.stats.ovr}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center border-t border-white/5 pt-2.5">
                        <div className="flex flex-wrap gap-1">
                          <span className="text-[7.5px] font-black text-zinc-100 bg-zinc-900 border border-white/5 px-2 py-0.5 rounded uppercase italic shrink-0">
                            {card.position}
                          </span>
                          <span className="text-[7.5px] font-black text-zinc-400 bg-zinc-900 border border-white/5 px-2 py-0.5 rounded uppercase italic shrink-0">
                            {card.age} Yrs
                          </span>
                        </div>
                        
                        <div className="text-right flex items-center gap-3 shrink-0">
                          <div className="leading-tight text-right shrink-0">
                            <span className="text-sm font-black text-white font-mono italic">
                              ${(demand.salary/1e6).toFixed(1)}M
                            </span>
                            <p className="text-[5.5px] text-zinc-650 font-black uppercase tracking-widest mt-0.5">PER SEASON</p>
                          </div>
                          
                          <button 
                            onClick={() => {
                              onSignPlayer(id);
                            }}
                            className="h-10 px-4 bg-white text-black text-[9px] font-black uppercase tracking-wider rounded-lg active:scale-95 transition-all cursor-pointer shadow-xl shrink-0"
                          >
                            Sign
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
        </div>
      )}
    </motion.div>
  );
});

export default MarketTab;
