/*
Threat category utilities.

This module maps monster roles to encounter threat categories.

Threat categories are used by:
- slot-level scoring bias
- final encounter evaluation
- UI diagnostics

Threat categories:

Pressure
Frontline monsters that engage the party directly.
Examples: Brute, Soldier

Damage
Monsters that deliver high damage or ranged pressure.
Examples: Artillery, Lurker, Skirmisher

Control
Monsters that disrupt player positioning or actions.
Examples: Controller

Neutral
Monsters that do not strongly define encounter pressure.
Example: Minion

This mapping should remain centralized here so that all parts of the
generator use the same classification logic.

The module will eventually expose helper functions such as:

- getThreatCategory(role)
- buildThreatSummary(encounterEntries)
- countThreatCategories(summary)
- getPresentThreatCategories(summary)

These helpers allow the generator to reason about encounter composition.
*/
