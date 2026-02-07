import { z } from 'zod';
import {
  SkillSchema,
  ItemSchema,
  EnemySchema,
  WaveSchema,
  PerkSchema,
} from './schemas.js';

import skillsData from './data/skills.json' with { type: 'json' };
import itemsData from './data/items.json' with { type: 'json' };
import enemiesData from './data/enemies.json' with { type: 'json' };
import wavesData from './data/waves.json' with { type: 'json' };
import perksData from './data/perks.json' with { type: 'json' };

// --- Loader ---

function validate<T>(data: any, schema: z.ZodSchema<T>, name: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`Validation failed for ${name}:`, result.error);
    throw new Error(`Invalid ${name} data`);
  }
  return result.data;
}

export const Content = {
  skills: skillsData.map((s: any) => validate(s, SkillSchema, 'skill')),
  items: itemsData.map((i: any) => validate(i, ItemSchema, 'item')),
  enemies: enemiesData.map((e: any) => validate(e, EnemySchema, 'enemy')),
  waves: wavesData.map((w: any) => validate(w, WaveSchema, 'wave')),
  perks: perksData.map((p: any) => validate(p, PerkSchema, 'perk')),
};

export type ContentType = typeof Content;

export * from './schemas.js';
