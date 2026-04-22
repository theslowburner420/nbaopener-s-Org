import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, RefreshCw, ChevronLeft, Coins, Check, ArrowRight, ShieldCheck, AlertTriangle, Users, Loader2 } from 'lucide-react';
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
      <div className="h-full w-full flex flex-col items-center justify-center bg-black gap-6">
        <div className="relative">
          <RefreshCw size={64} className="text-purple-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
             <Check size={24} className="text-white" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Finalizing Deal</h2>
          <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Updating cloud profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-black overflow-hidden select-none">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-zinc-900 bg-black/60 backdrop-blur-xl z-20">
        <button onClick={onLeave} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors">
          <ChevronLeft size={20} />
          <span className="text-[10px] font-black uppercase tracking-widest">Abandon Room</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-zinc-900 rounded-full flex items-center gap-2 border border-zinc-800">
            <Users size={12} className="text-purple-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Live Trade Session</span>
          </div>
        </div>
      </header>

      {/* Main Trading Area */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row bg-zinc-950/50">
        
        {/* Left Side: Partner's Offer */}
        <section className="flex-1 border-r border-zinc-900 flex flex-col min-h-0">
          <div className="p-4 bg-zinc-900/20 flex items-center justify-between border-b border-zinc-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700">
                <span className="text-zinc-600 font-black text-xs uppercase">?</span>
              </div>
              <div>
                <h3 className="text-sm font-black italic uppercase tracking-tighter text-white leading-none">{partnerUsername}</h3>
                <p className="text-[7px] text-zinc-600 uppercase font-black tracking-widest mt-1">Their Proposal</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-md border transition-all duration-500 ${theirOffer.ready ? 'bg-green-500/10 border-green-500/50 text-green-500' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}>
              <span className="text-[9px] font-black uppercase tracking-widest italic">{theirOffer.ready ? 'LOCKED' : 'PENDING'}</span>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto no-scrollbar space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {partnerCards.map((card, i) => (
                <div key={i} className="aspect-[2.5/3.5] relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900/50">
                   <div className="scale-[0.85] origin-center h-full">
                     <CardItem card={card} isOwned={true} mode="mini" />
                   </div>
                </div>
              ))}
              {partnerCards.length === 0 && Array.from({length: 3}).map((_, i) => (
                <div key={i} className="aspect-[2.5/3.5] border border-dashed border-zinc-900 rounded-xl flex items-center justify-center opacity-20">
                  <span className="text-[7px] font-black uppercase tracking-widest">SLOT {i+1}</span>
                </div>
              ))}
            </div>

            <div className="bg-black/60 border border-zinc-900 p-3 rounded-xl flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Coins size={14} />
              </div>
              <span className={`text-sm font-mono font-black ${theirOffer.coins > 0 ? 'text-white' : 'text-zinc-800'}`}>
                {theirOffer.coins.toLocaleString()}
              </span>
            </div>
          </div>
        </section>

        {/* Central Vertical Connector (Desktop) / Horizontal (Mobile) */}
        <div className="relative group shrink-0 lg:w-px lg:h-full h-px w-full bg-zinc-900 flex items-center justify-center">
          <div className="absolute z-20 w-8 h-8 bg-black border border-zinc-800 rounded-lg flex items-center justify-center rotate-45 shadow-xl">
             <RefreshCw size={14} className={`text-zinc-500 -rotate-45 ${isExecuting ? 'animate-spin' : ''}`} />
          </div>
        </div>

        {/* Right Side: My Offer */}
        <section className="flex-1 flex flex-col min-h-0 bg-black/20">
          <div className="p-4 bg-zinc-900/20 flex items-center justify-between border-b border-zinc-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg border border-purple-500/50">
                <RefreshCw size={14} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black italic uppercase tracking-tighter text-white leading-none">Your Offer</h3>
                <p className="text-[7px] text-zinc-600 uppercase font-black tracking-widest mt-1">Select Duplicates</p>
              </div>
            </div>
            
            <button 
              onClick={toggleReady}
              disabled={myOffer.cards.length === 0 && myOffer.coins === 0}
              className={`px-4 py-1 rounded-md border transition-all duration-500 font-black uppercase tracking-widest text-[9px] active:scale-95 disabled:opacity-20 ${
                myOffer.ready 
                  ? 'bg-purple-600 border-purple-500 text-white' 
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
              }`}
            >
              {myOffer.ready ? 'LOCKED' : 'READY TO LOCK'}
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto no-scrollbar space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {offerCards.map((card, i) => (
                <div key={i} className="aspect-[2.5/3.5] relative group rounded-xl overflow-hidden border border-purple-500/20 bg-purple-500/5">
                  <div className="scale-[0.85] origin-center h-full">
                    <CardItem card={card} isOwned={true} mode="mini" />
                  </div>
                  <button 
                    onClick={() => removeCardFromOffer(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <X size={10} strokeWidth={3} />
                  </button>
                </div>
              ))}
              {offerCards.length < 3 && (
                <button 
                  onClick={() => setShowDuplicatePicker(true)}
                  className="aspect-[2.5/3.5] border border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-zinc-700 hover:text-purple-500"
                >
                  <RefreshCw size={14} />
                  <span className="text-[6px] font-black uppercase tracking-widest">ADD CARD</span>
                </button>
              )}
            </div>

            <div className="space-y-1">
              <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex items-center gap-3 focus-within:border-purple-500/50 transition-colors">
                <div className="w-6 h-6 rounded bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Coins size={14} />
                </div>
                <input 
                  type="number"
                  value={myOffer.coins === 0 ? '' : myOffer.coins}
                  onChange={(e) => setCoinsOffer(parseInt(e.target.value) || 0)}
                  placeholder="Offer coins..."
                  className="flex-1 bg-transparent border-none outline-none text-sm font-mono font-black text-white placeholder:text-zinc-800"
                />
              </div>
              <div className="px-2 flex justify-between items-center text-[7px] font-bold text-zinc-600 uppercase tracking-widest">
                <span>Your Balance</span>
                <span className="text-zinc-500">{myTotalCoins.toLocaleString()} Coins</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Confirmation Section (Footer) */}
      <footer className="p-4 bg-black border-t border-zinc-900 shrink-0 z-30 flex flex-col gap-3">
        {myOffer.ready && theirOffer.ready ? (
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            onClick={acceptTrade}
            className="w-full py-4 bg-white text-black rounded-xl font-black uppercase tracking-[0.2em] italic text-xs hover:bg-purple-500 hover:text-white transition-all shadow-[0_0_50px_rgba(168,85,247,0.2)] active:scale-95 flex items-center justify-center gap-4"
          >
            <ShieldCheck size={18} />
            EXPLICIT CONFIRMATION: COMPLETE TRADE
            <ArrowRight size={18} />
          </motion.button>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
             <div className="flex items-center gap-2 opacity-60">
                <AlertTriangle size={12} className="text-amber-500" />
                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">
                  {!myOffer.ready && !theirOffer.ready ? 'Waiting for both players' : !myOffer.ready ? 'Waiting for you to lock' : 'Waiting for partner to lock'}
                </p>
             </div>
             <div className="w-full max-w-xs h-1 bg-zinc-900 rounded-full overflow-hidden flex">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: (myOffer.ready ? 50 : 0) + '%' }}
                   className="h-full bg-purple-500"
                />
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: (theirOffer.ready ? 50 : 0) + '%' }}
                   className="h-full bg-amber-500"
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
