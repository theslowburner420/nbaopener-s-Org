import { FranchiseMatch, FranchiseState, TeamObject } from '../types';
import { simulationEngine } from './simulationEngine';
import { stateService } from './stateService';
import { tradeEngine } from './tradeEngine';

export const gameService = {
  // Simulates the next available game for the user
  simulateNextUserGame(state: FranchiseState): { result: any, match: FranchiseMatch } | null {
    const nextMatch = state.schedule.find(m => 
      !m.played && (m.homeTeamId === state.userTeamId || m.awayTeamId === state.userTeamId)
    );
    
    if (!nextMatch) return null;

    const homeTeam = state.teams[nextMatch.homeTeamId];
    const awayTeam = state.teams[nextMatch.awayTeamId];
    const result = simulationEngine.simulateMatch(homeTeam, awayTeam, state);
    
    this.updateMatchResult(state, nextMatch.id, result);
    stateService.save(state);
    
    return { result, match: nextMatch };
  },

  // Simulates remaining CPU games and advances time
  advanceWeek(state: FranchiseState): FranchiseState {
    const newState = { ...state };
    
    // 1. Process CPU-to-CPU Trades
    tradeEngine.processWeeklyCPUTrades(newState);

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
    stateService.save(newState);
    return newState;
  },

  updateMatchResult(state: FranchiseState, matchId: string, result: any): void {
    const matchIndex = state.schedule.findIndex(m => m.id === matchId);
    if (matchIndex === -1) return;

    state.schedule[matchIndex].played = true;
    state.schedule[matchIndex].score = result.score;
    state.schedule[matchIndex].winner = result.winnerId;
    state.schedule[matchIndex].boxScore = result.boxScore;

    // Update Team Records
    const homeTeamId = state.schedule[matchIndex].homeTeamId;
    const awayTeamId = state.schedule[matchIndex].awayTeamId;

    if (result.winnerId === homeTeamId) {
      state.teams[homeTeamId].wins += 1;
      state.teams[awayTeamId].losses += 1;
    } else {
      state.teams[awayTeamId].wins += 1;
      state.teams[homeTeamId].losses += 1;
    }

    // Accumulate Statistics
    this.trackStats(state, result.boxScore.home);
    this.trackStats(state, result.boxScore.away);
  },

  trackStats(state: FranchiseState, playerEntries: any[]): void {
    playerEntries.forEach(entry => {
      if (!state.stats.seasonal[entry.playerId]) {
        state.stats.seasonal[entry.playerId] = {
          points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, plusMinus: 0, gamesPlayed: 0, fgPct: 0
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
    });
  }
};
