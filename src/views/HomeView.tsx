import React from 'react';
import { motion } from 'motion/react';
import { Zap, Trophy, Sparkles, Star } from 'lucide-react';
import { useGame } from '../context/GameContext';

const HomeView: React.FC = () => {
  const { setCurrentView } = useGame();

  return (
    <div className="h-full w-full flex flex-col bg-black overflow-hidden">
      {/* Split Screen Container */}
      <div className="flex-1 flex flex-col md:flex-row gap-2 p-2 md:p-3 w-full h-full">
        
        {/* Bloque A: Pack Opener */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 relative group cursor-pointer overflow-hidden rounded-3xl border border-zinc-900 bg-zinc-950 flex flex-col items-center justify-center min-h-0"
          onClick={() => setCurrentView('open')}
        >
          {/* Background Image/Glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.15)_0%,_transparent_70%)]" />
          
          <div className="relative flex flex-col items-center justify-center p-4 text-center space-y-4">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-amber-500 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.3)] group-hover:scale-110 transition-transform duration-500">
              <Zap size={40} md:size={48} className="text-black" fill="currentColor" />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
                Pack<br/>Opener
              </h2>
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">
                Open Elite Packs
              </p>
            </div>

            <button className="px-6 py-2.5 bg-white text-black rounded-full font-black uppercase text-[10px] tracking-widest group-hover:bg-amber-400 transition-colors">
              Open Now
            </button>
          </div>

          {/* Decorative Elements */}
          <div className="absolute bottom-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles size={80} md:size={120} />
          </div>
        </motion.div>

        {/* Bloque B: HoopsDraft */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 relative group cursor-pointer overflow-hidden rounded-3xl border border-zinc-900 bg-zinc-950 flex flex-col items-center justify-center min-h-0"
          onClick={() => setCurrentView('draft')}
        >
          {/* Background Image/Glow - Different colors for Draft */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.15)_0%,_transparent_70%)]" />
          
          <div className="relative flex flex-col items-center justify-center p-4 text-center space-y-4">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-600 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.3)] group-hover:scale-110 transition-transform duration-500">
              <Trophy size={40} md:size={48} className="text-white" />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white leading-none">
                Hoops<br/>Draft
              </h2>
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">
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
              className="px-6 py-2.5 bg-blue-600 text-white rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-blue-500 transition-colors"
            >
              Play Now
            </motion.button>
          </div>

          {/* Decorative Elements */}
          <div className="absolute bottom-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Star size={80} md:size={120} />
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default HomeView;
