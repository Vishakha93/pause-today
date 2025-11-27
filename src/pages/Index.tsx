import { useState, useEffect, useRef } from "react";
import { BreathingCircle } from "@/components/BreathingCircle";
import { CompletionDialog } from "@/components/CompletionDialog";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Play, Square, Loader2 } from "lucide-react";
import { useAudioManager } from "@/hooks/useAudioManager";

type BreathingPhase = "welcome" | "intro" | "inhale" | "hold-full" | "exhale" | "hold-empty";
type Stage = "idle" | "welcome" | "intro" | "breathing";

// TypeScript declaration for Google Analytics
declare global {
  interface Window {
    gtag: (command: string, ...args: any[]) => void;
    dataLayer: any[];
  }
}

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
  const sessionStartTimeRef = useRef<number>(0);
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

    // Track session duration
    const sessionDuration = sessionStartTimeRef.current 
      ? Math.round((Date.now() - sessionStartTimeRef.current) / 1000)
      : 0;

    // Track breathing stopped with analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'breathing_stopped', {
        'event_category': 'engagement',
        'event_label': 'user_stopped_breathing',
        'value': cycleCount,
        'session_duration': sessionDuration
      });
    }

    if (cycleCount > 0) {
      setShowCompletion(true);
    }

    setStage("idle");
    setPhase("inhale");
    setScale(0.5);
    setCurrentCount(0);
    sessionStartTimeRef.current = 0;
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
    
    // Track cycle completion
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'cycle_completed', {
        'event_category': 'progress',
        'event_label': `cycle_${cycleNumber}`,
        'value': cycleNumber
      });
    }
    
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
    
    // Track cycle completion
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'cycle_completed', {
        'event_category': 'progress',
        'event_label': `cycle_${cycleNumber}`,
        'value': cycleNumber
      });
    }
    
    await sleep(500);
  }

  async function runBreathingSession(startWithWelcome: boolean) {
    if (!isActiveRef.current) return;

    if (startWithWelcome && !hasPlayedWelcome) {
      console.log('Playing WelcomeMessage');
      setStage("welcome");
      setPhase("welcome");
      setScale(0.6);
      
      // Track welcome played
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'welcome_played', {
          'event_category': 'onboarding',
          'event_label': 'welcome_message'
        });
      }
      
      await playAudio("welcomeMessage");
      if (!isActiveRef.current) return;
      console.log('WelcomeMessage finished');
      await sleep(1000);

      console.log('Playing BoxBreathingExplanation');
      setStage("intro");
      setPhase("intro");
      setScale(0.5);
      
      // Track explanation played
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'explanation_played', {
          'event_category': 'onboarding',
          'event_label': 'box_breathing_explanation'
        });
      }
      
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
    sessionStartTimeRef.current = Date.now();

    // Track breathing started
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'breathing_started', {
        'event_category': 'engagement',
        'event_label': 'user_started_breathing',
        'is_first_time': !hasPlayedWelcome
      });
    }

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
    // Track circle clicked
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'circle_clicked', {
        'event_category': 'interaction',
        'event_label': 'breathing_circle',
        'action': stage === "idle" ? 'start' : 'stop'
      });
    }

    if (stage === "idle") {
      handleStart();
    } else {
      handleStop();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        handleTap();
      } else if (e.key === 'Escape' && stage !== "idle") {
        e.preventDefault();
        handleStop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      isActiveRef.current = false;
      clearAllTimeouts();
      stopAllAudio();
    };
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Ambient background circles */}
      <div className="absolute top-1/4 left-1/4 w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="relative z-10 w-full max-w-md lg:max-w-2xl space-y-8 sm:space-y-10 md:space-y-12 lg:space-y-16">
        {/* Header */}
        <div className="text-center space-y-2 md:space-y-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light tracking-wider text-foreground">
            Box Breathing
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg">
            Find your calm, one breath at a time
          </p>
          {stage === "idle" && !isLoading && (
            <p className="text-xs sm:text-sm text-muted-foreground/70 mt-2 hidden md:block">
              Press Space to start
            </p>
          )}
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
        <div className="flex flex-col items-center gap-4 sm:gap-5 md:gap-6">
          {/* Cycle Counter */}
          {cycleCount > 0 && stage === "breathing" && (
            <div className="text-center">
              <p className="text-muted-foreground text-xs sm:text-sm md:text-base">Cycle</p>
              <p className="text-2xl sm:text-3xl md:text-4xl font-light text-foreground">{cycleCount}</p>
            </div>
          )}

          {/* Start/Stop Button */}
          <Button
            onClick={stage === "idle" ? handleStart : handleStop}
            size="lg"
            disabled={isLoading}
            className="w-36 h-12 sm:w-40 sm:h-14 md:w-48 md:h-16 lg:w-52 lg:h-16 rounded-full bg-primary hover:bg-primary/90 hover:scale-105 active:scale-95 text-primary-foreground font-medium text-base sm:text-lg md:text-xl shadow-lg hover:shadow-xl transition-all duration-200 min-h-[44px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                <span className="text-sm sm:text-base md:text-lg">Loading...</span>
              </>
            ) : stage === "idle" ? (
              <>
                <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base md:text-lg">Start</span>
              </>
            ) : (
              <>
                <Square className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base md:text-lg">Stop</span>
              </>
            )}
          </Button>
        </div>

        {/* Mute Toggle */}
        <button
          onClick={toggleMute}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2.5 sm:p-3 md:p-3.5 rounded-full bg-card/50 backdrop-blur-sm hover:bg-card/70 hover:scale-110 active:scale-95 transition-all duration-200 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-muted-foreground" />
          ) : (
            <Volume2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-foreground" />
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
