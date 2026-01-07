'use client';

import { useEffect, useCallback, useRef } from 'react';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  rotation: number;
  vx: number;
  vy: number;
  opacity: number;
}

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
  colors?: string[];
  particleCount?: number;
  duration?: number;
  spread?: number;
  origin?: { x: number; y: number };
}

const DEFAULT_COLORS = ['#254967', '#50c878', '#feca57', '#ff6b6b', '#48dbfb', '#ff9ff3'];

export function Confetti({
  active,
  onComplete,
  colors = DEFAULT_COLORS,
  particleCount = 50,
  duration = 3000,
  spread = 360,
  origin = { x: 0.5, y: 0.5 },
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const particlesRef = useRef<ConfettiPiece[]>([]);
  const startTimeRef = useRef<number>(0);

  const createParticles = useCallback(() => {
    const particles: ConfettiPiece[] = [];
    const originX = typeof window !== 'undefined' ? window.innerWidth * origin.x : 500;
    const originY = typeof window !== 'undefined' ? window.innerHeight * origin.y : 300;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.random() * spread - spread / 2) * (Math.PI / 180);
      const velocity = 8 + Math.random() * 8;

      particles.push({
        id: i,
        x: originX,
        y: originY,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vx: Math.cos(angle - Math.PI / 2) * velocity,
        vy: Math.sin(angle - Math.PI / 2) * velocity - 5,
        opacity: 1,
      });
    }

    return particles;
  }, [colors, origin, particleCount, spread]);

  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const elapsed = timestamp - startTimeRef.current;
    const progress = elapsed / duration;

    if (progress >= 1) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = [];
      onComplete?.();
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gravity = 0.3;

    particlesRef.current = particlesRef.current.map((particle) => {
      const newVy = particle.vy + gravity;
      const newX = particle.x + particle.vx;
      const newY = particle.y + newVy;
      const newRotation = particle.rotation + 5;
      const newOpacity = Math.max(0, 1 - progress * 1.5);

      return {
        ...particle,
        x: newX,
        y: newY,
        vy: newVy,
        rotation: newRotation,
        opacity: newOpacity,
      };
    });

    particlesRef.current.forEach((particle) => {
      ctx.save();
      ctx.translate(particle.x, particle.y);
      ctx.rotate((particle.rotation * Math.PI) / 180);
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = particle.color;

      // Draw confetti piece (rectangle with slight variation)
      const width = 8 + Math.random() * 4;
      const height = 4 + Math.random() * 2;
      ctx.fillRect(-width / 2, -height / 2, width, height);

      ctx.restore();
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [duration, onComplete]);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create particles
    particlesRef.current = createParticles();
    startTimeRef.current = performance.now();

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active, createParticles, animate]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}

// Hook for triggering confetti programmatically
export function useConfetti() {
  const triggerRef = useRef<(() => void) | null>(null);

  const trigger = useCallback(() => {
    triggerRef.current?.();
  }, []);

  const setTrigger = useCallback((fn: () => void) => {
    triggerRef.current = fn;
  }, []);

  return { trigger, setTrigger };
}

// Simple confetti burst function for direct use
export function createConfettiBurst(
  x: number,
  y: number,
  options?: {
    colors?: string[];
    particleCount?: number;
    duration?: number;
  }
) {
  const {
    colors = DEFAULT_COLORS,
    particleCount = 30,
    duration = 2000,
  } = options || {};

  const particles: HTMLDivElement[] = [];

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: 10px;
      height: 10px;
      background-color: ${colors[Math.floor(Math.random() * colors.length)]};
      pointer-events: none;
      z-index: 9999;
      border-radius: 2px;
    `;
    document.body.appendChild(particle);
    particles.push(particle);

    const angle = (Math.random() * 360) * (Math.PI / 180);
    const velocity = 100 + Math.random() * 200;
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity - 200;

    let posX = x;
    let posY = y;
    let opacity = 1;
    let rotation = 0;
    const gravity = 400;
    const startTime = performance.now();

    const animateParticle = (currentTime: number) => {
      const elapsed = (currentTime - startTime) / 1000;
      posX = x + vx * elapsed;
      posY = y + vy * elapsed + 0.5 * gravity * elapsed * elapsed;
      opacity = Math.max(0, 1 - (elapsed * 1000) / duration);
      rotation += 10;

      particle.style.left = `${posX}px`;
      particle.style.top = `${posY}px`;
      particle.style.opacity = String(opacity);
      particle.style.transform = `rotate(${rotation}deg)`;

      if (opacity > 0) {
        requestAnimationFrame(animateParticle);
      } else {
        particle.remove();
      }
    };

    requestAnimationFrame(animateParticle);
  }
}
