/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, lazy, Suspense } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { NotificationProvider } from './context/NotificationContext';
import { ALL_CARDS } from './data/cards';
import { LayoutGrid, ShoppingBag, Zap, Trophy, Coins, User as UserIcon, Gift, X, Star, Home, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MemoryManager } from './lib/memory';
import { Analytics } from "@vercel/analytics/react";

import Header from './components/Header';
import StaticAd from './components/StaticAd';

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

// Simple View Loader
const ViewLoader = () => (
  <div className="h-full w-full flex items-center justify-center bg-black">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Loading Module...</span>
    </div>
  </div>
);

function AppContent() {
  const { currentView, setCurrentView, isPremium, isAuthLoading, isInitialSyncDone, isOffline, syncError, showWelcomeGift, setShowWelcomeGift } = useGame();

  // Adsterra Script Logic - ONLY load if NOT premium
  useEffect(() => {
    if (isPremium) {
      // Remove any existing Adsterra scripts if they exist
      const scripts = document.querySelectorAll('script[src*="adsterra"]');
      scripts.forEach(s => s.remove());
      return;
    }
  }, [isPremium]);

  // Tactical Image Preloading
  useEffect(() => {
    const prefetchAssets = () => {
      // 1. Essential UI Images
      const uiAssets = [
        '/assets/card-back.png', // Assuming these exist or use picsum
        '/assets/pack-texture.png'
      ];
      
      // 2. Critical Team Logos (Top 10 most popular teams)
      const criticalLogos = [
        'https://cdn.nba.com/logos/nba/1610612747/primary/L/logo.svg', // Lakers
        'https://cdn.nba.com/logos/nba/1610612744/primary/L/logo.svg', // Warriors
        'https://cdn.nba.com/logos/nba/1610612738/primary/L/logo.svg', // Celtics
        'https://cdn.nba.com/logos/nba/1610612741/primary/L/logo.svg', // Bulls
      ];

      // 3. Top Tier Players (Legends & Superstars)
      const criticalPlayers = ALL_CARDS.slice(0, 30).map(c => c.imageUrl);

      const allCritical = [...uiAssets, ...criticalLogos, ...criticalPlayers];

      allCritical.forEach(url => {
        const img = new Image();
        img.src = url;
      });

      // 4. Background prefetch of the rest in chunks
      const remainingCards = ALL_CARDS.slice(30, 200);
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
        }, 1000 + (i * 200)); // Start after 1s
      }
    };
    
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(prefetchAssets);
    } else {
      setTimeout(prefetchAssets, 1500);
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
            default: return <HomeView />;
          }
        })()}
      </Suspense>
    );
  };

  if (isAuthLoading || (!isInitialSyncDone && !syncError)) {
    return (
      <div className="h-[100dvh] w-full bg-black flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.2)] border border-zinc-200 animate-bounce">
            <span className="text-black font-black text-xl italic tracking-tighter">HC</span>
          </div>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-zinc-900 rounded-full blur-sm animate-pulse" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-white animate-pulse">
            Checking Session...
          </p>
          <div className="w-32 h-1 bg-zinc-900 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-amber-500"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
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
    <div className="h-[100dvh] w-full bg-black text-white flex flex-col overflow-hidden font-sans selection:bg-amber-500 selection:text-black">
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

      {/* Header Area - Fixed at top to prevent layout shifts */}
      {!(currentView === 'draft' || currentView === 'open') && (
        <div className="fixed top-0 left-0 right-0 z-[5000] flex flex-col bg-black">
          {/* Top Ad Area */}
          <StaticAd position="header" />
          
          {/* Global Header */}
          <Header />
        </div>
      )}
      
      {/* Main Content Area - This grows to fill space and its children handle scrolling */}
      <main className={`flex-1 relative bg-black overflow-hidden ${(currentView === 'draft' || currentView === 'open') ? 'pt-0 pb-0' : (isPremium ? 'pt-14 pb-16' : 'pt-[116px] pb-16')}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="h-full w-full overflow-hidden"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Navigation Bar */}
      {!(currentView === 'draft' || currentView === 'open') && (
        <div className="fixed bottom-0 left-0 right-0 z-[4000] flex flex-col bg-black">
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
              className="w-full max-w-sm bg-zinc-900 border border-amber-500/30 rounded-3xl p-8 relative overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.2)]"
            >
              {/* Background Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/20 blur-[60px] rounded-full" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-amber-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)] mb-6">
                  <Gift size={40} className="text-black" />
                </div>
                
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-2 leading-none">
                  Welcome!
                </h2>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-6">
                  Exclusive Starter Pack
                </p>
                
                <div className="space-y-3 w-full mb-8">
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <Coins size={16} />
                      </div>
                      <span className="text-sm font-black uppercase tracking-widest text-zinc-400">Coins</span>
                    </div>
                    <span className="text-xl font-black italic text-white">+50,000</span>
                  </div>
                  
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                        <Star size={16} />
                      </div>
                      <span className="text-sm font-black uppercase tracking-widest text-zinc-400">MVP Packs</span>
                    </div>
                    <span className="text-xl font-black italic text-white">x3</span>
                  </div>
                </div>
                
                <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest leading-relaxed mb-8 max-w-[240px]">
                  Here is your gift: 50,000 coins and 3 MVP Packs to start your collection.
                </p>
                
                <button
                  onClick={() => setShowWelcomeGift(false)}
                  className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-400 active:scale-95 transition-all shadow-xl"
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
