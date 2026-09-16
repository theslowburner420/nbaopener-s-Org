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
  TRADE_DEADLINE_WEEK: 50,

  // 1 — TRADES INTELIGENTES: VALOR DE INTERCAMBIO (V_traspaso)
  calculateTradeValue(playerId: string, state: FranchiseState): number {
    const card = ALL_CARDS.find(c => c.id === playerId) || state.customCards?.find(c => c.id === playerId) || state.draftPool?.find(c => c.id === playerId);
    const progress = state.playerProgress[playerId];
    const team = Object.values(state.teams).find(t => t.roster.includes(playerId));
    const contract = team?.contracts[playerId];

    if (!card) return 0;

    const ovr = progress?.ovr || card.stats.ovr;
    const pot = progress?.potential || card.stats.potential || card.stats.ovr;
    const age = progress?.age || card.age || 25;
    const salary = contract?.salary || 1200000;
    const limit = this.SALARY_CAP;

    // E_premium: Exponential premium modifier for star players with OVR >= 84
    const E_premium = ovr >= 84 ? Math.pow(1.22, ovr - 83) * 3 : 0;

    // Exact trade value formula specified
    const V_traspaso = (ovr * 1.4) + ((pot - ovr) * 1.1) + (25 / age) - ((salary / limit) * 20) + E_premium;

    return Math.max(1, V_traspaso);
  },

  // Determines if a team is currently Contender (Equipos Contendientes) or Rebuilding (Equipos en Reconstrucción)
  getTeamStatus(teamId: string, state: FranchiseState): { isContender: boolean, isRebuilding: boolean } {
    const team = state.teams[teamId];
    if (!team) return { isContender: false, isRebuilding: false };
    
    const winPct = (team.wins || 0) / Math.max(1, (team.wins || 0) + (team.losses || 0));
    
    let totalOvr = 0;
    let count = 0;
    team.roster.forEach(pid => {
      const card = ALL_CARDS.find(c => c.id === pid) || state.customCards?.find(c => c.id === pid);
      if (card) {
        const progress = state.playerProgress[pid];
        totalOvr += progress?.ovr || card.stats.ovr;
        count++;
      }
    });
    
    const avgOvr = count > 0 ? totalOvr / count : 75;
    const totalGames = (team.wins || 0) + (team.losses || 0);

    const isContender = avgOvr >= 81 || (totalGames >= 10 && winPct >= 0.54);
    const isRebuilding = avgOvr < 77 || (totalGames >= 10 && winPct < 0.44);

    return { isContender, isRebuilding };
  },

  // Evaluates a trade proposal with need modifiers and an 8% acceptance error margin
  evaluateUserTrade(state: FranchiseState, offer: TradeOffer): { accepted: boolean; reason: string; fairness: number } {
    const fromTeam = state.teams[offer.fromTeamId];
    const toTeam = state.teams[offer.toTeamId]; // This is the CPU team deciding the deal

    if (!fromTeam || !toTeam) return { accepted: false, reason: 'Invalid teams', fairness: 0 };

    // Salary matching constraints
    const getSalary = (ids: string[], team: TeamObject) => ids.reduce((sum, id) => sum + (team.contracts[id]?.salary || 0), 0);
    const incomingSalary = getSalary(offer.requestedPlayerIds, toTeam);
    const outgoingSalary = getSalary(offer.offeredPlayerIds, fromTeam);

    if (fromTeam.payroll - outgoingSalary + incomingSalary > this.SALARY_CAP * 1.12) {
       return { accepted: false, reason: 'This trade would put your team too far over the luxury tax threshold (12% above Salary Cap).', fairness: 0 };
    }

    const { isContender: isCpuContender, isRebuilding: isCpuRebuilding } = this.getTeamStatus(offer.toTeamId, state);

    // Calculate adjusted values of OFFERED assets from CPU's perspective
    let offeredVal = 0;
    offer.offeredPlayerIds.forEach(pid => {
      const card = ALL_CARDS.find(c => c.id === pid) || state.customCards?.find(c => c.id === pid) || state.draftPool?.find(c => c.id === pid);
      const progress = state.playerProgress[pid];
      const age = progress?.age || card?.age || 25;
      const ovr = progress?.ovr || card?.stats?.ovr || 75;
      
      let val = this.calculateTradeValue(pid, state);

      if (isCpuContender) {
        // Contenders value veteran/win-now players (+15%) and discount prospects/young assets (-20%)
        if (ovr >= 82 || age >= 27) {
          val *= 1.15;
        } else {
          val *= 0.80;
        }
      } else if (isCpuRebuilding) {
        // Rebuilding teams value young players (+25%) and discount veteran age-based
        if (age < 24) {
          val *= 1.25;
        } else {
          const ageDiscount = Math.max(0.1, 1.0 - (age - 24) * 0.05);
          val *= ageDiscount;
        }
      }

      offeredVal += val;
    });

    // Pick valuation for offered draft picks
    if (offer.offeredPickIds) {
      offer.offeredPickIds.forEach(pickId => {
        const isFirstRound = pickId.includes('r1') || pickId.includes('round1') || !pickId.includes('round2') && !pickId.includes('r2');
        let pickVal = isFirstRound ? 22 : 8;
        if (isCpuRebuilding) pickVal *= 1.25;
        if (isCpuContender) pickVal *= 0.80;
        offeredVal += pickVal;
      });
    }

    // Calculate adjusted values of REQUESTED assets from CPU's perspective
    let requestedVal = 0;
    offer.requestedPlayerIds.forEach(pid => {
      const card = ALL_CARDS.find(c => c.id === pid) || state.customCards?.find(c => c.id === pid) || state.draftPool?.find(c => c.id === pid);
      const progress = state.playerProgress[pid];
      const age = progress?.age || card?.age || 25;
      const ovr = progress?.ovr || card?.stats?.ovr || 75;

      let val = this.calculateTradeValue(pid, state);

      if (isCpuContender) {
        if (ovr >= 82 || age >= 27) {
          val *= 1.15;
        } else {
          val *= 0.80;
        }
      } else if (isCpuRebuilding) {
        if (age < 24) {
          val *= 1.25;
        } else {
          const ageDiscount = Math.max(0.1, 1.0 - (age - 24) * 0.05);
          val *= ageDiscount;
        }
      }

      requestedVal += val;
    });

    // Pick valuation for requested draft picks
    if (offer.requestedPickIds) {
      offer.requestedPickIds.forEach(pickId => {
        const isFirstRound = pickId.includes('r1') || pickId.includes('round1') || !pickId.includes('round2') && !pickId.includes('r2');
        let pickVal = isFirstRound ? 22 : 8;
        if (isCpuRebuilding) pickVal *= 1.25;
        if (isCpuContender) pickVal *= 0.80;
        requestedVal += pickVal;
      });
    }

    // CPU interest / fairness modifier based on positional roster needs
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
          if (count <= 1) return acc * 1.30; // High positional demand
          if (count >= 4) return acc * 0.70; // High saturation
          return acc;
       }, 1.0);
    };

    const finalOfferedVal = offeredVal * getPosImportance(toTeam, offer.offeredPlayerIds);
    const finalRequestedVal = requestedVal;

    // CPU accepts the trade if the adjusted incoming value is within 8% error margin of outgoing value
    const interestRatio = finalOfferedVal / Math.max(1, finalRequestedVal);
    const fairness = finalOfferedVal / Math.max(1, finalRequestedVal);

    if (interestRatio >= 1.06) {
      return { accepted: true, reason: 'TRADE ACCEPTED: The front office is absolutely thrilled with this proposal!', fairness };
    } else if (interestRatio >= 0.92) {
      return { accepted: true, reason: 'TRADE ACCEPTED: The general manager agrees to the terms and accepts the deal.', fairness };
    } else if (interestRatio >= 0.76) {
      return { accepted: false, reason: 'OFFER DECLINED: The value is close, but we need more assets to pull the trigger.', fairness };
    } else {
      return { accepted: false, reason: 'OFFER REJECTED: This is an entirely unbalanced proposal and we are not interested.', fairness };
    }
  },

  // CPU proposes trades
  generateCPUTradeProposal(state: FranchiseState): TradeOffer | null {
    const userTeam = state.teams[state.userTeamId];
    const cpuTeamIds = Object.keys(state.teams).filter(id => id !== state.userTeamId);
    const cpuId = cpuTeamIds[Math.floor(Math.random() * cpuTeamIds.length)];
    const cpuTeam = state.teams[cpuId];

    if (cpuTeam.roster.length < 8 || userTeam.roster.length < 6) return null;

    // CPU picks one of its rosters as offered asset
    const cpuOfferId = cpuTeam.roster[Math.floor(Math.random() * cpuTeam.roster.length)];
    const cpuVal = this.calculateTradeValue(cpuOfferId, state);

    // CPU picks a user roster asset (excluding top star)
    const userRosterSorted = [...userTeam.roster].sort((a,b) => this.calculateTradeValue(b, state) - this.calculateTradeValue(a, state));
    const franchisePlayerId = userRosterSorted[0];
    const targetableUsers = userTeam.roster.filter(id => id !== franchisePlayerId);
    
    if (targetableUsers.length === 0) return null;
    const userTargetId = targetableUsers[Math.floor(Math.random() * targetableUsers.length)];
    const userVal = this.calculateTradeValue(userTargetId, state);

    // CPU trade proposals are generated if values are reasonably close within 14%
    if (cpuVal >= userVal * 0.86) {
      return {
        fromTeamId: cpuId,
        toTeamId: state.userTeamId,
        offeredPlayerIds: [cpuOfferId],
        requestedPlayerIds: [userTargetId]
      };
    }

    return null;
  },

  processWeeklyCPUTrades(state: FranchiseState): string[] {
    const logs: string[] = [];
    const cpuIds = Object.keys(state.teams);
    
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

      if (Math.abs(valA - valB) < 18) {
        const cardA = ALL_CARDS.find(c => c.id === pAId);
        const cardB = ALL_CARDS.find(c => c.id === pBId);
        if (cardA && cardB) {
          this.executeTrade(state, {
            fromTeamId: idA,
            toTeamId: idB,
            offeredPlayerIds: [pAId],
            requestedPlayerIds: [pBId]
          });
          logs.push(`TRADE: ${cardA.name} of ${teamA.abbreviation} was traded to ${teamB.abbreviation} in exchange for ${cardB.name}`);
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
      if (contract) {
        teamB.contracts[id] = contract;
        delete teamA.contracts[id];
        teamA.payroll -= contract.salary;
        teamB.payroll += contract.salary;
      }
    });

    offer.requestedPlayerIds.forEach(id => {
      const contract = teamB.contracts[id];
      if (contract) {
        teamA.contracts[id] = contract;
        delete teamB.contracts[id];
        teamB.payroll -= contract.salary;
        teamA.payroll += contract.salary;
      }
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
