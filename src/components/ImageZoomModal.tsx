import React, { useState, useEffect, useMemo } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Landmark, ImageOff } from 'lucide-react';
import { resolvePieceImageCandidates } from '../utils/urlHelper';
import { useTheme } from '../utils/ThemeContext';
import { useStrings } from '../utils/LanguageContext';

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  pieceId?: string;
  title: string;
  subtitle?: string;
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  pieceId,
  title,
  subtitle,
}) => {
  const { isSunMode } = useTheme();
  const t = useStrings().media;
  const [scale, setScale] = useState(1);
  const [attemptIndex, setAttemptIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Reiniciar estado al abrir modal o cambiar de imagen
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setAttemptIndex(0);
      setHasError(false);
    }
  }, [isOpen, imageUrl, pieceId]);

  // Lista unificada de candidatos usando la misma ruta y resolución que PieceImage
  const candidateUrls = useMemo<string[]>(() => {
    return resolvePieceImageCandidates(imageUrl, pieceId);
  }, [imageUrl, pieceId]);

  const currentSrc = candidateUrls[attemptIndex] || '';

  if (!isOpen) return null;

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.5, 3.5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.5, 1));
  const handleReset = () => setScale(1);

  const handleImageError = () => {
    if (attemptIndex + 1 < candidateUrls.length) {
      setAttemptIndex((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  return (
    <div
      id="modal-image-zoom"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between text-white z-10 w-full max-w-4xl mx-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-[75%] min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-amber-400 truncate">{title}</h3>
          {subtitle && <p className="text-xs text-stone-400 truncate">{subtitle}</p>}
        </div>
        <button
          id="btn-close-zoom-modal"
          onClick={onClose}
          className="p-2.5 rounded-full bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition active:scale-95 cursor-pointer"
          aria-label={t.zoomClose}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Image with pan/zoom */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden my-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="transition-transform duration-200 ease-out cursor-grab active:cursor-grabbing max-w-full max-h-full flex items-center justify-center"
          style={{ transform: `scale(${scale})` }}
        >
          {hasError || !currentSrc ? (
            <div className="flex flex-col items-center justify-center p-8 bg-stone-900 border border-stone-800 rounded-2xl text-center max-w-sm shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-stone-800 flex items-center justify-center text-amber-400 mb-3">
                <Landmark className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-extrabold text-stone-100 mb-1">{title}</h4>
              <p className="text-xs text-stone-400 flex items-center gap-1.5">
                <ImageOff className="w-3.5 h-3.5" />
                {t.zoomPending}
              </p>
            </div>
          ) : (
            <img
              src={currentSrc}
              alt={title}
              referrerPolicy="no-referrer"
              loading="lazy"
              onError={handleImageError}
              className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-2xl select-none"
              draggable={false}
            />
          )}
        </div>
      </div>

      {/* Bottom Floating Zoom Controls */}
      <div
        className="flex items-center justify-center gap-3 z-10 pb-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900/90 border border-stone-800 shadow-xl backdrop-blur-md">
          <button
            id="btn-zoom-out"
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="p-2 rounded-full hover:bg-stone-800 disabled:opacity-30 text-stone-300 transition active:scale-90 cursor-pointer"
            title={t.zoomOut}
            aria-label={t.zoomOut}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-amber-400 w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            id="btn-zoom-in"
            onClick={handleZoomIn}
            disabled={scale >= 3.5}
            className="p-2 rounded-full hover:bg-stone-800 disabled:opacity-30 text-stone-300 transition active:scale-90 cursor-pointer"
            title={t.zoomIn}
            aria-label={t.zoomIn}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-stone-700 mx-1" />
          <button
            id="btn-zoom-reset"
            onClick={handleReset}
            className="p-2 rounded-full hover:bg-stone-800 text-stone-300 hover:text-white transition active:scale-90 cursor-pointer"
            title={t.zoomResetTitle}
            aria-label={t.zoomResetAria}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageZoomModal;
