import type { AggregateMetrics } from "../types.ts";

interface MetricsPanelProps {
  metrics: AggregateMetrics | null;
  isRunning: boolean;
}

function MetricCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-2">
      <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
        {label}
      </span>
      <span className={`text-lg font-mono font-bold ${color}`}>{value}</span>
      <span className="text-xs text-[var(--color-text-muted)]">{unit}</span>
    </div>
  );
}

export function MetricsPanel({ metrics, isRunning }: MetricsPanelProps) {
  if (!metrics && !isRunning) {
    return (
      <div className="glass px-6 py-3 text-center text-[var(--color-text-muted)] text-sm">
        Run a simulation to see metrics
      </div>
    );
  }

  const errorRate =
    metrics && metrics.totalRequests > 0
      ? ((metrics.errorCount / metrics.totalRequests) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="glass flex items-center justify-around px-4 py-2 gap-2">
      {isRunning && (
        <div className="flex items-center gap-2 text-[var(--color-accent)] text-sm">
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
          Running
        </div>
      )}
      <MetricCard
        label="Requests"
        value={String(metrics?.totalRequests ?? 0)}
        unit="total"
        color="text-[var(--color-text-primary)]"
      />
      <MetricCard
        label="p50"
        value={String(metrics?.p50LatencyMs ?? 0)}
        unit="ms"
        color="text-[var(--color-success)]"
      />
      <MetricCard
        label="p99"
        value={String(metrics?.p99LatencyMs ?? 0)}
        unit="ms"
        color="text-[var(--color-warning)]"
      />
      <MetricCard
        label="Throughput"
        value={String(metrics?.throughputRps ?? 0)}
        unit="rps"
        color="text-[var(--color-accent)]"
      />
      <MetricCard
        label="Errors"
        value={`${errorRate}%`}
        unit="rate"
        color={
          Number(errorRate) > 5
            ? "text-[var(--color-error)]"
            : "text-[var(--color-success)]"
        }
      />
    </div>
  );
}
