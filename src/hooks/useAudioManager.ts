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

// Detect mobile devices
const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

export const useAudioManager = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAudioReady, setIsAudioReady] = useState(false);
  
  const audioFilesRef = useRef<AudioFiles | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const pendingResolversRef = useRef<Set<() => void>>(new Set());
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeCountAudiosRef = useRef<HTMLAudioElement[]>([]);
  const audioInitializedRef = useRef(false);

  // Initialize AudioContext (critical for mobile)
  const initAudioContext = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      try {
        // Create audio context if doesn't exist
        if (!audioContextRef.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioContextClass();
          console.log('Audio context created');
        }

        // Resume if suspended (required for mobile after user gesture)
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().then(() => {
            console.log('Audio context resumed:', audioContextRef.current?.state);
            audioInitializedRef.current = true;
            setIsAudioReady(true);
            resolve();
          }).catch((error) => {
            console.error('Failed to resume audio context:', error);
            resolve(); // Continue anyway
          });
        } else {
          console.log('Audio context ready:', audioContextRef.current.state);
          audioInitializedRef.current = true;
          setIsAudioReady(true);
          resolve();
        }
      } catch (error) {
        console.error('Audio context initialization error:', error);
        resolve(); // Continue anyway
      }
    });
  }, []);

  // Unlock audio on iOS with silent play
  const unlockIOSAudio = useCallback(async () => {
    if (!isIOS || audioInitializedRef.current) return;
    
    console.log('Attempting iOS audio unlock');
    
    // Try to play each audio file briefly to unlock
    if (audioFilesRef.current) {
      const testAudio = audioFilesRef.current.breatheIn;
      testAudio.volume = 0;
      testAudio.muted = true;
      
      try {
        await testAudio.play();
        testAudio.pause();
        testAudio.currentTime = 0;
        testAudio.volume = 1;
        testAudio.muted = false;
        console.log('iOS audio unlocked');
      } catch (e) {
        console.log('iOS unlock attempt (expected to fail without gesture):', e);
      }
    }
  }, []);

  // Unlock audio on Android
  const unlockAndroidAudio = useCallback(async () => {
    if (!isAndroid || audioInitializedRef.current) return;
    
    console.log('Attempting Android audio unlock');
    
    try {
      // Play silent audio data to unlock
      const silentAudio = new Audio();
      silentAudio.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAACAAABhADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dX/////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYT7D5qAAAAAAAAAAAAAAAAA//tQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAE=';
      await silentAudio.play();
      console.log('Android audio unlocked');
    } catch (e) {
      console.log('Android unlock attempt:', e);
    }
  }, []);

  // Preload all audio files
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

    console.log('Starting audio preload...');

    Object.entries(audioSources).forEach(([key, src]) => {
      const audio = new Audio(src);
      audio.preload = 'auto';
      
      // Set volume to max for mobile
      audio.volume = isMobile ? 1.0 : 0.9;
      
      // iOS requires playsinline
      if (isIOS) {
        audio.setAttribute('playsinline', 'true');
        audio.setAttribute('webkit-playsinline', 'true');
      }
      
      audio.addEventListener('canplaythrough', () => {
        loadedCount++;
        console.log(`Preloaded: ${key} (${loadedCount}/${totalFiles})`);
        if (loadedCount === totalFiles) {
          audioFilesRef.current = audioFiles as AudioFiles;
          setIsLoading(false);
          console.log('Audio preload complete');
        }
      }, { once: true });

      audio.addEventListener('error', (e) => {
        console.warn(`Failed to preload ${key}:`, e);
        loadedCount++;
        if (loadedCount === totalFiles) {
          audioFilesRef.current = audioFiles as AudioFiles;
          setIsLoading(false);
        }
      }, { once: true });

      audioFiles[key as keyof AudioFiles] = audio;
      audio.load();
      
      // Timeout fallback after 5 seconds
      setTimeout(() => {
        if (loadedCount < totalFiles) {
          loadedCount++;
          console.warn(`Preload timeout: ${key}`);
          if (loadedCount === totalFiles) {
            audioFilesRef.current = audioFiles as AudioFiles;
            setIsLoading(false);
          }
        }
      }, 5000);
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

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Page hidden (backgrounded)');
      } else {
        console.log('Page visible (foregrounded)');
        // Resume audio context if it was suspended
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().then(() => {
            console.log('Audio context resumed after foreground');
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Play audio (blocking - waits for completion)
  const playAudio = useCallback(async (audioKey: keyof AudioFiles): Promise<void> => {
    // Ensure audio context is initialized
    await initAudioContext();
    
    const audio = audioFilesRef.current?.[audioKey];

    if (!audio) {
      console.warn(`Audio ${audioKey} not loaded`);
      return;
    }

    // Stop previous instruction audio (not counts)
    if (currentAudioRef.current && !currentAudioRef.current.paused) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      } catch (e) {
        console.warn('Error stopping previous audio:', e);
      }
    }

    currentAudioRef.current = audio;
    audio.currentTime = 0;
    audio.volume = isMobile ? 1.0 : 0.9;

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

      const handleError = (e: Event) => {
        console.error(`Audio play error for ${audioKey}:`, e);
        done();
      };

      pendingResolversRef.current.add(done);
      audio.addEventListener('ended', done, { once: true });
      audio.addEventListener('error', handleError, { once: true });

      console.log(`Playing ${audioKey}`);
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.error('Audio play error:', err.name, err.message);
          done();
        });
      }
    });
  }, [initAudioContext]);

  // Play audio non-blocking (fire-and-forget, for counts)
  const playAudioNonBlocking = useCallback((audioKey: keyof AudioFiles, isCount: boolean = false): Promise<void> => {
    // Initialize audio context
    initAudioContext();
    
    const originalAudio = audioFilesRef.current?.[audioKey];

    if (!originalAudio) {
      console.warn(`Audio ${audioKey} not loaded`);
      return Promise.resolve();
    }

    // For counts, clone the audio to allow overlapping
    let audio: HTMLAudioElement;
    if (isCount) {
      audio = originalAudio.cloneNode() as HTMLAudioElement;
      activeCountAudiosRef.current.push(audio);
      
      // Clean up when finished
      audio.onended = () => {
        const index = activeCountAudiosRef.current.indexOf(audio);
        if (index > -1) {
          activeCountAudiosRef.current.splice(index, 1);
        }
      };
    } else {
      // Stop previous instruction audio
      if (currentAudioRef.current && !currentAudioRef.current.paused) {
        try {
          currentAudioRef.current.pause();
          currentAudioRef.current.currentTime = 0;
        } catch (e) {
          console.warn('Error stopping previous audio:', e);
        }
      }
      audio = originalAudio;
      currentAudioRef.current = audio;
    }

    audio.currentTime = 0;
    audio.volume = isMobile ? 1.0 : 0.9;

    console.log(`Playing (non-blocking) ${audioKey}`);
    
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      return playPromise
        .then(() => {
          // Success
        })
        .catch((err) => {
          console.warn(`Play failed for ${audioKey}:`, err.name, err.message);
        });
    }
    
    return Promise.resolve();
  }, [initAudioContext]);

  // Stop all audio
  const stopAllAudio = useCallback(() => {
    console.log('Stopping all audio');
    
    // Stop all loaded audio files
    if (audioFilesRef.current) {
      Object.values(audioFilesRef.current).forEach((audio) => {
        try {
          audio.pause();
          audio.currentTime = 0;
        } catch (e) {
          console.warn('Error stopping audio:', e);
        }
      });
    }

    // Stop current instruction audio
    if (currentAudioRef.current) {
      try {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
        currentAudioRef.current = null;
      } catch (e) {
        console.warn('Error stopping current audio:', e);
      }
    }

    // Stop all count audios
    activeCountAudiosRef.current.forEach(audio => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (e) {
        console.warn('Error stopping count audio:', e);
      }
    });
    activeCountAudiosRef.current = [];

    // Force-resolve any pending audio promises
    pendingResolversRef.current.forEach((resolve) => resolve());
    pendingResolversRef.current.clear();
  }, []);

  // Full audio preparation (call on user gesture)
  const prepareAudio = useCallback(async (): Promise<void> => {
    console.log('Preparing audio for playback...');
    
    // Initialize audio context
    await initAudioContext();
    
    // Platform-specific unlocks
    if (isIOS) {
      await unlockIOSAudio();
    } else if (isAndroid) {
      await unlockAndroidAudio();
    }
    
    // Small delay to ensure everything is ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('Audio preparation complete');
  }, [initAudioContext, unlockIOSAudio, unlockAndroidAudio]);

  return {
    isLoading,
    loadError,
    isAudioReady,
    playAudio,
    playAudioNonBlocking,
    stopAllAudio,
    initAudioContext,
    prepareAudio,
    isMobile,
  };
};
