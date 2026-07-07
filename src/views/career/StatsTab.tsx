import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Award, Calendar, BarChart2, Star, Target } from 'lucide-react';
import { getTeamLogo } from '../../data/nbaTeams';
import { PlayerStats } from '../../franchise/types';
import { PlayerHeadshot } from '../../components/PlayerHeadshot';

interface StatsTabProps {
  state: any;
  userTeam: any;
  findCard: (id: string, season?: number) => any;
}

const StatsTab: React.FC<StatsTabProps> = React.memo(({ 
  state, 
  userTeam,
  findCard
}) => {
  const [statsSubTab, setStatsSubTab] = React.useState<'League' | 'Highs' | 'Team'>('League');
  const [activeStatsCat, setActiveStatsCat] = React.useState<'Points' | 'Rebounds' | 'Assists'>('Points');
  const [teamStatsTab, setTeamStatsTab] = React.useState<'Current' | 'History'>('Current');

  const playerTeamMap = React.useMemo(() => {
    const map = new Map<string, any>();
    if (!state?.teams) return map;
    Object.values(state.teams).forEach((team: any) => {
      team.roster.forEach((pid: string) => map.set(pid, team));
    });
    return map;
  }, [state?.teams]);

  const getTeamLogoLocal = (id: string) => getTeamLogo(id);

  if (!state || !userTeam) return null;

  const seasonalStats = state.stats?.seasonal || {};
  const seasonHighs = state.seasonHighs || {};

  return (
    <motion.div 
      key="stats"
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -15 }}
      className="max-w-[1400px] mx-auto space-y-4 md:space-y-8 pb-20 px-4 md:px-8 select-none text-zinc-300"
    >
      {/* EXECUTIVE REPORT TITLE */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-4 md:pb-6">
        <div className="space-y-1 leading-none">
          <p className="text-[8px] font-bold text-zinc-500 tracking-[0.3em] uppercase">STATISTICAL AUDITING PANEL</p>
          <h2 className="text-lg md:text-3xl font-black uppercase italic tracking-tighter text-white leading-none">Executive Report</h2>
        </div>
        
        {/* Responsive Horizontal scroll sub-tabs */}
        <div className="flex bg-zinc-950 border border-white/5 rounded-xl p-1 overflow-x-auto no-scrollbar shrink-0 max-w-full">
           {(['League', 'Highs', 'Team'] as const).map(sub => (
             <button 
               key={sub} 
               onClick={() => setStatsSubTab(sub)}
               className={`whitespace-nowrap px-4 md:px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                 statsSubTab === sub 
                   ? 'bg-white text-black font-extrabold shadow-sm' 
                   : 'text-zinc-550 hover:text-white'
               }`}
             >
               {sub === 'Highs' ? 'Season Highs' : sub === 'Team' ? 'Team Stats' : 'League Leaders'}
             </button>
           ))}
        </div>
      </div>

      {statsSubTab === 'League' && (
        <div className="space-y-4 md:space-y-5">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {['Points', 'Rebounds', 'Assists'].map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveStatsCat(cat as any)}
                className={`whitespace-nowrap px-4 py-2 border rounded-xl text-[9px] md:text-[9.5px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  activeStatsCat === cat 
                    ? 'bg-zinc-100 text-black border-zinc-100 font-extrabold' 
                    : 'bg-zinc-950 border-white/5 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {cat} Core
              </button>
            ))}
          </div>

          {/* TABLE ANALYTICS CONTAINER WITH CARD SYSTEM FOR MOBILE */}
          <div className="bg-zinc-950 rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
            {/* Desktop Statistics Table */}
            <div className="hidden md:block overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-white/5 text-[8px] md:text-[9.5px] font-extrabold text-zinc-500 uppercase tracking-widest bg-zinc-950">
                    <th className="py-4 px-6 md:px-8 w-[40%]">Athlete</th>
                    <th className="py-4 px-4 w-[20%] text-center">Team</th>
                    <th className="py-4 px-4 w-[10%] text-center">GP</th>
                    <th className="py-4 px-4 w-[10%] text-center">PPG</th>
                    <th className="py-4 px-4 w-[10%] text-center">RPG</th>
                    <th className="py-4 px-4 w-[10%] text-center">APG</th>
                    <th className="py-4 px-6 text-right w-[10%]">EFF Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {(Object.entries(seasonalStats) as [string, any][])
                    .sort(([, a], [, b]) => {
                      const valA = activeStatsCat === 'Points' ? a.points : activeStatsCat === 'Rebounds' ? a.rebounds : a.assists;
                      const valB = activeStatsCat === 'Points' ? b.points : activeStatsCat === 'Rebounds' ? b.rebounds : b.assists;
                      return (valB / (b.gamesPlayed || 1)) - (valA / (a.gamesPlayed || 1));
                    })
                    .slice(0, 30)
                    .map(([playerId, stats]) => {
                      const card = findCard(playerId);
                      const team = playerTeamMap.get(playerId);
                      if (!card) return null;
                      
                      const games = stats.gamesPlayed || 1;
                      const eff = (stats.points + stats.rebounds + stats.assists + (stats.steals || 0) + (stats.blocks || 0)) / games;

                      return (
                        <tr key={playerId} className="hover:bg-white/[0.015] transition-colors duration-150 group">
                          {/* Athlete */}
                          <td className="py-3 px-6 md:px-8 flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-zinc-900 border border-white/10 shrink-0 pointer-events-none p-0.5 overflow-hidden">
                              <PlayerHeadshot nbaId={card.nbaId} name={card.name} />
                            </div>
                            <div className="truncate leading-tight">
                              <p className="text-sm font-bold text-white uppercase italic truncate">{card.name}</p>
                              <span className="text-[7.5px] font-black font-mono tracking-widest text-zinc-550 uppercase">{card.position}</span>
                            </div>
                          </td>

                          {/* Team logo */}
                          <td className="py-3 px-4 text-center">
                            {team ? (
                              <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-zinc-900/60 border border-white/5 rounded-md">
                                <img src={getTeamLogoLocal(team.teamId)} className="w-[14px] h-[14px] object-contain" />
                                <span className="text-[8px] font-bold text-zinc-400 font-mono uppercase leading-none">{team.abbreviation}</span>
                              </div>
                            ) : (
                              <span className="text-[8px] text-zinc-650 font-bold uppercase">—</span>
                            )}
                          </td>

                          {/* GP */}
                          <td className="py-3 px-4 text-center text-zinc-400 font-mono font-bold">{stats.gamesPlayed}</td>

                          {/* Stats parameters */}
                          <td className={`py-3 px-4 text-center font-mono font-bold ${activeStatsCat === 'Points' ? 'text-amber-400 text-sm' : 'text-zinc-455'}`}>
                            {(stats.points / games).toFixed(1)}
                          </td>
                          <td className={`py-3 px-4 text-center font-mono font-bold ${activeStatsCat === 'Rebounds' ? 'text-indigo-400 text-sm' : 'text-zinc-455'}`}>
                            {(stats.rebounds / games).toFixed(1)}
                          </td>
                          <td className={`py-3 px-4 text-center font-mono font-bold ${activeStatsCat === 'Assists' ? 'text-emerald-400 text-sm' : 'text-zinc-455'}`}>
                            {(stats.assists / games).toFixed(1)}
                          </td>

                          {/* Rating Efficiency ratio */}
                          <td className="py-3 px-6 text-right font-mono text-emerald-400 font-extrabold text-sm font-black">
                            {eff.toFixed(1)}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Mobile Statistics Cards List */}
            <div className="block md:hidden divide-y divide-white/5 max-h-[75vh] overflow-y-auto no-scrollbar">
               {(Object.entries(seasonalStats) as [string, any][])
                 .sort(([, a], [, b]) => {
                   const valA = activeStatsCat === 'Points' ? a.points : activeStatsCat === 'Rebounds' ? a.rebounds : a.assists;
                   const valB = activeStatsCat === 'Points' ? b.points : activeStatsCat === 'Rebounds' ? b.rebounds : b.assists;
                   return (valB / (b.gamesPlayed || 1)) - (valA / (a.gamesPlayed || 1));
                 })
                 .slice(0, 30)
                 .map(([playerId, stats], i) => {
                   const card = findCard(playerId);
                   const team = playerTeamMap.get(playerId);
                   if (!card) return null;
                   
                   const games = stats.gamesPlayed || 1;
                   const eff = (stats.points + stats.rebounds + stats.assists + (stats.steals || 0) + (stats.blocks || 0)) / games;
                   const ppg = (stats.points / games).toFixed(1);
                   const rpg = (stats.rebounds / games).toFixed(1);
                   const apg = (stats.assists / games).toFixed(1);

                   return (
                     <div key={playerId} className="p-3.5 flex items-center justify-between gap-3 bg-zinc-950/20">
                       <div className="flex items-center gap-2.5 min-w-0">
                         <span className="text-[10px] font-mono font-black text-zinc-600 italic shrink-0">#{i+1}</span>
                         <div className="w-9 h-9 rounded bg-zinc-900 border border-white/10 shrink-0 pointer-events-none p-0.5 overflow-hidden">
                           <PlayerHeadshot nbaId={card.nbaId} name={card.name} />
                         </div>
                         <div className="truncate min-w-0 leading-none">
                           <h4 className="text-xs font-black text-white uppercase italic truncate">{card.name}</h4>
                           <p className="text-[7px] text-zinc-550 uppercase mt-1">
                             {card.position} • GP: {stats.gamesPlayed}
                           </p>
                           {team && (
                             <div className="inline-flex items-center gap-1 mt-1 px-1 bg-zinc-900 border border-white/5 rounded">
                               <img src={getTeamLogoLocal(team.teamId)} className="w-[10px] h-[10px] object-contain" />
                               <span className="text-[6.5px] font-black text-zinc-400 font-mono uppercase">{team.abbreviation}</span>
                             </div>
                           )}
                         </div>
                       </div>
                       
                       <div className="flex gap-1 shrink-0">
                         {[
                           { k: 'PTS', v: ppg, active: activeStatsCat === 'Points', color: 'text-amber-500' },
                           { k: 'REB', v: rpg, active: activeStatsCat === 'Rebounds', color: 'text-indigo-400' },
                           { k: 'AST', v: apg, active: activeStatsCat === 'Assists', color: 'text-emerald-400' },
                           { k: 'EFF', v: eff.toFixed(1), active: false, color: 'text-zinc-300' }
                         ].map(x => (
                           <div key={x.k} className="bg-zinc-900/40 border border-white/5 p-1 rounded-md text-center min-w-[32px]">
                             <span className="text-[5.5px] text-zinc-600 block font-black">{x.k}</span>
                             <span className={`text-[10px] font-mono font-black leading-none ${x.active ? `${x.color}` : 'text-zinc-400'}`}>{x.v}</span>
                           </div>
                         ))}
                       </div>
                     </div>
                   );
                 })}
            </div>
          </div>
        </div>
      )}

      {statsSubTab === 'Highs' && (
        <div className="bg-zinc-950 border border-white/5 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-10 space-y-6">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-900 border border-white/10 rounded-xl flex items-center justify-center text-amber-500 shadow-md">
                 <Target size={18} />
              </div>
              <div>
                 <h3 className="text-sm md:text-lg font-black uppercase italic tracking-tighter text-white">Active Roster Top Performances</h3>
                 <p className="text-[7.5px] md:text-[8px] text-zinc-550 font-bold uppercase tracking-wider">Historical match peaks registered during simulations</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 max-h-[75vh] overflow-y-auto no-scrollbar pt-1">
                {(userTeam.roster as string[]).map(pid => {
                const card = findCard(pid);
                const highs = seasonHighs[pid];
                if (!card || !highs) return null;
                return (
                  <div key={pid} className="bg-zinc-90 w-full border border-white/5 rounded-xl md:rounded-2xl p-3 md:p-4.5 space-y-3.5">
                     <div className="flex items-center gap-2.5 border-b border-white/5 pb-2.5">
                        <div className="w-8 h-8 md:w-9 h-9 bg-zinc-900 border border-white/5 rounded-lg overflow-hidden shrink-0 pointer-events-none p-0.2">
                           <PlayerHeadshot nbaId={card.nbaId} name={card.name} />
                        </div>
                        <div>
                           <p className="text-xs font-black text-white italic uppercase">{card.name}</p>
                           <p className="text-[7.5px] font-black text-zinc-600 uppercase tracking-widest">{card.position} | Tier {card.tier?.toUpperCase() || 'COMMON'}</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-5 gap-1 md:gap-2">
                        {[
                          { k: 'PTS', v: highs.points },
                          { k: 'REB', v: highs.rebounds },
                          { k: 'AST', v: highs.assists },
                          { k: 'STL', v: highs.steals },
                          { k: 'BLK', v: highs.blocks }
                        ].map(h => (
                          <div key={h.k} className="text-center bg-zinc-950/60 rounded-lg md:rounded-xl py-1 md:py-2 px-1 border border-white/5 min-w-0">
                             <p className="text-[6.5px] md:text-[7.5px] font-black text-zinc-550 uppercase tracking-wider truncate">{h.k}</p>
                             <p className="text-xs md:text-sm font-black text-white italic font-mono mt-0.5">{h.v.value}</p>
                             <p className="text-[5.5px] md:text-[6px] font-bold text-zinc-650 truncate uppercase mt-0.5">vs {h.v.rival}</p>
                          </div>
                        ))}
                     </div>
                  </div>
                );
              })}
           </div>
        </div>
      )}

      {statsSubTab === 'Team' && (
        <div className="space-y-4 md:space-y-6">
           <div className="flex bg-zinc-950 border border-white/5 rounded-xl p-0.5 w-fit">
              {(['Current', 'History'] as const).map(t => (
                <button 
                  key={t}
                  onClick={() => setTeamStatsTab(t)}
                  className={`px-4 md:px-6 py-2 rounded-lg text-[9px] md:text-[9.5px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    teamStatsTab === t 
                      ? 'bg-zinc-100 text-black font-extrabold shadow-sm' 
                      : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  {t === 'Current' ? 'This Season' : 'Franchise History'}
                </button>
              ))}
           </div>

           {teamStatsTab === 'Current' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="bg-zinc-950 border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-8 space-y-4">
                   <h4 className="text-[7.5px] md:text-[8px] font-extrabold uppercase text-amber-500 tracking-wider italic border-b border-white/5 pb-2.5">Seasonal Averages</h4>
                   <div className="space-y-3 pt-1">
                      {(() => {
                         const seasonalStats = state.stats?.seasonal || {};
                         const userPlayersSeasonalStats = (Object.entries(seasonalStats) as [string, PlayerStats][])
                            .filter(([id]) => (userTeam.roster as string[]).includes(id))
                            .map(([, s]) => s);
                         const totalG = Math.max(1, userTeam.wins + userTeam.losses);
                         
                         return [
                            { l: 'POINTS AVERAGED', v: (userPlayersSeasonalStats.reduce((acc, curr) => acc + curr.points, 0) / totalG).toFixed(1), badge: 'PTS' },
                            { l: 'REBOUNDS AVERAGED', v: (userPlayersSeasonalStats.reduce((acc, curr) => acc + curr.rebounds, 0) / totalG).toFixed(1), badge: 'REB' },
                            { l: 'ASSISTS AVERAGED', v: (userPlayersSeasonalStats.reduce((acc, curr) => acc + curr.assists, 0) / totalG).toFixed(1), badge: 'AST' },
                         ].map(s => (
                            <div key={s.l} className="flex justify-between items-center bg-zinc-900/10 border border-white/5 p-3 rounded-xl">
                               <div className="flex items-center gap-2">
                                 <span className="text-[7.5px] font-black font-mono border border-white/10 px-1.5 py-0.5 rounded text-zinc-400 bg-zinc-950">{s.badge}</span>
                                 <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-wider leading-none">{s.l}</p>
                               </div>
                               <p className="text-base md:text-xl font-black italic tracking-tighter text-white font-mono leading-none">{s.v}</p>
                            </div>
                         ));
                      })()}
                   </div>
                </div>

                <div className="bg-zinc-950 border border-white/5 rounded-xl md:rounded-2xl p-4 md:p-8 space-y-4">
                   <h4 className="text-[7.5px] md:text-[8px] font-extrabold uppercase text-amber-500 tracking-wider italic border-b border-white/5 pb-2.5">Performance Audit</h4>
                   <div className="space-y-3 pt-1">
                      <div className="flex justify-between items-center bg-zinc-900/10 border border-white/5 p-3 rounded-xl">
                         <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Record Outcome</p>
                         <p className="text-base md:text-xl font-black italic text-white font-mono leading-none">{userTeam.wins}W - {userTeam.losses}L</p>
                      </div>
                      <div className="flex justify-between items-center bg-zinc-900/10 border border-white/5 p-3.5 rounded-xl">
                         <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Home vs Road Split</p>
                         <p className="text-base md:text-lg font-black italic text-zinc-300 font-mono leading-none">12-4 vs 8-10</p>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {teamStatsTab === 'History' && (
             <div className="bg-zinc-950 border border-white/5 rounded-xl md:rounded-2xl overflow-hidden shadow-2xl">
                {/* Desktop statistics history table */}
                <div className="hidden md:block overflow-x-auto no-scrollbar">
                   <table className="w-full text-left">
                      <thead>
                         <tr className="text-[8px] md:text-[9.5px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-950 border-b border-white/5">
                            <th className="py-4 px-6 md:px-8">Chronology</th>
                            <th className="py-4 px-4 text-center">Record</th>
                            <th className="py-4 px-4 text-center">Averaged PPG</th>
                            <th className="py-4 px-4">Accolades</th>
                            <th className="py-4 px-6 text-right">League Champion</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                         {(state.teamHistory || []).map((h: any, i: number) => (
                           <tr key={i} className="hover:bg-white/[0.015] transition-colors">
                             <td className="py-3 px-6 md:px-8 text-sm font-black text-white italic uppercase tracking-tighter">Season {h.season}</td>
                             <td className="py-3 px-4 text-center text-xs font-semibold text-zinc-400 font-mono">{h.record}</td>
                             <td className="py-3 px-4 text-center text-sm font-black italic text-zinc-300 font-mono">{h.ppg}</td>
                             <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-1">
                                   {h.awards.map((a: string, j: number) => (
                                      <span key={j} className="px-2 py-0.5 bg-amber-500/5 text-[7.5px] font-extrabold border border-amber-500/15 rounded text-amber-500 uppercase tracking-wide">{a}</span>
                                   ))}
                                </div>
                             </td>
                             <td className="py-3 px-6 text-right text-[10px] font-black text-zinc-400 uppercase tracking-widest">{h.champion}</td>
                           </tr>
                         ))}
                         {(!state.teamHistory || state.teamHistory.length === 0) && (
                           <tr>
                              <td colSpan={5} className="py-14 text-center text-zinc-600 text-[9px] font-black uppercase tracking-widest italic leading-none">No historical archives established yet.</td>
                           </tr>
                         )}
                      </tbody>
                   </table>
                </div>

                {/* Mobile Statistics history cards */}
                <div className="block md:hidden divide-y divide-white/5 max-h-[70vh] overflow-y-auto no-scrollbar">
                   {(state.teamHistory || []).map((h: any, i: number) => (
                     <div key={i} className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                           <h4 className="text-xs font-black text-white italic uppercase tracking-tighter">Season {h.season}</h4>
                           <span className="text-xs font-semibold text-zinc-400 font-mono">{h.record}</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-zinc-500">Averaged PPG: <span className="text-zinc-200 font-mono font-bold">{h.ppg}</span></span>
                          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">{h.champion}</span>
                        </div>
                        {h.awards && h.awards.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                             {h.awards.map((a: string, j: number) => (
                                <span key={j} className="px-1.5 py-0.5 bg-amber-500/5 text-[6.5px] font-extrabold border border-amber-500/15 rounded text-amber-500 uppercase tracking-wide">{a}</span>
                             ))}
                          </div>
                        )}
                     </div>
                   ))}
                   {(!state.teamHistory || state.teamHistory.length === 0) && (
                     <div className="py-14 text-center text-zinc-650 text-[9px] font-black uppercase tracking-widest italic leading-none">
                       No historical archives established yet.
                     </div>
                   )}
                </div>
             </div>
           )}
        </div>
      )}
    </motion.div>
  );
});

export default StatsTab;
