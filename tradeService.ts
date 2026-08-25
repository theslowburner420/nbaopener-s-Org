import { FranchiseState, TeamObject, ContractObject } from '../types';
import { ALL_CARDS } from '../../data/cards';
import { marketService } from './marketService';

export const tradeService = {
  /**
   * Generates CPU trade proposals for the user during the offseason or regular season.
   */
  generateCPUProposals: (state: FranchiseState): void => {
    const activePhases: string[] = ['regular_season', 'draft', 'free_agency', 'offseason_start'];
    if (activePhases.includes(state.phase)) {
      const userTeam = state.teams[state.userTeamId];
      if (!userTeam) return;

      Object.values(state.teams).forEach(team => {
        if (team.isHuman) return;
        
        // 5% chance per CPU team to propose a trade to the user
        if (Math.random() > 0.05) return;

        const proposal = tradeService.createProposal(state, team.teamId, state.userTeamId);
        if (proposal) {
          state.notifications.unshift({
            id: `trade-prop-${team.teamId}-${Date.now()}`,
            type: 'TRADE',
            message: `${team.name} has proposed a trade! Check your trade office.`,
            week: state.week,
            season: state.season,
            read: false,
            data: { proposal }
          });
        }
      });
    }
  },

  createProposal: (state: FranchiseState, cpuId: string, targetId: string) => {
    const cpuTeam = state.teams[cpuId];
    const targetTeam = state.teams[targetId];
    if (!cpuTeam || !targetTeam) return null;

    // CPU wants to improve their worst position
    const cpuLineup = cpuTeam.lineup;
    const positions = ['PG', 'SG', 'SF', 'PF', 'C'] as const;
    const posValues = positions.map(pos => {
      const pid = cpuLineup[pos];
      const card = ALL_CARDS.find(c => c.id === pid) || state.customCards?.find(c => c.id === pid) || state.draftPool?.find(c => c.id === pid);
      const ovr = state.playerProgress[pid!]?.ovr || card?.stats.ovr || 0;
      return { pos, ovr, pid };
    }).sort((a, b) => a.ovr - b.ovr);

    const targetPos = posValues[0].pos;
    
    // Find a player in target team at that position who is better
    const targetPlayers = targetTeam.roster.filter(pid => {
      const card = ALL_CARDS.find(c => c.id === pid) || state.customCards?.find(c => c.id === pid) || state.draftPool?.find(c => c.id === pid);
      if (!card) return false;
      const ovr = state.playerProgress[pid]?.ovr || card.stats.ovr;
      return card.position === targetPos && ovr > posValues[0].ovr;
    }).sort((a,b) => {
        const ovrA = state.playerProgress[a]?.ovr || ALL_CARDS.find(c => c.id === a)?.stats.ovr || 0;
        const ovrB = state.playerProgress[b]?.ovr || ALL_CARDS.find(c => c.id === b)?.stats.ovr || 0;
        return ovrB - ovrA;
    });

    if (targetPlayers.length === 0) return null;

    const offerTargetId = targetPlayers[0];
    
    // CPU offers a player of similar value or slightly higher from another position
    const cpuCandidates = cpuTeam.roster.filter(pid => pid !== posValues[0].pid);
    if (cpuCandidates.length === 0) return null;

    const targetCard = ALL_CARDS.find(c => c.id === offerTargetId) || state.customCards?.find(c => c.id === offerTargetId);
    const targetOvr = state.playerProgress[offerTargetId]?.ovr || targetCard?.stats.ovr || 50;

    const cpuOffer = cpuCandidates.map(pid => {
       const card = ALL_CARDS.find(c => c.id === pid) || state.customCards?.find(c => c.id === pid);
       const ovr = state.playerProgress[pid]?.ovr || card?.stats.ovr || 0;
       return { id: pid, ovr, card };
    }).filter(p => p.ovr >= targetOvr - 5 && p.ovr <= targetOvr + 10)
      .sort((a,b) => b.ovr - a.ovr);

    if (cpuOffer.length === 0) return null;

    return {
      sendingTeamId: cpuId,
      receivingTeamId: targetId,
      sendingPlayers: [cpuOffer[0].id],
      receivingPlayers: [offerTargetId],
      status: 'PENDING',
      timestamp: Date.now()
    };
  }
};
