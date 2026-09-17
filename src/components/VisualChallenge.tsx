import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle2, Circle, Trophy } from 'lucide-react';
import { VisualChallengeItem } from '../types';
import { useTheme } from '../utils/ThemeContext';

interface VisualChallengeProps {
  challenges: VisualChallengeItem[];
  poiId: string;
}

export const VisualChallenge: React.FC<VisualChallengeProps> = ({
  challenges,
  poiId,
}) => {
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [showToast, setShowToast] = useState(false);
  const { isSunMode } = useTheme();

  // Load completed items for this POI from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`challenge_${poiId}`);
      if (stored) {
        setCheckedIds(JSON.parse(stored));
      } else {
        setCheckedIds([]);
      }
    } catch {
      setCheckedIds([]);
    }
  }, [poiId]);

  const toggleChallenge = (id: string) => {
    setCheckedIds((prev) => {
      const isChecked = prev.includes(id);
      const updated = isChecked ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem(`challenge_${poiId}`, JSON.stringify(updated));
      } catch {
        // ignore
      }

      // Toast upon completing all items
      if (!isChecked && updated.length === challenges.length && challenges.length > 0) {
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
        }, 4500);
      }

      return updated;
    });
  };

  const completedCount = checkedIds.length;
  const isAllComplete = completedCount === challenges.length && challenges.length > 0;

  return (
    <div className="space-y-3 relative">
      {/* Toast Alert on 100% completion */}
      {showToast && (
        <div
          id="challenge-completed-toast"
          className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[420px] p-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border animate-in fade-in slide-in-from-top-4 duration-300 ${
            isSunMode
              ? 'bg-amber-100 border-amber-400 text-amber-950'
              : 'bg-gradient-to-r from-amber-500 to-amber-400 border-amber-300 text-stone-950'
          }`}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isSunMode ? 'bg-amber-700 text-white' : 'bg-stone-950 text-amber-400'
            }`}
          >
            <Trophy className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-extrabold text-sm leading-tight">¡Agudeza Arqueológica al 100%! 🎉</p>
            <p className="font-medium mt-0.5">Has localizado todas las pistas ocultas de la pieza en campo.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              isSunMode
                ? 'bg-emerald-100 border border-emerald-300 text-emerald-800'
                : 'bg-teal-500/20 border border-teal-500/40 text-teal-400'
            }`}
          >
            <Eye className="w-4 h-4" />
          </div>
          <h3
            className={`text-xs font-extrabold uppercase tracking-wider ${
              isSunMode ? 'text-[#111827]' : 'text-stone-200'
            }`}
          >
            Reto de Observación
          </h3>
        </div>
        <span
          className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
            isAllComplete
              ? isSunMode
                ? 'bg-emerald-100 text-emerald-900 border-emerald-400'
                : 'bg-emerald-950 text-emerald-300 border-emerald-700'
              : isSunMode
              ? 'bg-stone-100 text-[#4B5563] border-stone-300'
              : 'bg-stone-900 text-stone-400 border-stone-800'
          }`}
        >
          {completedCount} / {challenges.length} encontradas
        </span>
      </div>

      <p className={`text-xs italic font-medium ${isSunMode ? 'text-[#4B5563]' : 'text-stone-400'}`}>
        "Párate frente a la pieza y busca los siguientes detalles con la vista:"
      </p>

      {/* Interactive Items (ampliados a mínimo 48px de altura táctil) */}
      <div className="space-y-2.5">
        {challenges.map((item, index) => {
          const isChecked = checkedIds.includes(item.id);
          return (
            <button
              key={item.id}
              id={`challenge-item-${index + 1}`}
              onClick={() => toggleChallenge(item.id)}
              className={`w-full min-h-[48px] text-left p-3.5 rounded-xl border transition flex items-start gap-3 active:scale-98 shadow-xs ${
                isChecked
                  ? isSunMode
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-teal-950/40 border-teal-500/40 text-stone-200'
                  : isSunMode
                  ? 'bg-white border-stone-300 hover:border-amber-700 text-[#111827]'
                  : 'bg-stone-900/70 border-stone-800 hover:border-stone-700 text-stone-300'
              }`}
            >
              <div className="pt-0.5 shrink-0">
                {isChecked ? (
                  <CheckCircle2
                    className={`w-5 h-5 ${
                      isSunMode ? 'text-emerald-700 fill-emerald-100' : 'text-teal-400 fill-teal-950'
                    }`}
                  />
                ) : (
                  <Circle
                    className={`w-5 h-5 ${
                      isSunMode ? 'text-stone-400' : 'text-stone-500'
                    }`}
                  />
                )}
              </div>
              <div className="flex-1">
                <p
                  className={`text-xs font-bold leading-snug ${
                    isChecked
                      ? isSunMode
                        ? 'line-through text-emerald-900/70'
                        : 'line-through text-teal-300/70'
                      : isSunMode
                      ? 'text-[#111827]'
                      : 'text-stone-100'
                  }`}
                >
                  {item.title}
                </p>
                <p
                  className={`text-xs mt-0.5 leading-relaxed ${
                    isChecked
                      ? isSunMode
                        ? 'text-emerald-800/80'
                        : 'text-stone-400'
                      : isSunMode
                      ? 'text-[#4B5563]'
                      : 'text-stone-400'
                  }`}
                >
                  {item.clue}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
