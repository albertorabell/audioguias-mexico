/**
 * Singleton TTS Player para audioguías del Museo Nacional de Antropología
 * Soporta voces neuronales en español (es-MX / es-ES), Screen Wake Lock API
 * y MediaSession API para controles en pantalla de bloqueo.
 */

type StateChangeListener = (playing: boolean) => void;

class TTSPlayer {
  private static instance: TTSPlayer;
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private wakeLock: WakeLockSentinel | null = null;
  private playing = false;
  private currentTitle = '';
  private currentText = '';
  private onEndCallback: (() => void) | null = null;
  private listeners: Set<StateChangeListener> = new Set();
  private keepAliveTimer: any = null;

  private constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      // Pre-cargar lista de voces
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => {
          // Voces inicializadas
        };
      }

      // Re-adquirir Wake Lock al volver de segundo plano si seguía reproduciendo
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', async () => {
          if (document.visibilityState === 'visible' && this.playing) {
            await this.requestWakeLock();
          }
        });
      }
    }
  }

  public static getInstance(): TTSPlayer {
    if (!TTSPlayer.instance) {
      TTSPlayer.instance = new TTSPlayer();
    }
    return TTSPlayer.instance;
  }

  /**
   * Selecciona prioritariamente voces neuronales/naturales en español de México/Latinoamérica:
   * 'Google español', 'Paulina', 'Jorge', 'Microsoft Sabina Online', 'es-MX', 'es-ES'
   */
  public getPreferredVoice(): SpeechSynthesisVoice | null {
    if (!this.synth) return null;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return null;

    // 1. Voces neuronales/naturales preferidas explícitas
    const preferredNames = [
      'google español',
      'paulina',
      'jorge',
      'microsoft sabina online',
      'sabina',
      'monica',
      'diego',
      'carlos',
      'ángel',
      'angel'
    ];

    for (const name of preferredNames) {
      const found = voices.find(v => v.name.toLowerCase().includes(name));
      if (found) return found;
    }

    // 2. Voz es-MX
    const mxVoice = voices.find(v => v.lang.toLowerCase() === 'es-mx' || v.lang.toLowerCase().startsWith('es-mx'));
    if (mxVoice) return mxVoice;

    // 3. Voz es-US / Latinoamérica
    const usVoice = voices.find(v => v.lang.toLowerCase().includes('es-us') || v.lang.toLowerCase().includes('es-419'));
    if (usVoice) return usVoice;

    // 4. Cualquier voz en español
    const anyEsVoice = voices.find(v => v.lang.toLowerCase().startsWith('es'));
    if (anyEsVoice) return anyEsVoice;

    return voices[0] || null;
  }

  /**
   * Solicita el Screen Wake Lock para evitar que la pantalla se apague mientras se narra
   */
  private async requestWakeLock() {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        if (!this.wakeLock) {
          this.wakeLock = await (navigator as any).wakeLock.request('screen');
          this.wakeLock?.addEventListener('release', () => {
            this.wakeLock = null;
          });
        }
      } catch (err) {
        console.warn('No se pudo activar el Screen Wake Lock:', err);
      }
    }
  }

  /**
   * Libera el Screen Wake Lock de manera segura
   */
  private async releaseWakeLock() {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
      } catch {
        // Ignorar error al liberar
      }
      this.wakeLock = null;
    }
  }

  /**
   * Configura la MediaSession API con título, autor 'Museo Nacional de Antropología'
   * y manejadores de pausa/parada
   */
  private setupMediaSession(title: string) {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: title || 'Audioguía Oficial',
          artist: 'Museo Nacional de Antropología',
          album: 'INAH · Recorrido de Sala',
          artwork: [
            { src: '/images/pieces/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/images/pieces/icon-512.png', sizes: '512x512', type: 'image/png' }
          ]
        });

        navigator.mediaSession.setActionHandler('pause', () => {
          this.stop();
        });

        navigator.mediaSession.setActionHandler('stop', () => {
          this.stop();
        });

        navigator.mediaSession.playbackState = 'playing';
      } catch (err) {
        console.warn('Error configurando MediaSession:', err);
      }
    }
  }

  private clearMediaSession() {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.playbackState = 'none';
      } catch {
        // Ignorar
      }
    }
  }

  private notify() {
    this.listeners.forEach(fn => {
      try {
        fn(this.playing);
      } catch {
        // Ignorar errores en listener
      }
    });
  }

  /**
   * Reproduce un texto con dicción pausada (pitch 1.0, rate 0.95)
   * activando Screen Wake Lock y MediaSession
   */
  public play(text: string, title: string, onEnd?: () => void): void {
    if (!this.synth) {
      console.warn('SpeechSynthesis no disponible en este navegador');
      onEnd?.();
      return;
    }

    // Si ya está reproduciendo, detener primero
    this.stop();

    if (!text || !text.trim()) {
      onEnd?.();
      return;
    }

    this.currentTitle = title;
    this.currentText = text;
    this.onEndCallback = onEnd || null;

    // Limpiar caracteres de formato innecesarios
    const cleanText = text
      .replace(/[#*_~`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.currentUtterance = utterance;

    // Configuración de audio requerida: pitch 1.0 y rate 0.95
    utterance.pitch = 1.0;
    utterance.rate = 0.95;

    const voice = this.getPreferredVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => {
      this.cleanup();
      const cb = this.onEndCallback;
      this.onEndCallback = null;
      cb?.();
    };

    utterance.onerror = (event) => {
      // Si fue cancelado intencionalmente por stop(), no emitir error
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        console.warn('Error en SpeechSynthesis:', event.error);
      }
      this.cleanup();
    };

    // Prevenir el bug de Chrome donde speechSynthesis se congela tras 14s
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
    }
    this.keepAliveTimer = setInterval(() => {
      if (this.playing && this.synth && this.synth.speaking) {
        this.synth.pause();
        this.synth.resume();
      } else {
        if (this.keepAliveTimer) clearInterval(this.keepAliveTimer);
      }
    }, 10000);

    this.playing = true;
    this.requestWakeLock();
    this.setupMediaSession(title);
    this.notify();

    try {
      this.synth.speak(utterance);
    } catch (err) {
      console.error('Fallo al ejecutar synth.speak:', err);
      this.cleanup();
    }
  }

  /**
   * Detiene inmediatamente la narración y libera recursos
   */
  public stop(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }

    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // Ignorar
      }
    }

    this.cleanup();
  }

  private cleanup() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
    this.playing = false;
    this.currentUtterance = null;
    this.releaseWakeLock();
    this.clearMediaSession();
    this.notify();
  }

  /**
   * Indica si la locución está activa
   */
  public isPlaying(): boolean {
    return this.playing && !!this.synth && (this.synth.speaking || this.synth.pending);
  }

  public getCurrentTitle(): string {
    return this.currentTitle;
  }

  /**
   * Permite suscribirse a cambios de estado de reproducción
   */
  public subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    listener(this.isPlaying());
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const ttsPlayer = TTSPlayer.getInstance();
export default ttsPlayer;
