import type {
  PatternSimulator,
  ScenarioConfig,
  SimulationEmitter,
  AggregateMetrics,
  RequestResult,
} from "@design-patterns/core";
import { MetricCollector, SeededRandom, SimulationClock } from "@design-patterns/core";
import { BackendNode } from "./nodes/backend.js";
import { RateLimiterNode } from "./nodes/rate-limiter.js";

export const name = "rate-limiter";
export const description =
  "Token bucket rate limiting with burst handling and steady-state throughput";

export function createSimulator(): PatternSimulator {
  return {
    async run(
      scenario: ScenarioConfig,
      emitter: SimulationEmitter,
    ) {
      const seed = scenario.seed ?? Date.now();
      const realTime = scenario.realTime ?? false;
      const random = new SeededRandom(seed);
      const clock = new SimulationClock();
      const collector = new MetricCollector();
      const requestResults: RequestResult[] = [];

      const backend = new BackendNode(
        { name: "backend", role: "service", latencyMs: 50 },
        seed + 1, clock, realTime,
      );

      const limiter = new RateLimiterNode(
        {
          name: "limiter",
          maxTokens: 20,
          refillRate: 10, // 10 tokens/sec
          backend,
        },
        seed + 2, clock, realTime,
      );

      // Apply failure injection
      const failures = scenario.failureInjection?.nodeFailures ?? {};
      if (failures["backend"] !== undefined) backend.setFailureRate(failures["backend"]);

      // Emit node_start
      limiter.emitStart(emitter);
      backend.emitStart(emitter);

      collector.start(clock.now());
      const startTime = clock.now();
      const intervalMs = 1000 / scenario.requestsPerSecond;

      for (let i = 0; i < scenario.requestCount; i++) {
        const requestId = `req-${i + 1}`;
        const request = {
          id: requestId,
          payload: `request-${i + 1}`,
          metadata: { index: i },
        };

        if (i > 0) {
          const jitter = random.between(0.8, 1.2);
          await clock.delay(Math.round(intervalMs * jitter), realTime);
        }

        emitter.emit({
          type: "request_flow",
          from: "client",
          to: "limiter",
          requestId,
        });

        const result = await limiter.run(request, emitter);

        collector.recordLatency(result.durationMs);
        if (result.success) collector.recordSuccess();
        else collector.recordError();

        requestResults.push({
          requestId,
          success: result.success,
          latencyMs: result.durationMs,
          path: result.success ? ["limiter", "backend"] : ["limiter"],
          error: result.success ? undefined : result.output,
        });
      }

      collector.stop(clock.now());
      const totalDurationMs = clock.now() - startTime;
      const metrics: AggregateMetrics = collector.getAggregateMetrics();

      // Emit rate-limiter specific metrics
      const totalReqs = limiter.getAccepted() + limiter.getRejected();
      emitter.emit({
        type: "metric", name: "accept_ratio",
        value: totalReqs > 0 ? Math.round((limiter.getAccepted() / totalReqs) * 100) / 100 : 0,
        unit: "ratio", node: "limiter",
      });
      emitter.emit({
        type: "metric", name: "total_accepted",
        value: limiter.getAccepted(), unit: "count", node: "limiter",
      });
      emitter.emit({
        type: "metric", name: "total_rejected",
        value: limiter.getRejected(), unit: "count", node: "limiter",
      });
      emitter.emit({
        type: "metric", name: "error_rate",
        value: metrics.totalRequests > 0 ? metrics.errorCount / metrics.totalRequests : 0,
        unit: "ratio",
      });

      // Emit node_end
      limiter.emitEnd(emitter, totalDurationMs);
      backend.emitEnd(emitter, totalDurationMs);

      emitter.emit({ type: "done", totalDurationMs, aggregateMetrics: metrics });

      return { result: { totalDurationMs, requestResults }, metrics };
    },
  };
}
