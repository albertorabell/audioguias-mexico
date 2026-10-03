import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  Sparkles,
  Zap,
  BookOpen,
  Award,
  Landmark,
  Compass,
  History,
  Sun,
  Palette,
  Check,
  ChevronRight,
  Play,
  Layers,
  Star,
} from 'lucide-react';
import { SiteManifest, SiteRoute, SiteSummary, RouteStop, Room, PieceData } from '../types';
import { generateOptimizedRoute, calculateRouteTimeMinutes, formatRouteDuration, MANDATORY_MNA_PIECE_ID } from '../utils/routeOptimizer';
import { useStrings } from '../utils/LanguageContext';

interface RouteWizardProps {
  site: SiteSummary;
  manifest: SiteManifest;
  rooms?: Room[];
  pieces?: PieceData[];
  onBack: () => void;
  onStartRoute: (route: SiteRoute) => void;
}

interface InterestTag {
  key: string;
  label: string;
  icon: React.ReactNode;
  subtitle: string;
}

export const RouteWizard: React.FC<RouteWizardProps> = ({
  site,
  manifest,
  rooms = [],
  pieces = [],
  onBack,
  onStartRoute,
}) => {
  const strings = useStrings();
  const t = strings.wizard;
  // Reset scroll to top
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // Question 1: Time Available (30, 60, 120, 999)
  const [timeMinutes, setTimeMinutes] = useState<number>(60);

  // Question 2: Thematic Interests
  const getSiteTags = (): InterestTag[] => {
    return [
      {
        key: 'cosmogonia-mexica',
        label: t.tags['cosmogonia-mexica'].label,
        icon: <Landmark className="w-4 h-4" />,
        subtitle: t.tags['cosmogonia-mexica'].subtitle,
      },
      {
        key: 'mundo-maya',
        label: t.tags['mundo-maya'].label,
        icon: <Sparkles className="w-4 h-4" />,
        subtitle: t.tags['mundo-maya'].subtitle,
      },
      {
        key: 'arte-monumental',
        label: t.tags['arte-monumental'].label,
        icon: <Award className="w-4 h-4" />,
        subtitle: t.tags['arte-monumental'].subtitle,
      },
      {
        key: 'vida-cotidiana-tumbas',
        label: t.tags['vida-cotidiana-tumbas'].label,
        icon: <History className="w-4 h-4" />,
        subtitle: t.tags['vida-cotidiana-tumbas'].subtitle,
      },
    ];
  };

  const availableTags = getSiteTags();

  // Default selection: first two tags
  const [selectedTags, setSelectedTags] = useState<string[]>(
    availableTags.slice(0, 2).map((t) => t.key)
  );

  // Question 3: Pace
  const [pace, setPace] = useState<'highlights' | 'expert'>('highlights');

  // Accordion for classic predefined routes from manifest
  const [showClassicRoutes, setShowClassicRoutes] = useState(false);

  // Toggle interest
  const handleToggleTag = (tagKey: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagKey)) {
        if (prev.length <= 1) return prev;
        return prev.filter((k) => k !== tagKey);
      } else {
        return [...prev, tagKey];
      }
    });
  };

  // Real-time calculation of optimized route using pieces.json and rooms.json
  const projectedRoute = useMemo(() => {
    const piecesPool = pieces && pieces.length > 0 ? pieces : (manifest?.rooms ? manifest : []);
    return generateOptimizedRoute(
      piecesPool,
      {
        timeLimitMinutes: timeMinutes,
        selectedInterestKeys: selectedTags,
        pace,
      },
      rooms
    );
  }, [pieces, rooms, manifest, timeMinutes, selectedTags, pace]);

  // Unique rooms count in route
  const uniqueRoomsCount = useMemo(() => {
    const rSet = new Set(projectedRoute.stops.map((s) => s.room_id || s.room_zone));
    return rSet.size;
  }, [projectedRoute]);

  // Unified route duration
  const routeMinutes = useMemo(() => {
    return calculateRouteTimeMinutes(projectedRoute.stops, pace === 'expert');
  }, [projectedRoute.stops, pace]);

  const hasStops = projectedRoute.stops.length > 0;

  const handleConfirmStart = () => {
    if (hasStops) {
      onStartRoute(projectedRoute);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0B0E] text-[#F3F4F6] transition-colors duration-200 select-none">
      {/* Top Header */}
      <header className="sticky top-0 z-30 px-4 py-3 border-b border-white/10 flex items-center justify-between backdrop-blur-xl bg-[#0B0B0E]/95 shadow-md">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border border-white/10 bg-[#141419] text-[#F3F4F6] hover:bg-white/5 transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#F59E0B]" />
          <span>{t.back}</span>
        </button>

        <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]">
          {site.short_name || 'MNA'}
        </span>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 pt-5 pb-36 space-y-6">
        {/* Welcome Header */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#F59E0B] uppercase tracking-widest mb-1">
            <Compass className="w-4 h-4" />
            <span>{t.kicker}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {t.title(site.short_name || t.defaultSite)}
          </h1>
          <p className="text-xs sm:text-sm mt-1 text-[#9CA3AF] leading-relaxed">
            {t.intro}
          </p>
        </div>

        {/* ================= AVISO DESTACADO: PIEDRA DEL SOL FORZADA ================= */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-[#F59E0B] flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 fill-current" />
          </div>
          <div className="text-xs leading-snug">
            <span className="font-extrabold text-amber-400 block">
              {t.sunStoneTitle}
            </span>
            <span className="text-stone-300 text-[11px]">
              {t.sunStoneDesc}
            </span>
          </div>
        </div>

        {/* ================= PREGUNTA 1: TIEMPO DISPONIBLE ================= */}
        <section className="p-4 sm:p-5 rounded-3xl border border-white/10 bg-[#141419] shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 text-[#F59E0B]">
              <Clock className="w-4 h-4" />
              <span>{t.q1}</span>
            </h2>
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#0B0B0E] border border-white/10 text-[#F59E0B]">
              {timeMinutes >= 900 ? t.unlimited : t.minutes(timeMinutes)}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {t.timeOptions.map((opt) => {
              const isSelected = timeMinutes === opt.mins;
              return (
                <button
                  key={opt.mins}
                  type="button"
                  onClick={() => setTimeMinutes(opt.mins)}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                    isSelected
                      ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-white ring-1 ring-[#F59E0B] shadow-lg shadow-[#F59E0B]/15'
                      : 'bg-[#0B0B0E] border-white/10 hover:border-white/20 text-[#9CA3AF] hover:text-[#F3F4F6]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`font-black text-sm ${isSelected ? 'text-[#F59E0B]' : 'text-white'}`}>
                      {opt.label}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-[#F59E0B] text-black font-extrabold'
                          : 'bg-white/5 border border-white/10 text-[#9CA3AF]'
                      }`}
                    >
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-[11px] leading-tight text-[#9CA3AF]">{opt.desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* ================= PREGUNTA 2: ENFOQUE E INTERESES TEMÁTICOS ================= */}
        <section className="p-4 sm:p-5 rounded-3xl border border-white/10 bg-[#141419] shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 text-[#F59E0B]">
              <Sparkles className="w-4 h-4" />
              <span>{t.q2}</span>
            </h2>
            <span className="text-[10px] text-[#9CA3AF]">
              {t.selected(selectedTags.length)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {availableTags.map((tag) => {
              const isSelected = selectedTags.includes(tag.key);
              return (
                <button
                  key={tag.key}
                  type="button"
                  onClick={() => handleToggleTag(tag.key)}
                  className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                    isSelected
                      ? 'bg-[#F59E0B]/10 border-[#F59E0B] text-white shadow-md'
                      : 'bg-[#0B0B0E] border-white/10 hover:border-white/20 text-[#9CA3AF]'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-[#F59E0B] text-black'
                        : 'bg-white/5 text-[#9CA3AF] border border-white/10'
                    }`}
                  >
                    {tag.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-[#D1D5DB]'}`}>
                        {tag.label}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#F59E0B] stroke-[3]" />}
                    </div>
                    <p className="text-[11px] text-[#9CA3AF] mt-0.5 leading-snug line-clamp-2">
                      {tag.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ================= RESUMEN DE LA RUTA PROYECTADA ================= */}
        <section className="p-4 sm:p-5 rounded-3xl border border-white/10 bg-[#141419] shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Check className="w-4 h-4 stroke-[3]" />
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white">
                  {t.readyTitle}
                </h3>
                <p className="text-[11px] text-[#9CA3AF]">
                  {t.readySummary(projectedRoute.stops.length, uniqueRoomsCount, formatRouteDuration(routeMinutes))}
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-amber-400 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
              ~{formatRouteDuration(routeMinutes)}
            </span>
          </div>

          {/* Secuencia resumida de paradas */}
          <div className="max-h-56 overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
            {projectedRoute.stops.map((stop, idx) => (
              <div
                key={stop.poi_id || idx}
                className="p-2.5 rounded-xl border border-white/5 bg-[#0B0B0E] flex items-center gap-2.5 text-xs text-[#F3F4F6]"
              >
                <span className="w-5 h-5 rounded-full bg-[#F59E0B] text-black font-black text-[10px] flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="font-bold block truncate text-white">{stop.title}</span>
                  <span className="text-[10px] text-[#9CA3AF] block truncate">
                    {stop.room_zone}
                  </span>
                </div>
                {stop.poi_id === MANDATORY_MNA_PIECE_ID && (
                  <span className="text-[9px] font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 shrink-0">
                    {t.mustSee}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Catálogo de rutas temáticas predefinidas de mna.json */}
        {manifest?.routes && manifest.routes.length > 0 && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setShowClassicRoutes(!showClassicRoutes)}
              className="text-xs font-semibold text-[#9CA3AF] hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
            >
              {showClassicRoutes ? t.hideSuggested : t.showSuggested}
            </button>

            {showClassicRoutes && (
              <div className="mt-4 space-y-2 text-left animate-fadeIn">
                {manifest.routes.map((route) => (
                  <button
                    key={route.id}
                    type="button"
                    onClick={() => onStartRoute(route)}
                    className="w-full p-3.5 rounded-2xl border border-white/10 bg-[#141419] hover:border-[#F59E0B]/50 hover:bg-[#1A1A22] flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer text-left"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{route.name}</span>
                        <span className="text-[10px] font-bold text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded border border-[#F59E0B]/30">
                          {route.duration}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#9CA3AF] mt-0.5 line-clamp-1">
                        {route.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#F59E0B] shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ================= BOTÓN FIJO INFERIOR CON CLEARANCE ================= */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 p-4 border-t border-white/10 bg-[#0B0B0E]/95 backdrop-blur-xl shadow-2xl">
        <div className="max-w-3xl mx-auto">
          <button
            id="btn-start-route-fixed"
            type="button"
            disabled={!hasStops}
            onClick={handleConfirmStart}
            className={`w-full py-3.5 px-6 rounded-2xl font-extrabold text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-lg ${
              hasStops
                ? 'bg-[#F59E0B] hover:bg-amber-400 text-black shadow-amber-500/25 active:scale-[0.98] cursor-pointer'
                : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-white/5'
            }`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>
              {hasStops
                ? t.startTour(projectedRoute.stops.length, formatRouteDuration(routeMinutes))
                : t.pickOne}
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default RouteWizard;
