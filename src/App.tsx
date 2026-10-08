import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { SiteSummary, SiteManifest, SiteRoute, PieceData, SiteLicense, Room } from './types';
import { getSiteLicense, activatePass, revokePass, hasActivePass } from './utils/license';
import { readPaymentReturn, redeemPendingSession, RETRYABLE_ERRORS } from './utils/payments';
import { PASS_HOURS } from './config/pass';
import { Home } from './components/Home';
import { MuseumScreen, ContinueInfo, byOrder } from './components/MuseumScreen';
import { RoutesScreen, ActiveTour } from './components/RoutesScreen';
import { MapScreen } from './components/MapScreen';
import { SearchScreen } from './components/SearchScreen';
import { RoomView } from './components/RoomView';
import { PieceDetail, NextInfo } from './components/PieceDetail';
import { RouteWizard } from './components/RouteWizard';
import { PaywallModal } from './components/PaywallModal';
import { TourCompletionView } from './components/TourCompletionView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TabBar, DockTab } from './components/ui/TabBar';
import { calculateRouteTimeMinutes } from './utils/routeOptimizer';
import { getAssetUrl, normalizePiece, findPiece } from './utils/urlHelper';
import { ttsPlayer } from './utils/ttsPlayer';
import { useLanguage } from './utils/LanguageContext';
import { localizeSite, localizeRoute } from './i18n/content';
import { getRoomLabel } from './utils/roomLabel';

/**
 * Pantallas de la app. Se apilan: lo de arriba es lo que se ve y "regresar" quita la de arriba.
 *   home → pestaña del museo (salas · recorridos · mapa · buscar) → sala → pieza
 */
type Screen =
  | { kind: 'home' }
  | { kind: 'tab'; tab: DockTab }
  | { kind: 'room'; roomId: string }
  | { kind: 'piece' }
  | { kind: 'wizard' }
  | { kind: 'tourDone' };

/** Con qué se navega dentro de la ficha de una pieza (anterior / siguiente): una sala o un recorrido. */
interface PieceNav {
  kind: 'room' | 'tour';
  ids: string[];
  index: number;
}

const stopId = (s: { piece_id?: string; id?: string; poi_id?: string; file?: string }) => s.piece_id || s.id || s.poi_id || s.file || '';
const roomNumber = (r: Room) => parseInt(String(r.numero_oficial ?? r.room_id.match(/\d+/)?.[0] ?? '0'), 10) || 0;

export default function App() {
  const { strings: t, currentLanguage, localizePiece, localizeRoom } = useLanguage();
  const u = t.ui;

  // ---------- Navegación ----------
  const [stack, setStack] = useState<Screen[]>([{ kind: 'home' }]);
  const screen = stack[stack.length - 1];
  const stackRef = useRef(stack);
  stackRef.current = stack;
  const scrollMemo = useRef<number[]>([]);
  const prevDepth = useRef(1);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const paywallRef = useRef(false);
  paywallRef.current = paywallOpen;

  const push = useCallback((s: Screen) => {
    scrollMemo.current[stackRef.current.length - 1] = window.scrollY;
    setStack((prev) => [...prev, s]);
    try {
      window.history.pushState({ depth: stackRef.current.length + 1 }, '');
    } catch {
      /* sin historial */
    }
  }, []);

  /** Cambia la pantalla de arriba sin agregar otra (por ejemplo, del asistente al recorrido). */
  const replaceTop = useCallback((s: Screen) => {
    setStack((prev) => [...prev.slice(0, -1), s]);
    window.scrollTo(0, 0);
  }, []);

  const goBack = useCallback(() => {
    if (stackRef.current.length > 1) window.history.back();
  }, []);

  // Botón "atrás" del teléfono o del navegador: cierra la ventana de pago o quita la pantalla de arriba
  useEffect(() => {
    const onPop = () => {
      if (paywallRef.current) {
        setPaywallOpen(false);
        return;
      }
      setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Al entrar a una pantalla se empieza arriba; al regresar se vuelve a donde estabas
  useLayoutEffect(() => {
    const depth = stack.length;
    if (depth > prevDepth.current) window.scrollTo(0, 0);
    else if (depth < prevDepth.current) window.scrollTo(0, scrollMemo.current[depth - 1] || 0);
    prevDepth.current = depth;
  }, [stack]);

  const goTab = useCallback((tab: DockTab) => {
    setStack((prev) => {
      const home = prev[0];
      const top = prev[prev.length - 1];
      if (top.kind === 'tab' && top.tab === tab) return prev;
      return [home, { kind: 'tab', tab }];
    });
    scrollMemo.current = [scrollMemo.current[0] || 0, 0];
    window.scrollTo(0, 0);
  }, []);

  const openPaywall = useCallback(() => {
    setPaywallOpen(true);
    try {
      window.history.pushState({ overlay: 'paywall' }, '');
    } catch {
      /* sin historial */
    }
  }, []);
  const closePaywall = useCallback(() => {
    if (paywallRef.current) window.history.back();
  }, []);

  // ---------- Datos ----------
  const [rawSites, setSites] = useState<SiteSummary[]>([]);
  const [selectedSite, setSelectedSite] = useState<SiteSummary | null>(null);
  const [rawManifest, setManifest] = useState<SiteManifest | null>(null);
  const [rawRooms, setRooms] = useState<Room[]>([]);
  const [rawPieces, setPieces] = useState<PieceData[]>([]);
  const [isLoadingSites, setIsLoadingSites] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const paymentCheckedRef = useRef(false);
  const [paymentNotice, setPaymentNotice] = useState<{ kind: 'info' | 'success' | 'error'; text: string } | null>(null);
  const [currentLicense, setCurrentLicense] = useState<SiteLicense | null>(null);
  const [licenseVersion, setLicenseVersion] = useState(0);
  const [floor, setFloor] = useState<'PB' | 'PA'>('PB');
  const [nav, setNav] = useState<PieceNav | null>(null);
  const [tour, setTour] = useState<ActiveTour | null>(null);

  const sites = useMemo(() => rawSites.map((s) => localizeSite(s, currentLanguage)), [rawSites, currentLanguage]);
  const rooms = useMemo(() => rawRooms.map((r) => localizeRoom(r)), [rawRooms, localizeRoom]);
  const pieces = useMemo(() => rawPieces.map((p) => localizePiece(p)), [rawPieces, localizePiece]);
  const manifest = useMemo(
    () => (rawManifest ? { ...rawManifest, routes: rawManifest.routes?.map((r) => localizeRoute(r, currentLanguage)) } : null),
    [rawManifest, currentLanguage]
  );
  const site = useMemo(() => (selectedSite ? localizeSite(selectedSite, currentLanguage) : null), [selectedSite, currentLanguage]);

  useEffect(() => {
    (async () => {
      setIsLoadingSites(true);
      try {
        const res = await fetch(getAssetUrl('data/sites.json'));
        if (!res.ok) throw new Error(`Error ${res.status}`);
        setSites(await res.json());
      } catch (err) {
        console.error('Error fetching sites:', err);
        setErrorMessage(t.app.sitesLoadError);
      } finally {
        setIsLoadingSites(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [roomsRes, piecesRes] = await Promise.all([fetch(getAssetUrl('data/rooms.json')), fetch(getAssetUrl('data/pieces.json'))]);
        if (roomsRes.ok) {
          const list: Room[] = await roomsRes.json();
          setRooms([...list].sort((a, b) => roomNumber(a) - roomNumber(b)));
        }
        if (piecesRes.ok) {
          const list: PieceData[] = await piecesRes.json();
          setPieces(list.map((p) => normalizePiece(p)));
        }
      } catch (err) {
        console.warn('Could not load rooms.json or pieces.json:', err);
      }
    })();
  }, []);

  // Regreso de la página de pago de Stripe (o un pago pendiente): se confirma y se activa el pase
  useEffect(() => {
    if (paymentCheckedRef.current) return;
    paymentCheckedRef.current = true;
    const returned = readPaymentReturn();
    if (returned?.status === 'cancelled') {
      setPaymentNotice({ kind: 'info', text: t.paywall.notice.cancelled });
      return;
    }
    if (returned) setPaymentNotice({ kind: 'info', text: t.paywall.notice.confirming });
    (async () => {
      const result = await redeemPendingSession(returned?.status === 'paid' ? returned.sessionId : undefined);
      if (!result) {
        setPaymentNotice(null);
        return;
      }
      if (result.ok) {
        setLicenseVersion((v) => v + 1);
        const hours = Math.round((result.data.expires_at - Date.now()) / 3600000) || PASS_HOURS;
        setPaymentNotice({ kind: 'success', text: t.paywall.notice.success(hours) });
      } else if (returned || !RETRYABLE_ERRORS.includes(result.error)) {
        setPaymentNotice({ kind: 'error', text: t.paywall.errors[result.error] });
      } else {
        setPaymentNotice(null);
      }
    })();
  }, []);

  useEffect(() => {
    setCurrentLicense(selectedSite ? getSiteLicense(selectedSite.id) : null);
  }, [selectedSite, licenseVersion]);
  const hasPass = selectedSite ? hasActivePass(selectedSite.id) : false;

  // ---------- Derivados ----------
  const piecesByRoom = useMemo(() => {
    const m = new Map<string, PieceData[]>();
    for (const p of pieces) m.set(p.room_id, [...(m.get(p.room_id) || []), p]);
    for (const list of m.values()) list.sort(byOrder);
    return m;
  }, [pieces]);
  const roomById = useMemo(() => new Map(rooms.map((r) => [r.room_id, r])), [rooms]);
  /** Orden de visita: planta baja y luego planta alta, por número. Solo salas con obras. */
  const roomOrder = useMemo(
    () =>
      [...rooms]
        .filter((r) => (piecesByRoom.get(r.room_id) || []).length > 0)
        .sort((a, b) => (a.piso === b.piso ? roomNumber(a) - roomNumber(b) : a.piso === 'PB' ? -1 : 1)),
    [rooms, piecesByRoom]
  );
  const pieceById = useCallback((id: string): PieceData | undefined => pieces.find((p) => p.piece_id === id) || findPiece(pieces, id), [pieces]);

  const currentPieceId = nav ? nav.ids[nav.index] : null;
  const currentPiece = currentPieceId ? pieceById(currentPieceId) || null : null;
  const currentRoom = currentPiece ? roomById.get(currentPiece.room_id) || null : null;
  const roomTitle = (r: Room) => `${getRoomLabel(r)} · ${r.nombre_oficial}`;

  // ---------- Acciones ----------
  const handleSelectSite = async (s: SiteSummary) => {
    if (s.status === 'coming_soon') return;
    setErrorMessage(null);
    ttsPlayer.stop();
    try {
      const res = await fetch(getAssetUrl(s.path));
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data: SiteManifest = await res.json();
      // De las rutas del museo solo se dejan las paradas que existen en pieces.json
      if (data.routes && rawPieces.length > 0) {
        data.routes = data.routes.map((route) => ({
          ...route,
          stops: route.stops.filter((stop) => rawPieces.some((p) => p.piece_id === stopId(stop) || p.id === stopId(stop))),
        }));
      }
      setSelectedSite(s);
      setManifest(data);
      push({ kind: 'tab', tab: 'salas' });
    } catch (err) {
      console.error('Error loading site manifest:', err);
      setErrorMessage(t.app.siteLoadError);
    }
  };

  /** Abre una pieza dentro de su sala (anterior / siguiente recorren la sala). */
  const openPieceInRoom = useCallback(
    (pieceId: string, opts: { push?: boolean } = {}) => {
      const p = pieceById(pieceId);
      if (!p) {
        setErrorMessage(t.app.pieceNotFound);
        return;
      }
      const ids = (piecesByRoom.get(p.room_id) || [p]).map((x) => x.piece_id);
      setNav({ kind: 'room', ids, index: Math.max(0, ids.indexOf(p.piece_id)) });
      if (opts.push !== false && stackRef.current[stackRef.current.length - 1].kind !== 'piece') push({ kind: 'piece' });
      else window.scrollTo(0, 0);
    },
    [pieceById, piecesByRoom, push, t]
  );

  /** Abre la parada i de un recorrido. */
  const openTourStop = useCallback(
    (route: SiteRoute, i: number, how: 'push' | 'replace' | 'stay' = 'push') => {
      setTour({ route, index: i });
      setNav({ kind: 'tour', ids: route.stops.map(stopId), index: i });
      if (how === 'replace') replaceTop({ kind: 'piece' });
      else if (how === 'push' && stackRef.current[stackRef.current.length - 1].kind !== 'piece') push({ kind: 'piece' });
      else window.scrollTo(0, 0);
    },
    [push, replaceTop]
  );

  const startRoute = (route: SiteRoute) => {
    if (!route.stops?.length) return;
    const top = stackRef.current[stackRef.current.length - 1];
    openTourStop(route, 0, top.kind === 'wizard' ? 'replace' : 'push');
  };

  const nextRoomAfter = (roomId: string): Room | null => {
    const i = roomOrder.findIndex((r) => r.room_id === roomId);
    return i >= 0 && i + 1 < roomOrder.length ? roomOrder[i + 1] : null;
  };

  const goNext = () => {
    if (!nav) return;
    if (nav.index + 1 < nav.ids.length) {
      setNav({ ...nav, index: nav.index + 1 });
      if (nav.kind === 'tour' && tour) setTour({ ...tour, index: nav.index + 1 });
      window.scrollTo(0, 0);
      return;
    }
    if (nav.kind === 'room' && currentPiece) {
      const nr = nextRoomAfter(currentPiece.room_id);
      const first = nr ? (piecesByRoom.get(nr.room_id) || [])[0] : null;
      if (first) openPieceInRoom(first.piece_id, { push: false });
      return;
    }
    if (nav.kind === 'tour') {
      ttsPlayer.stop();
      replaceTop({ kind: 'tourDone' });
    }
  };

  const goPrev = () => {
    if (!nav || nav.index === 0) return;
    setNav({ ...nav, index: nav.index - 1 });
    if (nav.kind === 'tour' && tour) setTour({ ...tour, index: nav.index - 1 });
    window.scrollTo(0, 0);
  };

  const endTour = () => {
    setTour(null);
    if (nav?.kind === 'tour' && currentPiece) {
      const ids = (piecesByRoom.get(currentPiece.room_id) || [currentPiece]).map((x) => x.piece_id);
      setNav({ kind: 'room', ids, index: Math.max(0, ids.indexOf(currentPiece.piece_id)) });
    }
  };

  const nextInfo: NextInfo | null = useMemo(() => {
    if (!nav || !currentPiece) return null;
    const total = nav.ids.length;
    if (nav.index + 1 < total) {
      const np = pieceById(nav.ids[nav.index + 1]);
      if (!np) return null;
      const nr = roomById.get(np.room_id);
      return {
        kind: 'piece',
        eyebrow: nav.kind === 'tour' ? u.piece.nextStop(nav.index + 2, total) : u.piece.nextOf(nav.index + 2, total),
        title: np.titulo,
        detail: nav.kind === 'tour' && nr ? roomTitle(nr) : np.frase_gancho,
        imageFilename: np.image_filename,
        pieceId: np.piece_id,
      };
    }
    if (nav.kind === 'tour') return { kind: 'finish', eyebrow: u.piece.lastStop, title: u.piece.finishTour };
    const nr = nextRoomAfter(currentPiece.room_id);
    if (!nr) return null;
    const first = (piecesByRoom.get(nr.room_id) || [])[0];
    return {
      kind: 'room',
      eyebrow: u.piece.nextRoom,
      title: roomTitle(nr),
      detail: u.worksCount((piecesByRoom.get(nr.room_id) || []).length),
      imageFilename: first?.image_filename,
      pieceId: first?.piece_id,
    };
  }, [nav, currentPiece, pieceById, roomById, piecesByRoom, roomOrder, u]);

  const continueInfo: ContinueInfo | null = useMemo(() => {
    if (tour) {
      const p = pieceById(stopId(tour.route.stops[tour.index]));
      return {
        eyebrow: u.museum.yourTour,
        title: tour.route.name,
        detail: u.routes.progress(tour.index + 1, tour.route.stops.length) + (p ? ` · ${p.titulo}` : ''),
        imageFilename: p?.image_filename,
        pieceId: p?.piece_id,
        onContinue: () => openTourStop(tour.route, tour.index),
      };
    }
    if (nav && currentPiece) {
      return {
        eyebrow: u.museum.continueWhere,
        title: currentPiece.titulo,
        detail: currentRoom ? roomTitle(currentRoom) : '',
        imageFilename: currentPiece.image_filename,
        pieceId: currentPiece.piece_id,
        onContinue: () => push({ kind: 'piece' }),
      };
    }
    return null;
  }, [tour, nav, currentPiece, currentRoom, pieceById, openTourStop, push, u]);

  const offlineAudioPieces = useMemo(() => {
    if (tour) {
      const ids = new Set(tour.route.stops.map(stopId));
      return pieces.filter((p) => ids.has(p.piece_id));
    }
    return hasPass ? pieces : pieces.filter((p) => p.is_free);
  }, [tour, pieces, hasPass]);

  const activeTab: DockTab | null = useMemo(() => {
    for (let i = stack.length - 1; i >= 0; i--) {
      const s = stack[i];
      if (s.kind === 'tab') return s.tab;
    }
    return null;
  }, [stack]);
  const showTabBar = !!selectedSite && (screen.kind === 'tab' || screen.kind === 'room');

  const handleSimulatePurchase = () => {
    if (!selectedSite) return;
    setCurrentLicense(activatePass(selectedSite.id, PASS_HOURS));
  };
  const handleRevokePass = () => {
    if (!selectedSite) return;
    revokePass(selectedSite.id);
    setCurrentLicense(null);
  };

  const openRoom = (room: Room) => push({ kind: 'room', roomId: room.room_id });

  // ---------- Pantallas ----------
  let content: React.ReactNode = null;
  if (screen.kind === 'home' || !site) {
    const mna = rawSites.find((s) => s.status !== 'coming_soon');
    content = (
      <Home
        sites={sites}
        onSelectSite={handleSelectSite}
        isLoading={isLoadingSites}
        stats={{ rooms: rooms.length || mna?.total_stops || 0, works: pieces.length || mna?.highlights_count || 0, free: pieces.filter((p) => p.is_free).length }}
        coverPiece={pieceById('mna_s06_piedra_sol') || pieces[0] || null}
      />
    );
  } else if (screen.kind === 'tab') {
    if (screen.tab === 'salas') {
      content = (
        <MuseumScreen
          site={site}
          manifest={manifest}
          rooms={rooms}
          pieces={pieces}
          hasPass={hasPass}
          floor={floor}
          onFloorChange={setFloor}
          continueInfo={continueInfo}
          audioPieces={offlineAudioPieces}
          onBack={goBack}
          onOpenPaywall={openPaywall}
          onSelectRoom={openRoom}
          onStartRoute={startRoute}
          onOpenWizard={() => push({ kind: 'wizard' })}
          onOpenMap={() => goTab('mapa')}
        />
      );
    } else if (screen.tab === 'recorridos') {
      content = (
        <RoutesScreen
          routes={manifest?.routes || []}
          tour={tour}
          pieces={pieces}
          rooms={rooms}
          hasPass={hasPass}
          onOpenPaywall={openPaywall}
          onContinueTour={() => tour && openTourStop(tour.route, tour.index)}
          onOpenStop={(i) => tour && openTourStop(tour.route, i)}
          onStartRoute={startRoute}
          onEndTour={endTour}
          onOpenWizard={() => push({ kind: 'wizard' })}
        />
      );
    } else if (screen.tab === 'mapa') {
      content = (
        <MapScreen
          rooms={rooms}
          pieces={pieces}
          floor={floor}
          onFloorChange={setFloor}
          hereRoomId={currentPiece?.room_id || null}
          tour={tour}
          hasPass={hasPass}
          onOpenPaywall={openPaywall}
          onSelectRoom={openRoom}
        />
      );
    } else {
      content = (
        <SearchScreen
          pieces={pieces}
          rooms={rooms}
          hasPass={hasPass}
          onSelectPiece={(id) => openPieceInRoom(id)}
          onSelectRoom={openRoom}
        />
      );
    }
  } else if (screen.kind === 'room') {
    const room = roomById.get(screen.roomId);
    const below = stack[stack.length - 2];
    content = room ? (
      <RoomView
        room={room}
        pieces={piecesByRoom.get(room.room_id) || []}
        hasPass={hasPass}
        currentPieceId={currentPiece?.room_id === room.room_id ? currentPiece.piece_id : null}
        onBack={goBack}
        backLabel={below?.kind === 'tab' ? tabLabel(below.tab, u) : undefined}
        onOpenPaywall={openPaywall}
        onSelectPiece={(id) => openPieceInRoom(id)}
      />
    ) : null;
  } else if (screen.kind === 'wizard') {
    content = (
      <RouteWizard
        site={site}
        manifest={manifest!}
        rooms={rooms}
        pieces={pieces}
        onBack={goBack}
        onStartRoute={startRoute}
      />
    );
  } else if (screen.kind === 'tourDone') {
    const route = tour?.route;
    content = (
      <TourCompletionView
        routeName={route?.name || t.app.defaultRouteName}
        totalStops={route?.stops.length || 0}
        estimatedMinutes={route ? route.estimated_minutes || calculateRouteTimeMinutes(route.stops) : 0}
        stops={route?.stops || []}
        onExploreRooms={() => {
          endTour();
          goTab('salas');
        }}
        onChooseRoute={() => {
          endTour();
          goTab('recorridos');
        }}
        onGoHome={() => {
          endTour();
          setStack([{ kind: 'home' }]);
        }}
        onRepeatTour={route ? () => openTourStop(route, 0, 'replace') : undefined}
        onOpenMap={() => goTab('mapa')}
      />
    );
  } else if (screen.kind === 'piece') {
    if (currentPiece && nav) {
      const inTour = nav.kind === 'tour' && tour;
      const siblings = inTour ? piecesByRoom.get(currentPiece.room_id) || [] : [];
      content = (
        <PieceDetail
          key="piece"
          piece={currentPiece}
          hasPass={hasPass}
          onOpenPaywall={openPaywall}
          onBack={goBack}
          onOpenSearch={() => goTab('teclado')}
          contextTitle={inTour ? tour.route.name : currentRoom ? roomTitle(currentRoom) : site.name}
          positionLabel={inTour ? u.piece.stopPosition(nav.index + 1, nav.ids.length) : u.piece.position(nav.index + 1, nav.ids.length)}
          onContextClick={() => (inTour ? goTab('recorridos') : currentRoom && openRoom(currentRoom))}
          onPrev={nav.index > 0 ? goPrev : undefined}
          onNext={nextInfo ? goNext : undefined}
          next={nextInfo}
          siblings={siblings}
          onSelectSibling={(id) => openPieceInRoom(id, { push: false })}
        />
      );
    } else {
      content = (
        <div className="min-h-dvh flex flex-col items-center justify-center gap-4 p-10 text-center">
          <p className="text-[1.0625rem] font-semibold">{t.app.pieceNotFound}</p>
          <button type="button" onClick={() => goTab('salas')} className="btn-secondary">
            {t.app.backToRooms}
          </button>
        </div>
      );
    }
  }

  return (
    <ErrorBoundary>
      <div className="min-h-dvh w-full bg-bg text-ink sm:bg-[radial-gradient(circle_at_50%_0%,var(--c-raised),var(--c-bg)_60%)]">
        <OfflineIndicator />
        <div className="relative w-full max-w-[480px] mx-auto min-h-dvh bg-bg sm:border-x sm:border-line">
          {(paymentNotice || errorMessage) && (
            <div className="fixed top-[calc(env(safe-area-inset-top,0px)+0.5rem)] inset-x-0 z-[60] px-3 pointer-events-none">
              {paymentNotice && (
                <div
                  role="status"
                  data-testid="payment-notice"
                  className={`pointer-events-auto max-w-[456px] mx-auto mb-2 p-3.5 pr-2 rounded-2xl border flex items-start gap-3 shadow-2xl shadow-black/40 bg-raised animate-fadeIn ${
                    paymentNotice.kind === 'success' ? 'border-jade/60' : paymentNotice.kind === 'error' ? 'border-tezontle/60' : 'border-line-strong'
                  }`}
                >
                  <span className="flex-1 text-ui font-semibold text-ink pt-0.5">{paymentNotice.text}</span>
                  <button type="button" onClick={() => setPaymentNotice(null)} aria-label={t.app.dismissAria} className="btn-icon w-9 h-9 text-ink-3">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {errorMessage && (
                <div className="pointer-events-auto max-w-[456px] mx-auto p-3.5 pr-2 rounded-2xl border border-tezontle/60 bg-raised flex items-start gap-3 shadow-2xl shadow-black/40 animate-fadeIn">
                  <span className="flex-1 text-ui font-semibold text-ink pt-0.5">{errorMessage}</span>
                  <button type="button" onClick={() => setErrorMessage(null)} aria-label={t.app.dismissAria} className="btn-icon w-9 h-9 text-ink-3">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {content}

          {showTabBar && <TabBar activeTab={activeTab} onSelectTab={goTab} tourActive={!!tour} />}

          {selectedSite && manifest && (
            <PaywallModal
              isOpen={paywallOpen}
              onClose={closePaywall}
              siteName={site?.name || selectedSite.name}
              siteId={selectedSite.id}
              passPriceMxn={manifest.pass_price_mxn}
              passPriceUsd={manifest.pass_price_usd}
              hasPass={hasPass}
              passExpiresAt={currentLicense?.expires_at}
              passCode={currentLicense?.code}
              onPassChanged={() => setCurrentLicense(getSiteLicense(selectedSite.id))}
              onSimulatePurchase={handleSimulatePurchase}
              onRevokePass={handleRevokePass}
            />
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

function tabLabel(tab: DockTab, u: { tabs: { museum: string; routes: string; map: string; search: string } }): string {
  return tab === 'salas' ? u.tabs.museum : tab === 'recorridos' ? u.tabs.routes : tab === 'mapa' ? u.tabs.map : u.tabs.search;
}
