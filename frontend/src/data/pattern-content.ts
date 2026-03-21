export interface PatternNode {
  name: string;
  role: string;
  description: string;
}

export interface SuggestedScenario {
  label: string;
  description: string;
  requestCount: number;
  requestsPerSecond: number;
  failureInjection?: {
    nodeFailures?: Record<string, number>;
  };
}

export interface PatternContent {
  name: string;
  icon: string;
  tagline: string;
  description: string;
  whenToUse: string[];
  architectureMermaid: string;
  howItWorks: string[];
  nodes: PatternNode[];
  tradeoffs: {
    pros: string[];
    cons: string[];
  };
  suggestedScenarios: SuggestedScenario[];
}

const circuitBreaker: PatternContent = {
  name: "circuit-breaker",
  icon: "⚡",
  tagline: "Failure isolation via state machine",
  description:
    "Prevents cascading failures by wrapping calls in a state machine that monitors errors. After a threshold of consecutive failures, the breaker opens and fast-fails subsequent requests — protecting downstream services from overload and giving them time to recover.",
  whenToUse: [
    "Calling unreliable downstream services that may become unresponsive",
    "Preventing cascade failures in microservice architectures",
    "Protecting systems from thundering herd after partial outages",
    "Any RPC boundary where transient failures need fast detection and recovery",
  ],
  architectureMermaid: `graph LR
    Client[Client] --> CB[Circuit Breaker<br/>state machine]
    CB -->|CLOSED| Backend[Backend Service]
    CB -->|OPEN| FastFail[Fast Fail<br/>reject immediately]
    CB -->|HALF-OPEN| Probe[Probe Request]
    Probe -->|success| CB
    Probe -->|fail| FastFail
    Backend --> Response[Response]`,
  howItWorks: [
    "In the CLOSED state, all requests pass through to the backend service normally",
    "Each failure increments a consecutive-failure counter; successes reset it to zero",
    "When failures hit the threshold, the breaker transitions to OPEN — all requests are immediately rejected (fast-fail) without reaching the backend",
    "After a cooldown period, the breaker moves to HALF-OPEN and allows one probe request through",
    "If the probe succeeds, the breaker resets to CLOSED; if it fails, the breaker re-opens for another cooldown cycle",
  ],
  nodes: [
    {
      name: "client",
      role: "request-generator",
      description: "Generates requests at the configured rate (rps)",
    },
    {
      name: "breaker",
      role: "circuit-breaker",
      description:
        "State machine (Closed → Open → Half-Open) that monitors failures and fast-fails when open",
    },
    {
      name: "backend",
      role: "service",
      description:
        "Downstream service with configurable latency and failure rate",
    },
  ],
  tradeoffs: {
    pros: [
      "Prevents cascading failures across service boundaries",
      "Fast-fail reduces latency and resource usage during outages",
      "Automatic recovery detection via half-open probing",
      "Simple to reason about — only 3 states",
    ],
    cons: [
      "Threshold tuning is difficult — too low causes false trips, too high delays detection",
      "Cooldown period means legitimate requests are rejected during recovery",
      "Does not distinguish between transient and permanent failures",
      "Single-count threshold ignores failure rate (5 failures in 5 seconds vs 5 in 5 minutes)",
    ],
  },
  suggestedScenarios: [
    {
      label: "Healthy traffic",
      description: "50 requests with no failures — circuit stays closed",
      requestCount: 50,
      requestsPerSecond: 10,
    },
    {
      label: "50% backend failures",
      description: "Watch the breaker trip and fast-fail subsequent requests",
      requestCount: 30,
      requestsPerSecond: 5,
      failureInjection: { nodeFailures: { backend: 0.5 } },
    },
    {
      label: "Total backend outage",
      description: "100% failure rate — see the breaker open immediately",
      requestCount: 20,
      requestsPerSecond: 8,
      failureInjection: { nodeFailures: { backend: 1.0 } },
    },
  ],
};

export const PATTERN_CONTENT: Record<string, PatternContent> = {
  "circuit-breaker": circuitBreaker,
};
