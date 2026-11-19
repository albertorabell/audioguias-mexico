import React, { useEffect, useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { SiteSummary, PieceData } from '../types';
import { useLanguage } from '../utils/LanguageContext';
import { localizeSite } from '../i18n/content';
import { portadaTexts } from '../i18n/portada';
import { PASS_DAYS, PASS_MAX_DEVICES } from '../config/pass';
import { formatPrice } from '../utils/price';
import { isFreeAccess } from '../utils/license';
import { InstallCard } from './InstallHelp';
import { FooterLinks } from './FooterLinks';
import { MuestraBoton } from './MuestraBoton';
import { LanguageMenu, ThemeButton } from './ui/HeaderControls';
import { PieceImage } from './PieceImage';
import { getAssetUrl } from '../utils/urlHelper';

interface HomeProps {
  sites: SiteSummary[];
  onSelectSite: (site: SiteSummary) => void;
  isLoading?: boolean;
  /** Cifras del museo abierto (salas, obras, obras gratis). */
  stats?: { rooms: number; works: number; free: number };
  /** Pieza cuya foto ilustra la tarjeta del museo. */
  coverPiece?: PieceData | null;
}

interface ComboPrecio {
  nombre: Record<string, string>;
  sitios: string[] | 'todos';
  mxn?: number;
  usd?: number | null;
}

/** Orden de las regiones en la portada; una región que no esté aquí va después, por orden de aparición. */
const ORDEN_REGIONES = ['cdmx', 'edomex', 'morelos', 'yucatan'];

/**
 * Portada: promesa, muestra de 30 s, datos clave, sitios por región (una tarjeta por fila, con su precio),
 * pases combinados y «cómo funciona» una sola vez.
 */
export const Home: React.FC<HomeProps> = ({ sites, onSelectSite, isLoading = false, stats, coverPiece }) => {
  const { currentLanguage, strings } = useLanguage();
  const t = portadaTexts(currentLanguage);
  const u = strings.ui.home;
  const locale = currentLanguage === 'es' ? 'es-MX' : currentLanguage;
  // Acceso gratis por ahora: los precios se ven tachados, con $0 y el aviso de que pronto se cobrará
  const gratis = isFreeAccess();
  const cero = (s: SiteSummary) => formatPrice(0, currentLanguage !== 'es' && s.pass_price_usd ? 'USD' : 'MXN', locale);

  // Los sitios en revisión (status "preview") solo se ven abriendo la app con ?preview al final de la dirección
  const verPrevia = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('preview');
  const active = sites.filter((s) => s.status === 'active' || !s.status || (verPrevia && s.status === 'preview'));

  // Pases combinados: la tabla pública de precios (la misma que usa el servidor de cobro)
  const [combos, setCombos] = React.useState<Array<{ id: string; nombre: string; n: number | 'todos'; precio: string }>>([]);
  useEffect(() => {
    let vivo = true;
    fetch(getAssetUrl('data/precios.json'))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!vivo || !d?.combos) return;
        const lista = Object.entries(d.combos as Record<string, ComboPrecio>).flatMap(([id, c]) => {
          const usd = currentLanguage !== 'es' && c.usd ? c.usd : null;
          const monto = usd ?? c.mxn;
          if (!monto) return [];
          return [{ id, nombre: c.nombre?.[currentLanguage] || c.nombre?.es || id, n: c.sitios === 'todos' ? ('todos' as const) : c.sitios.length, precio: formatPrice(monto, usd ? 'USD' : 'MXN', locale) }];
        });
        setCombos(lista);
      })
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, [currentLanguage, locale]);

  // Precio de un sitio en la moneda del idioma (pesos en español; dólares en los demás si el sitio los tiene)
  const precioDe = (s: SiteSummary): string => {
    if (s.access === 'free') return '';
    const usd = currentLanguage !== 'es' ? s.pass_price_usd : undefined;
    if (usd) return formatPrice(usd, 'USD', locale);
    return s.pass_price_mxn ? formatPrice(s.pass_price_mxn, 'MXN', locale) : '';
  };

  const datos = useMemo(() => {
    const paradas = active.reduce((n, s) => n + (s.id === 'MNA' ? stats?.works || s.highlights_count || 0 : s.highlights_count || 0), 0);
    const precios = active
      .filter((s) => s.access !== 'free')
      .map((s) => (currentLanguage !== 'es' && s.pass_price_usd ? { v: s.pass_price_usd, c: 'USD' } : s.pass_price_mxn ? { v: s.pass_price_mxn, c: 'MXN' } : null))
      .filter((x): x is { v: number; c: string } => !!x);
    // «Desde» solo compara precios de la misma moneda
    const moneda = precios[0]?.c;
    const minimo = moneda ? Math.min(...precios.filter((p) => p.c === moneda).map((p) => p.v)) : 0;
    return { paradas, desde: minimo ? formatPrice(minimo, moneda!, locale) : '' };
  }, [active, stats, currentLanguage, locale]);

  // Sitios por región, en el orden de CONTROL (sites.json ya viene ordenado)
  const grupos = useMemo(() => {
    const porRegion = new Map<string, SiteSummary[]>();
    for (const s of active) {
      const r = s.region || '';
      porRegion.set(r, [...(porRegion.get(r) || []), s]);
    }
    const claves = [...porRegion.keys()].sort((a, b) => {
      const ia = ORDEN_REGIONES.indexOf(a);
      const ib = ORDEN_REGIONES.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    return claves.map((k) => ({ region: k, items: porRegion.get(k)! }));
  }, [active]);

  // El aviso de instalar solo aparece cuando la persona ya escuchó un audio
  const yaEscucho = (() => {
    try {
      return localStorage.getItem('xolo_primer_audio') === '1';
    } catch {
      return false;
    }
  })();

  const franja = [t.paradas(datos.paradas), t.idiomas, t.sinSenal, !gratis && datos.desde ? t.desde(datos.desde) : '', t.telefonos(PASS_MAX_DEVICES)].filter((x) => x && !x.startsWith('0 '));

  return (
    <div className="min-h-dvh bg-bg text-ink pb-12">
      <header className="pt-safe">
        <div className="flex items-center justify-between h-14 pl-5 pr-2">
          <span className="flex items-center gap-2.5">
            <img src={getAssetUrl('icon.svg')} alt="" width={32} height={32} className="w-8 h-8 rounded-lg dark:hidden" draggable={false} />
            <img src={getAssetUrl('icon-oscuro.svg')} alt="" width={32} height={32} className="w-8 h-8 rounded-lg hidden dark:block" draggable={false} />
            <span className="font-serif text-[1.125rem] font-semibold tracking-[-0.01em]">{strings.common.appName}</span>
          </span>
          <div className="flex items-center">
            <LanguageMenu />
            <ThemeButton />
          </div>
        </div>
      </header>

      <main className="px-5">
        <section className="pt-5 pb-6">
          <h1 className="font-serif text-h1 font-medium tracking-[-0.02em] text-balance">{t.promesa}</h1>
          <p className="mt-3 text-[1.0625rem] leading-relaxed text-ink-2 max-w-[42ch]">{t.promesaSub}</p>
          <div className="mt-5">
            <MuestraBoton />
          </div>
          <ul className="mt-6 flex flex-wrap gap-1.5" aria-label={u.passBadgeTitle(PASS_DAYS, PASS_MAX_DEVICES)}>
            {franja.map((chip) => (
              <li key={chip} className="rounded-full border border-line bg-surface px-2.5 py-1 text-[0.8125rem] leading-tight font-semibold text-ink-2">
                {chip}
              </li>
            ))}
          </ul>
        </section>

        <section id="sites-grid-section" aria-label={t.sitiosTitulo}>
          {isLoading && <div className="h-80 rounded-[20px] bg-surface animate-pulse" />}
          {gratis && datos.desde && (
            <p className="mb-4 rounded-xl border border-jade/30 bg-jade/10 px-3.5 py-2.5 text-ui font-semibold text-jade-ink">{t.gratisAhora}</p>
          )}
          {grupos.map((g) => (
            <div key={g.region || 'otros'} className="mb-8">
              {g.region && <h2 className="mb-3 text-ui font-bold text-ink-2">{t.region[g.region] || g.region}</h2>}
              <div className="grid gap-3">
                {g.items.map((rawSite) => {
                  const site = localizeSite(rawSite, currentLanguage);
                  // Las cifras y la foto de portada del MNA vienen de sus datos; los demás sitios usan las de sites.json
                  const isMain = rawSite.id === 'MNA';
                  const statsText = isMain
                    ? stats && stats.works > 0 ? u.venueStats(stats.rooms, stats.works) : ''
                    : rawSite.highlights_count > 0 ? u.siteStats(rawSite.total_stops, rawSite.highlights_count) : '';
                  const precio = precioDe(rawSite);
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
                      className="flex rounded-[16px] overflow-hidden bg-surface border border-line cursor-pointer active:scale-[0.99] transition-transform"
                    >
                      <div className="relative w-[34%] max-w-[8.5rem] shrink-0 bg-raised">
                        {isMain && coverPiece && (
                          <PieceImage filename={coverPiece.image_filename} pieceId={coverPiece.piece_id} alt="" thumb className="absolute inset-0 w-full h-full object-cover" />
                        )}
                        {!isMain && rawSite.cover_image && rawSite.cover_piece_id && (
                          <PieceImage filename={rawSite.cover_image} pieceId={rawSite.cover_piece_id} alt="" thumb className="absolute inset-0 w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 px-3.5 py-3 flex flex-col">
                        <h3 className="font-serif text-[1.0625rem] leading-snug font-medium tracking-[-0.01em] text-balance">{site.name}</h3>
                        <p className="mt-0.5 text-cap text-ink-3 flex items-center gap-1 min-w-0">
                          <MapPin className="w-3 h-3 shrink-0" strokeWidth={2} />
                          <span className="truncate">{site.location}</span>
                        </p>
                          <div className="mt-auto pt-2 flex items-end justify-between gap-2">
                            <span className="text-cap text-ink-2 leading-tight">{statsText}</span>
                            {precio && <span className="shrink-0 rounded-full border border-line bg-raised px-2 py-0.5 text-cap font-semibold text-ink">{gratis ? <><s className="font-normal text-ink-3">{precio}</s> <span className="text-jade-ink">{cero(rawSite)}</span></> : precio}</span>}
                          </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        {combos.length > 0 && (
          <section aria-labelledby="combos-title" className="mt-2">
            <h2 id="combos-title" className="font-serif text-h3 font-medium">{t.combosTitulo}</h2>
            <p className="mt-1 text-ui text-ink-2">{t.combosTexto}</p>
            <ul className="mt-3 border-t border-line">
              {combos.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-3 border-b border-line">
                  <span className="min-w-0">
                    <span className="block text-[1rem] font-semibold text-ink">{c.nombre}</span>
                    {c.n !== 'todos' && <span className="block text-cap text-ink-3">{t.combosIncluye(c.n)}</span>}
                  </span>
                  {gratis ? (
                    <s className="shrink-0 text-cap text-ink-3">{c.precio}</s>
                  ) : (
                    <span className="shrink-0 rounded-full border border-line bg-raised px-2.5 py-1 text-cap font-semibold text-ink">{c.precio}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-12" aria-labelledby="como-title">
          <h2 id="como-title" className="font-serif text-h3 font-medium">{t.comoTitulo}</h2>
          <ol className="mt-4 space-y-4">
            {u.howSteps(0, PASS_DAYS, PASS_MAX_DEVICES).map((paso, i) => (
              <li key={i} className="flex gap-4">
                <span className="font-serif text-[1.375rem] leading-none text-jade-ink w-5 shrink-0 pt-0.5">{i + 1}</span>
                <p className="text-[1rem] leading-relaxed text-ink-2">{paso}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-ui leading-relaxed text-ink-2">{u.passBadgeText}</p>
        </section>

        {yaEscucho && (
          <div className="mt-10">
            <InstallCard />
          </div>
        )}

        <FooterLinks />
      </main>
    </div>
  );
};

export default Home;
