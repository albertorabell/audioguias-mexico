import React from 'react';
import { RouteStop } from '../types';
import { useTheme } from '../utils/ThemeContext';
import { SafeImage } from './SafeImage';
import { getAssetUrl } from '../utils/urlHelper';
import {
  Trophy,
  CheckCircle2,
  Clock,
  Layers,
  Compass,
  RotateCcw,
  Sparkles,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

interface TourCompletionViewProps {
  routeName: string;
  totalStops: number;
  estimatedMinutes: number;
  stops?: RouteStop[];
  onExploreRooms: () => void;
  onChooseRoute: () => void;
  onRepeatTour: () => void;
}

export const TourCompletionView: React.FC<TourCompletionViewProps> = ({
  routeName,
  totalStops,
  estimatedMinutes,
  stops = [],
  onExploreRooms,
  onChooseRoute,
  onRepeatTour,
}) => {
  const { isSunMode } = useTheme();

  return (
    <div
      id="tour-completion-screen"
      className={`min-h-[80vh] flex flex-col justify-between px-4 py-8 animate-fadeIn ${
        isSunMode ? 'text-[#111827]' : 'text-stone-100'
      }`}
    >
      <div className="max-w-md mx-auto w-full space-y-6">
        {/* Encabezado Celebratorio */}
        <div className="text-center space-y-3 pt-4">
          <div className="relative inline-block">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center shadow-xl shadow-amber-500/25 ring-4 ring-amber-400/20 transform hover:rotate-3 transition-transform">
              <span className="text-4xl sm:text-5xl drop-shadow-md">🏛️</span>
            </div>
            <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md animate-bounce">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          <div>
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black tracking-widest uppercase bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 mb-2">
              Misión Cumplida
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-[#111827] dark:text-stone-100">
              ¡Recorrido Completado!
            </h1>
            <p className="text-sm font-medium text-stone-600 dark:text-stone-400 mt-1 max-w-xs mx-auto">
              Has concluido con éxito el recorrido por <span className="font-bold text-amber-600 dark:text-amber-400">{routeName}</span>.
            </p>
          </div>
        </div>

        {/* Tarjeta de Estadísticas de la Ruta */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border shadow-sm ${
            isSunMode
              ? 'bg-white border-stone-200/90'
              : 'bg-stone-900/80 border-stone-800'
          }`}
        >
          <div className="grid grid-cols-2 gap-3 text-center">
            <div
              className={`p-3 rounded-xl border ${
                isSunMode ? 'bg-amber-50/60 border-amber-200' : 'bg-stone-950/60 border-stone-800'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 text-amber-600 dark:text-amber-400 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Obras Vistas</span>
              </div>
              <p className="text-2xl font-black text-[#111827] dark:text-stone-100">
                {totalStops}
              </p>
              <span className="text-[10px] text-stone-500 dark:text-stone-400">Paradas oficiales</span>
            </div>

            <div
              className={`p-3 rounded-xl border ${
                isSunMode ? 'bg-amber-50/60 border-amber-200' : 'bg-stone-950/60 border-stone-800'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 text-amber-600 dark:text-amber-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Tiempo Guiado</span>
              </div>
              <p className="text-2xl font-black text-[#111827] dark:text-stone-100">
                ~{estimatedMinutes}m
              </p>
              <span className="text-[10px] text-stone-500 dark:text-stone-400">Recorrido arqueológico</span>
            </div>
          </div>

          {/* Muestra visual de paradas completadas */}
          {stops.length > 0 && (
            <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 block mb-2">
                Hitos recorridos en esta ruta:
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                {stops.map((stop, i) => (
                  <div
                    key={i}
                    className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs bg-stone-50 dark:bg-stone-950/50 border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300"
                    title={stop.title}
                  >
                    <span className="text-[10px] font-bold text-amber-500">#{i + 1}</span>
                    <span className="font-medium max-w-[110px] truncate">{stop.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mensaje de Despedida Cultural */}
        <div
          className={`p-3.5 rounded-xl border text-xs text-center leading-relaxed ${
            isSunMode
              ? 'bg-[#FAF3EB] border-[#E8D7C8] text-[#3D2817]'
              : 'bg-amber-950/20 border-amber-900/40 text-amber-200'
          }`}
        >
          <span className="font-bold">✨ Recuerda:</span> El Museo Nacional de Antropología alberga 22 salas y más de 130 piezas maestras catalogadas. ¡Sigue explorando otras salas del recinto!
        </div>

        {/* Botones de Acción */}
        <div className="space-y-3 pt-2">
          {/* Botón Primario: Explorar salas del Museo */}
          <button
            id="btn-explore-rooms-completed"
            type="button"
            onClick={onExploreRooms}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Explorar salas del Museo</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Botón Secundario: Elegir otra ruta temática */}
          <button
            id="btn-choose-route-completed"
            type="button"
            onClick={onChooseRoute}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-xs border transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
              isSunMode
                ? 'bg-white border-stone-300 text-stone-800 hover:bg-stone-50 shadow-xs'
                : 'bg-stone-900 border-stone-700 text-stone-200 hover:bg-stone-800'
            }`}
          >
            <Compass className="w-4 h-4 text-amber-500" />
            <span>Elegir otra ruta temática</span>
          </button>

          {/* Botón Terciario: Repetir este recorrido desde el inicio */}
          <button
            id="btn-repeat-tour-completed"
            type="button"
            onClick={onRepeatTour}
            className="w-full py-2.5 text-center text-xs font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Repetir este recorrido desde el inicio</span>
          </button>
        </div>
      </div>
    </div>
  );
};
