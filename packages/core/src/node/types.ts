import type { NodeMetrics } from "../stream/types.js";

export interface NodeConfig {
  name: string;
  role: string;
  latencyMs?: number;
  failureRate?: number;
  capacity?: number;
  initialState?: string;
}

export interface SimulationRequest {
  id: string;
  payload: string;
  metadata?: Record<string, unknown>;
}

export interface NodeResult {
  output: string;
  durationMs: number;
  success: boolean;
  metrics: NodeMetrics;
}
