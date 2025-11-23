import { useEffect, useState } from "react";

type BreathingPhase = "inhale" | "hold" | "exhale" | "hold-empty";

interface BreathingCircleProps {
  phase: BreathingPhase;
  isActive: boolean;
}

export const BreathingCircle = ({ phase, isActive }: BreathingCircleProps) => {
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
      
      <div className="relative flex items-center justify-center w-full max-w-[280px] md:max-w-[320px] aspect-square">
        {/* Outer glow ring */}
        <div 
          className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 blur-2xl"
          style={{
            transform: `scale(${scale * 1.2})`,
            transition: 'transform 4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        
        {/* Main breathing circle */}
        <div 
          className="relative w-full h-full rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center"
          style={{
            transform: `scale(${scale})`,
            transition: 'transform 4s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 0 40px hsl(var(--primary) / 0.5), 0 0 60px hsl(var(--secondary) / 0.3)',
          }}
        >
          {/* Inner circle */}
          <div className="w-[85%] h-[85%] rounded-full bg-background/10 backdrop-blur-sm" />
        </div>
      </div>
    </div>
  );
};
