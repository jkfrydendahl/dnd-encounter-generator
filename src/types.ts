export type MonsterRole =
  | "Brute"
  | "Soldier"
  | "Skirmisher"
  | "Artillery"
  | "Controller"
  | "Lurker"
  | "Minion";

export type MonsterRank = "Standard" | "Elite" | "Solo";

export interface Monster {
  id: string;
  name: string;
  level: number;
  role: MonsterRole;
  rank: MonsterRank;
  source: string;
  page: number;
  tags: string[];
  alignment: string;
  themes?: string[];
}

export type TemplateMode = "standard" | "boss" | "any";

export type SlotRequirement =
  | "Brute"
  | "Soldier"
  | "Skirmisher"
  | "Artillery"
  | "Controller"
  | "Lurker"
  | "Minion"
  | "Elite"
  | "Solo"
  | "Brute|Soldier"
  | "Artillery|Lurker"
  | "Skirmisher|Lurker"
  | "Skirmisher|Controller"
  | "Controller|Artillery";

export interface EncounterSlot {
  id: string;
  count: number;
  requirement: SlotRequirement;
  label?: string;
}

export interface EncounterTemplate {
  id: string;
  name: string;
  mode: TemplateMode;
  weight: number;
  slots: EncounterSlot[];
}

export type DuplicatePolicy = "allow" | "soft-avoid" | "avoid";

export interface Environment {
  id: string;
  label: string;
  description: string;
  tags: string[];
  preferredAlignments?: string[];
}

export interface GeneratorSettings {
  partyLevel: number;
  monsterCount: number;
  minLevelOffset: number;
  maxLevelOffset: number;
  targetDifficultyOffset: number;
  themeTag?: string;
  environment?: string;
  templateMode: string;
  duplicatePolicy: DuplicatePolicy;
  terrainCount: number;
  halfLevelDamage: boolean;
}

export interface GeneratedEncounterEntry {
  slotId: string;
  monsterId: string;
  monsterName: string;
  role: MonsterRole;
  rank: MonsterRank;
  level: number;
  count: number;
  source: string;
  page: number;
  tags: string[];
  alignment: string;
  themes?: string[];
}

export interface ThreatSummary {
  pressure: number;
  damage: number;
  control: number;
}

export interface EncounterDiagnostics {
  hasPressure: boolean;
  hasDamage: boolean;
  hasControl: boolean;
  categoryCount: number;
  warnings: string[];
  score: number;
  isValid: boolean;
}

export interface TerrainPower {
  name: string;
  trigger: string;
  effect: string;
  recharge?: string;
}

export interface TerrainSuggestion {
  id: string;
  name: string;
  tags: string[];
  description: string;
  powers?: TerrainPower[];
}

export interface GeneratedEncounter {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  entries: GeneratedEncounterEntry[];
  threatSummary: ThreatSummary;
  diagnostics: EncounterDiagnostics;
  terrainSuggestions: TerrainSuggestion[];
}
