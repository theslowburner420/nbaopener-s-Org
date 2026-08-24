import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Sparkles, CheckCircle2, Coins, Package, ArrowRight, X, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Card, SbcGroup, SbcSegment } from '../../types';
import CardItem from '../CardItem';

interface SegmentClaimModalProps {
  isOpen: boolean;
  segment: SbcSegment | null;
  group: SbcGroup | null;
  onClose: () => void;
  onNextSquad: () => void;
  hasNextSquad: boolean;
}

export const SegmentClaimModal: React.FC<SegmentClaimModalProps> = ({
  isOpen,
  segment,
  group,
  onClose,
  onNextSquad,
  hasNextSquad
}) => {
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  }, [isOpen]);

  if (!isOpen || !segment) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-zinc-950 border border-amber-500/40 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close Icon */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Success Icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg text-zinc-950">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">
            Squad Challenge Completed
          </span>
          <h3 className="text-2xl font-black text-white mt-1 mb-2">
            {segment.name}
          </h3>
          <p className="text-xs text-zinc-400 mb-6">
            Squad submitted and verified! Your intermediate rewards have been added directly to your account.
          </p>

          {/* Rewards Box */}
          <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-4 mb-6 text-left">
            <div className="text-[10px] uppercase font-bold text-zinc-400 mb-2 tracking-wider">
              Rewards Claimed
            </div>
            <div className="space-y-2.5">
              {segment.segmentReward.coins && (
                <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-bold text-white">Coins</span>
                  </div>
                  <span className="text-sm font-black text-amber-300">
                    +{segment.segmentReward.coins.toLocaleString()}
                  </span>
                </div>
              )}
              {segment.segmentReward.packType && (
                <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-bold text-white truncate max-w-[180px]">
                      {segment.segmentReward.packName || 'Reward Pack'}
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    1x Pack
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            {hasNextSquad ? (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition-colors"
                >
                  Back to SBC Set
                </button>
                <button
                  onClick={onNextSquad}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <span>Next Squad</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-zinc-950 font-black text-sm cursor-pointer"
              >
                Continue
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface GrandRewardModalProps {
  isOpen: boolean;
  rewardCard: Card | null;
  group: SbcGroup | null;
  onClose: () => void;
}

export const GrandRewardModal: React.FC<GrandRewardModalProps> = ({
  isOpen,
  rewardCard,
  group,
  onClose
}) => {
  useEffect(() => {
    if (isOpen) {
      // Big confetti burst
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.5 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 80,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 80,
          origin: { x: 1 }
        });
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen || !rewardCard) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 30 }}
          className="relative w-full max-w-lg bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border border-amber-500/50 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_80px_rgba(245,158,11,0.3)] my-auto"
        >
          {/* Ambient Light */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-gradient-to-b from-amber-500/30 to-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header Banner */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black uppercase tracking-widest mb-4">
            <Sparkles className="w-4 h-4" />
            <span>SBC SET COMPLETE</span>
            <Sparkles className="w-4 h-4" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 mb-2">
            MASTER UNLOCKED!
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 mb-4 sm:mb-6 max-w-sm mx-auto">
            You finished all squad requirements for <span className="font-bold text-white">{group?.name}</span>!
          </p>

          {/* 3D Card Item Display */}
          <div className="flex justify-center mb-4 sm:mb-6 py-1 max-w-[200px] sm:max-w-[260px] mx-auto">
            <div className="transform hover:scale-105 transition-transform duration-300 shadow-2xl w-full flex justify-center">
              <CardItem card={rewardCard} isLarge={true} isInteractive={false} />
            </div>
          </div>

          {/* Stats / Lore Pill */}
          <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-bold text-zinc-400 uppercase text-[10px] sm:text-xs">Card Category</span>
              <span className="font-black text-amber-400 uppercase text-[10px] sm:text-xs">{rewardCard.category || 'Special SBC'}</span>
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-300 italic">
              "{rewardCard.quote || rewardCard.description || 'SBC Master Champion'}"
            </p>
          </div>

          {/* Claim Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="w-full py-3 sm:py-3.5 px-5 sm:px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-zinc-950 font-black text-sm sm:text-base uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.5)] cursor-pointer"
          >
            Claim & Add To Collection
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
