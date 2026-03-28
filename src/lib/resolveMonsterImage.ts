/**
 * Resolves the most appropriate image for a monster.
 *
 * Resolution order:
 * 1. Manual override by monster ID
 * 2. Exact image entry by monster ID
 * 3. Manual override by normalized name
 * 4. Exact image entry by normalized name
 * 5. Alias match
 * 6. Fallback by category tag
 * 7. Fallback by role
 * 8. Default placeholder
 *
 * Keep this function pure and deterministic.
 */
import type {
  MonsterFallbackMap,
  MonsterImageEntry,
  MonsterImageOverride,
  MonsterImageResolution,
} from "./imageTypes";
import { normalizeMonsterName } from "./normalizeMonsterName";
import { resolveMonsterFallback } from "./resolveMonsterFallback";

export function resolveMonsterImage(
  monster: {
    id: string;
    name: string;
    role?: string;
    tags?: string[];
  },
  imageIndex: MonsterImageEntry[],
  overrides: MonsterImageOverride,
  fallbacks: MonsterFallbackMap
): MonsterImageResolution {
  const normalizedName = normalizeMonsterName(monster.name);

  // 1. Override by monster ID
  const overrideById = overrides.byMonsterId?.[monster.id];
  if (overrideById) {
    return {
      found: true,
      path: overrideById,
      matchedBy: "manual-override",
      matchedValue: monster.id,
    };
  }

  // 2. Exact match by monster ID in index
  const directById = imageIndex.find((entry) => entry.monsterId === monster.id);
  if (directById) {
    return {
      found: true,
      path: directById.primary,
      variants: directById.variants,
      matchedBy: "monster-id",
      matchedValue: monster.id,
    };
  }

  // 3. Override by normalized name
  const overrideByName = overrides.byNormalizedName?.[normalizedName];
  if (overrideByName) {
    return {
      found: true,
      path: overrideByName,
      matchedBy: "manual-override",
      matchedValue: normalizedName,
    };
  }

  // 4. Exact match by normalized name in index
  const directByName = imageIndex.find(
    (entry) => entry.normalizedName === normalizedName
  );
  if (directByName) {
    return {
      found: true,
      path: directByName.primary,
      variants: directByName.variants,
      matchedBy: "normalized-name",
      matchedValue: normalizedName,
    };
  }

  // 5. Alias match
  const aliasHit = imageIndex.find((entry) =>
    entry.aliases?.some(
      (alias) => normalizeMonsterName(alias) === normalizedName
    )
  );
  if (aliasHit) {
    return {
      found: true,
      path: aliasHit.primary,
      variants: aliasHit.variants,
      matchedBy: "alias",
      matchedValue: normalizedName,
    };
  }

  // 6-8. Fallback chain
  return resolveMonsterFallback(monster, fallbacks);
}
