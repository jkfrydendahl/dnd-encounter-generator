import { useState, useCallback } from "react";
import { useGeneratorSettings } from "../hooks/useGeneratorSettings";
import { useMonsterCard } from "../hooks/useMonsterCard";
import { useMonsterSearch } from "../hooks/useMonsterSearch";
import { usePinnedCards } from "../hooks/usePinnedCards";
import { ControlsPanel } from "../components/controls/ControlsPanel";
import { MonsterSearch } from "../components/controls/MonsterSearch";
import { EncounterDisplay } from "../components/encounter/EncounterDisplay";
import type { LockedSlots } from "../components/encounter/EncounterDisplay";
import { MonsterCardModal } from "../components/encounter/MonsterCardModal";
import { PinnedCardsSection } from "../components/encounter/PinnedCardsSection";
import { DiagnosticsPanel } from "../components/encounter/DiagnosticsPanel";
import { generateEncounter, rerollSlot, selectTerrains } from "../lib/generateEncounter";
import { getEnvironmentTags } from "../lib/environmentLookup";
import { parseEncounterText } from "../lib/parseEncounterText";
import type { GeneratedEncounter, Monster, EncounterTemplate, TerrainSuggestion, Environment, GeneratedEncounterEntry } from "../types";

import monstersData from "../data/monsters.json";
import templatesData from "../data/templates.json";
import terrainData from "../data/terrain.json";
import environmentsData from "../data/environments.json";

const monsters = monstersData as Monster[];
const templates = templatesData as EncounterTemplate[];
const terrain = terrainData as TerrainSuggestion[];
const environments = environmentsData as Environment[];

const availableTags = Array.from(
  new Set(monsters.flatMap((m) => m.tags))
).sort();

export function HomePage() {
  const { settings, updateSetting } = useGeneratorSettings();
  const [encounter, setEncounter] = useState<GeneratedEncounter | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lockedSlots, setLockedSlots] = useState<LockedSlots>(new Set());
  const [lockedTerrains, setLockedTerrains] = useState<Set<string>>(new Set());

  const { isOpen, selectedMonster, statBlockHtml, imageResolution, openCard, closeCard } = useMonsterCard();
  const { pinnedCards, isSectionOpen, isPinned, togglePin, unpinCard, clearPinned, toggleSection } = usePinnedCards();
  const search = useMonsterSearch(monsters);

  const handleSearchSelect = useCallback((monster: Monster) => {
    const entry: GeneratedEncounterEntry = {
      slotId: `search-${monster.id}`,
      monsterId: monster.id,
      monsterName: monster.name,
      role: monster.role,
      rank: monster.rank,
      level: monster.level,
      count: 1,
      source: monster.source,
      page: monster.page,
      tags: monster.tags,
      alignment: monster.alignment,
    };
    openCard(entry);
    search.close();
  }, [openCard, search]);

  const generatorInput = { monsters, templates, terrain, settings };

  const handleGenerate = useCallback(() => {
    setIsGenerating(true);

    // Use setTimeout to allow the UI to show the generating state
    setTimeout(() => {
      const hasLocks = encounter && (lockedSlots.size > 0 || lockedTerrains.size > 0);
      if (hasLocks) {
        // Reroll only unlocked monster slots
        let result = encounter;
        for (const entry of encounter.entries) {
          if (!lockedSlots.has(entry.slotId)) {
            result = rerollSlot(result, entry.slotId, generatorInput);
          }
        }
        // Reroll unlocked terrains
        const terrainCount = settings.terrainCount ?? 1;
        const kept = result.terrainSuggestions.filter((t) => lockedTerrains.has(t.id));
        const needed = terrainCount - kept.length;
        if (needed > 0) {
          const excludeIds = new Set(kept.map((t) => t.id));
          const available = terrain.filter((t) => !excludeIds.has(t.id));
          const envTags = getEnvironmentTags(settings.environment);
          const fresh = selectTerrains(available, result.entries, needed, envTags.length > 0 ? envTags : undefined);
          result = { ...result, terrainSuggestions: [...kept, ...fresh] };
        } else {
          result = { ...result, terrainSuggestions: kept.slice(0, terrainCount) };
        }
        setEncounter(result);
        // Clean up terrain locks to only include terrains still in the encounter
        const finalTerrainIds = new Set(result.terrainSuggestions.map((t) => t.id));
        setLockedTerrains((prev) => {
          const cleaned = new Set([...prev].filter((id) => finalTerrainIds.has(id)));
          return cleaned.size === prev.size ? prev : cleaned;
        });
      } else {
        setLockedSlots(new Set());
        setLockedTerrains(new Set());
        const result = generateEncounter(generatorInput);
        setEncounter(result);
      }
      setIsGenerating(false);
    }, 0);
  }, [settings, encounter, lockedSlots, lockedTerrains]);

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

  const handleToggleTerrainLock = useCallback((terrainId: string) => {
    setLockedTerrains((prev) => {
      const next = new Set(prev);
      if (next.has(terrainId)) next.delete(terrainId);
      else next.add(terrainId);
      return next;
    });
  }, []);

  const handleClearAllLocks = useCallback(() => {
    setLockedSlots(new Set());
    setLockedTerrains(new Set());
  }, []);

  const handleImportEncounter = useCallback((text: string) => {
    const imported = parseEncounterText(text, monsters, terrain);
    if (!imported) return;

    const hasLocks = encounter && (lockedSlots.size > 0 || lockedTerrains.size > 0);
    if (!hasLocks) {
      setEncounter(imported);
      setLockedSlots(new Set());
      setLockedTerrains(new Set());
      return;
    }

    // Merge: keep locked entries, replace unlocked with imported ones
    const keptEntries = encounter.entries.filter((e) => lockedSlots.has(e.slotId));
    const unlockedCount = encounter.entries.length - keptEntries.length;
    const fillerEntries = imported.entries.slice(0, unlockedCount);

    const keptTerrains = encounter.terrainSuggestions.filter((t) => lockedTerrains.has(t.id));
    const unlockedTerrainCount = encounter.terrainSuggestions.length - keptTerrains.length;
    const fillerTerrains = imported.terrainSuggestions.slice(0, unlockedTerrainCount);

    const merged: GeneratedEncounter = {
      ...imported,
      entries: [...keptEntries, ...fillerEntries],
      terrainSuggestions: [...keptTerrains, ...fillerTerrains],
    };
    setEncounter(merged);
  }, [encounter, lockedSlots, lockedTerrains]);


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
          environments={environments}
          onImportEncounter={handleImportEncounter}
        />

        <EncounterDisplay
          encounter={encounter}
          onRerollSlot={handleRerollSlot}
          lockedSlots={lockedSlots}
          onToggleLock={handleToggleLock}
          lockedTerrains={lockedTerrains}
          onToggleTerrainLock={handleToggleTerrainLock}
          onClearAllLocks={handleClearAllLocks}
          onMonsterClick={openCard}
          onPinMonster={togglePin}
          isPinned={isPinned}
          pinnedCardsSlot={
            <PinnedCardsSection
              pinnedCards={pinnedCards}
              isOpen={isSectionOpen}
              halfLevelDamage={settings.halfLevelDamage}
              onToggleSection={toggleSection}
              onUnpin={unpinCard}
              onClear={clearPinned}
            />
          }
          searchSlot={
            <MonsterSearch
              query={search.query}
              results={search.results}
              isOpen={search.isOpen}
              onQueryChange={search.setQuery}
              onSelect={handleSearchSelect}
              containerRef={search.containerRef}
            />
          }
        />

        {isOpen && selectedMonster && (
          <MonsterCardModal
            isOpen={isOpen}
            statBlockHtml={statBlockHtml}
            monster={selectedMonster}
            imageResolution={imageResolution}
            halfLevelDamage={settings.halfLevelDamage}
            onClose={closeCard}
          />
        )}

        <DiagnosticsPanel
          diagnostics={encounter?.diagnostics ?? null}
          threatSummary={encounter?.threatSummary ?? null}
        />
      </main>
    </div>
  );
}
