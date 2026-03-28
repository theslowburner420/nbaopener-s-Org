import React, { useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { LogIn, LogOut, User as UserIcon, Coins, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Header: React.FC = React.memo(() => {
  const { user, coins, login, logout } = useGame();

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
    <header className="h-12 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 flex items-center justify-between px-3 md:px-4 shrink-0 z-[5000] overflow-hidden">
      <div className="flex items-center gap-2 min-w-0">
        {user ? (
          <div className="flex items-center gap-2 min-w-0">
            {user.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.username} 
                className="w-6 h-6 rounded-full border border-zinc-700 shadow-sm shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 shadow-sm shrink-0">
                <UserIcon size={12} className="text-zinc-500" />
              </div>
            )}
            <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider text-white truncate max-w-[80px] md:max-w-[120px]">
              {user.username}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="w-6 h-6 md:w-7 md:h-7 bg-white rounded-lg flex items-center justify-center shadow-[0_4px_12px_rgba(255,255,255,0.15)] border border-zinc-200 shrink-0">
              <span className="text-black font-black text-[8px] md:text-[10px] italic tracking-tighter">HC</span>
            </div>
            <h1 className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-zinc-100 drop-shadow-md truncate">Hoops Collector</h1>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {/* Coins Display */}
        <div className="flex items-center gap-1 bg-zinc-900/80 px-2 md:px-3 py-1.5 rounded-xl border border-zinc-800/50 shadow-inner shrink-0">
          <Coins size={10} className="text-amber-500 md:w-3 md:h-3" />
          <span className="text-[10px] md:text-xs font-bold tabular-nums text-amber-500">
            <span className="hidden md:inline">{displayCoins}</span>
            <span className="md:hidden">{formatCoins(coins)}</span>
          </span>
        </div>

        {/* User Profile / Login */}
        {user ? (
          <div className="flex items-center gap-2 pl-2 md:pl-3 border-l border-zinc-800 shrink-0">
            <button 
              onClick={logout}
              className="text-[7px] md:text-[8px] font-bold uppercase tracking-tight text-zinc-500 hover:text-red-400 transition-colors px-1.5 md:px-2 py-1 rounded-lg hover:bg-red-500/10"
            >
              Logout
            </button>
          </div>
        ) : supabase ? (
          <button
            onClick={login}
            className="flex items-center gap-1 bg-white text-black px-3 md:px-4 py-1.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-wider hover:bg-amber-400 transition-all active:scale-95 shadow-[0_4px_15px_rgba(255,255,255,0.2)] border border-white/20 shrink-0"
          >
            <LogIn size={10} className="md:w-3 md:h-3" />
            <span>Login</span>
          </button>
        ) : (
          <div className="flex items-center gap-1 text-zinc-600 px-2 md:px-3 py-1.5 rounded-full border border-zinc-800/50 bg-zinc-900/30 shadow-inner shrink-0">
            <AlertCircle size={10} />
            <span className="text-[7px] md:text-[8px] font-bold uppercase tracking-tighter">Offline</span>
          </div>
        )}
      </div>
    </header>
  );
});

export default Header;
