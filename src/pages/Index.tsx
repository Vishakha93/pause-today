import { useState, useEffect } from "react";
import { BreathingCircle } from "@/components/BreathingCircle";
import { VoiceGuidance } from "@/components/VoiceGuidance";
import { CompletionDialog } from "@/components/CompletionDialog";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Play, Square } from "lucide-react";

type BreathingPhase = "inhale" | "hold" | "exhale" | "hold-empty";

const Index = () => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<BreathingPhase>("inhale");
  const [cycleCount, setCycleCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const [showCompletion, setShowCompletion] = useState(false);

  useEffect(() => {
    if (!isActive) {
      setPhase("inhale");
      setCountdown(4);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev > 1) {
          return prev - 1;
        }
        
        // Move to next phase
        setPhase((currentPhase) => {
          let nextPhase: BreathingPhase;
          let shouldIncrementCycle = false;

          switch (currentPhase) {
            case "inhale":
              nextPhase = "hold";
              break;
            case "hold":
              nextPhase = "exhale";
              break;
            case "exhale":
              nextPhase = "hold-empty";
              break;
            case "hold-empty":
              nextPhase = "inhale";
              shouldIncrementCycle = true;
              break;
            default:
              nextPhase = "inhale";
          }

          if (shouldIncrementCycle) {
            setCycleCount((c) => c + 1);
          }

          return nextPhase;
        });

        return 4; // Reset countdown
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const handleStartStop = () => {
    if (isActive) {
      // Show completion dialog if user completed at least one cycle
      if (cycleCount > 0) {
        setShowCompletion(true);
      }
      setIsActive(false);
      window.speechSynthesis.cancel();
    } else {
      setIsActive(true);
      setPhase("inhale");
      setCountdown(4);
      setCycleCount(1);
    }
  };

  const handleCompletionClose = () => {
    setShowCompletion(false);
    setCycleCount(0);
    setPhase("inhale");
    setCountdown(4);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient background circles */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="relative z-10 w-full max-w-md space-y-12">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-light tracking-wider text-foreground">
            Box Breathing
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Find your calm, one breath at a time
          </p>
        </div>

        {/* Breathing Circle */}
        <BreathingCircle phase={phase} isActive={isActive} onToggle={handleStartStop} />

        {/* Voice Guidance */}
        <VoiceGuidance 
          phase={phase} 
          cycleCount={cycleCount} 
          isActive={isActive}
          isMuted={isMuted}
          countdown={countdown}
        />

        {/* Controls */}
        <div className="flex flex-col items-center gap-6">
          {/* Cycle Counter */}
          {cycleCount > 0 && (
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Cycle</p>
              <p className="text-3xl font-light text-foreground">{cycleCount}</p>
            </div>
          )}

          {/* Start/Stop Button */}
          <Button
            onClick={handleStartStop}
            size="lg"
            className="w-40 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-lg shadow-lg hover:shadow-xl transition-all"
          >
            {isActive ? (
              <>
                <Square className="mr-2 h-5 w-5" />
                Stop
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                Start
              </>
            )}
          </Button>
        </div>

        {/* Mute Toggle */}
        <button
          onClick={toggleMute}
          className="absolute top-6 right-6 p-3 rounded-full bg-card/50 backdrop-blur-sm hover:bg-card/70 transition-colors"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Volume2 className="h-5 w-5 text-foreground" />
          )}
        </button>

        {/* Completion Dialog */}
        <CompletionDialog 
          open={showCompletion}
          onClose={handleCompletionClose}
          cycleCount={cycleCount}
        />
      </div>
    </div>
  );
};

export default Index;
