# Generator Rules

This document defines the encounter design heuristics used by the D&D 4e encounter generator.

The goal is to generate **tactically interesting encounters** for optimized parties.

The generator should prefer encounters that combine different threat types and avoid encounters that become simple attrition fights.

---

# Threat Categories

Monsters fall into three primary threat categories.

## Pressure
Frontline monsters that engage and pin down players.

Examples:
- Brute
- Soldier

## Damage
Monsters that deliver high damage or ranged pressure.

Examples:
- Artillery
- Lurker
- Skirmisher

## Control
Monsters that disrupt positioning or actions.

Examples:
- Controller

---

# Desired Encounter Composition

Most encounters should include **2–3 threat categories**.

Ideal structure:

- 1 frontline threat (Brute or Soldier)
- 1 ranged threat (Artillery or Lurker)
- 1 mobility threat (Skirmisher or Lurker)
- 1 control monster (Controller)

Encounters missing a threat category should be penalized.

---

# Duplicate Monster Rules

Avoid using the same monster across multiple slots unless:

- the template explicitly includes multiple copies
- the monster pool is very small

Soft duplicates may occur but should be penalized during scoring.

---

# Brute Limit

Brutes tend to produce attrition-based encounters.

Recommended limit:

Maximum 1 brute per encounter.

Encounters with multiple brutes should receive a penalty.

---

# Level Rules

Monsters should generally fall within:

partyLevel -1  
to  
partyLevel +2

Preferred difficulty:

partyLevel +2

Monsters closer to the preferred difficulty should receive higher selection weight.

---

# Encounter Rejection Rules

Encounters should be rejected if they contain:

- only one monster role
- fewer than two threat categories
- no damage threat
- excessive duplicates

Rejected encounters should trigger regeneration until a valid encounter is produced.
