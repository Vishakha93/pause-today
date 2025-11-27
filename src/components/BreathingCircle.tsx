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
    <div className="flex flex-col items-center justify-center gap-6 w-full">
      <h2 className="text-xl md:text-2xl lg:text-3xl font-light tracking-wide text-foreground/90 min-h-[36px]">
        {isActive ? getPhaseText() : "Ready to Begin"}
      </h2>
      
      <div 
        className="relative flex items-center justify-center w-full max-w-[280px] md:max-w-[350px] lg:max-w-[400px] aspect-square cursor-pointer group"
        onClick={onTap}
        style={{
          animation: !isActive ? 'idlePulse 3.5s ease-in-out infinite' : 'none',
        }}
      >
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
        
        {/* Main breathing circle with enhanced styling */}
        <div 
          className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:scale-[1.03]"
          style={{
            background: 'radial-gradient(circle at 30% 30%, hsl(var(--primary) / 0.7) 0%, hsl(var(--primary) / 0.6) 40%, hsl(var(--secondary) / 0.6) 100%)',
            transform: `scale(${displayScale})`,
            transition: `transform ${getTransitionDuration()} cubic-bezier(0.4, 0, 0.2, 1)`,
            boxShadow: `0 20px 40px rgba(0,0,0,0.4), 0 0 ${40 * displayScale}px hsl(var(--primary) / 0.4), 0 0 ${60 * displayScale}px hsl(var(--secondary) / 0.25), inset 0 0 30px hsl(var(--primary) / 0.2)`,
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
