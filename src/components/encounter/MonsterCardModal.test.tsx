import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MonsterCardModal } from './MonsterCardModal';
import type { GeneratedEncounterEntry } from '../../types';

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

const sampleHtml= '<h1 class=monster>Dire Rat</h1><table class=bodytable><tr><td><b>HP</b> 38</td></tr></table>';

describe('MonsterCardModal', () => {
  it('renders stat block HTML when open', () => {
    render(
      <MonsterCardModal
        isOpen={true}
        statBlockHtml={sampleHtml}
        monster={mockMonster}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('HP')).toBeInTheDocument();
  });

  it('renders fallback card when no stat block available', () => {
    render(
      <MonsterCardModal
        isOpen={true}
        statBlockHtml={null}
        monster={mockMonster}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Dire Rat')).toBeInTheDocument();
    expect(screen.getByText(/Level 1/)).toBeInTheDocument();
    expect(screen.getByText(/Brute/)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <MonsterCardModal
        isOpen={false}
        statBlockHtml={sampleHtml}
        monster={mockMonster}
        onClose={vi.fn()}
      />
    );

    expect(container.innerHTML).toBe('');
  });

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn();
    render(
      <MonsterCardModal
        isOpen={true}
        statBlockHtml={sampleHtml}
        monster={mockMonster}
        onClose={onClose}
      />
    );

    const backdrop = screen.getByTestId('modal-backdrop');
    await userEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not call onClose when content is clicked', async () => {
    const onClose = vi.fn();
    render(
      <MonsterCardModal
        isOpen={true}
        statBlockHtml={sampleHtml}
        monster={mockMonster}
        onClose={onClose}
      />
    );

    const content = screen.getByTestId('modal-content');
    await userEvent.click(content);
    expect(onClose).not.toHaveBeenCalled();
  });
});
