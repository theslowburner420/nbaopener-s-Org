import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trophy, ChevronRight, Zap, RefreshCw, AlertCircle } from 'lucide-react';
import { getTeamLogo } from '../../data/nbaTeams';

interface DraftLotteryOverlayProps {
  picks: string[];
  teams: any;
  onComplete: () => void;
}

const DraftLotteryOverlay: React.FC<DraftLotteryOverlayProps> = ({ picks, teams, onComplete }) => {
  // We reveal from Pick 14 down to Pick 1 (indexes 13 down to 0 in the picks array)
  // Non-lottery picks (15-30, i.e., indexes 14-29) are pre-revealed in the background.
  const [step, setStep] = useState(0); // 0: Intro/Tombola Active, 1: Shuffling/Draw Phase, 2: Completed Resume Order
  const [currentLotteryIndex, setCurrentLotteryIndex] = useState(13); // Start draft lottery drawing at Pick 14 (index 13)
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawnTeamId, setDrawnTeamId] = useState<string | null>(null);
  const [revealedLotteryPicks, setRevealedLotteryPicks] = useState<Record<number, string>>({}); // pickNumber (1-14) -> teamId

  // Generate 14 colorful bouncing balls in the tombola globe
  const tombolaBalls = useMemo(() => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 
      'bg-[rgb(168,85,247)]', 'bg-[rgb(99,102,241)]', 'bg-pink-500', 'bg-orange-500',
      'bg-teal-500', 'bg-yellow-400', 'bg-cyan-500', 'bg-rose-500',
      'bg-lime-500', 'bg-fuchsia-500'
    ];
    return Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      color: colors[i % colors.length],
      // random initial delay and offset for chaotic css movement
      delay: `${Math.random() * -3}s`,
      duration: `${1.2 + Math.random() * 1.5}s`,
      left: `${20 + Math.random() * 60}%`,
      top: `${30 + Math.random() * 50}%`,
      tx: Math.random() > 0.5 ? 40 : -40,
      ty: Math.random() > 0.5 ? 30 : -30,
    }));
  }, []);

  // Compute original rank sorted by inverse wins (from lowest wins to highest) 
  // to show if they climbed or fell in the lottery!
  const standingOriginalRanks = useMemo(() => {
    const sortedTeams = Object.values(teams)
      .filter((t: any) => !t.isPlayoffs) // non-playoff teams
      .sort((a: any, b: any) => a.wins - b.wins); // lowest wins on top
    
    const ranks: Record<string, number> = {};
    sortedTeams.forEach((t: any, idx) => {
      ranks[t.id] = idx + 1; // expected pick number based on records (1 to 14)
    });
    return ranks;
  }, [teams]);

  const drawNextBallInstance = () => {
    if (isDrawing) return;
    setIsDrawing(true);
    setDrawnTeamId(null);

    // Suspense delay
    setTimeout(() => {
      const drawnId = picks[currentLotteryIndex];
      const pickNumber = currentLotteryIndex + 1; // 1-indexed (e.g., 14, 13, ..., 1)

      setDrawnTeamId(drawnId);
      setRevealedLotteryPicks(prev => ({ ...prev, [pickNumber]: drawnId }));
      setIsDrawing(false);
    }, 1200);
  };

  const handleNextDrawStep = () => {
    if (currentLotteryIndex > 0) {
      setCurrentLotteryIndex(prev => prev - 1);
      setDrawnTeamId(null);
    } else {
      // Finished drawing Top 14 picks, go to full summary step
      setStep(2);
    }
  };

  const isEnteringTop4 = currentLotteryIndex <= 3;

  return (
    <div className={`fixed inset-0 z-[5000] bg-black/98 backdrop-blur-3xl overflow-y-auto pb-24 font-sans selection:bg-amber-500/20 px-4 transition-all duration-500 ${isEnteringTop4 && step === 1 ? 'shadow-[inset_0_0_100px_rgba(245,158,11,0.15)] bg-zinc-950' : ''}`}>
      <div className="max-w-4xl mx-auto pt-10 md:pt-16 space-y-10">
        
        {/* Header section */}
        <div className="text-center space-y-4">
           <motion.div 
             initial={{ scale: 0 }} 
             animate={{ scale: 1 }}
             className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto border border-white/10 shadow-2xl"
           >
              <Sparkles className="text-amber-500" size={32} />
           </motion.div>
           <div className="space-y-2">
              <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white">Draft Lottery</h2>
              <p className="text-zinc-500 font-bold uppercase tracking-[0.4em] text-[9px]">Ping-Pong Machine Simulator</p>
           </div>
        </div>

        {/* 1. INTRO / EXPLANATION MODE */}
        {step === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900/40 border border-white/10 rounded-[2.5rem] p-8 md:p-12 text-center space-y-8"
          >
            <div className="max-w-md mx-auto space-y-4 text-center">
              <p className="text-zinc-400 text-sm md:text-base font-medium leading-relaxed">
                The ping-pong machine is fully pressurized and ready. 14 ball claims represents 14 clubs looking to change their franchise vector with the #1 overall pick.
              </p>
              
              {/* Tombola preview simulation */}
              <div className="w-52 h-52 rounded-full border-4 border-white/15 relative bg-zinc-950/80 shadow-[inset_0_0_40px_rgba(245,158,11,0.2)] flex items-center justify-center overflow-hidden mx-auto my-6 p-4">
                {/* Simulated stand */}
                <div className="absolute inset-y-0 left-1/2 -ml-0.5 w-1 bg-white/10" />
                
                {/* 14 bouncing circles using framer-motion looping */}
                {tombolaBalls.map((ball) => (
                  <motion.div
                    key={ball.id}
                    className={`absolute w-5 h-5 rounded-full ${ball.color} border border-white/20`}
                    animate={{
                      x: [0, ball.tx, -ball.tx, ball.tx / 2, 0],
                      y: [0, ball.ty, ball.ty, -ball.ty / 2, 0],
                    }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{ left: ball.left, top: ball.top }}
                  />
                ))}
                
                <div className="absolute bottom-2 inset-x-0 text-center">
                  <span className="text-[7px] font-black uppercase text-zinc-500 bg-black/65 px-2 py-0.5 rounded border border-white/5 tracking-widest leading-none">STANDBY</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                     <p className="text-[9px] font-bold text-zinc-550 uppercase mb-0.5">Top Probabilities</p>
                     <p className="text-xs font-black text-white italic truncate">{teams[picks[0]]?.name}</p>
                  </div>
                  <div className="bg-black/50 p-4 rounded-xl border border-white/5">
                     <p className="text-[9px] font-bold text-zinc-550 uppercase mb-0.5">Sleeper Seeding</p>
                     <p className="text-xs font-black text-amber-500 italic truncate">{teams[picks[2]]?.name || 'Contender'}</p>
                  </div>
              </div>
            </div>

            <button 
              onClick={() => setStep(1)}
              className="px-12 py-4 bg-white text-black hover:bg-amber-500 rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_15px_30px_rgba(255,255,255,0.05)] duration-200"
            >
              Start Drawing Process
            </button>
          </motion.div>
        )}

        {/* 2. LIVE DRAWING BOARD (PICK 14 TO 1 BACKWARDS) */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            {/* Interactive Tombola Globe */}
            <div className="bg-zinc-900/40 border border-white/15 p-6 rounded-[2rem] text-center space-y-6 lg:sticky lg:top-10">
              <h3 className="text-xs font-black uppercase text-zinc-550 tracking-[0.2em]">LIVE LOTTERY MACHINE</h3>
              
              {/* Spherical container with rotating CSS balls */}
              <div className="w-48 h-48 md:w-56 md:h-56 rounded-full border-4 border-amber-500/20 relative bg-zinc-950/90 shadow-[inset_0_0_50px_rgba(245,158,11,0.15)] flex items-center justify-center overflow-hidden mx-auto p-4 border-double">
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/0 via-amber-500/5 to-transparent pointer-events-none" />
                
                {tombolaBalls.map(ball => (
                  <motion.div
                    key={ball.id}
                    className={`absolute w-5 h-5 rounded-full ${ball.color} border border-white/25 shadow-md`}
                    animate={{
                      x: isDrawing ? 
                        [0, ball.tx * 1.5, -ball.tx * 2, ball.tx, 0] : 
                        [0, ball.tx / 2, -ball.tx / 2, ball.tx / 4, 0],
                      y: isDrawing ? 
                        [0, -ball.ty * 1.8, ball.ty * 1.4, -ball.ty, 0] : 
                        [0, ball.ty / 2, -ball.ty / 2, ball.ty / 4, 0]
                    }}
                    transition={{
                      duration: isDrawing ? 0.6 : 2.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{ left: ball.left, top: ball.top }}
                  />
                ))}

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-zinc-550 opacity-20 pointer-events-none text-xs font-black uppercase tracking-widest select-none">
                  PRESSURE
                </div>
              </div>

              {/* High tension/entering top 4 banner */}
              {isEnteringTop4 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: [0.5, 1, 0.5], scale: 1 }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl flex items-center justify-center gap-2 text-red-500 font-extrabold uppercase italic font-mono text-[9px] tracking-wider"
                >
                  <AlertCircle size={14} /> HIGH TENSION: ENTERING THE TOP 4!
                </motion.div>
              )}

              {/* Control Draw Action */}
              <div className="space-y-4">
                <p className="text-[10px] font-black text-zinc-400">CURRENT STEP: REVEALING PICK {currentLotteryIndex + 1}</p>
                
                {!drawnTeamId && (
                  <button
                    onClick={drawNextBallInstance}
                    disabled={isDrawing}
                    className="w-full py-4 bg-amber-500 text-black font-black uppercase tracking-widest text-xs rounded-xl shadow-[0_10px_20px_rgba(245,158,11,0.2)] hover:bg-amber-400 transition-all flex items-center justify-center gap-2"
                  >
                    {isDrawing ? (
                      <>
                        <RefreshCw className="animate-spin" size={16} />
                        <span>Churning Ping-Pongs...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        <span>Draw Ball {currentLotteryIndex + 1}</span>
                      </>
                    )}
                  </button>
                )}

                {drawnTeamId && (
                  <button
                    onClick={handleNextDrawStep}
                    className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-xs rounded-xl shadow-lg hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 animate-bounce"
                  >
                    <span>Proceed to Pick {currentLotteryIndex}</span>
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Revealed ball animation display and results history */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Drawn Ball Spotlight Component */}
              <AnimatePresence mode="wait">
                {drawnTeamId ? (
                  <motion.div
                    key={drawnTeamId}
                    initial={{ scale: 0.7, rotate: -25, opacity: 0 }}
                    animate={{ scale: 1.15, rotate: 0, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 20 }}
                    className="bg-gradient-to-br from-amber-500 to-amber-600 text-black p-8 rounded-[3rem] text-center space-y-4 shadow-[0_25px_60px_rgba(245,158,11,0.4)] relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-xl rounded-full" />
                    
                    <p className="text-[9px] font-black tracking-widest opacity-60 uppercase">DRAFT LOTTERY SECURED BALL</p>
                    <h4 className="text-5xl md:text-7xl font-sans font-black italic">#{currentLotteryIndex + 1} PICK</h4>
                    
                    <div className="w-20 h-20 bg-white rounded-3xl p-3 mx-auto shadow-2xl flex items-center justify-center">
                      <img src={getTeamLogo(drawnTeamId)} className="w-[85%] h-[85%] object-contain" />
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-2xl font-black uppercase tracking-tight italic">{teams[drawnTeamId]?.name}</p>
                      <p className="text-[9px] font-extrabold opacity-60 uppercase tracking-widest">
                        Projected Original Seeding Rank: #{standingOriginalRanks[drawnTeamId] || '?'}
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <div className="border border-dashed border-white/10 rounded-[3rem] py-20 text-center text-zinc-650 flex flex-col items-center justify-center gap-3">
                    <Trophy size={48} className="opacity-15 animate-pulse" />
                    <p className="text-xs font-black tracking-widest uppercase">Waiting for Draw Ignition...</p>
                  </div>
                )}
              </AnimatePresence>

              {/* Incremental visual drawing history */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black tracking-widest text-zinc-550 uppercase">REVEALED SECTOR</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                  {Object.entries(revealedLotteryPicks)
                    .sort((a, b) => Number(b[0]) - Number(a[0])) // show descending order (highest pick number first)
                    .map(([pickNumStr, teamId]) => {
                      const pickNum = Number(pickNumStr);
                      const teamIdStr = teamId as string;
                      const t = teams[teamIdStr];
                      return (
                        <div key={pickNum} className="bg-zinc-900/60 border border-white/5 p-3 rounded-2xl flex items-center gap-4">
                          <span className="font-mono text-zinc-500 text-xs font-bold leading-none">#{pickNum}</span>
                          <img src={getTeamLogo(teamIdStr)} className="w-7 h-7 object-contain" />
                          <div className="leading-tight shrink-0 min-w-0">
                            <p className="text-xs font-black text-white italic truncate pr-2">{t?.abbreviation}</p>
                            <p className="text-[8px] font-medium text-zinc-550 uppercase">Pick Drawn</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. FINAL SUMMARY TRANSITION TABLE */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in duration-800">
              <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/30 p-8 rounded-[3rem] text-center space-y-4">
                 <h3 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-none">Official Draft Order</h3>
                 <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Pick 1 secured by {teams[picks[0]]?.name}</p>
              </div>

              {/* Order summary comparing calculated climbed standing */}
              <div className="bg-zinc-900/30 border border-white/15 p-6 rounded-[2.5rem] space-y-3">
                  <h4 className="text-[10px] font-black tracking-widest text-zinc-550 uppercase">Standings Order (1-30)</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-2 no-scrollbar">
                     {picks.map((teamId, i) => {
                       const pickNum = i + 1;
                       const team = teams[teamId];
                       const expectedPick = standingOriginalRanks[teamId] || pickNum;
                       const diff = expectedPick - pickNum; // positive: climbed, negative: fell down

                       return (
                         <div key={pickNum} className="bg-zinc-950/60 border border-white/5 px-4 py-3 rounded-2xl flex items-center justify-between gap-4">
                           <div className="flex items-center gap-4 min-w-0">
                             <span className="font-mono text-xs font-black text-zinc-650">#{pickNum}</span>
                             <div className="w-8 h-8 bg-black rounded-lg p-1.5 border border-white/5 flex items-center justify-center shrink-0">
                               <img src={getTeamLogo(teamId)} className="w-full h-full object-contain" />
                             </div>
                             <div className="leading-none shrink-0 min-w-0">
                               <h5 className="font-black uppercase text-xs text-white italic truncate max-w-[130px]">{team?.name}</h5>
                               <p className="text-[7px] font-bold text-zinc-550 uppercase tracking-widest">Expected Seeding: #{expectedPick}</p>
                             </div>
                           </div>

                           {/* Climbed indicators */}
                           {diff !== 0 ? (
                             <span className={`text-[9px] font-black font-mono px-2 py-0.5 rounded ${diff > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-500'}`}>
                               {diff > 0 ? `▲ +${diff}` : `▼ ${diff}`}
                             </span>
                           ) : (
                             <span className="text-[8px] font-bold text-zinc-600 font-mono">-</span>
                           )}
                         </div>
                       );
                     })}
                  </div>
              </div>

              <button 
                onClick={onComplete}
                className="w-full py-5 bg-white text-black hover:bg-amber-500 rounded-3xl font-black uppercase tracking-widest text-xs hover:scale-[1.01] active:scale-[0.99] transition-all shadow-2xl duration-200"
              >
                Enter Draft War Room Pool
              </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DraftLotteryOverlay;
