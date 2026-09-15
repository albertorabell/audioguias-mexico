import React, { useState } from 'react';
import { Maximize2, BookOpen, GraduationCap, Lock, Sparkles, MapPin } from 'lucide-react';
import { PieceData } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { VisualChallenge } from './VisualChallenge';
import { CuriositiesSection } from './CuriositiesSection';
import { AccordionsSection } from './AccordionsSection';
import { ImageZoomModal } from './ImageZoomModal';
import { useTheme } from '../utils/ThemeContext';

interface PieceViewProps {
  piece: PieceData;
  hasPass: boolean;
  passPriceMxn: number;
  onOpenPaywall: () => void;
}

export const PieceView: React.FC<PieceViewProps> = ({
  piece,
  hasPass,
  passPriceMxn,
  onOpenPaywall,
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'expert'>('quick');
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const { isSunMode } = useTheme();

  const isLocked = piece.is_premium && !hasPass;

  return (
    <div className={`pb-32 transition-colors duration-200 ${isSunMode ? 'text-stone-900' : 'text-stone-100'}`}>
      {/* 1. Hero Image Section */}
      <div className="relative w-full h-72 bg-stone-950 overflow-hidden group">
        <img
          src={piece.identification.hero_image}
          alt={piece.identification.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center cursor-pointer transition duration-300 group-hover:scale-102"
          onClick={() => setIsZoomOpen(true)}
        />
        <div
          className={`absolute inset-0 pointer-events-none ${
            isSunMode
              ? 'bg-gradient-to-t from-stone-900/80 via-transparent to-transparent'
              : 'bg-gradient-to-t from-stone-950 via-stone-950/30 to-transparent'
          }`}
        />

        {/* Floating Zoom Button (min 48px de altura táctil) */}
        <button
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
              Pieza Premium
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-700 text-white shadow-md">
              Parada Gratuita
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
        <div
          className={`p-3.5 rounded-xl text-xs leading-relaxed italic mb-5 border font-medium ${
            isSunMode
              ? 'bg-[#F9F6F0] border-amber-300/80 text-amber-950 shadow-xs'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
          }`}
        >
          "{piece.narrative.one_liner}"
        </div>

        {/* 3. Tarjeta de Audioguía Interactiva */}
        <div className="mb-6">
          <AudioPlayer
            script={piece.audioguide.audio_script}
            audioFileUrl={piece.audioguide.audio_file_url}
            isPremium={piece.is_premium}
            hasPass={hasPass}
            passPriceMxn={passPriceMxn}
            onUnlockClick={onOpenPaywall}
            title={piece.identification.title}
          />
        </div>

        {/* 4. Selector de Texto (Tabs): Vistazo Rápido vs Para Expertos (min 48px de altura táctil) */}
        <div className="mb-6">
          <div
            className={`grid grid-cols-2 p-1 rounded-2xl border mb-3 ${
              isSunMode
                ? 'bg-stone-200/80 border-stone-300'
                : 'bg-stone-900 border-stone-800'
            }`}
          >
            <button
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

          {/* Tab Content */}
          {activeTab === 'quick' ? (
            <div
              className={`p-4 rounded-2xl border ${
                isSunMode
                  ? 'bg-white border-stone-300 text-stone-900 shadow-xs'
                  : 'bg-stone-900/60 border-stone-800 text-stone-200'
              }`}
            >
              <h3
                className={`text-xs font-extrabold uppercase tracking-wider mb-2 ${
                  isSunMode ? 'text-amber-800' : 'text-amber-400'
                }`}
              >
                Resumen de 30 Segundos
              </h3>
              <p className={`text-xs leading-relaxed font-medium ${isSunMode ? 'text-stone-800' : 'text-stone-200'}`}>
                {piece.narrative.short_desc}
              </p>
            </div>
          ) : (
            <div
              className={`relative rounded-2xl border overflow-hidden ${
                isSunMode
                  ? 'bg-white border-stone-300 shadow-xs'
                  : 'bg-stone-900/60 border-stone-800'
              }`}
            >
              {isLocked ? (
                // Locked / Blurred State for "Para Expertos"
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
                      {piece.narrative.deep_desc}
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
                      Desbloquea el análisis iconográfico completo, traducciones de códices y fuentes coloniales.
                    </p>
                    <button
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
                // Unlocked "Para Expertos"
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
                    {piece.narrative.deep_desc}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. Reto de Observación ("Párate frente a la pieza y busca") */}
        <div className="mb-6">
          <VisualChallenge
            challenges={piece.visual_challenge}
            poiId={piece.poi_id}
          />
        </div>

        {/* 6. Curiosidades ("¿Sabías qué?") */}
        <div className="mb-6">
          <CuriositiesSection curiosities={piece.curiosities} />
        </div>

        {/* 7. Acordeones: Ficha Técnica y Preguntas Frecuentes */}
        <div className="mb-6">
          <AccordionsSection
            specs={piece.specs}
            faqs={piece.faqs}
          />
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
