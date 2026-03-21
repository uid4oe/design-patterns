/**
 * Virtual clock for simulations. Advances time without real-world delays
 * by default, with optional real-time pacing for visualization.
 */
export class SimulationClock {
  private currentMs = 0;

  /** Returns the current virtual time in milliseconds. */
  now(): number {
    return this.currentMs;
  }

  /** Advances virtual time by the given number of milliseconds. */
  advance(ms: number): void {
    this.currentMs += ms;
  }

  /** Resets the clock to zero. */
  reset(): void {
    this.currentMs = 0;
  }

  /**
   * Simulated delay: advances virtual time and optionally pauses real time
   * for visualization purposes. Real-time delay is capped at 50ms to keep
   * simulations responsive.
   */
  async delay(ms: number, realTime = false): Promise<void> {
    this.advance(ms);
    if (realTime && ms > 0) {
      await new Promise<void>((resolve) =>
        setTimeout(resolve, Math.min(ms, 50)),
      );
    }
  }
}
