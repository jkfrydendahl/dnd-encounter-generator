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

export const DUPLICATE_PENALTY = 15
export const EXCESS_BRUTE_PENALTY = 20
export const OVERREPRESENTED_CATEGORY_PENALTY = 10

export const MIN_REQUIRED_THREAT_CATEGORIES = 2
