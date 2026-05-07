import React from 'react';
import { motion } from 'motion/react';
import { LayoutDashboard, ChevronRight, Sparkles, Trophy } from 'lucide-react';
import { getTeamLogo } from '../../data/nbaTeams';
import { NBA_TEAMS } from '../../data/nbaTeams';

interface HubTabProps {
  state: any;
  nextUserGame: any;
  simulateGame: () => void;
  leagueLeaders: any[];
  setActiveTab: (tab: any) => void;
  setState: (state: any) => void;
  renderPlayoffs: () => React.ReactNode;
  triggerLottery: () => void;
}

const HubTab: React.FC<HubTabProps> = React.memo(({ 
  state, 
  nextUserGame, 
  simulateGame, 
  leagueLeaders, 
  setActiveTab,
  setState,
  renderPlayoffs,
  triggerLottery
}) => {
  return (
    <motion.div 
      key="hub"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="max-w-7xl mx-auto space-y-6 md:space-y-12 pb-20 px-3"
    >
      {state.phase === 'Playoffs' ? (
        renderPlayoffs()
      ) : (
        <>
          {state.phase === 'Offseason' && (
            <div className="bg-gradient-to-br from-indigo-500/20 to-zinc-900 border border-indigo-500/30 rounded-3xl p-8 text-center space-y-6">
               <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center text-black mx-auto">
                  <Trophy size={32} />
               </div>
               <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Offseason Begun</h3>
                  <p className="text-zinc-500 text-xs md:text-lg font-medium max-w-md mx-auto">The rosters have been reset. It's time to determine the order of selection for the upcoming Draft.</p>
               </div>
               <button 
                 onClick={triggerLottery}
                 className="px-8 py-4 bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(99,102,241,0.2)]"
               >
                 Execute Draft Lottery
               </button>
            </div>
          )}

          {state.phase === 'Draft' && (
            <div className="bg-gradient-to-br from-amber-500/20 to-zinc-900 border border-amber-500/30 rounded-3xl p-8 text-center space-y-6">
               <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-black mx-auto">
                  <Sparkles size={32} />
               </div>
               <div className="space-y-2">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Draft is Active!</h3>
                  <p className="text-zinc-500 text-xs md:text-lg font-medium max-w-md mx-auto">The league selection process has begun. Procede to the Draft Room to select your next superstars.</p>
               </div>
               <button 
                 onClick={() => setActiveTab('draft')}
                 className="px-8 py-4 bg-amber-500 text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(245,158,11,0.2)]"
               >
                 Enter Draft Room
               </button>
            </div>
          )}

          {/* TOP FEATURE: NEXT MATCH */}
          {nextUserGame && (
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-3xl md:rounded-[3.5rem] p-4 md:p-12 flex flex-col items-center justify-between gap-6 md:gap-16 relative overflow-hidden group shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 md:w-80 md:h-80 bg-amber-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-30" />
              
              <div className="space-y-4 md:space-y-8 relative z-10 text-center w-full">
                <div className="space-y-1 md:space-y-2">
                  <p className="text-[7px] md:text-sm font-black text-amber-500 uppercase tracking-[0.5em] md:tracking-[0.8em]">Gamecenter</p>
                  <h3 className="text-3xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-none truncate">Matchday {nextUserGame.gameNumber}</h3>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[7px] md:text-xs font-black uppercase tracking-widest text-zinc-400">
                      Regular Season
                  </div>
                  <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[7px] md:text-xs font-black uppercase tracking-widest text-amber-500">
                    {nextUserGame.homeTeamId === state.userTeamId ? 'Home Court' : 'On Road'}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 md:gap-16 relative z-10 w-full">
                  <div className="text-center space-y-2 md:space-y-6">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="w-16 h-16 md:w-40 md:h-40 bg-zinc-950 rounded-2xl md:rounded-[3rem] p-3 md:p-8 border border-white/10 shadow-2xl transition-all"
                    >
                      <img src={getTeamLogo(state.userTeamId)} className="w-full h-full object-contain" />
                    </motion.div>
                    <p className="text-xs md:text-2xl font-black text-white italic tracking-tighter uppercase">{state.teams[state.userTeamId].abbreviation}</p>
                  </div>
                  
                  <div className="flex flex-col items-center gap-1 md:gap-4">
                    <div className="text-xl md:text-6xl font-black italic text-zinc-800 uppercase tracking-tighter select-none">VS</div>
                    <div className="h-px w-8 md:w-20 bg-white/10" />
                  </div>

                  <div className="text-center space-y-2 md:space-y-6">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="w-16 h-16 md:w-40 md:h-40 bg-zinc-950 rounded-2xl md:rounded-[3rem] p-3 md:p-8 border border-white/10 shadow-2xl transition-all"
                    >
                      <img src={getTeamLogo(nextUserGame.homeTeamId === state.userTeamId ? nextUserGame.awayTeamId : nextUserGame.homeTeamId)} className="w-full h-full object-contain" />
                    </motion.div>
                    <p className="text-xs md:text-2xl font-black text-white italic tracking-tighter uppercase">{state.teams[nextUserGame.homeTeamId === state.userTeamId ? nextUserGame.awayTeamId : nextUserGame.homeTeamId].abbreviation}</p>
                  </div>
              </div>

              <div className="relative z-10 w-full md:w-auto flex flex-col md:flex-row items-center gap-4 bg-black/40 backdrop-blur-xl p-4 md:p-8 rounded-3xl border border-white/5">
                <button 
                  onClick={simulateGame}
                  className="w-full md:w-auto h-14 md:h-20 px-12 md:px-20 bg-white text-black rounded-2xl md:rounded-[2.5rem] font-black uppercase italic tracking-tighter text-sm md:text-3xl hover:bg-amber-500 transition-all active:scale-95 shadow-2xl shadow-white/5 relative group/btn overflow-hidden"
                >
                  <span className="relative z-10">Simulate Match</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-white/10 to-amber-500/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="md:col-span-1 lg:col-span-2 space-y-4 md:space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm md:text-xl font-black uppercase italic tracking-tighter text-zinc-500 flex items-center gap-2">
                    <LayoutDashboard size={14} /> Next 5 Matches
                </h3>
              </div>
              <div className="space-y-2 md:space-y-4">
                {state.schedule
                  .filter((m: any) => (m.homeTeamId === state.userTeamId || m.awayTeamId === state.userTeamId) && !m.played)
                  .slice(0, 5)
                  .map((match: any) => {
                    const isHome = match.homeTeamId === state.userTeamId;
                    const opponentId = isHome ? match.awayTeamId : match.homeTeamId;
                    const opponent = NBA_TEAMS.find(t => t.id === opponentId);
                    
                    return (
                      <div key={match.id} className="bg-zinc-900/30 border border-white/5 rounded-xl md:rounded-[2rem] p-3 md:p-8 flex items-center justify-between group hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300">
                        <div className="flex items-center gap-3 md:gap-8">
                          <div className="text-center w-8 md:w-16">
                            <p className="text-[8px] md:text-[10px] font-black text-zinc-700 uppercase tracking-widest leading-none mb-1">WK</p>
                            <p className="text-base md:text-3xl font-black text-white italic leading-none">{match.gameNumber}</p>
                          </div>
                          <div className="w-px h-8 md:h-12 bg-white/5" />
                          <div className="flex items-center gap-3 md:gap-6">
                            <div className="w-8 h-8 md:w-16 md:h-16 bg-zinc-950 rounded-lg md:rounded-3xl p-1.5 md:p-3.5 border border-white/5 shadow-xl">
                                <img src={getTeamLogo(opponentId)} className="w-full h-full object-contain" />
                            </div>
                            <div className="space-y-0.5 md:space-y-1">
                              <p className="text-[8px] md:text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">{isHome ? 'HOSTING' : 'VISITING'}</p>
                              <p className="text-xs md:text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{opponent?.name || opponentId}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="hidden md:flex flex-col items-end">
                              <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">Status</p>
                              <p className="text-xs font-black text-zinc-700 uppercase italic">Scheduled</p>
                          </div>
                          <div className="w-8 h-8 md:w-12 md:h-12 rounded-full border border-white/5 flex items-center justify-center text-zinc-800 group-hover:text-white group-hover:border-white/20 transition-all">
                            <ChevronRight size={14} className="md:w-6 md:h-6" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* SIDEBAR HUB */}
            <div className="space-y-8">
                {/* News/Notifications Feed */}
                {(state.notifications || []).length > 0 && (
                  <div className="bg-zinc-900 rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 border border-white/5 space-y-4 md:space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-[9px] md:text-xs font-black uppercase tracking-[0.4em] text-zinc-600 italic">League News</h3>
                        <button onClick={() => { state.notifications = []; setState({...state}); }} className="text-[7px] md:text-[8px] font-bold text-zinc-700 hover:text-zinc-500 uppercase tracking-widest">Clear All</button>
                      </div>
                      <div className="space-y-2 md:space-y-4 max-h-[250px] md:max-h-[300px] overflow-y-auto no-scrollbar pr-1 md:pr-2">
                        {(state.notifications || []).slice(0, 5).map((n: any) => (
                            <div key={n.id} className="bg-black/40 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 space-y-1.5 md:space-y-2 relative group">
                              {!n.read && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />}
                              <div className="flex items-center gap-2">
                                  <span className="text-[6px] md:text-[7px] font-black bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">{n.type}</span>
                                  <span className="text-[6px] md:text-[7px] font-bold text-zinc-600 uppercase">Week {n.week}</span>
                              </div>
                              <p className="text-[8px] md:text-[10px] font-medium text-zinc-400 leading-tight md:leading-relaxed">{n.message}</p>
                            </div>
                        ))}
                      </div>
                  </div>
                )}

                <div className="bg-zinc-900 rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 border border-white/5 space-y-4 md:space-y-6">
                    <h3 className="text-[9px] md:text-xs font-black uppercase tracking-[0.4em] text-zinc-600 italic text-center">Leaders</h3>
                    <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:gap-3">
                        {leagueLeaders.map((leader: any) => (
                          <div key={leader.cat} className="flex items-center justify-between bg-black/40 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5">
                              <div>
                                <p className="text-[7px] md:text-[8px] font-black text-zinc-600 uppercase tracking-widest">{leader.cat}</p>
                                <p className="text-[10px] md:text-xs font-black text-white italic uppercase truncate max-w-[80px] md:max-w-[100px]">{leader.card?.name.split(' ').pop() || 'N/A'}</p>
                              </div>
                              <p className="text-sm md:text-lg font-black text-amber-500 italic tabular-nums">{leader.value.toFixed(1)}</p>
                          </div>
                        ))}
                    </div>
                  <button 
                    onClick={() => setActiveTab('stats')} 
                    className="w-full py-4 text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors"
                  >
                    Season Statistics
                  </button>
                </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
});

export default HubTab;
