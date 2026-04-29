import { ALL_CARDS } from '../../data/cards';
import { Card } from '../../types';
import { TeamObject, FranchiseState, BoxScoreEntry, MatchResult } from '../types';

export const simulationEngine = {
  simulateMatch(homeTeam: TeamObject, awayTeam: TeamObject, state: FranchiseState): MatchResult {
    const homePower = this.calculateTeamPower(homeTeam, state, true);
    const awayPower = this.calculateTeamPower(awayTeam, state, false);

    // Initial Advantage
    let homeScore = 0;
    let awayScore = 0;
    const homePeriods: number[] = [];
    const awayPeriods: number[] = [];

    // Simulate 4 Quarters
    let momentum = 1.0;
    for (let q = 1; q <= 4; q++) {
        const qHome = Math.round((homePower / 99) * 28 + (Math.random() * 8 - 4)) * momentum;
        const qAway = Math.round((awayPower / 99) * 28 + (Math.random() * 8 - 4)) * (2 - momentum);
        
        const hQ = Math.max(15, Math.round(qHome));
        const aQ = Math.max(15, Math.round(qAway));

        homePeriods.push(hQ);
        awayPeriods.push(aQ);
        homeScore += hQ;
        awayScore += aQ;

        // Momentum calculation
        const diff = homeScore - awayScore;
        if (diff > 10) momentum -= 0.05;
        if (diff < -10) momentum += 0.05;
    }

    // Ensure no ties
    if (homeScore === awayScore) {
        const ot = Math.random() > 0.5;
        if (ot) homeScore += 2; else awayScore += 2;
    }

    const winnerId = homeScore > awayScore ? homeTeam.teamId : awayTeam.teamId;
    const plusMinusDiff = homeScore - awayScore;

    return {
        winnerId,
        score: { home: homeScore, away: awayScore },
        periods: { home: homePeriods, away: awayPeriods },
        boxScore: {
            home: this.generateBoxScore(homeTeam, homeScore, state, plusMinusDiff),
            away: this.generateBoxScore(awayTeam, awayScore, state, -plusMinusDiff)
        }
    };
  },

  findCard(id: string, state: FranchiseState): Card | undefined {
    return ALL_CARDS.find(c => c.id === id) || state.customCards?.find(c => c.id === id);
  },

  calculateTeamPower(team: TeamObject, state: FranchiseState, isHome: boolean): number {
    const starters = [
        team.lineup.PG, team.lineup.SG, team.lineup.SF, team.lineup.PF, team.lineup.C
    ].map(id => id ? this.findCard(id, state) : null);

    const bench = team.lineup.bench.map(id => this.findCard(id, state)).filter(Boolean);

    const starterOvr = starters.length > 0 
      ? starters.reduce((sum, c) => sum + (c ? this.getAdjustedOvr(c, state) : 60), 0) / starters.length 
      : 60;
      
    const benchOvr = bench.length > 0 
      ? bench.reduce((sum, c) => sum + (c ? this.getAdjustedOvr(c!, state) : 60), 0) / bench.length 
      : 60;

    let power = (starterOvr * 0.7) + (benchOvr * 0.3);

    if (isHome) power *= 1.025;
    if (team.payroll > 165000000) power *= 0.95;

    return power;
  },

  getAdjustedOvr(card: Card, state: FranchiseState): number {
    const progress = state.playerProgress[card.id];
    const baseOvr = progress?.ovr || card.stats.ovr;
    const form = progress?.form || 1.0;
    return Math.round(baseOvr * form);
  },

  generateBoxScore(team: TeamObject, totalPoints: number, state: FranchiseState, teamPlusMinus: number): BoxScoreEntry[] {
    const entries: BoxScoreEntry[] = [];
    const seenIds = new Set<string>();
    const players = [
        ...[team.lineup.PG, team.lineup.SG, team.lineup.SF, team.lineup.PF, team.lineup.C].map(id => ({ id, role: 'starter' })),
        ...team.lineup.bench.map(id => ({ id, role: 'bench' }))
    ].filter(p => {
        if (!p.id || seenIds.has(p.id)) return false;
        seenIds.add(p.id);
        return true;
    });

    const rawScores = players.map(p => {
       const card = this.findCard(p.id!, state);
       if (!card) return 0;
       
       const progress = state.playerProgress[p.id!] || { form: 1.0, ovr: card.stats.ovr };
       const currentOvr = progress.ovr || card.stats.ovr;
       const ovrMod = currentOvr / card.stats.ovr;
       
       const roleMod = p.role === 'starter' ? 1.0 : 0.45;
       const variance = 0.2;
       const randomFactor = 1 + (Math.random() * variance * 2 - variance);
       return card.stats.points * roleMod * randomFactor * ovrMod;
    });

    const currentTotalRaw = rawScores.reduce((a, b) => a + b, 0);
    const normalizationFactor = totalPoints / (currentTotalRaw || 1);

    players.forEach((p, idx) => {
        const card = this.findCard(p.id!, state);
        if (!card) return;

        const roleMod = p.role === 'starter' ? 1.0 : 0.45;
        const progress = state.playerProgress[card.id] || { form: 1.0, ovr: card.stats.ovr };
        const currentOvr = progress.ovr || card.stats.ovr;
        const ovrMod = currentOvr / card.stats.ovr;
        
        let pts = Math.round(rawScores[idx] * normalizationFactor);

        const variance = 0.25;
        const rnd = () => (1 + (Math.random() * variance * 2 - variance));

        // Simplified stat generation
        const reb = Math.max(0, Math.round((card.stats.rebounds * roleMod * progress.form * rnd() * ovrMod) / 3));
        const ast = Math.max(0, Math.round((card.stats.assists * roleMod * progress.form * rnd() * ovrMod) / 4));
        const stl = Math.random() > (0.6 / progress.form) ? Math.floor(Math.random() * 3) + (p.role === 'starter' ? 1 : 0) : 0;
        const blk = Math.random() > (0.7 / progress.form) ? Math.floor(Math.random() * 3) + (card.position === 'C' ? 1 : 0) : 0;
        
        const individualPM = Math.round((teamPlusMinus * roleMod) + (Math.random() * 10 - 5));

        entries.push({
            playerId: card.id,
            name: card.name,
            points: pts,
            rebounds: reb,
            assists: ast,
            steals: stl,
            blocks: blk,
            plusMinus: individualPM,
            minutes: p.role === 'starter' ? 28 + Math.floor(Math.random() * 10) : 8 + Math.floor(Math.random() * 12)
        });
    });

    return entries;
  }
};
