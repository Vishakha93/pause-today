import { useState, useEffect, useRef } from "react";
import { BreathingCircle } from "@/components/BreathingCircle";
import { CompletionDialog } from "@/components/CompletionDialog";
import { Volume2, VolumeX, Play, Square, Command } from "lucide-react";
import { useAudioManager } from "@/hooks/useAudioManager";

type BreathingPhase = "welcome" | "intro" | "inhale" | "hold-full" | "exhale" | "hold-empty";
type Stage = "idle" | "welcome" | "intro" | "breathing";

const Index = () => {
  const { playSound, playAndWait, stopAllAudio, initAudioContext, scheduleTimer, clearAllTimers } = useAudioManager();
  const [stage, setStage] = useState<Stage>("idle");
  const [phase, setPhase] = useState<BreathingPhase>("inhale");
  const [cycleCount, setCycleCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [currentCount, setCurrentCount] = useState<number>(0);
  const [showCompletion, setShowCompletion] = useState(false);
  const [hasPlayedWelcome, setHasPlayedWelcome] = useState(false);
  const [scale, setScale] = useState(0.5);
  
  const isActiveRef = useRef(false);
  const cycleNumberRef = useRef(0);
  const sessionStartTimeRef = useRef<number | null>(null);

  // Google Analytics tracking helper
  const trackEvent = (eventName: string, eventParams?: Record<string, any>) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, eventParams);
    }
  };

  // BREATHING PHASES - Simple, no waiting for audio
  const doInhale = (withCounting: boolean) => {
    if (!isActiveRef.current) return;
    console.log('INHALE, counting:', withCounting);
    
    setPhase("inhale");
    setScale(1.0);
    
    if (!isMuted) {
      playSound("breatheIn");
      if (withCounting) {
        scheduleTimer(() => { setCurrentCount(2); playSound("two"); }, 1000);
        scheduleTimer(() => { setCurrentCount(3); playSound("three"); }, 2000);
        scheduleTimer(() => { setCurrentCount(4); playSound("four"); }, 3000);
        scheduleTimer(() => setCurrentCount(0), 3500);
      }
    }
    
    scheduleTimer(() => doHoldFull(withCounting), 4000);
  };

  const doHoldFull = (withCounting: boolean) => {
    if (!isActiveRef.current) return;
    console.log('HOLD FULL, counting:', withCounting);
    
    setPhase("hold-full");
    
    if (!isMuted) {
      playSound("holdYourBreath");
      if (withCounting) {
        scheduleTimer(() => { setCurrentCount(2); playSound("two"); }, 1000);
        scheduleTimer(() => { setCurrentCount(3); playSound("three"); }, 2000);
        scheduleTimer(() => { setCurrentCount(4); playSound("four"); }, 3000);
        scheduleTimer(() => setCurrentCount(0), 3500);
      }
    }
    
    scheduleTimer(() => doExhale(withCounting), 4000);
  };

  const doExhale = (withCounting: boolean) => {
    if (!isActiveRef.current) return;
    console.log('EXHALE, counting:', withCounting);
    
    setPhase("exhale");
    setScale(0.3);
    
    if (!isMuted) {
      playSound("breatheOut");
      if (withCounting) {
        scheduleTimer(() => { setCurrentCount(2); playSound("two"); }, 1000);
        scheduleTimer(() => { setCurrentCount(3); playSound("three"); }, 2000);
        scheduleTimer(() => { setCurrentCount(4); playSound("four"); }, 3000);
        scheduleTimer(() => setCurrentCount(0), 3500);
      }
    }
    
    scheduleTimer(() => doHoldEmpty(withCounting), 4000);
  };

  const doHoldEmpty = (withCounting: boolean) => {
    if (!isActiveRef.current) return;
    console.log('HOLD EMPTY, counting:', withCounting);
    
    setPhase("hold-empty");
    
    if (!isMuted) {
      playSound("hold");
      if (withCounting) {
        scheduleTimer(() => { setCurrentCount(2); playSound("two"); }, 1000);
        scheduleTimer(() => { setCurrentCount(3); playSound("three"); }, 2000);
        scheduleTimer(() => { setCurrentCount(4); playSound("four"); }, 3000);
        scheduleTimer(() => setCurrentCount(0), 3500);
      }
    }
    
    scheduleTimer(() => {
      if (!isActiveRef.current) return;
      
      cycleNumberRef.current++;
      setCycleCount(cycleNumberRef.current);
      console.log('Cycle completed:', cycleNumberRef.current);
      
      trackEvent('cycle_completed', {
        event_category: 'progress',
        event_label: 'cycle_complete',
        cycle_number: cycleNumberRef.current
      });
      
      // Cycles 1-2 have counting, 3+ don't
      const nextWithCounting = cycleNumberRef.current < 2;
      doInhale(nextWithCounting);
    }, 4000);
  };

  // START SEQUENCE - Uses callbacks for waiting
  const startBreathing = () => {
    console.log('Starting breathing cycles');
    setStage("breathing");
    cycleNumberRef.current = 0;
    setCycleCount(0);
    doInhale(true); // Start with counting
  };

  const startWithWelcome = () => {
    console.log('Playing welcome');
    setStage("welcome");
    setPhase("welcome");
    setScale(0.6);
    
    playAndWait("welcomeMessage", () => {
      if (!isActiveRef.current) return;
      console.log('Welcome done, waiting 1 sec');
      
      scheduleTimer(() => {
        if (!isActiveRef.current) return;
        console.log('Playing explanation');
        setStage("intro");
        setPhase("intro");
        setScale(0.5);
        
        playAndWait("boxBreathingExplanation", () => {
          if (!isActiveRef.current) return;
          console.log('Explanation done, waiting 1.5 sec');
          setHasPlayedWelcome(true);
          
          scheduleTimer(() => {
            if (!isActiveRef.current) return;
            startBreathing();
          }, 1500);
        });
      }, 1000);
    });
  };

  const handleStart = () => {
    console.log('START BUTTON CLICKED');
    
    // Initialize audio context for mobile
    initAudioContext();
    
    isActiveRef.current = true;
    sessionStartTimeRef.current = Date.now();
    
    trackEvent('breathing_started', {
      event_category: 'engagement',
      event_label: 'session_start'
    });
    
    if (!hasPlayedWelcome) {
      startWithWelcome();
    } else {
      startBreathing();
    }
  };

  const handleStop = () => {
    console.log('STOP BUTTON CLICKED');
    isActiveRef.current = false;
    clearAllTimers();
    stopAllAudio();

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
      clearAllTimers();
      stopAllAudio();
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        
        trackEvent('keyboard_shortcut', {
          event_category: 'interaction',
          event_label: 'spacebar',
          action: stage === "idle" ? 'start' : 'stop'
        });
        
        handleTap();
      }
      
      if (e.code === 'Escape' && stage !== "idle") {
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden">
      {/* Vignette overlay */}
      <div className="vignette" />
      
      {/* Golden sparkles */}
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
      
      {/* Floating particles */}
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

      {/* Background glow orbs */}
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
      
      {/* Glassmorphism card */}
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
            className="glassmorphism-button px-12 py-4 rounded-full font-light text-base tracking-[2px] flex items-center gap-3 relative overflow-hidden group/btn"
            style={{
              textShadow: '0 1px 8px rgba(0, 0, 0, 0.2)',
            }}
          >
            {stage === "idle" ? (
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
          
          {/* Keyboard shortcut hint */}
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
