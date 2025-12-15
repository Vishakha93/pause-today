import { useRef, useCallback } from 'react';

// File mapping
const FILE_MAP: Record<string, string> = {
  welcomeMessage: 'WelcomeMessage.mp3',
  boxBreathingExplanation: 'BoxBreathingExplanation.mp3',
  breatheIn: 'BreatheIn.mp3',
  hold: 'Hold.mp3',
  holdYourBreath: 'HoldYourBreath.mp3',
  breatheOut: 'BreatheOut.mp3',
  one: 'One.mp3',
  two: 'Two.mp3',
  three: 'Three.mp3',
  four: 'Four.mp3',
};

export const useAudioManager = () => {
  const timersRef = useRef<number[]>([]);
  const activeAudiosRef = useRef<HTMLAudioElement[]>([]);

  // Simple fire-and-forget audio (for breathing instructions/counts)
  const playSound = useCallback((audioKey: string): void => {
    const filename = FILE_MAP[audioKey];
    if (!filename) {
      console.log('Unknown audio key:', audioKey);
      return;
    }
    
    console.log('Playing:', audioKey);
    
    try {
      const audio = new Audio(`/audio/${filename}`);
      audio.volume = 1.0;
      activeAudiosRef.current.push(audio);
      
      audio.onended = () => {
        const idx = activeAudiosRef.current.indexOf(audio);
        if (idx > -1) activeAudiosRef.current.splice(idx, 1);
      };
      
      audio.play().catch(() => {});
    } catch (e) {
      console.log('Audio error:', audioKey);
    }
  }, []);

  // Play and wait for completion (for welcome/explanation)
  const playAndWait = useCallback((audioKey: string, callback: () => void): void => {
    const filename = FILE_MAP[audioKey];
    if (!filename) {
      console.log('Unknown audio key:', audioKey);
      callback();
      return;
    }
    
    console.log('Playing (wait):', audioKey);
    
    try {
      const audio = new Audio(`/audio/${filename}`);
      audio.volume = 1.0;
      activeAudiosRef.current.push(audio);
      
      audio.onended = () => {
        console.log('Finished:', audioKey);
        const idx = activeAudiosRef.current.indexOf(audio);
        if (idx > -1) activeAudiosRef.current.splice(idx, 1);
        callback();
      };
      
      audio.onerror = () => {
        console.log('Error:', audioKey);
        callback();
      };
      
      audio.play().catch(() => {
        console.log('Play failed:', audioKey);
        callback();
      });
      
      // Safety timeout (60 seconds max)
      setTimeout(() => {
        console.log('Timeout safety:', audioKey);
      }, 60000);
      
    } catch (e) {
      console.log('Exception:', audioKey);
      callback();
    }
  }, []);

  // Initialize audio context (for mobile)
  const initAudioContext = useCallback((): void => {
    console.log('Initializing audio context');
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') {
          ctx.resume().then(() => console.log('Audio context resumed'));
        }
      }
    } catch (e) {
      console.log('Audio context error:', e);
    }
  }, []);

  // Schedule a timer
  const scheduleTimer = useCallback((callback: () => void, delay: number): void => {
    const id = window.setTimeout(callback, delay);
    timersRef.current.push(id);
  }, []);

  // Clear all timers
  const clearAllTimers = useCallback((): void => {
    console.log('Clearing all timers');
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];
  }, []);

  // Stop all audio and timers
  const stopAllAudio = useCallback((): void => {
    console.log('Stopping all audio');
    
    // Clear timers
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];
    
    // Stop all active audio
    activeAudiosRef.current.forEach(audio => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (e) {
        // Ignore
      }
    });
    activeAudiosRef.current = [];
  }, []);

  return {
    isLoading: false,
    loadError: null,
    playSound,
    playAndWait,
    stopAllAudio,
    initAudioContext,
    scheduleTimer,
    clearAllTimers,
  };
};
