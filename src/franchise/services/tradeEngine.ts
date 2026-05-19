import { FranchiseState, TeamObject } from '../types';
import { ALL_CARDS } from '../../data/cards';

export interface TradeOffer {
  fromTeamId: string;
  toTeamId: string;
  offeredPlayerIds: string[];
  requestedPlayerIds: string[];
  offeredPickIds?: string[];
  requestedPickIds?: string[];
}

export const tradeEngine = {
  SALARY_CAP: 180000000,
  TRADE_DEADLINE_WEEK: 50, // Matches 82 games schedule better

  // 1 — TRADES INTELIGENTES ENTRE EQUIPOS
  calculateTradeValue(playerId: string, state: FranchiseState): number {
    const card = ALL_CARDS.find(c => c.id === playerId) || state.customCards?.find(c => c.id === playerId) || state.draftPool?.find(c => c.id === playerId);
    const progress = state.playerProgress[playerId];
    const team = Object.values(state.teams).find(t => t.roster.includes(playerId));
    const contract = team?.contracts[playerId];

    if (!card || !progress) return 0;

    const ovr = progress.ovr || card.stats.ovr;
    
    // potential_bonus: bust=0, role_player=5, starter=15, star=30, franchise=50
    const potential = (card.stats as any).draftPotential || 'starter';
    const potBonus = potential === 'franchise' ? 50 : potential === 'star' ? 30 : potential === 'starter' ? 15 : potential === 'role_player' ? 5 : 0;
    
    // age_penalty: age < 25 → 0 | 25-29 → 5 | 30-33 → 15 | > 33 → 30
    let agePenalty = 0;
    if (progress.age >= 34) agePenalty = 30;
    else if (progress.age >= 30) agePenalty = 15;
    else if (progress.age >= 25) agePenalty = 5;

    // salary_penalty: salary > 25M → 10 | salary > 35M → 25
    let salaryPenalty = 0;
    if (contract) {
      if (contract.salary > 35000000) salaryPenalty = 25;
      else if (contract.salary > 25000000) salaryPenalty = 10;
    }

    return (ovr * 2) + potBonus - agePenalty - salaryPenalty;
  },

  // Evaluates a trade proposal
  evaluateUserTrade(state: FranchiseState, offer: TradeOffer): { accepted: boolean; reason: string; fairness: number } {
    const fromTeam = state.teams[offer.fromTeamId];
    const toTeam = state.teams[offer.toTeamId];

    if (!fromTeam || !toTeam) return { accepted: false, reason: 'Invalid teams', fairness: 0 };

    // Salary matching (relaxed for game fun but still exists)
    const getSalary = (ids: string[], team: TeamObject) => ids.reduce((sum, id) => sum + (team.contracts[id]?.salary || 0), 0);
    const incomingSalary = getSalary(offer.requestedPlayerIds, toTeam);
    const outgoingSalary = getSalary(offer.offeredPlayerIds, fromTeam);

    if (fromTeam.payroll - outgoingSalary + incomingSalary > this.SALARY_CAP * 1.1) {
       return { accepted: false, reason: 'This trade would put your team too far over the salary cap.', fairness: 0 };
    }

    const offeredVal = offer.offeredPlayerIds.reduce((sum, id) => sum + this.calculateTradeValue(id, state), 0);
    const requestedVal = offer.requestedPlayerIds.reduce((sum, id) => sum + this.calculateTradeValue(id, state), 0);

    const fairness = offeredVal === 0 ? 0 : offeredVal / Math.max(1, requestedVal);

    // CPU interest modifier based on team needs
    const getPosImportance = (team: TeamObject, playerIds: string[]) => {
       const rosterPosCount: Record<string, number> = {};
       team.roster.forEach(id => {
         const c = ALL_CARDS.find(c => c.id === id) || state.customCards?.find(c => c.id === id);
         if (c) rosterPosCount[c.position] = (rosterPosCount[c.position] || 0) + 1;
       });

       return playerIds.reduce((acc, id) => {
          const c = ALL_CARDS.find(c => c.id === id) || state.customCards?.find(c => c.id === id);
          if (!c) return acc;
          const count = rosterPosCount[c.position] || 0;
          if (count <= 1) return acc * 1.3; // High need
          if (count >= 4) return acc * 0.7; // Low need
          return acc;
       }, 1.0);
    };

    const weightedFairness = fairness * getPosImportance(toTeam, offer.offeredPlayerIds);

    if (weightedFairness >= 0.9) {
      return { accepted: true, reason: 'TRADE ACCEPTED: The front office agrees to the deal!', fairness };
    } else if (weightedFairness >= 0.7) {
      return { accepted: false, reason: 'OFFER DECLINED: The value is close, but we need more to pull the trigger.', fairness };
    } else {
      return { accepted: false, reason: 'OFFER REJECTED: This is an unfair proposal and we are not interested.', fairness };
    }
  },

  // CPU proposes a trade to the user
  generateCPUTradeProposal(state: FranchiseState): TradeOffer | null {
    const userTeam = state.teams[state.userTeamId];
    const cpuTeamIds = Object.keys(state.teams).filter(id => id !== state.userTeamId);
    const cpuId = cpuTeamIds[Math.floor(Math.random() * cpuTeamIds.length)];
    const cpuTeam = state.teams[cpuId];

    if (cpuTeam.roster.length < 8 || userTeam.roster.length < 6) return null;

    // CPU picks one of its players to offer
    const cpuOfferId = cpuTeam.roster[Math.floor(Math.random() * cpuTeam.roster.length)];
    const cpuVal = this.calculateTradeValue(cpuOfferId, state);

    // CPU picks a user player it wants (not the franchise player)
    const userRosterSorted = [...userTeam.roster].sort((a,b) => this.calculateTradeValue(b, state) - this.calculateTradeValue(a, state));
    const franchisePlayerId = userRosterSorted[0];
    const targetableUsers = userTeam.roster.filter(id => id !== franchisePlayerId);
    
    if (targetableUsers.length === 0) return null;
    const userTargetId = targetableUsers[Math.floor(Math.random() * targetableUsers.length)];
    const userVal = this.calculateTradeValue(userTargetId, state);

    // Only propose if CPU's offer is at least 85% of what it's asking for
    if (cpuVal >= userVal * 0.85) {
      return {
        fromTeamId: cpuId,
        toTeamId: state.userTeamId,
        offeredPlayerIds: [cpuOfferId],
        requestedPlayerIds: [userTargetId]
      };
    }

    return null;
  },

  // Simulates logical trades between CPU teams
  processWeeklyCPUTrades(state: FranchiseState): string[] {
    const logs: string[] = [];
    const cpuIds = Object.keys(state.teams);
    
    // Only mid-season (around game 40)
    if (state.currentGameIndex !== 40) return [];

    for (let i = 0; i < 3; i++) {
      const idA = cpuIds[Math.floor(Math.random() * cpuIds.length)];
      const idB = cpuIds[Math.floor(Math.random() * cpuIds.length)];
      if (idA === idB) continue;

      const teamA = state.teams[idA];
      const teamB = state.teams[idB];
      
      const pAId = teamA.roster[Math.floor(Math.random() * teamA.roster.length)];
      const pBId = teamB.roster[Math.floor(Math.random() * teamB.roster.length)];
      
      const valA = this.calculateTradeValue(pAId, state);
      const valB = this.calculateTradeValue(pBId, state);

      if (Math.abs(valA - valB) < 15) {
        const cardA = ALL_CARDS.find(c => c.id === pAId);
        const cardB = ALL_CARDS.find(c => c.id === pBId);
        if (cardA && cardB) {
          this.executeTrade(state, {
            fromTeamId: idA,
            toTeamId: idB,
            offeredPlayerIds: [pAId],
            requestedPlayerIds: [pBId]
          });
          logs.push(`TRADE: ${cardA.name} to ${teamB.abbreviation} for ${cardB.name}`);
        }
      }
    }
    return logs;
  },

  executeTrade(state: FranchiseState, offer: TradeOffer): void {
    const teamA = state.teams[offer.fromTeamId];
    const teamB = state.teams[offer.toTeamId];

    // Swap Roster
    teamA.roster = teamA.roster.filter(id => !offer.offeredPlayerIds.includes(id));
    teamB.roster = teamB.roster.filter(id => !offer.requestedPlayerIds.includes(id));

    teamA.roster.push(...offer.requestedPlayerIds);
    teamB.roster.push(...offer.offeredPlayerIds);

    // Swap Picks
    if (offer.offeredPickIds) {
      offer.offeredPickIds.forEach(id => {
        const pickIdx = teamA.draftPicks.findIndex(p => p.id === id);
        if (pickIdx !== -1) {
          const [pick] = teamA.draftPicks.splice(pickIdx, 1);
          teamB.draftPicks.push(pick);
        }
      });
    }

    if (offer.requestedPickIds) {
      offer.requestedPickIds.forEach(id => {
        const pickIdx = teamB.draftPicks.findIndex(p => p.id === id);
        if (pickIdx !== -1) {
          const [pick] = teamB.draftPicks.splice(pickIdx, 1);
          teamA.draftPicks.push(pick);
        }
      });
    }

    // Update Contracts
    offer.offeredPlayerIds.forEach(id => {
      const contract = teamA.contracts[id];
      teamB.contracts[id] = contract;
      delete teamA.contracts[id];
      teamA.payroll -= contract.salary;
      teamB.payroll += contract.salary;
    });

    offer.requestedPlayerIds.forEach(id => {
      const contract = teamB.contracts[id];
      teamA.contracts[id] = contract;
      delete teamB.contracts[id];
      teamB.payroll -= contract.salary;
      teamA.payroll += contract.salary;
    });

    // Cleanup Lineups (remove moved players)
    [teamA, teamB].forEach(team => {
      const positions = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
      positions.forEach(pos => {
        if (!team.roster.includes(team.lineup[pos] as string)) {
          team.lineup[pos] = null;
        }
      });
      team.lineup.bench = team.lineup.bench.filter(id => team.roster.includes(id));
      
      // Auto-fix if position empty
      this.rebuildTeamLineup(team, state);
    });

    state.tradeHistory.push({
      id: `t_${Date.now()}`,
      week: state.week,
      teamA: offer.fromTeamId,
      teamB: offer.toTeamId,
      playersA: offer.offeredPlayerIds,
      playersB: offer.requestedPlayerIds
    });
  },

  rebuildTeamLineup(team: TeamObject, state?: FranchiseState): void {
    const findLocalCard = (id: string) => ALL_CARDS.find(c => c.id === id) || state?.customCards?.find(c => c.id === id) || state?.draftPool?.find(c => c.id === id);
    const available = team.roster.map(id => findLocalCard(id)).filter(Boolean);
    available.sort((a, b) => b!.stats.ovr - a!.stats.ovr);
    
    const used = new Set<string>();
    const positions = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
    
    positions.forEach(pos => {
        const best = available.find(p => !used.has(p!.id) && p!.position.includes(pos.charAt(0)));
        if (best) {
            team.lineup[pos] = best.id;
            used.add(best.id);
        } else {
            const fallback = available.find(p => !used.has(p!.id));
            if (fallback) {
                team.lineup[pos] = fallback.id;
                used.add(fallback.id);
            }
        }
    });
    
    team.lineup.bench = team.roster.filter(id => !used.has(id)).slice(0, 10);
  }
};
