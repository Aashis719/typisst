import { motion } from 'motion/react';
import { Timer, Zap, Target } from 'lucide-react';
import { TF_EASE } from '../utils/motion.js';

export default function LiveStats({
  mode,
  status,
  remainingSeconds,
  elapsedSeconds,
  currentWordIndex,
  totalWords,
  liveWpm,
  liveAccuracy,
  showLiveWpm,
  showLiveAccuracy,
}) {
  const isIdle = status === 'idle';

  return (
    <div className="h-8 flex items-center justify-between text-base sm:text-lg font-typing tabular-nums select-none">
      <div className="flex items-center gap-5">
        <span
          className={`inline-flex items-center gap-1.5 font-semibold transition-colors ${
            isIdle ? 'text-[var(--tf-text-muted)]' : 'text-[var(--tf-accent)]'
          }`}
        >
          <Timer className="w-4 h-4 opacity-80" strokeWidth={1.85} />
          {mode === 'time' && `${remainingSeconds}s`}
          {(mode === 'words' || mode === 'quote' || mode === 'custom') &&
            `${Math.min(currentWordIndex, totalWords)}/${totalWords}`}
          {mode === 'zen' && `${Math.floor(elapsedSeconds)}s`}
        </span>

        {!isIdle && showLiveWpm && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.16, ease: TF_EASE }}
            className="inline-flex items-center gap-1 text-sm text-[var(--tf-text-muted)]"
          >
            <Zap className="w-3.5 h-3.5 text-[var(--tf-accent)]/80" strokeWidth={1.75} />
            <span>{liveWpm}</span>
            <span className="text-xs">wpm</span>
          </motion.span>
        )}

        {!isIdle && showLiveAccuracy && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.16, delay: 0.04, ease: TF_EASE }}
            className="inline-flex items-center gap-1 text-sm text-[var(--tf-text-muted)]"
          >
            <Target className="w-3.5 h-3.5 opacity-75" strokeWidth={1.75} />
            <span>{liveAccuracy}%</span>
            <span className="text-xs">acc</span>
          </motion.span>
        )}
      </div>
    </div>
  );
}
