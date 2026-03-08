/*
Core domain types used across the encounter generator.

This file defines the shared data structures used by:

- generator logic
- UI components
- seed JSON data
- diagnostics and evaluation

These types represent the domain model described in:

.github/implementation-plan.md
.github/generator-rules.md

Do not place generator logic in this file.
This file should only contain type definitions.

Key concepts:

Monster
Represents a single monster entry in the monster dataset.

EncounterTemplate
Defines a reusable structure for encounters, consisting of multiple slots.

EncounterSlot
A requirement inside a template describing what type of monster should fill the slot.

GeneratorSettings
User-configurable options that affect encounter generation.

GeneratedEncounter
The final encounter produced by the generator.
*/
