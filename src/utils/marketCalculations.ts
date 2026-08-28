import { Card } from '../types';

/**
 * Calculates a market coin value for any card based on OVR, rarity, and category.
 */
export function getCardMarketValue(card: Card): number {
  const ovr = card.stats?.ovr || 75;
  let baseValue = 500;

  if (ovr >= 99) {
    baseValue = 3500000;
  } else if (ovr >= 98) {
    baseValue = 1800000;
  } else if (ovr >= 97) {
    baseValue = 1000000;
  } else if (ovr >= 95) {
    baseValue = 450000;
  } else if (ovr >= 93) {
    baseValue = 200000;
  } else if (ovr >= 90) {
    baseValue = 85000;
  } else if (ovr >= 87) {
    baseValue = 35000;
  } else if (ovr >= 84) {
    baseValue = 15000;
  } else if (ovr >= 80) {
    baseValue = 5000;
  } else {
    baseValue = Math.max(500, Math.floor(Math.pow(ovr - 60, 2.3) * 15));
  }

  // Rarity & Category Multipliers
  let multiplier = 1.0;
  if (card.rarity === 'invincible' || card.rarity === 'galaxy') {
    multiplier = 1.5;
  } else if (card.category === 'Scream Edition' || card.category === 'Hidden Gems' || card.rarity === 'fmvp') {
    multiplier = 1.35;
  } else if (card.category === 'Hall of Fame' || card.rarity === 'hof' || card.rarity === 'legend') {
    multiplier = 1.25;
  } else if (card.category === 'All-NBA 1st Team' || card.category === 'All-Star MVP') {
    multiplier = 1.15;
  }

  return Math.round(baseValue * multiplier);
}

/**
 * Formats large coin values nicely (e.g. 1.25M, 450K, 25K).
 */
export function formatCoinCompact(amount: number): string {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(2).replace(/\.00$/, '') + 'M';
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return amount.toLocaleString();
}
