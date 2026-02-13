/**
 * Seeded PRNG using the mulberry32 algorithm
 * Provides deterministic random number generation for reproducible runs
 */
export class SeededRNG {
    private state: number;
    private initialSeed: number;

    constructor(seed: number) {
        this.initialSeed = seed;
        this.state = seed;
    }

    /**
     * Returns a random float between 0 (inclusive) and 1 (exclusive)
     */
    next(): number {
        let t = (this.state += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /**
     * Returns a random integer between min (inclusive) and max (inclusive)
     */
    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    /**
     * Returns true with the given probability (0-1)
     */
    chance(probability: number): boolean {
        return this.next() < probability;
    }

    /**
     * Returns a random float between min and max
     */
    nextFloat(min: number, max: number): number {
        return this.next() * (max - min) + min;
    }

    /**
     * Shuffles an array in place using Fisher-Yates
     */
    shuffle<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i);
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    /**
     * Picks a random element from an array
     */
    pick<T>(array: readonly T[]): T {
        return array[this.nextInt(0, array.length - 1)];
    }

    /**
     * Picks n random elements from an array without replacement
     */
    pickN<T>(array: readonly T[], n: number): T[] {
        const copy = [...array];
        this.shuffle(copy);
        return copy.slice(0, Math.min(n, copy.length));
    }

    /**
     * Returns current state for serialization
     */
    getState(): number {
        return this.state;
    }

    /**
     * Returns the initial seed
     */
    getSeed(): number {
        return this.initialSeed;
    }

    /**
     * Restores state from a serialized value
     */
    setState(state: number): void {
        this.state = state;
    }

    /**
     * Resets to initial seed
     */
    reset(): void {
        this.state = this.initialSeed;
    }

    /**
     * Fork this RNG to create a new independent stream
     */
    fork(): SeededRNG {
        return new SeededRNG(this.nextInt(0, 0x7fffffff));
    }
}
