import { describe, it, expect } from 'vitest';
import { RunManager } from '../src';

describe('Determinism', () => {
    it('should produce identical logs for same seed', () => {
        const seed = 12345;

        // Run 1
        const run1 = new RunManager(seed);
        run1.startWave(); // Wave 1
        let ticks1 = 0;
        while(run1.phase === 'combat' && ticks1 < 1000) {
            run1.tick();
            ticks1++;
        }
        const logs1 = run1.combat?.log.getLogs() || [];

        // Run 2
        const run2 = new RunManager(seed);
        run2.startWave(); // Wave 1
        let ticks2 = 0;
        while(run2.phase === 'combat' && ticks2 < 1000) {
            run2.tick();
            ticks2++;
        }
        const logs2 = run2.combat?.log.getLogs() || [];

        expect(logs1.length).toBe(logs2.length);

        for(let i=0; i<logs1.length; i++) {
            expect(logs1[i]).toEqual(logs2[i]);
        }
    });
});
