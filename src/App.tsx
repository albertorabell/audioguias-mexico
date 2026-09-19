import React, { useState, useEffect, useMemo } from 'react';
import { SiteSummary, SiteManifest, SiteRoute, RouteStop, PieceData, SiteLicense } from './types';
import { getSiteLicense, activatePass, revokePass, hasActivePass } from './utils/license';
import { SiteSelector } from './components/SiteSelector';
import { SiteOverview } from './components/SiteOverview';
import { RouteWizard } from './components/RouteWizard';
import { Navbar } from './components/Navbar';
import { PieceView } from './components/PieceView';
import { BottomNav } from './components/BottomNav';
import { RouteModal } from './components/RouteModal';
import { LiveRouteManagerModal } from './components/LiveRouteManagerModal';
import { PaywallModal } from './components/PaywallModal';
import { MapViewModal } from './components/MapViewModal';
import { SearchModal } from './components/SearchModal';
import { OfflineTourBanner } from './components/OfflineTourBanner';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useTheme } from './utils/ThemeContext';
import { formatRouteDuration } from './utils/routeOptimizer';
import { getAssetUrl, normalizePiece, findPiece } from './utils/urlHelper';
import { Radio, ArrowLeft } from 'lucide-react';

interface SpontaneousDetour {
  pieceFile: string;
  pieceTitle: string;
  originalStopIndex: number;
}

export default function App() {
  const { isSunMode } = useTheme();

  // Navigation & View State: 'sites' -> 'overview' -> 'wizard' -> 'tour'
  const [viewMode, setViewMode] = useState<'sites' | 'overview' | 'wizard' | 'tour'>('sites');
  const [sites, setSites] = useState<SiteSummary[]>([]);
  const [selectedSite, setSelectedSite] = useState<SiteSummary | null>(null);
  const [manifest, setManifest] = useState<SiteManifest | null>(null);
  const [activeRoute, setActiveRoute] = useState<SiteRoute | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState<number>(0);
  const [currentPiece, setCurrentPiece] = useState<PieceData | null>(null);
  const [tourPieces, setTourPieces] = useState<PieceData[]>([]);

  // Spontaneous Detour State
  const [spontaneousDetour, setSpontaneousDetour] = useState<SpontaneousDetour | null>(null);

  // License State
  const [currentLicense, setCurrentLicense] = useState<SiteLicense | null>(null);

  // Modal State
  const [isLiveRouteManagerOpen, setIsLiveRouteManagerOpen] = useState(false);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [isPaywallModalOpen, setIsPaywallModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Loading & Error states
  const [isLoadingSites, setIsLoadingSites] = useState(true);
  const [isLoadingPiece, setIsLoadingPiece] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Format fetch URL cleanly with import.meta.env.BASE_URL and GitHub Pages detection
  const normalizeUrl = (url: string) => getAssetUrl(url);

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
        setErrorMessage('No se pudieron cargar los sitios. Verifica tu conexión.');
      } finally {
        setIsLoadingSites(false);
      }
    }
    loadSites();
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

  // 2. When a site is selected, load its manifest and launch Site Welcome Overview
  const handleSelectSite = async (site: SiteSummary) => {
    setSelectedSite(site);
    setIsLoadingPiece(true);
    setErrorMessage(null);

    // Stop any ongoing speech synthesis
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    try {
      const res = await fetch(getAssetUrl(site.path));
      if (!res.ok) throw new Error(`Error ${res.status} al cargar manifiesto de ${site.name}`);
      const manifestData: SiteManifest = await res.json();
      setManifest(manifestData);

      // Open the Site Overview Welcome screen
      setViewMode('overview');
    } catch (err) {
      console.error('Error loading site manifest:', err);
      setErrorMessage('No se pudo cargar el recorrido de este sitio.');
      setSelectedSite(null);
      setViewMode('sites');
    } finally {
      setIsLoadingPiece(false);
    }
  };

  // Start tour from generated route in Wizard
  const handleStartRouteFromWizard = async (chosenRoute: SiteRoute) => {
    setActiveRoute(chosenRoute);
    setCurrentStopIndex(0);
    setSpontaneousDetour(null);
    setViewMode('tour');

    if (chosenRoute.stops && chosenRoute.stops.length > 0) {
      const stop = chosenRoute.stops[0];
      await loadPieceData(stop.piece_id || stop.id || stop.poi_id || stop.file);
    }
  };

  // Start tour directly from Site Overview predefined route
  const handleStartRouteFromOverview = async (chosenRoute: SiteRoute) => {
    setActiveRoute(chosenRoute);
    setCurrentStopIndex(0);
    setSpontaneousDetour(null);
    setViewMode('tour');

    if (chosenRoute.stops && chosenRoute.stops.length > 0) {
      const stop = chosenRoute.stops[0];
      await loadPieceData(stop.piece_id || stop.id || stop.poi_id || stop.file);
    }
  };

  // Helper to re-open Wizard from within the tour or overview
  const handleOpenWizard = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setViewMode('wizard');
  };

  // Helper to load piece data (supports both file paths and piece IDs with robust fallbacks)
  const loadPieceData = async (filePathOrId: string) => {
    setIsLoadingPiece(true);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    try {
      const cleanTarget = (filePathOrId || '').trim();
      let piece: PieceData | null = null;

      // 1. Buscar primero en memoria si tourPieces ya está cargado
      if (tourPieces && tourPieces.length > 0) {
        const found = findPiece(tourPieces, cleanTarget);
        if (found) {
          piece = normalizePiece({ ...found });
        }
      }

      // 2. Si no se encontró en memoria, cargar data/pieces.json completo
      if (!piece) {
        try {
          const piecesRes = await fetch(getAssetUrl('data/pieces.json'));
          if (piecesRes.ok) {
            const allPieces: PieceData[] = await piecesRes.json();
            const normalized = allPieces.map((p) => normalizePiece(p));
            setTourPieces(normalized);
            const found = findPiece(normalized, cleanTarget);
            if (found) {
              piece = found;
            }
          }
        } catch (err) {
          console.warn('Fetch from data/pieces.json failed:', err);
        }
      }

      // 3. Si parece una ruta de archivo (contiene '/' o termina en '.json'), intentar fetch directo
      if (!piece && (cleanTarget.includes('/') || cleanTarget.endsWith('.json'))) {
        try {
          const res = await fetch(getAssetUrl(cleanTarget));
          if (res.ok) {
            const raw = await res.json();
            piece = normalizePiece(raw);
          }
        } catch (err) {
          console.warn('Direct piece fetch failed:', err);
        }
      }

      // 4. Buscar en las salas del manifiesto cargado
      if (!piece && manifest?.rooms) {
        for (const room of manifest.rooms) {
          const pi = room.pieces_info?.find(
            (p: any) =>
              p.piece_id === cleanTarget ||
              p.id === cleanTarget ||
              p.poi_id === cleanTarget ||
              (p.file && p.file.includes(cleanTarget))
          );
          if (pi) {
            if (pi.file) {
              try {
                const res = await fetch(getAssetUrl(pi.file));
                if (res.ok) {
                  piece = normalizePiece(await res.json());
                  break;
                }
              } catch {}
            }
            piece = normalizePiece({
              id: (pi as any).piece_id || (pi as any).id || pi.poi_id,
              piece_id: (pi as any).piece_id || (pi as any).id || pi.poi_id,
              poi_id: (pi as any).piece_id || (pi as any).id || pi.poi_id,
              titulo: pi.title,
              title: pi.title,
              room_id: room.room_id || room.id || '',
              roomId: room.room_id || room.id || '',
              piso: room.piso || 'PB',
              orden_sugerido: 1,
              frase_gancho: room.frase_gancho || '',
              puente_narrativo: room.introduccion_narrativa || '',
              guion_corto: pi.title,
              guion_largo: pi.title,
              retos_observacion: [],
              especificaciones: {},
              map_x: room.coords?.x || 50,
              map_y: room.coords?.y || 50,
              image_filename: pi.thumbnail || '',
              is_free: !pi.is_premium,
              is_premium: !!pi.is_premium,
            } as unknown as PieceData);
            break;
          }
        }
      }

      if (!piece) {
        throw new Error(`No se pudo resolver la pieza ${filePathOrId}`);
      }

      // Asegurar que cada objeto 'piece' exponga ambas propiedades
      piece.id = piece.piece_id || piece.id;
      piece.piece_id = piece.piece_id || piece.id;

      setCurrentPiece(piece);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error loading piece:', err);
      setErrorMessage('No se pudo cargar la información de esta pieza.');
    } finally {
      setIsLoadingPiece(false);
    }
  };

  // Handle route change from modal
  const handleSelectRoute = async (routeId: string) => {
    if (!manifest) return;
    const foundRoute = manifest.routes.find((r: any) => r.id === routeId || r.route_id === routeId);
    if (foundRoute) {
      setActiveRoute(foundRoute);
      setCurrentStopIndex(0);
      setSpontaneousDetour(null);
      if (foundRoute.stops.length > 0) {
        const stop = foundRoute.stops[0];
        await loadPieceData(stop.piece_id || stop.id || stop.poi_id || stop.file);
      }
    }
  };

  // Handle selecting a specific stop in modal or map
  const handleSelectStop = async (stopIndex: number) => {
    if (!activeRoute || stopIndex < 0 || stopIndex >= activeRoute.stops.length) return;
    setCurrentStopIndex(stopIndex);
    setSpontaneousDetour(null);
    const stop = activeRoute.stops[stopIndex];
    await loadPieceData(stop.piece_id || stop.id || stop.poi_id || stop.file);
  };

  // Live route updates from LiveRouteManagerModal
  const handleUpdateRoute = (updatedRoute: SiteRoute, newCurrentIndex?: number) => {
    setActiveRoute(updatedRoute);
    if (typeof newCurrentIndex === 'number') {
      setCurrentStopIndex(newCurrentIndex);
      if (updatedRoute.stops[newCurrentIndex]) {
        const stop = updatedRoute.stops[newCurrentIndex];
        loadPieceData(stop.piece_id || stop.id || stop.poi_id || stop.file);
      }
    }
  };

  // Spontaneous detour handling
  const handleStartSpontaneousDetour = async (pieceFile: string, pieceTitle: string) => {
    setSpontaneousDetour({
      pieceFile,
      pieceTitle,
      originalStopIndex: currentStopIndex,
    });
    await loadPieceData(pieceFile);
  };

  const handleResumePlannedRoute = async () => {
    if (!activeRoute) return;
    const targetIdx = spontaneousDetour ? spontaneousDetour.originalStopIndex : currentStopIndex;
    setSpontaneousDetour(null);
    if (activeRoute.stops[targetIdx]) {
      const stop = activeRoute.stops[targetIdx];
      await loadPieceData(stop.piece_id || stop.id || stop.poi_id || stop.file);
    }
  };

  const handleKeepDetourInRoute = () => {
    if (!activeRoute || !spontaneousDetour || !currentPiece) return;
    const pieceId = currentPiece.piece_id || currentPiece.id || currentPiece.poi_id;
    const roomId = currentPiece.room_id || (currentPiece as any).roomId || currentPiece.location?.room_id || 'Sala';
    const newStop: RouteStop = {
      poi_id: pieceId,
      piece_id: pieceId,
      id: pieceId,
      title: currentPiece.titulo || currentPiece.identification?.title || pieceId,
      room_zone: currentPiece.identification?.room_zone || (currentPiece.identification as any)?.location_room || roomId,
      file: spontaneousDetour.pieceFile,
      estimated_minutes: currentPiece.estimated_minutes || 8,
      map_coords: { x: currentPiece.map_x || 50, y: currentPiece.map_y || 50 },
      ranking: currentPiece.is_premium ? 2 : 1,
      room_id: roomId,
    };
    const newStops = [...activeRoute.stops];
    newStops.splice(spontaneousDetour.originalStopIndex + 1, 0, newStop);
    setActiveRoute({
      ...activeRoute,
      stops: newStops,
    });
    setCurrentStopIndex(spontaneousDetour.originalStopIndex + 1);
    setSpontaneousDetour(null);
  };

  // Add a piece stop to current route
  const handleAddStopToRoute = (newStop: RouteStop) => {
    if (!activeRoute) return;
    const stopId = (newStop as any).piece_id || (newStop as any).id || newStop.poi_id;
    if (activeRoute.stops.some((s: any) => s.piece_id === stopId || s.id === stopId || s.poi_id === stopId)) return;

    const updatedRoute: SiteRoute = {
      ...activeRoute,
      stops: [...activeRoute.stops, newStop],
    };
    setActiveRoute(updatedRoute);
  };

  // Handle next stop button or finish route
  const handleNextStop = async () => {
    if (!activeRoute) return;
    const nextIdx = currentStopIndex + 1;
    if (nextIdx < activeRoute.stops.length) {
      setCurrentStopIndex(nextIdx);
      setSpontaneousDetour(null);
      const stop = activeRoute.stops[nextIdx];
      await loadPieceData(stop.piece_id || stop.id || stop.poi_id || stop.file);
    } else {
      // Reached the end: open route completion / manager modal
      setIsLiveRouteManagerOpen(true);
    }
  };

  // Handle previous stop button
  const handlePreviousStop = async () => {
    if (!activeRoute || currentStopIndex <= 0) return;
    const prevIdx = currentStopIndex - 1;
    setCurrentStopIndex(prevIdx);
    setSpontaneousDetour(null);
    const stop = activeRoute.stops[prevIdx];
    await loadPieceData(stop.piece_id || stop.id || stop.poi_id || stop.file);
  };

  // Restart route
  const handleRestartRoute = async () => {
    if (!activeRoute || activeRoute.stops.length === 0) return;
    setCurrentStopIndex(0);
    setSpontaneousDetour(null);
    const stop = activeRoute.stops[0];
    await loadPieceData(stop.piece_id || stop.id || stop.poi_id || stop.file);
  };

  // Return to site catalog
  const handleBackToSites = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSelectedSite(null);
    setManifest(null);
    setActiveRoute(null);
    setCurrentPiece(null);
    setCurrentStopIndex(0);
    setSpontaneousDetour(null);
    setViewMode('sites');
  };

  // Pass simulation testing
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

  // Preload pieces whenever activeRoute changes or manifest changes
  useEffect(() => {
    let isMounted = true;
    async function preloadRoutePieces() {
      // 1. Intentar cargar primero la base de datos completa de public/data/pieces.json
      try {
        const fullRes = await fetch(getAssetUrl('data/pieces.json'));
        if (fullRes.ok) {
          const fullData: PieceData[] = await fullRes.json();
          if (isMounted && fullData && fullData.length > 0) {
            setTourPieces(fullData.map((p) => normalizePiece(p)));
            return;
          }
        }
      } catch (err) {
        console.warn('Could not load data/pieces.json:', err);
      }

      if (!activeRoute || activeRoute.stops.length === 0) {
        if (manifest?.rooms) {
          const roomPieces: PieceData[] = manifest.rooms.flatMap((r) =>
            (r.pieces_info || []).map((pi) => {
              const pieceId = (pi as any).piece_id || (pi as any).id || pi.poi_id;
              const roomId = r.room_id || r.id;
              return normalizePiece({
                id: pieceId,
                piece_id: pieceId,
                poi_id: pieceId,
                site_id: manifest.site_id,
                room_id: roomId,
                roomId: roomId,
                case_number: '',
                identification: {
                  title: pi.title,
                  hero_image: pi.thumbnail,
                  room_zone: r.nombre_oficial || r.name,
                },
                summary_30s: pi.title,
                is_premium: !!pi.is_premium,
                audioguide: {
                  audio_script: '',
                },
              } as unknown as PieceData);
            })
          );
          if (isMounted) setTourPieces(roomPieces);
        }
        return;
      }

      try {
        const piecePromises = activeRoute.stops.map(async (stop) => {
          const pieceId = (stop as any).piece_id || (stop as any).id || stop.poi_id;
          const roomId = stop.room_id || (stop as any).roomId || '';
          try {
            const res = await fetch(getAssetUrl(stop.file));
            if (res.ok) {
              const data: PieceData = await res.json();
              return normalizePiece(data);
            }
          } catch {}
          return normalizePiece({
            id: pieceId,
            piece_id: pieceId,
            poi_id: pieceId,
            site_id: selectedSite?.id || 'MNA',
            room_id: roomId,
            roomId: roomId,
            case_number: stop.case_number || '',
            identification: {
              title: stop.title,
              hero_image: stop.thumbnail,
              room_zone: stop.room_zone,
            },
            summary_30s: stop.description || '',
            is_premium: !!stop.is_premium,
            audioguide: {
              audio_script: '',
            },
          } as unknown as PieceData);
        });

        const loaded = await Promise.all(piecePromises);
        if (isMounted) {
          setTourPieces(loaded);
        }
      } catch (err) {
        console.warn('Could not preload pieces:', err);
      }
    }

    preloadRoutePieces();
    return () => {
      isMounted = false;
    };
  }, [activeRoute, manifest]);

  // Jump to piece from SearchModal or URL query parameter with full compatibility
  const handleSelectPieceById = async (id: string) => {
    if (!id) return;

    // Auto-activar primera ruta si aún no hay activa
    let currentRoute = activeRoute;
    if (!currentRoute && manifest?.routes && manifest.routes.length > 0) {
      currentRoute = manifest.routes[0];
      setActiveRoute(currentRoute);
    }

    // 1. Buscar en paradas de la ruta activa
    if (currentRoute) {
      const stopIdx = currentRoute.stops.findIndex(
        (s: any) =>
          s.piece_id === id ||
          s.id === id ||
          s.poi_id === id ||
          (s.file && s.file.includes(id)) ||
          (s.poi_id && s.poi_id.toLowerCase() === id.toLowerCase())
      );

      if (stopIdx !== -1) {
        setViewMode('tour');
        await handleSelectStop(stopIdx);
        return;
      }
    }

    // 2. Buscar en piezas precargadas (tourPieces) con findPiece
    const tourMatch = findPiece(tourPieces, id);
    if (tourMatch) {
      setViewMode('tour');
      normalizePiece(tourMatch);
      setCurrentPiece(tourMatch);
      return;
    }

    // 3. Buscar en salas del catálogo del recinto
    if (manifest?.rooms) {
      for (const room of manifest.rooms) {
        const found = room.pieces_info?.find(
          (p: any) =>
            p.piece_id === id ||
            p.id === id ||
            p.poi_id === id ||
            (p.file && p.file.includes(id))
        );
        if (found) {
          setViewMode('tour');
          const stopFile = found.file || (found as any).piece_id || (found as any).id || found.poi_id;
          await handleStartSpontaneousDetour(stopFile, found.title);
          return;
        }
      }
    }

    // 4. Carga directa por resolved ID / File
    setViewMode('tour');
    await loadPieceData(id);
  };

  // Escuchar parámetros de URL para navegación directa a pieza o sala (?piece=, ?piece_id=, ?id=, ?room=, ?room_id=, ?sala=)
  useEffect(() => {
    if (!manifest) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const targetPieceId = params.get('piece') || params.get('piece_id') || params.get('id') || params.get('poi_id');
      const targetRoomId = params.get('room') || params.get('room_id') || params.get('sala');

      if (targetPieceId) {
        handleSelectPieceById(targetPieceId);
      } else if (targetRoomId) {
        const room = manifest.rooms?.find(
          (r: any) => r.room_id === targetRoomId || r.id === targetRoomId
        );
        if (room && room.pieces_info && room.pieces_info.length > 0) {
          const firstPiece = room.pieces_info[0];
          const pId = (firstPiece as any).piece_id || (firstPiece as any).id || firstPiece.poi_id;
          handleSelectPieceById(pId);
        }
      }
    } catch (e) {
      console.warn('Error reading URL search params:', e);
    }
  }, [manifest]);

  // Remaining minutes in route for persistent pill
  const remainingRouteMinutes = useMemo(() => {
    if (!activeRoute?.stops) return 0;
    let total = 0;
    for (let i = currentStopIndex; i < activeRoute.stops.length; i++) {
      total += activeRoute.stops[i].estimated_minutes || 8;
    }
    return total;
  }, [activeRoute?.stops, currentStopIndex]);

  return (
    <div
      className={`min-h-screen w-full max-w-full overflow-x-hidden flex justify-center font-sans transition-colors duration-200 ${
        isSunMode ? 'bg-[#FAF8F5] text-[#111827]' : 'bg-[#141414] text-[#F5F5F4]'
      }`}
    >
      {/* Offline Banner indicator */}
      <OfflineIndicator />

      {/* Main mobile/tablet viewport container */}
      <div
        className={`w-full max-w-[480px] min-h-screen shadow-2xl relative flex flex-col transition-colors duration-200 border-x overflow-x-hidden ${
          isSunMode
            ? 'bg-[#FAF8F5] border-stone-200/80 text-[#111827]'
            : 'bg-[#141414] border-stone-800/80 text-[#F5F5F4]'
        }`}
      >
        {/* Error message alert if any */}
        {errorMessage && (
          <div
            className={`p-3.5 m-3 rounded-2xl border text-xs flex justify-between items-center shadow-md ${
              isSunMode
                ? 'bg-rose-50 border-rose-300 text-rose-950'
                : 'bg-rose-950/80 border-rose-800 text-rose-200'
            }`}
          >
            <span className="font-semibold">{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-stone-500 hover:text-stone-900 text-sm font-bold ml-2 p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* ================= VIEW 1: SITE SELECTOR (HOME) ================= */}
        {!selectedSite || viewMode === 'sites' ? (
          <SiteSelector
            sites={sites}
            onSelectSite={handleSelectSite}
            isLoading={isLoadingSites}
          />
        ) : viewMode === 'overview' && manifest ? (
          /* ================= VIEW 2: PANTALLA DE BIENVENIDA DEL SITIO ================= */
          <SiteOverview
            site={selectedSite}
            manifest={manifest}
            onBack={handleBackToSites}
            onCustomizeRoute={() => {
              window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0;
              setViewMode('wizard');
            }}
            onDirectStartRoute={handleStartRouteFromOverview}
          />
        ) : viewMode === 'wizard' && manifest ? (
          /* ================= VIEW 3: ASISTENTE DE RUTA PERSONALIZADA ================= */
          <RouteWizard
            site={selectedSite}
            manifest={manifest}
            onBack={() => setViewMode('overview')}
            onStartRoute={handleStartRouteFromWizard}
          />
        ) : (
          /* ================= VIEW 4: ACTIVE TOUR VIEW ================= */
          <div className="flex-1 flex flex-col relative">
            {/* Top Navbar */}
            <Navbar
              onBack={() => setViewMode('overview')}
              activeRoute={activeRoute}
              currentStopIndex={currentStopIndex}
              totalStops={activeRoute ? activeRoute.stops.length : 0}
              hasPass={hasPass}
              passExpiresAt={currentLicense?.expires_at}
              onOpenRouteModal={() => setIsLiveRouteManagerOpen(true)}
              onOpenPaywallModal={() => setIsPaywallModalOpen(true)}
              onOpenMapModal={() => setIsMapModalOpen(true)}
              onOpenSearchModal={() => setIsSearchModalOpen(true)}
            />

            {/* Banner de Descarga Offline */}
            <div className="px-3 pt-2">
              <OfflineTourBanner
                pieces={tourPieces.length > 0 ? tourPieces : (currentPiece ? [currentPiece] : [])}
              />
            </div>

            {/* PÍLDORA FLOTANTE PERSISTENTE: "🧭 Mi Ruta (Parada X de Y)" */}
            {activeRoute && !spontaneousDetour && (
              <div className="sticky top-[57px] z-20 px-3 py-1.5 flex justify-end pointer-events-none">
                <button
                  type="button"
                  id="btn-live-route-pill"
                  onClick={() => setIsLiveRouteManagerOpen(true)}
                  className={`pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black shadow-lg backdrop-blur-md border transition-all active:scale-95 hover:scale-[1.02] ${
                    isSunMode
                      ? 'bg-white/95 text-stone-900 border-amber-400 shadow-amber-500/15'
                      : 'bg-stone-900/95 text-stone-100 border-amber-500 shadow-amber-500/25'
                  }`}
                >
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span className="text-amber-500 font-black">🧭 Mi Ruta</span>
                  <span className="text-[11px] font-semibold opacity-90">
                    (Parada {currentStopIndex + 1} de {activeRoute.stops.length})
                  </span>
                  <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 pl-1.5 border-l border-stone-300 dark:border-stone-700">
                    ~{formatRouteDuration(remainingRouteMinutes)}
                  </span>
                </button>
              </div>
            )}

            {/* BANNER DE DESVÍO ESPONTÁNEO ACTIVO */}
            {spontaneousDetour && (
              <div
                className={`sticky top-[57px] z-20 mx-3 my-1.5 p-3 rounded-2xl border shadow-lg backdrop-blur-md animate-fadeIn flex flex-col gap-2 ${
                  isSunMode
                    ? 'bg-amber-50/95 border-amber-400 text-amber-950'
                    : 'bg-stone-900/95 border-amber-500 text-amber-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs font-black">
                      <span>🟡 Desvío espontáneo</span>
                      <span className="text-[10px] font-normal opacity-75">• fuera de secuencia</span>
                    </div>
                    <div className="text-[11px] font-medium line-clamp-1">
                      Explorando: {spontaneousDetour.pieceTitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleKeepDetourInRoute}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all active:scale-95"
                  >
                    + Conservar en mi ruta
                  </button>
                  <button
                    type="button"
                    onClick={handleResumePlannedRoute}
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border transition-all active:scale-95 ${
                      isSunMode
                        ? 'bg-white border-amber-300 text-stone-800 hover:bg-stone-100'
                        : 'bg-stone-800 border-amber-500/40 text-stone-200 hover:bg-stone-700'
                    }`}
                  >
                    ⬅ Retomar ruta planeada (Parada {spontaneousDetour.originalStopIndex + 1})
                  </button>
                </div>
              </div>
            )}

            {/* Content loading state */}
            {isLoadingPiece ? (
              <div className="p-6 space-y-4">
                <div
                  className={`w-full h-64 rounded-2xl animate-pulse ${
                    isSunMode ? 'bg-stone-200' : 'bg-stone-900'
                  }`}
                />
                <div
                  className={`h-6 w-3/4 rounded animate-pulse ${
                    isSunMode ? 'bg-stone-200' : 'bg-stone-900'
                  }`}
                />
                <div
                  className={`h-4 w-1/2 rounded animate-pulse ${
                    isSunMode ? 'bg-stone-200' : 'bg-stone-900'
                  }`}
                />
                <div
                  className={`h-32 rounded-2xl animate-pulse ${
                    isSunMode ? 'bg-stone-200' : 'bg-stone-900'
                  }`}
                />
              </div>
            ) : currentPiece ? (
              /* Dynamic Piece View */
              <PieceView
                piece={currentPiece}
                hasPass={hasPass}
                passPriceMxn={manifest ? manifest.pass_price_mxn : 79}
                onOpenPaywall={() => setIsPaywallModalOpen(true)}
                currentStopIndex={activeRoute ? currentStopIndex : undefined}
                totalStops={activeRoute ? activeRoute.stops.length : undefined}
                roomName={activeRoute?.stops[currentStopIndex]?.room_zone}
                nextStop={
                  activeRoute && currentStopIndex + 1 < activeRoute.stops.length
                    ? activeRoute.stops[currentStopIndex + 1]
                    : null
                }
                onNextStop={handleNextStop}
                onPreviousStop={handlePreviousStop}
                onOpenMapModal={() => setIsMapModalOpen(true)}
              />
            ) : (
              <div className="p-12 text-center text-stone-600 dark:text-stone-400 text-sm flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 text-xl font-bold">
                  🏛️
                </div>
                <p className="font-medium">No se encontró información para esta pieza.</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeRoute && activeRoute.stops.length > 0) {
                        loadPieceData(activeRoute.stops[0].file);
                      } else if (tourPieces.length > 0) {
                        setCurrentPiece(tourPieces[0]);
                      } else {
                        setViewMode('overview');
                      }
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-stone-950 transition active:scale-95 shadow-md"
                  >
                    Ver obras maestras
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('overview')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                  >
                    Volver a salas
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Fixed Navigation Bar */}
            {activeRoute && (
              <BottomNav
                currentStopIndex={currentStopIndex}
                totalStops={activeRoute.stops.length}
                nextStop={
                  currentStopIndex + 1 < activeRoute.stops.length
                    ? activeRoute.stops[currentStopIndex + 1]
                    : null
                }
                onNextStop={handleNextStop}
                onPreviousStop={handlePreviousStop}
                onRestartRoute={handleRestartRoute}
                onOpenRouteModal={() => setIsLiveRouteManagerOpen(true)}
                onOpenMapModal={() => setIsMapModalOpen(true)}
              />
            )}
          </div>
        )}

        {/* ================= MODALS ================= */}

        {/* 1. Gestor de Ruta en Vivo (Live Route Manager) */}
        {manifest && activeRoute && (
          <LiveRouteManagerModal
            isOpen={isLiveRouteManagerOpen}
            onClose={() => setIsLiveRouteManagerOpen(false)}
            activeRoute={activeRoute}
            currentStopIndex={currentStopIndex}
            manifest={manifest}
            onSelectStop={handleSelectStop}
            onUpdateRoute={handleUpdateRoute}
            onStartSpontaneousDetour={handleStartSpontaneousDetour}
          />
        )}

        {/* 2. Route Selector Modal (Classic routes catalog) */}
        {manifest && (
          <RouteModal
            isOpen={isRouteModalOpen}
            onClose={() => setIsRouteModalOpen(false)}
            routes={manifest.routes}
            activeRouteId={activeRoute ? activeRoute.id : ''}
            onSelectRoute={handleSelectRoute}
            onSelectStop={handleSelectStop}
            currentStopIndex={currentStopIndex}
            onOpenWizard={handleOpenWizard}
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

        {/* 4. Interactive Architectural Map & Floorplan Modal (Mapa Pro) */}
        {selectedSite && activeRoute && (
          <MapViewModal
            isOpen={isMapModalOpen}
            onClose={() => setIsMapModalOpen(false)}
            siteId={selectedSite.id}
            siteName={selectedSite.short_name || selectedSite.name}
            routeName={activeRoute.name}
            stops={activeRoute.stops}
            currentStopIndex={currentStopIndex}
            rooms={manifest?.rooms || []}
            onSelectStop={(stopIdx) => {
              handleSelectStop(stopIdx);
            }}
            onOpenPieceFile={async (filePath) => {
              const idx = activeRoute.stops.findIndex((s) => s.file === filePath);
              if (idx !== -1) {
                setCurrentStopIndex(idx);
              }
              await loadPieceData(filePath);
            }}
            onAddStopToRoute={handleAddStopToRoute}
          />
        )}

        {/* 5. Modal de Búsqueda Directa (Teclado Numérico + Predictivo) */}
        <SearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          pieces={tourPieces.length > 0 ? tourPieces : (currentPiece ? [currentPiece] : [])}
          onSelectPiece={handleSelectPieceById}
        />
      </div>
    </div>
  );
}
