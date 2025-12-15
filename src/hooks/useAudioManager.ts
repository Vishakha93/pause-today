import { useRef, useCallback } from 'react';

// Simple audio playback - no tracking, no complexity
function playAudioSimple(filename: string): void {
  try {
    const audio = new Audio(`/audio/${filename}`);
    audio.volume = 1.0;
    audio.play().catch(e => console.log('Audio:', filename, e.name));
  } catch (e) {
    console.log('Error:', filename);
  }
}

// For long audio that needs to finish (welcome/explanation)
function playLongAudioAndWait(filename: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      const audio = new Audio(`/audio/${filename}`);
      audio.volume = 1.0;
      
      audio.onended = () => {
        console.log('Finished:', filename);
        resolve();
      };
      
      audio.onerror = () => {
        console.log('Error:', filename);
        resolve(); // Continue even on error
      };
      
      audio.play().catch(() => {
        console.log('Play failed:', filename);
        resolve();
      });
      
      // Safety timeout (in case onended never fires)
      setTimeout(() => {
        console.log('Timeout:', filename);
        resolve();
      }, 60000); // 60 second max
      
    } catch (e) {
      console.log('Exception:', filename);
      resolve();
    }
  });
}

export const useAudioManager = () => {
  const phaseTimersRef = useRef<number[]>([]);
  const activeAudiosRef = useRef<HTMLAudioElement[]>([]);

  // Initialize audio context (critical for mobile)
  const initAudioContext = useCallback(async (): Promise<void> => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const ctx = new AudioContextClass();
        if (ctx.state === 'suspended') {
          await ctx.resume();
          console.log('Audio context resumed');
        }
      }
    } catch (e) {
      console.log('Audio context error:', e);
    }
  }, []);

  // Play audio non-blocking (fire-and-forget for breathing instructions)
  const playAudioNonBlocking = useCallback((audioKey: string): void => {
    const fileMap: Record<string, string> = {
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
    
    const filename = fileMap[audioKey];
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
        const index = activeAudiosRef.current.indexOf(audio);
        if (index > -1) activeAudiosRef.current.splice(index, 1);
      };
      
      audio.play().catch(e => console.log('Play error:', audioKey, e.name));
    } catch (e) {
      console.log('Audio error:', audioKey);
    }
  }, []);

  // Play audio blocking (waits for completion - for welcome/explanation)
  const playAudio = useCallback(async (audioKey: string): Promise<void> => {
    const fileMap: Record<string, string> = {
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
    
    const filename = fileMap[audioKey];
    if (!filename) {
      console.log('Unknown audio key:', audioKey);
      return;
    }
    
    console.log('Playing (blocking):', audioKey);
    await playLongAudioAndWait(filename);
  }, []);

  // Stop all audio
  const stopAllAudio = useCallback(() => {
    console.log('Stopping all audio');
    
    // Clear all phase timers
    phaseTimersRef.current.forEach(timer => clearTimeout(timer));
    phaseTimersRef.current = [];
    
    // Stop all active audio elements
    activeAudiosRef.current.forEach(audio => {
      try {
        audio.pause();
        audio.currentTime = 0;
      } catch (e) {
        // Ignore errors
      }
    });
    activeAudiosRef.current = [];
  }, []);

  // Schedule a timer (for phase transitions)
  const scheduleTimer = useCallback((callback: () => void, delay: number): void => {
    const id = window.setTimeout(callback, delay);
    phaseTimersRef.current.push(id);
  }, []);

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    phaseTimersRef.current.forEach(timer => clearTimeout(timer));
    phaseTimersRef.current = [];
  }, []);

  return {
    isLoading: false, // No preloading needed
    loadError: null,
    playAudio,
    playAudioNonBlocking,
    stopAllAudio,
    initAudioContext,
    scheduleTimer,
    clearAllTimers,
  };
};
