import { useState } from "react";
import type { GeneratedEncounter } from "../../types";

function encounterToText(encounter: GeneratedEncounter): string {
  const lines: string[] = [];
  lines.push(encounter.name);
  lines.push(`Template: ${encounter.templateName}`);
  lines.push("");

  const nameWidth = Math.max(7, ...encounter.entries.map((e) => e.monsterName.length));
  const header = "Monster".padEnd(nameWidth + 2) + "Role          Rank       Lvl  Qty  Source";
  lines.push(header);
  lines.push("-".repeat(header.length));

  for (const entry of encounter.entries) {
    const row =
      entry.monsterName.padEnd(nameWidth + 2) +
      entry.role.padEnd(14) +
      entry.rank.padEnd(11) +
      String(entry.level).padStart(3) +
      String(entry.count).padStart(5) +
      "  " +
      `${entry.source} p.${entry.page}`;
    lines.push(row);
  }

  if (encounter.terrainSuggestion) {
    lines.push("");
    lines.push(`Terrain: ${encounter.terrainSuggestion.name}`);
    lines.push(encounter.terrainSuggestion.description);
    if (encounter.terrainSuggestion.actions?.length) {
      lines.push("");
      lines.push("Terrain Actions:");
      for (const action of encounter.terrainSuggestion.actions) {
        lines.push(`  ${action.name}`);
        lines.push(`    Trigger: ${action.trigger}`);
        lines.push(`    Effect: ${action.effect}`);
        if (action.recharge) lines.push(`    Recharge: ${action.recharge}`);
      }
    }
  }

  return lines.join("\n");
}

interface EncounterDisplayProps {
  encounter: GeneratedEncounter | null;
  onReroll: () => void;
}

export function EncounterDisplay({
  encounter,
  onReroll,
}: EncounterDisplayProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!encounter) return;
    navigator.clipboard.writeText(encounterToText(encounter)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  if (!encounter) {
    return (
      <div className="encounter-panel empty">
        <p>No encounter generated yet. Adjust settings and click Generate.</p>
      </div>
    );
  }

  return (
    <div className="encounter-panel">
      <div className="encounter-header">
        <h2>{encounter.name}</h2>
        <span className="template-label">{encounter.templateName}</span>
      </div>

      <table className="monster-table">
        <thead>
          <tr>
            <th>Monster</th>
            <th>Role</th>
            <th>Rank</th>
            <th>Level</th>
            <th>Count</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {encounter.entries.map((entry) => (
            <tr key={entry.slotId}>
              <td>{entry.monsterName}</td>
              <td>{entry.role}</td>
              <td>{entry.rank}</td>
              <td>{entry.level}</td>
              <td>{entry.count}</td>
              <td>{entry.source} p.{entry.page}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {encounter.terrainSuggestion && (
        <div className="terrain-suggestion">
          <h3>Terrain: {encounter.terrainSuggestion.name}</h3>
          <p>{encounter.terrainSuggestion.description}</p>
          {encounter.terrainSuggestion.actions?.length ? (
            <div className="terrain-actions">
              <h4>Terrain Actions</h4>
              {encounter.terrainSuggestion.actions.map((action) => (
                <div key={action.name} className="terrain-action">
                  <strong>{action.name}</strong>
                  <span className="action-trigger">{action.trigger}</span>
                  <p className="action-effect">{action.effect}</p>
                  {action.recharge && (
                    <span className="action-recharge">{action.recharge}</span>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      <div className="encounter-actions">
        <button className="reroll-button" onClick={onReroll}>
          Reroll Encounter
        </button>
        <button className="copy-button" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy to Clipboard"}
        </button>
      </div>
    </div>
  );
}
