// --- Status Effects ---
export type StatusEffectType = 'bleed' | 'poison' | 'vulnerable' | 'buff';

export interface StatusEffect {
  type: StatusEffectType;
  stacks: number;
  duration?: number; // In ticks, undefined for permanent until cleared
  sourceId?: string;
  value: number; // e.g., damage per tick, % modifier
}
