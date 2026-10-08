import React, { useState, useEffect, useMemo } from 'react';
import { Landmark } from 'lucide-react';
import { resolvePieceImageCandidates } from '../utils/urlHelper';
import { useStrings } from '../utils/LanguageContext';

export interface PieceImageProps {
  filename?: string;
  imageFilename?: string;
  src?: string;
  pieceId?: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
  pieceTitle?: string;
  title?: string;
  roomName?: string;
}

export const PieceImage: React.FC<PieceImageProps> = ({
  filename,
  imageFilename,
  src,
  pieceId,
  alt,
  className = '',
  onClick,
  pieceTitle,
  title,
  roomName,
}) => {
  const strings = useStrings();
  const t = strings.media;
  const rawTarget = (filename || imageFilename || src || '').trim();
  const [attemptIndex, setAttemptIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Reiniciar intentos de carga si cambia el archivo o pieceId
  useEffect(() => {
    setAttemptIndex(0);
    setHasError(false);
  }, [rawTarget, pieceId]);

  // Lista unificada de candidatos usando resolvePieceImageCandidates
  const candidateUrls = useMemo<string[]>(() => {
    return resolvePieceImageCandidates(rawTarget, pieceId);
  }, [rawTarget, pieceId]);

  const currentSrc = candidateUrls[attemptIndex] || '';

  const handleImageError = () => {
    if (attemptIndex + 1 < candidateUrls.length) {
      setAttemptIndex((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  const displayTitle = pieceTitle || title || alt || strings.piece.defaultTitle;

  // Si no se proporcionó archivo y no hay candidatos, o todos los intentos fallaron:
  // Mostrar ícono cultural con texto discreto "Foto próximamente", NUNCA un cuadro roto.
  if ((!rawTarget && candidateUrls.length === 0) || hasError || !currentSrc) {
    return (
      <div
        id="piece-image-fallback"
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onKeyDown={(e) => {
          if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onClick();
          }
        }}
        aria-label={t.fallbackAria(displayTitle)}
        className={`@container w-full h-full relative overflow-hidden flex flex-col items-center justify-center p-2 text-center select-none bg-raised text-ink-3 ${
          onClick ? 'cursor-pointer' : ''
        } ${className}`}
      >
        <Landmark className="w-[38%] max-w-12 h-auto opacity-60" strokeWidth={1.4} aria-hidden="true" />
        <span className="hidden @min-[160px]:block mt-2 text-cap font-semibold text-ink-2 line-clamp-1 max-w-full">{displayTitle}</span>
        <span className="hidden @min-[160px]:block text-[12px]">{t.photoSoon}</span>
      </div>
    );
  }

  return (
    <div
      id="piece-image-container"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`relative w-full h-full overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <img
        src={currentSrc}
        alt={alt ?? t.defaultAlt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={handleImageError}
        className="w-full h-full object-cover transition-transform duration-500 will-change-transform"
      />
    </div>
  );
};

export default PieceImage;
