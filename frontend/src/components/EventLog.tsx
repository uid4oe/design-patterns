import type { SimulationEvent } from "../types.ts";
import { useRef, useEffect } from "react";

interface EventLogProps {
  events: SimulationEvent[];
}

function eventColor(type: string): string {
  switch (type) {
    case "node_start":
      return "text-[var(--color-accent)]";
    case "request_flow":
      return "text-[var(--color-text-secondary)]";
    case "node_state_change":
      return "text-[var(--color-warning)]";
    case "error":
      return "text-[var(--color-error)]";
    case "done":
      return "text-[var(--color-success)]";
    default:
      return "text-[var(--color-text-muted)]";
  }
}

function formatEvent(event: SimulationEvent): string {
  switch (event.type) {
    case "node_start":
      return `[${event.node}] started (${event.role})`;
    case "processing":
      return `[${event.node}] ${event.detail}`;
    case "request_flow":
      return `${event.from} → ${event.to} (${event.requestId}${event.label ? ` ${event.label}` : ""})`;
    case "node_state_change":
      return `[${event.node}] ${event.from} → ${event.to}: ${event.reason}`;
    case "node_end":
      return `[${event.node}] ended (${event.metrics.requestsHandled} req, ${Math.round(event.metrics.avgLatencyMs)}ms avg)`;
    case "metric":
      return `${event.name}: ${event.value} ${event.unit}${event.node ? ` (${event.node})` : ""}`;
    case "error":
      return `[${event.node}] ERROR: ${event.message}${event.recoverable ? " (recoverable)" : ""}`;
    case "done":
      return `Done — ${event.aggregateMetrics.totalRequests} requests in ${event.totalDurationMs}ms`;
    default:
      return JSON.stringify(event);
  }
}

export function EventLog({ events }: EventLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  if (events.length === 0) return null;

  // Show last 100 events to prevent performance issues
  const visibleEvents = events.slice(-100);

  return (
    <div
      ref={scrollRef}
      className="glass p-3 max-h-48 overflow-y-auto font-mono text-xs leading-relaxed"
    >
      {visibleEvents.map((event, i) => (
        <div key={i} className={eventColor(event.type)}>
          {formatEvent(event)}
        </div>
      ))}
    </div>
  );
}
