import { motion } from 'motion/react';
import { RotateCcw, ArrowRight, BarChart3, Trophy, Award, Target, Clock, Gauge } from 'lucide-react';
import { WpmTimelineChart } from './Charts.jsx';
import { AnimatedNumber, TF_EASE } from '../utils/motion.js';
import { getLevelInfo } from '../utils/gamification.js';

export default function ResultPanel({
  result,
  previousBest,
  isNewBest,
  xpEarned = 0,
  totalXp = 0,
  onRestartSame,
  onNextTest,
  onViewStats,
}) {
  if (!result) return null;

  const delta =
    previousBest !== undefined && previousBest !== null
      ? result.wpm - previousBest
      : null;

  const levelInfo = getLevelInfo(totalXp);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: TF_EASE }}
      className="w-full max-w-[960px] mx-auto py-4"
    >
      {/* Top Split: Primary WPM + Accuracy on left, WPM Timeline Chart on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--tf-text-muted)]">
              <Gauge className="w-4 h-4 opacity-75" strokeWidth={1.75} />
              <span>wpm</span>
            </div>
            <div className="text-5xl sm:text-6xl font-bold font-typing tabular-nums text-[var(--tf-accent)] leading-none mt-1.5">
              <AnimatedNumber value={result.wpm} duration={0.6} />
            </div>

            {isNewBest ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25, duration: 0.24, ease: TF_EASE }}
                className="mt-2.5 inline-flex items-center gap-2 text-xs font-semibold text-[var(--tf-accent)]"
              >
                <Trophy className="w-4 h-4" strokeWidth={1.9} />
                <span>New personal best</span>
              </motion.div>
            ) : (
              delta !== null && (
                <div className="mt-2 text-xs text-[var(--tf-text-muted)] font-typing tabular-nums">
                  {delta >= 0 ? `+${delta}` : delta} vs best ({previousBest} wpm)
                </div>
              )
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            <div>
              <div className="flex items-center justify-between text-sm font-medium text-[var(--tf-text-muted)] mb-1">
                <span className="inline-flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 opacity-75" strokeWidth={1.75} />
                  <span>accuracy</span>
                </span>
                <span className="font-typing tabular-nums text-lg font-bold text-[var(--tf-text)]">
                  <AnimatedNumber value={result.accuracy} duration={0.45} suffix="%" />
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[var(--tf-surface)] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.accuracy}%` }}
                  transition={{ duration: 0.5, ease: TF_EASE }}
                  className="h-full rounded-full bg-[var(--tf-accent)]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-medium text-[var(--tf-text-muted)] mb-1">
                <span>consistency</span>
                <span className="font-typing tabular-nums text-sm font-semibold text-[var(--tf-text)]">
                  {result.consistency}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[var(--tf-surface)] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.consistency}%` }}
                  transition={{ duration: 0.55, delay: 0.08, ease: TF_EASE }}
                  className="h-full rounded-full bg-[var(--tf-text-muted)]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-[var(--tf-surface)]/50 border border-[var(--tf-border)]/60 rounded-xl p-4 sm:p-5">
          <WpmTimelineChart data={result.wpmTimeline} height={185} />
        </div>
      </div>

      {/* Secondary Metrics Grid */}
      <div className="mt-8 pt-6 border-t border-[var(--tf-border)]/60 grid grid-cols-2 sm:grid-cols-5 gap-6">
        <div>
          <div className="text-xs text-[var(--tf-text-muted)]">test type</div>
          <div className="mt-1 text-base font-medium font-typing text-[var(--tf-text)]">
            {result.mode} {result.subValue !== result.mode ? result.subValue : ''}
          </div>
          <div className="text-xs text-[var(--tf-text-muted)]">{result.language}</div>
        </div>

        <div>
          <div className="text-xs text-[var(--tf-text-muted)]">raw wpm</div>
          <div className="mt-1 text-2xl font-semibold font-typing tabular-nums text-[var(--tf-text)]">
            {result.rawWpm}
          </div>
        </div>

        <div>
          <div className="text-xs text-[var(--tf-text-muted)]">characters</div>
          <div className="mt-1 text-lg font-semibold font-typing tabular-nums text-[var(--tf-text)]">
            <span className="text-[var(--tf-text)]" title="Correct">
              {result.correctChars}
            </span>
            <span className="text-[var(--tf-text-dim)]">/</span>
            <span className="text-[var(--tf-error)]" title="Incorrect & Extra">
              {result.incorrectChars}
            </span>
            <span className="text-[var(--tf-text-dim)]">/</span>
            <span className="text-[var(--tf-text-muted)]" title="Missed">
              {result.missedChars}
            </span>
          </div>
          <div className="text-[11px] text-[var(--tf-text-muted)]">correct / err / missed</div>
        </div>

        <div>
          <div className="flex items-center gap-1 text-xs text-[var(--tf-text-muted)]">
            <Clock className="w-3 h-3 opacity-75" strokeWidth={1.75} />
            <span>duration</span>
          </div>
          <div className="mt-1 text-2xl font-semibold font-typing tabular-nums text-[var(--tf-text)]">
            {result.duration}s
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 text-xs text-[var(--tf-text-muted)]">
            <Award className="w-3.5 h-3.5 text-[var(--tf-accent)]" strokeWidth={1.75} />
            <span>experience</span>
          </div>
          <div className="mt-1 text-base font-semibold font-typing tabular-nums text-[var(--tf-accent)]">
            +{xpEarned} XP
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[11px] font-typing text-[var(--tf-text-muted)]">
              Lv.{levelInfo.level}
            </span>
            <div className="flex-1 h-1 rounded-full bg-[var(--tf-surface)] overflow-hidden">
              <div
                className="h-full bg-[var(--tf-accent)] transition-all duration-300"
                style={{ width: `${levelInfo.progressPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Result Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onNextTest}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--tf-accent)] text-[var(--tf-accent-fg)] text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--tf-accent)]"
        >
          <ArrowRight className="w-4 h-4" strokeWidth={1.9} />
          <span>Next Test</span>
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onRestartSame}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--tf-surface)] border border-[var(--tf-border)] text-sm font-medium text-[var(--tf-text)] hover:bg-[var(--tf-surface-hover)] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--tf-accent)]"
        >
          <RotateCcw className="w-4 h-4" strokeWidth={1.75} />
          <span>Repeat Text</span>
        </motion.button>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onViewStats}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-transparent border border-[var(--tf-border)] text-sm font-medium text-[var(--tf-text-muted)] hover:text-[var(--tf-text)] hover:bg-[var(--tf-surface)] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--tf-accent)]"
        >
          <BarChart3 className="w-4 h-4" strokeWidth={1.75} />
          <span>View Statistics</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
