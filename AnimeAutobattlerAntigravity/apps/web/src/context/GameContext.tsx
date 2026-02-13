import { createContext, useContext, useReducer, type ReactNode } from 'react';
import {
    type RunState,
    type CombatState,
    type CombatEvent,
    type PlayerEntity,
    createRunState,
} from '@anime-autobattler/sim';

// ============================================================================
// State Types
// ============================================================================

export interface GameState {
    run: RunState | null;
    combatState: CombatState | null;
    combatEvents: CombatEvent[];
    playbackSpeed: 1 | 2 | 4;
    isPaused: boolean;
    selectedPerkOfferings: string[];
    selectedItemOfferings: string[];
    showSkillTree: boolean;
}

const initialState: GameState = {
    run: null,
    combatState: null,
    combatEvents: [],
    playbackSpeed: 1,
    isPaused: false,
    selectedPerkOfferings: [],
    selectedItemOfferings: [],
    showSkillTree: false,
};

// ============================================================================
// Actions
// ============================================================================

type GameAction =
    | { type: 'START_RUN'; seed: number }
    | { type: 'SELECT_RELIC'; relicId: string }
    | { type: 'START_COMBAT'; combatState: CombatState }
    | { type: 'UPDATE_COMBAT'; combatState: CombatState; events: CombatEvent[] }
    | { type: 'END_COMBAT'; isVictory: boolean }
    | { type: 'SYNC_PLAYER_STATS'; player: PlayerEntity }
    | { type: 'SET_PLAYBACK_SPEED'; speed: 1 | 2 | 4 }
    | { type: 'TOGGLE_PAUSE' }
    | { type: 'SET_PERK_OFFERINGS'; perks: string[] }
    | { type: 'SELECT_PERK'; perkId: string }
    | { type: 'SET_ITEM_OFFERINGS'; items: string[] }
    | { type: 'SELECT_ITEM'; itemId: string }
    | { type: 'ALLOCATE_SKILL'; skillId: string }
    | { type: 'TOGGLE_SKILL_TREE' }
    | { type: 'ADVANCE_WAVE' }
    | { type: 'END_RUN'; isVictory: boolean }
    | { type: 'RESET' };

function gameReducer(state: GameState, action: GameAction): GameState {
    switch (action.type) {
        case 'START_RUN':
            return {
                ...initialState,
                run: createRunState(action.seed),
            };

        case 'SELECT_RELIC':
            if (!state.run) return state;
            return {
                ...state,
                run: {
                    ...state.run,
                    selectedRelic: action.relicId,
                },
            };

        case 'START_COMBAT':
            return {
                ...state,
                combatState: action.combatState,
                combatEvents: [],
                isPaused: false,
            };

        case 'UPDATE_COMBAT':
            return {
                ...state,
                combatState: action.combatState,
                combatEvents: [...state.combatEvents, ...action.events],
            };

        case 'END_COMBAT':
            if (!state.run) return state;
            return {
                ...state,
                run: {
                    ...state.run,
                    completedWaves: [...state.run.completedWaves, state.run.currentWave],
                },
            };

        case 'SYNC_PLAYER_STATS':
            if (!state.run) return state;
            console.log('SYNC_PLAYER_STATS called!', {
                incoming: {
                    level: action.player.level,
                    xp: action.player.xp,
                    gold: action.player.gold,
                    skillPoints: action.player.skillPoints,
                },
                current: {
                    level: state.run.player.level,
                    xp: state.run.player.xp,
                    gold: state.run.player.gold,
                    skillPoints: state.run.player.skillPoints,
                },
            });
            return {
                ...state,
                run: {
                    ...state.run,
                    player: {
                        ...state.run.player,
                        level: action.player.level,
                        xp: action.player.xp,
                        xpToNextLevel: action.player.xpToNextLevel,
                        gold: action.player.gold,
                        skillPoints: action.player.skillPoints,
                        stats: { ...action.player.stats },
                    },
                    totalXpEarned: state.run.totalXpEarned + action.player.xp,
                    totalGoldEarned: state.run.totalGoldEarned + action.player.gold,
                },
            };

        case 'SET_PLAYBACK_SPEED':
            return { ...state, playbackSpeed: action.speed };

        case 'TOGGLE_PAUSE':
            return { ...state, isPaused: !state.isPaused };

        case 'SET_PERK_OFFERINGS':
            return { ...state, selectedPerkOfferings: action.perks };

        case 'SELECT_PERK':
            if (!state.run) return state;
            return {
                ...state,
                run: {
                    ...state.run,
                    perksSelected: [...state.run.perksSelected, action.perkId],
                },
                selectedPerkOfferings: [],
            };

        case 'SET_ITEM_OFFERINGS':
            return { ...state, selectedItemOfferings: action.items };

        case 'SELECT_ITEM':
            if (!state.run) return state;
            return {
                ...state,
                run: {
                    ...state.run,
                    itemsCollected: [...state.run.itemsCollected, action.itemId],
                },
                selectedItemOfferings: [],
            };

        case 'ALLOCATE_SKILL':
            if (!state.run || state.run.player.skillPoints <= 0) return state;
            return {
                ...state,
                run: {
                    ...state.run,
                    player: {
                        ...state.run.player,
                        skillPoints: state.run.player.skillPoints - 1,
                        allocatedSkills: {
                            ...state.run.player.allocatedSkills,
                            [action.skillId]: (state.run.player.allocatedSkills[action.skillId] ?? 0) + 1,
                        },
                    },
                },
            };

        case 'TOGGLE_SKILL_TREE':
            return { ...state, showSkillTree: !state.showSkillTree };

        case 'ADVANCE_WAVE':
            if (!state.run) return state;
            return {
                ...state,
                run: {
                    ...state.run,
                    currentWave: state.run.currentWave + 1,
                },
                combatState: null,
                combatEvents: [],
            };

        case 'END_RUN':
            if (!state.run) return state;
            return {
                ...state,
                run: {
                    ...state.run,
                    isComplete: true,
                    isVictory: action.isVictory,
                    endTime: Date.now(),
                },
            };

        case 'RESET':
            return initialState;

        default:
            return state;
    }
}

// ============================================================================
// Context
// ============================================================================

interface GameContextValue {
    state: GameState;
    dispatch: React.Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(gameReducer, initialState);

    return (
        <GameContext.Provider value={{ state, dispatch }}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
}

export function useGameState() {
    return useGame().state;
}

export function useGameDispatch() {
    return useGame().dispatch;
}
