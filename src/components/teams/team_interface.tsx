// src/components/teams/team_interface.tsx

'use client';

/**
 * Team Interface Component - Universal team interface
 * Contains: Team discovery (client browsing), profile editor, application management, trainer dashboard widgets
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Team, TeamType, TeamDiscoveryFilters, TeamApplication,
  TeamAestheticSettings, DEFAULT_TEAM_AESTHETICS
} from '@/types/teams';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Icons
import { Search, Users, Star, UserPlus, Palette, Music } from 'lucide-react';

interface TeamInterfaceProps {
  className?: string;
  mode?: 'discovery' | 'profile-editor' | 'applications' | 'dashboard-widget';
  teamId?: string;
}

export function TeamInterface({
  className,
  mode = 'discovery',
  teamId
}: TeamInterfaceProps) {
  const { data: session } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<TeamApplication[]>([]);

  // Discovery filters
  const [filters, setFilters] = useState<TeamDiscoveryFilters>({
    searchQuery: '',
    type: [],
    trainerVerified: false,
    hasSpots: true
  });

  // Profile editor state
  const [aestheticSettings, setAestheticSettings] = useState<TeamAestheticSettings>(DEFAULT_TEAM_AESTHETICS);
  const [spotifyUrl, setSpotifyUrl] = useState('');

  // Application message state
  const [applicationMessage, setApplicationMessage] = useState('');

  // Team discovery
  const discoverTeams = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('action', 'discovery');

      if (filters.searchQuery) params.append('search', filters.searchQuery);
      if (filters.type && filters.type.length > 0) params.append('type', filters.type.join(','));
      if (filters.trainerVerified) params.append('trainerVerified', 'true');
      if (filters.hasSpots) params.append('hasSpots', 'true');

      const response = await fetch(`/api/teams?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setTeams(data.data.teams);
      }
    } catch (error) {
      console.error('Failed to discover teams:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply to join team
  const applyToTeam = async (team: Team) => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply',
          teamId: team.id,
          message: applicationMessage
        })
      });

      const data = await response.json();

      if (data.success) {
        setApplicationMessage('');
        alert('Application submitted successfully!');
      } else {
        alert(data.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Failed to apply to team:', error);
      alert('Failed to submit application');
    }
  };

  // Load team for profile editing
  const loadTeamForEditing = async () => {
    if (!teamId) return;

    try {
      const response = await fetch(`/api/teams/${teamId}`);
      const data = await response.json();

      if (data.success) {
        setSelectedTeam(data.data);
        setAestheticSettings(data.data.aestheticSettings || DEFAULT_TEAM_AESTHETICS);
        setSpotifyUrl(data.data.spotifyPlaylistUrl || '');
      }
    } catch (error) {
      console.error('Failed to load team:', error);
    }
  };

  // Update team aesthetic settings
  const updateTeamAesthetics = async () => {
    if (!teamId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aestheticSettings,
          spotifyPlaylistUrl: spotifyUrl
        })
      });

      const data = await response.json();

      if (data.success) {
        alert('Team profile updated successfully!');
        setSelectedTeam(data.data);
      } else {
        alert(data.error || 'Failed to update team profile');
      }
    } catch (error) {
      console.error('Failed to update team:', error);
      alert('Failed to update team profile');
    } finally {
      setLoading(false);
    }
  };

  // Load user's applications
  const loadUserApplications = async () => {
    if (!session?.user?.id) return;

    try {
      // This would require a new API endpoint for user's applications
      // For now, we'll show a placeholder
      setApplications([]);
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
  };

  useEffect(() => {
    if (mode === 'discovery') {
      discoverTeams();
    } else if (mode === 'profile-editor' && teamId) {
      loadTeamForEditing();
    } else if (mode === 'applications') {
      loadUserApplications();
    }
  }, [mode, teamId, filters]);

  // Team Discovery Component
  const TeamDiscovery = () => (
    <div className="space-y-6">
      {/* Trainer/Admin toolbar */}
      {session?.user?.role && (session.user.role === 'TRAINER' || session.user.role === 'ADMIN') && (
        <div className="flex justify-end">
          <Link href="/dashboard" className="text-sm underline text-blue-600 hover:text-blue-700">
            Manage my teams →
          </Link>
        </div>
      )}
      {/* Search and Filters */}
      <Card className="border-brand-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-white">
            <Search size={18} />
            Discover Teams
          </CardTitle>
          <CardDescription className="text-brand-secondary">
            Find and join fitness teams that match your interests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              placeholder="Search teams..."
              value={filters.searchQuery || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="mb-4 border-brand-primary/30 focus:border-brand-primary focus:ring-brand-primary"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Team Type</Label>
              <Select onValueChange={(value: string) =>
                setFilters(prev => ({
                  ...prev,
                  type: value === 'ALL' ? [] : [value as TeamType]
                }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="RESISTANCE">Resistance</SelectItem>
                  <SelectItem value="CIRCUITS">Circuits</SelectItem>
                  <SelectItem value="YOGA">Yoga</SelectItem>
                  <SelectItem value="CARDIO">Cardio</SelectItem>
                  <SelectItem value="ZUMBA">Zumba</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="verified-trainers"
                checked={filters.trainerVerified}
                onChange={(e) => setFilters(prev => ({ ...prev, trainerVerified: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="verified-trainers">Verified trainers only</Label>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="has-spots"
                checked={filters.hasSpots}
                onChange={(e) => setFilters(prev => ({ ...prev, hasSpots: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="has-spots">Available spots</Label>
            </div>
          </div>

          <Button onClick={discoverTeams} className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white">
            Search Teams
          </Button>
        </CardContent>
      </Card>

      {/* Teams Results */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-brand-primary-light">Searching for teams...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-brand-primary/40 mb-4" />
            <p className="text-brand-primary-light">No teams found matching your criteria</p>
          </div>
        ) : (
          teams.map((team) => {
            const aesthetic = (team as any).aestheticSettings || (team as any).aesthetic_settings || {};
            const primary = aesthetic.primaryColor || aesthetic.primary_colour || '#2563eb';
            const secondary = aesthetic.secondaryColor || aesthetic.secondary_colour || '#93c5fd';
            const bannerStyle: React.CSSProperties = { backgroundColor: primary };
            return (
            <Card key={team.id} className="hover:shadow-lg transition-shadow" style={{ borderColor: primary + '33', borderWidth: 1 }}>
              {/* Accent banner */}
              <div style={bannerStyle} className="h-1 w-full rounded-t"/>
              <CardHeader className="border-b" style={{ background: `linear-gradient(90deg, ${secondary}22, #ffffff)` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2" style={{ color: primary }}>
                      {team.name}
                      {team.trainer?.trainerVerified && (
                        <Star className="h-4 w-4 text-yellow-500" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-gray-600">{team.description}</CardDescription>
                  </div>
                  <Badge variant={team.visibility === 'PUBLIC' ? 'default' : 'secondary'}
                         style={team.visibility === 'PUBLIC' ? { backgroundColor: primary, color: '#fff' } : { backgroundColor: secondary, color: '#1f2937' }}>
                    {team.visibility}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1" style={{ color: primary }}>
                        <Users size={14} />
                        {team.memberCount}/{team.maxMembers}
                      </span>
                      <span className="capitalize text-gray-600">
                        {team.type.toLowerCase().replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <img
                        src={team.trainer?.image || '/massimino-logo.svg'}
                        alt={team.trainer?.name || 'Trainer'}
                        className="w-5 h-5 rounded-full border"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/massimino-logo.svg'; }}
                      />
                      <span className="text-sm">{team.trainer?.name}</span>
                    </div>
                  </div>

                  {team.spotifyPlaylistUrl && (
                    <div className="flex items-center gap-2 text-sm" style={{ color: primary }}>
                      <Music size={14} />
                      <span>Has team playlist</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm">
                      {team.memberCount < team.maxMembers ? (
                        <span className="text-green-600 font-medium">Open spots available</span>
                      ) : (
                        <span className="text-red-600 font-medium">Team is full</span>
                      )}
                    </span>

                    {session?.user?.id && team.memberCount < team.maxMembers && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="text-white" style={{ backgroundColor: primary }}>
                            <UserPlus size={14} className="mr-1" />
                            Apply
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Apply to join {team.name}</DialogTitle>
                            <DialogDescription>
                              Send a message to the trainer explaining why you'd like to join this team.
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="message">Application Message (Optional)</Label>
                              <Input
                                id="message"
                                value={applicationMessage}
                                onChange={(e) => setApplicationMessage(e.target.value)}
                                placeholder="Why would you like to join this team?"
                              />
                            </div>

                            <div className="flex justify-end gap-2">
                              <Button variant="outline">
                                Cancel
                              </Button>
                              <Button onClick={() => applyToTeam(team)}>
                                Submit Application
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  <div className="flex justify-end gap-3 pt-1">
                    <Link href={`/teams/${team.id}`} className="text-sm underline" style={{ color: primary }}>
                      View team
                    </Link>
                  </div>

                  {/* Trainer/Admin quick actions for management */}
                  {(session?.user?.role === 'ADMIN' || session?.user?.id === team.trainer?.id) && (
                    <div className="flex gap-2 justify-end pt-2">
                      <a href="/dashboard" className="text-sm underline">Edit</a>
                      <button
                        className="text-sm text-red-600 underline"
                        onClick={async () => {
                          if (!confirm('Delete this team? This will deactivate the team.')) return;
                          try {
                            const res = await fetch(`/api/teams/${team.id}`, { method: 'DELETE' });
                            const data = await res.json();
                            if (res.ok && data.success) {
                              alert('Team deleted successfully');
                              discoverTeams();
                            } else {
                              alert(data.error || 'Failed to delete team');
                            }
                          } catch (err) {
                            console.error(err);
                            alert('Failed to delete team');
                          }
                        }}
                      >Delete</button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            );
          })
        )}
      </div>
    </div>
  );

  // Team Profile Editor Component
  const TeamProfileEditor = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette size={18} />
            Team Customisation
          </CardTitle>
          <CardDescription>
            Customise your team's appearance and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Colour Customisation */}
          <div>
            <Label className="text-base font-medium mb-3 block">Colours</Label>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="primary-colour">Primary Colour</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="primary-colour"
                    type="color"
                    value={aestheticSettings.primaryColor}
                    onChange={(e) => setAestheticSettings(prev => ({
                      ...prev,
                      primaryColor: e.target.value
                    }))}
                    className="w-12 h-10"
                  />
                  <Input
                    value={aestheticSettings.primaryColor}
                    onChange={(e) => setAestheticSettings(prev => ({
                      ...prev,
                      primaryColor: e.target.value
                    }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="secondary-colour">Secondary Colour</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="secondary-colour"
                    type="color"
                    value={aestheticSettings.secondaryColor}
                    onChange={(e) => setAestheticSettings(prev => ({
                      ...prev,
                      secondaryColor: e.target.value
                    }))}
                    className="w-12 h-10"
                  />
                  <Input
                    value={aestheticSettings.secondaryColor}
                    onChange={(e) => setAestheticSettings(prev => ({
                      ...prev,
                      secondaryColor: e.target.value
                    }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="background-colour">Background Colour</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="background-colour"
                    type="color"
                    value={aestheticSettings.backgroundColor}
                    onChange={(e) => setAestheticSettings(prev => ({
                      ...prev,
                      backgroundColor: e.target.value
                    }))}
                    className="w-12 h-10"
                  />
                  <Input
                    value={aestheticSettings.backgroundColor}
                    onChange={(e) => setAestheticSettings(prev => ({
                      ...prev,
                      backgroundColor: e.target.value
                    }))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Typography and Theme */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="font-style">Font Style</Label>
              <Select
                value={aestheticSettings.fontStyle}
                onValueChange={(value: 'modern' | 'classic' | 'sporty' | 'elegant') =>
                  setAestheticSettings(prev => ({ ...prev, fontStyle: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modern">Modern</SelectItem>
                  <SelectItem value="classic">Classic</SelectItem>
                  <SelectItem value="sporty">Sporty</SelectItem>
                  <SelectItem value="elegant">Elegant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={aestheticSettings.theme}
                onValueChange={(value: 'light' | 'dark' | 'auto') =>
                  setAestheticSettings(prev => ({ ...prev, theme: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Spotify Integration */}
          <div>
            <Label htmlFor="spotify-url" className="flex items-center gap-2">
              <Music size={16} />
              Team Playlist
            </Label>
            <Input
              id="spotify-url"
              value={spotifyUrl}
              onChange={(e) => setSpotifyUrl(e.target.value)}
              placeholder="https://open.spotify.com/playlist/..."
            />
            <p className="text-sm text-gray-500 mt-1">
              Add a Spotify playlist for your team workouts
            </p>
          </div>

          {/* Animations */}
          <div className="space-y-2">
            <Label className="text-base font-medium mb-1 block">Animations</Label>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="card-hover"
                  className="rounded"
                  checked={Boolean(aestheticSettings?.animations?.enableCardHover)}
                  onChange={(e) => setAestheticSettings(prev => ({
                    ...prev,
                    animations: { ...(prev as any)?.animations, enableCardHover: e.target.checked }
                  }))}
                />
                <Label htmlFor="card-hover">Card hover effect</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="banner-wave"
                  className="rounded"
                  checked={Boolean(aestheticSettings?.animations?.enableBannerWave)}
                  onChange={(e) => setAestheticSettings(prev => ({
                    ...prev,
                    animations: { ...(prev as any)?.animations, enableBannerWave: e.target.checked }
                  }))}
                />
                <Label htmlFor="banner-wave">Banner wave animation</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="section-fade"
                  className="rounded"
                  checked={Boolean(aestheticSettings?.animations?.enableSectionFade)}
                  onChange={(e) => setAestheticSettings(prev => ({
                    ...prev,
                    animations: { ...(prev as any)?.animations, enableSectionFade: e.target.checked }
                  }))}
                />
                <Label htmlFor="section-fade">Section fade</Label>
              </div>
            </div>
            <p className="text-xs text-gray-500">Animations respect reduced motion preferences.</p>
          </div>

          <Button onClick={updateTeamAesthetics} disabled={loading} className="w-full">
            {loading ? 'Updating...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>See how your team customisation looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`p-6 rounded-lg border-2 ${aestheticSettings?.animations?.enableCardHover ? 'transition-transform hover:scale-[1.01]' : ''} ${aestheticSettings?.animations?.enableSectionFade ? 'animate-fadeIn' : ''}`}
            style={{
              backgroundColor: aestheticSettings.backgroundColor,
              borderColor: aestheticSettings.primaryColor
            }}
          >
            <h3
              className={`text-xl font-bold mb-2 ${aestheticSettings?.animations?.enableBannerWave ? 'animate-slideUp' : ''}`}
              style={{
                color: aestheticSettings.primaryColor,
                fontFamily: aestheticSettings.fontStyle === 'sporty' ? 'Arial Black' :
                          aestheticSettings.fontStyle === 'elegant' ? 'serif' : 'sans-serif'
              }}
            >
              {selectedTeam?.name || 'Your Team Name'}
            </h3>
            <p style={{ color: aestheticSettings.secondaryColor }}>
              This is how your team will look with the current settings.
            </p>
            {spotifyUrl && (
              <div className="flex items-center gap-2 mt-3 text-green-600">
                <Music size={16} />
                <span className="text-sm">Team playlist connected</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render different components based on mode
  if (mode === 'discovery') {
    return <div className={className}>{TeamDiscovery()}</div>;
  }

  if (mode === 'profile-editor') {
    return <div className={className}>{TeamProfileEditor()}</div>;
  }

  if (mode === 'applications') {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle>My Team Applications</CardTitle>
            <CardDescription>Track your team application status</CardDescription>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No applications submitted</p>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div key={app.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{app.team?.name}</h4>
                        <p className="text-sm text-gray-600">{app.message}</p>
                      </div>
                      <Badge variant={
                        app.status === 'PENDING' ? 'default' :
                        app.status === 'APPROVED' ? 'default' : 'secondary'
                      }>
                        {app.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dashboard widget mode
  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={18} />
            Teams Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{teams.length}</p>
              <p className="text-sm text-gray-600">Active Teams</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {teams.reduce((sum, team) => sum + team.memberCount, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Members</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
