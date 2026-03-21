import { describe, it, expect } from "vitest";
import { parseSSELines, reduceEvent } from "../hooks/useSimulation.ts";
import { INITIAL_STATE } from "../types.ts";
import type { SimulationState } from "../types.ts";

describe("parseSSELines", () => {
  it("parses valid SSE data lines", () => {
    const raw = `data: {"type":"node_start","node":"a","role":"test"}\n\ndata: {"type":"done","totalDurationMs":100,"aggregateMetrics":{"totalRequests":0,"successCount":0,"errorCount":0,"p50LatencyMs":0,"p99LatencyMs":0,"throughputRps":0}}\n\n`;
    const events = parseSSELines(raw);
    expect(events).toHaveLength(2);
    expect(events[0]?.type).toBe("node_start");
    expect(events[1]?.type).toBe("done");
  });

  it("skips heartbeat comments", () => {
    const raw = `:heartbeat\n\ndata: {"type":"node_start","node":"a","role":"test"}\n\n`;
    const events = parseSSELines(raw);
    expect(events).toHaveLength(1);
  });

  it("returns empty array for empty input", () => {
    expect(parseSSELines("")).toHaveLength(0);
  });
});

describe("reduceEvent", () => {
  it("adds new node on node_start", () => {
    const state = reduceEvent(INITIAL_STATE, {
      type: "node_start",
      node: "breaker",
      role: "circuit-breaker",
      state: "closed",
    });

    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0]?.id).toBe("breaker");
    expect(state.nodes[0]?.role).toBe("circuit-breaker");
    expect(state.nodes[0]?.state).toBe("active");
  });

  it("updates existing node on duplicate node_start", () => {
    const withNode: SimulationState = {
      ...INITIAL_STATE,
      nodes: [{ id: "breaker", role: "circuit-breaker", state: "idle" }],
    };

    const state = reduceEvent(withNode, {
      type: "node_start",
      node: "breaker",
      role: "circuit-breaker",
    });

    expect(state.nodes).toHaveLength(1);
    expect(state.nodes[0]?.state).toBe("active");
  });

  it("adds new edge on request_flow", () => {
    const state = reduceEvent(INITIAL_STATE, {
      type: "request_flow",
      from: "client",
      to: "breaker",
      requestId: "r1",
    });

    expect(state.edges).toHaveLength(1);
    expect(state.edges[0]?.from).toBe("client");
    expect(state.edges[0]?.to).toBe("breaker");
    expect(state.edges[0]?.requestCount).toBe(1);
  });

  it("increments edge count on repeated request_flow", () => {
    const withEdge: SimulationState = {
      ...INITIAL_STATE,
      edges: [{ from: "client", to: "breaker", active: true, requestCount: 5 }],
    };

    const state = reduceEvent(withEdge, {
      type: "request_flow",
      from: "client",
      to: "breaker",
      requestId: "r6",
    });

    expect(state.edges).toHaveLength(1);
    expect(state.edges[0]?.requestCount).toBe(6);
  });

  it("maps node_state_change to topology state", () => {
    const withNode: SimulationState = {
      ...INITIAL_STATE,
      nodes: [{ id: "breaker", role: "cb", state: "healthy" }],
    };

    const state = reduceEvent(withNode, {
      type: "node_state_change",
      node: "breaker",
      from: "closed",
      to: "open",
      reason: "threshold",
    });

    expect(state.nodes[0]?.state).toBe("failed");
  });

  it("sets error state on error event", () => {
    const withNode: SimulationState = {
      ...INITIAL_STATE,
      nodes: [{ id: "backend", role: "service", state: "healthy" }],
    };

    const state = reduceEvent(withNode, {
      type: "error",
      node: "backend",
      message: "connection timeout",
      recoverable: true,
    });

    expect(state.error).toBe("connection timeout");
    expect(state.nodes[0]?.state).toBe("failed");
  });

  it("stops running and sets metrics on done", () => {
    const running: SimulationState = { ...INITIAL_STATE, isRunning: true };
    const metrics = {
      totalRequests: 100,
      successCount: 95,
      errorCount: 5,
      p50LatencyMs: 20,
      p99LatencyMs: 80,
      throughputRps: 100,
    };

    const state = reduceEvent(running, {
      type: "done",
      totalDurationMs: 1000,
      aggregateMetrics: metrics,
    });

    expect(state.isRunning).toBe(false);
    expect(state.metrics).toEqual(metrics);
  });

  it("updates node metrics on node_end", () => {
    const withNode: SimulationState = {
      ...INITIAL_STATE,
      nodes: [{ id: "backend", role: "service", state: "active" }],
    };

    const state = reduceEvent(withNode, {
      type: "node_end",
      node: "backend",
      durationMs: 500,
      metrics: { requestsHandled: 10, errorsCount: 1, avgLatencyMs: 50 },
    });

    expect(state.nodes[0]?.state).toBe("healthy");
    expect(state.nodes[0]?.metrics?.requests).toBe(10);
    expect(state.nodes[0]?.metrics?.errors).toBe(1);
  });
});
