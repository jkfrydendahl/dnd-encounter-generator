# Implementation Plan – D&D 4e Encounter Generator

This document describes the implementation plan for the **D&D 4e Encounter Generator** PWA.

The repository currently starts with:

```text
.github/
  generator-rules.md
  implementation-plan.md
```

- `generator-rules.md` defines the **encounter design heuristics** used by the generator.
- `implementation-plan.md` defines the **system structure, build order, and implementation approach**.

This setup is intentionally minimal and high-signal for Copilot.

---

# Project Goal

Create a **Progressive Web App (PWA)** that generates **tactically interesting D&D 4e encounters** for optimized parties.

The generator intentionally **does not use XP budgets**.

Instead, it should rely on:

- encounter templates
- monster role composition
- weighted random selection
- encounter diagnostics
- rejection of weak encounters
- local scoring bias while building encounters
- final scoring across multiple generated candidates

The result should feel like a **GM assistant**, not a random monster picker.

---

# Tech Stack

The application should use:

- React
- TypeScript
- Vite
- vite-plugin-pwa

State handling:

- React state
- settings stored in `localStorage`

Deployment target:

- static Vercel app
- entirely client-side for MVP

No backend is required for the first version.

---

# Development Order

Copilot performs better if development happens in this order:

1. define data types
2. define constants
3. implement generator pipeline
4. implement diagnostics and scoring
5. build UI
6. add PWA support
7. polish UX and persistence

Do **not** start by building UI components.

The generator logic should exist and be testable before the UI is layered on top.

---

# Recommended Project Structure

```text
src/
  components/
    controls/
    encounter/
    layout/

  data/
    monsters.json
    templates.json
    terrain.json

  lib/
    constants.ts
    generateEncounter.ts
    scoreMonsterCandidate.ts
    evaluateEncounter.ts
    threatCategories.ts

  types.ts

  hooks/
    useGeneratorSettings.ts

  pages/
    HomePage.tsx

  App.tsx
  main.tsx
```

## Structure Notes

- Generator logic belongs in `src/lib`, not inside React components.
- `generateEncounter.ts` should be the single public entry point to the generator.
- `scoreMonsterCandidate.ts` should handle **slot-level role-balance biasing**.
- `evaluateEncounter.ts` should handle **final encounter scoring**.
- `threatCategories.ts` should keep role-to-threat mapping centralized.

This is worth being explicit about, because Copilot will otherwise tend to collapse too much logic into one file.

---

# Initial File Scaffolding

Create these files before asking Copilot to implement logic:

```text
src/types.ts

src/lib/constants.ts
src/lib/generateEncounter.ts
src/lib/scoreMonsterCandidate.ts
src/lib/evaluateEncounter.ts
src/lib/threatCategories.ts
```

Even empty files improve Copilot suggestions because they make the intended architecture visible.

---

# Core Domain Types

## Monster

```ts
export type MonsterRole =
  | "Brute"
  | "Soldier"
  | "Skirmisher"
  | "Artillery"
  | "Controller"
  | "Lurker"
  | "Minion";

export type MonsterRank = "Standard" | "Elite" | "Solo";

export interface Monster {
  id: string;
  name: string;
  level: number;
  role: MonsterRole;
  rank: MonsterRank;
  tags: string[];
  themes?: string[];
}
```

## Encounter Template

```ts
export type TemplateMode = "standard" | "boss" | "any";

export type SlotRequirement =
  | "Brute"
  | "Soldier"
  | "Skirmisher"
  | "Artillery"
  | "Controller"
  | "Lurker"
  | "Minion"
  | "Elite"
  | "Solo"
  | "Brute|Soldier"
  | "Artillery|Lurker"
  | "Skirmisher|Lurker"
  | "Skirmisher|Controller"
  | "Controller|Artillery";

export interface EncounterSlot {
  id: string;
  count: number;
  requirement: SlotRequirement;
  label?: string;
}

export interface EncounterTemplate {
  id: string;
  name: string;
  mode: TemplateMode;
  weight: number;
  slots: EncounterSlot[];
}
```

## Generator Settings

```ts
export type DuplicatePolicy = "allow" | "soft-avoid" | "avoid";

export interface GeneratorSettings {
  partyLevel: number;
  minLevelOffset: number;
  maxLevelOffset: number;
  targetDifficultyOffset: number;
  themeTag?: string;
  templateMode: "standard" | "boss" | "any";
  duplicatePolicy: DuplicatePolicy;
  includeTerrain: boolean;
}
```

## Generated Encounter

```ts
export interface GeneratedEncounterEntry {
  slotId: string;
  monsterId: string;
  monsterName: string;
  role: MonsterRole;
  rank: MonsterRank;
  level: number;
  count: number;
  tags: string[];
  themes?: string[];
}

export interface ThreatSummary {
  pressure: number;
  damage: number;
  control: number;
}

export interface EncounterDiagnostics {
  hasPressure: boolean;
  hasDamage: boolean;
  hasControl: boolean;
  categoryCount: number;
  warnings: string[];
  score: number;
  isValid: boolean;
}

export interface TerrainSuggestion {
  id: string;
  name: string;
  tags: string[];
  description: string;
}

export interface GeneratedEncounter {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  entries: GeneratedEncounterEntry[];
  threatSummary: ThreatSummary;
  diagnostics: EncounterDiagnostics;
  terrainSuggestion?: TerrainSuggestion;
}
```

---

# Seed Data

The MVP should start with local JSON files:

- `src/data/monsters.json`
- `src/data/templates.json`
- `src/data/terrain.json`

These are **development seed datasets**, not the final full datasets.

They exist to:

- provide stable structure for the generator
- give Copilot realistic example data
- allow the app to run during early development

Start with a small monster set for development, then expand later.

Example monster:

```json
{
  "id": "hell-hound",
  "name": "Hell Hound",
  "level": 7,
  "role": "Brute",
  "rank": "Standard",
  "tags": ["Fire"],
  "themes": ["Hunter", "Pack"]
}
```

Templates and terrain should also be defined as JSON, not hardcoded inside components.

---

# Level Rules

The user supplies **Party Level**.

Default monster level range:

```text
minimum = partyLevel - 1
maximum = partyLevel + 2
```

Preferred difficulty target:

```text
targetLevel = partyLevel + 2
```

Candidates closer to the target level should receive a higher score.

The level filters should be configurable through generator settings, but the defaults should match the rules above.

---

# Duplicate Handling

Duplicate policies:

- `allow`
- `soft-avoid`
- `avoid`

Guidance:

- duplicates are valid when a slot intentionally has `count > 1`
- duplicates across separate slots should usually be penalized
- `soft-avoid` should penalize duplicates but still allow them
- `avoid` should try to avoid duplicates unless the pool is too small
- duplicate minions should not be penalized when the template explicitly calls for them

This should be handled in candidate scoring rather than hardcoded everywhere.

---

# Generator Architecture

The generator should use a **two-layer quality approach**:

## 1. Role-Balance Bias During Slot Resolution

While building a candidate encounter, the generator should prefer monsters that improve threat diversity.

Examples:

- if the current encounter lacks **Control**, controllers should gain score
- if the current encounter already has strong **Pressure**, additional brutes should lose score
- if the encounter already contains a duplicate monster, selecting it again should be penalized unless intentional

This improves candidate quality during construction.

## 2. Final Scoring Across Multiple Candidate Encounters

The generator should create multiple complete candidate encounters, score each one, and return the best result.

This improves final encounter quality without requiring rigid hardcoded logic.

These two strategies should work together.

---

# Generator Pipeline

The generator should follow this pipeline.

## Step 1 — generateEncounter

This is the public entry point.

Responsibilities:

- loop over a fixed number of candidate attempts
- choose a template for each attempt
- resolve slots for that template
- call `evaluateEncounter()` on each finished candidate
- return the best valid encounter

Conceptually:

```text
bestEncounter = null
bestScore = -Infinity

repeat N times:
  candidate = build a candidate encounter
  score = evaluateEncounter(candidate, ...)
  keep best result

return bestEncounter
```

## Step 2 — Slot Resolution

For each slot:

- determine valid monster pool
- apply role, rank, and level filtering
- score valid monsters using `scoreMonsterCandidate()`
- choose a monster using weighted-random logic

## Step 3 — Candidate Scoring

`scoreMonsterCandidate.ts` should score one monster candidate for one slot.

Suggested score factors:

- level proximity bonus
- theme tag match bonus
- fills missing threat category bonus
- supports underrepresented threat category bonus
- duplicate penalty
- brute-over-cap penalty
- overrepresented-category penalty

## Step 4 — Final Evaluation

`evaluateEncounter.ts` should:

- score the completed encounter
- determine whether it is weak
- reward threat diversity and tactical coherence
- penalize duplicates, role repetition, and brute-heavy compositions

## Step 5 — Diagnostics

The final generator result should include:

- threat summary
- warnings
- quality score
- validity flag

---

# Threat Categories

Threat categories should be centralized in `threatCategories.ts`.

Suggested mapping:

## Pressure
- Brute
- Soldier

## Damage
- Artillery
- Lurker
- Skirmisher

## Control
- Controller

## Neutral
- Minion

This same mapping should be used by both:

- slot-level biasing
- final encounter evaluation
- UI diagnostics

That keeps the system consistent.

---

# Encounter Quality Strategy

This is the part that should strongly influence Copilot.

## Slot-Level Biasing

When resolving slots, prefer monsters that improve the encounter as it forms.

Preferred behavior:

- favor candidates that add a missing threat category
- favor candidates that support an underrepresented category
- penalize candidates that over-stack an already dominant category
- penalize duplicates
- penalize excessive Brutes

This should guide the generator rather than rigidly forcing outcomes.

## Two-Pass Candidate Selection

Do not simply return the first valid encounter.

Instead:

- generate multiple candidate encounters
- evaluate each one
- return the highest-scoring encounter

This produces much better results while keeping the code simple.

---

# Suggested Candidate Scoring Heuristics

The exact numbers can be tuned later, but the plan should make the scoring model explicit.

## scoreMonsterCandidate heuristics

Possible starting values:

- `+20` fills missing threat category
- `+10` supports underrepresented category
- `+20` strong level proximity
- `+10` theme match
- `-15` duplicate monster
- `-20` exceeds brute limit
- `-10` adds to overrepresented category

These values do not need to be perfect. They need to be directionally useful.

## evaluateEncounter heuristics

Reward:

- includes Pressure
- includes Damage
- includes Control
- multiple roles represented
- strong level coherence
- theme consistency

Penalize:

- no damage threat
- fewer than two threat categories
- too many duplicates
- too many Brutes
- one-role or one-monster-type encounters

---

# Encounter Validation

## Hard rejection conditions

A candidate encounter should usually be rejected if it has:

- fewer than two threat categories
- no damage threat
- only one monster type across the whole encounter, unless explicitly intended by template
- unfilled slot resolution

## Soft penalties

Apply penalties rather than outright rejection for:

- more than one Brute
- no Controller in a hard standard encounter
- excessive duplicates
- low role diversity
- low theme coherence when a theme is selected

This should live inside `evaluateEncounter.ts`, not be scattered throughout the system.

---

# Constants File

Create:

```text
src/lib/constants.ts
```

Suggested contents:

```ts
export const DEFAULT_LEVEL_MIN_OFFSET = -1;
export const DEFAULT_LEVEL_MAX_OFFSET = 2;
export const DEFAULT_TARGET_OFFSET = 2;

export const MAX_GENERATION_ATTEMPTS = 12;
export const BRUTE_LIMIT = 1;

export const MISSING_THREAT_BONUS = 20;
export const UNDERREPRESENTED_THREAT_BONUS = 10;
export const THEME_MATCH_BONUS = 10;
export const DUPLICATE_PENALTY = 15;
export const EXCESS_BRUTE_PENALTY = 20;
export const OVERREPRESENTED_CATEGORY_PENALTY = 10;
```

Centralizing these values makes the generator easier to tune.

---

# UI Layout

The UI should be simple and tool-oriented.

## Left panel — Controls

- party level
- min level offset
- max level offset
- target difficulty offset
- theme tag
- template mode
- duplicate policy
- include terrain toggle
- generate button

## Center panel — Encounter

- encounter name
- template name
- monster list
- reroll encounter button

Future enhancements:

- reroll individual slot
- lock slot

## Right panel — Diagnostics

- threat summary
- warnings
- quality score
- terrain suggestion

The UI should consume generator output rather than embedding generator logic.

---

# PWA Requirements

Use `vite-plugin-pwa`.

Requirements:

- web manifest
- service worker
- installable behavior
- offline capability for static assets and local JSON

The app should be usable offline after initial load.

---

# MVP Implementation Plan

## Phase 1 — Foundation

1. create Vite React TypeScript project
2. add PWA plugin
3. define all domain types
4. add constants file
5. add seed JSON data
6. scaffold generator files

## Phase 2 — Generator Core

7. implement threat category helpers
8. implement template selection
9. implement slot resolution
10. implement candidate scoring
11. implement top-level `generateEncounter()`
12. implement final encounter evaluation

## Phase 3 — UI

13. build controls panel
14. build encounter display
15. build diagnostics panel
16. connect UI to generator
17. persist settings in localStorage

## Phase 4 — Quality & Flavor

18. add terrain suggestions
19. add encounter naming
20. add copy/export text
21. improve mobile responsiveness

## Phase 5 — Encounter Coherence Upgrades

22. expand theme-aware generation using existing `tags`
23. optionally add separate monster `themes` support beyond taxonomy tags
24. add theme-coherence scoring between selected monsters
25. improve terrain selection based on shared encounter tags/themes
26. improve encounter naming based on shared tags/themes
27. add more boss templates and encounter archetypes

## Phase 6 — Advanced Template & Theme Features

28. explore Dungeon Master's Guide-inspired **monster themes** as encounter identity overlays
29. treat monster themes as lightweight behavioral/flavor grouping before changing monster mechanics
30. reserve full **monster templates** as a later feature, only if needed
31. if added later, use monster templates as optional encounter modifiers rather than core MVP logic

## Phase 7 — Enhancements

32. reroll individual slot
33. lock slot
34. editable templates
35. CSV or JSON monster import
36. save favorite encounters

---

# Theme System Notes

Themes should be introduced carefully to avoid overcomplicating the MVP.

## Theme System v1

Use existing `tags` as the first lightweight theme system.

This allows:

- theme-aware monster selection
- theme-aware terrain suggestions
- theme-aware encounter naming

without expanding the data model too early.

## Theme System v2

Later, optionally add a separate `themes` field to monsters for encounter identity.

This allows a distinction between:

### Creature Tags
What the monster **is**:
- Fire
- Undead
- Elemental
- Fey

### Encounter Themes
What the monster **does** or how it **feels** in encounter design:
- Ambusher
- Pack
- Sentinel
- Cultist
- Berserker
- Gravebound

This distinction should remain optional until the base generator is stable.

## Monster Templates

Dungeon Master's Guide-style monster templates are a later-stage feature.

Do **not** treat them as part of the MVP.

If introduced later, start with lightweight encounter-level modifiers such as:

- Shadow-Touched
- Fiery
- Gravebound
- Frenzied
- Ritual-Bound

Use them first for:

- encounter naming
- encounter flavor
- terrain matching

Only later consider using them to transform monster metadata or difficulty assumptions.

---

# Suggested Copilot Prompt Headers

Adding short intent comments at the top of generator files will improve Copilot output.

## generateEncounter.ts

```ts
/*
Top-level encounter generator.

This module uses a two-pass quality model:
1. build multiple candidate encounters
2. evaluate each candidate
3. return the best result
*/
```

## scoreMonsterCandidate.ts

```ts
/*
Scores a monster candidate for a specific encounter slot.

This is a local scoring step during slot resolution.

The score should combine:
- level proximity
- theme match
- missing threat category bonus
- underrepresented category support
- duplicate penalty
- brute-over-cap penalty
- overrepresented category penalty
*/
```

## evaluateEncounter.ts

```ts
/*
Evaluates a completed encounter.

This module scores full encounter quality and penalizes:
- missing threat categories
- low variety
- brute-heavy compositions
- excessive duplicates
*/
```

## threatCategories.ts

```ts
/*
Threat category utilities.

This module maps monster roles to encounter threat categories.

The same categorization should be used by:
- candidate scoring
- final encounter evaluation
- UI diagnostics
*/
```

---

# Final Principle

This tool should behave like a **curated procedural generator**.

That means:

- randomness is important
- tactical quality matters more
- the generator should guide itself toward stronger encounters
- the final result should feel intentionally assembled, not arbitrary

That should be reflected in both the implementation plan and the code structure.
