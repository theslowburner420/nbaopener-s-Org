import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../../context/GameContext';
import { useNotification } from '../../context/NotificationContext';
import { ALL_CARDS } from '../../data/cards';
import { Card } from '../../types';
import CardItem from '../CardItem';
import { getCardMarketValue, formatCoinCompact } from '../../utils/marketCalculations';
import { marketAudio } from '../../utils/marketAudio';
import { 
  Coins, 
  Flame, 
  RefreshCw, 
  Zap, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Layers, 
  Plus,
  Search
} from 'lucide-react';

interface CoinflipProps {
  onBackToHub?: () => void;
}

type BetSide = 'heads' | 'tails';
type BetMode = 'card' | 'coins';

export const Coinflip: React.FC<CoinflipProps> = ({ onBackToHub }) => {
  const { coins, collection, addCoins, addToCollection, removeFromCollection } = useGame();
  const { notifySuccess, notifyError } = useNotification();

  // Mode: Wager a Card (Default) or Coins
  const [betMode, setBetMode] = useState<BetMode>('card');
  const [coinAmount, setCoinAmount] = useState<number>(25000);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [chosenSide, setChosenSide] = useState<BetSide>('heads');
  const [fastMode, setFastMode] = useState<boolean>(false);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);

  // Card Picker Modal
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [pickerSearch, setPickerSearch] = useState<string>('');
  const [pickerFilter, setPickerFilter] = useState<'all' | 'duplicates' | 'high_ovr'>('all');

  // Game execution state
  const [gameState, setGameState] = useState<'idle' | 'flipping' | 'result'>('idle');
  const [flipRotation, setFlipRotation] = useState<number>(0);
  const [winningSide, setWinningSide] = useState<BetSide | null>(null);
  const [isWinner, setIsWinner] = useState<boolean | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [serverSeed, setServerSeed] = useState<string>(() => 
    '0x' + Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  );

  // Extract owned cards from collection
  const ownedCards = useMemo(() => {
    const list: { card: Card; quantity: number }[] = [];
    ALL_CARDS.forEach(card => {
      const qty = collection[card.id] || 0;
      if (qty > 0) {
        list.push({ card, quantity: qty });
      }
    });
    return list.sort((a, b) => {
      if (b.quantity > 1 && a.quantity <= 1) return 1;
      if (a.quantity > 1 && b.quantity <= 1) return -1;
      return b.card.stats.ovr - a.card.stats.ovr;
    });
  }, [collection]);

  // Filtered Cards in Picker
  const filteredPickerCards = useMemo(() => {
    return ownedCards.filter(({ card, quantity }) => {
      if (pickerFilter === 'duplicates' && quantity <= 1) return false;
      if (pickerFilter === 'high_ovr' && card.stats.ovr < 85) return false;
      if (pickerSearch.trim()) {
        const query = pickerSearch.toLowerCase();
        return card.name.toLowerCase().includes(query) ||
               card.team.toLowerCase().includes(query) ||
               card.position.toLowerCase().includes(query);
      }
      return true;
    });
  }, [ownedCards, pickerFilter, pickerSearch]);

  // Card Value
  const cardValue = useMemo(() => {
    return selectedCard ? getCardMarketValue(selectedCard) : 0;
  }, [selectedCard]);

  // Current Wager Total & Potential Payout
  const currentWagerValue = betMode === 'coins' ? coinAmount : cardValue;
  const potentialPayout = currentWagerValue * 2;

  // Sound handler
  const playSound = useCallback((type: 'tick' | 'spin' | 'win' | 'loss') => {
    if (isSoundMuted) return;
    if (type === 'tick') marketAudio.playTick();
    if (type === 'spin') marketAudio.playCoinToss();
    if (type === 'win') marketAudio.playWin();
    if (type === 'loss') marketAudio.playLoss();
  }, [isSoundMuted]);

  // Execute 50/50 Cardflip
  const executeFlip = async () => {
    if (gameState === 'flipping') return;

    let stakedCard: Card | null = null;

    if (betMode === 'coins') {
      if (coinAmount > coins || coinAmount <= 0) {
        notifyError('Insufficient coins.');
        return;
      }
      addCoins(-coinAmount);
    } else {
      if (!selectedCard) {
        notifyError('Select a card to wager.');
        return;
      }
      const qty = collection[selectedCard.id] || 0;
      if (qty <= 0) {
        notifyError('Card no longer in inventory.');
        setSelectedCard(null);
        return;
      }
      stakedCard = selectedCard;
      // Remove card immediately from collection
      await removeFromCollection([selectedCard.id]);
    }

    setGameState('flipping');
    setIsWinner(null);
    setWinningSide(null);
    playSound('spin');

    // 50/50 Provably Fair RNG
    const outcome: BetSide = Math.random() < 0.5 ? 'heads' : 'tails';
    const won = outcome === chosenSide;

    // Flip physics calculations
    const duration = fastMode ? 700 : 1600;
    const spins = fastMode ? 4 : 8;
    const targetAngle = spins * 360 + (outcome === 'tails' ? 180 : 0);
    const startAngle = flipRotation % 360;
    const startTime = performance.now();
    let lastTick = 0;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3.5);
      const curRot = startAngle + (targetAngle - startAngle) * ease;
      setFlipRotation(curRot);

      if (now - lastTick > (fastMode ? 45 : 70) && progress < 0.9) {
        playSound('tick');
        lastTick = now;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Complete flip
        setWinningSide(outcome);
        setIsWinner(won);
        setGameState('result');
        setServerSeed('0x' + Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));

        if (won) {
          playSound('win');
          setStreak(s => s + 1);

          if (betMode === 'coins') {
            addCoins(potentialPayout);
            notifySuccess(`+🪙 ${formatCoinCompact(potentialPayout)} (2.0X)`);
          } else if (stakedCard) {
            // Player keeps original card + wins 100% of card value in coins
            addToCollection([stakedCard.id]);
            addCoins(cardValue);
            notifySuccess(`Kept ${stakedCard.name} + won 🪙 ${formatCoinCompact(cardValue)}`);
          }
        } else {
          playSound('loss');
          setStreak(0);

          if (stakedCard) {
            // Card is permanently lost!
            notifyError(`Lost ${stakedCard.name} (Landed ${outcome.toUpperCase()})`);
            // Check if player has more copies of this card
            const remainingCopies = (collection[stakedCard.id] || 0) - 1;
            if (remainingCopies <= 0) {
              setSelectedCard(null);
            }
          } else {
            notifyError(`-🪙 ${formatCoinCompact(coinAmount)} (Landed ${outcome.toUpperCase()})`);
          }
        }
      }
    };

    requestAnimationFrame(animate);
  };

  return (
    <div className="h-full w-full max-w-4xl mx-auto flex flex-col justify-between bg-black text-zinc-100 font-sans select-none overflow-hidden p-2 sm:p-4">
      
      {/* 1. MINIMAL HEADER */}
      <div className="shrink-0 bg-zinc-950 border border-zinc-800/80 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-xs">
            <Coins size={14} />
          </div>
          <div>
            <span className="text-xs font-bold text-white tracking-wide block leading-none">CARDFLIP 50/50</span>
            <span className="text-[9px] text-zinc-500 font-mono">Double or Nothing</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Win Streak */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono">
            <Flame size={12} className={streak > 0 ? 'text-amber-400 animate-pulse' : 'text-zinc-600'} />
            <span className="text-zinc-400 text-[10px]">Streak:</span>
            <b className="text-amber-400">{streak}x</b>
          </div>

          {/* Fast Toggle */}
          <button
            onClick={() => setFastMode(!fastMode)}
            className={`px-2 py-1 rounded-lg border text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer ${
              fastMode ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap size={12} />
            <span className="text-[10px]">Fast</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setIsSoundMuted(!isSoundMuted)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isSoundMuted ? 'bg-zinc-900 border-zinc-800 text-zinc-600' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
            }`}
          >
            {isSoundMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>
        </div>
      </div>

      {/* 2. MAIN ARENA: 3D COIN / CARDFLIP */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 py-2">
        
        {/* 3D Coin Graphic */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center [perspective:1000px]">
          <div 
            className="w-32 h-32 sm:w-36 sm:h-36 rounded-full relative [transform-style:preserve-3d] shadow-[0_0_35px_rgba(168,85,247,0.2)]"
            style={{
              transform: `rotateY(${flipRotation}deg)`,
            }}
          >
            {/* HEADS SIDE */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 border-4 border-amber-200 flex flex-col items-center justify-center [backface-visibility:hidden] shadow-2xl">
              <span className="text-3xl sm:text-4xl">🏆</span>
              <span className="text-xs font-black font-mono text-black mt-1 tracking-wider">HEADS</span>
            </div>

            {/* TAILS SIDE */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-400 via-purple-600 to-indigo-800 border-4 border-purple-200 flex flex-col items-center justify-center [backface-visibility:hidden] [transform:rotateY(180deg)] shadow-2xl">
              <span className="text-3xl sm:text-4xl">💎</span>
              <span className="text-xs font-black font-mono text-white mt-1 tracking-wider">TAILS</span>
            </div>
          </div>
        </div>

        {/* Dynamic Status / Result */}
        <div className="mt-3 min-h-[26px] flex items-center justify-center">
          {gameState === 'flipping' ? (
            <span className="text-[11px] font-mono font-bold text-amber-400 animate-pulse flex items-center gap-1.5">
              <RefreshCw size={12} className="animate-spin" /> FLIPPING...
            </span>
          ) : gameState === 'result' ? (
            <motion.span
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-[11px] font-mono font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-lg ${
                isWinner 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              {isWinner ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
              {isWinner ? `WINNER (${winningSide?.toUpperCase()})` : `DEFEAT (${winningSide?.toUpperCase()})`}
            </motion.span>
          ) : (
            <span className="text-[9px] font-mono text-zinc-600">
              Fair Seed: {serverSeed}
            </span>
          )}
        </div>

        {/* Side Selectors: HEADS vs TAILS */}
        <div className="flex items-center gap-3 mt-3 w-full max-w-sm">
          <button
            onClick={() => gameState !== 'flipping' && setChosenSide('heads')}
            disabled={gameState === 'flipping'}
            className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-mono transition-all cursor-pointer ${
              chosenSide === 'heads'
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/30'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>🏆</span>
            <span className="text-xs font-bold">HEADS (50%)</span>
          </button>

          <button
            onClick={() => gameState !== 'flipping' && setChosenSide('tails')}
            disabled={gameState === 'flipping'}
            className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-mono transition-all cursor-pointer ${
              chosenSide === 'tails'
                ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-md ring-1 ring-purple-400/30'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>💎</span>
            <span className="text-xs font-bold">TAILS (50%)</span>
          </button>
        </div>

      </div>

      {/* 3. WAGER CONFIGURATION & ACTION BAR */}
      <div className="shrink-0 bg-zinc-950 border border-zinc-800/90 rounded-2xl p-3 space-y-2.5">
        
        {/* Bet Mode Selector */}
        <div className="flex items-center justify-between gap-2 border-b border-zinc-900 pb-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => gameState !== 'flipping' && setBetMode('card')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                betMode === 'card' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              🃏 Stake Card
            </button>
            <button
              onClick={() => gameState !== 'flipping' && setBetMode('coins')}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                betMode === 'coins' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              🪙 Coins
            </button>
          </div>

          <div className="text-[11px] font-mono text-zinc-400">
            Payout: <b className="text-emerald-400">2.0X (🪙 {formatCoinCompact(potentialPayout)})</b>
          </div>
        </div>

        {/* Stake Slot / Input */}
        {betMode === 'card' ? (
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-zinc-900/70 border border-zinc-800">
            {selectedCard ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-11 rounded-lg bg-zinc-800 border border-zinc-700 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-amber-400 leading-none">{selectedCard.stats.ovr}</span>
                  <span className="text-[7px] text-zinc-400 font-mono">OVR</span>
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white truncate max-w-[170px]">{selectedCard.name}</div>
                  <div className="text-[10px] font-mono text-emerald-400 font-bold">🪙 {formatCoinCompact(cardValue)}</div>
                </div>
              </div>
            ) : (
              <span className="text-xs text-zinc-500 font-mono ml-2">No card selected</span>
            )}

            <button
              onClick={() => gameState !== 'flipping' && setIsPickerOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono font-bold text-white transition-colors cursor-pointer"
            >
              {selectedCard ? 'Change Card' : 'Pick Card +'}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {[10000, 25000, 50000, 100000].map((amt) => (
              <button
                key={amt}
                onClick={() => gameState !== 'flipping' && setCoinAmount(amt)}
                className={`flex-1 py-1.5 px-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer ${
                  coinAmount === amt
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {formatCoinCompact(amt)}
              </button>
            ))}
            <button
              onClick={() => gameState !== 'flipping' && setCoinAmount(Math.max(1000, Math.floor(coins / 2)))}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 hover:text-white cursor-pointer"
            >
              ½
            </button>
            <button
              onClick={() => gameState !== 'flipping' && setCoinAmount(coins)}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-amber-400 hover:text-amber-300 cursor-pointer"
            >
              MAX
            </button>
          </div>
        )}

        {/* Primary Action Button */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            onClick={executeFlip}
            disabled={gameState === 'flipping' || (betMode === 'card' && !selectedCard) || (betMode === 'coins' && coinAmount > coins)}
            className={`flex-1 py-3 rounded-xl text-xs font-black font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              gameState === 'flipping'
                ? 'bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed'
                : (betMode === 'card' && !selectedCard)
                ? 'bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:opacity-95 active:scale-[0.99] shadow-[0_0_20px_rgba(168,85,247,0.3)] cursor-pointer'
            }`}
          >
            {gameState === 'flipping' ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>FLIPPING...</span>
              </>
            ) : betMode === 'card' && !selectedCard ? (
              <>
                <Layers size={14} />
                <span>SELECT A CARD TO STAKE</span>
              </>
            ) : (
              <>
                <Zap size={14} className="fill-white" />
                <span>FLIP COIN ({chosenSide.toUpperCase()} • 2.0X)</span>
              </>
            )}
          </button>

          {gameState === 'result' && (
            <button
              onClick={executeFlip}
              disabled={(betMode === 'card' && !selectedCard) || (betMode === 'coins' && coinAmount > coins)}
              className="px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Flip again"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Again</span>
            </button>
          )}
        </div>

      </div>

      {/* 4. CARD PICKER MODAL (Spacious grid, no overlap) */}
      <AnimatePresence>
        {isPickerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-3xl h-[85vh] max-h-[650px] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Layers size={16} className="text-purple-400" />
                    <span>Select Card to Stake</span>
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    50% chance to win double or lose the card
                  </p>
                </div>
                <button
                  onClick={() => setIsPickerOpen(false)}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs text-zinc-300 font-bold cursor-pointer"
                >
                  Close ✕
                </button>
              </div>

              {/* Search & Filter */}
              <div className="p-3 border-b border-zinc-800/80 bg-zinc-900/40 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="relative flex-1 min-w-[180px]">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder="Search player, team..."
                    className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-zinc-600 font-sans"
                  />
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPickerFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                      pickerFilter === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    All ({ownedCards.length})
                  </button>
                  <button
                    onClick={() => setPickerFilter('duplicates')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                      pickerFilter === 'duplicates' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Duplicates
                  </button>
                  <button
                    onClick={() => setPickerFilter('high_ovr')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                      pickerFilter === 'high_ovr' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    85+ OVR
                  </button>
                </div>
              </div>

              {/* Grid */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {filteredPickerCards.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                    <Layers size={32} className="mb-2 opacity-40" />
                    <p className="text-xs font-mono">No matching cards found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {filteredPickerCards.map(({ card, quantity }) => {
                      const isCurrent = selectedCard?.id === card.id;
                      const val = getCardMarketValue(card);

                      return (
                        <div
                          key={card.id}
                          onClick={() => {
                            setSelectedCard(card);
                            setIsPickerOpen(false);
                          }}
                          className={`relative rounded-xl border p-2.5 bg-zinc-900/60 hover:bg-zinc-900 cursor-pointer transition-all flex flex-col items-center group ${
                            isCurrent
                              ? 'border-purple-400 ring-2 ring-purple-400/20 bg-purple-500/[0.04]'
                              : 'border-zinc-800 hover:border-zinc-600'
                          }`}
                        >
                          {quantity > 1 && (
                            <div className="absolute top-2 right-2 z-10 px-1.5 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-black font-mono shadow-md">
                              x{quantity}
                            </div>
                          )}

                          <div className="w-28 sm:w-32 pointer-events-none py-1">
                            <CardItem card={card} isOwned={true} mode="mini" quantity={quantity} />
                          </div>

                          <div className="w-full mt-2 pt-1.5 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono">
                            <span className="text-zinc-300 truncate max-w-[60%] font-sans font-medium">{card.name}</span>
                            <span className="text-purple-400 font-bold">🪙{formatCoinCompact(val)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Coinflip;
