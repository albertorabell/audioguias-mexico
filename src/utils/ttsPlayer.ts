/**
 * Singleton TTS Player para audioguías del Museo Nacional de Antropología
 * Soporta voces neuronales en español (es-MX / es-ES), Screen Wake Lock API,
 * MediaSession API para controles en pantalla de bloqueo, seguimiento de progreso,
 * salto de 15 segundos (-15s / +15s), control de velocidad y estado para el Mini-Player flotante.
 */

export interface TTSState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  progress: number; // 0 to 1
  title: string;
  roomName: string;
  artworkUrl: string;
  script: string;
  audioMode: 'expres' | 'inmersion';
  playbackRate: number;
  pieceId?: string;
}

type StateChangeListener = (playing: boolean, state: TTSState) => void;

class TTSPlayer {
  private static instance: TTSPlayer;
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private wakeLock: WakeLockSentinel | null = null;
  private playing = false;
  private isPaused = false;
  private currentTitle = '';
  private currentRoomName = '';
  private currentArtworkUrl = '';
  private currentScript = '';
  private currentPieceId?: string;
  private audioMode: 'expres' | 'inmersion' = 'expres';
  private playbackRate = 1.0;
  private currentTime = 0;
  private estimatedDuration = 60;
  private timer: any = null;
  private keepAliveTimer: any = null;
  private onEndCallback: (() => void) | null = null;
  private listeners: Set<StateChangeListener> = new Set();

  private constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => {
          // Voces inicializadas
        };
      }

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

  public getPreferredVoice(): SpeechSynthesisVoice | null {
    if (!this.synth) return null;
    const voices = this.synth.getVoices();
    if (!voices || voices.length === 0) return null;

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

    const mxVoice = voices.find(v => v.lang.toLowerCase() === 'es-mx' || v.lang.toLowerCase().startsWith('es-mx'));
    if (mxVoice) return mxVoice;

    const usVoice = voices.find(v => v.lang.toLowerCase().includes('es-us') || v.lang.toLowerCase().includes('es-419'));
    if (usVoice) return usVoice;

    const anyEsVoice = voices.find(v => v.lang.toLowerCase().startsWith('es'));
    if (anyEsVoice) return anyEsVoice;

    return voices[0] || null;
  }

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

  private async releaseWakeLock() {
    if (this.wakeLock) {
      try {
        await this.wakeLock.release();
      } catch {
        // Ignorar
      }
      this.wakeLock = null;
    }
  }

  private setupMediaSession(title: string, artworkUrl?: string) {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        const artwork = artworkUrl
          ? [{ src: artworkUrl, sizes: '512x512', type: 'image/jpeg' }]
          : [
              { src: '/images/pieces/icon-192.png', sizes: '192x192', type: 'image/png' },
              { src: '/images/pieces/icon-512.png', sizes: '512x512', type: 'image/png' }
            ];

        navigator.mediaSession.metadata = new MediaMetadata({
          title: title || 'Audioguía Oficial',
          artist: 'Museo Nacional de Antropología',
          album: this.currentRoomName || 'INAH · Recorrido Oficial',
          artwork,
        });

        navigator.mediaSession.setActionHandler('play', () => {
          this.resume();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          this.pause();
        });
        navigator.mediaSession.setActionHandler('stop', () => {
          this.stop();
        });
        navigator.mediaSession.setActionHandler('seekbackward', () => {
          this.skip(-15);
        });
        navigator.mediaSession.setActionHandler('seekforward', () => {
          this.skip(15);
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

  public getState(): TTSState {
    const progress = this.estimatedDuration > 0
      ? Math.min(1, Math.max(0, this.currentTime / this.estimatedDuration))
      : 0;

    return {
      isPlaying: this.playing && !this.isPaused,
      isPaused: this.isPaused,
      currentTime: Math.round(this.currentTime),
      duration: Math.round(this.estimatedDuration),
      progress,
      title: this.currentTitle,
      roomName: this.currentRoomName,
      artworkUrl: this.currentArtworkUrl,
      script: this.currentScript,
      audioMode: this.audioMode,
      playbackRate: this.playbackRate,
      pieceId: this.currentPieceId,
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach(fn => {
      try {
        fn(state.isPlaying, state);
      } catch {
        // Ignorar
      }
    });
  }

  private calculateDuration(text: string, rate: number): number {
    const cleanText = text.replace(/[#*_~`]/g, '').trim();
    const words = cleanText.split(/\s+/).filter(Boolean);
    // Velocidad media en español ~135 palabras por minuto (~2.25 palabras por segundo)
    const baseSeconds = Math.max(15, words.length / (2.25 * rate));
    return baseSeconds;
  }

  /**
   * Reproduce un texto con dicción pausada (pitch 1.0, rate configurable)
   */
  public play(
    text: string,
    title: string,
    onEnd?: () => void,
    meta?: {
      roomName?: string;
      artworkUrl?: string;
      pieceId?: string;
      mode?: 'expres' | 'inmersion';
    }
  ): void {
    if (!this.synth) {
      console.warn('SpeechSynthesis no disponible en este navegador');
      onEnd?.();
      return;
    }

    this.stop();

    if (!text || !text.trim()) {
      onEnd?.();
      return;
    }

    this.currentTitle = title;
    this.currentScript = text;
    this.currentRoomName = meta?.roomName || '';
    this.currentArtworkUrl = meta?.artworkUrl || '';
    this.currentPieceId = meta?.pieceId;
    this.audioMode = meta?.mode || (text.length > 350 ? 'inmersion' : 'expres');
    this.onEndCallback = onEnd || null;
    this.currentTime = 0;
    this.isPaused = false;
    this.estimatedDuration = this.calculateDuration(text, this.playbackRate);

    const cleanText = text
      .replace(/[#*_~`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    this.currentUtterance = utterance;

    utterance.pitch = 1.0;
    utterance.rate = 0.95 * this.playbackRate;

    const voice = this.getPreferredVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onboundary = (event) => {
      if (cleanText.length > 0 && event.charIndex !== undefined) {
        const ratio = event.charIndex / cleanText.length;
        this.currentTime = ratio * this.estimatedDuration;
        this.notify();
      }
    };

    utterance.onend = () => {
      this.cleanup();
      const cb = this.onEndCallback;
      this.onEndCallback = null;
      cb?.();
    };

    utterance.onerror = (event) => {
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        console.warn('Error en SpeechSynthesis:', event.error);
      }
      this.cleanup();
    };

    // Timer de avance suave
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.playing && !this.isPaused) {
        this.currentTime = Math.min(this.estimatedDuration, this.currentTime + 0.25);
        this.notify();
      }
    }, 250);

    // Keepalive para Chrome
    if (this.keepAliveTimer) clearInterval(this.keepAliveTimer);
    this.keepAliveTimer = setInterval(() => {
      if (this.playing && !this.isPaused && this.synth && this.synth.speaking) {
        this.synth.pause();
        this.synth.resume();
      } else if (!this.playing) {
        if (this.keepAliveTimer) clearInterval(this.keepAliveTimer);
      }
    }, 10000);

    this.playing = true;
    this.requestWakeLock();
    this.setupMediaSession(title, meta?.artworkUrl);
    this.notify();

    try {
      this.synth.speak(utterance);
    } catch (err) {
      console.error('Fallo al ejecutar synth.speak:', err);
      this.cleanup();
    }
  }

  /**
   * Pausa la narración
   */
  public pause(): void {
    if (this.synth && this.playing && !this.isPaused) {
      try {
        this.synth.pause();
      } catch (err) {
        console.warn('Error en synth.pause:', err);
      }
      this.isPaused = true;
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
      this.notify();
    }
  }

  /**
   * Reanuda la narración
   */
  public resume(): void {
    if (this.synth && this.playing && this.isPaused) {
      try {
        this.synth.resume();
      } catch (err) {
        console.warn('Error en synth.resume:', err);
      }
      this.isPaused = false;
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
      this.notify();
    } else if (!this.playing && this.currentScript) {
      // Volver a reproducir si estaba detenido
      this.play(this.currentScript, this.currentTitle, this.onEndCallback || undefined, {
        roomName: this.currentRoomName,
        artworkUrl: this.currentArtworkUrl,
        pieceId: this.currentPieceId,
        mode: this.audioMode,
      });
    }
  }

  /**
   * Alterna play / pause
   */
  public togglePlay(): void {
    if (this.isPlaying()) {
      this.pause();
    } else if (this.isPaused) {
      this.resume();
    } else if (this.currentScript) {
      this.resume();
    }
  }

  /**
   * Salta 15 segundos adelante o atrás
   */
  public skip(seconds: number): void {
    if (!this.currentScript) return;
    const newTime = Math.max(0, Math.min(this.estimatedDuration, this.currentTime + seconds));
    this.currentTime = newTime;
    const ratio = this.estimatedDuration > 0 ? this.currentTime / this.estimatedDuration : 0;

    // Calcular índice aproximado del texto para reanudar desde esa posición
    const cleanText = this.currentScript.replace(/[#*_~`]/g, '').trim();
    const charIndex = Math.floor(ratio * cleanText.length);
    const remainingText = cleanText.slice(charIndex);

    if (this.synth) {
      this.synth.cancel();
      if (remainingText.trim() && this.playing) {
        const utterance = new SpeechSynthesisUtterance(remainingText);
        this.currentUtterance = utterance;
        utterance.pitch = 1.0;
        utterance.rate = 0.95 * this.playbackRate;
        const voice = this.getPreferredVoice();
        if (voice) utterance.voice = voice;

        utterance.onboundary = (event) => {
          if (event.charIndex !== undefined) {
            const relRatio = (charIndex + event.charIndex) / cleanText.length;
            this.currentTime = relRatio * this.estimatedDuration;
            this.notify();
          }
        };

        utterance.onend = () => {
          this.cleanup();
          this.onEndCallback?.();
        };

        try {
          this.synth.speak(utterance);
        } catch (e) {
          console.warn('Error al saltar audio:', e);
        }
      }
    }
    this.notify();
  }

  /**
   * Cambia la velocidad de reproducción (1x, 1.25x, 1.5x)
   */
  public setRate(rate: number): void {
    this.playbackRate = rate;
    if (this.playing && this.currentScript) {
      this.estimatedDuration = this.calculateDuration(this.currentScript, this.playbackRate);
      this.skip(0); // Reiniciar en posición actual con nuevo rate
    } else {
      this.notify();
    }
  }

  /**
   * Detiene inmediatamente la narración y libera recursos
   */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
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
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
    this.playing = false;
    this.isPaused = false;
    this.currentUtterance = null;
    this.releaseWakeLock();
    this.clearMediaSession();
    this.notify();
  }

  public isPlaying(): boolean {
    return this.playing && !this.isPaused && !!this.synth && (this.synth.speaking || this.synth.pending);
  }

  public getCurrentTitle(): string {
    return this.currentTitle;
  }

  public subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    listener(this.isPlaying(), this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const ttsPlayer = TTSPlayer.getInstance();
export default ttsPlayer;
