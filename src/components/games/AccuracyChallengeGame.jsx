import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Play, RotateCcw, ArrowLeft, Target, AlertCircle, Trophy } from 'lucide-react';
import { ACCURACY_CHALLENGES } from '../../data/challenges.js';
import { getAccuracyRating } from '../../utils/gameLogic.js';
import { calculateWpm, calculateAccuracy } from '../../utils/typingCalculations.js';
import { playKeySound, playCompleteSound } from '../../utils/sound.js';
import { AccuracyRingSvg, GameEmblem } from '../GameVisuals.jsx';
import { AnimatedNumber, TF_EASE } from '../../utils/motion.js';

const ACC_DIFF_CONFIG = {
  easy: {
    penalty: 20,
    hint: 'Familiar sentences · -20 pts per mistake',
  },
  medium: {
    penalty: 35,
    hint: 'Nuanced vocabulary & punctuation · -35 pts per mistake',
  },
  hard: {
    penalty: 50,
    hint: 'Numbers, symbols & technical prose · -50 pts per mistake · Strict rank',
  },
};

export default function AccuracyChallengeGame({
  bestScores = {},
  soundEnabled = false,
  onSaveRecord,
  onBack,
}) {
  const [difficulty, setDifficulty] = useState('medium');
  const [phase, setPhase] = useState('menu'); // 'menu' | 'playing' | 'finished'
  const [passage, setPassage] = useState('');
  const [typed, setTyped] = useState('');
  const [mistakes, setMistakes] = useState(0);
  const [totalKeystrokes, setTotalKeystrokes] = useState(0);
  const [errorPulse, setErrorPulse] = useState(false);
  const [summary, setSummary] = useState(null);

  const inputRef = useRef(null);
  const startRef = useRef(null);
  const phaseRef = useRef('menu');
  const passageRef = useRef('');
  const typedRef = useRef('');
  const mistakesRef = useRef(0);
  const totalKeysRef = useRef(0);
  const timersRef = useRef([]);

  phaseRef.current = phase;

  const scheduleTimer = useCallback((fn, delay) => {
    const id = setTimeout(() => {
      timersRef.current = timersRef.current.filter((t) => t !== id);
      fn();
    }, delay);
    timersRef.current.push(id);
    return id;
  }, []);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  const startGame = useCallback(() => {
    clearAllTimers();
    const pool = ACCURACY_CHALLENGES[difficulty] || ACCURACY_CHALLENGES.medium;
    const candidates = pool.filter((p) => p !== passageRef.current);
    const finalPool = candidates.length > 0 ? candidates : pool;
    const text = finalPool[Math.floor(Math.random() * finalPool.length)];

    passageRef.current = text;
    typedRef.current = '';
    mistakesRef.current = 0;
    totalKeysRef.current = 0;
    startRef.current = null;

    setPassage(text);
    setTyped('');
    setMistakes(0);
    setTotalKeystrokes(0);
    setErrorPulse(false);
    setSummary(null);

    phaseRef.current = 'playing';
    setPhase('playing');
    scheduleTimer(() => inputRef.current?.focus(), 20);
  }, [clearAllTimers, difficulty, scheduleTimer]);

  const handleInput = (val) => {
    if (phaseRef.current !== 'playing') return;

    if (startRef.current === null && val.length > 0) {
      startRef.current = performance.now();
    }

    const prevTyped = typedRef.current;
    if (val.length < prevTyped.length) {
      typedRef.current = val;
      setTyped(val);
      return;
    }

    const activePassage = passageRef.current;
    const added = val.slice(prevTyped.length);
    let nextTyped = prevTyped;
    let nextMistakes = mistakesRef.current;
    let nextTotal = totalKeysRef.current;

    for (const ch of added) {
      if (nextTyped.length >= activePassage.length) break;
      nextTotal += 1;
      const expected = activePassage[nextTyped.length];
      if (ch === expected) {
        nextTyped += ch;
        playKeySound(soundEnabled, false);
      } else {
        nextMistakes += 1;
        setErrorPulse(true);
        scheduleTimer(() => setErrorPulse(false), 220);
        playKeySound(soundEnabled, true);
      }
    }

    typedRef.current = nextTyped;
    mistakesRef.current = nextMistakes;
    totalKeysRef.current = nextTotal;

    setTyped(nextTyped);
    setMistakes(nextMistakes);
    setTotalKeystrokes(nextTotal);

    if (nextTyped.length === activePassage.length) {
      const elapsedSec = Math.max(
        1,
        (performance.now() - (startRef.current || performance.now())) / 1000
      );
      const correctKeys = Math.max(0, nextTotal - nextMistakes);
      const acc = calculateAccuracy(correctKeys, nextTotal);
      const wpm = calculateWpm(activePassage.length, elapsedSec);

      // Precision strictly determines score; speed never compensates for mistakes
      const penalty = ACC_DIFF_CONFIG[difficulty]?.penalty || 35;
      const score = Math.max(0, Math.round(acc * 10 - nextMistakes * penalty));
      const rating = getAccuracyRating(acc, difficulty);
      const prevBest = bestScores[difficulty] || 0;
      const isNewBest = score > prevBest;

      phaseRef.current = 'finished';
      setPhase('finished');
      playCompleteSound(soundEnabled);

      setSummary({
        score,
        accuracy: acc,
        rating,
        mistakes: nextMistakes,
        wpm,
        duration: elapsedSec.toFixed(1),
        difficulty,
        prevBest,
        isNewBest,
      });

      if (onSaveRecord) {
        onSaveRecord('accuracy-challenge', difficulty, score);
      }
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (phaseRef.current === 'menu' && e.key === 'Enter') {
        e.preventDefault();
        startGame();
      } else if (phaseRef.current === 'playing') {
        if (e.key === 'Tab') {
          e.preventDefault();
          startGame();
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          inputRef.current?.focus({ preventScroll: true });
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [startGame]);

  const liveAcc =
    totalKeystrokes > 0
      ? Math.max(0, Math.round(((totalKeystrokes - mistakes) / totalKeystrokes) * 100))
      : 100;
  const progressPct =
    passage.length > 0 ? Math.round((typed.length / passage.length) * 100) : 0;
  const penalty = ACC_DIFF_CONFIG[difficulty]?.penalty || 35;

  return (
    <div className="w-full max-w-[840px] mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--tf-text-muted)] hover:text-[var(--tf-text)] cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
            <span>All games</span>
          </button>
          <span className="text-[var(--tf-border)]">·</span>
          <div className="flex items-center gap-2">
            <GameEmblem gameId="accuracy-challenge" className="w-5 h-5" />
            <h2 className="text-lg font-semibold text-[var(--tf-text)]">Accuracy Challenge</h2>
          </div>
        </div>

        <div className="flex items-center gap-5 text-xs sm:text-sm font-typing tabular-nums text-[var(--tf-text-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-[var(--tf-accent)]" strokeWidth={1.75} />
            <span>
              Accuracy: <strong className="text-[var(--tf-accent)]">{liveAcc}%</strong>
            </span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-[var(--tf-error)]" strokeWidth={1.75} />
            <span>
              Mistakes: <strong className="text-[var(--tf-error)]">{mistakes}</strong>
            </span>
          </span>
        </div>
      </div>

      <div
        onClick={() => phase === 'playing' && inputRef.current?.focus()}
        className={`relative w-full min-h-[380px] rounded-xl bg-[var(--tf-surface)]/55 border p-6 sm:p-10 flex flex-col items-center justify-center transition-colors duration-150 ${
          errorPulse ? 'border-[var(--tf-error)]' : 'border-[var(--tf-border)]'
        }`}
      >
        <AnimatePresence mode="wait">
          {phase === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: TF_EASE }}
              className="text-center max-w-md"
            >
              <GameEmblem gameId="accuracy-challenge" className="w-12 h-12 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-[var(--tf-text)]">Accuracy Challenge</h3>
              <p className="mt-2 text-sm text-[var(--tf-text-muted)]">
                Precision defines your score and rank. Only exact characters advance—take your time and keep errors at zero.
              </p>
              <div className="mt-5 inline-flex items-center gap-1 p-1 rounded-lg bg-[var(--tf-bg)] border border-[var(--tf-border)]">
                {['easy', 'medium', 'hard'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-medium capitalize cursor-pointer transition-colors ${
                      difficulty === d
                        ? 'bg-[var(--tf-surface)] text-[var(--tf-accent)]'
                        : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text)]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div className="mt-2.5 text-xs text-[var(--tf-text-muted)]">
                {ACC_DIFF_CONFIG[difficulty].hint}
              </div>
              <div className="mt-2 text-xs font-typing tabular-nums text-[var(--tf-text-muted)]">
                Personal Best ({difficulty}): {bestScores[difficulty] || 0} pts
              </div>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={startGame}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--tf-accent)] text-[var(--tf-accent-fg)] text-sm font-semibold hover:opacity-90 cursor-pointer"
              >
                <Play className="w-4 h-4" strokeWidth={2} />
                <span>Start Challenge (Enter)</span>
              </motion.button>
            </motion.div>
          )}

          {phase === 'playing' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-2xl"
            >
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex-1 h-1.5 rounded-full bg-[var(--tf-border)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--tf-accent)] transition-all duration-150"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="relative flex items-center justify-center shrink-0">
                  <AccuracyRingSvg percentage={liveAcc} size={42} strokeWidth={3.5} />
                  <span className="absolute text-[10px] font-typing tabular-nums text-[var(--tf-text)]">
                    {liveAcc}%
                  </span>
                </div>
              </div>

              <div className="font-typing text-xl sm:text-2xl leading-relaxed tracking-wide select-none break-words">
                {passage.split('').map((ch, idx) => {
                  const isDone = idx < typed.length;
                  const isCurrent = idx === typed.length;
                  return (
                    <span
                      key={idx}
                      className={
                        isDone
                          ? 'text-[var(--tf-text)]'
                          : isCurrent
                          ? `rounded-xs ${
                              errorPulse
                                ? 'bg-[var(--tf-error)] text-white'
                                : 'bg-[var(--tf-accent)] text-[var(--tf-accent-fg)]'
                            }`
                          : 'text-[var(--tf-text-dim)]'
                      }
                    >
                      {ch}
                    </span>
                  );
                })}
              </div>

              <input
                ref={inputRef}
                type="text"
                value={typed}
                onChange={(e) => handleInput(e.target.value)}
                aria-label="Accuracy challenge input"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                className="sr-only"
              />

              <div className="mt-6 flex items-center justify-between text-xs text-[var(--tf-text-muted)] font-typing">
                <span>
                  {difficulty} · each mistake subtracts {penalty} pts
                </span>
                <span>Tab to restart</span>
              </div>
            </motion.div>
          )}

          {phase === 'finished' && summary && (
            <motion.div
              key="finished"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: TF_EASE }}
              className="text-center"
            >
              <div className="relative inline-flex items-center justify-center mb-3">
                <AccuracyRingSvg percentage={summary.accuracy} size={78} strokeWidth={5} />
                <span className="absolute font-typing text-2xl font-bold text-[var(--tf-accent)]">
                  {summary.rating}
                </span>
              </div>

              <div className="text-xs font-typing uppercase tracking-wider text-[var(--tf-text-muted)] mb-1">
                Accuracy Challenge · {summary.difficulty}
              </div>
              <h3 className="text-xl font-semibold text-[var(--tf-text)]">Challenge Complete</h3>
              {summary.isNewBest ? (
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--tf-accent)]">
                  <Trophy className="w-4 h-4" strokeWidth={1.9} />
                  <span>
                    New Personal Best!
                    {summary.prevBest > 0 ? ` (+${summary.score - summary.prevBest} pts)` : ''}
                  </span>
                </div>
              ) : summary.prevBest > 0 ? (
                <div className="mt-2 text-xs font-typing tabular-nums text-[var(--tf-text-muted)]">
                  Personal Best ({summary.difficulty}): {summary.prevBest} pts
                </div>
              ) : null}

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-6 font-typing tabular-nums">
                <div>
                  <div className="text-xs text-[var(--tf-text-muted)]">Score</div>
                  <div className="text-2xl font-bold text-[var(--tf-accent)]">
                    <AnimatedNumber value={summary.score} duration={0.45} />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--tf-text-muted)]">Accuracy</div>
                  <div className="text-2xl font-bold text-[var(--tf-text)]">{summary.accuracy}%</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--tf-text-muted)]">Mistakes</div>
                  <div className="text-2xl font-bold text-[var(--tf-error)]">{summary.mistakes}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--tf-text-muted)]">Pace (Info)</div>
                  <div className="text-2xl font-bold text-[var(--tf-text-muted)]">{summary.wpm} wpm</div>
                </div>
              </div>

              <div className="mt-7 flex items-center justify-center gap-3">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={startGame}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--tf-accent)] text-[var(--tf-accent-fg)] text-sm font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" strokeWidth={1.85} />
                  <span>Try Another</span>
                </motion.button>
                <button
                  type="button"
                  onClick={() => setPhase('menu')}
                  className="px-4 py-2.5 rounded-lg bg-[var(--tf-bg)] border border-[var(--tf-border)] text-sm font-medium text-[var(--tf-text)] cursor-pointer hover:bg-[var(--tf-surface)] transition-colors"
                >
                  Change Difficulty
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
