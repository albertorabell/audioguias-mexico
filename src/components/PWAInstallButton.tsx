import React, { useState } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { useTheme } from '../utils/ThemeContext';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { isSunMode } = useTheme();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedFeedback, setInstalledFeedback] = useState(false);

  if (isInstalled) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border ${
          isSunMode
            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
            : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
        }`}
      >
        <Check className="w-4 h-4 text-emerald-600" />
        PWA Instalada
      </span>
    );
  }

  const handleInstall = async () => {
    const success = await install();
    if (success) {
      setInstalledFeedback(true);
    }
  };

  if (isInstallable) {
    return (
      <button
        id="btn-install-pwa"
        onClick={handleInstall}
        className={`min-h-[48px] inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-md transition active:scale-95 ${
          isSunMode
            ? 'bg-amber-700 hover:bg-amber-800 text-white shadow-amber-800/20'
            : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
        }`}
      >
        <Download className="w-4 h-4" />
        <span>{installedFeedback ? '¡Instalada!' : 'Instalar App'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          id="btn-install-ios"
          onClick={() => setShowIOSGuide(true)}
          className={`min-h-[48px] inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
            isSunMode
              ? 'bg-stone-100 hover:bg-stone-200 text-stone-900 border-stone-300'
              : 'bg-stone-900 hover:bg-stone-800 text-amber-300 border-stone-700'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Instalar en iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
            <div
              className={`w-full max-w-sm rounded-2xl p-6 shadow-2xl border transition-colors duration-200 ${
                isSunMode
                  ? 'bg-white border-stone-300 text-stone-900'
                  : 'bg-stone-900 border-stone-800 text-stone-100'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3
                  className={`text-base font-extrabold ${
                    isSunMode ? 'text-stone-950' : 'text-amber-400'
                  }`}
                >
                  Instalar en iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition ${
                    isSunMode ? 'hover:bg-stone-100 text-stone-600' : 'hover:bg-stone-800 text-stone-400'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p
                className={`text-sm space-y-2 mb-5 leading-relaxed font-medium ${
                  isSunMode ? 'text-stone-700' : 'text-stone-300'
                }`}
              >
                1. Toca el icono de <strong>Compartir</strong> en la barra inferior de Safari.<br />
                2. Desliza hacia abajo y pulsa <strong>«Agregar al inicio»</strong>.<br />
                3. Abre la app desde tu pantalla para usarla 100% offline en el museo.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className={`w-full min-h-[48px] rounded-xl py-3 text-xs font-extrabold transition shadow-md ${
                  isSunMode
                    ? 'bg-amber-700 hover:bg-amber-800 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-stone-950'
                }`}
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
