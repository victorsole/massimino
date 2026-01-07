'use client';

import { useEffect, useState, useRef } from 'react';
import { cn } from '@/core/utils/common';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  delay?: number;
  onComplete?: () => void;
}

export function AnimatedNumber({
  value,
  duration = 1500,
  className,
  suffix = '',
  prefix = '',
  decimals = 0,
  delay = 0,
  onComplete,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const startTime = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Handle delay
    const delayTimeout = setTimeout(() => {
      setHasStarted(true);
    }, delay);

    return () => clearTimeout(delayTimeout);
  }, [delay]);

  useEffect(() => {
    if (!hasStarted) return;

    startTime.current = null;

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out quad for smooth deceleration
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      const currentValue = value * easeProgress;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration, hasStarted, onComplete]);

  const formattedValue = decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.floor(displayValue).toLocaleString();

  return (
    <span className={cn('tabular-nums', className)}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>
  );
}

// Hook for animating multiple numbers in sequence
export function useAnimatedNumbers(
  values: number[],
  options?: {
    duration?: number;
    staggerDelay?: number;
  }
) {
  const { duration = 1500, staggerDelay = 200 } = options || {};
  const [displayValues, setDisplayValues] = useState<number[]>(values.map(() => 0));
  const [isAnimating, setIsAnimating] = useState(false);

  const start = () => {
    setIsAnimating(true);
    values.forEach((value, index) => {
      setTimeout(() => {
        const startTime = performance.now();

        const animate = (timestamp: number) => {
          const elapsed = timestamp - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeProgress = 1 - (1 - progress) * (1 - progress);
          const currentValue = value * easeProgress;

          setDisplayValues((prev) => {
            const newValues = [...prev];
            newValues[index] = currentValue;
            return newValues;
          });

          if (progress < 1) {
            requestAnimationFrame(animate);
          } else if (index === values.length - 1) {
            setIsAnimating(false);
          }
        };

        requestAnimationFrame(animate);
      }, index * staggerDelay);
    });
  };

  const reset = () => {
    setDisplayValues(values.map(() => 0));
    setIsAnimating(false);
  };

  return {
    displayValues,
    isAnimating,
    start,
    reset,
  };
}
