import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Trophy, CheckCircle2, Loader2 } from 'lucide-react';
import {
  FallingWordsPreviewSvg,
  WordSprintPreviewSvg,
  SurvivalPreviewSvg,
  AccuracyPreviewSvg,
  DailyChallengePreviewSvg,
} from './GameVisuals.jsx';
import { TF_EASE } from '../utils/motion.js';

function renderPreviewSvg(gameId, isHovered, isCompletedToday) {
  switch (gameId) {
    case 'falling-words':
      return <FallingWordsPreviewSvg isHovered={isHovered} />;
    case 'word-sprint':
      return <WordSprintPreviewSvg isHovered={isHovered} />;
    case 'survival-mode':
      return <SurvivalPreviewSvg isHovered={isHovered} />;
    case 'accuracy-challenge':
      return <AccuracyPreviewSvg isHovered={isHovered} />;
    case 'daily-challenge':
    default:
      return (
        <DailyChallengePreviewSvg
          isHovered={isHovered}
          isCompletedToday={isCompletedToday}
        />
      );
  }
}

export function FeaturedGamePanel({
  game,
  bestRecord,
  isLaunching = false,
  onPlay,
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative rounded-xl border transition-colors duration-200 overflow-hidden ${
        isHovered
          ? 'bg-[var(--tf-surface)] border-[var(--tf-accent)]/60'
          : 'bg-[var(--tf-surface)]/60 border-[var(--tf-border)]/75'
      }`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Left Editorial Info + Single Accessible Play Action */}
        <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[var(--tf-text-muted)]">
              <span className="font-medium text-[var(--tf-accent)]">Featured Mode</span>
              <span aria-hidden="true">·</span>
              <span>Reaction &amp; Velocity</span>
            </div>

            <motion.h2
              animate={{ x: isHovered ? 2 : 0 }}
              transition={{ duration: 0.18, ease: TF_EASE }}
              className={`mt-2.5 text-2xl sm:text-[1.7rem] font-bold tracking-tight transition-colors duration-200 ${
                isHovered ? 'text-[var(--tf-accent)]' : 'text-[var(--tf-text)]'
              }`}
            >
              {game.name}
            </motion.h2>

            <p className="mt-2.5 text-sm text-[var(--tf-text-muted)] leading-relaxed max-w-md">
              {game.shortDesc} Lock onto descending words by typing their opening letters before they reach the floor line.
            </p>
          </div>

          <div className="pt-5 border-t border-[var(--tf-border)]/50 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-xs font-typing tabular-nums">
                {bestRecord !== null && bestRecord !== undefined ? (
                  <>
                    <Trophy
                      className="w-3.5 h-3.5 text-[var(--tf-accent)] shrink-0"
                      strokeWidth={1.85}
                    />
                    <span className="text-[var(--tf-text)] font-medium">
                      {game.metricLabel}: {bestRecord} pts
                    </span>
                  </>
                ) : (
                  <span className="text-[var(--tf-text-dim)]">No personal best yet</span>
                )}
              </div>
              <div className="text-xs text-[var(--tf-text-dim)]">
                {game.difficulties.join(' · ')}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onPlay(game.id)}
              disabled={isLaunching}
              className="rounded-lg focus-visible:outline-2 focus-visible:outline-[var(--tf-accent)] cursor-pointer shrink-0"
            >
              {/* Stretch hit target across panel cleanly with zero nested interactive elements */}
              <span className="absolute inset-0 z-10" aria-hidden="true" />
              <motion.span
                whileTap={{ scale: 0.97 }}
                className={`relative z-20 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-200 ${
                  isHovered
                    ? 'bg-[var(--tf-accent)] text-[var(--tf-accent-fg)]'
                    : 'bg-[var(--tf-bg)] text-[var(--tf-text)] border border-[var(--tf-border)]'
                }`}
              >
                <span>{isLaunching ? 'Opening...' : 'Play Falling Words'}</span>
                {isLaunching ? (
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                ) : (
                  <motion.span
                    className="inline-flex"
                    animate={{ x: isHovered ? 3 : 0 }}
                    transition={{ duration: 0.18, ease: TF_EASE }}
                  >
                    <ArrowRight className="w-4 h-4" strokeWidth={2} />
                  </motion.span>
                )}
              </motion.span>
            </button>
          </div>
        </div>

        {/* Right Custom Animated SVG Stage */}
        <div className="lg:col-span-6 p-5 sm:p-6 bg-[var(--tf-bg)]/45 border-t lg:border-t-0 lg:border-l border-[var(--tf-border)]/50 flex items-center justify-center">
          <div className="w-full max-w-[380px]">
            {renderPreviewSvg(game.id, isHovered, false)}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function GameCard({
  game,
  bestRecord,
  isWide = false,
  isCompletedToday = false,
  subtitleMeta = '',
  isLaunching = false,
  onPlay,
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full rounded-xl border transition-colors duration-200 overflow-hidden flex flex-col justify-between ${
        isHovered
          ? 'bg-[var(--tf-surface)] border-[var(--tf-accent)]/60'
          : 'bg-[var(--tf-surface)]/55 border-[var(--tf-border)]/70'
      }`}
    >
      <div
        className={`flex-1 flex ${
          isWide ? 'flex-col sm:flex-row items-stretch' : 'flex-col'
        }`}
      >
        {/* Text Content */}
        <div
          className={`p-5 sm:p-6 flex flex-col justify-between gap-4 ${
            isWide ? 'sm:w-[56%]' : 'flex-1'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 text-xs text-[var(--tf-text-muted)]">
              <span>{subtitleMeta}</span>
              {game.id === 'daily-challenge' && isCompletedToday && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-[var(--tf-success)] font-medium">
                    <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
                    <span>Completed</span>
                  </span>
                </>
              )}
            </div>

            <motion.h3
              animate={{ x: isHovered ? 2 : 0 }}
              transition={{ duration: 0.16, ease: TF_EASE }}
              className={`mt-1.5 text-lg font-semibold tracking-tight transition-colors duration-200 ${
                isHovered ? 'text-[var(--tf-accent)]' : 'text-[var(--tf-text)]'
              }`}
            >
              {game.name}
            </motion.h3>

            <p className="mt-2 text-sm text-[var(--tf-text-muted)] leading-relaxed">
              {game.shortDesc}
            </p>
          </div>

          <div className="pt-4 border-t border-[var(--tf-border)]/45 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-typing tabular-nums">
                {bestRecord !== null && bestRecord !== undefined ? (
                  <>
                    <Trophy
                      className="w-3.5 h-3.5 text-[var(--tf-accent)] shrink-0"
                      strokeWidth={1.85}
                    />
                    <span className="text-[var(--tf-text)] font-medium truncate">
                      {game.metricLabel}: {bestRecord}
                    </span>
                  </>
                ) : (
                  <span className="text-[var(--tf-text-dim)] truncate">
                    No personal best yet
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-[11px] text-[var(--tf-text-dim)] truncate">
                {game.difficulties.length > 1
                  ? game.difficulties.join(' · ')
                  : 'daily edition'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onPlay(game.id)}
              disabled={isLaunching}
              className="rounded-lg focus-visible:outline-2 focus-visible:outline-[var(--tf-accent)] cursor-pointer shrink-0"
            >
              <span className="absolute inset-0 z-10" aria-hidden="true" />
              <motion.span
                whileTap={{ scale: 0.96 }}
                className={`relative z-20 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors duration-200 ${
                  isHovered
                    ? 'bg-[var(--tf-accent)] text-[var(--tf-accent-fg)]'
                    : 'bg-[var(--tf-bg)] text-[var(--tf-text)] border border-[var(--tf-border)]'
                }`}
              >
                <span>{isLaunching ? 'Opening' : 'Play'}</span>
                {isLaunching ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
                ) : (
                  <motion.span
                    className="inline-flex"
                    animate={{ x: isHovered ? 3 : 0 }}
                    transition={{ duration: 0.16, ease: TF_EASE }}
                  >
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.9} />
                  </motion.span>
                )}
              </motion.span>
            </button>
          </div>
        </div>

        {/* Custom Animated SVG Stage */}
        <div
          className={`bg-[var(--tf-bg)]/40 flex items-center justify-center p-4 ${
            isWide
              ? 'sm:w-[44%] border-t sm:border-t-0 sm:border-l border-[var(--tf-border)]/45'
              : 'border-t border-[var(--tf-border)]/45 py-4 px-5'
          }`}
        >
          <div className={isWide ? 'w-full max-w-[260px]' : 'w-full max-w-[200px]'}>
            {renderPreviewSvg(game.id, isHovered, isCompletedToday)}
          </div>
        </div>
      </div>
    </section>
  );
}
