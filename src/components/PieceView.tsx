import React, { useState } from 'react';
import { Maximize2, Tag, BookOpen, GraduationCap, Lock, Sparkles, MapPin } from 'lucide-react';
import { PieceData } from '../types';
import { AudioPlayer } from './AudioPlayer';
import { VisualChallenge } from './VisualChallenge';
import { CuriositiesSection } from './CuriositiesSection';
import { AccordionsSection } from './AccordionsSection';
import { ImageZoomModal } from './ImageZoomModal';

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

  const isLocked = piece.is_premium && !hasPass;

  return (
    <div className="pb-28 text-stone-100">
      {/* 1. Hero Image Section */}
      <div className="relative w-full h-72 bg-stone-950 overflow-hidden group">
        <img
          src={piece.identification.hero_image}
          alt={piece.identification.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center cursor-pointer transition duration-300 group-hover:scale-102"
          onClick={() => setIsZoomOpen(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent pointer-events-none" />

        {/* Floating Zoom Button */}
        <button
          id="btn-open-zoom-hero"
          onClick={() => setIsZoomOpen(true)}
          className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900/90 text-stone-200 border border-stone-700/80 backdrop-blur-xs text-xs font-semibold shadow-lg hover:bg-stone-800 transition active:scale-95"
        >
          <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Zoom HD</span>
        </button>

        {/* Premium / Free Pill on Hero */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          {piece.is_premium ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-stone-950 shadow-md flex items-center gap-1">
              <Sparkles className="w-3 h-3 fill-stone-950" />
              Pieza Premium
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-md">
              Parada Gratuita
            </span>
          )}
        </div>
      </div>

      {/* 2. Main Title & Identification */}
      <div className="px-4 pt-3 pb-4">
        <div className="flex items-center gap-1.5 text-amber-400 text-xs font-medium mb-1">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{piece.identification.room_zone}</span>
        </div>

        <h1 className="text-xl font-extrabold text-white tracking-tight leading-snug mb-1.5">
          {piece.identification.title}
        </h1>

        <p className="text-xs font-semibold text-stone-400 mb-3">
          {piece.identification.culture_period}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {piece.identification.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 rounded-md text-[10px] font-medium bg-stone-900 border border-stone-800 text-stone-300"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* One-liner synthesis */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-medium leading-relaxed italic mb-5">
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

        {/* 4. Selector de Texto (Tabs): Vistazo Rápido vs Para Expertos */}
        <div className="mb-6">
          <div className="grid grid-cols-2 p-1 rounded-xl bg-stone-900 border border-stone-800 mb-3">
            <button
              id="tab-quick-view"
              onClick={() => setActiveTab('quick')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${
                activeTab === 'quick'
                  ? 'bg-stone-800 text-amber-400 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Vistazo rápido</span>
            </button>
            <button
              id="tab-expert-view"
              onClick={() => setActiveTab('expert')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition relative ${
                activeTab === 'expert'
                  ? 'bg-stone-800 text-amber-400 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Para expertos</span>
              {isLocked && (
                <Lock className="w-3 h-3 text-amber-500 ml-0.5" />
              )}
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'quick' ? (
            <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                Resumen de 30 Segundos
              </h3>
              <p className="text-xs text-stone-200 leading-relaxed">
                {piece.narrative.short_desc}
              </p>
            </div>
          ) : (
            <div className="relative rounded-2xl bg-stone-900/60 border border-stone-800 overflow-hidden">
              {isLocked ? (
                // Locked / Blurred State for "Para Expertos"
                <div className="relative p-4">
                  <div className="blur-xs select-none pointer-events-none opacity-40 space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
                      Análisis Arqueológico Profundo
                    </h3>
                    <p className="text-xs text-stone-300 leading-relaxed">
                      {piece.narrative.deep_desc}
                    </p>
                  </div>

                  {/* Lock Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs text-center z-10">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-2">
                      <Lock className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold text-white mb-1">
                      Contenido Exclusivo para Expertos
                    </p>
                    <p className="text-[11px] text-stone-400 max-w-[260px] mb-3">
                      Desbloquea el análisis iconográfico completo, traducciones de códices y fuentes coloniales.
                    </p>
                    <button
                      id="btn-unlock-expert-tab"
                      onClick={onOpenPaywall}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition active:scale-95 shadow-md"
                    >
                      Desbloquear recorrido completo (${passPriceMxn} MXN)
                    </button>
                  </div>
                </div>
              ) : (
                // Unlocked "Para Expertos"
                <div className="p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" />
                    Análisis Arqueológico Profundo
                  </h3>
                  <p className="text-xs text-stone-200 leading-relaxed text-justify">
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
