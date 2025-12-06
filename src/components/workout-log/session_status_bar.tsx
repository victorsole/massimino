'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/core/utils/common';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SessionStatusBarProps {
  sessionId: string;
  startTime: Date;
  onComplete: () => void;
  className?: string;
}

export function SessionStatusBar({
  sessionId,
  startTime,
  onComplete,
  className
}: SessionStatusBarProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Update elapsed time every second
  useEffect(() => {
    const calculateElapsed = () => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setElapsedSeconds(elapsed);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Format elapsed time
  const formatElapsed = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Human readable elapsed time
  const getElapsedLabel = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    if (mins < 1) return 'Just started';
    if (mins === 1) return '1 min ago';
    return `${mins} min ago`;
  };

  return (
    <div
      className={cn(
        'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
        'rounded-xl p-3 shadow-lg',
        'flex items-center justify-between gap-3',
        className
      )}
    >
      {/* Left: Icon + Info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <Zap className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <p className="font-semibold text-sm">Active Session</p>
          <p className="text-xs text-green-100">
            {getElapsedLabel(elapsedSeconds)}
          </p>
        </div>
      </div>

      {/* Right: Timer + Button */}
      <div className="flex items-center gap-3">
        {/* Timer Badge */}
        <div className="bg-white/20 px-3 py-1 rounded-full">
          <span className="font-mono font-semibold tabular-nums">
            {formatElapsed(elapsedSeconds)}
          </span>
        </div>

        {/* Complete Button */}
        <Button
          onClick={onComplete}
          size="sm"
          className="bg-white text-green-600 hover:bg-green-50 font-semibold"
        >
          Finish
        </Button>
      </div>
    </div>
  );
}

// Compact version for header
interface SessionTimerBadgeProps {
  startTime: Date;
  className?: string;
}

export function SessionTimerBadge({ startTime, className }: SessionTimerBadgeProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const calculateElapsed = () => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setElapsedSeconds(elapsed);
    };

    calculateElapsed();
    const interval = setInterval(calculateElapsed, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatElapsed = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        'flex items-center gap-1.5',
        'bg-green-50 text-green-700',
        'px-3 py-1.5 rounded-full',
        'text-sm font-semibold',
        className
      )}
    >
      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      <span className="tabular-nums">{formatElapsed(elapsedSeconds)}</span>
    </div>
  );
}
