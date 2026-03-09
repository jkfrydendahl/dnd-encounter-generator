import type {
  GeneratedEncounterEntry,
  EncounterDiagnostics,
  ThreatSummary,
} from "../types";
import {
  buildThreatSummary,
  countThreatCategories,
} from "./threatCategories";
import { BRUTE_LIMIT, MIN_REQUIRED_THREAT_CATEGORIES, EVAL_TAG_COHERENCE_BONUS, EVAL_THEME_COHERENCE_BONUS } from "./constants";

export function evaluateEncounter(
  entries: GeneratedEncounterEntry[],
  targetLevel: number
): EncounterDiagnostics {
  const summary = buildThreatSummary(entries);
  const categoryCount = countThreatCategories(summary);
  const warnings: string[] = [];
  let score = 0;

  const hasPressure = summary.pressure > 0;
  const hasDamage = summary.damage > 0;
  const hasControl = summary.control > 0;

  // Reward threat diversity
  if (hasPressure) score += 15;
  if (hasDamage) score += 15;
  if (hasControl) score += 15;

  // Bonus for having all three categories
  if (categoryCount === 3) score += 10;

  // Penalize missing categories
  if (!hasDamage) {
    warnings.push("Encounter has no damage threat");
    score -= 25;
  }
  if (categoryCount < MIN_REQUIRED_THREAT_CATEGORIES) {
    warnings.push("Encounter has fewer than two threat categories");
    score -= 20;
  }

  // Role variety
  const uniqueRoles = new Set(entries.map((e) => e.role));
  score += uniqueRoles.size * 5;

  // Brute check
  const bruteCount = entries.filter((e) => e.role === "Brute").length;
  if (bruteCount > BRUTE_LIMIT) {
    warnings.push("Encounter has too many Brutes");
    score -= 15 * (bruteCount - BRUTE_LIMIT);
  }

  // Duplicate monster check
  const monsterCounts = new Map<string, number>();
  for (const entry of entries) {
    monsterCounts.set(
      entry.monsterId,
      (monsterCounts.get(entry.monsterId) ?? 0) + 1
    );
  }
  const duplicateCount = [...monsterCounts.values()].filter((c) => c > 1).length;
  if (duplicateCount > 0) {
    warnings.push("Encounter contains duplicate monsters across slots");
    score -= 10 * duplicateCount;
  }

  // Single monster type check
  const uniqueMonsters = new Set(entries.map((e) => e.monsterId));
  if (uniqueMonsters.size === 1 && entries.length > 1) {
    warnings.push("Encounter consists of a single monster type");
    score -= 20;
  }

  // Level coherence
  const levelDiffs = entries.map((e) => Math.abs(e.level - targetLevel));
  const avgLevelDiff =
    levelDiffs.reduce((sum, d) => sum + d, 0) / levelDiffs.length;
  score += Math.max(0, 15 - avgLevelDiff * 4);

  // Tag coherence: reward encounters where monsters share tags
  const allTags = entries.flatMap((e) => e.tags);
  const tagCounts = new Map<string, number>();
  for (const tag of allTags) {
    tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
  }
  const maxTagCount = Math.max(0, ...tagCounts.values());
  // Graduated bonuses: more shared tags = better coherence
  if (maxTagCount >= 2) score += EVAL_TAG_COHERENCE_BONUS;
  if (maxTagCount >= 3) score += EVAL_TAG_COHERENCE_BONUS;
  if (maxTagCount === entries.length && entries.length > 2) score += EVAL_TAG_COHERENCE_BONUS;

  // Theme coherence: reward encounters where monsters share themes
  const allThemes = entries.flatMap((e) => e.themes ?? []);
  if (allThemes.length > 0) {
    const themeCounts = new Map<string, number>();
    for (const theme of allThemes) {
      themeCounts.set(theme, (themeCounts.get(theme) ?? 0) + 1);
    }
    const maxThemeCount = Math.max(0, ...themeCounts.values());
    if (maxThemeCount >= 2) score += EVAL_THEME_COHERENCE_BONUS;
    if (maxThemeCount >= 3) score += EVAL_THEME_COHERENCE_BONUS;
  }

  // Single-role check: reject encounters with only one monster role
  if (uniqueRoles.size <= 1 && entries.length > 1) {
    warnings.push("Encounter has only one monster role");
    score -= 20;
  }

  // Validity: reject encounters violating hard rules
  const isValid =
    categoryCount >= MIN_REQUIRED_THREAT_CATEGORIES &&
    hasDamage &&
    uniqueMonsters.size > 1 &&
    (uniqueRoles.size > 1 || entries.length <= 1);

  return {
    hasPressure,
    hasDamage,
    hasControl,
    categoryCount,
    warnings,
    score: Math.round(score),
    isValid,
  };
}

export function buildThreatSummaryFromEntries(
  entries: GeneratedEncounterEntry[]
): ThreatSummary {
  return buildThreatSummary(entries);
}
