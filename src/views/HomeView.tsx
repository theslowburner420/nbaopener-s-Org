import React from 'react';
import { motion } from 'motion/react';
import { Zap, Trophy, Sparkles, Star, RefreshCw } from 'lucide-react';
import { useGame } from '../context/GameContext';

const HomeView: React.FC = () => {
  const { setCurrentView } = useGame();

  return (
    <div className="h-full w-full flex flex-col bg-black overflow-hidden relative">
      {/* Split Screen Container */}
      <div className="flex-1 flex flex-col gap-2 p-2 md:p-3 w-full h-full overflow-y-auto no-scrollbar pb-24">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-auto md:h-[60%] shrink-0">
          {/* Bloque A: Pack Opener */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative group cursor-pointer overflow-hidden rounded-3xl border border-zinc-900 bg-zinc-950 flex flex-col items-center justify-center min-h-[200px]"
            onClick={() => setCurrentView('open')}
          >
            {/* Background Image/Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.15)_0%,_transparent_70%)]" />
            
            <div className="relative flex flex-col items-center justify-center p-4 text-center space-y-4">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-amber-500 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.3)] group-hover:scale-110 transition-transform duration-500">
                <Zap size={32} md:size={40} className="text-black" fill="currentColor" />
              </div>
              
              <div className="space-y-1">
                <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white leading-none">
                  Pack<br/>Opener
                </h2>
                <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-amber-500">
                  Open Elite Packs
                </p>
              </div>

              <button className="px-5 py-2 bg-white text-black rounded-full font-black uppercase text-[9px] tracking-widest group-hover:bg-amber-400 transition-colors">
                Open Now
              </button>
            </div>

            {/* Decorative Elements */}
            <div className="absolute bottom-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Sparkles size={60} md:size={100} />
            </div>
          </motion.div>

          {/* Bloque B: HoopsDraft */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative group cursor-pointer overflow-hidden rounded-3xl border border-zinc-900 bg-zinc-950 flex flex-col items-center justify-center min-h-[200px]"
            onClick={() => setCurrentView('draft')}
          >
            {/* Background Image/Glow - Different colors for Draft */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.15)_0%,_transparent_70%)]" />
            
            <div className="relative flex flex-col items-center justify-center p-4 text-center space-y-4">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.3)] group-hover:scale-110 transition-transform duration-500">
                <Trophy size={32} md:size={40} className="text-white" />
              </div>
              
              <div className="space-y-1">
                <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white leading-none">
                  Hoops<br/>Draft
                </h2>
                <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] text-blue-400">
                  Build Your Dynasty
                </p>
              </div>

              <motion.button 
                animate={{ 
                  scale: [1, 1.05, 1],
                  boxShadow: [
                    "0 0 0px rgba(59,130,246,0)",
                    "0 0 20px rgba(59,130,246,0.4)",
                    "0 0 0px rgba(59,130,246,0)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="px-5 py-2 bg-blue-600 text-white rounded-full font-black uppercase text-[9px] tracking-widest hover:bg-blue-500 transition-colors"
              >
                Play Now
              </motion.button>
            </div>

            {/* Decorative Elements */}
            <div className="absolute bottom-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <Star size={60} md:size={100} />
            </div>
          </motion.div>
        </div>

        {/* Bloque C: Online Trading (NEW) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group cursor-pointer overflow-hidden rounded-3xl border border-zinc-900 bg-zinc-950 flex items-center justify-between p-6 sm:p-8 min-h-[160px] shrink-0"
          onClick={() => setCurrentView('trading')}
        >
          {/* Background Image/Glow - Purple/Teal for Trading */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,_rgba(168,85,247,0.15)_0%,_transparent_70%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(45,212,191,0.1)_0%,_transparent_70%)]" />
          
          <div className="relative flex items-center gap-6 sm:gap-10">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-600 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.3)] group-hover:rotate-12 transition-transform duration-500">
              <RefreshCw size={32} sm:size={40} className="text-white" />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
                Online<br/>Trading
              </h2>
              <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-purple-400">
                Real-Time Exchange
              </p>
            </div>
          </div>

          <div className="relative hidden sm:flex flex-col items-center gap-3">
            <div className="flex -space-x-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-10 h-14 bg-zinc-800 rounded-lg border border-zinc-700 shadow-xl flex items-center justify-center rotate-[-10deg] first:rotate-[-20deg] last:rotate-[0deg] overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900 opacity-50" />
                </div>
              ))}
            </div>
            <button className="px-6 py-2.5 bg-purple-600 text-white rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-purple-500 hover:scale-105 transition-all shadow-lg active:scale-95">
              Enter Lobby
            </button>
          </div>

          {/* Mobile Button Only */}
          <button className="sm:hidden relative w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-lg active:scale-90">
             <Star size={16} fill="currentColor" />
          </button>
        </motion.div>

      </div>
    </div>
  );
};

export default HomeView;
