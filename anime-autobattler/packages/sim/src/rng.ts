// Mulberry32 seeded RNG
export class RNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  // Returns a float between 0 and 1
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Returns an integer between min and max (inclusive)
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Returns true with a given probability (0-1)
  check(probability: number): boolean {
    return this.next() < probability;
  }
}
