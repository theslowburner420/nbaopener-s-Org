import React from 'react';
import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';
import { Achievement } from '../types';

interface AchievementToastProps {
  achievement: Achievement;
}

const AchievementToast: React.FC<AchievementToastProps> = ({ achievement }) => {
  const Icon = achievement.icon || Trophy;
  
  return (
    <motion.div
      initial={{ y: -100, opacity: 0, scale: 0.8 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -50, opacity: 0, scale: 0.9 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        duration: 0.5 
      }}
      className="w-full max-w-[340px] bg-black/80 backdrop-blur-xl border border-yellow-500/30 rounded-2xl p-4 shadow-2xl flex items-center space-x-4 pointer-events-auto"
    >
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 flex items-center justify-center shadow-lg shrink-0">
        <Icon className="text-white" size={24} />
      </div>
      
      <div className="flex-1 overflow-hidden">
        <h3 className="text-[10px] text-yellow-500 uppercase tracking-[0.2em] font-black italic leading-none mb-1">
          Achievement Unlocked
        </h3>
        <p className="text-sm font-bold text-white truncate uppercase italic tracking-tighter">
          {achievement.title}
        </p>
        <div className="flex items-center mt-1">
          <span className="text-[9px] text-zinc-400 uppercase font-bold tracking-widest mr-2">Reward:</span>
          <span className="text-[10px] text-green-400 font-black italic tracking-tighter uppercase">
            {achievement.reward}
          </span>
        </div>
      </div>
      
      {/* Decorative gold corner */}
      <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[200%] h-[200%] bg-yellow-500/10 rotate-45 translate-x-[50%] -translate-y-[50%]" />
      </div>
    </motion.div>
  );
};

export default React.memo(AchievementToast);
