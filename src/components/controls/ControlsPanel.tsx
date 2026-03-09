import type { GeneratorSettings, DuplicatePolicy, EncounterTemplate } from "../../types";

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
}

export function ControlsPanel({
  settings,
  onUpdateSetting,
  onGenerate,
  isGenerating,
  templates,
  availableTags,
}: ControlsPanelProps) {
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

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={settings.includeTerrain}
          onChange={(e) =>
            onUpdateSetting("includeTerrain", e.target.checked)
          }
        />
        Include Terrain
      </label>

      <button
        className="generate-button"
        onClick={onGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? "Generating…" : "Generate Encounter"}
      </button>
    </div>
  );
}
