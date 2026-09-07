import { FranchiseMatch, FranchiseState, PlayoffSeries, TeamObject, MatchResult } from '../types';
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
    // Start with the Play-In tournament instead of direct Playoffs bracket
    state.playoffSeries = this.generatePlayInBracket(state);
  },

  generatePlayInBracket(state: FranchiseState): PlayoffSeries[] {
    const conferences: ('East' | 'West')[] = ['East', 'West'];
    const allSeries: PlayoffSeries[] = [];

    conferences.forEach(conf => {
       const seeds = state.standings[conf];
       if (seeds && seeds.length >= 10) {
          // Play-In Match A: 7v8
          allSeries.push({
            id: `playin-${conf}-7v8`,
            team1Id: seeds[6].teamId, // 7th seed
            team2Id: seeds[7].teamId, // 8th seed
            wins1: 0,
            wins2: 0,
            matches: [],
            round: 0,
            conference: conf,
            seed1: 7,
            seed2: 8
          });

          // Play-In Match B: 9v10
          allSeries.push({
            id: `playin-${conf}-9v10`,
            team1Id: seeds[8].teamId, // 9th seed
            team2Id: seeds[9].teamId, // 10th seed
            wins1: 0,
            wins2: 0,
            matches: [],
            round: 0,
            conference: conf,
            seed1: 9,
            seed2: 10
          });
       }
    });

    return allSeries;
  },

  generateInitialBracket(state: FranchiseState): PlayoffSeries[] {
    const conferences: ('East' | 'West')[] = ['East', 'West'];
    const allSeries: PlayoffSeries[] = [];

    conferences.forEach(conf => {
       const regSeasonSeeds = state.standings[conf];
       const playIn7v8 = state.playoffSeries.find(s => s.id === `playin-${conf}-7v8`);
       const playInFinal = state.playoffSeries.find(s => s.id === `playin-${conf}-final`);

       // Winner of 7v8 is Seed 7. Loser of 7v8 goes to playin-final.
       const seed7Id = playIn7v8?.winnerId || regSeasonSeeds[6].teamId;
       // Winner of playin-final is Seed 8
       const seed8Id = playInFinal?.winnerId || regSeasonSeeds[7].teamId;

       const seeds = [
         { teamId: regSeasonSeeds[0].teamId, seed: 1 },
         { teamId: regSeasonSeeds[1].teamId, seed: 2 },
         { teamId: regSeasonSeeds[2].teamId, seed: 3 },
         { teamId: regSeasonSeeds[3].teamId, seed: 4 },
         { teamId: regSeasonSeeds[4].teamId, seed: 5 },
         { teamId: regSeasonSeeds[5].teamId, seed: 6 },
         { teamId: seed7Id, seed: 7 },
         { teamId: seed8Id, seed: 8 }
       ];

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
           seed1: seeds[s1Index].seed,
           seed2: seeds[s2Index].seed
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
    const targetWins = series.round === 0 ? 1 : 4; // Play-In is single match (1 win required)
    while (series.wins1 < targetWins && series.wins2 < targetWins) {
      this.simulateSeriesGame(state, series);
    }
  },

  getPlayoffGameOvr(state: FranchiseState, series: PlayoffSeries, teamId: string): number {
    const baseOvr = this.calculateTeamOvr(state.teams[teamId], state);
    let bonus = 0;

    // 1. Momentum bonus (+1.5 on collective OVR if 2 consecutive wins in the series)
    const gameWinners: string[] = [];
    series.matches.forEach(m => {
      if (m.played) {
        const winnerId = m.winner || (m.score && m.score.home > m.score.away ? m.homeTeamId : m.awayTeamId);
        if (winnerId) gameWinners.push(winnerId);
      }
    });

    if (gameWinners.length >= 2) {
      const last = gameWinners[gameWinners.length - 1];
      const secondLast = gameWinners[gameWinners.length - 2];
      if (last === secondLast && last === teamId) {
        bonus += 1.5;
      }
    }

    // 2. Tactical resilience bonus (+2.0 collective OVR for trailing team in Game 4 only if going 3-0)
    const currentGameNum = series.wins1 + series.wins2 + 1;
    if (currentGameNum === 4) {
      if (series.wins1 === 3 && series.wins2 === 0 && teamId === series.team2Id) {
        bonus += 2.0;
      } else if (series.wins1 === 0 && series.wins2 === 3 && teamId === series.team1Id) {
        bonus += 2.0;
      }
    }

    return baseOvr + bonus;
  },

  simulatePlayoffGame(state: FranchiseState, series: PlayoffSeries): MatchResult {
    const currentGame = series.wins1 + series.wins2 + 1;
    let homeTeamId = '';
    let awayTeamId = '';

    if (series.round === 0) {
      // Single-game Play-In: seeds 7 & 8 are local (team1Id is 7th/8th, so team1Id is home)
      homeTeamId = series.team1Id;
      awayTeamId = series.team2Id;
    } else {
      // Best of 7: Format 2-2-1-1-1 (Games 1, 2, 5, 7 at seed1 home, Games 3, 4, 6 at seed2 home)
      if (currentGame === 1 || currentGame === 2 || currentGame === 5 || currentGame === 7) {
        homeTeamId = series.team1Id;
        awayTeamId = series.team2Id;
      } else {
        homeTeamId = series.team2Id;
        awayTeamId = series.team1Id;
      }
    }

    const homeTeam = state.teams[homeTeamId];
    const awayTeam = state.teams[awayTeamId];

    // Get OVRs with momentum and tactical resilience additions
    const ovrHome = this.getPlayoffGameOvr(state, series, homeTeamId);
    const ovrAway = this.getPlayoffGameOvr(state, series, awayTeamId);

    // Logistic regression model for local victory probability P = 1 / (1 + e^-y)
    const deltaLocal = 3.8; // Static local home court benefit
    const y = (ovrHome - ovrAway + deltaLocal) / 12.0;
    const pLocal = 1.0 / (1.0 + Math.exp(-y));

    // Determine target winner from probability
    const homeWins = Math.random() < pLocal;
    const winnerId = homeWins ? homeTeamId : awayTeamId;

    // Run core engine simulation & retry up to 5 times if actual result diverges from probability choice
    let res = simulationEngine.simulateMatch(homeTeam, awayTeam, state);
    let attempts = 0;
    while (res.winnerId !== winnerId && attempts < 5) {
      res = simulationEngine.simulateMatch(homeTeam, awayTeam, state);
      attempts++;
    }

    // Force result alignment if discrepancies remain after retries (preserving organic stats categories)
    if (res.winnerId !== winnerId) {
      const tempScore = res.score.home;
      res.score.home = res.score.away;
      res.score.away = tempScore;

      const tempPeriods = res.periods.home;
      res.periods.home = res.periods.away;
      res.periods.away = tempPeriods;

      const tempBox = res.boxScore.home;
      res.boxScore.home = res.boxScore.away;
      res.boxScore.away = tempBox;

      res.winnerId = winnerId;
    }

    // Convert and append of the played match to the series history
    const fMatch: FranchiseMatch = {
      id: `playoff-${series.id}-${currentGame}`,
      homeTeamId,
      awayTeamId,
      gameNumber: currentGame,
      played: true,
      score: { ...res.score },
      periods: { ...res.periods },
      winner: winnerId,
      boxScore: { ...res.boxScore }
    };
    if (!series.matches) series.matches = [];
    series.matches.push(fMatch);

    // Track overall playoff accumulated statistics
    this.trackPlayoffStats(state, res.boxScore.home);
    this.trackPlayoffStats(state, res.boxScore.away);

    return res;
  },

  simulateSeriesGame(state: FranchiseState, series: PlayoffSeries) {
    const res = this.simulatePlayoffGame(state, series);

    if (res.winnerId === series.team1Id) {
      series.wins1++;
    } else {
      series.wins2++;
    }

    const targetWins = series.round === 0 ? 1 : 4;
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

  calculateSeriesMvp(state: FranchiseState, series: PlayoffSeries): string {
    const winnerId = series.winnerId;
    if (!winnerId) return '';

    const winnerTeam = state.teams[winnerId];
    if (!winnerTeam) return '';

    const playerPIMap: Record<string, number> = {};

    series.matches.forEach(match => {
      if (match.boxScore) {
        const box = match.homeTeamId === winnerId ? match.boxScore.home : match.boxScore.away;
        if (box) {
          box.forEach(entry => {
            // Standard PI formula: PTS + 1.2*REB + 1.5*AST + 2.0*STL + 2.0*BLK + 0.5*PlusMinus
            const pi = entry.points + 
                       entry.rebounds * 1.2 + 
                       entry.assists * 1.5 + 
                       (entry.steals || 0) * 2.0 + 
                       (entry.blocks || 0) * 2.0 + 
                       (entry.plusMinus || 0) * 0.5;
            playerPIMap[entry.playerId] = (playerPIMap[entry.playerId] || 0) + pi;
          });
        }
      }
    });

    let mvpId = '';
    let maxPI = -99999;
    winnerTeam.roster.forEach(pid => {
      const piSum = playerPIMap[pid] || 0;
      if (piSum > maxPI) {
        maxPI = piSum;
        mvpId = pid;
      }
    });

    return mvpId;
  },

  checkAndAdvanceRound(state: FranchiseState) {
     const unfinished = state.playoffSeries.filter(s => !s.winnerId);
     if (unfinished.length > 0) return;

     const lastRound = Math.max(-1, ...state.playoffSeries.map(s => s.round));
     
     if (lastRound === 0) {
        // Play-In stage advancement logic
        const hasFinals = state.playoffSeries.some(s => s.id.includes('final'));
        if (!hasFinals) {
            // Generate Play-In Finals (Stage 2: Match C)
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
                    seed1: 8, // Loser of Game A gets 8th seed advantage and host
                    seed2: 9
                });
            });
            state.playoffSeries = [...state.playoffSeries, ...newSeries];
            
            // Auto-simulate if user not involved in the secondary match
            this.simulateNextPlayoffStep(state);
            return;
        }

        // Play-In Stage 2 is completely finished: Generate Playoffs Round 1
        state.phase = "playoffs";
        state.playoffSeries = [...state.playoffSeries, ...this.generateInitialBracket(state)];
     } else if (lastRound === 1) {
        // Round 1 -> Semis
        this.generateNextRound(state, 2);
     } else if (lastRound === 2) {
        // Semis -> Conference Finals
        this.generateNextRound(state, 3);
     } else if (lastRound === 3) {
        // Conference Finals completed -> NBA Finals
        const eastSeries = state.playoffSeries.find(s => s.round === 3 && s.conference === 'East')!;
        const westSeries = state.playoffSeries.find(s => s.round === 3 && s.conference === 'West')!;

        // 1. Calculate Conference Finals MVP (CFMVP) based on Round 3 stats
        const eastCFMVP = this.calculateSeriesMvp(state, eastSeries);
        const westCFMVP = this.calculateSeriesMvp(state, westSeries);

        if (!state.awards[state.season]) {
          state.awards[state.season] = {} as any;
        }
        state.awards[state.season].eastFinalsMvp = eastCFMVP;
        state.awards[state.season].westFinalsMvp = westCFMVP;

        // Save trophy indicators if human players are conference winners
        if (!state.trophyCase) state.trophyCase = [];
        if (state.teams[eastSeries.winnerId!].isHuman && eastCFMVP) {
          state.trophyCase.push({
            type: 'CFMVP',
            season: state.season,
            playerId: eastCFMVP,
            label: 'Eastern Conference Finals MVP'
          });
        }
        if (state.teams[westSeries.winnerId!].isHuman && westCFMVP) {
          state.trophyCase.push({
            type: 'CFMVP',
            season: state.season,
            playerId: westCFMVP,
            label: 'Western Conference Finals MVP'
          });
        }

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
        state.awards[state.season] = {} as any;
      }
      state.awards[state.season].championId = finals.winnerId;

      // NBA Finals MVP award based on Finals series PI
      const fmvpId = this.calculateSeriesMvp(state, finals);
      state.awards[state.season].finalsMvp = fmvpId;

      const champTeam = state.teams[finals.winnerId];
      if (!state.trophyCase) state.trophyCase = [];
      if (champTeam.isHuman) {
        const hasTrophy = state.trophyCase.some(t => t.type === 'CHAMP' && t.season === state.season);
        if (!hasTrophy) {
          state.trophyCase.push({
            type: 'CHAMP',
            season: state.season,
            label: `${state.season} WORLD CHAMPIONS`
          });
        }

        if (fmvpId) {
          state.trophyCase.push({
              type: 'FMVP',
              season: state.season,
              playerId: fmvpId,
              label: 'Finals MVP'
          });
        }
      }
    }
  }
};
