import { Stats, StatsSchema } from '@anime-autobattler/content';
import { StatusEffect, StatusEffectType } from './status.js';

export class Entity {
  public id: string;
  public name: string;
  public level: number = 1;
  public stats: Stats;
  public currentHp: number;
  public maxHp: number;
  public cooldowns: Map<string, number> = new Map(); // abilityName -> ticksRemaining
  public attackCooldown: number = 0; // ticks until next auto-attack
  public effects: StatusEffect[] = [];
  public isDead: boolean = false;

  // Resources
  public shield: number = 0;

  // Mechanics tracking
  public bleedTicks: number = 0; // For Hemorrhage Engine
  public lastFrenzyTime: number = -999; // For Frenzy Loop (internal CD)
  public unbreakableTriggered: boolean = false; // For Unbreakable (once per wave)

  constructor(id: string, name: string, baseStats: Stats) {
    this.id = id;
    this.name = name;
    this.stats = { ...baseStats };
    this.maxHp = this.stats.maxHp;
    this.currentHp = this.maxHp;
  }

  public addStatus(effect: StatusEffect) {
    // Check if stackable
    const existing = this.effects.find(e => e.type === effect.type && e.sourceId === effect.sourceId);
    if (existing) {
        existing.stacks += effect.stacks;
        if (effect.duration) existing.duration = effect.duration; // Refresh duration
    } else {
        this.effects.push(effect);
    }
  }

  public getStatusStacks(type: StatusEffectType): number {
      return this.effects.filter(e => e.type === type).reduce((acc, e) => acc + e.stacks, 0);
  }

  public takeDamage(amount: number, isPhysical: boolean): number {
    let mitigation = isPhysical ? this.stats.arm : this.stats.res;

    if (mitigation < 0) mitigation = 0;

    // Vulnerable check
    // Vulnerable (+% damage taken). Assuming 1 stack = +X%? Spec doesn't define amount per stack.
    // Let's assume generic "Vulnerable" status means +20% dmg taken (commonly).
    // OR status value holds the %.
    // Let's iterate effects to find vulnerability multiplier
    let vulnMultiplier = 1.0;
    for (const eff of this.effects) {
        if (eff.type === 'vulnerable') {
            vulnMultiplier += (eff.value / 100) * eff.stacks; // e.g. 10% * 1 stack
        }
    }

    // Unbreakable DR check (if we applied a buff status for it)
    let drMultiplier = 1.0;
    if (this.effects.some(e => e.type === 'buff' && e.sourceId === this.id)) {
        // Assuming this is Unbreakable
        drMultiplier = 0.8; // 20% reduction
    }

    const mitigationMultiplier = 100 / (100 + mitigation);
    let finalDamage = amount * mitigationMultiplier * vulnMultiplier * drMultiplier;

    // Shield absorption
    if (this.shield > 0) {
      if (this.shield >= finalDamage) {
        this.shield -= finalDamage;
        finalDamage = 0;
      } else {
        finalDamage -= this.shield;
        this.shield = 0;
      }
    }

    this.currentHp -= finalDamage;
    if (this.currentHp <= 0) {
        this.currentHp = 0;
        this.isDead = true;
    }
    return finalDamage;
  }

  public heal(amount: number) {
    if (this.isDead) return;
    this.currentHp = Math.min(this.currentHp + amount, this.maxHp);
  }

  public tickCooldowns(delta: number = 1) {
    if (this.attackCooldown > 0) {
      this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    }
    for (const [key, val] of this.cooldowns) {
      if (val > 0) {
        this.cooldowns.set(key, Math.max(0, val - delta));
      }
    }
  }

  public reduceCooldowns(amountSeconds: number, tps: number) {
      const ticks = Math.floor(amountSeconds * tps);
      for (const [key, val] of this.cooldowns) {
          if (val > 0) {
              this.cooldowns.set(key, Math.max(0, val - ticks));
          }
      }
      // Also reduce attack cooldown? Usually attack speed is separate, but Frenzy Loop says "all cooldowns".
      // Let's affect attack cooldown too for "Blade Dance" theme.
      if (this.attackCooldown > 0) {
          this.attackCooldown = Math.max(0, this.attackCooldown - ticks);
      }
  }
}
