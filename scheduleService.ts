import { FranchiseMatch, TeamObject } from '../types';

export const scheduleService = {
  generateSchedule(teams: Record<string, TeamObject>): FranchiseMatch[] {
    const teamIds = Object.keys(teams);
    const schedule: FranchiseMatch[] = [];
    const gamesPerTeam = 82;
    const matchups: Record<string, number> = {};

    teamIds.forEach(id => matchups[id] = 0);

    // This is a simplified schedule generator for the browser environment
    // In a real NBA season it's 82 games based on conference/division
    // Here we ensure each team hits exactly 82 games
    
    let gameCounter = 1;
    
    for (let i = 0; i < teamsPerConference(teams, 'East').length * 41; i++) {
        // We'll generate games in "rounds"
        const shuffled = [...teamIds].sort(() => Math.random() - 0.5);
        const paired = new Set<string>();

        for (const homeId of shuffled) {
            if (paired.has(homeId) || matchups[homeId] >= gamesPerTeam) continue;
            
            // Find an opponent (prefer conference, then division, etc - but keeping it simple for V2.0 performance)
            const awayId = shuffled.find(id => 
                id !== homeId && 
                !paired.has(id) && 
                matchups[id] < gamesPerTeam
            );

            if (awayId) {
                schedule.push({
                    id: `g_${gameCounter++}`,
                    homeTeamId: homeId,
                    awayTeamId: awayId,
                    gameNumber: Math.max(matchups[homeId], matchups[awayId]) + 1,
                    played: false
                });
                matchups[homeId]++;
                matchups[awayId]++;
                paired.add(homeId);
                paired.add(awayId);
            }
        }
    }

    return schedule.sort((a, b) => a.gameNumber - b.gameNumber);
  }
};

function teamsPerConference(teams: Record<string, TeamObject>, conf: 'East' | 'West') {
    return Object.values(teams).filter(t => t.conference === conf);
}
