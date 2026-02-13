import { useState } from 'react';
import { useGame } from '../context/GameContext';
import './IntermissionScreen.css';

interface IntermissionScreenProps {
    onContinue: () => void;
}

const SAMPLE_PERKS = [
    { id: 'perk_glass_cannon', name: 'Glass Cannon', description: '+25% ATK, -15% Max HP', rarity: 'rare' },
    { id: 'perk_thick_skin', name: 'Thick Skin', description: '+10 Armor', rarity: 'common' },
    { id: 'perk_bloodthirst', name: 'Bloodthirst', description: '+8% Lifesteal', rarity: 'rare' },
];

const SAMPLE_ITEMS = [
    { id: 'wpn_crimson_edge', name: 'Crimson Edge', description: '+12 ATK, applies Bleed', slot: 'weapon', rarity: 'rare' },
    { id: 'arm_shadow_cloak', name: 'Shadow Cloak', description: '+5 Armor, +8% Evasion', slot: 'armor', rarity: 'rare' },
    { id: 'trn_haste_charm', name: 'Haste Charm', description: '+15% Attack Speed', slot: 'trinket', rarity: 'rare' },
];

type IntermissionTab = 'skills' | 'perks' | 'items';

export function IntermissionScreen({ onContinue }: IntermissionScreenProps) {
    const { state, dispatch } = useGame();
    const [activeTab, setActiveTab] = useState<IntermissionTab>('perks');
    const [selectedPerk, setSelectedPerk] = useState<string | null>(null);
    const [selectedItem, setSelectedItem] = useState<string | null>(null);

    const player = state.run?.player;
    const waveNumber = state.run?.currentWave ?? 1;

    const handleConfirm = () => {
        if (activeTab === 'perks' && selectedPerk) {
            dispatch({ type: 'SELECT_PERK', perkId: selectedPerk });
        } else if (activeTab === 'items' && selectedItem) {
            dispatch({ type: 'SELECT_ITEM', itemId: selectedItem });
        }
        dispatch({ type: 'ADVANCE_WAVE' });
        onContinue();
    };

    return (
        <div className="intermission-screen">
            <div className="intermission-header">
                <div className="wave-complete">
                    <span className="complete-icon">✓</span>
                    <span>Wave {waveNumber} Complete!</span>
                </div>
                <div className="player-stats">
                    <span className="stat">💰 {player?.gold ?? 0}</span>
                    <span className="stat">⭐ Level {player?.level ?? 1}</span>
                    <span className="stat">🎯 {player?.skillPoints ?? 0} Skill Points</span>
                </div>
            </div>

            <div className="intermission-tabs">
                <button
                    className={`tab ${activeTab === 'skills' ? 'active' : ''}`}
                    onClick={() => setActiveTab('skills')}
                >
                    📊 Skill Tree
                </button>
                <button
                    className={`tab ${activeTab === 'perks' ? 'active' : ''}`}
                    onClick={() => setActiveTab('perks')}
                >
                    ⚡ Perks
                </button>
                <button
                    className={`tab ${activeTab === 'items' ? 'active' : ''}`}
                    onClick={() => setActiveTab('items')}
                >
                    🎁 Items
                </button>
            </div>

            <div className="intermission-content">
                {activeTab === 'skills' && (
                    <div className="skills-panel">
                        <h3>Skill Tree</h3>
                        <div className="skill-points-display">
                            <span className="skill-points-icon">🎯</span>
                            <span className="skill-points-count">
                                {player?.skillPoints ?? 0} Skill Points Available
                            </span>
                        </div>
                        <div className="skill-branches">
                            <div
                                className={`skill-branch blade-dance ${(player?.skillPoints ?? 0) > 0 ? 'can-allocate' : ''}`}
                                onClick={() => (player?.skillPoints ?? 0) > 0 && dispatch({ type: 'ALLOCATE_SKILL', skillId: 'blade_dance' })}
                            >
                                <h4>⚔️ Blade Dance</h4>
                                <p>Attack Speed & Critical Strikes</p>
                                <div className="skill-allocated">
                                    Points: {player?.allocatedSkills?.['blade_dance'] ?? 0}/5
                                </div>
                            </div>
                            <div
                                className={`skill-branch bloodcraft ${(player?.skillPoints ?? 0) > 0 ? 'can-allocate' : ''}`}
                                onClick={() => (player?.skillPoints ?? 0) > 0 && dispatch({ type: 'ALLOCATE_SKILL', skillId: 'bloodcraft' })}
                            >
                                <h4>🩸 Bloodcraft</h4>
                                <p>Bleed & DoT Effects</p>
                                <div className="skill-allocated">
                                    Points: {player?.allocatedSkills?.['bloodcraft'] ?? 0}/5
                                </div>
                            </div>
                            <div
                                className={`skill-branch iron-veil ${(player?.skillPoints ?? 0) > 0 ? 'can-allocate' : ''}`}
                                onClick={() => (player?.skillPoints ?? 0) > 0 && dispatch({ type: 'ALLOCATE_SKILL', skillId: 'iron_veil' })}
                            >
                                <h4>🛡️ Iron Veil</h4>
                                <p>Defense & Survivability</p>
                                <div className="skill-allocated">
                                    Points: {player?.allocatedSkills?.['iron_veil'] ?? 0}/5
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'perks' && (
                    <div className="perks-panel">
                        <h3>Choose a Perk</h3>
                        <div className="perk-cards">
                            {SAMPLE_PERKS.map((perk) => (
                                <button
                                    key={perk.id}
                                    className={`perk-card rarity-${perk.rarity} ${selectedPerk === perk.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedPerk(perk.id)}
                                >
                                    <span className="perk-name">{perk.name}</span>
                                    <span className="perk-desc">{perk.description}</span>
                                    <span className={`perk-rarity rarity-${perk.rarity}`}>{perk.rarity}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'items' && (
                    <div className="items-panel">
                        <h3>Choose an Item</h3>
                        <div className="item-cards">
                            {SAMPLE_ITEMS.map((item) => (
                                <button
                                    key={item.id}
                                    className={`item-card rarity-${item.rarity} ${selectedItem === item.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedItem(item.id)}
                                >
                                    <span className="item-slot">{item.slot}</span>
                                    <span className="item-name">{item.name}</span>
                                    <span className="item-desc">{item.description}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <button className="btn btn-primary btn-large continue-btn" onClick={handleConfirm}>
                Continue to Wave {waveNumber + 1}
            </button>
        </div>
    );
}
