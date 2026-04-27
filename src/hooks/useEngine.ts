import { useGame } from '../context/GameContext';
import { useNotification } from '../context/NotificationContext';
import { ALL_CARDS, CARDS_BY_RARITY, CARDS_BY_SERIES } from '../data/cards';
import { Card, Rarity } from '../types';
import { ACHIEVEMENTS } from '../constants/achievements';

export type PackType = 'random' | 'rookie' | 'allstar' | 'mvp' | 'hof' | 'legendary_mvp' | 'rising_star';

export const DROP_RATES: Record<PackType, { rarity: Rarity; rate: number }[]> = {
  random: [
    { rarity: 'bench', rate: 78 },
    { rarity: 'starter', rate: 16 },
    { rarity: 'allstar', rate: 3 },
    { rarity: 'franchise', rate: 0.2 },
    { rarity: 'legend', rate: 0.05 },
    { rarity: 'roty', rate: 0.1 },
    { rarity: 'draft2026', rate: 0.1 },
    { rarity: 'rising_star', rate: 0.3 },
    { rarity: 'coach', rate: 2.25 },
  ],
  rookie: [
    { rarity: 'bench', rate: 65 },
    { rarity: 'starter', rate: 25 },
    { rarity: 'rookie', rate: 6 },
    { rarity: 'roty', rate: 1 },
    { rarity: 'draft2026', rate: 1 },
    { rarity: 'coach', rate: 2 },
  ],
  allstar: [
    { rarity: 'bench', rate: 45 },
    { rarity: 'starter', rate: 38 },
    { rarity: 'allstar', rate: 12 },
    { rarity: 'franchise', rate: 2 },
    { rarity: 'allnba_1st', rate: 1 },
    { rarity: 'scoring_champ', rate: 1 },
    { rarity: 'coach', rate: 1 },
  ],
  mvp: [
    { rarity: 'starter', rate: 55 },
    { rarity: 'allstar', rate: 25 },
    { rarity: 'franchise', rate: 10 },
    { rarity: 'legend', rate: 3 },
    { rarity: 'dpoy', rate: 3 },
    { rarity: 'record', rate: 2 },
    { rarity: 'coach', rate: 2 },
  ],
  hof: [
    { rarity: 'allstar', rate: 50 },
    { rarity: 'franchise', rate: 25 },
    { rarity: 'legend', rate: 10 },
    { rarity: 'hof', rate: 7.5 },
    { rarity: 'record', rate: 5 },
    { rarity: 'coach', rate: 2.5 },
  ],
  legendary_mvp: [
    { rarity: 'legend', rate: 100 },
  ],
  rising_star: [
    { rarity: 'rising_star', rate: 100 },
  ],
};

const PACK_SIZES: Record<PackType, number> = {
  random: 5,
  rookie: 3,
  allstar: 4,
  mvp: 5,
  hof: 3,
  legendary_mvp: 1,
  rising_star: 4,
};

export const PACK_PRICES: Record<Exclude<PackType, 'random'>, number> = {
  rookie: 1000,
  allstar: 5000,
  mvp: 25000,
  hof: 100000,
  legendary_mvp: 250000,
  rising_star: 50000,
};

// Pre-calculate pools for series-specific packs
const LEGENDARY_MVP_POOL = ALL_CARDS.filter(c => c.series === 'Legendary MVP Series');
const RISING_STAR_POOL = ALL_CARDS.filter(c => c.rarity === 'rising_star');

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
    } else if (packType === 'rising_star') {
      pool = RISING_STAR_POOL;
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

  const checkAchievements = (newCollection: Record<string, number>, currentCoins: number, currentUnlocked: string[] = [], newlyAddedCardIds: string[] = [], silent: boolean = false) => {
    let bonusCoins = 0;
    const newlyUnlocked: any[] = [];
    const unlockedSet = new Set(currentUnlocked || []);
    const newInventoryPacks: any[] = [];
    const newlyUnlockedIds: string[] = [];
    
    // We'll track the collection as we "add" cards one by one to see which one triggers what
    const tempCollection: Record<string, number> = {};
    Object.entries(newCollection).forEach(([id, count]) => {
      // Start with the collection MINUS the newly added ones
      const newlyAddedCount = newlyAddedCardIds.filter(newId => newId === id).length;
      if (count > newlyAddedCount) {
        tempCollection[id] = count - newlyAddedCount;
      }
    });

    const checkAll = (cardId: string | null) => {
      for (const ach of ACHIEVEMENTS) {
        if (!unlockedSet.has(ach.id) && !newlyUnlocked.some(a => a.id === ach.id)) {
          const tempState = {
            collection: tempCollection,
            coins: currentCoins,
            claimedDays: [],
            unlockedAchievements: currentUnlocked
          };

          // Re-map achievement requirement logic if it expects array
          // Usually they just check if ID is present
          if (ach.requirement(tempState as any, ALL_CARDS)) {
            const packRewardText = ach.rewardPacks ? ` & ${ach.rewardPacks.map(p => p.name).join(', ')}` : '';
            const rewardText = `+${ach.rewardCoins.toLocaleString()} Coins${packRewardText}`;
            
            const achievementData = {
              id: ach.id,
              title: ach.title,
              description: ach.description,
              rewardText: rewardText,
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
          const hasAll = teamCardIds.every(id => !!tempCollection[id]);
          if (hasAll) {
            const achievementData = {
              id: achievementId,
              title: `Team Master: ${team}`,
              description: `Collected every card from the ${team}`,
              rewardText: "+1 MVP Pack",
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
      tempCollection[cardId] = (tempCollection[cardId] || 0) + 1;
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
      isNew: !collection[card.id]
    }));

    const finalCollection = { ...collection };
    newIds.forEach(id => {
      finalCollection[id] = (finalCollection[id] || 0) + 1;
    });
    
    // Check achievements
    const { newlyUnlocked, bonusCoins, newInventoryPacks, newlyUnlockedIds } = checkAchievements(finalCollection, currentCoins, unlockedAchievements, newIds, false);

    // Corrected inventory merge: Group by type
    const updatedInventory = [...inventoryPacks];
    newInventoryPacks.forEach(pack => {
      const existing = updatedInventory.find(p => p.type === pack.type);
      if (existing) {
        existing.count += (pack.count || 1);
      } else {
        updatedInventory.push({ ...pack, id: pack.type, count: pack.count || 1 });
      }
    });

    // Batch update everything in ONE single call to ensure ONE cloud request (Local-first)
    updateGameState({
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
      isNew: !collection[card.id]
    }));

    const finalCollection = { ...collection };
    newIds.forEach(id => {
      finalCollection[id] = (finalCollection[id] || 0) + 1;
    });
    
    // Check achievements
    const { newlyUnlocked, bonusCoins, newInventoryPacks, newlyUnlockedIds } = checkAchievements(finalCollection, coins, unlockedAchievements, newIds, false);

    // Handle inventory removal and additions (Grouping by type)
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
      const existing = currentInventory.find(p => p.type === pack.type);
      if (existing) {
        existing.count += (pack.count || 1);
      } else {
        currentInventory.push({ ...pack, id: pack.type, count: pack.count || 1 });
      }
    });

    // Local-first update
    updateGameState({
      coins: coins + bonusCoins,
      collection: finalCollection,
      unlockedAchievements: [...unlockedAchievements, ...newlyUnlockedIds],
      inventoryPacks: currentInventory
    });

    return { cards: cardsWithNewFlag, newlyUnlocked };
  };

  const generateDraftOptions = (count: number, position: string | null, excludedIds: string[], isElite: boolean = false, isCaptain: boolean = false): Card[] => {
    const options: Card[] = [];
    const seenIds = new Set(excludedIds);
    
    // Get names of already drafted players to prevent different versions of same player
    const draftedNames = new Set(
      ALL_CARDS.filter(c => excludedIds.includes(c.id)).map(c => c.name)
    );

    // If captain, we look for the top 5% OVR cards
    const captainThreshold = isCaptain ? 94 : 0;

    for (let i = 0; i < count; i++) {
      let pool = ALL_CARDS.filter(c => {
        if (seenIds.has(c.id)) return false;
        if (draftedNames.has(c.name)) return false; // Prevent duplicate players by name
        
        // STRICT PLAYER-ONLY FILTER
        if (c.rarity === 'coach' || c.rarity === 'logo' || c.rarity === 'arena') return false;
        if (['Coach', 'Logo', 'Arena', 'Coach of the Year'].includes(c.category)) return false;
        if (['Duo', 'Dynasty', 'Big Three'].includes(c.category)) return false; 
        
        if (isCaptain) {
          // Captain logic: Top OVR players, regardless of position
          return (c.stats?.ovr || 0) >= captainThreshold;
        }

        if (position && c.position !== position) return false;

        if (isElite) {
          return ['legend', 'franchise', 'record', 'allstar'].includes(c.rarity);
        }

        // Weighted RNG for normal picks
        const rand = Math.random() * 100;
        let selectedRarities: Rarity[] = [];
        if (rand < 70) {
          selectedRarities = ['bench', 'starter'];
        } else if (rand < 95) {
          selectedRarities = ['allstar', 'franchise'];
        } else {
          selectedRarities = ['legend', 'roty', 'dpoy', 'record'];
        }
        return selectedRarities.includes(c.rarity);
      });

      if (pool.length === 0) {
        pool = ALL_CARDS.filter(c => {
          if (seenIds.has(c.id)) return false;
          if (draftedNames.has(c.name)) return false; // Still exclude by name in fallback
          if (c.rarity === 'coach' || c.rarity === 'logo' || c.rarity === 'arena') return false;
          if (['Coach', 'Logo', 'Arena', 'Coach of the Year'].includes(c.category)) return false;
          if (['Duo', 'Dynasty', 'Big Three'].includes(c.category)) return false;
          if (isCaptain) return (c.stats?.ovr || 0) >= 90; // Slightly lower threshold if empty
          if (position && c.position !== position) return false;
          return true;
        });
      }

      // Final fallback: allow duplicates if absolutely necessary (shouldn't happen with large pool)
      if (pool.length === 0) {
        pool = ALL_CARDS.filter(c => !seenIds.has(c.id) && c.rarity !== 'coach' && c.rarity !== 'logo' && c.rarity !== 'arena' && !['Coach', 'Logo', 'Arena'].includes(c.category));
      }

      const selectedCard = pool[Math.floor(Math.random() * pool.length)];
      if (selectedCard) {
        options.push(selectedCard);
        seenIds.add(selectedCard.id);
        draftedNames.add(selectedCard.name);
      }
    }

    return options;
  };

  return { openPack, openInventoryPack, generateDraftOptions, PACK_SIZES, isSaving };
}
