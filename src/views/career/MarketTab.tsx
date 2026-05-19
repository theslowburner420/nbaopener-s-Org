import React from 'react';
import { motion } from 'motion/react';
import { Lock } from 'lucide-react';
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
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="max-w-7xl mx-auto space-y-6 md:space-y-12 pb-20 px-3"
    >
      {/* MARKET HEADER */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl flex flex-col justify-center">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Market Environment</p>
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{state.phase === 'free_agency' ? 'OFFSEASON FA' : `WEEK ${state.week} MARKET`}</h3>
          </div>
          
          <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Available Cap Space</p>
            <div className="flex items-baseline gap-2">
               <h3 className={`text-3xl font-black italic tracking-tighter ${capSpace > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ${(capSpace / 1000000).toFixed(1)}M
               </h3>
               <span className="text-[8px] font-black text-zinc-700 uppercase">of $136M Limit</span>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-3xl flex flex-col justify-center">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Talent Pool</p>
            <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{(state.freeAgentPool || []).length} Free Agents</h3>
          </div>

          {state.phase === 'free_agency' && (
             <div className="flex flex-col justify-center">
                <button 
                  onClick={() => onFinalizeMarket?.()}
                  className="w-full h-full bg-white text-black rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-amber-500 transition-all shadow-2xl active:scale-95"
                >
                  Finalize Roster
                </button>
             </div>
          )}
      </div>

      {state.season === 2025 && state.week < 5 ? (
        <div className="bg-zinc-900 border border-white/5 rounded-2xl md:rounded-[3rem] p-6 md:p-20 text-center space-y-4 md:space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-zinc-500/5 blur-[80px] rounded-full" />
            <div className="relative z-10 space-y-4 md:space-y-6">
              <div className="w-12 h-12 md:w-20 md:h-20 bg-zinc-900 border border-white/10 rounded-2xl flex items-center justify-center text-zinc-500 mx-auto">
                  <Lock size={24} className="md:w-10 md:h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg md:text-3xl font-black uppercase italic tracking-tighter">Market Warming Up</h3>
                <p className="text-zinc-600 text-[8px] md:text-sm max-w-[200px] md:max-w-md mx-auto leading-tight font-black uppercase tracking-tighter">
                  The free agency market opens fully after Week 5
                </p>
              </div>
            </div>
        </div>
      ) : (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] md:text-sm font-black uppercase italic text-zinc-500 tracking-[0.2em]">Available Talents</h3>
              <p className="text-[8px] md:text-[10px] font-black text-zinc-700 uppercase">Top 50 Prospects</p>
            </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {(state.freeAgentPool || []).slice(0, 50).map((id: string, i: number) => {
              const card = findCard(id);
              if (!card) return null;
              const demand = marketService.calculateMarketDemand(state, id);
              return (
                <motion.div 
                  key={id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (i % 10) * 0.05 }}
                  className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-5 md:p-6 flex items-center justify-between group hover:bg-white/[0.04] hover:border-white/20 transition-all relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 blur-2xl rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex items-center gap-4 md:gap-5 relative z-10">
                      <div className="relative shrink-0">
                          <div className="w-14 h-14 md:w-20 md:h-20 rounded-2xl bg-black overflow-hidden border border-white/10 shadow-xl">
                             <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card.nbaId}.png`} className="w-full h-full object-contain scale-110 group-hover:scale-125 transition-transform duration-500" />
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-lg flex items-center justify-center text-[10px] font-black text-black italic shadow-2xl border-2 border-zinc-900">{card.stats.ovr}</div>
                      </div>
                      <div className="space-y-1 md:space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                             <span className="text-[7px] md:text-[8px] font-black text-black bg-amber-500 px-1.5 py-0.5 rounded uppercase tracking-tighter italic">{card.position}</span>
                             <span className="text-[7px] md:text-[8px] font-black text-zinc-600 uppercase tracking-widest">{card.age}Y</span>
                          </div>
                          <h4 className="text-sm md:text-xl font-black text-white uppercase italic tracking-tighter truncate leading-none group-hover:text-amber-500 transition-colors">{card.name}</h4>
                          <p className="text-[10px] md:text-base font-black text-zinc-400 italic leading-none">${(demand.salary/1e6).toFixed(1)} <span className="text-[8px] md:text-[10px] text-zinc-600">Million</span></p>
                      </div>
                    </div>
                    <button 
                      onClick={() => onSignPlayer(id)}
                      className="relative z-10 px-5 md:px-7 py-3 md:py-4 bg-white text-black text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-amber-500 transition-all shadow-xl active:scale-95 shrink-0"
                    >
                      Sign
                    </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
});

export default MarketTab;
