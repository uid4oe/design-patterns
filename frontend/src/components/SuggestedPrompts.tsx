import type { SuggestedScenario } from "../data/pattern-content.ts";

interface SuggestedPromptsProps {
  scenarios: SuggestedScenario[];
  onTryScenario: (scenario: SuggestedScenario) => void;
}

export function SuggestedPrompts({ scenarios, onTryScenario }: SuggestedPromptsProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
        Try it
      </h4>
      <div className="flex flex-wrap gap-2">
        {scenarios.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onTryScenario(s)}
            className="group flex items-center gap-1.5 rounded-lg border border-[var(--color-accent-light)] bg-[var(--color-accent-light)]/30 px-2.5 py-1.5 text-[11px] font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-all duration-150"
            title={s.description}
          >
            <span className="truncate max-w-[180px]">{s.label}</span>
            <svg
              className="h-3 w-3 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
