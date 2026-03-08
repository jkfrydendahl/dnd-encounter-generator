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
    generator/
      constants.ts
      generateEncounter.ts
      generateCandidateEncounter.ts
      chooseTemplate.ts
      resolveSlot.ts
      scoreMonsterCandidate.ts
      evaluateEncounter.ts
      diagnostics.ts
      weightedRandom.ts
      threatCategories.ts

    filters/
      filterByLevel.ts
      filterByRole.ts
      filterByTheme.ts

    utils/
      random.ts
      arrays.ts

  types/
    monster.ts
    encounter.ts
    template.ts
    terrain.ts
    settings.ts

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
- `generateCandidateEncounter.ts` should build one candidate encounter.
- `scoreMonsterCandidate.ts` should handle **slot-level role-balance biasing**.
- `evaluateEncounter.ts` should handle **final encounter scoring**.
- `diagnostics.ts` should produce warnings and threat summaries for the UI.
- `threatCategories.ts` should keep role-to-threat mapping centralized.

This is worth being explicit about, because Copilot will otherwise tend to collapse too much logic into one file.

---

# Initial File Scaffolding

Create these files before asking Copilot to implement logic:

```text
src/types/monster.ts
src/types/template.ts
src/types/encounter.ts
src/types/terrain.ts
src/types/settings.ts

src/lib/generator/constants.ts
src/lib/generator/generateEncounter.ts
src/lib/generator/generateCandidateEncounter.ts
src/lib/generator/chooseTemplate.ts
src/lib/generator/resolveSlot.ts
src/lib/generator/scoreMonsterCandidate.ts
src/lib/generator/evaluateEncounter.ts
src/lib/generator/diagnostics.ts
src/lib/generator/weightedRandom.ts
src/lib/generator/threatCategories.ts

src/lib/utils/random.ts
src/lib/utils/arrays.ts
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
  | "Skirmisher|Controller";

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
}

export interface GeneratedEncounter {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  entries: GeneratedEncounterEntry[];
  threatSummary: ThreatSummary;
  diagnostics: EncounterDiagnostics;
  terrainSuggestion?: string;
}
```

---

# Seed Data

The MVP should start with local JSON files:

- `src/data/monsters.json`
- `src/data/templates.json`
- `src/data/terrain.json`

Start with a small monster set for development, then expand later.

Example monster:

```json
{
  "id": "hell-hound",
  "name": "Hell Hound",
  "level": 7,
  "role": "Brute",
  "rank": "Standard",
  "tags": ["Fire"]
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
- call `generateCandidateEncounter()` for each attempt
- call `evaluateEncounter()` on each finished candidate
- return the best valid encounter

Conceptually:

```text
bestEncounter = null
bestScore = -Infinity

repeat N times:
  candidate = generateCandidateEncounter(...)
  score = evaluateEncounter(candidate, ...)
  keep best result

return bestEncounter
```

## Step 2 — generateCandidateEncounter

This function builds one encounter.

Responsibilities:

- choose template
- resolve slots in order
- build encounter entries
- attach terrain suggestion if enabled
- generate initial diagnostics

## Step 3 — chooseTemplate

Responsibilities:

- filter templates by selected mode
- choose using weighted random selection

## Step 4 — resolveSlot

Responsibilities:

- determine valid monster pool for current slot
- apply role, rank, and level filtering
- score valid monsters using `scoreMonsterCandidate()`
- choose a monster using weighted random logic

## Step 5 — scoreMonsterCandidate

Responsibilities:

- score one monster candidate for one slot
- combine randomness with heuristics
- apply role-balance bias

Suggested score factors:

- level proximity bonus
- theme match bonus
- fills missing threat category bonus
- supports underrepresented threat category bonus
- duplicate penalty
- brute-over-cap penalty
- overrepresented-category penalty

## Step 6 — evaluateEncounter

Responsibilities:

- score the completed encounter
- determine whether it is weak
- reward threat diversity and tactical coherence
- penalize duplicates, role repetition, and brute-heavy compositions

## Step 7 — diagnostics

Responsibilities:

- calculate threat summary
- produce warnings for the UI
- expose human-readable reasoning for why the encounter is strong or weak

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
src/lib/generator/constants.ts
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
11. implement candidate generation
12. implement final encounter evaluation
13. implement top-level `generateEncounter()`

## Phase 3 — UI

14. build controls panel
15. build encounter display
16. build diagnostics panel
17. connect UI to generator
18. persist settings in localStorage

## Phase 4 — Quality

19. add terrain suggestions
20. add encounter naming
21. add copy/export text
22. improve mobile responsiveness

## Phase 5 — Enhancements

23. reroll individual slot
24. lock slot
25. editable templates
26. CSV or JSON monster import
27. save favorite encounters

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

## generateCandidateEncounter.ts

```ts
/*
Builds one candidate encounter.

This module:
- chooses a template
- resolves slots in order
- applies local role-balance bias through candidate scoring
- returns a complete candidate encounter
*/
```

## scoreMonsterCandidate.ts

```ts
/*
Scores a monster candidate for a specific slot.

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

---

# Final Principle

This tool should behave like a **curated procedural generator**.

That means:

- randomness is important
- tactical quality matters more
- the generator should guide itself toward stronger encounters
- the final result should feel intentionally assembled, not arbitrary

That should be reflected in both the implementation plan and the code structure.
