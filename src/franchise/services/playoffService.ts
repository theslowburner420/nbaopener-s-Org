import { FranchiseMatch, FranchiseState, PlayoffSeries, TeamObject } from '../types';
import { simulationEngine } from './simulationEngine';

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
    // Find active series that user is NOT part of, or advance user's series if it's CPU vs CPU
    state.playoffSeries.forEach(series => {
      if (series.winnerId) return;

      const isUserInvolved = series.team1Id === state.userTeamId || series.team2Id === state.userTeamId;
      
      // CPU vs CPU series: simulate one game at a time until someone wins 4 (or 1 for playin)
      if (!isUserInvolved) {
        const targetWins = series.round === 0 ? 1 : 4;
        while (series.wins1 < targetWins && series.wins2 < targetWins) {
            this.simulateSeriesGame(state, series);
        }
      }
    });

    // Check if round is complete to advance
    this.checkAndAdvanceRound(state);
    this.checkChampion(state);
  },

  simulateSeriesGame(state: FranchiseState, series: PlayoffSeries) {
    const t1 = state.teams[series.team1Id];
    const t2 = state.teams[series.team2Id];
    const result = simulationEngine.simulateMatch(t1, t2, state);
    
    if (result.winnerId === t1.teamId) series.wins1++;
    else series.wins2++;

    const targetWins = series.round === 0 ? 1 : 4;
    if (series.wins1 === targetWins) series.winnerId = series.team1Id;
    if (series.wins2 === targetWins) series.winnerId = series.team2Id;
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
              state.playoffSeries.push({
                id: `round${nextRound}-${conf}-${i}`,
                team1Id: confWinners[i].winnerId!,
                team2Id: confWinners[i+1].winnerId!,
                wins1: 0,
                wins2: 0,
                matches: [],
                round: nextRound,
                conference: conf
              });
           }
        }
     });
  },

  generateFinals(state: FranchiseState) {
     const eastChamp = state.playoffSeries.find(s => s.round === 3 && s.conference === 'East')?.winnerId;
     const westChamp = state.playoffSeries.find(s => s.round === 3 && s.conference === 'West')?.winnerId;

     if (eastChamp && westChamp) {
        state.playoffSeries.push({
          id: `finals`,
          team1Id: eastChamp,
          team2Id: westChamp,
          wins1: 0,
          wins2: 0,
          matches: [],
          round: 4,
          conference: 'Finals'
        });
     }
  },

  checkChampion(state: FranchiseState) {
    const finals = state.playoffSeries.find(s => s.round === 4);
    if (finals?.winnerId) {
      state.championId = finals.winnerId;
      
      // Award Trophy if it doesn't exist for this season
      const hasAward = Object.values(state.awards).some((a: any) => a.season === state.season && a.teamId === finals.winnerId && a.type === 'CHAMP');
      
      if (!hasAward) {
        const awardId = Date.now();
        state.awards[awardId] = {
          type: 'CHAMP',
          season: state.season,
          teamId: finals.winnerId,
          label: `${state.season} NBA Champions - ${state.teams[finals.winnerId].name}`
        };
      }
    }
  }
};
