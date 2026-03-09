# D&D 4e Encounter Generator

A Progressive Web App that generates tactically interesting D&D 4th Edition encounters for optimized parties. Instead of XP budgets, it uses encounter templates, monster role composition, weighted random selection, and multi-candidate scoring.

## Features

- **Template-driven generation.** 20 encounter templates (12 standard, 8 boss) covering tactical archetypes from ambushes to dragon encounters
- **Two-pass quality scoring.** Slot-level role-balance biasing during construction + final encounter evaluation across multiple candidates
- **978 monsters.** From official 4e sources (Monster Manual, DMG, Draconomicon, etc.) with role, rank, level, and tag data
- **178 terrain suggestions.** With tactical terrain powers sourced from DMG, DMG2, Manual of the Planes, Underdark, and more
- **Theme-aware filtering.** Select a creature tag (Undead, Fire, Fey, etc.) to generate thematically coherent encounters
- **Configurable monster count.** Adjust the number of unique monsters (2-7) with automatic difficulty scaling
- **Encounter diagnostics.** Threat summary, role diversity, quality score, and validation warnings
- **Copy to clipboard.** Formatted text output for easy sharing
- **PWA.** Installable, works offline after initial load
- **Settings persistence.** All preferences saved to localStorage

## Tech Stack

- React 19 + TypeScript 5.9
- Vite 6.4 + vite-plugin-pwa
- Vitest (test runner)

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
  data/
    monsters.json           # 978 monster entries
    templates.json          # 20 encounter templates
    terrain.json            # 178 terrain suggestions with powers
  components/
    controls/ControlsPanel.tsx
    encounter/EncounterDisplay.tsx
    encounter/DiagnosticsPanel.tsx
  hooks/
    useGeneratorSettings.ts # Settings state + localStorage persistence
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

### Threat Categories

| Category | Roles |
|----------|-------|
| Pressure | Brute, Soldier |
| Damage | Artillery, Lurker, Skirmisher |
| Control | Controller |
| Neutral | Minion |

Valid encounters must represent at least 2 threat categories.

## License

[MIT](LICENSE)