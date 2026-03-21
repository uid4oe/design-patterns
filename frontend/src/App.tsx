import { useState, useEffect } from "react";
import { useSimulation } from "./hooks/useSimulation.ts";
import { PatternSelector } from "./components/PatternSelector.tsx";
import { ControlPanel } from "./components/ControlPanel.tsx";
import { TopologyView } from "./components/TopologyView.tsx";
import { MetricsPanel } from "./components/MetricsPanel.tsx";
import { EventLog } from "./components/EventLog.tsx";
import type { PatternInfo } from "./types.ts";

export function App() {
  const [patterns, setPatterns] = useState<PatternInfo[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const { state, run, reset } = useSimulation(selectedPattern);

  useEffect(() => {
    fetch("/api/patterns")
      .then((r) => r.json())
      .then((data: PatternInfo[]) => setPatterns(data))
      .catch(() => setPatterns([]));
  }, []);

  return (
    <div className="h-screen flex flex-col p-2 lg:p-2.5 gap-2 lg:gap-2.5">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-4 py-1">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🔧</span>
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">
            Design Patterns
          </h1>
          <span className="text-[11px] text-[var(--color-text-tertiary)] font-medium">
            System Design &amp; Distribution
          </span>
        </div>
        <div className="flex items-center gap-2">
          {state.isRunning && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">
              <span className="h-1 w-1 rounded-full bg-blue-500 animate-pulse" />
              Live
            </span>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 min-h-0 flex-col lg:flex-row gap-2 lg:gap-2.5">
        {/* Left: Topology visualization */}
        <div className="flex-[3] glass rounded-2xl overflow-hidden flex flex-col min-h-0">
          <TopologyView nodes={state.nodes} edges={state.edges} />
        </div>

        {/* Right: Event log + metrics */}
        <div className="flex-[2] flex flex-col gap-2 min-h-0">
          {/* Metrics */}
          <div className="shrink-0">
            <MetricsPanel metrics={state.metrics} isRunning={state.isRunning} />
          </div>

          {/* Event log */}
          <div className="flex-1 min-h-0 overflow-auto">
            <EventLog events={state.events} />
          </div>

          {/* Error */}
          {state.error && !state.isRunning && (
            <div className="glass-card rounded-xl border-red-200 px-3.5 py-2 text-[12px] text-red-600 animate-fade-in">
              <span className="font-medium">Error:</span> {state.error}
            </div>
          )}
        </div>
      </main>

      {/* Footer: Controls + Pattern selector */}
      <footer className="shrink-0 glass-strong rounded-2xl px-4 py-2.5 flex flex-col gap-2">
        <ControlPanel
          isRunning={state.isRunning}
          onRun={run}
          onReset={reset}
        />
        <div className="border-t border-[var(--color-border-light)] pt-2">
          <PatternSelector
            patterns={patterns}
            selected={selectedPattern}
            onSelect={(name) => {
              setSelectedPattern(name);
              reset();
            }}
            disabled={state.isRunning}
          />
        </div>
      </footer>
    </div>
  );
}
