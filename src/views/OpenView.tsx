import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useEngine } from '../hooks/useEngine';
import PackOpener from '../components/PackOpener';
import StaticAd from '../components/StaticAd';
import { Card } from '../types';

export default function OpenView() {
  const { setCurrentView } = useGame();
  const [openedCards, setOpenedCards] = useState<Card[] | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<any[]>([]);
  const { openPack, isSaving } = useEngine();

  // Preload pack image
  useEffect(() => {
    const img = new Image();
    img.src = 'https://i.postimg.cc/bY3DRzLz/4a07a4ae-7c5c-4d11-8585-780a8aebebbe.png';
  }, []);

  const handleOpenFreePack = async () => {
    if (isSaving) return;
    
    try {
      const result = await openPack('random');
      if (result) {
        setOpenedCards(result.cards);
        setNewlyUnlocked(result.newlyUnlocked);
      }
    } catch (error) {
      console.error('Failed to open pack:', error);
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col items-center justify-between bg-black relative overflow-hidden">
      {/* Top Banner Ad Area */}
      <div className="w-full z-[5500] relative shrink-0">
        <StaticAd position="header" />
      </div>

      {/* Back Button */}
      <button 
        onClick={() => setCurrentView('home')}
        className="absolute top-[calc(5rem+env(safe-area-inset-top))] left-[calc(1.5rem+env(safe-area-inset-left))] z-[5500] w-12 h-12 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/80 rounded-full flex items-center justify-center text-white hover:bg-zinc-800 transition-all active:scale-95 shadow-[0_4px_20px_rgba(0,0,0,0.5)] cursor-pointer"
      >
        <ArrowLeft size={20} />
      </button>

      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.1)_0%,_transparent_70%)] pointer-events-none" />
      
      <div 
        className="flex-1 flex flex-col items-center justify-center w-full z-10 p-4"
      >
        {/* Giant Random Pack */}
        <motion.div
          animate={{ 
            y: [0, -15, 0],
            rotate: [0, 2, -2, 0]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="relative w-[65vw] max-w-[280px] aspect-[2.5/3.5] bg-zinc-950 rounded-3xl border-4 border-zinc-800 shadow-[0_0_35px_rgba(6,182,212,0.3)] hover:shadow-[0_0_50px_rgba(6,182,212,0.65)] group-hover:border-cyan-500/50 transition-all duration-500 flex flex-col items-center justify-center overflow-hidden group cursor-pointer"
          onClick={handleOpenFreePack}
        >
          {/* Background Image - Clean, raw image as requested */}
          <img 
            src="https://i.postimg.cc/bY3DRzLz/4a07a4ae-7c5c-4d11-8585-780a8aebebbe.png"
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none z-0"
            referrerPolicy="no-referrer"
            alt="Free Pack Design"
          />
          
          {/* Bottom Foil Detail */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50 z-20" />
        </motion.div>

        {/* Action Button */}
        <div className="mt-16 flex flex-col items-center">
          <button
            onClick={handleOpenFreePack}
            disabled={isSaving}
            className="group relative bg-white text-black font-black px-14 py-5 rounded-full shadow-[0_10px_40px_rgba(255,255,255,0.2)] active:scale-95 transition-all text-sm uppercase tracking-widest overflow-hidden hover:bg-amber-400 disabled:opacity-50"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Sparkles size={18} />
              {isSaving ? 'Syncing...' : 'Open Free Pack'}
            </span>
          </button>
          
          <p className="mt-8 text-zinc-650 text-[10px] font-bold uppercase tracking-[0.4em] animate-pulse">
            New packs every 24h
          </p>
        </div>
      </div>

      <AnimatePresence>
        {openedCards && (
          <PackOpener 
            cards={openedCards} 
            newlyUnlockedAchievements={newlyUnlocked}
            packImage="https://i.postimg.cc/bY3DRzLz/4a07a4ae-7c5c-4d11-8585-780a8aebebbe.png"
            onClose={() => {
              setOpenedCards(null);
              setNewlyUnlocked([]);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
