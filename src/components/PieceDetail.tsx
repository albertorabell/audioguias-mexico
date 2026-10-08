import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Check, ChevronRight, Lock, Maximize2, Search, X, AudioLines, Smartphone, Flag } from 'lucide-react';
import { Piece, PieceData, SpecItem, PieceSpecsObject } from '../types';
import { PieceImage } from './PieceImage';
import { ImageZoomModal } from './ImageZoomModal';
import { ttsPlayer, TTSState } from '../utils/ttsPlayer';
import { getAssetUrl } from '../utils/urlHelper';
import { useLanguage } from '../utils/LanguageContext';
import { scriptLanguage } from '../i18n/content';
import { resolvePieceAudio } from '../utils/audioSource';
import { useBackClose } from '../utils/useBackClose';
import { TopBar } from './ui/TopBar';
import { PassButton } from './ui/HeaderControls';
import { PieceDock } from './PieceDock';

export interface NextInfo {
  kind: 'piece' | 'room' | 'finish';
  eyebrow: string;
  title: string;
  detail?: string;
  imageFilename?: string;
  pieceId?: string;
}

interface PieceDetailProps {
  piece: Piece;
  hasPass: boolean;
  onOpenPaywall: () => void;
  onBack: () => void;
  onOpenSearch: () => void;
  /** Dónde está la persona: "Sala 06 · Mexica" o el nombre del recorrido. */
  contextTitle: string;
  /** "3 de 11" o "Parada 3 de 8". */
  positionLabel: string;
  onContextClick?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  next?: NextInfo | null;
  /** Otras piezas de la misma sala (se muestran solo dentro de un recorrido). */
  siblings?: PieceData[];
  onSelectSibling?: (pieceId: string) => void;
}

type Mode = 'expres' | 'inmersion';
const MODE_KEY = 'audioguias_modo';
const readMode = (): Mode => {
  try {
    return localStorage.getItem(MODE_KEY) === 'inmersion' ? 'inmersion' : 'expres';
  } catch {
    return 'expres';
  }
};

const LABEL_RE = /^\s*(mito|realidad|myth|reality|mythe|réalité|mit|rzeczywistość)\s*:\s*/i;
const stripLabel = (s: string) => s.replace(LABEL_RE, '');

const fmtClock = (sec: number) => {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/**
 * Ficha de una pieza, pensada como la cédula de un museo: foto, título, la explicación (corta o completa,
 * lo que se lee es lo que se escucha), qué buscar en la vitrina, mito y realidad, ficha técnica y qué sigue.
 */
export const PieceDetail: React.FC<PieceDetailProps> = ({
  piece,
  hasPass,
  onOpenPaywall,
  onBack,
  onOpenSearch,
  contextTitle,
  positionLabel,
  onContextClick,
  onPrev,
  onNext,
  next,
  siblings = [],
  onSelectSibling,
}) => {
  const { strings, currentLanguage } = useLanguage();
  const tp = strings.piece;
  const u = strings.ui;

  const [mode, setModeState] = useState<Mode>(readMode);
  const [tts, setTts] = useState<TTSState>(ttsPlayer.getState());
  const [finished, setFinished] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);
  // "Atrás" del teléfono cierra la foto ampliada en vez de salir de la pieza
  useBackClose(zoomOpen, () => setZoomOpen(false));
  const [found, setFound] = useState<Record<number, boolean>>({});

  const pieceId = piece.piece_id || piece.id || '';
  const titulo = piece.titulo || piece.title || tp.defaultTitle;
  const fraseGancho = piece.frase_gancho || '';
  const puente = piece.puente_narrativo || '';
  const guionCorto = piece.guion_corto || piece.summary_30s || fraseGancho || strings.player.defaultPieceSummary;
  const guionLargo = piece.guion_largo || piece.audioguide?.audio_script || guionCorto;
  const imageFilename = piece.image_filename || piece.identification?.hero_image || '';
  const isFree = piece.is_free !== undefined ? piece.is_free : !piece.is_premium;
  const locked = !isFree && !hasPass;
  const readLang = scriptLanguage(piece, currentLanguage);

  const audio = useMemo(
    () => ({
      expres: resolvePieceAudio(piece, currentLanguage, 'expres'),
      inmersion: resolvePieceAudio(piece, currentLanguage, 'inmersion'),
    }),
    [piece, currentLanguage, hasPass]
  );
  const seconds = {
    expres: audio.expres?.seconds || ttsPlayer.calculateDuration(guionCorto),
    inmersion: audio.inmersion?.seconds || ttsPlayer.calculateDuration(guionLargo),
  };
  const durationLabel = (s: number) => (s < 60 ? u.seconds(s) : u.minutes(Math.max(1, Math.round(s / 60))));
  const sameText = guionLargo.trim() === guionCorto.trim();

  // Estado del audio de ESTA pieza
  useEffect(() => {
    const unsubscribe = ttsPlayer.subscribe((_, state) => {
      setTts(state);
      if (state.errorMessage) setErrorMessage(state.errorMessage);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Al cambiar de pieza (o salir) se detiene el audio y se vuelve arriba
  useEffect(() => {
    setFinished(false);
    setErrorMessage(null);
    setFound({});
    return () => {
      ttsPlayer.stop();
    };
  }, [pieceId]);

  const isThis = !finished && tts.pieceId === pieceId && (tts.isPlaying || tts.isPaused);
  const isPlaying = isThis && tts.isPlaying;
  const started = isThis;
  const timeLabel = started ? `${fmtClock(tts.currentTime)} / ${fmtClock(tts.duration)}` : durationLabel(seconds[mode]);

  const setMode = (m: Mode) => {
    if (m === mode) return;
    if (isThis) ttsPlayer.stop();
    setModeState(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      /* sin almacenamiento */
    }
  };

  const togglePlay = () => {
    if (locked) {
      onOpenPaywall();
      return;
    }
    if (isPlaying) {
      ttsPlayer.pause();
      return;
    }
    if (isThis && tts.isPaused) {
      ttsPlayer.resume();
      return;
    }
    setErrorMessage(null);
    setFinished(false);
    ttsPlayer.clearErrorMessage();
    // Si no se pudo leer (sin voz, error) no cuenta como escuchada
    const onEnd = () => {
      if (!ttsPlayer.getState().errorMessage) setFinished(true);
    };
    ttsPlayer.play(mode === 'expres' ? guionCorto : guionLargo, titulo, onEnd, {
      roomName: contextTitle,
      artworkUrl: imageFilename ? getAssetUrl(`images/pieces/${imageFilename}`) : undefined,
      pieceId,
      mode,
      audioUrl: audio[mode]?.url,
      lang: readLang,
    });
  };

  const retos: string[] = useMemo(() => {
    if (piece.retos_observacion?.length) return piece.retos_observacion.filter(Boolean);
    if (piece.observation_challenges?.length)
      return piece.observation_challenges.map((oc) => (oc.titulo ? `${oc.titulo}: ${oc.descripcion}` : oc.descripcion));
    return [];
  }, [piece.retos_observacion, piece.observation_challenges]);
  const foundCount = Object.values(found).filter(Boolean).length;

  const specs = useMemo<[string, string][]>(() => {
    if (piece.especificaciones && typeof piece.especificaciones === 'object') {
      const entries = Object.entries(piece.especificaciones)
        .filter(([k, v]) => k && v !== undefined && v !== null && String(v).trim() !== '')
        .map(([k, v]) => [k, String(v)] as [string, string]);
      if (entries.length) return entries;
    }
    if (Array.isArray(piece.specs)) return (piece.specs as SpecItem[]).filter((s) => s.label && s.value).map((s) => [s.label, s.value]);
    if (piece.specs) {
      const o = piece.specs as PieceSpecsObject;
      const res: [string, string][] = [];
      if (o.culture) res.push([tp.specLabels.culture, o.culture]);
      if (o.period || o.age) res.push([tp.specLabels.period, o.period || o.age || '']);
      if (o.material) res.push([tp.specLabels.material, o.material]);
      if (o.dimensions || o.weight) res.push([tp.specLabels.dimensions, o.dimensions || o.weight || '']);
      if (o.provenance) res.push([tp.specLabels.provenance, o.provenance]);
      return res.filter(([, v]) => Boolean(v));
    }
    return [];
  }, [piece.especificaciones, piece.specs, tp]);

  const mito = useMemo(() => {
    if (piece.faq_mito?.pregunta && piece.faq_mito?.respuesta) return piece.faq_mito;
    if (piece.faq?.length) return { pregunta: piece.faq[0].question, respuesta: piece.faq[0].answer };
    return null;
  }, [piece.faq_mito, piece.faq]);

  const hasAudioFile = !!audio[mode];
  const otherSiblings = siblings.filter((p) => p.piece_id !== pieceId);

  return (
    <div className="min-h-dvh bg-bg text-ink pb-dock">
      <TopBar
        id="museum-top-header"
        onBack={onBack}
        eyebrow={positionLabel}
        title={contextTitle}
        onTitleClick={onContextClick}
        right={
          <>
            <button type="button" id="btn-nav-quick-search" onClick={onOpenSearch} aria-label={strings.chrome.nav.searchAria} className="btn-icon text-ink-2">
              <Search className="w-5 h-5" strokeWidth={1.9} />
            </button>
            <PassButton hasPass={hasPass} onClick={onOpenPaywall} />
          </>
        }
      />

      {errorMessage && (
        <div role="alert" className="sticky top-[calc(env(safe-area-inset-top,0px)+3.75rem)] z-20 mx-4 mt-3 p-3.5 rounded-2xl bg-raised border border-tezontle/50 flex items-start gap-3 shadow-xl shadow-black/30 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-tezontle shrink-0 mt-0.5" />
          <p className="flex-1 text-ui leading-snug text-ink">{errorMessage}</p>
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              ttsPlayer.clearErrorMessage();
            }}
            aria-label={tp.closeNotice}
            className="btn-icon -m-2 text-ink-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <article id="piece-detail-container">
        <figure className="relative">
          <div className="relative w-full aspect-[4/3] max-h-[52dvh] bg-raised overflow-hidden">
            <PieceImage
              filename={imageFilename}
              pieceId={pieceId}
              alt={titulo}
              pieceTitle={titulo}
              onClick={() => setZoomOpen(true)}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              aria-label={tp.zoomAria}
              className="absolute right-3 bottom-3 w-11 h-11 rounded-full bg-black/55 text-white backdrop-blur-md flex items-center justify-center cursor-pointer active:scale-95"
            >
              <Maximize2 className="w-[1.1rem] h-[1.1rem]" />
            </button>
            {locked && (
              <button
                type="button"
                onClick={onOpenPaywall}
                className="absolute left-3 top-3 h-8 px-3 rounded-full bg-oro text-on-oro text-cap font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" strokeWidth={2.5} />
                {u.piece.paidAudio}
              </button>
            )}
          </div>
          {piece.foto_autor && (
            <figcaption className="px-5 pt-1.5 text-right text-[12px] text-ink-3">
              {tp.photoBy}{' '}
              {piece.foto_url && /^https?:\/\//i.test(piece.foto_url) ? (
                <a href={piece.foto_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                  {piece.foto_autor}
                </a>
              ) : (
                piece.foto_autor
              )}
              {piece.foto_licencia ? ` · ${piece.foto_licencia}` : ''}
            </figcaption>
          )}
        </figure>

        <header className="px-5 pt-5">
          <h1 className="font-serif text-[2.125rem] leading-[1.06] font-medium tracking-[-0.02em] text-balance">{titulo}</h1>
          {fraseGancho && fraseGancho !== guionCorto && (
            <p className="mt-3 font-serif italic text-[1.1875rem] leading-snug text-ink-2 text-pretty">{fraseGancho}</p>
          )}
        </header>

        {/* Versión: lo que se lee es lo que se escucha */}
        <section className="px-5 mt-6" aria-label={u.piece.versionAria}>
          {!sameText && (
            <div role="radiogroup" aria-label={u.piece.versionAria} className="grid grid-cols-2 p-1 rounded-2xl bg-surface border border-line">
              {(['expres', 'inmersion'] as Mode[]).map((m) => {
                const on = mode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    id={m === 'expres' ? 'btn-mode-short' : 'btn-mode-full'}
                    onClick={() => setMode(m)}
                    className={`min-h-12 rounded-xl px-3 cursor-pointer transition-colors ${on ? 'bg-raised text-ink shadow-sm' : 'text-ink-3'}`}
                  >
                    <span className="block text-ui font-bold leading-tight">{m === 'expres' ? u.piece.short : u.piece.full}</span>
                    <span className="block text-[12px] leading-tight mt-0.5 tabular-nums">{durationLabel(seconds[m])}</span>
                  </button>
                );
              })}
            </div>
          )}
          <p className="mt-2.5 text-cap text-ink-3 flex items-center gap-1.5">
            {hasAudioFile ? <AudioLines className="w-4 h-4 text-jade" /> : <Smartphone className="w-4 h-4" />}
            {hasAudioFile ? tp.realAudio : tp.voiceIn(strings.common.languageNames[readLang])}
          </p>
        </section>

        <section className="px-5 mt-5">
          <p className="font-serif text-read text-ink whitespace-pre-line text-pretty">{mode === 'expres' ? guionCorto : guionLargo}</p>
          {readLang !== currentLanguage && (
            <p className="mt-3 text-cap text-oro" data-testid="script-lang-note">
              {strings.player.scriptOnlySpanish}
            </p>
          )}
          {puente && (
            <p className="mt-6 pl-4 border-l-2 border-jade/60 font-serif italic text-[1.0625rem] leading-relaxed text-ink-2">{puente}</p>
          )}
        </section>

        {retos.length > 0 && (
          <section id="retos-observacion-card" className="px-5 mt-12" aria-labelledby="retos-title">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="retos-title" className="font-serif text-h3 font-medium">
                {u.piece.lookTitle}
              </h2>
              <span className={`text-cap font-semibold tabular-nums ${foundCount === retos.length ? 'text-jade' : 'text-ink-3'}`}>
                {u.piece.foundOf(foundCount, retos.length)}
              </span>
            </div>
            <p className="mt-1 text-cap text-ink-3">{u.piece.lookHint}</p>
            <ul className="mt-3 space-y-2">
              {retos.map((reto, i) => {
                const on = !!found[i];
                return (
                  <li key={i}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => {
                        try {
                          navigator.vibrate?.(30);
                        } catch {
                          /* sin vibración */
                        }
                        setFound((f) => ({ ...f, [i]: !f[i] }));
                      }}
                      className={`w-full text-left flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                        on ? 'bg-jade/10 border-jade/40' : 'bg-surface border-line active:bg-raised'
                      }`}
                    >
                      <span
                        className={`mt-0.5 w-6 h-6 rounded-lg shrink-0 flex items-center justify-center transition-colors ${
                          on ? 'bg-jade text-on-jade' : 'border-2 border-line-strong'
                        }`}
                      >
                        {on && <Check className="w-4 h-4" strokeWidth={3} />}
                      </span>
                      <span className={`text-[1rem] leading-snug ${on ? 'text-ink-2' : 'text-ink'}`}>{reto}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {mito && (
          <section id="faq-mito-block" className="px-5 mt-12" aria-labelledby="mito-title">
            <h2 id="mito-title" className="font-serif text-h3 font-medium">
              {u.piece.mythTitle}
            </h2>
            <div className="mt-4 rounded-2xl bg-surface border border-line overflow-hidden">
              <div className="p-4">
                <p className="text-cap font-bold text-tezontle">{u.piece.mythSaid}</p>
                <p className="mt-1 text-[1.0625rem] leading-snug text-ink">{stripLabel(mito.pregunta)}</p>
              </div>
              <div className="p-4 border-t border-line">
                <p className="text-cap font-bold text-jade">{u.piece.mythReal}</p>
                <p className="mt-1 text-[1rem] leading-relaxed text-ink-2">{stripLabel(mito.respuesta)}</p>
              </div>
            </div>
          </section>
        )}

        {specs.length > 0 && (
          <section className="px-5 mt-12" aria-labelledby="ficha-title">
            <h2 id="ficha-title" className="font-serif text-h3 font-medium">
              {u.piece.specsTitle}
            </h2>
            <dl className="mt-3 border-t border-line">
              {specs.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[7.5rem_1fr] gap-3 py-3 border-b border-line">
                  <dt className="text-cap text-ink-3 pt-0.5">{k}</dt>
                  <dd className="text-ui text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {next && onNext && (
          <section className="px-5 mt-12" aria-label={u.piece.nextAria}>
            <button
              type="button"
              id="btn-next-card"
              onClick={onNext}
              className={`w-full text-left rounded-2xl p-3 pr-4 flex items-center gap-3.5 cursor-pointer active:scale-[0.99] transition-transform ${
                finished ? 'bg-jade/15 border border-jade/50' : 'bg-surface border border-line'
              }`}
            >
              <span className="w-[4.5rem] h-[4.5rem] rounded-xl overflow-hidden bg-raised shrink-0 flex items-center justify-center">
                {next.kind === 'finish' ? (
                  <Flag className="w-7 h-7 text-jade" />
                ) : (
                  <PieceImage filename={next.imageFilename} pieceId={next.pieceId} alt="" className="w-full h-full object-cover" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-cap font-semibold text-jade">{next.eyebrow}</span>
                <span className="block text-[1.0625rem] font-bold leading-snug text-ink">{next.title}</span>
                {next.detail && <span className="block text-cap text-ink-3 truncate mt-0.5">{next.detail}</span>}
              </span>
              <ChevronRight className="w-5 h-5 text-jade shrink-0" />
            </button>
          </section>
        )}

        {otherSiblings.length > 0 && onSelectSibling && (
          <section className="mt-12" aria-labelledby="siblings-title">
            <h2 id="siblings-title" className="px-5 font-serif text-h3 font-medium">
              {u.piece.moreInRoom}
            </h2>
            <div className="mt-3 flex gap-3 overflow-x-auto snap-x scrollbar-none px-5 pb-1">
              {otherSiblings.map((p) => (
                <button
                  key={p.piece_id}
                  type="button"
                  onClick={() => onSelectSibling(p.piece_id)}
                  className="snap-start shrink-0 w-36 text-left cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <span className="block w-36 h-28 rounded-xl overflow-hidden bg-raised">
                    <PieceImage filename={p.image_filename} pieceId={p.piece_id} alt="" className="w-full h-full object-cover" />
                  </span>
                  <span className="block mt-2 text-ui font-semibold leading-snug line-clamp-2">{p.titulo}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </article>

      <PieceDock
        isPlaying={isPlaying}
        progress={isThis ? tts.progress : 0}
        timeLabel={timeLabel}
        started={started}
        locked={locked}
        onTogglePlay={togglePlay}
        onPrev={onPrev}
        onNext={onNext}
        prevDisabled={!onPrev}
        nextIsFinish={next?.kind === 'finish'}
        nextHighlighted={finished}
        prevLabel={u.piece.prev}
        nextLabel={next?.kind === 'finish' ? u.piece.finish : u.piece.next}
      />

      <ImageZoomModal
        isOpen={zoomOpen}
        onClose={() => setZoomOpen(false)}
        imageUrl={imageFilename}
        pieceId={pieceId}
        title={titulo}
        subtitle={contextTitle}
      />
    </div>
  );
};

export default PieceDetail;
