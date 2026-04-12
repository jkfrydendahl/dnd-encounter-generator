import { describe, it, expect } from 'vitest';
import { filterMonsters } from './filterMonsters';
import type { Monster } from '../types';

const testMonsters: Monster[] = [
  {
    id: 'dire-rat',
    name: 'Dire Rat',
    level: 1,
    role: 'Brute',
    rank: 'Standard',
    source: 'Monster Manual 1',
    page: 219,
    tags: ['Beast'],
    alignment: 'Unaligned',
  },
  {
    id: 'goblin-cutter',
    name: 'Goblin Cutter',
    level: 1,
    role: 'Minion',
    rank: 'Standard',
    source: 'Monster Manual 1',
    page: 136,
    tags: ['Goblinoid'],
    alignment: 'Evil',
  },
  {
    id: 'fire-beetle',
    name: 'Fire Beetle',
    level: 1,
    role: 'Brute',
    rank: 'Standard',
    source: 'Monster Manual 1',
    page: 30,
    tags: ['Beast'],
    alignment: 'Unaligned',
  },
];

describe('filterMonsters', () => {
  it('returns monsters whose name contains the query substring', () => {
    const result = filterMonsters(testMonsters, 'rat');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Dire Rat');
  });

  it('matches case-insensitively', () => {
    const result = filterMonsters(testMonsters, 'dire rat');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Dire Rat');
  });

  it('returns empty array for empty query', () => {
    const result = filterMonsters(testMonsters, '');
    expect(result).toHaveLength(0);
  });

  it('returns empty array when no monsters match', () => {
    const result = filterMonsters(testMonsters, 'xyznonexistent');
    expect(result).toHaveLength(0);
  });
});
