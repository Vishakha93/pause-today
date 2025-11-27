import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

export const FloatingParticles = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const particleCount = 30;
    const newParticles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 6 + 2, // 2-8px
        duration: Math.random() * 25 + 20, // 20-45s
        delay: Math.random() * 10,
      });
    }

    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-float"
          style={{
            left: `${particle.x}%`,
            bottom: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(200,220,255,0.4) 100%)',
            boxShadow: '0 0 10px rgba(255,255,255,0.5)',
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
            opacity: Math.random() * 0.2 + 0.1,
          }}
        />
      ))}
    </div>
  );
};
