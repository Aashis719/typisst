/**
 * Standard WPM: (correctChars / 5) / (elapsedSeconds / 60)
 * Raw WPM: (totalTypedChars / 5) / (elapsedSeconds / 60)
 * Accuracy: (correctChars / totalKeystrokes) * 100
 */

export function calculateCharCounts(targetWords, typedWords, currentWordIndex, isFinished = false) {
  let correct = 0;
  let incorrect = 0;
  let extra = 0;
  let missed = 0;

  const limit = isFinished ? typedWords.length : currentWordIndex + 1;

  for (let w = 0; w < Math.min(limit, targetWords.length); w++) {
    const target = targetWords[w] || '';
    const typed = typedWords[w] || '';
    const isCompletedWord = w < currentWordIndex || isFinished;

    if (!isCompletedWord && typed.length === 0) {
      continue;
    }

    const minLen = Math.min(target.length, typed.length);
    for (let c = 0; c < minLen; c++) {
      if (typed[c] === target[c]) {
        correct += 1;
      } else {
        incorrect += 1;
      }
    }

    if (typed.length > target.length) {
      extra += typed.length - target.length;
    } else if (isCompletedWord && typed.length < target.length) {
      missed += target.length - typed.length;
    }

    // Count space after completed words (if user advanced past it)
    if (w < currentWordIndex) {
      if (typed === target) {
        correct += 1;
      } else {
        // Space still counts as a typed delimiter
        correct += 1;
      }
    }
  }

  const totalTyped = correct + incorrect + extra;

  return {
    correct,
    incorrect,
    extra,
    missed,
    totalTyped,
  };
}

export function calculateWpm(correctChars, elapsedSeconds) {
  if (!elapsedSeconds || elapsedSeconds <= 0.1) return 0;
  const minutes = elapsedSeconds / 60;
  return Math.max(0, Math.round(correctChars / 5 / minutes));
}

export function calculateRawWpm(totalTypedChars, elapsedSeconds) {
  if (!elapsedSeconds || elapsedSeconds <= 0.1) return 0;
  const minutes = elapsedSeconds / 60;
  return Math.max(0, Math.round(totalTypedChars / 5 / minutes));
}

export function calculateAccuracy(correctKeystrokes, totalKeystrokes) {
  if (!totalKeystrokes || totalKeystrokes <= 0) return 100;
  const pct = (correctKeystrokes / totalKeystrokes) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function calculateConsistency(wpmSamples) {
  if (!wpmSamples || wpmSamples.length < 2) return 100;
  const valid = wpmSamples.filter((v) => typeof v === 'number' && v >= 0);
  if (valid.length < 2) return 100;

  const mean = valid.reduce((sum, v) => sum + v, 0) / valid.length;
  if (mean <= 0) return 0;

  const variance = valid.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / valid.length;
  const stdDev = Math.sqrt(variance);
  const cv = stdDev / mean;

  // Consistency maps low variation -> near 100%, high variation -> lower
  const score = Math.round(Math.max(0, Math.min(100, 100 - cv * 100)));
  return score;
}

export function formatDuration(seconds) {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s`;
  const mins = Math.floor(s / 60);
  const rem = s % 60;
  if (mins < 60) {
    return rem > 0 ? `${mins}m ${rem}s` : `${mins}m`;
  }
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs}h ${remMins}m`;
}
