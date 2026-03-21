import DOMPurify from 'dompurify';
import type { GeneratedEncounterEntry } from '../../types';

interface MonsterCardModalProps {
  isOpen: boolean;
  statBlockHtml: string | null;
  monster: GeneratedEncounterEntry;
  onClose: () => void;
}

export function MonsterCardModal({ isOpen, statBlockHtml, monster, onClose }: MonsterCardModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="monster-card-backdrop"
      data-testid="modal-backdrop"
      onClick={onClose}
    >
      <div
        className="monster-card-modal"
        data-testid="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="monster-card-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        {statBlockHtml ? (
          <div
            className="monster-card-statblock"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(statBlockHtml) }}
          />
        ) : (
          <div className="monster-card-fallback">
            <h1>{monster.monsterName}</h1>
            <p>Level {monster.level} {monster.rank} {monster.role}</p>
            <p className="monster-card-source">{monster.source}, p. {monster.page}</p>
            <p className="monster-card-no-data">Full stat block not available</p>
          </div>
        )}
      </div>
    </div>
  );
}
