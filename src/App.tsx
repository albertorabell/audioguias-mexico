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
import { useBackClose } from './utils/useBackClose';
import { useLanguage } from './utils/LanguageContext';
import { localizeSite, localizeRoute } from './i18n/content';
import { getRoomLabel } from './utils/roomLabel';

/** Con qué se navega dentro de la ficha de una pieza (anterior / siguiente): una sala o un recorrido. */
interface PieceNav {
  kind: 'room' | 'tour';
  ids: string[];
  index: number;
}

/**
 * Pantallas de la app. Se apilan: lo de arriba es lo que se ve y "regresar" quita la de arriba.
 *   home → pestaña del museo (salas · recorridos · mapa · buscar) → sala → pieza
 * Cada pantalla de pieza guarda con qué se navega, así al regresar se ve la pieza que estaba.
 */
type Screen =
  | { kind: 'home' }
  | { kind: 'tab'; tab: DockTab }
  | { kind: 'room'; roomId: string }
  | { kind: 'piece'; nav: PieceNav }
  | { kind: 'wizard' }
  | { kind: 'tourDone' };

const stopId = (s: { piece_id?: string; id?: string; poi_id?: string; file?: string }) => s.piece_id || s.id || s.poi_id || s.file || '';
const roomNumber = (r: Room) => parseInt(String(r.numero_oficial ?? r.room_id.match(/\d+/)?.[0] ?? '0'), 10) || 0;

export default function App() {
  const { strings: t, currentLanguage, localizePiece, localizeRoom } = useLanguage();
  const u = t.ui;

  // ---------- Navegación ----------
  // Cada pantalla apilada tiene una entrada en el historial del navegador con su profundidad ({ depth }),
  // así el botón "atrás" del teléfono y el de la app hacen lo mismo y nunca se desfasan.
  const [stack, setStackState] = useState<Screen[]>([{ kind: 'home' }]);
  const stackRef = useRef(stack);
  const setStack = useCallback((next: Screen[]) => {
    stackRef.current = next;
    setStackState(next);
  }, []);
  const screen = stack[stack.length - 1];
  const scrollMemo = useRef<number[]>([]);
  const prevDepth = useRef(1);
  /** Al regresar varias pantallas de golpe (cambiar de pestaña, ir al inicio) se espera a que el navegador llegue. */
  const rewindRef = useRef<{ depth: number; stack: Screen[] } | null>(null);

  const push = useCallback(
    (s: Screen) => {
      const cur = stackRef.current;
      scrollMemo.current[cur.length - 1] = window.scrollY;
      setStack([...cur, s]);
      try {
        window.history.pushState({ depth: cur.length + 1 }, '');
      } catch {
        /* sin historial */
      }
    },
    [setStack]
  );

  /** Cambia la pantalla de arriba sin agregar otra (por ejemplo, del asistente al recorrido). */
  const replaceTop = useCallback(
    (s: Screen, opts: { keepScroll?: boolean } = {}) => {
      setStack([...stackRef.current.slice(0, -1), s]);
      if (!opts.keepScroll) window.scrollTo(0, 0);
    },
    [setStack]
  );

  const goBack = useCallback(() => {
    if (stackRef.current.length > 1) window.history.back();
  }, []);

  /** Regresa a una pantalla de abajo de la pila, quitando también sus entradas del historial. */
  const rewindTo = useCallback(
    (target: Screen[]) => {
      const cur = stackRef.current;
      const steps = cur.length - target.length;
      scrollMemo.current = scrollMemo.current.slice(0, target.length - 1);
      if (steps <= 0) {
        setStack(target);
        window.scrollTo(0, 0);
        return;
      }
      rewindRef.current = { depth: target.length, stack: target };
      window.history.go(-steps);
      // Por si el navegador no avisa (no debería pasar): se aplica igual
      window.setTimeout(() => {
        if (rewindRef.current) {
          const r = rewindRef.current;
          rewindRef.current = null;
          setStack(r.stack);
        }
      }, 600);
    },
    [setStack]
  );

  useEffect(() => {
    try {
      // La app decide a qué altura queda cada pantalla al regresar (el navegador no debe moverla por su cuenta)
      window.history.scrollRestoration = 'manual';
      window.history.replaceState({ depth: 1 }, '');
    } catch {
      /* navegador sin estas opciones */
    }
    const onPop = (e: PopStateEvent) => {
      const depth = Math.max(1, Number((e.state as { depth?: number } | null)?.depth) || 1);
      const rw = rewindRef.current;
      if (rw) {
        if (depth <= rw.depth) {
          rewindRef.current = null;
          setStack(rw.stack);
        }
        return;
      }
      const cur = stackRef.current;
      // Solo se quitan pantallas; "adelante" o cerrar una ventana encima no cambian la pila
      if (depth < cur.length) setStack(cur.slice(0, depth));
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [setStack]);

  // Al entrar a una pantalla se empieza arriba; al regresar se vuelve a donde estabas
  useLayoutEffect(() => {
    const depth = stack.length;
    if (depth > prevDepth.current) window.scrollTo(0, 0);
    else if (depth < prevDepth.current) window.scrollTo(0, scrollMemo.current[depth - 1] || 0);
    prevDepth.current = depth;
  }, [stack]);

  const [focusSearch, setFocusSearch] = useState(false);
  const goTab = useCallback(
    (tab: DockTab) => {
      const cur = stackRef.current;
      const top = cur[cur.length - 1];
      if (top.kind === 'tab' && top.tab === tab) return;
      if (tab === 'teclado') setFocusSearch(true);
      const target: Screen[] = [cur[0], { kind: 'tab', tab }];
      if (cur.length <= 2) {
        scrollMemo.current = scrollMemo.current.slice(0, 1);
        setStack(target);
        window.scrollTo(0, 0);
      } else {
        rewindTo(target);
      }
    },
    [rewindTo, setStack]
  );

  const [paywallOpen, setPaywallOpen] = useState(false);
  const openPaywall = useCallback(() => setPaywallOpen(true), []);
  const closePaywall = useCallback(() => setPaywallOpen(false), []);
  // La ventana de pago se cierra también con el botón "atrás" del teléfono
  useBackClose(paywallOpen, closePaywall);

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
  /** Última pieza vista (para "sigue donde te quedaste" y "estás aquí" en el plano). */
  const [lastNav, setLastNav] = useState<PieceNav | null>(null);
  const [tour, setTour] = useState<ActiveTour | null>(null);
  const [doneRoute, setDoneRoute] = useState<SiteRoute | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const selectingRef = useRef(false);

  const sites = useMemo(() => rawSites.map((s) => localizeSite(s, currentLanguage)), [rawSites, currentLanguage]);
  const rooms = useMemo(() => rawRooms.map((r) => localizeRoom(r)), [rawRooms, localizeRoom]);
  const pieces = useMemo(() => rawPieces.map((p) => localizePiece(p)), [rawPieces, localizePiece]);
  const manifest = useMemo(() => {
    if (!rawManifest) return null;
    const known = new Set(rawPieces.map((p) => p.piece_id));
    const routes = rawManifest.routes?.map((r) => {
      const local = localizeRoute(r, currentLanguage);
      // Solo las paradas que existen en pieces.json (una parada que ya no existe no debe trabar el recorrido)
      return known.size ? { ...local, stops: local.stops.filter((s) => known.has(stopId(s))) } : local;
    });
    return { ...rawManifest, routes };
  }, [rawManifest, rawPieces, currentLanguage]);
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
  const pieceIndex = useMemo(() => new Map(pieces.map((p) => [p.piece_id, p])), [pieces]);
  const pieceById = useCallback((id: string): PieceData | undefined => pieceIndex.get(id) || findPiece(pieces, id), [pieceIndex, pieces]);

  /** El recorrido en curso, con los textos en el idioma elegido (si es uno de los armados del museo). */
  const tourRoute: SiteRoute | null = useMemo(
    () => (tour ? manifest?.routes?.find((r) => r.id === tour.route.id) || tour.route : null),
    [tour, manifest]
  );
  const activeTour: ActiveTour | null = tour && tourRoute ? { route: tourRoute, index: tour.index } : null;

  const nav = screen.kind === 'piece' ? screen.nav : lastNav;
  const currentPieceId = nav ? nav.ids[nav.index] : null;
  const currentPiece = currentPieceId ? pieceById(currentPieceId) || null : null;
  const currentRoom = currentPiece ? roomById.get(currentPiece.room_id) || null : null;
  const roomTitle = (r: Room) => `${getRoomLabel(r)} · ${r.nombre_oficial}`;

  /** Muestra otra pieza: en la misma pantalla si ya se está en una pieza, o abriendo la pantalla de pieza. */
  const showPiece = useCallback(
    (next: PieceNav, how: 'auto' | 'replace' = 'auto') => {
      setLastNav(next);
      const top = stackRef.current[stackRef.current.length - 1];
      if (top.kind === 'piece' || how === 'replace') replaceTop({ kind: 'piece', nav: next });
      else push({ kind: 'piece', nav: next });
    },
    [push, replaceTop]
  );

  const roomNavFor = useCallback(
    (pieceId: string): PieceNav | null => {
      const p = pieceById(pieceId);
      if (!p) return null;
      const ids = (piecesByRoom.get(p.room_id) || [p]).map((x) => x.piece_id);
      return { kind: 'room', ids, index: Math.max(0, ids.indexOf(p.piece_id)) };
    },
    [pieceById, piecesByRoom]
  );

  // ---------- Acciones ----------
  const handleSelectSite = async (s: SiteSummary) => {
    if (s.status === 'coming_soon' || selectingRef.current) return;
    selectingRef.current = true;
    setErrorMessage(null);
    ttsPlayer.stop();
    try {
      const res = await fetch(getAssetUrl(s.path));
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data: SiteManifest = await res.json();
      setSelectedSite(s);
      setManifest(data);
      push({ kind: 'tab', tab: 'salas' });
    } catch (err) {
      console.error('Error loading site manifest:', err);
      setErrorMessage(t.app.siteLoadError);
    } finally {
      selectingRef.current = false;
    }
  };

  /** Abre una pieza dentro de su sala (anterior / siguiente recorren la sala). */
  const openPieceInRoom = useCallback(
    (pieceId: string) => {
      const next = roomNavFor(pieceId);
      if (!next) {
        setErrorMessage(t.app.pieceNotFound);
        return;
      }
      showPiece(next);
    },
    [roomNavFor, showPiece, t]
  );

  /** Abre la parada i de un recorrido. */
  const openTourStop = useCallback(
    (route: SiteRoute, i: number, how: 'auto' | 'replace' = 'auto') => {
      setTour({ route, index: i });
      showPiece({ kind: 'tour', ids: route.stops.map(stopId), index: i }, how);
    },
    [showPiece]
  );

  const startRoute = (route: SiteRoute) => {
    if (!route.stops?.length) return;
    const top = stackRef.current[stackRef.current.length - 1];
    setDoneRoute(null);
    openTourStop(route, 0, top.kind === 'wizard' ? 'replace' : 'auto');
  };

  const nextRoomAfter = (roomId: string): Room | null => {
    const i = roomOrder.findIndex((r) => r.room_id === roomId);
    return i >= 0 && i + 1 < roomOrder.length ? roomOrder[i + 1] : null;
  };

  const goNext = () => {
    if (!nav) return;
    if (nav.index + 1 < nav.ids.length) {
      showPiece({ ...nav, index: nav.index + 1 });
      if (nav.kind === 'tour' && tour) setTour({ ...tour, index: nav.index + 1 });
      return;
    }
    if (nav.kind === 'room' && currentPiece) {
      const nr = nextRoomAfter(currentPiece.room_id);
      const first = nr ? (piecesByRoom.get(nr.room_id) || [])[0] : null;
      const next = first ? roomNavFor(first.piece_id) : null;
      if (!nr || !next) return;
      // Si abajo estaba la sala anterior, se cambia por la nueva (al regresar se ve la sala en la que estás)
      const cur = stackRef.current;
      const below = cur[cur.length - 2];
      setLastNav(next);
      if (below?.kind === 'room' && below.roomId === currentPiece.room_id) {
        setStack([...cur.slice(0, -2), { kind: 'room', roomId: nr.room_id }, { kind: 'piece', nav: next }]);
        window.scrollTo(0, 0);
      } else {
        replaceTop({ kind: 'piece', nav: next });
      }
      return;
    }
    if (nav.kind === 'tour' && tourRoute) {
      ttsPlayer.stop();
      setDoneRoute(tourRoute);
      endTour();
      replaceTop({ kind: 'tourDone' });
    }
  };

  const goPrev = () => {
    if (!nav || nav.index === 0) return;
    showPiece({ ...nav, index: nav.index - 1 });
    if (nav.kind === 'tour' && tour) setTour({ ...tour, index: nav.index - 1 });
  };

  /** Termina el recorrido; si la última pieza vista era del recorrido, se sigue navegando por su sala. */
  const endTour = () => {
    setTour(null);
    if (lastNav?.kind === 'tour') {
      const id = lastNav.ids[lastNav.index];
      const rn = id ? roomNavFor(id) : null;
      setLastNav(rn);
    }
  };

  const openRoom = (room: Room) => push({ kind: 'room', roomId: room.room_id });

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
    if (activeTour) {
      const p = pieceById(stopId(activeTour.route.stops[activeTour.index] || {}));
      return {
        eyebrow: u.museum.yourTour,
        title: activeTour.route.name,
        detail: u.routes.progress(activeTour.index + 1, activeTour.route.stops.length) + (p ? ` · ${p.titulo}` : ''),
        imageFilename: p?.image_filename,
        pieceId: p?.piece_id,
        onContinue: () => openTourStop(activeTour.route, activeTour.index),
      };
    }
    if (lastNav && currentPiece) {
      return {
        eyebrow: u.museum.continueWhere,
        title: currentPiece.titulo,
        detail: currentRoom ? roomTitle(currentRoom) : '',
        imageFilename: currentPiece.image_filename,
        pieceId: currentPiece.piece_id,
        onContinue: () => showPiece(lastNav),
      };
    }
    return null;
  }, [activeTour, lastNav, currentPiece, currentRoom, pieceById, openTourStop, showPiece, u]);

  const offlineAudioPieces = useMemo(() => (hasPass ? pieces : pieces.filter((p) => p.is_free)), [pieces, hasPass]);

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
          tour={activeTour}
          pieces={pieces}
          rooms={rooms}
          hasPass={hasPass}
          onOpenPaywall={openPaywall}
          onContinueTour={() => activeTour && openTourStop(activeTour.route, activeTour.index)}
          onOpenStop={(i) => activeTour && openTourStop(activeTour.route, i)}
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
          tour={activeTour}
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
          query={searchQuery}
          onQueryChange={setSearchQuery}
          autoFocus={focusSearch}
          onFocused={() => setFocusSearch(false)}
          onSelectPiece={openPieceInRoom}
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
        onSelectPiece={openPieceInRoom}
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
    const route = doneRoute;
    content = (
      <TourCompletionView
        routeName={route?.name || t.app.defaultRouteName}
        totalStops={route?.stops.length || 0}
        estimatedMinutes={route ? route.estimated_minutes || calculateRouteTimeMinutes(route.stops) : 0}
        stops={route?.stops || []}
        onExploreRooms={() => goTab('salas')}
        onChooseRoute={() => goTab('recorridos')}
        onGoHome={() => rewindTo([{ kind: 'home' }])}
        onRepeatTour={route ? () => openTourStop(route, 0, 'replace') : undefined}
        onOpenMap={() => goTab('mapa')}
      />
    );
  } else if (screen.kind === 'piece') {
    if (currentPiece && nav) {
      const inTour = nav.kind === 'tour' && !!tourRoute;
      const siblings = inTour ? piecesByRoom.get(currentPiece.room_id) || [] : [];
      const below = stack[stack.length - 2];
      content = (
        <PieceDetail
          key="piece"
          piece={currentPiece}
          hasPass={hasPass}
          onOpenPaywall={openPaywall}
          onBack={goBack}
          onOpenSearch={() => goTab('teclado')}
          contextTitle={inTour && tourRoute ? tourRoute.name : currentRoom ? roomTitle(currentRoom) : site.name}
          positionLabel={inTour ? u.piece.stopPosition(nav.index + 1, nav.ids.length) : u.piece.position(nav.index + 1, nav.ids.length)}
          onContextClick={() => {
            if (inTour) goTab('recorridos');
            else if (currentRoom) {
              // Si se llegó desde esa misma sala, se regresa a ella en vez de abrirla otra vez
              if (below?.kind === 'room' && below.roomId === currentRoom.room_id) goBack();
              else openRoom(currentRoom);
            }
          }}
          onPrev={nav.index > 0 ? goPrev : undefined}
          onNext={nextInfo ? goNext : undefined}
          next={nextInfo}
          siblings={siblings}
          onSelectSibling={(id) => {
            const next = roomNavFor(id);
            if (next) showPiece(next, 'replace');
          }}
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
                  className={`pointer-events-auto max-w-[456px] mx-auto mb-2 p-3.5 pr-1.5 rounded-2xl border flex items-start gap-3 shadow-2xl shadow-black/40 bg-raised animate-fadeIn ${
                    paymentNotice.kind === 'success' ? 'border-jade/60' : paymentNotice.kind === 'error' ? 'border-tezontle/60' : 'border-line-strong'
                  }`}
                >
                  <span className="flex-1 text-ui font-semibold text-ink pt-0.5">{paymentNotice.text}</span>
                  <button type="button" onClick={() => setPaymentNotice(null)} aria-label={t.app.dismissAria} className="btn-icon -my-2 text-ink-3 shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {errorMessage && (
                <div className="pointer-events-auto max-w-[456px] mx-auto p-3.5 pr-1.5 rounded-2xl border border-tezontle/60 bg-raised flex items-start gap-3 shadow-2xl shadow-black/40 animate-fadeIn">
                  <span className="flex-1 text-ui font-semibold text-ink pt-0.5">{errorMessage}</span>
                  <button type="button" onClick={() => setErrorMessage(null)} aria-label={t.app.dismissAria} className="btn-icon -my-2 text-ink-3 shrink-0">
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
