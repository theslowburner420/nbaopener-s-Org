import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Sparkles, Activity, TrendingUp, Building, History, X } from 'lucide-react';

interface OfficeTabProps {
  state: any;
  userTeam: any;
  findCard: (id: string, season?: number) => any;
  handleNegotiationStart: (playerId: string) => void;
  setState: (state: any) => void;
}

const OfficeTab: React.FC<OfficeTabProps> = React.memo(({ 
  state, 
  userTeam,
  findCard,
  handleNegotiationStart,
  setState
}) => {
  const [subTab, setSubTab] = React.useState<'legacy' | 'contracts'>('legacy');

  const marketService = {
      releasePlayer: (state: any, id: string) => {
          // Internal release logic 
      }
  };

  return (
    <motion.div 
      key="office"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="max-w-7xl mx-auto space-y-8 pb-20 px-4 md:px-0"
    >
       {/* MOBILE SUB-NAV */}
       <div className="flex bg-zinc-900/50 p-1 rounded-xl md:w-fit mx-auto border border-white/5">
         {[
           { id: 'legacy', label: 'Legacy & Vault', icon: <Trophy size={14} /> },
           { id: 'contracts', label: 'Contracts & Finance', icon: <Building size={14} /> }
         ].map((t) => (
           <button
             key={t.id}
             onClick={() => setSubTab(t.id as any)}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all
               ${subTab === t.id ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}
             `}
           >
             {t.icon}
             {t.label}
           </button>
         ))}
       </div>

       {subTab === 'legacy' ? (
         <div className="space-y-12">
            {/* TROPHY CASE */}
            <div className="space-y-8 relative">
               <div className="flex items-center justify-between px-2">
                  <div className="space-y-1">
                     <h3 className="text-xl md:text-4xl font-black italic uppercase tracking-tighter text-white">The Vault</h3>
                     <p className="text-[9px] md:text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none">Your Franchise Legacy</p>
                  </div>
                  <Trophy className="text-amber-500/20 md:w-12 md:h-12" size={32} />
               </div>

               <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 font-sans">
                  {[
                    { type: 'CHAMP', label: 'Rings', icon: <Trophy size={20} />, color: 'bg-amber-500', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]' },
                    { type: 'MVP', label: 'MVPs', icon: <Sparkles size={20} />, color: 'bg-white', glow: 'shadow-[0_0_30px_rgba(255,255,255,0.2)]' },
                    { type: 'DPOY', label: 'Best Defense', icon: <Activity size={20} />, color: 'bg-zinc-700', glow: 'shadow-[0_0_30px_rgba(63,63,70,0.2)]' },
                    { type: 'RECORD', label: 'High Scores', icon: <TrendingUp size={20} />, color: 'bg-zinc-900', glow: '' }
                  ].map((t) => {
                    const achievements = (state.trophyCase || []).filter((item: any) => item.type === t.type);
                    return (
                      <div key={t.label} className="group relative bg-zinc-900/50 border border-white/5 rounded-2xl md:rounded-[2.5rem] p-4 md:p-8 flex flex-col items-center justify-center gap-2 md:gap-4 hover:bg-white/[0.03] transition-all overflow-hidden border-t-white/10">
                        <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-black mb-1 md:mb-2 transition-transform group-hover:scale-110 group-hover:rotate-3 ${t.color} ${t.glow}`}>
                            {t.icon}
                        </div>
                        <div className="text-center">
                            <p className="text-[7px] md:text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-0.5 md:mb-1">{t.label}</p>
                            <p className="text-xl md:text-4xl font-black text-white italic tabular-nums leading-none">{achievements.length}</p>
                        </div>
                      </div>
                    );
                  })}
               </div>

               {state.trophyCase.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {state.trophyCase.slice().reverse().map((award: any, i: number) => {
                        const player = award.playerId ? findCard(award.playerId) : null;
                        return (
                          <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            key={`${award.type}-${award.season}-${i}`}
                            className="flex items-center gap-4 bg-zinc-900/30 border border-white/5 p-4 rounded-2xl md:rounded-3xl hover:border-white/20 transition-all group"
                          >
                              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 ${award.type === 'CHAMP' ? 'bg-amber-500 text-black' : 'bg-white/10 text-white'}`}>
                                <Trophy size={16} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[9px] font-black text-amber-500 italic uppercase">Season {award.season}</span>
                                    <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">• {award.type}</span>
                                </div>
                                <h4 className="text-[11px] md:text-sm font-black text-white uppercase italic truncate">
                                    {award.type === 'CHAMP' ? 'World Champions' : player?.name || award.label || 'Major Award'}
                                </h4>
                              </div>
                          </motion.div>
                        );
                    })}
                 </div>
               ) : (
                 <div className="bg-zinc-900 border border-dashed border-white/10 rounded-2xl md:rounded-[3rem] p-8 md:p-16 text-center space-y-3 md:space-y-4">
                    <Trophy className="text-zinc-800 mx-auto md:w-16 md:h-16" size={48} />
                    <div className="space-y-1">
                        <p className="text-lg md:text-xl font-black text-zinc-700 uppercase italic tracking-tighter">Empty Vault</p>
                        <p className="text-[8px] md:text-[9px] font-black text-zinc-800 uppercase tracking-[0.3em] max-w-[200px] mx-auto">Build your dynasty to claim your first trophy</p>
                    </div>
                 </div>
               )}
            </div>

            {/* TEAM HISTORY */}
            <div className="space-y-6">
               <div className="flex items-center justify-between px-2 text-sans">
                  <div className="space-y-1">
                     <h3 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-white">Season History</h3>
                     <p className="text-[8px] md:text-[10px] font-black text-zinc-600 uppercase tracking-widest">Year-by-Year Performance</p>
                  </div>
               </div>
               <div className="bg-zinc-900/50 border border-white/5 rounded-2xl md:rounded-3xl overflow-hidden">
                  <table className="w-full text-[10px] md:text-sm text-left">
                     <thead>
                        <tr className="border-b border-white/5 bg-black/40">
                           <th className="px-4 py-3 md:px-6 md:py-4 font-black uppercase text-zinc-600 tracking-widest">Year</th>
                           <th className="px-4 py-3 md:px-6 md:py-4 font-black uppercase text-zinc-600 tracking-widest">Result</th>
                           <th className="px-4 py-3 md:px-6 md:py-4 font-black uppercase text-zinc-600 tracking-widest">Champion</th>
                           <th className="px-4 py-3 md:px-6 md:py-4 font-black uppercase text-zinc-600 tracking-widest text-right">Awards</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {state.teamHistory.slice().reverse().map((h: any) => (
                           <tr key={h.season} className="hover:bg-white/5 transition-colors">
                              <td className="px-4 py-3 md:px-6 md:py-4 font-black text-amber-500 italic">#{h.season}</td>
                              <td className="px-4 py-3 md:px-6 md:py-4 font-black text-white">{h.record}</td>
                              <td className="px-4 py-3 md:px-6 md:py-4 text-zinc-400 font-medium">{h.champion}</td>
                              <td className="px-4 py-3 md:px-6 md:py-4 text-right">
                                 <div className="flex justify-end gap-1">
                                    {h.awards.map((a: string, idx: number) => (
                                       <span key={idx} className="w-4 h-4 md:w-5 md:h-5 bg-white/10 rounded flex items-center justify-center text-[8px] md:text-[10px] font-black text-white" title={a}>{a[0]}</span>
                                    ))}
                                 </div>
                              </td>
                           </tr>
                        ))}
                        {state.teamHistory.length === 0 && (
                           <tr>
                              <td colSpan={4} className="px-6 py-12 text-center text-zinc-600 italic font-medium uppercase tracking-widest text-xs">No season history recorded yet</td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
       ) : (
         <div className="space-y-12">
            {/* FINANCE & ASSETS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
               <div className="bg-zinc-900 border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-10 space-y-4 md:space-y-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="flex items-center justify-between relative z-10">
                    <div className="space-y-1">
                      <h3 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter text-white">Salary Cap</h3>
                      <p className="text-[10px] md:text-xs font-bold text-zinc-600 uppercase tracking-widest italic leading-none">Fiscal Management • Season {state.season}</p>
                    </div>
                    <Building size={24} className="text-zinc-800" />
                  </div>

                  <div className="space-y-3 md:space-y-6 relative z-10">
                     <div className="grid grid-cols-3 gap-2">
                       <div className="space-y-0.5">
                         <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Payroll</p>
                         <p className="text-sm md:text-xl font-black text-white italic tracking-tighter leading-none">${(userTeam.payroll / 1000000).toFixed(1)}M</p>
                       </div>
                       <div className="space-y-0.5 border-x border-white/5 px-2">
                         <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Cap Limit</p>
                         <p className="text-sm md:text-xl font-black text-zinc-500 italic tracking-tighter leading-none">$136.0M</p>
                       </div>
                       <div className="space-y-0.5 text-right">
                         <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Space</p>
                         <p className={`text-sm md:text-xl font-black italic tracking-tighter leading-none ${userTeam.payroll > 136000000 ? 'text-red-500' : 'text-green-500'}`}>
                           ${((136000000 - userTeam.payroll) / 1000000).toFixed(1)}M
                         </p>
                       </div>
                     </div>
                     
                     <div className="space-y-2">
                        <div className="h-1.5 md:h-3 bg-black rounded-full overflow-hidden border border-white/5 p-0.5 shadow-inner">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${Math.min((userTeam.payroll / 136000000) * 100, 100)}%` }}
                             className={`h-full rounded-full transition-all duration-1000 ${userTeam.payroll > 136000000 ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-amber-600 to-amber-400'}`}
                           />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[7px] md:text-[9px] font-black text-zinc-800 uppercase tracking-[0.2em]">Usage Percentage</span>
                          <span className="text-[7px] md:text-[9px] font-black text-amber-500 uppercase tracking-[0.2em]">{((userTeam.payroll / 136000000) * 100).toFixed(1)}%</span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="bg-zinc-900 border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-10 space-y-4 md:space-y-8 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-500/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="flex items-center justify-between relative z-10">
                    <div className="space-y-1">
                      <h3 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter text-white">Asset Control</h3>
                      <p className="text-[10px] md:text-xs font-bold text-zinc-600 uppercase tracking-widest italic leading-none">Draft Capital • Trade Rights</p>
                    </div>
                    <History size={24} className="text-zinc-800" />
                  </div>

                  <div className="flex flex-wrap gap-2 md:gap-3 relative z-10">
                     {userTeam.draftPicks.slice(0, 10).map((p: any) => (
                        <div key={p.id} className="px-3 md:px-5 py-2 md:py-3 bg-black/40 border border-white/5 rounded-xl md:rounded-2xl flex flex-col items-start gap-0.5 hover:border-amber-500/30 transition-all cursor-default">
                           <span className="text-[8px] md:text-[10px] font-black text-zinc-600 uppercase leading-none">{p.year} {p.round === 1 ? '1ST' : '2ND'}</span>
                           <span className="text-[10px] md:text-sm font-black text-white italic tracking-tighter leading-none">{p.originalOwnerId}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* PAYROLL REGISTRY */}
            <div className="space-y-6 md:space-y-8">
               <div className="flex items-center justify-between px-2">
                  <div className="space-y-1">
                     <h3 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter text-white">Payroll Registry</h3>
                     <p className="text-[8px] md:text-[10px] font-black text-zinc-600 uppercase tracking-widest">Active Roster Agreements</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 gap-3 md:gap-4">
                  {userTeam.roster.sort((a: string, b: string) => (userTeam.contracts[b]?.salary || 0) - (userTeam.contracts[a]?.salary || 0)).map((id: string) => {
                     const card = findCard(id);
                     const contract = userTeam.contracts[id];
                     if (!card || !contract) return null;
                     const isExpiring = contract.yearsRemaining === 1;

                     return (
                        <div key={id} className="bg-zinc-900/40 border border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 hover:bg-white/[0.03] transition-all relative overflow-hidden group">
                           {isExpiring && <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />}
                           
                           <div className="flex items-center gap-4 md:gap-6 flex-1">
                              <div className="relative shrink-0">
                                 <div className="w-14 h-14 md:w-20 md:h-20 rounded-xl md:rounded-2xl bg-black border border-white/10 overflow-hidden shadow-2xl relative">
                                    <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card.nbaId}.png`} className="w-full h-full object-contain" />
                                 </div>
                                 <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 md:w-9 md:h-9 bg-white rounded-lg flex items-center justify-center text-[10px] md:text-sm font-black text-black italic shadow-2xl border-2 border-zinc-900">{card.stats.ovr}</div>
                              </div>

                              <div className="space-y-0.5 md:space-y-1 flex-1 min-w-0">
                                 <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                    <span className="text-[8px] md:text-[10px] font-black bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded uppercase">{card.position}</span>
                                     <div className={`text-[8px] md:text-[10px] font-black px-1.5 py-0.5 rounded border uppercase tracking-widest italic flex items-center gap-1.5
                                        ${contract.contractType === 'max' || contract.contractType === 'supermax' ? 'border-amber-500 text-amber-500 bg-amber-500/5' : 
                                          contract.contractType === 'mid' ? 'border-blue-500 text-blue-500 bg-blue-500/5' :
                                          contract.contractType === 'rookie' ? 'border-emerald-500 text-emerald-500 bg-emerald-500/5' :
                                          contract.contractType === 'two-way' ? 'border-purple-500 text-purple-500 bg-purple-500/5' :
                                          'border-zinc-700 text-zinc-600'}
                                     `}>
                                        {contract.contractType?.toUpperCase() || 'VETERAN'} 
                                        {contract.contractType === 'supermax' && <Sparkles size={8} />}
                                     </div>
                                 </div>
                                 <h4 className="text-sm md:text-xl font-black text-white uppercase italic tracking-tighter truncate leading-none group-hover:text-amber-500 transition-colors">{card.name}</h4>
                                 <div className="flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[7px] md:text-[9px] font-black text-zinc-500 uppercase tracking-widest">{card.age || 25} YRS</span>
                                 </div>
                              </div>
                           </div>

                           <div className="flex items-center justify-between md:flex-col md:items-end gap-2 md:gap-3 border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                              <div className="text-left md:text-right">
                                 <p className="text-base md:text-2xl font-black text-white italic tracking-tighter leading-none">${(contract.salary/1e6).toFixed(1)}<span className="text-[10px] md:text-sm ml-0.5">M</span></p>
                                 <div className="flex items-center gap-1.5 mt-0.5 justify-start md:justify-end">
                                    <div className={`w-1 h-1 rounded-full ${contract.yearsRemaining <= 2 ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
                                     <p className={`text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] ${contract.yearsRemaining <= 2 ? 'text-amber-500' : 'text-zinc-600'}`}>
                                        {contract.yearsRemaining}Y Left
                                     </p>
                                 </div>
                              </div>

                              <div className="flex gap-2">
                                 <button 
                                   onClick={() => {
                                     if (confirm(`Release ${card.name}?`)) {
                                       // Release logic here or in rosterService
                                       const newState = { ...state };
                                       const team = newState.teams[state.userTeamId];
                                       team.roster = team.roster.filter((rid: string) => rid !== id);
                                       delete team.contracts[id];
                                       newState.freeAgentPool.push(id);
                                       setState(newState);
                                     }
                                   }}
                                   className="h-8 w-8 md:h-10 md:w-10 flex items-center justify-center bg-zinc-800 hover:bg-red-500 group/trash rounded-xl transition-all"
                                 >
                                   <X size={14} className="group-hover:text-white" />
                                 </button>
                                  {contract.canExtend && (
                                    <button 
                                      onClick={() => handleNegotiationStart(id)}
                                      className="px-4 py-2 md:px-5 md:py-2.5 bg-amber-500 text-black text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-400 transition-all shadow-lg active:scale-95"
                                    >
                                      Extend
                                    </button>
                                  )}
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

export default OfficeTab;
