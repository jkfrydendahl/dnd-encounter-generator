import DOMPurify from 'dompurify';
import type { PinnedCard } from '../../hooks/usePinnedCards';

interface PinnedCardsSectionProps {
  pinnedCards: PinnedCard[];
  isOpen: boolean;
  onToggleSection: () => void;
  onUnpin: (monsterName: string) => void;
  onClear: () => void;
}

export function PinnedCardsSection({
  pinnedCards,
  isOpen,
  onToggleSection,
  onUnpin,
  onClear,
}: PinnedCardsSectionProps) {
  if (pinnedCards.length === 0) return null;

  return (
    <div className="pinned-cards-section">
      <div className="pinned-cards-header" onClick={onToggleSection}>
        <h3>
          <span className={`pinned-cards-chevron ${isOpen ? 'open' : ''}`}>▶</span>
          Pinned Stat Blocks ({pinnedCards.length})
        </h3>
        {isOpen && (
          <button
            className="pinned-cards-clear"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            title="Unpin all"
          >
            Clear All
          </button>
        )}
      </div>

      {isOpen && (
        <div className="pinned-cards-grid">
          {pinnedCards.map((card) => (
            <div key={card.monster.monsterName} className="pinned-card">
              <button
                className="pinned-card-unpin"
                onClick={() => onUnpin(card.monster.monsterName)}
                title="Unpin"
                aria-label={`Unpin ${card.monster.monsterName}`}
              >
                ✕
              </button>
              {card.statBlockHtml ? (
                <div
                  className="monster-card-statblock"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(card.statBlockHtml) }}
                />
              ) : (
                <div className="monster-card-fallback">
                  <h1>{card.monster.monsterName}</h1>
                  <p>Level {card.monster.level} {card.monster.rank} {card.monster.role}</p>
                  <p className="monster-card-source">{card.monster.source}, p. {card.monster.page}</p>
                  <p className="monster-card-no-data">Full stat block not available</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
