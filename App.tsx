/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, lazy, Suspense } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { NotificationProvider } from './context/NotificationContext';
import { ALL_CARDS } from './data/cards';
import { isScreamEditionActive } from './constants/screamEdition';
import { LogIn, LogOut, User as UserIcon, Coins, AlertCircle, ChevronDown, Settings, Cloud, Check, RefreshCw, X, Gift, Star, Home, ShoppingBag, LayoutGrid, Trophy, Zap, AlertTriangle, Loader2, Sparkles, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MemoryManager } from './lib/memory';
import { Analytics } from "@vercel/analytics/react";

import Header from './components/Header';
import StaticAd from './components/StaticAd';
import HalloweenEventModal from './components/HalloweenEventModal';
import RewardedVideoModal from './components/RewardedVideoModal';
import { unityAdsService } from './services/unityAdsService';
import { Puzzle } from 'lucide-react';

// Lazy load views for code splitting
const HomeView = lazy(() => import('./views/HomeView'));
const CollectionView = lazy(() => import('./views/CollectionView'));
const OpenView = lazy(() => import('./views/OpenView'));
const DraftView = lazy(() => import('./views/DraftView'));
const PacksView = lazy(() => import('./views/PacksView'));
const RewardsView = lazy(() => import('./views/RewardsView'));
const ShopView = lazy(() => import('./views/ShopView'));
const ProfileView = lazy(() => import('./views/ProfileView'));
const TradingView = lazy(() => import('./views/TradingView'));
const CareerView = lazy(() => import('./views/CareerView'));
const SbcView = lazy(() => import('./views/SbcView'));

// High-Fidelity Immersive View Loader
const ViewLoader = () => {
  const loadingHints = [
    "DRAFTING FUTURE ALL-STARS...",
    "POLISHING PREMIUM PLAYER CARDS...",
    "CONFIGURING GAME LINEUPS...",
    "SYNCHRONIZING LOCKER ROOMS...",
    "SIMULATING LEAGUE SEASONS...",
    "GENERATING EXCLUSIVE PACKS...",
    "PREPARING LIVE STADIUMS..."
  ];
  
  // Pick a hint based on random/time index for freshness
  const hintIndex = Math.floor((Date.now() / 1500) % loadingHints.length);
  const hint = loadingHints[hintIndex];

  return (
    <div className="h-[70vh] w-full flex flex-col items-center justify-center bg-black relative overflow-hidden select-none">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-zinc-800/10 blur-[60px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Animated Badge Holder */}
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-b from-zinc-850 to-zinc-950 rounded-2xl flex items-center justify-center border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
          </div>
          {/* Scanning Line overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/20 to-transparent h-1/2 w-full top-0 left-0 animate-bounce" />
        </div>

        <div className="flex flex-col items-center gap-2">
          {/* Immersive typography & dynamic hints */}
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white animate-pulse">
            {hint}
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Initialising Component</span>
          </div>
        </div>

        {/* Dynamic scanning bar */}
        <div className="w-36 h-[2px] bg-zinc-900 rounded-full overflow-hidden relative">
          <div className="absolute h-full w-12 bg-gradient-to-r from-transparent via-amber-500 to-transparent animate-[shimmer_1.5s_infinite]" 
               style={{
                 animation: 'shimmer 1.2s infinite linear'
               }}
          />
        </div>
      </div>
      
      {/* Inline styles for custom shimmer animation since Tailwind configuration is kept standard */}
      <style>{`
        @keyframes shimmer {
          0% { left: -50px; }
          100% { left: 150px; }
        }
      `}</style>
    </div>
  );
};

function AppContent() {
  const { currentView, setCurrentView, isPremium, isAuthLoading, isInitialSyncDone, isOffline, syncError, showWelcomeGift, setShowWelcomeGift, login, user, claimLoginReward, claimedAchievements } = useGame();
  const [showLoginIncentive, setShowLoginIncentive] = useState(false);
  const [hasShownLoginIncentive, setHasShownLoginIncentive] = useState(false);
  const [showLoginBonusModal, setShowLoginBonusModal] = useState(false);
  const [claimingLoginBonus, setClaimingLoginBonus] = useState(false);
  const isScreamActive = isScreamEditionActive();
  const [isHalloweenModalOpen, setIsHalloweenModalOpen] = useState(false);
  const [sbcInitialCategory, setSbcInitialCategory] = useState<any>('all');
  const [spookyFogEnabled, setSpookyFogEnabled] = useState<boolean>(() => {
    return localStorage.getItem('hoops_spooky_fog') !== 'false';
  });

  // Rewarded Video In-App Ad Player State
  const [rewardedAdState, setRewardedAdState] = useState<{
    isOpen: boolean;
    rewardText: string;
    durationSeconds: number;
    onComplete?: () => Promise<void>;
    onClose?: () => void;
  }>({
    isOpen: false,
    rewardText: '+3,000 Coins',
    durationSeconds: 10,
  });

  useEffect(() => {
    unityAdsService.registerModalHandler((config) => {
      setRewardedAdState({
        isOpen: config.isOpen,
        rewardText: config.rewardText,
        durationSeconds: config.durationSeconds,
        onComplete: config.onComplete,
        onClose: config.onClose,
      });
    });

    return () => {
      unityAdsService.registerModalHandler(null);
    };
  }, []);

  useEffect(() => {
    const handleFogToggle = () => {
      setSpookyFogEnabled(localStorage.getItem('hoops_spooky_fog') !== 'false');
    };
    window.addEventListener('hoops-fog-toggle', handleFogToggle);
    return () => window.removeEventListener('hoops-fog-toggle', handleFogToggle);
  }, []);

  // Auto-open Halloween showcase modal on first visit of session if event is active
  useEffect(() => {
    if (isScreamActive) {
      const hasSeen = sessionStorage.getItem('hoops_halloween_modal_seen');
      if (!hasSeen) {
        setIsHalloweenModalOpen(true);
        sessionStorage.setItem('hoops_halloween_modal_seen', 'true');
      }
    }
  }, [isScreamActive]);

  // Listen for open-halloween-modal event from anywhere in the app
  useEffect(() => {
    const handleOpenModal = () => setIsHalloweenModalOpen(true);
    window.addEventListener('open-halloween-modal', handleOpenModal);
    return () => window.removeEventListener('open-halloween-modal', handleOpenModal);
  }, []);

  // Show login incentive if user is NOT logged in and hasn't seen it this session
  useEffect(() => {
    if (!user && isInitialSyncDone && !hasShownLoginIncentive) {
      const timer = setTimeout(() => {
        setShowLoginIncentive(true);
        setHasShownLoginIncentive(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, isInitialSyncDone, hasShownLoginIncentive]);

  // Show login bonus claim if logged in, initial sync is done, and not already claimed
  useEffect(() => {
    if (user && isInitialSyncDone && !showWelcomeGift && !claimedAchievements?.includes('login_bonus')) {
      const timer = setTimeout(() => {
        setShowLoginBonusModal(true);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      setShowLoginBonusModal(false);
    }
  }, [user, isInitialSyncDone, showWelcomeGift, claimedAchievements]);

  // Adsterra Script Logic - ONLY load if NOT premium
  useEffect(() => {
    if (isPremium) {
      // Remove any existing Adsterra scripts if they exist
      const scripts = document.querySelectorAll('script[src*="adsterra"]');
      scripts.forEach(s => s.remove());
      return;
    }
  }, [isPremium]);

  // Tactical Image Preloading (Prioritized)
  useEffect(() => {
    const prefetchAssets = () => {
      // 1. Critical Logos & Players
      const criticalLogos = [
        'https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg',
        'https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg',
        'https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg',
        'https://cdn.nba.com/logos/nba/1610612741/primary/L/logo.svg',
      ];
      
      const topPlayers = ALL_CARDS.slice(0, 15).map(c => c.imageUrl);
      
      // Use Link preloading for highest priority
      [...criticalLogos, ...topPlayers].forEach(url => {
        try {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = url;
          document.head.appendChild(link);
        } catch (e) { /* ignore */ }
      });

      // 2. Background prefetch remaining essential cards
      const remainingCards = ALL_CARDS.slice(15, 80);
      const batchSize = 10;
      for (let i = 0; i < remainingCards.length; i += batchSize) {
        setTimeout(() => {
          remainingCards.slice(i, i + batchSize).forEach(card => {
            const img = new Image();
            img.src = card.imageUrl;
            if (card.teamLogoUrl) {
              const logo = new Image();
              logo.src = card.teamLogoUrl;
            }
          });
        }, 2500 + (i * 250));
      }
    };
    
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(prefetchAssets, { timeout: 3000 });
    } else {
      setTimeout(prefetchAssets, 1200);
    }
  }, []);

  // Performance Optimization: Periodic Memory Cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      MemoryManager.optimizeMemory();
      MemoryManager.cleanupAssets();
    }, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, []);

  const handleViewChange = (view: typeof currentView) => {
    if (view !== currentView) {
      setCurrentView(view);
    }
  };

  const renderView = () => {
    return (
      <Suspense fallback={<ViewLoader />}>
        {(() => {
          switch (currentView) {
            case 'collection': return <CollectionView />;
            case 'open': return <OpenView />;
            case 'home': return <HomeView />;
            case 'draft': return <DraftView />;
            case 'packs': return <PacksView />;
            case 'rewards': return <RewardsView />;
            case 'shop': return <ShopView />;
            case 'profile': return <ProfileView />;
            case 'trading': return <TradingView />;
            case 'career': return <CareerView />;
            case 'sbc': return <SbcView initialCategory={sbcInitialCategory} />;
            default: return <HomeView />;
          }
        })()}
      </Suspense>
    );
  };

  if (syncError) {
    return (
      <div className="h-[100dvh] w-full bg-black flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-6">
          <AlertTriangle size={40} />
        </div>
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-2">Connection Error</h2>
        <p className="text-zinc-500 text-sm max-w-xs mb-8 leading-relaxed">
          {syncError}
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="px-10 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-400 transition-all active:scale-95 flex items-center gap-3"
        >
          <RefreshCw size={16} />
          Retry Connection
        </button>
      </div>
    );
  }

  if (isAuthLoading || !isInitialSyncDone) {
    return (
      <div className="h-[100dvh] w-full bg-black flex flex-col items-center justify-center gap-6 overflow-hidden">
        <div className="relative">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] border border-zinc-200 animate-bounce">
            <span className="text-black font-black text-xl italic tracking-tighter">HC</span>
          </div>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-zinc-900 rounded-full blur-sm animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-white animate-pulse">
            Establishing Link...
          </p>
          <div className="w-32 h-1 bg-zinc-900 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-amber-500"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-2">Checking Cloud Session</p>
        </div>
      </div>
    );
  }

  if (syncError) {
    return (
      <div className="h-[100dvh] w-full bg-black flex flex-col items-center justify-center p-8 text-center gap-6">
        <div className="w-20 h-20 bg-red-500/20 border border-red-500/50 rounded-3xl flex items-center justify-center text-red-500 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
          <AlertTriangle size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Connection Error</h2>
          <p className="text-zinc-500 text-sm max-w-xs mx-auto leading-relaxed">
            {syncError}
          </p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-400 transition-all flex items-center gap-3"
        >
          <RefreshCw size={16} />
          Retry Connection
        </button>
      </div>
    );
  }

  const isSpookyAtmosphereActive = isScreamActive && spookyFogEnabled;

  return (
    <div className={`h-[100dvh] w-full bg-black text-white flex flex-col font-sans selection:bg-amber-500 selection:text-black relative overflow-hidden ${
      isSpookyAtmosphereActive ? 'spooky-theme' : ''
    }`}>
      {/* Spooky Atmospheric Fog & Vignette Overlay */}
      {isSpookyAtmosphereActive && (
        <>
          <div className="spooky-fog-layer" aria-hidden="true" />
          <div className="spooky-vignette fixed inset-0 pointer-events-none z-[2]" aria-hidden="true" />
        </>
      )}

      {/* Premium Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] z-[10000] mix-blend-overlay bg-repeat" 
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
      
      {/* Offline Warning */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            key="offline-warning"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest py-1.5 text-center z-[6000] flex items-center justify-center gap-2"
          >
            <Zap size={12} className="animate-pulse" />
            Offline Mode: Progress will sync when connection returns
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Area */}
      {!(currentView === 'draft' || currentView === 'open') && (
        <div className="relative z-[9000] flex flex-col bg-black shrink-0">
          {/* Top Ad Area */}
          <StaticAd position="header" />
          
          {/* Global Header */}
          <Header />
        </div>
      )}
      
      {/* Content Area - Natural Scroll */}
      <main className={`flex-1 relative bg-black overflow-x-hidden custom-scrollbar ${
        (currentView === 'career' || currentView === 'draft') ? 'overflow-hidden' : 'overflow-y-auto'
      }`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`w-full ${(currentView === 'career' || currentView === 'draft') ? 'h-full flex flex-col' : ''}`}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Navigation Bar */}
      {!(currentView === 'draft' || currentView === 'open' || currentView === 'career') && (
        <div className="z-[4000] flex flex-col bg-black shrink-0">
          <nav className="h-11 bg-zinc-950/95 backdrop-blur-md border-t border-white/10 flex items-center justify-around px-3 pb-safe shrink-0">
            {/* Collection */}
            <button 
              onClick={() => handleViewChange('collection')}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
                currentView === 'collection' ? 'text-amber-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <LayoutGrid size={16} strokeWidth={currentView === 'collection' ? 2.2 : 1.8} />
              <span className="text-[8px] uppercase tracking-wider">Roster</span>
            </button>

            {/* Rewards */}
            <button 
              onClick={() => handleViewChange('rewards')}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
                currentView === 'rewards' ? 'text-amber-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Trophy size={16} strokeWidth={currentView === 'rewards' ? 2.2 : 1.8} />
              <span className="text-[8px] uppercase tracking-wider">Rewards</span>
            </button>
  
            {/* HOME (Center) */}
            <button 
              onClick={() => handleViewChange('home')}
              onMouseEnter={() => {
                const homeAssets = ALL_CARDS.slice(0, 5).map(c => c.imageUrl);
                homeAssets.forEach(url => { const img = new Image(); img.src = url; });
              }}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
                currentView === 'home' || currentView === 'open' || currentView === 'draft' ? 'text-amber-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Home size={16} strokeWidth={currentView === 'home' || currentView === 'open' || currentView === 'draft' ? 2.2 : 1.8} />
              <span className="text-[8px] uppercase tracking-wider">Home</span>
            </button>
  
            {/* Packs */}
            <button 
              onClick={() => handleViewChange('packs')}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
                currentView === 'packs' ? 'text-amber-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <ShoppingBag size={16} strokeWidth={currentView === 'packs' ? 2.2 : 1.8} />
              <span className="text-[8px] uppercase tracking-wider">Packs</span>
            </button>

            {/* Shop */}
            <button 
              onClick={() => handleViewChange('shop')}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-1 transition-colors ${
                currentView === 'shop' ? 'text-amber-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Coins size={16} strokeWidth={currentView === 'shop' ? 2.2 : 1.8} />
              <span className="text-[8px] uppercase tracking-wider">Shop</span>
            </button>
          </nav>
        </div>
      )}

      {/* Welcome Gift & Auth Modals */}
      <AnimatePresence>
        {showLoginIncentive && !user && (
          <motion.div
            key="login-incentive-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
              key="login-incentive-content"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl"
            >
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl mb-6">
                  <LogIn size={32} className="text-black" />
                </div>
                
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2 leading-none">
                  Save Your Progress
                </h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-6">
                  Login for Exclusive Rewards
                </p>
                
                <div className="space-y-3 w-full mb-8">
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                      <Cloud size={16} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white">Cloud Sync</p>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Never lose your collection</p>
                    </div>
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <Gift size={16} />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white">Login Bonus</p>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">+100,000 Coins & HOF/Legendary Packs</p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    login();
                    setShowLoginIncentive(false);
                  }}
                  className="w-full bg-white text-black py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-amber-400 active:scale-95 transition-all shadow-lg mb-3"
                >
                  Login with Google
                </button>
                
                <button
                  onClick={() => setShowLoginIncentive(false)}
                  className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-white transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showWelcomeGift && (
          <motion.div
            key="welcome-gift-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div
              key="welcome-gift-content"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm bg-zinc-900 border border-amber-500/30 rounded-3xl p-6 md:p-8 relative overflow-y-auto max-h-[90vh] shadow-[0_0_50px_rgba(245,158,11,0.2)]"
            >
              {/* Background Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/20 blur-[60px] rounded-full" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-amber-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)] mb-4 md:mb-6">
                  <Gift size={32} className="text-black md:w-10 md:h-10" />
                </div>
                
                <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white mb-1 md:mb-2 leading-none">
                  Welcome!
                </h2>
                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-amber-500 mb-4 md:mb-6">
                  Exclusive Starter Package
                </p>
                
                <div className="space-y-2 md:space-y-3 w-full mb-6 md:mb-8">
                  <div className="bg-black/40 border border-white/5 rounded-xl md:rounded-2xl p-3 md:p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <Coins size={14} className="md:w-4 md:h-4" />
                      </div>
                      <span className="text-xs md:text-sm font-black uppercase tracking-widest text-zinc-400">Coins</span>
                    </div>
                    <span className="text-lg md:text-xl font-black italic text-white">+150,000</span>
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded-xl md:rounded-2xl p-3 md:p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <ShoppingBag size={14} className="md:w-4 md:h-4" />
                      </div>
                      <span className="text-xs md:text-sm font-black uppercase tracking-widest text-zinc-400">Finals MVP Packs</span>
                    </div>
                    <span className="text-lg md:text-xl font-black italic text-white">x5</span>
                  </div>
                  
                  <div className="bg-black/40 border border-white/5 rounded-xl md:rounded-2xl p-3 md:p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                        <Star size={14} className="md:w-4 md:h-4" />
                      </div>
                      <span className="text-xs md:text-sm font-black uppercase tracking-widest text-zinc-400">HOF Packs</span>
                    </div>
                    <span className="text-lg md:text-xl font-black italic text-white">x3</span>
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded-xl md:rounded-2xl p-3 md:p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <Award size={14} className="md:w-4 md:h-4" />
                      </div>
                      <span className="text-xs md:text-sm font-black uppercase tracking-widest text-zinc-400">Legendary Pack</span>
                    </div>
                    <span className="text-lg md:text-xl font-black italic text-white">x1</span>
                  </div>
                </div>
                
                <p className="text-[8px] md:text-[9px] text-zinc-500 uppercase font-bold tracking-widest leading-relaxed mb-6 md:mb-8 max-w-[240px]">
                  Here is your starter package. <span className="text-amber-500 font-extrabold">Sign in with Google to claim your 100,000 Coins & 2 HOF + 1 Legendary MVP Pack sign-in reward!</span>
                </p>
                
                <button
                  onClick={() => setShowWelcomeGift(false)}
                  className="w-full bg-white text-black py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-amber-400 active:scale-95 transition-all shadow-xl"
                >
                  Claim Starter Package
                </button>
              </div>
              
              {/* Close Button */}
              <button 
                onClick={() => setShowWelcomeGift(false)}
                className="absolute top-4 right-4 text-zinc-600 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}

        {showLoginBonusModal && (
          <motion.div
            key="login-bonus-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div
              key="login-bonus-content"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm bg-zinc-900 border border-amber-500/30 rounded-3xl p-6 md:p-8 relative overflow-y-auto max-h-[90vh] shadow-[0_0_50px_rgba(245,158,11,0.3)]"
            >
              {/* Background Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/20 blur-[60px] rounded-full animate-pulse" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.5)] mb-4 md:mb-6">
                  <Sparkles size={32} className="text-black md:w-10 md:h-10 animate-bounce" />
                </div>
                
                <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white mb-1 md:mb-2 leading-none">
                  SIGN-IN BONUS!
                </h2>
                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-amber-500 mb-4 md:mb-6">
                  Google Account Reward
                </p>
                
                <div className="space-y-2 md:space-y-3 w-full mb-6 md:mb-8">
                  <div className="bg-black/40 border border-white/5 rounded-xl md:rounded-2xl p-3 md:p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <Coins size={14} className="md:w-4 md:h-4" />
                      </div>
                      <span className="text-xs md:text-sm font-black uppercase tracking-widest text-zinc-400">Bonus Coins</span>
                    </div>
                    <span className="text-lg md:text-xl font-black italic text-amber-400">+100,000</span>
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded-xl md:rounded-2xl p-3 md:p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                        <Star size={14} className="md:w-4 md:h-4" />
                      </div>
                      <span className="text-xs md:text-sm font-black uppercase tracking-widest text-zinc-400">HOF Packs</span>
                    </div>
                    <span className="text-lg md:text-xl font-black italic text-white">x2</span>
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded-xl md:rounded-2xl p-3 md:p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <Award size={14} className="md:w-4 md:h-4" />
                      </div>
                      <span className="text-xs md:text-sm font-black uppercase tracking-widest text-zinc-400">Legendary Pack</span>
                    </div>
                    <span className="text-lg md:text-xl font-black italic text-white">x1</span>
                  </div>
                </div>
                
                <p className="text-[8px] md:text-[9px] text-zinc-500 uppercase font-bold tracking-widest leading-relaxed mb-6 md:mb-8 max-w-[240px]">
                  Thank you for securing your progress. These elite rewards have been added directly to your account.
                </p>
                
                <button
                  disabled={claimingLoginBonus}
                  onClick={async () => {
                    setClaimingLoginBonus(true);
                    try {
                      await claimLoginReward();
                      setShowLoginBonusModal(false);
                    } catch (err) {
                      console.error("Error claiming login bonus", err);
                    } finally {
                      setClaimingLoginBonus(false);
                    }
                  }}
                  className="w-full bg-amber-500 text-black py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-amber-400 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  {claimingLoginBonus ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    "Claim Sign-In Bonus"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Halloween Scream Event Showcase Modal */}
        {isHalloweenModalOpen && (
          <HalloweenEventModal
            key="halloween-event-modal"
            isOpen={isHalloweenModalOpen}
            onClose={() => setIsHalloweenModalOpen(false)}
            onNavigateToPacks={() => setCurrentView('packs')}
            onNavigateToSBC={() => {
              setSbcInitialCategory('scream');
              setCurrentView('sbc');
            }}
            onNavigateToDraft={() => setCurrentView('draft')}
          />
        )}

        {/* Global Rewarded Video Ad Modal */}
        {rewardedAdState.isOpen && (
          <RewardedVideoModal
            key="global-rewarded-video-modal"
            isOpen={rewardedAdState.isOpen}
            rewardText={rewardedAdState.rewardText}
            adDurationSeconds={rewardedAdState.durationSeconds}
            onComplete={async () => {
              if (rewardedAdState.onComplete) {
                await rewardedAdState.onComplete();
              }
              setRewardedAdState((prev) => ({ ...prev, isOpen: false }));
            }}
            onClose={() => {
              if (rewardedAdState.onClose) {
                rewardedAdState.onClose();
              }
              setRewardedAdState((prev) => ({ ...prev, isOpen: false }));
            }}
          />
        )}
      </AnimatePresence>
      <Analytics />
    </div>
  );
}

export default function App() {
  return (
    <GameProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </GameProvider>
  );
}
