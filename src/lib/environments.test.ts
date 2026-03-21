import { describe, it, expect } from 'vitest';
import environmentsData from '../data/environments.json';
import monstersData from '../data/monsters.json';
import type { Environment, Monster } from '../types';

const environments = environmentsData as Environment[];
const monsters = monstersData as Monster[];

describe('environments data', () => {
  it('should have 12 environments each with id, label, and tags', () => {
    expect(environments).toHaveLength(12);
    for (const env of environments) {
      expect(env.id).toBeTruthy();
      expect(env.label).toBeTruthy();
      expect(env.tags).toBeInstanceOf(Array);
      expect(env.tags.length).toBeGreaterThan(0);
    }
  });

  it('should only use tags that exist on actual monsters', () => {
    const allMonsterTags = new Set(monsters.flatMap((m) => m.tags));
    for (const env of environments) {
      for (const tag of env.tags) {
        expect(allMonsterTags.has(tag), `Tag "${tag}" from env "${env.id}" not found on any monster`).toBe(true);
      }
    }
  });
});
