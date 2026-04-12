import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { filterMonsters } from '../lib/filterMonsters';
import type { Monster } from '../types';

export function useMonsterSearch(monsters: Monster[]) {
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(
    () => filterMonsters(monsters, query),
    [monsters, query]
  );

  const isOpen = query.trim().length > 0;

  const close = useCallback(() => {
    setQuery('');
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, close]);

  return { query, setQuery, results, isOpen, close, containerRef };
}
