import { getTodayKey } from '../data/challenges.js';

export const ACHIEVEMENTS = [
  {
    id: 'first-test',
    title: 'First Keystrokes',
    description: 'Complete your first typing practice test.',
  },
  {
    id: 'speed-60',
    title: 'Steady Tempo',
    description: 'Reach 60 WPM or higher in any practice test.',
  },
  {
    id: 'speed-90',
    title: 'Velocity Flow',
    description: 'Reach 90 WPM or higher in any practice test.',
  },
  {
    id: 'accuracy-98',
    title: 'Clean Precision',
    description: 'Finish a test (15s+ or 25+ words) with 98% accuracy or above.',
  },
  {
    id: 'streak-3',
    title: 'Three-Day Cadence',
    description: 'Practice on 3 consecutive days.',
  },
  {
    id: 'game-explorer',
    title: 'Arcade Explorer',
    description: 'Record a score in at least 3 different typing games.',
  },
  {
    id: 'daily-finisher',
    title: 'Daily Ritual',
    description: 'Complete a Daily Challenge.',
  },
  {
    id: 'dedicated-25',
    title: 'Seasoned Typist',
    description: 'Complete 25 typing practice tests.',
  },
];

export function xpRequiredForLevel(level) {
  if (level <= 1) return 0;
  // Progressive XP curve: Lv2=120, Lv3=280, Lv4=480, Lv5=720...
  return Math.round(60 * (level - 1) * level * 0.6 + 60 * (level - 1));
}

export function getLevelInfo(totalXp = 0) {
  let level = 1;
  while (level < 99 && totalXp >= xpRequiredForLevel(level + 1)) {
    level += 1;
  }
  const currentFloor = xpRequiredForLevel(level);
  const nextFloor = xpRequiredForLevel(level + 1);
  const span = Math.max(1, nextFloor - currentFloor);
  const intoLevel = Math.max(0, totalXp - currentFloor);
  const progressPct = Math.min(100, Math.round((intoLevel / span) * 100));

  const rankTitle =
    level >= 25
      ? 'Virtuoso'
      : level >= 15
      ? 'Master'
      : level >= 10
      ? 'Precision'
      : level >= 6
      ? 'Fluent'
      : level >= 3
      ? 'Steady'
      : 'Initiate';

  return {
    level,
    rankTitle,
    totalXp,
    intoLevel,
    span,
    progressPct,
  };
}

export function calculateTestXp(result) {
  const baseChars = Math.min(600, result.correctChars || 0);
  const charXp = baseChars * 0.18;
  const speedXp = (result.wpm || 0) * 0.35;
  const accBonus = result.accuracy >= 98 ? 18 : result.accuracy >= 95 ? 10 : 0;
  return Math.max(12, Math.round(charXp + speedXp + accBonus));
}

export function calculateGameXp(gameId, score) {
  if (gameId === 'daily-challenge') {
    return Math.max(35, Math.min(110, Math.round((score || 0) * 0.6 + 40)));
  }
  return Math.max(15, Math.min(90, Math.round((score || 0) * 0.04 + 20)));
}

function getYesterdayKey(todayKey) {
  const [y, m, d] = todayKey.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - 1);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function computeNextStreak(profile) {
  const today = getTodayKey();
  const last = profile?.lastActiveDate;
  const currentStreak = profile?.streak || 0;

  if (last === today) {
    return { streak: Math.max(1, currentStreak), lastActiveDate: today };
  }
  if (last === getYesterdayKey(today)) {
    return { streak: currentStreak + 1, lastActiveDate: today };
  }
  return { streak: 1, lastActiveDate: today };
}

export function evaluateAchievements({ profile, history = [], latestTest = null }) {
  const already = new Set(profile?.unlockedAchievements || []);
  const newlyUnlocked = [];

  const check = (id, condition) => {
    if (!already.has(id) && condition) {
      already.add(id);
      const meta = ACHIEVEMENTS.find((a) => a.id === id);
      if (meta) newlyUnlocked.push(meta);
    }
  };

  const totalTests = history.length;
  const maxWpm = history.reduce((m, r) => Math.max(m, r.wpm || 0), latestTest?.wpm || 0);
  const hasHighAcc =
    (latestTest &&
      latestTest.accuracy >= 98 &&
      (latestTest.duration >= 14 || latestTest.totalChars >= 100)) ||
    history.some((r) => r.accuracy >= 98 && (r.duration >= 14 || r.totalChars >= 100));

  const gamesPlayedCount = Object.keys(profile?.gameRecords || {}).filter((gid) => {
    const diffs = profile.gameRecords[gid];
    return diffs && Object.values(diffs).some((v) => v > 0);
  }).length;
  const dailyCount = Object.keys(profile?.dailyChallenges || {}).length;
  const totalGamesStarted = gamesPlayedCount + (dailyCount > 0 ? 1 : 0);

  check('first-test', totalTests >= 1);
  check('speed-60', maxWpm >= 60);
  check('speed-90', maxWpm >= 90);
  check('accuracy-98', hasHighAcc);
  check('streak-3', (profile?.streak || 0) >= 3);
  check('game-explorer', totalGamesStarted >= 3);
  check('daily-finisher', dailyCount >= 1);
  check('dedicated-25', totalTests >= 25);

  return {
    unlockedAchievements: Array.from(already),
    newlyUnlocked,
  };
}
