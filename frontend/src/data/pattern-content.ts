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

const saga: PatternContent = {
  name: "saga",
  icon: "🔄",
  tagline: "Distributed transactions with compensating rollbacks",
  description:
    "Manages multi-step distributed transactions without distributed locks. An orchestrator executes a sequence of local transactions across services. If any step fails, it runs compensating actions in reverse order to undo completed steps — ensuring eventual consistency without two-phase commit.",
  whenToUse: [
    "Multi-service order processing (order → payment → inventory → shipping)",
    "Any workflow where partial completion must be rolled back on failure",
    "Replacing two-phase commit in microservice architectures",
    "Long-running business processes that span multiple bounded contexts",
  ],
  architectureMermaid: `graph LR
    Client[Client] --> Orch[Orchestrator<br/>saga coordinator]
    Orch -->|step 1| Order[Order Service]
    Orch -->|step 2| Payment[Payment Service]
    Orch -->|step 3| Inventory[Inventory Service]
    Orch -->|step 4| Shipping[Shipping Service]
    Inventory -.->|fail| Orch
    Orch -.->|compensate| Payment
    Orch -.->|compensate| Order`,
  howItWorks: [
    "The orchestrator receives a request and begins executing saga steps in sequence: Order → Payment → Inventory → Shipping",
    "Each service performs its local transaction and reports success or failure back to the orchestrator",
    "If all steps succeed, the saga completes and the orchestrator transitions to 'completed' state",
    "If any step fails, the orchestrator enters 'compensating' mode and calls compensation on all previously completed steps in reverse order",
    "Compensation undoes each step: refund payment, cancel order, release inventory — ensuring no partial state remains",
  ],
  nodes: [
    {
      name: "orchestrator",
      role: "saga-orchestrator",
      description:
        "Coordinates the saga: executes steps in sequence, triggers reverse compensation on failure",
    },
    {
      name: "order",
      role: "service",
      description: "Creates orders (forward) / cancels orders (compensate)",
    },
    {
      name: "payment",
      role: "service",
      description: "Processes payments (forward) / issues refunds (compensate)",
    },
    {
      name: "inventory",
      role: "service",
      description: "Reserves stock (forward) / releases stock (compensate)",
    },
    {
      name: "shipping",
      role: "service",
      description: "Schedules shipment (forward) / cancels shipment (compensate)",
    },
  ],
  tradeoffs: {
    pros: [
      "No distributed locks — each service manages its own local transaction",
      "Eventual consistency without two-phase commit overhead",
      "Clear compensation semantics make rollback predictable",
      "Works well with event-driven architectures",
    ],
    cons: [
      "Compensation logic must be written for every step (doubles implementation effort)",
      "Intermediate states are visible to other transactions (no isolation)",
      "Compensation can itself fail, requiring additional retry/dead-letter handling",
      "Debugging multi-step failures across services is complex",
    ],
  },
  suggestedScenarios: [
    {
      label: "Happy path",
      description: "All 4 steps complete — order, payment, inventory, shipping succeed",
      requestCount: 10,
      requestsPerSecond: 5,
    },
    {
      label: "Inventory failure",
      description: "Inventory fails 50% — watch compensation roll back payment and order",
      requestCount: 10,
      requestsPerSecond: 3,
      failureInjection: { nodeFailures: { inventory: 0.5 } },
    },
    {
      label: "Payment always fails",
      description: "Payment 100% failure — only order gets compensated each time",
      requestCount: 8,
      requestsPerSecond: 3,
      failureInjection: { nodeFailures: { payment: 1.0 } },
    },
  ],
};

export const PATTERN_CONTENT: Record<string, PatternContent> = {
  "circuit-breaker": circuitBreaker,
  saga,
};
