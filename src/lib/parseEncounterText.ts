import type {
  GeneratedEncounter,
  GeneratedEncounterEntry,
  Monster,
  TerrainSuggestion,
  MonsterRole,
  MonsterRank,
} from "../types";
import { evaluateEncounter, buildThreatSummaryFromEntries } from "./evaluateEncounter";

/**
 * Parse clipboard text (produced by encounterToText) back into a GeneratedEncounter.
 * Returns null if the text cannot be parsed.
 */
export function parseEncounterText(
  text: string,
  monsters: Monster[],
  terrainOptions: TerrainSuggestion[]
): GeneratedEncounter | null {
  const lines = text.split(/\r?\n/);
  if (lines.length < 4) return null;

  const name = lines[0].trim();
  if (!name) return null;

  const templateLine = lines[1]?.trim();
  if (!templateLine?.startsWith("Template:")) return null;
  const templateName = templateLine.replace("Template:", "").trim();

  // Find the separator line (all dashes) — monster rows follow it
  let separatorIdx = -1;
  for (let i = 2; i < lines.length; i++) {
    if (/^-{5,}$/.test(lines[i].trim())) {
      separatorIdx = i;
      break;
    }
  }
  if (separatorIdx === -1) return null;

  // Build a case-insensitive monster lookup
  const monsterByName = new Map<string, Monster>();
  for (const m of monsters) {
    monsterByName.set(m.name.toLowerCase(), m);
  }

  // Parse monster rows until we hit an empty line or terrain
  const entries: GeneratedEncounterEntry[] = [];
  let i = separatorIdx + 1;
  for (; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) break;

    // Parse the fixed-width columns by matching against known monster names
    // Strategy: try progressively longer prefixes until we find a monster match
    const trimmed = line.trim();
    let matched: Monster | undefined;
    let rest = "";

    // Try matching from the longest possible name downward
    const words = trimmed.split(/\s{2,}/);
    if (words.length >= 4) {
      // Try the first token as monster name
      const candidateName = words[0].trim();
      matched = monsterByName.get(candidateName.toLowerCase());
      rest = words.slice(1).join("  ");
    }

    if (!matched) {
      // Fallback: try splitting on known roles
      const rolePattern = /\s+(Brute|Soldier|Skirmisher|Artillery|Controller|Lurker|Minion)\s+/;
      const roleMatch = trimmed.match(rolePattern);
      if (roleMatch && roleMatch.index !== undefined) {
        const candidateName = trimmed.substring(0, roleMatch.index).trim();
        matched = monsterByName.get(candidateName.toLowerCase());
        rest = trimmed.substring(roleMatch.index).trim();
      }
    }

    if (!matched) continue;

    // Parse remaining: Role, Rank, Level, Count, Source
    const parts = rest.trim().split(/\s{2,}/);
    const role = (parts[0]?.trim() || matched.role) as MonsterRole;
    const rank = (parts[1]?.trim() || matched.rank) as MonsterRank;
    const count = parseInt(parts[3]?.trim() ?? "", 10) || 1;

    entries.push({
      slotId: `imported-${entries.length}`,
      monsterId: matched.id,
      monsterName: matched.name,
      role,
      rank,
      level: matched.level,
      count,
      source: matched.source,
      page: matched.page,
      tags: matched.tags,
      alignment: matched.alignment,
      themes: matched.themes,
    });
  }

  if (entries.length === 0) return null;

  // Parse terrain sections
  const terrainByName = new Map<string, TerrainSuggestion>();
  for (const t of terrainOptions) {
    terrainByName.set(t.name.toLowerCase(), t);
  }

  const terrainSuggestions: TerrainSuggestion[] = [];
  for (; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("Terrain:")) {
      const terrainName = line.replace("Terrain:", "").trim();
      const found = terrainByName.get(terrainName.toLowerCase());
      if (found) {
        terrainSuggestions.push(found);
      }
    }
  }

  const avgLevel = Math.round(entries.reduce((s, e) => s + e.level, 0) / entries.length);
  const diagnostics = evaluateEncounter(entries, avgLevel);
  const threatSummary = buildThreatSummaryFromEntries(entries);

  return {
    id: crypto.randomUUID(),
    name,
    templateId: "imported",
    templateName,
    entries,
    threatSummary,
    diagnostics,
    terrainSuggestions,
  };
}
