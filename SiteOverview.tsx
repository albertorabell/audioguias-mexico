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
  ArrowLeft,
  Rocket,
} from 'lucide-react';
import { SiteSummary, SiteManifest, SiteRoute, Room, PieceData } from '../types';
import { MuseumMapSvg } from './MuseumMapSvg';
import { t } from '../utils/i18nStrings';

interface SiteOverviewProps {
  site: SiteSummary;
  manifest: SiteManifest;
  allRooms?: Room[];
  pieces?: PieceData[];
  onBack?: () => void;
  onCustomizeRoute: () => void;
  onDirectStartRoute: (route: SiteRoute) => void;
  onSelectRoom?: (room: Room | any) => void;
  onOpenMapModal?: () => void;
  onOpenSearchModal?: () => void;
}

export const SiteOverview: React.FC<SiteOverviewProps> = ({
  site,
  manifest,
  allRooms = [],
  pieces = [],
  onBack,
  onCustomizeRoute,
  onDirectStartRoute,
  onSelectRoom,
  onOpenMapModal,
  onOpenSearchModal,
}) => {
  // Selector de piso: PB vs PA
  const [selectedFloor, setSelectedFloor] = useState<'PB' | 'PA'>('PB');

  // Vista: 'map' vs 'list'
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Catálogo unificado de salas (priorizando allRooms cargadas desde rooms.json)
  const roomCatalog = useMemo<Room[]>(() => {
    if (allRooms && allRooms.length > 0) return allRooms;
    return manifest.rooms || [];
  }, [allRooms, manifest.rooms]);

  // Dynamic counts calculated from rooms.json
  const pbCount = useMemo(() => {
    return roomCatalog.filter((r) => r.piso === 'PB').length;
  }, [roomCatalog]);

  const paCount = useMemo(() => {
    return roomCatalog.filter((r) => r.piso === 'PA').length;
  }, [roomCatalog]);

  const totalRoomsCount = roomCatalog.length;

  // Filtrado y ordenado por piso usando el campo piso exacto
  const filteredRooms = useMemo(() => {
    const list = roomCatalog.filter((r) => r.piso === selectedFloor);

    return list.sort((a, b) => {
      const numA = parseInt(String(a.numero_oficial || a.room_id.match(/\d+/)?.[0] || '0'), 10);
      const numB = parseInt(String(b.numero_oficial || b.room_id.match(/\d+/)?.[0] || '0'), 10);
      return numA - numB;
    });
  }, [roomCatalog, selectedFloor]);

  // Count of real pieces per room from pieces.json
  const piecesCountPerRoom = useMemo(() => {
    const map = new Map<string, number>();
    pieces.forEach((p) => {
      const rId = p.room_id;
      map.set(rId, (map.get(rId) || 0) + 1);
    });
    return map;
  }, [pieces]);

  const handleRoomClickFromMap = (roomId: string) => {
    if (!onSelectRoom) return;
    const found = roomCatalog.find(
      (r) =>
        r.room_id === roomId ||
        r.svg_id === roomId ||
        (r.aliases && r.aliases.includes(roomId))
    );
    if (found) {
      onSelectRoom(found);
    } else {
      onSelectRoom({ room_id: roomId, nombre_oficial: roomId, piso: selectedFloor });
    }
  };

  const museumName = site?.name || manifest?.name || t.nationalMuseumTitle;

  return (
    <div className="min-h-screen bg-[#0B0B0E] text-[#F3F4F6] flex flex-col pb-36 select-none animate-fadeIn">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 px-4 py-3 bg-[#0B0B0E]/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 -ml-1 rounded-xl bg-white/5 hover:bg-white/10 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer shrink-0 border border-white/10"
              title="Volver a la selección de recintos"
              aria-label="Volver a inicio"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/20 text-[#F59E0B] border border-amber-500/30">
                {t.officialBadge}
              </span>
              <span className="text-[10px] text-[#9CA3AF] hidden sm:inline">
                {site?.location || 'Ciudad de México'}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
              {museumName}
            </h1>
          </div>
        </div>

        {/* Vitrina Search Button */}
        {onOpenSearchModal && (
          <button
            type="button"
            onClick={onOpenSearchModal}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-[#141419] hover:bg-white/10 border border-white/10 text-xs font-semibold text-stone-200 transition-all active:scale-95 cursor-pointer shrink-0"
            title="Ingresar código de vitrina o buscar pieza"
          >
            <Search className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span className="text-[11px] font-medium text-stone-300">Buscar</span>
          </button>
        )}
      </header>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto w-full px-4 pt-4 space-y-4">
        {/* Selector de Piso con Conteo Real de rooms.json */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#141419] border border-white/10 shadow-lg">
          <button
            type="button"
            onClick={() => setSelectedFloor('PB')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              selectedFloor === 'PB'
                ? 'bg-[#F59E0B] text-black shadow-md shadow-amber-500/20 font-black scale-[1.01]'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            <span className="text-sm">🏛️</span>
            <div className="text-left">
              <span className="block leading-none">Planta Baja</span>
              <span className={`text-[10px] ${selectedFloor === 'PB' ? 'text-black/80 font-bold' : 'text-[#6B7280]'}`}>
                Arqueología · {pbCount} salas
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedFloor('PA')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              selectedFloor === 'PA'
                ? 'bg-[#F59E0B] text-black shadow-md shadow-amber-500/20 font-black scale-[1.01]'
                : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            <span className="text-sm">🧵</span>
            <div className="text-left">
              <span className="block leading-none">Planta Alta</span>
              <span className={`text-[10px] ${selectedFloor === 'PA' ? 'text-black/80 font-bold' : 'text-[#6B7280]'}`}>
                Etnografía · {paCount} salas
              </span>
            </div>
          </button>
        </div>

        {/* Switch Vista Mapa vs Lista */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#9CA3AF]">
            <Compass className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>
              {totalRoomsCount} salas en el museo
            </span>
          </div>

          <div className="flex p-0.5 rounded-xl bg-[#141419] border border-white/10">
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-amber-500/20 text-[#F59E0B] border border-amber-500/30'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Plano</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-amber-500/20 text-[#F59E0B] border border-amber-500/30'
                  : 'text-[#9CA3AF] hover:text-white'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
          </div>
        </div>

        {/* Vista Vectorial del Plano */}
        {viewMode === 'map' ? (
          <div className="space-y-3">
            <MuseumMapSvg
              rooms={roomCatalog}
              activeFloor={selectedFloor}
              onFloorChange={setSelectedFloor}
              showFloorSelector={false}
              onSelectRoom={handleRoomClickFromMap}
            />
            <p className="text-[11px] text-center text-stone-400">
              💡 Toca cualquier sala en el plano para abrirla e iniciar su recorrido
            </p>
          </div>
        ) : (
          /* Vista en Lista de Salas */
          <div className="space-y-2.5">
            {filteredRooms.map((room) => {
              const numStr = room.numero_oficial
                ? String(room.numero_oficial).padStart(2, '0')
                : '';
              const roomPiecesCount = piecesCountPerRoom.get(room.room_id) || 0;

              return (
                <div
                  key={room.room_id}
                  onClick={() => onSelectRoom && onSelectRoom(room)}
                  role="button"
                  tabIndex={0}
                  className="p-3.5 rounded-2xl bg-[#141419] border border-white/10 hover:border-amber-500/40 hover:bg-[#1a1a24] transition-all flex items-center justify-between gap-3 cursor-pointer group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#0B0B0E] border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-[#F59E0B] shrink-0 group-hover:border-amber-500/40">
                      {numStr}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-amber-400 transition-colors">
                          {room.nombre_oficial}
                        </h4>
                        <span className="text-[10px] font-mono text-stone-400 shrink-0">
                          {roomPiecesCount} obras
                        </span>
                      </div>
                      {room.frase_gancho && (
                        <p className="text-[11px] text-[#9CA3AF] truncate mt-0.5">
                          {room.frase_gancho}
                        </p>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              );
            })}
          </div>
        )}

        {/* CTA Diseñar Recorrido Personalizado */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onCustomizeRoute}
            className="w-full py-4 px-5 rounded-2xl bg-[#141419] hover:bg-[#1c1c24] border border-white/10 hover:border-amber-500/50 text-white font-bold text-xs sm:text-sm flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer shadow-lg group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-[#F59E0B] flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block font-black text-white group-hover:text-amber-400 transition-colors">
                  ¿Tienes poco tiempo? Diseña tu Ruta
                </span>
                <span className="text-[11px] text-[#9CA3AF] font-normal">
                  Filtra por tiempo (30 min, 1h, 2h) e intereses culturales
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#F59E0B]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SiteOverview;
