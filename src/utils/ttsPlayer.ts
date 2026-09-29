/**
 * Singleton Hybrid Audio & TTS Player para audioguías del Museo Nacional de Antropología
 * Soporta reproducción prioritaria de archivos de audio HTML5 (<audio src="...mp3">)
 * con fallback transparente a SpeechSynthesis (Web Speech API con Keep-Alive y voces en español es-MX).
 * Integra Screen Wake Lock API, MediaSession API para controles en pantalla de bloqueo,
 * seguimiento de progreso, salto de 15 segundos (-15s / +15s), control de velocidad y estado reactivo.
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
  isHtmlAudio?: boolean;
  audioUrl?: string;
}

type StateChangeListener = (playing: boolean, state: TTSState) => void;

class TTSPlayer {
  private static instance: TTSPlayer;
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private htmlAudio: HTMLAudioElement | null = null;
  private isHtmlAudio = false;
  private currentAudioUrl = '';

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

  private cachedVoices: SpeechSynthesisVoice[] = [];

  private constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      const loadVoices = () => {
        try {
          const v = this.synth?.getVoices() || [];
          if (v.length > 0) {
            this.cachedVoices = v;
          }
        } catch {
          // Ignorar
        }
      };

      loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => {
          loadVoices();
        };
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
        } catch {
          // Ignorar
        }
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
    const voices = (this.synth.getVoices() && this.synth.getVoices().length > 0)
      ? this.synth.getVoices()
      : this.cachedVoices;
    if (!voices || voices.length === 0) return null;

    // 1. Inspeccionar activamente voces mexicanas: es-MX / es_MX
    const spanishMxVoice =
      voices.find(v => v.lang === 'es-MX' || v.lang === 'es_MX' || v.lang.toLowerCase() === 'es-mx') ||
      voices.find(v => v.lang.toLowerCase().includes('es-mx'));

    // 2. Voces neuronales preferidas en español
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
      'angel',
      'soledad',
      'lupe'
    ];

    const namedSpanishVoice = voices.find(v => {
      const isSpanish = v.lang.toLowerCase().startsWith('es');
      if (!isSpanish) return false;
      const name = v.name.toLowerCase();
      return preferredNames.some(p => name.includes(p));
    });

    if (namedSpanishVoice) return namedSpanishVoice;
    if (spanishMxVoice) return spanishMxVoice;

    // 3. Respaldo a cualquier voz en español (es-US, es-419, es-ES, etc.)
    const spanishVoice =
      voices.find(v => v.lang.startsWith('es-') || v.lang.startsWith('es_')) ||
      voices.find(v => v.lang.startsWith('es') || v.lang.toLowerCase().startsWith('es'));

    if (spanishVoice) return spanishVoice;

    // Nunca retornar una voz extranjera (en inglés, etc.)
    return null;
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
      isHtmlAudio: this.isHtmlAudio,
      audioUrl: this.currentAudioUrl,
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
   * Reproduce una pieza priorizando archivo MP3 en HTML5 Audio si está disponible,
   * con fallback automático a síntesis de voz en español es-MX.
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
      audioUrl?: string;
    }
  ): void {
    this.stop();

    const rawAudioUrl = (meta?.audioUrl || '').trim();
    const hasValidAudioUrl =
      rawAudioUrl.length > 4 &&
      (/\.(mp3|m4a|aac|wav|ogg)(\?.*)?$/i.test(rawAudioUrl) ||
        rawAudioUrl.startsWith('http://') ||
        rawAudioUrl.startsWith('https://') ||
        rawAudioUrl.startsWith('data:audio'));

    // 1. PRIORIDAD: Reproducir archivo MP3 mediante HTML5 Audio
    if (hasValidAudioUrl) {
      this.currentTitle = title;
      this.currentScript = text;
      this.currentRoomName = meta?.roomName || '';
      this.currentArtworkUrl = meta?.artworkUrl || '';
      this.currentPieceId = meta?.pieceId;
      this.audioMode = meta?.mode || (text.length > 350 ? 'inmersion' : 'expres');
      this.onEndCallback = onEnd || null;
      this.currentTime = 0;
      this.isPaused = false;
      this.currentAudioUrl = rawAudioUrl;
      this.isHtmlAudio = true;

      try {
        const audio = new Audio(rawAudioUrl);
        this.htmlAudio = audio;
        audio.playbackRate = this.playbackRate;

        audio.onloadedmetadata = () => {
          if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
            this.estimatedDuration = audio.duration;
            this.notify();
          }
        };

        audio.ontimeupdate = () => {
          this.currentTime = audio.currentTime;
          if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
            this.estimatedDuration = audio.duration;
          }
          this.notify();
        };

        audio.onended = () => {
          this.cleanup();
          const cb = this.onEndCallback;
          this.onEndCallback = null;
          cb?.();
        };

        audio.onerror = (e) => {
          console.warn('HTML5 Audio falló al cargar archivo MP3, activando fallback a SpeechSynthesis:', e);
          this.cleanupHtmlAudio();
          // Fallback automático a síntesis de voz
          this.playSpeechSynthesis(text, title, onEnd, meta);
        };

        this.playing = true;
        this.requestWakeLock();
        this.setupMediaSession(title, meta?.artworkUrl);
        this.notify();

        audio.play().catch((err) => {
          console.warn('Error al iniciar HTML5 Audio play(), fallback a SpeechSynthesis:', err);
          this.cleanupHtmlAudio();
          this.playSpeechSynthesis(text, title, onEnd, meta);
        });
        return;
      } catch (err) {
        console.warn('Fallo al inicializar HTML5 Audio, fallback a SpeechSynthesis:', err);
        this.cleanupHtmlAudio();
      }
    }

    // 2. FALLBACK / NATIVO: Síntesis de voz Web Speech API
    this.playSpeechSynthesis(text, title, onEnd, meta);
  }

  /**
   * Reproducción nativa mediante SpeechSynthesis con Keep-Alive y dicción en español
   */
  private playSpeechSynthesis(
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

    if (!text || !text.trim()) {
      onEnd?.();
      return;
    }

    this.isHtmlAudio = false;
    this.currentAudioUrl = '';
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
    if (typeof window !== 'undefined') {
      (window as any).__ttsKeepAliveUtterance = utterance;
    }

    // Forzar estrictamente idioma en español para evitar acento extranjero en sistemas en inglés
    utterance.lang = 'es-MX';
    utterance.pitch = 1.0;
    utterance.rate = 0.95 * this.playbackRate;

    const spanishVoice = this.getPreferredVoice();
    if (spanishVoice) {
      utterance.voice = spanishVoice;
      utterance.lang = spanishVoice.lang || 'es-MX';
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
      if (this.playing && !this.isPaused && !this.isHtmlAudio) {
        this.currentTime = Math.min(this.estimatedDuration, this.currentTime + 0.25);
        this.notify();
      }
    }, 250);

    // Keep-Alive para Web Speech API (evita corte a los 15s)
    this.startKeepAlive();

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
   * Inicia el truco Keep-Alive para evitar que navegadores móviles (Chrome/Safari)
   * silencien la locución a los 15 segundos: pausa y reanuda cada 14s.
   */
  private startKeepAlive(): void {
    this.stopKeepAlive();
    this.keepAliveTimer = setInterval(() => {
      if (
        !this.isHtmlAudio &&
        typeof window !== 'undefined' &&
        'speechSynthesis' in window &&
        this.playing &&
        !this.isPaused
      ) {
        try {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        } catch (e) {
          // Ignorar
        }
      }
    }, 14000);
  }

  /**
   * Limpia el temporizador de Keep-Alive
   */
  private stopKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  /**
   * Pausa la narración (HTML5 Audio o SpeechSynthesis)
   */
  public pause(): void {
    if (this.playing && !this.isPaused) {
      if (this.isHtmlAudio && this.htmlAudio) {
        try {
          this.htmlAudio.pause();
        } catch (err) {
          console.warn('Error en htmlAudio.pause:', err);
        }
      } else if (this.synth) {
        this.stopKeepAlive();
        try {
          this.synth.pause();
        } catch (err) {
          console.warn('Error en synth.pause:', err);
        }
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
    if (this.playing && this.isPaused) {
      if (this.isHtmlAudio && this.htmlAudio) {
        try {
          this.htmlAudio.play();
        } catch (err) {
          console.warn('Error en htmlAudio.resume:', err);
        }
      } else if (this.synth) {
        try {
          this.synth.resume();
        } catch (err) {
          console.warn('Error en synth.resume:', err);
        }
        this.startKeepAlive();
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
        audioUrl: this.currentAudioUrl || undefined,
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
    // Si estamos en HTML5 Audio:
    if (this.isHtmlAudio && this.htmlAudio) {
      const duration = this.estimatedDuration || this.htmlAudio.duration || 60;
      const targetTime = Math.max(0, Math.min(duration, this.htmlAudio.currentTime + seconds));
      this.htmlAudio.currentTime = targetTime;
      this.currentTime = targetTime;
      this.notify();
      return;
    }

    // Si estamos en SpeechSynthesis:
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
        if (typeof window !== 'undefined') {
          (window as any).__ttsKeepAliveUtterance = utterance;
        }

        utterance.lang = 'es-MX';
        utterance.pitch = 1.0;
        utterance.rate = 0.95 * this.playbackRate;
        const voice = this.getPreferredVoice();
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang || 'es-MX';
        }

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

        utterance.onerror = (event) => {
          if (event.error !== 'canceled' && event.error !== 'interrupted') {
            console.warn('Error en SpeechSynthesis tras saltar:', event.error);
          }
          this.cleanup();
        };

        this.startKeepAlive();

        try {
          this.synth.speak(utterance);
        } catch (e) {
          console.warn('Error al saltar audio:', e);
          this.cleanup();
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
    if (this.isHtmlAudio && this.htmlAudio) {
      this.htmlAudio.playbackRate = rate;
      this.notify();
      return;
    }

    if (this.playing && this.currentScript) {
      this.estimatedDuration = this.calculateDuration(this.currentScript, this.playbackRate);
      this.skip(0); // Reiniciar en posición actual con nuevo rate
    } else {
      this.notify();
    }
  }

  private cleanupHtmlAudio() {
    if (this.htmlAudio) {
      try {
        this.htmlAudio.pause();
        this.htmlAudio.onloadedmetadata = null;
        this.htmlAudio.ontimeupdate = null;
        this.htmlAudio.onended = null;
        this.htmlAudio.onerror = null;
        this.htmlAudio.src = '';
      } catch {
        // Ignorar
      }
      this.htmlAudio = null;
    }
    this.isHtmlAudio = false;
  }

  /**
   * Detiene inmediatamente la narración y libera recursos
   */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.stopKeepAlive();

    this.cleanupHtmlAudio();

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
    this.stopKeepAlive();
    this.cleanupHtmlAudio();
    this.playing = false;
    this.isPaused = false;
    this.currentUtterance = null;
    if (typeof window !== 'undefined') {
      try {
        delete (window as any).__ttsKeepAliveUtterance;
      } catch {
        // Ignorar
      }
    }
    this.releaseWakeLock();
    this.clearMediaSession();
    this.notify();
  }

  public isPlaying(): boolean {
    if (this.isHtmlAudio && this.htmlAudio) {
      return !this.htmlAudio.paused && !this.isPaused;
    }
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
