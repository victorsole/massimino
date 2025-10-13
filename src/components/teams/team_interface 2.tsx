// src/components/teams/team_interface.tsx

'use client';

/**
 * Team Interface Component - Universal team interface
 * Contains: Team discovery (client browsing), profile editor, application management, trainer dashboard widgets
 */

import React, { useState, useEffect } from 'react';
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
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search size={18} />
            Discover Teams
          </CardTitle>
          <CardDescription>
            Find and join fitness teams that match your interests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              placeholder="Search teams..."
              value={filters.searchQuery || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="mb-4"
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

          <Button onClick={discoverTeams} className="w-full">
            Search Teams
          </Button>
        </CardContent>
      </Card>

      {/* Teams Results */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Searching for teams...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No teams found matching your criteria</p>
          </div>
        ) : (
          teams.map((team) => (
            <Card key={team.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {team.name}
                      {team.trainer?.trainerVerified && (
                        <Star className="h-4 w-4 text-yellow-500" />
                      )}
                    </CardTitle>
                    <CardDescription>{team.description}</CardDescription>
                  </div>
                  <Badge variant={team.visibility === 'PUBLIC' ? 'default' : 'secondary'}>
                    {team.visibility}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {team.memberCount}/{team.maxMembers}
                      </span>
                      <span className="capitalize">
                        {team.type.toLowerCase().replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <img
                        src={team.trainer?.image || '/default-avatar.png'}
                        alt={team.trainer?.name}
                        className="w-5 h-5 rounded-full"
                      />
                      <span className="text-sm">{team.trainer?.name}</span>
                    </div>
                  </div>

                  {team.spotifyPlaylistUrl && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Music size={14} />
                      <span>Has team playlist</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {team.memberCount < team.maxMembers ? (
                        <span className="text-green-600">Open spots available</span>
                      ) : (
                        <span className="text-red-600">Team is full</span>
                      )}
                    </span>

                    {session?.user?.id && team.memberCount < team.maxMembers && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm">
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
                </div>
              </CardContent>
            </Card>
          ))
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
            Team Customization
          </CardTitle>
          <CardDescription>
            Customize your team's appearance and settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Color Customization */}
          <div>
            <Label className="text-base font-medium mb-3 block">Colors</Label>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="primary-color"
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
                <Label htmlFor="secondary-color">Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="secondary-color"
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
                <Label htmlFor="background-color">Background Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="background-color"
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

          <Button onClick={updateTeamAesthetics} disabled={loading} className="w-full">
            {loading ? 'Updating...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>See how your team customization looks</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="p-6 rounded-lg border-2"
            style={{
              backgroundColor: aestheticSettings.backgroundColor,
              borderColor: aestheticSettings.primaryColor
            }}
          >
            <h3
              className="text-xl font-bold mb-2"
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