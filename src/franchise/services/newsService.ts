import { FranchiseState, FranchiseNotification, PlayerStats } from '../types';
import { ALL_CARDS } from '../../data/cards';

export const newsService = {
  // 2 — NOTICIAS Y EVENTOS DINÁMICOS EN EL FEED
  
  generatePerformanceNews(state: FranchiseState, playerId: string, gameStats: any): FranchiseNotification[] {
    const notifications: FranchiseNotification[] = [];
    const card = ALL_CARDS.find(c => c.id === playerId) || state.customCards?.find(c => c.id === playerId);
    if (!card) return [];

    // Triple-double check
    if (gameStats.points >= 10 && gameStats.rebounds >= 10 && gameStats.assists >= 10) {
      notifications.push({
        id: `td-${playerId}-${state.week}-${Date.now()}`,
        type: 'NEWS',
        category: 'PERFORMANCE',
        message: `📊 ${card.name} records a triple-double: ${gameStats.points} PTS / ${gameStats.rebounds} REB / ${gameStats.assists} AST.`,
        week: state.week,
        season: state.season,
        read: false
      });
    }

    // High scoring streak would need historical games but we can estimate or check season highs
    if (gameStats.points >= 30) {
        // Just as an example, we could check last 3 games if we stored game history
        // For now, let's keep it simple or based on triggers in gameService
    }

    return notifications;
  },

  generateStreakNews(state: FranchiseState, teamId: string, currentStreak: number, isWin: boolean): FranchiseNotification | null {
    const team = state.teams[teamId];
    if (!team) return null;

    if (currentStreak === 5) {
      return {
        id: `streak-5-${teamId}-${state.week}-${Date.now()}`,
        type: 'STREAK',
        category: 'PERFORMANCE',
        message: isWin ? `🏆 ${team.name} is on a 5-game winning streak!` : `📉 Tough times in ${team.name}. 5-game losing streak.`,
        week: state.week,
        season: state.season,
        read: false
      };
    }

    if (!team.isHuman && currentStreak === 8 && isWin) {
        return {
           id: `cpu-streak-8-${teamId}`,
           type: 'NEWS',
           category: 'CPU',
           message: `👀 ${team.name} looks unstoppable with 8-game winning streak.`,
           week: state.week,
           season: state.season,
           read: false
        };
    }

    return null;
  },

  generateInjuryNews(state: FranchiseState): FranchiseNotification | null {
    const userTeam = state.teams[state.userTeamId];
    if (!userTeam || userTeam.roster.length === 0) return null;

    // Logic: Every 15 games (called from advanceWeek or similar)
    // Prob 8% generally, 15% if age > 32
    const roll = Math.random();
    const players = userTeam.roster.map(id => ({ id, age: state.playerProgress[id]?.age || 25 }));
    const targetPlayer = players[Math.floor(Math.random() * players.length)];
    
    const prob = targetPlayer.age > 32 ? 0.15 : 0.08;

    if (roll < prob) {
       const injuryTypes = ['ankle sprain', 'knee soreness', 'back tightness', 'hamstring strain', 'wrist injury'];
       const type = injuryTypes[Math.floor(Math.random() * injuryTypes.length)];
       const weeks = Math.floor(Math.random() * 3) + 1;
       
       const card = ALL_CARDS.find(c => c.id === targetPlayer.id) || state.customCards?.find(c => c.id === targetPlayer.id);
       
       // Update player state
       if (state.playerProgress[targetPlayer.id]) {
          state.playerProgress[targetPlayer.id].injuryWeeks = weeks;
          state.playerProgress[targetPlayer.id].injuryType = type;
       }

       return {
         id: `inj-${targetPlayer.id}-${Date.now()}`,
         type: 'INJURY',
         category: 'INJURY',
         message: `🚑 INJURY: ${card?.name || 'A player'} is out for ${weeks} games with a ${type}.`,
         week: state.week,
         season: state.season,
         read: false
       };
    }

    return null;
  },

  generateRumorNews(state: FranchiseState): FranchiseNotification | null {
    // Random rumors once per season
    const teams = Object.values(state.teams).filter(t => !t.isHuman);
    const team = teams[Math.floor(Math.random() * teams.length)];
    const starId = team.roster.sort((a,b) => (state.playerProgress[b]?.ovr || 0) - (state.playerProgress[a]?.ovr || 0))[0];
    const card = ALL_CARDS.find(c => c.id === starId);

    const types = [
        `👀 RUMOR: ${card?.name} reportedly unhappy with ${team.abbreviation}. Trade rumors heating up.`,
        `💰 CONTRACT STANDOFF: ${card?.name} and ${team.abbreviation} far apart on contract extension talks.`,
        `🌟 BREAKOUT ALERT: A young star in ${team.name} is having a career year.`
    ];

    return {
        id: `rumor-${Date.now()}`,
        type: 'RUMOR',
        category: 'RUMOR',
        message: types[Math.floor(Math.random() * types.length)],
        week: state.week,
        season: state.season,
        read: false
    };
  },

  checkMilestones(state: FranchiseState): FranchiseNotification[] {
    const notifications: FranchiseNotification[] = [];
    const userTeam = state.teams[state.userTeamId];
    
    userTeam.roster.forEach(id => {
       const careerStats = state.stats.career[id];
       const seasonalStats = state.stats.seasonal[id];
       const totalPoints = (careerStats?.points || 0) + (seasonalStats?.points || 0);

       if (totalPoints >= 1000) {
          // Check if already notified (we could flag this in progress)
          // Simple check: only if they cross it this week?
          // For now let's just do it if they are around 1000-1030
          if (totalPoints >= 1000 && totalPoints < 1050) {
             const card = ALL_CARDS.find(c => c.id === id);
             notifications.push({
                id: `milestone-1000-${id}`,
                type: 'MILESTONE',
                category: 'MILESTONE',
                message: `🎉 MILESTONE: ${card?.name} reaches 1,000 career points with ${userTeam.name}!`,
                week: state.week,
                season: state.season,
                read: false
             });
          }
       }
    });

    return notifications;
  }
};
