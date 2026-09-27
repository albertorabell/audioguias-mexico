import React, { useState, useMemo } from 'react';
import {
  Compass,
  MapPin,
  Clock,
  Search,
  Map as MapIcon,
  List as ListIcon,
  Landmark,
  ChevronRight,
  Sparkles,
  Layers,
  Volume2,
} from 'lucide-react';
import { SiteSummary, SiteManifest, SiteRoute, Room } from '../types';
import { MuseumMapSvg } from './MuseumMapSvg';

interface SiteOverviewProps {
  site: SiteSummary;
  manifest: SiteManifest;
  allRooms?: Room[];
  onBack?: () => void;
  onCustomizeRoute: () => void;
  onDirectStartRoute: (route: SiteRoute) => void;
  onSelectRoom?: (room: Room | any) => void;
  onOpenMapModal?: () => void;
  onOpenSearchModal?: () => void;
}

export const isRoomPlantaAlta = (r: any): boolean => {
  if (!r) return false;
  const p = String(r.piso || '').trim().toLowerCase();
  if (p === 'pa' || p === 'planta alta' || p === 'planta_alta' || p === 'piso 2' || p === 'piso2') return true;
  if (r.floor === 2 || r.floor === '2') return true;
  const num = parseInt(r.numero_oficial || r.num || r.room_id?.match(/\d+/)?.[0] || '0', 10);
  if (num >= 12 && num <= 22) return true;
  return false;
};

export const SiteOverview: React.FC<SiteOverviewProps> = ({
  site,
  manifest,
  allRooms = [],
  onBack,
  onCustomizeRoute,
  onDirectStartRoute,
  onSelectRoom,
  onOpenMapModal,
  onOpenSearchModal,
}) => {
  // Selector de piso principal: PB (Arqueología) vs PA (Etnografía)
  const [selectedFloor, setSelectedFloor] = useState<'PB' | 'PA'>('PB');

  // Vista dual: 'map' (Mapa Arquitectónico) vs 'list' (Lista de Salas)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Catálogo unificado de salas (priorizando allRooms cargadas desde rooms.json)
  const roomCatalog = useMemo<Room[]>(() => {
    if (allRooms && allRooms.length > 0) return allRooms;
    return manifest.rooms || [];
  }, [allRooms, manifest.rooms]);

  // Filtrado estricto y ordenado por piso
  const filteredRooms = useMemo(() => {
    const list = roomCatalog.filter((r) => {
      const isPA = isRoomPlantaAlta(r);
      return selectedFloor === 'PA' ? isPA : !isPA;
    });

    return list.sort((a, b) => {
      const numA = parseInt(String(a.numero_oficial || a.room_id?.match(/\d+/)?.[0] || '0'), 10);
      const numB = parseInt(String(b.numero_oficial || b.room_id?.match(/\d+/)?.[0] || '0'), 10);
      return numA - numB;
    });
  }, [roomCatalog, selectedFloor]);

  const handleRoomClickFromMap = (roomId: string) => {
    if (!onSelectRoom) return;
    const found = roomCatalog.find(
      (r) =>
        r.room_id === roomId ||
        r.svg_id === roomId ||
        (r as any).aliases?.includes(roomId) ||
        (r.numero_oficial && String(r.numero_oficial) === roomId.match(/\d+/)?.[0])
    );
    if (found) {
      onSelectRoom(found);
    } else {
      onSelectRoom({ room_id: roomId, nombre_oficial: roomId, piso: selectedFloor });
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0E] text-[#F3F4F6] flex flex-col pb-36 select-none animate-fadeIn">
      {/* ================= ENCABEZADO EDITORIAL SOBRIO ================= */}
      <header className="sticky top-0 z-30 px-4 py-3 bg-[#0B0B0E]/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30">
              AUDIOGUÍA OFICIAL
            </span>
            <span className="text-[10px] text-[#9CA3AF] hidden sm:inline">
              Bosque de Chapultepec
            </span>
          </div>
          <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
            Museo Nacional de Antropología
          </h1>
        </div>

        {/* Botón discreto de búsqueda rápida / teclado numérico */}
        {onOpenSearchModal && (
          <button
            type="button"
            onClick={onOpenSearchModal}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#141419] hover:bg-white/10 border border-white/10 text-xs font-semibold text-stone-200 transition-all active:scale-95 cursor-pointer shrink-0"
            title="Ingresar código de vitrina o buscar pieza"
          >
            <Search className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="text-[11px] font-mono text-stone-300"># Vitrina</span>
          </button>
        )}
      </header>

      {/* ================= BARRA DE CONTROL PRINCIPAL ================= */}
      <div className="max-w-4xl mx-auto w-full px-4 pt-4 space-y-4">
        {/* 1. Selector de Piso Flotante Premium */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#141419] border border-white/10 shadow-lg">
          <button
            type="button"
            onClick={() => setSelectedFloor('PB')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              selectedFloor === 'PB'
                ? 'bg-[#F59E0B] text-black shadow-md shadow-[#F59E0B]/20 font-black scale-[1.01]'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            <span className="text-sm">🏛️</span>
            <div className="text-left">
              <span className="block leading-none">Planta Baja</span>
              <span className={`text-[10px] ${selectedFloor === 'PB' ? 'text-black/80 font-bold' : 'text-[#6B7280]'}`}>
                Arqueología · 12 salas
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFloor('PA')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              selectedFloor === 'PA'
                ? 'bg-[#F59E0B] text-black shadow-md shadow-[#F59E0B]/20 font-black scale-[1.01]'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            <span className="text-sm">🧵</span>
            <div className="text-left">
              <span className="block leading-none">Planta Alta</span>
              <span className={`text-[10px] ${selectedFloor === 'PA' ? 'text-black/80 font-bold' : 'text-[#6B7280]'}`}>
                Etnografía · 11 salas
              </span>
            </div>
          </button>
        </div>

        {/* 2. Conmutador de Vista Dual: Mapa Arquitectónico vs Lista de Salas */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-white">
              {selectedFloor === 'PB' ? 'Colección Arqueológica' : 'Pueblos Originarios de México'}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#F59E0B]">
              {filteredRooms.length} salas
            </span>
          </div>

          <div className="flex p-0.5 rounded-xl bg-[#141419] border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-white/15 text-white shadow-xs'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>🗺️ Mapa</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white/15 text-white shadow-xs'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>📋 Lista</span>
            </button>
          </div>
        </div>

        {/* ================= CONTENIDO PRINCIPAL: MAPA O LISTA ================= */}
        {viewMode === 'map' ? (
          <section className="space-y-3">
            <MuseumMapSvg
              rooms={roomCatalog}
              activeFloor={selectedFloor}
              onFloorChange={setSelectedFloor}
              showFloorSelector={false}
              onSelectRoom={handleRoomClickFromMap}
            />
            <p className="text-[11px] text-center text-[#9CA3AF]">
              💡 <span className="font-semibold text-stone-200">Toca cualquier sala</span> para abrir su portada, escuchar su audio y explorar sus piezas en modo libre.
            </p>
          </section>
        ) : (
          <section className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredRooms.map((room: any) => {
                const piecesCount =
                  room.pieces_info?.length || room.featured_pieces?.length || (selectedFloor === 'PB' ? 6 : 4);
                const roomId = room.room_id || room.id;
                const roomName = room.nombre_oficial || room.name || roomId;
                const roomDesc = room.frase_gancho || room.short_description || room.introduccion_narrativa;
                const numeroOficial = room.numero_oficial || room.room_id?.match(/\d+/)?.[0] || '0';

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
                          <span className="text-[10px] font-black text-[#F59E0B] tracking-wider uppercase block">
                            SALA {String(numeroOficial).padStart(2, '0')} • {selectedFloor === 'PB' ? 'PB' : 'PA'}
                          </span>
                          <h3 className="text-sm font-bold text-[#F3F4F6] group-hover:text-[#F59E0B] transition-colors leading-snug">
                            {roomName}
                          </h3>
                        </div>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#9CA3AF] shrink-0">
                          {piecesCount} {piecesCount === 1 ? 'obra' : 'obras'}
                        </span>
                      </div>

                      {roomDesc && (
                        <p className="text-xs text-[#9CA3AF] line-clamp-2 leading-relaxed mt-1">
                          {roomDesc}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-xs text-[#9CA3AF] group-hover:text-stone-200">
                      <span className="text-[10px] font-medium flex items-center gap-1 text-[#F59E0B]">
                        <Volume2 className="w-3 h-3" /> Audio disponible
                      </span>
                      <span className="flex items-center gap-0.5 text-[11px] font-semibold">
                        Explorar sala <ChevronRight className="w-3.5 h-3.5 text-[#F59E0B]" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ================= ACCESO VOLUNTARIO A RUTAS GUIADAS ================= */}
        <section className="pt-4">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#141419] to-[#1c1a16] border border-white/10 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/20 border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B] shrink-0">
                <Compass className="w-5 h-5 fill-current" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white leading-tight">
                  ¿Prefieres un recorrido con tiempo limitado?
                </h4>
                <p className="text-[11px] text-[#9CA3AF] leading-tight mt-0.5">
                  Genera una ruta guiada de 30m, 1h o 2h con las obras cumbres.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCustomizeRoute}
              className="py-2 px-3 rounded-xl text-xs font-bold bg-[#F59E0B] hover:bg-amber-400 text-black shadow-md shadow-[#F59E0B]/20 transition-all active:scale-95 cursor-pointer shrink-0"
            >
              Diseñar Ruta
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SiteOverview;
