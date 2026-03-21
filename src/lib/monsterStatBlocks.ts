import statblocks from '../data/statblocks.json';

const statblockMap = new Map<string, string>(
  Object.entries(statblocks).map(([name, html]) => [name.toLowerCase(), html])
);

export function getStatBlock(monsterName: string): string | null {
  return statblockMap.get(monsterName.toLowerCase()) ?? null;
}
