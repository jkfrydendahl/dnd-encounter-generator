import { useState } from "react";
import type { GeneratedEncounter } from "../../types";

export type LockedSlots = Set<string>;

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

  for (const terrain of encounter.terrainSuggestions) {
    lines.push("");
    lines.push(`Terrain: ${terrain.name}`);
    lines.push(terrain.description);
    if (terrain.powers?.length) {
      lines.push("");
      lines.push("Terrain Powers:");
      for (const power of terrain.powers) {
        lines.push(`  ${power.name}`);
        lines.push(`    Trigger: ${power.trigger}`);
        lines.push(`    Effect: ${power.effect}`);
        if (power.recharge) lines.push(`    Recharge: ${power.recharge}`);
      }
    }
  }

  return lines.join("\n");
}

interface EncounterDisplayProps {
  encounter: GeneratedEncounter | null;
  onRerollSlot?: (slotId: string) => void;
  lockedSlots?: LockedSlots;
  onToggleLock?: (slotId: string) => void;
  lockedTerrains?: Set<string>;
  onToggleTerrainLock?: (terrainId: string) => void;
  onClearAllLocks?: () => void;
  onMonsterClick?: (entry: GeneratedEncounter["entries"][number]) => void;
  onPinMonster?: (entry: GeneratedEncounter["entries"][number]) => void;
  isPinned?: (monsterName: string) => boolean;
  pinnedCardsSlot?: React.ReactNode;
}

export function EncounterDisplay({
  encounter,
  onRerollSlot,
  lockedSlots,
  onToggleLock,
  lockedTerrains,
  onToggleTerrainLock,
  onClearAllLocks,
  onMonsterClick,
  onPinMonster,
  isPinned,
  pinnedCardsSlot,
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
            {onRerollSlot && <th className="slot-actions-col"></th>}
          </tr>
        </thead>
        <tbody>
          {encounter.entries.map((entry) => {
            const isLocked = lockedSlots?.has(entry.slotId) ?? false;
            return (
              <tr key={entry.slotId} className={isLocked ? "slot-locked" : ""}>
                <td
                  className={onMonsterClick ? "monster-name-clickable" : ""}
                  onClick={onMonsterClick ? () => onMonsterClick(entry) : undefined}
                >
                  {entry.monsterName}
                </td>
                <td>{entry.role}</td>
                <td>{entry.rank}</td>
                <td>{entry.level}</td>
                <td>{entry.count}</td>
                <td>{entry.source} p.{entry.page}</td>
                {onRerollSlot && (
                  <td className="slot-actions">
                    {onPinMonster && (
                      <button
                        className={`pin-btn${isPinned?.(entry.monsterName) ? ' pinned' : ''}`}
                        onClick={() => onPinMonster(entry)}
                        title={isPinned?.(entry.monsterName) ? 'Unpin stat block' : 'Pin stat block'}
                        aria-label={isPinned?.(entry.monsterName) ? 'Unpin' : 'Pin'}
                      >
                        📌
                      </button>
                    )}
                    <button
                      className={"slot-lock-btn" + (isLocked ? " locked" : "")}
                      onClick={() => onToggleLock?.(entry.slotId)}
                      title={isLocked ? "Unlock slot" : "Lock slot"}
                    >
                      {isLocked ? "🔒" : "🔓"}
                    </button>
                    <button
                      className="slot-reroll-btn"
                      onClick={() => onRerollSlot(entry.slotId)}
                      disabled={isLocked}
                      title="Reroll this slot"
                    >
                      ↻
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {pinnedCardsSlot}

      {encounter.terrainSuggestions.length > 0 && encounter.terrainSuggestions.map((terrain) => {
        const isTerrainLocked = lockedTerrains?.has(terrain.id) ?? false;
        return (
        <div key={terrain.id} className={"terrain-suggestion" + (isTerrainLocked ? " terrain-locked" : "")}>
          <div className="terrain-header">
            <h3>Terrain: {terrain.name}</h3>
            {onToggleTerrainLock && (
              <button
                className={"terrain-lock-btn" + (isTerrainLocked ? " locked" : "")}
                onClick={() => onToggleTerrainLock(terrain.id)}
                title={isTerrainLocked ? "Unlock terrain" : "Lock terrain"}
              >
                {isTerrainLocked ? "🔒" : "🔓"}
              </button>
            )}
          </div>
          <p>{terrain.description}</p>
          {terrain.powers?.length ? (
            <div className="terrain-powers">
              <h4>Terrain Powers</h4>
              {terrain.powers.map((power) => (
                <div key={power.name} className="terrain-power">
                  <strong>{power.name}</strong>
                  <span className="power-trigger">{power.trigger}</span>
                  <p className="power-effect">{power.effect}</p>
                  {power.recharge && (
                    <span className="power-recharge">{power.recharge}</span>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
        );
      })}

      <div className="encounter-actions">
        {onClearAllLocks && (
          <button className="clear-locks-button" onClick={onClearAllLocks} disabled={(lockedSlots?.size ?? 0) === 0 && (lockedTerrains?.size ?? 0) === 0}>
            Clear All Locks
          </button>
        )}
        <button className="copy-button" onClick={handleCopy}>
          {copied ? "Copied!" : "Copy to Clipboard"}
        </button>
      </div>
    </div>
  );
}
