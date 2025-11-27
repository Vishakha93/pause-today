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

  useEffect(() => {
    setDisplayScale(scale);
  }, [scale]);

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
    <div className="flex flex-col items-center justify-center gap-6 md:gap-8 lg:gap-10">
      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-light tracking-wide text-foreground/90 min-h-[40px] md:min-h-[50px] lg:min-h-[60px]">
        {isActive ? getPhaseText() : ""}
      </h2>
      
      <div 
        className="relative flex items-center justify-center w-full max-w-[280px] sm:max-w-[320px] md:max-w-[400px] lg:max-w-[500px] aspect-square cursor-pointer group transition-transform duration-300 hover:scale-105"
        onClick={onTap}
        role="button"
        aria-label={isActive ? "Stop breathing exercise" : "Start breathing exercise"}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onTap();
          }
        }}
      >
        {/* Outer concentric rings */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none animate-pulse"
          style={{
            background: 'radial-gradient(circle, transparent 40%, hsl(var(--primary) / 0.15) 50%, transparent 60%)',
            animationDuration: '3s',
          }}
        />
        <div 
          className="absolute inset-0 rounded-full pointer-events-none animate-pulse"
          style={{
            background: 'radial-gradient(circle, transparent 50%, hsl(var(--secondary) / 0.15) 60%, transparent 70%)',
            animationDuration: '4s',
            animationDelay: '1s',
          }}
        />
        
        {/* Wave ripples */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, hsl(var(--secondary) / 0.2) 50%, transparent 70%)',
            transform: `scale(${displayScale * 1.3})`,
            transition: `transform ${getTransitionDuration()} cubic-bezier(0.4, 0, 0.2, 1)`,
            opacity: isActive ? 1 : 0.5,
          }}
        />
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsl(var(--secondary) / 0.2) 0%, transparent 60%)',
            transform: `scale(${displayScale * 1.15})`,
            transition: `transform ${getTransitionDuration()} cubic-bezier(0.4, 0, 0.2, 1)`,
            opacity: isActive ? 0.8 : 0.4,
          }}
        />
        
        {/* Main breathing circle with wave effect */}
        <div 
          className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden animate-pulse"
          style={{
            background: 'radial-gradient(circle at center, hsl(var(--primary) / 0.7) 0%, hsl(var(--primary) / 0.5) 40%, hsl(var(--secondary) / 0.6) 100%)',
            transform: `scale(${displayScale})`,
            transition: `transform ${getTransitionDuration()} cubic-bezier(0.4, 0, 0.2, 1)`,
            boxShadow: `0 0 ${40 * displayScale}px hsl(var(--primary) / 0.5), 0 0 ${60 * displayScale}px hsl(var(--secondary) / 0.3), inset 0 0 40px hsl(var(--primary) / 0.3)`,
            animationDuration: '2s',
          }}
        >
          {/* Shimmer effect */}
          <div 
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(45deg, transparent 30%, hsl(var(--primary) / 0.3) 50%, transparent 70%)',
              backgroundSize: '200% 200%',
              animation: 'shimmer 3s ease-in-out infinite',
            }}
          />
          
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
              <span className="text-xs sm:text-sm md:text-base text-foreground/60 group-hover:text-foreground/90 group-hover:scale-105 transition-all duration-200">
                Tap to begin
              </span>
            )}
            {isActive && currentCount && currentCount > 0 && (
              <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-foreground/80 animate-fade-in">
                {currentCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
