import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  subtitle?: string;
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  subtitle,
}) => {
  const [scale, setScale] = useState(1);

  if (!isOpen) return null;

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.5, 3.5));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.5, 1));
  const handleReset = () => setScale(1);

  return (
    <div
      id="modal-image-zoom"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 animate-in fade-in duration-200"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between text-white z-10">
        <div className="max-w-[75%]">
          <h3 className="text-sm font-bold text-amber-400 truncate">{title}</h3>
          {subtitle && <p className="text-xs text-stone-400 truncate">{subtitle}</p>}
        </div>
        <button
          id="btn-close-zoom-modal"
          onClick={onClose}
          className="p-2 rounded-full bg-stone-800 text-stone-300 hover:text-white hover:bg-stone-700 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Image with pan/zoom */}
      <div className="flex-1 flex items-center justify-center overflow-hidden my-4 relative">
        <div
          className="transition-transform duration-200 ease-out cursor-grab active:cursor-grabbing max-w-full max-h-full flex items-center justify-center"
          style={{ transform: `scale(${scale})` }}
        >
          <img
            src={imageUrl}
            alt={title}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[72vh] object-contain rounded-lg shadow-2xl select-none"
            draggable={false}
          />
        </div>
      </div>

      {/* Bottom Floating Zoom Controls */}
      <div className="flex items-center justify-center gap-3 z-10 pb-2">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-stone-900/90 border border-stone-800 shadow-xl backdrop-blur-xs">
          <button
            id="btn-zoom-out"
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="p-2 rounded-full hover:bg-stone-800 disabled:opacity-30 text-stone-300 transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-bold text-amber-400 px-2 min-w-[3.5rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            id="btn-zoom-in"
            onClick={handleZoomIn}
            disabled={scale >= 3.5}
            className="p-2 rounded-full hover:bg-stone-800 disabled:opacity-30 text-stone-300 transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-stone-700 mx-1" />
          <button
            id="btn-zoom-reset"
            onClick={handleReset}
            className="p-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition"
            title="Restablecer tamaño"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
