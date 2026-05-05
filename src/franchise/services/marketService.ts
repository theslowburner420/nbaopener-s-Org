import { FranchiseState } from '../types';
import { ALL_CARDS } from '../../data/cards';
import { getInitialSalary, generateContract, getContractType } from './rosterService';

export const marketService = {
  // Cap Space: $136.0M (Soft Cap)
  SOFT_CAP: 136000000,

  signFreeAgent(state: FranchiseState, cardId: string): { success: boolean; reason: string } {
    if (!state.freeAgentPool) state.freeAgentPool = [];
    const userTeam = state.teams[state.userTeamId];
    const card = ALL_CARDS.find(c => c.id === cardId) || 
                 state.customCards?.find(c => c.id === cardId) || 
                 state.draftPool?.find(c => c.id === cardId);

    if (!card) return { success: false, reason: 'Card not found' };
    if (!state.freeAgentPool.includes(cardId)) return { success: false, reason: 'Player is not a free agent' };
    if (userTeam.roster.length >= 15) return { success: false, reason: 'Roster is full (15 players max)' };

    const ovr = state.playerProgress[cardId]?.ovr || card.stats.ovr;
    const seasons = 0; // Fresh signing
    const contract = generateContract(cardId, ovr, seasons);

    // Check CAP
    if (userTeam.payroll + contract.salary > this.SOFT_CAP) {
       return { 
         success: false, 
         reason: `Insufficient Cap Space. Salary: $${(contract.salary/1000000).toFixed(1)}M. Available: $${((this.SOFT_CAP - userTeam.payroll)/1000000).toFixed(1)}M` 
       };
    }

    // Process Signing
    userTeam.roster = [...userTeam.roster, cardId];
    userTeam.payroll += contract.salary;
    userTeam.contracts = {
      ...userTeam.contracts,
      [cardId]: contract
    };

    // Remove from pool
    state.freeAgentPool = state.freeAgentPool.filter(id => id !== cardId);

    return { success: true, reason: 'Signed successfully' };
  },

  draftPlayer(state: FranchiseState, player: any, teamId?: string): { success: boolean; reason: string } {
    const targetTeamId = teamId || state.userTeamId;
    const team = state.teams[targetTeamId];
    if (team.roster.length >= 15) return { success: false, reason: 'Roster is full' };

    const cardId = typeof player === 'string' ? player : player.id;
    const card = typeof player === 'object' ? player : (
      ALL_CARDS.find(c => c.id === cardId) || 
      state.customCards?.find(c => c.id === cardId) || 
      state.draftPool?.find(c => c.id === cardId)
    );
    
    if (!card) return { success: false, reason: 'Card not found' };

    if (state.draftPool) {
      state.draftPool = state.draftPool.filter(p => p.id !== cardId);
    }

    // Rookie contract
    const ovr = card.stats.ovr;
    const contract = generateContract(cardId, ovr, 0); 
    contract.contractType = 'rookie';
    contract.yearsRemaining = 4;
    contract.optionType = 'team';
    contract.salary = 1500000 + (ovr > 80 ? 2000000 : 0); // Pick based bonus logic? Simple for now.

    if (typeof player === 'object' && !state.customCards?.find(c => c.id === player.id)) {
      state.customCards = [...(state.customCards || []), player];
    }

    team.roster = [...team.roster, cardId];
    team.payroll += contract.salary;
    team.contracts = {
      ...team.contracts,
      [cardId]: contract
    };

    if (!state.playerProgress[cardId]) {
      state.playerProgress[cardId] = {
        age: Math.floor(Math.random() * 3) + 19,
        potential: Math.min(99, card.stats.ovr + Math.floor(Math.random() * 12)),
        form: 1.0,
        ovr: card.stats.ovr
      };
    }

    return { success: true, reason: 'Drafted successfully' };
  },

  releasePlayer(state: FranchiseState, cardId: string): { success: boolean; reason: string } {
    if (!state.freeAgentPool) state.freeAgentPool = [];
    const userTeam = state.teams[state.userTeamId];
    if (!userTeam.roster.includes(cardId)) return { success: false, reason: 'Player not in roster' };
    if (userTeam.roster.length <= 8) return { success: false, reason: 'Minimum roster size is 8' };

    const contract = userTeam.contracts[cardId];
    userTeam.payroll -= contract?.salary || 0;
    
    userTeam.roster = userTeam.roster.filter(id => id !== cardId);
    delete userTeam.contracts[cardId];
    state.freeAgentPool.push(cardId);

    const positions = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
    positions.forEach(pos => {
      if (userTeam.lineup[pos] === cardId) userTeam.lineup[pos] = null;
    });
    userTeam.lineup.bench = userTeam.lineup.bench.filter(id => id !== cardId);

    return { success: true, reason: 'Released successfully' };
  },

  calculateMarketDemand(state: FranchiseState, cardId: string): { salary: number; years: number } {
    const card = ALL_CARDS.find(c => c.id === cardId) || state.customCards?.find(c => c.id === cardId) || state.draftPool?.find(c => c.id === cardId);
    const progress = state.playerProgress?.[cardId];
    const userTeam = state.userTeamId ? state.teams[state.userTeamId] : null;
    const currentContract = userTeam?.contracts[cardId];
    const seasons = currentContract?.seasonsWithTeam || 0;

    if (!card) return { salary: 5000000, years: 1 };
    
    const ovr = progress?.ovr || card.stats.ovr;
    const age = progress?.age || 25;
    
    const contractType = getContractType(ovr, seasons);
    let baseSalary = getInitialSalary(ovr, contractType);

    // Adjust for potential and age
    if (age < 23 && (progress?.potential || ovr) > ovr + 5) baseSalary *= 1.2; 
    if (age > 33) baseSalary *= 0.85; 

    let preferredYears = 1;
    if (contractType === 'max' || contractType === 'supermax') preferredYears = 4;
    else if (ovr > 80) preferredYears = 3;
    else preferredYears = 1;

    // RULE: Players < 24 demand at least 3-year deals
    if (age < 24 && preferredYears < 3) preferredYears = 3;
    // RULE: Players > 32 never accept more than 2-year deals
    if (age > 32 && preferredYears > 2) preferredYears = 2;

    return { salary: Math.round(baseSalary), years: preferredYears };
  },

  negotiateContract(state: FranchiseState, cardId: string, offerSalary: number, offerYears: number): { success: boolean; message: string; status: "Active" | "Accepted" | "Rejected"; counterOffer?: { salary: number; years: number } } {
    if (!state.negotiations) state.negotiations = {};
    const card = ALL_CARDS.find(c => c.id === cardId) || state.customCards?.find(c => c.id === cardId) || state.draftPool?.find(c => c.id === cardId);
    const demand = this.calculateMarketDemand(state, cardId);
    const progress = state.playerProgress[cardId];
    const ovr = progress?.ovr || card?.stats.ovr || 70;
    const age = progress?.age || 25;
    const userTeam = state.teams[state.userTeamId];
    const seasons = userTeam?.contracts[cardId]?.seasonsWithTeam || 0;
    
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

    // AGE RESTRICTION: Players < 24 demand at least 3 years
    if (age < 24 && offerYears < 3) {
      return { success: false, message: "I'm looking for long-term security. I want at least 3 years.", status: "Active", counterOffer: { salary: demand.salary, years: Math.max(3, demand.years) } };
    }

    // AGE RESTRICTION: Players > 32 never accept more than 2 years
    if (age > 32 && offerYears > 2) {
      return { success: false, message: "At my age, I'd prefer a shorter deal to maintain flexibility. No more than 2 years.", status: "Active", counterOffer: { salary: demand.salary, years: 2 } };
    }

    // Supermax check
    if (getContractType(ovr, seasons) === 'supermax') {
        const supermaxCap = 50000000;
        if (offerSalary < supermaxCap * 0.95) {
            return { success: false, message: "I qualify for a Supermax. I won't settle for less than the max.", status: "Active" };
        }
    }

    if (ovr >= 90) {
      if (salaryDiff > 0.15) {
        neg.status = "Rejected";
        return { success: false, message: "I'm a franchise player. This offer is disrespectful. I'm testing the market.", status: "Rejected" };
      }
      if (yearsDiff > 1 && age < 30) {
        return { success: false, message: "I want long-term commitment. Give me more years.", status: "Active", counterOffer: { salary: demand.salary, years: demand.years } };
      }
    }

    if (age >= 32 && offerYears > 2 && ovr < 85) {
      return { success: false, message: "I'm looking for a short-term deal to stay flexible. Fewer years, please.", status: "Active", counterOffer: { salary: demand.salary, years: 1 } };
    }

    if (salaryDiff <= 0.05 && Math.abs(yearsDiff) <= 1) {
      neg.status = "Accepted";
      if (userTeam.roster.includes(cardId)) {
        this.extendContract(state, cardId, offerYears, offerSalary);
      } else {
        this.completeFASigning(state, cardId, offerSalary, offerYears);
      }
      return { success: true, message: "We have a deal! I'm excited to get to work.", status: "Accepted" };
    }

    if (neg.rounds >= 3) {
      neg.status = "Rejected";
      return { success: false, message: "We've been through enough rounds. We're too far apart.", status: "Rejected" };
    }

    if (salaryDiff > 0.4) {
      neg.status = "Rejected";
      return { success: false, message: "This isn't even close. I'm walking away.", status: "Rejected" };
    }

    const counterSalary = Math.round(demand.salary * (1 - (salaryDiff * 0.4)));
    const counterYears = demand.years;

    return { 
      success: false, 
      message: "I'm interested, but you'll need to improve the terms. Here is my counter.", 
      status: "Active",
      counterOffer: { salary: counterSalary, years: counterYears }
    };
  },

  completeFASigning(state: FranchiseState, cardId: string, salary: number, years: number): { success: boolean, reason: string } {
    const userTeam = state.teams[state.userTeamId];
    if (userTeam.roster.length >= 15) return { success: false, reason: 'Roster full' };

    const ovr = state.playerProgress[cardId]?.ovr || 70;
    const contract = generateContract(cardId, ovr, 0);
    contract.salary = salary;
    contract.yearsRemaining = years;

    userTeam.roster = [...userTeam.roster, cardId];
    userTeam.payroll += salary;
    userTeam.contracts = {
      ...userTeam.contracts,
      [cardId]: contract
    };
    state.freeAgentPool = state.freeAgentPool.filter(id => id !== cardId);
    return { success: true, reason: 'Signed' };
  },

  extendContract(state: FranchiseState, cardId: string, years: number, salary?: number): { success: boolean; reason: string } {
    const userTeam = state.teams[state.userTeamId];
    const contract = userTeam.contracts[cardId];
    if (!contract) return { success: false, reason: 'No contract' };
    
    // Extensions can happen mid-season if canExtend is true
    if (!contract.canExtend) return { success: false, reason: 'Not eligible for extension yet' };

    const cost = salary || this.calculateMarketDemand(state, cardId).salary;
    contract.yearsRemaining += years;
    
    userTeam.payroll -= contract.salary;
    contract.salary = cost;
    userTeam.payroll += cost;
    contract.canExtend = false; // Used its extension slot

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
