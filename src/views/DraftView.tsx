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
  Home,
  Trash2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useGame } from '../context/GameContext';
import { useNotification } from '../context/NotificationContext';
import { useEngine } from '../hooks/useEngine';
import { Card } from '../types';
import { ALL_CARDS } from '../data/cards';
import CardDetailModal from '../components/CardDetailModal';
import CardItem from '../components/CardItem';
import StaticAd from '../components/StaticAd';
import { PlayerHeadshot } from '../components/PlayerHeadshot';

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
  team1: GhostTeam | 'USER' | null;
  team2: GhostTeam | 'USER' | null;
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
  min: number;
  stl: number;
  blk: number;
  fgm: number;
  fga: number;
  tov: number;
  team: 'USER' | 'OPP';
  isStarter: boolean;
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
  },
  {
    id: 'rookies',
    name: 'Rising Stars',
    difficulty: 'Medium',
    recommendedOvr: 80,
    rewards: '30,000 Coins + 3 Premium Rookie Packs',
    minOpponentOvr: 78,
    maxOpponentOvr: 85,
    opponentPool: ['Thunder Youths', 'Magic Future', 'Rockets Prospects', 'Pistons Young Core', 'Spurs Rookies', 'Hornets Prospects', 'Jazz Youths', 'Blazers Future']
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
  label: i < 5 ? 'BN' : 'RES', 
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
  },
  'Rising Stars': {
    champion: { coins: 30000, packs: [{ id: 'rookie-1', type: 'rookie', name: 'Premium Rookie Pack' }, { id: 'rookie-2', type: 'rookie', name: 'Premium Rookie Pack' }, { id: 'rookie-3', type: 'rookie', name: 'Premium Rookie Pack' }] },
    finalist: { coins: 15000, packs: [{ id: 'rookie-1', type: 'rookie', name: 'Premium Rookie Pack' }, { id: 'rookie-2', type: 'rookie', name: 'Premium Rookie Pack' }] },
    semis: { coins: 7500, packs: [{ id: 'rookie-1', type: 'rookie', name: 'Premium Rookie Pack' }] },
    quarters: { coins: 2000, packs: [] },
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
  const [screenSize, setScreenSize] = useState(() => {
    if (typeof window === 'undefined') return 'desktop';
    const w = window.innerWidth;
    if (w < 640) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  });

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 640) setScreenSize('mobile');
      else if (w < 1024) setScreenSize('tablet');
      else setScreenSize('desktop');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const cardWidth = useMemo(() => {
    if (mini) {
      if (screenSize === 'mobile') return 80;
      if (screenSize === 'tablet') return 95;
      return 105;
    } else {
      if (screenSize === 'mobile') return 105;
      if (screenSize === 'tablet') return 140;
      return 175;
    }
  }, [mini, screenSize]);

  return (
    <div 
      className={`relative group transition-all duration-500 w-full h-full aspect-[2.5/3.5] ${disabled ? 'opacity-40 pointer-events-none grayscale-[0.5]' : ''} ${isSelected ? 'scale-110 z-50' : ''}`}
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
          className="h-full w-full cursor-pointer"
          onClick={onClick}
        >
          <CardItem 
            card={slot.card} 
            isOwned={true} 
            width={cardWidth} 
            mode={mini ? 'mini' : 'large'}
          />
        </motion.div>
      ) : (
        <button 
          onClick={onClick}
          disabled={disabled}
          className="h-full w-full bg-zinc-900/30 border-2 border-dashed border-zinc-800/50 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-amber-500/50 hover:bg-zinc-900/60 transition-all relative overflow-hidden text-left"
        >
          {/* Ghost Card Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/10 to-transparent opacity-50" />
          
          <div className={`rounded-full bg-zinc-900/80 flex items-center justify-center text-zinc-600 group-hover:text-amber-500 group-hover:scale-110 transition-all shadow-inner mx-auto ${mini ? 'w-7 h-7' : 'w-10 h-10'}`}>
            <Zap size={mini ? 14 : 20} className={mini ? '' : 'fill-current opacity-20'} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`font-black text-white/10 ${mini ? 'text-xs' : 'text-xl'}`}>+</span>
            </div>
          </div>
          
          <span className={`font-black uppercase tracking-[0.2em] text-zinc-700 group-hover:text-amber-500/50 transition-colors text-center w-full block ${mini ? 'text-[7px]' : 'text-[10px]'}`}>
            {slot.position || slot.label}
          </span>

          {/* Decorative Corner Accents */}
          <div className="absolute top-1 left-1 w-1 h-1 border-t border-l border-zinc-800" />
          <div className="absolute top-1 right-1 w-1 h-1 border-t border-r border-zinc-800" />
          <div className="absolute bottom-1 left-1 w-1 h-1 border-b border-l border-zinc-800" />
          <div className="absolute bottom-1 right-1 w-1 h-1 border-b border-r border-zinc-800" />
        </button>
      )}
      
      {!slot.card && !disabled && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center shadow-lg animate-bounce z-10 pointer-events-none">
          <span className="text-black font-black text-[10px]">+</span>
        </div>
      )}
    </div>
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
          <div className="w-12 h-12 border-2 border-zinc-800 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 animate-pulse">Waiting for tip-off...</p>
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
  chemistry?: number;
  onFinish: (matchId: string, s1: number, s2: number, winner: any) => void;
  onClose: () => void;
}>(({ match, starters, teamOVR, benchOVR, chemistry = 0, onFinish, onClose }) => {
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

    const ovrDiff = t1Ovr - t2Ovr;
    const benchDiff = (t1BenchOvr - t2BenchOvr) / 2;
    
    const baseScore = 98 + Math.floor(Math.random() * 15);
    
    // Final scores based on OVR difference + Bench contribution + some controlled variance
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
              <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 space-y-5 md:space-y-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                {!interactiveResolution ? (
                  <>
                    <div className="text-center space-y-2 md:space-y-3">
                      <div className="inline-block px-3 md:px-4 py-1 bg-amber-500 text-black rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                        {activeInteractiveEvent.mechanic === 'choice' ? 'Decision Moment' : activeInteractiveEvent.mechanic === 'meter' ? 'Skill Check' : 'Rapid Action'}
                      </div>
                      <h3 className="text-lg md:text-2xl font-black italic uppercase text-white leading-tight">{activeInteractiveEvent.title}</h3>
                      <p className="text-zinc-400 font-medium text-xs md:text-base px-2">{activeInteractiveEvent.description}</p>
                    </div>

                    {activeInteractiveEvent.mechanic === 'choice' && (
                      <div className="grid grid-cols-1 gap-2 md:gap-3">
                        {activeInteractiveEvent.options?.map((opt, i) => (
                          <button key={i} onClick={() => handleInteractiveChoice(opt)} className="w-full p-3.5 md:p-4 bg-zinc-950 border border-zinc-800 rounded-xl md:rounded-2xl hover:border-amber-500 active:scale-[0.98] group transition-all text-left flex items-center justify-between">
                            <div>
                              <p className="text-[10px] md:text-sm font-black uppercase italic text-white group-hover:text-amber-500">{opt.label}</p>
                              <p className="text-[8px] md:text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                Risk: <span className={opt.risk === 'low' ? 'text-green-500' : opt.risk === 'medium' ? 'text-amber-500' : 'text-red-500'}>{opt.risk.toUpperCase()}</span>
                              </p>
                            </div>
                            <ArrowRight size={14} className="text-zinc-500 group-hover:text-amber-500 md:w-4 md:h-4" />
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

const generateOpponentRoster = (team: GhostTeam): Array<{ name: string; ovr: number; position: string; isStarter: boolean }> => {
  const positions = ['PG', 'SG', 'SF', 'PF', 'C', 'PG', 'SG', 'SF', 'PF', 'C', 'F-C', 'G-F'];
  const firstNames = ['James', 'Stephen', 'Anthony', 'Kevin', 'Luka', 'Nikola', 'Giannis', 'Joel', 'Jayson', 'Jaylen', 'Shai', 'Donovan', 'Kawhi', 'Kyrie', 'Damian', 'Devin', 'Tyrese', 'Jimmy', 'Bam', 'Lauri', 'Dearron', 'Domantas', 'Paolo', 'Chet', 'Victor', 'Ja', 'Zion', 'Brandon', 'Julius', 'Jalen', 'Kristaps', 'Derrick', 'Klay', 'Draymond', 'Russell', 'Paul', 'James', 'Austin', 'Malik', 'Bobby', 'Immanuel', 'Coby', 'Al', 'Naz', 'Caris'];
  const lastNames = ['Smith', 'James', 'Curry', 'Davis', 'Durant', 'Doncic', 'Jokic', 'Antetokounmpo', 'Embiid', 'Tatum', 'Brown', 'Gilgeous-Alexander', 'Mitchell', 'Leonard', 'Irving', 'Lillard', 'Booker', 'Haliburton', 'Butler', 'Adebayo', 'Markkanen', 'Fox', 'Sabonis', 'Banchero', 'Holmgren', 'Wembanyama', 'Morant', 'Williamson', 'Ingram', 'Randle', 'Brunson', 'Porzingis', 'White', 'Thompson', 'Green', 'Westbrook', 'George', 'Harden', 'Reaves', 'Monk', 'Portis', 'Quickley', 'White', 'Horford', 'Reid', 'LeVert'];

  // Real player rosters matching specific historic/standard opponent pools
  const teamSpecificNames: Record<string, string[]> = {
    'Celtics \'24': ['J. Tatum', 'J. Brown', 'K. Porzingis', 'D. White', 'J. Holiday', 'A. Horford', 'S. Hauser', 'P. Pritchard', 'L. Kornet', 'O. Brissett', 'S. Mykhailiuk', 'J. Springer'],
    'Warriors \'17': ['S. Curry', 'K. Thompson', 'K. Durant', 'D. Green', 'Z. Pachulia', 'A. Iguodala', 'S. Livingston', 'D. West', 'I. Clark', 'J. McGee', 'P. McCaw', 'K. Looney'],
    'Bulls \'96': ['M. Jordan', 'S. Pippen', 'D. Rodman', 'R. Harper', 'L. Longley', 'T. Kukoc', 'S. Kerr', 'B. Wennington', 'J. Caffey', 'R. Brown', 'D. Buechler', 'J. Salley'],
    'Lakers \'01': ['S. O\'Neal', 'K. Bryant', 'D. Fisher', 'R. Fox', 'H. Grant', 'R. Horry', 'B. Shaw', 'T. Lue', 'M. Madsen', 'D. George', 'G. Foster', 'R. Harper'],
    'Spurs \'14': ['T. Parker', 'D. Green', 'K. Leonard', 'T. Duncan', 'T. Splitter', 'M. Ginobili', 'B. Diaw', 'P. Mills', 'M. Belinelli', 'C. Joseph', 'A. Baynes', 'J. Ayres'],
    'Heat \'13': ['L. James', 'D. Wade', 'C. Bosh', 'M. Chalmers', 'U. Haslem', 'R. Allen', 'S. Battier', 'N. Cole', 'C. Andersen', 'J. Anthony', 'J. Jones', 'R. Lewis'],
    'Cavaliers \'16': ['L. James', 'K. Irving', 'K. Love', 'J. Smith', 'T. Thompson', 'R. Jefferson', 'I. Shumpert', 'M. Dellavedova', 'C. Frye', 'T. Mozgov', 'M. Williams', 'J. Jones'],
    'Bucks \'71': ['K. Abdul-Jabbar', 'O. Robertson', 'B. Dandridge', 'G. Smith', 'J. McGlocklin', 'L. Allen', 'R. Boozer', 'D. Awtrey', 'M. Freeman', 'A. Webb', 'R. Greacen', 'B. Paulk'],
  };

  const cleanTeamName = team.name.replace(/['"]/g, '').trim();
  let names = teamSpecificNames[cleanTeamName] || [];

  return Array.from({ length: 12 }).map((_, idx) => {
    let name = '';
    if (names[idx]) {
      name = names[idx];
    } else {
      const f = firstNames[Math.floor(Math.random() * firstNames.length)];
      const l = lastNames[Math.floor(Math.random() * lastNames.length)];
      name = `${f[0]}. ${l}`;
    }

    const pos = positions[idx];
    const isStarter = idx < 5;
    const baseOvr = isStarter ? team.ovr : team.benchOvr;
    const ovr = Math.min(99, Math.max(70, baseOvr + Math.floor(Math.random() * 6 - 3)));

    return { name, ovr, position: pos, isStarter };
  });
};

const generateRosterBoxScore = (
  players: Array<{ name: string; ovr: number; position: string; isStarter: boolean; cardId?: string; imageUrl?: string }>,
  totalScore: number,
  team: 'USER' | 'OPP'
): PlayerStats[] => {
  const count = players.length;
  
  // 1. Assign Minutes Played (MIN) to each player. Exact sum must be exactly 240.
  let rawMin: number[] = players.map((p, idx) => {
    if (idx < 5) return Math.floor(Math.random() * 7) + 29; // Starters get 29-35 mins
    if (idx < 10) return Math.floor(Math.random() * 6) + 11; // Key Bench gets 11-16 mins
    return Math.floor(Math.random() * 5) + 3; // Reserves get 3-7 mins
  });

  let sumMin = rawMin.reduce((a, b) => a + b, 0);
  let minDiff = 240 - sumMin;

  let iter = 0;
  while (minDiff !== 0 && iter < 100) {
    iter++;
    for (let i = 0; i < count && minDiff !== 0; i++) {
      const p = players[i];
      if (minDiff > 0) {
        const maxLimit = p.isStarter ? 38 : (i < 10 ? 22 : 10);
        if (rawMin[i] < maxLimit) {
          rawMin[i]++;
          minDiff--;
        }
      } else {
        const minLimit = p.isStarter ? 24 : (i < 10 ? 8 : 2);
        if (rawMin[i] > minLimit) {
          rawMin[i]--;
          minDiff++;
        }
      }
    }
  }

  // 2. Distribute points proportional to performance, minutes, and OVR. Sum must equal totalScore.
  const weights = players.map((p, idx) => {
    const ovrFactor = p.ovr / 100;
    const minFactor = rawMin[idx] / 48;
    const starterFactor = p.isStarter ? 1.4 : 0.8;
    const rand = 0.5 + Math.random() * 1.0;
    return ovrFactor * minFactor * starterFactor * rand;
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0) || 1;
  let rawPts = players.map((_, idx) => {
    const pct = weights[idx] / totalWeight;
    return Math.round(totalScore * pct);
  });

  let sumPts = rawPts.reduce((a, b) => a + b, 0);
  let ptsDiff = totalScore - sumPts;

  let ptsIter = 0;
  while (ptsDiff !== 0 && ptsIter < 200) {
    ptsIter++;
    for (let i = 0; i < count && ptsDiff !== 0; i++) {
      if (ptsDiff > 0) {
        rawPts[i]++;
        ptsDiff--;
      } else {
        if (rawPts[i] > 0) {
          rawPts[i]--;
          ptsDiff++;
        }
      }
    }
  }

  // 3. Populate detailed realistic stats
  return players.map((p, idx) => {
    const mins = rawMin[idx];
    const pts = rawPts[idx];
    const ovr = p.ovr;
    const pos = p.position;

    // Field Goal attempts and completions
    let fga = 0;
    let fgm = 0;
    if (pts > 0) {
      fga = Math.max(Math.round(pts * 0.75 + Math.random() * 3), 1);
      fgm = Math.min(Math.round(pts / 2.2 + Math.random() * 0.6), fga);
      if (fgm === 0 && pts > 0) fgm = 1;
    } else {
      fga = Math.floor(Math.random() * 3);
    }

    // Position-specific rebounding profile
    let rebBase = 2;
    if (pos.includes('C')) rebBase = 8;
    else if (pos.includes('PF')) rebBase = 6;
    else if (pos.includes('SF')) rebBase = 3.5;
    else if (pos.includes('SG')) rebBase = 1.8;
    
    const rebounds = Math.round((rebBase * (mins / 30) * (0.6 + Math.random() * 0.8)) + (ovr / 40));

    // Position-specific playmaking profile
    let astBase = 1.5;
    if (pos.includes('PG')) astBase = 6.5;
    else if (pos.includes('SG')) astBase = 3.8;
    else if (pos.includes('SF')) astBase = 2.6;

    const assists = Math.round((astBase * (mins / 30) * (0.6 + Math.random() * 0.8)) + (ovr / 50));

    // Steals, Blocks, and Turnovers
    const steals = Math.floor(Math.random() * ((mins / 15) * 1.2) + (pos.includes('G') ? 0.8 : 0));
    const blocks = Math.floor(Math.random() * ((mins / 15) * 1.0) + (pos.includes('C') || pos.includes('PF') ? 0.9 : 0));
    const turnovers = Math.floor(Math.random() * (mins / 11) + 1);

    return {
      cardId: p.cardId || `stats-${team}-${idx}-${Date.now()}`,
      name: p.name,
      imageUrl: p.imageUrl || '',
      pts,
      reb: Math.max(0, rebounds),
      ast: Math.max(0, assists),
      ovr,
      position: pos,
      min: mins,
      stl: Math.max(0, steals),
      blk: Math.max(0, blocks),
      fgm,
      fga,
      tov: Math.max(0, turnovers),
      team,
      isStarter: p.isStarter
    };
  });
};

const DraftView: React.FC = () => {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const { 
    coins, 
    spendCoins, 
    setCurrentView, 
    addCoins, 
    addToCollection,
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
  const [shouldAutoStartCaptain, setShouldAutoStartCaptain] = useState(false);
  const [isDraftAchievementsOpen, setIsDraftAchievementsOpen] = useState(false);
  const [pickingCardId, setPickingCardId] = useState<string | null>(null);
  const [isBenchOpen, setIsBenchOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const lastClickRef = useRef<{ id: string; time: number } | null>(null);

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
  const [mobileRoundTab, setMobileRoundTab] = useState<'QF' | 'SF' | 'F'>('QF');

  useEffect(() => {
    setMobileRoundTab(currentRound);
  }, [currentRound]);

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
  const [activeBoxScoreTeam, setActiveBoxScoreTeam] = useState<'USER' | 'OPP'>('USER');
  const [boxScoreTab, setBoxScoreTab] = useState<'players' | 'comparison'>('players');

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
    // Only the first 5 slots of the bench (Banquillo) count for the rating of the team
    const mainBenchSlots = bench.slice(0, 5);
    const benchPlayers = mainBenchSlots.map(s => s.card).filter(Boolean) as Card[];
    
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
        const img = document.createElement('img');
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
        // Simulate ad watch time - shortened for much better game fluidity
        await new Promise(resolve => setTimeout(resolve, 1200));
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
    setIsSimulating(false);
    setMatchResult(null);
    setIsLiveMatchActive(false);
    setActiveMatchId(null);
    setBoxScore([]);
    setShowBoxScore(false);
    setShowTournamentSummary(false);
    setFinalPosition(null);
    setEarnedRewards(null);
    setIsWatchingAd(false);
    setShouldAutoStartCaptain(false);
    setPickingCardId(null);
    setIsBenchOpen(false);
    
    if (targetView === 'home') {
      setCurrentView('home');
    }
  };

  const handleSelectCard = async (card: Card) => {
    setPickingCardId(card.id);
    
    // Let the epic pick micro-interaction play out (glow, zoom, sparkles)
    await new Promise(resolve => setTimeout(resolve, 800));
    setPickingCardId(null);

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

      // Reserves are now integrated and always visible, no visibility toggling needed
      
      if (allStartersFilled && !allBenchFilled) {
        setPhase('bench');
        setIsBenchOpen(true);
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
    if (slot.id.startsWith('bench')) {
      setIsBenchOpen(true);
    }

    const now = Date.now();
    const isDoubleClick = lastClickRef.current && 
                          lastClickRef.current.id === slot.id && 
                          (now - lastClickRef.current.time) < 300;

    lastClickRef.current = { id: slot.id, time: now };

    if (isDoubleClick) {
      if (slot.card) {
        setSelectedCardForDetail(slot.card);
        setSwapSource(null);
      }
      return;
    }

    // Single click handling
    if (slot.card) {
      if (!swapSource) {
        setSwapSource(slot.id);
      } else if (swapSource === slot.id) {
        setSwapSource(null);
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
      }
      return;
    }

    // Slot is empty
    if (swapSource) {
      // Perform Swap (move player to empty slot)
      const sourceId = swapSource;
      const targetId = slot.id;
      
      let newStarters = [...starters];
      let newBench = [...bench];
      
      const sourceInStarters = starters.find(s => s.id === sourceId);
      const targetInStarters = starters.find(s => s.id === targetId);
      
      const sourceInBench = bench.find(b => b.id === sourceId);
      const targetInBench = bench.find(b => b.id === targetId);
      
      const sourceCard = sourceInStarters?.card || sourceInBench?.card;
      const targetCard = targetInStarters?.card || targetInBench?.card; // will be null
      
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
      return;
    }

    // Drafting logic: only allow clicking empty slots if in the right phase
    const isFirstPick = starters.every(s => !s.card) && bench.every(b => !b.card);

    if ((phase === 'starters' && starters.some(s => s.id === slot.id)) || 
        (phase === 'bench' && bench.some(b => b.id === slot.id))) {
      setActiveSlotId(slot.id);
      
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
    
    const initialBracket: BracketMatch[] = [
      { id: 'qf1', team1: 'USER', team2: opponents[0], winner: null, status: 'pending' },
      { id: 'qf2', team1: opponents[1], team2: opponents[2], winner: null, status: 'pending' },
      { id: 'qf3', team1: opponents[3], team2: opponents[4], winner: null, status: 'pending' },
      { id: 'qf4', team1: opponents[5], team2: opponents[6], winner: null, status: 'pending' },
      { id: 'sf1', team1: null, team2: null, winner: null, status: 'pending' },
      { id: 'sf2', team1: null, team2: null, winner: null, status: 'pending' },
      { id: 'f1', team1: null, team2: null, winner: null, status: 'pending' },
    ];
    
    setBracket(initialBracket);
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

    // Box Score Generation: Distribute points and generate stats for BOTH User and Opponent rosters
    const isUserTeam1 = match.team1 === 'USER';
    const userScore = isUserTeam1 ? s1 : s2;
    const oppScore = isUserTeam1 ? s2 : s1;
    const oppTeam = isUserTeam1 ? (match.team2 as GhostTeam) : (match.team1 as GhostTeam);

    // 1. Prepare User players list (combining starters & bench)
    const userPlayers = [
      ...starters.map(s => ({
        name: s.card?.name || 'Unknown',
        ovr: s.card?.stats.ovr || 75,
        position: s.position || 'PG',
        isStarter: true,
        cardId: s.id,
        imageUrl: s.card?.imageUrl || ''
      })),
      ...bench.map((b, idx) => ({
        name: b.card?.name || `Bench ${idx + 1}`,
        ovr: b.card?.stats.ovr || 70,
        position: b.card?.position || 'G-F',
        isStarter: false,
        cardId: b.id,
        imageUrl: b.card?.imageUrl || ''
      }))
    ].filter(p => p.name !== 'Unknown'); // Only players drafted

    // 2. Prepare Opponent players list
    const oppPlayers = generateOpponentRoster(oppTeam);

    // 3. Generate Box Scores for both teams
    const userBoxScore = generateRosterBoxScore(userPlayers, userScore, 'USER');
    const oppBoxScore = generateRosterBoxScore(oppPlayers, oppScore, 'OPP');

    // 4. Store combined stats in the boxScore state
    setBoxScore([...userBoxScore, ...oppBoxScore]);
  }, [bracket, selectedTournament, teamOVR, starters, bench, unlockAchievement, notify]);

  const handleTournamentEnd = async (position: 'quarters' | 'semis' | 'finalist' | 'champion') => {
    if (!selectedTournament) return;
    const baseRewards = REWARDS[selectedTournament.name as keyof typeof REWARDS][position];
    const rewards = JSON.parse(JSON.stringify(baseRewards));
    
    // Add one random drafted card as a reward if they reach finals
    if (position === 'champion' || position === 'finalist') {
      const allDraftedCards = [...starters, ...bench].map(s => s.card).filter(Boolean) as Card[];
      const preservedCard = allDraftedCards[Math.floor(Math.random() * allDraftedCards.length)];
      if (preservedCard) {
        rewards.packs.push({ 
          id: `draft-reward-${preservedCard.id}`, 
          type: 'special_item', 
          name: `Draft Card: ${preservedCard.name}`,
          isDirectCard: true,
          card: preservedCard
        });
      }
    }

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
      const currentInventory = JSON.parse(JSON.stringify(inventoryPacks));
      const collectionUpdates: string[] = [];

      for (const item of earnedRewards.packs) {
        if ((item as any).isDirectCard && (item as any).card) {
          collectionUpdates.push((item as any).card.id);
        } else {
          const existing = currentInventory.find((p: any) => p.type === item.type);
          if (existing) {
            existing.count = (existing.count || 1) + 1;
          } else {
            currentInventory.push({ 
              id: item.type, 
              type: item.type, 
              name: item.name, 
              count: 1 
            });
          }
        }
      }

      await updateGameStateAsync({
        coins: coins + earnedRewards.coins,
        inventoryPacks: currentInventory
      });

      if (collectionUpdates.length > 0) {
        await addToCollection(collectionUpdates);
      }
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
    const simulateGhostMatch = (m: BracketMatch): BracketMatch => {
      if (m.winner) return m;
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
      
      const winner = t1Score > t2Score ? m.team1 : (t1Score < t2Score ? m.team2 : (Math.random() > 0.5 ? m.team1 : m.team2));
      return {
        ...m,
        score1: t1Score,
        score2: t2Score,
        winner,
        status: 'finished'
      };
    };

    if (currentRound === 'QF') {
      // Simulate other QF matches: qf2, qf3, qf4
      const updatedBracket = bracket.map(m => {
        if (m.id === 'qf1') return m; // User match is already finished
        if (m.id.startsWith('qf')) {
          return simulateGhostMatch(m);
        }
        return m;
      });

      // Find winners of the 4 QF matches
      const qf1Winner = updatedBracket.find(m => m.id === 'qf1')?.winner || 'USER';
      const qf2Winner = updatedBracket.find(m => m.id === 'qf2')?.winner!;
      const qf3Winner = updatedBracket.find(m => m.id === 'qf3')?.winner!;
      const qf4Winner = updatedBracket.find(m => m.id === 'qf4')?.winner!;

      // Populate Semis (sf1 and sf2)
      const finalBracket = updatedBracket.map(m => {
        if (m.id === 'sf1') {
          return { ...m, team1: qf1Winner, team2: qf2Winner, status: 'pending' as const };
        }
        if (m.id === 'sf2') {
          return { ...m, team1: qf3Winner, team2: qf4Winner, status: 'pending' as const };
        }
        return m;
      });

      setBracket(finalBracket);
      setCurrentRound('SF');
    } else if (currentRound === 'SF') {
      // Simulate other SF match (sf2)
      const updatedBracket = bracket.map(m => {
        if (m.id === 'sf1') return m; // User match is already finished
        if (m.id === 'sf2') {
          return simulateGhostMatch(m);
        }
        return m;
      });

      // Find winners of the 2 SF matches
      const sf1Winner = updatedBracket.find(m => m.id === 'sf1')?.winner || 'USER';
      const sf2Winner = updatedBracket.find(m => m.id === 'sf2')?.winner!;

      // Populate Finals
      const finalBracket = updatedBracket.map(m => {
        if (m.id === 'f1') {
          return { ...m, team1: sf1Winner, team2: sf2Winner, status: 'pending' as const };
        }
        return m;
      });

      setBracket(finalBracket);
      setCurrentRound('F');
    } else {
      // Won the final!
      setPhase('summary');
    }
  };

  const renderEntry = () => (
    <div className="flex-1 flex flex-col items-center justify-start py-8 px-4 md:p-10 text-center relative w-full min-h-full overflow-y-auto scrollbar-hide select-none bg-radial from-zinc-900/50 to-black">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-amber-500/[0.08] blur-[80px]" />
        <div className="absolute bottom-10 left-10 w-60 h-60 rounded-full bg-blue-500/[0.05] blur-[100px]" />
        
        {/* Animated Golden Particle Dust */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 400 - 200, 
              y: Math.random() * 500 + 200, 
              opacity: Math.random() * 0.4 + 0.1, 
              scale: Math.random() * 0.5 + 0.5 
            }}
            animate={{ 
              y: -100, 
              opacity: [0, 0.4, 0] 
            }}
            transition={{ 
              duration: 8 + Math.random() * 6, 
              repeat: Infinity, 
              delay: i * 1.2, 
              ease: "linear" 
            }}
            className="absolute left-1/2 top-0 w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]"
          />
        ))}
      </div>

      {isWatchingAd && (
        <div className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center space-y-6 md:space-y-8 select-none">
          <div className="relative">
            <div className="w-16 h-16 border-2 border-zinc-800 border-t-amber-500 rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-amber-500 animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-white font-black uppercase tracking-[0.3em] text-sm animate-pulse">WATCHING SPONSOR VIDEO...</p>
            <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mt-2">REDEEMING FREE DRAFT ENTRY...</p>
          </div>
          <div className="mt-8 scale-75 md:scale-90 px-4">
             <StaticAd position="footer" />
          </div>
        </div>
      )}

      {/* Main Container with Entrance Animation */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg flex flex-col items-center space-y-6 md:space-y-8 my-auto"
      >
        {/* Animated Championship Badge */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-700 animate-pulse" />
          <motion.div 
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-b from-zinc-900 to-black rounded-3xl flex items-center justify-center border-b-4 border-amber-500 shadow-[0_15px_30px_rgba(0,0,0,0.6)] relative overflow-hidden"
          >
            {/* Spotlight reflection */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full animate-shine" />
            <Trophy size={isMobile ? 40 : 46} className="text-amber-500 drop-shadow-[0_4px_12px_rgba(245,158,11,0.4)]" />
          </motion.div>
        </div>
        
        {/* Title Block */}
        <div className="space-y-2">
          <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-none">
            Hoops <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">Draft</span>
          </h2>
          <p className="text-[9px] md:text-xs font-bold uppercase tracking-[0.3em] text-amber-500/80 italic">
            Draft Tournament & Playoff Brackets
          </p>
        </div>

        {/* Collapsible Rules & Rewards Block */}
        <div className="w-full max-w-sm border border-zinc-850/60 rounded-2xl bg-zinc-950/40 backdrop-blur-sm overflow-hidden transition-all duration-300">
          <button
            onClick={() => setShowRules(!showRules)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-900/40 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-zinc-300">How to Play & Rewards</span>
            </div>
            {showRules ? (
              <ChevronUp size={14} className="text-amber-500 shrink-0" />
            ) : (
              <ChevronDown size={14} className="text-amber-500 shrink-0" />
            )}
          </button>
          
          <AnimatePresence initial={false}>
            {showRules && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden border-t border-zinc-900/60"
              >
                <div className="p-3.5 space-y-3 text-left">
                  <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50 space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-500">
                      <Users size={13} />
                      <h4 className="text-[9px] font-black uppercase tracking-wider">Draft Your Lineup</h4>
                    </div>
                    <p className="text-[9px] text-zinc-400 leading-relaxed">
                      Select an elite Captain, then fill out your starting lineup and bench strategically.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/50 space-y-1">
                    <div className="flex items-center gap-1.5 text-blue-400">
                      <Shield size={13} />
                      <h4 className="text-[9px] font-black uppercase tracking-wider">Playoff Bracket</h4>
                    </div>
                    <p className="text-[9px] text-zinc-400 leading-relaxed">
                      Compete in single-elimination conference rounds. One loss and you are eliminated.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-zinc-900/30 border border-zinc-850/50 flex items-center justify-between gap-2.5">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-emerald-400">
                        <Trophy size={13} />
                        <h4 className="text-[9px] font-black uppercase tracking-wider">Exclusive Rewards</h4>
                      </div>
                      <p className="text-[9px] text-zinc-400 leading-tight">
                        Earn up to 150,000 Coins and premium MVP/Hall of Fame packs by winning.
                      </p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-1.5 text-center shrink-0">
                      <span className="block text-[6px] font-black text-zinc-500 uppercase tracking-widest leading-none">MAX REWARD</span>
                      <span className="text-[10px] font-black text-emerald-400 italic">150K + PACKS</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full max-w-xs pt-2">
          {/* Main Draft Button */}
          <button 
            onClick={() => handleStartDraft('coins')}
            disabled={coins < DRAFT_COST || isSaving || isWatchingAd}
            className="group relative w-full bg-gradient-to-r from-amber-500 to-amber-400 text-black py-3.5 rounded-2xl font-black uppercase tracking-[0.12em] text-[11px] flex items-center justify-center gap-2.5 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 disabled:pointer-events-none active:scale-95 shadow-[0_10px_25px_rgba(245,158,11,0.25)] hover:shadow-[0_15px_30px_rgba(245,158,11,0.4)] transition-all duration-300 border-t border-white/20"
          >
            {/* Pulsing button overlay */}
            <div className="absolute inset-0 rounded-2xl border-2 border-white/0 group-hover:border-white/10 group-hover:scale-[1.03] transition-all duration-300" />
            <Coins size={14} className="animate-bounce" />
            <span>{isSaving ? 'Processing...' : `Enter: ${DRAFT_COST.toLocaleString()} Coins`}</span>
          </button>
          
          {/* Ad / Premium Entry Button */}
          <button 
            onClick={() => handleStartDraft('ad')}
            disabled={isSaving || isWatchingAd}
            className="group relative w-full bg-zinc-950 text-white border border-zinc-800 py-3.5 rounded-2xl font-black uppercase tracking-[0.08em] text-[11px] flex items-center justify-center gap-2.5 hover:bg-zinc-900 hover:border-zinc-700 transition-all disabled:opacity-50 active:scale-95 shadow-lg"
          >
            <Play size={14} className="text-amber-500 group-hover:scale-110 transition-transform" />
            <span>{isPremium ? 'Free Entry (Premium)' : 'Watch Ad to Enter'}</span>
          </button>

          {/* Draft Achievements Button */}
          <button 
            onClick={() => setIsDraftAchievementsOpen(true)}
            className="group relative w-full bg-zinc-900/40 text-amber-500 border border-amber-500/10 py-2.5 rounded-xl font-black uppercase tracking-wider text-[9px] flex items-center justify-center gap-2 hover:bg-amber-500/10 hover:border-amber-500/25 transition-all active:scale-95 shadow-md"
          >
            <Trophy size={11} className="group-hover:rotate-12 transition-transform" />
            <span>View Draft Achievements</span>
          </button>

          {/* Exit / Return to Main Menu Button */}
          <button 
            onClick={() => setCurrentView('home')}
            className="group relative w-full bg-zinc-900/80 text-zinc-400 border border-zinc-800/60 py-2.5 rounded-xl font-black uppercase tracking-wider text-[9px] flex items-center justify-center gap-2 hover:bg-zinc-800 hover:text-white transition-all active:scale-95 shadow-md"
          >
            <ArrowLeft size={11} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Main Menu</span>
          </button>
        </div>

        {/* Sponsored Content / Ad banner */}
        {!isPremium && (
          <div className="pt-2 flex flex-col items-center gap-2 w-full">
            <p className="text-[7px] font-bold text-zinc-600 uppercase tracking-widest">Sponsored Content</p>
            <div className="w-full max-w-sm flex justify-center opacity-70 hover:opacity-100 transition-opacity">
              <StaticAd position="footer" />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );

  const renderDraftBoard = () => {
    return (
      <div className="h-[100dvh] w-full flex flex-col bg-zinc-950 overflow-hidden relative">
        {/* Background Ambience for Desktop */}
        <div className="hidden lg:block absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black" />
          <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/basketball/1920/1080')] bg-cover bg-center blur-xl" />
        </div>

        {/* --- AD BANNER ABOVE HEADER --- */}
        {!isPremium && <StaticAd position="header" />}

        {/* Simplified Header Bar with Rating & Exit */}
        <div className="w-full bg-zinc-900/95 backdrop-blur-3xl border-b border-white/5 py-1.5 px-3 flex items-center justify-between gap-3 z-50 relative shadow-2xl">
          <div className="flex items-center gap-1.5 shrink-0">
             <Trophy size={13} className="text-amber-500 shrink-0" />
             <span className="text-[11px] font-black tracking-tight text-white uppercase italic leading-none shrink-0">
                Hoops <span className="text-amber-500">Draft</span>
             </span>
          </div>

          {/* Rating Badge */}
          <div className="flex items-center gap-1 bg-zinc-950/80 border border-zinc-850 rounded px-2 py-0.5 shadow-sm">
             <span className="text-[8px] font-black text-zinc-500 uppercase leading-none">Rating</span>
             <span className="text-[11px] font-black text-amber-400 italic leading-none">{teamOVR}</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
             <button 
                onClick={() => setShowResetConfirm(true)}
                title="Reset Draft"
                className="p-1.5 bg-red-950/30 border border-red-900/30 text-red-400 hover:bg-red-900/25 hover:text-red-300 rounded-lg transition-all active:scale-95 shadow-md shrink-0 flex items-center justify-center"
             >
                <RotateCcw size={12} />
             </button>
             <button 
                onClick={() => setCurrentView('home')}
                title="Exit"
                className="p-1.5 bg-zinc-900 border border-zinc-850 text-zinc-400 hover:bg-zinc-800 hover:text-white rounded-lg transition-all active:scale-95 shadow-md shrink-0 flex items-center justify-center"
             >
                <ArrowLeft size={12} />
             </button>
          </div>
        </div>

        {/* Reset Confirmation Overlay inside Board for bulletproof rendering in iframe */}
        <AnimatePresence>
          {showResetConfirm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[1000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-6 max-w-sm w-full text-center space-y-6 shadow-2xl relative"
              >
                <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
                  <RotateCcw size={20} className="animate-spin-slow" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase tracking-tight text-white italic">Reset Draft?</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">
                    Are you sure you want to restart the draft and tournament? You will lose all your current progress.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white py-3 rounded-xl font-black uppercase tracking-wider text-[10px] transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      setShowResetConfirm(false);
                      resetDraftState('entry');
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-black uppercase tracking-wider text-[10px] transition-all shadow-lg shadow-red-500/10"
                  >
                    Confirm Reset
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Court Container taking up 100% of available screen space below header */}
        <div className="flex-1 w-full relative overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-950 z-10">
          {/* Inline Basketball Half-Court Line Art Overlay */}
          <div className="absolute inset-0 opacity-[0.12] pointer-events-none z-0">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              {/* Outer boundary */}
              <rect x="0" y="0" width="100" height="100" fill="none" stroke="white" strokeWidth="0.5" />
              {/* Midcourt line at the top (y=0) */}
              <line x1="0" y1="0" x2="100" y2="0" stroke="white" strokeWidth="1" />
              {/* Center Circle at the top (y=0) */}
              <path d="M 35 0 A 15 15 0 0 0 65 0" fill="none" stroke="white" strokeWidth="0.5" />
              {/* The Paint / Key at the bottom (x: 34 to 66, y: 64 to 100) */}
              <rect x="34" y="64" width="32" height="36" fill="none" stroke="white" strokeWidth="0.5" />
              {/* Free throw circle at top of paint (y=64) */}
              <path d="M 34 64 A 16 16 0 0 1 66 64" fill="none" stroke="white" strokeWidth="0.5" />
              {/* Three-Point Arc (basket is at x=50, y=92) */}
              {/* Straight line on left: from bottom (y=100) to y=86, at x=10 */}
              <line x1="10" y1="100" x2="10" y2="86" stroke="white" strokeWidth="0.5" />
              {/* Straight line on right: from bottom (y=100) to y=86, at x=90 */}
              <line x1="90" y1="100" x2="90" y2="86" stroke="white" strokeWidth="0.5" />
              {/* Arc connecting the straight lines */}
              <path d="M 10 86 A 42 42 0 0 1 90 86" fill="none" stroke="white" strokeWidth="0.5" />
              {/* Backboard: line at y=92, from x=44 to 56 */}
              <line x1="44" y1="92" x2="56" y2="92" stroke="white" strokeWidth="0.8" />
              {/* Rim: circle centered at x=50, y=92, with radius 2 */}
              <circle cx="50" cy="90.5" r="2.5" fill="none" stroke="white" strokeWidth="0.5" />
            </svg>
          </div>

          {/* Left Stats Panel - Floating on Desktop (Overlay) */}
          <div className="hidden lg:flex absolute left-6 top-6 w-44 flex-col gap-3 z-30 bg-zinc-950/85 backdrop-blur-md border border-zinc-800/50 rounded-2xl p-4 shadow-2xl">
            <div className="text-center group">
              <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-amber-500 transition-colors">Starters Avg</p>
              <p className="text-2xl font-black italic text-amber-500 mt-1">
                {Math.round(starters.reduce((acc, s) => acc + (s.card?.stats.ovr || 0), 0) / starters.filter(s => s.card).length || 0)}
              </p>
            </div>
            <div className="w-full h-px bg-white/5" />
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-tighter text-white italic">DRAFT SQUAD</p>
              <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">
                {phase === 'starters' ? 'Starting Five' : phase === 'bench' ? 'Reserves' : 'Finished'}
              </p>
            </div>
            <div className="w-full h-px bg-white/5" />
            <div className="flex flex-col gap-1 text-center">
              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Draft Progress</p>
              <p className="text-xs font-bold text-amber-500">
                {starters.filter(s => s.card).length + bench.filter(b => b.card).length} / 12 Choices
              </p>
            </div>
            <div className="w-full h-px bg-white/5" />
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <p className="text-[7px] font-black text-zinc-500 uppercase tracking-widest">ACTIVE SESSION</p>
            </div>
          </div>

          {/* Tactical Starting Five Grid using Coordinate Positioning */}
          <div className="relative z-10 w-full h-full overflow-visible">
            {/* Starter slots positioned using coordinates */}
            {[
               { slot: starters[0], style: { top: '18%', left: '50%' } }, // PG
               { slot: starters[1], style: { top: '38%', left: '78%' } }, // SG
               { slot: starters[2], style: { top: '38%', left: '22%' } }, // SF
               { slot: starters[3], style: { top: '68%', left: '24%' } }, // PF
               { slot: starters[4], style: { top: '68%', left: '76%' } }  // C
            ].map(({ slot, style }) => (
               <div 
                  key={slot.id} 
                  style={style} 
                  className="absolute w-[24%] sm:w-[20%] md:w-[17%] lg:w-[15%] xl:w-[13%] aspect-[2.5/3.5] -translate-x-1/2 -translate-y-1/2 z-10 hover:z-20 transition-all duration-300"
               >
                  <Slot 
                     slot={slot} 
                     onClick={() => handleSlotClick(slot)} 
                     isSelected={swapSource === slot.id || activeSlotId === slot.id}
                  />
               </div>
            ))}
          </div>

          {/* Squad Review Button Overlay (Visible when drawer is closed or floating) */}
          {phase === 'review' && !isBenchOpen && (
            <div className="absolute inset-x-0 bottom-14 flex justify-center z-40 px-8">
              <motion.button
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                onClick={() => setPhase('summary')}
                className="w-full max-w-xs bg-amber-500 text-black py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(245,158,11,0.35)] hover:bg-amber-400 transition-all active:scale-95 border-t border-white/25"
              >
                <span>Finish Draft and Play</span>
                <ArrowRight size={18} />
              </motion.button>
            </div>
          )}

          {/* Unified Bottom Sheet for Bench & Reserves (Does not compress court!) */}
          <AnimatePresence>
            {isBenchOpen ? (
              <>
                {/* Backdrop Click to close bench on outside tap */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsBenchOpen(false)}
                  className="absolute inset-0 bg-black/45 backdrop-blur-sm z-40 cursor-pointer"
                />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                  className="absolute bottom-0 inset-x-0 bg-zinc-950/98 backdrop-blur-xl border-t border-zinc-900/60 rounded-t-xl shadow-[0_-15px_40px_rgba(0,0,0,0.9)] z-50 flex flex-col px-3 pt-1 pb-2 w-full h-[195px] sm:h-[245px] md:h-[305px] overflow-hidden"
                >
                  {/* Pull handle indicator */}
                  <div 
                    className="w-8 h-0.5 bg-zinc-800 hover:bg-zinc-700 rounded-full mx-auto mb-1 cursor-pointer transition-colors shrink-0" 
                    onClick={() => setIsBenchOpen(false)} 
                  />
                  
                  {/* Header inside drawer - Extremely Minimalist Row Centered */}
                  <div className="flex items-center justify-center mb-0.5 shrink-0 px-1 h-3.5 sm:h-4">
                    <span className="text-[5px] sm:text-[5.5px] font-black uppercase tracking-widest text-zinc-600">BENCH ({bench.filter(b => b.card).length}/7)</span>
                  </div>

                  {/* Horizontal Carousel Track containing all 7 Bench/Reserve slots */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                  <div className="flex items-center gap-3 sm:gap-4 h-full py-0.5 px-0.5 min-w-max">
                    {bench.map((slot, index) => {
                      const isReserve = index >= 5;
                      return (
                        <div 
                          key={slot.id} 
                          className="flex flex-col items-center shrink-0 w-[105px] sm:w-[140px] md:w-[175px]"
                        >
                          {/* Beautiful Overlay tag for maximum card height space */}
                          <div className="flex items-center justify-center -mb-1.5 relative z-20 select-none pointer-events-none">
                            <span className={`text-[5.5px] md:text-[6.5px] font-extrabold uppercase px-1 py-0.5 rounded-[2px] bg-zinc-950/90 border border-zinc-900/40 tracking-wider leading-none shadow-sm ${isReserve ? 'text-zinc-500' : 'text-amber-500/90'}`}>
                              {isReserve ? `R${index - 4}` : `B${index + 1}`}
                            </span>
                          </div>
                          
                          <div className="w-full aspect-[2.5/3.5]">
                            <Slot 
                              slot={slot} 
                              mini={false} 
                              onClick={() => handleSlotClick(slot)} 
                              isSelected={swapSource === slot.id || activeSlotId === slot.id}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
              </>
            ) : (
              <div className="absolute bottom-0 inset-x-0 z-40 flex justify-center">
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  onClick={() => setIsBenchOpen(true)}
                  className="flex items-center justify-center gap-1.5 bg-zinc-950 border-t border-x border-zinc-900 text-zinc-500 hover:text-zinc-300 px-6 h-8 rounded-t-xl shadow-[0_-4px_12px_rgba(0,0,0,0.5)] font-bold uppercase tracking-widest text-[8px] transition-colors pointer-events-auto active:bg-zinc-900"
                >
                  <ChevronUp size={10} className="animate-bounce" />
                  <span>▲ BENCH & RESERVES ({bench.filter(b => b.card).length}/7)</span>
                </motion.button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  const renderSelection = () => (
    <div className="fixed inset-0 z-[8000] flex flex-col items-center justify-center p-2 md:p-8 overflow-y-auto">
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

        <div className="w-full flex-1 md:flex-none flex flex-col items-center justify-center gap-2 px-1 sm:px-4 overflow-visible">
          <div className={isMobile 
            ? "grid grid-cols-6 gap-x-2 gap-y-3.5 w-full max-w-[340px] xs:max-w-[370px] mx-auto py-4 px-1" 
            : "flex flex-wrap items-center justify-center gap-6 w-full max-w-5xl py-8 px-4"
          }>
            {currentOptions.map((card, idx) => {
              const isSelected = pickingCardId === card.id;
              const isAnySelected = pickingCardId !== null;
              const shouldFade = isAnySelected && !isSelected;

              return (
                <motion.div
                  key={`${card.id}-${idx}`}
                  initial={{ opacity: 0, y: 100, rotateY: 90, scale: 0.5 }}
                  animate={{ 
                    opacity: shouldFade ? 0.1 : 1, 
                    scale: isSelected ? (isMobile ? 1.05 : 1.12) : shouldFade ? 0.85 : 1,
                    y: isSelected ? (isMobile ? -8 : -20) : 0,
                    rotateY: 0,
                    filter: shouldFade ? "blur(3px) grayscale(50%)" : "blur(0px)",
                    transition: isSelected 
                      ? { type: "spring", stiffness: 300, damping: 20 }
                      : { type: "spring", stiffness: 100, damping: 15, delay: idx * 0.15 }
                  }}
                  whileHover={!isMobile && !isAnySelected ? { scale: 1.05, y: -10, transition: { duration: 0.2 } } : undefined}
                  whileTap={!isAnySelected ? { scale: 0.95 } : undefined}
                  className={`relative group ${isSelected ? 'z-50' : 'z-10'} ${
                    isMobile 
                      ? idx < 3 
                        ? 'col-span-2 flex justify-center' 
                        : idx === 3 
                          ? 'col-start-2 col-span-2 flex justify-center' 
                          : 'col-start-4 col-span-2 flex justify-center'
                      : 'w-48 xl:w-52 shrink-0'
                  }`}
                >
                  {/* Glow behind the card */}
                  <div className={`absolute inset-0 bg-amber-500/0 ${isSelected ? 'bg-amber-500/35 blur-3xl scale-125' : 'group-hover:bg-amber-500/10 blur-2xl'} rounded-3xl transition-all duration-500`} />
                  
                  <CardItem 
                    card={card} 
                    isOwned={true} 
                    width={isMobile ? 105 : 190}
                    onClick={() => !isAnySelected && handleSelectCard(card)}
                  />

                  {/* Pick Indicator Overlay on Hover */}
                  {!isAnySelected && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center z-20">
                      <div className="bg-amber-500/20 backdrop-blur-md px-4 py-2 rounded-full border border-amber-500/50 flex items-center gap-2">
                        <Sparkles size={14} className="text-amber-500 animate-spin-slow" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Select</span>
                      </div>
                    </div>
                  )}

                  {/* Celebrate particles when selected */}
                  {isSelected && (
                    <div className="absolute inset-0 pointer-events-none z-50">
                      {Array.from({ length: 15 }).map((_, pIdx) => {
                        const angle = (pIdx / 15) * Math.PI * 2;
                        const distance = 120 + Math.random() * 80;
                        const targetX = Math.cos(angle) * distance;
                        const targetY = Math.sin(angle) * distance;
                        return (
                          <motion.div
                            key={pIdx}
                            initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
                            animate={{ 
                              x: targetX, 
                              y: targetY, 
                              scale: [0, 1.5, 0], 
                              opacity: [1, 1, 0] 
                            }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.9)]"
                          />
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderBoxScore = () => {
    const match = activeMatchId ? bracket.find(m => m.id === activeMatchId) : null;
    const isUserTeam1 = match ? match.team1 === 'USER' : true;
    const oppTeam = match ? (isUserTeam1 ? (match.team2 as GhostTeam) : (match.team1 as GhostTeam)) : null;
    const oppTeamName = oppTeam ? oppTeam.name : 'Opponent';

    const userStats = boxScore.filter(p => p.team === 'USER');
    const oppStats = boxScore.filter(p => p.team === 'OPP');

    const uPts = userStats.reduce((sum, p) => sum + p.pts, 0);
    const uReb = userStats.reduce((sum, p) => sum + p.reb, 0);
    const uAst = userStats.reduce((sum, p) => sum + p.ast, 0);
    const uStl = userStats.reduce((sum, p) => sum + p.stl, 0);
    const uBlk = userStats.reduce((sum, p) => sum + p.blk, 0);
    const uTov = userStats.reduce((sum, p) => sum + p.tov, 0);
    const uFgm = userStats.reduce((sum, p) => sum + p.fgm, 0);
    const uFga = userStats.reduce((sum, p) => sum + p.fga, 0);
    const uFgPct = uFga > 0 ? Math.round((uFgm / uFga) * 100) : 0;

    const oPts = oppStats.reduce((sum, p) => sum + p.pts, 0);
    const oReb = oppStats.reduce((sum, p) => sum + p.reb, 0);
    const oAst = oppStats.reduce((sum, p) => sum + p.ast, 0);
    const oStl = oppStats.reduce((sum, p) => sum + p.stl, 0);
    const oBlk = oppStats.reduce((sum, p) => sum + p.blk, 0);
    const oTov = oppStats.reduce((sum, p) => sum + p.tov, 0);
    const oFgm = oppStats.reduce((sum, p) => sum + p.fgm, 0);
    const oFga = oppStats.reduce((sum, p) => sum + p.fga, 0);
    const oFgPct = oFga > 0 ? Math.round((oFgm / oFga) * 100) : 0;

    const filteredBoxScore = boxScore.filter(p => p.team === activeBoxScoreTeam);

    const renderStatRow = (label: string, userVal: number, oppVal: number, isPct: boolean = false) => {
      const total = userVal + oppVal;
      const userPercent = total > 0 ? (userVal / total) * 100 : 50;
      const oppPercent = total > 0 ? (oppVal / total) * 100 : 50;
      
      const userBetter = userVal > oppVal;
      const oppBetter = oppVal > userVal;
      
      return (
        <div className="space-y-1.5 py-3 border-b border-zinc-900/60 last:border-b-0" key={label}>
          <div className="flex justify-between items-center text-xs sm:text-sm font-bold tracking-tight">
            <span className={`tabular-nums ${userBetter ? 'text-amber-500 font-black' : 'text-zinc-400'}`}>
              {userVal}{isPct ? '%' : ''}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-widest">{label}</span>
            <span className={`tabular-nums ${oppBetter ? 'text-white font-black' : 'text-zinc-400'}`}>
              {oppVal}{isPct ? '%' : ''}
            </span>
          </div>
          <div className="flex h-1.5 w-full bg-zinc-900/50 rounded-full overflow-hidden">
            {/* User Bar */}
            <div className="w-1/2 flex justify-end pr-[1px]">
              <div 
                style={{ width: `${userPercent}%` }} 
                className={`h-full rounded-l-full transition-all duration-700 ${
                  userBetter ? 'bg-amber-500' : 'bg-zinc-700'
                }`}
              />
            </div>
            {/* Opponent Bar */}
            <div className="w-1/2 flex justify-start pl-[1px]">
              <div 
                style={{ width: `${oppPercent}%` }} 
                className={`h-full rounded-r-full transition-all duration-700 ${
                  oppBetter ? 'bg-white' : 'bg-zinc-700'
                }`}
              />
            </div>
          </div>
        </div>
      );
    };

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9500] bg-zinc-950 flex flex-col overflow-hidden select-none"
      >
        {/* Navigation / Header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 shrink-0 bg-zinc-950">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-amber-500" />
            <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Match Review</span>
          </div>
          <button
            onClick={() => setShowBoxScore(false)}
            className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 active:scale-95 transition-all"
            title="Back to Bracket"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
          <div className="max-w-4xl mx-auto w-full space-y-6">
            
            {/* SofaScore-Style Scoreboard Widget */}
            <div className="bg-gradient-to-b from-zinc-900/40 to-zinc-950/20 border border-zinc-850/60 rounded-3xl p-4 md:p-6 shadow-2xl relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full filter blur-3xl pointer-events-none" />
              <div className="grid grid-cols-3 items-center">
                
                {/* Left Side: User Team */}
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-amber-500/10 border-2 border-amber-500 flex items-center justify-center text-amber-500 font-black text-xs md:text-sm shadow-[0_0_20px_rgba(245,158,11,0.15)] shrink-0">
                    YOU
                  </div>
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-white max-w-[90px] md:max-w-[120px] truncate">
                    Your Team
                  </span>
                </div>

                {/* Middle Side: Score & FT Status */}
                <div className="flex flex-col items-center justify-center text-center space-y-1">
                  <div className="flex items-center gap-2.5 sm:gap-4">
                    <span className={`text-3xl md:text-4xl font-black italic tracking-tighter tabular-nums ${uPts >= oPts ? 'text-amber-500' : 'text-zinc-500'}`}>
                      {matchResult ? (isUserTeam1 ? matchResult.score1 : matchResult.score2) : 0}
                    </span>
                    <span className="text-zinc-600 font-black text-sm md:text-lg">-</span>
                    <span className={`text-3xl md:text-4xl font-black italic tracking-tighter tabular-nums ${oPts >= uPts ? 'text-white' : 'text-zinc-500'}`}>
                      {matchResult ? (isUserTeam1 ? matchResult.score2 : matchResult.score1) : 0}
                    </span>
                  </div>
                  <span className="bg-zinc-800/80 border border-zinc-700/50 text-zinc-300 text-[7.5px] md:text-[8px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase">
                    Full Time
                  </span>
                </div>

                {/* Right Side: Opponent Team */}
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center text-zinc-400 font-black text-xs md:text-sm shrink-0">
                    {getTeamAbbr(oppTeamName)}
                  </div>
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-zinc-300 max-w-[90px] md:max-w-[120px] truncate">
                    {oppTeamName}
                  </span>
                </div>

              </div>
            </div>

            {/* Sub-Header Tabs Picker (SofaScore-Style Tabs) */}
            <div className="flex bg-zinc-900/20 p-1 rounded-2xl border border-zinc-850/40 backdrop-blur-sm">
              <button
                onClick={() => setBoxScoreTab('players')}
                className={`flex-1 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  boxScoreTab === 'players' 
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10 font-extrabold' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users size={12} />
                <span>Player Boxscore</span>
              </button>
              <button
                onClick={() => setBoxScoreTab('comparison')}
                className={`flex-1 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  boxScoreTab === 'comparison' 
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/10 font-extrabold' 
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <TrendingUp size={12} />
                <span>Team Stats</span>
              </button>
            </div>

            {boxScoreTab === 'players' ? (
              <div className="space-y-4">
                {/* Team Switcher Tabs (For player table) */}
                <div className="flex items-center justify-center gap-1.5 max-w-sm mx-auto w-full bg-zinc-900/40 p-1 rounded-2xl border border-zinc-850/30 backdrop-blur-sm shrink-0">
                  <button
                    onClick={() => setActiveBoxScoreTeam('USER')}
                    className={`flex-1 py-2 px-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeBoxScoreTeam === 'USER' ? 'bg-zinc-800 text-white border border-zinc-700/50' : 'text-zinc-400 hover:text-white'}`}
                  >
                    <span>Your Team</span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${activeBoxScoreTeam === 'USER' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-500'}`}>
                      {matchResult ? (isUserTeam1 ? matchResult.score1 : matchResult.score2) : 0}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveBoxScoreTeam('OPP')}
                    className={`flex-1 py-2 px-3 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${activeBoxScoreTeam === 'OPP' ? 'bg-zinc-800 text-white border border-zinc-700/50' : 'text-zinc-400 hover:text-white'}`}
                  >
                    <span>{oppTeamName}</span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${activeBoxScoreTeam === 'OPP' ? 'bg-amber-500 text-black' : 'bg-zinc-900 text-zinc-500'}`}>
                      {matchResult ? (isUserTeam1 ? matchResult.score2 : matchResult.score1) : 0}
                    </span>
                  </button>
                </div>

                {/* Main Table Container */}
                <div className="overflow-hidden flex flex-col border border-zinc-900 rounded-3xl bg-zinc-900/10 backdrop-blur-md relative">
                  
                  {/* Horiz Swipe Assist Indicator for Mobile */}
                  <div className="block sm:hidden text-center py-1.5 bg-amber-500/5 border-b border-zinc-900">
                    <span className="text-[8px] font-bold text-amber-500/70 uppercase tracking-[0.2em] animate-pulse">
                      ← Scroll left-right to inspect stats →
                    </span>
                  </div>

                  <div className="overflow-x-auto scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
                    <table className="w-full text-left border-collapse min-w-[460px] relative table-auto">
                      <thead className="sticky top-0 z-20 bg-zinc-950 border-b border-zinc-900/80">
                        <tr className="text-[8px] sm:text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                          <th className="p-3 pl-4 sticky left-0 bg-zinc-950 z-30 min-w-[120px] border-r border-zinc-900/60">Player</th>
                          <th className="p-3 text-center min-w-[36px] text-amber-500 font-extrabold">PTS</th>
                          <th className="p-3 text-center min-w-[36px] text-zinc-300">REB</th>
                          <th className="p-3 text-center min-w-[36px] text-zinc-300">AST</th>
                          <th className="p-3 text-center min-w-[36px]">STL</th>
                          <th className="p-3 text-center min-w-[36px]">BLK</th>
                          <th className="p-3 text-center min-w-[36px]">TO</th>
                          <th className="p-3 text-center min-w-[42px]">FG</th>
                          <th className="p-3 text-center min-w-[36px] pr-4">MIN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900/40 bg-zinc-950/20">
                        {filteredBoxScore.map((player, pIdx) => (
                          <tr key={`${player.cardId || player.name}-${pIdx}`} className="hover:bg-zinc-900/40 transition-colors group">
                            {/* Sticky Player Column */}
                            <td className="p-2.5 pl-4 sticky left-0 bg-[#070709] z-10 border-r border-zinc-900 shadow-[4px_0_12px_rgba(0,0,0,0.5)]">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-9 rounded bg-zinc-900/80 border border-zinc-800 shrink-0 overflow-hidden flex items-center justify-center relative shadow-inner">
                                  {player.imageUrl ? (
                                    <img src={player.imageUrl} alt={player.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    <span className="text-[10px] font-black text-zinc-700">{player.name[0]}</span>
                                  )}
                                  {player.isStarter && (
                                    <div className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-bl-sm" title="Starter" />
                                  )}
                                </div>
                                <div className="min-w-0 text-left">
                                  <p className="text-[11px] sm:text-xs font-black uppercase italic text-white group-hover:text-amber-500 transition-colors flex items-center gap-1 flex-wrap">
                                    <span className="truncate max-w-[70px] sm:max-w-none leading-none">{player.name}</span>
                                    {!player.isStarter && (
                                      <span className="text-[5.5px] font-black tracking-widest text-zinc-500 bg-zinc-900 border border-white/5 px-1 py-0.2 rounded shrink-0">BENCH</span>
                                    )}
                                  </p>
                                  <p className="text-[7.5px] font-bold text-zinc-500 uppercase tracking-wider mt-0.5 leading-none">
                                    {player.position} • <span className="text-amber-500/90">{player.ovr} OVR</span>
                                  </p>
                                </div>
                              </div>
                            </td>
                            {/* Rest of Columns in requested minimalist order */}
                            <td className="p-2.5 text-center">
                              <span className="text-xs sm:text-sm font-black italic text-amber-500 tabular-nums">{player.pts}</span>
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="text-[11px] font-black italic text-zinc-300 tabular-nums">{player.reb}</span>
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="text-[11px] font-black italic text-zinc-300 tabular-nums">{player.ast}</span>
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="text-[11px] font-bold text-zinc-400 tabular-nums">{player.stl}</span>
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="text-[11px] font-bold text-zinc-400 tabular-nums">{player.blk}</span>
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="text-[11px] font-bold text-zinc-500 tabular-nums">{player.tov}</span>
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="text-[11px] font-bold text-zinc-400 tabular-nums">{player.fgm}-{player.fga}</span>
                            </td>
                            <td className="p-2.5 text-center pr-4">
                              <span className="text-[11px] font-bold text-zinc-400 tabular-nums">{player.min}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* SofaScore-Style Comparative Progress Bars */
              <div className="bg-zinc-900/10 border border-zinc-900 rounded-3xl p-5 md:p-8 space-y-4 backdrop-blur-md">
                <div className="text-center pb-2 border-b border-zinc-900/60">
                  <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest animate-pulse">
                    Team Totals comparison
                  </span>
                </div>
                {renderStatRow('Points', uPts, oPts)}
                {renderStatRow('Field Goal %', uFgPct, oFgPct, true)}
                {renderStatRow('Rebounds', uReb, oReb)}
                {renderStatRow('Assists', uAst, oAst)}
                {renderStatRow('Steals', uStl, oStl)}
                {renderStatRow('Blocks', uBlk, oBlk)}
                {renderStatRow('Turnovers', uTov, oTov)}
              </div>
            )}

            {/* Bottom Proceed Action Button */}
            <button
              onClick={advanceRound}
              className="w-full bg-amber-500 text-black py-4 sm:py-5 rounded-2xl sm:rounded-3xl font-black uppercase tracking-[0.2em] text-xs sm:text-sm flex items-center justify-center gap-3 hover:bg-amber-400 transition-all shadow-[0_12px_30px_rgba(245,158,11,0.2)] active:scale-95 shrink-0"
            >
              <span>Continue Tournament</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderSummary = () => {
    const starterAvg = Math.round(starters.reduce((acc, s) => acc + (s.card?.stats.ovr || 0), 0) / starters.filter(s => s.card).length || 0);

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 text-center space-y-4 md:space-y-8 overflow-y-auto max-h-full">
        {/* Header Block with animated crown/sparkle */}
        <div className="space-y-1 md:space-y-2 mt-1 md:mt-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 md:py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
            <Sparkles size={10} className="text-amber-500 animate-pulse" />
            <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest text-amber-500">DRAFT COMPLETE</span>
          </div>
          <h2 className="text-2xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-none">
            Your Dynasty Is Ready
          </h2>
          <p className="text-[9px] md:text-xs font-bold uppercase tracking-widest text-zinc-500">
            Playoffs await. Prepare to dominate the league
          </p>
        </div>

        {/* Tactical Overview Dashboard */}
        <div className="flex flex-row md:flex-row items-center justify-center gap-4 md:gap-10 w-full max-w-sm md:max-w-2xl px-1 md:px-4 py-1 md:py-2">
          {/* Circular Glowing OVR Badge */}
          <div className="relative group shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 to-amber-300 rounded-full blur-2xl opacity-35 group-hover:opacity-55 transition-opacity duration-700 animate-pulse" />
            <div className="relative w-20 h-20 md:w-32 md:h-32 rounded-full bg-zinc-950 border border-zinc-900 flex flex-col items-center justify-center shadow-2xl">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx={isMobile ? "40" : "64"}
                  cy={isMobile ? "40" : "64"}
                  r={isMobile ? "34" : "58"}
                  className="stroke-zinc-900 fill-none"
                  strokeWidth="3"
                  style={!isMobile ? { cx: 64, cy: 64, r: 58 } : undefined}
                />
                <circle
                  cx={isMobile ? "40" : "64"}
                  cy={isMobile ? "40" : "64"}
                  r={isMobile ? "34" : "58"}
                  className="stroke-amber-500 fill-none"
                  strokeWidth="3"
                  strokeDasharray={2 * Math.PI * (isMobile ? 34 : 58)}
                  strokeDashoffset={2 * Math.PI * (isMobile ? 34 : 58) * (1 - teamOVR / 100)}
                  strokeLinecap="round"
                  style={!isMobile ? { cx: 64, cy: 64, r: 58 } : undefined}
                />
              </svg>
              <span className="text-2xl md:text-5xl font-black italic text-white tracking-tighter leading-none">{teamOVR}</span>
              <span className="text-[6px] md:text-[8px] font-black text-amber-500 uppercase tracking-widest mt-0.5 md:mt-1">TEAM OVR</span>
            </div>
          </div>

          {/* Breakdown Stats Cards */}
          <div className="grid grid-cols-2 gap-2.5 flex-1 md:flex-initial md:flex md:flex-col md:gap-3 w-full md:max-w-md">
            <div className="bg-zinc-950/50 border border-zinc-900/60 rounded-xl md:rounded-2xl p-2.5 md:p-4 text-center md:text-left flex flex-col justify-center shadow-lg">
              <span className="text-[6px] md:text-[8px] font-black text-zinc-500 uppercase tracking-wider">Starters</span>
              <span className="text-sm md:text-lg font-black italic text-white mt-0.5">{starterAvg} OVR</span>
            </div>
            <div className="bg-zinc-950/50 border border-zinc-900/60 rounded-xl md:rounded-2xl p-2.5 md:p-4 text-center md:text-left flex flex-col justify-center shadow-lg">
              <span className="text-[6px] md:text-[8px] font-black text-zinc-500 uppercase tracking-wider">Bench</span>
              <span className="text-sm md:text-lg font-black italic text-white mt-0.5">{benchOVR} OVR</span>
            </div>
          </div>
        </div>

        {/* Showcase Starting Five Cards */}
        <div className="w-full max-w-4xl px-3 py-3 md:py-6 bg-zinc-950/40 border border-zinc-900/60 rounded-2xl md:rounded-[2.5rem] relative overflow-hidden backdrop-blur-md">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
          <p className="text-[7px] md:text-[9px] font-black uppercase tracking-[0.25em] text-zinc-500 mb-2.5 md:mb-4">Starting Lineup</p>
          
          <div className="flex items-center justify-start md:justify-center gap-3 md:gap-5 overflow-x-auto pb-1 px-1 scrollbar-none snap-x">
            {starters.map((slot) => {
              if (!slot.card) return null;
              return (
                <motion.div
                  key={slot.id}
                  initial={{ scale: 0.9, opacity: 0, y: 15 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                  whileHover={{ y: -6, scale: 1.04 }}
                  className="shrink-0 snap-center flex flex-col items-center"
                >
                  <CardItem card={slot.card} isOwned={true} width={isMobile ? 74 : 100} />
                  <span className="mt-1 px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-850 text-[5px] md:text-[7px] font-black text-amber-500 uppercase tracking-widest leading-none">
                    {slot.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Responsive Dual Action Flow */}
        <div className="flex flex-row gap-2.5 w-full max-w-sm pt-1 shrink-0">
          <button 
            onClick={() => setPhase('tournament_selection')}
            className="group relative flex-[1.4] bg-gradient-to-r from-amber-500 to-amber-400 text-black py-3 px-4 rounded-xl md:rounded-2xl font-black uppercase tracking-[0.1em] md:tracking-[0.15em] text-[10px] md:text-xs flex items-center justify-center gap-2 hover:from-amber-400 hover:to-amber-300 transition-all shadow-[0_12px_24px_rgba(245,158,11,0.2)] active:scale-95 border-t border-white/20"
          >
            <Trophy size={12} className="animate-bounce" />
            <span>Enter Tournament</span>
            <ArrowRight size={12} />
          </button>
          
          <button 
            onClick={() => setPhase('review')}
            className="flex-1 bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 py-3 px-4 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-[10px] flex items-center justify-center gap-1.5 transition-all active:scale-95 hover:bg-zinc-850"
          >
            <span>Review</span>
          </button>
        </div>

        {/* Secondary Back Navigation */}
        <div className="flex items-center justify-center gap-4 text-center shrink-0 pt-1 pb-2">
          <button 
            onClick={() => resetDraftState('home')}
            className="text-zinc-500 hover:text-zinc-300 text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors"
          >
            <Home size={10} />
            <span>Exit Draft</span>
          </button>
          <span className="text-zinc-850">•</span>
          <button 
            onClick={() => resetDraftState('entry')}
            className="text-zinc-500 hover:text-red-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw size={10} />
            <span>Reset Draft</span>
          </button>
        </div>
      </div>
    );
  };

  const renderTournamentSelection = () => {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 space-y-4 md:space-y-6 overflow-y-auto max-h-full w-full">
        {/* Sleek Header & Team Context */}
        <div className="text-center space-y-1 md:space-y-2 mt-1 md:mt-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-zinc-900 border border-zinc-850 rounded-full">
            <span className="text-[7px] md:text-[8px] font-black uppercase tracking-wider text-zinc-500">YOUR SQUAD</span>
            <span className="text-[10px] md:text-[11px] font-black italic text-amber-500">{teamOVR} OVR</span>
          </div>
          <h2 className="text-2xl md:text-3.5xl font-black italic uppercase tracking-tighter text-white leading-none">
            Select Tournament
          </h2>
          <p className="text-[9px] md:text-xs font-bold uppercase tracking-widest text-zinc-500">
            Choose your battleground and claim premium rewards
          </p>
        </div>

        {/* 4-Column Responsive Grid / Horizontal Carousel on Mobile */}
        <div className="flex overflow-x-auto pb-4 gap-3.5 w-full max-w-5xl px-4 md:px-0 snap-x scrollbar-none sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:overflow-x-visible sm:pb-0 sm:snap-none">
          {TOURNAMENTS.map((t) => {
            // Calculate relative difficulty compared to user's team OVR
            const ovrDiff = teamOVR - t.recommendedOvr;
            
            // Adjust difficulty thresholds cleanly
            let diffLabel = 'BALANCED';
            let diffColor = 'text-sky-400 bg-sky-500/10 border-sky-500/20';
            let barColor = 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]';
            
            if (ovrDiff >= 8) {
              diffLabel = 'EASY WIN';
              diffColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
              barColor = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
            } else if (ovrDiff >= 3) {
              diffLabel = 'FAVORABLE';
              diffColor = 'text-green-400 bg-green-500/10 border-green-500/20';
              barColor = 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]';
            } else if (ovrDiff < -8) {
              diffLabel = 'NIGHTMARE';
              diffColor = 'text-red-400 bg-red-500/10 border-red-500/20';
              barColor = 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]';
            } else if (ovrDiff < -3) {
              diffLabel = 'CHALLENGING';
              diffColor = 'text-amber-500 bg-amber-500/10 border-amber-500/20';
              barColor = 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
            }

            // Power rating percentage slider: 50% is perfectly matched (ovrDiff = 0)
            const sliderPercent = Math.max(8, Math.min(92, 50 + (ovrDiff * 3)));

            // Parse rewards for elegant inline badges
            const rewardParts = t.rewards.split('+').map(s => s.trim());

            return (
              <motion.div
                key={t.id}
                whileHover={{ scale: 1.015, y: -3 }}
                onClick={() => handleSelectTournament(t)}
                className="relative group cursor-pointer bg-zinc-950/90 border border-zinc-900 hover:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between text-left space-y-3.5 overflow-hidden shadow-lg transition-all shrink-0 snap-center w-[265px] sm:w-auto"
              >
                {/* Header Row: Difficulty Badges */}
                <div className="flex items-center gap-1.5 w-full justify-between">
                  <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest ${
                    t.difficulty === 'Easy' ? 'bg-green-500/10 text-green-500 border border-green-500/25' :
                    t.difficulty === 'Medium' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/25' :
                    'bg-red-500/10 text-red-500 border border-red-500/25'
                  }`}>
                    {t.difficulty}
                  </span>
                  
                  <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest border ${diffColor}`}>
                    {diffLabel}
                  </span>
                </div>

                {/* Tournament Main Row: Icon on left, Title on right */}
                <div className="flex items-center gap-3">
                  <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                    t.difficulty === 'Easy' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                    t.difficulty === 'Medium' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                    'bg-gradient-to-br from-red-500 to-rose-600'
                  }`}>
                    <Trophy size={20} className="text-white drop-shadow" />
                    <div className="absolute inset-px rounded-[10px] border border-white/15 pointer-events-none" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-base font-black italic uppercase text-white tracking-tight leading-tight group-hover:text-amber-400 transition-colors truncate">
                      {t.name}
                    </h3>
                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                      Rec: <span className="text-zinc-300 font-extrabold">{t.recommendedOvr} OVR</span>
                    </p>
                  </div>
                </div>

                {/* Difficulty Power Meter Slider - Extremely engaging! */}
                <div className="bg-zinc-900/40 border border-zinc-900/60 rounded-xl p-2.5 space-y-2">
                  <div className="flex items-center justify-between text-[7px] font-black uppercase tracking-widest text-zinc-500">
                    <span>Power Match</span>
                    <span className={diffColor.split(' ')[0]}>
                      {ovrDiff > 0 ? `+${ovrDiff}` : ovrDiff === 0 ? 'EVEN' : ovrDiff} OVR
                    </span>
                  </div>
                  
                  <div className="relative h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-900/80">
                    {/* Midpoint line */}
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-zinc-800" />
                    {/* Fill bar */}
                    <div 
                      className={`absolute top-0 bottom-0 rounded-full transition-all duration-500 ${barColor}`}
                      style={{ 
                        left: ovrDiff >= 0 ? '50%' : `${sliderPercent}%`,
                        right: ovrDiff >= 0 ? `${100 - sliderPercent}%` : '50%'
                      }}
                    />
                    {/* Sliding indicator handle */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow transition-all duration-500 border border-zinc-950"
                      style={{ left: `calc(${sliderPercent}% - 4px)` }}
                    />
                  </div>
                </div>

                {/* Compact Rewards Block */}
                <div className="space-y-1.5">
                  <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Guaranteed Rewards</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {rewardParts.map((part, index) => {
                      const isCoins = part.toLowerCase().includes('coins');
                      return (
                        <div key={index} className="flex items-center gap-1 px-1.5 py-1 rounded-md bg-zinc-900/30 border border-zinc-900/50 min-w-0">
                          {isCoins ? (
                            <Coins size={10} className="text-amber-500 shrink-0" />
                          ) : (
                            <Package size={10} className="text-blue-400 shrink-0" />
                          )}
                          <span className={`text-[8.5px] font-black tracking-tight truncate ${isCoins ? 'text-amber-500' : 'text-zinc-300'}`}>
                            {part.replace(' Coins', '').replace(' Packs', ' Packs')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Play Action Button */}
                <div className="pt-1.5">
                  <button className="w-full bg-zinc-900 text-zinc-300 group-hover:bg-amber-500 group-hover:text-black py-2 rounded-xl font-black uppercase tracking-widest text-[8px] transition-all border border-zinc-850 group-hover:border-transparent active:scale-95 flex items-center justify-center gap-1">
                    <span>ENTER TOURNAMENT</span>
                    <ArrowRight size={10} className="transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>

                {/* Atmospheric Glow */}
                <div className={`absolute -bottom-16 -right-16 w-28 h-28 rounded-full blur-[50px] opacity-[0.06] transition-opacity group-hover:opacity-15 pointer-events-none ${
                  t.difficulty === 'Easy' ? 'bg-green-500' :
                  t.difficulty === 'Medium' ? 'bg-blue-500' :
                  'bg-red-500'
                }`} />
              </motion.div>
            );
          })}
        </div>

        {/* Back option */}
        <button 
          onClick={() => setPhase('summary')}
          className="text-zinc-600 hover:text-zinc-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors pt-1"
        >
          <RotateCcw size={12} />
          <span>Back to Summary</span>
        </button>
      </div>
    );
  };

  const renderBracket = () => {
    const qfMatches = bracket.filter(m => m.id.startsWith('qf'));
    const sfMatches = bracket.filter(m => m.id.startsWith('sf'));
    const fMatch = bracket.find(m => m.id === 'f1') || null;

    const isUserSideMatch = (matchId: string) => {
       const m = bracket.find(b => b.id === matchId);
       return m?.team1 === 'USER' || m?.team2 === 'USER';
    };

    const handleScrollToSection = (section: 'west' | 'finals' | 'east') => {
      if (bracketRef.current) {
        const container = bracketRef.current;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        const maxScroll = scrollWidth - clientWidth;

        let targetScrollLeft = 0;
        if (section === 'west') {
          targetScrollLeft = 0;
        } else if (section === 'finals') {
          targetScrollLeft = maxScroll / 2;
        } else if (section === 'east') {
          targetScrollLeft = maxScroll;
        }

        container.scrollTo({
          left: targetScrollLeft,
          behavior: 'smooth'
        });
      }
    };

    return (
      <div className="h-[100dvh] w-full flex flex-col bg-zinc-950 overflow-hidden relative">
        {/* --- AD BANNER ABOVE HEADER --- */}
        {!isPremium && <StaticAd position="header" />}

        <div className="flex-1 flex flex-col p-2.5 sm:p-4 md:p-5 space-y-2 sm:space-y-4 md:space-y-5 overflow-y-auto md:overflow-hidden relative">
          {/* Background Atmosphere */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-0 w-1/2 h-full bg-[radial-gradient(circle_at_10%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
            <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(circle_at_90%_50%,rgba(239,68,68,0.1),transparent_70%)]" />
          </div>

          {/* Improved Header & Round Tracker - Compact & Professional */}
          <div className="flex flex-col gap-2 md:gap-4 shrink-0 z-50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 p-[1.5px] shadow-[0_2px_10px_rgba(245,158,11,0.2)] flex items-center justify-center shrink-0">
                  <div className="w-full h-full bg-zinc-950 rounded-[7px] flex items-center justify-center relative overflow-hidden">
                    <Trophy size={11} className="text-amber-500 relative z-10 sm:w-3.5 sm:h-3.5" />
                  </div>
                </div>
                <div>
                  <h2 className="text-[11px] sm:text-xs md:text-sm font-black italic uppercase text-white leading-none tracking-tight flex items-center gap-1.5">
                    {selectedTournament?.name}
                  </h2>
                  <p className="text-[6.5px] sm:text-[7.5px] md:text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                    Playoffs Bracket • Rec. OVR {selectedTournament?.recommendedOvr}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => {
                  if (window.confirm("Are you sure you want to exit the tournament view? Your tournament bracket state is saved.")) {
                    setCurrentView('home');
                  }
                }}
                className="flex items-center gap-1 px-2 py-1 bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-[5px] text-[7px] sm:text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-black/20"
              >
                <ArrowLeft size={8} className="sm:w-2.5 sm:h-2.5" />
                <span>Exit Bracket</span>
              </button>
            </div>

            <div className="flex flex-row items-center justify-between gap-3 w-full border-t border-zinc-900/60 pt-2">
              {/* Round display for Desktop */}
              <div className="hidden md:flex max-w-[200px] w-full items-center gap-1 md:gap-1.5">
                {['QF', 'SF', 'F'].map((r, i) => (
                  <React.Fragment key={r}>
                    <div className="flex flex-col items-center gap-0.5 flex-1">
                      <div className={`w-full h-0.5 rounded-full transition-all duration-500 ${
                        currentRound === r ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]' : 
                        (['SF', 'F'].includes(currentRound) && r === 'QF') || (currentRound === 'F' && r === 'SF') ? 'bg-zinc-700' : 'bg-zinc-900'
                      }`} />
                      <span className={`text-[6px] md:text-[7px] font-black uppercase tracking-widest ${currentRound === r ? 'text-amber-500' : 'text-zinc-700'}`}>
                        {r === 'QF' ? 'QUARTERS' : r === 'SF' ? 'SEMIS' : 'FINALS'}
                      </span>
                    </div>
                    {i < 2 && <div className="w-2 h-px bg-zinc-900 mb-1.5" />}
                  </React.Fragment>
                ))}
              </div>

              {/* Conference quick snap controls for all screens */}
              <div className="flex items-center bg-zinc-900/40 p-1 rounded-full border border-white/5 backdrop-blur-sm max-w-[280px] sm:max-w-xs w-full gap-1 mx-auto md:mr-0 md:ml-auto">
                <button 
                  onClick={() => handleScrollToSection('west')} 
                  className="flex-1 text-[7.5px] sm:text-[9px] font-black uppercase tracking-widest py-1 px-2.5 rounded-full bg-zinc-900/50 hover:bg-blue-950/25 text-blue-400 border border-blue-500/10 active:scale-95 transition-all flex items-center justify-center gap-1"
                >
                  <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                  <span>West</span>
                </button>
                <button 
                  onClick={() => handleScrollToSection('finals')} 
                  className="flex-1 text-[7.5px] sm:text-[9px] font-black uppercase tracking-widest py-1 px-2.5 rounded-full bg-amber-500 text-black shadow-[0_2px_8px_rgba(245,158,11,0.25)] hover:bg-amber-400 active:scale-95 transition-all flex items-center justify-center gap-1"
                >
                  <Trophy size={9} />
                  <span>FINALS</span>
                </button>
                <button 
                  onClick={() => handleScrollToSection('east')} 
                  className="flex-1 text-[7.5px] sm:text-[9px] font-black uppercase tracking-widest py-1 px-2.5 rounded-full bg-zinc-900/50 hover:bg-red-950/25 text-red-400 border border-red-500/10 active:scale-95 transition-all flex items-center justify-center gap-1"
                >
                  <div className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                  <span>East</span>
                </button>
              </div>
            </div>
          </div>

        {/* --- UNIFIED RESPONSIVE PLAYOFF BRACKET TREE --- */}
        <div className="flex-1 overflow-x-auto bracket-container flex items-center touch-pan-x snap-x snap-mandatory scroll-smooth pb-10 scrollbar-hide" ref={bracketRef}>
          <div className="flex items-center gap-0 min-w-max px-6 md:px-[35vw] relative h-[450px] md:h-[520px]">
            
            {/* --- WESTERN CONFERENCE (LEFT) --- */}
            <div className="flex items-center gap-12 md:gap-24 h-full py-10 relative snap-center" id="bracket-west">
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
            <div className="flex flex-col items-center justify-center px-12 md:px-24 relative min-w-[320px] md:min-w-[450px] snap-center" id="bracket-finals" data-match-id="f1">
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
            <div className="flex flex-row-reverse items-center gap-12 md:gap-20 h-full py-10 relative snap-center" id="bracket-east">
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

        {/* Floating Controls (Desktop & Mobile Unified) */}
        <AnimatePresence>
          {(() => {
            const userMatch = (() => {
              if (currentRound === 'QF') return bracket.find(m => m.id === 'qf1');
              if (currentRound === 'SF') return bracket.find(m => m.id === 'sf1');
              if (currentRound === 'F') return bracket.find(m => m.id === 'f1');
              return null;
            })();

            if (!userMatch) return null;

            if (userMatch.status === 'pending') {
              return (
                <motion.div 
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 50, opacity: 0 }}
                  className="absolute bottom-12 md:bottom-10 inset-x-0 flex justify-center z-[100] px-4"
                >
                  <button
                    onClick={() => simulateMatch(userMatch.id)}
                    disabled={isSimulating}
                    className="bg-white text-black h-16 w-full max-w-xs md:max-w-md px-8 rounded-[2rem] font-black uppercase tracking-[0.25em] text-[10px] md:text-xs shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/10 flex items-center justify-center gap-3 hover:bg-amber-400 active:scale-95 transition-all"
                  >
                    <Play size={16} fill="currentColor" />
                    <span>Play {currentRound === 'QF' ? 'Quarter-Final' : currentRound === 'SF' ? 'Semi-Final' : 'Championship Final'}</span>
                  </button>
                </motion.div>
              );
            } else if (userMatch.status === 'finished') {
              const won = userMatch.winner === 'USER';
              return (
                <motion.div 
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 50, opacity: 0 }}
                  className="absolute bottom-12 md:bottom-10 inset-x-0 flex justify-center z-[100] px-4"
                >
                  <button
                    onClick={() => {
                      const winnerName = won ? 'Your Team' : (userMatch.winner as GhostTeam)?.name || 'Opponent';
                      setMatchResult({
                        score1: userMatch.score1 || 0,
                        score2: userMatch.score2 || 0,
                        winner: winnerName
                      });
                      setShowBoxScore(false);
                    }}
                    className="bg-amber-500 text-black h-16 w-full max-w-xs md:max-w-md px-8 rounded-[2rem] font-black uppercase tracking-[0.25em] text-[10px] md:text-xs shadow-[0_20px_60px_rgba(245,158,11,0.35)] border border-white/10 flex items-center justify-center gap-3 hover:bg-amber-400 active:scale-95 transition-all"
                  >
                    <Trophy size={16} />
                    <span>{won ? (currentRound === 'F' ? 'Claim Championship!' : 'Continue to Next Round') : 'Claim Rewards & Exit'}</span>
                  </button>
                </motion.div>
              );
            }
            return null;
          })()}
        </AnimatePresence>
        
        {/* Desktop Helper Text ONLY */}
        <div className="flex justify-center text-[8px] font-bold text-zinc-700 uppercase tracking-widest gap-2">
          <ArrowLeft size={8} /> Swipe to navigate <ArrowRight size={8} />
        </div>
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
                  {matchResult.winner === 'Your Team' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      className="flex justify-center py-2"
                    >
                      <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-black">
                        <Sparkles size={24} />
                      </div>
                    </motion.div>
                  )}
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

const getTeamAbbr = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('lakers')) return 'LAL';
  if (n.includes('celtics')) return 'BOS';
  if (n.includes('warriors')) return 'GSW';
  if (n.includes('bucks')) return 'MIL';
  if (n.includes('suns')) return 'PHX';
  if (n.includes('heat')) return 'MIA';
  if (n.includes('nuggets')) return 'DEN';
  if (n.includes('76ers') || n.includes('philadelphia')) return 'PHI';
  if (n.includes('bulls')) return 'CHI';
  if (n.includes('spurs')) return 'SAS';
  if (n.includes('cavaliers') || n.includes('cavs')) return 'CLE';
  if (n.includes('thunder')) return 'OKC';
  if (n.includes('magic')) return 'ORL';
  if (n.includes('rockets')) return 'HOU';
  if (n.includes('pistons')) return 'DET';
  if (n.includes('hornets')) return 'CHA';
  if (n.includes('jazz')) return 'UTA';
  if (n.includes('blazers')) return 'POR';
  if (n.includes('nets')) return 'BKN';
  if (n.includes('your team') || n.includes('user')) return 'YOU';
  return name.slice(0, 3).toUpperCase();
};

const getTeamColor = (abbr: string) => {
  const colors: Record<string, string> = {
    'LAL': 'from-purple-600 to-amber-500',
    'BOS': 'from-green-700 to-emerald-500',
    'GSW': 'from-blue-600 to-yellow-500',
    'MIL': 'from-emerald-800 to-amber-100',
    'PHX': 'from-orange-600 to-purple-600',
    'MIA': 'from-red-700 to-yellow-600',
    'DEN': 'from-blue-800 to-yellow-500',
    'PHI': 'from-blue-600 to-red-600',
    'CHI': 'from-red-600 to-zinc-900',
    'SAS': 'from-zinc-600 to-zinc-400',
    'CLE': 'from-red-800 to-yellow-600',
    'OKC': 'from-sky-500 to-orange-500',
    'ORL': 'from-blue-500 to-zinc-400',
    'HOU': 'from-red-600 to-zinc-800',
    'DET': 'from-blue-700 to-red-500',
    'CHA': 'from-teal-500 to-purple-600',
    'UTA': 'from-yellow-500 to-green-600',
    'POR': 'from-red-600 to-zinc-950',
    'BKN': 'from-zinc-800 to-zinc-900',
    'YOU': 'from-amber-500 to-amber-300',
  };
  return colors[abbr] || 'from-zinc-700 to-zinc-600';
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
          {active && (
            <path 
              d={type === 'west' 
                ? `M 0 48 L 40 48 L 40 ${isUp ? 96 : 0} L 80 ${isUp ? 96 : 0}`
                : `M 80 48 L 40 48 L 40 ${isUp ? 96 : 0} L 0 ${isUp ? 96 : 0}`
              }
              fill="none"
              stroke="rgba(245, 158, 11, 0.4)"
              strokeWidth="6"
              className="blur-[4px]"
            />
          )}
          <path 
            d={type === 'west' 
              ? `M 0 48 L 40 48 L 40 ${isUp ? 96 : 0} L 80 ${isUp ? 96 : 0}`
              : `M 80 48 L 40 48 L 40 ${isUp ? 96 : 0} L 0 ${isUp ? 96 : 0}`
            }
            fill="none"
            stroke={active ? "rgb(245, 158, 11)" : "rgb(39, 39, 42)"}
            strokeWidth={active ? "2.5" : "1.5"}
            strokeDasharray={active ? "none" : "4 3"}
            className={active ? "animate-pulse" : ""}
          />
        </svg>
      </div>
    );
  }

  // Connects SF to Final (Straight lines usually with glowing bar)
  return (
    <div className={`absolute ${type === 'west' ? '-right-10 md:-right-24' : '-left-10 md:-left-24'} top-1/2 -translate-y-1/2 w-10 md:w-24 h-px pointer-events-none z-0`}>
      <div className={`w-full h-full relative ${active ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.85)]' : 'bg-zinc-850'}`} />
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
      {isUserMatch && !isFinished && (
        <div className="absolute -top-2.5 left-4 z-20 bg-amber-500 text-black text-[7px] md:text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest leading-none shadow-[0_0_12px_rgba(245,158,11,0.5)] border border-black animate-pulse">
          Your Match
        </div>
      )}
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
            <div className={`w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center text-[7px] md:text-[10px] font-black shadow-md text-white bg-gradient-to-br ${getTeamColor(getTeamAbbr(getTeamName(match.team1)))} ${getTeamAbbr(getTeamName(match.team1)) === 'YOU' ? 'text-black' : ''}`}>
              {getTeamAbbr(getTeamName(match.team1))}
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
            <div className={`w-6 h-6 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center text-[7px] md:text-[10px] font-black shadow-md text-white bg-gradient-to-br ${getTeamColor(getTeamAbbr(getTeamName(match.team2)))} ${getTeamAbbr(getTeamName(match.team2)) === 'YOU' ? 'text-black' : ''}`}>
              {getTeamAbbr(getTeamName(match.team2))}
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
            className="absolute inset-0 bg-black/45 backdrop-blur-[1px] hover:bg-black/60 transition-all flex items-center justify-center group/btn active:scale-95"
          >
             <div className="bg-amber-500 hover:bg-amber-400 text-black px-5 py-2.5 rounded-full font-black uppercase italic text-[10px] tracking-widest shadow-[0_10px_25px_rgba(245,158,11,0.45)] transition-all transform scale-100 group-hover/btn:scale-110 flex items-center gap-1.5 border border-black/10">
               <Sparkles size={11} className="animate-pulse" />
               <span>PLAY MATCH</span>
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
