import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, ChevronRight, Loader2 } from 'lucide-react';
import { getTeamLogo } from '../../data/nbaTeams';

interface DraftLotteryOverlayProps {
  picks: string[];
  teams: any;
  onComplete: () => void;
}

const DraftLotteryOverlay: React.FC<DraftLotteryOverlayProps> = ({ picks, teams, onComplete }) => {
  const [step, setStep] = useState(0); // 0: Intro, 1: Revealed backward 30-5, 2: Reveal 4, 3: Reveal 3, 4: Reveal 2, 5: Reveal 1, 6: Summary
  const [isRevealing, setIsRevealing] = useState(false);

  useEffect(() => {
    if (step === 1) {
       // Auto reveal background picks
       const timer = setTimeout(() => setStep(2), 2000);
       return () => clearTimeout(timer);
    }
  }, [step]);

  const renderDraftPick = (pickNum: number, teamId: string, isBig = false) => {
    const team = teams[teamId];
    return (
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`${isBig ? 'bg-amber-500 text-black p-8 rounded-[3rem]' : 'bg-zinc-900 border border-white/5 p-4 rounded-2xl'} flex items-center justify-between gap-6 transition-all shadow-2xl shadow-black/50`}
      >
        <div className="flex items-center gap-6">
          <span className={`text-xl font-black italic ${isBig ? 'text-black/40' : 'text-zinc-700'}`}>#{pickNum}</span>
          <div className={`w-12 h-12 md:w-16 md:h-16 ${isBig ? 'bg-white' : 'bg-black'} rounded-2xl p-3 border border-black/5`}>
            <img src={getTeamLogo(teamId)} className="w-full h-full object-contain" />
          </div>
          <div className="space-y-1">
             <h4 className={`text-xl md:text-3xl font-black uppercase italic tracking-tighter ${isBig ? 'text-black' : 'text-white'}`}>{team.name}</h4>
             <p className={`text-[10px] font-bold uppercase tracking-widest ${isBig ? 'text-black/60' : 'text-zinc-600'}`}>{team.conference}ern Conference</p>
          </div>
        </div>
        {isBig && <Trophy size={32} className="text-black/20" />}
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-3xl overflow-y-auto pb-20">
      <div className="max-w-4xl mx-auto pt-10 md:pt-20 px-4 space-y-12">
        <div className="text-center space-y-4">
           <motion.div 
             initial={{ scale: 0 }} animate={{ scale: 1 }}
             className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto border border-white/10 shadow-2xl"
           >
              <Sparkles className="text-amber-500" size={40} />
           </motion.div>
           <div className="space-y-2">
              <h2 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter text-white">Draft Lottery</h2>
              <p className="text-zinc-500 font-bold uppercase tracking-[0.5em] text-xs">Determining the future of the league</p>
           </div>
        </div>

        <div className="space-y-4">
           {step === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-zinc-900/50 border border-white/5 rounded-[3rem] p-12 text-center space-y-8"
              >
                 <div className="space-y-4 max-w-md mx-auto">
                    <p className="text-zinc-400 font-medium leading-relaxed">The ping-pong balls are ready. 14 teams, one destiny. Who will secure the first overall pick?</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                           <p className="text-[10px] font-black text-zinc-600 uppercase mb-1">Lottery Favorites</p>
                           <p className="text-sm font-black text-white italic">{teams[picks[0]]?.name}</p>
                        </div>
                        <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                           <p className="text-[10px] font-black text-zinc-600 uppercase mb-1">Sleeper Teams</p>
                           <p className="text-sm font-black text-white italic">{teams[picks[3]]?.name}</p>
                        </div>
                    </div>
                 </div>
                 <button 
                   onClick={() => setStep(1)}
                   className="px-12 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-500 transition-all shadow-2xl"
                 >
                   Begin Results Reveal
                 </button>
              </motion.div>
           )}

           {step >= 1 && step < 6 && (
              <div className="space-y-6">
                 {/* Top Revealed Pick */}
                 <AnimatePresence mode="wait">
                    {step >= 2 && (
                       <motion.div 
                         key={step}
                         initial={{ scale: 0.8, opacity: 0 }} 
                         animate={{ scale: 1, opacity: 1 }}
                         exit={{ scale: 1.1, opacity: 0 }}
                         className="space-y-4"
                       >
                          <p className="text-center text-[10px] font-black text-amber-500 uppercase tracking-[0.5em] animate-pulse">Now Revealing</p>
                          {renderDraftPick(6 - step, picks[5 - step], true)}
                          <div className="flex justify-center pt-8">
                             <button 
                               onClick={() => setStep(step + 1)}
                               className="px-12 py-4 bg-zinc-900 border border-white/10 text-white rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-white hover:text-black transition-all flex items-center gap-3"
                             >
                               Next Pick <ChevronRight size={14} />
                             </button>
                          </div>
                       </motion.div>
                    )}
                    {step === 1 && (
                      <div className="flex flex-col items-center justify-center py-20 gap-4">
                         <Loader2 className="text-zinc-800 animate-spin" size={48} />
                         <p className="text-xs font-black text-zinc-700 uppercase tracking-widest italic">Calculating Picks 5-30...</p>
                      </div>
                    )}
                 </AnimatePresence>
              </div>
           )}

           {step === 6 && (
              <div className="space-y-8 animate-in fade-in duration-700">
                  <div className="bg-amber-500/10 border border-amber-500/30 p-8 rounded-[3rem] text-center space-y-4">
                     <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">Full Draft Order</h3>
                     <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Pick 1 Secured by {teams[picks[0]]?.name}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                     {picks.map((teamId, i) => renderDraftPick(i + 1, teamId))}
                  </div>
                  <button 
                    onClick={onComplete}
                    className="w-full py-6 bg-white text-black rounded-3xl font-black uppercase tracking-widest text-sm hover:bg-amber-500 transition-all shadow-2xl shadow-white/5 active:scale-95"
                  >
                    Proceed to Draft Pool
                  </button>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default DraftLotteryOverlay;
