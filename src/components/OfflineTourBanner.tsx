import React, { useState, useEffect } from 'react';
import { DownloadCloud, CheckCircle2, AlertCircle, RefreshCw, WifiOff, HardDrive } from 'lucide-react';
import {
  downloadTourOffline,
  checkIsTourCached,
  clearOfflineTourCache,
  OfflineProgress,
} from '../utils/offlineTourManager';
import { PieceData } from '../types';
import { useTheme } from '../utils/ThemeContext';

interface OfflineTourBannerProps {
  pieces: PieceData[];
  routeTitle?: string;
}

export const OfflineTourBanner: React.FC<OfflineTourBannerProps> = ({
  pieces,
  routeTitle = 'Obras Maestras Mexicas',
}) => {
  const { isSunMode } = useTheme();
  const [isCached, setIsCached] = useState(false);
  const [progress, setProgress] = useState<OfflineProgress>({
    status: 'idle',
    progressPercent: 0,
    cachedCount: 0,
    totalCount: 0,
    currentLabel: '',
  });

  useEffect(() => {
    checkIsTourCached().then((cached) => {
      setIsCached(cached);
      if (cached) {
        setProgress({
          status: 'completed',
          progressPercent: 100,
          cachedCount: pieces.length,
          totalCount: pieces.length,
          currentLabel: 'Ruta guardada localmente',
        });
      }
    });
  }, [pieces.length]);

  const handleStartDownload = async () => {
    const urls: string[] = [
      '/data/sites.json',
      '/data/routes.json',
      '/data/mna/mexica-obras-maestras.json',
      '/data/mna/salas.json',
    ];

    pieces.forEach((p) => {
      if (p.identification?.hero_image) {
        urls.push(p.identification.hero_image);
      }
      if (p.audioguide?.audio_file_url) {
        urls.push(p.audioguide.audio_file_url);
      }
    });

    const success = await downloadTourOffline(urls, (p) => {
      setProgress(p);
    });

    if (success) {
      setIsCached(true);
    }
  };

  const handleClear = async () => {
    await clearOfflineTourCache();
    setIsCached(false);
    setProgress({
      status: 'idle',
      progressPercent: 0,
      cachedCount: 0,
      totalCount: 0,
      currentLabel: '',
    });
  };

  return (
    <div
      id="offline-tour-banner"
      className={`rounded-2xl p-4 sm:p-5 border transition-all ${
        isSunMode
          ? 'bg-stone-100/80 border-stone-200 text-stone-900'
          : 'bg-[#181614] border-stone-800 text-stone-100'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Header and status text */}
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isCached
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : progress.status === 'downloading'
                ? 'bg-[#C05638]/15 text-[#C05638] dark:text-[#D96B47]'
                : isSunMode
                ? 'bg-stone-200 text-stone-700'
                : 'bg-stone-800 text-stone-300'
            }`}
          >
            {isCached ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : progress.status === 'downloading' ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <DownloadCloud className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold truncate text-stone-900 dark:text-stone-100">
                {isCached ? 'Ruta lista sin conexión' : 'Descargar recorrido para uso sin internet'}
              </h4>
              {isCached && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <HardDrive className="w-3 h-3" /> Offline ✓
                </span>
              )}
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5 leading-relaxed font-normal">
              {isCached
                ? `Todas las explicaciones e imágenes de "${routeTitle}" están guardadas en tu dispositivo.`
                : 'La señal móvil en las salas del MNA suele ser débil. Guarda la ruta con anticipación para usarla sin datos.'}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
          {isCached ? (
            <button
              id="btn-offline-recache"
              type="button"
              onClick={handleStartDownload}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition active:scale-95 flex items-center gap-1.5 ${
                isSunMode
                  ? 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                  : 'border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-300'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualizar</span>
            </button>
          ) : (
            <button
              id="btn-download-offline-tour"
              type="button"
              disabled={progress.status === 'downloading'}
              onClick={handleStartDownload}
              className="px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 flex items-center gap-2 bg-[#C05638] hover:bg-[#A9482E] dark:bg-[#D96B47] dark:hover:bg-[#C05638] text-white disabled:opacity-50"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>
                {progress.status === 'downloading' ? 'Descargando...' : 'Descargar Recorrido'}
              </span>
            </button>
          )}

          {isCached && (
            <button
              type="button"
              onClick={handleClear}
              className="p-2 rounded-xl text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition"
              title="Liberar almacenamiento offline"
              aria-label="Liberar almacenamiento offline"
            >
              <WifiOff className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Download Progress Bar */}
      {progress.status === 'downloading' && (
        <div className="mt-3.5 pt-3 border-t border-stone-200/80 dark:border-stone-800/80">
          <div className="flex justify-between items-center text-[11px] font-mono text-stone-500 dark:text-stone-400 mb-1.5">
            <span className="truncate max-w-[70%]">{progress.currentLabel}</span>
            <span className="font-bold">{progress.progressPercent}% ({progress.cachedCount}/{progress.totalCount})</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden bg-stone-200 dark:bg-stone-800">
            <div
              className="h-full rounded-full transition-all duration-300 bg-[#C05638] dark:bg-[#D96B47]"
              style={{ width: `${progress.progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Error state alert */}
      {progress.status === 'error' && (
        <div className="mt-3 p-3 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200 flex items-center gap-2 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{progress.errorMessage || 'No se pudo completar la descarga sin conexión.'}</span>
        </div>
      )}
    </div>
  );
};
