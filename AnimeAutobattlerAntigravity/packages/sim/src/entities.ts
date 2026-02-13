import type {
    Stats,
    StatModifiers,
    Entity,
    PlayerEntity,
    EnemyEntity,
    AnyStatusEffect,
} from './types.js';

/**
 * Creates default base stats for a new player - BALANCED for fun gameplay
 */
export function createDefaultPlayerStats(): Stats {
    return {
        hp: 150,           // Was: 100 - more survivability
        maxHp: 150,
        atk: 15,           // Was: 10 - faster kills
        arm: 8,            // Was: 5 - better defense
        attackSpeed: 1.2,  // Was: 1.0 - faster attacks
        critChance: 0.10,  // Was: 0.05 - more crits
        critMultiplier: 1.75,  // Was: 1.5 - harder crits
        pwr: 0,
        res: 8,            // Was: 5 - magic defense
        cdr: 0,
        lifesteal: 0.05,   // Was: 0 - sustain in combat
        evasion: 0.03,     // Was: 0 - some dodge chance
    };
}

/**
 * Creates a new player entity
 */
export function createPlayer(id: string, name: string): PlayerEntity {
    const baseStats = createDefaultPlayerStats();
    return {
        id,
        name,
        stats: { ...baseStats },
        baseStats,
        effects: [],
        isPlayer: true,
        attackCooldown: 0,
        position: { x: 100, y: 300 },
        isDead: false,
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        gold: 0,
        skillPoints: 0,
        allocatedSkills: {},
        perks: [],
        items: [],
        keystones: [],
    };
}

/**
 * Creates an enemy entity from a template
 */
export function createEnemy(
    id: string,
    templateId: string,
    name: string,
    baseStats: Stats,
    options: {
        isElite?: boolean;
        isBoss?: boolean;
        affixes?: string[];
        position?: { x: number; y: number };
    } = {}
): EnemyEntity {
    return {
        id,
        name,
        templateId,
        stats: { ...baseStats },
        baseStats,
        effects: [],
        isPlayer: false,
        attackCooldown: 0,
        position: options.position ?? { x: 700, y: 300 },
        isDead: false,
        isElite: options.isElite ?? false,
        isBoss: options.isBoss ?? false,
        affixes: options.affixes ?? [],
        phase: 1,
        lootTable: [],
    };
}

/**
 * Apply stat modifiers to base stats
 */
export function applyModifiers(base: Stats, modifiers: StatModifiers): Stats {
    const result = { ...base };

    // Flat modifiers
    if (modifiers.hp !== undefined) result.hp += modifiers.hp;
    if (modifiers.maxHp !== undefined) result.maxHp += modifiers.maxHp;
    if (modifiers.atk !== undefined) result.atk += modifiers.atk;
    if (modifiers.arm !== undefined) result.arm += modifiers.arm;
    if (modifiers.attackSpeed !== undefined)
        result.attackSpeed += modifiers.attackSpeed;
    if (modifiers.critChance !== undefined)
        result.critChance += modifiers.critChance;
    if (modifiers.critMultiplier !== undefined)
        result.critMultiplier += modifiers.critMultiplier;
    if (modifiers.pwr !== undefined) result.pwr += modifiers.pwr;
    if (modifiers.res !== undefined) result.res += modifiers.res;
    if (modifiers.cdr !== undefined) result.cdr += modifiers.cdr;
    if (modifiers.lifesteal !== undefined) result.lifesteal += modifiers.lifesteal;
    if (modifiers.evasion !== undefined) result.evasion += modifiers.evasion;

    // Percentage modifiers
    if (modifiers.maxHpPercent !== undefined)
        result.maxHp *= 1 + modifiers.maxHpPercent;
    if (modifiers.atkPercent !== undefined)
        result.atk *= 1 + modifiers.atkPercent;
    if (modifiers.armPercent !== undefined)
        result.arm *= 1 + modifiers.armPercent;
    if (modifiers.attackSpeedPercent !== undefined)
        result.attackSpeed *= 1 + modifiers.attackSpeedPercent;

    // Clamp values
    result.hp = Math.max(0, result.hp);
    result.maxHp = Math.max(1, result.maxHp);
    result.atk = Math.max(0, result.atk);
    result.arm = Math.max(0, result.arm);
    result.attackSpeed = Math.max(0.1, result.attackSpeed);
    result.critChance = Math.max(0, Math.min(1, result.critChance));
    result.critMultiplier = Math.max(1, result.critMultiplier);
    result.cdr = Math.max(0, Math.min(0.8, result.cdr));
    result.lifesteal = Math.max(0, Math.min(1, result.lifesteal));
    result.evasion = Math.max(0, Math.min(0.75, result.evasion));

    return result;
}

/**
 * Recalculate an entity's stats from base + all modifiers
 */
export function recalculateStats(entity: Entity): void {
    // Start from base stats
    entity.stats = { ...entity.baseStats };

    // Apply shield to effective HP
    for (const effect of entity.effects) {
        if (effect.type === 'shield') {
            // Shield is tracked separately, not added to HP
        }
    }
}

/**
 * Get the total shield amount on an entity
 */
export function getTotalShield(entity: Entity): number {
    return entity.effects
        .filter((e): e is AnyStatusEffect & { type: 'shield' } => e.type === 'shield')
        .reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Get the total vulnerable multiplier on an entity
 */
export function getVulnerableMultiplier(entity: Entity): number {
    return entity.effects
        .filter(
            (e): e is AnyStatusEffect & { type: 'vulnerable' } =>
                e.type === 'vulnerable'
        )
        .reduce((sum, e) => 1 + e.stacks * e.damageIncrease, 1);
}

/**
 * Check if entity is alive
 */
export function isAlive(entity: Entity): boolean {
    return !entity.isDead && entity.stats.hp > 0;
}

/**
 * Clone an entity for state snapshots
 */
export function cloneEntity<T extends Entity>(entity: T): T {
    return {
        ...entity,
        stats: { ...entity.stats },
        baseStats: { ...entity.baseStats },
        effects: entity.effects.map((e) => ({ ...e })),
        position: { ...entity.position },
    } as T;
}

/**
 * Get XP required for a level
 */
export function getXpForLevel(level: number): number {
    return 100 + (level - 1) * 50;
}

/**
 * Calculate levels gained from XP
 */
export function calculateLevelUp(
    currentLevel: number,
    currentXp: number,
    xpGained: number
): { newLevel: number; newXp: number; levelsGained: number } {
    let level = currentLevel;
    let xp = currentXp + xpGained;

    while (xp >= getXpForLevel(level)) {
        xp -= getXpForLevel(level);
        level++;
    }

    return {
        newLevel: level,
        newXp: xp,
        levelsGained: level - currentLevel,
    };
}
