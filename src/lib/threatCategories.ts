import type { MonsterRole, GeneratedEncounterEntry, ThreatSummary } from "../types";

export type ThreatCategory = "pressure" | "damage" | "control" | "neutral";

const roleToCategoryMap: Record<MonsterRole, ThreatCategory> = {
  Brute: "pressure",
  Soldier: "pressure",
  Artillery: "damage",
  Lurker: "damage",
  Skirmisher: "damage",
  Controller: "control",
  Minion: "neutral",
};

export function getThreatCategory(role: MonsterRole): ThreatCategory {
  return roleToCategoryMap[role];
}

export function buildThreatSummary(entries: GeneratedEncounterEntry[]): ThreatSummary {
  const summary: ThreatSummary = { pressure: 0, damage: 0, control: 0 };

  for (const entry of entries) {
    const category = getThreatCategory(entry.role);
    if (category === "pressure") summary.pressure += entry.count;
    else if (category === "damage") summary.damage += entry.count;
    else if (category === "control") summary.control += entry.count;
  }

  return summary;
}

export function countThreatCategories(summary: ThreatSummary): number {
  let count = 0;
  if (summary.pressure > 0) count++;
  if (summary.damage > 0) count++;
  if (summary.control > 0) count++;
  return count;
}

export function getPresentThreatCategories(
  summary: ThreatSummary
): ThreatCategory[] {
  const categories: ThreatCategory[] = [];
  if (summary.pressure > 0) categories.push("pressure");
  if (summary.damage > 0) categories.push("damage");
  if (summary.control > 0) categories.push("control");
  return categories;
}
