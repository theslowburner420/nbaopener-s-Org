import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, AlertCircle, ArrowLeftRight, Check, HelpCircle } from 'lucide-react';
import { tradeEngine } from '../../franchise/services/tradeEngine';
import { ALL_CARDS } from '../../data/cards';
import { NBA_TEAMS } from '../../data/nbaTeams';
import { PlayerHeadshot } from '../../components/PlayerHeadshot';

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

  // Calculate Offered Value and Received Value
  const offeredValue = React.useMemo(() => {
    const playerVal = userOfferedIds.reduce((sum, id) => sum + tradeEngine.calculateTradeValue(id, state), 0);
    // Add micro value for picks (e.g. 15 for 1st round, 5 for 2nd round)
    const pickVal = userOfferedPickIds.reduce((sum, pickId) => {
      const pObj = userTeam.draftPicks.find((dp: any) => dp.id === pickId);
      return sum + (pObj ? (pObj.round === 1 ? 25 : 8) : 0);
    }, 0);
    return playerVal + pickVal;
  }, [userOfferedIds, userOfferedPickIds, state, userTeam.draftPicks]);

  const requestedValue = React.useMemo(() => {
    if (!tradeTargetTeamId) return 0;
    const playerVal = cpuRequestedIds.reduce((sum, id) => sum + tradeEngine.calculateTradeValue(id, state), 0);
    const cpuPicks = state.teams[tradeTargetTeamId].draftPicks;
    const pickVal = cpuRequestedPickIds.reduce((sum, pickId) => {
      const pObj = cpuPicks.find((dp: any) => dp.id === pickId);
      return sum + (pObj ? (pObj.round === 1 ? 25 : 8) : 0);
    }, 0);
    return playerVal + pickVal;
  }, [cpuRequestedIds, cpuRequestedPickIds, state, tradeTargetTeamId]);

  // Compute exact ratio metrics (User Offering vs Received)
  const tradeFairness = React.useMemo(() => {
    if (offeredValue === 0 && requestedValue === 0) return 0.5;
    if (requestedValue === 0) return 1.5; // Extreme overpay
    return offeredValue / requestedValue;
  }, [offeredValue, requestedValue]);

  // Dynamic feedback and gauge calibrations
  const verdict = React.useMemo(() => {
    if (userOfferedIds.length === 0 && cpuRequestedIds.length === 0) {
      return { label: 'EMPTY SWAP BLOCK', color: 'text-zinc-500', bg: 'bg-zinc-950', pct: 50, explanation: 'Establish the exchange blocks to analyze suitability.' };
    }
    if (tradeFairness < 0.72) {
      return { label: 'CPU SAYS NO (LOW VALUE)', color: 'text-rose-400 border-rose-500/20 bg-rose-950/20', bg: 'bg-rose-500', pct: Math.max(10, Math.min(40, tradeFairness * 50)), explanation: 'Critical deficiency. You must offer higher caliber players or early draft rounds.' };
    }
    if (tradeFairness >= 0.72 && tradeFairness < 0.9) {
      return { label: 'MARGINAL EXCHANGE (RISKY)', color: 'text-amber-400 border-amber-500/20 bg-amber-950/20', bg: 'bg-amber-500', pct: 45, explanation: 'The target roster is hesitant. Adding a second unit reserve might seal the transaction.' };
    }
    if (tradeFairness >= 0.9 && tradeFairness <= 1.25) {
      return { label: 'EXCELLENT BALANCE (PROCEED)', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-950/20', bg: 'bg-emerald-400', pct: 60, explanation: 'Ideal financial and skill equilibrium. The computer is highly inclined to cooperate.' };
    }
    return { label: 'OVERSPENDING ON TRANSACTION', color: 'text-orange-400 border-orange-500/20 bg-orange-950/20', bg: 'bg-orange-500', pct: 85, explanation: 'Excessive offering. You are relinquishing more skill capital than receiving.' };
  }, [tradeFairness, userOfferedIds, cpuRequestedIds]);

  return (
    <motion.div 
      key="trades"
      initial={{ opacity: 0, y: 15 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -15 }}
      className="max-w-[1400px] mx-auto space-y-6 md:space-y-12 pb-32 px-4 md:px-8 select-none"
    >
      {/* TRADE CONTROL HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div className="space-y-1.5 leading-none">
            <h3 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter text-white">DYNASTY EXCHANGE</h3>
            <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest italic leading-none">Draft capital swaps and roster trade desk agreements</p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[8.5px] font-black text-zinc-500 uppercase tracking-widest">NEGOTIATION PARTNER:</span>
            <select 
              value={tradeTargetTeamId || ""}
              onChange={(e) => {
                setTradeTargetTeamId(e.target.value || null);
                setCpuRequestedIds([]);
                setCpuRequestedPickIds([]);
              }}
              className="bg-zinc-950 hover:bg-zinc-90 w-48 md:w-64 text-[10px] font-black uppercase tracking-widest text-white border border-white/10 px-4 py-2.5 rounded-xl outline-none cursor-pointer hover:border-white/20 transition-all"
            >
              <option value="">Choose NBA Franchise</option>
              {NBA_TEAMS.filter(t => t.id !== state.userTeamId).map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
      </div>

      {/* REAL-TIME RISK COMPLIANCE BAROMETER */}
      <div className="bg-gradient-to-b from-zinc-950 to-zinc-900/40 border border-white/10 p-5 md:p-8 rounded-[2rem] space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(245,158,11,0.03)_0%,transparent_60%)] pointer-events-none" />
        {/* Futuristic glass sweep reflection */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1.5 leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              DIAGNOSTIC TRANSACTION VALUE ANALYSIS
            </p>
            <h4 className="text-lg md:text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
              <ArrowLeftRight size={20} className="text-amber-500" /> Fair Trade Balancer
            </h4>
          </div>

          <div className={`px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest leading-none flex items-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.5)] ${verdict.color}`}>
            <Sparkles size={12} className="animate-spin" style={{ animationDuration: '4s' }} />
            {verdict.label}
          </div>
        </div>

        {/* Custom Glass-faced slider track */}
        <div className="space-y-3.5 relative pt-4 pb-1">
          {/* Glass face overlay covering the balancer track */}
          <div className="absolute inset-x-0 top-3 h-4 bg-white/[0.01] border border-white/10 rounded-full blur-[0.5px] pointer-events-none z-10 shadow-[inner_0_4px_10px_rgba(255,255,255,0.02)]" />
          
          <div className="h-3 w-full bg-zinc-950 border border-white/5 rounded-full relative overflow-hidden flex shadow-inner">
            {/* Color-segmented target zones with glowing backdrop gradient */}
            <div className="h-full bg-rose-500/30 w-[35%] border-r border-white/5" />
            <div className="h-full bg-amber-500/35 w-[20%] border-r border-white/5" />
            <div className="h-full bg-emerald-500/40 w-[25%] border-r border-white/5 relative">
              {/* Highlight target zone */}
              <div className="absolute inset-0 bg-emerald-400/20 animate-pulse pointer-events-none" />
            </div>
            <div className="h-full bg-orange-500/30 w-[20%]" />
          </div>

          {/* Glowing Slide Indicator Bubble with custom numeric needle point */}
          <motion.div 
            className="absolute top-2.5 w-6 h-6 rounded-full bg-white text-[9px] font-black text-black shadow-[0_0_20px_4px_rgba(255,255,255,0.8)] border border-neutral-900 flex items-center justify-center -translate-x-1/2 pointer-events-none z-20"
            animate={{ left: `${verdict.pct}%` }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          >
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tradeFairness >= 0.9 && tradeFairness <= 1.25 ? '#10b981' : '#f59e0b' }} />
          </motion.div>

          <div className="flex justify-between text-[8px] font-black tracking-widest text-zinc-500 uppercase pt-1">
            <span>RIVAL ADVANTAGE (UNFAIR)</span>
            <span className="text-amber-500 animate-pulse bg-amber-500/5 px-2.5 py-0.5 rounded border border-amber-500/10">OPTIMAL RANGE</span>
            <span>OVERPAYMENT EXPORT</span>
          </div>
        </div>

        <div className="text-zinc-400 text-[10px] md:text-xs leading-relaxed bg-[#060a12]/80 p-4 rounded-2xl border border-white/5 flex gap-3 items-start relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-xl pointer-events-none" />
          <AlertCircle size={16} className="text-blue-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-zinc-200">GM Advisor Assessment:</strong> {verdict.explanation}
          </p>
        </div>
      </div>

      {/* MIRROR VIEW SIDE-BY-SIDE PANELS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
          
          {/* USER TRADE GIVING BLOCK */}
          <div className="bg-gradient-to-b from-[#0a0f1d] to-[#04060c] border border-white/10 rounded-[2rem] overflow-hidden flex flex-col h-[480px] md:h-[550px] shadow-2xl relative">
              <div className="p-4 border-b border-white/10 bg-[#0d1527]/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-amber-500 italic tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    FRANCHISE ASSETS PROPOSAL
                  </span>
                  <p className="text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Relinquish into transaction contract</p>
                </div>
                <span className="text-[9px] font-black bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-amber-400 rounded-full uppercase">
                  {userOfferedIds.length + userOfferedPickIds.length} SELECTED
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto divide-y divide-white/5 no-scrollbar p-1">
                {userTeam.roster.map((id: string) => {
                    const card = findCard(id);
                    if (!card) return null;
                    const isSelected = userOfferedIds.includes(id);
                    const val = tradeEngine.calculateTradeValue(id, state);

                    return (
                      <div 
                        key={id} 
                        onClick={() => setUserOfferedIds(prev => isSelected ? prev.filter(x => x !== id) : [...prev, id])} 
                        className={`p-3.5 flex items-center justify-between hover:bg-white/[0.02] cursor-pointer transition-all duration-300 rounded-xl mx-2 my-1 border ${
                          isSelected ? 'bg-amber-500/[0.04] border-amber-500/30 shadow-[0_4px_15px_rgba(245,158,11,0.03)]' : 'border-transparent bg-zinc-950/20'
                        }`}
                      >
                          <div className="flex items-center gap-3 shrink-0 min-w-0">
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${isSelected ? 'bg-amber-500 border-amber-500 text-black' : 'border-zinc-800 bg-zinc-900 group-hover:border-zinc-700'}`}>
                                {isSelected && <Check size={11} strokeWidth={3} />}
                            </div>
                            <div className="w-10 h-10 bg-zinc-900 border border-white/10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center pointer-events-none">
                              <PlayerHeadshot nbaId={card?.nbaId || 0} name={card?.name || ''} />
                            </div>
                            <div className="flex flex-col leading-tight truncate shrink-0 min-w-0">
                                <span className={`text-xs font-black uppercase italic truncate w-32 ${isSelected ? 'text-amber-400' : 'text-zinc-100'}`}>{card?.name}</span>
                                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">{card?.position} • ${(userTeam.contracts[id]?.salary / 1e6).toFixed(1)}M</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                              <span className="text-xs font-black text-amber-500 italic font-mono">{card?.stats.ovr} OVR</span>
                              <span className="text-[7.5px] font-mono text-zinc-500 uppercase tracking-widest block font-bold leading-none mt-1">CAP VALUE: {Math.round(val)}</span>
                          </div>
                      </div>
                    );
                })}
              </div>

              {/* User Draft CAPITAL */}
              <div className="p-4 bg-zinc-950 border-t border-white/5 max-h-[140px] overflow-y-auto no-scrollbar">
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex justify-between">
                    USER DRAFT ASSETS LIST
                    <span className="text-amber-500 font-extrabold">{userOfferedPickIds.length} SELECTED</span>
                </p>
                <div className="flex flex-wrap gap-2">
                    {userTeam.draftPicks.map((pick: any) => {
                      const isSelected = userOfferedPickIds.includes(pick.id);
                      return (
                          <button 
                            key={pick.id}
                            onClick={() => setUserOfferedPickIds(prev => isSelected ? prev.filter(x => x !== pick.id) : [...prev, pick.id])}
                            className={`px-3 py-2 rounded-xl border text-[9px] font-black uppercase transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-amber-500 border-amber-500 text-black font-extrabold shadow-md' 
                                : 'bg-zinc-900 border-white/5 text-zinc-550 hover:text-white'
                            }`}
                          >
                            {pick.year.toString().slice(-2)} R{pick.round}
                          </button>
                      );
                    })}
                </div>
              </div>
          </div>

          {/* RECEIVING GIVER RIVAL TRADE BLOCK */}
          <div className="bg-gradient-to-b from-[#11161b] to-[#05080c] border border-white/10 rounded-[2rem] overflow-hidden flex flex-col h-[480px] md:h-[550px] shadow-2xl relative">
              <div className="p-4 border-b border-white/10 bg-[#162029]/60 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-white italic tracking-widest flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    ACQUISITIONS PORTFOLIO
                  </span>
                  <p className="text-[7.5px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Acquire assets from target organization</p>
                </div>
                <span className="text-[9px] font-black bg-white/10 border border-white/20 px-3 py-1 text-white rounded-full uppercase">
                  {cpuRequestedIds.length + cpuRequestedPickIds.length} SELECTED
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto divide-y divide-white/5 no-scrollbar p-1">
                {tradeTargetTeamId ? (
                  state.teams[tradeTargetTeamId].roster.map((id: string) => {
                    const card = findCard(id);
                    if (!card) return null;
                    const isSelected = cpuRequestedIds.includes(id);
                    const contract = state.teams[tradeTargetTeamId!].contracts[id];
                    const val = tradeEngine.calculateTradeValue(id, state);

                    return (
                      <div 
                        key={id} 
                        onClick={() => setCpuRequestedIds(prev => isSelected ? prev.filter(x => x !== id) : [...prev, id])} 
                        className={`p-3.5 flex items-center justify-between hover:bg-white/[0.02] cursor-pointer transition-all duration-300 rounded-xl mx-2 my-1 border ${
                          isSelected ? 'bg-white/[0.04] border-white/30 shadow-[0_4px_15px_rgba(255,255,255,0.025)]' : 'border-transparent bg-zinc-950/20'
                        }`}
                      >
                          <div className="flex items-center gap-3 shrink-0 min-w-0">
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0 ${isSelected ? 'bg-white border-white text-black' : 'border-zinc-800 bg-zinc-900'}`}>
                                {isSelected && <Check size={11} strokeWidth={3} />}
                            </div>
                            <div className="w-10 h-10 bg-zinc-900 border border-white/10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center pointer-events-none">
                              <PlayerHeadshot nbaId={card?.nbaId || 0} name={card?.name || ''} />
                            </div>
                            <div className="flex flex-col leading-tight truncate shrink-0 min-w-0">
                                <span className={`text-xs font-black uppercase italic truncate w-32 ${isSelected ? 'text-zinc-200' : 'text-zinc-100'}`}>{card?.name}</span>
                                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5">{card?.position} • ${(contract?.salary / 1e6).toFixed(1)}M</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                              <span className="text-xs font-black text-zinc-200 italic font-mono">{card?.stats?.ovr} OVR</span>
                              <span className="text-[7.5px] font-mono text-zinc-500 uppercase tracking-widest block font-bold leading-none mt-1">CAP VALUE: {Math.round(val)}</span>
                          </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-black/20 gap-3">
                    <HelpCircle className="text-zinc-700 animate-bounce duration-[2000ms]" size={36} />
                    <p className="text-[9px] font-black text-zinc-650 uppercase leading-relaxed tracking-wider max-w-xs">
                      SELECT AN NBA FRANCHISE FROM THE NEGOTIATION DROPDOWN ABOVE TO LOAD THEIR BLOCK
                    </p>
                  </div>
                )}
              </div>

              {/* CPU Draft Picks Block */}
              {tradeTargetTeamId && (
                <div className="p-4 bg-zinc-950 border-t border-white/5 max-h-[140px] overflow-y-auto no-scrollbar">
                  <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex justify-between">
                      TARGET TEAM CAP PICKS
                      <span className="text-white font-extrabold">{cpuRequestedPickIds.length} SELECTED</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                      {state.teams[tradeTargetTeamId].draftPicks.map((pick: any) => {
                        const isSelected = cpuRequestedPickIds.includes(pick.id);
                        return (
                            <button 
                              key={pick.id}
                              onClick={() => setCpuRequestedPickIds(prev => isSelected ? prev.filter(x => x !== pick.id) : [...prev, pick.id])}
                              className={`px-3 py-2 rounded-xl border text-[9px] font-black uppercase transition-all cursor-pointer ${
                                isSelected 
                                  ? 'bg-white border-white text-black font-extrabold shadow-md' 
                                  : 'bg-zinc-900 border-white/5 text-zinc-550 hover:text-white'
                              }`}
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

      {/* FLOAT ACTION BAR FOR DEALS PROPOSITION */}
      <div className="fixed bottom-[94px] md:bottom-4 left-[3%] right-[3%] md:left-1/2 md:right-auto md:-translate-x-1/2 md:max-w-4xl w-[94%] md:w-full h-20 bg-zinc-950/90 backdrop-blur-2xl border border-white/10 rounded-2xl z-[5000] flex items-center justify-between px-6 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          <div className="flex gap-4 md:gap-8 border-r border-white/10 pr-6">
              <div className="space-y-0.5 leading-none">
                <p className="text-[7.5px] font-black text-rose-400 uppercase tracking-widest leading-none mb-1">GIVING AWAY</p>
                <p className="text-xs md:text-sm font-black italic text-zinc-300 uppercase">{userOfferedIds.length} PLR • {userOfferedPickIds.length} PKS</p>
              </div>
              <div className="space-y-0.5 leading-none">
                <p className="text-[7.5px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">RECEIVING BACK</p>
                <p className="text-xs md:text-sm font-black italic text-zinc-100 uppercase">{cpuRequestedIds.length} PLR • {cpuRequestedPickIds.length} PKS</p>
              </div>
          </div>
          
          <button 
            onClick={handleExecuteTrade}
            disabled={userOfferedIds.length === 0 || cpuRequestedIds.length === 0}
            className="h-11 px-8 bg-white hover:bg-amber-500 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] text-black rounded-xl font-black uppercase text-[10px] tracking-widest transition-all duration-300 disabled:opacity-10 active:scale-97 cursor-pointer shrink-0"
          >
              Propose Deal
          </button>
      </div>
    </motion.div>
  );
});

export default TradesTab;
