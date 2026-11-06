import { PAYMENTS_API_URL } from '../config/payments';

export interface ContactPayload {
  /** mensaje | error */
  t: 'mensaje' | 'error';
  m: string;
  /** correo de respuesta (opcional) */
  c?: string;
  /** parada */
  p?: string;
  /** sitio */
  s?: string;
  /** idioma */
  l?: string;
  /** campo trampa para programas: siempre vacío */
  web?: string;
}

export type ContactResult = 'ok' | 'bad_email' | 'busy' | 'failed';

/** Manda el formulario al servidor. Nunca lanza error: devuelve qué pasó. */
export async function sendContact(payload: ContactPayload): Promise<ContactResult> {
  if (!PAYMENTS_API_URL) return 'failed';
  try {
    const r = await fetch(`${PAYMENTS_API_URL}/contacto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (r.ok) return 'ok';
    if (r.status === 429) return 'busy';
    if (r.status === 400) {
      const j = await r.json().catch(() => null);
      if (j && j.error === 'bad_email') return 'bad_email';
    }
    return 'failed';
  } catch {
    return 'failed';
  }
}
