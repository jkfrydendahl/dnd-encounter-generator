import { useState, useCallback, useEffect } from 'react';
import { getStatBlock } from '../lib/monsterStatBlocks';
import type { GeneratedEncounterEntry } from '../types';

export function useMonsterCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMonster, setSelectedMonster] = useState<GeneratedEncounterEntry | null>(null);
  const [statBlockHtml, setStatBlockHtml] = useState<string | null>(null);

  const openCard = useCallback((monster: GeneratedEncounterEntry) => {
    setSelectedMonster(monster);
    setStatBlockHtml(getStatBlock(monster.monsterName));
    setIsOpen(true);
  }, []);

  const closeCard = useCallback(() => {
    setIsOpen(false);
    setSelectedMonster(null);
    setStatBlockHtml(null);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCard();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeCard]);

  return { isOpen, selectedMonster, statBlockHtml, openCard, closeCard };
}
