/*
Scores a monster candidate for a specific encounter slot.

This module is used during slot resolution while building a candidate encounter.

Purpose:
Guide the generator toward stronger encounter composition before the
final encounter is evaluated.

This is a local scoring step, not the final encounter score.

The function should combine:
- a small random factor for variation
- level-based weighting
- theme-based weighting
- role-balance bias
- duplicate penalties
- brute-overuse penalties

Intended score factors:

+ level proximity
  Prefer monsters close to the target difficulty level.

+ theme match
  Increase score if the monster matches the selected encounter theme.

+ fills missing threat category
  Increase score if the monster adds a threat category the partial
  encounter does not yet contain.

+ supports underrepresented category
  Slightly increase score if the monster strengthens a category that is
  currently present but underrepresented.

- duplicate monster
  Reduce score if the same monster has already been chosen in another
  slot, unless duplicates are intentional.

- brute over-cap
  Reduce score if adding the monster would push the encounter above the
  preferred Brute limit.

- overrepresented threat category
  Reduce score if the monster adds more weight to a threat category that
  is already dominant in the partial encounter.

This scoring should bias the generator toward:
- pressure + damage + control coverage
- role diversity
- tactically varied encounters
- bonus if candidate matches selected encounter theme
- bonus if candidate shares a theme with already chosen monsters
- small penalty if candidate breaks theme coherence too hard

This module should not:
- choose the final monster directly
- evaluate the full encounter
- mutate encounter state

It should only return a numeric weight for one candidate monster.
*/
