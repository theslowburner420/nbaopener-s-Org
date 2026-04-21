import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Search, UserPlus, Globe, Shield, Zap, RefreshCw, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useGame } from '../context/GameContext';
import { useNotification } from '../context/NotificationContext';
import { RealtimeChannel } from '@supabase/supabase-js';

interface TradingLobbyProps {
  onJoinedRoom: (roomId: string) => void;
  onMatching: (active: boolean) => void;
  isMatching?: boolean;
}

const TradingLobby: React.FC<TradingLobbyProps> = ({ onJoinedRoom, onMatching, isMatching }) => {
  const { user, setCurrentView } = useGame();
  const { notifyError, notifySuccess, notifyInfo } = useNotification();
  const [friendUsername, setFriendUsername] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchingFriend, setIsSearchingFriend] = useState(false);
  
  const lobbyChannelRef = useRef<RealtimeChannel | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hard cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupSearch();
    };
  }, []);

  // Listen for external cancellations (e.g. from TradingView overlay)
  useEffect(() => {
    if (isSearching && isMatching === false) {
      console.log('🛑 External cancel detected. Cleaning up search...');
      cleanupSearch();
    }
  }, [isMatching, isSearching]);

  const cleanupSearch = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (lobbyChannelRef.current) {
      console.log('🔌 Unsubscribing from trading lobby channel...');
      lobbyChannelRef.current.unsubscribe();
      lobbyChannelRef.current = null;
    }
    setIsSearching(false);
    onMatching(false);
  };

  const startRandomMatch = async () => {
    if (!supabase || !user) return;
    
    // Prevent double starts
    if (isSearching) return;

    console.log('🔍 Starting random match search...');
    setIsSearching(true);
    onMatching(true);
    notifyInfo("Searching for trade partners...");

    try {
      // 1. Create global lobby channel
      const channel = supabase.channel('trading_lobby', {
        config: { presence: { key: user.id } }
      });
      lobbyChannelRef.current = channel;

      channel
        .on('presence', { event: 'sync' }, () => {
          if (!lobbyChannelRef.current) return;
          
          const state = channel.presenceState();
          // Look for someone else searching
          const others = Object.entries(state).filter(([key, presences]) => 
            key !== user.id && (presences[0] as any).status === 'searching'
          );

          if (others.length > 0) {
            console.log('🤝 Partner found! Initializing room...');
            const [otherId] = others[0];
            const roomId = [user.id, otherId].sort().join('_');
            
            // Critical: Cleanup BEFORE moving to room
            const foundRoomId = roomId;
            cleanupSearch();
            onJoinedRoom(foundRoomId);
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({ 
              status: 'searching', 
              username: user.username,
              timestamp: Date.now() 
            });
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            console.error('❌ Lobby channel error/closed:', status);
            cleanupSearch();
            notifyError("Connection lost. Please try again.");
          }
        });

      // 2. Strict Emergency Timeout (18 seconds)
      timeoutRef.current = setTimeout(() => {
        console.warn('⏱️ Matchmaking timeout reached.');
        cleanupSearch();
        notifyError("No players found. Try again in a moment.");
      }, 18000);

    } catch (err) {
      console.error('❌ Matchmaking exception:', err);
      cleanupSearch();
      notifyError("Failed to connect to matchmaking.");
    }
  };

  const startPrivateTrade = async () => {
    if (!friendUsername.trim()) return;
    setIsSearchingFriend(true);

    try {
      // Find user by username
      const { data, error } = await supabase!
        .from('profiles')
        .select('id')
        .eq('username', friendUsername.trim())
        .single();

      if (error || !data) {
        throw new Error("User not found.");
      }

      if (data.id === user?.id) {
        throw new Error("You cannot trade with yourself.");
      }

      // Create a private room ID
      const roomId = [user?.id, data.id].sort().join('_');
      onJoinedRoom(roomId);
      notifySuccess(`Trade request sent to ${friendUsername}`);
    } catch (err: any) {
      notifyError(err.message || "Failed to find user.");
    } finally {
      setIsSearchingFriend(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 shrink-0 relative">
        <button 
          onClick={() => setCurrentView('home')}
          className="absolute top-12 right-6 p-2 bg-zinc-900 rounded-xl text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1.5 h-4 bg-purple-500 rounded-full" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Trading Center</span>
        </div>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">Online Lobby</h1>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 pb-24 no-scrollbar">
        {/* Security Info */}
        <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl flex gap-4">
          <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 shrink-0">
            <Shield size={20} />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black text-white uppercase italic tracking-tight">Secured Trade</p>
            <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
              Only duplicate cards are tradable. Roster cards are protected and cannot be exchanged.
            </p>
          </div>
        </div>

        {/* Random Matchmaking */}
        <div className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-600 px-1">Social Hub</h2>
          
          <motion.div 
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={startRandomMatch}
            className="group cursor-pointer relative overflow-hidden bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex items-center justify-between"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative flex items-center gap-6">
              <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                <Globe size={28} className="text-white" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Random Trade</h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Match with any online player</p>
              </div>
            </div>
            
            <div className="relative flex items-center gap-2 text-purple-500">
              <span className="text-[10px] font-black uppercase tracking-widest group-hover:mr-2 transition-all">Search</span>
              <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
            </div>
          </motion.div>
        </div>

        {/* Invite Friend */}
        <div className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-600 px-1">Invite Partner</h2>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Enter Username"
                  value={friendUsername}
                  onChange={(e) => setFriendUsername(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-2xl px-5 py-4 text-sm font-bold text-white placeholder:text-zinc-600 focus:border-purple-500 outline-none transition-colors"
                />
                <UserPlus size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-700" />
              </div>
              <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest px-2">Invite a specific friend to a private trade session</p>
            </div>

            <button 
              onClick={startPrivateTrade}
              disabled={isSearchingFriend || !friendUsername}
              className="w-full h-14 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-purple-500 hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSearchingFriend ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              {isSearchingFriend ? 'Locating User...' : 'Invite Friend'}
            </button>
          </div>
        </div>

        {/* Recent Trades / Activity could go here */}
        <div className="p-8 rounded-3xl border border-zinc-900 border-dashed flex flex-col items-center justify-center text-center opacity-30">
          <Zap size={32} className="text-zinc-800 mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest">More Social Features Coming Soon</p>
        </div>
      </div>
    </div>
  );
};

export default TradingLobby;
