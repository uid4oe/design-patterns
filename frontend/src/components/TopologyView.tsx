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

const STATE_COLORS: Record<string, string> = {
  idle: "#64748b",
  active: "#3b82f6",
  healthy: "#22c55e",
  degraded: "#eab308",
  failed: "#ef4444",
};

const STATE_BG: Record<string, string> = {
  idle: "#1e293b",
  active: "#1e3a5f",
  healthy: "#14532d",
  degraded: "#422006",
  failed: "#450a0a",
};

function SimulationNode({ data }: { data: TopologyNode }) {
  const borderColor = STATE_COLORS[data.state] ?? STATE_COLORS["idle"];
  const bgColor = STATE_BG[data.state] ?? STATE_BG["idle"];

  return (
    <div
      style={{
        background: bgColor,
        border: `2px solid ${borderColor}`,
        borderRadius: "0.75rem",
        padding: "12px 16px",
        minWidth: 140,
        color: "#f1f5f9",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: borderColor,
            display: "inline-block",
            animation: data.state === "active" ? "pulse 2s infinite" : undefined,
          }}
        />
        <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700 }}>
          {data.id}
        </span>
      </div>
      <div style={{ fontSize: 11, color: "#64748b" }}>{data.role}</div>
      {data.metrics && (
        <div
          style={{
            marginTop: 8,
            display: "flex",
            gap: 8,
            fontSize: 11,
            fontFamily: "monospace",
            color: "#94a3b8",
          }}
        >
          <span>{data.metrics.requests} req</span>
          <span>{Math.round(data.metrics.avgLatencyMs)}ms</span>
          {data.metrics.errors > 0 && (
            <span style={{ color: "#ef4444" }}>{data.metrics.errors} err</span>
          )}
        </div>
      )}
    </div>
  );
}

const nodeTypes = { simulation: SimulationNode };

/** Layout nodes in a horizontal line with even spacing. */
function layoutNodes(topologyNodes: TopologyNode[]): Node[] {
  const spacing = 220;
  const startX = 50;
  const y = 100;

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
      stroke: te.active ? "#3b82f6" : "#334155",
      strokeWidth: Math.min(1 + te.requestCount / 10, 4),
    },
    labelStyle: { fill: "#94a3b8", fontSize: 10 },
  }));
}

export function TopologyView({ nodes, edges }: TopologyViewProps) {
  const flowNodes = useMemo(() => layoutNodes(nodes), [nodes]);
  const flowEdges = useMemo(() => layoutEdges(edges), [edges]);

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
    <div className="flex-1" style={{ minHeight: 300 }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        panOnDrag
        zoomOnScroll
        proOptions={{ hideAttribution: true }}
        style={{ background: "#0f172a" }}
      >
        <Background color="#1e293b" gap={20} />
      </ReactFlow>
    </div>
  );
}
