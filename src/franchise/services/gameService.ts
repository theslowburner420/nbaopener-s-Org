import { FranchiseMatch, FranchiseState, TeamObject, ContractObject } from '../types';
import { simulationEngine } from './simulationEngine';
import { stateService } from './stateService';
import { tradeEngine } from './tradeEngine';
import { newsService } from './newsService';
import { playoffService } from './playoffService';
import { ALL_CARDS } from '../../data/cards';
import { getInitialSalary, runCPUMidSeasonLogic, calculateAwards, generateDraftPool, advanceSeason } from './rosterService';
import { marketService } from './marketService';

export const gameService = {
  // Simulates the next available game for the user
  simulateNextUserGame(state: FranchiseState): { result: any, match: FranchiseMatch } | null {
    if (state.phase === 'playoffs') {
      return this.simulateUserPlayoffGame(state);
    }

    const nextMatch = state.schedule.find(m => 
      !m.played && (m.homeTeamId === state.userTeamId || m.awayTeamId === state.userTeamId)
    );
    
    if (!nextMatch) return null;

    const currentGameIndex = state.currentGameIndex || 0;
    const totalGames = state.schedule.filter(m => m.homeTeamId === state.userTeamId || m.awayTeamId === state.userTeamId).length;

    console.log('[SEASON PROGRESS]', { currentGameIndex, totalGames, nextMatchGameNumber: nextMatch.gameNumber });

    // Critical 1 Fix: Simulate ALL games with gameNumber <= nextMatch.gameNumber that haven't been played
    const targetGameNumber = nextMatch.gameNumber;
    const leagueMatchesToSimulate = state.schedule.filter(m => 
      !m.played && m.gameNumber <= targetGameNumber && m.id !== nextMatch.id
    );

    leagueMatchesToSimulate.forEach(match => {
      const h = state.teams[match.homeTeamId];
      const a = state.teams[match.awayTeamId];
      const res = simulationEngine.simulateMatch(h, a, state);
      this.updateMatchResult(state, match.id, res);
    });

    const homeTeam = state.teams[nextMatch.homeTeamId];
    const awayTeam = state.teams[nextMatch.awayTeamId];
    const result = simulationEngine.simulateMatch(homeTeam, awayTeam, state);
    
    this.updateMatchResult(state, nextMatch.id, result);

    // Update state week to reflect lead team's progress (user team)
    state.week = Math.max(state.week, targetGameNumber);
    state.currentGameIndex = (state.currentGameIndex || 0) + 1;

    // End of Regular Season check (Game 82 is index 81 before increment, or 82 after increment)
    if ((state.currentGameIndex || 0) >= totalGames || (state.currentGameIndex || 0) >= 82) {
      if (state.phase === 'regular_season') {
        this.endRegularSeason(state);
      }
    }

    // Dynamic News & Events
    if (state.currentGameIndex % 15 === 0) {
      const injuryNotif = newsService.generateInjuryNews(state);
      if (injuryNotif) state.notifications.unshift(injuryNotif);
    }
    
    if (state.currentGameIndex % 20 === 0) {
      const rumorNotif = newsService.generateRumorNews(state);
      if (rumorNotif) state.notifications.unshift(rumorNotif);
    }

    // Trade Proposal Logic
    if (state.currentGameIndex % 4 === 0 && Math.random() < 0.3) {
      const proposal = tradeEngine.generateCPUTradeProposal(state);
      if (proposal) {
        const cpuTeam = state.teams[proposal.fromTeamId];
        const cpuPlayer = ALL_CARDS.find(c => c.id === proposal.offeredPlayerIds[0]) || state.customCards?.find(c => c.id === proposal.offeredPlayerIds[0]);
        const userPlayer = ALL_CARDS.find(c => c.id === proposal.requestedPlayerIds[0]) || state.customCards?.find(c => c.id === proposal.requestedPlayerIds[0]);

        state.notifications.unshift({
          id: `prop-${Date.now()}`,
          type: 'TRADE_PROPOSAL',
          category: 'TRADE',
          message: `🤝 TRADE OFFER: ${cpuTeam.name} wants to trade ${cpuPlayer?.name} for ${userPlayer?.name}`,
          week: state.week,
          season: state.season,
          read: false,
          data: proposal
        });
      }
    }

    stateService.save(state);
    return { result, match: nextMatch };
  },

  endRegularSeason(state: FranchiseState) {
    const previousPhase = state.phase;
    console.log('[FRANCHISE PHASE]', previousPhase, '→', 'season_awards', 
      { currentGameIndex: state.currentGameIndex, wins: state.teams[state.userTeamId].wins, losses: state.teams[state.userTeamId].losses, timestamp: new Date().toISOString() });
    
    // 1. Guardar ovrAtSeasonStart de todos los jugadores del roster para calcular MIP
    Object.values(state.teams).forEach(team => {
      team.roster.forEach(pid => {
        if (!state.playerProgress[pid]) {
          state.playerProgress[pid] = { age: 25, potential: 80, form: 50 };
        }
        const progress = state.playerProgress[pid];
        // If we haven't saved it yet, save current OVR as starting point
        if (progress.ovrAtSeasonStart === undefined) {
           const card = ALL_CARDS.find(c => c.id === pid) || state.customCards?.find(c => c.id === pid) || state.draftPool?.find(c => c.id === pid);
           progress.ovrAtSeasonStart = card?.stats.ovr || 70;
        }
      });
    });

    // 2. Calcular standings finales y preparar bracket
    playoffService.calculateSeasonStandings(state);

    // 3. Calcular premios
    try {
      calculateAwards(state);
    } catch (e) {
      console.error('[AWARDS ERROR] Failed to calculate awards, using fallback', e);
      // Fallback: at least set a basic structure if it failed
      if (!state.awards[state.season]) {
        state.awards[state.season] = { allNba: [] };
      }
    }

    // 4. Marcar fase como awards
    state.phase = 'season_awards';
    
    // 5. Notificación de fin de temporada
    state.notifications.unshift({
      id: `season-end-${state.season}-${Date.now()}`,
      type: 'NEWS',
      message: `🏁 Regular Season complete! Final record: ${state.teams[state.userTeamId].wins}-${state.teams[state.userTeamId].losses}`,
      week: state.week,
      season: state.season,
      read: false
    });

    stateService.save(state);
  },

  simulateUserPlayoffGame(state: FranchiseState) {
    const activeSeries = state.playoffSeries.find(s => 
      !s.winnerId && (s.team1Id === state.userTeamId || s.team2Id === state.userTeamId)
    );

    if (!activeSeries) return null;

    const result = playoffService.simulatePlayoffGame(state, activeSeries);

    if (result.winnerId === activeSeries.team1Id) activeSeries.wins1++;
    else activeSeries.wins2++;

    const targetWins = activeSeries.round === 0 ? 1 : 4;
    if (activeSeries.wins1 === targetWins) activeSeries.winnerId = activeSeries.team1Id;
    if (activeSeries.wins2 === targetWins) activeSeries.winnerId = activeSeries.team2Id;

    // Simulate other series
    playoffService.simulateNextPlayoffStep(state);
    
    // Check if Finals are over to move to Offseason
    if (state.championId || state.playoffSeries.find(s => s.round === 4)?.winnerId) {
       console.log(`[FRANCHISE] Phase transition: playoffs → offseason_start (Finals Finished)`);
       state.phase = 'offseason_start';
    }

    stateService.save(state);

    return { result, match: { id: 'playoff', homeTeamId: activeSeries.team1Id, awayTeamId: activeSeries.team2Id, played: true, gameNumber: activeSeries.wins1 + activeSeries.wins2 } as FranchiseMatch };
  },

  // Simulates remaining CPU games and advances time
  advanceWeek(state: FranchiseState): FranchiseState {
    const newState = { ...state };
    
    if (state.phase === 'regular_season') {
      // 1. Process CPU-to-CPU Trades
      const tradeLogs = tradeEngine.processWeeklyCPUTrades(newState);
      tradeLogs.forEach(log => {
        newState.notifications.unshift({
          id: `notif_${Date.now()}_${Math.random()}`,
          type: 'TRADE',
          message: log,
          week: newState.week,
          season: newState.season,
          read: false
        });
      });

      // 2. Simulate all remaining unplayed matches for the current "cycle" (4 games)
      const userNextGames = newState.schedule.filter(m => 
        !m.played && (m.homeTeamId === newState.userTeamId || m.awayTeamId === newState.userTeamId)
      ).slice(0, 4);

      if (userNextGames.length > 0) {
          const maxGameNum = userNextGames[userNextGames.length - 1].gameNumber;
          const leagueMatches = newState.schedule.filter(m => !m.played && m.gameNumber <= maxGameNum);
          
          leagueMatches.forEach(match => {
            const homeTeam = newState.teams[match.homeTeamId];
            const awayTeam = newState.teams[match.awayTeamId];
            const result = simulationEngine.simulateMatch(homeTeam, awayTeam, newState);
            this.updateMatchResult(newState, match.id, result);
            if (match.homeTeamId === newState.userTeamId || match.awayTeamId === newState.userTeamId) {
                newState.currentGameIndex = (newState.currentGameIndex || 0) + 1;
            }
          });
          newState.week = maxGameNum;
      }

      // Check for End of Season
      if ((newState.currentGameIndex || 0) >= 82) {
        this.endRegularSeason(newState);
      }
    } else if (newState.phase !== 'season_awards' && newState.phase !== 'draft' && newState.phase !== 'free_agency') {
      // Advance playoffs if user is not in any series or already finished
      playoffService.simulateNextPlayoffStep(newState);

      // Transition to offseason_start phase if champion is decided
      if (newState.championId || newState.playoffSeries.find(s => s.round === 4)?.winnerId) {
         console.log(`[FRANCHISE] Phase transition: ${newState.phase} → offseason_start (Champion Decided)`);
         newState.phase = 'offseason_start';
      }
    }

    stateService.save(newState);
    return newState;
  },

  updateMatchResult(state: FranchiseState, matchId: string, result: any): void {
    const matchIndex = state.schedule.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return;

    const match = state.schedule[matchIndex];
    match.played = true;
    match.score = result.score;
    match.winner = result.winnerId;
    match.boxScore = result.boxScore;

    // Update Team Records
    const homeTeamId = match.homeTeamId;
    const awayTeamId = match.awayTeamId;

    if (result.winnerId === homeTeamId) {
      state.teams[homeTeamId].wins += 1;
      state.teams[awayTeamId].losses += 1;
    } else {
      state.teams[awayTeamId].wins += 1;
      state.teams[homeTeamId].losses += 1;
    }

    // Accumulate Statistics and Highs
    const rivalOfHome = state.teams[awayTeamId].abbreviation;
    const rivalOfAway = state.teams[homeTeamId].abbreviation;
    const date = `G${match.gameNumber}`;

    this.trackStats(state, result.boxScore.home, rivalOfHome, date);
    this.trackStats(state, result.boxScore.away, rivalOfAway, date);

    // CPU Roster Management every 41 games (approx mid-season)
    const homeTeamTotal = state.teams[homeTeamId].wins + state.teams[homeTeamId].losses;
    
    // Check if team just crossed the 41 games threshold (or was at it)
    // We check if (total >= 41 && previous_total < 41) 
    // But since we don't store previous_total easily here without more state, 
    // and given games simulate in batches, we'll check if they are in the [41, 44] range 
    // and haven't run logic yet (we could add a flag to team state or just use a simple modulo/check)
    // For simplicity, we trigger it if they hit EXACTLY 41 or 42.
    if (homeTeamTotal === 41 || homeTeamTotal === 42) {
      runCPUMidSeasonLogic(state);
    }
  },

  trackStats(state: FranchiseState, playerEntries: any[], rival: string, date: string): void {
    playerEntries.forEach(entry => {
      if (!state.stats.seasonal[entry.playerId]) {
        state.stats.seasonal[entry.playerId] = {
          points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, plusMinus: 0, gamesPlayed: 0, fgPct: 45
        };
      }
      
      const pStats = state.stats.seasonal[entry.playerId];
      pStats.points += entry.points;
      pStats.rebounds += entry.rebounds;
      pStats.assists += entry.assists;
      pStats.steals += (entry.steals || 0);
      pStats.blocks += (entry.blocks || 0);
      pStats.plusMinus += (entry.plusMinus || 0);
      pStats.gamesPlayed += 1;

      // Track Highs for user players (or all, but user players are priority)
      // Actually tracking for all is safer for Awards logic
      if (!state.seasonHighs[entry.playerId]) {
        state.seasonHighs[entry.playerId] = {
          points: { value: 0, rival: '', date: '' },
          rebounds: { value: 0, rival: '', date: '' },
          assists: { value: 0, rival: '', date: '' },
          steals: { value: 0, rival: '', date: '' },
          blocks: { value: 0, rival: '', date: '' }
        };
      }
      const highs = state.seasonHighs[entry.playerId];
      if (entry.points >= highs.points.value) highs.points = { value: entry.points, rival, date };
      if (entry.rebounds >= highs.rebounds.value) highs.rebounds = { value: entry.rebounds, rival, date };
      if (entry.assists >= highs.assists.value) highs.assists = { value: entry.assists, rival, date };
      if (entry.steals >= highs.steals.value) highs.steals = { value: entry.steals, rival, date };
      if (entry.blocks >= highs.blocks.value) highs.blocks = { value: entry.blocks, rival, date };
    });
  },

  // ============================================================================
  // FINITE STATE MACHINE (FSM) SEASON TRANSITIONS
  // ============================================================================

  // Phase 1: REGULAR_SEASON_COMPLETE
  fsmRegularSeasonComplete(state: FranchiseState): FranchiseState {
    console.log('[FSM PHASE TRANSITION] -> REGULAR_SEASON_COMPLETE');
    this.endRegularSeason(state);
    return state;
  },

  // Phase 2: AWARDS_DISPLAYED
  fsmAwardsDisplayed(state: FranchiseState): FranchiseState {
    const previousPhase = state.phase;
    state.phase = 'playoffs';
    console.log('[FSM PHASE TRANSITION] season_awards -> playoffs');
    stateService.save(state);
    return state;
  },

  // Phase 3: PLAYOFF_ROUND_SIMULATING
  fsmPlayoffRoundSimulated(state: FranchiseState): FranchiseState {
    console.log('[FSM PHASE TRANSITION] Simulation Round in Playoffs');
    if (state.phase === 'playoffs') {
      playoffService.simulateNextRoundOnly(state);
      // Check if candidate for completion
      if (state.championId || state.playoffSeries.find(s => s.round === 4)?.winnerId) {
        state.phase = 'offseason_start';
      }
    }
    stateService.save(state);
    return state;
  },

  // Phase 4: PLAYOFFS_COMPLETE
  fsmPlayoffsComplete(state: FranchiseState): FranchiseState {
    state.phase = 'offseason_start';
    console.log('[FSM PHASE TRANSITION] playoffs -> offseason_start');
    stateService.save(state);
    return state;
  },

  // Phase 5: DRAFT_LOTTERY_START
  fsmDraftLotteryStart(state: FranchiseState): FranchiseState {
    state.phase = 'draft_lottery';
    const order1 = marketService.getDraftOrder(state, state.season, 1);
    state.lotteryPicks = order1.slice(0, 14).map(o => o.teamId);
    console.log('[FSM PHASE TRANSITION] offseason_start -> draft_lottery');
    stateService.save(state);
    return state;
  },

  // Phase 6: DRAFT_START
  fsmDraftStart(state: FranchiseState): FranchiseState {
    state.phase = 'draft';
    state.draftPool = generateDraftPool(state.season);
    console.log('[FSM PHASE TRANSITION] draft_lottery -> draft (Generated 60 rookies)');
    stateService.save(state);
    return state;
  },

  // Phase 7: DRAFT_COMPLETE
  fsmDraftComplete(state: FranchiseState): FranchiseState {
    state.phase = 'free_agency';
    console.log('[FSM PHASE TRANSITION] draft -> free_agency');
    stateService.save(state);
    return state;
  },

  // Phase 8: SEASON_RESET_AND_CALENDAR
  fsmSeasonResetAndCalendar(state: FranchiseState): FranchiseState {
    console.log('[FSM PHASE TRANSITION] new_season -> SEASON_RESET_AND_CALENDAR');
    const finalizedState = advanceSeason(state);
    stateService.save(finalizedState);
    return finalizedState;
  }
};
