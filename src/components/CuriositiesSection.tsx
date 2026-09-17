import React from 'react';
import { Lightbulb } from 'lucide-react';
import { CuriosityItem } from '../types';
import { useTheme } from '../utils/ThemeContext';

interface CuriositiesSectionProps {
  curiosities: CuriosityItem[];
}

export const CuriositiesSection: React.FC<CuriositiesSectionProps> = ({
  curiosities,
}) => {
  const { isSunMode } = useTheme();

  if (!curiosities || curiosities.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            isSunMode
              ? 'bg-amber-100 border border-amber-300 text-amber-800'
              : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
        </div>
        <h3
          className={`text-xs font-extrabold uppercase tracking-wider ${
            isSunMode ? 'text-[#111827]' : 'text-stone-200'
          }`}
        >
          ¿Sabías qué?
        </h3>
      </div>

      <div className="space-y-2.5">
        {curiosities.map((item, idx) => (
          <div
            key={item.id || idx}
            id={`curiosity-card-${idx + 1}`}
            className={`p-3.5 rounded-xl border transition flex items-start gap-3 shadow-xs ${
              isSunMode
                ? 'bg-white border-stone-300 text-[#111827] hover:border-amber-700'
                : 'bg-gradient-to-r from-stone-900 to-stone-900/60 border-stone-800 text-stone-300 hover:border-amber-500/30'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5 border ${
                isSunMode
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              {idx + 1}
            </div>
            <p className={`text-xs leading-relaxed font-medium ${isSunMode ? 'text-[#111827]' : 'text-stone-300'}`}>
              {item.fact}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
