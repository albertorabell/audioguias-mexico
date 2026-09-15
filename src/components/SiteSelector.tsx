import React from 'react';
import { MapPin, Headphones, Clock, Sparkles, ChevronRight, ShieldCheck, Compass } from 'lucide-react';
import { SiteSummary } from '../types';
import { hasActivePass } from '../utils/license';
import { PWAInstallButton } from './PWAInstallButton';

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
  return (
    <div className="pb-16 text-stone-100">
      {/* Top Bar / Brand header */}
      <div className="px-4 pt-5 pb-4 border-b border-stone-800/60 bg-gradient-to-b from-stone-900 to-stone-950">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                Audioguías México
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-semibold uppercase tracking-wider">
                  PWA
                </span>
              </h1>
              <p className="text-[11px] text-stone-400">Patrimonio arqueológico e histórico</p>
            </div>
          </div>
          <PWAInstallButton />
        </div>

        {/* Mini offline & audio notice pill */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-900/80 border border-stone-800 text-xs text-stone-300">
          <Compass className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-[11px] leading-tight">
            Recorridos geolocalizados, voz inmersiva y funcionamiento <strong>100% offline</strong> en salas.
          </p>
        </div>
      </div>

      {/* Sites List */}
      <div className="px-4 pt-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-stone-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Sitios Disponibles ({sites.length})
          </h2>
          <span className="text-[11px] text-amber-400/90 font-medium">3 Recintos</span>
        </div>

        {isLoading ? (
          <div className="space-y-4 py-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-56 rounded-2xl bg-stone-900/60 border border-stone-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4.5">
            {sites.map((site) => {
              const passActive = hasActivePass(site.id);
              return (
                <article
                  key={site.id}
                  id={`card-site-${site.id.toLowerCase()}`}
                  className="group relative rounded-2xl bg-stone-900/90 border border-stone-800 overflow-hidden shadow-lg transition duration-200 hover:border-amber-500/50 flex flex-col"
                >
                  {/* Image container with badges */}
                  <div className="relative h-44 w-full overflow-hidden bg-stone-950">
                    <img
                      src={site.thumbnail}
                      alt={site.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

                    {/* Badge top left */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[85%]">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/90 text-stone-950 backdrop-blur-xs shadow-sm">
                        {site.badge}
                      </span>
                      {passActive && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-600/90 text-white backdrop-blur-xs shadow-sm">
                          <ShieldCheck className="w-3 h-3" />
                          Pase Activo
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between -mt-6 relative z-10">
                    <div>
                      <div className="flex items-center gap-1.5 text-stone-400 text-xs mb-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{site.location}</span>
                      </div>

                      <h3 className="text-base font-bold text-white leading-snug group-hover:text-amber-400 transition mb-2">
                        {site.name}
                      </h3>

                      <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed mb-3">
                        {site.description}
                      </p>
                    </div>

                    {/* Footer Info & Action */}
                    <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3 text-xs text-stone-400">
                        <span className="flex items-center gap-1 font-medium">
                          <Headphones className="w-3.5 h-3.5 text-amber-400" />
                          2 Rutas
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          20 - 45 min
                        </span>
                      </div>

                      <button
                        id={`btn-enter-${site.id.toLowerCase()}`}
                        onClick={() => onSelectSite(site)}
                        className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition active:scale-95 shadow-sm"
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
