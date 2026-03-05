'use client';

import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Menu } from 'lucide-react';
import { useState } from 'react';
import { NotificationsDropdown } from '@/components/layout/notifications_dropdown';

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

        {/* Right: search, notifications, avatar */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Search */}
          {/* Search — hidden until functionality is implemented */}

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
  );
}
