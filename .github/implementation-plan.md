
# Implementation Plan – D&D 4e Encounter Generator

This document describes the implementation plan for the **D&D 4e Encounter Generator** PWA.

The repository currently contains:

.github/
  implementation-plan.md
  generator-rules.md
  
`generator-rules.md` defines the **encounter design heuristics** used by the generator.
This document describes **how the system should be implemented.**

---

# Project Goal

Create a **Progressive Web App (PWA)** that generates tactically interesting
D&D 4e encounters for optimized parties.

The generator intentionally **does not use XP budgets**.

Instead it relies on:

• encounter templates  
• monster role composition  
• weighted random selection  
• encounter diagnostics  
• rejection of weak encounters  

---

# Tech Stack

The application should use:

• React  
• TypeScript  
• Vite  
• vite-plugin-pwa  

State handling:

• React state  
• settings stored in localStorage  

The app should run **entirely client-side** and deploy as a **static Vercel app**.

---

# Development Order (Important)

Copilot performs much better if development happens in this order:

1. Define data types
2. Implement generator logic
3. Implement diagnostics
4. Build UI
5. Add PWA support

Do **not** start by building UI components.

---

# Recommended Project Structure

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
      generateEncounter.ts
      chooseTemplate.ts
      resolveSlot.ts
      scoreMonsterCandidate.ts
      diagnostics.ts
      weightedRandom.ts
      constants.ts

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

  hooks/
    useGeneratorSettings.ts

  pages/
    HomePage.tsx

  App.tsx
  main.tsx

Generator logic must remain inside **src/lib** and not inside UI components.

---

# Initial File Scaffolding

Create these files first before asking Copilot to implement logic:

src/types/monster.ts  
src/types/template.ts  
src/types/encounter.ts  
src/types/terrain.ts  

src/lib/generator/generateEncounter.ts  
src/lib/generator/chooseTemplate.ts  
src/lib/generator/resolveSlot.ts  
src/lib/generator/scoreMonsterCandidate.ts  
src/lib/generator/diagnostics.ts  

src/lib/utils/random.ts  
src/lib/utils/arrays.ts  

Even empty files improve Copilot suggestions.

---

# Domain Types

Monster structure:

type MonsterRole =
  | "Brute"
  | "Soldier"
  | "Skirmisher"
  | "Artillery"
  | "Controller"
  | "Lurker"
  | "Minion";

type MonsterRank = "Standard" | "Elite" | "Solo";

interface Monster {
  id: string
  name: string
  level: number
  role: MonsterRole
  rank: MonsterRank
  tags: string[]
}

---

# Encounter Templates

Templates define encounter structure.

Example template:

Standard Fight

1 Brute|Soldier  
1 Artillery  
1 Skirmisher  
1 Controller  

Templates should be stored in:

src/data/templates.json

---

# Level Rules

User supplies **Party Level**.

Allowed monster range:

partyLevel -1 → partyLevel +2

Preferred difficulty:

partyLevel +2

Monsters closer to the preferred difficulty should receive higher weight.

---

# Duplicate Handling

Duplicate policies:

allow  
soft-avoid  
avoid  

Duplicates may occur when a template requires multiple identical monsters.

Otherwise duplicates should be penalized.

---

# Generator Pipeline

The generator should follow this pipeline:

1. Choose template (weighted random)
2. Resolve template slots
3. Score monster candidates
4. Build encounter
5. Run diagnostics
6. Reject weak encounters and retry

Maximum retry attempts should be capped (example: 20).

---

# Diagnostics

Diagnostics should evaluate:

• threat category coverage  
• duplicate monsters  
• brute overuse  
• encounter variety  

Weak encounters should trigger regeneration.

Threat categories are defined in **generator-rules.md**.

---

# Terrain Suggestions (Optional)

Terrain data should be stored in:

src/data/terrain.json

Examples:

• lava bridge  
• ruined pillars  
• necrotic altar  
• unstable ledges  
• dense graveyard fog  

Terrain may optionally match encounter theme.

---

# Constants File

Create:

src/lib/generator/constants.ts

Example constants:

DEFAULT_LEVEL_MIN_OFFSET = -1  
DEFAULT_LEVEL_MAX_OFFSET = 2  
DEFAULT_TARGET_OFFSET = 2  

MAX_GENERATION_ATTEMPTS = 20  
BRUTE_LIMIT = 1  

Avoid magic numbers in generator logic.

---

# UI Layout

The UI should use a simple three-panel layout.

Left panel – Controls

• party level  
• level offsets  
• theme  
• template mode  
• duplicate policy  
• generate button  

Center panel – Encounter

• template name  
• monster list  
• reroll encounter  

Right panel – Diagnostics

• threat summary  
• warnings  
• terrain suggestion  

---

# MVP Implementation

Phase 1 – Core Logic

1. create Vite React TS app
2. define domain types
3. add seed monster data
4. implement generator pipeline

Phase 2 – UI

5. build controls panel
6. build encounter display
7. connect generator to UI

Phase 3 – Quality

8. add diagnostics
9. add rejection loop
10. add terrain suggestions

Phase 4 – Enhancements

11. reroll individual slot
12. template editor
13. monster CSV import
14. encounter export

---

# Final Principle

This tool should behave like a **GM assistant**, not a random monster picker.

Prefer **curated randomness and tactical variety** over pure randomness.
