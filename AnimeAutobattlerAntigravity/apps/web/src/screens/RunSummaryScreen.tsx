import { useGame } from '../context/GameContext';
import './RunSummaryScreen.css';

interface RunSummaryScreenProps {
    onRestart: () => void;
}

export function RunSummaryScreen({ onRestart }: RunSummaryScreenProps) {
    const { state, dispatch } = useGame();
    const run = state.run;

    const isVictory = run?.isVictory ?? false;
    const wavesCleared = run?.completedWaves.length ?? 0;
    const duration = run ? (run.endTime ?? Date.now()) - run.startTime : 0;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    const handleRestart = () => {
        dispatch({ type: 'RESET' });
        onRestart();
    };

    return (
        <div className={`run-summary-screen ${isVictory ? 'victory' : 'defeat'}`}>
            <div className="summary-content animate-slide-up">
                <div className="summary-result">
                    <span className="result-icon">{isVictory ? '🏆' : '💀'}</span>
                    <h1 className="result-title">{isVictory ? 'Victory!' : 'Defeat'}</h1>
                    <p className="result-subtitle">
                        {isVictory
                            ? 'The Kurogane Warden has fallen!'
                            : 'Your journey ends at the Shattered Gate...'}
                    </p>
                </div>

                <div className="summary-stats">
                    <div className="stat-row">
                        <span className="stat-label">Waves Cleared</span>
                        <span className="stat-value">{wavesCleared} / 10</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">Final Level</span>
                        <span className="stat-value">{run?.player.level ?? 1}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">Gold Earned</span>
                        <span className="stat-value">💰 {run?.totalGoldEarned ?? 0}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">XP Earned</span>
                        <span className="stat-value">⭐ {run?.totalXpEarned ?? 0}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">Items Found</span>
                        <span className="stat-value">{run?.itemsCollected.length ?? 0}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">Perks Chosen</span>
                        <span className="stat-value">{run?.perksSelected.length ?? 0}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">Run Duration</span>
                        <span className="stat-value">{minutes}:{seconds.toString().padStart(2, '0')}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">Seed</span>
                        <span className="stat-value seed">{run?.seed ?? 0}</span>
                    </div>
                </div>

                <button className="btn btn-primary btn-large restart-btn" onClick={handleRestart}>
                    Try Again
                </button>
            </div>
        </div>
    );
}
