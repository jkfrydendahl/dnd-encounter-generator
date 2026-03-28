import { useState } from 'react';
import DOMPurify from 'dompurify';
import type { GeneratedEncounterEntry } from '../../types';
import type { MonsterImageResolution } from '../../lib/imageTypes';

interface MonsterCardModalProps {
  isOpen: boolean;
  statBlockHtml: string | null;
  monster: GeneratedEncounterEntry;
  imageResolution: MonsterImageResolution | null;
  onClose: () => void;
}

export function MonsterCardModal({ isOpen, statBlockHtml, monster, imageResolution, onClose }: MonsterCardModalProps) {
  const [variantIndex, setVariantIndex] = useState(-1); // -1 = primary
  const [imageError, setImageError] = useState(false);

  if (!isOpen) return null;

  const allImages = imageResolution
    ? [imageResolution.path, ...(imageResolution.variants ?? [])]
    : [];
  const currentIndex = variantIndex === -1 ? 0 : variantIndex;
  const currentImage = allImages[currentIndex] ?? imageResolution?.path;
  const hasMultiple = allImages.length > 1;

  function handlePrev() {
    setImageError(false);
    setVariantIndex((prev) => {
      const idx = prev === -1 ? 0 : prev;
      return idx <= 0 ? allImages.length - 1 : idx - 1;
    });
  }

  function handleNext() {
    setImageError(false);
    setVariantIndex((prev) => {
      const idx = prev === -1 ? 0 : prev;
      return idx >= allImages.length - 1 ? 0 : idx + 1;
    });
  }

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

        {currentImage && !imageError && (
          <div className="monster-card-image-container">
            <img
              className="monster-card-image"
              src={currentImage}
              alt={monster.monsterName}
              onError={() => setImageError(true)}
            />
            {hasMultiple && (
              <div className="monster-card-image-nav">
                <button onClick={handlePrev} aria-label="Previous image">◀</button>
                <span>{currentIndex + 1} / {allImages.length}</span>
                <button onClick={handleNext} aria-label="Next image">▶</button>
              </div>
            )}
          </div>
        )}

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
