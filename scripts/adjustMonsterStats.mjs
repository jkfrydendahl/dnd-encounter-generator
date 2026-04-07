/**
 * Adjusts 4e monster stats for faster combat:
 * - HP reduced by 25% (Bloodied recalculated as HP/2)
 * - All damage increased by 25% (dice modifiers, flat damage, ongoing)
 * - Minions (HP=1) are skipped entirely
 *
 * Usage: node scripts/adjustMonsterStats.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const STAT_PATH = join(ROOT, "src/data/statblocks.json");

const HP_MULTIPLIER = 0.75;    // reduce HP by 25%
const DMG_MULTIPLIER = 1.25;   // increase damage by 25%

/**
 * Adjust HP and Bloodied values in a stat block.
 * Pattern: <b>HP</b> 76; <b>Bloodied</b> 38
 * Returns null if this is a minion (HP=1).
 */
function adjustHP(html) {
  return html.replace(
    /(<b>HP<\/b>\s*)(\d+)(;\s*<b>Bloodied<\/b>\s*)(\d+)/gi,
    (match, pre, hp, mid, bloodied) => {
      const oldHp = parseInt(hp);
      if (oldHp <= 1) return match; // minion, skip
      const newHp = Math.max(1, Math.floor(oldHp * HP_MULTIPLIER));
      const newBloodied = Math.floor(newHp / 2);
      return `${pre}${newHp}${mid}${newBloodied}`;
    }
  );
}

/**
 * Increase the modifier in a dice expression like "1d8+4" or "3d6 + 1".
 * Only modifies the +N part; dice count and size stay the same.
 */
function boostDiceExpr(expr) {
  // Pattern: XdY or XdY+Z or XdY + Z
  const match = expr.match(/^(\d+d\d+)(\s*\+\s*)(\d+)$/);
  if (match) {
    const newMod = Math.max(1, Math.round(parseInt(match[3]) * DMG_MULTIPLIER));
    return `${match[1]}${match[2]}${newMod}`;
  }
  // Just dice, no modifier (e.g., "1d6") — add a modifier
  const diceOnly = expr.match(/^(\d+)d(\d+)$/);
  if (diceOnly) {
    // Average of XdY = X * (Y+1)/2. 25% of that as a new modifier.
    const avg = parseInt(diceOnly[1]) * (parseInt(diceOnly[2]) + 1) / 2;
    const bonus = Math.max(1, Math.round(avg * 0.25));
    return `${expr} + ${bonus}`;
  }
  return expr;
}

/**
 * Boost all damage expressions in the HTML.
 * Handles:
 * - Dice+mod damage: "1d8+4 damage" → "1d8+5 damage"
 * - Dice-only damage: "1d6 damage" → "1d6 + 2 damage"  
 * - Flat damage: "; 6 damage" or "takes 6 damage"
 * - Ongoing damage: "ongoing 5" → "ongoing 6"
 * - Extra damage: "extra 1d6 damage", "an extra 5 damage"
 */
function adjustDamage(html) {
  // 1. Dice expressions before "damage" (with any type prefix like "cold", "fire", etc.)
  html = html.replace(
    /(\d+d\d+\s*(?:\+\s*\d+)?)\s+(damage|cold damage|fire damage|necrotic damage|lightning damage|poison damage|psychic damage|radiant damage|thunder damage|acid damage|force damage)/gi,
    (match, dice, dmgType) => {
      return `${boostDiceExpr(dice.trim())} ${dmgType}`;
    }
  );

  // 2. Flat damage after semicolons: "; 6 damage" or "; 6 cold damage"
  html = html.replace(
    /(;\s*)(\d+)(\s+(?:damage|cold damage|fire damage|necrotic damage|lightning damage|poison damage|psychic damage|radiant damage|thunder damage|acid damage|force damage))/gi,
    (match, pre, num, post) => {
      const val = parseInt(num);
      if (val <= 1) return match;
      const newVal = Math.max(1, Math.round(val * DMG_MULTIPLIER));
      return `${pre}${newVal}${post}`;
    }
  );

  // 3. "takes X damage" or "takes X [type] damage"
  html = html.replace(
    /(takes\s+)(\d+)(\s+(?:damage|cold damage|fire damage|necrotic damage|lightning damage|poison damage|psychic damage|radiant damage|thunder damage|acid damage|force damage))/gi,
    (match, pre, num, post) => {
      const val = parseInt(num);
      if (val <= 1) return match;
      const newVal = Math.max(1, Math.round(val * DMG_MULTIPLIER));
      return `${pre}${newVal}${post}`;
    }
  );

  // 4. Ongoing damage: "ongoing 5" → "ongoing 6"
  html = html.replace(
    /(ongoing\s+)(\d+)/gi,
    (match, pre, num) => {
      const val = parseInt(num);
      if (val <= 1) return match;
      const newVal = Math.max(1, Math.round(val * DMG_MULTIPLIER));
      return `${pre}${newVal}`;
    }
  );

  // 5. "extra X damage" (flat): "extra 5 damage" → "extra 6 damage"
  html = html.replace(
    /(extra\s+)(\d+)(\s+(?:damage|cold damage|fire damage|necrotic damage|lightning damage|poison damage|psychic damage|radiant damage|thunder damage|acid damage|force damage))/gi,
    (match, pre, num, post) => {
      const val = parseInt(num);
      if (val <= 1) return match;
      const newVal = Math.max(1, Math.round(val * DMG_MULTIPLIER));
      return `${pre}${newVal}${post}`;
    }
  );

  return html;
}

// --- Main ---

function main() {
  const statblocks = JSON.parse(readFileSync(STAT_PATH, "utf-8"));
  const names = Object.keys(statblocks);

  let modified = 0;
  let skippedMinions = 0;
  let hpChanges = 0;
  let dmgChanges = 0;

  for (const name of names) {
    const original = statblocks[name];

    // Detect minion (HP=1)
    const hpMatch = original.match(/<b>HP<\/b>\s*(\d+)/);
    if (hpMatch && parseInt(hpMatch[1]) <= 1) {
      skippedMinions++;
      continue;
    }

    let result = original;

    // Adjust HP
    const afterHp = adjustHP(result);
    if (afterHp !== result) hpChanges++;
    result = afterHp;

    // Adjust damage
    const afterDmg = adjustDamage(result);
    if (afterDmg !== result) dmgChanges++;
    result = afterDmg;

    if (result !== original) {
      statblocks[name] = result;
      modified++;
    }
  }

  writeFileSync(STAT_PATH, JSON.stringify(statblocks, null, 2) + "\n");

  console.log("Monster Stat Adjustment Report");
  console.log("==============================");
  console.log(`Total stat blocks:   ${names.length}`);
  console.log(`Modified:            ${modified}`);
  console.log(`Skipped (minions):   ${skippedMinions}`);
  console.log(`HP adjustments:      ${hpChanges}`);
  console.log(`Damage adjustments:  ${dmgChanges}`);
  console.log(`HP multiplier:       ${HP_MULTIPLIER} (${((1 - HP_MULTIPLIER) * 100).toFixed(0)}% reduction)`);
  console.log(`Damage multiplier:   ${DMG_MULTIPLIER} (${((DMG_MULTIPLIER - 1) * 100).toFixed(0)}% increase)`);

  // Show a sample
  console.log("\n--- Sample: White Dragon Wyrmling ---");
  const sample = statblocks["White Dragon Wyrmling"];
  const hpSample = sample.match(/<b>HP<\/b>\s*(\d+);\s*<b>Bloodied<\/b>\s*(\d+)/);
  if (hpSample) console.log(`  HP: ${hpSample[1]}, Bloodied: ${hpSample[2]}`);
  const dmgSamples = [...sample.matchAll(/(\d+d\d+\s*(?:\+\s*\d+)?)\s+(damage|cold damage)/gi)];
  dmgSamples.forEach((m) => console.log(`  Damage: ${m[1]} ${m[2]}`));
  const ong = [...sample.matchAll(/ongoing\s+(\d+)/gi)];
  ong.forEach((m) => console.log(`  Ongoing: ${m[1]}`));

  console.log("\n--- Sample: Goblin Blackblade ---");
  const goblin = statblocks["Goblin Blackblade"];
  const hpGob = goblin.match(/<b>HP<\/b>\s*(\d+)/);
  if (hpGob) console.log(`  HP: ${hpGob[1]}`);
  const dmgGob = [...goblin.matchAll(/(\d+d\d+\s*(?:\+\s*\d+)?)\s+(damage)/gi)];
  dmgGob.forEach((m) => console.log(`  Damage: ${m[1]} ${m[2]}`));
}

main();
