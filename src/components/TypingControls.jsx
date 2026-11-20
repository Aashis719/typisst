import { motion } from 'motion/react';
import {
  Clock,
  Type,
  Quote,
  Infinity as InfinityIcon,
  Sliders,
  RotateCcw,
  Globe,
} from 'lucide-react';
import { LANGUAGES } from '../data/words.js';
import { TF_EASE } from '../utils/motion.js';

const MODES = [
  { id: 'time', label: 'time', icon: Clock },
  { id: 'words', label: 'words', icon: Type },
  { id: 'quote', label: 'quote', icon: Quote },
 
  { id: 'custom', label: 'custom', icon: Sliders },
];

const TIME_OPTIONS = [15, 30, 60, 120];
const WORD_OPTIONS = [10, 25, 50, 100];
const QUOTE_OPTIONS = ['all', 'short', 'medium', 'long'];

export default function TypingControls({
  mode,
  duration,
  wordCount,
  quoteLength,
  language,
  onChangeMode,
  onChangeDuration,
  onChangeWordCount,
  onChangeQuoteLength,
  onChangeLanguage,
  onRestart,
  onOpenCustomEditor,
  isDimmed,
}) {
  return (
    <div
      className={`w-full flex flex-wrap items-center justify-center gap-2 sm:gap-3 transition-opacity duration-200 ${
        isDimmed ? 'opacity-25 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Mode Segment */}
      <div className="flex items-center flex-wrap justify-center bg-[var(--tf-surface)] rounded-lg p-1 border border-[var(--tf-border)]/50">
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChangeMode(m.id)}
              className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--tf-accent)] ${
                active
                  ? 'text-[var(--tf-accent)]'
                  : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text)]'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="typing-mode-pill"
                  transition={{ duration: 0.18, ease: TF_EASE }}
                  className="absolute inset-0 rounded-md bg-[var(--tf-bg)]/75"
                  aria-hidden="true"
                />
              )}
              <Icon className="relative z-10 w-3.5 h-3.5" strokeWidth={1.75} />
              <span className="relative z-10">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-option Segment */}
      {mode === 'time' && (
        <div className="flex items-center bg-[var(--tf-surface)] rounded-lg p-1 border border-[var(--tf-border)]/50">
          {TIME_OPTIONS.map((sec) => {
            const active = duration === sec;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => onChangeDuration(sec)}
                className={`relative px-2.5 py-1.5 rounded-md text-xs font-medium tabular-nums whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--tf-accent)] ${
                  active
                    ? 'text-[var(--tf-accent)]'
                    : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text)]'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="typing-sub-pill"
                    transition={{ duration: 0.16, ease: TF_EASE }}
                    className="absolute inset-0 rounded-md bg-[var(--tf-bg)]/75"
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10">{sec}</span>
              </button>
            );
          })}
        </div>
      )}

      {mode === 'words' && (
        <div className="flex items-center bg-[var(--tf-surface)] rounded-lg p-1 border border-[var(--tf-border)]/50">
          {WORD_OPTIONS.map((cnt) => {
            const active = wordCount === cnt;
            return (
              <button
                key={cnt}
                type="button"
                onClick={() => onChangeWordCount(cnt)}
                className={`relative px-2.5 py-1.5 rounded-md text-xs font-medium tabular-nums whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--tf-accent)] ${
                  active
                    ? 'text-[var(--tf-accent)]'
                    : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text)]'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="typing-sub-pill"
                    transition={{ duration: 0.16, ease: TF_EASE }}
                    className="absolute inset-0 rounded-md bg-[var(--tf-bg)]/75"
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10">{cnt}</span>
              </button>
            );
          })}
        </div>
      )}

      {mode === 'quote' && (
        <div className="flex items-center bg-[var(--tf-surface)] rounded-lg p-1 border border-[var(--tf-border)]/50">
          {QUOTE_OPTIONS.map((len) => {
            const active = quoteLength === len;
            return (
              <button
                key={len}
                type="button"
                onClick={() => onChangeQuoteLength(len)}
                className={`relative px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--tf-accent)] ${
                  active
                    ? 'text-[var(--tf-accent)]'
                    : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text)]'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="typing-sub-pill"
                    transition={{ duration: 0.16, ease: TF_EASE }}
                    className="absolute inset-0 rounded-md bg-[var(--tf-bg)]/75"
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10">{len}</span>
              </button>
            );
          })}
        </div>
      )}

      {mode === 'custom' && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={onOpenCustomEditor}
          className="px-3 py-2 rounded-lg text-xs font-medium bg-[var(--tf-surface)] border border-[var(--tf-border)]/50 text-[var(--tf-text)] hover:bg-[var(--tf-surface-hover)] whitespace-nowrap shrink-0 transition-colors cursor-pointer"
        >
          Edit custom text
        </motion.button>
      )}

      {/* Language + Restart */}
      <div className="flex items-center gap-1 bg-[var(--tf-surface)] rounded-lg p-1 border border-[var(--tf-border)]/50">
        {/* {mode !== 'quote' && mode !== 'custom' && (
          <div className="flex items-center pl-1.5">
            <Globe className="w-3.5 h-3.5 text-[var(--tf-text-muted)] shrink-0" strokeWidth={1.75} />
            <select
              aria-label="Select typing language"
              title="Select typing language"
              value={language}
              onChange={(e) => onChangeLanguage(e.target.value)}
              className="bg-transparent text-xs font-medium text-[var(--tf-text-muted)] hover:text-[var(--tf-text)] px-1.5 py-1.5 rounded-md focus:outline-none cursor-pointer"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.id} value={lang.id} className="bg-[var(--tf-surface)] text-[var(--tf-text)]">
                  {lang.label.toLowerCase()}
                </option>
              ))}
            </select>
          </div>
        )} */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.9, rotate: -45 }}
          onClick={onRestart}
          title="Restart test (Tab)"
          aria-label="Restart test"
          className="p-1.5 rounded-md text-[var(--tf-text-muted)] hover:text-[var(--tf-accent)] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--tf-accent)]"
        >
          <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.85} />
        </motion.button>
      </div>
    </div>
  );
}
