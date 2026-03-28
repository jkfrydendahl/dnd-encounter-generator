/**
 * Resolves a fallback image when no exact match exists.
 *
 * Priority: tag fallback → role fallback → default placeholder.
 * Returns found=false to distinguish from exact matches.
 */
import type { MonsterFallbackMap, MonsterImageResolution } from "./imageTypes";

export function resolveMonsterFallback(
  monster: {
    role?: string;
    tags?: string[];
  },
  fallbacks: MonsterFallbackMap
): MonsterImageResolution {
  for (const tag of monster.tags ?? []) {
    const tagMatch = fallbacks.byTag?.[tag];
    if (tagMatch) {
      return {
        found: false,
        path: tagMatch,
        matchedBy: "fallback",
        matchedValue: tag,
      };
    }
  }

  if (monster.role) {
    const roleMatch = fallbacks.byRole?.[monster.role];
    if (roleMatch) {
      return {
        found: false,
        path: roleMatch,
        matchedBy: "fallback",
        matchedValue: monster.role,
      };
    }
  }

  return {
    found: false,
    path: fallbacks.default,
    matchedBy: "placeholder",
  };
}
