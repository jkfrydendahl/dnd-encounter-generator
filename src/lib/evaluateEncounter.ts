/*
Encounter evaluation and diagnostics.

This module performs the final quality evaluation for a generated encounter.

It is part of the two-pass encounter generation model described in:

.github/implementation-plan.md

Generation strategy:

1. generateCandidateEncounter()
   Builds a single candidate encounter.

2. evaluateEncounter()
   Scores the candidate and determines whether it is valid.

3. generateEncounter()
   Generates multiple candidates and returns the best one.

Responsibilities of this module:

- calculate threat category coverage
- identify structural problems in the encounter
- produce diagnostic warnings
- compute an overall encounter quality score
- determine whether the encounter is valid

Example warnings:

- encounter has no damage threat
- encounter has no control threat
- encounter has too many Brutes
- encounter has very low role diversity
- encounter consists of a single monster type

The evaluation should reward:

- threat diversity (pressure, damage, control)
- role variety
- reasonable difficulty level
- thematic consistency

The evaluation should penalize:

- duplicate monsters
- excessive Brutes
- missing threat categories
- extremely repetitive encounters

This module should **not modify the encounter**.

It only analyzes and scores the finished encounter.

The output will eventually include:

EncounterDiagnostics

Which contains:

- threat summary
- warnings
- quality score
- validity flag

The generator will use these diagnostics to decide which candidate
encounter to return.
*/
