import React from 'react';
import { motion } from 'motion/react';
import { X, History } from 'lucide-react';
import { NBA_TEAMS } from '../../data/nbaTeams';

interface TradesTabProps {
  state: any;
  tradeTargetTeamId: string | null;
  setTradeTargetTeamId: (id: string | null) => void;
  userOfferedIds: string[];
  setUserOfferedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  userOfferedPickIds: string[];
  setUserOfferedPickIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  cpuRequestedIds: string[];
  setCpuRequestedIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  cpuRequestedPickIds: string[];
  setCpuRequestedPickIds: (ids: string[] | ((prev: string[]) => string[])) => void;
  handleExecuteTrade: () => void;
  findCard: (id: string, season?: number) => any;
}

const TradesTab: React.FC<TradesTabProps> = React.memo(({ 
  state, 
  tradeTargetTeamId,
  setTradeTargetTeamId,
  userOfferedIds,
  setUserOfferedIds,
  userOfferedPickIds,
  setUserOfferedPickIds,
  cpuRequestedIds,
  setCpuRequestedIds,
  cpuRequestedPickIds,
  setCpuRequestedPickIds,
  handleExecuteTrade,
  findCard
}) => {
  const userTeam = state.teams[state.userTeamId];

  return (
    <motion.div 
      key="trades"
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto space-y-4 md:space-y-6 pb-24 px-3"
    >
      <div className="flex items-center justify-between mb-2">
          <div className="space-y-0.5">
            <h3 className="text-lg md:text-xl font-black uppercase italic tracking-tighter text-white">Negotiate</h3>
            <p className="text-[7px] md:text-[10px] font-black text-zinc-600 uppercase tracking-widest">Select Swap Targets</p>
          </div>
          <select 
            value={tradeTargetTeamId || ""}
            onChange={(e) => {
              setTradeTargetTeamId(e.target.value || null);
              setCpuRequestedIds([]);
            }}
            className="bg-zinc-900 text-[9px] md:text-[11px] font-black uppercase tracking-widest text-white border border-white/10 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl outline-none"
          >
            <option value="">Select Team</option>
            {NBA_TEAMS.filter(t => t.id !== state.userTeamId).map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8 mb-32">
          {/* USER SIDE */}
          <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[350px] md:h-[500px]">
              <div className="p-3 border-b border-white/5 bg-white/2 flex items-center justify-between">
                <span className="text-[10px] font-black text-white italic tracking-widest">YOUR ROSTER</span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase">{userOfferedIds.length + userOfferedPickIds.length} ITEMS</span>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-white/5 no-scrollbar">
                {userTeam.roster.map((id: string) => {
                    const card = findCard(id);
                    const isSelected = userOfferedIds.includes(id);
                    return (
                      <div key={id} onClick={() => setUserOfferedIds(prev => isSelected ? prev.filter(x => x !== id) : [...prev, id])} className={`p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors ${isSelected ? 'bg-amber-500/10' : ''}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-zinc-700'}`}>
                                {isSelected && <X size={12} className="text-black rotate-45" />}
                            </div>
                            <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card?.nbaId}.png`} className="w-10 h-10 rounded-full bg-zinc-800 object-contain" />
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black uppercase italic text-white leading-none mb-1">{card?.name?.split(' ').pop()}</span>
                                <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{card?.position} • ${(userTeam.contracts[id]?.salary / 1e6).toFixed(1)}M</span>
                            </div>
                          </div>
                          <span className="text-xs font-black text-amber-500 italic tabular-nums">{card?.stats.ovr}</span>
                      </div>
                    );
                })}
              </div>
              <div className="p-4 bg-black/40 border-t border-white/5 max-h-[140px] overflow-y-auto no-scrollbar">
                <p className="text-[9px] font-black text-zinc-600 uppercase mb-3 flex items-center justify-between">
                    Draft Capital
                    <span className="text-amber-500">{userOfferedPickIds.length} selected</span>
                </p>
                <div className="flex flex-wrap gap-2">
                    {userTeam.draftPicks.map((pick: any) => {
                      const isSelected = userOfferedPickIds.includes(pick.id);
                      return (
                          <button 
                            key={pick.id}
                            onClick={() => setUserOfferedPickIds(prev => isSelected ? prev.filter(x => x !== pick.id) : [...prev, pick.id])}
                            className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase transition-all ${isSelected ? 'bg-amber-500 border-amber-500 text-black' : 'bg-zinc-800 border-white/10 text-zinc-500 hover:text-white'}`}
                          >
                            {pick.year.toString().slice(-2)} R{pick.round}
                          </button>
                      );
                    })}
                </div>
              </div>
          </div>

          {/* RIVAL SIDE */}
          <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[350px] md:h-[500px]">
              <div className="p-3 border-b border-white/5 bg-white/2 flex items-center justify-between">
                <span className="text-[10px] font-black text-white italic tracking-widest">RECEIVING</span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase">{cpuRequestedIds.length + cpuRequestedPickIds.length} ITEMS</span>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-white/5 no-scrollbar">
                {tradeTargetTeamId ? state.teams[tradeTargetTeamId].roster.map((id: string) => {
                    const card = findCard(id);
                    const isSelected = cpuRequestedIds.includes(id);
                    const contract = state.teams[tradeTargetTeamId!].contracts[id];
                    return (
                      <div key={id} onClick={() => setCpuRequestedIds(prev => isSelected ? prev.filter(x => x !== id) : [...prev, id])} className={`p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors ${isSelected ? 'bg-amber-500/10' : ''}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-white border-white' : 'border-zinc-700'}`}>
                                {isSelected && <X size={12} className="text-black rotate-45" />}
                            </div>
                            <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card?.nbaId}.png`} className="w-10 h-10 rounded-full bg-zinc-800 object-contain" />
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black uppercase italic text-white leading-none mb-1">{card?.name?.split(' ').pop()}</span>
                                <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{card?.position} • ${(contract?.salary / 1e6).toFixed(1)}M</span>
                            </div>
                          </div>
                          <span className="text-xs font-black text-white italic tabular-nums">{card?.stats.ovr}</span>
                      </div>
                    );
                }) : (
                    <div className="h-full flex items-center justify-center p-8 text-center bg-black/20">
                      <p className="text-[10px] font-black text-zinc-700 uppercase leading-relaxed italic tracking-widest max-w-[140px]">Select a target team from the menu above</p>
                    </div>
                )}
              </div>

              {tradeTargetTeamId && (
                <div className="p-4 bg-black/40 border-t border-white/5 max-h-[140px] overflow-y-auto no-scrollbar">
                  <p className="text-[9px] font-black text-zinc-600 uppercase mb-3">Target Draft Picks</p>
                  <div className="flex flex-wrap gap-2">
                      {state.teams[tradeTargetTeamId].draftPicks.map((pick: any) => {
                        const isSelected = cpuRequestedPickIds.includes(pick.id);
                        return (
                            <button 
                              key={pick.id}
                              onClick={() => setCpuRequestedPickIds(prev => isSelected ? prev.filter(x => x !== pick.id) : [...prev, pick.id])}
                              className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase transition-all ${isSelected ? 'bg-white border-white text-black' : 'bg-zinc-800 border-white/10 text-zinc-500 hover:text-white'}`}
                            >
                              {pick.year.toString().slice(-2)} R{pick.round}
                            </button>
                        );
                      })}
                  </div>
                </div>
              )}
          </div>
      </div>

      {/* FIXED BOTTOM ACTION BAR */}
      <div className="fixed bottom-[74px] md:bottom-0 landscape:bottom-0 left-0 right-0 h-24 bg-black/80 backdrop-blur-xl border-t border-white/10 z-[5000] flex items-center justify-center px-6">
          <div className="max-w-4xl w-full flex items-center justify-between gap-6">
            <div className="flex gap-4">
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em]">Giving</p>
                  <p className="text-sm font-black italic text-white">{userOfferedIds.length} Plyr, {userOfferedPickIds.length} Pks</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em]">Receiving</p>
                  <p className="text-sm font-black italic text-white">{cpuRequestedIds.length} Plyr, {cpuRequestedPickIds.length} Pks</p>
                </div>
            </div>
            
            <button 
              onClick={handleExecuteTrade}
              disabled={userOfferedIds.length === 0 || cpuRequestedIds.length === 0}
              className="px-12 py-4 bg-white text-black rounded-2xl font-black uppercase italic tracking-tighter disabled:opacity-20 hover:bg-amber-500 transition-all active:scale-95"
            >
                Propose Trade
            </button>
          </div>
      </div>
    </motion.div>
  );
});

export default TradesTab;
