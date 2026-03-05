'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, Bell, Shield, Ruler, Check, Loader2, RotateCcw } from 'lucide-react';

type SettingsTab = 'profile' | 'notifications' | 'privacy' | 'preferences';

const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Privacy', icon: Shield },
  { id: 'preferences', label: 'Preferences', icon: Ruler },
];

interface SafetySettings {
  profileVisibility: string;
  allowDirectMessages: boolean;
  allowTrainerMessages: boolean;
  allowGroupMessages: boolean;
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  autoBlockFlaggedUsers: boolean;
  requireVerifiedTrainers: boolean;
  contentFilterStrength: string;
  safetyAlerts: boolean;
  moderationNotifications: boolean;
}

interface ProfileData {
  name: string;
  email: string;
  trainerBio: string;
}

function Toggle({
  on,
  onChange,
  disabled,
}: {
  on: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      disabled={disabled}
      className={`
        w-11 h-6 rounded-full relative transition-colors flex-shrink-0
        ${on ? 'bg-[#2b5069]' : 'bg-gray-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <span
        className={`
          absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
          ${on ? 'translate-x-[22px]' : 'translate-x-0.5'}
        `}
      />
    </button>
  );
}

function SaveFeedback({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[#4ADE80] font-medium animate-fade-in">
      <Check className="w-3 h-3" /> Saved
    </span>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Profile state
  const [profile, setProfile] = useState<ProfileData>({ name: '', email: '', trainerBio: '' });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<SafetySettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingSaved, setSettingSaved] = useState<string | null>(null);

  // Preferences state (localStorage)
  const [weightUnit, setWeightUnit] = useState('kg');
  const [distanceUnit, setDistanceUnit] = useState('km');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [prefsSaved, setPrefsSaved] = useState(false);

  // Load profile
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setProfile({
              name: data.data.name ?? '',
              email: data.data.email ?? '',
              trainerBio: data.data.trainerBio ?? '',
            });
          }
        }
      } catch {
        // silently fail
      } finally {
        setProfileLoading(false);
      }
    }
    loadProfile();
  }, []);

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings ?? null);
        }
      } catch {
        // silently fail
      } finally {
        setSettingsLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Load preferences from localStorage
  useEffect(() => {
    setWeightUnit(localStorage.getItem('pref_weightUnit') || 'kg');
    setDistanceUnit(localStorage.getItem('pref_distanceUnit') || 'km');
    setDateFormat(localStorage.getItem('pref_dateFormat') || 'DD/MM/YYYY');
  }, []);

  // Save a single setting toggle
  const updateSetting = useCallback(async (key: keyof SafetySettings, value: boolean | string) => {
    if (!settings) return;
    const prev = settings[key];
    setSettings({ ...settings, [key]: value });
    setSettingSaved(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      if (res.ok) {
        setSettingSaved(key);
        setTimeout(() => setSettingSaved(null), 2000);
      } else {
        setSettings({ ...settings, [key]: prev });
      }
    } catch {
      setSettings({ ...settings, [key]: prev });
    }
  }, [settings]);

  // Save profile
  async function saveProfile() {
    setProfileSaving(true);
    setProfileSaved(false);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          trainerBio: profile.trainerBio,
        }),
      });
      if (res.ok) {
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 2000);
      }
    } catch {
      // silently fail
    } finally {
      setProfileSaving(false);
    }
  }

  // Save preferences
  function savePreferences() {
    localStorage.setItem('pref_weightUnit', weightUnit);
    localStorage.setItem('pref_distanceUnit', distanceUnit);
    localStorage.setItem('pref_dateFormat', dateFormat);
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  }

  const notificationItems = [
    { key: 'safetyAlerts' as const, label: 'Workout Reminders', desc: 'Get reminders to log your workouts' },
    { key: 'moderationNotifications' as const, label: 'Progress Updates', desc: 'Get updates about your fitness milestones' },
    { key: 'allowTrainerMessages' as const, label: 'Trainer Messages', desc: 'Allow trainers to send you messages' },
    { key: 'allowGroupMessages' as const, label: 'Group Messages', desc: 'Allow messages from group chats' },
    { key: 'allowDirectMessages' as const, label: 'Direct Messages', desc: 'Allow direct messages from anyone' },
  ];

  const privacyItems = [
    { key: 'showOnlineStatus' as const, label: 'Show Online Status', desc: 'Let others see when you are online' },
    { key: 'showLastSeen' as const, label: 'Show Last Seen', desc: 'Display when you were last active' },
    { key: 'autoBlockFlaggedUsers' as const, label: 'Auto-block Flagged Users', desc: 'Automatically block flagged accounts' },
    { key: 'requireVerifiedTrainers' as const, label: 'Verified Trainers Only', desc: 'Only allow verified trainers to contact you' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 font-display">Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Manage your account and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
        {/* Settings nav */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 h-fit">
          <nav className="flex flex-row md:flex-col gap-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors w-full text-left
                    ${activeTab === t.id
                      ? 'bg-gray-100 text-[#2b5069] font-medium'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }
                  `}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden md:inline">{t.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings content */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {activeTab === 'profile' && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                Profile Information
              </h3>
              {profileLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-10 bg-gray-100 rounded-lg" />
                  <div className="h-10 bg-gray-100 rounded-lg" />
                  <div className="h-20 bg-gray-100 rounded-lg" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:border-[#2b5069] focus:ring-1 focus:ring-[#2b5069]"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-100 text-sm text-gray-500 outline-none cursor-not-allowed"
                      placeholder="your@email.com"
                    />
                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed here.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      rows={3}
                      value={profile.trainerBio}
                      onChange={(e) => setProfile({ ...profile, trainerBio: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:border-[#2b5069] focus:ring-1 focus:ring-[#2b5069] resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={saveProfile}
                      disabled={profileSaving}
                      className="px-4 py-2 bg-[#2b5069] text-white text-sm font-medium rounded-lg hover:bg-[#1e3a4d] transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {profileSaving && <Loader2 className="w-3 h-3 animate-spin" />}
                      Save Changes
                    </button>
                    <SaveFeedback show={profileSaved} />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                Notification Preferences
              </h3>
              {settingsLoading ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center justify-between py-4">
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-100 rounded w-32" />
                        <div className="h-3 bg-gray-100 rounded w-48" />
                      </div>
                      <div className="w-11 h-6 bg-gray-100 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notificationItems.map((n) => (
                    <div key={n.key} className="flex items-center justify-between py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{n.label}</p>
                        <p className="text-xs text-gray-400">{n.desc}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <SaveFeedback show={settingSaved === n.key} />
                        <Toggle
                          on={settings?.[n.key] as boolean ?? false}
                          onChange={(val) => updateSetting(n.key, val)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'privacy' && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                Privacy Settings
              </h3>
              {settingsLoading ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between py-4">
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-100 rounded w-32" />
                        <div className="h-3 bg-gray-100 rounded w-48" />
                      </div>
                      <div className="w-11 h-6 bg-gray-100 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Profile visibility dropdown */}
                  <div className="mb-4 pb-4 border-b border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profile Visibility</label>
                    <select
                      value={settings?.profileVisibility ?? 'PUBLIC'}
                      onChange={(e) => updateSetting('profileVisibility', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:border-[#2b5069]"
                    >
                      <option value="PUBLIC">Public</option>
                      <option value="PRIVATE">Private</option>
                      <option value="TRAINERS_ONLY">Trainers Only</option>
                    </select>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {privacyItems.map((n) => (
                      <div key={n.key} className="flex items-center justify-between py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{n.label}</p>
                          <p className="text-xs text-gray-400">{n.desc}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <SaveFeedback show={settingSaved === n.key} />
                          <Toggle
                            on={settings?.[n.key] as boolean ?? false}
                            onChange={(val) => updateSetting(n.key, val)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'preferences' && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                Units & Preferences
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight Unit</label>
                  <select
                    value={weightUnit}
                    onChange={(e) => setWeightUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:border-[#2b5069]"
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="lbs">Pounds (lbs)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Distance Unit</label>
                  <select
                    value={distanceUnit}
                    onChange={(e) => setDistanceUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:border-[#2b5069]"
                  >
                    <option value="km">Kilometres</option>
                    <option value="miles">Miles</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                  <select
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 outline-none focus:border-[#2b5069]"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={savePreferences}
                    className="px-4 py-2 bg-[#2b5069] text-white text-sm font-medium rounded-lg hover:bg-[#1e3a4d] transition-colors"
                  >
                    Save Preferences
                  </button>
                  <SaveFeedback show={prefsSaved} />
                </div>

                {/* Replay Onboarding Tour */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Onboarding Tour</h4>
                  <p className="text-xs text-gray-400 mb-3">Replay the guided walkthrough of Massimino&apos;s features.</p>
                  <button
                    onClick={() => {
                      localStorage.removeItem('massimino_tour_completed');
                      router.push('/dashboard?tour=replay');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#2b5069] border border-[#2b5069] rounded-lg hover:bg-[#2b5069]/5 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Replay Tour
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
