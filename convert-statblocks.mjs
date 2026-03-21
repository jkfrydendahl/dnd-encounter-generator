// convert-statblocks.mjs
// One-time script to download monster stat blocks from the iws.mx-dnd compendium
// and match them to our existing monsters.json entries.
//
// Data source: https://github.com/mbutler/iws.mx-dnd/tree/main/dnd/4e_database_files/monster
//
// Usage: node convert-statblocks.mjs

import { readFileSync, writeFileSync } from "fs";

const BASE_URL =
  "https://raw.githubusercontent.com/mbutler/iws.mx-dnd/main/dnd/4e_database_files/monster";
const DATA_FILE_COUNT = 20;

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

function parseListingJSONP(text) {
  // Format: od.reader.jsonp_data_listing(date, "monster", [columns], [ [row], [row], ... ])
  // Extract the array of rows
  const match = text.match(
    /od\.reader\.jsonp_data_listing\(\s*\d+\s*,\s*"monster"\s*,\s*\[.*?\]\s*,\s*(\[[\s\S]*\])\s*\)/
  );
  if (!match) throw new Error("Failed to parse _listing.js JSONP format");
  return JSON.parse(match[1]);
}

function parseDataJSONP(text) {
  // Format: od.reader.jsonp_batch_data(date, "monster", { "monsterNNN": "html", ... })
  const match = text.match(
    /od\.reader\.jsonp_batch_data\(\s*\d+\s*,\s*"monster"\s*,\s*(\{[\s\S]*\})\s*\)/
  );
  if (!match) throw new Error("Failed to parse data JSONP format");
  return JSON.parse(match[1]);
}

function getDataFileIndex(monsterId) {
  const num = parseInt(monsterId.replace("monster", ""), 10);
  return num % DATA_FILE_COUNT;
}

async function main() {
  console.log("Loading our monsters.json...");
  const ourMonsters = JSON.parse(
    readFileSync("src/data/monsters.json", "utf-8")
  );
  const ourNames = new Set(ourMonsters.map((m) => m.name.toLowerCase()));
  console.log(`  Found ${ourNames.size} unique monster names in our data.`);

  console.log("Fetching compendium listing...");
  const listingText = await fetchText(`${BASE_URL}/_listing.js`);
  const listingRows = parseListingJSONP(listingText);
  console.log(`  Found ${listingRows.length} monsters in compendium.`);

  // Build compendium lookup: lowercased name → { id, name }
  const compendiumByName = new Map();
  for (const row of listingRows) {
    const [id, name] = row;
    const nameLower = name.toLowerCase();
    if (!compendiumByName.has(nameLower)) {
      compendiumByName.set(nameLower, { id, name });
    }
  }

  // Build name → compendium ID mapping with fuzzy matching
  const nameToId = new Map();
  for (const ourName of ourNames) {
    // 1. Exact match
    if (compendiumByName.has(ourName)) {
      nameToId.set(ourName, compendiumByName.get(ourName).id);
      continue;
    }
    // 2. Strip parenthetical: "Dretch (Demon)" → "Dretch"
    const withoutParens = ourName.replace(/\s*\(.*?\)\s*$/, "").trim();
    if (withoutParens !== ourName && compendiumByName.has(withoutParens)) {
      nameToId.set(ourName, compendiumByName.get(withoutParens).id);
      continue;
    }
    // 3. Swap comma suffix: "Brown Dragon, Young" → "Young Brown Dragon"
    const commaMatch = ourName.match(/^(.+),\s*(.+)$/);
    if (commaMatch) {
      const swapped = `${commaMatch[2]} ${commaMatch[1]}`.toLowerCase();
      if (compendiumByName.has(swapped)) {
        nameToId.set(ourName, compendiumByName.get(swapped).id);
        continue;
      }
    }
  }
  console.log(
    `  Matched ${nameToId.size} of ${ourNames.size} monsters (${((nameToId.size / ourNames.size) * 100).toFixed(1)}%).`
  );

  // Determine which data files we need
  const neededFiles = new Set();
  for (const id of nameToId.values()) {
    neededFiles.add(getDataFileIndex(id));
  }
  console.log(
    `  Need to fetch ${neededFiles.size} of ${DATA_FILE_COUNT} data files.`
  );

  // Fetch needed data files
  const allStatBlocks = {};
  const sortedFiles = [...neededFiles].sort((a, b) => a - b);
  for (const fileIndex of sortedFiles) {
    const url = `${BASE_URL}/data${fileIndex}.js`;
    console.log(`  Fetching data${fileIndex}.js...`);
    const dataText = await fetchText(url);
    const parsed = parseDataJSONP(dataText);
    Object.assign(allStatBlocks, parsed);
  }
  console.log(
    `  Loaded ${Object.keys(allStatBlocks).length} total stat blocks.`
  );

  // Build final output: monster name → HTML stat block
  const output = {};
  let matched = 0;
  let missing = 0;
  for (const [nameLower, compendiumId] of nameToId.entries()) {
    const html = allStatBlocks[compendiumId];
    if (html) {
      // Use the original casing from our monsters.json
      const originalMonster = ourMonsters.find(
        (m) => m.name.toLowerCase() === nameLower
      );
      output[originalMonster.name] = html;
      matched++;
    } else {
      missing++;
      console.warn(`  Warning: No stat block found for ID ${compendiumId}`);
    }
  }

  console.log(`\nResults:`);
  console.log(`  Stat blocks found: ${matched}`);
  console.log(`  Missing stat blocks: ${missing}`);
  console.log(
    `  Unmatched monsters (no compendium entry): ${ourNames.size - nameToId.size}`
  );

  // Log some unmatched monster names for debugging
  const unmatched = ourMonsters
    .filter((m) => !nameToId.has(m.name.toLowerCase()))
    .map((m) => m.name);
  if (unmatched.length > 0) {
    console.log(`\nFirst 20 unmatched monsters:`);
    unmatched.slice(0, 20).forEach((n) => console.log(`  - ${n}`));
  }

  writeFileSync("src/data/statblocks.json", JSON.stringify(output, null, 2) + "\n");
  console.log(`\nWrote src/data/statblocks.json (${matched} entries)`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
