import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SiteSummary, SiteManifest, SiteRoute, RouteStop, PieceData, SiteLicense, Room } from './types';
import { getSiteLicense, activatePass, revokePass, hasActivePass } from './utils/license';
import { Home } from './components/Home';
import { SiteOverview } from './components/SiteOverview';
import { RouteWizard } from './components/RouteWizard';
import { Navbar } from './components/Navbar';
import { PieceView } from './components/PieceView';
import { LiveRouteManagerModal } from './components/LiveRouteManagerModal';
import { PaywallModal } from './components/PaywallModal';
import { MapViewModal } from './components/MapViewModal';
import { SearchModal } from './components/SearchModal';
import { TourCompletionView } from './components/TourCompletionView';
import { RoomDetailModal } from './components/RoomDetailModal';
import { OfflineTourBanner } from './components/OfflineTourBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useTheme } from './utils/ThemeContext';
import { calculateRouteTimeMinutes, formatRouteDuration } from './utils/routeOptimizer';
import { getAssetUrl, normalizePiece, findPiece } from './utils/urlHelper';
import { BottomDockBar, DockTab } from './components/BottomDockBar';
import { FloatingAudioPlayer } from './components/FloatingAudioPlayer';
import { RoomView } from './components/RoomView';
import { Radio, ArrowLeft } from 'lucide-react';
import { ttsPlayer } from './utils/ttsPlayer';
import { useLanguage } from './utils/LanguageContext';
import { localizeSite, localizeRoute } from './i18n/content';
import { getRoomLabel } from './utils/roomLabel';

interface SpontaneousDetour {
  pieceFile: string;
  pieceTitle: string;
  originalStopIndex: number;
}

interface NavStackItem {
  viewMode: 'sites' | 'overview' | 'room' | 'wizard' | 'tour';
  selectedRoom: Room | null;
  activeRoute: SiteRoute | null;
  currentStopIndex: number;
  currentPieceId?: string | null;
}

export default function App() {
  const { isSunMode } = useTheme();
  const { strings: t, currentLanguage, localizePiece, localizeRoom } = useLanguage();

  // Navigation & View State: 'sites' -> 'overview' -> 'room' -> 'wizard' -> 'tour'
  const [viewMode, setViewMode] = useState<'sites' | 'overview' | 'room' | 'wizard' | 'tour'>('sites');
  const [rawSites, setSites] = useState<SiteSummary[]>([]);
  const [selectedSite, setSelectedSite] = useState<SiteSummary | null>(null);
  const [rawManifest, setManifest] = useState<SiteManifest | null>(null);
  const [activeRoute, setActiveRoute] = useState<SiteRoute | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState<number>(0);
  const [currentPiece, setCurrentPiece] = useState<PieceData | null>(null);
  const [rawTourPieces, setTourPieces] = useState<PieceData[]>([]);

  // Visited pieces set to prioritize unvisited pieces in carousel
  const [visitedPieceIds, setVisitedPieceIds] = useState<Set<string>>(new Set());

  // Piece loading error state for retrying without advancing stop count
  const [pieceLoadError, setPieceLoadError] = useState<{ pieceId: string; targetIndex?: number } | null>(null);

  // Completion state for tour navigation
  const [isTourCompleted, setIsTourCompleted] = useState<boolean>(false);

  // Official Rooms Catalog & Selected Room
  const [rawAllRooms, setAllRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedRoomForDetail, setSelectedRoomForDetail] = useState<Room | null>(null);

  // Navigation history stack for Back navigation
  const [navHistory, setNavHistory] = useState<NavStackItem[]>([]);

  // Spontaneous Detour State
  const [spontaneousDetour, setSpontaneousDetour] = useState<SpontaneousDetour | null>(null);

  // License State
  const [currentLicense, setCurrentLicense] = useState<SiteLicense | null>(null);

  // Modal State
  const [isLiveRouteManagerOpen, setIsLiveRouteManagerOpen] = useState(false);
  const [isPaywallModalOpen, setIsPaywallModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Loading & Error states
  const [isLoadingSites, setIsLoadingSites] = useState(true);
  const [isLoadingPiece, setIsLoadingPiece] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Contenido en el idioma elegido. Lo que no esté traducido en el Sheets se muestra en español.
  const sites = useMemo(() => rawSites.map((s) => localizeSite(s, currentLanguage)), [rawSites, currentLanguage]);
  const allRooms = useMemo(() => rawAllRooms.map((r) => localizeRoom(r)), [rawAllRooms, localizeRoom]);
  const tourPieces = useMemo(() => rawTourPieces.map((p) => localizePiece(p)), [rawTourPieces, localizePiece]);
  const manifest = useMemo(
    () =>
      rawManifest
        ? { ...rawManifest, routes: rawManifest.routes?.map((r) => localizeRoute(r, currentLanguage)) }
        : rawManifest,
    [rawManifest, currentLanguage]
  );

  // Helper to push history state
  const pushNavState = useCallback(
    (newView: 'sites' | 'overview' | 'room' | 'wizard' | 'tour', extraRoom?: Room | null) => {
      setNavHistory((prev) => [
        ...prev,
        {
          viewMode,
          selectedRoom,
          activeRoute,
          currentStopIndex,
          currentPieceId: currentPiece?.piece_id || null,
        },
      ]);
      if (typeof window !== 'undefined' && window.history) {
        window.history.pushState({ viewMode: newView }, '', window.location.href);
      }
      setViewMode(newView);
      if (extraRoom !== undefined) {
        setSelectedRoom(extraRoom);
      }
    },
    [viewMode, selectedRoom, activeRoute, currentStopIndex, currentPiece]
  );

  // Handle popstate for browser/device physical back button
  useEffect(() => {
    const handlePopState = () => {
      // If modal is open, close modal
      if (isMapModalOpen) {
        setIsMapModalOpen(false);
        return;
      }
      if (isSearchModalOpen) {
        setIsSearchModalOpen(false);
        return;
      }
      if (isLiveRouteManagerOpen) {
        setIsLiveRouteManagerOpen(false);
        return;
      }
      if (selectedRoomForDetail) {
        setSelectedRoomForDetail(null);
        return;
      }

      // Pop from custom navigation history stack
      setNavHistory((prev) => {
        if (prev.length === 0) {
          if (viewMode !== 'sites') {
            setViewMode('sites');
            setSelectedSite(null);
          }
          return [];
        }
        const nextStack = [...prev];
        const last = nextStack.pop()!;
        setViewMode(last.viewMode);
        setSelectedRoom(last.selectedRoom);
        if (last.activeRoute) setActiveRoute(last.activeRoute);
        setCurrentStopIndex(last.currentStopIndex);
        return nextStack;
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [
    isMapModalOpen,
    isSearchModalOpen,
    isLiveRouteManagerOpen,
    selectedRoomForDetail,
    viewMode,
  ]);

  // Unified In-App Back Navigation handler
  const handleGoBack = useCallback(() => {
    ttsPlayer.stop();

    if (isMapModalOpen) {
      setIsMapModalOpen(false);
      return;
    }
    if (isSearchModalOpen) {
      setIsSearchModalOpen(false);
      return;
    }
    if (isLiveRouteManagerOpen) {
      setIsLiveRouteManagerOpen(false);
      return;
    }
    if (selectedRoomForDetail) {
      setSelectedRoomForDetail(null);
      return;
    }

    if (navHistory.length > 0) {
      setNavHistory((prev) => {
        const next = [...prev];
        const last = next.pop()!;
        setViewMode(last.viewMode);
        setSelectedRoom(last.selectedRoom);
        if (last.activeRoute) setActiveRoute(last.activeRoute);
        setCurrentStopIndex(last.currentStopIndex);
        return next;
      });
      return;
    }

    // Default logical back hierarchy:
    // tour -> room (if room tour) or overview
    // wizard -> overview
    // room -> overview
    // overview -> sites
    if (viewMode === 'tour') {
      if (selectedRoom) {
        setViewMode('room');
      } else {
        setViewMode('overview');
      }
    } else if (viewMode === 'wizard') {
      setViewMode('overview');
    } else if (viewMode === 'room') {
      setViewMode('overview');
      setSelectedRoom(null);
    } else if (viewMode === 'overview') {
      setSelectedSite(null);
      setViewMode('sites');
    }
  }, [
    isMapModalOpen,
    isSearchModalOpen,
    isLiveRouteManagerOpen,
    selectedRoomForDetail,
    navHistory,
    viewMode,
    selectedRoom,
  ]);

  // 1. Fetch sites catalog on mount
  useEffect(() => {
    async function loadSites() {
      setIsLoadingSites(true);
      try {
        const res = await fetch(getAssetUrl('data/sites.json'));
        if (!res.ok) throw new Error(`Error ${res.status} al cargar catálogo de sitios`);
        const data: SiteSummary[] = await res.json();
        setSites(data);
      } catch (err) {
        console.error('Error fetching sites:', err);
        setErrorMessage(t.app.sitesLoadError);
      } finally {
        setIsLoadingSites(false);
      }
    }
    loadSites();
  }, []);

  // 1.b Cargar el catálogo de salas (rooms.json) y piezas (pieces.json) generado desde el Sheets
  useEffect(() => {
    async function loadCatalog() {
      try {
        const [roomsRes, piecesRes] = await Promise.all([
          fetch(getAssetUrl('data/rooms.json')),
          fetch(getAssetUrl('data/pieces.json')),
        ]);

        if (roomsRes.ok) {
          // Las salas vienen tal cual de rooms.json (que sale de tu Sheets), ordenadas por número oficial.
          const rawRooms: Room[] = await roomsRes.json();
          const ordered = [...rawRooms].sort(
            (a, b) => (parseInt(String(a.numero_oficial), 10) || 0) - (parseInt(String(b.numero_oficial), 10) || 0)
          );
          setAllRooms(ordered);
        }

        if (piecesRes.ok) {
          const piecesData: PieceData[] = await piecesRes.json();
          setTourPieces(piecesData.map((p) => normalizePiece(p)));
        }
      } catch (err) {
        console.warn('Could not load initial data/rooms.json or pieces.json:', err);
      }
    }
    loadCatalog();
  }, []);

  // Update license state whenever selectedSite changes
  useEffect(() => {
    if (selectedSite) {
      const lic = getSiteLicense(selectedSite.id);
      setCurrentLicense(lic);
    } else {
      setCurrentLicense(null);
    }
  }, [selectedSite]);

  // 2. Select Site (protected against coming_soon)
  const handleSelectSite = async (site: SiteSummary) => {
    if (site.status === 'coming_soon') {
      setErrorMessage(t.home.siteSoonToast(site.name));
      return;
    }

    setSelectedSite(site);
    setIsLoadingPiece(true);
    setErrorMessage(null);
    setIsTourCompleted(false);
    setSelectedRoom(null);
    setSelectedRoomForDetail(null);
    ttsPlayer.stop();

    try {
      const res = await fetch(getAssetUrl(site.path));
      if (!res.ok) throw new Error(`Error ${res.status} al cargar manifiesto de ${site.name}`);
      const manifestData: SiteManifest = await res.json();

      // De mna.json usa SOLO el bloque "routes"; si alguna parada no existe en pieces.json, sáltala sin romper
      if (manifestData.routes && tourPieces.length > 0) {
        manifestData.routes = manifestData.routes.map((route) => ({
          ...route,
          stops: route.stops.filter((stop: any) => {
            const stopId = stop.piece_id || stop.id || stop.poi_id;
            return tourPieces.some(
              (p) => p.piece_id === stopId || p.id === stopId || (p as any).poi_id === stopId
            );
          }),
        }));
      }

      setManifest(manifestData);
      pushNavState('overview');
    } catch (err) {
      console.error('Error loading site manifest:', err);
      setErrorMessage(t.app.siteLoadError);
      setSelectedSite(null);
      setViewMode('sites');
    } finally {
      setIsLoadingPiece(false);
    }
  };

  // Helper to get room pieces with EXACT room_id equality and aliases
  const getRoomPieces = useCallback(
    (room: Room | null): PieceData[] => {
      if (!room) return [];
      return tourPieces
        .filter(
          (p) =>
            p.room_id === room.room_id ||
            (room.aliases && room.aliases.includes(p.room_id))
        )
        .sort((a, b) => (a.orden_sugerido || 99) - (b.orden_sugerido || 99));
    },
    [tourPieces]
  );

  // Helper to load piece data with error catching and retry support
  const loadPieceData = async (pieceIdOrFile: string): Promise<boolean> => {
    setIsLoadingPiece(true);
    ttsPlayer.stop();
    try {
      const cleanTarget = (pieceIdOrFile || '').trim();
      let piece = findPiece(tourPieces, cleanTarget);

      if (!piece) {
        // Fallback search by piece_id or image filename
        piece = tourPieces.find(
          (p) =>
            p.piece_id === cleanTarget ||
            p.id === cleanTarget ||
            p.image_filename === cleanTarget ||
            (p.image_filename && cleanTarget.includes(p.image_filename))
        );
      }

      if (piece) {
        const norm = normalizePiece({ ...piece });
        setCurrentPiece(norm);
        setVisitedPieceIds((prev) => new Set(prev).add(norm.piece_id || norm.id));
        setPieceLoadError(null);
        return true;
      } else {
        console.warn('Piece not found in catalog:', cleanTarget);
        setPieceLoadError({ pieceId: cleanTarget });
        return false;
      }
    } catch (err) {
      console.warn('Error loading piece data:', err);
      setPieceLoadError({ pieceId: pieceIdOrFile });
      return false;
    } finally {
      setIsLoadingPiece(false);
    }
  };

  // Start tour from RouteWizard
  const handleStartRouteFromWizard = async (chosenRoute: SiteRoute) => {
    setActiveRoute(chosenRoute);
    setCurrentStopIndex(0);
    setIsTourCompleted(false);
    setSpontaneousDetour(null);
    pushNavState('tour');

    if (chosenRoute.stops && chosenRoute.stops.length > 0) {
      const stop = chosenRoute.stops[0];
      await loadPieceData(stop.piece_id || stop.id || stop.poi_id || stop.file);
    }
  };

  // Start tour directly from Site Overview predefined route
  const handleStartRouteFromOverview = async (chosenRoute: SiteRoute) => {
    setActiveRoute(chosenRoute);
    setCurrentStopIndex(0);
    setIsTourCompleted(false);
    setSpontaneousDetour(null);
    pushNavState('tour');

    if (chosenRoute.stops && chosenRoute.stops.length > 0) {
      const stop = chosenRoute.stops[0];
      await loadPieceData(stop.piece_id || stop.id || stop.poi_id || stop.file);
    }
  };

  // Start continuous tour of a single room (strictly by orden_sugerido, NO forced Piedra del Sol)
  const handleStartRoomTour = async (room: Room, startPieceId?: string) => {
    ttsPlayer.stop();
    const roomPieces = getRoomPieces(room);
    if (roomPieces.length === 0) {
      setErrorMessage(t.app.noRoomPieces(room.nombre_oficial || t.app.roomFallback));
      return;
    }

    const roomTitle = `${getRoomLabel(room)} · ${room.nombre_oficial || room.name}`;

    const stops: RouteStop[] = roomPieces.map((p, idx) => {
      const pId = p.piece_id || p.id || (p as any).poi_id;
      return {
        poi_id: pId,
        piece_id: pId,
        id: pId,
        title: p.titulo || p.title || pId,
        room_zone: room.nombre_oficial,
        file: p.image_filename || '',
        estimated_minutes: 5.0,
        map_coords: { x: p.map_x || 50, y: p.map_y || 50 },
        ranking: idx + 1,
        room_id: room.room_id,
        piso: room.piso,
        thumbnail: p.image_filename ? getAssetUrl(`images/pieces/${p.image_filename}`) : '',
        is_premium: !p.is_free,
        tags: [room.nombre_oficial, room.piso || 'PB'],
      };
    });

    const calculatedMinutes = calculateRouteTimeMinutes(stops, false, allRooms);
    const durationStr = formatRouteDuration(calculatedMinutes);

    const singleRoomRoute: SiteRoute = {
      id: `route-${room.room_id}`,
      route_id: `route-${room.room_id}`,
      name: roomTitle,
      title: roomTitle,
      duration: durationStr,
      estimated_minutes: calculatedMinutes,
      description: room.frase_gancho || t.app.roomTourDesc(roomTitle),
      stops,
    };

    setActiveRoute(singleRoomRoute);
    setIsTourCompleted(false);
    setSpontaneousDetour(null);
    setSelectedRoomForDetail(null);
    setIsMapModalOpen(false);
    setSelectedRoom(room);
    pushNavState('tour', room);

    let targetIdx = 0;
    if (startPieceId) {
      const foundIdx = singleRoomRoute.stops.findIndex(
        (s) => s.piece_id === startPieceId || s.id === startPieceId || s.poi_id === startPieceId
      );
      if (foundIdx !== -1) {
        targetIdx = foundIdx;
      }
    }

    setCurrentStopIndex(targetIdx);
    const targetStop = singleRoomRoute.stops[targetIdx];
    await loadPieceData(targetStop.piece_id || targetStop.id || targetStop.poi_id || targetStop.file);
  };

  // Open Room detail screen (RoomView)
  const handleOpenRoomView = (room: Room) => {
    setSelectedRoom(room);
    pushNavState('room', room);
  };

  // Open Room detail modal from map
  const handleOpenRoomDetail = (room: Room) => {
    setSelectedRoomForDetail(room);
  };

  // Open Wizard
  const handleOpenWizard = () => {
    ttsPlayer.stop();
    pushNavState('wizard');
  };

  // Stop selection in tour (does NOT advance stop index if loading fails)
  const handleSelectStop = async (stopIndex: number) => {
    if (!activeRoute?.stops || stopIndex < 0 || stopIndex >= activeRoute.stops.length) return;
    const stop = activeRoute.stops[stopIndex];
    const targetPieceId = stop.piece_id || stop.id || stop.poi_id || stop.file;
    const loaded = await loadPieceData(targetPieceId);
    if (loaded) {
      setCurrentStopIndex(stopIndex);
      setIsTourCompleted(false);
      setSpontaneousDetour(null);
      setPieceLoadError(null);
    } else {
      setPieceLoadError({ pieceId: targetPieceId, targetIndex: stopIndex });
    }
  };

  // Next Stop
  const handleNextStop = async () => {
    if (!activeRoute?.stops) return;
    if (currentStopIndex + 1 < activeRoute.stops.length) {
      handleSelectStop(currentStopIndex + 1);
    } else {
      // Completed route! Clear current piece and stop audio
      setIsTourCompleted(true);
      setCurrentPiece(null);
      ttsPlayer.stop();
    }
  };

  // Previous Stop
  const handlePreviousStop = async () => {
    if (!activeRoute?.stops) return;
    if (currentStopIndex > 0) {
      handleSelectStop(currentStopIndex - 1);
    }
  };

  // Spontaneous Detour handling
  const handleStartSpontaneousDetour = async (pieceId: string, pieceTitle: string) => {
    setSpontaneousDetour({
      pieceFile: pieceId,
      pieceTitle,
      originalStopIndex: currentStopIndex,
    });
    await loadPieceData(pieceId);
  };

  const handleResumePlannedRoute = async () => {
    if (!spontaneousDetour) return;
    const targetIdx = spontaneousDetour.originalStopIndex;
    setSpontaneousDetour(null);
    await handleSelectStop(targetIdx);
  };

  const handleKeepDetourInRoute = () => {
    if (!spontaneousDetour || !activeRoute || !currentPiece) return;
    const pId = currentPiece.piece_id || currentPiece.id;
    const detourStop: RouteStop = {
      poi_id: pId,
      piece_id: pId,
      id: pId,
      title: currentPiece.titulo,
      room_zone: currentPiece.room_id,
      file: currentPiece.image_filename || '',
      map_coords: { x: currentPiece.map_x || 50, y: currentPiece.map_y || 50 },
      estimated_minutes: 2.0,
      room_id: currentPiece.room_id,
      ranking: currentStopIndex + 2,
      thumbnail: currentPiece.image_filename ? getAssetUrl(`images/pieces/${currentPiece.image_filename}`) : '',
      is_premium: !currentPiece.is_free,
    };

    const newStops = [...activeRoute.stops];
    newStops.splice(currentStopIndex + 1, 0, detourStop);
    setActiveRoute({
      ...activeRoute,
      stops: newStops,
    });
    setCurrentStopIndex(currentStopIndex + 1);
    setSpontaneousDetour(null);
  };

  // Add stop to route from Map
  const handleAddStopToRoute = (stop: RouteStop) => {
    if (!activeRoute) {
      const newRoute: SiteRoute = {
        id: `custom-route-${Date.now()}`,
        name: t.app.customRouteName,
        description: t.app.customRouteName,
        stops: [stop],
        duration: '10 min',
      };
      setActiveRoute(newRoute);
      setCurrentStopIndex(0);
      return;
    }
    const newStops = [...activeRoute.stops, stop];
    setActiveRoute({
      ...activeRoute,
      stops: newStops,
    });
  };

  // Jump to piece from SearchModal or Carousel
  // Regla F: Tocar una pieza desde el carrusel o desde la búsqueda NO debe activar en silencio
  // la ruta sugerida número 1 ni mostrar "Parada 1 de 8". Fuera de un recorrido, se ve como "visita libre".
  const handleSelectPieceById = async (id: string) => {
    if (!id) return;
    setIsSearchModalOpen(false);

    // Si ya estamos en un recorrido activo, verificar si esta pieza forma parte de la ruta
    if (activeRoute) {
      const stopIdx = activeRoute.stops.findIndex(
        (s) => s.piece_id === id || s.id === id || s.poi_id === id
      );
      if (stopIdx !== -1) {
        // La pieza sí está en la ruta activa: avanzar a esa parada
        handleSelectStop(stopIdx);
        return;
      }
      // Si la pieza NO está en la ruta activa, pasar a "visita libre" sin alterar ni forzar ruta 1
      setActiveRoute(null);
    } else {
      setActiveRoute(null);
    }

    const found = findPiece(tourPieces, id);
    if (found) {
      const norm = normalizePiece({ ...found });
      setCurrentPiece(norm);
      setVisitedPieceIds((prev) => new Set(prev).add(norm.piece_id || norm.id));
      setPieceLoadError(null);
      pushNavState('tour');
      return;
    }

    const loaded = await loadPieceData(id);
    if (loaded) {
      pushNavState('tour');
    }
  };

  // Dock Bar Active Tab calculation
  const activeDockTab = useMemo<DockTab>(() => {
    if (isMapModalOpen) return 'mapa';
    if (isSearchModalOpen) return 'teclado';
    if (viewMode === 'tour' || viewMode === 'wizard' || isLiveRouteManagerOpen) return 'recorridos';
    return 'salas';
  }, [isMapModalOpen, isSearchModalOpen, viewMode, isLiveRouteManagerOpen]);

  const handleDockSelectTab = (tab: DockTab) => {
    if (tab === 'salas') {
      setIsMapModalOpen(false);
      setIsSearchModalOpen(false);
      setIsLiveRouteManagerOpen(false);
      setSelectedRoomForDetail(null);
      setSelectedRoom(null);
      setViewMode('overview');
    } else if (tab === 'recorridos') {
      setIsMapModalOpen(false);
      setIsSearchModalOpen(false);
      setSelectedRoomForDetail(null);
      if (activeRoute && activeRoute.stops && activeRoute.stops.length > 0) {
        setIsLiveRouteManagerOpen(true);
      } else {
        pushNavState('wizard');
      }
    } else if (tab === 'mapa') {
      setIsSearchModalOpen(false);
      setIsLiveRouteManagerOpen(false);
      setSelectedRoomForDetail(null);
      setIsMapModalOpen(true);
    } else if (tab === 'teclado') {
      setIsMapModalOpen(false);
      setIsLiveRouteManagerOpen(false);
      setSelectedRoomForDetail(null);
      setIsSearchModalOpen(true);
    }
  };

  // Pass simulation
  const handleSimulatePurchase = () => {
    if (!selectedSite) return;
    const lic = activatePass(selectedSite.id, 72);
    setCurrentLicense(lic);
  };

  const handleRevokePass = () => {
    if (!selectedSite) return;
    revokePass(selectedSite.id);
    setCurrentLicense(null);
  };

  const hasPass = selectedSite ? hasActivePass(selectedSite.id) : false;

  // Single unified calculation for remaining route minutes
  const remainingRouteMinutes = useMemo(() => {
    if (!activeRoute?.stops) return 0;
    const remainingStops = activeRoute.stops.slice(currentStopIndex);
    return calculateRouteTimeMinutes(remainingStops);
  }, [activeRoute?.stops, currentStopIndex]);

  // Active piece room object
  const activePieceRoom = useMemo(() => {
    if (!currentPiece) return null;
    return allRooms.find((r) => r.room_id === currentPiece.room_id) || null;
  }, [currentPiece, allRooms]);

  const currentRoomPieces = useMemo(() => {
    if (!currentPiece) return [];
    return tourPieces.filter((p) => p.room_id === currentPiece.room_id);
  }, [currentPiece, tourPieces]);

  return (
    <ErrorBoundary>
      <div
        className={`min-h-screen w-full max-w-full overflow-x-hidden flex justify-center font-sans transition-colors duration-200 ${
          isSunMode ? 'bg-[#FAF8F5] text-[#111827]' : 'bg-[#141414] text-[#F5F5F4]'
        }`}
      >
        <OfflineIndicator />

        <div className="w-full max-w-[480px] min-h-screen shadow-2xl relative flex flex-col bg-[#0B0B0E] border-x border-[#24242E] text-[#F3F4F6] overflow-x-hidden">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 m-3 rounded-2xl border text-xs flex justify-between items-center shadow-md bg-rose-950/80 border-rose-800 text-rose-200">
              <span className="font-semibold">{errorMessage}</span>
              <button
                onClick={() => setErrorMessage(null)}
                aria-label={t.app.dismissAria}
                className="text-stone-400 hover:text-white text-sm font-bold ml-2 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* ================= VIEW 1: HOME (SITE SELECTOR) ================= */}
          {!selectedSite || viewMode === 'sites' ? (
            <Home
              sites={sites}
              onSelectSite={handleSelectSite}
              isLoading={isLoadingSites}
            />
          ) : viewMode === 'overview' ? (
            /* ================= VIEW 2: SITE OVERVIEW ================= */
            <SiteOverview
              site={selectedSite}
              manifest={manifest!}
              allRooms={allRooms}
              pieces={tourPieces}
              onBack={() => {
                setSelectedSite(null);
                setViewMode('sites');
              }}
              onCustomizeRoute={() => pushNavState('wizard')}
              onDirectStartRoute={handleStartRouteFromOverview}
              onSelectRoom={handleOpenRoomView}
              onOpenMapModal={() => setIsMapModalOpen(true)}
              onOpenSearchModal={() => setIsSearchModalOpen(true)}
            />
          ) : viewMode === 'room' && selectedRoom ? (
            /* ================= VIEW 3: SINGLE ROOM VIEW ================= */
            <RoomView
              room={selectedRoom}
              pieces={getRoomPieces(selectedRoom)}
              onBack={handleGoBack}
              onSelectPiece={handleSelectPieceById}
              onStartRoomTour={handleStartRoomTour}
            />
          ) : viewMode === 'wizard' ? (
            /* ================= VIEW 4: ROUTE WIZARD ================= */
            <RouteWizard
              site={selectedSite}
              manifest={manifest!}
              rooms={allRooms}
              pieces={tourPieces}
              onBack={handleGoBack}
              onStartRoute={handleStartRouteFromWizard}
            />
          ) : (
            /* ================= VIEW 5: ACTIVE TOUR (PIECE VIEW) ================= */
            <div className="flex-1 flex flex-col pb-36">
              {/* Navbar with always-visible Back Button */}
              <Navbar
                onBack={handleGoBack}
                activeRoute={activeRoute}
                currentStopIndex={currentStopIndex}
                totalStops={activeRoute ? activeRoute.stops.length : 1}
                hasPass={hasPass}
                passExpiresAt={currentLicense?.expires_at}
                onOpenPaywallModal={() => setIsPaywallModalOpen(true)}
                onOpenMapModal={() => setIsMapModalOpen(true)}
                onOpenSearchModal={() => setIsSearchModalOpen(true)}
                titleOverride={activeRoute?.name || selectedSite?.name}
              />

              {/* Offline Tour Banner */}
              <div className="px-3 pt-2">
                <OfflineTourBanner
                  pieces={tourPieces.length > 0 ? tourPieces : (currentPiece ? [currentPiece] : [])}
                />
              </div>

              {/* Floating Route Pill */}
              {activeRoute && !spontaneousDetour && !isTourCompleted && (
                <div className="sticky top-[57px] z-20 px-3 py-1.5 flex justify-end pointer-events-none">
                  <button
                    type="button"
                    id="btn-live-route-pill"
                    onClick={() => setIsLiveRouteManagerOpen(true)}
                    className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black shadow-lg backdrop-blur-md border border-[#F59E0B]/40 bg-[#141419]/95 text-[#F3F4F6] transition-all active:scale-95 hover:scale-[1.02] cursor-pointer"
                  >
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F59E0B] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F59E0B]"></span>
                    </span>
                    <span className="text-[#F59E0B] font-black">{t.app.routePill}</span>
                    <span className="text-[11px] font-semibold text-stone-300">
                      {t.app.pillStop(currentStopIndex + 1, activeRoute.stops.length)}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#F59E0B] pl-1.5 border-l border-white/10">
                      ~{formatRouteDuration(remainingRouteMinutes)}
                    </span>
                  </button>
                </div>
              )}

              {/* Spontaneous Detour Banner */}
              {spontaneousDetour && (
                <div className="sticky top-[57px] z-20 mx-3 my-1.5 p-3 rounded-2xl border border-[#F59E0B]/50 bg-[#141419]/95 text-[#F3F4F6] shadow-xl backdrop-blur-md flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] animate-ping shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-black">
                        <span className="text-[#F59E0B]">{t.app.detourTitle}</span>
                        <span className="text-[10px] text-[#9CA3AF]">{t.app.detourTag}</span>
                      </div>
                      <div className="text-[11px] font-medium text-stone-200 line-clamp-1">
                        {t.app.exploring(spontaneousDetour.pieceTitle)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleKeepDetourInRoute}
                      className="text-[11px] font-bold px-3 py-1 rounded-xl bg-[#F59E0B] text-black hover:bg-amber-400 transition cursor-pointer"
                    >
                      {t.app.keepInRoute}
                    </button>
                    <button
                      type="button"
                      onClick={handleResumePlannedRoute}
                      className="text-[11px] font-bold px-3 py-1 rounded-xl border border-white/10 bg-white/5 text-[#F3F4F6] hover:bg-white/10 transition cursor-pointer"
                    >
                      {t.app.resumeRoute(spontaneousDetour.originalStopIndex + 1)}
                    </button>
                  </div>
                </div>
              )}

              {/* View Content: TourCompletionView vs PieceView */}
              {isTourCompleted ? (
                <TourCompletionView
                  routeName={activeRoute?.name || t.app.defaultRouteName}
                  totalStops={activeRoute ? activeRoute.stops.length : 0}
                  estimatedMinutes={
                    activeRoute?.estimated_minutes ||
                    (activeRoute ? calculateRouteTimeMinutes(activeRoute.stops) : 45)
                  }
                  stops={activeRoute?.stops || []}
                  onExploreRooms={() => {
                    setIsTourCompleted(false);
                    setCurrentPiece(null);
                    setActiveRoute(null);
                    setSelectedRoom(null);
                    setViewMode('overview');
                  }}
                  onChooseRoute={() => {
                    setIsTourCompleted(false);
                    setCurrentPiece(null);
                    pushNavState('wizard');
                  }}
                  onGoHome={() => {
                    setIsTourCompleted(false);
                    setCurrentPiece(null);
                    setSelectedSite(null);
                    setViewMode('sites');
                  }}
                  onRepeatTour={() => {
                    setIsTourCompleted(false);
                    if (activeRoute && activeRoute.stops.length > 0) {
                      handleSelectStop(0);
                    }
                  }}
                  onOpenMap={() => setIsMapModalOpen(true)}
                />
              ) : pieceLoadError ? (
                <div className="p-8 m-4 rounded-3xl bg-[#141419] border border-amber-500/40 text-center space-y-4 shadow-xl">
                  <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-xl font-bold">
                    ⚠️
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{t.app.pieceLoadFailTitle}</h3>
                    <p className="text-xs text-stone-400 mt-1">
                      {t.app.pieceLoadFailDesc}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const targetId = pieceLoadError.pieceId;
                        const targetIdx = pieceLoadError.targetIndex;
                        setPieceLoadError(null);
                        if (targetIdx !== undefined && activeRoute) {
                          handleSelectStop(targetIdx);
                        } else {
                          loadPieceData(targetId);
                        }
                      }}
                      className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition active:scale-95 cursor-pointer shadow-md"
                    >
                      {t.common.retry}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPieceLoadError(null);
                        setViewMode('overview');
                      }}
                      className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-stone-300 text-xs font-semibold transition cursor-pointer"
                    >
                      {t.app.backToRooms}
                    </button>
                  </div>
                </div>
              ) : isLoadingPiece ? (
                <div className="p-6 space-y-4">
                  <div className="w-full h-64 rounded-3xl bg-[#141419] border border-white/10 animate-pulse" />
                  <div className="h-6 w-3/4 rounded-xl bg-[#141419] animate-pulse" />
                  <div className="h-4 w-1/2 rounded-lg bg-[#141419] animate-pulse" />
                  <div className="h-32 rounded-2xl bg-[#141419] border border-white/10 animate-pulse" />
                </div>
              ) : currentPiece ? (
                <PieceView
                  piece={currentPiece}
                  hasPass={hasPass}
                  passPriceMxn={manifest ? manifest.pass_price_mxn : 79}
                  onOpenPaywall={() => setIsPaywallModalOpen(true)}
                  currentStopIndex={activeRoute ? currentStopIndex : undefined}
                  totalStops={activeRoute ? activeRoute.stops.length : undefined}
                  roomName={activeRoute ? activeRoute.stops[currentStopIndex]?.room_zone : undefined}
                  nextStop={
                    activeRoute && currentStopIndex + 1 < activeRoute.stops.length
                      ? activeRoute.stops[currentStopIndex + 1]
                      : null
                  }
                  onNextStop={handleNextStop}
                  onPreviousStop={handlePreviousStop}
                  onOpenMapModal={() => setIsMapModalOpen(true)}
                  roomPieces={currentRoomPieces}
                  allPieces={tourPieces}
                  onSelectPiece={handleSelectPieceById}
                  currentRoom={activePieceRoom}
                  activeRouteStops={activeRoute ? activeRoute.stops : []}
                  onSelectStop={handleSelectStop}
                  visitedPieceIds={visitedPieceIds}
                />
              ) : (
                <div className="p-12 text-center text-[#9CA3AF] text-sm flex flex-col items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#F59E0B]/20 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] text-2xl font-bold">
                    🏛️
                  </div>
                  <p className="font-medium text-stone-200">{t.app.pieceNotFound}</p>
                  <button
                    type="button"
                    onClick={() => setViewMode('overview')}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-white/10 hover:bg-white/5 text-stone-200 transition cursor-pointer"
                  >
                    {t.app.backToRooms}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Floating Audio Player (hidden if tour completed or no piece) */}
          {!isTourCompleted && currentPiece && (
            <FloatingAudioPlayer
              currentPiece={currentPiece}
              roomName={activeRoute?.stops[currentStopIndex]?.room_zone}
              onOpenPieceDetail={() => {
                if (viewMode !== 'tour') pushNavState('tour');
              }}
            />
          )}

          {/* Bottom Dock Bar (hidden during wizard to prevent covering CTA) */}
          {selectedSite && viewMode !== 'wizard' && !isTourCompleted && (
            <BottomDockBar
              activeTab={activeDockTab}
              onSelectTab={handleDockSelectTab}
              roomsCount={allRooms.length}
            />
          )}

          {/* ================= MODALS ================= */}

          {/* 1. Live Route Manager Modal */}
          {activeRoute && (
            <LiveRouteManagerModal
              isOpen={isLiveRouteManagerOpen}
              onClose={() => setIsLiveRouteManagerOpen(false)}
              activeRoute={activeRoute}
              currentStopIndex={currentStopIndex}
              manifest={manifest}
              rooms={allRooms}
              pieces={tourPieces}
              onSelectStop={handleSelectStop}
              onUpdateRoute={(updatedRoute, newIdx) => {
                setActiveRoute(updatedRoute);
                if (newIdx !== undefined) setCurrentStopIndex(newIdx);
              }}
              onStartSpontaneousDetour={handleStartSpontaneousDetour}
            />
          )}

          {/* 3. Paywall Modal */}
          {selectedSite && manifest && (
            <PaywallModal
              isOpen={isPaywallModalOpen}
              onClose={() => setIsPaywallModalOpen(false)}
              siteName={selectedSite.name}
              siteId={selectedSite.id}
              passPriceMxn={manifest.pass_price_mxn}
              passPriceUsd={manifest.pass_price_usd}
              stripeLink={selectedSite.stripe_link}
              hasPass={hasPass}
              passExpiresAt={currentLicense?.expires_at}
              onSimulatePurchase={handleSimulatePurchase}
              onRevokePass={handleRevokePass}
            />
          )}

          {/* 4. MapViewModal */}
          {selectedSite && (
            <MapViewModal
              isOpen={isMapModalOpen}
              onClose={() => setIsMapModalOpen(false)}
              siteId={selectedSite.id}
              siteName={selectedSite.short_name || selectedSite.name}
              routeName={activeRoute ? activeRoute.name : t.app.mapDefaultTitle}
              stops={activeRoute ? activeRoute.stops : []}
              currentStopIndex={currentStopIndex}
              rooms={allRooms}
              pieces={tourPieces}
              onSelectStop={(stopIdx) => {
                if (activeRoute) handleSelectStop(stopIdx);
              }}
              onOpenPieceFile={async (pId) => {
                await handleSelectPieceById(pId);
              }}
              onAddStopToRoute={handleAddStopToRoute}
              onSelectRoom={handleOpenRoomView}
              onStartRoomTour={handleStartRoomTour}
            />
          )}

          {/* 5. SearchModal */}
          <SearchModal
            isOpen={isSearchModalOpen}
            onClose={() => setIsSearchModalOpen(false)}
            pieces={tourPieces.length > 0 ? tourPieces : (currentPiece ? [currentPiece] : [])}
            onSelectPiece={handleSelectPieceById}
          />

          {/* 6. RoomDetailModal */}
          <RoomDetailModal
            isOpen={!!selectedRoomForDetail && viewMode !== 'room'}
            onClose={() => setSelectedRoomForDetail(null)}
            room={selectedRoomForDetail}
            pieces={getRoomPieces(selectedRoomForDetail)}
            onStartRoomTour={handleStartRoomTour}
            onSelectPiece={handleSelectPieceById}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}
