import { useEffect, useState } from "react";

type BreathingPhase = "welcome" | "intro" | "inhale" | "hold-full" | "exhale" | "hold-empty";

interface BreathingCircleProps {
  phase: BreathingPhase;
  isActive: boolean;
  onTap: () => void;
  scale: number;
  currentCount?: number;
}

export const BreathingCircle = ({ phase, isActive, onTap, scale, currentCount }: BreathingCircleProps) => {
  const [displayScale, setDisplayScale] = useState(0.5);
  const [showRipples, setShowRipples] = useState(false);

  useEffect(() => {
    setDisplayScale(scale);
  }, [scale]);

  useEffect(() => {
    setShowRipples(isActive);
  }, [isActive]);

  // Dynamic orb gradient that complements the background
  const getOrbGradient = () => {
    // Cycle through complementary colors based on phase
    switch (phase) {
      case "inhale":
        return 'radial-gradient(circle at 35% 35%, hsl(210, 85%, 70%) 0%, hsl(210, 80%, 60%) 40%, hsl(260, 70%, 65%) 100%)';
      case "hold-full":
        return 'radial-gradient(circle at 35% 35%, hsl(260, 80%, 75%) 0%, hsl(260, 70%, 65%) 40%, hsl(280, 65%, 70%) 100%)';
      case "exhale":
        return 'radial-gradient(circle at 35% 35%, hsl(200, 75%, 65%) 0%, hsl(210, 70%, 55%) 40%, hsl(220, 65%, 60%) 100%)';
      case "hold-empty":
        return 'radial-gradient(circle at 35% 35%, hsl(220, 70%, 60%) 0%, hsl(230, 65%, 55%) 40%, hsl(240, 60%, 60%) 100%)';
      default:
        return 'radial-gradient(circle at 35% 35%, hsl(210, 80%, 65%) 0%, hsl(210, 75%, 55%) 40%, hsl(260, 65%, 60%) 100%)';
    }
  };

  const getPhaseText = () => {
    switch (phase) {
      case "welcome":
        return "Welcome";
      case "intro":
        return "Listen & Follow";
      case "inhale":
        return "Breathe In";
      case "hold-full":
        return "Hold";
      case "exhale":
        return "Breathe Out";
      case "hold-empty":
        return "Hold";
      default:
        return "Ready to Begin";
    }
  };

  const getTransitionDuration = () => {
    if (phase === "inhale" || phase === "exhale") {
      return "4s";
    }
    return "0.3s";
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 w-full">
      <h2 
        className="text-xl md:text-2xl lg:text-3xl font-light tracking-[2px] text-foreground/95 min-h-[40px] transition-all duration-700 ease-out"
        style={{
          textShadow: '0 2px 24px rgba(255, 255, 255, 0.2)',
          opacity: isActive ? 1 : 0.85,
          transform: isActive ? 'translateY(0)' : 'translateY(-4px)',
        }}
      >
        {isActive ? getPhaseText() : "Ready to Begin"}
      </h2>
      
      <div 
        className="relative flex items-center justify-center w-full max-w-[280px] md:max-w-[350px] lg:max-w-[400px] aspect-square cursor-pointer group transition-all duration-500 ease-out"
        onClick={onTap}
        style={{
          animation: !isActive ? 'idlePulse 4s ease-in-out infinite' : 'none',
        }}
      >
        {/* Concentric ripple rings - only when active */}
        {showRipples && (
          <>
            <div
              className="absolute inset-0 rounded-full border-2 border-primary/50 pointer-events-none"
              style={{
                animation: 'ripple 3s ease-out infinite',
                animationDelay: '0s',
              }}
            />
            <div
              className="absolute inset-0 rounded-full border-2 border-secondary/40 pointer-events-none"
              style={{
                animation: 'rippleSlow 4s ease-out infinite',
                animationDelay: '1.5s',
              }}
            />
          </>
        )}
        
        {/* Wave ripples */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.4) 0%, hsl(var(--secondary) / 0.28) 50%, transparent 70%)',
            transform: `scale(${displayScale * 1.35})`,
            transition: `transform ${getTransitionDuration()} cubic-bezier(0.45, 0.05, 0.55, 0.95), opacity 0.6s ease-out`,
            opacity: isActive ? 1 : 0.45,
          }}
        />
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsl(var(--secondary) / 0.3) 0%, hsl(var(--accent) / 0.15) 50%, transparent 65%)',
            transform: `scale(${displayScale * 1.18})`,
            transition: `transform ${getTransitionDuration()} cubic-bezier(0.45, 0.05, 0.55, 0.95), opacity 0.6s ease-out`,
            opacity: isActive ? 0.95 : 0.45,
          }}
        />
        
        {/* Main breathing circle with enhanced styling and dynamic colors */}
        <div 
          className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden"
          style={{
            background: getOrbGradient(),
            transform: `scale(${displayScale})`,
            transition: `transform ${getTransitionDuration()} cubic-bezier(0.45, 0.05, 0.55, 0.95), background 5s cubic-bezier(0.25, 0.46, 0.45, 0.94), filter 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow ${getTransitionDuration()} cubic-bezier(0.45, 0.05, 0.55, 0.95)`,
            boxShadow: isActive 
              ? `0 30px 80px rgba(0,0,0,0.65), 0 0 ${90 * displayScale}px hsl(var(--primary) / 0.65), 0 0 ${140 * displayScale}px hsl(var(--secondary) / 0.4), inset 0 0 60px hsl(var(--primary) / 0.18), inset 0 -20px 40px hsl(var(--secondary) / 0.1)`
              : `0 24px 70px rgba(0,0,0,0.55), 0 0 ${70 * displayScale}px hsl(var(--primary) / 0.5), 0 0 ${100 * displayScale}px hsl(var(--secondary) / 0.3), inset 0 0 50px hsl(var(--primary) / 0.12), inset 0 -15px 30px hsl(var(--secondary) / 0.08)`,
            filter: isActive ? 'brightness(1.05) saturate(1.1)' : 'brightness(1) saturate(1)',
          }}
        >
          {/* Wave effect overlay */}
          <div 
            className="absolute inset-0 opacity-50 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 30%, hsl(var(--primary) / 0.3) 60%, transparent 90%)',
              animation: isActive && phase !== "welcome" ? 'wave 4s ease-in-out infinite' : 'none',
            }}
          />
          
          {/* Inner circle */}
          <div className="relative w-[85%] h-[85%] rounded-full bg-background/5 backdrop-blur-sm border border-foreground/10 flex items-center justify-center transition-all duration-500"
            style={{
              boxShadow: 'inset 0 2px 12px rgba(0, 0, 0, 0.2)',
            }}
          >
            {!isActive && (
              <span 
                className="text-sm md:text-base text-foreground/70 font-light tracking-wide transition-all duration-500"
                style={{
                  textShadow: '0 1px 8px rgba(0, 0, 0, 0.3)',
                }}
              >
                Tap to begin
              </span>
            )}
            {isActive && currentCount && currentCount > 0 && (
              <span 
                className="text-4xl md:text-5xl font-extralight text-foreground/85 transition-all duration-300"
                style={{
                  textShadow: '0 2px 16px rgba(255, 255, 255, 0.3)',
                  animation: 'fadeInScale 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
              >
                {currentCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
