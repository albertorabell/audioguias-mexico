import React, { useState, useEffect, useMemo } from 'react';
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
        className={`w-full h-full min-h-[90px] relative overflow-hidden flex flex-col items-center justify-center p-3 text-center select-none rounded-2xl border border-white/10 bg-[#141419] dark:bg-[#141419] transition-all duration-300 ${
          onClick ? 'cursor-pointer hover:border-amber-500/40 active:scale-[0.99]' : ''
        } ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#1c1c24] via-[#141419] to-[#0d0d12] pointer-events-none opacity-80" />

        <div className="relative z-10 w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-[#1f1f2a] border border-white/10 flex items-center justify-center mb-1.5 shadow-md">
          <span className="text-xl sm:text-2xl select-none" role="img" aria-label={t.glyphAria}>
            🏛️
          </span>
        </div>

        <div className="relative z-10 max-w-sm px-1 space-y-0.5">
          <p className="font-serif font-bold text-xs sm:text-sm text-stone-100 tracking-tight line-clamp-1 leading-snug">
            {displayTitle}
          </p>
          {roomName && (
            <span className="text-[9px] uppercase font-bold tracking-wider text-amber-400 block truncate">
              {roomName}
            </span>
          )}
          <span className="text-[10px] text-stone-400 font-medium block pt-0.5">
            {t.photoSoon}
          </span>
        </div>
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
