import React, { useState, useMemo } from 'react';
import {
  Maximize2,
  Lock,
  Sparkles,
  Clock,
  Check,
  ChevronDown,
  Layers,
  HelpCircle,
  Eye,
  Bookmark,
  MapPin
} from 'lucide-react';
import { PieceData, ObservationChallengeItem, PieceSpecsObject, SpecItem } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { ImageZoomModal } from './ImageZoomModal';
import { SafeImage } from './SafeImage';
import { useTheme } from '../utils/ThemeContext';

interface PieceDetailProps {
  piece: PieceData;
  hasPass: boolean;
  passPriceMxn: number;
  onOpenPaywall: () => void;
  currentStopIndex?: number;
  totalStops?: number;
  roomName?: string;
}

export const PieceDetail: React.FC<PieceDetailProps> = ({
  piece,
  hasPass,
  passPriceMxn,
  onOpenPaywall,
  currentStopIndex,
  totalStops,
  roomName,
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'expert'>('quick');
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState<Record<number, boolean>>({});
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const { isSunMode } = useTheme();

  const isLocked = piece.is_premium && !hasPass;

  // Normalización de Retos de Observación
  const challenges: ObservationChallengeItem[] = useMemo(() => {
    if (piece.observation_challenges && piece.observation_challenges.length > 0) {
      return piece.observation_challenges;
    }
    if (piece.visual_challenge && piece.visual_challenge.length > 0) {
      return piece.visual_challenge.map((vc) => ({
        titulo: vc.title,
        descripcion: vc.clue,
      }));
    }
    return [];
  }, [piece.observation_challenges, piece.visual_challenge]);

  // Normalización de ¿Sabías qué?
  const didYouKnowList: string[] = useMemo(() => {
    if (piece.did_you_know && piece.did_you_know.length > 0) {
      return piece.did_you_know;
    }
    if (piece.curiosities && piece.curiosities.length > 0) {
      return piece.curiosities.map((c) => c.fact);
    }
    return [];
  }, [piece.did_you_know, piece.curiosities]);

  // Normalización de Ficha Técnica Arqueológica
  const normalizedSpecs = useMemo(() => {
    if (!piece.specs) return null;
    if (Array.isArray(piece.specs)) {
      const arraySpecs = piece.specs as SpecItem[];
      return {
        material: arraySpecs.find((s) => /material/i.test(s.label))?.value || '',
        provenance: arraySpecs.find((s) => /procedencia|hallazgo|origen/i.test(s.label))?.value || '',
        weight: arraySpecs.find((s) => /peso|dimensión|dimensiones/i.test(s.label))?.value || '',
        age: arraySpecs.find((s) => /antigüedad|datación|periodo|fecha/i.test(s.label))?.value || '',
      };
    }
    return piece.specs as PieceSpecsObject;
  }, [piece.specs]);

  // Normalización de Preguntas Frecuentes
  const faqList = useMemo(() => {
    if (piece.faq && piece.faq.length > 0) return piece.faq;
    if (piece.faqs && piece.faqs.length > 0) return piece.faqs;
    return [];
  }, [piece.faq, piece.faqs]);

  // Toggle de Retos de Observación
  const toggleChallenge = (index: number) => {
    setCompletedChallenges((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const completedCount = Object.values(completedChallenges).filter(Boolean).length;
  const summaryText = piece.summary_30s || piece.narrative.short_desc;
  const deepText = piece.narrative.deep_desc || piece.audioguide.audio_script;

  // Formato del badge de ubicación / parada
  const stopBadgeText = useMemo(() => {
    const sala = roomName || piece.identification.room_zone || 'Sala';
    if (typeof currentStopIndex === 'number' && typeof totalStops === 'number' && totalStops > 0) {
      return `Parada ${currentStopIndex + 1} de ${totalStops} · ${sala}`;
    }
    return sala;
  }, [currentStopIndex, totalStops, roomName, piece.identification.room_zone]);

  return (
    <article
      className={`pb-28 transition-colors duration-200 ${
        isSunMode ? 'text-[#1C1917]' : 'text-[#F5F5F4]'
      }`}
    >
      {/* 1. HERO E IMAGEN PRINCIPAL */}
      <section className="px-4 pt-3 pb-1">
        <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-200 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 shadow-xs group">
          <SafeImage
            src={piece.identification.hero_image}
            alt={piece.identification.title}
            fallbackTitle={piece.identification.title}
            fallbackSubtitle={piece.identification.culture_period}
            loading="eager"
            className="w-full h-full cursor-pointer"
            imgClassName="w-full h-full object-cover object-center cursor-pointer transition-transform duration-500 group-hover:scale-[1.02]"
            onClick={() => setIsZoomOpen(true)}
          />

          {/* Badge de estado flotante y sutil */}
          <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-2 pointer-events-none">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide backdrop-blur-md bg-black/60 text-white border border-white/15 shadow-xs">
              <span>{stopBadgeText}</span>
            </div>

            {piece.is_premium && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase backdrop-blur-md bg-[#C05638]/90 text-white border border-white/20 shadow-xs">
                <Sparkles className="w-3 h-3" />
                <span>Exclusivo</span>
              </div>
            )}
          </div>

          {/* Botón flotante Zoom HD */}
          <button
            type="button"
            id="btn-open-zoom-hero"
            onClick={() => setIsZoomOpen(true)}
            aria-label="Abrir imagen en alta definición"
            className="absolute bottom-3.5 right-3.5 z-10 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide backdrop-blur-md bg-black/60 text-white border border-white/20 hover:bg-black/75 active:scale-95 transition-all shadow-xs"
          >
            <Maximize2 className="w-3.5 h-3.5 text-stone-200" />
            <span>Zoom HD</span>
          </button>
        </div>
      </section>

      {/* 2. TIPOGRAFÍA Y METADATOS EDITORIALES */}
      <section className="px-5 pt-4 pb-2">
        {/* Título de la obra con tipografía refinada */}
        <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-stone-900 dark:text-stone-100 leading-tight">
          {piece.identification.title}
        </h1>

        {/* Subtítulo sobrio: Cultura · Período */}
        {piece.identification.culture_period && (
          <p className="text-xs sm:text-sm font-sans tracking-wide text-stone-600 dark:text-stone-400 font-medium mt-1.5">
            {piece.identification.culture_period}
          </p>
        )}

        {/* 3. REPRODUCTOR DE AUDIO MINIMALISTA */}
        <div className="mt-5 mb-5">
          <AudioPlayer
            script={piece.audioguide.audio_script || summaryText}
            audioFileUrl={piece.audioguide.audio_file_url}
            isPremium={piece.is_premium}
            hasPass={hasPass}
            passPriceMxn={passPriceMxn}
            onUnlockClick={onOpenPaywall}
            title={piece.identification.title}
          />
        </div>

        {/* 4. SELECTOR DE PESTAÑAS: VISITA EN SALA vs. PARA EXPERTOS */}
        <div className="mb-6">
          <div
            className={`grid grid-cols-2 p-1 rounded-xl border mb-5 ${
              isSunMode
                ? 'bg-stone-200/50 border-stone-200'
                : 'bg-stone-900/60 border-stone-800'
            }`}
          >
            <button
              type="button"
              id="tab-quick-view"
              onClick={() => setActiveTab('quick')}
              className={`min-h-[44px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'quick'
                  ? isSunMode
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'bg-stone-800 text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Visita en Sala</span>
            </button>

            <button
              type="button"
              id="tab-expert-view"
              onClick={() => setActiveTab('expert')}
              className={`min-h-[44px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all relative ${
                activeTab === 'expert'
                  ? isSunMode
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'bg-stone-800 text-stone-100 shadow-xs'
                  : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>Para Expertos</span>
              {isLocked && (
                <Lock
                  className={`w-3 h-3 ml-0.5 ${
                    isSunMode ? 'text-[#C05638]' : 'text-[#D96B47]'
                  }`}
                />
              )}
            </button>
          </div>

          {/* ================= PESTAÑA 1: VISITA EN SALA ================= */}
          {activeTab === 'quick' && (
            <div className="space-y-6">
              {/* Frase gancho como cita tipográfica elegante */}
              {piece.narrative.one_liner && (
                <blockquote className="pl-4 border-l-2 border-[#C05638] dark:border-[#D96B47] italic font-serif text-base sm:text-lg text-stone-800 dark:text-stone-200 leading-relaxed">
                  “{piece.narrative.one_liner}”
                </blockquote>
              )}

              {/* Resumen de 30 segundos */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[#C05638] dark:text-[#D96B47]" />
                  <h3 className="text-xs font-semibold tracking-wider uppercase text-stone-500 dark:text-stone-400">
                    En 30 segundos
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-stone-800 dark:text-stone-200 font-sans font-normal">
                  {summaryText}
                </p>
              </div>

              {/* Retos de Observación interactivos */}
              {challenges.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold tracking-wider uppercase text-stone-500 dark:text-stone-400">
                      Reto de Observación
                    </h3>
                    <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                      {completedCount} de {challenges.length} observados
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Examina los detalles de la obra frente a ti:
                  </p>

                  <div className="space-y-2.5">
                    {challenges.map((challenge, idx) => {
                      const isFound = !!completedChallenges[idx];
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleChallenge(idx)}
                          role="checkbox"
                          aria-checked={isFound}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === ' ' || e.key === 'Enter') {
                              e.preventDefault();
                              toggleChallenge(idx);
                            }
                          }}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                            isFound
                              ? isSunMode
                                ? 'bg-stone-50 border-stone-300/80 text-stone-900'
                                : 'bg-stone-900/60 border-stone-800 text-stone-100'
                              : isSunMode
                              ? 'bg-transparent border-stone-200 hover:border-stone-300'
                              : 'bg-transparent border-stone-800/80 hover:border-stone-700'
                          }`}
                        >
                          {/* Minimalist custom round checkbox */}
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                              isFound
                                ? 'bg-[#C05638] dark:bg-[#D96B47] text-white shadow-xs'
                                : 'border border-stone-300 dark:border-stone-600 bg-transparent'
                            }`}
                          >
                            {isFound && <Check className="w-3 h-3 stroke-[2.5]" />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4
                              className={`text-xs font-semibold tracking-tight ${
                                isFound
                                  ? 'text-stone-900 dark:text-stone-100'
                                  : 'text-stone-800 dark:text-stone-200'
                              }`}
                            >
                              {challenge.titulo}
                            </h4>
                            <p className="text-xs leading-relaxed text-stone-600 dark:text-stone-400 mt-0.5">
                              {challenge.descripcion}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ubicación en el Museo / Sala */}
              <div
                id="piece-room-location-card"
                className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                  isSunMode
                    ? 'bg-stone-100/70 border-stone-200'
                    : 'bg-stone-900/60 border-stone-800'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSunMode
                        ? 'bg-[#C05638]/10 text-[#C05638]'
                        : 'bg-[#D96B47]/20 text-[#D96B47]'
                    }`}
                  >
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400 block">
                      Ubicación en el Museo
                    </span>
                    <span className="text-sm font-semibold truncate block text-stone-900 dark:text-stone-100">
                      {roomName || piece.location.room_name || 'Sala Mexica'}
                    </span>
                  </div>
                </div>

                {piece.location.case_number && (
                  <div className="text-right shrink-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                      Cédula / Vitrina
                    </span>
                    <span className="text-xs font-mono font-medium text-stone-700 dark:text-stone-300">
                      {piece.location.case_number}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= PESTAÑA 2: PARA EXPERTOS ================= */}
          {activeTab === 'expert' && (
            <div className="space-y-6">
              {/* Análisis Arqueológico Profundo con Paywall sobrio */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold tracking-wider uppercase text-stone-500 dark:text-stone-400">
                  Análisis Arqueológico Profundo
                </h3>

                {isLocked ? (
                  <div
                    className={`relative rounded-2xl border p-5 overflow-hidden ${
                      isSunMode
                        ? 'bg-stone-50/70 border-stone-200'
                        : 'bg-stone-900/50 border-stone-800'
                    }`}
                  >
                    {/* Blurred text sample */}
                    <div className="blur-xs select-none pointer-events-none opacity-30 text-xs leading-relaxed line-clamp-4">
                      {deepText}
                    </div>

                    {/* Clean Paywall CTA */}
                    <div className="relative pt-2 text-center flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center mb-2.5 ${
                          isSunMode
                            ? 'bg-[#C05638]/10 text-[#C05638]'
                            : 'bg-[#D96B47]/20 text-[#D96B47]'
                        }`}
                      >
                        <Lock className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-semibold text-stone-900 dark:text-stone-100 mb-1">
                        Acceso para Investigadores y Expertos
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400 max-w-[280px] mb-4">
                        Desbloquea el análisis iconográfico, la bibliografía y la interpretación histórica detallada.
                      </p>
                      <button
                        type="button"
                        id="btn-unlock-expert-tab"
                        onClick={onOpenPaywall}
                        className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all bg-[#C05638] hover:bg-[#A9482E] dark:bg-[#D96B47] dark:hover:bg-[#C05638] text-white active:scale-98 shadow-sm flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Desbloquear Recorrido (${passPriceMxn} MXN)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-1">
                    <p className="text-sm leading-relaxed text-stone-800 dark:text-stone-200 font-sans font-normal text-justify">
                      {deepText}
                    </p>
                  </div>
                )}
              </div>

              {/* Ficha Técnica Arqueológica en Tabla de 2 Columnas con Líneas Divisorias Suaves */}
              {normalizedSpecs && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-[#C05638] dark:text-[#D96B47]" />
                    <h3 className="text-xs font-semibold tracking-wider uppercase text-stone-500 dark:text-stone-400">
                      Ficha Técnica
                    </h3>
                  </div>

                  <div className="divide-y divide-stone-200/70 dark:divide-stone-800/70 pt-1">
                    {/* Material */}
                    {normalizedSpecs.material && (
                      <div className="py-2.5 flex items-baseline justify-between gap-4">
                        <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                          Material
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 text-right">
                          {normalizedSpecs.material}
                        </span>
                      </div>
                    )}

                    {/* Procedencia / Hallazgo */}
                    {normalizedSpecs.provenance && (
                      <div className="py-2.5 flex items-baseline justify-between gap-4">
                        <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                          Procedencia / Hallazgo
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 text-right">
                          {normalizedSpecs.provenance}
                        </span>
                      </div>
                    )}

                    {/* Dimensiones y Peso */}
                    {normalizedSpecs.weight && (
                      <div className="py-2.5 flex items-baseline justify-between gap-4">
                        <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                          Dimensiones / Peso
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 text-right">
                          {normalizedSpecs.weight}
                        </span>
                      </div>
                    )}

                    {/* Cronología / Datación */}
                    {normalizedSpecs.age && (
                      <div className="py-2.5 flex items-baseline justify-between gap-4">
                        <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                          Cronología
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 text-right">
                          {normalizedSpecs.age}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sección "¿Sabías qué?" con Viñetas Numeradas Estilizadas */}
              {didYouKnowList.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-semibold tracking-wider uppercase text-stone-500 dark:text-stone-400">
                    ¿Sabías qué?
                  </h3>

                  <div className="divide-y divide-stone-200/70 dark:divide-stone-800/70">
                    {didYouKnowList.map((fact, idx) => (
                      <div key={idx} className="py-3 flex items-start gap-3">
                        <span className="font-serif text-sm font-semibold text-[#C05638] dark:text-[#D96B47] shrink-0 mt-0.5">
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <p className="text-xs sm:text-sm leading-relaxed text-stone-700 dark:text-stone-300 font-normal flex-1">
                          {fact}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Acordeones Fluidos para Preguntas Frecuentes (FAQ) */}
              {faqList.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="w-3.5 h-3.5 text-[#C05638] dark:text-[#D96B47]" />
                    <h3 className="text-xs font-semibold tracking-wider uppercase text-stone-500 dark:text-stone-400">
                      Preguntas y Debate
                    </h3>
                  </div>

                  <div className="divide-y divide-stone-200/70 dark:divide-stone-800/70 border-y border-stone-200/70 dark:border-stone-800/70">
                    {faqList.map((item, idx) => {
                      const isOpen = openFaqIndex === idx;
                      return (
                        <div key={idx} className="py-1">
                          <button
                            type="button"
                            onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                            className="w-full text-left py-3 flex items-center justify-between gap-3 group transition-colors"
                          >
                            <span className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 group-hover:text-[#C05638] dark:group-hover:text-[#D96B47]">
                              {item.question}
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                                isOpen
                                  ? 'rotate-180 text-[#C05638] dark:text-[#D96B47]'
                                  : 'text-stone-400'
                              }`}
                            />
                          </button>
                          {isOpen && (
                            <div className="pb-3 text-xs sm:text-sm leading-relaxed text-stone-600 dark:text-stone-300 animate-in fade-in duration-200">
                              {item.answer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Fullscreen Image Zoom Modal */}
      <ImageZoomModal
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        imageUrl={piece.identification.hero_image}
        title={piece.identification.title}
        subtitle={piece.identification.culture_period}
      />
    </article>
  );
};
