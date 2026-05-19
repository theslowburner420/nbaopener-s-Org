import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ChevronRight, Star, Award, User, Target, Sparkles } from 'lucide-react';
import { FranchiseState, PlayerStats, TeamObject } from '../../franchise/types';
import { ALL_CARDS } from '../../data/cards';
import { getTeamLogo } from '../../data/nbaTeams';
import confetti from 'canvas-confetti';

interface SeasonAwardsOverlayProps {
  state: FranchiseState;
  onContinue: () => void;
}

const AWARD_SEQUENCE = [
  { key: 'mvp', title: 'Most Valuable Player', icon: <Trophy className="text-amber-500 w-10 h-10" /> },
  { key: 'dpoy', title: 'Defensive Player of the Year', icon: <Award className="text-blue-500 w-10 h-10" /> },
  { key: 'roy', title: 'Rookie of the Year', icon: <Star className="text-green-400 w-10 h-10" /> },
  { key: 'mip', title: 'Most Improved Player', icon: <Target className="text-purple-400 w-10 h-10" /> },
  { key: 'allNba', title: 'All-NBA First Team', icon: <User className="text-white w-10 h-10" /> }
];

const SeasonAwardsOverlay: React.FC<SeasonAwardsOverlayProps> = ({ state, onContinue }) => {
  const [step, setStep] = useState(0);
  const currentAward = AWARD_SEQUENCE[step];
  
  const awards = state.awards[state.season] || {} as any;
  const winnerId = Array.isArray(awards[currentAward.key]) ? null : awards[currentAward.key] as string;
  const allNbaIds = Array.isArray(awards[currentAward.key]) ? awards[currentAward.key] as string[] : [];

  const findCard = (id: string) => {
    return ALL_CARDS.find(c => c.id === id) || 
           state.customCards?.find(c => c.id === id) || 
           state.draftPool?.find(c => (c as any).id === id);
  };

  const winnerCard = winnerId ? findCard(winnerId) : null;
  const winnerTeam = winnerId ? Object.values(state.teams as Record<string, TeamObject>).find(t => t.roster.includes(winnerId)) : null;

  const handleNext = () => {
    if (step < AWARD_SEQUENCE.length - 1) {
      setStep(step + 1);
    } else {
      onContinue();
    }
  };

  const isUserWinner = winnerId && winnerTeam?.isHuman;

  useEffect(() => {
    if (isUserWinner) {
      // Majestic multi-burst confetti
      const duration = 2.5 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#fbbf24', '#f59e0b', '#ffffff']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#fbbf24', '#f59e0b', '#ffffff']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [step, isUserWinner]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4 overflow-y-auto select-none">
      {/* Cinematic Spotlights */}
      <div className="absolute inset-0 bg-radial-gradient from-amber-500/10 via-transparent to-black pointer-events-none opacity-50" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      <div className="max-w-4xl w-full space-y-8 md:space-y-12 relative z-10 py-8">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentAward.key}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-8 md:space-y-12"
          >
            {/* Header / Spotlight Banner */}
            <div className="text-center space-y-3">
              <motion.div 
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                className="w-20 h-20 bg-gradient-to-br from-zinc-900 to-black border border-amber-500/30 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,158,11,0.2)]"
              >
                {currentAward.icon}
              </motion.div>
              <span className="text-[10px] font-black tracking-[0.4em] text-amber-500 uppercase block">GALA AWARDS NIGHT</span>
              <h2 className="text-3xl md:text-6.5xl font-black italic uppercase tracking-tighter text-white leading-none">
                {currentAward.title}
              </h2>
            </div>

            {/* Winner Display */}
            {currentAward.key === 'allNba' ? (
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                {allNbaIds.map((pid, idx) => {
                  const card = findCard(pid);
                  const team = Object.values(state.teams as Record<string, TeamObject>).find(t => t.roster.includes(pid));
                  return (
                    <motion.div 
                      key={pid}
                      initial={{ opacity: 0, scale: 0.8, y: 40 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: idx * 0.12, type: 'spring', stiffness: 80 }}
                      className="bg-gradient-to-b from-amber-500/10 to-zinc-950 border-2 border-amber-500/20 hover:border-amber-400 group rounded-[2rem] p-4 text-center space-y-4 shadow-[0_0_15px_rgba(245,158,11,0.08)] hover:shadow-[0_0_30px_rgba(245,158,11,0.25)] transition-all relative overflow-hidden"
                    >
                       <div className="absolute inset-0 bg-radial-gradient from-amber-500/5 via-transparent to-transparent pointer-events-none" />
                       <div className="aspect-[3/4] bg-black/40 rounded-2xl overflow-hidden relative border border-white/10 flex items-center justify-center">
                          <img 
                            src={card?.nbaId ? `https://cdn.nba.com/headshots/nba/latest/1040x760/${card.nbaId}.png` : card?.imageUrl} 
                            className="w-full h-full object-contain scale-110 group-hover:scale-120 transition-transform duration-300" 
                          />
                          <div className="absolute top-2 right-2 bg-black/80 backdrop-blur rounded-lg p-1.5 border border-white/10 shadow-lg animate-pulse">
                             <img src={getTeamLogo(team?.teamId || '')} className="w-4 h-4 object-contain" />
                          </div>
                          {/* Position Badge outside logo */}
                          <div className="absolute bottom-2 left-2 bg-amber-500 text-black text-[7px] font-black uppercase px-2 py-0.5 rounded italic">
                            {card?.position}
                          </div>
                       </div>
                       <div>
                         <p className="text-[11px] md:text-sm font-black uppercase text-white truncate italic leading-none">{card?.name}</p>
                         <p className="text-[8.5px] font-black text-amber-500 uppercase tracking-widest mt-1.5">{team?.abbreviation} • ALL-NBA</p>
                       </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : winnerCard ? (
              <div className="bg-gradient-to-br from-zinc-900/90 via-black to-black border-2 border-amber-500/35 rounded-[3rem] p-6 md:p-10 flex flex-col md:flex-row items-center gap-8 md:gap-12 overflow-hidden relative shadow-[0_0_50px_rgba(245,158,11,0.15)] max-w-3xl mx-auto">
                <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none animate-pulse" />
                <div className="absolute bottom-0 left-0 w-44 h-44 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none" />

                {/* Left: Player holographic-like frame */}
                <div className="relative w-44 h-64 md:w-56 md:h-80 rounded-[2.5rem] bg-zinc-950/60 overflow-hidden border border-white/15 shrink-0 shadow-2xl group flex items-center justify-center">
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/40 to-transparent h-24 z-10" />
                  <img 
                    src={winnerCard.nbaId ? `https://cdn.nba.com/headshots/nba/latest/1040x760/${winnerCard.nbaId}.png` : winnerCard.imageUrl} 
                    className="w-full h-full object-contain scale-110 z-0 transition-transform duration-500 group-hover:scale-115" 
                  />
                  <div className="absolute bottom-4 z-20 text-center inset-x-0">
                    <span className="text-[8px] font-black bg-amber-500 text-black px-2.5 py-0.5 rounded-full uppercase italic tracking-wider">
                      ★ {winnerCard.position} ★
                    </span>
                  </div>
                </div>

                {/* Right: Awards Card information */}
                <div className="space-y-6 relative z-10 text-center md:text-left flex-1 min-w-0">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center md:justify-start gap-3.5">
                       <div className="w-10 h-10 bg-zinc-900 border border-white/5 p-1.5 rounded-xl shrink-0">
                         <img src={getTeamLogo(winnerTeam?.teamId || '')} className="w-full h-full object-contain" />
                       </div>
                       <h3 className="text-2xl md:text-4xl font-extrabold italic uppercase text-white tracking-tight truncate leading-none">
                         {winnerCard.name}
                       </h3>
                    </div>
                    <p className="text-amber-500/90 font-black uppercase tracking-widest text-[9.5px]">{winnerTeam?.name}</p>
                  </div>

                  <div className="py-4 border-y border-white/5 grid grid-cols-3 gap-4 md:gap-8">
                    <div className="leading-tight">
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Points</span>
                      <p className="text-xl md:text-3xl font-black italic text-white font-mono leading-none">
                        {(winnerCard.stats?.points ?? 18.5).toFixed(1)}
                      </p>
                      <span className="text-[7.5px] font-black text-amber-500 block uppercase italic tracking-tighter mt-1">PPG</span>
                    </div>
                    <div className="leading-tight">
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Rebounds</span>
                      <p className="text-xl md:text-3xl font-black italic text-white font-mono leading-none">
                        {(winnerCard.stats?.rebounds ?? 6.2).toFixed(1)}
                      </p>
                      <span className="text-[7.5px] font-black text-amber-500 block uppercase italic tracking-tighter mt-1">RPG</span>
                    </div>
                    <div className="leading-tight">
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Assists</span>
                      <p className="text-xl md:text-3xl font-black italic text-white font-mono leading-none">
                        {(winnerCard.stats?.assists ?? 5.1).toFixed(1)}
                      </p>
                      <span className="text-[7.5px] font-black text-amber-500 block uppercase italic tracking-tighter mt-1">APG</span>
                    </div>
                  </div>

                  {/* Highlights / Ring Dominance indicators */}
                  {isUserWinner && (
                    <div className="bg-amber-500/10 border border-amber-500/25 px-4.5 py-3 rounded-2xl flex items-center gap-3.5 max-w-md mx-auto md:mx-0">
                      <Sparkles className="text-amber-500 shrink-0 w-5 h-5 animate-pulse" />
                      <div className="text-left shrink-0">
                        <p className="text-[9px] font-black text-white uppercase italic leading-none animate-bounce">FRANCHISE GLORY SECURED</p>
                        <p className="text-[7.5px] font-medium text-amber-400 uppercase tracking-widest mt-1">YOUR OWN TEAM WINNER ACCLAIMED!</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
                <div className="text-center text-zinc-500 italic uppercase font-black text-xl">No Eligible Candidates</div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="flex items-center justify-center pt-4">
            <button 
              onClick={handleNext}
              className="px-12 py-5 bg-white text-black hover:bg-amber-500 hover:text-black rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs flex items-center gap-3 hover:scale-103 active:scale-97 transition-all duration-150 shadow-2xl"
            >
              {step === AWARD_SEQUENCE.length - 1 ? 'Go to Playoffs Bracket' : 'Next Season Award'}
              <ChevronRight size={18} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default SeasonAwardsOverlay;
