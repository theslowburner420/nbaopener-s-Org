import React from 'react';
import { motion } from 'motion/react';
import { Zap, Trophy, Sparkles, Star, RefreshCw, Building, User as UserIcon, Puzzle } from 'lucide-react';
import { useGame } from '../context/GameContext';

const HomeView: React.FC = () => {
  const { setCurrentView } = useGame();

  return (
    <div className="min-h-full w-full flex flex-col bg-black relative">
      {/* Container that allows content to expand */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 lg:p-10 pb-24 md:pb-10">
        <div className="max-w-7xl mx-auto">
          {/* Main Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 md:gap-5 h-full">
            
            {/* Top Area: Main Features */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:col-span-8 relative group cursor-pointer overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-900 aspect-[16/9] md:aspect-auto md:h-[400px]"
              onClick={() => setCurrentView('open')}
            >
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://i.postimg.cc/vHMy0CHK/generated-image.png" 
                  alt="Pack Opener" 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
              </div>
              
              <div className="absolute bottom-10 left-10 z-10">
                <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white">Pack<br />Opener</h2>
                <div className="flex items-center gap-2 mt-4">
                  <span className="px-4 py-1.5 bg-amber-500 text-black text-xs font-black rounded-full uppercase italic">Open Daily</span>
                  <span className="px-4 py-1.5 bg-white/10 backdrop-blur-xl text-white text-xs font-black rounded-full uppercase italic border border-white/10">Free Rewards</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-4 relative group cursor-pointer overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-900 aspect-square md:aspect-auto md:h-[400px]"
              onClick={() => setCurrentView('draft')}
            >
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://i.postimg.cc/TwG0zjyz/generated-image-(1).png" 
                  alt="Hoops Draft" 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              </div>
              <div className="absolute bottom-8 left-8 z-10">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Hoops<br />Draft</h2>
              </div>
            </motion.div>

            {/* Bottom Row: Social & Career */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-4 relative group cursor-pointer overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-950 aspect-[4/3] md:aspect-auto md:h-[300px]"
              onClick={() => setCurrentView('trading')}
            >
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://i.postimg.cc/PJ7m51xb/generated-image-(2).png" 
                  alt="Trading Hall" 
                  className="w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              </div>
              <div className="absolute bottom-6 left-6 z-10">
                <h3 className="text-xl font-black italic uppercase tracking-widest text-white">Live Trading</h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Marketplace Hub</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-4 relative group cursor-pointer overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-950 aspect-[4/3] md:aspect-auto md:h-[300px]"
              onClick={() => setCurrentView('career')}
            >
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://i.postimg.cc/CxGfW3j7/generated-image-(3).png" 
                  alt="Franchise" 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-900/40 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              </div>
              <div className="absolute bottom-6 left-6 z-10">
                <div className="flex items-center gap-2 mb-2">
                   <Building size={14} className="text-amber-500" />
                   <span className="bg-amber-500 text-black px-2 py-0.5 rounded text-[8px] font-black italic">BETA</span>
                </div>
                <h3 className="text-xl font-black italic uppercase tracking-widest text-white">Franchise</h3>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="lg:col-span-4 relative group cursor-pointer overflow-hidden rounded-[2.5rem] border border-white/5 bg-zinc-950 aspect-[4/3] md:aspect-auto md:h-[300px]"
              onClick={() => setCurrentView('sbc')}
            >
              <div className="absolute inset-0 z-0">
                <img 
                  src="https://i.postimg.cc/2SkZNHTG/generated-image-(4).png" 
                  alt="SBC" 
                  className="w-full h-full object-cover opacity-70 transition-transform duration-1000 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-zinc-900/40 to-transparent" />
              </div>
              <div className="absolute bottom-6 left-6 z-10">
                <div className="flex items-center gap-2 mb-2">
                   <Puzzle size={14} className="text-zinc-500" />
                </div>
                <h3 className="text-xl font-black italic uppercase tracking-widest text-white">Puzzles</h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">SBC Challenges</p>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
