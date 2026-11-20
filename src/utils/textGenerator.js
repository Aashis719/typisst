import { WORD_BANKS } from '../data/words.js';
import { QUOTES } from '../data/quotes.js';

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

export function generateWordList({
  language = 'english',
  count = 60,
  punctuation = false,
  numbers = false,
} = {}) {
  const bank = WORD_BANKS[language] || WORD_BANKS.english;
  const words = [];
  let capitalizeNext = punctuation;

  for (let i = 0; i < count; i++) {
    // Optionally inject a realistic number token
    if (numbers && i > 0 && Math.random() < 0.12) {
      const useYear = Math.random() < 0.3;
      const numStr = useYear
        ? String(1980 + randomInt(48))
        : String(1 + randomInt(999));
      words.push(numStr);
      capitalizeNext = false;
      continue;
    }

    let word = bank[randomInt(bank.length)];
    // Avoid immediate duplicate word
    if (words.length > 0 && word === words[words.length - 1].toLowerCase().replace(/[^a-z]/g, '')) {
      word = bank[(bank.indexOf(word) + 1 + randomInt(5)) % bank.length];
    }

    if (punctuation && language !== 'code') {
      if (capitalizeNext) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
        capitalizeNext = false;
      }

      const roll = Math.random();
      if (i === count - 1) {
        word = `${word}.`;
      } else if (roll < 0.14) {
        word = `${word},`;
      } else if (roll < 0.22) {
        const endMark = Math.random() < 0.2 ? '?' : '.';
        word = `${word}${endMark}`;
        capitalizeNext = true;
      } else if (roll < 0.25) {
        word = `${word};`;
      } else if (roll < 0.28 && word.length > 3) {
        word = `"${word}"`;
      }
    }

    words.push(word);
  }

  return words;
}

export function pickQuote(lengthFilter = 'all', excludeId = null) {
  let pool = QUOTES;
  if (lengthFilter && lengthFilter !== 'all') {
    const filtered = QUOTES.filter((q) => q.length === lengthFilter);
    if (filtered.length > 0) pool = filtered;
  }
  if (pool.length > 1 && excludeId) {
    pool = pool.filter((q) => q.id !== excludeId);
  }
  return pool[randomInt(pool.length)];
}

export function parseCustomText(rawText) {
  const cleaned = (rawText || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) {
    return ['Type', 'your', 'custom', 'practice', 'passage', 'here.'];
  }
  return cleaned.split(' ');
}
