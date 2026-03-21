import type { TopologyNode, TopologyEdge } from "../types.ts";

interface SimulationFlowSummaryProps {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  isRunning: boolean;
}

const STATE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  idle: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  active: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  healthy: { bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  degraded: { bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  failed: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
};

function NodeAvatar({ node }: { node: TopologyNode }) {
  const colors = STATE_COLORS[node.state] ?? STATE_COLORS["idle"];
  const initials = node.id
    .split("-")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);

  return (
    <div className="relative">
      <div
        className={`h-8 w-8 rounded-full ${colors.bg} ${colors.text} flex items-center justify-center shrink-0`}
      >
        <span className="text-[10px] font-semibold">{initials}</span>
      </div>
      <span
        className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-white ${colors.dot} ${
          node.state === "active" ? "animate-pulse" : ""
        }`}
      />
    </div>
  );
}

function FlowArrow({ edge }: { edge: TopologyEdge | undefined }) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 px-1 shrink-0">
      <svg width="20" height="10" viewBox="0 0 20 10" className="text-[var(--color-text-tertiary)]">
        <path d="M0 5 L15 5 M12 2 L15 5 L12 8" stroke="currentColor" fill="none" strokeWidth={1.5} />
      </svg>
      {edge && edge.requestCount > 0 && (
        <span className="text-[9px] text-[var(--color-accent)] max-w-[64px] truncate text-center font-mono">
          {edge.requestCount} req
        </span>
      )}
    </div>
  );
}

export function SimulationFlowSummary({
  nodes,
  edges,
  isRunning,
}: SimulationFlowSummaryProps) {
  if (nodes.length === 0) return null;

  return (
    <div className={`animate-fade-in px-4 py-3 ${isRunning ? "animate-summary-pulse" : ""}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <svg className="h-3.5 w-3.5 text-[var(--color-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
          Simulation Flow
        </span>
        {isRunning && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
            <span className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
            Live
          </span>
        )}
      </div>

      {/* Flow chain */}
      <div className="flex items-center flex-wrap gap-y-3">
        {nodes.map((node, i) => {
          const edge = i > 0
            ? edges.find((e) => e.from === nodes[i - 1]?.id && e.to === node.id)
            : undefined;

          return (
            <div key={node.id} className="flex items-center">
              {i > 0 && <FlowArrow edge={edge} />}
              <div className="flex flex-col items-center gap-1 min-w-0">
                <NodeAvatar node={node} />
                <span className="text-[10px] font-medium text-[var(--color-text-primary)] truncate max-w-[72px] text-center">
                  {node.id}
                </span>
                {node.metrics && (
                  <span className="text-[9px] text-[var(--color-text-tertiary)] font-mono">
                    {node.metrics.requests}r / {Math.round(node.metrics.avgLatencyMs)}ms
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
