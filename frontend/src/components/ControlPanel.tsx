import { useState } from "react";
import type { ScenarioConfig } from "../types.ts";

interface ControlPanelProps {
  isRunning: boolean;
  onRun: (scenario: ScenarioConfig) => void;
  onReset: () => void;
}

export function ControlPanel({ isRunning, onRun, onReset }: ControlPanelProps) {
  const [requestCount, setRequestCount] = useState(20);
  const [requestsPerSecond, setRequestsPerSecond] = useState(5);

  const handleRun = () => {
    onRun({ requestCount, requestsPerSecond });
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <label className="text-[11px] font-medium text-[var(--color-text-tertiary)]">
          Requests
        </label>
        <input
          type="number"
          min={1}
          max={200}
          value={requestCount}
          onChange={(e) => setRequestCount(Number(e.target.value))}
          disabled={isRunning}
          className="w-16 bg-[var(--color-surface-tertiary)] text-[var(--color-text-primary)] px-2 py-1 rounded-lg text-[12px] font-mono border border-[var(--color-border-light)] outline-none focus:border-[var(--color-accent)] transition-colors disabled:opacity-40"
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-[11px] font-medium text-[var(--color-text-tertiary)]">
          Rate
        </label>
        <input
          type="number"
          min={1}
          max={50}
          value={requestsPerSecond}
          onChange={(e) => setRequestsPerSecond(Number(e.target.value))}
          disabled={isRunning}
          className="w-16 bg-[var(--color-surface-tertiary)] text-[var(--color-text-primary)] px-2 py-1 rounded-lg text-[12px] font-mono border border-[var(--color-border-light)] outline-none focus:border-[var(--color-accent)] transition-colors disabled:opacity-40"
        />
        <span className="text-[10px] text-[var(--color-text-tertiary)]">rps</span>
      </div>

      <div className="flex gap-1.5 ml-auto">
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="px-4 py-1.5 bg-gradient-to-b from-blue-500 to-blue-600 text-white rounded-xl text-[12px] font-medium transition-all shadow-sm shadow-blue-500/15 hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <span className="flex items-center gap-1.5">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin-slow" />
              Running
            </span>
          ) : (
            "Send"
          )}
        </button>
        <button
          onClick={onReset}
          disabled={isRunning}
          className="px-3 py-1.5 text-[var(--color-text-tertiary)] rounded-xl text-[12px] font-medium transition-all hover:bg-black/[0.03] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
