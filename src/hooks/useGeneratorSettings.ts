import { useState, useEffect } from "react";
import type { GeneratorSettings } from "../types";
import {
  DEFAULT_LEVEL_MIN_OFFSET,
  DEFAULT_LEVEL_MAX_OFFSET,
  DEFAULT_TARGET_OFFSET,
  DEFAULT_MONSTER_COUNT,
} from "../lib/constants";

const STORAGE_KEY = "dnd-generator-settings";

const defaultSettings: GeneratorSettings = {
  partyLevel: 7,
  monsterCount: DEFAULT_MONSTER_COUNT,
  minLevelOffset: DEFAULT_LEVEL_MIN_OFFSET,
  maxLevelOffset: DEFAULT_LEVEL_MAX_OFFSET,
  targetDifficultyOffset: DEFAULT_TARGET_OFFSET,
  themeTag: undefined,
  environment: undefined,
  templateMode: "any",
  duplicatePolicy: "soft-avoid",
  terrainCount: 1,
};

function loadSettings(): GeneratorSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore corrupt storage
  }
  return defaultSettings;
}

export function useGeneratorSettings() {
  const [settings, setSettings] = useState<GeneratorSettings>(loadSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof GeneratorSettings>(
    key: K,
    value: GeneratorSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return { settings, updateSetting, resetSettings };
}
