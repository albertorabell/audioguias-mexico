import React, { useState } from 'react';
import {
  Compass,
  Headphones,
  WifiOff,
  Clock,
  Smartphone,
  ShieldCheck,
  Sparkles,
  MapPin,
  Lock,
  ArrowRight,
  Globe,
  Sun,
  Moon,
  ChevronRight,
} from 'lucide-react';
import { SiteSummary } from '../types';
import { useLanguage } from '../utils/LanguageContext';
import { useTheme } from '../utils/ThemeContext';
import { PWAInstallButton } from './PWAInstallButton';
import { t } from '../utils/i18nStrings';

interface HomeProps {
  sites: SiteSummary[];
  onSelectSite: (site: SiteSummary) => void;
  isLoading?: boolean;
}

export const Home: React.FC<HomeProps> = ({
  sites,
  onSelectSite,
  isLoading = false,
}) => {
  const { currentLanguage, setLanguage, availableLanguages } = useLanguage();
  const { isSunMode, toggleTheme } = useTheme();

  // Toast State for coming_soon sites & languages
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleSiteClick = (site: SiteSummary) => {
    if (site.status === 'coming_soon') {
      showToast(`${t.comingSoon}: ${site.name} se encuentra en desarrollo.`);
      return;
    }
    onSelectSite(site);
  };

  // Find active site for Hero CTA (MNA)
  const activeSite = sites.find((s) => s.status === 'active') || sites[0];
  const passPrice = (activeSite as any)?.pass_price_mxn || 79;
  const sitesCount = sites.length || 5;

  return (
    <div
      className={`min-h-screen transition-colors duration-200 select-none pb-24 ${
        isSunMode ? 'bg-[#FAF8F5] text-stone-900' : 'bg-[#0B0B0E] text-[#F3F4F6]'
      }`}
    >
      {/* Toast Notification Flotante */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-amber-500 text-black font-extrabold text-xs shadow-2xl animate-bounce flex items-center gap-2 border border-amber-400">
          <Sparkles className="w-4 h-4 fill-current shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Superior Minimalista */}
      <header
        className={`sticky top-0 z-30 px-4 py-3 border-b backdrop-blur-xl transition-colors duration-200 ${
          isSunMode
            ? 'bg-white/95 border-stone-200 text-stone-900 shadow-xs'
            : 'bg-[#0B0B0E]/90 border-white/10 text-stone-100'
        }`}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Logo / Nombre de la App */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center font-black text-sm shadow-md shadow-amber-500/25">
              🇲🇽
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-black text-sm tracking-tight ${
                    isSunMode ? 'text-stone-900' : 'text-white'
                  }`}
                >
                  {t.appName}
                </span>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  PWA
                </span>
              </div>
              <p
                className={`text-[10px] font-medium tracking-wide mt-0.5 ${
                  isSunMode ? 'text-stone-600' : 'text-stone-400'
                }`}
              >
                {t.patrimonyCdmx}
              </p>
            </div>
          </div>

          {/* Controles: Idioma y Tema */}
          <div className="flex items-center gap-2">
            {/* Selector de Idioma */}
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
                <Globe className="w-3.5 h-3.5 text-amber-500" />
                <span className="uppercase text-[11px] font-mono tracking-wider">
                  {currentLanguage}
                </span>
              </button>

              {/* Menú flotante de Idiomas */}
              {isLangMenuOpen && (
                <div
                  className={`absolute right-0 mt-2 w-48 rounded-2xl border shadow-2xl p-1.5 z-50 animate-fadeIn ${
                    isSunMode
                      ? 'bg-white border-stone-200 text-stone-900'
                      : 'bg-[#141419] border-white/15 text-stone-100'
                  }`}
                >
                  <div
                    className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest border-b mb-1 ${
                      isSunMode
                        ? 'text-stone-500 border-stone-100'
                        : 'text-stone-400 border-white/5'
                    }`}
                  >
                    Idioma / Language
                  </div>
                  {availableLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        if (lang.code === 'es') {
                          setLanguage(lang.code);
                          setIsLangMenuOpen(false);
                        } else {
                          setIsLangMenuOpen(false);
                          showToast(`Audio en ${lang.label} disponible próximamente.`);
                        }
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                        currentLanguage === lang.code
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold'
                          : isSunMode
                          ? 'hover:bg-stone-100 text-stone-700'
                          : 'hover:bg-white/5 text-stone-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                      {lang.comingSoon ? (
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                          Próx.
                        </span>
                      ) : (
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                          Activo
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Alternar Modo Sol/Noche */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isSunMode
                  ? 'bg-stone-100 border-stone-300 text-stone-700 hover:bg-stone-200'
                  : 'bg-white/5 border-white/10 text-stone-300 hover:bg-white/10'
              }`}
              title={isSunMode ? 'Cambiar a Modo Museo (Salas)' : 'Cambiar a Modo Sol (Exterior)'}
              aria-label="Alternar tema"
            >
              {isSunMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </button>

            {/* Botón PWA */}
            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="max-w-4xl mx-auto px-4 pt-6 sm:pt-8 space-y-10 sm:space-y-12">
        {/* ================= SECCIÓN HERO ================= */}
        <section
          className={`relative rounded-3xl p-6 sm:p-10 border shadow-2xl overflow-hidden transition-colors ${
            isSunMode
              ? 'bg-gradient-to-b from-white to-[#F5F2EA] border-stone-200'
              : 'bg-gradient-to-b from-[#141419] to-[#0E0E12] border-white/10'
          }`}
        >
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.heroSubtitle ? 'Curaduría Experta de Bolsillo' : 'Curaduría'}</span>
            </div>

            <h1
              className={`text-2xl sm:text-4xl font-black tracking-tight leading-tight ${
                isSunMode ? 'text-stone-900' : 'text-white'
              }`}
            >
              {t.heroTitle}
            </h1>

            <p
              className={`text-sm sm:text-base leading-relaxed ${
                isSunMode ? 'text-stone-700' : 'text-stone-300'
              }`}
            >
              {t.heroSubtitle}
            </p>

            {/* Kicker specs */}
            <div
              className={`flex flex-wrap items-center gap-3 pt-2 text-xs font-medium ${
                isSunMode ? 'text-stone-600' : 'text-stone-400'
              }`}
            >
              <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold">
                <span>🏛️</span>
                <span>Top {sitesCount} Recintos CDMX</span>
              </span>
              <span aria-hidden="true" className="text-stone-400">·</span>
              <span className="flex items-center gap-1.5">
                <WifiOff className="w-3.5 h-3.5" />
                <span>100% Offline en Sala</span>
              </span>
              <span aria-hidden="true" className="text-stone-400">·</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
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
                  <span>{t.exploreMna} ({activeSite.short_name || 'MNA'})</span>
                  <ArrowRight className="w-4 h-4 ml-0.5 stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ================= SECCIÓN '¿CÓMO FUNCIONA EL PASE PREMIUM?' ================= */}
        <section
          id="pase-premium-explanation"
          className={`rounded-3xl p-6 sm:p-8 border shadow-xl space-y-6 transition-colors ${
            isSunMode
              ? 'bg-white border-stone-200'
              : 'bg-[#141419] border-white/10'
          }`}
        >
          <div
            className={`flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b pb-4 ${
              isSunMode ? 'border-stone-200' : 'border-white/5'
            }`}
          >
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>{t.premiumPassSubtitle}</span>
              </div>
              <h2
                className={`text-xl sm:text-2xl font-bold tracking-tight ${
                  isSunMode ? 'text-stone-900' : 'text-white'
                }`}
              >
                {t.premiumPassTitle}
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-bold self-start sm:self-auto">
              <span>{t.onlyPricePerSite(passPrice)}</span>
              <span
                className={`text-[10px] font-normal ${
                  isSunMode ? 'text-stone-600' : 'text-stone-400'
                }`}
              >
                · {t.noSubscriptions}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pilar 1: Audioguías completas */}
            <div
              className={`p-5 rounded-2xl border flex flex-col justify-between space-y-3 ${
                isSunMode
                  ? 'bg-stone-50 border-stone-200'
                  : 'bg-[#0B0B0E] border-white/5'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Headphones className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3
                  className={`text-sm font-bold ${
                    isSunMode ? 'text-stone-900' : 'text-white'
                  }`}
                >
                  {t.featureFullGuides}
                </h3>
                <p
                  className={`text-xs leading-relaxed ${
                    isSunMode ? 'text-stone-600' : 'text-stone-400'
                  }`}
                >
                  {t.featureFullGuidesDesc}
                </p>
              </div>
              <div className="text-[11px] font-mono text-amber-700 dark:text-amber-400 font-bold">
                ✓ +130 obras explicadas
              </div>
            </div>

            {/* Pilar 2: 100% Offline */}
            <div
              className={`p-5 rounded-2xl border flex flex-col justify-between space-y-3 ${
                isSunMode
                  ? 'bg-stone-50 border-stone-200'
                  : 'bg-[#0B0B0E] border-white/5'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <WifiOff className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3
                  className={`text-sm font-bold ${
                    isSunMode ? 'text-stone-900' : 'text-white'
                  }`}
                >
                  {t.featureOffline}
                </h3>
                <p
                  className={`text-xs leading-relaxed ${
                    isSunMode ? 'text-stone-600' : 'text-stone-400'
                  }`}
                >
                  {t.featureOfflineDesc}
                </p>
              </div>
              <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                ✓ Sin gastar datos móviles
              </div>
            </div>

            {/* Pilar 3: 72 horas para 2 dispositivos */}
            <div
              className={`p-5 rounded-2xl border flex flex-col justify-between space-y-3 ${
                isSunMode
                  ? 'bg-stone-50 border-stone-200'
                  : 'bg-[#0B0B0E] border-white/5'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3
                  className={`text-sm font-bold ${
                    isSunMode ? 'text-stone-900' : 'text-white'
                  }`}
                >
                  {t.feature72Hours}
                </h3>
                <p
                  className={`text-xs leading-relaxed ${
                    isSunMode ? 'text-stone-600' : 'text-stone-400'
                  }`}
                >
                  {t.feature72HoursDesc}
                </p>
              </div>
              <div className="text-[11px] font-mono text-sky-600 dark:text-sky-400 font-bold">
                ✓ 3 días completos de acceso
              </div>
            </div>
          </div>
        </section>

        {/* ================= GRID DE SITIOS (TOP RECINTOS CDMX) ================= */}
        <section id="sites-grid-section" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2
                className={`text-lg sm:text-xl font-bold tracking-tight ${
                  isSunMode ? 'text-stone-900' : 'text-white'
                }`}
              >
                Top {sitesCount} Recintos de México
              </h2>
              <p
                className={`text-xs mt-0.5 ${
                  isSunMode ? 'text-stone-600' : 'text-stone-400'
                }`}
              >
                Selecciona tu destino para iniciar o consultar tu recorrido
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {sites.map((site) => {
              const isActive = site.status === 'active';
              return (
                <div
                  key={site.id}
                  onClick={() => handleSiteClick(site)}
                  role="button"
                  tabIndex={0}
                  className={`rounded-3xl border overflow-hidden flex flex-col justify-between transition-all duration-200 group text-left ${
                    isActive
                      ? isSunMode
                        ? 'bg-white border-stone-200 hover:border-amber-500/60 hover:shadow-lg cursor-pointer active:scale-[0.98]'
                        : 'bg-[#141419] border-white/10 hover:border-amber-500/50 hover:bg-[#1A1A22] cursor-pointer shadow-lg active:scale-[0.98]'
                      : isSunMode
                      ? 'bg-stone-100/70 border-stone-200 opacity-75 cursor-pointer hover:border-stone-300'
                      : 'bg-[#121216]/60 border-white/5 opacity-80 cursor-pointer hover:border-white/15'
                  }`}
                >
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-2xl">{site.icon || '🏛️'}</span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          isActive
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {isActive ? 'Disponible' : 'Próximamente'}
                      </span>
                    </div>

                    <div>
                      <h3
                        className={`text-base font-bold transition-colors ${
                          isSunMode
                            ? 'text-stone-900 group-hover:text-amber-700'
                            : 'text-white group-hover:text-amber-400'
                        }`}
                      >
                        {site.name}
                      </h3>
                      <p
                        className={`text-xs flex items-center gap-1 mt-1 ${
                          isSunMode ? 'text-stone-600' : 'text-stone-400'
                        }`}
                      >
                        <MapPin className="w-3 h-3 text-amber-500" />
                        <span>{site.location}</span>
                      </p>
                    </div>

                    <p
                      className={`text-xs leading-relaxed line-clamp-2 ${
                        isSunMode ? 'text-stone-600' : 'text-stone-400'
                      }`}
                    >
                      {site.description}
                    </p>
                  </div>

                  <div
                    className={`p-4 border-t flex items-center justify-between text-xs font-bold ${
                      isSunMode
                        ? 'bg-stone-50 border-stone-100'
                        : 'bg-white/5 border-white/5'
                    }`}
                  >
                    <span
                      className={`text-[11px] ${
                        isSunMode ? 'text-stone-600' : 'text-stone-400'
                      }`}
                    >
                      {isActive ? 'Acceso completo' : 'En curaduría'}
                    </span>
                    <span
                      className={`flex items-center gap-1 transition-transform group-hover:translate-x-0.5 ${
                        isActive
                          ? isSunMode
                            ? 'text-amber-700'
                            : 'text-amber-400'
                          : isSunMode
                          ? 'text-stone-500'
                          : 'text-stone-400'
                      }`}
                    >
                      <span>{isActive ? 'Explorar' : 'Pronto'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
