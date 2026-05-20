import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useEngine } from '../hooks/useEngine';
import PackOpener from '../components/PackOpener';
import { Card } from '../types';

export default function OpenView() {
  const { setCurrentView } = useGame();
  const [isOpening, setIsOpening] = useState(false);
  const [openedCards, setOpenedCards] = useState<Card[] | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<any[]>([]);
  const { openPack, isSaving } = useEngine();

  // Preload pack image
  useEffect(() => {
    const img = new Image();
    img.src = 'https://i.postimg.cc/vHMy0CHK/generated-image.png';
  }, []);

  const handleOpenFreePack = async () => {
    if (isSaving) return;
    
    try {
      const result = await openPack('random');
      if (result) {
        setIsOpening(true);
        setTimeout(() => {
          setIsOpening(false);
          setOpenedCards(result.cards);
          setNewlyUnlocked(result.newlyUnlocked);
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to open pack:', error);
      // Error is handled by GameContext and displayed via ErrorBoundary or Toast if implemented
    }
  };

  return (
    <div className="min-h-full w-full flex flex-col items-center justify-center bg-black relative">
      {/* Back Button */}
      <button 
        onClick={() => setCurrentView('home')}
        className="absolute top-[calc(1.5rem+env(safe-area-inset-top))] left-[calc(1.5rem+env(safe-area-inset-left))] z-[5500] w-12 h-12 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/80 rounded-full flex items-center justify-center text-white hover:bg-zinc-800 transition-all active:scale-90 shadow-[0_4px_20px_rgba(0,0,0,0.5)] cursor-pointer"
      >
        <ArrowLeft size={20} />
      </button>

      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(6,182,212,0.1)_0%,_transparent_70%)] pointer-events-none" />
      
      <div 
        style={{ height: '800px' }}
        className="flex flex-col items-center justify-center w-full z-10 p-4"
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
          {/* Background Image & Overlay */}
          <img 
            src="https://i.postimg.cc/vHMy0CHK/generated-image.png"
            className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none z-0"
            referrerPolicy="no-referrer"
            alt="Free Pack Design"
          />
          <div className="bg-gradient-to-t from-black/95 via-black/40 to-transparent absolute inset-0 z-10" />

          {/* Neon Free Tag */}
          <div className="absolute top-4 right-4 z-20 -rotate-12 group-hover:scale-110 transition-transform duration-500">
            <div className="bg-black/90 px-3 py-1 rounded-sm border-2 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.8),inset_0_0_8px_rgba(34,197,94,0.8)] animate-pulse">
              <span className="text-sm font-black italic uppercase tracking-widest text-green-400 drop-shadow-[0_0_5px_rgba(34,197,94,1)]">
                FREE
              </span>
            </div>
          </div>

          {/* Pack Text & Descr */}
          <div className="relative z-15 flex flex-col items-center justify-end h-full w-full pb-8 px-4 text-center">
            <h2 className="text-4xl font-black tracking-tighter text-white leading-none uppercase italic drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]">
              FREE PACK
            </h2>
            <p className="text-[10px] font-black uppercase text-cyan-400 tracking-[0.22em] mt-1.5 drop-shadow-[0_0_4px_rgba(6,182,212,0.8)]">
              RISING STAR
            </p>
            
            <div className="mt-5 px-4 py-1.5 bg-zinc-950/85 rounded-full border border-zinc-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-350">
                5 Premium Cards
              </p>
            </div>
          </div>
          
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

      {/* Opening Overlay */}
      <AnimatePresence>
        {isOpening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[7000] bg-black/95 backdrop-blur-2xl flex flex-col items-center pt-[160px] md:pt-[190px]"
          >
            <div className="flex-1 flex flex-col items-center justify-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.15, 1],
                  rotate: [0, 8, -8, 0],
                  boxShadow: [
                    "0 0 0px rgba(6,182,212,0)",
                    "0 0 70px rgba(6,182,212,0.6)",
                    "0 0 0px rgba(6,182,212,0)"
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-64 h-96 bg-zinc-950 rounded-3xl border-4 border-cyan-500 shadow-2xl mb-12 flex items-center justify-center overflow-hidden relative"
              >
                {/* Image on background of opening pack too! */}
                <img 
                  src="https://i.postimg.cc/vHMy0CHK/generated-image.png"
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"
                  alt="Opening Pack"
                />
                <div className="absolute inset-0 bg-black/40" />
                <Sparkles size={80} className="text-cyan-400 animate-pulse relative z-10" />
              </motion.div>
              <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase animate-pulse">Revealing...</h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openedCards && (
          <PackOpener 
            cards={openedCards} 
            newlyUnlockedAchievements={newlyUnlocked}
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
