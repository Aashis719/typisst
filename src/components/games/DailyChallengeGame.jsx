import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Play, RotateCcw, ArrowLeft, Calendar, CheckCircle2, Trophy, Timer } from 'lucide-react';
import { getDailyPassage, getTodayKey } from '../../data/challenges.js';
import { calculateWpm, calculateAccuracy } from '../../utils/typingCalculations.js';
import { playKeySound, playCompleteSound } from '../../utils/sound.js';
import { GameEmblem } from '../GameVisuals.jsx';
import { AnimatedNumber, TF_EASE } from '../../utils/motion.js';

export default function DailyChallengeGame({
  dailyRecord = null,
  soundEnabled = false,
  onSaveDaily,
  onBack,
}) {
  const dateKey = getTodayKey();
  const { text: dailyText } = getDailyPassage(dateKey);

  const [phase, setPhase] = useState('menu'); // 'menu' | 'playing' | 'finished'
  const [typed, setTyped] = useState('');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [summary, setSummary] = useState(null);

  const inputRef = useRef(null);
  const startRef = useRef(null);
  const intervalRef = useRef(null);
  const focusTimerRef = useRef(null);
  const typedRef = useRef('');
  const statsRef = useRef({ total: 0, correct: 0 });
  const phaseRef = useRef('menu');
  phaseRef.current = phase;

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (focusTimerRef.current) {
      clearTimeout(focusTimerRef.current);
      focusTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  const startDaily = useCallback(() => {
    stopTimer();
    typedRef.current = '';
    setTyped('');
    setElapsedMs(0);
    setSummary(null);
    startRef.current = null;
    statsRef.current = { total: 0, correct: 0 };
    phaseRef.current = 'playing';
    setPhase('playing');
    focusTimerRef.current = setTimeout(() => inputRef.current?.focus(), 20);
  }, [stopTimer]);

  const handleInput = (val) => {
    if (phaseRef.current !== 'playing') return;

    if (startRef.current === null && val.length > 0) {
      startRef.current = performance.now();
      intervalRef.current = setInterval(() => {
        if (startRef.current !== null) {
          setElapsedMs(performance.now() - startRef.current);
        }
      }, 60);
    }

    const prevTyped = typedRef.current;
    if (val.length > prevTyped.length) {
      const added = val.slice(prevTyped.length);
      for (let i = 0; i < added.length; i++) {
        const idx = prevTyped.length + i;
        if (idx >= dailyText.length) break;
        statsRef.current.total += 1;
        if (added[i] === dailyText[idx]) {
          statsRef.current.correct += 1;
          playKeySound(soundEnabled, false);
        } else {
          playKeySound(soundEnabled, true);
        }
      }
    }

    const clipped = val.slice(0, dailyText.length);
    typedRef.current = clipped;
    setTyped(clipped);

    if (clipped.length === dailyText.length) {
      stopTimer();
      const elapsedSec = Math.max(
        0.5,
        (performance.now() - (startRef.current || performance.now())) / 1000
      );

      let matchedChars = 0;
      for (let i = 0; i < dailyText.length; i++) {
        if (clipped[i] === dailyText[i]) matchedChars += 1;
      }

      const wpm = calculateWpm(matchedChars, elapsedSec);
      const accuracy = calculateAccuracy(statsRef.current.correct, statsRef.current.total);
      const score = Math.round(wpm * (accuracy / 100));
      const prevBest = dailyRecord?.score ?? null;
      const isNewBest = prevBest === null || score > prevBest;

      const resultObj = {
        dateKey,
        wpm,
        accuracy,
        score,
        time: elapsedSec.toFixed(1),
        prevBest,
        isNewBest,
      };

      phaseRef.current = 'finished';
      setPhase('finished');
      playCompleteSound(soundEnabled);
      setSummary(resultObj);

      if (onSaveDaily) {
        onSaveDaily(dateKey, resultObj);
      }
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (phaseRef.current === 'menu' && e.key === 'Enter') {
        e.preventDefault();
        startDaily();
      } else if (phaseRef.current === 'playing') {
        if (e.key === 'Tab') {
          e.preventDefault();
          startDaily();
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          inputRef.current?.focus({ preventScroll: true });
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [startDaily]);

  const progressPct =
    dailyText.length > 0 ? Math.round((typed.length / dailyText.length) * 100) : 0;

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
            <GameEmblem gameId="daily-challenge" className="w-5 h-5" />
            <h2 className="text-lg font-semibold text-[var(--tf-text)]">Daily Challenge</h2>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs sm:text-sm font-typing tabular-nums text-[var(--tf-text-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>{dateKey}</span>
          </span>
          {dailyRecord && phase === 'menu' && (
            <span className="inline-flex items-center gap-1 text-[var(--tf-success)]">
              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.85} />
              <span>Completed</span>
            </span>
          )}
          {phase === 'playing' && (
            <span className="inline-flex items-center gap-1 text-[var(--tf-accent)]">
              <Timer className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>{(elapsedMs / 1000).toFixed(1)}s</span>
            </span>
          )}
        </div>
      </div>

      <div
        onClick={() => phase === 'playing' && inputRef.current?.focus()}
        className="relative w-full min-h-[380px] rounded-xl bg-[var(--tf-surface)]/55 border border-[var(--tf-border)] p-6 sm:p-10 flex flex-col items-center justify-center"
      >
        <AnimatePresence mode="wait">
          {phase === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: TF_EASE }}
              className="text-center max-w-lg"
            >
              <GameEmblem gameId="daily-challenge" className="w-12 h-12 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-[var(--tf-text)]">
                Daily Edition · {dateKey}
              </h3>
              <p className="mt-2 text-sm text-[var(--tf-text-muted)]">
                One shared passage generated deterministically for {dateKey}. Replay as many times as you like to sharpen today’s best mark.
              </p>

              {dailyRecord ? (
                <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-5 px-5 py-3 rounded-lg bg-[var(--tf-bg)] border border-[var(--tf-border)] font-typing tabular-nums text-sm">
                  <span className="inline-flex items-center gap-1.5 text-[var(--tf-success)] text-xs font-sans font-semibold">
                    <CheckCircle2 className="w-4 h-4" strokeWidth={1.9} />
                    Completed today
                  </span>
                  <span className="text-[var(--tf-border)]">·</span>
                  <span>
                    Best: <strong className="text-[var(--tf-accent)]">{dailyRecord.score}</strong>
                  </span>
                  <span>
                    WPM: <strong className="text-[var(--tf-text)]">{dailyRecord.wpm}</strong>
                  </span>
                  <span>
                    Acc: <strong className="text-[var(--tf-text)]">{dailyRecord.accuracy}%</strong>
                  </span>
                </div>
              ) : (
                <div className="mt-5 text-xs text-[var(--tf-text-muted)]">
                  Not attempted yet today
                </div>
              )}

              <div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={startDaily}
                  className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--tf-accent)] text-[var(--tf-accent-fg)] text-sm font-semibold hover:opacity-90 cursor-pointer"
                >
                  <Play className="w-4 h-4" strokeWidth={2} />
                  <span>
                    {dailyRecord ? 'Replay Today’s Challenge' : 'Start Today’s Challenge'} (Enter)
                  </span>
                </motion.button>
              </div>
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
              <div className="w-full h-1.5 rounded-full bg-[var(--tf-border)] overflow-hidden mb-6">
                <div
                  className="h-full bg-[var(--tf-accent)] transition-all duration-150"
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <div className="font-typing text-xl sm:text-2xl leading-relaxed tracking-wide select-none break-words">
                {dailyText.split('').map((ch, idx) => {
                  const typedCh = typed[idx];
                  const isCurrent = idx === typed.length;
                  let cls = 'text-[var(--tf-text-dim)]';
                  if (typedCh !== undefined) {
                    cls =
                      typedCh === ch
                        ? 'text-[var(--tf-text)]'
                        : 'text-[var(--tf-error)] underline decoration-[var(--tf-error)]/70 underline-offset-4';
                  } else if (isCurrent) {
                    cls = 'bg-[var(--tf-accent)] text-[var(--tf-accent-fg)] rounded-xs';
                  }
                  return (
                    <span key={idx} className={cls}>
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
                aria-label="Daily challenge input"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                className="sr-only"
              />

              <div className="mt-6 flex items-center justify-between text-xs text-[var(--tf-text-muted)] font-typing">
                <span>
                  Progress: {typed.length}/{dailyText.length} chars ({progressPct}%)
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
              <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--tf-success)] mb-2">
                <CheckCircle2 className="w-4 h-4" strokeWidth={1.9} />
                <span>Daily Challenge · {dateKey}</span>
              </div>
              <h3 className="text-xl font-semibold text-[var(--tf-text)]">Daily Run Summary</h3>
              {summary.isNewBest ? (
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--tf-accent)]">
                  <Trophy className="w-4 h-4" strokeWidth={1.9} />
                  <span>
                    New Best for {dateKey}!
                    {summary.prevBest !== null ? ` (+${summary.score - summary.prevBest} pts)` : ''}
                  </span>
                </div>
              ) : summary.prevBest !== null ? (
                <div className="mt-2 text-xs font-typing tabular-nums text-[var(--tf-text-muted)]">
                  Today’s Saved Best: {summary.prevBest} pts
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
                </div>
              </div>

              <div className="mt-7 flex items-center justify-center gap-3">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={startDaily}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--tf-accent)] text-[var(--tf-accent-fg)] text-sm font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" strokeWidth={1.85} />
                  <span>Beat Today’s Score</span>
                </motion.button>
                <button
                  type="button"
                  onClick={onBack}
                  className="px-4 py-2.5 rounded-lg bg-[var(--tf-bg)] border border-[var(--tf-border)] text-sm font-medium text-[var(--tf-text)] cursor-pointer hover:bg-[var(--tf-surface)] transition-colors"
                >
                  All Games
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
