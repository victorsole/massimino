'use client';

import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Menu } from 'lucide-react';
import { useState } from 'react';
import { NotificationsDropdown } from '@/components/layout/notifications_dropdown';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// MDI icon paths (Material Design Icons)
const MDI_ICONS = {
  earth: 'M17.9,17.39C17.64,16.59 16.89,16 16,16H15V13A1,1 0 0,0 14,12H8V10H10A1,1 0 0,0 11,9V7H13A2,2 0 0,0 15,5V4.59C17.93,5.77 20,8.64 20,12C20,14.08 19.2,15.97 17.9,17.39M11,19.93C7.05,19.44 4,16.08 4,12C4,11.38 4.08,10.78 4.21,10.21L9,15V16A2,2 0 0,0 11,18M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z',
  viewDashboard: 'M19,5V7H15V5H19M9,5V11H5V5H9M19,13V19H15V13H19M9,17V19H5V17H9M21,3H13V9H21V3M11,3H3V13H11V3M21,11H13V21H21V11M11,15H3V21H11V15Z',
  dumbbell: 'M20.57,14.86L22,13.43L20.57,12L17,15.57L8.43,7L12,3.43L10.57,2L9.14,3.43L7.71,2L5.57,4.14L4.14,2.71L2.71,4.14L4.14,5.57L2,7.71L3.43,9.14L2,10.57L3.43,12L7,8.43L15.57,17L12,20.57L13.43,22L14.86,20.57L16.29,22L18.43,19.86L19.86,21.29L21.29,19.86L19.86,18.43L22,16.29L20.57,14.86Z',
  accountGroup: 'M12,5A3.5,3.5 0 0,0 8.5,8.5A3.5,3.5 0 0,0 12,12A3.5,3.5 0 0,0 15.5,8.5A3.5,3.5 0 0,0 12,5M12,7A1.5,1.5 0 0,1 13.5,8.5A1.5,1.5 0 0,1 12,10A1.5,1.5 0 0,1 10.5,8.5A1.5,1.5 0 0,1 12,7M5.5,8A2.5,2.5 0 0,0 3,10.5C3,11.44 3.53,12.25 4.29,12.68C4.65,12.88 5.06,13 5.5,13C5.94,13 6.35,12.88 6.71,12.68C7.08,12.47 7.39,12.17 7.62,11.81C6.89,10.86 6.5,9.7 6.5,8.5C6.5,8.41 6.5,8.31 6.5,8.22C6.2,8.08 5.86,8 5.5,8M18.5,8C18.14,8 17.8,8.08 17.5,8.22C17.5,8.31 17.5,8.41 17.5,8.5C17.5,9.7 17.11,10.86 16.38,11.81C16.5,12 16.63,12.15 16.78,12.3C16.94,12.45 17.1,12.58 17.29,12.68C17.65,12.88 18.06,13 18.5,13C18.94,13 19.35,12.88 19.71,12.68C20.47,12.25 21,11.44 21,10.5A2.5,2.5 0 0,0 18.5,8M12,14C9.66,14 5,15.17 5,17.5V19H19V17.5C19,15.17 14.34,14 12,14M4.71,14.55C2.78,14.78 0,15.76 0,17.5V19H3V17.07C3,16.06 3.69,15.22 4.71,14.55M19.29,14.55C20.31,15.22 21,16.06 21,17.07V19H24V17.5C24,15.76 21.22,14.78 19.29,14.55M12,16C13.53,16 15.24,16.5 16.23,17H7.77C8.76,16.5 10.47,16 12,16Z',
  compass: 'M7,17L10.2,10.2L17,7L13.8,13.8L7,17M12,11.1A0.9,0.9 0 0,0 11.1,12A0.9,0.9 0 0,0 12,12.9A0.9,0.9 0 0,0 12.9,12A0.9,0.9 0 0,0 12,11.1M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4Z',
  runFast: 'M16.5,5.5A2,2 0 0,0 18.5,3.5A2,2 0 0,0 16.5,1.5A2,2 0 0,0 14.5,3.5A2,2 0 0,0 16.5,5.5M12.9,19.4L13.9,15L16,17V23H18V15.5L15.9,13.5L16.5,10.5C17.89,12.09 19.89,13 22,13V11C20.24,11.03 18.6,10.11 17.7,8.6L16.7,7C16.34,6.4 15.7,6 15,6C14.7,6 14.5,6.1 14.2,6.1L9,8.3V13H11V9.6L12.8,8.9L11.2,17L6.3,16L5.9,18L12.9,19.4M4,9A1,1 0 0,1 3,8A1,1 0 0,1 4,7H7V9H4M5,5A1,1 0 0,1 4,4A1,1 0 0,1 5,3H10V5H5M3,13A1,1 0 0,1 2,12A1,1 0 0,1 3,11H7V13H3Z',
  handshake: 'M21.71 8.71C22.96 7.46 22.39 6 21.71 5.29L18.71 2.29C17.45 1.04 16 1.61 15.29 2.29L13.59 4H11C9.1 4 8 5 7.44 6.15L3 10.59V14.59L2.29 15.29C1.04 16.55 1.61 18 2.29 18.71L5.29 21.71C5.83 22.25 6.41 22.45 6.96 22.45C7.67 22.45 8.32 22.1 8.71 21.71L11.41 19H15C16.7 19 17.56 17.94 17.87 16.9C19 16.6 19.62 15.74 19.87 14.9C21.42 14.5 22 13.03 22 12V9H21.41L21.71 8.71M20 12C20 12.45 19.81 13 19 13L18 13L18 14C18 14.45 17.81 15 17 15L16 15L16 16C16 16.45 15.81 17 15 17H10.59L7.31 20.28C7 20.57 6.82 20.4 6.71 20.29L3.72 17.31C3.43 17 3.6 16.82 3.71 16.71L5 15.41V11.41L7 9.41V11C7 12.21 7.8 14 10 14S13 12.21 13 11H20V12M20.29 7.29L18.59 9H11V11C11 11.45 10.81 12 10 12S9 11.45 9 11V8C9 7.54 9.17 6 11 6H14.41L16.69 3.72C17 3.43 17.18 3.6 17.29 3.71L20.28 6.69C20.57 7 20.4 7.18 20.29 7.29Z',
};

function MdiIcon({ path, size = 1 }: { path: string; size?: number }) {
  return (
    <svg width={size * 24} height={size * 24} viewBox="0 0 24 24" fill="currentColor">
      <path d={path} />
    </svg>
  );
}

interface DashboardHeaderProps {
  onMenuToggle: () => void;
  userName: string;
  userImage: string;
  userId?: string;
}

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  // Dashboard sub-pages
  '/dashboard': { title: 'Dashboard', subtitle: 'Welcome back! Here\'s your fitness overview.' },
  '/dashboard/activity': { title: 'Activity', subtitle: 'Track your daily activities and progress.' },
  '/dashboard/schedule': { title: 'Schedule', subtitle: 'Manage your workout schedule and events.' },
  '/dashboard/workout': { title: 'Workout', subtitle: 'Your training programmes and routines.' },
  '/dashboard/nutrition': { title: 'Nutrition', subtitle: 'Track your meals and nutritional intake.' },
  '/dashboard/statistics': { title: 'Statistics', subtitle: 'Detailed analytics of your fitness journey.' },
  '/dashboard/settings': { title: 'Settings', subtitle: 'Manage your account and preferences.' },
  '/dashboard/athletes': { title: 'My Athletes', subtitle: 'Manage and monitor your athletes.' },
  '/dashboard/business': { title: 'Business', subtitle: 'Business metrics and revenue tracking.' },
  '/dashboard/ai-coach': { title: 'AI Coach', subtitle: 'Chat with your AI fitness assistant.' },
  // App pages
  '/workout-log': { title: 'Workout Log', subtitle: 'Log exercises and track your sessions.' },
  '/exercises': { title: 'Exercises', subtitle: 'Browse exercises by muscle group, equipment, and more.' },
  '/fitness-intelligence': { title: 'Fitness Intelligence', subtitle: 'Data-driven insights for your training.' },
  '/teams/discover': { title: 'Teams', subtitle: 'Discover and join training teams.' },
  '/massiminos': { title: 'Discover', subtitle: 'Find trainers and athletes in the community.' },
  '/messages': { title: 'Messages', subtitle: 'Your conversations and direct messages.' },
  '/community': { title: 'Community', subtitle: 'Connect with the Massimino community.' },
  '/partnerships': { title: 'Partnerships', subtitle: 'Gym partnerships and integrations.' },
  '/profile': { title: 'Profile', subtitle: 'Your profile and personal information.' },
  '/settings': { title: 'Settings', subtitle: 'Manage your account and preferences.' },
  '/my-athletes': { title: 'My Athletes', subtitle: 'Manage and monitor your athletes.' },
  '/assessments': { title: 'Assessments', subtitle: 'Fitness assessments and evaluations.' },
  '/massichat': { title: 'MassiChat', subtitle: 'Chat with your AI fitness assistant.' },
};

export function DashboardHeader({ onMenuToggle, userName, userImage, userId }: DashboardHeaderProps) {
  const pathname = usePathname();
  // Exact match first, then try progressively shorter prefixes for sub-routes
  const page = pageTitles[pathname || ''] || (() => {
    const p = pathname || '';
    const segments = p.split('/').filter(Boolean);
    while (segments.length > 0) {
      const candidate = '/' + segments.join('/');
      if (pageTitles[candidate]) return pageTitles[candidate];
      segments.pop();
    }
    return { title: 'Massimino', subtitle: '' };
  })();

  return (
    <TooltipProvider>
      <header className="sticky top-0 z-30 bg-[#fcfaf5]/90 backdrop-blur-md border-b border-gray-200/50">
        <div className="flex items-center justify-between px-4 sm:px-5 md:px-6 lg:px-8 h-16">
          {/* Left: menu + title */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onMenuToggle}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors md:hidden flex-shrink-0"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-gray-900 truncate">{page.title}</h1>
              <p className="text-xs text-gray-500 hidden sm:block truncate">{page.subtitle}</p>
            </div>
          </div>

          {/* Center: Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/fitness-intelligence" aria-label="Fitness Intelligence" className="p-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 hover:scale-110 active:scale-95">
                  <MdiIcon path={MDI_ICONS.earth} size={0.83} />
                </Link>
              </TooltipTrigger>
              <TooltipContent><p>Fitness Intelligence</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/dashboard" aria-label="Dashboard" className="p-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 hover:scale-110 active:scale-95">
                  <MdiIcon path={MDI_ICONS.viewDashboard} size={0.83} />
                </Link>
              </TooltipTrigger>
              <TooltipContent><p>Dashboard</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/workout-log" aria-label="Workout Log" className="p-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 hover:scale-110 active:scale-95">
                  <MdiIcon path={MDI_ICONS.dumbbell} size={0.83} />
                </Link>
              </TooltipTrigger>
              <TooltipContent><p>Workout Log</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/teams/discover" aria-label="Join Teams" className="p-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 hover:scale-110 active:scale-95">
                  <MdiIcon path={MDI_ICONS.accountGroup} size={0.83} />
                </Link>
              </TooltipTrigger>
              <TooltipContent><p>Join Teams</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/massiminos" aria-label="Discover" className="p-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 hover:scale-110 active:scale-95">
                  <MdiIcon path={MDI_ICONS.compass} size={0.83} />
                </Link>
              </TooltipTrigger>
              <TooltipContent><p>Discover</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/exercises" aria-label="Exercises" className="p-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 hover:scale-110 active:scale-95">
                  <MdiIcon path={MDI_ICONS.runFast} size={0.83} />
                </Link>
              </TooltipTrigger>
              <TooltipContent><p>Exercises</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/partnerships" aria-label="Partnerships" className="p-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 hover:scale-110 active:scale-95">
                  <MdiIcon path={MDI_ICONS.handshake} size={0.83} />
                </Link>
              </TooltipTrigger>
              <TooltipContent><p>Partnerships</p></TooltipContent>
            </Tooltip>
          </nav>

          {/* Right: notifications, avatar */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Notifications */}
            <NotificationsDropdown userId={userId} />

            {/* User avatar */}
            <Link href="/profile" className="w-9 h-9 rounded-full bg-[#2b5069] flex items-center justify-center overflow-hidden ring-2 ring-[#2b5069]/10 hover:ring-[#2b5069]/30 transition-all">
              {userImage ? (
                <Image src={userImage} alt={userName} width={36} height={36} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-semibold text-sm">
                  {userName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
