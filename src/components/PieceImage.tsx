import React, { useState, useEffect, useMemo } from 'react';
import { getAssetUrl, PIECE_ALIASES } from '../utils/urlHelper';

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
  alt = 'Pieza del Museo Nacional de Antropología',
  className = '',
  onClick,
  pieceTitle,
  title,
  roomName,
}) => {
  const rawTarget = (filename || imageFilename || src || '').trim();
  const [attemptIndex, setAttemptIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Reiniciar intentos de carga si cambia el archivo o pieceId
  useEffect(() => {
    setAttemptIndex(0);
    setHasError(false);
  }, [rawTarget, pieceId]);

  // Construir lista de candidatos con diferentes rutas y extensiones (.webp, .png, .jpg)
  const candidateUrls = useMemo<string[]>(() => {
    const urls: string[] = [];

    // Resolver ID canónico si existe
    const cleanPieceId = (pieceId || '').trim();
    const canonicalId = cleanPieceId ? (PIECE_ALIASES[cleanPieceId] || cleanPieceId) : '';

    // 1. Si es URL externa (ej. Wikimedia Commons o CDN)
    if (
      rawTarget.startsWith('http://') ||
      rawTarget.startsWith('https://') ||
      rawTarget.startsWith('data:')
    ) {
      urls.push(rawTarget);

      // Si además tenemos pieceId o un nombre deducible, agregar respaldo local en caso de que Wikimedia falle o dé 403
      if (canonicalId) {
        urls.push(getAssetUrl(`images/pieces/${canonicalId}.webp`));
        urls.push(getAssetUrl(`images/pieces/${canonicalId}.png`));
      }
      return Array.from(new Set(urls));
    }

    // 2. Si viene una ruta local o nombre de archivo
    if (rawTarget) {
      const cleanPath = rawTarget
        .replace(/^\/?(public\/)?/, '')
        .replace(/^\/?(images\/pieces\/)?/, '')
        .replace(/^\.\//, '');

      const extMatch = cleanPath.match(/\.(webp|png|jpg|jpeg)$/i);
      const baseName = extMatch ? cleanPath.replace(/\.(webp|png|jpg|jpeg)$/i, '') : cleanPath;
      const currentExt = extMatch ? extMatch[0].toLowerCase() : '';

      // Primero probar con la extensión provista
      urls.push(getAssetUrl(`images/pieces/${cleanPath}`));

      // Alternar .webp y .png
      if (currentExt === '.webp') {
        urls.push(getAssetUrl(`images/pieces/${baseName}.png`));
        urls.push(getAssetUrl(`images/pieces/${baseName}.jpg`));
      } else if (currentExt === '.png') {
        urls.push(getAssetUrl(`images/pieces/${baseName}.webp`));
        urls.push(getAssetUrl(`images/pieces/${baseName}.jpg`));
      } else {
        urls.push(getAssetUrl(`images/pieces/${baseName}.webp`));
        urls.push(getAssetUrl(`images/pieces/${baseName}.png`));
        urls.push(getAssetUrl(`images/pieces/${baseName}.jpg`));
      }
    }

    // 3. Respaldo por pieceId si aún no está cubierto
    if (canonicalId) {
      urls.push(getAssetUrl(`images/pieces/${canonicalId}.webp`));
      urls.push(getAssetUrl(`images/pieces/${canonicalId}.png`));
      urls.push(getAssetUrl(`images/pieces/${canonicalId}.jpg`));
    }

    // Retornar lista deduplicada y sin cadenas vacías
    return Array.from(new Set(urls.filter(Boolean)));
  }, [rawTarget, pieceId]);

  const currentSrc = candidateUrls[attemptIndex] || '';

  const handleImageError = () => {
    if (attemptIndex + 1 < candidateUrls.length) {
      setAttemptIndex((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  const displayTitle = pieceTitle || title || alt || 'Pieza del Museo Nacional de Antropología';

  // Si no se proporcionó archivo y no hay candidatos, o todos los intentos fallaron
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
        aria-label={`Respaldo visual para ${displayTitle}`}
        className={`w-full h-full min-h-[90px] relative overflow-hidden flex flex-col items-center justify-center p-3 text-center select-none rounded-2xl border border-white/10 bg-[#141419] transition-all duration-300 ${
          onClick ? 'cursor-pointer hover:border-[#F59E0B]/40 active:scale-[0.99]' : ''
        } ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#1c1c24] via-[#141419] to-[#0d0d12] pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="relative z-10 w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#1a1a24] to-[#252532] border border-white/10 flex items-center justify-center mb-1.5 shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
          <span className="text-xl sm:text-3xl select-none" role="img" aria-label="Glifo arqueológico">
            🏛️
          </span>
          <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-[#F59E0B]/5 ring-1 ring-[#F59E0B]/20 pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-sm px-1">
          <p className="font-serif font-bold text-xs sm:text-sm text-white tracking-tight line-clamp-1 leading-snug drop-shadow-sm">
            {displayTitle}
          </p>
          <div className="flex items-center justify-center gap-1 mt-0.5 text-[9px] uppercase font-bold tracking-wider text-[#F59E0B]">
            <span>{roomName || 'MNA'}</span>
          </div>
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
        alt={alt}
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
