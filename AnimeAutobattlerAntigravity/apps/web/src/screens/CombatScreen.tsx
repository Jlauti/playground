import { useEffect, useRef, useState, useCallback } from 'react';
import { useGame } from '../context/GameContext';
import {
    SeededRNG,
    createEnemy,
    simulateTick,
    createKeystoneState,
    DEFAULT_SIM_CONFIG,
    type CombatState,
    type EnemyEntity,
} from '@anime-autobattler/sim';
import './CombatScreen.css';

interface CombatScreenProps {
    onWaveComplete: () => void;
    onRunEnd: () => void;
}

// Create enemy entities for current wave - BALANCED for fun gameplay
function createWaveEnemies(waveNumber: number): EnemyEntity[] {
    const enemies: EnemyEntity[] = [];
    // Start with 1 enemy, add 1 every 3 waves, max 4
    const count = Math.min(1 + Math.floor(waveNumber / 3), 4);

    for (let i = 0; i < count; i++) {
        // Much lower base stats, gentler scaling
        const hp = 20 + waveNumber * 5;  // Was: 30 + wave * 10
        const atk = 3 + waveNumber;       // Was: 5 + wave * 2

        enemies.push(
            createEnemy(
                `enemy_${i}`,
                'shadow_imp',
                `Shadow Imp ${i + 1}`,
                {
                    hp,
                    maxHp: hp,
                    atk,
                    arm: waveNumber,            // Was: 2 + wave
                    attackSpeed: 0.6 + waveNumber * 0.03,  // Slower attacks
                    critChance: 0.03,           // Lower crit
                    critMultiplier: 1.3,        // Lower crit damage
                    pwr: 0,
                    res: 1,
                    cdr: 0,
                    lifesteal: 0,
                    evasion: 0.01,
                },
                { position: { x: 600 + i * 80, y: 250 + i * 40 } }
            )
        );
    }

    return enemies;
}

export function CombatScreen({ onWaveComplete, onRunEnd }: CombatScreenProps) {
    const { state, dispatch } = useGame();
    const [combatLog, setCombatLog] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const combatStateRef = useRef<CombatState | null>(null);
    const rngRef = useRef<SeededRNG | null>(null);
    const keystoneStateRef = useRef(createKeystoneState());

    const waveNumber = state.run?.currentWave ?? 1;

    // Start combat
    const startCombat = useCallback(() => {
        if (!state.run) return;

        const seed = state.run.seed + waveNumber;
        rngRef.current = new SeededRNG(seed);
        keystoneStateRef.current = createKeystoneState();

        // Deep copy the player with all PlayerEntity properties
        const sourcePlayer = state.run.player;
        const player = {
            ...sourcePlayer,
            stats: { ...sourcePlayer.stats },
            baseStats: { ...sourcePlayer.baseStats },
            effects: [...sourcePlayer.effects],
            position: { ...sourcePlayer.position },
            allocatedSkills: { ...sourcePlayer.allocatedSkills },
            perks: [...sourcePlayer.perks],
            items: [...sourcePlayer.items],
            keystones: [...sourcePlayer.keystones],
            attackCooldown: 30, // Initial delay
        };

        const enemies = createWaveEnemies(waveNumber);

        combatStateRef.current = {
            tick: 0,
            player,
            enemies,
            events: [],
            isComplete: false,
            winner: null,
        };

        setCombatLog([`Wave ${waveNumber} begins!`]);
        setIsRunning(true);
    }, [state.run, waveNumber]);

    // Run combat simulation
    useEffect(() => {
        if (!isRunning || !combatStateRef.current || !rngRef.current) return;

        const ticksPerFrame = state.playbackSpeed;

        const interval = setInterval(() => {
            if (state.isPaused) return;

            const combat = combatStateRef.current!;
            const rng = rngRef.current!;

            for (let i = 0; i < ticksPerFrame; i++) {
                if (combat.isComplete) break;

                const events = simulateTick(
                    combat,
                    rng,
                    DEFAULT_SIM_CONFIG,
                    keystoneStateRef.current
                );

                // Process events for combat log and rewards
                for (const event of events) {
                    // Log all event types for debugging
                    console.log('Event received:', event.type, event);

                    if (event.type === 'attack') {
                        const critText = event.isCrit ? ' (CRIT!)' : '';
                        setCombatLog((prev) => [
                            ...prev.slice(-50),
                            `${event.attackerId} hits ${event.targetId} for ${event.damage} dmg${critText}`,
                        ]);
                    } else if (event.type === 'death') {
                        // Award XP and gold when enemy dies
                        const xpReward = 15 + waveNumber * 5;
                        const goldReward = 5 + waveNumber * 2;

                        // Update player stats
                        if (combat.player) {
                            console.log('DEATH EVENT - Before update:', {
                                xp: combat.player.xp,
                                gold: combat.player.gold,
                                level: combat.player.level,
                                skillPoints: combat.player.skillPoints,
                            });

                            combat.player.xp += xpReward;
                            combat.player.gold += goldReward;

                            // Check for level up
                            while (combat.player.xp >= combat.player.xpToNextLevel) {
                                combat.player.xp -= combat.player.xpToNextLevel;
                                combat.player.level++;
                                combat.player.skillPoints++;
                                combat.player.xpToNextLevel = 100 + (combat.player.level - 1) * 50;

                                // Heal on level up and boost stats
                                combat.player.stats.maxHp += 10;
                                combat.player.stats.hp = combat.player.stats.maxHp;
                                combat.player.stats.atk += 2;

                                setCombatLog((prev) => [
                                    ...prev.slice(-50),
                                    `🌟 LEVEL UP! Now level ${combat.player.level}! (+1 Skill Point)`,
                                ]);
                            }

                            console.log('DEATH EVENT - After update:', {
                                xp: combat.player.xp,
                                gold: combat.player.gold,
                                level: combat.player.level,
                                skillPoints: combat.player.skillPoints,
                            });
                        }

                        setCombatLog((prev) => [
                            ...prev.slice(-50),
                            `💀 ${event.entityId} defeated! +${xpReward} XP, +${goldReward} gold`,
                        ]);
                    }
                }
            }

            // Force re-render
            dispatch({
                type: 'UPDATE_COMBAT',
                combatState: { ...combat },
                events: combat.events.slice(-10),
            });

            // Check for combat end
            if (combat.isComplete) {
                setIsRunning(false);

                // Sync player stats (gold, XP, level, skillPoints) back to run state
                dispatch({ type: 'SYNC_PLAYER_STATS', player: combat.player });

                if (combat.winner === 'player') {
                    setCombatLog((prev) => [...prev, '🎉 Victory!']);

                    // Check if this was the boss wave
                    if (waveNumber >= 10) {
                        setTimeout(() => onRunEnd(), 2000);
                    } else {
                        setTimeout(() => {
                            dispatch({ type: 'END_COMBAT', isVictory: true });
                            onWaveComplete();
                        }, 1500);
                    }
                } else {
                    setCombatLog((prev) => [...prev, '💀 Defeat...']);
                    setTimeout(() => {
                        dispatch({ type: 'END_RUN', isVictory: false });
                        onRunEnd();
                    }, 2000);
                }
            }
        }, 1000 / 60);

        return () => clearInterval(interval);
    }, [isRunning, state.playbackSpeed, state.isPaused, dispatch, onWaveComplete, onRunEnd, waveNumber]);

    // Start combat on mount
    useEffect(() => {
        if (state.run && !isRunning && !combatStateRef.current?.isComplete) {
            startCombat();
        }
    }, [state.run, startCombat, isRunning]);

    const player = combatStateRef.current?.player ?? state.run?.player;
    const enemies = combatStateRef.current?.enemies ?? [];

    return (
        <div className="combat-screen">
            {/* Top Bar */}
            <div className="combat-header">
                <div className="wave-info">
                    <span className="wave-label">Wave</span>
                    <span className="wave-number">{waveNumber}</span>
                    <span className="wave-total">/ 10</span>
                </div>

                <div className="player-resources">
                    <div className="resource gold">
                        <span className="resource-icon">💰</span>
                        <span>{player?.gold ?? 0}</span>
                    </div>
                    <div className="resource level">
                        <span className="resource-icon">⭐</span>
                        <span>Lv. {player?.level ?? 1}</span>
                    </div>
                </div>

                <div className="speed-controls">
                    {([1, 2, 4] as const).map((speed) => (
                        <button
                            key={speed}
                            className={`speed-btn ${state.playbackSpeed === speed ? 'active' : ''}`}
                            onClick={() => dispatch({ type: 'SET_PLAYBACK_SPEED', speed })}
                        >
                            x{speed}
                        </button>
                    ))}
                    <button
                        className={`pause-btn ${state.isPaused ? 'paused' : ''}`}
                        onClick={() => dispatch({ type: 'TOGGLE_PAUSE' })}
                    >
                        {state.isPaused ? '▶' : '⏸'}
                    </button>
                </div>
            </div>

            {/* Main Combat Area */}
            <div className="combat-main">
                {/* Player Side */}
                <div className="combat-side player-side">
                    <div className="combatant player">
                        <div className="combatant-sprite player-sprite">
                            ⚔️
                        </div>
                        <div className="combatant-info">
                            <span className="combatant-name">{player?.name ?? 'Player'}</span>
                            <div className="hp-bar">
                                <div
                                    className="hp-fill"
                                    style={{
                                        width: `${((player?.stats.hp ?? 100) / (player?.stats.maxHp ?? 100)) * 100}%`,
                                    }}
                                />
                                <span className="hp-text">
                                    {player?.stats.hp ?? 100} / {player?.stats.maxHp ?? 100}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Combat Arena (CSS-based for now) */}
                <div className="combat-arena">
                    <div className="arena-divider" />
                    <div className="arena-label">⚔️ Combat Zone ⚔️</div>
                </div>

                {/* Enemy Side */}
                <div className="combat-side enemy-side">
                    {enemies.map((enemy: EnemyEntity) => (
                        <div
                            key={enemy.id}
                            className={`combatant enemy ${enemy.isDead ? 'dead' : ''}`}
                        >
                            <div className="combatant-sprite enemy-sprite">
                                👹
                            </div>
                            <div className="combatant-info">
                                <span className="combatant-name">{enemy.name}</span>
                                <div className="hp-bar enemy-hp">
                                    <div
                                        className="hp-fill"
                                        style={{
                                            width: `${(enemy.stats.hp / enemy.stats.maxHp) * 100}%`,
                                        }}
                                    />
                                    <span className="hp-text">
                                        {enemy.stats.hp} / {enemy.stats.maxHp}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Combat Log */}
            <div className="combat-log">
                <div className="log-header">Combat Log</div>
                <div className="log-content">
                    {combatLog.slice(-8).map((msg, i) => (
                        <div key={i} className="log-entry">
                            {msg}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
