import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { BarChart3, Gauge, Trophy, Target, Activity, Clock } from 'lucide-react';
import { TrendLineChart } from '../components/Charts.jsx';
import { EmptyStatsIllustration } from '../components/GameVisuals.jsx';
import { formatDuration } from '../utils/typingCalculations.js';
import { TF_EASE } from '../utils/motion.js';

const FILTERS = [
  { id: 'daily', label: 'Today' },
  { id: 'weekly', label: '7 Days' },
  { id: 'monthly', label: '30 Days' },
  { id: 'all', label: 'All Time' },
];

const RECORD_SLOTS = [
  { key: 'time:15', label: '15s Time' },
  { key: 'time:30', label: '30s Time' },
  { key: 'time:60', label: '60s Time' },
  { key: 'time:120', label: '120s Time' },
  { key: 'words:10', label: '10 Words' },
  { key: 'words:25', label: '25 Words' },
  { key: 'words:50', label: '50 Words' },
  { key: 'words:100', label: '100 Words' },
];

export default function Statistics({ history = [], profile, onStartPractice }) {
  const [filter, setFilter] = useState('all');

  const filteredHistory = useMemo(() => {
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return history.filter((item) => {
      const ts = new Date(item.timestamp).getTime();
      if (filter === 'daily') return ts >= startOfToday.getTime();
      if (filter === 'weekly') return ts >= now - 7 * 24 * 60 * 60 * 1000;
      if (filter === 'monthly') return ts >= now - 30 * 24 * 60 * 60 * 1000;
      return true;
    });
  }, [history, filter]);

  const metrics = useMemo(() => {
    if (filteredHistory.length === 0) {
      return {
        avgWpm: 0,
        maxWpm: 0,
        avgAcc: 0,
        totalTests: 0,
        totalSeconds: 0,
      };
    }
    let sumWpm = 0;
    let maxWpm = 0;
    let sumAcc = 0;
    let totalSeconds = 0;

    for (const item of filteredHistory) {
      sumWpm += item.wpm || 0;
      if ((item.wpm || 0) > maxWpm) maxWpm = item.wpm || 0;
      sumAcc += item.accuracy || 0;
      totalSeconds += item.duration || 0;
    }

    return {
      avgWpm: Math.round(sumWpm / filteredHistory.length),
      maxWpm,
      avgAcc: Math.round(sumAcc / filteredHistory.length),
      totalTests: filteredHistory.length,
      totalSeconds,
    };
  }, [filteredHistory]);

  const chartPoints = useMemo(() => {
    const ordered = [...filteredHistory].slice(0, 40).reverse();
    return ordered.map((item, idx) => {
      const d = new Date(item.timestamp);
      const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return {
        index: idx + 1,
        label: `${label} (${item.mode})`,
        wpm: item.wpm,
        accuracy: item.accuracy,
      };
    });
  }, [filteredHistory]);

  return (
    <div className="w-full max-w-[1040px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header & Timeframe Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-[var(--tf-accent)]" strokeWidth={1.85} />
            <h1 className="text-2xl font-bold tracking-tight text-[var(--tf-text)]">
              Statistics
            </h1>
          </div>
          <p className="mt-1 text-sm text-[var(--tf-text-muted)]">
            Track speed, accuracy, and consistency across your recorded typing sessions.
          </p>
        </div>

        <div className="flex items-center bg-[var(--tf-surface)] p-1 rounded-lg border border-[var(--tf-border)]/60">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`relative px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  active
                    ? 'text-[var(--tf-accent)]'
                    : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text)]'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="stats-filter-pill"
                    transition={{ duration: 0.16, ease: TF_EASE }}
                    className="absolute inset-0 rounded-md bg-[var(--tf-bg)]"
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10">{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {history.length === 0 ? (
        <div className="py-16 px-6 text-center rounded-xl bg-[var(--tf-surface)]/45 border border-[var(--tf-border)]/60">
          <EmptyStatsIllustration className="w-28 h-16 mx-auto mb-4" />
          <h2 className="text-base font-semibold text-[var(--tf-text)]">No typing history yet</h2>
          <p className="mt-1.5 text-sm text-[var(--tf-text-muted)] max-w-md mx-auto">
            Complete your first typing test in Practice mode to unlock progress charts, personal records, and session logs.
          </p>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={onStartPractice}
            className="mt-5 px-5 py-2.5 rounded-lg bg-[var(--tf-accent)] text-[var(--tf-accent-fg)] text-sm font-semibold hover:opacity-90 cursor-pointer"
          >
            Start First Test
          </motion.button>
        </div>
      ) : (
        <>
          {/* Summary KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pb-8 border-b border-[var(--tf-border)]/60">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--tf-text-muted)]">
                <Gauge className="w-3.5 h-3.5 opacity-75" strokeWidth={1.75} />
                <span>Average WPM</span>
              </div>
              <div className="mt-1 text-3xl font-bold font-typing tabular-nums text-[var(--tf-accent)]">
                {metrics.avgWpm}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--tf-text-muted)]">
                <Trophy className="w-3.5 h-3.5 opacity-75" strokeWidth={1.75} />
                <span>Highest WPM</span>
              </div>
              <div className="mt-1 text-3xl font-bold font-typing tabular-nums text-[var(--tf-text)]">
                {metrics.maxWpm}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--tf-text-muted)]">
                <Target className="w-3.5 h-3.5 opacity-75" strokeWidth={1.75} />
                <span>Average Accuracy</span>
              </div>
              <div className="mt-1 text-3xl font-bold font-typing tabular-nums text-[var(--tf-text)]">
                {metrics.avgAcc}%
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--tf-text-muted)]">
                <Activity className="w-3.5 h-3.5 opacity-75" strokeWidth={1.75} />
                <span>Tests Completed</span>
              </div>
              <div className="mt-1 text-3xl font-bold font-typing tabular-nums text-[var(--tf-text)]">
                {metrics.totalTests}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--tf-text-muted)]">
                <Clock className="w-3.5 h-3.5 opacity-75" strokeWidth={1.75} />
                <span>Time Typing</span>
              </div>
              <div className="mt-1 text-3xl font-bold font-typing tabular-nums text-[var(--tf-text)]">
                {formatDuration(metrics.totalSeconds)}
              </div>
            </div>
          </div>

          {/* Progress Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-8 border-b border-[var(--tf-border)]/60">
            <div className="p-5 rounded-xl bg-[var(--tf-surface)]/45 border border-[var(--tf-border)]/60">
              <div className="text-sm font-semibold text-[var(--tf-text)] mb-3">
                WPM Progress
              </div>
              <TrendLineChart
                points={chartPoints}
                valueKey="wpm"
                unit="wpm"
                color="var(--tf-accent)"
                height={185}
              />
            </div>

            <div className="p-5 rounded-xl bg-[var(--tf-surface)]/45 border border-[var(--tf-border)]/60">
              <div className="text-sm font-semibold text-[var(--tf-text)] mb-3">
                Accuracy Progress
              </div>
              <TrendLineChart
                points={chartPoints}
                valueKey="accuracy"
                unit="%"
                color="var(--tf-success)"
                height={185}
              />
            </div>
          </div>

          {/* Personal Records Grid */}
          <div className="py-8 border-b border-[var(--tf-border)]/60">
            <h2 className="text-base font-semibold text-[var(--tf-text)] mb-4">
              Personal Records
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {RECORD_SLOTS.map((slot) => {
                const rec = profile?.personalBests?.[slot.key];
                return (
                  <div
                    key={slot.key}
                    className="p-4 rounded-xl bg-[var(--tf-surface)]/45 border border-[var(--tf-border)]/60"
                  >
                    <div className="text-xs text-[var(--tf-text-muted)]">{slot.label}</div>
                    <div className="mt-1.5 text-2xl font-bold font-typing tabular-nums text-[var(--tf-text)]">
                      {rec ? `${rec.wpm}` : '—'}
                      {rec && <span className="text-xs font-normal text-[var(--tf-text-muted)] ml-1">wpm</span>}
                    </div>
                    <div className="mt-0.5 text-xs font-typing tabular-nums text-[var(--tf-text-dim)]">
                      {rec ? `${rec.accuracy}% accuracy` : 'No record'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Test History Table */}
          <div className="pt-8">
            <h2 className="text-base font-semibold text-[var(--tf-text)] mb-4">
              Recent Test History
            </h2>
            {filteredHistory.length === 0 ? (
              <p className="text-sm text-[var(--tf-text-muted)]">
                No tests recorded within the selected filter range.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-[var(--tf-border)]/60">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--tf-surface)]/70 text-xs text-[var(--tf-text-muted)] border-b border-[var(--tf-border)]/60">
                    <tr>
                      <th className="py-3 px-4 font-medium">Mode</th>
                      <th className="py-3 px-4 font-medium">Language</th>
                      <th className="py-3 px-4 font-medium text-right">WPM</th>
                      <th className="py-3 px-4 font-medium text-right">Raw</th>
                      <th className="py-3 px-4 font-medium text-right">Accuracy</th>
                      <th className="py-3 px-4 font-medium text-right">Consistency</th>
                      <th className="py-3 px-4 font-medium text-right">Duration</th>
                      <th className="py-3 px-4 font-medium text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--tf-border)]/40 font-typing tabular-nums text-xs sm:text-sm">
                    {filteredHistory.slice(0, 25).map((row) => (
                      <tr key={row.id} className="hover:bg-[var(--tf-surface)]/40 transition-colors">
                        <td className="py-3 px-4 text-[var(--tf-text)]">
                          {row.mode} {row.subValue !== row.mode ? row.subValue : ''}
                        </td>
                        <td className="py-3 px-4 text-[var(--tf-text-muted)]">{row.language}</td>
                        <td className="py-3 px-4 text-right font-semibold text-[var(--tf-accent)]">
                          {row.wpm}
                        </td>
                        <td className="py-3 px-4 text-right text-[var(--tf-text-muted)]">
                          {row.rawWpm}
                        </td>
                        <td className="py-3 px-4 text-right text-[var(--tf-text)]">
                          {row.accuracy}%
                        </td>
                        <td className="py-3 px-4 text-right text-[var(--tf-text-muted)]">
                          {row.consistency}%
                        </td>
                        <td className="py-3 px-4 text-right text-[var(--tf-text-muted)]">
                          {row.duration}s
                        </td>
                        <td className="py-3 px-4 text-right text-[var(--tf-text-muted)] font-sans">
                          {new Date(row.timestamp).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
