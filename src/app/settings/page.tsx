// src/app/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  Shield,
  Eye,
  MessageCircle,
  Lock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

interface Settings {
  allowDirectMessages: boolean;
  allowTrainerMessages: boolean;
  allowGroupMessages: boolean;
  profileVisibility: 'PUBLIC' | 'PRIVATE' | 'TRAINERS_ONLY';
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  autoBlockFlaggedUsers: boolean;
  requireVerifiedTrainers: boolean;
  contentFilterStrength: 'LOW' | 'MEDIUM' | 'HIGH';
  safetyAlerts: boolean;
  moderationNotifications: boolean;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchSettings();
    }
  }, [status, router]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data.settings);
    } catch (err) {
      setError('Failed to load settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof Settings, value: boolean | string) => {
    if (!settings) return;

    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });

      if (!response.ok) throw new Error('Failed to save settings');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      setError('Failed to save settings');
      console.error(err);
      // Revert the change
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Failed to load settings</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/profile"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Profile
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your privacy and notification preferences</p>
      </div>

      {/* Status indicators */}
      {(saving || saveSuccess || error) && (
        <div className="mb-4">
          {saving && (
            <div className="flex items-center gap-2 text-blue-600 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </div>
          )}
          {saveSuccess && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="h-4 w-4" />
              Settings saved
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>
      )}

      <div className="space-y-6">
        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-gray-500" />
              <CardTitle>Privacy</CardTitle>
            </div>
            <CardDescription>Control who can see your profile and activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="profileVisibility" className="font-medium">Profile Visibility</Label>
                <p className="text-sm text-gray-500">Who can view your profile</p>
              </div>
              <Select
                value={settings.profileVisibility}
                onValueChange={(value) => updateSetting('profileVisibility', value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLIC">Public</SelectItem>
                  <SelectItem value="TRAINERS_ONLY">Trainers Only</SelectItem>
                  <SelectItem value="PRIVATE">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="showOnlineStatus" className="font-medium">Show Online Status</Label>
                <p className="text-sm text-gray-500">Let others see when you're online</p>
              </div>
              <Switch
                id="showOnlineStatus"
                checked={settings.showOnlineStatus}
                onCheckedChange={(checked) => updateSetting('showOnlineStatus', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="showLastSeen" className="font-medium">Show Last Seen</Label>
                <p className="text-sm text-gray-500">Let others see when you were last active</p>
              </div>
              <Switch
                id="showLastSeen"
                checked={settings.showLastSeen}
                onCheckedChange={(checked) => updateSetting('showLastSeen', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Messaging Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-gray-500" />
              <CardTitle>Messaging</CardTitle>
            </div>
            <CardDescription>Control who can message you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allowDirectMessages" className="font-medium">Allow Direct Messages</Label>
                <p className="text-sm text-gray-500">Anyone can send you direct messages</p>
              </div>
              <Switch
                id="allowDirectMessages"
                checked={settings.allowDirectMessages}
                onCheckedChange={(checked) => updateSetting('allowDirectMessages', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allowTrainerMessages" className="font-medium">Allow Trainer Messages</Label>
                <p className="text-sm text-gray-500">Trainers can send you messages</p>
              </div>
              <Switch
                id="allowTrainerMessages"
                checked={settings.allowTrainerMessages}
                onCheckedChange={(checked) => updateSetting('allowTrainerMessages', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allowGroupMessages" className="font-medium">Allow Group Messages</Label>
                <p className="text-sm text-gray-500">Receive messages from team and group chats</p>
              </div>
              <Switch
                id="allowGroupMessages"
                checked={settings.allowGroupMessages}
                onCheckedChange={(checked) => updateSetting('allowGroupMessages', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Safety Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-500" />
              <CardTitle>Safety</CardTitle>
            </div>
            <CardDescription>Keep yourself safe from harmful content and users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="autoBlockFlaggedUsers" className="font-medium">Auto-Block Flagged Users</Label>
                <p className="text-sm text-gray-500">Automatically block users flagged for bad behavior</p>
              </div>
              <Switch
                id="autoBlockFlaggedUsers"
                checked={settings.autoBlockFlaggedUsers}
                onCheckedChange={(checked) => updateSetting('autoBlockFlaggedUsers', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="requireVerifiedTrainers" className="font-medium">Require Verified Trainers</Label>
                <p className="text-sm text-gray-500">Only accept coaching from verified trainers</p>
              </div>
              <Switch
                id="requireVerifiedTrainers"
                checked={settings.requireVerifiedTrainers}
                onCheckedChange={(checked) => updateSetting('requireVerifiedTrainers', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="contentFilterStrength" className="font-medium">Content Filter Strength</Label>
                <p className="text-sm text-gray-500">How strictly to filter potentially harmful content</p>
              </div>
              <Select
                value={settings.contentFilterStrength}
                onValueChange={(value) => updateSetting('contentFilterStrength', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-gray-500" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>Choose what notifications you receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="safetyAlerts" className="font-medium">Safety Alerts</Label>
                <p className="text-sm text-gray-500">Get notified about important safety updates</p>
              </div>
              <Switch
                id="safetyAlerts"
                checked={settings.safetyAlerts}
                onCheckedChange={(checked) => updateSetting('safetyAlerts', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="moderationNotifications" className="font-medium">Moderation Notifications</Label>
                <p className="text-sm text-gray-500">Get notified when your content is moderated</p>
              </div>
              <Switch
                id="moderationNotifications"
                checked={settings.moderationNotifications}
                onCheckedChange={(checked) => updateSetting('moderationNotifications', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-gray-500" />
              <CardTitle>Account</CardTitle>
            </div>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/profile">
              <Button variant="outline" className="w-full justify-start">
                Edit Profile
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
