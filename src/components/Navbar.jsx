import { motion } from 'motion/react';
import { Keyboard, Gamepad2, BarChart3, Settings, User, Flame } from 'lucide-react';
import ThemeToggle from './ThemeToggle.jsx';
import { TF_EASE } from '../utils/motion.js';
import { getLevelInfo } from '../utils/gamification.js';

const NAV_ITEMS = [
  { id: 'practice', label: 'Practice', icon: Keyboard },
  { id: 'games', label: 'Games', icon: Gamepad2 },
  { id: 'statistics', label: 'Statistics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Navbar({
  activePage,
  onNavigate,
  theme,
  onToggleTheme,
  displayName,
  profile,
  isTypingActive,
}) {
  const levelInfo = getLevelInfo(profile?.xp || 0);
  const streak = profile?.streak || 0;

  return (
    <header
      className={`w-full border-b border-[var(--tf-border)]/60 transition-opacity duration-200 ${
        isTypingActive ? 'opacity-35 hover:opacity-100' : 'opacity-100'
      }`}
    >
      <div className="max-w-[1160px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Brand Zone */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => onNavigate('practice')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer group focus-visible:outline-2 focus-visible:outline-[var(--tf-accent)] rounded-md"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="shrink-0 transition-transform duration-200 group-hover:scale-105"
          >
            <rect
              x="2"
              y="4"
              width="24"
              height="20"
              rx="5"
              stroke="var(--tf-accent)"
              strokeWidth="2"
            />
            <path
              d="M8 11H20M14 11V18"
              stroke="var(--tf-accent)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
          <span className="text-lg font-bold tracking-tight text-[var(--tf-text)]">
            TyPisst
          </span>
        </motion.button>

        {/* Primary Navigation Links */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              activePage === item.id ||
              (item.id === 'games' && activePage.startsWith('game:'));
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`relative flex items-center gap-1.5 py-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-[var(--tf-accent)] rounded ${
                  isActive
                    ? 'text-[var(--tf-text)]'
                    : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text)]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-[var(--tf-accent)]' : 'opacity-75'
                  }`}
                  strokeWidth={1.75}
                />
                <span>{item.label}</span>
                {isActive && (
                  <motion.span
                    layoutId="nav-active-underline"
                    transition={{ duration: 0.2, ease: TF_EASE }}
                    className="absolute left-0 right-0 -bottom-[21px] h-[2px] bg-[var(--tf-accent)]"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action Zone */}
        <div className="flex items-center gap-2 shrink-0">
          {streak > 0 && (
            <div
              title={`${streak}-day practice streak`}
              className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs font-typing tabular-nums text-[var(--tf-text-muted)] select-none"
            >
              <Flame className="w-3.5 h-3.5 text-[var(--tf-accent)]" strokeWidth={1.9} />
              <span>{streak}d</span>
            </div>
          )}

          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('profile')}
            title={`${displayName || 'Guest'} · Level ${levelInfo.level} (${levelInfo.rankTitle})`}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--tf-accent)] ${
              activePage === 'profile'
                ? 'bg-[var(--tf-surface)] text-[var(--tf-text)] border border-[var(--tf-border)]'
                : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text)] hover:bg-[var(--tf-surface)] border border-transparent'
            }`}
          >
            <User className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span className="max-w-[96px] truncate">{displayName || 'Guest'}</span>
            <span className="text-xs font-typing tabular-nums text-[var(--tf-accent)]">
              Lv.{levelInfo.level}
            </span>
          </motion.button>
        </div>
      </div>

      {/* Compact Mobile Navigation Row */}
      <nav
        aria-label="Mobile Navigation"
        className="flex md:hidden items-center justify-around border-t border-[var(--tf-border)]/50 px-2 py-1.5 text-xs font-medium"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive =
            activePage === item.id ||
            (item.id === 'games' && activePage.startsWith('game:'));
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-md whitespace-nowrap shrink-0 transition-colors ${
                isActive
                  ? 'text-[var(--tf-accent)] bg-[var(--tf-surface)]'
                  : 'text-[var(--tf-text-muted)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
