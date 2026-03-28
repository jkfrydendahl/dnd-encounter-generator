/**
 * Type definitions for the monster image resolution layer.
 *
 * The image system resolves URLs (not local files) for monster artwork.
 * Each monster can have a primary image and optional variants.
 * Resolution follows a pipeline: override → index → alias → fallback → placeholder.
 */

export interface MonsterImageEntry {
  monsterId: string;
  name: string;
  normalizedName: string;
  aliases?: string[];
  primary: string;
  variants?: string[];
  attribution?: string;
  sourceType?: "manual" | "generated-index" | "scraped";
  tags?: string[];
}

export interface MonsterImageResolution {
  found: boolean;
  path: string;
  variants?: string[];
  matchedBy:
    | "manual-override"
    | "monster-id"
    | "normalized-name"
    | "alias"
    | "fallback"
    | "placeholder";
  matchedValue?: string;
}

export interface MonsterImageOverride {
  byMonsterId?: Record<string, string>;
  byNormalizedName?: Record<string, string>;
}

export interface MonsterFallbackMap {
  byTag?: Record<string, string>;
  byRole?: Record<string, string>;
  default: string;
}
