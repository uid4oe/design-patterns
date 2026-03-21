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
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="glass-strong px-6 py-3 flex items-center justify-between border-b border-[var(--color-border)]">
        <div className="flex items-center gap-3">
          <span className="text-xl">🔧</span>
          <h1 className="text-lg font-bold text-[var(--color-text-primary)]">
            Design Patterns
          </h1>
        </div>
        <span className="text-xs text-[var(--color-text-muted)]">
          System Design &amp; Distribution Patterns
        </span>
      </header>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-64 glass-strong border-r border-[var(--color-border)] flex flex-col p-4 gap-4 overflow-y-auto">
          <div>
            <h2 className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
              Patterns
            </h2>
            <PatternSelector
              patterns={patterns}
              selected={selectedPattern}
              onSelect={(name) => {
                setSelectedPattern(name);
                reset();
              }}
            />
          </div>
          <div className="border-t border-[var(--color-border)] pt-4">
            <h2 className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
              Configuration
            </h2>
            <ControlPanel
              isRunning={state.isRunning}
              onRun={run}
              onReset={reset}
            />
          </div>
        </aside>

        {/* Center: topology + event log */}
        <main className="flex-1 flex flex-col min-h-0">
          <TopologyView nodes={state.nodes} edges={state.edges} />
          <EventLog events={state.events} />
        </main>
      </div>

      {/* Bottom metrics bar */}
      <MetricsPanel metrics={state.metrics} isRunning={state.isRunning} />

      {/* Error toast */}
      {state.error && !state.isRunning && (
        <div className="fixed bottom-20 right-4 glass-strong border border-[var(--color-error)] px-4 py-2 rounded-lg text-sm text-[var(--color-error)] max-w-sm">
          {state.error}
        </div>
      )}
    </div>
  );
}
