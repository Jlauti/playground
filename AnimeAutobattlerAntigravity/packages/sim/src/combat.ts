import type {
    Entity,
    PlayerEntity,
    EnemyEntity,
    CombatEvent,
    CombatState,
    SimConfig,
    KeystoneProcEvent,
    AttackEvent,
} from './types.js';
import { DEFAULT_SIM_CONFIG } from './types.js';
import { SeededRNG } from './rng.js';
import { isAlive } from './entities.js';
import {
    rollHit,
    rollCrit,
    calculateAttackDamage,
    applyDamage,
    applyHealing,
} from './damage.js';
import { processDoTEffects, tickEffects, getBleedStacks, applyBleed } from './effects.js';

/**
 * Track keystone cooldowns and state
 */
interface KeystoneState {
    frenzyLoopCooldown: number;
    hemorrhageBleedTicks: number;
    unbreakableUsed: boolean;
}

/**
 * Create initial combat state
 */
export function createCombatState(
    player: PlayerEntity,
    enemies: EnemyEntity[]
): CombatState {
    return {
        tick: 0,
        player,
        enemies,
        events: [],
        isComplete: false,
        winner: null,
    };
}

/**
 * Get all living entities
 */
function getLivingEntities(state: CombatState): Entity[] {
    const entities: Entity[] = [];
    if (isAlive(state.player)) entities.push(state.player);
    entities.push(...state.enemies.filter(isAlive));
    return entities;
}

/**
 * Get first living enemy for targeting
 */
function getTarget(enemies: EnemyEntity[]): EnemyEntity | null {
    return enemies.find(isAlive) ?? null;
}

/**
 * Process a single attack from attacker to target
 */
function processAttack(
    attacker: Entity,
    target: Entity,
    tick: number,
    rng: SeededRNG,
    keystoneState: KeystoneState
): CombatEvent[] {
    const events: CombatEvent[] = [];

    // Roll for evasion
    if (!rollHit(attacker, target, rng.next())) {
        events.push({
            type: 'miss',
            tick,
            timestamp: Date.now(),
            attackerId: attacker.id,
            targetId: target.id,
            reason: 'evasion',
        });
        return events;
    }

    // Roll for crit
    const isCrit = rollCrit(attacker, rng.next());
    const damage = calculateAttackDamage(attacker, target, isCrit);

    // Apply damage
    const { event: damageEvent } = applyDamage(
        target,
        damage,
        tick,
        attacker.id,
        'physical',
        'attack'
    );
    events.push(damageEvent);

    // Create attack event
    const attackEvent: AttackEvent = {
        type: 'attack',
        tick,
        timestamp: Date.now(),
        attackerId: attacker.id,
        targetId: target.id,
        damage,
        isCrit,
    };
    events.push(attackEvent);

    // Handle crit event
    if (isCrit) {
        events.push({
            type: 'crit',
            tick,
            timestamp: Date.now(),
            attackerId: attacker.id,
            targetId: target.id,
            damage,
            multiplier: attacker.stats.critMultiplier,
        });
    }

    // Apply lifesteal
    if (attacker.stats.lifesteal > 0) {
        const healAmount = Math.floor(damage * attacker.stats.lifesteal);
        if (healAmount > 0) {
            const { event: healEvent } = applyHealing(
                attacker,
                healAmount,
                tick,
                attacker.id,
                'lifesteal'
            );
            events.push(healEvent);
        }
    }

    return events;
}

/**
 * Process Frenzy Loop keystone (crit reduces cooldowns)
 */
function processFrenzyLoop(
    player: PlayerEntity,
    isCrit: boolean,
    tick: number,
    keystoneState: KeystoneState,
    config: SimConfig
): KeystoneProcEvent | null {
    if (!player.keystones.includes('frenzy_loop')) return null;
    if (!isCrit) return null;
    if (keystoneState.frenzyLoopCooldown > 0) return null;

    // Reduce cooldowns by 0.2s (12 ticks at 60 TPS)
    const reductionTicks = Math.floor(0.2 * config.ticksPerSecond);
    // In this simple version, we don't have ability cooldowns yet
    // For now, just track the proc

    // Set internal cooldown (0.5s = 30 ticks at 60 TPS)
    keystoneState.frenzyLoopCooldown = Math.floor(0.5 * config.ticksPerSecond);

    return {
        type: 'keystone_proc',
        tick,
        timestamp: Date.now(),
        entityId: player.id,
        keystoneId: 'frenzy_loop',
        effect: `Reduced cooldowns by ${reductionTicks} ticks`,
    };
}

/**
 * Process Hemorrhage Engine keystone (bleed ticks trigger attacks)
 */
function processHemorrhageEngine(
    player: PlayerEntity,
    enemies: EnemyEntity[],
    tick: number,
    rng: SeededRNG,
    keystoneState: KeystoneState
): CombatEvent[] {
    if (!player.keystones.includes('hemorrhage_engine')) return [];

    // Count bleed ticks on enemies
    let totalBleedTicks = 0;
    for (const enemy of enemies) {
        if (isAlive(enemy)) {
            totalBleedTicks += getBleedStacks(enemy);
        }
    }

    keystoneState.hemorrhageBleedTicks += totalBleedTicks;

    // Every 5 bleed ticks triggers a free attack
    const events: CombatEvent[] = [];
    while (keystoneState.hemorrhageBleedTicks >= 5) {
        keystoneState.hemorrhageBleedTicks -= 5;

        const target = getTarget(enemies);
        if (target && isAlive(player)) {
            events.push({
                type: 'keystone_proc',
                tick,
                timestamp: Date.now(),
                entityId: player.id,
                keystoneId: 'hemorrhage_engine',
                effect: 'Free basic attack from bleed stacks',
            });

            events.push(
                ...processAttack(player, target, tick, rng, keystoneState)
            );
        }
    }

    return events;
}

/**
 * Process Unbreakable keystone (damage reduction when low HP)
 */
function processUnbreakable(
    player: PlayerEntity,
    tick: number,
    keystoneState: KeystoneState
): KeystoneProcEvent | null {
    if (!player.keystones.includes('unbreakable')) return null;
    if (keystoneState.unbreakableUsed) return null;

    const hpPercent = player.stats.hp / player.stats.maxHp;
    if (hpPercent > 0.3) return null;

    // Activate Unbreakable
    keystoneState.unbreakableUsed = true;

    // Apply 20% damage reduction (via armor increase)
    player.stats.arm += player.baseStats.arm * 0.2;

    // Apply 15% lifesteal
    player.stats.lifesteal += 0.15;

    return {
        type: 'keystone_proc',
        tick,
        timestamp: Date.now(),
        entityId: player.id,
        keystoneId: 'unbreakable',
        effect: 'Activated: +20% damage reduction, +15% lifesteal',
    };
}

/**
 * Simulate one tick of combat
 */
export function simulateTick(
    state: CombatState,
    rng: SeededRNG,
    config: SimConfig,
    keystoneState: KeystoneState
): CombatEvent[] {
    const events: CombatEvent[] = [];
    state.tick++;

    // Process DoT effects
    const allEntities = getLivingEntities(state);
    for (const entity of allEntities) {
        const dotEvents = processDoTEffects(
            entity,
            state.tick,
            config.bleedTickRate,
            config.poisonTickRate
        );
        events.push(...dotEvents);
    }

    // Check for deaths from DoT
    for (const enemy of state.enemies) {
        if (!isAlive(enemy) && !enemy.isDead) {
            enemy.isDead = true;
            events.push({
                type: 'death',
                tick: state.tick,
                timestamp: Date.now(),
                entityId: enemy.id,
                killerId: state.player.id,
                xpReward: 50, // TODO: Calculate from enemy data
                goldReward: 25,
            });
        }
    }

    // Check Unbreakable activation
    const unbreakableEvent = processUnbreakable(state.player, state.tick, keystoneState);
    if (unbreakableEvent) events.push(unbreakableEvent);

    // Tick down attack cooldowns and process attacks
    if (isAlive(state.player)) {
        state.player.attackCooldown--;
        if (state.player.attackCooldown <= 0) {
            const target = getTarget(state.enemies);
            if (target) {
                const attackEvents = processAttack(
                    state.player,
                    target,
                    state.tick,
                    rng,
                    keystoneState
                );
                events.push(...attackEvents);

                // Check for Frenzy Loop proc
                const lastAttack = attackEvents.find((e) => e.type === 'attack') as
                    | AttackEvent
                    | undefined;
                if (lastAttack?.isCrit) {
                    const frenzyEvent = processFrenzyLoop(
                        state.player,
                        true,
                        state.tick,
                        keystoneState,
                        config
                    );
                    if (frenzyEvent) events.push(frenzyEvent);
                }

                // Reset attack cooldown
                state.player.attackCooldown = Math.floor(
                    config.ticksPerSecond / state.player.stats.attackSpeed
                );
            }
        }
    }

    // Enemy attacks
    for (const enemy of state.enemies) {
        if (!isAlive(enemy)) continue;

        enemy.attackCooldown--;
        if (enemy.attackCooldown <= 0 && isAlive(state.player)) {
            const attackEvents = processAttack(
                enemy,
                state.player,
                state.tick,
                rng,
                keystoneState
            );
            events.push(...attackEvents);

            enemy.attackCooldown = Math.floor(
                config.ticksPerSecond / enemy.stats.attackSpeed
            );
        }
    }

    // Check for deaths from attacks
    for (const enemy of state.enemies) {
        if (!isAlive(enemy) && !enemy.isDead) {
            enemy.isDead = true;
            events.push({
                type: 'death',
                tick: state.tick,
                timestamp: Date.now(),
                entityId: enemy.id,
                killerId: state.player.id,
                xpReward: 50,
                goldReward: 25,
            });
        }
    }

    // Process Hemorrhage Engine
    const hemorrhageEvents = processHemorrhageEngine(
        state.player,
        state.enemies,
        state.tick,
        rng,
        keystoneState
    );
    events.push(...hemorrhageEvents);

    // Tick down Frenzy Loop internal cooldown
    if (keystoneState.frenzyLoopCooldown > 0) {
        keystoneState.frenzyLoopCooldown--;
    }

    // Tick effect durations
    for (const entity of getLivingEntities(state)) {
        const expiryEvents = tickEffects(entity, state.tick);
        events.push(...expiryEvents);
    }

    // Check for combat end
    if (!isAlive(state.player)) {
        state.isComplete = true;
        state.winner = 'enemies';
    } else if (state.enemies.every((e) => !isAlive(e))) {
        state.isComplete = true;
        state.winner = 'player';
    }

    // Check for timeout
    if (state.tick >= config.maxTicksPerWave) {
        state.isComplete = true;
        state.winner = 'enemies'; // Timeout = loss
    }

    state.events.push(...events);
    return events;
}

/**
 * Create initial keystone state for a wave
 */
export function createKeystoneState(): KeystoneState {
    return {
        frenzyLoopCooldown: 0,
        hemorrhageBleedTicks: 0,
        unbreakableUsed: false,
    };
}

/**
 * Simulate an entire combat to completion
 */
export function simulateCombat(
    player: PlayerEntity,
    enemies: EnemyEntity[],
    rng: SeededRNG,
    config: SimConfig = { ...DEFAULT_SIM_CONFIG }
): CombatState {
    const state = createCombatState(player, enemies);
    const keystoneState = createKeystoneState();

    while (!state.isComplete) {
        simulateTick(state, rng, config, keystoneState);
    }

    return state;
}
