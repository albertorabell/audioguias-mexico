import { useEffect, useRef, useState, useCallback } from 'react';

export interface AudioGuideState {
  isPlaying: boolean;
  playbackRate: number;
  progress: number; // 0 to 1
  currentTime: number; // in seconds
  duration: number; // estimated or real seconds
  isSupported: boolean;
  voiceName: string;
}

/**
 * Filter available voices for the target language, prioritizing high quality neural/natural voices
 * and explicitly excluding obsolete synthesizers like eSpeak.
 */
export function selectBestVoice(
  voices: SpeechSynthesisVoice[],
  langCode: string = 'es-MX'
): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  // 1. Exclude obsolete synthesizers like eSpeak
  const validVoices = voices.filter((v) => {
    const name = (v.name || '').toLowerCase();
    return !name.includes('espeak');
  });

  const target = langCode.toLowerCase().replace('_', '-');
  const primaryLang = target.split('-')[0]; // e.g. 'es'

  // Quality descriptors to prioritize natural, human-like guide voices
  const qualityKeywords = ['natural', 'enhanced', 'google', 'premium', 'neural'];

  const matchesQuality = (v: SpeechSynthesisVoice) => {
    const name = (v.name || '').toLowerCase();
    return qualityKeywords.some((kw) => name.includes(kw));
  };

  // Exact language match (e.g. es-mx)
  const exactVoices = validVoices.filter(
    (v) => v.lang.toLowerCase().replace('_', '-') === target
  );
  const exactQuality = exactVoices.find(matchesQuality);
  if (exactQuality) return exactQuality;
  if (exactVoices.length > 0) return exactVoices[0];

  // Regional language match (e.g. es-419, es-us)
  const regionalVoices = validVoices.filter((v) => {
    const l = v.lang.toLowerCase().replace('_', '-');
    return l.startsWith(primaryLang) && (l.includes('419') || l.includes('us') || l.includes('la'));
  });
  const regionalQuality = regionalVoices.find(matchesQuality);
  if (regionalQuality) return regionalQuality;
  if (regionalVoices.length > 0) return regionalVoices[0];

  // Any voice of the primary language family (e.g. es-ES, es-CO, etc.)
  const primaryVoices = validVoices.filter((v) =>
    v.lang.toLowerCase().startsWith(primaryLang)
  );
  const primaryQuality = primaryVoices.find(matchesQuality);
  if (primaryQuality) return primaryQuality;
  if (primaryVoices.length > 0) return primaryVoices[0];

  return validVoices[0] || null;
}

export function useAudioGuide(
  text: string,
  audioFileUrl?: string,
  langCode: string = 'es-MX'
) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [progress, setProgress] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isSupported, setIsSupported] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  // Touristic cadence baseline acoustic parameters
  const BASE_RATE = 0.93; // Calm, intelligible guide pacing
  const BASE_PITCH = 0.96; // Warmer, deeper timbre, avoiding metallic distortion

  // Estimate duration based on word count (~130 words per minute at 0.93x rate)
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 60;
  const estimatedSeconds = Math.max(20, Math.round((wordCount / (130 * BASE_RATE)) * 60));
  const effectiveDuration = Math.round(estimatedSeconds / playbackRate);

  // Asynchronously detect and load natural voices via onvoiceschanged
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;
      const best = selectBestVoice(voices, langCode);
      setSelectedVoice(best);
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [langCode]);

  // Stop playback when unmounting or changing piece
  const stop = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    pausedAtRef.current = 0;
  }, []);

  useEffect(() => {
    stop();
    return () => {
      stop();
    };
  }, [text, audioFileUrl, stop]);

  // Handle Playback Rate change
  const setRate = useCallback(
    (rate: number) => {
      setPlaybackRate(rate);
      if (audioRef.current) {
        audioRef.current.playbackRate = rate;
      }

      // If speaking via synthesis, restart speech at new scaled rate
      if (isPlaying && (!audioFileUrl || audioFileUrl.trim() === '')) {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const words = text.split(/\s+/);
          const currentWordIndex = Math.floor(progress * words.length);
          const remainingText = words.slice(currentWordIndex).join(' ');

          const utterance = new SpeechSynthesisUtterance(remainingText || text);
          utterance.rate = BASE_RATE * rate;
          utterance.pitch = BASE_PITCH;
          utterance.lang = selectedVoice?.lang || langCode;
          if (selectedVoice) utterance.voice = selectedVoice;

          utterance.onend = () => {
            stop();
          };
          utterance.onerror = () => {
            stop();
          };

          utteranceRef.current = utterance;
          window.speechSynthesis.speak(utterance);
        }
      }
    },
    [audioFileUrl, isPlaying, langCode, progress, selectedVoice, stop, text]
  );

  const pause = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }

    pausedAtRef.current = currentTime;
    setIsPlaying(false);
  }, [currentTime]);

  const play = useCallback(() => {
    if (!text && (!audioFileUrl || audioFileUrl.trim() === '')) return;

    // Case 1: Real audio file URL
    if (audioFileUrl && audioFileUrl.trim() !== '') {
      if (!audioRef.current) {
        const audio = new Audio(audioFileUrl);
        audioRef.current = audio;
      }
      const audio = audioRef.current;
      audio.playbackRate = playbackRate;

      audio.onended = () => {
        stop();
      };
      audio.ontimeupdate = () => {
        if (audio.duration) {
          setCurrentTime(audio.currentTime);
          setProgress(audio.currentTime / audio.duration);
        }
      };

      audio.play().catch(() => {
        setIsPlaying(false);
      });
      setIsPlaying(true);
      return;
    }

    // Case 2: Natural Speech Synthesis
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    // Resume if paused
    if (window.speechSynthesis.paused && utteranceRef.current) {
      window.speechSynthesis.resume();
      setIsPlaying(true);
      startTimeRef.current = Date.now() - pausedAtRef.current * 1000;

      progressTimerRef.current = window.setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        const boundedTime = Math.min(elapsed, effectiveDuration);
        setCurrentTime(boundedTime);
        setProgress(Math.min(1, boundedTime / effectiveDuration));
        if (boundedTime >= effectiveDuration) {
          stop();
        }
      }, 250);
      return;
    }

    // Start fresh speech synthesis with calm acoustic parameters
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = BASE_RATE * playbackRate;
    utterance.pitch = BASE_PITCH;
    utterance.lang = selectedVoice?.lang || langCode;
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.onend = () => {
      stop();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis ended or interrupted', e);
      stop();
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);

    startTimeRef.current = Date.now() - progress * effectiveDuration * 1000;

    progressTimerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const boundedTime = Math.min(elapsed, effectiveDuration);
      setCurrentTime(boundedTime);
      setProgress(Math.min(1, boundedTime / effectiveDuration));

      if (boundedTime >= effectiveDuration) {
        stop();
      }
    }, 250);
  }, [audioFileUrl, effectiveDuration, langCode, playbackRate, progress, selectedVoice, stop, text]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  // Clean, human-readable voice label
  const cleanVoiceName = selectedVoice
    ? selectedVoice.name
        .replace(/Microsoft /i, '')
        .replace(/Google /i, '')
        .replace(/Desktop/i, '')
        .trim()
    : 'Guía en Español';

  return {
    isPlaying,
    playbackRate,
    progress,
    currentTime,
    duration: effectiveDuration,
    isSupported,
    voiceName: cleanVoiceName,
    play,
    pause,
    stop,
    togglePlay,
    setRate,
  };
}
