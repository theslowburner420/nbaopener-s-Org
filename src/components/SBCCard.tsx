import React from 'react';
import { motion } from 'motion/react';
import { Card, Rarity } from '../types';

interface SBCCardProps {
  card: Card;
  size?: 'sm' | 'md' | 'lg';
  isRevealed?: boolean;
}

const RARITY_CONFIG: Record<string, { 
  class: string; 
  badge: string; 
  particleColor?: string;
  textColor?: string;
  ovrColor?: string;
}> = {
  'future_star': { class: 'card-future-star', badge: 'FUTURE STAR', particleColor: '#00ff88', ovrColor: 'text-white' },
  'moments_sbc': { class: 'card-moments-sbc', badge: 'MOMENTS', particleColor: '#ffffff', ovrColor: 'text-black' },
  'icon_sbc': { class: 'card-icon-sbc', badge: 'ICON', particleColor: '#ffd700', ovrColor: 'text-gold' },
  'legend_sbc': { class: 'card-legend-sbc', badge: 'LEGEND', particleColor: '#ffb300', ovrColor: 'text-amber-500' },
  'galaxy': { class: 'card-galaxy-sbc', badge: 'GALAXY', particleColor: '#00e5ff', ovrColor: 'text-cyan-400' },
  'invincible': { class: 'card-invincible-sbc', badge: 'INVINCIBLE', particleColor: 'rainbow', ovrColor: 'text-white text-shadow-holo' },
};

const SBCCard: React.FC<SBCCardProps> = ({ card, size = 'md', isRevealed = true }) => {
  const config = RARITY_CONFIG[card.rarity] || { class: 'bg-zinc-800', badge: 'SPECIAL', ovrColor: 'text-white' };
  
  const sizeClasses = {
    sm: 'w-[100px]',
    md: 'w-[160px]',
    lg: 'w-[280px]',
  };

  const textSizes = {
    sm: { ovr: 'text-xl', name: 'text-[8px]', pos: 'text-[6px]', stat: 'text-[8px]', label: 'text-[4px]' },
    md: { ovr: 'text-3xl', name: 'text-xs', pos: 'text-[8px]', stat: 'text-sm', label: 'text-[6px]' },
    lg: { ovr: 'text-6xl', name: 'text-xl', pos: 'text-sm', stat: 'text-2xl', label: 'text-[10px]' },
  };

  const ts = textSizes[size];

  return (
    <motion.div 
      layout
      initial={!isRevealed ? { rotateY: 180 } : {}}
      animate={{ rotateY: 0 }}
      transition={{ duration: 1.2, ease: "softBezier" }}
      className={`${sizeClasses[size]} fifa-card-pro rounded-xl relative overflow-hidden shadow-2xl flex flex-col font-condensed group ${config.class}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Rarity Specific Background Effects */}
      {card.rarity === 'legend_sbc' && <div className="glow-ring" />}
      {card.rarity === 'galaxy' && <div className="stars" />}
      {card.rarity === 'invincible' && <div className="rainbow-glow" />}

      {/* Card Header */}
      <div className="flex justify-between items-start p-[6%] z-10">
        <div className={`flex flex-col items-center gap-0 leading-none`}>
          <span className={`${ts.ovr} font-black ${config.ovrColor}`}>{card.stats.ovr}</span>
          <span className={`${size === 'lg' ? 'text-lg' : 'text-[8px]'} font-bold opacity-80 ${card.rarity === 'moments_sbc' ? 'text-black' : 'text-white'}`}>OVR</span>
        </div>
        <div className={`px-2 py-0.5 rounded-sm bg-black/40 backdrop-blur-sm border border-white/10`}>
          <span className={`${size === 'lg' ? 'text-xs' : 'text-[6px]'} font-black text-white italic whitespace-nowrap`}>{config.badge}</span>
        </div>
      </div>

      {/* Player Photo */}
      <div className="relative flex-1 flex items-end justify-center overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-[2]`} />
        <img 
          src={card.imageUrl} 
          alt={card.name} 
          className="w-[90%] h-auto object-contain z-[1] drop-shadow-2xl transition-transform group-hover:scale-110 duration-700" 
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Player Info */}
      <div className="bg-black/20 backdrop-blur-md p-[6%] flex flex-col items-center z-10 border-t border-white/5">
        <h3 className={`${ts.name} font-black italic uppercase text-center text-white mb-0.5 whitespace-nowrap`}>
          {card.name}
        </h3>
        <p className={`${ts.pos} font-bold tracking-widest text-[#9e9e9e] uppercase`}>
          {card.position}
        </p>
      </div>

      {/* Stats Area */}
      <div className="bg-black/40 p-[5%] grid grid-cols-3 gap-1 z-10 border-t border-white/5">
        <div className="flex flex-col items-center">
            <span className={`${ts.stat} font-black text-white leading-none`}>{card.stats.points}</span>
            <span className={`${ts.label} font-bold text-zinc-500 uppercase tracking-tighter`}>PTS</span>
        </div>
        <div className="flex flex-col items-center border-x border-white/10">
            <span className={`${ts.stat} font-black text-white leading-none`}>{card.stats.rebounds}</span>
            <span className={`${ts.label} font-bold text-zinc-500 uppercase tracking-tighter`}>REB</span>
        </div>
        <div className="flex flex-col items-center">
            <span className={`${ts.stat} font-black text-white leading-none`}>{card.stats.assists}</span>
            <span className={`${ts.label} font-bold text-zinc-500 uppercase tracking-tighter`}>AST</span>
        </div>
      </div>

      {/* Footer Logo */}
      <div className="h-[4%] bg-black/60 flex items-center justify-center border-t border-white/5">
         <span className="text-[5px] font-black tracking-[0.3em] text-zinc-600">HOOPSCOLLECTOR</span>
      </div>

      {/* Card Shimmer/Overlay */}
      <div className="absolute inset-0 pointer-events-none z-20 bg-gradient-to-br from-white/10 via-transparent to-black/20 opacity-30" />
    </motion.div>
  );
};

export default SBCCard;
