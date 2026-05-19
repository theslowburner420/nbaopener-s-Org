import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { LogIn, LogOut, User as UserIcon, Coins, AlertCircle, ChevronDown, Settings, Cloud, Check, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

const Header: React.FC = React.memo(() => {
  const { user, coins, login, logout, setCurrentView, isAuthLoading, isSaving, isBackgroundSaving } = useGame();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isSyncing = isSaving || isBackgroundSaving;

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
    <header className="h-14 md:h-16 bg-black/40 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between px-4 md:px-10 shrink-0 z-[5000] relative">
      {/* Left side: Logo */}
      <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setCurrentView('home')}>
        <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl overflow-hidden shadow-[0_5px_15px_rgba(255,255,255,0.1)] border border-white/10 shrink-0 group-hover:scale-110 transition-transform duration-700">
          <img 
            src="https://i.postimg.cc/K83yjb9c/Wvn-WDz-Es-400x400.jpg" 
            alt="Logo" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Right side: Coins & Profile */}
      <div className="flex items-center gap-4">
        {/* Coins Display */}
        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xl px-3 py-1.5 md:px-4 md:py-2 rounded-full border border-white/5 shadow-2xl group hover:border-amber-500/30 transition-colors cursor-pointer"
             onClick={() => setCurrentView('shop')}>
          <Coins size={14} className="text-amber-500" fill="currentColor" />
          <span className="text-xs md:text-sm font-black tabular-nums text-amber-500 tracking-tight">
            {displayCoins}
          </span>
        </div>

        {/* User Profile / Login */}
        {isAuthLoading ? (
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 animate-pulse shrink-0" />
        ) : user ? (
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 pl-3 border-l border-white/5 hover:opacity-80 transition-all"
            >
              <div className="relative">
                {user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.username} 
                    className="w-8 h-8 md:w-9 md:h-9 rounded-lg border border-white/10 shadow-xl shrink-0 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-zinc-800 flex items-center justify-center border border-white/10 shadow-xl shrink-0">
                    <UserIcon size={14} className="text-zinc-500" />
                  </div>
                )}
              </div>
              <ChevronDown size={14} className={`text-zinc-500 transition-transform duration-500 ${isMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Premium Dropdown Menu */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-4 w-60 bg-black/90 backdrop-blur-2xl border border-white/5 rounded-2xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] p-2 z-[6000]"
                >
                  <div className="p-3 rounded-xl bg-white/5 mb-2 overflow-hidden relative">
                    <p className="text-[10px] font-black text-white truncate italic tracking-tight">{user.username}</p>
                    <p className="text-[9px] text-zinc-500 truncate font-medium">{user.email}</p>
                  </div>
                  
                  <div className="space-y-0.5">
                    <button
                      onClick={() => {
                        setCurrentView('profile');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all text-[9px] font-black uppercase tracking-widest"
                    >
                      <UserIcon size={14} className="text-zinc-600" />
                      Account
                    </button>
                    
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all text-[9px] font-black uppercase tracking-widest"
                    >
                      <LogOut size={14} />
                      Logout
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : supabase ? (
          <button
            onClick={login}
            className="flex items-center gap-1.5 bg-white text-black px-3.5 py-1.5 md:px-4 md:py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] hover:bg-amber-400 transition-all active:scale-95 shadow-lg border border-white/10"
          >
            <LogIn size={12} />
            <span>Google Login</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-zinc-600 px-3 py-1.5 rounded-full border border-white/5 bg-zinc-900/30">
            <AlertCircle size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest">Local</span>
          </div>
        )}
      </div>
    </header>
  );
});


export default Header;
