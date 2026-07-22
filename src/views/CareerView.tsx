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
import { PlayerHeadshot } from '../components/PlayerHeadshot';
import { tradeEngine } from '../franchise/services/tradeEngine';
import { playoffService } from '../franchise/services/playoffService';
import { generateDraftPool, advanceSeason } from '../franchise/services/rosterService';
import { tradeService } from '../franchise/services/tradeService';
import CardItem from '../components/CardItem';
import { BracketCanvas } from '../components/BracketCanvas';

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
  const [activePlayoffRound, setActivePlayoffRound] = useState<number>(1);

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

  const [showPreseasonReport, setShowPreseasonReport] = useState(false);
  const [preseasonPlayers, setPreseasonPlayers] = useState<any[]>([]);

  // Automatically trigger celebration when state champion is user
  useEffect(() => {
    if (state?.championId && state?.championId === state?.userTeamId) {
      setShowChampCelebrate(true);
    } else {
      setShowChampCelebrate(false);
    }
  }, [state?.championId, state?.userTeamId]);

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
    const newState = { ...state };
    const finalizedState = advanceSeason(newState);

    // Compute progress details for the user's active roster
    const team = finalizedState.teams[finalizedState.userTeamId];
    if (team && team.roster) {
      const list = team.roster.map((pId: string) => {
        // Base card finder inside ALL_CARDS or custom cards or draft pool
        const baseCard = ALL_CARDS.find(c => c.id === pId) || 
                         finalizedState.customCards?.find((c: any) => c.id === pId) || 
                         finalizedState.draftPool?.find((c: any) => c.id === pId);
                         
        const progress = finalizedState.playerProgress?.[pId];
        const previousOvr = progress?.ovrAtSeasonStart || baseCard?.stats.ovr || 70;
        const currentOvr = progress?.ovr || previousOvr;
        
        return {
          id: pId,
          name: baseCard?.name || 'Unknown Prospect',
          position: baseCard?.position || 'F',
          previousOvr,
          currentOvr,
          diff: currentOvr - previousOvr,
          imageUrl: baseCard?.imageUrl,
          nbaId: baseCard?.nbaId
        };
      });
      setPreseasonPlayers(list);
      setShowPreseasonReport(true);
    }
    
    setState(finalizedState);
    setActiveTab('hub');
    notifySuccess(`🏀 Welcome to Season ${finalizedState.season}!`);
    stateService.save(finalizedState);
  };

  const handleStartDraftLottery = () => {
    if (!state) return;
    const newState = { ...state };
    newState.phase = 'draft_lottery' as FranchisePhase;
    
    // Generate lottery picks if they don't exist
    const order1 = marketService.getDraftOrder(newState, newState.season, 1);
    newState.lotteryPicks = order1.slice(0, 14).map(o => o.teamId);
    
    setState(newState);
    setShowLottery(true);
    stateService.save(newState);
  };

  const handleCompleteLottery = () => {
    if (!state) return;
    const previousPhase = state.phase;
    const newState = { ...state };
    newState.phase = 'draft' as FranchisePhase;
    
    console.log('[FRANCHISE PHASE]', previousPhase, '→', newState.phase, 
      { currentGameIndex: newState.currentGameIndex, wins: state.teams[state.userTeamId].wins, losses: state.teams[state.userTeamId].losses, timestamp: new Date().toISOString() });

    newState.draftPool = generateDraftPool(newState.season);
    setShowLottery(false);
    setActiveTab('draft');
    setState(newState);
    stateService.save(newState);
  };

  const handleCompleteDraft = () => {
    if (!state) return;
    const previousPhase = state.phase;
    const newState = { ...state, phase: 'free_agency' as FranchisePhase };
    
    console.log('[FRANCHISE PHASE]', previousPhase, '→', newState.phase, 
      { currentGameIndex: newState.currentGameIndex, wins: state.teams[state.userTeamId].wins, losses: state.teams[state.userTeamId].losses, timestamp: new Date().toISOString() });

    setState(newState);
    setActiveTab('market');
    stateService.save(newState);
  };

  const handleContinueFromAwards = () => {
    if (!state) return;
    const previousPhase = state.phase;
    const newState = { ...state, phase: 'playoffs' as FranchisePhase };
    
    console.log('[FRANCHISE PHASE]', previousPhase, '→', newState.phase, 
      { currentGameIndex: newState.currentGameIndex, wins: state.teams[state.userTeamId].wins, losses: state.teams[state.userTeamId].losses, timestamp: new Date().toISOString() });

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

  const simulateMultiple = React.useCallback(async (count: number, onProgress?: (completedCount: number) => void) => {
    if (!state) return;
    let currentState = { ...state };
    let wins = 0;
    let losses = 0;
    
    for (let i = 0; i < count; i++) {
      const res = gameService.simulateNextUserGame(currentState);
      if (!res) break;
      
      const userTeamId = currentState.userTeamId;
      if (res.result.winnerId === userTeamId) {
        wins++;
      } else {
        losses++;
      }
      
      if (onProgress) {
        onProgress(i + 1);
      }
      
      // Minimal artificial pause for user to witness progress bar filling up dynamically
      await new Promise(resolve => setTimeout(resolve, 80));
      
      if (currentState.phase !== 'regular_season') {
        break;
      }
    }
    
    setState({ ...currentState });
    stateService.save(currentState);
    
    if (wins + losses > 0) {
      notifySuccess(`Batch Simulation Processed! Result: ${wins}W - ${losses}L`);
    }
  }, [state, setState, notifySuccess]);

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
    return (
      <BracketCanvas
        state={state}
        onSimulateRound={() => {
          playoffService.simulateNextRoundOnly(state);
          setState({ ...state });
          stateService.save(state);
        }}
        onSimulateUserGame={() => {
          const res = gameService.simulateUserPlayoffGame(state);
          if (res) {
            const winnerName = state.teams[res.result.winnerId]?.name || 'Opponent';
            notifySuccess(`Playoff Game Simulated! Winner: ${winnerName} (${res.result.score.home} - ${res.result.score.away})`);
          }
          setState({ ...state });
          stateService.save(state);
        }}
      />
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
        const teamColors = state ? NBA_TEAMS.find(t => t.id === state.userTeamId) : null;
        return (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Desktop - Clean floating visual glass backdrop */}
                <div className="hidden md:flex flex-col w-24 lg:w-64 bg-zinc-950/45 backdrop-blur-2xl border-r border-white/5 z-50 transition-all p-4 lg:p-6 justify-between select-none">
                  <div className="flex flex-col gap-8 w-full">
                    <div className="flex items-center gap-3 w-full self-start">
                      <div 
                        className="w-11 h-11 rounded-xl flex items-center justify-center shadow-2xl overflow-hidden shrink-0 bg-zinc-900 border border-white/5"
                        style={{ boxShadow: teamColors ? `0 0 15px ${teamColors.primaryColor}22` : undefined }}
                      >
                        <img src={getTeamLogo(state.userTeamId)} className="w-8 h-8 object-contain" />
                      </div>
                      <div className="hidden lg:block leading-tight shrink-0 min-w-0">
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block">FRANCHISE MANAGER</span>
                        <h4 className="font-mono text-xs font-black text-white italic truncate uppercase mt-0.5">
                          {teamColors?.id || 'TEAM'}
                        </h4>
                      </div>
                    </div>
                    
                    <nav className="space-y-1 w-full">
                      <SidebarItem id="hub" icon={<LayoutDashboard size={18} />} label="Hub" active={activeTab === 'hub'} onClick={() => setActiveTab('hub')} />
                      <SidebarItem id="lineup" icon={<Users size={18} />} label="Roster" active={activeTab === 'lineup'} onClick={() => setActiveTab('lineup')} />
                      <SidebarItem id="market" icon={<ShoppingCart size={18} />} label="Market" active={activeTab === 'market'} onClick={() => setActiveTab('market')} />
                      <SidebarItem id="trades" icon={<TrendingUp size={18} />} label="Trade" active={activeTab === 'trades'} onClick={() => setActiveTab('trades')} />
                      <SidebarItem id="office" icon={<Building size={18} />} label="Front Office" active={activeTab === 'office'} onClick={() => setActiveTab('office')} />
                      <SidebarItem id="league" icon={<Trophy size={18} />} label="League" active={activeTab === 'league'} onClick={() => setActiveTab('league')} />
                      <SidebarItem id="stats" icon={<BarChart3 size={18} />} label="Stats" active={activeTab === 'stats'} onClick={() => setActiveTab('stats')} />
                      <SidebarItem id="settings" icon={<SettingsIcon size={18} />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
                    </nav>
                  </div>

                  <div className="hidden lg:flex flex-col gap-1 inline-block border-t border-white/5 pt-4 text-left">
                    <span className="text-[7px] font-mono text-zinc-500">YEAR</span>
                    <span className="text-sm font-black italic uppercase leading-none text-white">SEASON {state.season + 1}</span>
                  </div>
                </div> 

                <div className="flex-1 flex flex-col overflow-hidden bg-black">
                   <div className="flex-1 overflow-y-auto no-scrollbar">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="flex-grow min-h-full flex flex-col"
                      >
                        {activeTab === 'hub' && (
                          <HubTab 
                            state={state} 
                            userTeam={userTeam!} 
                            nextUserGame={nextUserGame}
                            simulateGame={simulateGame}
                            simulateMultiple={simulateMultiple}
                            leagueLeaders={leagueLeaders}
                            setActiveTab={setActiveTab}
                            setState={setState}
                            renderPlayoffs={renderPlayoffs}
                            triggerLottery={handleStartDraftLottery}
                          />
                        )}
                        {activeTab === 'lineup' && (
                          <LineupTab 
                            state={state} 
                            userTeam={userTeam!} 
                            findCard={findCard} 
                            lineupModalPos={lineupModalPos}
                            setLineupModalPos={setLineupModalPos}
                            handleUpdateLineup={(playerId) => {
                              if (!state || !lineupModalPos) return;
                              const newState = { ...state };
                              const team = newState.teams[state.userTeamId];
                              
                              const positions = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
                              
                              // Find current position of playerId
                              let currentPos: 'PG' | 'SG' | 'SF' | 'PF' | 'C' | 'bench' | null = null;
                              if (team.lineup.bench.includes(playerId)) {
                                currentPos = 'bench';
                              } else {
                                const foundStarter = positions.find(p => team.lineup[p] === playerId);
                                if (foundStarter) {
                                  currentPos = foundStarter;
                                }
                              }

                              const targetPos = lineupModalPos as 'PG' | 'SG' | 'SF' | 'PF' | 'C' | 'bench';
                              if (currentPos === targetPos) {
                                setLineupModalPos(null);
                                return;
                              }

                              if (targetPos === 'bench') {
                                // Moving a starter to bench
                                if (currentPos && currentPos !== 'bench') {
                                  team.lineup[currentPos] = null;
                                }
                                if (!team.lineup.bench.includes(playerId)) {
                                  team.lineup.bench.push(playerId);
                                }
                              } else {
                                // Moving to PG, SG, SF, PF, C
                                const oldPlayerId = team.lineup[targetPos];

                                // Set targets
                                team.lineup[targetPos] = playerId;

                                if (currentPos === 'bench') {
                                  // Removed from bench
                                  team.lineup.bench = team.lineup.bench.filter(id => id !== playerId);
                                  // If there was an old starter, put them on the bench
                                  if (oldPlayerId && !team.lineup.bench.includes(oldPlayerId)) {
                                    team.lineup.bench.push(oldPlayerId);
                                  }
                                } else if (currentPos) {
                                  // Swapped starter with starter
                                  team.lineup[currentPos] = oldPlayerId;
                                } else {
                                  // Player was not in lineup at all but is in team.roster, add oldPlayerId to bench
                                  if (oldPlayerId && !team.lineup.bench.includes(oldPlayerId)) {
                                    team.lineup.bench.push(oldPlayerId);
                                  }
                                }
                              }

                              // Ensure no duplicates anywhere
                              const seen = new Set<string>();
                              positions.forEach(pos => {
                                const id = team.lineup[pos];
                                if (id) {
                                  if (seen.has(id)) {
                                    team.lineup[pos] = null;
                                  } else {
                                    seen.add(id);
                                  }
                                }
                              });
                              team.lineup.bench = team.lineup.bench.filter(id => {
                                if (seen.has(id)) return false;
                                seen.add(id);
                                return true;
                              });

                              setState(newState);
                              stateService.save(newState);
                              setLineupModalPos(null);
                            }}
                            setState={setState}
                          />
                        )}
                        {activeTab === 'market' && (
                          <MarketTab 
                            state={state} 
                            onSignPlayer={handleSignPlayer} 
                            onFinalizeMarket={handleGoToNewSeason} 
                            findCard={findCard} 
                          />
                        )}
                        {activeTab === 'league' && (
                          <LeagueTab 
                            state={state} 
                            findCard={findCard} 
                            renderPlayoffs={renderPlayoffs}
                          />
                        )}
                        {activeTab === 'stats' && (
                          <StatsTab 
                            state={state} 
                            userTeam={userTeam!}
                            findCard={findCard} 
                          />
                        )}
                        {activeTab === 'trades' && (
                          <TradesTab 
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
                            state={state} 
                            userTeam={userTeam!}
                            findCard={findCard} 
                            handleNegotiationStart={handleNegotiationStart}
                            setState={setState}
                          />
                        )}
                        {activeTab === 'settings' && <SettingsTab state={state} onReset={resetFranchise} />}
                      </motion.div>
                    </AnimatePresence>
                    {/* Add spacer under mobile nav to prevent overlapping content bottom */}
                    <div className="h-20 md:hidden" />
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
      <div className="flex-1 min-h-screen bg-[#000000] text-white p-6 md:p-12 overflow-y-auto relative select-none">
        {/* Subtle dynamic grid overlay in background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto space-y-10 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-white/10 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-[0.25em] text-zinc-400">Career Mode Arena</span>
            </div>
            <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter leading-none bg-gradient-to-r from-white via-zinc-205 to-zinc-500 bg-clip-text text-transparent">
              FRANCHISE
            </h1>
            <p className="text-zinc-500 max-w-xl font-medium text-xs md:text-sm uppercase tracking-wider">
              Secure your spot in NBA history. Select your franchise and begin your dynasty.
            </p>
          </div>

          {/* Minimalist Neo-Neon Conference Selector */}
          <div className="flex gap-2 border-b border-white/5 pb-6">
            {['East', 'West'].map(c => (
              <button 
                key={c} 
                onClick={() => setSelectedConf(c as any)} 
                className={`relative px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                  selectedConf === c 
                    ? 'bg-white text-black font-extrabold shadow-[0_0_20px_rgba(255,255,255,0.15)]' 
                    : 'bg-zinc-950/80 text-zinc-500 border border-white/5 hover:border-white/10 hover:text-zinc-300'
                }`}
              >
                {c} CONFERENCE
                {selectedConf === c && (
                  <span className="absolute -bottom-[25px] left-1/2 -translate-x-1/2 w-4 h-[2px] bg-amber-500" />
                )}
              </button>
            ))}
          </div>

          {/* Teams Grid - Spectacular Console Card layout */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 pt-2">
            {NBA_TEAMS.filter(t => t.conference === selectedConf).map(team => {
              const bgGradient = `radial-gradient(circle at center, ${team.primaryColor}1a 0%, transparent 75%)`;
              return (
                <motion.div 
                  key={team.id}
                  whileHover={{ 
                    scale: 1.04, 
                    rotateY: 2, 
                    rotateX: -2,
                    borderColor: `${team.primaryColor}44`,
                    boxShadow: `0 10px 30px -5px ${team.primaryColor}1a`
                  }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => startNewFranchise(team.id)}
                  style={{ 
                    background: 'rgba(9,9,11,0.6)',
                  }}
                  className="relative group border border-white/5 rounded-[2.25rem] p-6 flex flex-col items-center gap-5 cursor-pointer backdrop-blur-md overflow-hidden transition-all duration-300"
                >
                  {/* Pulsing Team Ambient Background Glow */}
                  <div 
                    className="absolute inset-0 opacity-40 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" 
                    style={{ background: bgGradient }}
                  />

                  {/* Dynamic Corner Accents */}
                  <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: team.primaryColor }} />
                  
                  <div className="relative z-10 p-3 bg-zinc-950/40 rounded-3xl border border-white/5 group-hover:border-white/10 group-hover:bg-zinc-950/60 transition-all duration-300">
                    <img 
                      src={getTeamLogo(team.id)} 
                      className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-110" 
                      alt={team.name}
                    />
                  </div>

                  <div className="text-center relative z-10 leading-tight">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{team.city}</p>
                    <h3 className="font-black italic uppercase truncate group-hover:text-amber-400 transition-colors text-xs md:text-sm mt-0.5">{team.name.split(' ').pop()}</h3>
                  </div>

                  {/* Minimalist Tier Indicator */}
                  <div className="absolute bottom-2 px-2.5 py-0.5 bg-zinc-950/80 rounded-full border border-white/5 text-[7px] font-black uppercase tracking-widest text-[#a1a1aa]">
                    Tier {team.tier?.toUpperCase() || ''}
                  </div>
                </motion.div>
              );
            })}
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
    <div className="flex bg-black h-full w-full overflow-hidden text-white font-sans selection:bg-amber-500/30 touch-pan-y">
      <div className="flex-1 flex flex-col md:flex-row h-full w-full overflow-hidden relative">
        {renderPhaseSpecificContent()}
        
        {/* MOBILE BOTTOM NAVIGATION - SMOOTH HORIZONTAL SCROLL PILLS */}
        <div className="md:hidden fixed bottom-4 inset-x-4 h-14 bg-zinc-950/80 backdrop-blur-2xl border border-white/5 rounded-2xl flex items-center overflow-x-auto no-scrollbar z-[4000] px-3.5 gap-2 shadow-[0_10px_35px_rgba(0,0,0,1)] pb-safe">
          {[
            { id: 'hub', label: 'Hub' },
            { id: 'lineup', label: 'Roster' },
            { id: 'market', label: 'Market' },
            { id: 'trades', label: 'Trade' },
            { id: 'office', label: 'Office' },
            { id: 'league', label: 'League' },
            { id: 'stats', label: 'Stats' },
            { id: 'settings', label: 'Settings' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex-none px-4 py-2 rounded-xl text-[9px] uppercase font-black tracking-widest transition-all duration-200 cursor-pointer
                ${activeTab === item.id 
                  ? 'bg-amber-500 text-black font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                  : 'bg-zinc-900/80 text-zinc-400 border border-white/5'}
              `}
            >
              {item.label}
            </button>
          ))}
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

      {/* CHAMPIONSHIP CINEMATIC CELEBRATION */}
      <AnimatePresence>
        {showChampCelebrate && (
          <ChampionshipCelebrationOverlay 
            state={state} 
            findCard={findCard} 
            onClose={() => {
              setShowChampCelebrate(false);
              // Clear championId so it can be re-triggered next year if they win again
              const newState = { ...state, championId: undefined, phase: 'offseason_start' as FranchisePhase };
              setState(newState);
              stateService.save(newState);
            }} 
          />
        )}
      </AnimatePresence>

      {/* PRE-SEASON TRAINING CAMP PROGRESS REPORT */}
      <AnimatePresence>
        {showPreseasonReport && preseasonPlayers.length > 0 && (
          <PreseasonProgressionReport 
            players={preseasonPlayers} 
            onClose={() => setShowPreseasonReport(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ================= CHAMPIONSHIP CINEMATIC CELEBRATION OVERLAY =================
interface ChampCelebrateProps {
  state: any;
  findCard: (id: string) => any;
  onClose: () => void;
}
const ChampionshipCelebrationOverlay: React.FC<ChampCelebrateProps> = ({ state, findCard, onClose }) => {
  const fmvpId = state?.awards?.[state.season]?.finalsMvp;
  const fmvpCard = fmvpId ? findCard(fmvpId) : null;
  
  useEffect(() => {
    // Continuous metallic gold confetti rain
    const interval = setInterval(() => {
      confetti({
        particleCount: 50,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#f59e0b', '#d97706', '#ffffff']
      });
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[8000] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center select-none"
    >
      <div className="max-w-3xl w-full space-y-8 relative">
        <motion.div 
          animate={{ y: [0, -15, 0], rotate: [0, 2, -2, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="relative w-44 h-44 md:w-56 md:h-56 mx-auto filter drop-shadow-[0_0_35px_rgba(245,158,11,0.5)] flex items-center justify-center"
        >
          <svg className="w-full h-full text-amber-500 fill-amber-500" viewBox="0 0 24 24">
            <path d="M19 2h-4v3c0 2.21-1.79 4-4 4s-4-1.79-4-4V2H3v3c0 3.72 2.56 6.85 6 7.74V22h6v-9.26c3.44-.89 6-4.02 6-7.74V2z" />
          </svg>
        </motion.div>

        <div className="space-y-2">
          <span className="text-[10px] font-black tracking-[0.35em] text-amber-500 uppercase animate-pulse">WORLD CHAMPIONS</span>
          <h2 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-none">THE RING SECURED!</h2>
          <p className="text-zinc-550 text-xs md:text-sm uppercase font-bold tracking-widest">
            {state?.teams?.[state?.userTeamId]?.name || "Your franchise"} reached absolute immortal glory.
          </p>
        </div>

        {fmvpCard && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="max-w-md mx-auto bg-zinc-900/60 border border-white/10 p-5 rounded-[2rem] flex items-center gap-6 relative overflow-hidden text-left shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl animate-pulse" />
            
            <div className="w-16 h-16 bg-black rounded-2xl overflow-hidden shrink-0 border border-white/15">
              <PlayerHeadshot nbaId={fmvpCard.nbaId} name={fmvpCard.name} />
            </div>

            <div className="leading-tight shrink-0 min-w-0 flex-1">
              <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest italic flex items-center gap-1 mb-1">
                <Sparkles size={10} /> Finals MVP Crowned
              </span>
              <h4 className="text-base font-black text-white italic truncate uppercase w-48 leading-none mb-1">{fmvpCard.name}</h4>
              <p className="text-[9px] font-mono text-zinc-500 font-bold uppercase tracking-wider">
                {fmvpCard.stats.ovr} OVR • {fmvpCard.position}
              </p>
              
              <div className="flex gap-4 mt-2.5">
                <div className="leading-none">
                  <span className="text-[7px] font-bold text-zinc-500 uppercase leading-none">PPG</span>
                  <p className="text-xs font-mono font-black text-white leading-none mt-0.5">28.4</p>
                </div>
                <div className="leading-none">
                  <span className="text-[7px] font-bold text-zinc-500 uppercase leading-none">RPG</span>
                  <p className="text-xs font-mono font-black text-white leading-none mt-0.5">7.6</p>
                </div>
                <div className="leading-none">
                  <span className="text-[7px] font-bold text-zinc-500 uppercase leading-none">APG</span>
                  <p className="text-xs font-mono font-black text-white leading-none mt-0.5">8.1</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <button 
          onClick={onClose}
          className="px-10 py-5 bg-white text-black hover:bg-amber-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-102 active:scale-98 transition-all duration-150"
        >
          Proceed to Front Office Offseason
        </button>
      </div>
    </motion.div>
  );
};

// ================= PRE-SEASON TRAINING CAMP PROGRESS REPORT =================
interface PreseasonReportProps {
  players: any[];
  onClose: () => void;
}
const PreseasonProgressionReport: React.FC<PreseasonReportProps> = ({ players, onClose }) => {
  const breakOutPlayer = useMemo(() => {
    if (players.length === 0) return null;
    return [...players].sort((a, b) => b.diff - a.diff)[0];
  }, [players]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[8000] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center select-none"
    >
      <div className="max-w-3xl w-full space-y-8 relative max-h-[90vh] overflow-y-auto pr-1 no-scrollbar">
        
        <div className="space-y-2 text-center">
          <span className="text-[8.5px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full animate-pulse">
            PRE-SEASON TRAINING CAMP REPORT
          </span>
          <h2 className="text-3xl md:text-5.5.xl font-black italic uppercase tracking-tighter text-white leading-none">ROSTER TRAINING PROGRESSION</h2>
          <p className="text-zinc-550 text-[10px] font-bold uppercase tracking-widest">
            Ages and camp skills compiled for Season Roster
          </p>
        </div>

        {breakOutPlayer && breakOutPlayer.diff > 0 && (
          <div className="bg-gradient-to-br from-indigo-500/15 via-zinc-900/60 to-black border border-indigo-500/25 rounded-[2.5rem] p-6 max-w-lg mx-auto flex items-center gap-6 relative overflow-hidden text-left shadow-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl animate-pulse" />
            
            <div className="relative shrink-0">
               <div className="w-16 h-16 bg-zinc-950 rounded-2xl p-1 overflow-hidden border border-white/10 flex items-center justify-center">
                 {breakOutPlayer.imageUrl ? (
                   <img src={breakOutPlayer.imageUrl} className="w-full h-full object-contain" />
                 ) : (
                   <PlayerHeadshot nbaId={breakOutPlayer.nbaId} name={breakOutPlayer.name} />
                 )}
               </div>
               <div className="absolute -bottom-1 -right-1 bg-indigo-500 text-black text-[7.5px] font-black px-1.5 py-0.5 rounded leading-none">BREAKOUT</div>
            </div>

            <div className="leading-tight shrink-0 min-w-0 flex-1">
              <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">★ OFFSEASON BREAKOUT CANDIDATE ★</span>
              <h4 className="text-lg md:text-xl font-black text-white italic uppercase truncate w-52 leading-none mt-1.5 mb-1">{breakOutPlayer.name}</h4>
              <p className="text-[9px] font-medium text-zinc-505 uppercase tracking-wider">
                OVR jump: <strong className="text-white">{breakOutPlayer.previousOvr}</strong> → <strong className="text-emerald-400">{breakOutPlayer.currentOvr}</strong>
                <span className="text-emerald-400 font-mono font-black ml-2">▲ +{breakOutPlayer.diff}</span>
              </p>
            </div>
          </div>
        )}

        <div className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] space-y-4 text-left max-w-xl mx-auto">
          <h3 className="text-[8.5px] font-extrabold text-zinc-500 uppercase tracking-[0.2em] leading-none text-center">ACTIVE TEAM CAMP PROGRESS</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
            {players.map((p, idx) => (
              <div key={`${p.id}-${idx}`} className="bg-zinc-950/60 p-3.5 rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="leading-none shrink-0 min-w-0">
                  <h5 className="font-black text-white text-xs uppercase italic truncate max-w-[125px]">{p.name}</h5>
                  <p className="text-[7.5px] font-black text-zinc-550 uppercase mt-1">{p.position}</p>
                </div>
                
                <div className="flex items-center gap-2.5 font-mono">
                  <span className="text-[10px] text-zinc-500 font-bold">{p.previousOvr}</span>
                  <span className="text-[8px] text-zinc-700">➔</span>
                  <span className={`text-[10.5px] font-black ${p.diff > 0 ? 'text-emerald-400' : p.diff < 0 ? 'text-red-500' : 'text-zinc-400'}`}>
                    {p.currentOvr}
                  </span>
                  {p.diff !== 0 && (
                     <span className={`text-[8.5px] font-black ${p.diff > 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                       {p.diff > 0 ? `▲+${p.diff}` : `▼${p.diff}`}
                     </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full max-w-xs py-5 bg-white text-black hover:bg-amber-500 rounded-3xl font-black uppercase tracking-widest text-[9.5px] hover:scale-102 active:scale-98 transition-all duration-150"
        >
          Secure Training & Start Regular Season
        </button>
      </div>
    </motion.div>
  );
};

const SidebarItem: React.FC<{ id: string, icon: any, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-all duration-200 select-none ${
        active 
          ? 'bg-white text-black font-extrabold shadow-sm' 
          : 'text-zinc-500 hover:text-white hover:bg-white/5'
      }`}
    >
      <span className={`shrink-0 transition-transform duration-200 ${active ? 'scale-105' : ''}`}>
        {icon}
      </span>
      <span className="hidden lg:block text-[9.5px] font-black uppercase tracking-wider truncate">
        {label}
      </span>
    </button>
  );
};

const MobileTab: React.FC<{ id: string, icon: any, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 w-12 h-full transition-all duration-200 relative ${active ? 'text-amber-500 font-extrabold' : 'text-zinc-500'}`}
  >
    {active && (
      <motion.span 
        layoutId="activeTabBadge" 
        className="absolute -top-[5px] w-6 h-[2px] bg-amber-500 rounded-full" 
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
      />
    )}
    <span className={`transition-transform duration-250 ${active ? 'scale-110' : 'scale-100'}`}>
      {icon}
    </span>
    <span className="text-[7.5px] font-black uppercase tracking-wider">{label}</span>
  </button>
);

const DrawerItem: React.FC<{ icon: any, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-2 p-4 rounded-3xl transition-all ${active ? 'bg-amber-500 text-black' : 'bg-white/5 text-zinc-400'}`}>
       {icon}
       <span className="text-[9px] font-black uppercase">{label}</span>
    </button>
);

export default CareerView;
