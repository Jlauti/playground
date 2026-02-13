import { useState } from 'react';
import { useGame } from '../context/GameContext';
import './RelicSelectScreen.css';

interface RelicSelectScreenProps {
    onComplete: () => void;
}

const RELICS = [
    {
        id: 'relic_bloodline',
        name: 'Bloodline Legacy',
        description: 'Start with +20% Attack and +10% Lifesteal',
        icon: '🩸',
        color: '#dc2626',
    },
    {
        id: 'relic_iron_fortress',
        name: 'Iron Fortress',
        description: 'Start with +30 Armor and +50 Max HP',
        icon: '🛡️',
        color: '#3b82f6',
    },
    {
        id: 'relic_swift_shadow',
        name: 'Swift Shadow',
        description: 'Start with +25% Attack Speed and +10% Evasion',
        icon: '👤',
        color: '#7c3aed',
    },
];

export function RelicSelectScreen({ onComplete }: RelicSelectScreenProps) {
    const { dispatch } = useGame();
    const [selectedRelic, setSelectedRelic] = useState<string | null>(null);

    const handleSelect = (relicId: string) => {
        setSelectedRelic(relicId);
    };

    const handleConfirm = () => {
        if (!selectedRelic) return;

        // Generate a random seed for this run
        const seed = Math.floor(Math.random() * 0x7fffffff);
        dispatch({ type: 'START_RUN', seed });
        dispatch({ type: 'SELECT_RELIC', relicId: selectedRelic });
        onComplete();
    };

    return (
        <div className="relic-select-screen">
            <div className="relic-content animate-slide-up">
                <h2 className="relic-title">Choose Your Relic</h2>
                <p className="relic-subtitle">
                    Each relic grants unique power for your journey through the Shattered Gate
                </p>

                <div className="relic-cards">
                    {RELICS.map((relic) => (
                        <button
                            key={relic.id}
                            className={`relic-card ${selectedRelic === relic.id ? 'selected' : ''}`}
                            onClick={() => handleSelect(relic.id)}
                            style={{ '--relic-color': relic.color } as React.CSSProperties}
                        >
                            <div className="relic-icon">{relic.icon}</div>
                            <h3 className="relic-name">{relic.name}</h3>
                            <p className="relic-description">{relic.description}</p>
                            {selectedRelic === relic.id && (
                                <div className="relic-selected-indicator">✓ Selected</div>
                            )}
                        </button>
                    ))}
                </div>

                <button
                    className={`btn btn-primary btn-large confirm-button ${!selectedRelic ? 'disabled' : ''}`}
                    onClick={handleConfirm}
                    disabled={!selectedRelic}
                >
                    Begin Run
                </button>
            </div>
        </div>
    );
}
