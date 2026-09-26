import React, { useState, useMemo } from 'react';
import {
  Compass,
  Clock,
  MapPin,
  Layers,
  Sparkles,
  Building2,
  BookOpen,
  Route,
  Map,
  ChevronRight,
  Headphones,
  Landmark,
} from 'lucide-react';
import { SiteSummary, SiteManifest, SiteRoute, Room } from '../types';
import { SITE_OVERVIEWS, SitePhoto } from '../data/siteOverviews';
import { SafeImage } from './SafeImage';

interface SiteOverviewProps {
  site: SiteSummary;
  manifest: SiteManifest;
  onBack: () => void;
  onCustomizeRoute: () => void;
  onDirectStartRoute: (route: SiteRoute) => void;
  onSelectRoom?: (room: Room | any) => void;
  onOpenMapModal?: () => void;
}

export const SiteOverview: React.FC<SiteOverviewProps> = ({
  site,
  manifest,
  onBack,
  onCustomizeRoute,
  onDirectStartRoute,
  onSelectRoom,
  onOpenMapModal,
}) => {
  const overviewData = SITE_OVERVIEWS[site.id] || SITE_OVERVIEWS.MNA;
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [selectedFloor, setSelectedFloor] = useState<'ALL' | 'PB' | 'PA'>('PB');
  const [showPredefinedRoutes, setShowPredefinedRoutes] = useState(false);

  const photos: SitePhoto[] = overviewData.photos.length > 0 ? overviewData.photos : [
    {
      url: site.thumbnail,
      title: site.name,
      caption: site.description,
    },
  ];

  const currentPhoto = photos[activePhotoIndex] || photos[0];

  const filteredRooms = useMemo(() => {
    if (!manifest.rooms) return [];
    if (selectedFloor === 'ALL') return manifest.rooms;
    return manifest.rooms.filter((r: any) => {
      const isPA = r.piso === 'PA' || (r as any).floor === 2;
      return selectedFloor === 'PA' ? isPA : !isPA;
    });
  }, [manifest.rooms, selectedFloor]);

  return (
    <div className="min-h-screen bg-[#0B0B0E] text-[#F3F4F6] flex flex-col pb-36 select-none transition-colors duration-200">
      {/* ================= HERO MARQUEE & COVER ================= */}
      <section className="relative w-full aspect-[16/10] sm:aspect-[16/9] overflow-hidden bg-black">
        <SafeImage
          src={currentPhoto.url}
          alt={currentPhoto.title}
          className="w-full h-full object-cover"
        />
        {/* Degradado cinematográfico que integra la foto al fondo #0B0B0E */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0E] via-[#0B0B0E]/50 to-transparent pointer-events-none" />

        {/* Tag superior y título en el hero */}
        <div className="absolute bottom-4 left-4 right-4 text-white z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/40">
              {overviewData.shortName || 'MNA MÉXICO'}
            </span>
            <span className="text-[10px] font-bold text-stone-300">
              22 Salas Temáticas
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white leading-tight">
            {overviewData.officialTitle || site.name}
          </h1>
          <p className="text-xs text-[#9CA3AF] mt-1 line-clamp-2">
            {currentPhoto.caption}
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-3 space-y-6">
        {/* ================= CINTA DE DATOS OPERACIONALES ================= */}
        <section className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-[#141419] border border-white/10 text-xs">
          <div className="flex items-center gap-2 text-[#9CA3AF]">
            <MapPin className="w-4 h-4 text-[#F59E0B] shrink-0" />
            <span className="truncate">{overviewData.location}</span>
          </div>
          <div className="flex items-center gap-2 text-[#9CA3AF] justify-end">
            <Clock className="w-4 h-4 text-[#F59E0B] shrink-0" />
            <span className="truncate">{overviewData.schedule}</span>
          </div>
        </section>

        {/* ================= BOTÓN DE ACCIÓN RÁPIDA: PERSONALIZAR O MAPA ================= */}
        <section className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCustomizeRoute}
            className="py-3.5 px-4 rounded-2xl font-bold text-xs bg-[#F59E0B] hover:bg-amber-400 text-black shadow-lg shadow-[#F59E0B]/20 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Compass className="w-4 h-4 fill-current" />
            <span>Diseñar Recorrido</span>
          </button>

          {onOpenMapModal && (
            <button
              type="button"
              onClick={onOpenMapModal}
              className="py-3.5 px-4 rounded-2xl font-bold text-xs bg-[#141419] hover:bg-[#1a1a22] text-white border border-white/10 shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Map className="w-4 h-4 text-[#F59E0B]" />
              <span>Ver Plano del Museo</span>
            </button>
          )}
        </section>

        {/* ================= EXPLORADOR DE SALAS POR PISOS (PB y PA) ================= */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-[#F59E0B]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Explorador de Salas Oficiales ({filteredRooms.length})
              </h2>
            </div>
            <span className="text-[10px] text-[#6B7280]">Toca para abrir sala</span>
          </div>

          {/* Toggle de piso PB / PA */}
          <div className="grid grid-cols-3 p-1 rounded-2xl bg-[#141419] border border-white/10">
            <button
              type="button"
              onClick={() => setSelectedFloor('PB')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedFloor === 'PB'
                  ? 'bg-[#F59E0B] text-black shadow-sm'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              Planta Baja (Arqueología)
            </button>
            <button
              type="button"
              onClick={() => setSelectedFloor('PA')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedFloor === 'PA'
                  ? 'bg-[#F59E0B] text-black shadow-sm'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              Planta Alta (Etnografía)
            </button>
            <button
              type="button"
              onClick={() => setSelectedFloor('ALL')}
              className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedFloor === 'ALL'
                  ? 'bg-[#F59E0B] text-black shadow-sm'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              Todas (22)
            </button>
          </div>

          {/* Grid de Salas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {filteredRooms.map((room: any) => {
              const piecesCount = room.pieces_info?.length || room.featured_pieces?.length || 0;
              const roomId = room.room_id || room.id;
              const roomName = room.nombre_oficial || room.name || roomId;
              const roomDesc = room.frase_gancho || room.short_description || room.introduccion_narrativa;
              const piso = room.piso === 'PA' ? 'Planta Alta' : 'Planta Baja';
              const numeroOficial = room.numero_oficial || room.room_id?.match(/\d+/)?.[0] || '';

              return (
                <div
                  key={roomId}
                  onClick={() => onSelectRoom && onSelectRoom(room)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (onSelectRoom) onSelectRoom(room);
                    }
                  }}
                  className="p-4 rounded-2xl bg-[#141419] border border-white/10 hover:border-[#F59E0B]/50 hover:bg-[#1a1a22] transition-all duration-200 cursor-pointer group active:scale-[0.98] select-none flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        {numeroOficial && (
                          <span className="text-[10px] font-bold text-[#F59E0B] tracking-wider uppercase block">
                            SALA {String(numeroOficial).padStart(2, '0')} • {piso}
                          </span>
                        )}
                        <h3 className="text-xs sm:text-sm font-bold text-[#F3F4F6] group-hover:text-[#F59E0B] transition-colors leading-snug">
                          {roomName}
                        </h3>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#9CA3AF] shrink-0">
                        {piecesCount} {piecesCount === 1 ? 'obra' : 'obras'}
                      </span>
                    </div>

                    {roomDesc && (
                      <p className="text-[11px] leading-relaxed text-[#9CA3AF] line-clamp-2">
                        {roomDesc}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-[#F59E0B] font-semibold">
                    <span className="flex items-center gap-1">
                      <Headphones className="w-3.5 h-3.5" />
                      <span>Ver sala y recorrido</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ================= RUTAS TEMÁTICAS CLÁSICAS ================= */}
        {manifest.routes && manifest.routes.length > 0 && (
          <section className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => setShowPredefinedRoutes(!showPredefinedRoutes)}
              className="w-full p-4 rounded-2xl bg-[#141419] border border-white/10 flex items-center justify-between text-xs font-bold hover:bg-[#1a1a22] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 text-white">
                <Route className="w-4 h-4 text-[#F59E0B]" />
                <span>Rutas Temáticas Recomendadas ({manifest.routes.length})</span>
              </div>
              <span className="text-[#F59E0B] text-xs">
                {showPredefinedRoutes ? 'Ocultar' : 'Explorar'}
              </span>
            </button>

            {showPredefinedRoutes && (
              <div className="space-y-2.5 animate-fadeIn">
                {manifest.routes.map((route) => (
                  <div
                    key={route.id}
                    className="p-4 rounded-2xl bg-[#141419] border border-white/10 flex items-center justify-between gap-3 shadow-md"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{route.name}</span>
                        <span className="text-[10px] font-mono font-bold text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded-full border border-[#F59E0B]/20">
                          {route.duration}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#9CA3AF] mt-1 line-clamp-1">
                        {route.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDirectStartRoute(route)}
                      className="shrink-0 px-3.5 py-2 rounded-xl bg-[#F59E0B] hover:bg-amber-400 text-black font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      Iniciar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ================= NARRATIVA ARQUITECTÓNICA CULTURAL ================= */}
        <section className="p-5 rounded-3xl bg-[#141419] border border-white/10 space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#F59E0B]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              Arquitectura de Pedro Ramírez Vázquez
            </h2>
          </div>

          <div className="space-y-3 text-xs sm:text-sm leading-relaxed text-[#9CA3AF]">
            {overviewData.narrativeParagraphs.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default SiteOverview;
