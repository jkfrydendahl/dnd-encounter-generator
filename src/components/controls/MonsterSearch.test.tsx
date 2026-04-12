import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MonsterSearch } from './MonsterSearch';
import type { Monster } from '../../types';

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

function renderSearch(overrides: Partial<Parameters<typeof MonsterSearch>[0]> = {}) {
  const defaultProps = {
    query: '',
    results: [] as Monster[],
    isOpen: false,
    onQueryChange: vi.fn(),
    onSelect: vi.fn(),
    containerRef: { current: null } as React.RefObject<HTMLDivElement | null>,
    ...overrides,
  };
  return { ...render(<MonsterSearch {...defaultProps} />), props: defaultProps };
}

describe('MonsterSearch', () => {
  it('renders a search input with placeholder', () => {
    renderSearch();
    expect(screen.getByPlaceholderText('Search monsters...')).toBeInTheDocument();
  });

  it('shows results when isOpen and results exist', () => {
    renderSearch({ isOpen: true, results: testMonsters, query: 'rat' });
    expect(screen.getByText('Dire Rat')).toBeInTheDocument();
    expect(screen.getByText('Goblin Cutter')).toBeInTheDocument();
  });

  it('shows "No monsters found" when isOpen with empty results', () => {
    renderSearch({ isOpen: true, results: [], query: 'zzz' });
    expect(screen.getByText('No monsters found')).toBeInTheDocument();
  });

  it('hides dropdown when isOpen is false', () => {
    renderSearch({ isOpen: false, results: testMonsters });
    expect(screen.queryByText('Dire Rat')).not.toBeInTheDocument();
  });

  it('fires onSelect with the correct monster when a result is clicked', async () => {
    const user = userEvent.setup();
    const { props } = renderSearch({ isOpen: true, results: testMonsters, query: 'rat' });
    await user.click(screen.getByText('Dire Rat'));
    expect(props.onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Dire Rat' })
    );
  });
});
