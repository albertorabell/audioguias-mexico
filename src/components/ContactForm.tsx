import React, { useState } from 'react';
import { useLanguage } from '../utils/LanguageContext';
import { contactoText } from '../i18n/contacto';
import { sendContact } from '../utils/contactApi';
import { CONTACT_EMAIL } from '../config/contacto';
import { getAnalyticsSite } from '../utils/analytics';

interface Props {
  kind: 'mensaje' | 'error';
  /** Parada que se estaba viendo (solo para reportes de error). */
  pieceId?: string;
  pieceTitle?: string;
  placeholder?: string;
  onSent?: () => void;
}

/**
 * Formulario sencillo: mensaje y correo opcional. Lleva un campo oculto de trampa para programas.
 * Si el servidor no está disponible, queda el correo escrito como respaldo.
 */
export const ContactForm: React.FC<Props> = ({ kind, pieceId, pieceTitle, placeholder, onSent }) => {
  const { currentLanguage } = useLanguage();
  const t = contactoText(currentLanguage);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [trap, setTrap] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'bad_email' | 'busy' | 'failed'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === 'sending' || message.trim().length < 3) return;
    setState('sending');
    const site = getAnalyticsSite();
    const r = await sendContact({
      t: kind,
      m: message.trim(),
      ...(email.trim() ? { c: email.trim() } : {}),
      ...(pieceId ? { p: pieceId } : {}),
      ...(site ? { s: site } : {}),
      l: currentLanguage,
      web: trap,
    });
    if (r === 'ok') {
      setState('sent');
      setMessage('');
      onSent?.();
    } else {
      setState(r);
    }
  };

  if (state === 'sent') {
    return <p role="status" className="mt-4 rounded-xl bg-jade/15 border border-jade/50 p-4 text-ui font-semibold text-ink">{t.sent}</p>;
  }

  const field = 'mt-1 w-full rounded-xl border border-line-strong bg-raised px-3 py-2.5 text-ui text-ink placeholder:text-ink-3';
  const error = state === 'bad_email' ? t.badEmail : state === 'busy' ? t.busy : state === 'failed' ? t.failed : '';

  return (
    <form onSubmit={submit} className="mt-3" noValidate>
      <label className="block text-cap font-semibold text-ink-2" htmlFor={`cf-m-${kind}`}>{t.messageLabel}</label>
      <textarea
        id={`cf-m-${kind}`}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={2000}
        rows={4}
        placeholder={placeholder || t.messagePlaceholder}
        className={field}
        required
      />
      <label className="mt-3 block text-cap font-semibold text-ink-2" htmlFor={`cf-c-${kind}`}>{t.emailLabel}</label>
      <input
        id={`cf-c-${kind}`}
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        maxLength={120}
        className={field}
      />
      <p className="mt-1 text-cap text-ink-3">{t.emailHint}</p>
      {/* Campo trampa: fuera de la vista y del teclado; una persona nunca lo llena */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
        <input tabIndex={-1} autoComplete="off" value={trap} onChange={(e) => setTrap(e.target.value)} name="web" />
      </div>
      {pieceTitle && <p className="mt-2 text-cap text-ink-3">{t.attached(pieceTitle)}</p>}
      {error && <p role="alert" className="mt-3 text-ui font-semibold text-tezontle">{error}</p>}
      <button type="submit" disabled={state === 'sending' || message.trim().length < 3} className="btn-primary w-full mt-4 disabled:opacity-50">
        {state === 'sending' ? t.sending : t.send}
      </button>
      {CONTACT_EMAIL && (
        <p className="mt-3 text-center text-cap text-ink-3">
          {t.orWrite} <a className="underline underline-offset-2 select-all" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      )}
    </form>
  );
};

export default ContactForm;
