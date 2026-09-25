import { useEffect, useRef } from 'react';

type ParticlesProps = {
  count?: number;
  color?: string;
  speed?: number;
  interactive?: boolean;
  linkDistance?: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

export default function Particles({
  count = 200,
  color = 'rgba(13, 138, 150, 0.55)',
  speed = 1,
  interactive = true,
  linkDistance = 110,
}: ParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const container = canvas.parentElement;
    if (!context || !container) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let animationFrame = 0;
    let isVisible = true;
    let width = 0;
    let height = 0;
    const pointer = { x: 0, y: 0, active: false };
    const particles: Particle[] = [];

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const seed = () => {
      particles.length = 0;
      for (let index = 0; index < count; index += 1) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = (0.08 + Math.random() * 0.18) * speed;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          radius: 0.8 + Math.random() * 1.5,
        });
      }
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = color;
      context.strokeStyle = color;

      particles.forEach((particle) => {
        if (!reducedMotion) {
          if (interactive && pointer.active) {
            const dx = particle.x - pointer.x;
            const dy = particle.y - pointer.y;
            const distance = Math.hypot(dx, dy);
            if (distance > 0 && distance < 125) {
              const force = ((125 - distance) / 125) * 0.035;
              particle.vx += (dx / distance) * force;
              particle.vy += (dy / distance) * force;
            }
          }
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vx *= 0.995;
          particle.vy *= 0.995;
          if (particle.x < -8) particle.x = width + 8;
          if (particle.x > width + 8) particle.x = -8;
          if (particle.y < -8) particle.y = height + 8;
          if (particle.y > height + 8) particle.y = -8;
        }
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      });

      if (linkDistance > 0) {
        for (let first = 0; first < particles.length; first += 1) {
          for (let second = first + 1; second < particles.length; second += 1) {
            const distance = Math.hypot(
              particles[first].x - particles[second].x,
              particles[first].y - particles[second].y,
            );
            if (distance < linkDistance) {
              context.globalAlpha = (1 - distance / linkDistance) * 0.22;
              context.beginPath();
              context.moveTo(particles[first].x, particles[first].y);
              context.lineTo(particles[second].x, particles[second].y);
              context.stroke();
            }
          }
        }
        context.globalAlpha = 1;
      }
      if (!reducedMotion && isVisible) animationFrame = window.requestAnimationFrame(draw);
    };

    const updatePointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = pointer.x >= 0 && pointer.x <= width && pointer.y >= 0 && pointer.y <= height;
    };
    const clearPointer = () => { pointer.active = false; };
    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible && !reducedMotion) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = window.requestAnimationFrame(draw);
      }
    }, { threshold: 0.05 });

    resize();
    seed();
    draw();
    observer.observe(container);
    window.addEventListener('resize', resize);
    if (interactive) {
      window.addEventListener('pointermove', updatePointer, { passive: true });
      window.addEventListener('pointerout', clearPointer);
    }

    return () => {
      window.cancelAnimationFrame(animationFrame);
      observer.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', updatePointer);
      window.removeEventListener('pointerout', clearPointer);
    };
  }, [color, count, interactive, linkDistance, speed]);

  return <canvas ref={canvasRef} className="particles" aria-hidden="true" />;
}