import React from 'react';
import { motion } from 'motion/react';
import { Zap, Trophy, Sparkles, Star, RefreshCw, Building, User as UserIcon } from 'lucide-react';
import { useGame } from '../context/GameContext';

const HomeView: React.FC = () => {
  const { setCurrentView } = useGame();

  return (
    <div className="h-full w-full flex flex-col bg-black overflow-hidden relative">
      {/* Container with no-scroll intent */}
      <div className="flex-1 flex flex-col gap-1 md:gap-3 p-1 md:p-3 w-full h-full overflow-hidden pb-14 md:pb-6">
        
        <div className="grid grid-cols-2 gap-1 md:gap-2 h-auto md:h-[50%] shrink-1">
          {/* Bloque A: Pack Opener */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative group cursor-pointer overflow-hidden rounded-xl md:rounded-3xl border border-zinc-900 bg-zinc-950 flex flex-col items-center justify-center aspect-[1/1] sm:aspect-auto"
            onClick={() => setCurrentView('open')}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.1)_0%,_transparent_70%)]" />
            
            <div className="relative flex flex-col items-center justify-center p-2 md:p-4 text-center space-y-2.5 md:space-y-4">
              <div className="w-12 h-12 sm:w-16 md:w-20 bg-amber-500 rounded-lg md:rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)] group-hover:scale-110 transition-transform duration-500">
                <Zap size={28} sm:size={32} className="text-black" fill="currentColor" />
              </div>
              
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg md:text-3xl font-black italic uppercase tracking-tighter text-white leading-[0.9] md:leading-none">
                  Pack<br/>Opener
                </h2>
                <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-amber-500">
                  Elite
                </p>
              </div>
            </div>
          </motion.div>

          {/* Bloque B: Hoops Draft */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative group cursor-pointer overflow-hidden rounded-xl md:rounded-3xl border border-zinc-900 bg-zinc-950 flex flex-col items-center justify-center aspect-[1/1] sm:aspect-auto"
            onClick={() => setCurrentView('draft')}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.1)_0%,_transparent_70%)]" />
            
            <div className="relative flex flex-col items-center justify-center p-2 md:p-4 text-center space-y-2.5 md:space-y-4">
              <div className="w-12 h-12 sm:w-16 md:w-20 bg-blue-600 rounded-lg md:rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.2)] group-hover:scale-110 transition-transform duration-500">
                <Trophy size={28} sm:size={32} className="text-white" />
              </div>
              
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg md:text-3xl font-black italic uppercase tracking-tighter text-white leading-[0.9] md:leading-none">
                  Hoops<br/>Draft
                </h2>
                <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">
                  Play
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bloque C: Online Trading */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group cursor-pointer overflow-hidden rounded-xl md:rounded-3xl border border-zinc-900 bg-zinc-950 flex flex-1 items-center justify-between p-2 md:p-6"
          onClick={() => setCurrentView('trading')}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,_rgba(168,85,247,0.08)_0%,_transparent_70%)]" />
          
          <div className="relative flex items-center gap-4 md:gap-6">
            <div className="w-12 h-12 sm:w-16 md:w-20 bg-purple-600 rounded-lg md:rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.2)] group-hover:rotate-12 transition-transform duration-500">
              <RefreshCw size={28} sm:size={32} className="text-white" />
            </div>
            
            <div className="space-y-0.5">
              <h2 className="text-sm sm:text-2xl md:text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
                Online Trading
              </h2>
              <p className="text-[9px] md:text-xs font-black uppercase tracking-[0.15em] text-purple-400">
                Real-Time Exchange
              </p>
            </div>
          </div>

          <button className="relative px-3.5 py-2 md:px-6 md:py-2.5 bg-purple-600 text-white rounded-full font-black uppercase text-[10px] md:text-[10px] tracking-widest active:scale-95">
            Lobby
          </button>
        </motion.div>
  
        {/* Bloque D: Franchise Mode */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative group cursor-pointer overflow-hidden rounded-xl md:rounded-3xl border border-zinc-900 bg-zinc-950 flex flex-1 items-center justify-between p-2 md:p-6"
          onClick={() => setCurrentView('career')}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,_rgba(16,185,129,0.08)_0%,_transparent_70%)]" />
          
          <div className="relative flex items-center gap-4 md:gap-6">
            <div className="w-12 h-12 sm:w-16 md:w-20 bg-emerald-600 rounded-lg md:rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)] group-hover:scale-110 transition-transform duration-500">
              <Building size={28} sm:size={32} className="text-white" />
            </div>
            
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 md:gap-3">
                <h2 className="text-sm sm:text-2xl md:text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
                  Franchise Mode
                </h2>
                <span className="px-2 py-1 bg-amber-500 text-black text-[8px] md:text-[10px] font-black rounded italic leading-none whitespace-nowrap">BETA</span>
              </div>
              <p className="text-[9px] md:text-xs font-black uppercase tracking-[0.15em] text-emerald-400">
                Performance Lab
              </p>
            </div>
          </div>

          <button className="relative px-3.5 py-2 md:px-6 md:py-2.5 bg-emerald-600 text-white rounded-full font-black uppercase text-[10px] md:text-[10px] tracking-widest active:scale-95">
            Office
          </button>
        </motion.div>

      </div>
    </div>
  );
};

export default HomeView;
