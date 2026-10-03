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
  Home,
  Sliders,
} from 'lucide-react';
import { formatRouteDuration } from '../utils/routeOptimizer';
import { useStrings } from '../utils/LanguageContext';

interface TourCompletionViewProps {
  routeName: string;
  totalStops: number;
  estimatedMinutes: number;
  stops?: RouteStop[];
  onExploreRooms: () => void;
  onChooseRoute: () => void;
  onGoHome: () => void;
  onRepeatTour?: () => void;
  onOpenMap?: () => void;
}

export const TourCompletionView: React.FC<TourCompletionViewProps> = ({
  routeName,
  totalStops,
  estimatedMinutes,
  stops = [],
  onExploreRooms,
  onChooseRoute,
  onGoHome,
  onRepeatTour,
  onOpenMap,
}) => {
  const t = useStrings().tour;
  // Number of distinct rooms visited
  const distinctRooms = new Set(
    stops.map((s) => s.room_id || s.room_zone).filter(Boolean)
  ).size || 1;

  return (
    <div
      id="tour-completion-screen"
      className="min-h-[85vh] flex flex-col justify-between px-5 py-8 bg-[#0B0B0E] text-[#F3F4F6] animate-fadeIn select-none"
    >
      <div className="max-w-md mx-auto w-full space-y-6">
        {/* Insignia dorada conmemorativa */}
        <div className="text-center space-y-3 pt-2">
          <div className="relative inline-block">
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
              {t.completedBadge}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {t.completedTitle}
            </h1>
            <p className="text-xs sm:text-sm font-medium text-[#9CA3AF] mt-1 max-w-xs mx-auto leading-relaxed">
              {t.completedDesc(routeName)}
            </p>
          </div>
        </div>

        {/* Resumen de estadísticas */}
        <div className="p-5 rounded-3xl bg-[#141419] border border-white/10 shadow-2xl space-y-4">
          <div className="grid grid-cols-3 gap-2.5 text-center">
            {/* Salas visitadas */}
            <div className="p-3 rounded-2xl bg-[#0B0B0E] border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-center gap-1 text-[#F59E0B] mb-1">
                <Landmark className="w-3.5 h-3.5" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#6B7280]">
                  {t.rooms}
                </span>
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">
                {distinctRooms}
              </p>
              <span className="text-[9px] text-[#9CA3AF]">{t.roomsSub}</span>
            </div>

            {/* Piezas exploradas */}
            <div className="p-3 rounded-2xl bg-[#0B0B0E] border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-center gap-1 text-[#F59E0B] mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#6B7280]">
                  {t.pieces}
                </span>
              </div>
              <p className="text-2xl font-bold text-white tabular-nums">
                {totalStops}
              </p>
              <span className="text-[9px] text-[#9CA3AF]">{t.piecesSub}</span>
            </div>

            {/* Tiempo recorrido */}
            <div className="p-3 rounded-2xl bg-[#0B0B0E] border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-center gap-1 text-[#F59E0B] mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#6B7280]">
                  {t.time}
                </span>
              </div>
              <p className="text-lg font-bold text-white tabular-nums truncate">
                {formatRouteDuration(estimatedMinutes)}
              </p>
              <span className="text-[9px] text-[#9CA3AF]">{t.timeSub}</span>
            </div>
          </div>
        </div>

        {/* ================= TRES BOTONES CLAROS SEGÚN REQUERIMIENTO =================
            1. "Volver al museo"
            2. "Diseñar otra ruta"
            3. "Ir al inicio"
        */}
        <div className="space-y-3 pt-2">
          {/* Botón 1: Volver al explorador */}
          <button
            id="btn-back-to-explorer"
            type="button"
            onClick={onExploreRooms}
            className="w-full py-4 px-5 rounded-2xl font-black text-sm bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-xl shadow-amber-500/25 active:scale-95 transition flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <BookOpen className="w-4 h-4 fill-current" />
            <span>{t.backToExplorer}</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Botón 2: Diseñar otra ruta */}
          <button
            id="btn-design-another-route"
            type="button"
            onClick={onChooseRoute}
            className="w-full py-3.5 px-5 rounded-2xl font-bold text-xs bg-[#141419] hover:bg-[#1c1c24] text-white border border-white/10 shadow-lg active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-[#F59E0B]" />
            <span>{t.designAnother}</span>
          </button>

          {/* Botón 3: Ir al inicio */}
          <button
            id="btn-go-home"
            type="button"
            onClick={onGoHome}
            className="w-full py-3 px-5 rounded-2xl font-bold text-xs bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border border-white/5 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>{t.goHome}</span>
          </button>

          {/* Repetir este recorrido opcional */}
          {onRepeatTour && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onRepeatTour}
                className="text-xs text-stone-500 hover:text-stone-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t.repeat}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TourCompletionView;
