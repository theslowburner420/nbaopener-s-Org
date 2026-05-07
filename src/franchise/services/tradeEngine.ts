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
  SALARY_CAP: 136000000,
  TRADE_DEADLINE_WEEK: 18,

  // Evaluates a trade proposal by the user
  evaluateUserTrade(state: FranchiseState, offer: TradeOffer): { accepted: boolean; reason: string } {
    if (state.phase !== 'regular_season') {
      return { accepted: false, reason: 'Trades can only be made during the Regular Season.' };
    }

    if (state.week > this.TRADE_DEADLINE_WEEK) {
      return { accepted: false, reason: 'The trade deadline has passed. No more trades allowed this season.' };
    }

    const fromTeam = state.teams[offer.fromTeamId];
    const toTeam = state.teams[offer.toTeamId];

    if (!fromTeam || !toTeam) return { accepted: false, reason: 'Invalid teams' };

    // SALARY MATCHING LOGIC (NBA Style)
    const getSalary = (ids: string[], team: TeamObject) => ids.reduce((sum, id) => {
      const contract = team.contracts[id];
      return sum + (contract?.salary || 0);
    }, 0);

    const incomingSalary = getSalary(offer.requestedPlayerIds, toTeam);
    const outgoingSalary = getSalary(offer.offeredPlayerIds, fromTeam);

    // If team is over cap, incoming salary must be within 125% + $100k of outgoing
    if (fromTeam.payroll > this.SALARY_CAP) {
       const limit = outgoingSalary * 1.25 + 100000;
       if (incomingSalary > limit) {
          return { accepted: false, reason: `Salary mismatch. Sending $${(outgoingSalary/1e6).toFixed(1)}M but taking back $${(incomingSalary/1e6).toFixed(1)}M. (Over cap trade limit: $${(limit/1e6).toFixed(1)}M)` };
       }
    }

    // Player Value Calculation: OVR * years_contract * age_factor
    const getPlayerVal = (ids: string[], team: TeamObject) => ids.reduce((sum, id) => {
      const card = ALL_CARDS.find(c => c.id === id) || state.customCards?.find(c => c.id === id);
      const contract = team.contracts[id];
      const progress = state.playerProgress[id] || { age: 25, potential: 80 };
      
      if (!card || !contract) return sum;

      // Age factor: 20 -> 1.5, 25 -> 1.2, 30 -> 1.0, 35 -> 0.8
      let ageFactor = 1.0;
      if (progress.age <= 22) ageFactor = 1.5;
      else if (progress.age <= 26) ageFactor = 1.3;
      else if (progress.age <= 30) ageFactor = 1.1;
      else if (progress.age <= 34) ageFactor = 0.9;
      else ageFactor = 0.7;

      // Potential bonus for young players
      const potentialBonus = (progress.age < 25) ? (progress.potential - card.stats.ovr) * 2 : 0;

      const baseVal = (card.stats.ovr + potentialBonus) * contract.yearsRemaining * ageFactor;
      return sum + baseVal;
    }, 0);

    // Pick Value Calculation
    const getPickVal = (team: TeamObject, pickIds: string[] = []) => {
      const winPct = team.wins / Math.max(1, team.wins + team.losses);
      const isRebuilding = winPct < 0.4 || team.wins + team.losses < 10; // Value picks more early on or if losing
      
      return pickIds.reduce((sum, id) => {
         const pick = team.draftPicks.find(p => p.id === id);
         if (!pick) return sum;
         
         let val = pick.round === 1 ? 150 : 60;
         if (isRebuilding) val *= 1.5; // Rebuilding teams value picks 50% more
         
         return sum + val;
      }, 0);
    };

    const offeredVal = getPlayerVal(offer.offeredPlayerIds, fromTeam) + getPickVal(fromTeam, offer.offeredPickIds);
    const requestedVal = getPlayerVal(offer.requestedPlayerIds, toTeam) + getPickVal(toTeam, offer.requestedPickIds);

    if (offeredVal === 0 && requestedVal === 0) return { accepted: false, reason: 'Empty trade' };

    // TEAM INTEREST MODIFIER
    // Evaluate if the NPC team actually needs what's offered
    const npcTeamWeight = (team: TeamObject, playerIds: string[]) => {
       const findLocalCard = (id: string) => ALL_CARDS.find(c => c.id === id) || state.customCards?.find(c => c.id === id) || state.draftPool?.find(c => c.id === id);
       const rosterPositions = team.roster.map(id => findLocalCard(id)?.position.charAt(0));
       return playerIds.reduce((sum, id) => {
          const card = findLocalCard(id);
          if (!card) return sum;
          const pos = card.position.charAt(0);
          const count = rosterPositions.filter(p => p === pos).length;
          // If they have 4+ players at that position, they want it less
          const weight = count >= 4 ? 0.7 : count === 3 ? 0.9 : 1.1;
          return sum * weight;
       }, 1.0);
    };

    const weightedOfferedVal = offeredVal * npcTeamWeight(toTeam, offer.offeredPlayerIds);

    const deficit = (requestedVal - weightedOfferedVal) / Math.max(1, requestedVal);

    // AI DECISION LOGIC
    if (deficit <= 0) {
      return { accepted: true, reason: 'The front office likes this deal. Trade accepted!' };
    }

    if (deficit < 0.08) {
      // Small deficit: Check positional needs
      const cardA = ALL_CARDS.find(c => c.id === offer.requestedPlayerIds[0]) || state.customCards?.find(c => c.id === offer.requestedPlayerIds[0]) || state.draftPool?.find(c => c.id === offer.requestedPlayerIds[0]);
      const targetPos = cardA?.position.charAt(0);
      const hasReplacement = toTeam.roster.some(id => 
        !offer.requestedPlayerIds.includes(id) && 
        ((ALL_CARDS.find(c => c.id === id) || state.customCards?.find(c => c.id === id))?.position.includes(targetPos || ''))
      );

      if (hasReplacement) {
        return { accepted: true, reason: 'It was a tough call, but we accept. Trade accepted!' };
      }
      return { accepted: false, reason: `The ${toTeam.name} feel they can't afford to lose this positional depth right now without a better return.` };
    }

    if (deficit >= 0.08 && deficit <= 0.20) {
       return { 
         accepted: false, 
         reason: `NOT ENOUGH VALUE: The ${toTeam.name} are interested but want more. Try adding a draft pick or a young prospect to even the value.` 
       };
    }

    // Heavy deficit
    const topRequested = ALL_CARDS.find(c => c.id === offer.requestedPlayerIds[0]) || state.customCards?.find(c => c.id === offer.requestedPlayerIds[0]) || state.draftPool?.find(c => c.id === offer.requestedPlayerIds[0]);
    if (topRequested && topRequested.stats.ovr > 90) {
        return { accepted: false, reason: `UNTOUCHABLE: The ${toTeam.name} view ${topRequested.name} as a cornerstone and won't move him for this package.` };
    }

    return { 
      accepted: false, 
      reason: `Proposal Rejected: The value difference is too great for the ${toTeam.name} to consider (${Math.round(requestedVal)} vs ${Math.round(weightedOfferedVal)} points).` 
    };
  },

  // Simulates 1-2 trades between CPU teams to keep the league dynamic
  processWeeklyCPUTrades(state: FranchiseState): string[] {
    const logs: string[] = [];
    const teamIds = Object.keys(state.teams).filter(id => id !== state.userTeamId);
    
    // Attempt 2 random trades per week
    for (let i = 0; i < 2; i++) {
      const teamAIdx = Math.floor(Math.random() * teamIds.length);
      const teamBIdx = Math.floor(Math.random() * teamIds.length);
      if (teamAIdx === teamBIdx) continue;

      const teamA = state.teams[teamIds[teamAIdx]];
      const teamB = state.teams[teamIds[teamBIdx]];

      // Pick a random bench player from each to swap
      if (teamA.roster.length > 8 && teamB.roster.length > 8) {
        const pAId = teamA.roster[Math.floor(Math.random() * teamA.roster.length)];
        const pBId = teamB.roster[Math.floor(Math.random() * teamB.roster.length)];

        // Only swap if values are somewhat similar (within 10 OVR)
        const findLocalCard = (id: string) => ALL_CARDS.find(c => c.id === id) || state.customCards?.find(c => c.id === id) || state.draftPool?.find(c => c.id === id);
        const cardA = findLocalCard(pAId);
        const cardB = findLocalCard(pBId);

        if (cardA && cardB && Math.abs(cardA.stats.ovr - cardB.stats.ovr) < 8) {
           this.executeTrade(state, {
             fromTeamId: teamA.teamId,
             toTeamId: teamB.teamId,
             offeredPlayerIds: [pAId],
             requestedPlayerIds: [pBId]
           });
           logs.push(`The ${teamA.name} traded ${cardA.name} to the ${teamB.name} for ${cardB.name}`);
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
