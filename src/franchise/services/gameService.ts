import { FranchiseMatch, FranchiseState, TeamObject } from '../types';
import { simulationEngine } from './simulationEngine';
import { stateService } from './stateService';
import { tradeEngine } from './tradeEngine';
import { playoffService } from './playoffService';

export const gameService = {
  // Simulates the next available game for the user
  simulateNextUserGame(state: FranchiseState): { result: any, match: FranchiseMatch } | null {
    if (state.phase === 'Playoffs' || state.phase === 'PlayIn') {
      return this.simulateUserPlayoffGame(state);
    }

    const nextMatch = state.schedule.find(m => 
      !m.played && (m.homeTeamId === state.userTeamId || m.awayTeamId === state.userTeamId)
    );
    
    if (!nextMatch) return null;

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

    // End of Season check
    if (state.week >= 82 && state.phase === 'Regular') {
      state.phase = 'Awards';
    }

    stateService.save(state);
    
    return { result, match: nextMatch };
  },

  simulateUserPlayoffGame(state: FranchiseState) {
    const activeSeries = state.playoffSeries.find(s => 
      !s.winnerId && (s.team1Id === state.userTeamId || s.team2Id === state.userTeamId)
    );

    if (!activeSeries) return null;

    const t1 = state.teams[activeSeries.team1Id];
    const t2 = state.teams[activeSeries.team2Id];
    const result = simulationEngine.simulateMatch(t1, t2, state);

    if (result.winnerId === t1.teamId) activeSeries.wins1++;
    else activeSeries.wins2++;

    const targetWins = activeSeries.round === 0 ? 1 : 4;
    if (activeSeries.wins1 === targetWins) activeSeries.winnerId = activeSeries.team1Id;
    if (activeSeries.wins2 === targetWins) activeSeries.winnerId = activeSeries.team2Id;

    // Simulate other series
    playoffService.simulateNextPlayoffStep(state);
    
    // Check if Finals are over to move to Draft
    if (state.championId || state.playoffSeries.find(s => s.round === 4)?.winnerId) {
       state.phase = 'Draft';
    }

    stateService.save(state);

    return { result, match: { id: 'playoff', homeTeamId: activeSeries.team1Id, awayTeamId: activeSeries.team2Id, played: true, gameNumber: 0 } as FranchiseMatch };
  },

  // Simulates remaining CPU games and advances time
  advanceWeek(state: FranchiseState): FranchiseState {
    const newState = { ...state };
    
    if (state.phase === 'Regular') {
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
      const currentRoundMatches = newState.schedule.filter(m => 
        m.gameNumber < state.week + 4 && !m.played
      );

      currentRoundMatches.forEach(match => {
        const homeTeam = newState.teams[match.homeTeamId];
        const awayTeam = newState.teams[match.awayTeamId];
        const result = simulationEngine.simulateMatch(homeTeam, awayTeam, newState);
        this.updateMatchResult(newState, match.id, result);
      });

      newState.week += 4;

      // Check for End of Season
      if (newState.week >= 82) {
        newState.phase = 'Awards';
      }
    } else if (newState.phase !== 'Awards' && newState.phase !== 'Draft') {
      // Advance playoffs if user is not in any series or already finished
      playoffService.simulateNextPlayoffStep(newState);

      // Transition to Draft phase if champion is decided
      if (newState.championId || newState.playoffSeries.find(s => s.round === 4)?.winnerId) {
         newState.phase = 'Draft';
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
  }
};
