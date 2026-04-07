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
  const { collection, coins, updateGameState, updateGameStateAsync, unlockedAchievements, inventoryPacks, isSaving } = useGame();
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

  const checkAchievements = (newCollection: string[], currentCoins: number, currentUnlocked: string[] = [], newlyAddedCardIds: string[] = [], silent: boolean = false) => {
    let bonusCoins = 0;
    const newlyUnlocked: any[] = [];
    const unlockedSet = new Set(currentUnlocked || []);
    const newInventoryPacks: any[] = [];
    const newlyUnlockedIds: string[] = [];
    
    // We'll track the collection as we "add" cards one by one to see which one triggers what
    const tempCollection = [...newCollection.filter(id => !newlyAddedCardIds.includes(id))];
    const tempCollectionSet = new Set(tempCollection);

    const checkAll = (cardId: string | null) => {
      for (const ach of ACHIEVEMENTS) {
        if (!unlockedSet.has(ach.id) && !newlyUnlocked.some(a => a.id === ach.id)) {
          const tempState = {
            collection: [...tempCollection],
            coins: currentCoins,
            claimedDays: [],
            unlockedAchievements: currentUnlocked
          };

          if (ach.requirement(tempState, ALL_CARDS)) {
            const packRewardText = ach.rewardPacks ? ` & ${ach.rewardPacks.map(p => p.name).join(', ')}` : '';
            const rewardText = `+${ach.rewardCoins.toLocaleString()} Coins${packRewardText}`;
            
            const achievementData = {
              id: ach.id,
              title: ach.title,
              description: ach.description,
              reward: rewardText,
              icon: ach.icon,
              rewardCoins: ach.rewardCoins,
              rewardPacks: ach.rewardPacks,
              triggeredByCardId: cardId
            };
            
            newlyUnlocked.push(achievementData);
            newlyUnlockedIds.push(ach.id);
            
            if (!silent) {
              notify(achievementData);
              bonusCoins += ach.rewardCoins;
              if (ach.rewardPacks) {
                ach.rewardPacks.forEach(p => {
                  newInventoryPacks.push(p);
                });
              }
            }
          }
        }
      }

      // Team Master checks
      const relevantTeams = cardId 
        ? [ALL_CARDS.find(c => c.id === cardId)?.team].filter(Boolean) as string[]
        : ALL_TEAMS;

      for (const team of relevantTeams) {
        const achievementId = `team-master-${team}`;
        if (!unlockedSet.has(achievementId) && !newlyUnlocked.some(a => a.id === achievementId)) {
          const teamCardIds = TEAM_CARDS_MAP[team];
          const hasAll = teamCardIds.every(id => tempCollectionSet.has(id));
          if (hasAll) {
            const achievementData = {
              id: achievementId,
              title: `Team Master: ${team}`,
              description: `Collected every card from the ${team}`,
              reward: "+1 MVP Pack",
              packReward: { id: 'mvp-pack', type: 'mvp' as PackType, name: 'MVP Pack' },
              triggeredByCardId: cardId
            };

            newlyUnlocked.push(achievementData);
            newlyUnlockedIds.push(achievementId);
            
            if (!silent) {
              notify(achievementData);
              newInventoryPacks.push(achievementData.packReward);
            }
          }
        }
      }
    };

    // First check if any were already satisfied (unlikely but safe)
    checkAll(null);

    // Then check card by card
    for (const cardId of newlyAddedCardIds) {
      tempCollection.push(cardId);
      tempCollectionSet.add(cardId);
      checkAll(cardId);
    }

    return { newlyUnlocked, bonusCoins, newInventoryPacks, newlyUnlockedIds };
  };

  const openPack = async (packType: PackType) => {
    let currentCoins = coins;
    if (packType !== 'random') {
      const price = PACK_PRICES[packType];
      if (currentCoins < price) return null;
      currentCoins -= price;
    } else {
      // Daily Stimulus
      currentCoins += 500;
    }

    const newCards = Array.from({ length: PACK_SIZES[packType] }).map(() => generateCard(packType));
    const newIds = newCards.map(c => c.id);
    
    // Determine which cards are new BEFORE adding to collection
    const cardsWithNewFlag = newCards.map(card => ({
      ...card,
      isNew: !collection.includes(card.id)
    }));

    const finalCollection = [...collection, ...newIds];
    
    // Check achievements
    const { newlyUnlocked, bonusCoins, newInventoryPacks, newlyUnlockedIds } = checkAchievements(finalCollection, currentCoins, unlockedAchievements, newIds, false);

    // Corrected inventory merge
    const updatedInventory = [...inventoryPacks]; // Get current inventory
    newInventoryPacks.forEach(pack => {
      const existing = updatedInventory.find(p => p.id === pack.id);
      if (existing) {
        existing.count += 1;
      } else {
        updatedInventory.push({ ...pack, count: 1 });
      }
    });

    // Batch update everything in ONE single call to ensure ONE cloud request
    await updateGameStateAsync({
      coins: currentCoins + bonusCoins,
      collection: finalCollection,
      unlockedAchievements: [...unlockedAchievements, ...newlyUnlockedIds],
      inventoryPacks: updatedInventory
    });

    return { cards: cardsWithNewFlag, newlyUnlocked };
  };

  const openInventoryPack = async (packId: string, packType: PackType) => {
    const newCards = Array.from({ length: PACK_SIZES[packType] }).map(() => generateCard(packType));
    const newIds = newCards.map(c => c.id);
    
    // Determine which cards are new BEFORE adding to collection
    const cardsWithNewFlag = newCards.map(card => ({
      ...card,
      isNew: !collection.includes(card.id)
    }));

    const finalCollection = [...collection, ...newIds];
    
    // Check achievements
    const { newlyUnlocked, bonusCoins, newInventoryPacks, newlyUnlockedIds } = checkAchievements(finalCollection, coins, unlockedAchievements, newIds, false);

    // Handle inventory removal and additions
    const currentInventory = [...inventoryPacks];
    const packIndex = currentInventory.findIndex(p => p.id === packId);
    if (packIndex !== -1) {
      if (currentInventory[packIndex].count > 1) {
        currentInventory[packIndex].count -= 1;
      } else {
        currentInventory.splice(packIndex, 1);
      }
    }

    newInventoryPacks.forEach(pack => {
      const existing = currentInventory.find(p => p.id === pack.id);
      if (existing) {
        existing.count += 1;
      } else {
        currentInventory.push({ ...pack, count: 1 });
      }
    });

    await updateGameStateAsync({
      coins: coins + bonusCoins,
      collection: finalCollection,
      unlockedAchievements: [...unlockedAchievements, ...newlyUnlockedIds],
      inventoryPacks: currentInventory
    });

    return { cards: cardsWithNewFlag, newlyUnlocked };
  };

  const generateDraftOptions = (count: number, position: string | null, excludedIds: string[], isElite: boolean = false): Card[] => {
    const options: Card[] = [];
    const seenIds = new Set(excludedIds);

    for (let i = 0; i < count; i++) {
      let selectedRarity: Rarity = 'bench';
      
      if (isElite) {
        // Elite pool: Legend, Franchise, Record, etc.
        const eliteRarities: Rarity[] = ['legend', 'franchise', 'record', 'allstar'];
        selectedRarity = eliteRarities[Math.floor(Math.random() * eliteRarities.length)];
      } else {
        // Weighted RNG
        const rand = Math.random() * 100;
        if (rand < 70) {
          selectedRarity = Math.random() > 0.5 ? 'bench' : 'starter';
        } else if (rand < 95) {
          selectedRarity = Math.random() > 0.5 ? 'allstar' : 'franchise';
        } else {
          const superRarities: Rarity[] = ['legend', 'roty', 'dpoy', 'record'];
          selectedRarity = superRarities[Math.floor(Math.random() * superRarities.length)];
        }
      }

      let pool = ALL_CARDS.filter(c => {
        if (seenIds.has(c.id)) return false;
        if (c.rarity === 'coach') return false; // No coaches in player draft
        // Exclude multi-player cards strictly
        if (['Duo', 'Dynasty', 'Big Three'].includes(c.category)) return false; 
        if (position && c.position !== position) return false;
        if (!isElite && c.rarity !== selectedRarity) return false;
        if (isElite && !['legend', 'franchise', 'record', 'allstar'].includes(c.rarity)) return false;
        return true;
      });

      // Fallback if pool is too small - try to keep position strictness
      if (pool.length === 0) {
        pool = ALL_CARDS.filter(c => {
          if (seenIds.has(c.id)) return false;
          if (c.rarity === 'coach') return false;
          if (['Duo', 'Dynasty', 'Big Three'].includes(c.category)) return false;
          if (position && c.position !== position) return false; // Still try to match position
          return true;
        });
      }

      // Final fallback if still empty (very unlikely)
      if (pool.length === 0) {
        pool = ALL_CARDS.filter(c => !seenIds.has(c.id) && c.rarity !== 'coach');
      }

      const selectedCard = pool[Math.floor(Math.random() * pool.length)];
      if (selectedCard) {
        options.push(selectedCard);
        seenIds.add(selectedCard.id);
      }
    }

    return options;
  };

  return { openPack, openInventoryPack, generateDraftOptions, PACK_SIZES, isSaving };
}
