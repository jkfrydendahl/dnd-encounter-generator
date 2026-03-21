import { describe, it, expect } from 'vitest';
import monstersData from '../data/monsters.json';
import type { Monster } from '../types';

const monsters = monstersData as Monster[];

const VALID_ALIGNMENTS = ['Unaligned', 'Evil', 'Chaotic Evil', 'Any', 'Good', 'Lawful Good'];

describe('monster alignment data', () => {
  it('every monster has a valid alignment field (S1)', () => {
    for (const m of monsters) {
      expect(VALID_ALIGNMENTS, `Monster "${m.name}" has invalid alignment: "${m.alignment}"`).toContain(m.alignment);
    }
  });

  it('alignment values are title-cased (S2)', () => {
    for (const m of monsters) {
      // Should never have lowercase-only like "evil" or "chaotic evil"
      expect(m.alignment).not.toMatch(/^[a-z]/);
    }
  });
});
