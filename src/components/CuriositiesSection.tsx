import React from 'react';
import { HelpCircle, Lightbulb } from 'lucide-react';
import { CuriosityItem } from '../types';

interface CuriositiesSectionProps {
  curiosities: CuriosityItem[];
}

export const CuriositiesSection: React.FC<CuriositiesSectionProps> = ({
  curiosities,
}) => {
  if (!curiosities || curiosities.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
          <Lightbulb className="w-3.5 h-3.5" />
        </div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200">
          ¿Sabías qué?
        </h3>
      </div>

      <div className="space-y-2.5">
        {curiosities.map((item, idx) => (
          <div
            key={item.id || idx}
            id={`curiosity-card-${idx + 1}`}
            className="p-3.5 rounded-xl bg-gradient-to-r from-stone-900 to-stone-900/60 border border-stone-800 hover:border-amber-500/30 transition flex items-start gap-3 shadow-xs"
          >
            <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              {idx + 1}
            </div>
            <p className="text-xs text-stone-300 leading-relaxed">
              {item.fact}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
