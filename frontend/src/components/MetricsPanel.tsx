import type { AggregateMetrics } from "../types.ts";

interface MetricsPanelProps {
  metrics: AggregateMetrics | null;
  isRunning: boolean;
}

export function MetricsPanel({ metrics, isRunning }: MetricsPanelProps) {
  if (!metrics && !isRunning) return null;

  const errorRate =
    metrics && metrics.totalRequests > 0
      ? ((metrics.errorCount / metrics.totalRequests) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 text-[11px] font-mono">
      {isRunning && (
        <span className="flex items-center gap-1.5 text-[var(--color-accent)] font-sans font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          Running
        </span>
      )}
      <span className="text-[var(--color-text-secondary)]">
        {metrics?.totalRequests ?? 0} req
      </span>
      <span className="text-emerald-600">
        p50 {metrics?.p50LatencyMs ?? 0}ms
      </span>
      <span className="text-amber-600">
        p99 {metrics?.p99LatencyMs ?? 0}ms
      </span>
      <span className="text-[var(--color-accent)]">
        {metrics?.throughputRps ?? 0} rps
      </span>
      <span className={Number(errorRate) > 5 ? "text-red-600" : "text-emerald-600"}>
        {errorRate}% err
      </span>
    </div>
  );
}
