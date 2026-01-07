'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/core/utils/common';

export type ProfileTab = 'overview' | 'credentials' | 'media' | 'settings' | 'business';

interface ProfileHeaderProps {
  title?: string;
  subtitle?: string;
  role: string;
  isTrainer?: boolean;
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  onPreview?: (viewAs: 'anonymous' | 'athlete' | 'trainer') => void;
}

export function ProfileHeader({
  title = 'Profile',
  subtitle = 'Manage your account and trainer status',
  role,
  isTrainer = false,
  activeTab,
  onTabChange,
  onPreview,
}: ProfileHeaderProps) {
  const [showPreviewDropdown, setShowPreviewDropdown] = useState(false);

  const tabs: { id: ProfileTab; label: string; trainerOnly?: boolean }[] = [
    { id: 'overview', label: 'General' },
    { id: 'credentials', label: 'Credentials' },
    { id: 'media', label: 'Media' },
    { id: 'settings', label: 'Settings' },
    { id: 'business', label: 'Business', trainerOnly: true },
  ];

  const filteredTabs = tabs.filter(tab => !tab.trainerOnly || isTrainer);

  const formatRole = (role: string) => {
    if (role === 'TRAINER') return 'Trainer';
    if (role === 'CLIENT') return 'Athlete';
    if (role === 'ADMIN') return 'Admin';
    return role;
  };

  return (
    <div className="space-y-4">
      {/* Header Row */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-gray-500 hover:text-gray-700">
              <span className="mdi mdi-chevron-left text-xl" />
            </a>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              <p className="text-sm text-gray-600">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Role Badge */}
            <Badge
              variant={isTrainer ? 'default' : 'secondary'}
              className={cn(
                'text-sm px-3 py-1 flex items-center gap-1',
                isTrainer && 'bg-green-100 text-green-700 hover:bg-green-100'
              )}
            >
              {formatRole(role)}
              {isTrainer && (
                <span className="mdi mdi-check-decagram text-green-600" />
              )}
            </Badge>

            {/* Preview Dropdown */}
            {onPreview && (
              <div className="relative">
                <button
                  onClick={() => setShowPreviewDropdown(!showPreviewDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <span className="mdi mdi-eye" />
                  Preview
                  <span className="mdi mdi-chevron-down" />
                </button>

                {showPreviewDropdown && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowPreviewDropdown(false)}
                    />
                    {/* Dropdown */}
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs text-gray-500 uppercase font-medium">
                          Preview your public profile as:
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          onPreview('anonymous');
                          setShowPreviewDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <div className="font-medium">Anonymous Visitor</div>
                        <div className="text-xs text-gray-500">
                          Someone not logged into Massimino
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          onPreview('athlete');
                          setShowPreviewDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <div className="font-medium">An Athlete</div>
                        <div className="text-xs text-gray-500">
                          A logged-in athlete viewing your profile
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          onPreview('trainer');
                          setShowPreviewDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <div className="font-medium">Another Trainer</div>
                        <div className="text-xs text-gray-500">
                          A fellow trainer viewing your profile
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-max">
          {filteredTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'text-brand-primary border-brand-primary'
                  : 'text-gray-500 hover:text-gray-700 border-transparent'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
