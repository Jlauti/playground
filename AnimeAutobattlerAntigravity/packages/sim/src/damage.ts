import type { Entity, DamageEvent, HealEvent } from './types.js';
import { getTotalShield, getVulnerableMultiplier } from './entities.js';

/**
 * Calculate damage after armor/resistance mitigation
 * Formula: taken = dmg * (100 / (100 + armor))
 */
export function calculateMitigation(
    rawDamage: number,
    defenseValue: number
): number {
    if (defenseValue <= 0) return rawDamage;
    return rawDamage * (100 / (100 + defenseValue));
}

/**
 * Calculate physical damage dealt to a target
 */
export function calculatePhysicalDamage(
    baseDamage: number,
    target: Entity
): number {
    // Apply armor mitigation
    let damage = calculateMitigation(baseDamage, target.stats.arm);

    // Apply vulnerable multiplier
    damage *= getVulnerableMultiplier(target);

    return Math.floor(damage);
}

/**
 * Calculate magic damage dealt to a target
 */
export function calculateMagicDamage(baseDamage: number, target: Entity): number {
    // Apply resistance mitigation
    let damage = calculateMitigation(baseDamage, target.stats.res);

    // Apply vulnerable multiplier
    damage *= getVulnerableMultiplier(target);

    return Math.floor(damage);
}

/**
 * Calculate true damage (ignores armor/resistance)
 */
export function calculateTrueDamage(baseDamage: number, target: Entity): number {
    // Only apply vulnerable
    return Math.floor(baseDamage * getVulnerableMultiplier(target));
}

/**
 * Apply damage to entity, consuming shields first
 * Returns the actual damage dealt to HP
 */
export function applyDamage(
    entity: Entity,
    damage: number,
    tick: number,
    sourceId: string,
    damageType: 'physical' | 'magic' | 'true',
    source: DamageEvent['source']
): { damageToHp: number; damageToShield: number; event: DamageEvent } {
    let remainingDamage = damage;
    let damageToShield = 0;

    // Consume shields first
    for (const effect of entity.effects) {
        if (effect.type === 'shield' && remainingDamage > 0) {
            const absorbed = Math.min(effect.amount, remainingDamage);
            effect.amount -= absorbed;
            remainingDamage -= absorbed;
            damageToShield += absorbed;

            // Remove depleted shield
            if (effect.amount <= 0) {
                effect.duration = 0; // Mark for removal
            }
        }
    }

    // Apply remaining damage to HP
    const damageToHp = Math.min(entity.stats.hp, remainingDamage);
    entity.stats.hp -= damageToHp;

    // Check for death
    if (entity.stats.hp <= 0) {
        entity.stats.hp = 0;
        entity.isDead = true;
    }

    const event: DamageEvent = {
        type: 'damage',
        tick,
        timestamp: Date.now(),
        targetId: entity.id,
        sourceId,
        damage: damageToHp + damageToShield,
        damageType,
        source,
    };

    return { damageToHp, damageToShield, event };
}

/**
 * Apply healing to entity
 */
export function applyHealing(
    entity: Entity,
    amount: number,
    tick: number,
    sourceId: string,
    source: 'lifesteal' | 'regen' | 'ability'
): { healedAmount: number; event: HealEvent } {
    const actualHeal = Math.min(amount, entity.stats.maxHp - entity.stats.hp);
    entity.stats.hp += actualHeal;

    const event: HealEvent = {
        type: 'heal',
        tick,
        timestamp: Date.now(),
        targetId: entity.id,
        sourceId,
        amount: actualHeal,
        source,
    };

    return { healedAmount: actualHeal, event };
}

/**
 * Check if an attack hits (considering evasion)
 */
export function rollHit(
    attacker: Entity,
    target: Entity,
    rollValue: number
): boolean {
    return rollValue >= target.stats.evasion;
}

/**
 * Check if an attack crits
 */
export function rollCrit(attacker: Entity, rollValue: number): boolean {
    return rollValue < attacker.stats.critChance;
}

/**
 * Calculate attack damage with potential crit
 */
export function calculateAttackDamage(
    attacker: Entity,
    target: Entity,
    isCrit: boolean
): number {
    let damage = attacker.stats.atk;

    if (isCrit) {
        damage *= attacker.stats.critMultiplier;
    }

    return calculatePhysicalDamage(damage, target);
}
