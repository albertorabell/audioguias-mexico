import React, { useState, useEffect } from 'react';
import { getAssetUrl } from '../utils/urlHelper';

export interface PieceImageProps {
  filename?: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
}

export const PieceImage: React.FC<PieceImageProps> = ({
  filename,
  alt = 'Pieza del Museo Nacional de Antropología',
  className = '',
  onClick,
}) => {
  const [hasError, setHasError] = useState(false);

  // Reiniciar estado de error si cambia el filename
  useEffect(() => {
    setHasError(false);
  }, [filename]);

  const cleanFilename = filename?.trim() || '';

  // Determinar la ruta de la imagen usando getAssetUrl para compatibilidad con GitHub Pages
  const imageSrc = cleanFilename
    ? cleanFilename.startsWith('http://') ||
      cleanFilename.startsWith('https://') ||
      cleanFilename.startsWith('data:')
      ? cleanFilename
      : getAssetUrl(
          cleanFilename.startsWith('images/') || cleanFilename.startsWith('/images/')
            ? cleanFilename
            : `images/pieces/${cleanFilename}`
        )
    : '';

  if (!cleanFilename || hasError) {
    return (
      <div
        id="piece-image-fallback"
        onClick={onClick}
        className={`w-full h-full min-h-[220px] flex flex-col items-center justify-center p-6 text-center bg-stone-200 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-2xl select-none transition-colors ${
          onClick ? 'cursor-pointer' : ''
        } ${className}`}
      >
        <div className="w-16 h-16 rounded-full bg-stone-300/80 dark:bg-stone-700/80 flex items-center justify-center text-3xl mb-3 shadow-inner">
          <span role="img" aria-label="Monumento">
            🏛️
          </span>
        </div>
        <p className="font-serif text-sm sm:text-base font-semibold text-stone-800 dark:text-stone-200 tracking-tight">
          Museo Nacional de Antropología
        </p>
        <span className="text-[11px] font-sans text-stone-500 dark:text-stone-400 mt-1 uppercase tracking-widest font-medium">
          Colección Nacional
        </span>
      </div>
    );
  }

  return (
    <div
      id="piece-image-container"
      onClick={onClick}
      className={`relative w-full h-full overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <img
        src={imageSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
      />
    </div>
  );
};

export default PieceImage;
