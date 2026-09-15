import React, { useState } from 'react';
import { Download, Smartphone, X, Check } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedFeedback, setInstalledFeedback] = useState(false);

  if (isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
        <Check className="w-3.5 h-3.5" />
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
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-sm transition active:scale-95"
      >
        <Download className="w-3.5 h-3.5" />
        {installedFeedback ? '¡Instalada!' : 'Instalar App'}
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          id="btn-install-ios"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-700 transition"
        >
          <Smartphone className="w-3.5 h-3.5" />
          Instalar en iOS
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-stone-900 border border-stone-800 p-6 shadow-2xl text-stone-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-amber-400">Instalar en iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-stone-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-stone-300 space-y-2 mb-4">
                1. Toca el icono de <strong>Compartir</strong> en la barra inferior de Safari.<br />
                2. Desliza hacia abajo y pulsa <strong>«Agregar al inicio»</strong>.<br />
                3. Abre la app desde tu pantalla para usarla 100% offline en el museo.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition"
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
