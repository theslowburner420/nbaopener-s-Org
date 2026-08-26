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
    <div className="flex flex-col h-full bg-black relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      {/* Header */}
      <header className="px-6 pt-12 pb-8 shrink-0 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => setCurrentView('home')}
            className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-all transform hover:-translate-x-1"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-zinc-700">
              <ArrowLeft size={16} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Live Market</span>
          </div>
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-3 bg-purple-500 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Global Exchange</span>
            </div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-none">
              Trading<br />Center
            </h1>
          </div>

          <div className="text-right hidden sm:block">
            <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-1">Your Reputation</p>
            <div className="flex items-center gap-1 justify-end">
              {Array.from({length: 5}).map((_, i) => (
                <div key={i} className="w-3 h-3 bg-white/10 border border-white/5 rounded-sm flex items-center justify-center">
                  <Zap size={8} className="text-purple-500 fill-current" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-8 pb-32 no-scrollbar relative z-10">
        {/* Security Info Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 bg-gradient-to-br from-zinc-900/80 to-zinc-950 border border-zinc-800 rounded-[2rem] flex gap-5 shadow-2xl backdrop-blur-md"
        >
          <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 shrink-0 border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
            <Shield size={24} />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black text-white uppercase italic tracking-tight">Verified Protocol v2.5</p>
            <p className="text-[10px] text-zinc-500 font-medium leading-relaxed italic uppercase">
              Only duplicates are tradable. Your core roster is locked for safety. All transactions are atomic.
            </p>
          </div>
        </motion.div>

        {/* Action Grid */}
        <div className="grid grid-cols-1 gap-6">
          {/* Random Matchmaking */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Quick Connect</h2>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">Searching: 512 Online</span>
              </div>
            </div>
            
            <motion.div 
              whileHover={{ scale: 1.01, rotate: 0.5 }}
              whileTap={{ scale: 0.98 }}
              onClick={startRandomMatch}
              className="group cursor-pointer relative overflow-hidden bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8 flex items-center justify-between shadow-xl transition-all hover:bg-zinc-800/80 hover:border-purple-500/30"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/10 transition-colors" />
              
              <div className="relative flex items-center gap-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.3)] group-hover:scale-110 transition-transform">
                  <Globe size={32} className="text-white" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Global Lobby</h3>
                    <div className="px-2 py-0.5 bg-purple-500 rounded text-[8px] font-black text-white uppercase italic">Active</div>
                  </div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic leading-none">Find a partner across the league</p>
                </div>
              </div>
              
              <div className="relative flex flex-col items-end gap-1">
                <div className="flex items-center gap-2 text-purple-400">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] group-hover:mr-2 transition-all">Match Me</span>
                  <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-700" />
                </div>
                <p className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest hidden sm:block">Avg 2s wait</p>
              </div>
            </motion.div>
          </div>

          {/* Invite Friend */}
          <div className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1 italic">Private Exchange</h2>
            
            <div className="bg-gradient-to-br from-zinc-900/40 to-transparent border border-zinc-800 rounded-[2.5rem] p-8 space-y-8 backdrop-blur-sm">
              <div className="space-y-4">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest px-1">Invite a specific GM to your office</p>
                <div className="relative group">
                  <input 
                    type="text"
                    placeholder="Enter Username..."
                    value={friendUsername}
                    onChange={(e) => setFriendUsername(e.target.value)}
                    className="w-full bg-black/60 border border-zinc-800 rounded-2xl px-6 py-5 text-sm font-black italic text-white placeholder:text-zinc-800 focus:border-purple-500/50 outline-none transition-all focus:ring-4 focus:ring-purple-500/5"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
                    <div className="w-px h-6 bg-zinc-800" />
                    <UserPlus size={20} className="text-zinc-800 group-focus-within:text-purple-500 transition-colors" />
                  </div>
                </div>
              </div>

              <button 
                onClick={startPrivateTrade}
                disabled={isSearchingFriend || !friendUsername}
                className="w-full h-18 bg-white text-black rounded-[1.5rem] font-black uppercase tracking-[0.25em] italic text-xs hover:bg-purple-500 hover:text-white transition-all shadow-[0_20px_40px_rgba(0,0,0,0.3)] active:scale-95 disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
              >
                {isSearchingFriend ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Locating Manager...</span>
                  </>
                ) : (
                  <>
                    <Zap size={18} className="fill-current" />
                    <span>Send Invite</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-center gap-8 py-4 opacity-30 italic">
          <div className="flex items-center gap-2">
            <Shield size={12} className="text-zinc-500" />
            <span className="text-[8px] font-black uppercase tracking-widest">End-to-End Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap size={12} className="text-zinc-500" />
            <span className="text-[8px] font-black uppercase tracking-widest">Instant Swap</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingLobby;
