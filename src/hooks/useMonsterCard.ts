import { useState, useCallback, useEffect } from 'react';
import { getStatBlock } from '../lib/monsterStatBlocks';
import { resolveMonsterImage } from '../lib/resolveMonsterImage';
import type { MonsterImageResolution } from '../lib/imageTypes';
import type { GeneratedEncounterEntry } from '../types';

import imageIndex from '../data/monsterImageIndex.json';
import imageOverrides from '../data/monsterImageOverrides.json';
import imageFallbacks from '../data/monsterFallbacks.json';

import type { MonsterImageEntry, MonsterImageOverride, MonsterFallbackMap } from '../lib/imageTypes';

const typedIndex = imageIndex as MonsterImageEntry[];
const typedOverrides = imageOverrides as MonsterImageOverride;
const typedFallbacks = imageFallbacks as MonsterFallbackMap;

export function useMonsterCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMonster, setSelectedMonster] = useState<GeneratedEncounterEntry | null>(null);
  const [statBlockHtml, setStatBlockHtml] = useState<string | null>(null);
  const [imageResolution, setImageResolution] = useState<MonsterImageResolution | null>(null);

  const openCard = useCallback((monster: GeneratedEncounterEntry) => {
    setSelectedMonster(monster);
    setStatBlockHtml(getStatBlock(monster.monsterName));
    setImageResolution(
      resolveMonsterImage(
        { id: monster.monsterId ?? '', name: monster.monsterName, role: monster.role, tags: monster.tags },
        typedIndex,
        typedOverrides,
        typedFallbacks
      )
    );
    setIsOpen(true);
  }, []);

  const closeCard = useCallback(() => {
    setIsOpen(false);
    setSelectedMonster(null);
    setStatBlockHtml(null);
    setImageResolution(null);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCard();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeCard]);

  return { isOpen, selectedMonster, statBlockHtml, imageResolution, openCard, closeCard };
}
