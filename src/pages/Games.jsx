import { useState, useRef, useEffect } from 'react';
import { Gamepad2, Calendar, Trophy } from 'lucide-react';
import GameCard, { FeaturedGamePanel } from '../components/GameCard.jsx';
import { GAMES_META } from '../utils/gameLogic.js';
import { getTodayKey } from '../data/challenges.js';

const GAME_SUBTITLE_META = {
  'word-sprint': 'Speed Queue · 20–50 Words',
  'survival-mode': 'Endurance · 3 Lives · 5 Tiers',
  'accuracy-challenge': 'Precision · Rank S–D',
  'daily-challenge': 'Shared Passage',
};

export default function Games({ profile, onSelectGame }) {
  const todayKey = getTodayKey();
  const [launchingId, setLaunchingId] = useState(null);
  const launchTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (launchTimerRef.current) clearTimeout(launchTimerRef.current);
    };
  }, []);

  const handleLaunchGame = (gameId) => {
    if (launchingId) return;
    setLaunchingId(gameId);
    launchTimerRef.current = setTimeout(() => {
      setLaunchingId(null);
      onSelectGame(gameId);
    }, 110);
  };

  const getBestForGame = (gameId) => {
    if (gameId === 'daily-challenge') {
      const rec = profile?.dailyChallenges?.[todayKey];
      return rec ? `${rec.score} (${rec.wpm} wpm)` : null;
    }
    const records = profile?.gameRecords?.[gameId];
    if (!records) return null;
    const vals = Object.values(records).filter((v) => typeof v === 'number');
    if (vals.length === 0) return null;
    return Math.max(...vals);
  };

  const fallingWordsGame = GAMES_META.find((g) => g.id === 'falling-words');
  const wordSprintGame = GAMES_META.find((g) => g.id === 'word-sprint');
  const survivalGame = GAMES_META.find((g) => g.id === 'survival-mode');
  const accuracyGame = GAMES_META.find((g) => g.id === 'accuracy-challenge');
  const dailyGame = GAMES_META.find((g) => g.id === 'daily-challenge');

  const todayRecord = profile?.dailyChallenges?.[todayKey];
  const recordedGamesCount =
    GAMES_META.filter((g) => getBestForGame(g.id) !== null).length;

  return (
    <div className="w-full max-w-[1040px] mx-auto px-4 sm:px-6 py-8 sm:py-11">
      {/* Refined Editorial Header */}
      <div className="mb-8 pb-6 border-b border-[var(--tf-border)]/55 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--tf-text-muted)] font-typing">
            <Gamepad2 className="w-3.5 h-3.5 text-[var(--tf-accent)]" strokeWidth={1.85} />
            <span>Interactive Arcade</span>
            <span aria-hidden="true">·</span>
            <span>5 Modes</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[var(--tf-text)]">
            Typing Games
          </h1>
          <p className="mt-1.5 text-sm text-[var(--tf-text-muted)] max-w-xl">
            Focused mechanical challenges built to train reaction speed, rhythm, and keystroke accuracy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-typing tabular-nums text-[var(--tf-text-muted)] shrink-0">
          <span className="inline-flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-[var(--tf-accent)]" strokeWidth={1.75} />
            <span>{recordedGamesCount}/5 records set</span>
          </span>
          <span aria-hidden="true" className="text-[var(--tf-border)]">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" strokeWidth={1.75} />
            <span>{todayKey}</span>
          </span>
        </div>
      </div>

      {/* Primary Featured Game: Falling Words */}
      {fallingWordsGame && (
        <div className="mb-5">
          <FeaturedGamePanel
            game={fallingWordsGame}
            bestRecord={getBestForGame(fallingWordsGame.id)}
            isLaunching={launchingId === fallingWordsGame.id}
            onPlay={handleLaunchGame}
          />
        </div>
      )}

      {/* Asymmetric Editorial Grid for Remaining 4 Games */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {wordSprintGame && (
          <div className="lg:col-span-7 flex">
            <GameCard
              game={wordSprintGame}
              bestRecord={getBestForGame(wordSprintGame.id)}
              isWide
              subtitleMeta={GAME_SUBTITLE_META[wordSprintGame.id]}
              isLaunching={launchingId === wordSprintGame.id}
              onPlay={handleLaunchGame}
            />
          </div>
        )}

        {survivalGame && (
          <div className="lg:col-span-5 flex">
            <GameCard
              game={survivalGame}
              bestRecord={getBestForGame(survivalGame.id)}
              subtitleMeta={GAME_SUBTITLE_META[survivalGame.id]}
              isLaunching={launchingId === survivalGame.id}
              onPlay={handleLaunchGame}
            />
          </div>
        )}

        {accuracyGame && (
          <div className="lg:col-span-5 flex">
            <GameCard
              game={accuracyGame}
              bestRecord={getBestForGame(accuracyGame.id)}
              subtitleMeta={GAME_SUBTITLE_META[accuracyGame.id]}
              isLaunching={launchingId === accuracyGame.id}
              onPlay={handleLaunchGame}
            />
          </div>
        )}

        {dailyGame && (
          <div className="lg:col-span-7 flex">
            <GameCard
              game={dailyGame}
              bestRecord={getBestForGame(dailyGame.id)}
              isWide
              isCompletedToday={Boolean(todayRecord)}
              subtitleMeta={`${GAME_SUBTITLE_META[dailyGame.id]} · ${todayKey}`}
              isLaunching={launchingId === dailyGame.id}
              onPlay={handleLaunchGame}
            />
          </div>
        )}
      </div>
    </div>
  );
}
