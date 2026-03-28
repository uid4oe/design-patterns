import { describe, it, expect } from "vitest";
import { SimulationRunner } from "../simulation/runner.js";
import { SimpleNode, SimulationClock, CollectingEmitter } from "../index.js";
import type { NodeResult, SimulationRequest, SimulationEvent, SimulationContext } from "../index.js";

/** Minimal node that tracks call order for concurrency testing. */
class TrackingNode extends SimpleNode {
  readonly callLog: string[] = [];

  protected async handleRequest(request: SimulationRequest): Promise<NodeResult> {
    this.callLog.push(request.id);
    return { output: `ok-${request.id}`, durationMs: 0, success: true, metrics: this.getMetrics() };
  }
}

class FailingNode extends SimpleNode {
  protected async handleRequest(): Promise<NodeResult> {
    return { output: "failed", durationMs: 0, success: false, metrics: this.getMetrics() };
  }
}

class ThrowingProcessNode extends SimpleNode {
  protected async handleRequest(): Promise<NodeResult> {
    throw new Error("boom");
  }
}

function makeScenario(requestCount: number, rps = 100, seed = 42) {
  return { requestCount, requestsPerSecond: rps, seed };
}

describe("SimulationRunner — sequential (default)", () => {
  it("processes all requests and emits done with correct metrics", async () => {
    const clock = new SimulationClock();
    const emitter = new CollectingEmitter();
    const node = new TrackingNode({ name: "svc", role: "service", latencyMs: 0 }, 1, clock);

    const { result, metrics } = await SimulationRunner.run({
      scenario: makeScenario(5),
      emitter,
      clock,
      nodes: [node],
      async processRequest(request, ctx) {
        const r = await node.run(request, ctx.emitter);
        return { result: r, path: ["svc"] };
      },
    });

    expect(result.requestResults).toHaveLength(5);
    expect(metrics.totalRequests).toBe(5);
    expect(metrics.successCount).toBe(5);
    expect(metrics.errorCount).toBe(0);

    // Verify done event
    const doneEvent = emitter.events.find((e) => e.type === "done");
    expect(doneEvent).toBeDefined();
    expect(doneEvent?.type === "done" && doneEvent.aggregateMetrics.totalRequests).toBe(5);
  });

  it("emits node_start for all nodes before requests", async () => {
    const clock = new SimulationClock();
    const emitter = new CollectingEmitter();
    const nodeA = new TrackingNode({ name: "a", role: "svc", latencyMs: 0 }, 1, clock);
    const nodeB = new TrackingNode({ name: "b", role: "svc", latencyMs: 0 }, 2, clock);

    await SimulationRunner.run({
      scenario: makeScenario(1),
      emitter,
      clock,
      nodes: [nodeA, nodeB],
      async processRequest(request, ctx) {
        const r = await nodeA.run(request, ctx.emitter);
        return { result: r, path: ["a"] };
      },
    });

    const firstTwo = emitter.events.slice(0, 2);
    expect(firstTwo.every((e) => e.type === "node_start")).toBe(true);
    const names = firstTwo.filter((e): e is Extract<SimulationEvent, { type: "node_start" }> => e.type === "node_start").map((e) => e.node);
    expect(names).toContain("a");
    expect(names).toContain("b");
  });

  it("emits node_end for all nodes after requests", async () => {
    const clock = new SimulationClock();
    const emitter = new CollectingEmitter();
    const node = new TrackingNode({ name: "svc", role: "service", latencyMs: 0 }, 1, clock);

    await SimulationRunner.run({
      scenario: makeScenario(2),
      emitter,
      clock,
      nodes: [node],
      async processRequest(request, ctx) {
        const r = await node.run(request, ctx.emitter);
        return { result: r, path: ["svc"] };
      },
    });

    // node_end should appear before done
    const endIdx = emitter.events.findIndex((e) => e.type === "node_end");
    const doneIdx = emitter.events.findIndex((e) => e.type === "done");
    expect(endIdx).toBeGreaterThan(-1);
    expect(endIdx).toBeLessThan(doneIdx);
  });

  it("records errors correctly", async () => {
    const clock = new SimulationClock();
    const emitter = new CollectingEmitter();
    const node = new FailingNode({ name: "fail", role: "service", latencyMs: 0 }, 1, clock);

    const { metrics } = await SimulationRunner.run({
      scenario: makeScenario(3),
      emitter,
      clock,
      nodes: [node],
      async processRequest(request, ctx) {
        const r = await node.run(request, ctx.emitter);
        return { result: r, path: ["fail"] };
      },
    });

    expect(metrics.errorCount).toBe(3);
    expect(metrics.successCount).toBe(0);
  });

  it("catches processRequest exceptions and emits system error", async () => {
    const clock = new SimulationClock();
    const emitter = new CollectingEmitter();
    const node = new ThrowingProcessNode({ name: "thrower", role: "service", latencyMs: 0 }, 1, clock);

    const { metrics } = await SimulationRunner.run({
      scenario: makeScenario(2),
      emitter,
      clock,
      nodes: [node],
      async processRequest(request, ctx) {
        return { result: await node.run(request, ctx.emitter), path: ["thrower"] };
      },
    });

    expect(metrics.errorCount).toBe(2);
    const systemErrors = emitter.events.filter(
      (e) => e.type === "error" && e.node === "thrower",
    );
    expect(systemErrors.length).toBeGreaterThan(0);
  });

  it("emits error_rate metric", async () => {
    const clock = new SimulationClock();
    const emitter = new CollectingEmitter();
    const node = new FailingNode({ name: "fail", role: "service", latencyMs: 0 }, 1, clock);

    await SimulationRunner.run({
      scenario: makeScenario(4),
      emitter,
      clock,
      nodes: [node],
      async processRequest(request, ctx) {
        const r = await node.run(request, ctx.emitter);
        return { result: r, path: ["fail"] };
      },
    });

    const errorRate = emitter.getMetricValue("error_rate");
    expect(errorRate).toBe(1.0);
  });

  it("calls emitPatternMetrics with final metrics", async () => {
    const clock = new SimulationClock();
    const emitter = new CollectingEmitter();
    const node = new TrackingNode({ name: "svc", role: "service", latencyMs: 0 }, 1, clock);
    let calledWith: { total: number } | null = null;

    await SimulationRunner.run({
      scenario: makeScenario(3),
      emitter,
      clock,
      nodes: [node],
      async processRequest(request, ctx) {
        const r = await node.run(request, ctx.emitter);
        return { result: r, path: ["svc"] };
      },
      emitPatternMetrics(metrics) {
        calledWith = { total: metrics.totalRequests };
      },
    });

    expect(calledWith).toEqual({ total: 3 });
  });

  it("emits p50/p99/throughput snapshots per request", async () => {
    const clock = new SimulationClock();
    const emitter = new CollectingEmitter();
    const node = new TrackingNode({ name: "svc", role: "service", latencyMs: 0 }, 1, clock);

    await SimulationRunner.run({
      scenario: makeScenario(3),
      emitter,
      clock,
      nodes: [node],
      async processRequest(request, ctx) {
        const r = await node.run(request, ctx.emitter);
        return { result: r, path: ["svc"] };
      },
    });

    const p50s = emitter.events.filter((e) => e.type === "metric" && e.name === "p50_latency_ms");
    expect(p50s.length).toBe(3); // One snapshot per request
  });

  it("processes requests sequentially — call order matches request order", async () => {
    const clock = new SimulationClock();
    const emitter = new CollectingEmitter();
    const node = new TrackingNode({ name: "svc", role: "service", latencyMs: 0 }, 1, clock);

    await SimulationRunner.run({
      scenario: makeScenario(5),
      emitter,
      clock,
      nodes: [node],
      async processRequest(request, ctx) {
        const r = await node.run(request, ctx.emitter);
        return { result: r, path: ["svc"] };
      },
    });

    expect(node.callLog).toEqual(["req-1", "req-2", "req-3", "req-4", "req-5"]);
  });
});

describe("SimulationRunner — parallel (concurrency > 1)", () => {
  it("processes all requests with concurrency=3", async () => {
    const clock = new SimulationClock();
    const emitter = new CollectingEmitter();
    const node = new TrackingNode({ name: "svc", role: "service", latencyMs: 0 }, 1, clock);

    const { result, metrics } = await SimulationRunner.run({
      scenario: makeScenario(9),
      emitter,
      clock,
      concurrency: 3,
      nodes: [node],
      async processRequest(request, ctx) {
        const r = await node.run(request, ctx.emitter);
        return { result: r, path: ["svc"] };
      },
    });

    expect(result.requestResults).toHaveLength(9);
    expect(metrics.totalRequests).toBe(9);
    expect(metrics.successCount).toBe(9);
  });

  it("fires batches concurrently — all requests in batch processed", async () => {
    const clock = new SimulationClock();
    const emitter = new CollectingEmitter();
    const callOrder: string[] = [];

    const node = new TrackingNode({ name: "svc", role: "service", latencyMs: 0 }, 1, clock);

    await SimulationRunner.run({
      scenario: makeScenario(6),
      emitter,
      clock,
      concurrency: 3,
      nodes: [node],
      async processRequest(request, ctx) {
        callOrder.push(request.id);
        const r = await node.run(request, ctx.emitter);
        return { result: r, path: ["svc"] };
      },
    });

    // All 6 requests processed
    expect(callOrder).toHaveLength(6);
    // Request IDs should all be present
    expect(callOrder.sort()).toEqual(["req-1", "req-2", "req-3", "req-4", "req-5", "req-6"]);
  });

  it("emits metric snapshots per batch, not per request", async () => {
    const clock = new SimulationClock();
    const emitter = new CollectingEmitter();
    const node = new TrackingNode({ name: "svc", role: "service", latencyMs: 0 }, 1, clock);

    await SimulationRunner.run({
      scenario: makeScenario(9),
      emitter,
      clock,
      concurrency: 3,
      nodes: [node],
      async processRequest(request, ctx) {
        const r = await node.run(request, ctx.emitter);
        return { result: r, path: ["svc"] };
      },
    });

    // 9 requests / 3 concurrency = 3 batches = 3 snapshots
    const p50s = emitter.events.filter((e) => e.type === "metric" && e.name === "p50_latency_ms");
    expect(p50s.length).toBe(3);
  });

  it("handles partial last batch (requestCount not divisible by concurrency)", async () => {
    const clock = new SimulationClock();
    const emitter = new CollectingEmitter();
    const node = new TrackingNode({ name: "svc", role: "service", latencyMs: 0 }, 1, clock);

    const { metrics } = await SimulationRunner.run({
      scenario: makeScenario(7),
      emitter,
      clock,
      concurrency: 3,
      nodes: [node],
      async processRequest(request, ctx) {
        const r = await node.run(request, ctx.emitter);
        return { result: r, path: ["svc"] };
      },
    });

    // 7 requests: batch of 3, batch of 3, batch of 1
    expect(metrics.totalRequests).toBe(7);

    const p50s = emitter.events.filter((e) => e.type === "metric" && e.name === "p50_latency_ms");
    expect(p50s.length).toBe(3); // 3 batches
  });

  it("records mixed success/failure in parallel batches", async () => {
    const clock = new SimulationClock();
    const emitter = new CollectingEmitter();
    const node = new TrackingNode({ name: "svc", role: "service", latencyMs: 0 }, 1, clock);
    let callCount = 0;

    const { metrics } = await SimulationRunner.run({
      scenario: makeScenario(6),
      emitter,
      clock,
      concurrency: 3,
      nodes: [node],
      async processRequest(request) {
        callCount++;
        // Fail every 3rd request
        const success = callCount % 3 !== 0;
        return {
          result: { output: success ? "ok" : "fail", durationMs: 10, success, metrics: { requestsHandled: 1, errorsCount: success ? 0 : 1, avgLatencyMs: 10 } },
          path: ["svc"],
        };
      },
    });

    expect(metrics.totalRequests).toBe(6);
    expect(metrics.successCount).toBe(4);
    expect(metrics.errorCount).toBe(2);
  });

  it("catches exceptions in parallel batch and continues", async () => {
    const clock = new SimulationClock();
    const emitter = new CollectingEmitter();
    const node = new TrackingNode({ name: "svc", role: "service", latencyMs: 0 }, 1, clock);
    let callCount = 0;

    const { metrics } = await SimulationRunner.run({
      scenario: makeScenario(6),
      emitter,
      clock,
      concurrency: 3,
      nodes: [node],
      async processRequest(request) {
        callCount++;
        if (callCount === 2) throw new Error("batch error");
        return {
          result: { output: "ok", durationMs: 0, success: true, metrics: { requestsHandled: 1, errorsCount: 0, avgLatencyMs: 0 } },
          path: ["svc"],
        };
      },
    });

    // 6 total: 5 succeed, 1 throws (caught as error)
    expect(metrics.totalRequests).toBe(6);
    expect(metrics.errorCount).toBe(1);

    const systemErrors = emitter.events.filter((e) => e.type === "error" && e.node === "system");
    expect(systemErrors).toHaveLength(1);
  });

  it("concurrency=1 behaves identically to default sequential", async () => {
    const clock1 = new SimulationClock();
    const emitter1 = new CollectingEmitter();
    const node1 = new TrackingNode({ name: "svc", role: "service", latencyMs: 0 }, 1, clock1);

    const clock2 = new SimulationClock();
    const emitter2 = new CollectingEmitter();
    const node2 = new TrackingNode({ name: "svc", role: "service", latencyMs: 0 }, 1, clock2);

    const makeProcessor = (node: TrackingNode) => async (request: SimulationRequest, ctx: SimulationContext) => {
      const r = await node.run(request, ctx.emitter);
      return { result: r, path: ["svc"] };
    };

    const r1 = await SimulationRunner.run({
      scenario: makeScenario(5),
      emitter: emitter1,
      clock: clock1,
      nodes: [node1],
      processRequest: makeProcessor(node1),
    });

    const r2 = await SimulationRunner.run({
      scenario: makeScenario(5),
      emitter: emitter2,
      clock: clock2,
      concurrency: 1,
      nodes: [node2],
      processRequest: makeProcessor(node2),
    });

    expect(r1.metrics.totalRequests).toBe(r2.metrics.totalRequests);
    expect(r1.metrics.successCount).toBe(r2.metrics.successCount);
    expect(node1.callLog).toEqual(node2.callLog);
  });
});
