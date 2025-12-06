'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/core/utils/common';

interface RestTimerOverlayProps {
  isOpen: boolean;
  initialSeconds: number;
  onComplete: () => void;
  onSkip: () => void;
  nextExercise?: {
    name: string;
    weight: string | number;
    reps: number;
  };
}

export function RestTimerOverlay({
  isOpen,
  initialSeconds,
  onComplete,
  onSkip,
  nextExercise
}: RestTimerOverlayProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [isPaused, setIsPaused] = useState(false);

  // Reset timer when opened
  useEffect(() => {
    if (isOpen) {
      setRemainingSeconds(initialSeconds);
      setIsPaused(false);
    }
  }, [isOpen, initialSeconds]);

  // Countdown logic
  useEffect(() => {
    if (!isOpen || isPaused || remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isPaused, remainingSeconds, onComplete]);

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Calculate progress percentage
  const progressPercentage = (remainingSeconds / initialSeconds) * 100;

  // Calculate stroke dashoffset for circular progress
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference * (1 - progressPercentage / 100);

  const adjustTime = (delta: number) => {
    setRemainingSeconds(prev => Math.max(0, prev + delta));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-brand-primary flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
      {/* Timer Label */}
      <p className="text-lg opacity-80 mb-6">Rest Timer</p>

      {/* Large Timer Display */}
      <div className="relative mb-8">
        {/* Circular Progress */}
        <svg className="w-56 h-56 -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        {/* Timer Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-bold tabular-nums">
            {formatTime(remainingSeconds)}
          </span>
          {isPaused && (
            <span className="text-sm opacity-70 mt-2">Paused</span>
          )}
        </div>
      </div>

      {/* Quick Adjust Buttons */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => adjustTime(-30)}
          className="px-6 py-3 bg-white/20 rounded-xl text-sm font-medium touch-manipulation active:bg-white/30 transition-colors"
        >
          −30s
        </button>
        <button
          onClick={onSkip}
          className="px-8 py-3 bg-white text-brand-primary rounded-xl text-sm font-bold touch-manipulation active:bg-gray-100 transition-colors"
        >
          Skip
        </button>
        <button
          onClick={() => adjustTime(30)}
          className="px-6 py-3 bg-white/20 rounded-xl text-sm font-medium touch-manipulation active:bg-white/30 transition-colors"
        >
          +30s
        </button>
      </div>

      {/* Pause/Resume Button */}
      <button
        onClick={() => setIsPaused(!isPaused)}
        className="mb-8 px-6 py-2 bg-white/10 rounded-full text-sm font-medium touch-manipulation active:bg-white/20 transition-colors"
      >
        {isPaused ? 'Resume' : 'Pause'}
      </button>

      {/* Next Exercise Preview */}
      {nextExercise && (
        <div className="absolute bottom-8 left-4 right-4 bg-white/10 rounded-xl p-4 text-center">
          <p className="text-sm opacity-80 mb-1">Up Next</p>
          <p className="font-semibold">
            {nextExercise.name} • {nextExercise.weight}kg × {nextExercise.reps} reps
          </p>
        </div>
      )}
    </div>
  );
}

// Compact version for inline display (sticky bar)
interface RestTimerBarProps {
  remainingSeconds: number;
  totalSeconds: number;
  onSkip: () => void;
  onExpand: () => void;
}

export function RestTimerBarCompact({
  remainingSeconds,
  totalSeconds,
  onSkip,
  onExpand
}: RestTimerBarProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (remainingSeconds / totalSeconds) * 100;

  return (
    <div
      onClick={onExpand}
      className={cn(
        'fixed bottom-20 left-4 right-4 z-40',
        'bg-brand-primary rounded-xl p-3 shadow-lg',
        'flex items-center justify-between gap-3',
        'cursor-pointer touch-manipulation'
      )}
    >
      {/* Progress Bar Background */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <div
          className="h-full bg-brand-primary-light transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Content */}
      <div className="relative flex items-center gap-3 text-white">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-lg tabular-nums">{formatTime(remainingSeconds)}</p>
          <p className="text-xs text-white/70">Rest timer</p>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onSkip();
        }}
        className="relative px-4 py-2 bg-white text-brand-primary rounded-lg text-sm font-semibold touch-manipulation"
      >
        Skip
      </button>
    </div>
  );
}
