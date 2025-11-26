import { useState, useEffect, useRef } from "react";
import { BreathingCircle } from "@/components/BreathingCircle";
import { CompletionDialog } from "@/components/CompletionDialog";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Play, Square, Loader2 } from "lucide-react";
import { useAudioManager } from "@/hooks/useAudioManager";

type BreathingPhase = "welcome" | "intro" | "inhale" | "hold-full" | "exhale" | "hold-empty";
type Stage = "idle" | "welcome" | "intro" | "breathing";

const Index = () => {
  const { isLoading, loadError, playAudio, playAudioNonBlocking, stopAllAudio, initAudioContext } = useAudioManager();
  const [stage, setStage] = useState<Stage>("idle");
  const [phase, setPhase] = useState<BreathingPhase>("inhale");
  const [cycleCount, setCycleCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [currentCount, setCurrentCount] = useState<number>(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [hasPlayedWelcome, setHasPlayedWelcome] = useState(false);
  const [scale, setScale] = useState(0.5);
  
  const isActiveRef = useRef(false);
  const timeoutsRef = useRef<number[]>([]);
  const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  const scheduleTimeout = (callback: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      if (!isActiveRef.current) return;
      callback();
    }, delay);
    timeoutsRef.current.push(id);
  };

  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];
  };

  const handleStop = () => {
    console.log('Stopping session');
    isActiveRef.current = false;
    clearAllTimeouts();
    stopAllAudio();

    if (cycleCount > 0) {
      setShowCompletion(true);
    }

    setStage("idle");
    setPhase("inhale");
    setScale(0.5);
    setCurrentCount(0);
  };

  async function playCount(key: "one" | "two" | "three" | "four", value: number) {
    if (!isActiveRef.current) return;
    await sleep(1000);
    if (!isActiveRef.current) return;
    setCurrentCount(value);
    console.log(`Playing count ${value}`);
    await playAudio(key);
    setCurrentCount(0);
  }

  async function runGuidedCycle(cycleNumber: number) {
    if (!isActiveRef.current) return;
    console.log(`Starting cycle ${cycleNumber} with counting`);

    // INHALE (counts staggered to avoid overlap with instruction)
    setPhase("inhale");
    setScale(1.0);
    if (!isMuted) {
      playAudioNonBlocking("breatheIn");
      scheduleTimeout(() => {
        setCurrentCount(1);
        playAudioNonBlocking("one");
      }, 800);
      scheduleTimeout(() => {
        setCurrentCount(2);
        playAudioNonBlocking("two");
      }, 1600);
      scheduleTimeout(() => {
        setCurrentCount(3);
        playAudioNonBlocking("three");
      }, 2400);
      scheduleTimeout(() => {
        setCurrentCount(4);
        playAudioNonBlocking("four");
      }, 3200);
      scheduleTimeout(() => setCurrentCount(0), 3300);
    }
    await sleep(4000);
    if (!isActiveRef.current) return;

    // HOLD FULL (counts staggered for longer instruction)
    setPhase("hold-full");
    if (!isMuted) {
      playAudioNonBlocking("holdYourBreath");
      scheduleTimeout(() => {
        setCurrentCount(1);
        playAudioNonBlocking("one");
      }, 1200);
      scheduleTimeout(() => {
        setCurrentCount(2);
        playAudioNonBlocking("two");
      }, 2100);
      scheduleTimeout(() => {
        setCurrentCount(3);
        playAudioNonBlocking("three");
      }, 3000);
      scheduleTimeout(() => {
        setCurrentCount(4);
        playAudioNonBlocking("four");
      }, 3900);
      scheduleTimeout(() => setCurrentCount(0), 4000);
    }
    await sleep(4000);
    if (!isActiveRef.current) return;

    // EXHALE (counts staggered to avoid overlap)
    setPhase("exhale");
    setScale(0.3);
    if (!isMuted) {
      playAudioNonBlocking("breatheOut");
      scheduleTimeout(() => {
        setCurrentCount(1);
        playAudioNonBlocking("one");
      }, 900);
      scheduleTimeout(() => {
        setCurrentCount(2);
        playAudioNonBlocking("two");
      }, 1800);
      scheduleTimeout(() => {
        setCurrentCount(3);
        playAudioNonBlocking("three");
      }, 2700);
      scheduleTimeout(() => {
        setCurrentCount(4);
        playAudioNonBlocking("four");
      }, 3600);
      scheduleTimeout(() => setCurrentCount(0), 3700);
    }
    await sleep(4000);
    if (!isActiveRef.current) return;

    // HOLD EMPTY (counts staggered)
    setPhase("hold-empty");
    if (!isMuted) {
      playAudioNonBlocking("hold");
      scheduleTimeout(() => {
        setCurrentCount(1);
        playAudioNonBlocking("one");
      }, 600);
      scheduleTimeout(() => {
        setCurrentCount(2);
        playAudioNonBlocking("two");
      }, 1500);
      scheduleTimeout(() => {
        setCurrentCount(3);
        playAudioNonBlocking("three");
      }, 2400);
      scheduleTimeout(() => {
        setCurrentCount(4);
        playAudioNonBlocking("four");
      }, 3300);
      scheduleTimeout(() => setCurrentCount(0), 3400);
    }
    await sleep(4000);
    if (!isActiveRef.current) return;

    setCycleCount(cycleNumber);
    console.log(`Completed cycle ${cycleNumber}`);
    await sleep(500);
  }

  async function runUnguidedCycle(cycleNumber: number) {
    if (!isActiveRef.current) return;
    console.log(`Starting cycle ${cycleNumber} without counting`);

    // INHALE
    setPhase("inhale");
    setScale(1.0);
    if (!isMuted) {
      playAudioNonBlocking("breatheIn");
    }
    await sleep(4000);
    if (!isActiveRef.current) return;

    // HOLD FULL
    setPhase("hold-full");
    if (!isMuted) {
      playAudioNonBlocking("holdYourBreath");
    }
    await sleep(4000);
    if (!isActiveRef.current) return;

    // EXHALE
    setPhase("exhale");
    setScale(0.3);
    if (!isMuted) {
      playAudioNonBlocking("breatheOut");
    }
    await sleep(4000);
    if (!isActiveRef.current) return;

    // HOLD EMPTY
    setPhase("hold-empty");
    if (!isMuted) {
      playAudioNonBlocking("hold");
    }
    await sleep(4000);
    if (!isActiveRef.current) return;

    setCycleCount(cycleNumber);
    console.log(`Completed cycle ${cycleNumber}`);
    await sleep(500);
  }

  async function runBreathingSession(startWithWelcome: boolean) {
    if (!isActiveRef.current) return;

    if (startWithWelcome && !hasPlayedWelcome) {
      console.log('Playing WelcomeMessage');
      setStage("welcome");
      setPhase("welcome");
      setScale(0.6);
      await playAudio("welcomeMessage");
      if (!isActiveRef.current) return;
      console.log('WelcomeMessage finished');
      await sleep(1000);

      console.log('Playing BoxBreathingExplanation');
      setStage("intro");
      setPhase("intro");
      setScale(0.5);
      await playAudio("boxBreathingExplanation");
      if (!isActiveRef.current) return;
      console.log('BoxBreathingExplanation finished');
      await sleep(1500);

      setHasPlayedWelcome(true);
      setStage("breathing");

      // Cycles 1 and 2 with counting (the two guided cycles)
      await runGuidedCycle(1);
      if (!isActiveRef.current) return;
      await runGuidedCycle(2);
      if (!isActiveRef.current) return;

      // Cycles 3+ without counting
      let cycle = 3;
      while (isActiveRef.current) {
        await runUnguidedCycle(cycle);
        if (!isActiveRef.current) return;
        cycle += 1;
      }
    } else {
      setStage("breathing");
      setScale(0.3);

      // First two cycles with counting (restart scenario)
      await runGuidedCycle(1);
      if (!isActiveRef.current) return;
      await runGuidedCycle(2);
      if (!isActiveRef.current) return;

      // Remaining cycles without counting
      let cycle = 3;
      while (isActiveRef.current) {
        await runUnguidedCycle(cycle);
        if (!isActiveRef.current) return;
        cycle += 1;
      }
    }
  }

  const handleStart = () => {
    if (isLoading || loadError) return;

    console.log('Starting session');
    initAudioContext();
    isActiveRef.current = true;

    if (!hasPlayedWelcome) {
      runBreathingSession(true);
    } else {
      runBreathingSession(false);
    }
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
      isActiveRef.current = false;
      clearAllTimeouts();
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
