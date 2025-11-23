import { useEffect, useRef } from "react";

type BreathingPhase = "inhale" | "hold" | "exhale" | "hold-empty";

interface VoiceGuidanceProps {
  phase: BreathingPhase;
  cycleCount: number;
  isActive: boolean;
  isMuted: boolean;
  countdown: number;
}

export const VoiceGuidance = ({ 
  phase, 
  cycleCount, 
  isActive, 
  isMuted,
  countdown 
}: VoiceGuidanceProps) => {
  const lastSpokenRef = useRef<string>("");
  
  const speak = (text: string) => {
    if (isMuted || !isActive) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 0.9;
    utterance.volume = 1;
    
    // Try to select a female voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('female') || 
      voice.name.toLowerCase().includes('samantha') ||
      voice.name.toLowerCase().includes('zira')
    );
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!isActive || isMuted) return;

    // Announce phase at the start of each phase
    if (countdown === 4) {
      const phaseText = phase === "inhale" ? "Breathe in" :
                       phase === "exhale" ? "Breathe out" :
                       "Hold";
      
      const currentKey = `${phase}-${cycleCount}-start`;
      if (lastSpokenRef.current !== currentKey) {
        lastSpokenRef.current = currentKey;
        speak(phaseText);
      }
    }
    
    // Count during first 3 cycles
    if (cycleCount <= 3 && countdown > 0 && countdown <= 4) {
      const countKey = `${phase}-${cycleCount}-${countdown}`;
      if (lastSpokenRef.current !== countKey) {
        lastSpokenRef.current = countKey;
        setTimeout(() => speak(countdown.toString()), 500);
      }
    }
  }, [phase, cycleCount, isActive, isMuted, countdown]);

  // Reset speech when stopped
  useEffect(() => {
    if (!isActive) {
      window.speechSynthesis.cancel();
      lastSpokenRef.current = "";
    }
  }, [isActive]);

  return null;
};
