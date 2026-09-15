import React, { useState } from 'react';
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
} from 'lucide-react';
import { SiteManifest, SiteRoute, SiteSummary } from '../types';
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
}

export const RouteWizard: React.FC<RouteWizardProps> = ({
  site,
  manifest,
  onBack,
  onStartRoute,
}) => {
  const { isSunMode } = useTheme();

  // Step 1: Available time (in minutes)
  const [timeMinutes, setTimeMinutes] = useState<number>(60);

  // Step 2: Selected interests (multiselect)
  const getSiteTags = (): InterestTag[] => {
    if (site.id === 'MNA') {
      return [
        { key: 'mexica', label: 'Mexica / Tenochtitlan', icon: <Landmark className="w-4 h-4" /> },
        { key: 'maya', label: 'Mundo Maya', icon: <Sparkles className="w-4 h-4" /> },
        { key: 'origenes', label: 'Orígenes / Olmeca', icon: <History className="w-4 h-4" /> },
        { key: 'monumental', label: 'Obras Maestras Monumentales', icon: <Award className="w-4 h-4" /> },
        { key: 'misticismo', label: 'Misticismo y Dioses', icon: <Eye className="w-4 h-4" /> },
      ];
    }
    if (site.id === 'TEOTIHUACAN') {
      return [
        { key: 'piramides', label: 'Pirámides y Astronomía', icon: <Sun className="w-4 h-4" /> },
        { key: 'calzada', label: 'Calzada de los Muertos', icon: <Navigation className="w-4 h-4" /> },
        { key: 'murales', label: 'Murales y Sacerdotes', icon: <Palette className="w-4 h-4" /> },
      ];
    }
    // Chapultepec
    return [
      { key: 'alcazar', label: 'Alcázar Imperial', icon: <Crown className="w-4 h-4" /> },
      { key: 'carruajes', label: 'Carruajes y Batallas', icon: <Shield className="w-4 h-4" /> },
      { key: 'muralismo', label: 'Muralismo Mexicano', icon: <Paintbrush className="w-4 h-4" /> },
    ];
  };

  const availableTags = getSiteTags();

  // Default: select first 3 tags or all
  const [selectedTags, setSelectedTags] = useState<string[]>(
    availableTags.slice(0, 3).map((t) => t.key)
  );

  // Step 3: Pace
  const [pace, setPace] = useState<'highlights' | 'expert'>('highlights');

  // Secondary view: Classic routes picker
  const [showClassicRoutes, setShowClassicRoutes] = useState(false);

  // Toggle interest tag selection
  const handleToggleTag = (tagKey: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tagKey)) {
        if (prev.length <= 1) return prev; // Keep at least one selected
        return prev.filter((k) => k !== tagKey);
      } else {
        return [...prev, tagKey];
      }
    });
  };

  // Generate and start optimal route
  const handleGenerateOptimalRoute = () => {
    const optimalRoute = generateOptimizedRoute(manifest, {
      timeLimitMinutes: timeMinutes,
      selectedInterestKeys: selectedTags,
      pace,
    });
    onStartRoute(optimalRoute);
  };

  return (
    <div
      className={`flex-1 flex flex-col transition-colors duration-200 ${
        isSunMode ? 'bg-[#F9F6F0] text-stone-900' : 'bg-stone-950 text-stone-100'
      }`}
    >
      {/* Top Header Bar */}
      <header
        className={`sticky top-0 z-20 px-4 py-3 border-b flex items-center justify-between backdrop-blur-md transition-colors ${
          isSunMode
            ? 'bg-[#F9F6F0]/95 border-stone-300 shadow-sm'
            : 'bg-stone-950/95 border-stone-800 shadow-md'
        }`}
      >
        <button
          onClick={onBack}
          className={`flex items-center gap-2 text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-all active:scale-95 ${
            isSunMode
              ? 'bg-stone-200/80 border-stone-300 text-stone-800 hover:bg-stone-300'
              : 'bg-stone-900 border-stone-800 text-stone-200 hover:bg-stone-800'
          }`}
        >
          <ArrowLeft className="w-4 h-4 text-amber-500" />
          <span>Cambiar recinto</span>
        </button>

        <span
          className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
            isSunMode
              ? 'bg-amber-100/70 border-amber-300 text-amber-900'
              : 'bg-amber-950/60 border-amber-800 text-amber-300'
          }`}
        >
          {site.short_name}
        </span>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 pb-28">
        {/* Recinto Hero Brief */}
        <div
          className={`relative rounded-2xl overflow-hidden border p-4 shadow-sm ${
            isSunMode
              ? 'bg-white border-stone-200/90'
              : 'bg-stone-900/70 border-stone-800'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-stone-400/20 shadow-inner">
              <SafeImage
                src={site.thumbnail}
                alt={site.name}
                className="w-full h-full object-cover"
                fallbackCategory="site"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-500 mb-0.5">
                <Sparkles className="w-3 h-3" /> Asistente Inteligente
              </span>
              <h1 className="text-base font-black leading-snug line-clamp-1">{site.name}</h1>
              <p
                className={`text-xs mt-0.5 line-clamp-1 ${
                  isSunMode ? 'text-stone-600' : 'text-stone-400'
                }`}
              >
                Diseña tu recorrido a la medida de tu tiempo
              </p>
            </div>
          </div>
        </div>

        {/* PASO 1: TIEMPO DISPONIBLE */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-amber-500">
              <Clock className="w-4 h-4" />
              <span>Paso 1: Tiempo disponible</span>
            </h2>
            <span
              className={`text-[11px] font-semibold ${
                isSunMode ? 'text-stone-500' : 'text-stone-400'
              }`}
            >
              {timeMinutes >= 900 ? 'Sin límite' : `~${timeMinutes} min`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { mins: 30, title: '30 min', badge: 'Relámpago', desc: 'Las obras maestras clave' },
              { mins: 60, title: '1 hora', badge: 'Esencial', desc: 'El balance ideal' },
              { mins: 120, title: '2 horas', badge: 'Profundo', desc: 'Recorrido completo' },
              { mins: 999, title: 'Sin prisa', badge: 'Todo el recinto', desc: 'Sin límite de tiempo' },
            ].map((option) => {
              const isSelected = timeMinutes === option.mins;
              return (
                <button
                  key={option.mins}
                  type="button"
                  onClick={() => setTimeMinutes(option.mins)}
                  className={`p-3 rounded-xl border text-left transition-all active:scale-[0.98] ${
                    isSelected
                      ? isSunMode
                        ? 'bg-amber-50 border-amber-600 text-stone-900 shadow-sm ring-1 ring-amber-600'
                        : 'bg-amber-950/40 border-amber-500 text-stone-100 shadow-sm ring-1 ring-amber-500'
                      : isSunMode
                      ? 'bg-white border-stone-300 hover:border-stone-400 text-stone-800'
                      : 'bg-stone-900/60 border-stone-800 hover:border-stone-700 text-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-sm">{option.title}</span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                        isSelected
                          ? 'bg-amber-500 text-stone-950'
                          : isSunMode
                          ? 'bg-stone-200 text-stone-700'
                          : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      {option.badge}
                    </span>
                  </div>
                  <p
                    className={`text-[11px] mt-1 leading-snug ${
                      isSelected
                        ? isSunMode
                          ? 'text-amber-900 font-medium'
                          : 'text-amber-200/90 font-medium'
                        : isSunMode
                        ? 'text-stone-500'
                        : 'text-stone-400'
                    }`}
                  >
                    {option.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* PASO 2: INTERESES CULTURALES Y TEMÁTICOS */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-amber-500">
              <Compass className="w-4 h-4" />
              <span>Paso 2: Intereses culturales y temáticos</span>
            </h2>
            <span
              className={`text-[11px] font-semibold ${
                isSunMode ? 'text-stone-500' : 'text-stone-400'
              }`}
            >
              Multiselección
            </span>
          </div>

          <div className="space-y-1.5">
            {availableTags.map((tag) => {
              const isChecked = selectedTags.includes(tag.key);
              return (
                <button
                  key={tag.key}
                  type="button"
                  onClick={() => handleToggleTag(tag.key)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all active:scale-[0.99] text-left ${
                    isChecked
                      ? isSunMode
                        ? 'bg-amber-50 border-amber-600 text-stone-900 ring-1 ring-amber-600'
                        : 'bg-amber-950/40 border-amber-500 text-stone-100 ring-1 ring-amber-500'
                      : isSunMode
                      ? 'bg-white border-stone-300 hover:border-stone-400 text-stone-700'
                      : 'bg-stone-900/60 border-stone-800 hover:border-stone-700 text-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        isChecked
                          ? 'bg-amber-500 text-stone-950'
                          : isSunMode
                          ? 'bg-stone-100 text-stone-600'
                          : 'bg-stone-800 text-stone-400'
                      }`}
                    >
                      {tag.icon}
                    </div>
                    <span className="font-bold text-xs">{tag.label}</span>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                      isChecked
                        ? 'bg-amber-500 border-amber-500 text-stone-950'
                        : isSunMode
                        ? 'border-stone-300 bg-stone-50'
                        : 'border-stone-700 bg-stone-900'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* PASO 3: RITMO DE VISITA */}
        <div className="space-y-2.5">
          <h2 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-amber-500">
            <Zap className="w-4 h-4" />
            <span>Paso 3: Ritmo de visita</span>
          </h2>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPace('highlights')}
              className={`p-3 rounded-xl border text-left transition-all active:scale-[0.98] ${
                pace === 'highlights'
                  ? isSunMode
                    ? 'bg-amber-50 border-amber-600 text-stone-900 ring-1 ring-amber-600 shadow-sm'
                    : 'bg-amber-950/40 border-amber-500 text-stone-100 ring-1 ring-amber-500 shadow-sm'
                  : isSunMode
                  ? 'bg-white border-stone-300 hover:border-stone-400 text-stone-700'
                  : 'bg-stone-900/60 border-stone-800 hover:border-stone-700 text-stone-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Award
                  className={`w-4 h-4 ${
                    pace === 'highlights' ? 'text-amber-500' : 'text-stone-400'
                  }`}
                />
                <span className="font-black text-xs">Solo lo imperdible</span>
              </div>
              <p
                className={`text-[10px] leading-snug ${
                  pace === 'highlights'
                    ? isSunMode
                      ? 'text-amber-900'
                      : 'text-amber-200'
                    : isSunMode
                    ? 'text-stone-500'
                    : 'text-stone-400'
                }`}
              >
                Obras cumbre y datos clave para aprovechar al máximo tu tiempo.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setPace('expert')}
              className={`p-3 rounded-xl border text-left transition-all active:scale-[0.98] ${
                pace === 'expert'
                  ? isSunMode
                    ? 'bg-amber-50 border-amber-600 text-stone-900 ring-1 ring-amber-600 shadow-sm'
                    : 'bg-amber-950/40 border-amber-500 text-stone-100 ring-1 ring-amber-500 shadow-sm'
                  : isSunMode
                  ? 'bg-white border-stone-300 hover:border-stone-400 text-stone-700'
                  : 'bg-stone-900/60 border-stone-800 hover:border-stone-700 text-stone-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <BookOpen
                  className={`w-4 h-4 ${
                    pace === 'expert' ? 'text-amber-500' : 'text-stone-400'
                  }`}
                />
                <span className="font-black text-xs">Detallado para expertos</span>
              </div>
              <p
                className={`text-[10px] leading-snug ${
                  pace === 'expert'
                    ? isSunMode
                      ? 'text-amber-900'
                      : 'text-amber-200'
                    : isSunMode
                    ? 'text-stone-500'
                    : 'text-stone-400'
                }`}
              >
                Inmersión profunda, iconografía, mitos e historias complementarias.
              </p>
            </button>
          </div>
        </div>

        {/* ACCIONES Y RUTAS CLÁSICAS */}
        {showClassicRoutes && (
          <div
            className={`p-4 rounded-2xl border space-y-3 animate-fadeIn ${
              isSunMode ? 'bg-white border-stone-300' : 'bg-stone-900 border-stone-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
                <ListFilter className="w-4 h-4 text-amber-500" />
                <span>Rutas Clásicas Predefinidas</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowClassicRoutes(false)}
                className="text-[11px] text-stone-400 hover:text-stone-200 font-bold"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-2">
              {manifest.routes.map((route) => (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => onStartRoute(route)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all active:scale-[0.98] ${
                    isSunMode
                      ? 'bg-stone-50 border-stone-200 hover:border-amber-500 hover:bg-amber-50/50'
                      : 'bg-stone-950/60 border-stone-800 hover:border-amber-500 hover:bg-amber-950/20'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs">{route.name}</span>
                      <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
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
          </div>
        )}
      </div>

      {/* Floating Bottom Action Dock */}
      <div
        className={`fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-4 border-t backdrop-blur-md z-30 transition-colors ${
          isSunMode
            ? 'bg-[#F9F6F0]/95 border-stone-300 shadow-2xl'
            : 'bg-stone-950/95 border-stone-800 shadow-2xl'
        }`}
      >
        <button
          type="button"
          onClick={handleGenerateOptimalRoute}
          className="w-full py-3.5 px-4 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
        >
          <Sparkles className="w-4 h-4 fill-stone-950" />
          <span>Generar Mi Recorrido Óptimo</span>
        </button>

        <button
          type="button"
          onClick={() => setShowClassicRoutes(!showClassicRoutes)}
          className={`w-full mt-2 text-center text-xs font-semibold py-1.5 transition-colors ${
            isSunMode
              ? 'text-stone-600 hover:text-stone-900 underline underline-offset-2'
              : 'text-stone-400 hover:text-stone-200 underline underline-offset-2'
          }`}
        >
          {showClassicRoutes
            ? 'Ocultar rutas clásicas'
            : 'O elige una ruta clásica predefinida'}
        </button>
      </div>
    </div>
  );
};
