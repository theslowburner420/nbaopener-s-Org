import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Lock, CheckCircle2, ArrowLeft, Coins, Package } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { ACHIEVEMENTS } from '../data/achievements';

const AchievementsView: React.FC = () => {
  const { unlockedAchievements, setCurrentView } = useGame();

  const categories = [
    { id: 'drafting', name: 'Drafting', icon: Trophy },
    { id: 'tournaments', name: 'Tournaments', icon: Trophy },
    { id: 'matches', name: 'In-Match Feats', icon: Trophy },
  ];

  const progress = unlockedAchievements.length;
  const total = ACHIEVEMENTS.length;
  const progressPercentage = (progress / total) * 100;

  return (
    <div className="h-full w-full bg-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setCurrentView('profile')}
            className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
          >
            <ArrowLeft className="text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">Draft Achievements</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Your legacy in the draft</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black text-amber-500">{progress}</span>
            <span className="text-[10px] font-bold text-zinc-600">/ {total}</span>
          </div>
          <div className="w-32 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              className="h-full bg-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-10 pb-24">
        {categories.map((cat) => (
          <div key={cat.id} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
                <cat.icon size={16} className="text-amber-500" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-widest text-white italic">{cat.name}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ACHIEVEMENTS.filter(a => a.category === cat.id).map((achievement) => {
                const isUnlocked = unlockedAchievements.includes(achievement.id);
                const Icon = achievement.icon;

                return (
                  <motion.div
                    key={achievement.id}
                    whileHover={{ scale: 1.02 }}
                    className={`relative p-5 rounded-3xl border-2 transition-all duration-500 overflow-hidden ${
                      isUnlocked 
                        ? 'bg-zinc-900/40 border-amber-500/30 shadow-[0_10px_30px_rgba(245,158,11,0.05)]' 
                        : 'bg-zinc-950 border-zinc-900 opacity-60'
                    }`}
                  >
                    {/* Background Glow for Unlocked */}
                    {isUnlocked && (
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[40px] -translate-y-1/2 translate-x-1/2" />
                    )}

                    <div className="flex gap-4 relative z-10">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                        isUnlocked ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-zinc-900 text-zinc-700'
                      }`}>
                        {isUnlocked ? <Icon size={28} /> : <Lock size={24} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className={`font-black uppercase italic truncate ${isUnlocked ? 'text-white' : 'text-zinc-500'}`}>
                            {achievement.title}
                          </h3>
                          {isUnlocked && <CheckCircle2 size={16} className="text-green-500 shrink-0" />}
                        </div>
                        <p className="text-xs text-zinc-500 leading-tight mb-3">
                          {achievement.description}
                        </p>
                        
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                          isUnlocked ? 'bg-green-500/10 text-green-500' : 'bg-zinc-900 text-zinc-600'
                        }`}>
                          {achievement.rewards[0].type === 'coins' ? <Coins size={12} /> : <Package size={12} />}
                          <span>{achievement.rewardText}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchievementsView;
