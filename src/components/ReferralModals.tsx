import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Gift, Sparkles, Check, Users } from 'lucide-react';
import { InventoryPack } from '../types';

interface InviteeClaimModalProps {
  isOpen: boolean;
  inviterUsername: string;
  coins: number;
  pack: InventoryPack;
  onClaim: () => void;
}

export const InviteeClaimModal: React.FC<InviteeClaimModalProps> = ({
  isOpen,
  inviterUsername,
  coins,
  pack,
  onClaim,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ scale: 0.85, y: 25, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.85, y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="w-full max-w-sm bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-2 border-amber-500/50 rounded-3xl p-6 shadow-[0_0_60px_rgba(245,158,11,0.35)] flex flex-col items-center text-center relative overflow-hidden"
        >
          {/* Animated Gold Header Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />
          <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Badge Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.6)] mb-4 animate-bounce-subtle border border-amber-200/40">
            <Gift className="text-black w-8 h-8" strokeWidth={2.5} />
          </div>

          {/* Subtitle */}
          <h3 className="text-xs font-black uppercase tracking-[0.25em] text-amber-400 italic mb-1">
            REFERRAL BONUS
          </h3>

          {/* Title */}
          <h2 className="text-2xl font-black text-white italic tracking-tight uppercase mb-3">
            WELCOME BONUS CLAIMED!
          </h2>

          {/* Body Copy */}
          <p className="text-xs text-zinc-300 mb-5 px-2 leading-relaxed">
            Thanks for joining using <span className="font-bold text-amber-400">{inviterUsername}</span>'s code! Here is your starter reward.
          </p>

          {/* Reward Box */}
          <div className="w-full bg-zinc-950/90 border border-amber-500/30 rounded-2xl p-4 mb-6 flex flex-col items-center shadow-inner gap-1">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
              Starter Rewards Granted
            </span>
            <div className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 italic tracking-tight uppercase flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              <span>+{coins.toLocaleString()} Coins</span>
            </div>
            <div className="text-sm font-black text-amber-300 italic tracking-tight uppercase">
              +1 {pack.name}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={onClaim}
            className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-black font-black uppercase tracking-widest text-xs shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-amber-200/60"
          >
            COLLECT REWARDS
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

interface InviterRewardModalProps {
  isOpen: boolean;
  inviteeUsername: string;
  coins: number;
  packName: string;
  totalReferrals: number;
  onClaim: () => void;
}

export const InviterRewardModal: React.FC<InviterRewardModalProps> = ({
  isOpen,
  inviteeUsername,
  coins,
  packName,
  totalReferrals,
  onClaim,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          initial={{ scale: 0.85, y: 25, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.85, y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="w-full max-w-sm bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-2 border-amber-500/50 rounded-3xl p-6 shadow-[0_0_60px_rgba(245,158,11,0.35)] flex flex-col items-center text-center relative overflow-hidden"
        >
          {/* Top Animated Line */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />
          <div className="absolute -top-16 -left-16 w-36 h-36 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Trophy Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.6)] mb-4 animate-bounce-subtle border border-amber-200/40">
            <Trophy className="text-black w-8 h-8" strokeWidth={2.5} />
          </div>

          <h3 className="text-xs font-black uppercase tracking-[0.25em] text-amber-400 italic mb-1">
            REFERRAL MILESTONE
          </h3>

          <h2 className="text-2xl font-black text-white italic tracking-tight uppercase mb-3">
            FRIEND REWARD UNLOCKED!
          </h2>

          <p className="text-xs text-zinc-300 mb-5 px-2 leading-relaxed">
            Your friend <span className="font-bold text-amber-400">{inviteeUsername}</span> joined Hoops Collector and opened their first pack! You earned <span className="font-bold text-white">{coins.toLocaleString()} Coins & 1 {packName}</span>. Total referrals: <span className="font-bold text-amber-400">{totalReferrals}/3</span>
          </p>

          <div className="w-full bg-zinc-950/90 border border-amber-500/30 rounded-2xl p-4 mb-6 flex flex-col items-center shadow-inner gap-1">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
              Reward Unlocked ({totalReferrals}/3)
            </span>
            <div className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 italic tracking-tight uppercase">
              +{coins.toLocaleString()} Coins & 1 {packName}
            </div>
          </div>

          <button
            onClick={onClaim}
            className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-black font-black uppercase tracking-widest text-xs shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-amber-200/60"
          >
            COLLECT REWARDS
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
