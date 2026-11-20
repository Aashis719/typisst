import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import Navbar from './components/Navbar.jsx';
import ShortcutHelpModal from './components/ShortcutHelpModal.jsx';
import ToastContainer from './components/Toast.jsx';
import Home from './pages/Home.jsx';
import Games from './pages/Games.jsx';
import GamePlay from './pages/GamePlay.jsx';
import Statistics from './pages/Statistics.jsx';
import Settings from './pages/Settings.jsx';
import Profile from './pages/Profile.jsx';
import NotFound from './pages/NotFound.jsx';
import {
  ACCENT_COLORS,
  loadSettings,
  saveSettings,
  loadHistory,
  saveHistory,
  loadProfile,
  saveProfile,
  getRecordKey,
  clearAllStats,
} from './utils/storage.js';
import {
  calculateTestXp,
  calculateGameXp,
  computeNextStreak,
  evaluateAchievements,
  getLevelInfo,
} from './utils/gamification.js';
import { pageVariants } from './utils/motion.js';

function readPathRoute() {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');

  if (!path || path === 'practice') return 'practice';

  const validRoutes = [
    'practice',
    'games',
    'statistics',
    'settings',
    'profile',
  ];

  if (validRoutes.includes(path) || path.startsWith('game:')) {
    return path;
  }

  return 'not-found';
}

export default function App() {
const [activePage, setActivePage] = useState(readPathRoute);
  const [settings, setSettings] = useState(loadSettings);
  const [history, setHistory] = useState(loadHistory);
  const [profile, setProfile] = useState(loadProfile);
  const [isTypingActive, setIsTypingActive] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(1);

  const pushToast = useCallback((toast) => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev.slice(-3), { id, ...toast }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const navigate = useCallback((route) => {
    const validRoutes = [
      'practice',
      'games',
      'statistics',
      'settings',
      'profile',
    ];

    const isValid = validRoutes.includes(route) || route.startsWith('game:');
    const destination = isValid ? route : 'not-found';

    setActivePage(destination);
    setIsTypingActive(false);

    const path = destination === 'not-found'
      ? '/404'
      : destination.startsWith('game:')
      ? `/${destination}`
      : `/${destination}`;

    window.history.pushState({}, '', path);
  }, []);

  useEffect(() => {
  const onPopState = () => {
    setActivePage(readPathRoute());
    setIsTypingActive(false);
  };

  window.addEventListener('popstate', onPopState);

  return () => {
    window.removeEventListener('popstate', onPopState);
  };
}, []);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    const accent = ACCENT_COLORS.find((c) => c.id === settings.accentColor) || ACCENT_COLORS[0];
    root.style.setProperty('--tf-accent', settings.theme === 'dark' ? accent.dark : accent.light);
  }, [settings.theme, settings.accentColor]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === '1') {
          e.preventDefault();
          navigate('practice');
        } else if (e.key === '2') {
          e.preventDefault();
          navigate('games');
        } else if (e.key === '3') {
          e.preventDefault();
          navigate('statistics');
        } else if (e.key === '4') {
          e.preventDefault();
          navigate('settings');
        }
      }
      if (e.key === '?' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && shortcutsOpen) {
        setShortcutsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navigate, shortcutsOpen]);

  const handleUpdateSettings = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const handleToggleTheme = useCallback(() => {
    handleUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  }, [handleUpdateSettings, settings.theme]);

  const handleSaveTestResult = useCallback(
    (result, precomputedXp, isNewBestFlag) => {
      const nextHistory = [result, ...history];
      setHistory(nextHistory);
      saveHistory(nextHistory);

      const gainedXp = precomputedXp ?? calculateTestXp(result);

      setProfile((prev) => {
        const oldLevel = getLevelInfo(prev.xp || 0).level;
        const nextXp = (prev.xp || 0) + gainedXp;
        const newLevelInfo = getLevelInfo(nextXp);
        const streakInfo = computeNextStreak(prev);

        const recKey = getRecordKey(result.mode, result.subValue);
        const existing = prev.personalBests?.[recKey];
        const shouldUpdateBest = !existing || result.wpm > existing.wpm;

        const candidateProfile = {
          ...prev,
          xp: nextXp,
          streak: streakInfo.streak,
          lastActiveDate: streakInfo.lastActiveDate,
          personalBests: shouldUpdateBest
            ? {
                ...(prev.personalBests || {}),
                [recKey]: {
                  wpm: result.wpm,
                  accuracy: result.accuracy,
                  consistency: result.consistency,
                  timestamp: result.timestamp,
                },
              }
            : prev.personalBests || {},
        };

        const { unlockedAchievements, newlyUnlocked } = evaluateAchievements({
          profile: candidateProfile,
          history: nextHistory,
          latestTest: result,
        });

        const updated = {
          ...candidateProfile,
          unlockedAchievements,
        };
        saveProfile(updated);

        if (isNewBestFlag && existing) {
          pushToast({
            type: 'record',
            title: 'New Personal Best',
            message: `${result.wpm} WPM in ${result.mode} (${result.subValue})`,
          });
        }
        if (newLevelInfo.level > oldLevel) {
          pushToast({
            type: 'level',
            title: `Reached Level ${newLevelInfo.level}`,
            message: `Rank: ${newLevelInfo.rankTitle}`,
          });
        }
        for (const ach of newlyUnlocked.slice(0, 2)) {
          pushToast({
            type: 'achievement',
            title: `Milestone: ${ach.title}`,
            message: ach.description,
          });
        }

        return updated;
      });
    },
    [history, pushToast]
  );

  const handleSaveGameRecord = useCallback(
    (gameId, difficulty, score) => {
      const gainedXp = calculateGameXp(gameId, score);

      setProfile((prev) => {
        const oldLevel = getLevelInfo(prev.xp || 0).level;
        const nextXp = (prev.xp || 0) + gainedXp;
        const newLevelInfo = getLevelInfo(nextXp);
        const streakInfo = computeNextStreak(prev);

        const prevGame = prev.gameRecords?.[gameId] || {};
        const prevBest = prevGame[difficulty] || 0;
        const isNewBest = score > prevBest;

        const candidateProfile = {
          ...prev,
          xp: nextXp,
          streak: streakInfo.streak,
          lastActiveDate: streakInfo.lastActiveDate,
          gameRecords: isNewBest
            ? {
                ...(prev.gameRecords || {}),
                [gameId]: {
                  ...prevGame,
                  [difficulty]: score,
                },
              }
            : prev.gameRecords || {},
        };

        const { unlockedAchievements, newlyUnlocked } = evaluateAchievements({
          profile: candidateProfile,
          history,
        });

        const updated = { ...candidateProfile, unlockedAchievements };
        saveProfile(updated);

        if (isNewBest && prevBest > 0) {
          pushToast({
            type: 'record',
            title: 'New Game High Score',
            message: `${score} pts (${difficulty})`,
          });
        }
        if (newLevelInfo.level > oldLevel) {
          pushToast({
            type: 'level',
            title: `Reached Level ${newLevelInfo.level}`,
            message: `Rank: ${newLevelInfo.rankTitle}`,
          });
        }
        for (const ach of newlyUnlocked.slice(0, 1)) {
          pushToast({
            type: 'achievement',
            title: `Milestone: ${ach.title}`,
            message: ach.description,
          });
        }

        return updated;
      });
    },
    [history, pushToast]
  );

  const handleSaveDailyChallenge = useCallback(
    (dateKey, record) => {
      const gainedXp = calculateGameXp('daily-challenge', record.score);

      setProfile((prev) => {
        const oldLevel = getLevelInfo(prev.xp || 0).level;
        const nextXp = (prev.xp || 0) + gainedXp;
        const newLevelInfo = getLevelInfo(nextXp);
        const streakInfo = computeNextStreak(prev);

        const existing = prev.dailyChallenges?.[dateKey];
        const shouldUpdate = !existing || record.score > existing.score;

        const candidateProfile = {
          ...prev,
          xp: nextXp,
          streak: streakInfo.streak,
          lastActiveDate: streakInfo.lastActiveDate,
          dailyChallenges: shouldUpdate
            ? {
                ...(prev.dailyChallenges || {}),
                [dateKey]: {
                  score: record.score,
                  wpm: record.wpm,
                  accuracy: record.accuracy,
                  time: record.time,
                },
              }
            : prev.dailyChallenges || {},
        };

        const { unlockedAchievements, newlyUnlocked } = evaluateAchievements({
          profile: candidateProfile,
          history,
        });

        const updated = { ...candidateProfile, unlockedAchievements };
        saveProfile(updated);

        if (newLevelInfo.level > oldLevel) {
          pushToast({
            type: 'level',
            title: `Reached Level ${newLevelInfo.level}`,
            message: `Rank: ${newLevelInfo.rankTitle}`,
          });
        }
        for (const ach of newlyUnlocked.slice(0, 1)) {
          pushToast({
            type: 'achievement',
            title: `Milestone: ${ach.title}`,
            message: ach.description,
          });
        }

        return updated;
      });
    },
    [history, pushToast]
  );

  const handleUpdateDisplayName = useCallback(
    (displayName) => {
      setProfile((prev) => {
        const updated = { ...prev, displayName };
        saveProfile(updated);
        return updated;
      });
      pushToast({
        type: 'info',
        title: 'Profile Updated',
        message: `Display name set to ${displayName}`,
      });
    },
    [pushToast]
  );

  const handleResetAllStats = useCallback(() => {
    const cleared = clearAllStats();
    setHistory(cleared.history);
    setProfile(cleared.profile);
    pushToast({
      type: 'info',
      title: 'Statistics Reset',
      message: 'Local progress and history have been cleared.',
    });
  }, [pushToast]);

  const activeGameId = activePage?.startsWith('game:') ? activePage.slice(5) : null;

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-[var(--tf-bg)] text-[var(--tf-text)]">
        <Navbar
          activePage={activePage}
          onNavigate={navigate}
          theme={settings.theme}
          onToggleTheme={handleToggleTheme}
          displayName={profile.displayName}
          profile={profile}
          isTypingActive={activePage === 'practice' && isTypingActive}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 flex flex-col"
          >
            {activePage === 'practice' && (
              <Home
                settings={settings}
                profile={profile}
                onUpdateSettings={handleUpdateSettings}
                onSaveTestResult={handleSaveTestResult}
                onNavigate={navigate}
                onTypingStateChange={setIsTypingActive}
                onOpenShortcuts={() => setShortcutsOpen(true)}
              />
            )}

            {activePage === 'games' && (
              <Games
                profile={profile}
                onSelectGame={(gameId) => navigate(`game:${gameId}`)}
              />
            )}

            {activeGameId && (
              <GamePlay
                gameId={activeGameId}
                profile={profile}
                soundEnabled={settings.soundEnabled}
                onSaveGameRecord={handleSaveGameRecord}
                onSaveDailyChallenge={handleSaveDailyChallenge}
                onBack={() => navigate('games')}
              />
            )}

            {activePage === 'statistics' && (
              <Statistics
                history={history}
                profile={profile}
                onStartPractice={() => navigate('practice')}
              />
            )}

            {activePage === 'settings' && (
              <Settings settings={settings} onUpdateSettings={handleUpdateSettings} />
            )}

            {activePage === 'profile' && (
              <Profile
                profile={profile}
                history={history}
                onUpdateDisplayName={handleUpdateDisplayName}
                onResetAllStats={handleResetAllStats}
              />
            )}

            {activePage === 'not-found' && (
              <NotFound navigate={navigate} />
            )}
          </motion.div>
        </AnimatePresence>

        <ShortcutHelpModal
          isOpen={shortcutsOpen}
          onClose={() => setShortcutsOpen(false)}
        />

        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    </MotionConfig>
  );
}
