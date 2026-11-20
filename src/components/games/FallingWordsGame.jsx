import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Play, Pause, RotateCcw, ArrowLeft, Heart, Trophy, Zap, Layers, Crosshair } from 'lucide-react';
import { pickFallingWord } from '../../utils/gameLogic.js';
import { playKeySound, playCompleteSound } from '../../utils/sound.js';
import { GameEmblem } from '../GameVisuals.jsx';
import { AnimatedNumber, TF_EASE } from '../../utils/motion.js';

const DIFF_CONFIG = {
  easy: {
    lives: 5,
    baseSpeed: 34,
    spawnMs: 2250,
    maxActive: 4,
    hint: '5 lives · Gentle fall · Short familiar words',
  },
  medium: {
    lives: 4,
    baseSpeed: 52,
    spawnMs: 1700,
    maxActive: 5,
    hint: '4 lives · Balanced fall · Varied vocabulary',
  },
  hard: {
    lives: 3,
    baseSpeed: 74,
    spawnMs: 1250,
    maxActive: 6,
    hint: '3 lives · Fast fall · Long & hyphenated words',
  },
};

const SPAWN_LANES = [8, 25, 42, 58, 74];

export default function FallingWordsGame({
  bestScores = {},
  soundEnabled = false,
  onSaveRecord,
  onBack,
}) {
  const [difficulty, setDifficulty] = useState('medium');
  const [phase, setPhase] = useState('menu'); // 'menu' | 'playing' | 'paused' | 'gameover'
  const [fallingWords, setFallingWords] = useState([]);
  const [lockedId, setLockedId] = useState(null);
  const [typedBuffer, setTypedBuffer] = useState('');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(DIFF_CONFIG.medium.lives);
  const [cleared, setCleared] = useState(0);
  const [combo, setCombo] = useState(0);
  const [accuracyStats, setAccuracyStats] = useState({ hits: 0, total: 0 });
  const [scorePopups, setScorePopups] = useState([]);
  const [floorFlash, setFloorFlash] = useState(false);
  const [endSummary, setEndSummary] = useState(null);

  const arenaRef = useRef(null);
  const inputRef = useRef(null);
  const wordsRef = useRef([]);
  const lockedIdRef = useRef(null);
  const typedRef = useRef('');
  const scoreRef = useRef(0);
  const livesRef = useRef(DIFF_CONFIG.medium.lives);
  const clearedRef = useRef(0);
  const comboRef = useRef(0);
  const accuracyRef = useRef({ hits: 0, total: 0 });
  const phaseRef = useRef('menu');
  const lastFrameRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const nextWordIdRef = useRef(1);
  const popupIdRef = useRef(1);
  const rafRef = useRef(null);
  const timersRef = useRef([]);

  phaseRef.current = phase;
  const maxLives = DIFF_CONFIG[difficulty].lives;
  const currentLevel = 1 + Math.floor(cleared / 8);

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

  useEffect(() => {
    return () => {
      clearAllTimers();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [clearAllTimers]);

  const addPopup = useCallback(
    (xPct, y, text) => {
      const id = popupIdRef.current++;
      setScorePopups((prev) => [...prev.slice(-4), { id, xPct, y, text }]);
      scheduleTimer(() => {
        setScorePopups((prev) => prev.filter((p) => p.id !== id));
      }, 600);
    },
    [scheduleTimer]
  );

  const endGame = useCallback(() => {
    phaseRef.current = 'gameover';
    setPhase('gameover');
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    playCompleteSound(soundEnabled);

    const prevBest = bestScores[difficulty] || 0;
    const finalScore = scoreRef.current;
    const acc =
      accuracyRef.current.total > 0
        ? Math.round((accuracyRef.current.hits / accuracyRef.current.total) * 100)
        : 100;

    setEndSummary({
      score: finalScore,
      cleared: clearedRef.current,
      level: 1 + Math.floor(clearedRef.current / 8),
      accuracy: acc,
      difficulty,
      prevBest,
      isNewBest: finalScore > prevBest,
    });

    if (onSaveRecord) {
      onSaveRecord('falling-words', difficulty, finalScore);
    }
  }, [bestScores, difficulty, onSaveRecord, soundEnabled]);

  const startGame = useCallback(() => {
    clearAllTimers();
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const cfg = DIFF_CONFIG[difficulty];
    wordsRef.current = [];
    lockedIdRef.current = null;
    typedRef.current = '';
    scoreRef.current = 0;
    livesRef.current = cfg.lives;
    clearedRef.current = 0;
    comboRef.current = 0;
    accuracyRef.current = { hits: 0, total: 0 };

    setFallingWords([]);
    setLockedId(null);
    setTypedBuffer('');
    setScore(0);
    setLives(cfg.lives);
    setCleared(0);
    setCombo(0);
    setScorePopups([]);
    setFloorFlash(false);
    setAccuracyStats({ hits: 0, total: 0 });
    setEndSummary(null);

    lastFrameRef.current = performance.now();
    lastSpawnRef.current = 0;
    phaseRef.current = 'playing';
    setPhase('playing');

    scheduleTimer(() => inputRef.current?.focus(), 20);
  }, [clearAllTimers, difficulty, scheduleTimer]);

  const spawnWord = useCallback(() => {
    const cfg = DIFF_CONFIG[difficulty];
    if (wordsRef.current.length >= cfg.maxActive) return;

    const level = 1 + Math.floor(clearedRef.current / 8);
    const activeTexts = wordsRef.current.map((w) => w.text);
    const text = pickFallingWord(difficulty, level, activeTexts);

    // Pick a lane clear of words near the top so words don't overlap
    const occupiedNearTop = new Set(
      wordsRef.current
        .filter((w) => w.y < 88)
        .map((w) => w.lane)
    );
    const clearLanes = SPAWN_LANES.filter((lane) => !occupiedNearTop.has(lane));
    const lanePool = clearLanes.length > 0 ? clearLanes : SPAWN_LANES;
    const lane = lanePool[Math.floor(Math.random() * lanePool.length)];
    const jitter = (Math.random() - 0.5) * 3;
    const xPct = Math.max(5, Math.min(76, lane + jitter));

    const speed = cfg.baseSpeed + (level - 1) * 8 + Math.random() * 10;

    const item = {
      id: nextWordIdRef.current++,
      text,
      lane,
      xPct,
      y: -14,
      speed,
    };
    wordsRef.current = [...wordsRef.current, item];
    setFallingWords(wordsRef.current);
  }, [difficulty]);

  useEffect(() => {
    if (phase !== 'playing') return;

    const tick = (now) => {
      if (phaseRef.current !== 'playing') return;
      const dt = Math.min(0.1, (now - lastFrameRef.current) / 1000);
      lastFrameRef.current = now;

      const arenaHeight = arenaRef.current?.clientHeight || 420;
      const cfg = DIFF_CONFIG[difficulty];
      const level = 1 + Math.floor(clearedRef.current / 8);
      const spawnInterval = Math.max(680, cfg.spawnMs - (level - 1) * 105);

      if (now - lastSpawnRef.current >= spawnInterval || wordsRef.current.length === 0) {
        lastSpawnRef.current = now;
        spawnWord();
      }

      let missedCount = 0;
      const surviving = [];

      for (const w of wordsRef.current) {
        const nextY = w.y + w.speed * dt;
        if (nextY >= arenaHeight - 36) {
          missedCount += 1;
          if (lockedIdRef.current === w.id) {
            lockedIdRef.current = null;
            typedRef.current = '';
            setLockedId(null);
            setTypedBuffer('');
          }
        } else {
          surviving.push({ ...w, y: nextY });
        }
      }

      if (missedCount > 0) {
        livesRef.current = Math.max(0, livesRef.current - missedCount);
        comboRef.current = 0;
        setLives(livesRef.current);
        setCombo(0);
        setFloorFlash(true);
        scheduleTimer(() => setFloorFlash(false), 260);
        playKeySound(soundEnabled, true);

        if (livesRef.current <= 0) {
          wordsRef.current = [];
          setFallingWords([]);
          endGame();
          return;
        }
      }

      wordsRef.current = surviving;
      setFallingWords(surviving);
      rafRef.current = requestAnimationFrame(tick);
    };

    lastFrameRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [difficulty, endGame, phase, scheduleTimer, soundEnabled, spawnWord]);

  const handleTypingChar = useCallback(
    (ch) => {
      if (phaseRef.current !== 'playing') return;
      const lowerChar = ch.toLowerCase();
      if (!/[a-z0-9'-]/.test(lowerChar)) return;

      const activeWords = wordsRef.current;
      let target = activeWords.find((w) => w.id === lockedIdRef.current);

      if (!target) {
        const candidates = activeWords
          .filter((w) => w.text.toLowerCase().startsWith(lowerChar))
          .sort((a, b) => b.y - a.y);

        if (candidates.length === 0) {
          comboRef.current = 0;
          setCombo(0);
          accuracyRef.current = {
            hits: accuracyRef.current.hits,
            total: accuracyRef.current.total + 1,
          };
          setAccuracyStats(accuracyRef.current);
          playKeySound(soundEnabled, true);
          return;
        }

        target = candidates[0];
        lockedIdRef.current = target.id;
        setLockedId(target.id);
        typedRef.current = lowerChar;
        setTypedBuffer(lowerChar);
        accuracyRef.current = {
          hits: accuracyRef.current.hits + 1,
          total: accuracyRef.current.total + 1,
        };
        setAccuracyStats(accuracyRef.current);
        playKeySound(soundEnabled, false);
      } else {
        const nextExpected = target.text[typedRef.current.length]?.toLowerCase();
        if (lowerChar === nextExpected) {
          const nextTyped = typedRef.current + lowerChar;
          typedRef.current = nextTyped;
          setTypedBuffer(nextTyped);
          accuracyRef.current = {
            hits: accuracyRef.current.hits + 1,
            total: accuracyRef.current.total + 1,
          };
          setAccuracyStats(accuracyRef.current);
          playKeySound(soundEnabled, false);
        } else {
          comboRef.current = 0;
          setCombo(0);
          accuracyRef.current = {
            hits: accuracyRef.current.hits,
            total: accuracyRef.current.total + 1,
          };
          setAccuracyStats(accuracyRef.current);
          playKeySound(soundEnabled, true);
          return;
        }
      }

      if (target && typedRef.current.length === target.text.length) {
        const nextCombo = comboRef.current + 1;
        comboRef.current = nextCombo;
        const points = target.text.length * 10 + Math.min(50, nextCombo * 3);
        scoreRef.current += points;
        clearedRef.current += 1;

        addPopup(target.xPct, target.y, `+${points}`);

        wordsRef.current = wordsRef.current.filter((w) => w.id !== target.id);
        lockedIdRef.current = null;
        typedRef.current = '';

        setFallingWords(wordsRef.current);
        setLockedId(null);
        setTypedBuffer('');
        setScore(scoreRef.current);
        setCleared(clearedRef.current);
        setCombo(nextCombo);
      }
    },
    [addPopup, soundEnabled]
  );

  useEffect(() => {
    const onKeyDown = (e) => {
      if (phaseRef.current === 'menu' && e.key === 'Enter') {
        e.preventDefault();
        startGame();
        return;
      }
      if (phaseRef.current === 'playing') {
        if (e.key === 'Escape') {
          e.preventDefault();
          setPhase('paused');
          return;
        }
        if (e.key === 'Backspace') {
          e.preventDefault();
          lockedIdRef.current = null;
          typedRef.current = '';
          setLockedId(null);
          setTypedBuffer('');
          return;
        }
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          inputRef.current?.focus({ preventScroll: true });
        }
      } else if (phaseRef.current === 'paused' && e.key === 'Escape') {
        e.preventDefault();
        lastFrameRef.current = performance.now();
        setPhase('playing');
        scheduleTimer(() => inputRef.current?.focus(), 20);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [scheduleTimer, startGame]);

  const accPct =
    accuracyStats.total > 0
      ? Math.round((accuracyStats.hits / accuracyStats.total) * 100)
      : 100;

  return (
    <div className="w-full max-w-[960px] mx-auto">
      {/* Polished HUD Header */}
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
            <GameEmblem gameId="falling-words" className="w-5 h-5" />
            <h2 className="text-lg font-semibold text-[var(--tf-text)]">Falling Words</h2>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs sm:text-sm font-typing tabular-nums">
          <span className="inline-flex items-center gap-1.5 text-[var(--tf-text-muted)]" title="Current level">
            <Layers className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>Lv.{currentLevel}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-[var(--tf-text-muted)]" title="Combo">
            <Zap className="w-3.5 h-3.5 text-[var(--tf-accent)]" strokeWidth={1.75} />
            <span>{combo}x</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-[var(--tf-text-muted)]" title="Live accuracy">
            <span>{accPct}%</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-[var(--tf-text)]" title="Score">
            <Trophy className="w-3.5 h-3.5 text-[var(--tf-accent)]" strokeWidth={1.75} />
            <strong className="text-[var(--tf-accent)]">{score}</strong>
          </span>
          <div className="flex items-center gap-1" title={`${lives} lives remaining`}>
            {Array.from({ length: maxLives }).map((_, i) => {
              const active = i < lives;
              return (
                <motion.div
                  key={i}
                  animate={{
                    scale: active ? 1 : 0.85,
                    opacity: active ? 1 : 0.35,
                  }}
                  transition={{ duration: 0.16, ease: TF_EASE }}
                >
                  <Heart
                    className={`w-3.5 h-3.5 transition-colors duration-150 ${
                      active
                        ? 'text-[var(--tf-error)] fill-[var(--tf-error)]/80'
                        : 'text-[var(--tf-border)]'
                    }`}
                    strokeWidth={1.75}
                  />
                </motion.div>
              );
            })}
          </div>
          {phase === 'playing' && (
            <button
              type="button"
              onClick={() => setPhase('paused')}
              title="Pause (Esc)"
              aria-label="Pause game"
              className="p-1.5 rounded-md bg-[var(--tf-surface)] border border-[var(--tf-border)]/60 text-[var(--tf-text-muted)] hover:text-[var(--tf-text)] cursor-pointer transition-colors"
            >
              <Pause className="w-4 h-4" strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>

      {/* Arena */}
      <div
        ref={arenaRef}
        onClick={() => phase === 'playing' && inputRef.current?.focus()}
        className="relative w-full h-[430px] sm:h-[470px] rounded-xl bg-[var(--tf-surface)]/55 border border-[var(--tf-border)] overflow-hidden select-none"
      >
        {/* Custom SVG Vertical Lanes & Horizon Grid */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-35"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {[16, 33, 50, 67, 84].map((x) => (
            <line
              key={x}
              x1={`${x}%`}
              y1="0%"
              x2={`${x}%`}
              y2="92%"
              stroke="var(--tf-border)"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
          ))}
          <line
            x1="0%"
            y1="92%"
            x2="100%"
            y2="92%"
            stroke={floorFlash ? 'var(--tf-error)' : 'var(--tf-border)'}
            strokeWidth="1.5"
          />
        </svg>

        <input
          ref={inputRef}
          type="text"
          aria-label="Falling words typing input"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          onChange={(e) => {
            const val = e.target.value;
            e.target.value = '';
            for (const ch of val) handleTypingChar(ch);
          }}
          className="absolute opacity-0 w-px h-px pointer-events-none"
        />

        {/* Falling Word Chips */}
        {fallingWords.map((w) => {
          const isLocked = w.id === lockedId;
          const matchedLen = isLocked ? typedBuffer.length : 0;
          return (
            <div
              key={w.id}
              className={`absolute flex items-center gap-1.5 px-3 py-1 rounded-md font-typing text-base sm:text-lg tracking-wide border transition-colors ${
                isLocked
                  ? 'bg-[var(--tf-bg)] border-[var(--tf-accent)] shadow-sm z-10'
                  : 'bg-[var(--tf-bg)]/90 border-[var(--tf-border)]/80'
              }`}
              style={{
                left: `${w.xPct}%`,
                top: 0,
                transform: `translate3d(0, ${w.y}px, 0)`,
              }}
            >
              {isLocked && (
                <Crosshair className="w-3.5 h-3.5 text-[var(--tf-accent)] shrink-0" strokeWidth={2} />
              )}
              <span>
                <span className="text-[var(--tf-accent)] font-semibold">
                  {w.text.slice(0, matchedLen)}
                </span>
                <span className="text-[var(--tf-text)]">{w.text.slice(matchedLen)}</span>
              </span>
            </div>
          );
        })}

        {/* Floating Score Popups */}
        <AnimatePresence>
          {scorePopups.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0.95, y: p.y }}
              animate={{ opacity: 0, y: p.y - 24 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: TF_EASE }}
              className="absolute pointer-events-none font-typing text-xs font-semibold text-[var(--tf-accent)] z-20"
              style={{ left: `${p.xPct}%` }}
            >
              {p.text}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Danger Floor Line with flash feedback */}
        <div
          className={`absolute bottom-0 inset-x-0 h-1.5 transition-colors duration-200 ${
            floorFlash ? 'bg-[var(--tf-error)]' : 'bg-[var(--tf-error)]/35'
          }`}
        />

        {/* Menu Overlay */}
        <AnimatePresence>
          {phase === 'menu' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[var(--tf-bg)]/92 z-30"
            >
              <GameEmblem gameId="falling-words" className="w-12 h-12 mb-3" />
              <h3 className="text-xl font-semibold text-[var(--tf-text)]">Falling Words</h3>
              <p className="mt-2 max-w-md text-sm text-[var(--tf-text-muted)]">
                Type falling words before they cross the floor line. Speed, spawn rate, and vocabulary scale with your level.
              </p>

              <div className="mt-5 flex items-center gap-1 p-1 rounded-lg bg-[var(--tf-surface)] border border-[var(--tf-border)]">
                {['easy', 'medium', 'hard'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-medium capitalize cursor-pointer transition-colors ${
                      difficulty === d
                        ? 'bg-[var(--tf-bg)] text-[var(--tf-accent)]'
                        : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text)]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>

              <div className="mt-2.5 text-xs text-[var(--tf-text-muted)]">
                {DIFF_CONFIG[difficulty].hint}
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
                <span>Start Game (Enter)</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pause Overlay */}
        <AnimatePresence>
          {phase === 'paused' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[var(--tf-bg)]/88 z-30"
            >
              <h3 className="text-lg font-semibold text-[var(--tf-text)]">Game Paused</h3>
              <div className="mt-5 flex items-center gap-3">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    lastFrameRef.current = performance.now();
                    setPhase('playing');
                    scheduleTimer(() => inputRef.current?.focus(), 20);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--tf-accent)] text-[var(--tf-accent-fg)] text-sm font-semibold cursor-pointer"
                >
                  <Play className="w-4 h-4" strokeWidth={2} />
                  <span>Resume</span>
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={startGame}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--tf-surface)] border border-[var(--tf-border)] text-sm font-medium text-[var(--tf-text)] cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" strokeWidth={1.75} />
                  <span>Restart</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Over Overlay */}
        <AnimatePresence>
          {phase === 'gameover' && endSummary && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: TF_EASE }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[var(--tf-bg)]/94 z-30"
            >
              <div className="text-xs font-typing uppercase tracking-wider text-[var(--tf-text-muted)] mb-1">
                Falling Words · {endSummary.difficulty}
              </div>
              <h3 className="text-xl font-semibold text-[var(--tf-text)]">Game Over</h3>
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

              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center font-typing tabular-nums">
                <div>
                  <div className="text-xs text-[var(--tf-text-muted)]">Score</div>
                  <div className="text-2xl font-bold text-[var(--tf-accent)]">
                    <AnimatedNumber value={endSummary.score} duration={0.45} />
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--tf-text-muted)]">Cleared</div>
                  <div className="text-2xl font-bold text-[var(--tf-text)]">{endSummary.cleared}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--tf-text-muted)]">Level</div>
                  <div className="text-2xl font-bold text-[var(--tf-text)]">Lv.{endSummary.level}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--tf-text-muted)]">Accuracy</div>
                  <div className="text-2xl font-bold text-[var(--tf-text)]">{endSummary.accuracy}%</div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={startGame}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--tf-accent)] text-[var(--tf-accent-fg)] text-sm font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" strokeWidth={1.85} />
                  <span>Play Again</span>
                </motion.button>
                <button
                  type="button"
                  onClick={() => setPhase('menu')}
                  className="px-4 py-2.5 rounded-lg bg-[var(--tf-surface)] border border-[var(--tf-border)] text-sm font-medium text-[var(--tf-text)] cursor-pointer hover:bg-[var(--tf-surface-hover)] transition-colors"
                >
                  Change Difficulty
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {phase === 'playing' && (
        <div className="mt-3 flex items-center justify-between text-xs text-[var(--tf-text-muted)] font-typing">
          <span>Active target: {typedBuffer || 'none'}</span>
          <span>Backspace unlocks target · Esc pauses</span>
        </div>
      )}
    </div>
  );
}
