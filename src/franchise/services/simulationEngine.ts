import { ALL_CARDS } from '../../data/cards';
import { Card } from '../../types';
import { TeamObject, FranchiseState } from '../types';

export interface BoxScoreEntry {
    playerId: string;
    name: string;
    points: number;
    rebounds: number;
    assists: number;
    minutes: number;
}

export interface MatchResult {
    winnerId: string;
    score: { home: number; away: number };
    boxScore: {
        home: BoxScoreEntry[];
        away: BoxScoreEntry[];
    };
}

export const simulationEngine = {
  simulateMatch(homeTeam: TeamObject, awayTeam: TeamObject, state: FranchiseState): MatchResult {
    const homePower = this.calculateTeamPower(homeTeam, state, true);
    const awayPower = this.calculateTeamPower(awayTeam, state, false);

    // Initial Advantage
    let homeScore = 0;
    let awayScore = 0;

    // Simulate 4 Quarters
    let momentum = 1.0;
    for (let q = 1; q <= 4; q++) {
        const qHome = Math.round((homePower / 99) * 28 + (Math.random() * 8 - 4)) * momentum;
        const qAway = Math.round((awayPower / 99) * 28 + (Math.random() * 8 - 4)) * (2 - momentum);
        
        homeScore += qHome;
        awayScore += qAway;

        // Momentum calculation (System D)
        const diff = homeScore - awayScore;
        if (diff > 10) momentum -= 0.05;
        if (diff < -10) momentum += 0.05;
    }

    // Ensure no ties
    if (homeScore === awayScore) {
        if (Math.random() > 0.5) homeScore += 2;
        else awayScore += 2;
    }

    const winnerId = homeScore > awayScore ? homeTeam.teamId : awayTeam.teamId;

    return {
        winnerId,
        score: { home: homeScore, away: awayScore },
        boxScore: {
            home: this.generateBoxScore(homeTeam, homeScore, state),
            away: this.generateBoxScore(awayTeam, awayScore, state)
        }
    };
  },

  calculateTeamPower(team: TeamObject, state: FranchiseState, isHome: boolean): number {
    const starters = [
        team.lineup.PG, team.lineup.SG, team.lineup.SF, team.lineup.PF, team.lineup.C
    ].map(id => id ? ALL_CARDS.find(c => c.id === id) : null);

    const bench = team.lineup.bench.map(id => ALL_CARDS.find(c => c.id === id)).filter(Boolean);

    // Fallback if 0 starters (shouldn't happen but for safety)
    const starterOvr = starters.length > 0 
      ? starters.reduce((sum, c) => sum + (c ? this.getAdjustedOvr(c, state) : 60), 0) / starters.length 
      : 60;
      
    const benchOvr = bench.length > 0 
      ? bench.reduce((sum, c) => sum + (c ? this.getAdjustedOvr(c!, state) : 60), 0) / bench.length 
      : 60;

    let power = (starterOvr * 0.7) + (benchOvr * 0.3);

    // Home court advantage
    if (isHome) power *= 1.025;

    // Luxury Tax penalty (Payroll > $165M)
    if (team.payroll > 165000000) {
        power *= 0.95;
    }

    return power;
  },

  getAdjustedOvr(card: Card, state: FranchiseState): number {
    const progress = state.playerProgress[card.id];
    if (!progress) return card.stats.ovr;
    
    // Simple formula: ovr * form
    return Math.round(card.stats.ovr * progress.form);
  },

  generateBoxScore(team: TeamObject, totalPoints: number, state: FranchiseState): BoxScoreEntry[] {
    const entries: BoxScoreEntry[] = [];
    const players = [
        ...[team.lineup.PG, team.lineup.SG, team.lineup.SF, team.lineup.PF, team.lineup.C].map(id => ({ id, role: 'starter' })),
        ...team.lineup.bench.map(id => ({ id, role: 'bench' }))
    ].filter(p => p.id !== null);

    // Initial estimation based on card stats (with +- 20% variance as requested)
    const rawScores = players.map(p => {
       const card = ALL_CARDS.find(c => c.id === p.id);
       if (!card) return 0;
       const roleMod = p.role === 'starter' ? 1.0 : 0.45;
       const variance = 0.2; // 20%
       const randomFactor = 1 + (Math.random() * variance * 2 - variance);
       return card.stats.points * roleMod * randomFactor;
    });

    const currentTotalRaw = rawScores.reduce((a, b) => a + b, 0);
    const normalizationFactor = totalPoints / (currentTotalRaw || 1);

    players.forEach((p, idx) => {
        const card = ALL_CARDS.find(c => c.id === p.id);
        if (!card) return;

        const roleMod = p.role === 'starter' ? 1.0 : 0.45;
        const progress = state.playerProgress[card.id] || { form: 1.0 };
        
        let pts = Math.round(rawScores[idx] * normalizationFactor);
        
        // Final sanity check for Bug 6
        const maxPts = card.stats.points * 1.5; 
        const minPts = card.stats.points * 0.3; // Allow some bad games but not 0 usually if star
        if (p.role === 'starter') {
           pts = Math.max(Math.min(pts, Math.round(maxPts)), Math.round(minPts));
        }

        const reboundingVariance = 0.25;
        const assistsVariance = 0.25;

        entries.push({
            playerId: card.id,
            name: card.name,
            points: pts,
            rebounds: Math.max(0, Math.round((card.stats.rebounds * roleMod * progress.form * (1 + (Math.random() * reboundingVariance * 2 - reboundingVariance))) / 3)),
            assists: Math.max(0, Math.round((card.stats.assists * roleMod * progress.form * (1 + (Math.random() * assistsVariance * 2 - assistsVariance))) / 4)),
            minutes: p.role === 'starter' ? 28 + Math.floor(Math.random() * 10) : 8 + Math.floor(Math.random() * 12)
        });
    });

    return entries;
  }
};
