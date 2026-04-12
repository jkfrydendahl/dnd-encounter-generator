import type { Monster } from '../../types';

interface MonsterSearchProps {
  query: string;
  results: Monster[];
  isOpen: boolean;
  onQueryChange: (query: string) => void;
  onSelect: (monster: Monster) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function MonsterSearch({
  query,
  results,
  isOpen,
  onQueryChange,
  onSelect,
  containerRef,
}: MonsterSearchProps) {
  return (
    <div className="monster-search" ref={containerRef}>
      <input
        type="text"
        className="monster-search-input"
        placeholder="Search monsters..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
      />
      {isOpen && (
        <div className="monster-search-dropdown">
          {results.length === 0 ? (
            <div className="monster-search-empty">No monsters found</div>
          ) : (
            <ul className="monster-search-results">
              {results.map((monster) => (
                <li key={monster.id}>
                  <button
                    className="monster-search-result"
                    onClick={() => onSelect(monster)}
                  >
                    <span className="result-name">{monster.name}</span>
                    <span className="result-meta">
                      Lv {monster.level} · {monster.role} · {monster.rank} · {monster.source}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
