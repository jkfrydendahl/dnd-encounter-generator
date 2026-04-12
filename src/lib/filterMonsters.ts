import type { Monster } from '../types';

export function filterMonsters(monsters: Monster[], query: string): Monster[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery === '') return [];
  return monsters.filter((m) => m.name.toLowerCase().includes(normalizedQuery));
}
