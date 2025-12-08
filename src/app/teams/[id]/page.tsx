// src/app/teams/[id]/page.tsx
import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/core';

// Dynamic imports for client components
const TeamMembersLogs = dynamic(
  () => import('@/components/teams/team_members_logs').then(mod => mod.TeamMembersLogs),
  { ssr: false, loading: () => <div className="p-4 text-gray-500">Loading...</div> }
);

const TeamJoinButton = dynamic(
  () => import('@/components/teams/team_join_button').then(mod => mod.TeamJoinButton),
  { ssr: false, loading: () => <div className="h-10 w-24 bg-gray-200 animate-pulse rounded"></div> }
);

const TeamShareButton = dynamic(
  () => import('@/components/teams/team_share_button').then(mod => mod.TeamShareButton),
  { ssr: false, loading: () => <div className="h-10 w-24 bg-gray-200 animate-pulse rounded"></div> }
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

export default async function TeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const team = await get_team_details(id);

  if (!team) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-4">
          <Link href="/teams/discover" className="text-blue-600 underline">&larr; Back to team discovery</Link>
        </div>
        <p className="text-gray-600">Team not found.</p>
      </div>
    );
  }

  const aesthetic = team.aestheticSettings || team.aesthetic_settings || {};
  const primary = aesthetic.primaryColor || aesthetic.primary_colour || '#2563eb';
  const secondary = aesthetic.secondaryColor || aesthetic.secondary_colour || '#93c5fd';
  const background = aesthetic.backgroundColor || aesthetic.background_colour || '#ffffff';
  const social = aesthetic.socialLinks || aesthetic.social_links || {};
  const gallery: Array<{ type: string; url: string }> = aesthetic.gallery || [];
  const trainer = team.trainer || {};

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
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      <div className="w-full" style={{ background: `linear-gradient(90deg, ${secondary}22, #ffffff)` }}>
        <div className="h-1 w-full" style={{ backgroundColor: primary }} />
        <div className="max-w-5xl mx-auto p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold" style={{ color: primary }}>{team.name}</h1>
              <p className="text-gray-600 mt-1">{team.description || 'No description provided.'}</p>
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <img
                  src={trainer.image || '/massimino-logo.svg'}
                  alt={trainer.name || 'Trainer'}
                  className="w-6 h-6 rounded-full border"
                />
                <span>{trainer.name || 'Trainer'}</span>
                <span>&bull;</span>
                <span>{formatVisibility(team.visibility)}</span>
                <span>&bull;</span>
                <span>{team.memberCount}/{team.maxMembers} members</span>
              </div>
              {team.spotifyPlaylistUrl && (
                <div className="mt-3">
                  <a href={team.spotifyPlaylistUrl} target="_blank" rel="noopener noreferrer" className="text-sm underline" style={{ color: primary }}>
                    Open Spotify team playlist
                  </a>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:text-right">
              <Link href="/teams/discover" className="text-sm underline text-blue-600">&larr; Back to discovery</Link>
              {/* Join Button for non-members */}
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
                <span className="text-sm text-green-600 font-medium">You&apos;re a member</span>
              )}
              {isTrainer && (
                <div className="flex flex-col gap-2 items-end">
                  <span className="text-sm text-blue-600 font-medium">You&apos;re the trainer</span>
                  <TeamShareButton
                    teamId={team.id}
                    teamName={team.name}
                    accentColor={primary}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6">
        <div className="rounded-lg border" style={{ backgroundColor: background, borderColor: primary + '33' }}>
          <div className="p-4">
            <h2 className="text-lg font-semibold" style={{ color: primary }}>Team Overview</h2>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Members</p>
                <p className="font-medium" style={{ color: primary }}>{team.memberCount}/{team.maxMembers}</p>
              </div>
              <div>
                <p className="text-gray-500">Type</p>
                <p className="font-medium capitalize">{String(team.type || '').toLowerCase().replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-gray-500">Visibility</p>
                <p className="font-medium">{formatVisibility(team.visibility)}</p>
              </div>
              <div>
                <p className="text-gray-500">Trainer</p>
                <p className="font-medium">{trainer.name || '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Social links */}
        {(social.instagramUrl || social.instagram_url || social.tiktokUrl || social.tiktok_url || social.facebookUrl || social.facebook_url || social.youtubeUrl || social.youtube_url) && (
          <div className="mt-6 rounded-lg border p-4 bg-white" style={{ borderColor: primary + '33' }}>
            <h3 className="font-semibold" style={{ color: primary }}>Social</h3>
            <div className="flex flex-wrap gap-4 mt-2 text-sm">
              {social.instagramUrl || social.instagram_url ? (
                <a href={(social.instagramUrl || social.instagram_url) as string} target="_blank" rel="noopener noreferrer" className="underline">Instagram</a>
              ) : null}
              {social.tiktokUrl || social.tiktok_url ? (
                <a href={(social.tiktokUrl || social.tiktok_url) as string} target="_blank" rel="noopener noreferrer" className="underline">TikTok</a>
              ) : null}
              {social.facebookUrl || social.facebook_url ? (
                <a href={(social.facebookUrl || social.facebook_url) as string} target="_blank" rel="noopener noreferrer" className="underline">Facebook</a>
              ) : null}
              {social.youtubeUrl || social.youtube_url ? (
                <a href={(social.youtubeUrl || social.youtube_url) as string} target="_blank" rel="noopener noreferrer" className="underline">YouTube</a>
              ) : null}
            </div>
          </div>
        )}

        {/* Media gallery */}
        {gallery.length > 0 && (
          <div className="mt-6 rounded-lg border p-4 bg-white" style={{ borderColor: primary + '33' }}>
            <h3 className="font-semibold" style={{ color: primary }}>Team Gallery</h3>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
              {gallery.slice(0, 9).map((item, idx) => (
                <div key={idx} className="rounded-md overflow-hidden border" style={{ borderColor: primary + '22' }}>
                  {item.type === 'video' ? (
                    <video src={item.url} controls className="w-full h-40 object-cover" />
                  ) : (
                    <img src={item.url} alt="Team media" className="w-full h-40 object-cover" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Placeholder sections for future: Team Workouts and Members' Logs */}
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="rounded-lg border p-4" style={{ backgroundColor: '#ffffff', borderColor: primary + '33' }}>
            <h3 className="font-semibold" style={{ color: primary }}>Team Workouts</h3>
            <p className="text-sm text-gray-600 mt-2">Team workouts are managed by the trainer. Members can complete team sessions from the dashboard.</p>
            <div className="mt-3">
              <Link href="/dashboard" className="text-sm underline" style={{ color: primary }}>Open team management →</Link>
            </div>
          </div>
          <TeamMembersLogs team_id={team.id} accent_colour={primary} />
        </div>
      </div>
    </div>
  );
}
