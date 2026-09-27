import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  Hash,
  Delete,
  ArrowRight,
  Volume2,
  Sparkles,
  MapPin,
  Check,
} from 'lucide-react';
import { PieceData } from '../types';
import { PieceImage } from './PieceImage';

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
  const [activeTab, setActiveTab] = useState<'keypad' | 'text'>('keypad');
  const [keypadInput, setKeypadInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Reiniciar estado al abrir modal
  useEffect(() => {
    if (isOpen) {
      setKeypadInput('');
      setSearchQuery('');
    }
  }, [isOpen]);

  // Manejo de teclado físico
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
            const pieceId =
              matchedPieceByKeypad.piece_id ||
              matchedPieceByKeypad.id ||
              (matchedPieceByKeypad as any).poi_id;
            onSelectPiece(pieceId);
            onClose();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeTab, keypadInput, pieces]);

  // Búsqueda inteligente por vitrina / número físico (01 al 156)
  const matchedPieceByKeypad = useMemo(() => {
    if (!keypadInput) return null;
    const num = parseInt(keypadInput, 10);
    if (isNaN(num)) return null;

    // 1. Por orden sugerido / vitrina directa
    const matchOrden = pieces.find((p: any) => p.orden_sugerido === num);
    if (matchOrden) return matchOrden;

    // 2. Por número de vitrina en case_number o location.case_number
    const matchCase = pieces.find((p: any) => {
      const c = String(p?.location?.case_number || p?.case_number || '');
      const cNum = parseInt(c.replace(/\D/g, ''), 10);
      return !isNaN(cNum) && cNum === num;
    });
    if (matchCase) return matchCase;

    // 3. Por índice correlativo de parada (1 a N)
    if (num > 0 && num <= pieces.length) {
      return pieces[num - 1];
    }

    // 4. Por terminación numérica de ID
    const matchId = pieces.find((p: any) => {
      const pId = String(p.piece_id || p.id || p.poi_id || '');
      return pId.endsWith(keypadInput) || pId.includes(`-${num}`) || pId.includes(`_${num}`);
    });
    return matchId || null;
  }, [keypadInput, pieces]);

  // Búsqueda de texto predictiva (por título, sala, cultura, mitos)
  const filteredPieces = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return pieces.slice(0, 10);

    return pieces.filter((piece: any) => {
      const title = (piece.titulo || piece.identification?.title || piece.title || '').toLowerCase();
      const altTitle = (piece.identification?.original_name || piece.subtitulo || '').toLowerCase();
      const culture = (piece.especificaciones?.cultura || piece.identification?.culture_period || '').toLowerCase();
      const room = (
        piece?.location?.room_name ||
        piece?.location?.room_id ||
        piece?.room_id ||
        piece?.roomId ||
        piece.identification?.room_zone ||
        ''
      ).toLowerCase();
      const summary = (
        piece.guion_corto ||
        piece.frase_gancho ||
        piece.summary_30s ||
        piece.puente_narrativo ||
        ''
      ).toLowerCase();
      const idStr = (piece.piece_id || piece.id || piece.poi_id || '').toLowerCase();
      const caseStr = String(piece?.location?.case_number || piece?.case_number || '').toLowerCase();

      return (
        title.includes(q) ||
        altTitle.includes(q) ||
        culture.includes(q) ||
        room.includes(q) ||
        summary.includes(q) ||
        idStr.includes(q) ||
        caseStr.includes(q)
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
      const pieceId =
        matchedPieceByKeypad.piece_id ||
        matchedPieceByKeypad.id ||
        (matchedPieceByKeypad as any).poi_id;
      onSelectPiece(pieceId);
      onClose();
    }
  };

  return (
    <div
      id="search-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="search-modal-card"
        className="w-full max-w-md rounded-3xl border border-white/10 bg-[#141419] text-[#F3F4F6] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal con Selector de Modo */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between gap-3 bg-[#0B0B0E]">
          {/* Tabs: Teclado de Vitrina vs Búsqueda por Nombre */}
          <div className="flex items-center p-1 rounded-2xl bg-[#141419] border border-white/10">
            <button
              id="tab-mode-keypad"
              type="button"
              onClick={() => setActiveTab('keypad')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'keypad'
                  ? 'bg-[#F59E0B] text-black shadow-md shadow-[#F59E0B]/20 font-black'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>N° Vitrina (01-156)</span>
            </button>

            <button
              id="tab-mode-text"
              type="button"
              onClick={() => setActiveTab('text')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'text'
                  ? 'bg-[#F59E0B] text-black shadow-md shadow-[#F59E0B]/20 font-black'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Buscar Título</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar buscador"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#9CA3AF] hover:text-white hover:bg-white/10 transition active:scale-95 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= MODO 1: TECLADO NUMÉRICO TÁCTIL DE VITRINA ================= */}
        {activeTab === 'keypad' && (
          <div className="p-5 flex flex-col items-center overflow-y-auto">
            <p className="text-xs text-[#9CA3AF] mb-3 text-center font-medium">
              Teclea el número de vitrina física o ficha técnica (ej. <span className="text-[#F59E0B] font-bold">01 al 156</span>):
            </p>

            {/* Pantalla display estilo indicador digital del museo */}
            <div className="w-full h-16 rounded-2xl border border-white/10 bg-[#0B0B0E] flex items-center justify-between px-5 mb-4 shadow-inner">
              <span className="text-xs font-mono uppercase tracking-widest text-[#9CA3AF] font-bold">
                VITRINA #
              </span>
              <span className="text-3xl font-mono font-black tracking-widest text-[#F59E0B]">
                {keypadInput ? keypadInput.padStart(2, '0') : '— —'}
              </span>
              <button
                type="button"
                onClick={handleKeypadBackspace}
                disabled={!keypadInput}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#9CA3AF] hover:text-white disabled:opacity-20 transition active:scale-90 cursor-pointer"
                title="Borrar dígito"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Vista previa en tiempo real de la pieza encontrada */}
            <div className="w-full mb-4 min-h-[70px]">
              {matchedPieceByKeypad ? (
                <div
                  onClick={handleGoToMatchedPiece}
                  role="button"
                  tabIndex={0}
                  className="p-3 rounded-2xl border border-[#F59E0B]/50 bg-[#1A1A22] hover:bg-[#20202B] flex items-center justify-between gap-3 cursor-pointer transition-all shadow-lg active:scale-[0.99] select-none group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#0B0B0E] shrink-0 border border-white/10">
                      <PieceImage
                        imageFilename={
                          matchedPieceByKeypad.image_filename ||
                          matchedPieceByKeypad.identification?.hero_image
                        }
                        title={
                          matchedPieceByKeypad.titulo ||
                          matchedPieceByKeypad.identification?.title ||
                          'Pieza'
                        }
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-[#F59E0B] block truncate">
                        {matchedPieceByKeypad.location?.room_name ||
                          matchedPieceByKeypad.identification?.room_zone ||
                          'Sala del Museo'}
                      </span>
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-[#F59E0B] transition-colors">
                        {matchedPieceByKeypad.titulo ||
                          matchedPieceByKeypad.identification?.title ||
                          'Pieza seleccionada'}
                      </h4>
                      <p className="text-[10px] text-[#9CA3AF] truncate">
                        Vitrina #{matchedPieceByKeypad.orden_sugerido || keypadInput}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGoToMatchedPiece();
                    }}
                    className="px-3.5 py-2 rounded-xl text-xs font-black bg-[#F59E0B] hover:bg-amber-400 text-black shrink-0 flex items-center gap-1.5 shadow-md shadow-[#F59E0B]/20 active:scale-95 cursor-pointer"
                  >
                    <span>Abrir</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : keypadInput ? (
                <div className="p-3.5 rounded-2xl border border-dashed border-white/10 bg-[#0B0B0E] text-center text-xs text-[#9CA3AF]">
                  Buscando pieza con el N° <span className="font-bold text-[#F59E0B]">#{keypadInput}</span>...
                </div>
              ) : (
                <div className="p-3 rounded-2xl border border-dashed border-white/10 bg-[#0B0B0E] text-center text-xs text-[#9CA3AF]">
                  Digita 2 o 3 números para saltar a la cédula de la sala
                </div>
              )}
            </div>

            {/* Teclado numérico táctil (3x4) estilo cajero/audioguía de museo */}
            <div className="grid grid-cols-3 gap-2.5 w-full max-w-[290px]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  id={`keypad-digit-${digit}`}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="h-13 rounded-2xl text-xl font-mono font-bold border border-white/10 bg-[#1A1A22] hover:bg-[#252532] text-white active:scale-95 transition-all shadow-sm flex items-center justify-center cursor-pointer"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={handleKeypadClear}
                className="h-13 rounded-2xl text-xs font-bold uppercase tracking-wider border border-white/10 bg-[#0B0B0E] hover:bg-white/5 text-[#9CA3AF] active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              >
                C
              </button>

              <button
                id="keypad-digit-0"
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="h-13 rounded-2xl text-xl font-mono font-bold border border-white/10 bg-[#1A1A22] hover:bg-[#252532] text-white active:scale-95 transition-all shadow-sm flex items-center justify-center cursor-pointer"
              >
                0
              </button>

              <button
                type="button"
                disabled={!matchedPieceByKeypad}
                onClick={handleGoToMatchedPiece}
                className="h-13 rounded-2xl text-xs font-black uppercase tracking-wider border border-[#F59E0B] bg-[#F59E0B] hover:bg-amber-400 text-black disabled:opacity-25 disabled:pointer-events-none active:scale-95 transition-all shadow-md shadow-[#F59E0B]/25 flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Ir</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ================= MODO 2: BÚSQUEDA PREDICTIVA POR TEXTO LIBRE ================= */}
        {activeTab === 'text' && (
          <div className="p-4 flex flex-col flex-1 overflow-hidden min-h-[360px]">
            {/* Campo de búsqueda predictivo */}
            <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl border border-white/10 bg-[#0B0B0E] mb-3 shadow-inner">
              <Search className="w-4 h-4 text-[#F59E0B] shrink-0" />
              <input
                id="input-predictive-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Busca por pieza o tema (ej. Pakal, Coatlicue, Sol, Jade)..."
                className="w-full text-xs sm:text-sm bg-transparent border-none outline-hidden text-[#F3F4F6] placeholder:text-[#9CA3AF] font-medium"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[#9CA3AF] hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Contador de resultados */}
            <div className="flex justify-between items-center text-[10px] font-mono text-[#9CA3AF] px-1 mb-2">
              <span>{filteredPieces.length} obras coincidentes</span>
              <span className="text-[#F59E0B]">Toque para abrir</span>
            </div>

            {/* Lista scrolleable de piezas coincidentes */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-none">
              {filteredPieces.map((piece: any, idx: number) => {
                const room =
                  piece?.location?.room_name ||
                  piece?.location?.room_id ||
                  piece?.room_id ||
                  piece?.roomId ||
                  piece.identification?.room_zone ||
                  'Sala del Museo';
                const caseNum =
                  piece?.orden_sugerido
                    ? `Vitrina #${piece.orden_sugerido}`
                    : piece?.location?.case_number || piece?.case_number || '';

                const pieceId = piece.piece_id || piece.id || (piece as any).poi_id;
                const pieceTitle = piece.titulo || piece.identification?.title || piece.title || 'Pieza';
                const pieceImage = piece.image_filename || piece.identification?.hero_image || '';
                const pieceCulture = piece.especificaciones?.cultura || piece.identification?.culture_period || '';

                return (
                  <div
                    key={pieceId || idx}
                    id={`search-result-item-${pieceId}`}
                    onClick={() => {
                      onSelectPiece(pieceId);
                      onClose();
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onSelectPiece(pieceId);
                        onClose();
                      }
                    }}
                    className="p-3 rounded-2xl border border-white/10 bg-[#0B0B0E] hover:bg-[#1A1A22] hover:border-[#F59E0B]/50 flex items-center justify-between gap-3 cursor-pointer transition-all shadow-sm active:scale-[0.99] group select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#141419] shrink-0 border border-white/10">
                        <PieceImage
                          imageFilename={pieceImage}
                          title={pieceTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] uppercase font-bold text-[#F59E0B] truncate">
                            {room}
                          </span>
                          {caseNum && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-stone-300 font-mono font-bold shrink-0">
                              {caseNum}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold truncate text-[#F3F4F6] group-hover:text-[#F59E0B] transition-colors">
                          {pieceTitle}
                        </h4>
                        {pieceCulture && (
                          <p className="text-[11px] text-[#9CA3AF] truncate font-medium">
                            {pieceCulture}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="w-8 h-8 rounded-xl bg-white/5 group-hover:bg-[#F59E0B] text-[#9CA3AF] group-hover:text-black flex items-center justify-center shrink-0 transition-colors">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}

              {filteredPieces.length === 0 && (
                <div className="p-8 text-center text-xs text-[#9CA3AF] font-medium bg-[#0B0B0E] rounded-2xl border border-white/10">
                  No se encontraron piezas con el término &quot;{searchQuery}&quot;. Prueba buscando &quot;Pakal&quot;, &quot;Sol&quot; o &quot;Mexica&quot;.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchModal;
