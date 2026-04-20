import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ShoppingBag, ArrowLeft } from 'lucide-react';
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
    <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-black relative overflow-hidden">
      {/* Back Button */}
      <button 
        onClick={() => setCurrentView('home')}
        className="absolute top-4 left-4 z-[5500] w-10 h-10 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full flex items-center justify-center text-white hover:bg-zinc-800 transition-all active:scale-95 shadow-lg"
      >
        <ArrowLeft size={20} />
      </button>

      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.1)_0%,_transparent_70%)] pointer-events-none" />
      
      <div className="flex flex-col items-center justify-center w-full z-10 p-4">
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
          className="relative w-[65vw] max-w-[280px] aspect-[2.5/3.5] bg-zinc-900 rounded-3xl border-4 border-zinc-800 shadow-[0_30px_60px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center overflow-hidden group cursor-pointer"
          onClick={handleOpenFreePack}
        >
          {/* Pack Design Elements */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-amber-500/10 to-transparent" />
          <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 rounded-2xl bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center mb-8 shadow-2xl group-hover:border-amber-500 transition-colors">
              <ShoppingBag size={40} className="text-amber-500" />
            </div>
            
            <h2 className="text-4xl font-black tracking-tighter text-white text-center leading-none uppercase italic">
              Elite<br/>Pack
            </h2>
            <div className="mt-6 px-4 py-1.5 bg-zinc-800 rounded-full border border-zinc-700 group-hover:bg-amber-500 group-hover:text-black transition-all">
              <p className="text-[10px] font-black uppercase tracking-widest">
                5 Premium Cards
              </p>
            </div>
          </div>
          
          {/* Bottom Foil Detail */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
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
          
          <p className="mt-8 text-zinc-600 text-[10px] font-bold uppercase tracking-[0.4em] animate-pulse">
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
            className="fixed inset-0 z-[7000] bg-black/95 backdrop-blur-2xl flex flex-col items-center pt-[140px]"
          >
            <div className="flex-1 flex flex-col items-center justify-center">
              <motion.div
                animate={{ 
                  scale: [1, 1.15, 1],
                  rotate: [0, 8, -8, 0],
                  boxShadow: [
                    "0 0 0px rgba(245,158,11,0)",
                    "0 0 70px rgba(245,158,11,0.6)",
                    "0 0 0px rgba(245,158,11,0)"
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-64 h-96 bg-zinc-900 rounded-3xl border-4 border-amber-500 shadow-2xl mb-12 flex items-center justify-center"
              >
                <Sparkles size={80} className="text-amber-500 animate-pulse" />
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
