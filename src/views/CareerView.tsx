import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Trophy, 
  Activity,
  Play,
  Settings as SettingsIcon,
  TrendingUp,
  ShoppingCart,
  X,
  Sparkles,
  AlertTriangle,
  Star
} from 'lucide-react';
import { NBA_TEAMS, getTeamLogo } from '../data/nbaTeams';
import { ALL_CARDS } from '../data/cards';
import { useFranchise } from '../franchise/hooks/useFranchise';
import { stateService } from '../franchise/services/stateService';
import { gameService } from '../franchise/services/gameService';
import { FranchiseState, FranchisePhase, TeamObject, FranchiseMatch, PlayoffSeries } from '../franchise/types';
import { marketService } from '../franchise/services/marketService';
import { tradeEngine } from '../franchise/services/tradeEngine';
import { playoffService } from '../franchise/services/playoffService';
import { generateDraftPool, advanceSeason } from '../franchise/services/rosterService';
import { tradeService } from '../franchise/services/tradeService';
import CardItem from '../components/CardItem';

import confetti from 'canvas-confetti';

import { useNotification } from '../context/NotificationContext';
import { useGame } from '../context/GameContext';

// MODULAR TABS
import HubTab from './career/HubTab';
import LineupTab from './career/LineupTab';
import MarketTab from './career/MarketTab';
import LeagueTab from './career/LeagueTab';
import StatsTab from './career/StatsTab';
import OfficeTab from './career/OfficeTab';
import TradesTab from './career/TradesTab';
import SettingsTab from './career/SettingsTab';
import DraftTab from './career/DraftTab';
import DraftLotteryOverlay from './career/DraftLotteryOverlay';
import SeasonAwardsOverlay from './career/SeasonAwardsOverlay';

type FranchiseTab = 'hub' | 'lineup' | 'market' | 'league' | 'stats' | 'trades' | 'settings' | 'draft' | 'office';

const CareerView: React.FC = () => {
  const { state, isLoading, isSyncing, startNewFranchise, advanceWeek, resetFranchise, setState } = useFranchise();
  const { notifyError, notifySuccess } = useNotification();
  const { updateFranchise: syncToFirestore } = useGame();

  const [activeTab, setActiveTab] = useState<FranchiseTab>('hub');
  const [showLottery, setShowLottery] = useState(false);

  // CPU Trade Proposals Effect
  useEffect(() => {
    if (!state || state.phase === 'season_awards' || state.phase === 'new_season') return;
    
    const checkTrades = () => {
      const newState = { ...state };
      const initialNotifCount = newState.notifications?.length || 0;
      tradeService.generateCPUProposals(newState);
      if ((newState.notifications?.length || 0) > initialNotifCount) {
         console.log("[FRANCHISE] New CPU trade proposal generated");
         setState(newState);
         stateService.save(newState);
      }
    };

    const interval = setInterval(checkTrades, 60000);
    return () => clearInterval(interval);
  }, [state?.phase, state?.season, state?.isActive]);

  const [lastGameResult, setLastGameResult] = useState<{ result: any; match: FranchiseMatch } | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [selectedConf, setSelectedConf] = useState<'East' | 'West'>('East');
  const [lineupModalPos, setLineupModalPos] = useState<string | null>(null);
  const [showChampCelebrate, setShowChampCelebrate] = useState(false);

  // Sync state to firestore when it changes locally
  React.useEffect(() => {
    if (state) {
      syncToFirestore(state);
    }
  }, [state?.phase, state?.season, state?.week, state?.currentGameIndex]);

  const userTeam = useMemo(() => {
    if (!state || !state.userTeamId) return null;
    return state.teams[state.userTeamId];
  }, [state]);

  // OPTIMIZATION: Memoized Card Lookup Map
  const allCardsLookupMap = useMemo(() => {
    const internalMap = new Map<string, any>();
    ALL_CARDS.forEach(c => internalMap.set(c.id, c));
    state?.customCards?.forEach((c: any) => internalMap.set(c.id, c));
    state?.draftPool?.forEach((c: any) => internalMap.set(c.id, c));
    return internalMap;
  }, [state?.customCards, state?.draftPool]);

  // Memoized findCard
  const findCard = React.useCallback((id: string | null) => {
    if (!id) return null;
    const baseCard = allCardsLookupMap.get(id);
    if (!baseCard) return null;
    
    // Apply progression overrides if any
    const progress = state?.playerProgress?.[id];
    let card = { ...baseCard };
    if (progress?.ovr) {
      card.stats = { ...card.stats, ovr: progress.ovr };
    }

    // Include seasonal stats
    const seasonal = state?.stats?.seasonal?.[id];
    if (seasonal && seasonal.gamesPlayed > 0) {
      card = {
        ...card,
        stats: {
          ...card.stats,
          points: Math.round((seasonal.points / seasonal.gamesPlayed) * 10) / 10,
          rebounds: Math.round((seasonal.rebounds / seasonal.gamesPlayed) * 10) / 10,
          assists: Math.round((seasonal.assists / seasonal.gamesPlayed) * 10) / 10
        }
      };
    }
    return card;
  }, [allCardsLookupMap, state?.playerProgress, state?.stats?.seasonal]);

  // Phase transition handlers
  const handleFinalizeOffseason = () => {
    if (!state) return;
    const newState = advanceSeason(state);
    setState(newState);
    setActiveTab('hub');
    notifySuccess(`🏀 Welcome to Season ${newState.season}!`);
    stateService.save(newState);
  };

  const handleStartDraftLottery = () => {
    if (!state) return;
    setShowLottery(true);
  };

  const handleCompleteLottery = () => {
    if (!state) return;
    const newState = { ...state };
    newState.phase = 'draft' as FranchisePhase;
    newState.draftPool = generateDraftPool(newState.season);
    setShowLottery(false);
    setActiveTab('draft');
    setState(newState);
    stateService.save(newState);
  };

  const handleCompleteDraft = () => {
    if (!state) return;
    const newState = { ...state, phase: 'free_agency' as FranchisePhase };
    setState(newState);
    setActiveTab('market');
    stateService.save(newState);
  };

  const handleContinueFromAwards = () => {
    if (!state) return;
    const newState = { ...state, phase: 'playoffs' as FranchisePhase };
    setState(newState);
    stateService.save(newState);
  };

  const simulateGame = React.useCallback(() => {
    if (!state) return;
    const res = gameService.simulateNextUserGame(state);
    if (res) {
      setLastGameResult(res);
      setState({ ...state });
      stateService.save(state);
    }
  }, [state, setState]);

  const handleGoToNewSeason = () => {
    if (!state) return;
    const newState = { ...state, phase: 'new_season' as FranchisePhase };
    setState(newState);
    stateService.save(newState);
  };

  const handleSignPlayer = React.useCallback((cardId: string) => {
    // This could open a negotiation modal or handle instant signing
    console.log("Signing player:", cardId);
  }, []);

  const leagueLeaders = useMemo(() => {
    if (!state?.stats?.seasonal) return [];
    return (['Points', 'Rebounds', 'Assists'] as const).map((cat) => {
      const sorted = (Object.entries(state.stats!.seasonal) as [string, any][])
        .sort(([, a], [, b]) => {
          const valA = cat === 'Points' ? a.points : cat === 'Rebounds' ? a.rebounds : a.assists;
          const valB = cat === 'Points' ? b.points : cat === 'Rebounds' ? b.rebounds : b.assists;
          return (valB / (b.gamesPlayed || 1)) - (valA / (a.gamesPlayed || 1));
        });
      
      const leader = sorted[0];
      if (!leader) return null;
      const [playerId, stats] = leader;
      const card = findCard(playerId);
      const value = (cat === 'Points' ? stats.points : cat === 'Rebounds' ? stats.rebounds : stats.assists) / (stats.gamesPlayed || 1);
      return { cat, card, value, playerId };
    }).filter(Boolean);
  }, [state?.stats?.seasonal, findCard]);

  const renderPlayoffs = () => {
    if (!state) return null;
    return (
      <div className="p-8">
        <h2 className="text-4xl font-black italic uppercase text-white mb-8">Playoff Bracket</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
             <h3 className="text-blue-500 font-bold uppercase tracking-widest mb-4">Eastern Conference</h3>
             {/* Render East Series */}
          </div>
          <div>
             <h3 className="text-red-500 font-bold uppercase tracking-widest mb-4">Western Conference</h3>
             {/* Render West Series */}
          </div>
        </div>
        {/* Sim buttons etc */}
        <div className="mt-8 flex gap-4">
           {!state.championId && (
             <button 
               onClick={() => {
                 playoffService.simulateNextRoundOnly(state);
                 setState({...state});
                 stateService.save(state);
               }}
               className="px-8 py-3 bg-white text-black rounded-xl font-bold uppercase tracking-widest text-xs"
             >
               Simulate Round
             </button>
           )}
           {state.championId && (
             <button 
               onClick={() => {
                 const newState = { ...state, phase: 'offseason_start' as FranchisePhase };
                 setState(newState);
                 stateService.save(newState);
               }}
               className="px-8 py-3 bg-amber-500 text-black rounded-xl font-bold uppercase tracking-widest text-xs"
             >
               Proceed to Offseason
             </button>
           )}
        </div>
      </div>
    );
  };

  const renderPhaseSpecificContent = () => {
    if (!state) return null;

    switch (state.phase) {
      case 'season_awards':
        return <SeasonAwardsOverlay state={state} onContinue={handleContinueFromAwards} />;
      
      case 'offseason_start':
        return (
          <div className="flex-1 bg-black flex flex-col items-center justify-center p-6 text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center shadow-2xl">
               <Trophy className="text-amber-500" size={48} />
            </div>
            <div className="space-y-2">
               <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white">Season Complete</h2>
               <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Offseason Begins Now</p>
            </div>
            <div className="flex flex-col gap-4 w-full max-w-xs">
               <button 
                 onClick={handleStartDraftLottery}
                 className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-500 transition-all shadow-2xl"
               >
                 Enter Draft Lottery
               </button>
            </div>
            {showLottery && (
              <DraftLotteryOverlay 
                picks={state.lotteryPicks || []} 
                teams={state.teams} 
                onComplete={handleCompleteLottery} 
              />
            )}
          </div>
        );

      case 'draft':
        return (
          <div className="flex-1 overflow-hidden flex flex-col">
             <DraftTab 
               state={state} 
               setState={setState} 
               onComplete={handleCompleteDraft}
             />
          </div>
        );

      case 'new_season':
        return (
          <div className="flex-1 bg-black flex flex-col items-center justify-center p-6 text-center space-y-8">
            <div className="w-24 h-24 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center shadow-2xl">
               <Star className="text-amber-500" size={48} />
            </div>
            <div className="space-y-2">
               <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white">Rosters Finalized</h2>
               <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Ready to tip off the new season?</p>
            </div>
            <button 
              onClick={handleFinalizeOffseason}
              className="px-12 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-500 transition-all shadow-2xl"
            >
              Start Season {state.season + 1}
            </button>
          </div>
        );

      default:
        // Regular Season / Playoffs / Free Agency
        return (
          <div className="flex-1 flex flex-col overflow-hidden">
             <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Desktop */}
                <div className="hidden md:flex flex-col w-20 lg:w-64 bg-zinc-950 border-r border-white/5 z-50">
                  <div className="p-4 lg:p-8 shrink-0">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-12 shadow-2xl group cursor-pointer overflow-hidden">
                        <img src={getTeamLogo(state.userTeamId)} className="w-full h-full object-contain p-2" />
                    </div>
                    
                    <nav className="space-y-2">
                      <SidebarItem id="hub" icon={<LayoutDashboard size={20} />} label="Hub" active={activeTab === 'hub'} onClick={() => setActiveTab('hub')} />
                      <SidebarItem id="lineup" icon={<Users size={20} />} label="Roster" active={activeTab === 'lineup'} onClick={() => setActiveTab('lineup')} />
                      <SidebarItem id="market" icon={<ShoppingCart size={20} />} label="Market" active={activeTab === 'market'} onClick={() => setActiveTab('market')} />
                      <SidebarItem id="trades" icon={<TrendingUp size={20} />} label="Trade" active={activeTab === 'trades'} onClick={() => setActiveTab('trades')} />
                      <SidebarItem id="office" icon={<Building size={20} />} label="Front Office" active={activeTab === 'office'} onClick={() => setActiveTab('office')} />
                      <SidebarItem id="league" icon={<Trophy size={20} />} label="League" active={activeTab === 'league'} onClick={() => setActiveTab('league')} />
                      <SidebarItem id="stats" icon={<BarChart3 size={20} />} label="Stats" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
                      <SidebarItem id="settings" icon={<SettingsIcon size={20} />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                    </nav>
                  </div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden bg-black">
                   <div className="flex-1 overflow-y-auto no-scrollbar">
                    <AnimatePresence mode="wait">
                      {activeTab === 'hub' && (
                        <HubTab 
                          key="hub" 
                          state={state} 
                          userTeam={userTeam!} 
                          findCard={findCard} 
                          simulateGame={simulateGame}
                          advanceWeek={advanceWeek}
                          lastGameResult={lastGameResult}
                          onCloseLastGame={() => setLastGameResult(null)}
                          leagueLeaders={leagueLeaders}
                        />
                      )}
                      {activeTab === 'lineup' && <LineupTab key="lineup" state={state} userTeam={userTeam!} findCard={findCard} onOpenModal={setLineupModalPos} />}
                      {activeTab === 'market' && (
                        <MarketTab 
                          key="market" 
                          state={state} 
                          onSignPlayer={handleSignPlayer} 
                          onFinalizeMarket={handleGoToNewSeason} 
                          findCard={findCard} 
                        />
                      )}
                      {activeTab === 'league' && (
                        <LeagueTab 
                          key="league" 
                          state={state} 
                          findCard={findCard} 
                          renderPlayoffs={renderPlayoffs}
                        />
                      )}
                      {activeTab === 'stats' && <StatsTab key="stats" state={state} findCard={findCard} />}
                      {activeTab === 'trades' && <TradesTab key="trades" state={state} setState={setState} findCard={findCard} />}
                      {activeTab === 'office' && <OfficeTab key="office" state={state} findCard={findCard} />}
                      {activeTab === 'settings' && <SettingsTab key="settings" state={state} onReset={resetFranchise} />}
                    </AnimatePresence>
                   </div>
                </div>
             </div>
          </div>
        );
    }
  };

  // Team Selection
  if (!state || !state.userTeamId) {
    return (
      <div className="flex-1 bg-black text-white p-6 md:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="space-y-4">
            <h1 className="text-7xl font-black uppercase italic tracking-tighter">Franchise</h1>
            <p className="text-zinc-500 max-w-2xl font-medium">Build your legacy. Choose your team.</p>
          </div>
          <div className="flex gap-4 border-b border-white/5 pb-4">
             {['East', 'West'].map(c => (
               <button key={c} onClick={() => setSelectedConf(c as any)} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest ${selectedConf === c ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-500'}`}>{c}</button>
             ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {NBA_TEAMS.filter(t => t.conference === selectedConf).map(team => (
              <motion.div 
                key={team.id}
                whileHover={{ scale: 1.05 }}
                onClick={() => startNewFranchise(team.id)}
                className="bg-zinc-900 border border-white/5 rounded-[2rem] p-8 flex flex-col items-center gap-4 cursor-pointer"
              >
                <img src={getTeamLogo(team.id)} className="w-20 h-20 object-contain" />
                <p className="font-black italic uppercase truncate">{team.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Loading State
  if (isLoading) {
    return (
      <div className="flex-1 bg-black flex items-center justify-center">
         <Activity size={48} className="text-white opacity-20 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex bg-black h-screen w-screen overflow-hidden text-white font-sans selection:bg-amber-500/30">
      {renderPhaseSpecificContent()}

      {/* GLOBAL SYNC OVERLAY */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed bottom-6 right-6 z-[3000] flex items-center gap-3 bg-zinc-800 border border-white/10 px-4 py-2 rounded-full shadow-2xl"
          >
            <Activity size={12} className="text-amber-500 animate-spin" />
            <span className="text-[8px] font-black uppercase tracking-widest text-white/50">Syncing...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SidebarItem: React.FC<{ id: string, icon: any, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${active ? 'bg-white text-black' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
  >
    {icon}
    <span className="hidden lg:block text-[10px] font-black uppercase tracking-widest truncate">{label}</span>
  </button>
);

export default CareerView;
