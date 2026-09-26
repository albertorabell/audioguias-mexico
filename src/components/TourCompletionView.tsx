import React from 'react';
import { RouteStop } from '../types';
import {
  Sparkles,
  MapPin,
  Clock,
  Compass,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Landmark,
} from 'lucide-react';

interface TourCompletionViewProps {
  routeName: string;
  totalStops: number;
  estimatedMinutes: number;
  stops?: RouteStop[];
  onExploreRooms: () => void;
  onChooseRoute: () => void;
  onRepeatTour: () => void;
  onOpenMap?: () => void;
}

export const TourCompletionView: React.FC<TourCompletionViewProps> = ({
  routeName,
  totalStops,
  estimatedMinutes,
  stops = [],
  onExploreRooms,
  onChooseRoute,
  onRepeatTour,
  onOpenMap,
}) => {
  // Calcular cantidad de salas distintas visitadas
  const distinctRooms = new Set(
    stops.map((s) => s.room_id || s.room_zone).filter(Boolean)
  ).size || 1;

  return (
    <div
      id="tour-completion-screen"
      className="min-h-[82vh] flex flex-col justify-between px-5 py-8 bg-[#0B0B0E] text-[#F3F4F6] animate-fadeIn select-none"
    >
      <div className="max-w-md mx-auto w-full space-y-6">
        {/* ================= 7. INSIGNIA DORADA CONMEMORATIVA DEL MNA ================= */}
        <div className="text-center space-y-3 pt-2">
          <div className="relative inline-block">
            {/* Resplandor radial dorado */}
            <div className="absolute inset-0 bg-[#F59E0B]/20 rounded-full blur-2xl" />

            <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto rounded-3xl bg-gradient-to-tr from-[#B45309] via-[#F59E0B] to-[#FDE68A] flex items-center justify-center shadow-2xl shadow-[#F59E0B]/30 ring-4 ring-[#F59E0B]/30 transform hover:scale-105 transition-transform duration-300">
              <span className="text-4xl sm:text-5xl drop-shadow-md">🏛️</span>
            </div>

            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-[#10B981] text-black flex items-center justify-center shadow-lg font-bold">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
          </div>

          <div>
            <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/40 mb-2">
              RECORRIDO CONCLUIDO
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              ¡Recorrido Completado!
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#9CA3AF] mt-1 max-w-xs mx-auto leading-relaxed">
              Has recorrido con éxito la ruta de{' '}
              <span className="font-bold text-[#F59E0B]">{routeName}</span> en el Museo Nacional de Antropología.
            </p>
          </div>
        </div>

        {/* ================= RESUMEN DEL RECORRIDO (ESTADÍSTICAS) ================= */}
        <div className="p-5 rounded-3xl bg-[#141419] border border-white/10 shadow-2xl space-y-4">
          <div className="grid grid-cols-3 gap-2.5 text-center">
            {/* Salas visitadas */}
            <div className="p-3 rounded-2xl bg-[#0B0B0E] border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-center gap-1 text-[#F59E0B] mb-1">
                <Landmark className="w-3.5 h-3.5" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#6B7280]">
                  Salas
                </span>
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">
                {distinctRooms}
              </p>
              <span className="text-[9px] text-[#9CA3AF]">exploradas</span>
            </div>

            {/* Piezas exploradas */}
            <div className="p-3 rounded-2xl bg-[#0B0B0E] border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-center gap-1 text-[#F59E0B] mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#6B7280]">
                  Piezas
                </span>
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">
                {totalStops}
              </p>
              <span className="text-[9px] text-[#9CA3AF]">visitadas</span>
            </div>

            {/* Tiempo total */}
            <div className="p-3 rounded-2xl bg-[#0B0B0E] border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-center gap-1 text-[#F59E0B] mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#6B7280]">
                  Tiempo
                </span>
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">
                ~{estimatedMinutes}m
              </p>
              <span className="text-[9px] text-[#9CA3AF]">guiado</span>
            </div>
          </div>

          {/* Carrusel horizontal de obras completadas */}
          {stops.length > 0 && (
            <div className="pt-3 border-t border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9CA3AF] block mb-2">
                Hitos arqueológicos de este recorrido:
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {stops.map((stop, i) => (
                  <div
                    key={i}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0B0B0E] border border-white/10 text-xs text-stone-200"
                  >
                    <span className="text-[10px] font-bold text-[#F59E0B]">#{i + 1}</span>
                    <span className="font-semibold max-w-[120px] truncate">{stop.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Nota cultural de continuidad */}
        <div className="p-3.5 rounded-2xl bg-[#141419] border border-white/5 text-xs text-center text-[#9CA3AF] leading-relaxed">
          <span className="text-[#F59E0B] font-bold">✨ Recuerda:</span> El MNA cuenta con 22 salas temáticas en Planta Baja y Planta Alta. Puedes continuar tu visita eligiendo otra sala o abriendo el mapa arquitectónico.
        </div>

        {/* ================= DOS BOTONES PRINCIPALES DE BORDES REDONDEADOS ================= */}
        <div className="space-y-3 pt-1">
          {/* Botón 1: Explorar otra sala */}
          <button
            id="btn-explore-rooms-completed"
            type="button"
            onClick={onExploreRooms}
            className="w-full py-4 px-5 rounded-2xl font-bold text-sm bg-[#F59E0B] hover:bg-amber-400 text-black shadow-xl shadow-[#F59E0B]/25 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 fill-current" />
            <span>Explorar otra sala del Museo</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Botón 2: Volver al Mapa */}
          <button
            id="btn-back-to-map-completed"
            type="button"
            onClick={onOpenMap || onChooseRoute}
            className="w-full py-3.5 px-5 rounded-2xl font-bold text-xs bg-[#141419] hover:bg-[#1f1f26] text-white border border-white/10 shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Compass className="w-4 h-4 text-[#F59E0B]" />
            <span>Volver al Plano y Mapa Arquitectónico</span>
          </button>

          {/* Botón terciario de texto: Repetir este recorrido desde el inicio */}
          <button
            id="btn-repeat-tour-completed"
            type="button"
            onClick={onRepeatTour}
            className="w-full py-2 text-center text-xs font-semibold text-[#6B7280] hover:text-[#F3F4F6] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Repetir este recorrido desde el inicio</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TourCompletionView;
