/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, lazy, Suspense } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { NotificationProvider } from './context/NotificationContext';
import { ALL_CARDS } from './data/cards';
import { LogIn, LogOut, User as UserIcon, Coins, AlertCircle, ChevronDown, Settings, Cloud, Check, RefreshCw, X, Gift, Star, Home, ShoppingBag, LayoutGrid, Trophy, Zap, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MemoryManager } from './lib/memory';
import { Analytics } from "@vercel/analytics/react";

import Header from './components/Header';
import StaticAd from './components/StaticAd';
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
  const { currentView, setCurrentView, isPremium, isAuthLoading, isInitialSyncDone, isOffline, syncError, showWelcomeGift, setShowWelcomeGift, login, user, claimLoginReward } = useGame();
  const [showLoginIncentive, setShowLoginIncentive] = useState(false);
  const [hasShownLoginIncentive, setHasShownLoginIncentive] = useState(false);

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
            case 'sbc': return <SbcView />;
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

  return (
    <div className="h-[100dvh] w-full bg-black text-white flex flex-col font-sans selection:bg-amber-500 selection:text-black relative overflow-hidden">
      {/* Premium Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] z-[10000] mix-blend-overlay bg-repeat" 
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
      
      {/* Offline Warning */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
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
      <main className="flex-1 relative bg-black overflow-y-auto overflow-x-hidden custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="w-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Navigation Bar */}
      {!(currentView === 'draft' || currentView === 'open' || currentView === 'career') && (
        <div className="z-[4000] flex flex-col bg-black shrink-0">
          {/* Global Navigation Bar */}
          <nav className="h-16 bg-zinc-950 border-t border-zinc-900 flex items-center justify-around px-2 pb-safe shrink-0">
            {/* Collection */}
            <button 
              onClick={() => handleViewChange('collection')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-300 ${currentView === 'collection' ? 'text-white' : 'text-zinc-600'}`}
            >
              <div className={`p-1.5 rounded-lg transition-all ${currentView === 'collection' ? 'bg-zinc-900' : ''}`}>
                <LayoutGrid size={20} strokeWidth={currentView === 'collection' ? 2.5 : 2} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-wider">Roster</span>
            </button>

            {/* Rewards */}
            <button 
              onClick={() => handleViewChange('rewards')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-300 ${currentView === 'rewards' ? 'text-white' : 'text-zinc-600'}`}
            >
              <div className={`p-1.5 rounded-lg transition-all ${currentView === 'rewards' ? 'bg-zinc-900' : ''}`}>
                <Trophy size={20} strokeWidth={currentView === 'rewards' ? 2.5 : 2} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-wider">Rewards</span>
            </button>
  
            {/* HOME (Center) */}
            <button 
              onClick={() => handleViewChange('home')}
              onMouseEnter={() => {
                // Predictive preloading for home view elements
                const homeAssets = ALL_CARDS.slice(0, 5).map(c => c.imageUrl);
                homeAssets.forEach(url => { const img = new Image(); img.src = url; });
              }}
              className={`flex-1 relative flex flex-col items-center justify-center transition-all duration-500 ${currentView === 'home' || currentView === 'open' || currentView === 'draft' ? 'scale-110 -translate-y-1' : ''}`}
            >
              <div className={`p-2.5 rounded-xl transition-all ${currentView === 'home' || currentView === 'open' || currentView === 'draft' ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'bg-zinc-900 text-zinc-500'}`}>
                <Home size={24} strokeWidth={3} fill={currentView === 'home' || currentView === 'open' || currentView === 'draft' ? "currentColor" : "none"} />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-[0.1em] mt-1 transition-colors ${currentView === 'home' || currentView === 'open' || currentView === 'draft' ? 'text-amber-500' : 'text-zinc-600'}`}>Home</span>
            </button>
  
            {/* Packs */}
            <button 
              onClick={() => handleViewChange('packs')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-300 ${currentView === 'packs' ? 'text-white' : 'text-zinc-600'}`}
            >
              <div className={`p-1.5 rounded-lg transition-all ${currentView === 'packs' ? 'bg-zinc-900' : ''}`}>
                <ShoppingBag size={20} strokeWidth={currentView === 'packs' ? 2.5 : 2} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-wider">Packs</span>
            </button>

            {/* Shop */}
            <button 
              onClick={() => handleViewChange('shop')}
              className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-300 ${currentView === 'shop' ? 'text-white' : 'text-zinc-600'}`}
            >
              <div className={`p-1.5 rounded-lg transition-all ${currentView === 'shop' ? 'bg-zinc-900' : ''}`}>
                <Coins size={20} strokeWidth={currentView === 'shop' ? 2.5 : 2} />
              </div>
              <span className="text-[8px] font-black uppercase tracking-wider">Shop</span>
            </button>
          </nav>
        </div>
      )}

      {/* Welcome Gift Modal */}
      <AnimatePresence>
        {showLoginIncentive && !user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div
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
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">+50,000 Coins & Mega Pack</p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    login();
                    setShowLoginIncentive(false);
                  }}
                  className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-400 active:scale-95 transition-all shadow-xl mb-3"
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
            <motion.div
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
                  Exclusive Starter Pack
                </p>
                
                <div className="space-y-2 md:space-y-3 w-full mb-6 md:mb-8">
                  <div className="bg-black/40 border border-white/5 rounded-xl md:rounded-2xl p-3 md:p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <Coins size={14} className="md:w-4 md:h-4" />
                      </div>
                      <span className="text-xs md:text-sm font-black uppercase tracking-widest text-zinc-400">Coins</span>
                    </div>
                    <span className="text-lg md:text-xl font-black italic text-white">+100,000</span>
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded-xl md:rounded-2xl p-3 md:p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <ShoppingBag size={14} className="md:w-4 md:h-4" />
                      </div>
                      <span className="text-xs md:text-sm font-black uppercase tracking-widest text-zinc-400">Welcome Mega</span>
                    </div>
                    <span className="text-lg md:text-xl font-black italic text-white">x5</span>
                  </div>
                  
                  <div className="bg-black/40 border border-white/5 rounded-xl md:rounded-2xl p-3 md:p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                        <Star size={14} className="md:w-4 md:h-4" />
                      </div>
                      <span className="text-xs md:text-sm font-black uppercase tracking-widest text-zinc-400">MVP Packs</span>
                    </div>
                    <span className="text-lg md:text-xl font-black italic text-white">x3</span>
                  </div>
                </div>
                
                <p className="text-[8px] md:text-[9px] text-zinc-500 uppercase font-bold tracking-widest leading-relaxed mb-6 md:mb-8 max-w-[240px]">
                  Here is your gift: 100,000 coins, 5 Welcome Mega Packs and 3 MVP Packs to start your collection. <span className="text-amber-500">Sign in now for an extra +50,000 coins and another Mega Pack!</span>
                </p>
                
                <button
                  onClick={() => setShowWelcomeGift(false)}
                  className="w-full bg-white text-black py-3 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-amber-400 active:scale-95 transition-all shadow-xl"
                >
                  Claim Rewards
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
