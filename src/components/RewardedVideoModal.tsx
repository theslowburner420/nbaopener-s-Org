import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  X, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  Coins, 
  ShieldCheck, 
  Flame,
  Award,
  AlertCircle
} from 'lucide-react';

interface RewardedVideoModalProps {
  isOpen: boolean;
  onComplete: () => void | Promise<void>;
  onClose: () => void;
  rewardText?: string;
  adDurationSeconds?: number;
}

export const RewardedVideoModal: React.FC<RewardedVideoModalProps> = ({
  isOpen,
  onComplete,
  onClose,
  rewardText = '+3,000 Coins',
  adDurationSeconds = 10,
}) => {
  const [timeLeft, setTimeLeft] = useState(adDurationSeconds);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Featured sponsor slides for an authentic in-game rewarded ad experience
  const sponsorSlides = [
    {
      badge: 'NBA HOOPS PASS 2026',
      title: 'UNLOCK LEGENDARY PACKS',
      tagline: 'Draft Hall of Fame icons, win championship rings & dominate the leaderboard!',
      icon: <Flame className="text-orange-500" size={32} />,
      accent: 'from-orange-500/20 to-amber-500/10',
      border: 'border-orange-500/40',
      image: 'https://cdn.nba.com/headshots/nba/latest/1040x760/893.png', // Michael Jordan / Legend style
    },
    {
      badge: 'GALAXY & INVINCIBLE DROPS',
      title: 'COLLECT OVER 1,000+ CARDS',
      tagline: 'Complete Daily SBCs, build your dream squad and trade cards live with friends.',
      icon: <Sparkles className="text-purple-400" size={32} />,
      accent: 'from-purple-500/20 to-pink-500/10',
      border: 'border-purple-500/40',
      image: 'https://cdn.nba.com/headshots/nba/latest/1040x760/2544.png', // LeBron James
    },
    {
      badge: 'HOOPS FRANCHISE GM',
      title: 'LEAD YOUR DYNASTY TO GLORY',
      tagline: 'Trade future draft picks, manage player chemistry, and simulate 82-game seasons.',
      icon: <Award className="text-emerald-400" size={32} />,
      accent: 'from-emerald-500/20 to-teal-500/10',
      border: 'border-emerald-500/40',
      image: 'https://cdn.nba.com/headshots/nba/latest/1040x760/201939.png', // Steph Curry
    }
  ];

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(adDurationSeconds);
      setIsCompleted(false);
      setShowExitConfirm(false);
      setActiveSlide(0);
    }
  }, [isOpen, adDurationSeconds]);

  // Main countdown timer
  useEffect(() => {
    if (!isOpen || isCompleted || showExitConfirm) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, isCompleted, showExitConfirm]);

  // Rotate featured promo slides during the ad
  useEffect(() => {
    if (!isOpen || isCompleted) return;

    const slideTimer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % sponsorSlides.length);
    }, 3200);

    return () => clearInterval(slideTimer);
  }, [isOpen, isCompleted, sponsorSlides.length]);

  const handleClaimAndClose = async () => {
    if (isCompleted) {
      await onComplete();
      onClose();
    }
  };

  const handleEarlyCloseClick = () => {
    if (isCompleted) {
      handleClaimAndClose();
    } else {
      setShowExitConfirm(true);
    }
  };

  const confirmExitWithoutReward = () => {
    setShowExitConfirm(false);
    onClose();
  };

  if (!isOpen) return null;

  const currentSlide = sponsorSlides[activeSlide];
  const progressPct = ((adDurationSeconds - timeLeft) / adDurationSeconds) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4 select-none"
      >
        {/* Ad Video Simulator Container */}
        <motion.div
          initial={{ scale: 0.95, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-900/90 border-b border-zinc-800/80">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                Rewarded Ad • Hoops Network
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleEarlyCloseClick}
                className={`p-1.5 rounded-lg transition-all ${
                  isCompleted 
                    ? 'bg-emerald-500 text-black font-black hover:bg-emerald-400 scale-105' 
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                }`}
                title={isCompleted ? 'Claim Reward' : 'Close Ad'}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Ad Canvas Display */}
          <div className="relative aspect-[16/10] sm:aspect-video w-full bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-6 flex flex-col justify-between overflow-hidden">
            {/* Background Glow */}
            <div className={`absolute inset-0 bg-gradient-to-br ${currentSlide.accent} opacity-60 transition-all duration-700 pointer-events-none`} />
            
            {/* Animated Grid Scanlines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.4)_51%)] bg-[length:100%_4px] pointer-events-none opacity-40" />

            {/* Slide Content */}
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[8.5px] font-black tracking-widest text-amber-300 uppercase shadow-sm">
                <Sparkles size={11} className="text-amber-400" />
                <span>{currentSlide.badge}</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tight text-white leading-none drop-shadow-md">
                {currentSlide.title}
              </h2>
            </div>

            {/* Center Graphic */}
            <div className="relative z-10 my-auto flex items-center justify-between py-2">
              <div className="space-y-1 max-w-[280px]">
                <p className="text-xs sm:text-sm font-medium text-zinc-300 leading-relaxed">
                  {currentSlide.tagline}
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                    <Coins size={12} fill="currentColor" /> Reward: {rewardText}
                  </span>
                </div>
              </div>

              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-zinc-900/90 border border-white/10 shadow-2xl flex items-center justify-center relative overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 to-transparent" />
                {currentSlide.icon}
              </div>
            </div>

            {/* Live Progress Bar */}
            <div className="relative z-10 space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-[9px] font-mono font-bold text-zinc-400">
                <span className="flex items-center gap-1 text-zinc-300 uppercase">
                  <ShieldCheck size={11} className="text-emerald-400" /> Verified Sponsor
                </span>
                <span className={isCompleted ? 'text-emerald-400 font-black' : 'text-amber-400'}>
                  {isCompleted ? 'Reward Ready!' : `Reward in ${timeLeft}s`}
                </span>
              </div>

              <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/80">
                <motion.div
                  className={`h-full ${isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`}
                  style={{ width: `${progressPct}%` }}
                  transition={{ ease: 'linear' }}
                />
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-4 bg-zinc-950 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-left w-full sm:w-auto">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Coins size={16} fill="currentColor" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Completion Reward</p>
                <p className="text-xs font-black text-white">{rewardText}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClaimAndClose}
              disabled={!isCompleted}
              className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${
                isCompleted
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-black shadow-emerald-500/25 cursor-pointer animate-pulse'
                  : 'bg-zinc-900 text-zinc-500 border border-zinc-800 opacity-60 cursor-not-allowed'
              }`}
            >
              {isCompleted ? (
                <>
                  <CheckCircle2 size={15} />
                  <span>Claim Reward Now</span>
                </>
              ) : (
                <>
                  <Play size={13} fill="currentColor" />
                  <span>Watching Video ({timeLeft}s)</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Exit Confirmation Dialog if user clicks close early */}
        <AnimatePresence>
          {showExitConfirm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute z-50 max-w-sm w-full bg-zinc-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-4 m-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                <AlertCircle size={24} />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black uppercase italic text-white">Skip Rewarded Video?</h3>
                <p className="text-xs text-zinc-400">
                  If you close now, you will lose your reward ({rewardText}). Only {timeLeft}s remaining!
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="w-full py-3 bg-amber-500 text-black font-black uppercase tracking-wider text-xs rounded-xl hover:bg-amber-400 transition-colors shadow-lg active:scale-95"
                >
                  Keep Watching ({timeLeft}s)
                </button>

                <button
                  type="button"
                  onClick={confirmExitWithoutReward}
                  className="w-full py-2.5 bg-zinc-800 text-zinc-400 font-bold uppercase tracking-wider text-[10px] rounded-xl hover:text-white transition-colors"
                >
                  Exit Without Reward
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

export default RewardedVideoModal;
