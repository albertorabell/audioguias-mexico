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
  Navigation,
  Palette,
  Shield,
  Crown,
  Paintbrush,
  Check,
  ChevronRight,
  Play,
} from 'lucide-react';
import { SiteManifest, SiteRoute, SiteSummary, RouteStop } from '../types';
import { generateOptimizedRoute } from '../utils/routeOptimizer';

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
  // Reset de scroll al inicio absoluto de la página
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);

  // Pregunta 1: Tiempo disponible
  // Chips: 30 min, 60 min (1h), 120 min (2h), Sin límite
  const [timeMinutes, setTimeMinutes] = useState<number>(60);

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
          subtitle: 'Ajuar de jadeíta de Pakal, máscaras funerarias y estelas de la selva',
        },
        {
          key: 'arte-monumental',
          label: 'Arte Monumental y Escultórico',
          icon: <Award className="w-4 h-4" />,
          subtitle: 'Cabezas olmecas colosales, monolitos sagrados y tallado en basalto',
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

  // Selección por defecto de las primeras dos temáticas
  const [selectedTags, setSelectedTags] = useState<string[]>(
    availableTags.slice(0, 2).map((t) => t.key)
  );

  // Pregunta 3: Estilo de visita
  const [pace, setPace] = useState<'highlights' | 'expert'>('highlights');

  // Modal / Acordeón para rutas clásicas predeterminadas
  const [showClassicRoutes, setShowClassicRoutes] = useState(false);

  // Toggle interés
  const handleToggleTag = (tagKey: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagKey)) {
        if (prev.length <= 1) return prev; // Mantener al menos una temática
        return prev.filter((k) => k !== tagKey);
      } else {
        return [...prev, tagKey];
      }
    });
  };

  // Cálculo en tiempo real de la ruta optimizada
  const projectedRoute = useMemo(() => {
    return generateOptimizedRoute(manifest, {
      timeLimitMinutes: timeMinutes,
      selectedInterestKeys: selectedTags,
      pace,
    });
  }, [manifest, timeMinutes, selectedTags, pace]);

  // Número de salas únicas
  const uniqueRoomsCount = useMemo(() => {
    const rooms = new Set(projectedRoute.stops.map((s) => s.room_zone || s.room_id));
    return rooms.size;
  }, [projectedRoute]);

  const handleConfirmStart = () => {
    onStartRoute(projectedRoute);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0B0E] text-[#F3F4F6] transition-colors duration-200 select-none">
      {/* Barra Superior Header */}
      <header className="sticky top-0 z-30 px-4 py-3 border-b border-white/10 flex items-center justify-between backdrop-blur-xl bg-[#0B0B0E]/95 shadow-md">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl border border-white/10 bg-[#141419] text-[#F3F4F6] hover:bg-white/5 transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#F59E0B]" />
          <span>Volver al explorador</span>
        </button>

        <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]">
          {site.short_name || 'MNA'}
        </span>
      </header>

      {/* Contenido Principal del Asistente */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 pt-5 pb-44 space-y-6">
        {/* Título de Bienvenida */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#F59E0B] uppercase tracking-widest mb-1">
            <Compass className="w-4 h-4" />
            <span>Curaduría Inteligente</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Diseña tu Recorrido en {site.short_name}
          </h1>
          <p className="text-xs sm:text-sm mt-1 text-[#9CA3AF] leading-relaxed">
            Configura tu tiempo disponible e intereses. El sistema ordenará las obras en una secuencia fluida sala por sala.
          </p>
        </div>

        {/* ================= PREGUNTA 1: TIEMPO DISPONIBLE (CHIPS TÁCTILES OSCUROS) ================= */}
        <section className="p-4 sm:p-5 rounded-3xl border border-white/10 bg-[#141419] shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 text-[#F59E0B]">
              <Clock className="w-4 h-4" />
              <span>1. ¿Cuánto tiempo tienes para tu visita?</span>
            </h2>
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#0B0B0E] border border-white/10 text-[#F59E0B]">
              {timeMinutes >= 900 ? 'Sin límite' : `${timeMinutes} min`}
            </span>
          </div>

          {/* Chips táctiles oscuros con borde fino que se iluminan en ámbar/oro */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { mins: 30, label: '30 min', badge: 'Rápida', desc: '8-10 obras cumbre · 2 salas' },
              { mins: 60, label: '1 hora', badge: 'Estándar', desc: '15-18 obras maestras · 3-4 salas' },
              { mins: 120, label: '2 horas', badge: 'Completa', desc: '25-35 obras arqueológicas' },
              { mins: 999, label: 'Sin límite', badge: 'Sin prisa', desc: 'Recorrido exhaustivo por el recinto' },
            ].map((opt) => {
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
                  <p className="text-[10px] leading-snug line-clamp-2 text-[#9CA3AF]">
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        {/* ================= PREGUNTA 2: ENFOQUE E INTERESES TEMÁTICOS ================= */}
        <section className="p-4 sm:p-5 rounded-3xl border border-white/10 bg-[#141419] shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 text-[#F59E0B]">
              <Compass className="w-4 h-4" />
              <span>2. Enfoque e intereses temáticos</span>
            </h2>
            <span className="text-[10px] font-mono text-[#F59E0B] px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
              {selectedTags.length} seleccionados
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
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 active:scale-[0.99] text-left cursor-pointer ${
                    isChecked
                      ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-white ring-1 ring-[#F59E0B]'
                      : 'bg-[#0B0B0E] border-white/10 hover:border-white/20 text-[#9CA3AF] hover:text-[#F3F4F6]'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 pr-3">
                    <div
                      className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                        isChecked ? 'bg-[#F59E0B] text-black' : 'bg-white/5 text-[#9CA3AF] border border-white/10'
                      }`}
                    >
                      {tag.icon}
                    </div>
                    <div className="min-w-0">
                      <span className={`font-bold text-xs sm:text-sm block ${isChecked ? 'text-white' : 'text-stone-300'}`}>
                        {tag.label}
                      </span>
                      <span className="text-[11px] block mt-0.5 line-clamp-1 text-[#9CA3AF]">
                        {tag.subtitle}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-lg shrink-0 flex items-center justify-center border transition-all ${
                      isChecked
                        ? 'bg-[#F59E0B] border-[#F59E0B] text-black'
                        : 'border-white/20 bg-[#0B0B0E]'
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
        <section className="p-4 sm:p-5 rounded-3xl border border-white/10 bg-[#141419] shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider flex items-center gap-2 text-[#F59E0B]">
              <Zap className="w-4 h-4" />
              <span>3. Estilo y ritmo de visita</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setPace('highlights')}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                pace === 'highlights'
                  ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-white ring-1 ring-[#F59E0B]'
                  : 'bg-[#0B0B0E] border-white/10 hover:border-white/20 text-[#9CA3AF] hover:text-[#F3F4F6]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-[#F59E0B]" />
                <span className="font-bold text-xs sm:text-sm text-white">
                  Directo a obras maestras (Highlights)
                </span>
              </div>
              <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                Foco en las piezas cumbre e iconografía imprescindible para optimizar cada minuto.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPace('expert')}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 active:scale-[0.98] cursor-pointer ${
                pace === 'expert'
                  ? 'bg-[#F59E0B]/15 border-[#F59E0B] text-white ring-1 ring-[#F59E0B]'
                  : 'bg-[#0B0B0E] border-white/10 hover:border-white/20 text-[#9CA3AF] hover:text-[#F3F4F6]'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-[#F59E0B]" />
                <span className="font-bold text-xs sm:text-sm text-white">
                  Paseo exhaustivo sala por sala
                </span>
              </div>
              <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                Inmersión profunda, detalles arqueológicos, mitos, contexto y lectura pausada.
              </p>
            </button>
          </div>
        </section>

        {/* ================= PROYECCIÓN EN TIEMPO REAL & BOTÓN CTA PRINCIPAL ================= */}
        <section className="p-4 sm:p-5 rounded-3xl border border-white/10 bg-[#141419] shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#F59E0B] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Resumen de Recorrido Personalizado
            </span>
            <span className="text-xs font-mono font-black text-[#F59E0B] px-2.5 py-0.5 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/30">
              ~{projectedRoute.duration}
            </span>
          </div>

          <div className="text-sm sm:text-base font-black tracking-tight text-white mb-3">
            Ruta estimada: ~{uniqueRoomsCount} {uniqueRoomsCount === 1 ? 'sala' : 'salas'} •{' '}
            {projectedRoute.stops.length} piezas clave • ~{projectedRoute.duration}
          </div>

          {/* Secuencia sugerida de paradas */}
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] block mb-2">
              Secuencia de paradas ({projectedRoute.stops.length} obras):
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1 scrollbar-none">
              {projectedRoute.stops.map((stop: RouteStop, idx: number) => (
                <div
                  key={stop.poi_id || idx}
                  className="p-2.5 rounded-xl border border-white/10 bg-[#0B0B0E] flex items-center gap-2.5 text-xs text-[#F3F4F6]"
                >
                  <span className="w-5 h-5 rounded-full bg-[#F59E0B] text-black font-black text-[10px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold block truncate text-white">{stop.title}</span>
                    <span className="text-[10px] text-[#9CA3AF] block truncate">
                      {stop.room_zone || 'Sala Mexica'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#F59E0B] shrink-0">
                    ~2 min
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ================= BOTÓN CTA PRINCIPAL EN EL RESUMEN ================= */}
          <div className="pt-4 mt-4 border-t border-white/10">
            <button
              id="btn-start-route-summary"
              type="button"
              onClick={handleConfirmStart}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Iniciar Recorrido ({projectedRoute.stops.length} paradas)</span>
            </button>
          </div>
        </section>

        {/* CATÁLOGO DE RUTAS CLÁSICAS PREDEFINIDAS */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setShowClassicRoutes(!showClassicRoutes)}
            className="text-xs font-semibold text-[#9CA3AF] hover:text-white underline underline-offset-4 transition-colors cursor-pointer"
          >
            {showClassicRoutes
              ? 'Ocultar catálogo de rutas temáticas'
              : '¿Prefieres una ruta predefinida del museo?'}
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
      </main>

      {/* ================= BOTÓN FIJO INFERIOR EN EL DOCK ================= */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 p-4 border-t border-white/10 bg-[#0B0B0E]/95 backdrop-blur-xl shadow-2xl">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            id="btn-start-route-fixed"
            type="button"
            onClick={handleConfirmStart}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm sm:text-base cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Iniciar Recorrido ({projectedRoute.stops.length} paradas)</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

export default RouteWizard;
