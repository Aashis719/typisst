import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Play, RotateCcw, ArrowLeft, Shield, Flame, Trophy } from 'lucide-react';
import { pickSurvivalWord } from '../../utils/gameLogic.js';
import { playKeySound, playCompleteSound } from '../../utils/sound.js';
import { GameEmblem } from '../GameVisuals.jsx';
import { AnimatedNumber, TF_EASE } from '../../utils/motion.js';

// Strict rule: every Survival Mode session always begins with exactly 3 lives.
const SURVIVAL_MAX_LIVES = 3;

const DIFF_META = {
  easy: { label: 'Easy', hint: 'Starts Tier 1 · Escalates every 6 words · 3 lives' },
  medium: { label: 'Medium', hint: 'Starts Tier 1 · Escalates every 4 words · 3 lives' },
  hard: { label: 'Hard', hint: 'Starts Tier 2 · Escalates every 3 words · 3 lives' },
};

export default function SurvivalModeGame({
  bestScores = {},
  soundEnabled = false,
  onSaveRecord,
  onBack,
}) {
  const [difficulty, setDifficulty] = useState('medium');
  const [phase, setPhase] = useState('menu'); // 'menu' | 'playing' | 'gameover'
  const [current, setCurrent] = useState({ word: '', tier: 1, round: 1 });
  const [typed, setTyped] = useState('');
  const [lives, setLives] = useState(SURVIVAL_MAX_LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxTier, setMaxTier] = useState(1);
  const [highestRound, setHighestRound] = useState(1);
  const [shake, setShake] = useState(false);
  const [lostLifePulse, setLostLifePulse] = useState(false);
  const [scoreDelta, setScoreDelta] = useState(null);
  const [tierNotice, setTierNotice] = useState(null);
  const [endSummary, setEndSummary] = useState(null);

  const inputRef = useRef(null);
  const phaseRef = useRef('menu');
  const livesRef = useRef(SURVIVAL_MAX_LIVES);
  const scoreRef = useRef(0);
  const streakRef = useRef(0);
  const maxTierRef = useRef(1);
  const highestRoundRef = useRef(1);
  const currentRef = useRef({ word: '', tier: 1, round: 1 });
  const typedRef = useRef('');
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
    const first = pickSurvivalWord(0, difficulty);

    livesRef.current = SURVIVAL_MAX_LIVES;
    scoreRef.current = 0;
    streakRef.current = 0;
    maxTierRef.current = first.tier;
    highestRoundRef.current = 1;
    currentRef.current = first;
    typedRef.current = '';

    setCurrent(first);
    setTyped('');
    setLives(SURVIVAL_MAX_LIVES);
    setScore(0);
    setStreak(0);
    setMaxTier(first.tier);
    setHighestRound(1);
    setShake(false);
    setLostLifePulse(false);
    setScoreDelta(null);
    setTierNotice(null);
    setEndSummary(null);

    phaseRef.current = 'playing';
    setPhase('playing');
    scheduleTimer(() => inputRef.current?.focus(), 20);
  }, [clearAllTimers, difficulty, scheduleTimer]);

  const finishGame = useCallback(
    (finalScore) => {
      clearAllTimers();
      phaseRef.current = 'gameover';
      setPhase('gameover');
      playCompleteSound(soundEnabled);

      const prevBest = bestScores[difficulty] || 0;
      const isNewBest = finalScore > prevBest;

      setEndSummary({
        score: finalScore,
        streak: streakRef.current,
        highestRound: highestRoundRef.current,
        maxTier: maxTierRef.current,
        difficulty,
        prevBest,
        isNewBest,
      });

      if (onSaveRecord) {
        onSaveRecord('survival-mode', difficulty, finalScore);
      }
    },
    [bestScores, clearAllTimers, difficulty, onSaveRecord, soundEnabled]
  );

  const handleInput = (val) => {
    if (phaseRef.current !== 'playing') return;

    const prevTyped = typedRef.current;
    if (val.length < prevTyped.length) {
      typedRef.current = val;
      setTyped(val);
      return;
    }

    const added = val.slice(prevTyped.length);
    let nextTyped = prevTyped;
    const activeWord = currentRef.current;

    for (const ch of added) {
      if (phaseRef.current !== 'playing') return;
      const expected = activeWord.word[nextTyped.length];
      if (expected !== undefined && ch === expected) {
        nextTyped += ch;
        playKeySound(soundEnabled, false);
      } else {
        playKeySound(soundEnabled, true);
        setShake(true);
        setLostLifePulse(true);
        scheduleTimer(() => setShake(false), 240);
        scheduleTimer(() => setLostLifePulse(false), 380);

        const nextLives = Math.max(0, livesRef.current - 1);
        livesRef.current = nextLives;
        setLives(nextLives);

        if (nextLives <= 0) {
          typedRef.current = nextTyped;
          setTyped(nextTyped);
          finishGame(scoreRef.current);
          return;
        }
      }
    }

    typedRef.current = nextTyped;
    setTyped(nextTyped);

    if (nextTyped === activeWord.word) {
      const nextStreak = streakRef.current + 1;
      const points = activeWord.tier * 50 + Math.min(100, nextStreak * 5);
      const nextScore = scoreRef.current + points;
      const nextWord = pickSurvivalWord(nextStreak, difficulty, activeWord.word);

      streakRef.current = nextStreak;
      scoreRef.current = nextScore;
      highestRoundRef.current = nextWord.round;
      if (nextWord.tier > maxTierRef.current) {
        maxTierRef.current = nextWord.tier;
        setTierNotice(`Tier ${nextWord.tier} unlocked`);
        scheduleTimer(() => setTierNotice(null), 1500);
      }
      currentRef.current = nextWord;
      typedRef.current = '';

      setStreak(nextStreak);
      setScore(nextScore);
      setHighestRound(nextWord.round);
      setMaxTier(maxTierRef.current);
      setCurrent(nextWord);
      setTyped('');
      setScoreDelta({ id: nextStreak, value: points });
      scheduleTimer(() => {
        setScoreDelta((prev) => (prev && prev.id === nextStreak ? null : prev));
      }, 650);
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
            <GameEmblem gameId="survival-mode" className="w-5 h-5" />
            <h2 className="text-lg font-semibold text-[var(--tf-text)]">Survival Mode</h2>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-5 text-xs sm:text-sm font-typing tabular-nums">
          <span className="text-[var(--tf-text-muted)]">
            Round <strong className="text-[var(--tf-text)]">{current.round}</strong>
          </span>
          <span className="text-[var(--tf-text-muted)]">
            Tier <strong className="text-[var(--tf-text)]">{current.tier}/5</strong>
          </span>
          <span className="inline-flex items-center gap-1 text-[var(--tf-text-muted)]">
            <Flame className="w-3.5 h-3.5 text-[var(--tf-accent)]" strokeWidth={1.75} />
            <span>{streak}</span>
          </span>
          <span className="relative inline-flex items-center gap-1 text-[var(--tf-text)]">
            <Trophy className="w-3.5 h-3.5 text-[var(--tf-accent)]" strokeWidth={1.75} />
            <strong className="text-[var(--tf-accent)]">{score}</strong>
            <AnimatePresence>
              {scoreDelta && (
                <motion.span
                  key={scoreDelta.id}
                  initial={{ opacity: 0.95, y: 2 }}
                  animate={{ opacity: 0, y: -12 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.45, ease: TF_EASE }}
                  className="absolute -top-4 left-4 text-[11px] font-semibold text-[var(--tf-accent)] pointer-events-none"
                >
                  +{scoreDelta.value}
                </motion.span>
              )}
            </AnimatePresence>
          </span>
          <div
            className="flex items-center gap-1.5"
            title={`${lives} of ${SURVIVAL_MAX_LIVES} lives remaining`}
          >
            {Array.from({ length: SURVIVAL_MAX_LIVES }).map((_, i) => {
              const active = i < lives;
              return (
                <motion.div
                  key={i}
                  animate={{
                    scale: active ? 1 : 0.86,
                    opacity: active ? 1 : 0.35,
                  }}
                  transition={{ duration: 0.18, ease: TF_EASE }}
                >
                  <Shield
                    className={`w-4 h-4 transition-colors duration-200 ${
                      active
                        ? 'text-[var(--tf-accent)] fill-[var(--tf-accent)]/25'
                        : 'text-[var(--tf-error)]/70'
                    }`}
                    strokeWidth={1.85}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        onClick={() => phase === 'playing' && inputRef.current?.focus()}
        className={`relative w-full min-h-[380px] rounded-xl bg-[var(--tf-surface)]/55 border p-8 flex flex-col items-center justify-center transition-colors duration-150 ${
          lostLifePulse || shake ? 'border-[var(--tf-error)]' : 'border-[var(--tf-border)]'
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
              <GameEmblem gameId="survival-mode" className="w-12 h-12 mx-auto mb-3" />
              <h3 className="text-xl font-semibold text-[var(--tf-text)]">Survival Mode</h3>
              <p className="mt-2 text-sm text-[var(--tf-text-muted)]">
                Every run begins with <strong className="text-[var(--tf-text)]">3 lives</strong>. Each typo costs one shield; lose all three and the run ends immediately.
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
                    {DIFF_META[d].label}
                  </button>
                ))}
              </div>
              <div className="mt-2.5 text-xs text-[var(--tf-text-muted)]">
                {DIFF_META[difficulty].hint}
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
                <span>Enter Survival (Enter)</span>
              </motion.button>
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
              {/* Tier Progression Bar */}
              <div className="flex items-center gap-1.5 mb-5">
                {[1, 2, 3, 4, 5].map((t) => (
                  <span
                    key={t}
                    className={`h-1.5 w-8 rounded-full transition-colors duration-200 ${
                      t <= current.tier ? 'bg-[var(--tf-accent)]' : 'bg-[var(--tf-border)]'
                    }`}
                  />
                ))}
              </div>

              <div className="h-5 mb-2 flex items-center justify-center">
                <AnimatePresence>
                  {tierNotice ? (
                    <motion.span
                      key="tier"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.16 }}
                      className="text-xs font-typing font-semibold text-[var(--tf-accent)]"
                    >
                      {tierNotice}
                    </motion.span>
                  ) : lostLifePulse ? (
                    <motion.span
                      key="life"
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-xs font-typing font-medium text-[var(--tf-error)]"
                    >
                      Shield lost · {lives} {lives === 1 ? 'life' : 'lives'} remaining
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </div>

              <motion.div
                key={`${current.word}-${streak}`}
                initial={{ opacity: 0.65, y: 4 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  x: shake ? [-4, 4, -2, 2, 0] : 0,
                }}
                transition={{ duration: 0.15, ease: TF_EASE }}
                className="font-typing text-3xl sm:text-5xl font-semibold tracking-wide select-none"
              >
                {current.word.split('').map((ch, idx) => (
                  <span
                    key={idx}
                    className={
                      idx < typed.length
                        ? 'text-[var(--tf-accent)]'
                        : 'text-[var(--tf-text-dim)]'
                    }
                  >
                    {ch}
                  </span>
                ))}
              </motion.div>

              <input
                ref={inputRef}
                type="text"
                value={typed}
                onChange={(e) => handleInput(e.target.value)}
                aria-label="Survival mode input"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
                className="mt-8 w-full max-w-xs px-4 py-2.5 text-center font-typing text-lg rounded-lg bg-[var(--tf-bg)] border border-[var(--tf-border)] text-[var(--tf-text)] focus:outline-none focus:border-[var(--tf-accent)]"
              />

              <div className="mt-5 text-xs font-typing text-[var(--tf-text-muted)]">
                Difficulty: <span className="capitalize text-[var(--tf-text)]">{difficulty}</span> · Tab to restart
              </div>
            </motion.div>
          )}

          {phase === 'gameover' && endSummary && (
            <motion.div
              key="gameover"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: TF_EASE }}
              className="text-center"
            >
              <div className="text-xs font-typing uppercase tracking-wider text-[var(--tf-text-muted)] mb-1">
                Survival · {endSummary.difficulty}
              </div>
              <h3 className="text-xl font-semibold text-[var(--tf-text)]">Run Ended</h3>
              {endSummary.isNewBest ? (
                <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--tf-accent)]">
                  <Trophy className="w-4 h-4" strokeWidth={1.9} />
                  <span>
                    New Personal Best!
                    {endSummary.prevBest > 0 ? ` (+${endSummary.score - endSummary.prevBest} pts)` : ''}
                  </span>
                </div>
              ) : endSummary.prevBest > 0 ? (
                <div className="mt-2 text-xs font-typing tabular-nums text-[var(--tf-text-muted)]">
                  Personal Best ({endSummary.difficulty}): {endSummary.prevBest} pts
                </div>
              ) : null}

              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-6 font-typing tabular-nums">
                <div>
                  <div className="text-xs text-[var(--tf-text-muted)]">Score</div>
                  <div className="text-2xl font-bold text-[var(--tf-accent)]">
                    <AnimatedNumber value={endSummary.score} duration={0.45} />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--tf-text-muted)]">Highest Round</div>
                  <div className="text-2xl font-bold text-[var(--tf-text)]">{endSummary.highestRound}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--tf-text-muted)]">Words Cleared</div>
                  <div className="text-2xl font-bold text-[var(--tf-text)]">{endSummary.streak}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--tf-text-muted)]">Max Tier</div>
                  <div className="text-2xl font-bold text-[var(--tf-text)]">{endSummary.maxTier}/5</div>
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
                  <span>Survive Again</span>
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
