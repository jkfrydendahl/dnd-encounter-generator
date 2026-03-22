import { useState, useRef, useEffect } from "react";
import type { GeneratorSettings, DuplicatePolicy, EncounterTemplate, Environment } from "../../types";

interface ControlsPanelProps {
  settings: GeneratorSettings;
  onUpdateSetting: <K extends keyof GeneratorSettings>(
    key: K,
    value: GeneratorSettings[K]
  ) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  templates: EncounterTemplate[];
  availableTags: string[];
  environments: Environment[];
  onImportEncounter?: (text: string) => void;
}

export function ControlsPanel({
  settings,
  onUpdateSetting,
  onGenerate,
  isGenerating,
  templates,
  availableTags,
  environments,
  onImportEncounter,
}: ControlsPanelProps) {
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (importOpen) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [importOpen]);

  function handleImportSubmit() {
    if (!onImportEncounter || !importText.trim()) return;
    onImportEncounter(importText.trim());
    setImportText("");
    setImportOpen(false);
  }

  return (
    <div className="controls-panel">
      <h2>Settings</h2>

      <label>
        Party Level
        <input
          type="number"
          min={1}
          max={30}
          value={settings.partyLevel}
          onChange={(e) =>
            onUpdateSetting("partyLevel", Number(e.target.value))
          }
        />
      </label>

      <label>
        Unique Monsters
        <input
          type="number"
          min={2}
          max={7}
          value={settings.monsterCount}
          onChange={(e) =>
            onUpdateSetting("monsterCount", Number(e.target.value))
          }
        />
      </label>

      <label>
        Min Level Offset
        <input
          type="number"
          min={-5}
          max={0}
          value={settings.minLevelOffset}
          onChange={(e) =>
            onUpdateSetting("minLevelOffset", Number(e.target.value))
          }
        />
      </label>

      <label>
        Max Level Offset
        <input
          type="number"
          min={0}
          max={5}
          value={settings.maxLevelOffset}
          onChange={(e) =>
            onUpdateSetting("maxLevelOffset", Number(e.target.value))
          }
        />
      </label>

      <label>
        Target Difficulty Offset
        <input
          type="number"
          min={-2}
          max={5}
          value={settings.targetDifficultyOffset}
          onChange={(e) =>
            onUpdateSetting(
              "targetDifficultyOffset",
              Number(e.target.value)
            )
          }
        />
      </label>

      <label>
        Theme Tag
        <select
          value={settings.themeTag ?? ""}
          onChange={(e) =>
            onUpdateSetting(
              "themeTag",
              e.target.value || undefined
            )
          }
        >
          <option value="">Any</option>
          {availableTags.map((tag) => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>
      </label>

      <label>
        Environment
        <select
          value={settings.environment ?? ""}
          onChange={(e) =>
            onUpdateSetting(
              "environment",
              e.target.value || undefined
            )
          }
        >
          <option value="">Any</option>
          {environments.map((env) => (
            <option key={env.id} value={env.id}>{env.label}</option>
          ))}
        </select>
      </label>

      <label>
        Template
        <select
          value={settings.templateMode}
          onChange={(e) =>
            onUpdateSetting("templateMode", e.target.value)
          }
        >
          <option value="any">Any</option>
          <option value="standard">Any Standard</option>
          <option value="boss">Any Boss</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.mode})
            </option>
          ))}
        </select>
      </label>

      <label>
        Duplicate Policy
        <select
          value={settings.duplicatePolicy}
          onChange={(e) =>
            onUpdateSetting(
              "duplicatePolicy",
              e.target.value as DuplicatePolicy
            )
          }
        >
          <option value="allow">Allow</option>
          <option value="soft-avoid">Soft Avoid</option>
          <option value="avoid">Avoid</option>
        </select>
      </label>

      <label>
        Terrain Features
        <select
          value={settings.terrainCount}
          onChange={(e) =>
            onUpdateSetting("terrainCount", Number(e.target.value))
          }
        >
          <option value={0}>None</option>
          <option value={1}>1 terrain</option>
          <option value={2}>2 terrains</option>
          <option value={3}>3 terrains</option>
        </select>
      </label>

      <button
        className="generate-button"
        onClick={onGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? "Generating…" : "Generate Encounter"}
      </button>

      {onImportEncounter && (
        <button
          className="import-button"
          onClick={() => setImportOpen(true)}
          style={{ marginTop: '0.5rem', width: '100%' }}
        >
          Import Encounter
        </button>
      )}

      {importOpen && (
        <div className="import-overlay" onClick={() => { setImportOpen(false); setImportText(""); }}>
          <div className="import-card" onClick={(e) => e.stopPropagation()}>
            <h3>Import Encounter</h3>
            <p className="import-hint">Paste encounter text (from "Copy to Clipboard" or a saved file):</p>
            <textarea
              ref={textareaRef}
              className="import-textarea"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste encounter text here..."
              rows={14}
            />
            <div className="import-modal-actions">
              <button className="import-button" onClick={handleImportSubmit} disabled={!importText.trim()}>
                Import
              </button>
              <button className="import-button" onClick={() => { setImportOpen(false); setImportText(""); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
