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
    <div role="group" className="flex items-center gap-1 shrink-0">
      {patterns.map((p) => {
        const isActive = selected === p.name;
        return (
          <button
            key={p.name}
            onClick={() => onSelect(p.name)}
            aria-pressed={isActive}
            disabled={disabled && !isActive}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-[12px] font-medium flex items-center gap-1.5 transition-all duration-150 ${
              isActive
                ? "bg-[var(--color-accent)] text-white shadow-sm shadow-blue-500/15"
                : disabled
                  ? "text-[var(--color-text-tertiary)] opacity-40 cursor-not-allowed"
                  : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-black/[0.03]"
            }`}
          >
            <span>{PATTERN_ICONS[p.name] ?? "📦"}</span>
            {p.name}
            {isActive && disabled && (
              <span className="h-3 w-3 rounded-full border-[1.5px] border-white/40 border-t-white animate-spin-slow" />
            )}
          </button>
        );
      })}
    </div>
  );
}
