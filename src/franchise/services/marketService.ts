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

  draftPlayer(state: FranchiseState, player: any, teamId?: string): { success: boolean; reason: string } {
    const targetTeamId = teamId || state.userTeamId;
    const team = state.teams[targetTeamId];
    if (team.roster.length >= 15) return { success: false, reason: 'Roster is full' };

    // Process Draft: Player can be an ID or a full object
    const cardId = typeof player === 'string' ? player : player.id;
    const card = typeof player === 'object' ? player : (ALL_CARDS.find(c => c.id === cardId) || state.customCards?.find(c => c.id === cardId));
    
    if (!card) return { success: false, reason: 'Card not found' };

    const salary = 1500000; // Fixed rookie salary $1.5M as requested

    // If it's a new card object, add to customCards
    if (typeof player === 'object' && !state.customCards?.find(c => c.id === player.id)) {
      if (!state.customCards) state.customCards = [];
      state.customCards.push(player);
    }

    team.roster.push(cardId);
    team.payroll += salary;
    team.contracts[cardId] = {
      playerId: cardId,
      salary,
      yearsRemaining: 4,
      type: 'Rookie',
      noTradeClause: false,
      injuryStatus: 'Healthy',
      canExtend: true,
      canTrade: true
    };

    // Add to playerProgress
    if (!state.playerProgress[cardId]) {
      state.playerProgress[cardId] = {
        age: 19,
        potential: Math.min(99, card.stats.ovr + Math.floor(Math.random() * 12)),
        form: 1.0,
        ovr: card.stats.ovr
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

  calculateMarketDemand(state: FranchiseState, cardId: string): { salary: number; years: number } {
    const card = ALL_CARDS.find(c => c.id === cardId) || state.customCards?.find(c => c.id === cardId) || state.draftPool?.find(c => c.id === cardId);
    const progress = state.playerProgress[cardId];
    if (!card) return { salary: 5000000, years: 1 };
    
    const ovr = progress?.ovr || card.stats.ovr;
    const age = progress?.age || 25;
    const potential = progress?.potential || ovr;
    
    let baseSalary = 1000000;
    if (ovr >= 95) baseSalary = 50000000;
    else if (ovr >= 90) baseSalary = 40000000;
    else if (ovr >= 85) baseSalary = 25000000;
    else if (ovr >= 80) baseSalary = 12000000;
    else if (ovr >= 75) baseSalary = 6000000;
    else if (ovr >= 70) baseSalary = 2500000;

    // Adjust for potential and age
    if (age < 23 && potential > ovr + 5) baseSalary *= 1.2; // Young potential tax
    if (age > 33) baseSalary *= 0.85; // Veteran discount

    let preferredYears = 1;
    if (ovr > 90) preferredYears = age > 32 ? 2 : 4;
    else if (ovr > 80) preferredYears = age > 32 ? 1 : 3;
    else preferredYears = age < 25 ? 2 : 1;

    return { salary: Math.round(baseSalary), years: preferredYears };
  },

  negotiateContract(state: FranchiseState, cardId: string, offerSalary: number, offerYears: number): { success: boolean; message: string; status: "Active" | "Accepted" | "Rejected"; counterOffer?: { salary: number; years: number } } {
    const card = ALL_CARDS.find(c => c.id === cardId) || state.customCards?.find(c => c.id === cardId) || state.draftPool?.find(c => c.id === cardId);
    const demand = this.calculateMarketDemand(state, cardId);
    const progress = state.playerProgress[cardId];
    const ovr = progress?.ovr || card?.stats.ovr || 70;
    const age = progress?.age || 25;
    
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

    const salaryDiff = (demand.salary - offerSalary) / demand.salary;
    const yearsDiff = demand.years - offerYears;

    // Logic for different player profiles
    // 1. Superstars (OVR 90+)
    if (ovr >= 90) {
      if (salaryDiff > 0.15) {
        neg.status = "Rejected";
        return { success: false, message: "I'm a franchise player. This offer is disrespectful. I'm testing the market.", status: "Rejected" };
      }
      if (yearsDiff > 1 && age < 30) {
        return { success: false, message: "I want long-term commitment. Give me more years.", status: "Active", counterOffer: { salary: demand.salary, years: demand.years } };
      }
    }

    // 2. Veterans (Age 32+)
    if (age >= 32 && offerYears > 2 && ovr < 85) {
      return { success: false, message: "I'm looking for a short-term deal to stay flexible. Fewer years, please.", status: "Active", counterOffer: { salary: demand.salary, years: 1 } };
    }

    // General acceptance criteria
    if (salaryDiff <= 0.05 && Math.abs(yearsDiff) <= 1) {
      neg.status = "Accepted";
      // Determine if it's FA signing or extension
      const userTeam = state.teams[state.userTeamId];
      if (userTeam.roster.includes(cardId)) {
        this.extendContract(state, cardId, offerYears, offerSalary);
      } else {
        // Handle FA Signing logic here or in the caller
        this.completeFASigning(state, cardId, offerSalary, offerYears);
      }
      return { success: true, message: "We have a deal! I'm excited to get to work.", status: "Accepted" };
    }

    // Check rounds limit
    if (neg.rounds >= 3) {
      neg.status = "Rejected";
      return { success: false, message: "We've been through enough rounds. We're too far apart.", status: "Rejected" };
    }

    // Hard rejection for lowball
    if (salaryDiff > 0.4) {
      neg.status = "Rejected";
      return { success: false, message: "This isn't even close. I'm walking away.", status: "Rejected" };
    }

    // Counter Offer
    const counterSalary = Math.round(demand.salary * (1 - (salaryDiff * 0.4)));
    const counterYears = demand.years;

    let msg = "I'm interested, but you'll need to improve the terms. Here is my counter.";
    if (salaryDiff > 0.2) msg = "That's quite low for a player of my caliber. Let's try something closer to this.";
    
    return { 
      success: false, 
      message: msg, 
      status: "Active",
      counterOffer: { salary: counterSalary, years: counterYears }
    };
  },

  completeFASigning(state: FranchiseState, cardId: string, salary: number, years: number): { success: boolean, reason: string } {
    const userTeam = state.teams[state.userTeamId];
    if (userTeam.roster.length >= 15) return { success: false, reason: 'Roster full' };

    userTeam.roster.push(cardId);
    userTeam.payroll += salary;
    userTeam.contracts[cardId] = {
      playerId: cardId,
      salary,
      yearsRemaining: years,
      type: 'Veteran',
      noTradeClause: false,
      injuryStatus: 'Healthy'
    };
    state.freeAgentPool = state.freeAgentPool.filter(id => id !== cardId);
    return { success: true, reason: 'Signed' };
  },

  calculateExtensionCost(state: FranchiseState, cardId: string): number {
    return this.calculateMarketDemand(state, cardId).salary;
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
    const sortedTeams = Object.values(state.teams).sort((a, b) => a.wins - b.wins);
    
    // 3. For Round 1, simulate a "Lottery" for the bottom 14 teams
    if (round === 1) {
       const lotteryTeams = [...sortedTeams.slice(0, 14)];
       const remainingTeams = sortedTeams.slice(14);
       
       // Simple lottery shuffle: give slight edge to worse teams but shuffle top 4
       // We'll just randomly swap some positions in the top 14
       for (let i = 0; i < 4; i++) {
         const j = Math.floor(Math.random() * lotteryTeams.length);
         [lotteryTeams[i], lotteryTeams[j]] = [lotteryTeams[j], lotteryTeams[i]];
       }
       
       const lotteryOrder = [...lotteryTeams, ...remainingTeams];
       return lotteryOrder.map(t => {
          const p = allPicks.find(ap => ap.pick.originalOwnerId === t.teamId);
          return { teamId: p?.ownerId || t.teamId, pick: p?.pick };
       });
    }
    
    // 4. Round 2 or no lottery
    return sortedTeams.map(t => {
      const p = allPicks.find(ap => ap.pick.originalOwnerId === t.teamId);
      return { teamId: p?.ownerId || t.teamId, pick: p?.pick };
    });
  }
};
