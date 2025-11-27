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
    <div className="flex flex-col items-center justify-center gap-6 w-full">
      <h2 className="text-xl md:text-2xl lg:text-3xl font-light tracking-[1.5px] text-foreground/90 min-h-[36px]">
        {isActive ? getPhaseText() : "Ready to Begin"}
      </h2>
      
      <div 
        className="relative flex items-center justify-center w-full max-w-[280px] md:max-w-[350px] lg:max-w-[400px] aspect-square cursor-pointer group"
        onClick={onTap}
        style={{
          animation: !isActive ? 'idlePulse 3s ease-in-out infinite' : 'none',
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
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.35) 0%, hsl(var(--secondary) / 0.25) 50%, transparent 70%)',
            transform: `scale(${displayScale * 1.3})`,
            transition: `transform ${getTransitionDuration()} cubic-bezier(0.4, 0, 0.2, 1)`,
            opacity: isActive ? 1 : 0.5,
          }}
        />
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsl(var(--secondary) / 0.25) 0%, transparent 60%)',
            transform: `scale(${displayScale * 1.15})`,
            transition: `transform ${getTransitionDuration()} cubic-bezier(0.4, 0, 0.2, 1)`,
            opacity: isActive ? 0.9 : 0.5,
          }}
        />
        
        {/* Main breathing circle with enhanced styling */}
        <div 
          className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-[1.05] group-hover:brightness-110"
          style={{
            background: 'radial-gradient(circle at 35% 35%, hsl(var(--primary) / 0.85) 0%, hsl(var(--primary) / 0.7) 40%, hsl(var(--secondary) / 0.65) 100%)',
            transform: `scale(${displayScale})`,
            transition: `transform ${getTransitionDuration()} cubic-bezier(0.4, 0, 0.2, 1), filter 0.3s ease`,
            boxShadow: isActive 
              ? `0 25px 70px rgba(0,0,0,0.6), 0 0 ${80 * displayScale}px hsl(var(--primary) / 0.6), 0 0 ${120 * displayScale}px hsl(var(--secondary) / 0.35), inset 0 0 50px hsl(var(--primary) / 0.15)`
              : `0 20px 60px rgba(0,0,0,0.5), 0 0 ${60 * displayScale}px hsl(var(--primary) / 0.45), 0 0 ${90 * displayScale}px hsl(var(--secondary) / 0.25), inset 0 0 40px hsl(var(--primary) / 0.1)`,
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
          <div className="relative w-[85%] h-[85%] rounded-full bg-background/5 backdrop-blur-sm border border-foreground/5 flex items-center justify-center">
            {!isActive && (
              <span className="text-sm md:text-base text-foreground/60 group-hover:text-foreground/80 transition-colors">
                Tap to begin
              </span>
            )}
            {isActive && currentCount && currentCount > 0 && (
              <span className="text-4xl md:text-5xl font-light text-foreground/80 animate-fade-in">
                {currentCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
