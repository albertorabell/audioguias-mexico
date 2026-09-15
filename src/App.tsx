import React, { useState, useEffect, useCallback } from 'react';
import { SiteSummary, SiteManifest, SiteRoute, PieceData, SiteLicense } from './types';
import { getSiteLicense, activatePass, revokePass, hasActivePass } from './utils/license';
import { SiteSelector } from './components/SiteSelector';
import { Navbar } from './components/Navbar';
import { PieceView } from './components/PieceView';
import { BottomNav } from './components/BottomNav';
import { RouteModal } from './components/RouteModal';
import { PaywallModal } from './components/PaywallModal';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  // Navigation State
  const [sites, setSites] = useState<SiteSummary[]>([]);
  const [selectedSite, setSelectedSite] = useState<SiteSummary | null>(null);
  const [manifest, setManifest] = useState<SiteManifest | null>(null);
  const [activeRoute, setActiveRoute] = useState<SiteRoute | null>(null);
  const [currentStopIndex, setCurrentStopIndex] = useState<number>(0);
  const [currentPiece, setCurrentPiece] = useState<PieceData | null>(null);

  // License State
  const [currentLicense, setCurrentLicense] = useState<SiteLicense | null>(null);

  // Modal State
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [isPaywallModalOpen, setIsPaywallModalOpen] = useState(false);

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

  // 2. When a site is selected, load its manifest
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

      // Default to first route and first stop
      if (manifestData.routes && manifestData.routes.length > 0) {
        const initialRoute = manifestData.routes[0];
        setActiveRoute(initialRoute);
        setCurrentStopIndex(0);

        if (initialRoute.stops && initialRoute.stops.length > 0) {
          await loadPieceData(initialRoute.stops[0].file);
        }
      }
    } catch (err) {
      console.error('Error loading site manifest:', err);
      setErrorMessage('No se pudo cargar el recorrido de este sitio.');
    } finally {
      setIsLoadingPiece(false);
    }
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

  // Handle route change
  const handleSelectRoute = async (routeId: string) => {
    if (!manifest) return;
    const foundRoute = manifest.routes.find((r) => r.id === routeId);
    if (foundRoute) {
      setActiveRoute(foundRoute);
      setCurrentStopIndex(0);
      if (foundRoute.stops.length > 0) {
        await loadPieceData(foundRoute.stops[0].file);
      }
    }
  };

  // Handle selecting a specific stop in modal
  const handleSelectStop = async (stopIndex: number) => {
    if (!activeRoute || stopIndex < 0 || stopIndex >= activeRoute.stops.length) return;
    setCurrentStopIndex(stopIndex);
    await loadPieceData(activeRoute.stops[stopIndex].file);
  };

  // Handle next stop button
  const handleNextStop = async () => {
    if (!activeRoute) return;
    const nextIdx = currentStopIndex + 1;
    if (nextIdx < activeRoute.stops.length) {
      setCurrentStopIndex(nextIdx);
      await loadPieceData(activeRoute.stops[nextIdx].file);
    }
  };

  // Restart route
  const handleRestartRoute = async () => {
    if (!activeRoute || activeRoute.stops.length === 0) return;
    setCurrentStopIndex(0);
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

  return (
    <div className="min-h-screen bg-stone-950 flex justify-center text-stone-100 font-sans">
      {/* Offline Banner indicator */}
      <OfflineIndicator />

      {/* Main mobile viewport container (max-w-[480px] centered) */}
      <div className="w-full max-w-[480px] min-h-screen bg-stone-950 border-x border-stone-800/80 shadow-2xl relative flex flex-col">
        {/* Error message alert if any */}
        {errorMessage && (
          <div className="p-3 m-3 rounded-xl bg-rose-950/80 border border-rose-800 text-xs text-rose-200 flex justify-between items-center">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-stone-400 hover:text-white text-sm font-bold ml-2"
            >
              ✕
            </button>
          </div>
        )}

        {/* View 1: Site Selector (Home screen) */}
        {!selectedSite ? (
          <SiteSelector
            sites={sites}
            onSelectSite={handleSelectSite}
            isLoading={isLoadingSites}
          />
        ) : (
          /* View 2: Sala / Route Tour view */
          <div className="flex-1 flex flex-col relative">
            {/* Top Navbar */}
            <Navbar
              onBack={handleBackToSites}
              activeRoute={activeRoute}
              currentStopIndex={currentStopIndex}
              totalStops={activeRoute ? activeRoute.stops.length : 0}
              hasPass={hasPass}
              passExpiresAt={currentLicense?.expires_at}
              onOpenRouteModal={() => setIsRouteModalOpen(true)}
              onOpenPaywallModal={() => setIsPaywallModalOpen(true)}
            />

            {/* Content loading state */}
            {isLoadingPiece ? (
              <div className="p-6 space-y-4">
                <div className="w-full h-64 rounded-2xl bg-stone-900 animate-pulse" />
                <div className="h-6 w-3/4 bg-stone-900 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-stone-900 rounded animate-pulse" />
                <div className="h-32 rounded-2xl bg-stone-900 animate-pulse" />
              </div>
            ) : currentPiece ? (
              /* Dynamic Piece View */
              <PieceView
                piece={currentPiece}
                hasPass={hasPass}
                passPriceMxn={manifest ? manifest.pass_price_mxn : 79}
                onOpenPaywall={() => setIsPaywallModalOpen(true)}
              />
            ) : (
              <div className="p-8 text-center text-stone-400 text-sm">
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
                onOpenRouteModal={() => setIsRouteModalOpen(true)}
              />
            )}
          </div>
        )}

        {/* Route Selector Modal */}
        {manifest && (
          <RouteModal
            isOpen={isRouteModalOpen}
            onClose={() => setIsRouteModalOpen(false)}
            routes={manifest.routes}
            activeRouteId={activeRoute ? activeRoute.id : ''}
            onSelectRoute={handleSelectRoute}
            onSelectStop={handleSelectStop}
            currentStopIndex={currentStopIndex}
          />
        )}

        {/* Paywall Modal */}
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
      </div>
    </div>
  );
}
