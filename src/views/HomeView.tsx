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
        
        <div className="grid grid-cols-2 gap-2 h-auto md:h-[50%] shrink-1">
          {/* Bloque A: Pack Opener */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative group cursor-pointer overflow-hidden rounded-2xl md:rounded-[2.5rem] border border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center aspect-square md:aspect-auto p-4"
            onClick={() => setCurrentView('open')}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.15)_0%,_transparent_72%)]" />
            
            {/* Neon FREE indicator */}
            <div className="absolute top-4 right-4 z-20">
               <div className="px-3 py-1 bg-black border-2 border-amber-500 rounded-full shadow-[0_0_15px_#f59e0b,inset_0_0_5px_#f59e0b] animate-pulse rotate-6">
                  <span className="text-[10px] sm:text-xs font-black text-amber-500 tracking-wider">FREE</span>
               </div>
            </div>

            <div className="relative flex flex-col items-center justify-center text-center space-y-3 sm:space-y-6">
              <div className="w-16 h-16 sm:w-20 md:w-28 bg-amber-500 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)] group-hover:scale-110 transition-transform duration-500">
                <Zap size={32} sm:size={40} className="text-black" fill="currentColor" />
              </div>
              
              <div className="space-y-1.5 sm:space-y-3">
                <h2 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-black italic uppercase tracking-tighter text-white leading-tight">
                  Pack<br/>Opener
                </h2>
                <div className="flex items-center justify-center gap-2">
                   <div className="h-0.5 w-6 md:w-10 bg-amber-500/50" />
                   <p className="text-[10px] sm:text-xs md:text-sm lg:text-base font-black uppercase tracking-[0.4em] text-amber-500">
                     Elite Pack
                   </p>
                   <div className="h-0.5 w-6 md:w-10 bg-amber-500/50" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bloque B: Hoops Draft */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative group cursor-pointer overflow-hidden rounded-2xl md:rounded-[2.5rem] border border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center aspect-square md:aspect-auto p-4"
            onClick={() => setCurrentView('draft')}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.15)_0%,_transparent_72%)]" />
            
            <div className="relative flex flex-col items-center justify-center text-center space-y-3 sm:space-y-6">
              <div className="w-16 h-16 sm:w-20 md:w-28 bg-blue-600 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)] group-hover:scale-110 transition-transform duration-500">
                <Trophy size={32} sm:size={40} className="text-white" />
              </div>
              
              <div className="space-y-1.5 sm:space-y-3">
                <h2 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-black italic uppercase tracking-tighter text-white leading-tight">
                  Hoops<br/>Draft
                </h2>
                <div className="flex items-center justify-center gap-2">
                   <div className="h-0.5 w-6 md:w-10 bg-blue-500/50" />
                   <p className="text-[10px] sm:text-xs md:text-sm lg:text-base font-black uppercase tracking-[0.4em] text-blue-400">
                     World Tour
                   </p>
                   <div className="h-0.5 w-6 md:w-10 bg-blue-500/50" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bloque C: Online Trading */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group cursor-pointer overflow-hidden rounded-2xl md:rounded-[2.5rem] border border-zinc-800 bg-zinc-950 flex flex-1 items-center justify-between p-5 md:p-8"
          onClick={() => setCurrentView('trading')}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,_rgba(168,85,247,0.1)_0%,_transparent_70%)]" />
          
          <div className="relative flex items-center gap-5 sm:gap-8">
            <div className="w-16 h-16 sm:w-20 md:w-24 bg-purple-600 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.3)] group-hover:rotate-12 transition-transform duration-500">
              <RefreshCw size={32} sm:size={40} className="text-white" />
            </div>
            
            <div className="space-y-2 sm:space-y-4">
              <h2 className="text-xl sm:text-3xl md:text-6xl lg:text-7xl font-black italic uppercase tracking-tighter text-white leading-none">
                Online Trading
              </h2>
              <p className="text-[10px] sm:text-sm md:text-base font-black uppercase tracking-[0.3em] text-purple-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
                Lobby Active
              </p>
            </div>
          </div>

          <div className="relative flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-purple-600/10 border border-purple-500/20 rounded-full group-hover:scale-110 group-hover:bg-purple-600 group-hover:border-purple-600 transition-all duration-300">
             <Star className="text-purple-400 group-hover:text-white" size={24} />
          </div>
        </motion.div>
  
        {/* Bloque D: Franchise Mode */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative group cursor-pointer overflow-hidden rounded-2xl md:rounded-[2.5rem] border border-zinc-800 bg-zinc-950 flex flex-1 items-center justify-between p-5 md:p-8"
          onClick={() => setCurrentView('career')}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,_rgba(16,185,129,0.1)_0%,_transparent_70%)]" />
          
          <div className="relative flex items-center gap-5 sm:gap-8">
            <div className="w-16 h-16 sm:w-20 md:w-24 bg-emerald-600 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] group-hover:scale-110 transition-transform duration-500">
              <Building size={32} sm:size={40} className="text-white" />
            </div>
            
            <div className="space-y-2 sm:space-y-4">
              <div className="flex items-center gap-3 sm:gap-6">
                <h2 className="text-xl sm:text-3xl md:text-6xl lg:text-7xl font-black italic uppercase tracking-tighter text-white leading-none">
                  Franchise
                </h2>
                <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-500 text-black text-[9px] sm:text-sm font-black rounded-full italic leading-none whitespace-nowrap shadow-[0_0_20px_rgba(245,158,11,0.4)]">BETA</span>
              </div>
              <p className="text-[10px] sm:text-sm md:text-base font-black uppercase tracking-[0.3em] text-emerald-400 flex items-center gap-2">
                <UserIcon size={14} />
                Manage Your Legacy
              </p>
            </div>
          </div>

          <div className="relative flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-emerald-600/10 border border-emerald-500/20 rounded-full group-hover:scale-110 group-hover:bg-emerald-600 group-hover:border-emerald-600 transition-all duration-300">
             <div className="text-[10px] font-black text-emerald-500 group-hover:text-white transition-colors tracking-tighter">OFFICE</div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default HomeView;
