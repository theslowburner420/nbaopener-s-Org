/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { NotificationProvider } from './context/NotificationContext';
import { ALL_CARDS } from './data/cards';
import PacksView from './views/PacksView';
import ShopView from './views/ShopView';
import CollectionView from './views/CollectionView';
import OpenView from './views/OpenView';
import RewardsView from './views/RewardsView';
import ProfileView from './views/ProfileView';
import { LayoutGrid, ShoppingBag, Zap, Trophy, Coins, User as UserIcon, Gift, X, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MemoryManager } from './lib/memory';

import Header from './components/Header';
import StaticAd from './components/StaticAd';

function AppContent() {
  const { currentView, setCurrentView, isPremium, isAuthLoading, isInitialSyncDone, isOffline, showWelcomeGift, setShowWelcomeGift } = useGame();

  // Adsterra Script Logic - ONLY load if NOT premium
  useEffect(() => {
    if (isPremium) {
      // Remove any existing Adsterra scripts if they exist
      const scripts = document.querySelectorAll('script[src*="adsterra"]');
      scripts.forEach(s => s.remove());
      return;
    }
  }, [isPremium]);

  // Pre-fetch common images and assets
  useEffect(() => {
    const prefetch = () => {
      // Prefetch first 100 cards (increased coverage)
      const cardsToPrefetch = ALL_CARDS.slice(0, 100);
      
      // Use a small delay between batches to avoid blocking the main thread
      const batchSize = 10;
      for (let i = 0; i < cardsToPrefetch.length; i += batchSize) {
        setTimeout(() => {
          cardsToPrefetch.slice(i, i + batchSize).forEach(card => {
            const img = new Image();
            img.src = card.imageUrl;
            if (card.teamLogoUrl) {
              const logo = new Image();
              logo.src = card.teamLogoUrl;
            }
            if ((card.category === 'Duo' || card.category === 'NBA Record' || card.category === 'All-Star MVP') && card.player2Id) {
              const img2 = new Image();
              img2.src = `https://cdn.nba.com/headshots/nba/latest/1040x760/${card.player2Id}.png`;
            }
          });
        }, i * 150);
      }
    };
    
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(prefetch);
    } else {
      setTimeout(prefetch, 2000);
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
    switch (currentView) {
      case 'collection': return <CollectionView />;
      case 'open': return <OpenView />;
      case 'packs': return <PacksView />;
      case 'rewards': return <RewardsView />;
      case 'shop': return <ShopView />;
      case 'profile': return <ProfileView />;
      default: return <OpenView />;
    }
  };

  if (isAuthLoading) {
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
      <div className="fixed top-0 left-0 right-0 z-[5000] flex flex-col bg-black">
        {/* Top Ad Area */}
        <StaticAd position="header" />
        
        {/* Global Header */}
        <Header />
      </div>
      
      {/* Main Content Area - This grows to fill space and its children handle scrolling */}
      <main className={`flex-1 overflow-hidden relative bg-black ${isPremium ? 'pt-12 pb-16' : 'pt-[108px] pb-[124px]'}`}>
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
      <div className="fixed bottom-0 left-0 right-0 z-[4000] flex flex-col bg-black">
        {/* Bottom Ad Area */}
        <StaticAd position="footer" />
        
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

          {/* OPEN (Center) */}
          <button 
            onClick={() => handleViewChange('open')}
            className={`flex-1 relative flex flex-col items-center justify-center transition-all duration-500 ${currentView === 'open' ? 'scale-110 -translate-y-1' : ''}`}
          >
            <div className={`p-2.5 rounded-xl transition-all ${currentView === 'open' ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'bg-zinc-900 text-zinc-500'}`}>
              <Zap size={24} strokeWidth={3} fill={currentView === 'open' ? "currentColor" : "none"} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.1em] mt-1 transition-colors ${currentView === 'open' ? 'text-amber-500' : 'text-zinc-600'}`}>Open</span>
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
