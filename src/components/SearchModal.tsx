import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  Hash,
  Delete,
  ArrowRight,
  Sparkles,
  MapPin,
  Clock,
  Check
} from 'lucide-react';
import { PieceData } from '../types';
import { useTheme } from '../utils/ThemeContext';
import { SafeImage } from './SafeImage';

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
  const [activeTab, setActiveTab] = useState<'keypad' | 'text'>('keypad');
  const [keypadInput, setKeypadInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Reset inputs when opened
  useEffect(() => {
    if (isOpen) {
      setKeypadInput('');
      setSearchQuery('');
    }
  }, [isOpen]);

  // Physical keyboard listener when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (activeTab === 'keypad') {
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          setKeypadInput((prev) => (prev.length < 4 ? prev + e.key : prev));
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          setKeypadInput((prev) => prev.slice(0, -1));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (matchedPieceByKeypad) {
            onSelectPiece(matchedPieceByKeypad.id);
            onClose();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, keypadInput, pieces]);

  // Match piece by keypad input
  // Matches piece index (e.g. "1" -> first piece, "01" -> first piece), or case_number, or piece id
  const matchedPieceByKeypad = useMemo(() => {
    if (!keypadInput) return null;
    const num = parseInt(keypadInput, 10);

    // Try stop index (1-based)
    if (!isNaN(num) && num > 0 && num <= pieces.length) {
      return pieces[num - 1];
    }

    // Try case_number or location.case_number
    const matchCase = pieces.find((p) => {
      const c = p?.location?.case_number || p?.case_number || '';
      return c.toLowerCase().includes(keypadInput.toLowerCase());
    });
    if (matchCase) return matchCase;

    // Try ID ending in number
    const matchId = pieces.find((p) => p.id === keypadInput || p.id.endsWith(keypadInput));
    return matchId || null;
  }, [keypadInput, pieces]);

  // Predictive search filtered pieces
  const filteredPieces = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return pieces.slice(0, 8);

    return pieces.filter((piece) => {
      const title = piece.identification?.title?.toLowerCase() || '';
      const altTitle = piece.identification?.original_name?.toLowerCase() || '';
      const culture = piece.identification?.culture_period?.toLowerCase() || '';
      const room = (
        piece?.location?.room_name ||
        piece?.location?.room_id ||
        piece?.room_id ||
        piece.identification?.room_zone ||
        ''
      ).toLowerCase();
      const caseNum = (piece?.location?.case_number || piece?.case_number || '').toLowerCase();
      const summary = (piece.summary_30s || '').toLowerCase();

      return (
        title.includes(q) ||
        altTitle.includes(q) ||
        culture.includes(q) ||
        room.includes(q) ||
        caseNum.includes(q) ||
        summary.includes(q)
      );
    });
  }, [searchQuery, pieces]);

  if (!isOpen) return null;

  const handleKeypadPress = (digit: string) => {
    if (keypadInput.length < 4) {
      setKeypadInput((prev) => prev + digit);
    }
  };

  const handleKeypadBackspace = () => {
    setKeypadInput((prev) => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    setKeypadInput('');
  };

  const handleGoToMatchedPiece = () => {
    if (matchedPieceByKeypad) {
      onSelectPiece(matchedPieceByKeypad.id);
      onClose();
    }
  };

  return (
    <div
      id="search-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="search-modal-card"
        className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-all flex flex-col max-h-[90vh] ${
          isSunMode
            ? 'bg-[#FAF8F5] border-stone-200 text-stone-900'
            : 'bg-[#181614] border-stone-800 text-stone-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header with Mode Switcher */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3">
          {/* Mode Switcher Tabs */}
          <div
            className={`flex items-center p-1 rounded-xl border ${
              isSunMode ? 'bg-stone-100 border-stone-200' : 'bg-stone-900 border-stone-800'
            }`}
          >
            <button
              id="tab-mode-keypad"
              type="button"
              onClick={() => setActiveTab('keypad')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'keypad'
                  ? isSunMode
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'bg-stone-800 text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Teclado Numérico</span>
            </button>

            <button
              id="tab-mode-text"
              type="button"
              onClick={() => setActiveTab('text')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'text'
                  ? isSunMode
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'bg-stone-800 text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Buscar por Nombre</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar buscador"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= MODE 1: NUMERIC KEYPAD ================= */}
        {activeTab === 'keypad' && (
          <div className="p-5 flex flex-col items-center">
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-3 text-center">
              Ingresa el número de parada o vitrina física (ej. 1 a {pieces.length}):
            </p>

            {/* Display screen */}
            <div
              className={`w-full h-16 rounded-2xl border flex items-center justify-between px-5 mb-4 shadow-inner ${
                isSunMode ? 'bg-white border-stone-200' : 'bg-stone-900 border-stone-800'
              }`}
            >
              <span className="text-xs font-mono uppercase tracking-widest text-stone-400">
                PARADA #
              </span>
              <span className="text-3xl font-mono font-bold tracking-widest text-[#C05638] dark:text-[#D96B47]">
                {keypadInput || '—'}
              </span>
              <button
                type="button"
                onClick={handleKeypadBackspace}
                disabled={!keypadInput}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-30"
                title="Borrar dígito"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Realtime Matched Piece Card Preview */}
            <div className="w-full mb-4 min-h-[64px]">
              {matchedPieceByKeypad ? (
                <div
                  onClick={handleGoToMatchedPiece}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition shadow-xs hover:scale-[1.01] active:scale-[0.99] ${
                    isSunMode
                      ? 'bg-amber-50/80 border-amber-300/80 text-stone-900'
                      : 'bg-amber-950/30 border-amber-800/60 text-stone-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <SafeImage
                      src={matchedPieceByKeypad.identification.hero_image}
                      alt={matchedPieceByKeypad.identification.title}
                      className="w-10 h-10 rounded-lg object-cover shrink-0 border border-stone-200 dark:border-stone-700"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-[#C05638] dark:text-[#D96B47] block truncate">
                        {matchedPieceByKeypad.location?.room_name || 'Sala Mexica'}
                      </span>
                      <h5 className="text-xs font-bold truncate text-stone-900 dark:text-stone-100">
                        {matchedPieceByKeypad.identification.title}
                      </h5>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoToMatchedPiece}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#C05638] hover:bg-[#A9482E] text-white shrink-0 flex items-center gap-1 shadow-xs"
                  >
                    <span>Ir</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : keypadInput ? (
                <div className="p-3 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 text-center text-xs text-stone-500 dark:text-stone-400">
                  No hay pieza registrada con el #{keypadInput}. Prueba con 1 a {pieces.length}.
                </div>
              ) : (
                <div className="p-3 rounded-xl border border-dashed border-stone-200 dark:border-stone-800 text-center text-xs text-stone-400 dark:text-stone-500">
                  Digita el número de la cédula para escuchar de inmediato
                </div>
              )}
            </div>

            {/* Tactile Keypad Grid (3x4) */}
            <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  id={`keypad-digit-${digit}`}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className={`h-12 rounded-xl text-lg font-bold font-mono border transition active:scale-95 shadow-xs flex items-center justify-center ${
                    isSunMode
                      ? 'bg-white hover:bg-stone-50 border-stone-200 text-stone-900'
                      : 'bg-stone-800/80 hover:bg-stone-700 border-stone-700 text-stone-100'
                  }`}
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={handleKeypadClear}
                className={`h-12 rounded-xl text-xs font-semibold uppercase tracking-wider border transition active:scale-95 ${
                  isSunMode
                    ? 'bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-600'
                    : 'bg-stone-900 hover:bg-stone-800 border-stone-800 text-stone-400'
                }`}
              >
                C
              </button>

              <button
                id="keypad-digit-0"
                type="button"
                onClick={() => handleKeypadPress('0')}
                className={`h-12 rounded-xl text-lg font-bold font-mono border transition active:scale-95 shadow-xs flex items-center justify-center ${
                  isSunMode
                    ? 'bg-white hover:bg-stone-50 border-stone-200 text-stone-900'
                    : 'bg-stone-800/80 hover:bg-stone-700 border-stone-700 text-stone-100'
                }`}
              >
                0
              </button>

              <button
                type="button"
                disabled={!matchedPieceByKeypad}
                onClick={handleGoToMatchedPiece}
                className="h-12 rounded-xl text-xs font-bold uppercase tracking-wider border transition active:scale-95 shadow-xs flex items-center justify-center gap-1 bg-[#C05638] hover:bg-[#A9482E] text-white disabled:opacity-30 disabled:pointer-events-none"
              >
                <span>Ir</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ================= MODE 2: PREDICTIVE TEXT SEARCH ================= */}
        {activeTab === 'text' && (
          <div className="p-4 flex flex-col flex-1 overflow-hidden min-h-[360px]">
            {/* Search Input */}
            <div
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border mb-3 shadow-xs ${
                isSunMode ? 'bg-white border-stone-300' : 'bg-stone-900 border-stone-700'
              }`}
            >
              <Search className="w-4 h-4 text-stone-400 shrink-0" />
              <input
                id="input-predictive-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por obra, sala o cultura (ej. Coatlicue, Mexica)..."
                className="w-full text-xs sm:text-sm bg-transparent border-none outline-hidden text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Results counter */}
            <div className="flex justify-between items-center text-[10px] font-mono text-stone-500 dark:text-stone-400 px-1 mb-2">
              <span>{filteredPieces.length} resultados encontrados</span>
              <span>Toca una pieza para escucharla</span>
            </div>

            {/* Scrollable list of matched pieces */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredPieces.map((piece, idx) => {
                const room =
                  piece?.location?.room_name ||
                  piece?.location?.room_id ||
                  piece?.room_id ||
                  piece.identification?.room_zone ||
                  'Sala Mexica';
                const caseNum = piece?.location?.case_number || piece?.case_number || '';

                return (
                  <div
                    key={piece.id || idx}
                    id={`search-result-item-${piece.id}`}
                    onClick={() => {
                      onSelectPiece(piece.id);
                      onClose();
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onSelectPiece(piece.id);
                        onClose();
                      }
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition shadow-xs active:scale-[0.99] ${
                      isSunMode
                        ? 'bg-white hover:bg-stone-50 border-stone-200 text-stone-900'
                        : 'bg-stone-900/70 hover:bg-stone-800 border-stone-800 text-stone-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <SafeImage
                        src={piece.identification.hero_image}
                        alt={piece.identification.title}
                        className="w-12 h-12 rounded-lg object-cover shrink-0 border border-stone-200 dark:border-stone-800"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] uppercase font-bold text-[#C05638] dark:text-[#D96B47] truncate">
                            {room}
                          </span>
                          {caseNum && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-sm bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-mono">
                              {caseNum}
                            </span>
                          )}
                        </div>
                        <h5 className="text-xs sm:text-sm font-semibold truncate text-stone-900 dark:text-stone-100">
                          {piece.identification.title}
                        </h5>
                        {piece.identification.culture_period && (
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                            {piece.identification.culture_period}
                          </p>
                        )}
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-stone-400 shrink-0" />
                  </div>
                );
              })}

              {filteredPieces.length === 0 && (
                <div className="p-8 text-center text-xs text-stone-500 dark:text-stone-400">
                  No se encontraron piezas con el término &quot;{searchQuery}&quot;. Intenta con otro nombre o cultura.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
