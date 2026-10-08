import React, { useState, useEffect, useMemo } from 'react';
import { DownloadCloud, CheckCircle2, AlertCircle, RefreshCw, WifiOff, } from 'lucide-react';
import {
  downloadTourOffline,
  checkIsTourCached,
  offlineSignature,
  clearOfflineTourCache,
  OfflineProgress,
} from '../utils/offlineTourManager';
import { PieceData } from '../types';
import { getAssetUrl } from '../utils/urlHelper';
import { useLanguage } from '../utils/LanguageContext';
import { resolvePieceAudio } from '../utils/audioSource';
import { track } from '../utils/analytics';

interface OfflineTourBannerProps {
  pieces: PieceData[];
  /** Piezas cuyos audios MP3 se guardan (por ejemplo las de la ruta activa). Si falta, no se descargan audios. */
  audioPieces?: PieceData[];
  routeTitle?: string;
}

export const OfflineTourBanner: React.FC<OfflineTourBannerProps> = ({
  pieces,
  audioPieces = [],
  routeTitle,
}) => {
  const { strings, currentLanguage } = useLanguage();
  const t = strings.offline;

  // MP3 que se pueden guardar para esta ruta, en el idioma elegido (y los de pago solo si hay pase con clave)
  const { audioUrls, audioMb } = useMemo(() => {
    const seen: Record<string, number> = {};
    for (const p of audioPieces) {
      for (const mode of ['expres', 'inmersion'] as const) {
        const a = resolvePieceAudio(p, currentLanguage, mode);
        if (a) seen[a.url] = a.seconds || 0;
      }
    }
    const urls = Object.keys(seen);
    // 48 kbps = 6 000 bytes por segundo
    const bytes = urls.reduce((n: number, u: string) => n + seen[u] * 6000, 0);
    return { audioUrls: urls, audioMb: Math.round(bytes / 1_000_000) };
  }, [audioPieces, currentLanguage]);
  const [isCached, setIsCached] = useState(false);
  const [progress, setProgress] = useState<OfflineProgress>({
    status: 'idle',
    progressPercent: 0,
    cachedCount: 0,
    totalCount: 0,
    currentLabel: '',
  });

  // Todo lo que se guarda: datos, fotos de las piezas y los MP3 de arriba
  const urls = useMemo(() => {
    const list: string[] = [
      getAssetUrl('data/sites.json'),
      getAssetUrl('data/pieces.json'),
      getAssetUrl('data/rooms.json'),
      getAssetUrl('data/mna/site.json'),
      getAssetUrl('data/mna/pieces.json'),
      getAssetUrl('data/mna/rooms.json'),
    ];
    pieces.forEach((p) => {
      const img = p.image_filename || p.identification?.hero_image;
      if (img) list.push(/^(https?:|data:)/i.test(img) ? img : getAssetUrl(`images/pieces/${img}`));
      if (p.audioguide?.audio_file_url) list.push(p.audioguide.audio_file_url);
    });
    audioUrls.forEach((url) => list.push(url));
    return Array.from(new Set(list));
  }, [pieces, audioUrls]);
  // Huella de la lista: si cambia (otro idioma, se compró el pase, hay obras nuevas) se vuelve a ofrecer la descarga
  const signature = useMemo(() => offlineSignature(urls), [urls]);

  useEffect(() => {
    let alive = true;
    checkIsTourCached(signature).then((cached) => {
      if (!alive) return;
      setIsCached(cached);
      setProgress(
        cached
          ? { status: 'completed', progressPercent: 100, cachedCount: pieces.length, totalCount: pieces.length, currentLabel: t.savedLabel }
          : { status: 'idle', progressPercent: 0, cachedCount: 0, totalCount: 0, currentLabel: '' }
      );
    });
    return () => {
      alive = false;
    };
  }, [signature]);

  const handleStartDownload = async () => {
    track('offline_download');
    const success = await downloadTourOffline(urls, (p) => {
      setProgress(p);
    }, signature);

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

  const downloading = progress.status === 'downloading';
  return (
    <div id="offline-tour-banner" className="rounded-2xl bg-surface border border-line p-4">
      <div className="flex items-start gap-3">
        <span
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
            isCached ? 'bg-jade/15 text-jade' : 'bg-raised text-ink-2'
          }`}
        >
          {isCached ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : downloading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <DownloadCloud className="w-5 h-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="text-ui font-bold text-ink">{isCached ? t.readyTitle : t.downloadTitle}</h4>
          <p className="text-cap text-ink-3 mt-1 leading-relaxed">
            {isCached ? t.cachedDesc(routeTitle) : t.notCachedDesc}
            {!isCached && audioUrls.length > 0 && ` ${t.audioSize(audioUrls.length, audioMb)}`}
          </p>
        </div>
      </div>

      {downloading && (
        <div className="mt-4">
          <div className="flex justify-between items-center text-cap text-ink-3 mb-1.5 tabular-nums">
            <span className="truncate max-w-[70%]">{progress.currentLabel}</span>
            <span className="font-semibold">{progress.progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full overflow-hidden bg-raised">
            <div className="h-full rounded-full transition-all duration-300 bg-jade" style={{ width: `${progress.progressPercent}%` }} />
          </div>
        </div>
      )}

      {progress.status === 'error' && (
        <p className="mt-3 text-cap text-tezontle flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{progress.errorMessage || t.failed}</span>
        </p>
      )}

      <div className="mt-4 pl-[3.25rem] flex items-center gap-2">
        {isCached ? (
          <>
            <button id="btn-offline-recache" type="button" onClick={handleStartDownload} className="btn-secondary min-h-11 text-cap">
              <RefreshCw className="w-4 h-4" />
              {t.update}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="min-h-11 px-3 rounded-full text-cap font-semibold text-ink-3 inline-flex items-center gap-1.5 cursor-pointer active:bg-raised"
              title={t.clearTitle}
            >
              <WifiOff className="w-4 h-4" />
              {t.clearShort}
            </button>
          </>
        ) : (
          <button
            id="btn-download-offline-tour"
            type="button"
            disabled={downloading}
            onClick={handleStartDownload}
            className="btn-secondary min-h-11 text-cap disabled:opacity-50"
          >
            <DownloadCloud className="w-4 h-4" />
            {downloading ? t.downloading : t.download}
          </button>
        )}
      </div>
    </div>
  );
};
