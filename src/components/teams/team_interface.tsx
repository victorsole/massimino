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

// Animation
import { motion } from 'framer-motion';
import { fadeInVariants, staggerContainerVariants, staggerItemVariants } from '@/lib/animations/variants';
import { useReducedMotion } from '@/hooks/use_reduced_motion';

// Icons
import { Search, Users, Star, UserPlus, Palette, Music, ArrowRight } from 'lucide-react';

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
  const prefersReducedMotion = useReducedMotion();
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
    <div className="space-y-8">
      {/* Trainer/Admin toolbar */}
      {session?.user?.role && (session.user.role === 'TRAINER' || session.user.role === 'ADMIN') && (
        <div className="flex justify-end">
          <Link href="/dashboard" className="font-body text-sm text-[#2b5069] hover:text-[#1e3d52] flex items-center gap-1 transition-colors">
            Manage my teams <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Search and Filters */}
      <motion.div
        variants={!prefersReducedMotion ? fadeInVariants : undefined}
        initial={!prefersReducedMotion ? "hidden" : undefined}
        animate={!prefersReducedMotion ? "visible" : undefined}
        transition={{ delay: 0.1 }}
      >
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          {/* Search input */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search teams by name, trainer, or type..."
              value={filters.searchQuery || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="pl-12 h-12 rounded-xl bg-gray-50/50 border-gray-200 focus:border-[#2b5069] focus:ring-[#2b5069] text-sm"
            />
          </div>

          {/* Filters row */}
          <div className="mt-4 flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 w-full sm:w-auto">
              <Label className="text-xs font-body text-gray-500 uppercase tracking-wider mb-1.5 block">Type</Label>
              <Select onValueChange={(value: string) =>
                setFilters(prev => ({
                  ...prev,
                  type: value === 'ALL' ? [] : [value as TeamType]
                }))
              }>
                <SelectTrigger className="h-10 rounded-lg border-gray-200">
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

            <div className="flex items-center gap-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.trainerVerified}
                  onChange={(e) => setFilters(prev => ({ ...prev, trainerVerified: e.target.checked }))}
                  className="rounded border-gray-300 text-[#2b5069] focus:ring-[#2b5069]"
                />
                <span className="text-sm font-body text-gray-600">Verified only</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.hasSpots}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasSpots: e.target.checked }))}
                  className="rounded border-gray-300 text-[#2b5069] focus:ring-[#2b5069]"
                />
                <span className="text-sm font-body text-gray-600">Open spots</span>
              </label>
            </div>

            <Button
              onClick={discoverTeams}
              className="bg-[#2b5069] hover:bg-[#1e3d52] text-white h-10 px-6 rounded-lg font-display uppercase tracking-wider text-xs w-full sm:w-auto"
            >
              Search
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Teams Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
              <div className="h-0.5 bg-gray-200" />
              <div className="p-5 space-y-4">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-4/5" />
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full" />
                <div className="flex justify-between items-center pt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-full" />
                    <div className="h-3 bg-gray-200 rounded w-20" />
                  </div>
                  <div className="h-8 bg-gray-200 rounded-lg w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="font-display text-lg font-bold text-[#2b5069] mb-1">No teams found</h3>
          <p className="font-body text-sm text-gray-500 mb-6">Try adjusting your search or filters</p>
          <Button
            variant="outline"
            onClick={() => {
              setFilters({ searchQuery: '', type: [], trainerVerified: false, hasSpots: true });
            }}
            className="rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={!prefersReducedMotion ? staggerContainerVariants : undefined}
          initial={!prefersReducedMotion ? "hidden" : undefined}
          animate={!prefersReducedMotion ? "visible" : undefined}
        >
          {teams.map((team) => {
            const aesthetic = (team as any).aestheticSettings || (team as any).aesthetic_settings || {};
            const primary = aesthetic.primaryColor || aesthetic.primary_colour || '#2b5069';
            const capacityPercent = team.maxMembers > 0 ? (team.memberCount / team.maxMembers) * 100 : 0;
            const isNearFull = capacityPercent >= 90;

            return (
              <motion.div
                key={team.id}
                variants={!prefersReducedMotion ? staggerItemVariants : undefined}
                whileHover={!prefersReducedMotion ? { y: -6 } : undefined}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                className="group"
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                  {/* Accent stripe */}
                  <div className="h-0.5" style={{ backgroundColor: primary }} />

                  <div className="p-5 flex-1 flex flex-col">
                    {/* Header: name + type */}
                    <div className="mb-3">
                      <h3 className="font-display text-lg font-bold text-[#2b5069] leading-tight">
                        {team.name}
                      </h3>
                      <p className="text-[10px] font-body uppercase tracking-wider text-gray-400 mt-0.5">
                        {team.type.toLowerCase().replace('_', ' ')}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="font-body text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                      {team.description || 'No description provided.'}
                    </p>

                    {/* Member progress bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-body text-gray-400">{team.memberCount}/{team.maxMembers} members</span>
                        {team.memberCount >= team.maxMembers && (
                          <span className="text-[10px] font-display uppercase tracking-wider text-red-500">Full</span>
                        )}
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(capacityPercent, 100)}%`,
                            backgroundColor: isNearFull ? '#ef4444' : primary
                          }}
                        />
                      </div>
                    </div>

                    {/* Trainer + visibility row */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <img
                          src={team.trainer?.image || '/massimino-logo.svg'}
                          alt={team.trainer?.name || 'Trainer'}
                          className="w-6 h-6 rounded-full border border-gray-200"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/massimino-logo.svg'; }}
                        />
                        <span className="font-body text-sm text-gray-600">{team.trainer?.name}</span>
                        {team.trainer?.trainerVerified && (
                          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                        )}
                      </div>
                      <span
                        className="text-[10px] font-display uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: primary + '15',
                          color: primary
                        }}
                      >
                        {team.visibility === 'INVITE_ONLY' ? 'Invite Only' : team.visibility === 'PUBLIC' ? 'Public' : 'Private'}
                      </span>
                    </div>

                    {/* Actions row */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <Link
                        href={`/teams/${team.id}`}
                        className="font-body text-sm text-gray-500 hover:text-[#2b5069] flex items-center gap-1 transition-colors"
                      >
                        View team <ArrowRight size={14} />
                      </Link>

                      {session?.user?.id && team.memberCount < team.maxMembers && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="text-white text-xs font-display uppercase tracking-wider rounded-lg h-8 px-4"
                              style={{ backgroundColor: primary }}
                            >
                              Apply
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Apply to join {team.name}</DialogTitle>
                              <DialogDescription>
                                Send a message to the trainer explaining why you&apos;d like to join this team.
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
                                <Button variant="outline">Cancel</Button>
                                <Button onClick={() => applyToTeam(team)} className="bg-[#2b5069] hover:bg-[#1e3d52] text-white">
                                  Submit Application
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>

                    {/* Trainer/Admin quick actions */}
                    {(session?.user?.role === 'ADMIN' || session?.user?.id === team.trainer?.id) && (
                      <div className="flex gap-3 justify-end pt-2 mt-2 border-t border-gray-50">
                        <a href="/dashboard" className="text-xs font-body text-gray-400 hover:text-[#2b5069] transition-colors">Edit</a>
                        <button
                          className="text-xs font-body text-red-400 hover:text-red-600 transition-colors"
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
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
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
