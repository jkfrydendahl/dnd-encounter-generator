/**
 * Normalizes a monster name into a deterministic slug for image lookup.
 *
 * Rules:
 * - lowercase
 * - strip apostrophes/smart quotes
 * - replace non-alphanumeric runs with a single hyphen
 * - trim leading/trailing hyphens
 *
 * Examples:
 *   "Young Black Dragon"    → "young-black-dragon"
 *   "Bone Mongrel Dracolich" → "bone-mongrel-dracolich"
 *   "Lich (Necromancer)"     → "lich-necromancer"
 */
export function normalizeMonsterName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
