/**
 * Deterministic pseudo-random number generator using mulberry32 algorithm.
 * Ensures reproducible simulations when given the same seed.
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed | 0;
  }

  /** Returns a deterministic float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns true with the given probability (0-1). */
  chance(probability: number): boolean {
    return this.next() < probability;
  }

  /** Returns a deterministic float between min (inclusive) and max (exclusive). */
  between(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Returns a deterministic integer between min and max (both inclusive). */
  intBetween(min: number, max: number): number {
    return Math.floor(this.between(min, max + 1));
  }
}
