import { describe, it, expect, vi } from 'vitest';
import { selectTerrains } from './generateEncounter';
import { getEnvironmentTags } from './environmentLookup';
import type { GeneratedEncounterEntry, TerrainSuggestion } from '../types';

// Suppress random noise for deterministic tests
vi.spyOn(Math, 'random').mockReturnValue(0);

function makeTerrain(id: string, tags: string[]): TerrainSuggestion {
  return { id, name: id, description: '', tags };
}

function makeEntry(tags: string[], themes: string[] = []): GeneratedEncounterEntry {
  return {
    slotId: 's1',
    monsterId: 'm1',
    monsterName: 'Test',
    role: 'Skirmisher',
    rank: 'Standard',
    level: 5,
    count: 1,
    source: 'test',
    page: 0,
    tags,
    themes,
  };
}

describe('selectTerrains — environment boost', () => {
  it('prefers terrains matching environment tags over others', () => {
    const terrains = [
      makeTerrain('desert', ['Fire', 'Elemental']),
      makeTerrain('forest', ['Fey', 'Beast', 'Plant']),
      makeTerrain('cave', ['Shadow', 'Aberration']),
    ];
    // Entries with no overlapping tags — baseline would be ~equal
    const entries = [makeEntry(['Humanoid'])];

    // With forest environment tags, forest terrain should rank first
    const result = selectTerrains(terrains, entries, 2, ['Fey', 'Beast', 'Plant']);
    expect(result[0].id).toBe('forest');
  });

  it('stacks environment boost with monster tag overlap', () => {
    const terrains = [
      makeTerrain('desert', ['Fire', 'Elemental']),
      makeTerrain('forest', ['Fey', 'Beast', 'Plant']),
    ];
    // Entry has Beast tag — overlap with forest
    // Environment also forest → double boost for forest
    const entries = [makeEntry(['Beast'])];
    const result = selectTerrains(terrains, entries, 1, ['Fey', 'Beast', 'Plant']);
    expect(result[0].id).toBe('forest');
  });

  it('ignores environment when environmentTags is undefined', () => {
    const terrains = [
      makeTerrain('a', ['Fire']),
      makeTerrain('b', ['Cold']),
    ];
    const entries = [makeEntry(['Fire'])];
    // Without environment, 'a' wins by tag overlap
    const result = selectTerrains(terrains, entries, 1);
    expect(result[0].id).toBe('a');
  });
});

describe('getEnvironmentTags', () => {
  it('returns tags for a valid environment id', () => {
    const tags = getEnvironmentTags('forest');
    expect(tags).toEqual(['Fey', 'Beast', 'Plant']);
  });

  it('returns empty array for undefined', () => {
    expect(getEnvironmentTags(undefined)).toEqual([]);
  });

  it('returns empty array for unknown id', () => {
    expect(getEnvironmentTags('nonexistent')).toEqual([]);
  });
});
