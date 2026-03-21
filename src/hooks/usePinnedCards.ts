import { useState, useCallback } from 'react';
import { getStatBlock } from '../lib/monsterStatBlocks';
import type { GeneratedEncounterEntry } from '../types';

export interface PinnedCard {
  monster: GeneratedEncounterEntry;
  statBlockHtml: string | null;
}

export function usePinnedCards() {
  const [pinnedCards, setPinnedCards] = useState<PinnedCard[]>([]);
  const [isSectionOpen, setIsSectionOpen] = useState(true);

  const isPinned = useCallback(
    (monsterName: string) => pinnedCards.some((c) => c.monster.monsterName === monsterName),
    [pinnedCards]
  );

  const togglePin = useCallback((monster: GeneratedEncounterEntry) => {
    setPinnedCards((prev) => {
      const exists = prev.find((c) => c.monster.monsterName === monster.monsterName);
      if (exists) {
        return prev.filter((c) => c.monster.monsterName !== monster.monsterName);
      }
      return [...prev, { monster, statBlockHtml: getStatBlock(monster.monsterName) }];
    });
  }, []);

  const unpinCard = useCallback((monsterName: string) => {
    setPinnedCards((prev) => prev.filter((c) => c.monster.monsterName !== monsterName));
  }, []);

  const clearPinned = useCallback(() => {
    setPinnedCards([]);
  }, []);

  const toggleSection = useCallback(() => {
    setIsSectionOpen((prev) => !prev);
  }, []);

  return { pinnedCards, isSectionOpen, isPinned, togglePin, unpinCard, clearPinned, toggleSection };
}
