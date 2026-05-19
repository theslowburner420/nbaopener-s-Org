import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, ChevronRight, Star, Award, User, Target } from 'lucide-react';
import { FranchiseState, PlayerStats, TeamObject } from '../../franchise/types';
import { ALL_CARDS } from '../../data/cards';
import { getTeamLogo } from '../../data/nbaTeams';
import confetti from 'canvas-confetti';

interface SeasonAwardsOverlayProps {
  state: FranchiseState;
  onContinue: () => void;
}

const AWARD_SEQUENCE = [
  { key: 'mvp', title: 'Most Valuable Player', icon: <Trophy className="text-amber-500" /> },
  { key: 'dpoy', title: 'Defensive Player of the Year', icon: <Award className="text-blue-500" /> },
  { key: 'roy', title: 'Rookie of the Year', icon: <Star className="text-green-500" /> },
  { key: 'mip', title: 'Most Improved Player', icon: <Target className="text-purple-500" /> },
  { key: 'allNba', title: 'All-NBA First Team', icon: <User className="text-white" /> }
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

  React.useEffect(() => {
    if (isUserWinner) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [step, isUserWinner]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-12">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentAward.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-12"
          >
            {/* Header */}
            <div className="text-center space-y-4">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center mx-auto"
              >
                {currentAward.icon}
              </motion.div>
              <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white">
                {currentAward.title}
              </h2>
            </div>

             {/* Winner Display */}
            {currentAward.key === 'allNba' ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {allNbaIds.map((pid, idx) => {
                  const card = findCard(pid);
                  const team = Object.values(state.teams as Record<string, TeamObject>).find(t => t.roster.includes(pid));
                  return (
                    <motion.div 
                      key={pid}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-zinc-900 border border-white/5 rounded-2xl p-4 text-center space-y-4 group hover:border-amber-500/50 transition-all"
                    >
                       <div className="aspect-[3/4] bg-zinc-800 rounded-xl overflow-hidden relative border border-white/10">
                          <img 
                            src={card?.nbaId ? `https://cdn.nba.com/headshots/nba/latest/1040x760/${card.nbaId}.png` : card?.imageUrl} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                          />
                          <div className="absolute top-0 right-0 p-1.5">
                             <img src={getTeamLogo(team?.teamId || '')} className="w-5 h-5 object-contain" />
                          </div>
                       </div>
                       <div>
                         <p className="text-[10px] md:text-sm font-black uppercase text-white truncate italic leading-none">{card?.name}</p>
                         <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{team?.abbreviation} • {card?.position}</p>
                       </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : winnerCard ? (
              <div className="bg-zinc-900 border border-white/10 rounded-[3rem] p-8 flex flex-col md:flex-row items-center gap-12 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full" />
                
                <div className="w-48 h-72 rounded-3xl overflow-hidden border-4 border-white/10 relative z-10 shrink-0">
                  <img src={winnerCard.imageUrl} className="w-full h-full object-cover" />
                </div>

                <div className="space-y-6 relative z-10 text-center md:text-left flex-1">
                  <div className="flex items-center justify-center md:justify-start gap-4">
                     <img src={getTeamLogo(winnerTeam?.teamId || '')} className="w-12 h-12 object-contain" />
                     <h3 className="text-3xl md:text-5xl font-black italic uppercase text-white tracking-widest">{winnerCard.name}</h3>
                  </div>
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">{winnerTeam?.name}</p>
                  
                  <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/5">
                    <div>
                      <p className="text-2xl md:text-4xl font-black text-amber-500">{winnerCard.stats?.points || 0}</p>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">PPG</p>
                    </div>
                    <div>
                      <p className="text-2xl md:text-4xl font-black text-amber-500">{winnerCard.stats?.rebounds || 0}</p>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">RPG</p>
                    </div>
                    <div>
                      <p className="text-2xl md:text-4xl font-black text-amber-500">{winnerCard.stats?.assists || 0}</p>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">APG</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
                <div className="text-center text-zinc-500 italic uppercase font-black text-xl">No Eligible Candidates</div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Footer */}
        <div className="flex items-center justify-center">
            <button 
              onClick={handleNext}
              className="px-12 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-3 hover:scale-105 transition-transform active:scale-95 shadow-2xl"
            >
              {step === AWARD_SEQUENCE.length - 1 ? 'Continue to Playoffs' : 'Next Award'}
              <ChevronRight size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default SeasonAwardsOverlay;
