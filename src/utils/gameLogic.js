import { WORD_BANKS } from '../data/words.js';
import { SURVIVAL_TIERS } from '../data/challenges.js';

export const GAMES_META = [
  {
    id: 'falling-words',
    name: 'Falling Words',
    shortDesc: 'Clear descending words before they reach the floor.',
    metricLabel: 'Best Score',
    difficulties: ['easy', 'medium', 'hard'],
  },
  {
    id: 'word-sprint',
    name: 'Word Sprint',
    shortDesc: 'Race through a fixed word queue as fast as possible.',
    metricLabel: 'Best Score',
    difficulties: ['easy', 'medium', 'hard'],
  },
  {
    id: 'survival-mode',
    name: 'Survival Mode',
    shortDesc: 'Endure escalating tiers with three lives—every typo costs one.',
    metricLabel: 'Best Score',
    difficulties: ['easy', 'medium', 'hard'],
  },
  {
    id: 'accuracy-challenge',
    name: 'Accuracy Challenge',
    shortDesc: 'Master tricky passages where precision defines your rank.',
    metricLabel: 'Best Score',
    difficulties: ['easy', 'medium', 'hard'],
  },
  {
    id: 'daily-challenge',
    name: 'Daily Challenge',
    shortDesc: 'Compete on today’s fixed passage and refine your best run.',
    metricLabel: 'Best Today',
    difficulties: ['standard'],
  },
];

export const SPRINT_CONFIG = {
  easy: { count: 20, parSec: 45, label: 'Easy · 20 words' },
  medium: { count: 35, parSec: 50, label: 'Medium · 35 words' },
  hard: { count: 50, parSec: 55, label: 'Hard · 50 words' },
};

export function pickFallingWord(difficulty, level, activeWords = []) {
  const bank = WORD_BANKS.english;
  const activeSet = new Set(activeWords.map((w) => w.toLowerCase()));
  const activeStarts = new Set(activeWords.map((w) => w[0]?.toLowerCase()).filter(Boolean));

  let pool;
  if (difficulty === 'easy') {
    const maxLen = Math.min(7, 5 + Math.floor((level - 1) / 2));
    pool = bank.filter((w) => w.length >= 3 && w.length <= maxLen);
  } else if (difficulty === 'medium') {
    const minLen = 4;
    const maxLen = Math.min(10, 7 + Math.floor((level - 1) / 2));
    pool = bank.filter((w) => w.length >= minLen && w.length <= maxLen);
    if (level >= 3) {
      pool = pool.concat(SURVIVAL_TIERS[2]);
    }
  } else {
    const minLen = Math.min(7, 5 + Math.floor((level - 1) / 2));
    pool = bank.filter((w) => w.length >= minLen && w.length <= 12);
    pool = pool.concat(SURVIVAL_TIERS[2]);
    if (level >= 2) {
      pool = pool.concat(SURVIVAL_TIERS[3]);
    }
    if (level >= 4) {
      pool = pool.concat(SURVIVAL_TIERS[4].filter((w) => /^[a-z0-9'-]+$/i.test(w)));
    }
  }

  if (pool.length === 0) pool = bank;

  // Prefer words not already on screen and ideally with a distinct opening letter
  const nonDup = pool.filter((w) => !activeSet.has(w.toLowerCase()));
  const distinctStart = nonDup.filter((w) => !activeStarts.has(w[0]?.toLowerCase()));
  const finalPool = distinctStart.length > 0 ? distinctStart : nonDup.length > 0 ? nonDup : pool;

  return finalPool[Math.floor(Math.random() * finalPool.length)];
}

export function pickSprintWords(difficulty) {
  const count = SPRINT_CONFIG[difficulty]?.count || 35;
  let bank;

  if (difficulty === 'easy') {
    bank = WORD_BANKS.english.filter((w) => w.length >= 3 && w.length <= 6);
  } else if (difficulty === 'medium') {
    bank = WORD_BANKS.english.filter((w) => w.length >= 4 && w.length <= 9);
  } else {
    bank = [
      ...WORD_BANKS.english.filter((w) => w.length >= 6),
      ...SURVIVAL_TIERS[2],
      ...SURVIVAL_TIERS[3],
    ];
  }

  const words = [];
  for (let i = 0; i < count; i++) {
    let candidate = bank[Math.floor(Math.random() * bank.length)];
    if (words.length > 0 && candidate === words[words.length - 1] && bank.length > 1) {
      candidate = bank[(bank.indexOf(candidate) + 1) % bank.length];
    }
    words.push(candidate);
  }
  return words;
}

export function pickSurvivalWord(streak, difficulty, currentWord = '') {
  const step = difficulty === 'easy' ? 6 : difficulty === 'medium' ? 4 : 3;
  const baseTier = difficulty === 'hard' ? 1 : 0;
  const tierIndex = Math.min(
    SURVIVAL_TIERS.length - 1,
    baseTier + Math.floor(streak / step)
  );
  const pool = SURVIVAL_TIERS[tierIndex].filter((w) => w !== currentWord);
  const finalPool = pool.length > 0 ? pool : SURVIVAL_TIERS[tierIndex];

  return {
    word: finalPool[Math.floor(Math.random() * finalPool.length)],
    tier: tierIndex + 1,
    round: streak + 1,
  };
}

export function getAccuracyRating(accuracy, difficulty = 'medium') {
  if (difficulty === 'hard') {
    if (accuracy >= 99.5) return 'S';
    if (accuracy >= 97) return 'A';
    if (accuracy >= 93) return 'B';
    if (accuracy >= 87) return 'C';
    return 'D';
  }
  if (difficulty === 'easy') {
    if (accuracy >= 98) return 'S';
    if (accuracy >= 95) return 'A';
    if (accuracy >= 90) return 'B';
    if (accuracy >= 83) return 'C';
    return 'D';
  }
  if (accuracy >= 99) return 'S';
  if (accuracy >= 96) return 'A';
  if (accuracy >= 92) return 'B';
  if (accuracy >= 85) return 'C';
  return 'D';
}
