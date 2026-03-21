import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo } from "react";
import type { TopologyNode, TopologyEdge } from "../types.ts";

interface TopologyViewProps {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
}

const STATE_COLORS: Record<string, { border: string; bg: string; dot: string }> = {
  idle: { border: "#94a3b8", bg: "rgba(241, 245, 249, 0.8)", dot: "#94a3b8" },
  active: { border: "#2563eb", bg: "rgba(219, 234, 254, 0.6)", dot: "#2563eb" },
  healthy: { border: "#16a34a", bg: "rgba(220, 252, 231, 0.6)", dot: "#16a34a" },
  degraded: { border: "#ca8a04", bg: "rgba(254, 249, 195, 0.6)", dot: "#ca8a04" },
  failed: { border: "#dc2626", bg: "rgba(254, 226, 226, 0.6)", dot: "#dc2626" },
};

function SimulationNode({ data }: { data: TopologyNode }) {
  const colors = STATE_COLORS[data.state] ?? STATE_COLORS["idle"];

  return (
    <div
      style={{
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: "0.75rem",
        padding: "10px 14px",
        minWidth: 130,
        fontFamily: "system-ui, -apple-system, sans-serif",
        backdropFilter: "blur(12px)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 4px 16px rgba(0,0,0,0.02)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: colors.dot,
            display: "inline-block",
            animation: data.state === "active" ? "pulse 2s infinite" : undefined,
          }}
        />
        <span style={{
          fontFamily: "ui-monospace, monospace",
          fontSize: 12,
          fontWeight: 600,
          color: "#0f172a",
        }}>
          {data.id}
        </span>
      </div>
      <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500 }}>{data.role}</div>
      {data.metrics && (
        <div style={{
          marginTop: 6,
          display: "flex",
          gap: 6,
          fontSize: 10,
          fontFamily: "ui-monospace, monospace",
          color: "#475569",
        }}>
          <span>{data.metrics.requests} req</span>
          <span>{Math.round(data.metrics.avgLatencyMs)}ms</span>
          {data.metrics.errors > 0 && (
            <span style={{ color: "#dc2626" }}>{data.metrics.errors} err</span>
          )}
        </div>
      )}
    </div>
  );
}

const nodeTypes = { simulation: SimulationNode };

function layoutNodes(topologyNodes: TopologyNode[]): Node[] {
  const spacing = 200;
  const startX = 60;
  const y = 80;

  return topologyNodes.map((tn, i) => ({
    id: tn.id,
    type: "simulation",
    data: tn,
    position: { x: startX + i * spacing, y },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  }));
}

function layoutEdges(topologyEdges: TopologyEdge[]): Edge[] {
  return topologyEdges.map((te) => ({
    id: `${te.from}->${te.to}`,
    source: te.from,
    target: te.to,
    animated: te.active,
    label: String(te.requestCount),
    style: {
      stroke: te.active ? "#2563eb" : "#cbd5e1",
      strokeWidth: Math.min(1 + te.requestCount / 10, 3),
    },
    labelStyle: { fill: "#64748b", fontSize: 10, fontFamily: "ui-monospace, monospace" },
    labelBgStyle: { fill: "rgba(255,255,255,0.7)" },
    labelBgPadding: [4, 2] as [number, number],
    labelBgBorderRadius: 4,
  }));
}

export function TopologyView({ nodes, edges }: TopologyViewProps) {
  const flowNodes = useMemo(() => layoutNodes(nodes), [nodes]);
  const flowEdges = useMemo(() => layoutEdges(edges), [edges]);

  if (nodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--color-text-tertiary)]">
        <div className="text-center animate-fade-in">
          <div className="text-3xl mb-2">🔧</div>
          <div className="text-[13px] font-medium">Select a pattern and run a simulation</div>
          <div className="text-[11px] mt-1 text-[var(--color-text-tertiary)]">
            Watch system design patterns in action
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 animate-fade-in" style={{ minHeight: 280 }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        panOnDrag
        zoomOnScroll
        proOptions={{ hideAttribution: true }}
        style={{ background: "transparent" }}
      >
        <Background color="rgba(148, 163, 184, 0.08)" gap={24} />
      </ReactFlow>
    </div>
  );
}
