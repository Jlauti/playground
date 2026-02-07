import { describe, it, expect } from 'vitest';
import { Entity, CombatState, StatusEffect } from '../src';

describe('Mechanics', () => {
    it('should apply Bleed damage and stack', () => {
        const p = new Entity('p', 'Player', { hp: 100, maxHp: 100, atk: 10, arm: 0, res: 0, as: 1, critChance: 0, critMultiplier: 1.5, pwr: 0, cdr: 0, lifesteal: 0, evasion: 0 });
        const e = new Entity('e', 'Enemy', { hp: 100, maxHp: 100, atk: 0, arm: 0, res: 0, as: 1, critChance: 0, critMultiplier: 1.5, pwr: 0, cdr: 0, lifesteal: 0, evasion: 0 });

        const combat = new CombatState(123, p, [e]);

        // Add Bleed: 10 dmg per tick, 2 stacks
        e.addStatus({ type: 'bleed', stacks: 2, value: 5, sourceId: p.id, duration: 5 });

        // Tick 30 times (1 second)
        for(let i=0; i<30; i++) combat.tick();

        // Expected damage: 5 * 2 = 10 damage.
        expect(e.currentHp).toBe(90);
    });

    it('should apply Shield absorption', () => {
        const p = new Entity('p', 'Player', { hp: 100, maxHp: 100, atk: 10, arm: 0, res: 0, as: 1, critChance: 0, critMultiplier: 1.5, pwr: 0, cdr: 0, lifesteal: 0, evasion: 0 });
        const e = new Entity('e', 'Enemy', { hp: 100, maxHp: 100, atk: 0, arm: 0, res: 0, as: 1, critChance: 0, critMultiplier: 1.5, pwr: 0, cdr: 0, lifesteal: 0, evasion: 0 });

        e.shield = 5;
        p.stats.atk = 10;

        const combat = new CombatState(123, p, [e]);

        // Force attack: reduce cooldown
        p.attackCooldown = 0;
        combat.tick(); // Player attacks Enemy

        // Damage 10. Shield 5.
        // Shield absorbs 5, breaks. Remaining 5 damage to HP.
        expect(e.shield).toBe(0);
        expect(e.currentHp).toBe(95);
    });

    it('should apply Vulnerable damage increase', () => {
        const p = new Entity('p', 'Player', { hp: 100, maxHp: 100, atk: 10, arm: 0, res: 0, as: 1, critChance: 0, critMultiplier: 1.5, pwr: 0, cdr: 0, lifesteal: 0, evasion: 0 });
        const e = new Entity('e', 'Enemy', { hp: 100, maxHp: 100, atk: 0, arm: 0, res: 0, as: 1, critChance: 0, critMultiplier: 1.5, pwr: 0, cdr: 0, lifesteal: 0, evasion: 0 });

        // Add Vulnerable: +20% dmg
        e.addStatus({ type: 'vulnerable', stacks: 1, value: 20, duration: 5 });

        const combat = new CombatState(123, p, [e]);
        p.attackCooldown = 0;
        combat.tick();

        // Damage 10 * 1.2 = 12
        expect(e.currentHp).toBe(88);
    });

    it('should handle Crit damage', () => {
         const p = new Entity('p', 'Player', { hp: 100, maxHp: 100, atk: 10, arm: 0, res: 0, as: 1, critChance: 100, critMultiplier: 2.0, pwr: 0, cdr: 0, lifesteal: 0, evasion: 0 });
         const e = new Entity('e', 'Enemy', { hp: 100, maxHp: 100, atk: 0, arm: 0, res: 0, as: 1, critChance: 0, critMultiplier: 1.5, pwr: 0, cdr: 0, lifesteal: 0, evasion: 0 });

         const combat = new CombatState(123, p, [e]);
         p.attackCooldown = 0;
         combat.tick();

         // Damage 10 * 2.0 = 20
         expect(e.currentHp).toBe(80);
    });
});
