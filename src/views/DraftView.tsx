import React, { useState, useCallback, useMemo, useEffect, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Coins, 
  Zap, 
  User as UserIcon, 
  TrendingUp, 
  Shield, 
  Users, 
  Play, 
  ArrowRight, 
  ArrowLeft,
  Sparkles, 
  RotateCcw,
  LayoutGrid,
  X,
  Package,
  Home
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useNotification } from '../context/NotificationContext';
import { useEngine } from '../hooks/useEngine';
import { Card } from '../types';
import { ALL_CARDS } from '../data/cards';
import CardDetailModal from '../components/CardDetailModal';
import CardItem from '../components/CardItem';
import StaticAd from '../components/StaticAd';

import DraftAchievementsModal from '../components/DraftAchievementsModal';

type DraftPhase = 'entry' | 'captain' | 'starters' | 'bench' | 'review' | 'summary' | 'tournament_selection' | 'bracket';

interface DraftSlot {
  id: string;
  label: string;
  position: string | null; // null means any for bench
  card: Card | null;
}

interface GhostTeam {
  name: string;
  ovr: number;
  benchOvr: number;
}

interface BracketMatch {
  id: string;
  team1: GhostTeam | 'USER';
  team2: GhostTeam | 'USER';
  winner: GhostTeam | 'USER' | null;
  score1?: number;
  score2?: number;
  status: 'pending' | 'simulating' | 'finished';
}

interface MatchEvent {
  id: string;
  text: string;
  score1: number;
  score2: number;
  quarter: number;
  team: 'USER' | 'OPP';
  points: number;
}

interface InteractiveOption {
  label: string;
  risk: 'low' | 'medium' | 'high';
  successText: string;
  failText: string;
  points: number;
}

type EventMechanic = 'choice' | 'meter' | 'tap';

interface RandomEventScenario {
  id: string;
  type: 'attack' | 'defense' | 'clutch';
  mechanic: EventMechanic;
  title: string;
  description: string;
  options?: InteractiveOption[];
  points?: number; // base points for skill events
}

const INTERACTIVE_POOL: RandomEventScenario[] = [
  {
    id: 'fastbreak',
    type: 'attack',
    mechanic: 'choice',
    title: 'Fast Break!',
    description: '{player} is running the floor on a break. How does he finish?',
    options: [
      { label: 'Safe Layup', risk: 'low', points: 2, successText: 'finishes with a smooth finger roll.', failText: 'misses the layup somehow!' },
      { label: 'Power Dunk', risk: 'medium', points: 2, successText: 'posterizes the defender with a huge slam!', failText: 'gets blocked by the rim!' },
      { label: 'Flashy Step-back', risk: 'high', points: 3, successText: 'hits a nasty step-back three!', failText: 'shoots an absolute airball.' }
    ]
  },
  {
    id: 'jump_shot',
    type: 'attack',
    mechanic: 'meter',
    title: 'Shot Mechanic',
    description: '{player} creates space for a jump shot. Time the release perfectly!',
    points: 2
  },
  {
    id: 'dunk_contest',
    type: 'attack',
    mechanic: 'meter',
    title: 'Posterizer Attempt',
    description: '{player} is flying to the rim! Hit the green zone to finish the slam.',
    points: 2
  },
  {
    id: 'scramble',
    type: 'defense',
    mechanic: 'tap',
    title: 'Scramble for Ball!',
    description: 'The ball is loose on the floor! Tap as fast as you can to recover it.',
    points: 0 // Defense stops opponent
  },
  {
    id: 'defensive_intensity',
    type: 'defense',
    mechanic: 'tap',
    title: 'Locked In!',
    description: 'Rival is trying to blow past! Tap to stay in front and force a turnover.',
    points: 0
  },
  {
    id: 'clutch_three',
    type: 'clutch',
    mechanic: 'meter',
    title: 'CLUTCH MOMENT',
    description: 'Game on the line! {player} needs to sink this triple. Release at the peak!',
    points: 3
  }
];

interface PlayerStats {
  cardId: string;
  name: string;
  imageUrl: string;
  pts: number;
  reb: number;
  ast: number;
  ovr: number;
  position: string;
}

interface Tournament {
  id: string;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  recommendedOvr: number;
  rewards: string;
  minOpponentOvr: number;
  maxOpponentOvr: number;
  opponentPool: string[];
}

const TOURNAMENTS: Tournament[] = [
  {
    id: 'summer',
    name: 'Summer League',
    difficulty: 'Easy',
    recommendedOvr: 75,
    rewards: '15,000 Coins + 2 Rookie Packs',
    minOpponentOvr: 70,
    maxOpponentOvr: 80,
    opponentPool: ['Lakers Summer Roster', 'Celtics Rookies', 'Heat Prospects', 'Warriors G-League', 'Bucks Summer Squad', 'Suns Young Guns', 'Nets Future', 'Bulls Newcomers']
  },
  {
    id: 'cup',
    name: 'NBA Cup',
    difficulty: 'Medium',
    recommendedOvr: 85,
    rewards: '50,000 Coins + 2 All-Star Packs',
    minOpponentOvr: 82,
    maxOpponentOvr: 90,
    opponentPool: ['Los Angeles Lakers', 'Boston Celtics', 'Golden State Warriors', 'Milwaukee Bucks', 'Phoenix Suns', 'Miami Heat', 'Denver Nuggets', 'Philadelphia 76ers']
  },
  {
    id: 'playoffs',
    name: 'NBA Playoffs',
    difficulty: 'Hard',
    recommendedOvr: 94,
    rewards: '150,000 Coins + MVP & HOF Packs',
    minOpponentOvr: 92,
    maxOpponentOvr: 98,
    opponentPool: ['Celtics \'24', 'Warriors \'17', 'Bulls \'96', 'Lakers \'01', 'Spurs \'14', 'Heat \'13', 'Cavaliers \'16', 'Bucks \'71']
  }
];

const DRAFT_COST = 100000;

const STARTER_SLOTS: DraftSlot[] = [
  { id: 'pg', label: 'PG', position: 'PG', card: null },
  { id: 'sg', label: 'SG', position: 'SG', card: null },
  { id: 'sf', label: 'SF', position: 'SF', card: null },
  { id: 'pf', label: 'PF', position: 'PF', card: null },
  { id: 'c', label: 'C', position: 'C', card: null },
];

const BENCH_SLOTS: DraftSlot[] = Array.from({ length: 7 }).map((_, i) => ({ 
  id: `bench-${i}`, 
  label: 'BN', 
  position: null, 
  card: null 
}));

const REWARDS = {
  'Summer League': {
    champion: { coins: 15000, packs: [{ id: 'rookie-1', type: 'rookie', name: 'Rookie Pack' }, { id: 'rookie-2', type: 'rookie', name: 'Rookie Pack' }] },
    finalist: { coins: 8000, packs: [{ id: 'rookie-1', type: 'rookie', name: 'Rookie Pack' }] },
    semis: { coins: 4000, packs: [] },
    quarters: { coins: 1000, packs: [] },
  },
  'NBA Cup': {
    champion: { coins: 50000, packs: [{ id: 'allstar-1', type: 'allstar', name: 'All-Star Pack' }, { id: 'allstar-2', type: 'allstar', name: 'All-Star Pack' }] },
    finalist: { coins: 25000, packs: [{ id: 'allstar-1', type: 'allstar', name: 'All-Star Pack' }] },
    semis: { coins: 12000, packs: [{ id: 'rookie-1', type: 'rookie', name: 'Rookie Pack' }] },
    quarters: { coins: 5000, packs: [] },
  },
  'NBA Playoffs': {
    champion: { coins: 150000, packs: [{ id: 'mvp-1', type: 'mvp', name: 'Finals MVP Pack' }, { id: 'hof-1', type: 'hof', name: 'HOF Pack' }] },
    finalist: { coins: 75000, packs: [{ id: 'mvp-1', type: 'mvp', name: 'Finals MVP Pack' }] },
    semis: { coins: 35000, packs: [{ id: 'allstar-1', type: 'allstar', name: 'All-Star Pack' }] },
    quarters: { coins: 15000, packs: [] },
  }
};

const TournamentSummaryModal = memo<{
  show: boolean;
  position: string;
  rewards: { coins: number; packs: any[] } | null;
  onClaim: () => void;
  onClaimHome?: () => void;
  isSaving: boolean;
}>(({ show, position, rewards, onClaim, onClaimHome, isSaving }) => {
  if (!show || !rewards) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6"
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-lg bg-zinc-950 border border-zinc-900 rounded-[3.5rem] p-10 text-center space-y-10 shadow-[0_0_150px_rgba(245,158,11,0.2)] relative overflow-hidden"
      >
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px]" />

        <div className="space-y-4 relative z-10">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.3)] rotate-12">
              <Trophy size={40} className="text-black" />
            </div>
          </div>
          <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-tight">
            Tournament<br />Finished!
          </h2>
          <div className="inline-block px-6 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-amber-500">
              {position === 'champion' ? '🏆 CHAMPION' : position.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="space-y-6 relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Your Rewards</p>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Coins Reward */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 group hover:border-amber-500/30 transition-all">
              <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                <Coins size={24} />
              </div>
              <div className="text-center">
                <p className="text-2xl font-black italic text-white">{rewards.coins.toLocaleString()}</p>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Coins</p>
              </div>
            </div>

            {/* Packs Reward */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 group hover:border-amber-500/30 transition-all">
              <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                <Package size={24} />
              </div>
              <div className="text-center">
                <p className="text-2xl font-black italic text-white">{rewards.packs.length}</p>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Packs Earned</p>
              </div>
            </div>
          </div>

          {/* Pack Icons List */}
          {rewards.packs.length > 0 && (
            <div className="flex justify-center gap-3 pt-2">
              {rewards.packs.map((pack, idx) => (
                <div key={idx} className="w-10 h-14 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center relative group">
                  <Package size={16} className="text-zinc-600 group-hover:text-amber-500 transition-colors" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                    <span className="text-[8px] font-black text-black">1</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 relative z-10 w-full">
          <button
            onClick={onClaim}
            disabled={isSaving}
            className="w-full bg-amber-500 text-black py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 hover:bg-amber-400 transition-all shadow-[0_20px_40px_rgba(245,158,11,0.2)] active:scale-95 disabled:opacity-50"
          >
            <span>{isSaving ? 'Saving Progress...' : 'Claim & New Draft'}</span>
            <ArrowRight size={20} />
          </button>

          <button
            onClick={onClaimHome}
            disabled={isSaving}
            className="w-full bg-zinc-900 text-amber-500 border border-amber-500/20 py-4 rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all disabled:opacity-50"
          >
            <Home size={16} />
            <span>Claim & Exit to Home</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
});

const Slot = memo<{ 
  slot: DraftSlot; 
  mini?: boolean; 
  onClick: () => void; 
  disabled?: boolean; 
  isSelected?: boolean;
}>(({ slot, mini, onClick, disabled, isSelected }) => {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`relative group transition-all duration-500 w-full aspect-[2.5/3.5] ${disabled ? 'opacity-40 cursor-not-allowed grayscale-[0.5]' : ''} ${isSelected ? 'scale-110 z-50' : ''}`}
    >
      {slot.card ? (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ 
            scale: isSelected ? 1.05 : 1, 
            opacity: 1,
            boxShadow: isSelected ? [
              "0 0 20px rgba(245,158,11,0.4)",
              "0 0 40px rgba(245,158,11,0.8)",
              "0 0 20px rgba(245,158,11,0.4)"
            ] : "0 10px 25px rgba(0,0,0,0.5)"
          }}
          whileTap={{ scale: 0.95 }}
          transition={isSelected ? { repeat: Infinity, duration: 1.5 } : { duration: 0.3 }}
          className={`h-full w-full bg-zinc-900 rounded-xl border-2 overflow-hidden transition-all ${isSelected ? 'border-amber-500 ring-4 ring-amber-500/20' : 'border-zinc-800 group-hover:border-amber-500'}`}
        >
          <img src={slot.card.imageUrl} alt={slot.card.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
          <div className="absolute bottom-1.5 left-1.5 right-1.5">
            <p className={`font-black uppercase italic text-white truncate ${mini ? 'text-[6px]' : 'text-[8px]'}`}>{slot.card.name}</p>
            <p className={`font-bold text-amber-500 ${mini ? 'text-[5px]' : 'text-[7px]'}`}>{slot.card.stats?.ovr} OVR</p>
          </div>
          {isSelected && (
            <div className="absolute inset-0 bg-amber-500/10 animate-pulse pointer-events-none" />
          )}
        </motion.div>
      ) : (
        <div className="h-full w-full bg-zinc-900/30 border-2 border-dashed border-zinc-800/50 rounded-xl flex flex-col items-center justify-center gap-1 group-hover:border-amber-500/50 group-hover:bg-zinc-900/60 transition-all relative overflow-hidden">
          {/* Ghost Card Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/10 to-transparent opacity-50" />
          
          <div className={`rounded-full bg-zinc-900/80 flex items-center justify-center text-zinc-600 group-hover:text-amber-500 group-hover:scale-110 transition-all shadow-inner ${mini ? 'w-7 h-7' : 'w-10 h-10'}`}>
            <Zap size={mini ? 14 : 20} className={mini ? '' : 'fill-current opacity-20'} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`font-black text-white/10 ${mini ? 'text-xs' : 'text-xl'}`}>+</span>
            </div>
          </div>
          
          <span className={`font-black uppercase tracking-[0.2em] text-zinc-700 group-hover:text-amber-500/50 transition-colors ${mini ? 'text-[7px]' : 'text-[10px]'}`}>
            {slot.position || slot.label}
          </span>

          {/* Decorative Corner Accents */}
          <div className="absolute top-1 left-1 w-1 h-1 border-t border-l border-zinc-800" />
          <div className="absolute top-1 right-1 w-1 h-1 border-t border-r border-zinc-800" />
          <div className="absolute bottom-1 left-1 w-1 h-1 border-b border-l border-zinc-800" />
          <div className="absolute bottom-1 right-1 w-1 h-1 border-b border-r border-zinc-800" />
        </div>
      )}
      
      {!slot.card && !disabled && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center shadow-lg animate-bounce z-10">
          <span className="text-black font-black text-[10px]">+</span>
        </div>
      )}
    </button>
  );
});

// Match Simulation Sub-components for re-render isolation
const MatchScoreboard = memo<{
  t1Name: string;
  t2Name: string;
  t1Ovr: number;
  t2Ovr: number;
  s1: number;
  s2: number;
  quarter: number;
  isUserT1: boolean;
  isUserT2: boolean;
}>(({ t1Name, t2Name, t1Ovr, t2Ovr, s1, s2, quarter, isUserT1, isUserT2 }) => {
  return (
    <div className="relative z-[500] bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 p-2 md:p-10 shrink-0">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Team 1 */}
          <div className="flex items-center gap-2 md:gap-3 flex-1">
            <div className={`w-8 h-8 md:w-20 md:h-20 rounded-lg md:rounded-3xl flex items-center justify-center text-[10px] md:text-3xl font-black shrink-0 ${isUserT1 ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
              {t1Name[0]}
            </div>
            <div className="flex flex-col min-w-0">
               <p className="text-[9px] md:text-lg font-black uppercase italic text-white truncate leading-tight">{t1Name}</p>
               <p className="text-[6px] md:text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{t1Ovr} OVR</p>
            </div>
          </div>

          {/* Score Display */}
          <div className="flex flex-col items-center gap-0.5 md:gap-2 px-2 md:px-8">
            <div className="flex items-center gap-2 md:gap-6">
              <span className={`text-xl md:text-7xl font-black italic tabular-nums leading-none ${s1 > s2 ? 'text-white' : 'text-zinc-700'}`}>{s1}</span>
              <span className="text-[10px] md:text-2xl font-black text-zinc-900">:</span>
              <span className={`text-xl md:text-7xl font-black italic tabular-nums leading-none ${s2 > s1 ? 'text-white' : 'text-zinc-700'}`}>{s2}</span>
            </div>
            <div className="bg-zinc-800/80 px-2.5 py-0.5 rounded-full border border-white/5">
              <span className="text-[6px] md:text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] whitespace-nowrap">Period {quarter}</span>
            </div>
          </div>

          {/* Team 2 */}
          <div className="flex items-center flex-row-reverse gap-2 md:gap-3 flex-1">
            <div className={`w-8 h-8 md:w-20 md:h-20 rounded-lg md:rounded-3xl flex items-center justify-center text-[10px] md:text-3xl font-black shrink-0 ${isUserT2 ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
              {t2Name[0]}
            </div>
            <div className="flex flex-col items-end min-w-0 text-right">
               <p className="text-[9px] md:text-lg font-black uppercase italic text-white truncate leading-tight">{t2Name}</p>
               <p className="text-[6px] md:text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{t2Ovr} OVR</p>
            </div>
          </div>
      </div>
    </div>
  );
});

const MatchChatbox = memo<{
  events: MatchEvent[];
}>(({ events }) => {
  const visibleEvents = useMemo(() => (events || []).slice(0, 30), [events]);

  return (
    <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col gap-2 md:gap-4 overflow-y-auto pr-2 md:pr-4 scrollbar-hide flex-col-reverse">
      <AnimatePresence initial={false} mode="popLayout">
        {visibleEvents.map((event) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-2 md:p-4 rounded-xl md:rounded-2xl border transition-colors ${
              event.text.startsWith('INTERACTIVE:')
                ? 'bg-amber-500 text-black border-amber-400'
                : event.team === 'USER' 
                  ? 'bg-zinc-900/30 border-amber-500/20 backdrop-blur-sm' 
                  : 'bg-zinc-900/50 border-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between mb-0.5">
              <span className={`text-[6px] md:text-[8px] font-black uppercase tracking-widest ${
                event.text.startsWith('INTERACTIVE:') ? 'text-black/60' : 
                event.team === 'USER' ? 'text-amber-500' : 'text-zinc-500'
              }`}>
                {event.text.startsWith('INTERACTIVE:') ? 'Outcome' : 
                 event.team === 'USER' ? 'Play' : 'Opp'}
              </span>
              <span className={`text-[6px] md:text-[8px] font-bold ${event.text.startsWith('INTERACTIVE:') ? 'text-black/40' : 'text-zinc-700'}`}>Q{event.quarter} • {event.score1}-{event.score2}</span>
            </div>
            <p className={`text-[10px] md:text-sm font-black italic tracking-tight leading-tight ${event.text?.startsWith('INTERACTIVE:') ? 'text-black' : 'text-white'}`}>{event.text?.replace('INTERACTIVE: ', '') || ''}</p>
          </motion.div>
        ))}
      </AnimatePresence>
      {events.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 space-y-4">
          <div className="w-12 h-12 border-4 border-zinc-800 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest">Waiting for tip-off...</p>
        </div>
      )}
    </div>
  );
});

const InteractiveMeter = memo<{
  onFinish: (success: boolean) => void;
  title: string;
}>(({ onFinish, title }) => {
  const [position, setPosition] = useState(0);
  const [isGoingUp, setIsGoingUp] = useState(true);
  const [hasStopped, setHasStopped] = useState(false);
  const requestRef = useRef<number>(null);

  const speed = 2.5;
  const targetMin = 45;
  const targetMax = 55;

  const update = useCallback(() => {
    setPosition(prev => {
      const next = isGoingUp ? prev + speed : prev - speed;
      return Math.min(100, Math.max(0, next));
    });
    requestRef.current = requestAnimationFrame(update);
  }, [isGoingUp]);

  useEffect(() => {
    if (position >= 100 && isGoingUp) setIsGoingUp(false);
    if (position <= 0 && !isGoingUp) setIsGoingUp(true);
  }, [position, isGoingUp]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [update]);

  const handleStop = () => {
    if (hasStopped) return;
    cancelAnimationFrame(requestRef.current!);
    setHasStopped(true);
    const success = position >= targetMin && position <= targetMax;
    onFinish(success);
  };

  return (
    <div className="w-full space-y-8 py-4">
      <div className="relative w-full h-8 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
        {/* Target Zone */}
        <div 
          className="absolute h-full bg-green-500/40 border-l border-r border-green-400"
          style={{ left: `${targetMin}%`, width: `${targetMax - targetMin}%` }}
        />
        {/* Indicator */}
        <div 
          className="absolute h-full w-2 bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"
          style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
        />
      </div>
      <button 
        onClick={handleStop}
        disabled={hasStopped}
        className="w-full bg-white text-black py-4 rounded-3xl font-black uppercase tracking-[0.2em] text-xs hover:bg-amber-400 transition-all active:scale-95 disabled:opacity-50"
      >
        RELEASE NOW!
      </button>
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Hit the green zone for success</p>
    </div>
  );
});

const InteractiveTap = memo<{
  onFinish: (success: boolean) => void;
  title: string;
}>(({ onFinish, title }) => {
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5);
  const [hasFinished, setHasFinished] = useState(false);
  const target = 25;

  useEffect(() => {
    if (hasFinished) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 0.1));
    }, 100);
    return () => clearInterval(timer);
  }, [hasFinished]);

  useEffect(() => {
    if (timeLeft <= 0 && !hasFinished) {
      setHasFinished(true);
      onFinish(false);
    }
  }, [timeLeft, hasFinished, onFinish]);

  const handleTap = () => {
    if (hasFinished) return;
    const next = progress + 1;
    setProgress(next);
    if (next >= target) {
      setHasFinished(true);
      onFinish(true);
    }
  };

  return (
    <div className="w-full space-y-8 py-4 flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-800" />
          <circle 
            cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
            className="text-amber-500 transition-all duration-100"
            strokeDasharray={364}
            strokeDashoffset={364 - (progress / target) * 364}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black italic text-white tracking-tighter">{progress}</span>
          <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">/ {target}</span>
        </div>
      </div>

      <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-red-500"
          initial={{ width: '100%' }}
          animate={{ width: `${(timeLeft / 5) * 100}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
      </div>

      <button 
        onMouseDown={handleTap}
        className="w-24 h-24 bg-white text-black rounded-full font-black uppercase text-xs flex items-center justify-center hover:bg-amber-400 transition-all active:scale-90 shadow-2xl animate-pulse"
      >
        TAP!
      </button>

      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">Tap {target} times before time runs out!</p>
    </div>
  );
});

const LiveMatchSimulation = memo<{
  match: BracketMatch;
  starters: DraftSlot[];
  teamOVR: number;
  benchOVR: number;
  onFinish: (matchId: string, s1: number, s2: number, winner: any) => void;
  onClose: () => void;
}>(({ match, starters, teamOVR, benchOVR, onFinish, onClose }) => {
  const [liveScore, setLiveScore] = useState({ s1: 0, s2: 0 });
  const [liveQuarter, setLiveQuarter] = useState(1);
  const [liveEvents, setLiveEvents] = useState<MatchEvent[]>([]);
  const [simulationSpeed, setSimulationSpeed] = useState(1);
  const [isSimulationPaused, setIsSimulationPaused] = useState(false);
  const [activeInteractiveEvent, setActiveInteractiveEvent] = useState<RandomEventScenario | null>(null);
  const [interactiveResolution, setInteractiveResolution] = useState<{ text: string, points: number, success: boolean } | null>(null);
  const [interactiveTriggers, setInteractiveTriggers] = useState<number[]>([]);
  const [matchSimulationData, setMatchSimulationData] = useState<{ 
    events: MatchEvent[], 
    idx: number, 
    matchId: string, 
    s1Final: number, 
    s2Final: number, 
    winner: any 
  } | null>(null);

  const t1Name = match.team1 === 'USER' ? 'Your Team' : (match.team1 as GhostTeam).name;
  const t2Name = match.team2 === 'USER' ? 'Your Team' : (match.team2 as GhostTeam).name;
  const t1Ovr = match.team1 === 'USER' ? teamOVR : (match.team1 as GhostTeam).ovr;
  const t2Ovr = match.team2 === 'USER' ? teamOVR : (match.team2 as GhostTeam).ovr;
  const t1BenchOvr = match.team1 === 'USER' ? benchOVR : (match.team1 as GhostTeam).benchOvr;
  const t2BenchOvr = match.team2 === 'USER' ? benchOVR : (match.team2 as GhostTeam).benchOvr;

  const startSimulation = useCallback((
    startIdx: number, 
    events: MatchEvent[], 
    matchId: string, 
    s1Final: number, 
    s2Final: number, 
    winner: any,
    triggers: number[]
  ) => {
    let eventIdx = startIdx;
    
    const interval = setInterval(() => {
      if (eventIdx < events.length) {
        setMatchSimulationData(prev => prev ? { ...prev, idx: eventIdx } : null);

        if (triggers.includes(eventIdx)) {
          clearInterval(interval);
          setMatchSimulationData({ events, idx: eventIdx, matchId, s1Final, s2Final, winner });
          
          // Trigger logic
          setIsSimulationPaused(true);
          const randomEvent = INTERACTIVE_POOL[Math.floor(Math.random() * INTERACTIVE_POOL.length)];
          const userStarters = starters.map(s => s.card).filter(Boolean) as Card[];
          const randomPlayer = userStarters[Math.floor(Math.random() * userStarters.length)];
          setActiveInteractiveEvent({
            ...randomEvent,
            description: randomEvent.description.replace('{player}', randomPlayer?.name || 'Someone')
          });
          return;
        }

        const event = events[eventIdx];
        setLiveEvents(prev => [event, ...prev]);
        setLiveScore({ s1: event.score1, s2: event.score2 });
        setLiveQuarter(event.quarter);
        eventIdx++;
      } else {
        clearInterval(interval);
        onFinish(matchId, s1Final, s2Final, winner);
      }
    }, 800 / simulationSpeed);

    (window as any).matchInterval = interval;
    (window as any).skipMatch = () => {
      clearInterval((window as any).matchInterval);
      setLiveEvents([...events].reverse());
      setLiveScore({ s1: s1Final, s2: s2Final });
      setLiveQuarter(4);
      onFinish(matchId, s1Final, s2Final, winner);
      setActiveInteractiveEvent(null);
      setIsSimulationPaused(false);
    };
  }, [starters, simulationSpeed, onFinish]);

  const handleFinishSkill = useCallback((success: boolean) => {
    if (!activeInteractiveEvent || !matchSimulationData) return;
    
    const addedPoints = success ? (activeInteractiveEvent.points || 0) : 0;
    const resText = success 
      ? (activeInteractiveEvent.mechanic === 'meter' ? 'Perfeclty timed release! It goes in!' : 'Won the physical battle!')
      : (activeInteractiveEvent.mechanic === 'meter' ? 'Mistimed the shot... clank.' : 'Lost the ball in the scramble!');

    setInteractiveResolution({ text: resText, points: addedPoints, success });

    setTimeout(() => {
      const resolutionEvent: MatchEvent = {
        id: `interactive-res-${Date.now()}`,
        text: `INTERACTIVE: ${resText}`,
        score1: matchSimulationData.events[matchSimulationData.idx].score1 + (match.team1 === 'USER' ? addedPoints : 0),
        score2: matchSimulationData.events[matchSimulationData.idx].score2 + (match.team2 === 'USER' ? addedPoints : 0),
        quarter: matchSimulationData.events[matchSimulationData.idx].quarter,
        team: 'USER',
        points: addedPoints
      };

      setLiveEvents(prev => [resolutionEvent, ...prev]);
      if (addedPoints) {
        if (match.team1 === 'USER') setLiveScore(prev => ({ ...prev, s1: prev.s1 + addedPoints }));
        else setLiveScore(prev => ({ ...prev, s2: prev.s2 + addedPoints }));
      }

      setActiveInteractiveEvent(null);
      setInteractiveResolution(null);
      setIsSimulationPaused(false);
      const newTriggers = interactiveTriggers.filter(t => t !== matchSimulationData.idx);
      setInteractiveTriggers(newTriggers);

      const nextS1Final = match.team1 === 'USER' ? matchSimulationData.s1Final + addedPoints : matchSimulationData.s1Final;
      const nextS2Final = match.team2 === 'USER' ? matchSimulationData.s2Final + addedPoints : matchSimulationData.s2Final;
      const nextWinner = nextS1Final > nextS2Final ? match.team1 : (nextS1Final < nextS2Final ? match.team2 : matchSimulationData.winner);

      startSimulation(
        matchSimulationData.idx + 1, 
        matchSimulationData.events, 
        matchSimulationData.matchId, 
        nextS1Final,
        nextS2Final, 
        nextWinner,
        newTriggers
      );
    }, 2000);
  }, [activeInteractiveEvent, matchSimulationData, match, interactiveTriggers, startSimulation]);

  useEffect(() => {
    // Definitive simulation parameters
    const t1Ovr = match.team1 === 'USER' ? teamOVR : (match.team1 as GhostTeam).ovr;
    const t2Ovr = match.team2 === 'USER' ? teamOVR : (match.team2 as GhostTeam).ovr;
    const t1BenchOvr = match.team1 === 'USER' ? benchOVR : (match.team1 as GhostTeam).benchOvr;
    const t2BenchOvr = match.team2 === 'USER' ? benchOVR : (match.team2 as GhostTeam).benchOvr;

    // Improved Realistic Scoring Logic
    const ovrDiff = t1Ovr - t2Ovr;
    const benchDiff = (t1BenchOvr - t2BenchOvr) / 2; // Bench has less weight but still matters
    const baseScore = 98 + Math.floor(Math.random() * 15);
    
    // Final scores based on OVR difference + Bench contribution + some controlled variance
    // We add a "Momentum" factor to vary results
    const momentum = Math.random() * 12 - 6;
    let s1Final = Math.max(76, Math.round(baseScore + (ovrDiff * 1.8) + (benchDiff * 0.5) + momentum + (Math.random() * 8 - 4)));
    let s2Final = Math.max(76, Math.round(baseScore - (ovrDiff * 1.8) - (benchDiff * 0.5) - momentum + (Math.random() * 8 - 4)));
    
    // Logic for Overtime if tied
    if (s1Final === s2Final) {
      if (Math.random() > 0.5) s1Final += 2; else s2Final += 2;
    }
    
    const oppName = match.team1 === 'USER' ? (match.team2 as GhostTeam).name : (match.team1 as GhostTeam).name;
    const userStarters = starters.map(s => s.card).filter(Boolean) as Card[];
    const totalPtsWeight = userStarters.reduce((acc, p) => acc + (p.stats?.points || 10), 0);
    
    const eventTemplates = [
      "{player} sinks a deep 3-pointer from the logo!",
      "{player} drives into the lane and finishes with a powerful slam!",
      "{player} hits a smooth step-back jumper while fading away.",
      "{player} drains a corner three after a crisp pass.",
      "{player} gets fouled on the drive and sinks both free throws.",
      "{player} maneuvers through traffic for a finger roll layup.",
      "{player} steals the ball and takes it coast-to-coast for a dunk!",
      "{player} nails a contested triple as the shot clock expires.",
      "{player} blocks a shot on one end and finishes with an alley-oop on the other!",
      "{player} creates separation with a crossover and hits the J.",
      "{player} splashes a catch-and-shoot 3 from the wing.",
      "{player} uses a screen to get open and drains the mid-range shot.",
      "{player} grabs a contested rebound and scores on the putback.",
      "{player} finishes a beautiful Euro-step in the paint."
    ];
    const oppTemplates = [
      "{opp} answers back with a tough bucket in the paint.",
      "{opp} nails a wide-open 3-pointer after a defensive breakdown.",
      "{opp} converts a difficult and-one play through contact.",
      "{opp} takes advantage of a screen for an easy layup.",
      "{opp} hits a high-arching three-pointer from the deep corner.",
      "{opp} draws the double team and finds an open teammate for the score.",
      "{opp} intercepts a pass and scores on the fast break transition.",
      "{opp} cleans up a miss with a strong offensive rebound and putback.",
      "{opp} exploits a mismatch and scores with a smooth post move.",
      "{opp} drains a pressure-packed mid-range jumper."
    ];
    const commentaryPhrases = [
      "UNREAL!", 
      "The crowd is electrified!", 
      "Total dominance in the paint!", 
      "That is a tactical masterstroke.", 
      "Absolute silence in the arena...",
      "Pure brilliance from the superstar.",
      "High IQ basketball on display here.",
      "MOMENTUM SHIFT!",
      "He's heating up!",
      "Defensive clinic at its best."
    ];

    const newEvents: MatchEvent[] = [];
    let currentS1 = 0;
    let currentS2 = 0;

    const totalEvents = Math.min(60, Math.ceil((s1Final + s2Final) / 2.8));
    for (let i = 0; i < totalEvents; i++) {
      const quarter = Math.min(4, Math.floor((i / totalEvents) * 4) + 1);
      const isFourthQuarter = quarter === 4;
      const clutchFactor = isFourthQuarter ? 1.2 : 1; // More scoring in 4th? Or more impact?
      
      const s1Remaining = s1Final - currentS1;
      const s2Remaining = s2Final - currentS2;
      
      let scoringTeam: 'USER' | 'OPP' = 'USER';
      let points = Math.random() > 0.7 ? 3 : 2;

      if (s1Remaining > 0 && s2Remaining > 0) {
        const prob1 = s1Remaining / (s1Remaining + s2Remaining);
        scoringTeam = Math.random() < prob1 ? 'USER' : 'OPP';
      } else if (s1Remaining > 0) {
        scoringTeam = 'USER';
      } else if (s2Remaining > 0) {
        scoringTeam = 'OPP';
      } else {
        break;
      }

      if (scoringTeam === 'USER') {
        if (currentS1 + points > s1Final) points = s1Final - currentS1;
        if (points <= 0) continue;
        currentS1 += points;
      } else {
        if (currentS2 + points > s2Final) points = s2Final - currentS2;
        if (points <= 0) continue;
        currentS2 += points;
      }

      let text = "";
      if (match.team1 === 'USER') {
        if (scoringTeam === 'USER') {
          let r = Math.random() * totalPtsWeight;
          let selectedPlayer = userStarters[0].name;
          for (const p of userStarters) {
            if (r < (p.stats.points || 10)) {
              selectedPlayer = p.name;
              break;
            }
            r -= (p.stats.points || 10);
          }
          const selectedTpl = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
          text = (selectedTpl || "").replace("{player}", selectedPlayer || "Player");
          if (Math.random() > 0.7) text = `${commentaryPhrases[Math.floor(Math.random() * commentaryPhrases.length)] || ""} ${text}`;
        } else {
          const selectedTpl = oppTemplates[Math.floor(Math.random() * oppTemplates.length)];
          text = (selectedTpl || "").replace("{opp}", oppName || "Opponent");
        }
      } else {
        if (scoringTeam === 'OPP') {
          const selectedTpl = oppTemplates[Math.floor(Math.random() * oppTemplates.length)];
          text = (selectedTpl || "").replace("{opp}", oppName || "Opponent");
        } else {
          let r = Math.random() * totalPtsWeight;
          let selectedPlayer = userStarters[0]?.name || "Player";
          for (const p of userStarters) {
            if (r < (p.stats?.points || 10)) {
              selectedPlayer = p.name;
              break;
            }
            r -= (p.stats?.points || 10);
          }
          const selectedTpl = eventTemplates[Math.floor(Math.random() * eventTemplates.length)];
          text = (selectedTpl || "").replace("{player}", selectedPlayer || "Player");
          if (Math.random() > 0.7) text = `${commentaryPhrases[Math.floor(Math.random() * commentaryPhrases.length)] || ""} ${text}`;
        }
      }

      newEvents.push({ id: `event-${i}`, text, score1: currentS1, score2: currentS2, quarter, team: scoringTeam, points });
    }

    const winnerFinal = s1Final > s2Final ? match.team1 : (s1Final < s2Final ? match.team2 : (Math.random() > 0.5 ? match.team1 : match.team2));
    const numTriggers = 3 + Math.floor(Math.random() * 3); // More triggers for interactiveness
    const triggers: number[] = [];
    while (triggers.length < numTriggers) {
      const idx = Math.floor(Math.random() * (newEvents.length - 15)) + 10;
      if (!triggers.includes(idx)) triggers.push(idx);
    }
    setInteractiveTriggers(triggers);
    setMatchSimulationData({ events: newEvents, idx: 0, matchId: match.id, s1Final, s2Final, winner: winnerFinal });
    startSimulation(0, newEvents, match.id, s1Final, s2Final, winnerFinal, triggers);

    return () => clearInterval((window as any).matchInterval);
  }, []); // Run once on mount

  // Handle speed changes
  useEffect(() => {
    if (!isSimulationPaused && matchSimulationData) {
      clearInterval((window as any).matchInterval);
      startSimulation(
        matchSimulationData.idx + 1, 
        matchSimulationData.events, 
        matchSimulationData.matchId, 
        matchSimulationData.s1Final, 
        matchSimulationData.s2Final, 
        matchSimulationData.winner,
        interactiveTriggers
      );
    }
  }, [simulationSpeed, isSimulationPaused]);

  const handleInteractiveChoice = async (option: InteractiveOption) => {
    if (!matchSimulationData) return;
    const baseProbs = { low: 0.85, medium: 0.65, high: 0.45 };
    const successProb = baseProbs[option.risk] + ((teamOVR - 80) * 0.015);
    const isSuccess = Math.random() < successProb;
    let resText = isSuccess ? option.successText : option.failText;
    let addedPoints = isSuccess ? option.points : 0;

    setInteractiveResolution({ text: resText, points: addedPoints, success: isSuccess });

    setTimeout(() => {
      const resolutionEvent: MatchEvent = {
        id: `interactive-res-${Date.now()}`,
        text: `INTERACTIVE: ${resText}`,
        score1: matchSimulationData.events[matchSimulationData.idx].score1 + (match.team1 === 'USER' ? addedPoints : 0),
        score2: matchSimulationData.events[matchSimulationData.idx].score2 + (match.team2 === 'USER' ? addedPoints : 0),
        quarter: matchSimulationData.events[matchSimulationData.idx].quarter,
        team: 'USER',
        points: addedPoints
      };

      setLiveEvents(prev => [resolutionEvent, ...prev]);
      if (addedPoints) {
        if (match.team1 === 'USER') setLiveScore(prev => ({ ...prev, s1: prev.s1 + addedPoints }));
        else setLiveScore(prev => ({ ...prev, s2: prev.s2 + addedPoints }));
      }

      setActiveInteractiveEvent(null);
      setInteractiveResolution(null);
      setIsSimulationPaused(false);
      const newTriggers = interactiveTriggers.filter(t => t !== matchSimulationData.idx);
      setInteractiveTriggers(newTriggers);

      startSimulation(
        matchSimulationData.idx + 1, 
        matchSimulationData.events, 
        matchSimulationData.matchId, 
        match.team1 === 'USER' ? matchSimulationData.s1Final + addedPoints : matchSimulationData.s1Final,
        match.team2 === 'USER' ? matchSimulationData.s2Final + addedPoints : matchSimulationData.s2Final, 
        matchSimulationData.winner,
        newTriggers
      );
    }, 2500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[8000] bg-zinc-950 flex flex-col overflow-hidden"
    >
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 border-[10px] border-white m-10 rounded-[50px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border-[10px] border-white rounded-full" />
        <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white" />
      </div>

        <MatchScoreboard 
          t1Name={t1Name} t2Name={t2Name} 
          t1Ovr={t1Ovr} t2Ovr={t2Ovr} 
          s1={liveScore.s1} s2={liveScore.s2} 
          quarter={liveQuarter} 
          isUserT1={match.team1 === 'USER'} isUserT2={match.team2 === 'USER'} 
        />

        <div className="absolute top-1/4 right-8 z-[200] flex flex-col gap-3">
           <button 
             onClick={() => (window as any).skipMatch?.()}
             className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] border border-zinc-700 transition-all flex items-center gap-2"
           >
             <RotateCcw size={14} className="animate-spin-slow" />
             Quick Finale
           </button>
           <button 
             onClick={() => setSimulationSpeed(prev => prev === 1 ? 2 : prev === 2 ? 4 : 1)}
             className="bg-amber-500 text-black px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all"
           >
             Speed: {simulationSpeed}x
           </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col p-6 md:p-10 relative z-10">
        <MatchChatbox events={liveEvents} />

        <AnimatePresence>
          {activeInteractiveEvent && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-6"
            >
              <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-6 md:p-8 space-y-6 md:space-y-8 shadow-2xl overflow-y-auto max-h-full">
                {!interactiveResolution ? (
                  <>
                    <div className="text-center space-y-3">
                      <div className="inline-block px-4 py-1 bg-amber-500 text-black rounded-full text-[10px] font-black uppercase tracking-widest">
                        {activeInteractiveEvent.mechanic === 'choice' ? 'Decision Moment' : activeInteractiveEvent.mechanic === 'meter' ? 'Skill Check' : 'Rapid Action'}
                      </div>
                      <h3 className="text-xl md:text-2xl font-black italic uppercase text-white leading-tight">{activeInteractiveEvent.title}</h3>
                      <p className="text-zinc-400 font-medium text-sm md:text-base">{activeInteractiveEvent.description}</p>
                    </div>

                    {activeInteractiveEvent.mechanic === 'choice' && (
                      <div className="grid grid-cols-1 gap-2 md:gap-3">
                        {activeInteractiveEvent.options?.map((opt, i) => (
                          <button key={i} onClick={() => handleInteractiveChoice(opt)} className="w-full p-4 bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-amber-500 active:scale-[0.98] group transition-all text-left flex items-center justify-between">
                            <div>
                              <p className="text-xs md:text-sm font-black uppercase italic text-white group-hover:text-amber-500">{opt.label}</p>
                              <p className="text-[9px] md:text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                Risk: <span className={opt.risk === 'low' ? 'text-green-500' : opt.risk === 'medium' ? 'text-amber-500' : 'text-red-500'}>{opt.risk.toUpperCase()}</span>
                              </p>
                            </div>
                            <ArrowRight size={16} className="text-zinc-500 group-hover:text-amber-500" />
                          </button>
                        ))}
                      </div>
                    )}

                    {activeInteractiveEvent.mechanic === 'meter' && (
                       <InteractiveMeter title={activeInteractiveEvent.title} onFinish={handleFinishSkill} />
                    )}

                    {activeInteractiveEvent.mechanic === 'tap' && (
                       <InteractiveTap title={activeInteractiveEvent.title} onFinish={handleFinishSkill} />
                    )}
                  </>
                ) : (
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-6 py-4 md:py-8">
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full mx-auto flex items-center justify-center shadow-2xl ${interactiveResolution.success ? 'bg-green-500 shadow-green-500/20' : 'bg-red-500 shadow-red-500/20'}`}>
                      {interactiveResolution.success ? <Zap size={32} className="text-black" /> : <X size={32} className="text-black" />}
                    </div>
                    <div className="space-y-2 px-4">
                      <h3 className={`text-3xl md:text-4xl font-black italic uppercase ${interactiveResolution.success ? 'text-green-500' : 'text-red-500'}`}>{interactiveResolution.success ? 'SUCCESS!' : 'FAILED'}</h3>
                      <p className="text-base md:text-lg font-bold text-white leading-tight">{interactiveResolution.text}</p>
                    </div>
                    {interactiveResolution.points > 0 && (
                      <div className="inline-block px-6 py-2 bg-amber-500 text-black rounded-full font-black uppercase italic tracking-widest shadow-xl text-xs md:text-sm">+{interactiveResolution.points} Points</div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 md:p-10 bg-zinc-900/30 border-t border-zinc-800 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 relative z-10">
        <div className="flex items-center gap-1 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
          {[1, 2, 4].map((speed) => (
            <button key={speed} onClick={() => setSimulationSpeed(speed)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${simulationSpeed === speed ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-white hover:bg-zinc-900'}`}>
              {speed === 4 ? 'MAX' : `${speed}x`}
            </button>
          ))}
        </div>
        {!isSimulationPaused && (
          <button onClick={() => (window as any).skipMatch?.()} className="px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center gap-3 active:scale-95">
            <Zap size={16} className="fill-amber-500 text-amber-500" /> Skip Simulation
          </button>
        )}
        {isSimulationPaused && !interactiveResolution && (
          <div className="flex items-center gap-3 text-zinc-500">
            <div className="w-2 h-2 bg-zinc-700 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Waiting for Decision...</span>
          </div>
        )}
      </div>
    </motion.div>
  );
});

const DraftView: React.FC = () => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const { 
    coins, 
    spendCoins, 
    setCurrentView, 
    addCoins, 
    addPackToInventory, 
    unlockAchievement,
    updateGameState,
    updateGameStateAsync,
    inventoryPacks,
    isPremium,
    isSaving 
  } = useGame();
  const { notify } = useNotification();
  const { generateDraftOptions } = useEngine();

  const [phase, setPhase] = useState<DraftPhase>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('hoops_draft_state') : null;
    if (saved) {
      try { return JSON.parse(saved).phase || 'entry'; } catch(e) {}
    }
    return 'entry';
  });
  const [starters, setStarters] = useState<DraftSlot[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('hoops_draft_state') : null;
    if (saved) {
      try { return JSON.parse(saved).starters || STARTER_SLOTS; } catch(e) {}
    }
    return STARTER_SLOTS;
  });
  const [bench, setBench] = useState<DraftSlot[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('hoops_draft_state') : null;
    if (saved) {
      try { return JSON.parse(saved).bench || BENCH_SLOTS; } catch(e) {}
    }
    return BENCH_SLOTS;
  });
  const [currentOptions, setCurrentOptions] = useState<Card[]>([]);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [selectedCardForDetail, setSelectedCardForDetail] = useState<Card | null>(null);
  const [swapSource, setSwapSource] = useState<string | null>(null);
  const [isBenchVisibleMobile, setIsBenchVisibleMobile] = useState(false);
  const [shouldAutoStartCaptain, setShouldAutoStartCaptain] = useState(false);
  const [isDraftAchievementsOpen, setIsDraftAchievementsOpen] = useState(false);

  // Tournament State
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('hoops_draft_state') : null;
    if (saved) {
      try { return JSON.parse(saved).selectedTournament || null; } catch(e) {}
    }
    return null;
  });
  const [bracket, setBracket] = useState<BracketMatch[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('hoops_draft_state') : null;
    if (saved) {
      try { return JSON.parse(saved).bracket || []; } catch(e) {}
    }
    return [];
  });
  const [currentRound, setCurrentRound] = useState<'QF' | 'SF' | 'F'>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('hoops_draft_state') : null;
    if (saved) {
      try { return JSON.parse(saved).currentRound || 'QF'; } catch(e) {}
    }
    return 'QF';
  });

  // Interactive Match Event States (Moved to LiveMatchSimulation component for performance)
  // Only minimal tracking remains here
  const [isSimulating, setIsSimulating] = useState(false);
  const [matchResult, setMatchResult] = useState<{ score1: number, score2: number, winner: string } | null>(null);

  // Live Match State
  const [isLiveMatchActive, setIsLiveMatchActive] = useState(false);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [boxScore, setBoxScore] = useState<PlayerStats[]>([]);
  const [showBoxScore, setShowBoxScore] = useState(false);

  // Rewards State
  const [showTournamentSummary, setShowTournamentSummary] = useState(false);
  const [finalPosition, setFinalPosition] = useState<'quarters' | 'semis' | 'finalist' | 'champion' | null>(null);
  const [earnedRewards, setEarnedRewards] = useState<{ coins: number, packs: any[] } | null>(null);

  // State Persistence
  useEffect(() => {
    const state = { phase, starters, bench, bracket, currentRound, selectedTournament };
    localStorage.setItem('hoops_draft_state', JSON.stringify(state));
  }, [phase, starters, bench, bracket, currentRound, selectedTournament]);

  // Auto-scroll to current match in bracket
  const bracketRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (phase === 'bracket' && bracketRef.current) {
      // Find active match to scroll to
      const activeMatch = bracket.find(m => (m.team1 === 'USER' || m.team2 === 'USER') && m.status === 'pending');
      const targetId = activeMatchId || activeMatch?.id;

      if (targetId) {
        const matchElem = bracketRef.current.querySelector(`[data-match-id="${targetId}"]`);
        if (matchElem) {
          matchElem.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
      }
    }
  }, [phase, activeMatchId, bracket, currentRound]);

  const { teamOVR, benchOVR } = useMemo(() => {
    const starterPlayers = starters.map(s => s.card).filter(Boolean) as Card[];
    const benchPlayers = bench.map(s => s.card).filter(Boolean) as Card[];
    
    if (starterPlayers.length === 0 && benchPlayers.length === 0) return { teamOVR: 0, benchOVR: 0 };
    
    const startersAvg = starterPlayers.length > 0
      ? starterPlayers.reduce((acc, p) => acc + (p.stats?.ovr || 0), 0) / starterPlayers.length
      : 0;
    
    const benchAvg = benchPlayers.length > 0
      ? benchPlayers.reduce((acc, p) => acc + (p.stats?.ovr || 0), 0) / benchPlayers.length
      : 0;
    
    // Balanced OVR: 70% Starters, 30% Bench
    const teamOVR = Math.round((startersAvg * 0.7) + (benchAvg * 0.3));
    return { teamOVR, benchOVR: Math.round(benchAvg) };
  }, [starters, bench]);

  useEffect(() => {
    if (shouldAutoStartCaptain && phase === 'starters') {
      const emptyStarters = starters.filter(s => !s.card);
      if (emptyStarters.length === STARTER_SLOTS.length) {
        const randomIndex = Math.floor(Math.random() * starters.length);
        const randomSlot = starters[randomIndex];
        handleSlotClick(randomSlot);
        setShouldAutoStartCaptain(false);
      }
    }
  }, [shouldAutoStartCaptain, phase, starters]);

  // Performance: Smart Image Preloading (Only first 50 common/captain cards)
  useEffect(() => {
    const preloadImages = () => {
      const urls = [
        ...ALL_CARDS.slice(0, 50).map(c => c.imageUrl),
        'https://i.postimg.cc/rz5Tvhqp/hoopslogo.jpg'
      ];
      urls.forEach(url => {
        const img = new Image();
        img.src = url;
        img.decode().catch(() => {}); // Decode as well
      });
    };
    
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(preloadImages);
    } else {
      setTimeout(preloadImages, 3000);
    }
  }, []);

  // Track all cards seen in this draft to prevent duplicates
  const seenCardIds = useMemo(() => {
    const ids = new Set<string>();
    starters.forEach(s => s.card && ids.add(s.card.id));
    bench.forEach(b => b.card && ids.add(b.card.id));
    return Array.from(ids);
  }, [starters, bench]);

  const handleStartDraft = async (method: 'coins' | 'ad') => {
    if (method === 'coins') {
      const success = await spendCoins(DRAFT_COST);
      if (!success) return;
    } else if (method === 'ad') {
      if (!isPremium) {
        setIsWatchingAd(true);
        // Simulate ad watch time
        await new Promise(resolve => setTimeout(resolve, 3000));
        setIsWatchingAd(false);
      }
    }
    
    // Reset slots
    const freshStarters = STARTER_SLOTS.map(s => ({ ...s, card: null }));
    const freshBench = BENCH_SLOTS.map(b => ({ ...b, card: null }));
    
    setStarters(freshStarters);
    setBench(freshBench);
    setBracket([]);
    setSelectedTournament(null);
    setCurrentRound('QF');
    
    // Logic: Autostart with a random Captain pick
    const randomStarterIndex = Math.floor(Math.random() * freshStarters.length);
    const firstSlot = freshStarters[randomStarterIndex];
    
    setPhase('starters');
    setCurrentOptions([]);
    setIsFlipping(false);
    setShouldAutoStartCaptain(true);
  };

  const resetDraftState = (targetView: 'home' | 'entry' = 'home') => {
    localStorage.removeItem('hoops_draft_state');
    setPhase('entry');
    setStarters(STARTER_SLOTS.map(s => ({ ...s, card: null })));
    setBench(BENCH_SLOTS.map(b => ({ ...b, card: null })));
    setBracket([]);
    setSelectedTournament(null);
    setCurrentRound('QF');
    setActiveSlotId(null);
    setCurrentOptions([]);
    setSwapSource(null);
    if (targetView === 'home') {
      setCurrentView('home');
    }
  };

  const handleSelectCard = async (card: Card) => {
    const isFirstPick = starters.every(s => !s.card) && bench.every(b => !b.card);
    let targetSlotId = activeSlotId;

    // Helper to find the most natural vacant slot for a card
    const findNaturalSlot = (c: Card) => {
      const pos = c.position;
      // 1. Try exact match (e.g. PG -> PG)
      const exactMatch = starters.find(s => s.position === pos && !s.card);
      if (exactMatch) return exactMatch.id;

      // 2. Try generic mappings (G -> PG/SG, F -> SF/PF)
      if (pos === 'G') {
        const match = starters.find(s => (s.id === 'pg' || s.id === 'sg') && !s.card);
        if (match) return match.id;
      }
      if (pos === 'F') {
        const match = starters.find(s => (s.id === 'sf' || s.id === 'pf') && !s.card);
        if (match) return match.id;
      }
      if (pos === 'G-F') {
        const match = starters.find(s => (s.id === 'sg' || s.id === 'sf') && !s.card);
        if (match) return match.id;
      }
      if (pos === 'F-C') {
        const match = starters.find(s => (s.id === 'pf' || s.id === 'c') && !s.card);
        if (match) return match.id;
      }
      return null;
    };

    // Logic: If it's the captain pick OR the active slot doesn't match the card's position, 
    // try to find a more natural empty slot in the starters.
    if (phase === 'starters' && targetSlotId && !targetSlotId.startsWith('bench')) {
      const naturalId = findNaturalSlot(card);
      if (naturalId) {
        targetSlotId = naturalId;
      }
    }

    if (targetSlotId) {
      // Selection
      if (targetSlotId.startsWith('bench')) {
        setBench(prev => prev.map(s => s.id === targetSlotId ? { ...s, card } : s));
      } else {
        setStarters(prev => prev.map(s => s.id === targetSlotId ? { ...s, card } : s));
      }

      // Achievement: Generational Talent
      if (isFirstPick && (card.stats?.ovr || 0) >= 97) {
        unlockAchievement('generational_talent', false).then(unlocked => {
          if (unlocked) notify(unlocked);
        });
      }

      setActiveSlotId(null);
      setCurrentOptions([]);
      
      // Calculate filled state using updated data
      const isPickBench = targetSlotId.startsWith('bench');
      const updatedStarters = isPickBench ? starters : starters.map(s => s.id === targetSlotId ? { ...s, card } : s);
      const updatedBench = isPickBench ? bench.map(s => s.id === targetSlotId ? { ...s, card } : s) : bench;

      const allStartersFilled = updatedStarters.every(s => s.card);
      const allBenchFilled = updatedBench.every(b => b.card);

      // UX Improvement: Maintain bench visibility while drafting bench slots
      const stillDraftingBench = (phase === 'bench' || allStartersFilled) && !allBenchFilled;
      if (!stillDraftingBench) {
        setIsBenchVisibleMobile(false);
      }
      
      if (allStartersFilled && !allBenchFilled) {
        setPhase('bench');
      } else if (allStartersFilled && allBenchFilled) {
        setPhase('review');
        
        // --- ACHIEVEMENT DETECTION LOGIC ---
        const starterCards = updatedStarters.map(s => s.card!);
        const totalCards = [...starterCards, ...updatedBench.map(b => b.card!)];

        // 1. Basic completion
        unlockAchievement('trust_the_process', false).then(u => u && notify(u));
        
        // 2. High OVR Team
        if (teamOVR >= 92) unlockAchievement('superteam', false).then(u => u && notify(u));
        
        // 3. Franchise Loyalty (5 starters same team)
        const teamCounts = starterCards.reduce((acc, c) => {
          acc[c.team] = (acc[c.team] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        Object.keys(teamCounts).forEach((team) => {
          const count = teamCounts[team];
          if (count >= 5) {
            unlockAchievement('draft_same_team_5', false).then(u => u && notify(u));
            // Specific team achievement ID
            const teamId = `draft_team_${team.toLowerCase().replace(/ /g, '_')}_5`;
            unlockAchievement(teamId, false).then(u => u && notify(u));
          }
        });

        // 4. The Olympus (All Legends in Starters)
        if (starterCards.every(c => c.rarity === 'legend')) {
          unlockAchievement('draft_all_legend', false).then(u => u && notify(u));
        }

        // 5. All-Star Quintet (All Starters are All-Star or better)
        const eliteRarities = ['allstar', 'franchise', 'legend', 'coach', 'dpoy', 'roty', 'record'];
        if (starterCards.every(c => eliteRarities.includes(c.rarity))) {
          unlockAchievement('draft_all_allstar', false).then(u => u && notify(u));
        }

        // 6. Future is Now (3+ Rookies in draft)
        if (totalCards.filter(c => c.rarity === 'rookie').length >= 3) {
          unlockAchievement('draft_rookie_trio', false).then(u => u && notify(u));
        }

        // 7. Tactical Balance (5 different positions in PG, SG, SF, PF, C)
        const uniquePositions = new Set(starterCards.map(c => {
          // Normalize position string if needed, assuming they are like "PG", "SG" etc.
          return c.position.split('/')[0].trim().toUpperCase();
        }));
        if (uniquePositions.size >= 5) {
          unlockAchievement('draft_position_pure', false).then(u => u && notify(u));
        }

        // 8. Elite Excellence (No bench rarity in all 12)
        if (totalCards.every(c => c.rarity !== 'bench')) {
          unlockAchievement('draft_no_bench', false).then(u => u && notify(u));
        }
      }
    }
  };

  // Manual slot selection logic (FUT Draft Style)
  const handleSlotClick = (slot: DraftSlot) => {
    // If we're in a phase where drafting is done, allow swapping
    const isDraftFinished = phase === 'review' || phase === 'summary' || phase === 'tournament_selection' || phase === 'bracket';
    
    if (isDraftFinished && slot.card) {
      if (!swapSource) {
        setSwapSource(slot.id);
      } else if (swapSource === slot.id) {
        setSwapSource(null);
        setSelectedCardForDetail(slot.card);
      } else {
        // Perform Swap
        const sourceId = swapSource;
        const targetId = slot.id;
        
        let newStarters = [...starters];
        let newBench = [...bench];
        
        const sourceInStarters = starters.find(s => s.id === sourceId);
        const targetInStarters = starters.find(s => s.id === targetId);
        
        const sourceInBench = bench.find(b => b.id === sourceId);
        const targetInBench = bench.find(b => b.id === targetId);
        
        const sourceCard = sourceInStarters?.card || sourceInBench?.card;
        const targetCard = targetInStarters?.card || targetInBench?.card;
        
        if (sourceInStarters) {
          newStarters = newStarters.map(s => s.id === sourceId ? { ...s, card: targetCard || null } : s);
        } else if (sourceInBench) {
          newBench = newBench.map(b => b.id === sourceId ? { ...b, card: targetCard || null } : b);
        }
        
        if (targetInStarters) {
          newStarters = newStarters.map(s => s.id === targetId ? { ...s, card: sourceCard || null } : s);
        } else if (targetInBench) {
          newBench = newBench.map(b => b.id === targetId ? { ...b, card: sourceCard || null } : b);
        }
        
        setStarters(newStarters);
        setBench(newBench);
        setSwapSource(null);
        setIsBenchVisibleMobile(false);
      }
      return;
    }

    if (slot.card) {
      setSelectedCardForDetail(slot.card);
      return;
    }
    
    // Drafting logic: only allow clicking empty slots if in the right phase
    const isFirstPick = starters.every(s => !s.card) && bench.every(b => !b.card);

    if ((phase === 'starters' && starters.some(s => s.id === slot.id)) || 
        (phase === 'bench' && bench.some(b => b.id === slot.id))) {
      setActiveSlotId(slot.id);
      
      // Maintain bench visibility if picking from the bench
      if (!bench.some(b => b.id === slot.id)) {
        setIsBenchVisibleMobile(false);
      }
      
      // If no cards are in the squad, this first pick is automatically the "Captain" pick
      const options = generateDraftOptions(5, slot.position, seenCardIds, isFirstPick, isFirstPick);
      
      setCurrentOptions(options);
      setIsFlipping(true);
    }
  };

  const generateGhostTeam = (tournament: Tournament): GhostTeam => {
    const name = tournament.opponentPool[Math.floor(Math.random() * tournament.opponentPool.length)];
    const ovr = Math.floor(Math.random() * (tournament.maxOpponentOvr - tournament.minOpponentOvr + 1)) + tournament.minOpponentOvr;
    const benchOvr = Math.max(70, ovr - (Math.floor(Math.random() * 8) + 2)); // Bench is usually lower
    return { name, ovr, benchOvr };
  };

  const handleSelectTournament = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    
    // Generate Bracket (8 teams: User + 7 Ghosts)
    const opponents = Array.from({ length: 7 }).map(() => generateGhostTeam(tournament));
    
    const qf: BracketMatch[] = [
      { id: 'qf1', team1: 'USER', team2: opponents[0], winner: null, status: 'pending' },
      { id: 'qf2', team1: opponents[1], team2: opponents[2], winner: null, status: 'pending' },
      { id: 'qf3', team1: opponents[3], team2: opponents[4], winner: null, status: 'pending' },
      { id: 'qf4', team1: opponents[5], team2: opponents[6], winner: null, status: 'pending' },
    ];
    
    setBracket(qf);
    setCurrentRound('QF');
    setPhase('bracket');
  };

  const simulateMatch = useCallback((matchId: string) => {
    setActiveMatchId(matchId);
    setIsLiveMatchActive(true);
  }, []);

  const handleFinishMatch = useCallback(async (matchId: string, s1: number, s2: number, winner: any) => {
    const match = bracket.find(m => m.id === matchId);
    if (!match) return;

    // Achievements check
    if (winner === 'USER') {
      const diff = Math.abs(s1 - s2);
      if (diff >= 20) {
        const unlocked = await unlockAchievement('blowout', false);
        if (unlocked) notify(unlocked);
      }
      if (diff >= 1 && diff <= 2) {
        const unlocked = await unlockAchievement('clutch_time', false);
        if (unlocked) notify(unlocked);
      }
      if (selectedTournament?.name === 'NBA Playoffs' && teamOVR < 88) {
        const unlocked = await unlockAchievement('david_vs_goliath', false);
        if (unlocked) notify(unlocked);
      }
    }

    const winnerName = winner === 'USER' ? 'Your Team' : (winner as GhostTeam).name;
    setMatchResult({ score1: s1, score2: s2, winner: winnerName });

    setBracket(prev => prev.map(m => m.id === matchId ? { 
      ...m, 
      winner, 
      score1: s1, 
      score2: s2, 
      status: 'finished' 
    } : m));

    setIsLiveMatchActive(false);

    // Box Score Generation: Distribute s1 points among starters based on their points stat weight
    const starterPlayers = starters.map(s => s.card).filter(Boolean) as Card[];
    const totalWeight = starterPlayers.reduce((acc, p) => acc + (p.stats.points || 10), 0);
    
    let remainingPts = s1;
    const finalStats: PlayerStats[] = starters.map((s, idx) => {
      if (!s.card) return {
        cardId: s.id, name: 'Unknown', imageUrl: '', pts: 0, reb: 0, ast: 0, ovr: 0, position: s.position || 'BN'
      };

      let playerPts = 0;
      if (idx === starterPlayers.length - 1) {
        playerPts = remainingPts; // Last player gets remainder
      } else {
        const weight = (s.card.stats.points || 10) / totalWeight;
        playerPts = Math.min(remainingPts, Math.round(s1 * weight * (0.8 + Math.random() * 0.4)));
        remainingPts -= playerPts;
      }

      return {
        cardId: s.id,
        name: s.card.name,
        imageUrl: s.card.imageUrl,
        pts: playerPts,
        reb: Math.floor(Math.random() * (s.card.stats.rebounds || 10) + 2),
        ast: Math.floor(Math.random() * (s.card.stats.assists || 10) + 2),
        ovr: s.card.stats.ovr,
        position: s.position || 'BN'
      };
    });
    setBoxScore(finalStats);
  }, [bracket, selectedTournament, teamOVR, starters, unlockAchievement, notify]);

  const handleTournamentEnd = async (position: 'quarters' | 'semis' | 'finalist' | 'champion') => {
    if (!selectedTournament) return;
    const rewards = REWARDS[selectedTournament.name as keyof typeof REWARDS][position];
    setFinalPosition(position);
    setEarnedRewards(rewards);
    setShowTournamentSummary(true);

    if (position === 'champion') {
      if (selectedTournament.name === 'Summer League') {
        const unlocked = await unlockAchievement('summer_mvp', false);
        if (unlocked) notify(unlocked);
      } else if (selectedTournament.name === 'NBA Cup') {
        const unlocked = await unlockAchievement('cup_champion', false);
        if (unlocked) notify(unlocked);
      } else if (selectedTournament.name === 'NBA Playoffs') {
        const unlocked = await unlockAchievement('ring_chaser', false);
        if (unlocked) notify(unlocked);
      }
    }
  };

  const claimRewards = async (targetView: 'draft' | 'home' = 'draft') => {
    if (earnedRewards) {
      // Batch update everything (coins + stacked packs)
      const currentInventory = JSON.parse(JSON.stringify(inventoryPacks)); // Deep clone
      
      for (const pack of earnedRewards.packs) {
        const existing = currentInventory.find((p: any) => p.type === pack.type);
        if (existing) {
          existing.count = (existing.count || 1) + 1;
        } else {
          currentInventory.push({ 
            id: pack.type, 
            type: pack.type, 
            name: pack.name, 
            count: 1 
          });
        }
      }

      await updateGameStateAsync({
        coins: coins + earnedRewards.coins,
        inventoryPacks: currentInventory
      });
    }

    // Reset Draft State
    setPhase('entry');
    setStarters(STARTER_SLOTS);
    setBench(BENCH_SLOTS);
    setBracket([]);
    setSelectedTournament(null);
    setShowTournamentSummary(false);
    setFinalPosition(null);
    setEarnedRewards(null);
    localStorage.removeItem('hoops_draft_state');

    if (targetView === 'home') {
      setCurrentView('home');
    }
  };

  const advanceRound = () => {
    if (!showBoxScore) {
      setShowBoxScore(true);
      return;
    }

    const userLost = matchResult && matchResult.winner !== 'Your Team';
    const isFinal = currentRound === 'F';
    
    setShowBoxScore(false);
    setMatchResult(null);
    
    if (userLost || isFinal) {
      const position = userLost 
        ? (currentRound === 'QF' ? 'quarters' : currentRound === 'SF' ? 'semis' : 'finalist')
        : 'champion';
      handleTournamentEnd(position);
      return;
    }

    // Helper to simulate a match between two ghost teams
    const simulateGhostMatch = (m: BracketMatch): GhostTeam | 'USER' => {
      if (m.winner) return m.winner;
      const t1Ovr = m.team1 === 'USER' ? teamOVR : (m.team1 as GhostTeam).ovr;
      const t2Ovr = m.team2 === 'USER' ? teamOVR : (m.team2 as GhostTeam).ovr;
      const t1b = m.team1 === 'USER' ? benchOVR : (m.team1 as GhostTeam).benchOvr;
      const t2b = m.team2 === 'USER' ? benchOVR : (m.team2 as GhostTeam).benchOvr;
      
      const ovrDiff = t1Ovr - t2Ovr;
      const benchDiff = (t1b - t2b) / 2;
      
      // Realistic NBA scoring for ghost matches too
      const baseScore = 102 + (Math.random() * 10 - 5);
      const t1Score = Math.round(baseScore + (ovrDiff * 1.5) + (benchDiff * 0.4) + (Math.random() * 8 - 4));
      const t2Score = Math.round(baseScore - (ovrDiff * 1.5) - (benchDiff * 0.4) + (Math.random() * 8 - 4));
      
      return t1Score > t2Score ? m.team1 : (t1Score < t2Score ? m.team2 : (Math.random() > 0.5 ? m.team1 : m.team2));
    };

    if (currentRound === 'QF') {
      // Simulate all other QF matches
      const qfWinners = bracket.map(m => simulateGhostMatch(m));
      
      const sf: BracketMatch[] = [
        { id: 'sf1', team1: qfWinners[0], team2: qfWinners[1], winner: null, status: 'pending' },
        { id: 'sf2', team1: qfWinners[2], team2: qfWinners[3], winner: null, status: 'pending' },
      ];
      setBracket(sf);
      setCurrentRound('SF');
    } else if (currentRound === 'SF') {
      // Simulate all other SF matches
      const sfWinners = bracket.map(m => simulateGhostMatch(m));
      
      const f: BracketMatch = { id: 'f1', team1: sfWinners[0], team2: sfWinners[1], winner: null, status: 'pending' };
      setBracket([f]);
      setCurrentRound('F');
    } else {
      // Won the final!
      setPhase('summary');
      // Add rewards logic here if needed
    }
  };

  const renderEntry = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6 sm:space-y-8 relative w-full min-h-full">
      {isWatchingAd && (
        <div className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center space-y-6 md:space-y-8">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-white font-black uppercase tracking-widest text-sm">Watching Ad...</p>
          <div className="mt-8 scale-75 md:scale-90 px-4">
             <StaticAd position="footer" />
          </div>
        </div>
      )}

      <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-600 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.4)] shrink-0">
        <Trophy size={isMobile ? 40 : 48} className="text-white" />
      </div>
      
      <div className="space-y-1">
        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none">Hoops Draft</h2>
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">Draft Selection & Tournament Mode</p>
      </div>

      <div className="grid grid-cols-1 gap-4 w-full max-w-xs">
        <button 
          onClick={() => handleStartDraft('coins')}
          disabled={coins < DRAFT_COST || isSaving || isWatchingAd}
          className="group relative bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-amber-400 transition-all disabled:opacity-50 active:scale-95 shadow-xl"
        >
          <Coins size={18} />
          <span>{isSaving ? 'Processing...' : `Entry: ${DRAFT_COST.toLocaleString()}`}</span>
        </button>
        
        <button 
          onClick={() => handleStartDraft('ad')}
          disabled={isSaving || isWatchingAd}
          className="group relative bg-zinc-900 text-white border border-zinc-800 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all disabled:opacity-50 active:scale-95 shadow-lg"
        >
          <Play size={18} />
          <span>{isPremium ? 'Free Entry (Premium)' : 'Watch Ad to Enter'}</span>
        </button>

        <button 
          onClick={() => setIsDraftAchievementsOpen(true)}
          className="group relative bg-zinc-900/50 text-amber-500 border border-amber-500/20 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-amber-500/10 transition-all active:scale-95 shadow-lg mt-2"
        >
          <Trophy size={14} />
          <span>Draft Achievements</span>
        </button>
      </div>

      {!isPremium && (
        <div className="mt-4 flex flex-col items-center gap-2">
          <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Sponsored Content</p>
          <StaticAd position="footer" />
        </div>
      )}
    </div>
  );

  const renderDraftBoard = () => (
    <div className="h-[100dvh] w-full flex flex-col bg-zinc-950 overflow-hidden relative">
      {/* Background Ambience for Desktop */}
      <div className="hidden lg:block absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black" />
        <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/basketball/1920/1080')] bg-cover bg-center blur-xl" />
      </div>

      {/* Back Button */}
      <button 
        onClick={() => setCurrentView('home')}
        className="absolute top-4 left-4 z-[5500] w-10 h-10 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full flex items-center justify-center text-white hover:bg-zinc-800 transition-all active:scale-95 shadow-lg"
      >
        <ArrowLeft size={20} />
      </button>

      <div className="flex-1 flex flex-col lg:flex-row px-4 pt-16 pb-2 lg:p-6 lg:pt-10 gap-4 md:gap-6 lg:gap-10 max-w-7xl mx-auto w-full h-full relative z-10 overflow-hidden">
        {/* Left Stats Panel - Floating on Mobile, Sidebar on Desktop */}
        <div className="lg:w-40 flex flex-col gap-4 shrink-0 z-30">
          <div className="bg-zinc-900/80 backdrop-blur-md lg:bg-zinc-900/50 border border-zinc-800 lg:border-zinc-800/50 rounded-2xl p-4 flex lg:flex-col items-center justify-between lg:justify-center gap-4 shadow-2xl">
            <div className="text-center">
              <p className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-zinc-500">Team OVR</p>
              <p className="text-2xl md:text-3xl font-black italic text-amber-500">{teamOVR}</p>
            </div>
            <div className="hidden lg:block w-full h-px bg-white/5" />
            <div className="text-right lg:text-center">
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-tighter text-white italic">Draft Mode</p>
              <p className="text-[7px] md:text-[8px] font-bold text-zinc-600 uppercase tracking-widest">
                {phase === 'starters' && starters.some(s => s.card) ? 'Starters' : phase === 'bench' ? 'Bench' : 'Captain Pick'}
              </p>
            </div>
          </div>

          {/* Quick Stats or Tournament info could go here in desktop */}
          <div className="hidden lg:flex flex-col bg-zinc-900/30 border border-zinc-800/30 rounded-2xl p-4 gap-4">
             <div className="flex flex-col gap-1">
                <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Current Rewards</p>
                <p className="text-[10px] font-bold text-amber-500">0 Coins</p>
             </div>
             <div className="w-full h-px bg-white/5" />
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">Server Live</p>
             </div>
          </div>
        </div>
  
        {/* Main Board Container (Tactical Court) */}
        <div className="flex-1 flex flex-col min-h-0 gap-2 lg:gap-4 relative overflow-hidden h-full">
          {/* Top Half: Tactical Starting Five */}
          <div className="flex-1 lg:flex-[4] min-h-0 bg-zinc-900/20 backdrop-blur-sm lg:bg-zinc-900/30 border border-zinc-800/50 rounded-[2.5rem] p-4 md:p-8 flex flex-col justify-center relative overflow-hidden shadow-2xl">
            {/* Court Lines Overlay */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] h-2/3 border-b-2 border-x-2 border-white/20 rounded-b-[150px]" />
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-white/20 rounded-full" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-32 border-t-2 border-x-2 border-white/20" />
            </div>
  
            <div className="relative z-10 h-full w-full flex flex-col justify-around py-1 md:py-4 min-h-0">
              {/* Mobile Layout (Remains as is) */}
              <div className="lg:hidden flex flex-col gap-1 md:gap-4 justify-around h-full">
                {/* Row 1: PG, SG, SF */}
                <div className="flex justify-center gap-2 md:gap-4 h-[44%]">
                  {[starters[0], starters[1], starters[2]].map(slot => (
                    <div key={slot.id} className="w-[30%] max-w-[100px] h-full flex items-center">
                      <Slot 
                        slot={slot} 
                        onClick={() => handleSlotClick(slot)} 
                        isSelected={swapSource === slot.id || activeSlotId === slot.id}
                      />
                    </div>
                  ))}
                </div>
                {/* Row 2: PF, C */}
                <div className="flex justify-center gap-4 md:gap-8 h-[44%]">
                  {[starters[3], starters[4]].map(slot => (
                    <div key={slot.id} className="w-[35%] max-w-[110px] h-full flex items-center">
                      <Slot 
                        slot={slot} 
                        onClick={() => handleSlotClick(slot)} 
                        isSelected={swapSource === slot.id || activeSlotId === slot.id}
                      />
                    </div>
                  ))}
                </div>
              </div>
  
              {/* Desktop Tactical Layout - Scaled for PC */}
              <div className="hidden lg:flex flex-col justify-between h-full py-10">
                <div className="flex justify-center">
                  <div className="w-32 xl:w-36 aspect-[2.5/3.5]">
                    <Slot 
                      slot={starters[0]} 
                      onClick={() => handleSlotClick(starters[0])} 
                      isSelected={swapSource === starters[0].id || activeSlotId === starters[0].id}
                    />
                  </div>
                </div>
                <div className="flex justify-between px-[10%] xl:px-[15%]">
                  <div className="w-32 xl:w-36 aspect-[2.5/3.5]">
                    <Slot 
                      slot={starters[1]} 
                      onClick={() => handleSlotClick(starters[1])} 
                      isSelected={swapSource === starters[1].id || activeSlotId === starters[1].id}
                    />
                  </div>
                  <div className="w-32 xl:w-36 aspect-[2.5/3.5]">
                    <Slot 
                      slot={starters[2]} 
                      onClick={() => handleSlotClick(starters[2])} 
                      isSelected={swapSource === starters[2].id || activeSlotId === starters[2].id}
                    />
                  </div>
                </div>
                <div className="flex justify-center gap-16 xl:gap-24">
                  <div className="w-32 xl:w-36 aspect-[2.5/3.5]">
                    <Slot 
                      slot={starters[3]} 
                      onClick={() => handleSlotClick(starters[3])} 
                      isSelected={swapSource === starters[3].id || activeSlotId === starters[3].id}
                    />
                  </div>
                  <div className="w-32 xl:w-36 aspect-[2.5/3.5]">
                    <Slot 
                      slot={starters[4]} 
                      onClick={() => handleSlotClick(starters[4])} 
                      isSelected={swapSource === starters[4].id || activeSlotId === starters[4].id}
                    />
                  </div>
                </div>
              </div>
            </div>
  
            {/* Squad Review Button Overlay */}
            {phase === 'review' && (
              <div className="absolute inset-x-0 bottom-10 flex justify-center z-50 px-8">
                <motion.button
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  onClick={() => setPhase('summary')}
                  className="w-full max-w-xs bg-amber-500 text-black py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(245,158,11,0.3)] hover:bg-amber-400 transition-all active:scale-95"
                >
                  <span>Finish Draft and Play</span>
                  <ArrowRight size={20} />
                </motion.button>
              </div>
            )}
          </div>
  
          {/* Mobile Bench Toggle (Only on mobile) */}
          <div className="lg:hidden flex flex-col gap-2 relative mt-auto pb-4 shrink-0">
            <button 
              onClick={() => setIsBenchVisibleMobile(!isBenchVisibleMobile)}
              className="w-full bg-zinc-900 border border-zinc-800 py-3 flex items-center justify-center gap-2 rounded-2xl hover:bg-zinc-800 transition-all active:scale-x-95"
            >
              <div className="flex items-center gap-2">
                <Sparkles size={14} className={isBenchVisibleMobile ? 'text-amber-500' : 'text-zinc-500'} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                  {isBenchVisibleMobile ? 'Close Bench' : 'Open Bench (SUB / RES)'}
                </span>
              </div>
              <motion.div
                animate={{ rotate: isBenchVisibleMobile ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <LayoutGrid size={14} className="text-zinc-500" />
              </motion.div>
            </button>
  
            <AnimatePresence>
              {isBenchVisibleMobile && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-zinc-950/90 border border-zinc-900 rounded-2xl shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
                >
                  <div className="flex items-center gap-2 px-4 py-2 border-b border-zinc-900/50">
                    <div className="h-px flex-1 bg-zinc-900/50" />
                    <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Reserve Players</span>
                    <div className="h-px flex-1 bg-zinc-900/50" />
                  </div>
                  
                  <div className="flex justify-center flex-wrap gap-2 p-4">
                    {bench.map(slot => (
                      <div key={slot.id} className="w-[20%] min-w-[60px] max-w-[80px]">
                        <Slot 
                          slot={slot} 
                          mini 
                          onClick={() => handleSlotClick(slot)} 
                          isSelected={swapSource === slot.id || activeSlotId === slot.id}
                        />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Sidebar - Desktop Bench (Always Visible) */}
        <div className="hidden lg:flex flex-col w-56 xl:w-64 gap-4 shrink-0 z-30">
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-[2rem] p-6 flex flex-col h-full shadow-2xl overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-center gap-3 mb-6 shrink-0">
               <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Squad Reserves</h3>
               <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 scrollbar-hide">
              {bench.map(slot => (
                <div key={slot.id} className="group">
                  <div className="flex items-center justify-between px-1 mb-1.5">
                     <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{slot.label}</span>
                     {slot.card && <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />}
                  </div>
                  <div className="h-24 xl:h-28">
                    <Slot 
                      slot={slot} 
                      mini 
                      onClick={() => handleSlotClick(slot)} 
                      isSelected={swapSource === slot.id || activeSlotId === slot.id}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-zinc-800/50 text-center">
               <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Bench Influence: 20%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSelection = () => (
    <div className="fixed inset-0 z-[8000] flex flex-col items-center justify-start p-2 md:p-8 overflow-y-auto">
      {/* Backdrop for the modal */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
        onClick={() => {
          // Block escape during captain pick if needed, but usually we allow it if they want to cancel draft
          if (starters.some(s => s.card)) {
            setCurrentOptions([]);
          }
        }}
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative z-10 w-full flex flex-col items-center px-1"
      >
        <div className="text-center mb-3 md:mb-12 shrink-0">
          <h2 className="text-sm md:text-5xl font-black italic uppercase tracking-tighter text-white leading-none">
            {currentOptions.length > 0 && starters.every(s => !s.card) && bench.every(b => !b.card) ? 'Captain Pick' : `Select Player`}
          </h2>
          <p className="text-[7px] md:text-sm font-bold text-amber-500 uppercase tracking-[0.3em] mt-1 italic">
            {currentOptions.length > 0 && starters.every(s => !s.card) && bench.every(b => !b.card) ? 'The Franchise Leader' : 'Technical selection'}
          </p>
        </div>

        <div className="w-full flex-1 md:flex-none flex flex-col items-center justify-center gap-1 sm:gap-6 overflow-y-auto px-1 sm:px-4">
          <div className="grid grid-cols-2 sm:flex sm:flex-row sm:flex-nowrap gap-3 md:gap-6 w-full max-w-4xl justify-items-center">
            {currentOptions.map((card, idx) => (
              <motion.div
                key={card.id + idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="w-full sm:w-44 xl:w-48 aspect-[2.5/3.5] shrink-0"
              >
                <CardItem 
                  card={card} 
                  isOwned={true} 
                  mode={isMobile ? "large" : "mini"} 
                  onClick={() => handleSelectCard(card)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderBoxScore = () => {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9500] bg-zinc-950 flex flex-col p-6 md:p-10 overflow-hidden"
      >
        <div className="max-w-4xl mx-auto w-full flex flex-col h-full space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">Match Summary</h2>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Individual Box Score</p>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[400px]">
                <thead>
                  <tr className="bg-zinc-900/50 border-b border-zinc-800">
                    <th className="p-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Player</th>
                    <th className="p-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">PTS</th>
                    <th className="p-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">REB</th>
                    <th className="p-5 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">AST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {boxScore.map((player) => (
                    <tr key={player.cardId} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 rounded-lg overflow-hidden border border-zinc-800 shrink-0">
                            <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="text-xs font-black uppercase italic text-white group-hover:text-amber-500 transition-colors">{player.name}</p>
                            <p className="text-[8px] font-bold text-zinc-500 uppercase">{player.position} • {player.ovr} OVR</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-lg font-black italic text-white">{player.pts}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-lg font-black italic text-zinc-400">{player.reb}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-lg font-black italic text-zinc-400">{player.ast}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={advanceRound}
            className="w-full bg-amber-500 text-black py-6 rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3 hover:bg-amber-400 transition-all shadow-[0_20px_40px_rgba(245,158,11,0.2)] active:scale-95"
          >
            <span>Continue Tournament</span>
            <ArrowRight size={20} />
          </button>
        </div>
      </motion.div>
    );
  };

  const renderSummary = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-32 h-32 bg-amber-500 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(245,158,11,0.4)]"
      >
        <Sparkles size={64} className="text-black" />
      </motion.div>
      
      <div className="space-y-2">
        <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-none">Draft Complete</h2>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Your dynasty is ready for the playoffs</p>
      </div>

      <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
        <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-3xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Team OVR</p>
          <p className="text-4xl font-black italic text-amber-500">{teamOVR}</p>
        </div>
      </div>

      <div className="space-y-4 w-full max-w-xs">
        <button 
          onClick={() => setPhase('tournament_selection')}
          className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-amber-400 transition-all shadow-2xl"
        >
          <span>Enter Tournament</span>
          <ArrowRight size={20} />
        </button>
        
        <button 
          onClick={() => resetDraftState('home')}
          className="w-full bg-zinc-900 text-amber-500 border border-amber-500/20 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all"
        >
          <Home size={16} />
          <span>Finalize and Exit</span>
        </button>

        <button 
          onClick={() => resetDraftState('entry')}
          className="w-full bg-zinc-900/50 text-zinc-500 border border-zinc-800 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-zinc-800 transition-all"
        >
          <RotateCcw size={14} />
          <span>New Draft</span>
        </button>
      </div>
    </div>
  );

  const renderTournamentSelection = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 space-y-8 overflow-y-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white">Select Tournament</h2>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Choose your challenge level</p>
      </div>

      <div className="flex md:grid md:grid-cols-3 gap-6 w-full max-w-6xl overflow-x-auto md:overflow-x-visible pb-8 md:pb-0 snap-x snap-mandatory scrollbar-hide px-4 md:px-0">
        {TOURNAMENTS.map((t) => (
          <motion.div
            key={t.id}
            whileHover={{ scale: 1.02, translateY: -5 }}
            onClick={() => handleSelectTournament(t)}
            className="relative group cursor-pointer bg-zinc-950 border border-zinc-900 rounded-[2rem] p-8 flex flex-col items-center text-center space-y-6 overflow-hidden shadow-2xl min-w-[85%] md:min-w-0 snap-center"
          >
            {/* Difficulty Badge */}
            <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              t.difficulty === 'Easy' ? 'bg-green-500/20 text-green-500' :
              t.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-500' :
              'bg-red-500/20 text-red-500'
            }`}>
              {t.difficulty}
            </div>

            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl ${
              t.difficulty === 'Easy' ? 'bg-green-600' :
              t.difficulty === 'Medium' ? 'bg-blue-600' :
              'bg-red-600'
            }`}>
              <Trophy size={40} className="text-white" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black italic uppercase text-white">{t.name}</h3>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Rec. OVR: {t.recommendedOvr}+</p>
            </div>

            <div className="w-full pt-6 border-t border-zinc-900 space-y-4">
              <div className="flex flex-col items-center gap-1">
                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Rewards</p>
                <p className="text-xs font-bold text-amber-500">{t.rewards}</p>
              </div>
              
              <button className="w-full bg-white text-black py-3 rounded-xl font-black uppercase tracking-widest text-[10px] group-hover:bg-amber-400 transition-all">
                Enter Tournament
              </button>
            </div>

            {/* Background Glow */}
            <div className={`absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-[80px] opacity-20 ${
              t.difficulty === 'Easy' ? 'bg-green-500' :
              t.difficulty === 'Medium' ? 'bg-blue-500' :
              'bg-red-500'
            }`} />
          </motion.div>
        ))}
      </div>

      <button 
        onClick={() => setPhase('summary')}
        className="text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors"
      >
        <RotateCcw size={14} />
        Back to Summary
      </button>
    </div>
  );

  const renderBracket = () => {
    const qfMatches = currentRound === 'QF' ? bracket : [];
    const sfMatches = currentRound === 'SF' ? bracket : [];
    const fMatch = currentRound === 'F' ? bracket[0] : null;

    const isUserSideMatch = (matchId: string) => {
       const m = bracket.find(b => b.id === matchId);
       return m?.team1 === 'USER' || m?.team2 === 'USER';
    };

    return (
      <div className="flex-1 flex flex-col p-4 md:p-10 space-y-6 md:space-y-12 overflow-hidden relative bg-zinc-950">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 left-0 w-1/2 h-full bg-[radial-gradient(circle_at_10%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
          <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_90%_50%,rgba(239,68,68,0.1),transparent_70%)]" />
        </div>

        {/* Improved Header & Round Tracker */}
        <div className="flex flex-col gap-3 md:gap-6 shrink-0 z-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="w-8 h-8 md:w-12 md:h-12 bg-zinc-900 border border-zinc-800 rounded-lg md:rounded-2xl flex items-center justify-center transform -rotate-3 shadow-2xl relative">
                <Trophy size={18} className="text-amber-500 relative z-10 md:w-7 md:h-7" />
              </div>
              <div>
                <h2 className="text-sm md:text-5xl font-black italic uppercase text-white leading-none tracking-tighter drop-shadow-lg">{selectedTournament?.name}</h2>
              </div>
            </div>
          </div>

          <div className="max-w-xs w-full mx-auto flex items-center gap-1.5 md:gap-2">
            {['QF', 'SF', 'F'].map((r, i) => (
              <React.Fragment key={r}>
                <div className="flex flex-col items-center gap-0.5 flex-1">
                  <div className={`w-full h-0.5 md:h-1 rounded-full transition-all duration-500 ${
                    currentRound === r ? 'bg-amber-500' : 
                    (['SF', 'F'].includes(currentRound) && r === 'QF') || (currentRound === 'F' && r === 'SF') ? 'bg-zinc-700' : 'bg-zinc-900'
                  }`} />
                  <span className={`text-[6px] md:text-[8px] font-black uppercase tracking-widest ${currentRound === r ? 'text-amber-500' : 'text-zinc-700'}`}>
                    {r === 'QF' ? 'OCT' : r === 'SF' ? 'SEM' : 'FIN'}
                  </span>
                </div>
                {i < 2 && <div className="w-3 h-px bg-zinc-900 mb-2.5 md:mb-3" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* The New & Improved Bracket Tree */}
        <div className="flex-1 overflow-x-auto bracket-container flex items-center touch-pan-x" ref={bracketRef}>
          <div className="flex items-center gap-0 min-w-max px-[30vw] md:px-[40vw] relative h-[500px]">
            
            {/* --- WESTERN CONFERENCE (LEFT) --- */}
            <div className="flex items-center gap-12 md:gap-24 h-full py-10 relative">
              <div className="absolute -top-6 inset-x-0 text-center">
                 <div className="inline-flex flex-col items-center">
                   <div className="w-1 px-10 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent mb-2" />
                   <span className="text-[10px] font-black uppercase tracking-[0.8em] text-blue-500 italic">Western Conference</span>
                 </div>
              </div>

              {/* West Quarter Finals */}
              <div className="bracket-round gap-16 md:gap-24">
                {['qf1', 'qf2'].map((id, i) => {
                  const m = qfMatches.find(match => match.id === id);
                  const isActive = currentRound === 'QF' && isUserSideMatch(id) && m?.status === 'pending';
                  const isWinningMatch = m?.status === 'finished' && isUserSideMatch(id) && m?.winner === 'USER';
                  
                  return (
                    <div key={id} className="bracket-match-wrapper" data-match-id={id}>
                      <BracketMatchCard 
                        match={m || null} 
                        isUserMatch={isUserSideMatch(id)} 
                        onSimulate={() => m && simulateMatch(m.id)}
                        isSimulating={isSimulating && activeMatchId === id}
                        teamOVR={teamOVR}
                        isActive={isActive}
                      />
                      <BracketConnector 
                        type="west" 
                        round="qf" 
                        index={i} 
                        active={isWinningMatch} 
                      />
                    </div>
                  );
                })}
              </div>

              {/* West Semi Finals */}
              <div className="bracket-round">
                <div className="bracket-match-wrapper" data-match-id="sf1">
                  <BracketMatchCard 
                    match={sfMatches.find(m => m.id === 'sf1') || null} 
                    isUserMatch={isUserSideMatch('sf1')} 
                    onSimulate={() => simulateMatch('sf1')}
                    isSimulating={isSimulating && activeMatchId === 'sf1'}
                    teamOVR={teamOVR}
                    isActive={currentRound === 'SF' && isUserSideMatch('sf1') && sfMatches.find(m => m.id === 'sf1')?.status === 'pending'}
                  />
                  <BracketConnector 
                    type="west" 
                    round="sf" 
                    index={0} 
                    active={isUserSideMatch('sf1') && sfMatches.find(m => m.id === 'sf1')?.winner === 'USER'} 
                  />
                </div>
              </div>
            </div>

            {/* --- THE NBA CHAMPIONSHIP (CENTER) --- */}
            <div className="flex flex-col items-center justify-center px-12 md:px-24 relative min-w-[320px] md:min-w-[450px]" data-match-id="f1">
               <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[400px] w-full bg-amber-500/[0.05] rounded-full blur-[100px] pointer-events-none" />
               
               <div className="flex flex-col items-center gap-8 relative z-50">
                  <div className="flex flex-col items-center gap-2">
                     <motion.div 
                       initial={{ scale: 0, rotate: -45 }}
                       animate={{ scale: 1, rotate: 0 }}
                       className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-amber-400 to-amber-600 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_100px_rgba(245,158,11,0.5)] border-b-8 border-amber-800 sm:scale-110"
                     >
                       <Trophy size={48} className="text-black drop-shadow-xl" />
                     </motion.div>
                     <h3 className="text-4xl md:text-7xl font-black italic uppercase text-white tracking-tighter text-center scale-90 md:scale-100">NBA Finals</h3>
                     <div className="flex items-center gap-1.5 opacity-50">
                        <Sparkles size={12} className="text-amber-500" />
                        <span className="text-[9px] font-black text-white uppercase tracking-[0.5em]">World Series</span>
                        <Sparkles size={12} className="text-amber-500" />
                     </div>
                  </div>

                  <div className="relative group hover:scale-105 transition-transform duration-700">
                     {/* Horizontal line indicators */}
                     <div className="absolute -left-12 md:-left-24 top-1/2 w-12 md:w-24 h-px bg-zinc-800 z-0" />
                     <div className="absolute -right-12 md:-right-24 top-1/2 w-12 md:w-24 h-px bg-zinc-800 z-0" />
                     
                     <BracketMatchCard 
                       match={fMatch || null} 
                       isUserMatch={fMatch?.team1 === 'USER' || fMatch?.team2 === 'USER'} 
                       onSimulate={() => fMatch && simulateMatch(fMatch.id)}
                       isSimulating={isSimulating && activeMatchId === 'f1'}
                       teamOVR={teamOVR}
                       isActive={currentRound === 'F' && (fMatch?.team1 === 'USER' || fMatch?.team2 === 'USER') && fMatch?.status === 'pending'}
                       isFinal
                     />
                  </div>
               </div>
            </div>

            {/* --- EASTERN CONFERENCE (RIGHT) --- */}
            <div className="flex flex-row-reverse items-center gap-12 md:gap-20 h-full py-10 relative">
               <div className="absolute -top-4 inset-x-0 text-center">
                 <span className="text-[10px] font-black uppercase tracking-[0.6em] text-red-500/30">Eastern Division</span>
              </div>

              {/* East Quarter Finals */}
              <div className="bracket-round gap-16 md:gap-24">
                {['qf3', 'qf4'].map((id, i) => {
                  const m = qfMatches.find(match => match.id === id);
                  const isActive = currentRound === 'QF' && isUserSideMatch(id) && m?.status === 'pending';
                  const isWinningMatch = m?.status === 'finished' && isUserSideMatch(id) && m?.winner === 'USER';

                  return (
                    <div key={id} className="bracket-match-wrapper" data-match-id={id}>
                      <BracketMatchCard 
                        match={m || null} 
                        isUserMatch={isUserSideMatch(id)} 
                        onSimulate={() => m && simulateMatch(m.id)}
                        isSimulating={isSimulating && activeMatchId === id}
                        teamOVR={teamOVR}
                        isActive={isActive}
                      />
                      <BracketConnector 
                        type="east" 
                        round="qf" 
                        index={i} 
                        active={isWinningMatch} 
                      />
                    </div>
                  );
                })}
              </div>

              {/* East Semi Finals */}
              <div className="bracket-round">
                 <div className="bracket-match-wrapper" data-match-id="sf2">
                    <BracketMatchCard 
                      match={sfMatches.find(m => m.id === 'sf2') || null} 
                      isUserMatch={isUserSideMatch('sf2')} 
                      onSimulate={() => simulateMatch('sf2')}
                      isSimulating={isSimulating && activeMatchId === 'sf2'}
                      teamOVR={teamOVR}
                      isActive={currentRound === 'SF' && isUserSideMatch('sf2') && sfMatches.find(m => m.id === 'sf2')?.status === 'pending'}
                    />
                    <BracketConnector 
                      type="east" 
                      round="sf" 
                      index={0} 
                      active={isUserSideMatch('sf2') && sfMatches.find(m => m.id === 'sf2')?.winner === 'USER'} 
                    />
                 </div>
              </div>
            </div>

          </div>
        </div>

        {/* Floating Controls */}
        <AnimatePresence>
          {bracket.some(m => (m.team1 === 'USER' || m.team2 === 'USER') && m.status === 'pending') && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="absolute bottom-10 inset-x-0 flex justify-center z-[100]"
            >
              <button
                onClick={() => {
                  const userMatch = bracket.find(m => (m.team1 === 'USER' || m.team2 === 'USER') && m.status === 'pending');
                  if (userMatch) simulateMatch(userMatch.id);
                }}
                disabled={isSimulating}
                className="bg-white text-black h-16 px-12 rounded-[2rem] font-black uppercase tracking-[0.4em] text-xs shadow-[0_20px_60px_rgba(255,255,255,0.15)] flex items-center gap-4 hover:bg-amber-400 transition-all active:scale-95"
              >
                <Play size={20} fill="currentColor" />
                <span>Next Playoff Match</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Mobile Helper Text */}
        <div className="md:hidden flex justify-center text-[8px] font-bold text-zinc-700 uppercase tracking-widest gap-2">
          <ArrowLeft size={8} /> Swipe to navigate <ArrowRight size={8} />
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-black overflow-hidden flex flex-col relative">
      {/* Premium Desktop Ambience Background */}
      <div className="hidden lg:block absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black" />
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.05),transparent_70%)]" />
      </div>

      <AnimatePresence mode="wait">
        {phase === 'entry' && <motion.div key="entry" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col relative z-10">{renderEntry()}</motion.div>}
        {(phase === 'captain' || phase === 'starters' || phase === 'bench' || phase === 'review') && <motion.div key="board" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="flex-1 flex flex-col relative z-10">{renderDraftBoard()}</motion.div>}
        {phase === 'summary' && <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="flex-1 flex flex-col relative z-10">{renderSummary()}</motion.div>}
        {phase === 'tournament_selection' && <motion.div key="tournament" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="flex-1 flex flex-col relative z-10">{renderTournamentSelection()}</motion.div>}
        {phase === 'bracket' && <motion.div key="bracket" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="flex-1 flex flex-col relative z-10">{renderBracket()}</motion.div>}
      </AnimatePresence>

      <AnimatePresence>
        {(phase === 'captain' || currentOptions.length > 0) && renderSelection()}
      </AnimatePresence>

      <CardDetailModal 
        card={selectedCardForDetail} 
        onClose={() => setSelectedCardForDetail(null)} 
      />

      <TournamentSummaryModal 
        show={showTournamentSummary}
        position={finalPosition || ''}
        rewards={earnedRewards}
        onClaim={() => claimRewards('draft')}
        onClaimHome={() => claimRewards('home')}
        isSaving={isSaving}
      />

      <DraftAchievementsModal 
        isOpen={isDraftAchievementsOpen}
        onClose={() => setIsDraftAchievementsOpen(false)}
      />

      <AnimatePresence>
        {isLiveMatchActive && activeMatchId && (
          <LiveMatchSimulation 
            match={bracket.find(m => m.id === activeMatchId)!}
            starters={starters}
            teamOVR={teamOVR}
            benchOVR={benchOVR}
            onFinish={handleFinishMatch}
            onClose={() => setIsLiveMatchActive(false)}
          />
        )}
        {showBoxScore && renderBoxScore()}
      </AnimatePresence>

      {/* Match Result Modal Overlay */}
        <AnimatePresence>
          {matchResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="w-full max-w-md bg-zinc-950 border border-zinc-900 rounded-[3rem] p-10 text-center space-y-8 shadow-[0_0_100px_rgba(245,158,11,0.2)]"
              >
                <div className="space-y-2">
                  <h3 className="text-5xl font-black italic uppercase tracking-tighter text-white leading-none">
                    {matchResult.winner === 'Your Team' ? 'Victory!' : 'Defeat'}
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                    {matchResult.winner === 'Your Team' ? 'You advanced to the next round' : 'Your tournament run has ended'}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-zinc-600 uppercase mb-2">YOU</p>
                    <p className={`text-6xl font-black italic ${matchResult.winner === 'Your Team' ? 'text-white' : 'text-zinc-700'}`}>{matchResult.score1}</p>
                  </div>
                  <div className="text-4xl font-black italic text-zinc-800">VS</div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-zinc-600 uppercase mb-2">OPP</p>
                    <p className={`text-6xl font-black italic ${matchResult.winner !== 'Your Team' ? 'text-white' : 'text-zinc-700'}`}>{matchResult.score2}</p>
                  </div>
                </div>

                <button
                  onClick={advanceRound}
                  className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-amber-400 transition-all"
                >
                  <span>{matchResult.winner === 'Your Team' ? (currentRound === 'F' ? 'Claim Rewards' : 'Continue') : 'Exit Tournament'}</span>
                  <ArrowRight size={20} />
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
};

const BracketConnector = memo<{
  type: 'west' | 'east';
  round: 'qf' | 'sf';
  index: number;
  active?: boolean;
}>(({ type, round, index, active }) => {
  const isUp = index % 2 === 0;
  
  if (round === 'qf') {
    // Connects QF to SF
    return (
      <div className={`absolute ${type === 'west' ? '-right-10 md:-right-20' : '-left-10 md:-left-20'} top-1/2 -translate-y-1/2 w-10 md:w-20 h-24 pointer-events-none z-0`}>
        <svg width="100%" height="100%" viewBox="0 0 80 96" preserveAspectRatio="none">
          <path 
            d={type === 'west' 
              ? `M 0 48 L 40 48 L 40 ${isUp ? 96 : 0} L 80 ${isUp ? 96 : 0}`
              : `M 80 48 L 40 48 L 40 ${isUp ? 96 : 0} L 0 ${isUp ? 96 : 0}`
            }
            fill="none"
            stroke={active ? "rgb(245, 158, 11)" : "rgb(39, 39, 42)"}
            strokeWidth="2"
            strokeDasharray={active ? "none" : "4 2"}
          />
        </svg>
      </div>
    );
  }

  // Connects SF to Final (Straight lines usually)
  return (
    <div className={`absolute ${type === 'west' ? '-right-10 md:-right-24' : '-left-10 md:-left-24'} top-1/2 -translate-y-1/2 w-10 md:w-24 h-px pointer-events-none z-0`}>
      <div className={`w-full h-full ${active ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-zinc-800'}`} />
    </div>
  );
});
const BracketMatchCard = memo<{ 
  match: BracketMatch | null; 
  isUserMatch: boolean; 
  onSimulate: () => void; 
  isSimulating: boolean;
  teamOVR: number;
  isFinal?: boolean;
  isActive?: boolean;
}>(({ match, isUserMatch, onSimulate, isSimulating, teamOVR, isFinal, isActive }) => {
  if (!match) {
    return (
      <div className={`w-40 md:w-60 h-24 md:h-28 bg-zinc-900/10 border border-zinc-800/30 border-dashed rounded-xl md:rounded-2xl flex flex-col items-center justify-center gap-1.5 md:gap-2 opacity-20`}>
        <div className="w-8 h-8 md:w-10 md:h-10 bg-zinc-800/20 rounded-full" />
        <span className="text-[6px] md:text-[8px] font-black tracking-widest text-zinc-700 uppercase">Proximo Match</span>
      </div>
    );
  }

  const isFinished = match.status === 'finished';
  const getTeamName = (t: GhostTeam | 'USER') => t === 'USER' ? 'Your Team' : (t as GhostTeam)?.name || 'TBD';
  const getTeamOvr = (t: GhostTeam | 'USER') => t === 'USER' ? teamOVR : (t as GhostTeam)?.ovr || '??';
  
  const isWinner = (t: GhostTeam | 'USER') => match.winner === t;
  const isLoser = (t: GhostTeam | 'USER') => isFinished && match.winner !== t;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative ${isFinal ? 'w-56 md:w-80' : 'w-40 md:w-60'} transition-all duration-500 group z-10`}
    >
      <div className={`
        relative overflow-hidden rounded-xl md:rounded-2xl border transition-all duration-500
        ${isFinished ? 'bg-zinc-950/40 border-zinc-900/50 shadow-inner' : 
          isActive ? 'bg-zinc-900 border-amber-500/80 shadow-[0_0_30px_rgba(245,158,11,0.2)]' : 
          'bg-zinc-900/90 border-zinc-800/80'}
        ${isFinal ? 'scale-105 border-amber-500/40 shadow-[0_0_60px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20' : ''}
        ${isUserMatch && !isFinished ? 'bracket-glow-user' : ''}
      `}>
        {/* Progress indicator */}
        {!isFinished && isActive && (
          <div className="absolute top-0 left-0 w-full h-[2px] bg-amber-500 overflow-hidden">
            <motion.div 
               animate={{ x: ['-100%', '100%'] }}
               transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
               className="w-1/2 h-full bg-white/40 blur-sm"
            />
          </div>
        )}

        {/* Team 1 */}
        <div className={`
          flex items-center justify-between px-3 md:px-4 py-2.5 md:py-4 border-b border-zinc-800/30 transition-all
          ${isLoser(match.team1) ? 'opacity-30' : 'opacity-100'}
          ${isWinner(match.team1) ? 'bg-amber-500/5' : ''}
        `}>
          <div className="flex items-center gap-2 md:gap-3">
            <div className={`w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center text-[8px] md:text-[11px] font-black shadow-lg
              ${match.team1 === 'USER' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-500'}
            `}>
              {getTeamName(match.team1).substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className={`text-[8px] md:text-[11px] font-black uppercase italic tracking-tight truncate max-w-[60px] md:max-w-[110px] leading-none
                ${isWinner(match.team1) ? 'text-amber-500' : 'text-zinc-200'}
              `}>
                {getTeamName(match.team1)}
              </span>
              {!isFinished && <span className="text-[6px] md:text-[7px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">{getTeamOvr(match.team1)} OVR</span>}
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            {isFinished ? (
              <span className={`text-sm md:text-xl font-black italic tabular-nums ${isWinner(match.team1) ? 'text-white' : 'text-zinc-800'}`}>
                {match.score1}
              </span>
            ) : (
               <Shield size={10} className={match.team1 === 'USER' ? 'text-amber-500/50' : 'text-zinc-900'} />
            )}
            {isWinner(match.team1) && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                <Trophy size={11} className="text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              </motion.div>
            )}
          </div>
        </div>

        {/* Team 2 */}
        <div className={`
          flex items-center justify-between px-3 md:px-4 py-2.5 md:py-4 transition-all
          ${isLoser(match.team2) ? 'opacity-30' : 'opacity-100'}
          ${isWinner(match.team2) ? 'bg-amber-500/5' : ''}
        `}>
          <div className="flex items-center gap-2 md:gap-3">
            <div className={`w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center text-[8px] md:text-[11px] font-black shadow-lg
              ${match.team2 === 'USER' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-500'}
            `}>
              {getTeamName(match.team2).substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className={`text-[8px] md:text-[11px] font-black uppercase italic tracking-tight truncate max-w-[60px] md:max-w-[110px] leading-none
                ${isWinner(match.team2) ? 'text-amber-500' : 'text-zinc-200'}
              `}>
                {getTeamName(match.team2)}
              </span>
              {!isFinished && <span className="text-[6px] md:text-[7px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">{getTeamOvr(match.team2)} OVR</span>}
            </div>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            {isFinished ? (
              <span className={`text-sm md:text-xl font-black italic tabular-nums ${isWinner(match.team2) ? 'text-white' : 'text-zinc-800'}`}>
                {match.score2}
              </span>
            ) : (
              <Shield size={10} className={match.team2 === 'USER' ? 'text-amber-500/50' : 'text-zinc-900'} />
            )}
            {isWinner(match.team2) && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                 <Trophy size={11} className="text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              </motion.div>
            )}
          </div>
        </div>

        {/* Action Overlay */}
        {isActive && !isSimulating && (
          <button 
            onClick={onSimulate}
            className="absolute inset-0 bg-transparent hover:bg-amber-500/5 transition-colors flex items-center justify-center group/btn active:bg-amber-500/10"
          >
             <div className="bg-amber-500 text-black px-4 md:px-6 py-1.5 md:py-2 rounded-lg md:rounded-xl font-black uppercase italic text-[8px] md:text-[10px] tracking-widest opacity-0 group-hover/btn:opacity-100 transition-all transform translate-y-1 md:translate-y-2 group-hover/btn:translate-y-0 shadow-2xl">
               Play Match
             </div>
          </button>
        )}

        {/* Simulating View */}
        {isSimulating && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center gap-3">
             <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ height: [8, 16, 8] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.2 }}
                    className="w-1 bg-amber-500 rounded-full"
                  />
                ))}
             </div>
             <span className="text-[9px] font-black text-white uppercase tracking-[0.3em] animate-pulse">Live Game</span>
          </div>
        )}
      </div>

      {isActive && !isSimulating && (
        <motion.div 
          animate={{ x: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute -left-12 top-1/2 -translate-y-1/2 text-amber-500 hidden md:block"
        >
          <ArrowRight size={20} className="drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
        </motion.div>
      )}
    </motion.div>
  );
});

export default DraftView;
