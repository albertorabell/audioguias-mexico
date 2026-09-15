import React from 'react';
import { MapPin, Headphones, Clock, Sparkles, ChevronRight, ShieldCheck, Compass } from 'lucide-react';
import { SiteSummary } from '../types';
import { hasActivePass } from '../utils/license';
import { PWAInstallButton } from './PWAInstallButton';
import { ThemeToggle } from './ThemeToggle';
import { SafeImage } from './SafeImage';
import { useTheme } from '../utils/ThemeContext';

interface SiteSelectorProps {
  sites: SiteSummary[];
  onSelectSite: (site: SiteSummary) => void;
  isLoading: boolean;
}

export const SiteSelector: React.FC<SiteSelectorProps> = ({
  sites,
  onSelectSite,
  isLoading,
}) => {
  const { isSunMode } = useTheme();

  return (
    <div className={`pb-20 transition-colors duration-200 ${isSunMode ? 'text-stone-900' : 'text-stone-100'}`}>
      {/* Top Bar / Brand header */}
      <div
        className={`px-4 pt-4 pb-4 border-b transition-colors duration-200 ${
          isSunMode
            ? 'bg-white border-stone-300 shadow-xs'
            : 'bg-gradient-to-b from-stone-900 to-stone-950 border-stone-800/60'
        }`}
      >
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-inner ${
                isSunMode
                  ? 'bg-amber-100 border border-amber-300 text-amber-800'
                  : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
              }`}
            >
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h1
                className={`text-base font-extrabold tracking-tight flex items-center gap-1.5 ${
                  isSunMode ? 'text-stone-950' : 'text-white'
                }`}
              >
                Audioguías México
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-wider ${
                    isSunMode
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  PWA
                </span>
              </h1>
              <p className={`text-[11px] font-medium ${isSunMode ? 'text-stone-600' : 'text-stone-400'}`}>
                Patrimonio arqueológico e histórico
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <PWAInstallButton />
          </div>
        </div>

        {/* Mini offline & audio notice pill */}
        <div
          className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs border ${
            isSunMode
              ? 'bg-amber-50/80 border-amber-200 text-stone-800 font-medium'
              : 'bg-stone-900/80 border-stone-800 text-stone-300'
          }`}
        >
          <Compass className={`w-4 h-4 shrink-0 ${isSunMode ? 'text-amber-700' : 'text-amber-400'}`} />
          <p className="text-[11px] leading-tight">
            Recorridos geolocalizados, voz natural adaptada y funcionamiento <strong>100% offline</strong> en campo.
          </p>
        </div>
      </div>

      {/* Sites List */}
      <div className="px-4 pt-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2
            className={`text-xs font-extrabold uppercase tracking-widest flex items-center gap-1.5 ${
              isSunMode ? 'text-stone-700' : 'text-stone-400'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSunMode ? 'text-amber-700' : 'text-amber-400'}`} />
            Sitios Disponibles ({sites.length})
          </h2>
          <span
            className={`text-[11px] font-bold ${
              isSunMode ? 'text-amber-800' : 'text-amber-400/90'
            }`}
          >
            3 Recintos Oficiales
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-4 py-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`h-56 rounded-2xl animate-pulse ${
                  isSunMode ? 'bg-stone-200 border border-stone-300' : 'bg-stone-900/60 border border-stone-800'
                }`}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            {sites.map((site) => {
              const passActive = hasActivePass(site.id);
              return (
                <article
                  key={site.id}
                  id={`card-site-${site.id.toLowerCase()}`}
                  className={`group relative rounded-2xl overflow-hidden transition duration-200 flex flex-col ${
                    isSunMode
                      ? 'bg-white border border-stone-300 shadow-md hover:border-amber-700 hover:shadow-lg'
                      : 'bg-stone-900/90 border border-stone-800 shadow-lg hover:border-amber-500/50'
                  }`}
                >
                  {/* Image container with badges */}
                  <div className="relative h-44 w-full overflow-hidden bg-stone-950">
                    <SafeImage
                      src={site.thumbnail}
                      alt={site.name}
                      fallbackTitle={site.name}
                      fallbackSubtitle={site.location}
                      iconType={site.id === 'TEOTIHUACAN' ? 'pyramid' : site.id === 'CHAPULTEPEC' ? 'castle' : 'museum'}
                      className="w-full h-full"
                      imgClassName="group-hover:scale-105 transition duration-500"
                    />
                    <div
                      className={`absolute inset-0 pointer-events-none ${
                        isSunMode
                          ? 'bg-gradient-to-t from-stone-900/80 via-transparent to-transparent'
                          : 'bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent'
                      }`}
                    />

                    {/* Badge top left */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[85%]">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold shadow-sm ${
                          isSunMode
                            ? 'bg-amber-600 text-white'
                            : 'bg-amber-500 text-stone-950'
                        }`}
                      >
                        {site.badge}
                      </span>
                      {passActive && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-700 text-white shadow-sm">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Pase Activo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between relative z-10">
                    <div>
                      <div
                        className={`flex items-center gap-1.5 text-xs mb-1.5 font-semibold ${
                          isSunMode ? 'text-stone-600' : 'text-stone-400'
                        }`}
                      >
                        <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSunMode ? 'text-amber-700' : 'text-amber-400'}`} />
                        <span className="truncate">{site.location}</span>
                      </div>

                      <h3
                        className={`text-base font-extrabold leading-snug transition mb-2 ${
                          isSunMode
                            ? 'text-stone-950 group-hover:text-amber-800'
                            : 'text-white group-hover:text-amber-400'
                        }`}
                      >
                        {site.name}
                      </h3>

                      <p
                        className={`text-xs line-clamp-2 leading-relaxed mb-3 font-medium ${
                          isSunMode ? 'text-stone-700' : 'text-stone-300'
                        }`}
                      >
                        {site.description}
                      </p>
                    </div>

                    {/* Footer Info & Action */}
                    <div
                      className={`pt-3 border-t flex items-center justify-between gap-2 ${
                        isSunMode ? 'border-stone-200' : 'border-stone-800/80'
                      }`}
                    >
                      <div
                        className={`flex items-center gap-3 text-xs font-semibold ${
                          isSunMode ? 'text-stone-700' : 'text-stone-400'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <Headphones className={`w-3.5 h-3.5 ${isSunMode ? 'text-amber-700' : 'text-amber-400'}`} />
                          2 Rutas
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className={`w-3.5 h-3.5 ${isSunMode ? 'text-amber-700' : 'text-amber-400'}`} />
                          20 - 45 min
                        </span>
                      </div>

                      {/* Botón táctil ergonómico (min 48px de altura) */}
                      <button
                        id={`btn-enter-${site.id.toLowerCase()}`}
                        onClick={() => onSelectSite(site)}
                        className={`min-h-[48px] inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold transition active:scale-95 shadow-md ${
                          isSunMode
                            ? 'bg-amber-700 hover:bg-amber-800 text-white shadow-amber-800/20'
                            : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
                        }`}
                      >
                        <span>Entrar a la guía</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
