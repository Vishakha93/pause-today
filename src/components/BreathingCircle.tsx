import { useEffect, useState } from "react";

type BreathingPhase = "inhale" | "hold" | "exhale" | "hold-empty";

interface BreathingCircleProps {
  phase: BreathingPhase;
  isActive: boolean;
  onToggle: () => void;
}

export const BreathingCircle = ({ phase, isActive, onToggle }: BreathingCircleProps) => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!isActive) {
      setScale(1);
      return;
    }

    switch (phase) {
      case "inhale":
        setScale(1.3);
        break;
      case "hold":
        setScale(1.3);
        break;
      case "exhale":
        setScale(0.7);
        break;
      case "hold-empty":
        setScale(0.7);
        break;
      default:
        setScale(1);
    }
  }, [phase, isActive]);

  const getPhaseText = () => {
    switch (phase) {
      case "inhale":
        return "Breathe In";
      case "hold":
        return "Hold";
      case "exhale":
        return "Breathe Out";
      case "hold-empty":
        return "Hold";
      default:
        return "Ready";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <h2 className="text-2xl md:text-3xl font-light tracking-wide text-foreground/90 min-h-[40px]">
        {isActive ? getPhaseText() : "Ready to Begin"}
      </h2>
      
      <div 
        className="relative flex items-center justify-center w-full max-w-[280px] md:max-w-[320px] aspect-square cursor-pointer group"
        onClick={onToggle}
      >
        {/* Wave ripples */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, hsl(var(--secondary) / 0.2) 50%, transparent 70%)',
            transform: `scale(${scale * 1.3})`,
            transition: 'transform 4s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: isActive ? 1 : 0.5,
          }}
        />
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(var(--secondary) / 0.2) 0%, transparent 60%)',
            transform: `scale(${scale * 1.15})`,
            transition: 'transform 4s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: isActive ? 0.8 : 0.4,
            transitionDelay: '0.3s',
          }}
        />
        
        {/* Main breathing circle with wave effect */}
        <div 
          className="relative w-full h-full rounded-full flex items-center justify-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary) / 0.6), hsl(var(--secondary) / 0.6))',
            transform: `scale(${scale})`,
            transition: 'transform 4s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 0 40px hsl(var(--primary) / 0.4), 0 0 60px hsl(var(--secondary) / 0.25), inset 0 0 30px hsl(var(--primary) / 0.2)',
          }}
        >
          {/* Wave effect overlay */}
          <div 
            className="absolute inset-0 opacity-50"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 30%, hsl(var(--primary) / 0.3) 60%, transparent 90%)',
              animation: isActive ? 'wave 4s ease-in-out infinite' : 'none',
            }}
          />
          
          {/* Inner circle */}
          <div className="relative w-[85%] h-[85%] rounded-full bg-background/5 backdrop-blur-sm border border-foreground/5 flex items-center justify-center">
            {!isActive && (
              <span className="text-sm text-foreground/60 group-hover:text-foreground/80 transition-colors">
                Tap to begin
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
