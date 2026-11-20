import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="flex items-center justify-center w-9 h-9 rounded-lg text-[var(--tf-text-muted)] hover:text-[var(--tf-text)] hover:bg-[var(--tf-surface)] transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-[var(--tf-accent)]"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
