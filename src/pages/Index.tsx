import { useState, useEffect, useRef } from "react";
import { BreathingCircle } from "@/components/BreathingCircle";
import { CompletionDialog } from "@/components/CompletionDialog";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Play, Square, Loader2 } from "lucide-react";
import { useAudioManager } from "@/hooks/useAudioManager";

type BreathingPhase = "welcome" | "intro" | "inhale" | "hold-full" | "exhale" | "hold-empty";
type Stage = "idle" | "welcome" | "intro" | "breathing";

const Index = () => {
  const { isLoading, loadError, playAudio, stopAllAudio, initAudioContext } = useAudioManager();
  const [stage, setStage] = useState<Stage>("idle");
  const [phase, setPhase] = useState<BreathingPhase>("inhale");
  const [cycleCount, setCycleCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [currentCount, setCurrentCount] = useState<number>(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [hasPlayedWelcome, setHasPlayedWelcome] = useState(false);
  const [scale, setScale] = useState(0.5);
  
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const isActiveRef = useRef(false);

  const clearAllTimers = () => {
    timersRef.current.forEach(timer => clearTimeout(timer));
    timersRef.current = [];
  };

  const scheduleAudio = (audioKey: Parameters<typeof playAudio>[0], delay: number) => {
    if (isMuted) return;
    const timer = setTimeout(() => {
      playAudio(audioKey);
    }, delay);
    timersRef.current.push(timer);
  };

  const scheduleCount = (count: number, delay: number) => {
    const timer = setTimeout(() => {
      setCurrentCount(count);
      const clearTimer = setTimeout(() => setCurrentCount(0), 800);
      timersRef.current.push(clearTimer);
    }, delay);
    timersRef.current.push(timer);
  };

  const runBreathingCycle = (cycleNumber: number) => {
    if (!isActiveRef.current) return;

    const withCounting = cycleNumber <= 3;
    const baseDelay = 0;

    // INHALE phase (4 seconds)
    setPhase("inhale");
    setScale(1.0);
    scheduleAudio("breatheIn", baseDelay);
    if (withCounting) {
      scheduleAudio("one", baseDelay + 1000);
      scheduleCount(1, baseDelay + 1000);
      scheduleAudio("two", baseDelay + 2000);
      scheduleCount(2, baseDelay + 2000);
      scheduleAudio("three", baseDelay + 3000);
      scheduleCount(3, baseDelay + 3000);
      scheduleAudio("four", baseDelay + 4000);
      scheduleCount(4, baseDelay + 4000);
    }

    // HOLD FULL phase (4 seconds)
    const holdFullDelay = baseDelay + 4000;
    const holdFullTimer = setTimeout(() => {
      if (!isActiveRef.current) return;
      setPhase("hold-full");
      scheduleAudio("holdYourBreath", 0);
      if (withCounting) {
        scheduleAudio("one", 1000);
        scheduleCount(1, 1000);
        scheduleAudio("two", 2000);
        scheduleCount(2, 2000);
        scheduleAudio("three", 3000);
        scheduleCount(3, 3000);
        scheduleAudio("four", 4000);
        scheduleCount(4, 4000);
      }
    }, holdFullDelay);
    timersRef.current.push(holdFullTimer);

    // EXHALE phase (4 seconds)
    const exhaleDelay = holdFullDelay + 4000;
    const exhaleTimer = setTimeout(() => {
      if (!isActiveRef.current) return;
      setPhase("exhale");
      setScale(0.3);
      scheduleAudio("breatheOut", 0);
      if (withCounting) {
        scheduleAudio("one", 1000);
        scheduleCount(1, 1000);
        scheduleAudio("two", 2000);
        scheduleCount(2, 2000);
        scheduleAudio("three", 3000);
        scheduleCount(3, 3000);
        scheduleAudio("four", 4000);
        scheduleCount(4, 4000);
      }
    }, exhaleDelay);
    timersRef.current.push(exhaleTimer);

    // HOLD EMPTY phase (4 seconds)
    const holdEmptyDelay = exhaleDelay + 4000;
    const holdEmptyTimer = setTimeout(() => {
      if (!isActiveRef.current) return;
      setPhase("hold-empty");
      scheduleAudio("hold", 0);
      if (withCounting) {
        scheduleAudio("one", 1000);
        scheduleCount(1, 1000);
        scheduleAudio("two", 2000);
        scheduleCount(2, 2000);
        scheduleAudio("three", 3000);
        scheduleCount(3, 3000);
        scheduleAudio("four", 4000);
        scheduleCount(4, 4000);
      }
    }, holdEmptyDelay);
    timersRef.current.push(holdEmptyTimer);

    // Next cycle
    const nextCycleDelay = holdEmptyDelay + 4000;
    const nextCycleTimer = setTimeout(() => {
      if (!isActiveRef.current) return;
      setCycleCount(prev => prev + 1);
      runBreathingCycle(cycleNumber + 1);
    }, nextCycleDelay);
    timersRef.current.push(nextCycleTimer);
  };

  const handleStart = () => {
    if (isLoading || loadError) return;
    
    initAudioContext();
    isActiveRef.current = true;
    
    if (!hasPlayedWelcome) {
      // Stage 1: Welcome
      setStage("welcome");
      setPhase("welcome");
      setScale(0.6);
      if (!isMuted) playAudio("welcomeMessage");
      
      // Stage 2: Box Breathing Intro (first cycle)
      const introTimer = setTimeout(() => {
        if (!isActiveRef.current) return;
        setStage("intro");
        setPhase("intro");
        setScale(0.5);
        if (!isMuted) playAudio("boxBreathingIntro");
        
        // Start normal breathing cycles after intro (intro is cycle 1)
        const breathingTimer = setTimeout(() => {
          if (!isActiveRef.current) return;
          setStage("breathing");
          setCycleCount(1);
          setHasPlayedWelcome(true);
          runBreathingCycle(2); // Start with cycle 2 (with counting)
        }, 90000); // Adjust based on BoxBreathingIntro.mp3 duration
        timersRef.current.push(breathingTimer);
      }, 8000); // Adjust based on WelcomeMessage.mp3 duration
      timersRef.current.push(introTimer);
    } else {
      // Skip welcome, go straight to breathing with counting
      setStage("breathing");
      setCycleCount(1);
      setScale(0.3);
      runBreathingCycle(1);
    }
  };

  const handleStop = () => {
    isActiveRef.current = false;
    clearAllTimers();
    stopAllAudio();
    
    if (cycleCount > 0) {
      setShowCompletion(true);
    }
    
    setStage("idle");
    setPhase("inhale");
    setScale(0.5);
    setCurrentCount(0);
  };

  const handleCompletionClose = () => {
    setShowCompletion(false);
    setCycleCount(0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      stopAllAudio();
    }
  };

  const handleTap = () => {
    if (stage === "idle") {
      handleStart();
    } else {
      handleStop();
    }
  };

  useEffect(() => {
    return () => {
      clearAllTimers();
      stopAllAudio();
    };
  }, []);

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-destructive text-lg">{loadError}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

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
        <BreathingCircle 
          phase={phase} 
          isActive={stage !== "idle"} 
          onTap={handleTap}
          scale={scale}
          currentCount={currentCount}
        />

        {/* Controls */}
        <div className="flex flex-col items-center gap-6">
          {/* Cycle Counter */}
          {cycleCount > 0 && stage === "breathing" && (
            <div className="text-center">
              <p className="text-muted-foreground text-sm">Cycle</p>
              <p className="text-3xl font-light text-foreground">{cycleCount}</p>
            </div>
          )}

          {/* Start/Stop Button */}
          <Button
            onClick={stage === "idle" ? handleStart : handleStop}
            size="lg"
            disabled={isLoading}
            className="w-40 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-lg shadow-lg hover:shadow-xl transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading...
              </>
            ) : stage === "idle" ? (
              <>
                <Play className="mr-2 h-5 w-5" />
                Start
              </>
            ) : (
              <>
                <Square className="mr-2 h-5 w-5" />
                Stop
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
