import React from 'react';
import { motion } from 'motion/react';
import { useGame } from '../context/GameContext';

const HomeView: React.FC = () => {
  const { setCurrentView } = useGame();

  return (
    <div className="w-full flex flex-col bg-black">
      {/* Home Container */}
      <div className="flex-1 flex flex-col gap-1.5 md:gap-4 p-1.5 md:p-6 pb-20 md:pb-10 max-w-7xl mx-auto w-full">
        {/* Top Section: Pack Opener & Hoops Draft side by side */}
        <div className="grid grid-cols-2 gap-1.5 md:gap-4">
          {/* Bloque A: Pack Opener */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative group cursor-pointer overflow-hidden rounded-2xl md:rounded-[2.5rem] border border-white/5 bg-zinc-900 aspect-square md:aspect-video flex flex-col items-center justify-center"
            onClick={() => setCurrentView('open')}
          >
            {/* Full Card Background Image */}
            <div className="absolute inset-0 z-0">
              <img 
                src="https://i.postimg.cc/vHMy0CHK/generated-image.png" 
                alt="Pack Opener" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
            
            {/* Neon FREE indicator */}
            <div className="absolute top-2 right-2 md:top-4 md:right-4 z-20">
               <motion.div 
                 animate={{ scale: [1, 1.1, 1] }}
                 transition={{ duration: 2, repeat: Infinity }}
                 className="px-2 py-0.5 md:px-4 md:py-1 bg-black border border-amber-500/50 rounded-full shadow-[0_0_10px_#f59e0b] -rotate-6"
               >
                  <span className="text-[7px] md:text-xs font-black text-amber-500 tracking-widest uppercase">FREE</span>
               </motion.div>
            </div>
          </motion.div>

          {/* Bloque B: Hoops Draft */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className="relative group cursor-pointer overflow-hidden rounded-2xl md:rounded-[2.5rem] border border-white/5 bg-zinc-900 aspect-square md:aspect-video flex flex-col items-center justify-center"
            onClick={() => setCurrentView('draft')}
          >
            {/* Full Card Background Image */}
            <div className="absolute inset-0 z-0">
              <img 
                src="https://i.postimg.cc/TwG0zjyz/generated-image-(1).png" 
                alt="Hoops Draft" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>

        {/* Bottom Section: Trading, Career/Franchise, Puzzles/SBC */}
        {/* On mobile, they are strips (aspect-[3/1] or stacked nicely); on desktop, they render side-by-side! */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 md:gap-4">
          {/* Bloque C: Live Trading */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative group cursor-pointer overflow-hidden rounded-2xl md:rounded-[2.5rem] border border-white/5 bg-zinc-950 aspect-[3/1] md:aspect-auto md:h-[180px] lg:h-[240px]"
            onClick={() => setCurrentView('trading')}
          >
            <div className="absolute inset-0 z-0">
              <img 
                src="https://i.postimg.cc/PJ7m51xb/generated-image-(2).png" 
                alt="Live Trading" 
                className="w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>
          </motion.div>
    
          {/* Bloque D: Franchise Mode */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="relative group cursor-pointer overflow-hidden rounded-2xl md:rounded-[2.5rem] border border-white/5 bg-zinc-950 aspect-[3/1] md:aspect-auto md:h-[180px] lg:h-[240px]"
            onClick={() => setCurrentView('career')}
          >
            <div className="absolute inset-0 z-0">
              <img 
                src="https://i.postimg.cc/CxGfW3j7/generated-image-(3).png" 
                alt="Franchise Mode" 
                className="w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10">
              <span className="px-2 py-0.5 md:px-3 md:py-1 bg-amber-500 text-black text-[7px] md:text-[10px] font-black rounded-full uppercase italic">BETA</span>
            </div>
          </motion.div>

          {/* Bloque E: SBC Mode */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative group cursor-pointer overflow-hidden rounded-2xl md:rounded-[2.5rem] border border-white/5 bg-zinc-950 aspect-[3/1] md:aspect-auto md:h-[180px] lg:h-[240px]"
            onClick={() => setCurrentView('sbc')}
          >
            <div className="absolute inset-0 z-0">
              <img 
                src="https://i.postimg.cc/2SkZNHTG/generated-image-(4).png" 
                alt="SBC" 
                className="w-full h-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            <div className="absolute top-2 right-2 md:top-4 md:right-4 z-10">
              <span className="px-2 py-0.5 md:px-3 md:py-1 bg-amber-500 text-black text-[7px] md:text-[10px] font-black rounded-full uppercase italic">BETA</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
