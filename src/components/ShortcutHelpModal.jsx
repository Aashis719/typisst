import { AnimatePresence, motion } from 'motion/react';
import { Keyboard, X } from 'lucide-react';
import { modalBackdropVariants, modalPanelVariants } from '../utils/motion.js';

const SHORTCUTS = [
  { keys: ['Tab'], desc: 'Restart current typing test immediately' },
  { keys: ['Ctrl / Cmd', 'Backspace'], desc: 'Delete entire current word' },
  { keys: ['Enter'], desc: 'Start selected game or confirm dialog' },
  { keys: ['Alt', '1 - 4'], desc: 'Switch between Practice, Games, Statistics, Settings' },
];

export default function ShortcutHelpModal({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={modalBackdropVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4"
          onClick={onClose}
        >
          <motion.div
            variants={modalPanelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="w-full max-w-md rounded-xl bg-[var(--tf-bg)] border border-[var(--tf-border)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-[var(--tf-accent)]" strokeWidth={1.75} />
                <h2 id="shortcuts-title" className="text-base font-semibold text-[var(--tf-text)]">
                  Keyboard Shortcuts
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close shortcuts dialog"
                className="p-1.5 rounded-md text-[var(--tf-text-muted)] hover:text-[var(--tf-text)] hover:bg-[var(--tf-surface)] cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            <div className="divide-y divide-[var(--tf-border)]/60">
              {SHORTCUTS.map((item) => (
                <div key={item.desc} className="py-3 flex items-center justify-between gap-4">
                  <span className="text-sm text-[var(--tf-text-muted)]">{item.desc}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {item.keys.map((k) => (
                      <kbd
                        key={k}
                        className="px-2 py-0.5 text-xs font-typing rounded bg-[var(--tf-surface)] border border-[var(--tf-border)] text-[var(--tf-text)]"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
