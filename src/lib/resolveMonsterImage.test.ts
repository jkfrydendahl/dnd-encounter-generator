import { describe, it, expect } from "vitest";
import { normalizeMonsterName } from "./normalizeMonsterName";
import { resolveMonsterFallback } from "./resolveMonsterFallback";
import { resolveMonsterImage } from "./resolveMonsterImage";
import type {
  MonsterImageEntry,
  MonsterImageOverride,
  MonsterFallbackMap,
} from "./imageTypes";

const fallbacks: MonsterFallbackMap = {
  byTag: {
    Dragon: "https://example.com/fallback/dragon.jpg",
    Undead: "https://example.com/fallback/undead.jpg",
  },
  byRole: {
    Brute: "https://example.com/fallback/brute.jpg",
  },
  default: "https://example.com/placeholder.jpg",
};

const imageIndex: MonsterImageEntry[] = [
  {
    monsterId: "mm1-young-black-dragon",
    name: "Young Black Dragon",
    normalizedName: "young-black-dragon",
    primary: "https://example.com/young-black-dragon.jpg",
    variants: ["https://example.com/young-black-dragon-alt.jpg"],
    tags: ["Dragon"],
  },
  {
    monsterId: "mm1-dire-rat",
    name: "Dire Rat",
    normalizedName: "dire-rat",
    aliases: ["dire-rat-variant", "Dire Rat (Sewer)"],
    primary: "https://example.com/dire-rat.jpg",
    tags: ["Beast"],
  },
];

const overrides: MonsterImageOverride = {
  byMonsterId: {
    "mm1-portal-drake": "https://example.com/override/portal-drake.jpg",
  },
  byNormalizedName: {
    "bone-mongrel-dracolich": "https://example.com/override/bone-mongrel.jpg",
  },
};

describe("normalizeMonsterName", () => {
  it("lowercases and hyphenates", () => {
    expect(normalizeMonsterName("Young Black Dragon")).toBe("young-black-dragon");
  });

  it("strips apostrophes", () => {
    expect(normalizeMonsterName("Lich's Servant")).toBe("lichs-servant");
  });

  it("strips parenthetical into hyphen", () => {
    expect(normalizeMonsterName("Lich (Necromancer)")).toBe("lich-necromancer");
  });

  it("trims whitespace and collapses runs", () => {
    expect(normalizeMonsterName("  Bone   Mongrel  ")).toBe("bone-mongrel");
  });
});

describe("resolveMonsterFallback", () => {
  it("returns tag fallback when tag matches", () => {
    const result = resolveMonsterFallback({ tags: ["Dragon"] }, fallbacks);
    expect(result.found).toBe(false);
    expect(result.matchedBy).toBe("fallback");
    expect(result.matchedValue).toBe("Dragon");
    expect(result.path).toBe("https://example.com/fallback/dragon.jpg");
  });

  it("returns role fallback when no tag matches", () => {
    const result = resolveMonsterFallback({ role: "Brute", tags: ["Goblin"] }, fallbacks);
    expect(result.matchedBy).toBe("fallback");
    expect(result.matchedValue).toBe("Brute");
  });

  it("returns placeholder when nothing matches", () => {
    const result = resolveMonsterFallback({ tags: [] }, fallbacks);
    expect(result.matchedBy).toBe("placeholder");
    expect(result.path).toBe("https://example.com/placeholder.jpg");
  });
});

describe("resolveMonsterImage", () => {
  it("resolves by manual override (monster ID)", () => {
    const monster = { id: "mm1-portal-drake", name: "Portal Drake", tags: ["Dragon"] };
    const result = resolveMonsterImage(monster, imageIndex, overrides, fallbacks);
    expect(result.found).toBe(true);
    expect(result.matchedBy).toBe("manual-override");
    expect(result.path).toBe("https://example.com/override/portal-drake.jpg");
  });

  it("resolves by manual override (normalized name)", () => {
    const monster = { id: "mm1-bone-mongrel", name: "Bone Mongrel Dracolich", tags: [] };
    const result = resolveMonsterImage(monster, imageIndex, overrides, fallbacks);
    expect(result.found).toBe(true);
    expect(result.matchedBy).toBe("manual-override");
    expect(result.path).toBe("https://example.com/override/bone-mongrel.jpg");
  });

  it("resolves by monster ID in index", () => {
    const monster = { id: "mm1-young-black-dragon", name: "Young Black Dragon", tags: ["Dragon"] };
    const result = resolveMonsterImage(monster, imageIndex, overrides, fallbacks);
    expect(result.found).toBe(true);
    expect(result.matchedBy).toBe("monster-id");
    expect(result.path).toBe("https://example.com/young-black-dragon.jpg");
    expect(result.variants).toEqual(["https://example.com/young-black-dragon-alt.jpg"]);
  });

  it("resolves by normalized name in index", () => {
    const monster = { id: "custom-dire-rat", name: "Dire Rat", tags: ["Beast"] };
    const result = resolveMonsterImage(monster, imageIndex, overrides, fallbacks);
    expect(result.found).toBe(true);
    expect(result.matchedBy).toBe("normalized-name");
    expect(result.path).toBe("https://example.com/dire-rat.jpg");
  });

  it("resolves by alias", () => {
    const monster = { id: "unknown-id", name: "Dire Rat (Sewer)", tags: ["Beast"] };
    const result = resolveMonsterImage(monster, imageIndex, overrides, fallbacks);
    expect(result.found).toBe(true);
    expect(result.matchedBy).toBe("alias");
  });

  it("falls back to tag when no match", () => {
    const monster = { id: "mm1-unknown-dragon", name: "Unknown Dragon", tags: ["Dragon"] };
    const result = resolveMonsterImage(monster, imageIndex, overrides, fallbacks);
    expect(result.found).toBe(false);
    expect(result.matchedBy).toBe("fallback");
    expect(result.matchedValue).toBe("Dragon");
  });

  it("falls back to role when no tag match", () => {
    const monster = { id: "mm1-unknown", name: "Unknown Monster", role: "Brute", tags: ["Goblin"] };
    const result = resolveMonsterImage(monster, imageIndex, overrides, fallbacks);
    expect(result.found).toBe(false);
    expect(result.matchedBy).toBe("fallback");
    expect(result.matchedValue).toBe("Brute");
  });

  it("returns placeholder when nothing matches", () => {
    const monster = { id: "totally-unknown", name: "Totally Unknown", tags: [] };
    const result = resolveMonsterImage(monster, imageIndex, overrides, fallbacks);
    expect(result.found).toBe(false);
    expect(result.matchedBy).toBe("placeholder");
  });
});
