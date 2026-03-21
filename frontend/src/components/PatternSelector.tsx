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
  disabled: boolean;
}

export function PatternSelector({
  patterns,
  selected,
  onSelect,
  disabled,
}: PatternSelectorProps) {
  if (patterns.length === 0) {
    return (
      <div className="text-[var(--color-text-tertiary)] text-[12px] px-2 py-1">
        No patterns loaded
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {patterns.map((p) => (
        <button
          key={p.name}
          onClick={() => onSelect(p.name)}
          disabled={disabled}
          className={`shrink-0 rounded-lg px-2.5 py-1 text-[12px] font-medium transition-all duration-150 ${
            selected === p.name
              ? "bg-[var(--color-accent)] text-white shadow-sm shadow-blue-500/15"
              : "text-[var(--color-text-tertiary)] hover:bg-black/[0.03]"
          } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          <span className="mr-1">{PATTERN_ICONS[p.name] ?? "📦"}</span>
          {p.name}
        </button>
      ))}
    </div>
  );
}
