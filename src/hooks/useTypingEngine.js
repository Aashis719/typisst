import { useState, useRef, useCallback, useEffect } from 'react';
import { useTimer } from './useTimer.js';
import { generateWordList, pickQuote, parseCustomText } from '../utils/textGenerator.js';
import {
  calculateCharCounts,
  calculateWpm,
  calculateRawWpm,
  calculateAccuracy,
  calculateConsistency,
} from '../utils/typingCalculations.js';
import { playKeySound, playCompleteSound } from '../utils/sound.js';

const MAX_EXTRA_CHARS = 12;

export function useTypingEngine({
  mode = 'time',
  duration = 30,
  wordCount = 25,
  quoteLength = 'all',
  language = 'english',
  punctuation = false,
  numbers = false,
  customText = '',
  soundEnabled = false,
  onTestComplete,
}) {
  const [words, setWords] = useState([]);
  const [quoteMeta, setQuoteMeta] = useState(null);
  const [typedWords, setTypedWords] = useState(['']);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [status, setStatus] = useState('idle'); // 'idle' | 'running' | 'finished'
  const [result, setResult] = useState(null);
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);

  // Refs to read latest state inside timer ticks and key handlers without stale closures
  const wordsRef = useRef(words);
  wordsRef.current = words;

  const typedWordsRef = useRef(typedWords);
  typedWordsRef.current = typedWords;

  const wordIdxRef = useRef(currentWordIndex);
  wordIdxRef.current = currentWordIndex;

  const statusRef = useRef(status);
  statusRef.current = status;

  const keystrokesRef = useRef({ total: 0, correct: 0 });
  const wpmTimelineRef = useRef([]);
  const lastQuoteIdRef = useRef(null);
  const onTestCompleteRef = useRef(onTestComplete);
  onTestCompleteRef.current = onTestComplete;

  const buildWordSet = useCallback(() => {
    if (mode === 'quote') {
      const q = pickQuote(quoteLength, lastQuoteIdRef.current);
      lastQuoteIdRef.current = q.id;
      setQuoteMeta({ author: q.author, length: q.length });
      return q.text.split(' ');
    }
    setQuoteMeta(null);
    if (mode === 'custom') {
      return parseCustomText(customText);
    }
    if (mode === 'words') {
      return generateWordList({ language, count: wordCount, punctuation, numbers });
    }
    // Time or Zen mode starts with a comfortable buffer and appends dynamically
    return generateWordList({ language, count: 80, punctuation, numbers });
  }, [mode, quoteLength, customText, language, wordCount, punctuation, numbers]);

  const finishTest = useCallback(
    (finalDurationSeconds) => {
      if (statusRef.current === 'finished') return;
      statusRef.current = 'finished';
      setStatus('finished');

      const durationSec = Math.max(0.5, finalDurationSeconds || 1);
      const counts = calculateCharCounts(
        wordsRef.current,
        typedWordsRef.current,
        wordIdxRef.current,
        true
      );

      const finalWpm = calculateWpm(counts.correct, durationSec);
      const rawWpm = calculateRawWpm(counts.totalTyped, durationSec);
      const accuracy = calculateAccuracy(
        keystrokesRef.current.correct,
        keystrokesRef.current.total
      );

      const timeline = [...wpmTimelineRef.current];
      if (timeline.length === 0 || timeline[timeline.length - 1].second < Math.round(durationSec)) {
        timeline.push({
          second: Math.max(1, Math.round(durationSec)),
          wpm: finalWpm,
          raw: rawWpm,
        });
      }

      const consistency = calculateConsistency(timeline.map((p) => p.wpm));

      const finalResult = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        mode,
        subValue:
          mode === 'time'
            ? duration
            : mode === 'words'
            ? wordCount
            : mode === 'quote'
            ? quoteLength
            : mode,
        language,
        punctuation,
        numbers,
        wpm: finalWpm,
        rawWpm,
        accuracy,
        consistency,
        correctChars: counts.correct,
        incorrectChars: counts.incorrect + counts.extra,
        missedChars: counts.missed,
        totalChars: counts.totalTyped,
        duration: Math.round(durationSec * 10) / 10,
        wpmTimeline: timeline,
        quoteAuthor: quoteMeta?.author || null,
      };

      playCompleteSound(soundEnabled);
      setResult(finalResult);
      if (onTestCompleteRef.current) {
        onTestCompleteRef.current(finalResult);
      }
    },
    [duration, language, mode, numbers, punctuation, quoteLength, quoteMeta, soundEnabled, wordCount]
  );

  const handleSecondTick = useCallback(
    (wholeSec, exactSec) => {
      if (statusRef.current !== 'running') return;
      const counts = calculateCharCounts(
        wordsRef.current,
        typedWordsRef.current,
        wordIdxRef.current,
        false
      );
      const curWpm = calculateWpm(counts.correct, exactSec);
      const curRaw = calculateRawWpm(counts.totalTyped, exactSec);
      const curAcc = calculateAccuracy(
        keystrokesRef.current.correct,
        keystrokesRef.current.total
      );
      setLiveWpm(curWpm);
      setLiveAccuracy(curAcc);
      wpmTimelineRef.current.push({
        second: wholeSec,
        wpm: curWpm,
        raw: curRaw,
      });
    },
    []
  );

  const timer = useTimer({
    mode: mode === 'time' ? 'countdown' : 'countup',
    durationSeconds: duration,
    onComplete: (completedSec) => finishTest(completedSec),
    onSecondTick: handleSecondTick,
  });

  const restartTest = useCallback(
    (keepSameText = false) => {
      timer.reset();
      const nextWords = keepSameText && wordsRef.current.length > 0 ? wordsRef.current : buildWordSet();
      wordsRef.current = nextWords;
      setWords(nextWords);

      const initialTyped = [''];
      typedWordsRef.current = initialTyped;
      setTypedWords(initialTyped);

      wordIdxRef.current = 0;
      setCurrentWordIndex(0);

      keystrokesRef.current = { total: 0, correct: 0 };
      wpmTimelineRef.current = [];
      statusRef.current = 'idle';
      setStatus('idle');
      setResult(null);
      setLiveWpm(0);
      setLiveAccuracy(100);
    },
    [buildWordSet, timer]
  );

  // Re-initialize whenever configuration changes
  useEffect(() => {
    restartTest(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, duration, wordCount, quoteLength, language, punctuation, numbers, customText]);

  const finishZenTest = useCallback(() => {
    if (statusRef.current !== 'running') return;
    const elapsed = timer.stop();
    finishTest(elapsed / 1000);
  }, [finishTest, timer]);

  // Append more words smoothly in Time or Zen mode when user approaches the end
  const maybeAppendWords = useCallback(
    (idx) => {
      if (mode !== 'time' && mode !== 'zen') return;
      if (wordsRef.current.length - idx < 30) {
        const more = generateWordList({ language, count: 50, punctuation, numbers });
        const updated = [...wordsRef.current, ...more];
        wordsRef.current = updated;
        setWords(updated);
      }
    },
    [language, mode, numbers, punctuation]
  );

  const processInputChar = useCallback(
    (char) => {
      if (statusRef.current === 'finished') return;

      if (statusRef.current === 'idle') {
        statusRef.current = 'running';
        setStatus('running');
        timer.start();
      }

      const idx = wordIdxRef.current;
      const targetWord = wordsRef.current[idx] || '';
      const currentTyped = typedWordsRef.current[idx] || '';

      // Space advances to the next word (if current word has at least 1 typed char)
      if (char === ' ') {
        if (currentTyped.length === 0) return;

        keystrokesRef.current.total += 1;
        if (currentTyped === targetWord) {
          keystrokesRef.current.correct += 1;
          playKeySound(soundEnabled, false);
        } else {
          playKeySound(soundEnabled, true);
        }

        const nextIdx = idx + 1;

        // Check completion for finite modes
        if (mode !== 'time' && mode !== 'zen' && nextIdx >= wordsRef.current.length) {
          const finalElapsed = timer.stop();
          finishTest(finalElapsed / 1000);
          return;
        }

        maybeAppendWords(nextIdx);
        const nextTypedArr = [...typedWordsRef.current];
        if (nextTypedArr.length <= nextIdx) {
          nextTypedArr.push('');
        }
        typedWordsRef.current = nextTypedArr;
        setTypedWords(nextTypedArr);
        wordIdxRef.current = nextIdx;
        setCurrentWordIndex(nextIdx);
        return;
      }

      // Printable character
      if (currentTyped.length >= targetWord.length + MAX_EXTRA_CHARS) {
        return;
      }

      const expectedChar = targetWord[currentTyped.length];
      const isCharCorrect = expectedChar !== undefined && char === expectedChar;

      keystrokesRef.current.total += 1;
      if (isCharCorrect) {
        keystrokesRef.current.correct += 1;
      }
      playKeySound(soundEnabled, !isCharCorrect);

      const updatedWord = currentTyped + char;
      const nextTypedArr = [...typedWordsRef.current];
      nextTypedArr[idx] = updatedWord;
      typedWordsRef.current = nextTypedArr;
      setTypedWords(nextTypedArr);

      // Update live accuracy quickly
      setLiveAccuracy(
        calculateAccuracy(keystrokesRef.current.correct, keystrokesRef.current.total)
      );

      // Auto-complete final word in finite modes as soon as it matches cleanly
      if (
        mode !== 'time' &&
        mode !== 'zen' &&
        idx === wordsRef.current.length - 1 &&
        updatedWord === targetWord
      ) {
        const finalElapsed = timer.stop();
        finishTest(finalElapsed / 1000);
      }
    },
    [finishTest, maybeAppendWords, mode, soundEnabled, timer]
  );

  const handleBackspace = useCallback(
    (deleteWord = false) => {
      if (statusRef.current !== 'running' && statusRef.current !== 'idle') return;
      const idx = wordIdxRef.current;
      const currentTyped = typedWordsRef.current[idx] || '';

      if (currentTyped.length > 0) {
        const nextTypedArr = [...typedWordsRef.current];
        nextTypedArr[idx] = deleteWord ? '' : currentTyped.slice(0, -1);
        typedWordsRef.current = nextTypedArr;
        setTypedWords(nextTypedArr);
        return;
      }

      // Allow returning to previous word if it had mistakes or wasn't exact
      if (idx > 0) {
        const prevIdx = idx - 1;
        const prevTarget = wordsRef.current[prevIdx] || '';
        const prevTyped = typedWordsRef.current[prevIdx] || '';
        if (prevTyped !== prevTarget) {
          wordIdxRef.current = prevIdx;
          setCurrentWordIndex(prevIdx);
        }
      }
    },
    []
  );

  return {
    words,
    quoteMeta,
    typedWords,
    currentWordIndex,
    status,
    result,
    liveWpm,
    liveAccuracy,
    elapsedSeconds: timer.elapsedSeconds,
    remainingSeconds: timer.remainingSeconds,
    processInputChar,
    handleBackspace,
    restartTest,
    finishZenTest,
  };
}
