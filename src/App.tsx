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
import { LayoutGrid, ShoppingBag, Zap, Trophy, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import Header from './components/Header';

function AppContent() {
  const { currentView, setCurrentView, isPremium } = useGame();

  // Adsterra Script Logic - ONLY load if NOT premium
  useEffect(() => {
    if (isPremium) {
      // Remove any existing Adsterra scripts if they exist
      const scripts = document.querySelectorAll('script[src*="adsterra"]');
      scripts.forEach(s => s.remove());
      return;
    }
    
    // Example of how to load Adsterra script dynamically
    // const script = document.createElement('script');
    // script.src = 'https://pl123456.highperformanceformat.com/abcdef/invoke.js';
    // script.async = true;
    // document.head.appendChild(script);
    
    // return () => {
    //   script.remove();
    // };
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
      default: return <OpenView />;
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-black text-white flex flex-col overflow-hidden font-sans selection:bg-amber-500 selection:text-black">
      <Header />
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="h-full w-full"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* NBA Premium Navigation Bar */}
      <nav className="h-16 bg-zinc-950 border-t border-zinc-900 flex items-center justify-around px-4 pb-2 shrink-0 z-50">
        {/* Collection */}
        <button 
          onClick={() => handleViewChange('collection')}
          className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${currentView === 'collection' ? 'text-white' : 'text-zinc-600'}`}
        >
          <div className={`p-1.5 rounded-lg transition-all ${currentView === 'collection' ? 'bg-zinc-900' : ''}`}>
            <LayoutGrid size={18} strokeWidth={currentView === 'collection' ? 2.5 : 2} />
          </div>
          <span className="text-[7px] font-black uppercase tracking-[0.1em]">Roster</span>
        </button>

        {/* Rewards */}
        <button 
          onClick={() => handleViewChange('rewards')}
          className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${currentView === 'rewards' ? 'text-white' : 'text-zinc-600'}`}
        >
          <div className={`p-1.5 rounded-lg transition-all ${currentView === 'rewards' ? 'bg-zinc-900' : ''}`}>
            <Trophy size={18} strokeWidth={currentView === 'rewards' ? 2.5 : 2} />
          </div>
          <span className="text-[7px] font-black uppercase tracking-[0.1em]">Rewards</span>
        </button>

        {/* OPEN (Center) */}
        <button 
          onClick={() => handleViewChange('open')}
          className={`relative flex flex-col items-center justify-center transition-all duration-500 ${currentView === 'open' ? 'scale-105' : ''}`}
        >
          <div className={`p-2.5 rounded-xl transition-all ${currentView === 'open' ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)]' : 'bg-zinc-900 text-zinc-500'}`}>
            <Zap size={22} strokeWidth={3} fill={currentView === 'open' ? "currentColor" : "none"} />
          </div>
          <span className={`text-[8px] font-black uppercase tracking-[0.2em] mt-1 transition-colors ${currentView === 'open' ? 'text-amber-500' : 'text-zinc-600'}`}>Open</span>
        </button>

        {/* Packs */}
        <button 
          onClick={() => handleViewChange('packs')}
          className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${currentView === 'packs' ? 'text-white' : 'text-zinc-600'}`}
        >
          <div className={`p-1.5 rounded-lg transition-all ${currentView === 'packs' ? 'bg-zinc-900' : ''}`}>
            <ShoppingBag size={18} strokeWidth={currentView === 'packs' ? 2.5 : 2} />
          </div>
          <span className="text-[7px] font-black uppercase tracking-[0.1em]">Packs</span>
        </button>

        {/* Shop */}
        <button 
          onClick={() => handleViewChange('shop')}
          className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${currentView === 'shop' ? 'text-white' : 'text-zinc-600'}`}
        >
          <div className={`p-1.5 rounded-lg transition-all ${currentView === 'shop' ? 'bg-zinc-900' : ''}`}>
            <Coins size={18} strokeWidth={currentView === 'shop' ? 2.5 : 2} />
          </div>
          <span className="text-[7px] font-black uppercase tracking-[0.1em]">Shop</span>
        </button>
      </nav>
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
