import { useState } from "react";
import type { ScenarioConfig } from "../types.ts";

interface ControlPanelProps {
  isRunning: boolean;
  onRun: (scenario: ScenarioConfig) => void;
  onReset: () => void;
}

export function ControlPanel({ isRunning, onRun, onReset }: ControlPanelProps) {
  const [requestCount, setRequestCount] = useState(50);
  const [requestsPerSecond, setRequestsPerSecond] = useState(10);
  const [seed, setSeed] = useState<number | undefined>(undefined);

  const handleRun = () => {
    const scenario: ScenarioConfig = {
      requestCount,
      requestsPerSecond,
      ...(seed !== undefined ? { seed } : {}),
    };
    onRun(scenario);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
          Requests: {requestCount}
        </label>
        <input
          type="range"
          min={1}
          max={200}
          value={requestCount}
          onChange={(e) => setRequestCount(Number(e.target.value))}
          disabled={isRunning}
          className="w-full accent-[var(--color-accent)]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
          Rate: {requestsPerSecond} rps
        </label>
        <input
          type="range"
          min={1}
          max={50}
          value={requestsPerSecond}
          onChange={(e) => setRequestsPerSecond(Number(e.target.value))}
          disabled={isRunning}
          className="w-full accent-[var(--color-accent)]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
          Seed (optional)
        </label>
        <input
          type="number"
          value={seed ?? ""}
          onChange={(e) =>
            setSeed(e.target.value ? Number(e.target.value) : undefined)
          }
          placeholder="Random"
          disabled={isRunning}
          className="bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] px-3 py-1.5 rounded-lg text-sm border border-[var(--color-border)] outline-none focus:border-[var(--color-accent)]"
        />
      </div>

      <div className="flex gap-2 mt-1">
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="flex-1 px-4 py-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isRunning ? "Running..." : "Run Simulation"}
        </button>
        <button
          onClick={onReset}
          disabled={isRunning}
          className="px-4 py-2 bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
