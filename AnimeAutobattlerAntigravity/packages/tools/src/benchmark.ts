#!/usr/bin/env node
/**
 * Benchmark CLI for headless simulation runs
 * Usage: pnpm sim:benchmark --seed 123
 */

import {
    SeededRNG,
    createEnemy,
    simulateCombat,
    DEFAULT_SIM_CONFIG,
    createRunState,
    type EnemyEntity,
} from '@anime-autobattler/sim';

// Parse arguments
const args = process.argv.slice(2);
let seed = Math.floor(Math.random() * 0x7fffffff);

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--seed' && args[i + 1]) {
        seed = parseInt(args[i + 1], 10);
    }
}

console.log(`\n╔══════════════════════════════════════╗`);
console.log(`║  Anime Autobattler - Benchmark CLI   ║`);
console.log(`╚══════════════════════════════════════╝\n`);

// Create run
const run = createRunState(seed);
const rng = new SeededRNG(seed);

console.log(`Seed: ${seed}`);
console.log(`Starting benchmark run...\n`);

const startTime = performance.now();
let totalEvents = 0;
let wavesCleared = 0;

// Simulate all 10 waves
for (let wave = 1; wave <= 10; wave++) {
    const waveRng = new SeededRNG(seed + wave);

    // Create enemies for this wave
    const enemyCount = Math.min(3 + Math.floor(wave / 2), 5);
    const enemies: EnemyEntity[] = [];

    for (let i = 0; i < enemyCount; i++) {
        const hp = 30 + wave * 15;
        const atk = 5 + wave * 3;

        enemies.push(
            createEnemy(
                `enemy_${wave}_${i}`,
                wave === 10 ? 'kurogane_warden' : 'shadow_imp',
                wave === 10 ? 'Kurogane Warden' : `Shadow Imp ${i + 1}`,
                {
                    hp: wave === 10 ? 500 : hp,
                    maxHp: wave === 10 ? 500 : hp,
                    atk: wave === 10 ? 18 : atk,
                    arm: wave === 10 ? 30 : 2 + wave,
                    attackSpeed: wave === 10 ? 0.6 : 0.8 + wave * 0.05,
                    critChance: 0.05,
                    critMultiplier: 1.5,
                    pwr: 0,
                    res: 2,
                    cdr: 0,
                    lifesteal: 0,
                    evasion: 0.02,
                },
                {
                    isBoss: wave === 10,
                    position: { x: 600 + i * 80, y: 250 + i * 40 }
                }
            )
        );
    }

    // Scale player stats per wave (simulating level ups)
    const player = { ...run.player };
    player.stats = { ...player.stats };
    player.stats.maxHp = 100 + wave * 20;
    player.stats.hp = player.stats.maxHp;
    player.stats.atk = 10 + wave * 3;
    player.stats.arm = 5 + wave * 2;
    player.attackCooldown = 30;

    // Run combat
    const combat = simulateCombat(player, enemies, waveRng, DEFAULT_SIM_CONFIG);
    totalEvents += combat.events.length;

    if (combat.winner === 'player') {
        wavesCleared++;
        console.log(`  Wave ${wave}: ✓ Victory (${combat.events.length} events, ${combat.tick} ticks)`);
    } else {
        console.log(`  Wave ${wave}: ✗ Defeat (${combat.events.length} events, ${combat.tick} ticks)`);
        break;
    }
}

const endTime = performance.now();
const duration = endTime - startTime;

console.log(`\n${'─'.repeat(40)}`);
console.log(`\nRun Summary (seed: ${seed})`);
console.log(`${'═'.repeat(40)}`);
console.log(`Waves Cleared:    ${wavesCleared}/10`);
console.log(`Boss Defeated:    ${wavesCleared === 10 ? 'Yes' : 'No'}`);
console.log(`Combat Events:    ${totalEvents.toLocaleString()}`);
console.log(`Simulation Time:  ${duration.toFixed(2)}ms`);
console.log(`Events/ms:        ${(totalEvents / duration).toFixed(1)}`);
console.log(`\n✨ Benchmark complete!\n`);
