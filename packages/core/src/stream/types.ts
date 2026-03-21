export interface NodeMetrics {
  requestsHandled: number;
  errorsCount: number;
  avgLatencyMs: number;
}

export interface AggregateMetrics {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  p50LatencyMs: number;
  p99LatencyMs: number;
  throughputRps: number;
}

export type SimulationEvent =
  | { type: "node_start"; node: string; role: string; state?: string }
  | { type: "processing"; node: string; requestId: string; detail: string }
  | {
      type: "request_flow";
      from: string;
      to: string;
      requestId: string;
      label?: string;
    }
  | {
      type: "node_state_change";
      node: string;
      from: string;
      to: string;
      reason: string;
    }
  | {
      type: "node_end";
      node: string;
      durationMs: number;
      metrics: NodeMetrics;
    }
  | {
      type: "metric";
      name: string;
      value: number;
      unit: string;
      node?: string;
    }
  | { type: "error"; node: string; message: string; recoverable: boolean }
  | {
      type: "done";
      totalDurationMs: number;
      aggregateMetrics: AggregateMetrics;
    };

export interface SimulationEmitter {
  emit(event: SimulationEvent): void;
}
