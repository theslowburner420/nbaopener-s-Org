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
  | 'dynasty'
  | 'hof' 
  | 'legendary_mvp'
  | 'gold'
  | 'franchise'
  | 'galaxy'
  | 'invincible'
  | 'draft2026';

export const PACK_SIZES: Record<PackType, number> = {
  random: 4,
  duo_xfactor: 4,
  allstar: 5,
  mvp: 5,
  dynasty: 5,
  hof: 5,
  legendary_mvp: 1,
  gold: 4,
  franchise: 4,
  galaxy: 3,
  invincible: 1,
  draft2026: 4,
};

export const PACK_PRICES: Record<Extract<PackType, 'duo_xfactor' | 'allstar' | 'mvp' | 'dynasty' | 'hof' | 'legendary_mvp'>, number> = {
  duo_xfactor: 15000,
  allstar: 35000,
  mvp: 85000,
  dynasty: 130000,
  hof: 185000,
  legendary_mvp: 280000,
};

// Pre-calculate structured pools for thematic pack generation
const BENCH_POOL = ALL_CARDS.filter(c => c.rarity === 'bench');
const STARTER_POOL = ALL_CARDS.filter(c => c.rarity === 'starter');
const ALLSTAR_POOL = ALL_CARDS.filter(c => c.rarity === 'allstar');
const FRANCHISE_POOL = ALL_CARDS.filter(c => c.rarity === 'franchise');
const DUO_POOL = ALL_CARDS.filter(c => c.category === 'Duo' || c.series === 'Dynamic Duo Series');
const XFACTOR_POOL = ALL_CARDS.filter(c => c.category === 'X-Factor' || c.series === 'X-Factor Series');
const AWARD_POOL = ALL_CARDS.filter(c => c.category === 'Award' || ['MVP', 'Finals MVP', 'DPOY', 'ROY', '6MOTY', 'MIP', 'All-Star MVP'].includes(c.category) || ['mvp', 'fmvp', 'dpoy', 'roty', '6moy', 'mip', 'scoring_champ'].includes(c.rarity));

// The 5 Dynasty cards available in packs (Showtime Lakers, 3-Peat Lakers, Spurs Dynasty, Big 3 Heat, Bad Boys Pistons)
const DYNASTY_PACK_POOL = ALL_CARDS.filter(c => (c.category === 'Dynasty' || c.series === 'Dynasty Series' || c.id.startsWith('dynasty-')) && !c.isSpecialSBC);

const LEGEND_POOL = ALL_CARDS.filter(c => c.rarity === 'legend' || (c.category === 'Dynasty' && !c.isSpecialSBC));
const HOF_POOL = ALL_CARDS.filter(c => c.rarity === 'hof' || (c.category as string) === 'HOF' || c.series === 'Hall of Fame' || c.series === 'Legendary MVP Series' || (c.category === 'Dynasty' && !c.isSpecialSBC));
const DRAFT2026_POOL = ALL_CARDS.filter(c => c.rarity === 'draft2026' || c.category === 'Draft 2026');
const ULTRA_RARE_POOL = ALL_CARDS.filter(c => ['invincible', 'galaxy'].includes(c.rarity) || (c.category === 'Dynasty' && !c.isSpecialSBC && (c.stats?.ovr || 0) >= 97));

// Full MVP pool: Regular Season MVP, Finals MVP, and All-Star MVP cards
const ALL_MVPS_POOL = ALL_CARDS.filter(c => 
  c.category === 'Finals MVP' || 
  c.category === 'MVP' || 
  c.category === 'All-Star MVP' ||
  c.rarity === 'mvp' || 
  c.rarity === 'fmvp' ||
  c.series === 'Finals MVP Series' ||
  c.series === 'MVP Series' ||
  c.series === 'All-Star MVP Series' ||
  (c.category === 'Award' && c.name.toLowerCase().includes('mvp'))
);

// Helper function to pick a random card from a pool excluding already drawn cards in this pack
function getRandomFromPool(pool: Card[], excludeIds?: Set<string>): Card {
  if (!pool || pool.length === 0) pool = BENCH_POOL.length ? BENCH_POOL : ALL_CARDS;
  if (excludeIds && excludeIds.size > 0) {
    const available = pool.filter(c => !excludeIds.has(c.id));
    if (available.length > 0) {
      return available[Math.floor(Math.random() * available.length)];
    }
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

// Helper to pick based on weighted probability
function rollWeightedPool(rates: { pool: Card[]; rate: number }[], excludeIds?: Set<string>): Card {
  const rand = Math.random() * 100;
  let cumulative = 0;
  for (const item of rates) {
    cumulative += item.rate;
    if (rand <= cumulative) {
      return getRandomFromPool(item.pool, excludeIds);
    }
  }
  return getRandomFromPool(BENCH_POOL, excludeIds);
}

// Generate pack cards with FIFA/MADFUT balanced drop rates
export function generatePackCards(packType: PackType): Card[] {
  const size = PACK_SIZES[packType] || 4;
  const cards: Card[] = [];
  const drawnIds = new Set<string>();

  for (let slot = 0; slot < size; slot++) {
    const isWalkoutSlot = slot === size - 1;
    let card: Card;

    if (packType === 'legendary_mvp') {
      // 100% Guaranteed MVP card (Finals MVP, Regular Season MVP, or All-Star MVP)
      const pool = ALL_MVPS_POOL.length > 0 ? ALL_MVPS_POOL : AWARD_POOL;
      card = getRandomFromPool(pool, drawnIds);
    } else if (packType === 'random') {
      card = rollWeightedPool([
        { pool: BENCH_POOL, rate: 76 },
        { pool: STARTER_POOL, rate: 19 },
        { pool: ALLSTAR_POOL, rate: 4.5 },
        { pool: XFACTOR_POOL, rate: 0.4 },
        { pool: FRANCHISE_POOL, rate: 0.1 },
      ], drawnIds);
    } else if (packType === 'duo_xfactor') {
      const DUO_X_COMBINED = [...DUO_POOL, ...XFACTOR_POOL];
      if (isWalkoutSlot) {
        // Walkout slot: weighted chance for a starter, duo or chemistry player
        card = rollWeightedPool([
          { pool: BENCH_POOL, rate: 45 },
          { pool: STARTER_POOL, rate: 45 },
          { pool: DUO_X_COMBINED.length ? DUO_X_COMBINED : STARTER_POOL, rate: 8 },
          { pool: ALLSTAR_POOL, rate: 2 },
        ], drawnIds);
      } else {
        card = rollWeightedPool([
          { pool: BENCH_POOL, rate: 68 },
          { pool: STARTER_POOL, rate: 28 },
          { pool: DUO_X_COMBINED.length ? DUO_X_COMBINED : STARTER_POOL, rate: 3 },
          { pool: ALLSTAR_POOL, rate: 1 },
        ], drawnIds);
      }
    } else if (packType === 'allstar') {
      if (isWalkoutSlot) {
        // Walkout slot: 80+ Starter baseline, 26% All-Star 85+, 4% Franchise/Awards
        card = rollWeightedPool([
          { pool: STARTER_POOL, rate: 69.5 },
          { pool: ALLSTAR_POOL, rate: 26 },
          { pool: FRANCHISE_POOL, rate: 4 },
          { pool: DYNASTY_PACK_POOL.length ? DYNASTY_PACK_POOL : LEGEND_POOL, rate: 0.5 },
        ], drawnIds);
      } else {
        card = rollWeightedPool([
          { pool: BENCH_POOL, rate: 55 },
          { pool: STARTER_POOL, rate: 38 },
          { pool: ALLSTAR_POOL, rate: 7 },
        ], drawnIds);
      }
    } else if (packType === 'mvp') {
      if (isWalkoutSlot) {
        // Walkout slot: 40% Starter 80+, 45% All-Star 85+, 13% Awards/Franchise 90+, 2% Dynasty/HOF
        card = rollWeightedPool([
          { pool: STARTER_POOL, rate: 40 },
          { pool: ALLSTAR_POOL, rate: 45 },
          { pool: AWARD_POOL, rate: 10 },
          { pool: FRANCHISE_POOL, rate: 3 },
          { pool: DYNASTY_PACK_POOL.length ? DYNASTY_PACK_POOL : LEGEND_POOL, rate: 2 },
        ], drawnIds);
      } else {
        card = rollWeightedPool([
          { pool: BENCH_POOL, rate: 30 },
          { pool: STARTER_POOL, rate: 52 },
          { pool: ALLSTAR_POOL, rate: 15 },
          { pool: AWARD_POOL, rate: 3 },
        ], drawnIds);
      }
    } else if (packType === 'dynasty') {
      if (isWalkoutSlot) {
        // Walkout slot: ~4.5% Dynasty squad jackpot, ~20% 90+ Franchise/Award, ~50% All-Star 85+
        card = rollWeightedPool([
          { pool: STARTER_POOL, rate: 24 },
          { pool: ALLSTAR_POOL, rate: 50 },
          { pool: FRANCHISE_POOL, rate: 15 },
          { pool: AWARD_POOL, rate: 5 },
          { pool: DYNASTY_PACK_POOL.length ? DYNASTY_PACK_POOL : LEGEND_POOL, rate: 4.5 },
          { pool: HOF_POOL.length ? HOF_POOL : LEGEND_POOL, rate: 1.5 },
        ], drawnIds);
      } else {
        card = rollWeightedPool([
          { pool: BENCH_POOL, rate: 15 },
          { pool: STARTER_POOL, rate: 48 },
          { pool: ALLSTAR_POOL, rate: 32 },
          { pool: FRANCHISE_POOL, rate: 4.5 },
          { pool: DYNASTY_PACK_POOL.length ? DYNASTY_PACK_POOL : LEGEND_POOL, rate: 0.5 },
        ], drawnIds);
      }
    } else if (packType === 'hof') {
      // Hall of Fame Pack does NOT guarantee HOF or Dynasty, like FIFA Ultimate / Icon pack
      if (isWalkoutSlot) {
        // Walkout slot: High 85+ concentration, with ~5% HOF and ~1.5% Dynasty
        card = rollWeightedPool([
          { pool: STARTER_POOL, rate: 18.5 },
          { pool: ALLSTAR_POOL, rate: 55 },
          { pool: FRANCHISE_POOL, rate: 15 },
          { pool: AWARD_POOL, rate: 5 },
          { pool: HOF_POOL.length ? HOF_POOL : LEGEND_POOL, rate: 5 },
          { pool: DYNASTY_PACK_POOL.length ? DYNASTY_PACK_POOL : LEGEND_POOL, rate: 1.5 },
        ], drawnIds);
      } else {
        card = rollWeightedPool([
          { pool: BENCH_POOL, rate: 10 },
          { pool: STARTER_POOL, rate: 45 },
          { pool: ALLSTAR_POOL, rate: 38 },
          { pool: FRANCHISE_POOL, rate: 6 },
          { pool: HOF_POOL.length ? HOF_POOL : LEGEND_POOL, rate: 1 },
        ], drawnIds);
      }
    } else if (packType === 'draft2026') {
      card = rollWeightedPool([
        { pool: BENCH_POOL, rate: 48 },
        { pool: STARTER_POOL, rate: 40 },
        { pool: DRAFT2026_POOL, rate: 10 },
        { pool: ALLSTAR_POOL, rate: 2 },
      ], drawnIds);
    } else if (packType === 'gold') {
      card = rollWeightedPool([
        { pool: STARTER_POOL, rate: 55 },
        { pool: ALLSTAR_POOL, rate: 35 },
        { pool: FRANCHISE_POOL, rate: 10 },
      ], drawnIds);
    } else if (packType === 'franchise') {
      card = rollWeightedPool([
        { pool: ALLSTAR_POOL, rate: 45 },
        { pool: FRANCHISE_POOL, rate: 45 },
        { pool: LEGEND_POOL, rate: 10 },
      ], drawnIds);
    } else if (packType === 'galaxy' || packType === 'invincible') {
      card = rollWeightedPool([
        { pool: FRANCHISE_POOL, rate: 45 },
        { pool: LEGEND_POOL, rate: 35 },
        { pool: DYNASTY_PACK_POOL.length ? DYNASTY_PACK_POOL : LEGEND_POOL, rate: 10 },
        { pool: ULTRA_RARE_POOL.length ? ULTRA_RARE_POOL : LEGEND_POOL, rate: 10 },
      ], drawnIds);
    } else {
      card = rollWeightedPool([
        { pool: BENCH_POOL, rate: 68 },
        { pool: STARTER_POOL, rate: 26 },
        { pool: ALLSTAR_POOL, rate: 6 },
      ], drawnIds);
    }

    cards.push(card);
    drawnIds.add(card.id);
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
