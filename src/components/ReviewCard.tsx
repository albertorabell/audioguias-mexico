import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';
import { contactoText } from '../i18n/contacto';
import { sendContact } from '../utils/contactApi';
import { getAnalyticsSite, track } from '../utils/analytics';

const KEY = 'xolo_resena_enviada';

function yaEnvio(site: string): boolean {
  try {
    return (localStorage.getItem(KEY) || '').split(',').includes(site);
  } catch {
    return false;
  }
}

function marcarEnviada(site: string): void {
  try {
    const v = (localStorage.getItem(KEY) || '').split(',').filter(Boolean);
    if (!v.includes(site)) v.push(site);
    localStorage.setItem(KEY, v.join(','));
  } catch {
    /* sin almacenamiento: puede volver a verla, no pasa nada */
  }
}

const OIDAS = 'xolo_paradas_oidas';
const OMITIDA = 'xolo_resena_omitida';
/** Paradas escuchadas antes de pedir una opinión a media visita */
export const RESENA_TRAS = 4;

function leerLista(key: string): string[] {
  try {
    return (localStorage.getItem(key) || '').split(',').filter(Boolean);
  } catch {
    return [];
  }
}

/** Anota que en este sitio se escuchó esta parada (solo en el teléfono). */
export function anotarParadaOida(site: string, pieceId: string): void {
  if (!site || !pieceId) return;
  const k = `${site}:${pieceId}`;
  const v = leerLista(OIDAS);
  if (v.includes(k)) return;
  v.push(k);
  try {
    localStorage.setItem(OIDAS, v.slice(-200).join(','));
  } catch {
    /* sin almacenamiento */
  }
}

/** ¿Toca pedir opinión a media visita? (4 paradas escuchadas en este sitio, sin reseña enviada ni «ahora no») */
export function tocaResenaParcial(site: string): boolean {
  if (!site || yaEnvio(site) || leerLista(OMITIDA).includes(site)) return false;
  return leerLista(OIDAS).filter((x) => x.startsWith(`${site}:`)).length >= RESENA_TRAS;
}

function omitir(site: string): void {
  const v = leerLista(OMITIDA);
  if (!v.includes(site)) v.push(site);
  try {
    localStorage.setItem(OMITIDA, v.join(','));
  } catch {
    /* sin almacenamiento */
  }
}

/**
 * Opinión al terminar una ruta: estrellas (obligatorias), una frase opcional y el permiso, desmarcado de entrada,
 * para publicarla sin nombre. Se manda al mismo servidor que el formulario de contacto (tipo «resena»).
 * Una vez enviada no vuelve a aparecer para ese sitio.
 */
export const ReviewCard: React.FC<{ routeName: string; /** A media visita: más discreta y con «Ahora no» */ parcial?: boolean }> = ({ routeName, parcial = false }) => {
  const { currentLanguage } = useLanguage();
  const t = contactoText(currentLanguage);
  const site = getAnalyticsSite() || '';
  const [stars, setStars] = useState(0);
  const [text, setText] = useState('');
  const [permit, setPermit] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>(() => (yaEnvio(site) ? 'sent' : 'idle'));
  const [justSent, setJustSent] = useState(false);
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  if (state === 'sent' && !justSent) return null;
  if (state === 'sent') {
    return (
      <p id="review-thanks" role="status" className="mt-8 rounded-xl bg-jade/15 border border-jade/50 p-4 text-ui font-semibold text-ink">
        {t.reviewThanks}
      </p>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stars || state === 'sending') return;
    setState('sending');
    const r = await sendContact({
      t: 'resena',
      r: stars,
      m: text.trim(),
      ok: permit && text.trim().length >= 3,
      p: (parcial ? `a media visita: ${routeName}` : `ruta: ${routeName}`).slice(0, 80),
      ...(site ? { s: site } : {}),
      l: currentLanguage,
      web: '',
    });
    if (r === 'ok') {
      track('review', { k: String(stars) });
      marcarEnviada(site);
      setJustSent(true);
      setState('sent');
    } else {
      setState('failed');
    }
  };

  return (
    <form id={parcial ? 'review-card-mid' : 'review-card'} onSubmit={submit} className={parcial ? 'mt-8 rounded-2xl border border-line bg-surface p-3.5' : 'mt-8 rounded-2xl border border-line bg-surface p-4'} noValidate>
      <div className="flex items-start justify-between gap-2">
        <h2 className={parcial ? 'text-ui font-semibold' : 'font-serif text-h3 font-medium'}>{parcial ? t.reviewMidTitle : t.reviewTitle}</h2>
        {parcial && (
          <button type="button" id="btn-review-later" onClick={() => { omitir(site); setHidden(true); }} aria-label={t.reviewLater} title={t.reviewLater} className="-mt-1 -mr-1 h-9 w-9 inline-flex items-center justify-center rounded-full text-ink-3 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {!parcial && <p className="mt-1 text-ui text-ink-2">{t.reviewSub}</p>}
      <div role="radiogroup" aria-label={t.reviewTitle} className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={stars === n}
            aria-label={t.reviewStars(n)}
            onClick={() => setStars(n)}
            className={parcial ? "h-10 w-10 inline-flex items-center justify-center text-oro-ink cursor-pointer" : "btn-icon text-oro-ink"}
          >
            <Star className={parcial ? "w-6 h-6" : "w-7 h-7"} strokeWidth={1.8} fill={n <= stars ? 'currentColor' : 'none'} aria-hidden />
          </button>
        ))}
      </div>
      {stars > 0 && (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={300}
            rows={3}
            aria-label={t.reviewPlaceholder}
            placeholder={t.reviewPlaceholder}
            className="mt-3 w-full rounded-xl border border-line-strong bg-raised px-3 py-2.5 text-ui text-ink placeholder:text-ink-3"
          />
          {text.trim().length >= 3 && (
            <label className="mt-2 flex items-start gap-2 text-ui text-ink-2">
              <input type="checkbox" checked={permit} onChange={(e) => setPermit(e.target.checked)} className="mt-1 h-5 w-5 shrink-0" />
              <span>{t.reviewPermit}</span>
            </label>
          )}
          {state === 'failed' && <p role="alert" className="mt-2 text-ui text-ink-2">{t.failed}</p>}
          <button type="submit" disabled={state === 'sending'} className="btn-primary w-full mt-3">
            {state === 'sending' ? t.sending : t.reviewSend}
          </button>
        </>
      )}
    </form>
  );
};

export default ReviewCard;
