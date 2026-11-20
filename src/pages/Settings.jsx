import { motion } from 'motion/react';
import { Settings as SettingsIcon, Palette, Keyboard, SlidersHorizontal } from 'lucide-react';
import { ACCENT_COLORS, TYPING_FONTS, FONT_SIZES } from '../utils/storage.js';
import { TF_EASE } from '../utils/motion.js';

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--tf-accent)] ${
        checked
          ? 'bg-[var(--tf-accent)] border-[var(--tf-accent)]'
          : 'bg-[var(--tf-surface)] border-[var(--tf-border)]'
      }`}
    >
      <motion.span
        layout
        transition={{ duration: 0.16, ease: TF_EASE }}
        className={`inline-block h-4 w-4 rounded-full ${
          checked
            ? 'translate-x-5.5 bg-[var(--tf-accent-fg)]'
            : 'translate-x-1 bg-[var(--tf-text-muted)]'
        }`}
      />
    </button>
  );
}

function SettingRow({ title, description, children }) {
  return (
    <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium text-[var(--tf-text)]">{title}</div>
        {description && (
          <div className="text-xs text-[var(--tf-text-muted)] mt-0.5">{description}</div>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function Settings({ settings, onUpdateSettings }) {
  return (
    <div className="w-full max-w-[820px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-8">
        <div className="flex items-center gap-2.5">
          <SettingsIcon className="w-5 h-5 text-[var(--tf-accent)]" strokeWidth={1.85} />
          <h1 className="text-2xl font-bold tracking-tight text-[var(--tf-text)]">
            Settings
          </h1>
        </div>
        <p className="mt-1 text-sm text-[var(--tf-text-muted)]">
          All preferences save automatically to your browser.
        </p>
      </div>

      {/* Appearance */}
      <section className="pb-8 border-b border-[var(--tf-border)]/70">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--tf-accent)] mb-2">
          <Palette className="w-4 h-4" strokeWidth={1.85} />
          <span>Appearance</span>
        </h2>
        <div className="divide-y divide-[var(--tf-border)]/45">
          <SettingRow title="Theme" description="Switch between dark charcoal and light paper surfaces">
            <div className="inline-flex p-1 rounded-lg bg-[var(--tf-surface)] border border-[var(--tf-border)]/60">
              {['dark', 'light'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onUpdateSettings({ theme: t })}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-medium capitalize cursor-pointer transition-colors ${
                    settings.theme === t
                      ? 'bg-[var(--tf-bg)] text-[var(--tf-accent)]'
                      : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text)]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </SettingRow>

          <SettingRow title="Accent Color" description="Color used for the caret, active tabs, and primary actions">
            <div className="flex items-center gap-2.5">
              {ACCENT_COLORS.map((c) => {
                const active = settings.accentColor === c.id;
                const swatch = settings.theme === 'dark' ? c.dark : c.light;
                return (
                  <motion.button
                    key={c.id}
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    title={c.label}
                    aria-label={c.label}
                    onClick={() => onUpdateSettings({ accentColor: c.id })}
                    className={`w-7 h-7 rounded-full border-2 cursor-pointer transition-transform ${
                      active ? 'scale-110 border-[var(--tf-text)]' : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: swatch }}
                  />
                );
              })}
            </div>
          </SettingRow>

          <SettingRow title="Typing Font" description="Monospace typeface used in the typing workspace">
            <select
              value={settings.fontFamily}
              onChange={(e) => onUpdateSettings({ fontFamily: e.target.value })}
              className="px-3 py-2 rounded-lg bg-[var(--tf-surface)] border border-[var(--tf-border)] text-xs font-medium text-[var(--tf-text)] focus:outline-none focus:border-[var(--tf-accent)] cursor-pointer"
            >
              {TYPING_FONTS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </SettingRow>

          <SettingRow title="Font Size" description="Text scale for words in the typing canvas">
            <div className="inline-flex p-1 rounded-lg bg-[var(--tf-surface)] border border-[var(--tf-border)]/60">
              {FONT_SIZES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onUpdateSettings({ fontSize: s.id })}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                    settings.fontSize === s.id
                      ? 'bg-[var(--tf-bg)] text-[var(--tf-accent)]'
                      : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text)]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </SettingRow>
        </div>
      </section>

      {/* Typing */}
      <section className="py-8 border-b border-[var(--tf-border)]/70">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--tf-accent)] mb-2">
          <Keyboard className="w-4 h-4" strokeWidth={1.85} />
          <span>Typing</span>
        </h2>
        <div className="divide-y divide-[var(--tf-border)]/45">
          <SettingRow title="Default Mode" description="Mode loaded when opening Practice">
            <select
              value={settings.defaultMode}
              onChange={(e) => onUpdateSettings({ defaultMode: e.target.value })}
              className="px-3 py-2 rounded-lg bg-[var(--tf-surface)] border border-[var(--tf-border)] text-xs font-medium text-[var(--tf-text)] focus:outline-none focus:border-[var(--tf-accent)] cursor-pointer"
            >
              <option value="time">Time</option>
              <option value="words">Words</option>
              <option value="quote">Quote</option>
              <option value="custom">Custom</option>
            </select>
          </SettingRow>

          <SettingRow title="Default Duration" description="Countdown length in Time mode">
            <div className="inline-flex p-1 rounded-lg bg-[var(--tf-surface)] border border-[var(--tf-border)]/60">
              {[15, 30, 60, 120].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => onUpdateSettings({ defaultDuration: sec })}
                  className={`px-3 py-1.5 rounded-md text-xs font-typing tabular-nums cursor-pointer transition-colors ${
                    settings.defaultDuration === sec
                      ? 'bg-[var(--tf-bg)] text-[var(--tf-accent)]'
                      : 'text-[var(--tf-text-muted)] hover:text-[var(--tf-text)]'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </SettingRow>

          <SettingRow title="Include Punctuation" description="Capitalization, commas, periods, and quotes by default">
            <ToggleSwitch
              label="Include punctuation by default"
              checked={settings.punctuation}
              onChange={(val) => onUpdateSettings({ punctuation: val })}
            />
          </SettingRow>

          <SettingRow title="Include Numbers" description="Mix numerical values into generated word sets by default">
            <ToggleSwitch
              label="Include numbers by default"
              checked={settings.numbers}
              onChange={(val) => onUpdateSettings({ numbers: val })}
            />
          </SettingRow>

          <SettingRow title="Smooth Caret" description="Glide caret smoothly between characters">
            <ToggleSwitch
              label="Smooth caret animation"
              checked={settings.smoothCaret}
              onChange={(val) => onUpdateSettings({ smoothCaret: val })}
            />
          </SettingRow>

          <SettingRow title="Keystroke Sound Effects" description="Subtle synthesized tactile click and error audio">
            <ToggleSwitch
              label="Sound effects"
              checked={settings.soundEnabled}
              onChange={(val) => onUpdateSettings({ soundEnabled: val })}
            />
          </SettingRow>
        </div>
      </section>

      {/* Behavior */}
      <section className="pt-8">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--tf-accent)] mb-2">
          <SlidersHorizontal className="w-4 h-4" strokeWidth={1.85} />
          <span>Behavior</span>
        </h2>
        <div className="divide-y divide-[var(--tf-border)]/45">
          <SettingRow
            title="Automatic Test Restart"
            description="Automatically start a fresh test 3 seconds after completion"
          >
            <ToggleSwitch
              label="Automatic test restart"
              checked={settings.autoRestart}
              onChange={(val) => onUpdateSettings({ autoRestart: val })}
            />
          </SettingRow>

          <SettingRow title="Show Live WPM" description="Display real-time WPM above the typing area">
            <ToggleSwitch
              label="Show live WPM"
              checked={settings.liveWpm}
              onChange={(val) => onUpdateSettings({ liveWpm: val })}
            />
          </SettingRow>

          <SettingRow title="Show Live Accuracy" description="Display real-time accuracy percentage while typing">
            <ToggleSwitch
              label="Show live accuracy"
              checked={settings.liveAccuracy}
              onChange={(val) => onUpdateSettings({ liveAccuracy: val })}
            />
          </SettingRow>

          <div className="pt-6">
            <div className="text-sm font-medium text-[var(--tf-text)] mb-3">Keyboard Shortcuts</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[var(--tf-text-muted)]">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--tf-surface)]/50 border border-[var(--tf-border)]/50">
                <span>Restart active test</span>
                <kbd className="px-2 py-0.5 rounded bg-[var(--tf-bg)] border border-[var(--tf-border)] font-typing text-[var(--tf-text)]">
                  Tab
                </kbd>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--tf-surface)]/50 border border-[var(--tf-border)]/50">
                <span> Unfocus</span>
                <kbd className="px-2 py-0.5 rounded bg-[var(--tf-bg)] border border-[var(--tf-border)] font-typing text-[var(--tf-text)]">
                  Esc
                </kbd>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--tf-surface)]/50 border border-[var(--tf-border)]/50">
                <span>Delete whole word</span>
                <kbd className="px-2 py-0.5 rounded bg-[var(--tf-bg)] border border-[var(--tf-border)] font-typing text-[var(--tf-text)]">
                  Ctrl + Backspace
                </kbd>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--tf-surface)]/50 border border-[var(--tf-border)]/50">
                <span>Start selected game</span>
                <kbd className="px-2 py-0.5 rounded bg-[var(--tf-bg)] border border-[var(--tf-border)] font-typing text-[var(--tf-text)]">
                  Enter
                </kbd>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
