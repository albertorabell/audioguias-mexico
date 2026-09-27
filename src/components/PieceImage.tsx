import React, { useState, useEffect } from 'react';

export interface PieceImageProps {
  filename?: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
  pieceTitle?: string;
  roomName?: string;
}

export const PieceImage: React.FC<PieceImageProps> = ({
  filename,
  alt = 'Pieza del Museo Nacional de Antropología',
  className = '',
  onClick,
  pieceTitle,
  roomName,
}) => {
  const [hasError, setHasError] = useState(false);

  // Reiniciar estado de error si cambia el filename
  useEffect(() => {
    setHasError(false);
  }, [filename]);

  const cleanFilename = filename?.trim() || '';

  // Construir la ruta de la imagen asegurando el baseUrl para GitHub Pages (/audioguias-mexico/)
  const baseUrl = import.meta.env.BASE_URL || './';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  let imageSrc = '';
  if (cleanFilename) {
    if (
      cleanFilename.startsWith('http://') ||
      cleanFilename.startsWith('https://') ||
      cleanFilename.startsWith('data:')
    ) {
      imageSrc = cleanFilename;
    } else {
      // Normalizar eliminando prefijos redundantes
      const normalizedPath = cleanFilename.replace(/^\/?(images\/pieces\/)?/, '');
      imageSrc = `${cleanBase}images/pieces/${normalizedPath}`;
    }
  }

  // Título a mostrar en caso de respaldo
  const displayTitle = pieceTitle || alt || 'Pieza del Museo Nacional de Antropología';

  // Si 'image_filename' está vacío en el JSON o si falló la carga (onError)
  if (!cleanFilename || hasError) {
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
        className={`w-full h-full min-h-[220px] relative overflow-hidden flex flex-col items-center justify-center p-6 text-center select-none rounded-2xl border border-white/10 bg-[#141419] transition-all duration-300 ${
          onClick ? 'cursor-pointer hover:border-[#F59E0B]/40 active:scale-[0.99]' : ''
        } ${className}`}
      >
        {/* Textura pétrea / gradiente sutil de basalto y obsidiana */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1c1c24] via-[#141419] to-[#0d0d12] pointer-events-none" />

        {/* Patrón sutil en fondo */}
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        {/* Emblema / Glifo de la sala con aura dorada suave */}
        <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#1a1a24] to-[#252532] border border-white/10 flex items-center justify-center mb-3 shadow-[0_8px_25px_rgba(0,0,0,0.6)]">
          <span className="text-3xl sm:text-4xl drop-shadow-md select-none" role="img" aria-label="Glifo arqueológico">
            🏛️
          </span>
          <div className="absolute inset-0 rounded-2xl bg-[#F59E0B]/5 ring-1 ring-[#F59E0B]/20 pointer-events-none" />
        </div>

        {/* Título de la pieza en tipografía editorial con límite de líneas */}
        <div className="relative z-10 max-w-sm px-2">
          <p className="font-serif font-bold text-sm sm:text-base text-white tracking-tight line-clamp-2 leading-snug drop-shadow-sm">
            {displayTitle}
          </p>

          {/* Subtítulo / Metadatos de la sala */}
          <div className="flex items-center justify-center gap-1.5 mt-1.5 text-[10px] uppercase font-bold tracking-widest text-[#F59E0B]">
            <span>{roomName || 'Museo Nacional de Antropología'}</span>
            <span>•</span>
            <span className="text-[#9CA3AF]">Colección Nacional</span>
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
        src={imageSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover transition-transform duration-500 will-change-transform"
      />
    </div>
  );
};

export default PieceImage;
