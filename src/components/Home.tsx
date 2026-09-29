import React, { useState } from 'react';
import {
  Headphones,
  Compass,
  Sparkles,
  ShieldCheck,
  WifiOff,
  Clock,
  Smartphone,
  ChevronRight,
  MapPin,
  Lock,
  Globe,
  Layers,
  ArrowRight,
  Info,
  Check,
} from 'lucide-react';
import { SiteSummary } from '../types';
import { useTheme } from '../utils/ThemeContext';
import { useLanguage, availableLanguages } from '../utils/LanguageContext';
import { PWAInstallButton } from './PWAInstallButton';
import { ThemeToggle } from './ThemeToggle';
import { SafeImage } from './SafeImage';

interface HomeProps {
  sites: SiteSummary[];
  onSelectSite: (site: SiteSummary) => void;
  isLoading: boolean;
}

export const Home: React.FC<HomeProps> = ({
  sites,
  onSelectSite,
  isLoading,
}) => {
  const { isSunMode } = useTheme();
  const { currentLanguage, setLanguage } = useLanguage();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  // Muestra un toast al interactuar con un recinto en desarrollo
  const showToast = (message: string) => {
    setToastMessage(message);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(40);
      } catch {
        // Ignorar
      }
    }
    setTimeout(() => {
      setToastMessage((prev) => (prev === message ? null : prev));
    }, 3800);
  };

  const handleSiteClick = (site: SiteSummary) => {
    if (site.status === 'coming_soon') {
      showToast(`🏛️ ${site.name}: Audioguía en desarrollo. Disponible próximamente.`);
      return;
    }
    onSelectSite(site);
  };

  const activeSite = sites.find((s) => s.status === 'active' || s.id === 'MNA');

  return (
    <div
      className={`min-h-screen pb-24 transition-colors duration-200 select-none ${
        isSunMode ? 'bg-[#FAFAF9] text-stone-900' : 'bg-[#0B0B0E] text-[#F3F4F6]'
      }`}
    >
      {/* ================= 1. HEADER INSTITUCIONAL CON IDIOMA Y PWA ================= */}
      <header
        className={`sticky top-0 z-30 px-4 py-3.5 border-b backdrop-blur-xl transition-colors duration-200 ${
          isSunMode
            ? 'bg-white/95 border-stone-200 shadow-xs'
            : 'bg-[#0B0B0E]/95 border-white/10 shadow-lg'
        }`}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {/* Marca / Logo */}
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-inner ${
                isSunMode
                  ? 'bg-amber-100 border border-amber-300 text-amber-900'
                  : 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
              }`}
            >
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white drop-shadow-xs">
                  Audioguías México
                </span>
                <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  PWA
                </span>
              </div>
              <p className="text-[10px] text-stone-400 font-medium tracking-wide mt-0.5">
                Patrimonio Oficial CDMX
              </p>
            </div>
          </div>

          {/* Controles: Idioma (es/en/fr), Tema y PWA */}
          <div className="flex items-center gap-2">
            {/* Selector de Idioma (Placeholder funcional para escalabilidad) */}
            <div className="relative">
              <button
                type="button"
                id="btn-language-selector"
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSunMode
                    ? 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-800'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-stone-200'
                }`}
                title="Seleccionar idioma"
                aria-label="Selector de idioma"
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span className="uppercase text-[11px] font-mono tracking-wider">
                  {currentLanguage}
                </span>
              </button>

              {/* Menú flotante de Idiomas */}
              {isLangMenuOpen && (
                <div
                  className={`absolute right-0 mt-2 w-40 rounded-2xl border shadow-2xl p-1.5 z-50 animate-fadeIn ${
                    isSunMode
                      ? 'bg-white border-stone-200 text-stone-800'
                      : 'bg-[#141419] border-white/15 text-stone-100'
                  }`}
                >
                  <div className="px-2 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-widest border-b border-white/5 mb-1">
                    Idioma / Language
                  </div>
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setLanguage(lang.code);
                        setIsLangMenuOpen(false);
                        if (lang.code !== 'es') {
                          showToast(`Audio en ${lang.label} disponible próximamente. Reproduciendo en español.`);
                        }
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        currentLanguage === lang.code
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'hover:bg-white/5 text-stone-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                      {currentLanguage === lang.code && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <ThemeToggle />
            <PWAInstallButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pt-6 space-y-8">
        {/* ================= 2. HERO SECTION ================= */}
        <section
          id="hero-section"
          className="relative rounded-3xl overflow-hidden p-6 sm:p-10 border border-white/10 bg-gradient-to-b from-[#141419] to-[#0E0E12] shadow-2xl"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              <span>Audioguías Inmersivas Oficiales</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.1]">
              Tu curador personal de bolsillo
            </h1>

            <p className="text-sm sm:text-base text-stone-300 leading-relaxed font-normal">
              Explora los museos y zonas arqueológicas más emblemáticas de México con relatos
              curatoriales expertos, retos de observación en vitrina física y funcionamiento autónomo
              sin necesidad de conexión a internet.
            </p>

            {/* Kicker specs unboxed */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-stone-400 font-medium">
              <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                <span>🏛️</span>
                <span>Top 5 Recintos CDMX</span>
              </span>
              <span aria-hidden="true" className="text-stone-600">·</span>
              <span className="flex items-center gap-1.5">
                <WifiOff className="w-3.5 h-3.5 text-stone-400" />
                <span>100% Offline en Sala</span>
              </span>
              <span aria-hidden="true" className="text-stone-600">·</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>Pase 72h / 2 Dispositivos</span>
              </span>
            </div>

            {/* CTA Principal */}
            {activeSite && (
              <div className="pt-3">
                <button
                  type="button"
                  id="btn-hero-cta"
                  onClick={() => handleSiteClick(activeSite)}
                  className="py-3.5 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-black font-extrabold text-sm sm:text-base transition-all duration-200 shadow-xl shadow-amber-500/25 flex items-center gap-2.5 cursor-pointer"
                >
                  <Headphones className="w-4 h-4 fill-current" />
                  <span>Explorar Museo de Antropología (MNA)</span>
                  <ArrowRight className="w-4 h-4 ml-0.5 stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ================= 3. SECCIÓN '¿CÓMO FUNCIONA EL PASE PREMIUM?' ================= */}
        <section
          id="pase-premium-explanation"
          className="rounded-3xl p-6 sm:p-8 bg-[#141419] border border-white/10 shadow-xl space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-white/5 pb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Modelo de Acceso Transparente</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                ¿Cómo funciona el Pase Premium?
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold self-start sm:self-auto">
              <span>Solo $79 MXN por recinto</span>
              <span className="text-[10px] text-stone-400 font-normal">· Sin suscripciones</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pilar 1: Audioguías completas */}
            <div className="p-5 rounded-2xl bg-[#0B0B0E] border border-white/5 flex flex-col justify-between space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Headphones className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  Audioguías completas para todas las piezas
                </h3>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Desbloquea explicaciones curatoriales profundas, mitos desmentidos y retos de
                  observación detallados para cada vitrina y sala sin límites.
                </p>
              </div>
              <div className="text-[11px] font-mono text-amber-400/90 font-medium">
                ✓ +130 obras explicadas
              </div>
            </div>

            {/* Pilar 2: 100% Offline */}
            <div className="p-5 rounded-2xl bg-[#0B0B0E] border border-white/5 flex flex-col justify-between space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                <WifiOff className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  Uso 100% sin conexión (offline)
                </h3>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Los guiones y audios se guardan en la memoria de tu dispositivo. Funciona sin problemas
                  en salas subterráneas, bóvedas o zonas arqueológicas sin señal.
                </p>
              </div>
              <div className="text-[11px] font-mono text-emerald-400 font-medium">
                ✓ Sin gastar datos móviles
              </div>
            </div>

            {/* Pilar 3: 72 horas para 2 dispositivos */}
            <div className="p-5 rounded-2xl bg-[#0B0B0E] border border-white/5 flex flex-col justify-between space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">
                  Vigencia de 72 horas para 2 dispositivos
                </h3>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Visita el museo a tu propio ritmo hoy y vuelve mañana. Válido para compartir
                  con tu acompañante con un solo código de activación.
                </p>
              </div>
              <div className="text-[11px] font-mono text-sky-400 font-medium">
                ✓ 3 días completos de acceso
              </div>
            </div>
          </div>
        </section>

        {/* ================= 4. GRID DE SITIOS (TOP 5 CDMX) ================= */}
        <section id="sites-grid-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>Catálogo de Recintos</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
                Top 5 Recintos Culturales de CDMX
              </h2>
            </div>
            <span className="text-xs font-mono text-stone-400 font-medium">
              {sites.length} Recintos
            </span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-64 rounded-3xl bg-[#141419] border border-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {sites.map((site) => {
                const isActive = site.status === 'active';

                return (
                  <article
                    key={site.id}
                    id={`card-site-${site.id.toLowerCase()}`}
                    onClick={() => handleSiteClick(site)}
                    className={`group relative rounded-3xl overflow-hidden border transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                      isActive
                        ? 'bg-[#141419] border-white/15 hover:border-amber-500/60 shadow-xl hover:shadow-amber-500/10 active:scale-[0.99]'
                        : 'bg-[#141419]/70 border-white/5 hover:border-white/20 opacity-85 active:scale-[0.99]'
                    }`}
                  >
                    <div>
                      {/* Imagen Monumental de Recinto */}
                      <div className="relative h-48 w-full overflow-hidden bg-black">
                        <SafeImage
                          src={site.thumbnail}
                          alt={site.name}
                          fallbackTitle={site.name}
                          fallbackSubtitle={site.location}
                          iconType={
                            site.id === 'TEOTIHUACAN'
                              ? 'pyramid'
                              : site.id === 'CHAPULTEPEC'
                              ? 'castle'
                              : 'museum'
                          }
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#141419] via-transparent to-transparent pointer-events-none" />

                        {/* Badge de Estado: Disponible vs Próximamente */}
                        <div className="absolute top-3 right-3 z-10">
                          {isActive ? (
                            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-black shadow-lg shadow-amber-500/30 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
                              <span>Disponible</span>
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-black/80 backdrop-blur-md text-stone-300 border border-white/10 flex items-center gap-1.5">
                              <Lock className="w-3 h-3 text-amber-400/80" />
                              <span>Próximamente</span>
                            </span>
                          )}
                        </div>

                        {/* Badge de Reconocimiento */}
                        {site.badge && (
                          <div className="absolute bottom-3 left-3 z-10">
                            <span className="text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-stone-200 border border-white/10">
                              {site.badge}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Contenido de la tarjeta */}
                      <div className="p-5 space-y-2.5">
                        <div className="flex items-center gap-1.5 text-xs text-stone-400 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{site.location}</span>
                        </div>

                        <h3 className="text-lg font-bold text-white leading-snug group-hover:text-amber-400 transition-colors">
                          {site.name}
                        </h3>

                        <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                          {site.description}
                        </p>
                      </div>
                    </div>

                    {/* Botón de Acción inferior */}
                    <div className="px-5 pb-5 pt-1">
                      {isActive ? (
                        <div className="w-full py-2.5 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500 group-hover:bg-amber-500 text-amber-400 group-hover:text-black font-extrabold text-xs transition-all flex items-center justify-between border border-amber-500/30">
                          <span className="flex items-center gap-2">
                            <Headphones className="w-4 h-4" />
                            <span>Entrar al Recinto y Rutas</span>
                          </span>
                          <ChevronRight className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-full py-2 px-3 rounded-xl bg-white/5 text-stone-400 font-semibold text-xs flex items-center justify-between border border-white/5">
                          <span className="flex items-center gap-2 text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>En desarrollo curatorial</span>
                          </span>
                          <span className="text-[10px] text-amber-400 font-bold">Ver aviso</span>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ================= 5. FOOTER CON CRÉDITOS Y PWA INFO ================= */}
        <footer className="pt-8 border-t border-white/5 text-center space-y-3 text-xs text-stone-500">
          <p className="text-stone-400 font-medium">
            Audioguías México · Aplicación Web Progresiva para Patrimonio Nacional
          </p>
          <p className="text-[11px] text-stone-600 max-w-lg mx-auto">
            Homenaje curatorial e histórico independiente al acervo del Instituto Nacional de
            Antropología e Historia (INAH). Todos los nombres y fotografías pertenecen a sus
            respectivos recintos.
          </p>
        </footer>
      </main>

      {/* ================= TOAST NOTIFICATION PARA SITIOS EN DESARROLLO ================= */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-md animate-fadeIn">
          <div className="p-4 rounded-2xl bg-[#141419] border border-amber-500/40 text-white shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-stone-200">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-stone-400 hover:text-white text-xs font-bold px-2 py-1 rounded-lg cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const SiteSelector = Home;
export default Home;
