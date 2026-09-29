import React, { useState, useEffect, useMemo } from 'react';
import {
  Maximize2,
  Lock,
  Sparkles,
  Play,
  Square,
  Volume2,
  ChevronDown,
  ChevronUp,
  Layers,
  Eye,
  MapPin,
  Compass,
  ChevronRight,
  Headphones,
  Zap,
  Check,
  BookOpen,
} from 'lucide-react';
import { Piece, RouteStop, SpecItem, PieceSpecsObject } from '../types';
import { PieceImage } from './PieceImage';
import { ImageZoomModal } from './ImageZoomModal';
import { ttsPlayer, TTSState } from '../utils/ttsPlayer';
import { getAssetUrl, PIECE_ALIASES, findPiece } from '../utils/urlHelper';

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
  roomPieces?: Piece[];
  onSelectPiece?: (pieceId: string) => void;
  currentRoom?: any;
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
  roomPieces,
  onSelectPiece,
  currentRoom,
}) => {
  // 1. Estados de Audio y Modo de Locución
  const [audioMode, setAudioMode] = useState<'expres' | 'inmersion'>('expres');
  const [isPlayingTTS, setIsPlayingTTS] = useState<boolean>(false);

  // 2. Modales e interacción
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isFullScriptExpanded, setIsFullScriptExpanded] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState<Record<number, boolean>>({});

  // Homologación de identificadores (ID vs PIECE_ID)
  piece.id = piece.piece_id || piece.id;
  piece.piece_id = piece.piece_id || piece.id;

  const pieceId = piece.piece_id || piece.id || (piece as any).poi_id || '';
  const roomId = piece.room_id || (piece as any).roomId || piece.location?.room_id || '';

  // Carga complementaria de piezas del museo para carrusel en caso de no venir por props
  const [catalogPieces, setCatalogPieces] = useState<Piece[]>([]);
  useEffect(() => {
    fetch(getAssetUrl('data/pieces.json'))
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Piece[]) => {
        if (Array.isArray(data)) setCatalogPieces(data);
      })
      .catch((e) => console.warn('Could not fetch sibling pieces:', e));
  }, []);

  // Otras piezas en la misma sala excluyendo la actual
  const siblingPieces = useMemo(() => {
    const basePool = roomPieces && roomPieces.length > 0 ? roomPieces : catalogPieces;
    if (!basePool || basePool.length === 0) return [];

    const targetRoom = (roomId || '').toLowerCase().trim();
    const targetPiece = (pieceId || '').toLowerCase().trim();
    const numTarget = targetRoom.match(/\d+/)?.[0];

    const filtered = basePool.filter((p) => {
      const pId = (p.piece_id || p.id || (p as any).poi_id || '').toLowerCase().trim();
      if (!pId || pId === targetPiece) return false;

      const pRoom = (p.room_id || (p as any).roomId || p.location?.room_id || '').toLowerCase().trim();
      if (targetRoom && pRoom) {
        if (pRoom === targetRoom) return true;
        const cleanP = pRoom.replace(/[-_]/g, '');
        const cleanT = targetRoom.replace(/[-_]/g, '');
        if (cleanP.includes(cleanT) || cleanT.includes(cleanP)) return true;
        const numP = pRoom.match(/\d+/)?.[0];
        if (numTarget && numP && parseInt(numP, 10) === parseInt(numTarget, 10)) return true;
      }
      return false;
    });

    const enriched = filtered.map((sibling) => {
      const sId = (sibling.piece_id || sibling.id || (sibling as any).poi_id || '').trim();
      const catalogMatch =
        catalogPieces.find(
          (cp) =>
            cp.piece_id === sId ||
            cp.id === sId ||
            (cp as any).poi_id === sId ||
            cp.piece_id === PIECE_ALIASES[sId]
        ) || findPiece(catalogPieces, sId);

      return {
        ...catalogMatch,
        ...sibling,
        image_filename:
          sibling.image_filename ||
          catalogMatch?.image_filename ||
          sibling.identification?.hero_image ||
          (sibling as any).thumbnail ||
          (sibling as any).hero_image ||
          (sibling as any).image,
      };
    });

    return enriched.sort((a, b) => (a.orden_sugerido || 999) - (b.orden_sugerido || 999));
  }, [roomPieces, catalogPieces, roomId, pieceId]);

  const roomDisplayName = useMemo(() => {
    if (currentRoom?.nombre_oficial) {
      const num = currentRoom.numero_oficial ? `Sala ${String(currentRoom.numero_oficial).padStart(2, '0')}` : '';
      return `${num ? num + ' • ' : ''}${currentRoom.nombre_oficial}`;
    }
    if (roomName) return roomName;
    if (roomId) {
      const num = roomId.match(/\d+/)?.[0];
      if (num) return `Sala ${num.padStart(2, '0')}`;
    }
    return 'esta sala';
  }, [currentRoom, roomName, roomId]);

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

  // Detener audio al salir de la pantalla (desmonte de componente)
  useEffect(() => {
    return () => {
      ttsPlayer.stop();
    };
  }, []);

  // Detener audio y resetear vista de lectura si cambia de pieza
  useEffect(() => {
    ttsPlayer.stop();
    setIsPlayingTTS(false);
    setIsFullScriptExpanded(false);
  }, [pieceId]);

  // Normalización de textos
  const titulo = piece.titulo || piece.identification?.title || piece.title || 'Pieza del Museo';
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

  // Normalización de Retos de Observación
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

  // Normalización de Especificaciones (pastillas de cristal)
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
      if (sObj.period || sObj.age) res.push(['Época', sObj.period || sObj.age || '']);
      if (sObj.culture) res.push(['Cultura', sObj.culture]);
      if (sObj.material) res.push(['Material', sObj.material]);
      if (sObj.dimensions || sObj.weight) res.push(['Dimensiones', sObj.dimensions || sObj.weight || '']);
      if (sObj.provenance) res.push(['Procedencia', sObj.provenance]);
      return res.filter(([_, v]) => Boolean(v));
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

  // Manejador del botón Play Maestro
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
      const audioUrl = piece.audio_file_url || piece.audioguide?.audio_file_url || (piece as any).audio_url;
      ttsPlayer.play(
        scriptToSpeak,
        titulo,
        () => setIsPlayingTTS(false),
        {
          roomName: roomName || piece.location?.room_name || roomId,
          artworkUrl: imageFilename ? getAssetUrl(`images/pieces/${imageFilename}`) : undefined,
          pieceId,
          mode: audioMode,
          audioUrl: audioUrl ? getAssetUrl(audioUrl) : undefined,
        }
      );
      setIsPlayingTTS(true);
    }
  };

  // Toggle checklist reto con vibración háptica
  const toggleChallenge = (idx: number) => {
    // Retroalimentación háptica en dispositivos móviles compatibles
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate?.(50);
      } catch {
        // Ignorar
      }
    }

    setCompletedChallenges((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const completedCount = Object.values(completedChallenges).filter(Boolean).length;

  // Tag superior formateado: "SALA 06 • MEXICA • PARADA 3 DE 18"
  const roomFormatted = (roomName || piece.location?.room_name || roomId || 'SALA GENERAL')
    .toUpperCase()
    .replace(/^SALA\s*/i, '');
  const roomNumberMatch = roomId.match(/\d+/)?.[0] || '01';
  const tagSuperior = `SALA ${roomNumberMatch.padStart(2, '0')} • ${roomFormatted}${
    currentStopIndex !== undefined && totalStops !== undefined
      ? ` • PARADA ${currentStopIndex + 1} DE ${totalStops}`
      : ''
  }`;

  return (
    <article
      id="piece-detail-container"
      className="bg-[#0B0B0E] text-[#F3F4F6] pb-36 transition-colors duration-200 select-none"
    >
      {/* ================= BARRA DE PROGRESO SUPERIOR EN RECORRIDO ================= */}
      {currentStopIndex !== undefined && totalStops !== undefined && totalStops > 0 && (
        <div
          id="piece-tour-progress-bar"
          className="sticky top-0 z-30 px-4 py-2.5 bg-[#0B0B0E]/95 backdrop-blur-xl border-b border-white/10 shadow-lg"
        >
          <div className="flex items-center justify-between text-xs mb-1.5 max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse" />
              <span className="font-black text-[#F59E0B] uppercase tracking-wider text-[11px]">
                Parada {currentStopIndex + 1} de {totalStops}
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-stone-300">
              {Math.round(((currentStopIndex + 1) / totalStops) * 100)}% completado
            </span>
          </div>
          <div className="w-full max-w-2xl mx-auto h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300 rounded-full"
              style={{
                width: `${Math.min(100, Math.max(5, ((currentStopIndex + 1) / totalStops) * 100))}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* ================= 4. FICHA HERO CINEMATOGRÁFICA ================= */}
      <section className="relative w-full overflow-hidden bg-black">
        {/* Imagen en gran formato con degradado hacia el fondo #0B0B0E */}
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] overflow-hidden">
          <PieceImage
            filename={imageFilename}
            alt={titulo}
            pieceTitle={titulo}
            roomName={roomFormatted}
            onClick={() => setIsZoomOpen(true)}
            className="w-full h-full object-cover cursor-zoom-in"
          />

          {/* Degradado cinematográfico que integra la foto hacia el fondo #0B0B0E */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0E] via-[#0B0B0E]/40 to-transparent pointer-events-none" />

          {/* Botón de Zoom Pantalla Completa */}
          <button
            type="button"
            onClick={() => setIsZoomOpen(true)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 text-white backdrop-blur-md flex items-center justify-center transition-all active:scale-90 border border-white/10 shadow-lg cursor-pointer"
            title="Ampliar imagen oficial en alta resolución"
            aria-label="Ampliar imagen"
          >
            <Maximize2 className="w-4 h-4 text-[#F3F4F6]" />
          </button>

          {/* Badge de contenido Premium o Pase Requerido */}
          {isLocked && (
            <div className="absolute top-4 left-4 z-10">
              <button
                type="button"
                onClick={onOpenPaywall}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#F59E0B] text-black shadow-lg shadow-[#F59E0B]/20 active:scale-95 transition-transform cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 fill-current" />
                <span>Audio Premium</span>
              </button>
            </div>
          )}
        </div>

        {/* Debajo de la imagen: Tag superior + Título Monumental + Pastillas de Cristal */}
        <div className="px-5 pt-1 pb-4 relative z-10 -mt-10 sm:-mt-14">
          {/* Tag Superior uppercase fino con tracking amplio */}
          <div className="tracking-widest text-[11px] sm:text-xs text-[#F59E0B] font-semibold uppercase mb-1.5 drop-shadow-sm flex items-center gap-2">
            <span>{tagSuperior}</span>
          </div>

          {/* Título Monumental (26px font-bold text-white tracking-tight) */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
            {titulo}
          </h1>

          {/* Guion corto / Síntesis esencial siempre visible (narrative.short_desc o narrative.one_liner) */}
          <div className="mt-2.5 space-y-1.5">
            {fraseGancho && fraseGancho !== guionCorto && (
              <p className="text-xs sm:text-sm font-serif italic text-amber-400/90 leading-snug">
                «{fraseGancho}»
              </p>
            )}
            <p className="text-sm sm:text-base text-stone-200 leading-relaxed font-normal">
              {guionCorto}
            </p>
          </div>

          {/* Botón amigable de Acordeón: '📖 Leer explicación completa' */}
          {guionLargo && (
            <div className="mt-3.5">
              <button
                type="button"
                id="btn-accordion-guion-largo"
                onClick={() => setIsFullScriptExpanded((prev) => !prev)}
                className="inline-flex items-center gap-2 py-2 px-3.5 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 hover:border-amber-500/40 text-amber-400 hover:text-amber-300 text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer shadow-sm group select-none"
                aria-expanded={isFullScriptExpanded}
              >
                <span>📖</span>
                <span>
                  {isFullScriptExpanded ? 'Ocultar explicación completa' : 'Leer explicación completa'}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-amber-400 transition-transform duration-300 ${
                    isFullScriptExpanded ? 'rotate-180 text-amber-300' : 'group-hover:translate-y-0.5'
                  }`}
                />
              </button>

              {/* Guion largo que se despliega suavemente hacia abajo */}
              <div
                id="accordion-explicacion-larga"
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isFullScriptExpanded
                    ? 'max-h-[1600px] opacity-100 mt-3 pt-3 border-t border-white/10'
                    : 'max-h-0 opacity-0 pointer-events-none'
                }`}
              >
                <div className="p-4 sm:p-5 rounded-2xl bg-[#141419]/95 border border-white/10 space-y-3 shadow-inner">
                  <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Explicación Curatorial Completa</span>
                    </div>
                    <span className="text-[10px] text-stone-400 font-mono font-normal">
                      INAH Oficial
                    </span>
                  </div>
                  <p className="font-serif text-sm sm:text-base leading-relaxed text-stone-200 text-justify first-letter:text-4xl first-letter:font-bold first-letter:text-[#F59E0B] first-letter:mr-2.5 first-letter:float-left">
                    {guionLargo}
                  </p>
                  <div className="pt-2 text-[11px] text-[#6B7280] flex items-center justify-between border-t border-white/5">
                    <span>Museo Nacional de Antropología</span>
                    <button
                      type="button"
                      onClick={() => setIsFullScriptExpanded(false)}
                      className="text-amber-400/80 hover:text-amber-300 underline cursor-pointer text-xs"
                    >
                      Cerrar lectura ▲
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fila de metadatos tipo pastillas de cristal: Época, Cultura, Material, Dimensiones */}
          {especificacionesEntries.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {especificacionesEntries.slice(0, 4).map(([clave, valor]) => (
                <div
                  key={clave}
                  className="backdrop-blur-md bg-white/5 border border-white/10 text-xs px-3 py-1.5 rounded-full text-[#F3F4F6] flex items-center gap-1.5 shadow-sm"
                >
                  <span className="text-[10px] uppercase font-bold text-[#6B7280]">{clave}:</span>
                  <span className="font-semibold text-stone-200">{valor}</span>
                </div>
              ))}
            </div>
          )}

          {/* Botón Maestro Central: "▶️ Escuchar Explicación" */}
          <div className="mt-5">
            <button
              id="btn-master-play-piece"
              type="button"
              onClick={handleToggleAudio}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl cursor-pointer ${
                isPlayingTTS
                  ? 'bg-red-500/20 border border-red-500/50 text-red-300 ring-2 ring-red-500/30'
                  : 'bg-[#F59E0B] hover:bg-amber-400 text-black shadow-[#F59E0B]/25'
              }`}
            >
              {isPlayingTTS ? (
                <>
                  <Square className="w-5 h-5 fill-current animate-pulse text-red-400" />
                  <span>Detener Narración en Sala</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                  <span>
                    {isLocked
                      ? 'Desbloquear Audioguía Premium'
                      : audioMode === 'expres'
                      ? 'Escuchar Explicación (Exprés 60s)'
                      : 'Escuchar Explicación Inmersiva'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ================= SELECTOR DE MODALIDAD DE AUDIO ================= */}
      <section className="px-4 py-2">
        <div className="p-3.5 rounded-2xl bg-[#141419] border border-white/10">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
              Duración de Audioguía
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-[#9CA3AF] font-medium">
              <Volume2 className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Voz Neuronal en Español</span>
            </div>
          </div>

          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#0B0B0E] border border-white/10">
            <button
              type="button"
              onClick={() => {
                if (isPlayingTTS) ttsPlayer.stop();
                setAudioMode('expres');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                audioMode === 'expres'
                  ? 'bg-[#F59E0B] text-black shadow-md'
                  : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Visita Rápida (60s)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isPlayingTTS) ttsPlayer.stop();
                setAudioMode('inmersion');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                audioMode === 'inmersion'
                  ? 'bg-[#F59E0B] text-black shadow-md'
                  : 'text-[#9CA3AF] hover:text-[#F3F4F6]'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Inmersiva (3 min)</span>
            </button>
          </div>
        </div>
      </section>

      {/* ================= PUENTE NARRATIVO SI EXISTE ================= */}
      {puenteNarrativo && (
        <section className="px-4 py-2">
          <div className="p-4 rounded-2xl bg-[#141419] border border-amber-500/20 text-[#F3F4F6]">
            <div className="flex items-center gap-2 mb-1.5 text-[#F59E0B]">
              <Sparkles className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Hilo Conductor Arqueológico
              </span>
            </div>
            <p className="text-xs sm:text-sm font-serif italic text-stone-200 leading-relaxed">
              «{puenteNarrativo}»
            </p>
          </div>
        </section>
      )}

      {/* ================= 5. SECCIÓN INTERACTIVA: 'MITO VS REALIDAD' ================= */}
      {faqMito && (
        <section className="px-4 py-2">
          <div
            id="faq-mito-block"
            className="p-5 rounded-2xl bg-[#141419] border border-[#DC2626]/40 shadow-lg transition-all"
          >
            {/* Título de la tarjeta con estilo Terracota Tezontle / Ámbar Oscuro */}
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-xl">💡</span>
              <h3 className="text-xs sm:text-sm font-extrabold tracking-wider uppercase text-[#F59E0B]">
                Mito Arqueológico Desmentido
              </h3>
            </div>

            {/* Pregunta en negrita */}
            <p className="text-sm sm:text-base font-bold text-white leading-snug">
              {faqMito.pregunta}
            </p>

            {/* Respuesta explicativa limpia */}
            <div className="mt-3 pt-3 border-t border-white/10">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#DC2626] block mb-1">
                La Realidad Científica:
              </span>
              <p className="text-xs sm:text-sm leading-relaxed text-[#9CA3AF] font-normal">
                {faqMito.respuesta}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ================= 5. SECCIÓN INTERACTIVA: 'RETOS DE OBSERVACIÓN' ================= */}
      {retosList.length > 0 && (
        <section className="px-4 py-2">
          <div
            id="retos-observacion-card"
            className="p-5 rounded-2xl bg-[#141419] border border-white/10 shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-[#F3F4F6]">
                <Eye className="w-4 h-4 text-[#F59E0B]" />
                <h3 className="text-xs font-bold tracking-wider uppercase">
                  Retos de Observación en Vitrina
                </h3>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border transition-all ${
                  completedCount === retosList.length
                    ? 'bg-[#10B981]/20 border-[#10B981]/50 text-[#10B981]'
                    : 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]'
                }`}
              >
                {completedCount} de {retosList.length} encontrados
              </span>
            </div>

            <p className="text-xs text-[#9CA3AF] mb-3">
              Toca cada casilla para tachar los detalles conforme los descubras en la vitrina física:
            </p>

            {/* Checklist interactivo con cambio a Jade Sagrado (#10B981) */}
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
                    className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-start gap-3 select-none active:scale-[0.98] cursor-pointer ${
                      isFound
                        ? 'bg-[#10B981]/15 border-[#10B981]/60 text-white shadow-sm'
                        : 'bg-[#0B0B0E] border-white/10 hover:border-white/20 text-[#F3F4F6]'
                    }`}
                  >
                    {/* Checkbox visual: Cambia a Jade Brillante con palomita */}
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 font-bold transition-all duration-200 ${
                        isFound
                          ? 'bg-[#10B981] text-black shadow-[0_0_10px_#10B981] scale-105'
                          : 'border-2 border-stone-600 bg-stone-900 text-transparent'
                      }`}
                    >
                      {isFound && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-xs leading-relaxed block ${
                          isFound ? 'line-through text-stone-300 font-medium' : 'font-semibold'
                        }`}
                      >
                        {reto}
                      </span>
                      <span className="text-[10px] text-[#6B7280] block mt-0.5">
                        {isFound ? '✓ Localizado en la vitrina física' : 'Toca para marcar'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Banner de Jade al completar todos los retos */}
            {completedCount === retosList.length && (
              <div className="mt-3.5 p-3 rounded-xl bg-[#10B981]/15 border border-[#10B981]/40 text-[#10B981] text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                <span>🌟</span>
                <span>¡Excelente vista! Has localizado todos los detalles en la pieza física.</span>
              </div>
            )}
          </div>
        </section>
      )}



      {/* ================= ESPECIFICACIONES COMPLETAS DE LA PIEZA ================= */}
      {especificacionesEntries.length > 4 && (
        <section className="px-4 py-2">
          <div className="p-4 rounded-2xl bg-[#141419] border border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-[#F59E0B]" />
              <h3 className="text-xs font-bold tracking-wider uppercase text-white">
                Ficha Técnica Complementaria
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {especificacionesEntries.slice(4).map(([clave, valor]) => (
                <div key={clave} className="p-2.5 rounded-xl bg-[#0B0B0E] border border-white/5 text-xs">
                  <span className="text-[10px] uppercase font-bold text-[#6B7280] block truncate">
                    {clave}
                  </span>
                  <span className="font-semibold text-stone-200 mt-0.5 block truncate">
                    {valor}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= CONTROLES DE NAVEGACIÓN DE RUTA (ANTERIOR / SIGUIENTE / FINALIZAR) ================= */}
      {currentStopIndex !== undefined && totalStops !== undefined && totalStops > 0 && (
        <section id="tour-navigation-controls" className="px-4 pt-4">
          <div className="p-4 rounded-3xl bg-[#141419] border border-white/10 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs text-[#9CA3AF]">
              <span className="font-bold uppercase tracking-wider text-[10px] text-[#F59E0B] flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span>Navegación del Recorrido</span>
              </span>
              <span className="font-mono text-[10px] font-bold text-white px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                Parada {currentStopIndex + 1} de {totalStops}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Botón [ ⬅ Anterior ] */}
              <button
                id="btn-piece-prev-stop"
                type="button"
                onClick={onPreviousStop}
                disabled={currentStopIndex <= 0}
                className={`py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border transition-all active:scale-95 ${
                  currentStopIndex <= 0
                    ? 'opacity-30 border-white/5 bg-transparent text-[#6B7280] cursor-not-allowed'
                    : 'border-white/10 bg-[#0B0B0E] hover:bg-white/5 text-[#F3F4F6] cursor-pointer'
                }`}
              >
                <span>⬅</span>
                <span>Anterior</span>
              </button>

              {/* Botón [ Siguiente Parada ➔ ] o [ 🏁 Finalizar Recorrido ] */}
              {currentStopIndex >= totalStops - 1 ? (
                <button
                  id="btn-piece-finish-stop"
                  type="button"
                  onClick={onNextStop}
                  className="py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  <span>🏁</span>
                  <span>Finalizar Recorrido</span>
                </button>
              ) : (
                <button
                  id="btn-piece-next-stop"
                  type="button"
                  onClick={onNextStop}
                  className="py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all cursor-pointer"
                >
                  <span>Siguiente Parada</span>
                  <span>➔</span>
                </button>
              )}
            </div>

            {nextStop && currentStopIndex < totalStops - 1 && (
              <p className="text-[11px] text-[#9CA3AF] text-center pt-1 truncate">
                Próxima vitrina: <span className="text-white font-medium">{nextStop.title}</span> ({nextStop.room_zone || 'Siguiente sala'})
              </p>
            )}
          </div>
        </section>
      )}

      {/* ================= OTRAS PIEZAS EN ESTA SALA (CARRUSEL HORIZONTAL) ================= */}
      {siblingPieces.length > 0 && (
        <section className="px-4 py-5 border-t border-white/10 mt-6 bg-[#0E0E12]/90 rounded-3xl mx-2 border">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-base">🏛️</span>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white">
                  Otras piezas en {roomDisplayName}
                </h3>
                <p className="text-[11px] text-[#9CA3AF]">
                  Salta de vitrina en vitrina con un solo toque
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-[#F59E0B] px-2 py-0.5 rounded-full bg-[#F59E0B]/10 border border-[#F59E0B]/20 shrink-0">
              {siblingPieces.length} obras
            </span>
          </div>

          {/* Carrusel Horizontal Fluido */}
          <div className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-none snap-x snap-mandatory -mx-2 px-2">
            {siblingPieces.map((sibling) => {
              const sId = sibling.piece_id || sibling.id || (sibling as any).poi_id || '';
              const sTitle = sibling.titulo || sibling.identification?.title || sibling.title || 'Pieza';
              const sSub =
                sibling.frase_gancho || sibling.identification?.subtitle || sibling.periodo || 'Obra destacada';
              const sThumb =
                sibling.image_filename ||
                sibling.identification?.hero_image ||
                (sibling as any).hero_image ||
                (sibling as any).thumbnail ||
                (sibling as any).image;

              return (
                <div
                  key={sId}
                  onClick={() => {
                    if (onSelectPiece) onSelectPiece(sId);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (onSelectPiece) onSelectPiece(sId);
                    }
                  }}
                  className="snap-start shrink-0 w-44 rounded-2xl bg-[#141419] border border-white/10 hover:border-[#F59E0B]/60 p-2.5 flex flex-col justify-between transition-all duration-200 cursor-pointer active:scale-95 group shadow-lg select-none"
                >
                  <div>
                    <div className="relative w-full h-24 rounded-xl overflow-hidden bg-[#0B0B0E] mb-2 border border-white/5">
                      <PieceImage
                        imageFilename={sThumb}
                        pieceId={sId}
                        pieceTitle={sTitle}
                        title={sTitle}
                        alt={sTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[9px] font-mono text-stone-300 border border-white/10">
                        {sibling.orden_sugerido ? `Vitrina #${sibling.orden_sugerido}` : 'Vitrina'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-[#F3F4F6] truncate group-hover:text-[#F59E0B] transition-colors leading-tight">
                      {sTitle}
                    </h4>
                    <p className="text-[10px] text-[#9CA3AF] truncate mt-0.5">
                      {sSub}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSelectPiece) onSelectPiece(sId);
                    }}
                    className="mt-2.5 w-full py-1.5 px-2 rounded-xl bg-[#F59E0B]/10 hover:bg-[#F59E0B] text-[#F59E0B] hover:text-black font-extrabold text-[10px] flex items-center justify-center gap-1.5 transition-all border border-[#F59E0B]/30 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>Escuchar audio</span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

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
