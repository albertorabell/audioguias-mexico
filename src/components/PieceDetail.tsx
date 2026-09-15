import React, { useState } from 'react';
import {
  Maximize2,
  BookOpen,
  GraduationCap,
  Lock,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  Layers,
  Scale,
  Calendar,
  Compass,
  Lightbulb
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
}

export const PieceDetail: React.FC<PieceDetailProps> = ({
  piece,
  hasPass,
  passPriceMxn,
  onOpenPaywall,
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'expert'>('quick');
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [completedChallenges, setCompletedChallenges] = useState<Record<number, boolean>>({});
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const { isSunMode } = useTheme();

  const isLocked = piece.is_premium && !hasPass;

  // Normalizar Retos de Observación (Requisito 3 & 5)
  const challenges: ObservationChallengeItem[] = React.useMemo(() => {
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

  // Normalizar ¿Sabías qué? (Requisito 3 & 5)
  const didYouKnowList: string[] = React.useMemo(() => {
    if (piece.did_you_know && piece.did_you_know.length > 0) {
      return piece.did_you_know;
    }
    if (piece.curiosities && piece.curiosities.length > 0) {
      return piece.curiosities.map((c) => c.fact);
    }
    return [];
  }, [piece.did_you_know, piece.curiosities]);

  // Normalizar Ficha Técnica (Requisito 3 & 5: specs con material, provenance, weight y age)
  const normalizedSpecs = React.useMemo(() => {
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

  // Normalizar FAQ (Requisito 3 & 5)
  const faqList = React.useMemo(() => {
    if (piece.faq && piece.faq.length > 0) return piece.faq;
    if (piece.faqs && piece.faqs.length > 0) return piece.faqs;
    return [];
  }, [piece.faq, piece.faqs]);

  // Toggle challenge completion
  const toggleChallenge = (index: number) => {
    setCompletedChallenges((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const completedCount = Object.values(completedChallenges).filter(Boolean).length;
  const summaryText = piece.summary_30s || piece.narrative.short_desc;
  const deepText = piece.narrative.deep_desc || piece.audioguide.audio_script;

  return (
    <div className={`pb-32 transition-colors duration-200 ${isSunMode ? 'text-stone-900' : 'text-stone-100'}`}>
      {/* 1. Hero Image Section */}
      <div className="relative w-full h-72 bg-stone-950 overflow-hidden group">
        <SafeImage
          src={piece.identification.hero_image}
          alt={piece.identification.title}
          fallbackTitle={piece.identification.title}
          fallbackSubtitle={piece.identification.culture_period}
          className="w-full h-full cursor-pointer"
          imgClassName="object-cover object-center cursor-pointer transition duration-300 group-hover:scale-102"
          onClick={() => setIsZoomOpen(true)}
        />
        <div
          className={`absolute inset-0 pointer-events-none ${
            isSunMode
              ? 'bg-gradient-to-t from-stone-900/80 via-transparent to-transparent'
              : 'bg-gradient-to-t from-stone-950 via-stone-950/30 to-transparent'
          }`}
        />

        {/* Floating Zoom Button */}
        <button
          type="button"
          id="btn-open-zoom-hero"
          onClick={() => setIsZoomOpen(true)}
          className={`absolute bottom-4 right-4 min-h-[48px] px-3.5 flex items-center gap-1.5 rounded-full backdrop-blur-md text-xs font-bold shadow-lg transition active:scale-95 border ${
            isSunMode
              ? 'bg-white/95 text-stone-950 border-stone-300 hover:bg-white'
              : 'bg-stone-900/90 text-stone-200 border-stone-700/80 hover:bg-stone-800'
          }`}
        >
          <Maximize2 className={`w-4 h-4 ${isSunMode ? 'text-amber-800' : 'text-amber-400'}`} />
          <span>Zoom HD</span>
        </button>

        {/* Premium / Free Pill on Hero */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          {piece.is_premium ? (
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-extrabold shadow-md flex items-center gap-1.5 ${
                isSunMode ? 'bg-amber-600 text-white' : 'bg-amber-500 text-stone-950'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              Pieza Exclusiva
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-700 text-white shadow-md">
              Parada Destacada
            </span>
          )}
        </div>
      </div>

      {/* 2. Main Title & Identification */}
      <div className="px-4 pt-4 pb-4">
        <div
          className={`flex items-center gap-1.5 text-xs font-bold mb-1.5 ${
            isSunMode ? 'text-amber-800' : 'text-amber-400'
          }`}
        >
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="truncate">{piece.identification.room_zone}</span>
        </div>

        <h1
          className={`text-xl font-extrabold tracking-tight leading-snug mb-1.5 ${
            isSunMode ? 'text-stone-950' : 'text-white'
          }`}
        >
          {piece.identification.title}
        </h1>

        <p className={`text-xs font-bold mb-3 ${isSunMode ? 'text-stone-600' : 'text-stone-400'}`}>
          {piece.identification.culture_period}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {piece.identification.tags.map((tag) => (
            <span
              key={tag}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                isSunMode
                  ? 'bg-white border-stone-300 text-stone-800'
                  : 'bg-stone-900 border-stone-800 text-stone-300'
              }`}
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* One-liner synthesis quote */}
        {piece.narrative.one_liner && (
          <div
            className={`p-3.5 rounded-xl text-xs leading-relaxed italic mb-5 border font-medium ${
              isSunMode
                ? 'bg-[#F9F6F0] border-amber-300/80 text-amber-950 shadow-xs'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
            }`}
          >
            "{piece.narrative.one_liner}"
          </div>
        )}

        {/* 3. Tarjeta de Audioguía Interactiva */}
        <div className="mb-6">
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

        {/* 4. Selector de Pestañas: Vistazo Rápido vs Para Expertos (min 48px de altura táctil) */}
        <div className="mb-6">
          <div
            className={`grid grid-cols-2 p-1 rounded-2xl border mb-4 ${
              isSunMode
                ? 'bg-stone-200/80 border-stone-300'
                : 'bg-stone-900 border-stone-800'
            }`}
          >
            <button
              type="button"
              id="tab-quick-view"
              onClick={() => setActiveTab('quick')}
              className={`min-h-[48px] flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-extrabold transition active:scale-98 ${
                activeTab === 'quick'
                  ? isSunMode
                    ? 'bg-white text-stone-950 shadow-sm border border-stone-300'
                    : 'bg-stone-800 text-amber-400 shadow-xs'
                  : isSunMode
                  ? 'text-stone-700 hover:text-stone-950'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Vistazo rápido</span>
            </button>
            <button
              type="button"
              id="tab-expert-view"
              onClick={() => setActiveTab('expert')}
              className={`min-h-[48px] flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-extrabold transition active:scale-98 relative ${
                activeTab === 'expert'
                  ? isSunMode
                    ? 'bg-white text-stone-950 shadow-sm border border-stone-300'
                    : 'bg-stone-800 text-amber-400 shadow-xs'
                  : isSunMode
                  ? 'text-stone-700 hover:text-stone-950'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Para expertos</span>
              {isLocked && (
                <Lock
                  className={`w-3.5 h-3.5 ml-0.5 ${
                    isSunMode ? 'text-amber-800' : 'text-amber-400'
                  }`}
                />
              )}
            </button>
          </div>

          {/* ================= PESTAÑA 1: VISTAZO RÁPIDO ================= */}
          {activeTab === 'quick' && (
            <div className="space-y-4">
              {/* Resumen de 30 Segundos (Requisito 3 & 5: summary_30s) */}
              <div
                className={`p-4 rounded-2xl border ${
                  isSunMode
                    ? 'bg-white border-stone-300 text-stone-900 shadow-xs'
                    : 'bg-stone-900/60 border-stone-800 text-stone-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3
                    className={`text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                      isSunMode ? 'text-amber-800' : 'text-amber-400'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Resumen de 30 Segundos
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSunMode ? 'bg-amber-100 text-amber-900' : 'bg-amber-950 text-amber-300'
                    }`}
                  >
                    Lectura rápida
                  </span>
                </div>
                <p className={`text-xs leading-relaxed font-medium ${isSunMode ? 'text-stone-800' : 'text-stone-200'}`}>
                  {summaryText}
                </p>
              </div>

              {/* Retos de Observación (Requisito 3 & 5: observation_challenges { titulo, descripcion }) */}
              {challenges.length > 0 && (
                <div
                  className={`p-4 rounded-2xl border ${
                    isSunMode
                      ? 'bg-white border-stone-300 text-stone-900 shadow-xs'
                      : 'bg-stone-900/60 border-stone-800 text-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <h3
                      className={`text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
                        isSunMode ? 'text-amber-800' : 'text-amber-400'
                      }`}
                    >
                      <Compass className="w-4 h-4" />
                      Retos de Observación
                    </h3>
                    <span className="text-[10px] font-mono font-bold opacity-75">
                      {completedCount} de {challenges.length} encontrados
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mb-3">
                    Párate frente a la pieza original en la sala y busca los siguientes detalles:
                  </p>

                  <div className="space-y-2.5">
                    {challenges.map((challenge, idx) => {
                      const isFound = !!completedChallenges[idx];
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleChallenge(idx)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                            isFound
                              ? isSunMode
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                                : 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                              : isSunMode
                              ? 'bg-stone-50 border-stone-200 hover:border-amber-300'
                              : 'bg-stone-800/60 border-stone-700 hover:border-amber-500/40'
                          }`}
                        >
                          <div className="pt-0.5 shrink-0">
                            <CheckCircle2
                              className={`w-4 h-4 transition-colors ${
                                isFound
                                  ? 'text-emerald-600 fill-emerald-100 dark:fill-emerald-900'
                                  : 'text-stone-400'
                              }`}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold mb-0.5 flex items-center gap-2">
                              <span>{challenge.titulo}</span>
                              {isFound && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-emerald-600 text-white rounded">
                                  ¡Encontrado!
                                </span>
                              )}
                            </div>
                            <p className="text-xs leading-relaxed opacity-90">
                              {challenge.descripcion}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ¿Sabías qué? (Requisito 3 & 5: did_you_know) */}
              {didYouKnowList.length > 0 && (
                <div
                  className={`p-4 rounded-2xl border ${
                    isSunMode
                      ? 'bg-white border-stone-300 text-stone-900 shadow-xs'
                      : 'bg-stone-900/60 border-stone-800 text-stone-200'
                  }`}
                >
                  <h3
                    className={`text-xs font-extrabold uppercase tracking-wider mb-2.5 flex items-center gap-1.5 ${
                      isSunMode ? 'text-amber-800' : 'text-amber-400'
                    }`}
                  >
                    <Lightbulb className="w-4 h-4" />
                    ¿Sabías qué?
                  </h3>

                  <div className="space-y-2">
                    {didYouKnowList.map((fact, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex items-start gap-2.5 ${
                          isSunMode
                            ? 'bg-amber-50/50 border-amber-200/80 text-amber-950'
                            : 'bg-stone-800/50 border-stone-700/80 text-stone-200'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs leading-relaxed font-medium flex-1">
                          {fact}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= PESTAÑA 2: PARA EXPERTOS ================= */}
          {activeTab === 'expert' && (
            <div className="space-y-4">
              {/* Análisis Arqueológico Profundo con Paywall */}
              <div
                className={`relative rounded-2xl border overflow-hidden ${
                  isSunMode
                    ? 'bg-white border-stone-300 shadow-xs'
                    : 'bg-stone-900/60 border-stone-800'
                }`}
              >
                {isLocked ? (
                  <div className="relative p-4">
                    <div className="blur-xs select-none pointer-events-none opacity-40 space-y-2">
                      <h3
                        className={`text-xs font-extrabold uppercase tracking-wider mb-2 ${
                          isSunMode ? 'text-amber-800' : 'text-amber-400'
                        }`}
                      >
                        Análisis Arqueológico Profundo
                      </h3>
                      <p className="text-xs leading-relaxed font-medium">
                        {deepText}
                      </p>
                    </div>

                    {/* Lock Overlay */}
                    <div
                      className={`absolute inset-0 flex flex-col items-center justify-center p-5 text-center z-10 backdrop-blur-xs ${
                        isSunMode
                          ? 'bg-white/85 text-stone-950'
                          : 'bg-stone-950/75 text-white'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 ${
                          isSunMode
                            ? 'bg-amber-100 border border-amber-300 text-amber-800'
                            : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                        }`}
                      >
                        <Lock className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-extrabold mb-1">
                        Contenido Exclusivo para Expertos
                      </p>
                      <p
                        className={`text-[11px] max-w-[270px] mb-3.5 font-medium ${
                          isSunMode ? 'text-stone-700' : 'text-stone-400'
                        }`}
                      >
                        Desbloquea el análisis iconográfico completo, ficha arqueológica y fuentes académicas.
                      </p>
                      <button
                        type="button"
                        id="btn-unlock-expert-tab"
                        onClick={onOpenPaywall}
                        className={`min-h-[48px] px-5 py-3 rounded-xl text-xs font-extrabold transition active:scale-95 shadow-md ${
                          isSunMode
                            ? 'bg-amber-700 hover:bg-amber-800 text-white shadow-amber-800/20'
                            : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
                        }`}
                      >
                        Desbloquear recorrido completo (${passPriceMxn} MXN)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    <h3
                      className={`text-xs font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${
                        isSunMode ? 'text-amber-800' : 'text-amber-400'
                      }`}
                    >
                      <GraduationCap className="w-4 h-4" />
                      Análisis Arqueológico Profundo
                    </h3>
                    <p
                      className={`text-xs leading-relaxed text-justify font-medium ${
                        isSunMode ? 'text-stone-800' : 'text-stone-200'
                      }`}
                    >
                      {deepText}
                    </p>
                  </div>
                )}
              </div>

              {/* Ficha Técnica Arqueológica Estructurada (Requisito 3 & 5: specs { material, provenance, weight, age }) */}
              {normalizedSpecs && (
                <div
                  className={`p-4 rounded-2xl border ${
                    isSunMode
                      ? 'bg-white border-stone-300 text-stone-900 shadow-xs'
                      : 'bg-stone-900/60 border-stone-800 text-stone-200'
                  }`}
                >
                  <h3
                    className={`text-xs font-extrabold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${
                      isSunMode ? 'text-amber-800' : 'text-amber-400'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    Ficha Arqueológica Oficial
                  </h3>

                  <div className="grid grid-cols-1 gap-2.5 text-xs">
                    {/* Material */}
                    {normalizedSpecs.material && (
                      <div
                        className={`p-2.5 rounded-xl border flex items-center gap-3 ${
                          isSunMode ? 'bg-stone-50 border-stone-200' : 'bg-stone-800/60 border-stone-700'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Material</div>
                          <div className="font-semibold">{normalizedSpecs.material}</div>
                        </div>
                      </div>
                    )}

                    {/* Procedencia / Hallazgo */}
                    {normalizedSpecs.provenance && (
                      <div
                        className={`p-2.5 rounded-xl border flex items-center gap-3 ${
                          isSunMode ? 'bg-stone-50 border-stone-200' : 'bg-stone-800/60 border-stone-700'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Procedencia / Hallazgo</div>
                          <div className="font-semibold">{normalizedSpecs.provenance}</div>
                        </div>
                      </div>
                    )}

                    {/* Peso y Dimensiones */}
                    {normalizedSpecs.weight && (
                      <div
                        className={`p-2.5 rounded-xl border flex items-center gap-3 ${
                          isSunMode ? 'bg-stone-50 border-stone-200' : 'bg-stone-800/60 border-stone-700'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                          <Scale className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Dimensiones y Peso</div>
                          <div className="font-semibold">{normalizedSpecs.weight}</div>
                        </div>
                      </div>
                    )}

                    {/* Antigüedad / Período */}
                    {normalizedSpecs.age && (
                      <div
                        className={`p-2.5 rounded-xl border flex items-center gap-3 ${
                          isSunMode ? 'bg-stone-50 border-stone-200' : 'bg-stone-800/60 border-stone-700'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider opacity-60">Cronología / Datación</div>
                          <div className="font-semibold">{normalizedSpecs.age}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preguntas Frecuentes y Debate Arqueológico (Requisito 3 & 5: faq { question, answer }) */}
              {faqList.length > 0 && (
                <div
                  className={`p-4 rounded-2xl border ${
                    isSunMode
                      ? 'bg-white border-stone-300 text-stone-900 shadow-xs'
                      : 'bg-stone-900/60 border-stone-800 text-stone-200'
                  }`}
                >
                  <h3
                    className={`text-xs font-extrabold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${
                      isSunMode ? 'text-amber-800' : 'text-amber-400'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    Preguntas Frecuentes y Debate
                  </h3>

                  <div className="space-y-2">
                    {faqList.map((item, idx) => {
                      const isOpen = openFaqIndex === idx;
                      return (
                        <div
                          key={idx}
                          className={`rounded-xl border transition-all overflow-hidden ${
                            isSunMode ? 'border-stone-200 bg-stone-50' : 'border-stone-800 bg-stone-800/40'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                            className="w-full text-left p-3 flex items-center justify-between gap-3"
                          >
                            <span className="text-xs font-bold">{item.question}</span>
                            <ChevronDown
                              className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                                isOpen ? 'rotate-180 text-amber-500' : 'text-stone-400'
                              }`}
                            />
                          </button>
                          {isOpen && (
                            <div className="px-3 pb-3 pt-1 text-xs leading-relaxed opacity-90 border-t border-dashed border-stone-200 dark:border-stone-700">
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
      </div>

      {/* Fullscreen Image Zoom Modal */}
      <ImageZoomModal
        isOpen={isZoomOpen}
        onClose={() => setIsZoomOpen(false)}
        imageUrl={piece.identification.hero_image}
        title={piece.identification.title}
        subtitle={piece.identification.culture_period}
      />
    </div>
  );
};
