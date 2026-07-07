import { ALL_CARDS } from '../../data/cards';
import { Card } from '../../types';
import { TeamObject, FranchiseState, BoxScoreEntry, MatchResult } from '../types';

let _cardCache: Map<string, Card> | null = null;

function findCard(id: string, state: FranchiseState): Card | undefined {
  if (!_cardCache) {
    _cardCache = new Map();
    ALL_CARDS.forEach(c => _cardCache!.set(c.id, c));
  }
  const cached = _cardCache.get(id);
  if (cached) {
    if (!id.startsWith('draft_') && !id.startsWith('custom_')) return cached;
  }
  const custom = state.customCards?.find(c => c.id === id);
  if (custom) return custom;
  const draft = state.draftPool?.find(c => c.id === id);
  if (draft) return draft;
  
  return cached;
}

function getAdjustedOvr(card: Card, state: FranchiseState): number {
  const progress = state.playerProgress[card.id];
  const baseOvr = progress?.ovr || card.stats.ovr;
  const form = progress?.form || 1.0;
  
  let ovr = baseOvr * form;
  
  // Apply a dynamic debuff if the player has active attribute modifiers from an injury
  if (progress?.attributeModifiers) {
    const spdMod = progress.attributeModifiers.spd ?? 1.0;
    const jmpMod = progress.attributeModifiers.jmp ?? 1.0;
    const endMod = progress.attributeModifiers.endu ?? 1.0;
    const avgMod = (spdMod + jmpMod + endMod) / 3;
    ovr *= avgMod;
  }
  
  return Math.max(40, Math.round(ovr));
}

function calculateTeamPower(team: TeamObject, state: FranchiseState, isHome: boolean): number {
  const starters = [
      team.lineup.PG, team.lineup.SG, team.lineup.SF, team.lineup.PF, team.lineup.C
  ].map(id => id ? findCard(id, state) : null);

  const bench = team.lineup.bench.map(id => id ? findCard(id, state) : null).filter(Boolean);

  const starterOvr = starters.length > 0 
    ? starters.reduce((sum, c) => sum + (c ? getAdjustedOvr(c, state) : 60), 0) / starters.length 
    : 60;
    
  const benchOvr = bench.length > 0 
    ? bench.reduce((sum, c) => sum + (c ? getAdjustedOvr(c!, state) : 60), 0) / bench.length 
    : 60;

  let power = (starterOvr * 0.7) + (benchOvr * 0.3);

  if (isHome) power *= 1.025;
  if (team.payroll > 165000000) power *= 0.95;

  return power;
}

function generateBoxScore(
  team: TeamObject,
  totalPoints: number,
  state: FranchiseState,
  teamPlusMinus: number,
  minutesPlayed?: Record<string, number>
): BoxScoreEntry[] {
  try {
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
      if (r < 0.60) return 0.75 + Math.random() * 0.50;
      if (r < 0.85) return Math.random() > 0.5 ? (0.50 + Math.random() * 0.25) : (1.25 + Math.random() * 0.35);
      if (r < 0.95) return Math.random() > 0.5 ? (0.30 + Math.random() * 0.20) : (1.60 + Math.random() * 0.40);
      return 2.0 + Math.random() * 0.50;
    };

    const playerData = players.map(p => {
      const card = findCard(p.id!, state);
      // Use simulated minutes from the match core if available
      const mins = minutesPlayed && minutesPlayed[p.id!] !== undefined 
        ? minutesPlayed[p.id!] 
        : (p.role === 'starter' ? 28 + Math.floor(Math.random() * 11) : 10 + Math.floor(Math.random() * 13));
      return { id: p.id!, role: p.role, card, mins };
    });

    const rawScores = playerData.map(p => {
       if (p.mins <= 0) return 0;
       const progress = state.playerProgress[p.id!] || { form: 1.0, ovr: p.card?.stats.ovr || 60 };
       const currentOvr = progress.ovr || p.card?.stats.ovr || 60;
       const baseOvr = p.card?.stats.ovr || 60;
       const ovrMod = currentOvr / baseOvr;
       
       const basePPG = p.card?.stats.points || (currentOvr > 85 ? 25 : currentOvr > 75 ? 18 : currentOvr > 65 ? 10 : 5);
       const raw = (basePPG / 34) * p.mins * getDistributionFactor() * ovrMod * progress.form;
       return raw;
     });

    const currentTotalRaw = rawScores.reduce((a, b) => a + b, 0);
    const normalizationFactor = totalPoints / (currentTotalRaw || 1);

    playerData.forEach((p, idx) => {
        const progress = state.playerProgress[p.id] || { form: 1.0, ovr: p.card?.stats.ovr || 60 };
        const currentOvr = progress.ovr || p.card?.stats.ovr || 60;
        const baseOvr = p.card?.stats.ovr || 60;
        const ovrMod = currentOvr / baseOvr;
        
        let pts = p.mins > 0 ? Math.round(rawScores[idx] * normalizationFactor) : 0;
        
        const rebFactor = getDistributionFactor();
        const astFactor = getDistributionFactor();

        const baseReb = p.card?.stats.rebounds || (currentOvr > 80 ? 8 : 4);
        const baseAst = p.card?.stats.assists || (currentOvr > 80 ? 7 : 3);

        const reb = p.mins > 0 ? Math.max(0, Math.round((baseReb / 34) * p.mins * rebFactor * ovrMod)) : 0;
        const ast = p.mins > 0 ? Math.max(0, Math.round((baseAst / 34) * p.mins * astFactor * ovrMod)) : 0;
        
        const stl = p.mins > 0 && Math.random() > (0.6 / progress.form) ? Math.floor(Math.random() * 3) + (p.role === 'starter' ? 1 : 0) : 0;
        const blk = p.mins > 0 && Math.random() > (0.7 / progress.form) ? Math.floor(Math.random() * 3) + (p.card?.position === 'C' ? 1 : 0) : 0;
        
        const individualPM = p.mins > 0 ? Math.round((teamPlusMinus * (p.mins / 48)) + (Math.random() * 10 - 5)) : 0;

        entries.push({
            playerId: p.id,
            name: p.card?.name || `Player ${idx + 1}`,
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
  } catch (error) {
    console.error("[BOX SCORE ERROR] Fallback generated:", error);
    return [];
  }
}

export const simulationEngine = {
  simulateMatch(homeTeam: TeamObject, awayTeam: TeamObject, state: FranchiseState): MatchResult {
    try {
      // 1 — Ensure minimum roster capacity (60 OVR fictional players)
      const ensureRoster = (team: TeamObject) => {
        const roster = [...team.roster];
        while (roster.length < 5) {
          const fakeId = `fake_${team.teamId}_${roster.length}`;
          roster.push(fakeId);
          if (!state.playerProgress[fakeId]) {
            state.playerProgress[fakeId] = { age: 25, potential: 60, form: 1.0, ovr: 60 };
          }
        }
        return { ...team, roster };
      };

      const hTeam = ensureRoster(homeTeam);
      const aTeam = ensureRoster(awayTeam);

      // Initialize progress, age and attributes for simulation-relevant players in state
      const processRosterProgress = (team: TeamObject) => {
        team.roster.forEach(pid => {
          if (!state.playerProgress[pid]) {
            state.playerProgress[pid] = { age: 23 + Math.floor(Math.random() * 12), potential: 80, form: 1.0, ovr: 75 };
          }
          const progress = state.playerProgress[pid];
          const card = findCard(pid, state);
          if (!progress.attributes) {
            // Generate position-based player attributes automatically matching standard specs
            const baseOvr = progress.ovr || card?.stats?.ovr || 75;
            const pos = card?.position || 'SF';
            const isC = pos.includes('C');
            const isPF = pos.includes('PF') || pos.includes('F');
            const isPG = pos.includes('PG') || pos.includes('G');

            progress.attributes = {
              spd: Math.max(30, Math.min(99, isPG ? Math.round(baseOvr * 1.1) : isC ? Math.round(baseOvr * 0.70) : Math.round(baseOvr * 0.90))),
              jmp: Math.max(30, Math.min(99, isC || isPF ? Math.round(baseOvr * 1.05) : Math.round(baseOvr * 0.90))),
              endu: Math.max(30, Math.min(99, Math.round(baseOvr * 0.95))),
              durability: Math.max(30, Math.min(99, Math.round(70 + Math.random() * 25))),
              ins: Math.max(30, Math.min(99, isC || isPF ? Math.round(baseOvr * 1.10) : Math.round(baseOvr * 0.75))),
              mid: Math.max(30, Math.min(99, Math.round(baseOvr * 0.90))),
              out: Math.max(30, Math.min(99, isPG ? Math.round(baseOvr * 1.05) : isC ? Math.round(baseOvr * 0.50) : Math.round(baseOvr * 0.90))),
              def: Math.max(30, Math.min(99, Math.round(baseOvr * 0.95))),
              reb: Math.max(30, Math.min(99, isC || isPF ? Math.round(baseOvr * 1.15) : Math.round(baseOvr * 0.70))),
              ast: Math.max(30, Math.min(99, isPG ? Math.round(baseOvr * 1.10) : Math.round(baseOvr * 0.70))),
              stl: Math.max(30, Math.min(99, isPG ? Math.round(baseOvr * 1.05) : Math.round(baseOvr * 0.75))),
              blk: Math.max(30, Math.min(99, isC || isPF ? Math.round(baseOvr * 1.10) : Math.round(baseOvr * 0.65))),
              ft: Math.max(30, Math.min(99, Math.round(baseOvr * 0.85))),
              handle: Math.max(30, Math.min(99, isPG ? Math.round(baseOvr * 1.10) : Math.round(baseOvr * 0.75))),
              iq: Math.max(30, Math.min(99, Math.round(baseOvr * 0.90))),
              stre: Math.max(30, Math.min(99, isC || isPF ? Math.round(baseOvr * 1.15) : Math.round(baseOvr * 0.80))),
              dnk: Math.max(30, Math.min(99, isC || isPF || pos.includes('SF') ? Math.round(baseOvr * 1.05) : Math.round(baseOvr * 0.75)))
            };
          }
        });
      };

      processRosterProgress(hTeam);
      processRosterProgress(aTeam);

      // Determine Roster Availability and apply the "Critical Fatigue" bypass if active < 8
      const getActiveAndBypassedRoster = (team: TeamObject) => {
        const activeIds: string[] = [];
        const criticalFatigueIds = new Set<string>();

        // Healthy players
        team.roster.forEach(pid => {
          const prog = state.playerProgress[pid];
          const isHealthy = !prog || (!prog.injuryWeeks && !prog.injury);
          if (isHealthy) {
            activeIds.push(pid);
          }
        });

        // Check if roster falls below 8 active players. If so, apply "Fatiga Crítica" bypass
        if (activeIds.length < 8) {
          const injuredPlayers = team.roster
            .map(pid => ({ id: pid, prog: state.playerProgress[pid] }))
            .filter(p => p.prog && (p.prog.injuryWeeks || p.prog.injury));

          // Filter on mild injuries (leve / mild / minor)
          const mildInjured = injuredPlayers.filter(p => {
            const severity = p.prog.injurySeverity || p.prog.injury?.severity || '';
            const type = p.prog.injuryType || p.prog.injury?.type || '';
            const matchesMild = severity.toLowerCase() === 'mild' || severity.toLowerCase() === 'leve' || severity.toLowerCase() === 'day-to-day';
            const isSevere = severity.toLowerCase() === 'severe' || severity.toLowerCase() === 'grave' || severity.toLowerCase() === 'season-ending' || type.toLowerCase().includes('torn');
            return matchesMild || !isSevere;
          });

          // Sort by games/weeks remaining ascending
          mildInjured.sort((a, b) => {
            const aRem = a.prog.injuryWeeks || a.prog.injury?.gamesRemaining || 99;
            const bRem = b.prog.injuryWeeks || b.prog.injury?.gamesRemaining || 99;
            return aRem - bRem;
          });

          // Activate till we have 8 active, or we exhaust mild injured players
          while (activeIds.length < 8 && mildInjured.length > 0) {
            const topMild = mildInjured.shift()!;
            activeIds.push(topMild.id);
            criticalFatigueIds.add(topMild.id);
          }
        }

        return { activeIds, criticalFatigueIds };
      };

      const homeRosterInfo = getActiveAndBypassedRoster(hTeam);
      const awayRosterInfo = getActiveAndBypassedRoster(aTeam);

      const homePower = calculateTeamPower(hTeam, state, true);
      const awayPower = calculateTeamPower(aTeam, state, false);

      let homeScore = 0;
      let awayScore = 0;
      const homePeriods: number[] = [];
      const awayPeriods: number[] = [];

      const minutesPlayed: Record<string, number> = {};
      const matchIncurredInjuries = new Set<string>();

      hTeam.roster.forEach(pid => minutesPlayed[pid] = 0);
      aTeam.roster.forEach(pid => minutesPlayed[pid] = 0);

      // Select active / playable cohort for lineups
      const selectOnCourt = (team: TeamObject, availableIds: string[]) => {
        const onCourt: string[] = [];
        const availSet = new Set(availableIds);
        const slots = ['PG', 'SG', 'SF', 'PF', 'C'] as const;

        slots.forEach(pos => {
          const baseStarterId = team.lineup[pos];
          if (baseStarterId && availSet.has(baseStarterId)) {
            onCourt.push(baseStarterId);
            availSet.delete(baseStarterId);
          }
        });

        // Fill remaining court slots from available bench pool
        while (onCourt.length < 5 && availSet.size > 0) {
          const fallbackId = Array.from(availSet)[0];
          onCourt.push(fallbackId);
          availSet.delete(fallbackId);
        }

        // Hard failsafe
        while (onCourt.length < 5) {
          const fs = team.roster.find(id => !onCourt.includes(id)) || team.roster[0];
          onCourt.push(fs);
        }

        return onCourt.slice(0, 5);
      };

      let momentum = 1.0;
      
      // Simulate quarters and calculate injuries at the end of each quarter incrementally on-court
      for (let q = 1; q <= 4; q++) {
          const qHome = Math.round((homePower / 99) * 28 + (Math.random() * 8 - 4)) * momentum;
          const qAway = Math.round((awayPower / 99) * 28 + (Math.random() * 8 - 4)) * (2 - momentum);
          
          const hQ = Math.max(15, Math.round(qHome));
          const aQ = Math.max(15, Math.round(qAway));

          homePeriods.push(hQ);
          awayPeriods.push(aQ);
          homeScore += hQ;
          awayScore += aQ;

          const diff = homeScore - awayScore;
          if (diff > 10) momentum -= 0.05;
          if (diff < -10) momentum += 0.05;

          // Select five active players on court for both teams for this quarter
          const playableHomeIds = homeRosterInfo.activeIds.filter(id => !matchIncurredInjuries.has(id));
          const playableAwayIds = awayRosterInfo.activeIds.filter(id => !matchIncurredInjuries.has(id));

          const homeOnCourt = selectOnCourt(hTeam, playableHomeIds);
          const awayOnCourt = selectOnCourt(aTeam, playableAwayIds);

          // Increment minutes for players on court
          homeOnCourt.forEach(id => minutesPlayed[id] += 10);
          awayOnCourt.forEach(id => minutesPlayed[id] += 10);

          // Injury check for playing on-court players
          const allPlayersOnCourt = [...homeOnCourt.map(id => ({ id, team: hTeam, teamAbbr: hTeam.abbreviation })), ...awayOnCourt.map(id => ({ id, team: aTeam, teamAbbr: aTeam.abbreviation }))];
          
          allPlayersOnCourt.forEach(({ id, team, teamAbbr }) => {
            if (matchIncurredInjuries.has(id)) return;

            const progress = state.playerProgress[id];
            if (!progress) return;

            const card = findCard(id, state);
            const age = progress.age || card?.age || 25;
            const mins = minutesPlayed[id];
            const durability = progress.attributes?.durability || 75;

            // 1. Calculate Injury Probability using exact specs
            const P_base = 0.00015;
            // F_edad: Linear growth based on age (starts at 1.0 for age 20)
            const F_edad = 1.0 + Math.max(0, age - 20) * 0.05;
            // F_minutos: Exponential growth if minutes played exceed 38 minutes
            const F_minutos = mins > 38 ? Math.pow(1.18, mins - 38) : 1.0;
            // F_durabilidad: Mitigador based on durability of 0 to 100
            const F_durabilidad = Math.max(0.1, (110 - durability) / 100);

            const P_injury = P_base * F_edad * F_minutos * F_durabilidad;

            if (Math.random() < P_injury) {
              // 2. We have an injury event! Select severity and games duration
              const pRoll = Math.random();
              let severity: 'mild' | 'moderate' | 'severe' = 'mild';
              let gamesRemaining = 2;
              let injuryType = 'ankle sprain';
              let severityLabel = 'Mild';
              let modifier = 0.85;

              if (pRoll < 0.72) {
                // Mild: 72%
                severity = 'mild';
                gamesRemaining = 1 + Math.floor(Math.random() * 3);
                severityLabel = 'Mild';
                modifier = 0.85;
                const types = ['ankle sprain', 'knee soreness', 'finger sprain', 'wrist tightness'];
                injuryType = types[Math.floor(Math.random() * types.length)];
              } else if (pRoll < 0.95) {
                // Moderate: 23%
                severity = 'moderate';
                gamesRemaining = 4 + Math.floor(Math.random() * 9);
                severityLabel = 'Moderate';
                modifier = 0.65;
                const types = ['hamstring strain', 'calf strain', 'shoulder soreness', 'bruised ribs'];
                injuryType = types[Math.floor(Math.random() * types.length)];
              } else {
                // Severe: 5%
                severity = 'severe';
                gamesRemaining = 15 + Math.floor(Math.random() * 45);
                severityLabel = 'Severe';
                modifier = 0.40;
                const types = ['knee meniscus tear', 'achilles tightness', 'torn tendon', 'fractured wrist'];
                injuryType = types[Math.floor(Math.random() * types.length)];
              }

              matchIncurredInjuries.add(id);

              // 3. Superposición de Lesiones: Acumula periodos de inactividad aditivamente y aplica modificadores de atributos multiplicativamente
              const hasExistingInjury = (progress.injuryWeeks && progress.injuryWeeks > 0) || progress.injury;
              
              if (hasExistingInjury) {
                const currentRemaining = progress.injuryWeeks || progress.injury?.gamesRemaining || 0;
                gamesRemaining += currentRemaining;

                // Multiply existing modifiers with lower limit/floor of 15% (0.15)
                const currentMods = progress.attributeModifiers || { spd: 1.0, jmp: 1.0, endu: 1.0, stre: 1.0, dnk: 1.0 };
                progress.attributeModifiers = {
                  spd: Math.max(0.15, currentMods.spd * modifier),
                  jmp: Math.max(0.15, currentMods.jmp * modifier),
                  endu: Math.max(0.15, currentMods.endu * modifier),
                  stre: Math.max(0.15, (currentMods.stre ?? 1.0) * modifier),
                  dnk: Math.max(0.15, (currentMods.dnk ?? 1.0) * modifier)
                };
              } else {
                // Brand new modifiers set
                progress.attributeModifiers = {
                  spd: modifier,
                  jmp: modifier,
                  endu: modifier,
                  stre: modifier,
                  dnk: modifier
                };
              }

              // Update progress data structures
              progress.injuryWeeks = gamesRemaining;
              progress.injuryType = injuryType;
              progress.injurySeverity = severityLabel;
              progress.injury = {
                type: injuryType,
                severity: severity,
                gamesRemaining: gamesRemaining
              };

              // Notify the user of the live simulation injury
              const cardName = card?.name || 'A player';
              state.notifications.unshift({
                id: `inj-${id}-${Date.now()}`,
                type: 'INJURY',
                category: 'INJURY',
                message: `🚑 INJURY: ${cardName} (${teamAbbr}) is injured during the game! Out for ${gamesRemaining} games with a ${injuryType} (${severityLabel}).`,
                week: state.week,
                season: state.season,
                read: false
              });
            }
          });
      }

      if (homeScore === awayScore) {
          const ot = Math.random() > 0.5;
          if (ot) homeScore += 2; else awayScore += 2;
      }

      const winnerId = homeScore > awayScore ? hTeam.teamId : aTeam.teamId;
      const plusMinusDiff = homeScore - awayScore;

      // Decrement one game of injury remaining for ALL players of both playing teams at the end of every played game match
      const applyMatchRecovery = (team: TeamObject) => {
        team.roster.forEach(pid => {
          const progress = state.playerProgress[pid];
          if (!progress) return;

          // Only decrement if we didn't just injure them in this exact match
          if (matchIncurredInjuries.has(pid)) return;

          const isInjured = (progress.injuryWeeks && progress.injuryWeeks > 0) || progress.injury;

          if (isInjured) {
            let rem = progress.injuryWeeks || progress.injury?.gamesRemaining || 1;
            rem -= 1;
            
            if (rem <= 0) {
              // Full recovery!
              progress.injuryWeeks = 0;
              delete progress.injuryType;
              delete progress.injurySeverity;
              delete progress.attributeModifiers;
              delete progress.injury;

              const card = findCard(pid, state);
              state.notifications.unshift({
                id: `rec-${pid}-${Date.now()}`,
                type: 'NEWS',
                category: 'INJURY',
                message: `🎉 MEDICAL CLEARANCE: ${card?.name || 'A player'} (${team.abbreviation}) is fully recovered and cleared to play!`,
                week: state.week,
                season: state.season,
                read: false
              });
            } else {
              progress.injuryWeeks = rem;
              if (progress.injury) {
                progress.injury.gamesRemaining = rem;
              }
            }
          }
        });
      };

      applyMatchRecovery(hTeam);
      applyMatchRecovery(aTeam);

      return {
          winnerId,
          score: { home: homeScore, away: awayScore },
          periods: { home: homePeriods, away: awayPeriods },
          boxScore: {
              home: generateBoxScore(hTeam, homeScore, state, plusMinusDiff, minutesPlayed),
              away: generateBoxScore(aTeam, awayScore, state, -plusMinusDiff, minutesPlayed)
          }
      };
    } catch (error) {
      console.error("[SIMULATION ERROR] Fallback MatchResult triggered:", error);
      const hScore = 100 + Math.floor(Math.random() * 15);
      const aScore = 100 + Math.floor(Math.random() * 15);
      return {
        winnerId: hScore >= aScore ? homeTeam.teamId : awayTeam.teamId,
        score: { home: hScore, away: aScore },
        periods: { home: [25, 25, 25, hScore - 75], away: [25, 25, 25, aScore - 75] },
        boxScore: {
          home: generateBoxScore(homeTeam, hScore, state, hScore - aScore),
          away: generateBoxScore(awayTeam, aScore, state, aScore - hScore)
        }
      };
    }
  },

  findCard,
  clearCache() {
    _cardCache = null;
  }
};
