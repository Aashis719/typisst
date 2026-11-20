import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Play, RotateCcw, ArrowLeft, Trophy, Timer, Zap } from 'lucide-react';
import { pickSprintWords, SPRINT_CONFIG } from '../../utils/gameLogic.js';
import { calculateWpm, calculateAccuracy } from '../../utils/typingCalculations.js';
import { playKeySound, playCompleteSound } from '../../utils/sound.js';
import { GameEmblem } from '../GameVisuals.jsx';
import { AnimatedNumber, TF_EASE } from '../../utils/motion.js';

const SPRINT_DIFF_HINTS = {
  easy: '20 short words · 45s par target',
  medium: '35 varied words · 50s par target',
  hard: '50 complex & hyphenated words · 55s par target',
};

export default function WordSprintGame({
  bestScores = {},
  soundEnabled = false,
  onSaveRecord,
  onBack,
}) {
  const [difficulty, setDifficulty] = useState('medium');
  const [phase, setPhase] = useState('menu'); // 'menu' | 'countdown' | 'playing' | 'finished'
  const [countdownVal, setCountdownVal] = useState(3);
  const [queue, setQueue] = useState([]);
  const [wordIdx, setWordIdx] = useState(0);
  const [typed, setTyped] = useState('');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [summary, setSummary] = useState(null);

  const inputRef = useRef(null);
  const startRef = useRef(null);
  const intervalRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const focusTimerRef = useRef(null);
  const queueRef = useRef([]);
  const wordIdxRef = useRef(0);
  const typedRef = useRef('');
  const statsRef = useRef({ correctChars: 0, totalKeystrokes: 0, correctKeystrokes: 0, mistakes: 0 });
  const phaseRef = useRef('menu');
  phaseRef.current = phase;

  const stopClock = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (focusTimerRef.current) {
      clearTimeout(focusTimerRef.current);
      focusTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopClock(), [stopClock]);

  const beginPlayPhase = useCallback(() => {
    startRef.current = performance.now();
    phaseRef.current = 'playing';
    setPhase('playing');
    intervalRef.current = setInterval(() => {
      if (startRef.current !== null) {
        setElapsedMs(performance.now() - startRef.current);
      }
    }, 50);
    focusTimerRef.current = setTimeout(() => inputRef.current?.focus(), 20);
  }, []);

  const startGame = useCallback(() => {
    stopClock();
    const words = pickSprintWords(difficulty);
    queueRef.current = words;
    wordIdxRef.current = 0;
    typedRef.current = '';
    statsRef.current = { correctChars: 0, totalKeystrokes: 0, correctKeystrokes: 0, mistakes: 0 };

    setQueue(words);
    setWordIdx(0);
    setTyped('');
    setElapsedMs(0);
    setMistakes(0);
    setSummary(null);

    setCountdownVal(3);
    phaseRef.current = 'countdown';
    setPhase('countdown');

    let step = 3;
    countdownTimerRef.current = setInterval(() => {
      step -= 1;
      if (step <= 0) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        beginPlayPhase();
      } else {
        setCountdownVal(step);
      }
    }, 520);
  }, [beginPlayPhase, difficulty, stopClock]);

  const finishSprint = useCallback(
    (finalElapsedSec) => {
      stopClock();
      phaseRef.current = 'finished';
      setPhase('finished');
      playCompleteSound(soundEnabled);

      const wpm = calculateWpm(statsRef.current.correctChars, finalElapsedSec);
      const acc = calculateAccuracy(
        statsRef.current.correctKeystrokes,
        statsRef.current.totalKeystrokes
      );
      const parSec = SPRINT_CONFIG[difficulty]?.parSec || 50;
      const paceBonus = finalElapsedSec <= parSec ? 60 : 0;
      const score = Math.max(0, Math.round(wpm * (acc / 100) * 10 + paceBonus));
      const prevBest = bestScores[difficulty] || 0;
      const isNewBest = score > prevBest;

      setSummary({
        wpm,
        accuracy: acc,
        time: finalElapsedSec.toFixed(1),
        parSec,
        beatPar: finalElapsedSec <= parSec,
        mistakes: statsRef.current.mistakes,
        score,
        difficulty,
        prevBest,
        isNewBest,
      });

      if (onSaveRecord) {
        onSaveRecord('word-sprint', difficulty, score);
      }
    },
    [bestScores, difficulty, onSaveRecord, soundEnabled, stopClock]
  );

  const advanceWord = useCallback(
    (target) => {
      statsRef.current.correctChars += target.length + 1;
      const nextIdx = wordIdxRef.current + 1;
      typedRef.current = '';
      setTyped('');

      if (nextIdx >= queueRef.current.length) {
        const totalSec = Math.max(0.5, (performance.now() - startRef.current) / 1000);
        finishSprint(totalSec);
      } else {
        wordIdxRef.current = nextIdx;
        setWordIdx(nextIdx);
      }
    },
    [finishSprint]
  );

  const handleInput = (val) => {
    if (phaseRef.current !== 'playing') return;
    const target = queueRef.current[wordIdxRef.current] || '';

    if (val.endsWith(' ')) {
      const clean = val.trimEnd();
      if (clean === target) {
        advanceWord(target);
      }
      return;
    }

    const prevTyped = typedRef.current;
    if (val.length > prevTyped.length) {
      const added = val.slice(prevTyped.length);
      for (let i = 0; i < added.length; i++) {
        const charIdx = prevTyped.length + i;
        statsRef.current.totalKeystrokes += 1;
        if (target[charIdx] !== undefined && added[i] === target[charIdx]) {
          statsRef.current.correctKeystrokes += 1;
          playKeySound(soundEnabled, false);
        } else {
          statsRef.current.mistakes += 1;
          setMistakes(statsRef.current.mistakes);
          playKeySound(soundEnabled, true);
        }
      }
    }

    typedRef.current = val;
    setTyped(val);

    if (val === target) {
      advanceWord(target);
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

  const currentWord = queue[wordIdx] || '';
  const upcomingWords = queue.slice(wordIdx + 1, wordIdx + 5);
  const progressPct = queue.length > 0 ? Math.round((wordIdx / queue.length) * 100) : 0;
  const liveWpm =
    elapsedMs > 400
      ? calculateWpm(statsRef.current.correctChars, elapsedMs / 1000)
      : 0;
  const parSec = SPRINT_CONFIG[difficulty]?.parSec || 50;

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
            <GameEmblem gameId="word-sprint" className="w-5 h-5" />
            <h2 className="text-lg font-semibold text-[var(--tf-text)]">Word Sprint</h2>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs sm:text-sm font-typing tabular-nums text-[var(--tf-text-muted)]">
          {phase === 'playing' && (
            <>
              <span className="inline-flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-[var(--tf-accent)]" strokeWidth={1.75} />
                <span>{liveWpm} wpm</span>
              </span>
              <span>
                Mistakes: <strong className={mistakes > 0 ? 'text-[var(--tf-error)]' : 'text-[var(--tf-text)]'}>{mistakes}</strong>
              </span>
            </>
          )}
          <span>
            Words: <strong className="text-[var(--tf-text)]">{wordIdx}/{queue.length || 0}</strong>
          </span>
          <span className="inline-flex items-center gap-1">
            <Timer className="w-3.5 h-3.5 text-[var(--tf-accent)]" strokeWidth={1.75} />
            <strong className="text-[var(--tf-accent)]">{(elapsedMs / 1000).toFixed(1)}s</strong>
          </span>
        </div>
      </div>

      <div
        onClick={() => phase === 'playing' && inputRef.current?.focus()}
        className="relative w-full min-h-[380px] rounded-xl bg-[var(--tf-surface)]/55 border border-[var(--tf-border)] p-8 flex flex-col items-center justify-center overflow-hidden"
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
              <GameEmblem gameId="word-sprint" className="w-12 h-12 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-[var(--tf-text)]">Word Sprint</h3>
              <p className="mt-2 text-sm text-[var(--tf-text-muted)]">
                Type each highlighted word as fast as possible. Finish under the par target for a pace bonus.
              </p>
              <div className="mt-5 inline-flex items-center gap-1 p-1 rounded-lg bg-[var(--tf-bg)] border border-[var(--tf-border)]">
                {[
                  { id: 'easy', label: 'Easy (20)' },
                  { id: 'medium', label: 'Medium (35)' },
                  { id: 'hard', label: 'Hard (50)' },
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDifficulty(d.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                      difficulty === d.id
                        ? 'bg-[var(--tf-surface)] text-[var(--tf-accent)]'
                        : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text)]'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <div className="mt-2.5 text-xs text-[var(--tf-text-muted)]">
                {SPRINT_DIFF_HINTS[difficulty]}
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
                <span>Start Sprint (Enter)</span>
              </motion.button>
            </motion.div>
          )}

          {phase === 'countdown' && (
            <motion.div
              key="countdown"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center select-none"
            >
              <div className="text-xs font-medium text-[var(--tf-text-muted)] mb-2">
                Get ready · {difficulty}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={countdownVal}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.08 }}
                  transition={{ duration: 0.2, ease: TF_EASE }}
                  className="font-typing text-6xl font-bold text-[var(--tf-accent)] tabular-nums"
                >
                  {countdownVal}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

          {phase === 'playing' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.16 }}
              className="w-full flex flex-col items-center"
            >
              {/* Sprint Track Progress Bar */}
              <div className="w-full max-w-md mb-10">
                <div className="flex justify-between text-[11px] font-typing tabular-nums text-[var(--tf-text-muted)] mb-1.5">
                  <span>Progress · Par {parSec}s</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--tf-border)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--tf-accent)] transition-all duration-150"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Active Word with subtle transition on advance */}
              <motion.div
                key={wordIdx}
                initial={{ opacity: 0.6, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12, ease: TF_EASE }}
                className="font-typing text-4xl sm:text-5xl font-semibold tracking-wide select-none"
              >
                {currentWord.split('').map((ch, idx) => {
                  const typedCh = typed[idx];
                  let cls = 'text-[var(--tf-text-dim)]';
                  if (typedCh !== undefined) {
                    cls = typedCh === ch ? 'text-[var(--tf-accent)]' : 'text-[var(--tf-error)]';
                  }
                  return (
                    <span key={idx} className={cls}>
                      {ch}
                    </span>
                  );
                })}
              </motion.div>

              <div className="mt-6 flex items-center gap-4 text-base font-typing text-[var(--tf-text-muted)] opacity-70">
                {upcomingWords.map((w, i) => (
                  <span key={`${w}-${i}`}>{w}</span>
                ))}
              </div>

              <input
                ref={inputRef}
                type="text"
                value={typed}
                onChange={(e) => handleInput(e.target.value)}
                aria-label="Word sprint input"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                className="mt-8 w-full max-w-xs px-4 py-2.5 text-center font-typing text-lg rounded-lg bg-[var(--tf-bg)] border border-[var(--tf-border)] text-[var(--tf-text)] focus:outline-none focus:border-[var(--tf-accent)]"
              />
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
              <div className="text-xs font-typing uppercase tracking-wider text-[var(--tf-text-muted)] mb-1">
                Word Sprint · {summary.difficulty}
              </div>
              <h3 className="text-xl font-semibold text-[var(--tf-text)]">Sprint Complete</h3>
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
                  <div className="text-xs text-[var(--tf-text-muted)]">WPM</div>
                  <div className="text-2xl font-bold text-[var(--tf-text)]">
                    <AnimatedNumber value={summary.wpm} duration={0.45} />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--tf-text-muted)]">Accuracy</div>
                  <div className="text-2xl font-bold text-[var(--tf-text)]">{summary.accuracy}%</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--tf-text-muted)]">Time</div>
                  <div className="text-2xl font-bold text-[var(--tf-text)]">{summary.time}s</div>
                  <div className="text-[11px] text-[var(--tf-text-muted)]">
                    {summary.beatPar ? `under ${summary.parSec}s par` : `par ${summary.parSec}s`}
                  </div>
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
                  <span>Sprint Again</span>
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
