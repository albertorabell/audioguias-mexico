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
import { OfflineIndicator } from './components/OfflineIndicator';
import { useTheme } from './utils/ThemeContext';
import { formatRouteDuration } from './utils/routeOptimizer';
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

  // Spontaneous Detour State
  const [spontaneousDetour, setSpontaneousDetour] = useState<SpontaneousDetour | null>(null);

  // License State
  const [currentLicense, setCurrentLicense] = useState<SiteLicense | null>(null);

  // Modal State
  const [isLiveRouteManagerOpen, setIsLiveRouteManagerOpen] = useState(false);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [isPaywallModalOpen, setIsPaywallModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Loading & Error states
  const [isLoadingSites, setIsLoadingSites] = useState(true);
  const [isLoadingPiece, setIsLoadingPiece] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Format fetch URL cleanly with import.meta.env.BASE_URL
  const normalizeUrl = (url: string) => {
    const base = import.meta.env.BASE_URL || '/';
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    const cleanPath = url.replace(/^\/+/, '');
    return `${cleanBase}${cleanPath}`;
  };

  // 1. Fetch sites catalog on mount
  useEffect(() => {
    async function loadSites() {
      setIsLoadingSites(true);
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}data/sites.json`);
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
      const res = await fetch(normalizeUrl(site.path));
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
      await loadPieceData(chosenRoute.stops[0].file);
    }
  };

  // Start tour directly from Site Overview predefined route
  const handleStartRouteFromOverview = async (chosenRoute: SiteRoute) => {
    setActiveRoute(chosenRoute);
    setCurrentStopIndex(0);
    setSpontaneousDetour(null);
    setViewMode('tour');

    if (chosenRoute.stops && chosenRoute.stops.length > 0) {
      await loadPieceData(chosenRoute.stops[0].file);
    }
  };

  // Helper to re-open Wizard from within the tour or overview
  const handleOpenWizard = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setViewMode('wizard');
  };

  // Helper to load piece data
  const loadPieceData = async (filePath: string) => {
    setIsLoadingPiece(true);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    try {
      const res = await fetch(normalizeUrl(filePath));
      if (!res.ok) throw new Error(`Error ${res.status} al cargar pieza ${filePath}`);
      const piece: PieceData = await res.json();
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
    const foundRoute = manifest.routes.find((r) => r.id === routeId);
    if (foundRoute) {
      setActiveRoute(foundRoute);
      setCurrentStopIndex(0);
      setSpontaneousDetour(null);
      if (foundRoute.stops.length > 0) {
        await loadPieceData(foundRoute.stops[0].file);
      }
    }
  };

  // Handle selecting a specific stop in modal or map
  const handleSelectStop = async (stopIndex: number) => {
    if (!activeRoute || stopIndex < 0 || stopIndex >= activeRoute.stops.length) return;
    setCurrentStopIndex(stopIndex);
    setSpontaneousDetour(null);
    await loadPieceData(activeRoute.stops[stopIndex].file);
  };

  // Live route updates from LiveRouteManagerModal
  const handleUpdateRoute = (updatedRoute: SiteRoute, newCurrentIndex?: number) => {
    setActiveRoute(updatedRoute);
    if (typeof newCurrentIndex === 'number') {
      setCurrentStopIndex(newCurrentIndex);
      if (updatedRoute.stops[newCurrentIndex]) {
        loadPieceData(updatedRoute.stops[newCurrentIndex].file);
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
      await loadPieceData(activeRoute.stops[targetIdx].file);
    }
  };

  const handleKeepDetourInRoute = () => {
    if (!activeRoute || !spontaneousDetour || !currentPiece) return;
    const newStop: RouteStop = {
      poi_id: currentPiece.poi_id,
      title: currentPiece.identification.title,
      room_zone: currentPiece.identification.location_room || 'Sala',
      file: spontaneousDetour.pieceFile,
      estimated_minutes: currentPiece.estimated_minutes || 8,
      map_coords: { x: 50, y: 50 },
      ranking: currentPiece.is_premium ? 2 : 1,
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
    if (activeRoute.stops.some((s) => s.poi_id === newStop.poi_id)) return;

    const updatedRoute: SiteRoute = {
      ...activeRoute,
      stops: [...activeRoute.stops, newStop],
    };
    setActiveRoute(updatedRoute);
  };

  // Handle next stop button
  const handleNextStop = async () => {
    if (!activeRoute) return;
    const nextIdx = currentStopIndex + 1;
    if (nextIdx < activeRoute.stops.length) {
      setCurrentStopIndex(nextIdx);
      setSpontaneousDetour(null);
      await loadPieceData(activeRoute.stops[nextIdx].file);
    }
  };

  // Restart route
  const handleRestartRoute = async () => {
    if (!activeRoute || activeRoute.stops.length === 0) return;
    setCurrentStopIndex(0);
    setSpontaneousDetour(null);
    await loadPieceData(activeRoute.stops[0].file);
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
      className={`min-h-screen flex justify-center font-sans transition-colors duration-200 ${
        isSunMode ? 'bg-[#FAF8F5] text-[#1C1917]' : 'bg-[#141414] text-[#F5F5F4]'
      }`}
    >
      {/* Offline Banner indicator */}
      <OfflineIndicator />

      {/* Main mobile/tablet viewport container */}
      <div
        className={`w-full max-w-[480px] min-h-screen shadow-2xl relative flex flex-col transition-colors duration-200 border-x ${
          isSunMode
            ? 'bg-[#FAF8F5] border-stone-200/80 text-[#1C1917]'
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
            onCustomizeRoute={() => setViewMode('wizard')}
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
            />

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
              />
            ) : (
              <div className="p-8 text-center text-stone-500 text-sm">
                No se encontró información para esta pieza.
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
      </div>
    </div>
  );
}
