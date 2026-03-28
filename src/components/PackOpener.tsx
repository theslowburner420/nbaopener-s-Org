import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, Rarity } from '../types';
import CardItem from './CardItem';
import { Check, Sparkles } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { useGame } from '../context/GameContext';

interface PackOpenerProps {
  cards: Card[];
  newlyUnlockedAchievements?: any[];
  onClose: () => void;
}

const getRarityColor = (rarity: Rarity) => {
  switch (rarity) {
    case 'bench': return '#94A3B8';
    case 'starter': return '#10B981';
    case 'allstar': return '#3B82F6';
    case 'franchise': return '#A855F7';
    case 'legend': return '#F59E0B';
    case 'dpoy': return '#10B981';
    case 'roty': return '#EA580C';
    case 'record': return '#F59E0B';
    case 'rookie': return '#3B82F6';
    default: return '#333';
  }
};

const ParticleBurst = React.memo(({ color, rarity }: { color: string, rarity: Rarity }) => {
  const isHighRarity = rarity === 'legend' || rarity === 'franchise' || rarity === 'dpoy' || rarity === 'roty' || rarity === 'record' || rarity === 'rookie';
  // Optimized particle counts: enough for impact, low enough for performance
  const baseCount = rarity === 'legend' || rarity === 'dpoy' || rarity === 'roty' || rarity === 'record' || rarity === 'rookie' ? 24 : rarity === 'franchise' ? 16 : 8;
  const particleCount = isHighRarity ? baseCount * 2 : baseCount;

  const particles = React.useMemo(() => {
    return Array.from({ length: particleCount }, (_, i) => {
      const angle = (i / particleCount) * 360 + (Math.random() * 40 - 20);
      const distance = (isHighRarity ? 120 : 80) + Math.random() * (isHighRarity ? 250 : 120);
      const tx = Math.cos(angle * Math.PI / 180) * distance;
      const ty = Math.sin(angle * Math.PI / 180) * distance;
      const scale = Math.random() * (isHighRarity ? 1.2 : 0.8) + 0.4;
      const dur = (Math.random() * 0.3 + 0.4) + (rarity === 'legend' || rarity === 'dpoy' || rarity === 'roty' || rarity === 'record' || rarity === 'rookie' ? 0.8 : rarity === 'franchise' ? 0.5 : 0);
      const rot = Math.random() * 720 - 360;
      return { tx, ty, scale, dur, rot, id: i };
    });
  }, [particleCount, isHighRarity, rarity]);

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
            width: isHighRarity ? '5px' : '3px',
            height: isHighRarity ? '5px' : '3px',
            boxShadow: `0 0 ${isHighRarity ? '8px' : '4px'} ${color}`,
            borderRadius: p.id % 2 === 0 ? '50%' : '2px',
            willChange: 'transform, opacity'
          } as any}
        />
      ))}
    </div>
  );
});

const FlareBurst = React.memo(({ color }: { color: string }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flare-burst"
          style={{
            transform: `rotate(${i * 60}deg)`,
            backgroundColor: color,
            boxShadow: `0 0 20px ${color}`,
            width: '3px',
            height: '200px',
            opacity: 0.8,
            willChange: 'transform, opacity'
          } as any}
        />
      ))}
    </div>
  );
});

const RarityBanner = React.memo(({ rarity, color }: { rarity: Rarity, color: string }) => {
  if (rarity !== 'legend' && rarity !== 'franchise' && rarity !== 'dpoy' && rarity !== 'roty' && rarity !== 'record' && rarity !== 'rookie') return null;

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: '100vw', opacity: 0.15 }}
      exit={{ width: 0, opacity: 0 }}
      className="absolute top-1/2 -translate-y-1/2 h-32 pointer-events-none z-0"
      style={{ backgroundColor: color, filter: 'blur(30px)' }}
    />
  );
});

const ShimmerOverlay = React.memo(() => (
  <div className="absolute inset-0 pointer-events-none z-[60] overflow-hidden rounded-xl">
    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer-sweep" />
  </div>
));

const Shockwave = React.memo(({ color }: { color: string }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[2000]">
      <div 
        className="shockwave" 
        style={{ borderColor: color, boxShadow: `0 0 50px ${color}` }} 
      />
    </div>
  );
});

const RarityBackgroundEffect = React.memo(({ rarity, isActive, isRevealing }: { rarity: Rarity, isActive: boolean, isRevealing: boolean }) => {
  if (!isActive || !isRevealing) return null;

  switch (rarity) {
    case 'legend':
    case 'record':
      return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute inset-0 bg-amber-500/30 animate-legend-lightning" />
          <FlareBurst color="#F59E0B" />
          <div className="god-rays opacity-100 scale-[2]" style={{ animationDuration: '8s' }} />
          {[...Array(40)].map((_, i) => (
            <div 
              key={`glitter-${i}`} 
              className="animate-legend-glitter" 
              style={{ 
                left: `${Math.random() * 100}%`, 
                '--dur': `${1.5 + Math.random() * 2.5}s`,
                animationDelay: `${Math.random() * 2}s`
              } as any} 
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-amber-500/20 to-transparent animate-pulse" />
        </div>
      );
    case 'franchise':
      return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute inset-0 bg-purple-500/30 animate-legend-lightning" />
          <div className="radial-lines opacity-60 scale-150" />
          <div className="animate-franchise-vortex" />
          <div className="god-rays opacity-80 scale-150" style={{ animationDuration: '12s', background: 'conic-gradient(from 0deg, transparent 0%, rgba(168, 85, 247, 0.3) 10%, transparent 20%)' }} />
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(168,85,247,0.2)_0%,transparent_70%)] animate-pulse" />
        </div>
      );
    case 'dpoy':
      return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-emerald-500/20 animate-white-flash" />
          <div className="w-[400px] h-[400px] border-[30px] border-emerald-500/40 rounded-full animate-dpoy-reveal-shield-bg" />
          <div className="w-[200px] h-[200px] border-[10px] border-emerald-500/20 rounded-full animate-dpoy-reveal-shield-bg" style={{ animationDelay: '0.2s' }} />
          {[...Array(8)].map((_, i) => (
            <div 
              key={`scan-${i}`} 
              className="animate-dpoy-grid-scan" 
              style={{ animationDelay: `${i * 0.3}s` }} 
            />
          ))}
          <div className="god-rays opacity-50 scale-150" style={{ animationDuration: '18s', background: 'conic-gradient(from 0deg, transparent 0%, rgba(16, 185, 129, 0.3) 10%, transparent 20%)' }} />
        </div>
      );
    case 'roty':
    case 'rookie':
      return (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute inset-0 bg-orange-500/20 animate-white-flash" />
          <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-orange-500/60 via-orange-500/20 to-transparent animate-roty-reveal-rise-bg" />
          {[...Array(30)].map((_, i) => (
            <div 
              key={`flame-${i}`} 
              className="animate-roty-flame" 
              style={{ 
                left: `${Math.random() * 100}%`, 
                bottom: '0',
                '--dur': `${0.8 + Math.random() * 1.5}s`,
                animationDelay: `${Math.random() * 1}s`
              } as any} 
            />
          ))}
          <div className="absolute inset-0 bg-orange-500/5 animate-pulse" />
        </div>
      );
    default:
      return null;
  }
});

export default function PackOpener({ cards, newlyUnlockedAchievements = [], onClose }: PackOpenerProps) {
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [isRevealing, setIsRevealing] = useState(true);
  const [showPack, setShowPack] = useState(true);
  const [hasOpenedPack, setHasOpenedPack] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [isPreloaded, setIsPreloaded] = useState(false);
  const [shownAchievementIds, setShownAchievementIds] = useState<Set<string>>(new Set());

  const { notify } = useNotification();
  const { unlockAchievement, addCoins, coins, addPackToInventory } = useGame();

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    // Preload images for all cards in the pack
    const preloadImages = async () => {
      const promises = cards.flatMap(card => {
        const cardImg = new Image();
        cardImg.src = card.imageUrl;
        
        const logoImg = new Image();
        if (card.teamLogoUrl) {
          logoImg.src = card.teamLogoUrl;
        }
        
        return [
          new Promise(resolve => { cardImg.onload = resolve; cardImg.onerror = resolve; }),
          card.teamLogoUrl ? new Promise(resolve => { logoImg.onload = resolve; logoImg.onerror = resolve; }) : Promise.resolve()
        ];
      });
      
      await Promise.all(promises);
      setIsPreloaded(true);
    };

    preloadImages();

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [cards]);

  const totalCards = cards.length;

  React.useEffect(() => {
    // Trigger a quick reveal effect for every card change
    setIsRevealing(true);
    
    const card = cards[activeCardIndex];
    const rarity = card.rarity;
    const isHighRarity = rarity === 'legend' || rarity === 'dpoy' || rarity === 'roty' || rarity === 'record' || rarity === 'rookie' || card.category === 'Dynasty';
    
    // Initial pack opening logic
    if (activeCardIndex === 0 && !hasOpenedPack) {
      setShowPack(true);
      const packTimer = setTimeout(() => setShowPack(false), 800);
      
      const duration = isHighRarity ? 2200 : 1200;
      const revealTimer = setTimeout(() => {
        setIsRevealing(false);
        setHasOpenedPack(true);
      }, duration);
      
      return () => {
        clearTimeout(packTimer);
        clearTimeout(revealTimer);
      };
    } else {
      // Quick flash/reveal for subsequent cards
      setShowPack(false);
      const duration = isHighRarity ? 1200 : 600;
      const revealTimer = setTimeout(() => {
        setIsRevealing(false);
      }, duration);
      
      return () => clearTimeout(revealTimer);
    }
  }, [activeCardIndex, cards, hasOpenedPack]);

  // Handle achievement notifications during reveal
  React.useEffect(() => {
    if (isRevealing && isPreloaded) {
      const currentCard = cards[activeCardIndex];
      const achievementsToTrigger = newlyUnlockedAchievements.filter(ach => 
        !shownAchievementIds.has(ach.id) && 
        (ach.triggeredByCardId === currentCard.id || ach.triggeredByCardId === null)
      );

      if (achievementsToTrigger.length > 0) {
        achievementsToTrigger.forEach(ach => {
          // Mark as shown immediately to prevent duplicate triggers
          setShownAchievementIds(prev => new Set(prev).add(ach.id));
          
          // Delay slightly to align with card impact
          setTimeout(() => {
            unlockAchievement(ach.id);
            notify({
              id: ach.id,
              title: ach.title,
              description: ach.description,
              reward: ach.reward,
              icon: ach.icon
            });
            
            if (ach.rewardCoins) {
              addCoins(ach.rewardCoins);
            }
            if (ach.packReward) {
              addPackToInventory(ach.packReward);
            }
          }, 400);
        });
      }
    }
  }, [activeCardIndex, isRevealing, isPreloaded, newlyUnlockedAchievements, shownAchievementIds, notify, unlockAchievement, addCoins, addPackToInventory, cards]);

  const nextCard = React.useCallback(() => {
    if (activeCardIndex < totalCards - 1) {
      setActiveCardIndex(prev => prev + 1);
    }
  }, [activeCardIndex, totalCards]);

  const prevCard = React.useCallback(() => {
    if (activeCardIndex > 0) {
      setActiveCardIndex(prev => prev - 1);
    }
  }, [activeCardIndex]);

  const handleCardClick = React.useCallback((index: number) => {
    if (index !== activeCardIndex) {
      setActiveCardIndex(index);
    }
  }, [activeCardIndex]);

  const allRevealed = activeCardIndex === totalCards - 1;

  // Grid positions based on total cards
  const getGridPosition = React.useCallback((index: number) => {
    const isActive = index === activeCardIndex;
    const isSeen = index < activeCardIndex;
    const isUnseen = index > activeCardIndex;

    if (isActive) {
      // Center active card - optimized for full visibility
      return { 
        x: 0, 
        y: isMobile ? -20 : 0, 
        scale: isMobile ? 0.75 : 1, 
        rotate: 0, 
        zIndex: 100 
      };
    }

    if (isSeen) {
      // Compact fan stack on the left - much closer to the center
      const distanceFromActive = activeCardIndex - index;
      // Only show the top 3-4 cards in the stack for performance and clarity
      if (distanceFromActive > 5) return { x: -100, y: 100, scale: 0, rotate: -45, zIndex: 0, opacity: 0 };
      
      const angle = -8 - (distanceFromActive * 2);
      const xOffset = isMobile ? -10 - (distanceFromActive * 8) : -15 - (distanceFromActive * 12);
      const yOffset = 5 + (distanceFromActive * 4);
      
      return { 
        x: xOffset, 
        y: yOffset, 
        scale: isMobile ? 0.6 : 0.8, 
        rotate: angle, 
        zIndex: 50 - distanceFromActive,
        opacity: 1
      };
    }

    // Compact fan stack on the right (unseen cards)
    const distanceFromActive = index - activeCardIndex;
    if (distanceFromActive > 5) return { x: 100, y: 100, scale: 0, rotate: 45, zIndex: 0, opacity: 0 };

    const angle = 8 + (distanceFromActive * 2);
    const xOffset = isMobile ? 10 + (distanceFromActive * 8) : 15 + (distanceFromActive * 12);
    const yOffset = 5 + (distanceFromActive * 4);

    return { 
      x: xOffset, 
      y: yOffset, 
      scale: isMobile ? 0.6 : 0.8, 
      rotate: angle, 
      zIndex: 50 - distanceFromActive,
      opacity: 1
    };
  }, [activeCardIndex, isMobile]);

  if (!isPreloaded) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[8000] bg-black flex items-center justify-center"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-amber-500 font-black uppercase tracking-widest text-xs">Preparing Pack...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[8000] bg-black flex flex-col items-center justify-center overflow-hidden h-[100dvh] select-none pointer-events-auto isolation-isolate gpu-accelerated ${
        isRevealing ? 'animate-screen-shake-intense' : ''
      }`}
    >
      {/* Dark Overlay for focus */}
      <div className="absolute inset-0 bg-black/80 z-0 pointer-events-none" />

      {/* Background Glow & Special Effects */}
      <AnimatePresence mode="wait">
        <motion.div 
            key={activeCardIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 blur-[150px] pointer-events-none transition-all duration-700 will-change-opacity ${
              isRevealing && (cards[activeCardIndex].rarity === 'legend' || cards[activeCardIndex].category === 'Dynasty' || cards[activeCardIndex].category === 'X-Factor') ? 'animate-screen-darken' : ''
            }`}
            style={{ 
              backgroundColor: cards[activeCardIndex].category === 'Dynasty' ? '#EF4444' : 
                               cards[activeCardIndex].category === 'X-Factor' ? '#60A5FA' : 
                               getRarityColor(cards[activeCardIndex].rarity)
            }}
          />
        {/* Screen-wide Vignette */}
        <div 
          className={`absolute inset-0 pointer-events-none z-[10] will-change-transform ${isRevealing ? 'animate-shimmer-bg' : ''}`}
          style={{ 
            background: `radial-gradient(circle, transparent 20%, ${getRarityColor(cards[activeCardIndex].rarity)}22 100%)`
          }}
        />
      </AnimatePresence>

      {/* Screen-wide visual cues */}
      <AnimatePresence>
        {isRevealing && (
          <div className={`absolute inset-0 z-[2500] pointer-events-none flex items-center justify-center overflow-hidden`}>
            {/* Rarity Banner */}
            <RarityBanner 
              rarity={cards[activeCardIndex].rarity} 
              color={getRarityColor(cards[activeCardIndex].rarity)} 
            />

            {/* Intense White Flash */}
            <div className="absolute inset-0 bg-white z-[3000] animate-white-flash-intense pointer-events-none" />

            {/* Shockwave for all reveals */}
            <div 
              className="shockwave" 
              style={{ 
                borderColor: getRarityColor(cards[activeCardIndex].rarity),
                animationDuration: (cards[activeCardIndex].rarity === 'legend' || cards[activeCardIndex].rarity === 'dpoy' || cards[activeCardIndex].rarity === 'roty' || cards[activeCardIndex].rarity === 'record' || cards[activeCardIndex].rarity === 'rookie') ? '1.5s' : '1s',
                willChange: 'transform, opacity'
              } as any} 
            />

            {/* Radial Lines */}
            <div 
              className={`radial-lines ${(cards[activeCardIndex].rarity === 'legend' || cards[activeCardIndex].rarity === 'dpoy' || cards[activeCardIndex].rarity === 'roty' || cards[activeCardIndex].rarity === 'record' || cards[activeCardIndex].rarity === 'rookie') ? 'scale-150 opacity-50' : 'opacity-20'}`} 
              style={{ willChange: 'transform, opacity' }}
            />
            
            {/* Rarity Specific Text & Particles */}
            {isRevealing && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {cards[activeCardIndex].category === 'All-Star MVP' && (
                  <>
                    <ParticleBurst color="#F59E0B" rarity="allstar" />
                    <FlareBurst color="#F59E0B" />
                    <motion.div
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 2, opacity: 0 }}
                      className="absolute top-[15%] text-amber-500 font-black text-6xl md:text-9xl italic tracking-tighter uppercase drop-shadow-[0_0_50px_rgba(245,158,11,0.8)] animate-text-reveal-glow"
                    >
                      All-Star MVP
                    </motion.div>
                  </>
                )}
                {cards[activeCardIndex].category === 'Dynasty' && (
                  <>
                    <ParticleBurst color="#EF4444" rarity="legend" />
                    <FlareBurst color="#EF4444" />
                    <motion.div
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 2, opacity: 0 }}
                      className="absolute top-[15%] text-red-500 font-black text-6xl md:text-9xl italic tracking-tighter uppercase drop-shadow-[0_0_50px_rgba(239,68,68,0.8)] animate-text-reveal-glow"
                    >
                      Dynasty
                    </motion.div>
                  </>
                )}
                {cards[activeCardIndex].category === 'X-Factor' && (
                  <>
                    <ParticleBurst color="#60A5FA" rarity="allstar" />
                    <FlareBurst color="#60A5FA" />
                    <motion.div
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 2, opacity: 0 }}
                      className="absolute top-[15%] text-blue-400 font-black text-6xl md:text-9xl italic tracking-tighter uppercase drop-shadow-[0_0_50px_rgba(96,165,250,0.8)] animate-text-reveal-glow"
                    >
                      X-Factor
                    </motion.div>
                  </>
                )}
                {cards[activeCardIndex].category !== 'Dynasty' && (cards[activeCardIndex].rarity === 'legend' || cards[activeCardIndex].rarity === 'dpoy' || cards[activeCardIndex].rarity === 'roty' || cards[activeCardIndex].rarity === 'record' || cards[activeCardIndex].rarity === 'rookie') && (
                  <>
                    <ParticleBurst color={cards[activeCardIndex].rarity === 'legend' ? "#F59E0B" : cards[activeCardIndex].rarity === 'dpoy' ? "#10B981" : cards[activeCardIndex].rarity === 'roty' ? "#EA580C" : cards[activeCardIndex].rarity === 'rookie' ? "#3B82F6" : "#F59E0B"} rarity={cards[activeCardIndex].rarity} />
                    <FlareBurst color={cards[activeCardIndex].rarity === 'legend' ? "#F59E0B" : cards[activeCardIndex].rarity === 'dpoy' ? "#10B981" : cards[activeCardIndex].rarity === 'roty' ? "#EA580C" : cards[activeCardIndex].rarity === 'rookie' ? "#3B82F6" : "#F59E0B"} />
                    {/* Extra persistent sparkles for legend/dpoy/roty/record/rookie */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      {Array.from({ length: 6 }).map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{ 
                            scale: [0, 1, 0],
                            opacity: [0, 0.8, 0],
                            rotate: [0, 180, 360]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity, 
                            delay: Math.random() * 2,
                            ease: "easeInOut"
                          }}
                          className="absolute w-1.5 h-1.5 bg-white rounded-full blur-[1px]"
                          style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                          }}
                        />
                      ))}
                    </motion.div>
                  </>
                )}
                {cards[activeCardIndex].rarity === 'franchise' && (
                  <>
                    <ParticleBurst color="#A855F7" rarity="franchise" />
                    <FlareBurst color="#A855F7" />
                  </>
                )}
                {cards[activeCardIndex].rarity === 'allstar' && <ParticleBurst color="#3B82F6" rarity="allstar" />}
              </div>
            )}

            {cards[activeCardIndex].rarity === 'starter' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-full h-full bg-[radial-gradient(circle,rgba(16,185,129,0.2)_0%,transparent_70%)]" />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 1.2, opacity: 0 }}
                  className="absolute top-1/4 text-emerald-400 font-black text-3xl md:text-4xl italic tracking-tighter uppercase drop-shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-text-reveal-glow"
                >
                  Starter
                </motion.div>
                {/* Subtle Green Particles */}
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i}
                    className="particle"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 0.5}s`,
                      backgroundColor: '#10B981',
                      width: '3px',
                      height: '3px',
                      '--tw-translate-x': `${(Math.random() - 0.5) * 100}px`,
                      '--tw-rotate': `${(Math.random() - 0.5) * 360}deg`,
                    } as any}
                  />
                ))}
              </motion.div>
            )}

            {cards[activeCardIndex].rarity === 'allstar' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-full h-full bg-[radial-gradient(circle,rgba(59,130,246,0.3)_0%,transparent_70%)] animate-pulse" />
                <motion.div
                  initial={{ scale: 0.7, opacity: 0, y: 30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 1.3, opacity: 0 }}
                  className="absolute top-1/4 text-blue-400 font-black text-4xl md:text-5xl italic tracking-tighter uppercase drop-shadow-[0_0_20px_rgba(59,130,246,0.7)] animate-text-reveal-glow"
                >
                  All-Star
                </motion.div>
                {/* Blue Particles */}
                {[...Array(15)].map((_, i) => (
                  <div 
                    key={i}
                    className="particle"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 0.7}s`,
                      backgroundColor: i % 2 === 0 ? '#3B82F6' : '#60A5FA',
                      width: `${Math.random() * 4 + 2}px`,
                      height: `${Math.random() * 4 + 2}px`,
                      '--tw-translate-x': `${(Math.random() - 0.5) * 200}px`,
                      '--tw-rotate': `${(Math.random() - 0.5) * 720}deg`,
                    } as any}
                  />
                ))}
              </motion.div>
            )}

            {cards[activeCardIndex].rarity === 'franchise' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-full h-full bg-[radial-gradient(circle,rgba(168,85,247,0.4)_0%,transparent_70%)] animate-purple-flash" />
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  className="absolute top-1/4 text-purple-400 font-black text-5xl md:text-7xl italic tracking-tighter uppercase drop-shadow-[0_0_30px_rgba(168,85,247,0.8)] animate-text-reveal-glow"
                >
                  Franchise
                </motion.div>

                {/* Franchise Energy Pulse */}
                <div 
                  className="energy-pulse" 
                  style={{ '--rarity-color': '#A855F7' } as any} 
                />

                {/* Particles for Franchise */}
                {[...Array(15)].map((_, i) => (
                  <div 
                    key={i}
                    className="particle"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 1.2}s`,
                      backgroundColor: i % 2 === 0 ? '#A855F7' : '#D8B4FE',
                      width: `${Math.random() * 6 + 2}px`,
                      height: `${Math.random() * 6 + 2}px`,
                      boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)',
                      '--tw-translate-x': `${(Math.random() - 0.5) * 400}px`,
                      '--tw-rotate': `${(Math.random() - 0.5) * 1080}deg`,
                    } as any}
                  />
                ))}

                {/* Embers for Franchise */}
                {[...Array(4)].map((_, i) => (
                  <div 
                    key={`ember-${i}`}
                    className="ember"
                    style={{
                      left: `${Math.random() * 100}%`,
                      bottom: '-20px',
                      animationDelay: `${Math.random() * 2}s`,
                      backgroundColor: '#A855F7',
                      width: '4px',
                      height: '4px',
                      boxShadow: '0 0 8px #A855F7',
                      '--tw-translate-x': `${(Math.random() - 0.5) * 150}px`,
                      '--tw-rotate': `${Math.random() * 360}deg`,
                    } as any}
                  />
                ))}
              </motion.div>
            )}

            {(cards[activeCardIndex].rarity === 'legend' || cards[activeCardIndex].rarity === 'dpoy' || cards[activeCardIndex].rarity === 'roty' || cards[activeCardIndex].rarity === 'record' || cards[activeCardIndex].rarity === 'rookie') && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className={`w-full h-full bg-[radial-gradient(circle,${cards[activeCardIndex].rarity === 'legend' || cards[activeCardIndex].rarity === 'record' ? 'rgba(245,158,11,0.5)' : cards[activeCardIndex].rarity === 'dpoy' ? 'rgba(16,185,129,0.5)' : cards[activeCardIndex].rarity === 'rookie' ? 'rgba(59,130,246,0.5)' : 'rgba(234,88,12,0.5)'}_0%,transparent_70%)] ${cards[activeCardIndex].rarity === 'legend' || cards[activeCardIndex].rarity === 'record' ? 'animate-gold-radial-pulse' : cards[activeCardIndex].rarity === 'dpoy' ? 'animate-dpoy-radial-pulse' : cards[activeCardIndex].rarity === 'rookie' ? 'animate-rookie-radial-pulse' : 'animate-roty-radial-pulse'}`} />
                <div className="absolute inset-0 bg-white animate-white-flash" />
                
                <motion.div
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 2, opacity: 0 }}
                  className={`absolute top-[15%] ${cards[activeCardIndex].rarity === 'legend' || cards[activeCardIndex].rarity === 'record' ? 'text-amber-400' : cards[activeCardIndex].rarity === 'dpoy' ? 'text-emerald-400' : cards[activeCardIndex].rarity === 'rookie' ? 'text-blue-400' : 'text-orange-400'} font-black text-6xl md:text-9xl italic tracking-tighter uppercase drop-shadow-[0_0_50px_${cards[activeCardIndex].rarity === 'legend' || cards[activeCardIndex].rarity === 'record' ? 'rgba(245,158,11,0.8)' : cards[activeCardIndex].rarity === 'dpoy' ? 'rgba(16,185,129,0.8)' : cards[activeCardIndex].rarity === 'rookie' ? 'rgba(59,130,246,0.8)' : 'rgba(234,88,12,0.8)'}] animate-text-reveal-glow`}
                >
                  {cards[activeCardIndex].rarity === 'legend' ? 'Legendary' : cards[activeCardIndex].rarity === 'dpoy' ? 'DPOY' : cards[activeCardIndex].rarity === 'roty' ? 'ROTY' : cards[activeCardIndex].rarity === 'rookie' ? 'ROOKIE' : 'RECORD'}
                </motion.div>

                {/* Energy Pulse */}
                <div 
                  className="energy-pulse" 
                  style={{ '--rarity-color': cards[activeCardIndex].rarity === 'legend' || cards[activeCardIndex].rarity === 'record' ? '#F59E0B' : cards[activeCardIndex].rarity === 'dpoy' ? '#10B981' : cards[activeCardIndex].rarity === 'rookie' ? '#3B82F6' : '#EA580C', animationDuration: '0.5s' } as any} 
                />

                {/* Particles */}
                {[...Array(cards[activeCardIndex].rarity === 'legend' || cards[activeCardIndex].rarity === 'record' || cards[activeCardIndex].rarity === 'rookie' ? 20 : 15)].map((_, i) => (
                  <div 
                    key={i}
                    className="particle"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      backgroundColor: cards[activeCardIndex].rarity === 'legend' || cards[activeCardIndex].rarity === 'record'
                        ? (i % 3 === 0 ? '#F59E0B' : (i % 3 === 1 ? '#FFF' : '#FCD34D'))
                        : cards[activeCardIndex].rarity === 'rookie'
                        ? (i % 2 === 0 ? '#3B82F6' : '#93C5FD')
                        : cards[activeCardIndex].rarity === 'dpoy'
                        ? (i % 2 === 0 ? '#10B981' : '#D1FAE5')
                        : (i % 2 === 0 ? '#EA580C' : '#FFEDD5'),
                      width: `${Math.random() * 8 + 2}px`,
                      height: `${Math.random() * 8 + 2}px`,
                      borderRadius: i % 4 === 0 ? '0%' : '50%',
                      boxShadow: `0 0 15px ${cards[activeCardIndex].rarity === 'legend' || cards[activeCardIndex].rarity === 'record' ? 'rgba(245,158,11,0.6)' : cards[activeCardIndex].rarity === 'rookie' ? 'rgba(59,130,246,0.6)' : cards[activeCardIndex].rarity === 'dpoy' ? 'rgba(16,185,129,0.6)' : 'rgba(234,88,12,0.6)'}`,
                      '--tw-translate-x': `${(Math.random() - 0.5) * 600}px`,
                      '--tw-rotate': `${(Math.random() - 0.5) * 1440}deg`,
                    } as any}
                  />
                ))}

                {/* Gold Dust for Legend/Record */}
                {(cards[activeCardIndex].rarity === 'legend' || cards[activeCardIndex].rarity === 'record') && [...Array(10)].map((_, i) => (
                  <div 
                    key={`dust-${i}`}
                    className="gold-dust"
                    style={{
                      left: '50%',
                      top: '50%',
                      animationDelay: `${Math.random() * 1.5}s`,
                      '--tw-translate-x': `${(Math.random() - 0.5) * 800}px`,
                      '--tw-translate-y': `${(Math.random() - 0.5) * 800}px`,
                    } as any}
                  />
                ))}
              </motion.div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Main Card Area - Centered and responsive */}
      <div className="flex-1 w-full flex items-center justify-center relative z-10">
        {cards.map((card, index) => {
          const isActive = index === activeCardIndex;
          const isAllStar = card.rarity === 'allstar';
          const isFranchise = card.rarity === 'franchise';
          const isLegend = card.rarity === 'legend';
          const isRecord = card.rarity === 'record';
          const isRookie = card.rarity === 'rookie';
          const isDPOY = card.rarity === 'dpoy';
          const isROTY = card.rarity === 'roty';
          const pos = getGridPosition(index);

          return (
            <motion.div
              key={`${card.id}-${index}-${activeCardIndex === index}`}
              drag={isActive ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.8}
              onDragEnd={(_, info) => {
                const swipeThreshold = 50;
                const velocityThreshold = 500;
                
                if (isActive) {
                  // Swipe left to go next
                  if (info.offset.x < -swipeThreshold || info.velocity.x < -velocityThreshold) {
                    nextCard();
                  }
                  // Swipe right to go back
                  if (info.offset.x > swipeThreshold || info.velocity.x > velocityThreshold) {
                    prevCard();
                  }
                }
              }}
              initial={{ y: 1000, opacity: 0, scale: 0.5 }}
              animate={{
                x: pos.x,
                y: pos.y,
                scale: pos.scale,
                rotate: pos.rotate,
                opacity: pos.opacity ?? 1,
                zIndex: pos.zIndex,
                filter: isActive ? 'brightness(1) contrast(1)' : 'brightness(0.2) contrast(0.7)',
              }}
              whileHover={isActive ? { 
                scale: 1.02,
                transition: { duration: 0.2 }
              } : {}}
              transition={{ 
                type: "spring",
                stiffness: 250,
                damping: 30,
                mass: 0.8
              }}
              className={`absolute w-[220px] xs:w-[260px] md:w-[320px] max-h-[65vh] md:max-h-[75vh] aspect-[2.5/3.5] touch-none gpu-accelerated ${
                !isActive ? 'pointer-events-none' : 'cursor-pointer'
              } ${
                isActive && isRevealing ? 'animate-impact-scale' : ''
              } ${
                isActive && (isLegend || isRecord || isFranchise || isDPOY || isROTY || isRookie) ? 'animate-aura-pulse' : ''
              } ${
                isActive && isFranchise && isRevealing ? 'animate-franchise-reveal animate-intense-glow-franchise' : ''
              } ${
                isActive && (isLegend || isRecord) && isRevealing ? 'animate-legend-reveal animate-intense-glow-legend' : ''
              } ${
                isActive && isDPOY && isRevealing ? 'animate-dpoy-reveal animate-intense-glow-dpoy' : ''
              } ${
                isActive && isROTY && isRevealing ? 'animate-roty-reveal animate-intense-glow-roty' : ''
              } ${
                isActive && isRookie && isRevealing ? 'animate-roty-reveal animate-intense-glow-rookie' : ''
              } ${
                isActive && isAllStar && isRevealing ? 'animate-intense-glow-allstar' : ''
              } ${
                isActive && isFranchise && !isRevealing ? 'animate-intense-glow-franchise' : ''
              } ${
                isActive && (isLegend || isRecord) && !isRevealing ? (isLegend || isRecord ? 'animate-intense-glow-legend' : 'animate-intense-glow-record') : ''
              } ${
                isActive && isAllStar && !isRevealing ? 'animate-intense-glow-allstar' : ''
              } ${!isActive ? 'rounded-xl overflow-hidden' : ''}`}
              style={{
                animationDuration: (isLegend || isDPOY || isROTY || isRookie) && isRevealing ? '2.5s' : '1.5s',
                willChange: 'transform, opacity, filter',
                '--aura-color': getRarityColor(card.rarity)
              } as any}
              onClick={() => handleCardClick(index)}
            >
              <div className={`w-full h-full ${isActive && (isLegend || isDPOY || isROTY || isFranchise || isRecord || isRookie) ? 'relative' : ''}`}>
                {/* Shimmer effect for high rarity */}
                {isActive && (isLegend || isRecord || isFranchise || isDPOY || isROTY || isRookie) && <ShimmerOverlay />}

                {/* God Rays for High Rarity */}
                <RarityBackgroundEffect rarity={card.rarity} isActive={isActive} isRevealing={isRevealing} />

                {showPack && isActive ? (
                  <motion.div
                    key="pack"
                    initial={{ scale: 0.8, rotate: 0 }}
                    animate={{ 
                      scale: [0.8, 1.1, 0.9, 1.2],
                      rotate: [0, -5, 5, -5, 5, 0],
                    }}
                    exit={{ scale: 2, opacity: 0, filter: 'brightness(2)' }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="w-full h-full flex items-center justify-center"
                  >
                    <div className="w-40 h-56 sm:w-48 sm:h-64 bg-gradient-to-br from-amber-500 to-amber-900 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.5)] border-2 border-white/20 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                      <Sparkles size={isMobile ? 48 : 64} className="text-white/80 animate-pulse" />
                      <div className="absolute bottom-4 text-white font-black italic uppercase tracking-widest text-[10px] sm:text-xs">Opening...</div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="w-full h-full">
                    {/* Golden Glow for Rare Cards (>85) */}
                    {cards[index].stats.ovr > 85 && isActive && !isRevealing && (
                      <div className="absolute inset-[-20px] bg-amber-500/20 blur-3xl rounded-full animate-pulse z-[-1]" />
                    )}
                    
                    <CardItem 
                      card={card} 
                      isOwned={true} 
                      mode="large"
                      showBack={false}
                      isFocused={isActive}
                      isNew={card.isNew}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Action Button - Moved outside content div for better stacking */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-6 sm:bottom-12 flex flex-col items-center gap-3 sm:gap-4 z-[4000] pointer-events-auto pb-safe"
        >
          <div className="flex items-center gap-4 sm:gap-8 mb-2 sm:mb-4">
            <button 
              onClick={(e) => { e.stopPropagation(); prevCard(); }}
              disabled={activeCardIndex === 0}
              className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest px-4 sm:px-6 py-2 sm:py-3 rounded-full border border-white/10 transition-all shadow-xl ${activeCardIndex === 0 ? 'opacity-20 cursor-not-allowed' : 'bg-zinc-800 text-white hover:bg-zinc-700 active:scale-95'}`}
            >
              Prev
            </button>
            <div className="flex gap-1.5 sm:gap-2">
              {cards.map((_, i) => (
                <div 
                  key={i}
                  className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${
                    i === activeCardIndex ? 'w-4 sm:w-6 bg-white' : (i < activeCardIndex ? 'w-1.5 sm:w-2 bg-white/60' : 'w-1.5 sm:w-2 bg-white/20')
                  }`}
                />
              ))}
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); nextCard(); }}
              disabled={activeCardIndex === totalCards - 1}
              className={`text-[8px] sm:text-[10px] font-black uppercase tracking-widest px-4 sm:px-6 py-2 sm:py-3 rounded-full border border-white/10 transition-all shadow-xl ${activeCardIndex === totalCards - 1 ? 'opacity-20 cursor-not-allowed' : 'bg-zinc-800 text-white hover:bg-zinc-700 active:scale-95'}`}
            >
              Next
            </button>
          </div>

          {allRevealed && (
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="bg-white text-black font-black px-8 sm:px-12 py-3 sm:py-4 rounded-full shadow-[0_0_50px_rgba(255,255,255,0.3)] flex items-center gap-2 sm:gap-3 uppercase tracking-widest text-[10px] sm:text-xs hover:bg-amber-400 transition-all active:scale-95 border-2 border-white/50"
            >
              <Check size={isMobile ? 14 : 18} strokeWidth={3} />
              Collect Cards
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
