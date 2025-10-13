// src/app/profile/page.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { updateEmailAction, submitTrainerAccreditationAction, updateProfileBasicsAction, uploadAvatarAction, deleteTrainerCredentialAction, updateSocialMediaAction, updateFitnessPreferencesAction, updateLocationAction, uploadMediaAction, updateMediaSettingsAction, uploadTrainerCertificateAction } from './actions';
import CameraCapture from '@/components/ui/camera_capture';
import SocialMediaIntegration from '@/components/ui/social_media_integration';
import { Plus } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function ProfilePage() {
  const { data: session } = useSession();
  const { profile, loading: profileLoading, error: profileError, refreshProfile } = useUserProfile();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [email, setEmail] = useState(session?.user?.email || '');
  const [isApplyingTrainer, setIsApplyingTrainer] = useState(false);
  const [providerQuery, setProviderQuery] = useState('');
  const [credentialFileName, setCredentialFileName] = useState<string>('');
  const [avatarFileName, setAvatarFileName] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<null | { id: string; name: string; country: string; qualifications: string[] }>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [notifications, setNotifications] = useState<Array<{id: string, type: 'success' | 'error', message: string}>>([]);
  const [userCredentials, setUserCredentials] = useState<Array<any>>([]);
  const [credentialUploadFileName, setCredentialUploadFileName] = useState<string>('');
  const [editingCredentialIndex, setEditingCredentialIndex] = useState<number | null>(null);
  const [editCredentialData, setEditCredentialData] = useState<{
    providerName: string;
    country: string;
    qualifications: string[];
    customQualifications: string;
  }>({
    providerName: '',
    country: '',
    qualifications: [],
    customQualifications: ''
  });

  const user = session?.user;

  // Initialize form state from profile data (not session)
  useEffect(() => {
    if (profile) {
      // Initialize basic profile fields
      if (profile.name) {
        setFirstName(profile.name);
      }
      if (profile.surname) {
        setLastName(profile.surname);
      }
      if (profile.nickname) {
        setNickname(profile.nickname);
      }
      if (profile.trainerBio) {
        setBio(profile.trainerBio);
      }
      if (profile.email) {
        setEmail(profile.email);
      }
    }
  }, [profile])

  useEffect(() => {
    // Load last stored provider selection from server and user credentials
    const loadStored = async () => {
      try {
        const res = await fetch('/api/profile/credentials', { cache: 'no-store' })
        const data = await res.json()
        const creds = Array.isArray(data.credentials) ? data.credentials : []

        // Set all credentials for display
        setUserCredentials(creds)

        // Set selected provider from the last credential
        const last = creds[creds.length - 1]
        if (last && last.providerId && last.providerName) {
          setSelectedProvider({ id: last.providerId, name: last.providerName, country: last.country || '', qualifications: last.qualifications || [] })
        }
      } catch {}
    }
    loadStored()
  }, [])

  // Auto-remove notifications after 5 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(1))
      }, 5000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [notifications])

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    let completed = 0;
    const total = 10; // Increased total to include new sections

    if (user?.email) completed++;
    if (firstName || lastName || nickname) completed++;
    if (bio) completed++;
    if (user?.image) completed++;
    if (user?.trainerVerified) completed++;
    if (selectedProvider || user?.trainerVerified) completed++;

    // Social media links (optional but adds to completion)
    const hasSocialMedia = !!(user as any)?.instagramUrl || !!(user as any)?.tiktokUrl ||
                           !!(user as any)?.youtubeUrl || !!(user as any)?.facebookUrl ||
                           !!(user as any)?.linkedinUrl || !!(user as any)?.spotifyUrl;
    if (hasSocialMedia) completed++;

    // Fitness preferences (important for recommendations)
    const hasGoals = !!(user as any)?.fitnessGoals?.length;
    const hasWorkoutTypes = !!(user as any)?.preferredWorkoutTypes?.length;
    const hasSchedule = !!(user as any)?.availableWorkoutDays?.length;

    if (hasGoals) completed++;
    if (hasWorkoutTypes) completed++;
    if (hasSchedule) completed++;

    return Math.round((completed / total) * 100);
  };

  const completionPercentage = calculateProfileCompletion();

  // Form validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (isEditingEmail && !validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // File handling
  const handleFilePreview = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  // Media capture handling
  const handleMediaCapture = useCallback(async (file: File, mediaType: 'photo' | 'video', caption?: string) => {
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    const formData = new FormData();
    formData.append('userId', session.user.id);
    formData.append('media', file);
    formData.append('mediaType', mediaType);
    if (caption) formData.append('caption', caption);

    try {
      const result = await uploadMediaAction(formData);
      return result;
    } catch (error) {
      console.error('Media capture error:', error);
      return { success: false, error: 'Upload failed' };
    }
  }, [session?.user?.id]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFilePreview(files[0]);
      setAvatarFileName(files[0].name);
    }
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);
  };

  // Credential editing functions
  const startEditCredential = (index: number) => {
    const credential = userCredentials[index];
    setEditCredentialData({
      providerName: credential.providerName || '',
      country: credential.country || '',
      qualifications: credential.qualifications || [],
      customQualifications: ''
    });
    setEditingCredentialIndex(index);
  };

  const cancelEditCredential = () => {
    setEditingCredentialIndex(null);
    setEditCredentialData({
      providerName: '',
      country: '',
      qualifications: [],
      customQualifications: ''
    });
  };

  const saveCredentialEdit = async () => {
    if (editingCredentialIndex === null) return;

    try {
      // Combine selected qualifications with custom ones
      let allQualifications = [...editCredentialData.qualifications];
      if (editCredentialData.customQualifications.trim()) {
        const customQuals = editCredentialData.customQualifications
          .split(',')
          .map(q => q.trim())
          .filter(Boolean);
        allQualifications = [...allQualifications, ...customQuals];
      }

      const updatedCredentials = [...userCredentials];
      updatedCredentials[editingCredentialIndex] = {
        ...updatedCredentials[editingCredentialIndex],
        providerName: editCredentialData.providerName,
        country: editCredentialData.country,
        qualifications: allQualifications
      };

      setUserCredentials(updatedCredentials);
      showNotification('success', 'Credential information updated successfully');
      cancelEditCredential();

      // Optional: Save to server
      // You can add API call here to persist the changes
    } catch (error) {
      showNotification('error', 'Failed to update credential information');
    }
  };

  const addCustomQualification = (qualification: string) => {
    if (qualification && !editCredentialData.qualifications.includes(qualification)) {
      setEditCredentialData(prev => ({
        ...prev,
        qualifications: [...prev.qualifications, qualification]
      }));
    }
  };

  const removeQualification = (qualificationToRemove: string) => {
    setEditCredentialData(prev => ({
      ...prev,
      qualifications: prev.qualifications.filter(q => q !== qualificationToRemove)
    }));
  };

  // Check if user has admin access
  const isAdmin = user?.email === 'helloberesol@gmail.com' || user?.email === 'vsoleferioli@gmail.com';

  // Show loading state while fetching profile
  if (profileLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if profile failed to load
  if (profileError) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <svg className="h-12 w-12 text-red-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Failed to Load Profile</h3>
              <p className="text-red-700 mb-4">{profileError}</p>
              <Button onClick={refreshProfile} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Notification Overlay */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 ${
                notif.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  notif.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <p className="text-sm font-medium">{notif.message}</p>
                <button
                  onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                  className="ml-auto text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header with Profile Completion */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600 mt-1">Manage your account and trainer status</p>
          </div>
          <Badge variant="secondary" className="text-sm px-3 py-1">{user?.role || 'CLIENT'}</Badge>
        </div>

        {/* Profile Completion Indicator */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Profile Completion</span>
              <span className="text-sm font-bold text-blue-600">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            {completionPercentage < 100 && (
              <p className="text-xs text-gray-500 mt-2">
                Complete your profile to unlock all features
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Admin Panel Access - Only for specific users */}
      {isAdmin && (
        <Card className="border-l-4 border-l-purple-500 bg-purple-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <h3 className="font-medium text-purple-800">Administrator Access</h3>
                  <p className="text-sm text-purple-600">Manage users, exercises, and platform settings</p>
                </div>
              </div>
              <Button
                onClick={() => window.open('/admin', '_blank')}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Open Admin Panel
              </Button>
            </div>
        </CardContent>
      </Card>
      )}

      {/* Email */}
      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
          <CardDescription>Use nickname or full name; we’ll display nickname if provided</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateProfileBasicsAction} className="space-y-4" onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            await updateProfileBasicsAction(formData);
            await refreshProfile(); // Refresh profile data after save
            showNotification('success', 'Profile updated successfully');
          }}>
            <input type="hidden" name="userId" value={user?.id || ''} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="mb-1 block">Name</Label>
                <Input name="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" />
              </div>
              <div>
                <Label className="mb-1 block">Surname</Label>
                <Input name="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
              </div>
              <div>
                <Label className="mb-1 block">Nickname</Label>
                <Input name="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="johnny" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm font-medium">About You</Label>
              <Textarea
                id="bio"
                name="bio"
                placeholder="Tell us about yourself, your fitness journey, or your training philosophy..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="min-h-[120px] transition-colors focus:border-blue-500"
              />
              <p className="text-xs text-gray-500">{bio.length}/500 characters</p>
            </div>
            <Button type="submit">Save</Button>
          </form>
        </CardContent>
      </Card>
      

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profile Picture
          </CardTitle>
          <CardDescription>Upload a clear photo of yourself (PNG, JPG, or WebP)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Avatar Preview */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                  ) : user?.image ? (
                    <img src={user.image} alt="Current avatar" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </div>
                {(avatarPreview || user?.image) && (
                  <Badge className="absolute -bottom-1 -right-1 bg-green-100 text-green-800">
                    ✓
                  </Badge>
                )}
              </div>
              <span className="text-xs text-gray-500 text-center">Recommended: 400x400px</span>
            </div>

            {/* Upload Area */}
            <div className="flex-1">
              <form action={uploadAvatarAction} className="space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                await uploadAvatarAction(formData);
                await refreshProfile(); // Refresh profile data after save
                showNotification('success', 'Avatar uploaded successfully');
              }}>
                <input type="hidden" name="userId" value={user?.id || ''} />
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <svg className="h-8 w-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-gray-600 mb-2">Drag & drop your image here, or click to browse</p>
                  <Input
                    name="avatar"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFilePreview(file);
                        setAvatarFileName(file.name);
                      }
                    }}
                    className="max-w-xs mx-auto"
                    required
                  />
                </div>
                {avatarFileName && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500">✓</span>
                    <span>{avatarFileName}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setAvatarFileName('');
                        setAvatarPreview(null);
                      }}
                    >
                      ×
                    </Button>
                  </div>
                )}
                <SubmitButton label="Upload Photo" pendingLabel="Uploading..." disabled={!avatarFileName} />
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Section - Enhanced */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Email Address
          </CardTitle>
          <CardDescription>Your primary email address for account access and notifications</CardDescription>
        </CardHeader>
        <CardContent>
          {!isEditingEmail ? (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-gray-900">{user?.email}</span>
                <Badge variant="secondary" className="text-xs">Verified</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setEmail(user?.email || ''); setIsEditingEmail(true); setFormErrors({}); }}>Edit</Button>
            </div>
          ) : (
            <form action={updateEmailAction} className="space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              await updateEmailAction(formData);
              await refreshProfile(); // Refresh profile data after save
              showNotification('success', 'Email updated successfully');
            }}>
              <input type="hidden" name="userId" value={user?.id || ''} />
              <div className="space-y-2">
                <Input
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (formErrors.email) {
                      const newErrors = { ...formErrors };
                      delete newErrors.email;
                      setFormErrors(newErrors);
                    }
                  }}
                  placeholder="you@example.com"
                  className={`transition-colors ${
                    formErrors.email ? 'border-red-500 focus:border-red-500' : 'focus:border-blue-500'
                  }`}
                />
                {formErrors.email && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span>{formErrors.email}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <SubmitButton label="Save Email" pendingLabel="Saving..." onClick={() => validateForm()} />
                <Button type="button" variant="ghost" onClick={() => {
                  setIsEditingEmail(false);
                  setFormErrors({});
                  setEmail(user?.email || '');
                }}>Cancel</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Social Media Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Social Media Links
          </CardTitle>
          <CardDescription>
            Connect your social media accounts to share your fitness journey and connect with others
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateSocialMediaAction} className="space-y-4" onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            await updateSocialMediaAction(formData);
            await refreshProfile(); // Refresh profile data after save
            showNotification('success', 'Social media links updated successfully');
          }}>
            <input type="hidden" name="userId" value={user?.id || ''} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Instagram */}
              <div className="space-y-2">
                <Label htmlFor="instagramUrl" className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Instagram
                </Label>
                <Input
                  id="instagramUrl"
                  name="instagramUrl"
                  type="url"
                  placeholder="https://instagram.com/yourusername"
                  defaultValue={profile?.instagramUrl || ""}
                />
              </div>

              {/* Spotify */}
              <div className="space-y-2">
                <Label htmlFor="spotifyUrl" className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 1.5C6.21 1.5 1.5 6.21 1.5 12S6.21 22.5 12 22.5 22.5 17.79 22.5 12 17.79 1.5 12 1.5zm4.93 15.34a.75.75 0 01-1.03.25c-2.82-1.73-6.37-2.12-10.56-1.15a.75.75 0 11-.33-1.46c4.57-1.05 8.49-.6 11.58 1.27.35.21.46.67.25 1.02zm1.38-3.15a.94.94 0 01-1.3.32c-3.23-1.98-8.16-2.56-11.98-1.39a.94.94 0 11-.55-1.8c4.29-1.31 9.67-.66 13.35 1.56.45.27.6.86.32 1.31zm.13-3.28c-3.71-2.2-9.85-2.4-13.4-1.31a1.13 1.13 0 11-.65-2.17c4.09-1.23 10.9-1 15.09 1.47a1.13 1.13 0 01-1.04 2.01z" />
                  </svg>
                  Spotify
                </Label>
                <Input
                  id="spotifyUrl"
                  name="spotifyUrl"
                  type="url"
                  placeholder="https://open.spotify.com/user/yourprofile"
                  defaultValue=""
                />
              </div>

              {/* TikTok */}
              <div className="space-y-2">
                <Label htmlFor="tiktokUrl" className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                  </svg>
                  TikTok
                </Label>
                <Input
                  id="tiktokUrl"
                  name="tiktokUrl"
                  type="url"
                  placeholder="https://tiktok.com/@yourusername"
                  defaultValue={profile?.tiktokUrl || ""}
                />
              </div>

              {/* YouTube */}
              <div className="space-y-2">
                <Label htmlFor="youtubeUrl" className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  YouTube
                </Label>
                <Input
                  id="youtubeUrl"
                  name="youtubeUrl"
                  type="url"
                  placeholder="https://youtube.com/@yourchannel"
                  defaultValue={profile?.youtubeUrl || ""}
                />
              </div>

              {/* Facebook */}
              <div className="space-y-2">
                <Label htmlFor="facebookUrl" className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </Label>
                <Input
                  id="facebookUrl"
                  name="facebookUrl"
                  type="url"
                  placeholder="https://facebook.com/yourprofile"
                  defaultValue={profile?.facebookUrl || ""}
                />
              </div>

              {/* LinkedIn */}
              <div className="space-y-2">
                <Label htmlFor="linkedinUrl" className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  LinkedIn
                </Label>
                <Input
                  id="linkedinUrl"
                  name="linkedinUrl"
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  defaultValue={profile?.linkedinUrl || ""}
                />
              </div>
            </div>

            {/* Privacy Control */}
            <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                id="showSocialMedia"
                name="showSocialMedia"
                defaultChecked={profile?.showSocialMedia ?? true}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="showSocialMedia" className="text-sm font-medium text-blue-900">
                Show my social media links on my public profile
              </Label>
            </div>

            <SubmitButton label="Save Social Media Links" pendingLabel="Saving..." />
          </form>
        </CardContent>
      </Card>

      {/* Fitness Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Fitness Preferences
          </CardTitle>
          <CardDescription>
            Tell us about your fitness goals and preferences to get personalized recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateFitnessPreferencesAction} className="space-y-6" onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            await updateFitnessPreferencesAction(formData);
            await refreshProfile(); // Refresh profile data after save
            showNotification('success', 'Fitness preferences updated successfully');
          }}>
            <input type="hidden" name="userId" value={user?.id || ''} />

            {/* Fitness Goals */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Fitness Goals</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  'Weight Loss',
                  'Muscle Gain',
                  'Strength Building',
                  'Endurance',
                  'Flexibility',
                  'General Fitness'
                ].map((goal) => (
                  <label key={goal} className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="fitnessGoals"
                      value={goal}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">{goal}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Experience Level */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Experience Level</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { value: 'BEGINNER', label: 'Beginner', desc: 'New to fitness or getting back into it' },
                  { value: 'INTERMEDIATE', label: 'Intermediate', desc: 'Regular workout routine, some experience' },
                  { value: 'ADVANCED', label: 'Advanced', desc: 'Experienced athlete or trainer' }
                ].map((level) => (
                  <label key={level.value} className="flex flex-col p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="radio"
                        name="experienceLevel"
                        value={level.value}
                        defaultChecked={level.value === 'BEGINNER'}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium">{level.label}</span>
                    </div>
                    <span className="text-xs text-gray-600">{level.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Preferred Workout Types */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Preferred Workout Types</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { value: 'Strength Training', icon: '💪' },
                  { value: 'Cardio', icon: '🏃' },
                  { value: 'HIIT', icon: '⚡' },
                  { value: 'Yoga', icon: '🧘' },
                  { value: 'Pilates', icon: '🤸' },
                  { value: 'Calisthenics', icon: '🏋️' },
                  { value: 'Swimming', icon: '🏊' },
                  { value: 'Running', icon: '🏃‍♀️' },
                  { value: 'Cycling', icon: '🚴' }
                ].map((workout) => (
                  <label key={workout.value} className="flex items-center space-x-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="preferredWorkoutTypes"
                      value={workout.value}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-lg">{workout.icon}</span>
                    <span className="text-sm font-medium">{workout.value}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Available Workout Days */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Available Workout Days</Label>
              <div className="grid grid-cols-7 gap-2">
                {[
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                  'Sunday'
                ].map((day) => (
                  <label key={day} className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="availableWorkoutDays"
                      value={day}
                      className="mb-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-medium text-center">{day.slice(0, 3)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Preferred Workout Duration */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Preferred Workout Duration</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { value: '15-30', label: '15-30 minutes', desc: 'Quick sessions' },
                  { value: '30-60', label: '30-60 minutes', desc: 'Standard sessions' },
                  { value: '60+', label: '60+ minutes', desc: 'Extended sessions' }
                ].map((duration) => (
                  <label key={duration.value} className="flex flex-col p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center space-x-2 mb-2">
                      <input
                        type="radio"
                        name="preferredWorkoutDuration"
                        value={duration.value}
                        defaultChecked={duration.value === '30-60'}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium">{duration.label}</span>
                    </div>
                    <span className="text-xs text-gray-600">{duration.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            <SubmitButton label="Save Fitness Preferences" pendingLabel="Saving..." />
          </form>
        </CardContent>
      </Card>

      {/* Location & Discovery (Optional) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Location & Discovery
            <Badge variant="secondary" className="text-xs">Optional</Badge>
          </CardTitle>
          <CardDescription>
            Share your location to connect with nearby trainers and fitness enthusiasts. All location sharing is completely optional and privacy-controlled.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateLocationAction} className="space-y-6" onSubmit={async (e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            await updateLocationAction(formData);
            await refreshProfile(); // Refresh profile data after save
            showNotification('success', 'Location settings updated successfully');
          }}>
            <input type="hidden" name="userId" value={user?.id || ''} />

            {/* Privacy Notice */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Privacy First</h4>
                  <p className="text-sm text-blue-700">
                    Your location is never shared without your explicit permission. You control who can see your location and discover you for fitness connections.
                  </p>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Location Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="e.g., Barcelona"
                    defaultValue={profile?.city || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    name="state"
                    placeholder="e.g., Catalonia"
                    defaultValue={profile?.state || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    placeholder="e.g., Spain"
                    defaultValue={profile?.country || ""}
                  />
                </div>
              </div>
            </div>

            {/* Privacy Controls */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Privacy & Discovery Settings</h4>

              {/* Show Location Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="showLocation" className="font-medium">Show my location on profile</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    Display your city and country on your public profile
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="showLocation"
                  name="showLocation"
                  defaultChecked={profile?.showLocation ?? false}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </div>

              {/* Location Visibility */}
              <div className="space-y-3">
                <Label className="font-medium">Who can see my location?</Label>
                <div className="space-y-2">
                  {[
                    { value: 'NONE', label: 'Nobody', desc: 'Keep my location completely private' },
                    { value: 'TRAINERS_ONLY', label: 'Verified trainers only', desc: 'Only verified trainers can see my location' },
                    { value: 'ALL', label: 'All users', desc: 'Any Massimino user can see my location' }
                  ].map((option) => (
                    <label key={option.value} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name="locationVisibility"
                        value={option.value}
                        defaultChecked={option.value === (profile?.locationVisibility || 'NONE')}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-600">{option.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Enable Discovery */}
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex-1">
                  <Label htmlFor="enableDiscovery" className="font-medium text-green-900">Enable location-based discovery</Label>
                  <p className="text-sm text-green-700 mt-1">
                    Allow others to find and connect with you based on proximity. Great for finding local trainers or workout partners!
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="enableDiscovery"
                  name="enableDiscovery"
                  defaultChecked={profile?.enableDiscovery ?? false}
                  className="rounded border-green-300 text-green-600 focus:ring-green-500"
                />
              </div>
            </div>

            <SubmitButton label="Save Location & Privacy Settings" pendingLabel="Saving..." />
          </form>
        </CardContent>
      </Card>

      {/* Media Gallery & Camera */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Media Gallery
          </CardTitle>
          <CardDescription>
            Capture and share your fitness journey with photos and videos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Camera Capture Component */}
            <CameraCapture
              onCapture={handleMediaCapture}
              userId={session?.user?.id || ''}
            />

            {/* Media Privacy Settings */}
            <form action={updateMediaSettingsAction} className="space-y-4 p-4 bg-gray-50 rounded-lg" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              await updateMediaSettingsAction(formData);
              await refreshProfile(); // Refresh profile data after save
              showNotification('success', 'Media settings updated successfully');
            }}>
              <input type="hidden" name="userId" value={session?.user?.id || ''} />
              <h4 className="font-medium text-gray-900">Media Sharing Settings</h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Show media on profile</Label>
                    <p className="text-sm text-gray-600">Display your photos and videos on your public profile</p>
                  </div>
                  <input
                    type="checkbox"
                    name="showMediaOnProfile"
                    defaultChecked={true}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Allow comments on media</Label>
                    <p className="text-sm text-gray-600">Let others comment on your photos and videos</p>
                  </div>
                  <input
                    type="checkbox"
                    name="allowMediaComments"
                    defaultChecked={true}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">Enable social sharing</Label>
                    <p className="text-sm text-gray-600">Share directly to Instagram, TikTok, and other platforms</p>
                  </div>
                  <input
                    type="checkbox"
                    name="enableSocialSharing"
                    defaultChecked={false}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">Save Media Settings</Button>
            </form>

            {/* Recent Media */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Recent Media</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Placeholder media items */}
                <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Plus className="h-8 w-8 mx-auto mb-1" />
                    <div className="text-xs">Add Media</div>
                  </div>
                </div>
                <div className="aspect-square bg-gray-200 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <svg className="h-8 w-8 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <div className="text-xs">View All</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Moderation Notice */}
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h4 className="font-medium text-yellow-900 mb-1">Content Moderation</h4>
                  <p className="text-sm text-yellow-700">
                    All uploaded media is automatically reviewed for safety and community guidelines.
                    Inappropriate content will be flagged and may be removed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Media Integration */}
      <SocialMediaIntegration userId={session?.user?.id || ''} />

      {/* Trainer Accreditation - Enhanced */}
      <Card className={user?.trainerVerified ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {user?.trainerVerified ? (
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
            Trainer Accreditation
            {user?.trainerVerified && <Badge className="bg-green-100 text-green-800">Verified</Badge>}
          </CardTitle>
          <CardDescription>
            {user?.trainerVerified
              ? 'Your trainer credentials have been verified. You can now access all trainer features.'
              : 'Verify your trainer status by providing an accredited credential and uploading proof (badge, PDF, or image).'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg" style={{
            backgroundColor: user?.trainerVerified ? '#f0fdf4' : '#fef3c7'
          }}>
            <div className="flex items-center gap-3">
              {user?.trainerVerified ? (
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              )}
              <div>
                <p className="font-medium">
                  Trainer Status: {user?.trainerVerified ? 'Verified' : 'Not Verified'}
                </p>
                <p className="text-sm text-gray-600">
                  {user?.trainerVerified
                    ? 'You can create teams, manage clients, and receive payments'
                    : 'Complete verification to unlock trainer features'
                  }
                </p>
              </div>
            </div>
            {!user?.trainerVerified && (
              <Button
                variant={isApplyingTrainer ? 'secondary' : 'default'}
                onClick={() => setIsApplyingTrainer(v => !v)}
                className="whitespace-nowrap"
              >
                {isApplyingTrainer ? 'Hide Form' : 'Apply for Verification'}
              </Button>
            )}
          </div>

          {isApplyingTrainer && !user?.trainerVerified && (
            <div className="bg-white rounded-lg border p-6 space-y-6">
              <div className="flex items-center gap-2 pb-2 border-b">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-medium">Trainer Verification Application</h3>
              </div>

              <form action={submitTrainerAccreditationAction} className="space-y-6" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                await submitTrainerAccreditationAction(formData);
                await refreshProfile(); // Refresh profile data after save
                showNotification('success', 'Trainer verification application submitted successfully');
              }}>
                <input type="hidden" name="userId" value={user?.id || ''} />

                {/* Provider Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Accredited Training Provider</Label>
                  {selectedProvider ? (
                    <div className="p-4 rounded-lg border bg-green-50 border-green-200">
                      <input type="hidden" name="providerId" value={selectedProvider.id} />
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="font-medium text-green-800">{selectedProvider.name}</div>
                          <div className="text-sm text-green-600">
                            {selectedProvider.country} • {selectedProvider.qualifications.join(', ')}
                          </div>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => setSelectedProvider(null)}>
                          Change Provider
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Input
                        name="providerQuery"
                        placeholder="Search for your certification provider..."
                        value={providerQuery}
                        onChange={(e) => setProviderQuery(e.target.value)}
                        className="transition-colors focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Browse the provider list below to find and select your exact provider
                      </p>
                    </div>
                  )}
                </div>

                {/* Enhanced File Upload */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Upload Credential Document</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    <svg className="h-8 w-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-gray-600 mb-2">Upload your certification document</p>
                    <Input
                      name="credentialFile"
                      type="file"
                      accept="application/pdf,image/png,image/jpeg,image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setCredentialFileName(file.name);
                          if (file.size > 10 * 1024 * 1024) {
                            showNotification('error', 'File size must be less than 10MB');
                            e.target.value = '';
                            setCredentialFileName('');
                          }
                        }
                      }}
                      className="max-w-xs mx-auto"
                      required
                    />
                  </div>
                  {credentialFileName && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Selected: {credentialFileName}</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Accepted formats: PDF, PNG, JPG (max 10MB). Ensure text is clearly readable.
                  </p>
                </div>

                <Separator />

                <div className="flex flex-col sm:flex-row gap-3">
                  <SubmitButton
                    label="Submit for Verification"
                    pendingLabel="Uploading Application..."
                    disabled={!selectedProvider || !credentialFileName}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={() => setIsApplyingTrainer(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {user?.trainerVerified && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-green-800">Trainer Verification Complete</p>
                  <p className="text-sm text-green-700">
                    You can now create and manage teams, access advanced features, and receive payments.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trainer Credentials Display */}
      {(userCredentials.length > 0 || user?.trainerVerified) && (
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="h-5 w-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Training Credentials
              {user?.trainerVerified && <Badge className="bg-green-100 text-green-800">Verified</Badge>}
            </CardTitle>
            <CardDescription>
              {user?.trainerVerified
                ? 'Verified training credentials and certifications'
                : 'Training credentials submitted for verification'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Upload Credential / Certificate */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Upload New Credential</h4>
              <form action={uploadTrainerCertificateAction} className="space-y-4" onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                await uploadTrainerCertificateAction(formData);
                await refreshProfile(); // Refresh profile data after save
                showNotification('success', 'Credential uploaded successfully');
              }}>
                <input type="hidden" name="userId" value={user?.id || ''} />
                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    const files = e.dataTransfer.files;
                    if (files && files[0]) {
                      setCredentialUploadFileName(files[0].name);
                    }
                  }}
                >
                  <svg className="h-8 w-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-gray-600 mb-2">Drag & drop your certificate here, or click to browse</p>
                  <Input
                    name="certificateFile"
                    type="file"
                    accept="application/pdf,application/msword,image/png,image/jpeg,image/jpg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCredentialUploadFileName(file.name);
                        if (file.size > 10 * 1024 * 1024) {
                          showNotification('error', 'File size must be less than 10MB');
                          e.target.value = '';
                          setCredentialUploadFileName('');
                        }
                      }
                    }}
                    className="max-w-xs mx-auto"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">Accepted formats: DOC, PDF, PNG, JPG (max 10MB)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="issuer">Issuer / Provider (optional)</Label>
                    <Input id="issuer" name="issuer" placeholder="e.g., National PT Association" />
                  </div>
                </div>

                {credentialUploadFileName && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-green-500">✓</span>
                    <span>{credentialUploadFileName}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCredentialUploadFileName('')}
                    >
                      ×
                    </Button>
                  </div>
                )}

                <SubmitButton label="Upload Credential" pendingLabel="Uploading..." disabled={!credentialUploadFileName} />
              </form>
            </div>

            <Separator />

            {/* Existing Credentials List */}
            {userCredentials.length > 0 ? (
              <div className="space-y-4">
                {userCredentials.map((credential, index) => (
                  <div key={index} className="relative border rounded-lg p-4 bg-gray-50">
                    {/* Delete credential button */}
                    <form action={deleteTrainerCredentialAction} className="absolute top-2 right-2" onSubmit={async (e) => {
                      e.preventDefault();
                      if (!confirm('Delete this credential?')) {
                        return;
                      }
                      const formData = new FormData(e.currentTarget);
                      await deleteTrainerCredentialAction(formData);
                      await refreshProfile(); // Refresh profile data after save
                      setUserCredentials(prev => prev.filter((_, i) => i !== index));
                      showNotification('success', 'Credential deleted');
                    }}>
                      <input type="hidden" name="userId" value={user?.id || ''} />
                      <input type="hidden" name="index" value={String(index)} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:text-red-700"
                        aria-label="Delete credential"
                        title="Delete credential"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    </form>
                    {editingCredentialIndex === index ? (
                      /* Edit Mode */
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span className="font-medium text-blue-900">Edit Credential Information</span>
                        </div>

                        {/* Edit Form */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`provider-name-${index}`} className="text-sm font-medium">Provider Name</Label>
                            <Input
                              id={`provider-name-${index}`}
                              type="text"
                              value={editCredentialData.providerName}
                              onChange={(e) => setEditCredentialData(prev => ({ ...prev, providerName: e.target.value }))}
                              className="mt-1"
                              placeholder="e.g., NASM, ACE, ACSM"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`provider-country-${index}`} className="text-sm font-medium">Country</Label>
                            <Input
                              id={`provider-country-${index}`}
                              type="text"
                              value={editCredentialData.country}
                              onChange={(e) => setEditCredentialData(prev => ({ ...prev, country: e.target.value }))}
                              className="mt-1"
                              placeholder="e.g., United States, United Kingdom"
                            />
                          </div>
                        </div>

                        {/* Current Qualifications */}
                        <div>
                          <Label className="text-sm font-medium">Current Qualifications</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {editCredentialData.qualifications.map((qual, qIndex) => (
                              <Badge
                                key={qIndex}
                                variant="outline"
                                className="text-xs cursor-pointer hover:bg-red-50"
                                onClick={() => removeQualification(qual)}
                              >
                                {qual}
                                <svg className="h-3 w-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Add Custom Qualifications */}
                        <div>
                          <Label htmlFor={`custom-qualifications-${index}`} className="text-sm font-medium">Add Qualifications</Label>
                          <div className="flex gap-2 mt-1">
                            <Input
                              id={`custom-qualifications-${index}`}
                              type="text"
                              value={editCredentialData.customQualifications}
                              onChange={(e) => setEditCredentialData(prev => ({ ...prev, customQualifications: e.target.value }))}
                              placeholder="Enter qualifications separated by commas"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (editCredentialData.customQualifications.trim()) {
                                    const newQuals = editCredentialData.customQualifications
                                      .split(',')
                                      .map(q => q.trim())
                                      .filter(Boolean);
                                    newQuals.forEach(q => addCustomQualification(q));
                                    setEditCredentialData(prev => ({ ...prev, customQualifications: '' }));
                                  }
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (editCredentialData.customQualifications.trim()) {
                                  const newQuals = editCredentialData.customQualifications
                                    .split(',')
                                    .map(q => q.trim())
                                    .filter(Boolean);
                                  newQuals.forEach(q => addCustomQualification(q));
                                  setEditCredentialData(prev => ({ ...prev, customQualifications: '' }));
                                }
                              }}
                            >
                              Add
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Press Enter or click Add to add qualifications. Click on a qualification badge to remove it.
                          </p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-4 border-t">
                          <Button
                            type="button"
                            onClick={saveCredentialEdit}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Save Changes
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={cancelEditCredential}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode */
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          {/* Provider Information */}
                          <div className="flex items-center gap-2">
                            <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4m-6 0a2 2 0 100-4m6 4a2 2 0 100-4m0-4a2 2 0 100-4m6 4a2 2 0 100-4" />
                            </svg>
                            <span className="font-medium text-gray-900">
                              {credential.providerName || 'Training Provider'}
                            </span>
                            {credential.country && (
                              <Badge variant="secondary" className="text-xs">
                                {credential.country}
                              </Badge>
                            )}
                          </div>

                        {/* Qualifications */}
                        {credential.qualifications && credential.qualifications.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Qualifications:</p>
                            <div className="flex flex-wrap gap-1">
                              {credential.qualifications.map((qual: string, qIndex: number) => (
                                <Badge key={qIndex} variant="outline" className="text-xs">
                                  {qual}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Submission Date */}
                        {credential.submittedAt && (
                          <p className="text-xs text-gray-500">
                            Submitted: {new Date(credential.submittedAt).toLocaleDateString()}
                          </p>
                        )}

                        {/* Verification Status */}
                        <div className="flex items-center gap-2">
                          {credential.status === 'approved' || user?.trainerVerified ? (
                            <>
                              <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm text-green-700 font-medium">Verified</span>
                            </>
                          ) : credential.status === 'rejected' ? (
                            <>
                              <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              <span className="text-sm text-red-700 font-medium">Rejected</span>
                            </>
                          ) : (
                            <>
                              <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm text-orange-700 font-medium">Pending Review</span>
                            </>
                          )}
                        </div>

                        {/* Provider Validation Status */}
                        {credential.providerValid !== undefined && (
                          <div className="flex items-center gap-2">
                            {credential.providerValid ? (
                              <>
                                <svg className="h-3 w-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-xs text-green-600">Provider Verified</span>
                              </>
                            ) : (
                              <>
                                <svg className="h-3 w-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span className="text-xs text-red-600">Provider Invalid</span>
                              </>
                            )}
                          </div>
                        )}

                        {/* Verification Notes */}
                        {credential.verificationNotes && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                            <span className="font-medium text-blue-800">Admin Notes: </span>
                            <span className="text-blue-700">{credential.verificationNotes}</span>
                          </div>
                        )}
                      </div>

                      {/* Credential File Preview */}
                      {credential.credentialPath && (
                        <div className="flex-shrink-0">
                          <div className="w-24 h-32 border rounded bg-white shadow-sm flex items-center justify-center">
                            {(() => {
                              const p = String(credential.credentialPath).toLowerCase()
                              if (p.endsWith('.pdf')) {
                                return (
                                  <div className="text-center">
                                    <svg className="h-8 w-8 mx-auto text-red-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-xs text-gray-600">PDF</p>
                                  </div>
                                )
                              }
                              if (p.endsWith('.doc') || p.endsWith('.docx')) {
                                return (
                                  <div className="text-center">
                                    <svg className="h-8 w-8 mx-auto text-indigo-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-xs text-gray-600">DOC</p>
                                  </div>
                                )
                              }
                              return (
                                <div className="text-center">
                                  <svg className="h-8 w-8 mx-auto text-blue-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                  <p className="text-xs text-gray-600">Image</p>
                                </div>
                              )
                            })()}
                          </div>
                          {/* View Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-2 text-xs"
                            onClick={() => {
                              if (credential.credentialPath) {
                                window.open(credential.credentialPath, '_blank');
                              }
                            }}
                          >
                            <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </Button>

                          {/* Edit Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-1 text-xs"
                            onClick={() => startEditCredential(index)}
                          >
                            <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit Info
                          </Button>
                        </div>
                      )}
                    </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <svg className="h-12 w-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm">No training credentials uploaded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Accredited Training Providers */}
      {!user?.trainerVerified && (
        <AccreditedProvidersBrowser
          onSelect={(p) => {
            setSelectedProvider(p);
            setIsApplyingTrainer(true);
            showNotification('success', `Selected ${p.name} as your training provider`);
          }}
        />
      )}

      {/* Save All Button */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg text-blue-900">Save All Changes</h3>
              <p className="text-sm text-blue-700">Submit all your profile updates at once</p>
            </div>
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <Button
            size="lg"
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={async () => {
              const forms = document.querySelectorAll('form');
              let successCount = 0;
              let errorCount = 0;

              for (const form of forms) {
                try {
                  // Trigger the form's onSubmit handler
                  const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                  const result = form.dispatchEvent(submitEvent);
                  if (result) {
                    successCount++;
                  }
                } catch (error) {
                  console.error('Form submission error:', error);
                  errorCount++;
                }
              }

              if (successCount > 0) {
                showNotification('success', `Successfully saved ${successCount} section${successCount > 1 ? 's' : ''}!`);
              }
              if (errorCount > 0) {
                showNotification('error', `Failed to save ${errorCount} section${errorCount > 1 ? 's' : ''}`);
              }
            }}
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save All Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AccreditedProvidersBrowser({ onSelect }: { onSelect: (p: { id: string; name: string; country: string; qualifications: string[] }) => void }) {
  const [q, setQ] = useState('')
  const [country, setCountry] = useState('')
  const [qualification, setQualification] = useState('')
  const [active, setActive] = useState<'all'|'true'|'false'>('true')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<Array<{ id: string; name: string; country: string; qualifications: string[] }>>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const pageSize = 10

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (country) params.set('country', country)
      if (qualification) params.set('qualification', qualification)
      if (active !== 'all') params.set('active', active)
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      const res = await fetch(`/api/accredited/search?${params.toString()}`)
      const data = await res.json()
      setItems(data.items)
      setTotal(data.total)
    } catch (error) {
      console.error('Failed to load providers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [q, country, qualification, active, page])

  return (
    <Card className="mt-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Accredited Training Providers
            </CardTitle>
            <CardDescription>Browse and select from verified training providers</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHelp(!showHelp)}
            className="hidden sm:flex"
          >
            {showHelp ? '👁️‍🗨️ Hide' : '👁️ Show'} Help
          </Button>
        </div>
        {showHelp && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <div className="flex items-start gap-2">
              <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="space-y-2 text-sm text-blue-800">
                <p className="font-medium">How to find your provider:</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>Search by the exact name of your certification provider</li>
                  <li>Filter by country to narrow down results</li>
                  <li>Look for the specific qualification you hold</li>
                  <li>Click "Select" to choose your provider for verification</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Search Provider</Label>
            <Input
              value={q}
              onChange={(e) => { setPage(1); setQ(e.target.value) }}
              placeholder="Provider name..."
              className="transition-colors focus:border-blue-500"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-medium">Country</Label>
            <Input
              value={country}
              onChange={(e) => { setPage(1); setCountry(e.target.value) }}
              placeholder="Country..."
              className="transition-colors focus:border-blue-500"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-medium">Qualification</Label>
            <Input
              value={qualification}
              onChange={(e) => { setPage(1); setQualification(e.target.value) }}
              placeholder="Qualification..."
              className="transition-colors focus:border-blue-500"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-medium">Status</Label>
            <Select value={active} onValueChange={(value) => { setPage(1); setActive(value as any) }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="ml-2 text-sm text-gray-600">Loading providers...</span>
          </div>
        )}

        {!loading && (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto rounded border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Name</th>
                    <th className="px-4 py-3 text-left font-medium">Country</th>
                    <th className="px-4 py-3 text-left font-medium">Qualifications</th>
                    <th className="px-4 py-3 text-center font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-gray-600">{p.country}</td>
                      <td className="px-4 py-3">
                        <div className="max-w-xs truncate" title={p.qualifications.join(', ')}>
                          {p.qualifications.join(', ')}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button size="sm" variant="outline" onClick={() => onSelect(p)}>
                          Select
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="sm:hidden space-y-3">
              {items.map(p => (
                <Card key={p.id} className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{p.name}</h3>
                      <p className="text-sm text-gray-600">{p.country}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Qualifications:</p>
                      <p className="text-sm">{p.qualifications.join(', ')}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => onSelect(p)} className="w-full">
                      Select Provider
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {items.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                <svg className="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p>No providers found matching your criteria</p>
                <p className="text-sm mt-1">Try adjusting your search filters</p>
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {total > pageSize && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {items.length} of {total} providers
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage(p => Math.max(1, p-1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page * pageSize >= total || loading}
                onClick={() => setPage(p => p+1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SubmitButton({ label, pendingLabel, disabled, className, onClick }: {
  label: string;
  pendingLabel: string;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      variant={pending ? 'secondary' : 'default'}
      className={className}
      onClick={onClick}
    >
      {pending ? pendingLabel : label}
    </Button>
  )
}
