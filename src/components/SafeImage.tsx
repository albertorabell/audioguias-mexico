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
  loading?: 'eager' | 'lazy';
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
  loading = 'lazy',
}) => {
  const [hasError, setHasError] = useState(false);
  const { isSunMode } = useTheme();

  // Compute optimized URL through proxy to eliminate 403 Forbidden Wikimedia errors
  // and handle incompatible file formats (.pdf, .djvu)
  const resolvedUrl = useMemo(() => {
    return getOptimizedImageUrl(src);
  }, [src]);

  // Reset states when input URL changes
  useEffect(() => {
    setHasError(false);
  }, [src]);

  const displayName = fallbackTitle || alt || 'Obra del Acervo';

  if (!src || hasError) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden ${
          isSunMode
            ? 'bg-gradient-to-br from-[#F5EFEB] via-[#EFE7DD] to-[#E3D9CC] text-stone-800'
            : 'bg-gradient-to-br from-[#241E1C] via-[#1A1816] to-[#121110] text-stone-200'
        } ${className}`}
        onClick={onClick}
      >
        {/* Archival border framing with cultural graphic fallback */}
        <div className="border border-stone-400/20 dark:border-stone-700/30 p-5 rounded-xl w-full h-full flex flex-col items-center justify-center">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2 bg-stone-500/10 text-[#C05638] dark:text-[#D96B47]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 3v4" />
              <path d="M12 17v4" />
              <path d="M3 12h4" />
              <path d="M17 12h4" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
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
      <img
        src={resolvedUrl}
        alt={alt}
        referrerPolicy="no-referrer"
        loading={loading}
        draggable={draggable}
        onError={(e) => {
          // Fallback to cultural SVG if proxy or network fails
          if (e.currentTarget.src !== CULTURAL_FALLBACK_SVG) {
            e.currentTarget.src = CULTURAL_FALLBACK_SVG;
          } else {
            setHasError(true);
          }
        }}
        onClick={onClick}
        className={`w-full h-full object-cover ${imgClassName}`}
      />
    </div>
  );
};
