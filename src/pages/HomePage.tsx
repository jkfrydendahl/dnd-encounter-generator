import { useState, useCallback } from "react";
import { useGeneratorSettings } from "../hooks/useGeneratorSettings";
import { ControlsPanel } from "../components/controls/ControlsPanel";
import { EncounterDisplay } from "../components/encounter/EncounterDisplay";
import { DiagnosticsPanel } from "../components/encounter/DiagnosticsPanel";
import { generateEncounter } from "../lib/generateEncounter";
import type { GeneratedEncounter, Monster, EncounterTemplate, TerrainSuggestion } from "../types";

import monstersData from "../data/monsters.json";
import templatesData from "../data/templates.json";
import terrainData from "../data/terrain.json";

const monsters = monstersData as Monster[];
const templates = templatesData as EncounterTemplate[];
const terrain = terrainData as TerrainSuggestion[];

const availableTags = Array.from(
  new Set(monsters.flatMap((m) => m.tags))
).sort();

export function HomePage() {
  const { settings, updateSetting } = useGeneratorSettings();
  const [encounter, setEncounter] = useState<GeneratedEncounter | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = useCallback(() => {
    setIsGenerating(true);

    // Use setTimeout to allow the UI to show the generating state
    setTimeout(() => {
      const result = generateEncounter({
        monsters,
        templates,
        terrain,
        settings,
      });
      setEncounter(result);
      setIsGenerating(false);
    }, 0);
  }, [settings]);

  return (
    <div className="home-page">
      <header className="app-header">
        <h1>D&D 4e Encounter Generator</h1>
      </header>

      <main className="app-layout">
        <ControlsPanel
          settings={settings}
          onUpdateSetting={updateSetting}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          templates={templates}
          availableTags={availableTags}
        />

        <EncounterDisplay
          encounter={encounter}
          onReroll={handleGenerate}
        />

        <DiagnosticsPanel
          diagnostics={encounter?.diagnostics ?? null}
          threatSummary={encounter?.threatSummary ?? null}
        />
      </main>
    </div>
  );
}
