import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMonsterSearch } from './useMonsterSearch';
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
];

describe('useMonsterSearch', () => {
  it('opens dropdown with results when query is non-empty', () => {
    const { result } = renderHook(() => useMonsterSearch(testMonsters));

    act(() => {
      result.current.setQuery('rat');
    });

    expect(result.current.isOpen).toBe(true);
    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].name).toBe('Dire Rat');
  });

  it('closes dropdown when query is cleared', () => {
    const { result } = renderHook(() => useMonsterSearch(testMonsters));

    act(() => {
      result.current.setQuery('rat');
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.setQuery('');
    });
    expect(result.current.isOpen).toBe(false);
    expect(result.current.results).toHaveLength(0);
  });

  it('closes dropdown and clears query on Escape key', () => {
    const { result } = renderHook(() => useMonsterSearch(testMonsters));

    act(() => {
      result.current.setQuery('rat');
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.query).toBe('');
  });
});
