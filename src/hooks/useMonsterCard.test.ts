import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMonsterCard } from './useMonsterCard';
import type { GeneratedEncounterEntry } from '../types';

const mockMonster: GeneratedEncounterEntry = {
  slotId: 'slot-1',
  monsterId: 'dire-rat',
  monsterName: 'Dire Rat',
  role: 'Brute',
  rank: 'Standard',
  level: 1,
  count: 2,
  source: 'Monster Manual 1',
  page: 219,
  tags: ['Beast'],
  alignment: 'Unaligned',
};

describe('useMonsterCard', () => {
  it('opens modal with correct data for a known monster', () => {
    const { result } = renderHook(() => useMonsterCard());

    act(() => {
      result.current.openCard(mockMonster);
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.selectedMonster).toBe(mockMonster);
    expect(result.current.statBlockHtml).not.toBeNull();
  });

  it('closes modal and clears state', () => {
    const { result } = renderHook(() => useMonsterCard());

    act(() => {
      result.current.openCard(mockMonster);
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.closeCard();
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.selectedMonster).toBeNull();
    expect(result.current.statBlockHtml).toBeNull();
  });

  it('closes modal when Escape key is pressed', () => {
    const { result } = renderHook(() => useMonsterCard());

    act(() => {
      result.current.openCard(mockMonster);
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(result.current.isOpen).toBe(false);
  });
});
