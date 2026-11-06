import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';
import { avisoText } from '../i18n/aviso';
import { contactoText } from '../i18n/contacto';
import { ContactForm } from './ContactForm';

type Panel = 'privacy' | 'about' | 'contact' | null;

/**
 * Pie de la pantalla principal: privacidad, quiénes somos, contacto y compartir.
 * Sin banner ni ventanas al abrir la app: quien quiere leerlo, lo abre.
 */
export const FooterLinks: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const t = avisoText(currentLanguage);
  const tc = contactoText(currentLanguage);
  const [open, setOpen] = useState<Panel>(null);
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const share = async () => {
    const url = `${window.location.origin}/`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Audioguía Xolo', text: t.shareText, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      /* la persona canceló o no hay permiso: no pasa nada */
    }
  };

  const link = 'min-h-11 px-3 text-ui font-semibold text-ink-2 underline underline-offset-4 decoration-line-strong cursor-pointer';
  const title = open === 'privacy' ? t.privacyTitle : open === 'about' ? t.aboutTitle : t.contactTitle;

  return (
    <footer className="mt-12 border-t border-line pt-4 pb-6" aria-label={t.tagline}>
      <nav className="flex flex-wrap justify-center gap-x-1 gap-y-0">
        <button type="button" className={link} onClick={() => setOpen('privacy')}>{t.privacy}</button>
        <button type="button" className={link} onClick={() => setOpen('about')}>{t.about}</button>
        <button type="button" className={link} onClick={() => setOpen('contact')}>{t.contact}</button>
        <button type="button" className={link} onClick={share}>{copied ? t.shared : t.share}</button>
      </nav>
      <p className="mt-2 text-center text-cap text-ink-3">{t.tagline}</p>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-scrim backdrop-blur-sm" onClick={() => setOpen(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="footer-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-t-[24px] sm:rounded-[24px] bg-surface text-ink border border-line px-5 pt-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-2xl animate-sheet"
          >
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-line-strong sm:hidden" aria-hidden="true" />
            <div className="flex items-center justify-between">
              <h3 id="footer-title" className="font-serif text-h3 font-medium">{title}</h3>
              <button ref={closeRef} type="button" onClick={() => setOpen(null)} aria-label={t.close} className="btn-icon -mr-2 text-ink-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            {open === 'privacy' && (
              <div className="mt-2 space-y-4">
                <p className="text-ui leading-relaxed text-ink-2">{t.privacyIntro}</p>
                {[...t.privacyBlocks, tc.privacy].map(([h, body]) => (
                  <section key={h}>
                    <h4 className="text-ui font-bold text-ink">{h}</h4>
                    <p className="mt-1 text-ui leading-relaxed text-ink-2">{body}</p>
                  </section>
                ))}
                <p className="text-cap text-ink-3">{t.privacyUpdated}</p>
              </div>
            )}

            {open === 'about' && (
              <div className="mt-2 space-y-3">
                {t.aboutBody.map((p) => (
                  <p key={p} className="text-ui leading-relaxed text-ink-2">{p}</p>
                ))}
              </div>
            )}

            {open === 'contact' && (
              <div className="mt-2">
                <p className="text-ui leading-relaxed text-ink-2">{t.contactBody}</p>
                <ContactForm kind="mensaje" />
              </div>
            )}
          </div>
        </div>
      )}
    </footer>
  );
};

export default FooterLinks;
