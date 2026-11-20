import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import TypingControls from '../components/TypingControls.jsx';
import LiveStats from '../components/LiveStats.jsx';
import TypingArea from '../components/TypingArea.jsx';
import ResultPanel from '../components/ResultPanel.jsx';
import { useTypingEngine } from '../hooks/useTypingEngine.js';
import { getRecordKey } from '../utils/storage.js';
import { calculateTestXp } from '../utils/gamification.js';
import { modalBackdropVariants, modalPanelVariants } from '../utils/motion.js';
import { X, Keyboard } from 'lucide-react';

export default function Home({
  settings,
  profile,
  onUpdateSettings,
  onSaveTestResult,
  onNavigate,
  onTypingStateChange,
  onOpenShortcuts,
}) {
  const [mode, setMode] = useState(settings.defaultMode || 'time');
  const [duration, setDuration] = useState(settings.defaultDuration || 30);
  const [wordCount, setWordCount] = useState(settings.defaultWordCount || 25);
  const [quoteLength, setQuoteLength] = useState(settings.quoteLength || 'all');
  const [language, setLanguage] = useState(settings.language || 'english');
  const [customText, setCustomText] = useState(settings.customText || '');
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [draftCustomText, setDraftCustomText] = useState(customText);
  const [lastRecordInfo, setLastRecordInfo] = useState({
    previousBest: null,
    isNewBest: false,
    xpEarned: 0,
  });
  const [autoRestartCountdown, setAutoRestartCountdown] = useState(null);

  const handleTestComplete = (finalResult) => {
    const recKey = getRecordKey(finalResult.mode, finalResult.subValue);
    const prevBest = profile?.personalBests?.[recKey]?.wpm ?? null;
    const isNewBest = prevBest === null || finalResult.wpm > prevBest;
    const xpEarned = calculateTestXp(finalResult);
    setLastRecordInfo({ previousBest: prevBest, isNewBest, xpEarned });
    onSaveTestResult(finalResult, xpEarned, isNewBest);
  };

  const engine = useTypingEngine({
    mode,
    duration,
    wordCount,
    quoteLength,
    language,
    punctuation: false,
    numbers: false,
    customText,
    soundEnabled: settings.soundEnabled,
    onTestComplete: handleTestComplete,
  });

  useEffect(() => {
    if (onTypingStateChange) {
      onTypingStateChange(engine.status === 'running');
    }
  }, [engine.status, onTypingStateChange]);

  useEffect(() => {
    if (engine.status !== 'finished' || !settings.autoRestart) {
      setAutoRestartCountdown(null);
      return;
    }
    setAutoRestartCountdown(3);
    const interval = setInterval(() => {
      setAutoRestartCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          engine.restartTest(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.status, settings.autoRestart]);

  useEffect(() => {
    if (engine.status !== 'finished') return;
    const onKey = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        setAutoRestartCountdown(null);
        engine.restartTest(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.status]);

  const handleModeChange = (nextMode) => {
    setMode(nextMode);
    if (nextMode === 'custom' && !customText.trim()) {
      setDraftCustomText(customText);
      setCustomModalOpen(true);
    }
  };

  const saveCustomModal = (e) => {
    e.preventDefault();
    const trimmed = draftCustomText.trim();
    if (trimmed) {
      setCustomText(trimmed);
      onUpdateSettings({ customText: trimmed });
    }
    setCustomModalOpen(false);
  };

  return (
    <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 flex-1 flex flex-col justify-between py-4 sm:py-8">
      <div className="pt-1">
        <TypingControls
          mode={mode}
          duration={duration}
          wordCount={wordCount}
          quoteLength={quoteLength}
          language={language}
          onChangeMode={handleModeChange}
          onChangeDuration={setDuration}
          onChangeWordCount={setWordCount}
          onChangeQuoteLength={setQuoteLength}
          onChangeLanguage={setLanguage}
          onRestart={() => engine.restartTest(false)}
          onOpenCustomEditor={() => {
            setDraftCustomText(customText);
            setCustomModalOpen(true);
          }}
          isDimmed={engine.status === 'running'}
        />
      </div>

      <main className="my-auto py-2 sm:py-4 flex flex-col justify-center">
        {engine.status !== 'finished' ? (
          <div className="w-full max-w-[1120px] mx-auto -translate-y-6 sm:-translate-y-14">
            <LiveStats
              mode={mode}
              status={engine.status}
              remainingSeconds={engine.remainingSeconds}
              elapsedSeconds={engine.elapsedSeconds}
              currentWordIndex={engine.currentWordIndex}
              totalWords={engine.words.length}
              liveWpm={engine.liveWpm}
              liveAccuracy={engine.liveAccuracy}
              showLiveWpm={settings.liveWpm}
              showLiveAccuracy={settings.liveAccuracy}
            />
            <div className="mt-2">
              <TypingArea
                words={engine.words}
                typedWords={engine.typedWords}
                currentWordIndex={engine.currentWordIndex}
                status={engine.status}
                mode={mode}
                language={language}
                quoteMeta={engine.quoteMeta}
                fontFamily={settings.fontFamily}
                fontSize={settings.fontSize}
                smoothCaret={settings.smoothCaret}
                onInputChar={engine.processInputChar}
                onBackspace={engine.handleBackspace}
                onRestart={() => engine.restartTest(false)}
                onFinishZen={engine.finishZenTest}
                modalOpen={customModalOpen}
              />
            </div>
          </div>
        ) : (
          <div>
            {autoRestartCountdown !== null && (
              <div className="mb-4 flex items-center justify-center gap-3 text-xs font-typing text-[var(--tf-text-muted)]">
                <span>Next test starting in {autoRestartCountdown}s</span>
                <button
                  type="button"
                  onClick={() => setAutoRestartCountdown(null)}
                  className="text-[var(--tf-accent)] hover:underline cursor-pointer"
                >
                  Hold results
                </button>
              </div>
            )}
            <ResultPanel
              result={engine.result}
              previousBest={lastRecordInfo.previousBest}
              isNewBest={lastRecordInfo.isNewBest}
              xpEarned={lastRecordInfo.xpEarned}
              totalXp={profile?.xp || 0}
              onNextTest={() => {
                setAutoRestartCountdown(null);
                engine.restartTest(false);
              }}
              onRestartSame={() => {
                setAutoRestartCountdown(null);
                engine.restartTest(true);
              }}
              onViewStats={() => onNavigate('statistics')}
            />
          </div>
        )}
      </main>

      <footer
        className={`pb-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[var(--tf-text-muted)] transition-opacity duration-200 ${
          engine.status === 'running' ? 'opacity-20' : 'opacity-85'
        }`}
      >
        <span className="inline-flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--tf-surface)] border border-[var(--tf-border)] font-typing text-[11px] text-[var(--tf-text)]">
            tab
          </kbd>
          <span>restart test</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-[var(--tf-surface)] border border-[var(--tf-border)] font-typing text-[11px] text-[var(--tf-text)]">
            esc
          </kbd>
          <span>{mode === 'zen' ? 'finish zen' : 'unfocus'}</span>
        </span>
        <button
          type="button"
          onClick={onOpenShortcuts}
          className="inline-flex items-center gap-1.5 hover:text-[var(--tf-text)] transition-colors cursor-pointer"
        >
          <Keyboard className="w-3.5 h-3.5" strokeWidth={1.75} />
          <span>shortcuts (?)</span>
        </button>
      </footer>

      {/* Custom Text Modal */}
      <AnimatePresence>
        {customModalOpen && (
          <motion.div
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4"
            onClick={() => setCustomModalOpen(false)}
          >
            <motion.form
              variants={modalPanelVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onSubmit={saveCustomModal}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-xl bg-[var(--tf-bg)] border border-[var(--tf-border)] p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-[var(--tf-text)]">
                  Custom Practice Text
                </h2>
                <button
                  type="button"
                  onClick={() => setCustomModalOpen(false)}
                  aria-label="Close custom text modal"
                  className="p-1 rounded-md text-[var(--tf-text-muted)] hover:text-[var(--tf-text)] cursor-pointer"
                >
                  <X className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </div>
              <p className="text-xs text-[var(--tf-text-muted)] mb-3">
                Paste or write any paragraph, code snippet, or study notes you want to practice typing.
              </p>
              <textarea
                rows={5}
                value={draftCustomText}
                onChange={(e) => setDraftCustomText(e.target.value)}
                placeholder="Enter custom typing text..."
                className="w-full rounded-lg bg-[var(--tf-surface)] border border-[var(--tf-border)] p-3 font-typing text-sm text-[var(--tf-text)] focus:outline-none focus:border-[var(--tf-accent)]"
              />
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCustomModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[var(--tf-text-muted)] hover:text-[var(--tf-text)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[var(--tf-accent)] text-[var(--tf-accent-fg)] text-xs font-semibold hover:opacity-90 cursor-pointer"
                >
                  Apply Text
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
