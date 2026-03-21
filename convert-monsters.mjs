// convert-monsters.mjs
// One-time script to convert full-monster-list.txt into monsters.json
import { readFileSync, writeFileSync, existsSync } from "fs";

const raw = readFileSync("full-monster-list.txt", "utf-8");
const lines = raw.split(/\r?\n/).filter((l) => l.trim());

// Skip header line
const dataLines = lines.slice(1);

// Tag extraction rules: keyword patterns in monster names → tags
const nameTagPatterns = [
  // Creature type from parenthetical
  // Dragon subtypes
  [/\bwhite dragon\b/i, ["Dragon", "Cold"]],
  [/\bblack dragon\b/i, ["Dragon", "Acid"]],
  [/\bblue dragon\b/i, ["Dragon", "Lightning"]],
  [/\bred dragon\b/i, ["Dragon", "Fire"]],
  [/\bgreen dragon\b/i, ["Dragon", "Poison"]],
  [/\bgold dragon\b/i, ["Dragon"]],
  [/\bsilver dragon\b/i, ["Dragon", "Cold"]],
  [/\bcopper dragon\b/i, ["Dragon", "Acid"]],
  [/\bbronze dragon\b/i, ["Dragon", "Lightning"]],
  [/\bbrass dragon\b/i, ["Dragon", "Fire"]],
  [/\biron dragon\b/i, ["Dragon"]],
  [/\badamantine dragon\b/i, ["Dragon"]],
  [/\bcobalt dragon\b/i, ["Dragon"]],
  [/\bmithral dragon\b/i, ["Dragon"]],
  [/\borium dragon\b/i, ["Dragon"]],
  [/\bmercury dragon\b/i, ["Dragon"]],
  [/\bsteel dragon\b/i, ["Dragon"]],
  [/\bbrown dragon\b/i, ["Dragon"]],
  [/\bgray dragon\b/i, ["Dragon"]],
  [/\bpurple dragon\b/i, ["Dragon"]],
  [/\bpact dragon\b/i, ["Dragon"]],
  [/\bblizzard dragon\b/i, ["Dragon", "Cold"]],
  [/\bshadow dragon\b/i, ["Dragon", "Shadow"]],
  [/\bcatastrophic dragon\b/i, ["Dragon", "Elemental"]],
  [/\bplanar dragon\b/i, ["Dragon"]],
  [/\bdragon\b/i, ["Dragon"]],
  [/\bdraconian\b/i, ["Dragon"]],
  [/\bdragonborn\b/i, ["Dragon"]],
  [/\bdrake\b/i, ["Dragon"]],
  [/\bhydra\b/i, ["Dragon"]],
  [/\bwyrmling\b/i, []],  // already caught by dragon patterns
  [/\bwyrm\b/i, []],

  // Undead
  [/\bzombie\b/i, ["Undead"]],
  [/\bskeleton\b/i, ["Undead"]],
  [/\bvampire\b/i, ["Undead"]],
  [/\bwraith\b/i, ["Undead", "Shadow"]],
  [/\bspecter\b/i, ["Undead", "Shadow"]],
  [/\bspectre\b/i, ["Undead", "Shadow"]],
  [/\bghost\b/i, ["Undead", "Shadow"]],
  [/\bbanshee\b/i, ["Undead", "Shadow"]],
  [/\blich\b/i, ["Undead"]],
  [/\bmummy\b/i, ["Undead"]],
  [/\bwight\b/i, ["Undead"]],
  [/\bghoul\b/i, ["Undead"]],
  [/\bdeath knight\b/i, ["Undead"]],
  [/\bnecromancer\b/i, ["Undead"]],
  [/\bbone\b/i, ["Undead"]],
  [/\bgravehound\b/i, ["Undead"]],
  [/\bundead\b/i, ["Undead"]],
  [/\bshadow\b(?!.*dragon)/i, ["Shadow"]],
  [/\bphantom\b/i, ["Undead", "Shadow"]],
  [/\brevenant\b/i, ["Undead"]],
  [/\bdracolich\b/i, ["Undead", "Dragon"]],

  // Demons & Devils
  [/\bdemon\b/i, ["Demon", "Fiend"]],
  [/\bdevil\b/i, ["Devil", "Fiend"]],
  [/\bimp\b/i, ["Devil", "Fiend"]],
  [/\bdretch\b/i, ["Demon", "Fiend"]],
  [/\bsuccubus\b/i, ["Demon", "Fiend"]],
  [/\bincubus\b/i, ["Demon", "Fiend"]],
  [/\bbalor\b/i, ["Demon", "Fiend"]],
  [/\bmarilith\b/i, ["Demon", "Fiend"]],
  [/\bvrock\b/i, ["Demon", "Fiend"]],
  [/\bhezrou\b/i, ["Demon", "Fiend"]],
  [/\bglabrezu\b/i, ["Demon", "Fiend"]],
  [/\bpit fiend\b/i, ["Devil", "Fiend"]],
  [/\bslaad\b/i, ["Elemental"]],
  [/\borcus\b/i, ["Demon", "Fiend", "Undead"]],
  [/\bdemogorgon\b/i, ["Demon", "Fiend"]],
  [/\bjuiblex\b/i, ["Demon", "Fiend"]],
  [/\bzuggtmoy\b/i, ["Demon", "Fiend"]],
  [/\bkostchtchie\b/i, ["Demon", "Fiend", "Cold"]],
  [/\bpazuzu\b/i, ["Demon", "Fiend"]],
  [/\babyssal\b/i, ["Demon", "Fiend"]],
  [/\bfiend\b/i, ["Fiend"]],
  [/\bhell\b/i, ["Fire", "Fiend"]],
  [/\binfernal\b/i, ["Fire", "Fiend"]],

  // Elementals
  [/\bfire\b/i, ["Fire", "Elemental"]],
  [/\bflame\b/i, ["Fire", "Elemental"]],
  [/\blazing\b/i, ["Fire"]],
  [/\bmagma\b/i, ["Fire", "Elemental"]],
  [/\blava\b/i, ["Fire", "Elemental"]],
  [/\bice\b/i, ["Cold"]],
  [/\bfrost\b/i, ["Cold"]],
  [/\bcold\b/i, ["Cold"]],
  [/\bstorm\b/i, ["Lightning"]],
  [/\blightning\b/i, ["Lightning"]],
  [/\bthunder\b/i, ["Lightning"]],
  [/\bearth\b/i, ["Elemental"]],
  [/\bstone\b/i, ["Elemental"]],
  [/\brock\b/i, ["Elemental"]],
  [/\bwater\b/i, ["Elemental"]],
  [/\belemental\b/i, ["Elemental"]],
  [/\bmephit\b/i, ["Elemental"]],
  [/\bsalamander\b/i, ["Fire", "Elemental"]],
  [/\bgargoyle\b/i, ["Elemental"]],
  [/\bgolem\b/i, ["Construct"]],
  [/\bcyclops\b/i, ["Giant"]],
  [/\barchon\b/i, ["Elemental"]],
  [/\bgenasi\b/i, ["Elemental"]],
  [/\befreet\b/i, ["Fire", "Elemental"]],
  [/\bdjinn\b/i, ["Elemental"]],

  // Fey
  [/\bfey\b/i, ["Fey"]],
  [/\bdryad\b/i, ["Fey"]],
  [/\beladrin\b/i, ["Fey"]],
  [/\bsatyr\b/i, ["Fey"]],
  [/\bpixie\b/i, ["Fey"]],
  [/\bsprite\b/i, ["Fey"]],
  [/\bnymph\b/i, ["Fey"]],
  [/\btreant\b/i, ["Fey"]],
  [/\bblink dog\b/i, ["Fey"]],
  [/\bunicorn\b/i, ["Fey"]],
  [/\bwilden\b/i, ["Fey"]],
  [/\bfomorian\b/i, ["Fey", "Giant"]],
  [/\bcyclops\b/i, ["Fey"]],

  // Giants
  [/\bogre\b/i, ["Giant"]],
  [/\btroll\b/i, ["Giant"]],
  [/\bgiant\b/i, ["Giant"]],
  [/\bhill giant\b/i, ["Giant"]],
  [/\bfire giant\b/i, ["Giant", "Fire"]],
  [/\bfrost giant\b/i, ["Giant", "Cold"]],
  [/\bstorm giant\b/i, ["Giant", "Lightning"]],
  [/\bettin\b/i, ["Giant"]],
  [/\bfirbolg\b/i, ["Giant", "Fey"]],
  [/\btitan\b/i, ["Giant"]],

  // Humanoids
  [/\bgoblin\b/i, ["Humanoid", "Goblinoid"]],
  [/\bhobgoblin\b/i, ["Humanoid", "Goblinoid"]],
  [/\bbugbear\b/i, ["Humanoid", "Goblinoid"]],
  [/\bkobold\b/i, ["Humanoid"]],
  [/\borc\b/i, ["Humanoid"]],
  [/\bgnoll\b/i, ["Humanoid"]],
  [/\bdrow\b/i, ["Humanoid", "Shadow"]],
  [/\belf\b/i, ["Humanoid"]],
  [/\bdwarf\b/i, ["Humanoid"]],
  [/\bduergar\b/i, ["Humanoid", "Shadow"]],
  [/\bhalfling\b/i, ["Humanoid"]],
  [/\bhuman\b/i, ["Humanoid"]],
  [/\btiefling\b/i, ["Humanoid", "Fiend"]],
  [/\bdragonborn\b/i, ["Humanoid"]],
  [/\bshadar-kai\b/i, ["Humanoid", "Shadow"]],
  [/\bkenku\b/i, ["Humanoid"]],
  [/\bbullywug\b/i, ["Humanoid"]],
  [/\blizardfolk\b/i, ["Humanoid"]],
  [/\bgnome\b/i, ["Humanoid"]],
  [/\bcentaur\b/i, ["Humanoid"]],
  [/\bminotaur\b/i, ["Humanoid"]],
  [/\bmedusa\b/i, ["Humanoid"]],
  [/\bharpy\b/i, ["Humanoid"]],
  [/\bgithyanki\b/i, ["Humanoid"]],
  [/\bgithzerai\b/i, ["Humanoid"]],
  [/\bkuo-toa\b/i, ["Humanoid"]],
  [/\btroglodyte\b/i, ["Humanoid"]],
  [/\bsahuagin\b/i, ["Humanoid"]],
  [/\bnorker\b/i, ["Humanoid", "Goblinoid"]],
  [/\bxivort\b/i, ["Humanoid", "Shadow", "Fey"]],
  [/\bpriest\b/i, ["Humanoid"]],
  [/\bberserker\b/i, ["Humanoid"]],
  [/\bwarrior\b/i, []],
  [/\bguard\b/i, []],
  [/\bbandit\b/i, ["Humanoid"]],
  [/\bassassin\b/i, ["Humanoid"]],
  [/\bhexer\b/i, []],
  [/\barcher\b/i, []],
  [/\bslinger\b/i, []],

  // Beasts & Vermin
  [/\bspider\b/i, ["Beast"]],
  [/\bwolf\b/i, ["Beast"]],
  [/\bbear\b/i, ["Beast"]],
  [/\brat\b/i, ["Beast"]],
  [/\bbat\b/i, ["Beast"]],
  [/\bscorpion\b/i, ["Beast"]],
  [/\bsnake\b/i, ["Beast"]],
  [/\bserpent\b/i, ["Beast"]],
  [/\bhorse\b/i, ["Beast"]],
  [/\bhawk\b/i, ["Beast"]],
  [/\bbeetle\b/i, ["Beast"]],
  [/\bswarm\b/i, ["Beast"]],
  [/\bwurm\b/i, ["Beast"]],
  [/\bboar\b/i, ["Beast"]],
  [/\bape\b/i, ["Beast"]],
  [/\bcrocodile\b/i, ["Beast"]],
  [/\bfrog\b/i, ["Beast"]],
  [/\bhyena\b/i, ["Beast"]],
  [/\bstirge\b/i, ["Beast"]],
  [/\bkruthik\b/i, ["Beast"]],
  [/\bcave fisher\b/i, ["Beast"]],
  [/\bcarrion crawler\b/i, ["Beast"]],
  [/\bchuul\b/i, ["Beast"]],
  [/\bankheg\b/i, ["Beast"]],

  // Aberrations
  [/\bbeholder\b/i, ["Aberration"]],
  [/\bmind flayer\b/i, ["Aberration"]],
  [/\billithid\b/i, ["Aberration"]],
  [/\baboleth\b/i, ["Aberration"]],
  [/\bfoulspawn\b/i, ["Aberration"]],
  [/\bgibbering\b/i, ["Aberration"]],
  [/\bcloaker\b/i, ["Aberration"]],
  [/\bdestrachan\b/i, ["Aberration"]],
  [/\bgrell\b/i, ["Aberration"]],
  [/\bslaad\b/i, ["Aberration"]],
  [/\bdolgrunt\b/i, ["Aberration"]],
  [/\bdolgaunt\b/i, ["Aberration"]],  
  [/\bdaelkyr\b/i, ["Aberration"]],

  // Constructs
  [/\bconstruct\b/i, ["Construct"]],
  [/\bhomunculus\b/i, ["Construct"]],
  [/\bwarforged\b/i, ["Construct"]],
  [/\biron defender\b/i, ["Construct"]],
  [/\bshield guardian\b/i, ["Construct"]],
  [/\bhelmed horror\b/i, ["Construct"]],

  // Oozes
  [/\booze\b/i, ["Ooze"]],
  [/\bjelly\b/i, ["Ooze"]],
  [/\bslime\b/i, ["Ooze"]],
  [/\bgelatinous\b/i, ["Ooze"]],
  [/\bcube\b/i, []],

  // Miscellaneous
  [/\bangel\b/i, ["Celestial"]],
  [/\bdeva\b/i, ["Celestial"]],
  [/\btiamat\b/i, ["Dragon", "Fiend"]],
  [/\bbahamut\b/i, ["Dragon", "Celestial"]],
  [/\boni\b/i, ["Giant"]],
  [/\bdoppelganger\b/i, ["Shapechanger"]],
  [/\bwerewolf\b/i, ["Shapechanger", "Beast"]],
  [/\bwererat\b/i, ["Shapechanger", "Beast"]],
  [/\blycanthrope\b/i, ["Shapechanger"]],
  [/\bmyconid\b/i, ["Plant"]],
  [/\btreant\b/i, ["Plant"]],
  [/\bshambling\b/i, ["Plant"]],
  [/\bvine\b/i, ["Plant"]],
  [/\bmoss\b/i, ["Plant"]],
  [/\bblight\b/i, ["Plant"]],
  [/\bthorn\b/i, ["Plant"]],
  [/\bboggle\b/i, ["Fey"]],
  [/\bmeazle\b/i, ["Fey"]],
  [/\bquickling\b/i, ["Fey"]],
  [/\bnightwalker\b/i, ["Shadow", "Undead"]],
  [/\bsorrowsworn\b/i, ["Shadow"]],
  [/\bshadowfell\b/i, ["Shadow"]],
  [/\bdark one\b/i, ["Shadow"]],
  [/\btorog\b/i, ["Undead"]],
];

// Also extract parenthetical tags from name: "Dretch (Demon)" → "Demon"
function extractParenTag(name) {
  const match = name.match(/\(([^)]+)\)/);
  return match ? match[1].trim() : null;
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, "") // remove parentheticals
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function deriveTagsFromName(name) {
  const tags = new Set();
  
  // Extract parenthetical as potential tag category
  const parenTag = extractParenTag(name);
  if (parenTag) {
    // Run the parenthetical through tag patterns too
    for (const [pattern, tagList] of nameTagPatterns) {
      if (pattern.test(parenTag)) {
        tagList.forEach((t) => tags.add(t));
      }
    }
  }

  // Run full name through patterns
  for (const [pattern, tagList] of nameTagPatterns) {
    if (pattern.test(name)) {
      tagList.forEach((t) => tags.add(t));
    }
  }

  return [...tags];
}

// Load stat blocks for alignment extraction
let statblockMap = new Map();
if (existsSync("src/data/statblocks.json")) {
  const statblocks = JSON.parse(readFileSync("src/data/statblocks.json", "utf-8"));
  for (const [name, html] of Object.entries(statblocks)) {
    statblockMap.set(name.toLowerCase(), html);
  }
  console.log(`Loaded ${statblockMap.size} stat blocks for alignment extraction`);
}

const ALIGNMENT_NORMALIZE = {
  "unaligned": "Unaligned",
  "evil": "Evil",
  "chaotic evil": "Chaotic Evil",
  "any": "Any",
  "good": "Good",
  "lawful good": "Lawful Good",
};

function extractAlignment(monsterName) {
  const html = statblockMap.get(monsterName.toLowerCase());
  if (!html) return "Unaligned";
  const match = html.match(/<b>Alignment<\/b>\s*([^<]+)/i);
  if (!match) return "Unaligned";
  const raw = match[1].trim().toLowerCase();
  return ALIGNMENT_NORMALIZE[raw] || "Unaligned";
}

const seen = new Set();
const monsters = [];

for (const line of dataLines) {
  const parts = line.split("\t");
  if (parts.length < 7) continue;

  const [name, levelStr, , source, pageStr, rank, baseRole] = parts;
  const level = parseInt(levelStr, 10);
  const page = parseInt(pageStr, 10);

  if (isNaN(level)) continue;

  // Normalize rank
  let normalizedRank = rank.trim();
  if (normalizedRank === "Minion") normalizedRank = "Standard"; // Minions are standard rank in our type system
  // Actually per the types, MonsterRank is "Standard" | "Elite" | "Solo"
  // But Minion is a role. Let me check — in the type system:
  // MonsterRole includes "Minion", MonsterRank is "Standard" | "Elite" | "Solo"
  // So minion monsters have role=Minion and rank=Standard
  
  const validRanks = ["Standard", "Elite", "Solo"];
  if (!validRanks.includes(normalizedRank)) {
    normalizedRank = "Standard";
  }

  const role = baseRole.trim();
  const validRoles = ["Brute", "Soldier", "Skirmisher", "Artillery", "Controller", "Lurker", "Minion"];
  
  // For Minion rank from source, set role to "Minion" 
  let finalRole = role;
  if (rank.trim() === "Minion") {
    finalRole = "Minion";
  }
  if (!validRoles.includes(finalRole)) continue;

  const id = slugify(name);
  
  // Handle duplicate IDs
  let uniqueId = id;
  let suffix = 2;
  while (seen.has(uniqueId)) {
    uniqueId = `${id}-${suffix}`;
    suffix++;
  }
  seen.add(uniqueId);

  const tags = deriveTagsFromName(name);
  const alignment = extractAlignment(name);

  monsters.push({
    id: uniqueId,
    name: name.trim(),
    level,
    role: finalRole,
    rank: normalizedRank,
    source: source.trim(),
    page: isNaN(page) ? 0 : page,
    tags,
    alignment,
  });
}

writeFileSync(
  "src/data/monsters.json",
  JSON.stringify(monsters, null, 2) + "\n"
);

console.log(`Converted ${monsters.length} monsters`);

// Stats
const roleCount = {};
const rankCount = {};
const levelRange = { min: Infinity, max: -Infinity };
const tagCount = {};

for (const m of monsters) {
  roleCount[m.role] = (roleCount[m.role] || 0) + 1;
  rankCount[m.rank] = (rankCount[m.rank] || 0) + 1;
  levelRange.min = Math.min(levelRange.min, m.level);
  levelRange.max = Math.max(levelRange.max, m.level);
  for (const t of m.tags) {
    tagCount[t] = (tagCount[t] || 0) + 1;
  }
}

console.log("\nRoles:", roleCount);
console.log("Ranks:", rankCount);
console.log("Level range:", levelRange);
console.log("\nTop tags:", Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 15));

const alignCount = {};
for (const m of monsters) {
  alignCount[m.alignment] = (alignCount[m.alignment] || 0) + 1;
}
console.log("Alignments:", alignCount);
