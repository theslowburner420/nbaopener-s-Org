import React from 'react';
import { useGame } from '../context/GameContext';
import { LogIn, LogOut, User as UserIcon, Coins, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Header: React.FC = () => {
  const { user, coins, login, logout } = useGame();

  return (
    <header className="h-12 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 flex items-center justify-between px-4 shrink-0 z-[5000]">
      <div className="flex items-center gap-2">
        {user ? (
          <div className="flex items-center gap-2">
            {user.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={user.username} 
                className="w-6 h-6 rounded-full border border-zinc-700 shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 shadow-sm">
                <UserIcon size={12} className="text-zinc-500" />
              </div>
            )}
            <span className="text-[10px] font-black uppercase tracking-wider text-white truncate max-w-[120px]">
              {user.username}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-[0_4px_12px_rgba(255,255,255,0.15)] border border-zinc-200">
              <span className="text-black font-black text-[10px] italic tracking-tighter">NBA</span>
            </div>
            <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-100 drop-shadow-md">Card Opener</h1>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Coins Display */}
        <div className="flex items-center gap-1.5 bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-zinc-800/50 shadow-inner">
          <Coins size={12} className="text-amber-500" />
          <span className="text-xs font-bold tabular-nums text-amber-500">{coins.toLocaleString()}</span>
        </div>

        {/* User Profile / Login */}
        {user ? (
          <div className="flex items-center gap-2 pl-3 border-l border-zinc-800">
            <button 
              onClick={logout}
              className="text-[8px] font-bold uppercase tracking-tight text-zinc-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
            >
              Logout
            </button>
          </div>
        ) : supabase ? (
          <button
            onClick={login}
            className="flex items-center gap-1.5 bg-white text-black px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider hover:bg-amber-400 transition-all active:scale-95 shadow-[0_4px_15px_rgba(255,255,255,0.2)] border border-white/20"
          >
            <LogIn size={12} />
            <span>Login</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-zinc-600 px-3 py-1.5 rounded-full border border-zinc-800/50 bg-zinc-900/30 shadow-inner">
            <AlertCircle size={10} />
            <span className="text-[8px] font-bold uppercase tracking-tighter">Offline</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
