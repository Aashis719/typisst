export const ACCENT_COLORS = [
  { id: 'gold', label: 'Warm Gold', dark: '#e2b714', light: '#c99a06' },
  { id: 'amber', label: 'Ember', dark: '#f59e0b', light: '#d97706' },
  { id: 'emerald', label: 'Sage Mint', dark: '#34d399', light: '#059669' },
  { id: 'sky', label: 'Sky Blue', dark: '#38bdf8', light: '#0284c7' },
  { id: 'coral', label: 'Coral', dark: '#fb7185', light: '#e11d48' },
];

export const TYPING_FONTS = [
  { id: 'JetBrains Mono', label: 'JetBrains Mono', stack: '"JetBrains Mono", ui-monospace, monospace' },
  { id: 'IBM Plex Mono', label: 'IBM Plex Mono', stack: '"IBM Plex Mono", ui-monospace, monospace' },
  { id: 'Fira Code', label: 'Fira Code', stack: '"Fira Code", ui-monospace, monospace' },
  { id: 'Roboto Mono', label: 'Roboto Mono', stack: '"Roboto Mono", ui-monospace, monospace' },
];

export const FONT_SIZES = [
  { id: 'sm', label: 'Compact', px: '1.375rem', lineHeight: '2.25rem' },
  { id: 'md', label: 'Balanced', px: '1.625rem', lineHeight: '2.65rem' },
  { id: 'lg', label: 'Large', px: '1.95rem', lineHeight: '3.1rem' },
];

export const DEFAULT_SETTINGS = {
  theme: 'dark',
  accentColor: 'gold',
  fontFamily: 'JetBrains Mono',
  fontSize: 'md',
  defaultMode: 'time',
  defaultDuration: 30,
  defaultWordCount: 25,
  quoteLength: 'all',
  language: 'english',
  punctuation: false,
  numbers: false,
  smoothCaret: true,
  soundEnabled: false,
  autoRestart: false,
  liveWpm: true,
  liveAccuracy: true,
  customText:
    'Precision comes from relaxed focus and steady rhythm. Type cleanly first, and speed will follow naturally.',
};

export const DEFAULT_PROFILE = {
  displayName: 'Guest Typist',
  createdAt: new Date().toISOString(),
  xp: 0,
  streak: 0,
  lastActiveDate: null,
  unlockedAchievements: [],
  personalBests: {},
  gameRecords: {},
  dailyChallenges: {},
};

const KEYS = {
  SETTINGS: 'typeflow_settings_v1',
  HISTORY: 'typeflow_history_v1',
  PROFILE: 'typeflow_profile_v1',
};

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch {
    // Ignore storage quota issues
  }
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem(KEYS.HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(history) {
  try {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history.slice(0, 500)));
  } catch {
    // Ignore storage quota issues
  }
}

export function loadProfile() {
  try {
    const raw = localStorage.getItem(KEYS.PROFILE);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  } catch {
    // Ignore storage quota issues
  }
}

export function getRecordKey(mode, subValue) {
  return `${mode}:${subValue}`;
}

export function clearAllStats() {
  try {
    localStorage.removeItem(KEYS.HISTORY);
    const currentProfile = loadProfile();
    const resetProfile = {
      ...DEFAULT_PROFILE,
      displayName: currentProfile.displayName || 'Guest Typist',
      createdAt: currentProfile.createdAt || new Date().toISOString(),
    };
    saveProfile(resetProfile);
    return { history: [], profile: resetProfile };
  } catch {
    return { history: [], profile: DEFAULT_PROFILE };
  }
}
