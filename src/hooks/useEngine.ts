import { useGame } from '../context/GameContext';
import { useNotification } from '../context/NotificationContext';
import { ALL_CARDS, CARDS_BY_RARITY, CARDS_BY_SERIES } from '../data/cards';
import { Card, Rarity } from '../types';
import { ACHIEVEMENTS } from '../constants/achievements';

export type PackType = 'random' | 'rookie' | 'allstar' | 'mvp' | 'hof' | 'legendary_mvp';

export const DROP_RATES: Record<PackType, { rarity: Rarity; rate: number }[]> = {
  random: [
    { rarity: 'bench', rate: 70 },
    { rarity: 'starter', rate: 18 },
    { rarity: 'allstar', rate: 5 },
    { rarity: 'franchise', rate: 1.5 },
    { rarity: 'legend', rate: 0.5 },
    { rarity: 'roty', rate: 0.5 },
    { rarity: 'coach', rate: 5 },
  ],
  rookie: [
    { rarity: 'bench', rate: 55 },
    { rarity: 'starter', rate: 25 },
    { rarity: 'allstar', rate: 10 },
    { rarity: 'franchise', rate: 4 },
    { rarity: 'legend', rate: 1 },
    { rarity: 'roty', rate: 1 },
    { rarity: 'coach', rate: 5 },
  ],
  allstar: [
    { rarity: 'bench', rate: 35 },
    { rarity: 'starter', rate: 35 },
    { rarity: 'allstar', rate: 15 },
    { rarity: 'franchise', rate: 8 },
    { rarity: 'legend', rate: 2 },
    { rarity: 'roty', rate: 2 },
    { rarity: 'coach', rate: 5 },
  ],
  mvp: [
    { rarity: 'bench', rate: 15 },
    { rarity: 'starter', rate: 40 },
    { rarity: 'allstar', rate: 25 },
    { rarity: 'franchise', rate: 12 },
    { rarity: 'legend', rate: 3 },
    { rarity: 'roty', rate: 3 },
    { rarity: 'coach', rate: 5 },
  ],
  hof: [
    { rarity: 'bench', rate: 5 },
    { rarity: 'starter', rate: 10 },
    { rarity: 'allstar', rate: 40 },
    { rarity: 'franchise', rate: 30 },
    { rarity: 'legend', rate: 10 },
    { rarity: 'roty', rate: 10 },
    { rarity: 'coach', rate: 5 },
  ],
  legendary_mvp: [
    { rarity: 'legend', rate: 100 },
  ],
};

const PACK_SIZES: Record<PackType, number> = {
  random: 5,
  rookie: 3,
  allstar: 4,
  mvp: 5,
  hof: 3,
  legendary_mvp: 1,
};

export const PACK_PRICES: Record<Exclude<PackType, 'random'>, number> = {
  rookie: 1000,
  allstar: 5000,
  mvp: 25000,
  hof: 100000,
  legendary_mvp: 250000,
};

// Pre-calculate pools for series-specific packs
const LEGENDARY_MVP_POOL = ALL_CARDS.filter(c => c.series === 'Legendary MVP Series');

// Pre-calculate team card maps for faster achievement checking
const TEAM_CARDS_MAP = ALL_CARDS.reduce((acc, card) => {
  if (!acc[card.team]) acc[card.team] = [];
  acc[card.team].push(card.id);
  return acc;
}, {} as Record<string, string[]>);

const ALL_TEAMS = Object.keys(TEAM_CARDS_MAP);

export function useEngine() {
  const { collection, coins, setCoins, addToCollection, unlockedAchievements, unlockAchievement, addPackToInventory, removePackFromInventory } = useGame();
  const { notify } = useNotification();

  const generateCard = (packType: PackType): Card => {
    const rates = DROP_RATES[packType];
    const rand = Math.random() * 100;
    let cumulative = 0;
    let selectedRarity: Rarity = 'bench';

    for (const { rarity, rate } of rates) {
      cumulative += rate;
      if (rand <= cumulative) {
        selectedRarity = rarity;
        break;
      }
    }

    let pool: Card[] = [];
    
    // Series-specific packs
    if (packType === 'legendary_mvp') {
      pool = LEGENDARY_MVP_POOL;
    } else {
      // Standard rarity-based generation
      pool = CARDS_BY_RARITY[selectedRarity] || [];
    }
    
    // Fallback if rarity pool is empty
    if (pool.length === 0) {
      pool = CARDS_BY_RARITY['bench'];
    }

    return pool[Math.floor(Math.random() * pool.length)];
  };

  const checkAchievements = (newCollection: string[], currentCoins: number, currentUnlocked: string[] = [], newlyAddedCardIds: string[] = []) => {
    let bonusCoins = 0;
    const newlyUnlocked: string[] = [];
    const unlockedSet = new Set(currentUnlocked || []);
    const collectionSet = new Set(newCollection);

    // Check all achievements from the constants list
    for (const ach of ACHIEVEMENTS) {
      if (!unlockedSet.has(ach.id) && !newlyUnlocked.includes(ach.id)) {
        // Create a temporary state to check the requirement
        const tempState = {
          collection: newCollection,
          coins: currentCoins,
          claimedDays: [],
          unlockedAchievements: currentUnlocked
        };

        if (ach.requirement(tempState, ALL_CARDS)) {
          newlyUnlocked.push(ach.id);
          unlockAchievement(ach.id);
          
          notify({
            id: ach.id,
            title: ach.title,
            description: ach.description,
            reward: ach.packReward ? `+${ach.reward} Coins & ${ach.packReward.name}` : `+${ach.reward} Coins`,
            icon: ach.icon
          });

          bonusCoins += ach.reward;
          if (ach.packReward) {
            addPackToInventory(ach.packReward);
          }
        }
      }
    }

    // Special Achievement: Team Master (Dynamic for each team)
    // Only check teams that are relevant to the newly added cards to save cycles
    const relevantTeams = newlyAddedCardIds.length > 0 
      ? Array.from(new Set(newlyAddedCardIds.map(id => ALL_CARDS.find(c => c.id === id)?.team).filter(Boolean))) as string[]
      : ALL_TEAMS;

    for (const team of relevantTeams) {
      const achievementId = `team-master-${team}`;
      if (!unlockedSet.has(achievementId) && !newlyUnlocked.includes(achievementId)) {
        const teamCardIds = TEAM_CARDS_MAP[team];
        const hasAll = teamCardIds.every(id => collectionSet.has(id));
        if (hasAll) {
          newlyUnlocked.push(achievementId);
          unlockAchievement(achievementId);
          
          notify({
            id: achievementId,
            title: `Team Master: ${team}`,
            description: `Collected every card from the ${team}`,
            reward: "+1 MVP Pack"
          });

          // Reward: 1 MVP Pack to inventory
          addPackToInventory({ id: 'mvp-pack', type: 'mvp', name: 'MVP Pack' });
        }
      }
    }

    if (bonusCoins > 0) setCoins(currentCoins + bonusCoins);
  };

  const openPack = (packType: PackType) => {
    let newCoins = coins;
    if (packType !== 'random') {
      const price = PACK_PRICES[packType];
      if (coins < price) return null;
      newCoins -= price;
    } else {
      // Daily Stimulus
      newCoins += 500;
    }

    setCoins(newCoins);

    const newCards = Array.from({ length: PACK_SIZES[packType] }).map(() => generateCard(packType));
    const newIds = newCards.map(c => c.id);
    
    // Determine which cards are new BEFORE adding to collection
    const cardsWithNewFlag = newCards.map(card => ({
      ...card,
      isNew: !collection.includes(card.id)
    }));

    addToCollection(newIds);
    
    // Check achievements with the state that will exist after this update
    checkAchievements([...collection, ...newIds], newCoins, unlockedAchievements, newIds);

    return cardsWithNewFlag;
  };

  const openInventoryPack = (packId: string, packType: PackType) => {
    const newCards = Array.from({ length: PACK_SIZES[packType] }).map(() => generateCard(packType));
    const newIds = newCards.map(c => c.id);
    
    // Determine which cards are new BEFORE adding to collection
    const cardsWithNewFlag = newCards.map(card => ({
      ...card,
      isNew: !collection.includes(card.id)
    }));

    removePackFromInventory(packId);
    addToCollection(newIds);
    
    // Check achievements with the state that will exist after this update
    checkAchievements([...collection, ...newIds], coins, unlockedAchievements, newIds);

    return cardsWithNewFlag;
  };

  return { openPack, openInventoryPack, PACK_SIZES };
}
