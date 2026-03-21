import { describe, it, expect, vi } from 'vitest';
import { scoreMonsterCandidate, type CandidateContext } from './scoreMonsterCandidate';
import { ENVIRONMENT_BONUS } from './constants';
import type { Monster } from '../types';

// Deterministic tests: stub Math.random
vi.spyOn(Math, 'random').mockReturnValue(0);

function makeMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: 'm1',
    name: 'Test Beast',
    level: 5,
    role: 'Skirmisher',
    rank: 'Standard',
    source: 'test',
    page: 0,
    tags: ['Beast'],
    alignment: 'Unaligned',
    themes: [],
    ...overrides,
  };
}

function makeContext(overrides: Partial<CandidateContext> = {}): CandidateContext {
  return {
    currentEntries: [],
    targetLevel: 5,
    duplicatePolicy: 'allow' as const,
    ...overrides,
  };
}

describe('scoreMonsterCandidate — environment', () => {
  it('adds ENVIRONMENT_BONUS per matching tag when environment tags are provided', () => {
    const monster = makeMonster({ tags: ['Beast', 'Fey'] });
    const withEnv = scoreMonsterCandidate(monster, makeContext({ environmentTags: ['Beast', 'Fey', 'Plant'] }));
    const withoutEnv = scoreMonsterCandidate(monster, makeContext());
    expect(withEnv - withoutEnv).toBe(ENVIRONMENT_BONUS * 2);
  });

  it('adds nothing when monster has no matching environment tags', () => {
    const monster = makeMonster({ tags: ['Undead'] });
    const withEnv = scoreMonsterCandidate(monster, makeContext({ environmentTags: ['Beast', 'Fey'] }));
    const withoutEnv = scoreMonsterCandidate(monster, makeContext());
    expect(withEnv - withoutEnv).toBe(0);
  });

  it('stacks with themeTag bonus', () => {
    const monster = makeMonster({ tags: ['Beast', 'Fey'] });
    const envOnly = scoreMonsterCandidate(monster, makeContext({ environmentTags: ['Beast'] }));
    const themeOnly = scoreMonsterCandidate(monster, makeContext({ themeTag: 'Beast' }));
    const both = scoreMonsterCandidate(monster, makeContext({ environmentTags: ['Beast'], themeTag: 'Fey' }));
    const baseline = scoreMonsterCandidate(monster, makeContext());
    // both should be strictly greater than either alone
    expect(both).toBeGreaterThan(envOnly);
    expect(both).toBeGreaterThan(themeOnly);
    expect(both - baseline).toBeGreaterThan(envOnly - baseline);
  });

  it('adds nothing when environmentTags is undefined (default behavior)', () => {
    const monster = makeMonster({ tags: ['Beast'] });
    const score = scoreMonsterCandidate(monster, makeContext());
    const scoreExplicit = scoreMonsterCandidate(monster, makeContext({ environmentTags: undefined }));
    expect(score).toBe(scoreExplicit);
  });
});
