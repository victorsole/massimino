'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/core/utils/common';
import {
  Zap,
  ClipboardList,
  Calendar,
  TrendingUp,
  MoreHorizontal,
  Dumbbell,
  Scale,
  ListChecks,
  Trophy
} from 'lucide-react';

export type WorkoutTab =
  | 'today'
  | 'my-programs'
  | 'programs'
  | 'athletes'
  | 'history'
  | 'metrics'
  | 'progress'
  | 'habits';

interface TabConfig {
  id: WorkoutTab;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  priority: 'primary' | 'secondary';
}

const TABS: TabConfig[] = [
  { id: 'today', label: 'Today', shortLabel: 'Today', icon: Zap, priority: 'primary' },
  { id: 'my-programs', label: 'My Programs', shortLabel: 'Programs', icon: ClipboardList, priority: 'primary' },
  { id: 'history', label: 'History', shortLabel: 'History', icon: Calendar, priority: 'primary' },
  { id: 'progress', label: 'Progress', shortLabel: 'Progress', icon: TrendingUp, priority: 'primary' },
  { id: 'programs', label: 'Browse Programs', shortLabel: 'Browse', icon: Dumbbell, priority: 'secondary' },
  { id: 'athletes', label: 'Athletes', shortLabel: 'Athletes', icon: Trophy, priority: 'secondary' },
  { id: 'metrics', label: 'Body Metrics', shortLabel: 'Metrics', icon: Scale, priority: 'secondary' },
  { id: 'habits', label: 'Habits', shortLabel: 'Habits', icon: ListChecks, priority: 'secondary' },
];

interface MobileTabNavProps {
  activeTab: WorkoutTab;
  onTabChange: (tab: WorkoutTab) => void;
  className?: string;
}

export function MobileTabNav({ activeTab, onTabChange, className }: MobileTabNavProps) {
  // Primary tabs shown directly, secondary tabs in "More" menu
  const primaryTabs = TABS.filter(t => t.priority === 'primary');
  const secondaryTabs = TABS.filter(t => t.priority === 'secondary');

  // Check if active tab is a secondary tab
  const isSecondaryActive = secondaryTabs.some(t => t.id === activeTab);

  // State for More dropdown
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    }

    if (moreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside as any);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside as any);
    };
  }, [moreOpen]);

  return (
    <nav
      className={cn(
        'flex justify-between border-t border-gray-100 bg-white',
        className
      )}
    >
      {/* Primary Tabs */}
      {primaryTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => {
              onTabChange(tab.id);
              setMoreOpen(false);
            }}
            className={cn(
              'flex-1 flex flex-col items-center justify-center',
              'px-2 py-2.5',
              'border-b-2 transition-colors duration-200',
              'touch-manipulation', // Optimize for touch
              isActive
                ? 'border-brand-primary bg-brand-secondary/50'
                : 'border-transparent hover:bg-gray-50'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon
              className={cn(
                'w-5 h-5 transition-colors',
                isActive ? 'text-brand-primary' : 'text-gray-400'
              )}
            />
            <span
              className={cn(
                'text-xs mt-1 font-medium transition-colors',
                isActive ? 'text-brand-primary' : 'text-gray-500'
              )}
            >
              {tab.shortLabel}
            </span>
          </button>
        );
      })}

      {/* More Menu for Secondary Tabs */}
      <div className="relative flex-1" ref={moreRef}>
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className={cn(
            'w-full flex flex-col items-center justify-center',
            'px-2 py-2.5',
            'border-b-2 transition-colors duration-200',
            'touch-manipulation',
            isSecondaryActive || moreOpen
              ? 'border-brand-primary bg-brand-secondary/50'
              : 'border-transparent hover:bg-gray-50'
          )}
          aria-haspopup="true"
          aria-expanded={moreOpen}
        >
          <MoreHorizontal
            className={cn(
              'w-5 h-5 transition-colors',
              isSecondaryActive || moreOpen ? 'text-brand-primary' : 'text-gray-400'
            )}
          />
          <span
            className={cn(
              'text-xs mt-1 font-medium transition-colors',
              isSecondaryActive || moreOpen ? 'text-brand-primary' : 'text-gray-500'
            )}
          >
            More
          </span>
        </button>

        {/* Dropdown Menu */}
        {moreOpen && (
          <div
            className={cn(
              'absolute right-0 top-full mt-1 z-50',
              'bg-white rounded-lg shadow-lg border border-gray-100',
              'min-w-[180px] py-1'
            )}
          >
            {secondaryTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    onTabChange(tab.id);
                    setMoreOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3',
                    'text-left transition-colors',
                    'touch-manipulation',
                    isActive
                      ? 'bg-brand-secondary text-brand-primary'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <Icon className={cn('w-5 h-5', isActive ? 'text-brand-primary' : 'text-gray-400')} />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}

// Desktop version - full tab bar (for larger screens)
export function DesktopTabNav({ activeTab, onTabChange, className }: MobileTabNavProps) {
  return (
    <nav
      className={cn(
        'border-b border-gray-200',
        '-mb-px flex space-x-6 overflow-x-auto',
        className
      )}
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
              'transition-colors duration-200',
              isActive
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="inline h-4 w-4 mr-2" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

// Responsive wrapper that switches between mobile and desktop
interface ResponsiveTabNavProps extends MobileTabNavProps {
  breakpoint?: 'sm' | 'md' | 'lg';
}

export function ResponsiveTabNav({
  activeTab,
  onTabChange,
  className,
  breakpoint = 'md'
}: ResponsiveTabNavProps) {
  const breakpointClasses = {
    sm: { mobile: 'sm:hidden', desktop: 'hidden sm:flex' },
    md: { mobile: 'md:hidden', desktop: 'hidden md:flex' },
    lg: { mobile: 'lg:hidden', desktop: 'hidden lg:flex' },
  };

  return (
    <>
      {/* Mobile Navigation */}
      <MobileTabNav
        activeTab={activeTab}
        onTabChange={onTabChange}
        className={cn(breakpointClasses[breakpoint].mobile, className)}
      />

      {/* Desktop Navigation */}
      <DesktopTabNav
        activeTab={activeTab}
        onTabChange={onTabChange}
        className={cn(breakpointClasses[breakpoint].desktop, className)}
      />
    </>
  );
}
