// src/components/layout/Header.tsx

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { NotificationsDropdown } from './notifications_dropdown';
import { MessagesDropdown } from './messages_dropdown';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  User,
  Menu,
  X,
  LogOut,
  Settings
} from 'lucide-react';

// MDI icon paths (Material Design Icons)
const MDI_ICONS = {
  viewDashboard: 'M19,5V7H15V5H19M9,5V11H5V5H9M19,13V19H15V13H19M9,17V19H5V17H9M21,3H13V9H21V3M11,3H3V13H11V3M21,11H13V21H21V11M11,15H3V21H11V15Z',
  dumbbell: 'M20.57,14.86L22,13.43L20.57,12L17,15.57L8.43,7L12,3.43L10.57,2L9.14,3.43L7.71,2L5.57,4.14L4.14,2.71L2.71,4.14L4.14,5.57L2,7.71L3.43,9.14L2,10.57L3.43,12L7,8.43L15.57,17L12,20.57L13.43,22L14.86,20.57L16.29,22L18.43,19.86L19.86,21.29L21.29,19.86L19.86,18.43L22,16.29L20.57,14.86Z',
  clipboardCheck: 'M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M12,3A1,1 0 0,1 13,4A1,1 0 0,1 12,5A1,1 0 0,1 11,4A1,1 0 0,1 12,3M7,7H17V5H19V19H5V5H7V7M7.5,13.5L9,12L11,14L15.5,9.5L17,11L11,17L7.5,13.5Z',
  accountGroup: 'M12,5A3.5,3.5 0 0,0 8.5,8.5A3.5,3.5 0 0,0 12,12A3.5,3.5 0 0,0 15.5,8.5A3.5,3.5 0 0,0 12,5M12,7A1.5,1.5 0 0,1 13.5,8.5A1.5,1.5 0 0,1 12,10A1.5,1.5 0 0,1 10.5,8.5A1.5,1.5 0 0,1 12,7M5.5,8A2.5,2.5 0 0,0 3,10.5C3,11.44 3.53,12.25 4.29,12.68C4.65,12.88 5.06,13 5.5,13C5.94,13 6.35,12.88 6.71,12.68C7.08,12.47 7.39,12.17 7.62,11.81C6.89,10.86 6.5,9.7 6.5,8.5C6.5,8.41 6.5,8.31 6.5,8.22C6.2,8.08 5.86,8 5.5,8M18.5,8C18.14,8 17.8,8.08 17.5,8.22C17.5,8.31 17.5,8.41 17.5,8.5C17.5,9.7 17.11,10.86 16.38,11.81C16.5,12 16.63,12.15 16.78,12.3C16.94,12.45 17.1,12.58 17.29,12.68C17.65,12.88 18.06,13 18.5,13C18.94,13 19.35,12.88 19.71,12.68C20.47,12.25 21,11.44 21,10.5A2.5,2.5 0 0,0 18.5,8M12,14C9.66,14 5,15.17 5,17.5V19H19V17.5C19,15.17 14.34,14 12,14M4.71,14.55C2.78,14.78 0,15.76 0,17.5V19H3V17.07C3,16.06 3.69,15.22 4.71,14.55M19.29,14.55C20.31,15.22 21,16.06 21,17.07V19H24V17.5C24,15.76 21.22,14.78 19.29,14.55M12,16C13.53,16 15.24,16.5 16.23,17H7.77C8.76,16.5 10.47,16 12,16Z',
  compass: 'M7,17L10.2,10.2L17,7L13.8,13.8L7,17M12,11.1A0.9,0.9 0 0,0 11.1,12A0.9,0.9 0 0,0 12,12.9A0.9,0.9 0 0,0 12.9,12A0.9,0.9 0 0,0 12,11.1M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4Z',
  runFast: 'M16.5,5.5A2,2 0 0,0 18.5,3.5A2,2 0 0,0 16.5,1.5A2,2 0 0,0 14.5,3.5A2,2 0 0,0 16.5,5.5M12.9,19.4L13.9,15L16,17V23H18V15.5L15.9,13.5L16.5,10.5C17.89,12.09 19.89,13 22,13V11C20.24,11.03 18.6,10.11 17.7,8.6L16.7,7C16.34,6.4 15.7,6 15,6C14.7,6 14.5,6.1 14.2,6.1L9,8.3V13H11V9.6L12.8,8.9L11.2,17L6.3,16L5.9,18L12.9,19.4M4,9A1,1 0 0,1 3,8A1,1 0 0,1 4,7H7V9H4M5,5A1,1 0 0,1 4,4A1,1 0 0,1 5,3H10V5H5M3,13A1,1 0 0,1 2,12A1,1 0 0,1 3,11H7V13H3Z',
  handshake: 'M21.71 8.71C22.96 7.46 22.39 6 21.71 5.29L18.71 2.29C17.45 1.04 16 1.61 15.29 2.29L13.59 4H11C9.1 4 8 5 7.44 6.15L3 10.59V14.59L2.29 15.29C1.04 16.55 1.61 18 2.29 18.71L5.29 21.71C5.83 22.25 6.41 22.45 6.96 22.45C7.67 22.45 8.32 22.1 8.71 21.71L11.41 19H15C16.7 19 17.56 17.94 17.87 16.9C19 16.6 19.62 15.74 19.87 14.9C21.42 14.5 22 13.03 22 12V9H21.41L21.71 8.71M20 12C20 12.45 19.81 13 19 13L18 13L18 14C18 14.45 17.81 15 17 15L16 15L16 16C16 16.45 15.81 17 15 17H10.59L7.31 20.28C7 20.57 6.82 20.4 6.71 20.29L3.72 17.31C3.43 17 3.6 16.82 3.71 16.71L5 15.41V11.41L7 9.41V11C7 12.21 7.8 14 10 14S13 12.21 13 11H20V12M20.29 7.29L18.59 9H11V11C11 11.45 10.81 12 10 12S9 11.45 9 11V8C9 7.54 9.17 6 11 6H14.41L16.69 3.72C17 3.43 17.18 3.6 17.29 3.71L20.28 6.69C20.57 7 20.4 7.18 20.29 7.29Z',
};

// MDI Icon wrapper component
function MdiIcon({ path, size = 1 }: { path: string; size?: number }) {
  return (
    <svg
      width={size * 24}
      height={size * 24}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d={path} />
    </svg>
  );
}

interface HeaderProps {
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role: string;
    status?: string;
    reputationScore?: number;
    warningCount?: number;
    trainerVerified?: boolean;
    suspendedUntil?: Date | null;
    isSafe?: boolean;
  } | undefined;
}

export default function Header({ user }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [user_stats, set_user_stats] = useState<{
    total_xp: number;
    level: number;
    xp_to_next_level: number;
    current_level_xp: number;
  } | null>(null);

  useEffect(() => {
    if (user?.id) {
      load_user_stats();
    }
  }, [user]);

  async function load_user_stats() {
    try {
      const response = await fetch('/api/profile/stats');
      if (!response.ok) {
        console.log('Profile stats API not available');
        return;
      }
      const data = await response.json();
      set_user_stats(data.stats);
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  }

  return (
    <TooltipProvider>
      <header className="bg-brand-secondary shadow-sm border-b border-brand-primary-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3">
                <div className="relative w-10 h-10">
                  <Image
                    src="/massimino_logo.png"
                    alt="Massimino Logo"
                    fill
                    sizes="40px"
                    className="object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-brand-primary">Massimino</h1>
                  <p className="text-xs text-brand-primary-light">Safe Workouts for Everyone</p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard"
                    className="p-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 hover:scale-110 active:scale-95"
                  >
                    <MdiIcon path={MDI_ICONS.viewDashboard} size={0.83} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Dashboard</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/workout-log"
                    className="p-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 hover:scale-110 active:scale-95"
                  >
                    <MdiIcon path={MDI_ICONS.dumbbell} size={0.83} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Workout Log</p>
                </TooltipContent>
              </Tooltip>

              {/* Assessments link - only for trainers and admins */}
              {(user?.role === 'TRAINER' || user?.role === 'ADMIN') && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/assessments"
                      className="p-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 hover:scale-110 active:scale-95"
                    >
                    <MdiIcon path={MDI_ICONS.clipboardCheck} size={0.83} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Assessments</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {/* Teams link - different tooltips for different roles */}
              {user?.role === 'TRAINER' ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/dashboard"
                      className="p-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 hover:scale-110 active:scale-95"
                    >
                    <MdiIcon path={MDI_ICONS.accountGroup} size={0.83} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Manage Teams</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href="/teams/discover"
                      className="p-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 hover:scale-110 active:scale-95"
                    >
                      <MdiIcon path={MDI_ICONS.accountGroup} size={0.83} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Join Teams</p>
                  </TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/massiminos"
                    className="p-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 hover:scale-110 active:scale-95"
                  >
                    <MdiIcon path={MDI_ICONS.compass} size={0.83} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Discover</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/exercises"
                    className="p-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 hover:scale-110 active:scale-95"
                  >
                    <MdiIcon path={MDI_ICONS.runFast} size={0.83} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Exercises</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/partnerships"
                    className="p-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 hover:scale-110 active:scale-95"
                  >
                    <MdiIcon path={MDI_ICONS.handshake} size={0.83} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Partnerships</p>
                </TooltipContent>
              </Tooltip>
            </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Notifications */}
                <NotificationsDropdown userId={user.id} />

                {/* Messages */}
                <MessagesDropdown userId={user.id} />

                {/* XP Progress Bar */}
                {user_stats && (
                  <div className="hidden md:flex items-center gap-3 mr-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Level {user_stats.level}</p>
                      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                          style={{
                            width: `${(user_stats.current_level_xp / user_stats.xp_to_next_level) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-sm font-semibold text-blue-600">
                      {user_stats.current_level_xp}/{user_stats.xp_to_next_level} XP
                    </div>
                  </div>
                )}

                {/* Profile Dropdown */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2"
                  >
                    {user.image && !avatarError ? (
                      <Image
                        src={user.image}
                        alt={user.name || 'User'}
                        width={32}
                        height={32}
                        className="rounded-full"
                        referrerPolicy="no-referrer"
                        onError={() => setAvatarError(true)}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                    <span className="hidden sm:block text-sm font-medium">
                      {user.name || user.email}
                    </span>
                  </Button>

                  {/* Profile Dropdown Menu */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User className="h-4 w-4 mr-3" />
                        Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-3" />
                        Settings
                      </Link>
                      <hr className="my-1" />
                      <button
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          signOut({ callbackUrl: '/' });
                          setIsProfileOpen(false);
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-brand-primary-dark">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 active:scale-95"
                onClick={() => setIsMenuOpen(false)}
              >
                <MdiIcon path={MDI_ICONS.viewDashboard} size={0.8} />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/workout-log"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 active:scale-95"
                onClick={() => setIsMenuOpen(false)}
              >
                <MdiIcon path={MDI_ICONS.dumbbell} size={0.8} />
                <span>Workout Log</span>
              </Link>

              {/* Assessments link in mobile menu - only for trainers and admins */}
              {(user?.role === 'TRAINER' || user?.role === 'ADMIN') && (
                <Link
                  href="/assessments"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 active:scale-95"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MdiIcon path={MDI_ICONS.clipboardCheck} size={0.8} />
                  <span>Assessments</span>
                </Link>
              )}

              {/* Teams link in mobile menu */}
              {user?.role === 'TRAINER' ? (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 active:scale-95"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MdiIcon path={MDI_ICONS.accountGroup} size={0.8} />
                  <span>Manage Teams</span>
                </Link>
              ) : (
                <Link
                  href="/teams/discover"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 active:scale-95"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MdiIcon path={MDI_ICONS.accountGroup} size={0.8} />
                  <span>Join Teams</span>
                </Link>
              )}

              <Link
                href="/massiminos"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 active:scale-95"
                onClick={() => setIsMenuOpen(false)}
              >
                <MdiIcon path={MDI_ICONS.compass} size={0.8} />
                <span>Discover</span>
              </Link>

              <Link
                href="/exercises"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 active:scale-95"
                onClick={() => setIsMenuOpen(false)}
              >
                <MdiIcon path={MDI_ICONS.runFast} size={0.8} />
                <span>Exercises</span>
              </Link>
              <Link
                href="/partnerships"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 active:scale-95"
                onClick={() => setIsMenuOpen(false)}
              >
                <MdiIcon path={MDI_ICONS.handshake} size={0.8} />
                <span>Partnerships</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  </TooltipProvider>
  );
}
