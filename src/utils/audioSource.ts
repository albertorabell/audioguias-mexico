import type { Piece, PieceAudioFile } from '../types';
import type { SupportedLanguage } from '../i18n/languages';
import { scriptLanguage } from '../i18n/content';
import { getAssetUrl } from './urlHelper';
import { getSiteLicense } from './license';
import { PAYMENTS_API_URL } from '../config/payments';

export type PlayMode = 'expres' | 'inmersion';

/** El modo "exprés" de la app es el guion corto; "inmersión" es el guion largo. */
export const MODE_KEY: Record<PlayMode, 'corto' | 'largo'> = { expres: 'corto', inmersion: 'largo' };

export interface ResolvedAudio {
  /** Dirección que se le da al reproductor. */
  url: string;
  /** Idioma del audio (igual al idioma del texto que se muestra). */
  lang: SupportedLanguage;
  /** true = pieza de pago: se pide al servidor de audio con la clave del pase. false = pieza gratis (libre). */
  premium: boolean;
  seconds?: number;
}

/** Dirección del servidor de audio (donde están TODOS los MP3, en R2). null = no hay servidor configurado. */
export function getAudioBase(): string | null {
  return PAYMENTS_API_URL || null;
}

/** Dirección + clave para pedir audios de pago al servidor. null = no hay pase con clave o no hay servidor. */
export function getRemoteAudioAccess(siteId: string): { base: string; token: string } | null {
  if (!PAYMENTS_API_URL) return null;
  const token = getSiteLicense(siteId)?.token;
  return token ? { base: PAYMENTS_API_URL, token } : null;
}

/** Arma la dirección de un MP3 en el servidor de audio (filePath = libre/<idioma>/... o pago/<idioma>/...). */
export function audioUrl(base: string, filePath: string): string {
  const clean = filePath.replace(/^\/+/, '');
  return `${base}/audio/${clean.split('/').map(encodeURIComponent).join('/')}`;
}

/** Igual que audioUrl, con la clave del pase. La clave va en la dirección porque un reproductor de audio no puede mandar encabezados. */
export function remoteAudioUrl(base: string, filePath: string, token: string): string {
  return `${audioUrl(base, filePath)}?t=${encodeURIComponent(token)}`;
}

/**
 * Decide qué MP3 reproducir para una pieza.
 * - El audio es siempre del mismo idioma que el texto mostrado (si la pieza no está traducida, es el español).
 * - Todos los MP3 viven en el servidor de audio (R2). Piezas gratis: carpeta libre/, sin clave. Piezas de pago: carpeta pago/, con la clave del pase.
 * - Si no hay MP3 (o no se puede pedir), devuelve null y la app lee el texto con la voz del teléfono.
 */
export function resolvePieceAudio(
  piece: Partial<Piece> & Record<string, any>,
  uiLang: SupportedLanguage,
  mode: PlayMode,
  siteId = 'mna'
): ResolvedAudio | null {
  const lang = scriptLanguage(piece, uiLang);
  const file: PieceAudioFile | undefined = piece.audio?.[lang]?.[MODE_KEY[mode]];

  if (file) {
    if (!file.premium) {
      const base = getAudioBase();
      if (!base) return null; // sin servidor de audio: voz del teléfono
      return { url: audioUrl(base, file.path), lang, premium: false, seconds: file.seconds };
    }
    const access = getRemoteAudioAccess(siteId);
    if (!access) return null;
    return { url: remoteAudioUrl(access.base, file.path, access.token), lang, premium: true, seconds: file.seconds };
  }

  // Compatibilidad con piezas antiguas que traían un solo archivo (solo español)
  if (lang === 'es') {
    const legacy = piece.audio_file_url || piece.audioguide?.audio_file_url || piece.audio_url;
    if (legacy) return { url: getAssetUrl(legacy), lang, premium: false };
  }
  return null;
}
