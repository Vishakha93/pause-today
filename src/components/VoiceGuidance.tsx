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
    utterance.rate = 0.7; // Slower, more calming
    utterance.pitch = 0.85; // Slightly lower, warmer
    utterance.volume = 0.9; // Slightly softer
    
    // Try to select the best quality female voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      // Prefer high-quality voices with natural-sounding names
      voice.name.toLowerCase().includes('google') && voice.name.toLowerCase().includes('female') ||
      voice.name.toLowerCase().includes('samantha') ||
      voice.name.toLowerCase().includes('karen') ||
      voice.name.toLowerCase().includes('victoria') ||
      voice.name.toLowerCase().includes('zira') ||
      voice.name.toLowerCase().includes('microsoft') && voice.name.toLowerCase().includes('female')
    ) || voices.find(voice => 
      voice.name.toLowerCase().includes('female')
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
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
    
    // Count UP during first 3 cycles (1, 2, 3, 4)
    if (cycleCount <= 3 && countdown > 0 && countdown <= 4) {
      const countUpValue = 5 - countdown; // Convert countdown to count up: 4->1, 3->2, 2->3, 1->4
      const countKey = `${phase}-${cycleCount}-${countUpValue}`;
      if (lastSpokenRef.current !== countKey) {
        lastSpokenRef.current = countKey;
        setTimeout(() => speak(countUpValue.toString()), 500);
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
