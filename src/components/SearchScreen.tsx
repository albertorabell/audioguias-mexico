import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Lock, Search, X } from 'lucide-react';
import { PieceData, Room } from '../types';
import { PieceImage } from './PieceImage';
import { useLanguage } from '../utils/LanguageContext';
import { getRoomLabel } from '../utils/roomLabel';

interface SearchScreenProps {
  pieces: PieceData[];
  rooms: Room[];
  hasPass: boolean;
  onSelectPiece: (pieceId: string) => void;
  onSelectRoom: (room: Room) => void;
  /** Al abrir la pestaña se pone el cursor en el buscador. */
  autoFocus?: boolean;
}

/** Quita acentos y mayúsculas para que "teotihuacan" encuentre "Teotihuacán". */
const fold = (s: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Pestaña "Buscar": por obra, sala o cultura. Sin texto muestra las obras destacadas. */
export const SearchScreen: React.FC<SearchScreenProps> = ({ pieces, rooms, hasPass, onSelectPiece, onSelectRoom, autoFocus = true }) => {
  const { strings } = useLanguage();
  const t = strings.search;
  const u = strings.ui;
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 80);
      return () => window.clearTimeout(id);
    }
  }, [autoFocus]);

  const roomById = useMemo(() => new Map(rooms.map((r) => [r.room_id, r])), [rooms]);
  const roomLine = (p: PieceData) => {
    const r = roomById.get(p.room_id);
    return r ? `${getRoomLabel(r)} · ${r.nombre_oficial}` : '';
  };

  const query = fold(q.trim());
  const matchingRooms = useMemo(
    () => (query.length < 2 ? [] : rooms.filter((r) => fold(`${r.nombre_oficial} ${getRoomLabel(r)}`).includes(query))),
    [rooms, query]
  );
  const results = useMemo(() => {
    if (!query) return [...pieces].sort((a, b) => (a.orden_sugerido || 99) - (b.orden_sugerido || 99)).slice(0, 15);
    return pieces.filter((p) => {
      const esp = (p.especificaciones || {}) as Record<string, string>;
      const hay = fold(
        [p.titulo, (p as any).titulo_es, p.frase_gancho, esp.Cultura, esp.cultura, esp.Culture, roomLine(p)].filter(Boolean).join(' ')
      );
      return hay.includes(query);
    });
  }, [pieces, query]);

  return (
    <div className="min-h-dvh bg-bg text-ink pb-tabbar">
      <div className="sticky top-0 z-30 pt-safe bg-bg/94 backdrop-blur-xl border-b border-line">
        <div className="px-4 py-3">
          <label className="flex items-center gap-2.5 h-12 px-4 rounded-full bg-surface border border-line focus-within:border-jade">
            <Search className="w-5 h-5 text-ink-3 shrink-0" />
            <input
              ref={inputRef}
              id="input-search-pieces"
              type="search"
              enterKeyHint="search"
              autoComplete="off"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={u.search.placeholder}
              className="flex-1 min-w-0 bg-transparent outline-none text-[16px] text-ink placeholder:text-ink-3 [&::-webkit-search-cancel-button]:hidden"
            />
            {q && (
              <button type="button" onClick={() => setQ('')} aria-label={t.clear} className="btn-icon w-9 h-9 -mr-2 text-ink-3">
                <X className="w-4 h-4" />
              </button>
            )}
          </label>
        </div>
      </div>

      <main id="search-results">
        {matchingRooms.length > 0 && (
          <section className="pt-4">
            <h2 className="px-5 text-cap font-bold text-ink-3">{u.search.rooms}</h2>
            <ul className="mt-1">
              {matchingRooms.map((r) => (
                <li key={r.room_id}>
                  <button type="button" onClick={() => onSelectRoom(r)} className="w-full px-5 py-3 flex items-center gap-4 text-left cursor-pointer row-press">
                    <span className="font-serif text-[1.5rem] leading-none text-jade w-9 tabular-nums">{getRoomLabel(r).match(/\d+$/)?.[0]}</span>
                    <span className="text-[1.0625rem] font-bold">{r.nombre_oficial}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="pt-4">
          <h2 className="px-5 text-cap font-bold text-ink-3">{query ? t.resultsFound(results.length) : u.search.featured}</h2>
          {results.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-[1.0625rem] font-bold">{t.noResults(q)}</p>
              <p className="mt-2 text-ui text-ink-3 max-w-xs mx-auto">{u.search.noResultsHint}</p>
            </div>
          ) : (
            <ul className="mt-1">
              {results.map((p) => (
                <li key={p.piece_id}>
                  <button
                    type="button"
                    role="button"
                    onClick={() => onSelectPiece(p.piece_id)}
                    className="w-full px-5 py-2.5 flex items-center gap-3.5 text-left cursor-pointer row-press"
                  >
                    <span className="w-14 h-14 rounded-xl overflow-hidden bg-raised shrink-0">
                      <PieceImage filename={p.image_filename} pieceId={p.piece_id} alt="" className="w-full h-full object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[1rem] font-bold leading-snug">{p.titulo}</span>
                      <span className="block text-cap text-ink-3 truncate">{roomLine(p)}</span>
                    </span>
                    {!p.is_free && !hasPass && <Lock className="w-4 h-4 text-oro shrink-0" aria-label={u.lockedAria} />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};

export default SearchScreen;
