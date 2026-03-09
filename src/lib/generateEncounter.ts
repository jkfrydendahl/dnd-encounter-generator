import type {
  Monster,
  EncounterTemplate,
  EncounterSlot,
  GeneratorSettings,
  GeneratedEncounter,
  GeneratedEncounterEntry,
  TerrainSuggestion,
  MonsterRole,
  SlotRequirement,
} from "../types";
import { scoreMonsterCandidate } from "./scoreMonsterCandidate";
import { evaluateEncounter, buildThreatSummaryFromEntries } from "./evaluateEncounter";
import {
  MAX_GENERATION_ATTEMPTS,
  DEFAULT_LEVEL_MIN_OFFSET,
  DEFAULT_LEVEL_MAX_OFFSET,
  DEFAULT_TARGET_OFFSET,
  DEFAULT_MONSTER_COUNT,
} from "./constants";

function selectTemplate(
  templates: EncounterTemplate[],
  mode: string
): EncounterTemplate {
  // Specific template ID
  if (mode !== "any" && mode !== "standard" && mode !== "boss") {
    const specific = templates.find((t) => t.id === mode);
    if (specific) return specific;
  }

  const filtered =
    mode === "any"
      ? templates
      : templates.filter((t) => t.mode === mode);

  if (filtered.length === 0) {
    return templates[Math.floor(Math.random() * templates.length)];
  }

  // Weighted random selection
  const totalWeight = filtered.reduce((sum, t) => sum + t.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const template of filtered) {
    roll -= template.weight;
    if (roll <= 0) return template;
  }
  return filtered[filtered.length - 1];
}

function matchesSlotRequirement(
  monster: Monster,
  requirement: SlotRequirement
): boolean {
  // Check rank-based requirements
  if (requirement === "Elite") return monster.rank === "Elite";
  if (requirement === "Solo") return monster.rank === "Solo";

  // Check compound role requirements (e.g. "Brute|Soldier")
  const roles = requirement.split("|") as MonsterRole[];
  return roles.includes(monster.role);
}

function filterCandidates(
  monsters: Monster[],
  slot: EncounterSlot,
  settings: GeneratorSettings
): Monster[] {
  const minLevel = settings.partyLevel + settings.minLevelOffset;
  const maxLevel = settings.partyLevel + settings.maxLevelOffset;

  const base = monsters.filter((m) => {
    if (m.level < minLevel || m.level > maxLevel) return false;
    if (!matchesSlotRequirement(m, slot.requirement)) return false;
    return true;
  });

  // If a theme tag is set, prefer tagged monsters; fall back if too few
  if (settings.themeTag) {
    const tag = settings.themeTag.toLowerCase();
    const tagged = base.filter((m) =>
      m.tags.some((t) => t.toLowerCase() === tag)
    );
    if (tagged.length >= 3) return tagged;
  }

  return base;
}

function weightedRandomSelect(
  monsters: Monster[],
  scores: number[]
): Monster | null {
  if (monsters.length === 0) return null;

  // Shift scores so minimum is 1
  const minScore = Math.min(...scores);
  const shifted = scores.map((s) => s - minScore + 1);
  const total = shifted.reduce((sum, s) => sum + s, 0);

  let roll = Math.random() * total;
  for (let i = 0; i < monsters.length; i++) {
    roll -= shifted[i];
    if (roll <= 0) return monsters[i];
  }
  return monsters[monsters.length - 1];
}

function resolveSlot(
  slot: EncounterSlot,
  monsters: Monster[],
  currentEntries: GeneratedEncounterEntry[],
  settings: GeneratorSettings
): GeneratedEncounterEntry | null {
  const candidates = filterCandidates(monsters, slot, settings);
  if (candidates.length === 0) return null;

  const targetLevel =
    settings.partyLevel + settings.targetDifficultyOffset;

  const scores = candidates.map((monster) =>
    scoreMonsterCandidate(monster, {
      currentEntries,
      targetLevel,
      themeTag: settings.themeTag,
      duplicatePolicy: settings.duplicatePolicy,
    })
  );

  const selected = weightedRandomSelect(candidates, scores);
  if (!selected) return null;

  return {
    slotId: slot.id,
    monsterId: selected.id,
    monsterName: selected.name,
    role: selected.role,
    rank: selected.rank,
    level: selected.level,
    count: slot.count,
    source: selected.source,
    page: selected.page,
    tags: selected.tags,
    themes: selected.themes,
  };
}

const FILLER_ROLES: SlotRequirement[] = [
  "Skirmisher",
  "Controller",
  "Artillery",
  "Lurker",
  "Brute|Soldier",
];

function adaptTemplateSlots(
  template: EncounterTemplate,
  desiredCount: number
): EncounterTemplate {
  const slots = [...template.slots];
  if (slots.length === desiredCount) return template;

  if (slots.length > desiredCount) {
    // Remove non-essential slots from the end, never remove index 0 (primary)
    while (slots.length > desiredCount && slots.length > 1) {
      slots.pop();
    }
  } else {
    // Add filler slots rotating through diverse roles
    let fillerIdx = 0;
    while (slots.length < desiredCount) {
      const req = FILLER_ROLES[fillerIdx % FILLER_ROLES.length];
      slots.push({
        id: `extra-${slots.length}`,
        count: 1,
        requirement: req,
        label: "Extra",
      });
      fillerIdx++;
    }
  }

  return { ...template, slots };
}

function buildCandidateEncounter(
  template: EncounterTemplate,
  monsters: Monster[],
  settings: GeneratorSettings
): GeneratedEncounterEntry[] | null {
  const adapted = adaptTemplateSlots(template, settings.monsterCount ?? DEFAULT_MONSTER_COUNT);
  const entries: GeneratedEncounterEntry[] = [];

  for (const slot of adapted.slots) {
    const entry = resolveSlot(slot, monsters, entries, settings);
    if (!entry) return null; // Unfilled slot — reject candidate
    entries.push(entry);
  }

  return entries;
}

export function selectTerrains(
  terrainOptions: TerrainSuggestion[],
  entries: GeneratedEncounterEntry[],
  count: number
): TerrainSuggestion[] {
  if (terrainOptions.length === 0 || count <= 0) return [];

  const encounterTags = new Set(entries.flatMap((e) => e.tags));
  const encounterThemes = new Set(entries.flatMap((e) => e.themes ?? []));

  // Score all terrains by tag + theme overlap
  const scored = terrainOptions.map((terrain) => {
    const tagOverlap = terrain.tags.filter((t) => encounterTags.has(t)).length;
    const themeOverlap = terrain.tags.filter((t) => encounterThemes.has(t)).length;
    const score = tagOverlap * 2 + themeOverlap + Math.random() * 0.5;
    return { terrain, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Pick top N unique terrains
  const picked: TerrainSuggestion[] = [];
  for (const { terrain } of scored) {
    if (picked.length >= count) break;
    if (!picked.some((p) => p.id === terrain.id)) {
      picked.push(terrain);
    }
  }

  return picked;
}

const TAG_FLAVOR: Record<string, string[]> = {
  Fire: ["Burning", "Blazing", "Infernal"],
  Cold: ["Frozen", "Glacial", "Frostbitten"],
  Lightning: ["Crackling", "Stormlashed", "Thunder-Struck"],
  Shadow: ["Shadowed", "Twilight", "Darkened"],
  Undead: ["Cursed", "Deathbound", "Haunted"],
  Fey: ["Enchanted", "Fey-Touched", "Wyld"],
  Demon: ["Abyssal", "Fell", "Demonblood"],
  Fiend: ["Hellbound", "Fiendish", "Vile"],
  Dragon: ["Draconic", "Wyrm-Touched", "Scaled"],
  Elemental: ["Primal", "Elemental", "Tempest"],
  Beast: ["Savage", "Feral", "Wild"],
  Giant: ["Titanic", "Towering", "Colossal"],
  Humanoid: ["Warband", "Raiding", "Mercenary"],
  Goblinoid: ["Goblin", "Skullcrusher", "Trickster"],
  Aberration: ["Eldritch", "Maddening", "Twisted"],
  Plant: ["Overgrown", "Tangled", "Thornbound"],
  Construct: ["Iron", "Forged", "Clockwork"],
  Acid: ["Corrosive", "Dissolving", "Caustic"],
  Ooze: ["Oozing", "Gelatinous", "Slime-Ridden"],
  Celestial: ["Radiant", "Holy", "Fallen"],
  Shapechanger: ["Shifting", "Mimicborn", "Deceptive"],
  Poison: ["Venomous", "Toxic", "Blighted"],
};

function generateEncounterName(
  templateName: string,
  entries: GeneratedEncounterEntry[]
): string {
  // Count tags and themes across all entries
  const tagCounts = new Map<string, number>();
  const themeCounts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
    for (const theme of entry.themes ?? []) {
      themeCounts.set(theme, (themeCounts.get(theme) ?? 0) + 1);
    }
  }

  // Find the top tag shared by at least 2 entries
  let topTag = "";
  let topTagCount = 0;
  for (const [tag, count] of tagCounts) {
    if (count > topTagCount) {
      topTag = tag;
      topTagCount = count;
    }
  }

  // Find the top theme shared by at least 2 entries
  let topTheme = "";
  let topThemeCount = 0;
  for (const [theme, count] of themeCounts) {
    if (count > topThemeCount) {
      topTheme = theme;
      topThemeCount = count;
    }
  }

  // Build name: pick a flavor word from the top tag
  const flavorOptions = topTag ? TAG_FLAVOR[topTag] : undefined;
  const flavor = flavorOptions
    ? flavorOptions[Math.floor(Math.random() * flavorOptions.length)]
    : "";

  // Combine: "Flavor ThemeName TemplateName" or "Flavor TemplateName"
  if (topThemeCount >= 2 && flavor) {
    return `${flavor} ${topTheme} ${templateName}`;
  }
  if (topTagCount >= 2 && flavor) {
    return `${flavor} ${templateName}`;
  }
  if (topTagCount >= 2 && topTag) {
    return `${topTag} ${templateName}`;
  }

  return templateName;
}

export interface GenerateEncounterInput {
  monsters: Monster[];
  templates: EncounterTemplate[];
  terrain: TerrainSuggestion[];
  settings: GeneratorSettings;
}

export function generateEncounter(
  input: GenerateEncounterInput
): GeneratedEncounter | null {
  const { monsters, templates, terrain, settings } = input;

  // Adjust difficulty based on monster count deviation from baseline (4).
  // Fewer monsters → pick higher-level creatures to maintain challenge.
  // More monsters → pick lower-level creatures to avoid overwhelming.
  const countDelta = DEFAULT_MONSTER_COUNT - (settings.monsterCount ?? DEFAULT_MONSTER_COUNT);
  const countAdjustment = Math.round(countDelta * 0.75);

  const effectiveSettings: GeneratorSettings = {
    ...settings,
    minLevelOffset: (settings.minLevelOffset ?? DEFAULT_LEVEL_MIN_OFFSET) + Math.min(countAdjustment, 0),
    maxLevelOffset: (settings.maxLevelOffset ?? DEFAULT_LEVEL_MAX_OFFSET) + Math.max(countAdjustment, 0),
    targetDifficultyOffset:
      (settings.targetDifficultyOffset ?? DEFAULT_TARGET_OFFSET) + countAdjustment,
  };

  let bestEncounter: GeneratedEncounter | null = null;
  let bestScore = -Infinity;
  let bestIsValid = false;

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const template = selectTemplate(templates, effectiveSettings.templateMode);
    const entries = buildCandidateEncounter(
      template,
      monsters,
      effectiveSettings
    );

    if (!entries) continue;

    const targetLevel =
      effectiveSettings.partyLevel + effectiveSettings.targetDifficultyOffset;
    const diagnostics = evaluateEncounter(entries, targetLevel);

    // Prefer valid encounters: a valid encounter always beats an invalid one
    const isBetter =
      (!bestIsValid && diagnostics.isValid) ||
      (diagnostics.isValid === bestIsValid && diagnostics.score > bestScore);

    if (isBetter) {
      bestScore = diagnostics.score;
      bestIsValid = diagnostics.isValid;

      const threatSummary = buildThreatSummaryFromEntries(entries);
      const terrainSuggestions = selectTerrains(
        terrain,
        entries,
        effectiveSettings.terrainCount ?? 0
      );
      const name = generateEncounterName(template.name, entries);

      bestEncounter = {
        id: crypto.randomUUID(),
        name,
        templateId: template.id,
        templateName: template.name,
        entries,
        threatSummary,
        diagnostics,
        terrainSuggestions,
      };
    }
  }

  return bestEncounter;
}

export function rerollSlot(
  encounter: GeneratedEncounter,
  slotId: string,
  input: GenerateEncounterInput
): GeneratedEncounter {
  const { monsters, templates, settings } = input;

  const template = templates.find((t) => t.id === encounter.templateId);
  if (!template) return encounter;

  const adapted = adaptTemplateSlots(template, settings.monsterCount ?? DEFAULT_MONSTER_COUNT);
  const slot = adapted.slots.find((s) => s.id === slotId);
  if (!slot) return encounter;

  const countDelta = DEFAULT_MONSTER_COUNT - (settings.monsterCount ?? DEFAULT_MONSTER_COUNT);
  const countAdjustment = Math.round(countDelta * 0.75);
  const effectiveSettings: GeneratorSettings = {
    ...settings,
    minLevelOffset: (settings.minLevelOffset ?? DEFAULT_LEVEL_MIN_OFFSET) + Math.min(countAdjustment, 0),
    maxLevelOffset: (settings.maxLevelOffset ?? DEFAULT_LEVEL_MAX_OFFSET) + Math.max(countAdjustment, 0),
    targetDifficultyOffset:
      (settings.targetDifficultyOffset ?? DEFAULT_TARGET_OFFSET) + countAdjustment,
  };

  // Other entries stay fixed — pass them as context for scoring
  const otherEntries = encounter.entries.filter((e) => e.slotId !== slotId);
  const newEntry = resolveSlot(slot, monsters, otherEntries, effectiveSettings);
  if (!newEntry) return encounter;

  const entries = encounter.entries.map((e) =>
    e.slotId === slotId ? newEntry : e
  );

  const targetLevel =
    effectiveSettings.partyLevel + effectiveSettings.targetDifficultyOffset;
  const diagnostics = evaluateEncounter(entries, targetLevel);
  const threatSummary = buildThreatSummaryFromEntries(entries);
  const name = generateEncounterName(encounter.templateName, entries);

  return {
    ...encounter,
    name,
    entries,
    threatSummary,
    diagnostics,
  };
}
