import {
    SkillsDataSchema,
    PerksDataSchema,
    ItemsDataSchema,
    EnemiesDataSchema,
    WavesDataSchema,
    RelicsDataSchema,
    type SkillsData,
    type PerksData,
    type ItemsData,
    type EnemiesData,
    type WavesData,
    type RelicsData,
} from './schemas.js';

// Import JSON data
import skillsJson from '../data/skills.json';
import perksJson from '../data/perks.json';
import itemsJson from '../data/items.json';
import enemiesJson from '../data/enemies.json';
import wavesJson from '../data/waves.json';
import relicsJson from '../data/relics.json';

/**
 * Validate and load skills data
 */
export function loadSkills(): SkillsData {
    return SkillsDataSchema.parse(skillsJson);
}

/**
 * Validate and load perks data
 */
export function loadPerks(): PerksData {
    return PerksDataSchema.parse(perksJson);
}

/**
 * Validate and load items data
 */
export function loadItems(): ItemsData {
    return ItemsDataSchema.parse(itemsJson);
}

/**
 * Validate and load enemies data
 */
export function loadEnemies(): EnemiesData {
    return EnemiesDataSchema.parse(enemiesJson);
}

/**
 * Validate and load waves data
 */
export function loadWaves(): WavesData {
    return WavesDataSchema.parse(wavesJson);
}

/**
 * Validate and load relics data
 */
export function loadRelics(): RelicsData {
    return RelicsDataSchema.parse(relicsJson);
}

/**
 * Load all content and validate
 */
export function loadAllContent() {
    return {
        skills: loadSkills(),
        perks: loadPerks(),
        items: loadItems(),
        enemies: loadEnemies(),
        waves: loadWaves(),
        relics: loadRelics(),
    };
}

/**
 * Validate all content without throwing (returns errors)
 */
export function validateAllContent(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
        loadSkills();
    } catch (e) {
        errors.push(`Skills validation failed: ${e}`);
    }

    try {
        loadPerks();
    } catch (e) {
        errors.push(`Perks validation failed: ${e}`);
    }

    try {
        loadItems();
    } catch (e) {
        errors.push(`Items validation failed: ${e}`);
    }

    try {
        loadEnemies();
    } catch (e) {
        errors.push(`Enemies validation failed: ${e}`);
    }

    try {
        loadWaves();
    } catch (e) {
        errors.push(`Waves validation failed: ${e}`);
    }

    try {
        loadRelics();
    } catch (e) {
        errors.push(`Relics validation failed: ${e}`);
    }

    return { valid: errors.length === 0, errors };
}
