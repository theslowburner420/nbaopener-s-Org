import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Users, Shield, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import TradingLobby from '../components/TradingLobby';
import TradingRoom from '../components/TradingRoom';
import { supabase } from '../lib/supabase';

export type TradingState = 'lobby' | 'matching' | 'room' | 'finished';

const TradingView: React.FC = () => {
  const { user, setCurrentView } = useGame();
  const [session, setSession] = useState<any>(null);
  const [currentState, setCurrentState] = useState<TradingState>('lobby');
  const [roomId, setRoomId] = useState<string | null>(null);

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="w-20 h-20 bg-zinc-900 rounded-3xl flex items-center justify-center text-zinc-500">
          <Shield size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-white">Login Required</h2>
          <p className="text-zinc-500 text-sm max-w-xs mx-auto leading-relaxed">
            Trading requires an account to ensure secure transactions and track your duplicate cards.
          </p>
        </div>
        <button 
          onClick={() => setCurrentView('profile')}
          className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-400 transition-all active:scale-95"
        >
          Go to Login
        </button>
        <button 
          onClick={() => setCurrentView('home')}
          className="text-zinc-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full bg-black flex flex-col relative">
      <AnimatePresence mode="wait">
        {currentState === 'lobby' || currentState === 'matching' ? (
          <motion.div
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-full w-full"
          >
            <TradingLobby 
              onJoinedRoom={(id) => {
                setRoomId(id);
                setCurrentState('room');
              }}
              onMatching={(active) => setCurrentState(active ? 'matching' : 'lobby')}
              isMatching={currentState === 'matching'}
            />
          </motion.div>
        ) : (
          <motion.div
            key="room"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-full w-full"
          >
            {roomId && (
              <TradingRoom 
                roomId={roomId} 
                onLeave={() => {
                  setRoomId(null);
                  setCurrentState('lobby');
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Matching Overlay */}
      <AnimatePresence>
        {currentState === 'matching' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[7000] bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-purple-600/20 rounded-full flex items-center justify-center animate-pulse">
                <Users size={48} className="text-purple-500" />
              </div>
              <div className="absolute inset-0 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
            
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">Finding Partner</h2>
            <p className="text-zinc-500 text-xs font-medium max-w-[200px]">Searching for other players looking for a trade...</p>
            
            <button 
              onClick={() => setCurrentState('lobby')}
              className="mt-10 px-6 py-3 bg-zinc-900 text-zinc-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-white transition-colors"
            >
              Cancel Search
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TradingView;
