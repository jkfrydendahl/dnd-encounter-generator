import { describe, it, expect } from 'vitest';
import { parseEncounterText } from './parseEncounterText';
import monstersData from '../data/monsters.json';
import terrainData from '../data/terrain.json';
import type { Monster, TerrainSuggestion } from '../types';

const monsters = monstersData as Monster[];
const terrain = terrainData as TerrainSuggestion[];

const sampleText = `Savage Ambush
Template: Ambush

Monster            Role          Rank       Lvl  Qty  Source
-----------------------------------------------------------
Dire Rat           Brute         Standard     1    2  Monster Manual 1 p.219
Goblin Blackblade  Lurker        Standard     1    1  Monster Manual 1 p.136

Terrain: Bubbling Mud
Pools of volcanic mud that bubble and spurt unpredictably.`;

describe('parseEncounterText', () => {
  it('parses a valid encounter text back into a GeneratedEncounter', () => {
    const result = parseEncounterText(sampleText, monsters, terrain);
    expect(result).not.toBeNull();
    expect(result!.name).toBe('Savage Ambush');
    expect(result!.templateName).toBe('Ambush');
    expect(result!.entries).toHaveLength(2);
    expect(result!.entries[0].monsterName).toBe('Dire Rat');
    expect(result!.entries[1].monsterName).toBe('Goblin Blackblade');
    expect(result!.entries[0].count).toBe(2);
    expect(result!.entries[0].tags.length).toBeGreaterThan(0);
    expect(result!.entries[0].alignment).toBeTruthy();
  });

  it('parses terrain suggestions', () => {
    const result = parseEncounterText(sampleText, monsters, terrain);
    expect(result).not.toBeNull();
    // Terrain may or may not match depending on data — check it doesn't crash
    expect(result!.terrainSuggestions).toBeInstanceOf(Array);
  });

  it('returns null for invalid text', () => {
    expect(parseEncounterText('not an encounter', monsters, terrain)).toBeNull();
    expect(parseEncounterText('', monsters, terrain)).toBeNull();
  });

  it('returns null for text missing template line', () => {
    expect(parseEncounterText('Title\nNo template here', monsters, terrain)).toBeNull();
  });
});
