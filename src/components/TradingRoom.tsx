import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RefreshCw, ChevronLeft, Coins, Check, ArrowRight, ShieldCheck, AlertTriangle, Users, Loader2, Zap } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { ALL_CARDS } from '../data/cards';
import { Card } from '../types';
import CardItem from './CardItem';
import { supabase } from '../lib/supabase';
import { useNotification } from '../context/NotificationContext';

const RARITY_COLORS: Record<string, string> = {
  'bench': '#94A3B8',
  'starter': '#10B981',
  'allstar': '#3B82F6',
  'franchise': '#A855F7',
  'legend': '#F59E0B',
  'coach': '#3B82F6',
  'dpoy': '#064E3B',
  'roty': '#EA580C',
  'record': '#F59E0B',
  'rookie': '#3B82F6',
  'logo': '#F59E0B',
  'arena': '#10B981',
  'draft2026': '#6366F1',
  'scoring_champ': '#FF4D4D',
  'hof': '#F1F5F9',
  'coy': '#FDE047',
  'rising_star': '#06B6D4',
  'allnba_1st': '#F59E0B',
  'invincible': '#FFD700',
  'galaxy': '#E94560',
  'legend_sbc': '#F59E0B',
  'icon_sbc': '#8B5CF6',
  'moments_sbc': '#FFFFFF',
  'future_star': '#10B981',
};

interface TradingRoomProps {
  roomId: string;
  onLeave: () => void;
}

interface TradeOffer {
  cards: string[];
  coins: number;
  ready: boolean;
}

const TradingRoom: React.FC<TradingRoomProps> = ({ roomId, onLeave }) => {
  const { user, collection, coins: myTotalCoins, refreshFromCloud, forceSync } = useGame();
  const { notifyError, notifySuccess, notifyInfo } = useNotification();
  
  const [myOffer, setMyOffer] = useState<TradeOffer>({ cards: [], coins: 0, ready: false });
  const [theirOffer, setTheirOffer] = useState<TradeOffer>({ cards: [], coins: 0, ready: false });
  const [partnerUsername, setPartnerUsername] = useState<string>('Partner');
  const [isExecuting, setIsExecuting] = useState(false);
  const [showDuplicatePicker, setShowDuplicatePicker] = useState(false);

  const myOfferRef = React.useRef(myOffer);
  const theirOfferRef = React.useRef(theirOffer);

  useEffect(() => { myOfferRef.current = myOffer; }, [myOffer]);
  useEffect(() => { theirOfferRef.current = theirOffer; }, [theirOffer]);

  // Filter duplicate cards for picking
  const duplicateCards = useMemo(() => {
    return ALL_CARDS.filter(card => (collection[card.id] || 0) > 1);
  }, [collection]);

  const channelRef = React.useRef<any>(null);

  // Real-time Channel Setup
  useEffect(() => {
    if (!supabase || !user) return;

    const channel = supabase.channel(`trade:${roomId}`, {
      config: {
        broadcast: { self: false }
      }
    });
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'offer_update' }, ({ payload }) => {
        setTheirOffer(payload.offer);
        setPartnerUsername(payload.username || 'Partner');
      })
      .on('broadcast', { event: 'trade_confirmed' }, async ({ payload }) => {
        // When we receive confirmation from the other player, we trigger the finalization
        console.log("Partner confirmed trade:", payload.by);
        await handleTradeFinalized();
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const others = Object.keys(state).filter(k => k !== user.id);
        if (others.length === 0) {
          // notifyError("Partner left.");
        }
      })
      .subscribe(async (status, err) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ username: user.username });
          // Initial broadcast
          channel.send({
            type: 'broadcast',
            event: 'offer_update',
            payload: { offer: myOffer, username: user.username }
          });
        }
      });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomId, user?.id]);

  // Sync my offer changes
  useEffect(() => {
    if (channelRef.current && myOffer && user) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'offer_update',
        payload: { offer: myOffer, username: user.username }
      });
    }
  }, [myOffer, user?.username]);

  const toggleReady = () => {
    setMyOffer(prev => ({ ...prev, ready: !prev.ready }));
  };

  const addCardToOffer = (cardId: string) => {
    // Check if card is already in offer and how many we have
    const activeCount = myOffer.cards.filter(id => id === cardId).length;
    const totalDuplicates = (collection[cardId] || 0) - 1; // 1 must stay in roster

    if (activeCount >= totalDuplicates) {
      notifyError("You don't have more duplicates of this card.");
      return;
    }

    if (myOffer.cards.length >= 3) {
      notifyError("Max 3 cards per trade.");
      return;
    }

    setMyOffer(prev => ({
      ...prev,
      cards: [...prev.cards, cardId],
      ready: false // Reset ready on change
    }));
  };

  const removeCardFromOffer = (index: number) => {
    setMyOffer(prev => ({
      ...prev,
      cards: prev.cards.filter((_, i) => i !== index),
      ready: false
    }));
  };

  const setCoinsOffer = (amount: number) => {
    const validAmount = Math.max(0, Math.min(amount, myTotalCoins));
    setMyOffer(prev => ({ ...prev, coins: validAmount, ready: false }));
  };

  const handleTradeFinalized = async () => {
    if (isExecuting) return;
    
    // Safety check: Only the "host" of the room (lexicographically first ID) 
    // initiates the DB transaction to avoid double execution/race conditions.
    const [id1, id2] = roomId.split('_');
    const isPrimaryHost = user?.id === id1;

    setIsExecuting(true);
    try {
      if (isPrimaryHost) {
        const payload = {
          p_host_id: id1,
          p_guest_id: id2,
          p_host_coins: myOfferRef.current.coins,
          p_guest_coins: theirOfferRef.current.coins,
          p_host_cards: myOfferRef.current.cards,
          p_guest_cards: theirOfferRef.current.cards
        };

        console.log("⚡ Host executing Atomic Swap via RPC...");
        const { data, error } = await supabase!.rpc('complete_nba_trade', payload);

        if (error) throw error;
        if (data && !data.success) throw new Error(data.error);

        console.log("✅ RPC Success!");
      } else {
        console.log("⏳ Guest waiting for host to finalize transaction...");
        // Wait a bit for DB to catch up before refreshing
        await new Promise(r => setTimeout(r, 1500));
      }

      // Both refresh to see the new data
      // This pulls the authoritative state from the server
      await refreshFromCloud();
      notifySuccess("Trade Completed! Balances updated.");
      
      // IMPORTANT: We do NOT call forceSync here anymore. 
      // Doing so would push the old local state back to Supabase, 
      // effectively undoing the trade or causing coin drift.
      
      setTimeout(() => onLeave(), 2000);
    } catch (err: any) {
      console.error("Critical Trade Fail:", err);
      notifyError(`Trade Failed: ${err.message || 'Error en el servidor'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const acceptTrade = async () => {
    if (!myOffer.ready || !theirOffer.ready) return;
    if (isExecuting) return;
    
    setIsExecuting(true);
    try {
      // Broadcast confirmation so both clients know it's time to finalize
      await channelRef.current.send({
        type: 'broadcast',
        event: 'trade_confirmed',
        payload: { by: user?.id }
      });

      // Also execute locally
      await handleTradeFinalized();
    } catch (err) {
      notifyError("Failed to send confirmation.");
      setIsExecuting(false);
    }
  };

  const offerCards = myOffer.cards.map(id => ALL_CARDS.find(c => c.id === id)).filter(Boolean) as Card[];
  const partnerCards = theirOffer.cards.map(id => ALL_CARDS.find(c => c.id === id)).filter(Boolean) as Card[];

  if (isExecuting) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-black gap-12 p-8 relative overflow-hidden">
        {/* Decorative rays */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent animate-pulse" />
        
        <div className="relative">
          <div className="w-32 h-32 bg-white/5 rounded-[2.5rem] flex items-center justify-center backdrop-blur-xl border border-white/10">
            <RefreshCw size={56} className="text-purple-500 animate-spin" />
          </div>
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-2xl animate-bounce">
             <Check size={28} className="text-black" />
          </div>
        </div>

        <div className="text-center space-y-4">
          <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white">Finalizing Deal</h2>
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em]">Synching with verified protocol...</p>
            <div className="w-48 h-1 bg-zinc-900 rounded-full overflow-hidden">
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                className="h-full w-1/3 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
              />
            </div>
          </div>
        </div>

        <div className="absolute bottom-12 flex items-center gap-4 opacity-20">
          <ShieldCheck size={20} className="text-white" />
          <p className="text-[10px] font-black uppercase tracking-widest text-white italic">Atomic Swap Execution</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-black overflow-hidden select-none relative">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-radial-gradient from-purple-950/20 via-black to-black pointer-events-none" />

      {/* Header (Slimmed for maximum space conservation) */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-zinc-900 bg-black/85 backdrop-blur-2xl z-20">
        <button 
          onClick={onLeave} 
          className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-all transform hover:-translate-x-1"
        >
          <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-zinc-700">
            <ChevronLeft size={14} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">Abort Exchange</span>
        </button>
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[7px] font-black uppercase tracking-widest text-zinc-600 leading-none">Secure Wire</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-purple-400 mt-0.5 leading-none">Live Connected</span>
          </div>
          <div className="w-8 h-8 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center">
            <Users size={14} className="text-purple-400 animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main Trading Area (Strictly Scroll-Free 50/50 Grid) */}
      <div className="flex-1 min-h-0 grid grid-rows-2 lg:grid-rows-1 lg:grid-cols-2 gap-3 p-3 bg-zinc-950/20">
        
        {/* TOP/LEFT CELL: Partner's Offer */}
        <section className="relative rounded-3xl border border-zinc-900/80 bg-zinc-950/40 backdrop-blur-xl p-3.5 flex flex-col justify-between min-h-0 h-full overflow-hidden group/partner">
          {/* Subtle static pulse */}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/10 via-transparent to-transparent pointer-events-none" />
          
          {/* Partner Info Panel */}
          <div className="flex items-center justify-between border-b border-zinc-900/50 pb-2.5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center border border-zinc-850 shadow-inner overflow-hidden">
                  <div className="bg-zinc-900/50 w-full h-full flex items-center justify-center text-zinc-500 text-sm font-black uppercase italic">
                    {partnerUsername[0]}
                  </div>
                </div>
                {theirOffer.ready && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-black shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-bounce">
                    <Check size={8} className="text-black stroke-[4px]" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-base font-black italic uppercase tracking-tighter text-white leading-none mb-0.5">{partnerUsername}</h3>
                <p className="text-[7px] text-zinc-550 uppercase font-black tracking-widest italic">Remote Proposal</p>
              </div>
            </div>
            
            <div className={`px-3 py-1 rounded-full border transition-all duration-500 ${theirOffer.ready ? 'bg-green-500/10 border-green-500/30 text-green-500 shadow-[0_0_12px_rgba(34,197,94,0.15)]' : 'bg-zinc-900/80 border-zinc-850 text-zinc-600'}`}>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] italic">{theirOffer.ready ? 'LOCKED' : 'PENDING'}</span>
            </div>
          </div>

          {/* Cards & Items Space */}
          <div className="flex-1 min-h-0 flex flex-col justify-center py-2.5">
            <div className="grid grid-cols-3 gap-2.5 max-w-md mx-auto w-full">
              {partnerCards.map((card, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="aspect-[2.5/3.2] relative rounded-2xl overflow-hidden border bg-zinc-950 flex flex-col justify-between p-2 group/bento shadow-lg"
                  style={{ borderColor: `${RARITY_COLORS[card.rarity] || '#ffffff'}30` }}
                >
                  <div className="absolute inset-0 opacity-10 bg-gradient-to-t from-black to-zinc-900 pointer-events-none" />
                  
                  {/* Top indicators */}
                  <div className="flex justify-between items-center relative z-10 w-full">
                    <span className="text-[9px] font-mono font-black text-amber-500 leading-none bg-black/80 px-1 py-0.5 rounded border border-white/5">{card.stats.ovr}</span>
                    <span className="text-[7px] font-black text-zinc-400 uppercase tracking-wider leading-none">{card.teamAbbr}</span>
                  </div>

                  {/* Character image */}
                  <div className="flex-1 w-full flex items-center justify-center relative overflow-hidden my-1">
                    {card.imageUrl ? (
                      <img 
                        src={card.imageUrl} 
                        className="h-[110%] object-contain select-none pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]" 
                        referrerPolicy="no-referrer" 
                        alt={card.name} 
                      />
                    ) : (
                      <span className="text-lg">🏀</span>
                    )}
                  </div>

                  {/* Name footer */}
                  <div className="relative z-10 bg-black/80 py-0.5 rounded text-center w-full">
                    <span className="text-[7px] font-black text-white truncate block uppercase tracking-tight">{card.name.split(' ').pop()}</span>
                  </div>
                </motion.div>
              ))}
              {Array.from({length: 3 - partnerCards.length}).map((_, i) => (
                <div key={i} className="aspect-[2.5/3.2] border border-dashed border-zinc-900 rounded-2xl flex flex-col items-center justify-center opacity-20 bg-zinc-950/40">
                  <div className="w-6 h-6 rounded-full border border-zinc-800 flex items-center justify-center mb-1 bg-black/50">
                    <span className="text-[8px] font-black text-zinc-650">{i + 1 + partnerCards.length}</span>
                  </div>
                  <span className="text-[6px] font-black uppercase tracking-[0.2em] text-zinc-700">Empty</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cash Consideration Indicator */}
          <div className="bg-black/60 border border-zinc-900/50 p-3 rounded-2xl flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                <Coins size={15} />
              </div>
              <div>
                <p className="text-[6.5px] font-black text-zinc-650 uppercase tracking-widest italic leading-none mb-0.5">Offered Cash</p>
                <div className="flex items-center gap-1">
                  <span className={`text-base font-mono font-black italic tracking-tighter ${theirOffer.coins > 0 ? 'text-amber-400' : 'text-zinc-700'}`}>
                    {theirOffer.coins.toLocaleString()}
                  </span>
                  <span className="text-[8px] font-black text-zinc-600">COINS</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM/RIGHT CELL: Your Offer */}
        <section className="relative rounded-3xl border border-zinc-900/80 bg-zinc-950/40 backdrop-blur-xl p-3.5 flex flex-col justify-between min-h-0 h-full overflow-hidden group/me">
          {/* Subtle static pulse */}
          <div className="absolute inset-0 bg-gradient-to-bl from-purple-950/10 via-transparent to-transparent pointer-events-none" />
          
          {/* My Info Panel */}
          <div className="flex items-center justify-between border-b border-zinc-900/50 pb-2.5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl flex items-center justify-center border border-purple-500/20 shadow-lg overflow-hidden shrink-0">
                  <Zap size={16} className="text-white fill-current" />
                </div>
                {myOffer.ready && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center border-2 border-black shadow-[0_0_8px_rgba(168,85,247,0.6)] z-20">
                    <Check size={8} className="text-white stroke-[4px]" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-base font-black italic uppercase tracking-tighter text-white leading-none mb-0.5">Your Proposal</h3>
                <p className="text-[7px] text-zinc-550 uppercase font-black tracking-widest italic">Asset Management</p>
              </div>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={toggleReady}
              disabled={myOffer.cards.length === 0 && myOffer.coins === 0}
              className={`px-4 py-1.5 rounded-full border transition-all duration-300 font-black uppercase tracking-[0.2em] italic text-[8.5px] disabled:opacity-20 shadow-md ${
                myOffer.ready 
                  ? 'bg-purple-605 border-purple-400 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)] bg-purple-650' 
                  : 'bg-zinc-900/85 border-zinc-800 text-zinc-500 hover:text-white'
              }`}
            >
              {myOffer.ready ? 'UNSET LOCK' : 'LOCK OFFER'}
            </motion.button>
          </div>

          {/* Cards & Items Space */}
          <div className="flex-1 min-h-0 flex flex-col justify-center py-2.5">
            <div className="grid grid-cols-3 gap-2.5 max-w-md mx-auto w-full">
              {offerCards.map((card, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="aspect-[2.5/3.2] relative rounded-2xl overflow-hidden border bg-zinc-950 flex flex-col justify-between p-2 group/bento shadow-lg"
                  style={{ borderColor: `${RARITY_COLORS[card.rarity] || '#ffffff'}30` }}
                >
                  <div className="absolute inset-0 opacity-10 bg-gradient-to-t from-black to-zinc-900 pointer-events-none" />
                  
                  {/* Top indicators */}
                  <div className="flex justify-between items-center relative z-10 w-full">
                    <span className="text-[9px] font-mono font-black text-amber-500 leading-none bg-black/80 px-1 py-0.5 rounded border border-white/5">{card.stats.ovr}</span>
                    <button 
                      onClick={() => removeCardFromOffer(i)}
                      className="w-4 h-4 bg-red-650 text-white hover:bg-red-500 rounded-full flex items-center justify-center shrink-0 shadow-lg border border-red-550/20"
                    >
                      <X size={10} strokeWidth={4} />
                    </button>
                  </div>

                  {/* Character image */}
                  <div className="flex-1 w-full flex items-center justify-center relative overflow-hidden my-1">
                    {card.imageUrl ? (
                      <img 
                        src={card.imageUrl} 
                        className="h-[110%] object-contain select-none pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]" 
                        referrerPolicy="no-referrer" 
                        alt={card.name} 
                      />
                    ) : (
                      <span className="text-lg">🏀</span>
                    )}
                  </div>

                  {/* Name footer */}
                  <div className="relative z-10 bg-black/80 py-0.5 rounded text-center w-full">
                    <span className="text-[7px] font-black text-white truncate block uppercase tracking-tight">{card.name.split(' ').pop()}</span>
                  </div>
                </motion.div>
              ))}
              {offerCards.length < 3 && (
                <motion.button 
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(168,85,247,0.03)', borderColor: 'rgba(168,85,247,0.3)' }}
                  onClick={() => setShowDuplicatePicker(true)}
                  className="aspect-[2.5/3.2] border border-dashed border-zinc-850 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all text-zinc-700 hover:text-purple-400 group relative overflow-hidden bg-zinc-900/10"
                >
                  <div className="w-6 h-6 rounded-full border border-zinc-800 flex items-center justify-center group-hover:border-purple-500/30 group-hover:scale-105 transition-all bg-black/40">
                    <RefreshCw size={12} className="group-hover:rotate-45 transition-transform" />
                  </div>
                  <span className="text-[6.5px] font-black uppercase tracking-[0.25em] font-mono italic">Add Card</span>
                </motion.button>
              )}
            </div>
          </div>

          {/* Cash input & consideration panel (Optimized horizontal row) */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-black/55 border border-zinc-900/50 px-3 py-1.5 rounded-2xl flex items-center justify-between gap-3 focus-within:border-purple-500/45 transition-all">
              <div className="flex items-center gap-2">
                <Coins size={14} className="text-amber-500" />
                <div className="flex flex-col">
                  <span className="text-[5.5px] font-black text-zinc-600 uppercase tracking-widest leading-none">Coins Cash</span>
                  <input 
                    type="number"
                    value={myOffer.coins === 0 ? '' : myOffer.coins}
                    onChange={(e) => setCoinsOffer(parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="bg-transparent border-none outline-none text-sm font-mono font-black italic text-amber-400 placeholder:text-zinc-800 leading-none h-4 mt-0.5 w-20 p-0"
                  />
                </div>
              </div>
              <div className="text-right">
                <span className="text-[5.5px] font-black text-zinc-650 uppercase block leading-none">Available</span>
                <span className="text-[8.5px] font-mono font-black text-zinc-500 leading-none block mt-0.5 tabular-nums">{myTotalCoins.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Confirmation Section (Footer - highly flattened) */}
      <footer className="p-4 bg-zinc-950 border-t border-zinc-900 shrink-0 z-30 relative overflow-hidden backdrop-blur-3xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
        
        {myOffer.ready && theirOffer.ready ? (
          <motion.button
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={acceptTrade}
            className="w-full py-3.5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.25em] italic text-xs flex items-center justify-center gap-4 shadow-[0_0_40px_rgba(168,85,247,0.2)] relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <ShieldCheck size={18} className="text-purple-600 animate-pulse" />
            <span>Sign & Execute Trade Deal</span>
            <ArrowRight size={15} className="group-hover:translate-x-1.5 transition-transform" />
          </motion.button>
        ) : (
          <div className="flex flex-col items-center gap-2">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <p className="text-[8px] font-black uppercase tracking-[0.25em] text-zinc-550 italic">
                  {!myOffer.ready && !theirOffer.ready 
                    ? 'Negotiation stage Active' 
                    : !myOffer.ready 
                      ? 'Awaiting Your Lock signature' 
                      : 'Waiting for remote endorsement'}
                </p>
             </div>
             
             <div className="w-full max-w-[240px] h-1 bg-zinc-900 rounded-full overflow-hidden flex shadow-inner">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: (myOffer.ready ? 50 : 0) + '%' }}
                   transition={{ type: 'spring', damping: 25 }}
                   className="h-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                />
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: (theirOffer.ready ? 50 : 0) + '%' }}
                   transition={{ type: 'spring', damping: 25 }}
                   className="h-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                />
             </div>
          </div>
        )}
      </footer>

      {/* Duplicate Picker Modal */}
      <AnimatePresence>
        {showDuplicatePicker && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-md flex flex-col"
          >
            <header className="px-6 py-8 flex items-center justify-between border-b border-zinc-900">
              <div>
                 <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Select Duplicates</h2>
                 <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Found {duplicateCards.length} Tradables</p>
              </div>
              <button onClick={() => setShowDuplicatePicker(false)} className="p-3 bg-zinc-900 rounded-2xl text-white">
                <X size={20} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4 no-scrollbar">
              {duplicateCards.map((card) => {
                const count = collection[card.id] || 0;
                const tradableCount = count - 1;
                const selectedCount = myOffer.cards.filter(id => id === card.id).length;
                
                return (
                  <motion.div 
                    key={card.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (selectedCount >= tradableCount) return;
                      addCardToOffer(card.id);
                      if (myOffer.cards.length + 1 >= 3) setShowDuplicatePicker(false);
                    }}
                    className={`relative group ${selectedCount >= tradableCount ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <CardItem card={card} isOwned={true} mode="mini" />
                    <div className="absolute -top-1 -right-1 bg-amber-500 px-2 py-0.5 rounded-lg border border-black shadow-lg">
                      <span className="text-[8px] font-black text-white italic">x{tradableCount - selectedCount}</span>
                    </div>
                  </motion.div>
                );
              })}

              {duplicateCards.length === 0 && (
                <div className="col-span-full h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4 py-20">
                   <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center">
                      <RefreshCw size={32} className="text-zinc-700" />
                   </div>
                   <p className="text-xs font-black uppercase tracking-widest text-zinc-500 max-w-[200px]">
                      You don't have any duplicate cards to trade yet.
                   </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TradingRoom;
