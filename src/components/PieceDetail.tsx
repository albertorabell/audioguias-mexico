import React, { useState, useEffect, useMemo } from 'react';
import {
  Maximize2,
  Lock,
  Sparkles,
  Clock,
  Play,
  Square,
  Volume2,
  ChevronDown,
  Layers,
  HelpCircle,
  Eye,
  Bookmark,
  MapPin,
  Compass,
  ChevronRight,
  Headphones,
  Zap,
} from 'lucide-react';
import { Piece, RouteStop, SpecItem, PieceSpecsObject } from '../types';
import { PieceImage } from './PieceImage';
import { ImageZoomModal } from './ImageZoomModal';
import { ttsPlayer } from '../utils/ttsPlayer';
import { useTheme } from '../utils/ThemeContext';

interface PieceDetailProps {
  piece: Piece;
  hasPass: boolean;
  passPriceMxn: number;
  onOpenPaywall: () => void;
  currentStopIndex?: number;
  totalStops?: number;
  roomName?: string;
  nextStop?: RouteStop | null;
  onNextStop?: () => void;
  onPreviousStop?: () => void;
  onOpenMapModal?: () => void;
}

export const PieceDetail: React.FC<PieceDetailProps> = ({
  piece,
  hasPass,
  passPriceMxn,
  onOpenPaywall,
  currentStopIndex,
  totalStops,
  roomName,
  nextStop,
  onNextStop,
  onPreviousStop,
  onOpenMapModal,
}) => {
  const { isSunMode } = useTheme();

  // 1. Estados de Audio y Modo de Locución (Exprés vs Inmersión)
  const [audioMode, setAudioMode] = useState<'expres' | 'inmersion'>('expres');
  const [isPlayingTTS, setIsPlayingTTS] = useState<boolean>(false);

  // 2. Modales e interacción
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isMitoOpen, setIsMitoOpen] = useState(true);
  const [completedChallenges, setCompletedChallenges] = useState<Record<number, boolean>>({});

  // Homologación de identificadores (ID vs PIECE_ID)
  piece.id = piece.piece_id || piece.id;
  piece.piece_id = piece.piece_id || piece.id;

  const pieceId = piece.piece_id || piece.id || (piece as any).poi_id || '';
  const roomId = piece.room_id || (piece as any).roomId || piece.location?.room_id || '';

  // Suscribirse a cambios en ttsPlayer
  useEffect(() => {
    const unsubscribe = ttsPlayer.subscribe((playing) => {
      setIsPlayingTTS(playing);
    });
    return () => {
      ttsPlayer.stop();
      unsubscribe();
    };
  }, [pieceId]);

  // Detener audio si cambia de pieza
  useEffect(() => {
    ttsPlayer.stop();
    setIsPlayingTTS(false);
  }, [pieceId]);

  // Normalización de propiedades entre el nuevo esquema de 16 columnas y datos previos
  const titulo = piece.titulo || piece.identification?.title || 'Pieza del Museo';
  const fraseGancho = piece.frase_gancho || piece.narrative?.one_liner || '';
  const puenteNarrativo = piece.puente_narrativo || '';
  const guionCorto =
    piece.guion_corto ||
    piece.summary_30s ||
    piece.narrative?.short_desc ||
    fraseGancho ||
    'Pieza arqueológica fundamental del acervo nacional.';
  const guionLargo =
    piece.guion_largo ||
    piece.audioguide?.audio_script ||
    piece.narrative?.deep_desc ||
    guionCorto;

  const imageFilename = piece.image_filename || piece.identification?.hero_image || '';
  const isFree = piece.is_free !== undefined ? piece.is_free : !piece.is_premium;
  const isLocked = !isFree && !hasPass;

  // Normalización de Retos de Observación (lista de strings)
  const retosList: string[] = useMemo(() => {
    if (piece.retos_observacion && piece.retos_observacion.length > 0) {
      return piece.retos_observacion;
    }
    if (piece.observation_challenges && piece.observation_challenges.length > 0) {
      return piece.observation_challenges.map((oc) =>
        oc.titulo ? `${oc.titulo}: ${oc.descripcion}` : oc.descripcion
      );
    }
    if (piece.visual_challenge && piece.visual_challenge.length > 0) {
      return piece.visual_challenge.map((vc) => `${vc.title}: ${vc.clue}`);
    }
    return [];
  }, [piece.retos_observacion, piece.observation_challenges, piece.visual_challenge]);

  // Normalización de Especificaciones (clave -> valor)
  const especificacionesEntries = useMemo<[string, string][]>(() => {
    if (piece.especificaciones && typeof piece.especificaciones === 'object') {
      const entries: [string, string][] = Object.entries(piece.especificaciones)
        .filter(([k, v]) => k && v !== undefined && v !== null && String(v).trim() !== '')
        .map(([k, v]) => [k, String(v)]);
      if (entries.length > 0) return entries;
    }
    if (piece.specs) {
      if (Array.isArray(piece.specs)) {
        return (piece.specs as SpecItem[])
          .filter((s) => s.label && s.value)
          .map((s) => [s.label, s.value]);
      }
      const sObj = piece.specs as PieceSpecsObject;
      const res: [string, string][] = [];
      if (sObj.material) res.push(['Material', sObj.material]);
      if (sObj.provenance) res.push(['Procedencia', sObj.provenance]);
      if (sObj.age) res.push(['Periodo / Datación', sObj.age]);
      if (sObj.weight) res.push(['Dimensiones / Peso', sObj.weight]);
      return res;
    }
    return [];
  }, [piece.especificaciones, piece.specs]);

  // Normalización de FAQ / Mito
  const faqMito = useMemo(() => {
    if (piece.faq_mito && piece.faq_mito.pregunta && piece.faq_mito.respuesta) {
      return piece.faq_mito;
    }
    if (piece.faq && piece.faq.length > 0) {
      return {
        pregunta: piece.faq[0].question,
        respuesta: piece.faq[0].answer,
      };
    }
    if (piece.faqs && piece.faqs.length > 0) {
      return {
        pregunta: piece.faqs[0].question,
        respuesta: piece.faqs[0].answer,
      };
    }
    return null;
  }, [piece.faq_mito, piece.faq, piece.faqs]);

  // Manejador del botón Play / Stop con ttsPlayer
  const handleToggleAudio = () => {
    if (isLocked) {
      onOpenPaywall();
      return;
    }

    if (isPlayingTTS) {
      ttsPlayer.stop();
      setIsPlayingTTS(false);
    } else {
      const scriptToSpeak = audioMode === 'expres' ? guionCorto : guionLargo;
      ttsPlayer.play(scriptToSpeak, titulo, () => {
        setIsPlayingTTS(false);
      });
      setIsPlayingTTS(true);
    }
  };

  const toggleChallenge = (idx: number) => {
    setCompletedChallenges((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const completedCount = Object.values(completedChallenges).filter(Boolean).length;

  return (
    <article
      id="piece-detail-container"
      className={`pb-32 transition-colors duration-200 ${
        isSunMode ? 'text-[#111827]' : 'text-[#F5F5F4]'
      }`}
    >
      {/* 1. HERO CON COMPONENTE PieceImage Y FALLBACK ELEGANTE */}
      <section className="px-4 pt-3 pb-2">
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-200 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 shadow-xs group">
          <PieceImage
            filename={imageFilename}
            alt={titulo}
            onClick={() => setIsZoomOpen(true)}
            className="w-full h-full cursor-zoom-in"
          />

          {/* Badge superior de parada o ubicación */}
          <div className="absolute top-3 left-3 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-black/60 text-white backdrop-blur-md border border-white/10 shadow-xs">
              <MapPin className="w-3 h-3 text-[#D96B47]" />
              <span>
                {roomName || piece.location?.room_name || roomId || 'Sala Oficial'}
              </span>
            </span>
          </div>

          {/* Botón de Zoom Pantalla Completa */}
          <button
            type="button"
            onClick={() => setIsZoomOpen(true)}
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/60 text-white backdrop-blur-md flex items-center justify-center hover:bg-black/80 transition-all active:scale-95 shadow-xs border border-white/10"
            title="Ampliar imagen de alta resolución"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Badge de contenido Premium / Gratuito */}
          <div className="absolute bottom-3 right-3 z-10">
            {isLocked ? (
              <button
                type="button"
                onClick={onOpenPaywall}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500 text-stone-950 shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Audio Premium</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-600/90 text-white backdrop-blur-xs">
                Acceso Incluido
              </span>
            )}
          </div>
        </div>
      </section>

      {/* 2. ENCABEZADO DE LA PIEZA: TÍTULO Y FRASE GANCHO */}
      <section className="px-4 pt-3 pb-2">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold tracking-tight text-[#111827] dark:text-stone-100">
          {titulo}
        </h1>
        {fraseGancho && (
          <p className="mt-1.5 text-sm sm:text-base font-serif italic text-[#4B5563] dark:text-stone-300 leading-snug">
            «{fraseGancho}»
          </p>
        )}
      </section>

      {/* 3. REPRODUCTOR DUAL DE AUDIO: EXPRÉS (60s) vs INMERSIÓN (2-3 min) */}
      <section className="px-4 py-3">
        <div
          id="dual-audio-card"
          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            isSunMode
              ? 'bg-stone-50/90 border-stone-200/80 shadow-xs'
              : 'bg-stone-900/60 border-stone-800 shadow-inner'
          }`}
        >
          {/* Selector de tipo de audio */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4B5563] dark:text-stone-400">
              Modalidad de Locución
            </span>
            <div className="flex items-center gap-1 text-[11px] text-[#4B5563] dark:text-stone-400 font-medium">
              <Volume2 className="w-3.5 h-3.5 text-[#C05638] dark:text-[#D96B47]" />
              <span>Voz Neuronal IA</span>
            </div>
          </div>

          <div
            className={`grid grid-cols-2 p-1 rounded-xl border mb-4 ${
              isSunMode
                ? 'bg-stone-200/60 border-stone-200'
                : 'bg-stone-950/60 border-stone-800'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                if (isPlayingTTS) ttsPlayer.stop();
                setAudioMode('expres');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold tracking-tight transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                audioMode === 'expres'
                  ? isSunMode
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'bg-stone-800 text-stone-100 shadow-xs'
                  : 'text-[#4B5563] dark:text-stone-400 hover:text-[#111827] dark:hover:text-stone-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>⏱️ Audio Exprés (60s)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isPlayingTTS) ttsPlayer.stop();
                setAudioMode('inmersion');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-semibold tracking-tight transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                audioMode === 'inmersion'
                  ? isSunMode
                    ? 'bg-white text-[#111827] shadow-xs'
                    : 'bg-stone-800 text-stone-100 shadow-xs'
                  : 'text-[#4B5563] dark:text-stone-400 hover:text-[#111827] dark:hover:text-stone-200'
              }`}
            >
              <Headphones className="w-3.5 h-3.5 text-[#C05638] dark:text-[#D96B47]" />
              <span>🎧 Inmersión (2-3 min)</span>
            </button>
          </div>

          {/* Botón de reproducción interactivo y estado */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={handleToggleAudio}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all active:scale-98 shadow-sm cursor-pointer ${
                isPlayingTTS
                  ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 ring-2 ring-[#C05638]/40'
                  : isSunMode
                  ? 'bg-[#C05638] hover:bg-[#A84A30] text-white shadow-xs'
                  : 'bg-[#D96B47] hover:bg-[#C05638] text-white shadow-xs'
              }`}
            >
              {isPlayingTTS ? (
                <>
                  <Square className="w-4 h-4 fill-current animate-pulse text-red-400" />
                  <span>Detener Narración</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>
                    {isLocked
                      ? 'Desbloquear Audioguía'
                      : audioMode === 'expres'
                      ? 'Escuchar Guion Exprés (60s)'
                      : 'Escuchar Recorrido Inmersivo'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Indicador de texto en reproducción */}
          {isPlayingTTS && (
            <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2 animate-fadeIn">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span className="truncate">
                Reproduciendo: {audioMode === 'expres' ? 'Guion Exprés' : 'Guion de Inmersión'} · Manteniendo pantalla activa
              </span>
            </div>
          )}
        </div>
      </section>

      {/* 4. PUENTE NARRATIVO: INTRODUCCIÓN CONTEXTUAL DESTACADA */}
      {puenteNarrativo && (
        <section className="px-4 py-2">
          <div
            id="puente-narrativo-card"
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              isSunMode
                ? 'bg-[#FAF3EB] border-[#E8D7C8] text-[#3D2817]'
                : 'bg-amber-950/20 border-amber-800/40 text-amber-100'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#C05638] dark:text-[#D96B47]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C05638] dark:text-[#D96B47]">
                Puente Narrativo · Hilo Conductor
              </span>
            </div>
            <p className="text-sm sm:text-base font-serif italic leading-relaxed">
              «{puenteNarrativo}»
            </p>
          </div>
        </section>
      )}

      {/* 5. CUERPO PRINCIPAL: GUION EXPRÉS / NARRATIVA EN SALA */}
      <section className="px-4 py-2">
        <div
          className={`p-4 sm:p-5 rounded-2xl border ${
            isSunMode
              ? 'bg-white border-stone-200/80'
              : 'bg-stone-900/50 border-stone-800'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold tracking-wider uppercase text-[#4B5563] dark:text-stone-400">
              {audioMode === 'expres' ? 'Guion Sintético (Visita Rápida)' : 'Narrativa Inmersiva'}
            </h2>
            <span className="text-[11px] font-mono font-semibold text-[#4B5563] dark:text-stone-400">
              {audioMode === 'expres' ? '60 seg' : '3 min'}
            </span>
          </div>
          <p className="text-sm sm:text-base leading-relaxed text-[#111827] dark:text-stone-200 font-sans">
            {audioMode === 'expres' ? guionCorto : guionLargo}
          </p>
        </div>
      </section>

      {/* 6. RETOS DE OBSERVACIÓN: CHECKLIST INTERACTIVO EN VITRINA ([ ] / [x]) */}
      {retosList.length > 0 && (
        <section className="px-4 py-2">
          <div
            id="retos-observacion-card"
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              isSunMode
                ? 'bg-white border-stone-200/90 shadow-xs'
                : 'bg-stone-900/60 border-stone-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#C05638] dark:text-[#D96B47]" />
                <h3 className="text-xs font-bold tracking-wider uppercase text-[#111827] dark:text-stone-200">
                  Retos de Observación en Vitrina
                </h3>
              </div>
              <span
                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  completedCount === retosList.length
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
                }`}
              >
                {completedCount} de {retosList.length} encontrados
              </span>
            </div>

            <p className="text-xs text-[#4B5563] dark:text-stone-300 mb-3">
              Toca cada casilla para tachar los detalles conforme los descubras en la vitrina física:
            </p>

            {/* Checklist interactivo [ ] / [x] */}
            <div className="space-y-2">
              {retosList.map((reto, idx) => {
                const isFound = !!completedChallenges[idx];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleChallenge(idx)}
                    role="checkbox"
                    aria-checked={isFound}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 select-none active:scale-[0.99] cursor-pointer ${
                      isFound
                        ? isSunMode
                          ? 'bg-emerald-50/70 border-emerald-300/80 text-emerald-950'
                          : 'bg-emerald-950/20 border-emerald-700/50 text-emerald-200'
                        : isSunMode
                        ? 'bg-stone-50 border-stone-200 hover:border-amber-300 text-[#111827]'
                        : 'bg-stone-950/50 border-stone-800 hover:border-stone-700 text-stone-200'
                    }`}
                  >
                    {/* Checkbox visual [ ] vs [x] */}
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 font-mono text-xs font-black transition-all ${
                        isFound
                          ? 'bg-emerald-600 text-white shadow-xs scale-105'
                          : isSunMode
                          ? 'border-2 border-stone-400 bg-white text-transparent'
                          : 'border-2 border-stone-600 bg-stone-900 text-transparent'
                      }`}
                    >
                      {isFound ? '✓' : ''}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-xs leading-relaxed block ${
                          isFound
                            ? 'line-through opacity-85 font-medium'
                            : 'font-semibold'
                        }`}
                      >
                        {reto}
                      </span>
                      <span className="text-[10px] opacity-70 block mt-0.5">
                        {isFound ? '¡Encontrado en vitrina!' : 'Toca para marcar [x]'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Banner de felicitación si todos fueron marcados */}
            {completedCount === retosList.length && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <span>🌟</span>
                <span>¡Excelente vista! Has localizado todos los detalles en la pieza física.</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 7. ESPECIFICACIONES: CUADRÍCULA COMPACTA DE TARJETAS CLAVE-VALOR */}
      {especificacionesEntries.length > 0 && (
        <section className="px-4 py-2">
          <div
            id="especificaciones-grid"
            className={`p-4 sm:p-5 rounded-2xl border ${
              isSunMode
                ? 'bg-white border-stone-200/80'
                : 'bg-stone-900/50 border-stone-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-[#C05638] dark:text-[#D96B47]" />
              <h3 className="text-xs font-bold tracking-wider uppercase text-[#111827] dark:text-stone-200">
                Ficha Técnica y Especificaciones
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {especificacionesEntries.map(([clave, valor]) => (
                <div
                  key={clave}
                  className={`p-3 rounded-xl border flex flex-col justify-between ${
                    isSunMode
                      ? 'bg-[#FAF8F5] border-stone-200 text-[#111827]'
                      : 'bg-stone-950/60 border-stone-800/80 text-stone-100'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4B5563] dark:text-stone-400 truncate">
                    {clave}
                  </span>
                  <span className="text-xs font-semibold text-[#111827] dark:text-stone-200 mt-1 leading-snug">
                    {valor}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. TARJETA DESTACADA: 'MITO VS REALIDAD' (ESTILO ÁMBAR/TERRACOTA) */}
      {faqMito && (
        <section className="px-4 py-2">
          <div
            id="faq-mito-block"
            className={`p-4 sm:p-5 rounded-2xl border-2 transition-all shadow-sm ${
              isSunMode
                ? 'bg-[#FFF7ED] border-[#FDBA74] text-[#111827]'
                : 'bg-[#291711] border-[#C05638]/70 text-[#F5F5F4]'
            }`}
          >
            {/* Título de la tarjeta: "💡 Mito Arqueológico Desmentido" */}
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-lg">💡</span>
              <h3 className="text-xs sm:text-sm font-black tracking-wider uppercase text-[#C05638] dark:text-[#FDBA74]">
                Mito Arqueológico Desmentido
              </h3>
            </div>

            {/* Pregunta en negrita */}
            <p className="text-sm sm:text-base font-bold text-[#111827] dark:text-amber-100 leading-snug">
              {faqMito.pregunta}
            </p>

            {/* Respuesta explicativa limpia */}
            <div className="mt-3 pt-3 border-t border-amber-200/90 dark:border-amber-900/60">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#C05638] dark:text-[#FDBA74] block mb-1">
                La Realidad Arqueológica:
              </span>
              <p className="text-xs sm:text-sm leading-relaxed text-[#374151] dark:text-stone-200 font-medium">
                {faqMito.respuesta}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 9. PROXIMIDAD Y NAVEGACIÓN A LA SIGUIENTE PARADA O CIERRE DE RUTA */}
      {nextStop ? (
        <section className="px-4 pt-2">
          <div
            id="next-stop-proximity-card"
            onClick={onOpenMapModal}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (onOpenMapModal) onOpenMapModal();
              }
            }}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs active:scale-98 ${
              isSunMode
                ? 'bg-amber-50/80 border-amber-300/80 hover:bg-amber-100/70 text-[#111827]'
                : 'bg-amber-950/20 border-amber-800/40 hover:bg-amber-900/30 text-stone-100'
            }`}
            title="Abrir mapa de sala interactivo"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#C05638]/15 dark:bg-[#D96B47]/20 flex items-center justify-center shrink-0">
                <Compass className="w-4 h-4 text-[#C05638] dark:text-[#D96B47]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C05638] dark:text-[#D96B47] block">
                  Siguiente Hito Recomendado
                </span>
                <p className="text-xs font-semibold truncate text-[#111827] dark:text-stone-100">
                  {nextStop.title}{' '}
                  <span className="text-[#4B5563] dark:text-stone-400 text-[11px]">· {nextStop.room_zone || 'Sala'}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#C05638] dark:text-[#D96B47] shrink-0">
              <span>Ver en mapa</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </section>
      ) : (currentStopIndex !== undefined && totalStops !== undefined && currentStopIndex >= totalStops - 1) ? (
        <section className="px-4 pt-2">
          <div
            id="last-stop-completion-card"
            className={`p-4 rounded-2xl border transition-all shadow-sm ${
              isSunMode
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                : 'bg-emerald-950/30 border-emerald-800 text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <span className="text-2xl">🏁</span>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider">
                  ¡Última Parada de esta Ruta!
                </h4>
                <p className="text-xs font-medium opacity-90">
                  Has visitado todos los hitos programados en este recorrido.
                </p>
              </div>
            </div>
            {onNextStop && (
              <button
                type="button"
                onClick={onNextStop}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md cursor-pointer"
              >
                <span>Finalizar Recorrido y Ver Resumen 🎉</span>
              </button>
            )}
          </div>
        </section>
      ) : null}

      {/* Modal de Zoom de Imagen */}
      <ImageZoomModal
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        imageUrl={imageFilename}
        title={titulo}
        subtitle={roomName || piece.location?.room_name || 'Museo Nacional de Antropología'}
      />
    </article>
  );
};

export default PieceDetail;
