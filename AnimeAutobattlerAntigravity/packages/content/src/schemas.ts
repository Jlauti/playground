import { z } from 'zod';

// ============================================================================
// Shared Schemas
// ============================================================================

export const StatModifiersSchema = z.object({
    hp: z.number().optional(),
    maxHp: z.number().optional(),
    atk: z.number().optional(),
    arm: z.number().optional(),
    attackSpeed: z.number().optional(),
    critChance: z.number().optional(),
    critMultiplier: z.number().optional(),
    pwr: z.number().optional(),
    res: z.number().optional(),
    cdr: z.number().optional(),
    lifesteal: z.number().optional(),
    evasion: z.number().optional(),
    atkPercent: z.number().optional(),
    armPercent: z.number().optional(),
    maxHpPercent: z.number().optional(),
    attackSpeedPercent: z.number().optional(),
});

export type StatModifiers = z.infer<typeof StatModifiersSchema>;

// ============================================================================
// Skills Schema
// ============================================================================

export const SkillBranchSchema = z.enum(['blade_dance', 'bloodcraft', 'iron_veil']);

export const SkillNodeSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    branch: SkillBranchSchema,
    tier: z.number().min(1).max(5),
    maxPoints: z.number().min(1).max(5),
    prerequisites: z.array(z.string()).default([]),
    modifiers: StatModifiersSchema.optional(),
    effects: z.array(z.object({
        type: z.string(),
        value: z.number(),
        perPoint: z.boolean().default(false),
    })).default([]),
    isKeystone: z.boolean().default(false),
    keystoneId: z.string().optional(),
});

export const SkillsDataSchema = z.object({
    version: z.string(),
    skills: z.array(SkillNodeSchema),
});

export type SkillNode = z.infer<typeof SkillNodeSchema>;
export type SkillsData = z.infer<typeof SkillsDataSchema>;

// ============================================================================
// Perks Schema
// ============================================================================

export const PerkSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    rarity: z.enum(['common', 'rare', 'epic']),
    modifiers: StatModifiersSchema.optional(),
    effects: z.array(z.object({
        type: z.string(),
        value: z.number(),
    })).default([]),
    tags: z.array(z.string()).default([]),
});

export const PerksDataSchema = z.object({
    version: z.string(),
    perks: z.array(PerkSchema),
});

export type Perk = z.infer<typeof PerkSchema>;
export type PerksData = z.infer<typeof PerksDataSchema>;

// ============================================================================
// Items Schema
// ============================================================================

export const ItemSlotSchema = z.enum(['weapon', 'armor', 'trinket']);
export const ItemRaritySchema = z.enum(['common', 'rare', 'epic', 'legendary']);

export const ItemSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    slot: ItemSlotSchema,
    rarity: ItemRaritySchema,
    modifiers: StatModifiersSchema.optional(),
    effects: z.array(z.object({
        type: z.string(),
        value: z.number(),
        trigger: z.string().optional(),
    })).default([]),
    lore: z.string().optional(),
});

export const ItemsDataSchema = z.object({
    version: z.string(),
    items: z.array(ItemSchema),
});

export type Item = z.infer<typeof ItemSchema>;
export type ItemsData = z.infer<typeof ItemsDataSchema>;

// ============================================================================
// Enemies Schema
// ============================================================================

export const BaseStatsSchema = z.object({
    hp: z.number(),
    maxHp: z.number(),
    atk: z.number(),
    arm: z.number(),
    attackSpeed: z.number(),
    critChance: z.number(),
    critMultiplier: z.number(),
    pwr: z.number(),
    res: z.number(),
    cdr: z.number().default(0),
    lifesteal: z.number().default(0),
    evasion: z.number().default(0),
});

export const EnemyAffixSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    modifiers: StatModifiersSchema.optional(),
    effects: z.array(z.object({
        type: z.string(),
        value: z.number(),
    })).default([]),
});

export const EnemyTemplateSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    baseStats: BaseStatsSchema,
    xpReward: z.number(),
    goldReward: z.number(),
    abilities: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
});

export const BossPhaseSchema = z.object({
    phase: z.number(),
    hpThreshold: z.number().min(0).max(1), // Percentage of max HP to trigger
    modifiers: StatModifiersSchema.optional(),
    effects: z.array(z.object({
        type: z.string(),
        value: z.number(),
    })).default([]),
    dialogue: z.string().optional(),
});

export const BossTemplateSchema = EnemyTemplateSchema.extend({
    isBoss: z.literal(true),
    phases: z.array(BossPhaseSchema),
});

export const EnemiesDataSchema = z.object({
    version: z.string(),
    enemies: z.array(EnemyTemplateSchema),
    bosses: z.array(BossTemplateSchema),
    affixes: z.array(EnemyAffixSchema),
});

export type EnemyAffix = z.infer<typeof EnemyAffixSchema>;
export type EnemyTemplate = z.infer<typeof EnemyTemplateSchema>;
export type BossPhase = z.infer<typeof BossPhaseSchema>;
export type BossTemplate = z.infer<typeof BossTemplateSchema>;
export type EnemiesData = z.infer<typeof EnemiesDataSchema>;

// ============================================================================
// Waves Schema
// ============================================================================

export const WaveEnemySpawnSchema = z.object({
    templateId: z.string(),
    count: z.number().min(1),
    isElite: z.boolean().default(false),
    affixCount: z.number().default(0),
});

export const WaveSchema = z.object({
    waveNumber: z.number().min(1),
    name: z.string(),
    description: z.string().optional(),
    enemies: z.array(WaveEnemySpawnSchema),
    isBossWave: z.boolean().default(false),
    bossId: z.string().optional(),
    rewards: z.object({
        xpBase: z.number(),
        goldBase: z.number(),
        itemDropChance: z.number().min(0).max(1),
    }),
});

export const WavesDataSchema = z.object({
    version: z.string(),
    act: z.string(),
    waves: z.array(WaveSchema),
});

export type WaveEnemySpawn = z.infer<typeof WaveEnemySpawnSchema>;
export type Wave = z.infer<typeof WaveSchema>;
export type WavesData = z.infer<typeof WavesDataSchema>;

// ============================================================================
// Relics Schema
// ============================================================================

export const RelicSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    modifiers: StatModifiersSchema.optional(),
    effects: z.array(z.object({
        type: z.string(),
        value: z.number(),
    })).default([]),
});

export const RelicsDataSchema = z.object({
    version: z.string(),
    relics: z.array(RelicSchema),
});

export type Relic = z.infer<typeof RelicSchema>;
export type RelicsData = z.infer<typeof RelicsDataSchema>;
