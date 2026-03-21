import type { AggregateMetrics } from "../stream/types.js";

/**
 * Collects per-request metrics and computes aggregate statistics
 * including percentile latencies and throughput.
 */
export class MetricCollector {
  private latencies: number[] = [];
  private successCount = 0;
  private errorCount = 0;
  private startTimeMs = 0;
  private endTimeMs = 0;

  /** Mark the start of the measurement period. */
  start(): void {
    this.startTimeMs = Date.now();
  }

  /** Mark the end of the measurement period. */
  stop(): void {
    this.endTimeMs = Date.now();
  }

  /** Record a request's latency in milliseconds. */
  recordLatency(ms: number): void {
    this.latencies.push(ms);
  }

  /** Record a successful request. */
  recordSuccess(): void {
    this.successCount++;
  }

  /** Record a failed request. */
  recordError(): void {
    this.errorCount++;
  }

  /** Compute aggregate metrics from collected data. */
  getAggregateMetrics(): AggregateMetrics {
    const durationSec = Math.max(
      (this.endTimeMs - this.startTimeMs) / 1000,
      0.001,
    );

    return {
      totalRequests: this.successCount + this.errorCount,
      successCount: this.successCount,
      errorCount: this.errorCount,
      p50LatencyMs: this.percentile(50),
      p99LatencyMs: this.percentile(99),
      throughputRps: Math.round(
        (this.successCount + this.errorCount) / durationSec,
      ),
    };
  }

  /** Reset all collected data. */
  reset(): void {
    this.latencies = [];
    this.successCount = 0;
    this.errorCount = 0;
    this.startTimeMs = 0;
    this.endTimeMs = 0;
  }

  private percentile(p: number): number {
    if (this.latencies.length === 0) return 0;

    const sorted = [...this.latencies].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] ?? 0;
  }
}
