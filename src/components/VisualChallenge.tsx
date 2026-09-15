import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle2, Circle, Trophy, Sparkles } from 'lucide-react';
import { VisualChallengeItem } from '../types';

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

      // Check if newly completed all challenges
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
          className="fixed top-14 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-[420px] p-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 text-stone-950 font-bold shadow-2xl flex items-center gap-3 border border-amber-300 animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="w-8 h-8 rounded-xl bg-stone-950 text-amber-400 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-extrabold text-stone-950 text-sm">¡Agudeza Arqueológica al 100%! 🎉</p>
            <p className="font-medium text-stone-900">Has localizado todas las pistas ocultas de la pieza.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
            <Eye className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200">
            Reto de Observación
          </h3>
        </div>
        <span
          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
            isAllComplete
              ? 'bg-emerald-950 text-emerald-400 border-emerald-700'
              : 'bg-stone-900 text-stone-400 border-stone-800'
          }`}
        >
          {completedCount} / {challenges.length} encontradas
        </span>
      </div>

      <p className="text-xs text-stone-400 italic">
        "Párate frente a la pieza y busca los siguientes detalles con la vista:"
      </p>

      {/* Interactive Items */}
      <div className="space-y-2">
        {challenges.map((item, index) => {
          const isChecked = checkedIds.includes(item.id);
          return (
            <button
              key={item.id}
              id={`challenge-item-${index + 1}`}
              onClick={() => toggleChallenge(item.id)}
              className={`w-full text-left p-3 rounded-xl border transition flex items-start gap-3 active:scale-99 ${
                isChecked
                  ? 'bg-teal-950/40 border-teal-500/40 text-stone-200'
                  : 'bg-stone-900/70 border-stone-800 hover:border-stone-700 text-stone-300'
              }`}
            >
              <div className="pt-0.5 shrink-0">
                {isChecked ? (
                  <CheckCircle2 className="w-5 h-5 text-teal-400 fill-teal-950" />
                ) : (
                  <Circle className="w-5 h-5 text-stone-500 hover:text-amber-400" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-xs font-bold ${isChecked ? 'text-teal-300 line-through opacity-80' : 'text-stone-100'}`}>
                  {item.title}
                </p>
                <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">
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
