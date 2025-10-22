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
import {
  mdiViewDashboardOutline,
  mdiDumbbell,
  mdiClipboardCheckOutline,
  mdiAccountGroupOutline,
  mdiCompassOutline,
  mdiRunFast,
  mdiHandshakeOutline
} from '@mdi/js';

function Icon({ path, size = 20, className = '' }: { path: string; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d={path} />
    </svg>
  )
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
                    <Icon path={mdiViewDashboardOutline} />
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
                    <Icon path={mdiDumbbell} />
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
                      <Icon path={mdiClipboardCheckOutline} />
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
                      <Icon path={mdiAccountGroupOutline} />
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
                      <Icon path={mdiAccountGroupOutline} />
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
                    <Icon path={mdiCompassOutline} />
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
                    <Icon path={mdiRunFast} />
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
                    <Icon path={mdiHandshakeOutline} />
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
                <Icon path={mdiViewDashboardOutline} />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/workout-log"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 active:scale-95"
                onClick={() => setIsMenuOpen(false)}
              >
                <Icon path={mdiDumbbell} />
                <span>Workout Log</span>
              </Link>

              {/* Assessments link in mobile menu - only for trainers and admins */}
              {(user?.role === 'TRAINER' || user?.role === 'ADMIN') && (
                <Link
                  href="/assessments"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 active:scale-95"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon path={mdiClipboardCheckOutline} />
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
                  <Icon path={mdiAccountGroupOutline} />
                  <span>Manage Teams</span>
                </Link>
              ) : (
                <Link
                  href="/teams/discover"
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 active:scale-95"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon path={mdiAccountGroupOutline} />
                  <span>Join Teams</span>
                </Link>
              )}

              <Link
                href="/massiminos"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 active:scale-95"
                onClick={() => setIsMenuOpen(false)}
              >
                <Icon path={mdiCompassOutline} />
                <span>Discover</span>
              </Link>

              <Link
                href="/exercises"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 active:scale-95"
                onClick={() => setIsMenuOpen(false)}
              >
                <Icon path={mdiRunFast} />
                <span>Exercises</span>
              </Link>
              <Link
                href="/partnerships"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-brand-primary hover:text-brand-primary-dark hover:bg-brand-primary/10 transition-all duration-200 active:scale-95"
                onClick={() => setIsMenuOpen(false)}
              >
                <Icon path={mdiHandshakeOutline} />
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
