import { z } from 'zod';

// --- Stats ---
export const StatsSchema = z.object({
  hp: z.number().default(100),
  maxHp: z.number().default(100),
  atk: z.number().default(10),
  arm: z.number().default(0), // Armor (phys mitigation)
  res: z.number().default(0), // Resistance (mag mitigation)
  as: z.number().default(1.0), // Attacks per second
  critChance: z.number().default(0), // 0-100
  critMultiplier: z.number().default(1.5), // 1.5x default
  pwr: z.number().default(0), // Power (magic scaling)
  // Optional Stats
  cdr: z.number().default(0), // Cooldown Reduction %
  lifesteal: z.number().default(0), // % of dmg dealt
  evasion: z.number().default(0), // % chance to dodge
});

export type Stats = z.infer<typeof StatsSchema>;

// --- Common Fields ---
const BaseContentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string().optional(),
});

// --- Skills ---
export const SkillBranchSchema = z.enum(['Blade Dance', 'Bloodcraft', 'Iron Veil']);

export const SkillSchema = BaseContentSchema.extend({
  branch: SkillBranchSchema,
  tier: z.number().int().min(1).max(5),
  maxRank: z.number().int().default(1),
  cost: z.number().int().default(1),
  effects: z.array(z.object({
    type: z.enum(['stat', 'trigger', 'passive']),
    stat: z.string().optional(), // e.g., 'atk'
    value: z.number().optional(),
    trigger: z.string().optional(), // e.g., 'onCrit', 'onBleedTick'
    action: z.string().optional(), // e.g., 'reduceCooldowns'
    params: z.record(z.any()).optional(),
  })),
  keystone: z.boolean().default(false),
});

export type Skill = z.infer<typeof SkillSchema>;

// --- Items ---
export const ItemRaritySchema = z.enum(['Common', 'Rare', 'Epic', 'Legendary']);
export const ItemSlotSchema = z.enum(['Weapon', 'Armor', 'Trinket']);

export const ItemSchema = BaseContentSchema.extend({
  rarity: ItemRaritySchema,
  slot: ItemSlotSchema,
  stats: StatsSchema.partial().optional(),
  effects: z.array(z.any()).optional(), // To be defined more strictly later if needed
});

export type Item = z.infer<typeof ItemSchema>;

// --- Perks ---
export const PerkSchema = BaseContentSchema.extend({
  stats: StatsSchema.partial().optional(),
  effects: z.array(z.any()).optional(),
});

export type Perk = z.infer<typeof PerkSchema>;

// --- Enemies ---
export const EnemySchema = BaseContentSchema.extend({
  baseStats: StatsSchema,
  scaling: StatsSchema.partial().optional(), // Stats per level/wave
  abilities: z.array(z.object({
    name: z.string(),
    trigger: z.string(), // 'cooldown', 'hpThreshold'
    effect: z.string(),
    value: z.number(),
    cooldown: z.number().optional(),
  })).optional(),
  isBoss: z.boolean().default(false),
  phases: z.number().default(1),
});

export type Enemy = z.infer<typeof EnemySchema>;

// --- Waves ---
export const WaveSchema = z.object({
  waveNumber: z.number(),
  enemies: z.array(z.object({
    enemyId: z.string(),
    level: z.number().default(1),
    count: z.number().default(1),
    elite: z.boolean().default(false),
    affixes: z.array(z.string()).optional(),
  })),
  rewardTier: z.enum(['low', 'medium', 'high', 'boss']),
});

export type Wave = z.infer<typeof WaveSchema>;
