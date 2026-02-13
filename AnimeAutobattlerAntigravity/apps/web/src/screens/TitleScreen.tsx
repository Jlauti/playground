import './TitleScreen.css';

interface TitleScreenProps {
    onStart: () => void;
}

export function TitleScreen({ onStart }: TitleScreenProps) {
    return (
        <div className="title-screen">
            <div className="title-content animate-fade-in">
                <div className="title-logo">
                    <h1 className="title-text">
                        <span className="title-anime">Anime</span>
                        <span className="title-auto">Auto</span>
                        <span className="title-battler">Battler</span>
                    </h1>
                    <p className="title-subtitle">Shattered Gate</p>
                </div>

                <div className="title-tagline">
                    Wave Roguelite • Data-Driven • Deterministic Combat
                </div>

                <button className="btn btn-primary btn-large start-button" onClick={onStart}>
                    <span>Begin Your Journey</span>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </button>

                <div className="title-info">
                    <div className="info-item">
                        <span className="info-icon">⚔️</span>
                        <span>10 Waves + Boss</span>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">🎯</span>
                        <span>3 Skill Branches</span>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">💎</span>
                        <span>30+ Items</span>
                    </div>
                </div>
            </div>

            <div className="title-background">
                <div className="bg-orb orb-1"></div>
                <div className="bg-orb orb-2"></div>
                <div className="bg-orb orb-3"></div>
            </div>
        </div>
    );
}
