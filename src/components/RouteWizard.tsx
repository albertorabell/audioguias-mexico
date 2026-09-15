import React, { useState, useMemo } from 'react';
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
  Eye,
  Sun,
  Navigation,
  Palette,
  Shield,
  Crown,
  Paintbrush,
  Check,
  ChevronRight,
  ListFilter,
  Layers,
  MapPin,
} from 'lucide-react';
import { SiteManifest, SiteRoute, SiteSummary, RouteStop } from '../types';
import { useTheme } from '../utils/ThemeContext';
import { generateOptimizedRoute } from '../utils/routeOptimizer';
import { SafeImage } from './SafeImage';

interface RouteWizardProps {
  site: SiteSummary;
  manifest: SiteManifest;
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
  onBack,
  onStartRoute,
}) => {
  const { isSunMode } = useTheme();

  // Pregunta 1: Tiempo disponible
  // Opciones: "45 min (Relámpago)", "1h 30m (Esencial)", "3 horas (Completo)", "Sin límite"
  const [timeMinutes, setTimeMinutes] = useState<number>(90);

  // Pregunta 2: Enfoque e intereses temáticos
  const getSiteTags = (): InterestTag[] => {
    if (site.id === 'MNA') {
      return [
        {
          key: 'cosmogonia-mexica',
          label: 'Cosmogonía Mexica',
          icon: <Landmark className="w-4 h-4" />,
          subtitle: 'Piedra del Sol, Coatlicue y el poder solar de Tenochtitlan',
        },
        {
          key: 'mundo-maya',
          label: 'Mundo Maya',
          icon: <Sparkles className="w-4 h-4" />,
          subtitle: 'Ajuar de jadeíta real, máscaras sagradas y estelas de la selva',
        },
        {
          key: 'arte-monumental',
          label: 'Arte Monumental y Escultórico',
          icon: <Award className="w-4 h-4" />,
          subtitle: 'Cabezas olmecas, monolitos colosales y tallado en basalto',
        },
        {
          key: 'vida-cotidiana-tumbas',
          label: 'Vida Cotidiana y Tumbas',
          icon: <History className="w-4 h-4" />,
          subtitle: 'Urnas zapotecas, ofrendas mortuorias y orfebrería mixteca',
        },
      ];
    }
    if (site.id === 'TEOTIHUACAN') {
      return [
        {
          key: 'eje-piramides',
          label: 'Eje de las Pirámides',
          icon: <Sun className="w-4 h-4" />,
          subtitle: 'Pirámide del Sol, Pirámide de la Luna y Calzada de los Muertos',
        },
        {
          key: 'pintura-palacios',
          label: 'Pintura Mural y Palacios',
          icon: <Palette className="w-4 h-4" />,
          subtitle: 'Palacio de Quetzalpapálotl, patios porticados y pigmentos minerales',
        },
        {
          key: 'mitologia-dioses',
          label: 'Mitología y Dioses',
          icon: <Navigation className="w-4 h-4" />,
          subtitle: 'Templo de la Serpiente Emplumada, Tláloc y sacrificios de La Ciudadela',
        },
      ];
    }
    // Chapultepec
    return [
      {
        key: 'epoca-imperial',
        label: 'Época Imperial (Maximiliano)',
        icon: <Crown className="w-4 h-4" />,
        subtitle: 'Alcoba de Carlota, salones de gala, carruajes de oro y lujo europeo',
      },
      {
        key: 'independencia-revolucion',
        label: 'Independencia y Revolución',
        icon: <Shield className="w-4 h-4" />,
        subtitle: 'Carruaje de Juárez, defensa de 1847 y murales monumentales de Siqueiros',
      },
      {
        key: 'miradores-alcazar',
        label: 'Miradores y Alcázar',
        icon: <Paintbrush className="w-4 h-4" />,
        subtitle: 'Torre del Caballero Alto, jardines suspendidos y vistas 360° a Reforma',
      },
    ];
  };

  const availableTags = getSiteTags();

  // Default: select first 2-3 tags
  const [selectedTags, setSelectedTags] = useState<string[]>(
    availableTags.slice(0, 2).map((t) => t.key)
  );

  // Pregunta 3: Estilo de visita
  const [pace, setPace] = useState<'highlights' | 'expert'>('highlights');

  // Modal para ver rutas clásicas predeterminadas
  const [showClassicRoutes, setShowClassicRoutes] = useState(false);

  // Toggle interest
  const handleToggleTag = (tagKey: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagKey)) {
        if (prev.length <= 1) return prev; // Keep at least one tag
        return prev.filter((k) => k !== tagKey);
      } else {
        return [...prev, tagKey];
      }
    });
  };

  // Real-time calculation of projected route
  const projectedRoute = useMemo(() => {
    return generateOptimizedRoute(manifest, {
      timeLimitMinutes: timeMinutes,
      selectedInterestKeys: selectedTags,
      pace,
    });
  }, [manifest, timeMinutes, selectedTags, pace]);

  // Unique rooms visited
  const uniqueRoomsCount = useMemo(() => {
    const rooms = new Set(projectedRoute.stops.map((s) => s.room_zone || s.room_id));
    return rooms.size;
  }, [projectedRoute]);

  const handleConfirmStart = () => {
    onStartRoute(projectedRoute);
  };

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        isSunMode ? 'bg-[#F9F6F0] text-stone-900' : 'bg-stone-950 text-stone-100'
      }`}
    >
      {/* Top Header Bar */}
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
              ? 'bg-stone-200/80 border-stone-300 text-stone-800 hover:bg-stone-300'
              : 'bg-stone-900 border-stone-800 text-stone-200 hover:bg-stone-800'
          }`}
        >
          <ArrowLeft className="w-4 h-4 text-amber-500" />
          <span>Información del recinto</span>
        </button>

        <span
          className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
            isSunMode
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
          }`}
        >
          {site.short_name}
        </span>
      </header>

      {/* Main Content Form */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 pt-5 pb-44 space-y-6">
        {/* Header Title */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">
            <Compass className="w-4 h-4" />
            <span>Curaduría Personalizada</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Diseña tu Recorrido en {site.short_name}
          </h1>
          <p
            className={`text-xs sm:text-sm mt-1 leading-relaxed ${
              isSunMode ? 'text-stone-600' : 'text-stone-400'
            }`}
          >
            Configura tu tiempo, salas predilectas y ritmo de visita. Nuestro algoritmo ordenará las paradas en una secuencia espacial continua.
          </p>
        </div>

        {/* ================= PREGUNTA 1: TIEMPO DISPONIBLE ================= */}
        <section
          className={`p-4 sm:p-5 rounded-3xl border transition-all ${
            isSunMode ? 'bg-white border-stone-200 shadow-sm' : 'bg-stone-900/50 border-stone-800'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 text-amber-500">
              <Clock className="w-4 h-4" />
              <span>1. ¿Cuánto tiempo tienes para tu visita?</span>
            </h2>
            <span
              className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                isSunMode ? 'bg-stone-100 text-stone-700' : 'bg-stone-800 text-stone-300'
              }`}
            >
              {timeMinutes >= 900 ? 'Ilimitado' : `${timeMinutes} min`}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { mins: 45, label: '45 min', badge: 'Relámpago', desc: 'Directo a obras cumbres' },
              { mins: 90, label: '1h 30m', badge: 'Esencial', desc: 'El balance ideal recomendado' },
              { mins: 180, label: '3 horas', badge: 'Completo', desc: 'Recorrido exhaustivo y profundo' },
              { mins: 999, label: 'Sin límite', badge: 'Sin prisa', desc: 'Todas las obras y salas' },
            ].map((opt) => {
              const isSelected = timeMinutes === opt.mins;
              return (
                <button
                  key={opt.mins}
                  type="button"
                  onClick={() => setTimeMinutes(opt.mins)}
                  className={`p-3 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                    isSelected
                      ? isSunMode
                        ? 'bg-amber-50 border-amber-600 text-amber-950 ring-2 ring-amber-500 shadow-sm'
                        : 'bg-amber-950/40 border-amber-500 text-amber-100 ring-2 ring-amber-500 shadow-sm'
                      : isSunMode
                      ? 'bg-stone-50 border-stone-200 hover:border-stone-300 text-stone-800'
                      : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 text-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-sm">{opt.label}</span>
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-amber-500 text-black'
                          : isSunMode
                          ? 'bg-stone-200 text-stone-700'
                          : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      {opt.badge}
                    </span>
                  </div>
                  <p
                    className={`text-[10px] leading-snug line-clamp-2 ${
                      isSelected
                        ? isSunMode
                          ? 'text-amber-900 font-medium'
                          : 'text-amber-200/90 font-medium'
                        : isSunMode
                        ? 'text-stone-500'
                        : 'text-stone-400'
                    }`}
                  >
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* ================= PREGUNTA 2: ENFOQUE E INTERESES TEMÁTICOS ================= */}
        <section
          className={`p-4 sm:p-5 rounded-3xl border transition-all ${
            isSunMode ? 'bg-white border-stone-200 shadow-sm' : 'bg-stone-900/50 border-stone-800'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 text-amber-500">
              <Compass className="w-4 h-4" />
              <span>2. Enfoque e intereses temáticos</span>
            </h2>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                isSunMode ? 'text-stone-500' : 'text-stone-400'
              }`}
            >
              Multiselección ({selectedTags.length})
            </span>
          </div>

          <div className="space-y-2">
            {availableTags.map((tag) => {
              const isChecked = selectedTags.includes(tag.key);
              return (
                <button
                  key={tag.key}
                  type="button"
                  onClick={() => handleToggleTag(tag.key)}
                  className={`w-full flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all active:scale-[0.99] text-left ${
                    isChecked
                      ? isSunMode
                        ? 'bg-amber-50/90 border-amber-600 text-amber-950 ring-1 ring-amber-500'
                        : 'bg-amber-950/35 border-amber-500 text-amber-100 ring-1 ring-amber-500'
                      : isSunMode
                      ? 'bg-stone-50 border-stone-200 hover:border-stone-300 text-stone-700'
                      : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 text-stone-300'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 pr-3">
                    <div
                      className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        isChecked
                          ? 'bg-amber-500 text-black'
                          : isSunMode
                          ? 'bg-stone-200 text-stone-600'
                          : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      {tag.icon}
                    </div>
                    <div className="min-w-0">
                      <span className="font-extrabold text-xs sm:text-sm block">{tag.label}</span>
                      <span
                        className={`text-[11px] block mt-0.5 line-clamp-1 ${
                          isChecked
                            ? isSunMode
                              ? 'text-amber-900/90'
                              : 'text-amber-200/80'
                            : isSunMode
                            ? 'text-stone-500'
                            : 'text-stone-400'
                        }`}
                      >
                        {tag.subtitle}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-lg shrink-0 flex items-center justify-center border transition-all ${
                      isChecked
                        ? 'bg-amber-500 border-amber-500 text-black'
                        : isSunMode
                        ? 'border-stone-300 bg-white'
                        : 'border-stone-700 bg-stone-900'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ================= PREGUNTA 3: ESTILO DE VISITA ================= */}
        <section
          className={`p-4 sm:p-5 rounded-3xl border transition-all ${
            isSunMode ? 'bg-white border-stone-200 shadow-sm' : 'bg-stone-900/50 border-stone-800'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 text-amber-500">
              <Zap className="w-4 h-4" />
              <span>3. Estilo y ritmo de visita</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setPace('highlights')}
              className={`p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                pace === 'highlights'
                  ? isSunMode
                    ? 'bg-amber-50 border-amber-600 text-amber-950 ring-2 ring-amber-500 shadow-sm'
                    : 'bg-amber-950/40 border-amber-500 text-amber-100 ring-2 ring-amber-500 shadow-sm'
                  : isSunMode
                  ? 'bg-stone-50 border-stone-200 hover:border-stone-300 text-stone-700'
                  : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 text-stone-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-amber-500" />
                <span className="font-black text-xs sm:text-sm">
                  Directo a obras maestras (Top Highlights)
                </span>
              </div>
              <p
                className={`text-[11px] leading-relaxed ${
                  pace === 'highlights'
                    ? isSunMode
                      ? 'text-amber-900'
                      : 'text-amber-200'
                    : isSunMode
                    ? 'text-stone-500'
                    : 'text-stone-400'
                }`}
              >
                Foco en las piezas cumbre e iconografía imprescindible para optimizar al máximo cada minuto.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPace('expert')}
              className={`p-3.5 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                pace === 'expert'
                  ? isSunMode
                    ? 'bg-amber-50 border-amber-600 text-amber-950 ring-2 ring-amber-500 shadow-sm'
                    : 'bg-amber-950/40 border-amber-500 text-amber-100 ring-2 ring-amber-500 shadow-sm'
                  : isSunMode
                  ? 'bg-stone-50 border-stone-200 hover:border-stone-300 text-stone-700'
                  : 'bg-stone-950/60 border-stone-800 hover:border-stone-700 text-stone-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <span className="font-black text-xs sm:text-sm">
                  Paseo exhaustivo de sala por sala
                </span>
              </div>
              <p
                className={`text-[11px] leading-relaxed ${
                  pace === 'expert'
                    ? isSunMode
                      ? 'text-amber-900'
                      : 'text-amber-200'
                    : isSunMode
                    ? 'text-stone-500'
                    : 'text-stone-400'
                }`}
              >
                Inmersión profunda, detalles arqueológicos, mitos, piezas secundarias y lectura pausada.
              </p>
            </button>
          </div>
        </section>

        {/* ================= PROYECCIÓN EN TIEMPO REAL ================= */}
        <section
          className={`p-4 sm:p-5 rounded-3xl border shadow-md transition-all ${
            isSunMode
              ? 'bg-amber-50/80 border-amber-300 text-amber-950'
              : 'bg-gradient-to-br from-stone-900 to-amber-950/30 border-amber-500/40 text-stone-100'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Proyección Dinámica en Tiempo Real
            </span>
            <span className="text-xs font-mono font-extrabold text-amber-600 dark:text-amber-400">
              {projectedRoute.duration}
            </span>
          </div>

          <div className="text-sm sm:text-base font-black tracking-tight mb-3">
            Ruta estimada: ~{uniqueRoomsCount} {uniqueRoomsCount === 1 ? 'sala' : 'salas'} •{' '}
            {projectedRoute.stops.length} piezas clave • ~{projectedRoute.duration} de recorrido
          </div>

          {/* Secuencia sugerida de paradas */}
          <div className="space-y-1.5 pt-2 border-t border-amber-300/40 dark:border-amber-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 block mb-1">
              Secuencia sugerida de paradas ({projectedRoute.stops.length}):
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {projectedRoute.stops.map((stop: RouteStop, idx: number) => (
                <div
                  key={stop.poi_id}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs ${
                    isSunMode
                      ? 'bg-white/90 border-amber-200 text-stone-800'
                      : 'bg-stone-950/80 border-stone-800 text-stone-200'
                  }`}
                >
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-black font-black text-[10px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold block truncate">{stop.title}</span>
                    <span className="text-[10px] opacity-70 block truncate">{stop.room_zone}</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-80 shrink-0">
                    ~{stop.estimated_minutes || 8} min
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RUTAS CLÁSICAS DISCRETAS */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setShowClassicRoutes(!showClassicRoutes)}
            className={`text-xs font-semibold underline underline-offset-4 transition-colors ${
              isSunMode ? 'text-stone-600 hover:text-stone-900' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            {showClassicRoutes
              ? 'Ocultar catálogo de rutas clásicas'
              : '¿Prefieres una ruta clásica predefinida del recinto?'}
          </button>

          {showClassicRoutes && (
            <div className="mt-4 space-y-2 text-left animate-fadeIn">
              {manifest.routes.map((route) => (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => onStartRoute(route)}
                  className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all active:scale-[0.98] ${
                    isSunMode
                      ? 'bg-white border-stone-300 hover:border-amber-500'
                      : 'bg-stone-900 border-stone-800 hover:border-amber-500'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black">{route.name}</span>
                      <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                        {route.duration}
                      </span>
                    </div>
                    <p
                      className={`text-[11px] mt-0.5 line-clamp-1 ${
                        isSunMode ? 'text-stone-500' : 'text-stone-400'
                      }`}
                    >
                      {route.description}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-amber-500 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Fixed Bottom Confirmation Dock */}
      <footer
        className={`fixed bottom-0 left-0 right-0 z-40 p-4 border-t backdrop-blur-md transition-colors ${
          isSunMode
            ? 'bg-[#F9F6F0]/95 border-stone-300 shadow-2xl'
            : 'bg-stone-950/95 border-stone-800 shadow-2xl'
        }`}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={handleConfirmStart}
            className="flex-1 py-4 px-4 rounded-2xl font-black text-sm uppercase tracking-wider text-black bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 shadow-xl shadow-amber-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Compass className="w-5 h-5 text-black" />
            <span>Iniciar Recorrido Ahora 🧭</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
