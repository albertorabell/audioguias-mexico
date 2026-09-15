import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../utils/ThemeContext';
import { getOptimizedImageUrl, CULTURAL_FALLBACK_SVG } from '../utils/imageOptimizer';

export interface SafeImageProps {
  src?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  onClick?: () => void;
  draggable?: boolean;
  fallbackTitle?: string;
  fallbackSubtitle?: string;
  iconType?: 'museum' | 'pyramid' | 'castle' | 'monolith';
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  imgClassName = '',
  onClick,
  draggable = false,
  fallbackTitle,
  fallbackSubtitle,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isSunMode } = useTheme();

  // Compute optimized URL through proxy to eliminate 403 Forbidden Wikimedia errors
  // and handle incompatible file formats (.pdf, .djvu)
  const resolvedUrl = useMemo(() => {
    return getOptimizedImageUrl(src);
  }, [src]);

  // Reset states when input URL changes
  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  const displayName = fallbackTitle || alt || 'Obra del Acervo';

  if (!src || hasError) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden ${
          isSunMode
            ? 'bg-[#F2ECE4] text-stone-800'
            : 'bg-[#1C1A18] text-stone-200'
        } ${className}`}
        onClick={onClick}
      >
        {/* Archival border framing with cultural graphic */}
        <div className="border border-stone-400/20 dark:border-stone-700/30 p-5 rounded-xl w-full h-full flex flex-col items-center justify-center">
          <p
            className={`font-serif text-sm font-medium tracking-tight max-w-[90%] truncate ${
              isSunMode ? 'text-stone-900' : 'text-stone-100'
            }`}
          >
            {displayName}
          </p>
          <p
            className={`text-[11px] font-sans tracking-wider uppercase mt-1 ${
              isSunMode ? 'text-stone-500' : 'text-stone-400'
            }`}
          >
            {fallbackSubtitle || 'Acervo del Museo'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div
          className={`absolute inset-0 animate-pulse z-10 ${
            isSunMode ? 'bg-stone-200' : 'bg-stone-900'
          }`}
        />
      )}
      <img
        src={resolvedUrl}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        draggable={draggable}
        onLoad={() => setIsLoading(false)}
        onError={(e) => {
          setIsLoading(false);
          // Fallback to cultural SVG if proxy or network fails
          if (e.currentTarget.src !== CULTURAL_FALLBACK_SVG) {
            e.currentTarget.src = CULTURAL_FALLBACK_SVG;
          } else {
            setHasError(true);
          }
        }}
        onClick={onClick}
        className={`w-full h-full object-cover transition duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${imgClassName}`}
      />
    </div>
  );
};
