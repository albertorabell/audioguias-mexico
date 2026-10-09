import React, { useMemo } from 'react';
import { splitLinks } from '../utils/pieceLinks';

interface LinkedTextProps {
  text: string;
  /** ¿Se puede abrir esa pieza? Si no, el texto se muestra normal (sin enlace). */
  canOpen?: (pieceId: string) => boolean;
  /** Si no se pasa, todo el texto se muestra normal. */
  onOpen?: (pieceId: string) => void;
}

/**
 * Texto con enlaces a otras piezas: "[Disco de la Muerte](mna_s04_disco_muerte)".
 * Lo visible es solo el texto entre corchetes; al tocarlo se abre la pieza en una ventanita.
 */
export const LinkedText: React.FC<LinkedTextProps> = ({ text, canOpen, onOpen }) => {
  const parts = useMemo(() => splitLinks(text), [text]);
  return (
    <>
      {parts.map((part, i) =>
        part.id && onOpen && (!canOpen || canOpen(part.id)) ? (
          <button
            key={i}
            type="button"
            className="piece-link"
            aria-haspopup="dialog"
            data-piece-link={part.id}
            onClick={() => onOpen(part.id!)}
          >
            {part.text}
          </button>
        ) : (
          <React.Fragment key={i}>{part.text}</React.Fragment>
        )
      )}
    </>
  );
};
