import { useState, useCallback } from 'react';
import { GameProvider } from './context/GameContext';
import { TitleScreen } from './screens/TitleScreen';
import { RelicSelectScreen } from './screens/RelicSelectScreen';
import { CombatScreen } from './screens/CombatScreen';
import { IntermissionScreen } from './screens/IntermissionScreen';
import { RunSummaryScreen } from './screens/RunSummaryScreen';

export type GameScreen =
    | 'title'
    | 'relic_select'
    | 'combat'
    | 'intermission'
    | 'run_summary';

function App() {
    const [currentScreen, setCurrentScreen] = useState<GameScreen>('title');

    const handleScreenChange = useCallback((screen: GameScreen) => {
        setCurrentScreen(screen);
    }, []);

    return (
        <GameProvider>
            <div className="app-container">
                {currentScreen === 'title' && (
                    <TitleScreen onStart={() => handleScreenChange('relic_select')} />
                )}
                {currentScreen === 'relic_select' && (
                    <RelicSelectScreen onComplete={() => handleScreenChange('combat')} />
                )}
                {currentScreen === 'combat' && (
                    <CombatScreen
                        onWaveComplete={() => handleScreenChange('intermission')}
                        onRunEnd={() => handleScreenChange('run_summary')}
                    />
                )}
                {currentScreen === 'intermission' && (
                    <IntermissionScreen onContinue={() => handleScreenChange('combat')} />
                )}
                {currentScreen === 'run_summary' && (
                    <RunSummaryScreen onRestart={() => handleScreenChange('title')} />
                )}
            </div>
        </GameProvider>
    );
}

export default App;
