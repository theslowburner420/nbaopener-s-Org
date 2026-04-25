import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RefreshCw, ChevronLeft, Coins, Check, ArrowRight, ShieldCheck, AlertTriangle, Users, Loader2, Zap } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { ALL_CARDS } from '../data/cards';
import { Card } from '../types';
import CardItem from './CardItem';
import { supabase } from '../lib/supabase';
import { useNotification } from '../context/NotificationContext';

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
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-6 flex items-center justify-between border-b border-zinc-900 bg-black/60 backdrop-blur-2xl z-20">
        <button 
          onClick={onLeave} 
          className="group flex items-center gap-3 text-zinc-500 hover:text-white transition-all transform hover:-translate-x-1"
        >
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-zinc-700">
            <ChevronLeft size={16} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Abort Exchange</span>
        </button>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">Secure Line</span>
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-500">Live Connection</span>
          </div>
          <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center border border-zinc-800">
            <Users size={18} className="text-zinc-500" />
          </div>
        </div>
      </header>

      {/* Main Trading Area */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row bg-zinc-950/20">
        
        {/* Left Side: Partner's Offer */}
        <section className="flex-1 border-r border-zinc-900 flex flex-col min-h-0 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/10 to-transparent pointer-events-none" />
          
          <div className="p-6 flex items-center justify-between border-b border-zinc-900 bg-zinc-950/50 relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center border border-zinc-700 shadow-xl overflow-hidden">
                  <div className="bg-zinc-700/50 w-full h-full flex items-center justify-center text-zinc-500 text-lg font-black uppercase italic">
                    {partnerUsername[0]}
                  </div>
                </div>
                {theirOffer.ready && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-black shadow-lg">
                    <Check size={12} className="text-black" strokeWidth={4} />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-white leading-none mb-1">{partnerUsername}</h3>
                <p className="text-[8px] text-zinc-500 uppercase font-black tracking-[0.2em] italic">Opposition Proposal</p>
              </div>
            </div>
            <div className={`px-4 py-1.5 rounded-full border transition-all duration-700 ${theirOffer.ready ? 'bg-green-500/10 border-green-500/40 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.1)]' : 'bg-zinc-900 border-zinc-800 text-zinc-700'}`}>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">{theirOffer.ready ? 'OFFER LOCKED' : 'PENDING'}</span>
            </div>
          </div>

          <div className="flex-1 p-6 sm:p-8 overflow-y-auto no-scrollbar space-y-8 relative z-10">
            <div className="grid grid-cols-3 gap-4">
              {partnerCards.map((card, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="aspect-[2.5/3.5] relative rounded-[1.5rem] overflow-hidden border border-zinc-800 bg-zinc-900/40 shadow-2xl ring-1 ring-white/5"
                >
                   <div className="scale-[0.9] origin-center h-full">
                     <CardItem card={card} isOwned={true} mode="mini" />
                   </div>
                </motion.div>
              ))}
              {Array.from({length: 3 - partnerCards.length}).map((_, i) => (
                <div key={i} className="aspect-[2.5/3.5] border border-dashed border-zinc-900 rounded-[1.5rem] flex flex-col items-center justify-center opacity-10 bg-white/5">
                  <div className="w-8 h-8 rounded-full border-2 border-zinc-800 flex items-center justify-center mb-2">
                    <span className="text-[8px] font-black text-zinc-800">{i + 1 + partnerCards.length}</span>
                  </div>
                  <span className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-800">Slot</span>
                </div>
              ))}
            </div>

            <div className="bg-black/80 border border-zinc-900 p-5 rounded-[1.5rem] flex items-center justify-between shadow-inner backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                  <Coins size={20} />
                </div>
                <div>
                   <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest italic leading-none mb-1">Cash Consideration</p>
                   <span className={`text-2xl font-mono font-black italic tracking-tighter ${theirOffer.coins > 0 ? 'text-white' : 'text-zinc-800'}`}>
                    {theirOffer.coins.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Central Vertical Connector */}
        <div className="relative group shrink-0 lg:w-px lg:h-full h-[2px] w-full bg-zinc-900/50 flex items-center justify-center">
          <div className="absolute z-20 w-12 h-12 bg-black border border-zinc-800 rounded-2xl flex items-center justify-center rotate-45 shadow-[0_0_50px_rgba(0,0,0,1)] ring-1 ring-white/5 overflow-hidden">
             <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
             <RefreshCw size={20} className={`text-zinc-600 -rotate-45 relative z-10 transition-transform duration-700 ${isExecuting ? 'animate-spin' : 'group-hover:rotate-180'}`} />
          </div>
        </div>

        {/* Right Side: My Offer */}
        <section className="flex-1 flex flex-col min-h-0 relative">
          <div className="absolute inset-0 bg-gradient-to-bl from-purple-500/5 to-transparent pointer-events-none" />
          
          <div className="p-6 flex items-center justify-between border-b border-zinc-900 bg-zinc-950/50 relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(168,85,247,0.3)] border border-purple-500/30 overflow-hidden">
                  <Zap size={22} className="text-white fill-current" />
                </div>
                {myOffer.ready && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center border-2 border-black shadow-lg z-20">
                    <Check size={12} className="text-white" strokeWidth={4} />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-white leading-none mb-1">Your Proposal</h3>
                <p className="text-[8px] text-zinc-500 uppercase font-black tracking-[0.2em] italic">Manage Assets</p>
              </div>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleReady}
              disabled={myOffer.cards.length === 0 && myOffer.coins === 0}
              className={`px-5 py-2 rounded-full border transition-all duration-700 font-black uppercase tracking-[0.2em] italic text-[9px] active:scale-95 disabled:opacity-20 shadow-xl ${
                myOffer.ready 
                  ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.2)]' 
                  : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-white'
              }`}
            >
              {myOffer.ready ? 'UNSET OFFER' : 'LOCK PROPOSAL'}
            </motion.button>
          </div>

          <div className="flex-1 p-6 sm:p-8 overflow-y-auto no-scrollbar space-y-8 relative z-10">
            <div className="grid grid-cols-3 gap-4">
              {offerCards.map((card, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5 }}
                  className="aspect-[2.5/3.5] relative group rounded-[1.5rem] overflow-hidden border border-purple-500/30 bg-purple-500/5 shadow-2xl ring-1 ring-purple-500/20"
                >
                  <div className="scale-[0.9] origin-center h-full">
                    <CardItem card={card} isOwned={true} mode="mini" />
                  </div>
                  <button 
                    onClick={() => removeCardFromOffer(i)}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100 shadow-2xl z-20 hover:bg-red-500"
                  >
                    <X size={14} strokeWidth={4} />
                  </button>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-purple-500/5" />
                </motion.div>
              ))}
              {offerCards.length < 3 && (
                <motion.button 
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(168,85,247,0.05)', borderColor: 'rgba(168,85,247,0.4)' }}
                  onClick={() => setShowDuplicatePicker(true)}
                  className="aspect-[2.5/3.5] border border-dashed border-zinc-800 rounded-[1.5rem] flex flex-col items-center justify-center gap-3 transition-all text-zinc-700 hover:text-purple-400 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center group-hover:border-purple-500/30 group-hover:scale-110 transition-all">
                    <RefreshCw size={18} className="group-hover:rotate-45 transition-transform" />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-[0.3em] font-mono italic">Add Card</span>
                </motion.button>
              )}
            </div>

            <div className="space-y-2">
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-[1.5rem] flex items-center gap-5 focus-within:border-purple-500/50 transition-all focus-within:shadow-[0_0_30px_rgba(168,85,247,0.1)] group">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 shadow-lg group-focus-within:scale-110 transition-all">
                  <Coins size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest italic leading-none mb-1">Add Cash Offer</p>
                  <input 
                    type="number"
                    value={myOffer.coins === 0 ? '' : myOffer.coins}
                    onChange={(e) => setCoinsOffer(parseInt(e.target.value) || 0)}
                    placeholder="000,000"
                    className="w-full bg-transparent border-none outline-none text-2xl font-mono font-black italic text-white placeholder:text-zinc-800 tracking-tighter"
                  />
                </div>
              </div>
              <div className="px-4 flex justify-between items-center text-[8px] font-bold text-zinc-600 uppercase tracking-[0.2em] italic">
                <span>Available Funds</span>
                <span className="text-zinc-500 tabular-nums">{myTotalCoins.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Confirmation Section (Footer) */}
      <footer className="p-6 bg-zinc-950 border-t border-zinc-900 shrink-0 z-30 relative overflow-hidden backdrop-blur-3xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
        
        {myOffer.ready && theirOffer.ready ? (
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={acceptTrade}
            className="w-full py-6 bg-white text-black rounded-[2rem] font-black uppercase tracking-[0.3em] italic text-sm flex items-center justify-center gap-6 shadow-[0_0_60px_rgba(168,85,247,0.25)] relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <ShieldCheck size={24} className="text-purple-600 group-hover:rotate-12 transition-transform" />
            <span className="relative z-10">Sign & Execute Agreement</span>
            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          </motion.button>
        ) : (
          <div className="flex flex-col items-center gap-4 py-2">
             <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${(!myOffer.ready || !theirOffer.ready) ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">
                  {!myOffer.ready && !theirOffer.ready 
                    ? 'Negotiation in Progress' 
                    : !myOffer.ready 
                      ? 'Action Required: Your Authorization' 
                      : 'Waiting for Partner Response'}
                </p>
             </div>
             <div className="w-full max-w-[280px] h-1.5 bg-zinc-900 rounded-full overflow-hidden flex shadow-inner">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: (myOffer.ready ? 50 : 0) + '%' }}
                   transition={{ type: 'spring', damping: 20 }}
                   className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                />
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: (theirOffer.ready ? 50 : 0) + '%' }}
                   transition={{ type: 'spring', damping: 20 }}
                   className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                />
             </div>
             <p className="text-[7px] font-bold text-zinc-700 uppercase tracking-widest italic">Both parties must lock before execution</p>
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
