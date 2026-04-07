/**
 * Sources monster images from the Forgotten Realms Wiki (Fandom).
 *
 * Strategy:
 * 1. Extract "base creature name" candidates from each monster name
 * 2. Deduplicate and batch-query the wiki API for page images
 * 3. Map results back to individual monsters
 * 4. Write updated monsterImageIndex.json
 *
 * Usage: node scripts/sourceMonsterImages.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const WIKI_API = "https://forgottenrealms.fandom.com/api.php";
const BATCH_SIZE = 50; // MediaWiki API max per query
const DELAY_MS = 500; // Be polite

function normalizeMonsterName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Base name extraction ---

const COMBAT_ROLES = new Set([
  "warrior", "archer", "slinger", "raider", "guard", "scout", "soldier",
  "striker", "berserker", "skirmisher", "champion", "captain", "chieftain",
  "grunt", "minion", "brute", "mage", "priest", "shaman", "acolyte",
  "sentry", "sniper", "hunter", "stalker", "assassin", "thug", "lackey",
  "wretch", "harrier", "darter", "slasher", "cursespewer", "hexer",
  "commander", "warden", "zealot", "marauder", "savage", "mystic",
  "adept", "initiate", "master", "lord", "king", "queen", "matriarch",
  "patriarch", "elder", "ancient", "young", "adult", "wyrmling",
  "sellsword", "commoner", "bandit", "cutthroat", "rabble", "creeper",
  "hurler", "guardian", "grower", "monitor", "mucker", "caster",
]);

const DRAGON_COLORS = new Set([
  "black", "blue", "green", "red", "white",
  "gold", "silver", "bronze", "brass", "copper",
  "brown", "gray", "purple", "shadow", "adamantine",
]);

const TAG_TO_BASE = {
  "Goblinoid": ["goblin", "hobgoblin", "bugbear"],
  "Ooze": ["ooze"],
};

// Manual name → wiki title mappings for common creatures the automatic extraction misses
const MANUAL_WIKI_MAPPINGS = {
  // Beasts and animals
  "dire rat": "Giant rat",
  "riding horse": "Horse",
  "warhorse": "Horse",
  "blood hawk": "Blood hawk",
  "gray wolf": "Wolf",
  "dire wolf": "Dire wolf",
  "centipede swarm": "Centipede",
  "centipede scuttler": "Centipede",
  "ambush spider": "Spider",
  "spiderling": "Spider",
  "cave fisher": "Cave fisher",
  "cave stirge swarm": "Stirge",
  "dire stirge": "Stirge",
  "bat": "Bat",
  "dire bat": "Bat",
  "scorpion": "Scorpion",
  "frog": "Giant frog",
  "snake": "Snake",
  "spider": "Giant spider",
  "wolf": "Wolf",
  "hawk": "Hawk",
  "horse": "Horse",
  "bear": "Bear",
  "boar": "Boar",
  "crocodile": "Crocodile",
  "shark": "Shark",
  "beetle": "Beetle",
  "ant": "Giant ant",
  "silverback ape": "Ape",
  "cacklefiend hyena": "Hyena",
  "hoard scarab": "Scarab",
  "hoard scarab larva swarm": "Scarab",

  // Classic D&D creatures
  "carrion crawler": "Carrion crawler",
  "enormous carrion crawler": "Carrion crawler",
  "displacer beast": "Displacer beast",
  "displacer beast packlord": "Displacer beast",
  "gibbering mouther": "Gibbering mouther",
  "gibbering abomination": "Gibbering mouther",
  "gibbering orb": "Gibbering orb",
  "hook horror": "Hook horror",
  "umber hulk": "Umber hulk",
  "purple worm": "Purple worm",
  "elder purple worm": "Purple worm",
  "shambling mound": "Shambling mound",
  "night hag": "Night hag",
  "nightmare": "Nightmare",
  "gray render": "Gray render",
  "guardian naga": "Guardian naga",
  "dark naga": "Dark naga",
  "mind flayer infiltrator": "Mind flayer",
  "mind flayer mastermind": "Mind flayer",
  "object mimic": "Mimic",
  "dire bulette": "Bulette",
  "venom-eye basilisk": "Basilisk",
  "sea kraken": "Kraken",
  "winterclaw owlbear": "Owlbear",

  // Hags
  "bog hag": "Hag",
  "howling hag": "Hag",
  "pact hag": "Hag",
  "death hag": "Hag",

  // Kuo-Toa
  "kuo-toa warder": "Kuo-toa",
  "kuo-toa marauder": "Kuo-toa",
  "kuo-toa spearfiend": "Kuo-toa",
  "kuo-toa harpooner": "Kuo-toa",
  "kuo-toa leviathan": "Kuo-toa",
  "kuo-toa monitor": "Kuo-toa",
  "kuo-toa whip": "Kuo-toa",

  // Shadar-Kai
  "shadar-kai chainfighter": "Shadar-kai",
  "shadar-kai gloomblade": "Shadar-kai",
  "shadar-kai witch": "Shadar-kai",
  "shadar-kai warrior": "Shadar-kai",
  "shadar-kai dawnkiller": "Shadar-kai",
  "shadar-kai gloom lord": "Shadar-kai",
  "shadar-kai painbearer": "Shadar-kai",

  // Thri-Kreen
  "thri-kreen ambusher": "Thri-kreen",
  "thri-kreen scout": "Thri-kreen",
  "thri-kreen desert talker": "Thri-kreen",

  // Dark Ones
  "dark creeper (dark one)": "Dark creeper",
  "dark stalker (dark one)": "Dark stalker",

  // Plant creatures
  "vine horror": "Vine horror",
  "vine horror spellfiend": "Vine horror",
  "ambush vine": "Assassin vine",
  "ambush vine shoot": "Assassin vine",
  "warthorn battlebriar": "Treant",
  "earthrage battlebriar": "Treant",
  "oblivion moss mindmaster": "Oblivion moss",
  "stormrage shambler": "Shambling mound",
  "shambler": "Shambling mound",
  "squamous maw": "Squamous spewer",

  // Creatures where last word is the type
  "spirit devourer": "Devourer",
  "devourer": "Devourer",
  "anthraxin the devourer": "Devourer",

  // Abishai
  "wrack abishai": "Abishai",
  "storm abishai": "Abishai",
  "inferno abishai": "Abishai",
  "venomous abishai": "Abishai",

  // Galeb Duhr
  "galeb duhr earthbreaker": "Galeb duhr",
  "galeb duhr rockcaller": "Galeb duhr",

  // Spawn of Tiamat
  "brownspawn marauder": "Spawn of Tiamat",
  "greenspawn": "Spawn of Tiamat",
  "brownspawn": "Spawn of Tiamat",
  "blackspawn": "Spawn of Tiamat",
  "bluespawn": "Spawn of Tiamat",
  "redspawn": "Spawn of Tiamat",
  "whitespawn": "Spawn of Tiamat",
  "bluespawn stormlizard": "Spawn of Tiamat",
  "bluespawn godslayer": "Spawn of Tiamat",
  "blackspawn gloomweb": "Spawn of Tiamat",
  "purplespawn nightmare": "Spawn of Tiamat",
  "redspawn firebelcher": "Spawn of Tiamat",
  "redspawn devastator": "Spawn of Tiamat",
  "grayspawn fleshtearer": "Spawn of Tiamat",

  // Shardmind
  "shardmind warseeker": "Shardmind",
  "shardmind dominator": "Shardmind",
  "shardmind executioner": "Shardmind",

  // Other specific creatures
  "nagpa corruptor": "Nagpa",
  "swordwing slasher": "Swordwing",
  "swordwing": "Swordwing",
  "crownwing (swordwing)": "Swordwing",
  "cavern choker": "Choker",
  "feygrove choker": "Choker",
  "bloodfire harpy": "Harpy",
  "storm gorgon": "Gorgon",
  "iron gorgon": "Gorgon",
  "savage minotaur": "Minotaur",
  "rime hound (winter wolf)": "Winter wolf",
  "rimefire griffon": "Griffon",
  "liondrake": "Drake",
  "diamondhide xorn": "Xorn",
  "skinwing behemoth": "Behemoth",
  "bloodspike behemoth": "Behemoth",
  "spirehorn behemoth": "Behemoth",
  "dragotha": "Dracolich",
  "chained cambion": "Cambion",
  "slaughterstone slicer": "Golem",
  "slaughterstone eviscerator": "Golem",
  "slaughterstone hammerer": "Golem",
  "battle guardian": "Shield guardian",
  "shadowraven swarm": "Raven",
  "storm shard": "Elemental",
  "storm that walks": "Storm giant",
};

/**
 * Extract candidate wiki page titles from a monster name.
 * Returns multiple candidates in priority order.
 */
function extractBaseCandidates(name, tags) {
  const candidates = [];
  const lower = name.toLowerCase();
  const words = name.split(/\s+/);

  // 0. Check manual mappings for exact full name
  if (MANUAL_WIKI_MAPPINGS[lower]) {
    candidates.push(MANUAL_WIKI_MAPPINGS[lower]);
  }

  // 1. Parenthetical extraction: "Clay Scout (Homunculus)" → "Homunculus"
  const parenMatch = name.match(/\(([^)]+)\)/);
  if (parenMatch) {
    candidates.push(parenMatch[1]);
    const withoutParen = name.replace(/\s*\([^)]+\)/, "").trim();
    candidates.push(withoutParen);
  }

  // 2. Dragon pattern: "[Age] [Color] Dragon [Suffix]" → "[Color] dragon"
  if (tags.includes("Dragon")) {
    for (const color of DRAGON_COLORS) {
      if (lower.includes(color)) {
        candidates.push(`${color.charAt(0).toUpperCase() + color.slice(1)} dragon`);
        break;
      }
    }
    candidates.push("Dragon");
  }

  // 3. Try full name (highest priority for wiki lookup — specific page beats generic)
  const fullName = name.replace(/\s*\([^)]+\)/, "").trim();
  candidates.push(fullName);
  // Also try sentence-case (wiki pages often use "Tomb spider" not "Tomb Spider")
  if (words.length >= 2) {
    const sentenceCase = fullName.charAt(0) + fullName.slice(1).toLowerCase();
    candidates.push(sentenceCase);
  }

  // 4. Strip last word if it's a combat role
  if (words.length >= 2) {
    const lastWord = words[words.length - 1].toLowerCase().replace(/[()]/g, "");
    if (COMBAT_ROLES.has(lastWord)) {
      const base = words.slice(0, -1).join(" ").replace(/\s*\([^)]+\)/, "").trim();
      if (base) {
        candidates.push(base);
        // Sentence case variant
        if (base.includes(" ")) candidates.push(base.charAt(0) + base.slice(1).toLowerCase());
      }
    }
  }

  // 5. Per-word manual mappings (after full name, so specific pages win)
  for (const word of words) {
    const mapped = MANUAL_WIKI_MAPPINGS[word.toLowerCase()];
    if (mapped) candidates.push(mapped);
  }

  // 6. First word (for "Goblin Blackblade" → "Goblin")
  if (words.length >= 2) {
    candidates.push(words[0]);
  }

  // 6b. Last word (for "Spirit Devourer" → "Devourer", "Venom-eye Basilisk" → "Basilisk")
  if (words.length >= 2) {
    const lastWord = words[words.length - 1].replace(/[()]/g, "");
    if (lastWord.length >= 3) candidates.push(lastWord);
  }

  // 6c. Each individual word ≥ 4 chars (for compound names like "Chained Cambion")
  if (words.length >= 2) {
    for (const word of words.slice(1, -1)) {
      const clean = word.replace(/[()]/g, "");
      if (clean.length >= 4) candidates.push(clean);
    }
  }

  // 7. First two words, both Title Case and sentence case
  if (words.length >= 3) {
    const first2 = words.slice(0, 2).join(" ");
    candidates.push(first2);
    candidates.push(first2.charAt(0) + first2.slice(1).toLowerCase());
  }

  // 7b. Last two words
  if (words.length >= 3) {
    const last2 = words.slice(-2).join(" ");
    candidates.push(last2);
    candidates.push(last2.charAt(0) + last2.slice(1).toLowerCase());
  }

  // 7. Tag-based base names
  for (const tag of tags) {
    if (TAG_TO_BASE[tag]) {
      for (const base of TAG_TO_BASE[tag]) {
        candidates.push(base.charAt(0).toUpperCase() + base.slice(1));
      }
    }
    // Generic tag as creature type
    if (!["Humanoid", "Shadow", "Fire", "Cold", "Acid", "Lightning", "Poison"].includes(tag)) {
      candidates.push(tag);
    }
  }

  // Deduplicate while preserving order (case-sensitive — wiki is case-sensitive after first letter)
  const seen = new Set();
  return candidates.filter((c) => {
    if (seen.has(c) || !c || c.length < 2) return false;
    seen.add(c);
    return true;
  });
}

// --- Wiki API ---

// Edition preference: only upgrade to 5e or 3e; keep default otherwise
const EDITION_PREFERENCE = ["5e", "3e"];

// All edition patterns we can detect (including variants like 5eR)
const EDITION_PATTERNS = [
  { edition: "5e", regex: /[-_ ]5e[rR]?[-_.]/i, suffixes: ["5e", "5er"] },
  { edition: "3e", regex: /[-_ ]3e[-_.]/i, suffixes: ["3e"] },
  { edition: "4e", regex: /[-_ ]4e[-_.]/i, suffixes: ["4e"] },
  { edition: "2e", regex: /[-_ ]2e[-_.]/i, suffixes: ["2e"] },
  { edition: "1e", regex: /[-_ ]1e[-_.]/i, suffixes: ["1e"] },
];

async function queryWikiImages(titles) {
  const url = new URL(WIKI_API);
  url.searchParams.set("action", "query");
  url.searchParams.set("titles", titles.join("|"));
  url.searchParams.set("prop", "pageimages|images");
  url.searchParams.set("piprop", "original");
  url.searchParams.set("imlimit", "50");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Wiki API error: ${res.status}`);
  const data = await res.json();

  const results = {};
  for (const page of Object.values(data.query.pages)) {
    const key = page.title.toLowerCase();
    if (page.original?.source) {
      results[key] = {
        defaultUrl: page.original.source,
        imageFiles: (page.images || []).map((img) => img.title),
      };
    }
  }
  return results;
}

/**
 * Detect edition from a filename. Returns normalized edition string or null.
 */
function detectEdition(filename) {
  const lower = filename.toLowerCase();
  for (const pat of EDITION_PATTERNS) {
    if (pat.regex.test(lower)) return pat.edition;
    for (const suffix of pat.suffixes) {
      if (
        lower.endsWith(`${suffix}.jpg`) ||
        lower.endsWith(`${suffix}.png`) ||
        lower.endsWith(`${suffix}.jpeg`)
      ) {
        return pat.edition;
      }
    }
  }
  return null;
}

/**
 * Given a list of File: titles from a wiki page, find the best edition-tagged image.
 * Only looks for 5e and 3e — other editions are not worth overriding the default for.
 */
function pickEditionFile(imageFiles) {
  const contentImages = imageFiles.filter((f) =>
    /\.(jpg|jpeg|png|gif|webp)$/i.test(f)
  );

  for (const edition of EDITION_PREFERENCE) {
    const match = contentImages.find((f) => detectEdition(f) === edition);
    if (match) return match;
  }
  return null;
}

/**
 * Batch-query image URLs from File: titles.
 */
async function queryImageUrls(fileTitles) {
  const results = {};

  for (let i = 0; i < fileTitles.length; i += BATCH_SIZE) {
    const batch = fileTitles.slice(i, i + BATCH_SIZE);
    const url = new URL(WIKI_API);
    url.searchParams.set("action", "query");
    url.searchParams.set("titles", batch.join("|"));
    url.searchParams.set("prop", "imageinfo");
    url.searchParams.set("iiprop", "url");
    url.searchParams.set("format", "json");

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Wiki API error: ${res.status}`);
    const data = await res.json();

    for (const page of Object.values(data.query.pages)) {
      if (page.imageinfo?.[0]?.url) {
        results[page.title] = page.imageinfo[0].url;
      }
    }

    if (i + BATCH_SIZE < fileTitles.length) {
      await sleep(DELAY_MS);
    }
  }

  return results;
}

// --- Main ---

async function main() {
  const monsters = JSON.parse(
    readFileSync(join(ROOT, "src/data/monsters.json"), "utf-8")
  );

  // Existing index (preserve manual entries)
  let existingIndex = [];
  try {
    existingIndex = JSON.parse(
      readFileSync(join(ROOT, "src/data/monsterImageIndex.json"), "utf-8")
    );
  } catch { /* empty */ }
  const existingById = new Map(existingIndex.map((e) => [e.monsterId, e]));

  // Step 1: Extract all unique candidate titles
  console.log("Extracting base creature names...");
  const monsterCandidates = new Map(); // monster.id → candidates[]
  const allCandidates = new Set();

  for (const monster of monsters) {
    const candidates = extractBaseCandidates(monster.name, monster.tags);
    monsterCandidates.set(monster.id, candidates);
    for (const c of candidates) {
      allCandidates.add(c);
    }
  }

  console.log(`  ${monsters.length} monsters → ${allCandidates.size} unique candidate titles`);

  // Step 2: Batch-query wiki for all candidates (pages + image lists)
  console.log("Querying Forgotten Realms Wiki...");
  const candidateArray = [...allCandidates];
  const wikiPages = {}; // lowercased title → { defaultUrl, imageFiles }

  for (let i = 0; i < candidateArray.length; i += BATCH_SIZE) {
    const batch = candidateArray.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(candidateArray.length / BATCH_SIZE);
    process.stdout.write(`  Batch ${batchNum}/${totalBatches} (${batch.length} titles)...`);

    try {
      const results = await queryWikiImages(batch);
      Object.assign(wikiPages, results);
      console.log(` ${Object.keys(results).length} pages found`);
    } catch (err) {
      console.log(` ERROR: ${err.message}`);
    }

    if (i + BATCH_SIZE < candidateArray.length) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`  Total wiki pages with images: ${Object.keys(wikiPages).length}`);

  // Step 2b: Find edition-preferred images for matched pages
  console.log("Resolving edition-preferred images...");
  const editionFileToFetch = new Map(); // File:title → Set of page keys that want it
  const pageEditionFile = {}; // page key → preferred File: title

  for (const [pageKey, pageData] of Object.entries(wikiPages)) {
    const editionFile = pickEditionFile(pageData.imageFiles);
    if (editionFile) {
      pageEditionFile[pageKey] = editionFile;
      if (!editionFileToFetch.has(editionFile)) {
        editionFileToFetch.set(editionFile, new Set());
      }
      editionFileToFetch.get(editionFile).add(pageKey);
    }
  }

  // Batch-fetch URLs for all edition-preferred files
  const editionFileUrls = {};
  const filesToFetch = [...editionFileToFetch.keys()];
  if (filesToFetch.length > 0) {
    console.log(`  Fetching ${filesToFetch.length} edition-specific image URLs...`);
    const urls = await queryImageUrls(filesToFetch);
    Object.assign(editionFileUrls, urls);
    console.log(`  Got ${Object.keys(urls).length} URLs`);
  }

  // Build final image map: page key → best URL
  // Ranking: no edition tag (default) = 0, 5e = 1, 3e = 2, other = 3
  const wikiImages = {}; // lowercased title → best image URL
  let editionUpgrades = 0;

  function editionRank(edition) {
    if (!edition) return 0; // no tag = best (wiki editors' choice)
    if (edition === "5e") return 1;
    if (edition === "3e") return 2;
    return 3; // 4e, 2e, 1e
  }

  for (const [pageKey, pageData] of Object.entries(wikiPages)) {
    const edFile = pageEditionFile[pageKey];
    const edFileUrl = edFile ? editionFileUrls[edFile] : null;

    if (edFileUrl) {
      const defaultMatch = pageData.defaultUrl.match(/images\/[a-f0-9]\/[a-f0-9]{2}\/([^/]+)\//);
      const defaultFilename = defaultMatch ? decodeURIComponent(defaultMatch[1]) : "";
      const defaultRank = editionRank(detectEdition(defaultFilename));
      const upgradeRank = editionRank(detectEdition(edFile));

      if (upgradeRank < defaultRank) {
        wikiImages[pageKey] = edFileUrl;
        editionUpgrades++;
      } else {
        wikiImages[pageKey] = pageData.defaultUrl;
      }
    } else {
      wikiImages[pageKey] = pageData.defaultUrl;
    }
  }

  // Step 3: Resolve best image for each monster
  console.log("Resolving images...");
  const indexEntries = [];
  let matched = 0;
  let unmatched = 0;

  for (const monster of monsters) {
    // Skip if already has a manually curated entry (not auto-scraped)
    const existing = existingById.get(monster.id);
    if (existing && existing.primary && existing.sourceType !== "scraped") {
      indexEntries.push(existing);
      matched++;
      continue;
    }

    const candidates = monsterCandidates.get(monster.id) ?? [];
    let imageUrl = null;
    let matchedCandidate = null;

    for (const candidate of candidates) {
      const url = wikiImages[candidate.toLowerCase()];
      if (url) {
        imageUrl = url;
        matchedCandidate = candidate;
        break;
      }
    }

    if (imageUrl) {
      matched++;
      indexEntries.push({
        monsterId: monster.id,
        name: monster.name,
        normalizedName: normalizeMonsterName(monster.name),
        primary: imageUrl,
        sourceType: "scraped",
        tags: monster.tags,
        _matchedVia: matchedCandidate,
      });
    } else {
      unmatched++;
    }
  }

  // Step 4: Write index
  // Sort by monsterId for stable output
  indexEntries.sort((a, b) => a.monsterId.localeCompare(b.monsterId));

  writeFileSync(
    join(ROOT, "src/data/monsterImageIndex.json"),
    JSON.stringify(indexEntries, null, 2) + "\n"
  );

  console.log(`\nImage Sourcing Report`);
  console.log(`====================`);
  console.log(`Total monsters:     ${monsters.length}`);
  console.log(`With wiki images:   ${matched}`);
  console.log(`Edition-preferred:  ${editionUpgrades} pages upgraded`);
  console.log(`Without images:     ${unmatched}`);
  console.log(`Coverage:           ${((matched / monsters.length) * 100).toFixed(1)}%`);
  console.log(`\nOutput: src/data/monsterImageIndex.json`);

  // Show some unmatched for debugging
  if (unmatched > 0) {
    const unmatchedMonsters = monsters.filter(
      (m) => !indexEntries.some((e) => e.monsterId === m.id)
    );
    console.log(`\nSample unmatched (up to 30):`);
    for (const m of unmatchedMonsters.slice(0, 30)) {
      const cands = monsterCandidates.get(m.id)?.slice(0, 3).join(", ") ?? "none";
      console.log(`  - ${m.name} (tried: ${cands})`);
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
