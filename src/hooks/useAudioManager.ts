import { useState, useEffect, useRef, useCallback } from 'react';

export interface AudioFiles {
  welcomeMessage: HTMLAudioElement;
  boxBreathingExplanation: HTMLAudioElement;
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
  const pendingResolversRef = useRef<Set<() => void>>(new Set());
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass();
    }
    if (audioContextRef.current.state === 'suspended') {
      return audioContextRef.current.resume();
    }
    return Promise.resolve();
  }, []);

  useEffect(() => {
    const audioFiles: Partial<AudioFiles> = {};
    const audioSources = {
      welcomeMessage: '/audio/WelcomeMessage.mp3',
      boxBreathingExplanation: '/audio/BoxBreathingExplanation.mp3',
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

  const playAudio = useCallback(async (audioKey: keyof AudioFiles) => {
    initAudioContext();
    const audio = audioFilesRef.current?.[audioKey];

    if (!audio) {
      console.warn(`Audio ${audioKey} not loaded`);
      return;
    }

    // Ensure no overlapping audio
    if (currentAudioRef.current && !currentAudioRef.current.paused) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }

    currentAudioRef.current = audio;
    audio.currentTime = 0;

    return new Promise<void>((resolve) => {
      let resolved = false;

      const done = () => {
        if (resolved) return;
        resolved = true;
        audio.removeEventListener('ended', done);
        audio.removeEventListener('error', handleError);
        pendingResolversRef.current.delete(done);
        console.log(`${audioKey} finished`);
        resolve();
      };

      const handleError = () => {
        console.error(`Audio play error for ${audioKey}`);
        done();
      };

      pendingResolversRef.current.add(done);
      audio.addEventListener('ended', done);
      audio.addEventListener('error', handleError);

      console.log(`Playing ${audioKey}`);
      audio.play().catch((err) => {
        console.error('Audio play error:', err);
        done();
      });
    });
  }, [initAudioContext]);

  const playAudioNonBlocking = useCallback((audioKey: keyof AudioFiles) => {
    initAudioContext();
    const audio = audioFilesRef.current?.[audioKey];

    if (!audio) {
      console.warn(`Audio ${audioKey} not loaded`);
      return Promise.resolve();
    }

    // Fire-and-forget but return promise for mobile compatibility
    audio.currentTime = 0;
    return audio
      .play()
      .then(() => {
        console.log(`Playing (non-blocking) ${audioKey}`);
      })
      .catch((err) => {
        console.error("Audio play error (non-blocking):", err);
      });
  }, [initAudioContext]);

  const stopAllAudio = useCallback(() => {
    if (audioFilesRef.current) {
      Object.values(audioFilesRef.current).forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }

    // Force-resolve any pending audio promises
    pendingResolversRef.current.forEach((resolve) => resolve());
    pendingResolversRef.current.clear();
  }, []);

  return {
    isLoading,
    loadError,
    playAudio,
    playAudioNonBlocking,
    stopAllAudio,
    initAudioContext,
  };
};
