import { useEffect, useState } from "react";

interface Orb {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
}

export const BackgroundOrbs = () => {
  const [orbs, setOrbs] = useState<Orb[]>([]);

  useEffect(() => {
    const colors = [
      'hsl(210, 80%, 65%)',  // primary blue
      'hsl(260, 60%, 70%)',  // secondary purple
      'hsl(180, 70%, 60%)',  // teal
      'hsl(240, 70%, 65%)',  // blue-purple
    ];

    const newOrbs: Orb[] = [];
    for (let i = 0; i < 4; i++) {
      newOrbs.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 100 + 200, // 200-300px
        color: colors[i],
        duration: Math.random() * 20 + 30, // 30-50s
        delay: Math.random() * 10,
      });
    }

    setOrbs(newOrbs);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="absolute rounded-full animate-drift"
          style={{
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            background: orb.color,
            filter: 'blur(100px)',
            opacity: 0.08,
            animationDuration: `${orb.duration}s`,
            animationDelay: `${orb.delay}s`,
          }}
        />
      ))}
    </div>
  );
};
