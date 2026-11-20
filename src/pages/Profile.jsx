import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Trash2, User, Award, Flame, CheckCircle2, Lock } from 'lucide-react';
import { GAMES_META } from '../utils/gameLogic.js';
import { ACHIEVEMENTS, getLevelInfo } from '../utils/gamification.js';
import { modalBackdropVariants, modalPanelVariants, TF_EASE } from '../utils/motion.js';

export default function Profile({
  profile,
  history = [],
  onUpdateDisplayName,
  onResetAllStats,
}) {
  const [nameInput, setNameInput] = useState(profile?.displayName || 'Guest Typist');
  const [savedNotice, setSavedNotice] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  const handleSaveName = (e) => {
    e.preventDefault();
    const cleaned = nameInput.trim() || 'Guest Typist';
    onUpdateDisplayName(cleaned);
    setNameInput(cleaned);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 1800);
  };

  const bestWpmOverall = history.reduce((max, item) => Math.max(max, item.wpm || 0), 0);
  const dailyEntries = Object.entries(profile?.dailyChallenges || {}).sort((a, b) =>
    b[0].localeCompare(a[0])
  );
  const levelInfo = getLevelInfo(profile?.xp || 0);
  const unlockedSet = new Set(profile?.unlockedAchievements || []);

  return (
    <div className="w-full max-w-[920px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <div className="flex items-center gap-2.5">
          <User className="w-5 h-5 text-[var(--tf-accent)]" strokeWidth={1.85} />
          <h1 className="text-2xl font-bold tracking-tight text-[var(--tf-text)]">
            Profile
          </h1>
        </div>
        <p className="mt-1 text-sm text-[var(--tf-text-muted)]">
          Local profile storing your level progression, records, and milestones.
        </p>
      </div>

      {/* Display Name + Level Card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <form
          onSubmit={handleSaveName}
          className="md:col-span-7 p-5 rounded-xl bg-[var(--tf-surface)]/50 border border-[var(--tf-border)]/70 flex flex-col sm:flex-row sm:items-end justify-between gap-4"
        >
          <div className="flex-1">
            <label
              htmlFor="display-name-input"
              className="block text-xs font-medium text-[var(--tf-text-muted)] mb-1.5"
            >
              Display Name
            </label>
            <input
              id="display-name-input"
              type="text"
              maxLength={28}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full px-3.5 py-2 rounded-lg bg-[var(--tf-bg)] border border-[var(--tf-border)] text-sm text-[var(--tf-text)] focus:outline-none focus:border-[var(--tf-accent)]"
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {savedNotice && (
              <span className="inline-flex items-center gap-1 text-xs text-[var(--tf-success)]">
                <Check className="w-3.5 h-3.5" strokeWidth={2} />
                Saved
              </span>
            )}
            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              className="px-4 py-2 rounded-lg bg-[var(--tf-accent)] text-[var(--tf-accent-fg)] text-xs font-semibold hover:opacity-90 cursor-pointer"
            >
              Save Name
            </motion.button>
          </div>
        </form>

        {/* Level & XP Progress */}
        <div className="md:col-span-5 p-5 rounded-xl bg-[var(--tf-surface)]/50 border border-[var(--tf-border)]/70 flex flex-col justify-between">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[var(--tf-accent)]" strokeWidth={1.85} />
              <span className="text-sm font-semibold text-[var(--tf-text)]">
                Level {levelInfo.level} · {levelInfo.rankTitle}
              </span>
            </div>
            <span className="text-xs font-typing tabular-nums text-[var(--tf-text-muted)]">
              {levelInfo.totalXp} XP
            </span>
          </div>

          <div className="mt-4">
            <div className="h-2 w-full rounded-full bg-[var(--tf-bg)] overflow-hidden border border-[var(--tf-border)]/50">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelInfo.progressPct}%` }}
                transition={{ duration: 0.5, ease: TF_EASE }}
                className="h-full bg-[var(--tf-accent)]"
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px] font-typing tabular-nums text-[var(--tf-text-muted)]">
              <span>{levelInfo.intoLevel} / {levelInfo.span} XP to Lv.{levelInfo.level + 1}</span>
              <span>{levelInfo.progressPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-8 border-b border-[var(--tf-border)]/60">
        <div>
          <div className="text-xs text-[var(--tf-text-muted)]">All-Time Best WPM</div>
          <div className="mt-1 text-3xl font-bold font-typing tabular-nums text-[var(--tf-accent)]">
            {bestWpmOverall || '—'}
          </div>
        </div>
        <div>
          <div className="text-xs text-[var(--tf-text-muted)]">Tests Recorded</div>
          <div className="mt-1 text-3xl font-bold font-typing tabular-nums text-[var(--tf-text)]">
            {history.length}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-xs text-[var(--tf-text-muted)]">
            <Flame className="w-3.5 h-3.5 text-[var(--tf-accent)]" strokeWidth={1.75} />
            <span>Daily Streak</span>
          </div>
          <div className="mt-1 text-3xl font-bold font-typing tabular-nums text-[var(--tf-text)]">
            {profile?.streak || 0}d
          </div>
        </div>
        <div>
          <div className="text-xs text-[var(--tf-text-muted)]">Daily Challenges</div>
          <div className="mt-1 text-3xl font-bold font-typing tabular-nums text-[var(--tf-text)]">
            {dailyEntries.length}
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="py-8 border-b border-[var(--tf-border)]/60">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-base font-semibold text-[var(--tf-text)]">Milestones</h2>
          <span className="text-xs font-typing tabular-nums text-[var(--tf-text-muted)]">
            {unlockedSet.size} / {ACHIEVEMENTS.length} unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACHIEVEMENTS.map((ach) => {
            const unlocked = unlockedSet.has(ach.id);
            return (
              <div
                key={ach.id}
                className={`p-4 rounded-xl border transition-colors flex items-start gap-3 ${
                  unlocked
                    ? 'bg-[var(--tf-surface)]/70 border-[var(--tf-accent)]/40'
                    : 'bg-[var(--tf-surface)]/25 border-[var(--tf-border)]/50 opacity-65'
                }`}
              >
                {unlocked ? (
                  <CheckCircle2
                    className="w-4 h-4 text-[var(--tf-accent)] mt-0.5 shrink-0"
                    strokeWidth={1.9}
                  />
                ) : (
                  <Lock
                    className="w-4 h-4 text-[var(--tf-text-dim)] mt-0.5 shrink-0"
                    strokeWidth={1.75}
                  />
                )}
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[var(--tf-text)]">{ach.title}</div>
                  <div className="text-xs text-[var(--tf-text-muted)] mt-0.5 leading-relaxed">
                    {ach.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Game High Scores */}
      <div className="py-8 border-b border-[var(--tf-border)]/60">
        <h2 className="text-base font-semibold text-[var(--tf-text)] mb-4">Game Records</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {GAMES_META.filter((g) => g.id !== 'daily-challenge').map((g) => {
            const scores = profile?.gameRecords?.[g.id] || {};
            return (
              <div
                key={g.id}
                className="p-4 rounded-xl bg-[var(--tf-surface)]/45 border border-[var(--tf-border)]/60 flex items-center justify-between"
              >
                <span className="text-sm font-medium text-[var(--tf-text)]">{g.name}</span>
                <div className="flex items-center gap-3 text-xs font-typing tabular-nums text-[var(--tf-text-muted)]">
                  {['easy', 'medium', 'hard'].map((diff) => (
                    <span key={diff}>
                      {diff[0].toUpperCase()}: <strong className="text-[var(--tf-text)]">{scores[diff] ?? '—'}</strong>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Challenge History */}
      {dailyEntries.length > 0 && (
        <div className="py-8 border-b border-[var(--tf-border)]/60">
          <h2 className="text-base font-semibold text-[var(--tf-text)] mb-4">
            Daily Challenge History
          </h2>
          <div className="divide-y divide-[var(--tf-border)]/45 rounded-xl border border-[var(--tf-border)]/60 overflow-hidden">
            {dailyEntries.slice(0, 7).map(([dateKey, rec]) => (
              <div
                key={dateKey}
                className="px-4 py-3 flex items-center justify-between text-sm font-typing tabular-nums bg-[var(--tf-surface)]/30"
              >
                <span className="text-[var(--tf-text)]">{dateKey}</span>
                <div className="flex items-center gap-5 text-xs">
                  <span className="text-[var(--tf-accent)] font-semibold">{rec.score} pts</span>
                  <span className="text-[var(--tf-text)]">{rec.wpm} wpm</span>
                  <span className="text-[var(--tf-text-muted)]">{rec.accuracy}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger Zone: Reset Statistics */}
      <div className="pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[var(--tf-text)]">Reset Local Progress</h2>
          <p className="text-xs text-[var(--tf-text-muted)] mt-0.5">
            Clears your typing history, XP, milestones, personal bests, and game records from this browser.
          </p>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={() => setConfirmResetOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--tf-error)]/50 text-xs font-semibold text-[var(--tf-error)] hover:bg-[var(--tf-error)]/10 transition-colors cursor-pointer shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.85} />
          <span>Reset Statistics</span>
        </motion.button>
      </div>

      <AnimatePresence>
        {confirmResetOpen && (
          <motion.div
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4"
            onClick={() => setConfirmResetOpen(false)}
          >
            <motion.div
              variants={modalPanelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl bg-[var(--tf-bg)] border border-[var(--tf-border)] p-6 shadow-xl"
            >
              <h3 className="text-base font-semibold text-[var(--tf-text)]">
                Reset all statistics?
              </h3>
              <p className="mt-2 text-xs text-[var(--tf-text-muted)] leading-relaxed">
                This will permanently erase your recorded typing tests, XP, milestones, and game high scores on this device. Your display name and theme settings will stay intact.
              </p>
              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmResetOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[var(--tf-text-muted)] hover:text-[var(--tf-text)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onResetAllStats();
                    setConfirmResetOpen(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-[var(--tf-error)] text-white text-xs font-semibold hover:opacity-90 cursor-pointer"
                >
                  Confirm Reset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
