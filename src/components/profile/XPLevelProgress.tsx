'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/core/utils/common';

// XP thresholds for each level (cumulative)
const LEVEL_THRESHOLDS = [
  0,      // Level 1
  500,    // Level 2
  1500,   // Level 3
  3000,   // Level 4
  5000,   // Level 5
  8000,   // Level 6
  12000,  // Level 7
  17000,  // Level 8
  23000,  // Level 9
  30000,  // Level 10 (Max)
];

const LEVEL_NAMES = [
  'Beginner',
  'Rookie',
  'Amateur',
  'Intermediate',
  'Advanced',
  'Expert',
  'Elite',
  'Champion',
  'Legend',
  'Massimino Master',
];

interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  tier: string;
  iconColour: string;
  earnedAt?: Date;
}

interface XPLevelProgressProps {
  totalXP: number;
  achievements?: Achievement[];
  className?: string;
  showAchievements?: boolean;
  compact?: boolean;
  onLevelClick?: () => void;
}

function calculateLevel(xp: number): { level: number; currentXP: number; nextLevelXP: number; progress: number } {
  let level = 1;

  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }

  const currentLevelThreshold = LEVEL_THRESHOLDS[level - 1];
  const nextLevelThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const xpInCurrentLevel = xp - currentLevelThreshold;
  const xpNeededForNextLevel = nextLevelThreshold - currentLevelThreshold;
  const progress = level >= 10 ? 100 : (xpInCurrentLevel / xpNeededForNextLevel) * 100;

  return {
    level,
    currentXP: xpInCurrentLevel,
    nextLevelXP: xpNeededForNextLevel,
    progress: Math.min(progress, 100),
  };
}

function AnimatedNumber({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    startTime.current = null;

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out quad
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      setDisplayValue(Math.floor(value * easeProgress));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
}

export function XPLevelProgress({
  totalXP,
  achievements = [],
  className,
  showAchievements = true,
  compact = false,
  onLevelClick,
}: XPLevelProgressProps) {
  const { level, currentXP, nextLevelXP, progress } = calculateLevel(totalXP);
  const levelName = LEVEL_NAMES[level - 1] || 'Unknown';
  const isMaxLevel = level >= 10;

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3', className)}>
        <button
          onClick={onLevelClick}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center text-white font-bold text-lg animate-pulse-glow hover:animate-level-up cursor-pointer transition-transform hover:scale-110"
        >
          {level}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">{levelName}</span>
            <span className="text-xs text-gray-500">
              <AnimatedNumber value={totalXP} /> XP
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-primary to-green-500 rounded-full animate-progress-fill animate-gradient-flow"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('hover-lift animate-fade-in-up', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <svg className="w-5 h-5 text-brand-primary animate-sparkle" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
          XP & Level Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Level Badge */}
          <button
            onClick={onLevelClick}
            className="relative flex-shrink-0 group"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-dark flex items-center justify-center text-white font-bold text-2xl animate-float animate-neon-glow cursor-pointer transition-transform group-hover:animate-level-up">
              {level}
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-white px-2 py-0.5 rounded-full shadow-sm border border-gray-200 text-xs font-medium text-brand-primary whitespace-nowrap">
              {levelName}
            </div>
          </button>

          {/* XP Progress */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-gray-900">
                  <AnimatedNumber value={totalXP} />
                </span>
                <span className="text-gray-500 ml-1">XP</span>
              </div>
              {!isMaxLevel && (
                <span className="text-sm text-gray-500">
                  {nextLevelXP - currentXP} XP to Level {level + 1}
                </span>
              )}
              {isMaxLevel && (
                <span className="text-sm text-green-600 font-medium animate-heartbeat">
                  Max Level!
                </span>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-primary via-blue-500 to-green-500 rounded-full animate-progress-fill animate-gradient-flow transition-all duration-500"
                style={{ width: `${progress}%`, animationDelay: '0.3s' }}
              />
            </div>

            {/* XP Breakdown hint */}
            <p className="text-xs text-gray-500">
              Earn XP by completing workouts, logging PRs, and contributing to Fill The Gym
            </p>
          </div>
        </div>

        {/* Achievements Preview */}
        {showAchievements && achievements.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Recent Achievements</span>
              <span className="text-xs text-brand-primary hover:underline cursor-pointer">View all</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {achievements.slice(0, 5).map((achievement, index) => (
                <div
                  key={achievement.id}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold cursor-pointer hover:animate-wiggle animate-achievement-unlock',
                    `stagger-${index + 1}`
                  )}
                  style={{ backgroundColor: achievement.iconColour }}
                  title={`${achievement.name}: ${achievement.description}`}
                >
                  {achievement.tier === 'BRONZE' && 'B'}
                  {achievement.tier === 'SILVER' && 'S'}
                  {achievement.tier === 'GOLD' && 'G'}
                  {achievement.tier === 'DIAMOND' && 'D'}
                </div>
              ))}
              {achievements.length > 5 && (
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium">
                  +{achievements.length - 5}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export helper functions for use elsewhere
export { calculateLevel, LEVEL_THRESHOLDS, LEVEL_NAMES };
