import type { EncounterDiagnostics, ThreatSummary } from "../../types";

interface DiagnosticsPanelProps {
  diagnostics: EncounterDiagnostics | null;
  threatSummary: ThreatSummary | null;
}

function ThreatBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="threat-bar">
      <span className="threat-label">{label}</span>
      <div className="threat-track">
        <div className="threat-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="threat-value">{value}</span>
    </div>
  );
}

export function DiagnosticsPanel({
  diagnostics,
  threatSummary,
}: DiagnosticsPanelProps) {
  if (!diagnostics || !threatSummary) {
    return (
      <div className="diagnostics-panel empty">
        <p>Generate an encounter to see diagnostics.</p>
      </div>
    );
  }

  const maxThreat = Math.max(
    threatSummary.pressure,
    threatSummary.damage,
    threatSummary.control,
    1
  );

  return (
    <div className="diagnostics-panel">
      <h2>Diagnostics</h2>

      <div className="threat-summary">
        <h3>Threat Summary</h3>
        <ThreatBar label="Pressure" value={threatSummary.pressure} max={maxThreat} />
        <ThreatBar label="Damage" value={threatSummary.damage} max={maxThreat} />
        <ThreatBar label="Control" value={threatSummary.control} max={maxThreat} />
      </div>

      <div className="quality-score">
        <h3>Quality Score</h3>
        <span className={`score ${diagnostics.isValid ? "valid" : "invalid"}`}>
          {diagnostics.score}
        </span>
        <span className="validity">
          {diagnostics.isValid ? "✓ Valid" : "✗ Invalid"}
        </span>
      </div>

      <div className="category-info">
        <span>Threat categories: {diagnostics.categoryCount}/3</span>
      </div>

      {diagnostics.warnings.length > 0 && (
        <div className="warnings">
          <h3>Warnings</h3>
          <ul>
            {diagnostics.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
