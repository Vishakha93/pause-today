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
    <div className="flex flex-col items-center justify-center gap-8">
      <h2 className="text-2xl md:text-3xl font-light tracking-wide text-foreground/90 min-h-[40px]">
        {isActive ? getPhaseText() : "Ready to Begin"}
      </h2>
      
      <div 
        className="relative flex items-center justify-center w-full max-w-[280px] md:max-w-[320px] aspect-square cursor-pointer group"
        onClick={onTap}
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
        
        {/* Main breathing circle with wave effect */}
        <div 
          className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary) / 0.6), hsl(var(--secondary) / 0.6))',
            transform: `scale(${displayScale})`,
            transition: `transform ${getTransitionDuration()} cubic-bezier(0.4, 0, 0.2, 1)`,
            boxShadow: `0 0 ${40 * displayScale}px hsl(var(--primary) / 0.4), 0 0 ${60 * displayScale}px hsl(var(--secondary) / 0.25), inset 0 0 30px hsl(var(--primary) / 0.2)`,
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
              <span className="text-sm text-foreground/60 group-hover:text-foreground/80 transition-colors">
                Tap to begin
              </span>
            )}
            {isActive && currentCount && currentCount > 0 && (
              <span className="text-4xl font-light text-foreground/80 animate-fade-in">
                {currentCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
