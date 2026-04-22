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
  
  const matchmakingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMatchFoundRef = useRef(false);

  // Matchmaking Management Logic (Database-Driven)
  useEffect(() => {
    if (!isSearching || !supabase || !user) {
      if (matchmakingIntervalRef.current) clearInterval(matchmakingIntervalRef.current);
      return;
    }

    isMatchFoundRef.current = false;
    
    const conductMatchmaking = async () => {
      if (isMatchFoundRef.current) return;

      try {
        // 1. Check if there's an existing room waiting for me using maybeSingle to avoid 406
        const { data: myHostRequest, error: hostError } = await supabase!
          .from('trading_queues')
          .select('*')
          .eq('host_id', user.id)
          .maybeSingle();

        if (myHostRequest && myHostRequest.status === 'matched') {
          isMatchFoundRef.current = true;
          handleMatchFound(myHostRequest.room_id);
          return;
        }

        // 2. If no request exists, try to find someone else waiting
        const { data: othersWaiting, error: findError } = await supabase!
          .from('trading_queues')
          .select('*')
          .eq('status', 'waiting')
          .neq('host_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1);

        if (othersWaiting && othersWaiting.length > 0) {
          const target = othersWaiting[0];
          const roomId = [user.id, target.host_id].sort().join('_');
          
          // Try to "claim" this guest slot
          const { error: joinError } = await supabase!
            .from('trading_queues')
            .update({ 
               guest_id: user.id, 
               status: 'matched',
               room_id: roomId 
            })
            .eq('id', target.id)
            .eq('status', 'waiting'); // Atomic check to prevent double join

          if (!joinError) {
            isMatchFoundRef.current = true;
            handleMatchFound(roomId);
            return;
          }
        }

        // 3. If nobody found, ensure my own host request is active (upsert handles creation)
        if (!myHostRequest) {
          await supabase!
            .from('trading_queues')
            .upsert({ 
              host_id: user.id, 
              host_username: user.username,
              status: 'waiting',
              created_at: new Date().toISOString()
            }, { onConflict: 'host_id' });
        }
      } catch (err) {
        console.error("Matchmaking error:", err);
      }
    };

    const handleMatchFound = (roomId: string) => {
      setIsSearching(false);
      onMatching(false);
      if (matchmakingIntervalRef.current) clearInterval(matchmakingIntervalRef.current);
      
      // Cleanup the queue entry after a short delay or let room handle it
      supabase!.from('trading_queues').delete().eq('host_id', user.id).then(() => {
        onJoinedRoom(roomId);
      });
    };

    // Poll every 3 seconds instead of socket chaos
    conductMatchmaking();
    matchmakingIntervalRef.current = setInterval(conductMatchmaking, 3000);

    // Timeout (25s)
    const timeout = setTimeout(() => {
      if (isSearching && !isMatchFoundRef.current) {
        setIsSearching(false);
        onMatching(false);
        notifyError("No players found. Try again.");
        cleanupDatabaseQueue();
      }
    }, 25000);

    const cleanupDatabaseQueue = async () => {
      if (matchmakingIntervalRef.current) clearInterval(matchmakingIntervalRef.current);
      await supabase!.from('trading_queues').delete().eq('host_id', user.id);
    };

    return () => {
      clearTimeout(timeout);
      cleanupDatabaseQueue();
    };
  }, [isSearching, user?.id]);

  // External cancellation sync
  useEffect(() => {
    if (isSearching && isMatching === false) {
      setIsSearching(false);
    }
  }, [isMatching, isSearching]);

  const startRandomMatch = async () => {
    if (!supabase || !user) return;
    if (isSearching) return;
    setIsSearching(true);
    onMatching(true);
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
