import { describe, it, expect } from 'vitest';
import { getStatBlock } from './monsterStatBlocks';

describe('monsterStatBlocks', () => {
  describe('getStatBlock', () => {
    it('returns HTML string for a known monster', () => {
      const result = getStatBlock('Dire Rat');
      expect(result).not.toBeNull();
      expect(result).toContain('class=monster');
    });

    it('returns null for an unknown monster', () => {
      const result = getStatBlock('Nonexistent Monster');
      expect(result).toBeNull();
    });

    it('is case-insensitive', () => {
      const lower = getStatBlock('dire rat');
      const upper = getStatBlock('DIRE RAT');
      expect(lower).not.toBeNull();
      expect(upper).not.toBeNull();
      expect(lower).toBe(upper);
    });
  });
});
