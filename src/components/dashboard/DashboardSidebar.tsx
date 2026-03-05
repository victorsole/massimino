'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Activity,
  Calendar,
  Timer,
  UtensilsCrossed,
  BarChart3,
  Settings,
  Users,
  DollarSign,
  MessageCircle,
  Dumbbell,
  Search,
  Globe,
  HeartHandshake,
  Compass,
  Mail,
  ClipboardList,
} from 'lucide-react';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  userRole?: string;
  userName: string;
  userImage: string;
}

const dashboardItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/activity', label: 'Activity', icon: Activity },
  { href: '/dashboard/schedule', label: 'Schedule', icon: Calendar },
  { href: '/dashboard/workout', label: 'Workout', icon: Timer },
  { href: '/dashboard/nutrition', label: 'Nutrition', icon: UtensilsCrossed },
  { href: '/dashboard/statistics', label: 'Statistics', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const appItems = [
  { href: '/workout-log', label: 'Workout Log', icon: Dumbbell, tourId: 'sidebar-workout' },
  { href: '/exercises', label: 'Exercises', icon: Search },
  { href: '/fitness-intelligence', label: 'Fitness Intel', icon: Globe },
  { href: '/teams/discover', label: 'Teams', icon: Users },
  { href: '/massiminos', label: 'Discover', icon: Compass },
  { href: '/messages', label: 'Messages', icon: Mail },
  { href: '/community', label: 'Community', icon: ClipboardList },
  { href: '/partnerships', label: 'Partnerships', icon: HeartHandshake },
];

const trainerItems = [
  { href: '/dashboard/athletes', label: 'My Athletes', icon: Users },
  { href: '/dashboard/business', label: 'Business', icon: DollarSign },
  { href: '/dashboard/ai-coach', label: 'AI Coach', icon: MessageCircle },
];

export function DashboardSidebar({ open, onClose, userRole, userName, userImage }: SidebarProps) {
  const pathname = usePathname();
  const isTrainer = userRole === 'trainer' || userRole === 'admin' || userRole === 'TRAINER' || userRole === 'ADMIN';

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href.startsWith('/dashboard/')) return pathname?.startsWith(href);
    // For app-level pages, match exact or sub-paths
    return pathname === href || pathname?.startsWith(href + '/');
  };

  return (
    <aside
      className={`
        fixed top-0 left-0 h-screen bg-[#2b5069] z-50 flex flex-col overflow-y-auto
        transition-all duration-300 ease-in-out font-sans
        lg:w-[200px] lg:translate-x-0
        md:w-[70px] md:translate-x-0
        ${open ? 'w-[240px] translate-x-0' : 'w-[240px] -translate-x-full md:translate-x-0'}
      `}
    >
      {/* Logo */}
      <div className="p-5 md:p-3 lg:p-5 mb-2">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
            <Image src="/massimino_logo.png" alt="Massimino" width={32} height={32} className="object-contain" />
          </div>
          <span className={`text-white font-semibold text-lg tracking-tight ${open ? 'block' : 'hidden'} md:hidden lg:block`}>
            Massimino
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 md:px-2 lg:px-3">
        {/* Dashboard section */}
        <ul className="flex flex-col gap-0.5">
          {dashboardItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  title={item.label}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-200 relative group
                    md:justify-center lg:justify-start
                    ${active
                      ? 'text-white bg-white/15 shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white rounded-r" />
                  )}
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className={`${open ? 'block' : 'hidden'} md:hidden lg:block`}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Trainer section */}
        {isTrainer && (
          <>
            <div className="my-3 border-t border-white/10" />
            <p className={`px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40 ${open ? 'block' : 'hidden'} md:hidden lg:block`}>
              Trainer
            </p>
            <ul className="flex flex-col gap-0.5">
              {trainerItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      title={item.label}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                        transition-all duration-200 relative
                        md:justify-center lg:justify-start
                        ${active
                          ? 'text-white bg-white/15 shadow-sm'
                          : 'text-white/60 hover:text-white hover:bg-white/10'
                        }
                      `}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-white rounded-r" />
                      )}
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className={`${open ? 'block' : 'hidden'} md:hidden lg:block`}>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {/* App pages section */}
        <div className="my-3 border-t border-white/10" />
        <p className={`px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40 ${open ? 'block' : 'hidden'} md:hidden lg:block`}>
          Explore
        </p>
        <ul className="flex flex-col gap-0.5">
          {appItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  title={item.label}
                  {...('tourId' in item && item.tourId ? { 'data-tour': item.tourId } : {})}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium
                    transition-all duration-200 relative
                    md:justify-center lg:justify-start
                    ${active
                      ? 'text-white bg-white/15 shadow-sm'
                      : 'text-white/50 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className={`${open ? 'block' : 'hidden'} md:hidden lg:block`}>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section at bottom */}
      <div className="p-4 md:p-2 lg:p-4 border-t border-white/10">
        <Link
          href="/profile"
          onClick={onClose}
          data-tour="sidebar-profile"
          className="flex items-center gap-3 md:justify-center lg:justify-start hover:opacity-80 transition-opacity"
        >
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-white/10">
            {userImage ? (
              <Image src={userImage} alt={userName} width={36} height={36} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-semibold text-sm">
                {userName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div className={`${open ? 'block' : 'hidden'} md:hidden lg:block min-w-0`}>
            <p className="text-white text-sm font-medium truncate">{userName}</p>
            {isTrainer && (
              <span className="text-[10px] text-white/50 uppercase tracking-wide font-semibold">Trainer</span>
            )}
          </div>
        </Link>
      </div>
    </aside>
  );
}
