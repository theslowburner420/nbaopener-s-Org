// Tactical re-parse trigger
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building, 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Trophy, 
  ChevronRight, 
  ArrowRight, 
  Activity,
  Plus,
  Play,
  Settings as SettingsIcon,
  Search,
  DollarSign,
  TrendingUp,
  History,
  ShoppingCart,
  X,
  Sparkles,
  AlertTriangle,
  Lock,
  Star
} from 'lucide-react';
import { NBA_TEAMS, getTeamLogo } from '../data/nbaTeams';
import { ALL_CARDS } from '../data/cards';
import { useFranchise } from '../franchise/hooks/useFranchise';
import { stateService } from '../franchise/services/stateService';
import { gameService } from '../franchise/services/gameService';
import { FranchisePhase, TeamObject, FranchiseMatch, PlayoffSeries, PlayerStats } from '../franchise/types';
import { marketService } from '../franchise/services/marketService';
import { tradeEngine } from '../franchise/services/tradeEngine';
import { playoffService } from '../franchise/services/playoffService';
import { generateDraftPool, advanceSeason } from '../franchise/services/rosterService';
import CardItem from '../components/CardItem';

import confetti from 'canvas-confetti';

import { useNotification } from '../context/NotificationContext';

type FranchiseTab = 'hub' | 'lineup' | 'market' | 'league' | 'stats' | 'trades' | 'settings' | 'draft' | 'office';

const CareerView: React.FC = () => {
  const { state, isLoading, startNewFranchise, advanceWeek, resetFranchise, setState } = useFranchise();
  const { notifyError, notifySuccess } = useNotification();

  const userTeam = useMemo(() => {
    if (!state || !state.userTeamId) return null;
    return state.teams[state.userTeamId];
  }, [state]);

  const [activeTab, setActiveTab] = useState<FranchiseTab>('hub');
  const [activeNegotiation, setActiveNegotiation] = useState<{
    playerId: string;
    salary: number;
    years: number;
    message: string;
    status: 'Active' | 'Accepted' | 'Rejected';
    counterOffer?: { salary: number; years: number };
  } | null>(null);

  // OPTIMIZATION: Memoized Card Lookup Map
  const allCardsLookupMap = useMemo(() => {
    const internalMap = new Map<string, any>();
    ALL_CARDS.forEach(c => internalMap.set(c.id, c));
    state?.customCards?.forEach((c: any) => internalMap.set(c.id, c));
    state?.draftPool?.forEach((c: any) => internalMap.set(c.id, c));
    return internalMap;
  }, [state?.customCards, state?.draftPool]);

  // OPTIMIZATION: Memoized findCard
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

    // Optionally include seasonal stats if they exist to be used in CardItem
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

  // OPTIMIZATION: Memoized Player-to-Team Mapping
  const playerTeamMap = useMemo(() => {
    const map = new Map<string, TeamObject>();
    if (!state?.teams) return map;
    Object.values(state.teams).forEach((team: any) => {
      if (team && team.roster) {
        team.roster.forEach((pid: string) => map.set(pid, team));
      }
    });
    return map;
  }, [state?.teams]);

  const [activeStatsCat, setActiveStatsCat] = useState<'Points' | 'Rebounds' | 'Assists'>('Points');
  const [statsSubTab, setStatsSubTab] = useState<'League' | 'Highs' | 'Team'>('League');
  const [teamStatsTab, setTeamStatsTab] = useState<'Current' | 'History'>('Current');
  const [showAwards, setShowAwards] = useState(false);
  const [awardRevealStep, setAwardRevealStep] = useState(0);
  const [activePlayoffConf, setActivePlayoffConf] = useState<'East' | 'West'>('East');
  const [showChampCelebrate, setShowChampCelebrate] = useState(false);
  const [viewingProspectId, setViewingProspectId] = useState<string | null>(null);

  React.useEffect(() => {
    if (state?.userTeamId && state.teams[state.userTeamId]) {
      setActivePlayoffConf(state.teams[state.userTeamId].conference);
    }
  }, [state?.userTeamId]);

  // OPTIMIZATION: Memoized Awards Calculation
  const seasonAwards = useMemo(() => {
    if (!state) return null;
    const players = ALL_CARDS.concat(state.customCards || []);
    const seasonalStats = state.stats?.seasonal || {};
    
    const candidates = (Object.entries(seasonalStats) as [string, PlayerStats][]).map(([id, s]) => {
      const card = findCard(id);
      if (!card || s.gamesPlayed < 20) return null;
      
      const teamId = (Object.values(state.teams) as TeamObject[]).find((t: TeamObject) => t.roster.includes(id))?.teamId;
      const team = teamId ? state.teams[teamId] : null;
      
      const avgPts = s.points / s.gamesPlayed;
      const avgReb = s.rebounds / s.gamesPlayed;
      const avgAst = s.assists / s.gamesPlayed;
      const avgStl = (s.steals || 0) / s.gamesPlayed;
      const avgBlk = (s.blocks || 0) / s.gamesPlayed;

      // combinations of stats and team success
      const mvpScore = (team && team.wins > team.losses) ? (avgPts + avgReb * 0.7 + avgAst * 0.9) : (avgPts * 0.8 + avgReb * 0.5 + avgAst * 0.6);
      const dpoyScore = avgReb + avgStl * 2 + avgBlk * 2.5;
      const royScore = id.includes(`draft_${state.season}`) ? (avgPts + avgReb + avgAst) : 0;
      const mipScore = state.playerProgress[id]?.ovr ? (state.playerProgress[id].ovr! - card.stats.ovr) : 0;

      return { 
        id, 
        card,
        team,
        avgPts, avgReb, avgAst, avgStl, avgBlk,
        mvpScore,
        dpoyScore,
        royScore,
        mipScore
      };
    }).filter(Boolean) as any[];

    if (candidates.length === 0) return null;

    const sortBy = (key: string) => [...candidates].sort((a, b) => b[key] - a[key]);

    const mvpCandidates = sortBy('mvpScore').slice(0, 3);
    const dpoyCandidates = sortBy('dpoyScore').slice(0, 3);
    const royCandidates = sortBy('royScore').slice(0, 3);
    const mipCandidates = sortBy('mipScore').slice(0, 3);

    const pickedAllNbaIds = new Set<string>();
    const getBestForPos = (pos: string) => {
      const posCandidates = candidates.filter(c => !pickedAllNbaIds.has(c.id) && c.card.position === pos);
      posCandidates.sort((a, b) => b.mvpScore - a.mvpScore);
      const winner = posCandidates[0];
      if (winner) {
        pickedAllNbaIds.add(winner.id);
        return winner.id;
      }
      const fallbackCandidates = candidates.filter(c => !pickedAllNbaIds.has(c.id) && c.card.position.includes(pos));
      fallbackCandidates.sort((a, b) => b.mvpScore - a.mvpScore);
      const fallback = fallbackCandidates[0];
      if (fallback) {
        pickedAllNbaIds.add(fallback.id);
        return fallback.id;
      }
      return null;
    };

    const finals = state.playoffSeries.find(s => s.round === 4);
    let finalsMvp = null;
    if (finals && finals.winnerId && finals.matches.length > 0) {
      const champRoster = state.teams[finals.winnerId].roster;
      const finalBoxScores = finals.matches.flatMap(m => 
         m.winner === finals.winnerId ? (m.boxScore?.home || []) : (m.boxScore?.away || [])
      ).filter(be => champRoster.includes(be.playerId));
      
      const performance: Record<string, number> = {};
      finalBoxScores.forEach(be => {
        performance[be.playerId] = (performance[be.playerId] || 0) + (be.points + be.rebounds + be.assists + be.steals + be.blocks);
      });
      
      const fmvpId = Object.keys(performance).sort((a,b) => performance[b] - performance[a])[0];
      if (fmvpId) {
        finalsMvp = findCard(fmvpId);
      }
    }

    return {
      mvp: mvpCandidates[0],
      dpoy: dpoyCandidates[0],
      roy: royCandidates[0],
      mip: mipCandidates[0],
      finalsMvp,
      allNba: [
        getBestForPos('PG'), 
        getBestForPos('SG'), 
        getBestForPos('SF'), 
        getBestForPos('PF'), 
        getBestForPos('C')
      ].filter(Boolean),
      finalists: {
        mvp: mvpCandidates,
        dpoy: dpoyCandidates,
        roy: royCandidates,
        mip: mipCandidates
      }
    };
  }, [state?.stats?.seasonal, state?.teams, findCard, state?.season, state?.playerProgress, state?.playoffSeries]);

  const [selectedConf, setSelectedConf] = useState<'East' | 'West'>('East');
  const [lineupModalPos, setLineupModalPos] = useState<string | null>(null);
  const [tradeTargetTeamId, setTradeTargetTeamId] = useState<string | null>(null);
  const [userOfferedIds, setUserOfferedIds] = useState<string[]>([]);
  const [cpuRequestedIds, setCpuRequestedIds] = useState<string[]>([]);
  const [userOfferedPickIds, setUserOfferedPickIds] = useState<string[]>([]);
  const [cpuRequestedPickIds, setCpuRequestedPickIds] = useState<string[]>([]);
  const [lastGameResult, setLastGameResult] = useState<{ result: any; match: FranchiseMatch } | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [draftState, setDraftState] = useState({
    pick: 1,
    round: 1,
    history: [] as { teamId: string, player: any, pick: number }[],
    isPaused: true,
    timer: 30,
    order: [] as string[]
  });

  const handleUserDraftChoice = React.useCallback((card: any) => {
    if (!state) return;
    const res = marketService.draftPlayer(state, card);
    if (!res.success) {
      notifyError(res.reason);
      return;
    }
    
    setDraftState(prev => ({
      ...prev,
      history: [...prev.history, { teamId: state.userTeamId, player: card, pick: prev.pick }],
      pick: prev.pick + 1,
      timer: 30,
      isPaused: false // RESUME DRAFT
    }));
    setState({...state});
  }, [state, setState]);

  React.useEffect(() => {
    if (activeTab === 'draft' && !draftState.isPaused && draftState.pick <= 60 && state) {
      const currentTeamId = draftState.order[(draftState.pick - 1) % 30];
      const isUser = currentTeamId === state.userTeamId;

      if (!isUser) {
        const timer = setTimeout(() => {
          // CPU Picks: best available
          const available = state.draftPool?.filter(p => !draftState.history.some(h => h.player.id === p.id));
          if (available && available.length > 0) {
            // Sort by OVR to take the best
            const sorted = [...available].sort((a,b) => b.stats.ovr - a.stats.ovr);
            const chosen = sorted[0];
            marketService.draftPlayer(state, chosen, currentTeamId);
            
            setDraftState(prev => ({
              ...prev,
              history: [...prev.history, { teamId: currentTeamId, player: chosen, pick: prev.pick }],
              pick: prev.pick + 1,
              timer: 30
            }));
            setState({...state});
          }
        }, 1500);
        return () => clearTimeout(timer);
      } else {
        // User timer
        if (draftState.timer > 0) {
           const t = setTimeout(() => setDraftState(prev => ({ ...prev, timer: prev.timer - 1 })), 1000);
           return () => clearTimeout(t);
        } else {
           // Auto pick for user
           const available = state.draftPool?.filter(p => !draftState.history.some(h => h.player.id === p.id));
           if (available && available.length > 0) {
             const sorted = [...available].sort((a,b) => b.stats.ovr - a.stats.ovr);
             handleUserDraftChoice(sorted[0]);
           }
        }
      }
    }
  }, [activeTab, draftState.isPaused, draftState.pick, draftState.timer, draftState.order, state, draftState.history, handleUserDraftChoice]);

  React.useEffect(() => {
    if (state?.phase === 'Draft' && state.teams) {
      if (!state.draftPool || state.draftPool.length < 60) {
        state.draftPool = generateDraftPool(state.season);
        setState({...state});
      }
      
      if (draftState.order.length === 0) {
        const order = (Object.values(state.teams) as TeamObject[])
          .sort((a,b) => a.wins - b.wins)
          .map(t => t.teamId);
        setDraftState(prev => ({ ...prev, order }));
      }
    }
  }, [state?.phase, activeTab, draftState.order.length, state?.teams]);
  
  const handleNegotiationStart = React.useCallback((playerId: string) => {
    if (!state || !userTeam) return;
    const demand = marketService.calculateMarketDemand(state, playerId);
    
    // Check if team already has 15 players if it's a new signing
    if (!userTeam.roster.includes(playerId) && userTeam.roster.length >= 15) {
      notifyError("Roster is full (15 players max)");
      return;
    }

    setActiveNegotiation({
      playerId,
      salary: demand.salary,
      years: demand.years,
      message: "I'm open to discussing a deal. What are you offering?",
      status: 'Active'
    });
  }, [state, state?.userTeamId, userTeam]);

  const handleProposeOffer = React.useCallback((salary: number, years: number) => {
    if (!state || !activeNegotiation) return;
    
    if (!state.negotiations) state.negotiations = {};
    const result = marketService.negotiateContract(state, activeNegotiation.playerId, salary, years);
    
    setActiveNegotiation(prev => prev ? ({
      ...prev,
      salary,
      years,
      message: result.message,
      status: result.status,
      counterOffer: result.counterOffer
    }) : null);

    if (result.status === 'Accepted' || result.status === 'Rejected') {
      // Small delay then close modal? Or let user see status.
      // We'll let user click 'Done'
    }
    
    setState({ ...state });
  }, [state, activeNegotiation, setState]);

  const handleSignPlayer = React.useCallback((cardId: string) => {
    handleNegotiationStart(cardId);
  }, [handleNegotiationStart]);

  const handleExecuteTrade = React.useCallback(() => {
    if (!state || !tradeTargetTeamId) return;
    const offer = {
      fromTeamId: state.userTeamId,
      toTeamId: tradeTargetTeamId,
      offeredPlayerIds: userOfferedIds,
      requestedPlayerIds: cpuRequestedIds,
      offeredPickIds: userOfferedPickIds,
      requestedPickIds: cpuRequestedPickIds
    };
    
    const result = tradeEngine.evaluateUserTrade(state, offer);
    if (result.accepted) {
      tradeEngine.executeTrade(state, offer);
      notifySuccess("Trade Accepted!");
      setUserOfferedIds([]);
      setCpuRequestedIds([]);
      setUserOfferedPickIds([]);
      setCpuRequestedPickIds([]);
      setTradeTargetTeamId(null);
      setState({ ...state });
    } else {
      notifyError(result.reason);
    }
  }, [state, setState, tradeTargetTeamId, userOfferedIds, cpuRequestedIds, userOfferedPickIds, cpuRequestedPickIds]);

  const handleUpdateLineup = React.useCallback((playerId: string) => {
    if (!state || !lineupModalPos || !userTeam) return;
    
    // If player is already in another position, swap them or clear them
    const positions = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
    positions.forEach(pos => {
      if (userTeam.lineup[pos] === playerId) {
        userTeam.lineup[pos] = null;
      }
    });

    // Check if player was in bench
    userTeam.lineup.bench = userTeam.lineup.bench.filter(id => id !== playerId);

    if (lineupModalPos === 'bench') {
       userTeam.lineup.bench.push(playerId);
    } else {
       const prevStarter = userTeam.lineup[lineupModalPos as keyof typeof userTeam.lineup] as string;
       if (prevStarter) userTeam.lineup.bench.push(prevStarter);
       userTeam.lineup[lineupModalPos as keyof typeof userTeam.lineup] = playerId;
    }

    setLineupModalPos(null);
    setState({ ...state });
  }, [state, lineupModalPos, setState]);

  const simulateGame = React.useCallback(() => {
    if (!state) return;
    const res = gameService.simulateNextUserGame(state);
    if (res) {
      setLastGameResult(res);
      setState({ ...state });
    }
  }, [state, setState]);

  // OPTIMIZATION: Memoized League Leaders
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

  if (isLoading) {
    return (
      <div className="flex-1 bg-black flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
          <Activity className="text-white opacity-20" size={40} />
        </motion.div>
      </div>
    );
  }

  // TEAM SELECTION SCREEN
  if (!state || !state.userTeamId) {
    return (
      <div className="flex-1 bg-black text-white p-6 md:p-12 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8 md:space-y-12">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter">Franchise</h1>
            <p className="text-zinc-500 max-w-2xl font-medium text-sm md:text-base">Select your team to begin. Build a dynasty starting from the 2025 Season.</p>
          </div>

          <div className="flex gap-2 md:gap-4 border-b border-white/5 pb-4 overflow-x-auto no-scrollbar">
            {['East', 'West'].map((conf) => (
              <button 
                key={conf}
                onClick={() => setSelectedConf(conf as any)}
                className={`px-6 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedConf === conf ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'}`}
              >
                {conf}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6">
            {NBA_TEAMS.filter(t => t.conference === selectedConf).map((team) => (
              <motion.div 
                key={team.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => startNewFranchise(team.id)}
                className="group cursor-pointer bg-zinc-900 border border-white/5 rounded-2xl md:rounded-[2rem] p-3 md:p-8 flex flex-col items-center justify-center gap-2 md:gap-4 hover:bg-zinc-800 transition-all aspect-square sm:aspect-auto"
              >
                <div className="w-10 h-10 md:w-20 md:h-20 transition-transform group-hover:rotate-6 duration-500">
                  <img src={getTeamLogo(team.id)} alt={team.name} className="w-full h-full object-contain" />
                </div>
                <div className="text-center">
                  <p className="text-[9px] md:text-sm font-black text-white italic uppercase truncate w-full">{team.id}</p>
                  <p className="hidden md:block text-[8px] font-black text-zinc-600 uppercase tracking-widest">{team.name}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }


  if (!state || (state.userTeamId && !state.teams[state.userTeamId])) {
    if (state && state.userTeamId && !state.teams[state.userTeamId]) {
      return (
        <div className="flex-1 bg-black flex items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <AlertTriangle className="text-amber-500 mx-auto" size={64} />
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase italic text-white">Data Error</h2>
              <p className="text-zinc-500 text-sm max-w-xs font-medium">Your save file is incompatible.</p>
            </div>
            <button onClick={resetFranchise} className="px-8 py-3 bg-white text-black rounded-xl font-black uppercase tracking-widest text-[10px]">Reset</button>
          </div>
        </div>
      );
    }
    return null;
  }

  const PlayoffSeriesCard: React.FC<{ series: PlayoffSeries; teams: Record<string, TeamObject> }> = ({ series, teams }) => {
    const t1 = teams[series.team1Id];
    const t2 = teams[series.team2Id];
    if (!t1 || !t2) return null;

    const isUserInvolved = t1.isHuman || t2.isHuman;
    const isPlayed = series.winnerId !== undefined;

    const renderTeam = (team: TeamObject, wins: number, seed?: number, isWinner?: boolean, isLoser?: boolean) => (
      <div className={`flex items-center justify-between p-2 rounded-lg transition-colors ${isWinner ? 'bg-zinc-800' : ''}`}>
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 bg-black rounded-lg p-1.5 border border-white/5 shrink-0">
             <img src={getTeamLogo(team.teamId)} className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col truncate">
             <span className={`text-[10px] md:text-xs font-black uppercase italic truncate ${isLoser ? 'text-zinc-500' : 'text-white'}`}>
                <span className="text-zinc-600 mr-1 not-italic font-bold">{seed}</span>
                {team.abbreviation}
             </span>
          </div>
        </div>
        <span className={`text-sm md:text-base font-black italic tabular-nums ${isWinner ? 'text-white' : 'text-zinc-500'}`}>{wins}</span>
      </div>
    );

    return (
      <div className={`relative bg-zinc-900 border-l-2 ${isUserInvolved ? 'border-l-emerald-500' : 'border-l-transparent'} border border-zinc-800 rounded-xl overflow-hidden transition-all hover:bg-zinc-800/50`}>
        <div className="p-1 space-y-1">
          {renderTeam(t1, series.wins1, series.seed1, series.winnerId === t1.teamId, series.winnerId && series.winnerId !== t1.teamId)}
          {renderTeam(t2, series.wins2, series.seed2, series.winnerId === t2.teamId, series.winnerId && series.winnerId !== t2.teamId)}
        </div>
      </div>
    );
  };

  const renderPlayoffs = () => {
    if (!state) return null;
    
    const eastSeries = (round: number) => (state.playoffSeries || []).filter(s => s.round === round && s.conference === 'East');
    const westSeries = (round: number) => (state.playoffSeries || []).filter(s => s.round === round && s.conference === 'West');
    const finalsSeries = (state.playoffSeries || []).filter(s => s.round === 4);

    const handleSimulateRound = () => {
       playoffService.simulateNextRoundOnly(state);
       if (state.championId) {
          setShowChampCelebrate(true);
          confetti({
             particleCount: 150,
             spread: 70,
             origin: { y: 0.6 }
          });
       }
       setState({...state});
    };

    const currentRound = Math.min(...(state.playoffSeries || []).filter(s => !s.winnerId).map(s => s.round));
    const isUserInCurrentRound = (state.playoffSeries || []).some(s => 
       s.round === currentRound && !s.winnerId && (s.team1Id === state.userTeamId || s.team2Id === state.userTeamId)
    );

    const renderConferenceColumn = (conf: 'East' | 'West') => {
        const isEast = conf === 'East';
        const getSeries = (round: number) => (state.playoffSeries || []).filter(s => s.round === round && s.conference === conf);
        const confColor = isEast ? 'bg-[#3b82f6]' : 'bg-[#ef4444]';
        const confText = isEast ? 'text-[#3b82f6]' : 'text-[#ef4444]';
        
        return (
           <div className={`flex flex-col gap-6 md:gap-8 ${isEast ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
              {/* R1 */}
              <div className="flex flex-col gap-4 w-full md:w-36 lg:w-48">
                 <div className={`${confColor} text-white text-[9px] font-black uppercase tracking-[0.2em] text-center py-3 rounded-t-2xl shadow-lg italic`}>{conf}ern First Round</div>
                 <div className="space-y-4">
                    {getSeries(1).map(s => <PlayoffSeriesCard key={s.id} series={s} teams={state.teams} />)}
                 </div>
              </div>
              {/* Semis */}
              <div className="flex flex-col gap-4 w-full md:w-36 lg:w-48 justify-center">
                 <div className={`hidden md:block ${confText} text-[8px] font-black uppercase tracking-widest text-center py-2 italic opacity-60`}>Semifinals</div>
                 <div className="space-y-4">
                    {getSeries(2).length > 0 ? getSeries(2).map(s => <PlayoffSeriesCard key={s.id} series={s} teams={state.teams} />) : (
                       <>
                          <div className="h-20 border border-dashed border-white/5 rounded-2xl flex items-center justify-center text-[10px] text-zinc-800">TBD</div>
                          <div className="h-20 border border-dashed border-white/5 rounded-2xl flex items-center justify-center text-[10px] text-zinc-800">TBD</div>
                       </>
                    )}
                 </div>
              </div>
              {/* Conf Finals */}
              <div className="flex flex-col gap-4 w-full md:w-36 lg:w-48 justify-center">
                 <div className={`hidden md:block ${confText} text-[8px] font-black uppercase tracking-widest text-center py-2 italic opacity-60`}>Conference Finals</div>
                 {getSeries(3).length > 0 ? getSeries(3).map(s => <PlayoffSeriesCard key={s.id} series={s} teams={state.teams} />) : <div className="h-24 border border-dashed border-white/5 rounded-2xl flex items-center justify-center text-[10px] text-zinc-800 italic uppercase font-black">Waiting...</div>}
              </div>
           </div>
        );
    };

    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="max-w-screen-2xl mx-auto space-y-8 md:space-y-12 p-4 md:p-6"
      >
        {/* Playoff Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-zinc-900/50 p-8 rounded-[2.5rem] border border-white/5">
          <div className="text-center md:text-left space-y-2">
            <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white">Road to Glory</h2>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-[0.3em]">Season {state.season} NBA Playoffs</p>
          </div>
          <div className="flex items-center gap-4">
             {state.championId ? (
                <button 
                  onClick={advanceWeek}
                  className="px-10 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-2xl"
                >
                  Advance to Offseason
                </button>
             ) : (
                <>
                  {!isUserInCurrentRound ? (
                    <button 
                      onClick={handleSimulateRound}
                      className="px-10 py-5 bg-zinc-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-zinc-700 transition-all border border-white/10"
                    >
                      Simulate Round
                    </button>
                  ) : (
                    <button 
                      onClick={simulateGame}
                      className="px-10 py-5 bg-amber-500 text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:scale-105 transition-all"
                    >
                      Play Your Series
                    </button>
                  )}
                </>
             )}
          </div>
        </div>

        {/* MOBILE VIEW (Tabs) */}
        <div className="md:hidden space-y-6">
           <div className="flex gap-2 p-1 bg-zinc-950 rounded-2xl border border-white/5">
              {(['East', 'West'] as const).map(conf => (
                 <button
                    key={conf}
                    onClick={() => setActivePlayoffConf(conf)}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activePlayoffConf === conf ? (conf === 'East' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white') : 'text-zinc-600'}`}
                 >
                    {conf}
                 </button>
              ))}
           </div>
           
           <div className="space-y-8">
              {renderConferenceColumn(activePlayoffConf)}
              
              <div className="pt-8 border-t border-white/5 space-y-4">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 text-center">NBA Finals</h3>
                 {finalsSeries.length > 0 ? (
                    <PlayoffSeriesCard series={finalsSeries[0]} teams={state.teams} />
                 ) : (
                    <div className="h-24 border border-dashed border-amber-500/10 rounded-xl flex items-center justify-center text-[8px] font-black text-zinc-900 uppercase tracking-widest">Waiting for Finals</div>
                 )}
              </div>
           </div>
        </div>

        {/* DESKTOP VIEW (Complete Bracket) */}
        <div className="hidden md:flex gap-4 lg:gap-8 items-center justify-between">
           {/* East Bracket */}
           <div className="flex-1">
              {renderConferenceColumn('East')}
           </div>

           {/* Finals Center */}
           <div className="w-48 lg:w-64 space-y-8 flex flex-col items-center">
              <div className="bg-zinc-900 border border-amber-500/20 rounded-[2rem] p-6 text-center w-full shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-500/10 blur-[50px] rounded-full" />
                 <div className="relative z-10 space-y-4">
                    <Trophy className="mx-auto text-amber-500" size={32} />
                    <h3 className="text-xl font-black italic uppercase italic tracking-tighter text-white">NBA Finals</h3>
                    {finalsSeries.length > 0 ? (
                      <PlayoffSeriesCard series={finalsSeries[0]} teams={state.teams} />
                    ) : (
                      <div className="p-4 border border-dashed border-zinc-800 rounded-xl text-[8px] font-black text-zinc-700 uppercase">TBD</div>
                    )}
                 </div>
              </div>

              {state.championId && (
                 <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="flex flex-col items-center gap-3"
                 >
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-2xl"><Trophy className="text-black" size={30} /></div>
                    <div className="text-center">
                       <p className="text-[8px] font-black text-zinc-600 uppercase">Champion</p>
                       <p className="text-xl lg:text-2xl font-black text-white italic uppercase">{state.teams[state.championId]?.name}</p>
                    </div>
                 </motion.div>
              )}
           </div>

           {/* West Bracket */}
           <div className="flex-1">
              {renderConferenceColumn('West')}
           </div>
        </div>

        {showChampCelebrate && (
           <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }}
             className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-3xl"
           >
              <div className="text-center space-y-10 p-12">
                 <div className="w-48 h-48 bg-amber-400 rounded-[3rem] flex items-center justify-center text-black mx-auto shadow-2xl relative overflow-hidden">
                    <Trophy size={100} className="relative z-10" />
                    <motion.div 
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 bg-white"
                    />
                 </div>
                 <div className="space-y-4">
                    <h2 className="text-8xl font-black italic uppercase tracking-tighter text-white animate-bounce">CHAMPIONS</h2>
                    <p className="text-4xl font-black text-amber-500 italic uppercase">The {state.teams[state.championId!]?.name}</p>
                 </div>
                 <button onClick={() => setShowChampCelebrate(false)} className="px-12 py-5 bg-white text-black rounded-full font-black uppercase text-sm">Continue</button>
              </div>
           </motion.div>
        )}
      </motion.div>
    );
  };

  const nextUserGame = state.schedule.find(m => 
    !m.played && (m.homeTeamId === state.userTeamId || m.awayTeamId === state.userTeamId)
  );

  if (!userTeam) {
    return (
       <div className="flex-1 bg-black flex flex-col items-center justify-center p-12 text-center">
          <div className="space-y-6">
            <AlertTriangle className="text-amber-500 mx-auto" size={64} />
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase italic text-white">Identity Error</h2>
              <p className="text-zinc-500 text-sm max-w-xs font-medium">Your team profile could not be localized. Please try resetting your franchise.</p>
            </div>
            <button onClick={resetFranchise} className="px-8 py-3 bg-white text-black rounded-xl font-black uppercase tracking-widest text-[10px]">Back to Selection</button>
          </div>
       </div>
    );
  }

  const pendingUserGamesThisCycle = state.schedule.filter(m => 
    !m.played && (m.homeTeamId === state.userTeamId || m.awayTeamId === state.userTeamId) && m.gameNumber < state.week + 4
  );

  return (
    <div className="bg-black flex flex-col landscape:flex-row relative w-full min-h-screen">
      {/* NEGOTIATION MODAL */}
      <AnimatePresence>
        {activeNegotiation && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-4"
          >
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 30 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               className="w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
             >
                {(() => {
                   const card = findCard(activeNegotiation.playerId);
                   const neg = state.negotiations?.[activeNegotiation.playerId];
                   const rounds = neg?.rounds || 0;
                   if (!card) return null;

                   return (
                      <div className="flex flex-col h-full max-h-[90vh]">
                         {/* Header */}
                         <div className="p-6 md:p-8 bg-black/40 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 md:w-20 md:h-20 bg-zinc-800 rounded-2xl p-2 border border-white/5 relative group">
                                  <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card.nbaId}.png`} className="w-full h-full object-contain" />
                                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-white text-black text-[10px] font-black rounded-full flex items-center justify-center border-2 border-zinc-900">{card.stats.ovr}</div>
                               </div>
                               <div>
                                  <h3 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter text-white leading-none">{card.name}</h3>
                                  <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mt-1">{card.position} • {state.playerProgress[card.id]?.age || 25} Years Old</p>
                               </div>
                            </div>
                            <button onClick={() => setActiveNegotiation(null)} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
                               <X size={20} />
                            </button>
                         </div>

                         {/* Chat / Message Area */}
                         <div className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto no-scrollbar">
                            <div className="space-y-4">
                               <div className="flex justify-start">
                                  <div className="max-w-[80%] bg-zinc-800 p-4 rounded-2xl rounded-tl-none border border-white/5">
                                     <p className="text-xs md:text-sm font-medium text-zinc-300 leading-relaxed italic">"{activeNegotiation.message}"</p>
                                  </div>
                               </div>
                               
                               {activeNegotiation.counterOffer && activeNegotiation.status === 'Active' && (
                                  <div className="flex justify-start">
                                     <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex flex-col gap-2">
                                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Counter Offer</p>
                                        <p className="text-sm font-black text-white italic">${(activeNegotiation.counterOffer.salary/1000000).toFixed(1)}M / {activeNegotiation.counterOffer.years} Years</p>
                                     </div>
                                  </div>
                               )}
                            </div>

                            {activeNegotiation.status === 'Active' && (
                               <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                     {/* Salary Slider */}
                                     <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                           <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Proposed Salary</label>
                                           <span className="text-xl font-black italic text-white">${(activeNegotiation.salary/1000000).toFixed(1)}M</span>
                                        </div>
                                        <input 
                                          type="range"
                                          min={1000000}
                                          max={60000000}
                                          step={500000}
                                          value={activeNegotiation.salary}
                                          onChange={(e) => setActiveNegotiation({ ...activeNegotiation, salary: Number(e.target.value) })}
                                          className="w-full accent-amber-500 bg-zinc-800 rounded-lg h-2"
                                        />
                                        <div className="flex justify-between text-[8px] font-bold text-zinc-700 uppercase">
                                          <span>$1M</span>
                                          <span>$60M</span>
                                        </div>
                                     </div>

                                     {/* Years Selector */}
                                     <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Contract Duration</label>
                                        <div className="flex gap-2">
                                           {[1, 2, 3, 4].map(y => (
                                              <button 
                                                key={y}
                                                onClick={() => setActiveNegotiation({ ...activeNegotiation, years: y })}
                                                className={`flex-1 py-4 rounded-xl border text-sm font-black transition-all ${activeNegotiation.years === y ? 'bg-white text-black border-white shadow-xl' : 'bg-zinc-800 text-zinc-500 border-white/5 hover:border-white/20'}`}
                                              >
                                                 {y}Y
                                              </button>
                                           ))}
                                        </div>
                                     </div>
                                  </div>
                               </div>
                            )}
                         </div>

                         {/* Footer */}
                         <div className="p-6 md:p-8 bg-black/40 border-t border-white/5">
                            {activeNegotiation.status === 'Active' ? (
                               <div className="flex items-center justify-between gap-6">
                                  <div className="flex flex-col">
                                     <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Negotiation Rounds</span>
                                     <div className="flex gap-1 mt-1">
                                        {[1, 2, 3].map(r => (
                                           <div key={r} className={`w-6 h-1 rounded-full ${r <= rounds ? 'bg-amber-500' : 'bg-zinc-800'}`} />
                                        ))}
                                     </div>
                                  </div>
                                  <button 
                                    onClick={() => handleProposeOffer(activeNegotiation.salary, activeNegotiation.years)}
                                    className="flex-1 max-w-xs py-5 bg-white text-black rounded-2xl font-black uppercase italic tracking-tighter hover:bg-amber-500 transition-all active:scale-95 shadow-2xl shadow-white/5"
                                  >
                                     Propose Offer
                                  </button>
                               </div>
                            ) : (
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                     {activeNegotiation.status === 'Accepted' ? (
                                        <div className="w-12 h-12 bg-green-500 text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.4)]">
                                           <Sparkles size={24} />
                                        </div>
                                     ) : (
                                        <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                                           <AlertTriangle size={24} />
                                        </div>
                                     )}
                                     <div>
                                        <h4 className={`text-xl font-black uppercase italic italic tracking-tighter ${activeNegotiation.status === 'Accepted' ? 'text-green-500' : 'text-red-500'}`}>
                                           {activeNegotiation.status === 'Accepted' ? 'SIGNED' : 'Negotiation Failed'}
                                        </h4>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mt-1">
                                           {activeNegotiation.status === 'Accepted' ? 'Welcome to the roster' : 'Try someone else'}
                                        </p>
                                     </div>
                                  </div>
                                  <button 
                                    onClick={() => setActiveNegotiation(null)}
                                    className="px-10 py-5 bg-zinc-800 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-700 transition-all"
                                  >
                                     Done
                                  </button>
                               </div>
                            )}
                         </div>
                      </div>
                   );
                })()}
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {state.phase === 'Awards' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center p-4 md:p-12 overflow-y-auto no-scrollbar"
          >
             {/* CINEMATIC BACKDROP */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.1)_0%,transparent_70%)] pointer-events-none" />
             <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none" />
             <div className="absolute bottom-0 left-0 right-0 h-[40dvh] bg-gradient-to-t from-black to-transparent pointer-events-none" />
             
             <div className="relative z-10 w-full max-w-6xl space-y-8 md:space-y-16 py-12 px-4 my-auto">
                {(() => {
                   const awards = seasonAwards;
                   
                   if (!awards) {
                      return (
                         <div className="text-center space-y-8">
                            <motion.div 
                              initial={{ scale: 0 }} animate={{ scale: 1 }}
                              className="w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center text-zinc-700 mx-auto border border-white/5"
                            >
                               <Trophy size={48} />
                            </motion.div>
                            <div className="space-y-3">
                               <p className="text-amber-500 text-[10px] md:text-sm font-black uppercase tracking-[0.4em] italic">Season Summary</p>
                               <h2 className="text-4xl md:text-6xl text-white font-black italic uppercase italic tracking-tighter">Awards Postponed</h2>
                               <p className="text-zinc-500 text-[10px] md:text-sm max-w-xs mx-auto uppercase font-black tracking-widest leading-relaxed">The committee has determined that no candidates met the scoring threshold this season.</p>
                            </div>
                            <button 
                               onClick={() => {
                                  state.phase = 'Playoffs';
                                  state.playoffSeries = playoffService.generatePlayIn(state);
                                  setState({ ...state });
                               }}
                               className="px-16 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-500 transition-all shadow-2xl active:scale-95"
                            >
                               Start Playoffs
                            </button>
                         </div>
                      );
                   }

                   const awardData = [
                      { title: 'Most Valuable Player', prize: 'The Maurice Podoloff Trophy', winner: awards.mvp, color: 'from-amber-600 to-amber-400', glow: 'rgba(245,158,11,0.2)' },
                      { title: 'Defensive Player of the Year', prize: 'The Hakeem Olajuwon Trophy', winner: awards.dpoy, color: 'from-blue-600 to-cyan-400', glow: 'rgba(6,182,212,0.2)' },
                      { title: 'Rookie of the Year', prize: 'The Wilt Chamberlain Trophy', winner: awards.roy, color: 'from-green-600 to-emerald-400', glow: 'rgba(16,185,129,0.2)' },
                      { title: 'Most Improved Player', prize: 'The George Mikan Trophy', winner: awards.mip, color: 'from-purple-600 to-pink-400', glow: 'rgba(168,85,247,0.2)' },
                       ...(awards.finalsMvp ? [{ title: 'Finals MVP', prize: 'The Bill Russell Trophy', winner: { id: awards.finalsMvp.id, card: awards.finalsMvp }, color: 'from-amber-500 to-yellow-300', glow: 'rgba(251,191,36,0.3)' }] : [])
                    ];

                   const currentAward = awardRevealStep < awardData.length ? awardData[awardRevealStep] : null;

                   if (awardRevealStep < awardData.length && currentAward) {
                      return (
                         <motion.div 
                           key={currentAward.title}
                           initial={{ opacity: 0 }}
                           animate={{ opacity: 1 }}
                           exit={{ opacity: 0 }}
                           className="flex flex-col items-center gap-8 md:gap-12"
                         >
                            <div className="space-y-4 md:space-y-6 text-center">
                               <motion.div
                                 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                                 className="flex items-center justify-center gap-4 mb-2 md:mb-6"
                               >
                                  <div className="h-px w-8 md:w-20 bg-white/10" />
                                  <p className="text-amber-500 text-[10px] md:text-sm font-black uppercase tracking-[0.5em] italic">
                                     NBA {state.season} HONORS
                                  </p>
                                  <div className="h-px w-8 md:w-20 bg-white/10" />
                                </motion.div>
                               
                               <div className="overflow-hidden">
                                 <motion.h2 
                                   initial={{ y: 200 }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 20, stiffness: 100 }}
                                   className="text-4xl md:text-7xl lg:text-[7rem] font-black uppercase italic tracking-tighter text-white leading-[0.8] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                                 >
                                    {currentAward.title}
                                 </motion.h2>
                               </div>
                               
                               <motion.div
                                 initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8 }}
                                 className="flex items-center justify-center gap-3 text-zinc-500"
                               >
                                  <div className="px-5 py-1.5 bg-white/5 border border-white/10 rounded-full flex items-center gap-3">
                                    <Trophy size={14} className="text-amber-500" />
                                    <p className="text-[10px] md:text-sm font-black italic uppercase tracking-[0.2em] leading-none">
                                       {currentAward.prize}
                                    </p>
                                  </div>
                                </motion.div>
                            </div>

                            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-20 w-full py-8">
                               {/* FINALISTS PANEL */}
                               <motion.div 
                                 initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }}
                                 className="hidden lg:block space-y-6 bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-3xl w-80 shrink-0"
                               >
                                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-8 italic">Finalists Council</p>
                                  <div className="space-y-6">
                                    {awards.finalists[currentAward.winner.id === awards.mvp.id ? 'mvp' : currentAward.winner.id === awards.dpoy.id ? 'dpoy' : currentAward.winner.id === awards.roy.id ? 'roy' : 'mip'].slice(0, 3).map((f: any) => (
                                       <div key={f.id} className={`flex items-center gap-4 group transition-all duration-700 ${f.id === currentAward.winner.id ? 'opacity-100' : 'opacity-30'}`}>
                                          <div className={`w-14 h-14 rounded-2xl bg-black p-1.5 border ${f.id === currentAward.winner.id ? 'border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.2)]' : 'border-white/5'}`}>
                                             <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${f.card.nbaId}.png`} className="w-full h-full object-contain" />
                                          </div>
                                          <div>
                                             <p className={`text-xs font-black uppercase italic ${f.id === currentAward.winner.id ? 'text-amber-500' : 'text-zinc-500'}`}>{f.card.name.split(' ').pop()}</p>
                                             <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">{f.team?.abbreviation || 'FA'}</p>
                                          </div>
                                          {f.id === currentAward.winner.id && <div className="ml-auto w-2 h-2 bg-amber-500 rounded-full animate-ping" />}
                                       </div>
                                    ))}
                                  </div>
                               </motion.div>

                               {/* WINNER SPOTLIGHT */}
                               <div className="flex flex-col items-center relative">
                                 <motion.div 
                                   initial={{ rotateY: 90, scale: 0.8, opacity: 0 }}
                                   animate={{ rotateY: 0, scale: 1, opacity: 1 }}
                                   transition={{ duration: 1.5, delay: 0.5, type: 'spring', bounce: 0.2 }}
                                   className="w-64 md:w-80 lg:w-96 relative z-20"
                                  >
                                    <div className={`absolute inset-0 bg-gradient-to-tr ${currentAward.color} blur-[120px] opacity-30 rounded-full animate-pulse`} />
                                    <div className="relative group perspective-1000">
                                      <motion.div
                                        animate={{ y: [0, -10, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                      >
                                        <CardItem card={currentAward.winner.card} isOwned={true} mode="detail" />
                                      </motion.div>
                                      
                                      {/* WINNER BADGE */}
                                      <motion.div 
                                        initial={{ scale: 0, x: 20 }} animate={{ scale: 1, x: 0 }} transition={{ delay: 2.5 }}
                                        className="absolute -top-6 -right-6 w-16 h-16 bg-amber-500 text-black rounded-2xl flex flex-col items-center justify-center shadow-2xl rotate-12"
                                      >
                                         <Star size={24} fill="black" />
                                         <span className="text-[8px] font-black uppercase">Winner</span>
                                      </motion.div>
                                    </div>
                                 </motion.div>
                               </div>

                               {/* STATS PANEL */}
                               <motion.div 
                                 initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.5 }}
                                 className="space-y-6 bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-3xl w-full md:w-80 shrink-0"
                               >
                                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-8 italic">Official Season Stats</p>
                                  <div className="grid grid-cols-2 md:grid-cols-1 gap-6">
                                     <div className="space-y-1">
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none">Scoring average</p>
                                        <p className="text-3xl md:text-5xl font-black text-white italic tracking-tighter leading-none">{currentAward.winner.avgPts.toFixed(1)}<span className="text-[10px] text-zinc-500 ml-1 not-italic font-bold">PTS</span></p>
                                     </div>
                                     <div className="space-y-1 border-t border-white/5 pt-6">
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none">Board control</p>
                                        <p className="text-3xl md:text-5xl font-black text-white italic tracking-tighter leading-none">{currentAward.winner.avgReb.toFixed(1)}<span className="text-[10px] text-zinc-500 ml-1 not-italic font-bold">REB</span></p>
                                     </div>
                                     <div className="space-y-1 border-t border-white/5 pt-6 hidden md:block">
                                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none">Vision & Playmaking</p>
                                        <p className="text-3xl md:text-5xl font-black text-white italic tracking-tighter leading-none">{currentAward.winner.avgAst.toFixed(1)}<span className="text-[10px] text-zinc-500 ml-1 not-italic font-bold">AST</span></p>
                                     </div>
                                  </div>
                               </motion.div>
                            </div>

                            {/* NAVIGATION CONTROLS */}
                            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-4 w-full">
                               <motion.button 
                                 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 3 }}
                                 onClick={() => {
                                   if (awardRevealStep < awardData.length - 1) {
                                      setAwardRevealStep(prev => prev + 1);
                                      confetti({ particleCount: 50, spread: 40, colors: ['#f59e0b', '#ffffff'] });
                                   } else {
                                      setAwardRevealStep(awardData.length);
                                   }
                                 }}
                                 className="group relative flex items-center justify-center gap-4 bg-white text-black px-12 py-5 rounded-[1.5rem] text-sm font-black uppercase tracking-[0.2em] italic transition-all hover:bg-amber-500 active:scale-95 shadow-2xl w-full md:w-auto"
                               >
                                  <span>{awardRevealStep === awardData.length - 1 ? 'Show ALL-NBA First Team' : 'Next Presentation'}</span>
                                  <ChevronRight size={20} className="group-hover:translate-x-2 transition-transform" />
                               </motion.button>
                               
                               <motion.button 
                                 initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ delay: 4 }}
                                 onClick={() => {
                                    setAwardRevealStep(awardData.length);
                                    notifySuccess("Ceremony skipped. Welcome to the Playoffs.");
                                 }}
                                 className="text-zinc-500 hover:text-white text-[10px] uppercase font-black tracking-widest px-8 py-4 transition-all"
                               >
                                  Skip Rest
                                </motion.button>
                            </div>
                         </motion.div>
                      );
                   }

                   return (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="space-y-12 md:space-y-24 text-center py-12 md:py-24 my-auto"
                      >
                         <div className="space-y-4 md:space-y-8">
                            <motion.div 
                              initial={{ scale: 0 }} animate={{ scale: 1 }}
                              className="w-20 h-20 md:w-32 md:h-32 bg-amber-500 rounded-[2.5rem] flex items-center justify-center text-black mx-auto shadow-[0_0_80px_rgba(245,158,11,0.5)] relative"
                            >
                               <Trophy size={40} className="md:w-16 md:h-16 relative z-10" />
                               <div className="absolute inset-0 bg-white rounded-[2.5rem] animate-ping opacity-20" />
                            </motion.div>
                            <div className="space-y-2">
                               <p className="text-amber-500 text-[10px] md:text-lg font-black uppercase tracking-[0.6em] italic">NBA Elite Selection</p>
                               <h2 className="text-4xl md:text-7xl lg:text-9xl font-black uppercase italic tracking-tighter text-white">All-NBA First Team</h2>
                            </div>
                         </div>

                         <div className="grid grid-cols-2 lg:grid-cols-5 items-center justify-center gap-4 lg:gap-8 px-4 max-w-7xl mx-auto">
                            {awards.allNba.map((id: string, i: number) => {
                               const card = findCard(id);
                               if (!card) return null;
                               return (
                                  <motion.div 
                                    key={id}
                                    initial={{ opacity: 0, scale: 0.5, y: 50 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ delay: i * 0.1, duration: 0.6 }}
                                    className="w-full mix-blend-screen"
                                  >
                                     <div className="transition-all duration-500 hover:scale-105 group/card">
                                       <div className="relative">
                                          <CardItem card={card} isOwned={true} mode="mini" />
                                          <div className="absolute -bottom-2 -left-2 w-8 h-8 md:w-10 md:h-10 bg-amber-500 text-black rounded-lg flex items-center justify-center font-black text-xs md:text-sm italic shadow-lg transform -rotate-12 group-hover/card:rotate-0 transition-transform">
                                             {i + 1}
                                          </div>
                                       </div>
                                       <div className="mt-3 md:mt-5 text-center">
                                          <p className="text-[10px] md:text-sm font-black text-white italic uppercase tracking-tighter leading-none">{card.name}</p>
                                          <p className="text-[7px] md:text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">{card.position} • {card.stats.ovr} OVR</p>
                                       </div>
                                     </div>
                                  </motion.div>
                               );
                            })}
                         </div>

                         <button 
                           onClick={() => {
                             const awardsRes = seasonAwards;
                             if (!awardsRes) return;

                             const userPlayerAwards = [awardsRes.mvp, awardsRes.roy, awardsRes.dpoy, awardsRes.mip]
                               .filter(a => userTeam.roster.includes(a.id))
                               .map(a => ({ i: a.id, t: a === awardsRes.mvp ? 'MVP' : a === awardsRes.dpoy ? 'DPOY' : a === awardsRes.roy ? 'ROY' : 'MIP' }));
                             
                             const newTrophies = userPlayerAwards.map(a => ({
                               type: a.t as any,
                               season: state.season,
                               playerId: a.i,
                               label: `${a.t} - ${state.season}`
                             }));

                             state.trophyCase.push(...newTrophies);
                             state.phase = 'Playoffs';
                             state.playoffSeries = playoffService.generatePlayIn(state);
                             setState({ ...state });
                             setAwardRevealStep(0);
                           }}
                           className="group relative bg-amber-600 hover:bg-amber-500 text-white px-12 md:px-24 py-5 md:py-8 rounded-2xl md:rounded-[2.5rem] text-sm md:text-2xl font-black uppercase italic tracking-tighter shadow-[0_32px_64px_-16px_rgba(245,158,11,0.3)] transition-all overflow-hidden"
                         >
                            <span className="relative z-10">Commence Postseason Battle</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-400/0 via-white/20 to-amber-400/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                         </button>
                      </motion.div>
                   );
                })()}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {state.championId && (
          <div className="fixed inset-0 z-[20000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
             <motion.div 
               initial={{ scale: 0.5, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="text-center space-y-12 max-w-2xl w-full"
             >
                <motion.div 
                  animate={{ 
                    rotate: [0, -5, 5, -5, 5, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="relative"
                >
                   <div className="absolute inset-0 bg-amber-500/20 blur-[120px] rounded-full animate-pulse" />
                   <div className="w-40 h-40 md:w-64 md:h-64 bg-gradient-to-br from-amber-200 via-amber-500 to-amber-700 rounded-[3rem] md:rounded-[4rem] flex items-center justify-center text-black mx-auto shadow-[0_0_100px_rgba(245,158,11,0.5)] relative z-10 p-8">
                      <Trophy size={160} className="w-full h-full" />
                   </div>
                </motion.div>

                <div className="space-y-4">
                   <h2 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.8em]">NBA Season {state.season}</h2>
                   <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter text-white">World Champions</h1>
                   <div className="flex items-center justify-center gap-6 mt-8">
                      <img src={getTeamLogo(state.championId)} className="w-16 h-16 md:w-24 md:h-24 object-contain" />
                      <div className="text-left border-l border-white/20 pl-6">
                        <h3 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-white">{state.teams[state.championId].name}</h3>
                        <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Title Secured</p>
                      </div>
                   </div>
                 </div>

                 {(() => {
                   const fmvp = seasonAwards?.finalsMvp;
                   if (fmvp) {
                      const fmvpCard = findCard(fmvp.id);
                      if (fmvpCard) {
                        return (
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
                            className="bg-zinc-900/50 p-6 md:p-8 rounded-[2rem] border border-amber-500/30 flex flex-col md:flex-row items-center gap-6 max-w-md mx-auto"
                          >
                             <div className="w-24 md:w-32 shrink-0">
                                <CardItem card={fmvpCard} isOwned={true} mode="mini" />
                             </div>
                             <div className="text-center md:text-left space-y-2">
                                <div className="flex items-center justify-center md:justify-start gap-2">
                                   <Star className="text-amber-500" size={14} fill="currentColor" />
                                   <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Finals MVP</span>
                                </div>
                                <h4 className="text-xl md:text-2xl font-black text-white italic uppercase tracking-tight">{fmvpCard.name}</h4>
                                <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em] leading-relaxed">
                                   Led his team to glory with a historic finals performance.
                                </p>
                             </div>
                          </motion.div>
                        );
                      }
                   }
                   return null;
                 })()}

                 <div className="pt-8">
                  <button 
                    onClick={() => {
                        const newState = advanceSeason(state);
                        setState(newState);
                        stateService.save(newState);
                        notifySuccess("Season advanced! Good luck in the Draft.");
                    }}
                    className="group relative px-12 py-5 bg-white text-black rounded-2xl font-black uppercase italic tracking-tight text-xl hover:bg-amber-500 transition-all active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.2)]"
                  >
                    Proceed to Draft Pool
                    <Sparkles className="absolute -top-2 -right-2 text-white group-hover:animate-spin" size={24} />
                  </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EXIT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-zinc-900 border border-white/5 p-10 rounded-[3rem] max-w-sm w-full text-center space-y-8"
            >
              <div className="space-y-4">
                <h3 className="text-3xl font-black uppercase italic tracking-tighter">Exit Franchise?</h3>
                <p className="text-zinc-500 text-sm font-medium">Are you sure you want to exit? Your progress is saved automatically.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setShowExitConfirm(false)}
                  className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px]"
                >
                  Stay
                </button>
                <button 
                  onClick={() => {
                    // We don't actually have a prop to "close" it, but we can reset the state to null to go back to selection or simulate home transition
                    // Actually useFranchise returns startNewFranchise but not a "leave" function.
                    // We can just set the state to something that signifies "not in franchise" but that might be tricky globally.
                    // For now, let's just use window.location.reload() or navigate if we had routing.
                    // The request says "vuelve a la vista principal del juego (HomeView)".
                    // In this SPA, HomeView is shown when franchise state is null OR a different view is active.
                    // I will clear the state in the current view's local state or reset the whole thing if that's what's meant.
                    // "Su progreso no se borra, solo se sale de la vista."
                    // This implies we need a way to "suspend" the franchise mode view.
                    // Let's assume the parent handles the switching.
                    window.location.href = '/'; 
                  }}
                  className="w-full py-4 bg-zinc-800 text-zinc-400 rounded-2xl font-black uppercase tracking-widest text-[8px]"
                >
                  Confirm Exit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* NAVIGATION - Improved for Mobile Vertical */}
      <div className="bg-zinc-950/95 backdrop-blur-3xl border-t border-white/5 md:border-t-0 md:border-b landscape:border-b-0 landscape:border-r fixed bottom-0 left-0 right-0 md:sticky md:top-0 landscape:top-0 landscape:left-0 z-[9999] overflow-x-auto landscape:overflow-y-auto no-scrollbar touch-pan-x hide-scrollbar scroll-smooth landscape:h-screen landscape:w-20 lg:landscape:w-24 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
        <div className="flex px-4 md:px-12 landscape:px-2 gap-2 md:gap-2 landscape:gap-4 py-3 md:py-2 landscape:py-8 min-w-max md:min-w-0 h-full items-center landscape:flex-col landscape:justify-start">
          {[
            { id: 'hub', label: 'HUB', icon: LayoutDashboard },
            { id: 'lineup', label: 'ROSTER', icon: Users },
            { id: 'market', label: 'MARKET', icon: ShoppingCart },
            { id: 'trades', label: 'TRADES', icon: History },
            { id: 'office', label: 'OFFICE', icon: Building },
            { id: 'league', label: 'LEAGUE', icon: BarChart3 },
            { id: 'stats', label: 'STATS', icon: BarChart3 },
            ...(state.phase === 'Draft' ? [{ id: 'draft', label: 'DRAFT', icon: Sparkles }] : [])
          ].map((tab) => (
            <button
              key={tab.id}
               id={`nav-tab-${tab.id}`}
              onClick={() => {
                setActiveTab(tab.id as any);
                const el = document.getElementById(`nav-tab-${tab.id}`);
                el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
              }}
              className={`flex flex-col landscape:flex-row items-center gap-1.5 md:gap-3 px-4 md:px-6 landscape:px-0 landscape:w-14 landscape:h-14 landscape:justify-center py-2 md:py-4 rounded-xl md:rounded-2xl transition-all whitespace-nowrap shrink-0 relative ${
                activeTab === tab.id 
                  ? 'bg-white/10 text-white font-black' 
                  : 'text-zinc-600 hover:text-zinc-400'
              }`}
            >
              <tab.icon size={18} className="md:w-[14px] md:h-[14px] landscape:w-5 landscape:h-5" />
              <span className="text-[8px] md:text-xs landscape:hidden font-black uppercase tracking-[0.1em] leading-none">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="active-nav-bg"
                  className="absolute inset-x-1 md:inset-0 top-1 bottom-1 md:top-0 md:bottom-0 bg-white/5 rounded-[0.75rem] md:rounded-2xl border border-white/10" 
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col relative overflow-hidden h-full">
        {/* COMPACT HEADER (GLOBAL ACROSS TABS) */}
        <div className="bg-zinc-950 border-b border-white/5 px-3 h-[48px] md:h-auto md:px-12 md:py-6 flex items-center justify-between gap-3 md:gap-6 sticky top-0 z-50">
          <div className="flex items-center gap-2 md:gap-6 h-full overflow-hidden">
            <div className="w-7 h-7 md:w-16 md:h-16 bg-zinc-900 rounded-lg md:rounded-[1.5rem] p-1 md:p-3 border border-white/5 shadow-2xl shrink-0">
               <img src={getTeamLogo(userTeam.teamId)} className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col md:block overflow-hidden">
               <div className="flex items-center gap-1.5 md:gap-3 flex-wrap">
                  <h2 className="text-[9px] md:text-2xl font-black uppercase italic tracking-tighter text-white truncate">
                     <span className="md:hidden">{userTeam.abbreviation} • {userTeam.wins}-{userTeam.losses}</span>
                     <span className="hidden md:inline">{userTeam.name}</span>
                  </h2>
                  <div className="hidden md:flex items-center gap-1 text-[8px] md:text-sm font-black text-zinc-400">
                     <span>{userTeam.wins} - {userTeam.losses}</span>
                  </div>
                  {state.phase === 'Regular' && (
                     <div className={`px-2 py-0.5 rounded text-[7px] md:text-[10px] font-black uppercase tracking-tighter ${state.week > tradeEngine.TRADE_DEADLINE_WEEK ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'}`}>
                        {state.week > tradeEngine.TRADE_DEADLINE_WEEK ? 'Deadline Passed' : `Week ${state.week}/18`}
                     </div>
                  )}
               </div>
               <div className="hidden md:flex items-center gap-4 mt-1">
                  <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{state.phase === 'Regular' ? 'Regular Season' : state.phase}</span>
                  <div className="w-px h-3 bg-zinc-800" />
                  <div className="flex items-center gap-2">
                     <span className="text-xs font-black text-amber-500">${(userTeam.payroll/1e6).toFixed(1)}M</span>
                     <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Payroll</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
             <button 
               onClick={() => setShowExitConfirm(true)}
               className="px-3 py-2 md:px-6 md:py-3 bg-zinc-900 border border-white/5 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all"
             >
               Exit
             </button>

             <div className="hidden md:flex items-center gap-3">
               {pendingUserGamesThisCycle.length > 0 ? (
                 <button 
                   onClick={simulateGame}
                   className="flex items-center gap-3 bg-amber-500 text-black px-8 py-4 rounded-2xl font-black uppercase italic tracking-tighter text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(245,158,11,0.2)]"
                 >
                   <Play size={16} fill="currentColor" />
                   Play Game
                 </button>
               ) : (
                 <button 
                   onClick={advanceWeek}
                   className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black uppercase italic tracking-tighter text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
                 >
                   <TrendingUp size={16} />
                   Advance
                 </button>
               )}
             </div>

             <button 
               onClick={resetFranchise}
               className="w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
             >
               <SettingsIcon size={14} className="md:hidden" />
               <SettingsIcon size={20} className="hidden md:block" />
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pb-28 md:pb-0">
          <div className="p-2 md:p-12 landscape:px-8 landscape:py-6 relative overflow-x-hidden">
            <AnimatePresence mode="wait">
          {activeTab === 'hub' && (
            <motion.div 
              key="hub"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto space-y-6 md:space-y-12 pb-20"
            >
              {state.phase === 'Draft' && (
                <div className="bg-gradient-to-br from-amber-500/20 to-zinc-900 border border-amber-500/30 rounded-3xl p-8 text-center space-y-6">
                   <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-black mx-auto">
                      <Sparkles size={32} />
                   </div>
                   <div className="space-y-2">
                      <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Draft is Active!</h3>
                      <p className="text-zinc-500 text-sm font-medium">Head to the Draft tab to select your rookies for the upcoming season.</p>
                   </div>
                   <button 
                     onClick={() => setActiveTab('draft')}
                     className="px-8 py-3 bg-white text-black rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 transition-all"
                   >
                     Go to Draft
                   </button>
                </div>
              )}

              {state.phase === 'Regular' ? (
                <>
                  {/* TOP FEATURE: NEXT MATCH */}
                  {nextUserGame && (
                    <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-3xl md:rounded-[3.5rem] p-4 md:p-12 flex flex-col items-center justify-between gap-6 md:gap-16 relative overflow-hidden group shadow-2xl">
                      <div className="absolute top-0 right-0 w-64 h-64 md:w-80 md:h-80 bg-amber-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 opacity-30" />
                      
                      <div className="space-y-4 md:space-y-8 relative z-10 text-center w-full">
                        <div className="space-y-1 md:space-y-2">
                          <p className="text-[7px] md:text-sm font-black text-amber-500 uppercase tracking-[0.5em] md:tracking-[0.8em]">Gamecenter</p>
                          <h3 className="text-3xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-none truncate">Matchday {nextUserGame.gameNumber}</h3>
                        </div>
                        <div className="flex items-center justify-center gap-3">
                          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[7px] md:text-xs font-black uppercase tracking-widest text-zinc-400">
                             Regular Season
                          </div>
                          <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[7px] md:text-xs font-black uppercase tracking-widest text-amber-500">
                            {nextUserGame.homeTeamId === state.userTeamId ? 'Home Court' : 'On Road'}
                          </div>
                        </div>
                      </div>
    
                      <div className="flex items-center justify-center gap-4 md:gap-16 relative z-10 w-full">
                         <div className="text-center space-y-2 md:space-y-6">
                            <motion.div 
                              whileHover={{ scale: 1.05 }}
                              className="w-16 h-16 md:w-40 md:h-40 bg-zinc-950 rounded-2xl md:rounded-[3rem] p-3 md:p-8 border border-white/10 shadow-2xl transition-all"
                            >
                              <img src={getTeamLogo(state.userTeamId)} className="w-full h-full object-contain" />
                            </motion.div>
                            <p className="text-xs md:text-2xl font-black text-white italic tracking-tighter uppercase">{state.teams[state.userTeamId].abbreviation}</p>
                         </div>
                         
                         <div className="flex flex-col items-center gap-1 md:gap-4">
                           <div className="text-xl md:text-6xl font-black italic text-zinc-800 uppercase tracking-tighter select-none">VS</div>
                           <div className="h-px w-8 md:w-20 bg-white/10" />
                         </div>

                         <div className="text-center space-y-2 md:space-y-6">
                            <motion.div 
                              whileHover={{ scale: 1.05 }}
                              className="w-16 h-16 md:w-40 md:h-40 bg-zinc-950 rounded-2xl md:rounded-[3rem] p-3 md:p-8 border border-white/10 shadow-2xl transition-all"
                            >
                              <img src={getTeamLogo(nextUserGame.homeTeamId === state.userTeamId ? nextUserGame.awayTeamId : nextUserGame.homeTeamId)} className="w-full h-full object-contain" />
                            </motion.div>
                            <p className="text-xs md:text-2xl font-black text-white italic tracking-tighter uppercase">{state.teams[nextUserGame.homeTeamId === state.userTeamId ? nextUserGame.awayTeamId : nextUserGame.homeTeamId].abbreviation}</p>
                         </div>
                      </div>

                      <div className="relative z-10 w-full md:w-auto flex flex-col md:flex-row items-center gap-4 bg-black/40 backdrop-blur-xl p-4 md:p-8 rounded-3xl border border-white/5">
                        <button 
                          onClick={simulateGame}
                          className="w-full md:w-auto h-14 md:h-20 px-12 md:px-20 bg-white text-black rounded-2xl md:rounded-[2.5rem] font-black uppercase italic tracking-tighter text-sm md:text-3xl hover:bg-amber-500 transition-all active:scale-95 shadow-2xl shadow-white/5 relative group/btn overflow-hidden"
                        >
                          <span className="relative z-10">Simulate</span>
                          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-white/10 to-amber-500/0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="md:col-span-1 lg:col-span-2 space-y-4 md:space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm md:text-xl font-black uppercase italic tracking-tighter text-zinc-500 flex items-center gap-2">
                           <LayoutDashboard size={14} /> Next 5 Matches
                        </h3>
                      </div>
                      <div className="space-y-2 md:space-y-4">
                        {state.schedule
                          .filter(m => (m.homeTeamId === state.userTeamId || m.awayTeamId === state.userTeamId) && !m.played)
                          .slice(0, 5)
                          .map((match, i) => {
                            const isHome = match.homeTeamId === state.userTeamId;
                            const opponentId = isHome ? match.awayTeamId : match.homeTeamId;
                            const opponent = NBA_TEAMS.find(t => t.id === opponentId);
                            
                            return (
                              <div key={match.id} className="bg-zinc-900/30 border border-white/5 rounded-xl md:rounded-[2rem] p-3 md:p-8 flex items-center justify-between group hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300">
                                <div className="flex items-center gap-3 md:gap-8">
                                  <div className="text-center w-8 md:w-16">
                                    <p className="text-[8px] md:text-[10px] font-black text-zinc-700 uppercase tracking-widest leading-none mb-1">WK</p>
                                    <p className="text-base md:text-3xl font-black text-white italic leading-none">{match.gameNumber}</p>
                                  </div>
                                  <div className="w-px h-8 md:h-12 bg-white/5" />
                                  <div className="flex items-center gap-3 md:gap-6">
                                    <div className="w-8 h-8 md:w-16 md:h-16 bg-zinc-950 rounded-lg md:rounded-3xl p-1.5 md:p-3.5 border border-white/5 shadow-xl">
                                       <img src={getTeamLogo(opponentId)} className="w-full h-full object-contain" />
                                    </div>
                                    <div className="space-y-0.5 md:space-y-1">
                                      <p className="text-[8px] md:text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">{isHome ? 'HOSTING' : 'VISITING'}</p>
                                      <p className="text-xs md:text-2xl font-black text-white uppercase italic tracking-tighter leading-none">{opponent?.name || opponentId}</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="hidden md:flex flex-col items-end">
                                     <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">Status</p>
                                     <p className="text-xs font-black text-zinc-700 uppercase italic">Scheduled</p>
                                  </div>
                                  <div className="w-8 h-8 md:w-12 md:h-12 rounded-full border border-white/5 flex items-center justify-center text-zinc-800 group-hover:text-white group-hover:border-white/20 transition-all">
                                    <ChevronRight size={14} className="md:w-6 md:h-6" />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                {/* SIDEBAR HUB */}
                <div className="space-y-8">
                   {/* News/Notifications Feed */}
                    {(state.notifications || []).length > 0 && (
                      <div className="bg-zinc-900 rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 border border-white/5 space-y-4 md:space-y-6">
                         <div className="flex items-center justify-between">
                            <h3 className="text-[9px] md:text-xs font-black uppercase tracking-[0.4em] text-zinc-600 italic">League News</h3>
                            <button onClick={() => { state.notifications = []; setState({...state}); }} className="text-[7px] md:text-[8px] font-bold text-zinc-700 hover:text-zinc-500 uppercase tracking-widest">Clear All</button>
                         </div>
                         <div className="space-y-2 md:space-y-4 max-h-[250px] md:max-h-[300px] overflow-y-auto no-scrollbar pr-1 md:pr-2">
                            {(state.notifications || []).slice(0, 5).map((n) => (
                               <div key={n.id} className="bg-black/40 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5 space-y-1.5 md:space-y-2 relative group">
                                  {!n.read && <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />}
                                  <div className="flex items-center gap-2">
                                     <span className="text-[6px] md:text-[7px] font-black bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">{n.type}</span>
                                     <span className="text-[6px] md:text-[7px] font-bold text-zinc-600 uppercase">Week {n.week}</span>
                                  </div>
                                  <p className="text-[8px] md:text-[10px] font-medium text-zinc-400 leading-tight md:leading-relaxed">{n.message}</p>
                               </div>
                            ))}
                         </div>
                      </div>
                    )}

                    <div className="bg-zinc-900 rounded-[1.5rem] md:rounded-[2.5rem] p-5 md:p-8 border border-white/5 space-y-4 md:space-y-6">
                       <h3 className="text-[9px] md:text-xs font-black uppercase tracking-[0.4em] text-zinc-600 italic text-center">Leaders</h3>
                        <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:gap-3">
                           {leagueLeaders.map((leader: any) => (
                              <div key={leader.cat} className="flex items-center justify-between bg-black/40 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/5">
                                 <div>
                                   <p className="text-[7px] md:text-[8px] font-black text-zinc-600 uppercase tracking-widest">{leader.cat}</p>
                                   <p className="text-[10px] md:text-xs font-black text-white italic uppercase truncate max-w-[80px] md:max-w-[100px]">{leader.card?.name.split(' ').pop() || 'N/A'}</p>
                                 </div>
                                 <p className="text-sm md:text-lg font-black text-amber-500 italic tabular-nums">{leader.value.toFixed(1)}</p>
                              </div>
                           ))}
                        </div>
                      <button 
                        onClick={() => setActiveTab('hub')} // Or just stay here
                        className="w-full py-4 text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors"
                      >
                        Season Statistics
                      </button>
                   </div>
                </div>
              </div>
            </>
            ) : (
              renderPlayoffs()
            )}
          </motion.div>
        )}
                   {activeTab === 'market' && (
            <motion.div 
              key="market"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto space-y-6 md:space-y-12 pb-20 px-3"
            >
                  <div className="bg-zinc-900 border border-white/5 p-4 rounded-xl flex items-center justify-between mb-4">
                     <div className="text-left">
                        <p className="text-[6px] font-black text-zinc-500 uppercase">Season</p>
                        <p className="text-[9px] font-black text-white italic">{state.season}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-[6px] font-black text-zinc-500 uppercase">Pool Size</p>
                        <p className="text-[9px] font-black text-white italic">{(state.freeAgentPool || []).length}</p>
                     </div>
                  </div>

                  {state.season === 2025 && state.week < 5 ? (
                    <div className="bg-zinc-900 border border-white/5 rounded-2xl md:rounded-[3rem] p-6 md:p-20 text-center space-y-4 md:space-y-8 relative overflow-hidden">
                       <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-zinc-500/5 blur-[80px] rounded-full" />
                       <div className="relative z-10 space-y-4 md:space-y-6">
                         <div className="w-12 h-12 md:w-20 md:h-20 bg-zinc-900 border border-white/10 rounded-2xl flex items-center justify-center text-zinc-500 mx-auto">
                            <Lock size={24} className="md:w-10 md:h-10" />
                         </div>
                         <div className="space-y-2">
                           <h3 className="text-lg md:text-3xl font-black uppercase italic tracking-tighter">Market Warming Up</h3>
                           <p className="text-zinc-600 text-[8px] md:text-sm max-w-[200px] md:max-w-md mx-auto leading-tight font-black uppercase tracking-tighter">
                             The free agency market opens fully after Week 5
                           </p>
                         </div>
                       </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                       <div className="flex items-center justify-between px-2">
                          <h3 className="text-[10px] md:text-sm font-black uppercase italic text-zinc-500 tracking-[0.2em]">Available Talents</h3>
                          <p className="text-[8px] md:text-[10px] font-black text-zinc-700 uppercase">Top 50 Prospects</p>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                         {(state.freeAgentPool || []).slice(0, 50).map((id) => {
                           const card = findCard(id);
                           if (!card) return null;
                           const demand = marketService.calculateMarketDemand(state, id);
                           return (
                             <motion.div 
                               key={id} 
                               whileHover={{ scale: 1.01 }}
                               className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/[0.03] transition-all"
                             >
                                <div className="flex items-center gap-4">
                                   <div className="relative">
                                      <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card.nbaId}.png`} className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-black object-contain border border-white/5" />
                                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-md flex items-center justify-center text-[8px] font-black text-black italic shadow-lg">{card.stats.ovr}</div>
                                   </div>
                                   <div className="space-y-0.5">
                                      <h4 className="text-sm font-black text-white uppercase italic truncate max-w-[100px]">{card.name.split(' ').pop()}</h4>
                                      <div className="flex items-center gap-1.5">
                                         <span className="text-[8px] font-black text-white bg-zinc-800 px-1.5 py-0.5 rounded uppercase tracking-tighter">{card.position}</span>
                                         <span className="text-[10px] font-black text-amber-500 italic">${(demand.salary/1e6).toFixed(1)}M</span>
                                      </div>
                                   </div>
                                </div>
                                <button 
                                  onClick={() => handleSignPlayer(id)}
                                  className="px-4 py-2 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-500 transition-colors shadow-lg active:scale-95"
                                >
                                  Sign
                                </button>
                             </motion.div>
                           );
                         })}
                       </div>
                    </div>
                  )}
            </motion.div>
          )}
            {activeTab === 'trades' && (
             <motion.div 
              key="trades"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto space-y-4 md:space-y-6 pb-24 px-3"
            >
               <div className="flex items-center justify-between mb-2">
                  <div className="space-y-0.5">
                    <h3 className="text-lg md:text-xl font-black uppercase italic tracking-tighter text-white">Negotiate</h3>
                    <p className="text-[7px] md:text-[10px] font-black text-zinc-600 uppercase tracking-widest">Select Swap Targets</p>
                  </div>
                  <select 
                    value={tradeTargetTeamId || ""}
                    onChange={(e) => {
                      setTradeTargetTeamId(e.target.value);
                      setCpuRequestedIds([]);
                    }}
                    className="bg-zinc-900 text-[9px] md:text-[11px] font-black uppercase tracking-widest text-white border border-white/10 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl outline-none"
                  >
                    <option value="">Select Team</option>
                    {NBA_TEAMS.filter(t => t.id !== state.userTeamId).map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8 mb-32">
                  {/* USER SIDE */}
                  <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[350px] md:h-[500px]">
                     <div className="p-3 border-b border-white/5 bg-white/2 flex items-center justify-between">
                        <span className="text-[10px] font-black text-white italic tracking-widest">YOUR ROSTER</span>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase">{userOfferedIds.length + userOfferedPickIds.length} ITEMS</span>
                     </div>
                     <div className="flex-1 overflow-y-auto divide-y divide-white/5 no-scrollbar">
                        {userTeam.roster.map(id => {
                           const card = findCard(id);
                           const isSelected = userOfferedIds.includes(id);
                           return (
                              <div key={id} onClick={() => setUserOfferedIds(prev => isSelected ? prev.filter(x => x !== id) : [...prev, id])} className={`p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors ${isSelected ? 'bg-amber-500/10' : ''}`}>
                                 <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-zinc-700'}`}>
                                       {isSelected && <X size={12} className="text-black rotate-45" />}
                                    </div>
                                    <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card?.nbaId}.png`} className="w-10 h-10 rounded-full bg-zinc-800 object-contain" />
                                    <div className="flex flex-col">
                                       <span className="text-[11px] font-black uppercase italic text-white leading-none mb-1">{card?.name?.split(' ').pop()}</span>
                                       <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{card?.position} • ${(userTeam.contracts[id]?.salary / 1e6).toFixed(1)}M</span>
                                    </div>
                                 </div>
                                 <span className="text-xs font-black text-amber-500 italic tabular-nums">{card?.stats.ovr}</span>
                              </div>
                           );
                        })}
                     </div>
                     <div className="p-4 bg-black/40 border-t border-white/5 max-h-[140px] overflow-y-auto no-scrollbar">
                        <p className="text-[9px] font-black text-zinc-600 uppercase mb-3 flex items-center justify-between">
                           Draft Capital
                           <span className="text-amber-500">{userOfferedPickIds.length} selected</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                           {userTeam.draftPicks.map(pick => {
                              const isSelected = userOfferedPickIds.includes(pick.id);
                              return (
                                 <button 
                                   key={pick.id}
                                   onClick={() => setUserOfferedPickIds(prev => isSelected ? prev.filter(x => x !== pick.id) : [...prev, pick.id])}
                                   className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase transition-all ${isSelected ? 'bg-amber-500 border-amber-500 text-black' : 'bg-zinc-800 border-white/10 text-zinc-500 hover:text-white'}`}
                                 >
                                    {pick.year.toString().slice(-2)} R{pick.round}
                                 </button>
                              );
                           })}
                        </div>
                     </div>
                  </div>

                  {/* RIVAL SIDE */}
                  <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden flex flex-col h-[350px] md:h-[500px]">
                     <div className="p-3 border-b border-white/5 bg-white/2 flex items-center justify-between">
                        <span className="text-[10px] font-black text-white italic tracking-widest">RECEIVING</span>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase">{cpuRequestedIds.length + cpuRequestedPickIds.length} ITEMS</span>
                     </div>
                     <div className="flex-1 overflow-y-auto divide-y divide-white/5 no-scrollbar">
                        {tradeTargetTeamId ? state.teams[tradeTargetTeamId].roster.map(id => {
                           const card = findCard(id);
                           const isSelected = cpuRequestedIds.includes(id);
                           const contract = state.teams[tradeTargetTeamId!].contracts[id];
                           return (
                              <div key={id} onClick={() => setCpuRequestedIds(prev => isSelected ? prev.filter(x => x !== id) : [...prev, id])} className={`p-4 flex items-center justify-between hover:bg-white/5 cursor-pointer transition-colors ${isSelected ? 'bg-amber-500/10' : ''}`}>
                                 <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-white border-white' : 'border-zinc-700'}`}>
                                       {isSelected && <X size={12} className="text-black rotate-45" />}
                                    </div>
                                    <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card?.nbaId}.png`} className="w-10 h-10 rounded-full bg-zinc-800 object-contain" />
                                    <div className="flex flex-col">
                                       <span className="text-[11px] font-black uppercase italic text-white leading-none mb-1">{card?.name?.split(' ').pop()}</span>
                                       <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{card?.position} • ${(contract?.salary / 1e6).toFixed(1)}M</span>
                                    </div>
                                 </div>
                                 <span className="text-xs font-black text-white italic tabular-nums">{card?.stats.ovr}</span>
                              </div>
                           );
                        }) : (
                           <div className="h-full flex items-center justify-center p-8 text-center bg-black/20">
                              <p className="text-[10px] font-black text-zinc-700 uppercase leading-relaxed italic tracking-widest max-w-[140px]">Select a target team from the menu above</p>
                           </div>
                        )}
                     </div>

                     {tradeTargetTeamId && (
                       <div className="p-4 bg-black/40 border-t border-white/5 max-h-[140px] overflow-y-auto no-scrollbar">
                          <p className="text-[9px] font-black text-zinc-600 uppercase mb-3">Target Draft Picks</p>
                          <div className="flex flex-wrap gap-2">
                             {state.teams[tradeTargetTeamId].draftPicks.map(pick => {
                                const isSelected = cpuRequestedPickIds.includes(pick.id);
                                return (
                                   <button 
                                     key={pick.id}
                                     onClick={() => setCpuRequestedPickIds(prev => isSelected ? prev.filter(x => x !== pick.id) : [...prev, pick.id])}
                                     className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase transition-all ${isSelected ? 'bg-white border-white text-black' : 'bg-zinc-800 border-white/10 text-zinc-500 hover:text-white'}`}
                                   >
                                      {pick.year.toString().slice(-2)} R{pick.round}
                                   </button>
                                );
                             })}
                          </div>
                       </div>
                     )}
                  </div>
               </div>

               {/* FIXED BOTTOM ACTION BAR - Adjusted for Nav visibility on Mobile Vertical */}
               <div className="fixed bottom-[74px] md:bottom-0 landscape:bottom-0 left-0 right-0 h-24 bg-black/80 backdrop-blur-xl border-t border-white/10 z-[5000] flex items-center justify-center px-6">
                  <div className="max-w-4xl w-full flex items-center justify-between gap-6">
                     <div className="flex gap-4">
                        <div className="space-y-1">
                           <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em]">Giving</p>
                           <p className="text-sm font-black italic text-white">{userOfferedIds.length} Plyr, {userOfferedPickIds.length} Pks</p>
                        </div>
                        <div className="w-px h-8 bg-white/10" />
                        <div className="space-y-1">
                           <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em]">Receiving</p>
                           <p className="text-sm font-black italic text-white">{cpuRequestedIds.length} Plyr, {cpuRequestedPickIds.length} Pks</p>
                        </div>
                     </div>
                     
                     <button 
                       onClick={handleExecuteTrade}
                       disabled={userOfferedIds.length === 0 || cpuRequestedIds.length === 0}
                       className="px-12 py-4 bg-white text-black rounded-2xl font-black uppercase italic tracking-tighter disabled:opacity-20 hover:bg-amber-500 transition-all active:scale-95"
                     >
                        Propose Trade
                     </button>
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'office' && (
            <motion.div 
              key="office"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-8 pb-20 px-4 md:px-0"
            >
               {/* TROPHY CASE OVERHAUL */}
               <div className="space-y-8 relative">
                  <div className="flex items-center justify-between px-2">
                     <div className="space-y-1">
                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">The Vault</h3>
                        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest leading-none">Your Franchise Legacy</p>
                     </div>
                     <Trophy className="text-amber-500/20" size={48} />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {[
                       { type: 'CHAMP', label: 'Rings', icon: <Trophy size={20} />, color: 'bg-amber-500', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]' },
                       { type: 'MVP', label: 'MVPs', icon: <Sparkles size={20} />, color: 'bg-white', glow: 'shadow-[0_0_30px_rgba(255,255,255,0.2)]' },
                       { type: 'DPOY', label: 'Best Defense', icon: <Activity size={20} />, color: 'bg-zinc-700', glow: 'shadow-[0_0_30px_rgba(63,63,70,0.2)]' },
                       { type: 'RECORD', label: 'High Scores', icon: <TrendingUp size={20} />, color: 'bg-zinc-900', glow: '' }
                     ].map((t) => {
                       const achievements = (state.trophyCase || []).filter(item => item.type === t.type);
                       return (
                        <div key={t.label} className="group relative bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-4 hover:bg-white/[0.03] transition-all overflow-hidden border-t-white/10">
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-black mb-2 transition-transform group-hover:scale-110 group-hover:rotate-3 ${t.color} ${t.glow}`}>
                              {t.icon}
                           </div>
                           <div className="text-center">
                              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">{t.label}</p>
                              <p className="text-4xl font-black text-white italic tabular-nums leading-none">{achievements.length}</p>
                           </div>
                           {/* Decorative background number */}
                           <span className="absolute -bottom-4 -right-4 text-8xl font-black italic opacity-[0.02] text-white pointer-events-none group-hover:opacity-[0.05] transition-opacity">{achievements.length}</span>
                        </div>
                       );
                     })}
                  </div>

                  {state.trophyCase.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {state.trophyCase.slice().reverse().map((award, i) => {
                          const player = award.playerId ? findCard(award.playerId) : null;
                          return (
                             <motion.div 
                               initial={{ opacity: 0, x: -20 }}
                               animate={{ opacity: 1, x: 0 }}
                               transition={{ delay: i * 0.05 }}
                               key={`${award.type}-${award.season}-${i}`}
                               className="flex items-center gap-4 bg-zinc-900/30 border border-white/5 p-4 rounded-3xl hover:border-white/20 transition-all group"
                             >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${award.type === 'CHAMP' ? 'bg-amber-500 text-black' : 'bg-white/10 text-white'}`}>
                                   <Trophy size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                   <div className="flex items-center gap-2 mb-0.5">
                                      <span className="text-[10px] font-black text-amber-500 italic uppercase">Season {award.season}</span>
                                      <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">• {award.type}</span>
                                   </div>
                                   <h4 className="text-sm font-black text-white uppercase italic truncate">
                                      {award.type === 'CHAMP' ? 'World Champions' : player?.name || award.label || 'Major Award'}
                                   </h4>
                                   {award.type === 'CHAMP' && (
                                       <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Finals Champions</p>
                                   )}
                                </div>
                             </motion.div>
                          );
                       })}
                    </div>
                  ) : (
                    <div className="bg-zinc-900 border border-dashed border-white/10 rounded-[3rem] p-16 text-center space-y-4">
                       <Trophy className="text-zinc-800 mx-auto" size={64} />
                       <div className="space-y-1">
                          <p className="text-xl font-black text-zinc-700 uppercase italic tracking-tighter">Empty Vault</p>
                          <p className="text-[9px] font-black text-zinc-800 uppercase tracking-[0.4em] max-w-[200px] mx-auto">Build your dynasty to claim your first trophy</p>
                       </div>
                    </div>
                  )}
               </div>

                {/* FINANCE & ASSETS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                   {/* Salary Cap Widget */}
                   <div className="bg-zinc-900 border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-10 space-y-4 md:space-y-8 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
                      
                      <div className="flex items-center justify-between relative z-10">
                        <div className="space-y-1">
                          <h3 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter text-white">Salary Cap</h3>
                          <p className="text-[10px] md:text-xs font-bold text-zinc-600 uppercase tracking-widest italic leading-none">Fiscal Management • Season {state.season}</p>
                        </div>
                        <Building size={24} className="text-zinc-800" />
                      </div>

                      <div className="space-y-3 md:space-y-6 relative z-10">
                         <div className="grid grid-cols-3 gap-2">
                           <div className="space-y-0.5">
                             <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Payroll</p>
                             <p className="text-sm md:text-xl font-black text-white italic tracking-tighter leading-none">${(userTeam.payroll / 1000000).toFixed(1)}M</p>
                           </div>
                           <div className="space-y-0.5 border-x border-white/5 px-2">
                             <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Cap Limit</p>
                             <p className="text-sm md:text-xl font-black text-zinc-500 italic tracking-tighter leading-none">$136.0M</p>
                           </div>
                           <div className="space-y-0.5 text-right">
                             <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Space</p>
                             <p className={`text-sm md:text-xl font-black italic tracking-tighter leading-none ${userTeam.payroll > 136000000 ? 'text-red-500' : 'text-green-500'}`}>
                               ${((136000000 - userTeam.payroll) / 1000000).toFixed(1)}M
                             </p>
                           </div>
                         </div>
                         
                         <div className="space-y-2">
                            <div className="h-1.5 md:h-3 bg-black rounded-full overflow-hidden border border-white/5 p-0.5 shadow-inner">
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${Math.min((userTeam.payroll / 136000000) * 100, 100)}%` }}
                                 className={`h-full rounded-full transition-all duration-1000 ${userTeam.payroll > 136000000 ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-amber-600 to-amber-400'}`}
                               />
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[7px] md:text-[9px] font-black text-zinc-800 uppercase tracking-[0.2em]">Usage Percentage</span>
                              <span className="text-[7px] md:text-[9px] font-black text-amber-500 uppercase tracking-[0.2em]">{((userTeam.payroll / 136000000) * 100).toFixed(1)}%</span>
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Assets Widget */}
                   <div className="bg-zinc-900 border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-10 space-y-4 md:space-y-8 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-500/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />
                      
                      <div className="flex items-center justify-between relative z-10">
                        <div className="space-y-1">
                          <h3 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter text-white">Asset Control</h3>
                          <p className="text-[10px] md:text-xs font-bold text-zinc-600 uppercase tracking-widest italic leading-none">Draft Capital • Trade Rights</p>
                        </div>
                        <History size={24} className="text-zinc-800" />
                      </div>

                      <div className="flex flex-wrap gap-2 md:gap-3 relative z-10">
                         {userTeam.draftPicks.slice(0, 8).map((p) => (
                            <div key={p.id} className="px-3 md:px-5 py-2 md:py-3 bg-black/40 border border-white/5 rounded-xl md:rounded-2xl flex flex-col items-start gap-0.5 hover:border-amber-500/30 transition-all cursor-default">
                               <span className="text-[8px] md:text-[10px] font-black text-zinc-600 uppercase leading-none">{p.year} {p.round === 1 ? '1ST' : '2ND'}</span>
                               <span className="text-[10px] md:text-sm font-black text-white italic tracking-tighter leading-none">{p.originalOwnerId}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>

                {/* CONTRACTS VIEW OVERHAUL */}
                <div className="space-y-6 md:space-y-12">
                   <div className="flex items-center justify-between px-2">
                      <div className="space-y-1">
                         <h3 className="text-xl md:text-3xl font-black uppercase italic tracking-tighter text-white">Payroll Registry</h3>
                         <p className="text-[8px] md:text-[10px] font-black text-zinc-600 uppercase tracking-widest">Active Roster Agreements</p>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-4">
                      {userTeam.roster.sort((a,b) => (userTeam.contracts[b]?.salary || 0) - (userTeam.contracts[a]?.salary || 0)).map(id => {
                         const card = findCard(id);
                         const contract = userTeam.contracts[id];
                         if (!card || !contract) return null;
                         const isExpiring = contract.yearsRemaining === 1;
                         const neg = state.negotiations?.[id];

                         return (
                            <div key={id} className="bg-zinc-900/40 border border-white/5 rounded-3xl p-4 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-white/[0.03] transition-all relative overflow-hidden group">
                               {isExpiring && <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />}
                               
                               <div className="flex items-center gap-4 md:gap-8 flex-1">
                                  <div className="relative shrink-0">
                                     <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl bg-black border border-white/10 overflow-hidden shadow-2xl relative">
                                        <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card.nbaId}.png`} className="w-full h-full object-contain" />
                                     </div>
                                     <div className="absolute -bottom-2 -right-2 w-8 h-8 md:w-10 md:h-10 bg-white rounded-xl flex items-center justify-center text-xs md:text-lg font-black text-black italic shadow-2xl border-4 border-zinc-900">{card.stats.ovr}</div>
                                  </div>

                                  <div className="space-y-1 md:space-y-2 flex-1 min-w-0">
                                     <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] font-black bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded uppercase">{card.position}</span>
                                        <span className={`text-[8px] md:text-[10px] font-black px-2 py-0.5 rounded border ${contract.type === 'Max' ? 'border-amber-500 text-amber-500 bg-amber-500/5' : 'border-zinc-700 text-zinc-600'} uppercase tracking-widest italic`}>{contract.type} Contract</span>
                                     </div>
                                     <h4 className="text-lg md:text-3xl font-black text-white uppercase italic tracking-tighter truncate leading-none group-hover:text-amber-500 transition-colors">{card.name}</h4>
                                     <p className="text-[9px] md:text-sm font-bold text-zinc-600 uppercase tracking-widest truncate">{card.archetype}</p>
                                  </div>
                               </div>

                               <div className="flex items-center justify-between md:flex-col md:items-end gap-2 md:gap-4 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                                  <div className="text-left md:text-right">
                                     <p className="text-2xl md:text-3xl font-black text-white italic tracking-tighter leading-none">${(contract.salary/1e6).toFixed(1)}<span className="text-sm md:text-xl ml-0.5">M</span></p>
                                     <div className="flex items-center gap-2 mt-1 justify-start md:justify-end">
                                        <div className={`w-1.5 h-1.5 rounded-full ${isExpiring ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
                                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isExpiring ? 'text-amber-500' : 'text-zinc-600'}`}>Term: {contract.yearsRemaining}Y</p>
                                     </div>
                                  </div>

                                  <div className="flex gap-2">
                                     <button 
                                       onClick={() => {
                                         if (confirm(`Terminate ${card.name}'s contract?`)) {
                                           marketService.releasePlayer(state, id);
                                           setState({...state});
                                         }
                                       }}
                                       className="p-2 md:px-4 md:py-2 bg-zinc-800 hover:bg-red-500/20 text-zinc-600 hover:text-red-500 rounded-xl transition-all"
                                       title="Terminate Contract"
                                     >
                                       <X size={16} />
                                     </button>
                                     {isExpiring && (
                                       <button 
                                         onClick={() => handleNegotiationStart(id)}
                                         className="px-6 py-2 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-400 transition-all shadow-lg active:scale-95"
                                       >
                                         Renew
                                       </button>
                                     )}
                                  </div>
                               </div>
                            </div>
                         );
                      })}
                   </div>
                </div>
             </motion.div>
          )}
                    {activeTab === 'league' && (
             <motion.div 
              key="league"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-6 md:space-y-12 px-3 pb-20"
            >
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    {/* CONFERENCE STANDINGS */}
                    {['East', 'West'].map(conf => (
                      <div key={conf} className="space-y-4 md:space-y-6">
                         <div className="flex items-center justify-between border-b border-white/5 pb-2 px-1">
                            <h3 className="text-xl md:text-3xl font-black uppercase italic text-white tracking-tighter">{conf}</h3>
                            <span className="text-[9px] md:text-sm font-bold text-zinc-600 uppercase tracking-widest italic">Regular Season</span>
                         </div>
                         <div className="bg-zinc-900 border border-white/5 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl">
                             <table className="w-full text-left border-collapse">
                                <thead className="bg-white/5 border-b border-white/5">
                                   <tr className="text-[8px] md:text-xs font-black text-zinc-600 uppercase tracking-[0.2em]">
                                      <th className="px-4 md:px-8 py-3 md:py-6">TEAM</th>
                                      <th className="px-2 md:px-4 py-3 md:py-6 text-center">W</th>
                                      <th className="px-2 md:px-4 py-3 md:py-6 text-center">L</th>
                                      <th className="px-2 md:px-4 py-3 md:py-6 text-right tabular-nums">PCT</th>
                                   </tr>
                                </thead>
                                <tbody>
                                   {(Object.values(state.teams) as TeamObject[])
                                     .filter(t => t.conference === conf)
                                     .sort((a, b) => b.wins - a.wins || a.losses - b.losses)
                                     .map((team, i) => {
                                        return (
                                          <tr key={team.teamId} className={`border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors ${team.isHuman ? 'bg-amber-500/5' : ''}`}>
                                             <td className="px-4 md:px-8 py-2 md:py-5">
                                                <div className="flex items-center gap-3 md:gap-6">
                                                   <span className="text-[10px] md:text-sm font-black text-zinc-800 w-4 italic">{i+1}</span>
                                                   <div className="w-6 h-6 md:w-10 md:h-10 bg-black/40 rounded-lg p-1 border border-white/5 flex items-center justify-center">
                                                     <img src={getTeamLogo(team.teamId)} className="w-full h-full object-contain" />
                                                   </div>
                                                   <div className="flex flex-col">
                                                      <span className={`text-[11px] md:text-xl font-black uppercase italic tracking-tighter ${team.isHuman ? 'text-amber-500' : 'text-white'}`}>{team.abbreviation}</span>
                                                      <span className="text-[8px] md:text-[10px] font-bold text-zinc-600 uppercase tracking-widest hidden md:block">{team.name}</span>
                                                   </div>
                                                </div>
                                             </td>
                                             <td className="px-2 md:px-4 py-2 md:py-5 text-center text-sm md:text-2xl font-black text-white italic tabular-nums leading-none tracking-tighter">{team.wins}</td>
                                             <td className="px-2 md:px-4 py-2 md:py-5 text-center text-sm md:text-2xl font-black text-zinc-700 italic tabular-nums leading-none tracking-tighter">{team.losses}</td>
                                             <td className="px-2 md:px-4 py-2 md:py-5 text-right text-[10px] md:text-sm font-mono text-zinc-500 tabular-nums">
                                               .{((team.wins / Math.max(1, (team.wins+team.losses))) * 1000).toFixed(0).padStart(3, '0')}
                                             </td>
                                          </tr>
                                        );
                                     })}
                                </tbody>
                             </table>
                         </div>
                      </div>
                    ))}
               </div>
            </motion.div>
          )}


    










           {activeTab === 'lineup' && (
            <motion.div 
              key="lineup"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="max-w-6xl mx-auto space-y-8 md:space-y-12 pb-20 px-3 md:px-4"
            >
                {/* STARTING 5 GRID */}
                <div className="space-y-4 md:space-y-8">
                   <div className="flex items-center justify-between border-b border-white/5 pb-4">
                      <div className="space-y-1">
                        <h3 className="text-xl md:text-3xl font-black uppercase italic text-white tracking-tighter leading-none">First Unit</h3>
                        <p className="text-[10px] md:text-sm font-bold text-zinc-500 uppercase tracking-widest italic">Starting Five Lineup</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[9px] md:text-xs font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">Edit Mode</span>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-5 gap-2 md:gap-8">
                      {(['PG', 'SG', 'SF', 'PF', 'C'] as const).map(pos => {
                         const card = findCard(userTeam.lineup[pos]);
                         return (
                            <div key={pos} className="space-y-2 md:space-y-6 flex flex-col items-center">
                               <div 
                                  onClick={() => setLineupModalPos(pos)}
                                  className="relative w-full aspect-[1/1.4] group cursor-pointer"
                               >
                                  {card ? (
                                     <div className="transition-all duration-300 group-hover:scale-[1.05] group-hover:drop-shadow-[0_0_20px_rgba(245,158,11,0.3)] h-full">
                                       <CardItem card={card} isOwned={true} mode="mini" />
                                       <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-50">
                                         <span className="text-[9px] md:text-xs font-black text-black bg-white px-2 py-0.5 rounded shadow-xl border border-zinc-200">{pos}</span>
                                       </div>
                                     </div>
                                  ) : (
                                     <div className="w-full h-full border border-dashed border-white/10 bg-white/[0.02] rounded-xl md:rounded-[2rem] flex flex-col items-center justify-center gap-1 md:gap-4 transition-all group-hover:bg-white/[0.05] group-hover:border-white/20 aspect-[1/1.4]">
                                        <Plus className="text-zinc-700" size={16} />
                                        <span className="text-[9px] md:text-[11px] font-black text-zinc-700 uppercase italic text-center leading-none">{pos}</span>
                                     </div>
                                  )}
                               </div>
                            </div>
                         );
                      })}
                   </div>
                </div>

               {/* BENCH HORIZONTAL */}
               <div className="space-y-3 md:space-y-4">
                  <div className="flex items-center justify-between">
                     <h3 className="text-base md:text-2xl font-black uppercase italic text-white tracking-tighter leading-none">Bench</h3>
                     <button 
                        onClick={() => setLineupModalPos('bench')}
                        className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded-lg md:rounded-xl text-[6px] md:text-[10px] font-black text-zinc-400 uppercase tracking-widest transition-all"
                     >
                        <Plus size={8} /> Add
                     </button>
                  </div>
                  
                  <div className="flex gap-1.5 md:gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
                     {userTeam.lineup.bench.map((id, index) => {
                        const card = findCard(id);
                        if (!card) return null;
                        return (
                           <div 
                              key={id} 
                              className="w-[85px] md:w-[140px] shrink-0 transition-transform hover:scale-105 cursor-pointer"
                              onClick={() => {
                                 if (confirm(`Remove ${card.name} from bench?`)) {
                                    userTeam.lineup.bench = userTeam.lineup.bench.filter(bid => bid !== id);
                                    setState({ ...state });
                                 }
                              }}
                           >
                              <CardItem card={card} isOwned={true} mode="mini" />
                           </div>
                        );
                     })}
                     {userTeam.lineup.bench.length === 0 && (
                        <div className="w-full py-8 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-2xl opacity-40">
                           <Users className="text-zinc-700 mb-1" size={24} />
                           <p className="text-[8px] font-black text-zinc-800 uppercase italic">Bench Empty</p>
                        </div>
                     )}
                  </div>
               </div>

               {/* MODAL / SELECTOR */}
               <AnimatePresence>
                {lineupModalPos && (
                  <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setLineupModalPos(null)}
                      className="absolute inset-0 bg-black/95 backdrop-blur-md" 
                    />
                    <motion.div 
                      initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                      className="relative w-full max-w-6xl bg-zinc-900 border border-white/10 rounded-2xl md:rounded-[3rem] p-5 md:p-12 space-y-6 md:space-y-12 max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                    >
                      <div className="flex items-center justify-between shrink-0">
                        <div className="space-y-1 md:space-y-2">
                          <h3 className="text-xl md:text-5xl font-black uppercase italic tracking-tighter leading-none">Select Player</h3>
                          <p className="text-amber-500 text-[8px] md:text-sm font-black uppercase tracking-widest italic flex items-center gap-1.5 md:gap-2">
                             <Sparkles size={10} className="md:w-4 md:h-4" /> Assigning to {lineupModalPos}
                          </p>
                        </div>
                        <button onClick={() => setLineupModalPos(null)} className="p-2 md:p-4 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                          <Plus size={20} className="md:w-8 md:h-8 rotate-45" />
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto pr-2 md:pr-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
                           {userTeam.roster.map(id => {
                              const card = findCard(id);
                              if (!card) return null;
                              const isPositionMatch = lineupModalPos !== 'bench' && card.position.includes(lineupModalPos.charAt(0));
                              // FIXED: Only assigned if strictly in the current slot OR on bench (if editing bench)
                              const isAssigned = lineupModalPos !== 'bench' 
                                ? (userTeam.lineup[lineupModalPos as keyof TeamObject['lineup']] === id)
                                : (userTeam.lineup.bench as string[]).includes(id);

                              return (
                                 <motion.div 
                                    key={id}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="relative group h-full flex flex-col"
                                    onClick={() => {
                                       if (isAssigned) {
                                         setLineupModalPos(null);
                                         return;
                                       }
                                       handleUpdateLineup(id);
                                       setLineupModalPos(null);
                                    }}
                                 >
                                    <div className={`h-full transition-all duration-300 ${isAssigned ? 'opacity-20 grayscale border border-white/5 rounded-xl' : 'group-hover:drop-shadow-[0_0_15px_rgba(245,158,11,0.2)]'}`}>
                                       <CardItem card={card} isOwned={true} mode="mini" />
                                    </div>
                                    
                                    {isAssigned && (
                                       <div className="absolute inset-0 z-50 flex items-center justify-center p-2">
                                          <div className="bg-black/60 backdrop-blur-sm border border-white/5 px-2 py-1 rounded-lg text-center">
                                             <p className="text-[6px] md:text-[10px] font-black text-white uppercase italic">Active</p>
                                          </div>
                                       </div>
                                    )}

                                    {!isAssigned && isPositionMatch && (
                                       <div className="absolute -top-1.5 -right-1.5 z-[60] bg-green-500 text-white text-[6px] md:text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg border border-white/10">
                                          FIT
                                       </div>
                                    )}
                                 </motion.div>
                              );
                           })}
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {activeTab === 'stats' && (
            <motion.div 
              key="stats"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="max-w-7xl mx-auto space-y-6 px-3"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <h2 className="text-xl md:text-4xl font-black uppercase italic tracking-tighter">Stats</h2>
                <div className="flex bg-zinc-900 border border-white/5 rounded-2xl p-1 shrink-0">
                   {(['League', 'Highs', 'Team'] as const).map(sub => (
                     <button 
                       key={sub} 
                       onClick={() => setStatsSubTab(sub)}
                       className={`px-4 md:px-8 py-2 rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${statsSubTab === sub ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                     >
                       {sub === 'Highs' ? 'Season Highs' : sub === 'Team' ? 'Team Stats' : 'League Leaders'}
                     </button>
                   ))}
                </div>
              </div>

              {statsSubTab === 'League' && (
                <div className="space-y-6">
                  <div className="flex gap-2">
                    {['Points', 'Rebounds', 'Assists'].map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => setActiveStatsCat(cat as any)}
                        className={`px-6 py-2 border rounded-xl text-[8px] font-black uppercase tracking-widest transition-colors ${activeStatsCat === cat ? 'bg-white text-black border-white' : 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-white'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
              <div className="bg-zinc-900 border border-white/5 rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto max-h-[500px] md:max-h-[600px] overflow-y-auto no-scrollbar md:custom-scrollbar">
                  <table className="w-full text-left min-w-[320px] md:min-w-[600px]">
                    <thead className="bg-white/5 border-b border-white/5 sticky top-0 z-10 backdrop-blur-md">
                      <tr className="text-[7px] md:text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                        <th className="px-3 md:px-8 py-3 md:py-6">Player</th>
                        <th className="px-3 md:px-8 py-3 md:py-6 hidden md:table-cell">Team</th>
                        <th className="px-3 md:px-8 py-3 md:py-6 text-center tabular-nums">GP</th>
                        <th className={`px-3 md:px-8 py-3 md:py-6 text-center tabular-nums ${activeStatsCat === 'Points' ? 'text-amber-500' : ''}`}>PPG</th>
                        <th className={`px-2 md:px-8 py-3 md:py-6 text-center tabular-nums ${activeStatsCat === 'Rebounds' ? 'text-amber-500' : ''}`}>RPG</th>
                        <th className={`px-2 md:px-8 py-3 md:py-6 text-center tabular-nums ${activeStatsCat === 'Assists' ? 'text-amber-500' : ''}`}>APG</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {(Object.entries(state.stats?.seasonal || {}) as [string, any][])
                        .sort(([, a], [, b]) => {
                          const valA = activeStatsCat === 'Points' ? a.points : activeStatsCat === 'Rebounds' ? a.rebounds : a.assists;
                          const valB = activeStatsCat === 'Points' ? b.points : activeStatsCat === 'Rebounds' ? b.rebounds : b.assists;
                          return (valB / (b.gamesPlayed || 1)) - (valA / (a.gamesPlayed || 1));
                        })
                        .slice(0, 50)
                        .map(([playerId, stats]) => {
                          const card = findCard(playerId);
                          const team = playerTeamMap.get(playerId);
                          if (!card) return null;
                          return (
                            <tr key={playerId} className="hover:bg-white/5 transition-colors group">
                              <td className="px-3 md:px-8 py-2 md:py-4">
                                <div className="flex items-center gap-2 md:gap-4">
                                  <div className="w-7 h-7 md:w-10 md:h-10 bg-zinc-800 rounded-lg md:rounded-xl overflow-hidden p-0.5 md:p-1 border border-white/5">
                                    <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card.nbaId}.png`} className="w-full h-full object-contain" />
                                  </div>
                                  <div className="max-w-[70px] md:max-w-none">
                                    <p className="text-[9px] md:text-xs font-black text-white italic uppercase truncate leading-tight">{card.name.split(' ').pop()}</p>
                                    <p className="text-[6px] md:text-[8px] font-black text-zinc-600 uppercase tracking-widest">{card.position}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 md:px-8 py-2 md:py-4 hidden md:table-cell">
                                {team && (
                                  <div className="flex items-center gap-2">
                                    <img src={getTeamLogo(team.teamId)} className="w-5 h-5 object-contain" />
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase">{team.abbreviation}</span>
                                  </div>
                                )}
                              </td>
                              <td className="px-3 md:px-8 py-2 md:py-4 text-center text-[9px] md:text-xs font-black text-zinc-500 tabular-nums">{stats.gamesPlayed}</td>
                              <td className={`px-3 md:px-8 py-2 md:py-4 text-center text-[10px] md:text-sm font-black italic tabular-nums ${activeStatsCat === 'Points' ? 'text-white' : 'text-zinc-500'}`}>{(stats.points / (stats.gamesPlayed || 1)).toFixed(1)}</td>
                              <td className={`px-2 md:px-8 py-2 md:py-4 text-center text-[10px] md:text-sm font-black italic tabular-nums ${activeStatsCat === 'Rebounds' ? 'text-white' : 'text-zinc-500'}`}>{(stats.rebounds / (stats.gamesPlayed || 1)).toFixed(1)}</td>
                              <td className={`px-2 md:px-8 py-2 md:py-4 text-center text-[10px] md:text-sm font-black italic tabular-nums ${activeStatsCat === 'Assists' ? 'text-white' : 'text-zinc-500'}`}>{(stats.assists / (stats.gamesPlayed || 1)).toFixed(1)}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
                </div>
              )}

              {statsSubTab === 'Highs' && (
                <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] p-8 md:p-12">
                   <div className="space-y-8">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-black shadow-lg">
                           <TrendingUp size={24} />
                        </div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter">Player Season Highs</h3>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userTeam.roster.map(pid => {
                          const card = findCard(pid);
                          const highs = state.seasonHighs[pid];
                          if (!card || !highs) return null;
                          return (
                            <div key={pid} className="bg-black/40 border border-white/5 rounded-3xl p-6 space-y-4">
                               <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                                  <div className="w-12 h-12 bg-zinc-800 rounded-xl p-1 overflow-hidden">
                                     <img src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${card.nbaId}.png`} className="w-full h-full object-contain" />
                                  </div>
                                  <div>
                                     <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{card.position}</p>
                                     <p className="text-lg font-black text-white italic uppercase tracking-tighter">{card.name}</p>
                                  </div>
                               </div>
                               <div className="grid grid-cols-5 gap-2">
                                  {[
                                    { k: 'PTS', v: highs.points },
                                    { k: 'REB', v: highs.rebounds },
                                    { k: 'AST', v: highs.assists },
                                    { k: 'STL', v: highs.steals },
                                    { k: 'BLK', v: highs.blocks }
                                  ].map(h => (
                                    <div key={h.k} className="text-center bg-white/5 rounded-xl py-3 border border-white/5">
                                       <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{h.k}</p>
                                       <p className="text-xl font-black text-white italic">{h.v.value}</p>
                                       <p className="text-[7px] font-bold text-zinc-600 truncate px-1">vs {h.v.rival}</p>
                                    </div>
                                  ))}
                               </div>
                            </div>
                          );
                        })}
                     </div>
                   </div>
                </div>
              )}

              {statsSubTab === 'Team' && (
                <div className="space-y-8">
                   <div className="flex bg-zinc-950 border border-white/10 rounded-2xl p-1 w-fit mx-auto md:mx-0">
                      {(['Current', 'History'] as const).map(t => (
                        <button 
                          key={t}
                          onClick={() => setTeamStatsTab(t)}
                          className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${teamStatsTab === t ? 'bg-amber-500 text-black' : 'text-zinc-500 hover:text-white'}`}
                        >
                          {t === 'Current' ? 'This Season' : 'Franchise History'}
                        </button>
                      ))}
                   </div>

                   {teamStatsTab === 'Current' && (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 space-y-6">
                           <h4 className="text-[10px] font-black uppercase text-amber-500 tracking-widest italic border-b border-white/5 pb-4">Averages</h4>
                           <div className="space-y-4">
                              {(() => {
                                 const seasonalStats = state.stats?.seasonal || {};
                                 const userPlayersSeasonalStats = (Object.entries(seasonalStats) as [string, PlayerStats][])
                                    .filter(([id]) => userTeam.roster.includes(id))
                                    .map(([, s]) => s);
                                 const totalG = Math.max(1, userTeam.wins + userTeam.losses);
                                 
                                 return [
                                    { l: 'Points Per Game', v: (userPlayersSeasonalStats.reduce((acc, curr) => acc + curr.points, 0) / totalG).toFixed(1), color: 'text-white' },
                                    { l: 'Rebounds Per Game', v: (userPlayersSeasonalStats.reduce((acc, curr) => acc + curr.rebounds, 0) / totalG).toFixed(1), color: 'text-zinc-300' },
                                    { l: 'Assists Per Game', v: (userPlayersSeasonalStats.reduce((acc, curr) => acc + curr.assists, 0) / totalG).toFixed(1), color: 'text-zinc-300' },
                                 ].map(s => (
                                    <div key={s.l} className="flex justify-between items-baseline">
                                       <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{s.l}</p>
                                       <p className={`text-3xl font-black italic tracking-tighter ${s.color}`}>{s.v}</p>
                                    </div>
                                 ));
                              })()}
                           </div>
                        </div>

                        <div className="bg-zinc-900 border border-white/5 rounded-3xl p-8 space-y-6">
                           <h4 className="text-[10px] font-black uppercase text-amber-500 tracking-widest italic border-b border-white/5 pb-4">Performance</h4>
                           <div className="space-y-4">
                              <div className="flex justify-between items-baseline">
                                 <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Team Record</p>
                                 <p className="text-3xl font-black italic tracking-tighter text-white">{userTeam.wins}-{userTeam.losses}</p>
                              </div>
                              <div className="flex justify-between items-baseline">
                                 <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Home vs Away</p>
                                 <p className="text-xl font-black italic tracking-tighter text-white">12-4 vs 8-10</p>
                              </div>
                           </div>
                        </div>
                     </div>
                   )}

                   {teamStatsTab === 'History' && (
                     <div className="bg-zinc-900 border border-white/5 rounded-[2.5rem] overflow-hidden">
                        <table className="w-full text-left">
                           <thead className="bg-white/5 border-b border-white/5">
                              <tr className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                                 <th className="px-8 py-6">Season</th>
                                 <th className="px-8 py-6 text-center">Record</th>
                                 <th className="px-8 py-6 text-center">PPG</th>
                                 <th className="px-8 py-6">Awards</th>
                                 <th className="px-8 py-6">Champion</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-white/5">
                              {(state.teamHistory || []).map((h, i) => (
                                <tr key={i} className="hover:bg-white/5 transition-colors">
                                  <td className="px-8 py-6 text-sm font-black text-white italic">{h.season}</td>
                                  <td className="px-8 py-6 text-center text-xs font-bold text-zinc-400">{h.record}</td>
                                  <td className="px-8 py-6 text-center text-sm font-black italic text-zinc-300">{h.ppg}</td>
                                  <td className="px-8 py-6">
                                     <div className="flex flex-wrap gap-1">
                                        {h.awards.map((a, j) => (
                                           <span key={j} className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black border border-amber-500/20 rounded uppercase">{a}</span>
                                        ))}
                                     </div>
                                  </td>
                                  <td className="px-8 py-6 text-xs font-bold text-zinc-500 uppercase">{h.champion}</td>
                                </tr>
                              ))}
                              {(!state.teamHistory || state.teamHistory.length === 0) && (
                                <tr>
                                   <td colSpan={5} className="px-8 py-12 text-center text-zinc-700 text-[10px] font-black uppercase tracking-widest italic">No finished seasons yet.</td>
                                </tr>
                              )}
                           </tbody>
                        </table>
                     </div>
                   )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'draft' && (
            <motion.div 
              key="draft"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto space-y-8"
            >
                {/* DRAFT HEADER */}
                <div className="bg-zinc-950 border border-white/5 rounded-3xl p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/20" />
                   <div className="space-y-2 text-center md:text-left relative z-10">
                      <div className="flex items-center justify-center md:justify-start gap-4 flex-wrap">
                         <span className="px-3 py-1 bg-amber-500 text-black text-[10px] font-black rounded-lg uppercase italic shadow-lg">Round {draftState.pick <= 30 ? 1 : 2}</span>
                         <span className="px-3 py-1 bg-zinc-900 border border-white/10 text-zinc-400 text-[10px] font-black rounded-lg uppercase italic italic">Pick {draftState.pick} of 60</span>
                      </div>
                      <h2 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter text-white">The Draft</h2>
                   </div>
                   <div className="flex items-center gap-4 relative z-10 shrink-0">
                      {draftState.isPaused && draftState.pick <= 60 ? (
                         <button 
                           onClick={() => setDraftState(prev => ({ ...prev, isPaused: false }))}
                           className="px-12 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-amber-400 transition-all active:scale-95 flex items-center gap-3"
                         >
                           <Play size={16} fill="currentColor" />
                           {draftState.pick === 1 ? 'Start Selection' : 'Resume'}
                         </button>
                      ) : draftState.pick > 60 ? (
                         <button 
                           onClick={() => {
                              const newState = advanceSeason(state);
                              setState(newState);
                              stateService.save(newState);
                              setActiveTab('hub');
                              notifySuccess("Draft completed! Welcome to the new season.");
                           }}
                           className="px-12 py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-emerald-400 transition-all active:scale-95"
                         >
                           Advance Season
                         </button>
                      ) : (
                         <div className="flex flex-col items-end gap-2 pr-4">
                            <span className="text-[10px] font-black text-amber-500 uppercase animate-pulse italic tracking-widest">LIVE TRANSIT</span>
                            <div className="w-48 h-1.5 bg-zinc-900 rounded-full overflow-hidden">
                               <motion.div 
                                 initial={{ width: "0%" }}
                                 animate={{ width: "100%" }}
                                 transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                 className="h-full bg-amber-500"
                               />
                            </div>
                         </div>
                      )}
                   </div>
                 </div>
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 pb-24 px-2 md:px-0">
                   {/* LEFT PANEL: PROSPECTS */}
                   <div className="lg:col-span-12 xl:col-span-8 space-y-4 md:space-y-6">
                      <div className="flex items-center justify-between border-b border-white/5 pb-4">
                         <h3 className="text-lg md:text-xl font-black italic uppercase tracking-tighter text-zinc-100 flex items-center gap-3">
                            <Users size={20} className="text-amber-500" />
                            Draft Pool
                         </h3>
                         <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">60 Total Prospects</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 h-[50vh] xl:h-[650px] overflow-y-auto no-scrollbar pr-2 overscroll-contain">
                         {state.draftPool?.map((card) => {
                            const histEntry = draftState.history.find(h => h.player.id === card.id);
                            const isPicked = !!histEntry;
                            const currentTeamId = draftState.order[(draftState.pick - 1) % 30];
                            const isUserTurn = currentTeamId === state.userTeamId;

                            return (
                               <motion.div 
                                 layout
                                 key={card.id} 
                                 className={`relative transition-all duration-500 ${isPicked ? 'opacity-20 pointer-events-none' : 'hover:translate-x-1 cursor-pointer'}`}
                                 onClick={() => !isPicked && setViewingProspectId(card.id)}
                               >
                                  <div className={`bg-zinc-900 border ${isUserTurn && !isPicked ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_50px_rgba(245,158,11,0.1)]' : 'border-white/5'} rounded-2xl md:rounded-[2.5rem] p-3 md:p-5 flex gap-3 md:gap-5 relative overflow-hidden group`}>
                                     {isUserTurn && !isPicked && (
                                        <motion.div 
                                          animate={{ scale: [1, 1.1, 1], opacity: [1, 0.7, 1] }}
                                          transition={{ duration: 2, repeat: Infinity }}
                                          className="absolute top-0 right-0 p-4"
                                        >
                                           <Sparkles size={20} className="text-amber-400" />
                                        </motion.div>
                                     )}
                                     <div className="w-20 md:w-28 shrink-0 shadow-2xl transition-all group-hover:scale-105">
                                        <CardItem card={card} mode="mini" isOwned={false} />
                                     </div>
                                     <div className="flex-1 flex flex-col justify-between py-1 md:py-2">
                                        <div className="space-y-0.5 md:space-y-1">
                                           <div className="flex items-center gap-2">
                                              <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-500 text-[6px] md:text-[8px] font-black rounded uppercase tracking-widest">{card.position}</span>
                                              <p className="text-[6px] md:text-[8px] font-black text-amber-500/50 uppercase tracking-[0.2em]">{card.stats.ovr >= 80 ? 'Elite' : 'Developing'}</p>
                                           </div>
                                           <h4 className="text-xs md:text-xl font-black text-white italic uppercase truncate tracking-tight">{card.name}</h4>
                                           <div className="flex items-end gap-1">
                                              <p className="text-xl md:text-4xl font-black text-amber-500 italic leading-none">{card.stats.ovr}</p>
                                              <p className="text-[6px] md:text-[10px] font-black text-zinc-800 uppercase not-italic mb-0.5 md:mb-1">OVR</p>
                                           </div>
                                        </div>
                                        
                                        {isPicked && (
                                           <div className="flex items-center gap-1.5 md:gap-2 text-[8px] md:text-[10px] font-black text-zinc-700 uppercase italic mt-2 md:mt-4 border-t border-white/5 pt-2 md:pt-3">
                                              <div className="w-4 h-4 md:w-5 md:h-5 bg-black rounded-md md:rounded-lg p-0.5 md:p-1 border border-white/5 grayscale">
                                                 <img src={getTeamLogo(histEntry.teamId)} className="w-full h-full object-contain" />
                                              </div>
                                              Picked #{histEntry.pick}
                                           </div>
                                        )}
                                        {isUserTurn && !isPicked && (
                                           <div className="mt-2 md:mt-4 pt-2 md:pt-3 border-t border-amber-500/20">
                                              <span className="text-[8px] md:text-[10px] font-black text-amber-500 uppercase italic">Your Pick is active</span>
                                           </div>
                                        )}
                                     </div>
                                  </div>
                               </motion.div>
                            );
                         })}
                      </div>
                   </div>

                   {/* RIGHT PANEL: ORDER & LOGS */}
                   <div className="lg:col-span-12 xl:col-span-4 space-y-6">
                      <div className="bg-zinc-950 border border-white/5 rounded-2xl md:rounded-[2.5rem] overflow-hidden flex flex-col h-[40vh] xl:h-[700px] shadow-2xl">
                         <div className="p-4 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/2">
                            <h3 className="text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] font-mono">Operations Board</h3>
                            <div className="flex gap-1">
                               <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                            </div>
                         </div>

                         <div className="flex-1 overflow-y-auto no-scrollbar p-4 md:p-6 space-y-6 md:space-y-8">
                            {/* CURRENT & NEXT PICKS */}
                            <div className="space-y-4">
                               <p className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.4em] ml-2">Live Queue</p>
                               <div className="grid grid-cols-2 xl:grid-cols-1 gap-2 md:gap-3">
                                  {Array.from({ length: 6 }).map((_, i) => {
                                     const pickNum = draftState.pick + i;
                                     if (pickNum > 60) return null;
                                     const pickInRound = ((pickNum - 1) % 30) + 1;
                                     const teamId = draftState.order[pickInRound - 1];
                                     if (!teamId) return null;
                                     const team = state.teams[teamId];
                                     if (!team) return null;
                                     const isUser = teamId === state.userTeamId;

                                     return (
                                        <div key={`up-next-${pickNum}`} className={`p-4 rounded-3xl flex items-center justify-between border transition-all ${i === 0 ? 'bg-amber-500 border-transparent shadow-[0_0_40px_rgba(245,158,11,0.2)]' : isUser ? 'bg-amber-500/10 border-amber-500/20' : 'bg-black/40 border-white/5 opacity-40'} ${i > 2 ? 'hidden xl:flex' : ''}`}>
                                           <div className="flex items-center gap-4">
                                              <span className={`w-8 text-[11px] font-black italic ${i === 0 ? 'text-black' : 'text-zinc-700'}`}>#{pickNum}</span>
                                              <div className={`w-8 h-8 rounded-xl p-1.5 border ${i === 0 ? 'bg-white border-black/10' : 'bg-zinc-900 border-white/5'}`}>
                                                 <img src={getTeamLogo(teamId)} className="w-full h-full object-contain" />
                                              </div>
                                              <p className={`text-[10px] font-black uppercase italic ${i === 0 ? 'text-black' : isUser ? 'text-amber-500' : 'text-white'}`}>{team.name}</p>
                                           </div>
                                           {i === 0 && !draftState.isPaused && (
                                              <div className="w-2 h-2 bg-black rounded-full animate-ping" />
                                           )}
                                        </div>
                                     );
                                  })}
                               </div>
                            </div>

                            {/* DRAFT HISTORY */}
                            <div className="space-y-4">
                               <div className="flex items-center justify-between ml-2">
                                  <p className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.3em] italic">Pick Ledger</p>
                                  <p className="text-[8px] font-bold text-zinc-800 uppercase">{draftState.history.length}</p>
                               </div>
                               <div className="space-y-2">
                                  {[...draftState.history].reverse().slice(0, 15).map((h) => (
                                     <div key={`hist-${h.pick}`} className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-2xl group hover:border-zinc-700 transition-all border-dashed">
                                        <div className="flex items-center gap-3">
                                           <span className="w-10 text-[10px] font-black text-zinc-800 italic">#{h.pick}</span>
                                           <div className="w-8 h-8 bg-zinc-950 rounded-xl p-1.5 border border-white/5 grayscale">
                                              <img src={getTeamLogo(h.teamId)} className="w-full h-full object-contain" />
                                           </div>
                                           <div className="flex flex-col">
                                              <p className="text-[11px] font-black text-zinc-100 italic uppercase leading-none">{h.player?.name}</p>
                                              <p className="text-[9px] font-bold text-zinc-700 uppercase mt-1">{state.teams[h.teamId]?.abbreviation} • {h.player?.stats?.ovr} OVR</p>
                                           </div>
                                        </div>
                                     </div>
                                  ))}
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
                      {/* USER PICK OVERLAY */}
                <AnimatePresence>
                   {!draftState.isPaused && draftState.pick <= 60 && draftState.order[(draftState.pick - 1) % 30] === state.userTeamId && draftState.timer <= 30 && (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-12 overflow-y-auto"
                      >
                         <motion.div 
                           initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }}
                           className="bg-zinc-950 border border-amber-500/40 rounded-[3rem] md:rounded-[5rem] p-8 md:p-16 text-center space-y-10 md:space-y-16 max-w-5xl w-full relative overflow-hidden shadow-[0_0_200px_rgba(245,158,11,0.2)] my-auto"
                         >
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/20 blur-[120px] rounded-full" />
                            
                            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                               <div className="space-y-4 text-center md:text-left flex-1">
                                  <h2 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-white leading-none">YOUR TURN</h2>
                                  <p className="text-amber-500 text-[10px] md:text-xs font-black uppercase tracking-[0.6em] italic">Pick #{draftState.pick} • Make your choice</p>
                               </div>

                               <div className="relative flex items-center justify-center shrink-0">
                                  <svg className="w-24 h-24 md:w-40 md:h-40 -rotate-90">
                                     <circle cx="50%" cy="50%" r="46%" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-zinc-900" />
                                     <motion.circle 
                                       cx="50%" cy="50%" r="46%" stroke="currentColor" strokeWidth="4" fill="transparent" 
                                       className="text-amber-500" 
                                       strokeDasharray="100 100"
                                       animate={{ strokeDashoffset: [0, 100] }}
                                       transition={{ duration: 30, ease: "linear" }}
                                     />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                     <span className="text-3xl md:text-6xl font-black italic text-white tabular-nums">{draftState.timer}</span>
                                   </div>
                               </div>
                            </div>

                            <div className="space-y-6 relative z-10 w-full">
                               <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center">Top Recommended Prospects</p>
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  {state.draftPool?.slice(0, 3).map((p) => (
                                     <button 
                                       key={`quick-pick-${p.id}`}
                                       onClick={() => handleUserDraftChoice(p)}
                                       className="group bg-zinc-900/50 border border-white/5 rounded-[2.5rem] p-6 hover:bg-amber-500 transition-all active:scale-95 text-left flex flex-col items-center gap-4 hover:border-transparent"
                                     >
                                        <div className="w-32">
                                           <CardItem card={p} mode="mini" isOwned={false} />
                                        </div>
                                        <div className="text-center space-y-1">
                                           <p className="text-xs font-black text-white italic group-hover:text-black uppercase truncate w-full">{p.name}</p>
                                           <p className="text-[10px] font-bold text-zinc-500 group-hover:text-black/60 uppercase">{p.position} • {p.stats.ovr} OVR</p>
                                        </div>
                                     </button>
                                  ))}
                               </div>
                            </div>
                            
                            <div className="pt-6 relative z-10 flex flex-col md:flex-row items-center justify-center gap-4">
                               <button 
                                 onClick={() => { setDraftState(prev => ({ ...prev, timer: 999 })); setActiveTab('draft'); }} // Closes overlay because of timer > 30 condition
                                 className="w-full md:w-auto px-12 py-5 bg-white/5 text-zinc-400 border border-white/10 rounded-3xl font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-black transition-all"
                               >
                                  Browse Full List
                               </button>
                               <button 
                                 onClick={() => {
                                    const best = [...(state.draftPool || [])].sort((a,b) => b.stats.ovr - a.stats.ovr)[0];
                                    if (best) handleUserDraftChoice(best);
                                 }}
                                 className="w-full md:w-auto px-12 py-5 bg-amber-500 text-black rounded-3xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-amber-400"
                               >
                                  Best Available
                               </button>
                            </div>
                         </motion.div>
                      </motion.div>
                   )}
                </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

                {/* PROSPECT DETAIL MODAL */}
                <AnimatePresence>
                   {viewingProspectId && (
                      <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[1100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6"
                      >
                         {(() => {
                            const card = findCard(viewingProspectId);
                            if (!card) return null;
                            const currentTeamId = draftState.order[(draftState.pick - 1) % 30];
                            const isUserTurn = currentTeamId === state.userTeamId;

                            return (
                               <motion.div 
                                 initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }}
                                 className="w-full max-w-4xl bg-zinc-950 border border-white/5 rounded-[4rem] overflow-hidden relative shadow-2xl flex flex-col md:flex-row h-full max-h-[800px]"
                               >
                                  <button 
                                    onClick={() => setViewingProspectId(null)}
                                    className="absolute top-8 right-8 p-4 bg-white/5 rounded-full text-zinc-500 hover:text-white transition-all z-20"
                                  >
                                     <X size={24} />
                                  </button>

                                  <div className="md:w-1/2 p-12 bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center relative overflow-hidden">
                                     <div className="absolute inset-0 opacity-20">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/20 blur-[120px] rounded-full" />
                                     </div>
                                     <div className="scale-125 relative z-10">
                                        <CardItem card={card} mode="full" isOwned={false} />
                                     </div>
                                  </div>

                                  <div className="md:w-1/2 p-12 space-y-10 flex flex-col justify-center bg-black/40">
                                     <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                           <span className="px-3 py-1 bg-amber-500 text-black text-[10px] font-black rounded-lg uppercase italic">{card.position}</span>
                                           <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Prospect Class</span>
                                        </div>
                                        <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter leading-tight border-b border-white/5 pb-6">{card.name}</h2>
                                     </div>

                                     <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-1">
                                           <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Potential OVR</p>
                                           <p className="text-3xl font-black text-white italic">{card.stats.ovr + 5}+</p>
                                        </div>
                                        <div className="space-y-1">
                                           <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Scouting Grade</p>
                                           <p className="text-3xl font-black text-amber-500 italic">A+</p>
                                        </div>
                                     </div>

                                     <div className="p-8 bg-zinc-900/50 rounded-3xl border border-white/5">
                                        <p className="text-zinc-400 text-sm italic font-medium leading-relaxed">
                                           High upside prospect with generational physical tools.
                                        </p>
                                     </div>

                                     {isUserTurn && (
                                        <button 
                                          onClick={() => {
                                             handleUserDraftChoice(card);
                                             setViewingProspectId(null);
                                          }}
                                          className="w-full py-6 bg-white text-black rounded-3xl font-black uppercase text-xs tracking-[0.3em] hover:bg-amber-400 transition-all active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.1)]"
                                        >
                                           Draft Player
                                        </button>
                                     )}
                                  </div>
                               </motion.div>
                            );
                         })()}
                      </motion.div>
                   )}
                </AnimatePresence>

        {/* MATCH RESULT MODAL */}
        <AnimatePresence>
          {lastGameResult && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-6"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent pointer-events-none" />
              
              <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                className="w-full max-w-4xl bg-zinc-950 border border-white/10 rounded-[2rem] md:rounded-[3rem] overflow-hidden relative flex flex-col max-h-[90dvh] shadow-2xl"
              >
                {/* Header */}
                <div className="p-4 md:p-10 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/40">
                  <div className="space-y-1">
                    <p className="text-[8px] md:text-[10px] font-black text-amber-500 uppercase tracking-[0.6em]">Match Finalized</p>
                    <h2 className="text-2xl md:text-5xl font-black italic uppercase tracking-tighter text-white">Full Box Score</h2>
                  </div>
                  <button 
                    onClick={() => setLastGameResult(null)}
                    className="p-2 md:p-3 bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-10 space-y-8 md:space-y-12">
                  
                  {/* Score Board */}
                  <div className="bg-zinc-900/50 p-6 md:p-10 rounded-[2rem] border border-white/5 relative group">
                    <div className="flex items-center justify-between gap-4 md:gap-8 relative z-10">
                      {/* Away Team (Visitor) */}
                      <div className="flex-1 flex flex-col items-center gap-1.5 md:gap-4 order-1">
                        <div className="w-10 h-10 md:w-24 md:h-24 bg-black rounded-xl md:rounded-3xl p-1.5 md:p-4 border border-white/5 shadow-2xl">
                          <img src={getTeamLogo(lastGameResult.match.awayTeamId)} className="w-full h-full object-contain" />
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] md:text-sm font-black text-zinc-600 uppercase tracking-widest leading-none">{state.teams[lastGameResult.match.awayTeamId].abbreviation}</p>
                        </div>
                      </div>

                      {/* Score Center */}
                      <div className="flex items-center gap-1.5 md:gap-8 order-2 shrink-0">
                        <p className={`text-2xl md:text-7xl font-black italic tabular-nums ${lastGameResult.result.score.away > lastGameResult.result.score.home ? 'text-white' : 'text-zinc-700'}`}>
                          {lastGameResult.result.score.away}
                        </p>
                        <div className="text-[10px] md:text-2xl font-black italic text-zinc-900 shrink-0">VS</div>
                        <p className={`text-2xl md:text-7xl font-black italic tabular-nums ${lastGameResult.result.score.home > lastGameResult.result.score.away ? 'text-white' : 'text-zinc-700'}`}>
                          {lastGameResult.result.score.home}
                        </p>
                      </div>

                      {/* Home Team (Local) */}
                      <div className="flex-1 flex flex-col items-center gap-1.5 md:gap-4 order-3">
                        <div className="w-10 h-10 md:w-24 md:h-24 bg-black rounded-xl md:rounded-3xl p-1.5 md:p-4 border border-white/5 shadow-2xl">
                          <img src={getTeamLogo(lastGameResult.match.homeTeamId)} className="w-full h-full object-contain" />
                        </div>
                        <div className="text-center">
                          <p className="text-[9px] md:text-sm font-black text-zinc-600 uppercase tracking-widest leading-none">{state.teams[lastGameResult.match.homeTeamId].abbreviation}</p>
                        </div>
                      </div>
                    </div>

                    {/* Compact Quarters for Mobile */}
                    {lastGameResult.result.periods && (
                      <div className="mt-4 md:hidden flex justify-center gap-1 overflow-x-auto no-scrollbar">
                        {lastGameResult.result.periods.home.map((_, i) => (
                          <div key={`period-compact-${i}`} className="flex flex-col items-center bg-black/40 border border-white/5 rounded-md p-1.5 min-w-[38px]">
                            <p className="text-[6px] font-black text-zinc-700 uppercase">Q{i+1}</p>
                            <div className="flex gap-1 text-[8px] font-black text-white italic tabular-nums">
                              <span>{lastGameResult.result.periods.away[i]}</span>
                              <span className="text-zinc-800">-</span>
                              <span>{lastGameResult.result.periods.home[i]}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Complete Box Scores */}
                  {['home', 'away'].map((side) => (
                    <div key={side} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <img src={getTeamLogo(lastGameResult.match[side === 'home' ? 'homeTeamId' : 'awayTeamId'])} className="w-6 h-6 object-contain" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">
                          {state.teams[lastGameResult.match[side === 'home' ? 'homeTeamId' : 'awayTeamId']]?.name || 'Unknown Team'} Box Score
                        </h4>
                      </div>
                      <div className="bg-zinc-900 border border-white/5 rounded-xl md:rounded-2xl overflow-x-auto no-scrollbar">
                        <table className="w-full text-left min-w-[320px] md:min-w-[350px] border-collapse">
                          <thead className="bg-white/5 border-b border-white/5">
                            <tr className="text-[7px] md:text-[10px] font-black text-zinc-600 uppercase tracking-[0.1em]">
                              <th className="px-2 md:px-3 py-1.5 md:py-2">PLAYER</th>
                              <th className="px-1 md:px-2 py-1.5 md:py-2 text-center">MIN</th>
                              <th className="px-1 md:px-2 py-1.5 md:py-2 text-center text-white italic">PTS</th>
                              <th className="px-1 md:px-2 py-1.5 md:py-2 text-center">REB</th>
                              <th className="px-1 md:px-2 py-1.5 md:py-2 text-center">AST</th>
                              <th className="hidden md:table-cell px-2 py-2 text-center">STL</th>
                              <th className="hidden md:table-cell px-2 py-2 text-center">BLK</th>
                              <th className="px-1 md:px-2 py-1.5 md:py-2 text-center font-mono">FG%</th>
                              <th className="px-1 md:px-2 py-1.5 md:py-2 text-center">+/-</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {(lastGameResult.result.boxScore[side as keyof typeof lastGameResult.result.boxScore] as any[]).map((p) => {
                               const card = findCard(p.playerId);
                               const fgp = card ? (40 + (card.stats.ovr / 5) + (Math.random() * 5)).toFixed(1) : "45.0";
                               return (
                                <tr key={p.playerId} className="hover:bg-white/5 transition-colors group h-[30px] md:h-[36px]">
                                  <td className="px-2 md:px-3 py-1 font-black text-[9px] md:text-[12px] uppercase italic truncate max-w-[80px] md:max-w-[120px] leading-tight">{p.name.split(' ').pop()}</td>
                                  <td className="px-1 md:px-2 py-1 text-center text-[8px] md:text-[11px] text-zinc-600 tabular-nums">{(p.minutes || 0).toFixed(0)}</td>
                                  <td className="px-1 md:px-2 py-1 text-center text-[9px] md:text-[12px] font-black italic text-white tabular-nums">{p.points}</td>
                                  <td className="px-1 md:px-2 py-1 text-center text-[8px] md:text-[11px] text-zinc-500 tabular-nums">{p.rebounds}</td>
                                  <td className="px-1 md:px-2 py-1 text-center text-[8px] md:text-[11px] text-zinc-500 tabular-nums">{p.assists}</td>
                                  <td className="hidden md:table-cell px-2 py-1 text-center text-[11px] text-zinc-500 tabular-nums">{p.steals || 0}</td>
                                  <td className="hidden md:table-cell px-2 py-1 text-center text-[11px] text-zinc-500 tabular-nums">{p.blocks || 0}</td>
                                  <td className="px-1 md:px-2 py-1 text-center text-[8px] md:text-[11px] text-zinc-700 font-mono tabular-nums">{fgp}%</td>
                                  <td className={`px-1 md:px-2 py-1 text-center text-[8px] md:text-[11px] font-black tabular-nums ${p.plusMinus > 0 ? 'text-green-500/80' : p.plusMinus < 0 ? 'text-red-500/80' : 'text-zinc-800'}`}>{p.plusMinus > 0 ? `+${p.plusMinus}` : p.plusMinus}</td>
                                </tr>
                               );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 md:p-10 border-t border-white/5 bg-black/40 shrink-0">
                  <button 
                    onClick={() => setLastGameResult(null)}
                    className="w-full py-6 bg-white text-black rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-amber-400 transition-all shadow-2xl active:scale-95"
                  >
                    Close & Return to Hub
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerView;
