import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { getAssetUrl } from '../utils/urlHelper';
import { track } from '../utils/analytics';
import { useLanguage } from '../utils/LanguageContext';
import { portadaTexts } from '../i18n/portada';

/** Idiomas en que existen los 30 s de la Piedra del Sol (public/audio/muestras/piedra_sol_<idioma>.mp3). */
const IDIOMAS_MUESTRA = ['es', 'en', 'fr', 'pl', 'de', 'pt', 'it'];

/**
 * «▶ Escucha 30 segundos»: 30 s de la Piedra del Sol para probar la voz antes de elegir un sitio.
 * Nunca suena solo: empieza al tocar el botón. Se mide con el mismo evento de las guías (guide_sample, sitio «portada»).
 */
export const MuestraBoton: React.FC = () => {
  const { currentLanguage } = useLanguage();
  const t = portadaTexts(currentLanguage);
  const lang = IDIOMAS_MUESTRA.includes(currentLanguage) ? currentLanguage : 'es';
  const audio = useRef<HTMLAudioElement | null>(null);
  const [sonando, setSonando] = useState(false);

  useEffect(() => {
    // Al cambiar de idioma o salir de la pantalla se detiene
    return () => {
      audio.current?.pause();
      audio.current = null;
      setSonando(false);
    };
  }, [lang]);

  const alternar = () => {
    if (!audio.current) {
      const a = new Audio(getAssetUrl(`audio/muestras/piedra_sol_${lang}.mp3`));
      a.addEventListener('ended', () => setSonando(false));
      a.addEventListener('pause', () => setSonando(false));
      a.addEventListener('play', () => setSonando(true));
      audio.current = a;
    }
    const a = audio.current;
    if (a.paused) {
      void a.play().catch(() => setSonando(false));
      track('guide_sample', { s: 'portada', p: 'mna_s06_piedra_sol', l: lang });
    } else {
      a.pause();
    }
  };

  return (
    <div>
      <button type="button" onClick={alternar} aria-pressed={sonando} className="btn-primary !min-h-12 gap-2 px-5">
        {sonando ? <Pause className="w-5 h-5" strokeWidth={2.25} /> : <Play className="w-5 h-5" strokeWidth={2.25} />}
        <span>{sonando ? t.muestraPausa : t.muestra}</span>
      </button>
      <p className="mt-2 text-cap text-ink-3">{t.muestraDe}</p>
    </div>
  );
};
