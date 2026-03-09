// constants.ts
/*
Central generator tuning values.

Keep scoring weights and generation limits here
so encounter behavior can be tuned without
rewriting the generator logic.
*/

export const MAX_GENERATION_ATTEMPTS = 12

export const BRUTE_LIMIT = 1

export const MISSING_THREAT_BONUS = 20
export const UNDERREPRESENTED_THREAT_BONUS = 10
export const THEME_MATCH_BONUS = 10
export const TAG_COHERENCE_BONUS = 8
export const THEME_COHERENCE_BONUS = 12

export const DUPLICATE_PENALTY = 15
export const EXCESS_BRUTE_PENALTY = 20
export const OVERREPRESENTED_CATEGORY_PENALTY = 10

export const EVAL_TAG_COHERENCE_BONUS = 8
export const EVAL_THEME_COHERENCE_BONUS = 10

export const MIN_REQUIRED_THREAT_CATEGORIES = 2

export const DEFAULT_MONSTER_COUNT = 4

export const DEFAULT_LEVEL_MIN_OFFSET = -1
export const DEFAULT_LEVEL_MAX_OFFSET = 2
export const DEFAULT_TARGET_OFFSET = 2
