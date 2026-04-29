import { FranchiseState, TeamObject } from '../types';
import { ALL_CARDS } from '../../data/cards';

export interface TradeOffer {
  fromTeamId: string;
  toTeamId: string;
  offeredPlayerIds: string[];
  requestedPlayerIds: string[];
}

export const tradeEngine = {
  // Evaluates a trade proposal by the user
  evaluateUserTrade(state: FranchiseState, offer: TradeOffer): { accepted: boolean; reason: string } {
    const fromTeam = state.teams[offer.fromTeamId];
    const toTeam = state.teams[offer.toTeamId];

    if (!fromTeam || !toTeam) return { accepted: false, reason: 'Invalid teams' };

    // Basic count checks
    if (offer.offeredPlayerIds.length === 0 || offer.requestedPlayerIds.length === 0) {
      return { accepted: false, reason: 'Must include players in both sides' };
    }

    // Role/Value Calculation
    const getVal = (ids: string[]) => ids.reduce((sum, id) => {
      const card = ALL_CARDS.find(c => c.id === id);
      return sum + (card?.stats.ovr || 0);
    }, 0);

    const offeredVal = getVal(offer.offeredPlayerIds);
    const requestedVal = getVal(offer.requestedPlayerIds);

    // CPU logic: Accept if offered >= requested - 5 (slightly lenient)
    const threshold = requestedVal * 0.95; 

    if (offeredVal >= threshold) {
      return { accepted: true, reason: 'Trade accepted by front office' };
    }

    return { 
      accepted: false, 
      reason: `The ${toTeam.name} values their players higher (${Math.round(requestedVal)} OVR vs ${Math.round(offeredVal)} offered).` 
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
        const cardA = ALL_CARDS.find(c => c.id === pAId);
        const cardB = ALL_CARDS.find(c => c.id === pBId);

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
      this.rebuildTeamLineup(team);
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

  rebuildTeamLineup(team: TeamObject): void {
    const available = team.roster.map(id => ALL_CARDS.find(c => c.id === id)).filter(Boolean);
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
