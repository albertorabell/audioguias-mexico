import React, { useMemo } from 'react';
import { dividirFrases, fraseActiva } from '../utils/iluminarTexto';
import { LinkedText } from './LinkedText';

interface Props {
  text: string;
  /** Avance del audio de ESTA pieza (0 a 1). */
  progress: number;
  /** Solo se ilumina mientras suena (o está en pausa) el audio de esta pieza. */
  active: boolean;
  canOpen?: (pieceId: string) => boolean;
  onOpen?: (pieceId: string) => void;
}

/**
 * El texto de la pieza con la frase que se está escuchando resaltada. Es una estimación por longitud de frase
 * (no hay marcas de tiempo del audio), así que puede ir desfasada unos segundos.
 */
export const TextoIluminado: React.FC<Props> = ({ text, progress, active, canOpen, onOpen }) => {
  const frases = useMemo(() => dividirFrases(text), [text]);
  const actual = active ? fraseActiva(frases, progress) : -1;
  if (actual < 0) return <LinkedText text={text} canOpen={canOpen} onOpen={onOpen} />;
  return (
    <>
      {frases.map((f, i) => (
        <span key={i} className={i === actual ? 'frase-activa' : i < actual ? undefined : 'frase-pendiente'} aria-current={i === actual ? 'true' : undefined}>
          <LinkedText text={f.texto} canOpen={canOpen} onOpen={onOpen} />
        </span>
      ))}
    </>
  );
};
