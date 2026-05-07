import { FranchiseMatch, FranchiseState, PlayoffSeries, TeamObject } from '../types';
import { simulationEngine } from './simulationEngine';
import { ALL_CARDS } from '../../data/cards';

export const playoffService = {
  calculateSeasonStandings(state: FranchiseState) {
    const conferences: ('East' | 'West')[] = ['East', 'West'];
    const standings: Record<string, any> = {};

    conferences.forEach(conf => {
      const teams = Object.values(state.teams)
        .filter(t => t.conference === conf)
        .map(t => {
           // Calculate Point Differential (PD)
           let pointsFor = 0;
           let pointsAgainst = 0;
           state.schedule.forEach(m => {
             if (!m.played || !m.score) return;
             if (m.homeTeamId === t.teamId) {
                pointsFor += m.score.home;
                pointsAgainst += m.score.away;
             } else if (m.awayTeamId === t.teamId) {
                pointsFor += m.score.away;
                pointsAgainst += m.score.home;
             }
           });
           return { ...t, pd: pointsFor - pointsAgainst };
        })
        .sort((a, b) => b.wins - a.wins || b.pd - a.pd);
      
      standings[conf] = teams;
    });

    state.standings = standings;
    state.playoffSeries = this.generateInitialBracket(state);
  },

  generateInitialBracket(state: FranchiseState): PlayoffSeries[] {
    const conferences: ('East' | 'West')[] = ['East', 'West'];
    const allSeries: PlayoffSeries[] = [];

    conferences.forEach(conf => {
       const seeds = state.standings[conf].slice(0, 8);
       
       // Matchups: 1v8, 2v7, 3v6, 4v5
       const matchups = [
         [0, 7], [1, 6], [2, 5], [3, 4]
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
    const targetWins = 4; // Best of 7
    while (series.wins1 < targetWins && series.wins2 < targetWins) {
      this.simulateSeriesGame(state, series);
    }
  },

  simulateSeriesGame(state: FranchiseState, series: PlayoffSeries) {
    const t1 = state.teams[series.team1Id];
    const t2 = state.teams[series.team2Id];
    
    // Sim engine but without detailed boxscore for CPU to keep performance
    const res = simulationEngine.simulateMatch(t1, t2, state);
    
    // Log playoff stats
    this.trackPlayoffStats(state, res.boxScore.home);
    this.trackPlayoffStats(state, res.boxScore.away);

    if (res.winnerId === t1.teamId) {
      series.wins1++;
    } else {
      series.wins2++;
    }

    const targetWins = 4;
    if (series.wins1 === targetWins) series.winnerId = series.team1Id;
    if (series.wins2 === targetWins) series.winnerId = series.team2Id;
  },

  trackPlayoffStats(state: FranchiseState, entries: any[]) {
    if (!state.stats.playoffs) state.stats.playoffs = {};
    const pStats = state.stats.playoffs;

    entries.forEach(e => {
        if (!pStats[e.playerId]) {
            pStats[e.playerId] = { points: 0, rebounds: 0, assists: 0, steals: 0, blocks: 0, plusMinus: 0, gamesPlayed: 0, fgPct: 0 };
        }
        const s = pStats[e.playerId];
        s.points += e.points;
        s.rebounds += e.rebounds;
        s.assists += e.assists;
        s.gamesPlayed += 1;
    });
  },

  calculateTeamOvr(team: TeamObject, state: FranchiseState): number {
    const starters = [
      team.lineup.PG, team.lineup.SG, team.lineup.SF, team.lineup.PF, team.lineup.C
    ].map(id => {
      if (!id) return 60;
      const card = ALL_CARDS.find(c => c.id === id) || 
                   state.customCards?.find(c => c.id === id) || 
                   state.draftPool?.find(c => c.id === id);
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
        state.phase = "playoffs";
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
              
              const seriesId = `round${nextRound}-${conf}-${i}`;
              if (state.playoffSeries.some(s => s.id === seriesId)) continue;

              state.playoffSeries.push({
                id: seriesId,
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
        if (state.playoffSeries.some(s => s.id === 'finals')) return;

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

      this.calculateFinalsMvp(state, finals.winnerId);

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
  },

  calculateFinalsMvp(state: FranchiseState, champTeamId: string) {
    const champTeam = state.teams[champTeamId];
    const playoffStats = state.stats.playoffs;

    let fmvpId = '';
    let bestScore = -1;

    if (playoffStats) {
        champTeam.roster.forEach(pid => {
            const s = playoffStats[pid];
            if (s && s.gamesPlayed > 0) {
                const score = (s.points / s.gamesPlayed) + (s.assists / s.gamesPlayed) * 0.9 + (s.rebounds / s.gamesPlayed) * 0.7;
                if (score > bestScore) {
                    bestScore = score;
                    fmvpId = pid;
                }
            }
        });
    }

    if (!fmvpId) {
        // Fallback: Highest OVR
        fmvpId = [...champTeam.roster].sort((a,b) => {
            const ovrA = state.playerProgress[a]?.ovr || 0;
            const ovrB = state.playerProgress[b]?.ovr || 0;
            return ovrB - ovrA;
        })[0];
    }

    state.awards[state.season].finalsMvp = fmvpId;
    if (champTeam.isHuman) {
        state.trophyCase.push({
            type: 'FMVP',
            season: state.season,
            playerId: fmvpId,
            label: 'Finals MVP'
        });
    }
  }
};
