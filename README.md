# D&D 4e Encounter Generator

A locally hosted Typescript App that generates tactically interesting D&D 4th Edition encounters for optimized parties. Instead of XP budgets, it uses encounter templates, monster role composition, weighted random selection, and multi-candidate scoring.

## Features

- **Template-driven generation.** 20 encounter templates (12 standard, 8 boss) covering tactical archetypes from ambushes to dragon encounters
- **Two-pass quality scoring.** Slot-level role-balance biasing during construction + final encounter evaluation across multiple candidates
- **978 monsters.** From official 4e sources (Monster Manual, DMG, Draconomicon, etc.) with role, rank, level, alignment, and tag data
- **178 terrain suggestions.** With tactical terrain powers sourced from DMG, DMG2, Manual of the Planes, Underdark, and more
- **Monster stat card popup.** Click any monster name to view its full compendium stat block (975 matched). Pin multiple cards side-by-side in a collapsible section
- **12 environment biomes.** Select an environment (Forest, Underground, Shadowfell, etc.) to bias monster and terrain selection toward thematically appropriate creatures
- **Alignment-aware scoring.** Encounters prefer monsters that share alignment with each other (coherence) and match the chosen environment's preferred alignments
- **Theme-aware filtering.** Select a creature tag (Undead, Fire, Fey, etc.) to generate thematically coherent encounters
- **Configurable monster count.** Adjust the number of unique monsters (2-7) with automatic difficulty scaling
- **Encounter diagnostics.** Threat summary, role diversity, quality score, and validation warnings
- **Copy to clipboard.** Formatted text output for easy sharing
- **PWA.** Installable, works offline after initial load
- **Settings persistence.** All preferences saved to localStorage

## Tech Stack

- React 19 + TypeScript 5.9
- Vite 6.4 + vite-plugin-pwa
- Vitest (34 tests)

## Getting Started

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output goes to `dist/`, deployable as a static site (e.g. Vercel, Netlify, GitHub Pages).

## Project Structure

```
src/
  types.ts                  # All domain types
  lib/
    constants.ts            # Tuning values and defaults
    generateEncounter.ts    # Generator pipeline (entry point)
    scoreMonsterCandidate.ts # Slot-level candidate scoring
    evaluateEncounter.ts    # Final encounter scoring & validation
    threatCategories.ts     # Role → threat category mapping
    monsterStatBlocks.ts    # Stat block lookup service
    environmentLookup.ts    # Environment → tags/alignments resolver
  data/
    monsters.json           # 978 monster entries with alignment
    templates.json          # 20 encounter templates
    terrain.json            # 178 terrain suggestions with powers
    statblocks.json         # 975 HTML stat blocks from 4e compendium
    environments.json       # 12 environment biomes with tags & alignments
  components/
    controls/ControlsPanel.tsx
    encounter/EncounterDisplay.tsx
    encounter/DiagnosticsPanel.tsx
    encounter/MonsterCardModal.tsx   # Stat block popup modal
    encounter/PinnedCardsSection.tsx # Collapsible pinned stat blocks
  hooks/
    useGeneratorSettings.ts # Settings state + localStorage persistence
    useMonsterCard.ts       # Modal state for stat block viewing
    usePinnedCards.ts       # Pinned cards state management
  pages/
    HomePage.tsx            # Main app page
  App.tsx
  main.tsx
```

## Generator Design

The generator uses a **two-layer quality approach**:

1. **Slot-level biasing.** While building a candidate encounter, prefer monsters that improve threat diversity (fill missing categories, avoid over-stacking, penalize duplicates)
2. **Multi-candidate evaluation.** Generate multiple complete encounters, score each one, return the best

Encounter templates define slot composition (roles, ranks, counts). The generator resolves each slot against the monster pool using weighted random selection informed by the scoring heuristics.

### Scoring Factors

| Factor | Bonus | Description |
|--------|-------|-------------|
| Level proximity | 0-20 | Closer to target level scores higher |
| Theme match | 10 | Monster has the selected theme tag |
| Environment tags | 6/tag | Monster tags overlap with environment |
| Alignment coherence | 8 | Matches majority alignment of encounter |
| Environment alignment | 6 | Alignment in environment's preferred list |
| Tag coherence | 8 | Shares tags with already-selected monsters |
| Theme coherence | 12 | Shares themes with already-selected monsters |
| Threat diversity | 10-20 | Fills missing or underrepresented threat categories |

### Threat Categories

| Category | Roles |
|----------|-------|
| Pressure | Brute, Soldier |
| Damage | Artillery, Lurker, Skirmisher |
| Control | Controller |
| Neutral | Minion |

Valid encounters must represent at least 2 threat categories.

## Data Pipeline

Monster data is generated via two build scripts:

- **`convert-monsters.mjs`** — Converts `full-monster-list.txt` (TSV) into `monsters.json` with derived tags and alignment extracted from stat blocks
- **`convert-statblocks.mjs`** — Downloads HTML stat blocks from the [4e compendium mirror](https://github.com/mbutler/iws.mx-dnd), matches to monsters via 5-pass fuzzy name matching (99.8% match rate)

## License

[MIT](LICENSE)
