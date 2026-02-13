import type {
    PlayerEntity,
    EnemyEntity,
    RunState,
    WaveState,
    CombatState,
    WaveEndEvent,
    LevelUpEvent,
    SimConfig,
    DEFAULT_SIM_CONFIG,
    ItemInstance,
} from './types.js';
import { SeededRNG } from './rng.js';
import { createPlayer, cloneEntity, calculateLevelUp, getXpForLevel } from './entities.js';
import { simulateCombat, createKeystoneState } from './combat.js';
import { clearEffects } from './effects.js';

/**
 * Create a new run state
 */
export function createRunState(seed: number): RunState {
    const player = createPlayer('player', 'Vanguard');

    return {
        seed,
        currentWave: 0,
        maxWaves: 10,
        player,
        selectedRelic: '',
        completedWaves: [],
        totalXpEarned: 0,
        totalGoldEarned: 0,
        itemsCollected: [],
        perksSelected: [],
        isComplete: false,
        isVictory: false,
        startTime: Date.now(),
    };
}

/**
 * Generate perk offerings for the player
 */
export function generatePerkOfferings(
    run: RunState,
    rng: SeededRNG,
    availablePerks: string[]
): string[] {
    const unselected = availablePerks.filter(
        (p) => !run.perksSelected.includes(p)
    );
    return rng.pickN(unselected, 3);
}

/**
 * Generate item offerings for the player
 */
export function generateItemOfferings(
    run: RunState,
    rng: SeededRNG,
    waveNumber: number
): ItemInstance[] {
    // Higher waves have better rarity chances
    const rarityWeights = {
        common: Math.max(0, 60 - waveNumber * 5),
        rare: 25 + waveNumber * 2,
        epic: 10 + waveNumber * 2,
        legendary: 5 + waveNumber,
    };

    const items: ItemInstance[] = [];
    const slots: Array<'weapon' | 'armor' | 'trinket'> = ['weapon', 'armor', 'trinket'];

    for (let i = 0; i < 3; i++) {
        const totalWeight = Object.values(rarityWeights).reduce((a, b) => a + b, 0);
        let roll = rng.next() * totalWeight;

        let rarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common';
        for (const [r, weight] of Object.entries(rarityWeights)) {
            roll -= weight;
            if (roll <= 0) {
                rarity = r as typeof rarity;
                break;
            }
        }

        items.push({
            itemId: `item_${waveNumber}_${i}`, // Placeholder - will be replaced with actual items
            slot: rng.pick(slots),
            rarity,
        });
    }

    return items;
}

/**
 * Select a relic for the run
 */
export function selectRelic(run: RunState, relicId: string): void {
    run.selectedRelic = relicId;
}

/**
 * Select a perk during intermission
 */
export function selectPerk(run: RunState, perkId: string): void {
    if (!run.perksSelected.includes(perkId)) {
        run.perksSelected.push(perkId);
    }
}

/**
 * Equip an item to the player
 */
export function equipItem(run: RunState, item: ItemInstance): void {
    // Remove existing item in same slot
    run.player.items = run.player.items.filter((i) => i.slot !== item.slot);
    run.player.items.push(item);
    run.itemsCollected.push(item.itemId);
}

/**
 * Allocate a skill point
 */
export function allocateSkillPoint(
    run: RunState,
    skillId: string,
    maxPointsPerSkill: number = 5
): boolean {
    if (run.player.skillPoints <= 0) return false;

    const current = run.player.allocatedSkills[skillId] ?? 0;
    if (current >= maxPointsPerSkill) return false;

    run.player.allocatedSkills[skillId] = current + 1;
    run.player.skillPoints--;
    return true;
}

/**
 * Respec all skill points
 */
export function respec(run: RunState): number {
    const pointsSpent = Object.values(run.player.allocatedSkills).reduce(
        (a, b) => a + b,
        0
    );

    const cost = 50 + pointsSpent * 10;

    if (run.player.gold < cost) return -1;

    run.player.gold -= cost;
    run.player.skillPoints += pointsSpent;
    run.player.allocatedSkills = {};

    return cost;
}

/**
 * Process wave completion rewards
 */
export function processWaveRewards(
    run: RunState,
    wave: WaveState,
    combatState: CombatState
): { xp: number; gold: number; leveledUp: boolean; levelsGained: number } {
    const xp = wave.rewards.xp;
    const gold = wave.rewards.gold;

    run.totalXpEarned += xp;
    run.totalGoldEarned += gold;
    run.player.gold += gold;

    // Process XP and level ups
    const { newLevel, newXp, levelsGained } = calculateLevelUp(
        run.player.level,
        run.player.xp,
        xp
    );

    const leveledUp = levelsGained > 0;

    run.player.level = newLevel;
    run.player.xp = newXp;
    run.player.xpToNextLevel = getXpForLevel(newLevel);
    run.player.skillPoints += levelsGained;

    // Collect item drops
    for (const itemId of wave.rewards.items) {
        run.itemsCollected.push(itemId);
    }

    return { xp, gold, leveledUp, levelsGained };
}

/**
 * Prepare player for next wave
 */
export function prepareForNextWave(run: RunState): void {
    // Clear status effects between waves
    clearEffects(run.player);

    // Restore HP to max
    run.player.stats.hp = run.player.stats.maxHp;

    // Reset attack cooldown
    run.player.attackCooldown = 0;

    // Reset Unbreakable keystone
    // (keystoneState is per-wave, created fresh in combat)
}

/**
 * Check if should offer item (pity timer)
 */
export function shouldOfferItem(run: RunState, pityTimer: number): boolean {
    // Find last wave with item drop
    let wavesSinceItem = run.currentWave;

    for (let i = run.completedWaves.length - 1; i >= 0; i--) {
        // Would need to track this more specifically
        // For now, just check every 2 waves
        if ((run.currentWave + 1) % 2 === 0) return true;
    }

    return wavesSinceItem >= pityTimer;
}

/**
 * Advance to next wave
 */
export function advanceWave(run: RunState): number {
    run.currentWave++;
    return run.currentWave;
}

/**
 * Complete the run
 */
export function completeRun(run: RunState, isVictory: boolean): void {
    run.isComplete = true;
    run.isVictory = isVictory;
    run.endTime = Date.now();
}

/**
 * Generate run summary for display
 */
export function generateRunSummary(run: RunState): {
    seed: number;
    wavesCleared: number;
    maxWaves: number;
    finalLevel: number;
    totalXp: number;
    totalGold: number;
    itemsFound: number;
    perksChosen: number;
    isVictory: boolean;
    duration: number;
} {
    return {
        seed: run.seed,
        wavesCleared: run.completedWaves.length,
        maxWaves: run.maxWaves,
        finalLevel: run.player.level,
        totalXp: run.totalXpEarned,
        totalGold: run.totalGoldEarned,
        itemsFound: run.itemsCollected.length,
        perksChosen: run.perksSelected.length,
        isVictory: run.isVictory,
        duration: (run.endTime ?? Date.now()) - run.startTime,
    };
}
