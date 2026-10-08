import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { SiteSummary, PieceData } from '../types';
import { useLanguage } from '../utils/LanguageContext';
import { localizeSite } from '../i18n/content';
import { PASS_HOURS, PASS_MAX_DEVICES } from '../config/pass';
import { InstallCard } from './InstallHelp';
import { LanguageMenu, ThemeButton } from './ui/HeaderControls';
import { PieceImage } from './PieceImage';

interface HomeProps {
  sites: SiteSummary[];
  onSelectSite: (site: SiteSummary) => void;
  isLoading?: boolean;
  /** Cifras del museo abierto (salas, obras, obras gratis). */
  stats?: { rooms: number; works: number; free: number };
  /** Pieza cuya foto ilustra la tarjeta del museo. */
  coverPiece?: PieceData | null;
}

/**
 * Pantalla de inicio: lo primero que se ve son los museos. La explicación del pase va después, en corto.
 */
export const Home: React.FC<HomeProps> = ({ sites, onSelectSite, isLoading = false, stats, coverPiece }) => {
  const { currentLanguage, strings } = useLanguage();
  const t = strings.home;
  const u = strings.ui.home;
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3000);
  };

  const active = sites.filter((s) => s.status !== 'coming_soon');
  const soon = sites.filter((s) => s.status === 'coming_soon');

  return (
    <div className="min-h-dvh bg-bg text-ink pb-12">
      {toast && (
        <div
          role="status"
          className="fixed top-[calc(env(safe-area-inset-top,0px)+0.75rem)] left-1/2 -translate-x-1/2 z-50 max-w-[90vw] px-4 py-3 rounded-2xl bg-raised text-ink text-ui shadow-2xl shadow-black/40 border border-line animate-fadeIn"
        >
          {toast}
        </div>
      )}

      <header className="pt-safe">
        <div className="flex items-center justify-between h-14 pl-5 pr-2">
          <span className="font-serif text-[1.125rem] font-semibold tracking-[-0.01em]">{strings.common.appName}</span>
          <div className="flex items-center">
            <LanguageMenu />
            <ThemeButton />
          </div>
        </div>
      </header>

      <main className="px-5">
        <section className="pt-6 pb-8">
          <h1 className="font-serif text-h1 font-medium tracking-[-0.02em] text-balance">{t.heroTitle}</h1>
          <p className="mt-3 text-[1.0625rem] leading-relaxed text-ink-2 max-w-[34ch]">{u.subtitle}</p>
        </section>

        <section id="sites-grid-section" aria-label={u.venuesAria} className="space-y-3">
          {isLoading && <div className="h-80 rounded-[20px] bg-surface animate-pulse" />}
          {active.map((rawSite) => {
            const site = localizeSite(rawSite, currentLanguage);
            return (
              <div
                key={site.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectSite(rawSite)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectSite(rawSite);
                  }
                }}
                className="block rounded-[20px] overflow-hidden bg-surface border border-line cursor-pointer active:scale-[0.99] transition-transform"
              >
                <div className="relative aspect-[16/10] bg-raised">
                  {coverPiece && (
                    <PieceImage
                      filename={coverPiece.image_filename}
                      pieceId={coverPiece.piece_id}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/0 pointer-events-none" />
                  <span className="absolute left-4 bottom-3 text-cap font-semibold text-white/90 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" strokeWidth={2} />
                    {site.location}
                  </span>
                </div>
                <div className="p-5 pt-4">
                  <h2 className="font-serif text-h2 font-medium tracking-[-0.015em]">{site.name}</h2>
                  {stats && stats.works > 0 && (
                    <p className="mt-1.5 text-ui text-ink-2">{u.venueStats(stats.rooms, stats.works)}</p>
                  )}
                  <span className="btn-primary w-full mt-4">{u.enter}</span>
                </div>
              </div>
            );
          })}
        </section>

        {soon.length > 0 && (
          <section className="mt-10" aria-labelledby="soon-title">
            <h2 id="soon-title" className="text-ui font-bold text-ink-2">
              {t.comingSoon}
            </h2>
            <ul className="mt-2 border-t border-line">
              {soon.map((rawSite) => {
                const site = localizeSite(rawSite, currentLanguage);
                return (
                  <li key={site.id} className="border-b border-line">
                    <button
                      type="button"
                      onClick={() => showToast(t.siteSoonToast(site.name))}
                      className="w-full py-3.5 text-left flex items-center justify-between gap-3 cursor-pointer row-press -mx-2 px-2 rounded-lg"
                    >
                      <span className="min-w-0">
                        <span className="block text-[1rem] font-semibold text-ink">{site.name}</span>
                        <span className="block text-cap text-ink-3">{site.location}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section className="mt-12" aria-labelledby="how-title">
          <h2 id="how-title" className="font-serif text-h3 font-medium">
            {u.howTitle}
          </h2>
          <ol className="mt-4 space-y-4">
            {u.howSteps(stats?.free || 0, PASS_HOURS, PASS_MAX_DEVICES).map((step, i) => (
              <li key={i} className="flex gap-4">
                <span className="font-serif text-[1.375rem] leading-none text-jade w-5 shrink-0 pt-0.5">{i + 1}</span>
                <p className="text-[1rem] leading-relaxed text-ink-2">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-10">
          <InstallCard />
        </div>
      </main>
    </div>
  );
};

export default Home;
