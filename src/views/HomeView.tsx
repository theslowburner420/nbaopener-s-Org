import React from 'react';
import { motion } from 'motion/react';
import { Zap, Trophy, Sparkles, Star, RefreshCw, Building, User as UserIcon, Puzzle } from 'lucide-react';
import { useGame } from '../context/GameContext';

const HomeView: React.FC = () => {
  const { setCurrentView } = useGame();

  return (
    <div className="min-h-full w-full flex flex-col bg-black relative">
      {/* Container that allows content to expand */}
      <div className="flex-1 flex flex-col gap-1 md:gap-3 p-1 md:p-3 w-full pb-20 md:pb-6">
        
        <div className="grid grid-cols-2 gap-2 h-auto md:h-[45%] shrink-1">
          {/* Bloque A: Pack Opener */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative group cursor-pointer overflow-hidden rounded-2xl md:rounded-[2.5rem] border border-white/5 bg-zinc-900 flex flex-col items-center justify-center p-4 min-h-[160px] md:min-h-0"
            onClick={() => setCurrentView('open')}
          >
            {/* Full Card Background Image */}
            <div className="absolute inset-0 z-0">
              <img 
                src="https://i.postimg.cc/vHMy0CHK/generated-image.png" 
                alt="Pack Opener Background" 
                className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>
            
            {/* Neon FREE indicator */}
            <div className="absolute top-3 right-3 z-20">
               <motion.div 
                 animate={{ scale: [1, 1.1, 1] }}
                 transition={{ duration: 2, repeat: Infinity }}
                 className="px-2 py-0.5 bg-black border border-amber-500/50 rounded-full shadow-[0_0_10px_#f59e0b] -rotate-6"
               >
                  <span className="text-[8px] font-black text-amber-500 tracking-[0.1em]">FREE</span>
               </motion.div>
            </div>
          </motion.div>

          {/* Bloque B: Hoops Draft */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className="relative group cursor-pointer overflow-hidden rounded-2xl md:rounded-[2.5rem] border border-white/5 bg-zinc-900 flex flex-col items-center justify-center p-4 min-h-[160px] md:min-h-0"
            onClick={() => setCurrentView('draft')}
          >
            {/* Full Card Background Image */}
            <div className="absolute inset-0 z-0">
              <img 
                src="https://i.postimg.cc/TwG0zjyz/generated-image-(1).png" 
                alt="Hoops Draft Background" 
                className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            </div>
          </motion.div>
        </div>

        {/* Bloque C: Online Trading */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative group cursor-pointer overflow-hidden rounded-2xl md:rounded-[2.5rem] border border-white/5 bg-zinc-950 flex flex-1 items-center justify-between p-5 md:p-8 min-h-[100px]"
          onClick={() => setCurrentView('trading')}
        >
          {/* Full Card Background Image */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://i.postimg.cc/PJ7m51xb/generated-image-(2).png" 
              alt="Trading Hub Background" 
              className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          </div>
        </motion.div>
  
        {/* Bloque D: Franchise Mode */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative group cursor-pointer overflow-hidden rounded-2xl md:rounded-[2.5rem] border border-white/5 bg-zinc-950 flex flex-1 items-center justify-between p-5 md:p-8 min-h-[100px]"
          onClick={() => setCurrentView('career')}
        >
          {/* Full Card Background Image */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://i.postimg.cc/CxGfW3j7/generated-image-(3).png" 
              alt="Franchise Mode Background" 
              className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          </div>

          <div className="relative z-10">
            <span className="px-2 py-0.5 md:px-3 md:py-1 bg-amber-500 text-black text-[7px] md:text-[10px] font-black rounded-full uppercase italic">BETA</span>
          </div>
        </motion.div>

        {/* Bloque E: SBC Mode */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative group cursor-pointer overflow-hidden rounded-2xl md:rounded-[2.5rem] border border-white/5 bg-zinc-950 flex flex-1 items-center justify-between p-5 md:p-8 min-h-[100px]"
          onClick={() => setCurrentView('sbc')}
        >
          {/* Full Card Background Image */}
          <div className="absolute inset-0 z-0">
            <img 
              src="https://i.postimg.cc/2SkZNHTG/generated-image-(4).png" 
              alt="SBC Background" 
              className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default HomeView;
