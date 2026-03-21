import type { TopologyNode, TopologyEdge } from "../types.ts";

interface TopologyViewProps {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

const STATE_COLORS: Record<string, string> = {
  idle: "border-[var(--color-text-muted)]",
  active: "border-[var(--color-accent)]",
  healthy: "border-[var(--color-success)]",
  degraded: "border-[var(--color-warning)]",
  failed: "border-[var(--color-error)]",
};

const STATE_BG: Record<string, string> = {
  idle: "bg-[var(--color-bg-tertiary)]",
  active: "bg-[var(--color-accent)]/10",
  healthy: "bg-[var(--color-success)]/10",
  degraded: "bg-[var(--color-warning)]/10",
  failed: "bg-[var(--color-error)]/10",
};

const STATE_DOT: Record<string, string> = {
  idle: "bg-[var(--color-text-muted)]",
  active: "bg-[var(--color-accent)]",
  healthy: "bg-[var(--color-success)]",
  degraded: "bg-[var(--color-warning)]",
  failed: "bg-[var(--color-error)]",
};

function NodeCard({ node }: { node: TopologyNode }) {
  const borderColor = STATE_COLORS[node.state] ?? STATE_COLORS["idle"];
  const bgColor = STATE_BG[node.state] ?? STATE_BG["idle"];
  const dotColor = STATE_DOT[node.state] ?? STATE_DOT["idle"];

  return (
    <div
      className={`${bgColor} ${borderColor} border-2 rounded-xl px-4 py-3 min-w-[140px] transition-all duration-300`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full ${dotColor} ${
            node.state === "active" ? "animate-pulse" : ""
          }`}
        />
        <span className="font-mono text-sm font-bold text-[var(--color-text-primary)]">
          {node.id}
        </span>
      </div>
      <div className="text-xs text-[var(--color-text-muted)]">{node.role}</div>
      {node.metrics && (
        <div className="mt-2 flex gap-3 text-xs font-mono">
          <span className="text-[var(--color-text-secondary)]">
            {node.metrics.requests} req
          </span>
          <span className="text-[var(--color-text-secondary)]">
            {Math.round(node.metrics.avgLatencyMs)}ms
          </span>
          {node.metrics.errors > 0 && (
            <span className="text-[var(--color-error)]">
              {node.metrics.errors} err
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function EdgeLine({ edge }: { edge: TopologyEdge }) {
  return (
    <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
      <span className="font-mono">{edge.from}</span>
      <span
        className={`mx-1 ${edge.active ? "text-[var(--color-accent)]" : ""}`}
      >
        →
      </span>
      <span className="font-mono">{edge.to}</span>
      <span className="ml-1 text-[var(--color-text-muted)]">
        ({edge.requestCount})
      </span>
    </div>
  );
}

export function TopologyView({ nodes, edges }: TopologyViewProps) {
  if (nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--color-text-muted)]">
        <div className="text-center">
          <div className="text-4xl mb-3">🔧</div>
          <div className="text-sm">Select a pattern and run a simulation</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-4 p-4 overflow-auto">
      <div className="flex flex-wrap gap-3 justify-center">
        {nodes.map((node) => (
          <NodeCard key={node.id} node={node} />
        ))}
      </div>
      {edges.length > 0 && (
        <div className="glass p-3 flex flex-wrap gap-3 justify-center">
          {edges.map((edge) => (
            <EdgeLine key={`${edge.from}->${edge.to}`} edge={edge} />
          ))}
        </div>
      )}
    </div>
  );
}
