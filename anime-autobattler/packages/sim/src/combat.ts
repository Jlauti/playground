import { Entity } from './entity.js';
import { RNG } from './rng.js';
import { CombatLog } from './combat_log.js';

export const TICKS_PER_SECOND = 30;

export class CombatState {
  public player: Entity;
  public enemies: Entity[] = [];
  public rng: RNG;
  public log: CombatLog;
  public currentTick: number = 0;

  constructor(seed: number, player: Entity, enemies: Entity[]) {
    this.rng = new RNG(seed);
    this.player = player;
    this.enemies = enemies;
    this.log = new CombatLog();
  }

  public tick() {
    this.currentTick++;

    // 1. Tick Player
    this.tickEntity(this.player, this.enemies);

    // 2. Tick Enemies
    this.enemies = this.enemies.filter(e => !e.isDead);

    for (const enemy of this.enemies) {
      this.tickEntity(enemy, [this.player]);
    }

    // 3. Process Status Effects (DoTs)
    this.processStatusEffects(this.player);
    for (const enemy of this.enemies) {
        this.processStatusEffects(enemy);
    }

    // 4. Check Win/Loss
    if (this.player.isDead) {
      this.log.add({ tick: this.currentTick, type: 'waveEnd', message: 'Player Died' });
      return;
    }
    if (this.enemies.length === 0) {
      this.log.add({ tick: this.currentTick, type: 'waveEnd', message: 'Wave Cleared' });
      return;
    }
  }

  private tickEntity(actor: Entity, targets: Entity[]) {
    if (actor.isDead) return;

    actor.tickCooldowns(1);

    // Unbreakable Check (Iron Veil Keystone)
    if (actor.id === 'player' && !actor.unbreakableTriggered && actor.currentHp < actor.maxHp * 0.3) {
        // Apply Buff
        // +20% DR via armor/res? Or a special status?
        // Let's add a "buff" status that modifies stats logic ideally, but for MVP:
        // We can just add a permanent status that gives stats? Or hardcode the effect.
        // Let's add a status "Unbreakable"
        actor.unbreakableTriggered = true;
        actor.addStatus({ type: 'buff', stacks: 1, value: 0, duration: undefined, sourceId: actor.id }); // Value 0 as placeholder, logic in Entity handles it or we modify stats directly
        // Modifying stats directly:
        // "gain 20% damage reduction" -> usually implies modifying incoming dmg formula or +Armor.
        // " +15% lifesteal"
        actor.stats.lifesteal += 15;
        // DR handled in takeDamage or simply add Armor?
        // 20% DR = x0.8 multiplier.
        // Let's hack it into takeDamage via the buff status check.
        this.log.add({ tick: this.currentTick, type: 'effect', sourceId: actor.id, message: 'Unbreakable triggered!' });
    }

    // Basic Attack Logic
    if (actor.attackCooldown <= 0 && targets.length > 0) {
      const target = targets[0];
      if (target) {
        this.performAttack(actor, target);
        const attackTime = 1 / actor.stats.as;
        actor.attackCooldown = Math.floor(attackTime * TICKS_PER_SECOND);
      }
    }
  }

  private performAttack(attacker: Entity, target: Entity) {
    // 1. Roll Crit
    const isCrit = this.rng.check(attacker.stats.critChance / 100);
    let damage = attacker.stats.atk;
    if (isCrit) {
      damage *= attacker.stats.critMultiplier;

      // Frenzy Loop (Blade Dance Keystone)
      if (attacker.id === 'player') {
          // Check internal CD (0.5s = 15 ticks at 30tps)
          const icdTicks = 0.5 * TICKS_PER_SECOND;
          if (this.currentTick - attacker.lastFrenzyTime >= icdTicks) {
              attacker.lastFrenzyTime = this.currentTick;
              attacker.reduceCooldowns(0.2, TICKS_PER_SECOND);
              // Also logs?
          }
      }
    }

    // 2. Apply Damage
    const dealt = target.takeDamage(damage, true);

    // 3. Log
    this.log.add({
      tick: this.currentTick,
      type: 'damage',
      sourceId: attacker.id,
      targetId: target.id,
      value: dealt,
      message: `${attacker.name} attacked ${target.name} for ${dealt.toFixed(1)} ${isCrit ? '(Crit!)' : ''}`
    });

    if (target.isDead) {
       this.log.add({
         tick: this.currentTick,
         type: 'death',
         targetId: target.id,
         message: `${target.name} died`
       });
    }

    // Lifesteal
    if (attacker.stats.lifesteal > 0) {
        const healAmount = dealt * (attacker.stats.lifesteal / 100);
        if (healAmount > 0) {
            attacker.heal(healAmount);
             this.log.add({
                tick: this.currentTick,
                type: 'heal',
                sourceId: attacker.id,
                targetId: attacker.id,
                value: healAmount,
                message: `${attacker.name} healed for ${healAmount.toFixed(1)}`
            });
        }
    }
  }

  private processStatusEffects(entity: Entity) {
      if (entity.isDead) return;

      // Filter out expired
      entity.effects = entity.effects.filter(e => e.duration === undefined || e.duration > 0);

      for (const effect of entity.effects) {
          if (effect.duration) effect.duration--;

          if (effect.type === 'bleed' || effect.type === 'poison') {
              // Apply DoT
              // Typically DoTs tick once per second, not every simulation tick (30/60Hz).
              // Let's check modulo TICKS_PER_SECOND.
              if (this.currentTick % TICKS_PER_SECOND === 0) {
                  const dmg = effect.value * effect.stacks;
                  // Bleed is physical, Poison is magic usually.
                  const isPhys = effect.type === 'bleed';
                  const dealt = entity.takeDamage(dmg, isPhys);

                  this.log.add({
                      tick: this.currentTick,
                      type: 'damage',
                      targetId: entity.id,
                      sourceId: effect.sourceId,
                      value: dealt,
                      message: `${entity.name} took ${dealt.toFixed(1)} ${effect.type} damage`
                  });

                   if (entity.currentHp <= 0) {
                       entity.isDead = true;
                        this.log.add({
                            tick: this.currentTick,
                            type: 'death',
                            targetId: entity.id,
                            message: `${entity.name} died from ${effect.type}`
                        });
                   }

                   // Hemorrhage Engine (Bloodcraft Keystone)
                   // "Every 5 bleed ticks triggers a free basic attack"
                   // We need to attribute the bleed tick to the source.
                   // If source is player and player has Keystone...
                   if (effect.type === 'bleed' && effect.sourceId === this.player.id) {
                       this.player.bleedTicks++;
                       if (this.player.bleedTicks >= 5) {
                           // Trigger free attack on 'entity'
                           // TODO: Verify if source is alive
                           this.performAttack(this.player, entity);
                           this.player.bleedTicks = 0;
                           this.log.add({
                               tick: this.currentTick,
                               type: 'effect',
                               sourceId: this.player.id,
                               message: `Hemorrhage Engine triggered!`
                           });
                       }
                   }
              }
          }
      }
  }
}
