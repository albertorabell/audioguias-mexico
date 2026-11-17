import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';
import { contactoText } from '../i18n/contacto';
import { sendContact } from '../utils/contactApi';
import { getAnalyticsSite } from '../utils/analytics';

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

/**
 * Opinión al terminar una ruta: estrellas (obligatorias), una frase opcional y el permiso, desmarcado de entrada,
 * para publicarla sin nombre. Se manda al mismo servidor que el formulario de contacto (tipo «resena»).
 * Una vez enviada no vuelve a aparecer para ese sitio.
 */
export const ReviewCard: React.FC<{ routeName: string }> = ({ routeName }) => {
  const { currentLanguage } = useLanguage();
  const t = contactoText(currentLanguage);
  const site = getAnalyticsSite() || '';
  const [stars, setStars] = useState(0);
  const [text, setText] = useState('');
  const [permit, setPermit] = useState(false);
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>(() => (yaEnvio(site) ? 'sent' : 'idle'));
  const [justSent, setJustSent] = useState(false);

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
      p: `ruta: ${routeName}`.slice(0, 80),
      ...(site ? { s: site } : {}),
      l: currentLanguage,
      web: '',
    });
    if (r === 'ok') {
      marcarEnviada(site);
      setJustSent(true);
      setState('sent');
    } else {
      setState('failed');
    }
  };

  return (
    <form id="review-card" onSubmit={submit} className="mt-8 rounded-2xl border border-line bg-surface p-4" noValidate>
      <h2 className="font-serif text-h3 font-medium">{t.reviewTitle}</h2>
      <p className="mt-1 text-ui text-ink-2">{t.reviewSub}</p>
      <div role="radiogroup" aria-label={t.reviewTitle} className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={stars === n}
            aria-label={t.reviewStars(n)}
            onClick={() => setStars(n)}
            className="btn-icon text-oro-ink"
          >
            <Star className="w-7 h-7" strokeWidth={1.8} fill={n <= stars ? 'currentColor' : 'none'} aria-hidden />
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
