import React, { useState } from 'react';
import {
  ArrowLeft,
  Compass,
  Clock,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Info,
  Building2,
  BookOpen,
  Route,
  CheckCircle2,
} from 'lucide-react';
import { SiteSummary, SiteManifest, SiteRoute } from '../types';
import { useTheme } from '../utils/ThemeContext';
import { SITE_OVERVIEWS, SitePhoto } from '../data/siteOverviews';
import { SafeImage } from './SafeImage';

interface SiteOverviewProps {
  site: SiteSummary;
  manifest: SiteManifest;
  onBack: () => void;
  onCustomizeRoute: () => void;
  onDirectStartRoute: (route: SiteRoute) => void;
}

export const SiteOverview: React.FC<SiteOverviewProps> = ({
  site,
  manifest,
  onBack,
  onCustomizeRoute,
  onDirectStartRoute,
}) => {
  const { isSunMode } = useTheme();
  const overviewData = SITE_OVERVIEWS[site.id] || SITE_OVERVIEWS.MNA;
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [showPredefinedRoutes, setShowPredefinedRoutes] = useState(false);

  const photos: SitePhoto[] = overviewData.photos.length > 0 ? overviewData.photos : [
    {
      url: site.thumbnail,
      title: site.name,
      caption: site.description,
    },
  ];

  const currentPhoto = photos[activePhotoIndex] || photos[0];

  const handlePrevPhoto = () => {
    setActivePhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = () => {
    setActivePhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        isSunMode ? 'bg-[#FAF8F5] text-[#111827]' : 'bg-stone-950 text-stone-100'
      }`}
    >
      {/* Sticky Top Bar */}
      <header
        className={`sticky top-0 z-30 px-4 py-3 border-b flex items-center justify-between backdrop-blur-md transition-colors ${
          isSunMode
            ? 'bg-[#F9F6F0]/95 border-stone-300 shadow-sm'
            : 'bg-stone-950/95 border-stone-800 shadow-md'
        }`}
      >
        <button
          type="button"
          onClick={onBack}
          className={`flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all active:scale-95 ${
            isSunMode
              ? 'bg-stone-200/80 border-stone-300 text-[#111827] hover:bg-stone-300'
              : 'bg-stone-900 border-stone-800 text-stone-200 hover:bg-stone-800'
          }`}
        >
          <ArrowLeft className="w-4 h-4 text-amber-500" />
          <span>Recintos</span>
        </button>

        <span
          className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
            isSunMode
              ? 'bg-amber-100/90 text-amber-900 border-amber-300'
              : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
          }`}
        >
          {overviewData.shortName}
        </span>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-4 pb-28">
        {/* ================= HERO GALLERY CAROUSEL ================= */}
        <section className="relative rounded-3xl overflow-hidden border shadow-xl mb-6 select-none">
          <div
            className={`relative w-full aspect-[16/10] sm:aspect-[16/9] ${
              isSunMode ? 'bg-stone-200' : 'bg-stone-900'
            }`}
          >
            <SafeImage
              src={currentPhoto.url}
              alt={currentPhoto.title}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

            {/* Carousel Navigation Buttons */}
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevPhoto}
                  aria-label="Foto anterior"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-transform active:scale-90 border border-white/20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextPhoto}
                  aria-label="Foto siguiente"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-sm transition-transform active:scale-90 border border-white/20"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Photo Caption Pill */}
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold tracking-wide uppercase text-amber-300 drop-shadow-sm flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {currentPhoto.title}
                </span>
                <span className="text-[10px] font-mono bg-black/50 px-2 py-0.5 rounded-full border border-white/10">
                  {activePhotoIndex + 1} / {photos.length}
                </span>
              </div>
              <p className="text-xs text-stone-200 line-clamp-2 drop-shadow-sm">
                {currentPhoto.caption}
              </p>

              {/* Dots indicator */}
              <div className="flex justify-center gap-1.5 mt-2">
                {photos.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActivePhotoIndex(idx)}
                    aria-label={`Ir a foto ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === activePhotoIndex
                        ? 'w-6 bg-amber-400'
                        : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ================= TITLE & TAGLINE ================= */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border ${
                isSunMode
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-amber-950/50 text-amber-300 border-amber-800/60'
              }`}
            >
              {site.badge || 'Recinto Emblemático'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight mb-2 text-[#111827] dark:text-stone-100">
            {overviewData.officialTitle}
          </h1>
          <p
            className={`text-sm sm:text-base leading-relaxed ${
              isSunMode ? 'text-[#4B5563]' : 'text-stone-400'
            }`}
          >
            {overviewData.tagline}
          </p>
        </div>

        {/* ================= KEY DATA BADGES GRID ================= */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {overviewData.keyFacts.map((fact, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border transition-all ${
                isSunMode
                  ? 'bg-stone-50 border-stone-200 shadow-sm'
                  : 'bg-stone-900/60 border-stone-800'
              }`}
            >
              <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                {idx === 0 && <Clock className="w-3.5 h-3.5" />}
                {idx === 1 && <Layers className="w-3.5 h-3.5" />}
                {idx === 2 && <Calendar className="w-3.5 h-3.5" />}
                {idx === 3 && <Sparkles className="w-3.5 h-3.5" />}
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isSunMode ? 'text-[#4B5563]' : 'text-stone-500'}`}>
                  {fact.label}
                </span>
              </div>
              <p className="text-sm font-extrabold tracking-tight text-[#111827] dark:text-stone-100">{fact.value}</p>
              {fact.subtext && (
                <p
                  className={`text-[10px] mt-0.5 ${
                    isSunMode ? 'text-[#4B5563]' : 'text-stone-400'
                  }`}
                >
                  {fact.subtext}
                </p>
              )}
            </div>
          ))}
        </section>

        {/* ================= PRACTICAL INFO BOX ================= */}
        <section
          className={`p-4 rounded-2xl border mb-6 text-xs flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between ${
            isSunMode
              ? 'bg-amber-50/70 border-amber-200/80 text-[#111827]'
              : 'bg-amber-950/25 border-amber-800/40 text-amber-200'
          }`}
        >
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Ubicación y Acceso:</span>
              <span className="opacity-90">{overviewData.location}</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5 border-t sm:border-t-0 sm:border-l pt-2 sm:pt-0 sm:pl-3 border-amber-300/40">
            <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Horario de Visita:</span>
              <span className="opacity-90">{overviewData.schedule}</span>
            </div>
          </div>
        </section>

        {/* ================= EVOCATIVE NARRATIVE (2-3 PARAGRAPHS) ================= */}
        <section
          className={`p-5 sm:p-6 rounded-3xl border mb-6 ${
            isSunMode
              ? 'bg-white border-stone-200 shadow-sm'
              : 'bg-stone-900/50 border-stone-800'
          }`}
        >
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-black uppercase tracking-wider text-[#111827] dark:text-stone-100">
              Importancia Histórica y Arquitectónica
            </h2>
          </div>

          <div
            className={`space-y-3.5 text-xs sm:text-sm leading-relaxed text-justify ${
              isSunMode ? 'text-[#111827]' : 'text-stone-300'
            }`}
          >
            {overviewData.narrativeParagraphs.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>

          {/* Architectural features list */}
          {overviewData.architecturalHighlights.length > 0 && (
            <div className="mt-5 pt-4 border-t border-stone-200 dark:border-stone-800">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-500 mb-3 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Hitos Espaciales del Recinto
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {overviewData.architecturalHighlights.map((arch, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border text-xs ${
                      isSunMode
                        ? 'bg-stone-50 border-stone-200'
                        : 'bg-stone-950/60 border-stone-800/80'
                    }`}
                  >
                    <span className="font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
                      {arch.title}
                    </span>
                    <p
                      className={`text-[11px] leading-snug ${
                        isSunMode ? 'text-[#4B5563]' : 'text-stone-400'
                      }`}
                    >
                      {arch.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ================= SALAS CATALOGADAS PREVIEW ================= */}
        {manifest.rooms && manifest.rooms.length > 0 && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-black uppercase tracking-wider text-[#4B5563] dark:text-stone-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                Salas y Espacios Principales ({manifest.rooms.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {manifest.rooms.map((room: any) => {
                const piecesCount = room.pieces_info?.length || room.featured_pieces?.length || 0;
                const roomId = room.room_id || room.id;
                const roomName = room.nombre_oficial || room.name || roomId;
                const roomDesc = room.frase_gancho || room.short_description || room.introduccion_narrativa;
                return (
                  <div
                    key={roomId}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isSunMode
                        ? 'bg-stone-50 border-stone-200 hover:border-amber-400'
                        : 'bg-stone-900/40 border-stone-800 hover:border-amber-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-xs font-bold text-[#111827] dark:text-stone-100">{roomName}</h3>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${
                          isSunMode
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-amber-950/60 text-amber-300 border-amber-800'
                        }`}
                      >
                        {piecesCount} {piecesCount === 1 ? 'obra' : 'obras'}
                      </span>
                    </div>
                    {roomDesc && (
                      <p
                        className={`text-[11px] line-clamp-2 leading-relaxed ${
                          isSunMode ? 'text-[#4B5563]' : 'text-stone-400'
                        }`}
                      >
                        {roomDesc}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ================= OPTIONAL PREDEFINED ROUTES EXPANDER ================= */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowPredefinedRoutes(!showPredefinedRoutes)}
            className={`w-full text-xs font-bold py-2.5 px-4 rounded-xl border flex items-center justify-between transition-colors ${
              isSunMode
                ? 'bg-stone-100 border-stone-300 text-[#111827] hover:bg-stone-200'
                : 'bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Route className="w-4 h-4 text-amber-500" />
              <span>O ver rutas clásicas predeterminadas ({manifest.routes.length})</span>
            </div>
            <span className="text-[11px] text-amber-500 underline font-extrabold">
              {showPredefinedRoutes ? 'Ocultar' : 'Explorar'}
            </span>
          </button>

          {showPredefinedRoutes && (
            <div className="mt-3 space-y-2.5 animate-fadeIn">
              {manifest.routes.map((route) => (
                <div
                  key={route.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                    isSunMode
                      ? 'bg-white border-stone-200 shadow-sm'
                      : 'bg-stone-900/70 border-stone-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#111827] dark:text-stone-100">{route.name}</span>
                      <span className="text-[10px] font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded font-bold">
                        {route.duration}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] mt-0.5 ${
                        isSunMode ? 'text-[#4B5563]' : 'text-stone-400'
                      }`}
                    >
                      {route.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDirectStartRoute(route)}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow transition-transform active:scale-95"
                  >
                    Iniciar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ================= FIXED BOTTOM ACTION BAR ================= */}
      <footer
        className={`fixed bottom-0 left-0 right-0 z-30 p-4 border-t backdrop-blur-md transition-colors ${
          isSunMode
            ? 'bg-[#F9F6F0]/95 border-stone-300 shadow-lg'
            : 'bg-stone-950/95 border-stone-800 shadow-2xl'
        }`}
      >
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={onCustomizeRoute}
            className="flex-1 py-3.5 px-4 rounded-2xl font-black text-sm text-black bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5"
          >
            <Compass className="w-5 h-5 text-stone-950 animate-pulse" />
            <span>Personalizar mi Recorrido 🧭</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
