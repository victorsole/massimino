'use client';

import { useEffect, useRef, useCallback } from 'react';
import { driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';

const STORAGE_KEY = 'massimino_tour_completed';

const allSteps: (DriveStep & { sidebarOnly?: boolean })[] = [
  {
    element: '[data-tour="welcome"]',
    popover: {
      title: 'Welcome to Massimino!',
      description: 'This is your fitness command center. Let us show you around so you can get the most out of the platform.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="stat-cards"]',
    popover: {
      title: 'Stats at a Glance',
      description: 'Track your weekly workouts, average session length, total volume, and current streak — all in one place.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '[data-tour="widgets"]',
    popover: {
      title: 'Activity & Nutrition',
      description: 'Dive into your workout analytics, macro breakdown, and calorie tracking with these interactive charts.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="quick-exercises"]',
    popover: {
      title: 'Exercise Database',
      description: 'Browse hundreds of exercises by muscle group, equipment, and difficulty. Find the perfect exercise for your routine.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="quick-community"]',
    popover: {
      title: 'Community & Teams',
      description: 'Join teams, connect with trainers, and train alongside others. Fitness is better together.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="sidebar-workout"]',
    popover: {
      title: 'Workout Log',
      description: 'Log your workouts, track sets and reps, and follow structured training programs.',
      side: 'right',
      align: 'center',
    },
    sidebarOnly: true,
  },
  {
    element: '[data-tour="sidebar-profile"]',
    popover: {
      title: 'Your Profile',
      description: 'Customize your profile, share your progress, and showcase your fitness journey.',
      side: 'right',
      align: 'center',
    },
    sidebarOnly: true,
  },
];

function isMobile() {
  return typeof window !== 'undefined' && window.innerWidth < 768;
}

function markCompleted() {
  localStorage.setItem(STORAGE_KEY, 'true');
  fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ onboardingCompleted: true }),
  }).catch(() => {});
}

export function useOnboardingTour(forceReplay = false) {
  const tourStarted = useRef(false);

  const startTour = useCallback(() => {
    const steps = isMobile()
      ? allSteps.filter((s) => !s.sidebarOnly)
      : allSteps;

    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      popoverClass: 'massimino-tour-popover',
      steps: steps.map(({ sidebarOnly: _, ...step }) => step),
      onDestroyStarted: () => {
        markCompleted();
        driverObj.destroy();
      },
    });

    driverObj.drive();
  }, []);

  useEffect(() => {
    if (tourStarted.current) return;

    if (forceReplay) {
      tourStarted.current = true;
      const timer = setTimeout(startTour, 800);
      return () => clearTimeout(timer);
    }

    // Check localStorage first (instant)
    if (localStorage.getItem(STORAGE_KEY) === 'true') return;

    // Check API for cross-device sync
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings?.onboardingCompleted) {
          localStorage.setItem(STORAGE_KEY, 'true');
          return;
        }
        // New user — start tour
        tourStarted.current = true;
        setTimeout(startTour, 800);
      })
      .catch(() => {
        // On error, start tour for new users (no localStorage flag)
        tourStarted.current = true;
        setTimeout(startTour, 800);
      });
  }, [forceReplay, startTour]);

  return { startTour };
}
