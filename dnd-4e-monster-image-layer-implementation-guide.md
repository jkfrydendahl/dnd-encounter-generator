# D&D 4e Encounter Generator — Monster Image Layer Implementation Guide

## Purpose

This guide describes how to add a scalable monster image layer to the D&D 4e encounter generator.

The goal is **not** to build a brittle “complete gallery” first.

The goal is to build a system that can:

- resolve images for 900–1000 monsters from normalized names
- cache results locally
- allow manual overrides for bad or missing matches
- support future fallback behavior and richer encounter presentation
- be understandable enough for GitHub Copilot to extend safely

This guide assumes the generator already has:

- a cleaned monster dataset
- stable monster IDs
- TypeScript project structure
- helper modules in `src/lib`
- seed/example data in `data`

---

## Core Design Principle

Treat monster art as a **resolution pipeline**, not as a static gallery.

Each monster should resolve like this:

1. Try manual override
2. Try local cache
3. Try alias-based lookup
4. Try normalized-name lookup from image index
5. Try grouped fallback image
6. Return placeholder if nothing is found

This keeps the system resilient even when names are inconsistent or images are incomplete.

---

## High-Level Architecture

Add a dedicated image layer with the following pieces:

### Data Layer
- `monsterImageIndex.json` — structured mapping of monsters to image assets
- `monsterImageOverrides.json` — manual corrections for edge cases
- `monsterFallbacks.json` — generic fallback images by creature family/type/tag

### Logic Layer
- `normalizeMonsterName.ts`
- `resolveMonsterImage.ts`
- `buildMonsterImageIndex.ts`
- `validateMonsterImageCoverage.ts`

### Asset Layer
- `assets/monsters/...`
- `assets/fallbacks/...`
- `assets/placeholders/...`

### Optional Tooling Layer
- import/build scripts
- image review reports
- coverage reports
- deduplication checks

---

## Recommended Folder Structure

```text
project-root/
├─ assets/
│  ├─ monsters/
│  │  ├─ aboleth/
│  │  │  ├─ primary.jpg
│  │  │  └─ alt-1.jpg
│  │  ├─ bone-mongrel-dracolich/
│  │  │  └─ primary.jpg
│  │  └─ ...
│  ├─ fallbacks/
│  │  ├─ dragon.jpg
│  │  ├─ undead.jpg
│  │  ├─ humanoid.jpg
│  │  ├─ beast.jpg
│  │  └─ elemental.jpg
│  └─ placeholders/
│     └─ unknown-monster.jpg
│
├─ data/
│  ├─ monsters.json
│  ├─ monsterImageIndex.json
│  ├─ monsterImageOverrides.json
│  └─ monsterFallbacks.json
│
├─ scripts/
│  ├─ buildMonsterImageIndex.ts
│  └─ validateMonsterImageCoverage.ts
│
└─ src/
   ├─ lib/
   │  ├─ normalizeMonsterName.ts
   │  ├─ resolveMonsterImage.ts
   │  ├─ resolveMonsterFallback.ts
   │  └─ imageTypes.ts
   └─ types.ts
```

---

## Step 1 — Extend the Monster Data Model

The monster record should support image-related fields, but image paths should not be hardcoded directly into every monster entry unless you truly need that.

Prefer keeping monster image metadata in a dedicated index.

### Recommended monster shape

```ts
export interface Monster {
  id: string;
  name: string;
  level: number;
  role: string;
  source: string;
  page?: number;
  normalizedName?: string;
  aliases?: string[];
  categoryTags?: string[];
}
```

### Why this matters

- `normalizedName` allows deterministic lookup
- `aliases` handle OCR problems, alternate naming, punctuation variants, and source quirks
- `categoryTags` support fallback logic later

Examples of useful tags:

- `dragon`
- `undead`
- `beast`
- `humanoid`
- `aberrant`
- `fire`
- `shadow`
- `construct`

Do not try to over-tag everything at first. A practical first pass is enough.

---

## Step 2 — Create Shared Image Types

Create `src/lib/imageTypes.ts`:

```ts
export interface MonsterImageEntry {
  monsterId: string;
  name: string;
  normalizedName: string;
  aliases?: string[];
  primary: string;
  variants?: string[];
  attribution?: string;
  sourceType?: "local" | "manual" | "generated-index";
  tags?: string[];
}

export interface MonsterImageResolution {
  found: boolean;
  path: string;
  matchedBy:
    | "manual-override"
    | "monster-id"
    | "normalized-name"
    | "alias"
    | "fallback"
    | "placeholder";
  matchedValue?: string;
}

export interface MonsterImageOverride {
  byMonsterId?: Record<string, string>;
  byNormalizedName?: Record<string, string>;
}

export interface MonsterFallbackMap {
  byTag?: Record<string, string>;
  byRole?: Record<string, string>;
  default: string;
}
```

This creates a clean contract for Copilot and avoids ad hoc object shapes later.

---

## Step 3 — Normalize Monster Names Properly

Create `src/lib/normalizeMonsterName.ts`.

This function is foundational. Keep it deterministic and boring.

### Requirements

It should:

- lowercase names
- trim whitespace
- normalize repeated spaces
- replace punctuation with spaces or hyphens consistently
- convert common OCR mistakes when safe
- remove edition/source noise if that ever appears in imported names

### Example implementation

```ts
export function normalizeMonsterName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s/g, "-");
}
```

### Important note

Do **not** aggressively “repair” OCR in this function unless the transformation is universal and safe.

Bad idea:
- blindly converting every `1` to `l`

Better idea:
- store OCR variants in `aliases`
- optionally add a separate cleanup/import script for known suspect rows

That keeps normalization stable and avoids accidental collisions.

---

## Step 4 — Add Alias Support

Because your dataset already showed suspect names and OCR corruption, aliases are important.

Example:

```json
{
  "id": "mm1-bone-mongrel-dracolich",
  "name": "Bone Mongrel Dracolich",
  "normalizedName": "bone-mongrel-dracolich",
  "aliases": [
    "bone mongre1 dracolich",
    "bone-mongrel-dracolich"
  ]
}
```

Alias rules should be used only for lookup, not as the canonical display name.

---

## Step 5 — Create the Image Index File

Create `data/monsterImageIndex.json`.

This should be the main mapping between monsters and actual image asset paths.

### Example entry

```json
[
  {
    "monsterId": "mm1-aboleth-slime-mage",
    "name": "Aboleth Slime Mage",
    "normalizedName": "aboleth-slime-mage",
    "aliases": ["aboleth slime mage"],
    "primary": "/assets/monsters/aboleth-slime-mage/primary.jpg",
    "variants": [
      "/assets/monsters/aboleth-slime-mage/alt-1.jpg"
    ],
    "sourceType": "generated-index",
    "tags": ["aberrant", "controller"]
  }
]
```

### Rules

- Always use project-relative asset paths
- `primary` should always exist if the entry exists
- `variants` are optional
- `monsterId` is preferred over name-based resolution whenever available

This makes later refactors safer.

---

## Step 6 — Create Manual Overrides

Create `data/monsterImageOverrides.json`.

This file is how you fix inevitable bad matches without corrupting the base index.

### Example

```json
{
  "byMonsterId": {
    "mm1-portal-drake": "/assets/monsters/portal-drake/primary.jpg"
  },
  "byNormalizedName": {
    "bone-mongre1-dracolich": "/assets/monsters/bone-mongrel-dracolich/primary.jpg"
  }
}
```

### Why this file matters

Without overrides, every edge case becomes a code change.

With overrides, review and maintenance stay simple.

---

## Step 7 — Create Fallback Mappings

Create `data/monsterFallbacks.json`.

This lets the generator display something reasonable even when no exact image exists.

### Example

```json
{
  "byTag": {
    "dragon": "/assets/fallbacks/dragon.jpg",
    "undead": "/assets/fallbacks/undead.jpg",
    "humanoid": "/assets/fallbacks/humanoid.jpg",
    "beast": "/assets/fallbacks/beast.jpg",
    "elemental": "/assets/fallbacks/elemental.jpg"
  },
  "byRole": {
    "Brute": "/assets/fallbacks/brute.jpg",
    "Soldier": "/assets/fallbacks/soldier.jpg"
  },
  "default": "/assets/placeholders/unknown-monster.jpg"
}
```

### Resolution priority recommendation

1. tag fallback
2. role fallback
3. default placeholder

Tag fallback is usually more useful than role fallback.

---

## Step 8 — Implement the Resolver

Create `src/lib/resolveMonsterImage.ts`.

This should be a pure lookup function. Keep it simple and testable.

### Behavior

Input:
- monster record
- image index
- overrides
- fallback map

Output:
- `MonsterImageResolution`

### Recommended lookup order

1. `overrides.byMonsterId[monster.id]`
2. exact `monsterId` match in image index
3. `overrides.byNormalizedName[monster.normalizedName]`
4. exact `normalizedName` match in image index
5. alias match
6. fallback by tag
7. fallback by role
8. default placeholder

### Example implementation sketch

```ts
import type {
  MonsterFallbackMap,
  MonsterImageEntry,
  MonsterImageOverride,
  MonsterImageResolution
} from "./imageTypes";

import { resolveMonsterFallback } from "./resolveMonsterFallback";

export function resolveMonsterImage(
  monster: {
    id: string;
    name: string;
    normalizedName?: string;
    aliases?: string[];
    role?: string;
    categoryTags?: string[];
  },
  imageIndex: MonsterImageEntry[],
  overrides: MonsterImageOverride,
  fallbacks: MonsterFallbackMap
): MonsterImageResolution {
  const normalizedName = monster.normalizedName ?? monster.name;

  const overrideById = overrides.byMonsterId?.[monster.id];
  if (overrideById) {
    return {
      found: true,
      path: overrideById,
      matchedBy: "manual-override",
      matchedValue: monster.id
    };
  }

  const directById = imageIndex.find((entry) => entry.monsterId === monster.id);
  if (directById) {
    return {
      found: true,
      path: directById.primary,
      matchedBy: "monster-id",
      matchedValue: monster.id
    };
  }

  const overrideByName = overrides.byNormalizedName?.[normalizedName];
  if (overrideByName) {
    return {
      found: true,
      path: overrideByName,
      matchedBy: "manual-override",
      matchedValue: normalizedName
    };
  }

  const directByName = imageIndex.find(
    (entry) => entry.normalizedName === normalizedName
  );
  if (directByName) {
    return {
      found: true,
      path: directByName.primary,
      matchedBy: "normalized-name",
      matchedValue: normalizedName
    };
  }

  const aliasHit = imageIndex.find((entry) =>
    entry.aliases?.includes(normalizedName)
  );
  if (aliasHit) {
    return {
      found: true,
      path: aliasHit.primary,
      matchedBy: "alias",
      matchedValue: normalizedName
    };
  }

  return resolveMonsterFallback(monster, fallbacks);
}
```

---

## Step 9 — Implement Fallback Resolution

Create `src/lib/resolveMonsterFallback.ts`.

```ts
import type {
  MonsterFallbackMap,
  MonsterImageResolution
} from "./imageTypes";

export function resolveMonsterFallback(
  monster: {
    role?: string;
    categoryTags?: string[];
  },
  fallbacks: MonsterFallbackMap
): MonsterImageResolution {
  for (const tag of monster.categoryTags ?? []) {
    const tagMatch = fallbacks.byTag?.[tag];
    if (tagMatch) {
      return {
        found: false,
        path: tagMatch,
        matchedBy: "fallback",
        matchedValue: tag
      };
    }
  }

  if (monster.role) {
    const roleMatch = fallbacks.byRole?.[monster.role];
    if (roleMatch) {
      return {
        found: false,
        path: roleMatch,
        matchedBy: "fallback",
        matchedValue: monster.role
      };
    }
  }

  return {
    found: false,
    path: fallbacks.default,
    matchedBy: "placeholder"
  };
}
```

### Why return `found: false` for fallbacks?

Because a fallback is not a true image match. This distinction is useful for:

- reporting
- UI badges
- future review workflows

---

## Step 10 — Build an Index Generation Script

Create `scripts/buildMonsterImageIndex.ts`.

This script should scan `assets/monsters/` and build `monsterImageIndex.json`.

### Why generate the index?

Because hand-maintaining 900–1000 image mappings is miserable and error-prone.

### Suggested assumptions

Each monster folder name equals `normalizedName`:

```text
assets/monsters/aboleth-slime-mage/
assets/monsters/bone-mongrel-dracolich/
assets/monsters/portal-drake/
```

Then the script can:

- scan all monster folders
- look for `primary.*`
- detect `alt-*.*`
- cross-reference `data/monsters.json`
- emit structured entries

### Script behavior

For each monster:
- derive normalized name
- check whether matching folder exists
- create index entry when primary exists
- include variants when found
- optionally warn when folder exists but no matching monster record does

### Recommended output rules

- write pretty JSON
- sort entries by `monsterId` or `normalizedName`
- fail loudly on duplicate normalized names
- warn on duplicate aliases

---

## Step 11 — Add a Coverage Validation Script

Create `scripts/validateMonsterImageCoverage.ts`.

This script should answer questions like:

- how many monsters have exact images?
- how many rely on fallback?
- how many rely on placeholder?
- which monsters failed exact match?
- which assets are orphaned?

### Suggested output

```text
Total monsters: 986
Exact image matches: 812
Manual overrides: 41
Fallback matches: 102
Placeholders: 31
Coverage: 82.35%
```

And optionally emit CSV or JSON reports such as:

- `reports/missingMonsterImages.json`
- `reports/orphanedMonsterImageFolders.json`

This will save you huge amounts of review time.

---

## Step 12 — Add Tests for the Resolver

Add tests for:

- exact `monsterId` match
- normalized name match
- alias match
- override by ID
- override by normalized name
- fallback by tag
- fallback by role
- placeholder

### Why tests matter here

This module will quietly influence a lot of generator behavior. If it breaks, the tool may still “work” while showing the wrong monster art.

That is exactly the kind of regression that slips past quickly without tests.

---

## Step 13 — Keep the UI Contract Simple

If the generator returns encounter monsters, attach image resolution at a presentation layer.

Do **not** mutate the source monster records unnecessarily.

Example:

```ts
export interface ResolvedEncounterMonster {
  monster: Monster;
  image: MonsterImageResolution;
}
```

Then in rendering:

```ts
const resolved = encounter.monsters.map((monster) => ({
  monster,
  image: resolveMonsterImage(monster, imageIndex, overrides, fallbacks)
}));
```

This keeps the image system modular and optional.

---

## Step 14 — Recommended Incremental Rollout

Do not attempt all 1000 monsters manually on day one.

### Phase 1 — Infrastructure
- add types
- add normalization
- add resolver
- add fallback support
- add placeholder support
- create initial asset folders

### Phase 2 — First Useful Pass
- add a subset of curated images
- generate the image index
- validate coverage
- wire resolution into the generator UI or output layer

### Phase 3 — Quality Pass
- add manual overrides
- fix OCR alias cases
- improve tags for better fallback matching

### Phase 4 — Optional Richness
- add variants for elites and solos
- allow random choice between variants
- add source attribution metadata if needed
- add encounter preview tiles or printable galleries

This order matters. Infrastructure first. Completeness later.

---

## Step 15 — Copilot Guidance Comments

Add concise comments at the top of the key files so Copilot stays aligned.

### Example for `resolveMonsterImage.ts`

```ts
/**
 * Resolves the most appropriate image for a monster.
 *
 * Resolution order:
 * 1. Manual override by monster ID
 * 2. Exact image entry by monster ID
 * 3. Manual override by normalized name
 * 4. Exact image entry by normalized name
 * 5. Alias match
 * 6. Fallback by category tag
 * 7. Fallback by role
 * 8. Default placeholder
 *
 * Notes:
 * - Fallbacks are not exact matches and should return found=false
 * - Keep this function pure and deterministic
 * - Do not embed filesystem reads in this resolver
 */
```

### Example for `buildMonsterImageIndex.ts`

```ts
/**
 * Builds monsterImageIndex.json from local asset folders.
 *
 * Assumptions:
 * - Each monster folder is named using normalized monster name
 * - Each folder contains a primary image named primary.*
 * - Optional alternate images are named alt-1.*, alt-2.*, etc.
 *
 * Goals:
 * - Reduce manual maintenance of image index mappings
 * - Produce stable, pretty-printed JSON
 * - Warn on duplicate names, missing primaries, or unmatched folders
 */
```

### Example for `monsterImageIndex.json`

Add a note in repo documentation, not inside JSON:

- this file is generated and may be hand-reviewed
- prefer fixing asset folders or override files over ad hoc edits

---

## Step 16 — Practical Asset Naming Rules

To avoid chaos, define naming rules early.

### Folder naming
Use normalized monster names:

- `lich-necromancer`
- `young-black-dragon`
- `bone-mongrel-dracolich`

### File naming
Use predictable names:

- `primary.jpg`
- `alt-1.jpg`
- `alt-2.jpg`

### Do not do this
Avoid:

- spaces
- mixed case
- source abbreviations unless required
- filenames like `final2-really-final.png`

Boring naming is your friend here.

---

## Step 17 — Handling Shared Art Across Similar Monsters

Some monsters may reasonably share art.

That is fine.

You do not need unique art for every single stat block if the visual identity is effectively the same.

Example:
- multiple kobold variants
- several zombie or skeleton roles
- different role versions of similar drakes

You can map multiple monsters to the same `primary` path if needed.

That is much better than forcing fake uniqueness.

---

## Step 18 — Future Enhancements Worth Considering

Only after the base system works.

### Variant rotation
For solos and elites, randomly choose between `primary` and `variants`.

### Encounter-level presentation
Generate an encounter gallery card with:
- monster name
- level
- role
- image

### Smarter fallback selection
Prefer fallback by:
- category tag
- threat category
- environment tag

### Review tooling
Create a review page or markdown report for:
- monsters using placeholder
- monsters using fallback only
- duplicate art usage across unrelated creatures

### Import assist tooling
If you later obtain a bulk image pack, write an import script that:
- scans filenames
- normalizes them
- suggests mappings to monster records

---

## Step 19 — What Not to Do

A few traps to avoid:

### Do not hardcode image paths into every monster by hand
That becomes maintenance pain immediately.

### Do not overcomplicate normalization
Canonical names plus aliases are enough for the first version.

### Do not make the resolver read from disk
That makes testing and UI integration worse.

### Do not wait for “complete” art coverage before shipping
A mixed system with exact matches plus fallbacks is already useful.

### Do not assume one image per monster forever
Design for variants even if you only use `primary` at first.

---

## Step 20 — Suggested Initial Task List for Copilot

Use this as a step-by-step development sequence.

1. Add `normalizedName`, `aliases`, and `categoryTags` support to monster types
2. Create `src/lib/imageTypes.ts`
3. Implement `normalizeMonsterName.ts`
4. Implement `resolveMonsterFallback.ts`
5. Implement `resolveMonsterImage.ts`
6. Add `monsterImageOverrides.json`
7. Add `monsterFallbacks.json`
8. Create `scripts/buildMonsterImageIndex.ts`
9. Create `scripts/validateMonsterImageCoverage.ts`
10. Add tests for resolver behavior
11. Wire resolved image output into encounter presentation
12. Add manual overrides for known bad OCR/suspect entries
13. Add initial asset folders and generate the first index
14. Review coverage report and fix the highest-value missing monsters first

---

## Suggested Prompt for GitHub Copilot

Use this inside the relevant files or as a chat prompt for Copilot:

```text
Implement a monster image resolution layer for this TypeScript D&D 4e encounter generator.

Requirements:
- Support monster image lookup by monster ID, normalized name, and aliases
- Use local JSON files for image index, manual overrides, and fallbacks
- Keep resolver functions pure and deterministic
- Return structured resolution results that distinguish exact matches from fallback/placeholder results
- Add a normalization helper for monster names
- Add a script to build monsterImageIndex.json by scanning assets/monsters folders
- Add a validation script that reports exact matches, fallbacks, placeholders, and orphaned asset folders
- Prefer readable, maintainable code over over-engineered abstractions
- Add type definitions and small helper functions where appropriate
- Do not perform network requests
- Do not hardcode image paths into the base monster dataset unless necessary
```

---

## Final Recommendation

For your generator, the most efficient implementation is:

- **normalized names**
- **generated local image index**
- **manual override layer**
- **fallback images**
- **coverage reporting**

That gives you something usable long before you reach full image coverage, and it avoids turning the system into a fragile mess.

A complete gallery can grow out of this later.

Trying to start with the gallery itself is the slower and worse path.
