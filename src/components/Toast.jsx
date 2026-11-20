import { AnimatePresence, motion } from 'motion/react';
import { Award, CheckCircle2, Flame, Trophy, X } from 'lucide-react';
import { TF_EASE } from '../utils/motion.js';

const ICON_MAP = {
  record: Trophy,
  level: Award,
  achievement: CheckCircle2,
  streak: Flame,
  info: CheckCircle2,
};

export default function ToastContainer({ toasts = [], onDismiss }) {
  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-xs w-full pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = ICON_MAP[toast.type] || CheckCircle2;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ duration: 0.2, ease: TF_EASE }}
              className="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl bg-[var(--tf-surface)] border border-[var(--tf-border)] shadow-lg"
            >
              <Icon className="w-4 h-4 text-[var(--tf-accent)] mt-0.5 shrink-0" strokeWidth={1.9} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[var(--tf-text)] truncate">
                  {toast.title}
                </div>
                {toast.message && (
                  <div className="text-xs text-[var(--tf-text-muted)] mt-0.5 leading-snug">
                    {toast.message}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                aria-label="Dismiss notification"
                className="p-0.5 rounded text-[var(--tf-text-dim)] hover:text-[var(--tf-text)] cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
