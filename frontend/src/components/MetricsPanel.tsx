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
    <div className="flex flex-col items-center gap-0.5 px-4 py-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
        {label}
      </span>
      <span className={`text-base font-mono font-semibold ${color}`}>
        {value}
      </span>
      <span className="text-[10px] text-[var(--color-text-tertiary)]">
        {unit}
      </span>
    </div>
  );
}

export function MetricsPanel({ metrics, isRunning }: MetricsPanelProps) {
  if (!metrics && !isRunning) {
    return (
      <div className="glass-card rounded-xl px-5 py-2.5 text-center text-[var(--color-text-tertiary)] text-[12px]">
        Run a simulation to see metrics
      </div>
    );
  }

  const errorRate =
    metrics && metrics.totalRequests > 0
      ? ((metrics.errorCount / metrics.totalRequests) * 100).toFixed(1)
      : "0.0";

  return (
    <div className="glass-card rounded-xl flex items-center justify-around px-3 py-1">
      {isRunning && (
        <div className="flex items-center gap-2 text-[var(--color-accent)] text-[12px] font-medium">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
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
        color="text-emerald-600"
      />
      <MetricCard
        label="p99"
        value={String(metrics?.p99LatencyMs ?? 0)}
        unit="ms"
        color="text-amber-600"
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
            ? "text-red-600"
            : "text-emerald-600"
        }
      />
    </div>
  );
}
