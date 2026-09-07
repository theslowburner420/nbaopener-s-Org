/**
 * ============================================================================
 * CALENDAR LOGIN EVENTS (OPENING TIP-OFF & BLACK FRIDAY)
 * ============================================================================
 * 
 * STRICT ACCESS POLICY:
 * - Premium / VIP / Ad-Free users NEVER get early access to these events.
 * - Active ONLY when local device date is within [START_DATE, END_DATE] OR
 *   if unlocked via the secret developer code 'camatxo'.
 */

export interface PackRewardItem {
  type: string;
  name: string;
  count: number;
}

export interface CalendarDayReward {
  day: number;
  dateLabel: string;
  calendarDate: string; // 'YYYY-MM-DD'
  coins: number;
  packsCount: number;
  packBreakdown: PackRewardItem[];
  highlightBadge?: string;
  extraBenefit?: string;
  isSpecialMilestone?: boolean;
}

export interface CalendarEventConfig {
  id: 'opening_tipoff' | 'black_friday';
  name: string;
  subtitle: string;
  tag: string;
  icon: string;
  startDate: string; // YYYY-MM-DDTHH:mm:ss
  endDate: string;   // YYYY-MM-DDTHH:mm:ss
  totalDays: number;
  accentColor: string;
  bgGradient: string;
  borderGlow: string;
  textColor: string;
  buttonGradient: string;
  rewards: CalendarDayReward[];
}

export const OPENING_TIPOFF_CONFIG: CalendarEventConfig = {
  id: 'opening_tipoff',
  name: 'Opening Tip-Off',
  subtitle: '15-Day Season Launch Login Celebration',
  tag: '🏀 NBA SEASON TIP-OFF',
  icon: '🏀',
  startDate: '2026-10-10T00:00:00',
  endDate: '2026-10-24T23:59:59',
  totalDays: 15,
  accentColor: 'amber',
  bgGradient: 'from-amber-950/80 via-zinc-950 to-black',
  borderGlow: 'border-amber-500/80 shadow-[0_0_35px_rgba(245,158,11,0.4)]',
  textColor: 'text-amber-400',
  buttonGradient: 'from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black',
  rewards: [
    {
      day: 1,
      dateLabel: '10 Oct',
      calendarDate: '2026-10-10',
      coins: 5000,
      packsCount: 1,
      packBreakdown: [{ type: 'allstar', name: 'All-Star Pack', count: 1 }],
      highlightBadge: 'START',
    },
    {
      day: 2,
      dateLabel: '11 Oct',
      calendarDate: '2026-10-11',
      coins: 10000,
      packsCount: 2,
      packBreakdown: [{ type: 'allstar', name: 'All-Star Pack', count: 2 }],
    },
    {
      day: 3,
      dateLabel: '12 Oct',
      calendarDate: '2026-10-12',
      coins: 20000,
      packsCount: 4,
      packBreakdown: [{ type: 'allstar', name: 'All-Star Pack', count: 4 }],
    },
    {
      day: 4,
      dateLabel: '13 Oct',
      calendarDate: '2026-10-13',
      coins: 40000,
      packsCount: 8,
      packBreakdown: [
        { type: 'allstar', name: 'All-Star Pack', count: 4 },
        { type: 'allnba', name: 'All-NBA Pack', count: 4 },
      ],
    },
    {
      day: 5,
      dateLabel: '14 Oct',
      calendarDate: '2026-10-14',
      coins: 80000,
      packsCount: 10,
      packBreakdown: [
        { type: 'allnba', name: 'All-NBA Pack', count: 5 },
        { type: 'mvp', name: 'MVP Pack', count: 5 },
      ],
      highlightBadge: 'PACK CEILING',
      extraBenefit: 'Packs Cap reached (10 packs/day)',
    },
    {
      day: 6,
      dateLabel: '15 Oct',
      calendarDate: '2026-10-15',
      coins: 160000,
      packsCount: 10,
      packBreakdown: [
        { type: 'allnba', name: 'All-NBA Pack', count: 5 },
        { type: 'mvp', name: 'MVP Pack', count: 5 },
      ],
      highlightBadge: 'COIN CEILING',
      extraBenefit: 'Coin Cap reached (160k coins/day)',
    },
    {
      day: 7,
      dateLabel: '16 Oct',
      calendarDate: '2026-10-16',
      coins: 160000,
      packsCount: 10,
      packBreakdown: [
        { type: 'allnba', name: 'All-NBA Pack', count: 5 },
        { type: 'mvp', name: 'MVP Pack', count: 5 },
      ],
    },
    {
      day: 8,
      dateLabel: '17 Oct',
      calendarDate: '2026-10-17',
      coins: 160000,
      packsCount: 10,
      packBreakdown: [
        { type: 'allnba', name: 'All-NBA Pack', count: 5 },
        { type: 'mvp', name: 'MVP Pack', count: 5 },
      ],
    },
    {
      day: 9,
      dateLabel: '18 Oct',
      calendarDate: '2026-10-18',
      coins: 160000,
      packsCount: 10,
      packBreakdown: [
        { type: 'allnba', name: 'All-NBA Pack', count: 5 },
        { type: 'mvp', name: 'MVP Pack', count: 5 },
      ],
    },
    {
      day: 10,
      dateLabel: '19 Oct',
      calendarDate: '2026-10-19',
      coins: 160000,
      packsCount: 10,
      packBreakdown: [
        { type: 'allnba', name: 'All-NBA Pack', count: 5 },
        { type: 'mvp', name: 'MVP Pack', count: 5 },
      ],
    },
    {
      day: 11,
      dateLabel: '20 Oct',
      calendarDate: '2026-10-20',
      coins: 320000,
      packsCount: 20,
      packBreakdown: [
        { type: 'mvp', name: 'MVP Pack', count: 10 },
        { type: 'hof', name: 'HOF Pack', count: 8 },
        { type: 'legendary_mvp', name: 'Legendary MVP Pack', count: 2 },
      ],
      highlightBadge: '🔥 OPENING NIGHT 2X BONUS',
      extraBenefit: 'Official NBA Season Launch Bonus',
      isSpecialMilestone: true,
    },
    {
      day: 12,
      dateLabel: '21 Oct',
      calendarDate: '2026-10-21',
      coins: 160000,
      packsCount: 10,
      packBreakdown: [
        { type: 'allnba', name: 'All-NBA Pack', count: 5 },
        { type: 'mvp', name: 'MVP Pack', count: 5 },
      ],
    },
    {
      day: 13,
      dateLabel: '22 Oct',
      calendarDate: '2026-10-22',
      coins: 160000,
      packsCount: 10,
      packBreakdown: [
        { type: 'allnba', name: 'All-NBA Pack', count: 5 },
        { type: 'mvp', name: 'MVP Pack', count: 5 },
      ],
    },
    {
      day: 14,
      dateLabel: '23 Oct',
      calendarDate: '2026-10-23',
      coins: 160000,
      packsCount: 10,
      packBreakdown: [
        { type: 'allnba', name: 'All-NBA Pack', count: 5 },
        { type: 'mvp', name: 'MVP Pack', count: 5 },
      ],
    },
    {
      day: 15,
      dateLabel: '24 Oct',
      calendarDate: '2026-10-24',
      coins: 500000,
      packsCount: 25,
      packBreakdown: [
        { type: 'mvp', name: 'MVP Pack', count: 10 },
        { type: 'hof', name: 'HOF Pack', count: 10 },
        { type: 'legendary_mvp', name: 'Legendary MVP Pack', count: 5 },
      ],
      highlightBadge: '👑 GRAND FINALE',
      extraBenefit: 'Ultimate 500k + 25 Packs Closing Reward',
      isSpecialMilestone: true,
    },
  ],
};

export const BLACK_FRIDAY_CONFIG: CalendarEventConfig = {
  id: 'black_friday',
  name: 'Black Friday Blitz',
  subtitle: '5-Day Explosive Login & Deals Event',
  tag: '🏷️ BLACK FRIDAY BLITZ',
  icon: '🏷️',
  startDate: '2026-11-27T00:00:00',
  endDate: '2026-12-01T23:59:59',
  totalDays: 5,
  accentColor: 'rose',
  bgGradient: 'from-rose-950/80 via-purple-950/40 to-black',
  borderGlow: 'border-rose-500/80 shadow-[0_0_35px_rgba(244,63,94,0.45)]',
  textColor: 'text-rose-400',
  buttonGradient: 'from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white',
  rewards: [
    {
      day: 1,
      dateLabel: '27 Nov',
      calendarDate: '2026-11-27',
      coins: 10000,
      packsCount: 2,
      packBreakdown: [{ type: 'allstar', name: 'All-Star Pack', count: 2 }],
      highlightBadge: 'BLACK FRIDAY REAL',
      extraBenefit: 'Doorbuster 70% off premium pack (1h random flash deal)',
      isSpecialMilestone: true,
    },
    {
      day: 2,
      dateLabel: '28 Nov',
      calendarDate: '2026-11-28',
      coins: 20000,
      packsCount: 4,
      packBreakdown: [{ type: 'allnba', name: 'All-NBA Pack', count: 4 }],
      highlightBadge: 'DAY 2',
      extraBenefit: 'Doorbuster 60% off',
    },
    {
      day: 3,
      dateLabel: '29 Nov',
      calendarDate: '2026-11-29',
      coins: 40000,
      packsCount: 8,
      packBreakdown: [
        { type: 'allnba', name: 'All-NBA Pack', count: 4 },
        { type: 'mvp', name: 'MVP Pack', count: 4 },
      ],
      highlightBadge: 'BUNDLE 2X1',
      extraBenefit: 'Special 2x1 Pack Bundles active in Store',
    },
    {
      day: 4,
      dateLabel: '30 Nov',
      calendarDate: '2026-11-30',
      coins: 80000,
      packsCount: 16,
      packBreakdown: [
        { type: 'mvp', name: 'MVP Pack', count: 8 },
        { type: 'hof', name: 'HOF Pack', count: 8 },
      ],
      highlightBadge: 'DOORBUSTER 50%',
      extraBenefit: 'Doorbuster 50% off store specials',
    },
    {
      day: 5,
      dateLabel: '1 Dec',
      calendarDate: '2026-12-01',
      coins: 160000,
      packsCount: 32,
      packBreakdown: [
        { type: 'mvp', name: 'MVP Pack', count: 12 },
        { type: 'hof', name: 'HOF Pack', count: 15 },
        { type: 'legendary_mvp', name: 'Legendary MVP Pack', count: 5 },
      ],
      highlightBadge: '⚡ CYBER MONDAY FINALE',
      extraBenefit: 'Free Mega pack for all players + final store bundle',
      isSpecialMilestone: true,
    },
  ],
};

const DEV_OVERRIDE_STORAGE_KEY = 'hoops_calendar_events_dev_unlocked';

/**
 * Developer override helper.
 * ONLY set when the user inputs the secret cheat code 'camatxo'.
 * Never set for Premium/Ad-Free users.
 */
export function isCalendarDevOverrideActive(): boolean {
  try {
    return localStorage.getItem(DEV_OVERRIDE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setCalendarDevOverride(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(DEV_OVERRIDE_STORAGE_KEY, 'true');
    } else {
      localStorage.removeItem(DEV_OVERRIDE_STORAGE_KEY);
    }
  } catch {
    // safe fallback
  }
}

/**
 * Determines if an event is currently active.
 * STRICT CHECK: Local device date within range OR 'camatxo' override.
 * PREMIUM STATUS IS EXPLICITLY FORBIDDEN FROM ACTIVATING THIS.
 */
export function isCalendarEventActive(config: CalendarEventConfig): boolean {
  if (isCalendarDevOverrideActive()) {
    return true;
  }

  try {
    const now = new Date();
    const start = new Date(config.startDate);
    const end = new Date(config.endDate);
    return now >= start && now <= end;
  } catch {
    return false;
  }
}

export function isOpeningTipOffActive(): boolean {
  return isCalendarEventActive(OPENING_TIPOFF_CONFIG);
}

export function isBlackFridayActive(): boolean {
  return isCalendarEventActive(BLACK_FRIDAY_CONFIG);
}

export function getActiveCalendarEvents(): CalendarEventConfig[] {
  const list: CalendarEventConfig[] = [];
  if (isOpeningTipOffActive()) list.push(OPENING_TIPOFF_CONFIG);
  if (isBlackFridayActive()) list.push(BLACK_FRIDAY_CONFIG);
  return list;
}

export function getPrimaryActiveCalendarEvent(): CalendarEventConfig | null {
  const active = getActiveCalendarEvents();
  return active.length > 0 ? active[0] : null;
}

/**
 * Event Progress Storage & Streak Management
 */
export interface EventProgressState {
  currentStreakDay: number; // 1 to totalDays
  lastClaimDate: string | null; // YYYY-MM-DD
  claimedDaysHistory: number[]; // e.g. [1, 2, 3]
  totalCoinsEarned: number;
  totalPacksEarned: number;
}

export function getEventProgressKey(eventId: string): string {
  return `hoops_calendar_progress_${eventId}`;
}

export function loadEventProgress(eventId: string): EventProgressState {
  try {
    const raw = localStorage.getItem(getEventProgressKey(eventId));
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return {
    currentStreakDay: 1,
    lastClaimDate: null,
    claimedDaysHistory: [],
    totalCoinsEarned: 0,
    totalPacksEarned: 0,
  };
}

export function saveEventProgress(eventId: string, progress: EventProgressState): void {
  try {
    localStorage.setItem(getEventProgressKey(eventId), JSON.stringify(progress));
  } catch {
    // fallback
  }
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Compute whether today's reward can be claimed, what streak day applies,
 * and if a streak was broken.
 */
export function calculateEventClaimStatus(config: CalendarEventConfig): {
  canClaimToday: boolean;
  currentDayIndex: number; // 1-based (Day 1..15)
  isStreakBroken: boolean;
  progress: EventProgressState;
  rewardToday: CalendarDayReward;
} {
  const progress = loadEventProgress(config.id);
  const todayStr = getTodayDateString();

  const isAlreadyClaimedToday = progress.lastClaimDate === todayStr;

  let computedDay = progress.currentStreakDay || 1;
  let isStreakBroken = false;

  if (progress.lastClaimDate) {
    if (progress.lastClaimDate === todayStr) {
      // Already claimed today: computed day is the one already claimed
      computedDay = progress.currentStreakDay;
    } else {
      // Check difference in days
      const lastDate = new Date(progress.lastClaimDate);
      const todayDate = new Date(todayStr);
      const diffTime = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day: advance streak!
        computedDay = Math.min(progress.currentStreakDay + 1, config.totalDays);
      } else if (diffDays > 1) {
        // Missed a day! Reset streak to Day 1
        computedDay = 1;
        isStreakBroken = true;
      }
    }
  } else {
    // First time claiming this event
    computedDay = 1;
  }

  // Ensure computedDay is bounded [1, totalDays]
  computedDay = Math.max(1, Math.min(computedDay, config.totalDays));

  const rewardToday = config.rewards.find(r => r.day === computedDay) || config.rewards[0];

  return {
    canClaimToday: !isAlreadyClaimedToday,
    currentDayIndex: computedDay,
    isStreakBroken,
    progress,
    rewardToday,
  };
}
