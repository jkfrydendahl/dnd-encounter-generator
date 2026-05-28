/**
 * DND Encounter Generator for Interactive Battlemaps (Mini-Driven)
 *
 * Core principle: every monster slot is backed by a specific mini figure
 * with enough quantity. Minis provide identity, monsters.json provides stats.
 *
 * Usage: node generate-encounters.mjs
 * Output: encounters-output.txt + encounters-table-of-contents.xlsx
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import XLSX from "xlsx";

// ─── Data Loading ────────────────────────────────────────────────────────────

const GENERATOR_PATH = "../src/data";

const monsters = JSON.parse(readFileSync(join(GENERATOR_PATH, "monsters.json"), "utf8"));
const environments = JSON.parse(readFileSync(join(GENERATOR_PATH, "environments.json"), "utf8"));
const terrainOptions = JSON.parse(readFileSync(join(GENERATOR_PATH, "terrain.json"), "utf8"));
const templates = JSON.parse(readFileSync(join(GENERATOR_PATH, "templates.json"), "utf8"));

const battlemapsRaw = readFileSync("battlemaps.txt", "utf8").trim().split(/\r?\n/);
const enemiesRaw = readFileSync("enemies.txt", "utf8").trim().split(/\r?\n/);

// ─── Parse Battlemaps ────────────────────────────────────────────────────────

const battlemaps = battlemapsRaw.map((line) => {
  const match = line.match(/^\d+\.\s*(.+)$/);
  return match ? match[1].trim() : line.trim();
}).filter((b) => b && !b.startsWith("S/") &&
  !b.startsWith("Curse of Strahd") &&
  !b.startsWith("Dragonlance") &&
  !b.startsWith("Lost Mines of Phandelver") &&
  !b.startsWith("Phandelver and below") &&
  !b.startsWith("Vecna"));

// ─── Parse Mini Figures ──────────────────────────────────────────────────────

const TERRAIN_COLS = [
  "Arctic", "Caves", "Coastal", "Desert", "Fiery", "Forest",
  "Grassland", "Hill", "Mountain", "Ocean", "Swamp", "Underdark", "Underwater", "Urban"
];

// ─── Excluded Minis (player characters, NPCs, objects — not real monsters) ───

const EXCLUDED_MINIS = new Set([
  "Time Portal",
  "Peter Bo", "Matt Jones", "Danny Lanone", "Alejandro", "Eleanore",
  "Jeanne Du Tonnerre", "Jeanne Byrne", "Eve Fargrace Pose 2",
  "King Arthur VII, the Unwavering", "Roldan Frostgrief",
  "Cormah Shasan", "Okesh The Proud", "Sanjay the Shadow", "Bayul Greytusk",
  "Levisteus Caniatus", "Taes of the Frozen Tundra", "Panshaw Ajax Fighter",
  "Ashgex", "Argenturam", "Qydon", "Kallista Everun",
  "Devastr Scorch", "Jade Song", "Hendrik Greenhilt", "Boris Pummeler",
  "Saevel Sylharice", "Niman Lighthammer",
  "The Unstoppable Angus", "Solo Act Olov", "The Sharpshooter Chiara",
  "Maximus, Merciless Gladiator", "Rhys, the Burnt Fighter", "Vanchu Hellrider",
  "Gorok, the Deadeye", "Herkas Oaksword", "Satrix Wildshine",
  "Uten Ironhearth", "Galjin", "Goober", "Brom Tricksleeves", "Buffo",
  "Igan Galanodel", "Sila", "Dwarf Monk 2", "Knight Supplicant Quinn",
  "Cliph Aphma", "Cliph Terothna", "Gardain", "GoldenHorn", "Nortle",
  "Garver Mosshands", "Abras Eleram", "Azure Riverbend",
  "Bratuk, StandingMountain",
  "Gold", "Eililys, Master Herbologist", "Gorya, the Berserker",
  "Isolde Daelyn", "Priya Flamestar", "Banzan Hill",
  "Cormah Shasan 4", "Meranda Stoneroar", "Rorir Cavalieri",
  "Athos, Charming Scoundrel", "Bran Tamran",
  "ArmoredWarrior_SwordDoubleHanded",
]);

function parseMinis(lines) {
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("\t");
    if (!cols[0]) continue;
    const name = cols[0].trim();
    if (EXCLUDED_MINIS.has(name)) continue;
    const race = cols[1]?.trim() || "";
    const classField = cols[2]?.trim() || "";
    const type = cols[3]?.trim() || "";
    const cr = parseFloat((cols[4]?.trim() || "0").replace(",", ".")) || 0;
    const quantity = parseInt(cols[5]?.trim()) || 1;
    const terrains = [];
    for (let t = 0; t < TERRAIN_COLS.length; t++) {
      if (cols[6 + t]?.trim() === "1") terrains.push(TERRAIN_COLS[t]);
    }
    // Include if has type OR has a manual override defined
    if (type || MINI_MONSTER_OVERRIDES[name]) {
      result.push({ name, race, class: classField, type: type || inferType(name), cr, quantity, terrains });
    }
  }
  return result;
}

// Infer type for minis without explicit type based on their override targets
function inferType(name) {
  const overrides = MINI_MONSTER_OVERRIDES[name];
  if (!overrides) return "Humanoid";
  // Look at what monsters they map to and infer
  const ln = name.toLowerCase();
  if (ln.includes("skeleton") || ln.includes("zombie") || ln.includes("ghoul") || ln.includes("ghost") || ln.includes("wraith") || ln.includes("undead")) return "Undead";
  if (ln.includes("demon") || ln.includes("devil") || ln.includes("fiend") || ln.includes("hell")) return "Fiend";
  if (ln.includes("goblin") || ln.includes("hobgoblin") || ln.includes("bugbear")) return "Goblinoid";
  if (ln.includes("dragon") || ln.includes("drake")) return "Dragon";
  if (ln.includes("wolf") || ln.includes("spider") || ln.includes("rat") || ln.includes("naga") || ln.includes("scorpion")) return "Beast";
  if (ln.includes("angel") || ln.includes("solar") || ln.includes("celestial")) return "Celestial";
  if (ln.includes("orc")) return "Humanoid";
  if (ln.includes("giant") || ln.includes("cyclops") || ln.includes("ogre")) return "Giant";
  if (ln.includes("elemental") || ln.includes("fire") || ln.includes("ice") || ln.includes("lava")) return "Elemental";
  if (ln.includes("pirate") || ln.includes("bandit") || ln.includes("rogue") || ln.includes("fighter") || ln.includes("warrior")) return "Humanoid";
  if (ln.includes("golem")) return "Construct";
  if (ln.includes("fey") || ln.includes("nymph")) return "Fey";
  return "Humanoid";
}

// Minis are parsed after MINI_MONSTER_OVERRIDES is defined (see below)

// ─── Type/Tag Mappings ───────────────────────────────────────────────────────

const TYPE_TO_TAGS = {
  "Undead": ["Undead", "Shadow"],
  "Fiend": ["Fiend", "Demon"],
  "Beast": ["Beast"],
  "Monstrosity": ["Beast", "Aberration"],
  "Goblinoid": ["Goblinoid", "Humanoid"],
  "Monstrous Humanoid": ["Humanoid", "Giant"],
  "Dragon": ["Dragon"],
  "Humanoid": ["Humanoid"],
  "Giant": ["Giant"],
  "Celestial": ["Celestial"],
  "Elemental": ["Elemental", "Fire", "Cold", "Lightning"],
  "Fey or Humanoid": ["Fey", "Humanoid"],
  "Humanoid or Fey": ["Fey", "Humanoid"],
  "Humanoid or Aberration": ["Aberration", "Humanoid"],
  "Aberration or Monstrosity": ["Aberration"],
  "Aberration": ["Aberration"],
  "Fiend or Giant": ["Fiend", "Giant"],
  "Beast or Elemental": ["Beast", "Elemental"],
  "Elemental or Fiend": ["Elemental", "Fiend"],
  "Construct": ["Construct", "Humanoid"],
  "Fey": ["Fey", "Plant"],
};

// Which environments each creature type can appear in (beyond tag matching)
const TYPE_ALLOWED_ENVS = {
  "Undead": ["shadowfell", "underground", "swamp", "urban", "desert", "mountain", "forest"],
  "Fiend": ["elemental-chaos", "underground", "shadowfell", "urban", "desert"],
  "Goblinoid": ["underground", "forest", "mountain", "plains", "urban", "swamp"],
  "Humanoid": ["urban", "underground", "plains", "forest", "mountain", "desert", "swamp", "arctic", "aquatic"],
  "Monstrous Humanoid": ["underground", "mountain", "forest", "plains", "urban", "swamp"],
  "Dragon": ["mountain", "underground", "forest", "desert", "arctic", "elemental-chaos"],
  "Giant": ["mountain", "underground", "forest", "plains", "arctic"],
  "Celestial": ["plains", "mountain", "feywild", "urban", "forest"],
  "Beast": ["forest", "plains", "mountain", "swamp", "arctic", "aquatic", "underground"],
  "Monstrosity": ["underground", "mountain", "forest", "swamp", "desert"],
  "Elemental": ["elemental-chaos", "mountain", "underground", "desert", "arctic"],
  "Fey": ["feywild", "forest", "swamp", "plains"],
  "Fey or Humanoid": ["feywild", "forest", "swamp", "plains", "urban"],
  "Humanoid or Fey": ["feywild", "forest", "swamp", "plains", "urban"],
  "Construct": ["underground", "urban", "mountain", "desert"],
  "Aberration": ["underground", "shadowfell", "aquatic", "swamp"],
  "Humanoid or Aberration": ["underground", "shadowfell", "aquatic", "swamp", "urban"],
  "Aberration or Monstrosity": ["underground", "shadowfell", "aquatic", "swamp"],
  "Beast or Elemental": ["forest", "plains", "mountain", "elemental-chaos", "swamp"],
  "Elemental or Fiend": ["elemental-chaos", "underground", "mountain", "desert"],
  "Fiend or Giant": ["elemental-chaos", "underground", "mountain"],
};

const BATTLEMAP_TO_ENV = {
  "Arctic": "arctic",
  "Cave": "underground",
  "Desert": "desert",
  "Dungeon": "underground",
  "Hell": "elemental-chaos",
  "Mountain": "mountain",
  "Ocean": "aquatic",
  "Rivers, Rapids": "aquatic",
  "Rivers": "aquatic",
  "Tavern": "urban",
  "Underdark": "underground",
  "Urban": "urban",
  "Village": "urban",
  "Wilderness": "forest",
};

const MINI_TERRAIN_TO_ENV = {
  "Arctic": ["arctic"],
  "Caves": ["underground"],
  "Coastal": ["aquatic"],
  "Desert": ["desert"],
  "Fiery": ["elemental-chaos"],
  "Forest": ["forest", "feywild"],
  "Grassland": ["plains"],
  "Hill": ["plains", "mountain"],
  "Mountain": ["mountain"],
  "Ocean": ["aquatic"],
  "Swamp": ["swamp"],
  "Underdark": ["underground"],
  "Underwater": ["aquatic"],
  "Urban": ["urban"],
};

function getEnvironmentsForBattlemap(mapPath) {
  const category = mapPath.split("/")[0];
  const primary = BATTLEMAP_TO_ENV[category] || "forest";
  const lowerMap = mapPath.toLowerCase();

  // Determine primary env from keywords
  let envId = primary;
  if (lowerMap.includes("lava") || lowerMap.includes("fiery") || lowerMap.includes("magma")) envId = "elemental-chaos";
  else if (lowerMap.includes("graveyard") || lowerMap.includes("crypt") || lowerMap.includes("mausoleum") || lowerMap.includes("tomb")) envId = "shadowfell";
  else if (lowerMap.includes("styx") || lowerMap.includes("avernus")) envId = "elemental-chaos";
  else if (lowerMap.includes("swamp") || lowerMap.includes("fetid")) envId = "swamp";
  else if (lowerMap.includes("spider") || lowerMap.includes("spidergod")) envId = "underground";
  else if (lowerMap.includes("shadowfell") || lowerMap.includes("shadow")) envId = "shadowfell";
  else if (lowerMap.includes("feywild") || lowerMap.includes("fey") || lowerMap.includes("misty")) envId = "feywild";
  else if (lowerMap.includes("goblin")) envId = "underground";
  else if (lowerMap.includes("jungle") || lowerMap.includes("mirkwood") || lowerMap.includes("tree") || lowerMap.includes("woods") || lowerMap.includes("forest")) envId = "forest";
  else if (lowerMap.includes("pyramid") || lowerMap.includes("sand")) envId = "desert";
  else if (lowerMap.includes("grassland") || lowerMap.includes("meadow")) envId = "plains";

  // Build fallback list: primary, then related envs
  const RELATED_ENVS = {
    "aquatic": ["swamp", "forest", "plains"],
    "swamp": ["forest", "aquatic", "shadowfell"],
    "forest": ["feywild", "plains", "swamp"],
    "plains": ["forest", "mountain", "urban"],
    "feywild": ["forest", "swamp", "plains"],
    "shadowfell": ["underground", "swamp", "urban"],
    "mountain": ["underground", "arctic", "plains"],
    "arctic": ["mountain", "plains"],
    "underground": ["shadowfell", "mountain", "urban"],
    "urban": ["underground", "plains", "forest"],
    "desert": ["plains", "elemental-chaos", "mountain"],
    "elemental-chaos": ["underground", "mountain", "desert"],
  };

  const envList = [envId];
  if (envId !== primary && !envList.includes(primary)) envList.push(primary);
  for (const rel of (RELATED_ENVS[envId] || [])) {
    if (!envList.includes(rel)) envList.push(rel);
  }
  return envList;
}

// ─── Mini → Monster Mapping ──────────────────────────────────────────────────

// Manual overrides for minis that need explicit mapping
const MINI_MONSTER_OVERRIDES = {
  // Undead - Skeletons
  "Skeleton Archer": ["blazing-skeleton", "boneshard-skeleton", "dread-archer", "corruption-corpse"],
  "Skeleton Executioner": ["boneshard-skeleton", "wight", "battle-wight", "phantom-warrior"],
  "Skeleton Warrior": ["boneshard-skeleton", "wight", "chillborn-zombie", "phantom-warrior", "battle-wight"],
  "Skeleton Pirate": ["blazing-skeleton", "boneshard-skeleton", "chillborn-zombie"],
  "Barbarian Skeleton": ["boneshard-skeleton", "wight", "mummy-guardian", "battle-wight"],
  "Skeleton Mage": ["deathlock-wight", "lich", "deathpriest-of-orcus", "mad-wraith"],
  "Skeleton Wolf": ["rotwing-zombie", "boneshard-skeleton", "wraith", "shadow-hound", "dire-wolf", "mad-wraith"],
  "Reanimated Ranger": ["dread-archer", "blazing-skeleton", "deathlock-wight", "crimson-acolyte"],
  "Reanimated Dwarven Fighter": ["boneshard-skeleton", "wight", "chillborn-zombie", "battle-wight"],
  // Undead - Zombies
  "Big Zombie": ["zombie-hulk", "corruption-corpse", "chillborn-zombie", "mummy-guardian", "mad-wraith", "blazing-skeleton", "rot-grub-zombie"],
  "Bugbear Zombie": ["zombie-hulk", "corruption-corpse", "chillborn-zombie", "rot-grub-zombie"],
  "Cleaver Zombie": ["zombie-hulk", "corruption-corpse", "chillborn-zombie", "mummy-guardian", "mad-wraith", "blazing-skeleton", "rot-grub-zombie"],
  "Zombie Man": ["chillborn-zombie", "corruption-corpse", "zombie-hulk", "rot-grub-zombie", "mad-wraith", "blazing-skeleton"],
  "Zombie Woman": ["chillborn-zombie", "corruption-corpse", "zombie-hulk", "mad-wraith", "blazing-skeleton"],
  "Ettin Zombie": ["zombie-hulk", "mummy-guardian", "rot-grub-zombie", "bone-crown-behemoth"],
  "Risen Funghi": ["corruption-corpse", "chillborn-zombie", "rot-grub-zombie"],
  // Undead - Ghouls/Ghosts/Wraiths
  "Ghoul 1": ["ghast", "wight", "wraith", "crimson-acolyte", "mummy-guardian", "mad-wraith", "blazing-skeleton", "chillborn-zombie"],
  "Ghoul 2": ["ghast", "wight", "wraith", "crimson-acolyte", "rot-grub-zombie"],
  "Ghost of Brienne Crimson": ["trap-haunt", "mad-wraith", "specter", "wailing-ghost"],
  "Will-O-Wisp": ["specter", "wraith", "mad-wraith", "trap-haunt"],
  "Shadow 1": ["shadow-hound", "mad-wraith", "wraith", "specter"],
  "Shadow 2": ["shadow-hound", "mad-wraith", "wraith", "specter"],
  "Malaphar, the Deathbringer": ["deathlock-wight", "lich", "deathpriest-of-orcus", "mad-wraith"],
  "Death Knight": ["death-knight", "boneclaw", "battle-wight", "battle-wight-commander"],
  "Grave Scavenger": ["ghast", "corruption-corpse", "wight", "rot-grub-zombie"],
  // Fiends/Demons
  "Pit Fiend": ["glabrezu", "immolith", "cambion-hellsword"],
  "Erinyes": ["cambion-hellsword", "cambion-wrathborn"],
  "Hell Knight": ["cambion-hellsword", "cambion-wrathborn", "chained-cambion"],
  "Bearded Devil": ["evistro", "barlgura"],
  "Chain Devil": ["guardian-demon-abomination", "demon-spawn-adept", "chained-cambion"],
  "Lesser Marilith": ["evistro", "lesser-fire-demon", "barlgura"],
  "Prince of the Void": ["glabrezu", "immolith", "barlgura"],
  "Shadow Mastiff": ["shadow-hound", "evistro"],
  // Goblinoids
  "Dog Rider": ["goblin-underboss", "bugbear-warrior", "bugbear-strangler", "hobgoblin-commander"],
  "Goblin Archer": ["goblin-sharpshooter", "goblin-underboss", "hobgoblin-archer", "bugbear-strangler"],
  "Goblin Warrior": ["goblin-skullcleaver", "goblin-underboss", "bugbear-warrior", "hobgoblin-commander"],
  "Goblin Shaman": ["goblin-cursespewer", "goblin-hexer", "goblin-underboss", "orc-eye-of-gruumsh"],
  "Goblin Blacksmith": ["goblin-skullcleaver", "hobgoblin-commander", "bugbear-warrior"],
  "Goblin Fighter": ["goblin-skullcleaver", "bugbear-warrior", "hobgoblin-commander"],
  "Nilbog": ["goblin-cursespewer", "goblin-hexer", "goblin-underboss"],
  "Slugor Goblin King": ["hobgoblin-hand-of-bane", "bugbear-warrior"],
  "Bugbear Gladiator": ["bugbear-warrior", "bugbear-strangler"],
  "Bugbear Assassin": ["bugbear-strangler", "bugbear-warrior"],
  "Hobgoblin Ranger 01": ["hobgoblin-commander", "hobgoblin-archer", "bugbear-strangler"],
  "Hobgoblin Ranger 02": ["hobgoblin-commander", "hobgoblin-archer", "bugbear-strangler"],
  "Hobgoblin Berserker": ["bugbear-warrior", "hobgoblin-hand-of-bane"],
  // Werewolves/Shapechangers
  "Loup Garou": ["werewolf", "werewolf-lord"],
  "Werewolf": ["werewolf", "werewolf-lord"],
  "Wild Werewolf": ["werewolf", "werewolf-lord"],
  "Werebear": ["werewolf", "dire-boar", "dire-wolf"],
  "Weretiger": ["werewolf", "displacer-beast"],
  "Wererhino": ["werewolf", "dire-boar"],
  // Beasts/Monstrosities
  "Barghest": ["barghest-savager", "shadow-hound", "dire-wolf", "carrion-crawler", "bloodweb-spider-swarm"],
  "Chimera": ["chimera", "manticore", "owlbear", "dire-bear", "cacklefiend-hyena", "cave-bear", "winterclaw-owlbear"],
  "Owlbear": ["owlbear", "winterclaw-owlbear", "cave-bear", "cacklefiend-hyena", "carrion-crawler", "dire-wolf", "feymire-crocodile", "crushgrip-constrictor"],
  "Manticore": ["manticore", "dire-boar", "cave-bear", "cacklefiend-hyena"],
  "Mantisman": ["kruthik-adult", "deathjump-spider", "kruthik-hive-lord"],
  "Ravenous Bulette": ["bulette", "blade-spider"],
  "Wendigo": ["foulspawn-mangler", "foulspawn-grue", "foulspawn-wretch"],
  "Wendigo Horror": ["foulspawn-mangler", "foulspawn-grue", "foulspawn-wretch"],
  "Crocodile": ["visejaw-crocodile", "dire-boar", "feymire-crocodile"],
  "Monstrous Scorpion": ["deathjump-spider", "kruthik-adult", "blade-spider"],
  "Giant Spider": ["deathjump-spider", "cave-stirge-swarm", "bloodweb-spider-swarm", "blade-spider"],
  "Lion": ["dire-wolf", "rage-drake", "cave-bear", "cacklefiend-hyena", "carrion-crawler", "tangler-beetle", "bloodweb-spider-swarm"],
  "White Wolf": ["dire-wolf", "winter-wolf", "shadow-hound"],
  "Wolf Action": ["dire-wolf", "shadow-hound", "cave-bear"],
  "Wolf Casual": ["dire-wolf", "shadow-hound"],
  "Pack of Rats": ["rat-swarm", "rot-grub-swarm", "centipede-swarm", "needlefang-drake-swarm", "dire-rat"],
  "Bone Naga": ["crushgrip-constrictor", "guardian-naga", "flame-snake"],
  // Dinosaurs
  "Triceratops": ["spirehorn-behemoth", "dire-boar", "dire-bear", "bloodspike-behemoth", "cave-bear", "feymire-crocodile", "crushgrip-constrictor", "thunderfury-boar"],
  // Dragons
  "Alphariox, Dragon Forebearer": ["young-green-dragon", "young-red-dragon", "rage-drake"],
  "Eyegouger Guardian Drake": ["rage-drake", "spiretop-drake", "young-green-dragon", "ambush-drake", "scytheclaw-drake", "bloodseeker-drake"],
  "Turill": ["young-green-dragon", "rage-drake", "ambush-drake", "scytheclaw-drake", "spitting-drake"],
  "Mohrg": ["ghast", "mummy-guardian", "wight", "wraith", "mad-wraith", "blazing-skeleton", "chillborn-zombie"],
  "Jimmy Hollowhead": ["foulspawn-mangler", "foulspawn-grue", "carrion-crawler", "owlbear", "cacklefiend-hyena"],
  "Rulph": ["dire-wolf", "dire-boar", "cave-bear", "cacklefiend-hyena", "carrion-crawler", "tangler-beetle"],
  "The Head Hunter": ["doppelganger-assassin", "bugbear-strangler", "tiefling-darkblade", "shadar-kai-warrior", "human-berserker"],
  "Usgrit Dragonslayer": ["dragonborn-gladiator", "human-berserker", "minotaur-warrior", "orc-bloodrager"],
  "Headsplitter": ["orc-bloodrager", "orc-berserker", "human-berserker", "minotaur-warrior", "bugbear-warrior"],
  "Beast": ["dire-wolf", "dire-boar", "cave-bear", "rage-drake", "owlbear", "cacklefiend-hyena"],
  "Faustus Avatar of Pride": ["barlgura", "demon-spawn-adept", "lesser-fire-demon", "chained-cambion", "deathpriest-of-orcus"],
  "Shadow Binder": ["hobgoblin-commander", "hobgoblin-hand-of-bane", "bugbear-strangler", "bugbear-warrior", "shadar-kai-witch"],
  "Mezlcoatl": ["crushgrip-constrictor", "flame-snake", "couatl-star-serpent", "guardian-naga", "deathrattle-viper"],
  "Archangel Azazel": ["deva-knight-errant", "deva-zealot", "dragonborn-fire-adept", "human-pirate-captain"],
  "Lava Horror": ["magma-hurler", "magma-claw", "magma-strider"],
  "Smoke Elemental Unicorn": ["magma-hurler", "magma-claw", "fire-bat"],
  // Aquatic
  "Male Merrow": ["sahuagin-raider", "sahuagin-baron", "kuo-toa-marauder"],
  "Octus": ["kuo-toa-marauder", "kuo-toa-spearfiend", "sahuagin-priest"],
  "Darkray": ["sahuagin-raider", "kuo-toa-marauder"],
  // Pirates/Humanoids
  "Cannon Pirate": ["human-pirate-captain", "human-berserker", "human-bandit"],
  "Pirate Scout": ["human-pirate-captain", "doppelganger-assassin"],
  "Eleanore": ["human-pirate-captain", "human-bandit"],
  "Jeanne Du Tonnerre": ["human-pirate-captain", "human-berserker"],
  "Matt Jones": ["human-pirate-captain", "human-bandit"],
  // Named humanoid fighters/warriors
  "Panshaw Ajax Fighter": ["dragonborn-gladiator", "human-berserker"],
  "Retiarius Gladiator": ["dragonborn-gladiator", "minotaur-warrior"],
  "Maximus, Merciless Gladiator": ["dragonborn-gladiator", "minotaur-warrior", "human-berserker"],
  "Rhys, the Burnt Fighter": ["human-berserker", "dragonborn-gladiator"],
  "Vanchu Spinebreaker Expedition to the Underworld": ["sahuagin-baron", "minotaur-warrior", "orc-bloodrager"],
  "Vanchu Hellrider": ["dragonborn-gladiator", "cambion-hellsword"],
  "The Unstoppable Angus": ["orc-bloodrager", "human-berserker", "minotaur-warrior"],
  "Gorya, the Berserker": ["human-berserker", "orc-bloodrager", "orc-berserker"],
  "Half Orc Brute": ["orc-bloodrager", "orc-eye-of-gruumsh", "human-berserker"],
  "Orc Warrior – Male": ["orc-eye-of-gruumsh", "orc-bloodrager", "orc-berserker"],
  // Rogues/Assassins
  "Sanjay the Shadow": ["doppelganger-assassin", "shadar-kai-warrior", "tiefling-darkblade"],
  "Skulking Rogue": ["doppelganger-assassin", "shadar-kai-warrior"],
  "Soft Dagger": ["doppelganger-assassin", "shadar-kai-warrior"],
  // Archers/Rangers
  "Gorok, the Deadeye": ["hobgoblin-archer", "goblin-sharpshooter", "skeleton-archer"],
  "The Sharpshooter Chiara": ["hobgoblin-archer", "goblin-sharpshooter"],
  "Solo Act Olov": ["human-pirate-captain", "hobgoblin-archer"],
  // Mages/Casters
  "Levisteus Caniatus": ["lich", "deathlock-wight"],
  "Zendel Coldheart, the Ice Queen": ["shadar-kai-witch", "lich"],
  "Priya Flamestar": ["tiefling-heretic", "fire-lord-cultist"],
  "Cadriel Burning Light": ["tiefling-heretic", "fire-lord-cultist", "deva-knight-errant"],
  "Jade Song": ["shadar-kai-witch", "gnome-wolverine"],
  "Oliver, Illusionist Apprentice": ["gnome-wolverine", "shadar-kai-witch"],
  // Giants/Large creatures
  "Cyclops": ["cyclops-impaler", "cyclops-crusher", "ogre-warhulk"],
  "Oni Brute": ["ogre-warhulk", "ettin-marauder", "orc-bloodrager", "minotaur-warrior", "dire-boar", "dire-bear", "cave-bear"],
  "Bratuk, StandingMountain": ["ogre-warhulk", "ettin-marauder"],
  // Angels/Celestials
  "Bright-Winged Angel": ["deva-knight-errant", "deva-zealot"],
  "Morningstar Angel": ["deva-zealot", "deva-knight-errant"],
  "Solar Free": ["deva-zealot", "deva-knight-errant"],
  "Solar Prisoner": ["deva-knight-errant", "deva-zealot"],
  // Misc named minis → best fit monster
  "Cat Folk": ["gnome-wolverine", "displacer-beast"],
  "Gnome Crossbowman": ["gnome-wolverine", "hobgoblin-archer"],
  "Boitata, Fire Snake": ["flame-snake", "magma-hurler", "lesser-fire-demon"],
  "Rainbow Hawk": ["spiretop-drake", "stirge", "fire-bat"],
  "Nymph": ["dryad", "greenscale-marsh-mystic"],
  "Izat'al, human form": ["human-pirate-captain", "doppelganger-assassin"],
  "Acoria Nakar": ["sahuagin-baron", "human-pirate-captain"],
  "Danny Lanone": ["human-berserker", "human-pirate-captain"],
  "Roldan Frostgrief": ["shadar-kai-warrior", "shadar-kai-witch"],
  "Cormah Shasan": ["doppelganger-assassin", "shadar-kai-warrior"],
  "Cormah Shasan 4": ["doppelganger-assassin", "shadar-kai-warrior"],
  "Clay Golem": ["iron-golem", "shield-guardian", "iron-cobra"],
  "Devastr Scorch": ["fire-lord-cultist", "servant-of-the-fire-lord", "cambion-hellsword"],
  "Mania, Lady of Desire": ["doppelganger-assassin", "shadar-kai-witch"],
  "Smiling Debra the Cruel": ["doppelganger-assassin", "human-pirate-captain"],
  "Aunty Gremeth EverYouth": ["shadar-kai-witch", "dryad"],
  "Hendrik Greenhilt": ["human-berserker", "dragonborn-gladiator"],
  "Boris Pummeler": ["orc-bloodrager", "orc-berserker", "human-berserker"],
  "Banzan Hill": ["ogre-warhulk", "ettin-marauder"],

  // Dinosaurs — mapped to large beasts and behemoths
  "Triceratops Saddle": ["spirehorn-behemoth", "dire-bear", "bloodspike-behemoth", "feymire-crocodile", "thunderfury-boar"],
  "Tyrannosaurus": ["fang-titan-drake", "dire-bear", "spirehorn-behemoth", "thunderfury-boar"],
  "Ankylosaurus": ["bloodspike-behemoth", "dire-boar", "bone-crown-behemoth", "cave-bear"],
  "Velociraptor": ["rage-drake", "deathjump-spider", "ambush-drake", "scytheclaw-drake"],
  "Ancient Raptor": ["scytheclaw-drake", "ambush-drake-packleader", "vulture-drake", "dire-wolf"],
  "Dilophosaurus": ["rage-drake", "ambush-drake", "spitting-drake", "cacklefiend-hyena"],
  "Eoraptor Cluster": ["needlefang-drake-swarm", "rat-swarm", "rot-grub-swarm", "centipede-swarm", "cave-fisher-spawn", "hoard-scarab-larva-swarm", "rot-scarab-swarm", "bloodweb-spider-swarm"],
  "Parasaurolophus Saddle": ["skinwing-behemoth", "dire-boar", "cave-bear", "thunderfury-boar"],
  "Pterodactyl": ["vulture-drake", "ambush-drake", "skinwing-behemoth", "spiretop-drake"],
};

// Parse minis AFTER overrides are defined (so inferType can reference them)
const minis = parseMinis(enemiesRaw);

function getKeywords(name) {
  return name.toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 2 && !["the", "and", "of", "for", "pose"].includes(w));
}

function miniMonsterMatchScore(mini, monster) {
  const miniTags = TYPE_TO_TAGS[mini.type] || [];
  if (!monster.tags.some(t => miniTags.includes(t))) return -1;

  let score = 10;
  const mn = mini.name.toLowerCase();
  const mon = monster.name.toLowerCase();

  // Creature type keyword matches
  const creatureKWs = [
    "skeleton", "zombie", "ghoul", "ghost", "wraith", "wight", "lich",
    "goblin", "hobgoblin", "bugbear", "orc", "kobold",
    "spider", "dragon", "drake", "demon", "devil", "fiend",
    "ogre", "troll", "giant", "cyclops", "ettin",
    "wolf", "bear", "boar", "rat", "snake", "scorpion", "bat",
    "golem", "elemental", "angel", "naga", "oni",
    "werewolf", "vampire", "mummy", "specter", "banshee",
  ];

  for (const kw of creatureKWs) {
    if (mn.includes(kw) && mon.includes(kw)) { score += 40; break; }
  }

  // General word overlap
  const miniWords = getKeywords(mini.name);
  const monsterWords = getKeywords(monster.name);
  for (const w of miniWords) {
    for (const mw of monsterWords) {
      if (w === mw) score += 25;
      else if (w.length > 3 && (mw.includes(w) || w.includes(mw))) score += 15;
    }
  }

  // Class/role alignment
  if (mini.class) {
    const cl = mini.class.toLowerCase();
    if ((cl.includes("archer") || cl.includes("ranger")) && (monster.role === "Artillery" || mon.includes("archer"))) score += 15;
    if ((cl.includes("warrior") || cl.includes("fighter") || cl.includes("soldier")) && (monster.role === "Soldier" || monster.role === "Brute")) score += 10;
    if ((cl.includes("wizard") || cl.includes("mage") || cl.includes("sorcerer") || cl.includes("warlock")) && (monster.role === "Controller" || monster.role === "Artillery")) score += 15;
    if (cl.includes("barbarian") && monster.role === "Brute") score += 10;
    if ((cl.includes("rogue") || cl.includes("assassin")) && (monster.role === "Lurker" || monster.role === "Skirmisher")) score += 10;
  }

  return score;
}

/**
 * Build the complete mini→monster mapping at startup.
 */
function buildMiniMonsterMapping() {
  const mapping = new Map();

  for (const mini of minis) {
    // Manual overrides first
    if (MINI_MONSTER_OVERRIDES[mini.name]) {
      const ids = MINI_MONSTER_OVERRIDES[mini.name];
      const found = monsters.filter(m => ids.includes(m.id));
      if (found.length > 0) { mapping.set(mini, found); continue; }
    }

    // Keyword matching: keep monsters scoring >= 40
    const scored = monsters
      .map(m => ({ monster: m, score: miniMonsterMatchScore(mini, m) }))
      .filter(x => x.score >= 40)
      .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      mapping.set(mini, scored.slice(0, 20).map(x => x.monster));
    } else {
      // Fallback: any type-tag match
      const fallback = monsters
        .map(m => ({ monster: m, score: miniMonsterMatchScore(mini, m) }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      if (fallback.length > 0) {
        mapping.set(mini, fallback.map(x => x.monster));
      }
    }
  }

  return mapping;
}

const miniMonsterMapping = buildMiniMonsterMapping();

// ─── Environment Filtering ───────────────────────────────────────────────────

function getMinisForEnvironment(envId) {
  const env = environments.find((e) => e.id === envId);
  const envTags = env ? env.tags : [];

  return minis.filter((mini) => {
    if (!miniMonsterMapping.has(mini)) return false;

    // 1. Terrain flag match (most specific)
    if (mini.terrains.length > 0) {
      return mini.terrains.some((t) => {
        const envs = MINI_TERRAIN_TO_ENV[t] || [];
        return envs.includes(envId);
      });
    }

    // 2. TYPE_ALLOWED_ENVS: explicit list of valid environments per type
    const allowedEnvs = TYPE_ALLOWED_ENVS[mini.type];
    if (allowedEnvs && allowedEnvs.includes(envId)) {
      // Name-based filtering for Beast types to avoid mismatches
      if (mini.type === "Beast" || mini.type.includes("Beast")) {
        const ln = mini.name.toLowerCase();
        if (ln.includes("fire") || ln.includes("flame") || ln.includes("boitata"))
          return envId === "elemental-chaos";
        if (ln.includes("ice") || ln.includes("frost") || ln.includes("winter"))
          return envId === "arctic" || envId === "mountain";
        if (ln.includes("raptor") || ln.includes("saurus") || ln.includes("ceratops") || ln.includes("diloph") || ln.includes("eoraptor"))
          return ["forest", "plains", "swamp"].includes(envId);
        if (ln.includes("wolf"))
          return ["arctic", "forest", "plains", "mountain"].includes(envId);
        if (ln.includes("hawk") || ln.includes("bird") || ln.includes("eagle"))
          return ["mountain", "plains", "forest"].includes(envId);
      }
      return true;
    }

    // 3. Tag-based fallback
    const miniTags = TYPE_TO_TAGS[mini.type] || [];
    return miniTags.some((t) => envTags.includes(t));
  });
}

// ─── Encounter Evaluation ────────────────────────────────────────────────────

function getThreatCategory(role) {
  const map = { Brute: "pressure", Soldier: "pressure", Artillery: "damage", Lurker: "damage", Skirmisher: "damage", Controller: "control", Minion: "neutral" };
  return map[role] || "neutral";
}

function evaluateEncounter(entries, targetLevel) {
  const summary = { pressure: 0, damage: 0, control: 0 };
  for (const e of entries) { const c = getThreatCategory(e.role); if (c !== "neutral") summary[c] += e.count; }

  const hasPressure = summary.pressure > 0, hasDamage = summary.damage > 0, hasControl = summary.control > 0;
  const categoryCount = (hasPressure ? 1 : 0) + (hasDamage ? 1 : 0) + (hasControl ? 1 : 0);
  let score = 0;

  if (hasPressure) score += 15; if (hasDamage) score += 15; if (hasControl) score += 15;
  if (categoryCount === 3) score += 10;
  if (!hasDamage) score -= 25;
  if (categoryCount < 2) score -= 20;

  const uniqueRoles = new Set(entries.map(e => e.role));
  score += uniqueRoles.size * 5;

  const bruteCount = entries.filter(e => e.role === "Brute").length;
  if (bruteCount > 1) score -= 15 * (bruteCount - 1);

  const monsterCounts = new Map();
  for (const e of entries) monsterCounts.set(e.monsterId, (monsterCounts.get(e.monsterId) || 0) + 1);
  const duplicateCount = [...monsterCounts.values()].filter(c => c > 1).length;
  if (duplicateCount > 0) score -= 10 * duplicateCount;

  const uniqueMonsters = new Set(entries.map(e => e.monsterId));
  if (uniqueMonsters.size === 1 && entries.length > 1) score -= 20;

  const avgLevelDiff = entries.reduce((s, e) => s + Math.abs(e.level - targetLevel), 0) / entries.length;
  score += Math.max(0, 15 - avgLevelDiff * 4);

  const allTags = entries.flatMap(e => e.tags);
  const tagCounts = new Map();
  for (const tag of allTags) tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
  const maxTagCount = Math.max(0, ...tagCounts.values());
  if (maxTagCount >= 2) score += 8; if (maxTagCount >= 3) score += 8;
  if (maxTagCount === entries.length && entries.length > 2) score += 8;

  if (uniqueRoles.size <= 1 && entries.length > 1) score -= 20;

  const isValid = categoryCount >= 2 && hasDamage && uniqueMonsters.size > 1 && (uniqueRoles.size > 1 || entries.length <= 1);
  return { score: Math.round(score), isValid };
}

function matchesSlot(monster, requirement) {
  if (requirement === "Elite") return monster.rank === "Elite";
  if (requirement === "Solo") return monster.rank === "Solo";
  return requirement.split("|").includes(monster.role) && monster.rank === "Standard";
}

// ─── Terrain Selection ───────────────────────────────────────────────────────

// Terrains that should NEVER appear in certain environments
const TERRAIN_ENV_BLACKLIST = {
  "aquatic": ["Frozen Fire", "Lava Bridge", "Volcanic Vent", "Blast Cloud", "Choke Frost", "Ice Maws"],
  "forest": ["Frozen Fire", "Lava Bridge", "Volcanic Vent", "Frozen Lake", "Ice Maws"],
  "swamp": ["Frozen Fire", "Lava Bridge", "Volcanic Vent", "Frozen Lake", "Ice Maws", "Storm Plateau"],
  "plains": ["Frozen Fire", "Lava Bridge", "Volcanic Vent", "Frozen Lake", "Ice Maws"],
  "urban": ["Frozen Fire", "Lava Bridge", "Volcanic Vent", "Frozen Lake", "Ice Maws", "Beast Den"],
  "feywild": ["Frozen Fire", "Lava Bridge", "Volcanic Vent", "Hellfire"],
  "desert": ["Frozen Lake", "Ice Maws", "Choke Frost", "Frozen Fire"],
  "arctic": ["Lava Bridge", "Volcanic Vent", "Hellfire", "Poison Swamp"],
  "elemental-chaos": [],
  "underground": ["Storm Plateau"],
  "shadowfell": ["Lava Bridge", "Volcanic Vent", "Beast Den", "Storm Plateau"],
  "mountain": ["Poison Swamp"],
};

// Terrain name keywords that are preferred for certain environments
const TERRAIN_ENV_BONUS = {
  "aquatic": ["water", "tide", "storm", "flood", "mist", "fog", "whirl"],
  "swamp": ["poison", "swamp", "slime", "midge", "fungus", "mist", "fog"],
  "forest": ["plant", "thorn", "vine", "web", "den", "beast"],
  "urban": ["ruin", "pillar", "maze", "temple", "trap", "sewer"],
  "underground": ["slime", "crystal", "cave", "dark", "grasping", "shadow", "rift"],
  "shadowfell": ["shadow", "dark", "necrotic", "death", "weeping", "rift"],
  "arctic": ["ice", "frost", "frozen", "cold", "snow"],
  "mountain": ["storm", "thunder", "rock", "plateau", "wind"],
  "desert": ["sand", "heat", "sun", "dust", "storm"],
  "elemental-chaos": ["lava", "fire", "hell", "thunder", "shard", "chaos", "frozen fire"],
  "feywild": ["fey", "bloom", "mist", "thorns", "vine", "crystal", "font"],
  "plains": ["storm", "wind", "grass", "beast", "blood"],
};

function getTerrainForEnvironment(envId) {
  const env = environments.find(e => e.id === envId);
  if (!env) return [];
  const blacklist = TERRAIN_ENV_BLACKLIST[envId] || [];
  const bonusKeywords = TERRAIN_ENV_BONUS[envId] || [];

  const scored = terrainOptions
    .filter(t => !blacklist.includes(t.name))
    .map(t => {
      let matchCount = t.tags.filter(tag => env.tags.includes(tag)).length;
      // Bonus for thematically appropriate terrain names
      const lowerName = t.name.toLowerCase();
      const lowerDesc = (t.description || "").toLowerCase();
      for (const kw of bonusKeywords) {
        if (lowerName.includes(kw) || lowerDesc.includes(kw)) { matchCount += 3; break; }
      }
      return { terrain: t, matchCount };
    })
    .filter(x => x.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount);

  const best = scored[0]?.matchCount || 0;
  const topTier = shuffleArray(scored.filter(x => x.matchCount >= best - 1));
  const result = topTier.slice(0, 2).map(x => x.terrain);
  if (result.length < 2) {
    const next = shuffleArray(scored.filter(x => x.matchCount < best - 1));
    result.push(...next.slice(0, 2 - result.length).map(x => x.terrain));
  }
  return result;
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ─── Mini-Driven Encounter Generation ────────────────────────────────────────

const MIN_LEVEL = 6;
const MAX_LEVEL = 14;
const LEVEL_WINDOW = 4;
const usedEncounterSignatures = new Set();
const globalMiniUsage = new Map(); // Track how many times each mini is used globally
const globalLevelCount = new Map(); // Track how many encounters assigned per level
const IDEAL_PER_LEVEL = Math.ceil(174 / (MAX_LEVEL - MIN_LEVEL + 1)); // ~20

function buildPool(envMinis, levelMin, levelMax) {
  const pool = [];
  for (const mini of envMinis) {
    const monsterList = miniMonsterMapping.get(mini) || [];
    for (const m of monsterList) {
      if (m.level >= levelMin && m.level <= levelMax) {
        pool.push({ mini, monster: m });
      }
    }
  }
  return pool;
}

function fillSlot(slot, pool, usedMonsterIds, miniQtyRemaining, entries, level, envTags, usedMinisThisEncounter) {
  let best = null, bestScore = -Infinity;
  const existingTags = entries.length > 0 ? new Set(entries.flatMap(e => e.tags)) : null;

  for (const { mini, monster: m } of pool) {
    if (usedMonsterIds.has(m.id)) continue;
    if (!matchesSlot(m, slot.requirement)) continue;
    if ((miniQtyRemaining.get(mini) || 0) < slot.count) continue;

    let s = Math.max(0, 20 - Math.abs(m.level - level) * 5);
    for (const t of m.tags) { if (envTags.includes(t)) s += 6; }
    if (existingTags) { for (const t of m.tags) { if (existingTags.has(t)) { s += 10; break; } } }
    s += Math.min(mini.quantity, 5) * 2;

    // HARD CAP: skip minis that have been used 6+ times
    const globalUses = globalMiniUsage.get(mini.name) || 0;
    if (globalUses >= 6) continue;

    // GLOBAL USAGE PENALTY: heavily penalize overused minis to spread usage
    s -= globalUses * 12;

    // Penalize using same mini twice in one encounter
    if (usedMinisThisEncounter.has(mini.name)) s -= 30;

    s += Math.random() * 8;

    if (s > bestScore) { bestScore = s; best = { mini, monster: m }; }
  }
  return best;
}

function generateBestEncounter(mapPath) {
  const envList = getEnvironmentsForBattlemap(mapPath);

  let bestEncounter = null, bestScore = -Infinity, bestLevel = MIN_LEVEL, bestTemplate = null, bestMiniAssignments = [], bestEnvId = envList[0];

  for (const envId of envList) {
    const env = environments.find(e => e.id === envId);
    if (!env) continue;

    const envMinis = getMinisForEnvironment(envId);
    if (envMinis.length < 3) continue;

    for (let level = MIN_LEVEL; level <= MAX_LEVEL; level += 1) {
      const pool = buildPool(envMinis, level - LEVEL_WINDOW, level + LEVEL_WINDOW);
      if (pool.length < 4) continue;

      const shuffledTemplates = shuffleArray(templates).slice(0, 12);
      for (const template of shuffledTemplates) {
        for (let attempt = 0; attempt < 5; attempt++) {
          const entries = [], usedMonsterIds = new Set(), miniAssignments = [];
          const miniQtyRemaining = new Map();
          for (const mini of envMinis) miniQtyRemaining.set(mini, mini.quantity);

          let valid = true;
          const usedMinisThisEncounter = new Set();
          for (const slot of template.slots) {
            const result = fillSlot(slot, pool, usedMonsterIds, miniQtyRemaining, entries, level, env.tags, usedMinisThisEncounter);
            if (!result) { valid = false; break; }

            usedMonsterIds.add(result.monster.id);
            miniQtyRemaining.set(result.mini, miniQtyRemaining.get(result.mini) - slot.count);
            usedMinisThisEncounter.add(result.mini.name);

            entries.push({
              slotId: slot.id, monsterId: result.monster.id, monsterName: result.monster.name,
              role: result.monster.role, rank: result.monster.rank, level: result.monster.level,
              count: slot.count, source: result.monster.source, page: result.monster.page,
              tags: result.monster.tags, alignment: result.monster.alignment, themes: result.monster.themes,
            });
            miniAssignments.push({ mini: result.mini, count: slot.count });
          }

          if (!valid || entries.length === 0) continue;
          const sig = entries.map(e => e.monsterId).sort().join("|");
          if (usedEncounterSignatures.has(sig)) continue;

          const diag = evaluateEncounter(entries, level);
          if (!diag.isValid) continue;
          // Penalize over-represented levels to even distribution
          const levelCount = globalLevelCount.get(level) || 0;
          const levelPenalty = Math.max(0, levelCount - IDEAL_PER_LEVEL) * 6;
          const adjustedScore = diag.score - levelPenalty;
          if (adjustedScore > bestScore) {
            bestScore = adjustedScore; bestEncounter = entries; bestLevel = level;
            bestTemplate = template; bestMiniAssignments = miniAssignments; bestEnvId = envId;
          }
        }
      }
    }

    // If we found a good encounter for primary env, don't try fallbacks
    if (bestEncounter && bestScore >= 30) break;
  }

  if (!bestEncounter) return null;

  usedEncounterSignatures.add(bestEncounter.map(e => e.monsterId).sort().join("|"));
  globalLevelCount.set(bestLevel, (globalLevelCount.get(bestLevel) || 0) + 1);

  // Update global mini usage
  for (const assignment of bestMiniAssignments) {
    globalMiniUsage.set(assignment.mini.name, (globalMiniUsage.get(assignment.mini.name) || 0) + 1);
  }

  // Use PRIMARY environment for terrain selection (first in list = map's actual environment)
  const primaryEnvId = getEnvironmentsForBattlemap(mapPath)[0];
  const terrainSuggestions = getTerrainForEnvironment(primaryEnvId);

  // Type label
  const tagFreq = {};
  for (const t of bestEncounter.flatMap(e => e.tags)) tagFreq[t] = (tagFreq[t] || 0) + 1;
  const dominantTag = Object.entries(tagFreq)
    .filter(([tag]) => !["Humanoid", "Beast"].includes(tag))
    .sort((a, b) => b[1] - a[1])[0]?.[0] ||
    Object.entries(tagFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || "Mixed";

  const TAG_LABELS = {
    "Undead": "Undead", "Shadow": "Undead", "Dragon": "Draconic",
    "Fiend": "Demonic", "Demon": "Demonic", "Goblinoid": "Goblinoid",
    "Fey": "Fey", "Plant": "Fey", "Giant": "Giant",
    "Elemental": "Elemental", "Fire": "Infernal", "Cold": "Frost",
    "Lightning": "Storm", "Aberration": "Aberrant", "Ooze": "Aberrant",
    "Beast": "Beast", "Construct": "Construct", "Humanoid": "Humanoid",
    "Celestial": "Celestial", "Poison": "Venomous", "Shapechanger": "Shapechanger",
    "Acid": "Aberrant",
  };

  return {
    entries: bestEncounter, level: bestLevel, template: bestTemplate,
    terrainSuggestions, typeLabel: TAG_LABELS[dominantTag] || dominantTag,
    score: bestScore, envId: bestEnvId, miniAssignments: bestMiniAssignments,
  };
}

// ─── Format Output ───────────────────────────────────────────────────────────

function encounterToText(mapPath, encounter) {
  const lines = [];
  lines.push(`#${encounter.number} – Lvl ${encounter.level} ${encounter.typeLabel} – ${mapPath}`);
  lines.push(`Template: ${encounter.template.name}`);
  lines.push(`Battlemap: ${mapPath}`);
  lines.push("");

  const nameWidth = Math.max(7, ...encounter.entries.map(e => e.monsterName.length));
  const header = "Monster".padEnd(nameWidth + 2) + "Role          Rank       Lvl  Qty  Source";
  lines.push(header);
  lines.push("-".repeat(header.length));

  for (const entry of encounter.entries) {
    lines.push(
      entry.monsterName.padEnd(nameWidth + 2) +
      entry.role.padEnd(14) + entry.rank.padEnd(11) +
      String(entry.level).padStart(3) + String(entry.count).padStart(5) +
      "  " + `${entry.source} p.${entry.page}`
    );
  }

  // Mini figure assignments per slot
  lines.push("");
  lines.push("Mini Figures:");
  for (let i = 0; i < encounter.entries.length; i++) {
    const entry = encounter.entries[i];
    const assignment = encounter.miniAssignments[i];
    if (assignment) {
      lines.push(`  ${entry.monsterName} (×${entry.count}) → ${assignment.mini.name} (×${assignment.count} of ${assignment.mini.quantity} available)`);
    }
  }

  for (const terrain of encounter.terrainSuggestions) {
    lines.push("");
    lines.push(`Terrain: ${terrain.name}`);
    lines.push(terrain.description);
    if (terrain.powers?.length) {
      lines.push("");
      lines.push("Terrain Powers:");
      for (const power of terrain.powers) {
        lines.push(`  ${power.name}`);
        lines.push(`    Trigger: ${power.trigger}`);
        lines.push(`    Effect: ${power.effect}`);
        if (power.recharge) lines.push(`    Recharge: ${power.recharge}`);
      }
    }
  }

  return lines.join("\n");
}

// ─── Run ─────────────────────────────────────────────────────────────────────

console.log(`Loaded: ${monsters.length} monsters, ${minis.length} minis, ${battlemaps.length} battlemaps`);
console.log(`Mini→Monster mappings: ${miniMonsterMapping.size} minis mapped`);
console.log("");

const results = [];
const unusedMaps = [];

for (const mapPath of battlemaps) {
  const result = generateBestEncounter(mapPath);
  if (result) { results.push({ mapPath, ...result }); }
  else { unusedMaps.push(mapPath); }
}

results.sort((a, b) => a.level - b.level || a.typeLabel.localeCompare(b.typeLabel));
results.forEach((r, i) => { r.number = i + 1; });

// Write text output
const outputLines = [];
outputLines.push("=".repeat(80));
outputLines.push("DND ENCOUNTER TEMPLATES – INTERACTIVE BATTLEMAPS");
outputLines.push(`Generated: ${new Date().toISOString().split("T")[0]}`);
outputLines.push(`Party Level: 6+  |  Total Encounters: ${results.length}`);
outputLines.push("=".repeat(80));
outputLines.push("");

for (const result of results) {
  outputLines.push(encounterToText(result.mapPath, result));
  outputLines.push("");
  outputLines.push("~".repeat(80));
  outputLines.push("");
}

if (unusedMaps.length > 0) {
  outputLines.push("");
  outputLines.push("=".repeat(80));
  outputLines.push("BATTLEMAPS WITHOUT ENCOUNTERS (no matching minis/monsters):");
  outputLines.push("=".repeat(80));
  for (const m of unusedMaps) outputLines.push(`  - ${m}`);
}

writeFileSync("encounters-output.txt", outputLines.join("\n"), "utf8");

// ─── Generate Excel ──────────────────────────────────────────────────────────

function generateExcel(results) {
  const wb = XLSX.utils.book_new();
  const tocData = [
    ["#", "Encounter Name", "Battlemap", "Level", "Type", "Template", "Score"],
    ...results.map(r => [
      r.number,
      `#${r.number} – Lvl ${r.level} ${r.typeLabel} – ${r.mapPath}`,
      r.mapPath, r.level, r.typeLabel, r.template.name, r.score,
    ]),
  ];
  const tocSheet = XLSX.utils.aoa_to_sheet(tocData);
  tocSheet["!cols"] = [{ wch: 4 }, { wch: 55 }, { wch: 45 }, { wch: 6 }, { wch: 14 }, { wch: 20 }, { wch: 6 }];
  XLSX.utils.book_append_sheet(wb, tocSheet, "Encounters");

  const totalEncounters = results.length;
  const rollerSheet = {};
  rollerSheet["A1"] = { t: "s", v: "RANDOM ENCOUNTER ROLLER" };
  rollerSheet["A3"] = { t: "s", v: "Press F9 (or Ctrl+Shift+F9) to roll a new encounter!" };
  rollerSheet["A5"] = { t: "s", v: "Random #" };
  rollerSheet["C5"] = { t: "s", v: "Encounter Name" };
  rollerSheet["D5"] = { t: "s", v: "Battlemap" };
  rollerSheet["E5"] = { t: "s", v: "Level" };
  rollerSheet["F5"] = { t: "s", v: "Type" };
  rollerSheet["A6"] = { t: "n", v: 1, f: `RANDBETWEEN(1,${totalEncounters})` };
  rollerSheet["C6"] = { t: "s", v: "", f: `VLOOKUP(A6,Encounters!A2:G${totalEncounters + 1},2,FALSE)` };
  rollerSheet["D6"] = { t: "s", v: "", f: `VLOOKUP(A6,Encounters!A2:G${totalEncounters + 1},3,FALSE)` };
  rollerSheet["E6"] = { t: "n", v: 0, f: `VLOOKUP(A6,Encounters!A2:G${totalEncounters + 1},4,FALSE)` };
  rollerSheet["F6"] = { t: "s", v: "", f: `VLOOKUP(A6,Encounters!A2:G${totalEncounters + 1},5,FALSE)` };
  rollerSheet["A8"] = { t: "s", v: "FILTER BY LEVEL (optional):" };
  rollerSheet["A9"] = { t: "s", v: "Min Level:" };
  rollerSheet["B9"] = { t: "n", v: 6 };
  rollerSheet["A10"] = { t: "s", v: "Max Level:" };
  rollerSheet["B10"] = { t: "n", v: 14 };
  rollerSheet["A12"] = { t: "s", v: "Matching encounters:" };
  rollerSheet["B12"] = { t: "n", v: totalEncounters, f: `COUNTIFS(Encounters!D2:D${totalEncounters + 1},">="&B9,Encounters!D2:D${totalEncounters + 1},"<="&B10)` };
  rollerSheet["!ref"] = "A1:F12";
  rollerSheet["!cols"] = [{ wch: 22 }, { wch: 8 }, { wch: 55 }, { wch: 45 }, { wch: 6 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, rollerSheet, "Random Roller");

  XLSX.writeFile(wb, "encounters-table-of-contents.xlsx");
}

generateExcel(results);

console.log(`✓ Generated ${results.length} encounters`);
console.log(`✗ ${unusedMaps.length} battlemaps could not be matched`);
if (unusedMaps.length > 0) {
  console.log("\nUnused battlemaps:");
  for (const m of unusedMaps) console.log(`  - ${m}`);
}
console.log(`\nOutput: encounters-output.txt + encounters-table-of-contents.xlsx`);
