import { useGame } from '../context/GameContext';
import { useNotification } from '../context/NotificationContext';
import { ALL_CARDS, CARDS_BY_RARITY, CARDS_BY_SERIES } from '../data/cards';
import { Card, Rarity } from '../types';
import { ACHIEVEMENTS } from '../constants/achievements';

export type PackType = 
  | 'random' 
  | 'duo_xfactor'
  | 'allstar' 
  | 'mvp' 
  | 'hof' 
  | 'legendary_mvp'
  | 'gold'
  | 'franchise'
  | 'galaxy'
  | 'invincible'
  | 'draft2026';

export const PACK_SIZES: Record<PackType, number> = {
  random: 3,
  duo_xfactor: 4,
  allstar: 5,
  mvp: 4,
  hof: 5,
  legendary_mvp: 1,
  gold: 4,
  franchise: 3,
  galaxy: 2,
  invincible: 1,
  draft2026: 3,
};

export const PACK_PRICES: Record<Extract<PackType, 'duo_xfactor' | 'allstar' | 'mvp' | 'hof' | 'legendary_mvp'>, number> = {
  duo_xfactor: 15000,
  allstar: 35000,
  mvp: 85000,
  hof: 160000,
  legendary_mvp: 350000,
};

// Pre-calculate structured pools for thematic pack generation
const BENCH_POOL = ALL_CARDS.filter(c => c.rarity === 'bench');
const STARTER_POOL = ALL_CARDS.filter(c => c.rarity === 'starter');
const ALLSTAR_POOL = ALL_CARDS.filter(c => c.rarity === 'allstar');
const FRANCHISE_POOL = ALL_CARDS.filter(c => c.rarity === 'franchise');
const LEGEND_POOL = ALL_CARDS.filter(c => c.rarity === 'legend');
const DUO_POOL = ALL_CARDS.filter(c => c.category === 'Duo' || c.series === 'Dynamic Duo Series');
const XFACTOR_POOL = ALL_CARDS.filter(c => c.category === 'X-Factor' || c.series === 'X-Factor Series');
const AWARD_POOL = ALL_CARDS.filter(c => c.category === 'Award' || ['MVP', 'Finals MVP', 'DPOY', 'ROY', '6MOTY', 'MIP', 'All-Star MVP'].includes(c.category) || ['mvp', 'fmvp', 'dpoy', 'roty', '6moy', 'mip', 'scoring_champ'].includes(c.rarity));
const HOF_POOL = ALL_CARDS.filter(c => c.rarity === 'hof' || (c.category as string) === 'HOF' || c.series === 'Hall of Fame' || c.series === 'Legendary MVP Series');
const DRAFT2026_POOL = ALL_CARDS.filter(c => c.rarity === 'draft2026' || c.category === 'Draft 2026');
const ULTRA_RARE_POOL = ALL_CARDS.filter(c => ['invincible', 'galaxy', 'legend_sbc'].includes(c.rarity));
const LEGENDARY_MVP_TOP_POOL = ALL_CARDS.filter(c => 
  c.series === 'Legendary MVP Series' ||
  ['invincible', 'galaxy', 'legend_sbc', 'hof'].includes(c.rarity) ||
  (c.rarity === 'legend' && c.stats && c.stats.ovr >= 93) ||
  ((c.rarity === 'mvp' || c.rarity === 'fmvp') && c.stats && c.stats.ovr >= 93) ||
  (c.stats && c.stats.ovr >= 94)
);

// Helper function to pick a random card from a pool
function getRandomFromPool(pool: Card[]): Card {
  if (!pool || pool.length === 0) pool = BENCH_POOL.length ? BENCH_POOL : ALL_CARDS;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Helper to pick based on weighted probability
function rollWeightedPool(rates: { pool: Card[]; rate: number }[]): Card {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (const item of rates) {
    cumulative += item.rate;
    if (rand <= cumulative) {
      return getRandomFromPool(item.pool);
    }
  }
  return getRandomFromPool(BENCH_POOL);
}

// Generate pack cards with thematic drop rates (only Legendary MVP is 100% guaranteed top tier)
export function generatePackCards(packType: PackType): Card[] {
  const size = PACK_SIZES[packType] || 4;
  const cards: Card[] = [];

  for (let slot = 0; slot < size; slot++) {
    if (packType === 'legendary_mvp') {
      const pool = LEGENDARY_MVP_TOP_POOL.length > 0 ? LEGENDARY_MVP_TOP_POOL : LEGEND_POOL;
      cards.push(getRandomFromPool(pool));
    } else if (packType === 'random') {
      cards.push(rollWeightedPool([
        { pool: BENCH_POOL, rate: 82 },
        { pool: STARTER_POOL, rate: 15 },
        { pool: ALLSTAR_POOL, rate: 2.5 },
        { pool: XFACTOR_POOL, rate: 0.4 },
        { pool: FRANCHISE_POOL, rate: 0.1 },
      ]));
    } else if (packType === 'duo_xfactor') {
      const DUO_X_COMBINED = [...DUO_POOL, ...XFACTOR_POOL];
      cards.push(rollWeightedPool([
        { pool: BENCH_POOL, rate: 58 },
        { pool: STARTER_POOL, rate: 36 },
        { pool: DUO_X_COMBINED.length ? DUO_X_COMBINED : STARTER_POOL, rate: 5 },
        { pool: ALLSTAR_POOL, rate: 1 },
      ]));
    } else if (packType === 'allstar') {
      cards.push(rollWeightedPool([
        { pool: BENCH_POOL, rate: 45 },
        { pool: STARTER_POOL, rate: 47 },
        { pool: ALLSTAR_POOL, rate: 7 },
        { pool: FRANCHISE_POOL, rate: 0.9 },
        { pool: LEGEND_POOL, rate: 0.1 },
      ]));
    } else if (packType === 'mvp') {
      cards.push(rollWeightedPool([
        { pool: STARTER_POOL, rate: 65 },
        { pool: BENCH_POOL, rate: 25 },
        { pool: ALLSTAR_POOL, rate: 6 },
        { pool: AWARD_POOL, rate: 3.5 },
        { pool: FRANCHISE_POOL, rate: 0.4 },
        { pool: LEGEND_POOL, rate: 0.1 },
      ]));
    } else if (packType === 'hof') {
      cards.push(rollWeightedPool([
        { pool: STARTER_POOL, rate: 60 },
        { pool: ALLSTAR_POOL, rate: 32 },
        { pool: FRANCHISE_POOL, rate: 5 },
        { pool: HOF_POOL.length ? HOF_POOL : LEGEND_POOL, rate: 2.8 },
        { pool: ULTRA_RARE_POOL.length ? ULTRA_RARE_POOL : LEGEND_POOL, rate: 0.2 },
      ]));
    } else if (packType === 'draft2026') {
      cards.push(rollWeightedPool([
        { pool: BENCH_POOL, rate: 50 },
        { pool: STARTER_POOL, rate: 42 },
        { pool: DRAFT2026_POOL, rate: 7 },
        { pool: ALLSTAR_POOL, rate: 1 },
      ]));
    } else if (packType === 'gold') {
      cards.push(rollWeightedPool([
        { pool: STARTER_POOL, rate: 55 },
        { pool: ALLSTAR_POOL, rate: 35 },
        { pool: FRANCHISE_POOL, rate: 10 },
      ]));
    } else if (packType === 'franchise') {
      cards.push(rollWeightedPool([
        { pool: ALLSTAR_POOL, rate: 45 },
        { pool: FRANCHISE_POOL, rate: 45 },
        { pool: LEGEND_POOL, rate: 10 },
      ]));
    } else if (packType === 'galaxy' || packType === 'invincible') {
      cards.push(rollWeightedPool([
        { pool: FRANCHISE_POOL, rate: 50 },
        { pool: LEGEND_POOL, rate: 35 },
        { pool: ULTRA_RARE_POOL.length ? ULTRA_RARE_POOL : LEGEND_POOL, rate: 15 },
      ]));
    } else {
      cards.push(rollWeightedPool([
        { pool: BENCH_POOL, rate: 70 },
        { pool: STARTER_POOL, rate: 25 },
        { pool: ALLSTAR_POOL, rate: 5 },
      ]));
    }
  }

  return cards;
}

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
            bonusCoins += ach.rewardCoins || 0;
            if (ach.rewardPacks) {
              ach.rewardPacks.forEach(p => {
                newInventoryPacks.push(p);
              });
            }
            
            if (!silent) {
              notify(achievementData);
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
            newInventoryPacks.push(achievementData.packReward);
            
            if (!silent) {
              notify(achievementData);
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
      const price = PACK_PRICES[packType as keyof typeof PACK_PRICES] || 5000;
      if (currentCoins < price) return null;
      currentCoins -= price;
    } else {
      // Daily Stimulus
      currentCoins += 500;
    }

    const newCards = generatePackCards(packType);
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
    
    // Check achievements silently so no popups fire on ON_PACK_OPEN
    const { newlyUnlocked, bonusCoins, newInventoryPacks, newlyUnlockedIds } = checkAchievements(finalCollection, currentCoins, unlockedAchievements, newIds, true);

    // Attach cardIndex to each unlocked achievement in the queue
    const newlyUnlockedWithIndex = newlyUnlocked.map(ach => {
      let cardIndex = 0;
      if (ach.triggeredByCardId) {
        const idx = newCards.findIndex(c => c.id === ach.triggeredByCardId);
        if (idx !== -1) cardIndex = idx;
      }
      return {
        ...ach,
        cardIndex
      };
    });

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

    return { cards: cardsWithNewFlag, newlyUnlocked: newlyUnlockedWithIndex };
  };

  const openInventoryPack = async (packId: string, packType: PackType) => {
    const newCards = generatePackCards(packType);
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
    
    // Check achievements silently so no popups fire on ON_PACK_OPEN
    const { newlyUnlocked, bonusCoins, newInventoryPacks, newlyUnlockedIds } = checkAchievements(finalCollection, coins, unlockedAchievements, newIds, true);

    // Attach cardIndex to each unlocked achievement in the queue
    const newlyUnlockedWithIndex = newlyUnlocked.map(ach => {
      let cardIndex = 0;
      if (ach.triggeredByCardId) {
        const idx = newCards.findIndex(c => c.id === ach.triggeredByCardId);
        if (idx !== -1) cardIndex = idx;
      }
      return {
        ...ach,
        cardIndex
      };
    });

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

    return { cards: cardsWithNewFlag, newlyUnlocked: newlyUnlockedWithIndex };
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
