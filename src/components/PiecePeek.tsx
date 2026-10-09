import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { PieceData } from '../types';
import { PieceImage } from './PieceImage';
import { LinkedText } from './LinkedText';
import { useLanguage } from '../utils/LanguageContext';
import { useBackClose } from '../utils/useBackClose';
import { stripLinks } from '../utils/pieceLinks';

interface PiecePeekProps {
  /** La pieza con la que se abre la ventana (null = cerrada). */
  pieceId: string | null;
  /** Busca una pieza por su id exacto (con sus textos, si hay pase). */
  resolve: (pieceId: string) => PieceData | undefined;
  onClose: () => void;
  /** Abre la pieza completa en su propia pantalla (se puede volver con "atrás"). */
  onOpenFull: (pieceId: string) => void;
}

/**
 * Ventanita con otra pieza, para leerla sin perder el lugar: al cerrarla se vuelve exactamente a donde se iba leyendo.
 * Dentro de la ventana también hay enlaces; la flecha de arriba regresa a la pieza anterior de la ventana.
 */
export const PiecePeek: React.FC<PiecePeekProps> = ({ pieceId, resolve, onClose, onOpenFull }) => {
  const { strings } = useLanguage();
  const u = strings.ui.piece;
  const [trail, setTrail] = useState<string[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = !!pieceId;

  // Al abrirse (o cambiar de pieza desde fuera) el recorrido de la ventana empieza de nuevo
  useEffect(() => {
    setTrail(pieceId ? [pieceId] : []);
  }, [pieceId]);

  // El botón "atrás" del teléfono cierra la ventana en vez de salir de la pieza
  useBackClose(open, onClose);

  const currentId = trail[trail.length - 1] || pieceId;
  const piece = currentId ? resolve(currentId) : undefined;

  useEffect(() => {
    if (!open) return;
    bodyRef.current?.scrollTo({ top: 0 });
  }, [open, currentId]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !currentId) return null;
  if (!piece) return null;

  const titulo = piece.titulo || piece.title || '';
  const gancho = piece.frase_gancho || '';
  const text = piece.guion_corto || piece.summary_30s || piece.avance || '';
  const plain = stripLinks(text);
  const canOpen = (id: string) => !!resolve(id) && id !== currentId;
  const imageFilename = piece.image_filename || piece.identification?.hero_image || '';

  return (
    <div
      id="modal-piece-peek"
      className="fixed inset-0 z-50 bg-scrim backdrop-blur-sm flex items-end justify-center animate-fadeIn"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="relative w-full max-w-[480px] max-h-[85dvh] flex flex-col bg-surface rounded-t-3xl border-t border-x border-line shadow-2xl shadow-black/40 animate-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1 px-2 pt-2 pb-1">
          {trail.length > 1 ? (
            <button type="button" className="btn-icon text-ink-2" onClick={() => setTrail((t) => t.slice(0, -1))} aria-label={u.peekBack} data-testid="peek-back">
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <span className="w-11" aria-hidden="true" />
          )}
          <p className="flex-1 text-center text-cap font-bold uppercase tracking-wider text-ink-3">{u.linkedPiece}</p>
          <button ref={closeRef} type="button" className="btn-icon text-ink-2" onClick={onClose} aria-label={u.peekClose} data-testid="peek-close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div ref={bodyRef} className="overflow-y-auto overscroll-contain px-5 pb-4">
          <div className="relative w-full aspect-[2/1] rounded-2xl bg-raised overflow-hidden">
            <PieceImage filename={imageFilename} pieceId={currentId} alt={titulo} pieceTitle={titulo} className="w-full h-full object-cover" />
          </div>
          <h2 className="mt-4 font-serif text-[1.5rem] leading-tight font-medium tracking-[-0.01em] text-balance">{titulo}</h2>
          {gancho && gancho !== plain && <p className="mt-2 font-serif italic text-[1.0625rem] leading-snug text-ink-2 text-pretty">{gancho}</p>}
          {text && (
            <p className="mt-4 font-serif text-read text-ink whitespace-pre-line text-pretty">
              <LinkedText text={text} canOpen={canOpen} onOpen={(id) => setTrail((t) => [...t, id])} />
            </p>
          )}
        </div>

        <div className="px-5 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] border-t border-line">
          <button type="button" className="btn-primary w-full" onClick={() => onOpenFull(currentId)} data-testid="peek-open">
            {u.peekOpen}
          </button>
        </div>
      </div>
    </div>
  );
};
