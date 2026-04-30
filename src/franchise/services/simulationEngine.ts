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

    const getDistributionFactor = () => {
      const r = Math.random();
      if (r < 0.60) return 0.75 + Math.random() * 0.50; // 75-125%
      if (r < 0.85) return Math.random() > 0.5 ? (0.50 + Math.random() * 0.25) : (1.25 + Math.random() * 0.35); // 50-75 or 125-160
      if (r < 0.95) return Math.random() > 0.5 ? (0.30 + Math.random() * 0.20) : (1.60 + Math.random() * 0.40); // 30-50 or 160-200
      return 2.0 + Math.random() * 0.50; // 200-250% (Historic)
    };

    // 1. Assign Minutes
    const playerData = players.map(p => {
      const card = this.findCard(p.id!, state);
      const mins = p.role === 'starter' ? 28 + Math.floor(Math.random() * 11) : 10 + Math.floor(Math.random() * 13);
      return { id: p.id!, role: p.role, card, mins };
    });

    // 2. Calculate Raw Points for Normalization (to match team score)
    const rawScores = playerData.map(p => {
       if (!p.card) return 0;
       const progress = state.playerProgress[p.id!] || { form: 1.0, ovr: p.card.stats.ovr };
       const currentOvr = progress.ovr || p.card.stats.ovr;
       const ovrMod = currentOvr / p.card.stats.ovr;
       
       // Base per minute (assuming 34 min base)
       const basePPG = p.card.stats.points;
       const raw = (basePPG / 34) * p.mins * getDistributionFactor() * ovrMod * progress.form;
       return raw;
    });

    const currentTotalRaw = rawScores.reduce((a, b) => a + b, 0);
    const normalizationFactor = totalPoints / (currentTotalRaw || 1);

    playerData.forEach((p, idx) => {
        if (!p.card) return;
        const progress = state.playerProgress[p.card.id] || { form: 1.0, ovr: p.card.stats.ovr };
        const currentOvr = progress.ovr || p.card.stats.ovr;
        const ovrMod = currentOvr / p.card.stats.ovr;
        
        let pts = Math.round(rawScores[idx] * normalizationFactor);
        
        // Distribution for REB and AST independently
        const rebFactor = getDistributionFactor();
        const astFactor = getDistributionFactor();

        const reb = Math.max(0, Math.round((p.card.stats.rebounds / 34) * p.mins * rebFactor * ovrMod));
        const ast = Math.max(0, Math.round((p.card.stats.assists / 34) * p.mins * astFactor * ovrMod));
        
        const stl = Math.random() > (0.6 / progress.form) ? Math.floor(Math.random() * 3) + (p.role === 'starter' ? 1 : 0) : 0;
        const blk = Math.random() > (0.7 / progress.form) ? Math.floor(Math.random() * 3) + (p.card.position === 'C' ? 1 : 0) : 0;
        
        const individualPM = Math.round((teamPlusMinus * (p.mins / 48)) + (Math.random() * 10 - 5));

        entries.push({
            playerId: p.card.id,
            name: p.card.name,
            points: pts,
            rebounds: reb,
            assists: ast,
            steals: stl,
            blocks: blk,
            plusMinus: individualPM,
            minutes: p.mins
        });
    });

    return entries;
  }
};
