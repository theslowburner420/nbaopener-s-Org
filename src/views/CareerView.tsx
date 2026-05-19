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
import BoxScoreModal from './career/BoxScoreModal';
import DraftLotteryOverlay from './career/DraftLotteryOverlay';
import SeasonAwardsOverlay from './career/SeasonAwardsOverlay';
import NegotiationOverlay from '../components/NegotiationOverlay';

type FranchiseTab = 'hub' | 'lineup' | 'market' | 'league' | 'stats' | 'trades' | 'settings' | 'draft' | 'office';

const CareerView: React.FC = () => {
  const { state, isLoading, isSyncing, startNewFranchise, advanceWeek, resetFranchise, setState } = useFranchise();
  const { notifyError, notifySuccess } = useNotification();
  const { updateFranchise: syncToFirestore } = useGame();

  const [activeTab, setActiveTab] = useState<FranchiseTab>('hub');
  const [showLottery, setShowLottery] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

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
  const [negotiationPlayerId, setNegotiationPlayerId] = useState<string | null>(null);
  const [negotiationMode, setNegotiationMode] = useState<'extension' | 'signing'>('signing');

  const [tradeTargetTeamId, setTradeTargetTeamId] = useState<string | null>(null);
  const [userOfferedIds, setUserOfferedIds] = useState<string[]>([]);
  const [userOfferedPickIds, setUserOfferedPickIds] = useState<string[]>([]);
  const [cpuRequestedIds, setCpuRequestedIds] = useState<string[]>([]);
  const [cpuRequestedPickIds, setCpuRequestedPickIds] = useState<string[]>([]);

  const handleExecuteTrade = () => {
    if (!state || !tradeTargetTeamId) return;
    
    // Construct offer
    const offer = {
      fromTeamId: state.userTeamId,
      toTeamId: tradeTargetTeamId,
      offeredPlayerIds: userOfferedIds,
      requestedPlayerIds: cpuRequestedIds,
      offeredPickIds: userOfferedPickIds,
      requestedPickIds: cpuRequestedPickIds
    };

    // Evaluate trade
    const evaluation = tradeEngine.evaluateUserTrade(state, offer);

    if (evaluation.accepted) {
      // executeTrade modifies the state object directly
      tradeEngine.executeTrade(state, offer);
      
      const newState = { ...state };
      setState(newState);
      stateService.save(newState);
      notifySuccess("✅ Trade Accepted!");
      
      // Reset trade states
      setUserOfferedIds([]);
      setUserOfferedPickIds([]);
      setCpuRequestedIds([]);
      setCpuRequestedPickIds([]);
    } else {
      notifyError(`❌ Trade Rejected: ${evaluation.reason}`);
    }
  };

  // Sync state to firestore when it changes locally
  React.useEffect(() => {
    if (state) {
      if (!state.phase) {
        state.phase = 'regular_season';
        stateService.save(state);
      }
      syncToFirestore(state);
    }
  }, [state?.phase, state?.season, state?.week, state?.currentGameIndex]);

  const userTeam = useMemo(() => {
    if (!state || !state.userTeamId) return null;
    return state.teams[state.userTeamId];
  }, [state]);

  const nextUserGame = useMemo(() => {
    if (!state || !state.userTeamId || !state.schedule) return null;
    return state.schedule.find((m: any) => 
      !m.played && (m.homeTeamId === state.userTeamId || m.awayTeamId === state.userTeamId)
    );
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
      // simulateNextUserGame already modified state in memory and saved it
      setState({ ...state });
    }
  }, [state, setState]);

  const handleCloseBoxScore = () => {
    setLastGameResult(null);
    // If the game result we just closed was the end of the season, 
    // the phase transition already happened in simulateNextUserGame.
    // CareerView re-renders and will show SeasonAwardsOverlay.
  };

  const handleGoToNewSeason = () => {
    if (!state) return;
    const newState = { ...state, phase: 'new_season' as FranchisePhase };
    setState(newState);
    stateService.save(newState);
  };

  const handleSignPlayer = React.useCallback((cardId: string) => {
    setNegotiationMode('signing');
    setNegotiationPlayerId(cardId);
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
    const bracket = state.playoffs?.bracket || {};
    
    const renderSeries = (series: PlayoffSeries, label: string) => {
      const teamA = state.teams[series.team1Id];
      const teamB = state.teams[series.team2Id];
      if (!teamA || !teamB) return null;

      const isFinished = series.wins1 >= 4 || series.wins2 >= 4;
      const winnerId = series.wins1 >= 4 ? series.team1Id : series.wins2 >= 4 ? series.team2Id : null;

      return (
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 space-y-3 min-w-[200px]">
           <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-[10px] font-black text-amber-500 uppercase italic">{label}</span>
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{isFinished ? 'Final' : `Game ${series.wins1 + series.wins2 + 1}`}</span>
           </div>
           <div className="space-y-2">
             {[
               { id: series.team1Id, wins: series.wins1, seed: series.seed1 },
               { id: series.team2Id, wins: series.wins2, seed: series.seed2 }
             ].map((t) => (
               <div key={t.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <span className="text-[8px] font-black text-zinc-700 w-3">{t.seed}</span>
                     <img src={getTeamLogo(t.id)} className="w-6 h-6 object-contain" />
                     <span className={`text-xs font-black uppercase italic ${winnerId === t.id ? 'text-amber-500' : 'text-white'}`}>{state.teams[t.id].abbreviation}</span>
                  </div>
                  <span className={`text-lg font-black italic tabular-nums ${winnerId === t.id ? 'text-amber-500' : 'text-zinc-500'}`}>{t.wins}</span>
               </div>
             ))}
           </div>
        </div>
      );
    };

    return (
      <div className="h-full flex flex-col">
        <div className="p-4 md:p-8 flex items-center justify-between">
          <div className="space-y-1">
             <h2 className="text-2xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-none">Playoff Bracket</h2>
             <p className="text-[10px] md:text-sm font-bold text-zinc-600 uppercase tracking-[0.4em] italic">Road to the Championship</p>
          </div>
          <div className="flex gap-2">
            {!state.championId && (
              <button 
                onClick={() => {
                  playoffService.simulateNextRoundOnly(state);
                  setState({...state});
                  stateService.save(state);
                }}
                className="px-6 md:px-10 py-3 md:py-4 bg-white text-black rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-xs hover:bg-amber-500 transition-all shadow-2xl active:scale-95"
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
                className="px-6 md:px-10 py-3 md:py-4 bg-amber-500 text-black rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[9px] md:text-xs hover:bg-amber-400 transition-all shadow-2xl active:scale-95"
              >
                Proceed to Offseason
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar pb-12">
          <div className="min-w-[1200px] h-full flex items-center gap-12 px-8">
            {/* QUARTER FINALS */}
            <div className="flex flex-col justify-around h-full gap-8">
               <div className="space-y-8">
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest text-center border-b border-blue-500/20 pb-2">East Semis</p>
                  {state.playoffs?.series?.filter((s: any) => s.conference === 'East' && s.round === 1).map((s: any, i: number) => renderSeries(s, `SR ${i+1}`))}
               </div>
               <div className="space-y-8">
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest text-center border-b border-red-500/20 pb-2">West Semis</p>
                  {state.playoffs?.series?.filter((s: any) => s.conference === 'West' && s.round === 1).map((s: any, i: number) => renderSeries(s, `SR ${i+1}`))}
               </div>
            </div>

            {/* CONFERENCE FINALS */}
            <div className="flex flex-col justify-around h-full gap-24">
               {state.playoffs?.series?.filter((s: any) => s.round === 2).map((s: any) => renderSeries(s, s.conference === 'East' ? 'East Finals' : 'West Finals'))}
            </div>

            {/* FINALS */}
            <div className="flex flex-col justify-center h-full">
               <div className="space-y-4 text-center">
                  <Trophy className="text-amber-500 mx-auto animate-pulse" size={48} />
                  {state.playoffs?.series?.filter((s: any) => s.round === 3).map((s: any) => renderSeries(s, 'The Finals'))}
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleNegotiationStart = (playerId: string) => {
    setNegotiationMode('extension');
    setNegotiationPlayerId(playerId);
  };

  const handleAcceptNegotiation = (salary: number, years: number) => {
    if (!state || !negotiationPlayerId) return;

    const newState = { ...state };
    const team = newState.teams[state.userTeamId];
    
    if (negotiationMode === 'signing') {
      // Free agency signing
      team.roster.push(negotiationPlayerId);
      team.contracts[negotiationPlayerId] = {
        salary,
        yearsRemaining: years,
        canExtend: false,
        contractType: salary > 20_000_000 ? 'max' : 'veteran'
      };
      newState.freeAgentPool = newState.freeAgentPool.filter((id: string) => id !== negotiationPlayerId);
      notifySuccess("Player signed successfully!");
    } else {
      // Contract extension
      team.contracts[negotiationPlayerId] = {
        ...team.contracts[negotiationPlayerId],
        salary,
        yearsRemaining: team.contracts[negotiationPlayerId].yearsRemaining + years,
        canExtend: false
      };
      notifySuccess("Contract extended!");
    }

    // Recalculate payroll
    team.payroll = Object.values(team.contracts).reduce((sum: any, c: any) => sum + c.salary, 0);

    setState(newState);
    stateService.save(newState);
    setNegotiationPlayerId(null);
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
                          nextUserGame={nextUserGame}
                          simulateGame={simulateGame}
                          leagueLeaders={leagueLeaders}
                          setActiveTab={setActiveTab}
                          setState={setState}
                          renderPlayoffs={renderPlayoffs}
                          triggerLottery={handleStartDraftLottery}
                        />
                      )}
                      {activeTab === 'lineup' && (
                        <LineupTab 
                          key="lineup" 
                          state={state} 
                          userTeam={userTeam!} 
                          findCard={findCard} 
                          lineupModalPos={lineupModalPos}
                          setLineupModalPos={setLineupModalPos}
                          handleUpdateLineup={(playerId) => {
                            if (!state || !lineupModalPos) return;
                            const newState = { ...state };
                            const team = newState.teams[state.userTeamId];
                            if (lineupModalPos === 'bench') {
                               if (!team.lineup.bench.includes(playerId)) {
                                  team.lineup.bench.push(playerId);
                               }
                            } else {
                               team.lineup[lineupModalPos] = playerId;
                            }
                            setState(newState);
                            stateService.save(newState);
                          }}
                          setState={setState}
                        />
                      )}
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
                      {activeTab === 'stats' && (
                        <StatsTab 
                          key="stats" 
                          state={state} 
                          userTeam={userTeam!}
                          findCard={findCard} 
                        />
                      )}
                      {activeTab === 'trades' && (
                        <TradesTab 
                          key="trades" 
                          state={state} 
                          tradeTargetTeamId={tradeTargetTeamId}
                          setTradeTargetTeamId={setTradeTargetTeamId}
                          userOfferedIds={userOfferedIds}
                          setUserOfferedIds={setUserOfferedIds}
                          userOfferedPickIds={userOfferedPickIds}
                          setUserOfferedPickIds={setUserOfferedPickIds}
                          cpuRequestedIds={cpuRequestedIds}
                          setCpuRequestedIds={setCpuRequestedIds}
                          cpuRequestedPickIds={cpuRequestedPickIds}
                          setCpuRequestedPickIds={setCpuRequestedPickIds}
                          handleExecuteTrade={handleExecuteTrade}
                          findCard={findCard} 
                        />
                      )}
                      {activeTab === 'office' && (
                        <OfficeTab 
                          key="office" 
                          state={state} 
                          userTeam={userTeam!}
                          findCard={findCard} 
                          handleNegotiationStart={handleNegotiationStart}
                          setState={setState}
                        />
                      )}
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
    <div className="flex bg-black h-screen w-screen overflow-hidden text-white font-sans selection:bg-amber-500/30 touch-none">
      <div className="flex-1 flex flex-col md:flex-row h-full w-full overflow-hidden relative">
        {renderPhaseSpecificContent()}
        
        {/* MOBILE BOTTOM NAVIGATION */}
        <div className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-zinc-950/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-around z-[4000] pb-safe">
          <MobileTab id="hub" icon={<LayoutDashboard size={20} />} label="Hub" active={activeTab === 'hub'} onClick={() => setActiveTab('hub')} />
          <MobileTab id="lineup" icon={<Users size={20} />} label="Roster" active={activeTab === 'lineup'} onClick={() => setActiveTab('lineup')} />
          <MobileTab id="market" icon={<ShoppingCart size={20} />} label="Market" active={activeTab === 'market'} onClick={() => setActiveTab('market')} />
          <MobileTab id="league" icon={<Trophy size={20} />} label="League" active={activeTab === 'league'} onClick={() => setActiveTab('league')} />
          <button 
            onClick={() => setShowMoreMenu(true)} 
            className="flex flex-col items-center justify-center gap-1 w-12"
          >
            <div className="flex gap-0.5">
               <div className="w-1 h-1 bg-zinc-500 rounded-full" />
               <div className="w-1 h-1 bg-zinc-500 rounded-full" />
               <div className="w-1 h-1 bg-zinc-500 rounded-full" />
            </div>
            <span className="text-[8px] font-black uppercase text-zinc-500">More</span>
          </button>
        </div>

        {/* BOX SCORE MODAL */}
        <AnimatePresence>
          {lastGameResult && (
             <BoxScoreModal 
               result={lastGameResult.result}
               homeTeam={state.teams[lastGameResult.match.homeTeamId]}
               awayTeam={state.teams[lastGameResult.match.awayTeamId]}
               userTeamId={state.userTeamId}
               onContinue={handleCloseBoxScore}
             />
          )}
        </AnimatePresence>

        {/* NEGOTIATION OVERLAY */}
        <AnimatePresence>
          {negotiationPlayerId && (
            <NegotiationOverlay 
              card={findCard(negotiationPlayerId)}
              state={state}
              userTeam={userTeam}
              mode={negotiationMode}
              onAccept={handleAcceptNegotiation}
              onClose={() => setNegotiationPlayerId(null)}
            />
          )}
        </AnimatePresence>

        {/* MORE MENU DRAWER (Mobile) */}
        <AnimatePresence>
          {showMoreMenu && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-[4500] bg-black/90 backdrop-blur-md flex flex-col justify-end"
              onClick={() => setShowMoreMenu(false)}
            >
              <motion.div 
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="bg-zinc-900 rounded-t-[2.5rem] p-8 border-t border-white/10"
                onClick={e => e.stopPropagation()}
              >
                <div className="grid grid-cols-3 gap-6">
                   <DrawerItem icon={<TrendingUp size={24} />} label="Trade" active={activeTab === 'trades'} onClick={() => { setActiveTab('trades'); setShowMoreMenu(false); }} />
                   <DrawerItem icon={<Building size={24} />} label="Office" active={activeTab === 'office'} onClick={() => { setActiveTab('office'); setShowMoreMenu(false); }} />
                   <DrawerItem icon={<BarChart3 size={24} />} label="Stats" active={activeTab === 'stats'} onClick={() => { setActiveTab('stats'); setShowMoreMenu(false); }} />
                   <DrawerItem icon={<SettingsIcon size={24} />} label="Settings" active={activeTab === 'settings'} onClick={() => { setActiveTab('settings'); setShowMoreMenu(false); }} />
                </div>
                <button onClick={() => setShowMoreMenu(false)} className="w-full mt-12 py-4 bg-white/5 rounded-2xl font-black uppercase tracking-widest text-[10px] text-zinc-500">Close</button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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

const MobileTab: React.FC<{ id: string, icon: any, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 w-14 h-full border-t-2 transition-all ${active ? 'border-amber-500 text-amber-500' : 'border-transparent text-zinc-500'}`}
  >
    {icon}
    <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
  </button>
);

const DrawerItem: React.FC<{ icon: any, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-2 p-4 rounded-3xl transition-all ${active ? 'bg-amber-500 text-black' : 'bg-white/5 text-zinc-400'}`}>
       {icon}
       <span className="text-[9px] font-black uppercase">{label}</span>
    </button>
);

export default CareerView;
