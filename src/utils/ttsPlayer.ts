/**
 * Singleton Hybrid Audio & TTS Player para audioguías del Museo Nacional de Antropología.
 * - Soporta reproducción prioritaria de archivos de audio HTML5 (<audio src="...mp3">).
 * - Fallback transparente a SpeechSynthesis con búsqueda de voces en español (es-MX -> es-US -> es-ES).
 * - Notificación clara si el dispositivo no cuenta con voces en español instaladas.
 * - División del guion en frases (~200 caracteres) para evitar silenciamiento en Android/iOS.
 * - MediaSession API con iconos reales de la PWA (/audioguias-mexico/pwa-192x192.png).
 * - Sin uso de pause/resume en móviles (solo en escritorio).
 */

import { getAssetUrl } from './urlHelper';
import { getCurrentLanguage } from '../i18n/runtime';
import { getStrings } from '../i18n';
import { SupportedLanguage, SPEECH_LOCALE } from '../i18n/languages';

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
  errorMessage?: string | null;
}

type StateChangeListener = (playing: boolean, state: TTSState) => void;

class TTSPlayer {
  private static instance: TTSPlayer;
  private synth: SpeechSynthesis | null = null;
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
  private textChunks: string[] = [];
  private currentChunkIndex = 0;
  private isSpeakingChunks = false;
  private errorMessage: string | null = null;
  private currentLang: SupportedLanguage = 'es';

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
      try {
        window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
      } catch {
        // Ignorar
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

  /**
   * Obtiene la voz preferida para el idioma del TEXTO que se va a leer (no el idioma del teléfono).
   * Español: es-MX -> es-US -> es-ES -> cualquier es-*. Inglés: en-US -> en-GB -> cualquier en-*.
   * Otros idiomas: la región exacta y luego cualquier voz del idioma.
   * Si las voces están vacías en la primera llamada, espera hasta 2 segundos al evento voiceschanged.
   */
  public async getPreferredVoiceAsync(lang: SupportedLanguage = 'es'): Promise<SpeechSynthesisVoice | null> {
    if (!this.synth) return null;

    let voices = this.synth.getVoices();
    if (!voices || voices.length === 0) {
      voices = this.cachedVoices;
    }

    if (!voices || voices.length === 0) {
      // Esperar hasta 2000ms a que el navegador termine de cargar las voces del sistema
      await new Promise<void>((resolve) => {
        let isDone = false;
        const handleVoices = () => {
          if (!isDone) {
            isDone = true;
            this.synth?.removeEventListener('voiceschanged', handleVoices);
            resolve();
          }
        };

        this.synth?.addEventListener('voiceschanged', handleVoices);
        setTimeout(() => {
          if (!isDone) {
            isDone = true;
            this.synth?.removeEventListener('voiceschanged', handleVoices);
            resolve();
          }
        }, 2000);
      });

      voices = this.synth.getVoices();
      if (voices && voices.length > 0) {
        this.cachedVoices = voices;
      }
    }

    if (!voices || voices.length === 0) return null;

    if (lang !== 'es') return this.pickVoiceFor(voices, lang);

    // 1. Preferir estrictamente español de México (es-MX / es_MX)
    const esMx = voices.find((v) => /^es[-_]MX$/i.test(v.lang) || v.lang.toLowerCase().includes('es-mx'));
    if (esMx) return esMx;

    // 2. Voces en español de EE. UU. / Latinoamérica (es-US, es-419)
    const esUs = voices.find(
      (v) => /^es[-_](US|419)$/i.test(v.lang) || v.lang.toLowerCase().includes('es-us')
    );
    if (esUs) return esUs;

    // 3. Voces en español de España (es-ES)
    const esEs = voices.find((v) => /^es[-_]ES$/i.test(v.lang) || v.lang.toLowerCase().includes('es-es'));
    if (esEs) return esEs;

    // 4. Cualquier voz disponible con prefijo "es"
    const anyEs = voices.find((v) => v.lang.toLowerCase().startsWith('es'));
    if (anyEs) return anyEs;

    // Si no hay ninguna voz en español, retornar null
    return null;
  }

  private pickVoiceFor(voices: SpeechSynthesisVoice[], lang: SupportedLanguage): SpeechSynthesisVoice | null {
    const locale = SPEECH_LOCALE[lang].toLowerCase();
    const same = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().replace('_', '-') === locale;
    const prefix = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().startsWith(lang);
    if (lang === 'en') {
      const order = ['en-us', 'en-gb', 'en-au', 'en-ca'];
      for (const code of order) {
        const hit = voices.find((v) => v.lang.toLowerCase().replace('_', '-') === code);
        if (hit) return hit;
      }
    }
    return voices.find(same) || voices.find(prefix) || null;
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
        console.warn('No se pudo activar Screen Wake Lock:', err);
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
              {
                src: getAssetUrl('pwa-192x192.png'),
                sizes: '192x192',
                type: 'image/png',
              },
              {
                src: getAssetUrl('pwa-512x512.png'),
                sizes: '512x512',
                type: 'image/png',
              },
            ];

        navigator.mediaSession.metadata = new MediaMetadata({
          title: title || getStrings(getCurrentLanguage()).player.mediaTitleFallback,
          artist: getStrings(getCurrentLanguage()).common.museumName,
          album: this.currentRoomName || getStrings(getCurrentLanguage()).common.editorialBadge,
          artwork,
        });

        navigator.mediaSession.setActionHandler('play', () => this.resume());
        navigator.mediaSession.setActionHandler('pause', () => this.pause());
        navigator.mediaSession.setActionHandler('stop', () => this.stop());
        navigator.mediaSession.setActionHandler('seekbackward', () => this.skip(-15));
        navigator.mediaSession.setActionHandler('seekforward', () => this.skip(15));

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
    const progress =
      this.estimatedDuration > 0
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
      errorMessage: this.errorMessage,
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((fn) => {
      try {
        fn(state.isPlaying, state);
      } catch {
        // Ignorar
      }
    });
  }

  /**
   * Calcula la duración estimada en segundos a partir de las palabras (~2.25 palabras/segundo).
   */
  public calculateDuration(text: string, rate: number = 1.0): number {
    const cleanText = text.replace(/[#*_~`]/g, '').trim();
    const words = cleanText.split(/\s+/).filter(Boolean);
    const effectiveRate = Math.max(0.5, rate || 1.0);
    const baseSeconds = Math.max(10, Math.round(words.length / (2.25 * effectiveRate)));
    return baseSeconds;
  }

  /**
   * Divide un texto en fragmentos de ~200 caracteres por signos de puntuación
   * para evitar corte de síntesis en iOS/Android.
   */
  private splitTextIntoChunks(text: string, maxLen: number = 200): string[] {
    const clean = text
      .replace(/[#*_~`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) return [];

    const sentenceRegex = /([^.?!;:\n]+[.?!;:\n]+)/g;
    const rawSentences = clean.match(sentenceRegex) || [clean];
    const chunks: string[] = [];
    let current = '';

    for (const raw of rawSentences) {
      const sentence = raw.trim();
      if (!sentence) continue;

      if ((current + ' ' + sentence).trim().length <= maxLen) {
        current = (current ? current + ' ' : '') + sentence;
      } else {
        if (current) chunks.push(current.trim());
        // Si una sola frase excede maxLen, dividir por comas o palabras
        if (sentence.length > maxLen) {
          const words = sentence.split(' ');
          let sub = '';
          for (const w of words) {
            if ((sub + ' ' + w).trim().length <= maxLen) {
              sub = (sub ? sub + ' ' : '') + w;
            } else {
              if (sub) chunks.push(sub.trim());
              sub = w;
            }
          }
          if (sub) chunks.push(sub.trim());
          current = '';
        } else {
          current = sentence;
        }
      }
    }
    if (current) chunks.push(current.trim());
    return chunks.length > 0 ? chunks : [clean];
  }

  /**
   * Reproduce una pieza priorizando archivo MP3 en HTML5 Audio si está disponible,
   * con fallback a síntesis Web Speech dividida en frases con voz en español.
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
      /** Idioma del texto que se lee (decide la voz del teléfono). Por defecto español. */
      lang?: SupportedLanguage;
    }
  ): void {
    this.stop();
    this.errorMessage = null;

    const rawAudioUrl = (meta?.audioUrl || '').trim();
    const hasValidAudioUrl =
      rawAudioUrl.length > 4 &&
      (/\.(mp3|m4a|aac|wav|ogg)(\?.*)?$/i.test(rawAudioUrl) ||
        rawAudioUrl.startsWith('http://') ||
        rawAudioUrl.startsWith('https://') ||
        rawAudioUrl.startsWith('data:audio'));

    // 1. PRIORIDAD: Archivo de audio MP3
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
        const audio = new Audio();
        // Los audios de pago vienen de otro dominio (el servidor de audio): se piden con CORS para que el modo sin conexión pueda guardarlos
        if (/^https?:\/\//i.test(rawAudioUrl) && typeof location !== 'undefined' && !rawAudioUrl.startsWith(location.origin)) {
          audio.crossOrigin = 'anonymous';
        }
        audio.src = rawAudioUrl;
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

        audio.onerror = () => {
          console.warn('HTML5 Audio falló al cargar MP3, activando síntesis de voz en español');
          this.cleanupHtmlAudio();
          this.playSpeechSynthesis(text, title, onEnd, meta);
        };

        this.playing = true;
        this.requestWakeLock();
        this.setupMediaSession(title, meta?.artworkUrl);
        this.notify();

        audio.play().catch(() => {
          this.cleanupHtmlAudio();
          this.playSpeechSynthesis(text, title, onEnd, meta);
        });
        return;
      } catch {
        this.cleanupHtmlAudio();
      }
    }

    // 2. FALLBACK A SÍNTESIS DE VOZ
    this.playSpeechSynthesis(text, title, onEnd, meta);
  }

  /**
   * Reproducción mediante SpeechSynthesis con división por frases y voz en español obligatoria
   */
  private async playSpeechSynthesis(
    text: string,
    title: string,
    onEnd?: () => void,
    meta?: {
      roomName?: string;
      artworkUrl?: string;
      pieceId?: string;
      mode?: 'expres' | 'inmersion';
      lang?: SupportedLanguage;
    }
  ): Promise<void> {
    const speechLang: SupportedLanguage = meta?.lang || 'es';
    const errs = getStrings(getCurrentLanguage()).errors;
    if (!this.synth) {
      this.errorMessage = errs.noSpeech;
      this.notify();
      onEnd?.();
      return;
    }

    if (!text || !text.trim()) {
      onEnd?.();
      return;
    }

    // Buscar la voz del idioma del texto (obligatoria: no se lee un texto con la voz de otro idioma)
    const voice = await this.getPreferredVoiceAsync(speechLang);
    if (!voice) {
      this.errorMessage = errs.noVoice(getStrings(getCurrentLanguage()).common.languageNames[speechLang]);
      this.notify();
      onEnd?.();
      return;
    }

    this.isHtmlAudio = false;
    this.currentAudioUrl = '';
    this.currentLang = speechLang;
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

    // Dividir texto en frases de ~200 caracteres para evitar corte a los 15s en iOS/Android
    this.textChunks = this.splitTextIntoChunks(text, 200);
    this.currentChunkIndex = 0;
    this.isSpeakingChunks = true;

    // Detectar si es móvil: en móvil NO usar truco de pause/resume cada 14s
    const isMobile =
      typeof navigator !== 'undefined' &&
      /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (!isMobile) {
      this.startDesktopKeepAlive();
    }

    // Timer de avance de tiempo
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.playing && !this.isPaused && !this.isHtmlAudio) {
        this.currentTime = Math.min(this.estimatedDuration, this.currentTime + 0.25);
        this.notify();
      }
    }, 250);

    this.playing = true;
    this.requestWakeLock();
    this.setupMediaSession(title, meta?.artworkUrl);
    this.notify();

    // Comenzar a hablar frases consecutivas
    this.speakCurrentChunk(voice);
  }

  private speakCurrentChunk(voice: SpeechSynthesisVoice) {
    if (!this.synth || !this.isSpeakingChunks || this.currentChunkIndex >= this.textChunks.length) {
      this.cleanup();
      const cb = this.onEndCallback;
      this.onEndCallback = null;
      cb?.();
      return;
    }

    const chunkText = this.textChunks[this.currentChunkIndex];
    const utterance = new SpeechSynthesisUtterance(chunkText);
    utterance.voice = voice;
    utterance.lang = voice.lang || SPEECH_LOCALE[this.currentLang];
    utterance.pitch = 1.0;
    utterance.rate = 0.95 * this.playbackRate;

    utterance.onend = () => {
      if (this.isSpeakingChunks && this.playing) {
        this.currentChunkIndex++;
        this.speakCurrentChunk(voice);
      }
    };

    utterance.onerror = (event) => {
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        console.warn('Error en SpeechSynthesis:', event.error);
        this.errorMessage = getStrings(getCurrentLanguage()).errors.speechFailed;
      }
      this.cleanup();
    };

    try {
      this.synth.speak(utterance);
    } catch (err) {
      console.error('Error al invocar synth.speak:', err);
      this.cleanup();
    }
  }

  /**
   * Keep-Alive únicamente para navegadores de escritorio que silencian SpeechSynthesis tras 15 segundos
   */
  private startDesktopKeepAlive(): void {
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
        } catch {
          // Ignorar
        }
      }
    }, 14000);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

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
      this.notify();
    }
  }

  public resume(): void {
    if (this.playing && this.isPaused) {
      if (this.isHtmlAudio && this.htmlAudio) {
        try {
          this.htmlAudio.play().catch(() => {});
        } catch (err) {
          console.warn('Error en htmlAudio.resume:', err);
        }
      } else if (this.synth) {
        try {
          this.synth.resume();
        } catch (err) {
          console.warn('Error en synth.resume:', err);
        }
        const isMobile =
          typeof navigator !== 'undefined' &&
          /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (!isMobile) {
          this.startDesktopKeepAlive();
        }
      }
      this.isPaused = false;
      this.notify();
    }
  }

  public stop(): void {
    this.cleanup();
    this.clearMediaSession();
    this.notify();
  }

  private cleanup(): void {
    this.playing = false;
    this.isPaused = false;
    this.isSpeakingChunks = false;
    this.textChunks = [];
    this.currentChunkIndex = 0;

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
    this.releaseWakeLock();
  }

  private cleanupHtmlAudio(): void {
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
    this.currentAudioUrl = '';
  }

  public skip(seconds: number): void {
    if (!this.playing) return;
    if (this.isHtmlAudio && this.htmlAudio) {
      const newTime = Math.max(0, Math.min(this.estimatedDuration, this.htmlAudio.currentTime + seconds));
      this.htmlAudio.currentTime = newTime;
      this.currentTime = newTime;
      this.notify();
    } else {
      const newTime = Math.max(0, Math.min(this.estimatedDuration, this.currentTime + seconds));
      this.currentTime = newTime;
      this.notify();
    }
  }

  public setPlaybackRate(rate: number): void {
    this.playbackRate = Math.max(0.5, Math.min(2.0, rate));
    if (this.isHtmlAudio && this.htmlAudio) {
      this.htmlAudio.playbackRate = this.playbackRate;
    }
    this.notify();
  }

  public setRate(rate: number): void {
    this.setPlaybackRate(rate);
  }

  public clearErrorMessage(): void {
    this.errorMessage = null;
    this.notify();
  }

  public subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    listener(this.playing && !this.isPaused, this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const ttsPlayer = TTSPlayer.getInstance();
export default ttsPlayer;
