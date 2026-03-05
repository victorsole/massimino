// src/app/teams/[id]/page.tsx
import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';
import { Users, Music, ArrowLeft, CheckCircle, Dumbbell, Clock, Target } from 'lucide-react';

// Dynamic imports for client components
const TeamMembersLogs = dynamic(
  () => import('@/components/teams/team_members_logs').then(mod => mod.TeamMembersLogs),
  { ssr: false, loading: () => <div className="p-4 text-gray-500">Loading...</div> }
);

const TeamJoinButton = dynamic(
  () => import('@/components/teams/team_join_button').then(mod => mod.TeamJoinButton),
  { ssr: false, loading: () => <div className="h-10 w-24 bg-white/20 animate-pulse rounded-lg"></div> }
);

const TeamShareButton = dynamic(
  () => import('@/components/teams/team_share_button').then(mod => mod.TeamShareButton),
  { ssr: false, loading: () => <div className="h-10 w-24 bg-white/20 animate-pulse rounded-lg"></div> }
);

async function get_team_details(team_id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/teams/${team_id}?action=details`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.success) return data.data;
    return null;
  } catch {
    return null;
  }
}

// Map team program IDs to template files
const TEAM_PROGRAM_MAP: Record<string, string> = {
  castellers: 'castellers.json',
  'i-just-became-a-mum': 'i_just_became_a_mum.json',
  'i-just-became-a-dad': 'i_just_became_a_dad.json',
};

function loadTeamProgram(programId: string): any | null {
  const filename = TEAM_PROGRAM_MAP[programId];
  if (!filename) return null;
  try {
    const templatePath = path.join(process.cwd(), 'src', 'templates', filename);
    if (fs.existsSync(templatePath)) {
      return JSON.parse(fs.readFileSync(templatePath, 'utf-8'));
    }
  } catch { /* ignore */ }
  return null;
}

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const team = await get_team_details(id);

  if (!team) {
    return (
      <div className="min-h-screen bg-[#fcfaf5] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="font-display text-xl font-bold text-[#2b5069] mb-2">Team not found</h2>
          <p className="font-body text-sm text-gray-500 mb-6">This team may have been removed or the link is incorrect.</p>
          <Link
            href="/teams/discover"
            className="inline-flex items-center gap-2 bg-[#2b5069] text-white px-5 py-2.5 rounded-lg font-display text-sm uppercase tracking-wider hover:bg-[#1e3d52] transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Discovery
          </Link>
        </div>
      </div>
    );
  }

  const aesthetic = team.aestheticSettings || team.aesthetic_settings || {};
  const primary = aesthetic.primaryColor || aesthetic.primary_colour || '#2b5069';
  const secondary = aesthetic.secondaryColor || aesthetic.secondary_colour || '#93c5fd';
  const background = aesthetic.backgroundColor || aesthetic.background_colour || '#ffffff';
  const coverImage: string | null = aesthetic.coverImage || null;
  const social = aesthetic.socialLinks || aesthetic.social_links || {};
  const gallery: Array<{ type: string; url: string }> = aesthetic.gallery || [];
  const trainer = team.trainer || {};
  const teamProgram = aesthetic.programId ? loadTeamProgram(aesthetic.programId) : null;

  // Check if user is already a member
  const userId = session?.user?.id;
  const isMember = team.members?.some((m: any) => m.userId === userId || m.user?.id === userId);
  const isTrainer = team.trainerId === userId;
  const isFull = team.memberCount >= team.maxMembers;

  // Format visibility for display
  const formatVisibility = (visibility: string) => {
    const map: Record<string, string> = {
      'PUBLIC': 'Public',
      'PRIVATE': 'Private',
      'INVITE_ONLY': 'Invite Only'
    };
    return map[visibility] || visibility.toLowerCase().replace(/_/g, ' ');
  };

  return (
    <div className="min-h-screen bg-[#fcfaf5]">
      {/* Hero section */}
      <div className="relative overflow-hidden" style={{ backgroundColor: primary }}>
        {/* Cover image */}
        {coverImage && (
          <img
            src={coverImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary}cc 0%, ${primary}bb 50%, ${primary}99 100%)` }} />
        {/* Decorative blur circle */}
        <div className="absolute top-[-60px] right-[-60px] w-80 h-80 rounded-full bg-white/5 blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          {/* Back link */}
          <Link
            href="/teams/discover"
            className="inline-flex items-center gap-1.5 text-white/60 hover:text-white text-sm font-body mb-6 transition-colors hover:-translate-x-0.5 duration-200"
          >
            <ArrowLeft size={16} />
            Back to discovery
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            {/* Left: Team info */}
            <div className="flex-1">
              {/* Pill badges */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-display uppercase tracking-wider bg-white/15 text-white/80 px-3 py-1 rounded-full">
                  {team.type.toLowerCase().replace('_', ' ')}
                </span>
                <span className="text-[11px] font-display uppercase tracking-wider bg-white/15 text-white/80 px-3 py-1 rounded-full">
                  {formatVisibility(team.visibility)}
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                {team.name}
              </h1>

              {team.description && (
                <p className="mt-3 text-white/70 font-body text-base max-w-2xl">
                  {team.description}
                </p>
              )}

              {/* Trainer + member count */}
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <img
                    src={trainer.image || '/massimino-logo.svg'}
                    alt={trainer.name || 'Trainer'}
                    className="w-7 h-7 rounded-full border-2 border-white/30"
                  />
                  <span className="text-white/80 font-body text-sm">{trainer.name || 'Trainer'}</span>
                  {trainer.trainerVerified && (
                    <CheckCircle className="h-4 w-4 text-yellow-400" />
                  )}
                </div>
                <span className="text-white/40">|</span>
                <span className="flex items-center gap-1.5 text-white/80 font-body text-sm">
                  <Users size={14} />
                  {team.memberCount}/{team.maxMembers} members
                </span>
              </div>
            </div>

            {/* Right: Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 lg:flex-col">
              {!isTrainer && !isMember && (
                <TeamJoinButton
                  teamId={team.id}
                  teamName={team.name}
                  isLoggedIn={!!session?.user}
                  isFull={isFull}
                  visibility={team.visibility}
                  accentColor={primary}
                />
              )}
              {isMember && (
                <span className="inline-flex items-center gap-1.5 text-sm text-white/80 font-body bg-white/15 px-4 py-2 rounded-lg">
                  <CheckCircle size={14} /> You&apos;re a member
                </span>
              )}
              {isTrainer && (
                <>
                  <span className="inline-flex items-center gap-1.5 text-sm text-white/80 font-body bg-white/15 px-4 py-2 rounded-lg">
                    <CheckCircle size={14} /> You&apos;re the trainer
                  </span>
                  <TeamShareButton
                    teamId={team.id}
                    teamName={team.name}
                    accentColor={primary}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content area — floats above hero edge */}
      <div className="relative z-20 -mt-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Members', value: `${team.memberCount}/${team.maxMembers}` },
            { label: 'Type', value: String(team.type || '').toLowerCase().replace('_', ' ') },
            { label: 'Visibility', value: formatVisibility(team.visibility) },
            { label: 'Trainer', value: trainer.name || '—' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
              <p className="text-xs font-body text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="font-display text-lg font-bold capitalize" style={{ color: primary }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Spotify bar */}
        {team.spotifyPlaylistUrl && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: primary + '15' }}>
                <Music size={18} style={{ color: primary }} />
              </div>
              <div>
                <p className="font-display text-sm font-bold text-[#2b5069]">Team Playlist</p>
                <p className="font-body text-xs text-gray-400">Listen while you train</p>
              </div>
            </div>
            <a
              href={team.spotifyPlaylistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white text-xs font-display uppercase tracking-wider px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primary }}
            >
              Open Spotify
            </a>
          </div>
        )}

        {/* Social links */}
        {(social.instagramUrl || social.instagram_url || social.tiktokUrl || social.tiktok_url || social.facebookUrl || social.facebook_url || social.youtubeUrl || social.youtube_url) && (
          <div className="mb-8">
            <h3 className="font-display text-sm font-bold text-[#2b5069] uppercase tracking-wider mb-3">Social</h3>
            <div className="flex flex-wrap gap-2">
              {(social.instagramUrl || social.instagram_url) && (
                <a
                  href={(social.instagramUrl || social.instagram_url) as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-4 py-2 text-sm font-body text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Instagram
                </a>
              )}
              {(social.tiktokUrl || social.tiktok_url) && (
                <a
                  href={(social.tiktokUrl || social.tiktok_url) as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-4 py-2 text-sm font-body text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  TikTok
                </a>
              )}
              {(social.facebookUrl || social.facebook_url) && (
                <a
                  href={(social.facebookUrl || social.facebook_url) as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-4 py-2 text-sm font-body text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Facebook
                </a>
              )}
              {(social.youtubeUrl || social.youtube_url) && (
                <a
                  href={(social.youtubeUrl || social.youtube_url) as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-4 py-2 text-sm font-body text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  YouTube
                </a>
              )}
            </div>
          </div>
        )}

        {/* Media gallery */}
        {gallery.length > 0 && (
          <div className="mb-8">
            <h3 className="font-display text-sm font-bold text-[#2b5069] uppercase tracking-wider mb-3">Gallery</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {gallery.slice(0, 9).map((item, idx) => (
                <div key={idx} className="rounded-xl overflow-hidden aspect-video group cursor-pointer">
                  {item.type === 'video' ? (
                    <video src={item.url} controls className="w-full h-full object-cover" />
                  ) : (
                    <img
                      src={item.url}
                      alt="Team media"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Program Workouts */}
        {teamProgram?.training_days && teamProgram.training_days.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display text-sm font-bold text-[#2b5069] uppercase tracking-wider">
                Team Workouts
              </h3>
              <Link
                href={`/workout-log/programs/${teamProgram.program_id || aesthetic.programId || 'castellers'}`}
                className="text-xs font-body hover:underline"
                style={{ color: primary }}
              >
                View full program →
              </Link>
            </div>
            <p className="font-body text-xs text-gray-400 mb-5">
              {teamProgram.program || teamProgram.program_name} · {teamProgram.duration_weeks} weeks · {teamProgram.frequency_per_week}×/week
            </p>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {teamProgram.training_days.map((day: any) => (
                <Link
                  key={day.day}
                  href={`/workout-log/programs/${teamProgram.program_id || 'castellers'}#day-${day.day}`}
                  className="block rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer"
                >
                  {/* Accent bar */}
                  <div className="h-1.5" style={{ backgroundColor: primary }} />
                  <div className="p-4">
                    {/* Day header */}
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: primary }}
                      >
                        {day.day}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-sm font-bold text-[#2b5069] truncate">
                          {day.day_name}
                        </p>
                      </div>
                    </div>

                    {/* Focus & position */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {day.position && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-body font-medium uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${primary}15`, color: primary }}
                        >
                          <Target size={10} />
                          {day.position}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[10px] font-body text-gray-400 uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-50">
                        <Dumbbell size={10} />
                        {day.exercises?.length || 0} exercises
                      </span>
                    </div>

                    <p className="font-body text-xs text-gray-500 mb-3 line-clamp-2">
                      {day.focus}
                    </p>

                    {/* Exercise list */}
                    <div className="space-y-1.5">
                      {day.exercises?.slice(0, 5).map((ex: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-[10px] font-body text-gray-300 mt-0.5 w-3 shrink-0">
                            {ex.order || idx + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-xs text-gray-700 truncate">
                              {ex.exercise_name}
                            </p>
                            <p className="font-body text-[10px] text-gray-400">
                              {ex.sets}×{ex.reps}{ex.rest_seconds ? ` · ${ex.rest_seconds}s rest` : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                      {(day.exercises?.length || 0) > 5 && (
                        <p className="font-body text-[10px] text-gray-400 pl-5">
                          +{day.exercises.length - 5} more exercises
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Program notes */}
            {teamProgram.program_notes && (
              <div className="mt-6 pt-5 border-t border-gray-100">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {teamProgram.program_notes.frequency && (
                    <div className="flex items-start gap-2">
                      <Clock size={14} className="text-gray-400 mt-0.5 shrink-0" />
                      <p className="font-body text-xs text-gray-500">{teamProgram.program_notes.frequency}</p>
                    </div>
                  )}
                  {teamProgram.program_notes.progression && (
                    <div className="flex items-start gap-2">
                      <Target size={14} className="text-gray-400 mt-0.5 shrink-0" />
                      <p className="font-body text-xs text-gray-500">{teamProgram.program_notes.progression}</p>
                    </div>
                  )}
                  {teamProgram.program_notes.recovery && (
                    <div className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-gray-400 mt-0.5 shrink-0" />
                      <p className="font-body text-xs text-gray-500">{teamProgram.program_notes.recovery}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fallback workouts + Members — 2 column grid */}
        {(!teamProgram?.training_days || teamProgram.training_days.length === 0) && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-display text-sm font-bold text-[#2b5069] uppercase tracking-wider mb-3">Team Workouts</h3>
              <p className="font-body text-sm text-gray-500 mb-4">
                Team workouts are managed by the trainer. Members can complete team sessions from the dashboard.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-sm font-body hover:gap-2 transition-all"
                style={{ color: primary }}
              >
                Open team management <span>→</span>
              </Link>
            </div>
            <TeamMembersLogs team_id={team.id} accent_colour={primary} />
          </div>
        )}

        {/* Members log (always shown when program exists) */}
        {teamProgram?.training_days && teamProgram.training_days.length > 0 && (
          <TeamMembersLogs team_id={team.id} accent_colour={primary} />
        )}
      </div>
    </div>
  );
}
