import React, { memo } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ChevronRight, Coins, Package, Award, ArrowRight, ShieldCheck } from 'lucide-react';
import { SbcSegment, SbcRequirement } from '../../types';

interface SbcSegmentCardProps {
  segment: SbcSegment;
  index: number;
  isCompleted: boolean;
  onBuildSquad: (segment: SbcSegment) => void;
}

const getReqSummary = (req: SbcRequirement) => {
  switch (req.type) {
    case 'TOTAL_CARDS':
      return `${req.value} Cards`;
    case 'MIN_OVR':
      return `Min ${req.value} OVR`;
    case 'TEAM_OVR_MIN':
      return `Team ${req.value}+ OVR`;
    case 'POSITION':
      return `${req.count || 1}x ${req.value}`;
    case 'SAME_CONF_MIN':
      return `${req.value}+ Same Conf`;
    case 'SAME_TEAM_MIN':
      return `${req.value}+ Same Team`;
    case 'UNIQUE_PLAYERS':
      return 'Unique Players';
    case 'MIN_RARITY':
      return `Min ${String(req.value).toUpperCase()}`;
    default:
      return `${req.type}`;
  }
};

export const SbcSegmentCard: React.FC<SbcSegmentCardProps> = memo(({
  segment,
  index,
  isCompleted,
  onBuildSquad
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 p-3.5 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 ${
        isCompleted
          ? 'bg-emerald-950/20 border-emerald-500/30'
          : 'bg-zinc-900/80 hover:bg-zinc-900 border-white/10 hover:border-amber-500/40 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Left: Squad Index & Title & Reqs */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm border ${
            isCompleted
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
              : 'bg-zinc-800 text-amber-400 border-white/10'
          }`}
        >
          {isCompleted ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : `#${index + 1}`}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1">
            <h4 className="text-sm sm:text-base font-bold text-white leading-tight truncate">
              {segment.name}
            </h4>
            {isCompleted && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                Completed
              </span>
            )}
          </div>

          <p className="text-[11px] sm:text-xs text-zinc-400 mb-2 leading-relaxed line-clamp-2">
            {segment.description}
          </p>

          {/* Requirements Badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {segment.requirements.map((req, rIdx) => (
              <span
                key={rIdx}
                className="px-2 py-0.5 rounded-md bg-black/40 border border-white/10 text-[9px] sm:text-[10px] font-semibold text-zinc-300"
              >
                {getReqSummary(req)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Reward Pill & Action Button */}
      <div className="flex items-center justify-between md:justify-end gap-2.5 sm:gap-3 shrink-0 pt-2.5 md:pt-0 border-t md:border-t-0 border-white/5">
        {/* Segment Intermediate Reward Box */}
        <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-black/50 border border-white/10 min-w-0">
          <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
          <div className="text-left min-w-0">
            <div className="text-[9px] sm:text-[10px] uppercase font-bold text-zinc-400 truncate">
              Squad Reward
            </div>
            <div className="text-[11px] sm:text-xs font-bold text-amber-300 flex items-center gap-1.5 flex-wrap">
              {segment.segmentReward.coins && (
                <span className="flex items-center gap-1">
                  <Coins className="w-3 h-3 text-yellow-400" />
                  {segment.segmentReward.coins.toLocaleString()}
                </span>
              )}
              {segment.segmentReward.coins && segment.segmentReward.packType && <span>+</span>}
              {segment.segmentReward.packType && (
                <span className="flex items-center gap-1 text-cyan-300 truncate max-w-[120px] sm:max-w-[140px]">
                  <Package className="w-3 h-3 text-cyan-400" />
                  {segment.segmentReward.packName || 'Pack'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {isCompleted ? (
          <button
            disabled
            className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5 cursor-default shrink-0"
          >
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Submitted</span>
          </button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onBuildSquad(segment)}
            className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-black flex items-center gap-1.5 shadow-md hover:shadow-amber-500/20 transition-all cursor-pointer shrink-0"
          >
            <span>Build</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
});
