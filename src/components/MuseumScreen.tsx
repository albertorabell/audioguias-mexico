import React, { useMemo, useState } from 'react';
import {
  Accessibility,
  Backpack,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock,
  Coffee,
  ExternalLink,
  Eye,
  Headphones,
  Info,
  Lightbulb,
  Map as MapIcon,
  MapPin,
  Route as RouteIcon,
  ShieldCheck,
  Smartphone,
  SlidersHorizontal,
  Sun,
  Ticket,
  WifiOff,
} from 'lucide-react';
import { SiteSummary, SiteManifest, SiteRoute, Room, PieceData, BeforeVisitItem } from '../types';
import { useLanguage } from '../utils/LanguageContext';
import { PASS_HOURS, PASS_MAX_DEVICES } from '../config/pass';
import { SPEECH_LOCALE } from '../i18n/languages';
import { getRoomShortLabel } from '../utils/roomLabel';
import { calculateRouteTimeMinutes, formatRouteDuration, formatRouteDurationShort } from '../utils/routeOptimizer';
import { localizeBeforeVisit } from '../i18n/content';
import { TopBar } from './ui/TopBar';
import { LanguageMenu, PassButton } from './ui/HeaderControls';
import { PieceImage } from './PieceImage';
import { OfflineTourBanner } from './OfflineTourBanner';
import { IntroTour } from './IntroTour';

export interface ContinueInfo {
  eyebrow: string;
  title: string;
  detail: string;
  imageFilename?: string;
  pieceId?: string;
  onContinue: () => void;
}

interface MuseumScreenProps {
  site: SiteSummary;
  manifest: SiteManifest | null;
  rooms: Room[];
  pieces: PieceData[];
  hasPass: boolean;
  floor: 'PB' | 'PA';
  onFloorChange: (f: 'PB' | 'PA') => void;
  continueInfo?: ContinueInfo | null;
  audioPieces: PieceData[];
  onBack: () => void;
  onOpenPaywall: () => void;
  /** Abre una obra por su id (las obras gratis del inicio). Sin esta función no se muestra ese bloque. */
  onOpenPiece?: (pieceId: string) => void;
  onSelectRoom: (room: Room) => void;
  onStartRoute: (route: SiteRoute) => void;
  /** Sin esta función no se ofrece "arma tu ruta" (los sitios al aire libre solo tienen sus rutas armadas). */
  onOpenWizard?: () => void;
  /** Sin plano (sitios nuevos sin mapa) no hay botón "ver plano". */
  onOpenMap?: () => void;
  /** Abre la pestaña de recorridos (para "ver todos"). */
  onOpenRoutes?: () => void;
  /** Sitio al aire libre: sin selector de pisos. */
  zones?: boolean;
}

/** Ordena las piezas de una sala como se recorren. */
export const byOrder = (a: PieceData, b: PieceData) => (a.orden_sugerido || 99) - (b.orden_sugerido || 99);

const minutesOf = (r: SiteRoute) => r.estimated_minutes || calculateRouteTimeMinutes(r.stops);
/** Duración dentro de una frase, sin que se parta entre dos líneas («7 h 30 min»). */
const inlineDuration = (m: number) => formatRouteDuration(m).replace(/ /g, '\u00a0');

/** Íconos de «Qué incluye el pase», en el mismo orden que los textos (museum.passItems). */
const PASS_ICONS: React.ElementType[] = [Headphones, Eye, RouteIcon, WifiOff, Smartphone];

/** Precio en la moneda del idioma: pesos en español, dólares en los demás (si el sitio tiene precio en dólares). Vacío si no hay precio. */
function passPrice(site: SiteSummary, lang: string, locale: string): string {
  const usd = lang !== 'es' && site.pass_price_usd ? site.pass_price_usd : 0;
  const amount = usd || site.pass_price_mxn || 0;
  if (!amount) return '';
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: usd ? 'USD' : 'MXN', maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount} ${usd ? 'USD' : 'MXN'}`;
  }
}

/** Ícono de cada tema de «Antes de ir» (columna `tema` del Sheet). */
const TOPIC_ICONS: Record<string, React.ElementType> = {
  llegar: MapPin,
  horario: Clock,
  boletos: Ticket,
  cuando: CalendarDays,
  llevar: Backpack,
  clima: Sun,
  accesibilidad: Accessibility,
  servicios: Coffee,
  reglas: ShieldCheck,
  consejo: Lightbulb,
};

/** Párrafos (separados por una línea en blanco) y listas (líneas que empiezan con «- »). */
function RichText({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length && lines.every((l) => /^[-•]\s+/.test(l))) {
          return (
            <ul key={i} className="space-y-1.5">
              {lines.map((l, j) => (
                <li key={j} className="relative pl-4 before:content-[''] before:absolute before:left-0 before:top-[0.7em] before:w-1.5 before:h-1.5 before:rounded-full before:bg-ink-3">
                  {l.replace(/^[-•]\s+/, '')}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="whitespace-pre-line text-pretty">
            {block}
          </p>
        );
      })}
    </>
  );
}

/**
 * Inicio de un sitio (pestaña «Museo» o «Sitio»). De arriba abajo: portada con lo esencial del lugar, los recorridos
 * ordenados por duración, «Antes de ir» (si el Sheet lo trae), las salas o zonas, la presentación larga y el uso sin internet.
 */
export const MuseumScreen: React.FC<MuseumScreenProps> = ({
  site,
  manifest,
  rooms,
  pieces,
  hasPass,
  floor,
  onFloorChange,
  continueInfo,
  audioPieces,
  onBack,
  onOpenPaywall,
  onOpenPiece,
  onSelectRoom,
  onStartRoute,
  onOpenWizard,
  onOpenMap,
  onOpenRoutes,
  zones = false,
}) => {
  const { strings, currentLanguage } = useLanguage();
  const u = strings.ui;
  const m = u.museum;
  const [introOpen, setIntroOpen] = useState<boolean>(false);
  // La presentación larga muestra el primer párrafo; el resto se abre con «Seguir leyendo»
  const [introMore, setIntroMore] = useState<boolean>(false);
  const [openTopics, setOpenTopics] = useState<Set<number>>(() => new Set());

  const pieceById = useMemo(() => new Map(pieces.map((p) => [p.piece_id, p])), [pieces]);
  const piecesByRoom = useMemo(() => {
    const map = new Map<string, PieceData[]>();
    for (const p of pieces) {
      const list = map.get(p.room_id) || [];
      list.push(p);
      map.set(p.room_id, list);
    }
    for (const list of map.values()) list.sort(byOrder);
    return map;
  }, [pieces]);

  const countPB = rooms.filter((r) => r.piso === 'PB').length;
  const countPA = rooms.filter((r) => r.piso === 'PA').length;
  const showFloors = !zones && countPB > 0 && countPA > 0;

  const floorRooms = useMemo(
    () =>
      rooms
        .filter((r) => !showFloors || r.piso === floor)
        .sort((a, b) => (parseInt(String(a.numero_oficial), 10) || 0) - (parseInt(String(b.numero_oficial), 10) || 0)),
    [rooms, floor, showFloors]
  );
  const routes = useMemo(() => (manifest?.routes || []).filter((r) => r.stops?.length), [manifest]);

  /** Los recorridos del inicio: los de «según tu tiempo» (o todos si el sitio no los agrupa), del más corto al más largo. */
  const shelf = useMemo(() => {
    const byTime = routes.filter((r) => !r.group || r.group === 'tiempo');
    return [...(byTime.length ? byTime : routes)].sort((a, b) => minutesOf(a) - minutesOf(b)).slice(0, 6);
  }, [routes]);

  const range = useMemo(() => {
    const all = routes.map(minutesOf).filter((x) => x > 0);
    return all.length ? { min: Math.min(...all), max: Math.max(...all) } : null;
  }, [routes]);

  /** Foto de la portada: la del sitio, o la primera obra de un recorrido que tenga imagen. */
  const coverPiece = useMemo(() => {
    const byId = (id?: string) => (id ? pieceById.get(id) : undefined);
    const direct = byId(site.cover_piece_id) || pieces.find((p) => p.image_filename === site.cover_image);
    if (direct?.image_filename) return direct;
    for (const r of shelf) for (const s of r.stops) {
      const p = byId(s.piece_id || s.id || s.poi_id);
      if (p?.image_filename) return p;
    }
    return pieces.find((p) => p.image_filename);
  }, [site, pieces, pieceById, shelf]);

  const before = useMemo(
    () => (manifest?.before_visit || []).map((item) => localizeBeforeVisit(item, currentLanguage) as BeforeVisitItem),
    [manifest, currentLanguage]
  );

  // La descripción corta abre la página; la presentación larga va más abajo, en «Sobre el museo / el sitio»
  const lead = (site.description || '').trim();
  const introParagraphs = useMemo(() => {
    const text = (site.intro || '').trim();
    return text ? text.split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean) : [];
  }, [site.intro]);

  const toggleTopic = (i: number) =>
    setOpenTopics((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });

  /** Obras que se pueden escuchar sin pase: la invitación a probar antes de comprar. Solo para quien aún no tiene pase. */
  const freePieces = useMemo(() => (hasPass || !onOpenPiece ? [] : pieces.filter((p) => p.is_free).sort(byOrder).slice(0, 8)), [pieces, hasPass, onOpenPiece]);

  /** Qué se compra y cómo: solo para quien aún no tiene pase y en sitios que se venden con pase (no los de código ni los gratis). */
  const showPass = !hasPass && site.access !== 'code' && site.access !== 'free';
  const price = passPrice(site, currentLanguage, SPEECH_LOCALE[currentLanguage]);

  const scrollToBefore = () => document.getElementById('before-visit')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="min-h-dvh bg-bg text-ink pb-tabbar">
      <TopBar
        onBack={onBack}
        backLabel={u.homeLabel}
        title={site.name}
        revealAfter={coverPiece ? 300 : 90}
        right={
          <>
            <LanguageMenu />
            <PassButton hasPass={hasPass} onClick={onOpenPaywall} />
          </>
        }
      />

      <main>
        {/* Portada: foto a todo lo ancho y, debajo, el nombre, dónde está y de qué trata */}
        <header id="site-hero">
          {coverPiece && (
            <div className="bg-raised">
              <PieceImage
                filename={coverPiece.image_filename}
                pieceId={coverPiece.piece_id}
                alt=""
                className="block w-full aspect-[3/2] max-h-[22rem] object-cover"
              />
            </div>
          )}
          <div className="px-5 pt-6">
            <h1 className="font-serif text-h1 font-medium tracking-[-0.02em] text-balance">{site.name}</h1>
            {(site.location || site.badge) && (
              <p className="mt-2 text-ui text-ink-3">
                {site.location}
                {site.location && site.badge && <br />}
                {site.badge}
              </p>
            )}
            {lead && <p className="mt-5 font-serif text-[1.1875rem] leading-[1.5] text-ink-2 text-pretty">{lead}</p>}
            <p id="site-facts" className="mt-4 text-ui text-ink-2">
              {m.facts(u.worksCount(pieces.length), u.roomsCount(rooms.length))}
              {range && ` ${range.min === range.max ? m.routeOne(inlineDuration(range.min)) : m.routeRange(inlineDuration(range.min), inlineDuration(range.max))}`}
            </p>
            {before.length > 0 && (
              <button
                type="button"
                id="btn-before-link"
                onClick={scrollToBefore}
                className="mt-3 -ml-1 min-h-10 px-1 inline-flex items-center gap-1.5 text-ui font-semibold text-jade-ink cursor-pointer rounded-lg text-left"
              >
                <Info className="w-4 h-4 shrink-0" strokeWidth={2} />
                {m.beforeLink}
              </button>
            )}
          </div>
        </header>

        {continueInfo && (
          <section className="px-5 mt-8">
            <button
              type="button"
              id="btn-continue"
              onClick={continueInfo.onContinue}
              className="w-full text-left rounded-2xl bg-surface border border-jade/35 p-3 pr-4 flex items-center gap-3.5 cursor-pointer active:scale-[0.99] transition-transform"
            >
              <span className="w-14 h-14 rounded-xl overflow-hidden bg-raised shrink-0">
                <PieceImage filename={continueInfo.imageFilename} pieceId={continueInfo.pieceId} alt="" className="w-full h-full object-cover" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-cap font-semibold text-jade-ink">{continueInfo.eyebrow}</span>
                <span className="block text-[1.0625rem] font-bold text-ink truncate">{continueInfo.title}</span>
                <span className="block text-cap text-ink-3 truncate">{continueInfo.detail}</span>
              </span>
              <ChevronRight className="w-5 h-5 text-jade-ink shrink-0" />
            </button>
          </section>
        )}

        {/* Prueba gratis: las obras abiertas, para que se escuche cómo suena antes de comprar */}
        {freePieces.length > 0 && onOpenPiece && (
          <section id="free-pieces" className="mt-10 scroll-mt-20" aria-labelledby="free-title">
            <div className="px-5">
              <h2 id="free-title" className="font-serif text-[1.625rem] leading-tight font-medium text-balance">
                {m.freeTitle(freePieces.length)}
              </h2>
              <p className="mt-1.5 text-cap text-ink-3 text-pretty">{m.freeSub}</p>
            </div>
            <ul className="mt-4 flex gap-3 overflow-x-auto px-5 pb-1 snap-x snap-mandatory [scrollbar-width:none]">
              {freePieces.map((p) => (
                <li key={p.piece_id} className="snap-start shrink-0 w-[11.5rem]">
                  <button
                    type="button"
                    data-testid="free-piece-card"
                    onClick={() => onOpenPiece(p.piece_id)}
                    className="w-full text-left rounded-2xl bg-surface border border-line overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <span className="relative block bg-raised">
                      <PieceImage filename={p.image_filename} pieceId={p.piece_id} alt="" className="block w-full aspect-[4/3] object-cover" />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-jade text-on-jade text-[12px] font-bold">{u.free}</span>
                    </span>
                    <span className="block p-3">
                      <span className="block text-[1rem] font-bold leading-snug text-ink">{p.title}</span>
                      {p.frase_gancho && <span className="mt-1 block text-cap leading-[1.4] text-ink-3 line-clamp-2">{p.frase_gancho}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="px-5 mt-3">
              <button type="button" id="btn-free-unlock" onClick={onOpenPaywall} className="min-h-11 px-1 -ml-1 inline-flex items-center gap-1.5 text-ui font-semibold text-jade-ink cursor-pointer rounded-lg text-left">
                {m.freeUnlock}
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </section>
        )}

        {/* Qué incluye el pase: lo que se compra, cuánto cuesta y cómo se paga */}
        {showPass && (
          <section id="pass-info" className="mt-12 px-5" aria-labelledby="pass-title">
            <h2 id="pass-title" className="font-serif text-[1.625rem] leading-tight font-medium">
              {m.passTitle}
            </h2>
            <p className="mt-1.5 text-cap text-ink-3 text-pretty">{m.passLead(PASS_HOURS)}</p>
            {freePieces.length > 0 && (
              <button
                type="button"
                id="btn-pass-try-free"
                onClick={() => document.getElementById('free-pieces')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="mt-2 -ml-1 min-h-11 px-1 inline-flex items-center gap-1.5 text-ui font-semibold text-jade-ink cursor-pointer rounded-lg text-left"
              >
                {m.passTryFree(u.worksCount(freePieces.length))}
                <ChevronRight className="w-4 h-4 -rotate-90" aria-hidden="true" />
              </button>
            )}
            <ul className="mt-4 border-t border-line">
              {m.passItems(u.worksCount(pieces.length), PASS_MAX_DEVICES).map((item, i) => {
                const Icon = PASS_ICONS[i] || Info;
                return (
                  <li key={i} className="flex items-start gap-3.5 py-4 border-b border-line">
                    <Icon className="w-5 h-5 mt-0.5 text-jade-ink shrink-0" strokeWidth={1.9} aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-[1.0625rem] font-bold leading-snug text-ink">{item.title}</p>
                      <p className="mt-0.5 text-ui leading-[1.5] text-ink-2 text-pretty">{item.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <h3 className="mt-6 text-ui font-bold text-ink-2">{m.passHowTitle}</h3>
            <ol className="mt-2 space-y-2.5">
              {m.passHow.map((step, i) => (
                <li key={i} className="flex gap-3.5">
                  <span className="font-serif text-[1.25rem] leading-none text-jade-ink w-4 shrink-0 pt-0.5">{i + 1}</span>
                  <p className="text-ui leading-[1.5] text-ink-2 text-pretty">{step}</p>
                </li>
              ))}
            </ol>
            <button type="button" id="btn-pass-unlock" onClick={onOpenPaywall} className="btn-primary w-full mt-5">
              {m.passCta(price)}
            </button>
          </section>
        )}

        {/* Recorridos: una lista de horario, con la duración a la izquierda */}
        {shelf.length > 0 && (
          <section id="time-chooser" className="mt-10 px-5" aria-labelledby="routes-title">
            <h2 id="routes-title" className="font-serif text-[1.625rem] leading-tight font-medium">
              {m.routesTitle}
            </h2>
            <p className="mt-1.5 text-cap text-ink-3 text-pretty">{m.routesSub}</p>
            <ul className="mt-4 border-t border-line">
              {shelf.map((route, i) => (
                <li key={route.id} className="border-b border-line">
                  <button
                    type="button"
                    id={i === 0 ? 'first-route-card' : undefined}
                    onClick={() => onStartRoute(route)}
                    className="w-full flex items-start gap-4 py-4 text-left cursor-pointer row-press"
                  >
                    <span className="w-[4.75rem] shrink-0 pt-0.5">
                      <span className="block font-serif text-[1.375rem] leading-none tabular-nums text-ink whitespace-nowrap">
                        {formatRouteDurationShort(minutesOf(route))}
                      </span>
                      <span className="block mt-1.5 text-cap text-ink-3">{u.worksCount(route.stops.length)}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[1.0625rem] font-bold leading-snug text-ink">{route.name}</span>
                      {route.description && <span className="mt-1 text-cap leading-[1.45] text-ink-3 line-clamp-2">{route.description}</span>}
                    </span>
                    <ChevronRight className="w-5 h-5 text-ink-3 shrink-0 self-center" aria-hidden="true" />
                  </button>
                </li>
              ))}
              {onOpenWizard && (
                <li className="border-b border-line">
                  <button type="button" id="btn-open-wizard" onClick={onOpenWizard} className="w-full flex items-center gap-4 py-4 text-left cursor-pointer row-press">
                    <span className="w-[4.75rem] shrink-0">
                      <SlidersHorizontal className="w-6 h-6 text-jade-ink" strokeWidth={1.8} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[1.0625rem] font-bold leading-snug text-ink">{m.buildOwn}</span>
                      <span className="mt-0.5 block text-cap text-ink-3">{m.buildOwnSub}</span>
                    </span>
                    <ChevronRight className="w-5 h-5 text-ink-3 shrink-0" aria-hidden="true" />
                  </button>
                </li>
              )}
            </ul>
            {onOpenRoutes && routes.length > shelf.length && (
              <button
                type="button"
                id="btn-all-routes"
                onClick={onOpenRoutes}
                className="mt-2 -ml-1 h-11 px-1 inline-flex items-center gap-1 text-ui font-semibold text-jade-ink cursor-pointer rounded-lg"
              >
                {routes.some((r) => r.group === 'tema') ? m.allRoutes(routes.length) : m.allRoutesPlain(routes.length)}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </section>
        )}

        {/* Antes de ir: temas que se abren uno por uno */}
        {before.length > 0 && (
          <section id="before-visit" className="mt-12 px-5 scroll-mt-20" aria-labelledby="before-title">
            <h2 id="before-title" className="font-serif text-[1.625rem] leading-tight font-medium">
              {m.beforeTitle}
            </h2>
            <ul className="mt-4 border-t border-line">
              {before.map((item, i) => {
                const Icon = TOPIC_ICONS[item.topic] || Info;
                const open = openTopics.has(i);
                return (
                  <li key={`${item.topic}-${i}`} className="border-b border-line">
                    <button
                      type="button"
                      id={`before-topic-${i}`}
                      aria-expanded={open}
                      aria-controls={`before-panel-${i}`}
                      onClick={() => toggleTopic(i)}
                      className="w-full flex items-center gap-3.5 py-4 text-left cursor-pointer row-press"
                    >
                      <Icon className="w-5 h-5 text-jade-ink shrink-0" strokeWidth={1.9} aria-hidden="true" />
                      <span className="min-w-0 flex-1 text-[1.0625rem] font-bold leading-snug text-ink">{item.title}</span>
                      <ChevronDown className={`w-5 h-5 text-ink-3 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>
                    {open && (
                      <div id={`before-panel-${i}`} className="pl-[2.125rem] pb-5 -mt-1 space-y-3 text-[1rem] leading-[1.6] text-ink-2">
                        <RichText text={item.text} />
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 min-h-10 text-ui font-semibold text-jade-ink"
                          >
                            {item.link_label || m.moreInfo}
                            <ExternalLink className="w-4 h-4" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Salas o zonas: lista sencilla con su número */}
        <section className="mt-12" aria-labelledby="rooms-title">
          <div className="px-5 flex items-baseline justify-between gap-3">
            <h2 id="rooms-title" className="font-serif text-[1.625rem] leading-tight font-medium">
              {m.rooms}
            </h2>
            {onOpenMap && (
              <button
                type="button"
                onClick={onOpenMap}
                className="h-10 -mr-2 px-2 inline-flex items-center gap-1.5 text-ui font-semibold text-jade-ink cursor-pointer rounded-full active:bg-raised"
              >
                <MapIcon className="w-4 h-4" strokeWidth={2} />
                {m.seeMap}
              </button>
            )}
          </div>

          {showFloors && (
            <div className="px-5 mt-3">
              <FloorSwitch floor={floor} onChange={onFloorChange} countPB={countPB} countPA={countPA} />
            </div>
          )}

          <ul className="mt-3 mx-5 border-t border-line md:grid md:grid-cols-2 md:gap-x-6" id="rooms-list">
            {floorRooms.map((room) => {
              const list = piecesByRoom.get(room.room_id) || [];
              return (
                <li key={room.room_id} className="border-b border-line">
                  <button type="button" onClick={() => onSelectRoom(room)} className="w-full flex items-center gap-4 py-3.5 text-left cursor-pointer row-press">
                    <span className="font-serif text-[1.25rem] leading-none text-ink-3 w-8 shrink-0 tabular-nums">{getRoomShortLabel(room)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[1.0625rem] font-bold leading-snug text-ink">{room.nombre_oficial}</span>
                      <span className="block text-cap text-ink-3 mt-0.5">{u.worksCount(list.length)}</span>
                    </span>
                    <ChevronRight className="w-5 h-5 text-ink-3 shrink-0" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Sobre el sitio: la presentación larga */}
        {introParagraphs.length > 0 && (
          <section className="mt-12 px-5" aria-labelledby="about-title">
            <h2 id="about-title" className="font-serif text-[1.625rem] leading-tight font-medium">
              {m.aboutTitle}
            </h2>
            <div id="site-intro" className="mt-4 space-y-4">
              {(introMore ? introParagraphs : introParagraphs.slice(0, 1)).map((text, i) => (
                <p key={i} className="text-[1rem] leading-[1.6] text-ink-2 text-pretty">
                  {text}
                </p>
              ))}
            </div>
            {introParagraphs.length > 1 && (
              <button
                type="button"
                id="btn-intro-more"
                aria-expanded={introMore}
                aria-controls="site-intro"
                onClick={() => setIntroMore((v) => !v)}
                className="mt-2 -ml-1 h-10 px-1 text-ui font-semibold text-jade-ink cursor-pointer rounded-lg"
              >
                {introMore ? m.readLess : m.readMore}
              </button>
            )}
          </section>
        )}

        <section className="px-5 mt-12">
          <OfflineTourBanner pieces={pieces} audioPieces={audioPieces} />
          {!zones && (
            <button
              type="button"
              id="btn-open-intro"
              onClick={() => setIntroOpen(true)}
              className="mt-3 -ml-1 h-10 px-1 inline-flex items-center gap-1.5 text-ui font-semibold text-jade-ink cursor-pointer rounded-lg"
            >
              <CircleHelp className="w-4 h-4" strokeWidth={2} />
              {strings.intro.openLabel}
            </button>
          )}
        </section>
      </main>

      {!zones && <IntroTour open={introOpen} onClose={() => setIntroOpen(false)} onConfigureRoute={onOpenWizard ?? (() => {})} />}
    </div>
  );
};

export const FloorSwitch: React.FC<{
  floor: 'PB' | 'PA';
  onChange: (f: 'PB' | 'PA') => void;
  countPB?: number;
  countPA?: number;
}> = ({ floor, onChange, countPB, countPA }) => {
  const u = useLanguage().strings.ui;
  const opts: { id: 'PB' | 'PA'; label: string; sub: string; n?: number }[] = [
    { id: 'PB', label: u.floors.PB, sub: u.floors.PBsub, n: countPB },
    { id: 'PA', label: u.floors.PA, sub: u.floors.PAsub, n: countPA },
  ];
  return (
    <div id="floor-switch" role="tablist" aria-label={u.floors.aria} className="grid grid-cols-2 p-1 rounded-2xl bg-surface border border-line">
      {opts.map((o) => {
        const on = floor === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={on}
            id={`floor-${o.id}`}
            onClick={() => onChange(o.id)}
            className={`min-h-12 px-3 rounded-xl text-left cursor-pointer transition-colors ${
              on ? 'bg-raised text-ink shadow-sm' : 'text-ink-3'
            }`}
          >
            <span className="block text-ui font-bold leading-tight">{o.label}</span>
            <span className="block text-[12px] leading-tight mt-0.5">
              {o.sub}
              {o.n ? ` · ${u.roomsCount(o.n)}` : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default MuseumScreen;
