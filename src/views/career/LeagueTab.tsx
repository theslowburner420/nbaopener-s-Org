import React from 'react';
import { motion } from 'motion/react';
import { getTeamLogo } from '../../data/nbaTeams';
import { TeamObject } from '../../franchise/types';

interface LeagueTabProps {
  state: any;
}

const LeagueTab: React.FC<LeagueTabProps> = React.memo(({ state }) => {
  return (
    <motion.div 
      key="league"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto space-y-6 md:space-y-12 px-3 pb-20"
    >
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            {/* CONFERENCE STANDINGS */}
            {['East', 'West'].map(conf => (
              <div key={conf} className="space-y-4 md:space-y-6">
                 <div className="flex items-center justify-between border-b border-white/5 pb-2 px-1">
                    <h3 className="text-xl md:text-3xl font-black uppercase italic text-white tracking-tighter">{conf}</h3>
                    <span className="text-[9px] md:text-sm font-bold text-zinc-600 uppercase tracking-widest italic">Regular Season</span>
                 </div>
                 <div className="bg-zinc-900 border border-white/5 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl">
                     <table className="w-full text-left border-collapse">
                        <thead className="bg-white/5 border-b border-white/5">
                           <tr className="text-[8px] md:text-xs font-black text-zinc-600 uppercase tracking-[0.2em]">
                              <th className="px-4 md:px-8 py-3 md:py-6">TEAM</th>
                              <th className="px-2 md:px-4 py-3 md:py-6 text-center">W</th>
                              <th className="px-2 md:px-4 py-3 md:py-6 text-center">L</th>
                              <th className="px-2 md:px-4 py-3 md:py-6 text-right tabular-nums">PCT</th>
                           </tr>
                        </thead>
                        <tbody>
                           {(Object.values(state.teams) as TeamObject[])
                             .filter(t => t.conference === conf)
                             .sort((a, b) => b.wins - a.wins || a.losses - b.losses)
                             .map((team, i) => {
                                return (
                                  <tr key={team.teamId} className={`border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors ${team.isHuman ? 'bg-amber-500/5' : ''}`}>
                                     <td className="px-4 md:px-8 py-2 md:py-5">
                                        <div className="flex items-center gap-3 md:gap-6">
                                           <span className="text-[10px] md:text-sm font-black text-zinc-800 w-4 italic">{i+1}</span>
                                           <div className="w-6 h-6 md:w-10 md:h-10 bg-black/40 rounded-lg p-1 border border-white/5 flex items-center justify-center">
                                             <img src={getTeamLogo(team.teamId)} className="w-full h-full object-contain" />
                                           </div>
                                           <div className="flex flex-col">
                                              <span className={`text-[11px] md:text-xl font-black uppercase italic tracking-tighter ${team.isHuman ? 'text-amber-500' : 'text-white'}`}>{team.abbreviation}</span>
                                              <span className="text-[8px] md:text-[10px] font-bold text-zinc-600 uppercase tracking-widest hidden md:block">{team.name}</span>
                                           </div>
                                        </div>
                                     </td>
                                     <td className="px-2 md:px-4 py-2 md:py-5 text-center text-sm md:text-2xl font-black text-white italic tabular-nums leading-none tracking-tighter">{team.wins}</td>
                                     <td className="px-2 md:px-4 py-2 md:py-5 text-center text-sm md:text-2xl font-black text-zinc-700 italic tabular-nums leading-none tracking-tighter">{team.losses}</td>
                                     <td className="px-2 md:px-4 py-2 md:py-5 text-right text-[10px] md:text-sm font-mono text-zinc-500 tabular-nums">
                                       .{((team.wins / Math.max(1, (team.wins+team.losses))) * 1000).toFixed(0).padStart(3, '0')}
                                     </td>
                                  </tr>
                                );
                             })}
                        </tbody>
                     </table>
                 </div>
              </div>
            ))}
       </div>
    </motion.div>
  );
});

export default LeagueTab;
