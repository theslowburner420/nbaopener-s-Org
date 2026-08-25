import React, { memo } from 'react';
import { motion } from 'motion/react';
import { Trophy, CheckCircle2, ChevronRight, Sparkles, Layers, Gift, Eye } from 'lucide-react';
import { SbcGroup, Card } from '../../types';
import { sbcService } from '../../services/sbcService';
import CardItem from '../CardItem';

interface SbcGroupCardProps {
  group: SbcGroup;
  completedSbcs: string[];
  allCardsPool: Card[];
  onSelect: (group: SbcGroup) => void;
  onInspectCard: (card: Card) => void;
}

const DIFFICULTY_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  bronze: { label: 'Bronze', bg: 'bg-amber-900/30', text: 'text-amber-300', border: 'border-amber-700/50' },
  silver: { label: 'Silver', bg: 'bg-slate-500/20', text: 'text-slate-200', border: 'border-slate-400/40' },
  gold: { label: 'Gold', bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/40' },
  elite: { label: 'Elite', bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/40' },
  legendary: { label: 'Legendary', bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40' }
};

const CATEGORY_TAGS: Record<string, { label: string; icon: string }> = {
  dynasty: { label: 'Dynasty Special', icon: '👑' },
  hof_legends: { label: 'Hall of Fame', icon: '⭐' },
  franchise_icons: { label: 'Franchise Icon', icon: '🏆' },
  fan_favourites: { label: 'Fan Favourite', icon: '🔥' },
  rookie_series: { label: 'Rookie Series', icon: '🌟' },
  clutch_moments: { label: 'Clutch Moments', icon: '⚡' }
};

export const SbcGroupCard: React.FC<SbcGroupCardProps> = memo(({ 
  group, 
  completedSbcs, 
  allCardsPool,
  onSelect, 
  onInspectCard 
}) => {
  const { completedCount, totalCount, percentage, isFinished } = sbcService.getGroupProgress(group, completedSbcs);
  const diff = DIFFICULTY_CONFIG[group.difficulty] || DIFFICULTY_CONFIG.gold;
  const catTag = CATEGORY_TAGS[group.category] || { label: 'SBC Challenge', icon: '🎯' };

  // Generate reward card preview for inspection
  const rewardCardPreview = React.useMemo(() => {
    return sbcService.generateRewardCard(
      group.reward.playerName,
      group.reward.rarity,
      group.reward.ovr,
      allCardsPool,
      group.reward.imageUrl,
      group.reward.playerId
    );
  }, [group, allCardsPool]);

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.008 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSelect(group)}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col ${
        isFinished
          ? 'bg-gradient-to-b from-emerald-950/30 via-zinc-900/90 to-zinc-950 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.12)]'
          : group.category === 'dynasty'
          ? 'bg-gradient-to-b from-amber-950/30 via-zinc-900/90 to-zinc-950 border-amber-500/30 hover:border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.08)]'
          : 'bg-gradient-to-b from-zinc-900/90 via-zinc-900/60 to-zinc-950 border-white/10 hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(6,182,212,0.12)]'
      }`}
    >
      {/* Background ambient glow */}
      <div 
        className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity duration-300 group-hover:opacity-35"
        style={{
          backgroundColor: isFinished ? '#10b981' : group.category === 'dynasty' ? '#f59e0b' : '#06b6d4'
        }}
      />

      {/* Top Bar with Category & Difficulty Badges */}
      <div className="p-3.5 pb-1 flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300">
          <span>{catTag.icon}</span>
          <span className="truncate max-w-[120px] sm:max-w-none">{catTag.label}</span>
        </div>
        <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${diff.bg} ${diff.text} ${diff.border}`}>
          {diff.label}
        </div>
      </div>

      {/* Card Content & Thumbnail */}
      <div className="p-3.5 pt-1.5 flex-1 flex gap-3.5 items-center z-10 min-w-0">
        {/* Authentic Reward Card Preview with Hover Inspect */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onInspectCard(rewardCardPreview);
          }}
          className="relative shrink-0 flex items-center justify-center group/thumb hover:scale-105 transition-all duration-300 shadow-xl cursor-zoom-in rounded-lg"
          title="Click to inspect Master Card in 3D"
        >
          <CardItem 
            card={rewardCardPreview} 
            isOwned={true} 
            width={74} 
            onClick={() => onInspectCard(rewardCardPreview)}
          />

          {/* Inspect Hover Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 flex flex-col items-center justify-center transition-opacity text-amber-300 gap-0.5 pointer-events-none rounded-lg z-30">
            <Eye className="w-4 h-4" />
            <span className="text-[7px] font-black uppercase tracking-wider">3D Inspect</span>
          </div>

          {/* Completed Checkmark Overlay */}
          {isFinished && (
            <div className="absolute inset-0 bg-emerald-950/75 backdrop-blur-xs flex items-center justify-center rounded-lg z-30 pointer-events-none">
              <CheckCircle2 className="w-7 h-7 text-emerald-400 drop-shadow-md" />
            </div>
          )}
        </div>

        {/* Text & Meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 px-1.5 py-0.5 rounded bg-amber-400/10 truncate max-w-full">
              {group.reward.playerName}
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white leading-tight truncate group-hover:text-amber-300 transition-colors">
            {group.name}
          </h3>
          <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
            {group.description}
          </p>
        </div>
      </div>

      {/* Segmented Progress Bar */}
      <div className="px-3.5 py-2 bg-black/30 border-t border-white/5 z-10">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <div className="flex items-center gap-1.5 text-zinc-300 font-medium text-[11px]">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Squads</span>
          </div>
          <span className={`font-bold text-[11px] ${isFinished ? 'text-emerald-400' : 'text-zinc-300'}`}>
            {completedCount} / {totalCount} {isFinished ? 'Done' : 'Squads'}
          </span>
        </div>

        {/* Segmented Ticks */}
        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${totalCount}, minmax(0, 1fr))` }}>
          {group.segments.map((seg, idx) => {
            const isSegDone = sbcService.isSegmentCompleted(seg.id, completedSbcs, group.id);
            return (
              <div
                key={seg.id || idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isSegDone
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                    : 'bg-zinc-800'
                }`}
                title={seg.name}
              />
            );
          })}
        </div>
      </div>

      {/* Card Footer / Action */}
      <div className="p-3 bg-black/40 border-t border-white/5 flex items-center justify-between z-10 gap-2">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 min-w-0">
          <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-[11px] font-medium truncate">
            {isFinished ? 'Master Claimed' : 'Coins & Packs per squad'}
          </span>
        </div>

        <div className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors shrink-0 ${
          isFinished
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            : completedCount > 0
            ? 'bg-amber-500 text-zinc-950 hover:bg-amber-400'
            : 'bg-white/10 text-white group-hover:bg-cyan-500 group-hover:text-zinc-950'
        }`}>
          <span>{isFinished ? 'Completed' : completedCount > 0 ? 'Continue' : 'View SBC'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </motion.div>
  );
});

