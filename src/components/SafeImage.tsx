import React, { useState, useEffect } from 'react';
import { Landmark, Compass, Sparkles, ImageOff } from 'lucide-react';
import { useTheme } from '../utils/ThemeContext';

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
  iconType = 'museum',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isSunMode } = useTheme();

  // Reset error state when src changes
  useEffect(() => {
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  const displayName = fallbackTitle || alt || 'Obra del Acervo';

  if (!src || hasError) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center p-4 text-center select-none overflow-hidden ${
          isSunMode
            ? 'bg-gradient-to-br from-stone-100 via-stone-200 to-amber-50/50 text-stone-800 border border-stone-300'
            : 'bg-gradient-to-br from-stone-900 via-stone-950 to-amber-950/20 text-stone-300 border border-stone-800'
        } ${className}`}
        onClick={onClick}
      >
        {/* Subtle geometric archaeological pattern watermark */}
        <svg
          className="absolute inset-0 w-full h-full opacity-5 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <pattern id="arch-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <polygon points="0,0 10,10 20,0 10,20" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#arch-grid)" />
        </svg>

        {/* Center Icon */}
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2 shadow-inner ${
            isSunMode
              ? 'bg-white border border-stone-300 text-amber-800'
              : 'bg-stone-800/80 border border-stone-700 text-amber-400'
          }`}
        >
          {iconType === 'museum' && <Landmark className="w-6 h-6" />}
          {iconType === 'pyramid' && <Compass className="w-6 h-6" />}
          {iconType === 'castle' && <Sparkles className="w-6 h-6" />}
          {iconType === 'monolith' && <Landmark className="w-6 h-6" />}
        </div>

        {/* Title */}
        <p
          className={`text-xs font-extrabold max-w-[90%] truncate ${
            isSunMode ? 'text-stone-900' : 'text-stone-100'
          }`}
        >
          {displayName}
        </p>

        {/* Subtitle / Status */}
        <p
          className={`text-[10px] font-semibold mt-0.5 flex items-center gap-1 ${
            isSunMode ? 'text-amber-800' : 'text-amber-400'
          }`}
        >
          <ImageOff className="w-3 h-3 inline-block" />
          <span>{fallbackSubtitle || 'Vista esquemática de la pieza'}</span>
        </p>
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
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        draggable={draggable}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        onClick={onClick}
        className={`w-full h-full object-cover transition duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${imgClassName}`}
      />
    </div>
  );
};
