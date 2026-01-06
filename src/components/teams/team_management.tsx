// src/components/teams/team_management.tsx

'use client';

/**
 * Team Management Component - Comprehensive team management interface
 * Contains: Team creation, team list, members panel, workout logs, messaging, invite system
 */

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Team, TeamApplication, TeamMessage, TeamWorkoutLog,
  TeamType, TeamVisibility, CreateTeamRequest,
  DEFAULT_TEAM_AESTHETICS, TEAM_CONSTRAINTS
} from '@/types/teams';
import { isTrainer, isAdmin } from '@/types/auth';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Icons
import { Plus, Users, MessageCircle, Dumbbell, Settings, UserPlus, Check, X, Send, Link2, Copy, QrCode, Share2 } from 'lucide-react';

// QR Code
import { QRCodeSVG } from 'qrcode.react';

interface TeamManagementProps {
  className?: string;
  onTeamSelect?: (team: Team) => void;
}

export function TeamManagement({ className, onTeamSelect }: TeamManagementProps) {
  const { data: session } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list');

  // Team creation modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateTeamRequest>({
    name: '',
    description: '',
    type: 'RESISTANCE',
    visibility: 'PUBLIC',
    maxMembers: 20,
    aestheticSettings: DEFAULT_TEAM_AESTHETICS,
    allowComments: true,
    allowMemberInvites: true
  });

  // Team applications state
  const [applications, setApplications] = useState<TeamApplication[]>([]);
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [workouts, setWorkouts] = useState<TeamWorkoutLog[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Workout creation modal state
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [workoutFormData, setWorkoutFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    duration: '',
    exercises: [] as { exerciseId: string; order: number; sets: number; reps: string; weight?: string }[]
  });

  // Workout details modal state
  const [selectedWorkout, setSelectedWorkout] = useState<TeamWorkoutLog | null>(null);
  const [showWorkoutDetails, setShowWorkoutDetails] = useState(false);

  // Member invitation modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [inviteMethod, setInviteMethod] = useState<'link' | 'email' | 'user-id'>('link');

  // Shareable link state
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  // Check if user is trainer or admin
  const user = session?.user as any;
  if (!session?.user || (!isTrainer(user) && !isAdmin(user))) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Only verified trainers and admins can manage teams.</p>
      </div>
    );
  }

  // Format visibility for display
  const formatVisibility = (visibility: string) => {
    const map: Record<string, string> = {
      'PUBLIC': 'Public',
      'PRIVATE': 'Private',
      'INVITE_ONLY': 'Invite Only'
    };
    return map[visibility] || visibility.toLowerCase().replace(/_/g, ' ');
  };

  // Load trainer's teams
  const loadTeams = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/teams?action=my-teams');
      const data = await response.json();

      if (data.success) {
        setTeams(data.data.teams);
      }
    } catch (error) {
      console.error('Failed to load teams:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load team details
  const loadTeamDetails = async (teamId: string) => {
    try {
      const [teamResponse, membersResponse, applicationsResponse, messagesResponse, workoutsResponse] = await Promise.all([
        fetch(`/api/teams/${teamId}`),
        fetch(`/api/teams/${teamId}/members/manage`),
        fetch(`/api/teams/${teamId}?action=applications`),
        fetch(`/api/teams/${teamId}?action=messages&limit=10`),
        fetch(`/api/teams/${teamId}?action=workout-logs&limit=5`)
      ]);

      const [teamData, membersData, applicationsData, messagesData, workoutsData] = await Promise.all([
        teamResponse.json(),
        membersResponse.json(),
        applicationsResponse.json(),
        messagesResponse.json(),
        workoutsResponse.json()
      ]);

      if (teamData.success) {
        // Merge members data from the new endpoint
        const team = teamData.data;
        if (membersData.members) {
          team.members = membersData.members;
        }
        setSelectedTeam(team);
        onTeamSelect?.(team);
      }

      if (applicationsData.success) {
        setApplications(applicationsData.data.applications || []);
      }

      if (messagesData.success) {
        setMessages(messagesData.data.messages || []);
      }

      if (workoutsData.success) {
        setWorkouts(workoutsData.data.workouts || []);
      }
    } catch (error) {
      console.error('Failed to load team details:', error);
    }
  };

  // Create team
  const createTeam = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...createFormData })
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateModal(false);
        setCreateFormData({
          name: '',
          description: '',
          type: 'RESISTANCE',
          visibility: 'PUBLIC',
          maxMembers: 20,
          aestheticSettings: DEFAULT_TEAM_AESTHETICS,
          allowComments: true,
          allowMemberInvites: true
        });
        loadTeams();
      } else {
        alert(data.error || 'Failed to create team');
      }
    } catch (error) {
      console.error('Failed to create team:', error);
      alert('Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  // Accept team application
  const acceptApplication = async (applicationId: string) => {
    if (!selectedTeam) return;

    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept-application', applicationId })
      });

      const data = await response.json();

      if (data.success) {
        loadTeamDetails(selectedTeam.id);
      } else {
        alert(data.error || 'Failed to accept application');
      }
    } catch (error) {
      console.error('Failed to accept application:', error);
    }
  };

  // Reject team application
  const rejectApplication = async (applicationId: string) => {
    if (!selectedTeam) return;

    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject-application', applicationId })
      });

      const data = await response.json();

      if (data.success) {
        loadTeamDetails(selectedTeam.id);
      } else {
        alert(data.error || 'Failed to reject application');
      }
    } catch (error) {
      console.error('Failed to reject application:', error);
    }
  };

  // Send team message
  const sendMessage = async () => {
    if (!selectedTeam || !newMessage.trim()) return;

    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send-message',
          content: newMessage,
          type: 'TEXT'
        })
      });

      const data = await response.json();

      if (data.success) {
        setNewMessage('');
        loadTeamDetails(selectedTeam.id);
      } else {
        alert(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  // Remove team member
  const removeMember = async (memberId: string) => {
    if (!selectedTeam || !confirm('Are you sure you want to remove this member?')) return;

    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}/members/manage?memberId=${memberId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        loadTeamDetails(selectedTeam.id);
      } else {
        alert(data.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  // Create team workout
  const createWorkout = async () => {
    if (!selectedTeam || !workoutFormData.title) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-workout',
          title: workoutFormData.title,
          description: workoutFormData.description,
          date: workoutFormData.date,
          duration: workoutFormData.duration ? parseInt(workoutFormData.duration) : undefined,
          exercises: workoutFormData.exercises,
          allowComments: true,
          isTemplate: false
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowWorkoutModal(false);
        setWorkoutFormData({
          title: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          duration: '',
          exercises: []
        });
        loadTeamDetails(selectedTeam.id);
        alert('Workout created successfully!');
      } else {
        alert(data.error || 'Failed to create workout');
      }
    } catch (error) {
      console.error('Failed to create workout:', error);
      alert('Failed to create workout');
    } finally {
      setLoading(false);
    }
  };

  // Generate shareable invite link
  const generateShareableLink = async () => {
    if (!selectedTeam) return;

    setGeneratingLink(true);
    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create-invite-link', expiresInDays: 30 })
      });

      const data = await response.json();

      if (data.success) {
        setShareableLink(data.data.inviteUrl);
      } else {
        alert(data.error || 'Failed to generate invite link');
      }
    } catch (error) {
      console.error('Failed to generate invite link:', error);
      alert('Failed to generate invite link');
    } finally {
      setGeneratingLink(false);
    }
  };

  // Copy link to clipboard
  const copyLinkToClipboard = async () => {
    if (!shareableLink) return;

    try {
      await navigator.clipboard.writeText(shareableLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareableLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  // Share via Web Share API (mobile)
  const shareLink = async () => {
    if (!shareableLink || !selectedTeam) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${selectedTeam.name} on Massimino`,
          text: `You've been invited to join ${selectedTeam.name}! Click to accept:`,
          url: shareableLink
        });
      } catch (error) {
        // User cancelled or share failed, fallback to copy
        copyLinkToClipboard();
      }
    } else {
      copyLinkToClipboard();
    }
  };

  // Invite user to team
  const inviteMember = async () => {
    if (!selectedTeam) return;

    // Validate based on invitation method
    if (inviteMethod === 'user-id' && !inviteUserId) {
      alert('Please enter a User ID');
      return;
    }
    if (inviteMethod === 'email' && !inviteEmail) {
      alert('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const action = inviteMethod === 'email' ? 'invite-email' : 'invite';
      const body: any = { action };

      if (inviteMethod === 'email') {
        body.email = inviteEmail;
        body.message = inviteMessage;
      } else {
        body.userId = inviteUserId;
      }

      const response = await fetch(`/api/teams/${selectedTeam.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        setShowInviteModal(false);
        setInviteUserId('');
        setInviteEmail('');
        setInviteMessage('');
        loadTeamDetails(selectedTeam.id);

        if (inviteMethod === 'email') {
          alert('Email invitation sent successfully! ✉️');
        } else {
          alert('User invited successfully!');
        }
      } else {
        alert(data.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Failed to invite user:', error);
      alert('Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  // Complete workout
  const completeWorkout = async (workoutLogId: string) => {
    if (!selectedTeam) return;

    try {
      const response = await fetch(`/api/teams/${selectedTeam.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete-workout',
          workoutLogId,
          duration: undefined,
          notes: 'Completed via team dashboard'
        })
      });

      const data = await response.json();

      if (data.success) {
        loadTeamDetails(selectedTeam.id);
        alert('Workout marked as complete! 🎉');
      } else {
        alert(data.error || 'Failed to complete workout');
      }
    } catch (error) {
      console.error('Failed to complete workout:', error);
      alert('Failed to complete workout');
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
          <p className="text-gray-600">Manage your fitness teams and members</p>
        </div>

        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              Create Team
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Team</DialogTitle>
              <DialogDescription>
                Create a new fitness team to manage your athletes and workouts.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Team Name</Label>
                <Input
                  id="name"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter team name"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your team..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="type">Team Type</Label>
                <Select
                  value={createFormData.type}
                  onValueChange={(value: TeamType) => setCreateFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESISTANCE">Resistance Training</SelectItem>
                    <SelectItem value="CIRCUITS">Circuit Training</SelectItem>
                    <SelectItem value="YOGA">Yoga</SelectItem>
                    <SelectItem value="CARDIO">Cardio</SelectItem>
                    <SelectItem value="ZUMBA">Zumba</SelectItem>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select
                    value={createFormData.visibility}
                    onValueChange={(value: TeamVisibility) => setCreateFormData(prev => ({ ...prev, visibility: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLIC">Public</SelectItem>
                      <SelectItem value="PRIVATE">Private</SelectItem>
                      <SelectItem value="INVITE_ONLY">Invite Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maxMembers">Max Members</Label>
                  <Input
                    id="maxMembers"
                    type="number"
                    min={TEAM_CONSTRAINTS.MIN_MEMBERS}
                    max={TEAM_CONSTRAINTS.MAX_MEMBERS_PER_TEAM}
                    value={createFormData.maxMembers}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, maxMembers: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="spotifyUrl">Spotify Playlist URL (Optional)</Label>
                <Input
                  id="spotifyUrl"
                  value={createFormData.spotifyPlaylistUrl || ''}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, spotifyPlaylistUrl: e.target.value }))}
                  placeholder="https://open.spotify.com/playlist/..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={createTeam} disabled={loading || !createFormData.name}>
                  {loading ? 'Creating...' : 'Create Team'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <Users size={16} />
            My Teams ({teams.length})
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2" disabled={!selectedTeam}>
            <Settings size={16} />
            Team Details
          </TabsTrigger>
        </TabsList>

        {/* Teams List Tab */}
        <TabsContent value="list" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading teams...</p>
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">You don't have any teams yet.</p>
              <Button onClick={() => setShowCreateModal(true)}>
                Create Your First Team
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {teams.map((team) => {
                const aesthetic: any = (team as any).aestheticSettings || (team as any).aesthetic_settings || {};
                const primary = aesthetic.primaryColor || aesthetic.primary_colour || '#2563eb';
                const secondary = aesthetic.secondaryColor || aesthetic.secondary_colour || '#93c5fd';
                return (
                <Card key={team.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
                  setSelectedTeam(team);
                  loadTeamDetails(team.id);
                  setActiveTab('details');
                }}>
                  <div style={{ height: 4, backgroundColor: primary }} />
                  <CardHeader className="pb-3" style={{ background: `linear-gradient(90deg, ${secondary}22, #ffffff)` }}>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg" style={{ color: primary }}>{team.name}</CardTitle>
                      <Badge variant={team.visibility === 'PUBLIC' ? 'default' : 'secondary'} style={team.visibility === 'PUBLIC' ? { backgroundColor: primary, color: '#fff' } : { backgroundColor: secondary, color: '#1f2937' }}>
                        {formatVisibility(team.visibility)}
                      </Badge>
                    </div>
                    <CardDescription className="text-gray-600">{team.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span className="flex items-center gap-1" style={{ color: primary }}>
                        <Users size={14} />
                        {team.memberCount}/{team.maxMembers} members
                      </span>
                      <span className="capitalize">{team.type.toLowerCase().replace('_', ' ')}</span>
                    </div>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Team Details Tab */}
        <TabsContent value="details" className="space-y-6">
          {selectedTeam ? (
            <div className="space-y-6">
              {/* Team Overview */}
              <Card>
                <CardHeader>
                  <div className="space-y-3">
                    <div>
                      <CardTitle>{selectedTeam.name}</CardTitle>
                      <CardDescription>{selectedTeam.description}</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => setShowInviteModal(true)} className="bg-brand-primary hover:bg-brand-primary-dark">
                        <UserPlus size={14} className="mr-1" />
                        Invite
                      </Button>
                      <Button size="sm" onClick={() => setShowWorkoutModal(true)} className="bg-brand-secondary hover:bg-brand-secondary-dark text-brand-primary">
                        <Dumbbell size={14} className="mr-1" />
                        Add Workout
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{selectedTeam.memberCount}</p>
                      <p className="text-sm text-gray-600">Members</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{applications.length}</p>
                      <p className="text-sm text-gray-600">Applications</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{messages.length}</p>
                      <p className="text-sm text-gray-600">Messages</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-orange-600">{workouts.length}</p>
                      <p className="text-sm text-gray-600">Workouts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full overflow-hidden">
                {/* Media Upload & Social Links */}
                <Card className="min-w-0">
                  <CardHeader>
                    <CardTitle>Media & Social</CardTitle>
                    <CardDescription>Upload team photos/videos and set social links</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <input id="team-media-file" type="file" className="text-sm min-w-0 max-w-full" />
                      <select id="team-media-type" className="border rounded-md p-2 text-sm">
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!selectedTeam) return;
                          const fileInput = document.getElementById('team-media-file') as HTMLInputElement;
                          const typeSelect = document.getElementById('team-media-type') as HTMLSelectElement;
                          const file = fileInput.files?.item(0);
                          if (!file) return alert('Choose a file');
                          const fd = new FormData();
                          fd.set('file', file);
                          fd.set('type', typeSelect.value);
                          try {
                            const res = await fetch(`/api/teams/${selectedTeam.id}/media`, { method: 'POST', body: fd });
                            const data = await res.json();
                            if (data.success) {
                              alert('Media uploaded');
                              loadTeamDetails(selectedTeam.id);
                              fileInput.value = '';
                            } else {
                              alert(data.error || 'Failed to upload');
                            }
                          } catch (e) {
                            console.error(e);
                            alert('Failed to upload');
                          }
                        }}
                      >Upload</Button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">Instagram URL</Label>
                        <Input
                          defaultValue={(selectedTeam as any)?.aestheticSettings?.socialLinks?.instagramUrl || ''}
                          placeholder="https://instagram.com/..."
                          onBlur={async (e) => {
                            if (!selectedTeam) return;
                            const url = e.target.value;
                            await fetch(`/api/teams/${selectedTeam.id}`, {
                              method: 'PUT', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ aesthetic_settings: { social_links: { instagram_url: url } } })
                            });
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">TikTok URL</Label>
                        <Input
                          defaultValue={(selectedTeam as any)?.aestheticSettings?.socialLinks?.tiktokUrl || ''}
                          placeholder="https://tiktok.com/@..."
                          onBlur={async (e) => {
                            if (!selectedTeam) return;
                            const url = e.target.value;
                            await fetch(`/api/teams/${selectedTeam.id}`, {
                              method: 'PUT', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ aesthetic_settings: { social_links: { tiktok_url: url } } })
                            });
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Facebook URL</Label>
                        <Input
                          defaultValue={(selectedTeam as any)?.aestheticSettings?.socialLinks?.facebookUrl || ''}
                          placeholder="https://facebook.com/..."
                          onBlur={async (e) => {
                            if (!selectedTeam) return;
                            const url = e.target.value;
                            await fetch(`/api/teams/${selectedTeam.id}`, {
                              method: 'PUT', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ aesthetic_settings: { social_links: { facebook_url: url } } })
                            });
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">YouTube URL</Label>
                        <Input
                          defaultValue={(selectedTeam as any)?.aestheticSettings?.socialLinks?.youtubeUrl || ''}
                          placeholder="https://youtube.com/@..."
                          onBlur={async (e) => {
                            if (!selectedTeam) return;
                            const url = e.target.value;
                            await fetch(`/api/teams/${selectedTeam.id}`, {
                              method: 'PUT', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ aesthetic_settings: { social_links: { youtube_url: url } } })
                            });
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                {/* Team Applications */}
                <Card className="min-w-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus size={18} />
                      Pending Applications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {applications.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No pending applications</p>
                    ) : (
                      <div className="space-y-3">
                        {applications.map((application) => (
                          <div key={application.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{application.user?.name}</p>
                              {application.message && (
                                <p className="text-sm text-gray-600">{application.message}</p>
                              )}
                              <p className="text-xs text-gray-500">
                                Applied {new Date(application.appliedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => acceptApplication(application.id)}>
                                <Check size={14} />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => rejectApplication(application.id)}>
                                <X size={14} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Team Members */}
                <Card className="min-w-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users size={18} />
                      Team Members
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedTeam.members?.map((member: any) => {
                        const isPending = member.type === 'PENDING' || !member.userId;
                        return (
                        <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              {(member.user?.name || member.name)?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{member.user?.name || member.name || member.email}</p>
                                {isPending && (
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                                    ⏳ Pending
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">
                                {isPending ? 'Invited' : 'Joined'} {new Date(member.joinedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {member.userId !== session?.user?.id && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeMember(member.userId || member.id)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Messages */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle size={18} />
                    Recent Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    {messages.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No messages yet</p>
                    ) : (
                      messages.map((message) => (
                        <div key={message.id} className="flex gap-3 p-3 border rounded-lg">
                          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                            {message.user?.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm">{message.user?.name}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(message.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <p className="text-sm">{message.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <Separator className="my-4" />

                  <div className="flex gap-2">
                    <Input
                      placeholder="Send a message to the team..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                      <Send size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Workouts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Dumbbell size={18} />
                    Recent Workouts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {workouts.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No workouts created yet</p>
                  ) : (
                    <div className="space-y-3">
                      {workouts.map((workout) => {
                        const isCompleted = workout.completions?.some(c => c.userId === session?.user?.id);
                        return (
                          <div
                            key={workout.id}
                            className="p-3 border rounded-lg bg-white hover:border-brand-primary/30 transition-colors cursor-pointer"
                            onClick={() => {
                              setSelectedWorkout(workout);
                              setShowWorkoutDetails(true);
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-brand-primary">{workout.title}</h4>
                              <p className="text-sm text-gray-600">
                                {new Date(workout.date).toLocaleDateString()}
                              </p>
                            </div>
                            {workout.description && (
                              <p className="text-sm text-gray-600 mb-2">{workout.description}</p>
                            )}
                            <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-3">
                              <span>
                                {workout.team_workout_exercises?.length || 0} exercises
                              </span>
                              <span>
                                {workout.completions?.length || 0} completions
                              </span>
                              {workout.duration && (
                                <span>{workout.duration} min</span>
                              )}
                            </div>
                            <div className="flex justify-end">
                              {isCompleted ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <Check size={12} className="mr-1" />
                                  Completed
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    completeWorkout(workout.id);
                                  }}
                                  className="h-7 text-xs border-brand-primary text-brand-primary hover:bg-brand-secondary"
                                >
                                  Mark Complete
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Select a team to view details</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Workout Creation Modal */}
      <Dialog open={showWorkoutModal} onOpenChange={setShowWorkoutModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Team Workout</DialogTitle>
            <DialogDescription>
              Create a workout for {selectedTeam?.name}. Note: For simplicity, you can add exercise details later in your workout log.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="workout-title">Workout Title *</Label>
              <Input
                id="workout-title"
                value={workoutFormData.title}
                onChange={(e) => setWorkoutFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Monday Upper Body"
                className="border-brand-primary/30 focus:border-brand-primary"
              />
            </div>

            <div>
              <Label htmlFor="workout-description">Description</Label>
              <Textarea
                id="workout-description"
                value={workoutFormData.description}
                onChange={(e) => setWorkoutFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional workout description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="workout-date">Date</Label>
                <Input
                  id="workout-date"
                  type="date"
                  value={workoutFormData.date}
                  onChange={(e) => setWorkoutFormData(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="workout-duration">Duration (minutes)</Label>
                <Input
                  id="workout-duration"
                  type="number"
                  value={workoutFormData.duration}
                  onChange={(e) => setWorkoutFormData(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="e.g., 60"
                />
              </div>
            </div>

            <div className="bg-brand-secondary/20 border border-brand-primary/20 rounded-lg p-4">
              <p className="text-sm text-brand-primary">
                <strong>Note:</strong> This creates a basic workout entry. Team members can then complete it and add their exercise details. Full exercise management coming soon!
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowWorkoutModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={createWorkout}
                disabled={loading || !workoutFormData.title}
                className="bg-brand-primary hover:bg-brand-primary-dark text-white"
              >
                {loading ? 'Creating...' : 'Create Workout'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Workout Details Modal */}
      <Dialog open={showWorkoutDetails} onOpenChange={setShowWorkoutDetails}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedWorkout?.title}</DialogTitle>
            <DialogDescription>
              {selectedWorkout?.date && new Date(selectedWorkout.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedWorkout?.description && (
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-gray-600">{selectedWorkout.description}</p>
              </div>
            )}

            {selectedWorkout?.duration && (
              <div className="flex gap-4 text-sm">
                <span className="text-gray-600">
                  <strong>Duration:</strong> {selectedWorkout.duration} minutes
                </span>
              </div>
            )}

            <div>
              <h4 className="font-medium mb-3">Exercises ({selectedWorkout?.team_workout_exercises?.length || 0})</h4>
              {selectedWorkout?.team_workout_exercises && selectedWorkout.team_workout_exercises.length > 0 ? (
                <div className="space-y-3">
                  {selectedWorkout.team_workout_exercises.map((exercise, idx) => (
                    <div key={exercise.id} className="p-3 border rounded-lg bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-500">#{idx + 1}</span>
                            <h5 className="font-medium">{exercise.exercises?.name}</h5>
                          </div>
                          <div className="flex gap-4 text-sm text-gray-600">
                            <span><strong>Sets:</strong> {exercise.sets}</span>
                            <span><strong>Reps:</strong> {exercise.reps}</span>
                            {exercise.weight && <span><strong>Weight:</strong> {exercise.weight}</span>}
                            {exercise.restSeconds && <span><strong>Rest:</strong> {exercise.restSeconds}s</span>}
                          </div>
                          {exercise.notes && (
                            <p className="text-sm text-gray-600 mt-2 italic">{exercise.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No exercises added yet</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowWorkoutDetails(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Member Invitation Modal */}
      <Dialog open={showInviteModal} onOpenChange={(open) => {
        setShowInviteModal(open);
        if (!open) {
          setShareableLink(null);
          setShowQrCode(false);
          setLinkCopied(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invite Member to {selectedTeam?.name}</DialogTitle>
            <DialogDescription>
              Choose how you'd like to invite someone to your team
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Invitation Method Tabs */}
            <div className="flex flex-wrap gap-1 border-b border-gray-200">
              <button
                type="button"
                onClick={() => setInviteMethod('link')}
                className={`px-3 py-2 border-b-2 font-medium transition-colors text-sm ${
                  inviteMethod === 'link'
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Link2 size={14} className="inline mr-1" />
                Share Link
              </button>
              <button
                type="button"
                onClick={() => setInviteMethod('email')}
                className={`px-3 py-2 border-b-2 font-medium transition-colors text-sm ${
                  inviteMethod === 'email'
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-1">📧</span>
                Email
              </button>
              <button
                type="button"
                onClick={() => setInviteMethod('user-id')}
                className={`px-3 py-2 border-b-2 font-medium transition-colors text-sm ${
                  inviteMethod === 'user-id'
                    ? 'border-brand-primary text-brand-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-1">🔑</span>
                User ID
              </button>
            </div>

            {/* Shareable Link Tab */}
            {inviteMethod === 'link' && (
              <div className="space-y-4">
                <div className="bg-brand-secondary/30 border border-brand-primary/20 rounded-lg p-4">
                  <p className="text-sm text-brand-primary">
                    <strong><Link2 size={14} className="inline mr-1" /> Shareable Link:</strong> Generate a unique invite link you can share via WhatsApp, SMS, or any messaging app. Anyone with the link can join your team.
                  </p>
                </div>

                {!shareableLink ? (
                  <div className="text-center py-6">
                    <Button
                      onClick={generateShareableLink}
                      disabled={generatingLink}
                      className="bg-brand-primary hover:bg-brand-primary-dark text-white"
                    >
                      {generatingLink ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Link2 size={16} className="mr-2" />
                          Generate Invite Link
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">Link expires in 30 days</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Link Display */}
                    <div>
                      <Label>Your Invite Link</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={shareableLink}
                          readOnly
                          className="bg-gray-50 text-sm font-mono"
                        />
                        <Button
                          onClick={copyLinkToClipboard}
                          variant="outline"
                          className={linkCopied ? 'bg-green-50 border-green-500 text-green-700' : ''}
                        >
                          {linkCopied ? <Check size={16} /> : <Copy size={16} />}
                        </Button>
                      </div>
                      {linkCopied && (
                        <p className="text-xs text-green-600 mt-1">Link copied to clipboard!</p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={shareLink}
                        className="bg-brand-primary hover:bg-brand-primary-dark text-white flex-1"
                      >
                        <Share2 size={16} className="mr-2" />
                        Share
                      </Button>
                      <Button
                        onClick={() => setShowQrCode(!showQrCode)}
                        variant="outline"
                        className="flex-1"
                      >
                        <QrCode size={16} className="mr-2" />
                        {showQrCode ? 'Hide' : 'Show'} QR Code
                      </Button>
                    </div>

                    {/* QR Code Display */}
                    {showQrCode && (
                      <div className="flex flex-col items-center p-4 bg-white border rounded-lg">
                        <QRCodeSVG
                          value={shareableLink}
                          size={200}
                          level="M"
                          includeMargin
                          className="mb-3"
                        />
                        <p className="text-xs text-gray-500 text-center">
                          Scan to join {selectedTeam?.name}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            // Download QR code as image
                            const svg = document.querySelector('.qr-code-container svg') as SVGElement;
                            if (svg) {
                              const svgData = new XMLSerializer().serializeToString(svg);
                              const canvas = document.createElement('canvas');
                              const ctx = canvas.getContext('2d');
                              const img = new Image();
                              img.onload = () => {
                                canvas.width = img.width;
                                canvas.height = img.height;
                                ctx?.drawImage(img, 0, 0);
                                const link = document.createElement('a');
                                link.download = `${selectedTeam?.name}-invite-qr.png`;
                                link.href = canvas.toDataURL('image/png');
                                link.click();
                              };
                              img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                            }
                          }}
                        >
                          Download QR Code
                        </Button>
                      </div>
                    )}

                    {/* Generate New Link */}
                    <div className="text-center pt-2 border-t">
                      <button
                        onClick={generateShareableLink}
                        className="text-sm text-brand-primary hover:underline"
                        disabled={generatingLink}
                      >
                        Generate a new link
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Email Invitation Form */}
            {inviteMethod === 'email' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="invite-email">Email Address *</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="member@example.com"
                    className="border-brand-primary/30 focus:border-brand-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    An invitation link will be sent to this email address
                  </p>
                </div>

                <div>
                  <Label htmlFor="invite-message">Personal Message (Optional)</Label>
                  <textarea
                    id="invite-message"
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="Add a personal message to your invitation..."
                    rows={3}
                    maxLength={500}
                    className="w-full px-3 py-2 border border-brand-primary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {inviteMessage.length}/500 characters
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>⚠️ Note:</strong> Email invitations may not work in all environments. We recommend using the <strong>Share Link</strong> option for reliable delivery.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={inviteMember}
                    disabled={loading || !inviteEmail}
                    className="bg-brand-primary hover:bg-brand-primary-dark text-white"
                  >
                    {loading ? 'Sending...' : 'Send Email Invitation'}
                  </Button>
                </div>
              </div>
            )}

            {/* User ID Invitation Form */}
            {inviteMethod === 'user-id' && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="invite-userid">User ID *</Label>
                  <Input
                    id="invite-userid"
                    value={inviteUserId}
                    onChange={(e) => setInviteUserId(e.target.value)}
                    placeholder="Enter user ID (e.g., cmg69x38e0004vrt3jx8xfkh6)"
                    className="border-brand-primary/30 focus:border-brand-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The user will be directly added to your team
                  </p>
                </div>

                <div className="bg-brand-secondary/30 border border-brand-primary/20 rounded-lg p-4">
                  <p className="text-sm text-brand-primary">
                    <strong>🔑 User ID:</strong> Use this method if you already know the Massimino User ID. You can find user IDs in Admin → Users, or ask users to share their profile link.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowInviteModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={inviteMember}
                    disabled={loading || !inviteUserId}
                    className="bg-brand-primary hover:bg-brand-primary-dark text-white"
                  >
                    {loading ? 'Sending...' : 'Send Invite'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
