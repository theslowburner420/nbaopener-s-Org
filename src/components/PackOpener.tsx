import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, Rarity } from '../types';
import CardItem from './CardItem';
import { Check, Sparkles, Trophy, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { MemoryManager } from '../lib/memory';
import StaticAd from './StaticAd';

interface PackOpenerProps {
  cards: Card[];
  newlyUnlockedAchievements?: any[];
  onClose: () => void;
  packImage?: string;
}

const getRarityColor = (rarity: Rarity): string => {
  switch (rarity) {
    case 'bench': return '#94A3B8';
    case 'starter': return '#10B981';
    case 'allstar': return '#3B82F6';
    case 'franchise': return '#A855F7';
    case 'legend': return '#F59E0B';
    case 'dpoy': return '#10B981';
    case 'roty': return '#EA580C';
    case 'record': return '#F59E0B';
    case 'allnba_1st': return '#F59E0B';
    case 'invincible': return '#FFD700';
    case 'galaxy': return '#E94560';
    case 'legend_sbc': return '#F59E0B';
    case 'icon_sbc': return '#8B5CF6';
    case 'moments_sbc': return '#FFFFFF';
    case 'future_star': return '#10B981';
    default: return '#94A3B8';
  }
};

const getCategoryBadge = (card: Card) => {
  if (card.category === 'All-Star MVP') return { text: 'ALL-STAR MVP', color: '#F59E0B' };
  if (card.category === 'Dynasty') return { text: 'DYNASTY', color: '#EF4444' };
  if (card.category === 'X-Factor') return { text: 'X-FACTOR', color: '#60A5FA' };
  if (card.rarity === 'legend') return { text: 'LEGENDARY', color: '#F59E0B' };
  if (card.rarity === 'record') return { text: 'RECORD BREAKER', color: '#F59E0B' };
  if (card.rarity === 'dpoy') return { text: 'DEFENSIVE PLAYER OF THE YEAR', color: '#10B981' };
  if (card.rarity === 'roty') return { text: 'ROOKIE OF THE YEAR', color: '#EA580C' };
  if (card.rarity === 'franchise') return { text: 'FRANCHISE PLAYER', color: '#A855F7' };
  if (card.rarity === 'allstar') return { text: 'ALL-STAR', color: '#3B82F6' };
  if (card.rarity === 'starter') return { text: 'STARTER', color: '#10B981' };
  return null;
};

// Memoized high-performance particle burst
const ParticleBurst = memo(({ color, isHighTier }: { color: string; isHighTier: boolean }) => {
  const particleCount = isHighTier ? 20 : 10;

  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * 360 + (i % 2 === 0 ? 10 : -10);
      const distance = isHighTier ? 120 + (i % 5) * 25 : 70 + (i % 4) * 20;
      const tx = Math.cos(angle * (Math.PI / 180)) * distance;
      const ty = Math.sin(angle * (Math.PI / 180)) * distance;
      const scale = 0.5 + (i % 3) * 0.3;
      const dur = isHighTier ? 0.7 + (i % 3) * 0.2 : 0.5 + (i % 2) * 0.15;
      const rot = (i % 2 === 0 ? 1 : -1) * (180 + i * 30);
      return { tx, ty, scale, dur, rot, id: i };
    });
  }, [particleCount, isHighTier]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ willChange: 'transform' }}>
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle-burst"
          style={{
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            '--scale': p.scale,
            '--dur': `${p.dur}s`,
            '--rot': `${p.rot}deg`,
            backgroundColor: color,
            width: isHighTier ? '5px' : '3px',
            height: isHighTier ? '5px' : '3px',
            boxShadow: `0 0 ${isHighTier ? '8px' : '4px'} ${color}`,
            borderRadius: p.id % 2 === 0 ? '50%' : '2px',
            willChange: 'transform, opacity'
          } as any}
        />
      ))}
    </div>
  );
});

ParticleBurst.displayName = 'ParticleBurst';

// Memoized Flare lines
const FlareBurst = memo(({ color }: { color: string }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-20">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flare-burst"
          style={{
            transform: `rotate(${i * 60}deg)`,
            backgroundColor: color,
            boxShadow: `0 0 20px ${color}`,
            width: '3px',
            height: '180px',
            opacity: 0.75,
            willChange: 'transform, opacity'
          } as any}
        />
      ))}
    </div>
  );
});

FlareBurst.displayName = 'FlareBurst';

const ShimmerOverlay = memo(() => (
  <div className="absolute inset-0 pointer-events-none z-[60] overflow-hidden rounded-2xl">
    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer-sweep" />
  </div>
));

ShimmerOverlay.displayName = 'ShimmerOverlay';

export default function PackOpener({ cards, newlyUnlockedAchievements = [], onClose, packImage }: PackOpenerProps) {
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isRevealing, setIsRevealing] = useState(true);
  const [showPack, setShowPack] = useState(true);
  const [packBurst, setPackBurst] = useState(false);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  const [pendingQueue, setPendingQueue] = useState<Array<{ cardIndex: number; achievement: any }>>(() => {
    return (newlyUnlockedAchievements || []).map(ach => {
      let idx = typeof ach.cardIndex === 'number' ? ach.cardIndex : -1;
      if (idx === -1 && ach.triggeredByCardId) {
        const found = cards.findIndex(c => c.id === ach.triggeredByCardId);
        if (found !== -1) idx = found;
      }
      if (idx === -1) idx = 0;
      return {
        cardIndex: Math.min(idx, cards.length - 1),
        achievement: ach
      };
    });
  });

  const [activeAchievementPopup, setActiveAchievementPopup] = useState<any | null>(null);
  const { notify } = useNotification();

  const totalCards = cards.length;
  const currentCard = cards[activeCardIndex] || cards[0];

  const isHighTier = useMemo(() => {
    if (!currentCard) return false;
    const r = currentCard.rarity;
    return r === 'legend' || r === 'dpoy' || r === 'roty' || r === 'record' || r === 'invincible' || r === 'galaxy' ||
           currentCard.category === 'Dynasty' || currentCard.category === 'All-Star MVP';
  }, [currentCard]);

  const activeColor = useMemo(() => {
    if (!currentCard) return '#94A3B8';
    if (currentCard.category === 'Dynasty') return '#EF4444';
    if (currentCard.category === 'X-Factor') return '#60A5FA';
    return getRarityColor(currentCard.rarity);
  }, [currentCard]);

  const badge = useMemo(() => {
    return currentCard ? getCategoryBadge(currentCard) : null;
  }, [currentCard]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Quick Preloader with fallback timeout for silky smooth startup
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    let isCancelled = false;
    const imgUrls = cards.map(c => c.imageUrl).filter(Boolean);

    const promises = imgUrls.map(url => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    });

    // Max 500ms wait to avoid hanging on slow network
    const timeout = new Promise<void>(resolve => setTimeout(resolve, 500));

    Promise.race([Promise.all(promises), timeout]).then(() => {
      if (!isCancelled) {
        setIsPreloaded(true);
      }
    });

    return () => {
      isCancelled = true;
      document.body.style.overflow = 'unset';
      MemoryManager.cleanupAssets();
    };
  }, [cards]);

  // Initial Pack Opening Burst & Timing
  useEffect(() => {
    if (!isPreloaded) return;

    if (showPack) {
      // Pack shake then burst
      const burstTimer = setTimeout(() => {
        setPackBurst(true);
      }, 500);

      const hidePackTimer = setTimeout(() => {
        setShowPack(false);
        setIsRevealing(true);
      }, 750);

      return () => {
        clearTimeout(burstTimer);
        clearTimeout(hidePackTimer);
      };
    }
  }, [isPreloaded, showPack]);

  // Card Reveal timer when switching cards
  useEffect(() => {
    if (showPack) return;

    setIsRevealing(true);
    const duration = isHighTier ? 900 : 500;
    const timer = setTimeout(() => {
      setIsRevealing(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [activeCardIndex, isHighTier, showPack]);

  // Achievement queue processing
  useEffect(() => {
    if (!isRevealing && !showPack && isPreloaded && !activeAchievementPopup && pendingQueue.length > 0) {
      const isLastCard = activeCardIndex === cards.length - 1;

      const matchingIndex = pendingQueue.findIndex(item => 
        item.cardIndex === activeCardIndex || 
        (item.achievement.triggeredByCardId && item.achievement.triggeredByCardId === currentCard?.id) ||
        (isLastCard && item.achievement.triggeredByCardId === null)
      );

      if (matchingIndex !== -1) {
        const timer = setTimeout(() => {
          const itemToTrigger = pendingQueue[matchingIndex];
          setActiveAchievementPopup(itemToTrigger.achievement);
          setPendingQueue(prev => prev.filter((_, idx) => idx !== matchingIndex));
        }, 250);

        return () => clearTimeout(timer);
      }
    }
  }, [activeCardIndex, isRevealing, showPack, isPreloaded, activeAchievementPopup, pendingQueue, cards, currentCard]);

  const handleBurstPackNow = useCallback(() => {
    if (showPack) {
      setPackBurst(true);
      setTimeout(() => {
        setShowPack(false);
        setIsRevealing(true);
      }, 200);
    }
  }, [showPack]);

  const nextCard = useCallback(() => {
    if (activeCardIndex < totalCards - 1) {
      setActiveCardIndex(prev => prev + 1);
    }
  }, [activeCardIndex, totalCards]);

  const prevCard = useCallback(() => {
    if (activeCardIndex > 0) {
      setActiveCardIndex(prev => prev - 1);
    }
  }, [activeCardIndex]);

  const handleCardClick = useCallback((index: number) => {
    if (index !== activeCardIndex) {
      setActiveCardIndex(index);
    }
  }, [activeCardIndex]);

  const handleClaimAchievement = useCallback(() => {
    setActiveAchievementPopup(null);
  }, []);

  const handleClosePackOpener = useCallback(() => {
    if (pendingQueue.length > 0) {
      pendingQueue.forEach(item => {
        notify({
          id: item.achievement.id,
          title: item.achievement.title,
          description: item.achievement.description,
          rewardText: item.achievement.rewardText,
          icon: item.achievement.icon
        });
      });
    }
    onClose();
  }, [pendingQueue, notify, onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeAchievementPopup) {
        if (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ') {
          e.preventDefault();
          handleClaimAchievement();
        }
        return;
      }

      if (showPack) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleBurstPackNow();
        }
        return;
      }

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (activeCardIndex < totalCards - 1) {
          nextCard();
        } else {
          handleClosePackOpener();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevCard();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClosePackOpener();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeAchievementPopup, showPack, activeCardIndex, totalCards, nextCard, prevCard, handleClosePackOpener, handleBurstPackNow, handleClaimAchievement]);

  const allRevealed = activeCardIndex === totalCards - 1;

  // Ultra-fluid position calculation for the fanned deck
  const getCardTransform = useCallback((index: number) => {
    const isActive = index === activeCardIndex;
    const isSeen = index < activeCardIndex;

    if (isActive) {
      return {
        x: 0,
        y: 0,
        scale: isMobile ? 0.88 : 1,
        rotate: 0,
        zIndex: 100,
        opacity: 1,
        filter: 'brightness(1) contrast(1)',
        pointerEvents: 'auto' as const
      };
    }

    if (isSeen) {
      const distance = activeCardIndex - index;
      if (distance > 4) {
        return { x: -200, y: 50, scale: 0, rotate: -30, zIndex: 0, opacity: 0, filter: 'brightness(0.2)', pointerEvents: 'none' as const };
      }
      const angle = -6 - distance * 3;
      const xOffset = isMobile ? -14 - distance * 12 : -22 - distance * 18;
      const yOffset = distance * 6;

      return {
        x: xOffset,
        y: yOffset,
        scale: isMobile ? 0.72 - distance * 0.04 : 0.82 - distance * 0.04,
        rotate: angle,
        zIndex: 50 - distance,
        opacity: 1 - distance * 0.15,
        filter: 'brightness(0.35) contrast(0.8)',
        pointerEvents: 'auto' as const
      };
    }

    // Unseen cards on right
    const distance = index - activeCardIndex;
    if (distance > 4) {
      return { x: 200, y: 50, scale: 0, rotate: 30, zIndex: 0, opacity: 0, filter: 'brightness(0.2)', pointerEvents: 'none' as const };
    }
    const angle = 6 + distance * 3;
    const xOffset = isMobile ? 14 + distance * 12 : 22 + distance * 18;
    const yOffset = distance * 6;

    return {
      x: xOffset,
      y: yOffset,
      scale: isMobile ? 0.72 - distance * 0.04 : 0.82 - distance * 0.04,
      rotate: angle,
      zIndex: 50 - distance,
      opacity: 1 - distance * 0.15,
      filter: 'brightness(0.35) contrast(0.8)',
      pointerEvents: 'auto' as const
    };
  }, [activeCardIndex, isMobile]);

  if (!isPreloaded) {
    return (
      <div className="fixed inset-0 z-[8000] bg-black flex flex-col items-center justify-between select-none">
        <div className="w-full z-[9900] relative shrink-0">
          <StaticAd position="header" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-zinc-800 border-t-amber-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
            </div>
          </div>
          <p className="text-amber-400 font-black uppercase tracking-widest text-[11px]">
            OPENING PACK...
          </p>
        </div>
        <div className="h-6" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[8000] bg-black flex flex-col items-center justify-between overflow-hidden h-[100dvh] select-none pointer-events-auto"
      style={{ willChange: 'transform, opacity' }}
    >
      {/* Top Banner Ad Area */}
      <div className="w-full z-[9900] relative shrink-0">
        <StaticAd position="header" />
      </div>

      {/* Atmospheric Background Glow */}
      <div 
        className="absolute inset-0 pointer-events-none transition-colors duration-700 ease-out"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${activeColor}28 0%, transparent 70%)`
        }}
      />

      {/* Rarity Reveal Effects on Center Screen */}
      <AnimatePresence>
        {isRevealing && !showPack && (
          <div className="absolute inset-0 pointer-events-none z-[15] flex flex-col items-center justify-center overflow-hidden">
            {/* White flash */}
            <div className="absolute inset-0 bg-white/25 animate-white-flash pointer-events-none" />

            {/* Particle Burst */}
            <ParticleBurst color={activeColor} isHighTier={isHighTier} />

            {/* Flare rays for high-tier */}
            {isHighTier && <FlareBurst color={activeColor} />}

            {/* Category/Rarity Text Splash */}
            {badge && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 1.3, opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute top-[18%] md:top-[16%] text-center px-4"
              >
                <span
                  className="font-black italic tracking-tighter uppercase text-3xl md:text-6xl drop-shadow-[0_0_30px_currentColor]"
                  style={{ color: badge.color }}
                >
                  {badge.text}
                </span>
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Main Stage: Pack Burst OR Cards Stack */}
      <div className="flex-1 w-full flex items-center justify-center relative z-20">
        {showPack ? (
          /* 3D Opening Pack Foil Animation */
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={packBurst ? {
              scale: [1, 1.4],
              opacity: [1, 0],
              filter: 'brightness(3) blur(8px)'
            } : {
              scale: [0.95, 1.05, 0.98, 1.03, 1],
              rotate: [0, -3, 3, -2, 0],
              opacity: 1
            }}
            transition={packBurst ? { duration: 0.25, ease: "easeOut" } : { duration: 0.6, ease: "easeInOut" }}
            onClick={handleBurstPackNow}
            className="w-[220px] xs:w-[260px] md:w-[300px] aspect-[2.5/3.5] bg-zinc-950 rounded-3xl border-4 border-amber-500/80 shadow-[0_0_50px_rgba(245,158,11,0.5)] flex items-center justify-center overflow-hidden relative cursor-pointer active:scale-95 transition-transform"
          >
            <img
              src={packImage || 'https://i.postimg.cc/bY3DRzLz/4a07a4ae-7c5c-4d11-8585-780a8aebebbe.png'}
              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
              referrerPolicy="no-referrer"
              alt="Pack Foil"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent animate-shimmer-sweep pointer-events-none" />
            <div className="absolute bottom-4 px-4 py-1.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-[10px] font-black text-amber-400 uppercase tracking-widest animate-pulse">
              Tap to Reveal
            </div>
          </motion.div>
        ) : (
          /* Cards Carousel */
          <div className="relative w-full h-full flex items-center justify-center">
            {cards.map((card, index) => {
              const isActive = index === activeCardIndex;
              const transform = getCardTransform(index);

              return (
                <motion.div
                  key={`${card.id || 'card'}-${index}`}
                  drag={isActive ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.4}
                  onDragEnd={(_, info) => {
                    if (!isActive) return;
                    if (info.offset.x < -40 || info.velocity.x < -300) {
                      nextCard();
                    } else if (info.offset.x > 40 || info.velocity.x > 300) {
                      prevCard();
                    }
                  }}
                  animate={{
                    x: transform.x,
                    y: transform.y,
                    scale: transform.scale,
                    rotate: transform.rotate,
                    opacity: transform.opacity,
                    zIndex: transform.zIndex,
                    filter: transform.filter
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 28,
                    mass: 0.7
                  }}
                  onClick={() => handleCardClick(index)}
                  className={`absolute w-[220px] xs:w-[260px] md:w-[310px] max-h-[64vh] md:max-h-[72vh] aspect-[2.5/3.5] touch-none ${
                    isActive ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                  }`}
                  style={{
                    willChange: 'transform, opacity, filter'
                  }}
                >
                  <div className="w-full h-full relative">
                    {/* Shimmer for high tier cards */}
                    {isActive && isHighTier && <ShimmerOverlay />}

                    <CardItem
                      card={card}
                      isOwned={true}
                      mode="large"
                      showBack={false}
                      isFocused={isActive}
                      isNew={card.isNew}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      {!showPack && (
        <div className="w-full flex flex-col items-center gap-3 z-40 pb-6 pt-2 shrink-0 bg-gradient-to-t from-black via-black/80 to-transparent">
          {/* Card Dots & Navigation Buttons */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={prevCard}
              disabled={activeCardIndex === 0}
              aria-label="Previous card"
              className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                activeCardIndex === 0
                  ? 'opacity-20 border-white/10 text-zinc-600 cursor-not-allowed'
                  : 'border-white/20 bg-zinc-900/90 text-white hover:bg-zinc-800 active:scale-95'
              }`}
            >
              <ChevronLeft size={18} />
            </button>

            {/* Dots */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-950/80 border border-white/10">
              {cards.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleCardClick(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === activeCardIndex
                      ? 'w-6 bg-amber-400'
                      : i < activeCardIndex
                      ? 'w-2 bg-white/60 hover:bg-white'
                      : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={nextCard}
              disabled={activeCardIndex === totalCards - 1}
              aria-label="Next card"
              className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                activeCardIndex === totalCards - 1
                  ? 'opacity-20 border-white/10 text-zinc-600 cursor-not-allowed'
                  : 'border-white/20 bg-zinc-900/90 text-white hover:bg-zinc-800 active:scale-95'
              }`}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Action / Collect Button */}
          <div className="h-12 flex items-center justify-center">
            {allRevealed ? (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleClosePackOpener}
                className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black font-black px-8 py-3 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.4)] flex items-center gap-2 uppercase tracking-widest text-xs border border-amber-200 cursor-pointer"
              >
                <Check size={16} strokeWidth={3} />
                <span>Collect Cards</span>
              </motion.button>
            ) : (
              <button
                onClick={nextCard}
                className="text-zinc-400 hover:text-white text-[11px] font-bold uppercase tracking-widest px-4 py-2 transition-colors"
              >
                Card {activeCardIndex + 1} of {totalCards} · Tap Next →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Achievement Unlocked Modal Popup */}
      <AnimatePresence>
        {activeAchievementPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9500] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="w-full max-w-sm bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border-2 border-amber-500/60 rounded-3xl p-6 shadow-[0_0_60px_rgba(245,158,11,0.4)] flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse" />

              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.5)] mb-3 border border-amber-200/50">
                <Trophy className="text-black w-7 h-7" strokeWidth={2.5} />
              </div>

              <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400 italic mb-1">
                ACHIEVEMENT UNLOCKED!
              </h3>

              {currentCard && (
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider text-amber-300 mb-2">
                  <Award size={12} className="text-amber-400" />
                  <span>{currentCard.name}</span>
                </div>
              )}

              <h2 className="text-lg font-black text-white italic tracking-tight uppercase mb-1.5">
                {activeAchievementPopup.title}
              </h2>

              <p className="text-xs text-zinc-400 mb-4 px-2 line-clamp-2 leading-relaxed">
                {activeAchievementPopup.description}
              </p>

              <div className="w-full bg-zinc-950/90 border border-amber-500/30 rounded-2xl p-3 mb-5 flex flex-col items-center">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5">
                  Reward
                </span>
                <span className="text-sm font-black text-amber-400 uppercase tracking-wide">
                  {activeAchievementPopup.rewardText}
                </span>
              </div>

              <button
                onClick={handleClaimAchievement}
                className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 text-black font-black uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer border border-amber-200"
              >
                CLAIM
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
