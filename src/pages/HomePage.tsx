import { useState, useCallback } from "react";
import { useGeneratorSettings } from "../hooks/useGeneratorSettings";
import { ControlsPanel } from "../components/controls/ControlsPanel";
import { EncounterDisplay } from "../components/encounter/EncounterDisplay";
import type { LockedSlots } from "../components/encounter/EncounterDisplay";
import { DiagnosticsPanel } from "../components/encounter/DiagnosticsPanel";
import { generateEncounter, rerollSlot } from "../lib/generateEncounter";
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
  const [lockedSlots, setLockedSlots] = useState<LockedSlots>(new Set());

  const generatorInput = { monsters, templates, terrain, settings };

  const handleGenerate = useCallback(() => {
    setIsGenerating(true);

    // Use setTimeout to allow the UI to show the generating state
    setTimeout(() => {
      if (encounter && lockedSlots.size > 0) {
        // Reroll only unlocked slots
        let result = encounter;
        for (const entry of encounter.entries) {
          if (!lockedSlots.has(entry.slotId)) {
            result = rerollSlot(result, entry.slotId, generatorInput);
          }
        }
        setEncounter(result);
      } else {
        setLockedSlots(new Set());
        const result = generateEncounter(generatorInput);
        setEncounter(result);
      }
      setIsGenerating(false);
    }, 0);
  }, [settings, encounter, lockedSlots]);

  const handleRerollSlot = useCallback(
    (slotId: string) => {
      if (!encounter) return;
      const result = rerollSlot(encounter, slotId, generatorInput);
      setEncounter(result);
    },
    [encounter, settings]
  );

  const handleToggleLock = useCallback((slotId: string) => {
    setLockedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(slotId)) next.delete(slotId);
      else next.add(slotId);
      return next;
    });
  }, []);


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
          onRerollSlot={handleRerollSlot}
          lockedSlots={lockedSlots}
          onToggleLock={handleToggleLock}
        />

        <DiagnosticsPanel
          diagnostics={encounter?.diagnostics ?? null}
          threatSummary={encounter?.threatSummary ?? null}
        />
      </main>
    </div>
  );
}
