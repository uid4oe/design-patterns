import { describe, it, expect, vi } from "vitest";
import { SSESimulationEmitter } from "../stream.js";
import type { Response } from "express";

function createMockResponse(): {
  res: Response;
  written: string[];
  ended: boolean;
  headers: Record<string, string | number>;
  closeHandlers: (() => void)[];
} {
  const written: string[] = [];
  const headers: Record<string, string | number> = {};
  const closeHandlers: (() => void)[] = [];
  let ended = false;

  const res = {
    writeHead: vi.fn((_status: number, h: Record<string, string>) => {
      Object.assign(headers, h);
    }),
    write: vi.fn((data: string) => {
      written.push(data);
      return true;
    }),
    end: vi.fn(() => {
      ended = true;
    }),
    on: vi.fn((event: string, handler: () => void) => {
      if (event === "close") closeHandlers.push(handler);
    }),
  } as unknown as Response;

  return { res, written, get ended() { return ended; }, headers, closeHandlers };
}

describe("SSESimulationEmitter", () => {
  it("sets SSE headers on construction", () => {
    const { res, headers } = createMockResponse();
    new SSESimulationEmitter(res);

    expect(headers["Content-Type"]).toBe("text/event-stream");
    expect(headers["Cache-Control"]).toBe("no-cache");
  });

  it("writes events as SSE data lines", () => {
    const { res, written } = createMockResponse();
    const emitter = new SSESimulationEmitter(res);

    emitter.emit({ type: "node_start", node: "test", role: "tester" });

    expect(written).toHaveLength(1);
    expect(written[0]).toMatch(/^data: \{.*"type":"node_start".*\}\n\n$/);
  });

  it("ends response on done event", () => {
    const mock = createMockResponse();
    const emitter = new SSESimulationEmitter(mock.res);

    emitter.emit({
      type: "done",
      totalDurationMs: 100,
      aggregateMetrics: {
        totalRequests: 0, successCount: 0, errorCount: 0,
        p50LatencyMs: 0, p99LatencyMs: 0, throughputRps: 0,
      },
    });

    expect(mock.res.end).toHaveBeenCalled();
  });

  it("stops emitting after client disconnect", () => {
    const { res, written, closeHandlers } = createMockResponse();
    const emitter = new SSESimulationEmitter(res);

    // Simulate client disconnect
    closeHandlers.forEach((h) => h());

    emitter.emit({ type: "node_start", node: "test", role: "tester" });

    // No events written after disconnect
    expect(written).toHaveLength(0);
  });

  it("stops emitting after done event", () => {
    const { res, written } = createMockResponse();
    const emitter = new SSESimulationEmitter(res);

    emitter.emit({
      type: "done", totalDurationMs: 100,
      aggregateMetrics: { totalRequests: 0, successCount: 0, errorCount: 0, p50LatencyMs: 0, p99LatencyMs: 0, throughputRps: 0 },
    });

    const countAfterDone = written.length;
    emitter.emit({ type: "node_start", node: "test", role: "tester" });

    expect(written).toHaveLength(countAfterDone);
  });
});
