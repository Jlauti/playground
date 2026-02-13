import type {
    Entity,
    AnyStatusEffect,
    BleedEffect,
    PoisonEffect,
    VulnerableEffect,
    ShieldEffect,
    EffectAppliedEvent,
    EffectTickEvent,
    CombatEvent,
} from './types.js';
import { calculatePhysicalDamage, calculateMagicDamage, applyDamage } from './damage.js';

let effectIdCounter = 0;

/**
 * Generate unique effect ID
 */
function generateEffectId(): string {
    return `effect_${++effectIdCounter}`;
}

/**
 * Reset effect ID counter (for deterministic tests)
 */
export function resetEffectIds(): void {
    effectIdCounter = 0;
}

/**
 * Apply a bleed effect to an entity
 */
export function applyBleed(
    target: Entity,
    source: Entity,
    stacks: number,
    damagePerStack: number,
    duration: number,
    tick: number
): { effect: BleedEffect; event: EffectAppliedEvent } {
    // Check for existing bleed and stack
    const existing = target.effects.find(
        (e): e is BleedEffect => e.type === 'bleed'
    );

    if (existing) {
        existing.stacks += stacks;
        existing.duration = Math.max(existing.duration, duration);
        existing.damagePerStack = Math.max(existing.damagePerStack, damagePerStack);
    } else {
        const effect: BleedEffect = {
            id: generateEffectId(),
            type: 'bleed',
            stacks,
            damagePerStack,
            duration,
            source: source.id,
        };
        target.effects.push(effect);
    }

    const effect = target.effects.find(
        (e): e is BleedEffect => e.type === 'bleed'
    )!;

    return {
        effect,
        event: {
            type: 'effect_applied',
            tick,
            timestamp: Date.now(),
            targetId: target.id,
            sourceId: source.id,
            effect,
        },
    };
}

/**
 * Apply a poison effect to an entity
 */
export function applyPoison(
    target: Entity,
    source: Entity,
    stacks: number,
    damagePerStack: number,
    duration: number,
    tick: number
): { effect: PoisonEffect; event: EffectAppliedEvent } {
    const existing = target.effects.find(
        (e): e is PoisonEffect => e.type === 'poison'
    );

    if (existing) {
        existing.stacks += stacks;
        existing.duration = Math.max(existing.duration, duration);
        existing.damagePerStack = Math.max(existing.damagePerStack, damagePerStack);
    } else {
        const effect: PoisonEffect = {
            id: generateEffectId(),
            type: 'poison',
            stacks,
            damagePerStack,
            duration,
            source: source.id,
        };
        target.effects.push(effect);
    }

    const effect = target.effects.find(
        (e): e is PoisonEffect => e.type === 'poison'
    )!;

    return {
        effect,
        event: {
            type: 'effect_applied',
            tick,
            timestamp: Date.now(),
            targetId: target.id,
            sourceId: source.id,
            effect,
        },
    };
}

/**
 * Apply vulnerable effect to an entity
 */
export function applyVulnerable(
    target: Entity,
    source: Entity,
    stacks: number,
    damageIncrease: number,
    duration: number,
    tick: number
): { effect: VulnerableEffect; event: EffectAppliedEvent } {
    const existing = target.effects.find(
        (e): e is VulnerableEffect => e.type === 'vulnerable'
    );

    if (existing) {
        existing.stacks += stacks;
        existing.duration = Math.max(existing.duration, duration);
    } else {
        const effect: VulnerableEffect = {
            id: generateEffectId(),
            type: 'vulnerable',
            stacks,
            damageIncrease,
            duration,
            source: source.id,
        };
        target.effects.push(effect);
    }

    const effect = target.effects.find(
        (e): e is VulnerableEffect => e.type === 'vulnerable'
    )!;

    return {
        effect,
        event: {
            type: 'effect_applied',
            tick,
            timestamp: Date.now(),
            targetId: target.id,
            sourceId: source.id,
            effect,
        },
    };
}

/**
 * Apply a shield to an entity
 */
export function applyShield(
    target: Entity,
    source: Entity,
    amount: number,
    duration: number,
    tick: number
): { effect: ShieldEffect; event: EffectAppliedEvent } {
    const effect: ShieldEffect = {
        id: generateEffectId(),
        type: 'shield',
        stacks: 1,
        amount,
        maxAmount: amount,
        duration,
        source: source.id,
    };

    target.effects.push(effect);

    return {
        effect,
        event: {
            type: 'effect_applied',
            tick,
            timestamp: Date.now(),
            targetId: target.id,
            sourceId: source.id,
            effect,
        },
    };
}

/**
 * Process DoT effects (bleed/poison) for one tick
 */
export function processDoTEffects(
    entity: Entity,
    tick: number,
    bleedTickRate: number,
    poisonTickRate: number
): CombatEvent[] {
    const events: CombatEvent[] = [];

    for (const effect of entity.effects) {
        if (effect.type === 'bleed' && tick % bleedTickRate === 0) {
            const totalDamage = effect.stacks * effect.damagePerStack;
            const mitigatedDamage = calculatePhysicalDamage(totalDamage, entity);

            const { event: damageEvent } = applyDamage(
                entity,
                mitigatedDamage,
                tick,
                effect.source,
                'physical',
                'bleed'
            );

            events.push(damageEvent);
            events.push({
                type: 'effect_tick',
                tick,
                timestamp: Date.now(),
                targetId: entity.id,
                effectId: effect.id,
                effectType: 'bleed',
                damage: mitigatedDamage,
            });
        }

        if (effect.type === 'poison' && tick % poisonTickRate === 0) {
            const totalDamage = effect.stacks * effect.damagePerStack;
            const mitigatedDamage = calculateMagicDamage(totalDamage, entity);

            const { event: damageEvent } = applyDamage(
                entity,
                mitigatedDamage,
                tick,
                effect.source,
                'magic',
                'poison'
            );

            events.push(damageEvent);
            events.push({
                type: 'effect_tick',
                tick,
                timestamp: Date.now(),
                targetId: entity.id,
                effectId: effect.id,
                effectType: 'poison',
                damage: mitigatedDamage,
            });
        }
    }

    return events;
}

/**
 * Tick down effect durations and remove expired effects
 */
export function tickEffects(entity: Entity, tick: number): CombatEvent[] {
    const events: CombatEvent[] = [];

    for (const effect of entity.effects) {
        effect.duration--;
    }

    // Remove expired effects
    const expired = entity.effects.filter((e) => e.duration <= 0);
    entity.effects = entity.effects.filter((e) => e.duration > 0);

    for (const effect of expired) {
        events.push({
            type: 'effect_removed',
            tick,
            timestamp: Date.now(),
            targetId: entity.id,
            effectId: effect.id,
            effectType: effect.type,
            reason: 'expired',
        });
    }

    return events;
}

/**
 * Clear all effects from an entity
 */
export function clearEffects(entity: Entity): void {
    entity.effects = [];
}

/**
 * Get total bleed stacks on an entity
 */
export function getBleedStacks(entity: Entity): number {
    return entity.effects
        .filter((e): e is BleedEffect => e.type === 'bleed')
        .reduce((sum, e) => sum + e.stacks, 0);
}

/**
 * Check if entity has a specific effect type
 */
export function hasEffect(
    entity: Entity,
    effectType: AnyStatusEffect['type']
): boolean {
    return entity.effects.some((e) => e.type === effectType);
}
