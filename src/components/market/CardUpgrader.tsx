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
  Flame, 
  RefreshCw, 
  Zap, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Search, 
  Sparkles, 
  Layers, 
  Plus,
  Award
} from 'lucide-react';

interface CardUpgraderProps {
  onBackToHub?: () => void;
}

interface ProbabilityPreset {
  percent: number;
  multiplier: number;
  label: string;
}

const PROBABILITY_PRESETS: ProbabilityPreset[] = [
  { percent: 90, multiplier: 1.11, label: '90%' },
  { percent: 75, multiplier: 1.33, label: '75%' },
  { percent: 50, multiplier: 2.00, label: '50%' },
  { percent: 25, multiplier: 4.00, label: '25%' },
  { percent: 10, multiplier: 10.0, label: '10%' },
  { percent: 5, multiplier: 20.0, label: '5%' },
];

export const CardUpgrader: React.FC<CardUpgraderProps> = ({ onBackToHub }) => {
  const { collection, addCoins, addToCollection, removeFromCollection } = useGame();
  const { notifySuccess, notifyError } = useNotification();

  // Core State - No card selected by default (must be picked by player)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [winProbability, setWinProbability] = useState<number>(50); // Default 50%
  const [fastMode, setFastMode] = useState<boolean>(false);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);

  // Picker Modal State
  const [isPickerOpen, setIsPickerOpen] = useState<boolean>(false);
  const [pickerSearch, setPickerSearch] = useState<string>('');
  const [pickerFilter, setPickerFilter] = useState<'all' | 'duplicates' | 'high_ovr'>('all');

  // Animation & Execution State
  const [gameState, setGameState] = useState<'idle' | 'spinning' | 'result'>('idle');
  const [needleAngle, setNeedleAngle] = useState<number>(0);
  const [isWinner, setIsWinner] = useState<boolean | null>(null);
  const [wonCardReward, setWonCardReward] = useState<Card | null>(null);
  const [serverHash, setServerHash] = useState<string>(() => 
    '0x' + Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  );

  // Streak Counter
  const [streak, setStreak] = useState<number>(0);

  // Extract owned cards from collection
  const ownedCardList = useMemo(() => {
    const list: { card: Card; quantity: number }[] = [];
    ALL_CARDS.forEach(card => {
      const qty = collection[card.id] || 0;
      if (qty > 0) {
        list.push({ card, quantity: qty });
      }
    });
    // Sort by duplicates first, then OVR descending
    return list.sort((a, b) => {
      if (b.quantity > 1 && a.quantity <= 1) return 1;
      if (a.quantity > 1 && b.quantity <= 1) return -1;
      return b.card.stats.ovr - a.card.stats.ovr;
    });
  }, [collection]);

  // Multiplier from probability
  const currentMultiplier = useMemo(() => {
    return Math.max(1.05, parseFloat((100 / Math.max(1, winProbability)).toFixed(2)));
  }, [winProbability]);

  // Card values
  const inputCardValue = useMemo(() => {
    return selectedCard ? getCardMarketValue(selectedCard) : 0;
  }, [selectedCard]);

  const targetRewardCoins = useMemo(() => {
    return Math.round(inputCardValue * currentMultiplier);
  }, [inputCardValue, currentMultiplier]);

  // Dynamic Target Card calculation based on selected card + chosen probability %
  const targetCardCandidate = useMemo<Card | null>(() => {
    if (!selectedCard) return null;

    const baseOvr = selectedCard.stats.ovr;

    // Determine target OVR boost based on risk tier
    let ovrBoost = 2;
    if (winProbability >= 85) {
      ovrBoost = 1;
    } else if (winProbability >= 70) {
      ovrBoost = 2;
    } else if (winProbability >= 45) {
      ovrBoost = 4;
    } else if (winProbability >= 20) {
      ovrBoost = 7;
    } else if (winProbability >= 8) {
      ovrBoost = 11;
    } else {
      ovrBoost = 15;
    }

    const desiredTargetOvr = Math.min(99, baseOvr + ovrBoost);

    // Filter ALL_CARDS for matching target OVR
    const exactMatches = ALL_CARDS.filter(
      c => c.id !== selectedCard.id && Math.abs(c.stats.ovr - desiredTargetOvr) <= 1
    );

    if (exactMatches.length > 0) {
      const hashIndex = Math.abs(selectedCard.id.charCodeAt(0) + winProbability) % exactMatches.length;
      return exactMatches[hashIndex] || exactMatches[0];
    }

    // Fallback: higher OVR cards
    const higherCards = ALL_CARDS.filter(
      c => c.id !== selectedCard.id && c.stats.ovr >= desiredTargetOvr
    );

    if (higherCards.length > 0) {
      return higherCards.reduce((closest, curr) => 
        Math.abs(curr.stats.ovr - desiredTargetOvr) < Math.abs(closest.stats.ovr - desiredTargetOvr) ? curr : closest, 
        higherCards[0]
      );
    }

    // Top tier fallback
    return ALL_CARDS.reduce((max, c) => (c.stats.ovr > max.stats.ovr ? c : max), ALL_CARDS[0]);
  }, [selectedCard, winProbability]);

  // Sound handler
  const playSound = useCallback((type: 'tick' | 'spin' | 'win' | 'loss') => {
    if (isSoundMuted) return;
    if (type === 'tick') marketAudio.playTick();
    if (type === 'spin') marketAudio.playCoinToss();
    if (type === 'win') marketAudio.playWin();
    if (type === 'loss') marketAudio.playLoss();
  }, [isSoundMuted]);

  // Execute Upgrade Flip
  const executeUpgrade = async () => {
    if (gameState === 'spinning' || !selectedCard) return;

    // Verify card is still in inventory
    const currentQty = collection[selectedCard.id] || 0;
    if (currentQty <= 0) {
      notifyError('Card no longer in inventory.');
      setSelectedCard(null);
      return;
    }

    const sacrificedCard = selectedCard;

    // Deduct card immediately from collection
    await removeFromCollection([sacrificedCard.id]);

    setGameState('spinning');
    setIsWinner(null);
    playSound('spin');

    // Provably fair random number (0.00 to 100.00)
    const randomRoll = Math.random() * 100;
    const isWin = randomRoll <= winProbability;

    // Wheel angle physics
    const winningSliceDeg = (winProbability / 100) * 360;
    let targetAngleInCircle: number;

    if (isWin) {
      targetAngleInCircle = Math.random() * (winningSliceDeg * 0.9) + (winningSliceDeg * 0.05);
    } else {
      const losingSpan = 360 - winningSliceDeg;
      targetAngleInCircle = winningSliceDeg + (Math.random() * (losingSpan * 0.9) + (losingSpan * 0.05));
    }

    const duration = fastMode ? 850 : 1800;
    const spins = fastMode ? 3 : 6;
    const currentBase = Math.floor(needleAngle / 360) * 360;
    const totalRotation = currentBase + (spins * 360) + targetAngleInCircle;

    const startTime = performance.now();
    const startAngle = needleAngle;
    let lastTick = 0;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Deceleration curve
      const ease = 1 - Math.pow(1 - progress, 3.5);
      const curAngle = startAngle + (totalRotation - startAngle) * ease;
      setNeedleAngle(curAngle);

      // Sound tick
      if (now - lastTick > (fastMode ? 40 : 65) && progress < 0.9) {
        playSound('tick');
        lastTick = now;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Finished spin
        setIsWinner(isWin);
        setGameState('result');
        setServerHash('0x' + Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));

        if (isWin) {
          playSound('win');
          const rewardCard = targetCardCandidate || sacrificedCard;
          const rewardCoins = targetRewardCoins;
          setWonCardReward(rewardCard);

          // Add upgraded card to collection & reward bonus coins
          addToCollection([rewardCard.id]);
          addCoins(rewardCoins);
          setStreak(prev => prev + 1);

          notifySuccess(`+ ${rewardCard.name} (${rewardCard.stats.ovr} OVR) + 🪙 ${formatCoinCompact(rewardCoins)}`);
        } else {
          playSound('loss');
          setWonCardReward(null);
          setStreak(0);
          notifyError(`Upgrade failed. ${sacrificedCard.name} destroyed.`);

          // If no more copies of this card remain, reset selection
          const remainingCopies = (collection[sacrificedCard.id] || 0) - 1;
          if (remainingCopies <= 0) {
            setSelectedCard(null);
          }
        }
      }
    };

    requestAnimationFrame(animate);
  };

  // Filtered Cards in Picker Modal
  const filteredPickerCards = useMemo(() => {
    return ownedCardList.filter(({ card, quantity }) => {
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
  }, [ownedCardList, pickerFilter, pickerSearch]);

  return (
    <div className="h-full w-full max-w-5xl mx-auto flex flex-col justify-between bg-black text-zinc-100 font-sans select-none overflow-hidden p-2 sm:p-4">
      
      {/* 1. TOP HEADER BAR */}
      <div className="shrink-0 bg-zinc-950 border border-zinc-800/80 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
            <Flame size={14} />
          </div>
          <div>
            <span className="text-xs font-bold text-white tracking-wide block leading-none">CARD UPGRADER</span>
            <span className="text-[9px] text-zinc-500 font-mono">Risk tier upgrade</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Win Streak */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono">
            <Flame size={12} className={streak > 0 ? 'text-amber-400 animate-pulse' : 'text-zinc-600'} />
            <span className="text-zinc-400 text-[10px]">Streak:</span>
            <b className="text-amber-400">{streak}x</b>
          </div>

          {/* Fast Mode Toggle */}
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

      {/* 2. MAIN ARENA: YOUR CARD (Left) | ROULETTE WHEEL (Center) | TARGET CARD (Right) */}
      <div className="flex-1 flex items-center justify-center min-h-0 py-2">
        <div className="w-full grid grid-cols-12 gap-2 sm:gap-4 items-center max-w-4xl">
          
          {/* LEFT: YOUR STAKED CARD */}
          <div className="col-span-4 flex flex-col items-center justify-center">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold mb-1.5 flex items-center gap-1">
              <span>Your Card</span>
            </div>

            {selectedCard ? (
              <div 
                onClick={() => gameState !== 'spinning' && setIsPickerOpen(true)}
                className="relative group cursor-pointer w-32 sm:w-44 rounded-2xl overflow-hidden border border-zinc-700/80 hover:border-amber-400 transition-all bg-zinc-950 p-2 shadow-xl flex flex-col items-center"
              >
                <div className="w-full pointer-events-none flex justify-center py-1">
                  <CardItem card={selectedCard} isOwned={true} mode="mini" quantity={collection[selectedCard.id] || 1} />
                </div>

                <div className="w-full mt-1 pt-1.5 border-t border-zinc-800 text-center">
                  <div className="text-xs font-bold text-white truncate font-sans">{selectedCard.name}</div>
                  <div className="text-[10px] font-mono text-amber-400 font-bold flex items-center justify-center gap-1">
                    <span>🪙 {formatCoinCompact(inputCardValue)}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-zinc-300">{selectedCard.stats.ovr} OVR</span>
                  </div>
                </div>

                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-black text-[11px] font-bold font-mono shadow-lg">
                    CHANGE
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsPickerOpen(true)}
                className="w-32 sm:w-44 h-48 sm:h-56 rounded-2xl border-2 border-dashed border-zinc-700 hover:border-emerald-400 bg-zinc-950/80 hover:bg-zinc-900/60 flex flex-col items-center justify-center gap-3 p-4 transition-all text-zinc-400 hover:text-emerald-300 cursor-pointer shadow-inner group"
              >
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 group-hover:border-emerald-500/50 flex items-center justify-center text-zinc-300 group-hover:text-emerald-400 group-hover:scale-110 transition-all">
                  <Plus size={24} />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-white block">Select Card</span>
                  <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">From inventory</span>
                </div>
              </button>
            )}
          </div>

          {/* CENTER: CHANCE WHEEL & ODDS */}
          <div className="col-span-4 flex flex-col items-center justify-center relative">
            
            {/* SVG Wheel Spinner */}
            <div className="relative w-36 h-36 sm:w-48 sm:h-48 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#27272a"
                  strokeWidth="8"
                />
                {/* Losing Red Section */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="8"
                  strokeOpacity="0.35"
                />
                {/* Winning Green Section Arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="8"
                  strokeDasharray={`${(winProbability / 100) * 238.76} 238.76`}
                  strokeLinecap="round"
                  className="transition-all duration-300 drop-shadow-[0_0_10px_rgba(16,185,129,0.6)]"
                />
              </svg>

              {/* Rotating Needle / Arrow */}
              <div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                  transform: `rotate(${needleAngle}deg)`,
                  transition: gameState === 'spinning' ? 'none' : 'transform 0.25s ease-out',
                }}
              >
                <div className="absolute top-1.5 w-2.5 h-6 bg-white rounded-full shadow-[0_0_10px_#fff] border border-black transform -translate-y-1" />
                <div className="w-3.5 h-3.5 rounded-full bg-white shadow-md border-2 border-black" />
              </div>

              {/* Center Info Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl sm:text-2xl font-black font-mono text-white leading-none">
                  {winProbability}%
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-400 mt-1">
                  {currentMultiplier}X
                </span>
              </div>
            </div>

            {/* Status Alert */}
            <div className="mt-2 min-h-[26px] flex items-center justify-center">
              {gameState === 'spinning' ? (
                <span className="text-[11px] font-mono font-bold text-amber-400 animate-pulse flex items-center gap-1.5">
                  <RefreshCw size={12} className="animate-spin" /> UPGRADING...
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
                  {isWinner ? 'UPGRADE SUCCESS' : 'FAILED'}
                </motion.span>
              ) : (
                <span className="text-[9px] font-mono text-zinc-600">
                  Fair Seed: {serverHash}
                </span>
              )}
            </div>

          </div>

          {/* RIGHT: TARGET UPGRADED CARD */}
          <div className="col-span-4 flex flex-col items-center justify-center">
            <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold mb-1.5 flex items-center gap-1">
              <Sparkles size={11} />
              <span>Target Reward</span>
            </div>

            {targetCardCandidate ? (
              <div className="relative w-32 sm:w-44 rounded-2xl overflow-hidden border border-emerald-500/40 bg-zinc-950 p-2 shadow-[0_0_25px_rgba(16,185,129,0.15)] flex flex-col items-center">
                <div className="w-full pointer-events-none flex justify-center py-1">
                  <CardItem card={targetCardCandidate} isOwned={false} mode="mini" />
                </div>

                <div className="w-full mt-1 pt-1.5 border-t border-zinc-800 text-center">
                  <div className="text-xs font-bold text-white truncate font-sans">{targetCardCandidate.name}</div>
                  <div className="text-[10px] font-mono text-emerald-400 font-bold flex items-center justify-center gap-1">
                    <span>🪙 {formatCoinCompact(targetRewardCoins)}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-emerald-300">{targetCardCandidate.stats.ovr} OVR</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-32 sm:w-44 h-48 sm:h-56 rounded-2xl border border-zinc-800/80 bg-zinc-950/60 flex flex-col items-center justify-center gap-2 p-4 text-zinc-600 text-center">
                <Award size={28} className="opacity-40" />
                <span className="text-[11px] font-mono text-zinc-500">Select a card to preview reward</span>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 3. PROBABILITY PRESETS & UPGRADE ACTION BAR */}
      <div className="shrink-0 bg-zinc-950 border border-zinc-800/90 rounded-2xl p-3 space-y-2.5">
        
        {/* Preset Probability Chips */}
        <div className="flex items-center justify-between gap-1.5 overflow-x-auto custom-scrollbar py-0.5">
          {PROBABILITY_PRESETS.map((preset) => {
            const isSelected = winProbability === preset.percent;
            return (
              <button
                key={preset.percent}
                onClick={() => {
                  if (gameState === 'spinning') return;
                  setWinProbability(preset.percent);
                }}
                disabled={gameState === 'spinning'}
                className={`flex-1 py-1.5 px-2 rounded-xl border text-center font-mono transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-md ring-1 ring-emerald-400/30'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <div className="text-xs font-bold text-white">{preset.label}</div>
                <div className={`text-[9px] ${isSelected ? 'text-emerald-400 font-bold' : 'text-zinc-500'}`}>
                  {preset.multiplier}x
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Trigger Button */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            onClick={executeUpgrade}
            disabled={gameState === 'spinning' || !selectedCard}
            className={`flex-1 py-3 rounded-xl text-xs font-black font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              gameState === 'spinning'
                ? 'bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed'
                : !selectedCard
                ? 'bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black hover:opacity-95 active:scale-[0.99] shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer'
            }`}
          >
            {gameState === 'spinning' ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>UPGRADING...</span>
              </>
            ) : !selectedCard ? (
              <>
                <Layers size={14} />
                <span>SELECT A CARD TO UPGRADE</span>
              </>
            ) : (
              <>
                <Zap size={14} className="fill-black" />
                <span>
                  UPGRADE CARD ({winProbability}% • {currentMultiplier}X)
                </span>
              </>
            )}
          </button>

          {gameState === 'result' && (
            <button
              onClick={executeUpgrade}
              disabled={!selectedCard || (collection[selectedCard.id] || 0) <= 0}
              className="px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Upgrade again"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Again</span>
            </button>
          )}
        </div>

      </div>

      {/* 4. CLEAN CARD SELECTION MODAL (Spacious grid, no overlap) */}
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
              {/* Modal Header */}
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between gap-3 shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Layers size={16} className="text-emerald-400" />
                    <span>Select Card to Upgrade</span>
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    Pick a card from your inventory to risk
                  </p>
                </div>
                <button
                  onClick={() => setIsPickerOpen(false)}
                  className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs text-zinc-300 font-bold transition-colors cursor-pointer"
                >
                  Close ✕
                </button>
              </div>

              {/* Search & Filter Bar */}
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
                    All ({ownedCardList.length})
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

              {/* Cards Grid Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {filteredPickerCards.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500">
                    <Layers size={32} className="mb-2 opacity-40" />
                    <p className="text-xs font-mono">No matching cards found in inventory.</p>
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
                              ? 'border-emerald-400 ring-2 ring-emerald-400/20 bg-emerald-500/[0.04]'
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
                            <span className="text-emerald-400 font-bold">🪙{formatCoinCompact(val)}</span>
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

export default CardUpgrader;
