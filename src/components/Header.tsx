import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { LogIn, LogOut, User as UserIcon, Coins, AlertCircle, ChevronDown, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

const Header: React.FC = React.memo(() => {
  const { user, coins, login, logout, setCurrentView } = useGame();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatCoins = (num: any) => {
    const n = Number(num) || 0;
    if (n >= 1000000) {
      return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (n >= 10000) {
      return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return n.toLocaleString();
  };

  const displayCoins = useMemo(() => {
    const n = Number(coins) || 0;
    return n.toLocaleString();
  }, [coins]);

  return (
    <header className="h-14 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 flex items-center justify-between px-4 shrink-0 z-[5000] relative">
      {/* Left side: Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-[0_4px_12px_rgba(255,255,255,0.15)] border border-zinc-200 shrink-0">
          <span className="text-black font-black text-xs italic tracking-tighter">HC</span>
        </div>
        <h1 className="hidden sm:block text-xs font-black uppercase tracking-[0.2em] text-zinc-100 drop-shadow-md">Hoops Collector</h1>
      </div>

      {/* Right side: Coins & Profile */}
      <div className="flex items-center gap-3">
        {/* Coins Display */}
        <div className="flex items-center gap-1.5 bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-zinc-800/50 shadow-inner">
          <Coins size={12} className="text-amber-500" />
          <span className="text-xs font-bold tabular-nums text-amber-500">
            <span className="hidden xs:inline">{displayCoins}</span>
            <span className="xs:hidden">{formatCoins(coins)}</span>
          </span>
        </div>

        {/* User Profile / Login */}
        {user ? (
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 pl-2 border-l border-zinc-800 hover:opacity-80 transition-all"
            >
              <div className="relative">
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.username} 
                    className="w-8 h-8 rounded-full border-2 border-zinc-800 shadow-sm shrink-0 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-800 shadow-sm shrink-0">
                    <UserIcon size={14} className="text-zinc-500" />
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-zinc-950 rounded-full" />
              </div>
              <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 w-56 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden z-[6000]"
                >
                  <div className="p-4 border-b border-zinc-900 bg-zinc-900/30">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Signed in as</p>
                    <p className="text-sm font-bold text-white truncate">{user.username}</p>
                    <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                  </div>
                  
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setCurrentView('profile');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-all text-xs font-bold uppercase tracking-wider"
                    >
                      <Settings size={16} />
                      My Account
                    </button>
                    
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all text-xs font-bold uppercase tracking-wider"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : supabase ? (
          <button
            onClick={login}
            className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all active:scale-95 shadow-[0_4px_15px_rgba(255,255,255,0.2)] border border-white/20"
          >
            <LogIn size={12} />
            <span>Login</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 text-zinc-600 px-3 py-1.5 rounded-full border border-zinc-800/50 bg-zinc-900/30 shadow-inner">
            <AlertCircle size={12} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Offline</span>
          </div>
        )}
      </div>
    </header>
  );
});


export default Header;
