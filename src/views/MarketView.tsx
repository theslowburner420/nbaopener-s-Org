import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../context/GameContext';
import { 
  ArrowLeft, 
  Coins, 
  Flame, 
  Layers, 
  Users, 
  ChevronRight,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import CardUpgrader from '../components/market/CardUpgrader';
import Coinflip from '../components/market/Coinflip';
import TradingView from './TradingView';
import { formatCoinCompact } from '../utils/marketCalculations';

export type MarketTab = 'hub' | 'trading' | 'upgrader' | 'coinflip';

interface MarketViewProps {
  initialTab?: MarketTab;
}

const MarketView: React.FC<MarketViewProps> = ({ initialTab = 'hub' }) => {
  const { setCurrentView, coins, collection } = useGame();
  const [activeTab, setActiveTab] = useState<MarketTab>(initialTab);

  // Total owned cards count
  const totalOwnedCards = Object.values(collection).reduce<number>((acc, qty) => acc + (Number(qty) || 0), 0);

  return (
    <div className="h-full w-full bg-black text-zinc-100 flex flex-col relative overflow-hidden select-none font-sans">
      {/* Subtle Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-[420px] h-[300px] bg-amber-500/[0.04] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[420px] h-[300px] bg-emerald-500/[0.03] rounded-full blur-[140px] pointer-events-none" />

      {/* Minimalist Slim Top Navigation Bar */}
      <header className="px-4 md:px-8 py-3.5 bg-zinc-950/70 border-b border-zinc-900 shrink-0 z-20 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left: Back Action & Clean Breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (activeTab !== 'hub') {
                  setActiveTab('hub');
                } else {
                  setCurrentView('home');
                }
              }}
              className="w-8 h-8 rounded-lg bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-600 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              title={activeTab !== 'hub' ? 'Back to Market' : 'Back to Home'}
            >
              <ArrowLeft size={15} />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wider uppercase text-zinc-400">Market</span>
              {activeTab !== 'hub' && (
                <>
                  <span className="text-zinc-700 text-xs">/</span>
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">
                    {activeTab === 'trading' && 'Trading Hub'}
                    {activeTab === 'upgrader' && 'Card Upgrader'}
                    {activeTab === 'coinflip' && 'Cardflip 50/50'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Center / Tab Navigation (Segmented pill style) */}
          <div className="hidden sm:flex items-center p-1 bg-zinc-900/90 border border-zinc-800/80 rounded-xl">
            <button
              onClick={() => setActiveTab('hub')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'hub'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('trading')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'trading'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Trading
            </button>
            <button
              onClick={() => setActiveTab('upgrader')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'upgrader'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Upgrader
            </button>
            <button
              onClick={() => setActiveTab('coinflip')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'coinflip'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Cardflip
            </button>
          </div>

          {/* Right: User Quick Balance */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800/80">
              <Coins size={13} className="text-amber-400" />
              <span className="text-xs font-medium text-amber-300 font-mono">
                {formatCoinCompact(coins)}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800/80">
              <Layers size={13} className="text-zinc-400" />
              <span className="text-xs font-medium text-zinc-300 font-mono">
                {totalOwnedCards}
              </span>
            </div>
          </div>

        </div>

        {/* Mobile Sub-tabs */}
        <div className="flex sm:hidden items-center gap-1 mt-2.5 pt-2 border-t border-zinc-900 overflow-x-auto">
          {(['hub', 'trading', 'upgrader', 'coinflip'] as MarketTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab 
                      ? 'bg-zinc-800 text-white' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab === 'hub' && 'Overview'}
                  {tab === 'trading' && 'Trading'}
                  {tab === 'upgrader' && 'Upgrader'}
                  {tab === 'coinflip' && 'Cardflip'}
                </button>
              ))}
            </div>
          </header>

      {/* Content Area */}
      <div className={`flex-1 relative ${activeTab === 'hub' ? 'overflow-y-auto custom-scrollbar' : 'overflow-hidden flex flex-col'}`}>
        <AnimatePresence mode="wait">
          {activeTab === 'hub' && (
            <motion.div
              key="hub"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6"
            >
              {/* Minimalist Clean Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-900 pb-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                    Market
                  </h1>
                  <p className="text-sm text-zinc-400 mt-1 max-w-lg">
                    Trade cards directly with players, upgrade duplicates for higher-rated stars, or play 50/50 coinflips.
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs text-zinc-500 font-mono">
                  <div>
                    <span className="text-zinc-300 font-medium">{totalOwnedCards}</span> cards owned
                  </div>
                  <span>•</span>
                  <div>
                    <span className="text-amber-400 font-medium">{formatCoinCompact(coins)}</span> coins
                  </div>
                </div>
              </div>

              {/* 3 Clean Minimalist Modules */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. TRADING HUB */}
                <div
                  onClick={() => setActiveTab('trading')}
                  className="group relative rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 transition-all duration-200 cursor-pointer overflow-hidden p-5 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header with Icon and Tag */}
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 group-hover:text-amber-400 transition-colors">
                        <Users size={18} />
                      </div>
                      <span className="text-[11px] font-medium text-zinc-500 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">
                        Peer-to-Peer
                      </span>
                    </div>

                    {/* Text Details */}
                    <div>
                      <h2 className="text-base font-semibold text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                        Trading Hub
                        <ArrowUpRight size={14} className="text-zinc-500 group-hover:text-amber-400 transition-colors" />
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                        Create rooms or join active lobbies to swap duplicate cards with online collectors.
                      </p>
                    </div>
                  </div>

                  {/* Footer link */}
                  <div className="pt-6 mt-4 border-t border-zinc-900/80 flex items-center justify-between text-xs font-medium text-zinc-400 group-hover:text-white transition-colors">
                    <span>Enter Lobby</span>
                    <ChevronRight size={14} className="text-zinc-600 group-hover:text-zinc-300 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>

                {/* 2. CARD UPGRADER */}
                <div
                  onClick={() => setActiveTab('upgrader')}
                  className="group relative rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-emerald-500/40 transition-all duration-200 cursor-pointer overflow-hidden p-5 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 group-hover:text-emerald-400 transition-colors">
                        <Flame size={18} />
                      </div>
                      <span className="text-[11px] font-medium text-emerald-400/90 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        Calculated Odds
                      </span>
                    </div>

                    <div>
                      <h2 className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                        Card Upgrader
                        <ArrowUpRight size={14} className="text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                        Sacrifice duplicate cards for a calculated percentage chance to win high-OVR GOAT cards.
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-zinc-900/80 flex items-center justify-between text-xs font-medium text-zinc-400 group-hover:text-white transition-colors">
                    <span>Open Upgrader</span>
                    <ChevronRight size={14} className="text-zinc-600 group-hover:text-zinc-300 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>

                {/* 3. COINFLIP */}
                <div
                  onClick={() => setActiveTab('coinflip')}
                  className="group relative rounded-2xl bg-zinc-950 border border-zinc-800/80 hover:border-purple-500/40 transition-all duration-200 cursor-pointer overflow-hidden p-5 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 group-hover:text-purple-400 transition-colors">
                        <Coins size={18} />
                      </div>
                      <span className="text-[11px] font-medium text-purple-400/90 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20">
                        2.0x Double
                      </span>
                    </div>

                    <div>
                      <h2 className="text-base font-semibold text-white group-hover:text-purple-400 transition-colors flex items-center gap-1.5">
                        Coinflip 50/50
                        <ArrowUpRight size={14} className="text-zinc-500 group-hover:text-purple-400 transition-colors" />
                      </h2>
                      <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                        Wager coins or duplicate cards on Heads vs Tails with instant 2.0x fair payouts.
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 mt-4 border-t border-zinc-900/80 flex items-center justify-between text-xs font-medium text-zinc-400 group-hover:text-white transition-colors">
                    <span>Play 50/50</span>
                    <ChevronRight size={14} className="text-zinc-600 group-hover:text-zinc-300 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {activeTab === 'trading' && (
            <motion.div
              key="trading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full flex flex-col overflow-hidden"
            >
              <TradingView />
            </motion.div>
          )}

          {activeTab === 'upgrader' && (
            <motion.div
              key="upgrader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full flex flex-col overflow-hidden"
            >
              <CardUpgrader onBackToHub={() => setActiveTab('hub')} />
            </motion.div>
          )}

          {activeTab === 'coinflip' && (
            <motion.div
              key="coinflip"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full w-full flex flex-col overflow-hidden"
            >
              <Coinflip onBackToHub={() => setActiveTab('hub')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MarketView;
