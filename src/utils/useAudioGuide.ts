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

export function useAudioGuide(text: string, audioFileUrl?: string) {
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

  // Estimate duration based on word count (~140 words per minute at 1x)
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 60;
  const estimatedSeconds = Math.max(20, Math.round((wordCount / 140) * 60));
  const effectiveDuration = Math.round(estimatedSeconds / playbackRate);

  // Detect and select best Spanish voice
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return;

      // Priority: es-MX, then other Latin American es-419, then es-ES, then any es
      const esMx = voices.find(v => v.lang.toLowerCase().includes('es-mx'));
      const esLa = voices.find(v => v.lang.toLowerCase().includes('es-419') || v.lang.toLowerCase().includes('es-us'));
      const esEs = voices.find(v => v.lang.toLowerCase().startsWith('es'));
      const chosen = esMx || esLa || esEs || voices[0];
      setSelectedVoice(chosen);
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Stop playback when unmounting or when piece text changes
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
  const setRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
    // If speaking with synthesis, restart speech at new rate from current relative offset if playing
    if (isPlaying && (!audioFileUrl || audioFileUrl.trim() === '')) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        // Calculate remaining text or start fresh
        const words = text.split(/\s+/);
        const currentWordIndex = Math.floor(progress * words.length);
        const remainingText = words.slice(currentWordIndex).join(' ');

        const utterance = new SpeechSynthesisUtterance(remainingText || text);
        utterance.rate = rate;
        utterance.pitch = 1.0;
        utterance.lang = selectedVoice?.lang || 'es-MX';
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
  }, [audioFileUrl, isPlaying, progress, selectedVoice, stop, text]);

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

    // Case 1: Audio file URL provided and non-empty
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

    // Case 2: Speech Synthesis fallback
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
      return;
    }

    // If currently paused in speech synthesis, resume it
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

    // Start fresh speech synthesis
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = playbackRate;
    utterance.pitch = 1.0;
    utterance.lang = selectedVoice?.lang || 'es-MX';
    if (selectedVoice) utterance.voice = selectedVoice;

    utterance.onend = () => {
      stop();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error or cancelled', e);
      stop();
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);

    startTimeRef.current = Date.now() - (progress * effectiveDuration * 1000);

    progressTimerRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const boundedTime = Math.min(elapsed, effectiveDuration);
      setCurrentTime(boundedTime);
      setProgress(Math.min(1, boundedTime / effectiveDuration));

      if (boundedTime >= effectiveDuration) {
        stop();
      }
    }, 250);
  }, [audioFileUrl, effectiveDuration, playbackRate, progress, selectedVoice, stop, text]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  return {
    isPlaying,
    playbackRate,
    progress,
    currentTime,
    duration: effectiveDuration,
    isSupported,
    voiceName: selectedVoice ? `${selectedVoice.name} (${selectedVoice.lang})` : 'Español Nativo',
    play,
    pause,
    stop,
    togglePlay,
    setRate,
  };
}
