/**
 * Builds monsterImageIndex.json by scanning monster data and matching
 * against available image sources.
 *
 * Usage: node scripts/buildMonsterImageIndex.mjs
 *
 * This script:
 * 1. Reads monsters.json for the canonical monster list
 * 2. Normalizes each monster name to a slug
 * 3. Reads existing monsterImageIndex.json (if any) to preserve manual entries
 * 4. Outputs updated monsterImageIndex.json
 *
 * To add images: edit monsterImageIndex.json directly or extend this script
 * with additional image source integrations.
 */

import { readFileSync, writeFileSync } from "fs";
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

// Read monster data
const monsters = JSON.parse(
  readFileSync(join(ROOT, "src/data/monsters.json"), "utf-8")
);

// Read existing index (preserve manual entries)
let existingIndex = [];
try {
  existingIndex = JSON.parse(
    readFileSync(join(ROOT, "src/data/monsterImageIndex.json"), "utf-8")
  );
} catch {
  // No existing index — start fresh
}

// Build lookup of existing entries by monsterId
const existingById = new Map(existingIndex.map((e) => [e.monsterId, e]));

// Build full index: keep existing entries, add stubs for new monsters
const index = monsters.map((monster) => {
  const normalizedName = normalizeMonsterName(monster.name);

  // If we already have an entry, keep it
  if (existingById.has(monster.id)) {
    return existingById.get(monster.id);
  }

  // Create a stub entry (no image URL yet)
  return {
    monsterId: monster.id,
    name: monster.name,
    normalizedName,
    primary: null,
    tags: monster.tags,
  };
});

// Check for duplicate normalized names
const nameCounts = new Map();
for (const entry of index) {
  const count = nameCounts.get(entry.normalizedName) || 0;
  nameCounts.set(entry.normalizedName, count + 1);
}
const duplicates = [...nameCounts.entries()].filter(([, count]) => count > 1);
if (duplicates.length > 0) {
  console.warn("⚠ Duplicate normalized names:");
  for (const [name, count] of duplicates) {
    console.warn(`  ${name} (${count} entries)`);
  }
}

// Only write entries that have a primary image (skip stubs)
const populated = index.filter((e) => e.primary != null);

writeFileSync(
  join(ROOT, "src/data/monsterImageIndex.json"),
  JSON.stringify(populated, null, 2) + "\n"
);

console.log(`\nMonster Image Index Build Report`);
console.log(`================================`);
console.log(`Total monsters:    ${monsters.length}`);
console.log(`With images:       ${populated.length}`);
console.log(`Without images:    ${monsters.length - populated.length}`);
console.log(`Coverage:          ${((populated.length / monsters.length) * 100).toFixed(1)}%`);
if (duplicates.length > 0) {
  console.log(`Duplicate slugs:   ${duplicates.length}`);
}
console.log(`\nOutput: src/data/monsterImageIndex.json`);
