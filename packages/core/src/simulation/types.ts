import type { AggregateMetrics, SimulationEmitter } from "../stream/types.js";

export interface ScenarioConfig {
  requestCount: number;
  requestsPerSecond: number;
  durationMs?: number;
  failureInjection?: {
    nodeFailures?: Record<string, number>;
    networkLatency?: Record<string, number>;
    partitions?: string[][];
  };
  seed?: number;
}

export interface RequestResult {
  requestId: string;
  success: boolean;
  latencyMs: number;
  path: string[];
  error?: string;
}

export interface SimulationResult {
  totalDurationMs: number;
  requestResults: RequestResult[];
}

export interface PatternSimulator {
  run(
    scenario: ScenarioConfig,
    emitter: SimulationEmitter,
  ): Promise<{ result: SimulationResult; metrics: AggregateMetrics }>;
}
