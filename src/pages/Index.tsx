import { useState, useEffect, useRef } from "react";
import { BreathingCircle } from "@/components/BreathingCircle";
import { CompletionDialog } from "@/components/CompletionDialog";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Play, Square, Loader2, Command } from "lucide-react";
import { useAudioManager } from "@/hooks/useAudioManager";

type BreathingPhase = "welcome" | "intro" | "inhale" | "hold-full" | "exhale" | "hold-empty";
type Stage = "idle" | "welcome" | "intro" | "breathing";

const Index = () => {
  const { isLoading, loadError, playAudio, playAudioNonBlocking, stopAllAudio, prepareAudio, isMobile } = useAudioManager();
  const [isPreparing, setIsPreparing] = useState(false);
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
  const sessionStartTimeRef = useRef<number | null>(null);
  const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

  // Google Analytics tracking helper
  const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, eventParams);
    }
  };

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

    // Track session end
    if (sessionStartTimeRef.current) {
      const sessionDuration = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
      trackEvent('breathing_stopped', {
        event_category: 'engagement',
        event_label: 'session_end',
        cycles_completed: cycleCount,
        duration_seconds: sessionDuration
      });
      sessionStartTimeRef.current = null;
    }

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
    
    // Track cycle completion
    trackEvent('cycle_completed', {
      event_category: 'progress',
      event_label: 'cycle_complete',
      cycle_number: cycleNumber
    });
    
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
    trackEvent('cycle_completed', {
      event_category: 'progress',
      event_label: 'cycle_complete',
      cycle_number: cycleNumber
    });
    
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

  const handleStart = async () => {
    if (isLoading || loadError || isPreparing) return;

    console.log('Starting session');
    setIsPreparing(true);
    
    try {
      // Prepare audio (critical for mobile - must be on user gesture)
      await prepareAudio();
      
      // Small delay to ensure everything is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setIsPreparing(false);
      isActiveRef.current = true;
      sessionStartTimeRef.current = Date.now();

      // Track session start
      trackEvent('breathing_started', {
        event_category: 'engagement',
        event_label: 'session_start'
      });

      if (!hasPlayedWelcome) {
        runBreathingSession(true);
      } else {
        runBreathingSession(false);
      }
    } catch (error) {
      console.error('Error starting session:', error);
      setIsPreparing(false);
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
    // Track circle interaction
    trackEvent('circle_clicked', {
      event_category: 'interaction',
      event_label: 'breathing_circle',
      action: stage === "idle" ? 'start' : 'stop'
    });

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
        
        // Track keyboard shortcut
        trackEvent('keyboard_shortcut', {
          event_category: 'interaction',
          event_label: 'spacebar',
          action: stage === "idle" ? 'start' : 'stop'
        });
        
        handleTap();
      }
      
      if (e.code === 'Escape' && stage !== "idle") {
        // Track escape key
        trackEvent('keyboard_shortcut', {
          event_category: 'interaction',
          event_label: 'escape',
          action: 'stop'
        });
        
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
      {/* Vignette overlay */}
      <div className="vignette" />
      
      {/* Golden sparkles - outside the card */}
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={`sparkle-${i}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            background: 'hsl(45, 100%, 70%)',
            boxShadow: '0 0 4px hsl(45, 100%, 70%)',
            opacity: 0,
            animation: `twinkle ${Math.random() * 4 + 3}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
      
      {/* Enhanced floating particles with varied animations */}
      {Array.from({ length: 25 }).map((_, i) => {
        const isLarge = i % 5 === 0;
        const size = isLarge ? Math.random() * 6 + 4 : Math.random() * 4 + 2;
        const animationType = i % 2 === 0 ? 'floatUp' : 'floatUpSlow';
        const color = i % 3 === 0 ? 'bg-blue-300/30' : i % 3 === 1 ? 'bg-purple-300/30' : 'bg-white/25';
        
        return (
          <div
            key={`particle-${i}`}
            className={`absolute rounded-full ${color} pointer-events-none`}
            style={{
              width: `${size}px`,
              height: `${size}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `${animationType} ${20 + Math.random() * 25}s linear infinite`,
              animationDelay: `${Math.random() * 15}s`,
              filter: 'blur(1px)',
              boxShadow: isLarge ? '0 0 10px rgba(255, 255, 255, 0.3)' : 'none',
            }}
          />
        );
      })}

      {/* Enhanced background glow orbs with varied sizes and movements */}
      <div 
        className="absolute w-[280px] h-[280px] rounded-full blur-[120px] opacity-[0.12] bg-primary pointer-events-none"
        style={{
          top: '15%',
          left: '10%',
          animation: 'orbDrift 45s ease-in-out infinite',
        }}
      />
      <div 
        className="absolute w-[300px] h-[300px] rounded-full blur-[130px] opacity-[0.1] bg-secondary pointer-events-none"
        style={{
          bottom: '10%',
          right: '15%',
          animation: 'orbDriftAlt 50s ease-in-out infinite',
          animationDelay: '15s',
        }}
      />
      <div 
        className="absolute w-[260px] h-[260px] rounded-full blur-[110px] opacity-[0.08] bg-accent pointer-events-none"
        style={{
          top: '55%',
          left: '75%',
          animation: 'orbDrift 55s ease-in-out infinite',
          animationDelay: '25s',
        }}
      />
      <div 
        className="absolute w-[220px] h-[220px] rounded-full blur-[100px] opacity-[0.09] pointer-events-none"
        style={{
          top: '40%',
          right: '5%',
          background: 'radial-gradient(circle, hsl(200, 80%, 60%), transparent)',
          animation: 'orbDriftAlt 42s ease-in-out infinite',
          animationDelay: '8s',
        }}
      />
      
      {/* Glassmorphism card - Portrait layout, responsive */}
      <div className="glassmorphism-card relative z-10 w-[90vw] md:w-[440px] lg:w-[480px] min-h-[600px] md:min-h-[640px] p-8 md:p-10 lg:p-12 box-border flex flex-col">
        {/* Mute Toggle */}
        <button
          onClick={toggleMute}
          className="absolute top-4 right-4 w-12 h-12 rounded-full glassmorphism-button flex items-center justify-center group/mute"
          aria-label={isMuted ? "Unmute" : "Mute"}
          style={{
            transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5 text-muted-foreground transition-all duration-300 group-hover/mute:text-foreground" />
          ) : (
            <Volume2 className="h-5 w-5 text-foreground/90 transition-all duration-300 group-hover/mute:text-foreground" />
          )}
        </button>

        {/* Header */}
        <div className="text-center space-y-5 mb-12">
          <h1 
            className="text-5xl md:text-6xl lg:text-[64px] font-extralight tracking-[4px] text-foreground transition-all duration-700" 
            style={{ 
              textShadow: '0 2px 32px rgba(255,255,255,0.4), 0 6px 48px rgba(100,150,255,0.2)',
              letterSpacing: '0.15em',
            }}
          >
            Pause
          </h1>
          <p className="text-foreground/95 text-base md:text-lg tracking-[2px] font-light opacity-95 transition-all duration-500"
            style={{
              textShadow: '0 1px 16px rgba(255, 255, 255, 0.15)',
            }}
          >
            Find your calm, one breath at a time
          </p>
        </div>

        {/* Breathing Circle */}
        <div className="flex-1 flex items-center justify-center breathing-circle-container">
          <BreathingCircle 
            phase={phase} 
            isActive={stage !== "idle"} 
            onTap={handleTap}
            scale={scale}
            currentCount={currentCount}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-7 mt-10">
          {/* Cycle Counter */}
          {cycleCount > 0 && stage === "breathing" && (
            <div className="text-center transition-all duration-700 animate-fade-in">
              <p className="text-muted-foreground/90 text-sm tracking-[2px] font-light mb-1"
                style={{ textShadow: '0 1px 8px rgba(0, 0, 0, 0.2)' }}
              >
                Cycle
              </p>
              <p className="text-4xl font-extralight text-foreground/95"
                style={{ textShadow: '0 2px 16px rgba(255, 255, 255, 0.2)' }}
              >
                {cycleCount}
              </p>
            </div>
          )}

          {/* Start/Stop Button */}
          <button
            onClick={stage === "idle" ? handleStart : handleStop}
            disabled={isLoading || isPreparing}
            className="glassmorphism-button px-12 py-4 rounded-full font-light text-base tracking-[2px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 relative overflow-hidden group/btn"
            style={{
              textShadow: '0 1px 8px rgba(0, 0, 0, 0.2)',
            }}
          >
            {isLoading || isPreparing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{isPreparing ? 'Preparing...' : 'Loading...'}</span>
              </>
            ) : stage === "idle" ? (
              <>
                <Play className="h-5 w-5 fill-current transition-transform duration-300 group-hover/btn:scale-110" />
                <span>Start</span>
              </>
            ) : (
              <>
                <Square className="h-5 w-5 fill-current transition-transform duration-300 group-hover/btn:scale-110" />
                <span>Stop</span>
              </>
            )}
          </button>
          
          {/* Keyboard shortcut hint - desktop only */}
          <div className="hidden md:block mt-2">
            <div className="keyboard-badge text-foreground/75 flex items-center gap-2.5 transition-all duration-500 hover:text-foreground/95">
              <Command className="h-3.5 w-3.5" />
              <span className="text-xs tracking-[1px]">Press Space to {stage === "idle" ? "start" : "stop"}</span>
            </div>
          </div>
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
