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

    // INHALE
    setPhase("inhale");
    setScale(1.0);
    if (!isMuted) {
      playAudioNonBlocking("breatheIn");
      scheduleTimeout(() => {
        setCurrentCount(2);
        playAudioNonBlocking("two");
      }, 1000);
      scheduleTimeout(() => {
        setCurrentCount(3);
        playAudioNonBlocking("three");
      }, 2000);
      scheduleTimeout(() => {
        setCurrentCount(4);
        playAudioNonBlocking("four");
      }, 3000);
      scheduleTimeout(() => setCurrentCount(0), 3100);
    }
    await sleep(4000);
    if (!isActiveRef.current) return;

    // HOLD FULL
    setPhase("hold-full");
    if (!isMuted) {
      playAudioNonBlocking("holdYourBreath");
      scheduleTimeout(() => {
        setCurrentCount(2);
        playAudioNonBlocking("two");
      }, 1000);
      scheduleTimeout(() => {
        setCurrentCount(3);
        playAudioNonBlocking("three");
      }, 2000);
      scheduleTimeout(() => {
        setCurrentCount(4);
        playAudioNonBlocking("four");
      }, 3000);
      scheduleTimeout(() => setCurrentCount(0), 3100);
    }
    await sleep(4000);
    if (!isActiveRef.current) return;

    // EXHALE
    setPhase("exhale");
    setScale(0.3);
    if (!isMuted) {
      playAudioNonBlocking("breatheOut");
      scheduleTimeout(() => {
        setCurrentCount(2);
        playAudioNonBlocking("two");
      }, 1000);
      scheduleTimeout(() => {
        setCurrentCount(3);
        playAudioNonBlocking("three");
      }, 2000);
      scheduleTimeout(() => {
        setCurrentCount(4);
        playAudioNonBlocking("four");
      }, 3000);
      scheduleTimeout(() => setCurrentCount(0), 3100);
    }
    await sleep(4000);
    if (!isActiveRef.current) return;

    // HOLD EMPTY
    setPhase("hold-empty");
    if (!isMuted) {
      playAudioNonBlocking("hold");
      scheduleTimeout(() => {
        setCurrentCount(2);
        playAudioNonBlocking("two");
      }, 1000);
      scheduleTimeout(() => {
        setCurrentCount(3);
        playAudioNonBlocking("three");
      }, 2000);
      scheduleTimeout(() => {
        setCurrentCount(4);
        playAudioNonBlocking("four");
      }, 3000);
      scheduleTimeout(() => setCurrentCount(0), 3100);
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        handleTap();
      }
      
      if (e.code === 'Escape' && stage !== "idle") {
        handleStop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage]);

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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden">
      {/* Floating particles */}
      {Array.from({ length: 25 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/20 pointer-events-none"
          style={{
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `floatUp ${20 + Math.random() * 20}s linear infinite`,
            animationDelay: `${Math.random() * 10}s`,
            opacity: Math.random() * 0.15 + 0.1,
          }}
        />
      ))}

      {/* Background glow orbs */}
      <div 
        className="absolute w-[250px] h-[250px] rounded-full blur-[100px] opacity-[0.08] bg-primary pointer-events-none"
        style={{
          top: '20%',
          left: '15%',
          animation: 'orbDrift 40s ease-in-out infinite',
        }}
      />
      <div 
        className="absolute w-[250px] h-[250px] rounded-full blur-[100px] opacity-[0.06] bg-secondary pointer-events-none"
        style={{
          bottom: '15%',
          right: '20%',
          animation: 'orbDrift 35s ease-in-out infinite',
          animationDelay: '10s',
        }}
      />
      <div 
        className="absolute w-[250px] h-[250px] rounded-full blur-[100px] opacity-[0.05] bg-accent pointer-events-none"
        style={{
          top: '60%',
          left: '70%',
          animation: 'orbDrift 45s ease-in-out infinite',
          animationDelay: '20s',
        }}
      />
      
      {/* Glassmorphism card - LOCKED DIMENSIONS */}
      <div className="glassmorphism-card relative z-10 w-[600px] max-w-[90vw] min-h-[550px] p-8 md:p-12 lg:p-16 box-border flex flex-col">
        {/* Mute Toggle */}
        <button
          onClick={toggleMute}
          className="absolute top-4 right-4 w-12 h-12 rounded-full glassmorphism-button flex items-center justify-center transition-all hover:scale-110"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5 text-muted-foreground" />
          ) : (
            <Volume2 className="h-5 w-5 text-foreground" />
          )}
        </button>

        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <h1 className="text-4xl md:text-5xl lg:text-[56px] font-light tracking-[2px] text-foreground" style={{ textShadow: '0 2px 20px rgba(255,255,255,0.2)' }}>
            Box Breathing
          </h1>
          <p className="text-foreground/90 text-base md:text-lg tracking-[0.5px]">
            Find your calm, one breath at a time
          </p>
        </div>

        {/* Breathing Circle */}
        <div className="flex-1 flex items-center justify-center">
          <BreathingCircle 
            phase={phase} 
            isActive={stage !== "idle"} 
            onTap={handleTap}
            scale={scale}
            currentCount={currentCount}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-6 mt-8">
          {/* Cycle Counter */}
          {cycleCount > 0 && stage === "breathing" && (
            <div className="text-center">
              <p className="text-muted-foreground text-sm tracking-wide">Cycle</p>
              <p className="text-3xl font-light text-foreground">{cycleCount}</p>
            </div>
          )}

          {/* Start/Stop Button */}
          <button
            onClick={stage === "idle" ? handleStart : handleStop}
            disabled={isLoading}
            className="glassmorphism-button px-9 py-3.5 rounded-full font-medium text-base tracking-wide shadow-[0_4px_20px_rgba(100,150,255,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="inline mr-2 h-5 w-5 animate-spin" />
                Loading...
              </>
            ) : stage === "idle" ? (
              <>
                <Play className="inline mr-2 h-5 w-5" />
                Start
              </>
            ) : (
              <>
                <Square className="inline mr-2 h-5 w-5" />
                Stop
              </>
            )}
          </button>
        </div>

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
