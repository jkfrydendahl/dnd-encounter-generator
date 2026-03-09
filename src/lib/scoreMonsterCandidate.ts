import type {
  Monster,
  GeneratedEncounterEntry,
  ThreatSummary,
  DuplicatePolicy,
} from "../types";
import {
  getThreatCategory,
  buildThreatSummary,
  getPresentThreatCategories,
} from "./threatCategories";
import {
  MISSING_THREAT_BONUS,
  UNDERREPRESENTED_THREAT_BONUS,
  THEME_MATCH_BONUS,
  TAG_COHERENCE_BONUS,
  THEME_COHERENCE_BONUS,
  DUPLICATE_PENALTY,
  EXCESS_BRUTE_PENALTY,
  OVERREPRESENTED_CATEGORY_PENALTY,
  BRUTE_LIMIT,
} from "./constants";

export interface CandidateContext {
  currentEntries: GeneratedEncounterEntry[];
  targetLevel: number;
  themeTag?: string;
  duplicatePolicy: DuplicatePolicy;
}

export function scoreMonsterCandidate(
  monster: Monster,
  context: CandidateContext
): number {
  let score = 0;

  // Level proximity: +20 for exact target, scaling down
  const levelDiff = Math.abs(monster.level - context.targetLevel);
  score += Math.max(0, 20 - levelDiff * 5);

  // Theme match bonus
  if (
    context.themeTag &&
    monster.tags.some(
      (t) => t.toLowerCase() === context.themeTag!.toLowerCase()
    )
  ) {
    score += THEME_MATCH_BONUS;
  }

  // Threat category analysis
  const summary = buildThreatSummary(context.currentEntries);
  const presentCategories = getPresentThreatCategories(summary);
  const monsterCategory = getThreatCategory(monster.role);

  // Fills missing threat category
  if (
    monsterCategory !== "neutral" &&
    !presentCategories.includes(monsterCategory)
  ) {
    score += MISSING_THREAT_BONUS;
  }

  // Supports underrepresented category
  if (monsterCategory !== "neutral" && presentCategories.includes(monsterCategory)) {
    const categoryValue = summary[monsterCategory as keyof ThreatSummary];
    const maxValue = Math.max(summary.pressure, summary.damage, summary.control);
    if (maxValue > 0 && categoryValue < maxValue) {
      score += UNDERREPRESENTED_THREAT_BONUS;
    }
  }

  // Overrepresented category penalty
  if (monsterCategory !== "neutral" && presentCategories.length > 0) {
    const categoryValue = summary[monsterCategory as keyof ThreatSummary];
    const total = summary.pressure + summary.damage + summary.control;
    if (total > 0 && categoryValue / total > 0.5) {
      score -= OVERREPRESENTED_CATEGORY_PENALTY;
    }
  }

  // Duplicate penalty
  if (context.duplicatePolicy !== "allow") {
    const isDuplicate = context.currentEntries.some(
      (e) => e.monsterId === monster.id
    );
    if (isDuplicate) {
      score -= context.duplicatePolicy === "avoid"
        ? DUPLICATE_PENALTY * 2
        : DUPLICATE_PENALTY;
    }
  }

  // Brute over-cap penalty
  if (monster.role === "Brute") {
    const bruteCount = context.currentEntries.filter(
      (e) => e.role === "Brute"
    ).length;
    if (bruteCount >= BRUTE_LIMIT) {
      score -= EXCESS_BRUTE_PENALTY;
    }
  }

  // Tag coherence: bonus for sharing tags with already-selected monsters
  if (context.currentEntries.length > 0) {
    const existingTags = new Set(
      context.currentEntries.flatMap((e) => e.tags)
    );
    const sharedTags = monster.tags.filter((t) => existingTags.has(t));
    if (sharedTags.length > 0) {
      score += TAG_COHERENCE_BONUS;
    }
  }

  // Theme coherence: bonus for sharing themes with already-selected monsters
  if (monster.themes && monster.themes.length > 0 && context.currentEntries.length > 0) {
    const existingThemes = new Set(
      context.currentEntries.flatMap((e) => e.themes ?? [])
    );
    const sharedThemes = monster.themes.filter((t) => existingThemes.has(t));
    if (sharedThemes.length > 0) {
      score += THEME_COHERENCE_BONUS;
    }
  }

  // Small random factor for variation
  score += Math.random() * 5;

  return score;
}
