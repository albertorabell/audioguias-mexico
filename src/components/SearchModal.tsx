import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Search, ChevronRight, Volume2, Sparkles } from 'lucide-react';
import { PieceData } from '../types';
import { PieceImage } from './PieceImage';
import { useTheme } from '../utils/ThemeContext';
import { useStrings } from '../utils/LanguageContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  pieces: PieceData[];
  onSelectPiece: (pieceId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  pieces,
  onSelectPiece,
}) => {
  const { isSunMode } = useTheme();
  const t = useStrings();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Reiniciar búsqueda y enfocar input al abrir
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Manejo de Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Búsqueda inteligente por nombre de pieza o sala
  const filteredPieces = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      // Mostrar una selección inicial de piezas destacadas ordenadas por orden_sugerido
      return [...pieces]
        .sort((a, b) => (a.orden_sugerido || 999) - (b.orden_sugerido || 999))
        .slice(0, 15);
    }

    return pieces.filter((piece) => {
      const title = `${piece.titulo || piece.title || ''} ${(piece as any).titulo_es || ''}`.toLowerCase();
      const hook = (piece.frase_gancho || '').toLowerCase();
      const shortDesc = (piece.guion_corto || '').toLowerCase();
      const room = (piece.room_id || '').toLowerCase();
      const culture = (
        (piece.especificaciones as any)?.cultura ||
        (piece.especificaciones as any)?.Cultura ||
        ''
      ).toLowerCase();

      return (
        title.includes(q) ||
        hook.includes(q) ||
        shortDesc.includes(q) ||
        room.includes(q) ||
        culture.includes(q)
      );
    });
  }, [searchQuery, pieces]);

  if (!isOpen) return null;

  return (
    <div
      id="modal-search-pieces"
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all duration-200 mt-6 sm:mt-12 ${
          isSunMode
            ? 'bg-white border-stone-200 text-stone-900'
            : 'bg-[#141419] border-white/10 text-stone-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con Input de Búsqueda */}
        <div
          className={`p-4 border-b flex items-center gap-3 shrink-0 ${
            isSunMode ? 'border-stone-200 bg-stone-50' : 'border-white/10 bg-[#0B0B0E]'
          }`}
        >
          <Search className="w-5 h-5 text-amber-500 shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            id="input-search-pieces"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.search.placeholder}
            className={`flex-1 bg-transparent border-none outline-hidden text-sm sm:text-base font-semibold placeholder:text-stone-400 ${
              isSunMode ? 'text-stone-900' : 'text-white'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 rounded-lg text-stone-400 hover:text-white transition cursor-pointer"
              title={t.search.clear}
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            id="btn-close-search-modal"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/5 transition cursor-pointer shrink-0"
            aria-label={t.search.closeAria}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen de resultados */}
        <div
          className={`px-4 py-2 border-b flex items-center justify-between text-[11px] font-medium ${
            isSunMode
              ? 'bg-stone-100/60 border-stone-200 text-stone-600'
              : 'bg-white/5 border-white/5 text-stone-400'
          }`}
        >
          <span>
            {searchQuery ? t.search.resultsFound(filteredPieces.length) : t.search.catalog(pieces.length)}
          </span>
          <span className="font-mono text-[10px] text-amber-500">
            {searchQuery ? t.search.directMatches : t.search.featured}
          </span>
        </div>

        {/* Lista de Resultados */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredPieces.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto text-xl font-bold">
                🔍
              </div>
              <p className="text-sm font-bold">{t.search.noResults(searchQuery)}</p>
              <p className="text-xs text-stone-400 max-w-xs mx-auto">
                {t.search.noResultsHint}
              </p>
            </div>
          ) : (
            filteredPieces.map((piece) => {
              const pId = piece.piece_id || piece.id;
              const title = piece.titulo || piece.title || t.common.pieceWord;
              const hook = piece.frase_gancho || piece.guion_corto?.slice(0, 60) || '';
              const roomClean = piece.room_id ? piece.room_id.replace(/^sala-?/i, `${t.common.roomWord} `) : '';

              return (
                <div
                  key={pId}
                  onClick={() => {
                    onSelectPiece(pId);
                    onClose();
                  }}
                  role="button"
                  tabIndex={0}
                  className={`p-3 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-3 cursor-pointer group active:scale-[0.99] ${
                    isSunMode
                      ? 'bg-stone-50 border-stone-200 hover:border-amber-500/50 hover:bg-amber-50/50 text-stone-900'
                      : 'bg-[#0B0B0E] border-white/5 hover:border-amber-500/40 hover:bg-white/5 text-stone-100'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-stone-900 border border-white/10">
                    <PieceImage
                      filename={piece.image_filename}
                      imageFilename={piece.image_filename}
                      pieceId={pId}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] uppercase font-bold text-amber-500 truncate">
                        {roomClean}
                      </span>
                      {piece.piso && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-white/10 text-stone-400 font-mono">
                          {piece.piso}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold truncate group-hover:text-amber-500 transition-colors">
                      {title}
                    </h4>
                    {hook && (
                      <p className="text-[11px] text-stone-400 truncate mt-0.5">
                        {hook}
                      </p>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="shrink-0 flex items-center gap-1.5">
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-500 group-hover:translate-x-0.5 transition-transform">
                      <span>{t.search.view}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                    <ChevronRight className="w-4 h-4 text-stone-400 sm:hidden" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
