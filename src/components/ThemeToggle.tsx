import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../utils/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { isSunMode, toggleTheme } = useTheme();

  return (
    <button
      id="btn-theme-toggle"
      onClick={toggleTheme}
      className={`min-h-[48px] px-3 flex items-center justify-center gap-2 rounded-xl transition duration-200 active:scale-95 select-none ${
        isSunMode
          ? 'bg-amber-100/90 text-amber-900 border border-amber-300 hover:bg-amber-200/90 shadow-xs'
          : 'bg-stone-900 text-amber-400 border border-stone-800 hover:bg-stone-800 shadow-xs'
      } ${className}`}
      aria-label={isSunMode ? 'Cambiar a Modo Museo (interior)' : 'Cambiar a Modo Sol (exterior)'}
      title={isSunMode ? 'Cambiar a Modo Museo (Salas oscuras)' : 'Cambiar a Modo Sol (Exterior Teotihuacán)'}
    >
      {isSunMode ? (
        <>
          <Sun className="w-5 h-5 text-amber-600 fill-amber-500/20" />
          {showLabel && <span className="text-xs font-bold text-amber-950">Modo Sol</span>}
        </>
      ) : (
        <>
          <Moon className="w-5 h-5 text-amber-400 fill-amber-400/20" />
          {showLabel && <span className="text-xs font-bold text-amber-300">Modo Museo</span>}
        </>
      )}
    </button>
  );
};
