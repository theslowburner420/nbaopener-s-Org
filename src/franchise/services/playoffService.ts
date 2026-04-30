import { FranchiseMatch, FranchiseState, PlayoffSeries, TeamObject } from '../types';
import { simulationEngine } from './simulationEngine';
import { ALL_CARDS } from '../../data/cards';

export const playoffService = {
  generatePlayIn(state: FranchiseState): PlayoffSeries[] {
    const conferences: ('East' | 'West')[] = ['East', 'West'];
    const allSeries: PlayoffSeries[] = [];

    conferences.forEach(conf => {
      const standings = Object.values(state.teams)
        .filter(t => t.conference === conf)
        .sort((a, b) => b.wins - a.wins || a.losses - b.losses);

      const t7 = standings[6];
      const t8 = standings[7];
      const t9 = standings[8];
      const t10 = standings[9];

      // Stage 1 of Play-In
      // Game: 7 vs 8 (Winner gets 7th seed)
      allSeries.push({
        id: `playin-${conf}-7v8`,
        team1Id: t7.teamId,
        team2Id: t8.teamId,
        wins1: 0,
        wins2: 0,
        matches: [],
        round: 0, // Round 0 Stage 1
        conference: conf,
        seed1: 7,
        seed2: 8
      });

      // Game: 9 vs 10 (Winner plays loser of 7v8)
      allSeries.push({
        id: `playin-${conf}-9v10`,
        team1Id: t9.teamId,
        team2Id: t10.teamId,
        wins1: 0,
        wins2: 0,
        matches: [],
        round: 0,
        conference: conf,
        seed1: 9,
        seed2: 10
      });
    });

    return allSeries;
  },

  generateInitialBracket(state: FranchiseState): PlayoffSeries[] {
    const conferences: ('East' | 'West')[] = ['East', 'West'];
    const allSeries: PlayoffSeries[] = [];

    conferences.forEach(conf => {
       const seeds = this.getSeedsForConference(state, conf);
       
       // Matchups: 1v8, 4v5, 3v6, 2v7
       const matchups = [
         [0, 7], [3, 4], [2, 5], [1, 6]
       ];

       matchups.forEach(([s1Index, s2Index], idx) => {
         allSeries.push({
           id: `round1-${conf}-${idx}`,
           team1Id: seeds[s1Index].teamId,
           team2Id: seeds[s2Index].teamId,
           wins1: 0,
           wins2: 0,
           matches: [],
           round: 1,
           conference: conf,
           seed1: s1Index + 1,
           seed2: s2Index + 1
         });
       });
    });

    return allSeries;
  },

  getSeedsForConference(state: FranchiseState, conf: 'East' | 'West'): TeamObject[] {
    const standings = Object.values(state.teams)
        .filter(t => t.conference === conf)
        .sort((a, b) => b.wins - a.wins || a.losses - b.losses);

    // Initial 6 seeds are fixed from standings
    const seeds: TeamObject[] = standings.slice(0, 6);

    // Seeds 7 and 8 come from Play-In resolution
    const playin7v8 = state.playoffSeries.find(s => s.id === `playin-${conf}-7v8`);
    const playinFinal = state.playoffSeries.find(s => s.id === `playin-${conf}-final`);

    if (playin7v8?.winnerId) {
        seeds.push(state.teams[playin7v8.winnerId]);
    } else {
        seeds.push(standings[6]); // Fallback if bypassed
    }

    if (playinFinal?.winnerId) {
        seeds.push(state.teams[playinFinal.winnerId]);
    } else {
        seeds.push(standings[7]); // Fallback if bypassed
    }

    return seeds;
  },

  simulateNextPlayoffStep(state: FranchiseState) {
    // Find active series that user is NOT part of
    state.playoffSeries.forEach(series => {
      if (series.winnerId) return;

      const isUserInvolved = series.team1Id === state.userTeamId || series.team2Id === state.userTeamId;
      
      // Auto-simulate CPU vs CPU series
      if (!isUserInvolved) {
        this.simulateSeriesUntilFinished(state, series);
      }
    });

    this.checkAndAdvanceRound(state);
    this.checkChampion(state);
  },

  simulateSeriesUntilFinished(state: FranchiseState, series: PlayoffSeries) {
    const targetWins = series.round === 0 ? 1 : 4;
    while (series.wins1 < targetWins && series.wins2 < targetWins) {
      this.simulateSeriesGame(state, series);
    }
  },

  simulateSeriesGame(state: FranchiseState, series: PlayoffSeries) {
    const t1 = state.teams[series.team1Id];
    const t2 = state.teams[series.team2Id];
    
    // Higher OVR has 55-65% probability of winning each game according to the OVR difference.
    const ovr1 = this.calculateTeamOvr(t1, state);
    const ovr2 = this.calculateTeamOvr(t2, state);
    
    const diff = ovr1 - ovr2;
    // Win prob = 50% + (diff * 2.5%), max 70%, min 30%
    let winProb1 = 0.5 + (diff * 0.025);
    winProb1 = Math.max(0.3, Math.min(0.7, winProb1));
    
    if (Math.random() < winProb1) {
      series.wins1++;
    } else {
      series.wins2++;
    }

    const targetWins = series.round === 0 ? 1 : 4;
    if (series.wins1 === targetWins) series.winnerId = series.team1Id;
    if (series.wins2 === targetWins) series.winnerId = series.team2Id;
  },

  calculateTeamOvr(team: TeamObject, state: FranchiseState): number {
    const starters = [
      team.lineup.PG, team.lineup.SG, team.lineup.SF, team.lineup.PF, team.lineup.C
    ].map(id => {
      if (!id) return 60;
      const card = ALL_CARDS.find(c => c.id === id) || state.customCards?.find(c => c.id === id);
      if (!card) return 60;
      const progress = state.playerProgress[card.id];
      return progress?.ovr || card.stats.ovr;
    });

    return starters.reduce((a, b) => a + b, 0) / starters.length;
  },

  simulateNextRoundOnly(state: FranchiseState) {
    const currentRound = Math.min(...state.playoffSeries.filter(s => !s.winnerId).map(s => s.round));
    const activeSeries = state.playoffSeries.filter(s => s.round === currentRound && !s.winnerId);
    
    activeSeries.forEach(series => {
      const isUserInvolved = series.team1Id === state.userTeamId || series.team2Id === state.userTeamId;
      if (!isUserInvolved) {
        this.simulateSeriesUntilFinished(state, series);
      }
    });

    this.checkAndAdvanceRound(state);
    this.checkChampion(state);
  },

  checkAndAdvanceRound(state: FranchiseState) {
     const unfinished = state.playoffSeries.filter(s => !s.winnerId);
     if (unfinished.length > 0) return;

     const lastRound = Math.max(-1, ...state.playoffSeries.map(s => s.round));
     
     if (lastRound === 0) {
        // Play-In stage advancement
        const hasFinals = state.playoffSeries.some(s => s.id.includes('final'));
        if (!hasFinals) {
            // Generate Play-In Finals (Stage 2)
            const conferences: ('East' | 'West')[] = ['East', 'West'];
            const newSeries: PlayoffSeries[] = [];
            conferences.forEach(conf => {
                const s7v8 = state.playoffSeries.find(s => s.id === `playin-${conf}-7v8`)!;
                const s9v10 = state.playoffSeries.find(s => s.id === `playin-${conf}-9v10`)!;
                
                const loser7v8 = s7v8.winnerId === s7v8.team1Id ? s7v8.team2Id : s7v8.team1Id;
                const winner9v10 = s9v10.winnerId!;

                newSeries.push({
                    id: `playin-${conf}-final`,
                    team1Id: loser7v8,
                    team2Id: winner9v10,
                    wins1: 0,
                    wins2: 0,
                    matches: [],
                    round: 0,
                    conference: conf,
                    seed1: 8, // Loser of 7v8 is higher seed (game played at their home)
                    seed2: 9
                });
            });
            state.playoffSeries = [...state.playoffSeries, ...newSeries];
            
            // Auto-simulate if user not involved
            this.simulateNextPlayoffStep(state);
            return;
        }

        // Post Play-In (Stage 2 finished): Generate R1
        state.phase = "Playoffs";
        state.playoffSeries = [...state.playoffSeries, ...this.generateInitialBracket(state)];
     } else if (lastRound === 1) {
        // Round 1 -> Semis
        this.generateNextRound(state, 2);
     } else if (lastRound === 2) {
        // Semis -> Conference Finals
        this.generateNextRound(state, 3);
     } else if (lastRound === 3) {
        // Conference Finals -> Finals
        this.generateFinals(state);
     } else if (lastRound === 4) {
        // Finals finished
        this.checkChampion(state);
     }
  },

  generateNextRound(state: FranchiseState, nextRound: number) {
     const winners = state.playoffSeries.filter(s => s.round === nextRound - 1);
     const conferences: ('East' | 'West')[] = ['East', 'West'];

     conferences.forEach(conf => {
        const confWinners = winners.filter(s => s.conference === conf);
        for (let i = 0; i < confWinners.length; i += 2) {
           if (confWinners[i+1]) {
              const w1 = confWinners[i];
              const w2 = confWinners[i+1];
              
              state.playoffSeries.push({
                id: `round${nextRound}-${conf}-${i}`,
                team1Id: w1.winnerId!,
                team2Id: w2.winnerId!,
                wins1: 0,
                wins2: 0,
                matches: [],
                round: nextRound,
                conference: conf,
                seed1: w1.winnerId === w1.team1Id ? w1.seed1 : w1.seed2,
                seed2: w2.winnerId === w2.team1Id ? w2.seed1 : w2.seed2
              });
           }
        }
     });
  },

  generateFinals(state: FranchiseState) {
     const eastSeries = state.playoffSeries.find(s => s.round === 3 && s.conference === 'East');
     const westSeries = state.playoffSeries.find(s => s.round === 3 && s.conference === 'West');

     if (eastSeries?.winnerId && westSeries?.winnerId) {
        state.playoffSeries.push({
          id: `finals`,
          team1Id: eastSeries.winnerId,
          team2Id: westSeries.winnerId,
          wins1: 0,
          wins2: 0,
          matches: [],
          round: 4,
          conference: 'Finals',
          seed1: eastSeries.winnerId === eastSeries.team1Id ? eastSeries.seed1 : eastSeries.seed2,
          seed2: westSeries.winnerId === westSeries.team1Id ? westSeries.seed1 : westSeries.seed2
        });
     }
  },

  checkChampion(state: FranchiseState) {
    const finals = state.playoffSeries.find(s => s.round === 4);
    if (finals?.winnerId) {
      state.championId = finals.winnerId;
      
      if (!state.awards[state.season]) {
        state.awards[state.season] = { allNba: [] };
      }
      state.awards[state.season].championId = finals.winnerId;

      if (finals.winnerId === state.userTeamId) {
        const hasTrophy = state.trophyCase.some(t => t.type === 'CHAMP' && t.season === state.season);
        if (!hasTrophy) {
          state.trophyCase.push({
            type: 'CHAMP',
            season: state.season,
            label: `${state.season} WORLD CHAMPIONS`
          });
        }
      }
    }
  }
};
