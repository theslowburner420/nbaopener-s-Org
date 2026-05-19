import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';
import { getTeamLogo } from '../../data/nbaTeams';
import { PlayerStats } from '../../franchise/types';

interface StatsTabProps {
  state: any;
  userTeam: any;
  findCard: (id: string, season?: number) => any;
  statsSubTab: 'League' | 'Highs' | 'Team';
  setStatsSubTab: (tab: 'League' | 'Highs' | 'Team') => void;
  activeStatsCat: 'Points' | 'Rebounds' | 'Assists';
  setActiveStatsCat: (cat: 'Points' | 'Rebounds' | 'Assists') => void;
  playerTeamMap: Map<string, any>;
  teamStatsTab: 'Current' | 'History';
  setTeamStatsTab: (tab: 'Current' | 'History') => void;
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
  const teamHistory = state.teamHistory || [];

  return (
    <motion.div 
      key="stats"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="max-w-7xl mx-auto space-y-6 px-3"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <h2 className="text-xl md:text-4xl font-black uppercase italic tracking-tighter">Stats</h2>
        <div className="flex bg-zinc-900 border border-white/5 rounded-2xl p-1 shrink-0">
           {(['League', 'Highs', 'Team'] as const).map(sub => (
             <button 
               key={sub} 
               onClick={() => setStatsSubTab(sub)}
               className={`px-4 md:px-8 py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${statsSubTab === sub ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
             >
               {sub === 'Highs' ? 'Season Highs' : sub === 'Team' ? 'Team Stats' : 'League Leaders'}
             </button>
           ))}
        </div>
      </div>

      {statsSubTab === 'League' && (
        <div className="space-y-6">
          <div className="flex gap-2">
            {['Points', 'Rebounds', 'Assists'].map(cat => (
              <button 
                key={cat} 
                onClick={() => setActiveStatsCat(cat as any)}
                className={`px-6 py-2 border rounded-xl text-[8px] font-black uppercase tracking-widest transition-colors ${activeStatsCat === cat ? 'bg-white text-black border-white' : 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="bg-zinc-900 border border-white/5 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left min-w-[600px] border-collapse relative">
                <thead className="bg-white/5 border-b border-white/5 sticky top-0 z-20 backdrop-blur-md">
                  <tr className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                    <th className="px-4 py-4 md:px-8 md:py-6 sticky left-0 z-30 bg-zinc-900 md:bg-transparent md:backdrop-blur-none border-r border-white/5 md:border-0 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.5)] md:shadow-none">Player</th>
                    <th className="px-4 py-4 md:px-8 md:py-6 hidden md:table-cell">Team</th>
                    <th className="px-4 py-4 md:px-8 md:py-6 text-center tabular-nums">GP</th>
                    <th className={`px-4 py-4 md:px-8 md:py-6 text-center tabular-nums ${activeStatsCat === 'Points' ? 'text-amber-500 font-black' : ''}`}>PPG</th>
                    <th className={`px-4 py-4 md:px-8 md:py-6 text-center tabular-nums ${activeStatsCat === 'Rebounds' ? 'text-amber-500 font-black' : ''}`}>RPG</th>
                    <th className={`px-4 py-4 md:px-8 md:py-6 text-center tabular-nums ${activeStatsCat === 'Assists' ? 'text-amber-500 font-black' : ''}`}>APG</th>
                    <th className="px-4 py-4 md:px-8 md:py-6 text-center tabular-nums text-emerald-500">EFF</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(Object.entries(seasonalStats) as [string, any][])
                    .sort(([, a], [, b]) => {
                      const valA = activeStatsCat === 'Points' ? a.points : activeStatsCat === 'Rebounds' ? a.rebounds : a.assists;
                      const valB = activeStatsCat === 'Points' ? b.points : activeStatsCat === 'Rebounds' ? b.rebounds : b.assists;
                      return (valB / (b.gamesPlayed || 1)) - (valA / (a.gamesPlayed || 1));
                    })
                    .slice(0, 50)
                    .map(([playerId, stats]) => {
                      const card = findCard(playerId);
                      const team = playerTeamMap.get(playerId);
                      if (!card) return null;
                      
                      const games = stats.gamesPlayed || 1;
                      const eff = (stats.points + stats.rebounds + stats.assists + (stats.steals || 0) + (stats.blocks || 0)) / games;

                      return (
                        <tr key={playerId} className="hover:bg-white/5 transition-colors group">
                          <td className="px-4 py-3 md:px-8 md:py-4 sticky left-0 z-10 bg-zinc-950 md:bg-transparent border-r border-white/5 md:border-0 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.5)] md:shadow-none">
                            <div className="flex items-center gap-3 md:gap-4 min-w-[120px]">
                              <div className="w-8 h-8 md:w-10 md:h-10 bg-zinc-800 rounded-lg md:rounded-xl overflow-hidden p-0.5 md:p-1 border border-white/5 shrink-0">
                                <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card.nbaId}.png`} className="w-full h-full object-contain" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] md:text-sm font-black text-white italic uppercase truncate leading-tight">{card.name.split(' ').pop()}</p>
                                <p className="text-[7px] md:text-[9px] font-black text-zinc-600 uppercase tracking-widest">{card.position}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 md:px-8 md:py-4 hidden md:table-cell">
                            {team && (
                              <div className="flex items-center gap-2">
                                <img src={getTeamLogoLocal(team.teamId)} className="w-5 h-5 object-contain" />
                                <span className="text-[10px] font-bold text-zinc-400 uppercase">{team.abbreviation}</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 md:px-8 md:py-4 text-center text-[10px] md:text-xs font-black text-zinc-500 tabular-nums">{stats.gamesPlayed}</td>
                          <td className={`px-4 py-3 md:px-8 md:py-4 text-center text-xs md:text-sm font-black italic tabular-nums ${activeStatsCat === 'Points' ? 'text-white' : 'text-zinc-500'}`}>{(stats.points / games).toFixed(1)}</td>
                          <td className={`px-4 py-3 md:px-8 md:py-4 text-center text-xs md:text-sm font-black italic tabular-nums ${activeStatsCat === 'Rebounds' ? 'text-white' : 'text-zinc-500'}`}>{(stats.rebounds / games).toFixed(1)}</td>
                          <td className={`px-4 py-3 md:px-8 md:py-4 text-center text-xs md:text-sm font-black italic tabular-nums ${activeStatsCat === 'Assists' ? 'text-white' : 'text-zinc-500'}`}>{(stats.assists / games).toFixed(1)}</td>
                          <td className="px-4 py-3 md:px-8 md:py-4 text-center text-xs md:text-sm font-black italic tabular-nums text-emerald-500">{eff.toFixed(1)}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {statsSubTab === 'Highs' && (
        <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-8 md:p-12">
           <div className="space-y-8">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-black shadow-lg">
                   <TrendingUp size={24} />
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Player Season Highs</h3>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(userTeam.roster as string[]).map(pid => {
                  const card = findCard(pid);
                  const highs = seasonHighs[pid];
                  if (!card || !highs) return null;
                  return (
                    <div key={pid} className="bg-black/40 border border-white/5 rounded-3xl p-6 space-y-4">
                       <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                          <div className="w-12 h-12 bg-zinc-800 rounded-xl p-1 overflow-hidden">
                             <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card.nbaId}.png`} className="w-full h-full object-contain" />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{card.position}</p>
                             <p className="text-lg font-black text-white italic uppercase tracking-tighter">{card.name}</p>
                          </div>
                       </div>
                       <div className="grid grid-cols-5 gap-2">
                          {[
                            { k: 'PTS', v: highs.points },
                            { k: 'REB', v: highs.rebounds },
                            { k: 'AST', v: highs.assists },
                            { k: 'STL', v: highs.steals },
                            { k: 'BLK', v: highs.blocks }
                          ].map(h => (
                            <div key={h.k} className="text-center bg-white/5 rounded-xl py-3 border border-white/5">
                               <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{h.k}</p>
                               <p className="text-xl font-black text-white italic">{h.v.value}</p>
                               <p className="text-[7px] font-bold text-zinc-600 truncate px-1">vs {h.v.rival}</p>
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

      {statsSubTab === 'Team' && (
        <div className="space-y-8">
           <div className="flex bg-zinc-950 border border-white/10 rounded-2xl p-1 w-fit mx-auto md:mx-0">
              {(['Current', 'History'] as const).map(t => (
                <button 
                  key={t}
                  onClick={() => setTeamStatsTab(t)}
                  className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${teamStatsTab === t ? 'bg-amber-500 text-black' : 'text-zinc-500 hover:text-white'}`}
                >
                  {t === 'Current' ? 'This Season' : 'Franchise History'}
                </button>
              ))}
           </div>

           {teamStatsTab === 'Current' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 space-y-6">
                   <h4 className="text-[10px] font-black uppercase text-amber-500 tracking-widest italic border-b border-white/5 pb-4">Averages</h4>
                   <div className="space-y-4">
                      {(() => {
                         const seasonalStats = state.stats?.seasonal || {};
                         const userPlayersSeasonalStats = (Object.entries(seasonalStats) as [string, PlayerStats][])
                            .filter(([id]) => (userTeam.roster as string[]).includes(id))
                            .map(([, s]) => s);
                         const totalG = Math.max(1, userTeam.wins + userTeam.losses);
                         
                         return [
                            { l: 'Points Per Game', v: (userPlayersSeasonalStats.reduce((acc, curr) => acc + curr.points, 0) / totalG).toFixed(1), color: 'text-white' },
                            { l: 'Rebounds Per Game', v: (userPlayersSeasonalStats.reduce((acc, curr) => acc + curr.rebounds, 0) / totalG).toFixed(1), color: 'text-zinc-300' },
                            { l: 'Assists Per Game', v: (userPlayersSeasonalStats.reduce((acc, curr) => acc + curr.assists, 0) / totalG).toFixed(1), color: 'text-zinc-300' },
                         ].map(s => (
                            <div key={s.l} className="flex justify-between items-baseline">
                               <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{s.l}</p>
                               <p className={`text-3xl font-black italic tracking-tighter ${s.color}`}>{s.v}</p>
                            </div>
                         ));
                      })()}
                   </div>
                </div>

                <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 space-y-6">
                   <h4 className="text-[10px] font-black uppercase text-amber-500 tracking-widest italic border-b border-white/5 pb-4">Performance</h4>
                   <div className="space-y-4">
                      <div className="flex justify-between items-baseline">
                         <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Team Record</p>
                         <p className="text-3xl font-black italic tracking-tighter text-white">{userTeam.wins}-{userTeam.losses}</p>
                      </div>
                      <div className="flex justify-between items-baseline">
                         <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Home vs Away</p>
                         <p className="text-xl font-black italic tracking-tighter text-white">12-4 vs 8-10</p>
                      </div>
                   </div>
                </div>
             </div>
           )}

           {teamStatsTab === 'History' && (
             <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] overflow-hidden">
                <table className="w-full text-left">
                   <thead className="bg-white/5 border-b border-white/5">
                      <tr className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                         <th className="px-8 py-6">Season</th>
                         <th className="px-8 py-6 text-center">Record</th>
                         <th className="px-8 py-6 text-center">PPG</th>
                         <th className="px-8 py-6">Awards</th>
                         <th className="px-8 py-6">Champion</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                      {(state.teamHistory || []).map((h: any, i: number) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="px-8 py-6 text-sm font-black text-white italic">{h.season}</td>
                          <td className="px-8 py-6 text-center text-xs font-bold text-zinc-400">{h.record}</td>
                          <td className="px-8 py-6 text-center text-sm font-black italic text-zinc-300">{h.ppg}</td>
                          <td className="px-8 py-6">
                             <div className="flex flex-wrap gap-1">
                                {h.awards.map((a: string, j: number) => (
                                   <span key={j} className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black border border-amber-500/20 rounded uppercase">{a}</span>
                                ))}
                             </div>
                          </td>
                          <td className="px-8 py-6 text-xs font-bold text-zinc-500 uppercase">{h.champion}</td>
                        </tr>
                      ))}
                      {(!state.teamHistory || state.teamHistory.length === 0) && (
                        <tr>
                           <td colSpan={5} className="px-8 py-12 text-center text-zinc-700 text-[10px] font-black uppercase tracking-widest italic">No finished seasons yet.</td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
           )}
        </div>
      )}
    </motion.div>
  );
});

export default StatsTab;
