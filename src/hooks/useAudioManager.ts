import { useState, useEffect, useRef, useCallback } from 'react';

export interface AudioFiles {
  welcomeMessage: HTMLAudioElement;
  boxBreathingIntro: HTMLAudioElement;
  breatheIn: HTMLAudioElement;
  hold: HTMLAudioElement;
  holdYourBreath: HTMLAudioElement;
  breatheOut: HTMLAudioElement;
  one: HTMLAudioElement;
  two: HTMLAudioElement;
  three: HTMLAudioElement;
  four: HTMLAudioElement;
}

export const useAudioManager = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const audioFilesRef = useRef<AudioFiles | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  useEffect(() => {
    const audioFiles: Partial<AudioFiles> = {};
    const audioSources = {
      welcomeMessage: '/audio/WelcomeMessage.mp3',
      boxBreathingIntro: '/audio/BoxBreathingIntro.mp3',
      breatheIn: '/audio/BreatheIn.mp3',
      hold: '/audio/Hold.mp3',
      holdYourBreath: '/audio/HoldYourBreath.mp3',
      breatheOut: '/audio/BreatheOut.mp3',
      one: '/audio/One.mp3',
      two: '/audio/Two.mp3',
      three: '/audio/Three.mp3',
      four: '/audio/Four.mp3',
    };

    let loadedCount = 0;
    const totalFiles = Object.keys(audioSources).length;

    Object.entries(audioSources).forEach(([key, src]) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      
      audio.addEventListener('canplaythrough', () => {
        loadedCount++;
        if (loadedCount === totalFiles) {
          audioFilesRef.current = audioFiles as AudioFiles;
          setIsLoading(false);
        }
      });

      audio.addEventListener('error', () => {
        setLoadError(`Failed to load ${key} audio file`);
        setIsLoading(false);
      });

      audioFiles[key as keyof AudioFiles] = audio;
      audio.load();
    });

    return () => {
      Object.values(audioFiles).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
    };
  }, []);

  const playAudio = useCallback((audioKey: keyof AudioFiles) => {
    initAudioContext();
    const audio = audioFilesRef.current?.[audioKey];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(err => console.error('Audio play error:', err));
    }
  }, [initAudioContext]);

  const stopAllAudio = useCallback(() => {
    if (audioFilesRef.current) {
      Object.values(audioFilesRef.current).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
    }
  }, []);

  return {
    isLoading,
    loadError,
    playAudio,
    stopAllAudio,
    initAudioContext,
  };
};
