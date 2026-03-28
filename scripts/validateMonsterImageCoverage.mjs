/**
 * Validates monster image coverage by running the full resolution pipeline
 * against every monster in monsters.json.
 *
 * Usage: node scripts/validateMonsterImageCoverage.mjs
 *
 * Reports:
 * - Exact matches (by ID, name, alias)
 * - Manual overrides used
 * - Fallback matches (by tag, role)
 * - Placeholder count
 * - Lists of unresolved monsters
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function normalizeMonsterName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Load data files
const monsters = JSON.parse(
  readFileSync(join(ROOT, "src/data/monsters.json"), "utf-8")
);
const imageIndex = JSON.parse(
  readFileSync(join(ROOT, "src/data/monsterImageIndex.json"), "utf-8")
);
const overrides = JSON.parse(
  readFileSync(join(ROOT, "src/data/monsterImageOverrides.json"), "utf-8")
);
const fallbacks = JSON.parse(
  readFileSync(join(ROOT, "src/data/monsterFallbacks.json"), "utf-8")
);

// Simplified resolver (mirrors src/lib/resolveMonsterImage.ts)
function resolve(monster) {
  const normalizedName = normalizeMonsterName(monster.name);

  if (overrides.byMonsterId?.[monster.id]) {
    return { matchedBy: "manual-override", matchedValue: monster.id };
  }
  if (imageIndex.find((e) => e.monsterId === monster.id)) {
    return { matchedBy: "monster-id", matchedValue: monster.id };
  }
  if (overrides.byNormalizedName?.[normalizedName]) {
    return { matchedBy: "manual-override", matchedValue: normalizedName };
  }
  if (imageIndex.find((e) => e.normalizedName === normalizedName)) {
    return { matchedBy: "normalized-name", matchedValue: normalizedName };
  }
  const aliasHit = imageIndex.find((e) =>
    e.aliases?.some((a) => normalizeMonsterName(a) === normalizedName)
  );
  if (aliasHit) {
    return { matchedBy: "alias", matchedValue: normalizedName };
  }

  for (const tag of monster.tags ?? []) {
    if (fallbacks.byTag?.[tag]) {
      return { matchedBy: "fallback-tag", matchedValue: tag };
    }
  }
  if (monster.role && fallbacks.byRole?.[monster.role]) {
    return { matchedBy: "fallback-role", matchedValue: monster.role };
  }
  return { matchedBy: "placeholder" };
}

// Resolve all
const results = monsters.map((m) => ({ monster: m, ...resolve(m) }));

// Categorize
const byMethod = {};
for (const r of results) {
  if (!byMethod[r.matchedBy]) byMethod[r.matchedBy] = [];
  byMethod[r.matchedBy].push(r);
}

const exactMethods = ["manual-override", "monster-id", "normalized-name", "alias"];
const exactCount = exactMethods.reduce((sum, m) => sum + (byMethod[m]?.length ?? 0), 0);
const fallbackCount = (byMethod["fallback-tag"]?.length ?? 0) + (byMethod["fallback-role"]?.length ?? 0);
const placeholderCount = byMethod["placeholder"]?.length ?? 0;

console.log(`\nMonster Image Coverage Report`);
console.log(`=============================`);
console.log(`Total monsters:     ${monsters.length}`);
console.log(`Exact matches:      ${exactCount}`);
if (byMethod["manual-override"]) console.log(`  Manual overrides: ${byMethod["manual-override"].length}`);
if (byMethod["monster-id"]) console.log(`  By monster ID:    ${byMethod["monster-id"].length}`);
if (byMethod["normalized-name"]) console.log(`  By name:          ${byMethod["normalized-name"].length}`);
if (byMethod["alias"]) console.log(`  By alias:         ${byMethod["alias"].length}`);
console.log(`Fallback matches:   ${fallbackCount}`);
if (byMethod["fallback-tag"]) console.log(`  By tag:           ${byMethod["fallback-tag"].length}`);
if (byMethod["fallback-role"]) console.log(`  By role:          ${byMethod["fallback-role"].length}`);
console.log(`Placeholders:       ${placeholderCount}`);
console.log(`Coverage:           ${((exactCount / monsters.length) * 100).toFixed(1)}%`);

// List placeholders (no image at all)
if (placeholderCount > 0 && placeholderCount <= 50) {
  console.log(`\nMonsters using placeholder:`);
  for (const r of byMethod["placeholder"]) {
    console.log(`  - ${r.monster.name} (${r.monster.id})`);
  }
}
