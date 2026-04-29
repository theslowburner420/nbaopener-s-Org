import { FranchiseState } from '../types';
import { ALL_CARDS } from '../../data/cards';
import { getInitialSalary } from './rosterService';

export const marketService = {
  // Cap Space: $136.0M (Soft Cap)
  SOFT_CAP: 136000000,

  signFreeAgent(state: FranchiseState, cardId: string): { success: boolean; reason: string } {
    const userTeam = state.teams[state.userTeamId];
    const card = ALL_CARDS.find(c => c.id === cardId);

    if (!card) return { success: false, reason: 'Card not found' };
    if (!state.freeAgentPool.includes(cardId)) return { success: false, reason: 'Player is not a free agent' };
    if (userTeam.roster.length >= 15) return { success: false, reason: 'Roster is full (15 players max)' };

    const salary = getInitialSalary(card);

    // Check CAP
    if (userTeam.payroll + salary > this.SOFT_CAP) {
       return { 
         success: false, 
         reason: `Insufficient Cap Space. Salary: $${(salary/1000000).toFixed(1)}M. Available: $${((this.SOFT_CAP - userTeam.payroll)/1000000).toFixed(1)}M` 
       };
    }

    // Process Signing
    userTeam.roster.push(cardId);
    userTeam.payroll += salary;
    userTeam.contracts[cardId] = {
      playerId: cardId,
      salary,
      yearsRemaining: 1,
      type: 'Veteran',
      noTradeClause: false,
      injuryStatus: 'Healthy'
    };

    // Remove from pool
    state.freeAgentPool = state.freeAgentPool.filter(id => id !== cardId);

    return { success: true, reason: 'Signed successfully' };
  },

  releasePlayer(state: FranchiseState, cardId: string): { success: boolean; reason: string } {
    const userTeam = state.teams[state.userTeamId];
    if (!userTeam.roster.includes(cardId)) return { success: false, reason: 'Player not in roster' };
    if (userTeam.roster.length <= 8) return { success: false, reason: 'Minimum roster size is 8' };

    const contract = userTeam.contracts[cardId];
    userTeam.payroll -= contract?.salary || 0;
    
    userTeam.roster = userTeam.roster.filter(id => id !== cardId);
    delete userTeam.contracts[cardId];
    state.freeAgentPool.push(cardId);

    // Clean lineup
    const positions = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
    positions.forEach(pos => {
      if (userTeam.lineup[pos] === cardId) userTeam.lineup[pos] = null;
    });
    userTeam.lineup.bench = userTeam.lineup.bench.filter(id => id !== cardId);

    return { success: true, reason: 'Released successfully' };
  }
};
