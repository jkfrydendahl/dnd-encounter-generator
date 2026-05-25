import type { MonsterRank, MonsterRole } from "../types";

/**
 * Calculate floor(level / 2) bonus for the half-level-to-damage house rule.
 */
export function halfLevelBonus(level: number): number {
  return Math.floor(level / 2);
}

/**
 * HP multiplier based on rank — represents how many extra PC hits
 * this monster absorbs across a typical combat.
 */
function hpHitsMultiplier(rank: MonsterRank): number {
  switch (rank) {
    case "Elite":
      return 8;
    case "Solo":
      return 20;
    default:
      return 4;
  }
}

/**
 * Adjust HP and Bloodied values in a stat block HTML string.
 */
function adjustHp(html: string, bonus: number, rank: MonsterRank): string {
  const hpIncrease = bonus * hpHitsMultiplier(rank);

  // Match HP value (handles both old and new statblock formats)
  return html.replace(
    /(<b>HP<\/b>\s*)(\d+)(;\s*<b>Bloodied<\/b>\s*)(\d+)/gi,
    (_match, prefix, hpStr, middle, _bloodiedStr) => {
      const newHp = parseInt(hpStr, 10) + hpIncrease;
      const newBloodied = Math.floor(newHp / 2);
      return `${prefix}${newHp}${middle}${newBloodied}`;
    }
  );
}

/**
 * Adjust damage expressions in stat block HTML.
 * Handles: XdY+Z, XdY + Z, XdY (flat dice), ongoing N, takes N, plus N,
 * and flat minion-style damage ("; N damage", "Hit: N damage").
 * Damage type keywords (fire, cold, "fire and necrotic", etc.) may appear between
 * the number and "damage".
 */
function adjustDamage(html: string, bonus: number): string {
  let result = html;

  // XdY+Z or XdY + Z with up to 3 optional type words before "damage"
  // e.g. "2d8 + 10 damage", "1d8+5 cold damage", "3d6+6 poison and psychic damage"
  result = result.replace(
    /(\d+d\d+)\s*([+-])\s*(\d+)(\s+(?:\w+\s+){0,3}damage)/gi,
    (_match, dice, sign, mod, suffix) => {
      const currentMod = sign === "-" ? -parseInt(mod, 10) : parseInt(mod, 10);
      const newMod = currentMod + bonus;
      const newSign = newMod >= 0 ? "+" : "-";
      return `${dice} ${newSign} ${Math.abs(newMod)}${suffix}`;
    }
  );

  // Bare XdY with up to 3 optional type words before "damage" (no modifier present)
  // e.g. "1d6 extra damage", "4d6 fire damage"
  result = result.replace(
    /(\d+d\d+)(\s+(?:\w+\s+){0,3}damage)/gi,
    (match, dice, suffix) => {
      // Skip if already has a modifier (was handled by first regex)
      if (/[+-]\s*\d+/.test(match)) return match;
      return `${dice} + ${bonus}${suffix}`;
    }
  );

  // Flat damage after attack resolution (minion-style): "; N [type] damage"
  // e.g. "+18 vs AC; 5 damage.", "+9 vs AC; 5 acid damage"
  result = result.replace(
    /(;\s*)(\d+)(\s+(?:\w+\s+){0,3}damage)/gi,
    (_match, prefix, num, suffix) => {
      const newVal = parseInt(num, 10) + bonus;
      return `${prefix}${newVal}${suffix}`;
    }
  );

  // Flat damage after "Hit:" marker (minion-style): "Hit: N [type] damage"
  // e.g. "Hit: 8 damage.", "Hit:</i> 7 poison damage"
  result = result.replace(
    /(Hit:(?:<\/i>)?\s*)(\d+)(\s+(?:\w+\s+){0,3}damage)/gi,
    (_match, prefix, num, suffix) => {
      const newVal = parseInt(num, 10) + bonus;
      return `${prefix}${newVal}${suffix}`;
    }
  );

  // "ongoing N" damage (flat ongoing values)
  // e.g. "ongoing 6 poison damage", "ongoing 3 fire damage"
  result = result.replace(
    /(ongoing\s+)(\d+)(\s+)/gi,
    (_match, prefix, num, suffix) => {
      const newVal = parseInt(num, 10) + bonus;
      return `${prefix}${newVal}${suffix}`;
    }
  );

  // "takes N [type] damage" (flat damage, not dice-based)
  // e.g. "takes 13 cold damage", "takes 4 damage", "takes 4 extra damage"
  result = result.replace(
    /(takes\s+)(\d+)(\s+(?:\w+\s+){0,3}damage)/gi,
    (_match, prefix, num, suffix) => {
      const newVal = parseInt(num, 10) + bonus;
      return `${prefix}${newVal}${suffix}`;
    }
  );

  // "plus N [type] damage" (additional flat damage riders)
  // e.g. "plus 5 necrotic damage", "plus 2 extra damage"
  result = result.replace(
    /(plus\s+)(\d+)(\s+(?:\w+\s+){0,3}damage)/gi,
    (_match, prefix, num, suffix) => {
      const newVal = parseInt(num, 10) + bonus;
      return `${prefix}${newVal}${suffix}`;
    }
  );

  return result;
}

/**
 * Apply the half-level-to-damage house rule adjustments to a stat block HTML string.
 * Returns the modified HTML with increased HP/Bloodied and damage values.
 * Minions skip HP adjustment (they always have 1 HP) but still get damage increases.
 * If the bonus is 0 (level 1), returns the original HTML unchanged.
 */
export function adjustStatBlock(
  html: string,
  level: number,
  rank: MonsterRank,
  role?: MonsterRole
): string {
  const bonus = halfLevelBonus(level);
  if (bonus === 0) return html;

  let result = html;
  if (role !== "Minion") {
    result = adjustHp(result, bonus, rank);
  }
  result = adjustDamage(result, bonus);
  return result;
}
