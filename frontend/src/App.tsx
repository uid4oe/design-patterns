import { useState, useEffect, useCallback } from "react";
import { useSimulation } from "./hooks/useSimulation.ts";
import { PatternSelector } from "./components/PatternSelector.tsx";
import { ControlPanel } from "./components/ControlPanel.tsx";
import { TopologyView } from "./components/TopologyView.tsx";
import { MetricsPanel } from "./components/MetricsPanel.tsx";
import { EventLog } from "./components/EventLog.tsx";
import { LearnView } from "./components/LearnView.tsx";
import type { PatternInfo, ScenarioConfig } from "./types.ts";
import type { SuggestedScenario } from "./data/pattern-content.ts";

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

  const handleTryScenario = useCallback(
    (scenario: SuggestedScenario) => {
      if (!selectedPattern || state.isRunning) return;
      const config: ScenarioConfig = {
        requestCount: scenario.requestCount,
        requestsPerSecond: scenario.requestsPerSecond,
        failureInjection: scenario.failureInjection,
      };
      run(config);
    },
    [selectedPattern, state.isRunning, run],
  );

  return (
    <div className="h-screen flex flex-col p-2 lg:p-2.5 gap-2 lg:gap-2">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-between px-4 py-1">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🔧</span>
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">
            Design Patterns
          </h1>
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

      {/* Main panels */}
      <main className="flex flex-1 min-h-0 flex-col lg:flex-row gap-2 lg:gap-2.5">
        {/* LEFT — Educational content */}
        <div className="flex-[3] min-h-0 glass rounded-2xl overflow-hidden">
          <LearnView
            selectedPattern={selectedPattern}
            onTryScenario={handleTryScenario}
          />
        </div>

        {/* RIGHT — Topology graph + Stats */}
        <div className="flex-[2] min-h-0 flex flex-col gap-2">
          {/* Topology visualization */}
          <div className="flex-1 min-h-0 glass-strong rounded-2xl overflow-hidden">
            <TopologyView nodes={state.nodes} edges={state.edges} />
          </div>

          {/* Metrics summary */}
          <div className="shrink-0">
            <MetricsPanel metrics={state.metrics} isRunning={state.isRunning} />
          </div>

          {/* Event log */}
          {state.events.length > 0 && (
            <div className="shrink-0">
              <EventLog events={state.events} />
            </div>
          )}

          {/* Error */}
          {state.error && !state.isRunning && (
            <div className="shrink-0 glass-card rounded-xl border border-red-200 px-3.5 py-2 text-[12px] text-red-600 animate-fade-in">
              <span className="font-medium">Error:</span> {state.error}
            </div>
          )}
        </div>
      </main>

      {/* Footer — Controls + Pattern selector */}
      <div className="shrink-0">
        <div className="glass-strong rounded-2xl px-3 py-2">
          {/* Controls row */}
          <ControlPanel
            isRunning={state.isRunning}
            onRun={run}
            onReset={reset}
          />

          {/* Pattern tabs row */}
          <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-[var(--color-border-light)]">
            <PatternSelector
              patterns={patterns}
              selected={selectedPattern}
              onSelect={(name) => {
                setSelectedPattern(name);
                reset();
              }}
              disabled={state.isRunning}
            />
            <div className="flex-1" />
            <span className="text-[11px] text-[var(--color-text-tertiary)] hidden sm:block">
              System Design &amp; Distribution Patterns
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
