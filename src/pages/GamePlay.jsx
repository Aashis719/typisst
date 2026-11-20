import FallingWordsGame from '../components/games/FallingWordsGame.jsx';
import WordSprintGame from '../components/games/WordSprintGame.jsx';
import SurvivalModeGame from '../components/games/SurvivalModeGame.jsx';
import AccuracyChallengeGame from '../components/games/AccuracyChallengeGame.jsx';
import DailyChallengeGame from '../components/games/DailyChallengeGame.jsx';
import { getTodayKey } from '../data/challenges.js';

export default function GamePlay({
  gameId,
  profile,
  soundEnabled,
  onSaveGameRecord,
  onSaveDailyChallenge,
  onBack,
}) {
  const gameRecords = profile?.gameRecords?.[gameId] || {};
  const todayDaily = profile?.dailyChallenges?.[getTodayKey()] || null;

  return (
    <div className="w-full max-w-[1040px] mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {gameId === 'falling-words' && (
        <FallingWordsGame
          bestScores={gameRecords}
          soundEnabled={soundEnabled}
          onSaveRecord={onSaveGameRecord}
          onBack={onBack}
        />
      )}
      {gameId === 'word-sprint' && (
        <WordSprintGame
          bestScores={gameRecords}
          soundEnabled={soundEnabled}
          onSaveRecord={onSaveGameRecord}
          onBack={onBack}
        />
      )}
      {gameId === 'survival-mode' && (
        <SurvivalModeGame
          bestScores={gameRecords}
          soundEnabled={soundEnabled}
          onSaveRecord={onSaveGameRecord}
          onBack={onBack}
        />
      )}
      {gameId === 'accuracy-challenge' && (
        <AccuracyChallengeGame
          bestScores={gameRecords}
          soundEnabled={soundEnabled}
          onSaveRecord={onSaveGameRecord}
          onBack={onBack}
        />
      )}
      {gameId === 'daily-challenge' && (
        <DailyChallengeGame
          dailyRecord={todayDaily}
          soundEnabled={soundEnabled}
          onSaveDaily={onSaveDailyChallenge}
          onBack={onBack}
        />
      )}
    </div>
  );
}
