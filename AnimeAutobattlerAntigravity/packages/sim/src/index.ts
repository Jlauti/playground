// Core exports
export { SeededRNG } from './rng.js';

// Types
export type {
    Stats,
    StatModifiers,
    StatusEffectType,
    StatusEffect,
    BleedEffect,
    PoisonEffect,
    VulnerableEffect,
    ShieldEffect,
    AnyStatusEffect,
    Entity,
    PlayerEntity,
    EnemyEntity,
    ItemSlot,
    ItemRarity,
    ItemInstance,
    LootEntry,
    CombatEventType,
    CombatEvent,
    AttackEvent,
    DamageEvent,
    HealEvent,
    CritEvent,
    MissEvent,
    DeathEvent,
    EffectAppliedEvent,
    EffectRemovedEvent,
    EffectTickEvent,
    PhaseChangeEvent,
    WaveStartEvent,
    WaveEndEvent,
    LevelUpEvent,
    SkillActivatedEvent,
    KeystoneProcEvent,
    CombatState,
    WaveState,
    RunState,
    SimConfig,
    EventHandler,
    EventHash,
} from './types.js';

export { DEFAULT_SIM_CONFIG } from './types.js';

// Entities
export {
    createDefaultPlayerStats,
    createPlayer,
    createEnemy,
    applyModifiers,
    recalculateStats,
    getTotalShield,
    getVulnerableMultiplier,
    isAlive,
    cloneEntity,
    getXpForLevel,
    calculateLevelUp,
} from './entities.js';

// Damage
export {
    calculateMitigation,
    calculatePhysicalDamage,
    calculateMagicDamage,
    calculateTrueDamage,
    applyDamage,
    applyHealing,
    rollHit,
    rollCrit,
    calculateAttackDamage,
} from './damage.js';

// Effects
export {
    resetEffectIds,
    applyBleed,
    applyPoison,
    applyVulnerable,
    applyShield,
    processDoTEffects,
    tickEffects,
    clearEffects,
    getBleedStacks,
    hasEffect,
} from './effects.js';

// Combat
export {
    createCombatState,
    simulateTick,
    createKeystoneState,
    simulateCombat,
} from './combat.js';

// Run
export {
    createRunState,
    generatePerkOfferings,
    generateItemOfferings,
    selectRelic,
    selectPerk,
    equipItem,
    allocateSkillPoint,
    respec,
    processWaveRewards,
    prepareForNextWave,
    shouldOfferItem,
    advanceWave,
    completeRun,
    generateRunSummary,
} from './run.js';
