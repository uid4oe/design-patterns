import type { PatternInfo } from "../types.ts";

const PATTERN_ICONS: Record<string, string> = {
  "circuit-breaker": "⚡",
  saga: "🔄",
  cqrs: "📋",
  "load-balancer": "⚖️",
  "pub-sub": "📡",
  bulkhead: "🚧",
  "rate-limiter": "🚦",
};

interface PatternSelectorProps {
  patterns: PatternInfo[];
  selected: string | null;
  onSelect: (name: string) => void;
}

export function PatternSelector({
  patterns,
  selected,
  onSelect,
}: PatternSelectorProps) {
  if (patterns.length === 0) {
    return (
      <div className="text-[var(--color-text-muted)] text-sm p-3">
        No patterns loaded
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {patterns.map((p) => (
        <button
          key={p.name}
          onClick={() => onSelect(p.name)}
          className={`text-left px-3 py-2 rounded-lg transition-colors text-sm ${
            selected === p.name
              ? "bg-[var(--color-accent)] text-white"
              : "hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
          }`}
        >
          <span className="mr-2">{PATTERN_ICONS[p.name] ?? "📦"}</span>
          {p.name}
        </button>
      ))}
    </div>
  );
}
