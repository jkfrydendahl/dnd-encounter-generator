import { describe, it, expect, vi } from 'vitest';
import { scoreMonsterCandidate, type CandidateContext } from './scoreMonsterCandidate';
import { ALIGNMENT_COHERENCE_BONUS, ENVIRONMENT_ALIGNMENT_BONUS } from './constants';
import type { Monster, GeneratedEncounterEntry } from '../types';

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
    alignment: 'Evil',
    themes: [],
    ...overrides,
  };
}

function makeEntry(alignment: string, overrides: Partial<GeneratedEncounterEntry> = {}): GeneratedEncounterEntry {
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
    tags: ['Beast'],
    alignment,
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

describe('scoreMonsterCandidate — alignment coherence (S4-5)', () => {
  it('adds ALIGNMENT_COHERENCE_BONUS when candidate matches majority alignment (S4)', () => {
    const monster = makeMonster({ alignment: 'Evil' });
    const entries = [makeEntry('Evil'), makeEntry('Evil')];
    const withEntries = scoreMonsterCandidate(monster, makeContext({ currentEntries: entries }));
    const withoutEntries = scoreMonsterCandidate(monster, makeContext());
    // The difference should include alignment coherence bonus
    // (also includes tag coherence since both have Beast tag, but that's constant)
    const entriesDiffBaseline = scoreMonsterCandidate(
      makeMonster({ alignment: 'Good' }),
      makeContext({ currentEntries: entries })
    );
    const entriesDiffNoAlign = scoreMonsterCandidate(
      makeMonster({ alignment: 'Good' }),
      makeContext()
    );
    // Monster with matching alignment - monster without matching alignment
    const alignBoost = (withEntries - withoutEntries) - (entriesDiffBaseline - entriesDiffNoAlign);
    expect(alignBoost).toBe(ALIGNMENT_COHERENCE_BONUS);
  });

  it('no coherence bonus when alignment differs from majority (S5)', () => {
    const monster = makeMonster({ alignment: 'Good' });
    const entries = [makeEntry('Evil'), makeEntry('Evil')];
    const withEntries = scoreMonsterCandidate(monster, makeContext({ currentEntries: entries }));
    const withoutEntries = scoreMonsterCandidate(monster, makeContext());
    // Should NOT include alignment coherence bonus — only tag coherence
    const sameTags = scoreMonsterCandidate(
      makeMonster({ alignment: 'Evil' }),
      makeContext({ currentEntries: entries })
    );
    const sameTagsNoCtx = scoreMonsterCandidate(
      makeMonster({ alignment: 'Evil' }),
      makeContext()
    );
    const goodDelta = withEntries - withoutEntries;
    const evilDelta = sameTags - sameTagsNoCtx;
    expect(evilDelta - goodDelta).toBe(ALIGNMENT_COHERENCE_BONUS);
  });
});

describe('scoreMonsterCandidate — environment alignment (S6-7)', () => {
  it('adds ENVIRONMENT_ALIGNMENT_BONUS when monster alignment matches preferred (S6)', () => {
    const monster = makeMonster({ alignment: 'Evil' });
    const withEnvAlign = scoreMonsterCandidate(monster, makeContext({ environmentAlignments: ['Evil', 'Chaotic Evil'] }));
    const withoutEnvAlign = scoreMonsterCandidate(monster, makeContext());
    expect(withEnvAlign - withoutEnvAlign).toBe(ENVIRONMENT_ALIGNMENT_BONUS);
  });

  it('no bonus when alignment not in preferred list (S7)', () => {
    const monster = makeMonster({ alignment: 'Good' });
    const withEnvAlign = scoreMonsterCandidate(monster, makeContext({ environmentAlignments: ['Evil', 'Chaotic Evil'] }));
    const withoutEnvAlign = scoreMonsterCandidate(monster, makeContext());
    expect(withEnvAlign - withoutEnvAlign).toBe(0);
  });
});

describe('scoreMonsterCandidate — Any alignment wildcard (S8-9)', () => {
  it('"Any" alignment matches all for coherence (S8)', () => {
    const monster = makeMonster({ alignment: 'Any' });
    const entries = [makeEntry('Evil'), makeEntry('Evil')];
    // Compare Any vs a non-matching alignment
    const anyScore = scoreMonsterCandidate(monster, makeContext({ currentEntries: entries }));
    const goodScore = scoreMonsterCandidate(
      makeMonster({ alignment: 'Good' }),
      makeContext({ currentEntries: entries })
    );
    expect(anyScore - goodScore).toBe(ALIGNMENT_COHERENCE_BONUS);
  });

  it('"Any" alignment matches all for environment (S9)', () => {
    const monster = makeMonster({ alignment: 'Any' });
    const withEnvAlign = scoreMonsterCandidate(monster, makeContext({ environmentAlignments: ['Evil'] }));
    const withoutEnvAlign = scoreMonsterCandidate(monster, makeContext());
    expect(withEnvAlign - withoutEnvAlign).toBe(ENVIRONMENT_ALIGNMENT_BONUS);
  });
});

describe('scoreMonsterCandidate — alignment stacking & defaults (S10-11)', () => {
  it('alignment bonuses stack with theme + environment tag bonuses (S10)', () => {
    const monster = makeMonster({ tags: ['Beast', 'Fey'], alignment: 'Evil' });
    const entries = [makeEntry('Evil', { tags: ['Beast'] })];

    // Compare with vs without environmentAlignments (holding entries constant)
    const withCoherenceOnly = scoreMonsterCandidate(monster, makeContext({ currentEntries: entries }));
    const withBoth = scoreMonsterCandidate(monster, makeContext({
      currentEntries: entries,
      environmentAlignments: ['Evil'],
    }));

    // Adding env alignments on top of coherence should add exactly ENVIRONMENT_ALIGNMENT_BONUS
    expect(withBoth - withCoherenceOnly).toBe(ENVIRONMENT_ALIGNMENT_BONUS);

    // Verify env alignment alone also works
    const baseline = scoreMonsterCandidate(monster, makeContext());
    const withEnvAlignOnly = scoreMonsterCandidate(monster, makeContext({ environmentAlignments: ['Evil'] }));
    expect(withEnvAlignOnly - baseline).toBe(ENVIRONMENT_ALIGNMENT_BONUS);
  });

  it('no alignment bonus when environmentAlignments is undefined (S11)', () => {
    const monster = makeMonster({ alignment: 'Evil' });
    const score = scoreMonsterCandidate(monster, makeContext());
    const scoreExplicit = scoreMonsterCandidate(monster, makeContext({ environmentAlignments: undefined }));
    expect(score).toBe(scoreExplicit);
  });
});
