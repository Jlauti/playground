// ============================================================================
// Core Stats
// ============================================================================

export interface Stats {
    hp: number;
    maxHp: number;
    atk: number;
    arm: number; // Armor - physical damage reduction
    attackSpeed: number; // Attacks per second
    critChance: number; // 0-1
    critMultiplier: number; // e.g., 1.5 = 150% damage
    pwr: number; // Power - magic damage bonus
    res: number; // Resistance - magic damage reduction
    cdr: number; // Cooldown reduction (0-1)
    lifesteal: number; // 0-1
    evasion: number; // 0-1
}

export interface StatModifiers {
    hp?: number;
    maxHp?: number;
    atk?: number;
    arm?: number;
    attackSpeed?: number;
    critChance?: number;
    critMultiplier?: number;
    pwr?: number;
    res?: number;
    cdr?: number;
    lifesteal?: number;
    evasion?: number;
    // Percentage modifiers (multiplicative)
    atkPercent?: number;
    armPercent?: number;
    maxHpPercent?: number;
    attackSpeedPercent?: number;
}

// ============================================================================
// Status Effects
// ============================================================================

export type StatusEffectType = 'bleed' | 'poison' | 'vulnerable' | 'shield';

export interface StatusEffect {
    id: string;
    type: StatusEffectType;
    stacks: number;
    duration: number; // Ticks remaining
    source: string; // Entity ID that applied this
}

export interface BleedEffect extends StatusEffect {
    type: 'bleed';
    damagePerStack: number; // Physical damage per tick per stack
}

export interface PoisonEffect extends StatusEffect {
    type: 'poison';
    damagePerStack: number; // Magic damage per tick per stack
}

export interface VulnerableEffect extends StatusEffect {
    type: 'vulnerable';
    damageIncrease: number; // Percentage increase per stack (0.1 = 10%)
}

export interface ShieldEffect extends StatusEffect {
    type: 'shield';
    amount: number; // Current shield HP
    maxAmount: number; // Original shield amount
}

export type AnyStatusEffect =
    | BleedEffect
    | PoisonEffect
    | VulnerableEffect
    | ShieldEffect;

// ============================================================================
// Entities
// ============================================================================

export interface Entity {
    id: string;
    name: string;
    stats: Stats;
    baseStats: Stats;
    effects: AnyStatusEffect[];
    isPlayer: boolean;
    attackCooldown: number; // Ticks until next attack
    position: { x: number; y: number };
    isDead: boolean;
}

export interface PlayerEntity extends Entity {
    isPlayer: true;
    level: number;
    xp: number;
    xpToNextLevel: number;
    gold: number;
    skillPoints: number;
    allocatedSkills: Record<string, number>;
    perks: string[];
    items: ItemInstance[];
    keystones: string[];
}

export interface EnemyEntity extends Entity {
    isPlayer: false;
    templateId: string;
    isElite: boolean;
    isBoss: boolean;
    affixes: string[];
    phase: number; // For multi-phase bosses
    lootTable: LootEntry[];
}

// ============================================================================
// Items & Loot
// ============================================================================

export type ItemSlot = 'weapon' | 'armor' | 'trinket';
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface ItemInstance {
    itemId: string;
    slot: ItemSlot;
    rarity: ItemRarity;
}

export interface LootEntry {
    itemId: string;
    weight: number;
    rarity: ItemRarity;
}

// ============================================================================
// Combat Events
// ============================================================================

export type CombatEventType =
    | 'attack'
    | 'damage'
    | 'heal'
    | 'crit'
    | 'miss'
    | 'death'
    | 'effect_applied'
    | 'effect_removed'
    | 'effect_tick'
    | 'phase_change'
    | 'wave_start'
    | 'wave_end'
    | 'level_up'
    | 'skill_activated'
    | 'keystone_proc';

export interface BaseCombatEvent {
    type: CombatEventType;
    tick: number;
    timestamp: number;
}

export interface AttackEvent extends BaseCombatEvent {
    type: 'attack';
    attackerId: string;
    targetId: string;
    damage: number;
    isCrit: boolean;
}

export interface DamageEvent extends BaseCombatEvent {
    type: 'damage';
    targetId: string;
    sourceId: string;
    damage: number;
    damageType: 'physical' | 'magic' | 'true';
    source: 'attack' | 'bleed' | 'poison' | 'ability' | 'volatile';
}

export interface HealEvent extends BaseCombatEvent {
    type: 'heal';
    targetId: string;
    sourceId: string;
    amount: number;
    source: 'lifesteal' | 'regen' | 'ability';
}

export interface CritEvent extends BaseCombatEvent {
    type: 'crit';
    attackerId: string;
    targetId: string;
    damage: number;
    multiplier: number;
}

export interface MissEvent extends BaseCombatEvent {
    type: 'miss';
    attackerId: string;
    targetId: string;
    reason: 'evasion';
}

export interface DeathEvent extends BaseCombatEvent {
    type: 'death';
    entityId: string;
    killerId: string;
    xpReward: number;
    goldReward: number;
}

export interface EffectAppliedEvent extends BaseCombatEvent {
    type: 'effect_applied';
    targetId: string;
    sourceId: string;
    effect: AnyStatusEffect;
}

export interface EffectRemovedEvent extends BaseCombatEvent {
    type: 'effect_removed';
    targetId: string;
    effectId: string;
    effectType: StatusEffectType;
    reason: 'expired' | 'cleansed' | 'consumed';
}

export interface EffectTickEvent extends BaseCombatEvent {
    type: 'effect_tick';
    targetId: string;
    effectId: string;
    effectType: StatusEffectType;
    damage?: number;
}

export interface PhaseChangeEvent extends BaseCombatEvent {
    type: 'phase_change';
    entityId: string;
    oldPhase: number;
    newPhase: number;
}

export interface WaveStartEvent extends BaseCombatEvent {
    type: 'wave_start';
    waveNumber: number;
    enemyCount: number;
}

export interface WaveEndEvent extends BaseCombatEvent {
    type: 'wave_end';
    waveNumber: number;
    totalXp: number;
    totalGold: number;
    itemDrops: string[];
}

export interface LevelUpEvent extends BaseCombatEvent {
    type: 'level_up';
    entityId: string;
    oldLevel: number;
    newLevel: number;
    skillPointsGained: number;
}

export interface SkillActivatedEvent extends BaseCombatEvent {
    type: 'skill_activated';
    entityId: string;
    skillId: string;
}

export interface KeystoneProcEvent extends BaseCombatEvent {
    type: 'keystone_proc';
    entityId: string;
    keystoneId: string;
    effect: string;
}

export type CombatEvent =
    | AttackEvent
    | DamageEvent
    | HealEvent
    | CritEvent
    | MissEvent
    | DeathEvent
    | EffectAppliedEvent
    | EffectRemovedEvent
    | EffectTickEvent
    | PhaseChangeEvent
    | WaveStartEvent
    | WaveEndEvent
    | LevelUpEvent
    | SkillActivatedEvent
    | KeystoneProcEvent;

// ============================================================================
// Simulation State
// ============================================================================

export interface CombatState {
    tick: number;
    player: PlayerEntity;
    enemies: EnemyEntity[];
    events: CombatEvent[];
    isComplete: boolean;
    winner: 'player' | 'enemies' | null;
}

export interface WaveState {
    waveNumber: number;
    isBossWave: boolean;
    enemies: EnemyEntity[];
    rewards: {
        xp: number;
        gold: number;
        items: string[];
    };
}

export interface RunState {
    seed: number;
    currentWave: number;
    maxWaves: number;
    player: PlayerEntity;
    selectedRelic: string;
    completedWaves: number[];
    totalXpEarned: number;
    totalGoldEarned: number;
    itemsCollected: string[];
    perksSelected: string[];
    isComplete: boolean;
    isVictory: boolean;
    startTime: number;
    endTime?: number;
}

// ============================================================================
// Configuration
// ============================================================================

export interface SimConfig {
    ticksPerSecond: number;
    maxTicksPerWave: number;
    xpPerLevel: (level: number) => number;
    respecCostBase: number;
    respecCostPerPoint: number;
    itemPityTimer: number; // Waves without item before guaranteed offer
    bleedTickRate: number; // Ticks between bleed damage
    poisonTickRate: number; // Ticks between poison damage
}

export const DEFAULT_SIM_CONFIG: SimConfig = {
    ticksPerSecond: 60,
    maxTicksPerWave: 60 * 60 * 2, // 2 minutes max per wave
    xpPerLevel: (level) => 100 + level * 50,
    respecCostBase: 50,
    respecCostPerPoint: 10,
    itemPityTimer: 2,
    bleedTickRate: 30, // 0.5 seconds
    poisonTickRate: 30,
};

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface EventHandler {
    (event: CombatEvent): void;
}

export interface EventHash {
    hash: string;
    eventCount: number;
}
