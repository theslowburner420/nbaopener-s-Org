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

  draftPlayer(state: FranchiseState, player: any): { success: boolean; reason: string } {
    const userTeam = state.teams[state.userTeamId];
    if (userTeam.roster.length >= 15) return { success: false, reason: 'Roster is full' };

    // Process Draft: Player can be an ID or a full object
    const cardId = typeof player === 'string' ? player : player.id;
    const card = typeof player === 'object' ? player : (ALL_CARDS.find(c => c.id === cardId) || state.customCards?.find(c => c.id === cardId));
    
    if (!card) return { success: false, reason: 'Card not found' };

    const salary = 5000000; // Fixed rookie salary $5M

    // If it's a new card object, add to customCards
    if (typeof player === 'object' && !state.customCards?.find(c => c.id === player.id)) {
      if (!state.customCards) state.customCards = [];
      state.customCards.push(player);
    }

    userTeam.roster.push(cardId);
    userTeam.payroll += salary;
    userTeam.contracts[cardId] = {
      playerId: cardId,
      salary,
      yearsRemaining: 4,
      type: 'Rookie',
      noTradeClause: false,
      injuryStatus: 'Healthy'
    };

    // Add to playerProgress
    if (!state.playerProgress[cardId]) {
      state.playerProgress[cardId] = {
        age: 19,
        potential: Math.min(99, card.stats.ovr + Math.floor(Math.random() * 12)),
        form: 1.0
      };
    }

    return { success: true, reason: 'Drafted successfully' };
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
  },

  calculateExtensionCost(state: FranchiseState, cardId: string): number {
    const card = ALL_CARDS.find(c => c.id === cardId) || state.customCards?.find(c => c.id === cardId);
    const progress = state.playerProgress[cardId];
    if (!card) return 5000000;
    
    const ovr = (progress as any)?.ovr || card.stats.ovr;
    if (ovr >= 95) return 55000000;
    if (ovr >= 90) return 45000000;
    if (ovr >= 85) return 30000000;
    if (ovr >= 80) return 15000000;
    if (ovr >= 75) return 8000000;
    return 3000000;
  },

  negotiateContract(state: FranchiseState, cardId: string, offerSalary: number, offerYears: number): { success: boolean; message: string; status: "Active" | "Accepted" | "Rejected"; counterOffer?: number } {
    const demand = this.calculateExtensionCost(state, cardId);
    let neg = state.negotiations[cardId];
    
    if (!neg) {
      neg = { rounds: 0, lastOfferSalary: 0, lastOfferYears: 0, status: "Active" };
      state.negotiations[cardId] = neg;
    }

    if (neg.status !== "Active") {
      return { success: neg.status === "Accepted", message: "Negotiation already finished.", status: neg.status };
    }

    neg.rounds++;
    neg.lastOfferSalary = offerSalary;
    neg.lastOfferYears = offerYears;

    const diffPercent = (demand - offerSalary) / demand;

    // Condition: If salary offered is 20% inferior to demand, reject directly
    if (diffPercent > 0.20) {
      neg.status = "Rejected";
      return { success: false, message: "Offer too low. The player and his agent have left the table.", status: "Rejected" };
    }

    // Condition: If is within 10%, accept
    if (diffPercent <= 0.10) {
      neg.status = "Accepted";
      this.extendContract(state, cardId, offerYears, offerSalary);
      return { success: true, message: "Deal reached! Extension signed.", status: "Accepted" };
    }

    // Condition: Between 10-20% hace contraoferta intermedia
    if (neg.rounds >= 3) {
      neg.status = "Rejected";
      return { success: false, message: "Maximum rounds reached. Negotiation failed.", status: "Rejected" };
    }

    const counterSalary = Math.round((demand + offerSalary) / 2);
    return { 
      success: false, 
      message: `The player is interested but wants more. He makes a counter-offer.`, 
      status: "Active",
      counterOffer: counterSalary
    };
  },

  extendContract(state: FranchiseState, cardId: string, years: number, salary?: number): { success: boolean; reason: string } {
    const userTeam = state.teams[state.userTeamId];
    const contract = userTeam.contracts[cardId];
    if (!contract) return { success: false, reason: 'No contract' };
    if (contract.yearsRemaining > 1) return { success: false, reason: 'Extensions only for last year' };

    const cost = salary || this.calculateExtensionCost(state, cardId);
    contract.yearsRemaining += years;
    
    userTeam.payroll -= contract.salary;
    contract.salary = cost;
    userTeam.payroll += cost;

    return { success: true, reason: 'Extension signed' };
  },

  getDraftOrder(state: FranchiseState, year: number, round: number): { teamId: string, pick: any }[] {
    // 1. Get all picks for that year/round from all teams
    const allPicks: { ownerId: string, pick: any }[] = [];
    Object.values(state.teams).forEach(team => {
      team.draftPicks.forEach(p => {
        if (p.year === year && p.round === round) {
          allPicks.push({ ownerId: team.teamId, pick: p });
        }
      });
    });

    // 2. Sort teams by wins (worst record first)
    const teamsByRecord = Object.values(state.teams).sort((a, b) => a.wins - b.wins);
    
    // 3. Map the picks to the sorted teams based on originalOwnerId
    // If a pick's originalOwner was the worst team, it goes first.
    return teamsByRecord.map(t => {
      const p = allPicks.find(ap => ap.pick.originalOwnerId === t.teamId);
      return { teamId: p?.ownerId || t.teamId, pick: p?.pick };
    });
  }
};
